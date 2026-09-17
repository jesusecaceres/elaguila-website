"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiMail, FiMapPin, FiMessageSquare, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import {
  isOwnerAuthoredQuickFact,
  isOwnerAuthoredService,
  relabelServiciosCanonicalPresets,
} from "@/app/(site)/servicios/lib/serviciosTranslateAd";
import { canonicalBusinessTypeLabel } from "@/app/(site)/servicios/lib/serviciosCanonicalPresetLabels";
import { useServiciosResultCardTranslation } from "@/app/servicios/components/useServiciosResultCardTranslation";
import type { ServiciosProfileResolved } from "@/app/servicios/types/serviciosBusinessProfile";
import type { ServiciosPublicListingRow } from "./lib/serviciosPublicListingsServer";
import { serviciosEngagementListingKey } from "./lib/serviciosPublicListingSort";
import {
  buildServiciosSendEmailIntentFromMailto,
  serviciosAnalyticsTrackMeta,
  trackServiciosListingCta,
  trackServiciosResultCardClick,
} from "@/app/(site)/servicios/lib/serviciosCtaIntents";
import { CtaActionSheet } from "@/app/components/cta";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import {
  serviciosOpenGoogleMapsDirections,
  serviciosOpenSmsHref,
  serviciosOpenTelHref,
  serviciosOpenWhatsAppHref,
} from "@/app/(site)/servicios/lib/serviciosDirectCta";
import { buildQuoteSmsHref } from "@/app/(site)/servicios/lib/serviciosContactActions";
import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { isServiciosListingPromoted } from "./lib/serviciosResultsFilter";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "./lib/serviciosListingLifecycle";
import {
  ServiciosResultCardBodyLink,
  SERVICIOS_RESULT_CARD_INTERACTIVE,
} from "./components/ServiciosResultCardBodyLink";
import {
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
  type ServiciosListingTemplate,
} from "./lib/serviciosTemplateRouting";
import { resolveServiciosProfileDirectWhatsAppHref } from "@/app/(site)/servicios/lib/serviciosWhatsAppHref";
import { ServiciosAdaptiveLogoPlate } from "@/app/servicios/components/ServiciosAdaptiveLogoPlate";
import { ServiciosLikeCountBadge } from "@/app/servicios/components/ServiciosLikeCountBadge";
import { ServiciosResultCardEngagementStrip } from "@/app/servicios/components/ServiciosResultCardEngagementStrip";
import { ServiciosServiceChipsRow } from "@/app/servicios/components/ServiciosServiceChipsRow";
import {
  LX,
  LX_COMPACT_CARD_TITLE,
  LX_CTA_CARD_MAP,
  LX_CTA_CARD_OUTLINE,
  LX_CTA_CARD_PRIMARY,
  LX_CTA_CARD_PRIMARY_FLEX,
  LX_CTA_CARD_SECONDARY,
  LX_CTA_CARD_WHATSAPP,
  LX_IVORY_CARD,
  cleanProfessionalChipLabel,
  collectHeroTrustChips,
  collectProfessionalServiceChips,
  getPrimaryCtaLabel,
  getServicesTitle,
  hasPhysicalAddress,
} from "@/app/servicios/components/serviciosLeonixBrand";

function getProfileCtaSecondary(_template: ServiciosListingTemplate, lang: ServiciosLang): string {
  return lang === "en" ? "View profile" : "Ver perfil";
}

/**
 * Servicios Final UI Truth Closeout (2026-09-16) — Gate 6: which of the card's already-displayed
 * chips (service titles, specialties-line fragments, trust quick facts) are genuinely owner-
 * authored, per the same doctrine `serviciosTranslateAd.ts` already uses for the full-profile
 * translation bundle. Intersected against `displayed` so only chips that survived cleaning/de-dup
 * (i.e. are actually on screen) are ever sent for translation.
 */
function collectOwnerAuthoredProfessionalChips(profile: ServiciosProfileResolved, displayed: string[]): string[] {
  const owner = new Set<string>();
  for (const s of profile.services) {
    if (!isOwnerAuthoredService(s)) continue;
    const c = cleanProfessionalChipLabel(s.title);
    if (c) owner.add(c.toLowerCase());
  }
  const spec = profile.about?.specialtiesLine?.trim();
  if (spec) {
    for (const part of spec.split(/[,;|·]/)) {
      const c = cleanProfessionalChipLabel(part);
      if (c) owner.add(c.toLowerCase());
    }
  }
  for (const f of profile.quickFacts) {
    if (!isOwnerAuthoredQuickFact(f)) continue;
    const c = cleanProfessionalChipLabel(f.label);
    if (c) owner.add(c.toLowerCase());
  }
  return displayed.filter((chip) => owner.has(chip.toLowerCase()));
}

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
            <span className="absolute text-[#d4cfc4]" aria-hidden>
              ★
            </span>
            <span className="absolute overflow-hidden text-[#C9A84A]" style={{ width: `${pct}%` }} aria-hidden>
              ★
            </span>
          </span>
        );
      })}
      <span className="ml-0.5 text-xs font-bold text-[#2A2620]">{rating.toFixed(1)}</span>
    </div>
  );
}

export function ServiciosProfessionalResultCard({
  row,
  lang,
  embedded = false,
  density = "default",
}: {
  row: ServiciosPublicListingRow;
  lang: ServiciosLang;
  embedded?: boolean;
  density?: "default" | "compact";
}) {
  const wire = { ...row.profile_json };
  wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
  if (
    (row.review_rating_count ?? 0) > 0 &&
    typeof row.review_rating_avg === "number" &&
    Number.isFinite(row.review_rating_avg)
  ) {
    wire.hero = {
      ...wire.hero,
      rating: row.review_rating_avg,
      reviewCount: row.review_rating_count ?? undefined,
    };
  }
  // ⚠️38A — results presentation: canonical preset labels follow the viewer locale (pure catalog
  // map); business name, custom text, literals and identity untouched. Routing keeps the ORIGINAL line.
  const profile = relabelServiciosCanonicalPresets(resolveServiciosProfile(wire, lang), lang);

  const template = resolveServiciosListingTemplate({
    businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
    internalGroup: row.internal_group,
    categoryLabel: row.profile_json.hero?.categoryLine,
  });

  const href = `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
  const ctaAnalyticsKey = serviciosEngagementListingKey(row);
  const ctaTrackMeta = serviciosAnalyticsTrackMeta({
    listingSlug: row.slug,
    sourceId: row.id,
    engagementListingId: ctaAnalyticsKey,
    ownerUserId: row.owner_user_id ?? null,
    source: "servicios_professional_card",
  });
  const thumb = profile.hero.logoUrl || null;
  const category = profile.hero.categoryLine?.trim();
  const location = profile.hero.locationSummary?.trim() || row.city?.trim();
  // Servicios Final Contact Truth + Email No-Mailto Closeout (2026-09-17, Gate 1/4) — one Call
  // destination: office phone when present, principal phone as fallback. Never two separate buttons.
  const officeTel = profile.contact.phoneOfficeTelHref?.trim();
  const officeDisplay = profile.contact.phoneOfficeDisplay?.trim();
  const useOfficeCall = Boolean(officeTel && officeDisplay);
  const tel = useOfficeCall ? officeTel : profile.contact.phoneTelHref;
  const waHrefNormalized = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const promoted = isServiciosListingPromoted(row);
  const showDirections = hasPhysicalAddress(profile);
  const serviceChips = useMemo(() => collectProfessionalServiceChips(profile, 12), [profile]);
  const trustChips = useMemo(() => collectHeroTrustChips(profile, 3), [profile]);
  const allChips = useMemo(() => [...serviceChips, ...trustChips], [serviceChips, trustChips]);
  const isCompact = density === "compact";

  const customCategoryLine = category && canonicalBusinessTypeLabel(category, "es") == null ? category : undefined;
  const ownerAuthoredChips = useMemo(
    () => (isCompact ? [] : collectOwnerAuthoredProfessionalChips(profile, allChips)),
    [isCompact, profile, allChips],
  );
  // Servicios Card Translate Coherence (2026-09-17): canonical (catalog) chips always have a real
  // ES/EN pair — Translate must stay offered for them even with zero owner-authored text.
  const hasCanonicalDisplayContent = Boolean(
    (category && !customCategoryLine) || allChips.length > ownerAuthoredChips.length,
  );
  const { translateControl, displayLang, displayCategoryLine, chipOverrides } = useServiciosResultCardTranslation({
    categoryLine: customCategoryLine,
    ownerAuthoredChips,
    hasCanonicalDisplayContent,
    lang,
    listingKey: ctaAnalyticsKey,
    enabled: !isCompact,
  });

  // Re-derive canonical chips/category for the DISPLAY language (unchanged reference when not
  // translated) — mirrors ServiciosHorizontalResultCard's fix: canonical content must flip
  // language together with owner-authored text, never leaving a mixed-language card.
  const displayProfile = useMemo(
    () => (displayLang !== lang ? relabelServiciosCanonicalPresets(profile, displayLang) : profile),
    [profile, displayLang, lang],
  );
  const displayServiceChipsCanonical =
    displayProfile === profile ? serviceChips : collectProfessionalServiceChips(displayProfile, 12);
  const displayTrustChipsCanonical =
    displayProfile === profile ? trustChips : collectHeroTrustChips(displayProfile, 3);
  const displayAllChipsCanonical =
    displayProfile === profile ? allChips : [...displayServiceChipsCanonical, ...displayTrustChipsCanonical];
  const displayCategory =
    displayCategoryLine ?? (displayLang === lang ? category : displayProfile.hero.categoryLine?.trim());

  // Servicios Absolute Final Golden Closeout (2026-09-17, Gate 1/2) — every UI_CHROME string
  // (CTA labels, section labels, aria text) follows `displayLang`, not the static site `lang`,
  // so Translate switches the WHOLE ad-local experience instead of leaving chrome behind.
  const primaryLabel = getPrimaryCtaLabel(template, displayLang);
  const secondaryLabel = getProfileCtaSecondary(template, displayLang);
  const servicesLabel = getServicesTitle(template, displayLang);
  // Gate 2/4 — the dedicated "número para mensajes/cotizaciones"; never WhatsApp, never the office
  // number merely because it exists. buildQuoteSmsHref preserves the existing quote/message copy.
  const smsHref = buildQuoteSmsHref(profile.contact.quoteMessagePhone, displayLang);
  // Gate 4 — WhatsApp is bumped to its own row only when it would otherwise fight Call+Message for
  // the primary two-up row; with any other combination the real channels stay balanced side by side.
  const forceWhatsAppBelow = Boolean(tel) && Boolean(smsHref) && Boolean(waHrefNormalized);
  // Gate 4/12 — same "no call, no Message, no WhatsApp" email-only fallback the trade card already
  // has; this template previously had no email CTA at all when nothing else resolved.
  const showEmailFallback = Boolean(!tel && !smsHref && !waHrefNormalized && profile.contact.emailMailtoHref);

  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) && profile.hero.rating > 0
      ? profile.hero.rating
      : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0
      ? profile.hero.reviewCount
      : undefined;

  const likeBadgeCount =
    typeof row.public_like_net_count === "number" && row.public_like_net_count > 0
      ? Math.floor(row.public_like_net_count)
      : 0;

  const endorsementCount =
    typeof row.public_endorsement_count === "number" && row.public_endorsement_count > 0
      ? Math.floor(row.public_endorsement_count)
      : 0;

  const [listingShareUrl, setListingShareUrl] = useState("");
  // Gate 12 — the same rich email action sheet the full profile's "Correo" CTA uses.
  const [emailSheetIntent, setEmailSheetIntent] = useState<CtaSheetIntent | null>(null);
  useEffect(() => {
    setListingShareUrl(`${window.location.origin}${href}`);
  }, [href]);

  const persistListingEngagement = useMemo(() => {
    if (!row.id?.trim()) return false;
    if (row.listing_status && row.listing_status !== SERVICIOS_LISTING_STATUS_PUBLISHED) return false;
    return Boolean(ctaAnalyticsKey.trim()) && Boolean(listingShareUrl.trim());
  }, [ctaAnalyticsKey, listingShareUrl, row.id, row.listing_status]);

  const showEngagementControls = Boolean(ctaAnalyticsKey.trim());

  const onCallClick = useCallback(() => {
    if (!tel) return;
    trackServiciosListingCta(row.slug, "cta_call_click", ctaTrackMeta);
    serviciosOpenTelHref(tel);
  }, [ctaTrackMeta, row.slug, tel]);

  const onWhatsAppClick = useCallback(() => {
    if (!waHrefNormalized) return;
    trackServiciosListingCta(row.slug, "cta_whatsapp_click", ctaTrackMeta);
    serviciosOpenWhatsAppHref(waHrefNormalized);
  }, [ctaTrackMeta, row.slug, waHrefNormalized]);

  const onMessageClick = useCallback(() => {
    if (!smsHref) return;
    trackServiciosListingCta(row.slug, "cta_quote_sms_click", ctaTrackMeta);
    serviciosOpenSmsHref(smsHref);
  }, [ctaTrackMeta, row.slug, smsHref]);

  const onDirectionsClick = useCallback(() => {
    const mapsHref = profile.contact.mapsSearchHref?.trim();
    const addr = profile.contact.physicalAddressDisplay?.trim();
    trackServiciosListingCta(row.slug, "cta_maps_click", ctaTrackMeta);
    if (mapsHref && /^https?:\/\//i.test(mapsHref)) {
      serviciosOpenGoogleMapsDirections(mapsHref, true);
    } else if (addr) {
      serviciosOpenGoogleMapsDirections(addr, false);
    }
  }, [ctaTrackMeta, profile.contact.mapsSearchHref, profile.contact.physicalAddressDisplay, row.slug]);

  const onEmailClick = useCallback(() => {
    const mailtoHref = profile.contact.emailMailtoHref;
    if (!mailtoHref) return;
    trackServiciosListingCta(row.slug, "cta_email_click", ctaTrackMeta);
    const intent = buildServiciosSendEmailIntentFromMailto(mailtoHref, displayLang, row.slug, listingShareUrl || undefined);
    if (intent) setEmailSheetIntent(intent);
  }, [ctaTrackMeta, displayLang, listingShareUrl, profile.contact.emailMailtoHref, row.slug]);

  const onCardNavigate = useCallback(() => {
    trackServiciosResultCardClick(row);
  }, [row]);

  const cardNavigateLabel =
    displayLang === "en"
      ? `View profile for ${profile.identity.businessName}`
      : `Ver perfil de ${profile.identity.businessName}`;

  const cardSurface = promoted
    ? `${LX_IVORY_CARD} ring-2 ring-[#C9A84A]/30 border-[#C9A84A]/55`
    : LX_IVORY_CARD;
  const displayChips = (
    isCompact && displayAllChipsCanonical.length > 3
      ? [...displayAllChipsCanonical.slice(0, 3), `+${displayAllChipsCanonical.length - 3}`]
      : displayAllChipsCanonical
  ).map((c) => chipOverrides.get(c) ?? c);

  const body = (
    <>
      <article
        className={`${cardSurface} relative ${
          isCompact ? "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(9.25rem,auto)] sm:items-stretch" : ""
        }`.trim()}
      >
        <ServiciosResultCardBodyLink href={href} ariaLabel={cardNavigateLabel} onNavigate={onCardNavigate} />

        <div className={isCompact ? "relative z-[2] flex gap-2.5 p-2.5 sm:col-start-1 sm:row-start-1 sm:items-center sm:p-3 sm:pb-1.5" : "relative z-[2] flex items-start justify-between gap-2 p-4 sm:gap-3 sm:p-5"} data-servicios-card-header="1">
          <div className={isCompact ? "pointer-events-none flex flex-1 gap-2.5" : "pointer-events-none flex min-w-0 flex-1 gap-3 sm:gap-4"}>
            <ServiciosAdaptiveLogoPlate
              src={thumb}
              alt={profile.hero.logoAlt || profile.identity.businessName}
              fallbackMonogram={profile.identity.businessName}
              variant="card"
              className={isCompact ? "!h-12 !w-12 sm:!h-14 sm:!w-14" : ""}
            />

            <div className={isCompact ? "min-w-0 flex-1 space-y-0.5" : "min-w-0 flex-1 space-y-1"}>
              <div className="flex flex-wrap items-center gap-1">
                {promoted ? (
                  <span className="rounded-md border border-[#C9A84A]/50 bg-[#F5F0E8] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3B2117]">
                    {displayLang === "en" ? "Featured" : "Destacado"}
                  </span>
                ) : null}
                {row.leonix_verified ? (
                  <span
                    className="rounded-md border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={{
                      borderColor: "rgba(45, 90, 61, 0.4)",
                      backgroundColor: LX.trustGreenSoft,
                      color: LX.trustGreenText,
                    }}
                  >
                    {displayLang === "en" ? "Verified" : "Verificado"}
                  </span>
                ) : null}
                {!showEngagementControls ? (
                  <ServiciosLikeCountBadge count={likeBadgeCount} lang={displayLang} />
                ) : null}
              </div>

              <h3 className={isCompact ? "font-serif text-[14px] font-semibold leading-snug tracking-tight text-[#1E1814] sm:text-[15px]" : LX_COMPACT_CARD_TITLE}>
                {profile.identity.businessName}
              </h3>

              {displayCategory ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6F6254] sm:text-[11px]">{displayCategory}</p>
              ) : null}

              {location ? (
                <p className="flex items-start gap-1.5 text-[11px] text-[#4A4A4A] sm:text-xs">
                  <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
                  <span className={isCompact ? "line-clamp-1" : "line-clamp-2"}>{location}</span>
                </p>
              ) : null}

              {ratingValue != null ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <StarRow rating={ratingValue} lang={displayLang} />
                  {reviewCount != null ? (
                    <span className="text-[11px] font-semibold text-[#6F6254]">
                      ({reviewCount} {displayLang === "en" ? "reviews" : "reseñas"})
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {!isCompact && translateControl ? (
            <div className="pointer-events-auto shrink-0" data-servicios-card-translate-utility="1">
              {translateControl}
            </div>
          ) : null}
        </div>

        {displayChips.length > 0 ? (
          <div className={isCompact ? "pointer-events-none relative z-[2] px-2.5 pb-2 sm:col-start-1 sm:row-start-2 sm:px-3" : "pointer-events-none relative z-[2] px-4 pb-3 sm:px-5"}>
            <ServiciosServiceChipsRow
              chips={displayChips}
              lang={displayLang}
              profileHref={href}
              servicesLabel={servicesLabel}
            />
          </div>
        ) : null}

        <div
          className={`${SERVICIOS_RESULT_CARD_INTERACTIVE} ${isCompact ? "border-t border-[#E8D9C4]/80 px-2.5 py-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:flex sm:items-center sm:border-l sm:border-t-0 sm:px-3" : "border-t border-[#E8D9C4]/80 px-4 py-3 sm:px-5 sm:py-4"}`}
        >
          {isCompact ? (
            <div className="flex flex-wrap gap-2 sm:w-[9.25rem] sm:flex-col sm:items-stretch sm:justify-center sm:gap-1.5">
              {tel ? (
                <button
                  type="button"
                  onClick={onCallClick}
                  className={`${LX_CTA_CARD_PRIMARY} sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]`}
                  style={{ backgroundColor: LX.burgundy, boxShadow: "0 4px 12px rgba(92, 22, 34, 0.2)" }}
                >
                  <FiPhone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {primaryLabel}
                </button>
              ) : null}
              <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-1.5">
                {smsHref ? (
                  <button
                    type="button"
                    onClick={onMessageClick}
                    className={`${LX_CTA_CARD_SECONDARY} sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]`}
                  >
                    <FiMessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {displayLang === "en" ? "Message" : "Mensaje"}
                  </button>
                ) : null}
                {waHrefNormalized ? (
                  <button
                    type="button"
                    onClick={onWhatsAppClick}
                    className={`${LX_CTA_CARD_WHATSAPP} sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]`}
                    style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
                  >
                    <FaWhatsapp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    WhatsApp
                  </button>
                ) : null}
                {showDirections ? (
                  <button type="button" onClick={onDirectionsClick} className={`${LX_CTA_CARD_MAP} sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]`}>
                    <FiMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {displayLang === "en" ? "Directions" : "Cómo llegar"}
                  </button>
                ) : null}
                {showEmailFallback ? (
                  <button type="button" onClick={onEmailClick} className={`${LX_CTA_CARD_SECONDARY} sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]`}>
                    <FiMail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {displayLang === "en" ? "Email" : "Correo"}
                  </button>
                ) : null}
              </div>
              <Link
                href={href}
                onClick={() => trackServiciosResultCardClick(row)}
                className={`${LX_CTA_CARD_OUTLINE} sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]`}
              >
                {secondaryLabel}
              </Link>
              <ServiciosResultCardEngagementStrip
                listingId={ctaAnalyticsKey}
                ownerUserId={row.owner_user_id ?? null}
                listingTitle={profile.identity.businessName}
                listingShareUrl={persistListingEngagement ? listingShareUrl || undefined : undefined}
                listingSlug={row.slug}
                listingSourceId={row.id ?? null}
                lang={displayLang}
                publicLikeCount={likeBadgeCount}
                showEngagementControls={showEngagementControls}
                persistListingEngagement={persistListingEngagement}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2">
                {tel ? (
                  <button
                    type="button"
                    onClick={onCallClick}
                    className={LX_CTA_CARD_PRIMARY_FLEX}
                    style={{ backgroundColor: LX.burgundy, boxShadow: "0 4px 12px rgba(92, 22, 34, 0.2)" }}
                  >
                    <FiPhone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {primaryLabel}
                  </button>
                ) : null}
                {smsHref ? (
                  <button type="button" onClick={onMessageClick} className={LX_CTA_CARD_SECONDARY}>
                    <FiMessageSquare className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {displayLang === "en" ? "Message" : "Mensaje"}
                  </button>
                ) : null}
                {waHrefNormalized && !forceWhatsAppBelow ? (
                  <button
                    type="button"
                    onClick={onWhatsAppClick}
                    className={LX_CTA_CARD_WHATSAPP}
                    style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
                  >
                    <FaWhatsapp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    WhatsApp
                  </button>
                ) : null}
                {showDirections ? (
                  <button type="button" onClick={onDirectionsClick} className={LX_CTA_CARD_MAP}>
                    <FiMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {displayLang === "en" ? "Directions" : "Cómo llegar"}
                  </button>
                ) : null}
                {showEmailFallback ? (
                  <button type="button" onClick={onEmailClick} className={LX_CTA_CARD_SECONDARY}>
                    <FiMail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {displayLang === "en" ? "Email" : "Correo"}
                  </button>
                ) : null}
              </div>

              {/* Gate 4 — WhatsApp gets its own row only when Call AND Message both already filled
                  the primary row; it never displaces Message from the balanced Call+Message pairing. */}
              {waHrefNormalized && forceWhatsAppBelow ? (
                <button
                  type="button"
                  onClick={onWhatsAppClick}
                  className={`${LX_CTA_CARD_WHATSAPP} w-full`}
                  style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
                >
                  <FaWhatsapp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  WhatsApp
                </button>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-2" data-servicios-card-trust-strip="1">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D7B8] bg-[#FFF9F2] px-2.5 py-1 text-[10px] font-bold text-[#7A1E2C] sm:text-[11px]">
                  🦁 {displayLang === "en" ? "Leonix Community" : "Comunidad Leonix"}
                  {" · "}
                  {endorsementCount > 0
                    ? displayLang === "en"
                      ? `${endorsementCount} recognition${endorsementCount === 1 ? "" : "s"}`
                      : `${endorsementCount} reconocimiento${endorsementCount === 1 ? "" : "s"}`
                    : displayLang === "en"
                      ? "New"
                      : "Nuevo"}
                </span>

                <ServiciosResultCardEngagementStrip
                  listingId={ctaAnalyticsKey}
                  ownerUserId={row.owner_user_id ?? null}
                  listingTitle={profile.identity.businessName}
                  listingShareUrl={persistListingEngagement ? listingShareUrl || undefined : undefined}
                  listingSlug={row.slug}
                  listingSourceId={row.id ?? null}
                  lang={displayLang}
                  publicLikeCount={likeBadgeCount}
                  showEngagementControls={showEngagementControls}
                  persistListingEngagement={persistListingEngagement}
                />
              </div>

              <Link
                href={href}
                onClick={() => trackServiciosResultCardClick(row)}
                className={LX_CTA_CARD_SECONDARY}
                data-servicios-card-profile-nav="1"
              >
                {secondaryLabel}
              </Link>
            </div>
          )}
        </div>
      </article>
      <CtaActionSheet
        open={emailSheetIntent != null}
        onClose={() => setEmailSheetIntent(null)}
        intent={emailSheetIntent}
        lang={displayLang}
      />
    </>
  );

  if (embedded) return body;
  return <li>{body}</li>;
}
