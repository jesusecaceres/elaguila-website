"use client";

import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { buildServiciosHowGroups, hasServiciosGroupedHowSection } from "../lib/serviciosGroupedHowData";
import {
  SVC_CHIPS_CONTAINER,
  SVC_FEATURE_CHIP,
  SVC_FEATURES_COMPACT_GRID,
  SVC_GROUP_BLOCK,
  SVC_SECTION_CARD,
  SVC_SECTION_PADDING,
  SVC_SECTION_TITLE,
} from "../lib/serviciosShellSectionTokens";

function CompactGroupBlock({
  title,
  icon,
  items,
  variant,
}: {
  title: string;
  icon: string;
  items: string[];
  variant: "wide" | "mini";
}) {
  return (
    <div className={SVC_GROUP_BLOCK}>
      <div className="flex items-start gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F6EBDD] text-sm" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-[#1F1A17] sm:text-sm">{title}</h3>
          <div className={`${SVC_CHIPS_CONTAINER} ${variant === "wide" ? "mt-2" : "mt-1.5"}`}>
            {items.map((item, index) => (
              <span key={`${item}-${index}`} className={SVC_FEATURE_CHIP}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiciosGroupedHowSection({
  profile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  if (!hasServiciosGroupedHowSection(profile)) return null;

  const groups = buildServiciosHowGroups(profile, lang);
  if (groups.length === 0) return null;

  const wideGroup = groups.find((g) => g.id === "service");
  const compactGroups = groups.filter((g) => g.id !== "service");

  const title = lang === "en" ? "How this business works" : "Cómo trabaja este negocio";

  return (
    <section className={SVC_SECTION_CARD} aria-labelledby="servicios-how-heading" data-servicios-grouped-how="1">
      <div className={SVC_SECTION_PADDING}>
        <h2 id="servicios-how-heading" className={SVC_SECTION_TITLE}>
          {title}
        </h2>
        <div className="space-y-3">
          {wideGroup ? (
            <CompactGroupBlock title={wideGroup.title} icon={wideGroup.icon} items={wideGroup.items} variant="wide" />
          ) : null}
          {compactGroups.length > 0 ? (
            <div className={SVC_FEATURES_COMPACT_GRID}>
              {compactGroups.map((g) => (
                <CompactGroupBlock key={g.id} title={g.title} icon={g.icon} items={g.items} variant="mini" />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
