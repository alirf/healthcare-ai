import torch.nn as nn
from transformers import BertModel

MODEL_NAME = "HooshvareLab/bert-fa-base-uncased"


class EvidenceClassifier(nn.Module):
    def __init__(self, n_classes, model_name=MODEL_NAME, dropout=0.3):
        super().__init__()
        self.bert = BertModel.from_pretrained(model_name)
        self.dropout = nn.Dropout(dropout)
        self.classifier = nn.Linear(self.bert.config.hidden_size, n_classes)

    def forward(self, input_ids, attention_mask):
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        pooled = self.dropout(outputs.pooler_output)
        return self.classifier(pooled)
