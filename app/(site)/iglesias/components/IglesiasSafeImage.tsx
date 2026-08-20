"use client";

import { useCallback, useState } from "react";

type Props = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** When true, failed/missing images collapse to a non-deceptive cream/gold surface. */
  fallbackLabel?: string;
};

export function IglesiasSafeImage({ src, alt, className, imgClassName, sizes, priority, fallbackLabel }: Props) {
  const [failed, setFailed] = useState(false);
  const show = Boolean(src) && !failed;

  const onError = useCallback(() => setFailed(true), []);

  return (
    <div className={`relative overflow-hidden bg-[#F3E8D4] ${className ?? ""}`}>
      {show ? (
        // Church-supplied URLs may be any https host; native img + error fallback is the truthful path.
         
        <img
          src={src as string}
          alt={alt}
          sizes={sizes}
          className={imgClassName ?? "absolute inset-0 h-full w-full object-cover"}
          onError={onError}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#F7F0E2_0%,#E8D7B5_55%,#D4C08A_100%)]" aria-hidden />
      )}
      {!show && fallbackLabel ? (
        <span className="sr-only">{fallbackLabel}</span>
      ) : null}
    </div>
  );
}
