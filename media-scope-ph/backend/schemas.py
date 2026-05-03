from pydantic import BaseModel, Field, field_validator
from typing import List, Literal

ModelType = Literal["model1", "model2"]


class Input(BaseModel):
    sentence: str = Field(..., min_length=1, max_length=1000)
    entity_text: str = Field(..., min_length=1, max_length=200)
    model: ModelType

    @field_validator("sentence", "entity_text")
    @classmethod
    def no_empty_strings(cls, v: str):
        if not v.strip():
            raise ValueError("Field cannot be empty or whitespace")
        return v


class BatchRequest(BaseModel):
    sentence: str = Field(..., min_length=1, max_length=1000)
    entities: List[str] = Field(..., min_length=1, max_length=5)  # 🔥 added limit
    model: ModelType

    @field_validator("sentence")
    @classmethod
    def validate_sentence(cls, v: str):
        v = v.strip()
        if not v:
            raise ValueError("Sentence cannot be empty")
        return v

    @field_validator("entities")
    @classmethod
    def validate_entities(cls, v: List[str]):
        cleaned = []
        for entity in v:
            entity = entity.strip()

            if not entity:
                raise ValueError("Entity cannot be empty")

            if len(entity) > 200:
                raise ValueError("Entity too long (max 200 chars)")

            cleaned.append(entity)

        return cleaned