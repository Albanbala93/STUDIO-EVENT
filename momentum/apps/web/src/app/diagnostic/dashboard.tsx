"use client";

/**
 * Dashboard de restitution Momentum (5 blocs) — composant isolé du page.tsx
 * pour pouvoir être réutilisé depuis `/projects/[id]` en mode lecture seule.
 *
 * Le fichier exporte à la fois les types partagés (DiagnosticPayload etc.)
 * et le composant ResultDashboard.
 */

import React, { useState } from "react";
import { TemplateLauncher, hasTemplate } from "./TemplateLauncher";
import {
  dimensionFromRecommendationTitle,
  dimensionFromGapField,
} from "./templates";

/* ═══════════════════════════════════════════════════════════════════
   TYPES PARTAGÉS
   ═══════════════════════════════════════════════════════════════════ */

export type Provenance = "measured" | "declared" | "estimated" | "proxy";
export type Dimension = "reach" | "engagement" | "appropriation" | "impact";
export type ConfidenceLabel = "high" | "medium" | "low";
export type InitiativeType =
  | "corporate_event"
  | "digital_campaign"
  | "change_management"
  | "newsletter"
  | "product_launch"
  | "other";

export type IdentificationData = {
  name: string;
  initiativeType: InitiativeType | "";
  audienceType: string;
  audienceSize: number;
  intent: string;
};

export type KPIAnswer = {
  kpiId: string;
  value: number;
  provenance: Provenance;
  confidenceLabel: ConfidenceLabel;
  note?: string;
};

export type KPIQuestion = {
  kpiId: string;
  dimension: Dimension;
  label: string;
  helper: string;
  unitHint: string;
  defaultProvenance: Provenance;
  min?: number;
  max?: number;
};

export type InsightItem = { title: string; description: string };
export type RecommendationItem = { title: string; action: string; priority: string };
export type DataGapItem = { field: string; issue: string; impact: string };

export type InterpretationPayload = {
  executive_summary: {
    headline: string;
    key_insight: string;
    top_strengths: string[];
    top_priorities: string[];
  };
  detailed_analysis: {
    summary: string;
    strengths: InsightItem[];
    weaknesses: InsightItem[];
    recommendations: RecommendationItem[];
    data_gaps: DataGapItem[];
  };
};

export type KPIBreakdown = {
  kpi_id: string | null;
  value: number;
  confidence: number;
  contribution: number;
  provenance: Provenance;
};

export type DimensionScoreData = {
  dimension: Dimension;
  score: number;
  confidence_score: number;
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  kpi_breakdown: KPIBreakdown[];
};

export type ScoreResult = {
  overall_score: number;
  confidence_score: number;
  dimension_scores: DimensionScoreData[];
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  missing_dimensions: Dimension[];
};

export type DiagnosticPayload = {
  score: ScoreResult;
  interpretation: InterpretationPayload;
};

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTES & HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const INITIATIVE_LABELS: Record<InitiativeType, string> = {
  corporate_event: "Événement corporate",
  digital_campaign: "Campagne digitale",
  change_management: "Accompagnement du changement",
  newsletter: "Newsletter interne",
  product_launch: "Lancement produit",
  other: "Autre initiative",
};

const DIMENSION_LABELS: Record<Dimension, string> = {
  reach: "Mobilisation",
  engagement: "Implication",
  appropriation: "Compréhension des messages",
  impact: "Impact",
};

const DIMENSION_HELP: Record<Dimension, string> = {
  reach: "Capacité à toucher les bons publics au bon moment.",
  engagement: "Niveau d'interaction active des participants.",
  appropriation: "Compréhension et mémorisation des messages clés.",
  impact: "Effets concrets observés après l'initiative.",
};

/** Couleur sémantique : 0-39 rouge · 40-64 orange · 65-79 jaune-vert · 80+ vert */
function scoreColor(score: number): string {
  if (score >= 80) return "#22c55e";
  if (score >= 65) return "#84cc16";
  if (score >= 40) return "#fbbf24";
  return "#ef4444";
}

function statusBadge(score: number): { label: string; color: string; icon: string } {
  if (score >= 70) return { label: "Performance solide", color: "#22c55e", icon: "●" };
  if (score >= 50) return { label: "Performance mitigée", color: "#fbbf24", icon: "●" };
  return { label: "Performance faible", color: "#ef4444", icon: "●" };
}

function reliabilityBadge(conf: number): { label: string; color: string } {
  if (conf >= 75) return { label: "Données fiables", color: "#22c55e" };
  if (conf >= 50) return { label: "Fiabilité partielle", color: "#fbbf24" };
  return { label: "Données à consolider", color: "#ef4444" };
}

function reliabilityDot(conf: number): { color: string; label: string } {
  if (conf >= 75) return { color: "#22c55e", label: "Fiabilité élevée" };
  if (conf >= 50) return { color: "#fbbf24", label: "Fiabilité moyenne" };
  return { color: "#ef4444", label: "Fiabilité faible" };
}

/* ═══════════════════════════════════════════════════════════════════
   COMPOSANT PRINCIPAL — ResultDashboard
   ═══════════════════════════════════════════════════════════════════ */

export function ResultDashboard(props: {
  diagnostic: DiagnosticPayload;
  apiError: string | null;
  id: IdentificationData;
  answers: Record<string, KPIAnswer>;
  kpis: KPIQuestion[];
  onReset: () => void;
  onEditData?: () => void;
  /** Mode lecture seule (projet sauvegardé) : pas de sauvegarde ni d'édition. */
  readOnly?: boolean;
  /** Date d'enregistrement affichée sous le titre (défaut : aujourd'hui). */
  savedAt?: string;
  /** Id du projet (sauvegardé). Active le bouton "Rapport pro" en mode lecture seule. */
  projectId?: string;
  /** Id de la campagne Campaign Studio source (wizard pré-rempli depuis CS).
      Si présent, après sauvegarde Momentum on relie automatiquement la campagne. */
  fromCampaignId?: string;
}) {
  const { score, interpretation } = props.diagnostic;
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const overall = Math.round(score.overall_score);
  const confidence = Math.round(score.confidence_score);
  const status = statusBadge(overall);
  const reliability = reliabilityBadge(confidence);

  const totalSignals =
    score.measured_count + score.estimated_count + score.declared_count + score.proxy_count;
  const notMeasuredPct = totalSignals > 0
    ? Math.round(((totalSignals - score.measured_count) / totalSignals) * 100)
    : 0;

  const dimensionOrder: Dimension[] = ["reach", "engagement", "appropriation", "impact"];
  const dimensionMap = new Map(score.dimension_scores.map(d => [d.dimension, d]));

  const displayDate = props.savedAt
    ? new Date(props.savedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  /** Enregistre le projet via POST /projects — retourne l'id créé. */
  async function handleSave() {
    if (saving || savedId) return;
    setSaving(true);
    try {
      // En full-Vercel (pas de backend Python), on tape la route Next.js embarquée.
      const projectsEndpoint = API_BASE_URL ? `${API_BASE_URL}/projects` : `/api/projects`;
      const res = await fetch(projectsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: props.id.name || "Initiative sans nom",
          initiative_type: props.id.initiativeType || null,
          audience: props.id.audienceType || null,
          intent: props.id.intent || null,
          overall_score: score.overall_score,
          confidence_score: score.confidence_score,
          payload: {
            id: props.id,
            answers: props.answers,
            diagnostic: props.diagnostic,
          },
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const created: { id: string } = await res.json();
      setSavedId(created.id);

      // Si on vient de Campaign Studio, on relie automatiquement la campagne au projet.
      if (props.fromCampaignId) {
        try {
          const linkEndpoint = API_BASE_URL
            ? `${API_BASE_URL}/campaigns/${props.fromCampaignId}/link-momentum`
            : `/api/campaigns/${props.fromCampaignId}/link-momentum`;
          await fetch(linkEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ momentum_project_id: created.id }),
          });
          showToast(`Projet sauvegardé ✓ — relié à Campaign Studio`);
        } catch {
          showToast(`Projet sauvegardé ✓ (lien CS échoué — non bloquant)`);
        }
      } else {
        showToast(`Projet sauvegardé ✓ (id: ${created.id})`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      showToast(`Échec de la sauvegarde — ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dashboard-print-root" style={{ animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .grid-dims { display: grid; grid-template-columns: 1.1fr 1fr; gap: 24px; align-items: center; }
        @media (max-width: 900px) {
          .grid-2, .grid-dims { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Avertissement API */}
      {props.apiError && (
        <div style={{
          padding: 12, borderRadius: 12, marginBottom: 16,
          background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
          color: "#fbbf24", fontSize: 12,
        }}>
          ⚠ API non joignable ({props.apiError}) — diagnostic local affiché.
        </div>
      )}

      {/* BLOC 1 — En-tête du projet */}
      <DashCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Tag>Restitution</Tag>
            <h1 style={{ fontSize: 28, lineHeight: 1.2, fontWeight: 800, color: "#f8fafc", margin: "2px 0 10px" }}>
              {props.id.name || "Initiative sans nom"}
            </h1>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
              {INITIATIVE_LABELS[props.id.initiativeType as InitiativeType] ?? "—"}
              {" · "}{props.id.audienceType || "Audience non précisée"}
              {" · "}{displayDate}
            </div>
            {props.id.intent && (
              <div style={{
                fontStyle: "italic", fontSize: 14, color: "#cbd5e1",
                paddingLeft: 12, borderLeft: "2px solid rgba(129,140,248,0.5)",
              }}>
                « {props.id.intent} »
              </div>
            )}
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 14px", borderRadius: 999,
            background: status.color + "1f", border: `1px solid ${status.color}55`,
            fontSize: 13, fontWeight: 700, color: status.color, whiteSpace: "nowrap",
          }}>
            <span style={{ fontSize: 10 }}>{status.icon}</span> {status.label}
          </div>
        </div>
      </DashCard>

      {/* BLOC 2 — Communication Score */}
      <DashCard>
        <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <ScoreGauge value={overall} />
          </div>
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "#818cf8", marginBottom: 8 }}>
              Communication Score
            </div>
            <p style={{ fontSize: 15, color: "#e2e8f0", lineHeight: 1.6, margin: "0 0 18px" }}>
              {interpretation.executive_summary.key_insight}
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 12px", borderRadius: 8,
              background: reliability.color + "1f", border: `1px solid ${reliability.color}55`,
              fontSize: 12, fontWeight: 700, color: reliability.color, marginBottom: 8,
            }}>
              ● {reliability.label}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              {totalSignals > 0
                ? `${notMeasuredPct}% des données sont déclarées ou estimées. Interpréter avec prudence.`
                : "Aucune donnée exploitable — compléter les saisies pour obtenir un score."}
            </div>
          </div>
        </div>
      </DashCard>

      {/* BLOC 3 — 4 dimensions */}
      <DashCard>
        <CardTitle>Les 4 dimensions</CardTitle>
        <div className="grid-dims" style={{ marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <RadarChart
              dimensions={dimensionOrder.map(d => {
                const ds = dimensionMap.get(d);
                return { label: DIMENSION_LABELS[d], value: ds?.score ?? 0, present: !!ds && ds.kpi_breakdown.length > 0 };
              })}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dimensionOrder.map(d => {
              const ds = dimensionMap.get(d);
              const present = !!ds && ds.kpi_breakdown.length > 0;
              const s = Math.round(ds?.score ?? 0);
              const color = present ? scoreColor(s) : "#475569";
              const dot = reliabilityDot(ds?.confidence_score ?? 0);
              return (
                <div key={d}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      {DIMENSION_LABELS[d]}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {present && (
                        <span title={dot.label} style={{
                          width: 8, height: 8, borderRadius: "50%", background: dot.color,
                          display: "inline-block",
                        }} />
                      )}
                      <div style={{ fontSize: 13, fontWeight: 800, color: present ? "#f1f5f9" : "#64748b" }}>
                        {present ? `${s}/100` : "Non évaluée"}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden",
                  }}>
                    <div style={{
                      width: `${present ? s : 0}%`, height: "100%", background: color,
                      borderRadius: 999, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, lineHeight: 1.5 }}>
                    {present ? DIMENSION_HELP[d] : "Aucune mesure collectée sur cette dimension."}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DashCard>

      {/* BLOC 4 — Diagnostic métier */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        <DashCard accent="#22c55e">
          <CardTitle><span style={{ color: "#22c55e", marginRight: 8 }}>✓</span> Points forts</CardTitle>
          {interpretation.executive_summary.top_strengths.length > 0 ? (
            <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>
              {interpretation.executive_summary.top_strengths.slice(0, 3).map(s => <li key={s}>{s}</li>)}
            </ul>
          ) : (
            <EmptyHint>Aucun point fort clairement consolidé pour l'instant.</EmptyHint>
          )}
        </DashCard>

        <DashCard accent="#fbbf24">
          <CardTitle><span style={{ color: "#fbbf24", marginRight: 8 }}>⚠</span> Points de vigilance</CardTitle>
          {interpretation.detailed_analysis.weaknesses.length > 0 ? (
            <ul style={{ margin: 0, padding: "0 0 0 18px", color: "#cbd5e1", fontSize: 13, lineHeight: 1.7 }}>
              {interpretation.detailed_analysis.weaknesses.slice(0, 3).map(w => (
                <li key={w.title}><b style={{ color: "#f1f5f9" }}>{w.title}</b> — {w.description}</li>
              ))}
            </ul>
          ) : (
            <EmptyHint>Aucun point de vigilance identifié.</EmptyHint>
          )}
        </DashCard>

        <DashCard accent="#4d5fff">
          <CardTitle><span style={{ color: "#818cf8", marginRight: 8 }}>→</span> Recommandations actionnables</CardTitle>
          {interpretation.detailed_analysis.recommendations.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {interpretation.detailed_analysis.recommendations.slice(0, 6).map(r => {
                const prioColor =
                  r.priority === "haute" ? "#f87171" :
                  r.priority === "moyenne" ? "#fbbf24" : "#60a5fa";
                const dim = dimensionFromRecommendationTitle(r.title);
                return (
                  <div key={r.title} style={{
                    padding: 10, borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    borderLeft: `3px solid ${prioColor}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#f1f5f9" }}>{r.title}</div>
                      <span style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: prioColor, fontWeight: 700 }}>
                        Priorité {r.priority}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 1.55 }}>{r.action}</div>
                    {/* Template de mesure associé — "zéro friction" : le bouton apparaît
                        si une question-type existe pour la dimension ciblée. */}
                    {hasTemplate(dim) && (
                      <div className="no-print">
                        <TemplateLauncher dimension={dim} variant="inline" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyHint>
              Données insuffisantes pour formuler des recommandations — compléter les angles morts.
            </EmptyHint>
          )}
        </DashCard>

        <DashCard accent="#94a3b8">
          <CardTitle><span style={{ color: "#94a3b8", marginRight: 8 }}>◌</span> Angles morts de mesure</CardTitle>
          {interpretation.detailed_analysis.data_gaps.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {interpretation.detailed_analysis.data_gaps.slice(0, 5).map(g => {
                const dim = dimensionFromGapField(g.field);
                return (
                  <div key={`${g.field}-${g.issue}`} style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.55 }}>
                    <b style={{ color: "#f1f5f9" }}>{g.field}</b> — {g.issue}
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Impact : {g.impact}</div>
                    {/* CTA contextuel : "Vous ne mesurez pas cette dimension — générer un template". */}
                    {hasTemplate(dim) && (
                      <div className="no-print">
                        <TemplateLauncher
                          dimension={dim}
                          variant="cta"
                          label="Vous ne mesurez pas cette dimension — générer un template"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyHint>Aucun angle mort détecté à ce stade.</EmptyHint>
          )}
        </DashCard>
      </div>

      {/* BLOC 5 — Barre d'actions */}
      <div className="no-print" style={{
        marginTop: 20, padding: 16, borderRadius: 16,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
      }}>
        <button
          onClick={() => {
            if (typeof window === "undefined") return;
            showToast("Dans la boîte d'impression, choisir « Enregistrer au format PDF »");
            // Petit délai pour que l'utilisateur voie le toast avant l'ouverture
            // de la boîte native (qui bloque le thread UI sur certains navigateurs).
            setTimeout(() => window.print(), 300);
          }}
          style={primaryBtn("#4d5fff")}
        >
          ⬇ Export PDF
        </button>
        {(props.projectId || savedId) && (
          <a
            href={`/projects/${props.projectId ?? savedId}/report`}
            style={{ ...primaryBtn("#0ea5e9"), textDecoration: "none" }}
          >
            📄 Rapport professionnel →
          </a>
        )}
        {!props.readOnly && (
          <button
            onClick={handleSave}
            disabled={saving || !!savedId}
            style={{
              ...primaryBtn("#22c55e"),
              opacity: saving || savedId ? 0.6 : 1,
              cursor: saving || savedId ? "default" : "pointer",
            }}
          >
            {savedId ? "✓ Sauvegardé" : saving ? "Sauvegarde…" : "◉ Sauvegarder le projet"}
          </button>
        )}
        <button onClick={props.onReset} style={primaryBtn("#7c3aed")}>
          ↻ Nouvelle analyse
        </button>
        <div style={{ flex: 1 }} />
        <button onClick={() => showToast("Partage — fonctionnalité à venir")} style={ghostBtn()}>
          Partager
        </button>
        {!props.readOnly && props.onEditData && (
          <button onClick={props.onEditData} style={ghostBtn()}>
            Modifier les données
          </button>
        )}
      </div>

      {toast && (
        <div className="no-print" style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          padding: "12px 20px", borderRadius: 12,
          background: "rgba(15,23,42,0.95)", border: "1px solid rgba(129,140,248,0.4)",
          color: "#f1f5f9", fontSize: 13, fontWeight: 500,
          boxShadow: "0 10px 40px rgba(0,0,0,0.4)", zIndex: 50,
          animation: "fadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          {toast}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRIMITIVES UI (privées au dashboard)
   ═══════════════════════════════════════════════════════════════════ */

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
      textTransform: "uppercase", color: "#818cf8", marginBottom: 10,
    }}>{children}</div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: "#e2e8f0", marginBottom: 14, display: "flex", alignItems: "center" }}>
      {children}
    </div>
  );
}

function DashCard({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div style={{
      padding: 22, borderRadius: 16, marginTop: 16,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderTop: accent ? `2px solid ${accent}` : undefined,
    }}>
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, color: "#64748b", fontStyle: "italic",
      padding: "8px 0", lineHeight: 1.55,
    }}>
      {children}
    </div>
  );
}

function primaryBtn(color: string): React.CSSProperties {
  return {
    padding: "10px 16px", borderRadius: 10,
    background: color, border: "none",
    color: "#fff", fontWeight: 700, fontSize: 13,
    cursor: "pointer", boxShadow: `0 4px 14px ${color}33`,
  };
}

function ghostBtn(): React.CSSProperties {
  return {
    padding: "10px 14px", borderRadius: 10,
    background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
    color: "#cbd5e1", fontWeight: 600, fontSize: 12,
    cursor: "pointer",
  };
}

/* ── Jauge circulaire SVG ─────────────────────────────────────────── */

function ScoreGauge({ value }: { value: number }) {
  const size = 180;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startA = -Math.PI * 0.75;
  const endA = Math.PI * 0.75;
  const totalArc = endA - startA;
  const clamped = Math.max(0, Math.min(100, value));
  const progressA = startA + (totalArc * clamped) / 100;

  const polar = (a: number) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  const a0 = polar(startA);
  const a1 = polar(endA);
  const p = polar(progressA);
  const largeArcBg = 1;
  const largeArcFg = clamped > (180 / 270) * 100 ? 1 : 0;
  const color = scoreColor(clamped);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path
        d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${largeArcBg} 1 ${a1.x} ${a1.y}`}
        fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} strokeLinecap="round"
      />
      {clamped > 0 && (
        <path
          d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${largeArcFg} 1 ${p.x} ${p.y}`}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}99)` }}
        />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle"
        style={{ fontSize: 44, fontWeight: 800, fill: "#f8fafc" }}>
        {Math.round(clamped)}
      </text>
      <text x={cx} y={cy + 20} textAnchor="middle"
        style={{ fontSize: 12, fontWeight: 600, fill: "#64748b", letterSpacing: "0.1em" }}>
        /100
      </text>
    </svg>
  );
}

/* ── Radar chart SVG ──────────────────────────────────────────────── */

function RadarChart({ dimensions }: { dimensions: { label: string; value: number; present: boolean }[] }) {
  // Padding généreux pour que les labels longs ("Compréhension des messages",
  // "Implication 75") ne soient jamais rognés par la viewBox SVG. 160px donne
  // ~130px de clearance à gauche/droite une fois le rayon du radar (100px) déduit.
  // Le SVG est rendu en width:100% (viewBox) : il scale avec le conteneur tout en
  // conservant toutes les étiquettes internes.
  const maxR = 100;
  const padding = 160;
  const size = (maxR + padding) * 2;
  const cx = size / 2;
  const cy = size / 2;
  const n = dimensions.length;

  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleFor(i)),
    y: cy + r * Math.sin(angleFor(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1.0];
  const presentCount = dimensions.filter(d => d.present).length;

  const polyPoints = dimensions.map((d, i) => {
    const value = d.present ? Math.max(0, Math.min(100, d.value)) : 0;
    const r = (value / 100) * maxR;
    const p = point(i, r);
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", maxWidth: size, height: "auto", display: "block" }}
    >
      {rings.map((rf, idx) => {
        const pts = dimensions.map((_, i) => {
          const p = point(i, maxR * rf);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon key={idx} points={pts}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        );
      })}

      {dimensions.map((d, i) => {
        const p = point(i, maxR);
        return (
          <line
            key={i}
            x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke={d.present ? "rgba(255,255,255,0.12)" : "rgba(148,163,184,0.25)"}
            strokeWidth={1}
            strokeDasharray={d.present ? undefined : "3 3"}
          />
        );
      })}

      {[25, 50, 75].map((v, idx) => (
        <text
          key={idx}
          x={cx + 4}
          y={cy - maxR * (v / 100) + 3}
          style={{ fontSize: 9, fill: "rgba(148,163,184,0.4)" }}
        >
          {v}
        </text>
      ))}

      {presentCount >= 3 && (
        <polygon
          points={polyPoints}
          fill="rgba(129,140,248,0.18)"
          stroke="#818cf8"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {dimensions.map((d, i) => {
        if (!d.present) {
          return (
            <circle key={i} cx={cx} cy={cy} r={3}
              fill="#475569" opacity={0.4} />
          );
        }
        const r = (Math.max(0, Math.min(100, d.value)) / 100) * maxR;
        const p = point(i, r);
        const color = scoreColor(d.value);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5}
              fill={color} stroke="#0a0d1a" strokeWidth={2} />
          </g>
        );
      })}

      {dimensions.map((d, i) => {
        const p = point(i, maxR + 20);
        const ta = i === 0 || i === 2 ? "middle" : (i === 1 ? "start" : "end");
        const color = d.present ? "#cbd5e1" : "#64748b";

        // Word-wrap sur 2 lignes si le label est long, pour ne jamais le tronquer.
        const words = d.label.split(" ");
        let lines: string[] = [d.label];
        if (d.label.length > 14 && words.length > 1) {
          const mid = Math.ceil(words.length / 2);
          lines = [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
        }

        // Décalage vertical pour que le texte reste centré autour du point d'ancrage.
        // Pour i=0 (haut) on remonte plus si 2 lignes ; pour i=2 (bas) pas besoin.
        const lineHeight = 13;
        const baseDy =
          i === 0 ? -4 - (lines.length - 1) * lineHeight :
          i === 2 ? 12 :
          4 - ((lines.length - 1) * lineHeight) / 2;

        return (
          <text key={i} x={p.x} y={p.y} textAnchor={ta}
            style={{ fontSize: 11, fontWeight: 700, fill: color, letterSpacing: "0.02em" }}>
            {lines.map((ln, li) => (
              <tspan key={li} x={p.x} dy={li === 0 ? baseDy : lineHeight}>
                {ln}
                {li === lines.length - 1 && d.present && (
                  <tspan dx={4} style={{ fill: scoreColor(d.value), fontWeight: 800 }}>
                    {Math.round(d.value)}
                  </tspan>
                )}
              </tspan>
            ))}
          </text>
        );
      })}

      {presentCount < 3 && (
        <text x={cx} y={cy + 4} textAnchor="middle"
          style={{ fontSize: 10, fill: "#64748b", fontStyle: "italic" }}>
          Couverture partielle
        </text>
      )}
    </svg>
  );
}
