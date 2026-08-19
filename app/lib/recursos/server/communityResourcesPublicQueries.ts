import "server-only";

/**
 * Recursos Data OS — PUBLIC read surface (Build 02, Gate 3/4).
 *
 * This is the ONLY module future public pages/components (Build 03) should import from to read
 * community resources. Every function here:
 *   1. Filters to `active = true` at the query level (RLS also enforces this as defense-in-depth).
 *   2. Returns `PublicResourceRecord` via `toPublicResource()` — `internal.*` (partner status,
 *      featured, print eligibility, internal notes) is stripped before this data ever reaches a
 *      caller, let alone a client component.
 *
 * Do NOT import `communityResourcesDb.ts` admin functions from public-facing code — use this
 * module instead so the admin/public boundary stays enforced in one place.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { toPublicResource, type PrimaryCategorySlug, type PublicResourceRecord, type UrgencyLevel } from "@/app/lib/recursos/types";
import { rowToResourceRecord, slugifyResource, type CommunityResourceRow } from "./communityResourcesDb";

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
      .neq("verification_status", "inactive")
      .order("updated_at", { ascending: false });

    if (query.category) q = q.eq("primary_category", query.category);
    if (query.urgencyLevel) q = q.eq("urgency_level", query.urgencyLevel);
    if (query.limit) q = q.limit(query.limit);

    const { data, error } = await q;
    if (error) return { resources: [], unavailable: true };
    const resources = (data ?? []).map((r) => toPublicResource(rowToResourceRecord(r as unknown as CommunityResourceRow)));
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
      .neq("verification_status", "inactive")
      .maybeSingle();
    if (error || !data) return null;
    return toPublicResource(rowToResourceRecord(data as unknown as CommunityResourceRow));
  } catch {
    return null;
  }
}
