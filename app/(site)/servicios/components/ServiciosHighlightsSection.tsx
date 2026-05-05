"use client";

import { useId, useMemo, useState } from "react";
import type { ServiciosBusinessHighlightItem, ServiciosLang } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { resolveServiciosBusinessHighlightVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosBusinessHighlightVisual";
import { SV } from "./serviciosDesignTokens";

const HIGHLIGHTS_SECTION_COLLAPSE_THRESHOLD = 19;
const HIGHLIGHTS_SECTION_INITIAL_VISIBLE = 18;

function gridClassForVisibleCount(n: number): string {
  if (n <= 6) {
    return "grid grid-cols-1 gap-3 sm:grid-cols-2";
  }
  return "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3";
}

export type ServiciosHighlightsSectionProps = {
  highlights: ServiciosBusinessHighlightItem[];
  lang: ServiciosLang;
};

/**
 * Standalone “Highlights del negocio” block — props-driven, safe to relocate in the layout.
 */
export function ServiciosHighlightsSection({ highlights, lang }: ServiciosHighlightsSectionProps) {
  const L = getServiciosProfileLabels(lang);
  const headingId = useId();
  const [expanded, setExpanded] = useState(false);

  const needsCollapse = highlights.length >= HIGHLIGHTS_SECTION_COLLAPSE_THRESHOLD;
  const visible = useMemo(() => {
    if (!needsCollapse || expanded) return highlights;
    return highlights.slice(0, HIGHLIGHTS_SECTION_INITIAL_VISIBLE);
  }, [highlights, needsCollapse, expanded]);

  if (!highlights.length) return null;

  const gridClass = gridClassForVisibleCount(visible.length);

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      aria-labelledby={headingId}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">
            {L.highlightsTitle}
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-snug text-[color:var(--lx-muted)]">{L.highlightsSubtitle}</p>
        </div>
        {highlights.length > 6 ? (
          <p className="shrink-0 text-xs font-medium text-[color:var(--lx-muted)]">
            {lang === "en" ? `${highlights.length} highlights` : `${highlights.length} destacados`}
          </p>
        ) : null}
      </div>

      <div className={gridClass}>
        {visible.map((h) => {
          const { emoji } = resolveServiciosBusinessHighlightVisual({ id: h.id, label: h.label });
          return (
            <div
              key={h.id}
              className="flex min-h-[44px] min-w-0 items-start gap-2 rounded-xl border px-3 py-2.5 shadow-sm"
              style={{
                borderColor: SV.warmBorder,
                backgroundColor: SV.beige,
                color: SV.text,
              }}
            >
              <span className="shrink-0 text-[0.95rem] leading-none" aria-hidden>
                {emoji}
              </span>
              <span className="min-w-0 flex-1 text-sm font-medium leading-snug">{h.label}</span>
            </div>
          );
        })}
      </div>

      {needsCollapse && !expanded ? (
        <button
          type="button"
          className="mt-5 w-full rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/35"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          {L.highlightsSeeAll}
        </button>
      ) : null}

      {needsCollapse && expanded ? (
        <button
          type="button"
          className="mt-5 w-full rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/35"
          onClick={() => setExpanded(false)}
          aria-expanded
        >
          {L.highlightsShowLess}
        </button>
      ) : null}
    </section>
  );
}
