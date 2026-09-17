/**
 * Assisted Publishing (Gate 07) — staff-side read of the neutral Business Identity projection
 * used to prefill EMPTY fields of a real category application. Read-only; the same
 * `view_business_detail` capability that already gates the business workspace page.
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { buildBusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await params;
  const context = await buildBusinessApplicationContext(businessId);
  if (!context) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, context });
}
