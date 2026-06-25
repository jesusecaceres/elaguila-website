import "server-only";

import {
  getMissingOfertaLocalDocumentAiEnvLabels,
  isOfertaLocalDocumentAiConfigured,
} from "./ofertasLocalesDocumentAiConfig";

export const OFERTAS_GEMINI_ENV_KEY = "GEMINI_API_KEY" as const;

export type OfertasAiExtractionProvider = "gemini_multimodal" | "fallback_document_ai";

export function isOfertaLocalGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getOfertaLocalGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || null;
}

export function getOfertaLocalGeminiModel(): string {
  return process.env.OFERTAS_GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function getOfertaLocalGeminiComplexModel(): string {
  return process.env.OFERTAS_GEMINI_COMPLEX_MODEL?.trim() || "gemini-2.5-pro";
}

export function getOfertaLocalGeminiMaxPages(): number {
  const raw = process.env.OFERTAS_GEMINI_MAX_PAGES?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.min(parsed, 40);
  return 25;
}

export function getOfertaLocalGeminiPageConcurrency(): number {
  const raw = process.env.OFERTAS_GEMINI_PAGE_CONCURRENCY?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return Math.min(parsed, 5);
  return 2;
}

export function isAnyOfertaLocalAiScanProviderConfigured(): boolean {
  return isOfertaLocalGeminiConfigured() || isOfertaLocalDocumentAiConfigured();
}

export function getMissingOfertaLocalAiScanEnvLabels(): string[] {
  if (isAnyOfertaLocalAiScanProviderConfigured()) return [];
  return [
    `${OFERTAS_GEMINI_ENV_KEY} (or Google Document AI:`,
    ...getMissingOfertaLocalDocumentAiEnvLabels().map((k) => `  ${k}`),
  ];
}

/** Resolve primary extraction provider for a scan request. */
export function resolveOfertasAiExtractionProvider(): OfertasAiExtractionProvider | null {
  const preferred = process.env.OFERTAS_AI_PROVIDER?.trim().toLowerCase();

  if (preferred === "document_ai" || preferred === "google_document_ai") {
    if (isOfertaLocalDocumentAiConfigured()) return "fallback_document_ai";
    if (isOfertaLocalGeminiConfigured()) return "gemini_multimodal";
    return null;
  }

  if (preferred === "gemini_multimodal" || preferred === "gemini") {
    if (isOfertaLocalGeminiConfigured()) return "gemini_multimodal";
    if (isOfertaLocalDocumentAiConfigured()) return "fallback_document_ai";
    return null;
  }

  if (isOfertaLocalGeminiConfigured()) return "gemini_multimodal";
  if (isOfertaLocalDocumentAiConfigured()) return "fallback_document_ai";
  return null;
}

export function selectGeminiModelForPageCount(pageCount: number): string {
  if (pageCount >= 8) return getOfertaLocalGeminiComplexModel();
  return getOfertaLocalGeminiModel();
}
