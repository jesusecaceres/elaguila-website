/**
 * Restaurante public video preview helpers (Gate REST-POLISH2).
 * Adapted from En Venta embed/thumbnail patterns — Restaurante-specific, display-only.
 */

export type RestauranteVideoPlatform =
  | "youtube"
  | "vimeo"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "generic";

export function extractRestauranteYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtube-nocookie.com") || u.hostname.includes("m.youtube.com")) {
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

export function extractRestauranteVimeoId(url: string): string | null {
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

export function detectRestauranteVideoPlatform(url: string): RestauranteVideoPlatform {
  const t = url.trim().toLowerCase();
  if (!t) return "generic";
  if (extractRestauranteYoutubeId(t)) return "youtube";
  if (extractRestauranteVimeoId(t)) return "vimeo";
  if (t.includes("tiktok.com")) return "tiktok";
  if (t.includes("instagram.com")) return "instagram";
  if (t.includes("facebook.com") || t.includes("fb.watch")) return "facebook";
  return "generic";
}

export function resolveRestauranteVideoThumbnailUrl(url: string): string | null {
  const yt = extractRestauranteYoutubeId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

export function restauranteYoutubeEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

export function restauranteVimeoEmbedSrc(videoId: string): string {
  return `https://player.vimeo.com/video/${videoId}`;
}

export function safeRestauranteVideoHostLabel(url: string): string {
  const t = url?.trim();
  if (!t) return "";
  try {
    return new URL(t).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function platformDisplayName(platform: RestauranteVideoPlatform, lang: "es" | "en" = "es"): string {
  switch (platform) {
    case "youtube":
      return "YouTube";
    case "vimeo":
      return "Vimeo";
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    default:
      return lang === "en" ? "Video" : "Video";
  }
}
