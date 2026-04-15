"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { disableSharing, enableSharing, getProject } from "../../../lib/studio/storage";
import { ResultSections } from "../../../components/studio/result-sections";
import { EventCopilotView } from "../../../components/studio/event-copilot";
import { ShareModal } from "../../../components/studio/section-collab";
import type { StudioProject } from "../../../lib/studio/types";

function statusLabel(status: string) {
    switch (status) {
        case "generated": return "Généré";
        case "approved": return "Validé";
        default: return "Brouillon";
    }
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

type Tab = "dossier" | "direction" | "event";

export default function ProjectPage() {
    const params = useParams<{ id: string }>();
    const projectId = useMemo(() => params?.id ?? "", [params?.id]);

    const [project, setProject] = useState<StudioProject | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [editable, setEditable] = useState(true);
    const [showShare, setShowShare] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("dossier");

    useEffect(() => {
        if (!projectId) return;
        const existing = getProject(projectId);
        setProject(existing ?? null);
        setHydrated(true);
    }, [projectId]);

    if (!hydrated) {
        return (
            <main className="container" style={{ paddingTop: 60 }}>
                <p style={{ color: "var(--slate)" }}>Chargement du projet…</p>
            </main>
        );
    }

    if (!project) {
        return (
            <main className="container" style={{ paddingTop: 60 }}>
                <p style={{ color: "var(--slate)" }}>Projet introuvable.</p>
                <Link href="/studio" className="btn btn-ghost btn-sm" style={{ marginTop: 12, display: "inline-flex" }}>
                    ← Retour aux projets
                </Link>
            </main>
        );
    }

    const isShared = project.collaboration?.isShared;
    const eventCopilot = project.output.eventCopilot;
    const hasDircom = !!project.output.dircomView;

    return (
        <main className="container" style={{ paddingTop: 28, paddingBottom: 60 }}>

            {/* Header */}
            <div className="result-header">
                <p className="project-label">Dossier de communication interne</p>
                <h1>{project.title}</h1>
                <div className="header-meta">
                    <span className="badge badge-status">{statusLabel(project.status)}</span>
                    <span>{formatDate(project.createdAt)}</span>

                    {/* Edit / View toggle */}
                    <div className="project-mode-toggle">
                        <button
                            type="button"
                            className={`mode-toggle-btn${editable ? " mode-toggle-active" : ""}`}
                            onClick={() => setEditable(true)}
                        >
                            Édition
                        </button>
                        <button
                            type="button"
                            className={`mode-toggle-btn${!editable ? " mode-toggle-active" : ""}`}
                            onClick={() => setEditable(false)}
                        >
                            Lecture
                        </button>
                    </div>

                    {/* Share button */}
                    <button
                        type="button"
                        className={`btn btn-ghost${isShared ? " share-btn-active" : ""}`}
                        style={{ fontSize: 11, padding: "4px 12px", marginLeft: 4 }}
                        onClick={() => setShowShare(true)}
                    >
                        {isShared ? "↗ Partagé" : "Partager"}
                    </button>

                    <span style={{ marginLeft: "auto" }}>
                        <Link href="/studio" style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                            ← Projets
                        </Link>
                    </span>
                </div>
            </div>

            {/* Brief summary (collapsible) */}
            <details style={{ marginBottom: 0 }}>
                <summary style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--slate-light)",
                    cursor: "pointer",
                    userSelect: "none",
                    padding: "10px 0",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                }}>
                    <span style={{ fontSize: 10 }}>▸</span> Brief source
                </summary>
                <div className="card" style={{
                    marginTop: 8,
                    marginBottom: 4,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "14px 32px",
                    background: "var(--white)",
                }}>
                    {[
                        ["Contexte", project.brief.companyContext],
                        ["Enjeu", project.brief.challenge],
                        ["Cible", project.brief.audience],
                        ["Objectif", project.brief.objective],
                        ["Ton", project.brief.tone],
                        ["Contraintes", project.brief.constraints],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--slate-light)" }}>
                                {label}
                            </p>
                            <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.55 }}>{value}</p>
                        </div>
                    ))}
                </div>
            </details>

            {/* Tab navigation */}
            <div className="project-tabs">
                <button
                    type="button"
                    className={`project-tab${activeTab === "dossier" ? " project-tab-active" : ""}`}
                    onClick={() => setActiveTab("dossier")}
                >
                    Dossier
                </button>

                <button
                    type="button"
                    className={`project-tab${activeTab === "direction" ? " project-tab-active" : ""}`}
                    onClick={() => setActiveTab("direction")}
                >
                    Vue Direction
                </button>

                <button
                    type="button"
                    className={`project-tab project-tab-event${activeTab === "event" ? " project-tab-active" : ""}`}
                    onClick={() => setActiveTab("event")}
                >
                    Copilote événement
                </button>
            </div>

            {/* Tab content */}
            {activeTab === "dossier" && (
                <ResultSections project={project} editable={editable} />
            )}

            {activeTab === "direction" && (project.output.dircomView ? (
                <div className="direction-full-view">
                    <div className="direction-summary-block">
                        <p className="direction-summary-label">Synthèse pour le CODIR</p>
                        <p className="direction-summary-text">{project.output.dircomView.summary}</p>
                    </div>
                    <div className="direction-grid">
                        <div className="direction-column">
                            <p className="direction-column-title direction-column-title-decision">Décisions à prendre</p>
                            <ul className="direction-list">
                                {project.output.dircomView.decisionsToMake.map((d, i) => (
                                    <li key={i}>{d}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="direction-column">
                            <p className="direction-column-title direction-column-title-risk">Risques stratégiques</p>
                            <ul className="direction-list">
                                {project.output.dircomView.keyRisks.map((r, i) => (
                                    <li key={i}>{r}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="direction-column">
                            <p className="direction-column-title direction-column-title-arb">Arbitrages assumés</p>
                            <ul className="direction-list">
                                {project.output.dircomView.keyArbitrations.map((a, i) => (
                                    <li key={i}>{a}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="event-no-event">
                    <p className="event-no-event-title">Vue Direction non disponible pour ce projet</p>
                    <p className="event-no-event-text">
                        Ce projet a été généré avant l'activation de la Vue Direction.
                        Régénérez-le depuis le brief pour accéder à cette fonctionnalité.
                    </p>
                </div>
            ))}

            {activeTab === "event" && (
                eventCopilot
                    ? <EventCopilotView copilot={eventCopilot} />
                    : (
                        <div className="event-no-event">
                            <p className="event-no-event-title">Copilote événement non disponible pour ce projet</p>
                            <p className="event-no-event-text">
                                Ce projet a été généré avant l'activation du copilote événementiel.
                                Régénérez-le depuis le brief pour accéder à cette fonctionnalité.
                            </p>
                        </div>
                    )
            )}

            {/* Share modal */}
            {showShare && (
                <ShareModal
                    project={project}
                    onEnable={(mode) => {
                        const updated = enableSharing(project, mode);
                        setProject(updated);
                    }}
                    onDisable={() => {
                        const updated = disableSharing(project);
                        setProject(updated);
                    }}
                    onClose={() => setShowShare(false)}
                />
            )}
        </main>
    );
}
