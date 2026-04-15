"use client";

import { useState } from "react";
import type { ProjectComment, SectionMeta, SectionStatus } from "../../lib/studio/types";
import { SECTION_STATUS_LABELS } from "../../lib/studio/types";

/* ========================
   Status badge + selector
======================== */

const STATUS_COLORS: Record<SectionStatus, { bg: string; color: string; border: string }> = {
    draft:         { bg: "var(--surface)",        color: "var(--slate)",        border: "var(--border)" },
    in_review:     { bg: "#eff6ff",               color: "var(--blue-conseil)", border: "var(--blue-medium)" },
    approved:      { bg: "#f0fdf4",               color: "#16a34a",             border: "#bbf7d0" },
    needs_changes: { bg: "var(--risk-high-bg)",   color: "var(--risk-high)",    border: "#fecaca" },
};

export function SectionStatusBadge({
    status,
    editable,
    onChangeStatus,
}: {
    status: SectionStatus;
    editable: boolean;
    onChangeStatus?: (s: SectionStatus) => void;
}) {
    const [open, setOpen] = useState(false);
    const { bg, color, border } = STATUS_COLORS[status];

    if (!editable) {
        return (
            <span className="collab-status-badge" style={{ background: bg, color, border: `1px solid ${border}` }}>
                {SECTION_STATUS_LABELS[status]}
            </span>
        );
    }

    return (
        <div style={{ position: "relative", display: "inline-block" }}>
            <button
                type="button"
                className="collab-status-badge collab-status-btn"
                style={{ background: bg, color, border: `1px solid ${border}` }}
                onClick={() => setOpen((v) => !v)}
                title="Changer le statut"
            >
                {SECTION_STATUS_LABELS[status]} ▾
            </button>
            {open && (
                <div className="collab-status-dropdown">
                    {(Object.keys(SECTION_STATUS_LABELS) as SectionStatus[]).map((s) => {
                        const c = STATUS_COLORS[s];
                        return (
                            <button
                                key={s}
                                type="button"
                                className="collab-status-option"
                                style={{ color: c.color }}
                                onClick={() => { onChangeStatus?.(s); setOpen(false); }}
                            >
                                {SECTION_STATUS_LABELS[s]}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ========================
   Owner tag
======================== */

export function SectionOwner({
    ownerName,
    editable,
    onChangeOwner,
}: {
    ownerName?: string;
    editable: boolean;
    onChangeOwner?: (name: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(ownerName ?? "");

    if (!editable && !ownerName) return null;

    if (!editable) {
        return (
            <span className="collab-owner-tag">
                ◎ {ownerName}
            </span>
        );
    }

    if (editing) {
        return (
            <form
                style={{ display: "inline-flex", gap: 4, alignItems: "center" }}
                onSubmit={(e) => {
                    e.preventDefault();
                    onChangeOwner?.(draft.trim());
                    setEditing(false);
                }}
            >
                <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Nom du responsable"
                    className="collab-owner-input"
                />
                <button type="submit" className="collab-inline-btn">OK</button>
                <button type="button" className="collab-inline-btn" onClick={() => setEditing(false)}>✕</button>
            </form>
        );
    }

    return (
        <button
            type="button"
            className="collab-owner-tag collab-owner-editable"
            onClick={() => setEditing(true)}
            title="Assigner un responsable"
        >
            {ownerName ? `◎ ${ownerName}` : "+ Responsable"}
        </button>
    );
}

/* ========================
   Section header with collab
======================== */

export function CollabSectionHeader({
    label,
    title,
    sectionId,
    meta,
    editable,
    commentCount,
    onChangeStatus,
    onChangeOwner,
    onToggleComments,
    showComments,
}: {
    label: string;
    title: string;
    sectionId: string;
    meta?: SectionMeta;
    editable: boolean;
    commentCount: number;
    onChangeStatus?: (s: SectionStatus) => void;
    onChangeOwner?: (name: string) => void;
    onToggleComments: () => void;
    showComments: boolean;
}) {
    const status: SectionStatus = meta?.status ?? "draft";
    const unresolvedCount = commentCount;

    return (
        <div className="collab-section-header">
            <div style={{ flex: 1 }}>
                <p className="section-label">{label}</p>
                <h2 className="section-title">{title}</h2>
                {meta?.ownerName && (
                    <SectionOwner ownerName={meta.ownerName} editable={editable} onChangeOwner={onChangeOwner} />
                )}
            </div>
            <div className="collab-section-actions">
                {editable && !meta?.ownerName && (
                    <SectionOwner ownerName={undefined} editable={editable} onChangeOwner={onChangeOwner} />
                )}
                <SectionStatusBadge
                    status={status}
                    editable={editable}
                    onChangeStatus={onChangeStatus}
                />
                <button
                    type="button"
                    className={`collab-comment-btn${showComments ? " collab-comment-btn-active" : ""}`}
                    onClick={onToggleComments}
                    title={showComments ? "Masquer les commentaires" : "Voir les commentaires"}
                >
                    💬 {unresolvedCount > 0 ? unresolvedCount : ""}
                </button>
            </div>
        </div>
    );
}

/* ========================
   Comment thread
======================== */

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `Il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `Il y a ${h}h`;
    return `Il y a ${Math.floor(h / 24)}j`;
}

function CommentItem({
    comment,
    editable,
    onResolve,
}: {
    comment: ProjectComment;
    editable: boolean;
    onResolve: () => void;
}) {
    return (
        <div className={`collab-comment${comment.resolved ? " collab-comment-resolved" : ""}`}>
            <div className="collab-comment-meta">
                <span className="collab-comment-author">{comment.authorName}</span>
                <span className="collab-comment-time">{timeAgo(comment.createdAt)}</span>
                {editable && (
                    <button
                        type="button"
                        className="collab-resolve-btn"
                        onClick={onResolve}
                        title={comment.resolved ? "Rouvrir" : "Marquer résolu"}
                    >
                        {comment.resolved ? "Rouvrir" : "✓ Résolu"}
                    </button>
                )}
            </div>
            <p className="collab-comment-text">{comment.text}</p>
        </div>
    );
}

export function SectionComments({
    sectionId,
    comments,
    editable,
    onAdd,
    onResolve,
}: {
    sectionId: string;
    comments: ProjectComment[];
    editable: boolean;
    onAdd: (text: string, author: string) => void;
    onResolve: (id: string) => void;
}) {
    const [text, setText] = useState("");
    const [author, setAuthor] = useState("");
    const [showResolved, setShowResolved] = useState(false);

    const visible = showResolved ? comments : comments.filter((c) => !c.resolved);
    const resolvedCount = comments.filter((c) => c.resolved).length;

    return (
        <div className="collab-comments-panel">
            {visible.map((c) => (
                <CommentItem key={c.id} comment={c} editable={editable} onResolve={() => onResolve(c.id)} />
            ))}

            {resolvedCount > 0 && (
                <button
                    type="button"
                    className="collab-show-resolved"
                    onClick={() => setShowResolved((v) => !v)}
                >
                    {showResolved ? "Masquer" : `Voir ${resolvedCount} résolu(s)`}
                </button>
            )}

            {editable && (
                <div className="collab-add-comment">
                    <input
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="Votre nom"
                        className="collab-author-input"
                    />
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Ajouter un commentaire sur cette section…"
                        className="collab-comment-input"
                        rows={2}
                    />
                    <button
                        type="button"
                        className="btn btn-light"
                        style={{ alignSelf: "flex-end", fontSize: 12, padding: "6px 14px" }}
                        disabled={!text.trim() || !author.trim()}
                        onClick={() => {
                            onAdd(text.trim(), author.trim());
                            setText("");
                        }}
                    >
                        Envoyer
                    </button>
                </div>
            )}
        </div>
    );
}

/* ========================
   Activity log (sidebar)
======================== */

export function ActivityLog({ items }: { items: { id: string; message: string; createdAt: string; authorName?: string }[] }) {
    if (!items.length) return (
        <p style={{ margin: 0, fontSize: 12, color: "var(--slate-light)", fontStyle: "italic" }}>
            Aucune activité pour l'instant.
        </p>
    );

    return (
        <div className="activity-log">
            {items.slice(0, 8).map((item) => (
                <div key={item.id} className="activity-item">
                    <p className="activity-message">{item.message}</p>
                    <span className="activity-time">{timeAgo(item.createdAt)}{item.authorName ? ` · ${item.authorName}` : ""}</span>
                </div>
            ))}
        </div>
    );
}

/* ========================
   Share modal
======================== */

export function ShareModal({
    project,
    onEnable,
    onDisable,
    onClose,
}: {
    project: { id: string; collaboration?: { isShared?: boolean; shareToken?: string; shareMode?: string } };
    onEnable: (mode: "view" | "edit") => void;
    onDisable: () => void;
    onClose: () => void;
}) {
    const [copied, setCopied] = useState(false);
    const collab = project.collaboration;
    const isShared = collab?.isShared;
    const shareUrl = isShared && collab?.shareToken
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/studio/${project.id}?share=${collab.shareToken}`
        : null;

    function copy() {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <p className="modal-title">Partager ce projet</p>
                    <button type="button" className="modal-close" onClick={onClose}>✕</button>
                </div>

                {!isShared ? (
                    <div>
                        <p className="modal-desc">
                            Générez un lien de partage pour permettre à d'autres personnes de consulter ou d'annoter ce dispositif.
                        </p>
                        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                            <button type="button" className="btn btn-light" style={{ flex: 1 }} onClick={() => onEnable("view")}>
                                Lien lecture seule
                            </button>
                            <button type="button" className="btn btn-dark" style={{ flex: 1 }} onClick={() => onEnable("edit")}>
                                Lien avec annotation
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="modal-desc">
                            Ce projet est partagé en mode <strong>{collab?.shareMode === "edit" ? "annotation" : "lecture"}</strong>.
                        </p>
                        <div className="share-link-row">
                            <input readOnly value={shareUrl ?? ""} className="share-link-input" />
                            <button type="button" className="btn btn-dark" onClick={copy}>
                                {copied ? "✓ Copié" : "Copier"}
                            </button>
                        </div>
                        <button
                            type="button"
                            className="btn btn-ghost"
                            style={{ marginTop: 14, fontSize: 12, color: "var(--risk-high)" }}
                            onClick={onDisable}
                        >
                            Désactiver le partage
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
