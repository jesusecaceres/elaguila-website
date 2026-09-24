"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Cover artwork for the Revista hub. Local covers (`/magazine/...`) go through next/image; a cover URL
 * from the issue registry (storage/CDN host) renders as a plain <img> so an unconfigured image host can
 * never crash the page. If the file is missing the cover degrades to a typographic card — a broken image
 * icon is never shown, and no other issue's artwork is substituted.
 *
 * A server-rendered <img> can fail before React attaches `onError`, so a mount-time check covers that case.
 */
export function MagazineCover({
  src,
  alt,
  label,
  priority,
  sizes,
  className,
}: {
  src: string;
  alt: string;
  /** Shown when the image is unavailable, e.g. "Junio 2026". */
  label: string;
  priority?: boolean;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement | null>(null);
  const frame = "aspect-[550/713] w-full";

  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (!src || failed) {
    return (
      <div className={`${frame} flex items-center justify-center bg-[#F3EBDC] p-4 text-center ${className ?? ""}`} role="img" aria-label={alt}>
        <span className="font-serif text-lg font-bold leading-snug text-[#2A4536]">{label}</span>
      </div>
    );
  }

  if (src.startsWith("/")) {
    return (
      <Image
        ref={ref}
        src={src}
        alt={alt}
        width={550}
        height={713}
        priority={priority}
        sizes={sizes}
        onError={() => setFailed(true)}
        className={`${frame} object-contain ${className ?? ""}`}
      />
    );
  }

  return (
    <img ref={ref} src={src} alt={alt} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} className={`${frame} object-contain ${className ?? ""}`} />
  );
}
