import Image from "next/image";

/** Consultation / professional exchange — low-contrast, service-world (not retail). */
const HERO_BACKDROP =
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=2400&q=80";

type Lang = "es" | "en";

const copy: Record<
  Lang,
  {
    sub: string;
    phService: string;
    phLocation: string;
    search: string;
    continuity: string;
  }
> = {
  es: {
    sub: "Busca profesionales de confianza para cualquier necesidad.",
    phService: "¿Qué servicio buscas?",
    phLocation: "Ciudad o Código Postal",
    search: "Buscar",
    continuity:
      "Lo que escribas aquí llega a Resultados con los mismos campos: podrás afinar giro, tipo de anunciante y contacto.",
  },
  en: {
    sub: "Trusted professionals for home, family, and business — clear profiles and direct contact.",
    phService: "What service are you looking for?",
    phLocation: "City or ZIP",
    search: "Search",
    continuity:
      "Your keywords and area carry into Results unchanged — then you can refine trade, seller type, and contact options.",
  },
};

export function ServiciosHeroSearch({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const resultsAction = "/clasificados/servicios/resultados";

  return (
    <div className="relative min-h-[min(52vh,620px)] overflow-hidden sm:min-h-[min(56vh,680px)] lg:min-h-[min(58vh,720px)]">
      <div className="absolute inset-0">
        <Image
          src={HERO_BACKDROP}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_32%] opacity-[0.38] saturate-[0.85] sm:opacity-[0.42]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#FBF7F0]/[0.97] via-[#F8F3EA]/[0.94] to-[#F3EDE4]/[0.98]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#E8EDF4]/[0.45] via-transparent to-[#F4E8D8]/[0.35]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,255,255,0.55),transparent_58%)]" aria-hidden />
      </div>

      <div className="relative z-10 flex min-h-[inherit] flex-col justify-center px-5 py-14 sm:px-10 sm:py-16 md:px-12 md:py-20 lg:px-14 lg:py-24">
        <div className="mx-auto w-full max-w-[880px] text-center">
          <h1 className="text-balance font-serif text-[2.1rem] font-bold leading-[1.08] tracking-tight text-[#142a42] sm:text-[2.85rem] md:text-[3.45rem] lg:text-[3.85rem]">
            {lang === "en" ? (
              <>
                Find local services <span className="text-[#C2410C]">near you</span>
              </>
            ) : (
              <>
                Encuentra servicios locales <span className="text-[#C2410C]">cerca de ti</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-[#3d4f62] sm:mt-6 sm:text-lg md:text-xl">
            {t.sub}
          </p>
        </div>

        <form
          action={resultsAction}
          method="get"
          role="search"
          aria-describedby="servicios-search-hint"
          className="mx-auto mt-10 w-full max-w-[920px] sm:mt-12 md:mt-14"
        >
          <p id="servicios-search-hint" className="sr-only">
            {lang === "en"
              ? "Submits your keywords and location to the Servicios results page where you can refine filters."
              : "Envía tu búsqueda y ubicación a la página de resultados de Servicios, donde podrás afinar filtros."}
          </p>
          <input type="hidden" name="lang" value={lang} />
          <div className="flex flex-col gap-0 overflow-hidden rounded-[22px] border border-white/95 bg-white/[0.97] shadow-[0_22px_56px_-28px_rgba(25,45,70,0.42),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-md sm:flex-row sm:items-stretch sm:rounded-full">
            <label className="flex min-h-[58px] min-w-0 flex-1 cursor-text items-center gap-3 border-b border-[#E5DED4]/90 px-4 sm:min-h-[60px] sm:border-b-0 sm:border-r sm:pl-7 sm:pr-4">
              <span className="shrink-0 text-[#3d5a73]" aria-hidden>
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                name="q"
                type="search"
                autoComplete="off"
                placeholder={t.phService}
                className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-[#142a42] outline-none placeholder:text-[#6b7c8c] sm:text-[15px]"
              />
            </label>
            <label className="flex min-h-[58px] min-w-0 flex-1 cursor-text items-center gap-3 px-4 sm:min-h-[60px] sm:px-4">
              <span className="shrink-0 text-[#3d5a73]" aria-hidden>
                <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
              </span>
              <input
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder={t.phLocation}
                className="min-w-0 flex-1 bg-transparent py-3.5 text-[16px] text-[#142a42] outline-none placeholder:text-[#6b7c8c] sm:text-[15px]"
              />
            </label>
            <div className="flex shrink-0 p-2.5 sm:p-2 sm:pr-3 sm:pl-0">
              <button
                type="submit"
                className="flex min-h-[52px] w-full min-w-[132px] items-center justify-center rounded-[16px] bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-7 text-[16px] font-bold tracking-wide text-white shadow-[0_12px_32px_-10px_rgba(194,65,12,0.55)] transition hover:brightness-[1.04] active:scale-[0.99] sm:w-auto sm:rounded-full sm:text-[15px]"
              >
                {t.search}
              </button>
            </div>
          </div>
        </form>
        <p className="mx-auto mt-6 max-w-[640px] text-center text-[12px] leading-relaxed text-[#5a6b7c] sm:mt-7 sm:text-[13px]">
          {t.continuity}
        </p>
      </div>
    </div>
  );
}
