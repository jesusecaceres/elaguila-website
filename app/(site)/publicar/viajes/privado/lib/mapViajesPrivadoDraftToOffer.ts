import type { ViajesOfferDetailModel } from "@/app/(site)/clasificados/viajes/data/viajesOfferDetailSampleData";
import { normalizeViajesPrivadoDraftToV2 } from "@/app/(site)/clasificados/viajes/lib/v2/normalizeViajesOfferToV2";
import { mapViajesOfferV2ToDetailModel } from "@/app/(site)/clasificados/viajes/lib/v2/mapViajesOfferV2ToDetailModel";

import type { PublicarViajesPrivadoCopy } from "../data/publicarViajesPrivadoCopy";
import type { ViajesPrivadoDraft } from "./viajesPrivadoDraftTypes";

/** Legacy entry — normalizes V1 draft to V2 then maps to detail presentation. */
export function mapViajesPrivadoDraftToOffer(
  d: ViajesPrivadoDraft,
  _c: PublicarViajesPrivadoCopy,
  lang: "es" | "en",
  opts?: { sparse?: boolean; heroSrcOverride?: string }
): ViajesOfferDetailModel {
  const offer = normalizeViajesPrivadoDraftToV2(d, lang);
  return mapViajesOfferV2ToDetailModel(offer, {
    sparse: opts?.sparse,
    lang,
    heroSrcOverride: opts?.heroSrcOverride,
  });
}
