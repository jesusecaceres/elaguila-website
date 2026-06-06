import "server-only";

export const OFERTA_LOCAL_DOCUMENT_AI_ENV_KEYS = [
  "GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON",
  "GOOGLE_DOCUMENT_AI_PROJECT_ID",
  "GOOGLE_DOCUMENT_AI_PROCESSOR_LOCATION",
  "GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID",
] as const;

export type OfertaLocalDocumentAiConfig = {
  projectId: string;
  processorLocation: string;
  ocrProcessorId: string;
  credentials: Record<string, unknown>;
};

function parseCredentialsJson(): Record<string, unknown> | null {
  const raw = process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getMissingOfertaLocalDocumentAiEnvLabels(): string[] {
  const missing: string[] = [];
  if (!process.env.GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON?.trim()) {
    missing.push("GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON");
  } else if (!parseCredentialsJson()) {
    missing.push("GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON (invalid JSON)");
  }
  if (!process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID?.trim()) {
    missing.push("GOOGLE_DOCUMENT_AI_PROJECT_ID");
  }
  if (!process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_LOCATION?.trim()) {
    missing.push("GOOGLE_DOCUMENT_AI_PROCESSOR_LOCATION");
  }
  if (!process.env.GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID?.trim()) {
    missing.push("GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID");
  }
  return missing;
}

export function isOfertaLocalDocumentAiConfigured(): boolean {
  return getMissingOfertaLocalDocumentAiEnvLabels().length === 0;
}

export function getOfertaLocalDocumentAiConfig(): OfertaLocalDocumentAiConfig | null {
  if (!isOfertaLocalDocumentAiConfigured()) return null;
  const credentials = parseCredentialsJson();
  if (!credentials) return null;
  return {
    projectId: process.env.GOOGLE_DOCUMENT_AI_PROJECT_ID!.trim(),
    processorLocation: process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_LOCATION!.trim(),
    ocrProcessorId: process.env.GOOGLE_DOCUMENT_AI_OCR_PROCESSOR_ID!.trim(),
    credentials,
  };
}

export function getOfertaLocalDocumentAiProcessorName(config: OfertaLocalDocumentAiConfig): string {
  return `projects/${config.projectId}/locations/${config.processorLocation}/processors/${config.ocrProcessorId}`;
}

export function assertOfertaLocalDocumentAiConfig(): OfertaLocalDocumentAiConfig {
  const missing = getMissingOfertaLocalDocumentAiEnvLabels();
  if (missing.length > 0) {
    throw new Error(`Google Document AI is not configured. Missing: ${missing.join(", ")}`);
  }
  const config = getOfertaLocalDocumentAiConfig();
  if (!config) {
    throw new Error("Google Document AI credentials could not be parsed.");
  }
  return config;
}
