"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiGlobe, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { serviciosEngagementListingKey } from "../lib/serviciosPublicListingSort";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import { getServiciosPublicMonetizationBadges } from "../lib/serviciosDestacados";
import type { ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import {
  serviciosAnalyticsTrackMeta,
  trackServiciosListingCta,
  trackServiciosResultCardClick,
} from "@/app/(site)/servicios/lib/serviciosCtaIntents";
import {
  buildServiciosGoogleMapsDirectionsUrl,
  serviciosOpenGoogleMapsDirections,
  serviciosOpenMailtoHref,
  serviciosOpenTelHref,
  serviciosOpenWebsiteUrl,
  serviciosOpenWhatsAppHref,
} from "@/app/(site)/servicios/lib/serviciosDirectCta";
import {
  isServiciosProfessionalTemplate,
  readServiciosProfileBusinessTypeId,
  resolveServiciosListingTemplate,
} from "../lib/serviciosTemplateRouting";
import { resolveServiciosProfileDirectWhatsAppHref } from "@/app/(site)/servicios/lib/serviciosWhatsAppHref";
import { ServiciosProfessionalResultCard } from "../ServiciosProfessionalResultCard";
import { ServiciosAdaptiveLogoPlate } from "@/app/servicios/components/ServiciosAdaptiveLogoPlate";
import { ServiciosLikeCountBadge } from "@/app/servicios/components/ServiciosLikeCountBadge";
import { ServiciosResultCardEngagementStrip } from "@/app/servicios/components/ServiciosResultCardEngagementStrip";
import { ServiciosServiceChipsRow } from "@/app/servicios/components/ServiciosServiceChipsRow";
import { useServiciosResultCardTranslation } from "@/app/servicios/components/useServiciosResultCardTranslation";
import { canonicalBusinessTypeLabel } from "@/app/(site)/servicios/lib/serviciosCanonicalPresetLabels";
import { isOwnerAuthoredService } from "@/app/(site)/servicios/lib/serviciosTranslateAd";
import {
  LX,
  LX_COMPACT_CARD_TITLE,
  LX_CTA_CARD_MAP,
  LX_CTA_CARD_PRIMARY_FLEX,
  LX_CTA_CARD_SECONDARY,
  LX_CTA_CARD_WHATSAPP,
  LX_IVORY_CARD,
  cleanProfessionalChipLabel,
  isWeakProfessionalChipLabel,
} from "@/app/(site)/servicios/components/serviciosLeonixBrand";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "../lib/serviciosListingLifecycle";
import {
  mapServiciosTradePresentationProfile,
  serviciosTradePresentationLocationLine,
} from "../lib/mapServiciosTradePresentation";
import {
  ServiciosResultCardBodyLink,
  SERVICIOS_RESULT_CARD_INTERACTIVE,
} from "./ServiciosResultCardBodyLink";

function cleanOtherLabel(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower === "otro" || lower === "other") return "";
  if (lower.startsWith("otro:") || lower.startsWith("other:")) {
    return t.split(":").slice(1).join(":").trim();
  }
  if (lower.startsWith("otro ")) return t.replace(/^otro\s+/i, "").trim();
  if (lower.startsWith("other ")) return t.replace(/^other\s+/i, "").trim();
  return t;
}

function mapsDirectionsHref(query: string): string {
  return buildServiciosGoogleMapsDirectionsUrl(query);
}

function StarRow({ rating, lang }: { rating: number; lang: "es" | "en" }) {
  const aria = lang === "en" ? `${rating.toFixed(1)} out of 5 stars` : `${rating.toFixed(1)} de 5 estrellas`;
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={aria}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = rating - i;
        const pct = Math.round(Math.min(1, Math.max(0, v)) * 100);
        return (
          <span key={i} className="relative h-3.5 w-[0.95em] text-[13px] leading-none">
            <span className="absolute text-[#d4cfc4]" aria-hidden>
              ★
            </span>
            <span className="absolute overflow-hidden text-[#C9A84A]" style={{ width: `${pct}%` }} aria-hidden>
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
}

export interface ServiciosHorizontalResultCardProps {
  row?: ServiciosPublicListingRow;
  previewProfile?: ServiciosProfileResolved;
  lang: "es" | "en";
  className?: string;
  density?: "default" | "compact";
  publicDetailHref?: string;
  publicDetailLabel?: string;
  discoveryRefineHref?: string;
  discoveryRefineLabel?: string;
  listingShareUrl?: string;
}

/**
 * Standard Servicios discovery card — ivory sales-card layout (preview + published + recent).
 */
export function ServiciosHorizontalResultCard({
  row,
  previewProfile,
  lang,
  className = "",
  density = "default",
  publicDetailHref,
  publicDetailLabel,
  discoveryRefineHref,
  discoveryRefineLabel,
  listingShareUrl,
}: ServiciosHorizontalResultCardProps) {
  const L = getServiciosProfileLabels(lang);

  const profile = useMemo(
    (): ServiciosProfileResolved | null => mapServiciosTradePresentationProfile({ previewProfile, row, lang }),
    [previewProfile, row, lang],
  );

  const listingSlug = useMemo(() => {
    if (!profile) return (row?.slug || "").trim();
    return (row?.slug || "").trim() || profile.identity.slug;
  }, [row, profile]);

  const ctaAnalyticsListingKey = useMemo(() => {
    if (row) return serviciosEngagementListingKey(row);
    return listingSlug;
  }, [row, listingSlug]);

  const ctaTrackMeta = useMemo(
    () =>
      serviciosAnalyticsTrackMeta({
        listingSlug: listingSlug || ctaAnalyticsListingKey,
        sourceId: row?.id ?? null,
        engagementListingId: ctaAnalyticsListingKey,
        ownerUserId: row?.owner_user_id ?? null,
        source: "servicios_horizontal_card",
      }),
    [ctaAnalyticsListingKey, listingSlug, row?.id, row?.owner_user_id],
  );

  const openContactKey = useCallback(
    (key: string, href: string) => {
      if (!profile) return;
      const slugKey = listingSlug || ctaAnalyticsListingKey;
      if (key === "maps") {
        trackServiciosListingCta(slugKey, "cta_maps_click", ctaTrackMeta);
        serviciosOpenGoogleMapsDirections(href, /^https?:\/\//i.test(href));
        return;
      }
      if (key === "website") {
        trackServiciosListingCta(slugKey, "cta_website_click", ctaTrackMeta);
        serviciosOpenWebsiteUrl(href);
        return;
      }
      if (key === "whatsapp") {
        trackServiciosListingCta(slugKey, "cta_whatsapp_click", ctaTrackMeta);
        serviciosOpenWhatsAppHref(href);
        return;
      }
      if (key === "email") {
        trackServiciosListingCta(slugKey, "cta_email_click", ctaTrackMeta);
        serviciosOpenMailtoHref(href);
        return;
      }
      if (key === "call" || key === "callOffice") {
        trackServiciosListingCta(slugKey, "cta_call_click", ctaTrackMeta);
        serviciosOpenTelHref(href);
      }
    },
    [ctaAnalyticsListingKey, ctaTrackMeta, listingSlug, profile],
  );

  const onCardNavigate = useCallback(() => {
    if (row) trackServiciosResultCardClick(row);
  }, [row]);

  // Category/chip derivation moved above the early returns below (rules-of-hooks: the translation
  // hook it feeds must run unconditionally on every render) — safe against a null `profile` via
  // optional chaining; the professional-template early return renders a different component
  // entirely, so a wasted computation here is harmless.
  const rawCategoryLine = (profile?.hero.categoryLine || "").trim();
  const categoryChip = cleanOtherLabel(rawCategoryLine);
  // Card-visible-only translation scope (Gate 6): a custom "otro" category line is owner prose;
  // a catalog preset category line is a re-labelled, already-localized chip, never translated.
  const customCategoryLine =
    rawCategoryLine && canonicalBusinessTypeLabel(rawCategoryLine, "es") == null ? categoryChip : undefined;

  const { chips: serviceChipList, ownerAuthoredChips } = useMemo(() => {
    const out: string[] = [];
    const owner: string[] = [];
    const seen = new Set<string>();
    for (const s of profile?.services ?? []) {
      const c = cleanProfessionalChipLabel(cleanOtherLabel(s.title));
      if (!c || isWeakProfessionalChipLabel(c)) continue;
      const key = c.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
      if (isOwnerAuthoredService(s)) owner.push(c);
    }
    return { chips: out, ownerAuthoredChips: owner };
  }, [profile]);

  const { translateControl, displayCategoryLine, chipOverrides } = useServiciosResultCardTranslation({
    categoryLine: customCategoryLine,
    ownerAuthoredChips,
    lang,
    listingKey: ctaAnalyticsListingKey,
    enabled: true,
  });

  if (!profile) return null;

  /** Trade canonical card — preview + results share one stacked layout (no legacy CTA rail). */

  if (row && !previewProfile) {
    // ⚠️38A — routing reads the ORIGINAL stored category line, never the viewer-locale relabel.
    const template = resolveServiciosListingTemplate({
      businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
      internalGroup: row.internal_group,
      categoryLabel: row.profile_json.hero?.categoryLine,
    });
    if (isServiciosProfessionalTemplate(template)) {
      return <ServiciosProfessionalResultCard row={row} lang={lang} embedded density={density} />;
    }
  }

  const locationLine = serviciosTradePresentationLocationLine(profile, row);
  const logoUrl = (profile.hero.logoUrl || "").trim();
  const logoAlt = (profile.hero.logoAlt || "").trim() || profile.identity.businessName;
  const addressQuery = (profile.contact?.physicalAddressDisplay || "").trim();
  const mapsHref = ((profile.contact?.mapsSearchHref || "").trim() || (addressQuery ? mapsDirectionsHref(addressQuery) : "")).trim();

  const displayCategoryChip = displayCategoryLine ?? categoryChip;
  const displayServiceChips = serviceChipList.map((c) => chipOverrides.get(c) ?? c);

  const vitrinaHref =
    (publicDetailHref || "").trim() || `/clasificados/servicios/${encodeURIComponent(listingSlug)}?lang=${lang}`;
  const vitrinaLabel = (publicDetailLabel || "").trim() || (lang === "en" ? "View profile" : "Ver perfil");
  const servicesLabel = lang === "en" ? "Services" : "Servicios";
  const cardNavigateLabel =
    lang === "en"
      ? `View profile for ${profile.identity.businessName}`
      : `Ver perfil de ${profile.identity.businessName}`;

  const monetizationBadges = row ? getServiciosPublicMonetizationBadges(row, lang).slice(0, 3) : [];

  const ratingValue =
    typeof profile.hero.rating === "number" && Number.isFinite(profile.hero.rating) ? profile.hero.rating : undefined;
  const reviewCount =
    typeof profile.hero.reviewCount === "number" && profile.hero.reviewCount > 0 ? profile.hero.reviewCount : undefined;

  const likeBadgeCount =
    row && typeof row.public_like_net_count === "number" && row.public_like_net_count > 0
      ? Math.floor(row.public_like_net_count)
      : 0;

  const endorsementCount =
    row && typeof row.public_endorsement_count === "number" && row.public_endorsement_count > 0
      ? Math.floor(row.public_endorsement_count)
      : 0;

  const [resolvedShareUrl, setResolvedShareUrl] = useState((listingShareUrl ?? "").trim());
  useEffect(() => {
    const fromProp = (listingShareUrl ?? "").trim();
    if (fromProp) {
      setResolvedShareUrl(fromProp);
      return;
    }
    if (!row?.slug || previewProfile) {
      setResolvedShareUrl("");
      return;
    }
    const rel = `/clasificados/servicios/${encodeURIComponent(row.slug)}?lang=${lang}`;
    setResolvedShareUrl(`${window.location.origin}${rel}`);
  }, [listingShareUrl, row?.slug, lang, previewProfile]);

  const persistListingEngagement = useMemo(() => {
    if (!row?.id?.trim()) return false;
    if (row.listing_status && row.listing_status !== SERVICIOS_LISTING_STATUS_PUBLISHED) return false;
    return Boolean(ctaAnalyticsListingKey.trim()) && Boolean(resolvedShareUrl.trim());
  }, [ctaAnalyticsListingKey, resolvedShareUrl, row]);

  const showEngagementControls = Boolean(ctaAnalyticsListingKey.trim());

  const officeTel = (profile.contact.phoneOfficeTelHref || "").trim();
  const officeDisplay = (profile.contact.phoneOfficeDisplay || "").trim();
  const tel = (profile.contact.phoneTelHref || "").trim();
  const phoneDisplay = (profile.contact.phoneDisplay || "").trim();
  const primaryCall = officeTel && officeDisplay ? { href: officeTel, label: L.callOffice, key: "callOffice" } : tel && phoneDisplay ? { href: tel, label: L.call, key: "call" } : null;
  const wa = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const showDirections = Boolean(mapsHref && (addressQuery || /^https?:\/\//i.test(mapsHref)));

  return (
    <>
      <article
        className={`${LX_IVORY_CARD} relative w-full min-w-0 ${className}`.trim()}
        data-servicios-card-shell="trade-canonical"
      >
        <ServiciosResultCardBodyLink
          href={vitrinaHref}
          ariaLabel={cardNavigateLabel}
          onNavigate={onCardNavigate}
        />

        <div className="relative z-[2] flex items-start justify-between gap-2 p-4 sm:gap-3 sm:p-5" data-servicios-card-header="1">
          <div className="pointer-events-none flex min-w-0 flex-1 gap-3 sm:gap-4">
            <ServiciosAdaptiveLogoPlate
              src={logoUrl}
              alt={logoAlt}
              fallbackMonogram={profile.identity.businessName}
              variant="card"
              className=""
            />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1">
                {monetizationBadges.map((b) => (
                  <span
                    key={b.key}
                    className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      b.key === "destacado" || b.key === "patrocinado"
                        ? "border-[#C9A84A]/50 bg-[#F5F0E8] text-[#3B2117]"
                        : b.key === "verificado_leonix"
                          ? "border-emerald-400/60 bg-emerald-50 text-emerald-950"
                          : "border-[#D4C4A8] bg-[#FFFCF7] text-[#5a4630]"
                    }`}
                  >
                    {b.label}
                  </span>
                ))}
                {!showEngagementControls ? (
                  <ServiciosLikeCountBadge count={likeBadgeCount} lang={lang} />
                ) : null}
              </div>

              <h2 className={LX_COMPACT_CARD_TITLE}>
                {profile.identity.businessName}
              </h2>

              {displayCategoryChip ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6F6254] sm:text-[11px]">{displayCategoryChip}</p>
              ) : null}

              {locationLine ? (
                <p className="flex items-start gap-1.5 text-[11px] text-[#4A4A4A] sm:text-xs">
                  <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
                  <span className="line-clamp-2">{locationLine}</span>
                </p>
              ) : null}

              {ratingValue != null && ratingValue > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <StarRow rating={ratingValue} lang={lang} />
                  {reviewCount != null ? (
                    <span className="text-[11px] font-semibold text-[#6F6254]">{L.reviewsSuffix(reviewCount)}</span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {translateControl ? (
            <div className="pointer-events-auto shrink-0" data-servicios-card-translate-utility="1">
              {translateControl}
            </div>
          ) : null}
        </div>

        {displayServiceChips.length > 0 ? (
          <div className="pointer-events-none relative z-[2] px-4 pb-3 sm:px-5">
            <ServiciosServiceChipsRow
              chips={displayServiceChips}
              lang={lang}
              profileHref={vitrinaHref}
              servicesLabel={servicesLabel}
            />
          </div>
        ) : null}

        <div
          className={`${SERVICIOS_RESULT_CARD_INTERACTIVE} border-t border-[#E8D9C4]/80 px-4 py-3 sm:px-5 sm:py-4`}
          data-servicios-card-cta-stack="1"
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {primaryCall ? (
                <button
                  type="button"
                  className={LX_CTA_CARD_PRIMARY_FLEX}
                  style={{ backgroundColor: LX.burgundy, boxShadow: "0 4px 12px rgba(92, 22, 34, 0.2)" }}
                  onClick={() => openContactKey(primaryCall.key, primaryCall.href)}
                >
                  <FiPhone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {primaryCall.label}
                </button>
              ) : null}
              {wa ? (
                <button
                  type="button"
                  className={LX_CTA_CARD_WHATSAPP}
                  style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
                  onClick={() => openContactKey("whatsapp", wa)}
                >
                  <FaWhatsapp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {L.whatsapp}
                </button>
              ) : null}
              {showDirections ? (
                <button
                  type="button"
                  className={LX_CTA_CARD_MAP}
                  onClick={() => openContactKey("maps", mapsHref)}
                >
                  <FiMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {lang === "en" ? "Directions" : "Cómo llegar"}
                </button>
              ) : null}
              {!primaryCall && !wa && (profile.contact.emailMailtoHref || profile.contact.websiteHref) ? (
                <>
                  {profile.contact.websiteHref ? (
                    <button
                      type="button"
                      className={LX_CTA_CARD_SECONDARY}
                      onClick={() => openContactKey("website", profile.contact.websiteHref!)}
                    >
                      <FiGlobe className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {L.visitWebsite}
                    </button>
                  ) : null}
                  {profile.contact.emailMailtoHref ? (
                    <button
                      type="button"
                      className={LX_CTA_CARD_SECONDARY}
                      onClick={() => openContactKey("email", profile.contact.emailMailtoHref!)}
                    >
                      <FiMail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {L.email}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2" data-servicios-card-trust-strip="1">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D7B8] bg-[#FFF9F2] px-2.5 py-1 text-[10px] font-bold text-[#7A1E2C] sm:text-[11px]">
                🦁 {lang === "en" ? "Leonix Community" : "Comunidad Leonix"}
                {" · "}
                {endorsementCount > 0
                  ? lang === "en"
                    ? `${endorsementCount} recognition${endorsementCount === 1 ? "" : "s"}`
                    : `${endorsementCount} reconocimiento${endorsementCount === 1 ? "" : "s"}`
                  : lang === "en"
                    ? "New"
                    : "Nuevo"}
              </span>

              <ServiciosResultCardEngagementStrip
                listingId={ctaAnalyticsListingKey}
                ownerUserId={row?.owner_user_id ?? null}
                listingTitle={profile.identity.businessName}
                listingShareUrl={resolvedShareUrl || undefined}
                listingSlug={listingSlug}
                listingSourceId={row?.id ?? null}
                lang={lang}
                publicLikeCount={likeBadgeCount}
                showEngagementControls={showEngagementControls}
                persistListingEngagement={persistListingEngagement}
              />
            </div>

            <Link
              href={vitrinaHref}
              onClick={() => {
                if (row) trackServiciosResultCardClick(row);
              }}
              className={LX_CTA_CARD_SECONDARY}
              data-servicios-card-profile-nav="1"
            >
              {vitrinaLabel}
            </Link>

            {discoveryRefineHref?.trim() && discoveryRefineLabel?.trim() ? (
              <Link
                href={discoveryRefineHref}
                className="text-center text-xs font-semibold text-[#6F6254] underline underline-offset-4 hover:text-[#2A2620]"
              >
                {discoveryRefineLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </article>
    </>
  );
}
