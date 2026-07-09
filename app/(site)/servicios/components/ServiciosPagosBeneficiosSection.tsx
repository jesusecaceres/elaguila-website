"use client";

import { useId, useMemo, useState } from "react";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import {
  buildServiciosPagosGroups,
  hasServiciosPagosBeneficiosSection,
} from "../lib/serviciosPagosBeneficiosData";
import {
  SVC_AMENITIES_GRID,
  SVC_AMENITY_CHIP,
  SVC_AMENITY_GROUP_CARD,
  SVC_SECTION_CARD,
  SVC_SECTION_PADDING,
  SVC_SECTION_TITLE,
} from "../lib/serviciosShellSectionTokens";

const COLLAPSE_THRESHOLD = 14;
const INITIAL_VISIBLE = 12;

export function ServiciosPagosBeneficiosSection({
  profile,
  displayProfile,
  lang,
}: {
  profile: ServiciosProfileResolved;
  displayProfile: ServiciosProfileResolved;
  lang: ServiciosLang;
}) {
  const L = getServiciosProfileLabels(lang);
  const headingId = useId();
  const [expanded, setExpanded] = useState(false);

  if (!hasServiciosPagosBeneficiosSection(profile, displayProfile)) return null;

  const groups = buildServiciosPagosGroups(profile, displayProfile, lang);
  if (groups.length === 0) return null;

  const highlightsGroup = groups.find((g) => g.id === "highlights");
  const needsCollapse = (highlightsGroup?.items.length ?? 0) >= COLLAPSE_THRESHOLD;
  const visibleHighlights = useMemo(() => {
    if (!highlightsGroup) return [];
    if (!needsCollapse || expanded) return highlightsGroup.items;
    return highlightsGroup.items.slice(0, INITIAL_VISIBLE);
  }, [highlightsGroup, needsCollapse, expanded]);

  const title = lang === "en" ? "Payments & benefits" : "Pagos y beneficios";

  return (
    <section
      className={SVC_SECTION_CARD}
      aria-labelledby={headingId}
      data-servicios-pagos-beneficios="1"
    >
      <div className={SVC_SECTION_PADDING}>
        <h2 id={headingId} className={SVC_SECTION_TITLE}>
          {title}
        </h2>
        <div className={SVC_AMENITIES_GRID}>
          {groups.map((g) => {
            const items = g.id === "highlights" ? visibleHighlights : g.items;
            if (items.length === 0) return null;
            return (
              <div key={g.id} className={SVC_AMENITY_GROUP_CARD}>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#1F1A17] sm:text-sm">
                  <span aria-hidden>{g.icon}</span>
                  {g.title}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, ii) => (
                    <span key={`${g.id}-${ii}`} className={SVC_AMENITY_CHIP} title={item}>
                      <span className="min-w-0 truncate">{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {needsCollapse && highlightsGroup ? (
          <button
            type="button"
            className="mt-3 w-full rounded-lg border border-[#D8C2A0]/80 bg-white/90 px-3 py-2 text-xs font-semibold text-[#1F1A17] shadow-sm transition hover:border-[#C9A84A]/60"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? L.highlightsShowLess : L.highlightsSeeAll}
          </button>
        ) : null}
      </div>
    </section>
  );
}
