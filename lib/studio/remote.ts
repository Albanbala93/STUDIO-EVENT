/**
 * Couche cloud des projets Studio — Supabase.
 *
 * Principe : le localStorage reste le cache de lecture (API synchrone
 * inchangée dans storage.ts) ; chaque écriture est répliquée ici en
 * arrière-plan, et l'entrée dans /studio déclenche un pull + merge.
 *
 * Fail-safe : sans Supabase configuré ou sans session, toutes les
 * fonctions deviennent des no-op silencieux (comportement bêta locale).
 */

import { getSupabaseBrowserClient } from "../supabase/client";
import type { StudioProject } from "./types";

type ProjectRow = {
  id: string;
  user_id: string;
  module: string;
  title: string;
  status: string;
  data: StudioProject;
  updated_at: string;
};

async function getClientAndUser() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** Tous les projets Studio de l'utilisateur connecté, ou null si cloud inactif. */
export async function pullRemoteProjects(): Promise<StudioProject[] | null> {
  const ctx = await getClientAndUser();
  if (!ctx) return null;

  const { data, error } = await ctx.supabase
    .from("projects")
    .select("data")
    .eq("module", "studio")
    .order("updated_at", { ascending: false });

  if (error || !data) return null;
  return (data as Pick<ProjectRow, "data">[])
    .map((row) => row.data)
    .filter((p): p is StudioProject => Boolean(p && p.id));
}

/** Réplique un projet vers le cloud (upsert). Ne lève jamais. */
export async function pushProjectToCloud(project: StudioProject): Promise<void> {
  try {
    const ctx = await getClientAndUser();
    if (!ctx) return;

    await ctx.supabase.from("projects").upsert(
      {
        id: project.id,
        user_id: ctx.user.id,
        module: "studio",
        title: project.title ?? "",
        status: project.status ?? "draft",
        data: project,
        updated_at: project.updatedAt ?? new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch {
    // Réplication best-effort : jamais bloquante pour l'utilisateur.
  }
}

/**
 * Synchronisation d'entrée : merge cloud ↔ local (le plus récent gagne),
 * pousse les projets locaux absents ou plus frais, retourne la liste
 * fusionnée — ou null si le cloud est inactif.
 */
export async function syncProjects(
  localProjects: StudioProject[],
): Promise<StudioProject[] | null> {
  const remote = await pullRemoteProjects();
  if (remote === null) return null;

  const merged = new Map<string, StudioProject>();
  for (const p of remote) merged.set(p.id, p);

  const toPush: StudioProject[] = [];
  for (const local of localProjects) {
    const cloud = merged.get(local.id);
    if (!cloud || (local.updatedAt ?? "") > (cloud.updatedAt ?? "")) {
      merged.set(local.id, local);
      toPush.push(local);
    }
  }

  // Import des projets locaux (pré-compte ou modifiés hors ligne).
  for (const p of toPush) void pushProjectToCloud(p);

  return Array.from(merged.values()).sort((a, b) =>
    (a.updatedAt ?? "") < (b.updatedAt ?? "") ? 1 : -1,
  );
}
