"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FiGlobe, FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { serviciosEngagementListingKey } from "../lib/serviciosPublicListingSort";
import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile";
import { getServiciosProfileLabels } from "@/app/servicios/copy/serviciosProfileCopy";
import { getServiciosPublicMonetizationBadges } from "../lib/serviciosDestacados";
import type { ServiciosProfileResolved } from "@/app/(site)/servicios/types/serviciosBusinessProfile";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import {
  buildServiciosSendEmailIntentFromMailto,
  extractWaMeDigitsFromHref,
  serviciosContactShareExtras,
  serviciosAnalyticsTrackMeta,
  trackServiciosListingCta,
  trackServiciosResultCardClick,
} from "@/app/(site)/servicios/lib/serviciosCtaIntents";
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
import {
  LX,
  LX_COMPACT_CARD_TITLE,
  LX_CTA_CARD_MAP,
  LX_CTA_CARD_OUTLINE,
  LX_CTA_CARD_PRIMARY,
  LX_CTA_CARD_SECONDARY,
  LX_CTA_CARD_WHATSAPP,
  LX_IVORY_CARD,
  cleanProfessionalChipLabel,
  isWeakProfessionalChipLabel,
} from "@/app/(site)/servicios/components/serviciosLeonixBrand";
import { formatServiciosPublicLocationLine } from "../lib/formatServiciosPublicLocationLine";
import { SERVICIOS_LISTING_STATUS_PUBLISHED } from "../lib/serviciosListingLifecycle";
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

function mapsSearchHref(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
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

  const profile = useMemo((): ServiciosProfileResolved | null => {
    if (previewProfile) return previewProfile;
    if (!row) return null;
    const wire = { ...row.profile_json };
    wire.identity = { ...wire.identity, leonixVerified: row.leonix_verified === true };
    if ((row.review_rating_count ?? 0) > 0 && typeof row.review_rating_avg === "number" && Number.isFinite(row.review_rating_avg)) {
      wire.hero = {
        ...wire.hero,
        rating: row.review_rating_avg,
        reviewCount: row.review_rating_count ?? undefined,
      };
    }
    return resolveServiciosProfile(wire, lang);
  }, [previewProfile, row, lang]);

  const listingSlug = useMemo(() => {
    if (!profile) return (row?.slug || "").trim();
    return (row?.slug || "").trim() || profile.identity.slug;
  }, [row, profile]);

  const ctaAnalyticsListingKey = useMemo(() => {
    if (row) return serviciosEngagementListingKey(row);
    return listingSlug;
  }, [row, listingSlug]);

  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  const closeCta = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

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

  const openOutbound = useCallback(
    (intent: CtaSheetIntent, eventType: string) => {
      trackServiciosListingCta(listingSlug || ctaAnalyticsListingKey, eventType, ctaTrackMeta);
      setCtaIntent(intent);
      setCtaOpen(true);
    },
    [ctaAnalyticsListingKey, ctaTrackMeta, listingSlug],
  );

  const contactExtras = useMemo(() => {
    if (!profile) return { email: undefined, websiteUrl: undefined, publicUrl: undefined };
    return serviciosContactShareExtras(profile, listingSlug, listingShareUrl);
  }, [profile, listingSlug, listingShareUrl]);

  const openContactKey = useCallback(
    (key: string, href: string) => {
      if (!profile) return;
      if (key === "maps") {
        openOutbound(
          { kind: "directions", addressOrUrl: href, isMapsUrl: /^https?:\/\//i.test(href), contactShareExtras: contactExtras },
          "cta_maps_click",
        );
        return;
      }
      if (key === "website") {
        openOutbound({ kind: "website", url: href }, "cta_website_click");
        return;
      }
      if (key === "whatsapp") {
        const d = extractWaMeDigitsFromHref(href);
        if (d.replace(/\D/g, "").length < 8) return;
        let message = "";
        try {
          const abs = /^https?:\/\//i.test(href) ? href : `https://${href.replace(/^\/\//, "")}`;
          const u = new URL(abs);
          const rawText = u.searchParams.get("text");
          if (rawText) {
            try {
              message = decodeURIComponent(rawText.replace(/\+/g, "%20"));
            } catch {
              message = rawText.replace(/\+/g, " ");
            }
          }
        } catch {
          message = "";
        }
        openOutbound(
          { kind: "send_message", message, phone: d, whatsappDigits: d, contactShareExtras: contactExtras },
          "cta_whatsapp_click",
        );
        return;
      }
      if (key === "email") {
        const intent = buildServiciosSendEmailIntentFromMailto(href, lang, listingSlug, listingShareUrl);
        if (!intent) return;
        openOutbound(intent, "cta_email_click");
        return;
      }
      if (key === "call" || key === "callOffice") {
        const raw = href.replace(/^tel:/i, "").trim();
        openOutbound({ kind: "call", phone: raw, contactShareExtras: contactExtras }, "cta_call_click");
      }
    },
    [contactExtras, lang, listingShareUrl, listingSlug, openOutbound, profile],
  );

  const onCardNavigate = useCallback(() => {
    if (row) trackServiciosResultCardClick(row);
  }, [row]);

  if (!profile) return null;

  const isCompact = density === "compact";

  if (row && !previewProfile) {
    const template = resolveServiciosListingTemplate({
      businessTypeId: readServiciosProfileBusinessTypeId(row.profile_json),
      internalGroup: row.internal_group,
      categoryLabel: profile.hero.categoryLine,
    });
    if (isServiciosProfessionalTemplate(template)) {
      return <ServiciosProfessionalResultCard row={row} lang={lang} embedded density={density} />;
    }
  }

  const cityFallback = (row?.city || "").trim();
  const structuredLocation = row ? formatServiciosPublicLocationLine(row) : "";
  const logoUrl = (profile.hero.logoUrl || "").trim();
  const logoAlt = (profile.hero.logoAlt || "").trim() || profile.identity.businessName;
  const categoryChip = cleanOtherLabel((profile.hero.categoryLine || "").trim());
  const locationLine =
    structuredLocation ||
    (profile.hero.locationSummary || "").trim() ||
    cityFallback;
  const addressQuery = (profile.contact?.physicalAddressDisplay || "").trim();
  const mapsHref = ((profile.contact?.mapsSearchHref || "").trim() || (addressQuery ? mapsSearchHref(addressQuery) : "")).trim();

  const serviceChipList = (() => {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const s of profile.services) {
      const c = cleanProfessionalChipLabel(cleanOtherLabel(s.title));
      if (!c || isWeakProfessionalChipLabel(c)) continue;
      const key = c.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  })();
  const displayServiceChips =
    isCompact && serviceChipList.length > 3
      ? [...serviceChipList.slice(0, 3), `+${serviceChipList.length - 3}`]
      : serviceChipList;

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
        className={`${LX_IVORY_CARD} relative w-full min-w-0 ${
          isCompact ? "sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(9.25rem,auto)] sm:items-stretch" : ""
        } ${className}`.trim()}
      >
        <ServiciosResultCardBodyLink
          href={vitrinaHref}
          ariaLabel={cardNavigateLabel}
          onNavigate={onCardNavigate}
        />

        <div className={isCompact ? "pointer-events-none relative z-[2] flex gap-2.5 p-2.5 sm:col-start-1 sm:row-start-1 sm:items-center sm:p-3 sm:pb-1.5" : "pointer-events-none relative z-[2] flex gap-3 p-4 sm:gap-4 sm:p-5"}>
          <ServiciosAdaptiveLogoPlate
            src={logoUrl}
            alt={logoAlt}
            fallbackMonogram={profile.identity.businessName}
            variant="card"
            className={isCompact ? "!h-12 !w-12 sm:!h-14 sm:!w-14" : ""}
          />

          <div className={isCompact ? "min-w-0 flex-1 space-y-0.5" : "min-w-0 flex-1 space-y-1"}>
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
              <ServiciosLikeCountBadge count={likeBadgeCount} lang={lang} />
            </div>

            <h2 className={isCompact ? "font-serif text-[14px] font-semibold leading-snug tracking-tight text-[#1E1814] sm:text-[15px]" : LX_COMPACT_CARD_TITLE}>
              {profile.identity.businessName}
            </h2>

            {categoryChip ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#6F6254] sm:text-[11px]">{categoryChip}</p>
            ) : null}

            {locationLine ? (
              <p className="flex items-start gap-1.5 text-[11px] text-[#4A4A4A] sm:text-xs">
                <FiMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#C9A84A]" aria-hidden />
                <span className={isCompact ? "line-clamp-1" : "line-clamp-2"}>{locationLine}</span>
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

        {displayServiceChips.length > 0 ? (
          <div className={isCompact ? "pointer-events-none relative z-[2] px-2.5 pb-2 sm:col-start-1 sm:row-start-2 sm:px-3" : "pointer-events-none relative z-[2] px-4 pb-3 sm:px-5"}>
            <ServiciosServiceChipsRow
              chips={displayServiceChips}
              lang={lang}
              profileHref={vitrinaHref}
              servicesLabel={servicesLabel}
            />
          </div>
        ) : null}

        <div
          className={`${SERVICIOS_RESULT_CARD_INTERACTIVE} ${isCompact ? "border-t border-[#E8D9C4]/80 px-2.5 py-2 sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:flex sm:items-center sm:border-l sm:border-t-0 sm:px-3" : "border-t border-[#E8D9C4]/80 px-4 py-3 sm:px-5 sm:py-4"}`}
        >
          <div className={isCompact ? "flex flex-wrap gap-2 sm:w-[9.25rem] sm:flex-col sm:items-stretch sm:justify-center sm:gap-1.5" : "flex flex-col gap-2"}>
            {primaryCall ? (
              <button
                type="button"
                className={`${LX_CTA_CARD_PRIMARY} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}
                style={{ backgroundColor: LX.burgundy, boxShadow: "0 4px 12px rgba(92, 22, 34, 0.2)" }}
                onClick={() => openContactKey(primaryCall.key, primaryCall.href)}
              >
                <FiPhone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {primaryCall.label}
              </button>
            ) : null}

            <div className={isCompact ? "flex flex-wrap gap-2 sm:flex-col sm:gap-1.5" : "flex flex-wrap gap-2"}>
              {wa ? (
                <button
                  type="button"
                  className={`${LX_CTA_CARD_WHATSAPP} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}
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
                  className={`${LX_CTA_CARD_MAP} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}
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

            <Link
              href={vitrinaHref}
              onClick={() => {
                if (row) trackServiciosResultCardClick(row);
              }}
              className={`${LX_CTA_CARD_OUTLINE} ${isCompact ? "sm:!min-h-[30px] sm:!w-full sm:flex-none sm:!px-2 sm:!py-1.5 sm:!text-[11px]" : ""}`.trim()}
            >
              {vitrinaLabel}
            </Link>

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
      <CtaActionSheet open={ctaOpen} onClose={closeCta} intent={ctaIntent} lang={lang} />
    </>
  );
}
