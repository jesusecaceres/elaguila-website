"use client";

import Link from "next/link";
import { FaBookmark } from "react-icons/fa";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import { sampleFeaturedJobs, type SampleFeaturedJob } from "../../data/empleosLandingSampleData";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";
import { EMPLEOS_CTA_PRIMARY } from "../../lib/empleosPremiumUi";
import { LandingSection } from "./empleosLandingUi";

type Props = {
  lang: Lang;
  /** When set (including empty), replaces marketing sample rows — used for live-only inventory. */
  jobs?: SampleFeaturedJob[];
  liveInventory?: boolean;
};

function modalityLabel(m: SampleFeaturedJob["modality"], lang: Lang) {
  if (lang === "en") {
    return m === "presencial" ? "On-site" : m === "hibrido" ? "Hybrid" : "Remote";
  }
  return m === "presencial" ? "Presencial" : m === "hibrido" ? "Híbrido" : "Remoto";
}

function FeaturedLandingCard({ job, lang }: { job: SampleFeaturedJob; lang: Lang }) {
  const detailHref = appendLangToPath(`/clasificados/empleos/${job.slug}`, lang);
  const similarHref = buildEmpleosResultadosUrl(lang, {
    q: job.title,
    category: job.category,
    modality: job.modality,
    jobType: job.jobType,
  });

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#E5D4B8]/80 bg-white ring-1 ring-[#D9A23A]/28 shadow-[0_20px_52px_rgba(42,40,38,0.085)] transition hover:ring-[#D9A23A]/38 hover:shadow-[0_24px_58px_rgba(42,40,38,0.1)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#F0E8DC] bg-gradient-to-r from-[#FFFBF7] via-[#FFF8EC] to-[#FFFBF7] px-4 py-3.5">
        <span className="rounded-full bg-gradient-to-r from-[#F6E0A8] to-[#E8C56A] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#3A3220] shadow-[0_4px_12px_rgba(201,148,46,0.22)]">
          {lang === "es" ? "Destacado" : "Featured"}
        </span>
        <Link
          href={similarHref}
          className="rounded-lg p-2 text-[#5B6F82] transition hover:bg-[#F5F0E8] hover:text-[#2A2826]"
          aria-label={lang === "es" ? "Ver ofertas similares" : "View similar listings"}
        >
          <FaBookmark className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF8EC] to-[#F3E0C0] text-sm font-bold text-[#6B5320] shadow-inner">
            {job.companyInitials}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-snug text-[#2A2826]">
              <Link href={detailHref} className="hover:underline">
                {job.title}
              </Link>
            </h3>
            <p className="text-sm font-semibold text-[#4F6B82]">{job.company}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-[#4A4744]/90">
          {job.city}, {job.state} · {modalityLabel(job.modality, lang)}
        </p>
        <p className="mt-2 text-sm font-bold text-[#8A5A18]">{job.salaryLabel}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {job.benefitChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-[#E8DFD0]/90 bg-[#FFFBF5] px-2.5 py-1 text-[11px] font-medium text-[#3A3220]"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Link href={detailHref} className={`${EMPLEOS_CTA_PRIMARY} min-w-[7.5rem] px-4`}>
            {lang === "es" ? "Ver trabajo" : "View job"}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function FeaturedJobsLandingSection({ lang, jobs, liveInventory = false }: Props) {
  const rows = liveInventory ? (jobs ?? []) : (jobs ?? sampleFeaturedJobs);
  const subtitle = liveInventory
    ? lang === "es"
      ? "Vacantes con mayor visibilidad entre las publicadas en Leonix (promoted/featured)."
      : "Higher-visibility roles among what is currently published on Leonix (promoted/featured)."
    : lang === "es"
      ? "Roles con buena visibilidad y detalles claros — ideal para decidir rápido."
      : "Highly visible roles with clear details — decide faster.";
  const eyebrow = liveInventory
    ? lang === "es"
      ? "Inventario publicado"
      : "Published inventory"
    : lang === "es"
      ? "Selección editorial"
      : "Editor picks";

  return (
    <LandingSection
      eyebrow={eyebrow}
      title={lang === "es" ? "Trabajos destacados" : "Featured jobs"}
      subtitle={subtitle}
      rightSlot={
        <Link
          href={buildEmpleosResultadosUrl(lang, { featured: "1" })}
          className="text-sm font-semibold text-[#4F6B82] underline-offset-4 transition hover:text-[#2A2826] hover:underline"
        >
          {lang === "es" ? "Ver todos los destacados →" : "See all featured →"}
        </Link>
      }
    >
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[#E5D4B8] bg-white/80 px-6 py-10 text-center text-sm text-[#4A4744]">
          {lang === "es"
            ? "Aún no hay vacantes destacadas en inventario. Explora resultados o publica la tuya."
            : "No featured roles in inventory yet. Browse results or post yours."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((job) => (
            <FeaturedLandingCard key={job.id} job={job} lang={lang} />
          ))}
        </div>
      )}
    </LandingSection>
  );
}
