/**
 * Routes Next.js embarquées pour la persistance des projets Momentum.
 *
 *   POST /api/projects        → crée un projet, retourne { id }
 *   GET  /api/projects        → liste paginée { items: [...] }
 *
 * Contrat d'E/S aligné sur le router FastAPI `apps/api/routers/projects.py`
 * pour que le front puisse taper indifféremment l'un ou l'autre.
 */

import { NextRequest, NextResponse } from "next/server";
import { store, STORE_MODE, newId } from "../_lib/store";

const PROJECT_PREFIX = "project:";
const INDEX_KEY = "project:__index__";

type StoredProject = {
  id: string;
  name: string;
  initiative_type: string | null;
  audience: string | null;
  intent: string | null;
  overall_score: number;
  confidence_score: number;
  payload: unknown;
  created_at: string;
};

/* ───────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ detail: "Body JSON invalide." }, { status: 400 });
  }

  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Initiative sans nom";
  const initiative_type = typeof body.initiative_type === "string" ? body.initiative_type : null;
  const audience = typeof body.audience === "string" ? body.audience : null;
  const intent = typeof body.intent === "string" ? body.intent : null;
  const overall_score = Number(body.overall_score);
  const confidence_score = Number(body.confidence_score);
  const payload = body.payload ?? null;

  if (!Number.isFinite(overall_score) || !Number.isFinite(confidence_score)) {
    return NextResponse.json(
      { detail: "overall_score et confidence_score doivent être numériques." },
      { status: 422 },
    );
  }

  const id = newId("p");
  const project: StoredProject = {
    id,
    name,
    initiative_type,
    audience,
    intent,
    overall_score,
    confidence_score,
    payload,
    created_at: new Date().toISOString(),
  };

  await store.set(`${PROJECT_PREFIX}${id}`, project);

  // Index léger pour supporter GET /api/projects (liste).
  const index = (await store.get<string[]>(INDEX_KEY)) ?? [];
  index.unshift(id);
  await store.set(INDEX_KEY, index.slice(0, 200));

  return NextResponse.json({
    id,
    storage: STORE_MODE,
    // Avertissement explicite en mode éphémère — le front peut l'afficher.
    warning:
      STORE_MODE === "memory"
        ? "Persistance éphémère : Vercel KV non configuré. Le projet peut disparaître en quelques minutes."
        : null,
  });
}

export async function GET() {
  const index = (await store.get<string[]>(INDEX_KEY)) ?? [];
  const items: StoredProject[] = [];
  for (const id of index.slice(0, 50)) {
    const p = await store.get<StoredProject>(`${PROJECT_PREFIX}${id}`);
    if (p) items.push(p);
  }
  return NextResponse.json({ items, storage: STORE_MODE });
}
