import { NextResponse, type NextRequest } from "next/server";
import {
  requireRevenueProtectedWriteAccess,
  revenueWriteDenialStatusCode,
} from "@/app/admin/_lib/adminAccessControl";
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
  // Final Pre-QA Security Hardening Gate (2026-09-10) — this route performs protected,
  // money-adjacent writes (record/verify_cleared grants a paid entitlement; reject/reverse
  // mutate a payment's disposition). Authorization must fail CLOSED and must not depend on the
  // optional ADMIN_ENFORCE_ROSTER_PERMISSIONS env flag — requireRevenueProtectedWriteAccess()
  // re-verifies the full staff identity chain on every request and explicitly denies the shared
  // bootstrap session. can_view_payments (a READ-only permission) is never consulted here.
  const access = await requireRevenueProtectedWriteAccess();
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", reason: access.reason },
      { status: revenueWriteDenialStatusCode(access.reason) },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }

  const action = String(body.action ?? "").trim();
  // Package E Build E3, Gate 4 — CRITICAL AUDIT FIX (unchanged doctrine, now on a stronger
  // guard). `adminUserId` is never read from the request body — it is always the real,
  // server-verified Supabase Auth user id resolved by requireRevenueProtectedWriteAccess()
  // above, never a client-suppliable value and never the literal "admin" fallback (that
  // fallback path no longer exists — bootstrap and unresolved identities are denied above,
  // before this line is ever reached).
  const adminUserId = access.actorAuthUserId;

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
