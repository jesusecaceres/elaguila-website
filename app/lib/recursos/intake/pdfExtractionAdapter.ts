import "server-only";

/**
 * Recursos Intake OS — Gate 4 PDF OCR extraction. Reuses the exact same Google Document AI
 * credentials/config already provisioned for Ofertas Locales (GOOGLE_DOCUMENT_AI_*) — no second
 * credentials system. The client-call shape (processDocument, text-anchor resolution, page-line
 * extraction) mirrors app/lib/ofertas-locales/ofertasLocalesDocumentAiClient.ts, adapted to
 * return per-page text (grouped by page number) rather than per-line records, since Recursos
 * needs whole-page text as evidence, not layout bounding boxes.
 */
import {
  getMissingOfertaLocalDocumentAiEnvLabels,
  getOfertaLocalDocumentAiConfig,
  getOfertaLocalDocumentAiProcessorName,
} from "@/app/lib/ofertas-locales/ofertasLocalesDocumentAiConfig";

export type PdfPageText = { pageNumber: number; text: string };

export type PdfOcrResult = {
  fullText: string;
  pagesProcessed: number;
  pages: PdfPageText[];
};

export class PdfOcrNotConfiguredError extends Error {
  readonly code = "document_ai_not_configured" as const;
  constructor(missing: string[]) {
    super(`Google Document AI is not configured. Missing: ${missing.join(", ")}`);
    this.name = "PdfOcrNotConfiguredError";
  }
}

export function isPdfOcrConfigured(): boolean {
  return getMissingOfertaLocalDocumentAiEnvLabels().length === 0;
}

type TextAnchorLike = { textSegments?: Array<{ startIndex?: string | number | null; endIndex?: string | number | null }> | null };
type LayoutLike = { textAnchor?: TextAnchorLike | null };

function segmentIndex(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number.parseInt(value, 10) || 0;
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
  return out;
}

/**
 * Runs Google Document AI OCR on a PDF buffer and returns whole-page text. This is one Document
 * AI call for the whole document (Document AI itself is the OCR/pagination engine, not something
 * this adapter chunks) — the multi-step chunking Gate 4 requires happens one layer up, in the
 * AI-organization-proposal stage, which processes this adapter's output in page-range batches.
 */
export async function extractPdfPagesWithDocumentAi(buffer: Buffer): Promise<PdfOcrResult> {
  const missing = getMissingOfertaLocalDocumentAiEnvLabels();
  if (missing.length > 0) throw new PdfOcrNotConfiguredError(missing);

  const config = getOfertaLocalDocumentAiConfig();
  if (!config) throw new PdfOcrNotConfiguredError(["GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON (invalid)"]);

  const processorName = getOfertaLocalDocumentAiProcessorName(config);
  const { DocumentProcessorServiceClient } = await import("@google-cloud/documentai");
  const client = new DocumentProcessorServiceClient({
    credentials: config.credentials,
    apiEndpoint: `${config.processorLocation}-documentai.googleapis.com`,
  });

  const [result] = await client.processDocument({
    name: processorName,
    rawDocument: { content: buffer.toString("base64"), mimeType: "application/pdf" },
  });

  const document = result.document;
  const fullText = document?.text?.trim() ?? "";
  const docPages = document?.pages ?? [];

  const pages: PdfPageText[] = docPages.map((page, index) => {
    const blocks = [...(page.paragraphs ?? []), ...(page.lines ?? [])];
    const pageText = blocks
      .map((b) => textFromAnchor(fullText, (b.layout as LayoutLike | undefined)?.textAnchor ?? null))
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    return { pageNumber: index + 1, text: pageText };
  });

  return { fullText, pagesProcessed: docPages.length, pages };
}
