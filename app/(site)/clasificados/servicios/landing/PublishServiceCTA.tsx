import Link from "next/link";

export function PublishServiceCTA({ lang }: { lang: "es" | "en" }) {
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  return (
    <section
      className="relative overflow-hidden rounded-[20px] border border-[#E8E2D8] bg-gradient-to-br from-[#FFFCF7] via-[#FAF6EF] to-[#F0E8DC]/90 px-6 py-10 shadow-[0_20px_50px_-28px_rgba(30,52,78,0.38)] sm:px-10 sm:py-12"
      aria-labelledby="servicios-publish-cta-heading"
    >
      <div className="mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="flex gap-5">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#EA580C]/25 bg-white shadow-sm"
            aria-hidden
          >
            <svg className="h-8 w-8 text-[#EA580C]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 3l7 3v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
              <path d="M9.5 12.5l2 2L15 11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 id="servicios-publish-cta-heading" className="text-xl font-bold text-[#1a2f4a] sm:text-2xl">
              {lang === "en" ? "Do you offer a service?" : "¿Ofreces un servicio?"}
            </h2>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#5b6b7b]">
              {lang === "en"
                ? "Reach thousands of people by publishing your showcase on Leonix — structured, bilingual-ready, and built to drive traffic to your own site and channels."
                : "Llega a miles de personas publicando tu vitrina en Leonix — estructurada, lista para bilingüe y pensada para llevar tráfico a tu web y tus redes."}
            </p>
          </div>
        </div>
        <Link
          href={publishHref}
          className="inline-flex min-h-[52px] w-full min-w-[220px] items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-8 text-[15px] font-bold tracking-wide text-white shadow-[0_14px_36px_-10px_rgba(194,65,12,0.55)] transition hover:brightness-[1.03] active:scale-[0.99] lg:w-auto"
        >
          {lang === "en" ? "Publish your service" : "Publica tu Servicio"}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
