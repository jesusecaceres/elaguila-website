/** Shared with draft upload route and smoke tests (no `"use client"`). */
export const SERVICIOS_DRAFT_MEDIA_MAX_BYTES = 4 * 1024 * 1024;

/**
 * Servicios V1: no transcoding. Optional local/draft videos over the draft upload cap
 * are skipped instead of blocking publish.
 *
 * `urlHint` helps when `fetch(data:video/...)` returns a Blob with an empty `type` in some browsers.
 */
export function shouldSkipServiciosOversizedDraftVideo(options: {
  mimeType: string;
  byteLength: number;
  urlHint?: string;
}): boolean {
  const mime = (options.mimeType || "").toLowerCase();
  const url = (options.urlHint ?? "").trim();
  const isVideo = mime.startsWith("video/") || /^data:video\//i.test(url);
  if (!isVideo) return false;
  return options.byteLength > SERVICIOS_DRAFT_MEDIA_MAX_BYTES;
}
