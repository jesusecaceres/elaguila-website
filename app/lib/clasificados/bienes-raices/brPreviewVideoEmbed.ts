/**
 * BR preview — safe YouTube/Vimeo embed detection + platform labels.
 */
import {
  extractVimeoId,
  extractYoutubeId,
  vimeoEmbedSrc,
  youtubeEmbedSrc,
} from "@/app/(site)/clasificados/en-venta/shared/utils/enVentaVideoEmbed";

export { extractYoutubeId, extractVimeoId, youtubeEmbedSrc, vimeoEmbedSrc };

export function normalizeVideoUrl(raw: string): string {
  return String(raw ?? "").trim();
}

export type EmbeddableVideoKind = "youtube" | "vimeo" | "direct" | "none";

export function getEmbeddableVideoKind(url: string): EmbeddableVideoKind {
  const u = normalizeVideoUrl(url);
  if (!u) return "none";
  if (u.startsWith("data:video") || u.startsWith("blob:")) return "direct";
  if (extractYoutubeId(u)) return "youtube";
  if (extractVimeoId(u)) return "vimeo";
  if (/\.m3u8(\?|$)/i.test(u) || /\.mp4(\?|$)/i.test(u) || /\.webm(\?|$)/i.test(u)) return "direct";
  return "none";
}

export function getEmbeddableVideoUrl(url: string): string | null {
  const u = normalizeVideoUrl(url);
  if (!u) return null;
  const yt = extractYoutubeId(u);
  if (yt) return youtubeEmbedSrc(yt);
  const vimeo = extractVimeoId(u);
  if (vimeo) return vimeoEmbedSrc(vimeo);
  if (getEmbeddableVideoKind(u) === "direct") return u;
  return null;
}

export function getVideoPlatformLabel(url: string, lang: "es" | "en" = "es"): string {
  const kind = getEmbeddableVideoKind(url);
  if (kind === "youtube") return "YouTube";
  if (kind === "vimeo") return "Vimeo";
  if (kind === "direct") return lang === "en" ? "Video file" : "Archivo de video";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host || (lang === "en" ? "External video" : "Video externo");
  } catch {
    return lang === "en" ? "External video" : "Video externo";
  }
}
