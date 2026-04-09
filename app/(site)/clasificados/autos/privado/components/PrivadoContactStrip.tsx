"use client";

import { FiMail, FiPhone } from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { resolveDealerOfficePhone } from "@/app/clasificados/autos/negocios/lib/dealerContactResolve";
import { formatUsPhoneDisplay, phoneDigitsForTel } from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { buildPrivadoSellerMailtoHref, buildPrivadoWhatsappInterestHref } from "../lib/privadoContactIntent";

const BTN_PRIMARY =
  "touch-manipulation inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99]";

const BTN_SECONDARY =
  "touch-manipulation inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 text-center text-[13px] font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] active:scale-[0.99] sm:px-3.5 sm:text-sm";

/** Private seller contact only — no website, booking, hours, or socials. */
export function PrivadoContactStrip({
  data,
  lang,
  labels,
}: {
  data: AutoDealerListing;
  lang: AutosNegociosLang;
  labels: { call: string; whatsapp: string; messageSite: string; emailSeller: string; seller: string };
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

  const seller = data.dealerName?.trim();
  const hasAnyCta = showCall || showWa || showEmail;
  if (!seller && !hasAnyCta) return null;

  return (
    <section className="min-w-0 overflow-x-hidden rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{labels.seller}</p>
      {seller ? (
        <h2 className="mt-2 break-words text-lg font-extrabold leading-snug text-[color:var(--lx-text)]">{seller}</h2>
      ) : null}
      <div className={`flex flex-col gap-2.5 sm:gap-3 ${seller ? "mt-4" : "mt-3"}`}>
        {showCall && phoneForTel ? (
          <a href={`tel:${phoneForTel}`} className={`${BTN_PRIMARY} flex-col gap-0.5 py-3`}>
            <span className="inline-flex items-center gap-2">
              <FiPhone className="h-5 w-5 shrink-0" aria-hidden />
              {labels.call}
            </span>
            {phoneDisplay || office ? (
              <span className="max-w-full truncate text-center text-xs font-semibold tabular-nums opacity-90">
                {phoneDisplay || office}
              </span>
            ) : null}
          </a>
        ) : null}
        {showWa && waHref ? (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${BTN_SECONDARY} gap-2`}>
            <SiWhatsapp className="h-5 w-5 shrink-0 text-[#25D366]" aria-hidden />
            {labels.whatsapp}
          </a>
        ) : null}
        {showEmail && mailtoHref ? (
          <a href={mailtoHref} className={`${BTN_SECONDARY} gap-2`}>
            <FiMail className="h-5 w-5 shrink-0" aria-hidden />
            {labels.emailSeller}
          </a>
        ) : null}
      </div>
    </section>
  );
}
