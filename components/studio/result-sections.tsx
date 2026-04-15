"use client";

import { useState } from "react";

import { addComment, getCollab, resolveComment, updateSectionOwner, updateSectionStatus, saveProject } from "../../lib/studio/storage";
import type { BriefSpecificity, DircomView, MaturityScores, PipelineDebugInfo, RiskItem, ScenarioItem, SectionStatus, StudioProject } from "../../lib/studio/types";
import { ActivityLog, CollabSectionHeader, SectionComments } from "./section-collab";

/* ========================
   Sub-components
======================== */

function SectionHeader({ label, title }: { label: string; title: string }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <p className="section-label">{label}</p>
            <h2 className="section-title">{title}</h2>
        </div>
    );
}

function RiskBadge({ level }: { level: RiskItem["level"] }) {
    const cls = level === "élevé" ? "badge badge-high" : level === "moyen" ? "badge badge-medium" : "badge badge-low";
    const label = level === "élevé" ? "Risque élevé" : level === "moyen" ? "Risque moyen" : "Risque faible";
    return <span className={cls}>{label}</span>;
}

function ScenarioCard({ scenario }: { scenario: ScenarioItem }) {
    const cls =
        scenario.name === "Essentiel"
            ? "scenario-card scenario-essentiel"
            : scenario.name === "Renforcé"
              ? "scenario-card scenario-renforce"
              : "scenario-card scenario-signature";

    return (
        <div className={cls}>
            <p className="scenario-name">{scenario.name}</p>
            <p className="scenario-desc">{scenario.description}</p>
            <ul>
                {scenario.actions.map((action, i) => (
                    <li key={i}>{action}</li>
                ))}
            </ul>
        </div>
    );
}

function MaturityBar({ label, score }: { label: string; score: number }) {
    return (
        <div className="maturity-bar-row">
            <span className="maturity-bar-label">{label}</span>
            <div className="maturity-bar-track">
                {[1, 2, 3, 4, 5].map((n) => (
                    <div
                        key={n}
                        className={`maturity-bar-segment${n <= score ? " maturity-bar-segment-active" : ""}`}
                    />
                ))}
            </div>
            <span className="maturity-bar-score">{score}/5</span>
        </div>
    );
}

function MaturityBlock({ scores }: { scores: MaturityScores }) {
    return (
        <div className="maturity-block">
            <MaturityBar label="Communication" score={scores.communication} />
            <MaturityBar label="Engagement" score={scores.engagement} />
            <MaturityBar label="Change readiness" score={scores.changeReadiness} />
            {scores.label && (
                <p className="maturity-label">{scores.label}</p>
            )}
        </div>
    );
}

function ReactionCard({ role, text, accent }: { role: string; text: string; accent: string }) {
    return (
        <div className="reaction-card" style={{ borderTopColor: accent }}>
            <p className="reaction-role" style={{ color: accent }}>{role}</p>
            <p className="reaction-text">{text}</p>
        </div>
    );
}

function DircomViewBanner({ view }: { view: DircomView }) {
    return (
        <div className="dircom-banner">
            <div className="dircom-banner-header">
                <span className="dircom-banner-label">Vue Direction</span>
                <p className="dircom-banner-summary">{view.summary}</p>
            </div>
            <div className="dircom-banner-grid">
                {view.decisionsToMake.length > 0 && (
                    <div className="dircom-column">
                        <p className="dircom-column-title">Décisions à prendre</p>
                        <ul className="dircom-list dircom-list-decisions">
                            {view.decisionsToMake.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                    </div>
                )}
                {view.keyRisks.length > 0 && (
                    <div className="dircom-column">
                        <p className="dircom-column-title">Risques stratégiques</p>
                        <ul className="dircom-list dircom-list-risks">
                            {view.keyRisks.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                    </div>
                )}
                {view.keyArbitrations.length > 0 && (
                    <div className="dircom-column">
                        <p className="dircom-column-title">Arbitrages assumés</p>
                        <ul className="dircom-list dircom-list-arb">
                            {view.keyArbitrations.map((a, i) => <li key={i}>{a}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

function PipelineDebugPanel({ debug }: { debug: PipelineDebugInfo }) {
    const [open, setOpen] = useState(false);
    const { briefAnalysis, generatedScenarios, scenarioSelection } = debug;
    const { shortlist, winner, whyWinner, whyOthersSecondary, whyAvoided } = scenarioSelection;

    return (
        <div className="pipeline-panel">
            <button
                className="pipeline-panel-toggle"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
            >
                <span className="pipeline-panel-icon">⬡</span>
                <span className="pipeline-panel-title">
                    Pipeline de sélection — {generatedScenarios.length} scénarios explorés
                </span>
                <span className="pipeline-panel-badge">
                    {shortlist.length} shortlistés · 1 retenu
                </span>
                <span className="pipeline-panel-chevron">{open ? "▲" : "▼"}</span>
            </button>

            {open && (
                <div className="pipeline-panel-body">
                    {/* Brief Analysis Summary */}
                    <div className="pipeline-analysis-row">
                        <span className="pipeline-tag">Registre</span>
                        <span className="pipeline-value">{briefAnalysis.dominantRegister}</span>
                        <span className="pipeline-tag">Intention</span>
                        <span className="pipeline-value">{briefAnalysis.emotionalIntent}</span>
                        <span className="pipeline-tag">Besoin collectif</span>
                        <span className="pipeline-value">{briefAnalysis.collectiveNeed}</span>
                    </div>

                    {/* Winner Highlight */}
                    <div className="pipeline-winner">
                        <div className="pipeline-winner-header">
                            <span className="pipeline-winner-badge">Scénario retenu</span>
                            <span className="pipeline-winner-title">{winner.title}</span>
                            <span className="pipeline-winner-format">{winner.mainFormat}</span>
                        </div>
                        <p className="pipeline-winner-why">{whyWinner}</p>
                    </div>

                    {/* Shortlist Table */}
                    <div className="pipeline-shortlist">
                        <p className="pipeline-section-label">Shortlist ({shortlist.length} scénarios)</p>
                        <div className="pipeline-shortlist-grid">
                            {shortlist.map((s, i) => (
                                <div
                                    key={i}
                                    className={`pipeline-scenario-card${s.title === winner.title ? " pipeline-scenario-card-winner" : ""}`}
                                >
                                    <div className="pipeline-scenario-header">
                                        <span className="pipeline-scenario-rank">#{s.rank}</span>
                                        <span className="pipeline-scenario-name">{s.title}</span>
                                        <span className="pipeline-scenario-score">{s.scores.total.toFixed(1)}/50</span>
                                    </div>
                                    <p className="pipeline-scenario-format">{s.mainFormat}</p>
                                    {s.title !== winner.title && (
                                        <p className="pipeline-scenario-secondary">
                                            {whyOthersSecondary[i - 1] ?? "Scénario complémentaire"}
                                        </p>
                                    )}
                                    <div className="pipeline-score-bars">
                                        {[
                                            { label: "Registre", val: s.scores.registerAdequacy },
                                            { label: "Objectif", val: s.scores.objectiveAdequacy },
                                            { label: "Émotionnel", val: s.scores.emotionalAdequacy },
                                            { label: "Collectif", val: s.scores.collectiveNeedAdequacy },
                                            { label: "Faisabilité", val: s.scores.constraintCoherence },
                                        ].map(({ label, val }) => (
                                            <div key={label} className="pipeline-score-row">
                                                <span className="pipeline-score-label">{label}</span>
                                                <div className="pipeline-score-track">
                                                    <div
                                                        className="pipeline-score-fill"
                                                        style={{ width: `${(val / 10) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="pipeline-score-num">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Excluded reasons */}
                    {whyAvoided.length > 0 && (
                        <div className="pipeline-avoided">
                            <p className="pipeline-section-label">
                                {generatedScenarios.length - shortlist.length} scénarios écartés
                            </p>
                            <ul className="pipeline-avoided-list">
                                {whyAvoided.map((reason, i) => (
                                    <li key={i}>{reason}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function BriefSpecificityBlock({ specificity }: { specificity: BriefSpecificity }) {
    return (
        <div className="brief-specificity-block">
            <div className="brief-specificity-header">
                <span className="brief-specificity-icon">◈</span>
                <span className="brief-specificity-title">Singularité de cette recommandation</span>
                <span className="brief-specificity-subtitle">Pourquoi ce plan ne conviendrait pas à un autre brief</span>
            </div>
            <div className="brief-specificity-grid">
                {specificity.whatMakesThisCaseUnique.length > 0 && (
                    <div className="brief-specificity-column">
                        <p className="brief-specificity-col-label">Ce qui rend ce cas unique</p>
                        <ul className="brief-specificity-list">
                            {specificity.whatMakesThisCaseUnique.map((item, i) => (
                                <li key={i} className="brief-specificity-item brief-specificity-unique">{item}</li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="brief-specificity-column brief-specificity-column-wide">
                    <p className="brief-specificity-col-label">Pourquoi cette recommandation — et pas une autre</p>
                    <p className="brief-specificity-fit">{specificity.whyThisRecommendationFits}</p>
                </div>
                {specificity.whatWasDeliberatelyExcluded.length > 0 && (
                    <div className="brief-specificity-column">
                        <p className="brief-specificity-col-label">Délibérément écarté</p>
                        <ul className="brief-specificity-list">
                            {specificity.whatWasDeliberatelyExcluded.map((item, i) => (
                                <li key={i} className="brief-specificity-item brief-specificity-excluded">{item}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

function EditableBlock({
    label,
    sublabel,
    value,
    onChange,
}: {
    label: string;
    sublabel?: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="editable-block">
            <div style={{ marginBottom: 10 }}>
                <p className="section-label" style={{ marginBottom: 2 }}>{label}</p>
                {sublabel && <p style={{ margin: 0, fontSize: 12, color: "var(--slate)" }}>{sublabel}</p>}
            </div>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ minHeight: 160 }}
            />
        </div>
    );
}

/* ========================
   Main component
======================== */

export function ResultSections({
    project,
    editable = true,
}: {
    project: StudioProject;
    editable?: boolean;
}) {
    const [current, setCurrent] = useState(project);
    const [copied, setCopied] = useState(false);
    const [exportingPdf, setExportingPdf] = useState(false);
    const [exportingDocx, setExportingDocx] = useState(false);
    const [isClientMode, setIsClientMode] = useState(false);
    const [sortByPriority, setSortByPriority] = useState(false);
    // which sections have their comment panel open
    const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

    const collab = getCollab(current);

    function toggleComments(sectionId: string) {
        setOpenComments((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
    }

    function handleStatusChange(sectionId: string, status: SectionStatus) {
        const updated = updateSectionStatus(current, sectionId, status);
        setCurrent(updated);
    }

    function handleOwnerChange(sectionId: string, ownerName: string) {
        const updated = updateSectionOwner(current, sectionId, ownerName);
        setCurrent(updated);
    }

    function handleAddComment(sectionId: string, text: string, author: string) {
        const updated = addComment(current, sectionId, text, author);
        setCurrent(updated);
    }

    function handleResolveComment(commentId: string) {
        const updated = resolveComment(current, commentId);
        setCurrent(updated);
    }

    /** Comments for a given section, unresolved count. */
    function sectionComments(sectionId: string) {
        return collab.comments.filter((c) => c.sectionId === sectionId);
    }
    function unresolvedCount(sectionId: string) {
        return sectionComments(sectionId).filter((c) => !c.resolved).length;
    }

    const out = current.output;

    function persist(next: StudioProject) {
        const updated = { ...next, updatedAt: new Date().toISOString() };
        setCurrent(updated);
        saveProject(updated);
    }

    function updateContent(field: keyof typeof out.generatedContent, value: string) {
        persist({
            ...current,
            output: {
                ...out,
                generatedContent: { ...out.generatedContent, [field]: value },
            },
        });
    }

    function updateKeyMessages(value: string) {
        persist({
            ...current,
            output: { ...out, keyMessages: value.split("\n").filter(Boolean) },
        });
    }

    async function exportArtifact(format: "pdf" | "docx") {
        const setLoading = format === "pdf" ? setExportingPdf : setExportingDocx;
        setLoading(true);
        try {
            const response = await fetch("/api/studio/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ format, project: current }),
            });

            if (!response.ok) {
                const text = await response.text();
                alert(`Erreur export ${format.toUpperCase()} : ${text}`);
                return;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${current.title.replace(/[^\w\-]+/g, "-").toLowerCase()}.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch {
            alert("Une erreur est survenue pendant l'export.");
        } finally {
            setLoading(false);
        }
    }

    function copyAll() {
        const text = [
            `SYNTHÈSE EXÉCUTIVE\n${out.executiveSummary}`,
            `DIAGNOSTIC\n${out.communicationDiagnostic}`,
            `PROBLÉMATIQUE\n${out.centralProblem}`,
            `ANGLE STRATÉGIQUE\n${out.strategicAngle}`,
            `MESSAGES CLÉS\n${(out.keyMessages ?? []).map((m) => `• ${m}`).join("\n")}`,
            `PLAN DE DIFFUSION\n${(out.timeline ?? []).map((t) => `${t.when} : ${t.action}`).join("\n")}`,
            `EMAIL DIRECTION\n${out.generatedContent.executiveEmail}`,
            `POST INTRANET\n${out.generatedContent.intranetPost}`,
            `KIT MANAGER\n${out.generatedContent.managerKit}`,
            `FAQ\n${out.generatedContent.faq}`,
        ].join("\n\n---\n\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    const risks = out.risks ?? [];
    const quickWins = out.quickWins ?? [];
    const highRisks = risks.filter((r) => r.level === "élevé");

    const impactScore = (v?: string) => v === "élevé" ? 3 : v === "moyen" ? 2 : 1;
    const complexityScore = (v?: string) => v === "élevé" ? 3 : v === "moyen" ? 2 : 1;
    const priorityScore = (item: (typeof out.timeline)[number]) =>
        impactScore(item.impact) * 2 - complexityScore(item.complexity);

    const sortedTimeline = sortByPriority
        ? [...(out.timeline ?? [])].sort((a, b) => priorityScore(b) - priorityScore(a))
        : (out.timeline ?? []);

    return (
        <div className={isClientMode ? "client-mode" : undefined} style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

            {/* ====== DIRCOM BANNER ====== */}
            {out.dircomView && (
                <div style={{ gridColumn: "1 / -1" }}>
                    <DircomViewBanner view={out.dircomView} />
                </div>
            )}

            {/* ====== MAIN COLUMN ====== */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Pipeline Debug Panel */}
                {out.pipelineDebug && (
                    <PipelineDebugPanel debug={out.pipelineDebug} />
                )}

                {/* Brief Specificity */}
                {out.briefSpecificity && (
                    <BriefSpecificityBlock specificity={out.briefSpecificity} />
                )}

                {/* Executive Summary */}
                <div className="result-section">
                    <CollabSectionHeader
                        label="01 — Synthèse exécutive" title="Vue d'ensemble stratégique"
                        sectionId="exec-summary" meta={collab.sectionMeta["exec-summary"]}
                        editable={editable} commentCount={unresolvedCount("exec-summary")}
                        onChangeStatus={(s) => handleStatusChange("exec-summary", s)}
                        onChangeOwner={(o) => handleOwnerChange("exec-summary", o)}
                        onToggleComments={() => toggleComments("exec-summary")}
                        showComments={!!openComments["exec-summary"]}
                    />
                    <div className="executive-summary">
                        <p>{out.executiveSummary ?? out.strategicAngle}</p>
                    </div>
                    {openComments["exec-summary"] && (
                        <SectionComments
                            sectionId="exec-summary" comments={sectionComments("exec-summary")} editable={editable}
                            onAdd={(t, a) => handleAddComment("exec-summary", t, a)}
                            onResolve={handleResolveComment}
                        />
                    )}
                </div>

                {/* Maturity Scores */}
                {out.maturityScores && (
                    <div className="result-section">
                        <SectionHeader label="01b — Intelligence terrain" title="Maturité communication" />
                        <MaturityBlock scores={out.maturityScores} />
                    </div>
                )}

                {/* Diagnostic + Problem + Angle */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div className="result-section">
                        <SectionHeader label="02 — Diagnostic" title="Lecture de la situation" />
                        <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
                            {out.communicationDiagnostic ?? "—"}
                        </p>
                    </div>
                    <div className="result-section">
                        <SectionHeader label="03 — Problématique centrale" title="Le vrai problème à résoudre" />
                        <p style={{
                            margin: 0,
                            fontSize: 15,
                            color: "var(--navy)",
                            fontWeight: 600,
                            lineHeight: 1.6,
                            fontStyle: "italic",
                        }}>
                            &ldquo;{out.centralProblem ?? out.strategicAngle}&rdquo;
                        </p>
                    </div>
                </div>

                {/* Strategic Angle */}
                <div className="result-section" style={{ borderLeft: "4px solid var(--indigo)" }}>
                    <CollabSectionHeader
                        label="04 — Parti pris stratégique" title="Angle retenu"
                        sectionId="strategy" meta={collab.sectionMeta["strategy"]}
                        editable={editable} commentCount={unresolvedCount("strategy")}
                        onChangeStatus={(s) => handleStatusChange("strategy", s)}
                        onChangeOwner={(o) => handleOwnerChange("strategy", o)}
                        onToggleComments={() => toggleComments("strategy")}
                        showComments={!!openComments["strategy"]}
                    />
                    <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.75 }}>
                        {out.strategicAngle}
                    </p>
                    {openComments["strategy"] && (
                        <SectionComments
                            sectionId="strategy" comments={sectionComments("strategy")} editable={editable}
                            onAdd={(t, a) => handleAddComment("strategy", t, a)}
                            onResolve={handleResolveComment}
                        />
                    )}
                </div>

                {/* Device Architecture */}
                {out.deviceArchitecture && (
                    <div className="result-section">
                        <CollabSectionHeader
                            label="05 — Architecture du dispositif" title="Logique d'ensemble"
                            sectionId="device" meta={collab.sectionMeta["device"]}
                            editable={editable} commentCount={unresolvedCount("device")}
                            onChangeStatus={(s) => handleStatusChange("device", s)}
                            onChangeOwner={(o) => handleOwnerChange("device", o)}
                            onToggleComments={() => toggleComments("device")}
                            showComments={!!openComments["device"]}
                        />
                        <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.75 }}>
                            {out.deviceArchitecture}
                        </p>
                        {openComments["device"] && (
                            <SectionComments
                                sectionId="device" comments={sectionComments("device")} editable={editable}
                                onAdd={(t, a) => handleAddComment("device", t, a)}
                                onResolve={handleResolveComment}
                            />
                        )}
                    </div>
                )}

                {/* Reaction Simulation */}
                {out.reactionSimulation && (
                    <div className="result-section">
                        <SectionHeader label="05b — Simulation" title="Réactions anticipées" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                            <ReactionCard role="Managers" text={out.reactionSimulation.managers} accent="var(--blue-conseil)" />
                            <ReactionCard role="Collaborateurs" text={out.reactionSimulation.collaborators} accent="var(--indigo)" />
                            <ReactionCard role="Terrain (J+5)" text={out.reactionSimulation.terrain} accent="var(--slate)" />
                        </div>
                        <div className="reaction-main-risk">
                            <span className="reaction-risk-label">Risque principal</span>
                            <p className="reaction-risk-text">{out.reactionSimulation.mainRisk}</p>
                        </div>
                    </div>
                )}

                {/* Audience Messages */}
                {(out.audienceMessages ?? []).length > 0 && (
                    <div className="result-section">
                        <SectionHeader label="06 — Segmentation & messages" title="Messages par audience" />
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {out.audienceMessages.map((am, i) => (
                                <div key={i} className="audience-card">
                                    <p className="audience-name">{am.audience}</p>
                                    <p className="audience-message">&ldquo;{am.message}&rdquo;</p>
                                    <div>
                                        <span className="channel-tag">↗ {am.channel}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Key Messages */}
                <div className="result-section">
                    <SectionHeader label="07 — Messages piliers" title="Messages clés" />
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                        {(out.keyMessages ?? []).map((msg, i) => (
                            <div key={i} className="key-message-item">
                                <span className="key-message-num">{i + 1}</span>
                                <p className="key-message-text">{msg}</p>
                            </div>
                        ))}
                    </div>
                    <details style={{ marginTop: 8 }}>
                        <summary style={{ fontSize: 12, color: "var(--slate)", cursor: "pointer", userSelect: "none" }}>
                            Modifier les messages clés
                        </summary>
                        <div style={{ marginTop: 10 }}>
                            <EditableBlock
                                label="Messages clés"
                                sublabel="Un message par ligne"
                                value={(out.keyMessages ?? []).join("\n")}
                                onChange={updateKeyMessages}
                            />
                        </div>
                    </details>
                </div>

                {/* Channel Mix */}
                {(out.channelMix ?? out.recommendedFormats ?? []).length > 0 && (
                    <div className="result-section">
                        <SectionHeader label="08 — Mix de canaux" title="Canaux recommandés" />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                            {(out.channelMix ?? out.recommendedFormats ?? []).map((channel, i) => (
                                <span key={i} className="channel-tag">{channel}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="result-section">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div>
                            <p className="section-label">09 — Feuille de route</p>
                            <h2 className="section-title">Plan de déploiement</h2>
                        </div>
                        <button
                            type="button"
                            className={`btn btn-ghost${sortByPriority ? " btn-ghost-active" : ""}`}
                            style={{ fontSize: 12, padding: "5px 12px" }}
                            onClick={() => setSortByPriority((v) => !v)}
                        >
                            {sortByPriority ? "↕ Ordre chronologique" : "↑ Trier par priorité"}
                        </button>
                    </div>
                    <div className="timeline-list">
                        {sortedTimeline.map((item, i) => (
                            <div key={i} className="timeline-item">
                                <span className="timeline-when">{item.when}</span>
                                <div className="timeline-action">
                                    <span>{item.action}</span>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 6 }}>
                                        {item.impact && (
                                            <span className={`timeline-badge timeline-badge-impact-${item.impact === "élevé" ? "high" : item.impact === "moyen" ? "medium" : "low"}`}>
                                                Impact {item.impact}
                                            </span>
                                        )}
                                        {item.complexity && (
                                            <span className={`timeline-badge timeline-badge-complexity-${item.complexity === "élevé" ? "high" : item.complexity === "moyen" ? "medium" : "low"}`}>
                                                Complexité {item.complexity}
                                            </span>
                                        )}
                                        {item.delay && (
                                            <span className="timeline-badge timeline-badge-delay">
                                                {item.delay}
                                            </span>
                                        )}
                                    </div>
                                    {item.dependencies && item.dependencies.length > 0 && (
                                        <div className="timeline-dependencies">
                                            <span className="timeline-dep-label">Prérequis :</span>
                                            {item.dependencies.map((dep, j) => (
                                                <span key={j} className="timeline-dep-tag">{dep}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Relays */}
                {(out.relays ?? []).length > 0 && (
                    <div className="result-section">
                        <SectionHeader label="10 — Gouvernance" title="Relais & rôles" />
                        {out.governance && (
                            <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.65 }}>
                                {out.governance}
                            </p>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {(out.relays ?? []).map((relay, i) => (
                                <div key={i} className="card-tight" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "var(--blue-conseil)",
                                        background: "var(--blue-light)",
                                        padding: "3px 10px",
                                        borderRadius: 20,
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}>
                                        {relay.role}
                                    </span>
                                    <p style={{ margin: 0, fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
                                        {relay.mission}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KPIs */}
                {(out.kpis ?? []).length > 0 && (
                    <div className="result-section">
                        <SectionHeader label="11 — Mesure" title="KPIs de pilotage" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                            {(out.kpis ?? []).map((kpi, i) => (
                                <div key={i} className="kpi-card">
                                    <p className="kpi-indicator">{kpi.indicator}</p>
                                    <p className="kpi-target">{kpi.target}</p>
                                    <p className="kpi-timing">Échéance : {kpi.timing}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Risks */}
                {risks.length > 0 && (
                    <div className="result-section">
                        <SectionHeader label="12 — Points de vigilance" title="Risques identifiés" />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {risks.map((risk, i) => (
                                <div key={i} className="risk-item">
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <RiskBadge level={risk.level} />
                                        <p className="risk-description">{risk.risk}</p>
                                    </div>
                                    <p className="risk-mitigation">Mitigation : {risk.mitigation}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Generated Content */}
                <div className="result-section">
                    <CollabSectionHeader
                        label="13 — Contenus prêts à diffuser" title="Livrables éditoriaux"
                        sectionId="content" meta={collab.sectionMeta["content"]}
                        editable={editable} commentCount={unresolvedCount("content")}
                        onChangeStatus={(s) => handleStatusChange("content", s)}
                        onChangeOwner={(o) => handleOwnerChange("content", o)}
                        onToggleComments={() => toggleComments("content")}
                        showComments={!!openComments["content"]}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        <EditableBlock
                            label="Email direction"
                            sublabel="Prêt à envoyer — objet inclus"
                            value={out.generatedContent?.executiveEmail ?? ""}
                            onChange={(v) => updateContent("executiveEmail", v)}
                        />
                        <hr className="section-divider" />
                        <EditableBlock
                            label="Post intranet"
                            sublabel="Structure éditoriale complète"
                            value={out.generatedContent?.intranetPost ?? ""}
                            onChange={(v) => updateContent("intranetPost", v)}
                        />
                        <hr className="section-divider" />
                        <EditableBlock
                            label="Kit manager"
                            sublabel="Talking points + checklist + objections"
                            value={out.generatedContent?.managerKit ?? ""}
                            onChange={(v) => updateContent("managerKit", v)}
                        />
                        <hr className="section-divider" />
                        <EditableBlock
                            label="FAQ collaborateurs"
                            sublabel="Questions réalistes + réponses directes"
                            value={out.generatedContent?.faq ?? ""}
                            onChange={(v) => updateContent("faq", v)}
                        />
                    </div>
                    {openComments["content"] && (
                        <SectionComments
                            sectionId="content" comments={sectionComments("content")} editable={editable}
                            onAdd={(t, a) => handleAddComment("content", t, a)}
                            onResolve={handleResolveComment}
                        />
                    )}
                </div>

                {/* Scenarios */}
                {(out.scenarios ?? []).length > 0 && (
                    <div className="result-section">
                        <SectionHeader label="14 — Scénarios" title="Niveaux d'ambition" />
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                            {(out.scenarios ?? []).map((scenario, i) => (
                                <ScenarioCard key={i} scenario={scenario} />
                            ))}
                        </div>
                    </div>
                )}
                {/* Challenge Mode */}
                {out.challengeMode && (
                    <div className="result-section challenge-section">
                        <SectionHeader label="15 — Mode challenge" title="Regard critique" />
                        <div className="challenge-critique">
                            <p className="challenge-critique-label">Principale faiblesse</p>
                            <p className="challenge-critique-text">{out.challengeMode.critique}</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
                            {(out.challengeMode.blindSpots ?? []).length > 0 && (
                                <div>
                                    <p className="challenge-list-title">Angles morts</p>
                                    <ul className="challenge-list">
                                        {out.challengeMode.blindSpots.map((spot, i) => (
                                            <li key={i}>{spot}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {(out.challengeMode.alternatives ?? []).length > 0 && (
                                <div>
                                    <p className="challenge-list-title">Angles alternatifs rejetés</p>
                                    <ul className="challenge-list">
                                        {out.challengeMode.alternatives.map((alt, i) => (
                                            <li key={i}>{alt}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ====== SIDEBAR ====== */}
            <aside className="sidebar-sticky">

                {/* Actions */}
                <div className="card" style={{ padding: "18px 20px" }}>
                    <p className="section-label" style={{ marginBottom: 12 }}>Actions</p>

                    <button
                        className="btn btn-dark"
                        style={{ width: "100%", marginBottom: 8, justifyContent: "center" }}
                        onClick={() => exportArtifact("pdf")}
                        disabled={exportingPdf}
                        type="button"
                    >
                        {exportingPdf ? "Génération…" : "↓ Export PDF"}
                    </button>

                    <button
                        className="btn btn-light"
                        style={{ width: "100%", marginBottom: 8, justifyContent: "center" }}
                        onClick={() => exportArtifact("docx")}
                        disabled={exportingDocx}
                        type="button"
                    >
                        {exportingDocx ? "Génération…" : "↓ Export DOCX"}
                    </button>

                    <button
                        className="btn btn-ghost"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={copyAll}
                        type="button"
                    >
                        {copied ? "✓ Copié" : "Copier tout"}
                    </button>

                    <div style={{ borderTop: "1px solid var(--border)", margin: "12px 0 8px" }} />

                    <button
                        className={`btn${isClientMode ? " btn-client-active" : " btn-ghost"}`}
                        style={{ width: "100%", justifyContent: "center", fontSize: 12 }}
                        onClick={() => setIsClientMode((v) => !v)}
                        type="button"
                    >
                        {isClientMode ? "✓ Mode client activé" : "Version client"}
                    </button>
                </div>

                {/* Quick Wins */}
                {quickWins.length > 0 && (
                    <div className="card" style={{ padding: "18px 20px" }}>
                        <p className="section-label" style={{ marginBottom: 10 }}>Quick wins</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {quickWins.map((win, i) => (
                                <div key={i} className="quick-win-item">{win}</div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Risk radar */}
                {highRisks.length > 0 && (
                    <div className="card" style={{ padding: "18px 20px", borderColor: "#fecaca" }}>
                        <p className="section-label" style={{ marginBottom: 10, color: "var(--risk-high)" }}>
                            Points critiques
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {highRisks.map((risk, i) => (
                                <p key={i} style={{
                                    margin: 0,
                                    fontSize: 12,
                                    color: "var(--text)",
                                    lineHeight: 1.5,
                                    paddingLeft: 12,
                                    borderLeft: "2px solid var(--risk-high)",
                                }}>
                                    {risk.risk}
                                </p>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline mini */}
                {(out.timeline ?? []).length > 0 && (
                    <div className="card" style={{ padding: "18px 20px" }}>
                        <p className="section-label" style={{ marginBottom: 10 }}>Jalons clés</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {(out.timeline ?? []).slice(0, 4).map((item, i) => (
                                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        background: "var(--navy)",
                                        color: "var(--white)",
                                        borderRadius: 4,
                                        padding: "2px 7px",
                                        whiteSpace: "nowrap",
                                        flexShrink: 0,
                                    }}>
                                        {item.when}
                                    </span>
                                    <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
                                        {item.action.length > 60 ? item.action.slice(0, 60) + "…" : item.action}
                                    </p>
                                </div>
                            ))}
                            {(out.timeline ?? []).length > 4 && (
                                <p style={{ margin: 0, fontSize: 11, color: "var(--slate-light)" }}>
                                    +{(out.timeline ?? []).length - 4} étapes — voir plan complet
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Relay roles mini */}
                {(out.relays ?? []).length > 0 && (
                    <div className="card" style={{ padding: "18px 20px" }}>
                        <p className="section-label" style={{ marginBottom: 10 }}>Relais mobilisés</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {(out.relays ?? []).map((relay, i) => (
                                <span key={i} style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "var(--blue-conseil)",
                                    background: "var(--blue-light)",
                                    padding: "3px 10px",
                                    borderRadius: 20,
                                    border: "1px solid var(--blue-medium)",
                                }}>
                                    {relay.role}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Activity log */}
                <div className="card" style={{ padding: "18px 20px" }}>
                    <p className="section-label" style={{ marginBottom: 12 }}>Activité</p>
                    <ActivityLog items={collab.activity} />
                </div>
            </aside>
        </div>
    );
}
