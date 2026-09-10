"use client";

import { useState } from "react";
import Image from "next/image";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { FiMail, FiMapPin, FiMessageSquare, FiPhone, FiShare2 } from "react-icons/fi";
import {
  buildMailtoHref,
  buildSmsHref,
  buildTelHref,
  buildWhatsAppUrl,
} from "@/app/lib/digitalContact/humanConnection/nativeChannelHrefs";
import { tryWebShare, copyToClipboard } from "@/app/components/cta/ctaLaunchers";
import {
  CommunityPremiumCanvasCard,
  CommunityPremiumInfoGrid,
  CommunityPremiumTextCard,
  CommunityPremiumTrustFooter,
  COMMUNITY_PREMIUM_SURFACE,
  type CommunityPremiumInfoItem,
} from "@/app/(site)/publicar/community/shared/preview/communityQuickPremiumShell";

import type { MascotasPerdidosQuickDraft } from "../shared/mascotasPerdidosQuickTypes";
import { isPetNoticeType } from "../shared/mascotasPerdidosQuickTypes";
import {
  labelMascotasSex,
  labelMascotasSize,
  labelMascotasTriState,
} from "../shared/mascotasPerdidosTaxonomy";

const COPY = {
  es: {
    petFacts: "Datos de la mascota",
    objectFacts: "Datos del objeto",
    breed: "Raza / mezcla",
    color: "Color",
    sex: "Sexo",
    age: "Edad aprox.",
    size: "Tamaño",
    collar: "Collar / arnés",
    microchip: "Microchip",
    lastSeen: "Última vez vista",
    found: "Encontrada",
    currentStatus: "Estado actual",
    identifyingMarks: "Señas particulares",
    safety: "Precauciones",
    claim: "Cómo reclamarla",
    temperament: "Temperamento",
    vaccinated: "Vacunas",
    spayedNeutered: "Esterilizado/a",
    specialNeeds: "Necesidades especiales",
    adoptionDetails: "Detalles de adopción",
    description: "Descripción",
    contactTitle: "Contacto",
    socialTitle: "Síguenos",
    locationTitle: "Área aproximada",
    call: "Llamar",
    text: "Enviar texto",
    email: "Correo",
    map: "Ver en el mapa",
    share: "Compartir",
    shareCopied: "Enlace copiado",
    yes: "Sí",
  },
  en: {
    petFacts: "Pet details",
    objectFacts: "Item details",
    breed: "Breed / mix",
    color: "Color",
    sex: "Sex",
    age: "Approx. age",
    size: "Size",
    collar: "Collar / harness",
    microchip: "Microchip",
    lastSeen: "Last seen",
    found: "Found",
    currentStatus: "Current status",
    identifyingMarks: "Identifying characteristics",
    safety: "Precautions",
    claim: "How to claim",
    temperament: "Temperament",
    vaccinated: "Vaccinated",
    spayedNeutered: "Spayed/neutered",
    specialNeeds: "Special needs",
    adoptionDetails: "Adoption details",
    description: "Description",
    contactTitle: "Contact",
    socialTitle: "Follow us",
    locationTitle: "Approximate area",
    call: "Call",
    text: "Send text",
    email: "Email",
    map: "View on map",
    share: "Share",
    shareCopied: "Link copied",
    yes: "Yes",
  },
} as const;

const STATUS_BADGE: Record<string, { es: string; en: string; className: string }> = {
  "mascota-perdida": { es: "PERDIDA", en: "LOST", className: "border-[#7A1E2C]/50 bg-[#F7E3E6]/95 text-[#7A1E2C]" },
  "mascota-encontrada": { es: "ENCONTRADA", en: "FOUND", className: "border-emerald-900/40 bg-[#E8F3EA]/95 text-[#1B4332]" },
  "adopcion-mascota": { es: "ADOPCIÓN", en: "ADOPTION", className: "border-[#8A6B1F]/45 bg-[#FBF3DA]/95 text-[#6B5310]" },
  "objeto-perdido": { es: "OBJETO PERDIDO", en: "LOST ITEM", className: "border-[#5C5346]/45 bg-[#EDE8DF]/95 text-[#3D3428]" },
  "objeto-encontrado": { es: "OBJETO ENCONTRADO", en: "FOUND ITEM", className: "border-emerald-900/40 bg-[#E8F3EA]/95 text-[#1B4332]" },
};

function formatLongDate(iso: string, lang: Lang): string {
  if (!iso) return "";
  try {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(lang === "en" ? "en-US" : "es-MX", { month: "long", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function buildMapQuery(d: MascotasPerdidosQuickDraft): string | null {
  const parts = [d.landmark.trim(), d.lastSeenLocation.trim(), d.city.trim(), d.state.trim(), d.zip.trim(), d.country.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export type MascotasQuickAdShell = "standalone" | "embedded";

export function MascotasPerdidosQuickAdCanvas({
  draft,
  lang,
  shell = "standalone",
  leonixAdId,
}: {
  draft: MascotasPerdidosQuickDraft;
  lang: Lang;
  shell?: MascotasQuickAdShell;
  leonixAdId?: string | null;
}) {
  const t = COPY[lang];
  const [shareHint, setShareHint] = useState<string | null>(null);
  const isPet = isPetNoticeType(draft.noticeType);
  const isLost = draft.noticeType === "mascota-perdida";
  const isFound = draft.noticeType === "mascota-encontrada";
  const isAdoption = draft.noticeType === "adopcion-mascota";
  const rewardEligible = draft.noticeType === "mascota-perdida" || draft.noticeType === "objeto-perdido";
  const badge = STATUS_BADGE[draft.noticeType];

  const images = draft.images.filter((im) => im.url.trim());
  const main = images.find((im) => im.isMain) ?? images[0] ?? null;
  const gallery = images.filter((im) => im !== main);

  const telHref = buildTelHref(draft.phone);
  const smsHref = buildSmsHref(draft.smsPhone, lang === "es" ? "Vi tu aviso en Leonix Media." : "I saw your notice on Leonix Media.");
  const waDigitsRaw = buildTelHref(draft.whatsapp);
  const waDigits = waDigitsRaw ? waDigitsRaw.replace(/^tel:\+/, "") : null;
  const waHref = waDigits ? buildWhatsAppUrl(waDigits, lang === "es" ? "Vi tu aviso en Leonix Media." : "I saw your notice on Leonix Media.") : null;
  const mailHref = buildMailtoHref(draft.email, lang === "es" ? "Sobre tu aviso en Leonix Media" : "About your notice on Leonix Media");
  const hasContactActions = !!(telHref || smsHref || waHref || mailHref);

  const mapQuery = buildMapQuery(draft);
  const mapsEmbedUrl = mapQuery ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed` : null;
  const mapsDirectionsUrl = mapQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery)}` : null;

  const factItems: CommunityPremiumInfoItem[] = isPet
    ? [
        { key: "breed", label: t.breed, value: draft.breed.trim() },
        { key: "color", label: t.color, value: draft.color.trim() },
        { key: "sex", label: t.sex, value: labelMascotasSex(draft.sex, lang) },
        { key: "age", label: t.age, value: draft.ageApprox.trim() },
        { key: "size", label: t.size, value: labelMascotasSize(draft.size, lang) },
        { key: "collar", label: t.collar, value: draft.hasCollar ? draft.collarNote.trim() || t.yes : "" },
        ...(isLost || isFound ? [{ key: "microchip", label: t.microchip, value: labelMascotasTriState(draft.microchip, lang) }] : []),
        ...(isAdoption
          ? [
              { key: "temperament", label: t.temperament, value: draft.temperament.trim() },
              { key: "vaccinated", label: t.vaccinated, value: labelMascotasTriState(draft.vaccinated, lang) },
              { key: "spayedNeutered", label: t.spayedNeutered, value: labelMascotasTriState(draft.spayedNeutered, lang) },
            ]
          : []),
      ]
    : [{ key: "color", label: t.color, value: draft.color.trim() }];

  const dateLine = isFound ? formatLongDate(draft.foundDate, lang) : formatLongDate(draft.lastSeenDate, lang);
  const dateLabel = isFound ? t.found : t.lastSeen;

  const titleLine = draft.petName.trim() || draft.title.trim() || "—";
  const rewardLine = draft.offersReward && draft.rewardAmount.trim() ? `${lang === "es" ? "RECOMPENSA" : "REWARD"} $${draft.rewardAmount.trim()}` : null;

  const shareTitle = titleLine;
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
      ? "mx-auto my-6 w-full max-w-3xl overflow-hidden rounded-2xl border border-[#C9B46A]/45 bg-[#FCF9F2] text-[#2A2826] shadow-md"
      : "mx-auto w-full max-w-3xl min-w-0 overflow-hidden rounded-xl text-[#2A2826]";

  return (
    <article className={articleClass}>
      {/* 1. Photo/gallery — controlled height, no viewport takeover (Section V) */}
      <div className="relative w-full overflow-hidden bg-[#EDE8DF]" style={{ aspectRatio: "16 / 10", maxHeight: "480px" }}>
        {main ? (
          <Image src={main.url} alt={main.alt} fill className="object-cover object-center" sizes="(max-width: 768px) 100vw, 768px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[#8A8175]">—</div>
        )}
        {/* 2. Status + reward badges */}
        <div className="pointer-events-none absolute right-3 top-3 flex flex-wrap justify-end gap-2">
          {badge ? (
            <span className={`rounded-full border-2 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide shadow-[0_2px_10px_rgba(0,0,0,0.28)] backdrop-blur-sm ${badge.className}`}>
              {lang === "en" ? badge.en : badge.es}
            </span>
          ) : null}
        </div>
        {rewardLine ? (
          <div className="pointer-events-none absolute left-3 top-3">
            <span className="rounded-full border-2 border-[#B8860B]/60 bg-[#FFF3C4]/95 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[#6B4E00] shadow-[0_2px_10px_rgba(0,0,0,0.22)]">
              {rewardLine}
            </span>
          </div>
        ) : null}
      </div>

      {gallery.length ? (
        <div className="flex gap-2 overflow-x-auto p-3">
          {gallery.map((im) => (
            <div key={im.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#C9B46A]/35 bg-[#EDE8DF]">
              <Image src={im.url} alt={im.alt} fill className="object-cover" sizes="64px" unoptimized />
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4 p-5 sm:p-7">
        {/* 3. Title */}
        <header className="text-center">
          {badge ? (
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#8A6B1F]">{lang === "en" ? badge.en : badge.es}</p>
          ) : null}
          <h1 className="mt-1 text-2xl font-extrabold leading-tight text-[#2A2826] sm:text-3xl">{titleLine}</h1>
        </header>

        {/* 4. Key identifying facts */}
        <div>
          <h2 className={COMMUNITY_PREMIUM_SURFACE.sectionLabel}>{isPet ? t.petFacts : t.objectFacts}</h2>
          <div className="mt-2">
            <CommunityPremiumInfoGrid items={factItems} />
          </div>
        </div>

        {/* 5. Last seen / found date + area */}
        {dateLine || draft.lastSeenLocation.trim() ? (
          <p className="text-sm font-medium text-[#5C564E]">
            {dateLine ? (
              <>
                <span className="font-bold text-[#2A2826]">{dateLabel}:</span> {dateLine}
                {draft.lastSeenLocation.trim() ? " · " : ""}
              </>
            ) : null}
            {draft.lastSeenLocation.trim()}
          </p>
        ) : null}

        {/* 6. Description */}
        <CommunityPremiumTextCard title={t.description} body={draft.description} testId="mascotas-premium-description" />

        {/* 7. Safety / instructions */}
        {isLost ? <CommunityPremiumTextCard title={t.safety} body={draft.safetyNote} testId="mascotas-premium-safety" /> : null}
        {isFound ? <CommunityPremiumTextCard title={t.claim} body={draft.claimInstructions} testId="mascotas-premium-claim" /> : null}
        {isFound ? <CommunityPremiumTextCard title={t.currentStatus} body={draft.currentStatus} testId="mascotas-premium-status" /> : null}
        {isAdoption ? <CommunityPremiumTextCard title={t.specialNeeds} body={draft.specialNeeds} testId="mascotas-premium-special-needs" /> : null}
        {isAdoption ? <CommunityPremiumTextCard title={t.adoptionDetails} body={draft.adoptionDetails} testId="mascotas-premium-adoption" /> : null}
        {draft.identifyingMarks.trim() ? (
          <CommunityPremiumTextCard title={t.identifyingMarks} body={draft.identifyingMarks} testId="mascotas-premium-marks" />
        ) : null}

        {/* 8. Contact actions — native hrefs directly (Gate 2C/2D/3 pattern), no sheet/modal */}
        {hasContactActions ? (
          <div className="space-y-2">
            <h2 className={COMMUNITY_PREMIUM_SURFACE.sectionLabel}>{t.contactTitle}</h2>
            <div className="flex flex-wrap gap-2">
              {telHref ? (
                <a href={telHref} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#7A1E2C] px-3.5 py-2 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:opacity-95">
                  <FiPhone className="h-4 w-4 shrink-0" aria-hidden />
                  {t.call}
                </a>
              ) : null}
              {waHref ? (
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#25D366] px-3.5 py-2 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:opacity-95">
                  <FaWhatsapp className="h-4 w-4 shrink-0" aria-hidden />
                  WhatsApp
                </a>
              ) : null}
              {smsHref ? (
                <a href={smsHref} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#7A1E2C] bg-[#FCF9F2] px-3.5 py-2 text-sm font-bold text-[#2A2826] shadow-sm transition hover:opacity-95">
                  <FiMessageSquare className="h-4 w-4 shrink-0" aria-hidden />
                  {t.text}
                </a>
              ) : null}
              {mailHref ? (
                <a href={mailHref} className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#C9B46A] bg-[#FCF9F2] px-3.5 py-2 text-sm font-bold text-[#2A2826] shadow-sm transition hover:opacity-95">
                  <FiMail className="h-4 w-4 shrink-0" aria-hidden />
                  {t.email}
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 9. Social contact */}
        {draft.facebook.trim() || draft.instagram.trim() ? (
          <div className="space-y-2">
            <h2 className={COMMUNITY_PREMIUM_SURFACE.sectionLabel}>{t.socialTitle}</h2>
            <div className="flex flex-wrap gap-2">
              {draft.facebook.trim() ? (
                <a href={draft.facebook.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#C9B46A]/45 bg-white px-3 py-1.5 text-xs font-semibold text-[#1877F2]">
                  <FaFacebook className="h-4 w-4" aria-hidden />
                  Facebook
                </a>
              ) : null}
              {draft.instagram.trim() ? (
                <a href={draft.instagram.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#C9B46A]/45 bg-white px-3 py-1.5 text-xs font-semibold text-[#E4405F]">
                  <FaInstagram className="h-4 w-4" aria-hidden />
                  Instagram
                </a>
              ) : null}
            </div>
          </div>
        ) : null}

        {/* 10. Share */}
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

        {/* 11. Approximate location + live map */}
        {mapsEmbedUrl ? (
          <CommunityPremiumCanvasCard testId="mascotas-premium-map">
            <h2 className={COMMUNITY_PREMIUM_SURFACE.sectionLabel}>{t.locationTitle}</h2>
            <p className="mt-1 text-sm text-[#5C564E]">{mapQuery}</p>
            <div className="mt-2 space-y-2">
              <div className="overflow-hidden rounded-lg" style={{ height: "180px" }}>
                <iframe src={mapsEmbedUrl} title={lang === "es" ? "Mapa del área aproximada" : "Approximate area map"} className="h-full w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
              {mapsDirectionsUrl ? (
                <a href={mapsDirectionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl bg-[#7A1E2C] px-4 py-2.5 text-sm font-bold text-[#FFFCF7] sm:w-auto">
                  <FiMapPin className="h-4 w-4 shrink-0" aria-hidden />
                  {t.map}
                </a>
              ) : null}
            </div>
          </CommunityPremiumCanvasCard>
        ) : null}

        {/* 12. Leonix metadata/footer */}
        <CommunityPremiumTrustFooter lang={lang} leonixAdId={leonixAdId} />
      </div>
    </article>
  );
}
