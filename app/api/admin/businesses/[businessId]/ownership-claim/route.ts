/**
 * Systemic Repair Build — staff-side Owner Claim / Handoff API.
 * POST creates an invitation and returns the raw token/link exactly once. GET lists past/current
 * claims. DELETE revokes the pending one. All three are staff-only writes/reads behind the
 * generate_ownership_claim capability — never reachable by owner_bootstrap for the writes.
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { isOwnershipClaimEnabled } from "@/app/lib/business/ownership/featureFlag";
import { createOwnershipClaim, listOwnershipClaimsForBusiness, revokeOwnershipClaim } from "@/app/lib/business/ownership/repository";
import { getAdminSupabase } from "@/app/lib/supabase/server";

async function businessExists(businessId: string): Promise<boolean> {
  const admin = getAdminSupabase();
  const { data, error } = await admin.from("businesses").select("id").eq("id", businessId).maybeSingle();
  return !error && !!data;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "generate_ownership_claim")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await params;
  const claims = await listOwnershipClaimsForBusiness(businessId);
  return NextResponse.json({ ok: true, claims });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("generate_ownership_claim");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  if (!(await isOwnershipClaimEnabled())) return NextResponse.json({ ok: false, error: "feature_disabled" }, { status: 503 });

  const { businessId } = await params;
  if (!(await businessExists(businessId))) {
    return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const intendedOwnerEmail = typeof (body as { intendedOwnerEmail?: unknown }).intendedOwnerEmail === "string"
    ? ((body as { intendedOwnerEmail: string }).intendedOwnerEmail.trim() || null)
    : null;

  const result = await createOwnershipClaim({ businessId, intendedOwnerEmail }, access.actor);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "claim_already_pending" ? 409 : 400 });
  }

  return NextResponse.json({
    ok: true,
    claim: result.claim,
    // Returned exactly once — the server never persists or re-exposes the raw token again.
    claimLink: `/dashboard/business-tools/claim/${result.rawToken}`,
  }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("generate_ownership_claim");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const claimId = typeof (body as { claimId?: unknown }).claimId === "string" ? (body as { claimId: string }).claimId : "";
  if (!claimId) return NextResponse.json({ ok: false, error: "missing_claim_id" }, { status: 400 });
  const reason = typeof (body as { reason?: unknown }).reason === "string" ? (body as { reason: string }).reason.trim() || null : null;

  const result = await revokeOwnershipClaim(claimId, businessId, access.actor, reason);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.error === "not_found" ? 404 : 409 });
  }
  return NextResponse.json({ ok: true });
}
