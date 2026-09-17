/**
 * Staff-Created Business Profile pipeline -- Gate 07/08 commercial-state API. GET is available to
 * anyone who can view the profile; granting/revoking a business-level entitlement is a manager+
 * commercial write, gated by grant_business_profile_entitlement (never sales_rep).
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import {
  grantBusinessProfileEntitlement,
  listBusinessProfileEntitlements,
  resolveBusinessProfileCommercialState,
  revokeBusinessProfileEntitlement,
} from "@/app/lib/business/profile/entitlementRepository";
import type { BusinessProfileEntitlementSourceType } from "@/app/lib/business/profile/types";

const VALID_SOURCE_TYPES: readonly BusinessProfileEntitlementSourceType[] = ["admin_manual", "comp", "partner", "manual_cleared_payment"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_business_profile")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await params;
  const [commercial, entitlements] = await Promise.all([
    resolveBusinessProfileCommercialState(businessId),
    listBusinessProfileEntitlements(businessId),
  ]);
  return NextResponse.json({ ok: true, commercial, entitlements });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("grant_business_profile_entitlement");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const sourceType = typeof b.sourceType === "string" && VALID_SOURCE_TYPES.includes(b.sourceType as BusinessProfileEntitlementSourceType)
    ? (b.sourceType as BusinessProfileEntitlementSourceType)
    : null;
  if (!sourceType) return NextResponse.json({ ok: false, error: "invalid_source_type" }, { status: 400 });
  const sourceReference = typeof b.sourceReference === "string" ? b.sourceReference.trim().slice(0, 400) || null : null;
  const expiresAt = typeof b.expiresAt === "string" && b.expiresAt.trim() ? b.expiresAt.trim() : null;

  const result = await grantBusinessProfileEntitlement(businessId, { sourceType, sourceReference, expiresAt }, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, entitlement: result.entitlement }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("grant_business_profile_entitlement");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const entitlementId = typeof (body as { entitlementId?: unknown }).entitlementId === "string" ? (body as { entitlementId: string }).entitlementId : "";
  if (!entitlementId) return NextResponse.json({ ok: false, error: "missing_entitlement_id" }, { status: 400 });

  const result = await revokeBusinessProfileEntitlement(entitlementId, businessId, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  return NextResponse.json({ ok: true });
}
