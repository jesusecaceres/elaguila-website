"use client";

import { useMemo, type ReactNode } from "react";
import { FiCalendar, FiMail, FiMapPin, FiMessageSquare, FiPhone } from "react-icons/fi";
import { TbWorldWww } from "react-icons/tb";
import { SiWhatsapp } from "react-icons/si";
import type { AutoDealerListing } from "../types/autoDealerListing";
import { hasDealerCard } from "../lib/autoDealerPresence";
import {
  filterDealerHoursForDisplay,
  formatDealerHoursTimeRange,
  formatTodaysDealerHoursLine,
} from "../lib/dealerHoursDisplay";
import { formatCityStateLabel } from "./autoDealerFormatters";
import { MediaImage } from "./MediaImage";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { AutosSheetCtaLink } from "@/app/clasificados/autos/shared/components/AutosSheetCtaLink";
import { DealerFinanceContact } from "./DealerFinanceContact";
import { hasDealerFinanceContact } from "@/app/lib/clasificados/autos/autosDealerFinanceContact";
import { mapAutosDealerToBusinessHubContact } from "../lib/mapAutosDealerToBusinessHubContact";
import {
  AutosBusinessHubSocialBrandIcon,
  autosBusinessHubSocialBrandStyle,
} from "../lib/autosNegociosBusinessHubSocialBrand";
import { AutosNegociosBusinessHubFauxMap } from "./AutosNegociosBusinessHubFauxMap";
import { AutosNegociosHubReviewLinkButton } from "./AutosNegociosHubReviewLinkButton";
import type { AutosNegociosBusinessHubSocialPlatform } from "../lib/autosNegociosBusinessHubContactTypes";
import {
  autosAnalyticsTrackMeta,
  autosSheetCtaAnalyticsProps,
  type AutosPublicListingAnalyticsProps,
} from "../../lib/autosAnalyticsIdentity";
import { trackAutosContactFromHref } from "../../lib/autosCtaTracking";
import {
  AUTOS_PREVIEW_SECTION_IDS,
  autosPreviewBurgundyPrimaryBtnClass,
  autosPreviewBusinessHubHeaderClass,
  autosPreviewBusinessHubSectionDividerClass,
  autosPreviewBusinessHubSectionLabelClass,
  autosPreviewRectLanguageBadgeClass,
  autosPreviewSecondaryBtnClass,
  autosPreviewWhatsappBtnClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

const BTN_PRIMARY_LEGACY =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99] max-lg:min-h-[54px]";

const BTN_SECONDARY_LEGACY =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-center text-[13px] font-semibold leading-tight text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] max-lg:min-h-[50px]";

const SECTION_HEAD =
  "text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--lx-text)]";

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
}: {
  children: ReactNode;
  showTopBorder: boolean;
  premium?: boolean;
}) {
  const border = premium ? autosPreviewBusinessHubSectionDividerClass : "border-[color:var(--lx-nav-border)]";
  return (
    <div className={showTopBorder ? `mt-6 border-t ${border} pt-6` : ""}>{children}</div>
  );
}

/**
 * Premium dealership contact card for Autos Negocios preview and public detail.
 */
export function DealerBusinessStack({
  data,
  className,
  buyerInventoryHref,
  publicAnalytics,
  showPremiumHubHeader = false,
}: {
  data: AutoDealerListing;
  className?: string;
  /** Public buyer context only — never owner dashboard inventory management. */
  buyerInventoryHref?: string | null;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
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
          source: "detail_contact",
        })
      : undefined;
  const trackHref = (href: string) => {
    if (contactMeta) trackAutosContactFromHref(href, contactMeta);
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
  const showLocation = Boolean(hub.location?.addressDisplay?.trim() || hub.location?.mapsHref);
  const showFinance = hasDealerFinanceContact(data);

  let sectionBorder = false;
  const nextSection = () => {
    const had = sectionBorder;
    sectionBorder = true;
    return had;
  };

  const secondaryCtas: Array<{ key: string; node: ReactNode }> = [];
  const pairRowOne: Array<{ key: string; node: ReactNode }> = [];
  const pairRowTwo: Array<{ key: string; node: ReactNode }> = [];

  if (showCall && c.callTelHref) {
    const node = (
      <AutosSheetCtaLink href={c.callTelHref} className={BTN_SECONDARY} {...sheetProps}>
        <FiPhone className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
        {sb.call}
      </AutosSheetCtaLink>
    );
    secondaryCtas.push({ key: "call", node });
    pairRowOne.push({ key: "call", node });
  }
  if (showSms && c.smsHref) {
    const node = (
      <AutosSheetCtaLink href={c.smsHref} className={BTN_SECONDARY} {...sheetProps}>
        <FiMessageSquare className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
        {sb.textMessageCta}
      </AutosSheetCtaLink>
    );
    secondaryCtas.push({ key: "sms", node });
    pairRowOne.push({ key: "sms", node });
  }
  if (showSchedule && c.bookingHref) {
    const node = (
      <a
        href={c.bookingHref}
        target="_blank"
        rel="noopener noreferrer"
        className={BTN_SECONDARY}
        onClick={() => trackHref(c.bookingHref!)}
      >
        <FiCalendar className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
        <span className="text-center leading-tight">{sb.scheduleAppointment}</span>
      </a>
    );
    secondaryCtas.push({ key: "schedule", node });
    pairRowTwo.push({ key: "schedule", node });
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
    pairRowTwo.push({ key: "website", node });
  }
  if (showEmail && c.emailMailto) {
    secondaryCtas.push({
      key: "email",
      node: (
        <AutosSheetCtaLink href={c.emailMailto} lang={lang} className={BTN_SECONDARY} {...sheetProps}>
          <FiMail className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
          {sb.emailSeller}
        </AutosSheetCtaLink>
      ),
    });
  }

  function renderPairRow(items: Array<{ key: string; node: ReactNode }>) {
    if (items.length === 0) return null;
    return (
      <div className={`grid gap-3 ${items.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
        {items.map((item) => (
          <div key={item.key} className="min-w-0">
            {item.node}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`min-w-0 overflow-x-hidden ${
        showPremiumHubHeader
          ? "bg-transparent p-0 shadow-none"
          : "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:p-6 max-lg:bg-[color:var(--lx-card)]"
      } ${className ?? ""}`}
    >
      {showPremiumHubHeader ? (
        <div className={autosPreviewBusinessHubHeaderClass}>
          {lang === "es" ? "Dealer / Negocio" : "Dealer / Business"}
        </div>
      ) : null}
      <div className={showPremiumHubHeader ? "px-5 py-6 sm:px-6 sm:py-7" : ""}>
      {showIdentity ? (
        <div className={`flex items-start gap-4 text-left ${showPremiumHubHeader ? "pb-5 border-b border-[#D6C7AD]/65" : ""}`}>
          <div className="relative h-[6.5rem] w-[6.5rem] shrink-0 overflow-hidden rounded-[10px] border border-[#D6C7AD]/80 bg-[#FFFCF7] shadow-[0_6px_20px_-6px_rgba(42,36,22,0.14)] sm:h-[7.25rem] sm:w-[7.25rem]">
            {data.dealerLogo ? (
              data.dealerLogo.startsWith("data:") ? (
                <img src={data.dealerLogo} alt={logoAlt} className="h-full w-full object-contain p-3" />
              ) : (
                <MediaImage src={data.dealerLogo} alt={logoAlt} fill className="object-contain p-3" sizes="116px" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[#8A6B1F]">
                {(data.dealerName ?? "NA").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            {nonEmpty(data.dealerName) ? (
              <h2 className="break-words text-xl font-extrabold leading-tight tracking-tight text-[#1F241C] sm:text-[1.35rem]">
                {data.dealerName?.trim()}
              </h2>
            ) : null}
            {nonEmpty(serviceArea) ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#5C5346]">
                <FiMapPin className="h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                {serviceArea}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showContactGrid ? (
        <SectionBlock showTopBorder={showIdentity ? true : nextSection()} premium={showPremiumHubHeader}>
          <p className={sectionLabelClass}>{sb.contactHeading}</p>
          <div className="mt-4 flex flex-col gap-3">
            {showWhatsapp && c.whatsappHref ? (
              <AutosSheetCtaLink href={c.whatsappHref} className={BTN_WHATSAPP} {...sheetProps}>
                <SiWhatsapp className="h-5 w-5 shrink-0 text-white" aria-hidden />
                {sb.whatsappCta}
              </AutosSheetCtaLink>
            ) : null}
            {showPremiumHubHeader ? (
              <>
                {renderPairRow(pairRowOne)}
                {renderPairRow(pairRowTwo)}
                {showEmail && c.emailMailto ? (
                  <AutosSheetCtaLink href={c.emailMailto} lang={lang} className={BTN_SECONDARY} {...sheetProps}>
                    <FiMail className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
                    {sb.emailSeller}
                  </AutosSheetCtaLink>
                ) : null}
              </>
            ) : secondaryCtas.length > 0 ? (
              <div
                className={`grid gap-3 ${
                  secondaryCtas.length >= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                }`}
              >
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

      {showReviews ? (
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
          <p className={sectionLabelClass}>{sb.reviewsHeading}</p>
          <div className="mt-4 flex flex-col gap-3">
            {hub.reviews.map((link) => (
              <AutosNegociosHubReviewLinkButton key={link.id} link={link} lang={lang} />
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {showMoreLinks ? (
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
          <p className={sectionLabelClass}>{sb.moreLinksHeading}</p>
          <div
            className={`mt-4 grid gap-3 ${
              hub.moreLinks.length >= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            }`}
          >
            {hub.moreLinks.map((link, i) => (
              <a
                key={`${link.url}-${i}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackHref(link.url)}
                className={`${BTN_SECONDARY} min-h-[48px] px-4`}
              >
                {link.label}
              </a>
            ))}
          </div>
        </SectionBlock>
      ) : null}

      {showLanguages ? (
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
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
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
          <p className={sectionLabelClass}>{sb.followHeading}</p>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
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
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
          <div id={AUTOS_PREVIEW_SECTION_IDS.financing} className="scroll-mt-28">
            <DealerFinanceContact data={data} embedded publicAnalytics={publicAnalytics} premium={showPremiumHubHeader} />
          </div>
        </SectionBlock>
      ) : null}

      {hours.length > 0 ? (
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
          <p className={sectionLabelClass}>{d.hoursHeading}</p>
          {todaysHoursLine ? (
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
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
          <p className={sectionLabelClass}>{sb.locationHeading}</p>
          <div className="mt-4 space-y-4">
            <AutosNegociosBusinessHubFauxMap />
            {nonEmpty(hub.location?.addressDisplay) ? (
              <p className="flex gap-2 text-left text-sm leading-relaxed text-[color:var(--lx-text-2)] lg:text-[15px]">
                <FiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                <span className="font-medium text-[color:var(--lx-text)]">{hub.location?.addressDisplay}</span>
              </p>
            ) : null}
            {hub.location?.mapsHref ? (
              <a
                href={hub.location.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackHref(hub.location!.mapsHref!)}
                className={`${BTN_SECONDARY} gap-2 border-[color:var(--lx-gold-border)]`}
              >
                <FiMapPin className="h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                {sb.openInMaps}
              </a>
            ) : null}
          </div>
        </SectionBlock>
      ) : null}

      {showBuyerInventory && buyerInventoryHref ? (
        <SectionBlock showTopBorder={nextSection()} premium={showPremiumHubHeader}>
          <a href={buyerInventoryHref} className={BTN_PRIMARY}>
            {sb.viewDealerInventory}
          </a>
        </SectionBlock>
      ) : null}
      </div>
    </div>
  );
}
