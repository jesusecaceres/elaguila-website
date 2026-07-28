/**
 * Gate G.3.1 — pure Restaurantes category adapter onto the global owner lifecycle contract,
 * built through the Gate G.2.1 Business Profile Family adapter. No I/O, no Supabase, no React,
 * no browser globals — same purity guarantee as the family/global layers it consumes, and the
 * same pattern already certified for Bienes Raíces (`bienesRaicesLifecycleAdapter.ts`).
 *
 * COMPLETELY READ-ONLY THIS GATE: every lifecycle capability produced here stays at the family
 * adapter's safe all-false default (see `businessProfileLifecycleAdapter.ts`) — Restaurantes has
 * no certified owner-facing lifecycle mutation today (confirmed by the Gate G.3A audit: no
 * Pause/Resume/Archive/Restore/Republish exists anywhere in the Restaurant dashboard), so there
 * is nothing to certify a capability flag for yet. No navigation href is ever supplied here.
 *
 * STATUS MAPPING (evidence-bounded — see the Gate G.3A audit Table A): `restaurantes_public_
 * listings.status` is a real database `CHECK` constraint with exactly four values — `pending_
 * payment`, `published`, `suspended`, `archived` — confirmed across every migration touching
 * this column. Any other value (including null/legacy) fails closed to `"draft"`, matching
 * `resolveOwnerFacingStatus`'s own fallback semantics (Gate G.1). This file does not invent
 * `payment_issue`, `rejected`, `changes_requested`, `expired`, or `scheduled` mappings — no
 * trustworthy Restaurant signal for any of those exists.
 *
 * EDITABLE (evidence-bounded — see Gate G.3.1A): unlike Bienes Raíces, every known Restaurant
 * status remains content-editable through the real, just-hardened publish route
 * (`resolveRestauranteOwnerEditTargetStatus` only ever blocks an unrecognized status, never
 * `archived`/`suspended` from being content-updated) — so `editable` is `true` for every
 * recognized status here, not derived per-status the way BR's adapter does.
 */

import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";
import { RESTAURANTES_COUPON_ADDON_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { buildBusinessProfileEligibilityInput, type BusinessProfileFamilyInput } from "./businessProfileLifecycleAdapter";
import type { OwnerFacingStatusKey, OwnerLifecycleEligibilityInput } from "./ownerLifecycleTypes";

/**
 * Pure, category-neutral-shaped input a caller (a future dashboard pilot) builds from a real
 * Restaurant row. `rawStatus` is the raw, already-fetched `status` column value — this file
 * never queries Supabase to obtain it. Canonical identity is always `restaurantes_public_
 * listings.id` — never slug, never `draft_listing_id` (the confirmed identity divergence from
 * the Gate G.3A audit is a publish-route concern, not something this adapter re-introduces).
 */
export type RestaurantesLifecycleInput = {
  canonicalListingId: string | null;
  ownerVerified: boolean;
  rawStatus: string | null | undefined;
  /**
   * Real, already-resolved `restaurantes_offers_addon` (coupon) lifecycle status, when the
   * caller already has it. Omit entirely when unavailable — never guessed here. See
   * `buildRestauranteCouponPaidModule` below for why `"not_purchased"` specifically must never
   * be forwarded even when this field IS supplied.
   */
  couponEntitlementStatus?: AddonLifecycleStatus;
  /** Explicit "now" — this file never calls `Date.now()`/`new Date()` itself. */
  now: Date;
};

/** The only four Restaurant statuses with a real, DB-enforced `CHECK` constraint (Gate G.3A). */
function resolveRestauranteOwnerFacingStatus(rawStatus: string | null | undefined): OwnerFacingStatusKey {
  const status = String(rawStatus ?? "").trim().toLowerCase();
  if (status === "published") return "live";
  if (status === "pending_payment") return "awaiting_payment";
  if (status === "suspended") return "suspended";
  if (status === "archived") return "archived";
  // Unknown/legacy/malformed — fail closed.
  return "draft";
}

/**
 * `"not_purchased"` is deliberately never forwarded to the global contract: it would map to
 * `"inactive"` (via the family adapter's paid-module mapper) and trigger a false
 * `entitlement_inactive` attention reason for a restaurant that simply never bought the coupon
 * add-on — the exact false-warning this gate's contract forbids. Only a real active/scheduled/
 * expired/revoked signal is ever surfaced. Mirrors `buildBrPaidModules` in
 * `bienesRaicesLifecycleAdapter.ts` exactly — same rule, different package key.
 */
function buildRestauranteCouponPaidModule(
  couponEntitlementStatus: AddonLifecycleStatus | undefined,
): Readonly<Record<string, AddonLifecycleStatus>> | undefined {
  if (!couponEntitlementStatus || couponEntitlementStatus === "not_purchased") return undefined;
  return { [RESTAURANTES_COUPON_ADDON_PACKAGE_KEY]: couponEntitlementStatus };
}

/**
 * Builds a valid `OwnerLifecycleEligibilityInput` for a Restaurantes row, through the Business
 * Profile Family adapter (never bypassing it). No capabilities, no navigation hrefs — this
 * pilot is read-only by construction, not by omission convention. `role` is always `null`:
 * Restaurantes has no parent/child inventory concept at all (no `inventory_role` column, no
 * canonical-parent-link column exists on `restaurantes_public_listings`).
 */
export function buildRestaurantesEligibilityInput(input: RestaurantesLifecycleInput): OwnerLifecycleEligibilityInput {
  const normalizedStatus = resolveRestauranteOwnerFacingStatus(input.rawStatus);

  const familyInput: BusinessProfileFamilyInput = {
    canonicalListingId: input.canonicalListingId,
    categoryKey: "restaurantes",
    ownerVerified: input.ownerVerified,
    normalizedStatus,
    internalStatus: input.rawStatus ?? null,
    publicVisibility: normalizedStatus === "live",
    // Every recognized Restaurant status remains content-editable through the real publish
    // route (Gate G.3.1A) — never derived per-status the way BR's narrower rule works.
    editable: true,
    // Restaurantes has both a free and a paid tier (`normalizePublicPublishPackageTier`), but
    // no pure resolver in this contract currently reads `paidOrFree` at all — it exists only to
    // satisfy the required shape. Defaulting to "paid" here does not grant or withhold anything;
    // revisit if a future resolver ever starts consuming this field.
    paidOrFree: "paid",
    // No trustworthy Restaurant signal for either beyond `rawStatus` itself — both stay false so
    // the global resolver's status-driven attention rules (e.g. "suspended" -> listing_suspended,
    // "awaiting_payment" -> complete_payment) are the only source of truth, never duplicated here.
    paymentIssue: false,
    moderationIssue: false,
    // Restaurantes has no parent/child inventory concept.
    role: null,
    paidModules: buildRestauranteCouponPaidModule(input.couponEntitlementStatus),
    // No capabilities, no navigationHrefs — family adapter's safe all-false default applies
    // untouched; Restaurantes has no certified owner-facing lifecycle mutation yet.
    now: input.now,
  };

  return buildBusinessProfileEligibilityInput(familyInput);
}
