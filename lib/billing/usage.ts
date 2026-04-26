import type { ModuleId, UsageState } from "./types";

/**
 * Compteurs d'usage stockés en localStorage (mock backend).
 * Lorsque Stripe + DB seront branchés, remplacer uniquement ces 3 fonctions
 * par des appels API — la signature reste identique pour le reste de l'app.
 */

const STORAGE_KEY = "stratly_usage_v1";

/** YYYY-MM du mois courant — sert de clé de reset mensuel. */
function currentMonthKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function emptyUsage(): UsageState {
  return {
    monthKey: currentMonthKey(),
    studio: 0,
    momentum: 0,
    rse: 0,
  };
}

/**
 * Lit l'usage en cours. Si le mois a changé, reset automatique.
 * SSR-safe : retourne un objet vide si window n'existe pas.
 */
export function getUsage(): UsageState {
  if (typeof window === "undefined") return emptyUsage();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyUsage();
    const parsed = JSON.parse(raw) as UsageState;
    if (parsed.monthKey !== currentMonthKey()) {
      const fresh = emptyUsage();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    return emptyUsage();
  }
}

/** Incrémente le compteur du module et persiste. */
export function incrementUsage(module: ModuleId): UsageState {
  const next = getUsage();
  next[module] += 1;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

/** Reset manuel — exposé pour debugging et page compte. */
export function resetUsage(): UsageState {
  const fresh = emptyUsage();
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }
  return fresh;
}
