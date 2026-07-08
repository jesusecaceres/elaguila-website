"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { navCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { FiBriefcase, FiCheckCircle, FiClock, FiGlobe, FiHome, FiMapPin, FiMessageCircle, FiShield, FiTool, FiTruck } from "react-icons/fi";
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
import { buildCategoryResultsUrl } from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardRoutes";
import { SERVICIOS_LANDING_EXPLORE_CATEGORIES } from "./serviciosLandingSampleData";

type Lang = "es" | "en";

function appendResultsParams(baseHref: string, params: Record<string, string | undefined>) {
  const [path, rawQuery = ""] = baseHref.split("?");
  const sp = new URLSearchParams(rawQuery);
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) sp.set(key, value.trim());
  }
  return `${path}?${sp.toString()}`;
}

export function ServiciosLandingPage() {
  const sp = useSearchParams();
  const routeLang = normalizeLang(sp?.get("lang"));
  const lang = navCopyLang(routeLang) as Lang;
  const resultsHref = buildCategoryResultsUrl("servicios", routeLang as Lang);
  const publishHref = replaceLangInHref("/clasificados/publicar/servicios/checkpoint", routeLang);
  const visibilityHref = replaceLangInHref("/contacto?categoria=servicios&surface=landing", routeLang);

  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("CA");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("United States");

  const copy = {
    es: {
      eyebrow: "SERVICIOS LOCALES · LEONIX",
      tagline: "Profesionales cerca de ti.",
      intro: "Encuentra servicios confiables cerca de ti, desde hogar y negocios hasta asesoría profesional.",
      helper: "Busca por giro, ciudad o código postal; compara perfiles, contacto y opciones disponibles.",
      placeholder: "Buscar servicio, negocio o profesional...",
      publish: "Publicar en Servicios",
      browse: "Ver todos los anuncios",
      partnerEyebrow: "REVISTA · DIGITAL · SERVICIOS",
      partnerTitle: "Haz visible tu servicio con Leonix",
      partnerBody: "Perfiles de servicios con presencia premium en Leonix Media, revista impresa/digital, búsqueda local y contacto directo.",
      partnerHelper: "Ideal para profesionales, contratistas, técnicos, consultores y negocios locales que quieren ser encontrados por la comunidad.",
      partnerCta: "Conocer opciones de visibilidad",
      giroTitle: "Explora por giro",
      giroSubtitle: "Entra a resultados con las familias de servicios que usará tu anuncio al publicarse.",
      trustTitle: "Lo que más importa",
      trustSubtitle: "Atajos rápidos para encontrar servicios con lo esencial.",
      visibilityEyebrow: "VISIBILIDAD PRINT + DIGITAL",
      visibilityTitle: "Haz que tu anuncio tenga más visibilidad",
      visibilityBody: "Opciones de revista, digital y destacados se revisan con Leonix. Nada aparece como Destacado sin un paquete activo.",
      visibilityCta: "Conocer opciones de visibilidad",
    },
    en: {
      eyebrow: "LOCAL SERVICES · LEONIX",
      tagline: "Professionals near you.",
      intro: "Find reliable services near you, from home and business help to professional advice.",
      helper: "Search by trade, city, or ZIP; compare profiles, contact details, and available options.",
      placeholder: "Search service, business, or professional...",
      publish: "Post in Services",
      browse: "View all listings",
      partnerEyebrow: "MAGAZINE · DIGITAL · SERVICES",
      partnerTitle: "Make your service visible with Leonix",
      partnerBody: "Service profiles with premium visibility across Leonix Media, print/digital magazine, local search, and direct contact.",
      partnerHelper: "Built for professionals, contractors, technicians, consultants, and local businesses that want to be found by the community.",
      partnerCta: "Explore visibility options",
      giroTitle: "Browse by trade",
      giroSubtitle: "Jump into results with the service families your listing will use when published.",
      trustTitle: "What matters most",
      trustSubtitle: "Quick shortcuts for finding services with the essentials.",
      visibilityEyebrow: "PRINT + DIGITAL VISIBILITY",
      visibilityTitle: "Give your listing more visibility",
      visibilityBody: "Print, digital, and featured options are reviewed with Leonix. Nothing is marked Featured without an active package.",
      visibilityCta: "Explore visibility options",
    },
  }[lang];

  const runSearch = () => {
    window.location.href = appendResultsParams(resultsHref, {
      q: query,
      city,
      state,
      zip,
      country,
    });
  };

  const serviciosSearchForm = (
    <LeonixCategorySearchCanvas
      lang={lang as V2Lang}
      surface="landing"
      query={query}
      city={city}
      state={state}
      zip={zip}
      country={country}
      onQuery={setQuery}
      onCity={setCity}
      onState={setState}
      onZip={setZip}
      onCountry={setCountry}
      onSearch={runSearch}
      onOpenFilters={runSearch}
      browseAllHref={resultsHref}
      browseAllLabel={copy.browse}
      queryPlaceholder={copy.placeholder}
      searchButtonLabel={lang === "es" ? "Buscar" : "Search"}
      filtersButtonLabel={lang === "es" ? "Filtros" : "Filters"}
      publishHref={publishHref}
      publishLabel={copy.publish}
    />
  );

  const categoryCards = SERVICIOS_LANDING_EXPLORE_CATEGORIES.slice(0, 8).map((cat, index) => {
    const qRaw = (lang === "en" ? cat.resultsQueryEn : cat.resultsQueryEs)?.trim() ?? "";
    const href = cat.resultsGroup
      ? appendResultsParams(resultsHref, { group: cat.resultsGroup })
      : qRaw
        ? appendResultsParams(resultsHref, { q: qRaw })
        : resultsHref;
    const icons = [FiBriefcase, FiCheckCircle, FiShield, FiHome, FiTool, FiClock, FiMapPin, FiTruck];
    return {
      id: cat.id,
      label: lang === "en" ? cat.labelEn : cat.labelEs,
      hint: lang === "en" ? "Open matching results" : "Abrir resultados",
      href,
      icon: icons[index] ?? FiBriefcase,
    };
  });

  return (
    <LeonixCategoryPageShell surface="landing">
      <LeonixCategoryHeroGateway
        lang={lang as V2Lang}
        surface="landing"
        title={lang === "es" ? "Servicios" : "Services"}
        tagline={copy.tagline}
        intro={copy.intro}
        introSecondary={copy.helper}
        searchSlot={serviciosSearchForm}
        eyebrow={copy.eyebrow}
      />
      <main className="mx-auto max-w-[1280px] space-y-6 overflow-x-hidden px-3.5 pb-14 sm:px-4 sm:space-y-8 lg:px-5">
      <div className="space-y-6 sm:space-y-8">
        <LeonixCategoryPartnerSection
          enabled
          lang={lang as V2Lang}
          surface="landing"
          eyebrow={copy.partnerEyebrow}
          title={copy.partnerTitle}
          body={copy.partnerBody}
          supportingLine={copy.partnerHelper}
          chips={
            lang === "es"
              ? ["Perfil de negocio", "Contacto directo", "Cotizaciones", "Campañas locales", "Visibilidad premium", "Revista digital"]
              : ["Business profile", "Direct contact", "Quotes", "Local campaigns", "Premium visibility", "Digital magazine"]
          }
          secondaryCta={{ label: copy.partnerCta, href: visibilityHref }}
        />

        <LeonixCategoryDiscoveryGrid
          lang={lang as V2Lang}
          surface="landing"
          heading={copy.giroTitle}
          subtitle={copy.giroSubtitle}
          items={categoryCards}
        />

        <LeonixCategoryShortcutSection
          lang={lang as V2Lang}
          surface="landing"
          title={copy.trustTitle}
          subtitle={copy.trustSubtitle}
          variant="practical"
          chips={[
            { id: "whatsapp", label: "WhatsApp", href: appendResultsParams(resultsHref, { whatsapp: "1" }), icon: FiMessageCircle },
            { id: "web", label: lang === "es" ? "Con sitio web" : "Has website", href: appendResultsParams(resultsHref, { web: "1" }), icon: FiGlobe },
            { id: "quote", label: lang === "es" ? "Cotización" : "Quote", href: appendResultsParams(resultsHref, { free_estimate: "1" }), icon: FiCheckCircle },
            { id: "office", label: lang === "es" ? "Oficina física" : "Physical office", href: appendResultsParams(resultsHref, { phys: "1" }), icon: FiMapPin },
            { id: "mobile", label: lang === "es" ? "Servicio a domicilio" : "Mobile service", href: appendResultsParams(resultsHref, { mobileSvc: "1" }), icon: FiTruck },
            { id: "emergency", label: lang === "es" ? "Emergencias" : "Emergencies", href: appendResultsParams(resultsHref, { emergency: "1" }), icon: FiClock },
            { id: "weekend", label: lang === "es" ? "Fines de semana" : "Weekends", href: appendResultsParams(resultsHref, { wknd: "1" }), icon: FiClock },
            { id: "verified", label: lang === "es" ? "Verificados" : "Verified", href: appendResultsParams(resultsHref, { verified: "1" }), icon: FiShield },
            { id: "licensed", label: lang === "es" ? "Licencia / Seguro" : "License / Insurance", href: appendResultsParams(resultsHref, { licensed: "1", insured: "1" }), icon: FiShield },
          ]}
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
