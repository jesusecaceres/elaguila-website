"use client";

import { FiPlay, FiVideo } from "react-icons/fi";
import { FaTiktok, FaInstagram, FaFacebook, FaYoutube } from "react-icons/fa";
import { isRestauranteLocalVideoDataUrl } from "@/app/clasificados/restaurantes/application/restauranteMediaDisplay";
import {
  detectRestauranteVideoPlatform,
  platformDisplayName,
  resolveRestauranteVideoThumbnailUrl,
  safeRestauranteVideoHostLabel,
  type RestauranteVideoPlatform,
} from "./restauranteVideoPreview";

function PlatformIcon({ platform }: { platform: RestauranteVideoPlatform }) {
  const cls = "h-5 w-5 shrink-0";
  switch (platform) {
    case "youtube":
      return <FaYoutube className={cls} aria-hidden />;
    case "tiktok":
      return <FaTiktok className={cls} aria-hidden />;
    case "instagram":
      return <FaInstagram className={cls} aria-hidden />;
    case "facebook":
      return <FaFacebook className={cls} aria-hidden />;
    default:
      return <FiVideo className={cls} aria-hidden />;
  }
}

export function RestauranteVideoPreviewCard({
  videoRemoteUrl,
  videoSrc,
  label,
  lang = "es",
  onClick,
  compact = false,
  selected = false,
}: {
  videoRemoteUrl?: string;
  videoSrc?: string;
  label?: string;
  lang?: "es" | "en";
  onClick?: () => void;
  compact?: boolean;
  selected?: boolean;
}) {
  const remote = videoRemoteUrl?.trim() ?? "";
  const local = videoSrc?.trim() ?? "";
  const platform = remote ? detectRestauranteVideoPlatform(remote) : "generic";
  const thumbnail = remote ? resolveRestauranteVideoThumbnailUrl(remote) : null;
  const host = remote ? safeRestauranteVideoHostLabel(remote) : "";
  const title = label?.trim() || platformDisplayName(platform, lang);
  const cta = lang === "en" ? "Watch video" : "Ver video";

  const frameClass = compact
    ? "relative aspect-[16/10] min-h-[44px] w-full min-w-[140px] max-w-[220px] overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/55"
    : "relative aspect-[16/10] min-h-[44px] w-full overflow-hidden rounded-xl border text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/55";

  const borderClass = selected
    ? "border-[#C9A84A] ring-2 ring-[#C9A84A]/35"
    : "border-[#D8C2A0] hover:border-[#C9A84A]/70";

  const inner = (
    <>
      {thumbnail ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        </>
      ) : local && isRestauranteLocalVideoDataUrl(local) ? (
        <>
          <video
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
            src={local}
          />
          <span className="absolute inset-0 bg-black/25" />
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#1f1c17] via-[#2a2620] to-[#141210] p-3 text-center text-white">
          <PlatformIcon platform={platform} />
          <p className="text-xs font-bold">{platformDisplayName(platform, lang)}</p>
          {host ? <p className="line-clamp-1 text-[10px] font-medium text-white/60">{host}</p> : null}
        </div>
      )}

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-[#1E1814] shadow-lg sm:h-11 sm:w-11">
          <FiPlay className="ml-0.5 h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
        </span>
      </span>

      <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6">
        <span className="block line-clamp-1 text-[11px] font-bold text-white">{title}</span>
        {!thumbnail && remote ? (
          <span className="mt-0.5 block line-clamp-1 text-[10px] font-medium text-white/70">{cta}</span>
        ) : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${frameClass} ${borderClass}`} aria-label={`${title} — ${cta}`}>
        {inner}
      </button>
    );
  }

  if (remote) {
    return (
      <a
        href={remote}
        target="_blank"
        rel="noopener noreferrer"
        className={`${frameClass} ${borderClass}`}
        aria-label={`${title} — ${cta}`}
      >
        {inner}
      </a>
    );
  }

  return <div className={`${frameClass} ${borderClass}`}>{inner}</div>;
}
