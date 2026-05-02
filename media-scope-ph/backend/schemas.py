from pydantic import BaseModel
from typing import List

class Input(BaseModel):
    sentence: str
    entity_text: str
    model: str


class BatchRequest(BaseModel):
    sentence: str
    entities: List[str]
    model: str