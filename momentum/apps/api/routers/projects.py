"""
Persistance légère des diagnostics (Module 4 — mémoire projet).

Stockage : SQLite local (`apps/api/momentum.db`), créé automatiquement au démarrage.
Objectif MVP : pouvoir enregistrer, lister et rouvrir un diagnostic.
Pas de tenant, pas d'auth à ce stade — sera ajouté quand le modèle multi-tenant sera branché.
"""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

DB_PATH = Path(__file__).resolve().parent.parent / "momentum.db"

router = APIRouter(prefix="/projects", tags=["Projects"])


def _connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_schema() -> None:
    """Crée la table projects si absente, puis applique les migrations légères."""
    with _connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS projects (
                id               TEXT PRIMARY KEY,
                name             TEXT NOT NULL,
                initiative_type  TEXT,
                audience         TEXT,
                intent           TEXT,
                overall_score    REAL,
                confidence_score REAL,
                created_at       TEXT NOT NULL,
                payload          TEXT NOT NULL
            )
            """
        )
        # Migration v2 : statut projet (analyzed | archived).
        cols = {r[1] for r in conn.execute("PRAGMA table_info(projects)").fetchall()}
        if "status" not in cols:
            conn.execute("ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'analyzed'")
        if "brief_generated_at" not in cols:
            conn.execute("ALTER TABLE projects ADD COLUMN brief_generated_at TEXT")


_init_schema()


# ── Schémas ─────────────────────────────────────────────────────────


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    initiative_type: str | None = None
    audience: str | None = None
    intent: str | None = None
    overall_score: float | None = None
    confidence_score: float | None = None
    # Payload = état intégral du wizard + diagnostic brut renvoyé par l'API.
    payload: dict[str, Any]


class ProjectSummary(BaseModel):
    id: str
    name: str
    initiative_type: str | None
    audience: str | None
    intent: str | None
    overall_score: float | None
    confidence_score: float | None
    created_at: str
    status: str = "analyzed"


class ProjectFull(ProjectSummary):
    payload: dict[str, Any]


class StatusUpdate(BaseModel):
    status: str  # analyzed | archived


# ── Endpoints ───────────────────────────────────────────────────────


@router.post("", response_model=ProjectSummary, status_code=201)
def create_project(body: ProjectCreate) -> ProjectSummary:
    """Enregistre un projet. Retourne le résumé avec l'id généré."""
    pid = uuid.uuid4().hex[:12]
    created_at = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")

    with _connection() as conn:
        conn.execute(
            """
            INSERT INTO projects
              (id, name, initiative_type, audience, intent,
               overall_score, confidence_score, created_at, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                pid, body.name, body.initiative_type, body.audience, body.intent,
                body.overall_score, body.confidence_score, created_at,
                json.dumps(body.payload, ensure_ascii=False),
            ),
        )

    return ProjectSummary(
        id=pid,
        name=body.name,
        initiative_type=body.initiative_type,
        audience=body.audience,
        intent=body.intent,
        overall_score=body.overall_score,
        confidence_score=body.confidence_score,
        created_at=created_at,
        status="analyzed",
    )


@router.get("", response_model=list[ProjectSummary])
def list_projects(limit: int = 200) -> list[ProjectSummary]:
    """Liste les projets enregistrés, plus récents d'abord."""
    with _connection() as conn:
        rows = conn.execute(
            """
            SELECT id, name, initiative_type, audience, intent,
                   overall_score, confidence_score, created_at, status
            FROM projects
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()

    return [ProjectSummary(**dict(row)) for row in rows]


@router.patch("/{project_id}/status", response_model=ProjectSummary)
def update_status(project_id: str, body: StatusUpdate) -> ProjectSummary:
    if body.status not in ("analyzed", "archived"):
        raise HTTPException(status_code=400, detail="status must be 'analyzed' or 'archived'")
    with _connection() as conn:
        result = conn.execute(
            "UPDATE projects SET status = ? WHERE id = ?", (body.status, project_id)
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        row = conn.execute(
            """
            SELECT id, name, initiative_type, audience, intent,
                   overall_score, confidence_score, created_at, status
            FROM projects WHERE id = ?
            """,
            (project_id,),
        ).fetchone()
    return ProjectSummary(**dict(row))


@router.get("/{project_id}", response_model=ProjectFull)
def get_project(project_id: str) -> ProjectFull:
    """Retourne le projet complet (wizard state + diagnostic) pour ré-ouverture."""
    with _connection() as conn:
        row = conn.execute(
            "SELECT * FROM projects WHERE id = ?", (project_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Project not found")

    data = dict(row)
    data["payload"] = json.loads(data["payload"])
    return ProjectFull(**data)


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: str) -> None:
    with _connection() as conn:
        result = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Project not found")
