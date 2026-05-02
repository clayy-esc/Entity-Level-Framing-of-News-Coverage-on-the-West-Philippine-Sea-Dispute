from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import torch
import re

from database import get_db
from models import Analysis, AnalysisEntity
from schemas import BatchRequest
from ml_models import get_roberta, get_bert, labels, model_name_map

router = APIRouter()


@router.post("/analyze-batch")
def analyze_batch(data: BatchRequest, db: Session = Depends(get_db)):

    def normalize(text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s]', '', text)
        return text

    normalized_sentence = normalize(data.sentence)
    normalized_entities = sorted([normalize(e) for e in data.entities])
    normalized_model = model_name_map.get(data.model, "").lower()

    if not normalized_model:
        raise HTTPException(status_code=400, detail="Invalid model selected")

    fingerprint = (
        normalized_sentence +
        "|" +
        ",".join(normalized_entities) +
        "|" +
        normalized_model
    )

    existing = db.query(Analysis).filter(
        Analysis.fingerprint == fingerprint
    ).first()

    if existing:
        return {
            "analysis_id": existing.id,
            "results": [
                {
                    "entity_text": e.entity_text,
                    "framing_label": e.framing_label
                }
                for e in existing.entities
            ],
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

        return {
            "analysis_id": existing.id,
            "results": [
                {
                    "entity_text": e.entity_text,
                    "framing_label": e.framing_label
                }
                for e in existing.entities
            ],
            "message": "Duplicate prevented (DB constraint)"
        }

    if data.model == "model1":
        model, tokenizer = get_roberta()
    elif data.model == "model2":
        model, tokenizer = get_bert()
    else:
        raise HTTPException(status_code=400, detail="Invalid model selected")

    results = []

    try:
        for entity in data.entities:
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

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "analysis_id": analysis.id,
        "results": results
    }


@router.get("/analyses")
def get_analyses(page: int = 1, limit: int = 5, db: Session = Depends(get_db)):

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

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": result
    }


@router.get("/analysis-page/{analysis_id}")
def get_analysis_page(analysis_id: int, db: Session = Depends(get_db)):

    created_at_subquery = (
        db.query(Analysis.created_at)
        .filter(Analysis.id == analysis_id)
        .scalar_subquery()
    )

    newer_count = db.query(Analysis).filter(
        Analysis.created_at > created_at_subquery
    ).count()

    limit = 5
    page = (newer_count // limit) + 1

    return {"page": page}