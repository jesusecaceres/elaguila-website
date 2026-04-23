"use client";

import Link from "next/link";
import { FaBriefcase, FaCheck, FaHeart } from "react-icons/fa";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import {
  EMPLEOS_BUSINESS_PLANS_PATH,
  EMPLEOS_PUBLISH_HUB_PATH,
} from "../../empleosLandingRoutes";
import { sampleRecentJobs, type SampleRecentJob } from "../../data/empleosLandingSampleData";
import { buildEmpleosResultadosUrl } from "../../shared/utils/empleosListaUrl";
import { EMPLEOS_LANDING_RECENT_MAX } from "../../lib/empleosPublicRankingPolicy";
import { EMPLEOS_BADGE_QUICK, EMPLEOS_CTA_PRIMARY } from "../../lib/empleosPremiumUi";
import { LandingSection } from "./empleosLandingUi";

type Props = {
  lang: Lang;
  jobs?: SampleRecentJob[];
  liveInventory?: boolean;
};

function modalityShort(job: SampleRecentJob, lang: Lang) {
  if (lang === "en") {
    return job.modality === "presencial" ? "On-site" : job.modality === "hibrido" ? "Hybrid" : "Remote";
  }
  return job.modality === "presencial" ? "Presencial" : job.modality === "hibrido" ? "Híbrido" : "Remoto";
}

export function LatestJobsAndEmployer({ lang, jobs, liveInventory = false }: Props) {
  const publishHref = appendLangToPath(EMPLEOS_PUBLISH_HUB_PATH, lang);
  const plansHref = appendLangToPath(EMPLEOS_BUSINESS_PLANS_PATH, lang);
  const rows = liveInventory ? (jobs ?? []) : (jobs ?? sampleRecentJobs);
  const recentCap = EMPLEOS_LANDING_RECENT_MAX;
  const subtitle = liveInventory
    ? lang === "es"
      ? `Hasta ${recentCap} filas: orden cronológico por fecha de publicación (más recientes primero). No es un ranking pagado; si hay vacantes estándar en inventario, la selección mezcla visibilidad para que no sea solo planes premium. El listado completo está en Resultados.`
      : `Up to ${recentCap} rows: chronological by publish date (newest first). Not a paid ranking; when standard listings exist, the mix avoids an all-premium slice. See full inventory on Results.`
    : lang === "es"
      ? "Publicaciones recientes en el área — mismo formato que alimentará el feed en vivo."
      : "Recent postings in the region — same shape as the future live feed.";

  return (
    <LandingSection
      eyebrow={lang === "es" ? "Recién publicado" : "Just published"}
      title={lang === "es" ? "Últimos empleos publicados" : "Latest job postings"}
      subtitle={subtitle}
      rightSlot={
        <Link
          href={buildEmpleosResultadosUrl(lang, { sort: "date_desc" })}
          className="text-sm font-semibold text-[#4F6B82] underline-offset-4 transition hover:text-[#2A2826] hover:underline"
        >
          {lang === "es" ? "Ver todos los empleos →" : "See all jobs →"}
        </Link>
      }
    >
      <div className="grid gap-8 lg:gap-10 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.45fr)] xl:items-start">
        <div className="rounded-[1.25rem] border border-[#E8DFD0] bg-white shadow-[0_12px_36px_rgba(42,40,38,0.07)]">
          {rows.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-[#4A4744]">
              {lang === "es"
                ? "No hay publicaciones recientes en inventario. Ajusta la búsqueda en resultados o publica una vacante."
                : "No recent postings in inventory yet. Try results filters or post a job."}
            </p>
          ) : (
            rows.map((job, i) => {
              const detailHref = appendLangToPath(`/clasificados/empleos/${job.slug}`, lang);
              const categoryHref = buildEmpleosResultadosUrl(lang, { category: job.category });
              return (
                <div
                  key={job.id}
                  className={`flex flex-col gap-3 border-[#F0E8DC] px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5 ${i > 0 ? "border-t" : ""}`}
                >
                  <Link
                    href={detailHref}
                    className="group flex min-w-0 flex-1 flex-col gap-1 rounded-xl outline-none ring-[#D9A23A]/0 transition hover:bg-[#FFFBF7] focus-visible:ring-4 focus-visible:ring-[#D9A23A]/25"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-[#2A2826] group-hover:underline">{job.title}</h3>
                      {job.quickApply ? (
                        <span className={`${EMPLEOS_BADGE_QUICK} text-[10px]`}>{lang === "es" ? "Rápida" : "Quick"}</span>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-[#4F6B82]">{job.company}</p>
                    <p className="text-xs text-[#4A4744]/90">
                      {job.city}, {job.state} · {modalityShort(job, lang)}
                    </p>
                    <p className="text-sm font-bold text-[#8A5A18]">{job.salaryLabel}</p>
                    <p className="text-xs font-medium text-[#7A756E]">{job.publishedAtLabel}</p>
                  </Link>
                  <div className="flex shrink-0 items-center justify-end gap-3 sm:flex-col sm:items-end">
                    <Link href={detailHref} className={`${EMPLEOS_CTA_PRIMARY} min-w-[7rem] px-4`}>
                      {lang === "es" ? "Ver" : "View"}
                    </Link>
                    <Link
                      href={categoryHref}
                      className="rounded-lg p-2 text-[#5B6F82] hover:bg-[#F5F0E8]"
                      aria-label={lang === "es" ? "Explorar categoría" : "Browse category"}
                    >
                      <FaHeart className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <aside className="rounded-[1.35rem] border border-[#E8DFD0] bg-gradient-to-b from-[#FFF9F0] to-[#FFFBF7] p-6 shadow-[0_16px_44px_rgba(42,40,38,0.08)] ring-1 ring-[#D9A23A]/15">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDE4D8] text-[#5C4A32] shadow-inner">
              <FaBriefcase className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h3 className="text-lg font-bold text-[#2A2826]">
                {lang === "es" ? "¿Buscas contratar?" : "Looking to hire?"}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#4A4744]/95">
                {lang === "es"
                  ? "Publica con el plan que te convenga: formatos amplios para contar tu historia, o anuncios rápidos para cubrir turno. Renueva o vuelve a publicar cuando quieras refrescar visibilidad."
                  : "Choose the format that fits: richer layouts to tell your story, or quick posts to fill a shift. Renew or republish when you want to refresh visibility."}
              </p>
            </div>
          </div>

          <ul className="mt-5 space-y-2.5 text-sm text-[#2A2826]">
            {(
              lang === "es"
                ? ["Publica en minutos", "Recibe candidatos interesados", "Planes para todo tipo de negocio"]
                : ["Publish in minutes", "Receive interested applicants", "Plans for every business size"]
            ).map((line) => (
              <li key={line} className="flex gap-2">
                <FaCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#2E7D4A]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-3">
            <Link href={publishHref} className={`${EMPLEOS_CTA_PRIMARY} w-full justify-center px-4 text-center`}>
              {lang === "es" ? "Publicar vacante" : "Post a job"}
            </Link>
            <Link
              href={plansHref}
              className="text-center text-sm font-semibold text-[#4F6B82] underline-offset-4 transition hover:text-[#2A2826] hover:underline"
            >
              {lang === "es" ? "Conoce planes para negocios" : "Business posting options"}
            </Link>
          </div>
        </aside>
      </div>
    </LandingSection>
  );
}
