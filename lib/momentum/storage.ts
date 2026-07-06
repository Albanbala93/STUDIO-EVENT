/**
 * Stockage local des projets Momentum (localStorage).
 * Remplace le backend FastAPI + SQLite pour un déploiement 100% Vercel.
 *
 * Clé localStorage : "momentum_projects_v1" → MomentumProject[]
 */

import type { MomentumProject } from "./types";
import {
  deleteDiagnosticFromCloud,
  pushDiagnosticToCloud,
} from "./remote";

const STORAGE_KEY = "momentum_projects_v1";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function listProjects(): MomentumProject[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MomentumProject[]) : [];
  } catch {
    return [];
  }
}

export function getProject(id: string): MomentumProject | null {
  return listProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(
  project: Omit<MomentumProject, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  }
): MomentumProject {
  const full: MomentumProject = {
    ...project,
    id: project.id ?? `mmt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: project.createdAt ?? new Date().toISOString(),
  };
  if (!isBrowser()) return full;
  try {
    const all = listProjects();
    const next = [full, ...all.filter((p) => p.id !== full.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage plein ou désactivé — on laisse l'objet en mémoire.
  }

  // Réplication cloud best-effort (no-op sans Supabase / hors connexion).
  void pushDiagnosticToCloud(full);
  return full;
}

export function deleteProject(id: string): void {
  if (!isBrowser()) return;
  try {
    const next = listProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
  void deleteDiagnosticFromCloud(id);
}

/**
 * Remplace intégralement le cache local — réservé à la synchronisation
 * cloud (MomentumCloudSync). N'émet PAS de réplication.
 */
export function replaceAllProjectsLocal(projects: MomentumProject[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // noop
  }
}
