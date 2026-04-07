"use client";

import { useEffect, useRef } from "react";

/** HLS / progressive MP4 / blob — same behavior as listing preview. */
export function BrNegocioStreamableVideo({ url, className }: { url: string; className?: string }) {
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
    void import("hls.js")
      .then(({ default: HlsCtor }) => {
        if (cancelled || !ref.current) return;
        if (HlsCtor.isSupported()) {
          const instance = new HlsCtor({ enableWorker: true });
          hls = instance;
          instance.loadSource(url);
          instance.attachMedia(ref.current!);
        } else {
          ref.current!.src = url;
        }
      })
      .catch(() => {
        if (!cancelled && ref.current) ref.current.src = url;
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
  return <video ref={ref} controls playsInline className={className ?? "h-full w-full object-contain"} />;
}
