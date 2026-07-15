"use client";

import { useEffect, useRef } from "react";
import { FiPlay } from "react-icons/fi";
import type { ServiciosGalleryVideo, ServiciosLang } from "../types/serviciosBusinessProfile";
import { parseYouTubeVideoId, youTubeEmbedSrc } from "../lib/serviciosVideoEmbed";

function trimUrl(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function resolveExternalVideoUrl(v: ServiciosGalleryVideo): string {
  return trimUrl(v.url);
}

function resolveVideoThumbnailUrl(v: ServiciosGalleryVideo): string | null {
  const poster = trimUrl(v.posterUrl ?? "");
  if (poster) return poster;
  const yt = parseYouTubeVideoId(v.url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

function videoPlatformLabel(url: string, lang: ServiciosLang): string | null {
  const t = trimUrl(url);
  if (!t) return null;
  try {
    const host = new URL(t).hostname.toLowerCase();
    if (host.includes("youtube.com") || host === "youtu.be") return "YouTube";
    if (host.includes("tiktok.com")) return "TikTok";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("vimeo.com")) return "Vimeo";
  } catch {
    return null;
  }
  return lang === "en" ? "Video" : "Video";
}

/**
 * Mux direct-upload uses HLS (.m3u8). Safari plays HLS natively; Chrome/Firefox need hls.js.
 */
function ServiciosStreamableVideo({ url, lang, posterUrl }: { url: string; lang: ServiciosLang; posterUrl?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isHls = /\.m3u8(\?|$)/i.test(url);

    if (!isHls) {
      el.src = url;
      return () => {
        el.pause();
        el.removeAttribute("src");
      };
    }

    let cancelled = false;
    let hls: { destroy: () => void } | null = null;

    if (el.canPlayType("application/vnd.apple.mpegurl")) {
      el.src = url;
      return () => {
        el.pause();
        el.removeAttribute("src");
      };
    }

    void import("hls.js").then(({ default: HlsCtor }) => {
      if (cancelled || !ref.current) return;
      if (HlsCtor.isSupported()) {
        const instance = new HlsCtor({ enableWorker: true });
        hls = instance;
        instance.loadSource(url);
        instance.attachMedia(ref.current!);
      } else {
        ref.current!.src = url;
      }
    });

    return () => {
      cancelled = true;
      hls?.destroy();
      const videoEl = ref.current;
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute("src");
      }
    };
  }, [url]);

  return (
    <video
      ref={ref}
      controls
      playsInline
      preload="metadata"
      poster={posterUrl?.trim() || undefined}
      className="h-full w-full object-cover"
      aria-label={lang === "en" ? "Listing video" : "Video del anuncio"}
    />
  );
}

function ServiciosGalleryVideoEmbed({ v, lang }: { v: ServiciosGalleryVideo; lang: ServiciosLang }) {
  const yt = parseYouTubeVideoId(v.url);
  if (yt) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black shadow-sm">
        <iframe
          title={lang === "en" ? "Video" : "Video"}
          src={youTubeEmbedSrc(yt)}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.04] shadow-sm">
      <ServiciosStreamableVideo url={v.url} lang={lang} posterUrl={v.posterUrl} />
    </div>
  );
}

/** Gallery grid: thumbnail opens external source. Lightbox: embedded player. */
export function ServiciosGalleryVideoTile({
  v,
  lang,
  variant = "thumbnail",
}: {
  v: ServiciosGalleryVideo;
  lang: ServiciosLang;
  variant?: "thumbnail" | "embed";
}) {
  if (variant === "embed") {
    return <ServiciosGalleryVideoEmbed v={v} lang={lang} />;
  }

  const externalUrl = resolveExternalVideoUrl(v);
  const thumbnailUrl = resolveVideoThumbnailUrl(v);
  const platform = videoPlatformLabel(externalUrl, lang);
  const label =
    lang === "en"
      ? `Open video on ${platform ?? "external site"}`
      : `Abrir video en ${platform ?? "sitio externo"}`;

  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-[#1E1814] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]"
      aria-label={label}
      data-servicios-gallery-video-thumbnail="1"
    >
      {thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-[#2A2620] to-[#1E1814]" aria-hidden />
      )}
      <span className="absolute inset-0 bg-black/25 transition group-hover:bg-black/35" aria-hidden />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-md ring-2 ring-white/30">
          <FiPlay className="ml-0.5 h-5 w-5" aria-hidden />
        </span>
      </span>
      {platform ? (
        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {platform}
        </span>
      ) : null}
    </a>
  );
}
