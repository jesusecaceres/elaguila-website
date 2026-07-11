"use client";

import { FiMail, FiMessageCircle, FiPhone, FiGlobe } from "react-icons/fi";
import { SiWhatsapp, SiFacebook, SiInstagram, SiTiktok, SiYoutube, SiX } from "react-icons/si";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { resolveDealerOfficePhone } from "@/app/clasificados/autos/negocios/lib/dealerContactResolve";
import { formatUsPhoneDisplay, phoneDigitsForTel, formatCityStateZipLine } from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { buildPrivadoSellerMailtoHref, buildPrivadoSiteMessageHref, buildPrivadoWhatsappInterestHref } from "../lib/privadoContactIntent";
import { AutosSheetCtaLink } from "@/app/clasificados/autos/shared/components/AutosSheetCtaLink";
import {
  autosAnalyticsTrackMeta,
  autosSheetCtaAnalyticsProps,
  type AutosPublicListingAnalyticsProps,
} from "../../lib/autosAnalyticsIdentity";
import { trackAutosListingContactCta } from "../../lib/autosCtaTracking";

const BTN_PRIMARY =
  "touch-manipulation inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99]";

const BTN_SECONDARY =
  "touch-manipulation inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-center text-[13px] font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] sm:px-3.5 sm:text-sm";

function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length < 4) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Private seller contact — strong CTAs; optional seller-provided socials (https only). */
export function PrivadoContactStrip({
  data,
  lang,
  labels,
  publicAnalytics,
}: {
  data: AutoDealerListing;
  lang: AutosNegociosLang;
  publicAnalytics?: AutosPublicListingAnalyticsProps;
  labels: {
    call: string;
    whatsapp: string;
    messageSite: string;
    emailSeller: string;
    sms: string;
    sellerHeading: string;
    seller: string;
    safetyNote: string;
    publishedOnLeonix: string;
  };
}) {
  const office = resolveDealerOfficePhone(data);
  const phoneDisplay = formatUsPhoneDisplay(office);
  const phoneForTel = phoneDigitsForTel(office);
  /** Same threshold as Negocios `DealerBusinessStack`: avoid dead `tel:` short fragments. */
  const validTelForCta = phoneForTel.length >= 10;
  const showCall = validTelForCta && Boolean(phoneForTel);

  const waHref = buildPrivadoWhatsappInterestHref(data, lang);
  const showWa = Boolean(waHref);

  const mailtoHref = buildPrivadoSellerMailtoHref(data, lang);
  const showEmail = Boolean(mailtoHref);

  const smsHref = showCall ? `sms:${phoneForTel}` : undefined;
  const showSms = Boolean(smsHref);
  const siteMessageHref = buildPrivadoSiteMessageHref(lang, data);

  const seller = data.dealerName?.trim();
  const socials = data.dealerSocials ?? {};
  const website = data.dealerWebsite;

  // Compute seller location for display
  const sellerLoc = formatCityStateZipLine(data.city, data.state, data.zip);

  // Optional location for meeting
  const hasLocation =
    Boolean(data.dealerAddress) ||
    Boolean(data.dealerAddressCity) ||
    Boolean(data.dealerAddressState) ||
    Boolean(data.dealerAddressZip);
  
  // Build address string for maps query
  const locationParts = [
    data.dealerAddress?.trim(),
    data.dealerAddressCity?.trim(),
    data.dealerAddressState?.trim(),
    data.dealerAddressZip?.trim(),
  ].filter(Boolean);
  const locationString = locationParts.join(", ");
  const mapsUrl = locationString ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationString)}` : null;

  // Optional social links - only show if valid URLs
  const socialLinks: Array<{ platform: string; url: string; icon: React.ReactNode }> = [];
  if (socials?.facebook && isValidUrl(socials.facebook)) {
    socialLinks.push({ platform: "Facebook", url: socials.facebook, icon: <SiFacebook className="h-5 w-5 text-[#1877F2]" /> });
  }
  if (socials?.instagram && isValidUrl(socials.instagram)) {
    socialLinks.push({ platform: "Instagram", url: socials.instagram, icon: <SiInstagram className="h-5 w-5 text-[#E4405F]" /> });
  }
  if (socials?.tiktok && isValidUrl(socials.tiktok)) {
    socialLinks.push({ platform: "TikTok", url: socials.tiktok, icon: <SiTiktok className="h-5 w-5 text-[#000000]" /> });
  }
  if (socials?.youtube && isValidUrl(socials.youtube)) {
    socialLinks.push({ platform: "YouTube", url: socials.youtube, icon: <SiYoutube className="h-5 w-5 text-[#FF0000]" /> });
  }
  if (socials?.x && isValidUrl(socials.x)) {
    socialLinks.push({ platform: "X", url: socials.x, icon: <SiX className="h-5 w-5 text-[#000000]" /> });
  }
  if (website && isValidUrl(website)) {
    socialLinks.push({ platform: "Website", url: website, icon: <FiGlobe className="h-5 w-5 text-[color:var(--lx-text)]" /> });
  }

  const hasAnyCta = showCall || showWa || showEmail || showSms || Boolean(siteMessageHref);
  if (!seller && !hasAnyCta) return null;

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

  const isEs = lang === "es";

  return (
    <section className="min-w-0 overflow-hidden rounded-[24px] border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)]">
      {/* Burgundy top band */}
      <div className="bg-[#7A1E2C] px-6 py-4 sm:px-8 sm:py-5">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#FFFCF7] sm:text-base">
          {isEs ? "CONTACTO DEL VENDEDOR" : "SELLER CONTACT"}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        {/* Seller identity block */}
        <div className="flex items-start gap-4">
          {/* Circular avatar */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[color:var(--lx-gold-border)] bg-[#FFFDF7] text-2xl sm:h-20 sm:w-20 sm:text-3xl">
            👤
          </div>
          <div className="min-w-0 flex-1">
            {seller ? (
              <>
                <h2 className="break-words text-xl font-extrabold leading-tight tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
                  {seller}
                </h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#C9A84A] sm:text-sm">
                  {isEs ? "Vendedor particular" : "Private seller"}
                </p>
              </>
            ) : (
              <h2 className="break-words text-xl font-extrabold leading-tight tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
                {isEs ? "Contacto del vendedor" : "Seller contact"}
              </h2>
            )}
            {sellerLoc ? (
              <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{sellerLoc}</p>
            ) : null}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 h-px bg-[color:var(--lx-gold-border)]" />

        {/* Main contact CTAs */}
        <div className={`flex flex-col gap-3 sm:gap-4`}>
          {showCall && phoneForTel ? (
            <AutosSheetCtaLink
              href={`tel:${phoneForTel}`}
              lang={lang}
              className={`${BTN_PRIMARY} flex-col gap-1 py-4`}
              {...sheetProps}
            >
              <span className="inline-flex items-center gap-3">
                <FiPhone className="h-6 w-6 shrink-0" aria-hidden />
                <span className="text-lg">{labels.call}</span>
              </span>
              {phoneDisplay || office ? (
                <span className="max-w-full truncate text-center text-sm font-semibold tabular-nums opacity-90">
                  {phoneDisplay || office}
                </span>
              ) : null}
            </AutosSheetCtaLink>
          ) : null}
          {showWa && waHref ? (
            <AutosSheetCtaLink href={waHref} lang={lang} className={`${BTN_SECONDARY} gap-3`} {...sheetProps}>
              <SiWhatsapp className="h-6 w-6 shrink-0 text-[#25D366]" aria-hidden />
              <span className="text-base">{labels.whatsapp}</span>
            </AutosSheetCtaLink>
          ) : null}
          <AutosSheetCtaLink
            href={siteMessageHref}
            lang={lang}
            className={`${BTN_SECONDARY} gap-3`}
            {...sheetProps}
            onOpen={() => {
              if (contactMeta) trackAutosListingContactCta("message", contactMeta);
            }}
          >
            <FiMessageCircle className="h-6 w-6 shrink-0 text-[color:var(--lx-text)]" aria-hidden />
            <span className="text-base">{labels.messageSite}</span>
          </AutosSheetCtaLink>
          {showEmail && mailtoHref ? (
            <AutosSheetCtaLink href={mailtoHref} lang={lang} className={`${BTN_SECONDARY} gap-3`} {...sheetProps}>
              <FiMail className="h-6 w-6 shrink-0" aria-hidden />
              <span className="text-base">{labels.emailSeller}</span>
            </AutosSheetCtaLink>
          ) : null}
          {showSms && smsHref ? (
            <AutosSheetCtaLink href={smsHref} lang={lang} className={`${BTN_SECONDARY} gap-3`} {...sheetProps}>
              <FiMessageCircle className="h-6 w-6 shrink-0 text-[color:var(--lx-text)]" aria-hidden />
              <span className="text-base">{labels.sms}</span>
            </AutosSheetCtaLink>
          ) : null}
        </div>

        {/* Optional socials */}
        {socialLinks.length > 0 && (
          <div className="mt-6 border-t border-[color:var(--lx-gold-border)] pt-6">
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">
              {isEs ? "También puedes encontrarme aquí" : "You can also find me here"}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-3 rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-4 text-sm font-medium text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold)] hover:bg-[color:var(--lx-nav-hover)]"
                  aria-label={`${link.platform}`}
                >
                  {link.icon}
                  <span>{link.platform}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Optional location */}
        {hasLocation && (
          <div className="mt-6 border-t border-[color:var(--lx-gold-border)] pt-6">
            <p className="text-sm font-semibold text-[color:var(--lx-text)]">
              {isEs ? "Lugar de encuentro" : "Meeting location"}
            </p>
            {locationString && (
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{locationString}</p>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-4 text-sm font-medium text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold)] hover:bg-[color:var(--lx-nav-hover)]"
              >
                {isEs ? "Cómo llegar" : "Get directions"}
              </a>
            )}
          </div>
        )}

        {/* Safe buying/contact card */}
        <div className="mt-6 rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFDF7] px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] text-lg sm:h-10 sm:w-10 sm:text-xl">
              🛡️
            </div>
            <div>
              <p className="text-sm font-bold text-[color:var(--lx-text)]">
                {isEs ? "Compra y contacto seguros" : "Safe buying and contact"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">
                {isEs
                  ? "Conecta directamente con el vendedor de forma segura y confidencial."
                  : "Connect directly with the seller safely and privately."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
