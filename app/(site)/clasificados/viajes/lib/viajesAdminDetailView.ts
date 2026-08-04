import type { ViajesStagedListingRow } from "./viajesStagedListingTypes";
import { normalizeViajesOfferToV2 } from "./v2/normalizeViajesOfferToV2";
import type { ViajesOfferModelV2, ViajesStructuredAddress, ViajesTravelModule } from "./v2/viajesOfferModelV2";
import { getViajesHeroAsset, getViajesResultsCardAsset } from "./v2/viajesOfferV2Validation";
import { isViajesDurableHttpsUrl } from "./v2/viajesMediaDurableGuards";

export type ViajesAdminDetailSafe = {
  identity: {
    id: string;
    slug: string;
    leonixAdId: string | null;
    lane: string;
    lifecycleStatus: string;
    isPublic: boolean;
    ownerUserId: string | null;
    submitterName: string | null;
    submitterEmail: string | null;
    submittedAt: string | null;
    updatedAt: string | null;
    publishedAt: string | null;
    createdAt: string | null;
    lang: string;
    businessProfileSlug: string | null;
  };
  basics: {
    title: string;
    destination: string;
    departure: string;
    offerKind: string;
    duration: string;
    pricingLanguage: string;
    sourceDisclosure: string;
    sourceLane: string;
  };
  media: {
    heroUrl: string | null;
    heroAlt: string;
    resultsCardUrl: string | null;
    resultsCardAlt: string;
    gallery: Array<{ url: string; alt: string; role: string }>;
  };
  provider: {
    name: string;
    slug: string;
    profileRoute: string;
    phone: string;
    email: string;
    website: string;
    whatsapp: string;
    publicLocation: string;
  };
  travel: {
    story: string;
    highlights: string[];
    inclusions: string[];
    exclusions: string[];
    itinerary: Array<{ title: string; body: string }>;
    modules: Array<{ kind: string; title: string; summary: string }>;
    policies: string[];
    accessibility: string[];
    needToKnow: string[];
  };
  locations: {
    destination: { label: string; isPublic: boolean };
    departure: { label: string; isPublic: boolean };
    providerOffice: { label: string; isPublic: boolean };
    privateExact: { label: string; isPublic: false; staffOnly: true } | null;
  };
  rawSanitized: Record<string, unknown>;
};

function addressLabel(a: ViajesStructuredAddress | undefined): string {
  if (!a) return "";
  return (a.publicLabel || [a.city, a.stateRegion, a.country].filter(Boolean).join(", ")).trim();
}

function moduleSummary(m: ViajesTravelModule): string {
  const bits: string[] = [m.kind];
  if (m.description?.trim()) bits.push(m.description.trim());
  return bits.join(" — ").slice(0, 240);
}

function moduleTitle(m: ViajesTravelModule): string {
  if ("propertyType" in m && m.propertyType) return String(m.propertyType);
  if ("mealPlanOrName" in m && m.mealPlanOrName) return String(m.mealPlanOrName);
  if ("mode" in m && m.mode) return String(m.mode);
  if ("activityName" in m && (m as { activityName?: string }).activityName) {
    return String((m as { activityName?: string }).activityName);
  }
  return m.kind;
}

/** Build staff-facing detail from a staged row (V1 or V2 via normalize). */
export function buildViajesAdminDetailView(row: ViajesStagedListingRow): ViajesAdminDetailSafe {
  const offer: ViajesOfferModelV2 = normalizeViajesOfferToV2(row.listing_json, {
    locale: row.lang === "en" ? "en" : "es",
    laneHint: row.lane === "private" ? "private" : "business",
  });

  const hero = getViajesHeroAsset(offer.media.images);
  const card = getViajesResultsCardAsset(offer.media.images);
  const rowHero = (row.hero_image_url ?? "").trim();
  const heroUrl =
    (isViajesDurableHttpsUrl(rowHero) ? rowHero : null) ||
    (hero && isViajesDurableHttpsUrl(hero.url) ? hero.url.trim() : null);
  const cardUrl = card && isViajesDurableHttpsUrl(card.url) ? card.url.trim() : null;

  const gallery = offer.media.images
    .filter((i) => isViajesDurableHttpsUrl(i.url))
    .sort((a, b) => a.galleryOrder - b.galleryOrder)
    .map((i) => ({
      url: i.url.trim(),
      alt: i.alt || offer.basics.title || "image",
      role: i.isHero ? "hero" : i.isResultsCard ? "results_card" : "gallery",
    }));

  const privateExactLabel = addressLabel(offer.locations.privateExact);
  const privateExact =
    privateExactLabel.length > 0
      ? ({ label: privateExactLabel, isPublic: false as const, staffOnly: true as const })
      : null;

  const pricingLanguage = [offer.pricing.priceFrom, offer.pricing.currencyNote].filter(Boolean).join(" ").trim();

  return {
    identity: {
      id: row.id,
      slug: row.slug,
      leonixAdId: row.leonix_ad_id?.trim() || null,
      lane: row.lane,
      lifecycleStatus: row.lifecycle_status,
      isPublic: row.is_public,
      ownerUserId: row.owner_user_id,
      submitterName: row.submitter_name,
      submitterEmail: row.submitter_email,
      submittedAt: row.submitted_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      lang: row.lang,
      businessProfileSlug: row.business_profile_slug,
    },
    basics: {
      title: offer.basics.title || row.title,
      destination: offer.basics.destinationLabel || "",
      departure: offer.basics.departureLabel || "",
      offerKind: offer.offerKind || "",
      duration: offer.basics.durationLabel || "",
      pricingLanguage,
      sourceDisclosure: offer.source.disclosure || "",
      sourceLane: offer.source.lane || row.lane,
    },
    media: {
      heroUrl,
      heroAlt: hero?.alt || offer.basics.title || "hero",
      resultsCardUrl: cardUrl,
      resultsCardAlt: card?.alt || offer.basics.title || "card",
      gallery,
    },
    provider: {
      name: offer.provider.name || offer.contact.displayName || "",
      slug: row.business_profile_slug || offer.provider.id || "",
      profileRoute: offer.provider.profileRoute || "",
      phone: offer.provider.phone || offer.contact.phone || "",
      email: offer.provider.email || offer.contact.email || "",
      website: offer.provider.website || offer.contact.website || "",
      whatsapp: offer.provider.whatsapp || offer.contact.whatsapp || "",
      publicLocation: addressLabel(offer.locations.providerOffice),
    },
    travel: {
      story: offer.story || "",
      highlights: offer.highlights.map((p) => p.label).filter(Boolean),
      inclusions: offer.inclusions.map((p) => p.label).filter(Boolean),
      exclusions: offer.exclusions.map((p) => p.label).filter(Boolean),
      itinerary: offer.itinerary.map((d) => ({
        title: d.title || d.dayLabel || "",
        body: d.description || "",
      })),
      modules: offer.modules.map((m) => ({
        kind: m.kind,
        title: moduleTitle(m),
        summary: moduleSummary(m),
      })),
      policies: offer.policies.map((p) => p.label).filter(Boolean),
      accessibility: offer.accessibility.map((p) => p.label).filter(Boolean),
      needToKnow: offer.needToKnow.map((p) => p.label).filter(Boolean),
    },
    locations: {
      destination: {
        label: addressLabel(offer.locations.destination) || offer.basics.destinationLabel,
        isPublic: offer.locations.destination?.showPublicly !== false,
      },
      departure: {
        label: addressLabel(offer.locations.departureMeetingPort) || offer.basics.departureLabel,
        isPublic: offer.locations.departureMeetingPort?.showPublicly !== false,
      },
      providerOffice: {
        label: addressLabel(offer.locations.providerOffice),
        isPublic: offer.locations.providerOffice?.showPublicly !== false,
      },
      privateExact,
    },
    rawSanitized: {
      version: (row.listing_json as { version?: number })?.version ?? null,
      title: row.title,
      lane: row.lane,
      slug: row.slug,
      offerId: offer.id,
      offerKind: offer.offerKind,
      mediaImageCount: gallery.length,
      moduleKinds: offer.modules.map((m) => m.kind),
    },
  };
}
