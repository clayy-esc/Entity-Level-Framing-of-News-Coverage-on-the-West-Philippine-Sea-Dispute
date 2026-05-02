import torch
from transformers import (
    AutoTokenizer,
    RobertaForSequenceClassification,
    BertForSequenceClassification
)

ROBERTA_MODEL = "Unknownaut/entity-level-framing-news-roberta"
BERT_MODEL = "Unknownaut/entity-level-framing-news-bert"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Labels
labels = ["Legitimate", "Aggressor", "Defensive", "Neutral"]

# Model mapping
model_name_map = {
    "model1": "RoBERTa",
    "model2": "BERT"
}

# 🔥 Lazy-loaded globals
_roberta = None
_bert = None
_roberta_tokenizer = None
_bert_tokenizer = None


def get_roberta():
    global _roberta, _roberta_tokenizer

    if _roberta is None:
        print("🔄 Loading RoBERTa model...")
        _roberta_tokenizer = AutoTokenizer.from_pretrained(ROBERTA_MODEL)
        _roberta = RobertaForSequenceClassification.from_pretrained(ROBERTA_MODEL).to(device)
        _roberta.eval()

    return _roberta, _roberta_tokenizer


def get_bert():
    global _bert, _bert_tokenizer

    if _bert is None:
        print("🔄 Loading BERT model...")
        _bert_tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL)
        _bert = BertForSequenceClassification.from_pretrained(BERT_MODEL).to(device)
        _bert.eval()

    return _bert, _bert_tokenizer