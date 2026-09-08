export const IGLESIAS_LOGO_MAX_BYTES = 5 * 1024 * 1024;

export const IGLESIAS_LOGO_ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export type IglesiasLogoLang = "es" | "en";

export function iglesiasLogoAcceptAttribute(): string {
  return "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
}

export function extensionForIglesiasLogoMime(mime: string): string {
  const t = mime.toLowerCase();
  if (t === "image/png") return "png";
  if (t === "image/webp") return "webp";
  return "jpg";
}

export function validateIglesiasLogoFile(
  file: Pick<File, "size" | "type">,
  lang: IglesiasLogoLang,
): { ok: true } | { ok: false; message: string } {
  const mime = (file.type || "").toLowerCase();
  if (!IGLESIAS_LOGO_ACCEPTED_MIME.includes(mime as (typeof IGLESIAS_LOGO_ACCEPTED_MIME)[number])) {
    return {
      ok: false,
      message:
        lang === "en"
          ? "Use a JPG, PNG, or WebP image for the church logo."
          : "Usa una imagen JPG, PNG o WebP para el logo de la iglesia.",
    };
  }
  if (file.size < 1) {
    return {
      ok: false,
      message: lang === "en" ? "Choose a logo file to upload." : "Elige un archivo de logo para subir.",
    };
  }
  if (file.size > IGLESIAS_LOGO_MAX_BYTES) {
    return {
      ok: false,
      message:
        lang === "en"
          ? "The logo must be 5 MB or smaller."
          : "El logo debe pesar 5 MB o menos.",
    };
  }
  return { ok: true };
}

export function parseIglesiasLogoUploadResponse(
  status: number,
  contentTypeHeader: string | null,
  rawBody: string,
): { ok: true; publicUrl: string } | { ok: false; error: string; detail?: string } {
  const ct = (contentTypeHeader || "").toLowerCase();
  const raw = rawBody ?? "";

  if (status === 413 && !ct.includes("application/json")) {
    return { ok: false, error: "file_too_large", detail: "payload_too_large" };
  }

  const trimmed = raw.trim();
  if (ct.includes("application/json") || trimmed.startsWith("{")) {
    try {
      const j = JSON.parse(trimmed) as Record<string, unknown>;
      if (j.ok === true && typeof j.publicUrl === "string") return { ok: true, publicUrl: j.publicUrl };
      const error = typeof j.error === "string" ? j.error : "upload_failed";
      const detail = typeof j.detail === "string" ? j.detail : undefined;
      return { ok: false, error, detail };
    } catch {
      return { ok: false, error: "invalid_upload_response" };
    }
  }

  return { ok: false, error: status === 413 ? "file_too_large" : "upload_non_json" };
}

export function iglesiasLogoUploadErrorMessage(
  error: string,
  detail: string | undefined,
  lang: IglesiasLogoLang,
): string {
  if (error === "unsupported_type") {
    return lang === "en" ? "Use a JPG, PNG, or WebP image." : "Usa una imagen JPG, PNG o WebP.";
  }
  if (error === "file_too_large" || error === "media_upload_payload_too_large") {
    return lang === "en" ? "The logo must be 5 MB or smaller." : "El logo debe pesar 5 MB o menos.";
  }
  if (error === "blob_unconfigured") {
    return lang === "en" ? "Logo upload is temporarily unavailable." : "La subida del logo no está disponible por ahora.";
  }
  if (detail) return detail;
  return lang === "en" ? "Could not upload the logo. Try again." : "No pudimos subir el logo. Inténtalo de nuevo.";
}
