"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { replaceLangInHref } from "@/app/lib/language";
import { getCanonicalCityName } from "@/app/data/locations/californiaLocationHelpers";
import type { AutosPublicLang } from "../lib/autosPublicBlueprintCopy";
import { parseAutosBrowseUrl, serializeAutosBrowseUrl } from "../filters/autosBrowseFilterContract";
import { emptyAutosPublicFilters, type AutosPublicFilterState } from "../filters/autosPublicFilterTypes";
import {
  FiAward,
  FiBatteryCharging,
  FiBriefcase,
  FiClock,
  FiDollarSign,
  FiMapPin,
  FiSettings,
  FiShield,
  FiStar,
  FiTruck,
  FiUser,
  FiZap,
} from "react-icons/fi";
import {
  LeonixCategoryPageShell,
  LeonixCategoryHeroGateway,
  LeonixCategorySearchCanvas,
  LeonixCategoryPartnerSection,
  LeonixCategoryDiscoveryGrid,
  LeonixCategoryShortcutSection,
  LeonixCategoryVisibilityStrip,
  type Lang as V2Lang,
} from "@/app/(site)/clasificados/components/categoryStandardV2";
import type { AutosPublicMarket } from "@/app/lib/clasificados/autos/autosPublicMarket";
import { AUTOS_DEFAULT_COUNTRY } from "@/app/lib/clasificados/autos/autosLocationContract";
import {
  autosMarketDefaultSellerType,
  autosMarketPublishPath,
  autosMarketResultsPath,
} from "@/app/lib/clasificados/autos/autosPublicMarket";

type LandingCopy = {
  eyebrow: string;
  title: string;
  tagline: string;
  intro: string;
  helper: string;
  searchPlaceholder: string;
  publishLabel: string;
  browseLabel: string;
  discoveryTitle: string;
  discoverySubtitle: string;
  practicalTitle: string;
  practicalSubtitle: string;
  visibilityEyebrow: string;
  visibilityTitle: string;
  visibilityBody: string;
  visibilityCta: string;
};

const LANDING_COPY: Record<AutosPublicMarket, Record<AutosPublicLang, LandingCopy>> = {
  private: {
    es: {
      eyebrow: "LEONIX CLASIFICADOS · AUTOS",
      title: "Autos",
      tagline: "Encuentra tu próximo auto cerca de ti.",
      intro: "Explora autos publicados por vendedores privados con precio, millaje y ubicación visibles.",
      helper: "Busca por marca, modelo, ciudad o código postal; usa filtros para comparar lo que necesitas.",
      searchPlaceholder: "Buscar marca, modelo o palabra clave...",
      publishLabel: "Publicar mi auto",
      browseLabel: "Ver todos los autos",
      discoveryTitle: "¿Qué tipo de auto buscas?",
      discoverySubtitle: "Elige una opción para empezar.",
      practicalTitle: "Lo que más importa",
      practicalSubtitle: "Atajos rápidos para encontrar autos con lo esencial.",
      visibilityEyebrow: "VISIBILIDAD PARA TU AUTO",
      visibilityTitle: "Haz que tu anuncio tenga más visibilidad",
      visibilityBody: "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo.",
      visibilityCta: "Conocer opciones de visibilidad",
    },
    en: {
      eyebrow: "LEONIX CLASSIFIEDS · AUTOS",
      title: "Autos",
      tagline: "Find your next car near you.",
      intro: "Browse vehicles posted by private sellers with visible price, mileage, and location.",
      helper: "Search by make, model, city, or ZIP; use filters to compare what you need.",
      searchPlaceholder: "Search make, model, or keyword...",
      publishLabel: "Post my car",
      browseLabel: "View all cars",
      discoveryTitle: "What kind of car are you looking for?",
      discoverySubtitle: "Choose an option to start.",
      practicalTitle: "What matters most",
      practicalSubtitle: "Quick shortcuts for finding cars with the essentials.",
      visibilityEyebrow: "VISIBILITY FOR YOUR CAR",
      visibilityTitle: "Give your listing more visibility",
      visibilityBody: "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package.",
      visibilityCta: "Explore visibility options",
    },
  },
  dealer: {
    es: {
      eyebrow: "LEONIX CLASIFICADOS · DEALERS DE AUTOS",
      title: "Dealers de Autos",
      tagline: "Inventario de negocios y concesionarios cerca de ti.",
      intro: "Explora vehículos de concesionarios y negocios de autos con precio, millaje y ubicación visibles.",
      helper: "Busca por marca, modelo, ciudad o código postal; usa filtros para comparar inventario de dealers.",
      searchPlaceholder: "Buscar dealer, marca, modelo o palabra clave...",
      publishLabel: "Publicar como dealer",
      browseLabel: "Ver inventario de dealers",
      discoveryTitle: "¿Qué tipo de inventario buscas?",
      discoverySubtitle: "Explora inventario de negocios y concesionarios.",
      practicalTitle: "Lo que más importa",
      practicalSubtitle: "Atajos rápidos para encontrar inventario de dealers.",
      visibilityEyebrow: "VISIBILIDAD PARA DEALERS",
      visibilityTitle: "Haz que tu inventario tenga más visibilidad",
      visibilityBody: "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo.",
      visibilityCta: "Conocer opciones de visibilidad",
    },
    en: {
      eyebrow: "LEONIX CLASSIFIEDS · AUTO DEALERS",
      title: "Auto Dealers",
      tagline: "Business and dealership inventory near you.",
      intro: "Browse vehicles from dealerships and auto businesses with visible price, mileage, and location.",
      helper: "Search by dealer, make, model, city, or ZIP; use filters to compare dealer inventory.",
      searchPlaceholder: "Search dealer, make, model, or keyword...",
      publishLabel: "Post as dealer",
      browseLabel: "View dealer inventory",
      discoveryTitle: "What kind of inventory are you looking for?",
      discoverySubtitle: "Explore business and dealership inventory.",
      practicalTitle: "What matters most",
      practicalSubtitle: "Quick shortcuts for finding dealer inventory.",
      visibilityEyebrow: "VISIBILITY FOR DEALERS",
      visibilityTitle: "Give your inventory more visibility",
      visibilityBody: "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package.",
      visibilityCta: "Explore visibility options",
    },
  },
};

export function AutosLandingPage({ market = "private" }: { market?: AutosPublicMarket }) {
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";
  const browseState = useMemo(() => parseAutosBrowseUrl(new URLSearchParams(spStr)), [spStr]);
  const lang: AutosPublicLang = browseState.lang;
  const routeLang = browseState.routeLang;
  const isPrivateMarket = market === "private";
  const isDealerMarket = market === "dealer";
  const copy = LANDING_COPY[market][lang];
  const RESULTADOS_PATH = autosMarketResultsPath(market);
  const defaultSeller = autosMarketDefaultSellerType(market);

  const [searchQ, setSearchQ] = useState("");
  const [city, setCity] = useState("San Jose");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState(AUTOS_DEFAULT_COUNTRY);

  useEffect(() => {
    const b = parseAutosBrowseUrl(new URLSearchParams(spStr));
    setSearchQ(b.q);
    setCity(b.filters.city.trim() || "San Jose");
    setState(b.filters.state.trim() || "CA");
    setZip(b.filters.zip);
    setCountry(b.filters.country.trim() || AUTOS_DEFAULT_COUNTRY);
  }, [spStr]);

  const resultsHref = useCallback(
    (bundle: Parameters<typeof serializeAutosBrowseUrl>[0]) => `${RESULTADOS_PATH}?${serializeAutosBrowseUrl(bundle)}`,
    [RESULTADOS_PATH],
  );

  const landingHref = useCallback(
    (patch: Partial<AutosPublicFilterState>, q = "") =>
      resultsHref({
        filters: { ...emptyAutosPublicFilters(), ...patch },
        q,
        sort: "newest",
        page: 1,
        lang,
        routeLang,
      }),
    [lang, routeLang, resultsHref],
  );

  const searchHref = useMemo(() => {
    const filters = { ...emptyAutosPublicFilters(), sellerType: defaultSeller };
    const rawCity = city.trim();
    filters.city = getCanonicalCityName(rawCity) || rawCity;
    filters.state = state.trim();
    filters.zip = zip.trim();
    filters.country = country.trim() || AUTOS_DEFAULT_COUNTRY;
    return resultsHref({
      filters,
      q: searchQ.trim(),
      sort: "newest",
      page: 1,
      lang,
      routeLang,
    });
  }, [defaultSeller, lang, routeLang, searchQ, city, state, zip, country, resultsHref]);

  const browseAllHref = useMemo(() => landingHref({ sellerType: defaultSeller }), [defaultSeller, landingHref]);

  const publishAutosHref = replaceLangInHref(autosMarketPublishPath(market), routeLang);
  const visibilityHref = `/contacto?lang=${routeLang}&categoria=${isDealerMarket ? "dealers-de-autos" : "autos"}&surface=landing`;
  const runSearch = () => {
    window.location.href = searchHref;
  };

  const discoveryItems = isPrivateMarket
    ? [
        {
          id: "sedan",
          label: lang === "es" ? "Sedán" : "Sedan",
          hint: lang === "es" ? "Diario y práctico" : "Daily and practical",
          href: landingHref({ bodyStyle: "Sedan", sellerType: "private" }),
          icon: FiSettings,
        },
        {
          id: "suv",
          label: "SUV",
          hint: lang === "es" ? "Espacio familiar" : "Family space",
          href: landingHref({ bodyStyle: "SUV", sellerType: "private" }),
          icon: FiShield,
        },
        {
          id: "truck",
          label: lang === "es" ? "Camioneta" : "Truck",
          hint: lang === "es" ? "Trabajo y carga" : "Work and cargo",
          href: landingHref({ bodyStyle: "Truck", sellerType: "private" }),
          icon: FiTruck,
        },
        {
          id: "low-mileage",
          label: lang === "es" ? "Bajo millaje" : "Low mileage",
          hint: lang === "es" ? "Menos uso" : "Less use",
          href: landingHref({ mileageMax: "35000", sellerType: "private" }),
          icon: FiAward,
        },
        {
          id: "under-10k",
          label: lang === "es" ? "Menos de $10k" : "Under $10k",
          hint: lang === "es" ? "Opciones económicas" : "Budget options",
          href: landingHref({ priceMax: "10000", sellerType: "private" }),
          icon: FiDollarSign,
        },
        {
          id: "hybrid-electric",
          label: lang === "es" ? "Híbrido / eléctrico" : "Hybrid / electric",
          hint: lang === "es" ? "Ahorro y tecnología" : "Savings and tech",
          href: landingHref({ sellerType: "private" }, lang === "es" ? "híbrido eléctrico" : "hybrid electric"),
          icon: FiBatteryCharging,
        },
        {
          id: "private",
          label: lang === "es" ? "Privado" : "Private",
          hint: lang === "es" ? "Vendedores locales" : "Local sellers",
          href: landingHref({ sellerType: "private" }),
          icon: FiUser,
        },
        {
          id: "newest",
          label: lang === "es" ? "Recién publicado" : "Newly posted",
          hint: lang === "es" ? "Nuevas oportunidades" : "New opportunities",
          href: landingHref({ sellerType: "private" }),
          icon: FiClock,
        },
      ]
    : [
        {
          id: "dealers",
          label: "Dealers",
          hint: lang === "es" ? "Inventario de negocio" : "Business inventory",
          href: landingHref({ sellerType: "dealer" }),
          icon: FiBriefcase,
        },
        {
          id: "used",
          label: lang === "es" ? "Usados" : "Used",
          hint: lang === "es" ? "Oportunidades disponibles" : "Available opportunities",
          href: landingHref({ condition: "used", sellerType: "dealer" }),
          icon: FiStar,
        },
        {
          id: "new",
          label: lang === "es" ? "Nuevos" : "New",
          hint: lang === "es" ? "Inventario reciente" : "Recent inventory",
          href: landingHref({ condition: "new", sellerType: "dealer" }),
          icon: FiZap,
        },
        {
          id: "suv",
          label: "SUV",
          hint: lang === "es" ? "Espacio familiar" : "Family space",
          href: landingHref({ bodyStyle: "SUV", sellerType: "dealer" }),
          icon: FiShield,
        },
        {
          id: "truck",
          label: lang === "es" ? "Camionetas" : "Trucks",
          hint: lang === "es" ? "Trabajo y carga" : "Work and cargo",
          href: landingHref({ bodyStyle: "Truck", sellerType: "dealer" }),
          icon: FiTruck,
        },
        {
          id: "low-mileage",
          label: lang === "es" ? "Bajo millaje" : "Low mileage",
          hint: lang === "es" ? "Menos uso" : "Less use",
          href: landingHref({ mileageMax: "35000", sellerType: "dealer" }),
          icon: FiAward,
        },
        {
          id: "financing",
          label: lang === "es" ? "Financiamiento" : "Financing",
          hint: lang === "es" ? "Opciones disponibles" : "Available options",
          href: landingHref({ sellerType: "dealer" }, lang === "es" ? "financiamiento" : "financing"),
          icon: FiDollarSign,
        },
        {
          id: "bay-area",
          label: lang === "es" ? "San José / Bay Area" : "San Jose / Bay Area",
          hint: lang === "es" ? "Ciudad inicial" : "Starter city",
          href: landingHref({ city: "San Jose", sellerType: "dealer" }),
          icon: FiMapPin,
        },
      ];

  const practicalChips = isPrivateMarket
    ? [
        { id: "low-mileage", label: lang === "es" ? "Bajo millaje" : "Low mileage", href: landingHref({ mileageMax: "35000", sellerType: "private" }), icon: FiAward },
        { id: "under-10k", label: lang === "es" ? "Menos de $10k" : "Under $10k", href: landingHref({ priceMax: "10000", sellerType: "private" }), icon: FiDollarSign },
        { id: "suv", label: "SUV", href: landingHref({ bodyStyle: "SUV", sellerType: "private" }), icon: FiShield },
        { id: "truck", label: lang === "es" ? "Camioneta" : "Truck", href: landingHref({ bodyStyle: "Truck", sellerType: "private" }), icon: FiTruck },
        { id: "automatic", label: lang === "es" ? "Automático" : "Automatic", href: landingHref({ transmission: "Automatic", sellerType: "private" }), icon: FiSettings },
        { id: "good-price", label: lang === "es" ? "Buen precio" : "Good price", href: landingHref({ priceMax: "15000", sellerType: "private" }), icon: FiDollarSign },
        { id: "private", label: lang === "es" ? "Privado" : "Private", href: landingHref({ sellerType: "private" }), icon: FiUser },
      ]
    : [
        { id: "used", label: lang === "es" ? "Usados" : "Used", href: landingHref({ condition: "used", sellerType: "dealer" }), icon: FiStar },
        { id: "new", label: lang === "es" ? "Nuevos" : "New", href: landingHref({ condition: "new", sellerType: "dealer" }), icon: FiZap },
        { id: "low-mileage", label: lang === "es" ? "Bajo millaje" : "Low mileage", href: landingHref({ mileageMax: "35000", sellerType: "dealer" }), icon: FiAward },
        { id: "truck", label: lang === "es" ? "Camioneta" : "Truck", href: landingHref({ bodyStyle: "Truck", sellerType: "dealer" }), icon: FiTruck },
        { id: "suv", label: "SUV", href: landingHref({ bodyStyle: "SUV", sellerType: "dealer" }), icon: FiShield },
        { id: "financing", label: lang === "es" ? "Financiamiento" : "Financing", href: landingHref({ sellerType: "dealer" }, lang === "es" ? "financiamiento" : "financing"), icon: FiDollarSign },
        { id: "dealer", label: "Dealer", href: landingHref({ sellerType: "dealer" }), icon: FiBriefcase },
      ];

  return (
    <LeonixCategoryPageShell surface="landing">
      <div className="px-3.5 pb-14 sm:px-5 lg:px-6">
          <LeonixCategoryHeroGateway
            lang={lang as V2Lang}
            surface="landing"
            title={copy.title}
            tagline={copy.tagline}
            intro={copy.intro}
            introSecondary={copy.helper}
            searchSlot={
              <LeonixCategorySearchCanvas
                lang={lang as V2Lang}
                surface="landing"
                query={searchQ}
                city={city}
                state={state}
                zip={zip}
                country={country}
                onQuery={setSearchQ}
                onCity={setCity}
                onState={setState}
                onZip={setZip}
                onCountry={setCountry}
                onSearch={runSearch}
                onOpenFilters={runSearch}
                browseAllHref={browseAllHref}
                browseAllLabel={copy.browseLabel}
                queryPlaceholder={copy.searchPlaceholder}
                searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
                filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
                publishHref={publishAutosHref}
                publishLabel={copy.publishLabel}
              />
            }
            eyebrow={copy.eyebrow}
          />

          <main className="space-y-6 overflow-x-hidden sm:space-y-8">
            <LeonixCategoryDiscoveryGrid
              lang={lang as V2Lang}
              surface="landing"
              heading={copy.discoveryTitle}
              subtitle={copy.discoverySubtitle}
              items={discoveryItems}
            />

            {isDealerMarket ? (
              <LeonixCategoryPartnerSection
                enabled
                lang={lang as V2Lang}
                surface="landing"
                eyebrow={lang === "es" ? "REVISTA · DIGITAL · DEALERS" : "MAGAZINE · DIGITAL · DEALERS"}
                title={lang === "es" ? "Haz visible tu inventario con Leonix" : "Make your inventory visible with Leonix"}
                body={
                  lang === "es"
                    ? "Dealers y negocios de autos pueden presentar inventario con presencia premium en Leonix Media, búsqueda local y contacto directo."
                    : "Dealers and auto businesses can present inventory with premium visibility across Leonix Media, local search, and direct contact."
                }
                supportingLine={
                  lang === "es"
                    ? "Ideal para concesionarios, lotes de autos y negocios que quieren ser encontrados por compradores locales."
                    : "Built for dealerships, auto lots, and businesses that want to be found by local buyers."
                }
                chips={
                  lang === "es"
                    ? ["Perfil de dealer", "Inventario local", "Contacto directo", "Campañas locales", "Visibilidad premium", "Revista digital"]
                    : ["Dealer profile", "Local inventory", "Direct contact", "Local campaigns", "Premium visibility", "Digital magazine"]
                }
                secondaryCta={{ label: copy.browseLabel, href: browseAllHref }}
              />
            ) : null}

          <LeonixCategoryShortcutSection
            lang={lang as V2Lang}
            surface="landing"
              title={copy.practicalTitle}
              subtitle={copy.practicalSubtitle}
              variant="practical"
              chips={practicalChips}
          />

            <LeonixCategoryVisibilityStrip
              lang={lang as V2Lang}
              surface="landing"
              eyebrow={copy.visibilityEyebrow}
              title={copy.visibilityTitle}
              body={copy.visibilityBody}
              ctaLabel={copy.visibilityCta}
              ctaHref={visibilityHref}
            />
          </main>
      </div>
    </LeonixCategoryPageShell>
  );
}
