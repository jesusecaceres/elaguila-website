import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeComparisonName, normalizeDisplayText, slugBaseFromDisplayName } from "../normalization";
import { resolveDuplicateWarning } from "../duplicates";
import { resolveNegocioEligibility } from "../eligibility";
import { resolveBusinessIdentityFlagTier } from "../featureFlag";
import { verifyListingOwnershipForLinking } from "../listingLinking";
import {
  validateAuthorization,
  validateContact,
  validateCountryField,
  validateOperatingModels,
  validateServiceArea,
  type AuthorizationInput,
  type ContactInput,
  type ServiceAreaInput,
} from "../validation";
import type { EligibilityResult, FieldError, StructuredLocationDetailsV1 } from "../types";

export type FinalizeBusinessV2Input = {
  userId: string;
  draftId: string | null;
  basics: {
    displayName: string;
    broadBusinessType: string;
    specificBusinessType: string;
    customSpecificType: string;
    businessStage: string;
    primaryLanguage: string;
    businessPrimaryLanguage: string;
    businessAdditionalLanguages: readonly string[];
    yearStarted: number | null;
  };
  operatingModel: {
    operatingModels: readonly string[];
    salesRelationships: readonly string[];
    salesChannels: readonly string[];
  };
  contacts: readonly ContactInput[];
  serviceAreas: readonly (ServiceAreaInput & { country: string; structuredDetails: StructuredLocationDetailsV1 })[];
  digitalProfiles: readonly { platform: string; handleOrUrl: string }[];
  authorization: AuthorizationInput & { representativeNote: string };
  listingCandidates: readonly { listingSource: string; listingId: string }[];
  acknowledgedDuplicateWarning: boolean;
};

export type FinalizeBusinessV2Result =
  | { ok: true; businessId: string }
  | { ok: false; reasonCode: "validation_failed"; errors: readonly FieldError[] }
  | { ok: false; reasonCode: "feature_unavailable" }
  | { ok: false; reasonCode: "duplicate_warning_unacknowledged"; duplicateLevel: string }
  | { ok: false; reasonCode: "rpc_failed"; detail: string };

/**
 * Gate BCO-3R orchestration for finalize_business_identity_v2. Same safety contract as v1
 * (finalizeBusiness.ts): admin client for read-only checks only, user-scoped client is the only
 * one that ever calls the RPC (auth.uid() resolves identity, never a client-supplied id).
 */
export async function finalizeBusinessIdentityV2(
  adminClient: SupabaseClient,
  userClient: SupabaseClient,
  input: FinalizeBusinessV2Input,
): Promise<FinalizeBusinessV2Result> {
  const tier = await resolveBusinessIdentityFlagTier(input.userId);
  if (tier === "unavailable") {
    return { ok: false, reasonCode: "feature_unavailable" };
  }

  const eligibility: EligibilityResult = await resolveNegocioEligibility(input.userId);

  const errors: FieldError[] = [];

  if (!input.basics.displayName.trim()) {
    errors.push({ field: "displayName", code: "required", defaultMessage: "El nombre del negocio es obligatorio. / Business name is required." });
  }
  if (input.operatingModel.operatingModels.length === 0) {
    const r = validateOperatingModels(input.operatingModel.operatingModels);
    if (!r.ok) errors.push(...r.errors);
  }

  const rpcContacts = [];
  for (const c of input.contacts) {
    const result = validateContact(c);
    if (!result.ok) errors.push(...result.errors);
    else rpcContacts.push(result.value);
  }
  if (rpcContacts.length === 0) {
    errors.push({ field: "contacts", code: "missing_contact", defaultMessage: "Agrega al menos un contacto. / Add at least one contact." });
  }

  const rpcServiceAreas = [];
  for (const a of input.serviceAreas) {
    const result = validateServiceArea(a);
    const countryResult = validateCountryField(a.country);
    if (!result.ok) errors.push(...result.errors);
    if (!countryResult.ok) errors.push(...countryResult.errors);
    if (result.ok && countryResult.ok) {
      rpcServiceAreas.push({ ...result.value, country: countryResult.value, structuredDetails: a.structuredDetails });
    }
  }
  if (rpcServiceAreas.length === 0 && errors.every((e) => e.field !== "serviceAreas")) {
    errors.push({ field: "serviceAreas", code: "missing_service_area", defaultMessage: "Agrega una ubicación. / Add a location." });
  }

  const authResult = validateAuthorization(input.authorization);
  if (!authResult.ok) errors.push(...authResult.errors);

  let anyListingUnverified = false;
  const listingVerifications: { listingSource: string; listingId: string }[] = [];
  for (const candidate of input.listingCandidates) {
    const verification = await verifyListingOwnershipForLinking(adminClient, { userId: input.userId, ...candidate });
    if (verification.ok) listingVerifications.push(candidate);
    else anyListingUnverified = true;
  }
  void anyListingUnverified; // unverified candidates are simply not linked (RPC re-verifies and falls back to pending) — not a hard validation failure

  if (!eligibility || (eligibility.status !== "eligible" && !eligibility.requiresManualReview)) {
    errors.push({ field: "eligibility", code: "feature_access_denied", defaultMessage: "Elegibilidad no confirmada. / Eligibility not confirmed." });
  }
  if (tier !== "global" && tier !== "pilot") {
    errors.push({ field: "featureAccess", code: "feature_access_denied", defaultMessage: "Sin acceso a esta función. / No access to this feature." });
  }

  if (errors.length > 0) {
    return { ok: false, reasonCode: "validation_failed", errors };
  }

  const normalizedName = normalizeComparisonName(input.basics.displayName);
  const duplicateResult = await resolveDuplicateWarning(adminClient, userClient, {
    currentUserId: input.userId,
    normalizedName,
    normalizedPhone: null,
    normalizedEmail: null,
    normalizedDomain: null,
    normalizedServiceAreaText: null,
    listingCandidate: input.listingCandidates[0] ?? null,
  });
  if (duplicateResult.level === "exact" && !input.acknowledgedDuplicateWarning) {
    return { ok: false, reasonCode: "duplicate_warning_unacknowledged", duplicateLevel: duplicateResult.level };
  }

  const slugBase = slugBaseFromDisplayName(input.basics.displayName) ?? "negocio";
  const slug = await resolveUniqueSlugV2(adminClient, slugBase);

  const { data, error } = await userClient.rpc("finalize_business_identity_v2", {
    p_display_name: normalizeDisplayText(input.basics.displayName),
    p_normalized_name: normalizedName,
    p_slug: slug,
    p_broad_business_type: input.basics.broadBusinessType,
    p_specific_business_type: input.basics.specificBusinessType || null,
    p_custom_specific_type: input.basics.customSpecificType || null,
    p_business_stage: input.basics.businessStage,
    p_primary_language: input.basics.primaryLanguage,
    p_business_primary_language: input.basics.businessPrimaryLanguage || null,
    p_business_additional_languages: input.basics.businessAdditionalLanguages,
    p_year_started: input.basics.yearStarted,
    p_operating_models: input.operatingModel.operatingModels,
    p_sales_relationships: input.operatingModel.salesRelationships,
    p_sales_channels: input.operatingModel.salesChannels,
    p_contacts: rpcContacts.map((c) => ({
      contactType: c.contactType,
      value: c.value,
      normalizedValue: c.normalizedValue,
      preferredChannel: c.preferredChannel,
      channelKind: c.channelKind,
      isPrimary: c.isPrimary,
      label: c.label,
      visibility: c.visibility,
    })),
    p_service_areas: rpcServiceAreas.map((a) => ({
      areaKind: a.areaKind,
      rawText: a.rawText,
      normalizedText: a.normalizedText,
      cityHint: null,
      isPrimary: a.isPrimary,
      country: a.country,
      structuredDetails: a.structuredDetails,
    })),
    p_digital_profiles: input.digitalProfiles.map((p) => ({ platform: p.platform, handleOrUrl: p.handleOrUrl })),
    p_authorization_role: input.authorization.role,
    p_representative_relationship: input.authorization.representativeRelationship || null,
    p_representative_contact_email: input.authorization.representativeContactEmail || null,
    p_representative_note: input.authorization.representativeNote || null,
    p_manual_review_flag: input.authorization.role === "authorized_representative",
    p_listing_links: listingVerifications.map((l) => ({ listingSource: l.listingSource, listingId: l.listingId })),
    p_draft_id: input.draftId,
  });

  if (error || typeof data !== "string") {
    return { ok: false, reasonCode: "rpc_failed", detail: error?.message ?? "unknown_error" };
  }

  return { ok: true, businessId: data };
}

async function resolveUniqueSlugV2(adminClient: SupabaseClient, base: string): Promise<string> {
  const { data: existing } = await adminClient.from("businesses").select("slug").ilike("slug", `${base}%`);
  const taken = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
