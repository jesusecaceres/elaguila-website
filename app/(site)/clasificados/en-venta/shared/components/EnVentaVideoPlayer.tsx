"use client";

import { useEffect, useRef } from "react";
import {
  extractVimeoId,
  extractYoutubeId,
  vimeoEmbedSrc,
  youtubeEmbedSrc,
} from "../utils/enVentaVideoEmbed";

type Props = {
  url: string;
  lang: "es" | "en";
  className?: string;
};

/** Playable embed for blob, Mux HLS, YouTube (incl. Shorts), Vimeo, or direct MP4 URLs. */
export function EnVentaVideoPlayer({ url, lang, className = "h-full w-full" }: Props) {
  if (url.startsWith("blob:")) {
    return <video src={url} controls className={`${className} object-contain`} playsInline />;
  }

  const yt = extractYoutubeId(url);
  if (yt) {
    return (
      <iframe
        title={lang === "es" ? "Video del anuncio" : "Listing video"}
        className={className}
        src={youtubeEmbedSrc(yt)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  const vimeo = extractVimeoId(url);
  if (vimeo) {
    return (
      <iframe
        title={lang === "es" ? "Video del anuncio" : "Listing video"}
        className={className}
        src={vimeoEmbedSrc(vimeo)}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return <StreamableVideo url={url} lang={lang} className={className} />;
}

function StreamableVideo({
  url,
  lang,
  className,
}: {
  url: string;
  lang: "es" | "en";
  className: string;
}) {
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
      className={`${className} object-contain`}
      aria-label={lang === "es" ? "Video del anuncio" : "Listing video"}
    />
  );
}
