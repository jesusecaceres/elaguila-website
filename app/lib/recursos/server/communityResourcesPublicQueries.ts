import "server-only";

/**
 * Recursos Data OS — PUBLIC read surface (Build 02, Gate 3/4; hardened Build 03A-V, Gate 7).
 *
 * This is the ONLY module future public pages/components (Build 03) should import from to read
 * community resources. Every function here:
 *   1. Filters to `active = true and verification_status = 'verified'` at the query level (RLS
 *      also enforces `active = true and verification_status <> 'inactive'` as defense-in-depth —
 *      this module is intentionally STRICTER than RLS, since "not inactive" still includes
 *      needs_review/stale, which must never reach the public surface).
 *   2. Re-checks freshness in application code via `isEffectivelyVerified()` (the existing,
 *      unmodified `verificationStatus.ts` truth function) — a row can say `verification_status =
 *      'verified'` in the DB while its `next_verification_at` has already passed, and only that
 *      function knows how to resolve that correctly. No competing freshness logic is invented here.
 *   3. Returns `PublicResourceRecord` via `toPublicResource()` — `internal.*` (partner status,
 *      featured, print eligibility, internal notes) is stripped before this data ever reaches a
 *      caller, let alone a client component.
 *
 * Truth table this module guarantees: active+verified+fresh → eligible. active+needs_review →
 * excluded. active+stale (incl. expired next_verification_at) → excluded. inactive → excluded.
 *
 * Do NOT import `communityResourcesDb.ts` admin functions from public-facing code — use this
 * module instead so the admin/public boundary stays enforced in one place.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { toPublicResource, type PrimaryCategorySlug, type PublicResourceRecord, type ResourceRecord, type UrgencyLevel } from "@/app/lib/recursos/types";
import { isEffectivelyVerified } from "@/app/lib/recursos/verificationStatus";
import { rowToResourceRecord, slugifyResource, type CommunityResourceRow } from "./communityResourcesDb";

/** Query-level narrowing PLUS the effective-freshness re-check — the single safety chokepoint every public read goes through. */
function isCurrentlyPublicEligible(record: ResourceRecord): boolean {
  return record.verification.active && isEffectivelyVerified(record.verification);
}

const TABLE = "community_resources";

const PUBLIC_SELECT_COLUMNS = [
  "id",
  "slug",
  "organization_name",
  "program_name",
  "organization_type",
  "short_description_es",
  "short_description_en",
  "details_es",
  "details_en",
  "primary_category",
  "secondary_categories",
  "urgency_level",
  "age_min",
  "age_max",
  "audience_tags",
  "service_tags",
  "languages",
  "cost_model",
  "eligibility_es",
  "eligibility_en",
  "service_area",
  "phone",
  "crisis_phone",
  "sms",
  "whatsapp",
  "email",
  "website_url",
  "application_url",
  "address_line1",
  "address_line2",
  "address_city",
  "address_state",
  "address_zip",
  "address_withheld_for_safety",
  "maps_search_href",
  "hours_note_es",
  "hours_note_en",
  "weekly_hours",
  "is_24_hours",
  "official_source_url",
  "last_verified_at",
  "next_verification_at",
  "verification_status",
  "active",
  // Editorial fields are intentionally selected here ONLY so `toPublicResource()` can read
  // `internal.featured` — they are stripped from the return value below, never returned raw.
  "partner_status",
  "featured",
  "print_eligible",
  "internal_notes",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
].join(", ");

export type PublicResourceQuery = {
  category?: PrimaryCategorySlug | null;
  urgencyLevel?: UrgencyLevel | null;
  limit?: number;
};

/** Public: active resources only, optionally filtered by category/urgency. */
export async function listPublicCommunityResources(
  query: PublicResourceQuery = {},
): Promise<{ resources: PublicResourceRecord[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { resources: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    let q = supabase
      .from(TABLE)
      .select(PUBLIC_SELECT_COLUMNS)
      .eq("active", true)
      .eq("verification_status", "verified")
      .order("updated_at", { ascending: false });

    if (query.category) q = q.eq("primary_category", query.category);
    if (query.urgencyLevel) q = q.eq("urgency_level", query.urgencyLevel);
    if (query.limit) q = q.limit(query.limit);

    const { data, error } = await q;
    if (error) return { resources: [], unavailable: true };
    const records = (data ?? []).map((r) => rowToResourceRecord(r as unknown as CommunityResourceRow));
    const resources = records.filter(isCurrentlyPublicEligible).map(toPublicResource);
    return { resources, unavailable: false };
  } catch {
    return { resources: [], unavailable: true };
  }
}

/** Public: a single active resource by slug, or null (never returns inactive/internal data). */
export async function getPublicCommunityResourceBySlug(slug: string): Promise<PublicResourceRecord | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(PUBLIC_SELECT_COLUMNS)
      .eq("slug", slugifyResource(slug))
      .eq("active", true)
      .eq("verification_status", "verified")
      .maybeSingle();
    if (error || !data) return null;
    const record = rowToResourceRecord(data as unknown as CommunityResourceRow);
    if (!isCurrentlyPublicEligible(record)) return null;
    return toPublicResource(record);
  } catch {
    return null;
  }
}
