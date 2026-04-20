"use client";

/**
 * Landing Momentum — liste des diagnostics sauvegardés + CTA nouveau diagnostic.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { listProjects, deleteProject } from "../../lib/momentum/storage";
import { INITIATIVE_LABELS, type MomentumProject } from "../../lib/momentum/types";

export default function MomentumLanding() {
  const [projects, setProjects] = useState<MomentumProject[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProjects(listProjects());
    setHydrated(true);
  }, []);

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Supprimer le diagnostic "${name}" ?`)) return;
    deleteProject(id);
    setProjects(listProjects());
  }

  const avgScore =
    projects.length > 0
      ? Math.round(
          projects.reduce((s, p) => s + p.overallScore, 0) / projects.length
        )
      : null;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <Link href="/" style={styles.backLink}>
            ← Campaign Studio
          </Link>
          <h1 style={styles.title}>Momentum</h1>
          <p style={styles.subtitle}>
            Mesurez la performance réelle de vos initiatives de communication interne
            sur 4 dimensions : mobilisation, implication, compréhension, impact.
          </p>
        </header>

        <div style={styles.ctaRow}>
          <Link href="/momentum/diagnostic" style={styles.btnPrimary}>
            + Nouveau diagnostic
          </Link>
          {avgScore !== null && (
            <div style={styles.memoryBadge}>
              <span style={styles.memoryLabel}>Score moyen</span>
              <span style={styles.memoryValue}>{avgScore}/100</span>
              <span style={styles.memorySub}>
                sur {projects.length} diagnostic{projects.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        <section>
          <h2 style={styles.sectionTitle}>Vos diagnostics</h2>
          {!hydrated ? (
            <div style={styles.empty}>Chargement…</div>
          ) : projects.length === 0 ? (
            <div style={styles.empty}>
              Aucun diagnostic pour le moment. Démarrez-en un pour mesurer votre
              prochaine initiative.
            </div>
          ) : (
            <ul style={styles.list}>
              {projects.map((p) => (
                <li key={p.id} style={styles.card}>
                  <Link
                    href={`/momentum/projects/${p.id}`}
                    style={styles.cardLink}
                  >
                    <div style={styles.cardHeader}>
                      <div>
                        <div style={styles.cardName}>{p.name}</div>
                        <div style={styles.cardMeta}>
                          {p.initiativeType
                            ? INITIATIVE_LABELS[p.initiativeType]
                            : "Initiative"}
                          {p.audience ? ` · ${p.audience}` : ""}
                        </div>
                      </div>
                      <div
                        style={{
                          ...styles.scorePill,
                          background: scoreBg(p.overallScore),
                        }}
                      >
                        {Math.round(p.overallScore)}
                      </div>
                    </div>
                    <div style={styles.cardFooter}>
                      <span>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                      {p.fromCampaignId && (
                        <span style={styles.tag}>↔ Campaign Studio</span>
                      )}
                    </div>
                  </Link>
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(p.id, p.name)}
                    aria-label="Supprimer"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function scoreBg(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 50) return "#ca8a04";
  return "#dc2626";
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    padding: "40px 20px",
  },
  container: { maxWidth: 900, margin: "0 auto" },
  header: { marginBottom: 32 },
  backLink: { color: "#94a3b8", textDecoration: "none", fontSize: 14 },
  title: { fontSize: 36, margin: "12px 0 8px", fontWeight: 700 },
  subtitle: {
    color: "#94a3b8",
    fontSize: 15,
    lineHeight: 1.6,
    maxWidth: 640,
  },
  ctaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    marginBottom: 32,
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "12px 24px",
    background: "#3b82f6",
    color: "#fff",
    borderRadius: 8,
    textDecoration: "none",
    fontWeight: 600,
    fontSize: 15,
  },
  memoryBadge: {
    padding: "10px 16px",
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 2,
  },
  memoryLabel: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase" as const },
  memoryValue: { fontSize: 20, fontWeight: 700, color: "#f1f5f9" },
  memorySub: { fontSize: 11, color: "#64748b" },
  sectionTitle: { fontSize: 18, margin: "0 0 16px", color: "#cbd5e1" },
  empty: {
    padding: 40,
    background: "#1e293b",
    border: "1px dashed #334155",
    borderRadius: 12,
    color: "#94a3b8",
    textAlign: "center",
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    position: "relative",
  },
  cardLink: {
    display: "block",
    padding: 20,
    textDecoration: "none",
    color: "inherit",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  cardName: { fontSize: 16, fontWeight: 600, color: "#f1f5f9" },
  cardMeta: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
  scorePill: {
    minWidth: 48,
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    textAlign: "center",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 12,
    fontSize: 12,
    color: "#64748b",
  },
  tag: {
    padding: "2px 8px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 4,
    color: "#60a5fa",
  },
  deleteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 6,
    background: "transparent",
    border: "1px solid #334155",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: 1,
  },
};
