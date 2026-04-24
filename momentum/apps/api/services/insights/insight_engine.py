from __future__ import annotations

from typing import Any, Dict, Iterable, List, Tuple

from services.scoring.advanced_engine import AdvancedScoreResult
from models.interpretation import (
    DataGapItem,
    ExecutiveSummary,
    InsightItem,
    InterpretationResponse,
    RecommendationItem,
    RSEGap,
    RSEInterpretation,
    RSERecommendation,
    RSESummary,
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


# ─────────────────────────────────────────────────────────────────────────────
# RSE layer — interprétation ESG (Environment / Social / Governance)
# Additive : ne touche pas à `score_momentum` ni `interpret_score`.
# ─────────────────────────────────────────────────────────────────────────────

# Mapping KPI → pilier ESG. Aligné sur le catalogue csr_sustainability.
# Une extension future consistera à enrichir cette table plutôt qu'à déplacer
# la logique — c'est intentionnel de garder le mapping localement lisible.
RSE_KPI_DIMENSION: Dict[str, str] = {
    # Environment
    "csr.estimated_carbon_footprint": "environment",
    "csr.carbon_per_participant": "environment",
    "csr.transport_emission_share": "environment",
    "csr.waste_reduction_score": "environment",
    "csr.sobriety_score": "environment",
    # Social
    "csr.participant_coverage_rate": "social",
    "csr.rse_message_visibility_rate": "social",
    "csr.engagement_rate": "social",
    "csr.accessibility_score": "social",
    "csr.inclusion_perception_score": "social",
    # Governance
    "csr.local_supplier_rate": "governance",
    "csr.responsible_supplier_rate": "governance",
    "csr.rse_coherence_score": "governance",
}

RSE_DIMENSION_LABEL_FR: Dict[str, str] = {
    "environment": "environnementale",
    "social": "sociale",
    "governance": "de gouvernance",
}

# KPI dont la valeur brute est "plus c'est haut, plus c'est mauvais".
# Convention V1 : on attend des valeurs 0-100 déjà normalisées "plus c'est haut,
# mieux c'est". Pour ces KPI on inverse (100 - value) afin de rester cohérent.
RSE_INVERTED_KPIS = {
    "csr.transport_emission_share",
}


def _rse_signal_to_dict(signal: Any) -> Dict[str, Any]:
    """Lit un signal aussi bien depuis un objet Pydantic que depuis un dict."""
    if isinstance(signal, dict):
        return {
            "kpi_id": signal.get("kpi_id"),
            "value": _to_float(signal.get("value"), 0.0),
            "confidence": _to_float(signal.get("confidence"), 0.0),
            "provenance": signal.get("provenance"),
        }
    return {
        "kpi_id": getattr(signal, "kpi_id", None),
        "value": _to_float(getattr(signal, "value", 0.0), 0.0),
        "confidence": _to_float(getattr(signal, "confidence", 0.0), 0.0),
        "provenance": getattr(signal, "provenance", None),
    }


def _rse_bucket_score(signals: List[Dict[str, Any]]) -> Tuple[float, float, int]:
    """Moyenne pondérée par confiance. Retourne (score, avg_confidence, count).
    Si la somme des confiances est nulle, bascule sur une moyenne simple."""
    if not signals:
        return 0.0, 0.0, 0

    weighted_values: List[Tuple[float, float]] = []
    for s in signals:
        val = s["value"]
        if s["kpi_id"] in RSE_INVERTED_KPIS:
            val = max(0.0, 100.0 - val)
        weighted_values.append((val, s["confidence"]))

    total_weight = sum(c for _, c in weighted_values if c > 0)
    if total_weight > 0:
        score = sum(v * c for v, c in weighted_values) / total_weight
    else:
        score = sum(v for v, _ in weighted_values) / len(weighted_values)

    avg_conf = sum(c for _, c in weighted_values) / len(weighted_values)
    return round(score, 2), round(avg_conf, 3), len(signals)


def _rse_reliability(
    total_signals: int,
    missing_pillars: int,
    avg_confidence: float,
) -> str:
    """Règle V1 simple et explicable :
    - pas assez de signaux → low
    - couverture partielle ou confiance faible → partial
    - sinon → high
    """
    if total_signals == 0 or missing_pillars == 3:
        return "low"
    if total_signals < 3 or missing_pillars >= 2:
        return "low"
    if total_signals < 6 or missing_pillars == 1 or avg_confidence < 0.5:
        return "partial"
    return "high"


# ─────────────────────────────────────────────────────────────────────────────
# Outils RSE statiques — prêts à être servis tels quels au frontend.
# Chaque outil adresse les sous-dimensions clés d'un pilier ESG :
#   Environment → déplacements, restauration, déchets
#   Social      → accessibilité, compréhension des engagements, perception
#   Governance  → existence d'objectifs RSE, suivi et traçabilité
# Les questions sont limitées à 5, les tips à 2–3, pour tenir dans un format
# exploitable en atelier ou en questionnaire court.
# ─────────────────────────────────────────────────────────────────────────────


def get_environment_tool() -> Dict[str, Any]:
    """Diagnostic d'empreinte événementielle : déplacements, restauration, déchets."""
    return {
        "name": "Diagnostic empreinte événementielle",
        "usage": (
            "Questionnaire court à administrer aux participants pour reconstituer "
            "l'empreinte environnementale d'une opération sur ses trois postes "
            "majeurs : déplacements, restauration et déchets."
        ),
        "timing": (
            "À envoyer en sortie d'événement (J+0 à J+2) pour limiter les biais "
            "de rappel ; relance ciblée à J+5 pour sécuriser le taux de réponse."
        ),
        "questions": [
            "Quel mode de transport avez-vous utilisé pour venir (voiture, train, avion, mobilité douce) ?",
            "Quelle distance avez-vous parcourue, aller simple, pour rejoindre l'événement ?",
            "Quel type de repas avez-vous consommé sur place (carné, végétarien, végétalien) ?",
            "Les contenants, la vaisselle et les supports étaient-ils réutilisables ou recyclables ?",
            "Avez-vous emporté des goodies ou supports physiques à l'issue de l'événement ?",
        ],
        "tips": [
            "Intégrer la question du transport dès l'inscription afin de disposer d'une donnée fiable sans dépendre du rappel à posteriori.",
            "Croiser les réponses par site de rattachement pour identifier les axes de progrès les plus contributeurs à l'empreinte globale.",
            "Appliquer les facteurs d'émission ADEME de l'année en cours pour garantir la cohérence avec le bilan carbone de l'entreprise.",
        ],
    }


def get_social_tool() -> Dict[str, Any]:
    """Baromètre perception RSE, compréhension des engagements et inclusion."""
    return {
        "name": "Baromètre perception RSE & inclusion",
        "usage": (
            "Sondage bref auprès des participants pour mesurer la compréhension "
            "des engagements RSE présentés, leur utilité perçue et la qualité "
            "de l'inclusion ressentie durant l'opération."
        ),
        "timing": (
            "À diffuser à J+1 par email ou QR code en sortie de session, avec "
            "une fenêtre de réponse ouverte sur 7 jours."
        ),
        "questions": [
            "Avez-vous compris les engagements RSE présentés durant l'événement ?",
            "Quels messages RSE retenez-vous spontanément ?",
            "Ces engagements vous semblent-ils utiles pour votre quotidien professionnel ?",
            "L'événement vous a-t-il semblé accessible à l'ensemble des publics concernés ?",
            "Vous êtes-vous senti pleinement inclus et représenté durant l'opération ?",
        ],
        "tips": [
            "Maintenir le questionnaire sous deux minutes pour préserver un taux de réponse représentatif.",
            "Segmenter les résultats par population cible (métier, ancienneté, site) afin de détecter des angles morts d'inclusion.",
        ],
    }


def get_governance_tool() -> Dict[str, Any]:
    """Grille d'auto-audit sur l'existence et le suivi des objectifs RSE."""
    return {
        "name": "Grille de pilotage des objectifs RSE",
        "usage": (
            "Auto-audit interne permettant de vérifier que chaque opération est "
            "rattachée à des objectifs RSE formalisés, chiffrés et effectivement "
            "suivis dans la durée."
        ),
        "timing": (
            "À compléter en amont de chaque opération, puis revue systématique "
            "à J+30 pour consolider les résultats et les écarts."
        ),
        "questions": [
            "Des objectifs RSE ont-ils été définis formellement avant l'opération ?",
            "Ces objectifs sont-ils chiffrés, datés et assortis d'indicateurs mesurables ?",
            "Les résultats obtenus ont-ils été effectivement mesurés et consolidés ?",
            "Les résultats sont-ils suivis dans le temps et partagés avec les parties prenantes internes ?",
            "Les écarts constatés donnent-ils lieu à un plan d'action documenté et assumé ?",
        ],
        "tips": [
            "Rattacher les objectifs RSE à la trajectoire CSRD de l'entreprise pour éviter les mesures orphelines.",
            "Archiver les résultats dans un espace commun et traçable afin de sécuriser l'auditabilité d'une opération à l'autre.",
        ],
    }


_RSE_TOOL_BUILDERS = {
    "environment": get_environment_tool,
    "social": get_social_tool,
    "governance": get_governance_tool,
}


# Seuil à partir duquel un pilier est considéré comme suffisamment solide :
# en-dessous, on émet une recommandation ciblée ; au-dessus, on s'abstient
# pour ne pas bruiter la restitution avec des conseils non prioritaires.
_RSE_WEAK_THRESHOLD = 60.0


def _build_rse_recommendation(
    dimension: str,
    score: float,
    has_data: bool,
) -> RSERecommendation | None:
    """Construit une recommandation riche pour un pilier donné.

    Retourne None si le pilier est mesuré ET au-dessus du seuil de vigilance :
    inutile de recommander quand tout va bien, cela dilue les priorités.
    """
    if has_data and score >= _RSE_WEAK_THRESHOLD:
        return None

    # Priorité et horizon d'action.
    if not has_data:
        priority = "haute"
        when = "À lancer immédiatement, sur la prochaine opération."
    elif score < 45:
        priority = "haute"
        when = "À engager dans les 30 jours sur les opérations en cours."
    else:
        priority = "moyenne"
        when = "À structurer dans le trimestre, sur l'ensemble des opérations."

    tool = _RSE_TOOL_BUILDERS[dimension]()

    if dimension == "environment":
        if not has_data:
            title = "Mesurer l'empreinte environnementale de vos opérations"
            why = (
                "Vous ne disposez aujourd'hui d'aucune donnée sur les déplacements, "
                "la restauration et les déchets générés par vos actions."
            )
            action = (
                "Déployer le diagnostic d'empreinte événementielle sur la prochaine "
                "opération pour collecter une première série de données fiables sur "
                "ces trois postes."
            )
            impact = (
                "Vous posez le socle factuel qui vous permettra d'identifier les "
                "postes les plus contributeurs et d'engager un plan de réduction chiffré."
            )
        else:
            title = "Réduire l'empreinte environnementale de vos opérations"
            why = (
                "Les signaux disponibles sur les déplacements, la restauration et "
                "les déchets sont trop faibles pour soutenir une démarche crédible "
                "de réduction auprès de vos parties prenantes."
            )
            action = (
                "Identifier les deux postes les plus contributeurs à l'empreinte de "
                "vos opérations et fixer un objectif de réduction chiffré à 12 mois, "
                "porté par un référent nommé."
            )
            impact = (
                "Vous transformez un signal faible en trajectoire pilotée et vous "
                "sécurisez votre capacité à défendre le volet environnemental en "
                "comex comme en reporting extra-financier."
            )

    elif dimension == "social":
        if not has_data:
            title = "Mesurer la perception et l'inclusion des participants"
            why = (
                "Vous ne disposez d'aucun signal sur l'accessibilité de vos "
                "opérations, la compréhension des engagements RSE par les "
                "participants ni leur perception globale de l'action."
            )
            action = (
                "Déployer le baromètre de perception RSE et d'inclusion à l'issue "
                "de la prochaine opération pour constituer une première baseline "
                "exploitable."
            )
            impact = (
                "Vous objectivez la dimension sociale, vous prévenez les angles "
                "morts d'exclusion et vous vous dotez d'une base de comparaison "
                "d'une opération à l'autre."
            )
        else:
            title = "Renforcer l'inclusion et la compréhension RSE"
            why = (
                "Les résultats sur la compréhension des engagements RSE, "
                "l'accessibilité ou la perception d'inclusion sont en-dessous "
                "du seuil attendu pour une opération structurée."
            )
            action = (
                "Prioriser la sous-dimension la plus faible, nommer un référent "
                "et ajuster le format (accessibilité, représentativité, pédagogie "
                "des engagements) sur la prochaine opération."
            )
            impact = (
                "Vous réduisez le risque réputationnel interne et vous améliorez "
                "la valeur perçue de vos engagements RSE auprès des collaborateurs."
            )

    else:  # governance
        if not has_data:
            title = "Formaliser des objectifs RSE mesurables et tracés"
            why = (
                "Vous ne disposez pas aujourd'hui d'objectifs RSE formalisés, "
                "ni d'un dispositif structuré de suivi et de traçabilité sur vos opérations."
            )
            action = (
                "Utiliser la grille de pilotage pour définir, en amont de chaque "
                "opération, 3 à 5 objectifs RSE chiffrés avec un référent nommé et "
                "un point de suivi à J+30."
            )
            impact = (
                "Vous sécurisez la traçabilité attendue en audit CSRD et vous "
                "transformez vos engagements RSE en trajectoire opposable."
            )
        else:
            title = "Consolider le pilotage des objectifs RSE"
            why = (
                "Des objectifs RSE existent mais leur suivi et leur traçabilité "
                "restent partiels, ce qui fragilise leur valeur en audit comme en "
                "communication externe."
            )
            action = (
                "Systématiser la revue à J+30, archiver les résultats dans un "
                "espace commun et documenter les écarts avec un plan d'action daté."
            )
            impact = (
                "Vous transformez un pilotage fragile en dispositif auditable et "
                "vous ancrez la démarche RSE dans la discipline de gestion de l'entreprise."
            )

    return RSERecommendation(
        title=title,
        priority=priority,  # type: ignore[arg-type]
        dimension=dimension,  # type: ignore[arg-type]
        why=why,
        action=action,
        when=when,
        impact=impact,
        tool=tool,
    )


# Messages de gap au ton business : phrase d'état puis phrase d'impact,
# phrasées à la deuxième personne pour interpeller le décideur.
_RSE_MISSING_MESSAGES: Dict[str, Dict[str, str]] = {
    "environment": {
        "message": (
            "Vous ne mesurez pas actuellement l'impact environnemental de vos "
            "opérations (déplacements, restauration, déchets)."
        ),
        "impact": (
            "Vous ne pouvez pas piloter ni améliorer vos pratiques, et vous "
            "restez exposé à un risque de greenwashing en l'absence de données factuelles."
        ),
    },
    "social": {
        "message": (
            "Vous ne mesurez pas actuellement la perception RSE, la compréhension "
            "des engagements ni l'inclusion ressentie par vos participants."
        ),
        "impact": (
            "Vous ne pouvez pas objectiver la qualité sociale de vos opérations "
            "ni prévenir les angles morts d'exclusion avant qu'ils ne deviennent "
            "un enjeu réputationnel."
        ),
    },
    "governance": {
        "message": (
            "Vous ne disposez pas aujourd'hui d'objectifs RSE formalisés ni d'un "
            "suivi structuré de leur atteinte."
        ),
        "impact": (
            "Vous ne pouvez pas démontrer la réalité de vos engagements en audit "
            "ou en reporting extra-financier, et vous perdez la capacité de piloter "
            "leur progression dans le temps."
        ),
    },
}


def _rse_gap_missing(dimension: str) -> RSEGap:
    content = _RSE_MISSING_MESSAGES[dimension]
    return RSEGap(
        dimension=dimension,  # type: ignore[arg-type]
        message=content["message"],
        impact=content["impact"],
    )


def _rse_gap_fragile(dimension: str, count: int, avg_conf: float) -> RSEGap:
    label = RSE_DIMENSION_LABEL_FR[dimension]
    if count == 1:
        issue = "la mesure ne repose que sur un seul indicateur"
    elif avg_conf < 0.5:
        issue = (
            f"la fiabilité des mesures collectées reste faible "
            f"({int(round(avg_conf * 100))} %)"
        )
    else:
        issue = f"la mesure reste partielle ({count} indicateurs seulement)"
    return RSEGap(
        dimension=dimension,  # type: ignore[arg-type]
        message=f"Mesure {label} encore fragile — {issue}.",
        impact=(
            f"Le score {label} existe mais repose sur une base trop étroite pour "
            "servir de socle de décision ou de communication externe."
        ),
    )


def _rse_headline(overall: float, reliability: str) -> str:
    if reliability == "low":
        return "Diagnostic RSE non concluant — données insuffisantes"
    if overall >= 70:
        return "Performance RSE solide"
    if overall >= 50:
        return "Performance RSE en construction"
    return "Performance RSE fragile"


def _rse_key_insight(
    pillar_scores: Dict[str, float],
    missing: List[str],
    reliability: str,
) -> str:
    if reliability == "low":
        if missing:
            label = RSE_DIMENSION_LABEL_FR[missing[0]]
            return (
                f"Priorité : amorcer la mesure {label} pour sortir de l'angle mort "
                "et construire une base de pilotage crédible."
            )
        return (
            "Priorité : élargir la collecte RSE pour sécuriser la fiabilité du "
            "diagnostic avant d'engager toute décision stratégique."
        )

    if not pillar_scores:
        return "Aucun pilier RSE mesuré — le diagnostic reste à amorcer."

    weakest_dim, weakest_score = min(pillar_scores.items(), key=lambda kv: kv[1])
    label = RSE_DIMENSION_LABEL_FR[weakest_dim]
    return (
        f"Le principal levier RSE à activer est la dimension {label} "
        f"({int(round(weakest_score))}/100)."
    )


def interpret_rse(signals: Any) -> dict:
    """
    Interprétation RSE (ESG) à partir de la liste de signaux KPI.

    Produit :
    - summary : scores E/S/G + score global + headline/key_insight + reliability
    - recommendations : 1 recommandation maximum par pilier ESG faible ou non
      mesuré (au-dessus du seuil de vigilance, on s'abstient), plafonné à 3.
      Chaque recommandation embarque un outil statique prêt à l'emploi
      (questionnaire, grille, baromètre) couvrant les sous-dimensions clés
      du pilier.
    - gaps : dimensions absentes (message business "Vous ne mesurez pas…"
      + impact "Vous ne pouvez pas…") ou mesurées de façon fragile.

    Ne modifie pas `score_momentum` et ne dépend pas de `interpret_score`.
    `signals` est une list de DimensionSignal (ou dicts équivalents).
    """
    # Normalisation d'entrée — supporte list[DimensionSignal] ou list[dict].
    raw_signals: Iterable[Any]
    if signals is None:
        raw_signals = []
    elif isinstance(signals, Iterable):
        raw_signals = signals
    else:
        raw_signals = []

    # On ne garde que les signaux identifiés comme RSE (via kpi_id connu).
    rse_signals: Dict[str, List[Dict[str, Any]]] = {
        "environment": [],
        "social": [],
        "governance": [],
    }
    for sig in raw_signals:
        data = _rse_signal_to_dict(sig)
        kpi_id = data.get("kpi_id")
        if not kpi_id:
            continue
        dim = RSE_KPI_DIMENSION.get(kpi_id)
        if dim is None:
            continue
        rse_signals[dim].append(data)

    # Score par pilier.
    pillar_stats: Dict[str, Dict[str, float]] = {}
    for dim, items in rse_signals.items():
        score, avg_conf, count = _rse_bucket_score(items)
        pillar_stats[dim] = {"score": score, "avg_confidence": avg_conf, "count": count}

    present_pillars = {d: s for d, s in pillar_stats.items() if s["count"] > 0}
    missing_pillars = [d for d, s in pillar_stats.items() if s["count"] == 0]

    # Score RSE global : moyenne simple des piliers présents (les piliers ESG
    # étant pairs, on évite toute pondération arbitraire en V1).
    if present_pillars:
        overall = round(
            sum(s["score"] for s in present_pillars.values()) / len(present_pillars),
            2,
        )
    else:
        overall = 0.0

    total_signals = sum(s["count"] for s in pillar_stats.values())
    avg_confidence = (
        sum(s["avg_confidence"] * s["count"] for s in present_pillars.values())
        / max(1, total_signals)
    )

    reliability = _rse_reliability(
        total_signals=total_signals,
        missing_pillars=len(missing_pillars),
        avg_confidence=avg_confidence,
    )

    # Gaps : piliers absents + piliers fragiles (1 seul indicateur ou confiance < 50 %).
    gaps: List[RSEGap] = []
    for dim in missing_pillars:
        gaps.append(_rse_gap_missing(dim))
    for dim, stats in present_pillars.items():
        if stats["count"] == 1 or stats["avg_confidence"] < 0.5:
            gaps.append(_rse_gap_fragile(dim, int(stats["count"]), stats["avg_confidence"]))

    # Recommandations : uniquement sur les piliers faibles ou non mesurés,
    # une recommandation maximum par pilier, triée par priorité et plafonnée à 3.
    recommendations: List[RSERecommendation] = []
    for dim in ("environment", "social", "governance"):
        has_data = dim in present_pillars
        score = present_pillars.get(dim, {}).get("score", 0.0)
        reco = _build_rse_recommendation(dim, score, has_data)
        if reco is not None:
            recommendations.append(reco)

    priority_rank = {"haute": 0, "moyenne": 1, "basse": 2}
    recommendations.sort(key=lambda r: priority_rank.get(r.priority, 9))
    recommendations = recommendations[:3]

    pillar_scores_only = {d: s["score"] for d, s in present_pillars.items()}
    summary = RSESummary(
        headline=_rse_headline(overall, reliability),
        key_insight=_rse_key_insight(pillar_scores_only, missing_pillars, reliability),
        environment_score=pillar_stats["environment"]["score"],
        social_score=pillar_stats["social"]["score"],
        governance_score=pillar_stats["governance"]["score"],
        overall_rse_score=overall,
        reliability=reliability,  # type: ignore[arg-type]
    )

    interpretation = RSEInterpretation(
        summary=summary,
        recommendations=recommendations,
        gaps=gaps,
    )

    # Le contrat d'API retourne un dict : on s'appuie sur pydantic pour
    # produire une structure JSON-safe.
    return interpretation.model_dump()