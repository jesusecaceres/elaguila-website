"use client";

import { BiCylinder, BiGasPump, BiTachometer } from "react-icons/bi";
import { TbCar, TbRoad } from "react-icons/tb";
import type { ReactNode } from "react";


function iconForKey(key: string): ReactNode {
  switch (key) {
    case "trans":
      return <BiTachometer className="h-5 w-5" aria-hidden />;
    case "drive":
      return <TbRoad className="h-5 w-5" aria-hidden />;
    case "eng":
      return <BiCylinder className="h-5 w-5" aria-hidden />;
    case "fuel":
      return <BiGasPump className="h-5 w-5" aria-hidden />;
    case "mpg":
      return <BiGasPump className="h-5 w-5" aria-hidden />;
    case "body":
      return <TbCar className="h-5 w-5" aria-hidden />;
    default:
      return <TbCar className="h-5 w-5" aria-hidden />;
  }
}

/** Compact key-spec strip under gallery — transmisión / tracción / motor (real data only). */
export function PreviewVehicleHeroSpecsStrip({
  items,
}: {
  items: Array<{ key: string; label: string; value: string }>;
}) {
  if (items.length === 0) return null;

  return (
    <div className="mt-5 border-t border-[#D6C7AD]/55 pt-5" data-autos-hero-key-specs="1">
      <ul
        className={`grid gap-3 ${
          items.length === 1
            ? "grid-cols-1"
            : items.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : items.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-2 sm:grid-cols-4"
        }`}
      >
        {items.map((item) => (
          <li
            key={item.key}
            className="flex min-h-[4.25rem] items-center gap-3 rounded-[12px] border border-[#D6C7AD]/70 bg-[#FFFCF7] px-3.5 py-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#D6C7AD]/80 bg-[#FBF7EF] text-[#8A6B1F]">
              {iconForKey(item.key)}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">{item.label}</p>
              <p className="mt-0.5 truncate text-sm font-extrabold leading-tight text-[#1F241C]">{item.value}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
