import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import {
  parseGeminiJsonArray,
  validateAndSanitizeGeminiCandidates,
  type OfertaLocalGeminiValidatedCandidate,
  type OfertaLocalGeminiValidationStats,
} from "./ofertasLocalesGeminiCandidateValidator";
import { getOfertaLocalGeminiApiKey } from "./ofertasLocalesGeminiConfig";
import { OFERTAS_GEMINI_FLYER_EXTRACTION_PROMPT } from "./ofertasLocalesGeminiPrompt";

export type ExtractOfertasPageWithGeminiParams = {
  imageBytes: Buffer;
  mimeType: string;
  pageNumber: number;
  sourceFileName: string;
  sourceStoragePath: string;
  modelName: string;
};

export type ExtractOfertasPageWithGeminiResult = {
  ok: boolean;
  pageNumber: number;
  candidates: OfertaLocalGeminiValidatedCandidate[];
  validationStats: OfertaLocalGeminiValidationStats;
  modelUsed: string;
  error?: string;
  rawCandidateCount: number;
};

export async function extractOfertasPageWithGemini(
  params: ExtractOfertasPageWithGeminiParams
): Promise<ExtractOfertasPageWithGeminiResult> {
  const apiKey = getOfertaLocalGeminiApiKey();
  if (!apiKey) {
    return emptyPageResult(params.pageNumber, params.modelName, "gemini_not_configured");
  }

  console.info("[ofertas-locales ai] gemini page extraction started", {
    pageNumber: params.pageNumber,
    mimeType: params.mimeType,
    model: params.modelName,
    sourceFileName: params.sourceFileName,
  });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: params.modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
      },
    });

    const pageHint = `\n\nThis is page ${params.pageNumber} of grocery flyer "${params.sourceFileName}". Set source_page to ${params.pageNumber} for every row.`;

    const result = await model.generateContent([
      { text: OFERTAS_GEMINI_FLYER_EXTRACTION_PROMPT + pageHint },
      {
        inlineData: {
          mimeType: params.mimeType,
          data: params.imageBytes.toString("base64"),
        },
      },
    ]);

    const responseText = result.response.text();
    const parsed = parseGeminiJsonArray(responseText);
    if (parsed.error && parsed.rows.length === 0) {
      console.warn("[ofertas-locales ai] gemini page extraction parse error", {
        pageNumber: params.pageNumber,
        error: parsed.error,
      });
      return emptyPageResult(params.pageNumber, params.modelName, parsed.error);
    }

    const validated = validateAndSanitizeGeminiCandidates(parsed.rows, params.pageNumber);

    console.info("[ofertas-locales ai] gemini page extraction complete", {
      pageNumber: params.pageNumber,
      rawCandidateCount: validated.stats.rawCandidateCount,
      acceptedCount: validated.stats.acceptedCount,
      rejectedCount: validated.stats.rejectedCount,
    });

    return {
      ok: true,
      pageNumber: params.pageNumber,
      candidates: validated.candidates,
      validationStats: validated.stats,
      modelUsed: params.modelName,
      rawCandidateCount: validated.stats.rawCandidateCount,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "gemini_extraction_failed";
    console.warn("[ofertas-locales ai] gemini page extraction failed", {
      pageNumber: params.pageNumber,
      error: message.slice(0, 300),
    });
    return emptyPageResult(params.pageNumber, params.modelName, message.slice(0, 500));
  }
}

function emptyPageResult(
  pageNumber: number,
  modelName: string,
  error: string
): ExtractOfertasPageWithGeminiResult {
  return {
    ok: false,
    pageNumber,
    candidates: [],
    validationStats: {
      rawCandidateCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      rejectedReasonCounts: {},
      priceRepairsApplied: 0,
      duplicateRemovals: 0,
    },
    modelUsed: modelName,
    error,
    rawCandidateCount: 0,
  };
}
