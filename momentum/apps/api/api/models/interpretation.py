# api/models/interpretation.py

from typing import Literal
from pydantic import BaseModel

DiagnosisLevel = Literal["excellent", "good", "average", "weak", "critical"]
DiagnosisConfidence = Literal["high", "medium", "low"]
PriorityLevel = Literal["high", "medium", "low"]


class InsightItem(BaseModel):
    title: str
    dimension: str
    reason: str


class RecommendationItem(BaseModel):
    priority: PriorityLevel
    dimension: str
    action: str
    expected_benefit: str


class DataGapItem(BaseModel):
    dimension: str
    message: str


class ScoreInterpretation(BaseModel):
    summary: str
    diagnosis_level: DiagnosisLevel
    diagnosis_confidence: DiagnosisConfidence
    strengths: list[InsightItem]
    weaknesses: list[InsightItem]
    recommendations: list[RecommendationItem]
    data_gaps: list[DataGapItem]