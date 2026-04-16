from typing import Literal

from pydantic import BaseModel, Field
from momentum_kpi_catalog.advanced_catalog import get_dimension_from_kpi


DataProvenance = Literal["measured", "estimated", "declared", "proxy"]
ScoringDimension = Literal["reach", "engagement", "appropriation", "impact"]

DEFAULT_DIMENSION_WEIGHTS: dict[ScoringDimension, float] = {
    "reach": 0.25,
    "engagement": 0.25,
    "appropriation": 0.25,
    "impact": 0.25,
}


class DimensionSignal(BaseModel):
    dimension: ScoringDimension
    value: float = Field(ge=0, le=100)
    provenance: DataProvenance
    confidence: float = Field(ge=0, le=1)
    method: str | None = None
    kpi_id: str | None = None


class KPIContribution(BaseModel):
    kpi_id: str | None = None
    value: float = Field(ge=0, le=100)
    confidence: float = Field(ge=0, le=1)
    contribution: float = Field(ge=0)
    provenance: DataProvenance


class DimensionScore(BaseModel):
    dimension: ScoringDimension
    score: float = Field(ge=0, le=100)
    confidence_score: float = Field(ge=0, le=100)
    measured_count: int
    estimated_count: int
    declared_count: int = 0
    proxy_count: int = 0
    kpi_breakdown: list[KPIContribution] = Field(default_factory=list)


class AdvancedScoreResult(BaseModel):
    overall_score: float = Field(ge=0, le=100)
    confidence_score: float = Field(ge=0, le=100)
    dimension_scores: list[DimensionScore]
    measured_count: int
    estimated_count: int
    declared_count: int
    proxy_count: int
    missing_dimensions: list[ScoringDimension]


def enrich_signals_with_dimension(signals: list[DimensionSignal]) -> list[DimensionSignal]:
    enriched: list[DimensionSignal] = []

    for signal in signals:
        if signal.kpi_id:
            try:
                dimension = get_dimension_from_kpi(signal.kpi_id)
            except Exception:
                dimension = signal.dimension
        else:
            dimension = signal.dimension

        enriched.append(
            DimensionSignal(
                dimension=dimension,
                value=signal.value,
                provenance=signal.provenance,
                confidence=signal.confidence,
                method=signal.method,
                kpi_id=signal.kpi_id,
            )
        )

    return enriched


def compute_weighted_dimension_score(signals: list[DimensionSignal]) -> dict:
    if not signals:
        return {
            "score": 0.0,
            "confidence_score": 0.0,
            "measured_count": 0,
            "estimated_count": 0,
            "declared_count": 0,
            "proxy_count": 0,
            "kpi_breakdown": [],
        }

    measured_count = sum(1 for signal in signals if signal.provenance == "measured")
    estimated_count = sum(1 for signal in signals if signal.provenance == "estimated")
    declared_count = sum(1 for signal in signals if signal.provenance == "declared")
    proxy_count = sum(1 for signal in signals if signal.provenance == "proxy")

    total_weight = sum(signal.confidence for signal in signals if signal.confidence > 0)

    if total_weight > 0:
        raw_score = sum(signal.value * signal.confidence for signal in signals) / total_weight
        breakdown = [
            KPIContribution(
                kpi_id=signal.kpi_id,
                value=signal.value,
                confidence=signal.confidence,
                contribution=round((signal.value * signal.confidence) / total_weight, 4),
                provenance=signal.provenance,
            )
            for signal in signals
        ]
    else:
        raw_score = sum(signal.value for signal in signals) / len(signals)
        breakdown = [
            KPIContribution(
                kpi_id=signal.kpi_id,
                value=signal.value,
                confidence=signal.confidence,
                contribution=0.0,
                provenance=signal.provenance,
            )
            for signal in signals
        ]

    confidence_score = round(sum(signal.confidence for signal in signals) / len(signals) * 100, 2)

    return {
        "score": round(raw_score, 2),
        "confidence_score": confidence_score,
        "measured_count": measured_count,
        "estimated_count": estimated_count,
        "declared_count": declared_count,
        "proxy_count": proxy_count,
        "kpi_breakdown": breakdown,
    }


def _score_dimension(dimension: ScoringDimension, signals: list[DimensionSignal]) -> DimensionScore:
    dimension_signals = [signal for signal in signals if signal.dimension == dimension]

    if not dimension_signals:
        return DimensionScore(
            dimension=dimension,
            score=0,
            confidence_score=0,
            measured_count=0,
            estimated_count=0,
            declared_count=0,
            proxy_count=0,
            kpi_breakdown=[],
        )

    weighted = compute_weighted_dimension_score(dimension_signals)

    return DimensionScore(
        dimension=dimension,
        score=weighted["score"],
        confidence_score=weighted["confidence_score"],
        measured_count=weighted["measured_count"],
        estimated_count=weighted["estimated_count"],
        declared_count=weighted["declared_count"],
        proxy_count=weighted["proxy_count"],
        kpi_breakdown=weighted["kpi_breakdown"],
    )


def score_momentum(
    signals: list[DimensionSignal],
    weights: dict[ScoringDimension, float] | None = None,
) -> AdvancedScoreResult:
    active_weights = weights or DEFAULT_DIMENSION_WEIGHTS
    signals = enrich_signals_with_dimension(signals)
    dimension_scores = [_score_dimension(dimension, signals) for dimension in active_weights]

    present_scores = [
        score for score in dimension_scores if (
            score.measured_count + score.estimated_count + score.declared_count + score.proxy_count
        ) > 0
    ]
    missing_dimensions = [
        score.dimension for score in dimension_scores if (
            score.measured_count + score.estimated_count + score.declared_count + score.proxy_count
        ) == 0
    ]

    measured_count = sum(score.measured_count for score in dimension_scores)
    estimated_count = sum(score.estimated_count for score in dimension_scores)
    declared_count = sum(score.declared_count for score in dimension_scores)
    proxy_count = sum(score.proxy_count for score in dimension_scores)

    if not present_scores:
        return AdvancedScoreResult(
            overall_score=0,
            confidence_score=0,
            dimension_scores=dimension_scores,
            measured_count=0,
            estimated_count=0,
            declared_count=0,
            proxy_count=0,
            missing_dimensions=missing_dimensions,
        )

    weight_total = sum(active_weights[score.dimension] for score in present_scores)

    overall_score = round(
        sum(score.score * active_weights[score.dimension] for score in present_scores) / weight_total,
        2,
    )
    confidence_score = round(
        sum(score.confidence_score * active_weights[score.dimension] for score in present_scores) / weight_total,
        2,
    )

    return AdvancedScoreResult(
        overall_score=overall_score,
        confidence_score=confidence_score,
        dimension_scores=dimension_scores,
        measured_count=measured_count,
        estimated_count=estimated_count,
        declared_count=declared_count,
        proxy_count=proxy_count,
        missing_dimensions=missing_dimensions,
    )