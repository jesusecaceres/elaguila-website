"use client";

import { useEffect } from "react";

type ServiciosPromoImageLightboxProps = {
  src: string | null;
  onClose: () => void;
  closeLabel: string;
  /** Accessible name for the dialog surface (distinct from the close control). */
  dialogLabel: string;
};

/**
 * Minimal in-page lightbox for Servicios promotion images (no new tab).
 */
export function ServiciosPromoImageLightbox({ src, onClose, closeLabel, dialogLabel }: ServiciosPromoImageLightboxProps) {
  useEffect(() => {
    if (!src) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-5" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/78 backdrop-blur-[2px]"
        aria-label={closeLabel}
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[min(92dvh,900px)] w-full max-w-[min(96vw,1100px)] flex-col overflow-hidden rounded-2xl border border-[#E8DCC8]/25 bg-[#1c1814] shadow-2xl ring-1 ring-black/20"
        role="dialog"
        aria-modal="true"
        aria-label={dialogLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-end border-b border-white/10 px-2 py-2 sm:px-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-white/12 px-4 text-sm font-semibold text-[#FFFAF0] transition hover:bg-white/20"
          >
            {closeLabel}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2 sm:p-4">
          {/* Promotion assets may be https or draft data: URLs — use native img for broad compatibility */}
          <img
            src={src}
            alt=""
            className="mx-auto block max-h-[min(82dvh,780px)] w-auto max-w-full object-contain"
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
