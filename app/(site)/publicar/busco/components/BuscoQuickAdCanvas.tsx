"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaYoutube } from "react-icons/fa";
import { FiExternalLink, FiMail, FiMapPin, FiMessageSquare, FiPhone, FiShare2 } from "react-icons/fi";

import {
  buildMailtoHref,
  buildSmsHref,
  buildTelHref,
  buildWhatsAppUrl,
} from "@/app/lib/digitalContact/humanConnection/nativeChannelHrefs";
import { tryWebShare, copyToClipboard } from "@/app/components/cta/ctaLaunchers";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { LeonixTrustFooter } from "@/app/(site)/clasificados/components/leonixShell/LeonixTrustFooter";
import { LEONIX_SHELL } from "@/app/(site)/clasificados/components/leonixShell/leonixShellTheme";
import {
  CommunityPremiumCanvasCard,
  CommunityPremiumInfoGrid,
  CommunityPremiumTextCard,
  type CommunityPremiumInfoItem,
} from "@/app/(site)/publicar/community/shared/preview/communityQuickPremiumShell";

import type { BuscoQuickAdViewModel } from "../shared/buscoQuickAdViewModel";
import { labelBuscoUrgency } from "../shared/buscoTaxonomy";

const COPY = {
  es: {
    categoryLabel: "Busco / Se busca",
    contactTitle: "Contactar anunciante",
    locationTitle: "Ubicación aproximada",
    socialsTitle: "También puedes contactar por",
    detailsTitle: "Detalles",
    map: "Ver en el mapa",
    otherLink: "Otro enlace",
    description: "Descripción",
    workType: "Tipo de trabajo",
    workSkills: "Habilidades / experiencia",
    workAvailability: "Disponibilidad",
    transportOrigin: "Origen",
    transportDestination: "Destino",
    volunteersCount: "Voluntarios necesarios (aprox.)",
    whenNeeded: "¿Cuándo?",
    preferredCondition: "Condición preferida",
    share: "Compartir",
    shareCopied: "Enlace copiado",
    placeholderHint: "Solicitud en Leonix Clasificados",
  },
  en: {
    categoryLabel: "Wanted / Looking for",
    contactTitle: "Contact advertiser",
    locationTitle: "Approximate location",
    socialsTitle: "You can also connect through",
    detailsTitle: "Details",
    map: "View on map",
    otherLink: "Other link",
    description: "Description",
    workType: "Type of work",
    workSkills: "Skills / experience",
    workAvailability: "Availability",
    transportOrigin: "Origin",
    transportDestination: "Destination",
    volunteersCount: "Volunteers needed (approx.)",
    whenNeeded: "When?",
    preferredCondition: "Preferred condition",
    share: "Share",
    shareCopied: "Link copied",
    placeholderHint: "Request on Leonix Classifieds",
  },
} as const;

const URGENCY_BADGE: Record<string, string> = {
  esta_semana: "border-[#8A6B1F]/45 bg-[#FBF3DA]/95 text-[#6B5310]",
  lo_antes_posible: "border-amber-700/40 bg-amber-100/95 text-amber-900",
  urgente_hoy: "border-red-800/40 bg-red-100/95 text-red-800",
};

type LayoutMode = "flyer" | "photo";

function detectLayoutMode(w: number, h: number): LayoutMode {
  if (!w || !h) return "photo";
  const ratio = w / h;
  if (ratio < 0.85 || h > w * 1.15) return "flyer";
  return "photo";
}

function BuscoHero({ vm, lang, urgencyLabel }: { vm: BuscoQuickAdViewModel; lang: Lang; urgencyLabel: string | null }) {
  const t = COPY[lang];
  const [layout, setLayout] = useState<LayoutMode>("photo");

  useEffect(() => {
    if (!vm.heroSrc) return;
    const img = new window.Image();
    img.onload = () => setLayout(detectLayoutMode(img.naturalWidth, img.naturalHeight));
    img.src = vm.heroSrc;
  }, [vm.heroSrc]);

  const badgeClass = vm.urgency !== "normal" ? URGENCY_BADGE[vm.urgency] : null;

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
        {urgencyLabel && badgeClass ? (
          <span className={`rounded-full border-2 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide ${badgeClass}`}>
            {urgencyLabel}
          </span>
        ) : null}
      </div>
    );
  }

  const badge =
    urgencyLabel && badgeClass ? (
      <span
        className={`absolute left-3 top-3 rounded-full border-2 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.22)] backdrop-blur-sm ${badgeClass}`}
      >
        {urgencyLabel}
      </span>
    ) : null;

  if (layout === "flyer") {
    return (
      <div className="relative w-full overflow-hidden rounded-t-2xl border-b border-[#C9B46A]/25 bg-[#F4F0E6] px-2 py-4 sm:px-4 sm:py-6">
        {badge}
        <div className="relative mx-auto flex min-h-[min(50vh,520px)] max-w-[min(100%,960px)] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vm.heroSrc} alt="" className="max-h-[min(70vh,640px)] w-full object-contain object-center" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/10] max-h-[380px] w-full overflow-hidden rounded-t-2xl border-b border-[#C9B46A]/25 bg-[#EDE8E0]">
      {badge}
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
}) {
  const t = COPY[lang];
  const [shareHint, setShareHint] = useState<string | null>(null);
  const urgencyLabel = vm.urgency !== "normal" ? labelBuscoUrgency(vm.urgency, lang) : null;
  const chips = [vm.typeLabel, vm.locationSummary].filter(Boolean);

  const telHref = buildTelHref(vm.phoneDigits);
  const smsHref = buildSmsHref(
    vm.smsDigits,
    lang === "es" ? "Vi tu solicitud en Leonix Media y quisiera ayudarte." : "I saw your request on Leonix Media and would like to help.",
  );
  const waHref = vm.whatsappDigits
    ? buildWhatsAppUrl(
        vm.whatsappDigits,
        lang === "es" ? "Vi tu solicitud en Leonix Media y quisiera ayudarte." : "I saw your request on Leonix Media and would like to help.",
      )
    : null;
  const mailHref = vm.email
    ? buildMailtoHref(vm.email, lang === "es" ? "Sobre tu solicitud en Leonix Media" : "About your request on Leonix Media")
    : null;
  const hasContactActions = Boolean(telHref || waHref || smsHref || mailHref);
  const hasSocials = Boolean(vm.facebookHref || vm.instagramHref || vm.tiktokHref || vm.youtubeHref || vm.otherLinkHref);

  const mapsEmbedUrl = vm.mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(vm.mapQuery)}&output=embed` : null;
  const mapsDirectionsUrl = vm.mapQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(vm.mapQuery)}`
    : null;

  const isTrabajo = vm.typeSlug === "trabajo";
  const isTransporte = vm.typeSlug === "transporte";
  const isVoluntarios = vm.typeSlug === "voluntarios";
  const isArticulo = vm.typeSlug === "articulo";
  const d = vm.typeDetails;

  const detailItems: CommunityPremiumInfoItem[] = [
    ...(isArticulo ? [{ key: "cond", label: t.preferredCondition, value: d.preferredCondition }] : []),
    ...(isTrabajo
      ? [
          { key: "workType", label: t.workType, value: d.workType },
          { key: "workSkills", label: t.workSkills, value: d.workSkills },
          { key: "workAvailability", label: t.workAvailability, value: d.workAvailability },
        ]
      : []),
    ...(isTransporte
      ? [
          { key: "origin", label: t.transportOrigin, value: d.transportOrigin },
          { key: "destination", label: t.transportDestination, value: d.transportDestination },
        ]
      : []),
    ...(isVoluntarios ? [{ key: "volCount", label: t.volunteersCount, value: d.volunteersCount }] : []),
    { key: "when", label: t.whenNeeded, value: d.whenNeeded },
  ];

  const shareTitle = vm.title || t.categoryLabel;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const onShare = async () => {
    const res = await tryWebShare({ title: shareTitle, url: shareUrl });
    if (res === "unsupported") {
      const ok = await copyToClipboard(shareUrl);
      setShareHint(ok ? t.shareCopied : null);
      window.setTimeout(() => setShareHint(null), 2500);
    }
  };

  const articleClass =
    shell === "standalone"
      ? "mx-auto my-6 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#C9B46A]/45 bg-[#FCF9F2] text-[#2A2826] shadow-md"
      : "mx-auto w-full max-w-4xl min-w-0 overflow-hidden rounded-xl text-[#2A2826]";

  return (
    <article className={articleClass} data-testid="busco-quick-ad-canvas">
      <BuscoHero vm={vm} lang={lang} urgencyLabel={urgencyLabel} />

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

        {/* Section F — budget's ONE canvas placement (the 2nd placement is the result card). */}
        {vm.budgetDisplay ? (
          <CommunityPremiumCanvasCard testId="busco-budget-card">
            <p className={LEONIX_SHELL.sectionLabel}>{vm.budgetLabel}</p>
            <p className="mt-2 text-2xl font-bold text-[#7A1E2C]">{vm.budgetDisplay}</p>
          </CommunityPremiumCanvasCard>
        ) : null}

        <CommunityPremiumTextCard title={t.description} body={vm.description} testId="busco-description" />

        {/* Section C/X — type-specific details (e.g. Busco Trabajo work info), hidden when empty. */}
        <div>
          <CommunityPremiumInfoGrid items={detailItems} />
        </div>

        {hasContactActions ? (
          <section
            id={contactSectionId}
            className="min-w-0 overflow-hidden rounded-2xl border border-[#C9B46A]/40 bg-[#FCF9F2] shadow-md"
            data-testid="busco-contact-card"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[#7B2D42] to-[#C9A84C]" aria-hidden />
            <div className="space-y-4 p-4 sm:p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-[#7B2D42]">{t.contactTitle}</h2>
              <div className="flex flex-wrap gap-2">
                {telHref ? (
                  <a href={telHref} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#7A1E2C] px-3.5 py-2 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:opacity-95">
                    <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                    {lang === "es" ? "Llamar" : "Call"}
                  </a>
                ) : null}
                {waHref ? (
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:opacity-95">
                    <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                    WhatsApp
                  </a>
                ) : null}
                {smsHref ? (
                  <a href={smsHref} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#7A1E2C] bg-white px-3.5 py-2 text-sm font-bold text-[#2A2826] shadow-sm transition hover:opacity-95">
                    <FiMessageSquare className="h-4 w-4 shrink-0" aria-hidden />
                    {lang === "es" ? "Mensaje de texto" : "Text"}
                  </a>
                ) : null}
                {mailHref ? (
                  <a href={mailHref} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#C9B46A] bg-white px-3.5 py-2 text-sm font-bold text-[#2A2826] shadow-sm transition hover:opacity-95">
                    <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                    {lang === "es" ? "Correo" : "Email"}
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {hasSocials ? (
          <CommunityPremiumCanvasCard testId="busco-socials-section">
            <p className={LEONIX_SHELL.sectionLabel}>{t.socialsTitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {vm.facebookHref ? (
                <a href={vm.facebookHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FaFacebook className="h-4 w-4 text-[#1877F2]" aria-hidden /> Facebook
                </a>
              ) : null}
              {vm.instagramHref ? (
                <a href={vm.instagramHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FaInstagram className="h-4 w-4 text-[#E4405F]" aria-hidden /> Instagram
                </a>
              ) : null}
              {vm.tiktokHref ? (
                <a href={vm.tiktokHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FaTiktok className="h-4 w-4 text-[#000000]" aria-hidden /> TikTok
                </a>
              ) : null}
              {vm.youtubeHref ? (
                <a href={vm.youtubeHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9A84A]/45 bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#3D3428]">
                  <FaYoutube className="h-4 w-4 text-[#FF0000]" aria-hidden /> YouTube
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

        {/* Section O — native Share, both preview and published render this same canvas. */}
        <div>
          <button
            type="button"
            onClick={() => void onShare()}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#C9B46A] bg-[#FCF9F2] px-3.5 py-2 text-sm font-bold text-[#2A2826] shadow-sm transition hover:opacity-95"
          >
            <FiShare2 className="h-4 w-4 shrink-0" aria-hidden />
            {t.share}
          </button>
          {shareHint ? <span className="ml-2 text-xs font-medium text-[#5C564E]">{shareHint}</span> : null}
        </div>

        {/* Section I — real Google Maps embed from approximate location, no invented coordinates. */}
        {mapsEmbedUrl ? (
          <CommunityPremiumCanvasCard testId="busco-location-section">
            <p className={LEONIX_SHELL.sectionLabel}>{t.locationTitle}</p>
            <p className="mt-2 break-words text-sm leading-relaxed text-[#3D3428]">{vm.locationDetail}</p>
            <div className="mt-3 space-y-2">
              <div className="overflow-hidden rounded-lg" style={{ height: "180px" }}>
                <iframe
                  src={mapsEmbedUrl}
                  title={lang === "es" ? "Mapa del área aproximada" : "Approximate area map"}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {mapsDirectionsUrl ? (
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#7A1E2C]/15 bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:opacity-95"
                >
                  <FiMapPin className="h-4 w-4" aria-hidden />
                  {t.map}
                </a>
              ) : null}
            </div>
          </CommunityPremiumCanvasCard>
        ) : null}

        <LeonixTrustFooter lang={lang} leonixAdId={vm.leonixAdId} />
      </div>
    </article>
  );
}
