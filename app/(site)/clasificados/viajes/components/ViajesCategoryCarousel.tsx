"use client";

import Link from "next/link";
import { useRef } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { VIAJES_CATEGORY_PILLS } from "../data/viajesLandingSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";
import { setLangOnHref } from "../lib/viajesLangHref";

/** Scroll arrows only on lg+; inset keeps arrows off pill labels */
const BTN =
  "absolute top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 text-base font-bold text-[color:var(--lx-text)] shadow-md backdrop-blur-sm transition hover:bg-[color:var(--lx-nav-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] lg:flex";

export function ViajesCategoryCarousel({ lang, ui, className = "" }: { lang: Lang; ui: ViajesUi; className?: string }) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollByDir = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  return (
    <div className={`relative min-w-0 ${className}`.trim()}>
      <button type="button" className={`${BTN} left-1`} aria-label={ui.carousel.prev} onClick={() => scrollByDir(-1)}>
        ‹
      </button>
      <button type="button" className={`${BTN} right-1`} aria-label={ui.carousel.next} onClick={() => scrollByDir(1)}>
        ›
      </button>

      <div
        ref={railRef}
        tabIndex={0}
        className="touch-pan-x flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 pl-1 pr-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:14px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] focus-visible:ring-offset-2 sm:[scroll-padding-inline:16px] lg:px-12 lg:[scroll-padding-inline:48px] [&::-webkit-scrollbar]:hidden"
      >
        {VIAJES_CATEGORY_PILLS.map((pill) => (
          <Link
            key={pill.id}
            href={setLangOnHref(pill.href, lang)}
            className="inline-flex max-w-[min(100%,20rem)] min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-full border border-[color:var(--lx-gold-border)] bg-[rgba(255,253,247,0.95)] px-3 py-2.5 text-left text-[11px] font-semibold leading-snug text-[color:var(--lx-text)] shadow-[0_4px_14px_-6px_rgba(30,24,16,0.2)] transition hover:-translate-y-0.5 hover:border-[color:var(--lx-gold)]/50 hover:bg-[#fffefb] hover:shadow-[0_8px_22px_-8px_rgba(30,50,70,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] touch-manipulation sm:px-4 sm:text-xs md:text-[13px]"
          >
            <span className="shrink-0 text-base leading-none" aria-hidden>
              {pill.icon}
            </span>
            <span className="min-w-0 break-words">{ui.categoryPills[pill.id] ?? pill.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
