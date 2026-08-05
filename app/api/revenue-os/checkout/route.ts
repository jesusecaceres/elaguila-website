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
  validateAutosDealerInventoryAddonOwnership,
  validateBienesInventoryAddonOwnership,
  validateServiciosOffersAddonOwnership,
  type RevenueCheckoutRequest,
} from "@/app/lib/listingPlans/revenueCheckout";
import {
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  AUTOS_DEALER_MONTHLY_PACKAGE_KEY,
  AUTOS_PRIVADO_30D_PACKAGE_KEY,
  BR_INVENTORY_PACK_PACKAGE_KEY,
  SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { setAutosListingPendingPayment } from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import {
  attachStripeSessionToPaymentRecord,
  attachPromoRedemptionToPaymentRecord,
  computeCheckoutAttemptKey,
  createPendingPaymentRecord,
  findOpenCheckoutAttempt,
  releaseStaleCheckoutAttempt,
} from "@/app/lib/listingPlans/revenuePaymentRecords";
import {
  attachStripeIdentitiesToConsent,
  createRecurringConsentRecord,
  packageRequiresRecurringConsent,
  parseRecurringConsentAcknowledgment,
} from "@/app/lib/listingPlans/recurringConsent";
import {
  attachStripeSessionToPromoRedemption,
  createPendingPromoRedemption,
  resolvePromoForCheckout,
} from "@/app/lib/listingPlans/revenuePromoRedemptions";
import {
  createRevenueStripeCheckoutSession,
  retrieveRevenueCheckoutSessionState,
} from "@/app/lib/listingPlans/revenueStripe";
import {
  buildDashboardMisAnunciosReturnPath,
  resolveRevenueCategoryDefaultReturnPath,
  sanitizeRevenueOsReturnPath,
} from "@/app/lib/listingPlans/revenueOsReturnPath";
import { validateRentasRenewalCheckoutOwnership } from "@/app/lib/listingLifecycle/listingRenewalFulfillment";
import { assertCommercialCapacityForWrite } from "@/app/lib/listingPlans/commercialWriteGuard";

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
  const operationEarly = body.operation === "renew_listing" ? "renew_listing" : null;
  const isRentasRenewalEarly =
    operationEarly === "renew_listing" && categoryEarly === "rentas" && packageKeyEarly === "rentas_30d";
  const isRestauranteAddonOnlyEarly =
    categoryEarly === "restaurantes" && packageKeyEarly === RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY;
  const isAutosDealerInventoryAddonEarly =
    categoryEarly === "autos" && packageKeyEarly === AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY;
  const isBienesInventoryAddonOnlyEarly =
    categoryEarly === "bienes-raices" && packageKeyEarly === BR_INVENTORY_PACK_PACKAGE_KEY;
  const isServiciosOffersAddonOnlyEarly =
    categoryEarly === "servicios" && packageKeyEarly === SERVICIOS_OFFERS_ADDON_PACKAGE_KEY;

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

  if (isAutosDealerInventoryAddonEarly) {
    const ownerGate = await validateAutosDealerInventoryAddonOwnership({
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
    // Package C Build 1 (decision 11) — no new add-on activation during grace/suspension.
    const guard = await assertCommercialCapacityForWrite({
      category: "autos",
      parentListingId: String(body.listingId ?? "").trim(),
      ownerUserId: bearerUserId ?? "",
      operation: "addon_checkout",
      capacityDelta: 1,
    });
    if (!guard.allowed) {
      return NextResponse.json(
        { ok: false, code: guard.code, message: guard.message },
        { status: 409 },
      );
    }
  }

  if (isBienesInventoryAddonOnlyEarly) {
    const ownerGate = await validateBienesInventoryAddonOwnership({
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
    // Package C Build 1 (decision 11) — no new add-on activation during grace/suspension.
    const guard = await assertCommercialCapacityForWrite({
      category: "bienes-raices",
      parentListingId: String(body.listingId ?? "").trim(),
      ownerUserId: bearerUserId ?? "",
      operation: "addon_checkout",
      capacityDelta: 1,
    });
    if (!guard.allowed) {
      return NextResponse.json(
        { ok: false, code: guard.code, message: guard.message },
        { status: 409 },
      );
    }
  }

  if (isServiciosOffersAddonOnlyEarly) {
    const ownerGate = await validateServiciosOffersAddonOwnership({
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

  let serverVerifiedCurrentExpiresAt: string | null = null;
  let serverVerifiedLeonixAdId: string | null = null;
  let serverVerifiedOwnerUserId: string | null = null;
  if (isRentasRenewalEarly) {
    const ownerGate = await validateRentasRenewalCheckoutOwnership({
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
    serverVerifiedCurrentExpiresAt = ownerGate.currentExpiresAt;
    serverVerifiedLeonixAdId = ownerGate.leonixAdId;
    serverVerifiedOwnerUserId = ownerGate.ownerUserId;
  }

  const ownerUserId = isRestauranteAddonOnlyEarly || isAutosDealerInventoryAddonEarly || isBienesInventoryAddonOnlyEarly || isServiciosOffersAddonOnlyEarly || isRentasRenewalEarly
    ? serverVerifiedOwnerUserId ?? bearerUserId
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
  let promoFamilyForRecord: string | null | undefined;
  let promoWebsiteCheckoutOnly: boolean | undefined;
  let promoBaseAmountForRecord: number | undefined;
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
    promoFamilyForRecord = promoResult.promoFamily;
    promoWebsiteCheckoutOnly = promoResult.websiteCheckoutOnly;
    promoBaseAmountForRecord = prelim.subtotalCents;
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
  const isBienesInventoryAddonOnly =
    packageDef.packageKey === BR_INVENTORY_PACK_PACKAGE_KEY &&
    packageDef.category === "bienes-raices";
  const isServiciosOffersAddonOnly =
    packageDef.packageKey === SERVICIOS_OFFERS_ADDON_PACKAGE_KEY &&
    packageDef.category === "servicios";
  const isRentasRenewal =
    body.operation === "renew_listing" &&
    packageDef.packageKey === "rentas_30d" &&
    packageDef.category === "rentas";
  const returnFallback = isRestauranteAddonOnly
    ? buildDashboardMisAnunciosReturnPath(locale, "restaurantes")
    : isBienesInventoryAddonOnly
    ? buildDashboardMisAnunciosReturnPath(locale, "bienes-raices")
    : isRentasRenewal
    ? buildDashboardMisAnunciosReturnPath(locale, "rentas")
    : resolveRevenueCategoryDefaultReturnPath(packageDef.category, locale);
  const safeReturnPath = sanitizeRevenueOsReturnPath(body.returnPath, returnFallback);

  // ── Package C Build 1: recurring-billing consent (Agreement v1.2 §17). ──────────────────
  // Subscription-mode packages hard-require an affirmative, versioned consent record written
  // BEFORE session creation. One-time and free products never require it.
  let consentRecordId: string | null = null;
  if (packageRequiresRecurringConsent(packageDef)) {
    if (!ownerUserId) {
      return NextResponse.json(
        { ok: false, code: "auth_required", message: "Sign in to start a subscription." },
        { status: 401 },
      );
    }
    const acknowledgment = parseRecurringConsentAcknowledgment(
      (body as Record<string, unknown>).recurringConsent,
    );
    const consentResult = await createRecurringConsentRecord({
      acknowledgment,
      ownerUserId,
      customerEmail: body.customerEmail ?? null,
      category: packageDef.category,
      listingSource: body.sourceTable ?? null,
      listingId: listingRef || null,
      packageKey: packageDef.packageKey,
      amountCents,
    });
    if (!consentResult.ok) {
      return NextResponse.json(
        { ok: false, code: consentResult.code, message: consentResult.message },
        { status: consentResult.code === "consent_write_failed" ? 500 : 422 },
      );
    }
    consentRecordId = consentResult.consentId;
  }

  // ── Package C Build 1: server-enforced purchase-attempt identity (P0). ──────────────────
  // One unresolved attempt per stable purchase key; duplicate clicks / second tabs reuse the
  // open Stripe session; a genuinely new attempt requires the prior one resolved or stale.
  const checkoutAttemptKey = computeCheckoutAttemptKey({
    ownerUserId,
    listingSource: body.sourceTable ?? packageDef.category,
    listingId: listingRef,
    packageKey: packageDef.packageKey,
    addOns: addOns.map((a) => ({ key: a.key, quantity: a.quantity })),
    billingMode: packageDef.billingMode,
    operation: isRentasRenewal ? "renew_listing" : null,
  });
  let attemptGeneration = 1;
  const existingAttempt = await findOpenCheckoutAttempt(checkoutAttemptKey);
  if (existingAttempt) {
    const priorSessionId = existingAttempt.stripe_checkout_session_id;
    if (priorSessionId) {
      const sessionState = await retrieveRevenueCheckoutSessionState(priorSessionId);
      if (sessionState.status === "open" && sessionState.url) {
        return NextResponse.json({
          ok: true,
          checkoutUrl: sessionState.url,
          paymentRecordId: existingAttempt.id,
          stripeCheckoutSessionId: priorSessionId,
          amountCents,
          currency,
          mode: stripeMode,
          reusedSession: true,
        });
      }
    }
    // Stale (expired/completed-elsewhere/no session): release and begin the next generation.
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
    leonixAdId: serverVerifiedLeonixAdId ?? body.leonixAdId,
    ownerUserId,
    customerEmail: body.customerEmail,
    promoCodeId,
    discountCents,
    promoCode: promoCodeRaw ?? null,
    discountType: promoTypeForRecord ?? null,
    promoFamily: promoFamilyForRecord ?? null,
    promoWebsiteCheckoutOnly: promoWebsiteCheckoutOnly ?? false,
    promoBaseAmountCents: promoBaseAmountForRecord,
    addonOnly: isRestauranteAddonOnly || isBienesInventoryAddonOnly || isServiciosOffersAddonOnly,
    operation: isRentasRenewal ? "renew_listing" : null,
    sourceTable: isRentasRenewal ? "listings" : body.sourceTable,
    currentExpiresAt: isRentasRenewal ? serverVerifiedCurrentExpiresAt : body.currentExpiresAt,
    returnContext: isRentasRenewal ? body.returnContext ?? "owner_dashboard" : body.returnContext,
    checkoutAttemptKey,
    attemptGeneration,
  });

  if (!paymentInsert.ok) {
    // Concurrent double-click: another request won the attempt slot between our pre-select and
    // insert. Hand back the winner's open session when it exists; otherwise tell the client to
    // retry — never mint a second payable session for the same unresolved purchase.
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
        {
          ok: false,
          code: "checkout_attempt_in_progress",
          message: "A checkout for this purchase is already being prepared. Try again in a moment.",
        },
        { status: 409 },
      );
    }
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
    leonixAdId: serverVerifiedLeonixAdId ?? body.leonixAdId,
    promoCodeId,
    promoRedemptionId,
    checkoutAttemptKey,
    attemptGeneration,
    consentRecordId,
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

  if (consentRecordId) {
    await attachStripeIdentitiesToConsent(consentRecordId, {
      stripeCheckoutSessionId: stripeResult.sessionId,
      paymentRecordId: paymentInsert.paymentRecordId,
    });
  }

  if (promoRedemptionId) {
    await attachStripeSessionToPromoRedemption({
      redemptionId: promoRedemptionId,
      stripeCheckoutSessionId: stripeResult.sessionId,
    });
  }

  if (
    packageDef.category === "autos" &&
    (packageDef.packageKey === AUTOS_PRIVADO_30D_PACKAGE_KEY ||
      packageDef.packageKey === AUTOS_DEALER_MONTHLY_PACKAGE_KEY) &&
    listingRef
  ) {
    await setAutosListingPendingPayment(listingRef, stripeResult.sessionId);
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
