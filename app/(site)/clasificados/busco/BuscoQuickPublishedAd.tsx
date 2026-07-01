"use client";

import { useMemo } from "react";

import ContactActions from "@/app/(site)/clasificados/components/ContactActions";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { formatLeonixAdId } from "@/app/(site)/clasificados/community/shared/communityLeonixAdId";
import { normalizeWebsiteForOpen } from "@/app/publicar/community/shared/lib/communityWebsiteAndSocial";

import { detailPairsToMap } from "./shared/buscoListingDetailPairs";
import { resolveBuscoTypePublicLabel } from "./shared/buscoPublicLabel";
import { formatBuscoBudget } from "@/app/publicar/busco/shared/buscoFormatBudget";

const LISTING_IMAGE_FALLBACK = "/logo.png";

const COPY = {
  es: {
    leonixAdId: "Leonix Ad ID",
    budget: "Presupuesto",
    contactTitle: "Contactar anunciante",
    locationTitle: "Ubicación aproximada",
    socialsTitle: "También puedes contactar por",
    shareTitle: "Compartir anuncio",
    trustCue: "Publicado en Leonix",
    urgencyPronto: "Pronto",
    urgencyUrgente: "Urgente",
    otherLink: "Otro enlace",
    copyEmail: "Copiar correo",
    emailCopied: "¡Correo copiado!",
  },
  en: {
    leonixAdId: "Leonix Ad ID",
    budget: "Budget",
    contactTitle: "Contact advertiser",
    locationTitle: "Approximate location",
    socialsTitle: "You can also connect through",
    shareTitle: "Share listing",
    trustCue: "Published on Leonix",
    urgencyPronto: "Soon",
    urgencyUrgente: "Urgent",
    otherLink: "Other link",
    copyEmail: "Copy email",
    emailCopied: "Email copied!",
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

  // Location
  const zone = (pairs["Leonix:buscoZone"] ?? "").trim();
  const state = (pairs["Leonix:state"] ?? "").trim();
  const country = (pairs["Leonix:buscoCountry"] ?? "").trim();
  const zip = (pairs["Leonix:zip"] ?? "").trim();
  const cityRaw = listing.city.trim();
  const cityStateLine = [cityRaw, state && zip ? `${state} ${zip}` : state || zip].filter(Boolean).join(", ");
  const fullLocationLine = [cityStateLine, country, zone].filter(Boolean).join(" · ");

  // Budget + urgency
  const budgetRaw = (pairs["Leonix:buscoBudget"] ?? "").trim();
  const budget = budgetRaw ? formatBuscoBudget(budgetRaw) : "";
  const urgency = (pairs["Leonix:buscoUrgency"] ?? "").trim();

  const title = listing.title[lang] || listing.title.es;
  const description = listing.blurb[lang] || listing.blurb.es;

  // Phone / WhatsApp / SMS
  const phoneFromPairs = (pairs["Leonix:phoneDigits"] ?? "").replace(/\D/g, "");
  const rowPhone = String(listing.contact_phone ?? "").replace(/\D/g, "");
  const phoneDigits = (phoneFromPairs.length >= 10 ? phoneFromPairs : rowPhone).slice(0, 15);
  const hasPhone = phoneDigits.length >= 10;
  const waDig = (pairs["Leonix:whatsappDigits"] ?? "").replace(/\D/g, "");
  const hasWhatsApp = waDig.length >= 10;
  const smsDig = (pairs["Leonix:smsPhone"] ?? "").replace(/\D/g, "");
  const smsDigits = smsDig.length >= 10 ? smsDig : phoneDigits;
  const hasSms = smsDigits.length >= 10;
  const email = String(listing.contact_email ?? "").trim();
  const leonixId = formatLeonixAdId(listing.id);

  // Socials
  const fbRaw = (pairs["Leonix:buscoFacebook"] ?? "").trim();
  const fbHref = fbRaw ? (normalizeWebsiteForOpen(fbRaw) ?? null) : null;
  const igRaw = (pairs["Leonix:buscoInstagram"] ?? "").trim();
  const igHref = igRaw ? (normalizeWebsiteForOpen(igRaw) ?? null) : null;
  const ttRaw = (pairs["Leonix:buscoTiktok"] ?? "").trim();
  const ttHref = ttRaw ? (normalizeWebsiteForOpen(ttRaw) ?? null) : null;
  const ocUrl = (pairs["Leonix:buscoOtherContactUrl"] ?? "").trim();
  const ocHref = ocUrl ? (normalizeWebsiteForOpen(ocUrl) ?? null) : null;
  const ocLabel = (pairs["Leonix:buscoOtherContactLabel"] ?? "").trim() || t.otherLink;
  const hasSocials = !!(fbHref || igHref || ttHref || ocHref);

  const heroSrc = listing.images?.[0]?.trim() || LISTING_IMAGE_FALLBACK;
  const heroIsFallback = !listing.images?.[0]?.trim();

  const smsBody =
    lang === "es"
      ? "Vi tu solicitud en Leonix Media y quisiera ayudarte."
      : "I saw your request on Leonix Media and would like to help.";
  const mailtoSubject =
    lang === "es" ? "Sobre tu solicitud en Leonix Media" : "About your request on Leonix Media";

  const hasAnyContact = hasPhone || hasWhatsApp || hasSms || !!email;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-[#FCF9F2] shadow-md"
      data-testid="busco-published-ad"
    >
      {/* Hero image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EDE8DF]">
        {heroIsFallback ? (
          <img src={heroSrc} alt="" className="h-full w-full object-contain object-center p-8 opacity-90" />
        ) : (
          <img src={heroSrc} alt="" className="h-full w-full object-cover" />
        )}
        {/* Urgency chip overlay */}
        {urgency === "urgente" || urgency === "pronto" ? (
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
            urgency === "urgente"
              ? "bg-red-600 text-white"
              : "bg-amber-500 text-white"
          }`}>
            {urgency === "urgente" ? t.urgencyUrgente : t.urgencyPronto}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-4 sm:p-6">
        {/* Type badge */}
        <span className="inline-flex max-w-full rounded-full bg-[#F0EBE0] px-2.5 py-0.5 text-[11px] font-semibold text-[#5C3D2E]">
          {typeLabel}
        </span>

        <h1 className="text-2xl font-bold leading-snug text-[#1E1810] sm:text-3xl">{title}</h1>

        {/* Budget */}
        {budget ? (
          <p className="text-sm text-[#2a241c]/85">
            <span className="font-semibold">{t.budget}:</span> {budget}
          </p>
        ) : null}

        {/* Description */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2a241c]/90">{description}</p>

        <p className="font-mono text-xs text-[#8B7355]" data-testid="busco-published-leonix-ad-id">
          {t.leonixAdId}: {leonixId}
        </p>

        {/* ── Contact card ───────────────────────────────────── */}
        {hasAnyContact ? (
          <section
            className="rounded-xl border border-[#C9B46A]/35 bg-[#FFFDF5] p-4"
            id="busco-contact-actions"
            data-testid="busco-contact-card"
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#7B2D42]">{t.contactTitle}</p>
            <ContactActions
              lang={lang}
              phone={hasPhone ? phoneDigits : null}
              text={hasSms ? smsDigits : null}
              whatsappPhone={hasWhatsApp ? waDig : (hasPhone ? phoneDigits : null)}
              email={email || null}
              smsBody={smsBody}
              mailtoSubject={mailtoSubject}
              listingId={listing.id}
              listingCategory="busco"
              className="flex flex-wrap gap-2"
            />
          </section>
        ) : null}

        {/* ── Optional socials ───────────────────────────────── */}
        {hasSocials ? (
          <section className="rounded-xl border border-[#C9B46A]/25 bg-[#FCF9F2] p-3" data-testid="busco-socials-section">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-[#7B2D42]">{t.socialsTitle}</p>
            <div className="flex flex-wrap gap-2">
              {fbHref ? (
                <a
                  href={fbHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm transition hover:bg-[#FCF9F2]"
                >
                  Facebook
                </a>
              ) : null}
              {igHref ? (
                <a
                  href={igHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm transition hover:bg-[#FCF9F2]"
                >
                  Instagram
                </a>
              ) : null}
              {ttHref ? (
                <a
                  href={ttHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm transition hover:bg-[#FCF9F2]"
                >
                  TikTok
                </a>
              ) : null}
              {ocHref ? (
                <a
                  href={ocHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-[#C9B46A]/35 bg-white px-3 py-2 text-xs font-semibold text-[#2A2826] shadow-sm transition hover:bg-[#FCF9F2]"
                >
                  {ocLabel}
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── Approximate location ───────────────────────────── */}
        {fullLocationLine ? (
          <section className="rounded-xl border border-[#C9B46A]/25 bg-[#FFFDF5] px-3 py-3" data-testid="busco-location-section">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#7B2D42]">{t.locationTitle}</p>
            <p className="break-words text-sm text-[#2a241c]/85">{fullLocationLine}</p>
          </section>
        ) : null}

        {/* ── Trust cue ──────────────────────────────────────── */}
        <p className="text-center text-[10px] text-[#8B7355]/80">{t.trustCue}</p>
      </div>
    </article>
  );
}
