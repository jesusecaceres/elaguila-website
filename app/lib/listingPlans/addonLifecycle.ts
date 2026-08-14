/**
 * Gate E.2.1 — shared, pure add-on entitlement lifecycle model.
 *
 * No I/O, no Supabase, no "server-only" marker — safe to import from anywhere. This is
 * deliberately the smallest truthful status set derivable from `listing_package_entitlements`
 * columns as they exist and are actually written today (`status`, `starts_at`, `ends_at`,
 * `revoked_at`). "paused", "payment_failed", "renewal_due", and "checkout_pending" are NOT
 * included — no code path in this repository writes a paused/failed state, and no webhook
 * handles Stripe subscription renewal/failure events, so those states cannot be truthfully
 * derived yet (see the Gate E.0/E.2 audits).
 */

export type AddonLifecycleStatus = "not_purchased" | "scheduled" | "active" | "expired" | "revoked";

/** Raw shape of one `listing_package_entitlements` row, trimmed to what lifecycle derivation needs. */
export type AddonEntitlementSnapshot = {
  id: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  revokedAt: string | null;
  listingSource: string;
};

export type AddonLifecycleResult = {
  status: AddonLifecycleStatus;
  entitlement: AddonEntitlementSnapshot | null;
};

function parseDateMs(value: string | null): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * Pure derivation of one entitlement row's lifecycle status. No database access.
 *
 * Precedence:
 *   1. No row -> not_purchased.
 *   2. status === "revoked" or a non-null revokedAt -> revoked (checked before any date math).
 *   3. now < startsAt (when startsAt is present and parseable) -> scheduled.
 *   4. A missing/unparseable endsAt, or now past endsAt -> expired. Unusable end-date data must
 *      never be read as "no boundary, so still active" — it fails closed to expired instead.
 *   5. Otherwise -> active.
 */
export function resolveAddonLifecycleStatus(
  entitlement: AddonEntitlementSnapshot | null,
  now: Date = new Date(),
): AddonLifecycleResult {
  if (!entitlement) {
    return { status: "not_purchased", entitlement: null };
  }

  const status = String(entitlement.status ?? "").trim().toLowerCase();
  if (status === "revoked" || entitlement.revokedAt) {
    return { status: "revoked", entitlement };
  }

  const nowMs = now.getTime();
  const startsMs = parseDateMs(entitlement.startsAt);
  const endsMs = parseDateMs(entitlement.endsAt);

  if (startsMs !== null && nowMs < startsMs) {
    return { status: "scheduled", entitlement };
  }

  if (endsMs === null || nowMs > endsMs) {
    return { status: "expired", entitlement };
  }

  return { status: "active", entitlement };
}

const STATUS_PRECEDENCE: Record<AddonLifecycleStatus, number> = {
  active: 4,
  scheduled: 3,
  expired: 2,
  revoked: 1,
  not_purchased: 0,
};

/**
 * Chooses exactly one entitlement result when multiple rows exist for the same
 * (category, package_key, listing_id) — `listing_package_entitlements` currently has no unique
 * constraint preventing this (see Gate E.0's audit of `activateEntitlementsForPayment`). Never
 * merges fields across rows; always returns one row's own snapshot untouched.
 *
 * Precedence: active > scheduled > expired > revoked (not_purchased only applies when the
 * candidate list is empty). Ties within the same derived status are broken by later startsAt,
 * then later endsAt, then a lexicographically greater id — deterministic, not meaningful, just
 * stable so repeated calls with the same input always agree.
 */
export function pickPreferredAddonEntitlement(
  candidates: readonly AddonEntitlementSnapshot[],
  now: Date = new Date(),
): AddonLifecycleResult {
  let best: AddonLifecycleResult | null = null;

  for (const candidate of candidates) {
    const resolved = resolveAddonLifecycleStatus(candidate, now);
    if (!best) {
      best = resolved;
      continue;
    }

    const currentRank = STATUS_PRECEDENCE[resolved.status];
    const bestRank = STATUS_PRECEDENCE[best.status];
    if (currentRank > bestRank) {
      best = resolved;
      continue;
    }
    if (currentRank < bestRank) continue;

    // Same derived status — deterministic tie-break only, never a merge of the two rows.
    const bestEntitlement = best.entitlement;
    const currentEntitlement = resolved.entitlement;
    if (!bestEntitlement || !currentEntitlement) continue;

    const bestStarts = parseDateMs(bestEntitlement.startsAt) ?? -Infinity;
    const currentStarts = parseDateMs(currentEntitlement.startsAt) ?? -Infinity;
    if (currentStarts !== bestStarts) {
      if (currentStarts > bestStarts) best = resolved;
      continue;
    }

    const bestEnds = parseDateMs(bestEntitlement.endsAt) ?? -Infinity;
    const currentEnds = parseDateMs(currentEntitlement.endsAt) ?? -Infinity;
    if (currentEnds !== bestEnds) {
      if (currentEnds > bestEnds) best = resolved;
      continue;
    }

    if (currentEntitlement.id > bestEntitlement.id) best = resolved;
  }

  return best ?? { status: "not_purchased", entitlement: null };
}
