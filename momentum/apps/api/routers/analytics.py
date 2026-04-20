"""
Module 4 — Intelligence stratégique.

Ce routeur transforme l'historique des projets en :
  • comparaisons (2 à 5 projets côte à côte)
  • courbes de progression (score global + 4 dimensions dans le temps)
  • insights rule-based (canal, audience, timing, message)
  • brief markdown prêt à consommer par Campaign Studio

Toute la logique est calculée à la volée à partir du payload JSON des projets
(pas de cache — le dataset attendu reste modeste en MVP).
"""

from __future__ import annotations

import json
import sqlite3
import statistics
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

DB_PATH = Path(__file__).resolve().parent.parent / "momentum.db"

router = APIRouter(prefix="/analytics", tags=["Analytics"])


DIMENSIONS = ("reach", "engagement", "appropriation", "impact")
DIMENSION_LABELS_FR = {
    "reach": "Mobilisation",
    "engagement": "Implication",
    "appropriation": "Compréhension",
    "impact": "Impact",
}
INITIATIVE_LABELS_FR = {
    "corporate_event": "Événement corporate",
    "digital_campaign": "Campagne digitale",
    "change_management": "Accompagnement du changement",
    "newsletter": "Newsletter interne",
    "product_launch": "Lancement produit",
    "other": "Autre initiative",
}

# Seuils doc spec Module 4.
MIN_PROJECTS_TRENDS = 3
MIN_PROJECTS_INSIGHTS = 5
MIN_PROJECTS_PATTERN = 3  # minimum pour formuler un insight "similaire"


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def _load_all() -> list[dict[str, Any]]:
    """Charge tous les projets non archivés avec payload parsé."""
    with _conn() as c:
        rows = c.execute(
            """
            SELECT id, name, initiative_type, audience, intent,
                   overall_score, confidence_score, created_at, status, payload
            FROM projects
            WHERE status != 'archived'
            ORDER BY created_at ASC
            """
        ).fetchall()
    out = []
    for r in rows:
        d = dict(r)
        try:
            d["payload"] = json.loads(d["payload"])
        except json.JSONDecodeError:
            d["payload"] = {}
        out.append(d)
    return out


def _dim_scores(p: dict[str, Any]) -> dict[str, float | None]:
    """Retourne {dim: score} pour un projet, None si dimension absente."""
    try:
        dss = p["payload"]["diagnostic"]["score"]["dimension_scores"]
    except (KeyError, TypeError):
        return {d: None for d in DIMENSIONS}
    out: dict[str, float | None] = {d: None for d in DIMENSIONS}
    for entry in dss:
        dim = entry.get("dimension")
        if dim in DIMENSIONS:
            out[dim] = entry.get("score")
    return out


def _summary(p: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": p["id"],
        "name": p["name"],
        "initiative_type": p["initiative_type"],
        "audience": p["audience"],
        "intent": p["intent"],
        "created_at": p["created_at"],
        "overall_score": p["overall_score"],
        "confidence_score": p["confidence_score"],
        "dimension_scores": _dim_scores(p),
    }


# ── Compare ──────────────────────────────────────────────────────────


class CompareResponse(BaseModel):
    projects: list[dict[str, Any]]
    averages: dict[str, float | None]
    distinguishing_factors: list[str]
    recurring_weakness: str | None
    recommendation: str


@router.get("/compare", response_model=CompareResponse)
def compare(ids: str = Query(..., description="IDs séparés par virgules, 2 à 5")) -> CompareResponse:
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    if not (2 <= len(id_list) <= 5):
        raise HTTPException(status_code=400, detail="Fournir entre 2 et 5 ids séparés par des virgules.")

    all_projects = {p["id"]: p for p in _load_all()}
    selected = [all_projects[i] for i in id_list if i in all_projects]
    if len(selected) != len(id_list):
        raise HTTPException(status_code=404, detail="Un ou plusieurs projets introuvables.")

    summaries = [_summary(p) for p in selected]

    # Moyennes par dimension (en ignorant les None).
    averages: dict[str, float | None] = {}
    for key in ("overall_score", *DIMENSIONS):
        if key == "overall_score":
            vals = [s["overall_score"] for s in summaries if s["overall_score"] is not None]
        else:
            vals = [s["dimension_scores"][key] for s in summaries if s["dimension_scores"].get(key) is not None]
        averages[key] = round(statistics.fmean(vals), 1) if vals else None

    # Meilleur projet = plus haut overall_score.
    best = max(summaries, key=lambda s: s["overall_score"] or 0)
    distinguishing: list[str] = []
    for dim in DIMENSIONS:
        best_val = best["dimension_scores"].get(dim)
        if best_val is None:
            continue
        others = [s["dimension_scores"].get(dim) for s in summaries if s["id"] != best["id"]]
        others = [v for v in others if v is not None]
        if not others:
            continue
        gap = best_val - statistics.fmean(others)
        if gap >= 10:
            distinguishing.append(
                f"{DIMENSION_LABELS_FR[dim]} — {best['name']} mène de +{round(gap)} points"
            )
    if not distinguishing:
        distinguishing = [
            f"Les projets sont très proches — écarts < 10 points sur toutes les dimensions."
        ]

    # Faiblesse récurrente : dimension la plus basse en moyenne.
    dim_avgs = [(d, averages[d]) for d in DIMENSIONS if averages[d] is not None]
    recurring_weakness = None
    if dim_avgs:
        worst_dim, worst_val = min(dim_avgs, key=lambda x: x[1])
        if worst_val < 65:
            recurring_weakness = (
                f"{DIMENSION_LABELS_FR[worst_dim]} : {round(worst_val)}/100 en moyenne sur "
                f"ces {len(summaries)} projets — pattern récurrent."
            )

    # Reco : s'appuie sur best project + faiblesse.
    reco_parts = [
        f"Capitaliser sur les leviers de « {best['name']} » (score {round(best['overall_score'] or 0)})"
    ]
    if recurring_weakness:
        reco_parts.append(f"et prioriser la {DIMENSION_LABELS_FR[worst_dim].lower()} pour les prochaines actions similaires.")
    else:
        reco_parts.append("et maintenir l'équilibre actuel entre les 4 dimensions.")
    recommendation = " ".join(reco_parts)

    return CompareResponse(
        projects=summaries,
        averages=averages,
        distinguishing_factors=distinguishing,
        recurring_weakness=recurring_weakness,
        recommendation=recommendation,
    )


# ── Trends ───────────────────────────────────────────────────────────


class TrendPoint(BaseModel):
    project_id: str
    name: str
    created_at: str
    overall_score: float | None
    dimension_scores: dict[str, float | None]


class TrendAnnotation(BaseModel):
    project_id: str
    created_at: str
    label: str


class TrendsResponse(BaseModel):
    unlocked: bool
    sample_size: int
    minimum_required: int
    points: list[TrendPoint]
    annotations: list[TrendAnnotation]
    interpretations: list[str]


@router.get("/trends", response_model=TrendsResponse)
def trends(
    initiative_type: str | None = None,
    audience: str | None = None,
    intent: str | None = None,
) -> TrendsResponse:
    projects = _load_all()
    if initiative_type:
        projects = [p for p in projects if p["initiative_type"] == initiative_type]
    if audience:
        projects = [p for p in projects if p["audience"] == audience]
    if intent:
        projects = [p for p in projects if p["intent"] == intent]

    sample = len(projects)
    unlocked = sample >= MIN_PROJECTS_TRENDS

    points = [
        TrendPoint(
            project_id=p["id"],
            name=p["name"],
            created_at=p["created_at"],
            overall_score=p["overall_score"],
            dimension_scores=_dim_scores(p),
        )
        for p in projects
    ]

    annotations: list[TrendAnnotation] = []
    interpretations: list[str] = []

    if not unlocked:
        missing = MIN_PROJECTS_TRENDS - sample
        return TrendsResponse(
            unlocked=False,
            sample_size=sample,
            minimum_required=MIN_PROJECTS_TRENDS,
            points=points,
            annotations=[],
            interpretations=[
                f"Plus que {missing} projet{'s' if missing > 1 else ''} pour débloquer les courbes de progression."
            ],
        )

    # Annotation : premier projet (baseline).
    annotations.append(
        TrendAnnotation(
            project_id=points[0].project_id,
            created_at=points[0].created_at,
            label="Première action mesurée",
        )
    )
    # Annotation : plus haut score atteint.
    peak = max(points, key=lambda x: x.overall_score or 0)
    if peak.overall_score is not None:
        annotations.append(
            TrendAnnotation(
                project_id=peak.project_id,
                created_at=peak.created_at,
                label=f"Meilleur score atteint ({round(peak.overall_score)}/100)",
            )
        )

    # Interprétation 1 : tendance générale.
    first_val = points[0].overall_score
    last_val = points[-1].overall_score
    if first_val is not None and last_val is not None:
        delta = round(last_val - first_val)
        sign = "+" if delta >= 0 else ""
        interpretations.append(
            f"Tendance générale : {sign}{delta} points entre la première et la dernière action ({sample} projets)."
        )

    # Interprétation 2 : dimension faible constante.
    dim_values: dict[str, list[float]] = {d: [] for d in DIMENSIONS}
    for pt in points:
        for d in DIMENSIONS:
            v = pt.dimension_scores.get(d)
            if v is not None:
                dim_values[d].append(v)
    dim_means = {d: statistics.fmean(v) for d, v in dim_values.items() if v}
    if dim_means:
        worst = min(dim_means.items(), key=lambda x: x[1])
        interpretations.append(
            f"La {DIMENSION_LABELS_FR[worst[0]].lower()} reste votre dimension la plus faible de façon constante "
            f"({round(worst[1])}/100 en moyenne) — c'est votre priorité #1."
        )

    # Interprétation 3 : surperformance d'un type d'initiative.
    by_type: dict[str, list[float]] = defaultdict(list)
    for p in projects:
        if p["initiative_type"] and p["overall_score"] is not None:
            by_type[p["initiative_type"]].append(p["overall_score"])
    if len(by_type) >= 2:
        ranked = sorted(
            ((t, statistics.fmean(v)) for t, v in by_type.items() if len(v) >= 1),
            key=lambda x: x[1],
            reverse=True,
        )
        top_t, top_v = ranked[0]
        bot_t, bot_v = ranked[-1]
        if top_v - bot_v >= 10:
            interpretations.append(
                f"Vos {INITIATIVE_LABELS_FR.get(top_t, top_t).lower()}s surperforment "
                f"vos {INITIATIVE_LABELS_FR.get(bot_t, bot_t).lower()}s (+{round(top_v - bot_v)} points en moyenne)."
            )

    return TrendsResponse(
        unlocked=True,
        sample_size=sample,
        minimum_required=MIN_PROJECTS_TRENDS,
        points=points,
        annotations=annotations,
        interpretations=interpretations,
    )


# ── Insights + Brief ─────────────────────────────────────────────────


class Insight(BaseModel):
    kind: str  # channel | audience | timing | message
    title: str
    body: str
    recommendation: str
    sample_size: int


class InsightsResponse(BaseModel):
    unlocked: bool
    sample_size: int
    minimum_required: int
    insights: list[Insight]
    generated_at: str


def _pct_missing_appropriation(projects: list[dict[str, Any]]) -> float:
    """Part des projets sans mesure fiable de compréhension."""
    if not projects:
        return 0.0
    missing = 0
    for p in projects:
        dims = _dim_scores(p)
        if dims.get("appropriation") is None:
            missing += 1
    return missing / len(projects)


def _month(iso: str) -> int:
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).month
    except ValueError:
        return 0


def _generate_insights(projects: list[dict[str, Any]]) -> list[Insight]:
    insights: list[Insight] = []

    # INSIGHT CANAL — compare initiative_type sur dim engagement (implication).
    by_type_eng: dict[str, list[float]] = defaultdict(list)
    for p in projects:
        t = p["initiative_type"]
        if not t:
            continue
        eng = _dim_scores(p).get("engagement")
        if eng is not None:
            by_type_eng[t].append(eng)
    type_means = {
        t: statistics.fmean(v) for t, v in by_type_eng.items() if len(v) >= MIN_PROJECTS_PATTERN
    }
    if len(type_means) >= 2:
        ranked = sorted(type_means.items(), key=lambda x: x[1])
        low_t, low_v = ranked[0]
        high_t, high_v = ranked[-1]
        if high_v - low_v >= 10:
            low_lbl = INITIATIVE_LABELS_FR.get(low_t, low_t).lower()
            high_lbl = INITIATIVE_LABELS_FR.get(high_t, high_t).lower()
            insights.append(Insight(
                kind="channel",
                title="Canal le plus engageant",
                body=(
                    f"Dans votre historique, {low_lbl} génère en moyenne {round(low_v)}/100 "
                    f"sur l'implication vs {round(high_v)}/100 pour {high_lbl}."
                ),
                recommendation=(
                    f"Pour vos prochaines actions à fort enjeu d'implication : privilégier "
                    f"{high_lbl} comme canal principal."
                ),
                sample_size=sum(len(v) for v in by_type_eng.values()),
            ))

    # INSIGHT AUDIENCE — compare audience sur dim appropriation (compréhension).
    by_aud_app: dict[str, list[float]] = defaultdict(list)
    for p in projects:
        a = p["audience"]
        if not a:
            continue
        app = _dim_scores(p).get("appropriation")
        if app is not None:
            by_aud_app[a].append(app)
    aud_means = {
        a: statistics.fmean(v) for a, v in by_aud_app.items() if len(v) >= MIN_PROJECTS_PATTERN
    }
    if len(aud_means) >= 2:
        ranked = sorted(aud_means.items(), key=lambda x: x[1])
        low_a, low_v = ranked[0]
        high_a, high_v = ranked[-1]
        if high_v - low_v >= 10:
            insights.append(Insight(
                kind="audience",
                title="Audience en difficulté sur la compréhension",
                body=(
                    f"Les actions ciblant « {low_a} » obtiennent un score de compréhension inférieur "
                    f"de {round(high_v - low_v)} points vs les actions « {high_a} »."
                ),
                recommendation=(
                    f"Renforcer les briefs et éléments de langage pour « {low_a} » : "
                    "points concrets, FAQ dédiées, reformulation des messages clés."
                ),
                sample_size=sum(len(v) for v in by_aud_app.values()),
            ))

    # INSIGHT TIMING — projets de clôture RH (oct/nov/mars) vs reste sur mobilisation.
    closing_months = {3, 10, 11}
    closing = [p for p in projects if _month(p["created_at"]) in closing_months]
    regular = [p for p in projects if _month(p["created_at"]) not in closing_months]
    if len(closing) >= MIN_PROJECTS_PATTERN and len(regular) >= MIN_PROJECTS_PATTERN:
        c_reach = [v for p in closing if (v := _dim_scores(p).get("reach")) is not None]
        r_reach = [v for p in regular if (v := _dim_scores(p).get("reach")) is not None]
        if c_reach and r_reach:
            gap = statistics.fmean(r_reach) - statistics.fmean(c_reach)
            if gap >= 10:
                insights.append(Insight(
                    kind="timing",
                    title="Fenêtre de clôture RH sous-performante",
                    body=(
                        f"Vos {len(closing)} actions lancées en mars/octobre/novembre sous-performent "
                        f"de {round(gap)} points sur la mobilisation vs le reste de l'année."
                    ),
                    recommendation=(
                        "Éviter ces fenêtres pour les annonces stratégiques majeures ; "
                        "les réserver aux communications d'entretien."
                    ),
                    sample_size=len(closing) + len(regular),
                ))

    # INSIGHT MESSAGE — compréhension non mesurée sur >= 50% des projets.
    pct = _pct_missing_appropriation(projects)
    if pct >= 0.5:
        insights.append(Insight(
            kind="message",
            title="Compréhension : angle mort historique",
            body=(
                f"La dimension compréhension est votre angle mort : jamais mesurée de façon "
                f"fiable sur {round(pct * 100)}% de vos projets."
            ),
            recommendation=(
                "Systématiser un sondage de compréhension post-action dès la phase de "
                "planification dans Campaign Studio."
            ),
            sample_size=len(projects),
        ))

    return insights


@router.get("/insights", response_model=InsightsResponse)
def insights() -> InsightsResponse:
    projects = _load_all()
    sample = len(projects)
    unlocked = sample >= MIN_PROJECTS_INSIGHTS
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    if not unlocked:
        return InsightsResponse(
            unlocked=False,
            sample_size=sample,
            minimum_required=MIN_PROJECTS_INSIGHTS,
            insights=[],
            generated_at=now,
        )

    return InsightsResponse(
        unlocked=True,
        sample_size=sample,
        minimum_required=MIN_PROJECTS_INSIGHTS,
        insights=_generate_insights(projects),
        generated_at=now,
    )


class BriefResponse(BaseModel):
    markdown: str
    generated_at: str
    sample_size: int


@router.get("/brief", response_model=BriefResponse)
def brief() -> BriefResponse:
    projects = _load_all()
    sample = len(projects)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    date_fr = datetime.now(timezone.utc).strftime("%d/%m/%Y")

    if sample < MIN_PROJECTS_INSIGHTS:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum {MIN_PROJECTS_INSIGHTS} projets requis ({sample} actuellement).",
        )

    ins = _generate_insights(projects)

    # Top dimensions (ce qui fonctionne) : 3 meilleures moyennes.
    dim_all: dict[str, list[float]] = {d: [] for d in DIMENSIONS}
    for p in projects:
        for d, v in _dim_scores(p).items():
            if v is not None:
                dim_all[d].append(v)
    dim_means = {d: statistics.fmean(v) for d, v in dim_all.items() if v}
    sorted_dims = sorted(dim_means.items(), key=lambda x: x[1], reverse=True)

    fonctionne_lines = []
    for d, v in sorted_dims[:3]:
        if v >= 65:
            fonctionne_lines.append(
                f"→ {DIMENSION_LABELS_FR[d]} solide ({round(v)}/100 en moyenne sur {len(dim_all[d])} projets)"
            )
    if not fonctionne_lines:
        fonctionne_lines = ["→ Pas encore de dimension qui se distingue — continuer à consolider les mesures."]

    sous_perf_lines = []
    for d, v in sorted_dims[-2:]:
        if v < 65:
            sous_perf_lines.append(
                f"→ {DIMENSION_LABELS_FR[d]} récurrente à {round(v)}/100 sur {len(dim_all[d])} projets"
            )
    if not sous_perf_lines:
        sous_perf_lines = ["→ Aucune sous-performance systémique identifiée à ce stade."]

    # Reco canal : meilleur type.
    by_type_overall: dict[str, list[float]] = defaultdict(list)
    for p in projects:
        if p["initiative_type"] and p["overall_score"] is not None:
            by_type_overall[p["initiative_type"]].append(p["overall_score"])
    canal_reco = "—"
    if by_type_overall:
        best_t = max(by_type_overall.items(), key=lambda x: statistics.fmean(x[1]))[0]
        canal_reco = INITIATIVE_LABELS_FR.get(best_t, best_t)

    # Audience à renforcer : audience la plus faible sur appropriation.
    aud_app: dict[str, list[float]] = defaultdict(list)
    for p in projects:
        a = p["audience"]
        app = _dim_scores(p).get("appropriation")
        if a and app is not None:
            aud_app[a].append(app)
    audience_reco = "—"
    if aud_app:
        audience_reco = min(aud_app.items(), key=lambda x: statistics.fmean(x[1]))[0]

    # Mesure à systématiser : dimension la plus faible.
    mesure_reco = "—"
    if sorted_dims:
        mesure_reco = f"la {DIMENSION_LABELS_FR[sorted_dims[-1][0]].lower()}"

    # Timing à éviter.
    timing_reco = "—"
    for i in ins:
        if i.kind == "timing":
            timing_reco = "mars / octobre / novembre (fenêtres de clôture RH)"
            break

    # Angles morts = insights filtrés.
    blind_lines = [f"→ {i.title}" for i in ins if i.kind in ("message", "audience")]
    if not blind_lines:
        blind_lines = ["→ Pas d'angle mort critique détecté à ce stade."]

    md = f"""# BRIEF HISTORIQUE MOMENTUM → CAMPAIGN STUDIO

**Date de génération** : {date_fr}
**Basé sur** : {sample} projets analysés

## CE QUI FONCTIONNE DANS VOTRE ENTREPRISE
{chr(10).join(fonctionne_lines)}

## CE QUI SOUS-PERFORME SYSTÉMATIQUEMENT
{chr(10).join(sous_perf_lines)}

## RECOMMANDATIONS POUR VOTRE PROCHAINE ACTION
→ **Canal prioritaire** : {canal_reco}
→ **Audience à renforcer** : {audience_reco}
→ **Mesure à systématiser** : {mesure_reco}
→ **Timing à éviter** : {timing_reco}

## ANGLES MORTS À COMBLER DÈS LA CONCEPTION
{chr(10).join(blind_lines)}

---
*Généré automatiquement par Momentum à partir de {sample} projets.*
"""

    # Trace : date de dernière génération par projet.
    with _conn() as c:
        c.execute(
            "UPDATE projects SET brief_generated_at = ? WHERE status != 'archived'",
            (now,),
        )

    return BriefResponse(markdown=md, generated_at=now, sample_size=sample)
