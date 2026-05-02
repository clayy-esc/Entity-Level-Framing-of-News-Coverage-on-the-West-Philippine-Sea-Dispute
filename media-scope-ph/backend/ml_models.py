import torch
from transformers import (
    AutoTokenizer,
    RobertaForSequenceClassification,
    BertForSequenceClassification
)

ROBERTA_MODEL = "Unknownaut/entity-level-framing-news-roberta"
BERT_MODEL = "Unknownaut/entity-level-framing-news-bert"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Tokenizers
roberta_tokenizer = AutoTokenizer.from_pretrained(ROBERTA_MODEL)
bert_tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL)

# Models
roberta_model = RobertaForSequenceClassification.from_pretrained(ROBERTA_MODEL).to(device)
bert_model = BertForSequenceClassification.from_pretrained(BERT_MODEL).to(device)

roberta_model.eval()
bert_model.eval()

# Labels
labels = ["Legitimate", "Aggressor", "Defensive", "Neutral"]

# Model mapping
model_name_map = {
    "model1": "RoBERTa",
    "model2": "BERT"
}