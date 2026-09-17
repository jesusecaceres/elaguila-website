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

const DIRECT_MEDIA_RE = /\.(mp4|webm|mov|m4v|m3u8)(\?|#|$)/i;

/**
 * Servicios Owner QA (SVC-QA-11) — can this video play INSIDE the Leonix viewer? YouTube embeds and
 * direct/HLS media (Mux, Blob) can; a TikTok/Instagram/Vimeo PAGE url cannot be put in a <video>, so
 * those keep the honest external-provider action instead of a broken player.
 */
export function isServiciosVideoPlayableInLeonix(v: Pick<ServiciosGalleryVideo, "url" | "muxPlaybackId">): boolean {
  const url = trimUrl(v.url);
  if (!url) return false;
  if (parseYouTubeVideoId(url)) return true;
  if (v.muxPlaybackId?.trim()) return true;
  if (DIRECT_MEDIA_RE.test(url)) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "stream.mux.com" || host.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

function externalVideoLinkLabel(url: string, lang: ServiciosLang): string {
  const platform = videoPlatformLabel(url, lang);
  return lang === "en" ? `Open on ${platform ?? "external site"} ↗` : `Abrir en ${platform ?? "sitio externo"} ↗`;
}

function ServiciosGalleryVideoEmbed({ v, lang }: { v: ServiciosGalleryVideo; lang: ServiciosLang }) {
  const externalUrl = resolveExternalVideoUrl(v);
  const yt = parseYouTubeVideoId(v.url);
  // Secondary provider action under the in-Leonix player (never the only way to watch).
  const providerLink =
    /^https?:\/\//i.test(externalUrl) && !DIRECT_MEDIA_RE.test(externalUrl) ? (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex text-xs font-semibold text-white/85 underline underline-offset-2 hover:text-white"
        data-servicios-video-provider-link="1"
      >
        {externalVideoLinkLabel(externalUrl, lang)}
      </a>
    ) : null;

  if (yt) {
    return (
      <div className="w-full">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black shadow-sm">
          <iframe
            title={lang === "en" ? "Video" : "Video"}
            src={youTubeEmbedSrc(yt)}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        {providerLink}
      </div>
    );
  }
  if (!isServiciosVideoPlayableInLeonix(v)) {
    const thumbnailUrl = resolveVideoThumbnailUrl(v);
    return (
      <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-[#1E1814] p-4 text-center">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        ) : null}
        <p className="relative text-sm text-white/90">
          {lang === "en"
            ? "This video plays on its own platform."
            : "Este video se reproduce en su propia plataforma."}
        </p>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative inline-flex min-h-[44px] items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1E1814]"
        >
          {externalVideoLinkLabel(externalUrl, lang)}
        </a>
      </div>
    );
  }
  return (
    <div className="w-full">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-black/[0.04] shadow-sm">
        <ServiciosStreamableVideo url={v.url} lang={lang} posterUrl={v.posterUrl} />
      </div>
      {providerLink}
    </div>
  );
}

/**
 * Gallery grid thumbnail. With `onOpenInViewer` (and a video Leonix can play) it opens the shared
 * Leonix viewer first, with the provider page as a secondary link below; otherwise it links out.
 * Lightbox: embedded player.
 */
export function ServiciosGalleryVideoTile({
  v,
  lang,
  variant = "thumbnail",
  onOpenInViewer,
}: {
  v: ServiciosGalleryVideo;
  lang: ServiciosLang;
  variant?: "thumbnail" | "embed";
  onOpenInViewer?: () => void;
}) {
  if (variant === "embed") {
    return <ServiciosGalleryVideoEmbed v={v} lang={lang} />;
  }

  const externalUrl = resolveExternalVideoUrl(v);
  const thumbnailUrl = resolveVideoThumbnailUrl(v);
  const platform = videoPlatformLabel(externalUrl, lang);
  const opensInLeonix = Boolean(onOpenInViewer) && isServiciosVideoPlayableInLeonix(v);
  const label = opensInLeonix
    ? lang === "en"
      ? "Play video"
      : "Ver video"
    : lang === "en"
      ? `Open video on ${platform ?? "external site"}`
      : `Abrir video en ${platform ?? "sitio externo"}`;

  const tileClass =
    "group relative block aspect-video w-full overflow-hidden rounded-xl border border-black/[0.06] bg-[#1E1814] shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]";
  const tileInner = (
    <>
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
    </>
  );

  if (opensInLeonix) {
    return (
      <div className="w-full" data-servicios-gallery-video-thumbnail="1">
        <button type="button" onClick={onOpenInViewer} className={`${tileClass} text-left`} aria-label={label}>
          {tileInner}
        </button>
        {/^https?:\/\//i.test(externalUrl) && !DIRECT_MEDIA_RE.test(externalUrl) ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex text-[11px] font-semibold text-[#6F6254] underline underline-offset-2 hover:text-[#1F1A17]"
          >
            {externalVideoLinkLabel(externalUrl, lang)}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <a
      href={externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={tileClass}
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
