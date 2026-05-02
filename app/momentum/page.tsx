"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Compass,
  FileDown,
  Gauge as GaugeIcon,
  Leaf,
  PlusCircle,
  ShieldCheck,
  Target,
  Trash2,
} from "lucide-react";

import { listProjects, deleteProject } from "../../lib/momentum/storage";
import { INITIATIVE_LABELS, type MomentumProject } from "../../lib/momentum/types";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

/* ─── PAGE ────────────────────────────────────────────────────────── */

export default function MomentumLanding() {
  const [projects, setProjects] = useState<MomentumProject[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProjects(listProjects());
    setHydrated(true);
  }, []);

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Supprimer le diagnostic "${name}" ?`)) return;
    deleteProject(id);
    setProjects(listProjects());
  }

  const stats = useMemo(() => computeStats(projects), [projects]);

  return (
    <div>
      {/* ── Header Hi-Fi : navy gradient + halo violet + Pills + stats ── */}
      <header className="hi-fi-pilot-header">
        <span className="hi-fi-pilot-header-halo" aria-hidden="true" />

        <div className="hi-fi-pilot-header-inner">
          <div className="hi-fi-pilot-header-title-block">
            <span className="hi-fi-pilot-header-overline">Pilot</span>
            <h1 className="hi-fi-pilot-header-title">
              Diagnostic stratégique & pilotage
            </h1>

            {hydrated && stats.count > 0 && (
              <div className="hi-fi-pilot-header-pills">
                <span className="hi-fi-pilot-pill hi-fi-pilot-pill-violet">
                  {stats.count} diagnostic{stats.count > 1 ? "s" : ""} actif{stats.count > 1 ? "s" : ""}
                </span>
                {stats.avgPerf !== null && (
                  <span className="hi-fi-pilot-pill hi-fi-pilot-pill-teal">
                    Performance moyenne {stats.avgPerf}/100
                  </span>
                )}
              </div>
            )}
          </div>

          {hydrated && stats.count > 0 && (
            <div className="hi-fi-pilot-header-stats">
              <div className="hi-fi-pilot-header-stat">
                <span
                  className="hi-fi-pilot-header-stat-value"
                  style={{ color: "var(--accent-teal)" }}
                >
                  {stats.avgPerf !== null ? `${stats.avgPerf}` : "—"}
                </span>
                <span className="hi-fi-pilot-header-stat-label">
                  Score moyen
                </span>
              </div>
              <div className="hi-fi-pilot-header-stat">
                <span
                  className="hi-fi-pilot-header-stat-value"
                  style={{ color: "var(--accent-violet)" }}
                >
                  {stats.count}
                </span>
                <span className="hi-fi-pilot-header-stat-label">
                  Diagnostics
                </span>
              </div>
              <div className="hi-fi-pilot-header-stat">
                <span
                  className="hi-fi-pilot-header-stat-value"
                  style={{ color: "var(--accent-green)" }}
                >
                  {stats.rseCovered}
                </span>
                <span className="hi-fi-pilot-header-stat-label">
                  Volet RSE
                </span>
              </div>
            </div>
          )}

          <div className="hi-fi-pilot-header-cta">
            <Link
              href="/momentum/diagnostic"
              className="hi-fi-pilot-cta-primary"
            >
              <PlusCircle className="h-4 w-4" />
              Nouveau diagnostic
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 py-10 space-y-8">
        {/* ── 1 · Hero exécutif ────────────────────────────────── */}
        <ExecutiveHero stats={stats} />

        {/* ── 2 · Signaux à arbitrer ───────────────────────────── */}
        {stats.count > 0 && <DecisionSignals stats={stats} />}

        {/* ── 3 · Portefeuille ─────────────────────────────────── */}
        <section id="portefeuille">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Portefeuille
              </p>
              <h2 className="text-[18px] font-semibold text-ink mt-1">
                Dispositifs mesurés
              </h2>
            </div>
            {stats.count > 0 && (
              <span className="text-[12px] text-ink-muted">
                {stats.count} dispositif{stats.count > 1 ? "s" : ""} ·{" "}
                {stats.rseCovered} avec volet RSE
              </span>
            )}
          </div>

          {!hydrated ? (
            <EmptyCard>Chargement…</EmptyCard>
          ) : projects.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="grid gap-3">
              {projects.map((p) => (
                <li key={p.id}>
                  <ProjectCard
                    project={p}
                    onDelete={() => handleDelete(p.id, p.name)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 4 · Couche RSE stratégique ───────────────────────── */}
        {stats.count > 0 && <RseStrategicBand stats={stats} />}
      </div>
    </div>
  );
}

/* ─── Section 1 — Hero exécutif ───────────────────────────────────── */

function ExecutiveHero({ stats }: { stats: Stats }) {
  const perfTone = scoreTone(stats.avgPerf);
  const rseTone = scoreTone(stats.avgRse);

  return (
    <section className="relative overflow-hidden rounded-lg border border-border bg-white shadow-card">
      {/* Halo décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-72 w-72 rounded-full bg-accent/[0.08] blur-3xl"
      />

      <div className="relative grid lg:grid-cols-[1.1fr_1fr] gap-0">
        {/* ─ Discours ─ */}
        <div className="p-8 lg:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-50 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-accent-700">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Pilotage stratégique
          </span>

          <h2 className="mt-5 text-[26px] lg:text-[28px] font-bold leading-tight tracking-tight text-ink">
            Mesurez la performance.{" "}
            <span className="text-ink-muted">Prouvez l&apos;impact.</span>
          </h2>

          <p className="mt-3 text-[14px] leading-relaxed text-ink-muted max-w-md">
            Un score consolidé sur 4 dimensions communication et 3 piliers RSE —
            pour arbitrer en COMEX sur des données fiables, pas sur des
            intuitions.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-2">
            <Link
              href="/momentum/diagnostic"
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              <PlusCircle className="h-4 w-4" />
              Lancer un diagnostic
            </Link>
            <a
              href="#portefeuille"
              className={cn(
                buttonVariants({ variant: "ghost", size: "md" }),
                "gap-1.5",
              )}
            >
              Voir le portefeuille
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* ─ Twin scores ─ */}
        <div className="relative border-t lg:border-t-0 lg:border-l border-border bg-gradient-to-br from-canvas/40 to-white p-7 lg:p-8 flex flex-col justify-center gap-3">
          <div className="grid grid-cols-2 gap-3">
            <ScoreTile
              label="Performance"
              hint="moyenne portefeuille"
              value={stats.avgPerf}
              tone={perfTone}
            />
            <ScoreTile
              label="Impact RSE"
              hint={
                stats.rseCovered === 0
                  ? "non encore mesuré"
                  : `${stats.rseCovered} dispositif${stats.rseCovered > 1 ? "s" : ""}`
              }
              value={stats.avgRse}
              tone={rseTone}
              accent="leaf"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MicroStat
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Fiabilité moyenne"
              value={
                stats.avgConfidence !== null ? `${stats.avgConfidence}%` : "—"
              }
            />
            <MicroStat
              icon={<BarChart3 className="h-3.5 w-3.5" />}
              label="Diagnostics actifs"
              value={stats.count.toString()}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreTile({
  label,
  hint,
  value,
  tone,
  accent = "perf",
}: {
  label: string;
  hint: string;
  value: number | null;
  tone: ScoreTone;
  accent?: "perf" | "leaf";
}) {
  const isLeaf = accent === "leaf";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border bg-white p-4",
        isLeaf ? "border-accent/30" : "border-border",
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-0.5",
          tone === "strong"
            ? "bg-emerald-500"
            : tone === "medium"
              ? "bg-amber-500"
              : tone === "weak"
                ? "bg-rose-500"
                : "bg-slate-300",
        )}
      />
      <div className="pl-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          {isLeaf && <Leaf className="h-3 w-3 text-accent" />}
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            {label}
          </span>
        </div>
        <div className="text-[28px] font-bold leading-none tabular-nums text-ink">
          {value !== null ? value : "—"}
          {value !== null && (
            <span className="ml-1 text-[12px] font-semibold text-ink-muted">
              /100
            </span>
          )}
        </div>
        <div className="text-[11px] text-ink-muted mt-1.5">{hint}</div>
      </div>
    </div>
  );
}

function MicroStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-ink-muted mb-0.5">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">
          {label}
        </span>
      </div>
      <div className="text-[14px] font-semibold text-ink tabular-nums">
        {value}
      </div>
    </div>
  );
}

/* ─── Section 2 — Signaux à arbitrer ───────────────────────────────── */

function DecisionSignals({ stats }: { stats: Stats }) {
  return (
    <section
      aria-label="Signaux décisionnels"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <SignalCard
        tone={stats.highPrioReco > 0 ? "warn" : "ok"}
        icon={<AlertTriangle className="h-4 w-4" />}
        title="Arbitrages à trancher"
        value={stats.highPrioReco}
        sub={
          stats.highPrioReco > 0
            ? "recommandation(s) prioritaire(s) en attente"
            : "aucune décision en suspens"
        }
      />
      <SignalCard
        tone={stats.gapsTotal > 0 ? "info" : "ok"}
        icon={<Compass className="h-4 w-4" />}
        title="Angles morts"
        value={stats.gapsTotal}
        sub={
          stats.gapsTotal > 0
            ? "donnée(s) manquante(s) à fiabiliser"
            : "couverture mesure complète"
        }
      />
      <SignalCard
        tone={stats.atRisk > 0 ? "alert" : "ok"}
        icon={<Target className="h-4 w-4" />}
        title="Dispositifs à risque"
        value={stats.atRisk}
        sub={
          stats.atRisk > 0
            ? "score < 50 — revue conseillée"
            : "tous au-dessus du seuil"
        }
      />
    </section>
  );
}

function SignalCard({
  tone,
  icon,
  title,
  value,
  sub,
}: {
  tone: "ok" | "info" | "warn" | "alert";
  icon: React.ReactNode;
  title: string;
  value: number;
  sub: string;
}) {
  const palette =
    tone === "alert"
      ? { bar: "bg-rose-500", chip: "bg-rose-50 text-rose-700", num: "text-rose-700" }
      : tone === "warn"
        ? { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-700", num: "text-amber-700" }
        : tone === "info"
          ? { bar: "bg-accent", chip: "bg-accent-50 text-accent-700", num: "text-accent-700" }
          : { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", num: "text-ink" };

  return (
    <Card className="relative overflow-hidden">
      <div className={cn("absolute inset-y-0 left-0 w-0.5", palette.bar)} />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-muted">
            {title}
          </span>
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-sm",
              palette.chip,
            )}
          >
            {icon}
          </span>
        </div>
        <div
          className={cn(
            "text-[28px] font-bold leading-none tabular-nums",
            palette.num,
          )}
        >
          {value}
        </div>
        <div className="text-[12px] text-ink-muted mt-2 leading-snug">
          {sub}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Section 3 — Carte projet enrichie ────────────────────────────── */

function ProjectCard({
  project,
  onDelete,
}: {
  project: MomentumProject;
  onDelete: () => void;
}) {
  const score = Math.round(project.overallScore);
  const tone = scoreTone(score);
  const status =
    tone === "strong"
      ? { label: "Solide", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" }
      : tone === "medium"
        ? { label: "À renforcer", chip: "bg-amber-50 text-amber-700 border-amber-200" }
        : { label: "À ancrer", chip: "bg-rose-50 text-rose-700 border-rose-200" };

  const rseScore = project.payload?.diagnostic?.rse?.summary?.overall_rse_score;
  const rseReliability = project.payload?.diagnostic?.rse?.summary?.reliability;
  const recos =
    project.payload?.diagnostic?.interpretation?.detailed_analysis?.recommendations ?? [];
  const highPrioRecos = recos.filter(
    (r) => String(r.priority).toLowerCase() === "high",
  ).length;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-card-hover">
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-0.5",
          tone === "strong"
            ? "bg-emerald-500"
            : tone === "medium"
              ? "bg-amber-500"
              : "bg-rose-500",
        )}
      />
      <Link
        href={`/momentum/projects/${project.id}`}
        className="block p-5 pl-6 pr-14"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-sm border text-[10px] font-bold uppercase tracking-[0.1em]",
                  status.chip,
                )}
              >
                {status.label}
              </span>
              {rseScore !== undefined && rseReliability !== "low" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border border-accent/30 bg-accent-50 text-accent-700 text-[10px] font-bold uppercase tracking-[0.1em]">
                  <Leaf className="h-2.5 w-2.5" />
                  RSE {Math.round(rseScore)}
                </span>
              )}
              {project.fromCampaignId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-canvas border border-border text-ink-muted text-[10px] font-semibold">
                  ↔ Campaign
                </span>
              )}
            </div>
            <div className="text-[15px] font-semibold text-ink truncate">
              {project.name}
            </div>
            <div className="text-[12px] text-ink-muted mt-0.5">
              {project.initiativeType
                ? INITIATIVE_LABELS[project.initiativeType]
                : "Initiative"}
              {project.audience ? ` · ${project.audience}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
                Score
              </div>
              <div
                className={cn(
                  "text-[22px] font-bold leading-none tabular-nums mt-1",
                  tone === "strong"
                    ? "text-emerald-700"
                    : tone === "medium"
                      ? "text-amber-700"
                      : "text-rose-700",
                )}
              >
                {score}
                <span className="ml-0.5 text-[12px] font-semibold text-ink-muted">
                  /100
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-ink-muted" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border text-[11px] text-ink-muted">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              {new Date(project.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1 text-accent-700">
              <ShieldCheck className="h-3 w-3" />
              Fiabilité {Math.round(project.confidenceScore)}%
            </span>
            {highPrioRecos > 0 && (
              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                <AlertTriangle className="h-3 w-3" />
                {highPrioRecos} arbitrage{highPrioRecos > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        type="button"
        aria-label="Supprimer ce diagnostic"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-sm border border-border bg-white text-ink-muted hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </Card>
  );
}

/* ─── Section 4 — Couche RSE stratégique ───────────────────────────── */

function RseStrategicBand({ stats }: { stats: Stats }) {
  const hasRse = stats.rseCovered > 0;
  return (
    <section
      aria-label="Couche RSE"
      className="relative overflow-hidden rounded-lg border border-accent/30 bg-gradient-to-r from-accent-50/40 via-white to-white shadow-card"
    >
      <div className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
      <div className="relative p-6 lg:p-7 grid lg:grid-cols-[1fr_auto] gap-6 items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-50 border border-accent/20">
            <Leaf className="h-5 w-5 text-accent" />
          </div>
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-accent-700">
              Couche stratégique · Impact extra-financier
            </div>
            <h3 className="mt-1.5 text-[17px] font-bold leading-snug text-ink">
              {hasRse
                ? "La RSE est intégrée à votre pilotage — pas ajoutée après coup."
                : "Activez la couche RSE pour rendre votre reporting défendable en COMEX."}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted max-w-2xl">
              {hasRse
                ? `Score consolidé Environnement · Social · Gouvernance, aligné CSRD, calculé sur les ${stats.rseCovered} dispositif${stats.rseCovered > 1 ? "s" : ""} couvert${stats.rseCovered > 1 ? "s" : ""}. Exportable directement en rapport COMEX.`
                : "Les diagnostics Pilot ouvrent automatiquement le volet Impact — Environnement, Social, Gouvernance — pour articuler performance communicationnelle et impact extra-financier dans un même reporting."}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {hasRse && stats.avgRse !== null && (
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-muted">
                Score RSE moyen
              </div>
              <div className="text-[28px] font-bold leading-none tabular-nums text-ink mt-1">
                {stats.avgRse}
                <span className="ml-1 text-[12px] font-semibold text-ink-muted">
                  /100
                </span>
              </div>
            </div>
          )}
          <Link
            href="/momentum/diagnostic"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "gap-1.5 text-accent-700 hover:bg-accent-50",
            )}
          >
            {hasRse ? (
              <>
                <FileDown className="h-3.5 w-3.5" />
                Préparer un export COMEX
              </>
            ) : (
              <>
                <ArrowUpRight className="h-3.5 w-3.5" />
                Activer le module Impact
              </>
            )}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Empty states ─────────────────────────────────────────────────── */

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-accent-50 mb-4">
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>
        <h3 className="text-[16px] font-semibold text-ink mb-2">
          Premier dispositif à mesurer
        </h3>
        <p className="text-[13px] text-ink-muted max-w-md mb-5">
          Démarrez votre premier diagnostic — score consolidé sur 4 dimensions
          communication et 3 piliers RSE, avec recommandations exportables.
        </p>
        <Link
          href="/momentum/diagnostic"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          <PlusCircle className="h-4 w-4" />
          Lancer un diagnostic
        </Link>
      </CardContent>
    </Card>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-10 text-center text-[13px] text-ink-muted">
        {children}
      </CardContent>
    </Card>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────────── */

type ScoreTone = "strong" | "medium" | "weak" | "none";

function scoreTone(value: number | null): ScoreTone {
  if (value === null) return "none";
  if (value >= 70) return "strong";
  if (value >= 50) return "medium";
  return "weak";
}

type Stats = {
  count: number;
  avgPerf: number | null;
  avgConfidence: number | null;
  avgRse: number | null;
  rseCovered: number;
  highPrioReco: number;
  gapsTotal: number;
  atRisk: number;
};

function computeStats(projects: MomentumProject[]): Stats {
  if (projects.length === 0) {
    return {
      count: 0,
      avgPerf: null,
      avgConfidence: null,
      avgRse: null,
      rseCovered: 0,
      highPrioReco: 0,
      gapsTotal: 0,
      atRisk: 0,
    };
  }

  const avgPerf = Math.round(
    projects.reduce((s, p) => s + p.overallScore, 0) / projects.length,
  );
  const avgConfidence = Math.round(
    projects.reduce((s, p) => s + p.confidenceScore, 0) / projects.length,
  );

  const rseProjects = projects.filter(
    (p) =>
      p.payload?.diagnostic?.rse?.summary != null &&
      p.payload.diagnostic.rse.summary.reliability !== "low",
  );
  const avgRse =
    rseProjects.length === 0
      ? null
      : Math.round(
          rseProjects.reduce(
            (s, p) =>
              s + (p.payload.diagnostic.rse?.summary.overall_rse_score ?? 0),
            0,
          ) / rseProjects.length,
        );

  const highPrioReco = projects.reduce((acc, p) => {
    const recos =
      p.payload?.diagnostic?.interpretation?.detailed_analysis
        ?.recommendations ?? [];
    return (
      acc +
      recos.filter((r) => String(r.priority).toLowerCase() === "high").length
    );
  }, 0);

  const gapsTotal = projects.reduce((acc, p) => {
    const gaps =
      p.payload?.diagnostic?.interpretation?.detailed_analysis?.data_gaps ?? [];
    return acc + gaps.length;
  }, 0);

  const atRisk = projects.filter((p) => p.overallScore < 50).length;

  return {
    count: projects.length,
    avgPerf,
    avgConfidence,
    avgRse,
    rseCovered: rseProjects.length,
    highPrioReco,
    gapsTotal,
    atRisk,
  };
}
