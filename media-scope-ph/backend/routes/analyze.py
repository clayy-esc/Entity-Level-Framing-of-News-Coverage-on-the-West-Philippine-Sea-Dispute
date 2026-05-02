from fastapi import APIRouter
import torch
from schemas import Input
from ml_models import (
    roberta_model,
    bert_model,
    roberta_tokenizer,
    bert_tokenizer,
    labels,
    model_name_map
)

router = APIRouter()

@router.post("/analyze")
def analyze(input: Input):

    if input.model == "model1":
        model = roberta_model
        tokenizer = roberta_tokenizer
    elif input.model == "model2":
        model = bert_model
        tokenizer = bert_tokenizer
    else:
        return {"error": "Invalid model selected"}

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