"use client";

import Image from "next/image";
import { useCallback, useState } from "react";

/**
 * Hero/cover images — local SVG under `/public/tienda/visuals` or remote URLs; swaps to fallback on error.
 */
export function TiendaRemoteFillImage(props: {
  primarySrc: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
  /** Use for non-optimized remote hosts (e.g. Supabase public URLs). */
  unoptimized?: boolean;
}) {
  const { primarySrc, fallbackSrc, alt, className, sizes, priority, unoptimized } = props;
  const [src, setSrc] = useState(primarySrc);
  const svgLocal = src.endsWith(".svg") || primarySrc.endsWith(".svg");

  const onError = useCallback(() => {
    setSrc((current) => (current === fallbackSrc ? current : fallbackSrc));
  }, [fallbackSrc]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      onError={onError}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized ?? svgLocal}
    />
  );
}
