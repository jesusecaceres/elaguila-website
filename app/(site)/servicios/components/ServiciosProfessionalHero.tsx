"use client";

import { useEffect, useState } from "react";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { serviciosAnalyticsTrackMeta, trackServiciosListingCta } from "../lib/serviciosCtaIntents";
import {
  fetchLeonixEndorsementSummary,
  type LeonixEndorsementSummaryEntry,
} from "@/app/lib/leonixCommunityTrust/leonixEndorsementClient";
import { serviciosOpenGoogleMapsDirections } from "../lib/serviciosDirectCta";
import { resolveServiciosProfileDirectWhatsAppHref } from "../lib/serviciosWhatsAppHref";
import {
  LX,
  LX_CTA_MAP,
  LX_CTA_PRIMARY,
  LX_CTA_PRIMARY_LG,
  LX_CTA_WHATSAPP,
  LX_HERO_BG,
  LX_HERO_BG_STYLE,
  LX_HERO_TITLE,
  getPrimaryCtaLabel,
  hasPhysicalAddress,
} from "./serviciosLeonixBrand";
import { ServiciosAdaptiveLogoPlate } from "./ServiciosAdaptiveLogoPlate";
import { ServiciosLanguageChipRow } from "./ServiciosLanguageChipRow";

function StarRow({ rating, lang }: { rating: number; lang: ServiciosLang }) {
  const aria =
    lang === "en" ? `${rating.toFixed(1)} out of 5 stars` : `${rating.toFixed(1)} de 5 estrellas`;
  return (
    <div className="flex items-center gap-1" role="img" aria-label={aria}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-3.5 w-[0.9em] text-[12px] leading-none">
            <span className="absolute text-white/25" aria-hidden>
              ★
            </span>
            <span className="absolute overflow-hidden text-[#C9A84A]" style={{ width: `${pct}%` }} aria-hidden>
              ★
            </span>
          </span>
        );
      })}
      <span className="ml-0.5 text-xs font-bold text-[#FFFCF7]">{rating.toFixed(1)}</span>
    </div>
  );
}

/**
 * Servicios Golden UI Closeout (2026-09-16) — compact Community Trust surfacing in the header,
 * per owner UI decision: the full Community on Leonix section (unchanged, still lower on the
 * page) is valuable but was too buried. Reuses the exact same `fetchLeonixEndorsementSummary`
 * source the full section already uses — real counts only, never a fabricated rating, never
 * "0 rating" language. `null` while loading/unavailable renders nothing (never a misleading
 * placeholder); `listingSourceId` absent means the listing has no durable identity yet (preview/
 * unpublished), which is its own truthful state, distinct from "zero real endorsements."
 */
function ServiciosHeroTrustSummary({
  listingSourceId,
  lang,
}: {
  listingSourceId?: string;
  lang: ServiciosLang;
}) {
  const [summary, setSummary] = useState<LeonixEndorsementSummaryEntry[] | null>(null);
  const targetId = (listingSourceId ?? "").trim();

  useEffect(() => {
    let cancelled = false;
    setSummary(null);
    if (!targetId) return;
    void (async () => {
      const result = await fetchLeonixEndorsementSummary("servicios", targetId);
      if (!cancelled && result.ok) setSummary(result.summary);
    })();
    return () => {
      cancelled = true;
    };
  }, [targetId]);

  if (!targetId) {
    return (
      <p className="mt-2.5 text-[11px] text-[#FFFCF7]/70 sm:text-xs">
        {lang === "en"
          ? "Community endorsements turn on once this listing is published."
          : "Los reconocimientos de la comunidad se activan al publicarse este anuncio."}
      </p>
    );
  }

  if (!summary) return null;

  const total = summary.reduce((sum, e) => sum + e.count, 0);
  if (total === 0) {
    return (
      <p className="mt-2.5 text-[11px] font-medium text-[#FFFCF7]/85 sm:text-xs">
        🦁 {lang === "en" ? "New on Leonix" : "Nuevo en Leonix"}
      </p>
    );
  }

  const topTraits = [...summary]
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 sm:justify-start">
      <p className="text-xs font-bold text-[#FFFCF7] sm:text-sm">
        🦁 {lang === "en" ? `${total} recognitions on Leonix` : `${total} reconocimientos en Leonix`}
      </p>
      {topTraits.length > 0 ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#FFFCF7]/80 sm:text-[11px]">
          {topTraits.map((t, i) => (
            <span key={t.key}>
              {i > 0 ? <span className="mr-2 text-[#FFFCF7]/40">·</span> : null}
              {(lang === "en" ? t.en : t.es) || t.key} {t.count}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

export function ServiciosProfessionalHero({
  profile,
  lang,
  template,
  cityFallback,
  contactScrollTargetId,
  listingSlug,
  listingSourceId,
  engagementListingId,
  engagementOwnerUserId,
  engagementSlot,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template: ServiciosListingTemplate;
  cityFallback?: string;
  contactScrollTargetId?: string;
  listingSlug?: string;
  listingSourceId?: string;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  engagementSlot?: React.ReactNode;
}) {
  const category = profile.hero.categoryLine?.trim();
  const location = profile.hero.locationSummary?.trim() || cityFallback?.trim() || "";
  const thumb = profile.hero.logoUrl || null;
  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) && profile.hero.rating > 0
      ? profile.hero.rating
      : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0
      ? profile.hero.reviewCount
      : undefined;
  const isLeonixVerified = profile.hero.badges.some((b) => b.kind === "verified");
  const showDirections = hasPhysicalAddress(profile);
  const tel = profile.contact.phoneTelHref?.trim();
  const waHref = resolveServiciosProfileDirectWhatsAppHref(profile.contact);
  const primaryLabel = getPrimaryCtaLabel(template, lang);
  const analyticsBase = serviciosAnalyticsTrackMeta({
    listingSlug,
    sourceId: listingSourceId,
    engagementListingId,
    ownerUserId: engagementOwnerUserId,
    source: "professional_hero",
  });

  const scrollToContact = () => {
    if (!contactScrollTargetId) return;
    const desktop = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    let id = contactScrollTargetId ?? "";
    if (desktop) {
      if (id === "servicios-pro-contact") id = "servicios-pro-contact-desktop";
      if (id === "servicios-preview-contact") id = "servicios-preview-contact-desktop";
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openCall = () => {
    if (!tel) {
      scrollToContact();
      return;
    }
    trackServiciosListingCta(listingSlug, "cta_call_click", analyticsBase);
    window.location.href = tel.startsWith("tel:") ? tel : `tel:${tel}`;
  };

  const openWhatsApp = () => {
    if (!waHref) return;
    trackServiciosListingCta(listingSlug, "cta_whatsapp_click", analyticsBase);
    window.open(waHref, "_blank", "noopener,noreferrer");
  };

  const openDirections = () => {
    const href = profile.contact.mapsSearchHref?.trim();
    const addr = profile.contact.physicalAddressDisplay?.trim();
    trackServiciosListingCta(listingSlug, "cta_maps_click", analyticsBase);
    if (href && /^https?:\/\//i.test(href)) {
      serviciosOpenGoogleMapsDirections(href, true);
    } else if (addr) {
      serviciosOpenGoogleMapsDirections(addr, false);
    }
  };

  const heroShell =
    template === "standard_service" ? "trade-canonical" : "professional-canonical";

  return (
    <div
      className={LX_HERO_BG}
      style={LX_HERO_BG_STYLE}
      data-servicios-hero-shell={heroShell}
      data-servicios-hero-align="editorial"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84A]/80 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#C9A84A]/45 to-transparent sm:inset-x-10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-[0.1]"
        style={{ background: `radial-gradient(circle, ${LX.gold} 0%, transparent 70%)` }}
        aria-hidden
      />

      <div className="relative px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
        <div
          className="pointer-events-none absolute left-1/2 top-8 z-0 h-[min(22rem,72%)] w-[min(100%,42rem)] -translate-x-1/2 rounded-[2rem] opacity-80 sm:left-[18%] sm:top-6 sm:w-[min(92%,36rem)] sm:translate-x-0"
          style={{
            background:
              "radial-gradient(ellipse 78% 68% at 38% 42%, rgba(255, 252, 247, 0.16) 0%, rgba(201, 168, 74, 0.14) 32%, transparent 72%)",
          }}
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6 lg:gap-8">
          <ServiciosAdaptiveLogoPlate
            src={thumb}
            alt={profile.hero.logoAlt || profile.identity.businessName}
            fallbackMonogram={profile.identity.businessName}
            variant="hero"
            className="mx-auto sm:mx-0"
          />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            {category ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9A84A]/95 sm:text-xs">
                {category}
              </p>
            ) : null}
            <h1 className={LX_HERO_TITLE}>{profile.identity.businessName}</h1>
            {location ? (
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-[#FFFCF7]/88 sm:justify-start sm:text-sm lg:mt-3">
                <FiMapPin className="h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
                <span className="line-clamp-1 text-left">{location}</span>
              </p>
            ) : null}

            <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              {isLeonixVerified ? (
                <span
                  className="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                  style={{
                    borderColor: "rgba(45, 90, 61, 0.5)",
                    backgroundColor: LX.trustGreenSoft,
                    color: LX.trustGreenTextOnDark,
                  }}
                >
                  {lang === "en" ? "Leonix Verified" : "Leonix Verificado"}
                </span>
              ) : null}
              <ServiciosLanguageChipRow
                profile={profile.hero}
                lang={lang}
                heroCap
                chipClassName="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#FFFCF7]/92 shrink-0"
                className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-1.5 sm:justify-start"
              />
              {ratingValue != null ? (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-2 py-0.5">
                  <StarRow rating={ratingValue} lang={lang} />
                  {reviewCount != null ? (
                    <span className="text-[10px] font-medium text-[#FFFCF7]/85">
                      ({reviewCount})
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <ServiciosHeroTrustSummary listingSourceId={listingSourceId} lang={lang} />
          </div>
        </div>

        {engagementSlot ? (
          <div className="mt-5 border-t border-white/15 pt-4">{engagementSlot}</div>
        ) : null}

        <div
          className={`grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:flex lg:flex-wrap ${
            engagementSlot ? "mt-4 border-t border-white/15 pt-5" : "mt-6 border-t border-white/15 pt-6"
          }`}
          data-servicios-cta-row="1"
        >
          {tel ? (
            <button
              type="button"
              onClick={openCall}
              className={`${LX_CTA_PRIMARY} ${LX_CTA_PRIMARY_LG} w-full sm:col-span-2 lg:min-w-[14rem] lg:flex-1`}
              style={{ backgroundColor: LX.burgundy, boxShadow: "0 8px 24px rgba(92, 22, 34, 0.32)" }}
            >
              <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
              {primaryLabel}
            </button>
          ) : null}
          {waHref ? (
            <button
              type="button"
              onClick={openWhatsApp}
              className={`${LX_CTA_WHATSAPP} ${LX_CTA_PRIMARY_LG} w-full lg:min-w-[10rem] lg:flex-1`}
              style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
            >
              <FaWhatsapp className="h-5 w-5 shrink-0" aria-hidden />
              WhatsApp
            </button>
          ) : null}
          {showDirections ? (
            <button type="button" onClick={openDirections} className={`${LX_CTA_MAP} ${LX_CTA_PRIMARY_LG} w-full lg:min-w-[10rem] lg:flex-1`}>
              <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
              {lang === "en" ? "Directions" : "Cómo llegar"}
            </button>
          ) : null}
          {!tel && !waHref ? (
            <button
              type="button"
              onClick={scrollToContact}
              className={`${LX_CTA_PRIMARY} ${LX_CTA_PRIMARY_LG} w-full sm:col-span-2`}
              style={{ backgroundColor: LX.burgundy }}
            >
              {primaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
