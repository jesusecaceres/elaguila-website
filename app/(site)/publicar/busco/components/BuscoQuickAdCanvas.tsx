"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { FiExternalLink, FiMapPin } from "react-icons/fi";

import ContactActions from "@/app/(site)/clasificados/components/ContactActions";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LeonixTrustFooter } from "@/app/(site)/clasificados/components/leonixShell/LeonixTrustFooter";
import { LEONIX_SHELL } from "@/app/(site)/clasificados/components/leonixShell/leonixShellTheme";
import {
  CommunityPremiumCanvasCard,
  CommunityPremiumTextCard,
} from "@/app/(site)/publicar/community/shared/preview/communityQuickPremiumShell";
import type { CommunityGlobalAnalyticsCtx } from "@/app/lib/clasificados/comunidad/comunidadClasesBuscoGlobalAnalytics";

import type { BuscoQuickAdViewModel } from "../shared/buscoQuickAdViewModel";

const COPY = {
  es: {
    categoryLabel: "Busco / Se busca",
    contactTitle: "Contactar anunciante",
    locationTitle: "Ubicación",
    socialsTitle: "También puedes contactar por",
    map: "Ver en el mapa",
    urgencyPronto: "Pronto",
    urgencyUrgente: "Urgente",
    otherLink: "Otro enlace",
    description: "Descripción",
    placeholderHint: "Solicitud en Leonix Clasificados",
  },
  en: {
    categoryLabel: "Wanted / Looking for",
    contactTitle: "Contact advertiser",
    locationTitle: "Location",
    socialsTitle: "You can also connect through",
    map: "View on map",
    urgencyPronto: "Soon",
    urgencyUrgente: "Urgent",
    otherLink: "Other link",
    description: "Description",
    placeholderHint: "Request on Leonix Classifieds",
  },
} as const;

type LayoutMode = "flyer" | "photo";

function detectLayoutMode(w: number, h: number): LayoutMode {
  if (!w || !h) return "photo";
  const ratio = w / h;
  if (ratio < 0.85 || h > w * 1.15) return "flyer";
  return "photo";
}

function BuscoHero({ vm, lang }: { vm: BuscoQuickAdViewModel; lang: Lang }) {
  const t = COPY[lang];
  const [layout, setLayout] = useState<LayoutMode>("photo");

  useEffect(() => {
    if (!vm.heroSrc) return;
    const img = new window.Image();
    img.onload = () => setLayout(detectLayoutMode(img.naturalWidth, img.naturalHeight));
    img.src = vm.heroSrc;
  }, [vm.heroSrc]);

  if (!vm.heroSrc) {
    return (
      <div
        className="relative flex min-h-[min(40vh,320px)] w-full flex-col items-center justify-center gap-3 rounded-t-2xl border-b border-[#C9B46A]/25 bg-gradient-to-br from-[#FBF7EF] via-[#F4EBD8] to-[#E8DFD0] px-6 py-10 text-center"
        data-testid="busco-hero-placeholder"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6B1F]">Leonix</p>
        <p className="text-xl font-extrabold text-[#2A2826] sm:text-2xl">{t.categoryLabel}</p>
        {vm.typeLabel ? <span className={LEONIX_SHELL.chip}>{vm.typeLabel}</span> : null}
        <p className="max-w-sm text-sm text-[#6B5E4E]">{t.placeholderHint}</p>
      </div>
    );
  }

  if (layout === "flyer") {
    return (
      <div className="relative w-full overflow-hidden rounded-t-2xl border-b border-[#C9B46A]/25 bg-[#F4F0E6] px-2 py-4 sm:px-4 sm:py-6">
        <div className="relative mx-auto flex min-h-[min(50vh,520px)] max-w-[min(100%,960px)] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vm.heroSrc} alt="" className="max-h-[min(70vh,640px)] w-full object-contain object-center" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] max-h-[380px] w-full overflow-hidden rounded-t-2xl border-b border-[#C9B46A]/25 bg-[#EDE8E0]">
      <Image src={vm.heroSrc} alt="" fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 960px" unoptimized />
    </div>
  );
}

export function BuscoQuickAdCanvas({
  vm,
  lang,
  shell = "standalone",
  contactSectionId,
}: {
  vm: BuscoQuickAdViewModel;
  lang: Lang;
  shell?: "standalone" | "embedded";
  contactSectionId?: string;
  analyticsCtx?: CommunityGlobalAnalyticsCtx;
}) {
  const t = COPY[lang];
  const chips = [vm.typeLabel, vm.budgetDisplay ? `${vm.budgetLabel}: ${vm.budgetDisplay}` : "", vm.locationSummary].filter(Boolean);

  const hasContact = Boolean(vm.phoneDigits || vm.whatsappDigits || vm.smsDigits || vm.email);
  const hasSocials = Boolean(vm.facebookHref || vm.instagramHref || vm.tiktokHref || vm.otherLinkHref);
  const mapsUrl = vm.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vm.mapQuery)}`
    : null;

  const smsBody =
    lang === "es"
      ? "Vi tu solicitud en Leonix Media y quisiera ayudarte."
      : "I saw your request on Leonix Media and would like to help.";
  const mailtoSubject =
    lang === "es" ? "Sobre tu solicitud en Leonix Media" : "About your request on Leonix Media";

  const articleClass =
    shell === "standalone"
      ? "mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#C9B46A]/45 bg-[#FCF9F2] text-[#2A2826] shadow-md"
      : "mx-auto w-full max-w-4xl min-w-0 overflow-hidden rounded-xl text-[#2A2826]";

  return (
    <article className={articleClass} data-testid="busco-quick-ad-canvas">
      <div className="relative">
        <BuscoHero vm={vm} lang={lang} />
        {vm.urgency === "urgente" || vm.urgency === "pronto" ? (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${
              vm.urgency === "urgente" ? "bg-red-600 text-white" : "bg-amber-500 text-white"
            }`}
          >
            {vm.urgency === "urgente" ? t.urgencyUrgente : t.urgencyPronto}
          </span>
        ) : null}
      </div>

      <div className="space-y-4 p-5 sm:p-7">
        <header className="text-center" data-testid="busco-premium-identity">
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#2A2826] sm:text-3xl lg:text-[2rem]">
            {vm.title || "—"}
          </h1>
          {chips.length ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {chips.map((chip) => (
                <span key={chip} className={LEONIX_SHELL.chip}>
                  {chip}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        {vm.budgetDisplay ? (
          <CommunityPremiumCanvasCard testId="busco-budget-card">
            <p className={LEONIX_SHELL.sectionLabel}>{vm.budgetLabel}</p>
            <p className="mt-2 text-2xl font-bold text-[#7A1E2C]">{vm.budgetDisplay}</p>
          </CommunityPremiumCanvasCard>
        ) : null}

        <CommunityPremiumTextCard title={t.description} body={vm.description} testId="busco-description" />

        {hasContact ? (
          <section
            id={contactSectionId}
            className="min-w-0 overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-[#FCF9F2] shadow-md"
            data-testid="busco-contact-card"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#7B2D42] to-[#C9A84C]" aria-hidden />
            <div className="space-y-4 p-4 sm:p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#7B2D42]">{t.contactTitle}</h2>
              <ContactActions
                lang={lang}
                phone={vm.phoneDigits || null}
                text={vm.smsDigits || null}
                whatsappPhone={vm.whatsappDigits || null}
                email={vm.email || null}
                smsBody={smsBody}
                mailtoSubject={mailtoSubject}
                listingId={vm.listingId}
                listingCategory="busco"
                className="flex flex-wrap gap-2"
              />
            </div>
          </section>
        ) : null}

        {hasSocials ? (
          <CommunityPremiumCanvasCard testId="busco-socials-section">
            <p className={LEONIX_SHELL.sectionLabel}>{t.socialsTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {vm.facebookHref ? (
                <a href={vm.facebookHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FaFacebook className="h-4 w-4 text-[#7B2D42]" aria-hidden /> Facebook
                </a>
              ) : null}
              {vm.instagramHref ? (
                <a href={vm.instagramHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FaInstagram className="h-4 w-4 text-[#7B2D42]" aria-hidden /> Instagram
                </a>
              ) : null}
              {vm.tiktokHref ? (
                <a href={vm.tiktokHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FaTiktok className="h-4 w-4 text-[#3D3428]" aria-hidden /> TikTok
                </a>
              ) : null}
              {vm.otherLinkHref ? (
                <a href={vm.otherLinkHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FiExternalLink className="h-4 w-4 text-[#7B2D42]" aria-hidden />
                  {vm.otherLinkLabel || t.otherLink}
                </a>
              ) : null}
            </div>
          </CommunityPremiumCanvasCard>
        ) : null}

        {vm.locationDetail ? (
          <CommunityPremiumCanvasCard testId="busco-location-section">
            <p className={LEONIX_SHELL.sectionLabel}>{t.locationTitle}</p>
            <p className="mt-2 break-words text-sm leading-relaxed text-[#3D3428]">{vm.locationDetail}</p>
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:opacity-95"
              >
                <FiMapPin className="h-4 w-4" aria-hidden />
                {t.map}
              </a>
            ) : null}
          </CommunityPremiumCanvasCard>
        ) : null}

        <LeonixTrustFooter lang={lang} leonixAdId={vm.leonixAdId} />
      </div>
    </article>
  );
}
