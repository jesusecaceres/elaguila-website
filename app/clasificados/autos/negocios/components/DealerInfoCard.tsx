import { FiClock, FiGlobe, FiMapPin, FiPhone } from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiYoutube } from "react-icons/si";
import type { AutoDealerListing, DealerSocialKey } from "../types/autoDealerListing";
import { hasDealerCard } from "../lib/autoDealerPresence";
import { filterDealerHoursForDisplay, formatDealerHoursTimeRange } from "../lib/dealerHoursDisplay";
import { safeExternalHref, sanitizeDealerRating, sanitizeReviewCount } from "../lib/dealerDraftSanitize";
import { formatAddressLine, formatUsPhoneDisplay, phoneDigitsForTel } from "./autoDealerFormatters";
import { MediaImage } from "./MediaImage";

const CARD =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] p-4 shadow-[0_4px_24px_-6px_rgba(42,36,22,0.08)]";

const ICON_ROW = "flex gap-3 text-[color:var(--lx-text-2)]";

const SOCIAL_ORDER: DealerSocialKey[] = ["instagram", "facebook", "youtube", "tiktok", "website"];

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

export function DealerInfoCard({ data }: { data: AutoDealerListing }) {
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

  return (
    <div className={CARD}>
      <div className="flex gap-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7]">
          {data.dealerLogo ? (
            <MediaImage
              src={data.dealerLogo}
              alt={data.dealerName?.trim() ? data.dealerName! : "Concesionario"}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[color:var(--lx-muted)]">{initials}</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {nonEmpty(data.dealerName) ? (
            <h2 className="text-base font-bold leading-tight tracking-tight text-[color:var(--lx-text)]">{data.dealerName?.trim()}</h2>
          ) : null}
          {showRatingRow ? (
            <p className="mt-1 text-sm text-[color:var(--lx-muted)]">
              {rOk ? (
                <span className="font-semibold text-[color:var(--lx-gold)]">{ratingVal!.toFixed(1)}</span>
              ) : null}
              {rOk && cOk ? <span aria-hidden> · </span> : null}
              {cOk ? <span>({reviewVal} reseñas)</span> : null}
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-4 space-y-3 text-sm">
        {showPhone ? (
          <li className={ICON_ROW}>
            <FiPhone className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            {phoneForTel ? (
              <a
                href={`tel:${phoneForTel}`}
                className="font-medium text-[color:var(--lx-text)] underline-offset-2 hover:underline"
              >
                {phoneDisplay || data.dealerPhone?.trim()}
              </a>
            ) : (
              <span className="font-medium text-[color:var(--lx-text)]">{phoneDisplay || data.dealerPhone?.trim()}</span>
            )}
          </li>
        ) : null}
        {nonEmpty(addressLine) ? (
          <li className={ICON_ROW}>
            <FiMapPin className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            <span className="leading-snug">{addressLine}</span>
          </li>
        ) : null}
        {hours.length > 0 ? (
          <li className={ICON_ROW}>
            <FiClock className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            <div className="space-y-1.5">
              {hours.map((row, idx) => (
                <p key={row.rowId ?? `hour-${idx}`} className="leading-snug text-[color:var(--lx-text-2)]">
                  <span className="font-semibold text-[color:var(--lx-text)]">{row.day.trim()}:</span>{" "}
                  {formatDealerHoursTimeRange(row)}
                </p>
              ))}
            </div>
          </li>
        ) : null}
        {webRaw ? (
          <li className={ICON_ROW}>
            <FiGlobe className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            {webHref ? (
              <a
                href={webHref}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[color:var(--lx-text)] underline-offset-2 hover:underline"
              >
                Sitio web del concesionario
              </a>
            ) : (
              <span className="font-medium text-[color:var(--lx-text)]">{webRaw}</span>
            )}
          </li>
        ) : null}
      </ul>

      {socials.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--lx-nav-border)] pt-4">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
                aria-label={socialLabel(key)}
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

function socialLabel(key: DealerSocialKey): string {
  switch (key) {
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "website":
      return "Sitio web";
    default:
      return "Enlace";
  }
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
