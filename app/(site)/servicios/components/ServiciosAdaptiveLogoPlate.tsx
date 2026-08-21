"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { LX_LOGO_PLATE_BASE, LX_TYPE_SERIF_DISPLAY } from "./serviciosLeonixBrand";
import type { LogoPresentationId } from "@/app/lib/adBranding";

type LogoVariant = "card" | "hero";
type LogoShape = "square" | "wide";

function plateSizeClass(variant: LogoVariant, shape: LogoShape): string {
  if (variant === "hero") {
    return shape === "wide"
      ? "h-[4.5rem] w-[min(13.75rem,52vw)] sm:h-[5.5rem] sm:w-[min(16.25rem,46vw)] lg:h-[5.5rem] lg:w-[min(13.75rem,40vw)]"
      : "h-28 w-28 sm:h-32 sm:w-32 lg:h-32 lg:w-32";
  }
  return shape === "wide"
    ? "h-[4.25rem] w-[min(11rem,42vw)] sm:h-[4.5rem] sm:w-[min(11.25rem,38vw)]"
    : "h-[5.5rem] w-[5.5rem] sm:h-[6.5rem] sm:w-[6.5rem]";
}

/**
 * Adaptive ivory/gold logo plate — square or wide brand mark, never cropped or stretched.
 *
 * Leonix Ad Branding Layer (Gate 2B): `presentation` selects one of a fixed set of approved
 * frame shapes (never a freeform crop/position), and `accentColor` swaps the border tone to
 * the advertiser's theme accent. Both are optional and inert when omitted — the plate renders
 * exactly as it always has for every listing without a branding profile.
 */
export function ServiciosAdaptiveLogoPlate({
  src,
  alt,
  fallbackMonogram,
  variant = "card",
  className = "",
  presentation,
  accentColor,
}: {
  src?: string | null;
  alt: string;
  fallbackMonogram?: string;
  variant?: LogoVariant;
  className?: string;
  presentation?: LogoPresentationId;
  accentColor?: string;
}) {
  const [autoShape, setAutoShape] = useState<LogoShape>("square");
  const trimmed = (src ?? "").trim();

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    setAutoShape(img.naturalWidth / img.naturalHeight > 1.35 ? "wide" : "square");
  }, []);

  // "circular" always frames as a square (a circle needs equal sides); "banner" always frames
  // wide (that is the point of the preset). "boxed"/unset keeps the existing auto-detected shape.
  const shape: LogoShape =
    presentation === "circular" ? "square" : presentation === "banner" ? "wide" : autoShape;
  const sizeClass = plateSizeClass(variant, shape);
  const plateStyle: React.CSSProperties | undefined =
    presentation === "circular" || accentColor
      ? {
          ...(presentation === "circular" ? { borderRadius: "9999px" } : {}),
          ...(accentColor ? { borderColor: accentColor } : {}),
        }
      : undefined;

  if (!trimmed) {
    const mono = (fallbackMonogram || alt || "?").trim().slice(0, 2).toUpperCase();
    return (
      <div
        className={`${LX_LOGO_PLATE_BASE} ${sizeClass} flex shrink-0 items-center justify-center ${LX_TYPE_SERIF_DISPLAY} text-base uppercase tracking-wide text-[#3B2117] sm:text-lg ${className}`.trim()}
        style={plateStyle}
        aria-hidden={!alt}
      >
        {mono}
      </div>
    );
  }

  return (
    <div className={`${LX_LOGO_PLATE_BASE} ${sizeClass} relative shrink-0 ${className}`.trim()} style={plateStyle}>
      <Image
        src={trimmed}
        alt={alt}
        fill
        className="object-contain p-1.5 sm:p-2"
        sizes={variant === "hero" ? "128px" : "104px"}
        unoptimized={serviciosImageUnoptimized(trimmed)}
        onLoad={onImgLoad}
      />
    </div>
  );
}
