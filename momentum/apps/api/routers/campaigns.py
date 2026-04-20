"""
Module 2 — Pont d'intégration Campaign Studio ↔ Momentum.

Ce routeur :
  • stocke les campagnes (côté Campaign Studio, stub MVP)
  • génère automatiquement un plan de mesure (KPIs + rappels datés) à partir
    des métadonnées de la campagne
  • relie une campagne à un projet Momentum sauvegardé (clôture la boucle)
  • expose un endpoint /memory qui sert le profil de communication Momentum
    à intégrer dans la mémoire stratégique de Campaign Studio
  • trace les synchronisations d'insights vers Campaign Studio

Le tout reste dans la même DB SQLite que les projets et insights pour garder
une démo locale cohérente. À terme, ce serait un service séparé.
"""

from __future__ import annotations

import json
import sqlite3
import statistics
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from . import analytics

DB_PATH = Path(__file__).resolve().parent.parent / "momentum.db"

router = APIRouter(tags=["Integration"])


def _conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


def _init_schema() -> None:
    with _conn() as c:
        c.execute(
            """
            CREATE TABLE IF NOT EXISTS campaigns (
                id                  TEXT PRIMARY KEY,
                name                TEXT NOT NULL,
                brief               TEXT,
                initiative_type     TEXT,
                audience            TEXT,
                audience_size       INTEGER,
                intent              TEXT,
                channels            TEXT,            -- JSON list
                launch_date         TEXT,            -- ISO date
                status              TEXT NOT NULL DEFAULT 'planned',
                                    -- planned | measuring | measured
                momentum_project_id TEXT,            -- FK vers projects.id
                created_at          TEXT NOT NULL,
                last_insights_sync  TEXT             -- ISO datetime
            )
            """
        )


_init_schema()


# ── Schémas ────────────────────────────────────────────────────────────


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    brief: str | None = None
    initiative_type: str | None = None
    audience: str | None = None
    audience_size: int | None = None
    intent: str | None = None
    channels: list[str] = Field(default_factory=list)
    launch_date: str | None = None  # YYYY-MM-DD


class CampaignSummary(BaseModel):
    id: str
    name: str
    initiative_type: str | None
    audience: str | None
    intent: str | None
    launch_date: str | None
    status: str
    momentum_project_id: str | None
    created_at: str


class CampaignFull(CampaignSummary):
    brief: str | None
    audience_size: int | None
    channels: list[str]


class LinkBody(BaseModel):
    momentum_project_id: str


# ── Générateurs ────────────────────────────────────────────────────────


def _generate_strategic_plan(c: dict[str, Any]) -> dict[str, list[str]]:
    """Mini-plan stratégique stub — Campaign Studio le ferait via LLM en vrai."""
    type_lbl = analytics.INITIATIVE_LABELS_FR.get(
        c["initiative_type"] or "", c["initiative_type"] or "action de communication"
    )
    audience = c["audience"] or "vos collaborateurs"
    intent = c["intent"] or "diffuser un message structurant"

    angles = [
        f"Positionner {type_lbl.lower()} comme un moment d'attention pour {audience.lower()}",
        f"Articuler le message autour de l'intention « {intent} »",
        "Créer un point d'ancrage mémorable (visuel, formule, témoignage)",
    ]
    messages = [
        f"Pour {audience} : poser le contexte business avant l'annonce.",
        "Pour les managers : donner les éléments de langage et anticiper les questions.",
        "Pour la direction : fournir un argumentaire chiffré et un calendrier clair.",
    ]
    if c.get("channels"):
        ch = ", ".join(c["channels"])
        angles.append(f"Activer en cohérence les canaux : {ch}")

    return {
        "angles_strategiques": angles,
        "messages_par_audience": messages,
    }


# Plan de mesure : on adapte les KPIs et le canal de collecte selon le type
# d'initiative. Les rappels sont espacés sur ~14 jours après le lancement.

_KPI_TEMPLATES: dict[str, dict[str, dict[str, str]]] = {
    "reach": {
        "corporate_event": {
            "kpi": "Taux de présence",
            "how": "Liste de présence vs invitations envoyées (badge / scan / émargement)",
        },
        "digital_campaign": {
            "kpi": "Taux d'ouverture / impressions",
            "how": "Outil d'envoi (Mailjet, Sendinblue) + analytics intranet",
        },
        "newsletter": {
            "kpi": "Taux d'ouverture",
            "how": "Statistiques de l'outil d'emailing",
        },
        "change_management": {
            "kpi": "Taux de couverture",
            "how": "Journal d'actions menées par segment d'audience",
        },
        "product_launch": {
            "kpi": "Reach multi-canal",
            "how": "Agrégation impressions + portée intranet + annonces",
        },
    },
    "engagement": {
        "corporate_event": {
            "kpi": "Questions posées + interactions",
            "how": "Comptage live ou via outil interactif (Slido, Mentimeter)",
        },
        "digital_campaign": {
            "kpi": "Taux de clic + réponses",
            "how": "Outil d'envoi + monitoring boîte de réponse",
        },
        "newsletter": {
            "kpi": "Taux de clic + réactions",
            "how": "Analytics emailing + commentaires reçus",
        },
        "change_management": {
            "kpi": "Participation aux ateliers",
            "how": "Inscriptions + présences effectives",
        },
        "product_launch": {
            "kpi": "Demandes de démo / commentaires",
            "how": "Suivi des leads + réactions Yammer/Teams",
        },
    },
    "appropriation": {
        "_default": {
            "kpi": "Sondage post-action de compréhension",
            "how": "Typeform / Google Forms / SurveyMonkey — 3 questions max :\n  • Avez-vous compris le message principal ?\n  • Quels sont les 3 points-clés que vous retenez ?\n  • Reste-t-il des questions sans réponse ?",
        },
    },
    "impact": {
        "_default": {
            "kpi": "Feedback manager + observation terrain",
            "how": "Brief manager 5 min avec grille d'observation simple (3 critères)",
        },
    },
}


def _kpi_for(dim: str, init_type: str | None) -> dict[str, str]:
    table = _KPI_TEMPLATES.get(dim, {})
    if init_type and init_type in table:
        return table[init_type]
    if "_default" in table:
        return table["_default"]
    # Fallback générique
    if init_type and table:
        # Prend le premier disponible
        return next(iter(table.values()))
    return {"kpi": "À définir", "how": "Préciser la modalité de collecte selon le contexte."}


def _measurement_plan(c: dict[str, Any]) -> dict[str, Any]:
    init_type = c["initiative_type"]
    launch = c["launch_date"]
    try:
        launch_dt = datetime.fromisoformat(launch) if launch else datetime.now(timezone.utc).replace(tzinfo=None)
    except ValueError:
        launch_dt = datetime.now(timezone.utc).replace(tzinfo=None)

    def at(days: int) -> str:
        return (launch_dt + timedelta(days=days)).date().isoformat()

    dimensions = []
    for dim, when, fiabilite in [
        ("reach", "J+1", "Élevé (donnée mesurable)"),
        ("engagement", "J+3 à J+7", "Moyen (partiellement mesurable)"),
        ("appropriation", "J+2 maximum", "Élevé si réalisé"),
        ("impact", "J+7 à J+14", "Moyen (déclaratif)"),
    ]:
        meta = _kpi_for(dim, init_type)
        block = {
            "dimension": dim,
            "dimension_label": analytics.DIMENSION_LABELS_FR[dim],
            "kpi_recommande": meta["kpi"],
            "comment_collecter": meta["how"],
            "quand_collecter": when,
            "fiabilite_attendue": fiabilite,
            "priorite": dim == "appropriation",  # angle mort historique signalé
        }
        dimensions.append(block)

    reminders = [
        {"day_offset": 1, "date": at(1), "label": "Collecter les données de mobilisation"},
        {"day_offset": 2, "date": at(2), "label": "Lancer le sondage de compréhension"},
        {"day_offset": 7, "date": at(7), "label": "Collecter les retours managers"},
        {"day_offset": 14, "date": at(14), "label": "Bilan d'impact — saisir dans Momentum"},
    ]

    return {
        "dimensions": dimensions,
        "reminders": reminders,
        "launch_date": launch_dt.date().isoformat(),
    }


# ── Endpoints campaigns ────────────────────────────────────────────────


@router.post("/campaigns", response_model=CampaignSummary, status_code=201, tags=["Campaign Studio"])
def create_campaign(body: CampaignCreate) -> CampaignSummary:
    cid = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    with _conn() as c:
        c.execute(
            """
            INSERT INTO campaigns
              (id, name, brief, initiative_type, audience, audience_size, intent,
               channels, launch_date, status, momentum_project_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned', NULL, ?)
            """,
            (
                cid, body.name, body.brief, body.initiative_type, body.audience,
                body.audience_size, body.intent, json.dumps(body.channels),
                body.launch_date, now,
            ),
        )
    return CampaignSummary(
        id=cid, name=body.name, initiative_type=body.initiative_type,
        audience=body.audience, intent=body.intent, launch_date=body.launch_date,
        status="planned", momentum_project_id=None, created_at=now,
    )


@router.get("/campaigns", response_model=list[CampaignSummary], tags=["Campaign Studio"])
def list_campaigns() -> list[CampaignSummary]:
    with _conn() as c:
        rows = c.execute(
            """
            SELECT id, name, initiative_type, audience, intent, launch_date,
                   status, momentum_project_id, created_at
            FROM campaigns ORDER BY created_at DESC
            """
        ).fetchall()
    return [CampaignSummary(**dict(r)) for r in rows]


def _row_to_full(r: sqlite3.Row) -> CampaignFull:
    d = dict(r)
    try:
        d["channels"] = json.loads(d["channels"]) if d.get("channels") else []
    except json.JSONDecodeError:
        d["channels"] = []
    # Ne pas exposer last_insights_sync ici (champ interne).
    d.pop("last_insights_sync", None)
    return CampaignFull(**d)


@router.get("/campaigns/{campaign_id}", response_model=CampaignFull, tags=["Campaign Studio"])
def get_campaign(campaign_id: str) -> CampaignFull:
    with _conn() as c:
        row = c.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    return _row_to_full(row)


class StrategicPlanResponse(BaseModel):
    campaign: CampaignFull
    angles_strategiques: list[str]
    messages_par_audience: list[str]


@router.get("/campaigns/{campaign_id}/strategic-plan", response_model=StrategicPlanResponse, tags=["Campaign Studio"])
def strategic_plan(campaign_id: str) -> StrategicPlanResponse:
    with _conn() as c:
        row = c.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    full = _row_to_full(row)
    plan = _generate_strategic_plan(dict(row))
    return StrategicPlanResponse(
        campaign=full,
        angles_strategiques=plan["angles_strategiques"],
        messages_par_audience=plan["messages_par_audience"],
    )


class MeasurementPlanDimension(BaseModel):
    dimension: str
    dimension_label: str
    kpi_recommande: str
    comment_collecter: str
    quand_collecter: str
    fiabilite_attendue: str
    priorite: bool


class MeasurementPlanReminder(BaseModel):
    day_offset: int
    date: str
    label: str


class MeasurementPlanResponse(BaseModel):
    campaign_id: str
    campaign_name: str
    launch_date: str
    dimensions: list[MeasurementPlanDimension]
    reminders: list[MeasurementPlanReminder]
    momentum_prefill_url: str  # URL pour pré-remplir le wizard


@router.get("/campaigns/{campaign_id}/measurement-plan", response_model=MeasurementPlanResponse, tags=["Campaign Studio"])
def measurement_plan(campaign_id: str) -> MeasurementPlanResponse:
    with _conn() as c:
        row = c.execute("SELECT * FROM campaigns WHERE id = ?", (campaign_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Campagne introuvable")
    plan = _measurement_plan(dict(row))

    # URL de pré-remplissage du wizard (côté front).
    from urllib.parse import urlencode
    params = {
        "from_campaign": campaign_id,
        "name": row["name"] or "",
        "type": row["initiative_type"] or "",
        "audience": row["audience"] or "",
        "audience_size": str(row["audience_size"] or ""),
        "intent": row["intent"] or "",
    }
    prefill_url = f"/diagnostic?{urlencode({k: v for k, v in params.items() if v})}"

    return MeasurementPlanResponse(
        campaign_id=campaign_id,
        campaign_name=row["name"],
        launch_date=plan["launch_date"],
        dimensions=plan["dimensions"],
        reminders=plan["reminders"],
        momentum_prefill_url=prefill_url,
    )


@router.post("/campaigns/{campaign_id}/link-momentum", response_model=CampaignSummary, tags=["Campaign Studio"])
def link_momentum(campaign_id: str, body: LinkBody) -> CampaignSummary:
    """Relie une campagne CS à un projet Momentum sauvegardé."""
    with _conn() as c:
        # Vérifie que les deux existent.
        proj = c.execute("SELECT id FROM projects WHERE id = ?", (body.momentum_project_id,)).fetchone()
        if not proj:
            raise HTTPException(status_code=404, detail="Projet Momentum introuvable")
        result = c.execute(
            "UPDATE campaigns SET momentum_project_id = ?, status = 'measured' WHERE id = ?",
            (body.momentum_project_id, campaign_id),
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Campagne introuvable")
        row = c.execute(
            """
            SELECT id, name, initiative_type, audience, intent, launch_date,
                   status, momentum_project_id, created_at
            FROM campaigns WHERE id = ?
            """,
            (campaign_id,),
        ).fetchone()
    return CampaignSummary(**dict(row))


# ── Mémoire Momentum (consommée par Campaign Studio) ───────────────────


class MemoryProfile(BaseModel):
    score_moyen: float | None
    point_fort: str | None
    point_faible: str | None
    tendance: str  # progression | stabilite | regression | insuffisant


class MemoryResponse(BaseModel):
    available: bool
    sample_size: int
    minimum_required: int
    last_updated: str
    profil_communication: MemoryProfile
    insights: list[dict[str, Any]]


@router.get("/memory", response_model=MemoryResponse, tags=["Integration"])
def memory_for_campaign_studio() -> MemoryResponse:
    """
    Profil de communication agrégé que Campaign Studio intègre dans sa
    mémoire stratégique permanente. Réutilise la logique du module 4.
    """
    projects = analytics._load_all()
    sample = len(projects)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    if sample == 0:
        return MemoryResponse(
            available=False, sample_size=0, minimum_required=analytics.MIN_PROJECTS_INSIGHTS,
            last_updated=now,
            profil_communication=MemoryProfile(
                score_moyen=None, point_fort=None, point_faible=None, tendance="insuffisant",
            ),
            insights=[],
        )

    overall = [p["overall_score"] for p in projects if p["overall_score"] is not None]
    score_moyen = round(statistics.fmean(overall), 1) if overall else None

    # Points forts / faibles structurels = dimension la plus haute / basse en moyenne.
    dim_means: dict[str, float] = {}
    for d in analytics.DIMENSIONS:
        vals = []
        for p in projects:
            v = analytics._dim_scores(p).get(d)
            if v is not None:
                vals.append(v)
        if vals:
            dim_means[d] = statistics.fmean(vals)

    point_fort = (
        analytics.DIMENSION_LABELS_FR[max(dim_means, key=dim_means.get)] if dim_means else None
    )
    point_faible = (
        analytics.DIMENSION_LABELS_FR[min(dim_means, key=dim_means.get)] if dim_means else None
    )

    # Tendance grossière : compare moyenne 1ère moitié vs 2ème moitié des projets.
    if len(overall) >= 4:
        half = len(overall) // 2
        first = statistics.fmean(overall[:half])
        last = statistics.fmean(overall[half:])
        if last - first >= 5:
            tendance = "progression"
        elif first - last >= 5:
            tendance = "regression"
        else:
            tendance = "stabilite"
    elif sample < analytics.MIN_PROJECTS_INSIGHTS:
        tendance = "insuffisant"
    else:
        tendance = "stabilite"

    insights_resp = analytics.insights() if sample >= analytics.MIN_PROJECTS_INSIGHTS else None
    insights_payload = [i.model_dump() for i in insights_resp.insights] if insights_resp else []

    return MemoryResponse(
        available=sample >= analytics.MIN_PROJECTS_INSIGHTS,
        sample_size=sample,
        minimum_required=analytics.MIN_PROJECTS_INSIGHTS,
        last_updated=now,
        profil_communication=MemoryProfile(
            score_moyen=score_moyen,
            point_fort=point_fort,
            point_faible=point_faible,
            tendance=tendance,
        ),
        insights=insights_payload,
    )


# ── Sync insights vers Campaign Studio ────────────────────────────────


class SyncResponse(BaseModel):
    synced_at: str
    sample_size: int
    insights_count: int
    campaigns_updated: int


@router.post("/campaigns/sync-insights", response_model=SyncResponse, tags=["Integration"])
def sync_insights() -> SyncResponse:
    """
    Trace que les insights Momentum ont été poussés vers Campaign Studio.
    En MVP : marque toutes les campagnes 'planned' avec un timestamp.
    """
    mem = memory_for_campaign_studio()
    if not mem.available:
        raise HTTPException(
            status_code=400,
            detail=f"Au moins {analytics.MIN_PROJECTS_INSIGHTS} projets requis pour synchroniser ({mem.sample_size} actuellement).",
        )
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    with _conn() as c:
        result = c.execute(
            "UPDATE campaigns SET last_insights_sync = ? WHERE status != 'measured'",
            (now,),
        )
    return SyncResponse(
        synced_at=now,
        sample_size=mem.sample_size,
        insights_count=len(mem.insights),
        campaigns_updated=result.rowcount,
    )


# ── Connection dashboard ──────────────────────────────────────────────


class ConnectionDashboard(BaseModel):
    campaigns_being_measured: list[dict[str, Any]]
    insights_active_in_studio: dict[str, Any]
    next_action_to_measure: dict[str, Any] | None


@router.get("/connection-status", response_model=ConnectionDashboard, tags=["Integration"])
def connection_status() -> ConnectionDashboard:
    with _conn() as c:
        camp_rows = c.execute(
            """
            SELECT id, name, initiative_type, status, momentum_project_id,
                   launch_date, last_insights_sync
            FROM campaigns
            ORDER BY COALESCE(launch_date, created_at) DESC
            """
        ).fetchall()
        proj_rows = c.execute(
            "SELECT id, name, overall_score FROM projects WHERE status != 'archived'"
        ).fetchall()

    proj_index = {p["id"]: dict(p) for p in proj_rows}

    being_measured = []
    next_action = None
    today = datetime.now(timezone.utc).date()

    for r in camp_rows:
        d = dict(r)
        proj = proj_index.get(d["momentum_project_id"]) if d["momentum_project_id"] else None
        days_since_launch = None
        if d["launch_date"]:
            try:
                ld = datetime.fromisoformat(d["launch_date"]).date()
                days_since_launch = (today - ld).days
            except ValueError:
                pass

        item = {
            "id": d["id"],
            "name": d["name"],
            "status": d["status"],
            "initiative_type": d["initiative_type"],
            "launch_date": d["launch_date"],
            "days_since_launch": days_since_launch,
            "momentum_project_id": d["momentum_project_id"],
            "overall_score": proj["overall_score"] if proj else None,
        }
        if d["status"] in ("planned", "measuring"):
            being_measured.append(item)
            # La 1ère campagne planifiée non lancée encore = prochaine action.
            if next_action is None and (days_since_launch is None or days_since_launch < 0):
                next_action = item
        else:
            being_measured.append(item)  # measured aussi visible avec score

    mem = memory_for_campaign_studio()
    insights_active = {
        "available": mem.available,
        "sample_size": mem.sample_size,
        "insights_count": len(mem.insights),
        "last_updated": mem.last_updated,
    }

    return ConnectionDashboard(
        campaigns_being_measured=being_measured,
        insights_active_in_studio=insights_active,
        next_action_to_measure=next_action,
    )
