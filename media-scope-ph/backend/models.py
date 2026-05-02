from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    sentence = Column(Text, nullable=False)
    model = Column(String(50), nullable=False)
    fingerprint = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    entities = relationship(
        "AnalysisEntity",
        back_populates="analysis",
        cascade="all, delete-orphan"
    )

class AnalysisEntity(Base):
    __tablename__ = "analysis_entities"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(
        Integer,
        ForeignKey("analyses.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    entity_text = Column(Text, nullable=False)
    framing_label = Column(String(50), nullable=False)

    analysis = relationship("Analysis", back_populates="entities")