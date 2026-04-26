/**
 * Rate limiter serveur (best-effort) — quota quotidien d'appels Anthropic.
 *
 * Stockage : Map en mémoire keyée sur l'IP du client.
 * Reset : à minuit UTC (clé date intégrée dans la valeur du compteur).
 *
 * Limites connues (à durcir quand on aura un store partagé) :
 *   - Vercel serverless : chaque instance a sa propre Map → un même
 *     utilisateur peut potentiellement épuiser N × 100 appels avant blocage.
 *     C'est volontairement permissif côté serveur ; le compteur localStorage
 *     côté client (lib/rate-limit/client.ts) sert de premier rempart UX.
 *   - L'IP peut être partagée (NAT, VPN) → quelques utilisateurs peuvent se
 *     bloquer mutuellement. Acceptable tant qu'on n'a pas d'auth.
 *
 * Migration future : remplacer la Map par Vercel KV / Upstash Redis sans
 * changer la signature publique.
 */

import type { NextRequest } from "next/server";

export const SERVER_RATE_LIMIT_PER_DAY = 100;

type Entry = { date: string; count: number };

const buckets: Map<string, Entry> = new Map();

function utcDateKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function nextUtcMidnightISO(): string {
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0,
    ),
  );
  return next.toISOString();
}

function clientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "anonymous";
}

export type ServerRateLimitResult =
  | { allowed: true; remaining: number; resetsAt: string }
  | {
      allowed: false;
      reason: "quota-reached";
      limit: number;
      resetsAt: string;
      message: string;
    };

/** À appeler en tête de handler ; consomme 1 token si autorisé. */
export function consumeServerRateLimit(req: NextRequest): ServerRateLimitResult {
  const today = utcDateKey();
  const key = `${clientIp(req)}::${today}`;
  const existing = buckets.get(key);
  const current = existing && existing.date === today ? existing : { date: today, count: 0 };

  if (current.count >= SERVER_RATE_LIMIT_PER_DAY) {
    return {
      allowed: false,
      reason: "quota-reached",
      limit: SERVER_RATE_LIMIT_PER_DAY,
      resetsAt: nextUtcMidnightISO(),
      message:
        "Vous avez atteint votre limite d'utilisation quotidienne (100 requêtes). Votre quota se renouvelle demain à minuit. Une question ? Contactez-nous.",
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return {
    allowed: true,
    remaining: SERVER_RATE_LIMIT_PER_DAY - current.count,
    resetsAt: nextUtcMidnightISO(),
  };
}
