"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  FiBriefcase,
  FiCpu,
  FiHeart,
  FiPackage,
  FiTag,
  FiTool,
  FiTruck,
  FiCoffee,
} from "react-icons/fi";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendRouteLangToPath, resolveHubCopyLang, resolveRouteLang } from "@/app/clasificados/lib/hubUrl";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryPartnerSection,
  LeonixCategoryDiscoveryGrid,
  LeonixCategoryVisibilityStrip,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import {
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
} from "@/app/(site)/clasificados/components/categoryStandardV2/constants";
import {
  buildCategoryResultsUrl,
  categoryPublishPath,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import {
  categoryStandardDescription,
  categoryStandardSearchPlaceholder,
  categoryStandardTitle,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import { buildEmpleosResultadosUrl } from "./shared/utils/empleosListaUrl";

const JOB_CATEGORY_TILES = [
  { slug: "salud", titleEs: "Salud", titleEn: "Health", hintEs: "Cuidado y bienestar", hintEn: "Care and wellness", icon: FiHeart },
  { slug: "oficios", titleEs: "Oficios", titleEn: "Trades", hintEs: "Construcción y oficio", hintEn: "Construction and trades", icon: FiTool },
  { slug: "restaurante", titleEs: "Restaurante", titleEn: "Restaurant", hintEs: "Cocina y servicio", hintEn: "Kitchen and service", icon: FiCoffee },
  { slug: "oficina", titleEs: "Oficina", titleEn: "Office", hintEs: "Administración y soporte", hintEn: "Admin and support", icon: FiBriefcase },
  { slug: "ventas", titleEs: "Ventas", titleEn: "Sales", hintEs: "Retail y comercial", hintEn: "Retail and sales", icon: FiTag },
  { slug: "tecnologia", titleEs: "Tecnología", titleEn: "Technology", hintEs: "TI y digital", hintEn: "IT and digital", icon: FiCpu },
  { slug: "transporte", titleEs: "Transporte", titleEn: "Transport", hintEs: "Conducción y logística", hintEn: "Driving and logistics", icon: FiTruck },
  { slug: "bodega", titleEs: "Bodega", titleEn: "Warehouse", hintEs: "Almacén e inventario", hintEn: "Warehouse and inventory", icon: FiPackage },
] as const;

export function EmpleosLandingPage() {
  const sp = useSearchParams();
  const routeLang = useMemo(() => resolveRouteLang(sp?.get("lang")), [sp]);
  const lang = useMemo<Lang>(() => resolveHubCopyLang(sp?.get("lang")), [sp]);
  const resultsHref = useMemo(
    () => buildCategoryResultsUrl("empleos", routeLang as Lang),
    [routeLang],
  );
  const publishHref = useMemo(
    () => appendRouteLangToPath(categoryPublishPath("empleos"), routeLang),
    [routeLang],
  );
  const visibilityHref = `/contacto?lang=${routeLang}&categoria=empleos&surface=landing`;

  const empleosSearchForm = (
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
      browseAllLabel={lang === "es" ? "Ver empleos" : "View jobs"}
      queryPlaceholder={categoryStandardSearchPlaceholder("empleos", lang)}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publishHref}
      publishLabel={lang === "es" ? "Publicar empleo" : "Post a job"}
    />
  );

  const discoveryItems = JOB_CATEGORY_TILES.map((cat) => ({
    id: cat.slug,
    label: lang === "es" ? cat.titleEs : cat.titleEn,
    hint: lang === "es" ? cat.hintEs : cat.hintEn,
    href: buildEmpleosResultadosUrl(lang, { category: cat.slug }),
    icon: cat.icon,
  }));

  const valueBullets =
    lang === "es"
      ? [
          "Presencial, híbrido o remoto — filtra por modalidad en resultados.",
          "Categorías claras para explorar vacantes locales.",
          "Contacto directo con empleadores; sin intermediarios innecesarios.",
        ]
      : [
          "On-site, hybrid, or remote — filter by modality on results.",
          "Clear categories to explore local openings.",
          "Direct contact with employers; no unnecessary middlemen.",
        ];

  return (
    <LeonixCategoryPageShell surface="landing">
      <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
        <LeonixCategoryHeroGateway
          lang={lang as V2Lang}
          surface="landing"
          title={categoryStandardTitle("empleos", lang)}
          tagline={lang === "es" ? "Encuentra trabajo cerca de ti." : "Find work near you."}
          intro={categoryStandardDescription("empleos", lang)}
          introSecondary={
            lang === "es"
              ? "Busca por categoría, ciudad o palabra clave; en resultados filtra por modalidad y tipo de empleo."
              : "Search by category, city, or keyword; on results, filter by modality and job type."
          }
          searchSlot={empleosSearchForm}
          eyebrow={lang === "es" ? "EMPLEOS · LEONIX" : "JOBS · LEONIX"}
        />

        <main className="space-y-6 overflow-x-hidden sm:space-y-8">
          <LeonixCategoryDiscoveryGrid
            lang={lang as V2Lang}
            surface="landing"
            heading={lang === "es" ? "Explora empleos por categoría" : "Explore jobs by category"}
            subtitle={
              lang === "es"
                ? "Elige una categoría para ver vacantes en resultados."
                : "Choose a category to view openings on results."
            }
            items={discoveryItems}
          />

          <section className={LEONIX_LANDING_SECTION} aria-labelledby="empleos-value">
            <div className={LEONIX_LANDING_SECTION_PAD}>
              <h2 id="empleos-value" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
                {lang === "es" ? "Trabajo local, búsqueda clara" : "Local jobs, clear search"}
              </h2>
              <p className="mt-1 text-xs text-[#5C5346]/90">
                {lang === "es"
                  ? "Leonix conecta personas que buscan trabajo con empleadores de la comunidad."
                  : "Leonix connects job seekers with employers in the community."}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[#3D3428]">
                {valueBullets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7A1E2C]" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <LeonixCategoryVisibilityStrip
            lang={lang as V2Lang}
            surface="landing"
            eyebrow={lang === "es" ? "VISIBILIDAD PARA EMPLEADORES" : "VISIBILITY FOR EMPLOYERS"}
            title={lang === "es" ? "Haz que tu vacante tenga más visibilidad" : "Give your job posting more visibility"}
            body={
              lang === "es"
                ? "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo."
                : "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package."
            }
            ctaLabel={lang === "es" ? "Conocer opciones de visibilidad" : "Explore visibility options"}
            ctaHref={visibilityHref}
          />

          <LeonixCategoryPartnerSection
            enabled
            lang={lang as V2Lang}
            surface="landing"
            eyebrow={lang === "es" ? "EMPLEOS · EMPLEADORES" : "JOBS · EMPLOYERS"}
            title={lang === "es" ? "¿Buscas contratar?" : "Looking to hire?"}
            body={
              lang === "es"
                ? "Publica un anuncio local de empleo por $24.99 durante 30 días. Un formulario claro, vista previa real y contacto directo para encontrar trabajadores en tu comunidad."
                : "Post one local job ad for $24.99 for 30 days. A clear form, real preview, and direct contact to find workers in your community."
            }
            supportingLine={
              lang === "es"
                ? "Un anuncio · 30 días · contacto directo · fotos y hasta 4 enlaces de video"
                : "One ad · 30 days · direct contact · photos and up to 4 video links"
            }
            primaryCta={{
              label: lang === "es" ? "Publicar empleo — $24.99" : "Post a job — $24.99",
              href: publishHref,
            }}
          />
        </main>
      </div>
    </LeonixCategoryPageShell>
  );
}
