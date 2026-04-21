"use client";

import { useEffect, useMemo, useState } from "react";

import {
  API_BASE_URL,
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  INITIATIVE_LABELS,
  ProjectSummary,
  formatDateFR,
  reliabilityLabel,
  scoreColor,
} from "../shared";

type CompareResponse = {
  projects: {
    id: string;
    name: string;
    initiative_type: string | null;
    audience: string | null;
    created_at: string;
    overall_score: number | null;
    confidence_score: number | null;
    dimension_scores: Record<string, number | null>;
  }[];
  averages: Record<string, number | null>;
  distinguishing_factors: string[];
  recurring_weakness: string | null;
  recommendation: string;
};

export default function ComparePage() {
  const [pool, setPool] = useState<ProjectSummary[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/projects`)
      .then((r) => r.json())
      .then((data: ProjectSummary[]) =>
        setPool(data.filter((p) => p.status !== "archived")),
      )
      .catch((e) => setError(e.message));
  }, []);

  const canCompare = selected.length >= 2 && selected.length <= 5;

  async function runCompare() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/analytics/compare?ids=${selected.join(",")}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `API ${res.status}`);
      }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  const bestId = useMemo(() => {
    if (!result) return null;
    return [...result.projects].sort(
      (a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0),
    )[0]?.id;
  }, [result]);

  if (error && !pool)
    return <div style={errBox}>Erreur : {error}</div>;

  if (!pool) return <div style={{ color: "#64748b" }}>Chargement…</div>;

  if (pool.length < 2)
    return (
      <div style={emptyBox}>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          Minimum 2 projets requis
        </div>
        <div style={{ color: "#94a3b8" }}>
          Actuellement {pool.length} projet{pool.length > 1 ? "s" : ""}. Continuez à
          sauvegarder des diagnostics pour activer la comparaison.
        </div>
      </div>
    );

  return (
    <div>
      <h1 style={{ fontSize: 28, margin: "0 0 4px 0" }}>Comparer des projets</h1>
      <p style={{ color: "#94a3b8", margin: "0 0 24px 0", fontSize: 14 }}>
        Sélectionnez 2 à 5 projets pour les analyser côte à côte.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {pool.map((p) => {
          const checked = selected.includes(p.id);
          return (
            <label
              key={p.id}
              style={{
                padding: 12,
                borderRadius: 8,
                background: checked ? "rgba(77,95,255,0.12)" : "rgba(148,163,184,0.05)",
                border: checked ? "1px solid #4d5fff" : "1px solid rgba(148,163,184,0.15)",
                cursor: "pointer",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p.id)}
                style={{ marginTop: 3 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {(p.initiative_type && INITIATIVE_LABELS[p.initiative_type]) || "—"} ·{" "}
                  {formatDateFR(p.created_at)}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: scoreColor(p.overall_score),
                }}
              >
                {p.overall_score !== null ? Math.round(p.overall_score) : "—"}
              </div>
            </label>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={runCompare}
          disabled={!canCompare || loading}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            background: canCompare ? "#4d5fff" : "rgba(148,163,184,0.2)",
            color: "#fff",
            border: "none",
            fontWeight: 600,
            fontSize: 14,
            cursor: canCompare ? "pointer" : "not-allowed",
          }}
        >
          {loading ? "Analyse…" : `Comparer ${selected.length} projet(s)`}
        </button>
        {selected.length > 0 && (
          <button
            onClick={() => setSelected([])}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(148,163,184,0.2)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Réinitialiser
          </button>
        )}
        <span style={{ fontSize: 12, color: "#64748b" }}>
          {selected.length < 2 && "Sélectionner au moins 2 projets."}
          {selected.length >= 2 && selected.length <= 5 && `${selected.length} projet(s) prêts à comparer.`}
          {selected.length > 5 && "Maximum 5 projets."}
        </span>
      </div>

      {error && <div style={errBox}>Erreur : {error}</div>}

      {result && (
        <div style={{ marginTop: 20 }}>
          <div style={{ overflowX: "auto", marginBottom: 28 }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
                minWidth: 600,
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Dimension</th>
                  {result.projects.map((p) => (
                    <th
                      key={p.id}
                      style={{
                        ...thStyle,
                        color: p.id === bestId ? "#22c55e" : "#cbd5e1",
                      }}
                    >
                      {p.name}
                      {p.id === bestId && <span style={{ fontSize: 10 }}> ★</span>}
                    </th>
                  ))}
                  <th style={{ ...thStyle, fontStyle: "italic" }}>Moyenne</th>
                </tr>
              </thead>
              <tbody>
                <Row
                  label="Score global"
                  values={result.projects.map((p) => p.overall_score)}
                  average={result.averages.overall_score}
                  bold
                />
                {DIMENSION_KEYS.map((dim) => (
                  <Row
                    key={dim}
                    label={DIMENSION_LABELS[dim]}
                    values={result.projects.map((p) => p.dimension_scores[dim] ?? null)}
                    average={result.averages[dim]}
                  />
                ))}
                <tr>
                  <td style={{ ...tdStyle, color: "#94a3b8" }}>Fiabilité</td>
                  {result.projects.map((p) => (
                    <td key={p.id} style={{ ...tdStyle, color: "#94a3b8" }}>
                      {reliabilityLabel(p.confidence_score)}
                    </td>
                  ))}
                  <td style={{ ...tdStyle, color: "#64748b" }}>—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            <InsightBox
              title="Ce qui distingue le meilleur projet"
              accent="#22c55e"
              items={result.distinguishing_factors}
            />
            <InsightBox
              title="Faiblesse récurrente"
              accent="#fbbf24"
              items={result.recurring_weakness ? [result.recurring_weakness] : ["Aucun pattern de faiblesse marqué."]}
            />
            <InsightBox
              title="Recommandation"
              accent="#4d5fff"
              items={[result.recommendation]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  values,
  average,
  bold,
}: {
  label: string;
  values: (number | null)[];
  average: number | null;
  bold?: boolean;
}) {
  const maxVal = Math.max(...values.map((v) => v ?? -1));
  return (
    <tr>
      <td style={{ ...tdStyle, fontWeight: bold ? 700 : 400 }}>{label}</td>
      {values.map((v, i) => {
        const isMax = v !== null && v === maxVal && values.filter((x) => x === maxVal).length === 1;
        return (
          <td
            key={i}
            style={{
              ...tdStyle,
              fontWeight: bold ? 700 : 500,
              color: v === null ? "#64748b" : scoreColor(v),
              background: isMax ? "rgba(34,197,94,0.08)" : "transparent",
            }}
          >
            {v === null ? "—" : Math.round(v)}
          </td>
        );
      })}
      <td style={{ ...tdStyle, color: "#94a3b8", fontStyle: "italic" }}>
        {average === null ? "—" : Math.round(average)}
      </td>
    </tr>
  );
}

function InsightBox({
  title,
  accent,
  items,
}: {
  title: string;
  accent: string;
  items: string[];
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 10,
        background: "rgba(148,163,184,0.05)",
        border: "1px solid rgba(148,163,184,0.15)",
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 16, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: 12,
  fontWeight: 600,
  color: "#cbd5e1",
  borderBottom: "1px solid rgba(148,163,184,0.2)",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(148,163,184,0.08)",
};

const errBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
  marginBottom: 16,
};

const emptyBox: React.CSSProperties = {
  padding: 40,
  borderRadius: 10,
  background: "rgba(148,163,184,0.04)",
  border: "1px dashed rgba(148,163,184,0.2)",
  textAlign: "center",
  color: "#94a3b8",
};
