import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { ProspectPreviewContext } from "@/app/lib/auth/prospectPreviewToken";
import { isListingLinkedToBusiness, type AssistedListingSource } from "@/app/lib/business/assistedListingCustody";
import { missingListingsColumnName, stripSelectColumn } from "@/app/(site)/clasificados/lib/listingsSelectShrink";
import { isProspectRealComponentCategory } from "@/app/lib/sales/prospectPreviewRealCategories";

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
 * REAL-COMPONENT ROWS. The four business families (servicios, restaurantes, autos, bienes-raices)
 * render the real public category components, which need a few more PUBLIC-FACING facts than the
 * generic shell did. Those facts are returned under `row`, built from an explicit allow-list of
 * keys below — `content` stays exactly what it was for every family. Nothing on those lists is an
 * owner id, a payment record, an internal note or a moderation field.
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
  /**
   * Extra PUBLIC-FACING row facts, only for the four real-component families (see the header).
   * Built key by key from an allow-list — never a spread of the database row. Null for the rest.
   */
  row: Record<string, unknown> | null;
  expiresAtMs: number;
};

const SOURCE_COLUMNS: Record<ProspectPreviewContext["listingSource"], string> = {
  // leonix_ad_id / leonix_verified / internal_group are the three public-facing facts the real
  // Servicios profile reads from the row (ad-id footer, "verified by Leonix" cue, template routing).
  servicios_public_listings:
    "id, slug, business_name, city, state, listing_status, profile_json, leonix_ad_id, leonix_verified, internal_group",
  restaurantes_public_listings: "id, slug, status, listing_json",
  autos_classifieds_listings: "id, status, lang, listing_payload",
  listings: "id, title, description, city, state, price, is_free, status, is_published, listing_json",
  empleos_public_listings: "id, title, company_name, city, state, lifecycle_status, listing_snapshot",
  comida_local_public_listings: "id, business_name, city_display, city_canonical, status, listing_json",
};

/**
 * Bienes Raíces Negocio: the extra public-facing `listings` columns the real public detail maps
 * (title/price/city/zip, gallery, business identity + public contact, machine facts). `owner_id`,
 * payment, notes, moderation and inventory-graph ids are NOT here. `contact_json` is selected only
 * so its public `channels` sub-object can be lifted out — the raw column is never returned.
 */
const BR_NEGOCIO_COLUMNS =
  "id, title, description, city, state, price, is_free, status, is_published, listing_json, leonix_ad_id, zip, detail_pairs, contact_json, business_name, business_meta, contact_phone, contact_email, images";

function columnsFor(ctx: ProspectPreviewContext): string {
  if (ctx.listingSource === "listings" && ctx.category === "bienes-raices") return BR_NEGOCIO_COLUMNS;
  return SOURCE_COLUMNS[ctx.listingSource];
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/** Allow-listed public facts for the real Bienes Raíces Negocio detail. Key by key; no spread. */
function bienesNegocioRow(row: Record<string, unknown>): Record<string, unknown> {
  const contact = asRecord(typeof row.contact_json === "string" ? safeJson(row.contact_json) : row.contact_json);
  const channels = asRecord(contact?.channels);
  return {
    id: row.id ?? null,
    leonix_ad_id: row.leonix_ad_id ?? null,
    title: row.title ?? null,
    description: row.description ?? null,
    city: row.city ?? null,
    zip: row.zip ?? null,
    price: row.price ?? null,
    is_free: row.is_free ?? null,
    detail_pairs: row.detail_pairs ?? null,
    listing_json: row.listing_json ?? null,
    contact_json: channels ? { channels } : null,
    business_name: row.business_name ?? null,
    business_meta: row.business_meta ?? null,
    contact_phone: row.contact_phone ?? null,
    contact_email: row.contact_email ?? null,
    images: row.images ?? null,
  };
}

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
    // One logical SELECT of an allow-listed column set. Only for `listings` (which is shared with
    // databases behind on migrations) a column PostgREST reports missing is dropped and the same
    // SELECT retried — columns are only ever removed, never added.
    let columns = columnsFor(ctx);
    let data: unknown = null;
    let error: { message?: string } | null = null;
    for (let attempt = 0; attempt < 24; attempt++) {
      const res = await db.from(ctx.listingSource).select(columns).eq("id", ctx.listingId).maybeSingle();
      data = res.data;
      error = res.error ? { message: res.error.message } : null;
      if (!error) break;
      const missing = ctx.listingSource === "listings" ? missingListingsColumnName(error) : null;
      if (!missing) break;
      const next = stripSelectColumn(columns, missing);
      if (next === columns) break;
      columns = next;
    }
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
          row: isProspectRealComponentCategory(ctx.category)
            ? {
                leonix_ad_id: row.leonix_ad_id ?? null,
                leonix_verified: row.leonix_verified === true,
                internal_group: row.internal_group ?? null,
              }
            : null,
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
          row: null,
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
          // `lang` is the seller's authored language — the real Translate Ad source locale the
          // public detail reads from the same column. Already whitelisted above.
          row: ctx.category === "autos" ? { lang: row.lang === "en" ? "en" : row.lang === "es" ? "es" : null } : null,
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
          row: null,
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
          row: null,
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
          row: ctx.category === "bienes-raices" ? bienesNegocioRow(row) : null,
          expiresAtMs: ctx.expiresAtMs,
        };
      }
    }
  } catch {
    return null;
  }
}
