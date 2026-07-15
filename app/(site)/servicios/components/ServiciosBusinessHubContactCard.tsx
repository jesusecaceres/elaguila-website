"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  FiClock,
  FiCopy,
  FiGlobe,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiZap,
} from "react-icons/fi";
import { FaStar, FaWhatsapp } from "react-icons/fa";
import type { ServiciosLang, ServiciosProfileResolved } from "../types/serviciosBusinessProfile";
import { getServiciosProfileLabels } from "../copy/serviciosProfileCopy";
import { nonEmpty } from "../lib/serviciosProfilePrimitives";
import {
  resolveServiciosQuoteDestination,
  serviciosUniversalQuoteMessage,
  type ServiciosQuoteDestinationKind,
} from "../lib/serviciosContactActions";
import {
  serviciosAnalyticsTrackMeta,
  trackServiciosListingCta,
} from "../lib/serviciosCtaIntents";
import {
  serviciosOpenGoogleMapsDirections,
  serviciosOpenMailtoHref,
  serviciosOpenTelHref,
  serviciosOpenWhatsAppHref,
} from "../lib/serviciosDirectCta";
import {
  mapServiciosProfileToBusinessHubContact,
  serviciosBusinessHubHasVisibleContent,
} from "../lib/mapServiciosProfileToBusinessHubContact";
import type {
  ServiciosBusinessHubSocialLink,
} from "../lib/serviciosBusinessHubContactTypes";
import {
  BusinessHubSocialBrandIcon,
  businessHubSocialBrandStyle,
} from "../lib/serviciosBusinessHubSocialBrand";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { ServiciosBusinessHubEngagementRow } from "./ServiciosBusinessHubEngagementRow";
import { ServiciosBusinessHubMapPanel } from "./ServiciosBusinessHubMapPanel";
import { ServiciosActionPanelAreasMap } from "./ServiciosActionPanelAreasMap";
import { ServiciosOfferCard } from "./ServiciosOfferCard";
import { ContactEmailMenu } from "@/app/components/contact/ContactEmailMenu";
import { ServiciosHubReviewLinkButton } from "./ServiciosHubReviewLinkButton";
import {
  SCH_COMPACT_CTA,
  SCH_CTA_PRIMARY,
  SCH_CTA_SECONDARY,
  SCH_CTA_WHATSAPP,
  SCH_HUB_CARD,
  SCH_LX,
  SCH_LINK_CARD,
  SCH_MAP_WRAP,
  SCH_PRIMARY_GRID,
  SCH_SECONDARY_GRID,
  SCH_SOCIAL_CHIP,
} from "../lib/serviciosContactHubLeonix";
import {
  SVC_SECTION_CARD,
  SVC_SECTION_PADDING,
  SVC_SECTION_TITLE,
} from "../lib/serviciosShellSectionTokens";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { resolveProfessionalHubQuoteCtaLabel } from "./serviciosLeonixBrand";

const HUB_GOLD = SCH_LX.gold;

function analyticsForQuoteKind(kind: ServiciosQuoteDestinationKind): string {
  if (kind === "sms") return "cta_quote_sms_click";
  if (kind === "whatsapp") return "cta_whatsapp_click";
  if (kind === "tel") return "cta_call_click";
  if (kind === "mailto") return "cta_email_click";
  return "cta_website_click";
}

function emailFromMailtoHref(href: string): string {
  const h = href.trim();
  if (!h.toLowerCase().startsWith("mailto:")) return "";
  try {
    return decodeURIComponent(h.slice(7).split(/[?#]/)[0] ?? "");
  } catch {
    return h.slice(7).split(/[?#]/)[0] ?? "";
  }
}

function socialHeadline(platform: ServiciosBusinessHubSocialLink["platform"]): string {
  const map: Record<ServiciosBusinessHubSocialLink["platform"], string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    x: "X",
    youtube: "YouTube",
    linkedin: "LinkedIn",
    snapchat: "Snapchat",
    pinterest: "Pinterest",
    whatsapp: "WhatsApp",
  };
  return map[platform];
}

function cleanHubLinkLabel(label: string, url: string, lang: ServiciosLang): string {
  const trimmed = label.trim().replace(/\s+/g, " ").replace(/\s+\./g, ".");
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    host = "";
  }
  const fallback = host || (lang === "en" ? "Website" : "Sitio web");
  const weak = trimmed.toLowerCase();
  if (
    !trimmed ||
    weak === "website" ||
    weak === "sitio web" ||
    weak === "aol website" ||
    weak === "aol website." ||
    weak === "additional link" ||
    weak === "enlace adicional"
  ) {
    return fallback;
  }
  return trimmed;
}

function HubSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-[#E8D9C4]/80 pb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1E1814] sm:text-sm">
      {children}
    </h3>
  );
}

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* silent */ }
  }, [value]);
  return (
    <button
      type="button"
      onClick={copy}
      className="ml-1.5 inline-flex h-6 w-6 items-center justify-center rounded text-[color:var(--lx-text-2)] transition hover:text-[color:var(--lx-text)]"
      aria-label="Copy"
      title="Copy"
    >
      {copied ? (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <FiCopy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

type ContactAction = { id: string; label: string; onClick: () => void; icon: ReactNode };

/**
 * Servicios Business Hub contact card — light Leonix surface, navy/gold CTAs.
 * Renders only sections backed by existing published profile data.
 */
export function ServiciosBusinessHubContactCard({
  profile,
  lang,
  listingSlug,
  listingSourceId = null,
  listingShareUrl,
  engagementListingId = null,
  engagementOwnerUserId = null,
  showEngagementControls = true,
  persistListingEngagement = false,
  publicLikeCount,
  directContactFasterResponseHint = false,
  showOfferSidebarTeaser = true,
  listingTemplate,
  hubEngagementVariant = "full",
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  /** When set (professional preview/profile), hub quote CTA uses template-aware copy. */
  listingTemplate?: ServiciosListingTemplate;
  listingSlug?: string;
  /** `servicios_public_listings.id` for global analytics (SVC1). */
  listingSourceId?: string | null;
  listingShareUrl?: string;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  showEngagementControls?: boolean;
  persistListingEngagement?: boolean;
  publicLikeCount?: number;
  directContactFasterResponseHint?: boolean;
  showOfferSidebarTeaser?: boolean;
  hubEngagementVariant?: "full" | "save_only";
}) {
  const L = getServiciosProfileLabels(lang);
  const vm = useMemo(() => mapServiciosProfileToBusinessHubContact(profile, lang), [profile, lang]);

  const analyticsBase = useMemo(
    () =>
      serviciosAnalyticsTrackMeta({
        listingSlug,
        sourceId: listingSourceId,
        engagementListingId,
        ownerUserId: engagementOwnerUserId,
        source: "business_hub",
      }),
    [listingSlug, listingSourceId, engagementListingId, engagementOwnerUserId],
  );

  const hours = profile.contact.hours;
  const quoteEarly = resolveServiciosQuoteDestination(profile, lang);
  const showPrimaryQuoteEarly =
    quoteEarly &&
    ((quoteEarly.kind === "mailto" && quoteEarly.href) ||
      quoteEarly.kind === "sms" ||
      quoteEarly.kind === "whatsapp");

  if (
    !serviciosBusinessHubHasVisibleContent(vm, {
      hasPrimaryQuote: Boolean(showPrimaryQuoteEarly),
      hasHours: Boolean(hours?.weeklyRows?.length || (hours?.openNowLabel && hours?.todayHoursLine)),
      isFeatured: Boolean(profile.contact.isFeatured),
    })
  ) {
    return null;
  }

  const quote = resolveServiciosQuoteDestination(profile, lang);
  const quoteMsgText = serviciosUniversalQuoteMessage(lang);
  const primaryCtaLabel = resolveProfessionalHubQuoteCtaLabel(
    profile.contact.primaryCtaLabel,
    listingTemplate,
    lang,
    L.requestQuote,
  );
  const primaryMailto = quote?.kind === "mailto" ? quote.href : null;
  const primaryEmailAddr =
    profile.contact.email?.trim() ||
    (profile.contact.emailMailtoHref ? emailFromMailtoHref(profile.contact.emailMailtoHref) : "") ||
    (primaryMailto ? emailFromMailtoHref(primaryMailto) : "");
  const rating = profile.hero.rating;
  const reviewCount = profile.hero.reviewCount;
  const featured = profile.contact.isFeatured;
  const featuredLabel = profile.contact.featuredLabel?.trim() || L.featured;

  const openPrimaryQuote = () => {
    if (!quote) return;
    if (quote.kind === "sms" && quote.href) {
      trackServiciosListingCta(listingSlug, analyticsForQuoteKind("sms"), { ...analyticsBase, source: "business_hub" });
      window.location.href = quote.href;
      return;
    }
    if (quote.kind === "whatsapp" && quote.href) {
      trackServiciosListingCta(listingSlug, analyticsForQuoteKind("whatsapp"), { ...analyticsBase, source: "business_hub" });
      serviciosOpenWhatsAppHref(quote.href);
    }
  };

  const openPrimaryMailto = () => {
    if (!primaryMailto) return;
    trackServiciosListingCta(listingSlug, analyticsForQuoteKind("mailto"), { ...analyticsBase, source: "business_hub" });
    serviciosOpenMailtoHref(primaryMailto);
  };

  const openCall = () => {
    const href = profile.contact.phoneTelHref?.trim();
    if (!href) return;
    trackServiciosListingCta(listingSlug, "cta_call_click", { ...analyticsBase, source: "business_hub" });
    serviciosOpenTelHref(href);
  };

  const openMessage = () => {
    const href = vm.contact.messageSmsHref;
    if (!href) return;
    trackServiciosListingCta(listingSlug, "cta_quote_sms_click", { ...analyticsBase, source: "business_hub" });
    window.location.href = href;
  };

  const openWhatsApp = () => {
    const href = vm.contact.whatsappHref;
    if (!href) return;
    trackServiciosListingCta(listingSlug, "cta_whatsapp_click", { ...analyticsBase, source: "business_hub" });
    serviciosOpenWhatsAppHref(href);
  };

  const openEmail = () => {
    const mailto = vm.contact.emailMailto;
    if (!mailto) return;
    trackServiciosListingCta(listingSlug, "cta_email_click", { ...analyticsBase, source: "business_hub" });
    serviciosOpenMailtoHref(mailto);
  };

  const openSocialOutbound = (url: string, _headline: string) => {
    trackServiciosListingCta(listingSlug, "cta_website_click", { ...analyticsBase, source: "business_hub" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openLink = (url: string) => {
    trackServiciosListingCta(listingSlug, "cta_website_click", { ...analyticsBase, source: "business_hub" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openDirections = (addressOrUrl: string, isMapsUrl: boolean) => {
    trackServiciosListingCta(listingSlug, "cta_maps_click", { ...analyticsBase, source: "business_hub" });
    serviciosOpenGoogleMapsDirections(addressOrUrl, isMapsUrl);
  };

  const contactActions: ContactAction[] = [];
  if (profile.contact.phoneTelHref) {
    contactActions.push({
      id: "call",
      label: lang === "en" ? "Call" : "Llamar",
      onClick: openCall,
      icon: <FiPhone className="h-5 w-5 shrink-0 text-current" aria-hidden />,
    });
  }
  if (vm.contact.messageSmsHref) {
    contactActions.push({
      id: "message",
      label: lang === "en" ? "Message" : "Mensaje",
      onClick: openMessage,
      icon: <FiMessageSquare className="h-5 w-5 shrink-0 text-current" aria-hidden />,
    });
  }
  if (vm.contact.whatsappHref) {
    contactActions.push({
      id: "whatsapp",
      label: "WhatsApp",
      onClick: openWhatsApp,
      icon: <FaWhatsapp className="h-5 w-5 shrink-0 text-current" aria-hidden />,
    });
  }
  if (vm.contact.emailMailto) {
    contactActions.push({
      id: "email",
      label: lang === "en" ? "Email" : "Correo",
      onClick: openEmail,
      icon: <FiMail className="h-5 w-5 shrink-0 text-current" aria-hidden />,
    });
  }

  const labels = {
    contact: lang === "en" ? "Contact us" : "Contáctanos",
    reviews: lang === "en" ? "Reviews" : "Opiniones",
    social: lang === "en" ? "Follow us" : "Síguenos",
    find: lang === "en" ? "Find us online" : "Búscanos aquí",
    location: lang === "en" ? "Our location" : "Nuestra ubicación",
    hours: lang === "en" ? "Hours" : "Horarios",
    section: lang === "en" ? "Contact & location" : "Contacto y ubicación",
  };

  const callAction = contactActions.find((a) => a.id === "call");
  const gridContactActions = contactActions.filter((a) => a.id !== "call");
  const showContact = contactActions.length > 0;

  const contactGridClass =
    gridContactActions.length === 1
      ? "mt-2 grid max-w-full grid-cols-1 gap-2"
      : gridContactActions.length === 3
        ? "mt-2 grid grid-cols-2 gap-2 [&>*:last-child]:col-span-2"
        : "mt-2 grid grid-cols-2 gap-2";

  const showSocial = vm.social.length > 0;
  const showReviews = vm.reviews.length > 0;
  const showFindUs = vm.moreLinks.length > 0;
  const showSecondary = showReviews || showSocial || showFindUs;

  const showLocation = Boolean(
    vm.location?.addressDisplay?.trim() ||
      vm.location?.mapsHref ||
      vm.location?.mapEmbedSrc ||
      vm.location?.mapImageUrl,
  );

  const showHours = Boolean(
    hours?.weeklyRows?.length || (hours?.openNowLabel && nonEmpty(hours.todayHoursLine)),
  );

  const showPrimaryQuote =
    quote &&
    ((quote.kind === "mailto" && primaryMailto) ||
      quote.kind === "sms" ||
      quote.kind === "whatsapp");

  const openReviewLink = (link: (typeof vm.reviews)[number]) => {
    trackServiciosListingCta(listingSlug, "cta_review_click", { ...analyticsBase, source: "business_hub", reviewId: link.id });
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 md:gap-5">
      <section className={SVC_SECTION_CARD} aria-labelledby="servicios-contact-hub-heading">
        <div className={SVC_SECTION_PADDING}>
          <h2 id="servicios-contact-hub-heading" className={SVC_SECTION_TITLE}>
            {labels.section}
          </h2>

          <article className={SCH_HUB_CARD} data-servicios-business-hub="1">
            <div
              className="pointer-events-none -mx-4 -mt-4 mb-3 h-0.5 bg-gradient-to-r from-transparent via-[#C9A84A]/55 to-transparent sm:-mx-5 sm:-mt-5"
              aria-hidden
            />

            {featured || (rating != null && reviewCount != null) ? (
              <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-[#E8D9C4]/80 pb-2">
                {featured ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#D4C4A8] bg-[#F6EBDD] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#1E1814]">
                    <FaStar className="h-3 w-3 text-[#C9A84A]" aria-hidden />
                    {featuredLabel}
                  </span>
                ) : null}
                {rating != null && reviewCount != null ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#6F6254]">
                    <ServiciosStarRating value={rating} size="sm" />
                    {rating.toFixed(1)} ({reviewCount})
                  </span>
                ) : null}
              </div>
            ) : null}

            {showPrimaryQuote && quote?.kind === "mailto" && primaryMailto && primaryEmailAddr ? (
              <ContactEmailMenu
                email={primaryEmailAddr}
                mailtoHref={primaryMailto}
                messagePlain={quoteMsgText}
                lang={lang}
                listingSlug={listingSlug}
                listingSourceId={listingSourceId}
                engagementListingId={engagementListingId}
                ownerUserId={engagementOwnerUserId}
                analyticsEventType={analyticsForQuoteKind("mailto")}
                triggerClassName={`${SCH_CTA_PRIMARY} mb-3 justify-between`}
                triggerStyle={{ backgroundColor: SCH_LX.burgundy, boxShadow: "0 8px 22px rgba(92, 22, 34, 0.28)" }}
              >
                <FiZap className="h-4 w-4 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
                {primaryCtaLabel}
              </ContactEmailMenu>
            ) : showPrimaryQuote && quote?.kind === "mailto" && primaryMailto ? (
              <button
                type="button"
                className={`${SCH_CTA_PRIMARY} mb-3 w-full border-0`}
                style={{ backgroundColor: SCH_LX.burgundy, boxShadow: "0 8px 22px rgba(92, 22, 34, 0.28)" }}
                onClick={openPrimaryMailto}
              >
                <FiZap className="h-4 w-4 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
                {primaryCtaLabel}
              </button>
            ) : showPrimaryQuote && quote && (quote.kind === "sms" || quote.kind === "whatsapp") ? (
              <button
                type="button"
                className={`${SCH_CTA_PRIMARY} mb-3 w-full border-0`}
                style={{ backgroundColor: SCH_LX.burgundy, boxShadow: "0 8px 22px rgba(92, 22, 34, 0.28)" }}
                onClick={openPrimaryQuote}
              >
                <FiZap className="h-4 w-4 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
                {primaryCtaLabel}
              </button>
            ) : null}

            <div className={SCH_PRIMARY_GRID}>
              {showContact ? (
                <section aria-labelledby="hub-contact-heading" className="min-w-0">
                  <HubSectionTitle>
                    <span id="hub-contact-heading">{labels.contact}</span>
                  </HubSectionTitle>
                  {directContactFasterResponseHint ? (
                    <p className="mt-1.5 text-[11px] leading-snug text-[#6F6254]" data-servicios-direct-contact-hint="1">
                      {lang === "en"
                        ? "Contact the business directly for a faster response."
                        : "Contacta directamente al negocio para una respuesta más rápida."}
                    </p>
                  ) : null}
                  {callAction ? (
                    <button
                      type="button"
                      className={`${SCH_COMPACT_CTA} mt-2 w-full border-0 text-[#FFFCF7]`}
                      style={{ backgroundColor: SCH_LX.burgundy, boxShadow: "0 8px 22px rgba(92, 22, 34, 0.28)" }}
                      onClick={callAction.onClick}
                    >
                      <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                      <span>{callAction.label}</span>
                    </button>
                  ) : null}
                  {gridContactActions.length > 0 ? (
                    <div className={contactGridClass}>
                      {gridContactActions.map((action) => {
                        const isWhatsApp = action.id === "whatsapp";
                        const isSecondary = action.id === "message" || action.id === "email";
                        return (
                          <button
                            key={action.id}
                            type="button"
                            className={
                              isSecondary
                                ? `${SCH_CTA_SECONDARY} min-h-[44px] py-2`
                                : isWhatsApp
                                  ? `${SCH_CTA_WHATSAPP} min-h-[44px] py-2`
                                  : `${SCH_COMPACT_CTA} border-0 text-[#FFFCF7]`
                            }
                            style={
                              isSecondary
                                ? undefined
                                : isWhatsApp
                                  ? { backgroundColor: SCH_LX.whatsApp, boxShadow: SCH_LX.whatsAppShadow }
                                  : { backgroundColor: SCH_LX.burgundy, boxShadow: "0 4px 12px rgba(92, 22, 34, 0.18)" }
                            }
                            onClick={action.onClick}
                          >
                            {action.icon}
                            <span>{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {showLocation ? (
                <section aria-labelledby="hub-location-heading" className="min-w-0">
                  <HubSectionTitle>
                    <span id="hub-location-heading">{labels.location}</span>
                  </HubSectionTitle>
                  {vm.location?.addressDisplay?.trim() ? (
                    <p className="mt-2 flex items-start gap-1 text-sm font-medium leading-snug text-[#1E1814]">
                      <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                      <span className="flex-1 whitespace-pre-line">{vm.location.addressDisplay}</span>
                      <CopyChip value={vm.location.addressDisplay.trim()} />
                    </p>
                  ) : null}
                  <div className={SCH_MAP_WRAP}>
                    <ServiciosBusinessHubMapPanel
                      mapImageUrl={vm.location?.mapImageUrl}
                      mapEmbedSrc={vm.location?.mapEmbedSrc}
                      addressDisplay={vm.location?.addressDisplay}
                      lang={lang}
                    />
                  </div>
                  {vm.location?.mapsHref || vm.location?.addressDisplay?.trim() ? (
                    <button
                      type="button"
                      className={`${SCH_COMPACT_CTA} mt-2 w-full border-2 border-[#C9A84A]/40 text-[#FFFCF7]`}
                      style={{ backgroundColor: SCH_LX.burgundy, boxShadow: "0 6px 18px rgba(92, 22, 34, 0.24)" }}
                      onClick={() => {
                        const mapsHref = vm.location?.mapsHref?.trim();
                        const address = vm.location?.addressDisplay?.trim() ?? "";
                        if (mapsHref) openDirections(mapsHref, true);
                        else if (address) openDirections(address, false);
                      }}
                    >
                      <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                      {lang === "en" ? "Get directions" : "Cómo llegar"}
                    </button>
                  ) : null}
                </section>
              ) : null}

              {showHours && hours ? (
                <section aria-labelledby="hub-hours-heading" className="min-w-0">
                  <HubSectionTitle>
                    <span id="hub-hours-heading">{labels.hours}</span>
                  </HubSectionTitle>
                  {hours.openNowLabel && nonEmpty(hours.todayHoursLine) ? (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-[#6F6254]">
                      <FiClock className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: SCH_LX.burgundy }} aria-hidden />
                      <span>
                        <span className="font-semibold text-[#1E1814]">{hours.openNowLabel}:</span> {hours.todayHoursLine}
                      </span>
                    </p>
                  ) : null}
                  {hours.weeklyRows && hours.weeklyRows.length > 0 ? (
                    <ul className="mt-2 space-y-0.5">
                      {hours.weeklyRows.map((r, i) => (
                        <li
                          key={`${r.dayLabel}-${i}`}
                          className={`flex justify-between gap-2 text-[11px] sm:text-xs ${i === 0 && hours.openNowLabel ? "rounded bg-[#F5F0E8]/90 px-1.5 py-0.5" : ""}`}
                        >
                          <span className="min-w-0 shrink font-medium text-[#1E1814]">{r.dayLabel}</span>
                          <span className="shrink-0 text-right tabular-nums text-[#6F6254]">{r.line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ) : null}
            </div>

            {showSecondary ? (
              <div className={SCH_SECONDARY_GRID}>
                {showReviews ? (
                  <section aria-labelledby="hub-reviews-heading" className="min-w-0">
                    <HubSectionTitle>
                      <span id="hub-reviews-heading">{labels.reviews}</span>
                    </HubSectionTitle>
                    <div className="mt-2 flex flex-col gap-2">
                      {vm.reviews.map((link) => (
                        <ServiciosHubReviewLinkButton
                          key={link.id}
                          link={link}
                          lang={lang}
                          onClick={() => openReviewLink(link)}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                {showSocial ? (
                  <section aria-labelledby="hub-social-heading" className="min-w-0">
                    <HubSectionTitle>
                      <span id="hub-social-heading">{labels.social}</span>
                    </HubSectionTitle>
                    <div className="mt-2 flex max-w-full flex-wrap gap-2">
                      {vm.social.map((link) => {
                        const brand = businessHubSocialBrandStyle(link.platform);
                        return (
                          <button
                            key={link.platform}
                            type="button"
                            onClick={() => openSocialOutbound(link.url, socialHeadline(link.platform))}
                            className={SCH_SOCIAL_CHIP}
                            style={{
                              background: brand.background,
                              color: brand.color,
                              border: brand.border ?? "2px solid transparent",
                            }}
                            aria-label={socialHeadline(link.platform)}
                          >
                            <span className="inline-flex" style={{ color: brand.color }}>
                              <BusinessHubSocialBrandIcon platform={link.platform} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {showFindUs ? (
                  <section aria-labelledby="hub-more-heading" className="min-w-0">
                    <HubSectionTitle>
                      <span id="hub-more-heading">{labels.find}</span>
                    </HubSectionTitle>
                    <div className="mt-2 flex flex-col gap-2">
                      {vm.moreLinks.map((link, i) => (
                        <button
                          key={`${link.label}-${i}`}
                          type="button"
                          onClick={() => openLink(link.url)}
                          className={SCH_LINK_CARD}
                        >
                          <FiGlobe className="h-4 w-4 shrink-0" style={{ color: SCH_LX.burgundy }} aria-hidden />
                          <span className="min-w-0 flex-1 break-words">{cleanHubLinkLabel(link.label, link.url, lang)}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : null}

            {vm.showLeonixVerifiedCue ? (
              <p className="mt-3 text-center text-[10px] font-medium tracking-wide text-[#6F6254]">
                {lang === "en" ? "Ad verified by Leonix" : "Anuncio verificado por Leonix"}
              </p>
            ) : null}

            <ServiciosBusinessHubEngagementRow
              profile={profile}
              lang={lang}
              listingSlug={listingSlug}
              listingSourceId={listingSourceId}
              engagementListingId={engagementListingId}
              engagementOwnerUserId={engagementOwnerUserId}
              listingShareUrl={listingShareUrl}
              showEngagementControls={showEngagementControls}
              persistListingEngagement={persistListingEngagement}
              publicLikeCount={publicLikeCount}
              hubEngagementVariant={hubEngagementVariant}
            />
          </article>
        </div>
      </section>

      <ServiciosActionPanelAreasMap
        profile={profile}
        lang={lang}
        onOpenServiceAreaMap={() => {
          const href = profile.contact.mapsSearchHref?.trim();
          const areaText = profile.serviceAreas.items.map((x) => x.label).filter(Boolean).join(", ");
          const fallback =
            href ||
            (areaText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(areaText)}` : "");
          if (!fallback) return;
          openDirections(fallback, /^https?:\/\//i.test(fallback));
        }}
      />

      {showOfferSidebarTeaser ? (
        <ServiciosOfferCard
          profile={profile}
          lang={lang}
          listingSlug={listingSlug}
          listingSourceId={listingSourceId}
          engagementListingId={engagementListingId}
          engagementOwnerUserId={engagementOwnerUserId}
        />
      ) : null}
    </div>
  );
}
