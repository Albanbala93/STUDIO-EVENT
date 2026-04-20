from __future__ import annotations

from typing import Any, Dict, Iterable, List, Tuple

from services.scoring.advanced_engine import AdvancedScoreResult
from models.interpretation import (
    DataGapItem,
    ExecutiveSummary,
    InsightItem,
    InterpretationResponse,
    RecommendationItem,
    ScoreInterpretation,
)

# Lexique UX métier (remplacement des termes techniques)
BUSINESS_LABELS: Dict[str, str] = {
    "reach": "mobilisation",
    "engagement": "implication",
    "appropriation": "compréhension des messages",
    "impact": "impact concret",
}


def _to_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _top_n(items: List[Any], n: int = 3) -> List[Any]:
    return items[:n]


def _extract_global_score(result: AdvancedScoreResult) -> float:
    # Compatible avec plusieurs structures possibles
    for attr in ("global_score", "score_global", "overall_score", "score"):
        if hasattr(result, attr):
            return _to_float(getattr(result, attr), 0.0)

    if isinstance(result, dict):
        for key in ("global_score", "score_global", "overall_score", "score"):
            if key in result:
                return _to_float(result[key], 0.0)

    return 0.0


def _extract_dimension_scores(result: AdvancedScoreResult) -> Dict[str, float]:
    """
    Extrait les scores dimensionnels sans dépendre d'une structure unique.
    Couvre les cas courants:
    - result.dimension_scores: dict
    - result.scores: dict
    - result.dimension_signals: list[DimensionSignal(name, score)]
    """
    # Cas dict direct
    for attr in ("dimension_scores", "scores", "dimensions"):
        raw = getattr(result, attr, None)
        if isinstance(raw, dict):
            return {str(k).lower(): _to_float(v) for k, v in raw.items()}

    if isinstance(result, dict):
        for key in ("dimension_scores", "scores", "dimensions"):
            raw = result.get(key)
            if isinstance(raw, dict):
                return {str(k).lower(): _to_float(v) for k, v in raw.items()}

    # Cas liste de DimensionScore (structure effective de AdvancedScoreResult)
    raw_list = getattr(result, "dimension_scores", None)
    if raw_list is None and isinstance(result, dict):
        raw_list = result.get("dimension_scores")

    if isinstance(raw_list, list):
        scores: Dict[str, float] = {}
        for ds in raw_list:
            if isinstance(ds, dict):
                name = str(ds.get("dimension", "")).lower()
                score = _to_float(ds.get("score"), 0.0)
            else:
                name = str(getattr(ds, "dimension", "")).lower()
                score = _to_float(getattr(ds, "score", 0.0), 0.0)
            if name:
                scores[name] = score
        if scores:
            return scores

    # Cas liste de signaux
    raw_signals = getattr(result, "dimension_signals", None)
    if raw_signals is None and isinstance(result, dict):
        raw_signals = result.get("dimension_signals")

    if isinstance(raw_signals, Iterable):
        scores: Dict[str, float] = {}
        for signal in raw_signals:
            if isinstance(signal, dict):
                name = str(signal.get("name", "")).lower()
                score = _to_float(signal.get("score"), 0.0)
            else:
                name = str(getattr(signal, "name", "")).lower()
                score = _to_float(getattr(signal, "score", 0.0), 0.0)

            if name:
                scores[name] = score
        if scores:
            return scores

    # Fallback minimal sur les 4 dimensions attendues
    fallback: Dict[str, float] = {}
    for dim in BUSINESS_LABELS.keys():
        if hasattr(result, dim):
            fallback[dim] = _to_float(getattr(result, dim), 0.0)
    return fallback


def _headline_from_score(global_score: float) -> str:
    if global_score >= 75:
        return "Performance globale solide"
    if global_score >= 55:
        return "Performance globale correcte, avec des leviers à activer"
    return "Performance globale fragile"


def _key_insight(
    ordered_dimensions: List[Tuple[str, float]],
    has_data_gaps: bool,
) -> str:
    if not ordered_dimensions:
        return "La priorité est de fiabiliser les données pour piloter les prochaines actions."

    weakest_dim, weakest_score = ordered_dimensions[-1]
    weakest_label = BUSINESS_LABELS.get(weakest_dim, weakest_dim)

    if has_data_gaps:
        return (
            f"Votre principal angle mort concerne la {weakest_label} : "
            "la qualité de mesure doit être renforcée pour décider plus vite."
        )

    return (
        f"Votre principal point de vigilance est la {weakest_label} "
        f"({int(round(weakest_score))}/100)."
    )


def _executive_summary_text(
    global_score: float,
    strengths: List[InsightItem],
    weaknesses: List[InsightItem],
    recommendations: List[RecommendationItem],
) -> str:
    """
    2-3 phrases max, lisibles immédiatement par un profil non technique.
    """
    score_sentence = (
        f"Le diagnostic positionne la performance globale à {int(round(global_score))}/100."
    )

    if strengths:
        strong_sentence = (
            f"Les points les plus solides sont "
            + ", ".join(item.title.lower() for item in _top_n(strengths, 2))
            + "."
        )
    else:
        strong_sentence = "Aucun point fort clairement consolidé n'est encore visible."

    if recommendations:
        action_sentence = (
            "Priorité immédiate : "
            + _top_n(recommendations, 1)[0].title
            + "."
        )
    else:
        action_sentence = "Priorité immédiate : compléter les données manquantes pour fiabiliser le pilotage."

    return " ".join([score_sentence, strong_sentence, action_sentence])


def interpret_score(result: AdvancedScoreResult) -> InterpretationResponse:
    """
    Transforme un résultat de scoring en restitution UX:
    - executive_summary (lisible en 10s)
    - detailed_analysis (structure complète existante)
    """
    global_score = _extract_global_score(result)
    dimension_scores = _extract_dimension_scores(result)

    # On conserve les 4 dimensions métier attendues, si présentes
    filtered_scores = {
        dim: _to_float(dimension_scores.get(dim, 0.0), 0.0)
        for dim in BUSINESS_LABELS.keys()
        if dim in dimension_scores
    }

    ordered = sorted(filtered_scores.items(), key=lambda kv: kv[1], reverse=True)

    strengths: List[InsightItem] = []
    weaknesses: List[InsightItem] = []
    recommendations: List[RecommendationItem] = []
    data_gaps: List[DataGapItem] = []

    # Forces / faiblesses (UX simplifiée max 3)
    for dim, score in ordered:
        label = BUSINESS_LABELS.get(dim, dim)

        if score >= 70:
            strengths.append(
                InsightItem(
                    title=f"{label.capitalize()} solide",
                    description=f"Le niveau de {label} est élevé ({int(round(score))}/100).",
                )
            )
        elif score < 55:
            weaknesses.append(
                InsightItem(
                    title=f"{label.capitalize()} à renforcer",
                    description=(
                        f"Le niveau de {label} reste insuffisant ({int(round(score))}/100) "
                        "pour garantir des résultats durables."
                    ),
                )
            )

        # Gap de données simple (si score nul ou absent)
        if score <= 0:
            data_gaps.append(
                DataGapItem(
                    field=label,
                    issue="Mesure absente ou non exploitable",
                    impact="La décision est moins fiable sur cette dimension.",
                )
            )

    # Recommandations priorisées sur les 3 plus faibles dimensions
    weakest_first = sorted(filtered_scores.items(), key=lambda kv: kv[1])
    for dim, score in weakest_first[:3]:
        label = BUSINESS_LABELS.get(dim, dim)

        if dim == "mobilisation":
            action = "Renforcer la couverture des publics cibles et clarifier le plan de diffusion."
        elif dim == "engagement":
            action = "Introduire des formats plus interactifs pour augmenter la participation active."
        elif dim == "appropriation":
            action = "Structurer un relais managérial pour améliorer la compréhension et la mémorisation des messages."
        elif dim == "impact":
            action = "Mettre en place un suivi post-événement pour mesurer les changements concrets."
        else:
            # mapping correct avec les clés techniques
            if dim == "reach":
                action = "Renforcer la couverture des publics cibles et clarifier le plan de diffusion."
            elif dim == "engagement":
                action = "Introduire des formats plus interactifs pour augmenter la participation active."
            elif dim == "appropriation":
                action = "Structurer un relais managérial pour améliorer la compréhension et la mémorisation des messages."
            elif dim == "impact":
                action = "Mettre en place un suivi post-événement pour mesurer les changements concrets."
            else:
                action = "Définir une action corrective ciblée sur cette dimension."

        recommendations.append(
            RecommendationItem(
                title=f"Accélérer la {label}",
                action=action,
                priority="haute" if score < 45 else "moyenne",
            )
        )

    strengths = _top_n(strengths, 3)
    weaknesses = _top_n(weaknesses, 3)
    recommendations = _top_n(recommendations, 3)
    data_gaps = _top_n(data_gaps, 3)

    summary = _executive_summary_text(
        global_score=global_score,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
    )

    detailed = ScoreInterpretation(
        summary=summary,
        strengths=strengths,
        weaknesses=weaknesses,
        recommendations=recommendations,
        data_gaps=data_gaps,
    )

    executive = ExecutiveSummary(
        headline=_headline_from_score(global_score),
        key_insight=_key_insight(
            ordered_dimensions=sorted(filtered_scores.items(), key=lambda kv: kv[1]),
            has_data_gaps=len(data_gaps) > 0,
        ),
        top_strengths=[item.title for item in strengths][:3],
        top_priorities=[item.title for item in recommendations][:3],
    )

    return InterpretationResponse(
        executive_summary=executive,
        detailed_analysis=detailed,
    )