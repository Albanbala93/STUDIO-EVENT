/**
 * Bloc 6 — service de détection et de gestion de l'obsolescence des modules.
 *
 * Principes :
 *   1. Détection passive  → diff entre la version précédente et la version
 *      sauvegardée d'un projet. Aucun recalcul automatique.
 *   2. Marquage explicite → seul un module *déjà généré* peut devenir stale.
 *      Si Pilot n'a jamais tourné, modifier le brief ne marque rien.
 *   3. Levée explicite    → un module redevient frais quand il est régénéré
 *      (clearModuleStaleness appelé par le flow de génération).
 *   4. Dismiss éphémère   → "Plus tard" masque la bannière dans la session
 *      en cours, mais la marque persiste tant que le module n'est pas
 *      régénéré (visible au prochain refresh / navigation).
 *
 * Aucun appel LLM, aucune dépendance externe. Tout en localStorage /
 * sessionStorage côté client. SSR-safe via guards window.
 */

import type { StudioProject } from "../studio/types";
import type { ModuleName } from "./enrichment-engine";
import {
  DEPENDENCY_MAP,
  FIELD_LABELS,
  MODULE_LABELS,
  TRACKED_BRIEF_FIELDS,
  type BriefFieldKey,
  type DependencyKey,
} from "./dependency-map";

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

/** Marqueur attaché à un module obsolète. */
export type StalenessMark = {
  /** ISO de la date où l'obsolescence a été détectée. */
  staleSince: string;
  /** Raison lisible : "Modification de l'audience", "Mise à jour de Campaign"... */
  reason: string;
  /** Clés de dépendance ayant déclenché le marquage (debug + cumul). */
  triggers: DependencyKey[];
};

/** Vue UI : un module à rafraîchir avec le contexte humain pour la bannière. */
export type StaleModuleView = {
  module: ModuleName;
  moduleLabel: string;
  reason: string;
  staleSince: string;
};

/* ──────────────────────────────────────────────────────────────────
   Helpers internes
   ────────────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModulesContainer(project: StudioProject): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectAny = project as any;
  projectAny.modules = projectAny.modules ?? {};
  return projectAny.modules;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function moduleHasOutput(project: StudioProject, module: ModuleName): boolean {
  if (module === "campaign") {
    // Campaign output vit directement sur project.output (pas dans modules.*).
    return !!project.output?.executiveSummary;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectAny = project as any;
  return !!projectAny.modules?.[module]?.output;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModuleNode(project: StudioProject, module: ModuleName): any {
  const modules = getModulesContainer(project);
  modules[module] = modules[module] ?? {};
  return modules[module];
}

function reasonForKey(key: DependencyKey): string {
  if (key.startsWith("brief.")) {
    const field = key.slice("brief.".length) as BriefFieldKey;
    const label = FIELD_LABELS[field] ?? field;
    // Capitalisation propre : "Modification de l'audience cible"
    return `Modification de ${label}`;
  }
  if (key.startsWith("module.")) {
    const m = key.slice("module.".length) as ModuleName;
    return `Mise à jour de ${MODULE_LABELS[m] ?? m}`;
  }
  return "Modification du projet";
}

/* ──────────────────────────────────────────────────────────────────
   Diff — calcul des clés impactées entre deux versions de projet
   ────────────────────────────────────────────────────────────────── */

/**
 * Compare deux versions d'un projet et retourne la liste des clés de
 * dépendance qui ont changé. Détecte :
 *   - tout champ brief surveillé dont la valeur (trimmée) diffère
 *   - tout module dont la sortie a changé (équivalence par hash JSON)
 */
export function diffSensitiveKeys(
  prev: StudioProject | null | undefined,
  next: StudioProject,
): DependencyKey[] {
  const changed: DependencyKey[] = [];
  if (!prev) return changed;

  // Brief fields
  for (const field of TRACKED_BRIEF_FIELDS) {
    const a = (prev.brief?.[field] ?? "").trim();
    const b = (next.brief?.[field] ?? "").trim();
    if (a !== b) changed.push(`brief.${field}` as DependencyKey);
  }

  // Campaign output (vit sur project.output)
  const prevCampaign = JSON.stringify(prev.output ?? null);
  const nextCampaign = JSON.stringify(next.output ?? null);
  if (prevCampaign !== nextCampaign) changed.push("module.campaign");

  // Pilot output (modules.pilot.output)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevPilot = JSON.stringify((prev as any).modules?.pilot?.output ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextPilot = JSON.stringify((next as any).modules?.pilot?.output ?? null);
  if (prevPilot !== nextPilot) changed.push("module.pilot");

  // Impact output (modules.impact.output)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevImpact = JSON.stringify((prev as any).modules?.impact?.output ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextImpact = JSON.stringify((next as any).modules?.impact?.output ?? null);
  if (prevImpact !== nextImpact) changed.push("module.impact");

  return changed;
}

/* ──────────────────────────────────────────────────────────────────
   Marquage / nettoyage des modules
   ────────────────────────────────────────────────────────────────── */

/**
 * Applique le marquage staleness sur le projet en fonction des clés
 * de dépendance qui ont changé. Ne touche QUE les modules déjà générés.
 *
 * Mute le projet en place (pour s'aligner sur le pattern utilisé ailleurs
 * dans le codebase, ex. updateSectionStatus).
 *
 * Retourne la liste des modules nouvellement marqués (vide si rien à faire).
 */
export function applyStalenessFromKeys(
  project: StudioProject,
  changedKeys: DependencyKey[],
): ModuleName[] {
  if (changedKeys.length === 0) return [];

  // Agrégation : pour chaque module candidat, on accumule les triggers.
  const perModule = new Map<ModuleName, DependencyKey[]>();
  for (const key of changedKeys) {
    const impacted = DEPENDENCY_MAP[key] ?? [];
    for (const m of impacted) {
      // Un module ne se marque jamais lui-même (sa propre régénération
      // n'est pas une raison de le marquer comme obsolète).
      if (key === `module.${m}`) continue;
      const list = perModule.get(m) ?? [];
      list.push(key);
      perModule.set(m, list);
    }
  }

  const newlyMarked: ModuleName[] = [];
  const now = new Date().toISOString();

  for (const [module, triggers] of perModule) {
    if (!moduleHasOutput(project, module)) continue;

    const node = getModuleNode(project, module);
    const existing: StalenessMark | undefined = node.staleness;

    // Aggrège les triggers pour conserver l'historique (max 5).
    const mergedTriggers = Array.from(
      new Set([...(existing?.triggers ?? []), ...triggers]),
    ).slice(0, 5);

    node.staleness = {
      staleSince: existing?.staleSince ?? now,
      reason: reasonForKey(triggers[0]),
      triggers: mergedTriggers,
    } as StalenessMark;

    if (!existing) newlyMarked.push(module);
  }

  return newlyMarked;
}

/**
 * Détecte + applique en une seule passe. Helper pratique appelé depuis
 * le hook saveProject.
 */
export function detectAndApplyStaleness(
  prev: StudioProject | null | undefined,
  next: StudioProject,
): ModuleName[] {
  const keys = diffSensitiveKeys(prev, next);
  return applyStalenessFromKeys(next, keys);
}

/**
 * Lève le marqueur d'obsolescence d'un module. À appeler dans le flow
 * de génération de chaque module après succès (Pilot → après diagnostic,
 * Campaign → après nouvelle génération, Impact → idem si flow existe).
 *
 * Mute le projet en place. Idempotent.
 */
export function clearModuleStaleness(
  project: StudioProject,
  module: ModuleName,
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projectAny = project as any;
  if (!projectAny.modules?.[module]) return;
  if (projectAny.modules[module].staleness) {
    delete projectAny.modules[module].staleness;
  }
}

/* ──────────────────────────────────────────────────────────────────
   Lecture — modules actuellement obsolètes
   ────────────────────────────────────────────────────────────────── */

const ALL_MODULES: ModuleName[] = ["campaign", "pilot", "impact"];

export function getStaleModules(project: StudioProject): StaleModuleView[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules = (project as any).modules ?? {};
  const out: StaleModuleView[] = [];
  for (const m of ALL_MODULES) {
    const mark: StalenessMark | undefined = modules[m]?.staleness;
    if (!mark) continue;
    out.push({
      module: m,
      moduleLabel: MODULE_LABELS[m],
      reason: mark.reason,
      staleSince: mark.staleSince,
    });
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────
   Dismiss éphémère — sessionStorage par projet + module
   ────────────────────────────────────────────────────────────────── */

const DISMISS_PREFIX = "stratly_staleness_dismiss_";

function dismissKey(projectId: string, module: ModuleName): string {
  return `${DISMISS_PREFIX}${projectId}__${module}`;
}

export function dismissBanner(projectId: string, module: ModuleName): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(dismissKey(projectId, module), "1");
  } catch {
    /* noop : sessionStorage indisponible (mode privé) → on retombe sur affichage */
  }
}

export function isBannerDismissed(
  projectId: string,
  module: ModuleName,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(dismissKey(projectId, module)) === "1";
  } catch {
    return false;
  }
}

export function clearAllDismissals(projectId: string): void {
  if (typeof window === "undefined") return;
  try {
    for (const m of ALL_MODULES) {
      window.sessionStorage.removeItem(dismissKey(projectId, m));
    }
  } catch {
    /* noop */
  }
}

/* ──────────────────────────────────────────────────────────────────
   URL de redirection "Mettre à jour maintenant"
   ────────────────────────────────────────────────────────────────── */

/**
 * Construit l'URL vers le module à régénérer, en passant le projectId
 * pour que la cible puisse réutiliser l'enrichissement Bloc 4.
 */
export function buildRefreshUrl(
  projectId: string,
  module: ModuleName,
): string {
  switch (module) {
    case "pilot":
      return `/momentum/diagnostic?from_campaign=${encodeURIComponent(projectId)}`;
    case "campaign":
      // Le flow Campaign démarre par un nouveau brief — pas de régen in-place
      // sur un projet existant pour l'instant. On renvoie sur la page projet
      // qui propose les actions pertinentes.
      return `/studio/${encodeURIComponent(projectId)}`;
    case "impact":
      // Impact n'a pas encore de page dédiée — fallback sur le dashboard Pilot.
      return `/momentum`;
  }
}
