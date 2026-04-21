/**
 * Maps Supabase `listings` rows (category `rentas`) → `RentasPublicListing` for browse/detail.
 * Resilient to partial rows; discovery filters read numeric rent from `rentMonthly` and machine keys in `detail_pairs`.
 */

import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import {
  parseLeonixListingContract,
  type LeonixClasificadosBranch,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RENTAS_DP_DEPOSIT_USD } from "@/app/clasificados/rentas/lib/rentasMachineDetailPairs";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function pairValue(detailPairs: unknown, needle: string): string | null {
  if (!Array.isArray(detailPairs)) return null;
  const n = needle.toLowerCase();
  for (const p of detailPairs) {
    if (!p || typeof p !== "object") continue;
    const o = p as { label?: string; value?: string };
    const lab = trim(o.label).toLowerCase();
    if (lab === n || lab.includes(n)) {
      const v = trim(o.value);
      return v || null;
    }
  }
  return null;
}

function firstImageUrl(images: unknown): string {
  if (images == null) return "";
  if (Array.isArray(images) && images.length) {
    const first = images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (first && typeof first === "object") {
      const u = (first as Record<string, unknown>).url ?? (first as Record<string, unknown>).src;
      if (typeof u === "string" && u.trim()) return u.trim();
    }
  }
  return "";
}

function galleryUrls(images: unknown): string[] | undefined {
  if (!Array.isArray(images) || !images.length) return undefined;
  const out: string[] = [];
  for (const item of images) {
    if (typeof item === "string" && item.trim()) out.push(item.trim());
    else if (item && typeof item === "object") {
      const u = (item as Record<string, unknown>).url ?? (item as Record<string, unknown>).src;
      if (typeof u === "string" && u.trim()) out.push(u.trim());
    }
  }
  return out.length ? out : undefined;
}

function branchToSeller(branch: LeonixClasificadosBranch | null): "privado" | "negocio" {
  if (branch === "rentas_negocio" || branch === "bienes_raices_negocio") return "negocio";
  return "privado";
}

function rentDisplayFromPrice(price: unknown, lang: "es" | "en"): string {
  const n = typeof price === "number" && Number.isFinite(price) ? price : Number(String(price ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return lang === "es" ? "Consultar" : "Inquire";
  try {
    const cur = new Intl.NumberFormat(lang === "es" ? "es-MX" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.round(n));
    return lang === "es" ? `${cur} / mes` : `${cur} / mo`;
  } catch {
    return `$${Math.round(n)} / mo`;
  }
}

function bedsFromPairs(dp: unknown): string {
  return (
    pairValue(dp, "recámaras") ??
    pairValue(dp, "recamaras") ??
    pairValue(dp, "bedrooms") ??
    pairValue(dp, "habitaciones") ??
    "—"
  );
}

function bathsFromPairs(dp: unknown): string {
  return pairValue(dp, "baños") ?? pairValue(dp, "baths") ?? pairValue(dp, "bathrooms") ?? "—";
}

function sqftFromPairs(dp: unknown): string {
  return pairValue(dp, "superficie") ?? pairValue(dp, "sqft") ?? pairValue(dp, "m²") ?? "—";
}

function amuebladoFromPairs(dp: unknown): boolean | undefined {
  const a =
    pairValue(dp, "amueblado") ??
    pairValue(dp, "furnished") ??
    "";
  const t = a.toLowerCase();
  if (t.includes("amuebl") || t === "yes" || t === "sí" || t === "si") return true;
  if (t.includes("sin amuebl") || t === "unfurnished" || t === "no") return false;
  return undefined;
}

function mascotasFromPairs(dp: unknown): boolean | undefined {
  const a = pairValue(dp, "mascotas") ?? pairValue(dp, "pets") ?? "";
  const t = a.toLowerCase();
  if (t.includes("permit") || t === "yes" || t === "sí" || t === "si") return true;
  if (t.includes("no permit") || t === "no") return false;
  return undefined;
}

export type ListingRowLike = Record<string, unknown>;

/**
 * Returns `null` if the row is not a Rentas listing we can surface publicly.
 */
export function mapListingRowToRentasPublicListing(row: ListingRowLike, lang: "es" | "en" = "es"): RentasPublicListing | null {
  const cat = String(row.category ?? "").toLowerCase();
  if (cat !== "rentas") return null;

  const status = String(row.status ?? "").toLowerCase();
  const published = row.is_published !== false;
  const browseActive = status === "active" && published;

  const lx = parseLeonixListingContract(row.detail_pairs);
  const branchSeller = branchToSeller(lx.branch);
  const categoria: BrNegocioCategoriaPropiedad =
    lx.categoriaPropiedad === "residencial" || lx.categoriaPropiedad === "comercial" || lx.categoriaPropiedad === "terreno_lote"
      ? lx.categoriaPropiedad
      : "residencial";

  const id = trim(row.id);
  if (!id) return null;

  const title = trim(row.title) || (lang === "es" ? "Renta" : "Rental");
  const city = trim(row.city) || undefined;
  const zipRaw = trim(row.zip);
  const postalCode = zipRaw.replace(/\D/g, "").slice(0, 10) || undefined;
  const addressLine = [city, postalCode].filter(Boolean).join(city && postalCode ? ", " : "") || city || postalCode || "—";

  const priceNum =
    typeof row.price === "number" && Number.isFinite(row.price)
      ? Math.round(row.price)
      : Math.round(Number(String(row.price ?? "").replace(/[^0-9.]/g, "")) || 0);

  const depRaw = pairValue(row.detail_pairs, RENTAS_DP_DEPOSIT_USD);
  const depNum = depRaw ? Math.round(Number(String(depRaw).replace(/\D/g, "")) || 0) : 0;
  const depositUsd = depNum > 0 ? depNum : undefined;

  const phoneRaw = trim(row.contact_phone);
  const emailRaw = trim(row.contact_email);
  const contactPhone = phoneRaw.replace(/\D/g, "").length >= 10 ? phoneRaw : undefined;
  const contactEmail = emailRaw.includes("@") ? emailRaw : undefined;

  const img = firstImageUrl(row.images);
  const gal = galleryUrls(row.images);
  const imageUrl = img || "https://images.unsplash.com/photo-1600585154340-0ef3c08dc8e4?w=800&q=80&auto=format&fit=crop";

  const created = trim(row.created_at);
  const publishedAt = created || undefined;

  const biz = trim(row.business_name);
  const sellerDisplay =
    branchSeller === "negocio"
      ? { es: biz || "Negocio", en: biz || "Business" }
      : { es: "Particular", en: "Private seller" };

  return {
    id,
    slug: id,
    title,
    imageUrl,
    galleryUrls: gal,
    rentDisplay: rentDisplayFromPrice(row.price, lang),
    rentMonthly: priceNum > 0 ? priceNum : undefined,
    depositUsd,
    contactPhone,
    contactEmail,
    addressLine,
    city,
    postalCode,
    publishedAt,
    browseActive,
    beds: bedsFromPairs(row.detail_pairs),
    baths: bathsFromPairs(row.detail_pairs),
    sqft: sqftFromPairs(row.detail_pairs),
    categoriaPropiedad: categoria,
    branch: branchSeller,
    badges: branchSeller === "negocio" ? ["negocio"] : ["privado"],
    promoted: false,
    recencyRank: publishedAt ? Math.min(100, Math.floor(Date.parse(publishedAt) / 86400000) % 100) : 50,
    amueblado: amuebladoFromPairs(row.detail_pairs),
    mascotasPermitidas: mascotasFromPairs(row.detail_pairs),
    description: {
      es: trim(row.description) || "Anuncio publicado en Leonix Rentas.",
      en: trim(row.description) || "Listing published on Leonix Rentals.",
    },
    sellerDisplay,
  };
}
