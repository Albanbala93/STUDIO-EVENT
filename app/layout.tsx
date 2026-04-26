import "./globals.css";
import Link from "next/link";
import { Logo } from "../components/brand/logo";

export const metadata = {
  title: "Stratly",
  description: "Plateforme de recommandation stratégique en communication interne",
  applicationName: "Stratly",
  openGraph: {
    title: "Stratly",
    description:
      "Concevez vos dispositifs, mesurez leur performance et démontrez leur impact.",
    siteName: "Stratly",
    images: [{ url: "/brand/stratly-logo.png", width: 1254, height: 1254, alt: "Stratly" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stratly",
    description: "Plateforme stratégique de communication interne",
    images: ["/brand/stratly-logo.png"],
  },
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
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="topnav">
          <div className="topnav-inner">
            {/* Logo */}
            <Logo variant="full" size={26} href="/" priority />
            <span className="topnav-wordmark-studio" style={{ marginLeft: 8, fontSize: 12.5 }}>
              · Campaign
            </span>

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
