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


def _fr_article(word: str) -> str:
    """Retourne "l'" si `word` commence par une voyelle (ou h muet), "la " sinon.
    Utilisé pour construire des titres corrects : "l'implication", "la mobilisation"."""
    if not word:
        return "la "
    first = word.strip()[0].lower()
    # 'h' français est traité comme muet ici (impact concret / implication / appropriation).
    return "l'" if first in "aeiouyhàâäéèêëîïôöùûü" else "la "


def _fr_prefix(verb_la_form: str, word: str) -> str:
    """Fabrique un titre comme "Accélérer la X" / "Accélérer l'X" correctement contracté.
    `verb_la_form` = verbe à l'infinitif suivi d'un espace, ex. "Accélérer " ou "Mesurer "."""
    return f"{verb_la_form}{_fr_article(word)}{word}"


def _iter_dimension_details(result: Any) -> List[Dict[str, Any]]:
    """
    Renvoie la liste des dimensions présentes avec leur fiabilité détaillée
    (score, confidence_score, *_count). Compatible AdvancedScoreResult (liste
    d'objets DimensionScore) ou dict équivalent.
    """
    raw = getattr(result, "dimension_scores", None)
    if raw is None and isinstance(result, dict):
        raw = result.get("dimension_scores")

    details: List[Dict[str, Any]] = []
    if not isinstance(raw, list):
        return details

    for ds in raw:
        if isinstance(ds, dict):
            get = ds.get
        else:
            def get(k: str, default: Any = 0, _ds=ds) -> Any:  # type: ignore
                return getattr(_ds, k, default)

        details.append({
            "dimension": str(get("dimension", "")).lower(),
            "score": float(get("score", 0) or 0),
            "confidence_score": float(get("confidence_score", 0) or 0),
            "measured_count": int(get("measured_count", 0) or 0),
            "estimated_count": int(get("estimated_count", 0) or 0),
            "declared_count": int(get("declared_count", 0) or 0),
            "proxy_count": int(get("proxy_count", 0) or 0),
        })

    return details


def _extract_missing_dimensions(result: Any) -> List[str]:
    raw = getattr(result, "missing_dimensions", None)
    if raw is None and isinstance(result, dict):
        raw = result.get("missing_dimensions")
    if not isinstance(raw, (list, tuple)):
        return []
    return [str(d).lower() for d in raw]


def _measurement_gap_action(dim: str, label: str) -> str:
    """Recommandation concrète associée à une dimension non mesurée."""
    if dim == "reach":
        return (
            "Commencer à mesurer la couverture effective des publics cibles "
            "(taux de diffusion, taux d'ouverture, audience touchée)."
        )
    if dim == "engagement":
        return (
            "Mettre en place un pulse d'implication à chaud (< 24h) "
            "pour mesurer la participation active."
        )
    if dim == "appropriation":
        return (
            "Diffuser un test de clarté à J+2 afin de vérifier que les messages "
            "clés sont compris et mémorisés."
        )
    if dim == "impact":
        return (
            "Déployer une mesure de changement comportemental à J+30 pour "
            "capter les effets concrets sur les pratiques."
        )
    return f"Mettre en place une première mesure sur la dimension {label}."


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

    # Détails par dimension (fiabilité, provenance) pour les angles morts ciblés
    details_by_dim: Dict[str, Dict[str, Any]] = {
        d["dimension"]: d for d in _iter_dimension_details(result)
    }
    missing_dims = _extract_missing_dimensions(result)

    # Forces / faiblesses (UX simplifiée max 3)
    # On exclut explicitement les dimensions non mesurées : elles sont
    # traitées plus bas comme angles morts, pas comme faiblesses.
    # Seuils : >= 70 solide / < 70 à surveiller — on garantit ainsi qu'une
    # dimension moyenne (ex. 58/100) apparaît bien en point de vigilance.
    for dim, score in ordered:
        if dim in missing_dims:
            continue
        label = BUSINESS_LABELS.get(dim, dim)

        if score >= 70:
            strengths.append(
                InsightItem(
                    title=f"{label.capitalize()} solide",
                    description=f"Le niveau de {label} est élevé ({int(round(score))}/100).",
                )
            )
        else:
            weaknesses.append(
                InsightItem(
                    title=f"{label.capitalize()} à renforcer",
                    description=(
                        f"Le niveau de {label} reste insuffisant ({int(round(score))}/100) "
                        "pour garantir des résultats durables."
                    ),
                )
            )

    # ─────────────────────────────────────────────────────────────────
    # Angles morts de mesure — logique exhaustive
    #   1. Dimensions totalement absentes → angle mort + recommandation haute
    #   2. Dimensions présentes mais fiabilité < 50 % → angle mort
    #   3. Dimensions présentes mais uniquement proxy/estimé → angle mort
    # ─────────────────────────────────────────────────────────────────

    # 1) Dimensions non mesurées
    for dim in BUSINESS_LABELS.keys():
        if dim not in missing_dims:
            continue
        label = BUSINESS_LABELS[dim]
        data_gaps.append(
            DataGapItem(
                field=label,
                issue="Aucune mesure collectée sur cette dimension",
                impact=(
                    f"Impossible d'évaluer {_fr_article(label)}{label} — angle mort complet dans le "
                    "diagnostic. Toute décision sur ce levier est à prendre à l'aveugle."
                ),
            )
        )
        # Recommandation associée, priorité haute
        recommendations.append(
            RecommendationItem(
                title=_fr_prefix("Mesurer ", label),
                action=_measurement_gap_action(dim, label),
                priority="haute",
            )
        )

    # 2) & 3) Dimensions présentes mais peu fiables
    for dim, d in details_by_dim.items():
        if dim in missing_dims:
            continue
        label = BUSINESS_LABELS.get(dim, dim)
        conf = d["confidence_score"]
        hard = d["measured_count"] + d["declared_count"]
        soft = d["estimated_count"] + d["proxy_count"]
        total = hard + soft
        score = d["score"]

        # Score à 0 malgré des signaux présents — anomalie de saisie
        if total > 0 and score <= 0:
            data_gaps.append(
                DataGapItem(
                    field=label,
                    issue="Valeurs collectées nulles ou non exploitables",
                    impact=(
                        f"Les signaux de {label} existent mais ne produisent aucun score — "
                        "vérifier les valeurs saisies et leur format."
                    ),
                )
            )
        # Fiabilité globale moyenne à faible sur la dimension (seuil élargi à 70 %
        # pour faire émerger les zones de vigilance sur la qualité des données).
        elif total > 0 and conf < 70:
            niveau = "faible" if conf < 50 else "partielle"
            data_gaps.append(
                DataGapItem(
                    field=label,
                    issue=f"Fiabilité de la mesure {niveau} ({int(round(conf))}%)",
                    impact=(
                        f"Le score de {label} ({int(round(score))}/100) repose sur des "
                        "données peu fiables — renforcer les sources de mesure avant de décider."
                    ),
                )
            )
        # Aucune mesure "dure" : uniquement estimé ou proxy
        elif hard == 0 and soft > 0:
            la = _fr_article(label).capitalize().rstrip()
            data_gaps.append(
                DataGapItem(
                    field=label,
                    issue="Données uniquement estimées ou indirectes",
                    impact=(
                        f"{la}{'' if la.endswith(chr(39)) else ' '}{label} est approximée par des proxies — "
                        "à confirmer par une mesure directe pour fiabiliser le diagnostic."
                    ),
                )
            )
        # Signal unique sur la dimension : la décision repose sur un seul indicateur,
        # donc sensibilité élevée à une erreur de saisie.
        elif total == 1:
            data_gaps.append(
                DataGapItem(
                    field=label,
                    issue="Mesure reposant sur un seul indicateur",
                    impact=(
                        f"Le diagnostic de {label} s'appuie sur un unique KPI — "
                        "diversifier les sources pour sécuriser la lecture."
                    ),
                )
            )

    # Recommandations sur toutes les dimensions mesurées (triées par urgence croissante).
    # Les dimensions non mesurées sont déjà couvertes par les recommandations "Mesurer la X".
    weakest_first = sorted(
        [(d, s) for d, s in filtered_scores.items() if d not in missing_dims],
        key=lambda kv: kv[1],
    )
    for dim, score in weakest_first:
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

        # Priorité graduée : haute si fragile, moyenne si correct, basse si déjà solide.
        if score < 45:
            priority = "haute"
        elif score < 70:
            priority = "moyenne"
        else:
            priority = "basse"

        # Le verbe s'adapte au niveau : on "accélère" quand c'est à renforcer,
        # on "pérennise" quand c'est déjà solide. L'article est contracté
        # automatiquement ("l'implication" et non "la implication").
        verb = "Pérenniser " if score >= 70 else "Accélérer "

        recommendations.append(
            RecommendationItem(
                title=_fr_prefix(verb, label),
                action=action,
                priority=priority,
            )
        )

    strengths = _top_n(strengths, 3)
    weaknesses = _top_n(weaknesses, 3)
    # On priorise les recommandations "haute" avant de capper, afin que les
    # dimensions non mesurées remontent en premier dans le dashboard.
    priority_rank = {"haute": 0, "moyenne": 1, "basse": 2}
    recommendations = sorted(
        recommendations,
        key=lambda r: priority_rank.get(r.priority, 9),
    )
    # On garde au moins une recommandation par dimension mesurée + les "Mesurer la X"
    # pour les angles morts. Cap à 6 pour rester lisible.
    recommendations = _top_n(recommendations, 6)
    # Le dashboard affiche jusqu'à 5 angles morts — on conserve assez de matière.
    data_gaps = _top_n(data_gaps, 6)

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
            ordered_dimensions=sorted(
                [(d, s) for d, s in filtered_scores.items() if d not in missing_dims],
                key=lambda kv: kv[1],
            ),
            has_data_gaps=len(data_gaps) > 0,
        ),
        top_strengths=[item.title for item in strengths][:3],
        top_priorities=[item.title for item in recommendations][:3],
    )

    return InterpretationResponse(
        executive_summary=executive,
        detailed_analysis=detailed,
    )