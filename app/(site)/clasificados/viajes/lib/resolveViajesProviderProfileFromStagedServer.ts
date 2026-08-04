import "server-only";

import { unstable_cache } from "next/cache";

import type { ViajesNegocioFeaturedOffer, ViajesNegocioProfileModel } from "../data/viajesNegocioProfileSampleData";
import { VIAJES_CACHE_TAG_BROWSE } from "./viajesCacheTags";
import { fetchApprovedViajesStagedRows } from "./viajesStagedListingsDbServer";
import { normalizeViajesOfferToV2 } from "./v2/normalizeViajesOfferToV2";
import { isViajesDurableHttpsUrl } from "./v2/viajesMediaDurableGuards";
import { viajesPublicAddressLabel } from "./viajesPublicLocation";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function profileSlugCandidates(rowSlug: string, businessProfileSlug: string | null, profileRoute: string, name: string): string[] {
  const out = new Set<string>();
  if (businessProfileSlug?.trim()) out.add(businessProfileSlug.trim().toLowerCase());
  const routeLast = profileRoute
    .trim()
    .split("/")
    .filter(Boolean)
    .pop();
  if (routeLast) out.add(routeLast.toLowerCase());
  const fromName = slugify(name);
  if (fromName) out.add(fromName);
  if (rowSlug.trim()) out.add(rowSlug.trim().toLowerCase());
  return [...out];
}

async function resolveViajesProviderProfileUncached(slug: string, lang: "es" | "en"): Promise<ViajesNegocioProfileModel | null> {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  const rows = await fetchApprovedViajesStagedRows();
  const matches = rows.filter((row) => {
    if (row.lane !== "business" && row.lane !== "affiliate") return false;
    const offer = normalizeViajesOfferToV2(row.listing_json, {
      locale: lang,
      laneHint: row.lane === "affiliate" ? "affiliate" : "business",
    });
    if (offer.lane === "private") return false;
    const candidates = profileSlugCandidates(
      row.slug,
      row.business_profile_slug,
      offer.provider.profileRoute,
      offer.provider.name || row.submitter_name || ""
    );
    return candidates.includes(key);
  });

  if (!matches.length) return null;

  const primary = matches[0]!;
  const primaryOffer = normalizeViajesOfferToV2(primary.listing_json, {
    locale: lang,
    laneHint: primary.lane === "affiliate" ? "affiliate" : "business",
  });
  const provider = primaryOffer.provider;
  const name = provider.name.trim() || primary.submitter_name?.trim() || key;
  const office = viajesPublicAddressLabel(primaryOffer.locations.providerOffice);

  const featuredOffers: ViajesNegocioFeaturedOffer[] = matches.slice(0, 8).map((row) => {
    const offer = normalizeViajesOfferToV2(row.listing_json, {
      locale: lang,
      laneHint: row.lane === "affiliate" ? "affiliate" : "business",
    });
    const title = offer.basics.title.trim() || row.title;
    const image =
      row.hero_image_url?.trim() ||
      offer.media.images.find((i) => isViajesDurableHttpsUrl(i.url))?.url ||
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80";
    return {
      title,
      destination: offer.basics.destinationLabel || offer.locations.destination.city || "—",
      priceHint: offer.pricing.priceFrom.trim() || "—",
      href: `/clasificados/viajes/oferta/${row.slug}`,
      imageSrc: image,
      imageAlt: title,
    };
  });

  return {
    slug: key,
    businessName: name,
    ...(isViajesDurableHttpsUrl(provider.logoUrl) ? { logoSrc: provider.logoUrl, logoAlt: name } : {}),
    tagline: provider.type.trim() || (lang === "en" ? "Travel business" : "Negocio de viajes"),
    destinationsServed: [
      ...new Set(
        matches
          .map((row) => {
            const offer = normalizeViajesOfferToV2(row.listing_json, { locale: lang, laneHint: "business" });
            return offer.basics.destinationLabel || offer.locations.destination.city;
          })
          .filter(Boolean)
      ),
    ].slice(0, 8),
    languages: primaryOffer.basics.serviceLanguage
      ? [primaryOffer.basics.serviceLanguage]
      : primaryOffer.basics.spanishGuide
        ? [lang === "en" ? "Spanish" : "Español"]
        : [],
    about: provider.description.trim() || (lang === "en" ? "Travel offers published on Leonix Viajes." : "Ofertas de viaje publicadas en Leonix Viajes."),
    ...(provider.whatsapp || provider.whatsappRaw ? { whatsapp: provider.whatsapp || provider.whatsappRaw } : {}),
    ...(provider.phone || provider.phoneRaw ? { phone: provider.phone || provider.phoneRaw } : {}),
    ...(provider.email.includes("@") ? { email: provider.email } : {}),
    ...(provider.website.trim() ? { website: provider.website.trim() } : {}),
    ...(office ? { publicLocationLabel: office } : {}),
    featuredOffers,
  };
}

export async function resolveViajesProviderProfileFromStagedServer(slug: string, lang: "es" | "en") {
  const key = slug.trim().toLowerCase();
  return unstable_cache(
    async () => resolveViajesProviderProfileUncached(key, lang),
    ["viajes-provider-profile-v1", key, lang],
    { tags: [VIAJES_CACHE_TAG_BROWSE], revalidate: 60 }
  )();
}
