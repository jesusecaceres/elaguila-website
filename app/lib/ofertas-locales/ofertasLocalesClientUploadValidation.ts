import {
  OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES,
  OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES,
  OFERTAS_LOCALES_CLIENT_UPLOAD_MAX_COUPON_MB,
  OFERTAS_LOCALES_CLIENT_UPLOAD_MAX_FLYER_MB,
} from "./ofertasLocalesConstants";
import type { OfertaLocalDraftAssetType } from "./ofertasLocalesTypes";

export type OfertaLocalClientAssetKind = "flyer" | "coupon";

export type OfertaLocalClientAssetValidationResult = {
  ok: boolean;
  assetType?: OfertaLocalDraftAssetType;
  errors: string[];
  warnings: string[];
};

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

function allowedMimes(kind: OfertaLocalClientAssetKind): readonly string[] {
  return kind === "flyer"
    ? OFERTAS_LOCALES_CLIENT_UPLOAD_FLYER_MIME_TYPES
    : OFERTAS_LOCALES_CLIENT_UPLOAD_COUPON_MIME_TYPES;
}

function maxBytes(kind: OfertaLocalClientAssetKind): number {
  const mb =
    kind === "flyer"
      ? OFERTAS_LOCALES_CLIENT_UPLOAD_MAX_FLYER_MB
      : OFERTAS_LOCALES_CLIENT_UPLOAD_MAX_COUPON_MB;
  return mb * 1024 * 1024;
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
  const mime = file.type || "";
  if (mime === "application/pdf") {
    return assetKind === "flyer" ? "flyer_pdf" : "coupon_pdf";
  }
  if (IMAGE_MIMES.has(mime)) {
    return assetKind === "flyer" ? "flyer_image" : "coupon_image";
  }
  return null;
}

export function validateOfertaLocalClientAssetFile(
  file: File,
  assetKind: OfertaLocalClientAssetKind
): OfertaLocalClientAssetValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mime = file.type || "";
  const allowed = allowedMimes(assetKind);
  const max = maxBytes(assetKind);
  const label = assetKind === "flyer" ? "volante" : "cupón";

  if (!mime) {
    warnings.push("No se detectó el tipo MIME del archivo; verifica la extensión.");
  } else if (!allowed.includes(mime)) {
    errors.push(`Tipo de archivo no permitido para ${label}. Usa PDF o imagen (JPEG, PNG, WebP).`);
  }

  if (file.size > max) {
    errors.push(
      `El archivo es demasiado grande (máx. ${formatOfertaLocalFileSize(max)} para ${label}).`
    );
  }

  if (file.size === 0) {
    errors.push("El archivo está vacío.");
  }

  const assetType = getOfertaLocalAssetTypeFromFile(file, assetKind);
  if (!assetType && errors.length === 0) {
    errors.push(`No se pudo determinar el tipo de archivo para este ${label}.`);
  }

  return {
    ok: errors.length === 0 && Boolean(assetType),
    assetType: assetType ?? undefined,
    errors,
    warnings,
  };
}
