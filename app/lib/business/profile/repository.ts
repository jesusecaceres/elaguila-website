/**
 * Staff-Created Business Profile pipeline repository.
 *
 * Write-path split (matches the Systemic Repair Build convention exactly -- see
 * app/lib/business/ownership/repository.ts for the precedent this mirrors):
 *  - Staff functions use getAdminSupabase() (service-role, bypasses RLS) exactly like every other
 *    Business Concierge staff write. Every caller must already have passed
 *    requireStaffWorkspaceWriteAccess("manage_business_profile"). Staff functions never accept or
 *    forward a `status` field -- a staff write can only ever create/update a draft.
 *  - Owner functions run as the authenticated owner via their own bearer-token-scoped client and
 *    the three SECURITY DEFINER RPCs (update_own_business_profile_draft / publish_business_profile
 *    / unpublish_business_profile) -- never the admin client -- so publish's commercial-entitlement
 *    check can never be bypassed by a client-trusted direct write.
 */
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import type { StaffWriteActor } from "@/app/admin/_lib/businessWorkspaceAccess";
import type {
  BusinessProfile,
  BusinessProfileDraftInput,
  PublishBusinessProfileResult,
  SaveOwnBusinessProfileDraftResult,
  UnpublishBusinessProfileResult,
} from "./types";

type BusinessProfileRow = {
  id: string;
  business_id: string;
  status: "draft" | "published";
  headline: string | null;
  short_description: string | null;
  about_description: string | null;
  logo_url: string | null;
  hero_image_url: string | null;
  gallery_images: string[] | null;
  featured_highlights: { title: string; description: string }[] | null;
  created_by_type: "staff" | "owner";
  created_by_ref: string | null;
  updated_by_type: "staff" | "owner" | null;
  updated_by_ref: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  first_published_at: string | null;
};

const PROFILE_COLUMNS =
  "id, business_id, status, headline, short_description, about_description, logo_url, hero_image_url, gallery_images, featured_highlights, created_by_type, created_by_ref, updated_by_type, updated_by_ref, created_at, updated_at, published_at, first_published_at";

function mapProfileRow(row: BusinessProfileRow): BusinessProfile {
  return {
    id: row.id,
    businessId: row.business_id,
    status: row.status,
    headline: row.headline,
    shortDescription: row.short_description,
    aboutDescription: row.about_description,
    logoUrl: row.logo_url,
    heroImageUrl: row.hero_image_url,
    galleryImages: row.gallery_images ?? [],
    featuredHighlights: row.featured_highlights ?? [],
    createdByType: row.created_by_type,
    createdByRef: row.created_by_ref,
    updatedByType: row.updated_by_type,
    updatedByRef: row.updated_by_ref,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    firstPublishedAt: row.first_published_at,
  };
}

// =====================================================================================================
// Staff (admin-client) path.
// =====================================================================================================

/** Staff read -- any business, any status. Returns null if no profile has ever been saved. */
export async function getBusinessProfile(businessId: string): Promise<BusinessProfile | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_profiles")
    .select(PROFILE_COLUMNS)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfileRow(data as BusinessProfileRow);
}

/**
 * Staff draft save. Never touches `status` -- the row is created as 'draft' by the column
 * default and can only ever move to 'published' through publish_business_profile() (owner-only).
 */
export async function upsertBusinessProfileDraftAsStaff(
  businessId: string,
  input: BusinessProfileDraftInput,
  actor: StaffWriteActor,
): Promise<{ ok: true; profile: BusinessProfile } | { ok: false; error: string }> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("business_profiles")
    .upsert(
      {
        business_id: businessId,
        headline: input.headline,
        short_description: input.shortDescription,
        about_description: input.aboutDescription,
        logo_url: input.logoUrl,
        hero_image_url: input.heroImageUrl,
        gallery_images: input.galleryImages,
        featured_highlights: input.featuredHighlights,
        updated_by_type: "staff",
        updated_by_ref: actor.rosterId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "business_id" },
    )
    .select(PROFILE_COLUMNS)
    .maybeSingle();

  if (error || !data) return { ok: false, error: error?.message ?? "upsert_failed" };
  return { ok: true, profile: mapProfileRow(data as BusinessProfileRow) };
}

// =====================================================================================================
// Owner (bearer-client + RPC) path.
// =====================================================================================================

/** Owner read. RLS (business_profiles_select_member) already scopes this to the caller's own business. */
export async function getOwnBusinessProfile(callerClient: SupabaseClient, businessId: string): Promise<BusinessProfile | null> {
  const { data, error } = await callerClient
    .from("business_profiles")
    .select(PROFILE_COLUMNS)
    .eq("business_id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfileRow(data as BusinessProfileRow);
}

export async function saveOwnBusinessProfileDraft(
  callerClient: SupabaseClient,
  businessId: string,
  input: BusinessProfileDraftInput,
): Promise<SaveOwnBusinessProfileDraftResult> {
  const { data, error } = await callerClient.rpc("update_own_business_profile_draft", {
    p_business_id: businessId,
    p_headline: input.headline,
    p_short_description: input.shortDescription,
    p_about_description: input.aboutDescription,
    p_logo_url: input.logoUrl,
    p_hero_image_url: input.heroImageUrl,
    p_gallery_images: input.galleryImages,
    p_featured_highlights: input.featuredHighlights,
  });
  if (error) {
    const message = error.message ?? "";
    if (message.includes("not_a_member")) return { ok: false, error: "not_a_member" };
    if (message.includes("insufficient_privilege")) return { ok: false, error: "not_authenticated" };
    return { ok: false, error: "unknown_error" };
  }
  if (typeof data !== "string") return { ok: false, error: "unknown_error" };
  return { ok: true, businessId: data };
}

export async function publishOwnBusinessProfile(callerClient: SupabaseClient, businessId: string): Promise<PublishBusinessProfileResult> {
  const { data, error } = await callerClient.rpc("publish_business_profile", { p_business_id: businessId });
  if (error) {
    const message = error.message ?? "";
    if (message.includes("not_a_member")) return { ok: false, error: "not_a_member" };
    if (message.includes("profile_not_found")) return { ok: false, error: "profile_not_found" };
    if (message.includes("no_active_entitlement")) return { ok: false, error: "no_active_entitlement" };
    if (message.includes("insufficient_privilege")) return { ok: false, error: "not_authenticated" };
    return { ok: false, error: "unknown_error" };
  }
  if (typeof data !== "string") return { ok: false, error: "unknown_error" };
  return { ok: true, businessId: data };
}

export async function unpublishOwnBusinessProfile(callerClient: SupabaseClient, businessId: string): Promise<UnpublishBusinessProfileResult> {
  const { data, error } = await callerClient.rpc("unpublish_business_profile", { p_business_id: businessId });
  if (error) {
    const message = error.message ?? "";
    if (message.includes("not_a_member")) return { ok: false, error: "not_a_member" };
    if (message.includes("insufficient_privilege")) return { ok: false, error: "not_authenticated" };
    return { ok: false, error: "unknown_error" };
  }
  if (typeof data !== "string") return { ok: false, error: "unknown_error" };
  return { ok: true, businessId: data };
}

// =====================================================================================================
// Public (anon-safe) path.
// =====================================================================================================

export type PublicBusinessProfileBundle = {
  business: {
    id: string;
    displayName: string;
    publicName: string | null;
    slug: string;
    broadBusinessType: string;
    specificBusinessType: string | null;
    customSpecificType: string | null;
    businessStage: string;
    primaryLanguage: string;
    businessPrimaryLanguage: string | null;
    businessAdditionalLanguages: string[];
  };
  profile: {
    headline: string | null;
    shortDescription: string | null;
    aboutDescription: string | null;
    logoUrl: string | null;
    heroImageUrl: string | null;
    galleryImages: string[];
    featuredHighlights: { title: string; description: string }[];
    publishedAt: string | null;
    firstPublishedAt: string | null;
  };
  contacts: { contactType: string; value: string; label: string; isPrimary: boolean; channelKind: string | null }[];
  digitalProfiles: { platform: string; handleOrUrl: string }[];
  customLinks: { linkType: string; customLabel: string | null; displayUrl: string; sortOrder: number }[];
  serviceAreas: { country: string | null; cityHint: string | null; areaKind: string; isPrimary: boolean }[];
};

/**
 * Public read by slug -- the ONLY way an anonymous visitor reads anything about a business. Uses
 * the admin client purely as a transport for the SECURITY DEFINER RPC call (the RPC itself is
 * what enforces "published + active only"; the admin client here does not bypass any additional
 * check the way it does for staff writes above).
 */
export async function getPublicBusinessProfileBySlug(slug: string): Promise<PublicBusinessProfileBundle | null> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("get_public_business_profile", { p_slug: slug });
  if (error || !data) return null;
  return data as PublicBusinessProfileBundle;
}
