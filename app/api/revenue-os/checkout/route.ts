import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import {
  buildCheckoutCancelUrl,
  buildCheckoutSuccessUrl,
  buildRevenueStripeLineItems,
  isRevenueStripeEnvConfigured,
  isRevenueSupabaseAdminConfigured,
  RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY,
  validateRevenueCheckoutAddOns,
  validateRevenueCheckoutRequest,
  validateRestauranteAddonOnlyListingOwnership,
  type RevenueCheckoutRequest,
} from "@/app/lib/listingPlans/revenueCheckout";
import {
  attachStripeSessionToPaymentRecord,
  attachPromoRedemptionToPaymentRecord,
  createPendingPaymentRecord,
} from "@/app/lib/listingPlans/revenuePaymentRecords";
import {
  attachStripeSessionToPromoRedemption,
  createPendingPromoRedemption,
  resolvePromoForCheckout,
} from "@/app/lib/listingPlans/revenuePromoRedemptions";
import { createRevenueStripeCheckoutSession } from "@/app/lib/listingPlans/revenueStripe";
import {
  buildDashboardMisAnunciosReturnPath,
  resolveRevenueCategoryDefaultReturnPath,
  sanitizeRevenueOsReturnPath,
} from "@/app/lib/listingPlans/revenueOsReturnPath";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  let body: RevenueCheckoutRequest;
  try {
    body = (await request.json()) as RevenueCheckoutRequest;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_json", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const bearerUserId = await getBearerUserId(request);

  const categoryEarly = String(body.category ?? "").trim().toLowerCase();
  const packageKeyEarly = String(body.packageKey ?? "").trim().toLowerCase();
  const isRestauranteAddonOnlyEarly =
    categoryEarly === "restaurantes" && packageKeyEarly === RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY;

  if (isRestauranteAddonOnlyEarly) {
    const ownerGate = await validateRestauranteAddonOnlyListingOwnership({
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
  }

  const ownerUserId = isRestauranteAddonOnlyEarly
    ? bearerUserId
    : body.ownerUserId?.trim() || bearerUserId || null;

  const addOnValidation = validateRevenueCheckoutAddOns({
    category: String(body.category ?? "").trim().toLowerCase(),
    basePackageKey: String(body.packageKey ?? "").trim().toLowerCase(),
    addOns: body.addOns,
  });
  if (!addOnValidation.ok) {
    return NextResponse.json(
      { ok: false, code: addOnValidation.code, message: addOnValidation.message },
      { status: 400 },
    );
  }

  const validatedAddOns = addOnValidation.addOns;

  let finalAmountCents: number | undefined;
  let promoCodeId: string | undefined;
  let discountCents = 0;

  const promoCodeRaw = body.promoCode?.trim();
  let promoTypeForRecord: string | undefined;
  if (promoCodeRaw) {
    const prelim = validateRevenueCheckoutRequest(body, { validatedAddOns });
    if (!prelim.ok) {
      return NextResponse.json(
        { ok: false, code: prelim.code, message: prelim.message },
        { status: 400 },
      );
    }

    const promoResult = await resolvePromoForCheckout({
      promoCode: promoCodeRaw,
      packageDef: prelim.packageDef,
      baseAmountCents: prelim.subtotalCents,
      ownerUserId,
      email: body.customerEmail,
    });

    if (!promoResult.ok) {
      return NextResponse.json(
        { ok: false, code: promoResult.code, message: promoResult.message },
        { status: 400 },
      );
    }

    if (!promoResult.requiresCheckout) {
      return NextResponse.json(
        {
          ok: false,
          code: promoResult.code,
          message: promoResult.message,
        },
        { status: 422 },
      );
    }

    promoCodeId = promoResult.promoCodeId;
    discountCents = promoResult.discountCents;
    finalAmountCents = promoResult.finalAmountCents;
    promoTypeForRecord = promoResult.promoType;
  }

  const validated = validateRevenueCheckoutRequest(body, {
    finalAmountCents,
    validatedAddOns,
  });
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

  const locale = body.locale === "en" ? "en" : "es";
  const isRestauranteAddonOnly =
    packageDef.packageKey === RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY &&
    packageDef.category === "restaurantes";
  const returnFallback = isRestauranteAddonOnly
    ? buildDashboardMisAnunciosReturnPath(locale, "restaurantes")
    : resolveRevenueCategoryDefaultReturnPath(packageDef.category, locale);
  const safeReturnPath = sanitizeRevenueOsReturnPath(body.returnPath, returnFallback);

  const paymentInsert = await createPendingPaymentRecord({
    category: packageDef.category,
    packageKey: packageDef.packageKey,
    packageDef,
    amountCents,
    subtotalCents,
    addOns,
    currency,
    listingId: listingRef,
    leonixAdId: body.leonixAdId,
    ownerUserId,
    customerEmail: body.customerEmail,
    promoCodeId,
    discountCents,
    promoCode: promoCodeRaw ?? null,
    discountType: promoTypeForRecord ?? null,
    addonOnly: isRestauranteAddonOnly,
  });

  if (!paymentInsert.ok) {
    return NextResponse.json(
      { ok: false, code: paymentInsert.code, message: paymentInsert.message },
      { status: 500 },
    );
  }

  let promoRedemptionId: string | undefined;

  if (promoCodeId && promoCodeRaw) {
    const redemptionInsert = await createPendingPromoRedemption({
      promoCodeId,
      paymentRecordId: paymentInsert.paymentRecordId,
      ownerUserId,
      email: body.customerEmail,
      listingId: listingRef,
      leonixAdId: body.leonixAdId,
      category: packageDef.category,
      packageKey: packageDef.packageKey,
      placementTier: packageDef.placementTierKey,
      discountCents,
    });

    if (!redemptionInsert.ok) {
      return NextResponse.json(
        { ok: false, code: redemptionInsert.code, message: redemptionInsert.message },
        { status: 500 },
      );
    }

    promoRedemptionId = redemptionInsert.redemptionId;

    await attachPromoRedemptionToPaymentRecord({
      paymentRecordId: paymentInsert.paymentRecordId,
      promoRedemptionId,
    });
  }

  const successUrl = buildCheckoutSuccessUrl({
    category: packageDef.category,
    packageKey: packageDef.packageKey,
    locale: body.locale,
    returnPath: safeReturnPath,
  });

  const cancelUrl = buildCheckoutCancelUrl({
    category: packageDef.category,
    packageKey: packageDef.packageKey,
    listingId: listingRef,
    locale: body.locale,
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
    customerEmail: body.customerEmail,
    clientReferenceId: paymentInsert.paymentRecordId,
    paymentRecordId: paymentInsert.paymentRecordId,
    ownerUserId,
    listingId: listingRef,
    leonixAdId: body.leonixAdId,
    promoCodeId,
    promoRedemptionId,
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

  if (promoRedemptionId) {
    await attachStripeSessionToPromoRedemption({
      redemptionId: promoRedemptionId,
      stripeCheckoutSessionId: stripeResult.sessionId,
    });
  }

  return NextResponse.json({
    ok: true,
    checkoutUrl: stripeResult.checkoutUrl,
    paymentRecordId: paymentInsert.paymentRecordId,
    stripeCheckoutSessionId: stripeResult.sessionId,
    amountCents,
    currency,
    mode: stripeMode,
    ...(promoRedemptionId ? { promoRedemptionId } : {}),
  });
}
