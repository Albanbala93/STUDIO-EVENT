/**
 * Moteur d'interprétation Momentum — version "cabinet de conseil".
 *
 * Produit des recommandations enrichies (why / action / when / impact) et
 * un outil actionnable (questionnaire, checklist, grille, template) pour
 * chaque recommandation retournée.
 *
 * Règles métier :
 *   • max 3 recommandations, triées par priorité
 *   • 3 typologies :
 *       A. improvement  → score faible, il faut agir
 *       B. measurement  → aucune donnée, il faut mesurer avant de décider
 *       C. methodology  → données peu fiables, il faut professionnaliser la mesure
 *   • chaque reco commence par un verbe d'action, reste spécifique et sans jargon
 */

import type {
  DataGapItem,
  Dimension,
  InsightItem,
  InterpretationPayload,
  RecommendationItem,
  RecommendationPriority,
  RecommendationTool,
  RecommendationType,
  ScoreResult,
} from "./types";

/* ═══════════════════════════════════════════════════════════════════
   LIBELLÉS MÉTIER
   ═══════════════════════════════════════════════════════════════════ */

const BUSINESS_LABELS: Record<Dimension, string> = {
  reach: "mobilisation",
  engagement: "implication",
  appropriation: "compréhension des messages",
  impact: "impact concret",
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const PRIORITY_FR: Record<RecommendationPriority, string> = {
  high: "haute",
  medium: "moyenne",
  low: "basse",
};

/* ═══════════════════════════════════════════════════════════════════
   FABRIQUE D'OUTILS PAR DIMENSION
   ═══════════════════════════════════════════════════════════════════ */

function buildTool(
  dim: Dimension,
  recoType: RecommendationType
): RecommendationTool {
  switch (dim) {
    case "reach":
      if (recoType === "measurement") {
        return {
          type: "checklist",
          name: "Checklist de couverture de l'audience",
          usage:
            "À dérouler en amont de la prochaine action pour garantir la traçabilité des envois et la mesure de la couverture réelle.",
          timing: ["Avant diffusion", "Pendant diffusion", "J+1"],
          questions: [
            "Quelle est la population cible précise (effectif, segments) ?",
            "Quel canal touche effectivement chaque segment ?",
            "Les listes de diffusion sont-elles à jour et dédupliquées ?",
            "Comment est tracée la délivrabilité (reçu, ouvert, lu) ?",
            "Quels segments sont structurellement sous-exposés ?",
          ],
          tips: [
            "Fixer un taux de couverture cible avant diffusion (par ex. 90%).",
            "Identifier les angles morts de diffusion dès la préparation, pas après.",
          ],
        };
      }
      return {
        type: "questionnaire",
        name: "Diagnostic flash de couverture",
        usage:
          "À envoyer à un échantillon représentatif pour comprendre pourquoi une partie de l'audience n'est pas touchée.",
        timing: ["Dans les 48h après diffusion"],
        questions: [
          "Avez-vous reçu la communication ?",
          "Par quel canal l'avez-vous vue en premier ?",
          "À quel moment ce canal est-il le plus visible pour vous ?",
          "Quels canaux préféreriez-vous pour ce type de message ?",
          "Qu'est-ce qui vous ferait ouvrir ce type de communication ?",
        ],
        tips: [
          "Croiser les réponses avec les taux d'ouverture pour isoler les segments à risque.",
          "Ne pas relancer les mêmes canaux — tester un canal complémentaire.",
        ],
      };

    case "engagement":
      if (recoType === "measurement") {
        return {
          type: "questionnaire",
          name: "Grille d'interaction à chaud",
          usage:
            "À distribuer immédiatement après l'action pour quantifier l'implication réelle, au-delà des simples présences.",
          timing: ["À la fin de l'action", "Dans les 24h"],
          questions: [
            "Avez-vous participé activement (question, vote, prise de parole) ?",
            "Avez-vous interagi avec d'autres participants ?",
            "Quel moment vous a le plus impliqué ?",
            "Qu'est-ce qui vous a freiné pour interagir davantage ?",
            "Évaluez votre niveau d'implication (1 à 5).",
          ],
          tips: [
            "Relier chaque réponse à un segment d'audience pour lire l'hétérogénéité.",
            "Compléter par une grille d'observation (questions posées, temps de parole).",
          ],
        };
      }
      return {
        type: "observation",
        name: "Grille d'observation d'implication",
        usage:
          "À remplir par un observateur interne ou un animateur pour mesurer l'implication au-delà du déclaratif.",
        timing: ["Pendant l'action", "Débrief à J+1"],
        questions: [
          "Combien de personnes ont pris la parole spontanément ?",
          "Quelle proportion de l'audience a participé aux votes / sondages ?",
          "Quels segments sont restés silencieux ?",
          "Quelles interactions informelles ont été observées (pauses, networking) ?",
          "Quels signaux faibles d'adhésion ou de résistance ?",
        ],
        tips: [
          "Croiser l'observation avec le questionnaire à chaud pour objectiver le ressenti.",
          "Noter systématiquement les segments qui décrochent.",
        ],
      };

    case "appropriation":
      if (recoType === "measurement") {
        return {
          type: "questionnaire",
          name: "Test de compréhension J+2 / J+7",
          usage:
            "À envoyer à court puis moyen terme pour mesurer ce qui est vraiment retenu et pas seulement ce qui est déclaré compris sur le moment.",
          timing: ["J+2 (compréhension immédiate)", "J+7 (rétention)"],
          questions: [
            "Quel est le message principal que vous retenez ?",
            "Quels points restent flous ou mal compris ?",
            "Avez-vous identifié les actions attendues de votre part ?",
            "Avez-vous relayé ce message à votre équipe ?",
            "Si vous deviez expliquer ce message à un collègue, que diriez-vous ?",
          ],
          tips: [
            "Comparer J+2 et J+7 pour mesurer la déperdition de mémorisation.",
            "Si la formulation libre est floue, retravailler le message-clé, pas la diffusion.",
          ],
        };
      }
      return {
        type: "questionnaire",
        name: "Audit de clarté du message",
        usage:
          "À mobiliser quand le message semble compris en surface mais mal réutilisé — pour savoir ce qu'il faut reformuler.",
        timing: ["J+5 après diffusion"],
        questions: [
          "Que signifie concrètement ce message pour votre activité ?",
          "Quels mots ou formulations vous ont paru ambigus ?",
          "Quelle information vous manque encore pour agir ?",
          "Quel exemple concret illustrerait le mieux ce message ?",
          "À qui devriez-vous en reparler pour bien l'appliquer ?",
        ],
        tips: [
          "Reformuler à partir des réponses terrain — pas à partir du brief initial.",
          "Activer un relais managérial pour traduire le message en langage métier.",
        ],
      };

    case "impact":
      if (recoType === "measurement") {
        return {
          type: "questionnaire",
          name: "Questionnaire post-action (impact concret)",
          usage:
            "À envoyer 2 à 4 semaines après l'action pour mesurer les changements réels de comportement et d'alignement.",
          timing: ["J+14", "J+30"],
          questions: [
            "Avez-vous modifié un comportement professionnel suite à cette action ?",
            "Avez-vous appliqué concrètement un élément communiqué ?",
            "Quels effets concrets observez-vous dans votre quotidien ?",
            "Qu'est-ce qui vous empêche de passer à l'action ?",
            "Recommanderiez-vous cette initiative à un collègue ?",
          ],
          tips: [
            "Croiser les déclarations avec un signal objectif (usage, adoption outil, complétion).",
            "Si peu d'action concrète, l'enjeu n'est pas le message mais le passage à l'acte.",
          ],
        };
      }
      return {
        type: "observation",
        name: "Grille manager de passage à l'acte",
        usage:
          "À déployer auprès des managers pour mesurer l'adoption terrain et identifier les freins opérationnels.",
        timing: ["J+30 après l'action"],
        questions: [
          "Quels changements concrets observez-vous dans votre équipe ?",
          "Quels collaborateurs ont adopté les nouveaux comportements attendus ?",
          "Quels freins structurels rencontrez-vous (outils, process, temps) ?",
          "Qu'est-ce qui vous aiderait à ancrer durablement ce changement ?",
          "De quoi auriez-vous besoin pour relayer plus efficacement ?",
        ],
        tips: [
          "Associer systématiquement les managers à la mesure d'impact.",
          "Séparer ce qui relève du message de ce qui relève des conditions d'exécution.",
        ],
      };
  }
}

/* ═══════════════════════════════════════════════════════════════════
   FABRIQUE DE RECOMMANDATIONS
   ═══════════════════════════════════════════════════════════════════ */

type RawDim = {
  dimension: Dimension;
  score: number;
  confidence: number;
  hasSignal: boolean;
};

function computePriority(
  type: RecommendationType,
  score: number,
  confidence: number
): RecommendationPriority {
  if (type === "measurement") return "high";
  if (type === "improvement") {
    if (score < 40) return "high";
    if (score < 55) return "medium";
    return "low";
  }
  // methodology
  if (confidence < 35) return "high";
  if (confidence < 55) return "medium";
  return "low";
}

function buildImprovementReco(dim: RawDim): RecommendationItem {
  const label = BUSINESS_LABELS[dim.dimension];
  const priority = computePriority("improvement", dim.score, dim.confidence);
  const tool = buildTool(dim.dimension, "improvement");

  const ACTIONS: Record<Dimension, string> = {
    reach:
      "Rouvrir le plan de diffusion pour identifier les segments sous-exposés et rééquilibrer la couverture sur les canaux utilisés au quotidien par l'audience cible.",
    engagement:
      "Introduire des formats plus interactifs (votes, questions ouvertes, formats courts) et confier à un animateur la charge de faire émerger la parole des silencieux.",
    appropriation:
      "Reformuler le message-clé en langage métier et activer un relais managérial capable de traduire les implications concrètes pour chaque équipe.",
    impact:
      "Structurer un suivi post-action articulé avec la ligne managériale pour transformer les intentions déclarées en actes concrets.",
  };

  const WHY: Record<Dimension, string> = {
    reach: `La couverture réelle reste en retrait (${Math.round(
      dim.score
    )}/100) : une partie de la population cible n'est pas touchée par le dispositif actuel.`,
    engagement: `Le niveau d'implication observé (${Math.round(
      dim.score
    )}/100) indique une audience présente mais passive — ce qui fragilise la qualité du résultat final.`,
    appropriation: `La compréhension des messages reste insuffisante (${Math.round(
      dim.score
    )}/100) : les participants retiennent mal le sens et les implications concrètes.`,
    impact: `Les effets concrets observés sont limités (${Math.round(
      dim.score
    )}/100) : l'initiative a été reçue, mais ne se traduit pas en changement dans la durée.`,
  };

  const IMPACT_STATEMENT: Record<Dimension, string> = {
    reach:
      "Viser +15 à +20 points de couverture réelle sur les segments aujourd'hui sous-exposés dans un horizon d'un trimestre.",
    engagement:
      "Passer d'une audience en écoute à une audience qui interagit, avec un taux d'interaction mesurable doublé sur la prochaine édition.",
    appropriation:
      "Faire passer la capacité à restituer le message-clé au-dessus de 70/100 sous 30 jours, via une reformulation testée terrain.",
    impact:
      "Transformer les déclarations d'intention en actes concrets — au moins un tiers des participants ayant engagé une action mesurable à J+30.",
  };

  const WHEN: Record<Dimension, string> = {
    reach: "Avant la prochaine vague de diffusion.",
    engagement: "Lors de la prochaine action à format équivalent.",
    appropriation: "Dans les 2 semaines suivant l'action en cours.",
    impact: "Dès la prochaine initiative majeure, avec jalons à J+14 et J+30.",
  };

  return {
    title: `Réactiver la ${label}`,
    action: ACTIONS[dim.dimension],
    priority,
    dimension: dim.dimension,
    reco_type: "improvement",
    why: WHY[dim.dimension],
    when: WHEN[dim.dimension],
    impact: IMPACT_STATEMENT[dim.dimension],
    tool,
  };
}

function buildMeasurementReco(dim: Dimension): RecommendationItem {
  const label = BUSINESS_LABELS[dim];
  const tool = buildTool(dim, "measurement");
  const priority = computePriority("measurement", 0, 0);

  const ACTIONS: Record<Dimension, string> = {
    reach:
      "Mettre en place dès la prochaine action un dispositif de mesure de la couverture (listes cible, traçabilité des envois, taux de délivrabilité) pour sortir de l'angle mort.",
    engagement:
      "Mesurer l'implication réelle des participants dès la prochaine action à l'aide d'un questionnaire à chaud et d'indicateurs d'interaction simples.",
    appropriation:
      "Déployer un test de compréhension court à J+2 et J+7 pour mesurer ce qui est vraiment retenu, au-delà du ressenti immédiat.",
    impact:
      "Instaurer un suivi post-action à 2 et 4 semaines, associant managers et participants, pour objectiver le passage à l'acte.",
  };

  const WHY: Record<Dimension, string> = {
    reach:
      "Aucune donnée exploitable sur la mobilisation : impossible de dire aujourd'hui si le message a touché l'audience cible.",
    engagement:
      "L'implication n'est pas mesurée : le dispositif actuel ne permet pas de distinguer une audience engagée d'une audience présente par obligation.",
    appropriation:
      "La compréhension des messages n'est pas testée : on ne sait pas si ce qui est émis correspond à ce qui est compris.",
    impact:
      "Aucun signal sur l'impact réel : l'initiative est pilotée sans visibilité sur les changements qu'elle produit.",
  };

  const IMPACT_STATEMENT: Record<Dimension, string> = {
    reach:
      "Disposer d'un taux de couverture fiable sur la prochaine vague, permettant de prioriser les investissements de diffusion.",
    engagement:
      "Obtenir un premier repère chiffré d'implication, comparable d'une édition à l'autre.",
    appropriation:
      "Identifier les zones de flou du message et les corriger avant qu'elles ne deviennent des écarts stratégiques.",
    impact:
      "Relier pour la première fois la communication à des changements observables — condition d'un ROI démontrable.",
  };

  return {
    title: `Instrumenter la ${label}`,
    action: ACTIONS[dim],
    priority,
    dimension: dim,
    reco_type: "measurement",
    why: WHY[dim],
    when: "Avant ou pendant la prochaine action de communication.",
    impact: IMPACT_STATEMENT[dim],
    tool,
  };
}

function buildMethodologyReco(dim: RawDim): RecommendationItem {
  const label = BUSINESS_LABELS[dim.dimension];
  const tool = buildTool(dim.dimension, "methodology");
  const priority = computePriority("methodology", dim.score, dim.confidence);

  return {
    title: `Fiabiliser la mesure de la ${label}`,
    action: `Renforcer la qualité des données collectées sur la ${label} (taille d'échantillon, croisement déclaratif / observation, automatisation de la collecte) afin que les décisions prises à partir de cette dimension soient robustes.`,
    priority,
    dimension: dim.dimension,
    reco_type: "methodology",
    why: `Le score de ${label} repose sur une base de données peu fiable (confiance ${Math.round(
      dim.confidence
    )}/100) : la lecture est indicative mais ne permet pas d'arbitrer.`,
    when: "Dans les 30 jours, en préparation de la prochaine mesure.",
    impact:
      "Passer d'une mesure indicative à une mesure décisionnelle, avec un niveau de confiance supérieur à 70/100.",
    tool,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   ORCHESTRATION
   ═══════════════════════════════════════════════════════════════════ */

const PRIORITY_RANK: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
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
  return `Votre principal point de vigilance est la ${weakestLabel} (${Math.round(
    weakestScore
  )}/100).`;
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
      ? `Priorité immédiate : ${recommendations[0].title.toLowerCase()}.`
      : "Priorité immédiate : compléter les données manquantes pour fiabiliser le pilotage.";

  return [scoreSentence, strongSentence, actionSentence].join(" ");
}

export function interpretScore(result: ScoreResult): InterpretationPayload {
  const globalScore = result.overall_score;

  const rawDims: RawDim[] = result.dimension_scores.map((ds) => ({
    dimension: ds.dimension,
    score: ds.score,
    confidence: ds.confidence_score,
    hasSignal:
      ds.measured_count +
        ds.estimated_count +
        ds.declared_count +
        ds.proxy_count >
      0,
  }));

  const present = rawDims.filter((d) => d.hasSignal);
  const missingDims = new Set<Dimension>(result.missing_dimensions);

  /* ─── Forces / faiblesses pour le résumé ─────────────────────── */

  const strengths: InsightItem[] = [];
  const weaknesses: InsightItem[] = [];

  for (const d of [...present].sort((a, b) => b.score - a.score)) {
    const label = BUSINESS_LABELS[d.dimension];
    const capped = cap(label);

    if (d.score >= 70) {
      strengths.push({
        title: `${capped} solide`,
        description: `Le niveau de ${label} est élevé (${Math.round(d.score)}/100).`,
      });
    } else if (d.score < 55) {
      weaknesses.push({
        title: `${capped} à renforcer`,
        description: `Le niveau de ${label} reste insuffisant (${Math.round(
          d.score
        )}/100) pour garantir des résultats durables.`,
      });
    }
  }

  /* ─── Data gaps ───────────────────────────────────────────────── */

  const dataGaps: DataGapItem[] = [];
  for (const d of present) {
    if (d.score <= 0) {
      dataGaps.push({
        field: BUSINESS_LABELS[d.dimension],
        issue: "Mesure absente ou non exploitable",
        impact: "La décision est moins fiable sur cette dimension.",
      });
    }
  }
  for (const dim of missingDims) {
    const label = BUSINESS_LABELS[dim];
    if (!dataGaps.find((g) => g.field === label)) {
      dataGaps.push({
        field: label,
        issue: "Aucun KPI renseigné sur cette dimension",
        impact: "La dimension est un angle mort complet du diagnostic.",
      });
    }
  }

  /* ─── Candidates ──────────────────────────────────────────────── */

  const candidates: RecommendationItem[] = [];

  // A. Angles morts → measurement
  for (const dim of missingDims) {
    candidates.push(buildMeasurementReco(dim));
  }
  // B. Scores faibles → improvement
  for (const d of present) {
    if (d.score < 55) candidates.push(buildImprovementReco(d));
  }
  // C. Confiance faible → methodology
  for (const d of present) {
    if (d.score >= 55 && d.confidence < 55) {
      candidates.push(buildMethodologyReco(d));
    }
  }

  /* ─── Déduplication par dimension + tri ──────────────────────── */

  const byDim = new Map<string, RecommendationItem>();
  for (const reco of candidates) {
    const key = (reco.dimension ?? reco.title) as string;
    const existing = byDim.get(key);
    if (!existing) {
      byDim.set(key, reco);
      continue;
    }
    const pa = PRIORITY_RANK[existing.priority as RecommendationPriority] ?? 99;
    const pb = PRIORITY_RANK[reco.priority as RecommendationPriority] ?? 99;
    if (pb < pa) byDim.set(key, reco);
  }

  const sorted = Array.from(byDim.values()).sort((a, b) => {
    const pa = PRIORITY_RANK[a.priority as RecommendationPriority] ?? 99;
    const pb = PRIORITY_RANK[b.priority as RecommendationPriority] ?? 99;
    return pa - pb;
  });

  const topRecommendations = sorted.slice(0, 3);

  // Normalisation FR pour compat UI existante
  const recommendationsFR = topRecommendations.map((r) => {
    const p = r.priority as RecommendationPriority;
    return {
      ...r,
      priority: PRIORITY_FR[p] ?? (r.priority as string),
    };
  });

  const topStrengths = strengths.slice(0, 3);
  const topWeaknesses = weaknesses.slice(0, 3);
  const topDataGaps = dataGaps.slice(0, 3);

  const summary = executiveSummaryText(
    globalScore,
    topStrengths,
    recommendationsFR
  );

  return {
    executive_summary: {
      headline: headlineFromScore(globalScore),
      key_insight: keyInsight(
        present
          .slice()
          .sort((a, b) => a.score - b.score)
          .map((d) => [d.dimension, d.score] as [Dimension, number]),
        topDataGaps.length > 0
      ),
      top_strengths: topStrengths.map((s) => s.title),
      top_priorities: recommendationsFR.map((r) => r.title),
    },
    detailed_analysis: {
      summary,
      strengths: topStrengths,
      weaknesses: topWeaknesses,
      recommendations: recommendationsFR,
      data_gaps: topDataGaps,
    },
  };
}
