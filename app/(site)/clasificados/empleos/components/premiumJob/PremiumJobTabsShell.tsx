"use client";

import { useState } from "react";

const TAB_KEYS = ["desc", "req", "offer", "company"] as const;

type Props = {
  labels: readonly [string, string, string, string];
};

export function PremiumJobTabsShell({ labels }: Props) {
  const [active, setActive] = useState(0);

  return (
    <div className="border-b border-black/[0.08] bg-white/80">
      <div
        className="flex gap-1 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
        role="tablist"
        aria-label="Secciones del puesto"
      >
        {labels.map((label, i) => (
          <button
            key={TAB_KEYS[i]}
            type="button"
            role="tab"
            aria-selected={active === i}
            onClick={() => setActive(i)}
            className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition sm:px-4 ${
              active === i
                ? "border-[#2563EB] text-[color:var(--lx-text)]"
                : "border-transparent text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text-2)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
