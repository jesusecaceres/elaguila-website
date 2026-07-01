"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  title: string;
};

type LayoutMode = "flyer" | "photo";

function detectLayoutMode(naturalWidth: number, naturalHeight: number): LayoutMode {
  if (!naturalWidth || !naturalHeight) return "photo";
  const ratio = naturalWidth / naturalHeight;
  if (ratio < 0.85 || naturalHeight > naturalWidth * 1.15) return "flyer";
  return "photo";
}

export function QuickJobHeroMedia({ src, alt, title }: Props) {
  const [layout, setLayout] = useState<LayoutMode>("photo");

  useEffect(() => {
    if (!src) return;
    const img = new window.Image();
    img.onload = () => setLayout(detectLayoutMode(img.naturalWidth, img.naturalHeight));
    img.src = src;
  }, [src]);

  if (layout === "flyer") {
    return (
      <div className="overflow-hidden rounded-xl border border-[#D6C7AD]/85 bg-[#F3EDE0] shadow-[0_16px_44px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10">
        <div className="relative flex min-h-[200px] w-full items-center justify-center px-4 py-6 sm:min-h-[280px] sm:px-8 sm:py-8">
          <div className="relative h-auto w-full max-w-md">
            <Image
              src={src}
              alt={alt || title}
              width={480}
              height={640}
              className="mx-auto h-auto w-full max-h-[min(70vh,520px)] object-contain"
              sizes="(max-width: 1024px) 100vw, 480px"
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#D6C7AD]/85 bg-[#EDE8E0] shadow-[0_16px_44px_-18px_rgba(31,36,28,0.2)] ring-1 ring-[#C9A84A]/10">
      <div className="relative aspect-[16/9] max-h-[340px] w-full sm:aspect-[16/8]">
        <Image
          src={src}
          alt={alt || title}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 100vw, 58vw"
          priority
        />
      </div>
    </div>
  );
}
