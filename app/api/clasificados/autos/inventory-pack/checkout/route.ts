import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { validateAutosDealerInventoryAddonOwnershipForApplication } from "@/app/lib/clasificados/autos/autosDealerInventoryBoostOwnership";
import {
  buildCheckoutCancelUrl,
  buildCheckoutSuccessUrl,
  buildRevenueStripeLineItems,
  isRevenueStripeEnvConfigured,
  isRevenueSupabaseAdminConfigured,
  validateRevenueCheckoutAddOns,
  validateRevenueCheckoutRequest,
} from "@/app/lib/listingPlans/revenueCheckout";
import { AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  attachStripeSessionToPaymentRecord,
  createPendingPaymentRecord,
} from "@/app/lib/listingPlans/revenuePaymentRecords";
import { createRevenueStripeCheckoutSession } from "@/app/lib/listingPlans/revenueStripe";
import {
  resolveRevenueCategoryDefaultReturnPath,
  sanitizeRevenueOsReturnPath,
} from "@/app/lib/listingPlans/revenueOsReturnPath";
import {
  appendAutosInventoryBoostSuccessQuery,
  ensureAutosNegociosDraftBoostReturnFocus,
} from "@/app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract";
import {
  attachStripeIdentitiesToConsent,
  createRecurringConsentRecord,
  parseRecurringConsentAcknowledgment,
} from "@/app/lib/listingPlans/recurringConsent";
import {
  computeCheckoutAttemptKey,
  findOpenCheckoutAttempt,
  releaseStaleCheckoutAttempt,
} from "@/app/lib/listingPlans/revenuePaymentRecords";
import { retrieveRevenueCheckoutSessionState } from "@/app/lib/listingPlans/revenueStripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  listingId?: string;
  leonixAdId?: string | null;
  lang?: "es" | "en";
  returnPath?: string | null;
  customerEmail?: string | null;
  /** Package C Build 1 — affirmative recurring consent (monthly subscription add-on). */
  recurringConsent?: unknown;
};

/**
 * Autos Negocios Inventory Boost checkout for draft/pending/active dealer listings.
 * Pre-publish activation path — does not require listing status === active.
 */
export async function POST(request: NextRequest) {
  if (!isRevenueStripeEnvConfigured()) {
    return NextResponse.json(
      { ok: false, code: "stripe_not_configured", message: "Stripe is not configured." },
      { status: 503 },
    );
  }

  if (!isRevenueSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, code: "supabase_not_configured", message: "Supabase admin is not configured." },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json", message: "Invalid JSON body." }, { status: 400 });
  }

  const bearerUserId = await getBearerUserId(request);
  const listingId = String(body.listingId ?? "").trim();
  const ownerGate = await validateAutosDealerInventoryAddonOwnershipForApplication({
    listingId,
    bearerUserId,
  });
  if (!ownerGate.ok) {
    return NextResponse.json(
      { ok: false, code: ownerGate.code, message: ownerGate.message },
      { status: ownerGate.status },
    );
  }

  // Package C Build 1 — role guard the application validator lacks: the Inventory Boost is a
  // PARENT commercial capability; an inventory_vehicle child must never purchase it against
  // itself (asymmetry with the canonical route's strict validator, closed here).
  {
    const { getAdminSupabase } = await import("@/app/lib/supabase/server");
    const { data: roleRow } = await getAdminSupabase()
      .from("autos_classifieds_listings")
      .select("inventory_role")
      .eq("id", listingId)
      .maybeSingle();
    const role = String(roleRow?.inventory_role ?? "").trim().toLowerCase();
    if (role === "inventory_vehicle") {
      return NextResponse.json(
        {
          ok: false,
          code: "child_listing_not_eligible",
          message: "Inventory Boost must be purchased from the dealer parent listing.",
        },
        { status: 422 },
      );
    }
  }

  const checkoutBody = {
    category: "autos",
    packageKey: AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
    listingId,
    leonixAdId: body.leonixAdId?.trim() || null,
    locale: body.lang === "en" ? "en" : "es",
    returnPath: body.returnPath?.trim() || null,
    customerEmail: body.customerEmail?.trim() || null,
    ownerUserId: bearerUserId,
  } as const;

  const addOnValidation = validateRevenueCheckoutAddOns({
    category: checkoutBody.category,
    basePackageKey: checkoutBody.packageKey,
    addOns: undefined,
  });
  if (!addOnValidation.ok) {
    return NextResponse.json(
      { ok: false, code: addOnValidation.code, message: addOnValidation.message },
      { status: 400 },
    );
  }

  const validated = validateRevenueCheckoutRequest(
    {
      category: checkoutBody.category,
      packageKey: checkoutBody.packageKey,
      listingId: checkoutBody.listingId,
      leonixAdId: checkoutBody.leonixAdId,
      locale: checkoutBody.locale,
      returnPath: checkoutBody.returnPath,
      customerEmail: checkoutBody.customerEmail,
      ownerUserId: checkoutBody.ownerUserId,
    },
    { validatedAddOns: addOnValidation.addOns },
  );
  if (!validated.ok) {
    const status =
      validated.code === "package_not_stripe_eligible" ||
      validated.code === "package_is_free" ||
      validated.code === "checkout_not_required"
        ? 422
        : 400;
    return NextResponse.json(
      { ok: false, code: validated.code, message: validated.message },
      { status },
    );
  }

  const { packageDef, listingRef, amountCents, subtotalCents, addOns, currency, stripeMode } = validated;
  const locale = checkoutBody.locale === "en" ? "en" : "es";
  const returnFallback = resolveRevenueCategoryDefaultReturnPath(packageDef.category, locale);
  const draftFocusedReturn = ensureAutosNegociosDraftBoostReturnFocus(checkoutBody.returnPath, locale);
  const safeReturnPath = sanitizeRevenueOsReturnPath(draftFocusedReturn, returnFallback);

  // Package C Build 1 — recurring consent (monthly add-on) + purchase-attempt identity, same
  // rules as the canonical checkout route this side-door mirrors.
  if (!bearerUserId) {
    return NextResponse.json(
      { ok: false, code: "auth_required", message: "Sign in to start a subscription." },
      { status: 401 },
    );
  }
  const consentResult = await createRecurringConsentRecord({
    acknowledgment: parseRecurringConsentAcknowledgment(body.recurringConsent),
    ownerUserId: bearerUserId,
    customerEmail: checkoutBody.customerEmail,
    category: packageDef.category,
    listingId: listingRef || null,
    packageKey: packageDef.packageKey,
    amountCents,
    sourceSurface: "dashboard_upgrade",
  });
  if (!consentResult.ok) {
    return NextResponse.json(
      { ok: false, code: consentResult.code, message: consentResult.message },
      { status: consentResult.code === "consent_write_failed" ? 500 : 422 },
    );
  }

  const checkoutAttemptKey = computeCheckoutAttemptKey({
    ownerUserId: bearerUserId,
    listingSource: packageDef.category,
    listingId: listingRef,
    packageKey: packageDef.packageKey,
    billingMode: packageDef.billingMode,
    operation: "boost_addon",
  });
  let attemptGeneration = 1;
  const existingAttempt = await findOpenCheckoutAttempt(checkoutAttemptKey);
  if (existingAttempt) {
    if (existingAttempt.stripe_checkout_session_id) {
      const sessionState = await retrieveRevenueCheckoutSessionState(existingAttempt.stripe_checkout_session_id);
      if (sessionState.status === "open" && sessionState.url) {
        return NextResponse.json({
          ok: true,
          checkoutUrl: sessionState.url,
          paymentRecordId: existingAttempt.id,
          stripeCheckoutSessionId: existingAttempt.stripe_checkout_session_id,
          amountCents,
          currency,
          mode: stripeMode,
          reusedSession: true,
        });
      }
    }
    await releaseStaleCheckoutAttempt(existingAttempt.id);
    attemptGeneration = Math.max(1, existingAttempt.attempt_generation ?? 1) + 1;
  }

  const paymentInsert = await createPendingPaymentRecord({
    category: packageDef.category,
    packageKey: packageDef.packageKey,
    packageDef,
    amountCents,
    subtotalCents,
    addOns,
    currency,
    listingId: listingRef,
    leonixAdId: checkoutBody.leonixAdId,
    ownerUserId: bearerUserId,
    customerEmail: checkoutBody.customerEmail,
    addonOnly: true,
    checkoutAttemptKey,
    attemptGeneration,
  });

  if (!paymentInsert.ok) {
    if (paymentInsert.code === "open_attempt_exists") {
      const winner = await findOpenCheckoutAttempt(checkoutAttemptKey);
      if (winner?.stripe_checkout_session_id) {
        const sessionState = await retrieveRevenueCheckoutSessionState(winner.stripe_checkout_session_id);
        if (sessionState.status === "open" && sessionState.url) {
          return NextResponse.json({
            ok: true,
            checkoutUrl: sessionState.url,
            paymentRecordId: winner.id,
            stripeCheckoutSessionId: winner.stripe_checkout_session_id,
            amountCents,
            currency,
            mode: stripeMode,
            reusedSession: true,
          });
        }
      }
      return NextResponse.json(
        { ok: false, code: "checkout_attempt_in_progress", message: "A checkout for this purchase is already being prepared. Try again in a moment." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, code: paymentInsert.code, message: paymentInsert.message },
      { status: 500 },
    );
  }

  const successUrl = appendAutosInventoryBoostSuccessQuery(
    buildCheckoutSuccessUrl({
      category: packageDef.category,
      packageKey: packageDef.packageKey,
      locale: checkoutBody.locale,
      returnPath: safeReturnPath,
    }),
    "draft",
  );

  const cancelUrl = buildCheckoutCancelUrl({
    category: packageDef.category,
    packageKey: packageDef.packageKey,
    listingId: listingRef,
    locale: checkoutBody.locale,
    returnPath: safeReturnPath,
  });

  const stripeLineItems = buildRevenueStripeLineItems({
    basePackageDef: packageDef,
    addOns,
    subtotalCents,
    finalAmountCents: amountCents,
  });

  const stripeResult = await createRevenueStripeCheckoutSession({
    packageDef,
    amountCents,
    lineItems: stripeLineItems,
    currency,
    stripeMode,
    successUrl,
    cancelUrl,
    customerEmail: checkoutBody.customerEmail,
    clientReferenceId: paymentInsert.paymentRecordId,
    paymentRecordId: paymentInsert.paymentRecordId,
    ownerUserId: bearerUserId,
    listingId: listingRef,
    leonixAdId: checkoutBody.leonixAdId,
    checkoutAttemptKey,
    attemptGeneration,
    consentRecordId: consentResult.consentId,
  });

  if (!stripeResult.ok) {
    return NextResponse.json(
      { ok: false, code: stripeResult.code, message: stripeResult.message },
      { status: 502 },
    );
  }

  await attachStripeSessionToPaymentRecord({
    paymentRecordId: paymentInsert.paymentRecordId,
    stripeCheckoutSessionId: stripeResult.sessionId,
  });

  await attachStripeIdentitiesToConsent(consentResult.consentId, {
    stripeCheckoutSessionId: stripeResult.sessionId,
    paymentRecordId: paymentInsert.paymentRecordId,
  });

  return NextResponse.json({
    ok: true,
    checkoutUrl: stripeResult.checkoutUrl,
    paymentRecordId: paymentInsert.paymentRecordId,
    stripeCheckoutSessionId: stripeResult.sessionId,
    amountCents,
    currency,
    mode: stripeMode,
  });
}
