import Link from "next/link";
import { selectLandingDestacadosRecientes } from "../lib/serviciosLandingBuild";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { ServiciosDestacadosSection } from "../components/ServiciosDestacadosSection";
import { PublishServiceCTA } from "./PublishServiceCTA";
import { RecentServicesSection } from "./RecentServicesSection";
import { ServiceCategoriesGrid } from "./ServiceCategoriesGrid";
import { ServiciosQuickChips } from "./ServiciosQuickChips";
import { TrustValueStrip } from "./TrustValueStrip";
import { CategoryStandardLandingPage } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardLandingPage";
import { CATEGORY_STANDARD_PAGE_BG } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { SERVICIOS_LANDING_EXPLORE_CATEGORIES, SERVICIOS_LANDING_QUICK_CHIPS } from "./serviciosLandingSampleData";

type Lang = "es" | "en";

const LANDING_QUICK_CHIP_IDS = new Set([
  "web",
  "limpieza",
  "plomeria",
  "electricista",
  "jardineria",
  "mecanica",
  "reparaciones",
  "consultoria",
]);

const sectionShell =
  "rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)]";

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
  const landingChips = SERVICIOS_LANDING_QUICK_CHIPS.filter((c) => LANDING_QUICK_CHIP_IDS.has(c.id));

  const copy = {
    es: {
      eyebrow: "SERVICIOS LOCALES · LEONIX",
      publish: "Publicar en Servicios",
      browse: "Ver todos los anuncios",
    },
    en: {
      eyebrow: "LOCAL SERVICES · LEONIX",
      publish: "Post in Services",
      browse: "View all listings",
    },
  }[lang];

  const quickChips = <ServiciosQuickChips lang={lang} chips={landingChips} variant="standard" />;

  return (
    <div className={`relative ${CATEGORY_STANDARD_PAGE_BG} text-[#1F241C]`}>
      <CategoryStandardLandingPage
        category="servicios"
        lang={lang}
        eyebrow={copy.eyebrow}
        publishLabel={copy.publish}
        browseLabel={copy.browse}
        searchAction={buildCategoryResultsUrl("servicios", lang)}
        searchChips={quickChips}
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mt-8 space-y-8 sm:mt-10 sm:space-y-10">
          <div className="flex flex-col gap-8 sm:gap-10">
            <div
              className={`${sectionShell} p-5 sm:p-7 ${hasDestacados ? "order-1" : "order-3 lg:order-1"}`}
            >
              <ServiciosDestacadosSection lang={lang} rows={destacadosRows} id="servicios-landing-destacados" />
            </div>

            <div id="categorias" className={`scroll-mt-24 ${sectionShell} p-5 sm:p-7 order-2`}>
              <ServiceCategoriesGrid lang={lang} categories={SERVICIOS_LANDING_EXPLORE_CATEGORIES} />
            </div>

            <div className={`${sectionShell} p-5 sm:p-7 ${hasDestacados ? "order-3" : "order-1 lg:order-3"}`}>
              <RecentServicesSection lang={lang} rows={recientesRows} />
            </div>
          </div>

          <TrustValueStrip lang={lang} />
          <PublishServiceCTA lang={lang} />

          <nav
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[#D6C7AD]/80 pt-8 text-[13px] text-[#5C5346] sm:pt-10"
            aria-label={lang === "en" ? "Legal and help" : "Legal y ayuda"}
          >
            <Link href={`/about?lang=${lang}`} className="transition hover:text-[#7A1E2C]">
              {lang === "en" ? "About" : "Sobre Nosotros"}
            </Link>
            <Link href={`/contact?lang=${lang}`} className="transition hover:text-[#7A1E2C]">
              {lang === "en" ? "Contact" : "Contáctanos"}
            </Link>
            <Link href={`/clasificados/reglas?lang=${lang}`} className="transition hover:text-[#7A1E2C]">
              {lang === "en" ? "Terms" : "Términos y Condiciones"}
            </Link>
            <Link href={`/clasificados?lang=${lang}#categorias`} className="transition hover:text-[#7A1E2C]">
              {lang === "en" ? "FAQ" : "Preguntas Frecuentes"}
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
