import type {
  EntitlementCheck,
  ModuleId,
  Plan,
  UsageState,
} from "./types";

/**
 * Vérifie si un module est inclus dans le plan.
 * À utiliser pour le gating UI (afficher/masquer un bouton, rediriger vers /pricing).
 */
export function hasModule(plan: Plan, module: ModuleId): boolean {
  return plan.entitlements.modules.includes(module);
}

/** Le plan autorise-t-il les exports PDF / dossier COMEX ? */
export function canExport(plan: Plan): boolean {
  return plan.entitlements.exports;
}

/** Total de projets consommés ce mois-ci (toutes catégories confondues). */
export function projectsUsedThisMonth(usage: UsageState): number {
  return usage.studio + usage.momentum + usage.rse;
}

/**
 * Projets restants ce mois — "unlimited" si le plan n'a pas de plafond.
 * Retourne 0 si le plafond est atteint.
 */
export function remainingProjects(
  plan: Plan,
  usage: UsageState,
): number | "unlimited" {
  const cap = plan.entitlements.maxProjectsPerMonth;
  if (cap === "unlimited") return "unlimited";
  return Math.max(0, cap - projectsUsedThisMonth(usage));
}

/**
 * Décide si l'utilisateur peut créer un nouveau projet pour le module donné.
 * Combine deux contraintes :
 *   1. le module doit être inclus dans le plan,
 *   2. le quota mensuel ne doit pas être atteint.
 */
export function canCreateProject(
  plan: Plan,
  usage: UsageState,
  module: ModuleId,
): EntitlementCheck {
  if (!hasModule(plan, module)) {
    return { allowed: false, reason: "module-locked" };
  }
  const remaining = remainingProjects(plan, usage);
  if (remaining !== "unlimited" && remaining <= 0) {
    return { allowed: false, reason: "quota-reached" };
  }
  return { allowed: true };
}

/** Décide si l'utilisateur peut exporter — utilisé sur les boutons d'export. */
export function checkExport(plan: Plan): EntitlementCheck {
  if (!canExport(plan)) {
    return { allowed: false, reason: "exports-locked" };
  }
  return { allowed: true };
}
