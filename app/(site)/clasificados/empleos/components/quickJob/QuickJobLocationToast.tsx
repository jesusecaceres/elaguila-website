"use client";

import { useCallback, useEffect } from "react";
import type { QuickJobLocationBlock } from "../../data/empleoQuickJobSampleData";

type Props = {
  open: boolean;
  onClose: () => void;
  location: QuickJobLocationBlock;
  title: string;
  hint: string;
  mapsLabel: string;
  closeLabel: string;
};

export function QuickJobLocationToast({
  open,
  onClose,
  location,
  title,
  hint,
  mapsLabel,
  closeLabel,
}: Props) {
  const fullLine = `${location.city}, ${location.state} ${location.zip}`.trim();

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onKey]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label={title}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-job-location-dialog-title"
        className="relative z-[101] m-4 w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_24px_64px_rgba(30,24,16,0.18)]"
      >
        <h3 id="quick-job-location-dialog-title" className="text-lg font-bold text-[color:var(--lx-text)]">
          {title}
        </h3>
        <div className="mt-4 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
          <p className="font-semibold text-[color:var(--lx-text)]">{location.businessLine}</p>
          <p className="mt-1">{location.addressLine1}</p>
          <p className="mt-0.5">{fullLine}</p>
        </div>
        <p className="mt-4 text-xs text-[color:var(--lx-muted)]">{hint}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-lg border border-black/[0.1] px-4 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-neutral-50"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            className="min-h-11 rounded-lg bg-[#2563EB] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1D4ED8]"
          >
            {mapsLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
