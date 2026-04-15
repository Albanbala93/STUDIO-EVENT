import Link from "next/link";

const features = [
    {
        icon: "◈",
        title: "Analyse stratégique complète",
        desc: "Diagnostic, problématique réelle, angle différenciant — pas une reformulation du brief.",
    },
    {
        icon: "◉",
        title: "Dispositif structuré en 14 sections",
        desc: "Architecture, messages par audience, plan de déploiement, KPIs, risques, scénarios.",
    },
    {
        icon: "◎",
        title: "Contenus prêts à diffuser",
        desc: "Email direction, post intranet, kit manager, FAQ — rédigés, calibrés, activables.",
    },
    {
        icon: "⬡",
        title: "Exports PDF & DOCX premium",
        desc: "Dossier client-ready avec couverture, sections et mise en forme professionnelle.",
    },
];

export default function HomePage() {
    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

            {/* Top navigation */}
            <nav style={{
                background: "var(--white)",
                borderBottom: "1px solid var(--border)",
                padding: "0 32px",
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                zIndex: 100,
            }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: "var(--navy)", letterSpacing: "-0.01em" }}>
                    Campaign Studio
                </span>
                <Link href="/studio" className="btn btn-primary btn-sm">
                    Accéder à l&apos;application →
                </Link>
            </nav>

            {/* Hero */}
            <section style={{
                background: "var(--navy)",
                padding: "96px 32px",
                textAlign: "center",
                flex: 1,
            }}>
                <div style={{ maxWidth: 720, margin: "0 auto" }}>
                    <p style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "rgba(255,255,255,0.45)",
                        marginBottom: 20,
                    }}>
                        Communication interne grands comptes
                    </p>
                    <h1 style={{
                        fontSize: 48,
                        fontWeight: 800,
                        color: "var(--white)",
                        lineHeight: 1.15,
                        marginBottom: 24,
                        letterSpacing: "-0.02em",
                    }}>
                        Du brief au dispositif de campagne<br />
                        <span style={{ color: "#93C5FD" }}>prêt à déployer.</span>
                    </h1>
                    <p style={{
                        fontSize: 18,
                        color: "rgba(255,255,255,0.65)",
                        lineHeight: 1.7,
                        marginBottom: 40,
                        maxWidth: 560,
                        margin: "0 auto 40px",
                    }}>
                        Campaign Studio génère un plan stratégique complet, des messages par audience
                        et des contenus rédigés — au niveau d&apos;un cabinet de conseil.
                    </p>
                    <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                        <Link href="/studio/new" style={{
                            background: "var(--white)",
                            color: "var(--navy)",
                            padding: "14px 28px",
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 15,
                            textDecoration: "none",
                            display: "inline-block",
                        }}>
                            Créer un dispositif →
                        </Link>
                        <Link href="/studio" style={{
                            background: "rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.85)",
                            padding: "14px 28px",
                            borderRadius: 8,
                            fontWeight: 600,
                            fontSize: 15,
                            textDecoration: "none",
                            display: "inline-block",
                            border: "1px solid rgba(255,255,255,0.15)",
                        }}>
                            Voir le dashboard
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ background: "var(--surface)", padding: "72px 32px" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                    <p style={{
                        textAlign: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--slate)",
                        marginBottom: 40,
                    }}>
                        Ce que génère la plateforme
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
                        {features.map((f) => (
                            <div key={f.title} className="card" style={{ padding: "24px 22px" }}>
                                <div style={{
                                    fontSize: 22,
                                    color: "var(--blue-conseil)",
                                    marginBottom: 12,
                                }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "var(--navy)" }}>
                                    {f.title}
                                </h3>
                                <p style={{ margin: 0, fontSize: 13, color: "var(--slate)", lineHeight: 1.6 }}>
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA bottom */}
            <section style={{
                background: "var(--white)",
                borderTop: "1px solid var(--border)",
                padding: "48px 32px",
                textAlign: "center",
            }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>
                    Prêt à lancer votre campagne ?
                </h2>
                <p style={{ color: "var(--slate)", marginBottom: 24, fontSize: 14 }}>
                    Remplissez un brief en 5 minutes. Recevez un dispositif complet en quelques secondes.
                </p>
                <Link href="/studio/new" className="btn btn-primary" style={{ padding: "12px 28px", fontSize: 14 }}>
                    Démarrer maintenant
                </Link>
            </section>
        </div>
    );
}
