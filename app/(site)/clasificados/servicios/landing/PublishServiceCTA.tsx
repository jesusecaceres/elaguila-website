import Link from "next/link";

export function PublishServiceCTA({ lang }: { lang: "es" | "en" }) {
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <section
      className="relative overflow-hidden rounded-[18px] border border-white/90 bg-gradient-to-br from-[#FFFCF7] via-[#faf6ef] to-[#f0e8dc]/95 px-4 py-6 shadow-[0_32px_85px_-50px_rgba(20,38,58,0.48)] ring-1 ring-[#1e3a5f]/[0.05] sm:rounded-[22px] sm:px-7 sm:py-7"
      aria-labelledby="servicios-publish-cta-heading"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#EA580C]/[0.06] blur-3xl" aria-hidden />
      <div className="relative mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-5 lg:flex-row lg:items-center">
        <div className="min-w-0 flex gap-3 sm:gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#EA580C]/20 bg-white shadow-[0_10px_28px_-16px_rgba(194,65,12,0.35)] sm:h-14 sm:w-14"
            aria-hidden
          >
            <svg className="h-7 w-7 text-[#EA580C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 3l7 3v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
              <path d="M9.5 12.5l2 2L15 11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 id="servicios-publish-cta-heading" className="text-[1.2rem] font-bold leading-tight text-[#142a42] sm:text-2xl">
              {lang === "en" ? "Offer a service?" : "¿Ofreces un servicio?"}
            </h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#4a5d6e]">
              {lang === "en"
                ? "Put your business in front of people actively searching — with a profile worthy of your brand."
                : "Pon tu negocio frente a quien ya está buscando — con un perfil a la altura de tu marca."}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col items-stretch gap-2.5 sm:gap-3 lg:w-auto lg:items-end">
          <Link
            href={publishHref}
            className="inline-flex min-h-[48px] w-full min-w-[240px] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-7 text-[15px] font-bold tracking-wide text-white shadow-[0_16px_40px_-14px_rgba(194,65,12,0.55)] transition hover:brightness-[1.04] active:scale-[0.99] sm:min-h-[54px] sm:px-9 sm:text-[16px] lg:w-auto"
          >
            {lang === "en" ? "Publish your service" : "Publica tu servicio"}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href={`/clasificados/servicios/results?lang=${lang}`}
            className="text-center text-[13px] font-semibold text-[#3B66AD] underline-offset-4 hover:underline lg:text-right"
          >
            {lang === "en" ? "Preview how listings look in results" : "Ver cómo se ven los anuncios en resultados"}
          </Link>
        </div>
      </div>
    </section>
  );
}
