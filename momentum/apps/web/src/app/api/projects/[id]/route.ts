/**
 * GET /api/projects/[id] — relit un projet sauvegardé.
 * DELETE /api/projects/[id] — supprime (utilitaire, non exposé côté UI pour l'instant).
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "../../_lib/store";

const PROJECT_PREFIX = "project:";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const project = await store.get(`${PROJECT_PREFIX}${params.id}`);
  if (!project) {
    return NextResponse.json({ detail: "Projet introuvable." }, { status: 404 });
  }
  return NextResponse.json(project);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await store.del(`${PROJECT_PREFIX}${params.id}`);
  return NextResponse.json({ ok: true });
}
