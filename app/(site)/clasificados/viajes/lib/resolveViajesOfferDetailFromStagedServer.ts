import "server-only";

import { unstable_cache } from "next/cache";

import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";
import { VIAJES_CACHE_TAG_BROWSE, viajesOfferDetailCacheTag } from "./viajesCacheTags";
import { fetchViajesStagedRowBySlugPublic } from "./viajesStagedListingsDbServer";
import { normalizeViajesOfferToV2 } from "./v2/normalizeViajesOfferToV2";
import { mapViajesOfferV2ToDetailModel } from "./v2/mapViajesOfferV2ToDetailModel";
import type { ViajesLane } from "./v2/viajesOfferModelV2";

export type ViajesStagedOfferDetailBundle = {
  offer: ViajesOfferDetailModel;
  stagedListingId: string;
  leonix_ad_id: string | null;
  listingLang: "es" | "en" | null;
};

const PUBLIC_LANES = new Set<string>(["business", "private", "affiliate", "editorial"]);

function trustForLane(lane: ViajesLane | string, lang: "es" | "en"): string {
  if (lane === "private") {
    return lang === "en"
      ? "Private seller listing (internal review passed). Leonix does not verify identity or process payment — contact the seller directly."
      : "Anuncio de particular (pasó revisión interna). Leonix no verifica identidad ni cobra — contacta al anunciante directamente.";
  }
  if (lane === "affiliate") {
    return lang === "en"
      ? "Partner listing. Leonix may earn a referral when you book with the provider — confirm price and availability with them."
      : "Oferta de socio. Leonix puede recibir una comisión de referencia — confirma precio y disponibilidad con el proveedor.";
  }
  if (lane === "editorial") {
    return lang === "en"
      ? "Leonix editorial guide. Inspiration only — not live inventory or a booking checkout."
      : "Guía editorial Leonix. Solo inspiración — no es inventario en vivo ni checkout.";
  }
  return lang === "en"
    ? "Published listing (internal review passed). Leonix is not the merchant of record — confirm price and availability with the operator."
    : "Listado publicado (pasó revisión interna). Leonix no es el vendedor final — confirma precio y disponibilidad con el operador.";
}

async function resolveViajesStagedOfferDetailBundleUncached(slug: string, lang: "es" | "en"): Promise<ViajesStagedOfferDetailBundle | null> {
  const row = await fetchViajesStagedRowBySlugPublic(slug);
  if (!row) return null;

  const laneHint = PUBLIC_LANES.has(row.lane) ? (row.lane as ViajesLane) : "business";
  const offerV2 = normalizeViajesOfferToV2(row.listing_json, {
    locale: lang,
    laneHint,
  });
  const hero = row.hero_image_url?.trim() || undefined;
  const stagedListingId = String(row.id);
  const leonixRaw = (row as { leonix_ad_id?: string | null }).leonix_ad_id;
  const leonix_ad_id = leonixRaw != null && String(leonixRaw).trim() ? String(leonixRaw).trim() : null;

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
    }
  );

  return {
    stagedListingId,
    leonix_ad_id,
    listingLang: row.lang,
    offer: {
      ...base,
      slug: row.slug,
      partner: {
        ...base.partner,
        privateSeller: effectiveLane === "private",
        isAffiliate: effectiveLane === "affiliate",
        editorial: effectiveLane === "editorial",
      },
    },
  };
}

export async function resolveViajesStagedOfferDetailBundle(slug: string, lang: "es" | "en") {
  const key = slug.trim().toLowerCase();
  return unstable_cache(
    async () => resolveViajesStagedOfferDetailBundleUncached(key, lang),
    ["viajes-staged-offer-detail-v2b", key, lang],
    { tags: [VIAJES_CACHE_TAG_BROWSE, viajesOfferDetailCacheTag(key)], revalidate: 60 }
  )();
}

/** @deprecated alias — prefer resolveViajesStagedOfferDetailBundle */
export const resolveViajesOfferDetailFromStagedServer = resolveViajesStagedOfferDetailBundle;
