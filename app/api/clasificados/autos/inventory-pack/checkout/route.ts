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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  listingId?: string;
  leonixAdId?: string | null;
  lang?: "es" | "en";
  returnPath?: string | null;
  customerEmail?: string | null;
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
  const safeReturnPath = sanitizeRevenueOsReturnPath(checkoutBody.returnPath, returnFallback);

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
  });

  if (!paymentInsert.ok) {
    return NextResponse.json(
      { ok: false, code: paymentInsert.code, message: paymentInsert.message },
      { status: 500 },
    );
  }

  const successUrl = buildCheckoutSuccessUrl({
    category: packageDef.category,
    packageKey: packageDef.packageKey,
    locale: checkoutBody.locale,
    returnPath: safeReturnPath,
  });

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
