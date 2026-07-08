"use client";

import Link from "next/link";
import { navCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { useSearchParams } from "next/navigation";
import { buildEnVentaResultsUrl } from "./shared/constants/enVentaResultsRoutes";
import { EN_VENTA_DEPARTMENTS } from "./taxonomy/categories";
import type { EnVentaHubLandingResolved } from "@/app/lib/clasificados/mergeClasificadosCategoryContent";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryCta,
  LeonixCategoryDiscoveryGrid,
  LeonixCategoryShortcutSection,
  LeonixCategoryVisibilityStrip,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import {
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
} from "@/app/(site)/clasificados/components/categoryStandardV2/constants";
import {
  categoryStandardSearchPlaceholder,
  categoryStandardTitle,
  categoryStandardDescription,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardTheme";
import {
  FiActivity,
  FiDollarSign,
  FiGift,
  FiHeart,
  FiHome,
  FiLayers,
  FiMapPin,
  FiMoreHorizontal,
  FiShoppingBag,
  FiSmartphone,
  FiTool,
  FiTruck,
} from "react-icons/fi";

type Lang = "es" | "en";

const DISCOVERY_DEPT_KEYS = [
  "electronicos",
  "hogar",
  "muebles",
  "ropa-accesorios",
  "deportes",
  "bebes-ninos",
  "herramientas",
  "otros",
] as const;

const DISCOVERY_ICONS: Record<(typeof DISCOVERY_DEPT_KEYS)[number], React.ComponentType<{ className?: string }>> = {
  electronicos: FiSmartphone,
  hogar: FiHome,
  muebles: FiLayers,
  "ropa-accesorios": FiShoppingBag,
  deportes: FiActivity,
  "bebes-ninos": FiHeart,
  herramientas: FiTool,
  otros: FiMoreHorizontal,
};

export function EnVentaHubPageClient({ hub }: { hub: EnVentaHubLandingResolved }) {
  const sp = useSearchParams();
  const routeLang = normalizeLang(sp?.get("lang"));
  const lang: Lang = navCopyLang(routeLang);

  const publishHref = replaceLangInHref("/clasificados/publicar/en-venta", routeLang);
  const allListingsHref = buildEnVentaResultsUrl(routeLang as Lang);
  const visibilityHref = `/contacto?lang=${routeLang}&categoria=en-venta&surface=landing`;
  const t = hub;

  const enVentaSearchForm = (
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
      browseAllHref={allListingsHref}
      browseAllLabel={t.lista}
      queryPlaceholder={categoryStandardSearchPlaceholder("en-venta", lang)}
      searchButtonLabel={t.search}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publishHref}
      publishLabel={t.publish}
    />
  );

  const discoveryItems = DISCOVERY_DEPT_KEYS.map((key) => {
    const dept = EN_VENTA_DEPARTMENTS.find((d) => d.key === key)!;
    return {
      id: key,
      label: dept.label[lang],
      hint: dept.browseHint[lang],
      href: buildEnVentaResultsUrl(routeLang as Lang, { evDept: key }),
      icon: DISCOVERY_ICONS[key],
    };
  });

  const buyerShortcutChips = [
    {
      id: "free",
      label: lang === "es" ? "Gratis" : "Free",
      href: buildEnVentaResultsUrl(routeLang as Lang, { free: "1" }),
      icon: FiGift,
    },
    {
      id: "under50",
      label: lang === "es" ? "Menos de $50" : "Under $50",
      href: buildEnVentaResultsUrl(routeLang as Lang, { priceMax: "50" }),
      icon: FiDollarSign,
    },
    {
      id: "pickup",
      label: lang === "es" ? "Recogida" : "Pickup",
      href: buildEnVentaResultsUrl(routeLang as Lang, { pickup: "1" }),
      icon: FiMapPin,
    },
    {
      id: "ship",
      label: lang === "es" ? "Envío" : "Shipping",
      href: buildEnVentaResultsUrl(routeLang as Lang, { ship: "1" }),
      icon: FiTruck,
    },
  ];

  return (
    <LeonixCategoryPageShell surface="landing">
      <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
        <LeonixCategoryHeroGateway
          lang={lang as V2Lang}
          surface="landing"
          title={categoryStandardTitle("en-venta", lang)}
          tagline={t.premiumTagline}
          intro={categoryStandardDescription("en-venta", lang)}
          introSecondary={t.handoff}
          searchSlot={enVentaSearchForm}
          eyebrow={t.badge}
        />

        <main className="space-y-6 overflow-x-hidden sm:space-y-8">
          <LeonixCategoryDiscoveryGrid
            lang={lang as V2Lang}
            surface="landing"
            heading={t.categoriesTitle}
            subtitle={
              lang === "es"
                ? "Elige una categoría para explorar anuncios locales."
                : "Choose a category to explore local listings."
            }
            items={discoveryItems}
          />

          <LeonixCategoryShortcutSection
            lang={lang as V2Lang}
            surface="landing"
            title={lang === "es" ? "Atajos para compradores" : "Buyer shortcuts"}
            subtitle={
              lang === "es"
                ? "Filtros rápidos para encontrar lo que buscas."
                : "Quick filters to find what you need."
            }
            variant="practical"
            chips={buyerShortcutChips}
          />

          <LeonixCategoryVisibilityStrip
            lang={lang as V2Lang}
            surface="landing"
            eyebrow={lang === "es" ? "VISIBILIDAD PARA TU ANUNCIO" : "VISIBILITY FOR YOUR LISTING"}
            title={lang === "es" ? "Haz que tu artículo tenga más visibilidad" : "Give your listing more visibility"}
            body={
              lang === "es"
                ? "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo."
                : "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package."
            }
            ctaLabel={lang === "es" ? "Conocer opciones de visibilidad" : "Explore visibility options"}
            ctaHref={visibilityHref}
          />

          <section className={LEONIX_LANDING_SECTION} aria-label={lang === "es" ? "Confianza y seguridad" : "Trust and safety"}>
            <div className={LEONIX_LANDING_SECTION_PAD}>
              <h2 className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
                {lang === "es" ? "Compra con confianza" : "Shop with confidence"}
              </h2>
              <p className="mt-1 text-xs text-[#5C5346]/90">{t.trust}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-6">
                {[
                  { title: t.trust1Title, sub: t.trust1Sub },
                  { title: t.trust2Title, sub: t.trust2Sub },
                  { title: t.trust3Title, sub: t.trust3Sub },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-4 shadow-[0_8px_26px_-18px_rgba(42,36,22,0.14)]"
                  >
                    <h3 className="text-sm font-bold text-[#2A4536] sm:text-[15px]">{card.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#5C5346] sm:text-sm">{card.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={LEONIX_LANDING_SECTION} aria-labelledby="enventa-seller-cta">
            <div className={`${LEONIX_LANDING_SECTION_PAD} flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`}>
              <div className="min-w-0 max-w-xl">
                <h2 id="enventa-seller-cta" className="font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
                  {t.bottomSellTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.bottomSellSub}</p>
              </div>
              <LeonixCategoryCta href={publishHref} variant="primary" className="shrink-0 sm:min-w-[12rem]">
                {t.bottomSellCta}
              </LeonixCategoryCta>
            </div>
          </section>

          {process.env.NEXT_PUBLIC_EV_INTERNAL_QA === "1" ? (
            <p className="text-center text-[11px] text-[#7A7164]">
              <Link
                href={replaceLangInHref("/clasificados/en-venta/launch-checklist", routeLang)}
                className="font-semibold underline underline-offset-2"
              >
                {lang === "es" ? "Checklist interno de lanzamiento (QA)" : "Internal launch checklist (QA)"}
              </Link>
            </p>
          ) : null}
        </main>
      </div>
    </LeonixCategoryPageShell>
  );
}
