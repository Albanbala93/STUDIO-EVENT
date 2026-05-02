"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listProjects } from "../../lib/studio/storage";
import type { StudioProject } from "../../lib/studio/types";
import {
    fetchMomentumMemory,
    type MomentumMemory,
} from "../../lib/momentum-bridge";
import { StrategicMemoryPanel } from "./_components/strategic-memory-panel";
import {
    HI_FI_ACCENTS,
    IlluBrief,
    IlluDashboard,
    IlluStrategy,
} from "../_components/landing-illustrations";

function statusLabel(status: string) {
    switch (status) {
        case "generated": return "Généré";
        case "approved": return "Validé";
        default: return "Brouillon";
    }
}

function statusColor(status: string) {
    switch (status) {
        case "approved": return { bg: "var(--risk-low-bg)", color: "var(--risk-low)", border: "var(--blue-medium)" };
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
    const [memory, setMemory] = useState<MomentumMemory | null>(null);

    useEffect(() => {
        setProjects(listProjects());
        setHydrated(true);
        // Memory Momentum calculée depuis localStorage (synchrone).
        setMemory(fetchMomentumMemory());
    }, []);

    const recent = projects.slice(0, 6);

    // Hi-Fi — métriques affichées dans le header
    const activeCount = projects.filter(p => p.status === "generated" || p.status === "approved").length;
    const draftCount = projects.filter(p => p.status === "draft").length;

    return (
        <main>
            {/* Hero header — Hi-Fi : halo teal + Pills statut */}
            <div className="studio-page-hero hi-fi-dashboard-hero">
                <div className="studio-page-hero-inner">
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                        <div>
                            <p className="studio-page-hero-label">Espace de travail</p>
                            <h1 className="studio-page-hero-title">Tableau de bord Stratly</h1>
                            <p className="studio-page-hero-sub">
                                Vos dispositifs de communication interne, générés et centralisés.
                            </p>

                            {/* Pills Hi-Fi : statut projets */}
                            {hydrated && projects.length > 0 && (
                                <div className="hi-fi-dashboard-pills">
                                    <span className="hi-fi-dashboard-pill hi-fi-dashboard-pill-teal">
                                        {activeCount} projet{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}
                                    </span>
                                    {draftCount > 0 && (
                                        <span className="hi-fi-dashboard-pill hi-fi-dashboard-pill-amber">
                                            {draftCount} brouillon{draftCount > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Stats */}
                        {hydrated && projects.length > 0 && (
                            <div style={{ display: "flex", gap: 0, borderLeft: "1px solid rgba(255,255,255,0.08)" }}>
                                {[
                                    { value: String(projects.length), label: "Dispositifs" },
                                    { value: String(activeCount), label: "Générés" },
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

                {/* Hi-Fi — Modules disponibles : 3 mini-cards horizontales
                    avec illustrations colorées. Donne accès rapide aux
                    modules Campaign / Pilot / Impact depuis le dashboard. */}
                <div className="hi-fi-modules-row">
                    <p className="hi-fi-modules-row-label">Modules disponibles</p>
                    <div className="hi-fi-modules-row-grid">
                        {[
                            {
                                href: "/studio/new",
                                name: "Campaign",
                                sub: "Brief → dossier stratégique complet",
                                accent: HI_FI_ACCENTS.teal,
                                illu: <IlluBrief />,
                            },
                            {
                                href: "/momentum",
                                name: "Pilot",
                                sub: "Diagnostic, KPIs, pilotage continu",
                                accent: HI_FI_ACCENTS.violet,
                                illu: <IlluDashboard />,
                            },
                            {
                                href: "/momentum",
                                name: "Impact",
                                sub: "Empreinte carbone, impact RSE des actions com",
                                accent: HI_FI_ACCENTS.green,
                                illu: <IlluStrategy />,
                            },
                        ].map((m) => (
                            <Link key={m.name} href={m.href} className="hi-fi-module-card">
                                <span
                                    className="hi-fi-module-card-illu"
                                    style={{
                                        background: `${m.accent.color}14`,
                                        borderColor: `${m.accent.color}28`,
                                    }}
                                >
                                    <span className="hi-fi-module-card-illu-inner">
                                        {m.illu}
                                    </span>
                                </span>
                                <span className="hi-fi-module-card-body">
                                    <span className="hi-fi-module-card-name">{m.name}</span>
                                    <span className="hi-fi-module-card-sub">{m.sub}</span>
                                </span>
                                <span
                                    className="hi-fi-module-card-badge"
                                    style={{
                                        background: HI_FI_ACCENTS.green.bg,
                                        color: HI_FI_ACCENTS.green.color,
                                        borderColor: HI_FI_ACCENTS.green.ring,
                                    }}
                                >
                                    Actif
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Mémoire stratégique Studio — tendances + insights dérivés
                    de la couche mémoire. Auto-hidden si 0 projet. */}
                <StrategicMemoryPanel />

                {/* Momentum memory — displayed only when API reachable */}
                {memory && <MomentumMemoryBanner memory={memory} />}

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
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Link
                        href="/studio/clients"
                        className="btn btn-ghost"
                        style={{ fontSize: 12, textDecoration: "none" }}
                      >
                        Clients & projets
                      </Link>

                      <Link href="/studio/new" className="btn btn-dark" style={{ fontSize: 12 }}>
                        + Nouveau dispositif
                      </Link>
                    </div>
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
                            Décrivez votre contexte en 6 champs. Campaign produit un plan stratégique complet en quelques secondes.
                        </p>
                        <Link href="/studio/new" className="btn btn-dark">
                            Créer mon premier dispositif
                        </Link>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                        {recent.map((project) => {
                            const sc = statusColor(project.status);
                            // Hi-Fi : accent coloré sur le bord gauche par statut
                            const accentColor =
                                project.status === "approved"
                                    ? HI_FI_ACCENTS.green.color
                                    : project.status === "generated"
                                      ? HI_FI_ACCENTS.teal.color
                                      : "var(--border-strong)";
                            return (
                                <Link
                                    key={project.id}
                                    href={`/studio/${project.id}`}
                                    className="project-card hi-fi-project-card"
                                    style={{
                                        textDecoration: "none",
                                        ["--hi-fi-card-accent" as string]: accentColor,
                                    }}
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

                                    <h3 className="hi-fi-project-card-title" style={{
                                        margin: "0 0 6px",
                                        fontFamily: "var(--font-display, 'DM Serif Display', Georgia, serif)",
                                        fontSize: 15,
                                        fontWeight: 400,
                                        color: "var(--navy)",
                                        lineHeight: 1.35,
                                        letterSpacing: "-0.005em",
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

/**
 * Memory banner — aperçu condensé du profil Momentum agrégé sur les projets mesurés.
 * Affiche soit un état "verrouillé" (pas assez de data), soit les 4 métriques clés.
 */
function MomentumMemoryBanner({ memory }: { memory: MomentumMemory }) {
    const trendLabel: Record<string, { icon: string; label: string; color: string }> = {
        hausse: { icon: "↗", label: "En amélioration", color: "var(--risk-low, #0b8f4a)" },
        baisse: { icon: "↘", label: "En baisse", color: "var(--risk-high, #c62828)" },
        stable: { icon: "→", label: "Stable", color: "var(--slate-light)" },
    };
    const trend = memory.tendance ? trendLabel[memory.tendance] : null;

    return (
        <div
            style={{
                marginBottom: 24,
                padding: "18px 24px",
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderLeft: "3px solid var(--navy)",
                borderRadius: "var(--radius-lg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
                flexWrap: "wrap",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                <div>
                    <p style={{ margin: "0 0 2px", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--slate-light)" }}>
                        Mémoire Pilot
                    </p>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--text)", fontWeight: 600 }}>
                        {memory.unlocked
                            ? `${memory.sample_size} projets mesurés`
                            : `${memory.sample_size}/${memory.minimum_required} projets — insights bientôt disponibles`}
                    </p>
                </div>

                {memory.unlocked && (
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                        {memory.score_moyen !== null && (
                            <Metric label="Score moyen" value={`${memory.score_moyen.toFixed(1)} / 100`} />
                        )}
                        {memory.point_fort && <Metric label="Point fort" value={memory.point_fort} />}
                        {memory.point_faible && (
                            <Metric label="À renforcer" value={memory.point_faible} highlight />
                        )}
                        {trend && <Metric label="Tendance" value={`${trend.icon} ${trend.label}`} color={trend.color} />}
                    </div>
                )}
            </div>

            <Link
                href="/momentum"
                className="btn btn-ghost"
                style={{ fontSize: 11.5, padding: "5px 13px", textDecoration: "none", whiteSpace: "nowrap" }}
            >
                Ouvrir Pilot →
            </Link>
        </div>
    );
}

function Metric({
    label,
    value,
    highlight,
    color,
}: {
    label: string;
    value: string;
    highlight?: boolean;
    color?: string;
}) {
    return (
        <div>
            <p style={{ margin: "0 0 2px", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--slate-light)" }}>
                {label}
            </p>
            <p
                style={{
                    margin: 0,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: color ?? (highlight ? "var(--risk-med, #c97a1a)" : "var(--navy)"),
                    maxWidth: 160,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                }}
                title={value}
            >
                {value}
            </p>
        </div>
    );
}
