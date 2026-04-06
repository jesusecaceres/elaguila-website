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
