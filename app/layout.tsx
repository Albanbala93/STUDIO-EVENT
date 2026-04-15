import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Campaign Studio",
  description: "Plateforme de recommandation stratégique en communication interne",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="topnav">
          <div className="topnav-inner">
            <Link href="/studio" className="topnav-logo">
              <span className="topnav-logo-mark">CS</span>
              Campaign Studio
            </Link>
            <div className="topnav-links">
              <Link href="/studio" className="topnav-link">
                Projets
              </Link>
              <Link href="/studio/new" className="topnav-link">
                Nouveau brief
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--slate-light)",
                padding: "3px 8px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
              }}>
                Bêta
              </span>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
