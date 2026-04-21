export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export const INITIATIVE_LABELS: Record<string, string> = {
  corporate_event: "Événement corporate",
  digital_campaign: "Campagne digitale",
  change_management: "Accompagnement du changement",
  newsletter: "Newsletter interne",
  product_launch: "Lancement produit",
  other: "Autre initiative",
};

export type CampaignSummary = {
  id: string;
  name: string;
  initiative_type: string | null;
  audience: string | null;
  intent: string | null;
  launch_date: string | null;
  status: "planned" | "measuring" | "measured";
  momentum_project_id: string | null;
  created_at: string;
};

export type CampaignFull = CampaignSummary & {
  brief: string | null;
  audience_size: number | null;
  channels: string[];
};

export type Memory = {
  available: boolean;
  sample_size: number;
  minimum_required: number;
  last_updated: string;
  profil_communication: {
    score_moyen: number | null;
    point_fort: string | null;
    point_faible: string | null;
    tendance: string;
  };
  insights: { kind: string; title: string; body: string; recommendation: string; sample_size: number }[];
};

export const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  planned: { label: "Planifiée", color: "#a78bfa", icon: "📋" },
  measuring: { label: "Mesure en cours", color: "#fbbf24", icon: "⏳" },
  measured: { label: "Mesurée", color: "#22c55e", icon: "✓" },
};

export function formatDateFR(iso: string | null): string {
  if (!iso) return "—";
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
