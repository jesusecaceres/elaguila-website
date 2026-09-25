/**
 * LEGACY SUBSCRIPTION ADOPTION — pure decision (no DB, no Stripe, no env).
 *
 * THE DEFECT THIS CLOSES (proven against real rows, 2026-09-24)
 * Monthly renewals extend an entitlement ONLY through a `leonix_subscription_records` row
 * (`handleInvoicePaid` ignores a subscription with no record as `not_leonix_subscription`). Business
 * subscriptions paid BEFORE that table existed (Servicios `autos-mechanics`, Restaurantes
 * `12582849…` / `cd914354…`, July 2026) never got a record, so their entitlement kept the original
 * 30-day `ends_at` while Stripe kept billing and the subscription stayed `active`. Result: a genuinely
 * paid $399 PRO listing reads "expired" and the coupons module says "activate or renew your plan".
 *
 * THE RULE
 * A record may be adopted ONLY from real payment evidence in OUR database, never from URL, listing
 * status, business name, owner account or Stripe metadata alone. Stripe metadata is a CLAIM; it is
 * accepted only when it agrees with a `leonix_payment_records` row that is paid, carries this exact
 * `stripe_subscription_id`, and names the same category, listing and package — and a non-revoked
 * entitlement of that same package exists for that listing. Anything short of that is refused.
 *
 * Adoption never creates or upgrades an entitlement. It only makes an EXISTING, payment-backed
 * entitlement renewable, so it cannot turn BASE into PRO or fabricate Full from nothing.
 */

export type LegacyAdoptionPaymentFacts = {
  id: string;
  category: string | null;
  listingId: string | null;
  packageKey: string | null;
  paymentStatus: string | null;
  stripeSubscriptionId: string | null;
  ownerUserId: string | null;
};

export type LegacyAdoptionEntitlementFacts = {
  id: string;
  category: string | null;
  listingId: string | null;
  packageKey: string | null;
  grantSource: string | null;
  status: string;
  paymentRecordId: string | null;
  subscriptionRecordId: string | null;
};

export type LegacyAdoptionDecision =
  | {
      adopt: true;
      category: string;
      listingId: string;
      packageKey: string;
      paymentRecordId: string;
      ownerUserId: string | null;
      entitlementId: string;
      /** Other non-revoked rows the SAME payment created (e.g. the offers add-on billed on the same subscription). */
      companionEntitlementIds: string[];
    }
  | { adopt: false; reason: LegacyAdoptionRefusal };

export type LegacyAdoptionRefusal =
  | "subscription_not_active"
  | "metadata_incomplete"
  | "payment_record_missing"
  | "payment_not_paid"
  | "payment_subscription_mismatch"
  | "payment_identity_mismatch"
  | "no_matching_entitlement"
  | "ambiguous_entitlement"
  | "entitlement_revoked";

/** Stripe statuses that mean the customer is still being billed and is entitled to the paid period. */
const RENEWABLE_STRIPE_STATUSES = new Set(["active", "trialing"]);

const clean = (v: unknown): string => String(v ?? "").trim();

export function decideLegacySubscriptionAdoption(input: {
  stripeSubscriptionId: string;
  stripeStatus: string | null;
  metadata: Record<string, string> | null | undefined;
  payment: LegacyAdoptionPaymentFacts | null;
  entitlements: readonly LegacyAdoptionEntitlementFacts[];
}): LegacyAdoptionDecision {
  if (!RENEWABLE_STRIPE_STATUSES.has(clean(input.stripeStatus))) {
    return { adopt: false, reason: "subscription_not_active" };
  }
  const md = input.metadata ?? {};
  const mdPaymentId = clean(md.leonix_payment_record_id);
  const mdCategory = clean(md.leonix_category);
  const mdListingId = clean(md.leonix_listing_id);
  const mdPackageKey = clean(md.leonix_package_key);
  if (!mdPaymentId || !mdCategory || !mdListingId || !mdPackageKey) {
    return { adopt: false, reason: "metadata_incomplete" };
  }

  const payment = input.payment;
  if (!payment || clean(payment.id) !== mdPaymentId) return { adopt: false, reason: "payment_record_missing" };
  if (clean(payment.paymentStatus) !== "paid") return { adopt: false, reason: "payment_not_paid" };
  if (clean(payment.stripeSubscriptionId) !== clean(input.stripeSubscriptionId)) {
    return { adopt: false, reason: "payment_subscription_mismatch" };
  }
  if (
    clean(payment.category) !== mdCategory ||
    clean(payment.listingId) !== mdListingId ||
    clean(payment.packageKey) !== mdPackageKey
  ) {
    return { adopt: false, reason: "payment_identity_mismatch" };
  }

  // The entitlement this payment created: linked by payment_record_id first; otherwise the single
  // Stripe-granted row of the SAME package for the SAME listing. `listing_source` is never a filter —
  // it has been written inconsistently ("servicios" vs "servicios_public_listings").
  const sameListingPackage = input.entitlements.filter(
    (e) => clean(e.listingId) === mdListingId && clean(e.packageKey) === mdPackageKey && clean(e.category) === mdCategory,
  );
  const linked = sameListingPackage.filter((e) => clean(e.paymentRecordId) === mdPaymentId);
  const candidates =
    linked.length > 0
      ? linked
      : sameListingPackage.filter((e) => clean(e.grantSource) === "stripe_webhook" && !clean(e.paymentRecordId));
  if (candidates.length === 0) return { adopt: false, reason: "no_matching_entitlement" };
  const nonRevoked = candidates.filter((e) => clean(e.status) !== "revoked");
  if (nonRevoked.length === 0) return { adopt: false, reason: "entitlement_revoked" };
  if (nonRevoked.length > 1) return { adopt: false, reason: "ambiguous_entitlement" };

  return {
    adopt: true,
    category: mdCategory,
    listingId: mdListingId,
    packageKey: mdPackageKey,
    paymentRecordId: mdPaymentId,
    ownerUserId: clean(payment.ownerUserId) || clean(md.leonix_owner_user_id) || null,
    entitlementId: nonRevoked[0]!.id,
    companionEntitlementIds: input.entitlements
      .filter(
        (e) =>
          clean(e.paymentRecordId) === mdPaymentId &&
          clean(e.listingId) === mdListingId &&
          clean(e.status) !== "revoked" &&
          e.id !== nonRevoked[0]!.id,
      )
      .map((e) => e.id),
  };
}
