import "server-only";

import { createClient } from "@supabase/supabase-js";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";

export type ListingHeadMetadataRow = {
  title: string;
  description: string | null;
  imageUrl: string | null;
  leonixAdId: string | null;
};

/**
 * Minimal published-listing read for `<head>` metadata on `/clasificados/anuncio/[id]`.
 * Returns null when the row is missing or not publicly published.
 */
export async function fetchListingHeadMetadata(listingId: string): Promise<ListingHeadMetadataRow | null> {
  const id = listingId.trim();
  if (!id) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const sb = createClient(url, key);
  const { data, error } = await sb
    .from("listings")
    .select("title, description, images, leonix_ad_id, status, is_published")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as {
    title?: string | null;
    description?: string | null;
    images?: unknown;
    leonix_ad_id?: string | null;
    status?: string | null;
    is_published?: boolean | null;
  };

  if (row.is_published === false) return null;
  const statusNorm = String(row.status ?? "").trim().toLowerCase();
  if (statusNorm && statusNorm !== "active") return null;

  const title = String(row.title ?? "").trim();
  if (!title) return null;

  const rawDesc = stripLeonixPublishedDescriptionBody(String(row.description ?? "")).trim();
  const description = rawDesc ? rawDesc.slice(0, 155) : null;

  let imageUrl: string | null = null;
  const images = row.images;
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === "string" && first.trim()) imageUrl = first.trim();
  }

  const leonixAdId = row.leonix_ad_id?.trim() || null;

  return { title, description, imageUrl, leonixAdId };
}
