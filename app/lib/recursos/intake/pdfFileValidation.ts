/**
 * Recursos Intake OS — Gate 4 PDF file safety validation. Pure, no network/storage/DB, fully
 * testable. Client-side validation (accept="application/pdf", size hint) is supplemental only —
 * every rule here is re-checked server-side before any upload proceeds.
 */

export const PDF_MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const PDF_MAGIC_BYTES = Buffer.from("%PDF-", "ascii");

export type PdfValidationResult = { ok: true } | { ok: false; reason: string };

/** Never trust the browser-supplied MIME type alone — this checks the actual file header. */
export function hasValidPdfMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < PDF_MAGIC_BYTES.length) return false;
  return buffer.subarray(0, PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES);
}

export function validatePdfUpload(params: { buffer: Buffer; declaredMimeType: string; sizeBytes: number }): PdfValidationResult {
  if (params.sizeBytes <= 0) return { ok: false, reason: "El archivo está vacío." };
  if (params.sizeBytes > PDF_MAX_BYTES) return { ok: false, reason: `El archivo excede el límite de ${PDF_MAX_BYTES / (1024 * 1024)} MB.` };
  if (!/^application\/pdf$/i.test((params.declaredMimeType ?? "").trim())) {
    return { ok: false, reason: "Tipo de archivo no permitido — solo se aceptan PDF." };
  }
  if (!hasValidPdfMagicBytes(params.buffer)) {
    return { ok: false, reason: "El archivo no es un PDF válido (encabezado incorrecto)." };
  }
  return { ok: true };
}

/** Strips path separators/traversal and control characters; caps length. Never used to execute anything. */
export function sanitizeUploadFilename(raw: string): string {
  const base = (raw ?? "untitled.pdf").split(/[\\/]/).pop() ?? "untitled.pdf";
  const cleaned = base
    .replace(/[\x00-\x1f]/g, "")
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 150);
  return cleaned || "documento.pdf";
}
