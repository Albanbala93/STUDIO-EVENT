"use client";

/**
 * Vue d'un projet Momentum sauvegardé — lecture seule.
 * Charge le projet depuis localStorage via getProject(id) et réutilise
 * le composant ResultDashboard en mode readOnly. Backfill RSE pour les
 * projets créés avant l'introduction du volet ESG.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileX } from "lucide-react";

import { getProject, deleteProject } from "../../../../lib/momentum/storage";
import { KPI_PLAN } from "../../../../lib/momentum/kpi-catalog";
import { CONFIDENCE_MAP, type MomentumProject } from "../../../../lib/momentum/types";
import { interpretRse } from "../../../../lib/momentum/rse";
import type { DimensionSignal } from "../../../../lib/momentum/scoring";
import { buttonVariants } from "../../../../components/ui/button";
import { ResultDashboard } from "../../diagnostic/dashboard";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const [project, setProject] = useState<MomentumProject | null | "loading">(
    "loading",
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
      <div className="hi-fi-result-fallback">
        <div className="hi-fi-result-fallback-card hi-fi-result-fallback-loading">
          <span className="hi-fi-result-fallback-spinner" aria-hidden="true" />
          <p className="hi-fi-result-fallback-text">
            Chargement du diagnostic…
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="hi-fi-result-fallback">
        <div className="hi-fi-result-fallback-card">
          <div className="hi-fi-result-fallback-icon">
            <FileX className="h-5 w-5" />
          </div>
          <h1 className="hi-fi-result-fallback-title">
            Projet introuvable
          </h1>
          <p className="hi-fi-result-fallback-desc">
            Ce projet n&apos;existe pas ou a été supprimé de ce navigateur.
          </p>
          <Link
            href="/momentum"
            className={buttonVariants({ variant: "primary", size: "md" })}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à Pilot
          </Link>
        </div>
      </div>
    );
  }

  const kpis =
    project.payload.id.initiativeType &&
    KPI_PLAN[project.payload.id.initiativeType]
      ? KPI_PLAN[project.payload.id.initiativeType]
      : [];

  // Backfill : les projets sauvegardés avant l'introduction du volet RSE
  // n'ont pas de champ `rse`. On le recalcule à la volée.
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
          window.confirm("Supprimer ce projet Pilot ?")
        ) {
          deleteProject(project.id);
          router.push("/momentum");
        }
      }}
    />
  );
}
