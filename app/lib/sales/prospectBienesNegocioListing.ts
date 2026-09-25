/**
 * PROSPECT PREVIEW — Bienes Raíces Negocio: the whitelisted row -> `BienesLiveListingLike` mapping.
 *
 * The public detail (`/clasificados/anuncio/[id]`, `mapDbListingRowToListing` + the BR branch that
 * builds `brListingProps`) turns a `listings` row into the object the real Negocio detail renders.
 * That mapper lives inside a client page module that cannot export it, so this file reproduces the
 * SAME field-by-field mapping for the private prospect preview. It is pure (no React, no I/O) so a
 * verifier executes it and pins the two helpers below against the public page's source text — the
 * two copies cannot drift silently.
 *
 * What is deliberately NOT mapped: `owner_id`, the inventory graph (`br_inventory_*`,
 * `inventory_role`), status/lifecycle and anything else the prospect row does not carry. The
 * prospect preview has no owner identity, no parent/child portfolio and no engagement identity.
 */
import type { BienesLiveListingLike } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { stripLeonixPublishedDescriptionBody } from "@/app/(site)/clasificados/lib/leonixListingGalleryMarker";
import { augmentLeonixDetailPairsFromStructuredColumns } from "@/app/(site)/clasificados/lib/leonixListingStructuredPayload";

/** Verbatim from the public anuncio page (`imageUrlsFromJsonb`). */
export function imageUrlsFromJsonb(images: unknown): string[] {
  if (images == null) return [];
  if (Array.isArray(images)) {
    return images
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (item && typeof item === "object") {
          const obj = item as Record<string, unknown>;
          const url = (obj.url ?? obj.src ?? obj.path) as string | undefined;
          if (typeof url === "string" && url.trim()) return url.trim();
        }
        return null;
      })
      .filter((u): u is string => u != null);
  }
  return [];
}

/** Verbatim from the public anuncio page (`extractLeonixImageUrlsFromDescription`). */
export function extractLeonixImageUrlsFromDescription(description: string | null | undefined): string[] {
  if (!description) return [];
  const m = description.match(/\[LEONIX_IMAGES\]([\s\S]*?)\[\/LEONIX_IMAGES\]/);
  if (!m) return [];
  const block = m[1];
  const urls: string[] = [];
  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    const um = /^url=(.+)$/i.exec(trimmed);
    if (um?.[1]) urls.push(um[1].trim());
  }
  return urls;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * Same mapping as the public page: `mapDbListingRowToListing` (title/price/blurb/images/contact) and
 * the BR `brListingProps` object, minus every owner/inventory identity field.
 */
export function buildProspectBienesNegocioListing(
  row: Record<string, unknown> | null | undefined,
  fallbackId: string,
): BienesLiveListingLike | null {
  if (!row) return null;
  const rawDesc = String(row.description ?? "");
  const blurbText = stripLeonixPublishedDescriptionBody(rawDesc) || rawDesc.trim();
  const merged = [...new Set([...imageUrlsFromJsonb(row.images), ...extractLeonixImageUrlsFromDescription(rawDesc)])];

  const isFree = Boolean(row.is_free);
  const priceRaw = row.price;
  const priceNum = typeof priceRaw === "number" ? priceRaw : Number(String(priceRaw ?? "").replace(/[^0-9.]/g, ""));
  const priceLabel = {
    es: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "es", isFree }),
    en: formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang: "en", isFree }),
  };
  const title = String(row.title ?? "").trim();
  const id = text(row.id) ?? fallbackId;

  return {
    id,
    title: { es: title, en: title },
    priceLabel,
    city: String(row.city ?? "").trim(),
    blurb: { es: blurbText, en: blurbText },
    images: merged.length > 0 ? merged : null,
    businessName: row.business_name != null ? String(row.business_name) : null,
    business_name: row.business_name != null ? String(row.business_name) : null,
    detailPairs: augmentLeonixDetailPairsFromStructuredColumns(row.detail_pairs, row.listing_json, row.contact_json),
    owner_id: null,
    leonix_ad_id: text(row.leonix_ad_id),
    business_meta: typeof row.business_meta === "string" ? row.business_meta : null,
    contact_phone: text(row.contact_phone),
    contact_email: text(row.contact_email),
    zip: text(row.zip),
    br_inventory_group_id: null,
    br_inventory_parent_listing_id: null,
    inventory_role: null,
    priceNumber: Number.isFinite(priceNum) && priceNum > 0 ? priceNum : null,
  };
}
