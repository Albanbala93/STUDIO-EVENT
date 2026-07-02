"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase côté navigateur.
 * Retourne null si les variables d'environnement ne sont pas configurées
 * (permet de déployer la Phase 1 avant que Supabase soit branché).
 */
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
