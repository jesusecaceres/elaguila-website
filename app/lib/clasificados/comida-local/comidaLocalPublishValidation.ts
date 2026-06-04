import { randomUUID } from "crypto";

import { resolveComidaLocalCityCanonical } from "./comidaLocalCity";
import { mergeComidaLocalDraftFromStorage } from "./comidaLocalDraftPersistence";
import {
  isValidComidaLocalExternalUrl,
  normalizeComidaLocalPhoneDigits,
  normalizeComidaLocalSocialInput,
} from "./comidaLocalFormatting";
import type { ComidaLocalDraft, ComidaLocalImageDraft, ComidaLocalValidationIssue } from "./comidaLocalTypes";
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

/** Persisted rows only — reject blob/data/base64 preview URLs. */
export function sanitizeComidaLocalImageForDb(
  img: ComidaLocalImageDraft | null | undefined
): ComidaLocalImageDraft | null {
  if (!img) return null;
  const previewUrl = String(img.previewUrl ?? "").trim();
  const storageKey = String(img.storageKey ?? "").trim();
  if (previewUrl.startsWith("data:") || previewUrl.includes("base64") || previewUrl.startsWith("blob:")) {
    return storageKey ? { previewUrl: "", storageKey: storageKey.slice(0, 256) } : null;
  }
  if (previewUrl && /^https?:\/\//i.test(previewUrl)) {
    return { previewUrl: previewUrl.slice(0, 512), storageKey: storageKey.slice(0, 256) };
  }
  if (storageKey) return { previewUrl: "", storageKey: storageKey.slice(0, 256) };
  return null;
}

export function normalizeComidaLocalPackageTier(raw: unknown): ComidaLocalPackageTierDb {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "plus" || s === "comida_local_plus" || s === "comida-local-plus") return "plus";
  return "basic";
}

export function normalizeComidaLocalDraftForPublish(raw: unknown): ComidaLocalDraft {
  const merged = mergeComidaLocalDraftFromStorage(raw);
  const cityCanonical = resolveComidaLocalCityCanonical(merged);
  const cityDisplay =
    clamp(merged.cityDisplay, 80) || cityCanonical || "";

  const instagram = normalizeComidaLocalSocialInput(merged.instagramUrl, "instagram");
  const facebook = normalizeComidaLocalSocialInput(merged.facebookUrl, "facebook");
  const tiktok = normalizeComidaLocalSocialInput(merged.tiktokUrl, "tiktok");

  let locationUrl = clamp(merged.locationUrl, 512);
  if (locationUrl) {
    const withScheme = /^https?:\/\//i.test(locationUrl) ? locationUrl : `https://${locationUrl}`;
    locationUrl = isValidComidaLocalExternalUrl(withScheme) ? withScheme : "";
  }

  const gallery = merged.galleryImages
    .map((g) => sanitizeComidaLocalImageForDb(g))
    .filter((g): g is ComidaLocalImageDraft => g !== null)
    .slice(0, 8);

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
    logoImage: sanitizeComidaLocalImageForDb(merged.logoImage),
    galleryImages: gallery,
  };
}

export function validateComidaLocalPublishPayload(
  draft: ComidaLocalDraft
): ComidaLocalValidationIssue[] {
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
  const draftRaw = body.draft ?? body;
  const draft = normalizeComidaLocalDraftForPublish(draftRaw);
  const issues = validateComidaLocalPublishPayload(draft);
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
      packageTier: normalizeComidaLocalPackageTier(body.packageTier),
      lang,
    },
  };
}
