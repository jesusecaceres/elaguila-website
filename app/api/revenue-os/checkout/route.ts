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
  validateAutosDealerInventoryAddonOwnership,
  validateBienesInventoryAddonOwnership,
  type RevenueCheckoutRequest,
} from "@/app/lib/listingPlans/revenueCheckout";
import {
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  AUTOS_DEALER_MONTHLY_PACKAGE_KEY,
  AUTOS_PRIVADO_30D_PACKAGE_KEY,
  BR_INVENTORY_PACK_PACKAGE_KEY,
  EMPLEOS_JOB_POST_PAID_PACKAGE_KEY,
  OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY,
  OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY,
  SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  markOfertaLocalCheckoutStarted,
  validateOfertasLocalesCheckoutOwnership,
} from "@/app/lib/ofertas-locales/ofertasLocalesCommercialServer";
import type { OfertaLocalCommercialProduct } from "@/app/lib/ofertas-locales/ofertasLocalesCommercial";
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
import {
  validateAutosPrivadoActiveEditCheckoutOwnership,
  validateBrFsboActiveEditCheckoutOwnership,
  validateEmpleosJobPostActiveEditCheckoutOwnership,
} from "@/app/lib/listingLifecycle/activePaidEditCheckoutOwnership";
import { assertCommercialCapacityForWrite } from "@/app/lib/listingPlans/commercialWriteGuard";
import {
  isRevenueBaseEntitlementGuardedPackage,
  requiresBaseCheckout,
} from "@/app/lib/listingPlans/revenueActiveEntitlementGuard";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getVerifiedBearerUser } from "@/app/api/_lib/verifiedBearerUser";
import { hashVerifiedIdentity, maskVerifiedEmail, maskVerifiedPhone } from "@/app/lib/security/verifiedIdentityHash";
import { resolveCommercialBusinessIdentity } from "@/app/lib/listingPlans/commercialBusinessIdentity";
import { decideVerifiedIntroDiscountEligibility } from "@/app/lib/listingPlans/verifiedIntroDiscountPolicy";
import {
  reserveOrReuseVerifiedIntroDiscount,
  releaseVerifiedIntroDiscountReservation,
  attachStripeSessionToVerifiedIntroDiscountRedemption,
  attachVerifiedIntroDiscountRedemptionToPaymentRecord,
  type ReserveVerifiedIntroDiscountInput,
} from "@/app/lib/listingPlans/verifiedIntroDiscountRedemptions";
import { ensureVerifiedIntroDiscountStripeCoupon } from "@/app/lib/listingPlans/verifiedIntroDiscountStripeCoupon";

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
  const isOfertasLocalesCheckoutEarly =
    categoryEarly === "ofertas-locales" &&
    (packageKeyEarly === OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY ||
      packageKeyEarly === OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY);
  // Globalization Build C (RED #14) — these three one-time lanes always pass an existing
  // listingId (the row is pre-created in draft/pending status before checkout, same shape as
  // Comida Local's saveComidaLocalPendingBeforeCheckout), so the guard fires on every checkout
  // call for them, not just an explicit "renewal" operation — there is no renewal operation for
  // these packages, only "don't recharge a row that's already active."
  const isAutosPrivadoActiveEditEarly =
    categoryEarly === "autos" && packageKeyEarly === AUTOS_PRIVADO_30D_PACKAGE_KEY;
  const isBrFsboActiveEditEarly =
    categoryEarly === "bienes-raices" && packageKeyEarly === "br_fsbo_45d";
  const isEmpleosJobPostActiveEditEarly =
    categoryEarly === "empleos" && packageKeyEarly === EMPLEOS_JOB_POST_PAID_PACKAGE_KEY;

  // Package C Build 3 (C5/C6) — cheap, no-DB-call defense-in-depth: the retired restaurantes/
  // servicios offers add-ons can no longer be purchased standalone. The central guard
  // (validateRevenueCheckoutRequest's stripeEligible check, which every path eventually reaches)
  // already rejects these packageKeys too — this early check exists only to return a specific,
  // honest error before any ownership DB round-trip is wasted on an unsellable package.
  if (isRestauranteAddonOnlyEarly || isServiciosOffersAddonOnlyEarly) {
    return NextResponse.json(
      {
        ok: false,
        code: "addon_retired_included_in_base",
        message:
          "This add-on is no longer sold separately — coupons/offers are included with the active $399 base package.",
      },
      { status: 410 },
    );
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

  let serverVerifiedCurrentExpiresAt: string | null = null;
  let serverVerifiedLeonixAdId: string | null = null;
  let serverVerifiedOwnerUserId: string | null = null;
  let serverVerifiedOfertasProduct: OfertaLocalCommercialProduct | null = null;
  if (isOfertasLocalesCheckoutEarly) {
    const ownerGate = await validateOfertasLocalesCheckoutOwnership({
      supabase: getAdminSupabase(),
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
      packageKey: packageKeyEarly,
      operation: operationEarly,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
    serverVerifiedLeonixAdId = ownerGate.leonixAdId;
    serverVerifiedOwnerUserId = ownerGate.ownerUserId;
    serverVerifiedCurrentExpiresAt = ownerGate.currentExpiresAt ?? null;
    serverVerifiedOfertasProduct = ownerGate.product;
  }
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
  if (isAutosPrivadoActiveEditEarly) {
    const ownerGate = await validateAutosPrivadoActiveEditCheckoutOwnership({
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
    serverVerifiedOwnerUserId = ownerGate.ownerUserId;
  }
  if (isBrFsboActiveEditEarly) {
    const ownerGate = await validateBrFsboActiveEditCheckoutOwnership({
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
    serverVerifiedOwnerUserId = ownerGate.ownerUserId;
  }
  if (isEmpleosJobPostActiveEditEarly) {
    const ownerGate = await validateEmpleosJobPostActiveEditCheckoutOwnership({
      listingId: String(body.listingId ?? "").trim(),
      bearerUserId,
    });
    if (!ownerGate.ok) {
      return NextResponse.json(
        { ok: false, code: ownerGate.code, message: ownerGate.message },
        { status: ownerGate.status },
      );
    }
    serverVerifiedOwnerUserId = ownerGate.ownerUserId;
  }

  const ownerUserId = isRestauranteAddonOnlyEarly || isAutosDealerInventoryAddonEarly || isBienesInventoryAddonOnlyEarly || isServiciosOffersAddonOnlyEarly || isRentasRenewalEarly || isOfertasLocalesCheckoutEarly || isAutosPrivadoActiveEditEarly || isBrFsboActiveEditEarly || isEmpleosJobPostActiveEditEarly
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
  const requestVerifiedIntroDiscount = (body as Record<string, unknown>).requestVerifiedIntroDiscount === true;

  // ── Package C Build 2 (C4), decision 1 — never silently resolve a stacking conflict. ────
  // A crafted request carrying both a promo code and requestVerifiedIntroDiscount is rejected
  // outright, before either discount path runs. The real UI keeps the two mutually exclusive,
  // but the server is the actual security boundary, independent of client state.
  if (promoCodeRaw && requestVerifiedIntroDiscount) {
    return NextResponse.json(
      { ok: false, code: "discount_conflict", message: "Only one discount may be applied per checkout." },
      { status: 409 },
    );
  }
  const requestedDiscountSource: "promo_code" | "verified_intro_15" | null = promoCodeRaw
    ? "promo_code"
    : requestVerifiedIntroDiscount
    ? "verified_intro_15"
    : null;

  let promoTypeForRecord: string | undefined;
  let promoFamilyForRecord: string | null | undefined;
  let promoWebsiteCheckoutOnly: boolean | undefined;
  let promoBaseAmountForRecord: number | undefined;
  // Package F Build F2, promo concurrency closure — threaded to the atomic reservation RPC below.
  let promoPerCustomerLimitForRecord: number | null | undefined;
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
    promoPerCustomerLimitForRecord = promoResult.perCustomerLimit;
  }

  // ── Package C Build 2 (C4) — verified 15% introductory discount. ────────────────────────
  // Structurally mutually exclusive with the promo block above (guarded by requestedDiscountSource
  // being computed once, before either path runs). Server re-derives eligibility independently;
  // the client never asserts it.
  let verifiedIntroDiscountEligible = false;
  let verifiedIntroDiscountMechanism: "unit_amount_reduction" | "stripe_once_coupon" | null = null;
  let verifiedIntroDiscountCents = 0;
  let verifiedIntroDiscountStripeCouponId: string | null = null;
  let verifiedIntroDiscountReservationInput: Omit<ReserveVerifiedIntroDiscountInput, "checkoutAttemptKey"> | null = null;

  if (requestedDiscountSource === "verified_intro_15") {
    const prelim = validateRevenueCheckoutRequest(body, { validatedAddOns });
    if (!prelim.ok) {
      return NextResponse.json(
        { ok: false, code: prelim.code, message: prelim.message },
        { status: 400 },
      );
    }
    if (!ownerUserId) {
      return NextResponse.json(
        { ok: false, code: "auth_required", message: "Sign in to request the introductory discount." },
        { status: 401 },
      );
    }

    const verifiedUser = await getVerifiedBearerUser(request);
    const emailVerified = Boolean(verifiedUser?.emailConfirmedAt) && Boolean(verifiedUser?.email);
    const verifiedEmailIdentityHash = emailVerified ? hashVerifiedIdentity(String(verifiedUser?.email)) : null;
    if (emailVerified && !verifiedEmailIdentityHash) {
      return NextResponse.json(
        { ok: false, code: "identity_hash_unavailable", message: "Identity verification is temporarily unavailable." },
        { status: 503 },
      );
    }
    const verifiedEmailMasked = emailVerified ? maskVerifiedEmail(String(verifiedUser?.email)) : null;

    const supabaseForPhone = getAdminSupabase();
    const { data: phoneIdentityRow } = await supabaseForPhone
      .from("leonix_verified_phone_identities")
      .select("id, phone_e164")
      .eq("owner_user_id", ownerUserId)
      .maybeSingle();
    const phoneVerified = Boolean(phoneIdentityRow?.id);
    const verifiedPhoneIdentityHash = phoneVerified
      ? hashVerifiedIdentity(String(phoneIdentityRow?.phone_e164))
      : null;
    if (phoneVerified && !verifiedPhoneIdentityHash) {
      return NextResponse.json(
        { ok: false, code: "identity_hash_unavailable", message: "Identity verification is temporarily unavailable." },
        { status: 503 },
      );
    }
    const verifiedPhoneMasked = phoneVerified ? maskVerifiedPhone(String(phoneIdentityRow?.phone_e164)) : null;

    const business = await resolveCommercialBusinessIdentity({
      category: prelim.packageDef.category,
      listingSource: body.sourceTable ?? null,
      listingId: prelim.listingRef,
      ownerUserId,
    });

    const packageEligible =
      prelim.packageDef.promoEligible === true && prelim.packageDef.verifiedIntroDiscountEligible !== false;

    const eligibilityDecision = decideVerifiedIntroDiscountEligibility({
      emailVerified,
      phoneVerified,
      hasPriorRedemption: false, // the atomic reservation INSERT below is the real gate
      packageEligible,
      billingMode: prelim.packageDef.billingMode,
      activeDiscountSource: null,
    });

    if (!eligibilityDecision.eligible) {
      return NextResponse.json(
        {
          ok: false,
          code: eligibilityDecision.reasonCode,
          message: "The verified introductory discount is not available for this checkout.",
        },
        { status: 400 },
      );
    }

    verifiedIntroDiscountMechanism = eligibilityDecision.mechanism;

    // ── Decision 8 — coupon-first sequencing. Resolved BEFORE any reservation or payment-
    // record write. A requested-but-unavailable discount stops checkout creation entirely: no
    // Stripe session, no reservation, no payment record — never a silent full-price fallback.
    if (verifiedIntroDiscountMechanism === "stripe_once_coupon") {
      const couponResult = await ensureVerifiedIntroDiscountStripeCoupon();
      if (!couponResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: "verified_discount_temporarily_unavailable",
            message: "The introductory discount is temporarily unavailable. Retry, or continue without it.",
          },
          { status: 503 },
        );
      }
      verifiedIntroDiscountStripeCouponId = couponResult.couponId;
    } else {
      verifiedIntroDiscountCents = Math.floor((prelim.subtotalCents * 15) / 100);
      finalAmountCents = Math.max(0, prelim.subtotalCents - verifiedIntroDiscountCents);
    }

    verifiedIntroDiscountEligible = true;
    verifiedIntroDiscountReservationInput = {
      ownerUserId,
      verifiedEmailIdentityHash,
      verifiedEmailMasked,
      verifiedPhoneIdentityHash,
      verifiedPhoneMasked,
      phoneIdentityId: (phoneIdentityRow?.id as string | undefined) ?? null,
      businessIdentityType: business.identityType,
      businessIdentityKey: business.identityKey,
      businessIdentityFallbackReason: business.fallbackReason,
      category: prelim.packageDef.category,
      packageKey: prelim.packageDef.packageKey,
      listingId: prelim.listingRef,
      leonixAdId: body.leonixAdId ?? null,
      verificationMethod: emailVerified ? "email" : "sms",
      baseAmountCents: prelim.subtotalCents,
      discountCents: verifiedIntroDiscountCents,
    };
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

  // ── Revenue OS active-entitlement guard (shared, server-authoritative) ──────────────────
  // A listing/business that already has an ACTIVE base-package entitlement must never be sent
  // through Stripe Checkout for that same base package again — this is the actual choke point
  // every category's base-package checkout (Autos Dealer, Bienes Raíces, Servicios, Restaurantes,
  // Comida Local) funnels through, so one check here closes the gap for all five at once. Never
  // trusts client state — reads the real `listing_package_entitlements` table.
  if (isRevenueBaseEntitlementGuardedPackage(packageDef.category, packageDef.packageKey)) {
    const entitlementGuard = await requiresBaseCheckout({
      listingId: listingRef || null,
      ownerId: ownerUserId,
      category: packageDef.category,
      packageKey: packageDef.packageKey,
    });
    if (!entitlementGuard.requiresCheckout) {
      return NextResponse.json(
        {
          ok: false,
          code: "active_entitlement_no_recharge",
          message:
            "This listing already has an active base package — no additional charge is required. Save your edit instead of checking out again.",
          activeEntitlement: entitlementGuard.activeEntitlement,
        },
        { status: 409 },
      );
    }
  }

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
    : packageDef.category === "ofertas-locales"
    ? `/dashboard/ofertas-locales/${encodeURIComponent(listingRef)}?lang=${locale}`
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
    // Package C Build 2 (C4) — discount-source consistency: reusing a stale session priced
    // under a DIFFERENT discount source (e.g. a promo code was applied earlier and has since
    // been removed in favor of the verified-15 discount, or vice versa) would serve the wrong
    // price. Only reuse when the existing attempt's discount source matches this request's.
    const existingDiscountSource: "promo_code" | "verified_intro_15" | null = existingAttempt.promo_code_id
      ? "promo_code"
      : existingAttempt.verified_intro_discount_redemption_id
      ? "verified_intro_15"
      : null;
    const discountSourceMatches = existingDiscountSource === requestedDiscountSource;

    const priorSessionId = existingAttempt.stripe_checkout_session_id;
    if (discountSourceMatches && priorSessionId) {
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
          activeDiscountSource: existingDiscountSource,
        });
      }
    }
    // Stale (expired/completed-elsewhere/no session) OR a discount-source mismatch: release the
    // payment record AND any verified-15 reservation tied to this attempt key, then regenerate.
    await releaseStaleCheckoutAttempt(existingAttempt.id);
    if (existingAttempt.verified_intro_discount_redemption_id) {
      await releaseVerifiedIntroDiscountReservation(checkoutAttemptKey);
    }
    attemptGeneration = Math.max(1, existingAttempt.attempt_generation ?? 1) + 1;
  }

  // ── Package C Build 2 (C4) — atomic reservation. The four partial unique indexes on
  // leonix_verified_intro_discount_redemptions are the actual concurrency gate; this call
  // either reserves a fresh row, reuses the existing reservation for this exact attempt key, or
  // fails honestly with already_reserved/already_redeemed. Runs BEFORE the payment record so a
  // reservation never gets created after a payment record it can't be linked to.
  let verifiedIntroDiscountRedemptionId: string | undefined;
  if (verifiedIntroDiscountEligible && verifiedIntroDiscountReservationInput) {
    const reservation = await reserveOrReuseVerifiedIntroDiscount({
      ...verifiedIntroDiscountReservationInput,
      checkoutAttemptKey,
    });
    if (!reservation.ok) {
      return NextResponse.json(
        { ok: false, code: reservation.code, message: reservation.message },
        { status: 409 },
      );
    }
    verifiedIntroDiscountRedemptionId = reservation.redemptionId;
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
    discountCents: discountCents || verifiedIntroDiscountCents,
    promoCode: promoCodeRaw ?? null,
    discountType: promoTypeForRecord ?? (verifiedIntroDiscountEligible ? "verified_intro_15" : null),
    promoFamily: promoFamilyForRecord ?? null,
    promoWebsiteCheckoutOnly: promoWebsiteCheckoutOnly ?? false,
    promoBaseAmountCents: promoBaseAmountForRecord,
    addonOnly: isRestauranteAddonOnly || isBienesInventoryAddonOnly || isServiciosOffersAddonOnly,
    operation: body.operation === "renew_listing" ? "renew_listing" : null,
    sourceTable: isRentasRenewal ? "listings" : body.sourceTable,
    currentExpiresAt: isRentasRenewal || categoryEarly === "ofertas-locales" ? serverVerifiedCurrentExpiresAt ?? body.currentExpiresAt : body.currentExpiresAt,
    renewalAttemptId: categoryEarly === "ofertas-locales" ? body.renewalAttemptId : null,
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
    // Genuine failure (not a duplicate-attempt race) — release any reservation just made so an
    // unrelated DB error never permanently consumes the customer's one-time introductory benefit.
    if (verifiedIntroDiscountRedemptionId) {
      await releaseVerifiedIntroDiscountReservation(checkoutAttemptKey);
    }
    return NextResponse.json(
      { ok: false, code: paymentInsert.code, message: paymentInsert.message },
      { status: 500 },
    );
  }

  if (verifiedIntroDiscountRedemptionId) {
    await attachVerifiedIntroDiscountRedemptionToPaymentRecord({
      paymentRecordId: paymentInsert.paymentRecordId,
      redemptionId: verifiedIntroDiscountRedemptionId,
    });
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
      perCustomerLimit: promoPerCustomerLimitForRecord ?? null,
    });

    if (!redemptionInsert.ok) {
      // Package F Build F2, promo concurrency closure — a concurrent attempt that lost the
      // atomic reservation race surfaces the same truthful "promo_ineligible" shape and 400
      // status this route already uses for every other eligibility rejection above; a genuine
      // insert/RPC failure keeps the existing 500.
      return NextResponse.json(
        { ok: false, code: redemptionInsert.code, message: redemptionInsert.message },
        { status: redemptionInsert.code === "promo_ineligible" ? 400 : 500 },
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
    verifiedIntroDiscountStripeCouponId,
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

  if (serverVerifiedOfertasProduct && ownerUserId) {
    const parentMarked = await markOfertaLocalCheckoutStarted({
      supabase: getAdminSupabase(),
      listingId: listingRef,
      ownerId: ownerUserId,
      product: serverVerifiedOfertasProduct,
      leonixAdId: serverVerifiedLeonixAdId ?? "",
      paymentRecordId: paymentInsert.paymentRecordId,
      stripeCheckoutSessionId: stripeResult.sessionId,
    });
    if (!parentMarked) {
      return NextResponse.json(
        {
          ok: false,
          code: "ofertas_parent_checkout_summary_failed",
          message: "Checkout was created but the Ofertas listing could not be marked pending payment.",
        },
        { status: 500 },
      );
    }
  }

  if (verifiedIntroDiscountRedemptionId) {
    await attachStripeSessionToVerifiedIntroDiscountRedemption({
      redemptionId: verifiedIntroDiscountRedemptionId,
      stripeCheckoutSessionId: stripeResult.sessionId,
      stripeCouponId: verifiedIntroDiscountStripeCouponId,
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
    ...(verifiedIntroDiscountRedemptionId ? { verifiedIntroDiscountRedemptionId } : {}),
    activeDiscountSource: requestedDiscountSource,
  });
}
