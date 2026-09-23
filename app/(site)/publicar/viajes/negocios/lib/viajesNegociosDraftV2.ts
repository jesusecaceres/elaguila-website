import type { ViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2";
import { emptyViajesOfferModelV2 } from "@/app/(site)/clasificados/viajes/lib/v2/viajesOfferModelV2Defaults";

export const VIAJES_NEGOCIOS_DRAFT_V2_STORAGE_KEY = "leonix:viajes:negocios:draft:v2";

export type ViajesNegociosDraftV2 = {
  schemaVersion: 2;
  offer: ViajesOfferModelV2;
};

export function emptyViajesNegociosDraftV2(locale: "es" | "en" = "es"): ViajesNegociosDraftV2 {
  return {
    schemaVersion: 2,
    offer: emptyViajesOfferModelV2("business", locale),
  };
}

/** Strip draft-only media refs before persisting to localStorage. */
export function sanitizeViajesNegociosDraftV2ForStorage(draft: ViajesNegociosDraftV2): ViajesNegociosDraftV2 {
  return {
    schemaVersion: 2,
    offer: {
      ...draft.offer,
      media: {
        ...draft.offer.media,
        images: draft.offer.media.images.map((img) => {
          const { localPreviewObjectUrl: _drop, ...rest } = img;
          return rest;
        }),
      },
    },
  };
}

export function mergeViajesNegociosDraftV2FromPartial(
  parsed: Partial<ViajesNegociosDraftV2> & { offer?: Partial<ViajesOfferModelV2> },
  locale: "es" | "en" = "es",
): ViajesNegociosDraftV2 {
  const base = emptyViajesNegociosDraftV2(locale);
  if (!parsed?.offer || typeof parsed.offer !== "object") return base;
  return {
    schemaVersion: 2,
    offer: {
      ...base.offer,
      ...parsed.offer,
      schemaVersion: 2,
      lane: "business",
      basics: { ...base.offer.basics, ...(parsed.offer.basics ?? {}) },
      schedule: { ...base.offer.schedule, ...(parsed.offer.schedule ?? {}) },
      pricing: { ...base.offer.pricing, ...(parsed.offer.pricing ?? {}) },
      media: {
        images: Array.isArray(parsed.offer.media?.images) ? parsed.offer.media.images : base.offer.media.images,
        videos: Array.isArray(parsed.offer.media?.videos) ? parsed.offer.media.videos : base.offer.media.videos,
      },
      locations: { ...base.offer.locations, ...(parsed.offer.locations ?? {}) },
      provider: { ...base.offer.provider, ...(parsed.offer.provider ?? {}) },
      contact: { ...base.offer.contact, ...(parsed.offer.contact ?? {}) },
      source: { ...base.offer.source, ...(parsed.offer.source ?? {}), lane: "business" },
      lifecycle: { ...base.offer.lifecycle, ...(parsed.offer.lifecycle ?? {}), locale },
      highlights: Array.isArray(parsed.offer.highlights) ? parsed.offer.highlights : base.offer.highlights,
      inclusions: Array.isArray(parsed.offer.inclusions) ? parsed.offer.inclusions : base.offer.inclusions,
      exclusions: Array.isArray(parsed.offer.exclusions) ? parsed.offer.exclusions : base.offer.exclusions,
      amenities: Array.isArray(parsed.offer.amenities) ? parsed.offer.amenities : base.offer.amenities,
      policies: Array.isArray(parsed.offer.policies) ? parsed.offer.policies : base.offer.policies,
      accessibility: Array.isArray(parsed.offer.accessibility)
        ? parsed.offer.accessibility
        : base.offer.accessibility,
      needToKnow: Array.isArray(parsed.offer.needToKnow) ? parsed.offer.needToKnow : base.offer.needToKnow,
      itinerary: Array.isArray(parsed.offer.itinerary) ? parsed.offer.itinerary : base.offer.itinerary,
      modules: Array.isArray(parsed.offer.modules) ? parsed.offer.modules : base.offer.modules,
    },
  };
}
