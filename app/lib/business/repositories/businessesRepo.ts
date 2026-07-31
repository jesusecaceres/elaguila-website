import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Business } from "../types";

type BusinessRow = {
  id: string;
  display_name: string;
  legal_name: string | null;
  public_name: string | null;
  normalized_name: string;
  slug: string;
  broad_business_type: string;
  specific_business_type: string | null;
  custom_specific_type: string | null;
  business_stage: string;
  primary_language: string;
  business_primary_language: string | null;
  business_additional_languages: string[] | null;
  year_started: number | null;
  operating_models: string[] | null;
  sales_relationships: string[] | null;
  sales_channels: string[] | null;
  status: string;
  onboarding_status: string;
  creation_source: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

const BUSINESS_COLUMNS =
  "id, display_name, legal_name, public_name, normalized_name, slug, broad_business_type, specific_business_type, custom_specific_type, business_stage, primary_language, business_primary_language, business_additional_languages, year_started, operating_models, sales_relationships, sales_channels, status, onboarding_status, creation_source, created_by_user_id, created_at, updated_at, archived_at";

export function mapBusinessRow(row: BusinessRow): Business {
  return {
    id: row.id,
    displayName: row.display_name,
    legalName: row.legal_name,
    publicName: row.public_name,
    normalizedName: row.normalized_name,
    slug: row.slug,
    broadBusinessType: row.broad_business_type as Business["broadBusinessType"],
    specificBusinessType: row.specific_business_type,
    customSpecificType: row.custom_specific_type,
    businessStage: row.business_stage as Business["businessStage"],
    primaryLanguage: row.primary_language as Business["primaryLanguage"],
    businessPrimaryLanguage: row.business_primary_language,
    businessAdditionalLanguages: row.business_additional_languages ?? [],
    yearStarted: row.year_started,
    operatingModels: (row.operating_models ?? []) as Business["operatingModels"],
    salesRelationships: (row.sales_relationships ?? []) as Business["salesRelationships"],
    salesChannels: (row.sales_channels ?? []) as Business["salesChannels"],
    status: row.status as Business["status"],
    onboardingStatus: row.onboarding_status as Business["onboardingStatus"],
    creationSource: row.creation_source as Business["creationSource"],
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };
}

/**
 * `client` should be a user-scoped (RLS-enforced) client for member-facing reads, or the
 * admin/service-role client only for the narrow, explicitly-authorized server paths (feature
 * flag reads, eligibility, finalize RPC). Never pass the admin client for a generic "get
 * business by id" call reachable from user input — RLS is the access boundary by design.
 */
export async function getBusinessByIdForCurrentUser(client: SupabaseClient, businessId: string): Promise<Business | null> {
  const { data, error } = await client.from("businesses").select(BUSINESS_COLUMNS).eq("id", businessId).maybeSingle();
  if (error || !data) return null;
  return mapBusinessRow(data as BusinessRow);
}

/** RLS already scopes this to businesses the caller has an active membership in. */
export async function listActiveBusinessesForCurrentUser(client: SupabaseClient): Promise<Business[]> {
  const { data, error } = await client.from("businesses").select(BUSINESS_COLUMNS).eq("status", "active");
  if (error || !data) return [];
  return (data as BusinessRow[]).map(mapBusinessRow);
}

/**
 * Admin-scoped only — used by the duplicate-detection engine, which must be able to see
 * candidate businesses the current user is NOT a member of (to warn, never to expose details).
 */
export async function findBusinessesByNormalizedNameCandidates(
  adminClient: SupabaseClient,
  normalizedNamePrefix: string,
  limit = 20,
): Promise<Pick<Business, "id" | "displayName" | "normalizedName" | "status">[]> {
  const { data, error } = await adminClient
    .from("businesses")
    .select("id, display_name, normalized_name, status")
    .ilike("normalized_name", `%${normalizedNamePrefix}%`)
    .eq("status", "active")
    .limit(limit);
  if (error || !data) return [];
  return (data as { id: string; display_name: string; normalized_name: string; status: string }[]).map((r) => ({
    id: r.id,
    displayName: r.display_name,
    normalizedName: r.normalized_name,
    status: r.status as Business["status"],
  }));
}

/**
 * Business creation/update through the direct client is intentionally NOT implemented here —
 * businesses.INSERT has no client policy by design (server-only creation via the finalize RPC,
 * Phase 12). Archival is explicitly deferred to a later package per Phase 7's instruction
 * ("archive only if explicitly supported by the current package; otherwise defer") — no
 * archive function is implemented in BCO-2.
 */
