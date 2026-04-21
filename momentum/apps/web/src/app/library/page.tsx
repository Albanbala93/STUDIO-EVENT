"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  API_BASE_URL,
  INITIATIVE_LABELS,
  ProjectSummary,
  formatDateFR,
  reliabilityDot,
  reliabilityLabel,
  scoreColor,
} from "./shared";

type SortKey = "recent" | "score_desc" | "score_asc" | "alpha";

export default function LibraryPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [audience, setAudience] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [period, setPeriod] = useState<"all" | "30d" | "90d" | "365d">("all");
  const [intent, setIntent] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    fetch(`${API_BASE_URL}/projects`)
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then(setProjects)
      .catch((e) => setError(e.message));
  }, []);

  const audiences = useMemo(() => {
    if (!projects) return [];
    return Array.from(new Set(projects.map((p) => p.audience).filter(Boolean))) as string[];
  }, [projects]);

  const intents = useMemo(() => {
    if (!projects) return [];
    return Array.from(new Set(projects.map((p) => p.intent).filter(Boolean))) as string[];
  }, [projects]);

  const filtered = useMemo(() => {
    if (!projects) return [];
    let out = projects;
    if (!showArchived) out = out.filter((p) => p.status !== "archived");
    if (type) out = out.filter((p) => p.initiative_type === type);
    if (audience) out = out.filter((p) => p.audience === audience);
    if (intent) out = out.filter((p) => p.intent === intent);
    if (minScore > 0)
      out = out.filter((p) => (p.overall_score ?? 0) >= minScore);
    if (period !== "all") {
      const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
      const cutoff = Date.now() - days * 86400 * 1000;
      out = out.filter((p) => new Date(p.created_at).getTime() >= cutoff);
    }
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.intent ?? "").toLowerCase().includes(needle) ||
          (p.audience ?? "").toLowerCase().includes(needle),
      );
    }
    const sorted = [...out];
    if (sort === "recent")
      sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else if (sort === "score_desc")
      sorted.sort((a, b) => (b.overall_score ?? -1) - (a.overall_score ?? -1));
    else if (sort === "score_asc")
      sorted.sort((a, b) => (a.overall_score ?? 999) - (b.overall_score ?? 999));
    else if (sort === "alpha") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [projects, q, type, audience, intent, minScore, period, showArchived, sort]);

  async function toggleArchive(p: ProjectSummary) {
    const next = p.status === "archived" ? "analyzed" : "archived";
    const res = await fetch(`${API_BASE_URL}/projects/${p.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setProjects((prev) =>
        prev ? prev.map((x) => (x.id === p.id ? { ...x, status: next } : x)) : prev,
      );
    }
  }

  if (error)
    return (
      <div style={errBox}>
        Impossible de charger la bibliothèque : {error}
      </div>
    );

  if (!projects)
    return <div style={{ color: "#64748b" }}>Chargement…</div>;

  const total = projects.filter((p) => p.status !== "archived").length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, margin: "0 0 4px 0" }}>Bibliothèque de projets</h1>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: 14 }}>
          {total === 0
            ? "Aucun projet sauvegardé pour le moment."
            : `Basé sur ${total} projet${total > 1 ? "s" : ""}${
                total < 5 ? " — insights à consolider avec davantage de données" : ""
              }`}
        </p>
      </div>

      {total === 0 && (
        <div style={emptyBox}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Lancez votre première analyse
          </div>
          <div style={{ color: "#94a3b8", marginBottom: 16 }}>
            Chaque diagnostic sauvegardé alimentera votre mémoire stratégique.
          </div>
          <Link href="/diagnostic" style={primaryBtn}>
            Démarrer un diagnostic →
          </Link>
        </div>
      )}

      {total > 0 && (
        <>
          {/* Barre de recherche + tri */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              placeholder="Rechercher par nom, audience ou intention…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{
                flex: "1 1 300px",
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(148,163,184,0.08)",
                border: "1px solid rgba(148,163,184,0.2)",
                color: "#e2e8f0",
                fontSize: 14,
              }}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              style={selectStyle}
            >
              <option value="recent">Plus récent</option>
              <option value="score_desc">Score décroissant</option>
              <option value="score_asc">Score croissant</option>
              <option value="alpha">Alphabétique</option>
            </select>
          </div>

          {/* Filtres */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
              <option value="">Tous les types</option>
              {Object.entries(INITIATIVE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={selectStyle}>
              <option value="">Toutes audiences</option>
              {audiences.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select value={intent} onChange={(e) => setIntent(e.target.value)} style={selectStyle}>
              <option value="">Toutes intentions</option>
              {intents.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
              style={selectStyle}
            >
              <option value="all">Toute période</option>
              <option value="30d">30 derniers jours</option>
              <option value="90d">90 derniers jours</option>
              <option value="365d">12 derniers mois</option>
            </select>
            <select
              value={String(minScore)}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={selectStyle}
            >
              <option value="0">Score min : aucun</option>
              <option value="40">Score ≥ 40</option>
              <option value="65">Score ≥ 65</option>
              <option value="80">Score ≥ 80</option>
            </select>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                fontSize: 13,
                color: "#cbd5e1",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Voir archivés
            </label>
          </div>

          {filtered.length === 0 ? (
            <div style={emptyBox}>Aucun projet ne correspond à ces filtres.</div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 14,
              }}
            >
              {filtered.map((p) => (
                <ProjectCard key={p.id} p={p} onToggleArchive={() => toggleArchive(p)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProjectCard({
  p,
  onToggleArchive,
}: {
  p: ProjectSummary;
  onToggleArchive: () => void;
}) {
  const color = scoreColor(p.overall_score);
  const archived = p.status === "archived";

  return (
    <div
      style={{
        padding: 18,
        borderRadius: 10,
        background: archived ? "rgba(148,163,184,0.04)" : "rgba(148,163,184,0.06)",
        border: "1px solid rgba(148,163,184,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        opacity: archived ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <Link
          href={`/projects/${p.id}`}
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: "#e2e8f0",
            textDecoration: "none",
            lineHeight: 1.3,
          }}
        >
          {p.name}
        </Link>
        <div
          style={{
            padding: "3px 10px",
            borderRadius: 4,
            background: color + "22",
            color,
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          {p.overall_score !== null ? Math.round(p.overall_score) : "—"}
          <span style={{ fontSize: 10, opacity: 0.7 }}>/100</span>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>
        {(p.initiative_type && INITIATIVE_LABELS[p.initiative_type]) || p.initiative_type || "—"}
        {p.audience ? ` · ${p.audience}` : ""}
        <br />
        {formatDateFR(p.created_at)}
      </div>

      {p.intent && (
        <div style={{ fontSize: 12, color: "#cbd5e1", fontStyle: "italic" }}>
          « {p.intent} »
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "auto",
          paddingTop: 8,
          borderTop: "1px solid rgba(148,163,184,0.1)",
        }}
      >
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          {reliabilityDot(p.confidence_score)} Fiabilité {reliabilityLabel(p.confidence_score)}
          {" · "}
          <span
            style={{
              color: archived ? "#64748b" : "#84cc16",
              fontWeight: 600,
            }}
          >
            {archived ? "Archivé" : "Analysé"}
          </span>
        </span>
        <span style={{ display: "inline-flex", gap: 10 }}>
          <Link
            href={`/projects/${p.id}/report`}
            style={{
              color: "#7dd3fc",
              fontSize: 11,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            📄 Rapport
          </Link>
          <button
            onClick={onToggleArchive}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontSize: 11,
              cursor: "pointer",
              textDecoration: "underline",
              padding: 0,
            }}
          >
            {archived ? "Désarchiver" : "Archiver"}
          </button>
        </span>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 6,
  background: "rgba(148,163,184,0.08)",
  border: "1px solid rgba(148,163,184,0.2)",
  color: "#e2e8f0",
  fontSize: 13,
  cursor: "pointer",
};

const emptyBox: React.CSSProperties = {
  padding: 40,
  borderRadius: 10,
  background: "rgba(148,163,184,0.04)",
  border: "1px dashed rgba(148,163,184,0.2)",
  textAlign: "center",
  color: "#94a3b8",
};

const errBox: React.CSSProperties = {
  padding: 20,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 8,
  background: "#4d5fff",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 14,
};
