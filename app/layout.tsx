import "./globals.css";

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://project-uu50s.vercel.app",
  ),
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
        {children}
      </body>
    </html>
  );
}
