import { randomUUID } from "crypto";

import { resolveComidaLocalCityCanonical } from "./comidaLocalCity";
import { mergeComidaLocalDraftFromStorage } from "./comidaLocalDraftPersistence";
import {
  isValidComidaLocalExternalUrl,
  normalizeComidaLocalPhoneDigits,
  normalizeComidaLocalSocialInput,
} from "./comidaLocalFormatting";
import {
  getComidaLocalPackageLimits,
  isValidComidaLocalPackageTier,
  normalizeComidaLocalPackageTierKey,
} from "./comidaLocalPackages";
import {
  hasComidaLocalMainPhoto,
  maxComidaLocalGalleryImagesForTier,
  sanitizeComidaLocalImageForDb,
  validateComidaLocalGalleryCount,
  validateComidaLocalImageMetadata,
} from "./comidaLocalImageValidation";
import type { ComidaLocalDraft, ComidaLocalValidationIssue } from "./comidaLocalTypes";
import type {
  ComidaLocalNormalizedPublishDraft,
  ComidaLocalPackageTierDb,
} from "./comidaLocalPublishTypes";
import { validateComidaLocalDraftForFuturePublish } from "./comidaLocalValidation";

const MAX_TEXT = {
  businessName: 120,
  foodTypeCustom: 80,
  zoneNote: 120,
  queVendes: 2000,
  locationNote: 300,
  availabilityNote: 160,
  paymentOtherNote: 80,
  phone: 32,
  whatsapp: 32,
} as const;

function clamp(s: string, max: number): string {
  return String(s ?? "").trim().slice(0, max);
}

export { sanitizeComidaLocalImageForDb } from "./comidaLocalImageValidation";

export function normalizeComidaLocalPackageTier(raw: unknown): ComidaLocalPackageTierDb {
  return normalizeComidaLocalPackageTierKey(raw);
}

export function normalizeComidaLocalDraftForPublish(
  raw: unknown,
  packageTier: ComidaLocalPackageTierDb = "basic"
): ComidaLocalDraft {
  const limits = getComidaLocalPackageLimits(packageTier);
  const merged = mergeComidaLocalDraftFromStorage(raw);
  const cityCanonical = resolveComidaLocalCityCanonical(merged);
  const cityDisplay =
    clamp(merged.cityDisplay, 80) || cityCanonical || "";

  const instagram = normalizeComidaLocalSocialInput(merged.instagramUrl, "instagram");
  const facebook = normalizeComidaLocalSocialInput(merged.facebookUrl, "facebook");
  const tiktok = normalizeComidaLocalSocialInput(merged.tiktokUrl, "tiktok");
  const locationUrlAllowed = limits.allowLocationUrl;

  let locationUrl = locationUrlAllowed ? clamp(merged.locationUrl, 512) : "";
  if (locationUrl) {
    const withScheme = /^https?:\/\//i.test(locationUrl) ? locationUrl : `https://${locationUrl}`;
    locationUrl = isValidComidaLocalExternalUrl(withScheme) ? withScheme : "";
  }

  const gallery = merged.galleryImages
    .map((g) => sanitizeComidaLocalImageForDb(g))
    .filter((g): g is NonNullable<ReturnType<typeof sanitizeComidaLocalImageForDb>> => g !== null)
    .slice(0, limits.maxGalleryImages);

  const logoImage = limits.allowLogo ? sanitizeComidaLocalImageForDb(merged.logoImage) : null;

  return {
    ...merged,
    businessName: clamp(merged.businessName, MAX_TEXT.businessName),
    foodTypeCustom: clamp(merged.foodTypeCustom, MAX_TEXT.foodTypeCustom),
    cityCanonical: cityCanonical || "",
    cityDisplay,
    zoneNote: clamp(merged.zoneNote, MAX_TEXT.zoneNote),
    queVendes: clamp(merged.queVendes, MAX_TEXT.queVendes),
    phone: clamp(merged.phone, MAX_TEXT.phone),
    whatsapp: clamp(merged.whatsapp, MAX_TEXT.whatsapp),
    instagramUrl: instagram ?? "",
    facebookUrl: facebook ?? "",
    tiktokUrl: tiktok ?? "",
    locationNote: clamp(merged.locationNote, MAX_TEXT.locationNote),
    locationUrl,
    availabilityNote: clamp(merged.availabilityNote, MAX_TEXT.availabilityNote),
    paymentOtherNote: clamp(merged.paymentOtherNote, MAX_TEXT.paymentOtherNote),
    mainPhoto: sanitizeComidaLocalImageForDb(merged.mainPhoto),
    logoImage,
    galleryImages: gallery,
  };
}

function countComidaLocalSocialLinks(draft: ComidaLocalDraft): number {
  let n = 0;
  if (draft.instagramUrl.trim()) n += 1;
  if (draft.facebookUrl.trim()) n += 1;
  if (draft.tiktokUrl.trim()) n += 1;
  return n;
}

export function validateComidaLocalPublishPayload(
  draft: ComidaLocalDraft,
  packageTier: ComidaLocalPackageTierDb = "basic"
): ComidaLocalValidationIssue[] {
  const limits = getComidaLocalPackageLimits(packageTier);
  const issues = validateComidaLocalDraftForFuturePublish(draft);
  const errors = issues.filter((i) => i.severity === "error");

  if (!resolveComidaLocalCityCanonical(draft) && !draft.cityDisplay.trim()) {
    errors.push({
      field: "cityDisplay",
      message: "La ciudad es obligatoria.",
      severity: "error",
    });
  }

  const phone = normalizeComidaLocalPhoneDigits(draft.phone);
  const wa = normalizeComidaLocalPhoneDigits(draft.whatsapp);
  if (phone.length < 10 && wa.length < 8) {
    errors.push({
      field: "phone",
      message: "Agrega teléfono o WhatsApp.",
      severity: "error",
    });
  }

  if (!hasComidaLocalMainPhoto(draft)) {
    errors.push({
      field: "mainPhoto",
      message: "La foto principal es obligatoria.",
      severity: "error",
    });
  }

  if (!validateComidaLocalGalleryCount(draft.galleryImages.length, packageTier)) {
    errors.push({
      field: "galleryImages",
      message: `Máximo ${maxComidaLocalGalleryImagesForTier(packageTier)} fotos en la galería.`,
      severity: "error",
    });
  }

  if (countComidaLocalSocialLinks(draft) > limits.maxSocialLinks) {
    errors.push({
      field: "instagramUrl",
      message: `Máximo ${limits.maxSocialLinks} redes sociales para este paquete.`,
      severity: "error",
    });
  }

  if (!limits.allowLogo && draft.logoImage) {
    errors.push({
      field: "logoImage",
      message: "El logo no está incluido en este paquete.",
      severity: "error",
    });
  }

  for (const img of [draft.mainPhoto, draft.logoImage, ...draft.galleryImages]) {
    if (!img) continue;
    const v = validateComidaLocalImageMetadata(img);
    if (!v.ok) {
      errors.push({
        field: "mainPhoto",
        message: "Una imagen no es válida para publicar. Vuelve a subirla.",
        severity: "error",
      });
      break;
    }
  }

  return errors;
}

export function parseComidaLocalPublishRequest(body: Record<string, unknown>): {
  ok: true;
  value: ComidaLocalNormalizedPublishDraft;
} | {
  ok: false;
  error: string;
  issues?: ComidaLocalValidationIssue[];
} {
  const rawPackageTier = body.packageTier;
  if (
    rawPackageTier !== undefined &&
    rawPackageTier !== null &&
    String(rawPackageTier).trim() &&
    !isValidComidaLocalPackageTier(rawPackageTier)
  ) {
    return { ok: false, error: "invalid_package_tier" };
  }
  const packageTier = normalizeComidaLocalPackageTier(rawPackageTier);

  const draftRaw = body.draft ?? body;
  const draft = normalizeComidaLocalDraftForPublish(draftRaw, packageTier);
  const issues = validateComidaLocalPublishPayload(draft, packageTier);
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0) {
    return { ok: false, error: "not_ready", issues: errors };
  }

  const draftListingId =
    typeof body.draftListingId === "string" && body.draftListingId.trim()
      ? body.draftListingId.trim().slice(0, 64)
      : randomUUID();

  const lang = body.lang === "en" ? "en" : "es";

  return {
    ok: true,
    value: {
      draft,
      draftListingId,
      packageTier,
      lang,
    },
  };
}
