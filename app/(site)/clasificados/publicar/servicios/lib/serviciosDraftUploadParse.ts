/**
 * Parse draft-media-upload responses without assuming JSON (Vercel may return plain text on 413).
 */

export type ServiciosDraftUploadParsed = {
  ok: boolean;
  publicUrl?: string;
  error?: string;
  detail?: string;
  status: number;
};

export function parseServiciosDraftMediaUploadResult(
  status: number,
  contentTypeHeader: string | null,
  rawBody: string,
): ServiciosDraftUploadParsed {
  const ct = (contentTypeHeader || "").toLowerCase();
  const raw = rawBody ?? "";

  if (status === 413 && !ct.includes("application/json")) {
    return {
      ok: false,
      status,
      error: "media_upload_payload_too_large",
      detail: "The upload exceeded the platform limit. Try a smaller image or retake the photo.",
    };
  }

  const trimmed = raw.trim();
  if (ct.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const j = JSON.parse(trimmed) as Record<string, unknown>;
      const ok = j.ok === true;
      const publicUrl = typeof j.publicUrl === "string" ? j.publicUrl : undefined;
      const error = typeof j.error === "string" ? j.error : undefined;
      const detail = typeof j.detail === "string" ? j.detail : undefined;
      if (ok && publicUrl) return { ok: true, status, publicUrl };
      return { ok: false, status, error: error || "upload_failed", detail };
    } catch {
      return {
        ok: false,
        status,
        error: "invalid_upload_response",
        detail: trimmed.slice(0, 200),
      };
    }
  }

  return {
    ok: false,
    status,
    error: status === 413 ? "media_upload_payload_too_large" : "upload_non_json",
    detail: trimmed.slice(0, 200),
  };
}
