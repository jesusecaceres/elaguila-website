"use client";

import { useCallback, useId, useMemo, useState } from "react";
import type { ServiciosLang, ServiciosProfileResolved, ServiciosServiceCard } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { resolveServiciosQuoteDestination } from "../lib/serviciosContactActions";
import { resolveServiciosServiceVisual } from "@/app/(site)/clasificados/servicios/lib/serviciosServiceVisualCatalog";
import { SV } from "./serviciosDesignTokens";
import { LX_SECTION_CARD, LX_SECTION_HEADING } from "./serviciosLeonixBrand";
import { buildServiciosGetQuoteIntent, trackServiciosListingCta } from "../lib/serviciosCtaIntents";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";

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

/** Móvil: riel horizontal; desde md: rejilla como antes. */
function servicesListClass(visibleCount: number): string {
  const mdGrid =
    visibleCount <= 6
      ? "md:grid md:grid-cols-2 md:gap-3 lg:grid-cols-3"
      : "md:grid md:grid-cols-2 md:gap-2.5 lg:grid-cols-3 lg:gap-2.5";
  return `-mx-1 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:snap-none ${mdGrid}`;
}

export type ServiciosOfferedSectionProps = {
  /** All services to render (presets + customs, already deduped upstream). */
  services: ServiciosServiceCard[];
  lang: ServiciosLang;
  /** Used only for quote destination resolution — does not read hero/contact UI. */
  profileForQuote: ServiciosProfileResolved;
  listingSlug?: string;
  listingSourceId?: string | null;
  listingShareUrl?: string;
  /** Leonix professional templates — editorial section title (Gate 18). */
  premiumLeonixTone?: boolean;
};

/**
 * Standalone “Nuestros servicios” block: title, subtitle, responsive grid, optional expand for long lists.
 * Safe to relocate in the page layout without changing publish/mapping logic.
 */
export function ServiciosOfferedSection({
  services,
  lang,
  profileForQuote,
  listingSlug,
  listingSourceId = null,
  listingShareUrl,
  premiumLeonixTone = false,
}: ServiciosOfferedSectionProps) {
  const L = getServiciosProfileLabels(lang);
  const headingId = useId();
  const [expanded, setExpanded] = useState(false);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  const closeCta = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

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
      const base =
        lang === "en"
          ? "Hi, I saw your profile on Leonix and would like to request a quote."
          : "Hola, vi tu perfil en Leonix y quiero pedir una cotización.";
      const message = `${base}${lang === "en" ? ` for ${serviceName}` : ` para ${serviceName}`}`;
      const intent = buildServiciosGetQuoteIntent(profileForQuote, lang, {
        listingSlug,
        listingShareUrl,
        quoteMessage: message,
      });
      if (!intent) return;
      trackServiciosListingCta(listingSlug, "cta_quote_sms_click", {
        sourceId: listingSourceId,
        source: "services_grid",
        href: "sheet",
      });
      setCtaIntent(intent);
      setCtaOpen(true);
    },
    [quoteDestination, lang, profileForQuote, listingSlug, listingShareUrl],
  );

  if (!services.length) return null;

  const listClass = servicesListClass(visible.length);
  const interactive = Boolean(quoteDestination);

  return (
    <section
      className={premiumLeonixTone ? `${LX_SECTION_CARD} p-4 sm:p-6 md:p-8` : "rounded-2xl border p-3 shadow-sm sm:p-6 md:p-8"}
      style={
        premiumLeonixTone
          ? undefined
          : { backgroundColor: SV.card, borderColor: SV.border, boxShadow: SV.shadowSm }
      }
      aria-labelledby={headingId}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            id={headingId}
            className={
              premiumLeonixTone
                ? LX_SECTION_HEADING
                : "text-lg font-bold tracking-tight text-[color:var(--lx-text)] md:text-xl"
            }
          >
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

      <div className={listClass}>
        {visible.map((s) => {
          const serviceType = getServiceType(s.title);
          const { emoji } = resolveServiciosServiceVisual({ id: s.id, label: s.title });
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => interactive && handleServiceQuoteClick(s.title)}
              disabled={!interactive}
              className={`group flex min-h-[44px] min-w-[min(17.5rem,88vw)] shrink-0 snap-start touch-manipulation items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium shadow-sm transition md:min-w-0 ${
                interactive
                  ? "cursor-pointer hover:border-[#C9A84A]/55 hover:shadow-md"
                  : "cursor-default opacity-95"
              }`}
              style={{
                borderColor: SV.border,
                backgroundColor: SV.card,
                color: SV.text,
              }}
            >
              <span className="mt-0.5 shrink-0 text-[10px] leading-none text-[#C9A84A]/70" aria-hidden>
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
          className="mt-5 w-full rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#C9A84A]/45"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
        >
          {L.showMoreServices}
        </button>
      ) : null}

      {needsCollapse && expanded ? (
        <button
          type="button"
          className="mt-5 w-full rounded-xl border border-black/[0.08] bg-white py-3 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#C9A84A]/45"
          onClick={() => setExpanded(false)}
          aria-expanded
        >
          {L.showLessServices}
        </button>
      ) : null}

      <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </section>
  );
}

/** @deprecated Prefer {@link ServiciosOfferedSection} when wiring layout; kept for existing call sites. */
export function ServiciosServicesGrid({
  profile,
  lang,
  listingSlug,
  listingShareUrl,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  listingSlug?: string;
  listingShareUrl?: string;
}) {
  return (
    <ServiciosOfferedSection
      services={profile.services}
      lang={lang}
      profileForQuote={profile}
      listingSlug={listingSlug}
      listingShareUrl={listingShareUrl}
    />
  );
}
