"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  API_BASE_URL,
  CampaignFull,
  INITIATIVE_LABELS,
  STATUS_META,
  formatDateFR,
} from "../shared";

const DIM_ICON: Record<string, string> = {
  reach: "📢",
  engagement: "💬",
  appropriation: "🧠",
  impact: "🎯",
};

type StrategicPlan = {
  campaign: CampaignFull;
  angles_strategiques: string[];
  messages_par_audience: string[];
};

type MeasurementPlan = {
  campaign_id: string;
  campaign_name: string;
  launch_date: string;
  dimensions: {
    dimension: string;
    dimension_label: string;
    kpi_recommande: string;
    comment_collecter: string;
    quand_collecter: string;
    fiabilite_attendue: string;
    priorite: boolean;
  }[];
  reminders: { day_offset: number; date: string; label: string }[];
  momentum_prefill_url: string;
};

export default function StudioCampaignPage({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState<StrategicPlan | null>(null);
  const [measure, setMeasure] = useState<MeasurementPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMeasureBlock, setShowMeasureBlock] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE_URL}/campaigns/${params.id}/strategic-plan`).then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      }),
      fetch(`${API_BASE_URL}/campaigns/${params.id}/measurement-plan`).then((r) => r.json()),
    ])
      .then(([s, m]) => {
        setPlan(s);
        setMeasure(m);
      })
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <div style={errBox}>Erreur : {error}</div>;
  if (!plan || !measure) return <div style={{ color: "#a78bfa" }}>Chargement…</div>;

  const c = plan.campaign;
  const meta = STATUS_META[c.status];
  const linkedToMomentum = !!c.momentum_project_id;

  return (
    <div>
      {/* Header campagne */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: "0 0 6px 0" }}>{c.name}</h1>
          <div style={{ fontSize: 13, color: "#a78bfa" }}>
            {(c.initiative_type && INITIATIVE_LABELS[c.initiative_type]) || "Type non défini"}
            {c.audience && ` · ${c.audience}`}
            {c.audience_size ? ` · ${c.audience_size} personnes` : ""}
            {c.launch_date && ` · Lancement ${formatDateFR(c.launch_date)}`}
          </div>
          {c.intent && (
            <div style={{ fontStyle: "italic", color: "#cbd5e1", marginTop: 6, fontSize: 13 }}>
              « {c.intent} »
            </div>
          )}
        </div>
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 6,
            background: meta.color + "22",
            color: meta.color,
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          {meta.icon} {meta.label}
        </div>
      </div>

      {/* Plan stratégique généré */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📋 Plan stratégique</h2>
        <p style={{ color: "#cbd5e1", fontSize: 12, marginBottom: 16, fontStyle: "italic" }}>
          Généré automatiquement par Campaign Studio à partir du brief.
        </p>

        <h3 style={subTitle}>Angles stratégiques</h3>
        <ul style={listStyle}>
          {plan.angles_strategiques.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>

        <h3 style={subTitle}>Messages par audience</h3>
        <ul style={listStyle}>
          {plan.messages_par_audience.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>

        {c.brief && (
          <details style={{ marginTop: 14 }}>
            <summary style={{ color: "#a78bfa", fontSize: 12, cursor: "pointer" }}>
              Voir le brief original
            </summary>
            <p style={{ color: "#cbd5e1", fontSize: 13, marginTop: 8, whiteSpace: "pre-wrap" }}>{c.brief}</p>
          </details>
        )}
      </section>

      {/* Bloc d'intégration Momentum */}
      {showMeasureBlock && !linkedToMomentum && (
        <section
          style={{
            ...cardStyle,
            background: "linear-gradient(135deg, rgba(34,197,94,0.10), rgba(77,95,255,0.06))",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ ...cardTitle, color: "#86efac" }}>📊 Préparer la mesure avec Momentum</h2>
              <p style={{ color: "#cbd5e1", fontSize: 13, marginBottom: 12, lineHeight: 1.6 }}>
                Campaign Studio a détecté les éléments mesurables de cette campagne.
                Momentum génère un plan de mesure personnalisé avec rappels datés.
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href={measure.momentum_prefill_url} style={primaryBtn}>
                  → Créer le projet Momentum maintenant
                </Link>
                <button
                  onClick={() => setShowMeasureBlock(false)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 8,
                    background: "transparent",
                    border: "1px solid rgba(168,85,247,0.25)",
                    color: "#a78bfa",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Le faire plus tard
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {linkedToMomentum && (
        <section
          style={{
            ...cardStyle,
            background: "rgba(34,197,94,0.06)",
            border: "1px solid rgba(34,197,94,0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#86efac", fontWeight: 700, fontSize: 14 }}>
                ✓ Campagne mesurée dans Momentum
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>
                Le diagnostic complet est disponible dans Momentum.
              </div>
            </div>
            <Link href={`/projects/${c.momentum_project_id}`} style={primaryBtn}>
              Voir le diagnostic →
            </Link>
          </div>
        </section>
      )}

      {/* Plan de mesure auto-généré */}
      <section style={cardStyle}>
        <h2 style={cardTitle}>📐 Plan de mesure — {measure.campaign_name}</h2>
        <p style={{ color: "#cbd5e1", fontSize: 12, marginBottom: 18, fontStyle: "italic" }}>
          Généré par Momentum à partir des métadonnées Campaign Studio.
          Lancement : {formatDateFR(measure.launch_date)}
        </p>

        <h3 style={subTitle}>Ce que vous devrez mesurer</h3>
        <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
          {measure.dimensions.map((d) => (
            <div
              key={d.dimension}
              style={{
                padding: 14,
                borderRadius: 8,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(168,85,247,0.18)",
                borderLeft: `3px solid ${d.priorite ? "#fbbf24" : "#8b5cf6"}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {DIM_ICON[d.dimension]} {d.dimension_label.toUpperCase()}
                </div>
                {d.priorite && (
                  <span style={{ fontSize: 10, color: "#fbbf24", fontWeight: 700 }}>
                    ⚠ ANGLE MORT HISTORIQUE — À PRIORISER
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: "#e9e2ff", marginBottom: 4 }}>
                <strong>KPI recommandé :</strong> {d.kpi_recommande}
              </div>
              <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 4, whiteSpace: "pre-wrap" }}>
                <strong>Comment :</strong> {d.comment_collecter}
              </div>
              <div style={{ fontSize: 12, color: "#a78bfa" }}>
                <strong>Quand :</strong> {d.quand_collecter} · <strong>Fiabilité attendue :</strong> {d.fiabilite_attendue}
              </div>
            </div>
          ))}
        </div>

        <h3 style={subTitle}>🔔 Rappels configurés automatiquement</h3>
        <div style={{ display: "grid", gap: 6 }}>
          {measure.reminders.map((r) => (
            <div
              key={r.day_offset}
              style={{
                display: "grid",
                gridTemplateColumns: "60px 110px 1fr",
                gap: 12,
                padding: "8px 12px",
                background: "rgba(168,85,247,0.04)",
                borderRadius: 6,
                fontSize: 13,
                alignItems: "center",
              }}
            >
              <span style={{ color: "#a78bfa", fontWeight: 700 }}>J+{r.day_offset}</span>
              <span style={{ color: "#cbd5e1" }}>{formatDateFR(r.date)}</span>
              <span style={{ color: "#e9e2ff" }}>{r.label}</span>
            </div>
          ))}
        </div>
        <p style={{ color: "#94a3b8", fontSize: 11, marginTop: 12, fontStyle: "italic" }}>
          💡 En production, ces rappels seraient envoyés par email/notification au préparateur.
        </p>
      </section>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(168,85,247,0.18)",
  marginBottom: 18,
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  margin: "0 0 4px 0",
  color: "#e9e2ff",
};

const subTitle: React.CSSProperties = {
  fontSize: 12,
  color: "#a78bfa",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  margin: "16px 0 8px 0",
  fontWeight: 700,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: "#cbd5e1",
  fontSize: 13,
  lineHeight: 1.7,
};

const primaryBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 8,
  background: "#8b5cf6",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: 13,
};

const errBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  background: "rgba(239,68,68,0.08)",
  border: "1px solid rgba(239,68,68,0.25)",
  color: "#fca5a5",
};
