"use client";

import Link from "next/link";
import { useRef } from "react";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { VIAJES_CATEGORY_PILLS } from "../data/viajesLandingSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";
import { setLangOnHref } from "../lib/viajesLangHref";

const BTN =
  "absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 text-lg font-bold text-[color:var(--lx-text)] shadow-md backdrop-blur-sm transition hover:bg-[color:var(--lx-nav-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] md:flex";

export function ViajesCategoryCarousel({ lang, ui }: { lang: Lang; ui: ViajesUi }) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollByDir = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button type="button" className={`${BTN} left-0`} aria-label={ui.carousel.prev} onClick={() => scrollByDir(-1)}>
        ‹
      </button>
      <button type="button" className={`${BTN} right-0`} aria-label={ui.carousel.next} onClick={() => scrollByDir(1)}>
        ›
      </button>

      <div
        ref={railRef}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth overscroll-x-contain pb-3 pl-3 pr-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-inline:12px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] focus-visible:ring-offset-2 md:px-11 [&::-webkit-scrollbar]:hidden"
      >
        {VIAJES_CATEGORY_PILLS.map((pill) => (
          <Link
            key={pill.id}
            href={setLangOnHref(pill.href, lang)}
            className="inline-flex min-h-[44px] shrink-0 snap-start items-center gap-2 rounded-full border border-[color:var(--lx-gold-border)] bg-[rgba(212,188,106,0.18)] px-4 py-2.5 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[rgba(212,188,106,0.28)] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] touch-manipulation md:text-[13px]"
          >
            <span className="text-base leading-none" aria-hidden>
              {pill.icon}
            </span>
            {ui.categoryPills[pill.id] ?? pill.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
