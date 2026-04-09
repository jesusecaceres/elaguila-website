"use client";

import { useState } from "react";

/** Hides broken partner/draft logos instead of showing a broken icon. */
export function ViajesPartnerLogo({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary partner / draft URLs
    <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  );
}
