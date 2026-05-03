import torch
import psutil
import os
import gc
from transformers import (
    AutoTokenizer,
    RobertaForSequenceClassification,
    BertForSequenceClassification
)

torch.set_grad_enabled(False)

# 🔍 MEMORY DEBUG
process = psutil.Process(os.getpid())

def print_memory(tag=""):
    mem = process.memory_info().rss / (1024 ** 2)
    print(f"[MEMORY] {tag}: {mem:.2f} MB")


ROBERTA_MODEL = "Unknownaut/entity-level-framing-news-roberta"
BERT_MODEL = "Unknownaut/entity-level-framing-news-bert"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

labels = ["Legitimate", "Aggressor", "Defensive", "Neutral"]

model_name_map = {
    "model1": "RoBERTa",
    "model2": "BERT"
}

# 🔥 SINGLE ACTIVE MODEL
_current_model = None
_current_tokenizer = None
_current_model_name = None


def unload_model():
    global _current_model, _current_tokenizer

    if _current_model is not None:
        print("🧹 Unloading previous model...")

        del _current_model
        del _current_tokenizer

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        print_memory("after unload")

        _current_model = None
        _current_tokenizer = None


def load_model(model_key):
    global _current_model, _current_tokenizer, _current_model_name

    # ✅ reuse if same model
    if _current_model_name == model_key:
        print(f"♻️ Reusing {_current_model_name}")
        return _current_model, _current_tokenizer

    # 🔥 unload previous model FIRST
    unload_model()

    print_memory("before loading new model")

    # 🔽 Load selected model
    if model_key == "model1":
        print("🔄 Loading RoBERTa...")
        _current_tokenizer = AutoTokenizer.from_pretrained(ROBERTA_MODEL)
        _current_model = RobertaForSequenceClassification.from_pretrained(ROBERTA_MODEL).to(device)

    elif model_key == "model2":
        print("🔄 Loading BERT...")
        _current_tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL)
        _current_model = BertForSequenceClassification.from_pretrained(BERT_MODEL).to(device)

    else:
        raise ValueError("Invalid model key")

    _current_model.eval()
    _current_model_name = model_key

    print_memory("after loading model")

    return _current_model, _current_tokenizer