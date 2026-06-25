"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { adminCardBase, adminResponsiveTabsOuter, adminResponsiveTabsScroll } from "./adminTheme";

export type AdminCommandCenterSection = {
  id: string;
  label: string;
  content: ReactNode;
};

export function AdminCommandCenterClient({ sections }: { sections: AdminCommandCenterSection[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "today");

  const scrollToSection = useCallback((id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-w-0 space-y-5 md:space-y-6" data-testid="admin-command-center">
      <div className={`${adminCardBase} border-[#C9B46A]/35 bg-[#FFFCF7]/90 p-3`} data-testid="admin-dashboard-section-nav">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Command sections</p>
        <div className={adminResponsiveTabsOuter}>
          <div className={adminResponsiveTabsScroll} role="tablist" aria-label="Command center sections">
            {sections.map((section) => {
              const active = section.id === activeId;
              return (
                <button
                  key={section.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={
                    active
                      ? "shrink-0 rounded-lg border border-[#7A1E2C] bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white"
                      : "shrink-0 rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-bold text-[#3D3428]"
                  }
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-6 md:space-y-7">
        {sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            role="tabpanel"
            aria-labelledby={`admin-cmd-tab-${section.id}`}
            className="min-w-0 scroll-mt-28"
            data-testid={`admin-dashboard-section-${section.id}`}
          >
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}
