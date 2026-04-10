"use client";

import Image from "next/image";
import Link from "next/link";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { EmpleosJobRecord } from "../data/empleosJobTypes";

type Props = {
  job: EmpleosJobRecord;
  lang: Lang;
  variant?: "grid" | "list";
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

export function EmpleosJobResultCard({ job, lang, variant = "list" }: Props) {
  const detailHref = appendLangToPath(`/clasificados/empleos/${job.slug}`, lang);

  const isWide = variant === "grid";

  return (
    <article
      className={`group overflow-hidden rounded-2xl border border-[#E8DFD0] bg-white shadow-[0_10px_32px_rgba(42,40,38,0.07)] transition hover:border-[#D9A23A]/40 hover:shadow-[0_14px_40px_rgba(42,40,38,0.1)] ${
        isWide ? "flex h-full flex-col" : "flex flex-col gap-4 sm:flex-row sm:items-stretch"
      }`}
    >
      <Link href={detailHref} className={`relative shrink-0 bg-[#EDE8E0] ${isWide ? "aspect-[16/9] w-full" : "aspect-[16/10] w-full sm:aspect-auto sm:h-auto sm:w-44 lg:w-52"}`}>
        <Image src={job.imageSrc} alt={job.imageAlt} fill className="object-cover" sizes={isWide ? "(max-width:768px)100vw,33vw" : "200px"} />
        {job.listingTier !== "standard" ? (
          <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#F6E0A8] to-[#E8C56A] px-2 py-0.5 text-[10px] font-bold uppercase text-[#3A3220]">
            {job.listingTier === "promoted" ? (lang === "es" ? "Promocionado" : "Promoted") : lang === "es" ? "Destacado" : "Featured"}
          </span>
        ) : null}
      </Link>

      <div className={`flex min-w-0 flex-1 flex-col p-4 ${isWide ? "" : "sm:py-4 sm:pr-4"}`}>
        <div className="flex flex-wrap items-start gap-2">
          <Link href={detailHref} className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-snug text-[#2A2826] group-hover:underline">{job.title}</h2>
          </Link>
          {job.quickApply ? (
            <span className="shrink-0 rounded-full border border-[#D4E3F0] bg-[#F4F8FB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#4F6B82]">
              {lang === "es" ? "Aplicación rápida" : "Quick apply"}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm font-semibold text-[#4F6B82]">{job.company}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#4A4744]">
          <span>
            {job.city}, {job.state}
          </span>
          <span aria-hidden>·</span>
          <span>{lang === "es" ? modalityEs(job.modality) : job.modality}</span>
          <span aria-hidden>·</span>
          <span>{lang === "es" ? jobTypeEs(job.jobType) : job.jobType}</span>
        </div>
        <p className="mt-2 text-base font-bold text-[#8A5A18]">{job.salaryLabel}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.verifiedEmployer ? (
            <span className="rounded-full bg-[#E8F4EA] px-2 py-0.5 text-[11px] font-semibold text-[#1F5F2F]">
              {lang === "es" ? "Empleador verificado" : "Verified employer"}
            </span>
          ) : null}
          {job.premiumEmployer ? (
            <span className="rounded-full bg-[#FFF4E0] px-2 py-0.5 text-[11px] font-semibold text-[#7A5210]">
              {lang === "es" ? "Negocio premium" : "Premium business"}
            </span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-[#5C564E]">{job.summary}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Link
            href={detailHref}
            className="inline-flex min-h-11 min-w-[7.5rem] items-center justify-center rounded-xl bg-gradient-to-r from-[#E8A54B] via-[#D9A23A] to-[#C9942E] px-4 text-sm font-bold text-[#2A2826] shadow-sm transition hover:brightness-[1.03]"
          >
            {lang === "es" ? "Ver vacante" : "View job"}
          </Link>
        </div>
      </div>
    </article>
  );
}
