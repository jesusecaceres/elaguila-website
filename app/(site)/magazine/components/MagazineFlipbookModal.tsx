"use client";

import { useEffect } from "react";

type MagazineFlipbookModalProps = {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  closeLabel: string;
};

export function MagazineFlipbookModal({
  open,
  onClose,
  src,
  title,
  closeLabel,
}: MagazineFlipbookModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90">
      <div className="absolute top-0 left-0 right-0 flex h-16 items-center justify-between border-b border-white/10 bg-black/40 px-4 backdrop-blur sm:px-6">
        <div className="truncate text-sm font-semibold text-gray-200 md:text-base">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full border border-[#C9A84A]/60 px-4 py-2 text-sm font-semibold text-[#C9A84A] transition hover:bg-[#C9A84A]/10"
        >
          {closeLabel}
        </button>
      </div>
      <div className="absolute bottom-0 left-0 right-0 top-16">
        <iframe
          src={src}
          title={title}
          className="h-full w-full border-0"
          scrolling="no"
          allow="fullscreen"
          allowFullScreen
        />
      </div>
    </div>
  );
}
