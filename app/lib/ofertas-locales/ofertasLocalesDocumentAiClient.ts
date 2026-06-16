import "server-only";

import {
  assertOfertaLocalDocumentAiConfig,
  getOfertaLocalDocumentAiProcessorName,
  isOfertaLocalDocumentAiConfigured,
} from "./ofertasLocalesDocumentAiConfig";

/** Max bytes aligned with flyer client upload limit (Stack 12 guardrail). */
export const OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES = 15 * 1024 * 1024;

export type OfertaLocalDocumentAiBoundingBox = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

export type OfertaLocalDocumentAiPageLine = {
  pageNumber: number;
  text: string;
  confidence: number | null;
  boundingBox: OfertaLocalDocumentAiBoundingBox | null;
};

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
  pageLines: OfertaLocalDocumentAiPageLine[];
  entities: Array<{ type: string; mentionText: string; confidence: number | null }>;
  confidenceAverage: number | null;
  rawSummary: {
    mimeType: string;
    textLength: number;
    entityCount: number;
    pageLineCount: number;
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

type TextAnchorLike = {
  textSegments?: Array<{ startIndex?: string | number | null; endIndex?: string | number | null }> | null;
};

type LayoutLike = {
  confidence?: number | null;
  textAnchor?: TextAnchorLike | null;
  boundingPoly?: {
    normalizedVertices?: Array<{ x?: number | null; y?: number | null }> | null;
  } | null;
};

function segmentIndex(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number.parseInt(value, 10) || 0;
  if (value != null && typeof value === "object" && "toString" in value) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function textFromAnchor(fullText: string, anchor: TextAnchorLike | null | undefined): string {
  const segments = anchor?.textSegments ?? [];
  if (!segments.length || !fullText) return "";
  let out = "";
  for (const seg of segments) {
    const start = segmentIndex(seg.startIndex ?? 0);
    const end = segmentIndex(seg.endIndex ?? fullText.length);
    if (end > start) out += fullText.slice(start, end);
  }
  return out.replace(/\s+/g, " ").trim();
}

function bboxFromLayout(layout: LayoutLike | null | undefined): OfertaLocalDocumentAiBoundingBox | null {
  const verts = layout?.boundingPoly?.normalizedVertices ?? [];
  if (!verts.length) return null;
  const xs = verts.map((v) => v.x ?? 0);
  const ys = verts.map((v) => v.y ?? 0);
  return {
    xMin: Math.min(...xs),
    yMin: Math.min(...ys),
    xMax: Math.max(...xs),
    yMax: Math.max(...ys),
  };
}

function extractPageLines(fullText: string, pages: unknown): OfertaLocalDocumentAiPageLine[] {
  const out: OfertaLocalDocumentAiPageLine[] = [];
  if (!Array.isArray(pages) || !pages.length) return out;

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex] as {
      paragraphs?: Array<{ layout?: LayoutLike | null }> | null;
      lines?: Array<{ layout?: LayoutLike | null }> | null;
    };
    const pageNumber = pageIndex + 1;
    const blocks = [...(page.lines ?? []), ...(page.paragraphs ?? [])];
    for (const block of blocks) {
      const layout = block.layout ?? null;
      const text = textFromAnchor(fullText, layout?.textAnchor ?? null);
      if (!text || text.length < 2) continue;
      out.push({
        pageNumber,
        text,
        confidence: typeof layout?.confidence === "number" ? layout.confidence : null,
        boundingBox: bboxFromLayout(layout),
      });
    }
  }

  return out;
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
  const pageLines = extractPageLines(text, document?.pages ?? null);

  const entities =
    document?.entities?.map((entity) => ({
      type: String(entity.type ?? ""),
      mentionText: String(entity.mentionText ?? "").trim(),
      confidence: typeof entity.confidence === "number" ? entity.confidence : null,
    })) ?? [];

  const confidenceAverage = averageConfidence([
    ...entities.map((e) => e.confidence),
    ...pageLines.map((l) => l.confidence),
  ]);

  return {
    text,
    pagesProcessed,
    pageLines,
    entities,
    confidenceAverage,
    rawSummary: {
      mimeType,
      textLength: text.length,
      entityCount: entities.length,
      pageLineCount: pageLines.length,
    },
  };
}
