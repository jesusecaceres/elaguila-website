import type { ViajesMediaAssetV2, ViajesOfferModelV2, ViajesStagedListingJsonV2 } from "./viajesOfferModelV2";
import { isViajesDurableHttpsUrl, stripViajesDraftOnlyMediaFields } from "./viajesMediaDurableGuards";

function serializeImage(img: ViajesMediaAssetV2): ViajesMediaAssetV2 | null {
  if (img.uploadStatus !== "uploaded") return null;
  if (!isViajesDurableHttpsUrl(img.url)) return null;
  const cleaned = stripViajesDraftOnlyMediaFields({ ...img }) as ViajesMediaAssetV2;
  cleaned.uploadStatus = "uploaded";
  cleaned.url = img.url.trim();
  delete cleaned.localPreviewObjectUrl;
  delete cleaned.localIdbKey;
  delete cleaned.localFileName;
  delete cleaned.uploadErrorCode;
  delete cleaned.uploadProgressPct;
  return cleaned;
}

/** Produce staged/public-safe V2 offer (durable media only). */
export function serializeViajesOfferForStaged(offer: ViajesOfferModelV2): ViajesOfferModelV2 {
  const images = offer.media.images
    .map(serializeImage)
    .filter((x): x is ViajesMediaAssetV2 => Boolean(x))
    .sort((a, b) => a.galleryOrder - b.galleryOrder)
    .map((img, idx) => ({ ...img, galleryOrder: idx }));

  const videos = offer.media.videos
    .filter((v) => isViajesDurableHttpsUrl(v.url))
    .map((v) => ({ id: v.id, url: v.url.trim() }));

  return {
    ...offer,
    schemaVersion: 2,
    media: { images, videos },
    provider: {
      ...offer.provider,
      logoUrl: isViajesDurableHttpsUrl(offer.provider.logoUrl) ? offer.provider.logoUrl.trim() : "",
    },
  };
}

export function serializeViajesOfferV2ForStaged(offer: ViajesOfferModelV2): ViajesStagedListingJsonV2 {
  return {
    version: 2,
    offer: serializeViajesOfferForStaged(offer),
  };
}
