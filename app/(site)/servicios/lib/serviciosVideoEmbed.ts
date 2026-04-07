function trimUrl(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Returns YouTube embed path (video id) for iframe src, or null */
export function parseYouTubeVideoId(pageUrl: string): string | null {
  const t = trimUrl(pageUrl);
  if (!t) return null;
  try {
    const u = new URL(t);
    const host = u.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = u.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/^\/embed\/([\w-]{11})/);
      if (m) return m[1] ?? null;
      const s = u.pathname.match(/^\/shorts\/([\w-]{11})/);
      if (s) return s[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export function youTubeEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}
