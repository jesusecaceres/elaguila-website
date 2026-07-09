"use client";

import { useEffect, useState } from "react";
import {
  getOfertaLocalCssCropStyle,
  resolveOfertaLocalInstantCropImageSource,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewMapper";
import type { OfertaLocalItemReviewViewModel } from "@/app/lib/ofertas-locales/ofertasLocalesTypes";

type CropItem = Pick<
  OfertaLocalItemReviewViewModel,
  "id" | "sourceBbox" | "sourceAssetUrl" | "sourceFileName" | "sourcePage"
>;

/**
 * Gate 4C — instant client-side CSS crop of the real flyer image using the
 * item's normalized bbox. No canvas, no data URLs, no network fetch, no mutation.
 * Renders nothing (and calls onUnavailable) when a safe crop is not possible.
 */
export function OfertasFlyerCropPreview({
  item,
  heroImageHref,
  alt,
  variant,
  onUnavailable,
}: {
  item: CropItem;
  heroImageHref?: string | null;
  alt: string;
  variant: "card" | "drawer";
  onUnavailable?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const src = resolveOfertaLocalInstantCropImageSource({ item, heroImageHref });
  const cropStyle = getOfertaLocalCssCropStyle(item.sourceBbox);

  useEffect(() => {
    setFailed(false);
  }, [src, item.id]);

  useEffect(() => {
    if ((!src || !cropStyle) && onUnavailable) onUnavailable();
  }, [src, cropStyle, onUnavailable]);

  if (!src || !cropStyle || failed) return null;

  const heightClass = variant === "drawer" ? "h-44 sm:h-52" : "h-28 lg:h-24";

  return (
    <div className={`relative w-full overflow-hidden bg-[#FDF8F0]/60 ${heightClass}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => {
          setFailed(true);
          onUnavailable?.();
        }}
        style={{
          position: "absolute",
          maxWidth: "none",
          width: `${cropStyle.imageWidthPct}%`,
          height: `${cropStyle.imageHeightPct}%`,
          left: `${cropStyle.imageLeftPct}%`,
          top: `${cropStyle.imageTopPct}%`,
        }}
      />
    </div>
  );
}
