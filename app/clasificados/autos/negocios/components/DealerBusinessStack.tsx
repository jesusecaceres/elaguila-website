"use client";

import { FiCalendar, FiClock, FiGlobe, FiMapPin, FiMessageCircle, FiPhone } from "react-icons/fi";
import { TbWorldWww } from "react-icons/tb";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import type { AutoDealerListing, DealerSocialKey } from "../types/autoDealerListing";
import { hasDealerCard } from "../lib/autoDealerPresence";
import { filterDealerHoursForDisplay, formatDealerHoursTimeRange } from "../lib/dealerHoursDisplay";
import { safeExternalHref, sanitizeDealerRating, sanitizeReviewCount } from "../lib/dealerDraftSanitize";
import { formatAddressLine, formatUsPhoneDisplay, hrefForUserWebsiteUrl, phoneDigitsForTel } from "./autoDealerFormatters";
import { MediaImage } from "./MediaImage";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";

const BTN_PRIMARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99] max-lg:min-h-[52px] max-lg:text-[15px] max-lg:shadow-[0_10px_28px_-8px_rgba(26,22,18,0.5)] max-lg:ring-1 max-lg:ring-[color:var(--lx-gold-border)]/25";

const BTN_SECONDARY =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-2 text-center text-[13px] font-semibold leading-tight text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] sm:px-3 sm:text-sm active:scale-[0.99] max-lg:min-h-[46px] max-lg:gap-1.5 max-lg:px-2.5 max-lg:text-[12px] max-lg:leading-snug";

const BTN_WEBSITE_CLUSTER =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--lx-gold-border)]/80 bg-[color:var(--lx-section)] px-3 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] max-lg:min-h-[50px] max-lg:bg-[#FFFCF7]";

const ICON_ROW = "flex gap-3 text-[color:var(--lx-text-2)] max-lg:gap-3.5 max-lg:text-[15px] max-lg:leading-snug";

const SOCIAL_ORDER: DealerSocialKey[] = ["instagram", "facebook", "youtube", "tiktok", "website"];

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

function SocialIcon({ kind }: { kind: DealerSocialKey }) {
  const className = "h-[18px] w-[18px]";
  switch (kind) {
    case "instagram":
      return <SiInstagram className={className} />;
    case "facebook":
      return <SiFacebook className={className} />;
    case "youtube":
      return <SiYoutube className={className} />;
    case "tiktok":
      return <SiTiktok className={className} />;
    case "website":
      return <FiGlobe className={className} />;
    default:
      return <FiGlobe className={className} />;
  }
}

/**
 * Unified dealership contact stack for Autos Negocios preview (sidebar / mobile column).
 * Order: identity → website & socials → CTAs → hours. No duplicate vehicle price/location (see title band).
 */
export function DealerBusinessStack({ data, className }: { data: AutoDealerListing; className?: string }) {
  const { t } = useAutosNegociosPreviewCopy();
  const sb = t.preview.sidebar;
  const d = t.preview.dealer;
  const socialLabels = t.app.dealer.socialLabels;

  const showIdentity = hasDealerCard(data);

  const socials = SOCIAL_ORDER.filter((k) => {
    const u = data.dealerSocials?.[k]?.trim();
    return Boolean(u && safeExternalHref(u));
  });
  const hours = filterDealerHoursForDisplay(data.dealerHours);
  const ratingVal = sanitizeDealerRating(data.dealerRating);
  const reviewVal = sanitizeReviewCount(data.dealerReviewCount);
  const rOk = ratingVal !== undefined;
  const cOk = reviewVal !== undefined;
  const showRatingRow = rOk || cOk;

  const phoneDisplay = formatUsPhoneDisplay(data.dealerPhone);
  const phoneForTel = phoneDigitsForTel(data.dealerPhone);
  const showPhone = nonEmpty(data.dealerPhone) && (phoneDisplay.length > 0 || phoneForTel.length > 0);

  const addressLine = formatAddressLine(data.dealerAddress);

  const initials = (data.dealerName ?? "NA").slice(0, 2).toUpperCase();

  const webRaw = data.dealerWebsite?.trim();
  const webHref = webRaw ? safeExternalHref(data.dealerWebsite) : undefined;
  const websiteClickHref = hrefForUserWebsiteUrl(data.dealerWebsite) ?? webHref ?? undefined;

  const showWebsiteRow = nonEmpty(webRaw);
  const showSocialCluster = socials.length > 0;
  const showWebSocialBlock = showIdentity && (showWebsiteRow || showSocialCluster);

  const logoAlt = data.dealerName?.trim() ? data.dealerName.trim() : d.logoAltFallback;

  return (
    <div
      className={`rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:p-6 max-lg:bg-[color:var(--lx-card)] ${className ?? ""}`}
    >
      {showIdentity ? (
        <>
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="relative h-[7rem] w-[7rem] shrink-0 overflow-hidden rounded-[22px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] shadow-[0_6px_28px_-6px_rgba(42,36,22,0.14)] max-lg:h-[7.75rem] max-lg:w-[7.75rem] max-lg:rounded-[24px] lg:h-[6.75rem] lg:w-[6.75rem]">
              {data.dealerLogo ? (
                data.dealerLogo.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.dealerLogo} alt={logoAlt} className="h-full w-full object-contain p-2.5" />
                ) : (
                  <MediaImage
                    src={data.dealerLogo}
                    alt={logoAlt}
                    fill
                    className="object-contain p-2.5"
                    sizes="128px"
                  />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[color:var(--lx-muted)] max-lg:text-xl">
                  {initials}
                </div>
              )}
            </div>
            {nonEmpty(data.dealerName) ? (
              <h2 className="mt-5 break-words text-lg font-extrabold leading-tight tracking-tight text-[color:var(--lx-text)] max-lg:mt-5 max-lg:text-xl max-lg:leading-snug">
                {data.dealerName?.trim()}
              </h2>
            ) : null}
            {showRatingRow ? (
              <p className="mt-2 text-sm text-[color:var(--lx-muted)] max-lg:mt-2.5 max-lg:text-[15px]">
                {rOk ? (
                  <span className="font-semibold tabular-nums text-[color:var(--lx-gold)] max-lg:inline-flex max-lg:items-center max-lg:rounded-full max-lg:border max-lg:border-[color:var(--lx-gold-border)]/45 max-lg:bg-[color:var(--lx-nav-hover)] max-lg:px-2.5 max-lg:py-0.5 max-lg:text-sm max-lg:font-bold lg:font-semibold lg:text-[color:var(--lx-gold)]">
                    {ratingVal!.toFixed(1)}
                  </span>
                ) : null}
                {rOk && cOk ? <span aria-hidden> · </span> : null}
                {cOk ? (
                  <span className="font-medium text-[color:var(--lx-text-2)] max-lg:font-semibold max-lg:text-[color:var(--lx-text)]">
                    {d.reviewsLine(reviewVal!)}
                  </span>
                ) : null}
              </p>
            ) : null}
          </div>

          {(showPhone || nonEmpty(addressLine)) && (
            <ul className="mt-5 space-y-3.5 text-sm max-lg:space-y-4">
              {showPhone ? (
                <li className={`${ICON_ROW} lg:justify-start`}>
                  <FiPhone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)] max-lg:h-5 max-lg:w-5" aria-hidden />
                  {phoneForTel ? (
                    <a
                      href={`tel:${phoneForTel}`}
                      className="font-semibold text-[color:var(--lx-text)] underline-offset-2 hover:underline max-lg:text-[16px]"
                    >
                      {phoneDisplay || data.dealerPhone?.trim()}
                    </a>
                  ) : (
                    <span className="font-semibold text-[color:var(--lx-text)] max-lg:text-[16px]">
                      {phoneDisplay || data.dealerPhone?.trim()}
                    </span>
                  )}
                </li>
              ) : null}
              {nonEmpty(addressLine) ? (
                <li className={`${ICON_ROW} lg:justify-start lg:text-left`}>
                  <FiMapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)] max-lg:mt-0.5 max-lg:h-5 max-lg:w-5" aria-hidden />
                  <span className="text-left leading-snug text-[color:var(--lx-text-2)] max-lg:text-[15px] max-lg:font-medium max-lg:text-[color:var(--lx-text)]">
                    {addressLine}
                  </span>
                </li>
              ) : null}
            </ul>
          )}
        </>
      ) : null}

      {showWebSocialBlock ? (
        <div className="mt-5 border-t border-[color:var(--lx-nav-border)] pt-5 max-lg:border-[color:var(--lx-nav-border)]/80">
          {showWebsiteRow && websiteClickHref ? (
            <a href={websiteClickHref} target="_blank" rel="noopener noreferrer" className={BTN_WEBSITE_CLUSTER}>
              <TbWorldWww className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {sb.viewWebsite}
            </a>
          ) : showWebsiteRow && webRaw ? (
            <span className={`${BTN_WEBSITE_CLUSTER} pointer-events-none opacity-80`}>{webRaw}</span>
          ) : null}

          {showSocialCluster ? (
            <div className={`flex flex-wrap justify-center gap-2.5 max-lg:gap-3 lg:justify-start ${showWebsiteRow ? "mt-4" : ""}`}>
              {socials.map((key) => {
                const raw = data.dealerSocials?.[key]?.trim();
                if (!raw) return null;
                const resolved = safeExternalHref(raw);
                if (!resolved) return null;
                return (
                  <a
                    key={key}
                    href={resolved}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
                    aria-label={socialLabels[key]}
                  >
                    <SocialIcon kind={key} />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        className={`flex flex-col gap-3 max-lg:gap-3.5 ${
          showIdentity || showWebSocialBlock ? "mt-5 border-t border-[color:var(--lx-nav-border)] pt-5 max-lg:border-[color:var(--lx-nav-border)]/80" : ""
        }`}
      >
        <button type="button" className={BTN_PRIMARY}>
          {sb.availability}
        </button>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3 max-lg:grid-cols-3 max-lg:gap-2">
          <button type="button" className={BTN_SECONDARY}>
            <FiPhone className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {sb.call}
          </button>
          <button type="button" className={BTN_SECONDARY}>
            <FiMessageCircle className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {sb.chat}
          </button>
          <button type="button" className={BTN_SECONDARY}>
            <FiCalendar className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className="max-[380px]:[font-size:11px]">{sb.scheduleDrive}</span>
          </button>
        </div>
      </div>

      {hours.length > 0 ? (
        <div className="mt-5 border-t border-[color:var(--lx-nav-border)] pt-5 max-lg:border-[color:var(--lx-nav-border)]/80">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)] max-lg:mb-3.5">
            {d.hoursHeading}
          </p>
          <div className="flex gap-3 max-lg:items-start max-lg:gap-3.5">
            <FiClock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)] max-lg:mt-1 max-lg:h-5 max-lg:w-5" aria-hidden />
            <div className="min-w-0 flex-1 space-y-2.5 max-lg:space-y-3">
              {hours.map((row, idx) => (
                <p
                  key={row.rowId ?? `hour-${idx}`}
                  className="text-[15px] leading-relaxed text-[color:var(--lx-text-2)] max-lg:text-[15px] max-lg:leading-relaxed"
                >
                  <span className="font-bold text-[color:var(--lx-text)]">{row.day.trim()}:</span>{" "}
                  <span className="font-medium text-[color:var(--lx-text-2)]">{formatDealerHoursTimeRange(row)}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
