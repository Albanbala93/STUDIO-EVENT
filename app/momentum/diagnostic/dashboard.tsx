"use client";

/**
 * Dashboard de restitution Momentum (5 blocs).
 *
 * Port de momentum/apps/web/src/app/diagnostic/dashboard.tsx avec une seule
 * différence : la sauvegarde utilise localStorage (via lib/momentum/storage)
 * au lieu de POST /projects. Le dashboard reste 100% client-side.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { saveProject } from "../../../lib/momentum/storage";
import type {
  Dimension,
  DiagnosticPayload,
  IdentificationData,
  InitiativeType,
  KPIAnswer,
  KPIQuestion,
  RecommendationItem,
} from "../../../lib/momentum/types";
import {
  DIMENSION_LABELS,
  INITIATIVE_LABELS,
} from "../../../lib/momentum/types";

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const DIMENSION_HELP: Record<Dimension, string> = {
  reach: "Capacité à toucher les bons publics au bon moment.",
  engagement: "Niveau d'interaction active des participants.",
  appropriation: "Compréhension et mémorisation des messages clés.",
  impact: "Effets concrets observés après l'initiative.",
};

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
   COMPOSANT PRINCIPAL
   ═══════════════════════════════════════════════════════════════════ */

export function ResultDashboard(props: {
  diagnostic: DiagnosticPayload;
  id: IdentificationData;
  answers: Record<string, KPIAnswer>;
  kpis: KPIQuestion[];
  onReset: () => void;
  onEditData?: () => void;
  /** Mode lecture seule (projet sauvegardé) : pas de sauvegarde ni d'édition. */
  readOnly?: boolean;
  /** Date d'enregistrement affichée sous le titre (défaut : aujourd'hui). */
  savedAt?: string;
  /** Id du projet (sauvegardé). */
  projectId?: string;
  /** Id du projet Campaign Studio d'origine — stocké dans le payload sauvegardé. */
  fromCampaignId?: string;
}) {
  const router = useRouter();
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

  /** Enregistre le projet en localStorage puis redirige vers sa page de détail. */
  function handleSave() {
    if (saving || savedId) return;
    setSaving(true);
    try {
      const saved = saveProject({
        name: props.id.name || "Initiative sans nom",
        initiativeType: props.id.initiativeType,
        audience: props.id.audienceType || null,
        intent: props.id.intent || null,
        overallScore: score.overall_score,
        confidenceScore: score.confidence_score,
        fromCampaignId: props.fromCampaignId,
        payload: {
          id: props.id,
          answers: props.answers,
          diagnostic: props.diagnostic,
        },
      });
      setSavedId(saved.id);
      showToast("Projet sauvegardé ✓");
      // Redirection douce vers la page de détail du projet Momentum sauvegardé.
      setTimeout(() => router.push(`/momentum/projects/${saved.id}`), 900);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      showToast(`Échec de la sauvegarde — ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0b1422 0%, #111f36 55%, #0b1422 100%)",
      padding: "32px 20px 60px",
    }}>
    <section className="dashboard-print-root" style={{
      animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both",
      maxWidth: 1100, margin: "0 auto",
    }}>
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

      {/* BLOC 1 — En-tête du projet */}
      <DashCard>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Tag>Restitution</Tag>
            <h1 style={{ fontSize: 28, lineHeight: 1.2, fontWeight: 800, color: "#f8fafc", margin: "2px 0 10px" }}>
              {props.id.name || "Initiative sans nom"}
            </h1>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
              {props.id.initiativeType
                ? INITIATIVE_LABELS[props.id.initiativeType as InitiativeType]
                : "—"}
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
                  <div style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{
                      width: `${present ? s : 0}%`, height: "100%", background: color,
                      borderRadius: 999, transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#a3b4c9", marginTop: 4, lineHeight: 1.5 }}>
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
            <EmptyHint>Aucun point fort clairement consolidé pour l&apos;instant.</EmptyHint>
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
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {interpretation.detailed_analysis.recommendations.slice(0, 3).map((r) => (
                <RecommendationCard key={r.title} reco={r} />
              ))}
            </div>
          ) : (
            <EmptyHint>
              Les données actuelles ne permettent pas de formuler des recommandations précises — commencez par instrumenter les angles morts identifiés.
            </EmptyHint>
          )}
        </DashCard>

        <DashCard accent="#94a3b8">
          <CardTitle><span style={{ color: "#94a3b8", marginRight: 8 }}>◌</span> Angles morts de mesure</CardTitle>
          {interpretation.detailed_analysis.data_gaps.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {interpretation.detailed_analysis.data_gaps.slice(0, 5).map(g => (
                <div key={`${g.field}-${g.issue}`} style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.55 }}>
                  <b style={{ color: "#f1f5f9" }}>{g.field}</b> — {g.issue}
                  <div style={{ fontSize: 11, color: "#a3b4c9", marginTop: 2 }}>Impact : {g.impact}</div>
                </div>
              ))}
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
          onClick={() => { if (typeof window !== "undefined") window.print(); }}
          style={primaryBtn("#4d5fff")}
        >
          ⬇ Export rapide
        </button>
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
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRIMITIVES UI
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
      fontSize: 12, color: "#a3b4c9", fontStyle: "italic",
      padding: "8px 0", lineHeight: 1.55,
    }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RECOMMANDATION ENRICHIE (why / action / when / impact + outil)
   ═══════════════════════════════════════════════════════════════════ */

function RecommendationCard({ reco }: { reco: RecommendationItem }) {
  const [toolOpen, setToolOpen] = useState(false);

  const prioColor =
    reco.priority === "haute" || reco.priority === "high"
      ? "#f87171"
      : reco.priority === "moyenne" || reco.priority === "medium"
      ? "#fbbf24"
      : "#60a5fa";

  const typeLabel: Record<string, string> = {
    improvement: "Amélioration",
    measurement: "Mesure",
    methodology: "Méthodologie",
  };
  const typeBadge = reco.reco_type ? typeLabel[reco.reco_type] : null;

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: "rgba(255,255,255,0.045)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderLeft: `3px solid ${prioColor}`,
      }}
    >
      {/* Header : titre + badges */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, color: "#f8fafc", flex: 1, minWidth: 200, lineHeight: 1.35 }}>
          {reco.title}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {typeBadge && (
            <span
              style={{
                fontSize: 10,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                fontWeight: 700,
                color: "#cbd5e1",
                padding: "2px 8px",
                borderRadius: 4,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {typeBadge}
            </span>
          )}
          <span
            style={{
              fontSize: 10,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontWeight: 800,
              color: prioColor,
              padding: "2px 8px",
              borderRadius: 4,
              background: prioColor + "20",
              border: `1px solid ${prioColor}55`,
            }}
          >
            Priorité {reco.priority}
          </span>
        </div>
      </div>

      {/* Corps : why / action / when / impact */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reco.why && (
          <RecoLine label="Pourquoi" value={reco.why} accent="#fbbf24" />
        )}
        <RecoLine label="Action" value={reco.action} accent="#818cf8" strong />
        {reco.when && (
          <RecoLine label="Quand" value={reco.when} accent="#60a5fa" />
        )}
        {reco.impact && (
          <RecoLine label="Impact attendu" value={reco.impact} accent="#22c55e" />
        )}
      </div>

      {/* Outil livrable */}
      {reco.tool && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 10,
            background: "rgba(99,102,241,0.08)",
            border: "1px solid rgba(129,140,248,0.25)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#a5b4fc",
                  marginBottom: 2,
                }}
              >
                Outil livré · {reco.tool.type}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>
                {reco.tool.name}
              </div>
            </div>
            <button
              onClick={() => setToolOpen((o) => !o)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: "#4f46e5",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {toolOpen ? "Masquer" : "Utiliser ce template"}
            </button>
          </div>

          {toolOpen && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12.5, color: "#e2e8f0", lineHeight: 1.6 }}>
                {reco.tool.usage}
              </div>

              {reco.tool.timing.length > 0 && (
                <div>
                  <div style={reCaptionStyle}>Timing</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {reco.tool.timing.map((t) => (
                      <span key={t} style={pillStyle}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {reco.tool.questions.length > 0 && (
                <div>
                  <div style={reCaptionStyle}>Questions clés</div>
                  <ol
                    style={{
                      margin: 0,
                      padding: "0 0 0 20px",
                      color: "#cbd5e1",
                      fontSize: 13,
                      lineHeight: 1.6,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {reco.tool.questions.slice(0, 5).map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}

              {reco.tool.tips.length > 0 && (
                <div>
                  <div style={reCaptionStyle}>Bonnes pratiques</div>
                  <ul
                    style={{
                      margin: 0,
                      padding: "0 0 0 20px",
                      color: "#cbd5e1",
                      fontSize: 12.5,
                      lineHeight: 1.55,
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                    }}
                  >
                    {reco.tool.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecoLine({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent: string;
  strong?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: accent,
          minWidth: 92,
          paddingTop: 2,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: strong ? 13.5 : 13,
          color: strong ? "#f1f5f9" : "#d8dfea",
          lineHeight: 1.55,
          flex: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

const reCaptionStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#a5b4fc",
  marginBottom: 6,
};

const pillStyle: React.CSSProperties = {
  fontSize: 11,
  padding: "3px 10px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#e2e8f0",
};

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
        style={{ fontSize: 12, fontWeight: 600, fill: "#a3b4c9", letterSpacing: "0.1em" }}>
        /100
      </text>
    </svg>
  );
}

/* ── Radar chart SVG ──────────────────────────────────────────────── */

function RadarChart({ dimensions }: { dimensions: { label: string; value: number; present: boolean }[] }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 95;
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
        const p = point(i, maxR + 18);
        const ta = i === 0 || i === 2 ? "middle" : (i === 1 ? "start" : "end");
        const color = d.present ? "#cbd5e1" : "#64748b";
        return (
          <text key={i} x={p.x} y={p.y} textAnchor={ta}
            dy={i === 0 ? -4 : i === 2 ? 12 : 4}
            style={{ fontSize: 11, fontWeight: 700, fill: color, letterSpacing: "0.02em" }}>
            {d.label.length > 16 ? d.label.split(" ")[0] : d.label}
            {d.present && (
              <tspan dx={4} style={{ fill: scoreColor(d.value), fontWeight: 800 }}>
                {Math.round(d.value)}
              </tspan>
            )}
          </text>
        );
      })}

      {presentCount < 3 && (
        <text x={cx} y={cy + 4} textAnchor="middle"
          style={{ fontSize: 10, fill: "#a3b4c9", fontStyle: "italic" }}>
          Couverture partielle
        </text>
      )}
    </svg>
  );
}
