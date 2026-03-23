"use client";

import type { AutosAnuncioFactPair } from "../types/autosAnuncioLiveTypes";

export function AutosAnuncioMetaFactCards(props: { facts: AutosAnuncioFactPair[] }) {
  const slice = props.facts.slice(0, 4);
  if (slice.length === 0) return null;
  return (
    <>
      {slice.map((f) => (
        <div
          key={f.label}
          className="rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-5"
        >
          <div className="text-xs text-[#111111]">{f.label}</div>
          <div className="mt-1 text-[#111111] font-semibold">{f.value}</div>
        </div>
      ))}
    </>
  );
}
