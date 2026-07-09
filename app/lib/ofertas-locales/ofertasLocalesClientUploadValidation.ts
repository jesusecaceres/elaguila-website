import {
  OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES,
  OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES,
  OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB,
} from "./ofertasLocalesConstants";
import type { OfertaLocalDraftAssetType } from "./ofertasLocalesTypes";

export type OfertaLocalClientAssetKind = "flyer" | "coupon" | "logo";

export type OfertaLocalClientAssetValidationResult = {
  ok: boolean;
  assetType?: OfertaLocalDraftAssetType;
  errors: string[];
  warnings: string[];
};

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

const UPLOAD_ASSET_TYPES = new Set<OfertaLocalDraftAssetType>([
  "flyer_pdf",
  "flyer_image",
  "coupon_pdf",
  "coupon_image",
]);

const LOGO_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;

function allowedMimes(kind: OfertaLocalClientAssetKind): readonly string[] {
  if (kind === "logo") return LOGO_MIMES;
  return kind === "flyer"
    ? OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES
    : OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES;
}

export function getOfertaLocalAssetTypeFromMime(
  mimeType: string,
  assetKind: OfertaLocalClientAssetKind
): OfertaLocalDraftAssetType | null {
  const mime = (mimeType || "").toLowerCase();
  if (assetKind === "logo") {
    if (IMAGE_MIMES.has(mime)) return "flyer_image";
    return null;
  }
  if (mime === "application/pdf") {
    return assetKind === "flyer" ? "flyer_pdf" : "coupon_pdf";
  }
  if (IMAGE_MIMES.has(mime)) {
    return assetKind === "flyer" ? "flyer_image" : "coupon_image";
  }
  return null;
}

export function getOfertaLocalClientUploadMaxBytes(
  assetType: OfertaLocalDraftAssetType
): number {
  if (assetType === "flyer_pdf") {
    return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.flyer_pdf * 1024 * 1024;
  }
  if (assetType === "flyer_image") {
    return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.flyer_image * 1024 * 1024;
  }
  if (assetType === "coupon_pdf") {
    return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.coupon_pdf * 1024 * 1024;
  }
  if (assetType === "coupon_image") {
    return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.coupon_image * 1024 * 1024;
  }
  return 0;
}

export function getOfertaLocalClientUploadLimitMb(
  assetType: OfertaLocalDraftAssetType
): number {
  if (assetType === "flyer_pdf") return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.flyer_pdf;
  if (assetType === "flyer_image") return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.flyer_image;
  if (assetType === "coupon_pdf") return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.coupon_pdf;
  if (assetType === "coupon_image") return OFERTAS_LOCALES_CLIENT_UPLOAD_LIMITS_MB.coupon_image;
  return 0;
}

export function ofertaLocalClientUploadSizeError(
  assetType: OfertaLocalDraftAssetType,
  lang: "es" | "en" = "es"
): string {
  const mb = getOfertaLocalClientUploadLimitMb(assetType);
  if (lang === "en") {
    if (assetType === "flyer_pdf") return `Flyer PDF is too large. Maximum: ${mb} MB.`;
    if (assetType === "flyer_image") return `Flyer image is too large. Maximum: ${mb} MB.`;
    if (assetType === "coupon_pdf") return `Coupon PDF is too large. Maximum: ${mb} MB.`;
    if (assetType === "coupon_image") return `Coupon image is too large. Maximum: ${mb} MB.`;
    return `File is too large. Maximum: ${mb} MB.`;
  }
  if (assetType === "flyer_pdf") return `PDF de volante demasiado grande. Máximo: ${mb} MB.`;
  if (assetType === "flyer_image") return `Imagen de volante demasiado grande. Máximo: ${mb} MB.`;
  if (assetType === "coupon_pdf") return `PDF de cupón demasiado grande. Máximo: ${mb} MB.`;
  if (assetType === "coupon_image") return `Imagen de cupón demasiado grande. Máximo: ${mb} MB.`;
  return `El archivo es demasiado grande. Máximo: ${mb} MB.`;
}

export function formatOfertaLocalFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getOfertaLocalAssetTypeFromFile(
  file: File,
  assetKind: OfertaLocalClientAssetKind
): OfertaLocalDraftAssetType | null {
  return getOfertaLocalAssetTypeFromMime(file.type || "", assetKind);
}

function validateCore(
  input: {
    assetKind: OfertaLocalClientAssetKind;
    mimeType: string;
    sizeBytes: number;
    lang?: "es" | "en";
  }
): OfertaLocalClientAssetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mime = (input.mimeType || "").toLowerCase();
  const allowed = allowedMimes(input.assetKind);
  const label =
    input.assetKind === "flyer" ? "volante" : input.assetKind === "logo" ? "logo" : "cupón";
  const lang = input.lang ?? "es";

  if (!mime) {
    warnings.push("No se detectó el tipo MIME del archivo; verifica la extensión.");
  } else if (!allowed.includes(mime)) {
    errors.push(
      input.assetKind === "logo"
        ? "Tipo de archivo no permitido para logo. Usa JPEG, PNG o WebP."
        : `Tipo de archivo no permitido para ${label}. Usa PDF o imagen (JPEG, PNG, WebP).`
    );
  }

  if (input.sizeBytes === 0) {
    errors.push("El archivo está vacío.");
  }

  const assetType = getOfertaLocalAssetTypeFromMime(mime, input.assetKind);
  if (!assetType && errors.length === 0) {
    errors.push(`No se pudo determinar el tipo de archivo para este ${label}.`);
  }

  if (assetType && UPLOAD_ASSET_TYPES.has(assetType) && input.sizeBytes > 0) {
    const max = getOfertaLocalClientUploadMaxBytes(assetType);
    if (input.sizeBytes > max) {
      errors.push(ofertaLocalClientUploadSizeError(assetType, lang));
    }
  }

  return {
    ok: errors.length === 0 && Boolean(assetType),
    assetType: assetType ?? undefined,
    errors,
    warnings,
  };
}

export function validateOfertaLocalClientAssetFile(
  file: File,
  assetKind: OfertaLocalClientAssetKind,
  lang: "es" | "en" = "es"
): OfertaLocalClientAssetValidationResult {
  return validateCore({
    assetKind,
    mimeType: file.type || "",
    sizeBytes: file.size,
    lang,
  });
}

export function validateOfertaLocalClientAssetUploadMeta(input: {
  assetKind: OfertaLocalClientAssetKind;
  mimeType: string;
  sizeBytes: number;
  lang?: "es" | "en";
}): OfertaLocalClientAssetValidationResult {
  return validateCore(input);
}
