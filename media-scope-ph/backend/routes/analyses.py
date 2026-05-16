"""

This module defines the API endpoints responsible for
entity-level framing analysis and retrieval of stored analyses.

The routes support:
- Real-time entity-level framing prediction
- Batch entity analysis
- Duplicate request detection
- Pagination of previous analyses
- Analysis page navigation support

The system integrates with a HuggingFace-hosted transformer
inference API for contextual framing classification using
RoBERTa and BERT models.

"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
import requests
import re
from collections import defaultdict

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

    """
    Perform entity-level framing analysis for multiple entities
    within a single sentence.

    This endpoint:
    1. Validates user input
    2. Prevents duplicate analyses using fingerprint matching
    3. Sends entity-conditioned requests to the HuggingFace API
    4. Stores analysis results in the database
    5. Returns predicted framing labels

    Args:
        data (BatchRequest):
            Request payload containing:
            - sentence
            - entities
            - selected model

        db (Session):
            Active SQLAlchemy database session.

    Returns:
        dict:
            JSON response containing:
            - analysis_id
            - framing results
            - duplicate status (if applicable)

    Raises:
        HTTPException:
            - 400 for invalid requests
            - 500 for inference/server errors
            - 504 for timeout errors
    """

    # Limit the number of entities per request
    # to reduce inference load and prevent abuse.
    if len(data.entities) > 5:
        raise HTTPException(
            status_code=400,
            detail="Maximum of 5 entities allowed per request"
        )

    # Convert frontend model identifier into
    # the deployed HuggingFace model name.
    mapped_model = model_map.get(data.model)
    if not mapped_model:
        raise HTTPException(status_code=400, detail="Invalid model selected")

    def normalize(text: str) -> str:
        """
        Normalize text for duplicate fingerprint generation.

        The normalization process:
        - converts text to lowercase
        - removes extra whitespace
        - removes punctuation

        Args:
            text (str): Raw text input.

        Returns:
            str: Normalized text.
        """

        text = text.lower().strip()
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s]', '', text)
        return text

    # Normalize sentence and entities to ensure
    # consistent duplicate detection.
    normalized_sentence = normalize(data.sentence)
    normalized_entities = sorted([normalize(e) for e in data.entities])

     # Generate unique fingerprint for duplicate checking.
    fingerprint = (
        normalized_sentence +
        "|" +
        ",".join(normalized_entities) +
        "|" +
        mapped_model.lower()
    )

    # Check whether the same analysis already exists.
    existing = db.query(Analysis).filter(
        Analysis.fingerprint == fingerprint
    ).first()

    # Return existing analysis instead of recomputing.
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

    # Create new analysis record.
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
        """
        Handles race-condition duplicates where another request
        inserts the same fingerprint before commit completes.
        """

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

    # Store prediction results
    results = []

    try:
        # Perform framing prediction for each selected entity.
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

            # Validate inference API response.
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail=response.text)

             # Extract predicted framing label.
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
        """
        Handles timeout failures from the external
        HuggingFace inference service.
        """

        db.rollback()
        raise HTTPException(status_code=504, detail="Model service timeout")

    except Exception as e:
        """
        Handles unexpected backend or inference errors.
        """

        db.rollback()
        print("🔥 ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "analysis_id": analysis.id,
        "results": results
    }

@router.post("/analyze-article")
def analyze_article(payload: dict):

    """
    Perform article-level entity framing analysis.

    Workflow:
    1. Split article into sentences
    2. Loop through selected entities
    3. Run framing analysis per sentence
    4. Aggregate framing labels
    5. Return article-level summary
    """

    article = payload.get("article", "").strip()
    entities = payload.get("entities", [])
    model = payload.get("model", "model1")

    if not article:
        raise HTTPException(
            status_code=400,
            detail="Article is required"
        )

    if not entities:
        raise HTTPException(
            status_code=400,
            detail="At least one entity is required"
        )

    mapped_model = model_map.get(model)

    if not mapped_model:
        raise HTTPException(
            status_code=400,
            detail="Invalid model selected"
        )

    # =========================
    # SPLIT ARTICLE INTO SENTENCES
    # =========================

    sentences = re.split(
        r'(?<=[.!?])\s+',
        article
    )

    # =========================
    # STORE RESULTS
    # =========================

    sentence_results = []

    entity_summary = defaultdict(
        lambda: {
            "Aggressor": 0,
            "Defensive": 0,
            "Legitimate": 0,
            "Neutral": 0
        }
    )

    # =========================
    # PROCESS EACH SENTENCE
    # =========================

    for sentence in sentences:

        sentence = sentence.strip()

        if not sentence:
            continue

        sentence_entities = []
        seen_entities = set()

        # track matched entity spans
        matched_spans = []

        # =========================
        # LOOP THROUGH ENTITIES
        # =========================

        for entity_text in entities:

            match_index = sentence.find(entity_text)

            if match_index == -1:
                continue

            match_end = match_index + len(entity_text)

            # prevent nested duplicate entities
            overlapping = any(
                match_index >= start and match_end <= end
                for start, end in matched_spans
            )

            if overlapping:
                continue

            matched_spans.append((match_index, match_end))

            try:

                response = requests.post(
                    HF_URL,
                    json={
                        "sentence": sentence,
                        "entity": entity_text,
                        "model": mapped_model
                    },
                    timeout=20
                )

                if response.status_code != 200:
                    continue

                label = response.json()["label"]

                normalized_entity = re.sub(
                    r'[.,!?;:]+$',
                    '',
                    entity_text.strip()
                )

                # remove duplicate spaces
                normalized_entity = re.sub(
                    r'\s+',
                    ' ',
                    normalized_entity
                )

                key = (
                    normalized_entity.lower(),
                    label.lower()
                )

                # prevent duplicates inside same sentence
                if key in seen_entities:
                    continue

                seen_entities.add(key)

                sentence_entities.append({
                    "entity_text": normalized_entity,
                    "framing_label": label
                })

                # =========================
                # UPDATE SUMMARY COUNTS
                # =========================

                entity_summary[normalized_entity][label] += 1

            except Exception:
                continue

        # Save sentence-level results
        sentence_results.append({
            "sentence": sentence,
            "entities": sentence_entities
        })

    # =========================
    # COMPUTE FINAL SUMMARY
    # =========================

    final_summary = []

    for entity, counts in entity_summary.items():

        final_summary.append({
            "entity": entity,
            "Aggressor": counts["Aggressor"],
            "Defensive": counts["Defensive"],
            "Legitimate": counts["Legitimate"],
            "Neutral": counts["Neutral"]
        })

    return {
        "sentence_results": sentence_results,
        "entity_summary": final_summary
    }
    
@router.get("/analyses")
def get_analyses(page: int = 1, limit: int = 5, db: Session = Depends(get_db)):
    """
    Retrieve paginated entity-level analyses.

    Results are ordered by newest first and include:
    - sentence
    - selected model
    - entity-level framing outputs
    - timestamps

    Args:
        page (int):
            Current pagination page.

        limit (int):
            Number of analyses per page.

        db (Session):
            Active database session.

    Returns:
        dict:
            Paginated analysis records.
    """

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
    """
    Determine the pagination page containing
    a specific analysis record.

    This endpoint supports frontend navigation
    by calculating which paginated page contains
    the requested analysis.

    Args:
        analysis_id (int):
            Target analysis identifier.

        db (Session):
            Active database session.

    Returns:
        dict:
            Pagination page number.
    """

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