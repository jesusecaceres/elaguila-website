import Link from "next/link";

export function PublishServiceCTA({ lang }: { lang: "es" | "en" }) {
  const publishHref = `/clasificados/publicar/servicios?lang=${lang}`;

  const bullets =
    lang === "en"
      ? [
          "Premium layout designed to convert — not a plain text dump.",
          "Bilingual-ready fields so you reach more households in one listing.",
          "Direct phone, WhatsApp, and web exits — Leonix is your traffic bridge, not a walled garden.",
        ]
      : [
          "Maquetación premium pensada para convertir — no un bloque de texto plano.",
          "Campos listos para bilingüe y llegar a más hogares con un solo anuncio.",
          "Salidas directas a teléfono, WhatsApp y web: Leonix es tu puente de tráfico, no una isla cerrada.",
        ];

  return (
    <section
      className="relative overflow-hidden rounded-[18px] border border-white/90 bg-gradient-to-br from-[#FFFCF7] via-[#faf6ef] to-[#f0e8dc]/95 px-4 py-8 shadow-[0_32px_85px_-50px_rgba(20,38,58,0.48)] ring-1 ring-[#1e3a5f]/[0.05] sm:rounded-[26px] sm:px-11 sm:py-12"
      aria-labelledby="servicios-publish-cta-heading"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#EA580C]/[0.06] blur-3xl" aria-hidden />
      <div className="relative mx-auto flex max-w-[1080px] flex-col items-start justify-between gap-6 sm:gap-9 lg:flex-row lg:items-center">
        <div className="min-w-0 flex gap-4 sm:gap-6">
          <div
            className="flex h-[3.65rem] w-[3.65rem] shrink-0 items-center justify-center rounded-full border border-[#EA580C]/20 bg-white shadow-[0_10px_28px_-16px_rgba(194,65,12,0.35)] sm:h-[4.25rem] sm:w-[4.25rem]"
            aria-hidden
          >
            <svg className="h-8 w-8 text-[#EA580C] sm:h-9 sm:w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 3l7 3v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" strokeLinejoin="round" />
              <path d="M9.5 12.5l2 2L15 11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h2 id="servicios-publish-cta-heading" className="text-[1.2rem] font-bold leading-tight text-[#142a42] sm:text-2xl">
              {lang === "en" ? "Offer a service?" : "¿Ofreces un servicio?"}
            </h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#4a5d6e] sm:mt-3 sm:text-[16px]">
              {lang === "en"
                ? "Put your business in front of people actively searching — with a profile worthy of your brand."
                : "Pon tu negocio frente a quien ya está buscando — con un perfil a la altura de tu marca."}
            </p>
            <ul className="mt-3 max-w-xl list-none space-y-2 text-[13px] leading-snug text-[#3d4f62] sm:mt-4 sm:space-y-2.5 sm:text-[14px]">
              {bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#EA580C]" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
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
