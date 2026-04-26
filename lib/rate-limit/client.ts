/**
 * Rate limiter client (localStorage) — quota quotidien d'appels Anthropic.
 *
 * Spec : 100 appels par utilisateur par jour, reset à minuit UTC.
 * Sans authentification, "utilisateur" = navigateur (localStorage).
 *
 * Pour blinder côté serveur quand l'auth + DB seront en place, voir
 * `lib/rate-limit/server.ts` — le fallback IP couvre l'abus de session.
 */

export const RATE_LIMIT_PER_DAY = 100;

const STORAGE_KEY = "stratly_rate_limit_v1";

export type RateLimitState = {
  /** Date UTC YYYY-MM-DD du dernier comptage. */
  date: string;
  /** Nombre d'appels Anthropic comptabilisés aujourd'hui. */
  count: number;
};

export type RateLimitStatus = {
  used: number;
  limit: number;
  remaining: number;
  /** ISO date du prochain reset (minuit UTC). */
  resetsAt: string;
  isBlocked: boolean;
};

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

function emptyState(): RateLimitState {
  return { date: utcDateKey(), count: 0 };
}

function readState(): RateLimitState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as RateLimitState;
    if (parsed.date !== utcDateKey()) {
      const fresh = emptyState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

function writeState(state: RateLimitState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Statut courant — lecture seule, ne consomme pas de quota. */
export function getRateLimitStatus(): RateLimitStatus {
  const s = readState();
  return {
    used: s.count,
    limit: RATE_LIMIT_PER_DAY,
    remaining: Math.max(0, RATE_LIMIT_PER_DAY - s.count),
    resetsAt: nextUtcMidnightISO(),
    isBlocked: s.count >= RATE_LIMIT_PER_DAY,
  };
}

/**
 * À appeler AVANT un appel Anthropic.
 * Si bloqué → retourne le status sans incrémenter.
 * Si OK → incrémente et retourne le nouveau status.
 */
export function consumeRateLimit(): RateLimitStatus {
  const s = readState();
  if (s.count >= RATE_LIMIT_PER_DAY) {
    return {
      used: s.count,
      limit: RATE_LIMIT_PER_DAY,
      remaining: 0,
      resetsAt: nextUtcMidnightISO(),
      isBlocked: true,
    };
  }
  const next: RateLimitState = { date: s.date, count: s.count + 1 };
  writeState(next);
  return {
    used: next.count,
    limit: RATE_LIMIT_PER_DAY,
    remaining: RATE_LIMIT_PER_DAY - next.count,
    resetsAt: nextUtcMidnightISO(),
    isBlocked: next.count >= RATE_LIMIT_PER_DAY,
  };
}

/** Reset manuel — exposé pour debug uniquement. */
export function resetRateLimit(): void {
  writeState(emptyState());
}
