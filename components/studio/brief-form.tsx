"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getUserContext, learnFromProject, saveProject } from "../../lib/studio/storage";
import type { BriefInput, StudioOutput, StudioProject } from "../../lib/studio/types";

type UploadStatus = "idle" | "uploading" | "success" | "error";
const ACCEPTED_FILES = ".pdf,.doc,.docx,.txt";

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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

    async function processBriefFile(file: File) {
        setUploadStatus("uploading");
        setUploadedFileName(file.name);
        setError(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/studio/upload-brief", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                setUploadStatus("error");
                setError(data?.error || "Impossible de lire le fichier — réessayez ou remplissez le brief manuellement.");
                return;
            }

            setBrief((prev) => ({
                ...prev,
                companyContext: data.brief.companyContext || "",
                challenge: data.brief.challenge || "",
                audience: data.brief.audience || "",
                objective: data.brief.objective || "",
                tone: data.brief.tone || "",
                constraints: data.brief.constraints || "",
            }));
            setUploadStatus("success");
        } catch (err) {
            setUploadStatus("error");
            setError(err instanceof Error ? err.message : "Échec de l'import du brief.");
        }
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) void processBriefFile(file);
        // reset pour permettre de redéposer le même fichier
        e.target.value = "";
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void processBriefFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!dragOver) setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        // Évite le flicker quand on survole un enfant : on quitte uniquement
        // si on sort vraiment du conteneur.
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOver(false);
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

    const dropzoneBorder = dragOver
        ? "var(--navy)"
        : uploadStatus === "success"
        ? "var(--blue-conseil, #6366F1)"
        : "var(--border)";
    const dropzoneBg = dragOver
        ? "rgba(99,102,241,0.06)"
        : uploadStatus === "success"
        ? "rgba(99,102,241,0.03)"
        : "var(--white)";

    return (
        <div style={{ maxWidth: 880, margin: "0 auto" }}>

            {/* ── Dropzone : import brief — gros, visible, drag & drop ── */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    marginBottom: 18,
                    padding: "22px 24px",
                    border: `2px dashed ${dropzoneBorder}`,
                    borderRadius: "var(--radius-lg)",
                    background: dropzoneBg,
                    transition: "border-color 0.18s, background 0.18s",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    cursor: uploadStatus === "uploading" ? "wait" : "default",
                }}
                aria-label="Zone d'import de brief — glissez un fichier ou cliquez sur le bouton"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_FILES}
                    onChange={handleFileInputChange}
                    style={{ display: "none" }}
                />

                {/* Icône */}
                <div
                    aria-hidden="true"
                    style={{
                        flexShrink: 0,
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: uploadStatus === "success"
                            ? "rgba(99,102,241,0.12)"
                            : "var(--surface)",
                        color: uploadStatus === "success" ? "#4F46E5" : "var(--navy)",
                        transition: "background 0.18s, color 0.18s",
                    }}
                >
                    {uploadStatus === "uploading" ? (
                        <span className="loading-dots" aria-hidden>
                            <span className="loading-dot" />
                            <span className="loading-dot" />
                            <span className="loading-dot" />
                        </span>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                            {uploadStatus === "success" ? (
                                <path
                                    d="M5 12.5l4 4 10-10"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ) : (
                                <>
                                    <path
                                        d="M12 16V4M7 9l5-5 5 5"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />
                                </>
                            )}
                        </svg>
                    )}
                </div>

                {/* Texte principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                        style={{
                            margin: "0 0 3px",
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--text)",
                            letterSpacing: "-0.005em",
                        }}
                    >
                        {uploadStatus === "uploading"
                            ? "Lecture du brief en cours…"
                            : uploadStatus === "success"
                            ? "Brief importé — vérifiez les 6 champs ci-dessous"
                            : dragOver
                            ? "Déposez ici pour importer"
                            : "Importer un brief existant"}
                    </p>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12.5,
                            color: "var(--slate-light)",
                            lineHeight: 1.5,
                        }}
                    >
                        {uploadStatus === "success" && uploadedFileName
                            ? `${uploadedFileName} — les champs ont été pré-remplis automatiquement.`
                            : uploadStatus === "uploading" && uploadedFileName
                            ? `Analyse de ${uploadedFileName}…`
                            : "Glissez un PDF, Word ou TXT — les 6 champs sont pré-remplis automatiquement. Sinon, remplissez le formulaire ci-dessous."}
                    </p>
                </div>

                {/* CTA principal */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadStatus === "uploading"}
                    style={{
                        flexShrink: 0,
                        padding: "11px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: "inherit",
                        letterSpacing: "0.01em",
                        background: uploadStatus === "uploading" ? "var(--border)" : "var(--navy)",
                        color: uploadStatus === "uploading" ? "var(--slate-light)" : "var(--white)",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        cursor: uploadStatus === "uploading" ? "wait" : "pointer",
                        transition: "background 0.18s, transform 0.1s",
                    }}
                    onMouseDown={(e) => {
                        if (uploadStatus !== "uploading") {
                            e.currentTarget.style.transform = "translateY(1px)";
                        }
                    }}
                    onMouseUp={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                    }}
                >
                    {uploadStatus === "success" ? "Réimporter" : "Choisir un fichier"}
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
            }}>

                {/* Form header */}
                <div style={{
                    background: "var(--navy)",
                    padding: "18px 32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 24,
                }}>
                    <div>
                        <p style={{
                            margin: "0 0 1px",
                            fontSize: 9.5,
                            fontWeight: 700,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.38)",
                        }}>
                            Brief stratégique
                        </p>
                        <p style={{
                            margin: 0,
                            fontSize: 13,
                            fontWeight: 500,
                            color: filledCount === 6 ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.65)",
                        }}>
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
                                        width: 22,
                                        height: 2,
                                        borderRadius: 2,
                                        background: i < filledCount ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.12)",
                                        transition: "background 0.25s",
                                    }}
                                />
                            ))}
                        </div>
                        <span style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "rgba(255,255,255,0.35)",
                            minWidth: 28,
                            fontVariantNumeric: "tabular-nums",
                        }}>
                            {progress}%
                        </span>
                    </div>
                </div>

                {/* Fields */}
                <div style={{ padding: "0 32px" }}>
                    {fieldConfig.map(({ key, label, hint, example }, index) => {
                        const filled = brief[key].trim().length > 0;
                        return (
                            <div
                                key={key}
                                className="brief-field-row"
                                style={{
                                    borderBottom: index < fieldConfig.length - 1
                                        ? "1px solid var(--border-light)"
                                        : "none",
                                }}
                            >
                                {/* Left: label + hint */}
                                <div className="brief-field-meta">
                                    <div className="brief-field-label-row">
                                        <span className={`brief-field-step ${filled ? "brief-field-step-done" : "brief-field-step-empty"}`}>
                                            {filled ? "✓" : index + 1}
                                        </span>
                                        <label className="brief-field-label" htmlFor={`field-${key}`}>
                                            {label}
                                        </label>
                                    </div>
                                    <p className="brief-field-hint">{hint}</p>
                                </div>

                                {/* Right: textarea */}
                                <textarea
                                    id={`field-${key}`}
                                    required
                                    placeholder={example}
                                    value={brief[key]}
                                    onChange={(e) => setBrief((cur) => ({ ...cur, [key]: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        minHeight: 82,
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
                                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(11,20,34,0.06)";
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
                    padding: "16px 32px",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    justifyContent: "space-between",
                    background: "var(--surface)",
                }}>
                    {/* Left: status / import */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                        {error && (
                            <p style={{ margin: 0, fontSize: 12, color: "var(--risk-high)", lineHeight: 1.5 }}>
                                {error}
                            </p>
                        )}
                        {loading && (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="loading-dots">
                                    <span className="loading-dot" />
                                    <span className="loading-dot" />
                                    <span className="loading-dot" />
                                </span>
                                <p style={{ margin: 0, fontSize: 12, color: "var(--blue-conseil)", fontWeight: 500 }}>
                                    Analyse du brief · construction de l&apos;angle stratégique
                                </p>
                            </div>
                        )}
                        {!error && !loading && (
                            <p style={{ margin: 0, fontSize: 11.5, color: "var(--slate-light)" }}>
                                Génération en ~25s · Résultat exportable
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || filledCount < 6}
                        style={{
                            padding: "10px 24px",
                            background: filledCount === 6 && !loading ? "var(--navy)" : "var(--border)",
                            color: filledCount === 6 && !loading ? "var(--white)" : "var(--slate-light)",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 600,
                            fontSize: 12.5,
                            cursor: filledCount === 6 && !loading ? "pointer" : "not-allowed",
                            transition: "all 0.2s",
                            flexShrink: 0,
                            fontFamily: "inherit",
                            letterSpacing: "0.01em",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading ? "Génération…" : "Générer le dispositif →"}
                    </button>
                </div>
            </form>
        </div>
    );
}
