import { NextResponse, type NextRequest } from "next/server";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getCurrentAdminAccessContext } from "@/app/admin/_lib/adminAccessControl";
import {
  markManualPaymentRejected,
  markManualPaymentReversed,
  recordManualPaymentPendingVerification,
  verifyManualPaymentCleared,
  type ManualPaymentMethod,
} from "@/app/lib/listingPlans/manualClearedPayments";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Package C Build 1 (C2, Gate 10) — admin-only manual cleared-payment operations
 * (Agreement v1.2 §7-§9: Zelle / ACH / cash-with-receipt / approved business check; payment
 * received ONLY when funds are verified cleared). Minimal truthful surface — the full Admin OS
 * workflow ships in C8/Package E; these operations are auditable and idempotent today.
 *
 * Body: { action: "record" | "verify_cleared" | "reject" | "reverse", ... }
 * Only `verify_cleared` fulfills entitlement, exactly once, via the standard entitlement
 * writer with grant_source 'manual_cleared_payment'. No fake Stripe records anywhere.
 */
export async function POST(request: NextRequest) {
  try {
    await requireLeonixAdminPermission("can_view_payments");
  } catch {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }

  const action = String(body.action ?? "").trim();
  // Package E Build E3, Gate 4 — CRITICAL AUDIT FIX. This route previously trusted a
  // client-supplied `body.adminUserId` for audit attribution (any caller past the cookie gate
  // could claim to be any admin, or default to the literal string "admin"). The existing admin
  // access context already resolves a real, server-authenticated identity for the current
  // request (same precedence already used by grantComplimentaryPackageEntitlementAction in
  // package-entitlements/actions.ts: authUserId, else operatorEmail, else rosterMemberId, else
  // the literal "admin" as the last-resort fallback only when no identity is resolvable at all).
  // `adminUserId` is no longer read from the request body.
  const access = await getCurrentAdminAccessContext();
  const adminUserId = access.authUserId ?? access.operatorEmail ?? access.rosterMemberId ?? "admin";

  if (action === "record") {
    const result = await recordManualPaymentPendingVerification({
      adminUserId,
      ownerUserId: typeof body.ownerUserId === "string" ? body.ownerUserId : null,
      customerName: typeof body.customerName === "string" ? body.customerName : null,
      customerEmail: typeof body.customerEmail === "string" ? body.customerEmail : null,
      businessName: typeof body.businessName === "string" ? body.businessName : null,
      category: String(body.category ?? ""),
      listingSource: typeof body.listingSource === "string" ? body.listingSource : null,
      listingId: typeof body.listingId === "string" ? body.listingId : null,
      leonixAdId: typeof body.leonixAdId === "string" ? body.leonixAdId : null,
      packageKey: String(body.packageKey ?? ""),
      amountCents: Number(body.amountCents ?? 0),
      method: String(body.method ?? "other") as ManualPaymentMethod,
      receivedAt: typeof body.receivedAt === "string" ? body.receivedAt : null,
      evidenceReference: typeof body.evidenceReference === "string" ? body.evidenceReference : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }

  const paymentRecordId = String(body.paymentRecordId ?? "").trim();
  if (!paymentRecordId) {
    return NextResponse.json({ ok: false, code: "payment_record_id_required" }, { status: 400 });
  }

  if (action === "verify_cleared") {
    const result = await verifyManualPaymentCleared({ adminUserId, paymentRecordId });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }
  if (action === "reject") {
    const result = await markManualPaymentRejected({
      adminUserId,
      paymentRecordId,
      reason: typeof body.reason === "string" ? body.reason : null,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }
  if (action === "reverse") {
    const result = await markManualPaymentReversed({
      adminUserId,
      paymentRecordId,
      reason: typeof body.reason === "string" ? body.reason : null,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  }

  return NextResponse.json({ ok: false, code: "unknown_action" }, { status: 400 });
}
