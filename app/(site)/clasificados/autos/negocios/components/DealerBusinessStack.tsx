"use client";

import type { ReactNode } from "react";
import { FiCalendar, FiClock, FiGlobe, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { TbWorldWww } from "react-icons/tb";
import { SiFacebook, SiInstagram, SiTiktok, SiWhatsapp, SiYoutube } from "react-icons/si";
import type { AutoDealerListing, DealerSocialKey } from "../types/autoDealerListing";
import { hasDealerCard } from "../lib/autoDealerPresence";
import { filterDealerHoursForDisplay, formatDealerHoursTimeRange } from "../lib/dealerHoursDisplay";
import { safeExternalHref } from "../lib/dealerDraftSanitize";
import { resolveDealerBookingHref, resolveDealerOfficePhone } from "../lib/dealerContactResolve";
import { whatsAppHrefFromDisplay } from "../lib/dealerWhatsappHref";
import {
  formatCityStateLabel,
  hrefForUserWebsiteUrl,
  phoneDigitsForTel,
} from "./autoDealerFormatters";
import { buildDealerDisplayAddress, buildDealerMapsHref } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";
import { MediaImage } from "./MediaImage";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { AutosSheetCtaLink } from "@/app/clasificados/autos/shared/components/AutosSheetCtaLink";

const BTN_PRIMARY =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99] max-lg:min-h-[54px]";

const BTN_SECONDARY =
  "inline-flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-center text-[13px] font-semibold leading-tight text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] max-lg:min-h-[50px]";

const CTA_TILE =
  "flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl bg-[color:var(--lx-cta-dark)] px-3 py-3 text-center text-[11px] font-bold leading-snug text-[#FFFCF7] shadow-[0_10px_28px_-10px_rgba(26,22,18,0.55)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.98] max-lg:min-h-[88px] max-lg:text-xs";

const SECTION_HEAD =
  "text-[11px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--lx-text)]";

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
 * Premium dealership contact card for Autos Negocios preview and public detail.
 */
export function DealerBusinessStack({
  data,
  className,
  buyerInventoryHref,
}: {
  data: AutoDealerListing;
  className?: string;
  /** Public buyer context only — never owner dashboard inventory management. */
  buyerInventoryHref?: string | null;
}) {
  const { t, lang } = useAutosNegociosPreviewCopy();
  const sb = t.preview.sidebar;
  const d = t.preview.dealer;
  const socialLabels = t.app.dealer.socialLabels;

  const showIdentity = hasDealerCard(data);
  const serviceArea = formatCityStateLabel(data.city, data.state);

  const socials = SOCIAL_ORDER.filter((k) => {
    const u = data.dealerSocials?.[k]?.trim();
    return Boolean(u && safeExternalHref(u));
  });

  const hours = filterDealerHoursForDisplay(data.dealerHours);

  const officePhoneRaw = resolveDealerOfficePhone(data);
  const phoneForTel = phoneDigitsForTel(officePhoneRaw);
  const validTelForCta = phoneForTel.length >= 10;
  const waHref = whatsAppHrefFromDisplay(data.dealerWhatsapp ?? undefined);
  const showWhatsapp = Boolean(waHref);

  const emailRaw = data.dealerEmail?.trim();
  const emailHref = emailRaw ? `mailto:${encodeURIComponent(emailRaw)}` : undefined;
  const showEmail = Boolean(emailHref);

  const addressLine = buildDealerDisplayAddress(data);
  const mapsHref = buildDealerMapsHref(data);

  const initials = (data.dealerName ?? "NA").slice(0, 2).toUpperCase();

  const webRaw = data.dealerWebsite?.trim();
  const websiteClickHref = hrefForUserWebsiteUrl(data.dealerWebsite) ?? (webRaw ? safeExternalHref(data.dealerWebsite) : undefined);
  const showWebsiteCta = Boolean(websiteClickHref);

  const bookingHref = resolveDealerBookingHref(data);
  const showSchedule = Boolean(bookingHref);
  const showCallCta = validTelForCta;
  const showContactGrid = showWhatsapp || showCallCta || showSchedule || showEmail;
  const showSocialCluster = socials.length > 0;
  const showBuyerInventory = Boolean(buyerInventoryHref?.trim());

  const logoAlt = data.dealerName?.trim() ? data.dealerName.trim() : d.logoAltFallback;

  const contactTiles: { key: string; node: ReactNode }[] = [];
  if (showWhatsapp && waHref) {
    contactTiles.push({
      key: "wa",
      node: (
        <AutosSheetCtaLink href={waHref} className={CTA_TILE}>
          <SiWhatsapp className="h-6 w-6 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
          {sb.whatsappCta}
        </AutosSheetCtaLink>
      ),
    });
  }
  if (showCallCta) {
    contactTiles.push({
      key: "call",
      node: (
        <AutosSheetCtaLink href={`tel:${phoneForTel}`} className={CTA_TILE}>
          <FiPhone className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
          {sb.call}
        </AutosSheetCtaLink>
      ),
    });
  }
  if (showSchedule && bookingHref) {
    contactTiles.push({
      key: "schedule",
      node: (
        <a href={bookingHref} target="_blank" rel="noopener noreferrer" className={CTA_TILE}>
          <FiCalendar className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
          <span className="max-w-[9rem]">{sb.scheduleAppointment}</span>
        </a>
      ),
    });
  }
  if (showEmail && emailHref) {
    contactTiles.push({
      key: "email",
      node: (
        <AutosSheetCtaLink href={emailHref} lang={lang} className={CTA_TILE}>
          <FiMail className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
          {sb.emailSeller}
        </AutosSheetCtaLink>
      ),
    });
  }

  return (
    <div
      className={`min-w-0 overflow-x-hidden rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:p-6 max-lg:bg-[color:var(--lx-card)] ${className ?? ""}`}
    >
      {showIdentity ? (
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="relative h-[8.5rem] w-[8.5rem] shrink-0 overflow-hidden rounded-[24px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.16)] max-lg:h-[9rem] max-lg:w-[9rem] lg:h-[7.75rem] lg:w-[7.75rem]">
            {data.dealerLogo ? (
              data.dealerLogo.startsWith("data:") ? (
                <img src={data.dealerLogo} alt={logoAlt} className="h-full w-full object-contain p-3" />
              ) : (
                <MediaImage src={data.dealerLogo} alt={logoAlt} fill className="object-contain p-3" sizes="144px" />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl font-bold text-[color:var(--lx-muted)]">
                {initials}
              </div>
            )}
          </div>
          {nonEmpty(data.dealerName) ? (
            <h2 className="mt-5 break-words text-xl font-extrabold leading-tight tracking-tight text-[color:var(--lx-text)] max-lg:text-[1.35rem]">
              {data.dealerName?.trim()}
            </h2>
          ) : null}
          {nonEmpty(serviceArea) ? (
            <p className="mt-2 text-sm font-semibold text-[color:var(--lx-text-2)]">{serviceArea}</p>
          ) : null}
        </div>
      ) : null}

      {showContactGrid ? (
        <div
          className={`${showIdentity ? "mt-6 border-t border-[color:var(--lx-nav-border)] pt-6" : ""}`}
        >
          <p className={SECTION_HEAD}>{sb.contactHeading}</p>
          <div
            className={`mt-4 grid gap-3 ${
              contactTiles.length >= 3 ? "grid-cols-2" : contactTiles.length === 2 ? "grid-cols-2" : "grid-cols-1"
            }`}
          >
            {contactTiles.map((tile) => (
              <div key={tile.key}>{tile.node}</div>
            ))}
          </div>
          {showWebsiteCta && websiteClickHref ? (
            <a
              href={websiteClickHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_SECONDARY} mt-3 gap-2`}
            >
              <TbWorldWww className="h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              {sb.viewWebsite}
            </a>
          ) : null}
        </div>
      ) : null}

      {nonEmpty(addressLine) || mapsHref ? (
        <div className="mt-6 border-t border-[color:var(--lx-nav-border)] pt-6">
          <p className={SECTION_HEAD}>{lang === "es" ? "Nuestra ubicación" : "Our location"}</p>
          {nonEmpty(addressLine) ? (
            <p className="mt-3 flex gap-2 text-left text-sm leading-relaxed text-[color:var(--lx-text-2)] lg:text-[15px]">
              <FiMapPin className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              <span className="font-medium text-[color:var(--lx-text)]">{addressLine}</span>
            </p>
          ) : null}
          {mapsHref ? (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`${BTN_SECONDARY} mt-4 gap-2 border-[color:var(--lx-gold-border)]`}
            >
              <FiMapPin className="h-[18px] w-[18px] shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
              {sb.openInMaps}
            </a>
          ) : null}
        </div>
      ) : null}

      {showSocialCluster ? (
        <div className="mt-6 border-t border-[color:var(--lx-nav-border)] pt-6">
          <p className={SECTION_HEAD}>{sb.followHeading}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5 lg:justify-start">
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
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)]"
                  aria-label={socialLabels[key]}
                >
                  <SocialIcon kind={key} />
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      {hours.length > 0 ? (
        <div className="mt-6 border-t border-[color:var(--lx-nav-border)] pt-6">
          <p className={SECTION_HEAD}>{d.hoursHeading}</p>
          <div className="mt-4 flex gap-3">
            <FiClock className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
            <div className="min-w-0 flex-1 space-y-2.5">
              {hours.map((row, idx) => (
                <p key={row.rowId ?? `hour-${idx}`} className="text-[15px] leading-relaxed text-[color:var(--lx-text-2)]">
                  <span className="font-bold text-[color:var(--lx-text)]">{row.day.trim()}:</span>{" "}
                  <span className="font-medium">{formatDealerHoursTimeRange(row)}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showBuyerInventory && buyerInventoryHref ? (
        <div className="mt-6 border-t border-[color:var(--lx-nav-border)] pt-6">
          <a href={buyerInventoryHref} className={BTN_PRIMARY}>
            {sb.viewDealerInventory}
          </a>
        </div>
      ) : null}
    </div>
  );
}
