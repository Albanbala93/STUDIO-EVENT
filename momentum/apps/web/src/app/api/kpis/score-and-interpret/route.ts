/**
 * Port TypeScript de l'endpoint FastAPI `POST /kpis/score-and-interpret`.
 *
 * Logique portée depuis :
 *   - apps/api/services/scoring/advanced_engine.py   (score_momentum)
 *   - apps/api/services/insights/insight_engine.py    (interpret_score)
 *
 * Contrat d'E/S identique au backend Python, afin que le front (diagnostic)
 * puisse consommer indifféremment les deux implémentations sans modification.
 *
 * Déployable sur Vercel sans infrastructure Python additionnelle.
 */

import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════════
   TYPES (miroirs des modèles Pydantic)
   ═══════════════════════════════════════════════════════════════════ */

type Provenance = "measured" | "estimated" | "declared" | "proxy";
type ScoringDimension = "reach" | "engagement" | "appropriation" | "impact";

type DimensionSignal = {
  dimension: ScoringDimension;
  value: number;          // 0-100
  provenance: Provenance;
  confidence: number;     // 0-1
  method?: string | null;
  kpi_id?: string | null;
};

type KPIContribution = {
  kpi_id: string | null;
  value: number;
  confidence: number;
  contribution: number;
  provenance: Provenance;
};

type DimensionScore = {
  dimension: ScoringDimension;
  score: number;
  confidence_score: number;   // 0-100 (moyenne des confidences × 100)
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  kpi_breakdown: KPIContribution[];
};

type AdvancedScoreResult = {
  overall_score: number;
  confidence_score: number;
  dimension_scores: DimensionScore[];
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  missing_dimensions: ScoringDimension[];
};

type InsightItem = { title: string; description: string };
type RecommendationItem = { title: string; action: string; priority: "haute" | "moyenne" | "basse" };
type DataGapItem = { field: string; issue: string; impact: string };

type ExecutiveSummary = {
  headline: string;
  key_insight: string;
  top_strengths: string[];
  top_priorities: string[];
};

type ScoreInterpretation = {
  summary: string;
  strengths: InsightItem[];
  weaknesses: InsightItem[];
  recommendations: RecommendationItem[];
  data_gaps: DataGapItem[];
};

type InterpretationResponse = {
  executive_summary: ExecutiveSummary;
  detailed_analysis: ScoreInterpretation;
};

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTES
   ═══════════════════════════════════════════════════════════════════ */

const DEFAULT_DIMENSION_WEIGHTS: Record<ScoringDimension, number> = {
  reach: 0.25,
  engagement: 0.25,
  appropriation: 0.25,
  impact: 0.25,
};

/** Lexique métier (anglais technique → français lisible par le COMEX). */
const BUSINESS_LABELS: Record<ScoringDimension, string> = {
  reach: "mobilisation",
  engagement: "implication",
  appropriation: "compréhension des messages",
  impact: "impact concret",
};

/** Retourne "l'" pour les mots commençant par une voyelle (ou h muet), "la " sinon.
 *  Évite les fautes du type « la implication » / « la impact concret ». */
function frArticle(word: string): "l'" | "la " {
  if (!word) return "la ";
  const first = word.trim().charAt(0).toLowerCase();
  return "aeiouyhàâäéèêëîïôöùûü".includes(first) ? "l'" : "la ";
}

/** Préfixe un verbe avec l'article correctement contracté : "Accélérer l'implication". */
function frPrefix(verbWithSpace: string, word: string): string {
  return `${verbWithSpace}${frArticle(word)}${word}`;
}

const ALL_DIMENSIONS: ScoringDimension[] = ["reach", "engagement", "appropriation", "impact"];

/* ═══════════════════════════════════════════════════════════════════
   SCORING (port de advanced_engine.py)
   ═══════════════════════════════════════════════════════════════════ */

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Calcule le score pondéré d'une dimension à partir de ses signaux. */
function computeWeightedDimensionScore(signals: DimensionSignal[]): Omit<DimensionScore, "dimension"> {
  if (signals.length === 0) {
    return {
      score: 0,
      confidence_score: 0,
      measured_count: 0,
      estimated_count: 0,
      declared_count: 0,
      proxy_count: 0,
      kpi_breakdown: [],
    };
  }

  const measured_count = signals.filter(s => s.provenance === "measured").length;
  const estimated_count = signals.filter(s => s.provenance === "estimated").length;
  const declared_count = signals.filter(s => s.provenance === "declared").length;
  const proxy_count = signals.filter(s => s.provenance === "proxy").length;

  const total_weight = signals
    .filter(s => s.confidence > 0)
    .reduce((acc, s) => acc + s.confidence, 0);

  let raw_score: number;
  let breakdown: KPIContribution[];

  if (total_weight > 0) {
    raw_score =
      signals.reduce((acc, s) => acc + s.value * s.confidence, 0) / total_weight;
    breakdown = signals.map(s => ({
      kpi_id: s.kpi_id ?? null,
      value: s.value,
      confidence: s.confidence,
      contribution: round4((s.value * s.confidence) / total_weight),
      provenance: s.provenance,
    }));
  } else {
    raw_score = signals.reduce((acc, s) => acc + s.value, 0) / signals.length;
    breakdown = signals.map(s => ({
      kpi_id: s.kpi_id ?? null,
      value: s.value,
      confidence: s.confidence,
      contribution: 0,
      provenance: s.provenance,
    }));
  }

  const confidence_score = round2(
    (signals.reduce((acc, s) => acc + s.confidence, 0) / signals.length) * 100,
  );

  return {
    score: round2(raw_score),
    confidence_score,
    measured_count,
    estimated_count,
    declared_count,
    proxy_count,
    kpi_breakdown: breakdown,
  };
}

function scoreDimension(dimension: ScoringDimension, signals: DimensionSignal[]): DimensionScore {
  const dimSignals = signals.filter(s => s.dimension === dimension);
  if (dimSignals.length === 0) {
    return {
      dimension,
      score: 0,
      confidence_score: 0,
      measured_count: 0,
      estimated_count: 0,
      declared_count: 0,
      proxy_count: 0,
      kpi_breakdown: [],
    };
  }
  const w = computeWeightedDimensionScore(dimSignals);
  return { dimension, ...w };
}

/** Réplique exacte de `score_momentum` côté Python. */
function scoreMomentum(
  signals: DimensionSignal[],
  weights: Record<ScoringDimension, number> = DEFAULT_DIMENSION_WEIGHTS,
): AdvancedScoreResult {
  const dimension_scores = ALL_DIMENSIONS.map(d => scoreDimension(d, signals));

  const hasData = (s: DimensionScore) =>
    s.measured_count + s.estimated_count + s.declared_count + s.proxy_count > 0;

  const present_scores = dimension_scores.filter(hasData);
  const missing_dimensions = dimension_scores.filter(s => !hasData(s)).map(s => s.dimension);

  const measured_count = dimension_scores.reduce((a, s) => a + s.measured_count, 0);
  const estimated_count = dimension_scores.reduce((a, s) => a + s.estimated_count, 0);
  const declared_count = dimension_scores.reduce((a, s) => a + s.declared_count, 0);
  const proxy_count = dimension_scores.reduce((a, s) => a + s.proxy_count, 0);

  if (present_scores.length === 0) {
    return {
      overall_score: 0,
      confidence_score: 0,
      dimension_scores,
      measured_count: 0,
      estimated_count: 0,
      declared_count: 0,
      proxy_count: 0,
      missing_dimensions,
    };
  }

  const weight_total = present_scores.reduce((a, s) => a + weights[s.dimension], 0);
  const overall_score = round2(
    present_scores.reduce((a, s) => a + s.score * weights[s.dimension], 0) / weight_total,
  );
  const confidence_score = round2(
    present_scores.reduce((a, s) => a + s.confidence_score * weights[s.dimension], 0) / weight_total,
  );

  return {
    overall_score,
    confidence_score,
    dimension_scores,
    measured_count,
    estimated_count,
    declared_count,
    proxy_count,
    missing_dimensions,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   INTERPRETATION (port de insight_engine.py)
   ═══════════════════════════════════════════════════════════════════ */

function topN<T>(items: T[], n = 3): T[] {
  return items.slice(0, n);
}

function headlineFromScore(score: number): string {
  if (score >= 75) return "Performance globale solide";
  if (score >= 55) return "Performance globale correcte, avec des leviers à activer";
  return "Performance globale fragile";
}

function keyInsight(ordered: Array<[ScoringDimension, number]>, hasDataGaps: boolean): string {
  if (ordered.length === 0) {
    return "La priorité est de fiabiliser les données pour piloter les prochaines actions.";
  }
  const [weakestDim, weakestScore] = ordered[ordered.length - 1];
  const label = BUSINESS_LABELS[weakestDim] ?? weakestDim;
  const art = frArticle(label);
  if (hasDataGaps) {
    return `Votre principal angle mort concerne ${art}${label} : la qualité de mesure doit être renforcée pour décider plus vite.`;
  }
  return `Votre principal point de vigilance est ${art}${label} (${Math.round(weakestScore)}/100).`;
}

function executiveSummaryText(
  globalScore: number,
  strengths: InsightItem[],
  recommendations: RecommendationItem[],
): string {
  const scoreSentence = `Le diagnostic positionne la performance globale à ${Math.round(globalScore)}/100.`;

  const strongSentence =
    strengths.length > 0
      ? `Les points les plus solides sont ${topN(strengths, 2)
          .map(s => s.title.toLowerCase())
          .join(", ")}.`
      : "Aucun point fort clairement consolidé n'est encore visible.";

  const actionSentence =
    recommendations.length > 0
      ? `Priorité immédiate : ${recommendations[0].title}.`
      : "Priorité immédiate : compléter les données manquantes pour fiabiliser le pilotage.";

  return [scoreSentence, strongSentence, actionSentence].join(" ");
}

function recommendationActionFor(dim: ScoringDimension): string {
  switch (dim) {
    case "reach":
      return "Renforcer la couverture des publics cibles et clarifier le plan de diffusion.";
    case "engagement":
      return "Introduire des formats plus interactifs pour augmenter la participation active.";
    case "appropriation":
      return "Structurer un relais managérial pour améliorer la compréhension et la mémorisation des messages.";
    case "impact":
      return "Mettre en place un suivi post-événement pour mesurer les changements concrets.";
  }
}

/** Réplique exacte de `interpret_score` côté Python. */
function interpretScore(result: AdvancedScoreResult): InterpretationResponse {
  const globalScore = result.overall_score;

  // On ne garde que les dimensions réellement renseignées (au moins 1 signal).
  const hasData = (s: DimensionScore) =>
    s.measured_count + s.estimated_count + s.declared_count + s.proxy_count > 0;

  const presentDims = result.dimension_scores.filter(hasData);
  const filteredScores: Record<string, number> = {};
  for (const s of presentDims) filteredScores[s.dimension] = s.score;

  const ordered = (Object.entries(filteredScores) as Array<[ScoringDimension, number]>).sort(
    (a, b) => b[1] - a[1],
  );

  const strengths: InsightItem[] = [];
  const weaknesses: InsightItem[] = [];
  const dataGaps: DataGapItem[] = [];

  // Forces / faiblesses (seuil élargi : tout ce qui n'est pas solide > 70
  // passe en point de vigilance pour que la carte ne reste jamais vide).
  for (const [dim, score] of ordered) {
    const label = BUSINESS_LABELS[dim] ?? dim;
    const cap = `${label.charAt(0).toUpperCase()}${label.slice(1)}`;
    if (score >= 70) {
      strengths.push({
        title: `${cap} solide`,
        description: `Le niveau de ${label} est élevé (${Math.round(score)}/100).`,
      });
    } else {
      weaknesses.push({
        title: `${cap} à renforcer`,
        description: `Le niveau de ${label} reste insuffisant (${Math.round(
          score,
        )}/100) pour garantir des résultats durables.`,
      });
    }
  }

  // Data gaps — logique multi-déclencheurs identique au backend Python.
  for (const missing of result.missing_dimensions) {
    const label = BUSINESS_LABELS[missing] ?? missing;
    dataGaps.push({
      field: label,
      issue: "Aucune mesure collectée sur cette dimension",
      impact: `Impossible d'évaluer ${frArticle(label)}${label} — toute décision sur ce levier est prise à l'aveugle.`,
    });
  }
  for (const d of result.dimension_scores) {
    if (result.missing_dimensions.includes(d.dimension)) continue;
    const label = BUSINESS_LABELS[d.dimension] ?? d.dimension;
    const conf = d.confidence_score;
    const hard = d.measured_count + d.declared_count;
    const soft = d.estimated_count + d.proxy_count;
    const total = hard + soft;
    const score = d.score;

    if (total > 0 && score <= 0) {
      dataGaps.push({
        field: label,
        issue: "Valeurs collectées nulles ou non exploitables",
        impact: `Les signaux de ${label} existent mais ne produisent aucun score — vérifier les valeurs saisies.`,
      });
    } else if (total > 0 && conf < 70) {
      const niveau = conf < 50 ? "faible" : "partielle";
      dataGaps.push({
        field: label,
        issue: `Fiabilité de la mesure ${niveau} (${Math.round(conf)}%)`,
        impact: `Le score de ${label} (${Math.round(score)}/100) repose sur des données peu fiables — renforcer les sources avant de décider.`,
      });
    } else if (hard === 0 && soft > 0) {
      dataGaps.push({
        field: label,
        issue: "Données uniquement estimées ou indirectes",
        impact: `${frArticle(label) === "l'" ? "L'" : "La "}${label} est approximée par des proxies — à confirmer par une mesure directe.`,
      });
    } else if (total === 1) {
      dataGaps.push({
        field: label,
        issue: "Mesure reposant sur un seul indicateur",
        impact: `Le diagnostic de ${label} s'appuie sur un unique KPI — diversifier les sources pour sécuriser la lecture.`,
      });
    }
  }

  // Recommandations : une par dimension mesurée + "Mesurer la X" pour les dims absentes.
  // Les titres sont contractés ("Accélérer l'implication", pas "Accélérer la implication").
  const recommendations: RecommendationItem[] = [];
  for (const missing of result.missing_dimensions) {
    const label = BUSINESS_LABELS[missing] ?? missing;
    recommendations.push({
      title: frPrefix("Mesurer ", label),
      action: recommendationActionFor(missing),
      priority: "haute",
    });
  }
  const weakestFirst = [...ordered].sort((a, b) => a[1] - b[1]);
  for (const [dim, score] of weakestFirst) {
    const label = BUSINESS_LABELS[dim] ?? dim;
    const verb = score >= 70 ? "Pérenniser " : "Accélérer ";
    const priority: "haute" | "moyenne" | "basse" =
      score < 45 ? "haute" : score < 70 ? "moyenne" : "basse";
    recommendations.push({
      title: frPrefix(verb, label),
      action: recommendationActionFor(dim),
      priority,
    });
  }
  const priorityRank: Record<string, number> = { haute: 0, moyenne: 1, basse: 2 };
  recommendations.sort(
    (a, b) => (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9),
  );

  const strengthsTop = topN(strengths, 3);
  const weaknessesTop = topN(weaknesses, 3);
  const recosTop = topN(recommendations, 6);
  const gapsTop = topN(dataGaps, 6);

  const summary = executiveSummaryText(globalScore, strengthsTop, recosTop);

  const detailed: ScoreInterpretation = {
    summary,
    strengths: strengthsTop,
    weaknesses: weaknessesTop,
    recommendations: recosTop,
    data_gaps: gapsTop,
  };

  const executive: ExecutiveSummary = {
    headline: headlineFromScore(globalScore),
    key_insight: keyInsight(ordered, gapsTop.length > 0),
    top_strengths: strengthsTop.map(s => s.title).slice(0, 3),
    top_priorities: recosTop.map(r => r.title).slice(0, 3),
  };

  return { executive_summary: executive, detailed_analysis: detailed };
}

/* ═══════════════════════════════════════════════════════════════════
   VALIDATION D'ENTRÉE
   ═══════════════════════════════════════════════════════════════════ */

const VALID_PROVENANCES: Provenance[] = ["measured", "estimated", "declared", "proxy"];

function validateSignal(raw: unknown, idx: number): DimensionSignal | { error: string } {
  if (!raw || typeof raw !== "object") return { error: `Signal #${idx} invalide.` };
  const s = raw as Record<string, unknown>;

  if (!ALL_DIMENSIONS.includes(s.dimension as ScoringDimension)) {
    return { error: `Signal #${idx} : dimension inconnue (${String(s.dimension)}).` };
  }
  const value = Number(s.value);
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    return { error: `Signal #${idx} : value doit être entre 0 et 100.` };
  }
  if (!VALID_PROVENANCES.includes(s.provenance as Provenance)) {
    return { error: `Signal #${idx} : provenance invalide (${String(s.provenance)}).` };
  }
  const confidence = Number(s.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return { error: `Signal #${idx} : confidence doit être entre 0 et 1.` };
  }

  return {
    dimension: s.dimension as ScoringDimension,
    value: clamp(value, 0, 100),
    provenance: s.provenance as Provenance,
    confidence: clamp(confidence, 0, 1),
    method: (s.method as string | null | undefined) ?? null,
    kpi_id: (s.kpi_id as string | null | undefined) ?? null,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   HANDLER
   ═══════════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Body JSON invalide." }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json({ detail: "Le body doit être un tableau de DimensionSignal." }, { status: 400 });
  }

  const signals: DimensionSignal[] = [];
  for (let i = 0; i < body.length; i++) {
    const v = validateSignal(body[i], i);
    if ("error" in v) return NextResponse.json({ detail: v.error }, { status: 422 });
    signals.push(v);
  }

  const score = scoreMomentum(signals);
  const interpretation = interpretScore(score);

  return NextResponse.json({ score, interpretation });
}

// Health check pratique pour diagnostiquer un déploiement.
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/kpis/score-and-interpret",
    method: "POST",
    expects: "Array<DimensionSignal>",
  });
}
