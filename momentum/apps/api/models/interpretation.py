from __future__ import annotations

from typing import Any, Dict, List, Literal
from pydantic import BaseModel, Field


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


# ─────────────────────────────────────────────────────────────────────────────
# RSE layer — ESG (Environment / Social / Governance) interpretation
# Indépendant du scoring principal : ne remplace pas InterpretationResponse,
# il vient s'ajouter en complément dans la réponse du router.
# ─────────────────────────────────────────────────────────────────────────────

RSEDimension = Literal["environment", "social", "governance"]
RSEReliability = Literal["high", "partial", "low"]


class RSESummary(BaseModel):
    headline: str
    key_insight: str
    environment_score: float = Field(ge=0, le=100)
    social_score: float = Field(ge=0, le=100)
    governance_score: float = Field(ge=0, le=100)
    overall_rse_score: float = Field(ge=0, le=100)
    reliability: RSEReliability


class RSERecommendation(BaseModel):
    title: str
    priority: Literal["haute", "moyenne", "basse"]
    dimension: RSEDimension
    why: str
    action: str
    when: str
    impact: str
    # `tool` reste un dict ouvert pour laisser place à différentes formes
    # (checklist, calculator, benchmark, playbook) sans bloquer le V1.
    tool: Dict[str, Any] = Field(default_factory=dict)


class RSEGap(BaseModel):
    dimension: RSEDimension
    message: str
    impact: str


class RSEInterpretation(BaseModel):
    summary: RSESummary
    recommendations: List[RSERecommendation]
    gaps: List[RSEGap]