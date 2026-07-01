"use client";

import { FiMapPin } from "react-icons/fi";

/** Decorative Leonix map card — opens real maps via parent CTA. */
export function CommunityLeonixMapVisual({ label }: { label?: string }) {
  return (
    <div
      className="relative mt-3 overflow-hidden rounded-xl border border-[#C9B46A]/40 bg-gradient-to-br from-[#E8F3EA] via-[#F5F0E6] to-[#EDE4D4] shadow-inner"
      aria-hidden={!label}
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <div className="aspect-[16/9] min-h-[120px] w-full sm:aspect-[2/1]" />
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <svg className="h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="none">
          <path d="M0 120 Q80 80 160 100 T320 90 L400 110 L400 200 L0 200 Z" fill="#C9A84A" fillOpacity="0.15" />
          <path d="M0 160 Q120 130 240 150 T400 140 L400 200 L0 200 Z" fill="#1B4332" fillOpacity="0.08" />
        </svg>
      </div>
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FFFCF7] bg-[#7A1E2C] shadow-lg">
          <FiMapPin className="h-5 w-5 text-[#FFFCF7]" aria-hidden />
        </div>
        <div className="mt-1 h-2 w-2 rotate-45 bg-[#7A1E2C]/80" aria-hidden />
      </div>
    </div>
  );
}
