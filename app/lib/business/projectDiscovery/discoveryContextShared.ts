/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — small extraction of the canonical-truth
 * context-building glue that was previously duplicated only inside websiteDiscoveryContext.ts, so
 * the new specialized (Logo/Print/Campaign) discovery engines can reuse the EXACT SAME Living
 * Business Book wiring rather than a second copy (MD <first_inspection>: "genuinely reduces
 * duplication"). Pure code motion — no behavior change to the Website context builder, which now
 * imports these instead of defining them locally.
 *
 * Server-only (reads businesses + Living Book), no write, no mutation.
 */
import "server-only";

import { getAdminSupabase } from "@/app/lib/supabase/server";
import { listFactsForBusiness } from "@/app/lib/business/livingBook/repository";

export type KnownFactConfidence = "confirmed" | "stale_or_unconfirmed";

export interface KnownFactSignal {
  fieldKey: string;
  value: unknown;
  displayValue: string | null;
  confidence: KnownFactConfidence;
  sourceLabel: string;
}

/**
 * A confirmed/staff-confirmed Living Book fact is treated as "confirmed" canonical truth; anything
 * else (owner_statement, staff_observation, public_source_observation, ai_inference, etc.) is
 * "stale_or_unconfirmed" — the adaptive engine surfaces a CONFIRM question for it rather than
 * silently trusting it (MD <canonical_truth_reuse>: "Do not silently treat stale public information
 * as client confirmation.").
 */
export function factConfidence(confirmationState: string): KnownFactConfidence {
  return confirmationState === "owner_confirmed" || confirmationState === "staff_confirmed" ? "confirmed" : "stale_or_unconfirmed";
}

export function factSourceLabel(sourceClass: string): string {
  switch (sourceClass) {
    case "owner_confirmed":
    case "owner_statement":
      return "Living Business Book (owner)";
    case "staff_observation":
      return "Living Business Book (staff observation)";
    case "public_source_observation":
    case "leonix_listing_observation":
      return "Public research";
    case "connected_account_observation":
      return "Connected account";
    case "ai_inference":
      return "AI inference (Living Business Book)";
    default:
      return "Living Business Book";
  }
}

export interface BusinessCategoryContext {
  broadBusinessType: string;
  specificBusinessType: string | null;
  customSpecificType: string | null;
  businessStage: string;
}

export async function loadBusinessCategoryContext(businessId: string): Promise<BusinessCategoryContext | null> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("businesses")
    .select("broad_business_type, specific_business_type, custom_specific_type, business_stage")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as { broad_business_type: string; specific_business_type: string | null; custom_specific_type: string | null; business_stage: string };
  return {
    broadBusinessType: row.broad_business_type,
    specificBusinessType: row.specific_business_type,
    customSpecificType: row.custom_specific_type,
    businessStage: row.business_stage,
  };
}

/** Maps every Living Book fact for a business into the generic KnownFactSignal shape both Website and specialized engines consume identically. */
export function toKnownFactSignals(facts: readonly { factKey: string; value: unknown; displayValue: string | null; confirmationState: string; sourceClass: string }[]): KnownFactSignal[] {
  return facts.map((f) => ({
    fieldKey: f.factKey,
    value: f.value,
    displayValue: f.displayValue,
    confidence: factConfidence(f.confirmationState),
    sourceLabel: factSourceLabel(f.sourceClass),
  }));
}

export { listFactsForBusiness };
