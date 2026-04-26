/**
 * Rate limiter serveur (best-effort) pour l'app Momentum embarquée.
 * Voir `lib/rate-limit/server.ts` à la racine pour la doc complète.
 *
 * Le code est dupliqué intentionnellement : ce sous-projet est un Next.js
 * indépendant (Vercel l'isole) et ne peut pas importer depuis la racine.
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
