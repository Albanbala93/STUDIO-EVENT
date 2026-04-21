/**
 * Store de persistance minimaliste pour les routes Next.js embarquées.
 *
 * Deux modes transparents :
 *   1. Vercel KV (Upstash Redis) — si KV_REST_API_URL + KV_REST_API_TOKEN
 *      sont définis dans l'env, on persiste là. Activation zéro-code :
 *      il suffit d'attacher un KV store au projet Vercel.
 *   2. Fallback en mémoire — Map dans le process. Sur Vercel serverless,
 *      ça persiste tant que le conteneur reste chaud (quelques minutes
 *      après la dernière requête). Suffisant pour une démo / parcours
 *      utilisateur unique. Pour une vraie prod : activer KV.
 *
 * API commune : get / set / list / delete — typée par "collection".
 */

type KVLike = {
  get: <T>(key: string) => Promise<T | null>;
  set: (key: string, value: unknown) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
  keys: (pattern: string) => Promise<string[]>;
};

/* ─────────────────────────────────────────────────────────────────────
   Backend mémoire (fallback quand KV absent)
   ───────────────────────────────────────────────────────────────────── */

// On épingle la Map sur globalThis pour survivre au HMR de Next.js dev
// et aux re-chargements de module dans la même instance serverless.
const GLOBAL_KEY = "__momentum_memory_store__";
type MemGlobal = typeof globalThis & { [GLOBAL_KEY]?: Map<string, string> };
const g = globalThis as MemGlobal;
if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map<string, string>();
const memStore: Map<string, string> = g[GLOBAL_KEY]!;

const memoryKV: KVLike = {
  async get<T>(key: string): Promise<T | null> {
    const raw = memStore.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set(key, value) {
    memStore.set(key, JSON.stringify(value));
    return "OK";
  },
  async del(key) {
    return memStore.delete(key) ? 1 : 0;
  },
  async keys(pattern: string) {
    // Pattern simple "prefix:*"
    const prefix = pattern.endsWith("*") ? pattern.slice(0, -1) : pattern;
    return Array.from(memStore.keys()).filter(k => k.startsWith(prefix));
  },
};

/* ─────────────────────────────────────────────────────────────────────
   Backend Vercel KV (via fetch REST — pas de dépendance externe)
   ───────────────────────────────────────────────────────────────────── */

function kvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvFetch(command: (string | number)[]): Promise<unknown> {
  const url = process.env.KV_REST_API_URL!;
  const token = process.env.KV_REST_API_TOKEN!;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    // Vercel KV reste rapide, pas de cache Next.js
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`KV error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { result: unknown };
  return json.result;
}

const vercelKV: KVLike = {
  async get<T>(key: string): Promise<T | null> {
    const raw = (await kvFetch(["GET", key])) as string | null;
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async set(key, value) {
    return kvFetch(["SET", key, JSON.stringify(value)]);
  },
  async del(key) {
    return kvFetch(["DEL", key]);
  },
  async keys(pattern) {
    const res = (await kvFetch(["KEYS", pattern])) as string[];
    return res ?? [];
  },
};

/* ─────────────────────────────────────────────────────────────────────
   Façade publique
   ───────────────────────────────────────────────────────────────────── */

export const store: KVLike = kvConfigured() ? vercelKV : memoryKV;

/** Indique si le store est persistant. Utile pour afficher un avertissement UX. */
export const STORE_MODE: "kv" | "memory" = kvConfigured() ? "kv" : "memory";

/** Helper pour générer un id court lisible. */
export function newId(prefix = "p"): string {
  // `crypto.randomUUID` est dispo dans Node 20+ (runtime Next.js par défaut).
  const uuid = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${uuid.replace(/-/g, "").slice(0, 12)}`;
}
