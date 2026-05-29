/** YouTube / Vimeo / Mux URL helpers for En Venta preview + live detail. */

export function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const shorts = u.pathname.match(/\/shorts\/([^/?#]+)/);
      if (shorts?.[1]) return shorts[1];
      const embed = u.pathname.match(/\/embed\/([^/?#]+)/);
      if (embed?.[1]) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function extractVimeoId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!u.hostname.includes("vimeo.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts[parts.length - 1];
    return id && /^\d+$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function vimeoEmbedSrc(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

export function isEmbeddableExternalVideoUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (t.startsWith("blob:")) return true;
  if (/\.m3u8(\?|$)/i.test(t)) return true;
  if (extractYoutubeId(t)) return true;
  if (extractVimeoId(t)) return true;
  return /^https?:\/\//i.test(t);
}

export function muxPlaybackUrlFromId(playbackId: string | null | undefined): string | null {
  const clean = String(playbackId ?? "").trim();
  return clean ? `https://stream.mux.com/${clean}.m3u8` : null;
}

export function videoUrlFromDetailPairs(
  pairs: Array<{ label: string; value: string }> | null | undefined
): string | null {
  if (!pairs?.length) return null;
  for (const p of pairs) {
    if (p.label.trim() === "Leonix:videoUrl") {
      const v = p.value.trim();
      if (v && isEmbeddableExternalVideoUrl(v)) return v;
    }
  }
  return null;
}

/** Legacy publishes appended `\n\nVideo: https://…` to description. */
export function videoUrlFromDescription(description: string | null | undefined): string | null {
  const d = String(description ?? "");
  const m = d.match(/\bVideo:\s*(https?:\/\/[^\s]+)/i);
  if (m?.[1] && isEmbeddableExternalVideoUrl(m[1])) return m[1].trim();
  return null;
}

export type ResolveEnVentaVideoUrlArgs = {
  muxPlaybackId?: string | null;
  muxPlaybackUrl?: string | null;
  externalUrl?: string | null;
  detailPairs?: Array<{ label: string; value: string }> | null;
  description?: string | null;
};

/** Prefer uploaded Mux HLS, then explicit external URL / detail pair, then description fallback. */
export function resolveEnVentaVideoUrl(args: ResolveEnVentaVideoUrlArgs): string | null {
  const muxFromId = muxPlaybackUrlFromId(args.muxPlaybackId);
  const muxDirect = String(args.muxPlaybackUrl ?? "").trim();
  if (muxFromId) return muxFromId;
  if (muxDirect && (/\.m3u8(\?|$)/i.test(muxDirect) || muxDirect.startsWith("https://stream.mux.com/"))) {
    return muxDirect;
  }

  const external = String(args.externalUrl ?? "").trim();
  if (external && isEmbeddableExternalVideoUrl(external)) return external;

  const fromPair = videoUrlFromDetailPairs(args.detailPairs);
  if (fromPair) return fromPair;

  return videoUrlFromDescription(args.description);
}
