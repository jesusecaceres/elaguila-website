import { NextResponse, type NextRequest } from "next/server";
import {
  requireRevenueProtectedWriteAccess,
  revenueWriteDenialStatusCode,
} from "@/app/admin/_lib/adminAccessControl";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { reconcileLegacySubscription } from "@/app/lib/listingPlans/revenueSubscriptionEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Targeted reconciliation of LEGACY Stripe subscriptions (paid before `leonix_subscription_records`
 * existed) whose monthly renewals never extended the entitlement. See
 * `app/lib/listingPlans/legacySubscriptionAdoption.ts` for the proven defect and the evidence rule.
 *
 * Body: { stripeSubscriptionId?: string, dryRun?: boolean }
 *   - dryRun defaults to TRUE; a write requires an explicit `dryRun: false`.
 *   - with no `stripeSubscriptionId` it SCANS candidate subscriptions (a Stripe-granted monthly
 *     entitlement with no subscription record) and reports each decision; the scan never writes.
 *
 * Same protected-write guard as manual payments (staff identity re-verified per request; the shared
 * bootstrap session is denied). Adoption never creates or upgrades an entitlement.
 */
export async function POST(request: NextRequest) {
  const access = await requireRevenueProtectedWriteAccess();
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", reason: access.reason },
      { status: revenueWriteDenialStatusCode(access.reason) },
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const stripeSubscriptionId = String(body.stripeSubscriptionId ?? "").trim();
  const dryRun = body.dryRun !== false;

  if (stripeSubscriptionId) {
    const result = await reconcileLegacySubscription({ stripeSubscriptionId, dryRun });
    return NextResponse.json({ ...result, dryRun }, { status: result.ok ? 200 : 422 });
  }

  // Scan: never writes, whatever `dryRun` says.
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ ok: false, code: "supabase_not_configured" }, { status: 503 });
  const supabase = getAdminSupabase();
  const { data: entitlements } = await supabase
    .from("listing_package_entitlements")
    .select("id, payment_record_id")
    .eq("grant_source", "stripe_webhook")
    .eq("billing_mode", "monthly_subscription")
    .is("subscription_record_id", null)
    .not("payment_record_id", "is", null);
  const paymentIds = [...new Set((entitlements ?? []).map((e) => String((e as { payment_record_id?: string }).payment_record_id ?? "")).filter(Boolean))];
  const subscriptionIds: string[] = [];
  if (paymentIds.length > 0) {
    const { data: payments } = await supabase
      .from("leonix_payment_records")
      .select("stripe_subscription_id")
      .in("id", paymentIds)
      .not("stripe_subscription_id", "is", null);
    for (const p of payments ?? []) {
      const id = String((p as { stripe_subscription_id?: string }).stripe_subscription_id ?? "").trim();
      if (id && !subscriptionIds.includes(id)) subscriptionIds.push(id);
    }
  }
  const candidates = [];
  for (const id of subscriptionIds) {
    const result = await reconcileLegacySubscription({ stripeSubscriptionId: id, dryRun: true });
    candidates.push({ stripeSubscriptionId: id, ok: result.ok, code: result.code, plannedEndsAt: result.plannedEndsAt ?? null });
  }
  return NextResponse.json({ ok: true, scan: true, dryRun: true, candidates });
}
