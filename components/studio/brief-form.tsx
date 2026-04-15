"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { getUserContext, learnFromProject, saveProject } from "../../lib/studio/storage";
import type { BriefInput, StudioOutput, StudioProject } from "../../lib/studio/types";

const initialState: BriefInput = {
    companyContext: "",
    challenge: "",
    audience: "",
    objective: "",
    tone: "",
    constraints: "",
};

type GenerateResponse = {
    title: string;
    output: StudioOutput;
};

const fieldConfig: Array<{
    key: keyof BriefInput;
    label: string;
    hint: string;
    example: string;
}> = [
    {
        key: "companyContext",
        label: "Contexte entreprise",
        hint: "Organisation, secteur, taille et situation actuelle.",
        example: "Ex : groupe industriel, 8 000 salariés, 12 sites en France, réorganisation post-fusion en cours.",
    },
    {
        key: "challenge",
        label: "Enjeu prioritaire",
        hint: "Le défi de communication que vous devez adresser.",
        example: "Ex : accompagner le déploiement d'un nouvel ERP auprès des équipes opérationnelles.",
    },
    {
        key: "audience",
        label: "Cible interne",
        hint: "Les destinataires principaux du dispositif.",
        example: "Ex : managers de proximité (N+1), environ 600 personnes, profil terrain, peu habitués aux outils digitaux.",
    },
    {
        key: "objective",
        label: "Objectif de la campagne",
        hint: "Le résultat concret attendu à l'issue du dispositif.",
        example: "Ex : 80% des managers capables d'expliquer le changement à leur équipe avant le 15 du mois.",
    },
    {
        key: "tone",
        label: "Ton de communication",
        hint: "Le registre que la direction souhaite adopter.",
        example: "Ex : rassurant, transparent sur les difficultés, mobilisateur sans être injonctif.",
    },
    {
        key: "constraints",
        label: "Contraintes opérationnelles",
        hint: "Délais, budget, canaux disponibles, ressources internes.",
        example: "Ex : délai de 10 jours, canaux email + intranet uniquement, pas de budget externe, équipe CI de 2 personnes.",
    },
];

export function BriefForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [brief, setBrief] = useState<BriefInput>(initialState);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/studio/upload-brief", {
            method: "POST",
            body: formData,
        });

        const data = await res.json();
        console.log("UPLOAD RESULT:", data);

        if (data.success) {
            setBrief((prev) => ({
                ...prev,
                companyContext: data.brief.companyContext || "",
                challenge: data.brief.challenge || "",
                audience: data.brief.audience || "",
                objective: data.brief.objective || "",
                tone: data.brief.tone || "",
                constraints: data.brief.constraints || "",
            }));
        }
    };

    const filledCount = Object.values(brief).filter((v) => v.trim().length > 0).length;
    const progress = Math.round((filledCount / 6) * 100);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const userContext = getUserContext();
            const response = await fetch("/api/studio/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...brief, ...(userContext ? { userContext } : {}) }),
            });

            const payload = (await response.json()) as GenerateResponse & { error?: string };

            if (!response.ok) {
                throw new Error(payload.error || "La génération a échoué. Vérifiez le brief puis relancez.");
            }

            const now = new Date().toISOString();
            const project: StudioProject = {
                id: crypto.randomUUID(),
                title: payload.title,
                status: "generated",
                createdAt: now,
                updatedAt: now,
                brief,
                output: payload.output,
            };

            saveProject(project);
            learnFromProject(project);
            router.push(`/studio/${project.id}`);
        } catch (caughtError) {
            const message = caughtError instanceof Error ? caughtError.message : "Erreur inconnue";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ maxWidth: 820, margin: "0 auto" }}>

            {/* Upload brief — subtle, above form */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 28,
                padding: "12px 16px",
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
            }}>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "var(--navy)" }}>
                        Importer un brief existant
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--slate-light)" }}>
                        PDF, Word ou TXT — les champs seront pré-remplis automatiquement
                    </p>
                </div>
                <label style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--slate)",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                    flexShrink: 0,
                }}>
                    Choisir un fichier
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        onChange={handleFileUpload}
                        style={{ display: "none" }}
                    />
                </label>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
            }}>

                {/* Form header with progress */}
                <div style={{
                    background: "var(--navy)",
                    padding: "20px 28px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                }}>
                    <div>
                        <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                            Brief stratégique
                        </p>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--white)" }}>
                            {filledCount === 0
                                ? "Commencez par décrire votre contexte"
                                : filledCount < 6
                                ? `${6 - filledCount} champ${6 - filledCount > 1 ? "s" : ""} restant${6 - filledCount > 1 ? "s" : ""}`
                                : "Brief complet — prêt à générer"}
                        </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                        {/* Progress segments */}
                        <div style={{ display: "flex", gap: 3 }}>
                            {Array.from({ length: 6 }, (_, i) => (
                                <div
                                    key={i}
                                    style={{
                                        width: 20,
                                        height: 3,
                                        borderRadius: 2,
                                        background: i < filledCount ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.15)",
                                        transition: "background 0.25s",
                                    }}
                                />
                            ))}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.4)", minWidth: 28 }}>
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Fields */}
                <div style={{ padding: "0 28px 28px" }}>
                    {fieldConfig.map(({ key, label, hint, example }, index) => {
                        const filled = brief[key].trim().length > 0;
                        return (
                            <div
                                key={key}
                                style={{
                                    paddingTop: 24,
                                    paddingBottom: 24,
                                    borderBottom: index < fieldConfig.length - 1 ? "1px solid var(--border-light)" : "none",
                                }}
                            >
                                {/* Label row */}
                                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                                    <span style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: filled ? "var(--navy)" : "var(--slate-light)",
                                        background: filled ? "var(--surface-mid)" : "transparent",
                                        border: `1px solid ${filled ? "var(--border)" : "var(--border-light)"}`,
                                        width: 20,
                                        height: 20,
                                        borderRadius: "var(--radius-sm)",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                        transition: "all 0.2s",
                                        lineHeight: 1,
                                    }}>
                                        {filled ? "✓" : index + 1}
                                    </span>
                                    <label style={{
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: "var(--navy)",
                                        cursor: "pointer",
                                        letterSpacing: "-0.005em",
                                    }}>
                                        {label}
                                    </label>
                                    <span style={{ fontSize: 12, color: "var(--slate-light)", fontWeight: 400 }}>
                                        {hint}
                                    </span>
                                </div>

                                {/* Textarea */}
                                <textarea
                                    required
                                    placeholder={example}
                                    value={brief[key]}
                                    onChange={(e) => setBrief((cur) => ({ ...cur, [key]: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        minHeight: 84,
                                        padding: "11px 14px",
                                        fontSize: 13.5,
                                        lineHeight: 1.65,
                                        fontFamily: "inherit",
                                        border: `1px solid ${filled ? "var(--border)" : "var(--border)"}`,
                                        background: filled ? "var(--surface)" : "var(--white)",
                                        transition: "all 0.2s",
                                        borderRadius: "var(--radius)",
                                        color: "var(--text)",
                                        resize: "vertical",
                                        outline: "none",
                                        display: "block",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = "var(--navy)";
                                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(12,21,32,0.06)";
                                        e.currentTarget.style.background = "var(--white)";
                                    }}
                                    onBlur={(e) => {
                                        const isFilled = e.currentTarget.value.trim().length > 0;
                                        e.currentTarget.style.borderColor = "var(--border)";
                                        e.currentTarget.style.boxShadow = "none";
                                        e.currentTarget.style.background = isFilled ? "var(--surface)" : "var(--white)";
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{
                    borderTop: "1px solid var(--border)",
                    padding: "18px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    justifyContent: "space-between",
                    background: "var(--surface)",
                }}>
                    <div>
                        {error && (
                            <p style={{
                                margin: 0,
                                fontSize: 12,
                                color: "var(--risk-high)",
                                lineHeight: 1.5,
                            }}>
                                {error}
                            </p>
                        )}
                        {loading && (
                            <p style={{
                                margin: 0,
                                fontSize: 12,
                                color: "var(--blue-conseil)",
                                fontWeight: 500,
                            }}>
                                Analyse du brief en cours… construction de l&apos;angle stratégique
                            </p>
                        )}
                        {!error && !loading && (
                            <p style={{ margin: 0, fontSize: 12, color: "var(--slate-light)" }}>
                                Génération en ~25 secondes · Résultat exportable PDF &amp; DOCX
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || filledCount < 6}
                        style={{
                            padding: "11px 28px",
                            background: filledCount === 6 && !loading ? "var(--navy)" : "var(--border)",
                            color: filledCount === 6 && !loading ? "var(--white)" : "var(--slate-light)",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: filledCount === 6 && !loading ? "pointer" : "not-allowed",
                            transition: "all 0.2s",
                            flexShrink: 0,
                            fontFamily: "inherit",
                            letterSpacing: "0.01em",
                        }}
                    >
                        {loading ? "Génération en cours…" : "Générer le dispositif →"}
                    </button>
                </div>
            </form>
        </div>
    );
}
