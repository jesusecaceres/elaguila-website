import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeComparisonName, normalizeDisplayText, slugBaseFromDisplayName } from "../normalization";
import { resolveDuplicateWarning } from "../duplicates";
import { resolveNegocioEligibility } from "../eligibility";
import { resolveBusinessIdentityFlagTier } from "../featureFlag";
import { verifyListingOwnershipForLinking } from "../listingLinking";
import type { ContactInput, ServiceAreaInput } from "../validation";
import { validateContact, validateFinalCreationRequest, validateServiceArea } from "../validation";
import type { EligibilityResult, FieldError } from "../types";

export type FinalizeBusinessInput = {
  userId: string;
  draftId: string | null;
  basics: { displayName: string; broadBusinessType: string; businessStage: string; primaryLanguage: string };
  contacts: readonly ContactInput[];
  serviceAreas: readonly ServiceAreaInput[];
  ownershipConfirmed: boolean;
  listingCandidate: { listingSource: string; listingId: string } | null;
  acknowledgedDuplicateWarning: boolean;
};

export type FinalizeBusinessResult =
  | { ok: true; businessId: string }
  | { ok: false; reasonCode: "validation_failed"; errors: readonly FieldError[] }
  | { ok: false; reasonCode: "feature_unavailable" }
  | { ok: false; reasonCode: "duplicate_warning_unacknowledged"; duplicateLevel: string }
  | { ok: false; reasonCode: "rpc_failed"; detail: string };

/**
 * Orchestrates Phase 12's atomic finalization. `adminClient` is used only for read-only
 * eligibility/duplicate checks (both already server-only, read-only by construction);
 * `userClient` (RLS-scoped, built from the caller's own bearer token) is the ONLY client that
 * ever calls the `finalize_business_identity` RPC, so `auth.uid()` inside the function resolves
 * to the real authenticated user — this service never passes a client-supplied user id into the
 * write path.
 */
export async function finalizeBusinessIdentity(
  adminClient: SupabaseClient,
  userClient: SupabaseClient,
  input: FinalizeBusinessInput,
): Promise<FinalizeBusinessResult> {
  const tier = await resolveBusinessIdentityFlagTier(input.userId);
  if (tier === "unavailable") {
    return { ok: false, reasonCode: "feature_unavailable" };
  }

  const eligibility: EligibilityResult = await resolveNegocioEligibility(input.userId);

  let listingOwnershipVerified: boolean | null = null;
  if (input.listingCandidate) {
    const verification = await verifyListingOwnershipForLinking(adminClient, {
      userId: input.userId,
      listingSource: input.listingCandidate.listingSource,
      listingId: input.listingCandidate.listingId,
    });
    listingOwnershipVerified = verification.ok;
  }

  const validation = validateFinalCreationRequest({
    userId: input.userId,
    basics: input.basics,
    contacts: input.contacts,
    serviceAreas: input.serviceAreas,
    ownershipConfirmed: input.ownershipConfirmed,
    featureAccessGranted: tier === "global" || tier === "pilot",
    eligibility,
    listingCandidate: input.listingCandidate,
    listingOwnershipVerified,
  });
  if (!validation.ok) {
    return { ok: false, reasonCode: "validation_failed", errors: validation.errors };
  }

  const normalizedName = normalizeComparisonName(input.basics.displayName);
  const duplicateResult = await resolveDuplicateWarning(adminClient, userClient, {
    currentUserId: input.userId,
    normalizedName,
    normalizedPhone: null,
    normalizedEmail: null,
    normalizedDomain: null,
    normalizedServiceAreaText: null,
    listingCandidate: input.listingCandidate,
  });
  if (duplicateResult.level === "exact" && !input.acknowledgedDuplicateWarning) {
    return { ok: false, reasonCode: "duplicate_warning_unacknowledged", duplicateLevel: duplicateResult.level };
  }

  const slugBase = slugBaseFromDisplayName(input.basics.displayName) ?? "negocio";
  const slug = await resolveUniqueSlug(adminClient, slugBase);

  // validateFinalCreationRequest already confirmed every contact/service-area passes;
  // re-run the per-item validators here only to obtain their normalized output for the RPC
  // payload — never send raw client values into the write path.
  const rpcContacts = [];
  for (const c of input.contacts) {
    const result = validateContact(c);
    if (!result.ok) {
      return { ok: false, reasonCode: "validation_failed", errors: result.errors };
    }
    rpcContacts.push({
      contactType: result.value.contactType,
      value: result.value.value,
      normalizedValue: result.value.normalizedValue,
      preferredChannel: result.value.preferredChannel,
      channelKind: result.value.channelKind,
      isPrimary: result.value.isPrimary,
    });
  }

  const rpcServiceAreas = [];
  for (const a of input.serviceAreas) {
    const result = validateServiceArea(a);
    if (!result.ok) {
      return { ok: false, reasonCode: "validation_failed", errors: result.errors };
    }
    rpcServiceAreas.push({
      areaKind: result.value.areaKind,
      rawText: result.value.rawText,
      normalizedText: result.value.normalizedText,
      cityHint: null,
      isPrimary: result.value.isPrimary,
    });
  }

  const { data, error } = await userClient.rpc("finalize_business_identity", {
    p_display_name: normalizeDisplayText(input.basics.displayName),
    p_normalized_name: normalizedName,
    p_slug: slug,
    p_broad_business_type: input.basics.broadBusinessType,
    p_business_stage: input.basics.businessStage,
    p_primary_language: input.basics.primaryLanguage,
    p_contacts: rpcContacts,
    p_service_areas: rpcServiceAreas,
    p_listing_source: input.listingCandidate?.listingSource ?? null,
    p_listing_id: input.listingCandidate?.listingId ?? null,
    p_draft_id: input.draftId,
  });

  if (error || typeof data !== "string") {
    return { ok: false, reasonCode: "rpc_failed", detail: error?.message ?? "unknown_error" };
  }

  return { ok: true, businessId: data };
}

async function resolveUniqueSlug(adminClient: SupabaseClient, base: string): Promise<string> {
  const { data: existing } = await adminClient.from("businesses").select("slug").ilike("slug", `${base}%`);
  const taken = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
