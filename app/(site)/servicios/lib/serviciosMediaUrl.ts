/** Allow https images, http(s) remote URLs, and in-browser data URLs for draft previews */
export function isAllowedServiciosImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("data:image/")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function serviciosImageUnoptimized(src: string): boolean {
  return src.startsWith("data:") || src.startsWith("blob:");
}

/** Draft-safe: https/http MP4 pages or embedded data URLs for local preview */
export function isAllowedServiciosVideoUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("data:video/")) return true;
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    if (host === "youtu.be" || host.endsWith(".youtube.com") || host === "youtube.com") return true;
    if (t.match(/\.(mp4|webm|ogg)(\?|$)/i)) return true;
    return true;
  } catch {
    return false;
  }
}
