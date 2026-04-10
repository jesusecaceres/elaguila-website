import Image from "next/image";

const HERO_BACKDROP =
  "https://images.unsplash.com/photo-1521737711867-e3b973350f5f?auto=format&fit=crop&w=2400&q=78";

type Lang = "es" | "en";

const copy: Record<
  Lang,
  {
    sub: string;
    phService: string;
    phLocation: string;
    search: string;
  }
> = {
  es: {
    sub: "Busca profesionales de confianza para cualquier necesidad.",
    phService: "¿Qué servicio buscas?",
    phLocation: "Ciudad o Código Postal",
    search: "Buscar",
  },
  en: {
    sub: "Trusted professionals for home, family, and business — near you, with clear presentation and direct contact.",
    phService: "What service are you looking for?",
    phLocation: "City or ZIP",
    search: "Search",
  },
};

export function ServiciosHeroSearch({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const resultsAction = "/clasificados/servicios/resultados";

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-white/70 bg-[#FAF6EF]/90 shadow-[0_24px_64px_-28px_rgba(45,62,82,0.28)] sm:rounded-[24px]">
      <div className="absolute inset-0">
        <Image
          src={HERO_BACKDROP}
          alt=""
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-[center_38%] opacity-[0.42] blur-[2px] scale-[1.02]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#FBF8F2]/95 via-[#F7F1E8]/92 to-[#F3EDE4]/96"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#E8EDF4]/50 via-transparent to-[#F0E8DC]/45" aria-hidden />
      </div>

      <div className="relative z-10 px-4 py-10 sm:px-8 sm:py-12 md:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance font-serif text-[1.85rem] font-bold leading-[1.12] tracking-tight text-[#1a2f4a] sm:text-4xl md:text-[2.65rem]">
            {lang === "en" ? (
              <>
                Find local services <span className="text-[#D97706]">near you</span>
              </>
            ) : (
              <>
                Encuentra servicios locales <span className="text-[#C2410C]">cerca de ti</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-[15px] leading-relaxed text-[#3d4f62]/95 sm:text-[17px]">
            {t.sub}
          </p>
        </div>

        <form
          action={resultsAction}
          method="get"
          role="search"
          className="mx-auto mt-9 w-full max-w-[880px]"
        >
          <input type="hidden" name="lang" value={lang} />
          <div className="flex flex-col gap-0 overflow-hidden rounded-[20px] border border-white/90 bg-white/95 shadow-[0_16px_48px_-22px_rgba(30,52,78,0.35)] backdrop-blur-sm sm:flex-row sm:items-stretch sm:rounded-full sm:rounded-[999px]">
            <label className="flex min-h-[56px] min-w-0 flex-1 cursor-text items-center gap-3 border-b border-[#E8E2D8] px-4 sm:border-b-0 sm:border-r sm:pl-6 sm:pr-3">
              <span className="shrink-0 text-[#4A6678]" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                name="q"
                type="search"
                autoComplete="off"
                placeholder={t.phService}
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-[#1a2f4a] outline-none placeholder:text-[#7a8a9c]"
              />
            </label>
            <label className="flex min-h-[56px] min-w-0 flex-1 cursor-text items-center gap-3 px-4 sm:px-3">
              <span className="shrink-0 text-[#4A6678]" aria-hidden>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="11" r="2.5" />
                </svg>
              </span>
              <input
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder={t.phLocation}
                className="min-w-0 flex-1 bg-transparent py-3 text-[15px] text-[#1a2f4a] outline-none placeholder:text-[#7a8a9c]"
              />
            </label>
            <div className="flex shrink-0 p-2 sm:pr-2 sm:pl-0">
              <button
                type="submit"
                className="flex min-h-[48px] w-full min-w-[120px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#EA580C] to-[#C2410C] px-6 text-[15px] font-bold tracking-wide text-white shadow-[0_10px_28px_-8px_rgba(194,65,12,0.55)] transition hover:brightness-[1.03] active:scale-[0.99] sm:w-auto sm:rounded-full"
              >
                {t.search}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
