import { parseNegocioRedesSocialLinks } from "@/app/clasificados/rentas/listing/utils/negocioRedesSocialLinks";
import { parseBusinessMeta } from "@/app/clasificados/config/businessListingContract";
import type { RentasAnuncioLang, RentasNegocioLiveDisplay } from "@/app/clasificados/rentas/listing/types/rentasAnuncioLiveTypes";

type ListingLike = {
  sellerType?: string;
  seller_type?: string;
  businessName?: string | null;
  business_name?: string | null;
  business_meta?: string | null;
};

/**
 * Shared BR + Rentas business (negocio) rail: agent, office, brand, social — same `business_meta` contract.
 */
export function buildLeonixBusinessLiveDisplay(
  listing: ListingLike,
  businessMeta: Record<string, string> | null,
  lang: RentasAnuncioLang
): RentasNegocioLiveDisplay | null {
  const isBiz = listing.sellerType === "business" || listing.seller_type === "business";
  if (!isBiz) return null;
  const name =
    (listing.business_name ?? listing.businessName ?? businessMeta?.negocioNombre ?? "") as string;
  const meta = businessMeta ?? {};
  const website = meta.negocioSitioWeb?.trim() || "";
  const rawSocials = meta.negocioRedes?.trim() || "";
  const socialLinks = parseNegocioRedesSocialLinks(rawSocials);
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
  };
}

export function parseLeonixBusinessMetaForLive(businessMetaRaw: unknown): Record<string, string> | null {
  return parseBusinessMeta(businessMetaRaw);
}
