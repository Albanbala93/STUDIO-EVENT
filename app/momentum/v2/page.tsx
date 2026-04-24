"use client";

import * as React from "react";
import {
  Download,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";

import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Progress } from "../../../components/ui/progress";
import { cn } from "../../../lib/utils";

import { listProjects } from "../../../lib/momentum/storage";
import type {
  DiagnosticPayload,
  Dimension,
  MomentumProject,
} from "../../../lib/momentum/types";
import {
  DIMENSION_LABELS,
  INITIATIVE_LABELS,
} from "../../../lib/momentum/types";

import { Gauge } from "./_components/gauge";
import {
  DEMO_HEADER,
  DEMO_DIAGNOSTIC,
} from "./_components/demo-data";

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function scoreBarClass(score: number): string {
  if (score >= 70) return "bg-accent";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function confidenceDot(conf: number): { color: string; label: string } {
  if (conf >= 75) return { color: "bg-blue-500", label: "Fiabilité élevée" };
  if (conf >= 50) return { color: "bg-amber-500", label: "Fiabilité moyenne" };
  return { color: "bg-red-500", label: "Fiabilité faible" };
}

function statusBadge(score: number): {
  tone: "success" | "warn" | "danger";
  label: string;
} {
  if (score >= 70) return { tone: "success", label: "Performance solide" };
  if (score >= 50) return { tone: "warn", label: "Performance mitigée" };
  return { tone: "danger", label: "Performance faible" };
}

function reliabilityBadge(conf: number): {
  tone: "success" | "warn" | "danger";
  label: string;
} {
  if (conf >= 75) return { tone: "success", label: "Données fiables" };
  if (conf >= 50) return { tone: "warn", label: "Fiabilité partielle" };
  return { tone: "danger", label: "Données à consolider" };
}

function priorityTone(priority: string): "danger" | "warn" | "info" {
  const p = priority.toLowerCase();
  if (p === "haute" || p === "high") return "danger";
  if (p === "moyenne" || p === "medium") return "warn";
  return "info";
}

function priorityLabel(priority: string): string {
  const p = priority.toLowerCase();
  if (p === "haute" || p === "high") return "Haute";
  if (p === "moyenne" || p === "medium") return "Moyenne";
  return "Faible";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function V2Dashboard() {
  const [project, setProject] = React.useState<MomentumProject | null | "loading">(
    "loading",
  );

  React.useEffect(() => {
    const projects = listProjects();
    setProject(projects.length > 0 ? projects[0] : null);
  }, []);

  if (project === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-ink-muted">Chargement…</div>
      </div>
    );
  }

  // Données — projet réel OU démo (spec mock figé pour le design-review)
  const usingDemo = project === null;
  const header = usingDemo
    ? DEMO_HEADER
    : {
        title: project.payload.id.name || "Initiative sans nom",
        subtitle: [
          project.payload.id.initiativeType
            ? INITIATIVE_LABELS[project.payload.id.initiativeType]
            : "Initiative",
          project.payload.id.audienceSize > 0
            ? `${project.payload.id.audienceSize.toLocaleString("fr-FR")} participants`
            : "Audience non précisée",
          formatDate(project.createdAt),
        ]
          .filter(Boolean)
          .join(" · "),
      };
  const diag: DiagnosticPayload = usingDemo
    ? DEMO_DIAGNOSTIC
    : project.payload.diagnostic;

  return (
    <div className="animate-fade-up">
      <Header title={header.title} subtitle={header.subtitle} demo={usingDemo} />

      <div className="px-8 pb-10">
        <div className="mx-auto max-w-6xl flex flex-col gap-6">
          <ScoreBlock diagnostic={diag} />
          <DimensionsBlock diagnostic={diag} />
          <DiagnosticGrid diagnostic={diag} />
          <BlindspotsBlock diagnostic={diag} />
          <ActionBar />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════════════════════════ */

function Header({
  title,
  subtitle,
  demo,
}: {
  title: string;
  subtitle: string;
  demo: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-start justify-between gap-4 px-8 pt-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone="neutral" className="font-medium normal-case tracking-normal text-[10px]">
              Diagnostic
            </Badge>
            {demo && (
              <Badge tone="info" className="font-medium normal-case tracking-normal text-[10px]">
                Démo
              </Badge>
            )}
          </div>
          <h1 className="mt-1 truncate text-[20px] font-semibold leading-tight text-ink">
            {title}
          </h1>
          <p className="text-sm text-ink-muted">{subtitle}</p>
        </div>
        <Button variant="primary" size="md" className="shrink-0">
          <Download className="h-4 w-4" />
          Exporter le rapport
        </Button>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 1 — Communication Score (dominant)
   ═══════════════════════════════════════════════════════════════════ */

function ScoreBlock({ diagnostic }: { diagnostic: DiagnosticPayload }) {
  const score = Math.round(diagnostic.score.overall_score);
  const confidence = Math.round(diagnostic.score.confidence_score);
  const status = statusBadge(score);
  const reliability = reliabilityBadge(confidence);
  const keyInsight = diagnostic.interpretation.executive_summary.key_insight;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-4 px-8 py-10 md:flex-row md:gap-10">
        <div className="shrink-0">
          <Gauge value={score} />
        </div>
        <div className="flex flex-1 flex-col items-center gap-3 text-center md:items-start md:text-left">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
            Communication Score
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone={reliability.tone}>{reliability.label}</Badge>
          </div>
          <p className="max-w-2xl text-[15px] leading-relaxed text-ink-muted">
            {keyInsight}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 2 — Les 4 dimensions
   ═══════════════════════════════════════════════════════════════════ */

const DIMENSION_ORDER: Dimension[] = [
  "reach",
  "engagement",
  "appropriation",
  "impact",
];

const DIMENSION_SHORT: Record<Dimension, string> = {
  reach: "Mobilisation",
  engagement: "Implication",
  appropriation: "Compréhension",
  impact: "Impact",
};

function DimensionsBlock({ diagnostic }: { diagnostic: DiagnosticPayload }) {
  const byDim = new Map(
    diagnostic.score.dimension_scores.map((d) => [d.dimension, d]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Les 4 dimensions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {DIMENSION_ORDER.map((dim) => {
          const d = byDim.get(dim);
          const present = !!d && d.kpi_breakdown.length > 0;
          const score = Math.round(d?.score ?? 0);
          const conf = Math.round(d?.confidence_score ?? 0);
          const dot = confidenceDot(conf);
          return (
            <div key={dim} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                  {DIMENSION_SHORT[dim]}
                  {present && (
                    <span
                      title={dot.label}
                      className={cn("h-2 w-2 rounded-full", dot.color)}
                    />
                  )}
                </div>
                <div className="text-sm font-semibold text-ink">
                  {present ? (
                    <>
                      {score}
                      <span className="text-ink-muted font-medium">/100</span>
                    </>
                  ) : (
                    <span className="text-ink-muted font-medium">
                      Non évaluée
                    </span>
                  )}
                </div>
              </div>
              <Progress
                value={present ? score : 0}
                barClassName={
                  present ? scoreBarClass(score) : "bg-gray-200"
                }
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 3 — Diagnostic 3 colonnes
   ═══════════════════════════════════════════════════════════════════ */

function DiagnosticGrid({ diagnostic }: { diagnostic: DiagnosticPayload }) {
  const strengths = diagnostic.interpretation.executive_summary.top_strengths.slice(
    0,
    3,
  );
  const weaknesses = diagnostic.interpretation.detailed_analysis.weaknesses.slice(
    0,
    3,
  );
  const recos = diagnostic.interpretation.detailed_analysis.recommendations.slice(
    0,
    3,
  );

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <DiagnosticColumn
        title="Points forts"
        accent="border-l-accent"
        icon={<CheckCircle2 className="h-4 w-4 text-accent" />}
        empty="Aucun point fort clairement consolidé pour l'instant."
      >
        {strengths.map((s) => (
          <li key={s} className="flex gap-2.5 text-sm leading-relaxed text-ink">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            <span>{s}</span>
          </li>
        ))}
      </DiagnosticColumn>

      <DiagnosticColumn
        title="Points de vigilance"
        accent="border-l-amber-500"
        icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
        empty="Aucun point de vigilance identifié."
      >
        {weaknesses.map((w) => (
          <li key={w.title} className="flex gap-2.5 text-sm leading-relaxed text-ink">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <div className="font-semibold text-ink">{w.title}</div>
              <div className="text-ink-muted">{w.description}</div>
            </div>
          </li>
        ))}
      </DiagnosticColumn>

      <DiagnosticColumn
        title="Recommandations"
        accent="border-l-blue-500"
        icon={<ArrowRight className="h-4 w-4 text-blue-500" />}
        empty="Instrumenter les angles morts avant de recommander."
      >
        {recos.map((r) => {
          const tone = priorityTone(String(r.priority));
          return (
            <li
              key={r.title}
              className="flex flex-col gap-2 rounded-sm border border-border bg-canvas/60 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13px] font-semibold leading-snug text-ink">
                  {r.title}
                </div>
                <Badge tone={tone} className="shrink-0">
                  {priorityLabel(String(r.priority))}
                </Badge>
              </div>
              {r.action && (
                <div className="text-[12px] leading-relaxed text-ink-muted">
                  {r.action}
                </div>
              )}
            </li>
          );
        })}
      </DiagnosticColumn>
    </div>
  );
}

function DiagnosticColumn({
  title,
  accent,
  icon,
  empty,
  children,
}: {
  title: string;
  accent: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  return (
    <Card className={cn("border-l-[3px]", accent)}>
      <CardHeader className="flex-row items-center gap-2">
        {icon}
        <CardTitle className="!mt-0">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm italic text-ink-muted">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-3">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 4 — Angles morts
   ═══════════════════════════════════════════════════════════════════ */

function BlindspotsBlock({ diagnostic }: { diagnostic: DiagnosticPayload }) {
  const gaps = diagnostic.interpretation.detailed_analysis.data_gaps.slice(0, 5);
  if (gaps.length === 0) return null;

  return (
    <Card className="bg-gray-50/70 border-dashed">
      <CardHeader className="flex-row items-center gap-2">
        <EyeOff className="h-4 w-4 text-ink-muted" />
        <CardTitle className="!mt-0 text-ink-muted">Angles morts de mesure</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {gaps.map((g) => (
            <li
              key={`${g.field}-${g.issue}`}
              className="flex flex-col gap-1 text-sm"
            >
              <div className="text-ink">
                <span className="font-semibold">{g.field}</span>
                <span className="text-ink-muted"> — {g.issue}</span>
              </div>
              <div className="text-[12px] text-ink-muted italic">
                Impact : {g.impact}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BLOC 5 — Barre d'actions
   ═══════════════════════════════════════════════════════════════════ */

function ActionBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-white px-5 py-4 shadow-card">
      <Button variant="primary">
        <Download className="h-4 w-4" />
        Exporter PDF
      </Button>
      <Button variant="secondary">
        <Save className="h-4 w-4" />
        Sauvegarder
      </Button>
      <Button variant="outline">
        <RotateCcw className="h-4 w-4" />
        Nouvelle analyse
      </Button>
      <div className="flex-1" />
      <div className="hidden items-center gap-1.5 text-xs text-ink-muted md:flex">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        Généré par Momentum · Stratly
      </div>
    </div>
  );
}
