import { buildRestaurantePublishPayload } from "./buildRestaurantePublishPayload";
import { coerceRestauranteImageRefToString, mergeRestauranteDraft } from "./createEmptyRestauranteDraft";
import type { RestauranteListingDraft } from "./restauranteDraftTypes";
import { computePublishGallerySequence } from "./restauranteGalleryMediaSequence";
import {
  classifyPublishImageRefShape,
  classifyRestauranteGallerySlotUnknown,
  hasRestauranteMinimumPublishImage,
} from "./restauranteListingApplicationModel";

/**
 * Safe 422 diagnostics: lengths + kind enums only (no URLs, no payloads).
 * Proves whether the merged request draft still carries transport-safe media after client payload rules.
 */
export type RestaurantePublish422MediaAudit = {
  requestDraftHasHeroImage: boolean;
  requestDraftHeroImageKind: "empty" | "http" | "https" | "data" | "blob" | "other";
  requestDraftHeroImageLength: number;
  requestDraftGalleryCount: number;
  requestDraftFirstGalleryImageKind: "empty" | "http" | "https" | "data" | "blob" | "object" | "other";
  requestDraftFirstGalleryImageLength: number;
  sanitizedHasHeroImage: boolean;
  sanitizedHeroImageKind: "empty" | "http" | "https" | "data" | "blob" | "other";
  sanitizedHeroImageLength: number;
  sanitizedGalleryCount: number;
  sanitizedFirstGalleryImageKind: "empty" | "http" | "https" | "data" | "blob" | "object" | "other";
  sanitizedFirstGalleryImageLength: number;
  /** Merged API draft: counts data/IDB/local refs that previews may use. */
  hasRestauranteMinimumPublishImageBeforeSanitize: boolean;
  /** After re-applying `buildRestaurantePublishPayload` + merge (simulates wire-safe body). */
  hasRestauranteMinimumPublishImageAfterSanitize: boolean;
};

type HeroKind = RestaurantePublish422MediaAudit["requestDraftHeroImageKind"];

function narrowHeroKind(x: unknown): HeroKind {
  if (x == null || x === "") return "empty";
  if (typeof x === "object") return "other";
  if (typeof x !== "string") return "other";
  const k = classifyPublishImageRefShape(x);
  if (k === "https") return "https";
  if (k === "http") return "http";
  if (k === "data") return "data";
  if (k === "blob") return "blob";
  return "other";
}

function slotStringLenForAudit(x: unknown): number {
  if (typeof x === "string") return x.length;
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    let m = 0;
    for (const k of ["url", "src", "image", "publicUrl", "signedUrl"]) {
      const v = o[k];
      if (typeof v === "string") m = Math.max(m, v.length);
    }
    return m;
  }
  return 0;
}

function firstSeqGalleryValue(d: RestauranteListingDraft): unknown {
  const imgs = d.galleryImages ?? [];
  if (!imgs.length) return undefined;
  const seq = computePublishGallerySequence(d);
  const firstIdx = seq.find(
    (x): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < imgs.length,
  );
  return firstIdx != null ? imgs[firstIdx] : undefined;
}

export function buildRestaurantePublish422MediaAudit(
  rawBody: Record<string, unknown>,
  mergedDraft: RestauranteListingDraft,
): RestaurantePublish422MediaAudit {
  const plan = typeof rawBody.plan === "string" && rawBody.plan.trim().toLowerCase() === "pro" ? "pro" : "free";
  const lang = rawBody.lang === "en" ? "en" : "es";
  const payload = buildRestaurantePublishPayload(mergedDraft, undefined, plan, lang);
  const sanitized = mergeRestauranteDraft(payload);

  const gReq = firstSeqGalleryValue(mergedDraft);
  const gSan = firstSeqGalleryValue(sanitized);

  return {
    requestDraftHasHeroImage: coerceRestauranteImageRefToString(mergedDraft.heroImage) != null,
    requestDraftHeroImageKind: narrowHeroKind(mergedDraft.heroImage),
    requestDraftHeroImageLength: slotStringLenForAudit(mergedDraft.heroImage),
    requestDraftGalleryCount: mergedDraft.galleryImages?.length ?? 0,
    requestDraftFirstGalleryImageKind: classifyRestauranteGallerySlotUnknown(gReq),
    requestDraftFirstGalleryImageLength: slotStringLenForAudit(gReq),
    sanitizedHasHeroImage: coerceRestauranteImageRefToString(sanitized.heroImage) != null,
    sanitizedHeroImageKind: narrowHeroKind(sanitized.heroImage),
    sanitizedHeroImageLength: slotStringLenForAudit(sanitized.heroImage),
    sanitizedGalleryCount: sanitized.galleryImages?.length ?? 0,
    sanitizedFirstGalleryImageKind: classifyRestauranteGallerySlotUnknown(gSan),
    sanitizedFirstGalleryImageLength: slotStringLenForAudit(gSan),
    hasRestauranteMinimumPublishImageBeforeSanitize: hasRestauranteMinimumPublishImage(mergedDraft, "draft"),
    hasRestauranteMinimumPublishImageAfterSanitize: hasRestauranteMinimumPublishImage(sanitized, "transport"),
  };
}
