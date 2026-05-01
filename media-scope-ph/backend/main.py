# =========================
# 🔹 IMPORTS
# =========================

from fastapi import FastAPI
from pydantic import BaseModel
from transformers import (
    AutoTokenizer,
    RobertaForSequenceClassification,
    BertForSequenceClassification
)
import torch
from fastapi.middleware.cors import CORSMiddleware

# =========================
# 🔹 MODEL CONFIG (HF)
# =========================
ROBERTA_MODEL = "Unknownaut/entity-level-framing-news-roberta"
BERT_MODEL = "Unknownaut/entity-level-framing-news-bert"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ✅ DB imports
from sqlalchemy import create_engine, Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.exc import IntegrityError
from datetime import datetime
from typing import List
import re

# ✅ ADD THESE TWO
import os
from dotenv import load_dotenv

# ✅ LOAD ENV FILE
load_dotenv()

# =========================
# 🔹 APP INIT
# =========================
app = FastAPI()

# =========================
# 🔹 DATABASE CONFIG
# =========================
DATABASE_URL = os.getenv("DATABASE_URL")

# ✅ SAFETY CHECK
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Check your .env file")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

# =========================
# 🔹 DATABASE MODELS
# =========================
class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    sentence = Column(Text)
    model = Column(String)
    fingerprint = Column(String, unique=True, index=True)  # ✅ ADD THIS
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    entities = relationship("AnalysisEntity", back_populates="analysis")


class AnalysisEntity(Base):
    __tablename__ = "analysis_entities"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"))
    entity_text = Column(Text)
    framing_label = Column(String)

    analysis = relationship("Analysis", back_populates="entities")


# =========================
# 🔹 CORS (for React)
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# 🔹 TOKENIZERS (HF)
# =========================
roberta_tokenizer = AutoTokenizer.from_pretrained(ROBERTA_MODEL)

bert_tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL)

# =========================
# 🔹 MODELS (HF)
# =========================
roberta_model = RobertaForSequenceClassification.from_pretrained(ROBERTA_MODEL).to(device)

bert_model = BertForSequenceClassification.from_pretrained(BERT_MODEL).to(device)

roberta_model.eval()
bert_model.eval()

# =========================
# 🔹 LABELS
# =========================
labels = ["Legitimate", "Aggressor", "Defensive", "Neutral"]

# =========================
# 🔹 MODEL NAME MAP
# =========================
model_name_map = {
    "model1": "RoBERTa",
    "model2": "BERT"
}

# =========================
# 🔹 REQUEST SCHEMAS
# =========================
class Input(BaseModel):
    sentence: str
    entity_text: str
    model: str


class BatchRequest(BaseModel):
    sentence: str
    entities: List[str]
    model: str


# =========================
# 🔹 SINGLE ANALYZE (KEEP)
# =========================
@app.post("/analyze")
def analyze(input: Input):

    if input.model == "model1":
        selected_model = roberta_model
        tokenizer = roberta_tokenizer
    elif input.model == "model2":
        selected_model = bert_model
        tokenizer = bert_tokenizer
    else:
        return {"error": "Invalid model selected"}

    inputs = tokenizer(
        input.sentence,
        input.entity_text,
        return_tensors="pt",
        truncation=True,
        max_length=160
    ).to(device)

    with torch.no_grad():
        outputs = selected_model(**inputs)
        logits = outputs.logits
        pred = torch.argmax(logits, dim=1).item()

    return {
        "sentence": input.sentence,
        "entity_text": input.entity_text,
        "framing_label": labels[pred],
        "model": model_name_map[input.model]
    }


# =========================
# 🔹 BATCH ANALYZE + SAVE
# =========================
@app.post("/analyze-batch")
def analyze_batch(data: BatchRequest):
    db = SessionLocal()

    def normalize(text):
        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)       # normalize spaces
        text = re.sub(r'[^\w\s]', '', text)    # remove punctuation
        return text

    # ✅ APPLY NORMALIZATION
    normalized_sentence = normalize(data.sentence)

    normalized_entities = sorted([
        normalize(e) for e in data.entities
    ])

    normalized_model = model_name_map[data.model].lower()

    # ✅ FINAL FINGERPRINT
    fingerprint = (
        normalized_sentence +
        "|" +
        ",".join(normalized_entities) +
        "|" +
        normalized_model
    )

    # 🔍 DEBUG
    print("FINGERPRINT:", fingerprint)
    print("ENTITIES:", data.entities)
    print("SENTENCE:", repr(data.sentence))

    # 🔹 CHECK DUPLICATE USING FINGERPRINT
    existing = db.query(Analysis).filter(
        Analysis.fingerprint == fingerprint
    ).first()

    if existing:
        result = [
            {
                "entity_text": e.entity_text,
                "framing_label": e.framing_label
            }
            for e in existing.entities
        ]

        db.close()

        return {
            "analysis_id": existing.id,
            "results": result,
            "message": "Duplicate analysis"
        }

    # 🔹 CREATE NEW ANALYSIS (WITH DB-LEVEL DEDUP SAFETY)
    analysis = Analysis(
        sentence=data.sentence,
        model=model_name_map[data.model],
        fingerprint=fingerprint
    )

    try:
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

    except IntegrityError:
        db.rollback()

        existing = db.query(Analysis).filter(
            Analysis.fingerprint == fingerprint
        ).first()

        result = [
            {
                "entity_text": e.entity_text,
                "framing_label": e.framing_label
            }
            for e in existing.entities
        ]

        db.close()

        return {
            "analysis_id": existing.id,
            "results": result,
            "message": "Duplicate prevented (DB constraint)"
        }

    results = []

    for entity in data.entities:

        if data.model == "model1":
            selected_model = roberta_model
            tokenizer = roberta_tokenizer
        else:
            selected_model = bert_model
            tokenizer = bert_tokenizer

        inputs = tokenizer(
            data.sentence,
            entity,
            return_tensors="pt",
            truncation=True,
            max_length=160
        ).to(device)

        with torch.no_grad():
            outputs = selected_model(**inputs)
            logits = outputs.logits
            pred = torch.argmax(logits, dim=1).item()

        label = labels[pred]

        db.add(AnalysisEntity(
            analysis_id=analysis.id,
            entity_text=entity,
            framing_label=label
        ))

        results.append({
            "entity_text": entity,
            "framing_label": label
        })

    db.commit()

    analysis_id = analysis.id

    db.close()

    return {
        "analysis_id": analysis.id,
        "results": results
    }


# =========================
# 🔹 GET ANALYSES (PAGINATION)
# =========================
@app.get("/analyses")
def get_analyses(page: int = 1, limit: int = 5):
    db = SessionLocal()

    total = db.query(Analysis).count()

    analyses = (
        db.query(Analysis)
        .order_by(Analysis.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    result = []

    for a in analyses:
        result.append({
            "id": a.id,
            "sentence": a.sentence,
            "model": a.model,
            "created_at": a.created_at,
            "entities": [
                {
                    "entity_text": e.entity_text,
                    "framing_label": e.framing_label
                }
                for e in a.entities
            ]
        })

    db.close()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": result
    }
    
# =========================
# 🔹 GET PAGE OF ANALYSIS
# =========================
@app.get("/analysis-page/{analysis_id}")
def get_analysis_page(analysis_id: int):
    db = SessionLocal()

    # count how many newer analyses exist
    newer_count = db.query(Analysis).filter(
        Analysis.created_at > db.query(Analysis.created_at)
        .filter(Analysis.id == analysis_id)
        .scalar_subquery()
    ).count()

    limit = 5  # ⚠️ must match frontend

    page = (newer_count // limit) + 1

    db.close()

    return {"page": page}