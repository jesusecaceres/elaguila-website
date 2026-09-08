import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getBusinessWorkspaceDetail, updateSalesStatus } from "@/app/admin/_lib/businessWorkspaceData";
import { BUSINESS_SALES_STATUSES, type BusinessSalesStatus } from "@/app/admin/_lib/salesWorkspaceLogic";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;
  const detail = await getBusinessWorkspaceDetail(businessId, access.actor);
  if (!detail) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, detail });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "update_sales_status")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const status = (body as { status?: unknown }).status;
  if (typeof status !== "string" || !BUSINESS_SALES_STATUSES.some((o) => o.value === status)) {
    return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
  }
  if (status === "archived" && !actorHasCapability(access.actor, "archive_sales_record")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }

  const success = await updateSalesStatus(businessId, status as BusinessSalesStatus, access.actor);
  if (!success) {
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
