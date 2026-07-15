"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import type { ServiciosPublicListingRow } from "./lib/serviciosPublicListingsServer";
import { serviciosEngagementListingKey } from "./lib/serviciosPublicListingSort";
import {
  serviciosAnalyticsTrackMeta,
  trackServiciosListingCta,
  trackServiciosResultCardClick,
} from "@/app/(site)/servicios/lib/serviciosCtaIntents";
import {
  serviciosOpenGoogleMapsDirections,
  serviciosOpenTelHref,
  serviciosOpenWhatsAppHref,
} from "@/app/(site)/servicios/lib/serviciosDirectCta";
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
  LX_CTA_CARD_WHATSAPP,
  LX_IVORY_CARD,
  collectHeroTrustChips,
  collectProfessionalServiceChips,
  getPrimaryCtaLabel,
  getServicesTitle,
  hasPhysicalAddress,
} from "@/app/servicios/components/serviciosLeonixBrand";

function getProfileCtaSecondary(_template: ServiciosListingTemplate, lang: ServiciosLang): string {
  return lang === "en" ? "View profile" : "Ver perfil";
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
  const profile = resolveServiciosProfile(wire, lang);

  const template = resolveServiciosListingTemplate({
    businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
    internalGroup: row.internal_group,
    categoryLabel: profile.hero.categoryLine,
  });
  const primaryLabel = getPrimaryCtaLabel(template, lang);
  const secondaryLabel = getProfileCtaSecondary(template, lang);
  const servicesLabel = getServicesTitle(template, lang);

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
  const tel = profile.contact.phoneTelHref;
  const waHrefNormalized = resolveServiciosProfileDirectWhatsAppHref(profile.contact) ?? "";
  const promoted = isServiciosListingPromoted(row);
  const showDirections = hasPhysicalAddress(profile);
  const serviceChips = useMemo(() => collectProfessionalServiceChips(profile, 12), [profile]);
  const trustChips = useMemo(() => collectHeroTrustChips(profile, 3), [profile]);
  const allChips = useMemo(() => [...serviceChips, ...trustChips], [serviceChips, trustChips]);

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

  const [listingShareUrl, setListingShareUrl] = useState("");
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

  const onCardNavigate = useCallback(() => {
    trackServiciosResultCardClick(row);
  }, [row]);

  const cardNavigateLabel =
    lang === "en"
      ? `View profile for ${profile.identity.businessName}`
      : `Ver perfil de ${profile.identity.businessName}`;

  const cardSurface = promoted
    ? `${LX_IVORY_CARD} ring-2 ring-[#C9A84A]/30 border-[#C9A84A]/55`
    : LX_IVORY_CARD;
  const isCompact = density === "compact";
  const displayChips = isCompact && allChips.length > 3 ? [...allChips.slice(0, 3), `+${allChips.length - 3}`] : allChips;

  const body = (
    <>
      <article
        className={`${cardSurface} relative ${
          isCompact ? "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(9.25rem,auto)] sm:items-stretch" : ""
        }`.trim()}
      >
        <ServiciosResultCardBodyLink href={href} ariaLabel={cardNavigateLabel} onNavigate={onCardNavigate} />

        <div className={isCompact ? "pointer-events-none relative z-[2] flex gap-2.5 p-2.5 sm:col-start-1 sm:row-start-1 sm:items-center sm:p-3 sm:pb-1.5" : "pointer-events-none relative z-[2] flex gap-3 p-4 sm:gap-4 sm:p-5"}>
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
                  {lang === "en" ? "Featured" : "Destacado"}
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
                  {lang === "en" ? "Verified" : "Verificado"}
                </span>
              ) : null}
              {!showEngagementControls ? (
                <ServiciosLikeCountBadge count={likeBadgeCount} lang={lang} />
              ) : null}
            </div>

            <h3 className={isCompact ? "font-serif text-[14px] font-semibold leading-snug tracking-tight text-[#1E1814] sm:text-[15px]" : LX_COMPACT_CARD_TITLE}>
              {profile.identity.businessName}
            </h3>

            {category ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6F6254] sm:text-[11px]">{category}</p>
            ) : null}

            {location ? (
              <p className="flex items-start gap-1.5 text-[11px] text-[#4A4A4A] sm:text-xs">
                <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
                <span className={isCompact ? "line-clamp-1" : "line-clamp-2"}>{location}</span>
              </p>
            ) : null}

            {ratingValue != null ? (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <StarRow rating={ratingValue} lang={lang} />
                {reviewCount != null ? (
                  <span className="text-[11px] font-semibold text-[#6F6254]">
                    ({reviewCount} {lang === "en" ? "reviews" : "reseñas"})
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {displayChips.length > 0 ? (
          <div className={isCompact ? "pointer-events-none relative z-[2] px-2.5 pb-2 sm:col-start-1 sm:row-start-2 sm:px-3" : "pointer-events-none relative z-[2] px-4 pb-3 sm:px-5"}>
            <ServiciosServiceChipsRow
              chips={displayChips}
              lang={lang}
              profileHref={href}
              servicesLabel={servicesLabel}
            />
          </div>
        ) : null}

        <div
          className={`${SERVICIOS_RESULT_CARD_INTERACTIVE} ${isCompact ? "border-t border-[#E8D9C4]/80 px-2.5 py-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:flex sm:items-center sm:border-l sm:border-t-0 sm:px-3" : "border-t border-[#E8D9C4]/80 px-4 py-3 sm:px-5 sm:py-4"}`}
        >
          <div className={isCompact ? "flex flex-wrap gap-2 sm:w-[9.25rem] sm:flex-col sm:items-stretch sm:justify-center sm:gap-1.5" : "flex flex-col gap-2"}>
            {tel ? (
              <button
                type="button"
                onClick={onCallClick}
                className={`${LX_CTA_CARD_PRIMARY} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}
                style={{ backgroundColor: LX.burgundy, boxShadow: "0 4px 12px rgba(92, 22, 34, 0.2)" }}
              >
                <FiPhone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {primaryLabel}
              </button>
            ) : null}
            <div className={isCompact ? "flex flex-wrap gap-2 sm:flex-col sm:gap-1.5" : "flex flex-wrap gap-2"}>
              {waHrefNormalized ? (
                <button
                  type="button"
                  onClick={onWhatsAppClick}
                  className={`${LX_CTA_CARD_WHATSAPP} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}
                  style={{ backgroundColor: LX.whatsApp, boxShadow: LX.whatsAppShadow }}
                >
                  <FaWhatsapp className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  WhatsApp
                </button>
              ) : null}
              {showDirections ? (
                <button type="button" onClick={onDirectionsClick} className={`${LX_CTA_CARD_MAP} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}>
                  <FiMapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {lang === "en" ? "Directions" : "Cómo llegar"}
                </button>
              ) : null}
            </div>
            <Link
              href={href}
              onClick={() => trackServiciosResultCardClick(row)}
              className={`${LX_CTA_CARD_OUTLINE} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}
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
              lang={lang}
              publicLikeCount={likeBadgeCount}
              showEngagementControls={showEngagementControls}
              persistListingEngagement={persistListingEngagement}
            />
          </div>
        </div>
      </article>
    </>
  );

  if (embedded) return body;
  return <li>{body}</li>;
}
