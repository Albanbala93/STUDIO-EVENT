"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { disableSharing, enableSharing, getProject } from "../../../lib/studio/storage";
import { ResultSections } from "../../../components/studio/result-sections";
import { EventCopilotView } from "../../../components/studio/event-copilot";
import { ShareModal } from "../../../components/studio/section-collab";
import type { StudioProject } from "../../../lib/studio/types";
import { buildMomentumDiagnosticUrl } from "../../../lib/momentum-bridge";
import {
    buildEnrichedModuleInput,
    type EnrichmentItem,
} from "../../../lib/modules/enrichment-engine";
import { EnrichmentInsightPanel } from "../../../components/modules/enrichment-insight";

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
    const [enrichmentCounts, setEnrichmentCounts] = useState<{
        available: number;
        selected: number;
    } | null>(null);
    // Bloc 5 — items complets pour le panneau de traçabilité (mode compact).
    const [enrichmentItems, setEnrichmentItems] = useState<EnrichmentItem[]>([]);

    useEffect(() => {
        if (!projectId) return;
        const existing = getProject(projectId);
        setProject(existing ?? null);
        setHydrated(true);
        if (existing) {
            const enriched = buildEnrichedModuleInput(existing, "pilot");
            setEnrichmentCounts({
                available: enriched.availableEnrichments.length,
                selected: enriched.selectedEnrichments.length,
            });
            setEnrichmentItems(enriched.selectedEnrichments);
        } else {
            setEnrichmentCounts(null);
            setEnrichmentItems([]);
        }
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
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="project-label">Dossier de communication interne</p>
                        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 400, letterSpacing: "-0.01em" }}>
                            {project.title}
                        </h1>
                        <div className="header-meta">
                            <span className="badge badge-status">{statusLabel(project.status)}</span>
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
                            <span>{formatDate(project.createdAt)}</span>
                        </div>
                    </div>

                    {/* Right-side controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingTop: 4 }}>
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

                        {/* Measure with Momentum */}
                        <a
                            href={buildMomentumDiagnosticUrl(project)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost"
                            style={{
                                fontSize: 11.5,
                                padding: "5px 13px",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                            }}
                            title="Ouvrir le wizard Pilot avec les métadonnées de ce projet pré-remplies"
                        >
                            📊 Mesurer avec Pilot
                        </a>

                        {/* Share button */}
                        <button
                            type="button"
                            className={`btn btn-ghost${isShared ? " share-btn-active" : ""}`}
                            style={{ fontSize: 11.5, padding: "5px 13px" }}
                            onClick={() => setShowShare(true)}
                        >
                            {isShared ? "↗ Partagé" : "Partager"}
                        </button>

                        <Link href="/studio" style={{ color: "rgba(255,255,255,0.3)", fontSize: 11.5, fontWeight: 500 }}>
                            ← Projets
                        </Link>
                    </div>
                </div>
            </div>

            {/* Brief summary (collapsible) */}
            <details style={{ marginBottom: 0 }} className="brief-collapsible">
                <summary style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--slate-light)",
                    cursor: "pointer",
                    userSelect: "none",
                    padding: "11px 0",
                    letterSpacing: "0.11em",
                    textTransform: "uppercase",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    transition: "color 0.15s",
                }}>
                    <span style={{ fontSize: 8, opacity: 0.6 }}>▸</span> Brief source
                </summary>
                <div style={{
                    marginTop: 10,
                    marginBottom: 6,
                    padding: "24px 28px",
                    background: "var(--white)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px 40px",
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
                            <p style={{ margin: "0 0 5px", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--slate-light)" }}>
                                {label}
                            </p>
                            <p style={{ margin: 0, fontSize: 13.5, color: "var(--text)", lineHeight: 1.6 }}>{value}</p>
                        </div>
                    ))}
                </div>
            </details>

            {/* Bloc 5 — panneau compact de traçabilité inter-modules.
                Affiche les éléments hérités/repris depuis le brief et les autres
                modules ; dépliable pour voir le détail par famille (objectifs,
                audiences, KPIs…) avec source et statut. Reste sobre par défaut. */}
            <div style={{ marginTop: 16, marginBottom: 8 }}>
                <EnrichmentInsightPanel items={enrichmentItems} compact />
            </div>

            {/* Tab navigation */}
            <div className="project-tabs">
                <button
                    type="button"
                    className={`project-tab${activeTab === "dossier" ? " project-tab-active" : ""}`}
                    onClick={() => setActiveTab("dossier")}
                >
                    Dossier stratégique
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
                    <span className="project-tab-badge">Nouveau</span>
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
