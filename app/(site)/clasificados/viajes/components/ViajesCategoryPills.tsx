import Link from "next/link";

import { VIAJES_CATEGORY_PILLS } from "../data/viajesLandingSampleData";

export function ViajesCategoryPills() {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {VIAJES_CATEGORY_PILLS.map((pill) => (
        <Link
          key={pill.id}
          href={pill.href}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[color:var(--lx-gold-border)] bg-[rgba(212,188,106,0.18)] px-4 py-2.5 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:bg-[rgba(212,188,106,0.28)] hover:shadow md:text-[13px]"
        >
          <span className="text-base leading-none" aria-hidden>
            {pill.icon}
          </span>
          {pill.label}
        </Link>
      ))}
    </div>
  );
}
