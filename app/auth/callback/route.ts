import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

/**
 * Cible du lien magique : échange le code contre une session,
 * puis redirige vers la page demandée.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let next = url.searchParams.get("next") ?? "/studio";
  // Anti open-redirect : uniquement des chemins internes.
  if (!next.startsWith("/")) next = "/studio";

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL("/login?error=lien-expire", url.origin),
        );
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
