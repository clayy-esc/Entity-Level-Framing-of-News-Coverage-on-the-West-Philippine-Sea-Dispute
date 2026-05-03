from fastapi import APIRouter, HTTPException
import torch
from schemas import Input
from ml_models import load_model, labels, model_name_map

router = APIRouter()

@router.post("/analyze")
def analyze(input: Input):

    try:
        # ✅ SAFE MODEL SWITCHING
        model, tokenizer = load_model(input.model)

        # 🔥 memory cleanup (important)
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid model selected")

    try:
        inputs = tokenizer(
            input.sentence,
            input.entity_text,
            return_tensors="pt",
            truncation=True,
            max_length=160
        ).to(next(model.parameters()).device)

        with torch.inference_mode():
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