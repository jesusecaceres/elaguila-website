import "server-only";

import { unstable_cache } from "next/cache";

import type { ViajesOfferDetailModel } from "../data/viajesOfferDetailSampleData";
import { getPublicarViajesNegociosCopy } from "../../../publicar/viajes/negocios/data/publicarViajesNegociosCopy";
import { getPublicarViajesPrivadoCopy } from "../../../publicar/viajes/privado/data/publicarViajesPrivadoCopy";
import type { ViajesNegociosDraft } from "../../../publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import { mapViajesNegociosDraftToOffer } from "../../../publicar/viajes/negocios/lib/mapViajesNegociosDraftToOffer";
import type { ViajesPrivadoDraft } from "../../../publicar/viajes/privado/lib/viajesPrivadoDraftTypes";
import { mapViajesPrivadoDraftToOffer } from "../../../publicar/viajes/privado/lib/mapViajesPrivadoDraftToOffer";

import { VIAJES_CACHE_TAG_BROWSE, viajesOfferDetailCacheTag } from "./viajesCacheTags";
import { fetchViajesStagedRowBySlugPublic } from "./viajesStagedListingsDbServer";

export type ViajesStagedOfferDetailBundle = {
  offer: ViajesOfferDetailModel;
  stagedListingId: string;
};

async function resolveViajesStagedOfferDetailBundleUncached(slug: string, lang: "es" | "en"): Promise<ViajesStagedOfferDetailBundle | null> {
  const row = await fetchViajesStagedRowBySlugPublic(slug);
  if (!row) return null;

  const j = row.listing_json as { negocios?: ViajesNegociosDraft; privado?: ViajesPrivadoDraft };
  const hero = row.hero_image_url?.trim() || undefined;
  const stagedListingId = String(row.id);

  if (row.lane === "business" && j.negocios) {
    const c = getPublicarViajesNegociosCopy(lang);
    const base = mapViajesNegociosDraftToOffer(j.negocios, c, lang, { sparse: true, heroSrcOverride: hero });
    const trust =
      lang === "en"
        ? "Published listing (internal review passed). Leonix is not the merchant of record — confirm price and availability with the operator."
        : "Listado publicado (pasó revisión interna). Leonix no es el vendedor final — confirma precio y disponibilidad con el operador.";
    return {
      stagedListingId,
      offer: {
        ...base,
        slug: row.slug,
        trustNote: trust,
        partner: {
          ...base.partner,
          privateSeller: false,
        },
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

/** Cached public offer + DB id for Leonix-tracked flows (inquiries, analytics). */
export async function resolveViajesStagedOfferDetailBundle(slug: string, lang: "es" | "en"): Promise<ViajesStagedOfferDetailBundle | null> {
  const s = slug.trim();
  if (!s) return null;
  return unstable_cache(
    async () => resolveViajesStagedOfferDetailBundleUncached(s, lang),
    ["viajes-staged-offer-detail-v2", s, lang],
    { tags: [viajesOfferDetailCacheTag(s), VIAJES_CACHE_TAG_BROWSE] },
  )();
}

/** @deprecated Prefer `resolveViajesStagedOfferDetailBundle` when `stagedListingId` is needed. */
export async function resolveViajesOfferDetailFromStagedSlug(slug: string, lang: "es" | "en"): Promise<ViajesOfferDetailModel | null> {
  const b = await resolveViajesStagedOfferDetailBundle(slug, lang);
  return b?.offer ?? null;
}
