import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { resolveContradiction } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

/** PATCH — resolve a contradiction. Never silent: an explanation is required (also DB-enforced). */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string; contradictionId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "resolve_contradictions")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId, contradictionId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const resolution = typeof (body as { resolution?: unknown }).resolution === "string" ? ((body as { resolution: string }).resolution as string) : "";
  if (!resolution.trim()) return NextResponse.json({ ok: false, error: "empty_resolution" }, { status: 400 });
  const resolvedCanonicalFactId = typeof (body as { resolvedCanonicalFactId?: unknown }).resolvedCanonicalFactId === "string" ? ((body as { resolvedCanonicalFactId: string }).resolvedCanonicalFactId as string) : null;

  const success = await resolveContradiction(businessId, contradictionId, resolution, resolvedCanonicalFactId, staffActorToLivingBookActor(access.actor));
  if (!success) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
