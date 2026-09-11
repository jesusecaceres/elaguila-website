"use client";

import { useId, useMemo, useState } from "react";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import {
  buildServiciosPagosGroups,
  hasServiciosPagosBeneficiosSection,
  resolveServiciosPagosGroupIcon,
} from "../lib/serviciosPagosBeneficiosData";
import {
  resolveServiciosBenefitChipLeading,
  resolveServiciosPaymentChipLeading,
} from "../lib/serviciosPaymentChipVisual";
import { ServiciosPaymentChipMarker } from "./ServiciosPaymentChipMarker";
import {
  SVC_AMENITY_CHIP,
  SVC_AMENITY_GROUP_CARD,
  SVC_PAGOS_BENEFICIOS_GRID,
  SVC_SECTION_CARD,
  SVC_SECTION_PADDING,
  SVC_SECTION_TITLE,
} from "../lib/serviciosShellSectionTokens";

/**
 * Servicios Owner QA (⚠️66 / ⚠️67 / SVC-QA-22 / SVC-QA-23) — the section used to collapse at 14
 * highlight chips behind "Ver todos los destacados", hiding normal owner content. Everything the
 * preset catalog can produce (24) now shows directly; only genuinely high volume (custom lines on
 * top of a full preset selection, up to 48) keeps a collapse.
 */
const COLLAPSE_THRESHOLD = 25;
const INITIAL_VISIBLE = 24;

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

  // Hooks run unconditionally (the memo used to sit after the early returns below).
  const hasSection = hasServiciosPagosBeneficiosSection(profile, displayProfile);
  const groups = useMemo(
    () => (hasSection ? buildServiciosPagosGroups(profile, displayProfile, lang) : []),
    [hasSection, profile, displayProfile, lang],
  );
  const highlightsGroup = groups.find((g) => g.id === "highlights");
  const needsCollapse = (highlightsGroup?.items.length ?? 0) >= COLLAPSE_THRESHOLD;
  const visibleHighlights = useMemo(() => {
    if (!highlightsGroup) return [];
    if (!needsCollapse || expanded) return highlightsGroup.items;
    return highlightsGroup.items.slice(0, INITIAL_VISIBLE);
  }, [highlightsGroup, needsCollapse, expanded]);

  if (!hasSection || groups.length === 0) return null;

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
        <div className={SVC_PAGOS_BENEFICIOS_GRID}>
          {groups.map((g) => {
            const items = g.id === "highlights" ? visibleHighlights : g.items;
            if (items.length === 0) return null;
            const groupIcon = resolveServiciosPagosGroupIcon(g.id, g.icon);
            return (
              <div key={g.id} className={SVC_AMENITY_GROUP_CARD}>
                <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#1F1A17] sm:text-sm">
                  <span className="shrink-0 text-sm leading-none" aria-hidden>
                    {groupIcon}
                  </span>
                  <span className="min-w-0">{g.title}</span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item, ii) => {
                    const leading =
                      g.id === "highlights"
                        ? resolveServiciosBenefitChipLeading()
                        : resolveServiciosPaymentChipLeading(item.label, item.paymentMethodId);
                    return (
                      <span key={`${g.id}-${ii}`} className={SVC_AMENITY_CHIP} title={item.label}>
                        <ServiciosPaymentChipMarker leading={leading} />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </span>
                    );
                  })}
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
