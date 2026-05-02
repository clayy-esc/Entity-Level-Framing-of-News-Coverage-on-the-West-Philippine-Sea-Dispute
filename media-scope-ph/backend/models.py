from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    sentence = Column(Text)
    model = Column(String)
    fingerprint = Column(String, unique=True, index=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

    entities = relationship("AnalysisEntity", back_populates="analysis")


class AnalysisEntity(Base):
    __tablename__ = "analysis_entities"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id"))
    entity_text = Column(Text)
    framing_label = Column(String)

    analysis = relationship("Analysis", back_populates="entities")