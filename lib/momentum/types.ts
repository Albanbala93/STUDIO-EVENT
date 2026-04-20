/**
 * Types partagés du module Momentum.
 * Portés depuis momentum/apps/web/src/app/diagnostic/dashboard.tsx et
 * momentum/apps/api/services/scoring/advanced_engine.py.
 */

export type Provenance = "measured" | "declared" | "estimated" | "proxy";
export type Dimension = "reach" | "engagement" | "appropriation" | "impact";
export type ConfidenceLabel = "high" | "medium" | "low";
export type InitiativeType =
  | "corporate_event"
  | "digital_campaign"
  | "change_management"
  | "newsletter"
  | "product_launch"
  | "other";

export type IdentificationData = {
  name: string;
  initiativeType: InitiativeType | "";
  audienceType: string;
  audienceSize: number;
  intent: string;
};

export type KPIAnswer = {
  kpiId: string;
  value: number;
  provenance: Provenance;
  confidenceLabel: ConfidenceLabel;
  note?: string;
};

export type KPIQuestion = {
  kpiId: string;
  dimension: Dimension;
  label: string;
  helper: string;
  unitHint: string;
  defaultProvenance: Provenance;
  min?: number;
  max?: number;
};

export type InsightItem = { title: string; description: string };
export type RecommendationItem = {
  title: string;
  action: string;
  priority: string;
};
export type DataGapItem = { field: string; issue: string; impact: string };

export type InterpretationPayload = {
  executive_summary: {
    headline: string;
    key_insight: string;
    top_strengths: string[];
    top_priorities: string[];
  };
  detailed_analysis: {
    summary: string;
    strengths: InsightItem[];
    weaknesses: InsightItem[];
    recommendations: RecommendationItem[];
    data_gaps: DataGapItem[];
  };
};

export type KPIBreakdown = {
  kpi_id: string | null;
  value: number;
  confidence: number;
  contribution: number;
  provenance: Provenance;
};

export type DimensionScoreData = {
  dimension: Dimension;
  score: number;
  confidence_score: number;
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  kpi_breakdown: KPIBreakdown[];
};

export type ScoreResult = {
  overall_score: number;
  confidence_score: number;
  dimension_scores: DimensionScoreData[];
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  missing_dimensions: Dimension[];
};

export type DiagnosticPayload = {
  score: ScoreResult;
  interpretation: InterpretationPayload;
};

/** Projet Momentum sauvegardé en localStorage. */
export type MomentumProject = {
  id: string;
  name: string;
  initiativeType: InitiativeType | "";
  audience: string | null;
  intent: string | null;
  overallScore: number;
  confidenceScore: number;
  createdAt: string;
  /** Lien optionnel vers un projet Campaign Studio d'origine. */
  fromCampaignId?: string;
  payload: {
    id: IdentificationData;
    answers: Record<string, KPIAnswer>;
    diagnostic: DiagnosticPayload;
  };
};

export const CONFIDENCE_MAP: Record<ConfidenceLabel, number> = {
  high: 0.9,
  medium: 0.65,
  low: 0.35,
};

export const INITIATIVE_LABELS: Record<InitiativeType, string> = {
  corporate_event: "Événement corporate",
  digital_campaign: "Campagne digitale",
  change_management: "Accompagnement du changement",
  newsletter: "Newsletter interne",
  product_launch: "Lancement produit",
  other: "Autre initiative",
};

export const DIMENSION_LABELS: Record<Dimension, string> = {
  reach: "Mobilisation",
  engagement: "Implication",
  appropriation: "Compréhension des messages",
  impact: "Impact",
};
