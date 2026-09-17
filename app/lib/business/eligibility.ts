import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveListingSourceOwnershipContract } from "@/app/lib/listingPlans/listingEntitlementOwnership";
import { shouldApplyTestOverride } from "./featureFlagLogic";
import { buildTestOverrideEligibilityResult, statusFromEvidence } from "./eligibilityLogic";
import type { EligibilityEvidence, EligibilityResult } from "./types";

export { statusFromEvidence };

/**
 * Read-only Negocio eligibility adapter (Package BCO-2 / Phase 6).
 *
 * Reads only. Never mutates payments, entitlements, listings, ownership, category records,
 * Stripe, or fulfillment. Reuses the canonical ownership contract
 * (app/lib/listingPlans/listingEntitlementOwnership.ts) rather than duplicating owner-column
 * knowledge here — every query below reads its owner column name FROM that contract.
 *
 * Signal audit (BCO-1C.0 §8, corrected from earlier gates):
 *  - leonix_placement_entitlements.placement_tier='website_business' + status='active' — STRONGEST,
 *    direct owner_user_id column, no contract lookup needed.
 *  - listings.seller_type='business' — usable, via the ownership contract's `listings` entry.
 *  - autos_classifieds_listings.lane='negocios' — usable, confirmed CHECK-constrained column.
 *  - restaurantes_public_listings.package_tier — column exists, NO CHECK, values unconfirmed.
 *    Never treated as a qualifying value. Contributes only an ambiguous note.
 *  - servicios_public_listings — no business-tier column exists anywhere. Never claims a signal.
 *  - listing_package_entitlements — EXCLUDED. Its package_tier values (premium/full_page/
 *    half_page/quarter_page/classified_print/digital_only) are print/digital ad-package sizes,
 *    not a business/personal distinction. Treating an active row here as eligibility evidence
 *    would be inventing a qualifying value that the schema does not support.
 */

const now = () => new Date().toISOString();

async function checkPlacementEntitlement(
  supabase: SupabaseClient,
  userId: string,
): Promise<EligibilityEvidence[]> {
  const { data, error } = await supabase
    .from("leonix_placement_entitlements")
    .select("id, status, starts_at, ends_at")
    .eq("owner_user_id", userId)
    .eq("placement_tier", "website_business");
  if (error || !data) return [];

  const nowMs = Date.now();
  const evidence: EligibilityEvidence[] = [];
  for (const row of data as { id: string; status: string; starts_at: string | null; ends_at: string | null }[]) {
    const startsOk = !row.starts_at || new Date(row.starts_at).getTime() <= nowMs;
    const endsOk = !row.ends_at || new Date(row.ends_at).getTime() > nowMs;
    const isActive = row.status === "active" && startsOk && endsOk;
    evidence.push({
      source: "leonix_placement_entitlements",
      listingSource: null,
      listingId: null,
      entitlementId: row.id,
      reasonCode: isActive ? "placement_entitlement_active_website_business" : "placement_entitlement_expired",
    });
  }
  return evidence;
}

async function checkOwnedTableSignal(
  supabase: SupabaseClient,
  userId: string,
  table: "listings" | "autos_classifieds_listings" | "restaurantes_public_listings" | "servicios_public_listings",
): Promise<{ ownsAny: boolean; qualifies: boolean }> {
  const contract = resolveListingSourceOwnershipContract(table);
  if (!contract) return { ownsAny: false, qualifies: false };

  const qualifyingColumn = table === "listings" ? "seller_type" : table === "autos_classifieds_listings" ? "lane" : null;
  const selectCols = qualifyingColumn ? `id, ${contract.ownerColumn}, ${qualifyingColumn}` : `id, ${contract.ownerColumn}`;

  const { data, error } = await supabase.from(table).select(selectCols).eq(contract.ownerColumn, userId).limit(50);
  if (error || !data || data.length === 0) return { ownsAny: false, qualifies: false };

  if (table === "listings") {
    const qualifies = (data as unknown as { seller_type: string | null }[]).some((r) => r.seller_type === "business");
    return { ownsAny: true, qualifies };
  }
  if (table === "autos_classifieds_listings") {
    const qualifies = (data as unknown as { lane: string | null }[]).some((r) => r.lane === "negocios");
    return { ownsAny: true, qualifies };
  }
  return { ownsAny: true, qualifies: false };
}

/**
 * `injectedClient` exists solely so this function is directly testable with a fake Supabase
 * client (see scripts/verify-business-identity-core-01.ts) without building a generic
 * dependency-injection framework — every real caller omits it and gets the real admin client.
 */
export async function resolveNegocioEligibility(userId: string, injectedClient?: SupabaseClient): Promise<EligibilityResult> {
  // Non-production-only test override (BCO-3Q) — same safety gate as the feature-flag override
  // (shouldApplyTestOverride: impossible when VERCEL_ENV=production, requires an exact user-id
  // match). Exists because staging currently has none of the source tables this adapter reads
  // (only the Business Identity migration is applied there) — real evidence cannot be seeded,
  // so QA needs an honestly-labeled synthetic result rather than a silent "no evidence found."
  if (shouldApplyTestOverride({ userId, vercelEnv: process.env.VERCEL_ENV, overrideUserId: process.env.BUSINESS_IDENTITY_TEST_OVERRIDE_USER_ID })) {
    return buildTestOverrideEligibilityResult(now());
  }

  if (!injectedClient && !isSupabaseAdminConfigured()) {
    return {
      status: "ambiguous",
      evidence: [],
      contradictions: [],
      requiresManualReview: true,
      humanExplanation: "El sistema de elegibilidad no está disponible en este momento. / The eligibility system is unavailable right now.",
      evaluatedAt: now(),
    };
  }

  const supabase = injectedClient ?? getAdminSupabase();
  const evidence: EligibilityEvidence[] = [];

  const placementEvidence = await checkPlacementEntitlement(supabase, userId);
  evidence.push(...placementEvidence);

  const listingsSignal = await checkOwnedTableSignal(supabase, userId, "listings");
  if (listingsSignal.qualifies) {
    evidence.push({ source: "listings_seller_type", listingSource: "listings", listingId: null, entitlementId: null, reasonCode: "seller_type_business" });
  }

  const autosSignal = await checkOwnedTableSignal(supabase, userId, "autos_classifieds_listings");
  if (autosSignal.qualifies) {
    evidence.push({ source: "autos_lane", listingSource: "autos_classifieds_listings", listingId: null, entitlementId: null, reasonCode: "autos_lane_negocios" });
  }

  const restaurantesSignal = await checkOwnedTableSignal(supabase, userId, "restaurantes_public_listings");
  if (restaurantesSignal.ownsAny && !listingsSignal.qualifies && !autosSignal.qualifies) {
    evidence.push({
      source: "restaurantes_package_tier",
      listingSource: "restaurantes_public_listings",
      listingId: null,
      entitlementId: null,
      reasonCode: "restaurantes_package_tier_unconfirmed_value_set",
    });
  }

  const serviciosSignal = await checkOwnedTableSignal(supabase, userId, "servicios_public_listings");
  if (serviciosSignal.ownsAny && !listingsSignal.qualifies && !autosSignal.qualifies) {
    evidence.push({ source: "servicios", listingSource: "servicios_public_listings", listingId: null, entitlementId: null, reasonCode: "servicios_no_verified_signal" });
  }

  const contradictions = evidence.filter((e) => e.reasonCode === "placement_entitlement_expired");
  const { status, requiresManualReview, humanExplanation } = statusFromEvidence(evidence);

  return { status, evidence, contradictions, requiresManualReview, humanExplanation, evaluatedAt: now() };
}

/**
 * For a single candidate listing named by the caller (e.g. Phase 11 linking flow) — reports
 * whether that specific source is even supported by the ownership contract, without querying
 * any table. Fails closed (ambiguous) for anything not in the contract.
 */
export function evaluateListingSourceSupport(listingSource: string): { supported: boolean; reasonCode: "unsupported_listing_source" | null } {
  const contract = resolveListingSourceOwnershipContract(listingSource);
  return contract ? { supported: true, reasonCode: null } : { supported: false, reasonCode: "unsupported_listing_source" };
}
