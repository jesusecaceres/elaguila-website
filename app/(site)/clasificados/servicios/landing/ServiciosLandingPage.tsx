import Image from "next/image";
import Link from "next/link";
import { selectLandingDestacadosRecientes } from "../lib/serviciosLandingBuild";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { ServiciosDestacadosSection } from "../components/ServiciosDestacadosSection";
import { PublishServiceCTA } from "./PublishServiceCTA";
import { RecentServicesSection } from "./RecentServicesSection";
import { ServiceCategoriesGrid } from "./ServiceCategoriesGrid";
import { ServiciosLandingBrowseRow } from "./ServiciosLandingBrowseRow";
import { ServiciosHeroSearch } from "./ServiciosHeroSearch";
import { ServiciosLandingQuickFilterLinks } from "./ServiciosLandingQuickFilterLinks";
import { ServiciosQuickChips } from "./ServiciosQuickChips";
import { TrustValueStrip } from "./TrustValueStrip";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { CATEGORY_STANDARD_PAGE_BG } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { SERVICIOS_LANDING_EXPLORE_CATEGORIES, SERVICIOS_LANDING_QUICK_CHIPS } from "./serviciosLandingSampleData";

type Lang = "es" | "en";

/** Page-wide whisper (same service-trade family as hero); stays behind sections so the hero image reads as the category anchor. */
const PAGE_ATMOSPHERE =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=2400&q=70";

const sectionShell =
  "rounded-3xl border border-[#D4A574]/30 bg-[#FFFAF0] shadow-[0_12px_48px_-20px_rgba(212,165,116,0.15)] ring-1 ring-[#D4A574]/10 sm:rounded-3xl";

export function ServiciosLandingPage({
  lang,
  liveRows,
}: {
  lang: Lang;
  /** Published `servicios_public_listings` rows (may be empty when DB is empty or offline). */
  liveRows: ServiciosPublicListingRow[];
}) {
  const { destacadosRows, recientesRows } = selectLandingDestacadosRecientes(liveRows, lang);
  const hasDestacados = destacadosRows.length > 0;

  return (
    <div className={`relative ${CATEGORY_STANDARD_PAGE_BG} text-[#1F241C]`}>
      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pb-24 sm:pt-8 lg:px-8">
        <CategoryStandardLandingPage
          category="servicios"
          lang={lang}
          searchAction={buildCategoryResultsUrl("servicios", lang)}
          searchSlot={<ServiciosHeroSearch lang={lang} />}
          belowHero={
            <div className="rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-4 sm:px-5">
              <ServiciosQuickChips lang={lang} chips={SERVICIOS_LANDING_QUICK_CHIPS} />
              <div className="mt-4 border-t border-[#D6C7AD]/60 pt-4">
                <ServiciosLandingQuickFilterLinks lang={lang} />
              </div>
            </div>
          }
        />

        <div className="mt-5 sm:mt-9 md:mt-11">
          <ServiciosLandingBrowseRow lang={lang} />
        </div>

        <div className="mt-10 space-y-10 sm:mt-16 sm:space-y-16 md:mt-20 md:space-y-[5.5rem] lg:mt-24">
          <div className="flex flex-col gap-10 sm:gap-16 md:gap-[5.5rem]">
            <div
              className={`${sectionShell} p-5 sm:p-9 md:p-11 lg:p-12 ${
                hasDestacados ? "order-1" : "order-3 lg:order-1"
              }`}
            >
              <ServiciosDestacadosSection lang={lang} rows={destacadosRows} id="servicios-landing-destacados" />
            </div>

            <div
              id="categorias"
              className={`scroll-mt-24 ${sectionShell} p-5 sm:p-9 md:p-11 lg:p-12 order-2`}
            >
              <ServiceCategoriesGrid lang={lang} categories={SERVICIOS_LANDING_EXPLORE_CATEGORIES} />
            </div>

            <div
              className={`${sectionShell} p-5 sm:p-9 md:p-11 lg:p-12 ${
                hasDestacados ? "order-3" : "order-1 lg:order-3"
              }`}
            >
              <RecentServicesSection lang={lang} rows={recientesRows} />
            </div>
          </div>

          <TrustValueStrip lang={lang} />
          <PublishServiceCTA lang={lang} />

          <nav
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[#dcd3c7]/90 pt-8 text-[13px] text-[#64748b] sm:pt-12"
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
