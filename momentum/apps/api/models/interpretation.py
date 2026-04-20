from __future__ import annotations

from typing import List, Literal
from pydantic import BaseModel


class InsightItem(BaseModel):
    title: str
    description: str


class RecommendationItem(BaseModel):
    title: str
    action: str
    priority: Literal["haute", "moyenne", "basse"]


class DataGapItem(BaseModel):
    field: str
    issue: str
    impact: str


class ScoreInterpretation(BaseModel):
    summary: str
    strengths: List[InsightItem]
    weaknesses: List[InsightItem]
    recommendations: List[RecommendationItem]
    data_gaps: List[DataGapItem]


class ExecutiveSummary(BaseModel):
    headline: str
    key_insight: str
    top_strengths: List[str]
    top_priorities: List[str]


class InterpretationResponse(BaseModel):
    executive_summary: ExecutiveSummary
    detailed_analysis: ScoreInterpretation