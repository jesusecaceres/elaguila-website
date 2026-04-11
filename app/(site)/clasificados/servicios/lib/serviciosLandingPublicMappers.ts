import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { formatServiciosInternalGroupForDiscovery } from "./serviciosInternalGroupDisplay";
import { inferServiciosSellerPresentation } from "./serviciosSellerKind";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";
import type {
  ServiciosLandingFeaturedBusiness,
  ServiciosLandingRecentListing,
} from "../landing/serviciosLandingSampleData";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80";

function resolvedProfile(row: ServiciosPublicListingRow, lang: ServiciosLang) {
  const wire = { ...row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
  return resolveServiciosProfile(wire, lang);
}

export function mapServiciosRowToLandingFeatured(
  row: ServiciosPublicListingRow,
  lang: ServiciosLang,
): ServiciosLandingFeaturedBusiness {
  const profile = resolvedProfile(row, lang);
  const L = getServiciosProfileLabels(lang);
  const thumb =
    profile.hero.coverImageUrl ||
    profile.gallery[0]?.url ||
    profile.hero.logoUrl ||
    FALLBACK_COVER;
  const alt =
    profile.hero.coverImageAlt?.trim() ||
    profile.gallery[0]?.alt?.trim() ||
    profile.identity.businessName;
  const groupLabel = formatServiciosInternalGroupForDiscovery(row.internal_group, lang);
  const categoryLine = (profile.hero.categoryLine?.trim() || groupLabel || (lang === "en" ? "Local services" : "Servicios locales")).trim();
  const zipOrArea =
    row.profile_json.contact?.physicalPostalCode?.trim() ||
    row.city?.trim() ||
    "";

  const rating = profile.hero.rating;
  const rc = profile.hero.reviewCount;
  const ratingSummary =
    typeof rating === "number" &&
    rating > 0 &&
    typeof rc === "number" &&
    rc >= 0
      ? { rating, reviewCount: rc }
      : undefined;

  const tel = profile.contact.phoneTelHref;
  const detailHref = `/clasificados/servicios/${encodeURIComponent(row.slug)}`;

  const cta =
    tel && profile.contact.phoneDisplay
      ? { kind: "call" as const, label: L.call, telHref: tel }
      : {
          kind: "detail" as const,
          label: lang === "en" ? "View profile" : "Ver vitrina",
          detailHref,
        };

  return {
    id: row.slug,
    businessName: profile.identity.businessName,
    categoryKey: row.internal_group ?? "other",
    categoryLine,
    city: row.city?.trim() || row.profile_json.contact?.physicalCity?.trim() || "",
    zipOrArea,
    coverImageSrc: thumb,
    coverImageAlt: alt,
    ratingSummary,
    featured: true,
    cta,
  };
}

export function mapServiciosRowToLandingRecent(
  row: ServiciosPublicListingRow,
  lang: ServiciosLang,
): ServiciosLandingRecentListing {
  const profile = resolvedProfile(row, lang);
  const L = getServiciosProfileLabels(lang);
  const services = profile.services;
  const serviceTitle =
    services[0]?.title?.trim() ||
    profile.hero.categoryLine?.trim() ||
    profile.identity.businessName;
  const description =
    profile.about?.text?.trim()?.slice(0, 240) ||
    services[0]?.secondaryLine?.trim() ||
    "";
  const thumb =
    services[0]?.imageUrl ||
    profile.gallery[0]?.url ||
    profile.hero.coverImageUrl ||
    FALLBACK_COVER;
  const alt = services[0]?.imageAlt || profile.gallery[0]?.alt || profile.identity.businessName;
  const sellerPresentation = inferServiciosSellerPresentation(row.profile_json);
  const rating = profile.hero.rating;
  const cta =
    profile.contact.phoneTelHref && profile.contact.phoneDisplay
      ? { kind: "call" as const, label: L.call, telHref: profile.contact.phoneTelHref }
      : {
          kind: "detail" as const,
          label: lang === "en" ? "View profile" : "Ver vitrina",
          detailHref: `/clasificados/servicios/${encodeURIComponent(row.slug)}`,
        };

  return {
    id: row.slug,
    serviceTitle,
    businessName: profile.identity.businessName,
    description,
    coverImageSrc: thumb,
    coverImageAlt: alt,
    rating: typeof rating === "number" && rating > 0 ? rating : undefined,
    sellerPresentation,
    cta,
  };
}
