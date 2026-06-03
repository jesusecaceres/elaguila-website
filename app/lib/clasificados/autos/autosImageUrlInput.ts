/** Classify pasted URLs for Autos photo URL fields — reject video hosts; require http(s). */

export type AutosImageUrlRejectReason = "empty" | "video" | "invalid";

const VIDEO_HOST_RE =
  /(?:youtube\.com|youtu\.be|vimeo\.com|tiktok\.com|dailymotion\.com|facebook\.com\/watch|twitch\.tv)/i;
const VIDEO_PATH_RE = /\/shorts\/|\/reel\/|\/reels\//i;
const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v|m3u8|avi)(\?|#|$)/i;

function normalizeUrlInput(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  if (/^\/\//.test(t)) return `https:${t}`;
  return t;
}

export function classifyAutosImageUrlInput(
  raw: string,
): { ok: true; url: string } | { ok: false; reason: AutosImageUrlRejectReason } {
  const u = normalizeUrlInput(raw);
  if (!u) return { ok: false, reason: "empty" };
  try {
    const parsed = new URL(u);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, reason: "invalid" };
    }
  } catch {
    return { ok: false, reason: "invalid" };
  }
  const lower = u.toLowerCase();
  if (VIDEO_HOST_RE.test(lower) || VIDEO_PATH_RE.test(lower) || VIDEO_EXT_RE.test(lower)) {
    return { ok: false, reason: "video" };
  }
  return { ok: true, url: u };
}
