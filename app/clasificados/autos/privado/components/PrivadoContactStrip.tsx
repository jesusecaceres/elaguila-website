"use client";

import { FiPhone } from "react-icons/fi";
import { SiWhatsapp } from "react-icons/si";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { resolveDealerOfficePhone } from "@/app/clasificados/autos/negocios/lib/dealerContactResolve";
import { whatsAppHrefFromDisplay } from "@/app/clasificados/autos/negocios/lib/dealerWhatsappHref";
import { formatUsPhoneDisplay, phoneDigitsForTel } from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";

const BTN_PRIMARY =
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[color:var(--lx-cta-dark)] px-4 text-sm font-bold tracking-tight text-[#FFFCF7] shadow-[0_8px_24px_-6px_rgba(26,22,18,0.45)] transition hover:bg-[color:var(--lx-cta-dark-hover)] active:scale-[0.99]";

const BTN_SECONDARY =
  "inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-2 text-center text-[13px] font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:bg-[color:var(--lx-nav-hover)] sm:px-3 sm:text-sm";

/** Private seller contact only — no website, booking, hours, or socials. */
export function PrivadoContactStrip({
  data,
  labels,
}: {
  data: AutoDealerListing;
  labels: { call: string; whatsapp: string; seller: string };
}) {
  const office = resolveDealerOfficePhone(data);
  const phoneDisplay = formatUsPhoneDisplay(office);
  const phoneForTel = phoneDigitsForTel(office);
  /** Same threshold as Negocios `DealerBusinessStack`: avoid dead `tel:` short fragments. */
  const validTelForCta = phoneForTel.length >= 10;
  const showCall = validTelForCta && Boolean(phoneForTel);
  const waHref = whatsAppHrefFromDisplay(data.dealerWhatsapp ?? undefined);
  const showWa = Boolean(waHref);
  const seller = data.dealerName?.trim();

  if (!showCall && !showWa && !seller) return null;

  return (
    <section className="min-w-0 overflow-x-hidden rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">{labels.seller}</p>
      {seller ? <h2 className="mt-2 text-lg font-extrabold text-[color:var(--lx-text)]">{seller}</h2> : null}
      <div className={`mt-4 flex flex-col gap-3 ${seller ? "" : "mt-0"}`}>
        {showWa && waHref ? (
          <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${BTN_PRIMARY} gap-2`}>
            <SiWhatsapp className="h-5 w-5 shrink-0" aria-hidden />
            {labels.whatsapp}
          </a>
        ) : null}
        {showCall && phoneForTel ? (
          <a href={`tel:${phoneForTel}`} className={BTN_SECONDARY}>
            <FiPhone className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {labels.call} · {phoneDisplay || office}
          </a>
        ) : null}
      </div>
    </section>
  );
}
