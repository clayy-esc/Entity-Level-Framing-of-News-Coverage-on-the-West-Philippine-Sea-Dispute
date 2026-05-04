from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import requests
import re

from database import get_db
from models import Analysis, AnalysisEntity
from schemas import BatchRequest

router = APIRouter()

HF_URL = "https://unknownaut-entity-framing-api.hf.space/predict"

model_map = {
    "model1": "RoBERTa",
    "model2": "BERT"
}


@router.post("/analyze-batch")
def analyze_batch(data: BatchRequest, db: Session = Depends(get_db)):

    # ✅ Limit entities
    if len(data.entities) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum of 5 entities allowed per request"
        )

    # 🔥 Map model FIRST (FIXED)
    mapped_model = model_map.get(data.model)
    if not mapped_model:
        raise HTTPException(status_code=400, detail="Invalid model selected")

    # 🔍 Normalize for fingerprint
    def normalize(text: str) -> str:
        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s]', '', text)
        return text

    normalized_sentence = normalize(data.sentence)
    normalized_entities = sorted([normalize(e) for e in data.entities])

    # ✅ Use mapped_model (FIXED)
    fingerprint = (
        normalized_sentence +
        "|" +
        ",".join(normalized_entities) +
        "|" +
        mapped_model.lower()
    )

    # 🔍 Check duplicate
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
            "message": "duplicate"
        }

    # 🆕 Create new analysis (FIXED)
    analysis = Analysis(
        sentence=data.sentence,
        model=mapped_model,
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
            "message": "duplicate"
        }

    # 🔥 CALL HF API
    results = []

    try:
        for entity in data.entities:
            response = requests.post(
                HF_URL,
                json={
                    "sentence": data.sentence,
                    "entity": entity,
                    "model": mapped_model
                },
                timeout=10
            )

            print("HF STATUS:", response.status_code)
            print("HF RESPONSE:", response.text)

            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=response.text)

            label = response.json()["label"]

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

    except requests.exceptions.Timeout:
        db.rollback()
        raise HTTPException(status_code=504, detail="Model service timeout")

    except Exception as e:
        db.rollback()
        print("🔥 ERROR:", str(e))
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