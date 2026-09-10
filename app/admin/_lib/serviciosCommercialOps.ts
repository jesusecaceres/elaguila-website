import "server-only";

/**
 * Gate SERVICIOS-3 (D-4) — READ-ONLY commercial truth for the Servicios Admin ops queue.
 *
 * ── WHAT THE AUDIT FOUND ─────────────────────────────────────────────────────────────────────
 * The Servicios Admin queue showed `listing_status` and nothing else: an operator could see that a
 * listing was `published` but had no way to tell whether it was actually PAID, whether an
 * entitlement existed, or whether the subscription had lapsed. Classified NEEDS_DATA.
 *
 * ── WHY IT IS CLOSEABLE ──────────────────────────────────────────────────────────────────────
 * The linkage already exists and is truthful; nothing had to be invented:
 *
 *   entitlement  `listing_package_entitlements`  keyed (category="servicios",
 *                package_key="servicios_base_monthly", listing_id=<servicios_public_listings.id>)
 *   subscription `leonix_subscription_records`   written by `revenueSubscriptionEvents` with
 *                `listing_id = metadata.leonix_listing_id` and
 *                `listing_source = metadata.leonix_category` (= "servicios")
 *
 * ── RULES THIS MODULE OBEYS (Admin OS Book §6) ───────────────────────────────────────────────
 * - Payment is NEVER inferred from listing status. `listing_status` is reported beside the
 *   commercial facts, never used to derive them.
 * - Unreadable/absent is NEVER collapsed into zero or "none". Every field carries an explicit
 *   truth state: REAL · PARTIAL · NEEDS_PROOF · UNAVAILABLE.
 * - This module never writes. No update, insert, upsert or delete appears anywhere in it.
 * - It reuses the canonical readers rather than re-deriving commercial truth: the entitlement side
 *   goes through `fetchAddonEntitlementsForListings`, the same reader the public detail page
 *   already uses for Servicios add-ons.
 *
 * `loadSubscriptionStatusForParent` (commercialWriteGuard) was deliberately NOT reused: its
 * `GuardCategory` is `autos | bienes-raices` and it hardcodes a `listing_source` of `listings`,
 * which is the wrong table for Servicios. Widening a write-guard helper to serve a read-only Admin
 * panel would couple two unrelated concerns; this reads the same table with the correct key.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { fetchAddonEntitlementsForListings } from "@/app/lib/listingPlans/addonEntitlementReader";
import type { AddonLifecycleStatus } from "@/app/lib/listingPlans/addonLifecycle";
import { SERVICIOS_BASE_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";

/** Admin OS Book §6 truth states. */
export type ServiciosOpsTruthState = "REAL" | "PARTIAL" | "NEEDS_PROOF" | "UNAVAILABLE";

export type ServiciosOpsField<T> = {
  value: T | null;
  truth: ServiciosOpsTruthState;
  /** Operator-safe explanation. Never a raw database or provider error. */
  note?: string;
};

export type ServiciosCommercialOpsRow = {
  listingId: string;
  /** Reported for context only — never used to derive anything below. */
  listingStatus: ServiciosOpsField<string>;
  /** Base package entitlement (`servicios_base_monthly`). */
  entitlement: ServiciosOpsField<AddonLifecycleStatus>;
  entitlementEndsAt: ServiciosOpsField<string>;
  /** Subscription record state, from `leonix_subscription_records`. */
  subscription: ServiciosOpsField<string>;
  subscriptionPeriodEnd: ServiciosOpsField<string>;
  /** Whether a real Stripe payment identity is linked at all. */
  payment: ServiciosOpsField<"linked" | "not_linked">;
};

const UNAVAILABLE_NOTE =
  "Commercial data source is unavailable in this environment. This is not a claim that the listing is unpaid.";

function unavailable<T>(note = UNAVAILABLE_NOTE): ServiciosOpsField<T> {
  return { value: null, truth: "UNAVAILABLE", note };
}

type SubscriptionRow = {
  listing_id?: string | null;
  status?: string | null;
  stripe_status?: string | null;
  stripe_subscription_id?: string | null;
  current_period_end?: string | null;
  grace_ends_at?: string | null;
};

/**
 * Projects commercial truth for a bounded set of Servicios listing ids.
 *
 * Bounded by the caller's current page — this never sweeps the table. Every failure degrades to
 * UNAVAILABLE for the affected field rather than throwing or fabricating a value.
 */
export async function loadServiciosCommercialOps(
  listingIds: readonly string[],
): Promise<Map<string, ServiciosCommercialOpsRow>> {
  const ids = [...new Set(listingIds.map((id) => id?.trim()).filter((id): id is string => Boolean(id)))];
  const out = new Map<string, ServiciosCommercialOpsRow>();
  if (ids.length === 0) return out;

  const base = (listingId: string): ServiciosCommercialOpsRow => ({
    listingId,
    listingStatus: { value: null, truth: "NEEDS_PROOF" },
    entitlement: unavailable(),
    entitlementEndsAt: unavailable(),
    subscription: unavailable(),
    subscriptionPeriodEnd: unavailable(),
    payment: unavailable(),
  });
  for (const id of ids) out.set(id, base(id));

  if (!isSupabaseAdminConfigured()) return out;

  // ── Entitlement — the canonical reader, same one the public detail page uses ───────────────
  try {
    const entitlements = await fetchAddonEntitlementsForListings({
      category: SERVICIOS_BASE_CHECKOUT.category,
      packageKey: SERVICIOS_BASE_CHECKOUT.packageKey,
      listingIds: ids,
    });
    for (const id of ids) {
      const row = out.get(id);
      if (!row) continue;
      const result = entitlements.get(id);
      if (!result) {
        row.entitlement = { value: null, truth: "NEEDS_PROOF", note: "Entitlement lookup returned no row for this listing." };
        continue;
      }
      row.entitlement = { value: result.status, truth: "REAL" };
      const endsAt = result.entitlement?.endsAt ?? null;
      row.entitlementEndsAt = endsAt
        ? { value: endsAt, truth: "REAL" }
        : {
            value: null,
            truth: result.status === "not_purchased" ? "REAL" : "PARTIAL",
            note:
              result.status === "not_purchased"
                ? "No base entitlement has ever been granted for this listing."
                : "An entitlement exists but carries no end date.",
          };
    }
  } catch {
    // Leave every entitlement field UNAVAILABLE — never downgrade to "not purchased".
  }

  // ── Subscription + payment linkage ─────────────────────────────────────────────────────────
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from("leonix_subscription_records")
      .select("listing_id, status, stripe_status, stripe_subscription_id, current_period_end, grace_ends_at")
      .eq("listing_source", SERVICIOS_BASE_CHECKOUT.category)
      .in("listing_id", ids);

    if (!error) {
      const bySubject = new Map<string, SubscriptionRow>();
      for (const raw of (data ?? []) as SubscriptionRow[]) {
        const key = raw.listing_id?.trim();
        if (key) bySubject.set(key, raw);
      }
      for (const id of ids) {
        const row = out.get(id);
        if (!row) continue;
        const sub = bySubject.get(id);
        if (!sub) {
          // A listing with no subscription record is NOT proof of non-payment — a one-time or
          // legacy activation would look identical from here.
          row.subscription = {
            value: null,
            truth: "PARTIAL",
            note: "No subscription record is linked to this listing. Payment state cannot be proven from the listing alone.",
          };
          row.subscriptionPeriodEnd = { value: null, truth: "PARTIAL" };
          row.payment = {
            value: null,
            truth: "PARTIAL",
            note: "No Stripe subscription identity is linked. This is not a claim that the listing is unpaid.",
          };
          continue;
        }
        const status = (sub.status ?? "").trim();
        row.subscription = status
          ? { value: status, truth: "REAL", note: sub.grace_ends_at ? `Grace ends ${sub.grace_ends_at}.` : undefined }
          : { value: null, truth: "NEEDS_PROOF", note: "A subscription record exists but carries no status." };
        row.subscriptionPeriodEnd = sub.current_period_end
          ? { value: sub.current_period_end, truth: "REAL" }
          : { value: null, truth: "PARTIAL", note: "Subscription record has no current period end." };
        row.payment = sub.stripe_subscription_id?.trim()
          ? { value: "linked", truth: "REAL" }
          : { value: null, truth: "PARTIAL", note: "Subscription record carries no Stripe subscription id." };
      }
    }
  } catch {
    // Leave subscription/payment UNAVAILABLE.
  }

  return out;
}

/** Pure presentation helper — keeps the panel from re-deriving truth semantics. */
export function serviciosOpsFieldLabel<T>(field: ServiciosOpsField<T>, fallback = "—"): string {
  if (field.truth === "REAL" && field.value != null) return String(field.value);
  return fallback;
}
