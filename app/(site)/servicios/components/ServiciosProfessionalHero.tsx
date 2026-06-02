"use client";

import Image from "next/image";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { ServiciosProfileResolved, ServiciosLang } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { serviciosImageUnoptimized } from "../lib/serviciosMediaUrl";
import { trackServiciosListingCta } from "../lib/serviciosCtaIntents";
import {
  LX,
  LX_CTA_MAP,
  LX_CTA_PRIMARY,
  LX_CTA_PRIMARY_LG,
  LX_CTA_WHATSAPP,
  LX_HERO_BG,
  LX_HERO_CHIP,
  LX_HERO_LOGO_FRAME,
  LX_HERO_TITLE,
  LX_TYPE_SERIF_DISPLAY,
  collectHeroDisplayChips,
  getPrimaryCtaLabel,
  hasPhysicalAddress,
} from "./serviciosLeonixBrand";

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

export function ServiciosProfessionalHero({
  profile,
  lang,
  template,
  cityFallback,
  contactScrollTargetId,
  listingSlug,
  engagementSlot,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  template: ServiciosListingTemplate;
  cityFallback?: string;
  contactScrollTargetId?: string;
  listingSlug?: string;
  engagementSlot?: React.ReactNode;
}) {
  const category = profile.hero.categoryLine?.trim();
  const location = profile.hero.locationSummary?.trim() || cityFallback?.trim() || "";
  const thumb = profile.hero.logoUrl || null;
  const displayChips = collectHeroDisplayChips(profile, 3);
  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) && profile.hero.rating > 0
      ? profile.hero.rating
      : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0
      ? profile.hero.reviewCount
      : undefined;
  const isLeonixVerified = profile.hero.badges.some((b) => b.kind === "verified");
  const languageBadges = profile.hero.badges
    .filter((b) => b.kind === "spanish" || b.kind === "custom")
    .slice(0, 2);
  const showDirections = hasPhysicalAddress(profile);
  const tel = profile.contact.phoneTelHref?.trim();
  const waHref = profile.contact.socialLinks?.whatsapp?.trim();
  const primaryLabel = getPrimaryCtaLabel(template, lang);

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
    trackServiciosListingCta(listingSlug, "cta_call_click", { source: "professional_hero" });
    window.location.href = tel.startsWith("tel:") ? tel : `tel:${tel}`;
  };

  const openWhatsApp = () => {
    if (!waHref) return;
    trackServiciosListingCta(listingSlug, "cta_whatsapp_click", { source: "professional_hero" });
    window.open(waHref, "_blank", "noopener,noreferrer");
  };

  const openDirections = () => {
    const href = profile.contact.mapsSearchHref?.trim();
    const addr = profile.contact.physicalAddressDisplay?.trim();
    trackServiciosListingCta(listingSlug, "cta_maps_click", { source: "professional_hero" });
    if (href && /^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else if (addr) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  };

  return (
    <div className={LX_HERO_BG}>
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
          <div className={LX_HERO_LOGO_FRAME}>
            {thumb ? (
              <Image
                src={thumb}
                alt={profile.hero.logoAlt || profile.identity.businessName}
                fill
                className="object-contain"
                sizes="104px"
                unoptimized={serviciosImageUnoptimized(thumb)}
              />
            ) : (
              <div
                className={`flex h-full w-full items-center justify-center ${LX_TYPE_SERIF_DISPLAY} text-xl uppercase tracking-wide text-[#3B2117]`}
              >
                {profile.identity.businessName.slice(0, 2)}
              </div>
            )}
          </div>

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
              {languageBadges.map((b) => (
                <span
                  key={`${b.kind}-${b.label}`}
                  className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-[#FFFCF7]/92"
                >
                  {b.label}
                </span>
              ))}
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

            {displayChips.length > 0 ? (
              <div className="mt-3.5 flex flex-wrap justify-center gap-2 sm:justify-start lg:mt-4">
                {displayChips.map((chip) => (
                  <span key={chip} className={LX_HERO_CHIP}>
                    {chip}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {engagementSlot ? (
          <div className="mt-5 border-t border-white/15 pt-4">{engagementSlot}</div>
        ) : null}

        <div
          className={`grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:flex lg:flex-wrap ${
            engagementSlot ? "mt-4 border-t border-white/15 pt-5" : "mt-6 border-t border-white/15 pt-6"
          }`}
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
