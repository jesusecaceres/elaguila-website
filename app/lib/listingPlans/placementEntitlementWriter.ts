/**
 * Package D Build D2, Gate 9 — canonical server-side `leonix_placement_entitlements` writer.
 *
 * ONE typed insert path for every caller that creates a placement entitlement row, so no caller
 * hand-builds the insert with duplicated literal strings. Reuses (never redefines) the
 * PlacementTier/PlacementSource/PlacementSurface types from `placementEntitlements.ts`.
 *
 * Callers as of D2:
 *  - `revenueEntitlementFulfillment.ts` → `activatePlacementForRealPayment` (real Stripe/cleared
 *    payments) — refactored to call this writer internally; its own exported signature is unchanged.
 *  - admin `package-entitlements/actions.ts` → `createPackageEntitlementAction`'s print-included
 *    branch — refactored to call this writer instead of a raw `.insert(...)`.
 *
 * This module does not decide business eligibility (tier mapping, whether a package grants
 * placement at all) — callers resolve that themselves, exactly as before. It only owns the actual
 * write shape and idempotency-by-natural-key behavior, so every writer produces byte-identical rows
 * for the same inputs.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { PlacementSource, PlacementSurface, PlacementTier } from "./placementEntitlements";

export type WritePlacementEntitlementInput = {
  listingId: string;
  ownerUserId?: string | null;
  leonixAdId?: string | null;
  category: string;
  placementTier: PlacementTier | string;
  placementSource: PlacementSource | string;
  surfaces: (PlacementSurface | string)[];
  startsAt: Date;
  endsAt: Date;
  status: "active" | "scheduled";
  /** Optional natural key for idempotency when the caller has one (e.g. a payment record id). When
   * omitted, the caller is responsible for its own idempotency check before calling this writer
   * (e.g. the admin print-included path, which has no payment record to key off). */
  stripePaymentRecordId?: string | null;
  promoCodeId?: string | null;
  printContractId?: string | null;
  includedWithPrint?: boolean;
  businessName?: string | null;
  metadata?: Record<string, unknown>;
};

export type WritePlacementEntitlementResult =
  | { ok: true; placementEntitlementId: string; idempotent?: boolean }
  | { ok: false; code: string; message?: string };

export async function writePlacementEntitlement(
  input: WritePlacementEntitlementInput,
): Promise<WritePlacementEntitlementResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) return { ok: false, code: "listing_id_missing" };

  const supabase = getAdminSupabase();

  if (input.stripePaymentRecordId) {
    const { data: existing } = await supabase
      .from("leonix_placement_entitlements")
      .select("id, status")
      .eq("stripe_payment_record_id", input.stripePaymentRecordId)
      .maybeSingle();
    if (existing?.id) {
      return { ok: true, placementEntitlementId: existing.id as string, idempotent: true };
    }
  }

  const { data: inserted, error } = await supabase
    .from("leonix_placement_entitlements")
    .insert({
      owner_user_id: input.ownerUserId ?? null,
      listing_id: listingId,
      leonix_ad_id: input.leonixAdId ?? null,
      category: input.category,
      placement_tier: input.placementTier,
      placement_source: input.placementSource,
      surfaces: input.surfaces,
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt.toISOString(),
      status: input.status,
      stripe_payment_record_id: input.stripePaymentRecordId ?? null,
      promo_code_id: input.promoCodeId ?? null,
      print_contract_id: input.printContractId ?? null,
      included_with_print: input.includedWithPrint ?? false,
      business_name: input.businessName ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    return {
      ok: false,
      code: "placement_entitlement_insert_failed",
      message: error?.message ?? "Failed to create placement entitlement.",
    };
  }

  return { ok: true, placementEntitlementId: inserted.id as string };
}
