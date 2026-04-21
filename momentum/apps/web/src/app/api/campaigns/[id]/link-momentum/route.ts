/**
 * POST /api/campaigns/[id]/link-momentum
 *
 * Relie un projet Momentum à une campagne Campaign Studio.
 * En mode full-Vercel (sans backend Python ni CS), on enregistre juste
 * la relation dans notre store — le vrai Campaign Studio prendra le relais
 * quand il sera connecté.
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "../../../_lib/store";

const LINK_PREFIX = "campaign_link:";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  let body: { momentum_project_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ detail: "Body JSON invalide." }, { status: 400 });
  }

  const projectId = typeof body.momentum_project_id === "string" ? body.momentum_project_id : null;
  if (!projectId) {
    return NextResponse.json(
      { detail: "momentum_project_id requis." },
      { status: 422 },
    );
  }

  await store.set(`${LINK_PREFIX}${params.id}`, {
    campaign_id: params.id,
    momentum_project_id: projectId,
    linked_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, campaign_id: params.id, momentum_project_id: projectId });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const link = await store.get(`${LINK_PREFIX}${params.id}`);
  if (!link) {
    return NextResponse.json({ detail: "Aucun lien pour cette campagne." }, { status: 404 });
  }
  return NextResponse.json(link);
}
