from momentum_scoring.models import KPIValue, ScoreResult


def score_kpis(values: list[KPIValue]) -> ScoreResult:
    if not values:
        return ScoreResult(
            performance_score=0,
            confidence_score=0,
            measured_count=0,
            estimated_count=0,
        )

    measured_count = sum(1 for value in values if value.provenance == "measured")
    estimated_count = len(values) - measured_count
    confidence_score = round(sum(value.confidence for value in values) / len(values) * 100, 2)

    normalized_values = [max(0, min(value.value, 100)) for value in values]
    performance_score = round(sum(normalized_values) / len(normalized_values), 2)

    return ScoreResult(
        performance_score=performance_score,
        confidence_score=confidence_score,
        measured_count=measured_count,
        estimated_count=estimated_count,
    )
