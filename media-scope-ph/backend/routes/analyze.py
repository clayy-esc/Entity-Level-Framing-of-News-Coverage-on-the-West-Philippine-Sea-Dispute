from fastapi import APIRouter, HTTPException
import requests
from schemas import Input

router = APIRouter()

HF_URL = "https://unknownaut-entity-framing-api.hf.space/run/predict"


@router.post("/analyze")
def analyze(input: Input):

    try:
        response = requests.post(
            HF_URL,
            json={
                "data": [
                    input.sentence,
                    input.entity_text,
                    input.model  # model1 / model2
                ]
            },
            timeout=10
        )

        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Model service failed")

        result = response.json()

        return {
            "sentence": input.sentence,
            "entity_text": input.entity_text,
            "framing_label": result["data"][0],
            "model": input.model
        }

    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Model service timeout")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))