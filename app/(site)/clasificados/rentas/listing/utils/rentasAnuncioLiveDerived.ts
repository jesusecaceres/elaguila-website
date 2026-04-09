import { parseBusinessMeta } from "../../../config/businessListingContract";
import { buildLeonixBusinessLiveDisplay } from "../../../lib/leonixBusinessLiveDisplay";
import { inferRentasPlanTierFromListing } from "../../shared/utils/rentasPlanTier";
import type {
  RentasAnuncioFactPair,
  RentasAnuncioLang,
  RentasAnuncioListingLike,
  RentasNegocioLiveDisplay,
  RentasSameCompanySampleItem,
} from "../types/rentasAnuncioLiveTypes";

export function buildRentasMetaFromText(
  listing: RentasAnuncioListingLike,
  lang: RentasAnuncioLang
): { facts: RentasAnuncioFactPair[] } | null {
  const title = listing.title?.[lang] ?? "";
  const blurb = listing.blurb?.[lang] ?? "";
  const blob = `${title} ${blurb} ${listing.priceLabel?.[lang] ?? ""}`.toLowerCase();

  const has = (re: RegExp) => re.test(blob);

  const facts: RentasAnuncioFactPair[] = [];

  let type: string | null = null;
  if (has(/\bcuarto\b|\broom\b/)) type = lang === "es" ? "Cuarto" : "Room";
  else if (has(/\bestudio\b|\bstudio\b/)) type = lang === "es" ? "Estudio" : "Studio";
  else if (has(/\bapartamento\b|\bapartment\b/)) type = lang === "es" ? "Apartamento" : "Apartment";
  else if (has(/\bcasa\b|\bhouse\b|\bhogar\b/)) type = lang === "es" ? "Casa" : "House";

  if (type) facts.push({ label: lang === "es" ? "Tipo" : "Type", value: type });

  if (has(/utilities\s*incl|utilidades\s*incl|incl\.?\s*utilities/)) {
    facts.push({ label: lang === "es" ? "Servicios" : "Utilities", value: lang === "es" ? "Incluidos" : "Included" });
  } else if (has(/utilities|utilidades/)) {
    facts.push({ label: lang === "es" ? "Servicios" : "Utilities", value: lang === "es" ? "Mencionados" : "Mentioned" });
  }

  if (has(/deposit|dep[oó]sito/)) {
    facts.push({ label: lang === "es" ? "Depósito" : "Deposit", value: lang === "es" ? "Requerido (ver)" : "Required (see)" });
  }

  const date = (title + " " + blurb).match(/\b(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\b/);
  if (date) {
    facts.push({ label: lang === "es" ? "Disponible" : "Available", value: date[1] });
  } else if (has(/available\s+now|disponible\s+ya|inmediato/)) {
    facts.push({ label: lang === "es" ? "Disponible" : "Available", value: lang === "es" ? "Ahora" : "Now" });
  }

  return facts.length ? { facts } : null;
}

export function buildRentasRentalFacts(
  listing: RentasAnuncioListingLike,
  lang: RentasAnuncioLang,
  rentasMeta: { facts: RentasAnuncioFactPair[] } | null
): RentasAnuncioFactPair[] {
  const pairs = (listing.detailPairs ?? listing.detail_pairs) as RentasAnuncioFactPair[] | undefined;
  const priceVal = listing.priceLabel?.[lang] ?? "";
  const rentalFactLabels = new Set([
    "depósito",
    "deposit",
    "plazo del contrato",
    "lease term",
    "plazo contrato",
    "fecha disponible",
    "available date",
    "available",
    "disponible",
    "amueblado",
    "furnished",
    "mascotas",
    "pets",
    "mascotas permitidas",
    "estacionamiento",
    "parking",
    "servicios incluidos",
    "utilities included",
    "utilities",
    "lavandería",
    "laundry",
    "fumar",
    "smoking",
    "fumar permitido",
    "renta mensual",
    "monthly rent",
    "renta",
  ]);
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  const out: RentasAnuncioFactPair[] = [];
  if (priceVal) out.push({ label: lang === "es" ? "Renta mensual" : "Monthly rent", value: priceVal });
  if (Array.isArray(pairs)) {
    for (const p of pairs) {
      const n = normalize(p.label);
      if (rentalFactLabels.has(n) || /dep[oó]sito|plazo|disponible|amueblado|mascota|estacionamiento|servicio|lavander[ií]a|fumar|renta/i.test(n)) {
        if (!out.some((o) => normalize(o.label) === n)) out.push(p);
      }
    }
  }
  if (out.length <= 1 && rentasMeta?.facts) {
    for (const f of rentasMeta.facts) {
      if (!out.some((o) => o.label === f.label)) out.push(f);
    }
  }
  return out;
}

export function buildRentasAmenities(listing: RentasAnuncioListingLike): RentasAnuncioFactPair[] {
  const pairs = (listing.detailPairs ?? listing.detail_pairs) as RentasAnuncioFactPair[] | undefined;
  if (!Array.isArray(pairs) || pairs.length === 0) return [];
  const rentalFactLabels = new Set([
    "depósito",
    "deposit",
    "plazo del contrato",
    "lease term",
    "fecha disponible",
    "available date",
    "amueblado",
    "furnished",
    "mascotas",
    "pets",
    "estacionamiento",
    "parking",
    "servicios incluidos",
    "utilities included",
    "lavandería",
    "laundry",
    "fumar",
    "smoking",
    "renta mensual",
    "monthly rent",
  ]);
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return pairs.filter((p) => !rentalFactLabels.has(normalize(p.label)));
}

export function parseRentasBusinessMetaForLive(listing: RentasAnuncioListingLike): Record<string, string> | null {
  return parseBusinessMeta(listing.business_meta);
}

export function buildRentasNegocioLiveDisplay(
  listing: RentasAnuncioListingLike,
  rentasBusinessMeta: Record<string, string> | null,
  lang: RentasAnuncioLang
): RentasNegocioLiveDisplay | null {
  return buildLeonixBusinessLiveDisplay(listing, rentasBusinessMeta, lang);
}

export function filterRentasSameCompanySampleListings(
  listing: RentasAnuncioListingLike,
  isLiveDbListing: boolean,
  rentasBusinessMeta: Record<string, string> | null,
  sampleListings: readonly RentasSameCompanySampleItem[]
): RentasSameCompanySampleItem[] {
  if (isLiveDbListing) return [];
  const tier = inferRentasPlanTierFromListing(listing);
  const plusMore = rentasBusinessMeta?.negocioPlusMasAnuncios === "si";
  if (tier !== "business_plus" || !plusMore) return [];
  const bizName = ((listing.business_name ?? listing.businessName ?? "") as string).trim().toLowerCase();
  if (!bizName) return [];
  const list = sampleListings.filter((l) => {
    if (l.category !== "rentas" || l.id === listing.id) return false;
    const otherBiz = ((l.business_name ?? l.businessName ?? "") as string).trim().toLowerCase();
    return otherBiz === bizName;
  });
  return list.slice(0, 6);
}
