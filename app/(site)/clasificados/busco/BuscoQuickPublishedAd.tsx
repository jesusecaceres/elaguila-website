"use client";

import { useMemo } from "react";

import ContactActions from "@/app/(site)/clasificados/components/ContactActions";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";

import { detailPairsToMap } from "./shared/buscoListingDetailPairs";
import { resolveBuscoTypePublicLabel } from "./shared/buscoPublicLabel";

const LISTING_IMAGE_FALLBACK = "/logo.png";

const COPY = {
  es: {
    leonixAdId: "Leonix Ad ID",
    budget: "Presupuesto",
    contact: "Contacto",
  },
  en: {
    leonixAdId: "Leonix Ad ID",
    budget: "Budget",
    contact: "Contact",
  },
} as const;

export type BuscoPublishedListingLike = {
  id: string;
  title: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
};

export function BuscoQuickPublishedAd({ listing, lang }: { listing: BuscoPublishedListingLike; lang: Lang }) {
  const t = COPY[lang];
  const pairs = useMemo(() => detailPairsToMap(listing.detailPairs), [listing.detailPairs]);

  const typeLabel = resolveBuscoTypePublicLabel(
    pairs["Leonix:buscoType"] ?? "",
    pairs["Leonix:buscoTypeCustom"] ?? "",
    lang,
  );
  const zone = pairs["Leonix:buscoZone"]?.trim() ?? "";
  const cityLine = [listing.city.trim(), zone].filter(Boolean).join(" · ");
  const budget = pairs["Leonix:buscoBudget"]?.trim() ?? "";
  const title = listing.title[lang] || listing.title.es;
  const description = listing.blurb[lang] || listing.blurb.es;

  const phoneFromPairs = (pairs["Leonix:phoneDigits"] ?? "").replace(/\D/g, "");
  const rowPhone = String(listing.contact_phone ?? "").replace(/\D/g, "");
  const phoneDigits = (phoneFromPairs.length >= 10 ? phoneFromPairs : rowPhone).slice(0, 15);
  const hasPhone = phoneDigits.length >= 10;
  const email = String(listing.contact_email ?? "").trim();
  const leonixId = formatLeonixAdId(listing.id);

  const heroSrc = listing.images?.[0]?.trim() || LISTING_IMAGE_FALLBACK;
  const heroIsFallback = !listing.images?.[0]?.trim();

  const smsBody =
    lang === "es"
      ? "Vi tu solicitud en Leonix Media y quisiera ayudarte."
      : "I saw your request on Leonix Media and would like to help.";
  const mailtoSubject =
    lang === "es" ? "Sobre tu solicitud en Leonix Media" : "About your request on Leonix Media";

  return (
    <article
      className="overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-[#FCF9F2]"
      data-testid="busco-published-ad"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EDE8DF]">
        {heroIsFallback ? (
          <img src={heroSrc} alt="" className="h-full w-full object-contain object-center p-8 opacity-90" />
        ) : (
          <img src={heroSrc} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="space-y-3 p-4 sm:p-6">
        <span className="inline-flex max-w-full rounded-full bg-[#D7E3F7] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E3A5F]">
          {typeLabel}
        </span>

        <h1 className="text-2xl font-bold leading-snug text-[#1E1810] sm:text-3xl">{title}</h1>

        {cityLine ? <p className="text-sm font-medium text-[#5C5346]">{cityLine}</p> : null}

        <p className="font-mono text-xs text-[#3d5a73]" data-testid="busco-published-leonix-ad-id">
          {t.leonixAdId}: {leonixId}
        </p>

        {budget ? (
          <p className="text-sm text-[#2a241c]/85">
            <span className="font-semibold">{t.budget}:</span> {budget}
          </p>
        ) : null}

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2a241c]/90">{description}</p>

        {(hasPhone || email) && (
          <section className="rounded-xl border border-[#B8C8EA]/30 bg-[#F8FAFF] p-3" id="busco-contact-actions">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#3d5a73]">{t.contact}</p>
            <ContactActions
              lang={lang}
              phone={hasPhone ? phoneDigits : null}
              text={hasPhone ? phoneDigits : null}
              whatsappPhone={hasPhone ? phoneDigits : null}
              email={email || null}
              smsBody={smsBody}
              mailtoSubject={mailtoSubject}
              listingId={listing.id}
              listingCategory="busco"
              className="flex flex-wrap gap-2"
            />
          </section>
        )}
      </div>
    </article>
  );
}
