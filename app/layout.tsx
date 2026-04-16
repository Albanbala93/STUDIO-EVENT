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
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800;1,14..32,400&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="topnav">
          <div className="topnav-inner">
            {/* Logo */}
            <Link href="/studio" className="topnav-logo">
              <span className="topnav-logo-mark">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2.5 3.5h5M2.5 6.5h8M2.5 9.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </span>
              <span className="topnav-wordmark">
                Campaign<span className="topnav-wordmark-studio"> Studio</span>
              </span>
            </Link>

            {/* Visual separator */}
            <span className="topnav-divider" />

            {/* Navigation links */}
            <div className="topnav-links">
              <Link href="/studio" className="topnav-link">
                Projets
              </Link>
            </div>

            {/* Right-side actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <span className="topnav-beta">Bêta</span>
              <Link href="/studio/new" className="topnav-cta">
                + Nouveau brief
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
