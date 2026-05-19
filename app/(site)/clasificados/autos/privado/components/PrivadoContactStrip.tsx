"use client";

import type { IconType } from "react-icons";
import { FiMail, FiMessageCircle, FiPhone } from "react-icons/fi";
import { SiFacebook, SiInstagram, SiTiktok, SiWhatsapp, SiYoutube } from "react-icons/si";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { resolveDealerOfficePhone } from "@/app/clasificados/autos/negocios/lib/dealerContactResolve";
import { formatUsPhoneDisplay, phoneDigitsForTel } from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { buildPrivadoSellerMailtoHref, buildPrivadoWhatsappInterestHref } from "../lib/privadoContactIntent";
import { safeExternalHref } from "@/app/clasificados/autos/negocios/lib/dealerDraftSanitize";
import { AutosSheetCtaLink } from "@/app/clasificados/autos/shared/components/AutosSheetCtaLink";

const BTN_PRIMARY =
  "touch-manipulation inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99]";

const BTN_SECONDARY =
  "touch-manipulation inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-center text-[13px] font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] sm:px-3.5 sm:text-sm";

/** Private seller contact — strong CTAs; optional seller-provided socials (https only). */
export function PrivadoContactStrip({
  data,
  lang,
  labels,
}: {
  data: AutoDealerListing;
  lang: AutosNegociosLang;
  labels: {
    call: string;
    whatsapp: string;
    messageSite: string;
    emailSeller: string;
    sms: string;
    sellerHeading: string;
    seller: string;
    socialDisclaimer: string;
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

  const seller = data.dealerName?.trim();
  const soc = data.dealerSocials ?? {};
  const socialRows: Array<{ key: string; href: string; label: string; Icon: IconType }> = [];
  const push = (key: "facebook" | "instagram" | "tiktok" | "youtube", label: string, Icon: IconType) => {
    const href = safeExternalHref(soc[key]);
    if (href) socialRows.push({ key, href, label, Icon });
  };
  push("facebook", "Facebook", SiFacebook);
  push("instagram", "Instagram", SiInstagram);
  push("tiktok", "TikTok", SiTiktok);
  push("youtube", "YouTube", SiYoutube);

  const hasAnyCta = showCall || showWa || showEmail || showSms;
  if (!seller && !hasAnyCta && socialRows.length === 0) return null;

  return (
    <section className="min-w-0 overflow-x-hidden rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{labels.seller}</p>
      <h2 className="mt-2 break-words text-xl font-extrabold leading-snug tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
        {labels.sellerHeading}
      </h2>
      {seller ? <p className="mt-2 break-words text-base font-semibold text-[color:var(--lx-text-2)]">{seller}</p> : null}
      <div className={`flex flex-col gap-2.5 sm:gap-3 ${seller ? "mt-5" : "mt-4"}`}>
        {showCall && phoneForTel ? (
          <AutosSheetCtaLink href={`tel:${phoneForTel}`} lang={lang} className={`${BTN_PRIMARY} flex-col gap-0.5 py-3`}>
            <span className="inline-flex items-center gap-2">
              <FiPhone className="h-5 w-5 shrink-0" aria-hidden />
              {labels.call}
            </span>
            {phoneDisplay || office ? (
              <span className="max-w-full truncate text-center text-xs font-semibold tabular-nums opacity-90">
                {phoneDisplay || office}
              </span>
            ) : null}
          </AutosSheetCtaLink>
        ) : null}
        {showWa && waHref ? (
          <AutosSheetCtaLink href={waHref} lang={lang} className={`${BTN_SECONDARY} gap-2`}>
            <SiWhatsapp className="h-5 w-5 shrink-0 text-[#25D366]" aria-hidden />
            {labels.whatsapp}
          </AutosSheetCtaLink>
        ) : null}
        {showEmail && mailtoHref ? (
          <AutosSheetCtaLink href={mailtoHref} lang={lang} className={`${BTN_SECONDARY} gap-2`}>
            <FiMail className="h-5 w-5 shrink-0" aria-hidden />
            {labels.emailSeller}
          </AutosSheetCtaLink>
        ) : null}
        {showSms && smsHref ? (
          <AutosSheetCtaLink href={smsHref} lang={lang} className={`${BTN_SECONDARY} gap-2`}>
            <FiMessageCircle className="h-5 w-5 shrink-0 text-[color:var(--lx-text)]" aria-hidden />
            {labels.sms}
          </AutosSheetCtaLink>
        ) : null}
      </div>
      {socialRows.length > 0 ? (
        <div className="mt-6 border-t border-[color:var(--lx-nav-border)]/80 pt-5">
          <p className="text-xs font-semibold text-[color:var(--lx-text)]">{labels.socialDisclaimer}</p>
          <ul className="mt-3 space-y-2">
            {socialRows.map(({ key, href, label, Icon }) => (
              <li key={String(key)}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 py-2 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold-border)]"
                >
                  <Icon className="h-5 w-5 shrink-0 text-[color:var(--lx-gold)]" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
