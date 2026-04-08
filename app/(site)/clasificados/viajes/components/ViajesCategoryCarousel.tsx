"use client";

import Link from "next/link";
import { useRef } from "react";

import { VIAJES_CATEGORY_PILLS } from "../data/viajesLandingSampleData";

const BTN =
  "absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 text-lg font-bold text-[color:var(--lx-text)] shadow-md backdrop-blur-sm transition hover:bg-[color:var(--lx-nav-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] md:flex";

export function ViajesCategoryCarousel() {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollByDir = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <button type="button" className={`${BTN} left-0`} aria-label="Ver categorías anteriores" onClick={() => scrollByDir(-1)}>
        ‹
      </button>
      <button type="button" className={`${BTN} right-0`} aria-label="Ver categorías siguientes" onClick={() => scrollByDir(1)}>
        ›
      </button>

      <div
        ref={railRef}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-2 pl-1 pr-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] focus-visible:ring-offset-2 md:px-11 [&::-webkit-scrollbar]:hidden"
      >
        {VIAJES_CATEGORY_PILLS.map((pill) => (
          <Link
            key={pill.id}
            href={pill.href}
            className="inline-flex shrink-0 snap-start items-center gap-2 rounded-full border border-[color:var(--lx-gold-border)] bg-[rgba(212,188,106,0.18)] px-4 py-2.5 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[rgba(212,188,106,0.28)] hover:shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--lx-focus-ring)] md:text-[13px]"
          >
            <span className="text-base leading-none" aria-hidden>
              {pill.icon}
            </span>
            {pill.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
