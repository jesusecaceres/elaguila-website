"use client";

import Image from "next/image";
import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { EmpleosJobRecord } from "../data/empleosJobTypes";
import { empleosJobRecordListLocationLine } from "../lib/empleosJobRecordListLocation";
import {
  EMPLEOS_BADGE_PREMIUM,
  EMPLEOS_BADGE_QUICK,
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
  /** Fair “fresh posting” signal — uses same 7‑day window as results `recent` filter. */
  showRecentRibbon?: boolean;
};

function modalityEs(m: EmpleosJobRecord["modality"]) {
  return m === "presencial" ? "Presencial" : m === "hibrido" ? "Híbrido" : "Remoto";
}

function jobTypeEs(t: EmpleosJobRecord["jobType"]) {
  const map: Record<EmpleosJobRecord["jobType"], string> = {
    "tiempo-completo": "Tiempo completo",
    "medio-tiempo": "Medio tiempo",
    temporal: "Temporal",
    "por-contrato": "Por contrato",
  };
  return map[t];
}

export function EmpleosJobResultCard({ job, lang, variant = "list", showRecentRibbon = false }: Props) {
  const detailHref = appendLangToPath(`/clasificados/empleos/${job.slug}`, lang);
  const locationLine = empleosJobRecordListLocationLine(job);

  const isWide = variant === "grid";

  const tierShell =
    job.listingTier === "promoted"
      ? EMPLEOS_CARD_PROMOTED
      : job.listingTier === "featured"
        ? EMPLEOS_CARD_FEATURED
        : EMPLEOS_CARD_STANDARD;

  const tierRibbon =
    job.listingTier === "promoted"
      ? "bg-gradient-to-r from-amber-200/95 via-amber-300/90 to-[#C9942E]/95 text-[#3D2A0C] shadow-[0_6px_16px_rgba(180,130,40,0.25)]"
      : "bg-gradient-to-r from-[#F6E0A8] to-[#E8C56A] text-[#3A3220] shadow-[0_4px_14px_rgba(42,40,38,0.12)]";

  return (
    <article
      className={`group overflow-hidden ${tierShell} ${
        isWide ? "flex h-full flex-col" : "flex flex-col gap-4 sm:flex-row sm:items-stretch"
      }`}
    >
      <Link href={detailHref} className={`relative shrink-0 bg-[#EDE8E0] ${isWide ? "aspect-[16/9] w-full" : "aspect-[16/10] w-full sm:aspect-auto sm:h-auto sm:w-52 lg:w-60"}`}>
        <Image src={job.imageSrc} alt={job.imageAlt} fill className="object-cover" sizes={isWide ? "(max-width:768px)100vw,33vw" : "200px"} />
        {job.listingTier !== "standard" ? (
          <span
            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${tierRibbon}`}
          >
            {job.listingTier === "promoted" ? (lang === "es" ? "Promocionado" : "Promoted") : lang === "es" ? "Destacado" : "Featured"}
          </span>
        ) : showRecentRibbon ? (
          <span className="absolute left-2 top-2 rounded-full border border-emerald-200/90 bg-[#F0FAF3]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#166534] shadow-sm">
            {lang === "es" ? "Reciente" : "Recent"}
          </span>
        ) : null}
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col p-4 sm:p-5 ${isWide ? "" : "sm:py-5 sm:pr-5"}`}>
        <div className="flex flex-wrap items-start gap-2">
          <Link href={detailHref} className="min-w-0 flex-1">
            <h2 className={`font-bold leading-snug text-[#2A2826] group-hover:underline ${isWide ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"}`}>{job.title}</h2>
          </Link>
          {job.quickApply ? (
            <span className={`shrink-0 ${EMPLEOS_BADGE_QUICK}`}>{lang === "es" ? "Aplicación rápida" : "Quick apply"}</span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-[#4F6B82]">{job.company}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#4A4744]">
          <span>{locationLine}</span>
          <span aria-hidden>·</span>
          <span>{lang === "es" ? modalityEs(job.modality) : job.modality}</span>
          <span aria-hidden>·</span>
          <span>{lang === "es" ? jobTypeEs(job.jobType) : job.jobType}</span>
        </div>
        <p className="mt-2 text-base font-bold text-[#8A5A18]">{job.salaryLabel}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.verifiedEmployer ? (
            <span className={EMPLEOS_BADGE_VERIFIED}>{lang === "es" ? "Empleador verificado" : "Verified employer"}</span>
          ) : null}
          {job.premiumEmployer ? (
            <span className={EMPLEOS_BADGE_PREMIUM}>{lang === "es" ? "Negocio premium" : "Premium business"}</span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-[#5C564E]">{job.summary}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Link href={detailHref} className={`${EMPLEOS_CTA_PRIMARY} min-w-[7.5rem] px-4`}>
            {lang === "es" ? "Ver vacante" : "View job"}
          </Link>
        </div>
      </div>
    </article>
  );
}
