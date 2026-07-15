/**
 * A5.MEDIA-02 — Autos-scoped YouTube embed URL resolver for gallery lightbox.
 */

/** Convert YouTube watch, Shorts, or youtu.be links to an embed-safe iframe URL. */
export function resolveAutosYoutubeEmbedUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    let id: string | null = null;

    if (host === "youtu.be") {
      id = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] === "shorts" && parts[1]) {
        id = parts[1];
      } else if (parts[0] === "embed" && parts[1]) {
        id = parts[1];
      } else if (parsed.pathname === "/watch") {
        id = parsed.searchParams.get("v");
      }
    }

    if (!id || !/^[a-zA-Z0-9_-]{11}$/.test(id)) return null;
    return `https://www.youtube.com/embed/${id}?rel=0&playsinline=1`;
  } catch {
    return null;
  }
}

export function isAutosYoutubeUrl(raw: string): boolean {
  return resolveAutosYoutubeEmbedUrl(raw) != null;
}
