import Link from "next/link";

export function PublishServiceCTA({ lang }: { lang: "es" | "en" }) {
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <section
      className="relative overflow-hidden rounded-[22px] border border-white/90 bg-gradient-to-br from-[#FFFCF7] via-[#faf6ef] to-[#f0e8dc]/95 px-6 py-11 shadow-[0_32px_85px_-50px_rgba(20,38,58,0.48)] ring-1 ring-[#1e3a5f]/[0.05] sm:rounded-[26px] sm:px-11 sm:py-12"
      aria-labelledby="servicios-publish-cta-heading"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#EA580C]/[0.06] blur-3xl" aria-hidden />
      <div className="relative mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-9 lg:flex-row lg:items-center">
        <div className="flex gap-5 sm:gap-6">
          <div
            className="flex h-[4.25rem] w-[4.25rem] shrink-0 items-center justify-center rounded-full border border-[#EA580C]/20 bg-white shadow-[0_10px_28px_-16px_rgba(194,65,12,0.35)]"
            aria-hidden
          >
            <svg className="h-9 w-9 text-[#EA580C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 3l7 3v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
              <path d="M9.5 12.5l2 2L15 11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 id="servicios-publish-cta-heading" className="text-[1.35rem] font-bold leading-tight text-[#142a42] sm:text-2xl">
              {lang === "en" ? "Do you offer a service?" : "¿Ofreces un servicio?"}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#4a5d6e] sm:text-[16px]">
              {lang === "en"
                ? "Reach thousands of people by publishing your showcase on Leonix — structured, bilingual-ready, and built to drive traffic to your own site and channels."
                : "Llega a miles de personas publicando tu vitrina en Leonix — estructurada, lista para bilingüe y pensada para llevar tráfico a tu web y tus redes."}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col items-stretch gap-3 lg:w-auto lg:items-end">
          <Link
            href={publishHref}
            className="inline-flex min-h-[54px] w-full min-w-[240px] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-9 text-[16px] font-bold tracking-wide text-white shadow-[0_16px_40px_-14px_rgba(194,65,12,0.55)] transition hover:brightness-[1.04] active:scale-[0.99] lg:w-auto"
          >
            {lang === "en" ? "Publish your service" : "Publica tu Servicio"}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href={`/clasificados/servicios/resultados?lang=${lang}`}
            className="text-center text-[13px] font-semibold text-[#3B66AD] underline-offset-4 hover:underline lg:text-right"
          >
            {lang === "en" ? "Preview how listings look in results" : "Ver cómo se ven los anuncios en resultados"}
          </Link>
        </div>
      </div>
    </section>
  );
}
