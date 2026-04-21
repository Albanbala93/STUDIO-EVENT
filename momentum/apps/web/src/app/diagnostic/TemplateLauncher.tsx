"use client";

/**
 * TemplateLauncher — composant inline qui expose un bouton
 * "Utiliser ce template" et, au clic, déploie un panneau avec les
 * questions prêtes à copier (Markdown ou texte brut).
 *
 * S'intègre directement sous une recommandation ou un angle mort du
 * dashboard, sans nouvelle page ni modal. Principe : zéro friction.
 */

import { useMemo, useState } from "react";
import type { Dimension } from "./dashboard";
import {
  TEMPLATES,
  TIMING_LABELS,
  templatesForDimension,
  toMarkdown,
  toPlainText,
  type Template,
  type TemplateQuestion,
} from "./templates";

/* ─────────────────────────────────────────────────────────────────────
   LAUNCHER — bouton + panneau déroulant
   ───────────────────────────────────────────────────────────────────── */

export function TemplateLauncher({
  dimension,
  /** Variante "cta" = plus visible (angle mort), "inline" = discret (sous reco). */
  variant = "inline",
  /** Libellé custom du bouton (ex. "Générer un template"). */
  label,
}: {
  dimension: Dimension | null;
  variant?: "inline" | "cta";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const templates = useMemo(
    () => (dimension ? templatesForDimension(dimension) : []),
    [dimension],
  );

  // Sélectionne le premier template par défaut quand on ouvre.
  const active = useMemo<Template | null>(() => {
    if (!open || templates.length === 0) return null;
    return templates.find(t => t.id === activeId) ?? templates[0];
  }, [open, activeId, templates]);

  if (!dimension || templates.length === 0) return null;

  const isCTA = variant === "cta";

  return (
    <div style={{ marginTop: 10 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          padding: isCTA ? "8px 14px" : "6px 10px",
          borderRadius: 8,
          border: `1px solid ${isCTA ? "#818cf8" : "rgba(129,140,248,0.3)"}`,
          background: isCTA ? "rgba(129,140,248,0.12)" : "transparent",
          color: "#c7d2fe",
          fontSize: isCTA ? 12 : 11,
          fontWeight: 600,
          letterSpacing: "0.02em",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(129,140,248,0.18)")}
        onMouseLeave={e => (e.currentTarget.style.background = isCTA ? "rgba(129,140,248,0.12)" : "transparent")}
      >
        {open ? "▾ " : "▸ "}
        {label ?? (isCTA ? "Générer un template de mesure" : "Utiliser ce template")}
      </button>

      {open && active && (
        <div
          style={{
            marginTop: 10,
            padding: 14,
            borderRadius: 12,
            background: "rgba(15,23,42,0.6)",
            border: "1px solid rgba(129,140,248,0.25)",
          }}
        >
          {/* Sélecteur s'il y a plusieurs templates pour la dimension */}
          {templates.length > 1 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {templates.map(t => {
                const isActive = t.id === active.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveId(t.id)}
                    style={{
                      padding: "5px 10px",
                      fontSize: 11,
                      borderRadius: 6,
                      border: `1px solid ${isActive ? "#818cf8" : "rgba(255,255,255,0.1)"}`,
                      background: isActive ? "rgba(129,140,248,0.2)" : "transparent",
                      color: isActive ? "#e0e7ff" : "#94a3b8",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {t.title}
                  </button>
                );
              })}
            </div>
          )}

          <TemplateBody template={active} />
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   CORPS DU TEMPLATE — métadonnées, questions, conseils, boutons copier
   ───────────────────────────────────────────────────────────────────── */

function TemplateBody({ template }: { template: Template }) {
  const [copied, setCopied] = useState<"md" | "txt" | null>(null);

  async function copy(kind: "md" | "txt") {
    const text = kind === "md" ? toMarkdown(template) : toPlainText(template);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      // Fallback basique si clipboard API indisponible
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1800);
    }
  }

  return (
    <div>
      {/* En-tête : titre + timing + contexte */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>
          {template.title}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(59,130,246,0.15)",
              color: "#93c5fd",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {TIMING_LABELS[template.timing]}
          </span>
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            {template.questions.length} questions
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.55 }}>{template.context}</div>
      </div>

      {/* Questions */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: 6,
          }}
        >
          Questions
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, color: "#e2e8f0", fontSize: 12, lineHeight: 1.65 }}>
          {template.questions.map(q => (
            <li key={q.id} style={{ marginBottom: 6 }}>
              <span style={{ color: "#f1f5f9" }}>
                {q.text}
                {q.required && (
                  <span style={{ color: "#f87171", marginLeft: 4 }} title="Question obligatoire">
                    *
                  </span>
                )}
              </span>
              <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic", marginTop: 2 }}>
                {scaleLabel(q)}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Conseils */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#64748b",
            marginBottom: 6,
          }}
        >
          Conseils d'utilisation
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 12, lineHeight: 1.6 }}>
          {template.tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* Actions copier */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => copy("txt")}
          style={copyBtnStyle(copied === "txt")}
        >
          {copied === "txt" ? "✓ Copié" : "📋 Copier (texte brut)"}
        </button>
        <button
          type="button"
          onClick={() => copy("md")}
          style={copyBtnStyle(copied === "md")}
        >
          {copied === "md" ? "✓ Copié" : "📋 Copier (Markdown)"}
        </button>
        <span style={{ fontSize: 10, color: "#64748b", alignSelf: "center", marginLeft: 4 }}>
          → Coller dans Google Forms, Typeform, Notion…
        </span>
      </div>
    </div>
  );
}

function scaleLabel(q: TemplateQuestion): string {
  switch (q.scale.kind) {
    case "likert_5":
      return `Échelle 1 à 5 — ${q.scale.labels[0]} → ${q.scale.labels[1]}`;
    case "likert_10":
      return `Échelle 1 à 10 — ${q.scale.labels[0]} → ${q.scale.labels[1]}`;
    case "open_short":
      return "Réponse libre (1 à 2 phrases)";
    case "yes_no":
      return "Oui / Non";
    case "multiple_choice":
      return `Choix multiple : ${q.scale.options.join(" · ")}`;
  }
}

function copyBtnStyle(isCopied: boolean): React.CSSProperties {
  return {
    padding: "6px 12px",
    borderRadius: 6,
    border: `1px solid ${isCopied ? "#34d399" : "rgba(255,255,255,0.1)"}`,
    background: isCopied ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)",
    color: isCopied ? "#6ee7b7" : "#e2e8f0",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  };
}

/* ─────────────────────────────────────────────────────────────────────
   Garde-fou — indique si au moins un template existe pour la dimension.
   ───────────────────────────────────────────────────────────────────── */

export function hasTemplate(dimension: Dimension | null): boolean {
  if (!dimension) return false;
  return TEMPLATES.some(t => t.dimension === dimension);
}
