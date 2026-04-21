import Link from "next/link";

/**
 * Layout partagé du module 4 (bibliothèque stratégique).
 * Navigation horizontale vers les 4 fonctions : bibliothèque, comparer, courbes, insights.
 */
export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top, rgba(77,95,255,0.08), transparent 50%), #0a0d1a",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          padding: "18px 32px",
          borderBottom: "1px solid rgba(148,163,184,0.12)",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: 13,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Accueil
        </Link>
        <div style={{ color: "#334155" }}>·</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#e2e8f0" }}>
          Mémoire stratégique
        </div>
        <nav style={{ display: "flex", gap: 4, marginLeft: "auto", flexWrap: "wrap" }}>
          {[
            { href: "/library", label: "Bibliothèque" },
            { href: "/library/compare", label: "Comparer" },
            { href: "/library/trends", label: "Courbes" },
            { href: "/library/insights", label: "Intelligence" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                fontSize: 13,
                color: "#cbd5e1",
                textDecoration: "none",
                border: "1px solid rgba(148,163,184,0.15)",
                background: "rgba(148,163,184,0.05)",
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/diagnostic"
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              fontSize: 13,
              color: "#fff",
              textDecoration: "none",
              background: "#4d5fff",
              fontWeight: 600,
            }}
          >
            + Nouveau diagnostic
          </Link>
        </nav>
      </header>
      <main style={{ padding: "32px", maxWidth: 1280, margin: "0 auto" }}>{children}</main>
    </div>
  );
}
