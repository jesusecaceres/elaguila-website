"use client";

import { useState } from "react";

/** Hides broken partner/draft logos instead of showing a broken icon. */
export function ViajesPartnerLogo({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
     
    <img src={src} alt="" className={className} onError={() => setFailed(true)} />
  );
}
