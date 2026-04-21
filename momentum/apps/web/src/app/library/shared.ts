/**
 * Types & helpers partagés par les 4 pages du module 4 (bibliothèque stratégique).
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export type ProjectSummary = {
  id: string;
  name: string;
  initiative_type: string | null;
  audience: string | null;
  intent: string | null;
  overall_score: number | null;
  confidence_score: number | null;
  created_at: string;
  status: string;
};

export const INITIATIVE_LABELS: Record<string, string> = {
  corporate_event: "Événement corporate",
  digital_campaign: "Campagne digitale",
  change_management: "Accompagnement du changement",
  newsletter: "Newsletter interne",
  product_launch: "Lancement produit",
  other: "Autre initiative",
};

export const DIMENSION_KEYS = ["reach", "engagement", "appropriation", "impact"] as const;
export type DimensionKey = (typeof DIMENSION_KEYS)[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  reach: "Mobilisation",
  engagement: "Implication",
  appropriation: "Compréhension",
  impact: "Impact",
};

export const DIMENSION_COLORS: Record<DimensionKey, string> = {
  reach: "#4d5fff",
  engagement: "#22c55e",
  appropriation: "#fbbf24",
  impact: "#f97316",
};

export function scoreColor(s: number | null): string {
  if (s === null || s === undefined) return "#94a3b8";
  if (s >= 80) return "#22c55e";
  if (s >= 65) return "#84cc16";
  if (s >= 40) return "#fbbf24";
  return "#ef4444";
}

export function reliabilityLabel(conf: number | null): string {
  if (conf === null || conf === undefined) return "—";
  if (conf >= 0.75) return "Haute";
  if (conf >= 0.5) return "Moyenne";
  return "Faible";
}

export function reliabilityDot(conf: number | null): string {
  if (conf === null || conf === undefined) return "⚪";
  if (conf >= 0.75) return "🟢";
  if (conf >= 0.5) return "🟡";
  return "🔴";
}

export function formatDateFR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
