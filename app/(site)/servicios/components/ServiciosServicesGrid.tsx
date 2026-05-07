"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { ServiciosLang, ServiciosProfileResolved, ServiciosServiceCard } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { resolveServiciosQuoteDestination } from "../lib/serviciosContactActions";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";
import { SV } from "./serviciosDesignTokens";

/** When count ≥ this, show expand/collapse (initially show {@link SERVICES_SECTION_INITIAL_VISIBLE}). */
const SERVICES_SECTION_COLLAPSE_THRESHOLD = 19;
const SERVICES_SECTION_INITIAL_VISIBLE = 18;

const getServiceType = (serviceName: string): "mobile" | "onsite" | "both" => {
  const name = serviceName.toLowerCase();
  const mobileKeywords = ["móvil", "mobile", "domicilio", "a domicilio", "delivery", "entrega"];
  const onsiteKeywords = ["taller", "local", "tienda", "oficina", "consultorio"];
  const hasMobile = mobileKeywords.some((keyword) => name.includes(keyword));
  const hasOnsite = onsiteKeywords.some((keyword) => name.includes(keyword));
  if (hasMobile && hasOnsite) return "both";
  if (hasMobile) return "mobile";
  return "onsite";
};

const getServiceTypeIcon = (serviceType: "mobile" | "onsite" | "both") => {
  switch (serviceType) {
    case "mobile":
      return "🚗";
    case "onsite":
      return "🏢";
    case "both":
      return "🚗🏢";
    default:
      return "📍";
  }
};

function gridClassForVisibleCount(n: number): string {
  if (n <= 6) {
    return "grid grid-cols-1 gap-3 sm:grid-cols-2";
  }
  return "grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3";
}

export type ServiciosOfferedSectionProps = {
  /** All services to render (presets + customs, already deduped upstream). */
  services: ServiciosServiceCard[];
  lang: ServiciosLang;
  /** Used only for quote destination resolution — does not read hero/contact UI. */
  profileForQuote: ServiciosProfileResolved;
};

/**
 * Standalone “Nuestros servicios” block: title, subtitle, responsive grid, optional expand for long lists.
 * Safe to relocate in the page layout without changing publish/mapping logic.
 */
export function ServiciosOfferedSection({ services, lang, profileForQuote }: ServiciosOfferedSectionProps) {
  const L = getServiciosProfileLabels(lang);
  const headingId = useId();
  const [expanded, setExpanded] = useState(false);

  const quoteDestination = useMemo(
    () => resolveServiciosQuoteDestination(profileForQuote, lang),
    [profileForQuote, lang],
  );

  const needsCollapse = services.length >= SERVICES_SECTION_COLLAPSE_THRESHOLD;
  const visible = useMemo(() => {
    if (!needsCollapse || expanded) return services;
    return services.slice(0, SERVICES_SECTION_INITIAL_VISIBLE);
  }, [services, needsCollapse, expanded]);

  const handleServiceQuoteClick = useCallback(
    (serviceName: string) => {
      if (!quoteDestination) return;
      let message =
        lang === "en"
          ? "Hi, I saw your profile on Leonix and would like to request a quote."
          : "Hola, vi tu perfil en Leonix y quiero pedir una cotización.";
      message += lang === "en" ? ` for ${serviceName}` : ` para ${serviceName}`;
      if (quoteDestination.kind === "whatsapp") {
        const encodedMessage = encodeURIComponent(message);
        window.open(`${quoteDestination.href}?text=${encodedMessage}`, "_blank", "noopener noreferrer");
      } else {
        window.open(quoteDestination.href, "_blank", "noopener noreferrer");
      }
    },
    [quoteDestination, lang],
  );

  if (!services.length) return null;

  const gridClass = gridClassForVisibleCount(visible.length);
  const interactive = Boolean(quoteDestination);

  return (
    <section
      className="rounded-2xl border p-4 shadow-sm sm:p-6 md:p-8"
      style={{ backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }}
      aria-labelledby={headingId}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl">
            {L.services}
          </h2>
          <p className="mt-1 max-w-prose text-sm leading-snug text-[color:var(--lx-muted)]">{L.servicesSectionSubtitle}</p>
        </div>
        {services.length > 6 ? (
          <p className="shrink-0 text-xs font-medium text-[color:var(--lx-muted)]">
            {lang === "en" ? `${services.length} services` : `${services.length} servicios`}
          </p>
        ) : null}
      </div>

      <div className={gridClass}>
        {visible.map((s) => {
          const serviceType = getServiceType(s.title);
          const { emoji } = resolveServiciosServiceVisual({ id: s.id, label: s.title });
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => interactive && handleServiceQuoteClick(s.title)}
              disabled={!interactive}
              className={`group flex min-h-[44px] min-w-0 touch-manipulation items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium shadow-sm transition ${
                interactive
                  ? "cursor-pointer hover:border-[#3B66AD]/40 hover:shadow-md"
                  : "cursor-default opacity-95"
              }`}
              style={{
                borderColor: SV.border,
                backgroundColor: SV.card,
                color: SV.text,
              }}
            >
              <span className="mt-0.5 shrink-0 text-[10px] leading-none text-[#3B66AD]/55" aria-hidden>
                {getServiceTypeIcon(serviceType)}
              </span>
              <span className="shrink-0 text-[0.95rem] leading-none" aria-hidden>
                {emoji}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{s.title}</span>
            </button>
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
          {L.showMoreServices}
        </button>
      ) : null}

      {needsCollapse && expanded ? (
        <button
          type="button"
          className="mt-5 w-full rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#3B66AD]/35"
          onClick={() => setExpanded(false)}
          aria-expanded
        >
          {L.showLessServices}
        </button>
      ) : null}
    </section>
  );
}

/** @deprecated Prefer {@link ServiciosOfferedSection} when wiring layout; kept for existing call sites. */
export function ServiciosServicesGrid({ profile, lang }: { profile: ServiciosProfileResolved; lang: ServiciosLang }) {
  return <ServiciosOfferedSection services={profile.services} lang={lang} profileForQuote={profile} />;
}
