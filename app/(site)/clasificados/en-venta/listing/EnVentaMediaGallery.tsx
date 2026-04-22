"use client";

import { useCallback, useState } from "react";

export function EnVentaMediaGallery({ urls, title }: { urls: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const safe = urls.length ? urls : [];
  const current = safe[idx] ?? "";

  const go = useCallback(
    (d: number) => {
      if (!safe.length) return;
      setIdx((i) => (i + d + safe.length) % safe.length);
    },
    [safe.length]
  );

  if (!safe.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-black/10 bg-[#E8E8E8] text-[#111111]/35">
        📷
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-black/10 bg-[#111111]/5"
        onTouchStart={(e) => {
          (e.currentTarget as HTMLDivElement).dataset.x0 = String(e.touches[0]?.clientX ?? 0);
        }}
        onTouchEnd={(e) => {
          const x0 = Number((e.currentTarget as HTMLDivElement).dataset.x0 || 0);
          const x1 = e.changedTouches[0]?.clientX ?? 0;
          const dx = x1 - x0;
          if (dx > 50) go(-1);
          else if (dx < -50) go(1);
        }}
      >
        { }
        <img src={current} alt={title} className="h-full w-full object-contain bg-black/5" />
        {safe.length > 1 ? (
          <>
            <button
              type="button"
              aria-label="Previous"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm shadow"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-sm shadow"
            >
              ›
            </button>
          </>
        ) : null}
      </div>
      {safe.length > 1 ? (
        <div className="flex gap-1 overflow-x-auto pb-1">
          {safe.map((u, i) => (
            <button
              key={u + i}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border ${i === idx ? "border-yellow-500 ring-1 ring-yellow-400/40" : "border-black/10"}`}
            >
              { }
              <img src={u} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
