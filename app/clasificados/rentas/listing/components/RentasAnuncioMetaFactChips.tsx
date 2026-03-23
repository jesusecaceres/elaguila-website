"use client";

import type { RentasAnuncioFactPair } from "../types/rentasAnuncioLiveTypes";

export function RentasAnuncioMetaFactChips(props: { facts: RentasAnuncioFactPair[] }) {
  const { facts } = props;
  if (facts.length === 0) return null;
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {facts.map((f) => (
        <span
          key={f.label}
          className="rounded-full border border-black/10 bg-[#F5F5F5] px-3 py-1.5 text-xs font-medium text-[#111111]"
        >
          {f.label}: {f.value}
        </span>
      ))}
    </div>
  );
}
