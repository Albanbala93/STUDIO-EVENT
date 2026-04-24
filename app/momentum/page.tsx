"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Gauge as GaugeIcon,
  Leaf,
  PlusCircle,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { listProjects, deleteProject } from "../../lib/momentum/storage";
import { INITIATIVE_LABELS, type MomentumProject } from "../../lib/momentum/types";
import { cn } from "../../lib/utils";
import { buttonVariants } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

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

  const stats = useMemo(() => {
    if (projects.length === 0) {
      return { count: 0, avg: null as number | null, topDimension: null as string | null };
    }
    const avg = Math.round(
      projects.reduce((s, p) => s + p.overallScore, 0) / projects.length,
    );
    return { count: projects.length, avg, topDimension: null };
  }, [projects]);

  return (
    <div>
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur-sm border-b border-border">
        <div className="mx-auto max-w-6xl px-8 h-16 flex items-center justify-between">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] uppercase tracking-[0.14em] text-ink-muted">
              Momentum
            </span>
            <h1 className="text-[18px] font-semibold text-ink">
              Diagnostics de performance
            </h1>
          </div>
          <Link
            href="/momentum/diagnostic"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <PlusCircle className="h-4 w-4" />
            Nouveau diagnostic
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={<BarChart3 className="h-4 w-4 text-accent" />}
            label="Diagnostics"
            value={stats.count.toString()}
            sub={stats.count > 0 ? "mesurés à date" : "à initier"}
          />
          <StatCard
            icon={<GaugeIcon className="h-4 w-4 text-accent" />}
            label="Score moyen"
            value={stats.avg !== null ? `${stats.avg}/100` : "—"}
            sub={
              stats.avg === null
                ? "aucune mesure"
                : stats.avg >= 70
                  ? "performance solide"
                  : stats.avg >= 50
                    ? "performance en construction"
                    : "à ancrer"
            }
          />
          <StatCard
            icon={<Leaf className="h-4 w-4 text-accent" />}
            label="Volet RSE"
            value="Actif"
            sub="Environnement · Social · Gouvernance"
          />
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-ink">
              Vos diagnostics
            </h2>
            {stats.count > 0 && (
              <span className="text-[12px] text-ink-muted">
                {stats.count} diagnostic{stats.count > 1 ? "s" : ""} enregistré
                {stats.count > 1 ? "s" : ""}
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
      </div>
    </div>
  );
}

/* ─── SOUS-COMPOSANTS ──────────────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent-50">
            {icon}
          </div>
          <span className="text-[11px] uppercase tracking-[0.12em] text-ink-muted font-semibold">
            {label}
          </span>
        </div>
        <div className="text-[24px] font-bold text-ink leading-none">
          {value}
        </div>
        <div className="text-[12px] text-ink-muted mt-2">{sub}</div>
      </CardContent>
    </Card>
  );
}

function ProjectCard({
  project,
  onDelete,
}: {
  project: MomentumProject;
  onDelete: () => void;
}) {
  const scoreColor =
    project.overallScore >= 70
      ? "bg-accent-50 text-accent-700 border-accent-200"
      : project.overallScore >= 50
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-card-hover">
      <Link
        href={`/momentum/projects/${project.id}`}
        className="block p-5 pr-14"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-ink truncate">
              {project.name}
            </div>
            <div className="text-[12px] text-ink-muted mt-1">
              {project.initiativeType
                ? INITIATIVE_LABELS[project.initiativeType]
                : "Initiative"}
              {project.audience ? ` · ${project.audience}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              className={cn(
                "flex items-center justify-center min-w-[56px] px-3 py-2 rounded-sm border text-[16px] font-bold",
                scoreColor,
              )}
            >
              {Math.round(project.overallScore)}
            </div>
            <ArrowRight className="h-4 w-4 text-ink-muted" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-border text-[11px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span>
              {new Date(project.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            <span className="inline-flex items-center gap-1 text-accent-700">
              <ShieldCheck className="h-3 w-3" />
              Confiance {Math.round(project.confidenceScore)}%
            </span>
          </div>
          {project.fromCampaignId && (
            <span className="px-2 py-0.5 rounded-sm bg-accent-50 text-accent-700 font-medium">
              ↔ Campaign Studio
            </span>
          )}
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

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-accent-50 mb-4">
          <BarChart3 className="h-5 w-5 text-accent" />
        </div>
        <h3 className="text-[16px] font-semibold text-ink mb-2">
          Aucun diagnostic pour le moment
        </h3>
        <p className="text-[13px] text-ink-muted max-w-md mb-5">
          Démarrez votre premier diagnostic Momentum pour mesurer la performance
          d&apos;une initiative sur 4 dimensions communication et 3 piliers RSE.
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
