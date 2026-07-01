"use client";

import Image from "next/image";
import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import { empleosJobRecordListLocationLine } from "../lib/empleosJobRecordListLocation";
import { isLiveListingId } from "./EmpleosApplyForm";
import { trackEmpleosResultCardClick } from "../lib/empleosCtaTracking";
import {
  EMPLEOS_BADGE_VERIFIED,
  EMPLEOS_CARD_FEATURED,
  EMPLEOS_CARD_PROMOTED,
  EMPLEOS_CARD_STANDARD,
  EMPLEOS_CTA_PRIMARY,
} from "../lib/empleosPremiumUi";

type Props = {
  job: EmpleosJobRecord;
  lang: Lang;
  variant?: "grid" | "list";
  /** Fair "fresh posting" signal — uses same 7-day window as results `recent` filter. */
  showRecentRibbon?: boolean;
};

function modalityEs(m: EmpleosJobRecord["modality"]) {
  if (m === "presencial") return "Presencial";
  if (m === "hibrido") return "Híbrido";
  if (m === "remoto") return "Remoto";
  if (m === "campo") return "En campo";
  if (m === "varias-ubicaciones") return "Varias ubicaciones";
  return "Presencial";
}

function jobTypeEs(t: EmpleosJobRecord["jobType"]) {
  const map: Partial<Record<EmpleosJobRecord["jobType"], string>> = {
    "tiempo-completo": "Tiempo completo",
    "medio-tiempo": "Medio tiempo",
    temporal: "Temporal",
    "por-contrato": "Por contrato",
    "por-temporada": "Por temporada",
    "por-horas": "Por horas",
    "fin-de-semana": "Fin de semana",
    "turno-nocturno": "Turno nocturno",
    practicas: "Prácticas",
    voluntariado: "Voluntariado",
    otro: "Otro",
  };
  return map[t] ?? t;
}

/** Compact company logo / initial avatar for result cards. */
function CompanyAvatar({ logoSrc, logoAlt, company }: { logoSrc?: string; logoAlt?: string; company: string }) {
  if (logoSrc) {
    return (
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#D6C7AD]/70 bg-[#F3EDE1] shadow-sm">
        <Image src={logoSrc} alt={logoAlt ?? company} fill className="object-cover" sizes="40px" />
      </div>
    );
  }
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D6C7AD]/70 bg-gradient-to-br from-[#FFF8EC] to-[#F3E0C0] text-sm font-bold text-[#7A6B4A] shadow-sm"
      aria-hidden
    >
      {company.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function EmpleosJobResultCard({ job, lang, variant = "list", showRecentRibbon = false }: Props) {
  const detailHref = appendLangToPath(`/clasificados/empleos/${job.slug}`, lang);
  const locationLine = empleosJobRecordListLocationLine(job);
  const isJobFair = job.publicationLane === "feria";
  const fairDateLine = [job.feriaDateLine, job.feriaTimeLine].filter(Boolean).join(" · ");
  const onResultNavigate = () => {
    if (!isLiveListingId(job.id)) return;
    trackEmpleosResultCardClick({ id: job.id, slug: job.slug });
  };

  const isWide = variant === "grid";

  const tierShell =
    job.listingTier === "promoted"
      ? EMPLEOS_CARD_PROMOTED
      : job.listingTier === "featured"
        ? EMPLEOS_CARD_FEATURED
        : EMPLEOS_CARD_STANDARD;

  const tierRibbon =
    job.listingTier === "promoted"
      ? "bg-gradient-to-r from-[#C9A84A]/90 to-[#A8862A]/90 text-[#FFFCF7] shadow-[0_4px_12px_rgba(122,30,44,0.2)]"
      : "bg-gradient-to-r from-[#F0E4C4] to-[#E4D0A0] text-[#5C4A18] shadow-[0_4px_12px_rgba(42,40,38,0.1)]";

  const payColor = isJobFair ? "text-[#1E4D33]" : "text-[#7A1E2C]";
  const payLabel = isJobFair
    ? job.freeEntry
      ? lang === "es" ? "Entrada gratuita" : "Free entry"
      : job.salaryLabel
    : job.salaryLabel;

  const ctaLabel = isJobFair
    ? lang === "es" ? "Ver feria" : "View fair"
    : lang === "es" ? "Ver empleo" : "View job";

  return (
    <article
      className={`group overflow-hidden ${tierShell} ${
        isWide ? "flex h-full flex-col" : "flex flex-col sm:flex-row sm:items-stretch"
      }`}
    >
      {/* Image area */}
      <Link
        href={detailHref}
        onClick={onResultNavigate}
        className={`relative shrink-0 overflow-hidden bg-[#EDE8DF] ${
          isWide ? "aspect-[16/9] w-full" : "aspect-[16/9] w-full sm:aspect-auto sm:h-auto sm:w-44 lg:w-52"
        }`}
        tabIndex={-1}
        aria-hidden
      >
        <Image
          src={job.imageSrc}
          alt=""
          fill
          className="object-cover transition group-hover:scale-[1.02]"
          sizes={isWide ? "(max-width:768px)100vw,33vw" : "208px"}
        />
        {/* Tier ribbon */}
        {job.listingTier !== "standard" ? (
          <span className={`absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tierRibbon}`}>
            {job.listingTier === "promoted"
              ? lang === "es" ? "Promocionado" : "Promoted"
              : lang === "es" ? "Destacado" : "Featured"}
          </span>
        ) : showRecentRibbon ? (
          <span className="absolute left-2 top-2 rounded-full border border-emerald-200/90 bg-[#F0FAF3]/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#166534]">
            {lang === "es" ? "Reciente" : "Recent"}
          </span>
        ) : null}
        {isJobFair ? (
          <span className="absolute right-2 top-2 rounded-full border border-emerald-200/90 bg-[#E8F5EE]/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#166534]">
            {lang === "es" ? "Feria" : "Fair"}
          </span>
        ) : null}
      </Link>

      {/* Content area */}
      <div className={`flex min-w-0 flex-1 flex-col gap-2 p-4 sm:p-5 ${isWide ? "" : ""}`}>

        {/* Employer identity row */}
        <div className="flex items-center gap-2.5">
          <CompanyAvatar
            logoSrc={(job as Record<string, unknown>).logoSrc as string | undefined}
            logoAlt={(job as Record<string, unknown>).logoAlt as string | undefined}
            company={job.company}
          />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-[#7A7164]">
              {isJobFair
                ? lang === "es" ? `Organiza: ${job.company}` : `Organizer: ${job.company}`
                : job.company}
            </p>
            {locationLine ? (
              <p className="truncate text-[11px] text-[#9A928A]">{locationLine}</p>
            ) : null}
          </div>
        </div>

        {/* Title */}
        <Link href={detailHref} onClick={onResultNavigate} className="min-w-0">
          <h2 className={`font-bold leading-snug text-[#3D3428] decoration-[#C9A84A]/60 underline-offset-2 group-hover:underline ${
            isWide ? "text-xl sm:text-2xl" : "text-base sm:text-lg"
          }`}>
            {job.title}
          </h2>
        </Link>

        {/* Pay */}
        {payLabel ? (
          <p className={`text-sm font-bold ${payColor}`}>{payLabel}</p>
        ) : null}

        {/* Meta chips row */}
        <div className="flex flex-wrap gap-1.5">
          {isJobFair && fairDateLine ? (
            <span className="rounded-md border border-[#D6C7AD]/70 bg-[#FBF7EF] px-2 py-0.5 text-[11px] font-medium text-[#5C5346]">
              {fairDateLine}
            </span>
          ) : (
            <>
              <span className="rounded-md border border-[#D6C7AD]/70 bg-[#FBF7EF] px-2 py-0.5 text-[11px] font-medium text-[#5C5346]">
                {lang === "es" ? modalityEs(job.modality) : job.modality}
              </span>
              <span className="rounded-md border border-[#D6C7AD]/70 bg-[#FBF7EF] px-2 py-0.5 text-[11px] font-medium text-[#5C5346]">
                {lang === "es" ? jobTypeEs(job.jobType) : job.jobType}
              </span>
              {job.category ? (
                <span className="rounded-md border border-[#D6C7AD]/60 bg-[#F8F4EC] px-2 py-0.5 text-[11px] font-medium text-[#7A7164]">
                  {job.category}
                </span>
              ) : null}
            </>
          )}
          {job.verifiedEmployer ? (
            <span className={EMPLEOS_BADGE_VERIFIED}>{lang === "es" ? "Verificado" : "Verified"}</span>
          ) : null}
        </div>

        {/* Summary excerpt */}
        {job.summary ? (
          <p className="line-clamp-2 text-[13px] leading-relaxed text-[#5C564E]">{job.summary}</p>
        ) : null}

        {/* CTA row */}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <Link href={detailHref} onClick={onResultNavigate} className={`${EMPLEOS_CTA_PRIMARY} min-w-[8rem] px-4 text-xs sm:text-sm`}>
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}
