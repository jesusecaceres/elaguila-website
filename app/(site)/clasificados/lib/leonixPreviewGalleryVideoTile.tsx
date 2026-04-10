"use client";

import type { BienesRaicesPreviewMediaVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import { BrNegocioStreamableVideo } from "@/app/clasificados/bienes-raices/preview/negocio/components/BrNegocioStreamableVideo";
import { isHostedStreamOrBlobUrl, isHttpsDirectVideoUrl, isInlineVideoDataUrl } from "@/app/clasificados/lib/leonixPreviewVideoUrl";

const BORDER = "rgba(61, 54, 48, 0.12)";
const CREAM_CARD = "#FDFBF7";
const CHARCOAL_DEEP = "#2A2620";
const MUTED = "rgba(61, 54, 48, 0.62)";

function IconPlay() {
  return (
    <svg className="h-7 w-7" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function EmptySlot({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div
      className="flex h-full w-full min-h-[120px] flex-col items-center justify-center gap-3 px-6 py-8 text-center"
      style={{
        background: "linear-gradient(135deg, rgba(42,38,32,0.06) 0%, rgba(197,160,89,0.08) 55%, rgba(253,251,247,0.9) 100%)",
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl border shadow-sm"
        style={{ borderColor: BORDER, background: CREAM_CARD, color: "#C5A059" }}
        aria-hidden
      >
        <IconPlay />
      </div>
      <p className="text-sm font-bold" style={{ color: CHARCOAL_DEEP }}>
        {title}
      </p>
      <p className="max-w-sm text-xs leading-relaxed" style={{ color: MUTED }}>
        {subtitle}
      </p>
    </div>
  );
}

export type LeonixPreviewGalleryVideoTileProps = {
  slot: 0 | 1;
  media: BienesRaicesPreviewMediaVm | undefined;
  /** Default `aspect-[4/3]`. Use `h-full w-full` inside fixed aspect parents (e.g. hero video-only). */
  aspectClass?: string;
  /**
   * `hidden` (default): no output when this slot has no video (privado strip).
   * `placeholder`: negocio-style empty tile when the slot is unused.
   */
  whenEmpty?: "hidden" | "placeholder";
};

/**
 * Shared preview tile for BR/Rentas Leonix listings — keeps privado / negocio / lightbox playback rules aligned.
 */
export function LeonixPreviewGalleryVideoTile({
  slot,
  media: m,
  aspectClass = "aspect-[4/3]",
  whenEmpty = "hidden",
}: LeonixPreviewGalleryVideoTileProps) {
  const hasVideo = slot === 0 ? Boolean(m?.hasVideo1) : Boolean(m?.hasVideo2);
  const thumb = m?.videoThumbUrls?.[slot] ?? null;
  const playback = m?.videoPlaybackUrls?.[slot] ?? null;
  const yt = m?.youtubeIds?.[slot] ?? null;
  const watchUrl = yt ? `https://www.youtube.com/watch?v=${yt}` : playback ?? "";

  if (!hasVideo) {
    if (whenEmpty === "placeholder") {
      return (
        <div className={`w-full ${aspectClass}`}>
          <EmptySlot title={`Video ${slot + 1}`} subtitle="Sin video en este espacio." />
        </div>
      );
    }
    return null;
  }

  if (yt && thumb) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative block overflow-hidden rounded-2xl border text-left shadow-md ${aspectClass}`}
        style={{ borderColor: BORDER }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" className="h-full w-full object-cover brightness-[0.92]" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#1a2744] shadow-lg">
            <IconPlay />
          </div>
        </div>
      </a>
    );
  }

  if (playback && isInlineVideoDataUrl(playback)) {
    return (
      <div
        className={`flex min-h-[120px] flex-col overflow-hidden rounded-2xl border shadow-md ${aspectClass}`}
        style={{ borderColor: BORDER }}
      >
        <video controls playsInline className="h-full min-h-[120px] w-full flex-1 object-cover" src={playback} />
      </div>
    );
  }

  if (playback && isHostedStreamOrBlobUrl(playback)) {
    return (
      <div
        className={`flex min-h-[120px] flex-col overflow-hidden rounded-2xl border shadow-md ${aspectClass}`}
        style={{ borderColor: BORDER }}
      >
        {playback.includes(".m3u8") || playback.startsWith("blob:") ? (
          <BrNegocioStreamableVideo url={playback} className="h-full min-h-[120px] w-full flex-1 object-cover" />
        ) : (
          <video poster={thumb ?? undefined} controls playsInline className="h-full min-h-[120px] w-full flex-1 object-cover" src={playback} />
        )}
      </div>
    );
  }

  if (playback && isHttpsDirectVideoUrl(playback)) {
    return (
      <div
        className={`flex min-h-[120px] flex-col overflow-hidden rounded-2xl border shadow-md ${aspectClass}`}
        style={{ borderColor: BORDER }}
      >
        <video controls playsInline className="h-full min-h-[120px] w-full flex-1 object-cover" src={playback} />
      </div>
    );
  }

  if (thumb && !playback) {
    return (
      <div className={`relative overflow-hidden rounded-2xl border shadow-md ${aspectClass}`} style={{ borderColor: BORDER }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb} alt="" className="h-full w-full object-cover brightness-[0.92]" />
      </div>
    );
  }

  if (playback) {
    return (
      <a
        href={playback}
        target="_blank"
        rel="noopener noreferrer"
        className={`relative flex min-h-[140px] items-center justify-center overflow-hidden rounded-2xl border shadow-md ${aspectClass}`}
        style={{ borderColor: BORDER }}
      >
        <div className="flex h-full min-h-[120px] w-full items-center justify-center bg-black/80 px-2 text-center text-xs font-semibold text-white">
          Ver video en nueva pestaña
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#1a2744] shadow-lg">
            <IconPlay />
          </div>
        </div>
      </a>
    );
  }

  return (
    <div
      className={`flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border bg-[#F0EBE3] px-3 text-center shadow-md ${aspectClass}`}
      style={{ borderColor: BORDER }}
    >
      <span className="opacity-70" aria-hidden>
        <IconPlay />
      </span>
      <p className="text-[11px] font-semibold leading-snug" style={{ color: MUTED }}>
        Video en el anuncio — abre la galería para verlo o revisa el enlace/archivo en el formulario.
      </p>
    </div>
  );
}
