/**
 * POST /api/momentum/enrich
 *
 * Enrichissement "option 1" du diagnostic Momentum : on garde la baseline
 * produite par le moteur déterministe (/lib/momentum/interpretation.ts) et on
 * demande à Claude Sonnet 4.5 de REFORMULER les champs textuels pour qu'ils
 * soient contextualisés à l'initiative (nom, type, audience, intention).
 *
 * Garanties :
 *   • Clé ANTHROPIC_API_KEY absente → retour baseline tel quel.
 *   • Timeout, HTTP error, JSON invalide, structure inattendue → baseline.
 *   • Les champs structurels (tool, priority, reco_type, dimension) de la
 *     baseline sont TOUJOURS préservés ; l'LLM ne peut réécrire que les
 *     chaînes (title, action, why, when, impact, description…).
 *   • Post-processing déterministe anti-élision en sortie.
 *   • Jamais d'exception propagée à l'appelant.
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  InterpretationPayload,
  InsightItem,
  DataGapItem,
  RecommendationItem,
  ScoreResult,
} from "../../../../lib/momentum/types";
import { consumeServerRateLimit } from "../../../../lib/rate-limit/server";

export const maxDuration = 30;
export const runtime = "nodejs";

/* ─── Helpers élision (dupliqués localement pour éviter un import runtime) ─── */

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
  if (typeof value === "string") return fixFrenchElision(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => deepFixElision(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepFixElision(v);
    }
    return out as unknown as T;
  }
  return value;
}

/* ─── Types du body ─── */

type EnrichBody = {
  score: ScoreResult;
  baseline: InterpretationPayload;
  context?: {
    name?: string;
    initiativeType?: string;
    audienceType?: string;
    audienceSize?: number;
    intent?: string;
  };
  signals?: unknown[];
};

/* ─── Validation minimale de la baseline reçue ─── */

function isPayload(x: unknown): x is InterpretationPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  const es = o.executive_summary as Record<string, unknown> | undefined;
  const da = o.detailed_analysis as Record<string, unknown> | undefined;
  if (!es || !da) return false;
  if (typeof es.headline !== "string" || typeof es.key_insight !== "string") return false;
  if (!Array.isArray(es.top_strengths) || !Array.isArray(es.top_priorities)) return false;
  if (typeof da.summary !== "string") return false;
  if (
    !Array.isArray(da.strengths) ||
    !Array.isArray(da.weaknesses) ||
    !Array.isArray(da.recommendations) ||
    !Array.isArray(da.data_gaps)
  ) {
    return false;
  }
  return true;
}

/* ─── Merge enriched text ONTO baseline preserving structural fields ─── */

function s(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function mergeInsights(
  base: InsightItem[],
  incoming: unknown,
): InsightItem[] {
  if (!Array.isArray(incoming)) return base;
  return base.map((b, i) => {
    const cand = incoming[i] as Record<string, unknown> | undefined;
    if (!cand || typeof cand !== "object") return b;
    return {
      title: s(cand.title, b.title),
      description: s(cand.description, b.description),
    };
  });
}

function mergeRecos(
  base: RecommendationItem[],
  incoming: unknown,
): RecommendationItem[] {
  if (!Array.isArray(incoming)) return base;
  return base.map((b, i) => {
    const cand = incoming[i] as Record<string, unknown> | undefined;
    if (!cand || typeof cand !== "object") return b;
    // On n'autorise QUE la réécriture des chaînes textuelles.
    // priority, dimension, reco_type, tool : on conserve la baseline.
    return {
      ...b,
      title: s(cand.title, b.title),
      action: s(cand.action, b.action),
      why: s(cand.why, b.why ?? ""),
      when: s(cand.when, b.when ?? ""),
      impact: s(cand.impact, b.impact ?? ""),
    };
  });
}

function mergeGaps(base: DataGapItem[], incoming: unknown): DataGapItem[] {
  if (!Array.isArray(incoming)) return base;
  return base.map((b, i) => {
    const cand = incoming[i] as Record<string, unknown> | undefined;
    if (!cand || typeof cand !== "object") return b;
    return {
      field: s(cand.field, b.field),
      issue: s(cand.issue, b.issue),
      impact: s(cand.impact, b.impact),
    };
  });
}

/* ─── Appel Anthropic ─── */

async function enrichWithAnthropic(
  body: EnrichBody,
): Promise<InterpretationPayload> {
  const { score, baseline, context } = body;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return baseline;

  const system = `Tu es un consultant senior en communication interne et performance d'initiatives.
Tu reçois une INTERPRÉTATION de base (produite par un moteur de règles) et tu dois la REFORMULER pour qu'elle soit spécifique au contexte de l'initiative analysée (nom, type, audience, intention).

Règles strictes :
- Tu NE DOIS PAS changer les scores, les dimensions, les types, ni le nombre d'items dans chaque liste.
- Tu DOIS garder exactement la même structure JSON que la baseline, en réécrivant UNIQUEMENT les champs textuels (headline, key_insight, summary, title, description, action, why, when, impact, field, issue).
- Tu DOIS respecter les contractions françaises : "l'implication" (pas "la implication"), "l'impact" (pas "la impact"), "l'appropriation", "de l'engagement".
- Français professionnel, concis, orienté décision COMEX. Pas de jargon, pas de généralités.
- Chaque reformulation doit citer explicitement un élément du contexte (nom, type d'initiative, audience, intention) quand c'est pertinent.
- Ne réponds qu'avec le JSON, sans texte avant ni après, sans balises markdown, sans commentaires.`;

  const userPayload = {
    contexte: context ?? {},
    score_global: Math.round(score.overall_score),
    confiance_globale: Math.round(score.confidence_score),
    scores_par_dimension: score.dimension_scores.map((d) => ({
      dimension: d.dimension,
      score: Math.round(d.score),
      confiance: Math.round(d.confidence_score),
    })),
    dimensions_non_mesurees: score.missing_dimensions,
    baseline,
  };

  const user = `Voici la baseline à reformuler en restant STRICTEMENT dans la même structure JSON (mêmes clés, même nombre d'items par liste) :

${JSON.stringify(userPayload, null, 2)}

Retourne uniquement l'objet JSON correspondant à \`baseline\` (executive_summary + detailed_analysis) avec les champs textuels reformulés.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // Cap absolu : 2000 tokens pour les enrichissements longs (diagnostic complet).
        model: "claude-sonnet-4-5",
        max_tokens: 2000,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return baseline;

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === "text")?.text ?? "";
    if (!text) return baseline;

    const jsonMatch = text.match(/\{[\s\S]*\}$/m) ?? text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : text;

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return baseline;
    }
    if (!parsed || typeof parsed !== "object") return baseline;

    const p = parsed as Record<string, unknown>;
    const es = (p.executive_summary ?? {}) as Record<string, unknown>;
    const da = (p.detailed_analysis ?? {}) as Record<string, unknown>;

    const merged: InterpretationPayload = {
      executive_summary: {
        headline: s(es.headline, baseline.executive_summary.headline),
        key_insight: s(es.key_insight, baseline.executive_summary.key_insight),
        // Top strengths/priorities : on préserve la longueur de la baseline
        top_strengths: Array.isArray(es.top_strengths)
          ? baseline.executive_summary.top_strengths.map((bs, i) =>
              s((es.top_strengths as unknown[])[i], bs),
            )
          : baseline.executive_summary.top_strengths,
        top_priorities: Array.isArray(es.top_priorities)
          ? baseline.executive_summary.top_priorities.map((bp, i) =>
              s((es.top_priorities as unknown[])[i], bp),
            )
          : baseline.executive_summary.top_priorities,
      },
      detailed_analysis: {
        summary: s(da.summary, baseline.detailed_analysis.summary),
        strengths: mergeInsights(baseline.detailed_analysis.strengths, da.strengths),
        weaknesses: mergeInsights(baseline.detailed_analysis.weaknesses, da.weaknesses),
        recommendations: mergeRecos(
          baseline.detailed_analysis.recommendations,
          da.recommendations,
        ),
        data_gaps: mergeGaps(baseline.detailed_analysis.data_gaps, da.data_gaps),
      },
    };

    return deepFixElision(merged);
  } catch {
    clearTimeout(timer);
    return baseline;
  }
}

/* ─── Handler ─── */

export async function POST(req: NextRequest) {
  // Rate limiting : 100 appels Anthropic/IP/jour, reset minuit UTC.
  // Sans cet appel Anthropic ne sera pas déclenché et le client recevra
  // le baseline déterministe + un 429 lisible.
  const rl = consumeServerRateLimit(req);
  if (rl.allowed === false) {
    return NextResponse.json(
      {
        detail: rl.message,
        rateLimit: { limit: rl.limit, resetsAt: rl.resetsAt },
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rl.resetsAt,
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Body JSON invalide." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ detail: "Body invalide." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  if (!b.score || !b.baseline) {
    return NextResponse.json(
      { detail: "Body doit contenir { score, baseline, context?, signals? }." },
      { status: 400 },
    );
  }
  if (!isPayload(b.baseline)) {
    return NextResponse.json({ detail: "baseline malformé." }, { status: 400 });
  }

  const interpretation = await enrichWithAnthropic(b as unknown as EnrichBody);
  // À ce point rl.allowed est forcément true (early-return ci-dessus).
  // On lit les champs via une assertion plutôt que via narrowing pour
  // rester robuste avec tsconfig "strict": false.
  const ok = rl as { allowed: true; remaining: number; resetsAt: string };
  return NextResponse.json(
    { interpretation },
    {
      headers: {
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": String(ok.remaining),
        "X-RateLimit-Reset": ok.resetsAt,
      },
    },
  );
}
