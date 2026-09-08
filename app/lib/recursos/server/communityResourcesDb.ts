import "server-only";

/**
 * Recursos Data OS — real persistence (Build 02, Gate 4).
 *
 * Single source of truth for the `public.community_resources` table (see
 * `supabase/migrations/20260818150000_community_resources.sql`). Maps DB rows to/from the
 * Build 01 `ResourceRecord` contract (`app/lib/recursos/types.ts`) — no second storage system,
 * no duplicated row-mapping logic. Admin writes always go through the service role
 * (`getAdminSupabase()`); this module never uses the anon client.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type {
  AudienceTag,
  OrganizationType,
  PrimaryCategorySlug,
  ResourceAddress,
  ResourceContact,
  ResourceHoursRow,
  ResourceInternalMeta,
  ResourceRecord,
  ResourceVerification,
  SecondaryTag,
  UrgencyLevel,
} from "@/app/lib/recursos/types";

const TABLE = "community_resources";

const SELECT_COLUMNS = [
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
  "partner_status",
  "featured",
  "print_eligible",
  "internal_notes",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
].join(", ");

export type CommunityResourceRow = {
  id: string;
  slug: string;
  organization_name: string;
  program_name: string | null;
  organization_type: string;
  short_description_es: string;
  short_description_en: string;
  details_es: string | null;
  details_en: string | null;
  primary_category: string;
  secondary_categories: unknown;
  urgency_level: string;
  age_min: number | null;
  age_max: number | null;
  audience_tags: unknown;
  service_tags: unknown;
  languages: unknown;
  cost_model: string;
  eligibility_es: string | null;
  eligibility_en: string | null;
  service_area: string | null;
  phone: string | null;
  crisis_phone: string | null;
  sms: string | null;
  whatsapp: string | null;
  email: string | null;
  website_url: string | null;
  application_url: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  address_withheld_for_safety: boolean;
  maps_search_href: string | null;
  hours_note_es: string | null;
  hours_note_en: string | null;
  weekly_hours: unknown;
  is_24_hours: boolean;
  official_source_url: string | null;
  last_verified_at: string | null;
  next_verification_at: string | null;
  verification_status: string;
  active: boolean;
  partner_status: string;
  featured: boolean;
  print_eligible: boolean;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export function slugifyResource(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asWeeklyHours(v: unknown): ResourceHoursRow[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((row): row is { dayLabel: unknown; line: unknown } => !!row && typeof row === "object")
    .map((row) => ({ dayLabel: String((row as { dayLabel?: unknown }).dayLabel ?? ""), line: String((row as { line?: unknown }).line ?? "") }));
}

export function rowToResourceRecord(row: CommunityResourceRow): ResourceRecord {
  const contact: ResourceContact = {
    phone: row.phone,
    crisisPhone: row.crisis_phone,
    sms: row.sms,
    whatsapp: row.whatsapp,
    email: row.email,
    websiteUrl: row.website_url,
    applicationUrl: row.application_url,
    address:
      row.address_line1 || row.address_city || row.address_withheld_for_safety
        ? ({
            line1: row.address_line1,
            line2: row.address_line2,
            city: row.address_city,
            state: row.address_state,
            zip: row.address_zip,
            addressWithheldForSafety: row.address_withheld_for_safety,
          } satisfies ResourceAddress)
        : null,
    mapsSearchHref: row.maps_search_href,
    hoursNoteEs: row.hours_note_es,
    hoursNoteEn: row.hours_note_en,
    weeklyHours: asWeeklyHours(row.weekly_hours),
    is24Hours: Boolean(row.is_24_hours),
  };

  const verification: ResourceVerification = {
    officialSourceUrl: row.official_source_url,
    lastVerifiedAt: row.last_verified_at,
    nextVerificationAt: row.next_verification_at,
    verificationStatus: row.verification_status as ResourceVerification["verificationStatus"],
    active: Boolean(row.active),
  };

  const internal: ResourceInternalMeta = {
    partnerStatus: row.partner_status as ResourceInternalMeta["partnerStatus"],
    featured: Boolean(row.featured),
    printEligible: Boolean(row.print_eligible),
    internalNotes: row.internal_notes,
  };

  return {
    id: row.id,
    slug: row.slug,
    organizationName: row.organization_name,
    programName: row.program_name,
    organizationType: row.organization_type as OrganizationType,
    shortDescriptionEs: row.short_description_es,
    shortDescriptionEn: row.short_description_en,
    detailsEs: row.details_es,
    detailsEn: row.details_en,
    primaryCategory: row.primary_category as PrimaryCategorySlug,
    secondaryCategories: asStringArray(row.secondary_categories) as SecondaryTag[],
    urgencyLevel: row.urgency_level as UrgencyLevel,
    ageMin: row.age_min,
    ageMax: row.age_max,
    audienceTags: asStringArray(row.audience_tags) as AudienceTag[],
    serviceTags: asStringArray(row.service_tags),
    languages: asStringArray(row.languages),
    costModel: row.cost_model as ResourceRecord["costModel"],
    eligibilityEs: row.eligibility_es,
    eligibilityEn: row.eligibility_en,
    serviceArea: row.service_area,
    contact,
    verification,
    internal,
  };
}

/** Fields accepted from admin create/update — everything except id/created_at/updated_at. */
export type CommunityResourceInput = Omit<ResourceRecord, "id"> & { id?: string };

function recordToRow(input: Partial<CommunityResourceInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.organizationName !== undefined) row.organization_name = input.organizationName;
  if (input.programName !== undefined) row.program_name = input.programName || null;
  if (input.organizationType !== undefined) row.organization_type = input.organizationType;
  if (input.shortDescriptionEs !== undefined) row.short_description_es = input.shortDescriptionEs;
  if (input.shortDescriptionEn !== undefined) row.short_description_en = input.shortDescriptionEn;
  if (input.detailsEs !== undefined) row.details_es = input.detailsEs || null;
  if (input.detailsEn !== undefined) row.details_en = input.detailsEn || null;
  if (input.primaryCategory !== undefined) row.primary_category = input.primaryCategory;
  if (input.secondaryCategories !== undefined) row.secondary_categories = input.secondaryCategories ?? [];
  if (input.urgencyLevel !== undefined) row.urgency_level = input.urgencyLevel;
  if (input.ageMin !== undefined) row.age_min = input.ageMin;
  if (input.ageMax !== undefined) row.age_max = input.ageMax;
  if (input.audienceTags !== undefined) row.audience_tags = input.audienceTags ?? [];
  if (input.serviceTags !== undefined) row.service_tags = input.serviceTags ?? [];
  if (input.languages !== undefined) row.languages = input.languages ?? [];
  if (input.costModel !== undefined) row.cost_model = input.costModel;
  if (input.eligibilityEs !== undefined) row.eligibility_es = input.eligibilityEs || null;
  if (input.eligibilityEn !== undefined) row.eligibility_en = input.eligibilityEn || null;
  if (input.serviceArea !== undefined) row.service_area = input.serviceArea || null;

  if (input.contact !== undefined) {
    const c = input.contact;
    row.phone = c.phone || null;
    row.crisis_phone = c.crisisPhone || null;
    row.sms = c.sms || null;
    row.whatsapp = c.whatsapp || null;
    row.email = c.email || null;
    row.website_url = c.websiteUrl || null;
    row.application_url = c.applicationUrl || null;
    row.address_line1 = c.address?.line1 || null;
    row.address_line2 = c.address?.line2 || null;
    row.address_city = c.address?.city || null;
    row.address_state = c.address?.state || null;
    row.address_zip = c.address?.zip || null;
    row.address_withheld_for_safety = Boolean(c.address?.addressWithheldForSafety);
    row.maps_search_href = c.mapsSearchHref || null;
    row.hours_note_es = c.hoursNoteEs || null;
    row.hours_note_en = c.hoursNoteEn || null;
    row.weekly_hours = c.weeklyHours ?? [];
    row.is_24_hours = Boolean(c.is24Hours);
  }

  if (input.verification !== undefined) {
    const v = input.verification;
    row.official_source_url = v.officialSourceUrl || null;
    row.last_verified_at = v.lastVerifiedAt || null;
    row.next_verification_at = v.nextVerificationAt || null;
    row.verification_status = v.verificationStatus;
    row.active = Boolean(v.active);
  }

  if (input.internal !== undefined) {
    const i = input.internal;
    row.partner_status = i.partnerStatus;
    row.featured = Boolean(i.featured);
    row.print_eligible = Boolean(i.printEligible);
    row.internal_notes = i.internalNotes || null;
  }

  return row;
}

export type CommunityResourceDbResult = { ok: true; id: string; slug: string } | { ok: false; error: string };

/** Admin: every status/active state — used by the Recursos admin list/editor. */
export async function dbListCommunityResources(): Promise<{ rows: ResourceRecord[]; unavailable: boolean }> {
  if (!isSupabaseAdminConfigured()) return { rows: [], unavailable: true };
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .order("updated_at", { ascending: false });
    if (error) return { rows: [], unavailable: true };
    return { rows: (data ?? []).map((r) => rowToResourceRecord(r as unknown as CommunityResourceRow)), unavailable: false };
  } catch {
    return { rows: [], unavailable: true };
  }
}

export async function dbGetCommunityResourceById(id: string): Promise<ResourceRecord | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase.from(TABLE).select(SELECT_COLUMNS).eq("id", id).maybeSingle();
    if (error || !data) return null;
    return rowToResourceRecord(data as unknown as CommunityResourceRow);
  } catch {
    return null;
  }
}

export async function dbGetCommunityResourceBySlug(slug: string): Promise<ResourceRecord | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const supabase = getAdminSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select(SELECT_COLUMNS)
      .eq("slug", slugifyResource(slug))
      .maybeSingle();
    if (error || !data) return null;
    return rowToResourceRecord(data as unknown as CommunityResourceRow);
  } catch {
    return null;
  }
}

export async function dbCreateCommunityResource(
  input: CommunityResourceInput,
  actorEmail?: string | null,
): Promise<CommunityResourceDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  const slug = slugifyResource(input.slug || input.organizationName);
  if (!slug) return { ok: false, error: "A URL slug is required." };
  if (!input.organizationName?.trim()) return { ok: false, error: "Organization name is required." };

  try {
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();
    const row = {
      slug,
      ...recordToRow(input),
      created_at: now,
      updated_at: now,
      created_by: actorEmail ?? null,
      updated_by: actorEmail ?? null,
    };
    const { data, error } = await supabase.from(TABLE).insert(row).select("id, slug").maybeSingle();
    if (error) {
      if (error.code === "23505") return { ok: false, error: `A resource with slug "${slug}" already exists.` };
      return { ok: false, error: error.message };
    }
    return { ok: true, id: String((data as { id: string }).id), slug };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Create failed." };
  }
}

export async function dbUpdateCommunityResource(
  id: string,
  patch: Partial<CommunityResourceInput>,
  actorEmail?: string | null,
): Promise<CommunityResourceDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  try {
    const supabase = getAdminSupabase();
    const row: Record<string, unknown> = {
      ...recordToRow(patch),
      updated_at: new Date().toISOString(),
      updated_by: actorEmail ?? null,
    };
    if (patch.slug !== undefined) row.slug = slugifyResource(patch.slug);
    const { data, error } = await supabase.from(TABLE).update(row).eq("id", id).select("id, slug").maybeSingle();
    if (error) {
      if (error.code === "23505") return { ok: false, error: "That slug is already in use by another resource." };
      return { ok: false, error: error.message };
    }
    if (!data) return { ok: false, error: "Resource was not found." };
    return { ok: true, id: String((data as { id: string }).id), slug: String((data as { slug: string }).slug) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

/**
 * Toggles ONLY the `active` column via a direct update — deliberately does NOT go through
 * `dbUpdateCommunityResource`/`recordToRow`, which overwrites every verification column whenever
 * a `verification` patch key is present. Routing a partial `{ active }` object through that path
 * would silently null out `official_source_url`/`last_verified_at`/`next_verification_at`.
 */
export async function dbSetCommunityResourceActive(
  id: string,
  active: boolean,
  actorEmail?: string | null,
): Promise<CommunityResourceDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  try {
    const supabase = getAdminSupabase();
    const row = { active, updated_at: new Date().toISOString(), updated_by: actorEmail ?? null };
    const { data, error } = await supabase.from(TABLE).update(row).eq("id", id).select("id, slug").maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Resource was not found." };
    return { ok: true, id: String((data as { id: string }).id), slug: String((data as { slug: string }).slug) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}

export async function dbSetCommunityResourceVerificationStatus(
  id: string,
  verificationStatus: ResourceVerification["verificationStatus"],
  extra: { lastVerifiedAt?: string | null; nextVerificationAt?: string | null; officialSourceUrl?: string | null } = {},
  actorEmail?: string | null,
): Promise<CommunityResourceDbResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." };
  }
  try {
    const supabase = getAdminSupabase();
    const row: Record<string, unknown> = {
      verification_status: verificationStatus,
      updated_at: new Date().toISOString(),
      updated_by: actorEmail ?? null,
    };
    if (verificationStatus === "inactive") row.active = false;
    if (extra.lastVerifiedAt !== undefined) row.last_verified_at = extra.lastVerifiedAt;
    if (extra.nextVerificationAt !== undefined) row.next_verification_at = extra.nextVerificationAt;
    if (extra.officialSourceUrl !== undefined) row.official_source_url = extra.officialSourceUrl;
    const { data, error } = await supabase.from(TABLE).update(row).eq("id", id).select("id, slug").maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Resource was not found." };
    return { ok: true, id: String((data as { id: string }).id), slug: String((data as { slug: string }).slug) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Update failed." };
  }
}
