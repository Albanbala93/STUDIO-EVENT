"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Logo } from "../../components/brand/logo";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const expired = searchParams.get("error") === "lien-expire";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setStatus("error");
      setMessage(
        "La connexion n'est pas encore activée sur cet environnement.",
      );
      return;
    }

    setStatus("sending");
    let next = searchParams.get("next") ?? "/studio";
    if (!next.startsWith("/")) next = "/studio";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage("Impossible d'envoyer le lien. Vérifiez l'adresse et réessayez.");
    } else {
      setStatus("sent");
    }
  }

  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
      }}
    >
      <Logo variant="full" size={32} href="/" />

      <div
        style={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Connexion</h1>
        <p style={{ fontSize: 14, opacity: 0.7 }}>
          Recevez un lien de connexion par email — pas de mot de passe à
          retenir.
        </p>

        {expired && status === "idle" && (
          <p style={{ fontSize: 13, color: "#B45309" }}>
            Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.
          </p>
        )}

        {status === "sent" ? (
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>
            C&apos;est envoyé — consultez votre boîte mail (
            <strong>{email}</strong>) et cliquez sur le lien pour vous
            connecter. Pensez aux spams si rien n&apos;arrive sous 2 minutes.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 10 }}
          >
            <input
              type="email"
              required
              autoFocus
              placeholder="votre.email@entreprise.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #CBD5E1",
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              className="topnav-cta"
              disabled={status === "sending"}
              style={{ justifyContent: "center" }}
            >
              {status === "sending"
                ? "Envoi en cours…"
                : "Recevoir mon lien de connexion"}
            </button>
            {status === "error" && (
              <p style={{ fontSize: 13, color: "#B91C1C" }}>{message}</p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
