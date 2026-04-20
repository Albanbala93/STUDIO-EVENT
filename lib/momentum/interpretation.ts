/**
 * Moteur d'interprétation Momentum — port TypeScript de
 * momentum/apps/api/services/insights/insight_engine.py.
 *
 * Transforme un ScoreResult en restitution métier (executive + detailed).
 */

import type {
  DataGapItem,
  Dimension,
  InsightItem,
  InterpretationPayload,
  RecommendationItem,
  ScoreResult,
} from "./types";

const BUSINESS_LABELS: Record<Dimension, string> = {
  reach: "mobilisation",
  engagement: "implication",
  appropriation: "compréhension des messages",
  impact: "impact concret",
};

function headlineFromScore(globalScore: number): string {
  if (globalScore >= 75) return "Performance globale solide";
  if (globalScore >= 55)
    return "Performance globale correcte, avec des leviers à activer";
  return "Performance globale fragile";
}

function keyInsight(
  orderedAsc: [Dimension, number][],
  hasDataGaps: boolean
): string {
  if (orderedAsc.length === 0) {
    return "La priorité est de fiabiliser les données pour piloter les prochaines actions.";
  }
  const [weakestDim, weakestScore] = orderedAsc[0];
  const weakestLabel = BUSINESS_LABELS[weakestDim];

  if (hasDataGaps) {
    return `Votre principal angle mort concerne la ${weakestLabel} : la qualité de mesure doit être renforcée pour décider plus vite.`;
  }
  return `Votre principal point de vigilance est la ${weakestLabel} (${Math.round(weakestScore)}/100).`;
}

function executiveSummaryText(
  globalScore: number,
  strengths: InsightItem[],
  recommendations: RecommendationItem[]
): string {
  const scoreSentence = `Le diagnostic positionne la performance globale à ${Math.round(
    globalScore
  )}/100.`;

  const strongSentence =
    strengths.length > 0
      ? `Les points les plus solides sont ${strengths
          .slice(0, 2)
          .map((s) => s.title.toLowerCase())
          .join(", ")}.`
      : "Aucun point fort clairement consolidé n'est encore visible.";

  const actionSentence =
    recommendations.length > 0
      ? `Priorité immédiate : ${recommendations[0].title}.`
      : "Priorité immédiate : compléter les données manquantes pour fiabiliser le pilotage.";

  return [scoreSentence, strongSentence, actionSentence].join(" ");
}

function recommendationFor(dim: Dimension, score: number): RecommendationItem {
  const label = BUSINESS_LABELS[dim];
  let action: string;
  switch (dim) {
    case "reach":
      action =
        "Renforcer la couverture des publics cibles et clarifier le plan de diffusion.";
      break;
    case "engagement":
      action =
        "Introduire des formats plus interactifs pour augmenter la participation active.";
      break;
    case "appropriation":
      action =
        "Structurer un relais managérial pour améliorer la compréhension et la mémorisation des messages.";
      break;
    case "impact":
      action =
        "Mettre en place un suivi post-événement pour mesurer les changements concrets.";
      break;
  }
  return {
    title: `Accélérer la ${label}`,
    action,
    priority: score < 45 ? "haute" : "moyenne",
  };
}

export function interpretScore(result: ScoreResult): InterpretationPayload {
  const globalScore = result.overall_score;

  // On ne garde que les dimensions ayant reçu au moins un signal
  const present: [Dimension, number][] = result.dimension_scores
    .filter(
      (ds) =>
        ds.measured_count +
          ds.estimated_count +
          ds.declared_count +
          ds.proxy_count >
        0
    )
    .map((ds) => [ds.dimension, ds.score]);

  // Tri décroissant pour forces / faiblesses
  const orderedDesc = [...present].sort((a, b) => b[1] - a[1]);
  const orderedAsc = [...present].sort((a, b) => a[1] - b[1]);

  const strengths: InsightItem[] = [];
  const weaknesses: InsightItem[] = [];
  const dataGaps: DataGapItem[] = [];

  for (const [dim, score] of orderedDesc) {
    const label = BUSINESS_LABELS[dim];
    const cap = label.charAt(0).toUpperCase() + label.slice(1);

    if (score >= 70) {
      strengths.push({
        title: `${cap} solide`,
        description: `Le niveau de ${label} est élevé (${Math.round(score)}/100).`,
      });
    } else if (score < 55) {
      weaknesses.push({
        title: `${cap} à renforcer`,
        description: `Le niveau de ${label} reste insuffisant (${Math.round(
          score
        )}/100) pour garantir des résultats durables.`,
      });
    }

    if (score <= 0) {
      dataGaps.push({
        field: label,
        issue: "Mesure absente ou non exploitable",
        impact: "La décision est moins fiable sur cette dimension.",
      });
    }
  }

  // Dimensions totalement absentes → data gaps aussi
  for (const dim of result.missing_dimensions) {
    const label = BUSINESS_LABELS[dim];
    if (!dataGaps.find((g) => g.field === label)) {
      dataGaps.push({
        field: label,
        issue: "Aucun KPI renseigné sur cette dimension",
        impact: "La dimension est un angle mort complet du diagnostic.",
      });
    }
  }

  // Recommandations : les 3 dimensions les plus faibles (parmi les mesurées)
  const recommendations = orderedAsc
    .slice(0, 3)
    .map(([dim, score]) => recommendationFor(dim, score));

  const topStrengths = strengths.slice(0, 3);
  const topWeaknesses = weaknesses.slice(0, 3);
  const topRecommendations = recommendations.slice(0, 3);
  const topDataGaps = dataGaps.slice(0, 3);

  const summary = executiveSummaryText(globalScore, topStrengths, topRecommendations);

  return {
    executive_summary: {
      headline: headlineFromScore(globalScore),
      key_insight: keyInsight(orderedAsc, topDataGaps.length > 0),
      top_strengths: topStrengths.map((s) => s.title),
      top_priorities: topRecommendations.map((r) => r.title),
    },
    detailed_analysis: {
      summary,
      strengths: topStrengths,
      weaknesses: topWeaknesses,
      recommendations: topRecommendations,
      data_gaps: topDataGaps,
    },
  };
}
