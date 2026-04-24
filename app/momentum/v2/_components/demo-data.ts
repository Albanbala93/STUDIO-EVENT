/**
 * Données de démo — utilisées quand aucun projet n'est sauvegardé en
 * localStorage. Aligné sur le brief design ("Séminaire managers Q2 ·
 * 856 participants · 12 avril 2026", scores 78/61/43/70).
 */

import type { DiagnosticPayload } from "../../../../lib/momentum/types";

export const DEMO_HEADER = {
  title: "Diagnostic — Séminaire managers Q2",
  subtitle: "Événement interne · 856 participants · 12 avril 2026",
};

export const DEMO_DIAGNOSTIC: DiagnosticPayload = {
  score: {
    overall_score: 74,
    confidence_score: 58,
    measured_count: 6,
    estimated_count: 2,
    declared_count: 3,
    proxy_count: 0,
    missing_dimensions: [],
    dimension_scores: [
      {
        dimension: "reach",
        score: 78,
        confidence_score: 82,
        measured_count: 2,
        estimated_count: 0,
        declared_count: 0,
        proxy_count: 0,
        kpi_breakdown: [
          {
            kpi_id: "event.invitation_coverage_rate",
            value: 92,
            confidence: 0.9,
            contribution: 0.5,
            provenance: "measured",
          },
          {
            kpi_id: "event.attendance_rate",
            value: 78,
            confidence: 0.85,
            contribution: 0.5,
            provenance: "measured",
          },
        ],
      },
      {
        dimension: "engagement",
        score: 61,
        confidence_score: 65,
        measured_count: 1,
        estimated_count: 1,
        declared_count: 0,
        proxy_count: 0,
        kpi_breakdown: [
          {
            kpi_id: "event.session_participation_rate",
            value: 70,
            confidence: 0.8,
            contribution: 0.5,
            provenance: "measured",
          },
          {
            kpi_id: "event.networking_rate",
            value: 45,
            confidence: 0.5,
            contribution: 0.5,
            provenance: "estimated",
          },
        ],
      },
      {
        dimension: "appropriation",
        score: 43,
        confidence_score: 40,
        measured_count: 0,
        estimated_count: 0,
        declared_count: 3,
        proxy_count: 0,
        kpi_breakdown: [
          {
            kpi_id: "event.memorization_score",
            value: 42,
            confidence: 0.4,
            contribution: 0.5,
            provenance: "declared",
          },
        ],
      },
      {
        dimension: "impact",
        score: 70,
        confidence_score: 80,
        measured_count: 1,
        estimated_count: 1,
        declared_count: 0,
        proxy_count: 0,
        kpi_breakdown: [
          {
            kpi_id: "event.intent_to_act_score",
            value: 68,
            confidence: 0.75,
            contribution: 0.5,
            provenance: "declared",
          },
        ],
      },
    ],
  },
  interpretation: {
    executive_summary: {
      headline: "Performance solide avec un angle mort sur la compréhension",
      key_insight:
        "La mobilisation et l'impact sont au rendez-vous. La compréhension des messages clés reste en-dessous du seuil attendu — c'est le principal levier à activer pour sécuriser la transformation derrière l'événement.",
      top_strengths: [
        "Taux de participation de 78%, très au-dessus de la moyenne sectorielle",
        "Intention d'agir solide chez les managers (68/100)",
        "Couverture quasi intégrale de la population cible (92%)",
      ],
      top_priorities: [
        "Renforcer la pédagogie sur les messages clés",
        "Instrumenter la mémorisation à J+30",
        "Suivre l'activation réelle post-événement",
      ],
    },
    detailed_analysis: {
      summary:
        "Diagnostic globalement favorable, tiré par la mobilisation et l'impact perçu. Le volet compréhension mérite un plan d'action ciblé.",
      strengths: [
        {
          title: "Mobilisation",
          description:
            "Couverture et présence au-delà des attentes, audience largement engagée.",
        },
      ],
      weaknesses: [
        {
          title: "Compréhension des messages",
          description:
            "Score à 43/100, loin du seuil attendu pour un séminaire stratégique.",
        },
        {
          title: "Fiabilité des mesures",
          description:
            "Une part significative de signaux déclaratifs — à croiser avec une mesure observationnelle.",
        },
        {
          title: "Activation post-événement",
          description:
            "Intentions déclarées élevées mais pas encore suivies dans le temps.",
        },
      ],
      recommendations: [
        {
          title: "Lancer un quiz de mémorisation à J+30",
          action:
            "Court questionnaire (5 min) sur les messages clés pour objectiver la rétention et identifier les segments à ré-exposer.",
          priority: "haute",
        },
        {
          title: "Programmer 3 points d'activation opérationnels",
          action:
            "Séquencer 3 rituels post-événement (manager briefing, reporting mensuel, revue à 90 jours) pour ancrer les messages.",
          priority: "moyenne",
        },
        {
          title: "Structurer un panel de suivi qualitatif",
          action:
            "Cohorte de 20 managers interrogés à J+30 / J+90 pour mesurer l'appropriation réelle derrière le déclaratif.",
          priority: "moyenne",
        },
      ],
      data_gaps: [
        {
          field: "Compréhension des messages",
          issue:
            "Mesure uniquement déclarative, aucune observation objective collectée",
          impact:
            "Le score reflète un ressenti plutôt qu'un fait — à croiser avec une mesure directe.",
        },
        {
          field: "Activation post-événement",
          issue: "Aucun KPI renseigné à J+30 ou J+90",
          impact:
            "La dimension est un angle mort complet pour la phase d'ancrage.",
        },
      ],
    },
  },
};
