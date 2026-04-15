"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { duplicateProject, listProjects } from "../../../lib/studio/storage";
import type { StudioProject } from "../../../lib/studio/types";

function statusLabel(status: string) {
    switch (status) {
        case "generated": return "Généré";
        case "approved": return "Validé";
        default: return "Brouillon";
    }
}

function statusColor(status: string) {
    switch (status) {
        case "approved": return { bg: "#f0fdf4", color: "#059669", border: "#a7f3d0" };
        case "generated": return { bg: "var(--blue-light)", color: "var(--blue-conseil)", border: "var(--blue-medium)" };
        default: return { bg: "var(--surface)", color: "var(--slate)", border: "var(--border)" };
    }
}

export default function StudioHistoryPage() {
    const [projects, setProjects] = useState<StudioProject[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setProjects(listProjects());
        setHydrated(true);
    }, []);

    return (
        <main className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <Link href="/studio" style={{ fontSize: 12, color: "var(--slate)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
                    ← Dashboard
                </Link>
                <p className="section-label" style={{ marginBottom: 6 }}>Bibliothèque</p>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.02em" }}>
                            Historique complet
                        </h1>
                        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--slate)" }}>
                            {hydrated ? `${projects.length} dispositif${projects.length > 1 ? "s" : ""} au total` : "Chargement…"}
                        </p>
                    </div>
                    <Link href="/studio/new" className="btn btn-primary" style={{ flexShrink: 0 }}>
                        + Nouveau dispositif
                    </Link>
                </div>
            </div>

            {/* Content */}
            {!hydrated ? null : projects.length === 0 ? (
                <div style={{
                    background: "var(--white)",
                    border: "1px dashed var(--border)",
                    borderRadius: 14,
                    padding: "56px 32px",
                    textAlign: "center",
                }}>
                    <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "var(--navy)" }}>
                        Aucun historique disponible
                    </h3>
                    <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--slate)" }}>
                        Créez votre premier dispositif pour commencer.
                    </p>
                    <Link href="/studio/new" className="btn btn-primary">
                        Créer mon premier dispositif
                    </Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {projects.map((project) => {
                        const sc = statusColor(project.status);
                        return (
                            <div key={project.id} className="card" style={{
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                gap: 16,
                                alignItems: "center",
                                padding: "18px 22px",
                                transition: "box-shadow 0.15s",
                            }}>
                                <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                        <span style={{
                                            fontSize: 10,
                                            fontWeight: 700,
                                            padding: "2px 9px",
                                            borderRadius: 20,
                                            background: sc.bg,
                                            color: sc.color,
                                            border: `1px solid ${sc.border}`,
                                            letterSpacing: "0.04em",
                                        }}>
                                            {statusLabel(project.status)}
                                        </span>
                                        <span style={{ fontSize: 11, color: "var(--slate-light)" }}>
                                            {new Date(project.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                    </div>
                                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "var(--navy)", lineHeight: 1.4 }}>
                                        {project.title}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 12, color: "var(--slate)", lineHeight: 1.5 }}>
                                        {project.brief.challenge.length > 100
                                            ? project.brief.challenge.slice(0, 100) + "…"
                                            : project.brief.challenge}
                                    </p>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                                    <Link
                                        href={`/studio/${project.id}`}
                                        className="btn btn-dark btn-sm"
                                    >
                                        Ouvrir
                                    </Link>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => {
                                            duplicateProject(project.id);
                                            setProjects(listProjects());
                                        }}
                                        type="button"
                                    >
                                        Dupliquer
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </main>
    );
}
