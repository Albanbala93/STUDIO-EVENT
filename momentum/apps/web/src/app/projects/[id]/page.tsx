"use client";

/**
 * Vue en lecture seule d'un projet sauvegardé.
 *
 * Recharge la sortie intégrale du diagnostic (state id + answers + diagnostic)
 * depuis l'API (`GET /projects/:id`) et ré-affiche le ResultDashboard
 * avec les actions de sauvegarde / édition masquées.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { ResultDashboard } from "../../diagnostic/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type SavedProject = {
  id: string;
  name: string;
  initiative_type: string | null;
  audience: string | null;
  intent: string | null;
  created_at: string;
  payload: {
    id: {
      name: string;
      initiativeType: string;
      audienceType: string;
      audienceSize: number;
      intent: string;
    };
    answers: Record<string, unknown>;
    diagnostic: {
      score: {
        overall_score: number;
        confidence_score: number;
        dimension_scores: unknown[];
        measured_count: number;
        estimated_count: number;
        declared_count: number;
        proxy_count: number;
        missing_dimensions: string[];
      };
      interpretation: {
        executive_summary: unknown;
        detailed_analysis: unknown;
      };
    };
  };
};

export default function SavedProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<SavedProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const endpoint = API_BASE_URL
      ? `${API_BASE_URL}/projects/${params.id}`
      : `/api/projects/${params.id}`;
    fetch(endpoint)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? "Projet introuvable" : `API ${r.status}`);
        return r.json();
      })
      .then(setProject)
      .catch(e => setError(e.message));
  }, [params.id]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at top, rgba(77,95,255,0.08), transparent 50%), #0a0d1a",
        color: "#e2e8f0",
        fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        padding: 24,
        paddingBottom: 80,
      }}
    >
      <div style={{ maxWidth: 1160, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Link
            href="/"
            style={{
              fontSize: 13, color: "#94a3b8", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}
          >
            ← Accueil
          </Link>
          <span style={{ color: "#334155" }}>·</span>
          <span style={{ fontSize: 13, color: "#64748b" }}>Projet sauvegardé</span>
        </div>

        {error && (
          <div style={{
            padding: 20, borderRadius: 12,
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#fca5a5",
          }}>
            {error}
          </div>
        )}

        {!project && !error && (
          <div style={{ color: "#64748b", fontSize: 14, padding: 20 }}>
            Chargement du projet…
          </div>
        )}

        {project && (
          <ResultDashboard
            diagnostic={project.payload.diagnostic as never}
            apiError={null}
            id={project.payload.id as never}
            answers={project.payload.answers as never}
            kpis={[]}
            onReset={() => router.push("/diagnostic")}
            readOnly
            savedAt={project.created_at}
            projectId={project.id}
          />
        )}
      </div>
    </div>
  );
}
