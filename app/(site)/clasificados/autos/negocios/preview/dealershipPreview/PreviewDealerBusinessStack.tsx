"use client";

import { useMemo, type ReactNode } from "react";
import {
  FiCalendar,
  FiGrid,
  FiMail,
  FiMapPin,
  FiMessageSquare,
  FiPhone,
  FiPrinter,
  FiShare2,
  FiPlay,
} from "react-icons/fi";
import { TbWorldWww } from "react-icons/tb";
import { SiWhatsapp } from "react-icons/si";
import type { AutoDealerListing } from "../../types/autoDealerListing";
import { hasDealerCard } from "../../lib/autoDealerPresence";
import {
  filterDealerHoursForDisplay,
  formatDealerHoursTimeRange,
  formatTodaysDealerHoursLine,
} from "../../lib/dealerHoursDisplay";
import { formatCityStateLabel, formatUsd, polishMonthlyEstimateDisplay } from "../../components/autoDealerFormatters";
import { MediaImage } from "../../components/MediaImage";
import { useAutosNegociosPreviewCopy } from "../../lib/AutosNegociosPreviewLocaleContext";
import { AutosDirectContactLink } from "@/app/clasificados/autos/shared/components/AutosDirectContactLink";
import { DealerFinanceContact } from "../../components/DealerFinanceContact";
import { hasDealerFinanceContact } from "@/app/lib/clasificados/autos/autosDealerFinanceContact";
import { mapAutosDealerToBusinessHubContact } from "../../lib/mapAutosDealerToBusinessHubContact";
import {
  AutosBusinessHubSocialBrandIcon,
  autosBusinessHubSocialBrandStyle,
} from "../../lib/autosNegociosBusinessHubSocialBrand";
import { AutosNegociosBusinessHubMapPreview } from "../../components/AutosNegociosBusinessHubMapPreview";
import { AutosNegociosHubReviewLinkButton } from "../../components/AutosNegociosHubReviewLinkButton";
import type { AutosNegociosBusinessHubSocialPlatform } from "../../lib/autosNegociosBusinessHubContactTypes";
import {
  autosAnalyticsTrackMeta,
  autosSheetCtaAnalyticsProps,
  type AutosPublicListingAnalyticsProps,
} from "../../../lib/autosAnalyticsIdentity";
import {
  trackAutosContactFromHref,
  trackAutosCustomDealershipLinkCta,
  trackAutosDealerInventoryOpenCta,
  trackAutosGoogleBusinessCta,
  trackAutosGoogleReviewsCta,
  trackAutosScheduleTestDriveCta,
  trackAutosYelpCta,
} from "../../../lib/autosCtaTracking";
import { hasListingVideo } from "../../lib/autoDealerVideo";
import { LeonixLikeButton } from "@/app/components/clasificados/analytics/LeonixLikeButton";
import {
  autosAnalyticsContextFromProps,
  autosGlobalLikeRecorderFromContext,
} from "@/app/lib/clasificados/autos/analytics/autosGlobalAnalytics";
import { AUTOS_PREVIEW_SECTION_IDS } from "./previewPremiumTokens";
import {
  autosPreviewBurgundyPrimaryBtnClass,
  autosPreviewBusinessHubHeaderClass,
  autosPreviewBusinessHubSectionDividerClass,
  autosPreviewBusinessHubSectionLabelClass,
  autosPreviewHeroPriceClass,
  autosPreviewRectLanguageBadgeClass,
  autosPreviewSecondaryBtnClass,
  autosPreviewWhatsappBtnClass,
} from "./previewPremiumTokens";

const BTN_PRIMARY_LEGACY =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99] max-lg:min-h-[54px]";

const BTN_SECONDARY_LEGACY =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-center text-[13px] font-semibold leading-tight text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] max-lg:min-h-[50px]";

const SECTION_HEAD = "text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--lx-text)]";

const QUICK_ACTION_CLASS =
  "inline-flex min-h-[44px] w-full items-center gap-3 rounded-[10px] border border-[#D6C7AD]/70 bg-[#FFFCF7] px-3 text-left text-sm font-semibold text-[#1F241C] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function socialHeadline(platform: AutosNegociosBusinessHubSocialPlatform): string {
  const map: Record<AutosNegociosBusinessHubSocialPlatform, string> = {
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

function SectionBlock({
  children,
  showTopBorder,
  premium,
  className,
}: {
  children: ReactNode;
  showTopBorder: boolean;
  premium?: boolean;
  className?: string;
}) {
  const border = premium ? autosPreviewBusinessHubSectionDividerClass : "border-[color:var(--lx-nav-border)]";
  return (
    <div className={`${showTopBorder ? `mt-5 border-t ${border} pt-5` : ""} ${className ?? ""}`.trim()}>{children}</div>
  );
}

/**
 * Premium dealership contact card for Autos Negocios preview and public detail.
 */
export function PreviewDealerBusinessStack({
  data,
  className,
  buyerInventoryHref,
  publicAnalytics,
  publicUrl,
  publicPlaybackOnly = false,
  draftPreviewMode = false,
  showPremiumHubHeader = false,
}: {
  data: AutoDealerListing;
  className?: string;
  /** Public buyer context only — never owner dashboard inventory management. */
  buyerInventoryHref?: string | null;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
  publicUrl?: string;
  publicPlaybackOnly?: boolean;
  draftPreviewMode?: boolean;
  showPremiumHubHeader?: boolean;
}) {
  const { t, lang } = useAutosNegociosPreviewCopy();
  const sb = t.preview.sidebar;
  const d = t.preview.dealer;
  const hub = useMemo(() => mapAutosDealerToBusinessHubContact(data, lang), [data, lang]);

  const showIdentity = hasDealerCard(data);
  const serviceArea = formatCityStateLabel(data.city, data.state);
  const hours = filterDealerHoursForDisplay(data.dealerHours);
  const showBuyerInventory = Boolean(buyerInventoryHref?.trim());
  const logoAlt = data.dealerName?.trim() ? data.dealerName.trim() : d.logoAltFallback;
  const todaysHoursLine = formatTodaysDealerHoursLine(data.dealerHours, lang);
  const BTN_PRIMARY = showPremiumHubHeader ? autosPreviewBurgundyPrimaryBtnClass : BTN_PRIMARY_LEGACY;
  const BTN_SECONDARY = showPremiumHubHeader ? autosPreviewSecondaryBtnClass : BTN_SECONDARY_LEGACY;
  const BTN_WHATSAPP = showPremiumHubHeader ? autosPreviewWhatsappBtnClass : BTN_PRIMARY;
  const sectionLabelClass = showPremiumHubHeader ? autosPreviewBusinessHubSectionLabelClass : SECTION_HEAD;

  const c = hub.contact;
  const sheetProps = autosSheetCtaAnalyticsProps(publicAnalytics);
  const contactMeta =
    publicAnalytics?.listingSourceId?.trim()
      ? autosAnalyticsTrackMeta({
          sourceId: publicAnalytics.listingSourceId,
          leonixAdId: publicAnalytics.leonixAdId,
          lane: publicAnalytics.lane,
          inventoryRole: publicAnalytics.inventoryRole,
          dealerInventoryGroupId: publicAnalytics.dealerInventoryGroupId,
          dealerInventoryParentListingId: publicAnalytics.dealerInventoryParentListingId,
          source: "detail_contact",
        })
      : undefined;
  const trackHref = (href: string, kind?: "schedule" | "website" | "directions") => {
    if (!contactMeta) return;
    if (kind === "schedule") {
      trackAutosScheduleTestDriveCta(contactMeta);
      return;
    }
    trackAutosContactFromHref(href, contactMeta);
  };
  const showWhatsapp = Boolean(c.whatsappHref);
  const showCall = Boolean(c.callTelHref);
  const showSms = Boolean(c.smsHref);
  const showSchedule = Boolean(c.bookingHref);
  const showWebsite = Boolean(c.websiteHref);
  const showEmail = Boolean(c.emailMailto);
  const showContactGrid = showWhatsapp || showCall || showSms || showSchedule || showWebsite || showEmail;
  const showSocial = hub.social.length > 0;
  const showReviews = hub.reviews.length > 0;
  const showMoreLinks = hub.moreLinks.length > 0;
  const showLanguages = (hub.languages?.length ?? 0) > 0;
  const showLocation = Boolean(
    hub.location?.addressDisplay?.trim() || hub.location?.mapsHref || hub.location?.mapEmbedUrl,
  );
  const showFinance = hasDealerFinanceContact(data);
  const showVideoUtility = hasListingVideo(data);
  const analyticsCtx = useMemo(() => autosAnalyticsContextFromProps(publicAnalytics), [publicAnalytics]);
  const priceOk = data.price !== undefined && Number.isFinite(data.price);
  const monthly = polishMonthlyEstimateDisplay(data.monthlyEstimate ?? undefined);
  const primaryAvailabilityHref = c.whatsappHref || c.smsHref || c.emailMailto || c.bookingHref || null;
  const chatHref = c.whatsappHref || c.smsHref || null;
  const phoneDisplay =
    data.dealerPhoneOffice?.trim() || data.dealerPhoneMobile?.trim() || data.dealerSmsPhone?.trim() || "";
  const addressDisplay = hub.location?.addressDisplay?.trim() || "";
  /**
   * Dormant until a real `dealerVehicleUrl` field + publish-form input exist (tracked as a
   * follow-up — see plan). Read defensively via a local shape so the shared `AutoDealerListing`
   * type stays untouched in this pass; never renders without a real, non-empty value.
   */
  const dealerVehicleUrl = (data as { dealerVehicleUrl?: string | null }).dealerVehicleUrl?.trim() || null;
  const viewVehicleOnDealerSiteLabel =
    lang === "es" ? "Ver vehículo en el sitio del dealer" : "View this vehicle on the dealer's site";

  const requestAvailabilityLabel =
    lang === "es" ? "Solicitar disponibilidad" : "Request availability";
  const chatLabel = lang === "es" ? "Chatear" : "Chat";
  const dealerDescriptor = lang === "es" ? "Concesionario en Leonix" : "Dealership on Leonix";
  const questionsTitle = lang === "es" ? "¿Preguntas sobre este auto?" : "Questions about this vehicle?";
  const questionsBody =
    lang === "es"
      ? "Nuestro equipo está listo para ayudarte."
      : "Our team is ready to help you.";
  const sendMessageLabel = lang === "es" ? "Enviar mensaje" : "Send message";
  const viewVideoLabel = lang === "es" ? "Ver video completo" : "Watch full video";
  const printLabel = lang === "es" ? "Imprimir" : "Print";
  const shareLabel = lang === "es" ? "Compartir" : "Share";
  const reportLabel = lang === "es" ? "Reportar anuncio" : "Report listing";
  const profileLabel = lang === "es" ? "Ver perfil del negocio" : "View business profile";

  let sectionBorder = false;
  const nextSection = () => {
    const had = sectionBorder;
    sectionBorder = true;
    return had;
  };

  const secondaryCtas: Array<{ key: string; node: ReactNode }> = [];

  if (showCall && c.callTelHref) {
    const node = (
      <AutosDirectContactLink href={c.callTelHref} className={BTN_SECONDARY} {...sheetProps}>
        <FiPhone className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
        {sb.call}
      </AutosDirectContactLink>
    );
    secondaryCtas.push({ key: "call", node });
  }
  if (showSms && c.smsHref) {
    const node = (
      <AutosDirectContactLink href={c.smsHref} className={BTN_SECONDARY} {...sheetProps}>
        <FiMessageSquare className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
        {sb.textMessageCta}
      </AutosDirectContactLink>
    );
    secondaryCtas.push({ key: "sms", node });
  }
  if (showSchedule && c.bookingHref) {
    const node = (
      <a
        href={c.bookingHref}
        target="_blank"
        rel="noopener noreferrer"
        className={BTN_SECONDARY}
        onClick={() => trackHref(c.bookingHref!, "schedule")}
      >
        <FiCalendar className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
        <span className="text-center leading-tight">{sb.scheduleAppointment}</span>
      </a>
    );
    secondaryCtas.push({ key: "schedule", node });
  }
  if (showWebsite && c.websiteHref) {
    const node = (
      <a
        href={c.websiteHref}
        target="_blank"
        rel="noopener noreferrer"
        className={BTN_SECONDARY}
        onClick={() => trackHref(c.websiteHref!)}
      >
        <TbWorldWww className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
        {sb.viewWebsite}
      </a>
    );
    secondaryCtas.push({ key: "website", node });
  }
  if (showEmail && c.emailMailto) {
    secondaryCtas.push({
      key: "email",
      node: (
        <AutosDirectContactLink href={c.emailMailto} className={BTN_SECONDARY} {...sheetProps}>
          <FiMail className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
          {sb.emailSeller}
        </AutosDirectContactLink>
      ),
    });
  }

  const onShare = async () => {
    const url = publicUrl?.trim() || (typeof window !== "undefined" ? window.location.href : "");
    const title = data.vehicleTitle?.trim() || data.dealerName?.trim() || "Leonix Autos";
    if (!url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled or clipboard blocked */
    }
  };

  const premiumHub = showPremiumHubHeader;

  return (
    <div
      className={`min-w-0 overflow-x-hidden ${
        premiumHub
          ? "bg-transparent p-0 shadow-none"
          : "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:p-6 max-lg:bg-[color:var(--lx-card)]"
      } ${className ?? ""}`}
    >
      {premiumHub ? (
        <div className={autosPreviewBusinessHubHeaderClass}>
          {lang === "es" ? "Business Hub" : "Business Hub"}
        </div>
      ) : null}
      <div className={premiumHub ? "px-4 py-5 sm:px-5 sm:py-6" : ""}>
        {premiumHub && (priceOk || nonEmpty(monthly)) ? (
          <div className="mb-4 rounded-[12px] border border-[#D6C7AD]/65 bg-[#FFFCF7] px-3.5 py-3">
            {priceOk ? <p className={`${autosPreviewHeroPriceClass} text-[1.75rem] sm:text-[2rem]`}>{formatUsd(data.price)}</p> : null}
            {nonEmpty(monthly) ? (
              <p className={`text-sm font-semibold text-[#5C5346] ${priceOk ? "mt-1" : ""}`}>
                {lang === "es" ? `o ${monthly}` : `or ${monthly}`}
                <span className="ml-1 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">*</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {premiumHub && showContactGrid ? (
          <SectionBlock showTopBorder={false} premium>
            <div className="flex flex-col gap-3">
              {primaryAvailabilityHref ? (
                <AutosDirectContactLink
                  href={primaryAvailabilityHref}
                  className={primaryAvailabilityHref === c.whatsappHref ? BTN_WHATSAPP : BTN_PRIMARY}
                  {...sheetProps}
                >
                  {primaryAvailabilityHref === c.whatsappHref ? (
                    <SiWhatsapp className="h-5 w-5 shrink-0 text-white" aria-hidden />
                  ) : (
                    <FiMessageSquare className="h-5 w-5 shrink-0" aria-hidden />
                  )}
                  {requestAvailabilityLabel}
                </AutosDirectContactLink>
              ) : null}

              <div className={`grid gap-3 ${showCall && chatHref ? "grid-cols-2" : "grid-cols-1"}`}>
                {showCall && c.callTelHref ? (
                  <AutosDirectContactLink href={c.callTelHref} className={BTN_SECONDARY} {...sheetProps}>
                    <FiPhone className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                    {sb.call}
                  </AutosDirectContactLink>
                ) : null}
                {chatHref ? (
                  <AutosDirectContactLink href={chatHref} className={BTN_SECONDARY} {...sheetProps}>
                    {chatHref === c.whatsappHref ? (
                      <SiWhatsapp className="h-5 w-5 shrink-0 text-[#128C7E]" aria-hidden />
                    ) : (
                      <FiMessageSquare className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                    )}
                    {chatLabel}
                  </AutosDirectContactLink>
                ) : null}
              </div>

              {(addressDisplay || phoneDisplay) && (
                <div className="space-y-1.5 text-sm text-[#5C5346]">
                  {addressDisplay ? (
                    <p className="flex items-start gap-2">
                      <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                      <span className="min-w-0 break-words">{addressDisplay}</span>
                    </p>
                  ) : null}
                  {phoneDisplay ? (
                    <p className="flex items-center gap-2">
                      <FiPhone className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                      <span>{phoneDisplay}</span>
                    </p>
                  ) : null}
                </div>
              )}

              {showSchedule && c.bookingHref ? (
                <a
                  href={c.bookingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BTN_SECONDARY}
                  onClick={() => trackHref(c.bookingHref!, "schedule")}
                >
                  <FiCalendar className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                  <span className="text-center leading-tight">{sb.scheduleAppointment}</span>
                </a>
              ) : null}
              {showWebsite && c.websiteHref ? (
                <a
                  href={c.websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BTN_SECONDARY}
                  onClick={() => trackHref(c.websiteHref!)}
                >
                  <TbWorldWww className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                  {sb.viewWebsite}
                </a>
              ) : null}
              {showEmail && c.emailMailto && primaryAvailabilityHref !== c.emailMailto ? (
                <AutosDirectContactLink href={c.emailMailto} className={BTN_SECONDARY} {...sheetProps}>
                  <FiMail className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                  {sb.emailSeller}
                </AutosDirectContactLink>
              ) : null}
            </div>
          </SectionBlock>
        ) : null}

        {premiumHub && showVideoUtility ? (
          <SectionBlock showTopBorder premium>
            <a href={`#${AUTOS_PREVIEW_SECTION_IDS.gallery}`} className={QUICK_ACTION_CLASS}>
              <FiPlay className="h-4 w-4 shrink-0 text-[#7A1E2C]" aria-hidden />
              <span className="flex-1">{viewVideoLabel}</span>
              <FiGrid className="h-4 w-4 shrink-0 text-[#8A6B1F]" aria-hidden />
            </a>
          </SectionBlock>
        ) : null}

        {showIdentity ? (
          <SectionBlock showTopBorder={premiumHub ? true : false} premium={premiumHub}>
            <div className="flex items-start gap-3 text-left">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] border border-[#D6C7AD]/80 bg-[#FFFCF7] sm:h-[4.5rem] sm:w-[4.5rem]">
                {data.dealerLogo ? (
                  data.dealerLogo.startsWith("data:") ? (
                    <img src={data.dealerLogo} alt={logoAlt} className="h-full w-full object-contain p-2" />
                  ) : (
                    <MediaImage src={data.dealerLogo} alt={logoAlt} fill className="object-contain p-2" sizes="72px" />
                  )
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[#8A6B1F]">
                    {(data.dealerName ?? "NA").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                {nonEmpty(data.dealerName) ? (
                  <h2 className="break-words text-lg font-extrabold leading-tight tracking-tight text-[#1F241C]">
                    {data.dealerName?.trim()}
                  </h2>
                ) : null}
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#8A6B1F]">{dealerDescriptor}</p>
                {!premiumHub && nonEmpty(serviceArea) ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#5C5346]">
                    <FiMapPin className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                    {serviceArea}
                  </p>
                ) : null}
              </div>
            </div>

            {premiumHub ? (
              <div className="mt-4 space-y-2 text-sm text-[#5C5346]">
                {phoneDisplay ? (
                  <p className="flex items-center gap-2">
                    <FiPhone className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                    {phoneDisplay}
                  </p>
                ) : null}
                {addressDisplay ? (
                  <p className="flex items-start gap-2">
                    <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                    <span className="min-w-0 break-words">{addressDisplay}</span>
                  </p>
                ) : null}
                {todaysHoursLine ? <p className="rounded-[8px] border border-[#D6C7AD]/60 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#1F241C]">{todaysHoursLine}</p> : null}
              </div>
            ) : null}

            {premiumHub && (showBuyerInventory || showWebsite) ? (
              <div className="mt-4">
                {showBuyerInventory && buyerInventoryHref ? (
                  <a
                    href={buyerInventoryHref}
                    className={BTN_SECONDARY}
                    onClick={() => {
                      if (contactMeta) trackAutosDealerInventoryOpenCta(contactMeta);
                    }}
                  >
                    {profileLabel}
                  </a>
                ) : showWebsite && c.websiteHref ? (
                  <a
                    href={c.websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={BTN_SECONDARY}
                    onClick={() => trackHref(c.websiteHref!)}
                  >
                    {profileLabel}
                  </a>
                ) : null}
              </div>
            ) : null}

            {premiumHub && dealerVehicleUrl ? (
              <div className="mt-3">
                <a
                  href={dealerVehicleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={BTN_SECONDARY}
                  onClick={() => trackHref(dealerVehicleUrl)}
                >
                  <TbWorldWww className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                  {viewVehicleOnDealerSiteLabel}
                </a>
              </div>
            ) : null}
          </SectionBlock>
        ) : null}

        {!premiumHub && showContactGrid ? (
          <SectionBlock showTopBorder={showIdentity ? true : nextSection()} premium={false}>
            <p className={sectionLabelClass}>{sb.contactHeading}</p>
            <div className="mt-4 flex flex-col gap-3">
              {showWhatsapp && c.whatsappHref ? (
                <AutosDirectContactLink href={c.whatsappHref} className={BTN_WHATSAPP} {...sheetProps}>
                  <SiWhatsapp className="h-5 w-5 shrink-0 text-white" aria-hidden />
                  {sb.whatsappCta}
                </AutosDirectContactLink>
              ) : null}
              {secondaryCtas.length > 0 ? (
                <div className={`grid gap-3 ${secondaryCtas.length >= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {secondaryCtas.map((item) => (
                    <div key={item.key} className="min-w-0">
                      {item.node}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </SectionBlock>
        ) : null}

        {premiumHub ? (
          <SectionBlock showTopBorder premium>
            <p className={sectionLabelClass}>{lang === "es" ? "Acciones" : "Actions"}</p>
            <div className="mt-3 flex flex-col gap-2">
              {publicPlaybackOnly && analyticsCtx && publicAnalytics?.listingSourceId ? (
                <div className={`${QUICK_ACTION_CLASS} justify-start`}>
                  <LeonixLikeButton
                    listingId={publicAnalytics.listingSourceId}
                    variant="small"
                    lang={lang}
                    category="autos"
                    persistEngagement
                    likeCount={
                      typeof data.listingAnalytics?.likes === "number" && Number.isFinite(data.listingAnalytics.likes)
                        ? Math.max(0, Math.floor(data.listingAnalytics.likes))
                        : 0
                    }
                    countDisplay="numeric"
                    numericShowZero
                    previewLabelMode="iconOnly"
                    recordLikeEvent={autosGlobalLikeRecorderFromContext(analyticsCtx)}
                  />
                  <span className="text-sm font-semibold text-[#1F241C]">
                    {lang === "es" ? "Guardar anuncio" : "Save listing"}
                  </span>
                </div>
              ) : null}
              {publicPlaybackOnly ? (
                <button type="button" className={QUICK_ACTION_CLASS} onClick={() => void onShare()}>
                  <FiShare2 className="h-4 w-4 shrink-0 text-[#7A1E2C]" aria-hidden />
                  {shareLabel}
                </button>
              ) : (
                <p className="inline-flex min-h-[40px] items-center gap-3 px-1 text-sm text-[#8A8074]">
                  <FiShare2 className="h-4 w-4 shrink-0" aria-hidden />
                  {lang === "es" ? "Guardar y compartir disponibles al publicar" : "Save & share available after publish"}
                </p>
              )}
              <button type="button" className={QUICK_ACTION_CLASS} onClick={() => window.print()}>
                <FiPrinter className="h-4 w-4 shrink-0 text-[#7A1E2C]" aria-hidden />
                {printLabel}
              </button>
              {publicPlaybackOnly ? (
                <a href="#autos-listing-report" className={QUICK_ACTION_CLASS}>
                  <FiMessageSquare className="h-4 w-4 shrink-0 text-[#7A1E2C]" aria-hidden />
                  {reportLabel}
                </a>
              ) : null}
              {draftPreviewMode ? (
                <p className="px-1 text-[11px] leading-relaxed text-[#8A8074]">
                  {lang === "es"
                    ? "Vista previa de borrador: las acciones de contacto usan los datos reales del dealer cuando existen."
                    : "Draft preview: contact actions use real dealer data when present."}
                </p>
              ) : null}
            </div>
          </SectionBlock>
        ) : null}

        {premiumHub && (showWhatsapp || showSms || showEmail) ? (
          <SectionBlock showTopBorder premium>
            <p className="text-base font-bold text-[#1F241C]">{questionsTitle}</p>
            <p className="mt-1 text-sm text-[#5C5346]">{questionsBody}</p>
            <div className="mt-3">
              <AutosDirectContactLink
                href={(c.whatsappHref || c.smsHref || c.emailMailto)!}
                className={BTN_SECONDARY}
                {...sheetProps}
              >
                <FiMessageSquare className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                {sendMessageLabel}
              </AutosDirectContactLink>
            </div>
          </SectionBlock>
        ) : null}

        {showReviews ? (
          <SectionBlock showTopBorder={nextSection()} premium={premiumHub} className={premiumHub ? "!mt-5 !pt-5" : ""}>
            <p className={sectionLabelClass}>{sb.reviewsHeading}</p>
            <div className={`flex flex-col gap-3 ${premiumHub ? "mt-4" : "mt-4"}`}>
              {hub.reviews.map((link) => (
                <AutosNegociosHubReviewLinkButton
                  key={link.id}
                  link={link}
                  lang={lang}
                  onOpen={
                    contactMeta
                      ? () => {
                          if (link.id === "google") trackAutosGoogleReviewsCta(contactMeta);
                          else if (link.id === "yelp") trackAutosYelpCta(contactMeta);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          </SectionBlock>
        ) : null}

        {showMoreLinks ? (
          <SectionBlock showTopBorder={nextSection()} premium={premiumHub}>
            <p className={sectionLabelClass}>{sb.moreLinksHeading}</p>
            <div className={`mt-4 grid gap-3 ${hub.moreLinks.length >= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {hub.moreLinks.map((link, i) => {
                const isGoogleBusiness =
                  link.label?.toLowerCase().includes("google business") ||
                  link.label?.toLowerCase().includes("perfil de google");
                return (
                  <a
                    key={`${link.url}-${i}`}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (!contactMeta) return;
                      if (isGoogleBusiness) trackAutosGoogleBusinessCta(contactMeta);
                      else trackAutosCustomDealershipLinkCta(contactMeta);
                    }}
                    className={`${BTN_SECONDARY} min-h-[48px] px-4`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          </SectionBlock>
        ) : null}

        {showLanguages ? (
          <SectionBlock showTopBorder={nextSection()} premium={premiumHub}>
            <p className={sectionLabelClass}>{sb.languagesHeading}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {hub.languages!.map((label) => (
                <li key={label} className={autosPreviewRectLanguageBadgeClass}>
                  {label}
                </li>
              ))}
            </ul>
          </SectionBlock>
        ) : null}

        {showSocial ? (
          <SectionBlock showTopBorder={nextSection()} premium={premiumHub}>
            <p className={sectionLabelClass}>{sb.followHeading}</p>
            <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {hub.social.map((item) => {
                const brand = autosBusinessHubSocialBrandStyle(item.platform);
                return (
                  <a
                    key={item.platform}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackHref(item.url)}
                    title={socialHeadline(item.platform)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/50 [&_svg]:h-[18px] [&_svg]:w-[18px]"
                    style={{
                      background: brand.background,
                      color: brand.color,
                      border: brand.border,
                    }}
                    aria-label={socialHeadline(item.platform)}
                  >
                    <AutosBusinessHubSocialBrandIcon platform={item.platform} />
                  </a>
                );
              })}
            </div>
          </SectionBlock>
        ) : null}

        {showFinance ? (
          <SectionBlock showTopBorder={nextSection()} premium={premiumHub}>
            <div id={AUTOS_PREVIEW_SECTION_IDS.financing} className="scroll-mt-28">
              <DealerFinanceContact data={data} embedded publicAnalytics={publicAnalytics} premium={premiumHub} />
            </div>
          </SectionBlock>
        ) : null}

        {hours.length > 0 ? (
          <SectionBlock showTopBorder={nextSection()} premium={premiumHub}>
            <p className={sectionLabelClass}>{d.hoursHeading}</p>
            {!premiumHub && todaysHoursLine ? (
              <p className="mt-3 rounded-[8px] border border-[#D6C7AD]/70 bg-[#FBF7EF] px-3 py-2 text-sm font-semibold text-[#1F241C]">
                {todaysHoursLine}
              </p>
            ) : null}
            <ul className="mt-4 space-y-2">
              {hours.map((row, idx) => (
                <li
                  key={row.rowId ?? `hour-${idx}`}
                  className="flex items-baseline justify-between gap-4 border-b border-[#D6C7AD]/40 pb-2 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="min-w-0 font-semibold text-[#1F241C]">{row.day.trim()}</span>
                  <span className="shrink-0 text-right font-medium tabular-nums text-[#5C5346]">
                    {formatDealerHoursTimeRange(row)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionBlock>
        ) : null}

        {showLocation ? (
          <SectionBlock showTopBorder={nextSection()} premium={premiumHub}>
            <p className={sectionLabelClass}>{sb.locationHeading}</p>
            <div className="mt-4">
              <AutosNegociosBusinessHubMapPreview
                locationLine={hub.location?.addressDisplay ?? ""}
                directionsHref={hub.location?.mapsHref}
                quickMapLabel={sb.quickMapView}
                directionsLabel={sb.directionsCta}
                onDirectionsClick={
                  contactMeta && hub.location?.mapsHref
                    ? () => trackHref(hub.location!.mapsHref!, "directions")
                    : undefined
                }
              />
            </div>
          </SectionBlock>
        ) : null}

        {!premiumHub && showBuyerInventory && buyerInventoryHref ? (
          <SectionBlock showTopBorder={nextSection()} premium={false}>
            <a
              href={buyerInventoryHref}
              className={BTN_PRIMARY}
              onClick={() => {
                if (contactMeta) trackAutosDealerInventoryOpenCta(contactMeta);
              }}
            >
              {sb.viewDealerInventory}
            </a>
          </SectionBlock>
        ) : null}
      </div>
    </div>
  );
}
