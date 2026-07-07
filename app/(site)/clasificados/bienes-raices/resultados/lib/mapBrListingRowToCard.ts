/**
 * Supabase `listings` row (category bienes-raices) → `BrNegocioListing` for resultados + cards.
 */

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import type { BrNegocioListing } from "../cards/listingTypes";
import { extractBrFacetsFromDetailPairs } from "./brFacetFromDetailPairs";
import { buildBrPublicLocationForLiveDetail } from "@/app/clasificados/lib/leonixBrGate12d";
import {
  formatLeonixLbPublicLocationLine,
  readLeonixPropertyLocationFromRow,
} from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
import { augmentLeonixDetailPairsFromStructuredColumns } from "@/app/clasificados/lib/leonixListingStructuredPayload";
import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";
import { resolveBrMonetizationVisibility } from "./brMonetizationVisibilityReadModel";

function imageUrlsFromJsonb(images: unknown): string[] {
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

function pairRows(detailPairs: unknown): Array<{ label: string; value: string }> {
  if (!Array.isArray(detailPairs)) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    const l = String(o.label ?? "").trim();
    const v = String(o.value ?? "").trim();
    if (l && v) out.push({ label: l, value: v });
  }
  return out;
}

/** Result card line: reuse Gate 12D composed privacy helper when possible. */
function brBrowseAddressLineFromRow(row: BrListingDbRow, facets: ReturnType<typeof extractBrFacetsFromDetailPairs>): string {
  const loc = readLeonixPropertyLocationFromRow(row as Record<string, unknown>);
  const formatted = formatLeonixLbPublicLocationLine({
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
    country: loc.country,
  });
  if (formatted.trim()) return formatted;
  const city = String(row.city ?? "").trim();
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(row.detail_pairs, row.listing_json, row.contact_json);
  const rows = pairRows(detailPairs);
  const legacy = buildBrPublicLocationForLiveDetail({
    detailPairs,
    humanRows: rows,
    listingCity: city,
  });
  if (legacy.display.trim()) return legacy.display;
  return city || "—";
}

function extractLeonixImageUrlsFromDescription(description: string | null | undefined): string[] {
  if (!description) return [];
  const m = description.match(/\[LEONIX_IMAGES\]([\s\S]*?)\[\/LEONIX_IMAGES\]/);
  if (!m) return [];
  const urls: string[] = [];
  for (const line of m[1].split("\n")) {
    const trimmed = line.trim();
    const um = /^url=(.+)$/i.exec(trimmed);
    if (um?.[1]) urls.push(um[1].trim());
  }
  return urls;
}

export type BrListingDbRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  city?: string | null;
  price?: number | null;
  is_free?: boolean | null;
  images?: unknown;
  detail_pairs?: unknown;
  listing_json?: unknown;
  contact_json?: unknown;
  owner_id?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
  seller_type?: string | null;
  business_name?: string | null;
  created_at?: string | null;
  /** When present (rich select), used with `created_at` / `published_at` for browse recency. */
  updated_at?: string | null;
  published_at?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  /**
   * Deferred: Optional monetization/placement fields for future highlighted/featured badges.
   * These fields do not currently exist in the listings table.
   * When added via migration, they can be safely selected and mapped.
   */
  package_tier?: string | null;
  package_key?: string | null;
  package_entitlement_id?: string | null;
  placement_tier?: string | null;
  placement_tier_key?: string | null;
  is_featured?: boolean | null;
  featured_until?: string | null;
  is_promoted?: boolean | null;
  promoted_until?: string | null;
  is_verified?: boolean | null;
  verified_at?: string | null;
};

function parseIsoMs(raw: string | null | undefined): number {
  if (!raw) return NaN;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/** Max of known timestamps so republish bumps `updated_at` and surfaces in `reciente`. */
export function brListingRecencySortMs(row: BrListingDbRow): number {
  const candidates = [parseIsoMs(row.created_at), parseIsoMs(row.updated_at), parseIsoMs(row.published_at)].filter(
    (n) => Number.isFinite(n)
  ) as number[];
  return candidates.length ? Math.max(...candidates) : NaN;
}

export function mapBrListingRowToNegocioCard(row: BrListingDbRow, lang: "es" | "en"): BrNegocioListing {
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(row.detail_pairs, row.listing_json, row.contact_json);
  const facets = extractBrFacetsFromDetailPairs(detailPairs);
  const fromJson = imageUrlsFromJsonb(row.images);
  const fromDesc = extractLeonixImageUrlsFromDescription(row.description ?? "");
  const merged = [...new Set([...fromJson, ...fromDesc])];
  const cover = merged[0] ?? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&auto=format&fit=crop";

  const priceNum = typeof row.price === "number" ? row.price : Number(String(row.price ?? "").replace(/[^0-9.]/g, ""));
  const isFree = Boolean(row.is_free);
  const priceStr = formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang, isFree });

  // Resolve monetization visibility state (read-only, no fake badges)
  const monetization = resolveBrMonetizationVisibility({
    seller_type: row.seller_type,
    detail_pairs: row.detail_pairs,
    listing_json: row.listing_json,
    contact_json: row.contact_json,
  });

  const sellerKind: "privado" | "negocio" = monetization.sellerKind;
  const badges: BrNegocioListing["badges"] = monetization.badgesToAdd;

  const cat = facets.categoriaPropiedad ?? "residencial";
  const title = String(row.title ?? "").trim() || (lang === "es" ? "Anuncio" : "Listing");
  const addressLine = brBrowseAddressLineFromRow({ ...row, detail_pairs: detailPairs }, facets);
  const locRow = readLeonixPropertyLocationFromRow({ ...row, detail_pairs: detailPairs } as Record<string, unknown>);

  const recencyMs = brListingRecencySortMs(row);

  const advName =
    (sellerKind === "negocio" ? String(row.business_name ?? "").trim() : "") ||
    (lang === "es" ? "Particular" : "Private seller");

  const metaLines = facets.metaHints.length ? facets.metaHints : undefined;
  const m = facets.machine;
  const zipNorm = m?.postalCode ? normalizeZipInput(m.postalCode) : "";
  const searchBlob =
    stripLeonixPublishedDescriptionBody(String(row.description ?? "")) ||
    String(row.description ?? "").trim();

  return {
    id: String(row.id),
    imageUrl: cover,
    price: priceStr,
    title,
    addressLine,
    beds: facets.beds,
    baths: facets.baths,
    sqft: facets.sqft,
    year: undefined,
    categoriaPropiedad: cat,
    badges,
    sellerKind,
    layout: "vertical",
    advertiser: {
      kind: sellerKind === "negocio" ? "oficina" : "agente",
      name: advName || (lang === "es" ? "Anunciante" : "Seller"),
      subtitle: sellerKind === "negocio" ? (lang === "es" ? "Negocios" : "Business") : undefined,
    },
    trustChip: sellerKind === "negocio" ? (lang === "es" ? "Negocio" : "Business") : lang === "es" ? "Particular" : "Private",
    operationLabel: facets.operation === "renta" ? "Renta" : facets.operation === "venta" ? "Venta" : undefined,
    metaLines,
    demoPublishedAtMs: Number.isFinite(recencyMs) ? recencyMs : undefined,
    zipCode: zipNorm || locRow.zip || undefined,
    stateCode: locRow.state || undefined,
    country: locRow.country || undefined,
    resultsPropertyKind: m?.resultsPropertyKind ?? null,
    facetPool: m?.pool ?? null,
    facetPets: m?.petsAllowed ?? null,
    facetFurnished: m?.furnished ?? null,
    searchBlob: searchBlob || undefined,
    adPlanLabel: monetization.adPlanLabelEs,
    adPlanKey: monetization.adPlanKey,
    monetizationWarnings: monetization.warnings,
    placementSignals: monetization.activePlacementSignals,
  };
}
