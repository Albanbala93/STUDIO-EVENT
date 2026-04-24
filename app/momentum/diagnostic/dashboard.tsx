"use client";

/**
 * Dashboard de restitution Momentum — design system Stratly.
 *
 * Port de la version dark vers Tailwind + shadcn-style (light canvas,
 * navy/accent). Conserve : jauge score, radar 4 dimensions, grille
 * diagnostic, volet RSE (E/S/G), barre d'actions (PDF / Save / Edit).
 * La sauvegarde utilise localStorage via lib/momentum/storage.
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Compass,
  Download,
  Leaf,
  Pencil,
  RefreshCcw,
  Save,
  Target,
} from "lucide-react";

import { saveProject } from "../../../lib/momentum/storage";
import type {
  Dimension,
  DiagnosticPayload,
  IdentificationData,
  InitiativeType,
  KPIAnswer,
  KPIQuestion,
  RecommendationItem,
  RSEDimension,
  RSEGap,
  RSEInterpretation,
  RSERecommendation,
} from "../../../lib/momentum/types";
import {
  DIMENSION_LABELS,
  INITIATIVE_LABELS,
  RSE_DIMENSION_LABELS,
} from "../../../lib/momentum/types";
import { cn } from "../../../lib/utils";
import { buttonVariants } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

const DIMENSION_HELP: Record<Dimension, string> = {
  reach: "Capacité à toucher les bons publics au bon moment.",
  engagement: "Niveau d'interaction active des participants.",
  appropriation: "Compréhension et mémorisation des messages clés.",
  impact: "Effets concrets observés après l'initiative.",
};

/** Couleur solide (hex) pour jauge / radar / progress bars. */
const INDIGO = "#6366F1";
const INDIGO_GRADIENT = "linear-gradient(135deg, #6366F1, #8B5CF6)";

function scoreColor(score: number): string {
  if (score >= 65) return INDIGO;
  if (score >= 40) return "#f59e0b"; // warn amber
  return "#ef4444"; // danger
}

/** Fond CSS pour les progress bars — gradient en tier indigo, solide sinon. */
function scoreFill(score: number): string {
  if (score >= 65) return INDIGO_GRADIENT;
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreTone(score: number): {
  label: string;
  pill: string;
  text: string;
} {
  if (score >= 70)
    return {
      label: "Performance solide",
      pill: "bg-accent-50 border-accent-200",
      text: "text-accent-700",
    };
  if (score >= 50)
    return {
      label: "Performance mitigée",
      pill: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
    };
  return {
    label: "Performance faible",
    pill: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
  };
}

function reliabilityTone(conf: number): {
  label: string;
  pill: string;
  text: string;
  dot: string;
} {
  if (conf >= 75)
    return {
      label: "Données fiables",
      pill: "bg-accent-50 border-accent-200",
      text: "text-accent-700",
      dot: "bg-accent",
    };
  if (conf >= 50)
    return {
      label: "Fiabilité partielle",
      pill: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
    };
  return {
    label: "Données à consolider",
    pill: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  };
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
  readOnly?: boolean;
  savedAt?: string;
  projectId?: string;
  fromCampaignId?: string;
}) {
  const router = useRouter();
  const { score, interpretation, rse } = props.diagnostic;
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const overall = Math.round(score.overall_score);
  const confidence = Math.round(score.confidence_score);
  const status = scoreTone(overall);
  const reliability = reliabilityTone(confidence);

  const totalSignals =
    score.measured_count +
    score.estimated_count +
    score.declared_count +
    score.proxy_count;
  const notMeasuredPct =
    totalSignals > 0
      ? Math.round(
          ((totalSignals - score.measured_count) / totalSignals) * 100,
        )
      : 0;

  const dimensionOrder: Dimension[] = [
    "reach",
    "engagement",
    "appropriation",
    "impact",
  ];
  const dimensionMap = new Map(
    score.dimension_scores.map((d) => [d.dimension, d]),
  );

  const displayDate = props.savedAt
    ? new Date(props.savedAt).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

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
      showToast("Projet sauvegardé");
      setTimeout(() => router.push(`/momentum/projects/${saved.id}`), 900);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      showToast(`Échec de la sauvegarde — ${msg}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Print CSS — hides chrome, expands dashboard to full page */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          html,
          body {
            background: #ffffff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .dashboard-print-root,
          .dashboard-print-root * {
            visibility: visible !important;
          }
          .dashboard-print-root {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
        }
        @keyframes dashFadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .dash-animate {
          animation: dashFadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
      `}</style>

      {/* Sticky breadcrumb header */}
      <header className="sticky top-0 z-30 border-b border-border bg-canvas/85 backdrop-blur-sm no-print">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-8">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              Momentum · Restitution
            </span>
            <h1 className="text-[15px] font-semibold text-ink truncate max-w-[60vw]">
              {props.id.name || "Initiative sans nom"}
            </h1>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[12px] font-semibold",
              status.pill,
              status.text,
            )}
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
            {status.label}
          </div>
        </div>
      </header>

      <section className="dashboard-print-root dash-animate mx-auto max-w-6xl space-y-6 px-8 py-8">
        {/* BLOC 1 — Identification */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-[260px] flex-1">
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-accent-600">
                  Restitution exécutive
                </div>
                <h2 className="mb-2 text-[24px] font-bold leading-tight text-ink">
                  {props.id.name || "Initiative sans nom"}
                </h2>
                <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-muted">
                  <span>
                    {props.id.initiativeType
                      ? INITIATIVE_LABELS[
                          props.id.initiativeType as InitiativeType
                        ]
                      : "—"}
                  </span>
                  <span className="text-border">•</span>
                  <span>{props.id.audienceType || "Audience non précisée"}</span>
                  <span className="text-border">•</span>
                  <span>{displayDate}</span>
                </div>
                {props.id.intent && (
                  <blockquote className="mt-3 border-l-2 border-accent/60 pl-3 text-[13px] italic text-ink-muted">
                    « {props.id.intent} »
                  </blockquote>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOC 2 — Communication Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-8">
              <div className="flex flex-shrink-0 justify-center">
                <ScoreGauge value={overall} />
              </div>
              <div className="min-w-[260px] flex-1">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-accent-600">
                  Communication Score
                </div>
                <p className="mb-4 text-[14px] leading-relaxed text-ink">
                  {interpretation.executive_summary.key_insight}
                </p>
                <div
                  className={cn(
                    "mb-3 inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[12px] font-semibold",
                    reliability.pill,
                    reliability.text,
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      reliability.dot,
                    )}
                  />
                  {reliability.label}
                </div>
                <div className="text-[12px] text-ink-muted">
                  {totalSignals > 0
                    ? `${notMeasuredPct}% des données sont déclarées ou estimées. Interpréter avec prudence.`
                    : "Aucune donnée exploitable — compléter les saisies pour obtenir un score."}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOC 3 — 4 dimensions */}
        <Card>
          <CardContent className="p-6">
            <SectionTitle icon={<Target className="h-4 w-4 text-accent" />}>
              Les 4 dimensions
            </SectionTitle>
            <div className="mt-4 grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
              <div className="flex justify-center">
                <RadarChart
                  dimensions={dimensionOrder.map((d) => {
                    const ds = dimensionMap.get(d);
                    return {
                      label: DIMENSION_LABELS[d],
                      value: ds?.score ?? 0,
                      present: !!ds && ds.kpi_breakdown.length > 0,
                    };
                  })}
                />
              </div>
              <div className="flex flex-col gap-4">
                {dimensionOrder.map((d) => {
                  const ds = dimensionMap.get(d);
                  const present = !!ds && ds.kpi_breakdown.length > 0;
                  const s = Math.round(ds?.score ?? 0);
                  const fill = present ? scoreFill(s) : "#94A3B8";
                  const relTone = reliabilityTone(ds?.confidence_score ?? 0);
                  return (
                    <div key={d}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink">
                          {DIMENSION_LABELS[d]}
                        </div>
                        <div className="flex items-center gap-2">
                          {present && (
                            <span
                              title={relTone.label}
                              className={cn(
                                "inline-block h-2 w-2 rounded-full",
                                relTone.dot,
                              )}
                            />
                          )}
                          <div
                            className={cn(
                              "text-[13px] font-bold tabular-nums",
                              present ? "text-ink" : "text-ink-muted",
                            )}
                          >
                            {present ? `${s}/100` : "Non évaluée"}
                          </div>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-canvas">
                        <div
                          className="h-full rounded-full transition-[width] duration-700 ease-out"
                          style={{
                            width: `${present ? s : 0}%`,
                            background: fill,
                          }}
                        />
                      </div>
                      <div className="mt-1.5 text-[11px] leading-snug text-ink-muted">
                        {present
                          ? DIMENSION_HELP[d]
                          : "Aucune mesure collectée sur cette dimension."}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BLOC 4 — Diagnostic métier (2 colonnes) */}
        <div className="grid gap-4 md:grid-cols-2">
          <DiagnosticCard
            accent="emerald"
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Points forts"
            empty={interpretation.executive_summary.top_strengths.length === 0}
            emptyHint="Aucun point fort clairement consolidé pour l'instant."
          >
            <ul className="space-y-2">
              {interpretation.executive_summary.top_strengths
                .slice(0, 3)
                .map((s) => (
                  <li
                    key={s}
                    className="flex gap-2 text-[13px] leading-relaxed text-ink"
                  >
                    <span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                    <span>{s}</span>
                  </li>
                ))}
            </ul>
          </DiagnosticCard>

          <DiagnosticCard
            accent="amber"
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Points de vigilance"
            empty={interpretation.detailed_analysis.weaknesses.length === 0}
            emptyHint="Aucun point de vigilance identifié."
          >
            <ul className="space-y-3">
              {interpretation.detailed_analysis.weaknesses
                .slice(0, 3)
                .map((w) => (
                  <li key={w.title} className="text-[13px] leading-relaxed">
                    <b className="text-ink">{w.title}</b>
                    <span className="text-ink-muted"> — {w.description}</span>
                  </li>
                ))}
            </ul>
          </DiagnosticCard>

          <div className="md:col-span-2">
            <DiagnosticCard
              accent="accent"
              icon={<ArrowRight className="h-4 w-4" />}
              title="Recommandations actionnables"
              empty={
                interpretation.detailed_analysis.recommendations.length === 0
              }
              emptyHint="Les données actuelles ne permettent pas de formuler des recommandations précises — commencez par instrumenter les angles morts identifiés."
            >
              <div className="flex flex-col gap-3">
                {interpretation.detailed_analysis.recommendations
                  .slice(0, 4)
                  .map((r) => (
                    <RecommendationCard key={r.title} reco={r} />
                  ))}
              </div>
            </DiagnosticCard>
          </div>

          <div className="md:col-span-2">
            <DiagnosticCard
              accent="slate"
              icon={<Circle className="h-4 w-4" />}
              title="Angles morts de mesure"
              empty={interpretation.detailed_analysis.data_gaps.length === 0}
              emptyHint="Aucun angle mort détecté à ce stade."
            >
              <div className="flex flex-col gap-3">
                {interpretation.detailed_analysis.data_gaps
                  .slice(0, 5)
                  .map((g) => (
                    <div
                      key={`${g.field}-${g.issue}`}
                      className="rounded-sm border border-border bg-canvas/60 p-3"
                    >
                      <div className="text-[13px] leading-relaxed">
                        <b className="text-ink">{g.field}</b>
                        <span className="text-ink-muted"> — {g.issue}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-ink-muted">
                        Impact : {g.impact}
                      </div>
                    </div>
                  ))}
              </div>
            </DiagnosticCard>
          </div>
        </div>

        {/* BLOC 4bis — Volet RSE (ESG) */}
        {rse && <RseSection rse={rse} />}

        {/* BLOC 5 — Barre d'actions */}
        <div className="no-print flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white p-4 shadow-card">
          <button
            onClick={() => {
              if (typeof window === "undefined") return;
              setToast(
                "Préparation du PDF — choisissez « Enregistrer au format PDF » dans la boîte d'impression.",
              );
              setTimeout(() => {
                window.print();
                setTimeout(() => setToast(null), 1500);
              }, 300);
            }}
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>

          {!props.readOnly && (
            <button
              onClick={handleSave}
              disabled={saving || !!savedId}
              className={cn(
                buttonVariants({ variant: "secondary", size: "md" }),
                (saving || savedId) && "cursor-default opacity-60",
              )}
            >
              {savedId ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Sauvegardé
                </>
              ) : saving ? (
                <>
                  <Save className="h-4 w-4 animate-pulse" />
                  Sauvegarde…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Sauvegarder le projet
                </>
              )}
            </button>
          )}

          <button
            onClick={props.onReset}
            className={buttonVariants({ variant: "outline", size: "md" })}
          >
            <RefreshCcw className="h-4 w-4" />
            {props.readOnly ? "Supprimer" : "Nouvelle analyse"}
          </button>

          <div className="flex-1" />

          {!props.readOnly && props.onEditData && (
            <button
              onClick={props.onEditData}
              className={buttonVariants({ variant: "ghost", size: "md" })}
            >
              <Pencil className="h-4 w-4" />
              Modifier les données
            </button>
          )}
        </div>

        {toast && (
          <div
            className="no-print fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-border bg-white px-5 py-3 text-[13px] font-medium text-ink shadow-card-hover"
            style={{
              animation: "dashFadeUp 0.25s cubic-bezier(0.16,1,0.3,1) both",
            }}
          >
            {toast}
          </div>
        )}
      </section>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PRIMITIVES UI
   ═══════════════════════════════════════════════════════════════════ */

function SectionTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon && (
        <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent-50">
          {icon}
        </div>
      )}
      <h3 className="text-[14px] font-semibold text-ink">{children}</h3>
    </div>
  );
}

type DiagnosticAccent = "emerald" | "amber" | "accent" | "slate";

const ACCENT_CLASSES: Record<
  DiagnosticAccent,
  { bar: string; iconWrap: string; iconColor: string }
> = {
  // "emerald" — conservé comme clé sémantique (succès / points forts),
  // mais la teinte est désormais indigo pour rester cohérent avec le reste
  // du système. La barre supérieure utilise le gradient brand.
  emerald: {
    bar: "bg-[linear-gradient(135deg,#6366F1,#8B5CF6)]",
    iconWrap: "bg-accent-50",
    iconColor: "text-accent-600",
  },
  amber: {
    bar: "bg-amber-500",
    iconWrap: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  accent: {
    bar: "bg-[linear-gradient(135deg,#6366F1,#8B5CF6)]",
    iconWrap: "bg-accent-50",
    iconColor: "text-accent",
  },
  slate: {
    bar: "bg-slate-400",
    iconWrap: "bg-slate-100",
    iconColor: "text-slate-600",
  },
};

function DiagnosticCard({
  accent,
  icon,
  title,
  empty,
  emptyHint,
  children,
}: {
  accent: DiagnosticAccent;
  icon: React.ReactNode;
  title: string;
  empty: boolean;
  emptyHint: string;
  children: React.ReactNode;
}) {
  const tone = ACCENT_CLASSES[accent];
  return (
    <Card className="relative h-full overflow-hidden">
      <div className={cn("absolute inset-x-0 top-0 h-0.5", tone.bar)} />
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-sm",
              tone.iconWrap,
              tone.iconColor,
            )}
          >
            {icon}
          </div>
          <h3 className="text-[14px] font-semibold text-ink">{title}</h3>
        </div>
        {empty ? (
          <div className="py-2 text-[12px] italic leading-relaxed text-ink-muted">
            {emptyHint}
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   RECOMMANDATION ENRICHIE
   ═══════════════════════════════════════════════════════════════════ */

function priorityTone(priority: string): {
  pill: string;
  text: string;
  bar: string;
} {
  if (priority === "haute" || priority === "high")
    return {
      pill: "bg-rose-50 border-rose-200",
      text: "text-rose-700",
      bar: "bg-rose-500",
    };
  if (priority === "moyenne" || priority === "medium")
    return {
      pill: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      bar: "bg-amber-500",
    };
  return {
    pill: "bg-sky-50 border-sky-200",
    text: "text-sky-700",
    bar: "bg-sky-500",
  };
}

function RecommendationCard({ reco }: { reco: RecommendationItem }) {
  const [toolOpen, setToolOpen] = useState(false);
  const prio = priorityTone(reco.priority);

  const typeLabel: Record<string, string> = {
    improvement: "Amélioration",
    measurement: "Mesure",
    methodology: "Méthodologie",
  };
  const typeBadge = reco.reco_type ? typeLabel[reco.reco_type] : null;

  return (
    <div className="relative overflow-hidden rounded-sm border border-border bg-canvas/40 p-4">
      <div className={cn("absolute inset-y-0 left-0 w-0.5", prio.bar)} />

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 pl-2">
        <div className="min-w-[200px] flex-1 text-[14px] font-semibold leading-snug text-ink">
          {reco.title}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {typeBadge && (
            <span className="rounded-sm border border-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted">
              {typeBadge}
            </span>
          )}
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              prio.pill,
              prio.text,
            )}
          >
            Priorité {reco.priority}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pl-2">
        {reco.why && (
          <RecoLine label="Pourquoi" value={reco.why} accent="amber" />
        )}
        <RecoLine label="Action" value={reco.action} accent="accent" strong />
        {reco.when && (
          <RecoLine label="Quand" value={reco.when} accent="sky" />
        )}
        {reco.impact && (
          <RecoLine
            label="Impact attendu"
            value={reco.impact}
            accent="emerald"
          />
        )}
      </div>

      {reco.tool && (
        <div className="mt-3 ml-2 rounded-sm border border-accent/20 bg-accent-50/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-700">
                Outil livré · {reco.tool.type}
              </div>
              <div className="text-[13px] font-semibold text-ink">
                {reco.tool.name}
              </div>
            </div>
            <button
              onClick={() => setToolOpen((o) => !o)}
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "gap-1",
              )}
            >
              {toolOpen ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  Masquer
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Utiliser ce template
                </>
              )}
            </button>
          </div>

          {toolOpen && (
            <div className="mt-3 flex flex-col gap-3 border-t border-accent/20 pt-3">
              <div className="text-[13px] leading-relaxed text-ink">
                {reco.tool.usage}
              </div>

              {reco.tool.timing.length > 0 && (
                <ToolBlock label="Timing">
                  <div className="flex flex-wrap gap-1.5">
                    {reco.tool.timing.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-white px-2.5 py-0.5 text-[11px] text-ink"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </ToolBlock>
              )}

              {reco.tool.questions.length > 0 && (
                <ToolBlock label="Questions clés">
                  <ol className="ml-4 list-decimal space-y-1 text-[13px] leading-relaxed text-ink">
                    {reco.tool.questions.slice(0, 5).map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ol>
                </ToolBlock>
              )}

              {reco.tool.tips.length > 0 && (
                <ToolBlock label="Bonnes pratiques">
                  <ul className="ml-4 list-disc space-y-1 text-[12.5px] leading-relaxed text-ink">
                    {reco.tool.tips.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </ToolBlock>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-700">
        {label}
      </div>
      {children}
    </div>
  );
}

// Toutes les lignes de recommandation (Pourquoi / Action / Quand / Impact)
// utilisent la teinte indigo profonde #4F46E5 pour un libellé homogène.
const RECO_LINE_ACCENT: Record<string, string> = {
  amber: "text-accent-600",
  sky: "text-accent-600",
  emerald: "text-accent-600",
  accent: "text-accent-600",
};

function RecoLine({
  label,
  value,
  accent,
  strong,
}: {
  label: string;
  value: string;
  accent: keyof typeof RECO_LINE_ACCENT;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "min-w-[92px] pt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] whitespace-nowrap",
          RECO_LINE_ACCENT[accent],
        )}
      >
        {label}
      </div>
      <div
        className={cn(
          "flex-1 leading-relaxed",
          strong ? "text-[13.5px] font-medium text-ink" : "text-[13px] text-ink-muted",
        )}
      >
        {value}
      </div>
    </div>
  );
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

  const polar = (a: number) => ({
    x: cx + r * Math.cos(a),
    y: cy + r * Math.sin(a),
  });
  const a0 = polar(startA);
  const a1 = polar(endA);
  const p = polar(progressA);
  const largeArcBg = 1;
  const largeArcFg = clamped > (180 / 270) * 100 ? 1 : 0;
  const useGradient = clamped >= 65;
  const solidColor = scoreColor(clamped);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient
          id="score-gauge-indigo"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path
        d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${largeArcBg} 1 ${a1.x} ${a1.y}`}
        fill="none"
        stroke="#E5E7EB"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {clamped > 0 && (
        <path
          d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${largeArcFg} 1 ${p.x} ${p.y}`}
          fill="none"
          stroke={useGradient ? "url(#score-gauge-indigo)" : solidColor}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      )}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        style={{ fontSize: 44, fontWeight: 800, fill: "#1A1A2E" }}
      >
        {Math.round(clamped)}
      </text>
      <text
        x={cx}
        y={cy + 20}
        textAnchor="middle"
        style={{
          fontSize: 12,
          fontWeight: 600,
          fill: "#6B7280",
          letterSpacing: "0.1em",
        }}
      >
        /100
      </text>
    </svg>
  );
}

/* ── Radar chart SVG ──────────────────────────────────────────────── */

function RadarChart({
  dimensions,
}: {
  dimensions: { label: string; value: number; present: boolean }[];
}) {
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 160;
  const n = dimensions.length;

  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleFor(i)),
    y: cy + r * Math.sin(angleFor(i)),
  });

  const rings = [0.25, 0.5, 0.75, 1.0];
  const presentCount = dimensions.filter((d) => d.present).length;

  const polyPoints = dimensions
    .map((d, i) => {
      const value = d.present ? Math.max(0, Math.min(100, d.value)) : 0;
      const r = (value / 100) * maxR;
      const p = point(i, r);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      style={{
        width: "100%",
        height: "auto",
        maxWidth: 440,
        display: "block",
        margin: "0 auto",
      }}
    >
      <defs>
        <linearGradient
          id="radar-indigo-fill"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient
          id="radar-indigo-stroke"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      {rings.map((rf, idx) => {
        const pts = dimensions
          .map((_, i) => {
            const p = point(i, maxR * rf);
            return `${p.x},${p.y}`;
          })
          .join(" ");
        return (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        );
      })}

      {dimensions.map((d, i) => {
        const p = point(i, maxR);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke={d.present ? "#E5E7EB" : "#CBD5E1"}
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
          style={{ fontSize: 9, fill: "#94A3B8" }}
        >
          {v}
        </text>
      ))}

      {presentCount >= 3 && (
        <polygon
          points={polyPoints}
          fill="url(#radar-indigo-fill)"
          stroke="url(#radar-indigo-stroke)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      )}

      {dimensions.map((d, i) => {
        if (!d.present) {
          return (
            <circle key={i} cx={cx} cy={cy} r={3} fill="#94A3B8" opacity={0.4} />
          );
        }
        const r = (Math.max(0, Math.min(100, d.value)) / 100) * maxR;
        const p = point(i, r);
        const color = scoreColor(d.value);
        return (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={5}
              fill={color}
              stroke="#ffffff"
              strokeWidth={2}
            />
          </g>
        );
      })}

      {dimensions.map((d, i) => {
        const p = point(i, maxR + 30);
        const ta = i === 0 || i === 2 ? "middle" : i === 1 ? "start" : "end";
        const color = d.present ? "#1A1A2E" : "#94A3B8";
        const words = d.label.split(" ");
        const lines: string[] = [];
        let cur = "";
        for (const w of words) {
          if ((cur + " " + w).trim().length > 14 && cur) {
            lines.push(cur.trim());
            cur = w;
          } else {
            cur = (cur + " " + w).trim();
          }
        }
        if (cur) lines.push(cur);
        const baseDy = i === 0 ? -6 : i === 2 ? 16 : 4;
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={ta}
            style={{
              fontSize: 14,
              fontWeight: 700,
              fill: color,
              letterSpacing: "0.02em",
            }}
          >
            {lines.map((ln, li) => (
              <tspan key={li} x={p.x} dy={li === 0 ? baseDy : 17}>
                {ln}
              </tspan>
            ))}
            {d.present && (
              <tspan
                x={p.x}
                dy={17}
                style={{
                  fill: scoreColor(d.value),
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {Math.round(d.value)}
              </tspan>
            )}
          </text>
        );
      })}

      {presentCount < 3 && (
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          style={{ fontSize: 10, fill: "#6B7280", fontStyle: "italic" }}
        >
          Couverture partielle
        </text>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   VOLET RSE (ESG)
   ═══════════════════════════════════════════════════════════════════ */

const RSE_PILLAR_TONE: Record<
  RSEDimension,
  { accent: string; bar: string; iconWrap: string; iconColor: string }
> = {
  environment: {
    accent: "#6366F1",
    bar: "bg-[linear-gradient(135deg,#6366F1,#8B5CF6)]",
    iconWrap: "bg-accent-50",
    iconColor: "text-accent",
  },
  social: {
    accent: "#0EA5E9",
    bar: "bg-sky-500",
    iconWrap: "bg-sky-50",
    iconColor: "text-sky-600",
  },
  governance: {
    accent: "#8B5CF6",
    bar: "bg-violet-500",
    iconWrap: "bg-violet-50",
    iconColor: "text-violet-600",
  },
};

function rseReliabilityTone(
  reliability: RSEInterpretation["summary"]["reliability"],
): { label: string; pill: string; text: string; dot: string } {
  if (reliability === "high")
    return {
      label: "Fiabilité RSE élevée",
      pill: "bg-accent-50 border-accent-200",
      text: "text-accent-700",
      dot: "bg-accent",
    };
  if (reliability === "partial")
    return {
      label: "Fiabilité RSE partielle",
      pill: "bg-amber-50 border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
    };
  return {
    label: "Fiabilité RSE insuffisante",
    pill: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  };
}

function RseSection({ rse }: { rse: RSEInterpretation }) {
  const { summary, recommendations, gaps } = rse;
  const reliability = rseReliabilityTone(summary.reliability);
  const overall = Math.round(summary.overall_rse_score);

  const pillarRows: Array<{ key: RSEDimension; value: number }> = [
    { key: "environment", value: summary.environment_score },
    { key: "social", value: summary.social_score },
    { key: "governance", value: summary.governance_score },
  ];

  return (
    <div className="space-y-4">
      {/* En-tête RSE + piliers */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-accent" />
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-[260px] flex-1">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent-50">
                  <Leaf className="h-4 w-4 text-accent" />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent-600">
                  Volet RSE · ESG
                </div>
              </div>
              <h3 className="mb-2 text-[18px] font-bold leading-snug text-ink">
                {summary.headline}
              </h3>
              <p className="text-[14px] leading-relaxed text-ink-muted">
                {summary.key_insight}
              </p>
            </div>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-sm border px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap",
                reliability.pill,
                reliability.text,
              )}
            >
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  reliability.dot,
                )}
              />
              {reliability.label}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pillarRows.map((p) => {
              const v = Math.max(0, Math.min(100, Math.round(p.value)));
              const tone = RSE_PILLAR_TONE[p.key];
              const active = summary.reliability !== "low" && p.value > 0;
              return (
                <div
                  key={p.key}
                  className="relative overflow-hidden rounded-sm border border-border bg-canvas/40 p-4"
                >
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 w-0.5",
                      active ? tone.bar : "bg-slate-300",
                    )}
                  />
                  <div className="pl-2">
                    <div
                      className={cn(
                        "mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]",
                        active ? tone.iconColor : "text-ink-muted",
                      )}
                    >
                      {RSE_DIMENSION_LABELS[p.key]}
                    </div>
                    <div
                      className={cn(
                        "text-[22px] font-bold leading-none tabular-nums",
                        active ? "text-ink" : "text-ink-muted",
                      )}
                    >
                      {active ? v : "—"}
                      {active && (
                        <span className="ml-1 text-[12px] font-semibold text-ink-muted">
                          /100
                        </span>
                      )}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas">
                      <div
                        className={cn("h-full rounded-full", tone.bar)}
                        style={{ width: `${active ? v : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="relative overflow-hidden rounded-sm border border-accent/30 bg-accent-50/40 p-4">
              <div className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
              <div className="pl-2">
                <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-700">
                  Score RSE global
                </div>
                <div className="text-[22px] font-bold leading-none tabular-nums text-ink">
                  {summary.reliability !== "low" ? overall : "—"}
                  {summary.reliability !== "low" && (
                    <span className="ml-1 text-[12px] font-semibold text-ink-muted">
                      /100
                    </span>
                  )}
                </div>
                <div className="mt-2 text-[11px] leading-snug text-ink-muted">
                  Moyenne simple des piliers mesurés — à interpréter avec la
                  fiabilité affichée.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {recommendations.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent-50 text-accent">
                <ArrowRight className="h-4 w-4" />
              </div>
              <h3 className="text-[14px] font-semibold text-ink">
                Recommandations RSE prioritaires
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {recommendations.map((r) => (
                <RseRecommendationCard
                  key={`${r.dimension}-${r.title}`}
                  reco={r}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {gaps.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-slate-100 text-slate-600">
                <Compass className="h-4 w-4" />
              </div>
              <h3 className="text-[14px] font-semibold text-ink">
                Angles morts RSE
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {gaps.map((g, i) => (
                <RseGapRow key={`${g.dimension}-${i}`} gap={g} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function RseRecommendationCard({ reco }: { reco: RSERecommendation }) {
  const [toolOpen, setToolOpen] = useState(false);
  const prio = priorityTone(reco.priority);
  const tone = RSE_PILLAR_TONE[reco.dimension];
  const dimLabel = RSE_DIMENSION_LABELS[reco.dimension];

  return (
    <div className="relative overflow-hidden rounded-sm border border-border bg-canvas/40 p-4">
      <div className={cn("absolute inset-y-0 left-0 w-0.5", prio.bar)} />

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2 pl-2">
        <div className="min-w-[200px] flex-1 text-[14px] font-semibold leading-snug text-ink">
          {reco.title}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              tone.iconWrap,
              tone.iconColor,
              "border-transparent",
            )}
          >
            {dimLabel}
          </span>
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              prio.pill,
              prio.text,
            )}
          >
            Priorité {reco.priority}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 pl-2">
        <RecoLine label="Pourquoi" value={reco.why} accent="amber" />
        <RecoLine label="Action" value={reco.action} accent="accent" strong />
        <RecoLine label="Quand" value={reco.when} accent="sky" />
        <RecoLine label="Impact attendu" value={reco.impact} accent="emerald" />
      </div>

      <div className="mt-3 ml-2 rounded-sm border border-accent/20 bg-accent-50/50 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent-700">
              Outil livré
            </div>
            <div className="text-[13px] font-semibold text-ink">
              {reco.tool.name}
            </div>
          </div>
          <button
            onClick={() => setToolOpen((o) => !o)}
            className={cn(
              buttonVariants({ variant: "primary", size: "sm" }),
              "gap-1",
            )}
          >
            {toolOpen ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Masquer
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Utiliser ce template
              </>
            )}
          </button>
        </div>

        {toolOpen && (
          <div className="mt-3 flex flex-col gap-3 border-t border-accent/20 pt-3">
            <div className="text-[13px] leading-relaxed text-ink">
              {reco.tool.usage}
            </div>
            <ToolBlock label="Timing">
              <div className="text-[13px] leading-relaxed text-ink-muted">
                {reco.tool.timing}
              </div>
            </ToolBlock>
            {reco.tool.questions.length > 0 && (
              <ToolBlock label="Questions clés">
                <ol className="ml-4 list-decimal space-y-1 text-[13px] leading-relaxed text-ink">
                  {reco.tool.questions.slice(0, 5).map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ol>
              </ToolBlock>
            )}
            {reco.tool.tips.length > 0 && (
              <ToolBlock label="Bonnes pratiques">
                <ul className="ml-4 list-disc space-y-1 text-[12.5px] leading-relaxed text-ink">
                  {reco.tool.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </ToolBlock>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RseGapRow({ gap }: { gap: RSEGap }) {
  const tone = RSE_PILLAR_TONE[gap.dimension];
  return (
    <div className="relative overflow-hidden rounded-sm border border-border bg-canvas/40 p-3">
      <div className={cn("absolute inset-y-0 left-0 w-0.5", tone.bar)} />
      <div className="pl-2">
        <div
          className={cn(
            "mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em]",
            tone.iconColor,
          )}
        >
          {RSE_DIMENSION_LABELS[gap.dimension]}
        </div>
        <div className="mb-1 text-[13px] leading-relaxed text-ink">
          {gap.message}
        </div>
        <div className="text-[12px] leading-relaxed text-ink-muted">
          Impact : {gap.impact}
        </div>
      </div>
    </div>
  );
}
