"use client";

import type { GroupedFeatures } from "../lib/restauranteFeaturesNormalization";

const SECTION_CARD =
  "rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)] overflow-hidden";
const SECTION_PADDING = "p-4 sm:p-5";
const SECTION_TITLE = "mb-3 text-lg font-bold tracking-tight text-[#1F1A17] md:text-xl";
const GROUP_BLOCK = "rounded-xl border border-[#D8C2A0]/50 bg-white/90 p-3 shadow-sm";
const FEATURE_CHIP =
  "inline-flex shrink-0 items-center gap-1 rounded-full border border-[#D8C2A0] bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-semibold text-[#1F1A17] sm:px-2.5 sm:py-1 sm:text-[11px]";
const CHIPS_CONTAINER = "flex flex-wrap gap-1.5";

interface RestauranteGroupedFeaturesSectionProps {
  features: GroupedFeatures;
  className?: string;
}

export function RestauranteGroupedFeaturesSection({
  features,
  className = "",
}: RestauranteGroupedFeaturesSectionProps) {
  const nonEmptyGroups = Object.entries(features).filter(([_, group]) => group.items.length > 0);

  if (nonEmptyGroups.length === 0) {
    return null;
  }

  const serviciosGroup = nonEmptyGroups.find(([key]) => key === "servicios");
  const compactGroups = nonEmptyGroups.filter(([key]) =>
    ["cocina_y_estilo", "ambiente_y_amenidades", "idiomas", "precio"].includes(key),
  );

  return (
    <section className={`${SECTION_CARD} ${className}`} aria-labelledby="features-heading">
      <div className={SECTION_PADDING}>
        <h2 id="features-heading" className={SECTION_TITLE}>
          Servicios y Características
        </h2>

        <div className="space-y-3">
          {serviciosGroup ? (
            <CompactGroupBlock group={serviciosGroup[1]} variant="wide" />
          ) : null}

          {compactGroups.length > 0 ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {compactGroups.map(([groupKey, group]) => (
                <CompactGroupBlock key={groupKey} group={group} variant="mini" />
              ))}
            </div>
          ) : null}

          {/* Mobile-only: any groups not in servicios/compact (fallback) */}
          <div className="space-y-2.5 md:hidden">
            {nonEmptyGroups
              .filter(
                ([key]) =>
                  key !== "servicios" &&
                  !["cocina_y_estilo", "ambiente_y_amenidades", "idiomas", "precio"].includes(key),
              )
              .map(([groupKey, group]) => (
                <CompactGroupBlock key={groupKey} group={group} variant="mini" />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getGroupIcon(title: string): string {
  switch (title) {
    case "Servicios":
      return "🍽️";
    case "Cocina y estilo":
      return "👨‍🍳";
    case "Ambiente y amenidades":
      return "✨";
    case "Idiomas":
      return "🗣️";
    case "Precio":
      return "💰";
    default:
      return "📍";
  }
}

function CompactGroupBlock({
  group,
  variant,
}: {
  group: GroupedFeatures[keyof GroupedFeatures];
  variant: "wide" | "mini";
}) {
  const cleanItems = group.items.map((item) => (item.startsWith("Otro: ") ? item.replace("Otro: ", "").trim() : item));

  return (
    <div className={GROUP_BLOCK}>
      <div className="flex items-start gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F6EBDD] text-sm" aria-hidden>
          {getGroupIcon(group.title)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-[#1F1A17] sm:text-sm">{group.title}</h3>
          {variant === "wide" && group.description ? (
            <p className="mt-0.5 line-clamp-1 text-[10px] text-[#5A5148] sm:text-xs">{group.description}</p>
          ) : null}
          <div className={`${CHIPS_CONTAINER} ${variant === "wide" ? "mt-2" : "mt-1.5"}`}>
            {cleanItems.map((item, index) => (
              <span key={index} className={FEATURE_CHIP}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
