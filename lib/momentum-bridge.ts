/**
 * Momentum bridge — couche d'intégration Campaign Studio ↔ Momentum.
 *
 * Momentum est désormais intégré dans CS (routes /momentum/*, stockage
 * localStorage). Ce bridge ne fait plus d'appel réseau : il construit
 * l'URL interne du wizard Momentum et lit la mémoire agrégée depuis
 * localStorage via lib/momentum/storage.
 */

import type { ProjectType, StudioProject } from "./studio/types";
import { listProjects } from "./momentum/storage";
import { DIMENSION_LABELS } from "./momentum/types";

/**
 * Mapping des types de projet CS → initiative_type Momentum.
 * Momentum raisonne en termes de "type d'initiative" pour calibrer les KPIs attendus.
 */
const CS_TYPE_TO_MOMENTUM: Record<ProjectType, string> = {
  transformation: "change_management",
  crise: "other",
  "rh-social": "change_management",
  corporate: "corporate_event",
  "deploiement-outil": "product_launch",
  "change-culturel": "change_management",
  reorganisation: "change_management",
  performance: "other",
};

/** Momentum memory profile retourné par GET /memory. */
export type MomentumMemory = {
  unlocked: boolean;
  sample_size: number;
  minimum_required: number;
  score_moyen: number | null;
  point_fort: string | null;
  point_faible: string | null;
  tendance: "hausse" | "baisse" | "stable" | null;
  insights_count: number;
  generated_at: string | null;
};

/**
 * Construit l'URL interne du wizard Momentum pré-rempli depuis un projet CS.
 * Le wizard lit `?from_campaign=...` et hydrate les premières étapes.
 */
export function buildMomentumDiagnosticUrl(project: StudioProject): string {
  const params = new URLSearchParams();
  params.set("from_campaign", project.id);
  params.set("name", project.title);

  const t = project.output.projectType;
  if (t && CS_TYPE_TO_MOMENTUM[t]) {
    params.set("type", CS_TYPE_TO_MOMENTUM[t]);
  }

  if (project.brief.audience) {
    params.set("audience", project.brief.audience);
  }
  if (project.brief.objective) {
    params.set("intent", project.brief.objective);
  }

  return `/momentum/diagnostic?${params.toString()}`;
}

/**
 * Minimum de projets requis pour dévoiler la mémoire agrégée.
 */
const MIN_PROJECTS_FOR_MEMORY = 3;

/**
 * Calcule le profil mémoire agrégé Momentum depuis les projets localStorage.
 * Retourne `null` si l'environnement n'est pas côté navigateur.
 */
export function fetchMomentumMemory(): MomentumMemory | null {
  if (typeof window === "undefined") return null;

  const projects = listProjects();
  const sample = projects.length;

  if (sample === 0) {
    return {
      unlocked: false,
      sample_size: 0,
      minimum_required: MIN_PROJECTS_FOR_MEMORY,
      score_moyen: null,
      point_fort: null,
      point_faible: null,
      tendance: null,
      insights_count: 0,
      generated_at: null,
    };
  }

  const unlocked = sample >= MIN_PROJECTS_FOR_MEMORY;
  const score_moyen =
    projects.reduce((s, p) => s + (p.overallScore || 0), 0) / sample;

  // Agrégation par dimension des scores sauvegardés
  const dimSums: Record<string, { sum: number; n: number }> = {};
  for (const p of projects) {
    for (const ds of p.payload.diagnostic.score.dimension_scores) {
      const hasSignal =
        ds.measured_count + ds.estimated_count + ds.declared_count + ds.proxy_count > 0;
      if (!hasSignal) continue;
      const k = ds.dimension;
      if (!dimSums[k]) dimSums[k] = { sum: 0, n: 0 };
      dimSums[k].sum += ds.score;
      dimSums[k].n += 1;
    }
  }
  const dimAvgs = Object.entries(dimSums).map(([dim, v]) => ({
    dim,
    avg: v.sum / v.n,
  }));
  dimAvgs.sort((a, b) => b.avg - a.avg);

  const point_fort =
    dimAvgs.length > 0
      ? DIMENSION_LABELS[dimAvgs[0].dim as keyof typeof DIMENSION_LABELS] ?? dimAvgs[0].dim
      : null;
  const point_faible =
    dimAvgs.length > 0
      ? DIMENSION_LABELS[
          dimAvgs[dimAvgs.length - 1].dim as keyof typeof DIMENSION_LABELS
        ] ?? dimAvgs[dimAvgs.length - 1].dim
      : null;

  // Tendance : comparer la moyenne des 2 derniers à la moyenne des précédents
  const sorted = [...projects].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
  let tendance: MomentumMemory["tendance"] = "stable";
  if (sorted.length >= 4) {
    const recent = sorted.slice(-2);
    const older = sorted.slice(0, -2);
    const ra = recent.reduce((s, p) => s + p.overallScore, 0) / recent.length;
    const oa = older.reduce((s, p) => s + p.overallScore, 0) / older.length;
    if (ra - oa > 3) tendance = "hausse";
    else if (oa - ra > 3) tendance = "baisse";
  }

  return {
    unlocked,
    sample_size: sample,
    minimum_required: MIN_PROJECTS_FOR_MEMORY,
    score_moyen: Math.round(score_moyen * 100) / 100,
    point_fort: unlocked ? point_fort : null,
    point_faible: unlocked ? point_faible : null,
    tendance: unlocked ? tendance : null,
    insights_count: sample,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Lie un projet Momentum sauvegardé à son projet CS d'origine.
 * Momentum stocke déjà `fromCampaignId` dans le payload lors du save — cette
 * fonction reste exposée pour compat mais ne fait plus d'appel réseau.
 */
export async function linkMomentumProject(
  _csProjectId: string,
  _momentumProjectId: string
): Promise<boolean> {
  return true;
}
