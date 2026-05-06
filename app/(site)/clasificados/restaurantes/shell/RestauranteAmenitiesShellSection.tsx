"use client";

import { FiCheck } from "react-icons/fi";
import type { ShellAmenitiesSection } from "./restaurantDetailShellTypes";

const SECTION_CARD =
  "rounded-3xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_8px_32px_-8px_rgba(212,165,116,0.15)] overflow-hidden";
const SECTION_PADDING = "p-6 sm:p-8";
const SECTION_TITLE = "text-2xl font-bold text-[#1F1A17] mb-6 tracking-tight";

export function RestauranteAmenitiesShellSection({
  section,
  lang = "es",
}: {
  section: ShellAmenitiesSection;
  lang?: "es" | "en";
}) {
  if (!section.groups.length) return null;
  const title = lang === "en" ? section.titleEn : section.titleEs;

  return (
    <section className={SECTION_CARD} aria-labelledby="restaurante-amenities-heading">
      <div className={SECTION_PADDING}>
        <h2 id="restaurante-amenities-heading" className={SECTION_TITLE}>
          {title}
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {section.groups.map((g, gi) => {
            const gTitle = lang === "en" ? g.titleEn : g.titleEs;
            return (
              <div
                key={`${g.titleEs}-${gi}`}
                className="rounded-2xl border border-[#D8C2A0]/80 bg-white/90 p-4 shadow-sm sm:p-5"
              >
                <h3 className="mb-3 text-base font-semibold text-[#1F1A17]">{gTitle}</h3>
                <ul className="space-y-2">
                  {g.items.map((it, ii) => {
                    const label = lang === "en" ? it.labelEn : it.labelEs;
                    return (
                      <li key={`${label}-${ii}`} className="flex items-start gap-2 text-sm text-[#5A5148]">
                        <FiCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
