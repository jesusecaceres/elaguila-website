import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ProspectPreviewContext } from "@/app/lib/auth/prospectPreviewToken";
import { isListingLinkedToBusiness, type AssistedListingSource } from "@/app/lib/business/assistedListingCustody";

/**
 * The read behind the prospect preview link — and nothing else.
 *
 * FIELD SAFETY IS A WHITELIST, NOT A FILTER. Each source names the exact columns the preview may
 * read. `select("*")` is never used, because a column added to one of these tables next month
 * would otherwise become a column the prospect preview publishes. Owner ids, payment records,
 * internal notes and moderation fields are not on any of these lists and cannot be.
 *
 * CUSTODY IS RE-PROVEN AT REDEMPTION. A valid signature proves the token was issued by us at some
 * earlier moment; it cannot prove that the business it names still holds the row it names. If the
 * relationship has since been revoked, the link stops working, which is the whole reason the token
 * carries `businessId` at all.
 *
 * THIS FUNCTION CANNOT PUBLISH ANYTHING. It issues a single SELECT. There is no write path in this
 * module, so viewing a preview can never mark a listing public — the lifecycle column it reads is
 * reported back untouched so the page can say, truthfully, that the ad is not published.
 */

export type ProspectPreviewPayload = {
  category: ProspectPreviewContext["category"];
  listingId: string;
  /** Best-available display name. Never an internal identifier. */
  title: string | null;
  city: string | null;
  state: string | null;
  /** The raw lifecycle value, so the page can PROVE the ad is not live rather than assert it. */
  lifecycleState: string | null;
  /** True only when this row is, right now, publicly visible. A preview of a live ad says so. */
  isPublic: boolean;
  /** Category-shaped display content, already limited to the whitelisted columns. */
  content: Record<string, unknown> | null;
  expiresAtMs: number;
};

const SOURCE_COLUMNS: Record<ProspectPreviewContext["listingSource"], string> = {
  servicios_public_listings: "id, slug, business_name, city, state, listing_status, profile_json",
  restaurantes_public_listings: "id, slug, status, listing_json",
  autos_classifieds_listings: "id, status, lang, listing_payload",
  listings: "id, title, description, city, state, price, is_free, status, is_published, listing_json",
  empleos_public_listings: "id, title, company_name, city, state, lifecycle_status, listing_snapshot",
  comida_local_public_listings: "id, business_name, city_display, city_canonical, status, listing_json",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function readProspectPreviewPayload(
  ctx: ProspectPreviewContext,
): Promise<ProspectPreviewPayload | null> {
  if (!isSupabaseAdminConfigured()) return null;

  // Custody first: no row is read for a token whose stated relationship no longer holds.
  const linked = await isListingLinkedToBusiness({
    businessId: ctx.businessId,
    listingSource: ctx.listingSource as AssistedListingSource,
    listingId: ctx.listingId,
  });
  if (!linked) return null;

  try {
    const db = getAdminSupabase();
    const { data, error } = await db
      .from(ctx.listingSource)
      .select(SOURCE_COLUMNS[ctx.listingSource])
      .eq("id", ctx.listingId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as unknown as Record<string, unknown>;

    switch (ctx.listingSource) {
      case "servicios_public_listings": {
        const profile = asRecord(row.profile_json);
        const lifecycle = str(row.listing_status);
        return {
          category: ctx.category,
          listingId: ctx.listingId,
          title: str(row.business_name) ?? str(profile?.businessName),
          city: str(row.city),
          state: str(row.state),
          lifecycleState: lifecycle,
          isPublic: lifecycle === "published",
          content: profile,
          expiresAtMs: ctx.expiresAtMs,
        };
      }
      case "restaurantes_public_listings": {
        const listing = asRecord(row.listing_json);
        const lifecycle = str(row.status);
        return {
          category: ctx.category,
          listingId: ctx.listingId,
          title: str(listing?.businessName) ?? str(listing?.name),
          city: str(listing?.city),
          state: str(listing?.state),
          lifecycleState: lifecycle,
          isPublic: lifecycle === "published",
          content: listing,
          expiresAtMs: ctx.expiresAtMs,
        };
      }
      case "autos_classifieds_listings": {
        const payload = asRecord(row.listing_payload);
        const lifecycle = str(row.status);
        return {
          category: ctx.category,
          listingId: ctx.listingId,
          title: str(payload?.businessName) ?? str(payload?.dealerName) ?? str(payload?.title),
          city: str(payload?.city),
          state: str(payload?.state),
          lifecycleState: lifecycle,
          isPublic: lifecycle === "active",
          content: payload,
          expiresAtMs: ctx.expiresAtMs,
        };
      }
      case "empleos_public_listings": {
        const snapshot = asRecord(row.listing_snapshot);
        const lifecycle = str(row.lifecycle_status);
        return {
          category: ctx.category,
          listingId: ctx.listingId,
          title: str(row.title) ?? str(row.company_name),
          city: str(row.city),
          state: str(row.state),
          lifecycleState: lifecycle,
          isPublic: lifecycle === "published",
          content: snapshot,
          expiresAtMs: ctx.expiresAtMs,
        };
      }
      case "comida_local_public_listings": {
        const listing = asRecord(row.listing_json);
        const lifecycle = str(row.status);
        return {
          category: ctx.category,
          listingId: ctx.listingId,
          title: str(row.business_name) ?? str(listing?.businessName),
          city: str(row.city_display) ?? str(row.city_canonical),
          state: str(listing?.state),
          lifecycleState: lifecycle,
          isPublic: lifecycle === "published",
          content: listing,
          expiresAtMs: ctx.expiresAtMs,
        };
      }
      case "listings":
      default: {
        const lifecycle = str(row.status);
        return {
          category: ctx.category,
          listingId: ctx.listingId,
          title: str(row.title),
          city: str(row.city),
          state: str(row.state),
          lifecycleState: lifecycle,
          isPublic: lifecycle === "active" && row.is_published === true,
          content: asRecord(row.listing_json) ?? { description: str(row.description), price: row.price ?? null },
          expiresAtMs: ctx.expiresAtMs,
        };
      }
    }
  } catch {
    return null;
  }
}
