"use client";

import type { AutosNegociosBuyerPreviewViewModel } from "@/app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel";

export function VehicleHeroSpecsStrip({
  items,
}: {
  items: AutosNegociosBuyerPreviewViewModel["heroSpecItems"];
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex min-w-min gap-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="min-w-[5.5rem] shrink-0 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-center shadow-[0_2px_10px_rgba(42,36,22,0.04)]"
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]">{item.label}</p>
            <p className="mt-0.5 text-sm font-extrabold leading-tight text-[color:var(--lx-text)]">{item.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
