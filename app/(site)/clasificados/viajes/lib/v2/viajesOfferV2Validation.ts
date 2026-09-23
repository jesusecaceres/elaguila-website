import type { ViajesMediaAssetV2, ViajesOfferModelV2 } from "./viajesOfferModelV2";
import { VIAJES_MEDIA_MAX_IMAGES, VIAJES_MEDIA_MAX_VIDEOS } from "./viajesOfferModelV2";
import { isViajesDurableHttpsUrl, isViajesNonDurableMediaRef } from "./viajesMediaDurableGuards";

export type ViajesOfferValidationIssue = {
  code: string;
  message: string;
  step?: 1 | 2 | 3 | 4 | 5;
  field?: string;
};

export function getViajesHeroAsset(images: ViajesMediaAssetV2[]): ViajesMediaAssetV2 | null {
  const heroes = images.filter((i) => i.isHero);
  if (heroes.length) return heroes[0] ?? null;
  return images[0] ?? null;
}

export function getViajesResultsCardAsset(images: ViajesMediaAssetV2[]): ViajesMediaAssetV2 | null {
  const cards = images.filter((i) => i.isResultsCard);
  if (cards.length) return cards[0] ?? null;
  return getViajesHeroAsset(images);
}

export function viajesMediaBlocksSubmit(images: ViajesMediaAssetV2[]): boolean {
  if (!images.length) return false;
  return images.some((img) => {
    if (img.uploadStatus === "local_pending") return true;
    if (img.uploadStatus === "uploading") return true;
    if (img.uploadStatus === "failed") return true;
    if (img.uploadStatus === "removing") return true;
    if (!isViajesDurableHttpsUrl(img.url)) return true;
    if (isViajesNonDurableMediaRef(img.url)) return true;
    return false;
  });
}

export function validateViajesOfferForSubmit(offer: ViajesOfferModelV2): ViajesOfferValidationIssue[] {
  const issues: ViajesOfferValidationIssue[] = [];
  if (!offer.basics.title.trim()) {
    issues.push({ code: "missing_title", message: "Title is required", step: 1, field: "basics.title" });
  }
  if (!offer.basics.destinationLabel.trim() && !offer.locations.destination.city.trim()) {
    issues.push({
      code: "missing_destination",
      message: "Destination is required",
      step: 1,
      field: "basics.destinationLabel",
    });
  }
  if (offer.media.images.length > VIAJES_MEDIA_MAX_IMAGES) {
    issues.push({ code: "too_many_images", message: `Max ${VIAJES_MEDIA_MAX_IMAGES} images`, step: 3 });
  }
  if (offer.media.videos.length > VIAJES_MEDIA_MAX_VIDEOS) {
    issues.push({ code: "too_many_videos", message: `Max ${VIAJES_MEDIA_MAX_VIDEOS} videos`, step: 3 });
  }
  if (viajesMediaBlocksSubmit(offer.media.images)) {
    issues.push({
      code: "media_not_durable",
      message: "All selected images must finish uploading to a durable HTTPS URL",
      step: 3,
    });
  }
  if (offer.media.images.length > 0) {
    const heroes = offer.media.images.filter((i) => i.isHero && i.uploadStatus === "uploaded");
    if (heroes.length !== 1) {
      issues.push({ code: "hero_required", message: "Assign exactly one hero image", step: 3 });
    }
  }
  for (const v of offer.media.videos) {
    if (v.url.trim() && !isViajesDurableHttpsUrl(v.url)) {
      issues.push({ code: "video_not_https", message: "External videos must be HTTPS URLs", step: 3 });
      break;
    }
  }
  return issues;
}

export function validateViajesOfferMediaShape(offer: ViajesOfferModelV2): ViajesOfferValidationIssue[] {
  const issues: ViajesOfferValidationIssue[] = [];
  const ids = new Set<string>();
  for (const img of offer.media.images) {
    if (!img.id) issues.push({ code: "media_missing_id", message: "Media asset missing stable id", step: 3 });
    if (ids.has(img.id)) issues.push({ code: "media_duplicate_id", message: "Duplicate media id", step: 3 });
    ids.add(img.id);
  }
  return issues;
}
