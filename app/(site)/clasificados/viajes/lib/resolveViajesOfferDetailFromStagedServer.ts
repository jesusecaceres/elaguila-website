import "server-only";

import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";
<<<<<<< HEAD
import { getPublicarViajesNegociosCopy } from "../../../publicar/viajes/negocios/data/publicarViajesNegociosCopy";
import { getPublicarViajesPrivadoCopy } from "../../../publicar/viajes/privado/data/publicarViajesPrivadoCopy";
import type { ViajesNegociosDraft } from "../../../publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import { mapViajesNegociosDraftToOffer } from "../../../publicar/viajes/negocios/lib/mapViajesNegociosDraftToOffer";
import type { ViajesPrivadoDraft } from "../../../publicar/viajes/privado/lib/viajesPrivadoDraftTypes";
import { mapViajesPrivadoDraftToOffer } from "../../../publicar/viajes/privado/lib/mapViajesPrivadoDraftToOffer";

import { VIAJES_CACHE_TAG_BROWSE, viajesOfferDetailCacheTag } from "./viajesCacheTags";
import { fetchViajesStagedRowBySlugPublic } from "./viajesStagedListingsDbServer";
=======
import { fetchViajesStagedRowBySlugPublic } from "./viajesStagedListingsDbServer";
import { normalizeViajesOfferToV2 } from "./v2/normalizeViajesOfferToV2";
import { mapViajesOfferV2ToDetailModel } from "./v2/mapViajesOfferV2ToDetailModel";
import type { ViajesLane } from "./v2/viajesOfferModelV2";
import { resolveViajesPublicOfferTitle } from "./viajesPublicOfferTitle";
>>>>>>> 9f92bb50 (preservation: capture final local Viajes launch work)

export type ViajesStagedOfferDetailBundle = {
  offer: ViajesOfferDetailModel;
  stagedListingId: string;
  leonix_ad_id: string | null;
  /** Stored listing language from `viajes_staged_listings.lang`. */
  listingLang: "es" | "en" | null;
};

<<<<<<< HEAD
async function resolveViajesStagedOfferDetailBundleUncached(slug: string, lang: "es" | "en"): Promise<ViajesStagedOfferDetailBundle | null> {
  const row = await fetchViajesStagedRowBySlugPublic(slug);
=======
const PUBLIC_LANES = new Set<string>(["business", "private", "affiliate", "editorial"]);

function trustForLane(lane: ViajesLane | string, lang: "es" | "en"): string {
  if (lane === "private") {
    return lang === "en"
      ? "Private seller listing. Leonix does not verify identity or process payment — contact the seller directly and confirm terms with them."
      : "Anuncio de particular. Leonix no verifica identidad ni cobra — contacta al anunciante directamente y confirma condiciones con quien publica.";
  }
  if (lane === "affiliate") {
    return lang === "en"
      ? "Partner listing. Leonix may earn a referral when you continue with the provider — confirm price and terms with them."
      : "Oferta de socio. Leonix puede recibir una comisión de referencia — confirma precio y condiciones con el proveedor.";
  }
  if (lane === "editorial") {
    return lang === "en"
      ? "Leonix editorial guide. Inspiration only — not live inventory or a booking checkout."
      : "Guía editorial Leonix. Solo inspiración — no es inventario en vivo ni checkout.";
  }
  return lang === "en"
    ? "Published listing. Leonix is not the merchant of record — confirm price and terms with the operator."
    : "Listado publicado. Leonix no es el vendedor final — confirma precio y condiciones con el operador.";
}

/**
 * Offer detail resolve is intentionally uncached (same rationale as browse):
 * approve → public detail must not serve a stale negative `unstable_cache` miss.
 * Page remains `force-dynamic`; path/tag revalidate helpers stay for any residual caches.
 */
export async function resolveViajesStagedOfferDetailBundle(
  slug: string,
  lang: "es" | "en",
): Promise<ViajesStagedOfferDetailBundle | null> {
  const key = slug.trim().toLowerCase();
  const row = await fetchViajesStagedRowBySlugPublic(key);
>>>>>>> 9f92bb50 (preservation: capture final local Viajes launch work)
  if (!row) return null;

  const j = row.listing_json as { negocios?: ViajesNegociosDraft; privado?: ViajesPrivadoDraft };
  const hero = row.hero_image_url?.trim() || undefined;
  const stagedListingId = String(row.id);
  const leonixRaw = (row as { leonix_ad_id?: string | null }).leonix_ad_id;
  const leonix_ad_id = leonixRaw != null && String(leonixRaw).trim() ? String(leonixRaw).trim() : null;

<<<<<<< HEAD
  if (row.lane === "business" && j.negocios) {
    const c = getPublicarViajesNegociosCopy(lang);
    const base = mapViajesNegociosDraftToOffer(j.negocios, c, lang, { sparse: true, heroSrcOverride: hero });
    const trust =
      lang === "en"
        ? "Published listing (internal review passed). Leonix is not the merchant of record — confirm price and availability with the operator."
        : "Listado publicado (pasó revisión interna). Leonix no es el vendedor final — confirma precio y disponibilidad con el operador.";
    return {
      stagedListingId,
      leonix_ad_id,
      listingLang: row.lang,
      offer: {
        ...base,
        slug: row.slug,
        trustNote: trust,
        partner: {
          ...base.partner,
          privateSeller: false,
        },
=======
  if (!PUBLIC_LANES.has(row.lane) && !PUBLIC_LANES.has(offerV2.lane)) return null;
  if (!offerV2.basics.title.trim() && !row.title.trim()) return null;

  const effectiveLane = PUBLIC_LANES.has(offerV2.lane) ? offerV2.lane : laneHint;

  const base = mapViajesOfferV2ToDetailModel(
    { ...offerV2, lane: effectiveLane },
    {
      sparse: true,
      lang,
      heroSrcOverride: hero,
      trustNote: trustForLane(effectiveLane, lang),
    },
  );

  return {
    stagedListingId,
    leonix_ad_id,
    listingLang: row.lang,
    offer: {
      ...base,
      slug: row.slug,
      title: resolveViajesPublicOfferTitle(base.title, row.title) || base.title,
      partner: {
        ...base.partner,
        privateSeller: effectiveLane === "private",
        isAffiliate: effectiveLane === "affiliate",
        editorial: effectiveLane === "editorial",
>>>>>>> 9f92bb50 (preservation: capture final local Viajes launch work)
      },
    };
  }

  if (row.lane === "private" && j.privado) {
    const c = getPublicarViajesPrivadoCopy(lang);
    const base = mapViajesPrivadoDraftToOffer(j.privado, c, lang, { sparse: true, heroSrcOverride: hero });
    const trust =
      lang === "en"
        ? "Private seller listing (internal review passed). Leonix does not verify identity or process payment — contact the seller directly."
        : "Anuncio de particular (pasó revisión interna). Leonix no verifica identidad ni cobra — contacta al anunciante directamente.";
    return {
      stagedListingId,
      leonix_ad_id,
      listingLang: row.lang,
      offer: {
        ...base,
        slug: row.slug,
        trustNote: trust,
        partner: {
          ...base.partner,
          privateSeller: true,
        },
      },
    };
  }

  return null;
}

<<<<<<< HEAD
/** Cached public offer + DB id for Leonix-tracked flows (inquiries, analytics). */
export async function resolveViajesStagedOfferDetailBundle(slug: string, lang: "es" | "en"): Promise<ViajesStagedOfferDetailBundle | null> {
  const s = slug.trim();
  if (!s) return null;
  return unstable_cache(
    async () => resolveViajesStagedOfferDetailBundleUncached(s, lang),
    ["viajes-staged-offer-detail-v3", s, lang],
    { tags: [viajesOfferDetailCacheTag(s), VIAJES_CACHE_TAG_BROWSE] },
  )();
}

/** @deprecated Prefer `resolveViajesStagedOfferDetailBundle` when `stagedListingId` is needed. */
export async function resolveViajesOfferDetailFromStagedSlug(slug: string, lang: "es" | "en"): Promise<ViajesOfferDetailModel | null> {
  const b = await resolveViajesStagedOfferDetailBundle(slug, lang);
  return b?.offer ?? null;
}
=======
/** @deprecated alias — prefer resolveViajesStagedOfferDetailBundle */
export const resolveViajesOfferDetailFromStagedServer = resolveViajesStagedOfferDetailBundle;
>>>>>>> 9f92bb50 (preservation: capture final local Viajes launch work)
