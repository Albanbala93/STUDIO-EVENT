import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        textAlign: "center",
        padding: 24,
      }}
    >
      <p style={{ fontSize: 13, letterSpacing: 2, opacity: 0.6 }}>ERREUR 404</p>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Cette page n&apos;existe pas.</h1>
      <p style={{ maxWidth: 420, opacity: 0.7 }}>
        Le lien est peut-être obsolète, ou la page a été déplacée.
      </p>
      <Link href="/" className="topnav-cta">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
