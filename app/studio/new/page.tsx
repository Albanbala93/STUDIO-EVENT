import Link from "next/link";
import { BriefForm } from "../../../components/studio/brief-form";

export default function NewProjectPage() {
    return (
        <main>
            {/* ── Hero header ─────────────────────────────── */}
            <div style={{
                background: "var(--navy)",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Ambient light */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(ellipse at 80% 50%, rgba(42, 82, 152, 0.18) 0%, transparent 65%)",
                    pointerEvents: "none",
                }} />

                <div className="container" style={{ paddingTop: 44, paddingBottom: 48, position: "relative" }}>
                    {/* Back link */}
                    <Link href="/studio" className="hero-back-link">
                        ← Projets
                    </Link>

                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
                        {/* Title block */}
                        <div style={{ maxWidth: 640 }}>
                            <p style={{
                                margin: "0 0 18px 0",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.16em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.32)",
                            }}>
                                Nouveau dispositif de communication
                            </p>
                            <h1 style={{
                                margin: "0 0 18px 0",
                                fontFamily: "var(--font-display)",
                                fontSize: "clamp(28px, 3.5vw, 40px)",
                                fontWeight: 400,
                                color: "var(--white)",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.18,
                            }}>
                                Décrivez votre contexte.{" "}
                                <em style={{ color: "rgba(255,255,255,0.48)", fontStyle: "italic" }}>
                                    Nous construisons le dispositif.
                                </em>
                            </h1>
                            <p style={{
                                margin: 0,
                                fontSize: 14,
                                color: "rgba(255,255,255,0.45)",
                                lineHeight: 1.72,
                                maxWidth: 520,
                            }}>
                                Six champs suffisent pour produire une recommandation stratégique complète —
                                angle éditorial, messages clés, contenus rédigés et dispositif événementiel.
                            </p>
                        </div>

                        {/* Stats strip */}
                        <div style={{
                            display: "flex",
                            gap: 0,
                            flexShrink: 0,
                        }}>
                            {[
                                { value: "~25s", label: "Génération" },
                                { value: "6", label: "Champs requis" },
                                { value: "14+", label: "Sections" },
                            ].map(({ value, label }, i) => (
                                <div key={label} style={{
                                    padding: "0 32px 0 0",
                                    marginRight: 32,
                                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                                    textAlign: "left",
                                }}>
                                    <p style={{
                                        margin: "0 0 4px",
                                        fontSize: 26,
                                        fontWeight: 800,
                                        color: "var(--white)",
                                        letterSpacing: "-0.04em",
                                        lineHeight: 1,
                                    }}>
                                        {value}
                                    </p>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 10,
                                        color: "rgba(255,255,255,0.32)",
                                        fontWeight: 600,
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                    }}>
                                        {label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Process strip ───────────────────────────── */}
            <div style={{
                borderBottom: "1px solid var(--border)",
                background: "var(--white)",
            }}>
                <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
                    <div style={{ display: "flex", gap: 0 }}>
                        {[
                            { step: "01", label: "Brief", active: true },
                            { step: "02", label: "Analyse stratégique", active: false },
                            { step: "03", label: "Recommandation", active: false },
                        ].map(({ step, label, active }) => (
                            <div key={step} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "13px 20px 13px 0",
                                marginRight: 20,
                                borderBottom: active ? "2px solid var(--navy)" : "2px solid transparent",
                                marginBottom: -1,
                            }}>
                                <span style={{
                                    fontSize: 9.5,
                                    fontWeight: 700,
                                    color: active ? "var(--navy)" : "var(--slate-light)",
                                    letterSpacing: "0.06em",
                                    background: active ? "var(--surface-mid)" : "transparent",
                                    border: `1px solid ${active ? "var(--border)" : "transparent"}`,
                                    padding: "1px 5px",
                                    borderRadius: "var(--radius-xs)",
                                }}>
                                    {step}
                                </span>
                                <span style={{
                                    fontSize: 12,
                                    fontWeight: active ? 600 : 400,
                                    color: active ? "var(--navy)" : "var(--slate-light)",
                                    letterSpacing: active ? "-0.005em" : "0",
                                }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Form area ───────────────────────────────── */}
            <div className="container" style={{ paddingTop: 40, paddingBottom: 88 }}>
                <BriefForm />
            </div>
        </main>
    );
}
