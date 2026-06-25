import "server-only";

/** Gate OFERTAS-SCAN-SIZE-1 — Ofertas Locales AI scan size limits (not global upload limits). */
// Scan compute cost should be covered by future store/client package pricing — not in this gate.

import { OFERTAS_LOCALES_AI_SCAN_PDF_MAX_MB } from "./ofertasLocalesConstants";

const PDF_MIME = "application/pdf";
const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

const DEFAULT_PDF_SCAN_MAX_MB = OFERTAS_LOCALES_AI_SCAN_PDF_MAX_MB;
const DEFAULT_IMAGE_SCAN_MAX_MB = 15;

export const OFERTAS_LOCALES_AI_SCAN_SIZE_ERROR_ES =
  "El archivo supera el tamaño máximo para escaneo AI. Sube un PDF de 40 MB o menos.";

export const OFERTAS_LOCALES_AI_SCAN_SIZE_ERROR_EN =
  "The file exceeds the maximum size for AI scan. Upload a PDF of 40 MB or less.";

function parseEnvMb(name: string, fallbackMb: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallbackMb;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMb;
  return parsed;
}

export function isOfertaLocalAiScanPdfMime(mimeType: string): boolean {
  return (mimeType || "").trim().toLowerCase() === PDF_MIME;
}

export function isOfertaLocalAiScanImageMime(mimeType: string): boolean {
  return IMAGE_MIMES.has((mimeType || "").trim().toLowerCase());
}

export function getOfertaLocalAiScanMaxMb(mimeType: string): number {
  if (isOfertaLocalAiScanPdfMime(mimeType)) {
    return parseEnvMb("OFERTAS_LOCALES_AI_SCAN_MAX_PDF_MB", DEFAULT_PDF_SCAN_MAX_MB);
  }
  if (isOfertaLocalAiScanImageMime(mimeType)) {
    return parseEnvMb("OFERTAS_LOCALES_AI_SCAN_MAX_IMAGE_MB", DEFAULT_IMAGE_SCAN_MAX_MB);
  }
  return parseEnvMb("OFERTAS_LOCALES_AI_SCAN_MAX_PDF_MB", DEFAULT_PDF_SCAN_MAX_MB);
}

export function getOfertaLocalAiScanMaxBytes(mimeType: string): number {
  return Math.floor(getOfertaLocalAiScanMaxMb(mimeType) * 1024 * 1024);
}

export function ofertaLocalAiScanSizeExceededMessage(lang: "es" | "en" = "es"): string {
  const pdfMb = getOfertaLocalAiScanMaxMb(PDF_MIME);
  if (lang === "en") {
    return `The file exceeds the maximum size for AI scan. Upload a PDF of ${pdfMb} MB or less.`;
  }
  return `El archivo supera el tamaño máximo para escaneo AI. Sube un PDF de ${pdfMb} MB o menos.`;
}

export class OfertaLocalAiScanSizeExceededError extends Error {
  readonly code = "scan_size_exceeded" as const;
  readonly sizeBytes: number;
  readonly maxBytes: number;
  readonly mimeType: string;
  readonly assetKind: string | null;

  constructor(params: {
    sizeBytes: number;
    maxBytes: number;
    mimeType: string;
    assetKind?: string | null;
    lang?: "es" | "en";
  }) {
    super(ofertaLocalAiScanSizeExceededMessage(params.lang ?? "es"));
    this.name = "OfertaLocalAiScanSizeExceededError";
    this.sizeBytes = params.sizeBytes;
    this.maxBytes = params.maxBytes;
    this.mimeType = params.mimeType;
    this.assetKind = params.assetKind ?? null;
  }
}

export function assertOfertaLocalAiScanSizeWithinLimit(params: {
  sizeBytes: number;
  mimeType: string;
  assetKind?: string | null;
  assetId?: string | null;
  lang?: "es" | "en";
}): void {
  const maxBytes = getOfertaLocalAiScanMaxBytes(params.mimeType);
  logOfertaLocalAiScanSizeCheck({
    sizeBytes: params.sizeBytes,
    maxBytes,
    mimeType: params.mimeType,
    assetKind: params.assetKind ?? null,
    assetId: params.assetId ?? null,
    passed: params.sizeBytes <= maxBytes,
  });

  if (params.sizeBytes > maxBytes) {
    throw new OfertaLocalAiScanSizeExceededError({
      sizeBytes: params.sizeBytes,
      maxBytes,
      mimeType: params.mimeType,
      assetKind: params.assetKind,
      lang: params.lang,
    });
  }
}

export function logOfertaLocalAiScanSizeCheck(params: {
  sizeBytes: number;
  maxBytes: number;
  mimeType: string;
  assetKind: string | null;
  assetId: string | null;
  passed: boolean;
}): void {
  console.info("[ofertas-locales:ai-scan:size-check]", {
    sizeBytes: params.sizeBytes,
    maxBytes: params.maxBytes,
    mimeType: params.mimeType,
    assetKind: params.assetKind,
    assetId: params.assetId,
    passed: params.passed,
  });
}

/** @deprecated Use getOfertaLocalAiScanMaxBytes(mimeType) — kept for legacy imports. */
export const OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES = getOfertaLocalAiScanMaxBytes(PDF_MIME);
