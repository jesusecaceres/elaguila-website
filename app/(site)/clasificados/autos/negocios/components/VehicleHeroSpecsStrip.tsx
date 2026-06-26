"use client";

import type { AutosNegociosBuyerPreviewViewModel } from "@/app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel";
import { autosPreviewRectSpecTileClass } from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

export function VehicleHeroSpecsStrip({
  items,
}: {
  items: AutosNegociosBuyerPreviewViewModel["heroSpecItems"];
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-5 border-t border-[#D6C7AD]/55 pt-5">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8">
        {items.map((item) => (
          <li key={item.key} className={autosPreviewRectSpecTileClass}>
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">{item.label}</p>
            <p className="mt-1 text-sm font-extrabold leading-tight text-[#1F241C]">{item.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
