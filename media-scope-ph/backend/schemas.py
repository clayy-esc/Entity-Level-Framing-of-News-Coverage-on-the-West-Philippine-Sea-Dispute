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
    entities: List[str] = Field(..., min_length=1)
    model: ModelType

    @field_validator("sentence")
    @classmethod
    def validate_sentence(cls, v: str):
        if not v.strip():
            raise ValueError("Sentence cannot be empty")
        return v

    @field_validator("entities")
    @classmethod
    def validate_entities(cls, v: List[str]):
        if len(v) == 0:
            raise ValueError("Entities list cannot be empty")

        for entity in v:
            if not entity.strip():
                raise ValueError("Entity cannot be empty")

            if len(entity) > 200:
                raise ValueError("Entity too long (max 200 chars)")

        return v