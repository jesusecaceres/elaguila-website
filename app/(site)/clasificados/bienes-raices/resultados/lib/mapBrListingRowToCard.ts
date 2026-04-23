/**
 * Supabase `listings` row (category bienes-raices) → `BrNegocioListing` for resultados + cards.
 */

import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import type { BrNegocioListing } from "../cards/listingTypes";
import { extractBrFacetsFromDetailPairs } from "./brFacetFromDetailPairs";

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
  seller_type?: string | null;
  business_name?: string | null;
  created_at?: string | null;
  /** When present (rich select), used with `created_at` / `published_at` for browse recency. */
  updated_at?: string | null;
  published_at?: string | null;
  status?: string | null;
  is_published?: boolean | null;
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
  const facets = extractBrFacetsFromDetailPairs(row.detail_pairs);
  const fromJson = imageUrlsFromJsonb(row.images);
  const fromDesc = extractLeonixImageUrlsFromDescription(row.description ?? "");
  const merged = [...new Set([...fromJson, ...fromDesc])];
  const cover = merged[0] ?? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80&auto=format&fit=crop";

  const priceNum = typeof row.price === "number" ? row.price : Number(String(row.price ?? "").replace(/[^0-9.]/g, ""));
  const isFree = Boolean(row.is_free);
  const priceStr = formatListingPrice(Number.isFinite(priceNum) ? priceNum : 0, { lang, isFree });

  const isNegocio =
    row.seller_type === "business" ||
    facets.branch === "bienes_raices_negocio" ||
    facets.branch === "rentas_negocio";

  const sellerKind: "privado" | "negocio" = isNegocio ? "negocio" : "privado";
  const badges: BrNegocioListing["badges"] = isNegocio ? ["negocio"] : [];

  const cat = facets.categoriaPropiedad ?? "residencial";
  const title = String(row.title ?? "").trim() || (lang === "es" ? "Anuncio" : "Listing");
  const city = String(row.city ?? "").trim() || "—";

  const recencyMs = brListingRecencySortMs(row);

  const advName =
    (isNegocio ? String(row.business_name ?? "").trim() : "") ||
    (lang === "es" ? "Particular" : "Private seller");

  const metaLines = facets.metaHints.length ? facets.metaHints : undefined;
  const m = facets.machine;
  const zipNorm = m?.postalCode ? normalizeZipInput(m.postalCode) : "";

  return {
    id: String(row.id),
    imageUrl: cover,
    price: priceStr,
    title,
    addressLine: city,
    beds: facets.beds,
    baths: facets.baths,
    sqft: "—",
    year: undefined,
    categoriaPropiedad: cat,
    badges,
    sellerKind,
    layout: "vertical",
    advertiser: {
      kind: isNegocio ? "oficina" : "agente",
      name: advName || (lang === "es" ? "Anunciante" : "Seller"),
      subtitle: isNegocio ? (lang === "es" ? "Negocios" : "Business") : undefined,
    },
    trustChip: isNegocio ? (lang === "es" ? "Negocio" : "Business") : lang === "es" ? "Particular" : "Private",
    operationLabel: facets.operation === "renta" ? "Renta" : facets.operation === "venta" ? "Venta" : undefined,
    metaLines,
    demoPublishedAtMs: Number.isFinite(recencyMs) ? recencyMs : undefined,
    zipCode: zipNorm || undefined,
    resultsPropertyKind: m?.resultsPropertyKind ?? null,
    facetPool: m?.pool ?? null,
    facetPets: m?.petsAllowed ?? null,
    facetFurnished: m?.furnished ?? null,
  };
}
