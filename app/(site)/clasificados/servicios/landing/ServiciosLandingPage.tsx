import Link from "next/link";
import { FeaturedBusinessSection } from "./FeaturedBusinessSection";
import { PublishServiceCTA } from "./PublishServiceCTA";
import { RecentServicesSection } from "./RecentServicesSection";
import { ServiceCategoriesGrid } from "./ServiceCategoriesGrid";
import { ServiciosHeroSearch } from "./ServiciosHeroSearch";
import { ServiciosQuickChips } from "./ServiciosQuickChips";
import { TrustValueStrip } from "./TrustValueStrip";
import {
  SERVICIOS_LANDING_EXPLORE_CATEGORIES,
  SERVICIOS_LANDING_FEATURED,
  SERVICIOS_LANDING_QUICK_CHIPS,
  SERVICIOS_LANDING_RECENT,
} from "./serviciosLandingSampleData";

type Lang = "es" | "en";

export function ServiciosLandingPage({ lang }: { lang: Lang }) {
  return (
    <div
      className="min-h-screen text-[#1a2f4a]"
      style={{
        backgroundColor: "#F3EDE4",
        backgroundImage: `
          radial-gradient(ellipse 90% 55% at 50% -8%, rgba(255, 255, 255, 0.65), transparent 55%),
          radial-gradient(ellipse 50% 40% at 100% 15%, rgba(59, 102, 173, 0.06), transparent 52%),
          radial-gradient(ellipse 45% 38% at 0% 85%, rgba(234, 88, 12, 0.04), transparent 50%)
        `,
      }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.035]" aria-hidden>
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <main className="relative mx-auto max-w-[1280px] px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 lg:px-8">
        <ServiciosHeroSearch lang={lang} />
        <ServiciosQuickChips lang={lang} chips={SERVICIOS_LANDING_QUICK_CHIPS} />

        <div className="mt-10 space-y-10 sm:mt-12 sm:space-y-12">
          <div className="rounded-[24px] border border-[#E8E2D8]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_20px_60px_-36px_rgba(30,52,78,0.45)] sm:p-8 md:p-10">
            <FeaturedBusinessSection lang={lang} items={SERVICIOS_LANDING_FEATURED} />
          </div>

          <div className="rounded-[24px] border border-[#E8E2D8]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_20px_60px_-36px_rgba(30,52,78,0.45)] sm:p-8 md:p-10">
            <ServiceCategoriesGrid lang={lang} categories={SERVICIOS_LANDING_EXPLORE_CATEGORIES} />
          </div>

          <div className="rounded-[24px] border border-[#E8E2D8]/90 bg-[#FFFCF7]/95 p-6 shadow-[0_20px_60px_-36px_rgba(30,52,78,0.45)] sm:p-8 md:p-10">
            <RecentServicesSection lang={lang} items={SERVICIOS_LANDING_RECENT} />
          </div>

          <TrustValueStrip lang={lang} />
          <PublishServiceCTA lang={lang} />

          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[#E8E2D8]/80 pt-10 text-[13px] text-[#64748b]"
            aria-label={lang === "en" ? "Legal and help" : "Legal y ayuda"}
          >
            <Link href={`/about?lang=${lang}`} className="transition hover:text-[#1a2f4a]">
              {lang === "en" ? "About" : "Sobre Nosotros"}
            </Link>
            <Link href={`/contact?lang=${lang}`} className="transition hover:text-[#1a2f4a]">
              {lang === "en" ? "Contact" : "Contáctanos"}
            </Link>
            <Link href={`/clasificados/reglas?lang=${lang}`} className="transition hover:text-[#1a2f4a]">
              {lang === "en" ? "Terms" : "Términos y Condiciones"}
            </Link>
            <Link href={`/clasificados?lang=${lang}#categorias`} className="transition hover:text-[#1a2f4a]">
              {lang === "en" ? "FAQ" : "Preguntas Frecuentes"}
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
