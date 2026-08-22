"use client";

import { useEffect, useState } from "react";

export type BusinessDashboardTab = {
  id: string;
  label: string;
};

/** Local hash navigation — page data stays server-rendered. */
export function BusinessDashboardNav({ tabs }: { tabs: readonly BusinessDashboardTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "overview");

  useEffect(() => {
    const applyHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash && tabs.some((tab) => tab.id === hash)) setActive(hash);
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [tabs]);

  return (
    <nav aria-label="Business dashboard sections" className="sticky top-0 z-20 -mx-1 border-b border-[#E8DFD0] bg-[#FAF6EE]/95 py-2 backdrop-blur">
      <ul className="flex gap-2 overflow-x-auto px-1 sm:flex-wrap sm:overflow-visible">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <li key={tab.id} className="shrink-0">
              <a
                href={`#${tab.id}`}
                className={
                  isActive
                    ? "inline-flex min-h-[44px] items-center rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-semibold text-white"
                    : "inline-flex min-h-[44px] items-center rounded-lg border border-[#D9C9A7] bg-[#FFFDF7] px-3 py-2 text-xs font-semibold text-[#1E1810]"
                }
              >
                {tab.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
