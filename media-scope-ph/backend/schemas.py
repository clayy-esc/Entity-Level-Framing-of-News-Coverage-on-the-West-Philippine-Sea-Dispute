"""

This module defines the Pydantic request schemas
used for validating incoming API data related to
entity-level framing analysis.

The validation layer ensures:
- proper request formatting
- sentence integrity
- entity constraints
- valid model selection
- prevention of malformed inputs

The schemas support the backend analysis routes
used by the MediaScope PH system.

"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Literal

# Allowed frontend model identifiers.
# These values are mapped internally to the
# deployed HuggingFace transformer models.

ModelType = Literal["model1", "model2"]

class EntitySpan(BaseModel):
    text: str
    start: int
    end: int


class BatchRequest(BaseModel):
    """
    Request schema for batch entity-level framing analysis.

    This schema validates user-submitted analysis requests
    before processing by the backend inference pipeline.

    Attributes:
        sentence (str):
            Input sentence containing contextual discourse.

        entities (List[str]):
            List of target entities selected for framing analysis.

        model (ModelType):
            Selected transformer model identifier.
    """
    # Sentence submitted for entity-level analysis.
    # Constraints:
    # - minimum length: 1
    # - maximum length: 1000
    sentence: str = Field(..., min_length=1, max_length=1000)

    # List of selected entities for analysis.
    # Constraints:
    # - minimum entities: 1
    # - maximum entities: 5
    # The limit helps control inference load
    # and prevents excessive API requests.
    entities: List[EntitySpan] = Field(
    ...,
    min_length=1,
    max_length=10
)

    # Selected transformer model identifier.
    # Accepted values:
    # - model1 -> RoBERTa
    # - model2 -> BERT
    model: ModelType

    @field_validator("sentence")
    @classmethod
    def validate_sentence(cls, v: str):
        """
        Validate and normalize the input sentence.

        The validator:
        - removes surrounding whitespace
        - prevents empty submissions

        Args:
            v (str):
                Raw sentence input.

        Returns:
            str:
                Cleaned sentence.

        Raises:
            ValueError:
                If the sentence is empty.
        """

        v = v.strip()
        if not v:
            raise ValueError("Sentence cannot be empty")
        return v

    @field_validator("entities")
    @classmethod
    def validate_entities(cls, v: List[EntitySpan]):
        """
        Validate and normalize entity selections.

        The validator ensures:
        - entities are not empty
        - entities do not exceed length limits
        - surrounding whitespace is removed

        Args:
            v (List[str]):
                List of submitted entities.

        Returns:
            List[str]:
                Cleaned entity list.

        Raises:
            ValueError:
                If an entity is empty or exceeds
                the allowed length.
        """

        cleaned = []
        for entity in v:

            entity.text = entity.text.strip()

            if not entity.text:
                raise ValueError("Entity cannot be empty")

            if len(entity.text) > 200:
                raise ValueError("Entity too long (max 200 chars)")

            cleaned.append(entity)

        return cleaned