from fastapi import APIRouter
from database import SessionLocal
from models import Analysis, AnalysisEntity
from schemas import BatchRequest
from ml_models import (
    roberta_model,
    bert_model,
    roberta_tokenizer,
    bert_tokenizer,
    labels,
    model_name_map
)
from sqlalchemy.exc import IntegrityError
import torch
import re

router = APIRouter()

# =========================
# 🔹 BATCH ANALYZE + SAVE
# =========================
@router.post("/analyze-batch")
def analyze_batch(data: BatchRequest):
    db = SessionLocal()

    def normalize(text):
        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s]', '', text)
        return text

    normalized_sentence = normalize(data.sentence)
    normalized_entities = sorted([normalize(e) for e in data.entities])
    normalized_model = model_name_map[data.model].lower()

    fingerprint = (
        normalized_sentence +
        "|" +
        ",".join(normalized_entities) +
        "|" +
        normalized_model
    )

    # DEBUG (optional)
    print("FINGERPRINT:", fingerprint)
    print("ENTITIES:", data.entities)
    print("SENTENCE:", repr(data.sentence))

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
            model = roberta_model
            tokenizer = roberta_tokenizer
        else:
            model = bert_model
            tokenizer = bert_tokenizer

        inputs = tokenizer(
            data.sentence,
            entity,
            return_tensors="pt",
            truncation=True,
            max_length=160
        ).to(next(model.parameters()).device)

        with torch.no_grad():
            outputs = model(**inputs)
            pred = torch.argmax(outputs.logits, dim=1).item()

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
    db.close()

    return {
        "analysis_id": analysis.id,
        "results": results
    }


# =========================
# 🔹 GET ANALYSES
# =========================
@router.get("/analyses")
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
@router.get("/analysis-page/{analysis_id}")
def get_analysis_page(analysis_id: int):
    db = SessionLocal()

    newer_count = db.query(Analysis).filter(
        Analysis.created_at > db.query(Analysis.created_at)
        .filter(Analysis.id == analysis_id)
        .scalar_subquery()
    ).count()

    limit = 5
    page = (newer_count // limit) + 1

    db.close()

    return {"page": page}