import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";
import type {
  BrAnuncioLang,
  BrAnuncioListingLike,
  BrNegocioLiveDisplay,
  BrSameCompanySampleItem,
} from "../types/brAnuncioLiveTypes";
import { parseBrNegocioRedesSocialLinks } from "./brNegocioRedesSocialLinks";
import { coalesceWizardDetailValue } from "@/app/clasificados/en-venta/publish/coalesceWizardDetailValue";
import { LEGACY_WIZARD_BR_DETAIL } from "@/app/clasificados/en-venta/publish/wizardDraftLegacyKeys";

function isBusinessSeller(listing: BrAnuncioListingLike): boolean {
  return listing.sellerType === "business" || listing.seller_type === "business";
}

export function isBienesRaicesNegocioLive(listing: BrAnuncioListingLike | null | undefined): boolean {
  return Boolean(listing?.category === "bienes-raices" && isBusinessSeller(listing));
}

export function isBienesRaicesPrivadoLive(listing: BrAnuncioListingLike | null | undefined): boolean {
  return Boolean(listing?.category === "bienes-raices" && !isBienesRaicesNegocioLive(listing));
}

export function parseBienesRaicesBusinessMeta(
  listing: BrAnuncioListingLike | null | undefined
): Record<string, string> | null {
  if (!listing || listing.category !== "bienes-raices") return null;
  return parseBusinessMeta((listing as { business_meta?: string | null }).business_meta);
}

export function buildBrNegocioLiveDisplay(
  listing: BrAnuncioListingLike | null | undefined,
  bienesRaicesBusinessMeta: Record<string, string> | null,
  lang: BrAnuncioLang
): BrNegocioLiveDisplay | null {
  if (!listing || listing.category !== "bienes-raices" || !isBusinessSeller(listing)) return null;
  const name =
    (listing as { business_name?: string | null; businessName?: string | null }).business_name ??
    (listing as { business_name?: string | null; businessName?: string | null }).businessName ??
    bienesRaicesBusinessMeta?.negocioNombre ??
    "";
  const meta = bienesRaicesBusinessMeta ?? {};
  const website = meta.negocioSitioWeb?.trim() || "";
  const rawSocials = meta.negocioRedes?.trim() || "";
  const socialLinks = parseBrNegocioRedesSocialLinks(rawSocials);
  let availabilityRows: Array<{ title: string; price: string; size: string; ctaText?: string; ctaLink?: string }> = [];
  try {
    const raw = meta.negocioDisponibilidadPrecios?.trim();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) availabilityRows = parsed;
    }
  } catch {
    /* ignore */
  }
  return {
    name: name.trim() || (lang === "es" ? "Negocio" : "Business"),
    agent: meta.negocioAgente?.trim() || "",
    role: meta.negocioCargo?.trim() || "",
    agentLicense: meta.negocioLicencia?.trim() || "",
    officePhone: meta.negocioTelOficina?.trim() || "",
    website: website || null,
    socialLinks,
    rawSocials: socialLinks ? "" : rawSocials,
    logoUrl: meta.negocioLogoUrl?.trim() || null,
    agentPhotoUrl: meta.negocioFotoAgenteUrl?.trim() || null,
    languages: meta.negocioIdiomas?.trim() || "",
    hours: meta.negocioHorario?.trim() || "",
    virtualTourUrl: meta.negocioRecorridoVirtual?.trim() || null,
    plusMoreListings: meta.negocioPlusMasAnuncios === "si",
    businessDescription: meta.negocioDescripcion?.trim() || "",
    availabilityRows,
  };
}

export function filterBienesRaicesSameCompanySampleListings(
  listing: BrAnuncioListingLike | null | undefined,
  isLiveDbListing: boolean,
  bienesRaicesBusinessMeta: Record<string, string> | null,
  sampleListings: readonly BrSameCompanySampleItem[]
): BrSameCompanySampleItem[] {
  if (!listing || listing.category !== "bienes-raices") return [];
  if (isLiveDbListing) return [];
  if (!isBusinessSeller(listing)) return [];
  const plusMore = bienesRaicesBusinessMeta?.negocioPlusMasAnuncios === "si";
  if (!plusMore) return [];
  const bizName =
    (
      (listing as { business_name?: string | null; businessName?: string | null }).business_name ??
      (listing as { business_name?: string | null; businessName?: string | null }).businessName ??
      ""
    )
      .trim()
      .toLowerCase();
  if (!bizName) return [];
  const list = sampleListings.filter((l) => {
    if (l.category !== "bienes-raices" || l.id === listing.id) return false;
    const otherBiz = (
      (l as unknown as { business_name?: string; businessName?: string }).business_name ??
      (l as unknown as { business_name?: string; businessName?: string }).businessName ??
      ""
    )
      .trim()
      .toLowerCase();
    return otherBiz === bizName;
  });
  return list.slice(0, 6);
}

export function buildBienesRaicesLiveFacts(listing: BrAnuncioListingLike | null | undefined): Array<{ label: string; value: string }> {
  if (!listing || listing.category !== "bienes-raices") return [];
  const pairs = listing.detailPairs ?? listing.detail_pairs;
  if (!Array.isArray(pairs)) return [];
  return pairs.filter((p) => {
    const v = (p.value ?? "").trim();
    if (v.startsWith("http://") || v.startsWith("https://")) return false;
    return true;
  });
}

export function resolveBrLiveVirtualTourUrl(
  listing: BrAnuncioListingLike | null | undefined,
  brNegocioVirtualTour: string | null | undefined
): string | null {
  if (!listing || listing.category !== "bienes-raices") return null;
  const fromRail = (brNegocioVirtualTour ?? "").trim();
  if (fromRail) return fromRail;
  const pairs = listing.detailPairs ?? listing.detail_pairs;
  if (Array.isArray(pairs)) {
    const tour = pairs.find(
      (p) => /tour|recorrido|virtual/i.test(p.label ?? "") && /^https?:\/\//i.test((p.value ?? "").trim())
    );
    return tour?.value?.trim() || null;
  }
  return null;
}

export function brBaseAddressFromListing(listing: BrAnuncioListingLike | null | undefined): string {
  if (!listing || listing.category !== "bienes-raices") return "";
  const details = (listing.details ?? {}) as Record<string, string | undefined>;
  const addr = coalesceWizardDetailValue(details, "brAddress", LEGACY_WIZARD_BR_DETAIL.address);
  if (addr) return addr;
  const pairs = listing.detailPairs ?? listing.detail_pairs;
  if (Array.isArray(pairs)) {
    const p = pairs.find((x) => /direcci[oó]n|address/i.test(x.label ?? ""));
    return (p?.value ?? "").trim();
  }
  return "";
}

export function brBaseZoneFromListing(listing: BrAnuncioListingLike | null | undefined): string {
  if (!listing || listing.category !== "bienes-raices") return "";
  const details = (listing.details ?? {}) as Record<string, string | undefined>;
  const z = coalesceWizardDetailValue(details, "brZone", LEGACY_WIZARD_BR_DETAIL.zone);
  if (z) return z;
  const pairs = listing.detailPairs ?? listing.detail_pairs;
  if (Array.isArray(pairs)) {
    const p = pairs.find((x) => /vecindad|neighborhood|zona|zone/i.test(x.label ?? ""));
    return (p?.value ?? "").trim();
  }
  return "";
}

export function brBaseFeatureTagsFromListing(listing: BrAnuncioListingLike | null | undefined): string[] {
  if (!listing || listing.category !== "bienes-raices") return [];
  const pairs = listing.detailPairs ?? listing.detail_pairs;
  if (!Array.isArray(pairs)) return [];
  const featureLabels = [/piscina|pool/i, /lavander[ií]a|laundry/i, /estacionamiento|parking|garage/i, /jard[ií]n|garden/i, /gimnasio|gym/i];
  const out: string[] = [];
  for (const p of pairs) {
    const label = (p.label ?? "").trim();
    const value = (p.value ?? "").trim();
    if (!value || value.startsWith("http")) continue;
    if (featureLabels.some((re) => re.test(label))) out.push(label);
  }
  return out.slice(0, 8);
}
