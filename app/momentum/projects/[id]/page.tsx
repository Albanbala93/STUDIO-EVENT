"use client";

/**
 * Vue d'un projet Momentum sauvegardé — lecture seule.
 * Charge le projet depuis localStorage via getProject(id) et réutilise
 * le composant ResultDashboard en mode readOnly.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { getProject, deleteProject } from "../../../../lib/momentum/storage";
import { KPI_PLAN } from "../../../../lib/momentum/kpi-catalog";
import { CONFIDENCE_MAP, type MomentumProject } from "../../../../lib/momentum/types";
import { interpretRse } from "../../../../lib/momentum/rse";
import type { DimensionSignal } from "../../../../lib/momentum/scoring";
import { ResultDashboard } from "../../diagnostic/dashboard";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [project, setProject] = useState<MomentumProject | null | "loading">(
    "loading"
  );

  useEffect(() => {
    if (!id) {
      setProject(null);
      return;
    }
    setProject(getProject(id));
  }, [id]);

  if (project === "loading") {
    return (
      <div style={fallbackStyles.page}>
        <div style={fallbackStyles.card}>Chargement…</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={fallbackStyles.page}>
        <div style={fallbackStyles.card}>
          <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>Projet introuvable</h1>
          <p style={{ color: "#94a3b8", marginBottom: 16 }}>
            Ce projet n&apos;existe pas ou a été supprimé de ce navigateur.
          </p>
          <Link href="/momentum" style={fallbackStyles.link}>
            ← Retour à Momentum
          </Link>
        </div>
      </div>
    );
  }

  const kpis =
    project.payload.id.initiativeType && KPI_PLAN[project.payload.id.initiativeType]
      ? KPI_PLAN[project.payload.id.initiativeType]
      : [];

  // Backfill : les projets sauvegardés avant l'introduction du volet RSE
  // n'ont pas de champ `rse`. On le recalcule à la volée depuis les
  // réponses KPI pour que le bloc reste toujours visible en lecture.
  const diagnostic = project.payload.diagnostic;
  const diagnosticWithRse = diagnostic.rse
    ? diagnostic
    : (() => {
        const signals: DimensionSignal[] = Object.values(project.payload.answers)
          .filter((a) => typeof a.value === "number" && !Number.isNaN(a.value))
          .map((a) => {
            const kpi = kpis.find((k) => k.kpiId === a.kpiId);
            return {
              kpi_id: a.kpiId,
              dimension: kpi?.dimension ?? "impact",
              value: Math.max(0, Math.min(100, a.value)),
              provenance: a.provenance,
              confidence: CONFIDENCE_MAP[a.confidenceLabel],
            };
          });
        return { ...diagnostic, rse: interpretRse(signals) };
      })();

  return (
    <ResultDashboard
      diagnostic={diagnosticWithRse}
      id={project.payload.id}
      answers={project.payload.answers}
      kpis={kpis}
      readOnly
      savedAt={project.createdAt}
      projectId={project.id}
      fromCampaignId={project.fromCampaignId}
      onReset={() => {
        if (
          typeof window !== "undefined" &&
          window.confirm("Supprimer ce projet Momentum ?")
        ) {
          deleteProject(project.id);
          router.push("/momentum");
        }
      }}
    />
  );
}

const fallbackStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
    color: "#e2e8f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  card: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: 32,
    maxWidth: 480,
    textAlign: "center",
  },
  link: { color: "#60a5fa", textDecoration: "none" },
};
