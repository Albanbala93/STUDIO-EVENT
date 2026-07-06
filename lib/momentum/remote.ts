/**
 * Couche cloud des diagnostics Momentum — Supabase.
 * Même architecture que lib/studio/remote.ts : localStorage en cache
 * de lecture, réplication en arrière-plan, no-op sans session.
 */

import { getSupabaseBrowserClient } from "../supabase/client";
import type { MomentumProject } from "./types";

async function getClientAndUser() {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { supabase, user };
}

/** Tous les diagnostics de l'utilisateur connecté, ou null si cloud inactif. */
export async function pullRemoteDiagnostics(): Promise<MomentumProject[] | null> {
  const ctx = await getClientAndUser();
  if (!ctx) return null;

  const { data, error } = await ctx.supabase
    .from("projects")
    .select("data")
    .eq("module", "momentum")
    .order("updated_at", { ascending: false });

  if (error || !data) return null;
  return (data as Array<{ data: MomentumProject }>)
    .map((row) => row.data)
    .filter((p): p is MomentumProject => Boolean(p && p.id));
}

/** Réplique un diagnostic vers le cloud (upsert). Ne lève jamais. */
export async function pushDiagnosticToCloud(
  project: MomentumProject,
): Promise<void> {
  try {
    const ctx = await getClientAndUser();
    if (!ctx) return;

    await ctx.supabase.from("projects").upsert(
      {
        id: project.id,
        user_id: ctx.user.id,
        module: "momentum",
        title: project.name ?? "",
        status: "generated",
        data: project,
        updated_at: project.createdAt ?? new Date().toISOString(),
      },
      { onConflict: "id" },
    );
  } catch {
    // Réplication best-effort.
  }
}

/** Supprime un diagnostic du cloud. Ne lève jamais. */
export async function deleteDiagnosticFromCloud(id: string): Promise<void> {
  try {
    const ctx = await getClientAndUser();
    if (!ctx) return;
    await ctx.supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("module", "momentum");
  } catch {
    // best-effort
  }
}

/**
 * Merge cloud ↔ local par id (les diagnostics sont immuables une fois
 * générés), pousse les diagnostics locaux absents du cloud.
 */
export async function syncDiagnostics(
  localProjects: MomentumProject[],
): Promise<MomentumProject[] | null> {
  const remote = await pullRemoteDiagnostics();
  if (remote === null) return null;

  const merged = new Map<string, MomentumProject>();
  for (const p of remote) merged.set(p.id, p);

  for (const local of localProjects) {
    if (!merged.has(local.id)) {
      merged.set(local.id, local);
      void pushDiagnosticToCloud(local);
    }
  }

  return Array.from(merged.values()).sort((a, b) =>
    (a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1,
  );
}
