/**
 * Moteur d'interprétation RSE (ESG) Momentum — port TypeScript de
 * momentum/apps/api/services/insights/insight_engine.py (section RSE).
 *
 * Additif : ne touche pas à `scoreMomentum` ni `interpretScore`, il vient
 * simplement compléter le payload du diagnostic avec un volet Environment /
 * Social / Governance.
 *
 * Règles V1 explicables :
 *   • 1 recommandation max par pilier faible ou non mesuré, plafonné à 3
 *   • gaps business ("Vous ne mesurez pas…" / "Vous ne pouvez pas…")
 *   • outils statiques (questionnaire, baromètre, grille) prêts à l'emploi
 */

import type { DimensionSignal } from "./scoring";
import type {
  RSEDimension,
  RSEGap,
  RSEInterpretation,
  RSERecommendation,
  RSESummary,
  RSETool,
} from "./types";

/* ═══════════════════════════════════════════════════════════════════
   MAPPING KPI → PILIER ESG
   ═══════════════════════════════════════════════════════════════════ */

const RSE_KPI_DIMENSION: Record<string, RSEDimension> = {
  // Environment
  "csr.estimated_carbon_footprint": "environment",
  "csr.carbon_per_participant": "environment",
  "csr.transport_emission_share": "environment",
  "csr.waste_reduction_score": "environment",
  "csr.sobriety_score": "environment",
  // Social
  "csr.participant_coverage_rate": "social",
  "csr.rse_message_visibility_rate": "social",
  "csr.engagement_rate": "social",
  "csr.accessibility_score": "social",
  "csr.inclusion_perception_score": "social",
  // Governance
  "csr.local_supplier_rate": "governance",
  "csr.responsible_supplier_rate": "governance",
  "csr.rse_coherence_score": "governance",
};

const RSE_DIMENSION_LABEL_FR: Record<RSEDimension, string> = {
  environment: "environnementale",
  social: "sociale",
  governance: "de gouvernance",
};

// KPI dont la valeur brute est "plus c'est haut, plus c'est mauvais".
// Convention V1 : les autres KPI sont déjà normalisés 0-100 "plus c'est haut,
// mieux c'est". Pour ceux-ci on inverse (100 - value).
const RSE_INVERTED_KPIS = new Set<string>(["csr.transport_emission_share"]);

const RSE_WEAK_THRESHOLD = 60.0;

/* ═══════════════════════════════════════════════════════════════════
   ÉLISION FRANÇAISE
   ═══════════════════════════════════════════════════════════════════ */

function fixFrenchElision(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bla ([aeiouyhàâäéèêëîïôöùûüAEIOUYH])/g, "l'$1")
    .replace(/\bLa ([aeiouyhàâäéèêëîïôöùûüAEIOUYH])/g, "L'$1")
    .replace(/\bde la ([aeiouyhàâäéèêëîïôöùûüAEIOUYH])/g, "de l'$1")
    .replace(/\bDe la ([aeiouyhàâäéèêëîïôöùûüAEIOUYH])/g, "De l'$1")
    .replace(/\bà la ([aeiouyhàâäéèêëîïôöùûüAEIOUYH])/g, "à l'$1")
    .replace(/\bÀ la ([aeiouyhàâäéèêëîïôöùûüAEIOUYH])/g, "À l'$1")
    .replace(/\bde ([aeiouyàâäéèêëîïôöùûü])/g, "d'$1")
    .replace(/\bDe ([aeiouyàâäéèêëîïôöùûü])/g, "D'$1");
}

function deepFixElision<T>(value: T): T {
  if (typeof value === "string") {
    return fixFrenchElision(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepFixElision(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepFixElision(v);
    }
    return out as unknown as T;
  }
  return value;
}

/* ═══════════════════════════════════════════════════════════════════
   OUTILS STATIQUES
   ═══════════════════════════════════════════════════════════════════ */

export function getEnvironmentTool(): RSETool {
  return {
    name: "Diagnostic empreinte événementielle",
    usage:
      "Questionnaire court à administrer aux participants pour reconstituer l'empreinte environnementale d'une opération sur ses trois postes majeurs : déplacements, restauration et déchets.",
    timing:
      "À envoyer en sortie d'événement (J+0 à J+2) pour limiter les biais de rappel ; relance ciblée à J+5 pour sécuriser le taux de réponse.",
    questions: [
      "Quel mode de transport avez-vous utilisé pour venir (voiture, train, avion, mobilité douce) ?",
      "Quelle distance avez-vous parcourue, aller simple, pour rejoindre l'événement ?",
      "Quel type de repas avez-vous consommé sur place (carné, végétarien, végétalien) ?",
      "Les contenants, la vaisselle et les supports étaient-ils réutilisables ou recyclables ?",
      "Avez-vous emporté des goodies ou supports physiques à l'issue de l'événement ?",
    ],
    tips: [
      "Intégrer la question du transport dès l'inscription afin de disposer d'une donnée fiable sans dépendre du rappel à posteriori.",
      "Croiser les réponses par site de rattachement pour identifier les axes de progrès les plus contributeurs à l'empreinte globale.",
      "Appliquer les facteurs d'émission ADEME de l'année en cours pour garantir la cohérence avec le bilan carbone de l'entreprise.",
    ],
  };
}

export function getSocialTool(): RSETool {
  return {
    name: "Baromètre perception RSE & inclusion",
    usage:
      "Sondage bref auprès des participants pour mesurer la compréhension des engagements RSE présentés, leur utilité perçue et la qualité de l'inclusion ressentie durant l'opération.",
    timing:
      "À diffuser à J+1 par email ou QR code en sortie de session, avec une fenêtre de réponse ouverte sur 7 jours.",
    questions: [
      "Avez-vous compris les engagements RSE présentés durant l'événement ?",
      "Quels messages RSE retenez-vous spontanément ?",
      "Ces engagements vous semblent-ils utiles pour votre quotidien professionnel ?",
      "L'événement vous a-t-il semblé accessible à l'ensemble des publics concernés ?",
      "Vous êtes-vous senti pleinement inclus et représenté durant l'opération ?",
    ],
    tips: [
      "Maintenir le questionnaire sous deux minutes pour préserver un taux de réponse représentatif.",
      "Segmenter les résultats par population cible (métier, ancienneté, site) afin de détecter des angles morts d'inclusion.",
    ],
  };
}

export function getGovernanceTool(): RSETool {
  return {
    name: "Grille de pilotage des objectifs RSE",
    usage:
      "Auto-audit interne permettant de vérifier que chaque opération est rattachée à des objectifs RSE formalisés, chiffrés et effectivement suivis dans la durée.",
    timing:
      "À compléter en amont de chaque opération, puis revue systématique à J+30 pour consolider les résultats et les écarts.",
    questions: [
      "Des objectifs RSE ont-ils été définis formellement avant l'opération ?",
      "Ces objectifs sont-ils chiffrés, datés et assortis d'indicateurs mesurables ?",
      "Les résultats obtenus ont-ils été effectivement mesurés et consolidés ?",
      "Les résultats sont-ils suivis dans le temps et partagés avec les parties prenantes internes ?",
      "Les écarts constatés donnent-ils lieu à un plan d'action documenté et assumé ?",
    ],
    tips: [
      "Rattacher les objectifs RSE à la trajectoire CSRD de l'entreprise pour éviter les mesures orphelines.",
      "Archiver les résultats dans un espace commun et traçable afin de sécuriser l'auditabilité d'une opération à l'autre.",
    ],
  };
}

const TOOL_BUILDERS: Record<RSEDimension, () => RSETool> = {
  environment: getEnvironmentTool,
  social: getSocialTool,
  governance: getGovernanceTool,
};

/* ═══════════════════════════════════════════════════════════════════
   BUCKETING & FIABILITÉ
   ═══════════════════════════════════════════════════════════════════ */

type PillarStats = { score: number; avgConfidence: number; count: number };

function bucketScore(signals: DimensionSignal[]): PillarStats {
  if (signals.length === 0) {
    return { score: 0, avgConfidence: 0, count: 0 };
  }

  const pairs: Array<[number, number]> = signals.map((s) => {
    let val = s.value;
    if (s.kpi_id && RSE_INVERTED_KPIS.has(s.kpi_id)) {
      val = Math.max(0, 100 - val);
    }
    return [val, s.confidence];
  });

  const totalWeight = pairs.reduce((acc, [, c]) => acc + (c > 0 ? c : 0), 0);
  let score: number;
  if (totalWeight > 0) {
    score = pairs.reduce((acc, [v, c]) => acc + v * c, 0) / totalWeight;
  } else {
    score = pairs.reduce((acc, [v]) => acc + v, 0) / pairs.length;
  }

  const avgConf =
    pairs.reduce((acc, [, c]) => acc + c, 0) / pairs.length;

  return {
    score: Math.round(score * 100) / 100,
    avgConfidence: Math.round(avgConf * 1000) / 1000,
    count: pairs.length,
  };
}

function reliabilityFor(
  totalSignals: number,
  missingPillars: number,
  avgConfidence: number
): RSESummary["reliability"] {
  if (totalSignals === 0 || missingPillars === 3) return "low";
  if (totalSignals < 3 || missingPillars >= 2) return "low";
  if (totalSignals < 6 || missingPillars === 1 || avgConfidence < 0.5) return "partial";
  return "high";
}

/* ═══════════════════════════════════════════════════════════════════
   RECOMMANDATIONS
   ═══════════════════════════════════════════════════════════════════ */

function buildRecommendation(
  dimension: RSEDimension,
  score: number,
  hasData: boolean
): RSERecommendation | null {
  if (hasData && score >= RSE_WEAK_THRESHOLD) return null;

  let priority: RSERecommendation["priority"];
  let when: string;
  if (!hasData) {
    priority = "haute";
    when = "À lancer immédiatement, sur la prochaine opération.";
  } else if (score < 45) {
    priority = "haute";
    when = "À engager dans les 30 jours sur les opérations en cours.";
  } else {
    priority = "moyenne";
    when = "À structurer dans le trimestre, sur l'ensemble des opérations.";
  }

  const tool = TOOL_BUILDERS[dimension]();

  let title: string;
  let why: string;
  let action: string;
  let impact: string;

  if (dimension === "environment") {
    if (!hasData) {
      title = "Mesurer l'empreinte environnementale de vos opérations";
      why =
        "Vous ne disposez aujourd'hui d'aucune donnée sur les déplacements, la restauration et les déchets générés par vos actions.";
      action =
        "Déployer le diagnostic d'empreinte événementielle sur la prochaine opération pour collecter une première série de données fiables sur ces trois postes.";
      impact =
        "Vous posez le socle factuel qui vous permettra d'identifier les postes les plus contributeurs et d'engager un plan de réduction chiffré.";
    } else {
      title = "Réduire l'empreinte environnementale de vos opérations";
      why =
        "Les signaux disponibles sur les déplacements, la restauration et les déchets sont trop faibles pour soutenir une démarche crédible de réduction auprès de vos parties prenantes.";
      action =
        "Identifier les deux postes les plus contributeurs à l'empreinte de vos opérations et fixer un objectif de réduction chiffré à 12 mois, porté par un référent nommé.";
      impact =
        "Vous transformez un signal faible en trajectoire pilotée et vous sécurisez votre capacité à défendre le volet environnemental en comex comme en reporting extra-financier.";
    }
  } else if (dimension === "social") {
    if (!hasData) {
      title = "Mesurer la perception et l'inclusion des participants";
      why =
        "Vous ne disposez d'aucun signal sur l'accessibilité de vos opérations, la compréhension des engagements RSE par les participants ni leur perception globale de l'action.";
      action =
        "Déployer le baromètre de perception RSE et d'inclusion à l'issue de la prochaine opération pour constituer une première baseline exploitable.";
      impact =
        "Vous objectivez la dimension sociale, vous prévenez les angles morts d'exclusion et vous vous dotez d'une base de comparaison d'une opération à l'autre.";
    } else {
      title = "Renforcer l'inclusion et la compréhension RSE";
      why =
        "Les résultats sur la compréhension des engagements RSE, l'accessibilité ou la perception d'inclusion sont en-dessous du seuil attendu pour une opération structurée.";
      action =
        "Prioriser la sous-dimension la plus faible, nommer un référent et ajuster le format (accessibilité, représentativité, pédagogie des engagements) sur la prochaine opération.";
      impact =
        "Vous réduisez le risque réputationnel interne et vous améliorez la valeur perçue de vos engagements RSE auprès des collaborateurs.";
    }
  } else {
    if (!hasData) {
      title = "Formaliser des objectifs RSE mesurables et tracés";
      why =
        "Vous ne disposez pas aujourd'hui d'objectifs RSE formalisés, ni d'un dispositif structuré de suivi et de traçabilité sur vos opérations.";
      action =
        "Utiliser la grille de pilotage pour définir, en amont de chaque opération, 3 à 5 objectifs RSE chiffrés avec un référent nommé et un point de suivi à J+30.";
      impact =
        "Vous sécurisez la traçabilité attendue en audit CSRD et vous transformez vos engagements RSE en trajectoire opposable.";
    } else {
      title = "Consolider le pilotage des objectifs RSE";
      why =
        "Des objectifs RSE existent mais leur suivi et leur traçabilité restent partiels, ce qui fragilise leur valeur en audit comme en communication externe.";
      action =
        "Systématiser la revue à J+30, archiver les résultats dans un espace commun et documenter les écarts avec un plan d'action daté.";
      impact =
        "Vous transformez un pilotage fragile en dispositif auditable et vous ancrez la démarche RSE dans la discipline de gestion de l'entreprise.";
    }
  }

  return { title, priority, dimension, why, action, when, impact, tool };
}

/* ═══════════════════════════════════════════════════════════════════
   GAPS
   ═══════════════════════════════════════════════════════════════════ */

const RSE_MISSING_MESSAGES: Record<RSEDimension, { message: string; impact: string }> = {
  environment: {
    message:
      "Vous ne mesurez pas actuellement l'impact environnemental de vos opérations (déplacements, restauration, déchets).",
    impact:
      "Vous ne pouvez pas piloter ni améliorer vos pratiques, et vous restez exposé à un risque de greenwashing en l'absence de données factuelles.",
  },
  social: {
    message:
      "Vous ne mesurez pas actuellement la perception RSE, la compréhension des engagements ni l'inclusion ressentie par vos participants.",
    impact:
      "Vous ne pouvez pas objectiver la qualité sociale de vos opérations ni prévenir les angles morts d'exclusion avant qu'ils ne deviennent un enjeu réputationnel.",
  },
  governance: {
    message:
      "Vous ne disposez pas aujourd'hui d'objectifs RSE formalisés ni d'un suivi structuré de leur atteinte.",
    impact:
      "Vous ne pouvez pas démontrer la réalité de vos engagements en audit ou en reporting extra-financier, et vous perdez la capacité de piloter leur progression dans le temps.",
  },
};

function gapMissing(dimension: RSEDimension): RSEGap {
  const { message, impact } = RSE_MISSING_MESSAGES[dimension];
  return { dimension, message, impact };
}

function gapFragile(dimension: RSEDimension, count: number, avgConf: number): RSEGap {
  const label = RSE_DIMENSION_LABEL_FR[dimension];
  let issue: string;
  if (count === 1) {
    issue = "la mesure ne repose que sur un seul indicateur";
  } else if (avgConf < 0.5) {
    issue = `la fiabilité des mesures collectées reste faible (${Math.round(avgConf * 100)} %)`;
  } else {
    issue = `la mesure reste partielle (${count} indicateurs seulement)`;
  }
  return {
    dimension,
    message: `Mesure ${label} encore fragile — ${issue}.`,
    impact: `Le score ${label} existe mais repose sur une base trop étroite pour servir de socle de décision ou de communication externe.`,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   SUMMARY COPY
   ═══════════════════════════════════════════════════════════════════ */

function headlineFor(overall: number, reliability: RSESummary["reliability"]): string {
  if (reliability === "low") return "Diagnostic RSE non concluant — données insuffisantes";
  if (overall >= 70) return "Performance RSE solide";
  if (overall >= 50) return "Performance RSE en construction";
  return "Performance RSE fragile";
}

function keyInsightFor(
  pillarScores: Partial<Record<RSEDimension, number>>,
  missing: RSEDimension[],
  reliability: RSESummary["reliability"]
): string {
  if (reliability === "low") {
    if (missing.length > 0) {
      const label = RSE_DIMENSION_LABEL_FR[missing[0]];
      return `Priorité : amorcer la mesure ${label} pour sortir de l'angle mort et construire une base de pilotage crédible.`;
    }
    return "Priorité : élargir la collecte RSE pour sécuriser la fiabilité du diagnostic avant d'engager toute décision stratégique.";
  }

  const entries = Object.entries(pillarScores) as Array<[RSEDimension, number]>;
  if (entries.length === 0) {
    return "Aucun pilier RSE mesuré — le diagnostic reste à amorcer.";
  }
  const [weakestDim, weakestScore] = entries.reduce((acc, cur) =>
    cur[1] < acc[1] ? cur : acc
  );
  const label = RSE_DIMENSION_LABEL_FR[weakestDim];
  return `Le principal levier RSE à activer est la dimension ${label} (${Math.round(weakestScore)}/100).`;
}

/* ═══════════════════════════════════════════════════════════════════
   ORCHESTRATEUR
   ═══════════════════════════════════════════════════════════════════ */

export function interpretRse(signals: DimensionSignal[] | null | undefined): RSEInterpretation {
  const byPillar: Record<RSEDimension, DimensionSignal[]> = {
    environment: [],
    social: [],
    governance: [],
  };

  for (const sig of signals ?? []) {
    if (!sig || !sig.kpi_id) continue;
    const dim = RSE_KPI_DIMENSION[sig.kpi_id];
    if (!dim) continue;
    byPillar[dim].push(sig);
  }

  const stats: Record<RSEDimension, PillarStats> = {
    environment: bucketScore(byPillar.environment),
    social: bucketScore(byPillar.social),
    governance: bucketScore(byPillar.governance),
  };

  const presentEntries = (Object.entries(stats) as Array<[RSEDimension, PillarStats]>).filter(
    ([, s]) => s.count > 0
  );
  const missingPillars = (Object.entries(stats) as Array<[RSEDimension, PillarStats]>)
    .filter(([, s]) => s.count === 0)
    .map(([d]) => d);

  const overall =
    presentEntries.length > 0
      ? Math.round(
          (presentEntries.reduce((acc, [, s]) => acc + s.score, 0) / presentEntries.length) * 100
        ) / 100
      : 0;

  const totalSignals = presentEntries.reduce((acc, [, s]) => acc + s.count, 0);
  const avgConfidence =
    totalSignals > 0
      ? presentEntries.reduce((acc, [, s]) => acc + s.avgConfidence * s.count, 0) / totalSignals
      : 0;

  const reliability = reliabilityFor(totalSignals, missingPillars.length, avgConfidence);

  const gaps: RSEGap[] = [];
  for (const dim of missingPillars) gaps.push(gapMissing(dim));
  for (const [dim, s] of presentEntries) {
    if (s.count === 1 || s.avgConfidence < 0.5) {
      gaps.push(gapFragile(dim, s.count, s.avgConfidence));
    }
  }

  const recommendations: RSERecommendation[] = [];
  for (const dim of ["environment", "social", "governance"] as RSEDimension[]) {
    const hasData = stats[dim].count > 0;
    const score = hasData ? stats[dim].score : 0;
    const reco = buildRecommendation(dim, score, hasData);
    if (reco) recommendations.push(reco);
  }
  const priorityRank: Record<RSERecommendation["priority"], number> = {
    haute: 0,
    moyenne: 1,
    basse: 2,
  };
  recommendations.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const topRecommendations = recommendations.slice(0, 3);

  const pillarScoresOnly: Partial<Record<RSEDimension, number>> = {};
  for (const [dim, s] of presentEntries) pillarScoresOnly[dim] = s.score;

  const summary: RSESummary = {
    headline: headlineFor(overall, reliability),
    key_insight: keyInsightFor(pillarScoresOnly, missingPillars, reliability),
    environment_score: stats.environment.score,
    social_score: stats.social.score,
    governance_score: stats.governance.score,
    overall_rse_score: overall,
    reliability,
  };

  const interpretation: RSEInterpretation = {
    summary,
    recommendations: topRecommendations,
    gaps,
  };

  return deepFixElision(interpretation);
}
