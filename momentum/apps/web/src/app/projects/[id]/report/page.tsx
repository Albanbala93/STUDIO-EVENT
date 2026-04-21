"use client";

/**
 * Module 5 — Générateur de rapports.
 *
 * Cette page produit deux formats à partir d'un projet sauvegardé :
 *   • Synthèse exécutive 1 page (COMEX)
 *   • Rapport détaillé 4-6 pages (archivage / partage équipe)
 *
 * L'export PDF passe par window.print() + CSS @media print
 * (zéro dépendance lourde, rendu navigateur natif).
 *
 * Les options (format, logo, préparateur, confidentialité, historique)
 * sont synchronisées dans l'URL → la page sert aussi de lien partageable.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

const INITIATIVE_LABELS: Record<string, string> = {
  corporate_event: "Événement corporate",
  digital_campaign: "Campagne digitale",
  change_management: "Accompagnement du changement",
  newsletter: "Newsletter interne",
  product_launch: "Lancement produit",
  other: "Autre initiative",
};

const DIMENSION_LABELS: Record<string, string> = {
  reach: "Mobilisation",
  engagement: "Implication",
  appropriation: "Compréhension des messages",
  impact: "Impact",
};

const PROVENANCE_LABELS: Record<string, string> = {
  measured: "Mesurée",
  declared: "Déclarée",
  estimated: "Estimée",
  proxy: "Proxy",
};

type ProjectFull = {
  id: string;
  name: string;
  initiative_type: string | null;
  audience: string | null;
  intent: string | null;
  created_at: string;
  payload: {
    id?: {
      name: string;
      initiativeType: string;
      audienceType: string;
      audienceSize: number;
      intent: string;
    };
    answers?: Record<string, { kpiId: string; value: number; provenance: string; confidenceLabel: string }>;
    diagnostic: {
      score: {
        overall_score: number;
        confidence_score: number;
        dimension_scores: Array<{
          dimension: string;
          score: number;
          confidence_score: number;
          measured_count: number;
          estimated_count: number;
          declared_count: number;
          proxy_count: number;
          kpi_breakdown: Array<{
            kpi_id: string | null;
            value: number;
            confidence: number;
            contribution: number;
            provenance: string;
          }>;
        }>;
        measured_count: number;
        estimated_count: number;
        declared_count: number;
        proxy_count: number;
        missing_dimensions: string[];
      };
      interpretation: {
        executive_summary: {
          headline: string;
          key_insight: string;
          top_strengths: string[];
          top_priorities: string[];
        };
        detailed_analysis: {
          summary: string;
          strengths: Array<{ title: string; description: string }>;
          weaknesses: Array<{ title: string; description: string }>;
          recommendations: Array<{ title: string; action: string; priority: string }>;
          data_gaps: Array<{ field: string; issue: string; impact: string }>;
        };
      };
    };
  };
};

type TrendsResponse = {
  unlocked: boolean;
  sample_size: number;
  minimum_required: number;
  points: Array<{
    project_id: string;
    name: string;
    created_at: string;
    overall_score: number | null;
  }>;
  interpretations: string[];
};

type Format = "executive" | "full" | "both";

function statusBadge(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Performance excellente", color: "#16a34a" };
  if (score >= 65) return { label: "Performance solide", color: "#65a30d" };
  if (score >= 40) return { label: "Performance à consolider", color: "#d97706" };
  return { label: "Performance fragile", color: "#dc2626" };
}

function reliabilityLabel(c: number): { label: string; color: string; note: string } {
  if (c >= 0.75)
    return {
      label: "Fiabilité élevée",
      color: "#16a34a",
      note: "Les données collectées permettent une lecture stratégique fiable.",
    };
  if (c >= 0.5)
    return {
      label: "Fiabilité partielle",
      color: "#d97706",
      note: "Certaines données sont déclaratives — interpréter avec prudence.",
    };
  return {
    label: "Fiabilité faible",
    color: "#dc2626",
    note: "Données majoritairement estimées ou déclarées — consolider avant décision.",
  };
}

function scoreColor(s: number): string {
  if (s >= 80) return "#16a34a";
  if (s >= 65) return "#65a30d";
  if (s >= 40) return "#d97706";
  return "#dc2626";
}

function progressBlocks(score: number): string {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function formatDateFR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function priorityMeta(p: string): { label: string; color: string } {
  const v = p.toLowerCase();
  if (v.includes("haut") || v.includes("high"))
    return { label: "Priorité haute", color: "#dc2626" };
  if (v.includes("moy") || v.includes("med"))
    return { label: "Priorité moyenne", color: "#d97706" };
  return { label: "Priorité faible", color: "#65a30d" };
}

export default function ReportPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const sp = useSearchParams();

  const format = (sp.get("format") as Format) || "both";
  const logoUrl = sp.get("logo") || "";
  const preparedBy = sp.get("prep") || "";
  const confidential = sp.get("confidential") !== "0";
  const includeHistory = sp.get("history") !== "0";

  const [project, setProject] = useState<ProjectFull | null>(null);
  const [trends, setTrends] = useState<TrendsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const endpoint = API_BASE_URL
      ? `${API_BASE_URL}/projects/${params.id}`
      : `/api/projects/${params.id}`;
    fetch(endpoint)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Projet introuvable" : `API ${r.status}`);
        return r.json();
      })
      .then(setProject)
      .catch((e) => setError(e.message));
  }, [params.id]);

  useEffect(() => {
    if (!project || !includeHistory) return;
    const t = project.initiative_type
      ? `?initiative_type=${encodeURIComponent(project.initiative_type)}`
      : "";
    fetch(`${API_BASE_URL}/analytics/trends${t}`)
      .then((r) => r.json())
      .then(setTrends)
      .catch(() => setTrends(null));
  }, [project, includeHistory]);

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(sp.toString());
    if (value === null || value === "") next.delete(key);
    else next.set(key, value);
    router.replace(`/projects/${params.id}/report?${next.toString()}`);
  }

  async function copyLink() {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  const showExecutive = format === "executive" || format === "both";
  const showFull = format === "full" || format === "both";

  const totalKpis = useMemo(() => {
    if (!project) return 0;
    return Object.keys(project.payload.answers ?? {}).length;
  }, [project]);

  if (error)
    return (
      <div style={{ padding: 40, color: "#fca5a5", fontFamily: "system-ui" }}>
        Erreur : {error}
      </div>
    );

  if (!project)
    return (
      <div style={{ padding: 40, color: "#64748b", fontFamily: "system-ui" }}>
        Chargement du rapport…
      </div>
    );

  const d = project.payload.diagnostic;
  const score = Math.round(d.score.overall_score);
  const conf = d.score.confidence_score;
  const status = statusBadge(score);
  const reli = reliabilityLabel(conf);
  const idData = project.payload.id;

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh" }}>
      {/* ───────── Sidebar config (no-print) ───────── */}
      <aside
        className="no-print"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 320,
          height: "100vh",
          background: "#0a0d1a",
          color: "#e2e8f0",
          padding: 24,
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
          fontSize: 13,
          overflowY: "auto",
          borderLeft: "1px solid rgba(148,163,184,0.15)",
          zIndex: 10,
        }}
      >
        <Link
          href={`/projects/${params.id}`}
          style={{ color: "#94a3b8", textDecoration: "none", fontSize: 12 }}
        >
          ← Retour au projet
        </Link>
        <h2 style={{ fontSize: 18, marginTop: 16, marginBottom: 4 }}>Options du rapport</h2>
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 0, marginBottom: 20 }}>
          Personnalisez avant export. L'URL devient un lien partageable.
        </p>

        <Field label="Format">
          <select
            value={format}
            onChange={(e) => updateParam("format", e.target.value)}
            style={selectStyle}
          >
            <option value="executive">Synthèse 1 page</option>
            <option value="full">Rapport complet</option>
            <option value="both">Les deux</option>
          </select>
        </Field>

        <Field label="Logo entreprise (URL)">
          <input
            type="url"
            placeholder="https://…/logo.png"
            value={logoUrl}
            onChange={(e) => updateParam("logo", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Préparé par">
          <input
            type="text"
            placeholder="Nom du préparateur"
            value={preparedBy}
            onChange={(e) => updateParam("prep", e.target.value)}
            style={inputStyle}
          />
        </Field>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <input
            type="checkbox"
            checked={confidential}
            onChange={(e) => updateParam("confidential", e.target.checked ? null : "0")}
          />
          Mention confidentielle
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <input
            type="checkbox"
            checked={includeHistory}
            onChange={(e) => updateParam("history", e.target.checked ? null : "0")}
          />
          Inclure perspective historique
        </label>

        <div style={{ borderTop: "1px solid rgba(148,163,184,0.15)", paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>
            Format : <strong>{format === "both" ? "Synthèse + Rapport" : format === "executive" ? "Synthèse 1 page" : "Rapport complet"}</strong>
            <br />
            Pages : <strong>{(showExecutive ? 1 : 0) + (showFull ? (includeHistory && trends?.unlocked ? 6 : 5) : 0)}</strong>
            <br />
            Projet : <strong>{project.name}</strong>
          </div>

          <button onClick={() => window.print()} style={primaryBtnStyle}>
            🖨️ Générer le rapport (PDF)
          </button>

          <button onClick={copyLink} style={ghostBtnStyle}>
            {linkCopied ? "✓ Lien copié" : "🔗 Copier le lien de partage"}
          </button>

          <button
            onClick={() =>
              alert("Export PowerPoint à venir.\nPour l'instant, utilisez l'export PDF puis convertissez si nécessaire.")
            }
            style={{ ...ghostBtnStyle, opacity: 0.6 }}
          >
            📊 Export PowerPoint (bientôt)
          </button>
        </div>
      </aside>

      {/* ───────── Pages imprimables ───────── */}
      <div className="report-canvas" style={{ marginRight: 320 }}>
        {showExecutive && (
          <ExecutivePage
            project={project}
            score={score}
            status={status}
            reli={reli}
            logoUrl={logoUrl}
            totalKpis={totalKpis}
            confidential={confidential}
          />
        )}

        {showFull && (
          <>
            <CoverPage
              project={project}
              logoUrl={logoUrl}
              preparedBy={preparedBy}
              confidential={confidential}
            />
            <ContextPage project={project} />
            <ResultsPage project={project} score={score} status={status} />
            <DiagnosticPage project={project} />
            <ActionPlanPage project={project} />
            {includeHistory && (
              <HistoryPage projectName={project.name} trends={trends} />
            )}
          </>
        )}
      </div>

      {/* ───────── Styles print ───────── */}
      <style jsx global>{`
        @page {
          size: A4;
          margin: 14mm 16mm;
        }
        body {
          margin: 0;
        }
        .report-page {
          background: #ffffff;
          color: #1e293b;
          font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
          width: 210mm;
          min-height: 297mm;
          padding: 16mm 18mm;
          margin: 12px auto;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.1);
          page-break-after: always;
          box-sizing: border-box;
          line-height: 1.5;
        }
        .report-page:last-child {
          page-break-after: auto;
        }
        .report-page h1,
        .report-page h2,
        .report-page h3,
        .report-page h4 {
          color: #0f172a;
          margin-top: 0;
        }
        .report-page p {
          margin: 0 0 10px 0;
        }
        .meta-line {
          color: #64748b;
          font-size: 12px;
        }
        .section-divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 14px 0;
        }
        .bar-row {
          display: grid;
          grid-template-columns: 110px 1fr 60px;
          gap: 12px;
          align-items: center;
          font-size: 12px;
          margin-bottom: 6px;
          font-family: "JetBrains Mono", "Consolas", monospace;
        }
        .bar-row .bar-label {
          color: #475569;
          font-family: "Inter", sans-serif;
        }
        .priority-card {
          border-left: 3px solid;
          padding: 10px 14px;
          margin-bottom: 10px;
          background: #f8fafc;
          border-radius: 0 6px 6px 0;
          font-size: 12px;
        }
        .reli-warning {
          background: #fffbeb;
          border: 1px solid #fde68a;
          border-radius: 6px;
          padding: 10px 14px;
          font-size: 12px;
          color: #92400e;
          margin: 12px 0;
        }
        @media print {
          body {
            background: #ffffff !important;
          }
          .no-print {
            display: none !important;
          }
          .report-canvas {
            margin-right: 0 !important;
          }
          .report-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            min-height: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FORMAT A — Synthèse exécutive 1 page
   ═══════════════════════════════════════════════════════════════════ */

function ExecutivePage({
  project,
  score,
  status,
  reli,
  logoUrl,
  totalKpis,
  confidential,
}: {
  project: ProjectFull;
  score: number;
  status: { label: string; color: string };
  reli: { label: string; color: string; note: string };
  logoUrl: string;
  totalKpis: number;
  confidential: boolean;
}) {
  const d = project.payload.diagnostic;
  const idData = project.payload.id;
  const summary = d.interpretation.executive_summary;
  const detail = d.interpretation.detailed_analysis;

  const dimMap = new Map(d.score.dimension_scores.map((x) => [x.dimension, x.score]));

  return (
    <section className="report-page">
      {/* En-tête */}
      <header style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" style={{ height: 44, objectFit: "contain" }} />
        ) : (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              border: "1px dashed #cbd5e1",
              background: "#f8fafc",
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, margin: "0 0 2px 0" }}>
            Bilan de performance — {project.name}
          </h1>
          <div className="meta-line">
            {formatDateFR(project.created_at)}
            {project.initiative_type && ` · ${INITIATIVE_LABELS[project.initiative_type] ?? project.initiative_type}`}
            {project.audience && ` · ${project.audience}`}
            {project.intent && ` · ${project.intent}`}
          </div>
        </div>
      </header>

      <hr className="section-divider" />

      {/* Section 1 — Verdict */}
      <section style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 20, alignItems: "center", marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56, fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>
            {score}
            <span style={{ fontSize: 18, color: "#64748b", fontWeight: 500 }}>/100</span>
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              fontWeight: 700,
              color: status.color,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            ● {status.label}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 14, color: "#1e293b", margin: 0, lineHeight: 1.6 }}>
            {summary.headline || summary.key_insight}
          </p>
          <div style={{ marginTop: 10, fontSize: 11, color: reli.color, fontWeight: 600 }}>
            ● {reli.label} — {reli.note}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Section 2 — 4 dimensions */}
      <section style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
          Les 4 dimensions
        </h3>
        {(["reach", "engagement", "appropriation", "impact"] as const).map((dim) => {
          const v = dimMap.get(dim);
          if (v === undefined) {
            return (
              <div key={dim} className="bar-row">
                <span className="bar-label">{DIMENSION_LABELS[dim]}</span>
                <span style={{ color: "#94a3b8" }}>{progressBlocks(0)}</span>
                <span style={{ color: "#94a3b8" }}>—</span>
              </div>
            );
          }
          return (
            <div key={dim} className="bar-row">
              <span className="bar-label">{DIMENSION_LABELS[dim]}</span>
              <span style={{ color: scoreColor(v) }}>{progressBlocks(v)}</span>
              <span style={{ color: scoreColor(v), fontWeight: 700 }}>{Math.round(v)}/100</span>
            </div>
          );
        })}
      </section>

      <hr className="section-divider" />

      {/* Section 3 — Ce qu'il faut retenir */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 13, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            ✓ 3 Points forts
          </h3>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.6 }}>
            {(detail.strengths.slice(0, 3).length > 0
              ? detail.strengths.slice(0, 3).map((s) => s.title)
              : ["Aucun point fort consolidé pour l'instant."]
            ).map((t, i) => (
              <li key={i} style={{ color: "#1e293b", marginBottom: 4 }}>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 style={{ fontSize: 13, color: "#d97706", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            ⚠ 3 Points de vigilance
          </h3>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, lineHeight: 1.6 }}>
            {(detail.weaknesses.slice(0, 3).length > 0
              ? detail.weaknesses.slice(0, 3).map((s) => s.title)
              : ["Aucun point de vigilance identifié."]
            ).map((t, i) => (
              <li key={i} style={{ color: "#1e293b", marginBottom: 4 }}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Section 4 — 3 actions prioritaires */}
      <section>
        <h3 style={{ fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          🎯 Les 3 actions prioritaires
        </h3>
        {detail.recommendations.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8" }}>
            Les données collectées ne permettent pas de formuler des recommandations précises.
            Compléter les angles morts identifiés pour affiner le diagnostic.
          </p>
        ) : (
          detail.recommendations.slice(0, 3).map((r, i) => {
            const meta = priorityMeta(r.priority);
            return (
              <div key={i} className="priority-card" style={{ borderLeftColor: meta.color }}>
                <div style={{ fontWeight: 700, color: meta.color, marginBottom: 2 }}>
                  ● {meta.label}
                </div>
                <div style={{ color: "#1e293b" }}>
                  → <strong>{r.title}</strong>
                  {r.action && ` — ${r.action}`}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Pied de page */}
      <footer
        style={{
          marginTop: "auto",
          paddingTop: 16,
          fontSize: 10,
          color: "#94a3b8",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Rapport généré par Momentum — {formatDateFR(new Date().toISOString())}</span>
        <span>Basé sur {totalKpis} indicateurs collectés{confidential ? " · Document confidentiel" : ""}</span>
      </footer>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FORMAT B — Rapport détaillé
   ═══════════════════════════════════════════════════════════════════ */

function CoverPage({
  project,
  logoUrl,
  preparedBy,
  confidential,
}: {
  project: ProjectFull;
  logoUrl: string;
  preparedBy: string;
  confidential: boolean;
}) {
  return (
    <section className="report-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" style={{ height: 80, objectFit: "contain", marginBottom: 60 }} />
      ) : (
        <div
          style={{
            width: 100,
            height: 80,
            borderRadius: 8,
            border: "1px dashed #cbd5e1",
            background: "#f8fafc",
            marginBottom: 60,
          }}
        />
      )}

      <div style={{ fontSize: 14, color: "#64748b", textTransform: "uppercase", letterSpacing: 2, marginBottom: 16 }}>
        Rapport de performance communication
      </div>
      <h1 style={{ fontSize: 38, margin: "0 0 24px 0", maxWidth: "80%" }}>{project.name}</h1>

      <div style={{ fontSize: 14, color: "#475569", lineHeight: 2 }}>
        <div>{formatDateFR(project.created_at)}</div>
        {preparedBy && <div>Préparé par : {preparedBy}</div>}
      </div>

      <div style={{ marginTop: "auto", paddingTop: 80, fontSize: 11, color: "#94a3b8" }}>
        {confidential && "Document confidentiel — Usage interne"}
      </div>
    </section>
  );
}

function ContextPage({ project }: { project: ProjectFull }) {
  const d = project.payload.diagnostic;
  const idData = project.payload.id;
  const dimRows = d.score.dimension_scores;

  return (
    <section className="report-page">
      <h2 style={{ fontSize: 22, marginBottom: 24 }}>Contexte & Méthodologie</h2>

      <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Contexte de l'action
      </h3>
      <table style={{ width: "100%", fontSize: 12, marginBottom: 24, borderCollapse: "collapse" }}>
        <tbody>
          <ContextRow label="Nom" value={project.name} />
          <ContextRow
            label="Type"
            value={project.initiative_type ? INITIATIVE_LABELS[project.initiative_type] ?? project.initiative_type : "—"}
          />
          <ContextRow label="Date" value={formatDateFR(project.created_at)} />
          <ContextRow label="Audience cible" value={project.audience ?? "—"} />
          {idData?.audienceSize ? (
            <ContextRow label="Taille de l'audience" value={`${idData.audienceSize} personnes`} />
          ) : null}
          <ContextRow label="Intention principale" value={project.intent ?? "—"} />
        </tbody>
      </table>

      <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Méthodologie de mesure
      </h3>
      <p style={{ fontSize: 12, color: "#475569", marginBottom: 20, lineHeight: 1.6 }}>
        Le diagnostic Momentum repose sur 4 dimensions d'analyse : Mobilisation, Implication,
        Compréhension des messages, Impact. Chaque indicateur est pondéré selon son type
        (mesuré, déclaré, estimé, proxy) et son niveau de confiance, garantissant une lecture
        nuancée plutôt qu'un score brut.
      </p>

      <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        Fiabilité des données
      </h3>
      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            <th style={thStyle}>Dimension</th>
            <th style={thStyle}>Type principal</th>
            <th style={thStyle}>Confiance</th>
            <th style={thStyle}>Fiabilité</th>
          </tr>
        </thead>
        <tbody>
          {dimRows.map((dr) => {
            const total = dr.measured_count + dr.declared_count + dr.estimated_count + dr.proxy_count;
            const main = total === 0
              ? "—"
              : dr.measured_count >= dr.declared_count && dr.measured_count >= dr.estimated_count && dr.measured_count >= dr.proxy_count
              ? "Mesurée"
              : dr.declared_count >= dr.estimated_count && dr.declared_count >= dr.proxy_count
              ? "Déclarée"
              : dr.estimated_count >= dr.proxy_count
              ? "Estimée"
              : "Proxy";
            const reli = reliabilityLabel(dr.confidence_score);
            return (
              <tr key={dr.dimension}>
                <td style={tdStyle}>{DIMENSION_LABELS[dr.dimension] ?? dr.dimension}</td>
                <td style={tdStyle}>{main}</td>
                <td style={tdStyle}>{Math.round(dr.confidence_score * 100)}%</td>
                <td style={{ ...tdStyle, color: reli.color, fontWeight: 600 }}>{reli.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {d.score.confidence_score < 0.75 && (
        <div className="reli-warning">
          <strong>Note :</strong> les dimensions avec fiabilité faible ou partielle nécessitent
          une consolidation des données avant toute décision stratégique. Nous recommandons de
          systématiser les mesures objectives lors de la prochaine action.
        </div>
      )}
    </section>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td style={{ padding: "6px 0", color: "#64748b", width: 180 }}>{label}</td>
      <td style={{ padding: "6px 0", color: "#1e293b", fontWeight: 500 }}>{value}</td>
    </tr>
  );
}

function ResultsPage({
  project,
  score,
  status,
}: {
  project: ProjectFull;
  score: number;
  status: { label: string; color: string };
}) {
  const d = project.payload.diagnostic;
  const summary = d.interpretation.executive_summary;

  return (
    <section className="report-page">
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Résultats</h2>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 48, fontWeight: 800, color: scoreColor(score), lineHeight: 1 }}>
          {score}
          <span style={{ fontSize: 18, color: "#64748b", fontWeight: 500 }}>/100</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: status.color }}>● {status.label}</div>
          <p style={{ fontSize: 12, color: "#475569", margin: "4px 0 0 0", maxWidth: 480 }}>
            {summary.headline || summary.key_insight}
          </p>
        </div>
      </div>

      <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
        Détail des 4 dimensions
      </h3>
      {d.score.dimension_scores.map((ds) => (
        <DimensionBlock key={ds.dimension} ds={ds} />
      ))}
      {d.score.dimension_scores.length === 0 && (
        <p style={{ fontSize: 12, color: "#94a3b8" }}>
          Aucune dimension mesurée — score global non calculable.
        </p>
      )}
    </section>
  );
}

function DimensionBlock({ ds }: { ds: ProjectFull["payload"]["diagnostic"]["score"]["dimension_scores"][number] }) {
  const score = Math.round(ds.score);
  return (
    <div style={{ marginBottom: 16, padding: "12px 14px", borderLeft: `3px solid ${scoreColor(score)}`, background: "#f8fafc", borderRadius: "0 6px 6px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <h4 style={{ fontSize: 14, margin: 0 }}>▌ {DIMENSION_LABELS[ds.dimension] ?? ds.dimension}</h4>
        <div style={{ fontSize: 16, fontWeight: 800, color: scoreColor(score) }}>{score}/100</div>
      </div>
      <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, fontFamily: "monospace" }}>
        {progressBlocks(score)}
      </div>
      {ds.kpi_breakdown.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, marginBottom: 4 }}>
            <strong>Indicateurs collectés :</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "#475569" }}>
            {ds.kpi_breakdown.slice(0, 4).map((kb, i) => (
              <li key={i}>
                {kb.kpi_id ?? "indicateur"} : {Math.round(kb.value)}
                {" — "}
                <span style={{ color: "#94a3b8" }}>
                  {PROVENANCE_LABELS[kb.provenance] ?? kb.provenance} · confiance {Math.round(kb.confidence * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DiagnosticPage({ project }: { project: ProjectFull }) {
  const d = project.payload.diagnostic;
  const detail = d.interpretation.detailed_analysis;
  return (
    <section className="report-page">
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Diagnostic complet</h2>

      <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
        Résumé global
      </h3>
      <p style={{ fontSize: 13, color: "#1e293b", marginBottom: 22, lineHeight: 1.7 }}>
        {detail.summary || "Synthèse à compléter — données insuffisantes pour générer un résumé global."}
      </p>

      <h3 style={{ fontSize: 14, color: "#16a34a", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        ✓ Points forts détaillés
      </h3>
      {detail.strengths.length === 0 ? (
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>
          Aucun point fort clairement consolidé — continuer à mesurer pour faire émerger des leviers.
        </p>
      ) : (
        <div style={{ marginBottom: 22 }}>
          {detail.strengths.map((s, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#16a34a", marginBottom: 2 }}>
                {s.title}
              </div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{s.description}</div>
            </div>
          ))}
        </div>
      )}

      <h3 style={{ fontSize: 14, color: "#d97706", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
        ⚠ Points de vigilance détaillés
      </h3>
      {detail.weaknesses.length === 0 ? (
        <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun point de vigilance majeur identifié.</p>
      ) : (
        detail.weaknesses.map((w, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#d97706", marginBottom: 2 }}>{w.title}</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>{w.description}</div>
          </div>
        ))
      )}
    </section>
  );
}

function ActionPlanPage({ project }: { project: ProjectFull }) {
  const detail = project.payload.diagnostic.interpretation.detailed_analysis;
  return (
    <section className="report-page">
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Plan d'action recommandé</h2>

      <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
        Recommandations actionnables
      </h3>

      {detail.recommendations.length === 0 ? (
        <div className="reli-warning">
          Les données collectées ne permettent pas de formuler des recommandations précises.
          Compléter les angles morts identifiés pour affiner le diagnostic.
        </div>
      ) : (
        detail.recommendations.map((r, i) => {
          const meta = priorityMeta(r.priority);
          return (
            <div
              key={i}
              style={{
                border: `1px solid ${meta.color}33`,
                borderLeft: `4px solid ${meta.color}`,
                borderRadius: 6,
                padding: 14,
                marginBottom: 12,
                background: "#fbfdff",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: "uppercase", marginBottom: 6 }}>
                ● {meta.label}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#1e293b" }}>
                {r.title}
              </div>
              <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                <div>
                  <strong>Pourquoi :</strong> {r.action || "—"}
                </div>
                <div>
                  <strong>Comment :</strong> {r.action || "Définir les modalités opérationnelles."}
                </div>
                <div>
                  <strong>Quand :</strong> Lors de la prochaine action similaire.
                </div>
                <div>
                  <strong>Qui :</strong> Direction Communication, en lien avec les sponsors métiers.
                </div>
              </div>
            </div>
          );
        })
      )}

      <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 22, marginBottom: 12 }}>
        Angles morts à combler
      </h3>
      {detail.data_gaps.length === 0 ? (
        <p style={{ fontSize: 12, color: "#94a3b8" }}>Aucun angle mort majeur détecté à ce stade.</p>
      ) : (
        detail.data_gaps.map((g, i) => (
          <div key={i} style={{ marginBottom: 10, fontSize: 12, color: "#475569" }}>
            <div style={{ fontWeight: 700, color: "#1e293b" }}>• {g.field}</div>
            <div>
              <strong>Issue :</strong> {g.issue}
            </div>
            <div>
              <strong>Impact :</strong> {g.impact}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

function HistoryPage({
  projectName,
  trends,
}: {
  projectName: string;
  trends: TrendsResponse | null;
}) {
  const unlocked = !!trends?.unlocked;
  return (
    <section className="report-page">
      <h2 style={{ fontSize: 22, marginBottom: 16 }}>Perspective historique</h2>

      {!unlocked ? (
        <div className="reli-warning">
          La perspective historique sera disponible à partir de 3 projets analysés sur le même
          type d'action dans Momentum. Actuellement : {trends?.sample_size ?? 0} projet(s)
          enregistré(s) sur ce type.
        </div>
      ) : (
        <>
          <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Comparaison historique
          </h3>
          <p style={{ fontSize: 12, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
            Cette action vs vos {trends!.sample_size} actions similaires précédentes.
          </p>

          <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                <th style={thStyle}>Projet</th>
                <th style={thStyle}>Date</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Score global</th>
              </tr>
            </thead>
            <tbody>
              {trends!.points.map((p) => (
                <tr key={p.project_id} style={{ background: p.name === projectName ? "#fef3c7" : "transparent" }}>
                  <td style={tdStyle}>
                    {p.name}
                    {p.name === projectName && <span style={{ color: "#d97706", marginLeft: 6 }}>← cette action</span>}
                  </td>
                  <td style={tdStyle}>{formatDateFR(p.created_at)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 700, color: scoreColor(p.overall_score ?? 0) }}>
                    {p.overall_score !== null ? Math.round(p.overall_score) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Tendance globale
          </h3>
          <MiniTrend points={trends!.points.map((p) => p.overall_score ?? 0)} />

          <h3 style={{ fontSize: 14, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 22, marginBottom: 10 }}>
            Recommandation stratégique long terme
          </h3>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#1e293b", lineHeight: 1.7 }}>
            {trends!.interpretations.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function MiniTrend({ points }: { points: number[] }) {
  if (points.length === 0) return null;
  const W = 600;
  const H = 100;
  const PAD = 12;
  const xOf = (i: number) =>
    points.length === 1 ? W / 2 : PAD + (i * (W - 2 * PAD)) / (points.length - 1);
  const yOf = (v: number) => H - PAD - (v / 100) * (H - 2 * PAD);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 100 }}>
      <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} stroke="#cbd5e1" />
      <polyline
        points={points.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ")}
        fill="none"
        stroke="#4d5fff"
        strokeWidth={2}
      />
      {points.map((v, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3} fill="#4d5fff" />
      ))}
    </svg>
  );
}

/* ───────── styles utilitaires ───────── */

const thStyle: React.CSSProperties = {
  padding: "8px 10px",
  textAlign: "left",
  fontSize: 11,
  color: "#475569",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  borderBottom: "1px solid #e2e8f0",
};
const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f1f5f9",
  color: "#1e293b",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 6,
  background: "rgba(148,163,184,0.08)",
  border: "1px solid rgba(148,163,184,0.2)",
  color: "#e2e8f0",
  fontSize: 12,
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  borderRadius: 8,
  background: "#4d5fff",
  color: "#fff",
  border: "none",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  marginBottom: 8,
};

const ghostBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 16px",
  borderRadius: 8,
  background: "transparent",
  color: "#cbd5e1",
  border: "1px solid rgba(148,163,184,0.25)",
  fontSize: 12,
  cursor: "pointer",
  marginBottom: 8,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {children}
    </div>
  );
}
