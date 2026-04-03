"use client";

import { FiClock, FiGlobe, FiMapPin, FiPhone } from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import type { AutoDealerListing, DealerSocialKey } from "../types/autoDealerListing";
import { hasDealerCard } from "../lib/autoDealerPresence";
import { filterDealerHoursForDisplay, formatDealerHoursTimeRange } from "../lib/dealerHoursDisplay";
import { safeExternalHref, sanitizeDealerRating, sanitizeReviewCount } from "../lib/dealerDraftSanitize";
import { formatAddressLine, formatUsPhoneDisplay, phoneDigitsForTel } from "./autoDealerFormatters";
import { MediaImage } from "./MediaImage";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4 shadow-[0_4px_24px_-6px_rgba(42,36,22,0.08)]";

const ICON_ROW =
  "flex gap-3 text-[color:var(--lx-text-2)] max-lg:gap-3.5 max-lg:text-[15px] max-lg:leading-snug";

const SOCIAL_ORDER: DealerSocialKey[] = ["instagram", "facebook", "youtube", "tiktok", "website"];

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function DealerInfoCard({ data, className }: { data: AutoDealerListing; className?: string }) {
  const { t } = useAutosNegociosPreviewCopy();
  const d = t.preview.dealer;
  const socialLabels = t.app.dealer.socialLabels;

  if (!hasDealerCard(data)) return null;

  const socials = SOCIAL_ORDER.filter((k) => {
    const u = data.dealerSocials?.[k]?.trim();
    return Boolean(u && safeExternalHref(u));
  });
  const hours = filterDealerHoursForDisplay(data.dealerHours);
  const ratingVal = sanitizeDealerRating(data.dealerRating);
  const reviewVal = sanitizeReviewCount(data.dealerReviewCount);
  const rOk = ratingVal !== undefined;
  const cOk = reviewVal !== undefined;

  const phoneDisplay = formatUsPhoneDisplay(data.dealerPhone);
  const phoneForTel = phoneDigitsForTel(data.dealerPhone);
  const showPhone = nonEmpty(data.dealerPhone) && (phoneDisplay.length > 0 || phoneForTel.length > 0);

  const addressLine = formatAddressLine(data.dealerAddress);

  const initials = (data.dealerName ?? "NA").slice(0, 2).toUpperCase();

  const showRatingRow = rOk || cOk;

  const webRaw = data.dealerWebsite?.trim();
  const webHref = webRaw ? safeExternalHref(data.dealerWebsite) : undefined;

  const logoAlt = data.dealerName?.trim() ? data.dealerName.trim() : d.logoAltFallback;

  return (
    <div className={`${CARD} ${className ?? ""}`}>
      <div className="flex items-start gap-4 max-lg:gap-4">
        <div className="relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] shadow-[0_2px_12px_rgba(42,36,22,0.06)] max-lg:h-[5.25rem] max-lg:w-[5.25rem] max-lg:rounded-[18px] max-lg:shadow-[0_4px_16px_-4px_rgba(42,36,22,0.1)]">
          {data.dealerLogo ? (
            data.dealerLogo.startsWith("data:") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.dealerLogo} alt={logoAlt} className="h-full w-full object-contain p-1.5" />
            ) : (
              <MediaImage
                src={data.dealerLogo}
                alt={logoAlt}
                fill
                className="object-contain p-1.5"
                sizes="84px"
              />
            )
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold text-[color:var(--lx-muted)] max-lg:text-base">{initials}</div>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5 max-lg:pt-1">
          {nonEmpty(data.dealerName) ? (
            <h2 className="break-words text-base font-bold leading-tight tracking-tight text-[color:var(--lx-text)] max-lg:text-lg max-lg:font-extrabold max-lg:tracking-tight max-lg:text-[color:var(--lx-text)]">
              {data.dealerName?.trim()}
            </h2>
          ) : null}
          {showRatingRow ? (
            <p className="mt-1.5 text-sm text-[color:var(--lx-muted)] max-lg:mt-2 max-lg:text-[15px]">
              {rOk ? (
                <span className="font-semibold tabular-nums text-[color:var(--lx-gold)] max-lg:inline-flex max-lg:items-center max-lg:rounded-full max-lg:border max-lg:border-[color:var(--lx-gold-border)]/45 max-lg:bg-[color:var(--lx-nav-hover)] max-lg:px-2.5 max-lg:py-0.5 max-lg:text-sm max-lg:font-bold">
                  {ratingVal!.toFixed(1)}
                </span>
              ) : null}
              {rOk && cOk ? <span aria-hidden> · </span> : null}
              {cOk ? (
                <span className="font-medium text-[color:var(--lx-text-2)] max-lg:font-semibold max-lg:text-[color:var(--lx-text)]">{d.reviewsLine(reviewVal!)}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-4 space-y-3 text-sm max-lg:mt-5 max-lg:space-y-3.5">
        {showPhone ? (
          <li className={ICON_ROW}>
            <FiPhone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)] max-lg:mt-1 max-lg:h-5 max-lg:w-5" aria-hidden />
            {phoneForTel ? (
              <a
                href={`tel:${phoneForTel}`}
                className="font-semibold text-[color:var(--lx-text)] underline-offset-2 hover:underline max-lg:text-[15px]"
              >
                {phoneDisplay || data.dealerPhone?.trim()}
              </a>
            ) : (
              <span className="font-semibold text-[color:var(--lx-text)] max-lg:text-[15px]">{phoneDisplay || data.dealerPhone?.trim()}</span>
            )}
          </li>
        ) : null}
        {nonEmpty(addressLine) ? (
          <li className={ICON_ROW}>
            <FiMapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)] max-lg:mt-1 max-lg:h-5 max-lg:w-5" aria-hidden />
            <span className="leading-snug text-[color:var(--lx-text-2)] max-lg:font-medium max-lg:text-[color:var(--lx-text)]">{addressLine}</span>
          </li>
        ) : null}
        {hours.length > 0 ? (
          <li className={`${ICON_ROW} max-lg:items-start`}>
            <FiClock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)] max-lg:mt-1.5 max-lg:h-5 max-lg:w-5" aria-hidden />
            <div className="space-y-1.5 max-lg:space-y-2.5">
              {hours.map((row, idx) => (
                <p
                  key={row.rowId ?? `hour-${idx}`}
                  className="leading-snug text-[color:var(--lx-text-2)] max-lg:text-[15px] max-lg:leading-relaxed"
                >
                  <span className="font-bold text-[color:var(--lx-text)] max-lg:font-bold max-lg:text-[color:var(--lx-text)]">{row.day.trim()}:</span>{" "}
                  <span className="font-medium max-lg:text-[color:var(--lx-text-2)]">{formatDealerHoursTimeRange(row)}</span>
                </p>
              ))}
            </div>
          </li>
        ) : null}
        {webRaw ? (
          <li className={`${ICON_ROW} max-lg:pt-0.5`}>
            <FiGlobe className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)] max-lg:mt-1 max-lg:h-5 max-lg:w-5" aria-hidden />
            {webHref ? (
              <a
                href={webHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[color:var(--lx-text)] underline-offset-2 hover:underline max-lg:text-[15px]"
              >
                {d.websiteCta}
              </a>
            ) : (
              <span className="font-semibold text-[color:var(--lx-text)] max-lg:text-[15px]">{webRaw}</span>
            )}
          </li>
        ) : null}
      </ul>

      {socials.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--lx-nav-border)] pt-4 max-lg:mt-5 max-lg:gap-3 max-lg:pt-5">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] max-lg:h-11 max-lg:w-11 max-lg:border-[color:var(--lx-nav-border)]/90"
                aria-label={socialLabels[key]}
              >
                <SocialIcon kind={key} />
              </a>
            );
          })}
        </div>
      ) : null}
    </div>
  );
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
