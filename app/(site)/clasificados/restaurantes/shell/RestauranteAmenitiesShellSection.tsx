"use client";

import type { ShellAmenitiesSection } from "./restaurantDetailShellTypes";
import {
  emojiForRestauranteAmenityGroupTitle,
  lookupRestauranteAmenityLeading,
} from "../lib/restauranteAmenitiesCatalog";
import { RestaurantePublishChipMarker } from "../components/RestaurantePublishChipMarker";

const SECTION_CARD =
  "rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)] overflow-hidden";
const SECTION_PADDING = "p-4 sm:p-5";
const SECTION_TITLE = "mb-3 text-lg font-bold tracking-tight text-[#1F1A17] md:text-xl";
const AMENITY_CHIP =
  "inline-flex max-w-full items-center gap-1 rounded-full border border-[#D8C2A0]/90 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17] sm:px-2.5 sm:py-1 sm:text-[11px]";

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
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {section.groups.map((g, gi) => {
            const gTitle = lang === "en" ? g.titleEn : g.titleEs;
            return (
              <div
                key={`${g.titleEs}-${gi}`}
                className="rounded-xl border border-[#D8C2A0]/70 bg-white/90 p-3 shadow-sm"
              >
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#1F1A17] sm:text-sm">
                  <span aria-hidden>{emojiForRestauranteAmenityGroupTitle(gTitle)}</span>
                  {gTitle}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {g.items.map((it, ii) => {
                    const label = lang === "en" ? it.labelEn : it.labelEs;
                    const leading = lookupRestauranteAmenityLeading(it.labelEs, it.labelEn);
                    return (
                      <span key={`${label}-${ii}`} className={AMENITY_CHIP} title={label}>
                        {leading ? <RestaurantePublishChipMarker leading={leading} compact /> : null}
                        <span className="min-w-0 truncate">{label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
