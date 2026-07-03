"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

/**
 * Pied de barre latérale : email du compte connecté + déconnexion.
 * Sans Supabase configuré ou sans session, ne rend rien.
 */
export function AccountFooter() {
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  if (!email) return null;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/auth/signout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }

  return (
    <div
      style={{
        padding: "12px 14px",
        borderTop: "1px solid rgba(100, 116, 139, 0.18)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <span
        title={email}
        style={{
          fontSize: 12,
          opacity: 0.65,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          color: "#B91C1C",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {signingOut ? "Déconnexion…" : "Se déconnecter"}
      </button>
    </div>
  );
}
