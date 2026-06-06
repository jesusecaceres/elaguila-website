import "server-only";

import {
  assertOfertaLocalDocumentAiConfig,
  getOfertaLocalDocumentAiProcessorName,
  isOfertaLocalDocumentAiConfigured,
} from "./ofertasLocalesDocumentAiConfig";

/** Max bytes aligned with flyer client upload limit (Stack 12 guardrail). */
export const OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES = 15 * 1024 * 1024;

export type OfertaLocalDocumentAiProcessParams = {
  fileBuffer: Buffer;
  mimeType: string;
  assetId: string;
  ofertaLocalId: string;
  ownerId: string;
};

export type OfertaLocalDocumentAiRawExtraction = {
  text: string;
  pagesProcessed: number;
  entities: Array<{ type: string; mentionText: string; confidence: number | null }>;
  confidenceAverage: number | null;
  rawSummary: {
    mimeType: string;
    textLength: number;
    entityCount: number;
  };
};

export class OfertaLocalDocumentAiNotConfiguredError extends Error {
  readonly code = "document_ai_not_configured" as const;
  constructor() {
    super("Google Document AI is not configured on the server.");
    this.name = "OfertaLocalDocumentAiNotConfiguredError";
  }
}

function averageConfidence(values: Array<number | null | undefined>): number | null {
  const nums = values.filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Process one uploaded asset with Google Document AI Document OCR.
 * Server-only — never import from client components.
 */
export async function processOfertaLocalAssetWithDocumentAi(
  params: OfertaLocalDocumentAiProcessParams
): Promise<OfertaLocalDocumentAiRawExtraction> {
  if (!isOfertaLocalDocumentAiConfigured()) {
    throw new OfertaLocalDocumentAiNotConfiguredError();
  }

  if (params.fileBuffer.byteLength < 1) {
    throw new Error("Asset file is empty.");
  }
  if (params.fileBuffer.byteLength > OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES) {
    throw new Error("Asset file exceeds the maximum scan size.");
  }

  const config = assertOfertaLocalDocumentAiConfig();
  const processorName = getOfertaLocalDocumentAiProcessorName(config);
  const mimeType = params.mimeType.trim() || "application/octet-stream";

  const { DocumentProcessorServiceClient } = await import("@google-cloud/documentai");
  const client = new DocumentProcessorServiceClient({
    credentials: config.credentials,
    apiEndpoint: `${config.processorLocation}-documentai.googleapis.com`,
  });

  const [result] = await client.processDocument({
    name: processorName,
    rawDocument: {
      content: params.fileBuffer.toString("base64"),
      mimeType,
    },
  });

  const document = result.document;
  const text = document?.text?.trim() ?? "";
  const pagesProcessed = document?.pages?.length ?? 0;

  const entities =
    document?.entities?.map((entity) => ({
      type: String(entity.type ?? ""),
      mentionText: String(entity.mentionText ?? "").trim(),
      confidence: typeof entity.confidence === "number" ? entity.confidence : null,
    })) ?? [];

  const confidenceAverage = averageConfidence([
    ...entities.map((e) => e.confidence),
    ...(document?.pages ?? []).flatMap((page) =>
      (page.paragraphs ?? []).map((p) =>
        typeof p.layout?.confidence === "number" ? p.layout.confidence : null
      )
    ),
  ]);

  return {
    text,
    pagesProcessed,
    entities,
    confidenceAverage,
    rawSummary: {
      mimeType,
      textLength: text.length,
      entityCount: entities.length,
    },
  };
}
