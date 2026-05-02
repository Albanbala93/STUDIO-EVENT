import Link from "next/link";
import { BriefForm } from "../../../components/studio/brief-form";

export default function NewProjectPage() {
    return (
        <main>
            {/* ── Hero header — Hi-Fi : navy gradient + halo teal (Campaign accent) ─ */}
            <div style={{
                background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 100%)",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Ambient light — halo teal au lieu de l'indigo précédent */}
                <div style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(ellipse at 85% 50%, rgba(0, 180, 200, 0.18) 0%, transparent 55%)",
                    pointerEvents: "none",
                }} />

                <div className="container" style={{ paddingTop: 40, paddingBottom: 44, position: "relative" }}>
                    {/* Back chip Hi-Fi (glass-on-navy) */}
                    <Link href="/studio" className="hi-fi-brief-back-chip">
                        ← Projets
                    </Link>

                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>
                        {/* Title block */}
                        <div style={{ maxWidth: 600 }}>
                            <p style={{
                                margin: "0 0 16px 0",
                                fontSize: 10,
                                fontWeight: 700,
                                letterSpacing: "0.14em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,0.38)",
                            }}>
                                Nouveau projet
                            </p>
                            <h1 style={{
                                margin: "0 0 16px 0",
                                fontFamily: "var(--font-display)",
                                fontSize: "clamp(26px, 3vw, 36px)",
                                fontWeight: 400,
                                color: "var(--white)",
                                letterSpacing: "-0.01em",
                                lineHeight: 1.2,
                            }}>
                                Déposer un brief{" "}
                                <em style={{ color: "var(--accent-teal)", fontStyle: "italic" }}>
                                    stratégique
                                </em>.
                            </h1>
                            <p style={{
                                margin: 0,
                                fontSize: 13.5,
                                color: "rgba(255,255,255,0.5)",
                                lineHeight: 1.7,
                                maxWidth: 500,
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
                            paddingBottom: 4,
                        }}>
                            {[
                                { value: "~25s", label: "Génération" },
                                { value: "6", label: "Champs requis" },
                                { value: "14+", label: "Sections" },
                            ].map(({ value, label }, i) => (
                                <div key={label} style={{
                                    padding: "0 28px 0 0",
                                    marginRight: 28,
                                    borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                                    textAlign: "left",
                                }}>
                                    <p style={{
                                        margin: "0 0 4px",
                                        fontSize: 24,
                                        fontWeight: 800,
                                        color: "var(--white)",
                                        letterSpacing: "-0.04em",
                                        lineHeight: 1,
                                    }}>
                                        {value}
                                    </p>
                                    <p style={{
                                        margin: 0,
                                        fontSize: 9.5,
                                        color: "rgba(255,255,255,0.28)",
                                        fontWeight: 600,
                                        letterSpacing: "0.09em",
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
                            <div key={step} className={`process-step${active ? " process-step-active" : ""}`}>
                                <span className={`process-step-num ${active ? "process-step-num-active" : "process-step-num-inactive"}`}>
                                    {step}
                                </span>
                                <span className={`process-step-label ${active ? "process-step-label-active" : "process-step-label-inactive"}`}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Hi-Fi : Ce que génère Stratly — bandeau livrables 6 colonnes ─ */}
            <div className="container" style={{ paddingTop: 32, paddingBottom: 0 }}>
                <div className="hi-fi-brief-deliverables">
                    <p className="hi-fi-brief-deliverables-overline">
                        Ce que génère Stratly
                    </p>
                    <div className="hi-fi-brief-deliverables-grid">
                        {[
                            { label: "Dossier stratégique 28 sections", color: "var(--accent-teal)" },
                            { label: "Messages par audience", color: "var(--accent-violet)" },
                            { label: "Plan de déploiement", color: "var(--accent-orange)" },
                            { label: "KPIs et indicateurs", color: "var(--accent-green)" },
                            { label: "Contenus rédigés (email, FAQ…)", color: "var(--accent-blue)" },
                            { label: "Export PDF & DOCX premium", color: "var(--accent-amber)" },
                        ].map((d) => (
                            <div key={d.label} className="hi-fi-brief-deliverable">
                                <span
                                    className="hi-fi-brief-deliverable-dot"
                                    style={{ background: d.color }}
                                    aria-hidden="true"
                                />
                                <span className="hi-fi-brief-deliverable-label">
                                    {d.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Form area ───────────────────────────────── */}
            <div className="container" style={{ paddingTop: 24, paddingBottom: 88 }}>
                <BriefForm />
            </div>
        </main>
    );
}
