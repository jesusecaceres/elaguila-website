/**
 * Gate BIENES-PRIVADO-1 — the ONE place that knows Bienes Raíces FSBO's fixed-term truth.
 *
 * Gate Zero found the $49.99 / 45-day term was sold, priced from the Revenue OS matrix, and
 * persisted in `listing_package_entitlements.ends_at` — but **never written to the listing row and
 * never enforced anywhere**. `isListingRowActiveAndPublishedForBrowse` (the shared public rule used
 * by browse, the sitemap reader and Saved Search eligibility) reads only `status` and
 * `is_published`. So a paid 45-day FSBO listing stayed publicly live forever.
 *
 * This module supplies both halves of the repair, and deliberately supplies them from ONE file so
 * the four public surfaces cannot drift into four copies:
 *   - the WRITE half's duration + lifecycle config (consumed by `revenueBienesFsboFulfillment`);
 *   - the READ half's `isBrFsboRowWithinTerm` (consumed by results, public detail, Saved Search
 *     eligibility and the sitemap reader).
 *
 * ── WHY A LANE PREDICATE IS MANDATORY ────────────────────────────────────────────────────────
 * `listings` is a SHARED table. Bienes Raíces holds two commercially opposite lanes in it:
 *   - FSBO / Privado  — one-time, fixed 45-day term, `seller_type = "personal"`;
 *   - Negocio         — a monthly SUBSCRIPTION with no `expires_at` at all.
 *
 * `getListingLifecycleConfig(category, packageKey)` matches on CATEGORY ALONE when no packageKey is
 * supplied. So this config is deliberately NOT added to `LISTING_LIFECYCLE_CONFIGS`: registering it
 * under `bienes-raices` would let any keyless lookup hand a Negocio subscription row a config with
 * `expirationRequired: true`, reporting a live, fully-paid listing as expired / not publicly
 * visible. The registry cannot express "this category has two lanes", so the config is exposed only
 * through `resolveBrFsboLifecycleConfigForRow`, which requires a row and returns `null` for
 * anything that is not genuine FSBO. Callers pass the config to `resolveListingLifecycle`
 * explicitly — exactly as the five existing lifecycle call sites already do for Rentas.
 *
 * `isBrFsboRowWithinTerm` is likewise lane-scoped: a Negocio row (or any non-FSBO row) always
 * passes, and a null/invalid `expires_at` always means "no term to enforce" — this rule can only
 * ever hide a row that genuinely carries a real, elapsed fixed term.
 *
 * Forward-ports the SEMANTICS of sealed Globalization `5ddf6f79` ("harden lifecycle visibility
 * truth"), whose own comment states FSBO is the only lane in this table with a populated
 * `expires_at`. That commit shipped the READ half alone; on this branch it would have been a no-op
 * because nothing wrote the value. Here the two halves land together.
 *
 * Pure: no I/O, no framework imports.
 */
import { getRevenuePackageDefinition } from "@/app/lib/listingPlans/revenuePricingMatrix";
import type { ListingLifecycleConfig } from "./listingLifecycleTypes";

export const BIENES_FSBO_LIFECYCLE_PACKAGE_KEY = "br_fsbo_45d" as const;
export const BIENES_FSBO_LIFECYCLE_CATEGORY = "bienes-raices" as const;

/** Renewal opens the same 7 days before expiry that Rentas uses — one platform convention. */
export const BIENES_FSBO_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS = 7;

/**
 * Duration comes from the canonical Revenue OS matrix, NOT a duplicated literal: `br_fsbo_45d`
 * declares `durationDays: 45` there, and that is the same number the checkout line item already
 * renders to the buyer. The `45` below is only a last-resort guard for a matrix that failed to
 * resolve — if the owner ever re-terms this product, the matrix stays the single place to change.
 */
export function bienesFsboDurationDays(): number {
  const days = getRevenuePackageDefinition(BIENES_FSBO_LIFECYCLE_PACKAGE_KEY)?.durationDays;
  return typeof days === "number" && Number.isFinite(days) && days > 0 ? days : 45;
}

/** Price likewise derives from the matrix; used only for owner-facing renewal presentation. */
export function bienesFsboRenewalPriceCents(): number | null {
  const cents = getRevenuePackageDefinition(BIENES_FSBO_LIFECYCLE_PACKAGE_KEY)?.priceCents;
  return typeof cents === "number" && Number.isFinite(cents) ? cents : null;
}

/**
 * The FSBO lifecycle contract. Status vocabulary mirrors what this lane's own publish/activation
 * path actually writes (`pending` before payment, `active` after) plus the shared `listings`
 * moderation states — nothing invented.
 */
export const BIENES_FSBO_LISTING_LIFECYCLE_CONFIG: ListingLifecycleConfig = {
  category: BIENES_FSBO_LIFECYCLE_CATEGORY,
  packageKey: BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
  durationType: "fixed_days",
  durationDays: bienesFsboDurationDays(),
  renewalPackageKey: BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
  renewalPriceCents: bienesFsboRenewalPriceCents(),
  renewalEligibleBeforeExpiryDays: BIENES_FSBO_RENEWAL_ELIGIBLE_BEFORE_EXPIRY_DAYS,
  expirationRequired: true,
  hasAddons: false,
  publicVisibilityRequiresActiveLifecycle: true,
  reminderScheduleDays: [7, 3, 1, 0, -3],
  sourceTable: "listings",
  activeStatuses: ["active"],
  pendingPaymentStatuses: ["pending", "pending_payment"],
  pausedStatuses: ["paused"],
  suspendedStatuses: ["suspended", "flagged", "removed"],
};

/** The minimum row shape both halves need. Every field optional — callers project narrowly. */
export type BrFsboRowLike = {
  category?: string | null;
  seller_type?: string | null;
  listing_json?: unknown;
  expires_at?: string | null;
};

function norm(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

function brPublishLane(listingJson: unknown): string {
  if (!listingJson || typeof listingJson !== "object") return "";
  const br = (listingJson as { br_publish?: { lane?: unknown } }).br_publish;
  return norm(br?.lane);
}

/**
 * THE lane predicate. A row is FSBO only when it is a Bienes Raíces row sold to a private seller.
 *
 * `seller_type === "personal"` is the same discriminator this lane's own webhook activation
 * enforces (`revenueBienesFsboFulfillment` requires it, alongside `br_publish.lane === "privado"`).
 * The `listing_json` lane is accepted as corroboration when present but is not required, because
 * `listing_json` is not selected by every public reader — requiring it would silently exclude rows
 * from term enforcement, which is the failure direction that matters here.
 */
export function isBrFsboRow(row: BrFsboRowLike): boolean {
  if (norm(row.category) !== BIENES_FSBO_LIFECYCLE_CATEGORY) return false;
  const lane = brPublishLane(row.listing_json);
  if (lane === "negocio") return false;
  return norm(row.seller_type) === "personal";
}

/**
 * Returns the FSBO lifecycle config ONLY for a genuine FSBO row. Negocio (and anything else)
 * resolves to `null`, so a subscription row can never be evaluated against a fixed-term contract.
 * Every caller must go through this rather than `getListingLifecycleConfig("bienes-raices")`.
 */
export function resolveBrFsboLifecycleConfigForRow(row: BrFsboRowLike): ListingLifecycleConfig | null {
  return isBrFsboRow(row) ? BIENES_FSBO_LISTING_LIFECYCLE_CONFIG : null;
}

/**
 * THE public expiry rule — the single shared predicate for results, public detail, Saved Search
 * eligibility and the sitemap. Additive: callers keep applying their existing
 * `isListingRowActiveAndPublishedForBrowse` check and add this one on top.
 *
 * Fails closed ONLY for a real elapsed term:
 *   - not an FSBO row               -> true  (a Negocio subscription can never be hidden by this)
 *   - no / unparseable `expires_at` -> true  (nothing to enforce; never guesses a term)
 *   - expires_at in the future      -> true
 *   - expires_at at or before now   -> FALSE
 */
export function isBrFsboRowWithinTerm(row: BrFsboRowLike, nowMs: number = Date.now()): boolean {
  if (!isBrFsboRow(row)) return true;
  const raw = row.expires_at;
  if (typeof raw !== "string" || !raw.trim()) return true;
  const expiresMs = new Date(raw).getTime();
  if (!Number.isFinite(expiresMs)) return true;
  return expiresMs > nowMs;
}
