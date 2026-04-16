"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listProjects } from "../../lib/studio/storage";
import type { StudioProject } from "../../lib/studio/types";

function statusLabel(status: string) {
    switch (status) {
        case "generated": return "Généré";
        case "approved": return "Validé";
        default: return "Brouillon";
    }
}

function statusColor(status: string) {
    switch (status) {
        case "approved": return { bg: "var(--risk-low-bg)", color: "var(--risk-low)", border: "#a7f3d0" };
        case "generated": return { bg: "var(--surface-mid)", color: "var(--navy)", border: "var(--border)" };
        default: return { bg: "var(--surface)", color: "var(--slate)", border: "var(--border)" };
    }
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 60) return `il y a ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `il y a ${d}j`;
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function StudioDashboardPage() {
    const [projects, setProjects] = useState<StudioProject[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setProjects(listProjects());
        setHydrated(true);
    }, []);

    const recent = projects.slice(0, 6);

    return (
        <main>
            {/* Hero header */}
            <div className="studio-page-hero">
                <div className="studio-page-hero-inner">
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                        <div>
                            <p className="studio-page-hero-label">Espace de travail</p>
                            <h1 className="studio-page-hero-title">Campaign Studio</h1>
                            <p className="studio-page-hero-sub">
                                Vos dispositifs de communication interne, générés et centralisés.
                            </p>
                        </div>

                        {/* Stats */}
                        {hydrated && projects.length > 0 && (
                            <div style={{ display: "flex", gap: 0, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                                {[
                                    { value: String(projects.length), label: "Dispositifs" },
                                    { value: String(projects.filter(p => p.status === "generated" || p.status === "approved").length), label: "Générés" },
                                    { value: timeAgo(projects[0]?.updatedAt ?? new Date().toISOString()), label: "Dernière activité" },
                                ].map(({ value, label }) => (
                                    <div key={label} style={{ padding: "0 24px", borderRight: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
                                        <p style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 800, color: "var(--white)", letterSpacing: "-0.03em" }}>
                                            {value}
                                        </p>
                                        <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                                            {label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="container" style={{ paddingTop: 36, paddingBottom: 60 }}>

                {/* Projects section header */}
                <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--slate-light)" }}>
                            Récents
                        </p>
                        <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 400, color: "var(--navy)", letterSpacing: "-0.01em" }}>
                            Dispositifs de communication
                        </h2>
                    </div>
                    <Link href="/studio/new" className="btn btn-dark" style={{ fontSize: 12 }}>
                        + Nouveau dispositif
                    </Link>
                </div>

                {!hydrated ? null : projects.length === 0 ? (
                    /* Empty state */
                    <div style={{
                        background: "var(--white)",
                        border: "1px dashed var(--border)",
                        borderRadius: "var(--radius-xl)",
                        padding: "60px 40px",
                        textAlign: "center",
                    }}>
                        <div style={{
                            width: 48,
                            height: 48,
                            background: "var(--surface-mid)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                        }}>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: "var(--slate-light)" }}>
                                <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M6 7h8M6 10h6M6 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 700, color: "var(--navy)", letterSpacing: "-0.01em" }}>
                            Aucun dispositif créé
                        </h3>
                        <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--text-muted)", maxWidth: 340, marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
                            Décrivez votre contexte en 6 champs. Campaign Studio produit un plan stratégique complet en quelques secondes.
                        </p>
                        <Link href="/studio/new" className="btn btn-dark">
                            Créer mon premier dispositif
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                        {recent.map((project) => {
                            const sc = statusColor(project.status);
                            return (
                                <Link
                                    key={project.id}
                                    href={`/studio/${project.id}`}
                                    className="project-card"
                                    style={{ textDecoration: "none" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: "var(--radius-sm)",
                                            background: sc.bg,
                                            color: sc.color,
                                            border: `1px solid ${sc.border}`,
                                            letterSpacing: "0.05em",
                                            textTransform: "uppercase",
                                        }}>
                                            {statusLabel(project.status)}
                                        </span>
                                        <span style={{ fontSize: 11, color: "var(--slate-light)", fontWeight: 400 }}>
                                            {timeAgo(project.updatedAt)}
                                        </span>
                                    </div>

                                    <h3 style={{
                                        margin: "0 0 6px",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: "var(--navy)",
                                        lineHeight: 1.4,
                                        letterSpacing: "-0.01em",
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}>
                                        {project.title}
                                    </h3>

                                    <p style={{
                                        margin: "0 0 16px",
                                        fontSize: 12,
                                        color: "var(--text-muted)",
                                        lineHeight: 1.55,
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                    }}>
                                        {project.brief.challenge}
                                    </p>

                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        paddingTop: 12,
                                        borderTop: "1px solid var(--border-light)",
                                    }}>
                                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                            {(project.output?.quickWins ?? []).length > 0 && (
                                                <span className="channel-tag" style={{ fontSize: 10.5 }}>
                                                    {(project.output?.quickWins ?? []).length} quick wins
                                                </span>
                                            )}
                                            {(project.output?.risks ?? []).length > 0 && (
                                                <span className="channel-tag" style={{ fontSize: 10.5 }}>
                                                    {(project.output?.risks ?? []).length} risques
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: 11.5, color: "var(--navy)", fontWeight: 600, opacity: 0.6 }}>
                                            Ouvrir →
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {projects.length > 0 && (
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-light)", textAlign: "center" }}>
                        <Link href="/studio/history" style={{ fontSize: 12, color: "var(--slate-light)", textDecoration: "none", letterSpacing: "0.01em" }}>
                            Voir l&apos;historique complet — {projects.length} dispositif{projects.length > 1 ? "s" : ""}
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
