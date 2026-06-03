/**
 * Gate S2 — saved_listings row identity for Servicios (both professional + standard pipelines).
 * listing_id matches serviciosEngagementListingKey (leonix_ad_id → id → slug).
 */
import { serviciosEngagementListingKey } from "@/app/(site)/clasificados/servicios/lib/serviciosPublicListingSort";

export type ServiciosSavedListingSource = {
  slug: string;
  id?: string | null;
  leonix_ad_id?: string | null;
};

function isLeonixAdId(s: string): boolean {
  return /^[A-Z]+-\d{4}-\d{6}$/.test(s.trim());
}

function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());
}

export type ServiciosSaveExtras = {
  category?: string;
  source_table?: string;
  source_id?: string;
  canonical_ad_id?: string;
};

export function serviciosSavedListingExtras(row: ServiciosSavedListingSource): ServiciosSaveExtras {
  const slug = (row.slug ?? "").trim();
  const sourceId = (row.id ?? "").trim() || slug;
  const listingId = serviciosEngagementListingKey({ slug, id: row.id, leonix_ad_id: row.leonix_ad_id });
  return {
    category: "servicios",
    source_table: "servicios_public_listings",
    source_id: sourceId,
    canonical_ad_id: listingId,
  };
}

/** Client-side (profile shell): engagement key + slug from live page props. */
export function serviciosSavedListingExtrasFromClient(args: {
  slug: string;
  engagementListingId?: string | null;
}): ServiciosSaveExtras {
  const slug = (args.slug ?? "").trim();
  const key = (args.engagementListingId ?? "").trim();
  const leonix_ad_id = isLeonixAdId(key) ? key : null;
  const id = isUuid(key) ? key : null;
  return serviciosSavedListingExtras({ slug, id, leonix_ad_id });
}
