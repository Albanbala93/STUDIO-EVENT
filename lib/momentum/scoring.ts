/**
 * Moteur de scoring Momentum — port TypeScript de
 * momentum/apps/api/services/scoring/advanced_engine.py.
 *
 * Conserve exactement la même logique :
 *   - pondération confiance par signal
 *   - moyenne pondérée par dimension
 *   - moyenne pondérée des dimensions (présentes uniquement)
 *   - détection des dimensions manquantes (angles morts)
 */

import type {
  Dimension,
  DimensionScoreData,
  KPIBreakdown,
  Provenance,
  ScoreResult,
} from "./types";

export type DimensionSignal = {
  dimension: Dimension;
  value: number; // 0..100
  provenance: Provenance;
  confidence: number; // 0..1
  method?: string | null;
  kpi_id?: string | null;
};

const DEFAULT_DIMENSION_WEIGHTS: Record<Dimension, number> = {
  reach: 0.25,
  engagement: 0.25,
  appropriation: 0.25,
  impact: 0.25,
};

function round(value: number, digits = 2): number {
  const m = Math.pow(10, digits);
  return Math.round(value * m) / m;
}

function computeWeightedDimensionScore(signals: DimensionSignal[]): {
  score: number;
  confidence_score: number;
  measured_count: number;
  estimated_count: number;
  declared_count: number;
  proxy_count: number;
  kpi_breakdown: KPIBreakdown[];
} {
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

  const measured_count = signals.filter((s) => s.provenance === "measured").length;
  const estimated_count = signals.filter((s) => s.provenance === "estimated").length;
  const declared_count = signals.filter((s) => s.provenance === "declared").length;
  const proxy_count = signals.filter((s) => s.provenance === "proxy").length;

  const total_weight = signals
    .filter((s) => s.confidence > 0)
    .reduce((sum, s) => sum + s.confidence, 0);

  let raw_score: number;
  let breakdown: KPIBreakdown[];

  if (total_weight > 0) {
    raw_score =
      signals.reduce((sum, s) => sum + s.value * s.confidence, 0) / total_weight;
    breakdown = signals.map((s) => ({
      kpi_id: s.kpi_id ?? null,
      value: s.value,
      confidence: s.confidence,
      contribution: round((s.value * s.confidence) / total_weight, 4),
      provenance: s.provenance,
    }));
  } else {
    raw_score = signals.reduce((sum, s) => sum + s.value, 0) / signals.length;
    breakdown = signals.map((s) => ({
      kpi_id: s.kpi_id ?? null,
      value: s.value,
      confidence: s.confidence,
      contribution: 0,
      provenance: s.provenance,
    }));
  }

  const confidence_score = round(
    (signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length) * 100,
    2
  );

  return {
    score: round(raw_score, 2),
    confidence_score,
    measured_count,
    estimated_count,
    declared_count,
    proxy_count,
    kpi_breakdown: breakdown,
  };
}

function scoreDimension(
  dimension: Dimension,
  signals: DimensionSignal[]
): DimensionScoreData {
  const dimSignals = signals.filter((s) => s.dimension === dimension);

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
  return {
    dimension,
    score: w.score,
    confidence_score: w.confidence_score,
    measured_count: w.measured_count,
    estimated_count: w.estimated_count,
    declared_count: w.declared_count,
    proxy_count: w.proxy_count,
    kpi_breakdown: w.kpi_breakdown,
  };
}

/**
 * Calcule le score Momentum agrégé à partir de la liste de signaux KPI.
 * Reproduction fidèle de advanced_engine.score_momentum(...).
 */
export function scoreMomentum(signals: DimensionSignal[]): ScoreResult {
  const weights = DEFAULT_DIMENSION_WEIGHTS;
  const dims: Dimension[] = ["reach", "engagement", "appropriation", "impact"];
  const dimensionScores = dims.map((d) => scoreDimension(d, signals));

  const hasAnySignal = (ds: DimensionScoreData) =>
    ds.measured_count + ds.estimated_count + ds.declared_count + ds.proxy_count > 0;

  const present_scores = dimensionScores.filter(hasAnySignal);
  const missing_dimensions = dimensionScores
    .filter((ds) => !hasAnySignal(ds))
    .map((ds) => ds.dimension);

  const measured_count = dimensionScores.reduce((s, ds) => s + ds.measured_count, 0);
  const estimated_count = dimensionScores.reduce((s, ds) => s + ds.estimated_count, 0);
  const declared_count = dimensionScores.reduce((s, ds) => s + ds.declared_count, 0);
  const proxy_count = dimensionScores.reduce((s, ds) => s + ds.proxy_count, 0);

  if (present_scores.length === 0) {
    return {
      overall_score: 0,
      confidence_score: 0,
      dimension_scores: dimensionScores,
      measured_count: 0,
      estimated_count: 0,
      declared_count: 0,
      proxy_count: 0,
      missing_dimensions,
    };
  }

  const weight_total = present_scores.reduce(
    (s, ds) => s + weights[ds.dimension],
    0
  );

  const overall_score = round(
    present_scores.reduce((s, ds) => s + ds.score * weights[ds.dimension], 0) /
      weight_total,
    2
  );
  const confidence_score = round(
    present_scores.reduce(
      (s, ds) => s + ds.confidence_score * weights[ds.dimension],
      0
    ) / weight_total,
    2
  );

  return {
    overall_score,
    confidence_score,
    dimension_scores: dimensionScores,
    measured_count,
    estimated_count,
    declared_count,
    proxy_count,
    missing_dimensions,
  };
}
