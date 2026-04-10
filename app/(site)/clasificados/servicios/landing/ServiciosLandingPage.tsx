import Image from "next/image";
import Link from "next/link";
import { FeaturedBusinessSection } from "./FeaturedBusinessSection";
import { PublishServiceCTA } from "./PublishServiceCTA";
import { RecentServicesSection } from "./RecentServicesSection";
import { ServiceCategoriesGrid } from "./ServiceCategoriesGrid";
import { ServiciosLandingBrowseRow } from "./ServiciosLandingBrowseRow";
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

/** Page-wide whisper (same service-trade family as hero); stays behind sections so the hero image reads as the category anchor. */
const PAGE_ATMOSPHERE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2400&q=70";

const sectionShell =
  "rounded-[22px] border border-white/90 bg-[#FFFCF7] shadow-[0_28px_80px_-48px_rgba(20,38,58,0.45)] ring-1 ring-[#1e3a5f]/[0.05] sm:rounded-[26px]";

export function ServiciosLandingPage({ lang }: { lang: Lang }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-[#142a42]">
      {/* Quiet service-world atmosphere (global); stays behind content */}
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <Image
          src={PAGE_ATMOSPHERE}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[center_42%] opacity-[0.07] blur-[2px] saturate-[0.72] sm:opacity-[0.08]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#f5efe6] via-[#f3ebe2]/[0.97] to-[#efe6db]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,rgba(255,255,255,0.55),transparent_55%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#ebe3d6]/95"
          aria-hidden
        />
      </div>

      <main className="relative mx-auto w-full max-w-[min(100%,1440px)] px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 lg:px-10 lg:pb-28 xl:px-12 2xl:px-14">
        {/* Hero + chips: one composed entry block */}
        <section
          id="servicios-hero"
          className={`overflow-hidden ${sectionShell} shadow-[0_22px_72px_-44px_rgba(20,38,58,0.32)]`}
          aria-label={lang === "en" ? "Search services" : "Buscar servicios"}
        >
          <ServiciosHeroSearch lang={lang} />
          <div className="relative border-t border-[#e8e0d4]/70 bg-gradient-to-b from-[#faf6f0]/96 to-[#f4ebe3]/97 px-3 py-5 sm:px-8 sm:py-7 md:px-10 md:py-8">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
              aria-hidden
            />
            <ServiciosQuickChips lang={lang} chips={SERVICIOS_LANDING_QUICK_CHIPS} />
          </div>
        </section>

        <div className="mt-7 sm:mt-9 md:mt-11">
          <ServiciosLandingBrowseRow lang={lang} />
        </div>

        <div className="mt-16 space-y-16 sm:mt-20 sm:space-y-20 md:mt-24 md:space-y-[5.5rem]">
          <div className={`${sectionShell} p-7 sm:p-9 md:p-11 lg:p-12`}>
            <FeaturedBusinessSection lang={lang} items={SERVICIOS_LANDING_FEATURED} />
          </div>

          <div
            id="categorias"
            className={`scroll-mt-24 ${sectionShell} p-7 sm:p-9 md:p-11 lg:p-12`}
          >
            <ServiceCategoriesGrid lang={lang} categories={SERVICIOS_LANDING_EXPLORE_CATEGORIES} />
          </div>

          <div className={`${sectionShell} p-7 sm:p-9 md:p-11 lg:p-12`}>
            <RecentServicesSection lang={lang} items={SERVICIOS_LANDING_RECENT} />
          </div>

          <TrustValueStrip lang={lang} />
          <PublishServiceCTA lang={lang} />

          <nav
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[#dcd3c7]/90 pt-12 text-[13px] text-[#64748b]"
            aria-label={lang === "en" ? "Legal and help" : "Legal y ayuda"}
          >
            <Link href={`/about?lang=${lang}`} className="transition hover:text-[#142a42]">
              {lang === "en" ? "About" : "Sobre Nosotros"}
            </Link>
            <Link href={`/contact?lang=${lang}`} className="transition hover:text-[#142a42]">
              {lang === "en" ? "Contact" : "Contáctanos"}
            </Link>
            <Link href={`/clasificados/reglas?lang=${lang}`} className="transition hover:text-[#142a42]">
              {lang === "en" ? "Terms" : "Términos y Condiciones"}
            </Link>
            <Link href={`/clasificados?lang=${lang}#categorias`} className="transition hover:text-[#142a42]">
              {lang === "en" ? "FAQ" : "Preguntas Frecuentes"}
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
