from api.models.interpretation import (
    ScoreInterpretation,
    InsightItem,
    RecommendationItem,
    DataGapItem,
)
from api.config.interpretation_rules import (
    DIMENSION_GAP_MESSAGES,
    RECOMMENDATIONS_BY_DIMENSION,
)
from api.services.scoring.advanced_engine import AdvancedScoreResult


def classify_score(score: float) -> str:
    if score >= 80:
        return "excellent"
    if score >= 65:
        return "good"
    if score >= 50:
        return "average"
    if score >= 35:
        return "weak"
    return "critical"


def classify_confidence(confidence_score: float) -> str:
    if confidence_score >= 75:
        return "high"
    if confidence_score >= 50:
        return "medium"
    return "low"


def detect_strengths(result: AdvancedScoreResult) -> list[InsightItem]:
    strengths: list[InsightItem] = []

    for dimension_score in result.dimension_scores:
        if dimension_score.score >= 70:
            reason = (
                f"La dimension {dimension_score.dimension} obtient un score élevé "
                f"({dimension_score.score}/100)."
            )

            if dimension_score.measured_count > 0:
                reason += " Le diagnostic repose en partie sur des données mesurées."

            strengths.append(
                InsightItem(
                    title=f"Bonne performance sur {dimension_score.dimension}",
                    dimension=dimension_score.dimension,
                    reason=reason,
                )
            )

    return strengths


def detect_weaknesses(result: AdvancedScoreResult) -> list[InsightItem]:
    weaknesses: list[InsightItem] = []

    for dimension_score in result.dimension_scores:
        total_count = (
            dimension_score.measured_count
            + dimension_score.estimated_count
            + dimension_score.declared_count
            + dimension_score.proxy_count
        )

        if total_count == 0:
            weaknesses.append(
                InsightItem(
                    title=f"Absence de mesure sur {dimension_score.dimension}",
                    dimension=dimension_score.dimension,
                    reason=f"Aucune donnée n’a été collectée pour la dimension {dimension_score.dimension}.",
                )
            )
            continue

        if dimension_score.score < 50:
            weaknesses.append(
                InsightItem(
                    title=f"Performance insuffisante sur {dimension_score.dimension}",
                    dimension=dimension_score.dimension,
                    reason=f"La dimension {dimension_score.dimension} affiche un score faible ({dimension_score.score}/100).",
                )
            )

        if dimension_score.confidence_score < 50:
            weaknesses.append(
                InsightItem(
                    title=f"Faible fiabilité des données sur {dimension_score.dimension}",
                    dimension=dimension_score.dimension,
                    reason=(
                        f"La confiance sur cette dimension est limitée "
                        f"({dimension_score.confidence_score}/100), ce qui réduit la robustesse du diagnostic."
                    ),
                )
            )

        if dimension_score.measured_count == 0 and total_count > 0:
            weaknesses.append(
                InsightItem(
                    title=f"Peu de données mesurées sur {dimension_score.dimension}",
                    dimension=dimension_score.dimension,
                    reason=(
                        f"La dimension {dimension_score.dimension} est renseignée sans donnée mesurée directe, "
                        f"ce qui fragilise l’analyse."
                    ),
                )
            )

    return weaknesses


def detect_data_gaps(result: AdvancedScoreResult) -> list[DataGapItem]:
    gaps: list[DataGapItem] = []

    for missing_dimension in result.missing_dimensions:
        gaps.append(
            DataGapItem(
                dimension=missing_dimension,
                message=DIMENSION_GAP_MESSAGES.get(
                    missing_dimension,
                    f"La dimension {missing_dimension} n’est pas couverte par les données actuelles.",
                ),
            )
        )

    return gaps


def generate_recommendations(result: AdvancedScoreResult) -> list[RecommendationItem]:
    recommendations: list[RecommendationItem] = []
    already_added: set[tuple[str, str]] = set()

    for dimension_score in result.dimension_scores:
        total_count = (
            dimension_score.measured_count
            + dimension_score.estimated_count
            + dimension_score.declared_count
            + dimension_score.proxy_count
        )

        should_recommend = (
            total_count == 0
            or dimension_score.score < 65
            or dimension_score.confidence_score < 60
            or dimension_score.measured_count == 0
        )

        if not should_recommend:
            continue

        for reco in RECOMMENDATIONS_BY_DIMENSION.get(dimension_score.dimension, []):
            key = (dimension_score.dimension, reco["action"])
            if key in already_added:
                continue

            recommendations.append(
                RecommendationItem(
                    priority=reco["priority"],
                    dimension=dimension_score.dimension,
                    action=reco["action"],
                    expected_benefit=reco["expected_benefit"],
                )
            )
            already_added.add(key)

    return recommendations


def generate_summary(result: AdvancedScoreResult) -> str:
    level = classify_score(result.overall_score)

    strong_dimensions = [
        d.dimension for d in result.dimension_scores if d.score >= 70
    ]
    weak_dimensions = [
        d.dimension for d in result.dimension_scores if 0 < d.score < 50
    ]

    if level == "excellent":
        base = "Performance globale excellente."
    elif level == "good":
        base = "Performance globale solide."
    elif level == "average":
        base = "Performance globale correcte mais perfectible."
    elif level == "weak":
        base = "Performance globale fragile."
    else:
        base = "Performance globale critique."

    details = []

    if strong_dimensions:
        details.append(
            f"Les points forts concernent principalement : {', '.join(strong_dimensions)}."
        )

    if weak_dimensions:
        details.append(
            f"Les points de vigilance concernent : {', '.join(weak_dimensions)}."
        )

    if result.missing_dimensions:
        details.append(
            f"Des angles morts subsistent sur : {', '.join(result.missing_dimensions)}."
        )

    return " ".join([base] + details)


def interpret_score(result: AdvancedScoreResult) -> ScoreInterpretation:
    return ScoreInterpretation(
        summary=generate_summary(result),
        diagnosis_level=classify_score(result.overall_score),
        diagnosis_confidence=classify_confidence(result.confidence_score),
        strengths=detect_strengths(result),
        weaknesses=detect_weaknesses(result),
        recommendations=generate_recommendations(result),
        data_gaps=detect_data_gaps(result),
    )