"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { EmpleosJobRecord } from "./data/empleosJobTypes";
import { getRelatedJobs } from "./data/empleosSampleCatalog";
import { buildEmpleosResultadosUrl } from "./shared/utils/empleosListaUrl";
import { EmpleosJobResultCard } from "./components/EmpleosJobResultCard";

type Props = {
  job: EmpleosJobRecord;
};

export function EmpleoPublicDetailClient({ job }: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);

  const related = useMemo(() => getRelatedJobs(job.slug, 3), [job.slug]);

  const resultsHref = appendLangToPath("/clasificados/empleos/resultados", lang);
  const publishHref = appendLangToPath("/clasificados/publicar/empleos", lang);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] pb-20 text-[#2A2826]">
      <header className="border-b border-[#E8DFD0] bg-[#FFFBF7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <nav className="text-xs font-semibold text-[#4A4744] sm:text-sm" aria-label="Breadcrumb">
            <Link href={appendLangToPath("/clasificados", lang)} className="hover:underline">
              {lang === "es" ? "Clasificados" : "Classifieds"}
            </Link>
            <span className="mx-1.5 text-[#9A948C]">&gt;</span>
            <Link href={appendLangToPath("/clasificados/empleos", lang)} className="hover:underline">
              {lang === "es" ? "Empleos" : "Jobs"}
            </Link>
            <span className="mx-1.5 text-[#9A948C]">&gt;</span>
            <span className="text-[#2A2826]">{lang === "es" ? "Vacante" : "Opening"}</span>
          </nav>
          <Link href={resultsHref} className="text-xs font-semibold text-[#4F6B82] hover:underline sm:text-sm">
            ← {lang === "es" ? "Volver a resultados" : "Back to results"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-24 sm:px-6 sm:pt-28">
        <div className="overflow-hidden rounded-[1.35rem] border border-[#E8DFD0] bg-white shadow-[0_16px_48px_rgba(42,40,38,0.08)]">
          <div className="relative aspect-[21/9] max-h-72 w-full bg-[#EDE8E0] sm:aspect-[24/9]">
            <Image src={job.imageSrc} alt={job.imageAlt} fill className="object-cover" priority sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#2A2826]/55 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold leading-tight text-white drop-shadow sm:text-3xl">{job.title}</h1>
                <p className="mt-1 text-sm font-semibold text-white/95">{job.company}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {job.listingTier !== "standard" ? (
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#6B5320] shadow">
                    {job.listingTier === "promoted"
                      ? lang === "es"
                        ? "Promocionado"
                        : "Promoted"
                      : lang === "es"
                        ? "Destacado"
                        : "Featured"}
                  </span>
                ) : null}
                {job.verifiedEmployer ? (
                  <span className="rounded-full bg-[#E8F4EA] px-3 py-1 text-xs font-bold text-[#1F5F2F]">
                    {lang === "es" ? "Verificado" : "Verified"}
                  </span>
                ) : null}
                {job.premiumEmployer ? (
                  <span className="rounded-full bg-[#FFF4E0] px-3 py-1 text-xs font-bold text-[#7A5210]">
                    {lang === "es" ? "Negocio premium" : "Premium business"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="min-w-0 space-y-6">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
                    {lang === "es" ? "Ubicación" : "Location"}
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {job.city}, {job.state}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
                    {lang === "es" ? "Salario" : "Pay"}
                  </dt>
                  <dd className="mt-0.5 font-bold text-[#8A5A18]">{job.salaryLabel}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
                    {lang === "es" ? "Modalidad" : "Modality"}
                  </dt>
                  <dd className="mt-0.5">{job.modality}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
                    {lang === "es" ? "Tipo" : "Type"}
                  </dt>
                  <dd className="mt-0.5">{job.jobType}</dd>
                </div>
              </dl>

              <section>
                <h2 className="text-lg font-bold">{lang === "es" ? "Descripción" : "Description"}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#4A4744]">{job.description}</p>
              </section>

              <section>
                <h2 className="text-lg font-bold">{lang === "es" ? "Requisitos" : "Requirements"}</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4A4744]">
                  {job.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold">{lang === "es" ? "Beneficios" : "Benefits"}</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4A4744]">
                  {job.benefits.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </section>
            </div>

            <aside className="flex flex-col gap-4 rounded-2xl border border-[#F0E8DC] bg-[#FFFBF7] p-5 lg:sticky lg:top-28">
              {job.quickApply ? (
                <p className="text-xs font-semibold text-[#4F6B82]">
                  {lang === "es" ? "Esta vacante acepta aplicación rápida (demo)." : "Quick apply available (demo)."}
                </p>
              ) : null}
              <Link
                href={appendLangToPath("/contacto", lang)}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#E8A54B] via-[#D9A23A] to-[#C9942E] px-4 text-sm font-bold text-[#2A2826] shadow-md"
              >
                {lang === "es" ? "Aplicar o contactar" : "Apply or contact"}
              </Link>
              <Link
                href={buildEmpleosResultadosUrl(lang, { category: job.category })}
                className="text-center text-sm font-semibold text-[#4F6B82] hover:underline"
              >
                {lang === "es" ? "Más empleos en esta categoría" : "More jobs in this category"}
              </Link>
              <Link href={publishHref} className="text-center text-sm font-semibold text-[#4F6B82] hover:underline">
                {lang === "es" ? "¿Publicar una vacante?" : "Post a job?"}
              </Link>
            </aside>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-12" aria-labelledby="rel">
            <h2 id="rel" className="text-xl font-bold">
              {lang === "es" ? "Empleos relacionados" : "Related jobs"}
            </h2>
            <div className="mt-4 flex flex-col gap-4">
              {related.map((r) => (
                <EmpleosJobResultCard key={r.id} job={r} lang={lang} variant="list" />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
