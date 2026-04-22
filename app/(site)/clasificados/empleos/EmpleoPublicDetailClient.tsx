"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";

import type { EmpleosJobRecord } from "./data/empleosJobTypes";
import { getRelatedJobs } from "./data/empleosSampleCatalog";
import { EmpleosApplyForm, isLiveListingId } from "./components/EmpleosApplyForm";
import { buildEmpleosResultadosUrl } from "./shared/utils/empleosListaUrl";
import { EmpleosJobResultCard } from "./components/EmpleosJobResultCard";
import {
  EMPLEOS_BADGE_PREMIUM,
  EMPLEOS_BADGE_QUICK,
  EMPLEOS_BADGE_VERIFIED,
  EMPLEOS_CTA_PRIMARY,
  EMPLEOS_LINK_MUTED,
} from "./lib/empleosPremiumUi";

type Props = {
  slug: string;
  initialJob: EmpleosJobRecord | null;
  relatedExtra?: EmpleosJobRecord[];
  /** When set, increments persisted `view_count` once per browser session load (published slug only). */
  trackPublicViewsForSlug?: string | null;
};

export function EmpleoPublicDetailClient({ slug, initialJob, relatedExtra = [], trackPublicViewsForSlug = null }: Props) {
  const sp = useSearchParams();
  const lang = useMemo<Lang>(() => (sp?.get("lang") === "en" ? "en" : "es"), [sp]);
  const job = initialJob;

  useEffect(() => {
    const s = trackPublicViewsForSlug?.trim();
    if (!s) return;
    try {
      const key = `empleos_public_view_v1:${s}`;
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(key)) return;
      if (typeof sessionStorage !== "undefined") sessionStorage.setItem(key, "1");
    } catch {
      /* private mode / blocked storage */
    }
    void fetch("/api/clasificados/empleos/listings/public-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: s }),
    }).catch(() => {});
  }, [trackPublicViewsForSlug]);

  const related = useMemo(() => getRelatedJobs(slug, 3, relatedExtra), [slug, relatedExtra]);

  const resultsHref = appendLangToPath("/clasificados/empleos/resultados", lang);
  const publishHref = appendLangToPath("/clasificados/publicar/empleos", lang);

  if (!job) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] px-4 pb-20 pt-28 text-[#2A2826]">
        <div className="mx-auto max-w-lg rounded-2xl border border-[#E8DFD0] bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold">{lang === "es" ? "Vacante no encontrada" : "Listing not found"}</p>
          <p className="mt-2 text-sm text-[#5C564E]">
            {lang === "es"
              ? "Puede ser un enlace antiguo o una publicación en borrador. Revisa resultados o publica de nuevo."
              : "The link may be outdated or the listing may still be a draft. Try results or publish again."}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href={resultsHref} className={`${EMPLEOS_CTA_PRIMARY} justify-center px-4 text-center`}>
              {lang === "es" ? "Ir a resultados" : "Go to results"}
            </Link>
            <Link href={appendLangToPath("/clasificados/empleos", lang)} className={`${EMPLEOS_LINK_MUTED} text-center`}>
              {lang === "es" ? "Volver a Empleos" : "Back to Jobs"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7F2] pb-20 text-[#2A2826]">
      <header className="border-b border-[#E8DFD0] bg-[#FFFBF7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
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
          <Link
            href={resultsHref}
            className="text-xs font-semibold text-[#4F6B82] underline-offset-2 transition hover:text-[#2A2826] hover:underline sm:text-sm"
          >
            ← {lang === "es" ? "Volver a resultados" : "Back to results"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <div className="overflow-hidden rounded-[1.35rem] border border-[#E8DFD0] bg-white shadow-[0_18px_52px_rgba(42,40,38,0.085)] ring-1 ring-[#F0E8DC]/80">
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
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#6B5320] shadow-[0_4px_14px_rgba(0,0,0,0.12)] ring-1 ring-white/60 backdrop-blur-sm">
                    {job.listingTier === "promoted"
                      ? lang === "es"
                        ? "Promocionado"
                        : "Promoted"
                      : lang === "es"
                        ? "Destacado"
                        : "Featured"}
                  </span>
                ) : null}
                {job.quickApply ? (
                  <span className={`${EMPLEOS_BADGE_QUICK} bg-white/90 backdrop-blur-sm`}>
                    {lang === "es" ? "Aplicación rápida" : "Quick apply"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-6">
              <div className="rounded-2xl border border-[#F0E8DC] bg-gradient-to-br from-[#FFFBF7] via-[#FFF9F0] to-[#FFF3E6] p-5 shadow-[0_10px_32px_rgba(42,40,38,0.06)] sm:p-6">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF8EC] to-[#F3E0C0] text-base font-bold text-[#6B5320] shadow-inner ring-1 ring-[#E8DFD0]/90">
                    {job.companyInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
                      {lang === "es" ? "Empleador" : "Employer"}
                    </p>
                    <p className="mt-0.5 text-xl font-bold tracking-tight text-[#2A2826]">{job.company}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {job.verifiedEmployer ? (
                        <span className={EMPLEOS_BADGE_VERIFIED}>{lang === "es" ? "Empleador verificado" : "Verified employer"}</span>
                      ) : null}
                      {job.premiumEmployer ? (
                        <span className={EMPLEOS_BADGE_PREMIUM}>{lang === "es" ? "Negocio premium" : "Premium business"}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 sm:gap-x-8">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
                    {lang === "es" ? "Ubicación" : "Location"}
                  </dt>
                  <dd className="mt-0.5 font-medium">
                    {job.city}, {job.state}
                    {job.postalCode ? ` ${job.postalCode}` : ""}
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
                <h2 className="text-lg font-bold tracking-tight">{lang === "es" ? "Descripción" : "Description"}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#4A4744]">{job.description}</p>
              </section>

              <section>
                <h2 className="text-lg font-bold tracking-tight">{lang === "es" ? "Requisitos" : "Requirements"}</h2>
                {job.requirements.length ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4A4744]">
                    {job.requirements.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#7A756E]">{lang === "es" ? "No especificados en esta publicación." : "Not specified for this listing."}</p>
                )}
              </section>

              <section>
                <h2 className="text-lg font-bold tracking-tight">{lang === "es" ? "Beneficios" : "Benefits"}</h2>
                {job.benefits.length ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#4A4744]">
                    {job.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#7A756E]">{lang === "es" ? "No especificados en esta publicación." : "Not specified for this listing."}</p>
                )}
              </section>
            </div>

            <aside className="flex flex-col gap-4 rounded-2xl border border-[#F0E8DC] bg-gradient-to-b from-[#FFFBF7] to-[#FFF8EC] p-5 shadow-[0_12px_36px_rgba(42,40,38,0.07)] ring-1 ring-[#E8DFD0]/60 lg:sticky lg:top-28">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5B6F82]">
                  {lang === "es" ? "Tu siguiente paso" : "Your next step"}
                </p>
                {job.quickApply ? (
                  <p className="mt-1 text-xs font-medium leading-relaxed text-[#4A4744]">
                    {lang === "es"
                      ? "Esta vacante admite aplicación rápida: Leonix canaliza tu mensaje al equipo correspondiente."
                      : "Quick apply is enabled — Leonix routes your message to the right team for this listing."}
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-medium leading-relaxed text-[#4A4744]">
                    {lang === "es"
                      ? "Envía tu interés por Leonix; un asesor o el empleador te contactará con los siguientes pasos."
                      : "Send your interest through Leonix — an advisor or the employer will follow up with next steps."}
                  </p>
                )}
              </div>
              {job.externalApplyUrl ? (
                <a
                  href={job.externalApplyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${EMPLEOS_CTA_PRIMARY} w-full px-4 text-center`}
                >
                  {lang === "es" ? "Sitio del empleador (aplicar)" : "Employer site (apply)"}
                </a>
              ) : null}
              {job && isLiveListingId(job.id) ? (
                <EmpleosApplyForm listingId={job.id} lang={lang} screenerQuestions={job.screenerQuestions} />
              ) : (
                <>
                  <Link href={appendLangToPath("/contacto", lang)} className={`${EMPLEOS_CTA_PRIMARY} w-full px-4 text-center`}>
                    {lang === "es" ? "Enviar interés por Leonix" : "Send interest via Leonix"}
                  </Link>
                  <p className="text-center text-[11px] leading-relaxed text-[#7A756E]">
                    {lang === "es"
                      ? "Te lleva a contacto seguro; no compartimos tu información fuera de este flujo."
                      : "Opens our secure contact flow — we do not share your details outside this path."}
                  </p>
                </>
              )}
              <Link
                href={buildEmpleosResultadosUrl(lang, { category: job.category })}
                className={`${EMPLEOS_LINK_MUTED} text-center`}
              >
                {lang === "es" ? "Más empleos en esta categoría" : "More jobs in this category"}
              </Link>
              <Link href={publishHref} className={`${EMPLEOS_LINK_MUTED} text-center`}>
                {lang === "es" ? "¿Eres empleador? Publica una vacante" : "Employer? Post a job"}
              </Link>
            </aside>
          </div>
        </div>

        {related.length > 0 ? (
          <section className="mt-14 sm:mt-16" aria-labelledby="rel">
            <h2 id="rel" className="text-xl font-bold tracking-tight">
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
