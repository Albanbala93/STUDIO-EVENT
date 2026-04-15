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
        <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

            {/* Page header */}
            <div style={{ marginBottom: 36 }}>
                <p className="section-label" style={{ marginBottom: 6 }}>Espace de travail</p>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>
                            Dashboard
                        </h1>
                        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--slate)" }}>
                            Vos dispositifs de communication interne
                        </p>
                    </div>
                    <Link href="/studio/new" className="btn btn-primary" style={{ flexShrink: 0 }}>
                        + Nouveau dispositif
                    </Link>
                </div>
            </div>

            {/* Stats row */}
            {hydrated && projects.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
                    {[
                        { label: "Dispositifs créés", value: projects.length },
                        { label: "Générés", value: projects.filter(p => p.status === "generated" || p.status === "approved").length },
                        { label: "Dernière activité", value: timeAgo(projects[0]?.updatedAt ?? new Date().toISOString()) },
                    ].map((stat) => (
                        <div key={stat.label} className="card" style={{ padding: "18px 22px" }}>
                            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--slate)" }}>
                                {stat.label}
                            </p>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--navy)" }}>
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Projects section */}
            <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>
                    Dispositifs récents
                </h2>
                {projects.length > 6 && (
                    <Link href="/studio/history" style={{ fontSize: 13, color: "var(--blue-conseil)", fontWeight: 500 }}>
                        Voir tout →
                    </Link>
                )}
            </div>

            {!hydrated ? null : projects.length === 0 ? (
                /* Empty state */
                <div style={{
                    background: "var(--white)",
                    border: "1px dashed var(--border)",
                    borderRadius: 14,
                    padding: "56px 32px",
                    textAlign: "center",
                }}>
                    <div style={{
                        width: 52,
                        height: 52,
                        background: "var(--blue-light)",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                        fontSize: 22,
                        color: "var(--blue-conseil)",
                    }}>
                        ◈
                    </div>
                    <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "var(--navy)" }}>
                        Aucun dispositif créé
                    </h3>
                    <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--slate)", maxWidth: 360, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                        Décrivez votre contexte en 6 champs. Campaign Studio génère un plan stratégique complet en quelques secondes.
                    </p>
                    <Link href="/studio/new" className="btn btn-primary">
                        Créer mon premier dispositif
                    </Link>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                    {recent.map((project) => {
                        const sc = statusColor(project.status);
                        return (
                            <Link
                                key={project.id}
                                href={`/studio/${project.id}`}
                                className="project-card"
                                style={{ textDecoration: "none" }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        background: sc.bg,
                                        color: sc.color,
                                        border: `1px solid ${sc.border}`,
                                        letterSpacing: "0.03em",
                                    }}>
                                        {statusLabel(project.status)}
                                    </span>
                                    <span style={{ fontSize: 11, color: "var(--slate-light)" }}>
                                        {timeAgo(project.updatedAt)}
                                    </span>
                                </div>

                                <h3 style={{
                                    margin: "0 0 8px",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: "var(--navy)",
                                    lineHeight: 1.4,
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
                                    color: "var(--slate)",
                                    lineHeight: 1.5,
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
                                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                        {(project.output?.quickWins ?? []).length > 0 && (
                                            <span className="channel-tag">
                                                {(project.output?.quickWins ?? []).length} quick wins
                                            </span>
                                        )}
                                        {(project.output?.risks ?? []).length > 0 && (
                                            <span className="channel-tag">
                                                {(project.output?.risks ?? []).length} risques
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 12, color: "var(--blue-conseil)", fontWeight: 600 }}>
                                        Ouvrir →
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {projects.length > 0 && (
                <div style={{ marginTop: 24, textAlign: "center" }}>
                    <Link href="/studio/history" style={{ fontSize: 13, color: "var(--slate)", textDecoration: "none" }}>
                        Voir l&apos;historique complet ({projects.length} dispositifs) →
                    </Link>
                </div>
            )}
        </main>
    );
}
