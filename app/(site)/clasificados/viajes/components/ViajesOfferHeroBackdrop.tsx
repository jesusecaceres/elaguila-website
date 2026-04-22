"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ViajesOpenCardLane } from "../lib/viajesOpenCardStrategy";
import type { ViajesHeroVisualKind } from "../lib/viajesOfferHeroFallbacks";
import { buildHeroFallbackChain } from "../lib/viajesOfferHeroFallbacks";

function laneGradientOnly(lane: ViajesOpenCardLane): string {
  if (lane === "affiliate") return "bg-gradient-to-br from-amber-900 via-stone-900 to-neutral-950";
  if (lane === "business") return "bg-gradient-to-br from-emerald-900 via-stone-900 to-neutral-950";
  return "bg-gradient-to-br from-slate-800 via-stone-900 to-neutral-950";
}

function laneRadial(lane: ViajesOpenCardLane): string {
  if (lane === "affiliate") return "bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(251,191,36,0.22),transparent_55%)]";
  if (lane === "business") return "bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(52,211,153,0.18),transparent_55%)]";
  return "bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(148,163,184,0.2),transparent_55%)]";
}

/**
 * Reliable hero: tries primary URL, then kind fallback, then default travel image, then premium gradient-only (no dead area).
 */
export function ViajesOfferHeroBackdrop({
  heroImageSrc,
  heroImageAlt,
  heroUseNativeImg,
  visualKind,
  lane,
  children,
}: {
  heroImageSrc: string;
  heroImageAlt: string;
  heroUseNativeImg?: boolean;
  visualKind: ViajesHeroVisualKind;
  lane: ViajesOpenCardLane;
  children: React.ReactNode;
}) {
  const chain = useMemo(() => buildHeroFallbackChain(heroImageSrc, visualKind), [heroImageSrc, visualKind]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [chain.join("|")]);

  const activeSrc = chain[index] ?? "";
  const exhausted = index >= chain.length;
  const showImage = !exhausted && Boolean(activeSrc);

  const onImgError = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  return (
    <div className="relative min-h-[min(56vh,560px)] w-full overflow-hidden sm:min-h-[min(58vh,580px)]">
      {showImage ? (
        heroUseNativeImg && (activeSrc.startsWith("blob:") || activeSrc.startsWith("data:")) ? (
           
          <img
            src={activeSrc}
            alt={heroImageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={onImgError}
          />
        ) : (
           
          <img
            src={activeSrc}
            alt={heroImageAlt}
            className="absolute inset-0 h-full w-full object-cover object-center"
            onError={onImgError}
            loading="eager"
            decoding="async"
          />
        )
      ) : (
        <div className={`absolute inset-0 ${laneGradientOnly(lane)}`} aria-hidden />
      )}

      {!showImage ? <div className={`pointer-events-none absolute inset-0 ${laneRadial(lane)}`} aria-hidden /> : null}

      {!showImage ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.14]"
          aria-hidden
        >
          <span className="text-[clamp(3.5rem,14vw,9rem)] font-black tracking-tighter text-white/90">✦</span>
        </div>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/48 to-black/28" aria-hidden />
      <div className="absolute inset-0 flex flex-col justify-end">{children}</div>
    </div>
  );
}
