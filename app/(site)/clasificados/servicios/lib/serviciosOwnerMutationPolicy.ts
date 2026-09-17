/**
 * Gate SERVICIOS-P7-BLOCKER-REPAIR-01 — Repair A (SERVICIOS-PUBLISH-AUTHORITY-1).
 *
 * Pure owner-mutation authority for Servicios listings. Zero imports on purpose: every rule here
 * is executed directly by `scripts/verify-servicios-publish-authority.ts` under plain `tsx`, so the
 * regression tests exercise the SAME functions the routes call — not a re-implementation.
 *
 * Three launch-critical defects are closed by these rules:
 *
 *   B1 — OWNERSHIP. A NULL `owner_user_id` is not permission. The publish route used to treat a
 *        missing owner as "anyone may claim this row", which let any signed-in user overwrite a
 *        published listing and have the row re-assigned to themselves. Ownership is now exactly
 *        "the row has an owner AND it is the authenticated actor" — the rule the manage route
 *        already enforced. Historical unowned rows are reachable only through an admin/ownership-
 *        assignment path, never by implicit self-claim.
 *
 *   B2 — PAID REACTIVATION. Payment suspension deliberately never overwrites a paused row (the
 *        shared lifecycle treats paused as owner-owned), so a paused listing could outlive its
 *        subscription and later be resumed — or edit-saved back to `published` — for free.
 *        Visibility now only returns through Resume, and Resume requires the canonical base
 *        commercial right (see `decideServiciosReactivationAuthority`). An ordinary edit of a
 *        paused listing saves content and KEEPS it paused.
 *
 *   B3 — LEONIX AUTHORITY. `suspended` and `rejected` are Leonix-owned states. An owner save used
 *        to rewrite them (a pending-payment save moved them to `pending_payment`, after which a
 *        webhook would publish them). Owner saves now refuse those rows outright. Recovery from a
 *        payment suspension stays with the Revenue OS lifecycle (`liftPaymentSuspension` on
 *        `invoice.paid` / a won dispute) or with an admin. The listing-level `suspended_reason`
 *        cannot safely separate "self-recoverable" from "not": the chargeback path stamps the same
 *        `'payment'` value as a genuine lapse, and a lost dispute must stay with admin.
 */

/** B1 — the single ownership rule for every Servicios owner mutation. */
export function isServiciosListingOwner(
  rowOwnerUserId: string | null | undefined,
  actorUserId: string | null | undefined,
): boolean {
  const owner = String(rowOwnerUserId ?? "").trim();
  const actor = String(actorUserId ?? "").trim();
  return owner.length > 0 && actor.length > 0 && owner === actor;
}

/** B3 — statuses only Leonix (admin / moderation / the Revenue OS lifecycle) may move a row out of. */
export const SERVICIOS_LEONIX_LOCKED_STATUSES: ReadonlySet<string> = new Set(["suspended", "rejected"]);

/**
 * Pre-publication statuses: a pending-payment save of a row in one of these leaves it in
 * `pending_payment`, from which ONLY a paid `servicios_base_monthly` checkout can make it public.
 * Shared by the transition table and `serviciosSaveAwaitsBasePurchase` so the two cannot drift.
 */
export const SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES: ReadonlySet<string> = new Set([
  "pending_payment",
  "draft",
  "preview_ready",
  "publish_ready",
]);

/**
 * Repair B (B4) — does this save leave the listing awaiting its base purchase?
 *
 * When it does, the listing cannot become public except through a paid `servicios_base_monthly`
 * (the only Stripe-eligible Servicios package, and the only one `activatePaidServiciosListingFromRevenueOs`
 * accepts), and that package INCLUDES the `coupons_offers` capability. So offer content entered in
 * the application may persist on the pending row — otherwise a first-time customer's included
 * coupons would be stripped before they ever paid. This is status/package truth, never content
 * presence. A paused row is deliberately excluded (its re-purchase path needs an authority lookup);
 * its already-stored offers are preserved rather than accepting new edits while lapsed.
 */
export function serviciosSaveAwaitsBasePurchase(input: {
  hasExistingRow: boolean;
  previousStatus: string | null | undefined;
  pendingPaymentRequested: boolean;
}): boolean {
  if (!input.pendingPaymentRequested) return false;
  if (!input.hasExistingRow) return true; // a new row is inserted as pending_payment
  return SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES.has(String(input.previousStatus ?? "").trim().toLowerCase());
}

export type ServiciosOwnerSaveDecision =
  | {
      kind: "write";
      /** The listing_status the save may persist. */
      status: string;
      /** True only when the row is left in `pending_payment` for a Revenue OS checkout. */
      checkoutRequired: boolean;
    }
  | { kind: "refuse"; reason: "listing_locked_by_leonix" | "unknown_listing_status" };

/**
 * B2 + B3 — the complete status transition for an owner save that targets an EXISTING row
 * (ownership already proven by `isServiciosListingOwner`). New rows are not decided here.
 *
 * | existing            | pending-payment save                        | ordinary save          |
 * |---------------------|---------------------------------------------|------------------------|
 * | published           | published (never downgraded; no recharge)   | published              |
 * | paused_unpublished  | paused if base right valid, else pending    | paused (Resume only)   |
 * | pending_review      | pending_review (moderation owns visibility) | pending_review         |
 * | pending_payment etc | pending_payment                             | initialStatus          |
 * | suspended/rejected  | REFUSE                                      | REFUSE                 |
 */
export function decideServiciosOwnerSaveStatus(input: {
  existingStatus: string | null | undefined;
  pendingPaymentRequested: boolean;
  /** Only consulted for a paused row with a pending-payment request. `null` = unknown → treated
   * as not valid, i.e. the owner is sent through checkout rather than silently re-activated. */
  baseAuthorityValid: boolean | null;
  /** What a brand-new ordinary save would get (`published`, or `pending_review` in moderation mode). */
  initialStatus: string;
}): ServiciosOwnerSaveDecision {
  const existing = String(input.existingStatus ?? "").trim().toLowerCase();

  if (SERVICIOS_LEONIX_LOCKED_STATUSES.has(existing)) {
    return { kind: "refuse", reason: "listing_locked_by_leonix" };
  }

  if (SERVICIOS_AWAITING_BASE_PURCHASE_STATUSES.has(existing)) {
    return input.pendingPaymentRequested
      ? { kind: "write", status: "pending_payment", checkoutRequired: true }
      : { kind: "write", status: input.initialStatus, checkoutRequired: false };
  }

  switch (existing) {
    case "published":
      return { kind: "write", status: "published", checkoutRequired: false };

    case "paused_unpublished":
      if (input.pendingPaymentRequested && input.baseAuthorityValid !== true) {
        // Lapsed/cancelled/never-paid: the only way back to public is a real paid checkout, which
        // the webhook then activates from `pending_payment`.
        return { kind: "write", status: "pending_payment", checkoutRequired: true };
      }
      // Content edit of a paused listing — visibility is changed only by Resume.
      return { kind: "write", status: "paused_unpublished", checkoutRequired: false };

    case "pending_review":
      return { kind: "write", status: "pending_review", checkoutRequired: false };

    default:
      return { kind: "refuse", reason: "unknown_listing_status" };
  }
}

export type ServiciosReactivationAuthorityDecision =
  | { allowed: true }
  | { allowed: false; reason: "subscription_inactive" | "no_base_commercial_right" };

/**
 * B2 — may a Servicios listing return to public visibility right now?
 *
 * Built only from canonical truth the platform already computes — no second state model:
 *  - `planStatus` / `capabilitySource` come from `resolveCategoryListingPlan` (live base
 *    entitlement, with the subscription grace/suspended overlay already applied);
 *  - `latestSubscriptionStatus` is the newest `leonix_subscription_records.status` for the listing.
 *    It is needed because cancellation and chargebacks never shorten the entitlement row's
 *    `ends_at`, while a VISIBLE listing in that same state is suspended immediately — without this
 *    a paused listing could be resumed inside that window when a published one could not.
 *
 * Grace is honoured (existing paid access stays usable through grace, per the locked lifecycle).
 * A legacy offers add-on alone is NOT a base right.
 */
export function decideServiciosReactivationAuthority(input: {
  planStatus: string | null | undefined;
  capabilitySource: string | null | undefined;
  latestSubscriptionStatus: string | null | undefined;
}): ServiciosReactivationAuthorityDecision {
  const sub = String(input.latestSubscriptionStatus ?? "").trim().toLowerCase();
  if (sub === "canceled" || sub === "cancelled" || sub === "suspended") {
    return { allowed: false, reason: "subscription_inactive" };
  }
  const status = String(input.planStatus ?? "").trim().toLowerCase();
  const source = String(input.capabilitySource ?? "").trim().toLowerCase();
  const liveStatus = status === "active" || status === "grace";
  const baseSource = source === "package_key" || source === "legacy_print_included";
  return liveStatus && baseSource ? { allowed: true } : { allowed: false, reason: "no_base_commercial_right" };
}
