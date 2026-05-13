"""

This module defines the SQLAlchemy ORM models used
for storing entity-level framing analyses and their
associated entity predictions.

The database schema supports:
- storage of user-submitted analyses
- entity-level framing outputs
- duplicate analysis detection
- timestamp tracking
- relationship management

Database Structure:
- Analysis
    Stores the main analysis request metadata.

- AnalysisEntity
    Stores entity-level framing predictions
    associated with a specific analysis.

The schema is designed for PostgreSQL deployment
and supports the Community Analyses feature of
the MediaScope PH system.

"""

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Analysis(Base):
    """
    Stores a complete entity-level framing analysis request.

    Each record represents a user-submitted sentence
    analyzed using a selected transformer model.

    Attributes:
        id (int):
            Unique analysis identifier.

        sentence (str):
            Original sentence submitted for analysis.

        model (str):
            Selected transformer model used for inference
            (e.g., RoBERTa or BERT).

        fingerprint (str):
            Normalized unique identifier used to detect
            duplicate analysis requests.

        created_at (timestamp):
            Timestamp indicating when the analysis
            was created.

        entities (relationship):
            One-to-many relationship linking the analysis
            to its entity-level framing predictions.
    """

    __tablename__ = "analyses"

    # Primary key for analysis records
    id = Column(Integer, primary_key=True, index=True)

    # Original sentence submitted by the user
    sentence = Column(Text, nullable=False)

    # Transformer model used during inference
    model = Column(String(50), nullable=False)

    # Unique fingerprint used for duplicate detection.
    # Generated from normalized sentence, entities,
    # and selected model.
    fingerprint = Column(String(255), unique=True, index=True, nullable=False)

    # Automatically generated timestamp for
    # analysis creation.
    created_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now(),
        index=True
    )

    # One-to-many relationship between analyses
    # and entity-level predictions.
    #
    # Cascade deletion ensures that all related
    # entity records are automatically removed
    # when an analysis is deleted.
    entities = relationship(
        "AnalysisEntity",
        back_populates="analysis",
        cascade="all, delete-orphan"
    )

class AnalysisEntity(Base):
    """
    Stores entity-level framing predictions.

    Each record represents the contextual framing
    classification of a specific entity within
    an analyzed sentence.

    Attributes:
        id (int):
            Unique entity prediction identifier.

        analysis_id (int):
            Foreign key linking the prediction
            to its parent analysis.

        entity_text (str):
            Selected entity analyzed within the sentence.

        framing_label (str):
            Predicted contextual framing category.

        analysis (relationship):
            Relationship back to the parent analysis.
    """

    __tablename__ = "analysis_entities"

    # Primary key for entity prediction records
    id = Column(Integer, primary_key=True, index=True)

    # Foreign key linking entity predictions
    # to their corresponding analysis request.
    analysis_id = Column(
        Integer,
        ForeignKey("analyses.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    # Entity selected for contextual framing analysis
    entity_text = Column(Text, nullable=False)

    # Predicted framing category generated
    # by the transformer model.
    # Possible labels:
    # - Legitimate
    # - Aggressor
    # - Defensive
    # - Neutral
    framing_label = Column(String(50), nullable=False)

    # Many-to-one relationship linking
    # entity predictions back to their parent analysis.
    analysis = relationship("Analysis", back_populates="entities")