import type { ViajesOfferDetailModel } from "@/app/(site)/clasificados/viajes/data/viajesOfferDetailSampleData";
import { normalizeViajesNegociosDraftToV2 } from "@/app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import { mapViajesOfferV2ToDetailModel } from "@/app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel";

import type { PublicarViajesNegociosUi } from "../data/publicarViajesNegociosCopy";
import type { ViajesNegociosDraft } from "./viajesNegociosDraftTypes";

/** Legacy entry — normalizes V1 draft to V2 then maps to detail presentation. */
export function mapViajesNegociosDraftToOffer(
  d: ViajesNegociosDraft,
  _c: PublicarViajesNegociosUi,
  lang: "es" | "en",
  opts?: { sparse?: boolean; heroSrcOverride?: string }
): ViajesOfferDetailModel {
  const offer = normalizeViajesNegociosDraftToV2(d, lang);
  return mapViajesOfferV2ToDetailModel(offer, {
    sparse: opts?.sparse,
    lang,
    heroSrcOverride: opts?.heroSrcOverride,
  });
}
