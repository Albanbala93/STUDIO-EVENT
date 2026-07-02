import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "../../../lib/supabase/server";

/** Déconnexion puis retour à l'accueil. */
export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", new URL(request.url).origin), {
    status: 302,
  });
}
