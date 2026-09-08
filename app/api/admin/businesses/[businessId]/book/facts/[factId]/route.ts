import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { staffActorToLivingBookActor } from "@/app/admin/_lib/livingBookActor";
import { confirmFact } from "@/app/lib/business/livingBook/repository";

export const dynamic = "force-dynamic";

/** PATCH — confirm or reject a fact. Requires confirm_business_fact (manager+ / super_admin). */
export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string; factId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "confirm_business_fact")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId, factId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const action = (body as { action?: unknown }).action;
  if (action !== "confirm" && action !== "reject") {
    return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
  }

  const success = await confirmFact(businessId, factId, staffActorToLivingBookActor(access.actor), action === "confirm");
  if (!success) return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
