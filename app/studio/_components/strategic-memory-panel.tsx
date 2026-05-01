"use client";

/**
 * Panneau "Mémoire stratégique" — affiche tendances et insights dérivés
 * de la couche mémoire (lib/studio/memory). Rendu progressif :
 *   - 0 projet  : aucun rendu (anti-clutter pour les nouveaux utilisateurs)
 *   - 1 projet  : message compact "mémoire en construction"
 *   - ≥ 2       : panneau complet (3 métriques + 0–5 insights)
 *
 * Fait écho au MomentumMemoryBanner (côté Pilot) pour une lecture
 * cohérente : aggregations workspace en haut du dashboard, projets en bas.
 */

import { useEffect, useState } from "react";
import {
  backfillFromProjects,
  computeInsights,
  computeTrends,
  getProjectHistory,
} from "../../../lib/studio/memory";
import { listProjects } from "../../../lib/studio/storage";
import type { ProjectInsight, ProjectTrends } from "../../../lib/studio/types";

const SEVERITY_COLORS: Record<
  ProjectInsight["severity"],
  { bg: string; border: string; dot: string; title: string }
> = {
  info: {
    bg: "var(--surface, #F8FAFC)",
    border: "var(--border-light, #EAEEF4)",
    dot: "var(--slate-light, #6E7785)",
    title: "var(--text, #11161F)",
  },
  highlight: {
    bg: "rgba(99, 102, 241, 0.06)",
    border: "rgba(99, 102, 241, 0.18)",
    dot: "#6366F1",
    title: "var(--navy, #0F172A)",
  },
  warning: {
    bg: "rgba(217, 119, 6, 0.06)",
    border: "rgba(217, 119, 6, 0.20)",
    dot: "#D97706",
    title: "var(--navy, #0F172A)",
  },
};

const KIND_LABEL: Record<ProjectInsight["kind"], string> = {
  frequency: "Fréquence",
  pattern: "Récurrence",
  shift: "Évolution",
  gap: "Angle mort",
};

export function StrategicMemoryPanel() {
  const [hydrated, setHydrated] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);
  const [trends, setTrends] = useState<ProjectTrends | null>(null);
  const [insights, setInsights] = useState<ProjectInsight[]>([]);

  useEffect(() => {
    // Backfill silencieux pour couvrir les projets créés avant l'introduction
    // de la couche mémoire — idempotent, n'ajoute que les manquants.
    const projects = listProjects();
    if (projects.length > 0) {
      backfillFromProjects(projects);
    }

    const history = getProjectHistory();
    setHistoryCount(history.length);
    if (history.length >= 2) {
      setTrends(computeTrends());
      setInsights(computeInsights());
    }
    setHydrated(true);
  }, []);

  if (!hydrated) return null;
  if (historyCount === 0) return null;

  // Compact mode — un seul projet en mémoire
  if (historyCount === 1) {
    return (
      <div className="strategic-memory-panel strategic-memory-panel--compact">
        <span className="strategic-memory-eyebrow">Mémoire stratégique</span>
        <p className="strategic-memory-compact-text">
          Mémoire en construction — 1 projet enregistré. Les comparaisons et
          tendances apparaîtront dès le second projet généré.
        </p>
      </div>
    );
  }

  if (!trends) return null;

  return (
    <div className="strategic-memory-panel">
      <div className="strategic-memory-head">
        <span className="strategic-memory-eyebrow">Mémoire stratégique</span>
        <span className="strategic-memory-window">
          {trends.totalAnalyses} projet{trends.totalAnalyses > 1 ? "s" : ""} ·{" "}
          {trends.windowDays} derniers jours
        </span>
      </div>

      <div className="strategic-memory-metrics">
        <Metric
          label="Type dominant"
          value={
            trends.dominantProjectType
              ? `${trends.dominantProjectType.value}`
              : "—"
          }
          hint={
            trends.dominantProjectType
              ? `${Math.round(trends.dominantProjectType.share * 100)}% des projets`
              : "Pas encore détecté"
          }
        />
        <Metric
          label="Vélocité"
          value={`${trends.velocity.lastWeek} cette semaine`}
          hint={
            trends.velocity.deltaPct === 0
              ? "Stable"
              : trends.velocity.deltaPct > 0
                ? `↗ +${trends.velocity.deltaPct}% vs semaine précédente`
                : `↘ ${trends.velocity.deltaPct}% vs semaine précédente`
          }
          hintColor={
            trends.velocity.deltaPct > 0
              ? "var(--risk-low, #0b8f4a)"
              : trends.velocity.deltaPct < 0
                ? "var(--risk-med, #c97a1a)"
                : undefined
          }
        />
        <Metric
          label="Copilote événement"
          value={`${Math.round(trends.eventCopilotAdoption.share * 100)}%`}
          hint={`${trends.eventCopilotAdoption.count} / ${trends.totalAnalyses} projets`}
        />
      </div>

      {insights.length > 0 && (
        <div className="strategic-memory-insights">
          <span className="strategic-memory-insights-label">
            Observations
          </span>
          <ul className="strategic-memory-insights-list">
            {insights.slice(0, 4).map((ins) => {
              const c = SEVERITY_COLORS[ins.severity];
              return (
                <li
                  key={ins.id}
                  className="strategic-memory-insight"
                  style={{ background: c.bg, borderColor: c.border }}
                >
                  <span
                    className="strategic-memory-insight-dot"
                    style={{ background: c.dot }}
                    aria-hidden="true"
                  />
                  <div className="strategic-memory-insight-body">
                    <p
                      className="strategic-memory-insight-title"
                      style={{ color: c.title }}
                    >
                      <span className="strategic-memory-insight-kind">
                        {KIND_LABEL[ins.kind]}
                      </span>
                      {ins.title}
                    </p>
                    <p className="strategic-memory-insight-description">
                      {ins.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  hintColor,
}: {
  label: string;
  value: string;
  hint?: string;
  hintColor?: string;
}) {
  return (
    <div className="strategic-memory-metric">
      <p className="strategic-memory-metric-label">{label}</p>
      <p className="strategic-memory-metric-value" title={value}>
        {value}
      </p>
      {hint && (
        <p
          className="strategic-memory-metric-hint"
          style={hintColor ? { color: hintColor } : undefined}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
