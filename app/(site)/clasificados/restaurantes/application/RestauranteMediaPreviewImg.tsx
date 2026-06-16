"use client";

import { useEffect, useState } from "react";
import {
  resolveRestauranteMediaRefForDisplay,
  restauranteDraftMediaNamespace,
} from "./restauranteDraftMedia";
import { isRestauranteDisplayableImageRef } from "./restauranteMediaDisplay";

type Props = {
  src: string | undefined;
  draftListingId: string;
  alt?: string;
  className?: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "sync" | "auto";
  sizes?: string;
  width?: number;
  height?: number;
};

/** Lazy, fixed-size preview for Restaurante form grids — resolves IDB refs on demand. */
export function RestauranteMediaPreviewImg({
  src,
  draftListingId,
  alt = "",
  className,
  loading = "lazy",
  decoding = "async",
  sizes,
  width,
  height,
}: Props) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    void (async () => {
      if (!src?.trim()) {
        setDisplaySrc(null);
        return;
      }
      if (src.startsWith("blob:")) {
        if (!cancelled) setDisplaySrc(src);
        return;
      }
      if (!isRestauranteDisplayableImageRef(src)) {
        setDisplaySrc(null);
        return;
      }
      const resolved = await resolveRestauranteMediaRefForDisplay(
        restauranteDraftMediaNamespace(draftListingId),
        src,
      );
      if (cancelled || !resolved) {
        if (!cancelled) setDisplaySrc(null);
        return;
      }
      if (resolved.startsWith("data:image/")) {
        try {
          const blob = await fetch(resolved).then((r) => r.blob());
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) setDisplaySrc(objectUrl);
        } catch {
          if (!cancelled) setDisplaySrc(resolved);
        }
        return;
      }
      if (!cancelled) setDisplaySrc(resolved);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src, draftListingId]);

  if (!displaySrc) {
    return (
      <div
        className={className}
        aria-hidden
        style={{ width, height }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- draft previews: data/IDB refs, not optimizable remote URLs
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      sizes={sizes}
      width={width}
      height={height}
      draggable={false}
    />
  );
}
