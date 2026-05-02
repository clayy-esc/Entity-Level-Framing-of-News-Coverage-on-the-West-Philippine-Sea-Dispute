from fastapi import APIRouter, HTTPException
import torch
from schemas import Input
from ml_models import (
    get_roberta,
    get_bert,
    labels,
    model_name_map
)

router = APIRouter()

@router.post("/analyze")
def analyze(input: Input):

    # 🔥 Lazy model selection
    if input.model == "model1":
        model, tokenizer = get_roberta()
    elif input.model == "model2":
        model, tokenizer = get_bert()
    else:
        raise HTTPException(status_code=400, detail="Invalid model selected")
    try:
        inputs = tokenizer(
            input.sentence,
            input.entity_text,
            return_tensors="pt",
            truncation=True,
            max_length=160
        ).to(next(model.parameters()).device)

        with torch.no_grad():
            outputs = model(**inputs)
            pred = torch.argmax(outputs.logits, dim=1).item()

        return {
            "sentence": input.sentence,
            "entity_text": input.entity_text,
            "framing_label": labels[pred],
            "model": model_name_map[input.model]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))