"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";

import { CategoryStandardResultsPageShell } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsPageShell";
import { CategoryStandardResultsHeader } from "@/app/(site)/clasificados/components/categoryStandard/CategoryStandardResultsHeader";
import { CAT_STD_PER_PAGE_OPTIONS } from "@/app/(site)/clasificados/components/categoryPipeline/catStdPerPage";
import {
  RESTAURANTE_BUSINESS_TYPES,
  RESTAURANTE_CUISINES,
  RESTAURANTE_HIGHLIGHTS,
  RESTAURANTE_LANGUAGES,
  RESTAURANTE_PRICE_LEVELS,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import { type RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { filterRestaurantesBlueprintRows, sortRestaurantesBlueprintRows } from "@/app/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows";
import {
  buildRestaurantesResultsHref,
  clearRestaurantesDiscoveryFilters,
  parseRestaurantesResultsSearchParams,
  restaurantesDiscoveryStateToParams,
  splitLocationInput,
  type RestaurantesDiscoveryLang,
  type RestaurantesDiscoveryState,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { requestCoarsePlaceFromBrowserGeolocation } from "@/app/clasificados/restaurantes/lib/restaurantesCoarseGeolocation";
import { getRestauranteAmenityGroupMeta } from "@/app/clasificados/restaurantes/lib/restauranteAmenitiesCatalog";
import { loadRestaurantesBuyerSavedIdSet } from "@/app/clasificados/restaurantes/lib/restaurantesBuyerSavedIds";
import { rememberRestaurantesDiscoveryFromState } from "@/app/clasificados/restaurantes/lib/restaurantesFirstPartyPreferences";
import { RestaurantesDestacadosSection } from "@/app/clasificados/restaurantes/components/RestaurantesDestacadosSection";
import { getRestaurantesDestacadosRows } from "@/app/clasificados/restaurantes/lib/restaurantesDestacados";
import { applyRestaurantesVisibilityRanking } from "@/app/clasificados/restaurantes/lib/restaurantesVisibilityRanking";
import { leonixPersonalizationAllowed } from "@/app/lib/leonixPublicConsent";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { RestaurantesResultsInventorySource } from "@/app/clasificados/restaurantes/lib/restaurantesResultsInventoryServer";
import { RestaurantePublishedListingCard } from "@/app/clasificados/restaurantes/components/RestaurantePublishedListingCard";

const ACCENT = "#D4A574";

function labelForSvcParam(svc: string, lang: RestaurantesDiscoveryLang): string {
  switch (svc) {
    case "dine_in":
      return lang === "es" ? "Comer en local" : "Dine-in";
    case "takeout":
      return lang === "es" ? "Para llevar" : "Takeout";
    case "delivery":
      return lang === "es" ? "Entrega a domicilio" : "Delivery";
    case "catering":
      return lang === "es" ? "Catering" : "Catering";
    case "events":
      return lang === "es" ? "Eventos" : "Events";
    case "meal_prep":
      return lang === "es" ? "Meal prep" : "Meal prep";
    case "personal_chef":
      return lang === "es" ? "Chef privado" : "Personal chef";
    case "pop_up":
      return lang === "es" ? "Pop-up (modo)" : "Pop-up (mode)";
    case "food_truck":
      return lang === "es" ? "Food truck (modo)" : "Food truck (mode)";
    case "other":
      return lang === "es" ? "Otro modo" : "Other mode";
    default:
      return svc;
  }
}

function mergeDiscovery(
  base: RestaurantesDiscoveryState,
  patch: Partial<RestaurantesDiscoveryState>,
): RestaurantesDiscoveryState {
  return { ...base, ...patch };
}

function toggleKey(list: string[], key: string): string[] {
  if (!key) return list;
  const set = new Set(list);
  if (set.has(key)) set.delete(key);
  else set.add(key);
  return Array.from(set);
}

export function RestaurantesResultsShell({
  initialInventory,
  inventorySource,
  inventoryBannerNote,
}: {
  initialInventory: RestaurantesPublicBlueprintRow[];
  inventorySource: RestaurantesResultsInventorySource;
  inventoryBannerNote?: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const spStr = sp?.toString() ?? "";

  const parsed = useMemo(() => parseRestaurantesResultsSearchParams(new URLSearchParams(spStr)), [spStr]);
  const lang: RestaurantesDiscoveryLang = parsed.lang;

  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [geoNote, setGeoNote] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [dismissPublishFlash, setDismissPublishFlash] = useState(false);

  const [qInput, setQInput] = useState(parsed.q);
  const [locInput, setLocInput] = useState(parsed.zip || parsed.city || "");

  useEffect(() => {
    setQInput(parsed.q);
    setLocInput(parsed.zip || parsed.city || "");
  }, [parsed.q, parsed.city, parsed.zip]);

  useEffect(() => {
    let cancelled = false;
    void loadRestaurantesBuyerSavedIdSet().then((ids) => {
      if (!cancelled) setSavedIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [spStr, parsed.saved]);

  const effectiveSort = useMemo(() => {
    if (parsed.top) return "rating-desc" as const;
    return parsed.sort;
  }, [parsed.top, parsed.sort]);

  const publishFlash = sp?.get("rx_pub") === "1" && !dismissPublishFlash;

  const filteredUnsorted = useMemo(
    () =>
      filterRestaurantesBlueprintRows(initialInventory, parsed, {
        savedIds: parsed.saved ? savedIds : undefined,
      }),
    [parsed, savedIds, initialInventory],
  );

  const ranked = useMemo(
    () => applyRestaurantesVisibilityRanking(filteredUnsorted),
    [filteredUnsorted],
  );

  const destacadosRows = useMemo(() => getRestaurantesDestacadosRows(ranked), [ranked]);

  const sorted = useMemo(() => sortRestaurantesBlueprintRows(ranked, effectiveSort), [ranked, effectiveSort]);

  const gridRows = sorted;
  const perPage = parsed.perPage;
  const pageCount = Math.max(1, Math.ceil(gridRows.length / perPage));
  const currentPage = Math.min(parsed.page, pageCount);
  const shown = useMemo(
    () => gridRows.slice((currentPage - 1) * perPage, currentPage * perPage),
    [gridRows, currentPage, perPage],
  );

  const pushState = useCallback(
    (next: RestaurantesDiscoveryState) => {
      const href = buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(next));
      router.push(href);
    },
    [lang, router],
  );

  const onSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const loc = splitLocationInput(locInput);
    const next = mergeDiscovery(parsed, {
      q: qInput.trim(),
      city: loc.city ?? "",
      zip: loc.zip ?? "",
      page: 1,
    });
    rememberRestaurantesDiscoveryFromState(next);
    pushState(next);
  };

  const t = useMemo(() => {
    if (lang === "en") {
      return {
        title: "Restaurants",
        subtitle: "Same search and filters as the Restaurants home—refine what you started on Leonix.",
        journeyLine: "Tune cuisine, service mode, and location; every control maps to profile data as listings grow.",
        searchPh: "Name, cuisine, or dish…",
        locationPh: "City or 5-digit ZIP",
        search: "Search",
        filters: "Filters",
        close: "Close",
        count: "Showing",
        results: "places",
        resultsMatching: "matching places",
        sort: "Sort",
        sortNew: "Newest",
        sortName: "Name A–Z",
        sortRating: "Highest rated",
        loadMore: "Load more",
        emptyTitle: "Nothing matched yet",
        emptyBody:
          "Widen a filter, clear a chip, or go back to Restaurants home to reset—your search terms stay in the URL until you change them.",
        emptyCta: "Back to Restaurants home",
        featured: "Featured on Leonix",
        promotedCaption: "Sponsored visibility; the main list still follows your sort and filters.",
        promotedBadge: "Sponsored",
        verMas: "See more",
        cuisine: "Cuisine",
        city: "City",
        zip: "ZIP",
        price: "Price range",
        service: "Service",
        serviceFull: "Service mode",
        dietFull: "Diet or preference",
        any: "Any",
        all: "All",
        openNow: "Open now",
        family: "Family-friendly",
        diet: "Dietary",
        apply: "Apply filters",
        reset: "Reset",
        active: "Active filters",
        backLanding: "Restaurants home",
        eyebrow: "Leonix · Clasificados",
        nearHonest: "Near me: add city or ZIP to narrow results.",
        sectionCuisine: "Cuisine",
        sectionLocation: "Location",
        sectionService: "Service",
        sectionPrice: "Price",
        sectionStyle: "Business type",
        sectionMore: "More filters",
        biz: "Business type",
        hl: "Feature or atmosphere",
        flagMoving: "Moving vendor",
        flagHome: "Home-based",
        flagTruck: "Food truck",
        flagPopUp: "Pop-up",
        savedOnly: "Saved only",
        savedPrivacy: "Enable personalization in cookie preferences to filter saved listings.",
        useLocation: "Use my location",
        useLocationHelp: "Runs only when tapped. We approximate your city—precise GPS is not stored by default.",
        clearAll: "Clear all",
        nearReserved: "Near me",
        cookiePrefs: "Cookie preferences",
        saveListingAria: "Save restaurant to device",
        unsaveListingAria: "Remove restaurant from saved",
        publishFlashTitle: "Listing published",
        publishFlashBody:
          "If Supabase is configured, your listing is saved. Adjust filters if you do not see it yet.",
        publishFlashDismiss: "Dismiss",
        resultNarrowInResults: "Same search in results",
        neighborhood: "Neighborhood",
        reservationsOnly: "Accepts reservations",
        preorderOnly: "Preorder required",
        pickupOnly: "Pickup available",
        promotedOnly: "Featured only",
        verifiedOnly: "Leonix verified only",
        deliveryRadiusMin: "Min. delivery radius (miles)",
        sectionDiet: "Diet",
        sectionPayments: "Payments",
        sectionAmbience: "Atmosphere",
        sectionAmenities: "Amenities",
        sectionAccessibility: "Accessibility",
        sectionLanguages: "Languages",
        sectionExtras: "Extras",
        menuOnly: "Menu available",
        socialOnly: "Has social media",
        websiteOnly: "Has website",
        whatsappOnly: "Has WhatsApp",
      };
    }
    return {
      title: "Restaurantes",
      subtitle: "La misma búsqueda y filtros que en el inicio de Restaurantes—continúa lo que empezaste en Leonix.",
      journeyLine: "Ajusta cocina, modo de servicio y ubicación; cada control refleja datos del perfil cuando los anuncios crezcan.",
      searchPh: "Nombre, cocina o platillo…",
      locationPh: "Ciudad o código postal (5 dígitos)",
      search: "Buscar",
      filters: "Filtros",
      close: "Cerrar",
      count: "Mostrando",
      results: "lugares",
      resultsMatching: "lugares que coinciden",
      sort: "Orden",
      sortNew: "Más recientes",
      sortName: "Nombre A–Z",
      sortRating: "Mejor valorados",
      loadMore: "Cargar más",
      emptyTitle: "Aún no hay coincidencias",
      emptyBody:
        "Amplía un filtro, quita una etiqueta o vuelve al inicio de Restaurantes para reorientarte; los términos siguen en la URL hasta que los cambies.",
      emptyCta: "Volver al inicio de Restaurantes",
      featured: "Destacados en Leonix",
      promotedCaption: "Visibilidad patrocinada; el listado principal sigue tu orden y filtros.",
      promotedBadge: "Patrocinado",
      verMas: "Ver más",
      cuisine: "Cocina",
      city: "Ciudad",
      zip: "Código postal",
      price: "Precio",
      service: "Servicio",
      serviceFull: "Modo de servicio",
      dietFull: "Dieta o preferencia",
      any: "Cualquiera",
      all: "Todas",
      openNow: "Abierto ahora",
      family: "Familiar",
      diet: "Preferencias",
      apply: "Aplicar filtros",
      reset: "Restablecer",
      active: "Filtros activos",
      backLanding: "Inicio Restaurantes",
      eyebrow: "Leonix · Clasificados",
      nearHonest: "Cerca de mí: añade ciudad o código postal para acotar mejor.",
      sectionCuisine: "Cocina",
      sectionLocation: "Ubicación",
      sectionService: "Servicio",
      sectionPrice: "Precio",
      sectionStyle: "Tipo de negocio",
      sectionMore: "Más filtros",
      biz: "Tipo de negocio",
      hl: "Ambiente o sello",
      flagMoving: "Vendedor móvil",
      flagHome: "Desde casa",
      flagTruck: "Food truck",
      flagPopUp: "Pop-up",
      savedOnly: "Solo guardados",
      savedPrivacy: "Activa personalización en cookies para filtrar favoritos guardados.",
      useLocation: "Usar mi ubicación",
      useLocationHelp: "Solo al pulsar: aproximamos la ciudad; no guardamos GPS preciso por defecto.",
      clearAll: "Limpiar todo",
      nearReserved: "Cerca de mí",
      cookiePrefs: "Preferencias de cookies",
      saveListingAria: "Guardar restaurante en este dispositivo",
      unsaveListingAria: "Quitar de guardados",
      publishFlashTitle: "Publicación registrada",
      publishFlashBody:
        "Si Supabase está configurado, el listado ya está guardado. Ajusta filtros si aún no aparece en esta vista.",
      publishFlashDismiss: "Cerrar aviso",
      resultNarrowInResults: "Misma búsqueda en resultados",
      neighborhood: "Colonia o barrio",
      reservationsOnly: "Acepta reservas",
      preorderOnly: "Requiere pedido anticipado",
      pickupOnly: "Recogida disponible",
      promotedOnly: "Solo destacados",
      verifiedOnly: "Solo verificados Leonix",
      deliveryRadiusMin: "Radio mín. de entrega (millas)",
      sectionDiet: "Dieta",
      sectionPayments: "Pagos",
      sectionAmbience: "Ambiente",
      sectionAmenities: "Comodidades",
      sectionAccessibility: "Accesibilidad",
      sectionLanguages: "Idiomas",
      sectionExtras: "Extras",
      menuOnly: "Menú disponible",
      socialOnly: "Con redes sociales",
      websiteOnly: "Con sitio web",
      whatsappOnly: "Con WhatsApp",
    };
  }, [lang]);

  const landingHref = appendLangToPath("/clasificados/restaurantes", lang);

  const amenityLabel = useMemo(() => {
    const payments = getRestauranteAmenityGroupMeta("payments");
    const atmosphere = getRestauranteAmenityGroupMeta("atmosphere");
    const amenities = getRestauranteAmenityGroupMeta("amenities");
    const accessibility = getRestauranteAmenityGroupMeta("accessibility");
    const foodOptions = getRestauranteAmenityGroupMeta("foodOptions");
    const meta = {
      payments,
      atmosphere,
      amenities,
      accessibility,
      foodOptions,
    } as const;
    return (group: keyof typeof meta, id: string) =>
      (lang === "en"
        ? meta[group].items.find((x) => x.id === id)?.labelEn
        : meta[group].items.find((x) => x.id === id)?.labelEs) ?? id;
  }, [lang]);

  const filterPanel = (
    <div className="space-y-6">
      <section aria-labelledby="rx-f-cuisine">
        <h3 id="rx-f-cuisine" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionCuisine}
        </h3>
        <div className="mt-2">
          <label className="sr-only" htmlFor="rx-filter-cuisine">
            {t.cuisine}
          </label>
          <select
            id="rx-filter-cuisine"
            className="min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
            value={parsed.cuisine}
            onChange={(e) => pushState(mergeDiscovery(parsed, { cuisine: e.target.value, page: 1 }))}
          >
            <option value="">{t.all}</option>
            {RESTAURANTE_CUISINES.filter((c) => c.key !== "other").map((c) => (
              <option key={c.key} value={c.key}>
                {c.labelEs}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="rx-f-loc">
        <h3 id="rx-f-loc" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionLocation}
        </h3>
        <div className="mt-2 space-y-3">
          <div>
            <label className="text-xs font-semibold text-[color:var(--lx-muted)]" htmlFor="rx-filter-city">
              {t.city}
            </label>
            <input
              id="rx-filter-city"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              defaultValue={parsed.city}
              key={`city-${parsed.city}`}
              onBlur={(e) => pushState(mergeDiscovery(parsed, { city: e.target.value.trim(), page: 1 }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[color:var(--lx-muted)]" htmlFor="rx-filter-zip">
              {t.zip}
            </label>
            <input
              id="rx-filter-zip"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              defaultValue={parsed.zip}
              key={`zip-${parsed.zip}`}
              inputMode="numeric"
              maxLength={5}
              onBlur={(e) =>
                pushState(mergeDiscovery(parsed, { zip: e.target.value.replace(/\D/g, "").slice(0, 5), page: 1 }))
              }
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[color:var(--lx-muted)]" htmlFor="rx-filter-nbh">
              {t.neighborhood}
            </label>
            <input
              id="rx-filter-nbh"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              defaultValue={parsed.neighborhoodQuery}
              key={`nbh-${parsed.neighborhoodQuery}`}
              onBlur={(e) =>
                pushState(mergeDiscovery(parsed, { neighborhoodQuery: e.target.value.trim(), page: 1 }))
              }
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="rx-f-svc">
        <h3 id="rx-f-svc" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionService}
        </h3>
        <div className="mt-2 space-y-3">
          <div>
            <label className="sr-only" htmlFor="rx-filter-svc">
              {t.serviceFull}
            </label>
            <select
              id="rx-filter-svc"
              className="min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              value={parsed.svc}
              onChange={(e) => pushState(mergeDiscovery(parsed, { svc: e.target.value, page: 1 }))}
            >
              <option value="">{t.any}</option>
              <option value="dine_in">{lang === "es" ? "Comer en local" : "Dine-in"}</option>
              <option value="takeout">{lang === "es" ? "Para llevar" : "Takeout"}</option>
              <option value="delivery">{lang === "es" ? "Entrega a domicilio" : "Delivery"}</option>
              <option value="catering">{lang === "es" ? "Catering" : "Catering"}</option>
              <option value="events">{lang === "es" ? "Eventos" : "Events"}</option>
              <option value="meal_prep">{lang === "es" ? "Meal prep" : "Meal prep"}</option>
              <option value="personal_chef">{lang === "es" ? "Chef privado" : "Personal chef"}</option>
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.open}
              onChange={(e) => pushState(mergeDiscovery(parsed, { open: e.target.checked, page: 1 }))}
            />
            {t.openNow}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.reservationsOnly}
              onChange={(e) =>
                pushState(mergeDiscovery(parsed, { reservationsOnly: e.target.checked, page: 1 }))
              }
            />
            {t.reservationsOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.preorderOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { preorderOnly: e.target.checked, page: 1 }))}
            />
            {t.preorderOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.pickupOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { pickupOnly: e.target.checked, page: 1 }))}
            />
            {t.pickupOnly}
          </label>
        </div>
      </section>

      <section aria-labelledby="rx-f-price">
        <h3 id="rx-f-price" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionPrice}
        </h3>
        <div className="mt-2">
          <label className="sr-only" htmlFor="rx-filter-price">
            {t.price}
          </label>
          <select
            id="rx-filter-price"
            className="min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
            value={parsed.price}
            onChange={(e) => pushState(mergeDiscovery(parsed, { price: e.target.value, page: 1 }))}
          >
            <option value="">{t.any}</option>
            {RESTAURANTE_PRICE_LEVELS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.labelEs}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="rx-f-style">
        <h3 id="rx-f-style" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionStyle}
        </h3>
        <div className="mt-2">
          <label className="sr-only" htmlFor="rx-filter-biz">
            {t.biz}
          </label>
          <select
            id="rx-filter-biz"
            className="min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
            value={parsed.biz}
            onChange={(e) =>
              pushState(mergeDiscovery(parsed, { biz: e.target.value as RestaurantesDiscoveryState["biz"], page: 1 }))
            }
          >
            <option value="">{t.any}</option>
            {RESTAURANTE_BUSINESS_TYPES.filter((b) => b.key !== "other").map((b) => (
              <option key={b.key} value={b.key}>
                {b.labelEs}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section aria-labelledby="rx-f-diet">
        <h3 id="rx-f-diet" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionDiet}
        </h3>
        <div className="mt-2 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.family}
              onChange={(e) => pushState(mergeDiscovery(parsed, { family: e.target.checked, page: 1 }))}
            />
            {t.family}
          </label>
          <div>
            <label className="text-xs font-semibold text-[color:var(--lx-muted)]" htmlFor="rx-filter-diet">
              {t.dietFull}
            </label>
            <select
              id="rx-filter-diet"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              value={parsed.diet}
              onChange={(e) =>
                pushState(
                  mergeDiscovery(parsed, {
                    diet: (e.target.value as RestaurantesDiscoveryState["diet"]) || "",
                    page: 1,
                  }),
                )
              }
            >
              <option value="">{t.any}</option>
              <option value="vegan">Vegano (opciones)</option>
              <option value="glutenfree">Sin gluten</option>
              <option value="halal">Halal</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {getRestauranteAmenityGroupMeta("foodOptions").items.map((it) => (
              <label key={it.id} className="flex cursor-pointer items-start gap-2 rounded-[12px] border border-[color:var(--lx-border)]/35 bg-[color:var(--lx-card)] p-2 text-xs font-semibold text-[color:var(--lx-text)]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-[color:var(--lx-border)]/60"
                  checked={parsed.food.includes(it.id)}
                  onChange={() => pushState(mergeDiscovery(parsed, { food: toggleKey(parsed.food, it.id), page: 1 }))}
                />
                <span className="leading-snug">{lang === "en" ? it.labelEn : it.labelEs}</span>
              </label>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="rx-f-payments">
        <h3 id="rx-f-payments" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionPayments}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {getRestauranteAmenityGroupMeta("payments").items.map((it) => (
            <label key={it.id} className="flex cursor-pointer items-start gap-2 rounded-[12px] border border-[color:var(--lx-border)]/35 bg-[color:var(--lx-card)] p-2 text-xs font-semibold text-[color:var(--lx-text)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[color:var(--lx-border)]/60"
                checked={parsed.pay.includes(it.id)}
                onChange={() => pushState(mergeDiscovery(parsed, { pay: toggleKey(parsed.pay, it.id), page: 1 }))}
              />
              <span className="leading-snug">{lang === "en" ? it.labelEn : it.labelEs}</span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="rx-f-ambience">
        <h3 id="rx-f-ambience" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionAmbience}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {getRestauranteAmenityGroupMeta("atmosphere").items.map((it) => (
            <label key={it.id} className="flex cursor-pointer items-start gap-2 rounded-[12px] border border-[color:var(--lx-border)]/35 bg-[color:var(--lx-card)] p-2 text-xs font-semibold text-[color:var(--lx-text)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[color:var(--lx-border)]/60"
                checked={parsed.amb.includes(it.id)}
                onChange={() => pushState(mergeDiscovery(parsed, { amb: toggleKey(parsed.amb, it.id), page: 1 }))}
              />
              <span className="leading-snug">{lang === "en" ? it.labelEn : it.labelEs}</span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="rx-f-amen">
        <h3 id="rx-f-amen" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionAmenities}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {getRestauranteAmenityGroupMeta("amenities").items.map((it) => (
            <label key={it.id} className="flex cursor-pointer items-start gap-2 rounded-[12px] border border-[color:var(--lx-border)]/35 bg-[color:var(--lx-card)] p-2 text-xs font-semibold text-[color:var(--lx-text)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[color:var(--lx-border)]/60"
                checked={parsed.amen.includes(it.id)}
                onChange={() => pushState(mergeDiscovery(parsed, { amen: toggleKey(parsed.amen, it.id), page: 1 }))}
              />
              <span className="leading-snug">{lang === "en" ? it.labelEn : it.labelEs}</span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="rx-f-acc">
        <h3 id="rx-f-acc" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionAccessibility}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {getRestauranteAmenityGroupMeta("accessibility").items.map((it) => (
            <label key={it.id} className="flex cursor-pointer items-start gap-2 rounded-[12px] border border-[color:var(--lx-border)]/35 bg-[color:var(--lx-card)] p-2 text-xs font-semibold text-[color:var(--lx-text)]">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-[color:var(--lx-border)]/60"
                checked={parsed.acc.includes(it.id)}
                onChange={() => pushState(mergeDiscovery(parsed, { acc: toggleKey(parsed.acc, it.id), page: 1 }))}
              />
              <span className="leading-snug">{lang === "en" ? it.labelEn : it.labelEs}</span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="rx-f-langs">
        <h3 id="rx-f-langs" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionLanguages}
        </h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {RESTAURANTE_LANGUAGES.filter((l) => l.key !== "other_lang").map((it) => (
            <label key={it.key} className="flex cursor-pointer items-center gap-2 rounded-[12px] border border-[color:var(--lx-border)]/35 bg-[color:var(--lx-card)] p-2 text-xs font-semibold text-[color:var(--lx-text)]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[color:var(--lx-border)]/60"
                checked={parsed.spoken.includes(it.key)}
                onChange={() => pushState(mergeDiscovery(parsed, { spoken: toggleKey(parsed.spoken, it.key), page: 1 }))}
              />
              <span className="leading-snug">{it.labelEs}</span>
            </label>
          ))}
        </div>
      </section>

      <section aria-labelledby="rx-f-extras">
        <h3 id="rx-f-extras" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionExtras}
        </h3>
        <div className="mt-2 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.menuOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { menuOnly: e.target.checked, page: 1 }))}
            />
            {t.menuOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.socialOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { socialOnly: e.target.checked, page: 1 }))}
            />
            {t.socialOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.websiteOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { websiteOnly: e.target.checked, page: 1 }))}
            />
            {t.websiteOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.whatsappOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { whatsappOnly: e.target.checked, page: 1 }))}
            />
            {t.whatsappOnly}
          </label>
        </div>
      </section>

      <section aria-labelledby="rx-f-more">
        <h3 id="rx-f-more" className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">
          {t.sectionMore}
        </h3>
        <div className="mt-2 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.promotedOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { promotedOnly: e.target.checked, page: 1 }))}
            />
            {t.promotedOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.verifiedOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { verifiedOnly: e.target.checked, page: 1 }))}
            />
            {t.verifiedOnly}
          </label>
          <div>
            <label className="text-xs font-semibold text-[color:var(--lx-muted)]" htmlFor="rx-filter-drm">
              {t.deliveryRadiusMin}
            </label>
            <input
              id="rx-filter-drm"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              placeholder="—"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              defaultValue={parsed.deliveryRadiusMin ?? ""}
              key={`drm-${parsed.deliveryRadiusMin ?? ""}`}
              onBlur={(e) => {
                const raw = e.target.value.trim();
                const n = parseInt(raw, 10);
                pushState(
                  mergeDiscovery(parsed, {
                    deliveryRadiusMin: Number.isFinite(n) && n > 0 ? n : undefined,
                    page: 1,
                  }),
                );
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[color:var(--lx-muted)]" htmlFor="rx-filter-hl">
              {t.hl}
            </label>
            <select
              id="rx-filter-hl"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              value={parsed.hl}
              onChange={(e) => pushState(mergeDiscovery(parsed, { hl: e.target.value, page: 1 }))}
            >
              <option value="">{t.any}</option>
              {RESTAURANTE_HIGHLIGHTS.slice(0, 14).map((h) => (
                <option key={h.key} value={h.key}>
                  {h.labelEs}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.movingVendor}
              onChange={(e) => pushState(mergeDiscovery(parsed, { movingVendor: e.target.checked, page: 1 }))}
            />
            {t.flagMoving}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.homeBasedBusiness}
              onChange={(e) => pushState(mergeDiscovery(parsed, { homeBasedBusiness: e.target.checked, page: 1 }))}
            />
            {t.flagHome}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.foodTruck}
              onChange={(e) => pushState(mergeDiscovery(parsed, { foodTruck: e.target.checked, page: 1 }))}
            />
            {t.flagTruck}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[color:var(--lx-text)]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[color:var(--lx-border)]/60"
              checked={parsed.popUp}
              onChange={(e) => pushState(mergeDiscovery(parsed, { popUp: e.target.checked, page: 1 }))}
            />
            {t.flagPopUp}
          </label>
          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-[color:var(--lx-text)]">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-[color:var(--lx-border)]/60"
                disabled={!leonixPersonalizationAllowed()}
                checked={parsed.saved}
                onChange={(e) => pushState(mergeDiscovery(parsed, { saved: e.target.checked, page: 1 }))}
              />
              <span>
                {t.savedOnly}
                {!leonixPersonalizationAllowed() ? (
                  <span className="mt-1 block text-xs font-normal text-[color:var(--lx-muted)]">
                    {t.savedPrivacy}{" "}
                    <button
                      type="button"
                      className="font-semibold text-[#D97706] underline decoration-[#D97706]/40 underline-offset-2 hover:text-[#b45309]"
                      onClick={() => window.dispatchEvent(new CustomEvent("leonix-consent-preferences"))}
                    >
                      {t.cookiePrefs}
                    </button>
                  </span>
                ) : null}
              </span>
            </label>
          </div>
        </div>
      </section>

      <button
        type="button"
        className="w-full min-h-[48px] rounded-[12px] border border-[color:var(--lx-border)]/40 text-sm font-semibold text-[color:var(--lx-text)]/80 hover:bg-[color:var(--lx-card)]"
        onClick={() =>
          router.push(buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(clearRestaurantesDiscoveryFilters(lang))))
        }
      >
        {t.reset}
      </button>
    </div>
  );

  const activeChips = useMemo(() => {
    const chips: { id: string; label: string; clear: () => void }[] = [];
    if (parsed.q) chips.push({ id: "q", label: `“${parsed.q}”`, clear: () => pushState(mergeDiscovery(parsed, { q: "", page: 1 })) });
    if (parsed.city) chips.push({ id: "city", label: parsed.city, clear: () => pushState(mergeDiscovery(parsed, { city: "", page: 1 })) });
    if (parsed.zip) chips.push({ id: "zip", label: parsed.zip, clear: () => pushState(mergeDiscovery(parsed, { zip: "", page: 1 })) });
    if (parsed.neighborhoodQuery.trim())
      chips.push({
        id: "nbh",
        label: parsed.neighborhoodQuery.trim(),
        clear: () => pushState(mergeDiscovery(parsed, { neighborhoodQuery: "", page: 1 })),
      });
    if (parsed.cuisine)
      chips.push({
        id: "cuisine",
        label: RESTAURANTE_CUISINES.find((c) => c.key === parsed.cuisine)?.labelEs ?? parsed.cuisine,
        clear: () => pushState(mergeDiscovery(parsed, { cuisine: "", page: 1 })),
      });
    if (parsed.biz)
      chips.push({
        id: "biz",
        label: RESTAURANTE_BUSINESS_TYPES.find((b) => b.key === parsed.biz)?.labelEs ?? parsed.biz,
        clear: () => pushState(mergeDiscovery(parsed, { biz: "", page: 1 })),
      });
    if (parsed.svc)
      chips.push({
        id: "svc",
        label: labelForSvcParam(parsed.svc, lang),
        clear: () => pushState(mergeDiscovery(parsed, { svc: "", page: 1 })),
      });
    if (parsed.family) chips.push({ id: "family", label: t.family, clear: () => pushState(mergeDiscovery(parsed, { family: false, page: 1 })) });
    if (parsed.price) {
      const priceLabel = RESTAURANTE_PRICE_LEVELS.find((p) => p.key === parsed.price)?.labelEs ?? parsed.price;
      chips.push({
        id: "price",
        label: priceLabel,
        clear: () => pushState(mergeDiscovery(parsed, { price: "", page: 1 })),
      });
    }
    if (parsed.open) chips.push({ id: "open", label: t.openNow, clear: () => pushState(mergeDiscovery(parsed, { open: false, page: 1 })) });
    if (parsed.reservationsOnly)
      chips.push({
        id: "rsv",
        label: t.reservationsOnly,
        clear: () => pushState(mergeDiscovery(parsed, { reservationsOnly: false, page: 1 })),
      });
    if (parsed.preorderOnly)
      chips.push({
        id: "pre",
        label: t.preorderOnly,
        clear: () => pushState(mergeDiscovery(parsed, { preorderOnly: false, page: 1 })),
      });
    if (parsed.pickupOnly)
      chips.push({
        id: "pku",
        label: t.pickupOnly,
        clear: () => pushState(mergeDiscovery(parsed, { pickupOnly: false, page: 1 })),
      });
    if (parsed.diet) chips.push({ id: "diet", label: parsed.diet, clear: () => pushState(mergeDiscovery(parsed, { diet: "", page: 1 })) });
    for (const id of parsed.food) {
      chips.push({
        id: `food:${id}`,
        label: amenityLabel("foodOptions", id),
        clear: () => pushState(mergeDiscovery(parsed, { food: parsed.food.filter((x) => x !== id), page: 1 })),
      });
    }
    for (const id of parsed.pay) {
      chips.push({
        id: `pay:${id}`,
        label: amenityLabel("payments", id),
        clear: () => pushState(mergeDiscovery(parsed, { pay: parsed.pay.filter((x) => x !== id), page: 1 })),
      });
    }
    for (const id of parsed.amb) {
      chips.push({
        id: `amb:${id}`,
        label: amenityLabel("atmosphere", id),
        clear: () => pushState(mergeDiscovery(parsed, { amb: parsed.amb.filter((x) => x !== id), page: 1 })),
      });
    }
    for (const id of parsed.amen) {
      chips.push({
        id: `amen:${id}`,
        label: amenityLabel("amenities", id),
        clear: () => pushState(mergeDiscovery(parsed, { amen: parsed.amen.filter((x) => x !== id), page: 1 })),
      });
    }
    for (const id of parsed.acc) {
      chips.push({
        id: `acc:${id}`,
        label: amenityLabel("accessibility", id),
        clear: () => pushState(mergeDiscovery(parsed, { acc: parsed.acc.filter((x) => x !== id), page: 1 })),
      });
    }
    for (const id of parsed.spoken) {
      chips.push({
        id: `spoken:${id}`,
        label: RESTAURANTE_LANGUAGES.find((x) => x.key === id)?.labelEs ?? id,
        clear: () => pushState(mergeDiscovery(parsed, { spoken: parsed.spoken.filter((x) => x !== id), page: 1 })),
      });
    }
    if (parsed.menuOnly)
      chips.push({ id: "menu", label: t.menuOnly, clear: () => pushState(mergeDiscovery(parsed, { menuOnly: false, page: 1 })) });
    if (parsed.socialOnly)
      chips.push({
        id: "social",
        label: t.socialOnly,
        clear: () => pushState(mergeDiscovery(parsed, { socialOnly: false, page: 1 })),
      });
    if (parsed.websiteOnly)
      chips.push({
        id: "web",
        label: t.websiteOnly,
        clear: () => pushState(mergeDiscovery(parsed, { websiteOnly: false, page: 1 })),
      });
    if (parsed.whatsappOnly)
      chips.push({
        id: "wa",
        label: t.whatsappOnly,
        clear: () => pushState(mergeDiscovery(parsed, { whatsappOnly: false, page: 1 })),
      });
    if (parsed.hl)
      chips.push({
        id: "hl",
        label: RESTAURANTE_HIGHLIGHTS.find((h) => h.key === parsed.hl)?.labelEs ?? parsed.hl,
        clear: () => pushState(mergeDiscovery(parsed, { hl: "", page: 1 })),
      });
    if (parsed.movingVendor)
      chips.push({ id: "mv", label: t.flagMoving, clear: () => pushState(mergeDiscovery(parsed, { movingVendor: false, page: 1 })) });
    if (parsed.homeBasedBusiness)
      chips.push({ id: "hb", label: t.flagHome, clear: () => pushState(mergeDiscovery(parsed, { homeBasedBusiness: false, page: 1 })) });
    if (parsed.foodTruck)
      chips.push({ id: "ft", label: t.flagTruck, clear: () => pushState(mergeDiscovery(parsed, { foodTruck: false, page: 1 })) });
    if (parsed.popUp) chips.push({ id: "pu", label: t.flagPopUp, clear: () => pushState(mergeDiscovery(parsed, { popUp: false, page: 1 })) });
    if (parsed.promotedOnly)
      chips.push({
        id: "feat",
        label: t.promotedOnly,
        clear: () => pushState(mergeDiscovery(parsed, { promotedOnly: false, page: 1 })),
      });
    if (parsed.verifiedOnly)
      chips.push({
        id: "lxv",
        label: t.verifiedOnly,
        clear: () => pushState(mergeDiscovery(parsed, { verifiedOnly: false, page: 1 })),
      });
    if (parsed.deliveryRadiusMin != null && parsed.deliveryRadiusMin > 0)
      chips.push({
        id: "drm",
        label: `≥${parsed.deliveryRadiusMin} mi`,
        clear: () => pushState(mergeDiscovery(parsed, { deliveryRadiusMin: undefined, page: 1 })),
      });
    if (parsed.top) chips.push({ id: "top", label: t.sortRating, clear: () => pushState(mergeDiscovery(parsed, { top: false, page: 1 })) });
    if (parsed.near)
      chips.push({
        id: "near",
        label: t.nearReserved,
        clear: () => pushState(mergeDiscovery(parsed, { near: false, page: 1 })),
      });
    if (parsed.saved)
      chips.push({ id: "saved", label: t.savedOnly, clear: () => pushState(mergeDiscovery(parsed, { saved: false, page: 1 })) });
    return chips;
  }, [parsed, pushState, t, lang]);

  const locationToolbar = (
    <>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <button
          type="button"
          disabled={geoLoading}
          aria-describedby="rx-geo-help"
          className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-[#D97706]/35 bg-[color:var(--lx-card)] px-4 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#D97706]/55 disabled:opacity-60"
          onClick={async () => {
            setGeoNote(null);
            setGeoLoading(true);
            try {
              const place = await requestCoarsePlaceFromBrowserGeolocation();
              setGeoNote(lang === "es" ? place.noteEs : place.noteEn);
              pushState(
                mergeDiscovery(parsed, {
                  city: place.cityLabel,
                  near: false,
                  page: 1,
                }),
              );
              setLocInput(place.cityLabel);
            } catch {
              setGeoNote(
                lang === "es"
                  ? "No pudimos obtener tu ubicación. Usa ciudad o código postal."
                  : "Could not get your location. Use city or ZIP.",
              );
            } finally {
              setGeoLoading(false);
            }
          }}
        >
          {t.useLocation}
        </button>
        {activeChips.length > 0 ? (
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-[color:var(--lx-border)]/50 px-4 text-sm font-semibold text-[color:var(--lx-text)]/80 hover:bg-[color:var(--lx-section)]"
            onClick={() =>
              router.push(buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(clearRestaurantesDiscoveryFilters(lang))))
            }
          >
            {t.clearAll}
          </button>
        ) : null}
      </div>
      <p id="rx-geo-help" className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">
        {t.useLocationHelp}
      </p>
      {geoNote ? <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{geoNote}</p> : null}
      {parsed.near && !parsed.city?.trim() && !parsed.zip?.trim() ? (
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--lx-muted)]">{t.nearHonest}</p>
      ) : null}
    </>
  );

  const clearHref = buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(clearRestaurantesDiscoveryFilters(lang)));

  return (
    <CategoryStandardResultsPageShell>
    <div className="min-h-screen overflow-x-hidden text-[color:var(--lx-text)]">
      {inventoryBannerNote ? (
        <div className="mx-auto max-w-[1280px] min-w-0 px-4 pt-4 sm:px-5 md:px-5 lg:px-6">
          <p
            className={`rounded-[14px] border px-4 py-3 text-xs leading-relaxed shadow-sm sm:text-sm ${
              inventorySource === "published"
                ? "border-amber-200/90 bg-amber-50/90 text-amber-950"
                : "border-red-300/90 bg-red-50/95 text-red-950"
            }`}
            role="status"
          >
            {inventorySource === "inventory_unavailable" ? <span className="font-semibold">Inventario no disponible: </span> : null}
            {inventorySource === "inventory_query_failed" ? <span className="font-semibold">Error al cargar listados: </span> : null}
            {inventoryBannerNote}
          </p>
        </div>
      ) : null}
      {publishFlash ? (
        <div className="mx-auto max-w-[1280px] min-w-0 px-4 pt-3 sm:px-5 md:px-5 lg:px-6">
          <div className="flex flex-col gap-2 rounded-[14px] border border-emerald-300/80 bg-emerald-50/95 px-4 py-3 text-emerald-950 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">{t.publishFlashTitle}</p>
              <p className="mt-1 text-xs leading-relaxed opacity-90 sm:text-sm">{t.publishFlashBody}</p>
            </div>
            <button
              type="button"
              onClick={() => setDismissPublishFlash(true)}
              className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full border border-emerald-700/25 bg-white/80 px-4 text-xs font-bold text-emerald-900 transition hover:bg-white"
            >
              {t.publishFlashDismiss}
            </button>
          </div>
        </div>
      ) : null}
      <div className="mx-auto max-w-[1280px] min-w-0 px-4 pb-14 pt-3 sm:px-5 sm:pb-16 md:px-5 lg:px-6">
        <CategoryStandardResultsHeader
          lang={lang}
          title={t.title}
          subtitle={lang === "es" ? "Busca y afina en Filtros." : "Search and refine in Filters."}
          backHref={landingHref}
          backLabel={t.backLanding}
          clearHref={clearHref}
          resultCount={sorted.length}
        />

          <form
            onSubmit={onSearchSubmit}
            className="mt-3 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-3 shadow-[0_4px_18px_-14px_rgba(31,36,28,0.1)]"
          >
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-12 sm:items-stretch">
              <div className="relative min-w-0 sm:col-span-5">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder={t.searchPh}
                  className="min-h-[2.5rem] w-full min-w-0 rounded-lg border border-[#D6C7AD] bg-white py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#D97706]/30"
                  autoComplete="off"
                />
              </div>
              <div className="relative min-w-0 sm:col-span-3">
                <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--lx-muted)]" aria-hidden />
                <input
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  placeholder={t.locationPh}
                  className="min-h-[2.5rem] w-full min-w-0 rounded-lg border border-[#D6C7AD] bg-white py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#D97706]/30"
                />
              </div>
            <button
              type="submit"
              className="min-h-[2.5rem] rounded-lg px-6 text-sm font-bold text-white shadow-sm sm:col-span-4"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
            >
              {t.search}
            </button>
          </div>
        </form>

        <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="min-w-0 shrink text-sm leading-snug text-[color:var(--lx-text)]/80">
            <span className="font-semibold text-[color:var(--lx-text)]">{sorted.length}</span>{" "}
            <span className="text-[color:var(--lx-muted)]">{t.resultsMatching}</span>
          </p>
          <div className="flex min-w-0 w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <label className="flex min-w-0 w-full flex-col gap-1.5 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <span className="shrink-0 text-[color:var(--lx-muted)]">{t.sort}</span>
              <select
                aria-label={t.sort}
                className="min-h-[48px] w-full min-w-0 max-w-full rounded-[12px] border border-[color:var(--lx-border)]/40 bg-[color:var(--lx-card)] px-3 py-2 text-sm outline-none transition focus:border-[#D97706]/45 focus:ring-2 focus:ring-[#D97706]/25 sm:w-auto sm:min-w-[min(100%,200px)] md:min-w-[200px]"
                value={parsed.top ? "rating-desc" : parsed.sort}
                onChange={(e) => {
                  const v = e.target.value as RestaurantesDiscoveryState["sort"];
                  pushState(mergeDiscovery(parsed, { sort: v, top: false, page: 1 }));
                }}
              >
                <option value="newest">{t.sortNew}</option>
                <option value="name-asc">{t.sortName}</option>
                <option value="rating-desc">{t.sortRating}</option>
              </select>
            </label>
            <button
              type="button"
              className="inline-flex min-h-[36px] shrink-0 items-center justify-center rounded-full border border-[#D6C7AD] bg-white px-3 py-2 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm hover:bg-[#FAF6EE]"
              onClick={() => setFiltersPanelOpen(true)}
            >
              {t.filters}
            </button>
            <select
              className="min-h-[36px] rounded-full border border-[#D6C7AD] bg-white px-3 py-1.5 text-xs font-medium"
              value={perPage}
              onChange={(e) => pushState(mergeDiscovery(parsed, { perPage: Number(e.target.value), page: 1 }))}
              aria-label={lang === "es" ? "Mostrar por página" : "Per page"}
            >
              {CAT_STD_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center rounded-full border border-[#D6C7AD] bg-white px-3 py-2 text-xs font-semibold hover:bg-[#FAF6EE]"
              onClick={() =>
                router.push(buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(clearRestaurantesDiscoveryFilters(lang))))
              }
            >
              {t.clearAll}
            </button>
          </div>
        </div>
        {locationToolbar}

        {activeChips.length ? (
          <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="shrink-0 text-xs font-semibold text-[color:var(--lx-muted)]">{t.active}:</span>
            <div className="-mx-1 flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {activeChips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={c.clear}
                  className="inline-flex min-h-[40px] max-w-[min(100%,280px)] shrink-0 items-center gap-1 overflow-hidden text-ellipsis rounded-full border border-[#D97706]/35 bg-[color:var(--lx-section)] px-3 text-left text-xs font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-canvas)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50 sm:max-w-none"
                >
                  <span className="truncate">{c.label}</span> <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 min-w-0">
          <div className="min-w-0">
            {destacadosRows.length > 0 ? (
              <div className="mb-4 sm:mb-5">
                <RestaurantesDestacadosSection
                  rows={destacadosRows}
                  lang={lang}
                  id="restaurantes-res-destacados"
                />
              </div>
            ) : null}

            {shown.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[color:var(--lx-border)]/50 bg-[color:var(--lx-section)] px-5 py-10 text-center sm:px-8 sm:py-14 md:px-10">
                <p className="font-serif text-lg font-semibold text-[color:var(--lx-text)]">{t.emptyTitle}</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[color:var(--lx-muted)]">{t.emptyBody}</p>
                <Link
                  href={landingHref}
                  className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-[#D97706]/45 bg-[color:var(--lx-card)] px-6 text-sm font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:border-[#D97706]/65 hover:bg-[color:var(--lx-section)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50"
                >
                  {t.emptyCta}
                </Link>
              </div>
            ) : (
              <ul className="flex list-none w-full min-w-0 flex-col gap-3 sm:gap-4">
                {shown.map((row) => (
                  <li key={row.id} className="min-w-0 w-full">
                    <RestaurantePublishedListingCard
                      row={row}
                      lang={lang}
                      cta={t.verMas}
                      narrowLabel={t.resultNarrowInResults}
                    />
                  </li>
                ))}
              </ul>
            )}

            {pageCount > 1 ? (
              <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label={lang === "es" ? "Paginación" : "Pagination"}>
                {currentPage > 1 ? (
                  <Link
                    href={buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(mergeDiscovery(parsed, { page: currentPage - 1 })))}
                    className="rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2 text-sm font-semibold hover:bg-[#FAF6EE]"
                  >
                    {lang === "es" ? "Anterior" : "Previous"}
                  </Link>
                ) : null}
                <span className="text-sm text-[color:var(--lx-muted)]">
                  {lang === "es" ? `Página ${currentPage} de ${pageCount}` : `Page ${currentPage} of ${pageCount}`}
                </span>
                {currentPage < pageCount ? (
                  <Link
                    href={buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(mergeDiscovery(parsed, { page: currentPage + 1 })))}
                    className="rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-2 text-sm font-semibold hover:bg-[#FAF6EE]"
                  >
                    {lang === "es" ? "Siguiente" : "Next"}
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </div>
        </div>
      </div>

      {filtersPanelOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={t.filters}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t.close}
            onClick={() => setFiltersPanelOpen(false)}
          />
          <div className="relative z-[51] max-h-[85vh] w-full overflow-y-auto rounded-t-[20px] bg-[color:var(--lx-page)] p-5 pb-8 shadow-2xl sm:max-w-2xl sm:rounded-2xl sm:pb-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-lg font-semibold">{t.filters}</p>
              <button type="button" className="min-h-[44px] px-3 text-sm font-semibold text-[#D97706]" onClick={() => setFiltersPanelOpen(false)}>
                {t.close}
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      ) : null}
    </div>
    </CategoryStandardResultsPageShell>
  );
}
