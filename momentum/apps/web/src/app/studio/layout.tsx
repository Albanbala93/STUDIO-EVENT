import Link from "next/link";

/**
 * Layout commun à Campaign Studio (stub MVP).
 * Identité visuelle distincte de Momentum (palette violet/orange) pour qu'on
 * voie clairement qu'on est dans l'autre outil.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, rgba(168,85,247,0.08), transparent 50%), #0d0a14",
        color: "#e9e2ff",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          padding: "18px 32px",
          borderBottom: "1px solid rgba(168,85,247,0.18)",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{ color: "#a78bfa", textDecoration: "none", fontSize: 13 }}
        >
          ← Accueil
        </Link>
        <div style={{ color: "#3b2a5e" }}>·</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>🎨</span>
          <strong style={{ fontSize: 16, color: "#e9e2ff" }}>Campaign Studio</strong>
          <span style={{ fontSize: 11, color: "#8b5cf6", padding: "2px 8px", borderRadius: 4, background: "rgba(139,92,246,0.15)" }}>
            Stub MVP
          </span>
        </div>
        <nav style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
          <Link
            href="/studio"
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              color: "#cbd5e1",
              textDecoration: "none",
              border: "1px solid rgba(168,85,247,0.18)",
            }}
          >
            Mes campagnes
          </Link>
          <Link
            href="/connection"
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              color: "#cbd5e1",
              textDecoration: "none",
              border: "1px solid rgba(168,85,247,0.18)",
            }}
          >
            🔗 Connexion ↔ Momentum
          </Link>
          <Link
            href="/studio/new"
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              color: "#fff",
              textDecoration: "none",
              background: "#8b5cf6",
              fontWeight: 600,
            }}
          >
            + Nouvelle campagne
          </Link>
        </nav>
      </header>
      <main style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>{children}</main>
    </div>
  );
}
