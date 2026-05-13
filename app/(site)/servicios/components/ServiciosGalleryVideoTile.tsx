"use client";

import { useEffect, useRef } from "react";
import type { ServiciosGalleryVideo, ServiciosLang } from "../types/serviciosBusinessProfile";
import { parseYouTubeVideoId, youTubeEmbedSrc } from "../lib/serviciosVideoEmbed";

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
      const v = ref.current;
      if (v) {
        v.pause();
        v.removeAttribute("src");
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

/** Gallery / modal: YouTube iframe, HLS/MP4 streamable, or legacy progressive URL. */
export function ServiciosGalleryVideoTile({ v, lang }: { v: ServiciosGalleryVideo; lang: ServiciosLang }) {
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
