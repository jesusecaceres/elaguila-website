import Link from "next/link";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { withRentasLandingLang, type RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import { rentasCtaPrimaryClass, rentasCtaSecondaryClass } from "@/app/clasificados/rentas/rentasLandingTheme";
import {
  RENTAS_PUBLICAR_NEGOCIO,
  RENTAS_PUBLICAR_PRIVADO,
} from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";

type Props = {
  copy: RentasLandingCopy;
  lang: RentasLandingLang;
};

export function RentasLandingCategoryHeader({ copy, lang }: Props) {
  const clasificadosHref = withRentasLandingLang("/clasificados", lang);
  const landingEs = "/clasificados/rentas?lang=es";
  const landingEn = "/clasificados/rentas?lang=en";

  return (
    <header className="pb-0">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 gap-y-2">
            <nav className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5B7C99]/90">
              <Link href={clasificadosHref} className="transition hover:text-[#C45C26]">
                {copy.breadcrumbClasificados}
              </Link>
              <span className="text-[#C9B46A]" aria-hidden>
                ›
              </span>
              <span className="text-[#1E1810]">{copy.breadcrumbRentas}</span>
            </nav>
            <div
              className="flex items-center gap-1 rounded-full border border-[#C9D4E0]/80 bg-white/90 px-1.5 py-0.5 text-[11px] font-bold shadow-sm"
              role="group"
              aria-label="Language"
            >
              <Link
                href={landingEs}
                className={
                  "rounded-full px-2 py-0.5 transition " +
                  (lang === "es" ? "bg-[#E8EEF4] text-[#2C3E4D]" : "text-[#6B7280] hover:text-[#1E1810]")
                }
                hrefLang="es"
              >
                {copy.langEs}
              </Link>
              <span className="text-[#D4C4A8]/90" aria-hidden>
                |
              </span>
              <Link
                href={landingEn}
                className={
                  "rounded-full px-2 py-0.5 transition " +
                  (lang === "en" ? "bg-[#E8EEF4] text-[#2C3E4D]" : "text-[#6B7280] hover:text-[#1E1810]")
                }
                hrefLang="en"
              >
                {copy.langEn}
              </Link>
            </div>
          </div>
          <h1
            id="rentas-hero-heading"
            className="mt-4 font-serif text-[clamp(1.85rem,4.2vw,3.05rem)] font-semibold leading-[1.07] tracking-tight text-[#1E1810]"
          >
            {copy.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#2e2a24]/95 sm:text-lg">{copy.intro}</p>
        </div>
        <aside
          className="flex w-full min-w-0 flex-shrink-0 flex-col gap-3 rounded-[1.25rem] border border-[#C9D4E0]/55 bg-gradient-to-br from-white/95 via-[#FFFCF7]/92 to-[#EEF3F7]/55 p-4 shadow-[0_18px_48px_-34px_rgba(44,36,28,0.22)] ring-1 ring-white/80 sm:p-5 lg:max-w-[min(100%,26rem)]"
          aria-label={copy.publishEyebrow}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B7C99]/90">{copy.publishEyebrow}</p>
            <p className="mt-1.5 text-sm leading-snug text-[#4A4338]/92">{copy.publishHint}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-3">
            <Link
              href={withRentasLandingLang(RENTAS_PUBLICAR_PRIVADO, lang)}
              className={`${rentasCtaPrimaryClass} w-full min-w-0 flex-1 text-center`}
            >
              {copy.publishPrivado}
            </Link>
            <Link
              href={withRentasLandingLang(RENTAS_PUBLICAR_NEGOCIO, lang)}
              className={`${rentasCtaSecondaryClass} w-full min-w-0 flex-1 text-center`}
            >
              {copy.publishNegocio}
            </Link>
          </div>
        </aside>
      </div>
    </header>
  );
}
