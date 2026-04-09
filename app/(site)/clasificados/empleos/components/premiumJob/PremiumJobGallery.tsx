"use client";

import Image from "next/image";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import type { PremiumGalleryImage } from "../../data/empleoPremiumJobSampleData";

type Props = {
  images: PremiumGalleryImage[];
};

export function PremiumJobGallery({ images }: Props) {
  const [idx, setIdx] = useState(0);
  const list = images.length > 0 ? images : [{ src: "", alt: "" }];
  const current = list[Math.min(idx, list.length - 1)];
  const showThumbs = list.length > 1;

  const go = (d: number) => {
    setIdx((i) => {
      const n = list.length;
      return (i + d + n) % n;
    });
  };

  if (!current.src) {
    return (
      <div className="overflow-hidden rounded-lg border border-black/[0.06] bg-neutral-200 shadow-[0_4px_24px_rgba(30,24,16,0.06)]">
        <div className="aspect-[16/10] w-full animate-pulse bg-neutral-300" aria-hidden />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-black/[0.06] bg-white shadow-[0_4px_24px_rgba(30,24,16,0.06)]">
      <div className="relative aspect-[16/10] w-full bg-neutral-200">
        <Image
          src={current.src}
          alt={current.alt}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
        {list.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[color:var(--lx-text)] shadow-md transition hover:bg-white"
              aria-label="Imagen anterior"
            >
              <FaChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[color:var(--lx-text)] shadow-md transition hover:bg-white"
              aria-label="Imagen siguiente"
            >
              <FaChevronRight className="h-4 w-4" />
            </button>
          </>
        ) : null}
      </div>
      {showThumbs ? (
        <div className="flex gap-2 overflow-x-auto p-3 sm:gap-3 sm:p-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {list.map((img, i) => (
            <button
              key={`${img.src}-${i}`}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 transition sm:h-16 sm:w-24 ${
                i === idx ? "border-[#2563EB] ring-1 ring-[#2563EB]/30" : "border-transparent opacity-90 hover:opacity-100"
              }`}
              aria-label={`Ver imagen ${i + 1}`}
            >
              <Image src={img.src} alt={img.alt} fill className="object-cover" sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
