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
  buildServiciosGetQuoteIntent,
  buildServiciosSendEmailIntentFromMailto,
  serviciosContactShareExtras,
  serviciosAnalyticsTrackMeta,
  trackServiciosListingCta,
} from "../lib/serviciosCtaIntents";
import {
  mapServiciosProfileToBusinessHubContact,
  serviciosBusinessHubHasVisibleContent,
} from "../lib/mapServiciosProfileToBusinessHubContact";
import type {
  ServiciosBusinessHubReviewLink,
  ServiciosBusinessHubSocialLink,
} from "../lib/serviciosBusinessHubContactTypes";
import {
  BusinessHubSocialBrandIcon,
  businessHubSocialBrandStyle,
} from "../lib/serviciosBusinessHubSocialBrand";
import { ServiciosStarRating } from "./ServiciosStarRating";
import { ServiciosBusinessHubEngagementRow } from "./ServiciosBusinessHubEngagementRow";
import { ServiciosBusinessHubFauxMap } from "./ServiciosBusinessHubFauxMap";
import { ServiciosActionPanelAreasMap } from "./ServiciosActionPanelAreasMap";
import { ServiciosOfferCard } from "./ServiciosOfferCard";
import { ContactEmailMenu } from "@/app/components/contact/ContactEmailMenu";
import { CtaActionSheet } from "@/app/components/cta/CtaActionSheet";
import type { CtaSheetIntent } from "@/app/components/cta/types";
import { SV } from "./serviciosDesignTokens";
import {
  LX,
  LX_CTA_HUB_SECONDARY,
  LX_CTA_PRIMARY,
  LX_CTA_PRIMARY_LG,
  LX_CTA_WHATSAPP,
  LX_HUB_CARD,
  LX_HUB_CARD_PRO,
  resolveProfessionalHubQuoteCtaLabel,
} from "./serviciosLeonixBrand";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { ServiciosHubReviewLinkButton } from "./ServiciosHubReviewLinkButton";

const HUB_GOLD = LX.gold;

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

function HubSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="border-b border-[#E8D9C4]/80 pb-2 text-sm font-bold tracking-tight text-[#1E1814] sm:text-base">
      {children}
    </h3>
  );
}

function HubDivider() {
  return <hr className="my-4 border-0 border-t sm:my-5" style={{ borderColor: "#E8D9C4" }} />;
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
  listingShareUrl,
  engagementListingId = null,
  engagementOwnerUserId = null,
  persistListingEngagement = false,
  publicLikeCount,
  directContactFasterResponseHint = false,
  showOfferSidebarTeaser = true,
  listingTemplate,
}: {
  profile: ServiciosProfileResolved;
  lang: ServiciosLang;
  /** When set (professional preview/profile), hub quote CTA uses template-aware copy. */
  listingTemplate?: ServiciosListingTemplate;
  listingSlug?: string;
  listingShareUrl?: string;
  engagementListingId?: string | null;
  engagementOwnerUserId?: string | null;
  persistListingEngagement?: boolean;
  publicLikeCount?: number;
  directContactFasterResponseHint?: boolean;
  showOfferSidebarTeaser?: boolean;
}) {
  const L = getServiciosProfileLabels(lang);
  const vm = useMemo(() => mapServiciosProfileToBusinessHubContact(profile, lang), [profile, lang]);
  const [ctaOpen, setCtaOpen] = useState(false);
  const [ctaIntent, setCtaIntent] = useState<CtaSheetIntent | null>(null);

  const analyticsBase = useMemo(
    () =>
      serviciosAnalyticsTrackMeta({
        listingSlug,
        engagementListingId,
        ownerUserId: engagementOwnerUserId,
        source: "business_hub",
      }),
    [listingSlug, engagementListingId, engagementOwnerUserId],
  );

  const openCtaSheet = useCallback(
    (intent: CtaSheetIntent, trackEvent?: string) => {
      if (trackEvent) trackServiciosListingCta(listingSlug, trackEvent, { ...analyticsBase, source: "business_hub" });
      setCtaIntent(intent);
      setCtaOpen(true);
    },
    [analyticsBase, listingSlug],
  );

  const closeCtaSheet = useCallback(() => {
    setCtaOpen(false);
    setCtaIntent(null);
  }, []);

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

  const contactExtras = serviciosContactShareExtras(profile, listingSlug, listingShareUrl);
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

  const openPrimaryQuoteSheet = () => {
    const intent = buildServiciosGetQuoteIntent(profile, lang, { listingSlug, listingShareUrl });
    if (!intent || !quote) return;
    openCtaSheet(intent, analyticsForQuoteKind(quote.kind));
  };

  const openPrimaryMailtoSheet = () => {
    if (!primaryMailto) return;
    const intent = buildServiciosSendEmailIntentFromMailto(primaryMailto, lang, listingSlug, listingShareUrl);
    if (!intent) return;
    openCtaSheet(intent, analyticsForQuoteKind("mailto"));
  };

  const openCall = () => {
    const href = profile.contact.phoneTelHref?.trim();
    if (!href) return;
    trackServiciosListingCta(listingSlug, "cta_call_click", { ...analyticsBase, source: "business_hub" });
    window.location.href = href.startsWith("tel:") ? href : `tel:${href}`;
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
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const openEmail = () => {
    const mailto = vm.contact.emailMailto;
    if (!mailto) return;
    const intent = buildServiciosSendEmailIntentFromMailto(mailto, lang, listingSlug, listingShareUrl);
    if (!intent) return;
    openCtaSheet(intent, "cta_email_click");
  };

  const openSocialOutbound = (url: string, _headline: string) => {
    trackServiciosListingCta(listingSlug, "cta_website_click", { ...analyticsBase, source: "business_hub" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openLink = (url: string) => {
    trackServiciosListingCta(listingSlug, "cta_website_click", { ...analyticsBase, source: "business_hub" });
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openReviewLink = (link: ServiciosBusinessHubReviewLink) => {
    trackServiciosListingCta(listingSlug, "cta_review_click", { ...analyticsBase, source: "business_hub", reviewId: link.id });
    window.open(link.url, "_blank", "noopener,noreferrer");
  };

  const openDirections = (addressOrUrl: string, isMapsUrl: boolean) => {
    trackServiciosListingCta(listingSlug, "cta_maps_click", { ...analyticsBase, source: "business_hub" });
    if (isMapsUrl) {
      window.open(addressOrUrl, "_blank", "noopener,noreferrer");
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressOrUrl)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
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

  const isProfessionalHub = Boolean(listingTemplate);
  const hubCardClass = isProfessionalHub ? LX_HUB_CARD_PRO : LX_HUB_CARD;
  const callAction = contactActions.find((a) => a.id === "call");
  const gridContactActions = isProfessionalHub && callAction
    ? contactActions.filter((a) => a.id !== "call")
    : contactActions;
  const hasContactGridVisible = gridContactActions.length > 0 || (isProfessionalHub && Boolean(callAction));
  const lxListingIdForEngagement = (engagementListingId ?? "").trim() || profile.identity.slug;
  const showEngagementRow =
    (persistListingEngagement && Boolean(lxListingIdForEngagement)) ||
    Boolean(lxListingIdForEngagement) ||
    Boolean((listingShareUrl ?? "").trim());
  const showSocial = vm.social.length > 0;
  const showReviews = vm.reviews.length > 0;
  const showMore = vm.moreLinks.length > 0;
  const showLocation = Boolean(vm.location?.addressDisplay?.trim() || vm.location?.mapsHref);

  const primaryClass = `${LX_CTA_PRIMARY} ${isProfessionalHub ? LX_CTA_PRIMARY_LG : ""} w-full`;

  const contactBtnBase =
    "flex min-h-[48px] w-full flex-col items-center justify-center gap-1 rounded-lg px-3 py-2.5 text-center text-xs font-bold shadow-md transition active:scale-[0.99] sm:min-h-[50px] sm:text-sm";

  const contactGridClass =
    gridContactActions.length === 1
      ? "mt-4 grid max-w-full grid-cols-1 gap-2.5"
      : gridContactActions.length === 3
        ? "mt-4 grid grid-cols-2 gap-2.5 [&>*:last-child]:col-span-2"
        : "mt-4 grid grid-cols-2 gap-2.5";

  const socialChipClass =
    "flex h-10 w-10 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg shadow-md transition hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]";

  const moreLinkClass =
    "flex min-h-[48px] w-full items-center gap-2.5 rounded-lg border-2 border-[#D4C4A8] bg-[#FFFCF7] px-3 py-3 text-left text-sm font-bold text-[#1E1814] shadow-sm transition hover:border-[#C9A84A] hover:bg-[#FFFDF9] active:scale-[0.99]";

  const showPrimaryQuote =
    quote &&
    ((quote.kind === "mailto" && primaryMailto) ||
      quote.kind === "sms" ||
      quote.kind === "whatsapp");

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
      <article className={hubCardClass} data-servicios-business-hub="1">
        <div
          className="pointer-events-none -mx-4 -mt-4 mb-4 h-1 bg-gradient-to-r from-transparent via-[#C9A84A]/55 to-transparent sm:-mx-6 sm:-mt-6"
          aria-hidden
        />
        {featured ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4" style={{ borderColor: SV.borderSoft }}>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-text)]"
              style={{ backgroundColor: SV.goldSoft, border: `1px solid ${SV.goldBorder}` }}
            >
              <FaStar className="h-3.5 w-3.5" style={{ color: HUB_GOLD }} aria-hidden />
              {featuredLabel}
            </span>
            {rating != null && reviewCount != null ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[color:var(--lx-text-2)]">
                <ServiciosStarRating value={rating} size="sm" />
                {rating.toFixed(1)} ({reviewCount} {lang === "en" ? "reviews" : "reseñas"})
              </span>
            ) : null}
          </div>
        ) : rating != null && reviewCount != null ? (
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4" style={{ borderColor: SV.borderSoft }}>
            <ServiciosStarRating value={rating} size="sm" />
            <span className="text-xs font-semibold text-[color:var(--lx-text-2)]">
              {rating.toFixed(1)} ({reviewCount})
            </span>
          </div>
        ) : null}

        {showPrimaryQuote && quote?.kind === "mailto" && primaryMailto && primaryEmailAddr ? (
          <ContactEmailMenu
            email={primaryEmailAddr}
            mailtoHref={primaryMailto}
            messagePlain={quoteMsgText}
            lang={lang}
            listingSlug={listingSlug}
            engagementListingId={engagementListingId}
            ownerUserId={engagementOwnerUserId}
            analyticsEventType={analyticsForQuoteKind("mailto")}
            triggerClassName={`${primaryClass} ${hasContactGridVisible ? "mb-4" : ""} justify-between`}
            triggerStyle={{ backgroundColor: LX.burgundy, boxShadow: "0 12px 32px rgba(92, 22, 34, 0.28)" }}
          >
            <FiZap className="h-5 w-5 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
            {primaryCtaLabel}
          </ContactEmailMenu>
        ) : showPrimaryQuote && quote?.kind === "mailto" && primaryMailto ? (
          <button
            type="button"
            className={`${primaryClass} ${hasContactGridVisible ? "mb-4" : ""} w-full border-0`}
            style={{ backgroundColor: LX.burgundy, boxShadow: "0 12px 32px rgba(92, 22, 34, 0.28)" }}
            onClick={openPrimaryMailtoSheet}
          >
            <FiZap className="h-5 w-5 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
            {primaryCtaLabel}
          </button>
        ) : showPrimaryQuote && quote && (quote.kind === "sms" || quote.kind === "whatsapp") ? (
          <button
            type="button"
            className={`${primaryClass} ${hasContactGridVisible ? "mb-4" : ""} w-full border-0`}
            style={{ backgroundColor: LX.burgundy, boxShadow: "0 12px 32px rgba(92, 22, 34, 0.28)" }}
            onClick={openPrimaryQuoteSheet}
          >
            <FiZap className="h-5 w-5 shrink-0" style={{ color: HUB_GOLD }} aria-hidden />
            {primaryCtaLabel}
          </button>
        ) : null}

        {hasContactGridVisible ? (
          <section aria-labelledby="hub-contact-heading">
            <HubSectionTitle>
              <span id="hub-contact-heading">{lang === "en" ? "Contact us" : "Contáctanos"}</span>
            </HubSectionTitle>
            {directContactFasterResponseHint ? (
              <p className="mt-2 text-xs leading-snug text-[#6F6254]" data-servicios-direct-contact-hint="1">
                {lang === "en"
                  ? "Contact the business directly for a faster response."
                  : "Contacta directamente al negocio para una respuesta más rápida."}
              </p>
            ) : null}
            {isProfessionalHub && callAction ? (
              <button
                type="button"
                className={`${LX_CTA_PRIMARY} ${LX_CTA_PRIMARY_LG} mt-4 w-full border-0`}
                style={{ backgroundColor: LX.burgundy, boxShadow: "0 10px 28px rgba(92, 22, 34, 0.3)" }}
                onClick={callAction.onClick}
              >
                {callAction.icon}
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
                    isSecondary && isProfessionalHub
                      ? `${LX_CTA_HUB_SECONDARY} hover:brightness-100`
                      : `${contactBtnBase} border-0 text-white hover:brightness-[1.04]`
                  }
                  style={
                    isSecondary && isProfessionalHub
                      ? undefined
                      : {
                          backgroundColor: isWhatsApp ? LX.whatsApp : LX.burgundy,
                          boxShadow: isWhatsApp ? LX.whatsAppShadow : "0 6px 16px rgba(92, 22, 34, 0.2)",
                        }
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

        <ServiciosBusinessHubEngagementRow
          profile={profile}
          lang={lang}
          engagementListingId={engagementListingId}
          engagementOwnerUserId={engagementOwnerUserId}
          listingShareUrl={listingShareUrl}
          persistListingEngagement={persistListingEngagement}
          publicLikeCount={publicLikeCount}
        />

        {showSocial ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-social-heading">
              <HubSectionTitle>
                <span id="hub-social-heading">{lang === "en" ? "Follow us" : "Síguenos"}</span>
              </HubSectionTitle>
              <div className="mt-3 flex max-w-full flex-wrap gap-2.5 break-words sm:mt-3.5">
                {vm.social.map((link) => {
                  const brand = businessHubSocialBrandStyle(link.platform);
                  return (
                    <button
                      key={link.platform}
                      type="button"
                      onClick={() => openSocialOutbound(link.url, socialHeadline(link.platform))}
                      className={socialChipClass}
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
          </>
        ) : null}

        {showReviews ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-reviews-heading">
              <HubSectionTitle>
                <span id="hub-reviews-heading">{lang === "en" ? "Reviews" : "Opiniones"}</span>
              </HubSectionTitle>
              <div className="mt-3 flex flex-col gap-2.5 sm:mt-3.5">
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
          </>
        ) : null}

        {showMore ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-more-heading">
              <HubSectionTitle>
                <span id="hub-more-heading">{lang === "en" ? "Find us online" : "Búscanos aquí"}</span>
              </HubSectionTitle>
              <div className="mt-3 flex flex-col gap-2.5 sm:mt-3.5">
                {vm.moreLinks.map((link, i) => (
                  <button
                    key={`${link.label}-${i}`}
                    type="button"
                    onClick={() => openLink(link.url)}
                    className={moreLinkClass}
                  >
                    <FiGlobe className="h-4 w-4 shrink-0" style={{ color: LX.burgundy }} aria-hidden />
                    <span className="min-w-0 flex-1 break-words">{link.label}</span>
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {showLocation ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-location-heading">
              <HubSectionTitle>
                <span id="hub-location-heading">{lang === "en" ? "Our location" : "Nuestra ubicación"}</span>
              </HubSectionTitle>
              {vm.location?.addressDisplay?.trim() ? (
                <p className="mt-3 flex items-start gap-1 whitespace-pre-line text-sm font-medium leading-relaxed text-[#1E1814]">
                  <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                  <span className="flex-1">{vm.location.addressDisplay}</span>
                  <CopyChip value={vm.location.addressDisplay.trim()} />
                </p>
              ) : null}
              <div className="mt-3 overflow-hidden rounded-lg border-2 border-[#D4C4A8] shadow-md ring-1 ring-[#C9A84A]/20">
                <ServiciosBusinessHubFauxMap />
              </div>
              {vm.location?.mapsHref ? (
                <button
                  type="button"
                  className={`${LX_CTA_PRIMARY} ${LX_CTA_PRIMARY_LG} mt-3 w-full border-2 border-[#C9A84A]/40`}
                  style={{ backgroundColor: LX.burgundy, boxShadow: "0 8px 24px rgba(92, 22, 34, 0.28)" }}
                  onClick={() => openDirections(vm.location!.mapsHref!, true)}
                >
                  <FiMapPin className="h-5 w-5 shrink-0" aria-hidden />
                  {lang === "en" ? "Get directions" : "Cómo llegar"}
                </button>
              ) : null}
            </section>
          </>
        ) : null}

        {hours?.openNowLabel && nonEmpty(hours.todayHoursLine) ? (
          <>
            <HubDivider />
            <section aria-labelledby="hub-hours-heading">
              <HubSectionTitle>
                <span id="hub-hours-heading">{lang === "en" ? "Hours" : "Horarios"}</span>
              </HubSectionTitle>
              <p className="mt-3 flex items-start gap-2 text-xs text-[#6F6254]">
                <FiClock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: LX.burgundy }} aria-hidden />
                <span>
                  <span className="font-semibold text-[#1E1814]">{hours.openNowLabel}:</span> {hours.todayHoursLine}
                </span>
              </p>
            </section>
          </>
        ) : null}

        {hours?.weeklyRows && hours.weeklyRows.length > 0 ? (
          <>
            {!hours?.openNowLabel ? (
              <>
                <HubDivider />
                <HubSectionTitle>
                  <span>{lang === "en" ? "Hours" : "Horarios"}</span>
                </HubSectionTitle>
              </>
            ) : null}
            <ul className={`space-y-1.5 ${hours?.openNowLabel ? "mt-3" : "mt-3"}`}>
              {hours.weeklyRows.map((r, i) => (
                <li key={`${r.dayLabel}-${i}`} className="flex justify-between gap-3 text-xs text-[#6F6254]">
                  <span className="min-w-0 shrink font-medium text-[#1E1814]">{r.dayLabel}</span>
                  <span className="shrink-0 text-right tabular-nums">{r.line}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {vm.showLeonixVerifiedCue ? (
          <>
            <HubDivider />
            <p className="text-center text-[11px] font-medium tracking-wide text-[color:var(--lx-text-2)] opacity-80">
              {lang === "en" ? "Ad verified by Leonix" : "Anuncio verificado por Leonix"}
            </p>
          </>
        ) : null}
      </article>

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

      {showOfferSidebarTeaser ? <ServiciosOfferCard profile={profile} lang={lang} /> : null}

      <CtaActionSheet open={ctaOpen} onClose={closeCtaSheet} intent={ctaIntent} lang={lang} />
    </div>
  );
}
