"use client";

import Image from "next/image";
import { FiPlay } from "react-icons/fi";
import { isRestauranteLocalVideoDataUrl } from "@/app/clasificados/restaurantes/application/restauranteMediaDisplay";import type { ShellGalleryItem } from "./restaurantDetailShellTypes";

import {
  detectRestauranteVideoPlatform,
  extractRestauranteYoutubeId,
  extractRestauranteVimeoId,
  resolveRestauranteVideoThumbnailUrl,
  restauranteVimeoEmbedSrc,
  restauranteYoutubeEmbedSrc,
  platformDisplayName,
} from "./restauranteVideoPreview";
import { RestauranteVideoPreviewCard } from "./RestauranteVideoPreviewCard";

export function youtubeEmbedId(raw: string): string | null {
  return extractRestauranteYoutubeId(raw);
}

export type ShellMediaSlide =
  | { kind: "image"; url: string; alt: string }
  | { kind: "video"; item: ShellGalleryItem };

export function buildShellMediaSlides(items: ShellGalleryItem[]): ShellMediaSlide[] {
  const out: ShellMediaSlide[] = [];
  for (const g of items) {
    if (g.category === "video") {
      out.push({ kind: "video", item: g });
    } else if (g.imageUrl) {
      out.push({ kind: "image", url: g.imageUrl, alt: g.alt });
    }
  }
  return out;
}

export function ShellVideoSlide({ item }: { item: ShellGalleryItem }) {
  const src = item.videoSrc?.trim();
  const remote = item.videoRemoteUrl?.trim();
  if (src) {
    return (
      <video
        key={src.slice(0, 80)}
        className="max-h-[min(78vh,820px)] w-full max-w-5xl object-contain"
        controls
        playsInline
        preload="metadata"
        src={src}
      />
    );
  }
  if (remote) {
    const yid = youtubeEmbedId(remote);
    if (yid) {
      return (
        <iframe
          title={item.alt}
          className="aspect-video h-auto min-h-[240px] w-full max-w-5xl rounded-lg border border-white/10"
          src={restauranteYoutubeEmbedSrc(yid)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    const vimeoId = extractRestauranteVimeoId(remote);
    if (vimeoId) {
      return (
        <iframe
          title={item.alt}
          className="aspect-video h-auto min-h-[240px] w-full max-w-5xl rounded-lg border border-white/10"
          src={restauranteVimeoEmbedSrc(vimeoId)}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      );
    }
    const platform = detectRestauranteVideoPlatform(remote);
    return (
      <div className="flex w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <RestauranteVideoPreviewCard videoRemoteUrl={remote} label={item.alt} compact />
        <a
          href={remote}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/15"
        >
          {platform === "generic" ? "Ver video" : `Abrir en ${platformDisplayName(platform)}`}
        </a>
      </div>
    );
  }
  return <p className="p-8 text-center text-sm text-white/70">Video no disponible.</p>;
}

export function ShellGalleryThumb({
  g,
  onOpen,
}: {
  g: ShellGalleryItem;
  onOpen: () => void;
}) {
  if (g.category === "video" && !g.imageUrl && (g.videoRemoteUrl?.trim() || g.videoSrc?.trim())) {
    return (
      <RestauranteVideoPreviewCard
        videoRemoteUrl={g.videoRemoteUrl}
        videoSrc={g.videoSrc}
        label={g.alt}
        compact
        onClick={onOpen}
      />
    );
  }

  const thumbUrl =
    g.category === "video" && g.videoRemoteUrl?.trim()
      ? resolveRestauranteVideoThumbnailUrl(g.videoRemoteUrl)
      : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative aspect-square min-h-[44px] min-w-0 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] text-left transition hover:ring-2 hover:ring-[color:var(--lx-gold-border)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-gold)] ${
        g.category === "video" ? "ring-2 ring-[color:var(--lx-gold)]/35" : ""
      }`}
    >
      {g.imageUrl ? (
        <Image
          src={g.imageUrl}
          alt={g.alt}
          fill
          unoptimized={g.imageUrl.startsWith("data:")}
          className="object-cover"
          sizes="(max-width:640px) 50vw, 33vw"
          draggable={false}
        />
      ) : thumbUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumbUrl} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" decoding="async" />
        </>
      ) : g.category === "video" && g.videoSrc && isRestauranteLocalVideoDataUrl(g.videoSrc) ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
          src={g.videoSrc}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] to-[#1a1814]" aria-hidden />
      )}
      {g.countOverlay != null ? (
        <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white">
          +{g.countOverlay}
        </span>
      ) : null}
      {g.category === "video" &&
      (g.imageUrl || thumbUrl || (g.videoSrc && isRestauranteLocalVideoDataUrl(g.videoSrc))) ? (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-[color:var(--lx-text)] shadow-lg sm:h-12 sm:w-12">
            <FiPlay className="ml-0.5 h-5 w-5" aria-hidden />
          </span>
        </span>
      ) : null}
    </button>
  );
}
