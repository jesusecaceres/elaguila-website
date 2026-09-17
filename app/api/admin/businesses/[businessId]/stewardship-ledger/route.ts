import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { listLedgerForBusiness } from "@/app/lib/business/stewardship/repository";

export const dynamic = "force-dynamic";

/** GET — the permanent Stewardship Ledger for one business. Staff-only, read-only. */
export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_stewardship_ledger")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  const entries = await listLedgerForBusiness(businessId);
  return NextResponse.json({ ok: true, businessId, entries });
}
