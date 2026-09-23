"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { VIAJES_EDITORIAL_IMAGE_FALLBACK } from "../lib/viajesOfferHeroFallbacks";

type ViajesSafeImageMode = "editorial" | "inventory";

/**
 * Viajes-local image resilience:
 * editorial: preferred → approved Viajes editorial fallback → clean gradient
 * inventory: real saved URL → clean neutral gradient (no fake customer photo)
 */
export function ViajesSafeImage({
  src,
  alt,
  className,
  sizes,
  mode = "editorial",
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  mode?: ViajesSafeImageMode;
  priority?: boolean;
}) {
  const chain = useMemo(() => {
    const out: string[] = [];
    const push = (u?: string | null) => {
      const t = String(u ?? "").trim();
      if (t && !out.includes(t)) out.push(t);
    };
    push(src);
    if (mode === "editorial") push(VIAJES_EDITORIAL_IMAGE_FALLBACK);
    return out;
  }, [src, mode]);

  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(chain.length === 0);

  useEffect(() => {
    setIndex(0);
    setExhausted(chain.length === 0);
  }, [chain.join("|")]);

  const onError = useCallback(() => {
    setIndex((i) => {
      const next = i + 1;
      if (next >= chain.length) setExhausted(true);
      return next;
    });
  }, [chain.length]);

  const active = !exhausted ? chain[index] : "";
  const imgClass = className ?? "absolute inset-0 h-full w-full object-cover";

  if (!active) {
    return <div className="absolute inset-0 bg-gradient-to-br from-[#1b3344] via-[#2c4a3e] to-[#1a2422]" aria-hidden />;
  }

  return (
    <img
      src={active}
      alt={alt}
      className={imgClass}
      sizes={sizes}
      onError={onError}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
    />
  );
}
