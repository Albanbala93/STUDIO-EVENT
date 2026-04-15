import Link from "next/link";
import { BriefForm } from "../../../components/studio/brief-form";

export default function NewProjectPage() {
    return (
        <main>
            {/* Page header — editorial, consultancy-grade */}
            <div style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--white)",
                paddingTop: 36,
                paddingBottom: 32,
            }}>
                <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
                    <Link
                        href="/studio"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            fontWeight: 500,
                            color: "var(--slate)",
                            textDecoration: "none",
                            marginBottom: 24,
                            letterSpacing: "0.01em",
                        }}
                    >
                        ← Tous les projets
                    </Link>

                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40, flexWrap: "wrap" }}>
                        <div>
                            <p style={{
                                margin: "0 0 8px 0",
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: "0.12em",
                                textTransform: "uppercase",
                                color: "var(--slate-light)",
                            }}>
                                Nouveau dispositif
                            </p>
                            <h1 style={{
                                margin: "0 0 10px 0",
                                fontSize: 26,
                                fontWeight: 800,
                                color: "var(--navy)",
                                letterSpacing: "-0.025em",
                                lineHeight: 1.2,
                            }}>
                                Décrivez votre contexte
                            </h1>
                            <p style={{
                                margin: 0,
                                fontSize: 14,
                                color: "var(--text-muted)",
                                lineHeight: 1.65,
                                maxWidth: 560,
                            }}>
                                6 champs suffisent pour générer un dossier de communication interne au niveau d'un cabinet de conseil — stratégie, messages clés, contenus et dispositif événementiel inclus.
                            </p>
                        </div>

                        <div style={{
                            display: "flex",
                            gap: 32,
                            flexShrink: 0,
                        }}>
                            {[
                                { value: "~25s", label: "Temps de génération" },
                                { value: "6", label: "Champs requis" },
                                { value: "4+", label: "Sections produites" },
                            ].map(({ value, label }) => (
                                <div key={label} style={{ textAlign: "right" }}>
                                    <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.03em" }}>
                                        {value}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 11, color: "var(--slate-light)", fontWeight: 500, letterSpacing: "0.01em" }}>
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Form area */}
            <div className="container" style={{ paddingTop: 36, paddingBottom: 80 }}>
                <BriefForm />
            </div>
        </main>
    );
}
