"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { navCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { selectLandingDestacadosRecientes } from "../lib/serviciosLandingBuild";
import type { ServiciosPublicListingRow } from "../lib/serviciosPublicListingsServer";
import { ServiciosDestacadosSection } from "../components/ServiciosDestacadosSection";
import { PublishServiceCTA } from "./PublishServiceCTA";
import { RecentServicesSection } from "./RecentServicesSection";
import { ServiceCategoriesGrid } from "./ServiceCategoriesGrid";
import { ServiciosQuickChips } from "./ServiciosQuickChips";
import { ServiciosCompactSearchCanvas } from "./ServiciosCompactSearchCanvas";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryPartnerSection,
  LeonixCategoryShortcutSection,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import { CategoryVisibilityCta } from "@/app/(site)/clasificados/components/categoryStandard/CategoryVisibilityCta";
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { SERVICIOS_LANDING_EXPLORE_CATEGORIES, SERVICIOS_LANDING_QUICK_CHIPS } from "./serviciosLandingSampleData";

type Lang = "es" | "en";

const LANDING_QUICK_CHIP_IDS = new Set([
  "limpieza",
  "jardineria",
  "construccion",
  "mecanica",
  "belleza",
  "eventos",
  "emergency",
  "lang_es",
  "licensed",
  "same_day",
]);

const sectionShell =
  "rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)]";

export function ServiciosLandingPage({
  liveRows,
}: {
  /** Published `servicios_public_listings` rows (may be empty when DB is empty or offline). */
  liveRows: ServiciosPublicListingRow[];
}) {
  const sp = useSearchParams();
  const routeLang = normalizeLang(sp?.get("lang"));
  const lang = navCopyLang(routeLang) as Lang;
  const { destacadosRows, recientesRows } = selectLandingDestacadosRecientes(liveRows, lang);
  const hasDestacados = destacadosRows.length > 0;
  const landingChips = SERVICIOS_LANDING_QUICK_CHIPS.filter((c) => LANDING_QUICK_CHIP_IDS.has(c.id));
  const resultsHref = buildCategoryResultsUrl("servicios", routeLang as Lang);
  const publishHref = replaceLangInHref("/clasificados/publicar/servicios/checkpoint", routeLang);

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

  const serviciosSearchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface="landing"
      query=""
      city=""
      state=""
      zip=""
      country=""
      onQuery={() => {}}
      onCity={() => {}}
      onState={() => {}}
      onZip={() => {}}
      onCountry={() => {}}
      onSearch={() => {}}
      onOpenFilters={() => {}}
      browseAllHref={resultsHref}
      browseAllLabel={copy.browse}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publishHref}
      publishLabel={copy.publish}
    />
  );

  const quickChips = <ServiciosQuickChips lang={lang} chips={landingChips} variant="standard" />;

  return (
    <LeonixCategoryPageShell surface="landing">
      <LeonixCategoryHeroGateway
        lang={lang as V2Lang}
        surface="landing"
        title={lang === "es" ? "Servicios" : "Services"}
        tagline=""
        intro={lang === "es" ? "Encuentra servicios confiables cerca de ti." : "Find reliable services near you."}
        introSecondary=""
        searchSlot={serviciosSearchForm}
        eyebrow={copy.eyebrow}
      />
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
      <div className="space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className={`${sectionShell} p-3.5 sm:p-4 order-2`}>
            <RecentServicesSection lang={lang} rows={recientesRows} />
          </div>

          <div id="categorias" className={`scroll-mt-24 ${sectionShell} p-3.5 sm:p-4 order-3`}>
            <ServiceCategoriesGrid lang={lang} categories={SERVICIOS_LANDING_EXPLORE_CATEGORIES.slice(0, 8)} />
          </div>

          {hasDestacados ? (
            <div className={`${sectionShell} p-3.5 sm:p-4 order-4`}>
              <ServiciosDestacadosSection
                lang={lang}
                rows={destacadosRows}
                id="servicios-landing-destacados"
                showEmptyState={false}
              />
            </div>
          ) : null}
        </div>

        <CategoryVisibilityCta lang={lang} category="servicios" surface="landing" compact />
        <PublishServiceCTA lang={lang} routeLang={routeLang} />

        <nav
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-[#D6C7AD]/80 pt-8 text-[13px] text-[#5C5346] sm:pt-10"
          aria-label={lang === "en" ? "Legal and help" : "Legal y ayuda"}
        >
          <Link href={replaceLangInHref("/about", routeLang)} className="transition hover:text-[#7A1E2C]">
            {lang === "en" ? "About" : "Sobre Nosotros"}
          </Link>
          <Link href={replaceLangInHref("/contact", routeLang)} className="transition hover:text-[#7A1E2C]">
            {lang === "en" ? "Contact" : "Contáctanos"}
          </Link>
          <Link href={replaceLangInHref("/clasificados/reglas", routeLang)} className="transition hover:text-[#7A1E2C]">
            {lang === "en" ? "Terms" : "Términos y Condiciones"}
          </Link>
          <Link href={`${replaceLangInHref("/clasificados", routeLang)}#categorias`} className="transition hover:text-[#7A1E2C]">
            {lang === "en" ? "FAQ" : "Preguntas Frecuentes"}
          </Link>
        </nav>
      </div>
      </main>
    </LeonixCategoryPageShell>
  );
}
