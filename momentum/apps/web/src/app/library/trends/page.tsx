"use client";

import { useEffect, useMemo, useState } from "react";

import {
  API_BASE_URL,
  DIMENSION_COLORS,
  DIMENSION_KEYS,
  DIMENSION_LABELS,
  DimensionKey,
  INITIATIVE_LABELS,
  ProjectSummary,
  formatDateFR,
} from "../shared";

type TrendsResponse = {
  unlocked: boolean;
  sample_size: number;
  minimum_required: number;
  points: {
    project_id: string;
    name: string;
    created_at: string;
    overall_score: number | null;
    dimension_scores: Record<string, number | null>;
  }[];
  annotations: { project_id: string; created_at: string; label: string }[];
  interpretations: string[];
};

type LineKey = "overall" | DimensionKey;

export default function TrendsPage() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [pool, setPool] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [initiativeType, setInitiativeType] = useState("");
  const [audience, setAudience] = useState("");
  const [intent, setIntent] = useState("");
  const [visible, setVisible] = useState<Record<LineKey, boolean>>({
    overall: true,
    reach: false,
    engagement: false,
    appropriation: false,
    impact: false,
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/projects`)
      .then((r) => r.json())
      .then((arr: ProjectSummary[]) => setPool(arr.filter((p) => p.status !== "archived")))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (initiativeType) qs.set("initiative_type", initiativeType);
    if (audience) qs.set("audience", audience);
    if (intent) qs.set("intent", intent);
    fetch(`${API_BASE_URL}/analytics/trends?${qs.toString()}`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, [initiativeType, audience, intent]);

  const audiences = useMemo(
    () => Array.from(new Set((pool ?? []).map((p) => p.audience).filter(Boolean))) as string[],
    [pool],
  );
  const intents = useMemo(
    () => Array.from(new Set((pool ?? []).map((p) => p.intent).filter(Boolean))) as string[],
    [pool],
  );

  if (error) return <div style={errBox}>Erreur : {error}</div>;
  if (!data) return <div style={{ color: "#64748b" }}>Chargement…</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, margin: "0 0 4px 0" }}>Courbes de progression</h1>
      <p style={{ color: "#94a3b8", margin: "0 0 24px 0", fontSize: 14 }}>
        Évolution du score global et des 4 dimensions dans le temps.{" "}
        {data.sample_size < data.minimum_required
          ? `Minimum ${data.minimum_required} projets requis — ${data.sample_size} actuellement.`
          : `Basé sur ${data.sample_size} projets.`}
      </p>

      {/* Filtres */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <select value={initiativeType} onChange={(e) => setInitiativeType(e.target.value)} style={selectStyle}>
          <option value="">Tous types d'action</option>
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
      </div>

      {!data.unlocked ? (
        <div style={emptyBox}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>🔒 Courbes verrouillées</div>
          <div style={{ color: "#94a3b8" }}>
            {data.interpretations[0] ??
              `Encore ${data.minimum_required - data.sample_size} projet(s) à sauvegarder pour débloquer.`}
          </div>
        </div>
      ) : (
        <>
          {/* Toggle lignes */}
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <ToggleChip
              label="Score global"
              color="#4d5fff"
              active={visible.overall}
              onClick={() => setVisible((v) => ({ ...v, overall: !v.overall }))}
            />
            {DIMENSION_KEYS.map((d) => (
              <ToggleChip
                key={d}
                label={DIMENSION_LABELS[d]}
                color={DIMENSION_COLORS[d]}
                active={visible[d]}
                onClick={() => setVisible((v) => ({ ...v, [d]: !v[d] }))}
              />
            ))}
          </div>

          <LineChart data={data} visible={visible} />

          {data.interpretations.length > 0 && (
            <div
              style={{
                marginTop: 24,
                padding: 18,
                borderRadius: 10,
                background: "rgba(77,95,255,0.06)",
                border: "1px solid rgba(77,95,255,0.2)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#a5b4fc",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                Lecture automatique
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, color: "#cbd5e1", lineHeight: 1.7 }}>
                {data.interpretations.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ToggleChip({
  label,
  color,
  active,
  onClick,
}: {
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        border: `1px solid ${active ? color : "rgba(148,163,184,0.25)"}`,
        background: active ? color + "22" : "transparent",
        color: active ? color : "#94a3b8",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: color,
          opacity: active ? 1 : 0.4,
        }}
      />
      {label}
    </button>
  );
}

function LineChart({
  data,
  visible,
}: {
  data: TrendsResponse;
  visible: Record<LineKey, boolean>;
}) {
  const W = 900;
  const H = 380;
  const PAD = { top: 20, right: 30, bottom: 50, left: 40 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  if (data.points.length === 0) {
    return <div style={{ color: "#64748b", padding: 20 }}>Aucune donnée.</div>;
  }

  // X = index chronologique (dates inégales ⇒ index est plus lisible qu'un temps absolu).
  const n = data.points.length;
  const xOf = (i: number) => (n === 1 ? plotW / 2 : (i * plotW) / (n - 1));
  const yOf = (score: number) => plotH - (score / 100) * plotH;

  const lines: { key: LineKey; color: string; points: { i: number; v: number }[] }[] = [
    {
      key: "overall",
      color: "#4d5fff",
      points: data.points
        .map((p, i) => ({ i, v: p.overall_score }))
        .filter((x): x is { i: number; v: number } => x.v !== null),
    },
    ...DIMENSION_KEYS.map((d) => ({
      key: d,
      color: DIMENSION_COLORS[d],
      points: data.points
        .map((p, i) => ({ i, v: p.dimension_scores[d] ?? null }))
        .filter((x): x is { i: number; v: number } => x.v !== null),
    })),
  ];

  const annotationIdx = (projectId: string) =>
    data.points.findIndex((p) => p.project_id === projectId);

  return (
    <div
      style={{
        padding: 20,
        borderRadius: 10,
        background: "rgba(148,163,184,0.05)",
        border: "1px solid rgba(148,163,184,0.15)",
        overflowX: "auto",
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 600, height: "auto" }}>
        {/* Grille horizontale */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + yOf(v)}
              y2={PAD.top + yOf(v)}
              stroke="rgba(148,163,184,0.12)"
              strokeDasharray={v === 0 || v === 100 ? "" : "2 4"}
            />
            <text x={PAD.left - 6} y={PAD.top + yOf(v) + 4} fontSize={10} fill="#64748b" textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {/* Courbes */}
        {lines.map(
          (line) =>
            visible[line.key] &&
            line.points.length > 0 && (
              <g key={line.key}>
                <polyline
                  points={line.points
                    .map((pt) => `${PAD.left + xOf(pt.i)},${PAD.top + yOf(pt.v)}`)
                    .join(" ")}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={line.key === "overall" ? 2.5 : 1.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  opacity={line.key === "overall" ? 1 : 0.8}
                />
                {line.points.map((pt) => (
                  <circle
                    key={pt.i}
                    cx={PAD.left + xOf(pt.i)}
                    cy={PAD.top + yOf(pt.v)}
                    r={line.key === "overall" ? 4 : 3}
                    fill={line.color}
                    stroke="#0a0d1a"
                    strokeWidth={1.5}
                  >
                    <title>
                      {line.key === "overall" ? "Score global" : DIMENSION_LABELS[line.key as DimensionKey]}
                      {" : "}
                      {Math.round(pt.v)}/100 — {data.points[pt.i].name}
                    </title>
                  </circle>
                ))}
              </g>
            ),
        )}

        {/* Annotations */}
        {data.annotations.map((a, i) => {
          const idx = annotationIdx(a.project_id);
          if (idx < 0) return null;
          const pt = data.points[idx];
          if (pt.overall_score === null) return null;
          const x = PAD.left + xOf(idx);
          const y = PAD.top + yOf(pt.overall_score);
          const labelAbove = i % 2 === 0;
          return (
            <g key={i}>
              <line x1={x} y1={y} x2={x} y2={labelAbove ? y - 22 : y + 22} stroke="#94a3b8" strokeDasharray="2 3" />
              <text
                x={x}
                y={labelAbove ? y - 26 : y + 32}
                fontSize={10}
                fill="#cbd5e1"
                textAnchor="middle"
              >
                {a.label}
              </text>
            </g>
          );
        })}

        {/* Axe X : labels des projets */}
        {data.points.map((p, i) => (
          <text
            key={p.project_id}
            x={PAD.left + xOf(i)}
            y={H - PAD.bottom + 18}
            fontSize={10}
            fill="#64748b"
            textAnchor="middle"
          >
            {formatDateFR(p.created_at)}
          </text>
        ))}
      </svg>
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
  padding: 16,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
};
