from fastapi import APIRouter, HTTPException
import requests
from schemas import Input

router = APIRouter()

# ✅ Correct FastAPI endpoint
HF_URL = "https://unknownaut-entity-framing-api.hf.space/predict"

# ✅ Model mapping
model_map = {
    "model1": "RoBERTa",
    "model2": "BERT"
}


@router.post("/analyze")
def analyze(input: Input):

    try:
        mapped_model = model_map.get(input.model)

        if not mapped_model:
            raise HTTPException(status_code=400, detail="Invalid model")

        response = requests.post(
            HF_URL,
            json={
                "sentence": input.sentence,
                "entity": input.entity_text,
                "model": mapped_model
            },
            timeout=10
        )

        print("HF STATUS:", response.status_code)
        print("HF RESPONSE:", response.text)

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail=response.text)

        result = response.json()

        return {
            "sentence": input.sentence,
            "entity_text": input.entity_text,
            "framing_label": result["label"],  # ✅ FIXED
            "model": mapped_model
        }

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Model service timeout")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))