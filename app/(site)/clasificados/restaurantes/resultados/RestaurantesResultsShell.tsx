"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaHeart, FaMapMarkerAlt, FaSearch, FaStar } from "react-icons/fa";

import Navbar from "@/app/components/Navbar";
import {
  RESTAURANTE_BUSINESS_TYPES,
  RESTAURANTE_CUISINES,
  RESTAURANTE_HIGHLIGHTS,
  RESTAURANTE_PRICE_LEVELS,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import { type RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { filterRestaurantesBlueprintRows, sortRestaurantesBlueprintRows } from "@/app/clasificados/restaurantes/lib/filterRestaurantesBlueprintRows";
import {
  buildRestaurantesResultsHref,
  clearRestaurantesDiscoveryFilters,
  parseRestaurantesResultsSearchParams,
  restaurantesDiscoveryParamsForRowDeepLink,
  restaurantesDiscoveryStateToParams,
  splitLocationInput,
  type RestaurantesDiscoveryLang,
  type RestaurantesDiscoveryState,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import { requestCoarsePlaceFromBrowserGeolocation } from "@/app/clasificados/restaurantes/lib/restaurantesCoarseGeolocation";
import {
  readRestaurantesSavedIds,
  rememberRestaurantesDiscoveryFromState,
  writeRestaurantesSavedIds,
} from "@/app/clasificados/restaurantes/lib/restaurantesFirstPartyPreferences";
import {
  RESTAURANTES_RESULTS_PROMOTED_BAND_MAX,
  selectPromotedResultsCandidates,
} from "@/app/clasificados/restaurantes/lib/restaurantesListingExposurePolicy";
import { leonixPersonalizationAllowed } from "@/app/lib/leonixPublicConsent";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import type { RestaurantesResultsInventorySource } from "@/app/clasificados/restaurantes/lib/restaurantesResultsInventoryServer";

const ACCENT = "#D4A574";
const PAGE_SIZE = 9;

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

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
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
    setVisible(PAGE_SIZE);
  }, [spStr]);

  useEffect(() => {
    setSavedIds(readRestaurantesSavedIds());
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

  const sorted = useMemo(() => sortRestaurantesBlueprintRows(filteredUnsorted, effectiveSort), [filteredUnsorted, effectiveSort]);

  const promotedBand = useMemo(
    () => selectPromotedResultsCandidates(sorted, RESTAURANTES_RESULTS_PROMOTED_BAND_MAX),
    [sorted],
  );
  const promotedIds = useMemo(() => new Set(promotedBand.map((r) => r.id)), [promotedBand]);

  const gridRows = useMemo(() => sorted.filter((r) => !promotedIds.has(r.id)), [sorted, promotedIds]);

  const shown = useMemo(() => gridRows.slice(0, visible), [gridRows, visible]);

  const pushState = useCallback(
    (next: RestaurantesDiscoveryState) => {
      const href = buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(next));
      router.push(href);
    },
    [lang, router],
  );

  const toggleSavedId = useCallback(
    (id: string) => {
      if (!leonixPersonalizationAllowed()) return;
      const next = new Set(savedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeRestaurantesSavedIds(next);
      setSavedIds(next);
    },
    [savedIds],
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
    };
  }, [lang]);

  const landingHref = appendLangToPath("/clasificados/restaurantes", lang);

  const filterPanel = (
    <div className="space-y-6">
      <section aria-labelledby="rx-f-cuisine">
        <h3 id="rx-f-cuisine" className="text-[11px] font-bold uppercase tracking-wide text-[#2D241E]/45">
          {t.sectionCuisine}
        </h3>
        <div className="mt-2">
          <label className="sr-only" htmlFor="rx-filter-cuisine">
            {t.cuisine}
          </label>
          <select
            id="rx-filter-cuisine"
            className="min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
        <h3 id="rx-f-loc" className="text-[11px] font-bold uppercase tracking-wide text-[#2D241E]/45">
          {t.sectionLocation}
        </h3>
        <div className="mt-2 space-y-3">
          <div>
            <label className="text-xs font-semibold text-[#2D241E]/60" htmlFor="rx-filter-city">
              {t.city}
            </label>
            <input
              id="rx-filter-city"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
              defaultValue={parsed.city}
              key={`city-${parsed.city}`}
              onBlur={(e) => pushState(mergeDiscovery(parsed, { city: e.target.value.trim(), page: 1 }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#2D241E]/60" htmlFor="rx-filter-zip">
              {t.zip}
            </label>
            <input
              id="rx-filter-zip"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
            <label className="text-xs font-semibold text-[#2D241E]/60" htmlFor="rx-filter-nbh">
              {t.neighborhood}
            </label>
            <input
              id="rx-filter-nbh"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
        <h3 id="rx-f-svc" className="text-[11px] font-bold uppercase tracking-wide text-[#2D241E]/45">
          {t.sectionService}
        </h3>
        <div className="mt-2 space-y-3">
          <div>
            <label className="sr-only" htmlFor="rx-filter-svc">
              {t.serviceFull}
            </label>
            <select
              id="rx-filter-svc"
              className="min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.open}
              onChange={(e) => pushState(mergeDiscovery(parsed, { open: e.target.checked, page: 1 }))}
            />
            {t.openNow}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.reservationsOnly}
              onChange={(e) =>
                pushState(mergeDiscovery(parsed, { reservationsOnly: e.target.checked, page: 1 }))
              }
            />
            {t.reservationsOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.preorderOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { preorderOnly: e.target.checked, page: 1 }))}
            />
            {t.preorderOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.pickupOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { pickupOnly: e.target.checked, page: 1 }))}
            />
            {t.pickupOnly}
          </label>
        </div>
      </section>

      <section aria-labelledby="rx-f-price">
        <h3 id="rx-f-price" className="text-[11px] font-bold uppercase tracking-wide text-[#2D241E]/45">
          {t.sectionPrice}
        </h3>
        <div className="mt-2">
          <label className="sr-only" htmlFor="rx-filter-price">
            {t.price}
          </label>
          <select
            id="rx-filter-price"
            className="min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
        <h3 id="rx-f-style" className="text-[11px] font-bold uppercase tracking-wide text-[#2D241E]/45">
          {t.sectionStyle}
        </h3>
        <div className="mt-2">
          <label className="sr-only" htmlFor="rx-filter-biz">
            {t.biz}
          </label>
          <select
            id="rx-filter-biz"
            className="min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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

      <section aria-labelledby="rx-f-more">
        <h3 id="rx-f-more" className="text-[11px] font-bold uppercase tracking-wide text-[#2D241E]/45">
          {t.sectionMore}
        </h3>
        <div className="mt-2 space-y-3">
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.promotedOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { promotedOnly: e.target.checked, page: 1 }))}
            />
            {t.promotedOnly}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.verifiedOnly}
              onChange={(e) => pushState(mergeDiscovery(parsed, { verifiedOnly: e.target.checked, page: 1 }))}
            />
            {t.verifiedOnly}
          </label>
          <div>
            <label className="text-xs font-semibold text-[#2D241E]/60" htmlFor="rx-filter-drm">
              {t.deliveryRadiusMin}
            </label>
            <input
              id="rx-filter-drm"
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              placeholder="—"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.family}
              onChange={(e) => pushState(mergeDiscovery(parsed, { family: e.target.checked, page: 1 }))}
            />
            {t.family}
          </label>
          <div>
            <label className="text-xs font-semibold text-[#2D241E]/60" htmlFor="rx-filter-diet">
              {t.dietFull}
            </label>
            <select
              id="rx-filter-diet"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
          <div>
            <label className="text-xs font-semibold text-[#2D241E]/60" htmlFor="rx-filter-hl">
              {t.hl}
            </label>
            <select
              id="rx-filter-hl"
              className="mt-2 min-h-[44px] w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none focus:border-[#D97706]/40 focus:ring-2 focus:ring-[#D97706]/20"
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
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.movingVendor}
              onChange={(e) => pushState(mergeDiscovery(parsed, { movingVendor: e.target.checked, page: 1 }))}
            />
            {t.flagMoving}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.homeBasedBusiness}
              onChange={(e) => pushState(mergeDiscovery(parsed, { homeBasedBusiness: e.target.checked, page: 1 }))}
            />
            {t.flagHome}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.foodTruck}
              onChange={(e) => pushState(mergeDiscovery(parsed, { foodTruck: e.target.checked, page: 1 }))}
            />
            {t.flagTruck}
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#2D241E]">
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-[#2D241E]/20"
              checked={parsed.popUp}
              onChange={(e) => pushState(mergeDiscovery(parsed, { popUp: e.target.checked, page: 1 }))}
            />
            {t.flagPopUp}
          </label>
          <div>
            <label className="flex cursor-pointer items-start gap-3 text-sm font-medium text-[#2D241E]">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 rounded border-[#2D241E]/20"
                disabled={!leonixPersonalizationAllowed()}
                checked={parsed.saved}
                onChange={(e) => pushState(mergeDiscovery(parsed, { saved: e.target.checked, page: 1 }))}
              />
              <span>
                {t.savedOnly}
                {!leonixPersonalizationAllowed() ? (
                  <span className="mt-1 block text-xs font-normal text-[#2D241E]/55">
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
        className="w-full min-h-[48px] rounded-[12px] border border-[#2D241E]/12 text-sm font-semibold text-[#2D241E]/80 hover:bg-[#FFFCF7]"
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
          className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-[#D97706]/35 bg-[#FFFCF7] px-4 text-sm font-semibold text-[#2D241E] shadow-sm transition hover:border-[#D97706]/55 disabled:opacity-60"
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
            className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] border border-[#2D241E]/15 px-4 text-sm font-semibold text-[#2D241E]/85 hover:bg-[#FFFCF7]"
            onClick={() =>
              router.push(buildRestaurantesResultsHref(lang, restaurantesDiscoveryStateToParams(clearRestaurantesDiscoveryFilters(lang))))
            }
          >
            {t.clearAll}
          </button>
        ) : null}
      </div>
      <p id="rx-geo-help" className="mt-2 text-xs leading-relaxed text-[#2D241E]/58">
        {t.useLocationHelp}
      </p>
      {geoNote ? <p className="mt-2 text-xs leading-relaxed text-[#2D241E]/65">{geoNote}</p> : null}
      {parsed.near && !parsed.city?.trim() && !parsed.zip?.trim() ? (
        <p className="mt-2 text-xs leading-relaxed text-[#2D241E]/65">{t.nearHonest}</p>
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FDFBF7] text-[#2D241E]">
      <Navbar />
      {inventoryBannerNote ? (
        <div className="mx-auto max-w-[1280px] min-w-0 px-4 pt-4 sm:px-5 md:px-5 lg:px-6">
          <p
            className={`rounded-[14px] border px-4 py-3 text-xs leading-relaxed shadow-sm sm:text-sm ${
              inventorySource === "inventory_unavailable"
                ? "border-red-300/90 bg-red-50/95 text-red-950"
                : "border-amber-200/90 bg-amber-50/90 text-amber-950"
            }`}
            role="status"
          >
            {inventorySource === "inventory_unavailable" ? <span className="font-semibold">Inventario no disponible: </span> : null}
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
      <div className="mx-auto max-w-[1280px] min-w-0 px-4 pb-16 pt-5 sm:px-5 sm:pb-20 sm:pt-6 md:px-5 lg:px-6">
        <div className="rounded-[18px] border border-[#2D241E]/[0.07] bg-[#FFFCF7]/75 p-4 shadow-sm sm:p-5 md:p-6">
          <div className="flex flex-col gap-3 border-b border-[#2D241E]/10 pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4 sm:pb-5">
            <div className="min-w-0 max-w-full">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#2D241E]/50">{t.eyebrow}</p>
              <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">{t.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#2D241E]/72">{t.subtitle}</p>
              <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#2D241E]/58 sm:text-sm">{t.journeyLine}</p>
              <Link href={landingHref} className="mt-3 inline-flex text-sm font-semibold text-[#D97706] underline-offset-4 hover:underline">
                ← {t.backLanding}
              </Link>
            </div>
          </div>

          <form
            onSubmit={onSearchSubmit}
            className="mt-5 rounded-[18px] border border-[#2D241E]/10 bg-[#FFFCF7] p-4 ring-1 ring-[#D97706]/12 shadow-[0_16px_48px_-28px_rgba(45,36,30,0.35)] sm:mt-6 sm:rounded-[20px] sm:p-5"
          >
          <div className="flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-stretch">
            <div className="grid min-w-0 w-full flex-1 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:contents">
              <div className="relative min-w-0 md:min-w-0 xl:flex-1">
                <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D241E]/40" aria-hidden />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder={t.searchPh}
                  className="min-h-[52px] w-full min-w-0 rounded-[16px] border border-[#2D241E]/12 bg-[#FFFCF7] py-3 pl-10 pr-3 text-sm outline-none transition-shadow ring-[#D97706]/30 focus:ring-2"
                  autoComplete="off"
                />
              </div>
              <div className="relative min-w-0 md:min-w-0 xl:flex-1">
                <FaMapMarkerAlt className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2D241E]/40" aria-hidden />
                <input
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  placeholder={t.locationPh}
                  className="min-h-[52px] w-full min-w-0 rounded-[16px] border border-[#2D241E]/12 bg-[#FFFCF7] py-3 pl-10 pr-3 text-sm outline-none transition-shadow ring-[#D97706]/30 focus:ring-2"
                />
              </div>
            </div>
            <button
              type="submit"
              className="min-h-[52px] w-full shrink-0 rounded-[16px] px-8 text-sm font-bold text-[#FFFCF7] shadow-[0_10px_32px_-12px_rgba(180,83,9,0.55)] touch-manipulation xl:w-[min(100%,200px)] xl:self-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
            >
              {t.search}
            </button>
          </div>
        </form>
        {locationToolbar}
        </div>

        <div className="mt-5 flex min-w-0 flex-col gap-4 sm:mt-6 md:flex-row md:items-start md:justify-between lg:items-center">
          <p className="min-w-0 shrink text-sm leading-snug text-[#2D241E]/80">
            <span className="font-semibold text-[#2D241E]">{sorted.length}</span>{" "}
            <span className="text-[#2D241E]/72">{t.resultsMatching}</span>
          </p>
          <div className="flex min-w-0 w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3">
            <label className="flex min-w-0 w-full flex-col gap-1.5 text-sm sm:w-auto sm:flex-row sm:items-center sm:gap-2">
              <span className="shrink-0 text-[#2D241E]/55">{t.sort}</span>
              <select
                aria-label={t.sort}
                className="min-h-[48px] w-full min-w-0 max-w-full rounded-[12px] border border-[#2D241E]/12 bg-[#FFFCF7] px-3 py-2 text-sm outline-none transition focus:border-[#D97706]/45 focus:ring-2 focus:ring-[#D97706]/25 sm:w-auto sm:min-w-[min(100%,200px)] md:min-w-[200px]"
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
              className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center rounded-[12px] border border-[#2D241E]/15 bg-[#FFFCF7] px-4 text-sm font-semibold text-[#2D241E] shadow-sm transition hover:border-[#D97706]/35 sm:w-auto lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/45 touch-manipulation"
              onClick={() => setMobileFiltersOpen(true)}
            >
              {t.filters}
            </button>
          </div>
        </div>

        {activeChips.length ? (
          <div className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="shrink-0 text-xs font-semibold text-[#2D241E]/50">{t.active}:</span>
            <div className="-mx-1 flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-x-auto px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {activeChips.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={c.clear}
                  className="inline-flex min-h-[40px] max-w-[min(100%,280px)] shrink-0 items-center gap-1 overflow-hidden text-ellipsis rounded-full border border-[#D97706]/35 bg-[#FFF7ED] px-3 text-left text-xs font-semibold text-[#2D241E] transition hover:bg-[#FFEDD5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50 sm:max-w-none"
                >
                  <span className="truncate">{c.label}</span> <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 min-w-0 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-6 xl:gap-8">
          <aside className="mb-6 hidden lg:block">
            <div className="sticky top-24 rounded-[20px] border border-[#2D241E]/10 bg-[#FFFCF7] p-4 shadow-sm xl:p-5">{filterPanel}</div>
          </aside>

          <div className="min-w-0">
            {promotedBand.length ? (
              <section className="mb-6 sm:mb-8" aria-label={t.featured}>
                <div className="mb-2 flex items-center gap-2 sm:mb-3">
                  <FaStar className="h-4 w-4 shrink-0" style={{ color: ACCENT }} aria-hidden />
                  <h2 className="font-serif text-lg font-semibold">{t.featured}</h2>
                </div>
                <p className="mb-3 max-w-2xl text-xs leading-relaxed text-[#2D241E]/60 sm:mb-4">{t.promotedCaption}</p>
                <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden">
                  {promotedBand.map((row) => (
                    <div key={row.id} className="snap-start">
                      <ResultCard
                        row={row}
                        lang={lang}
                        badge={t.promotedBadge}
                        cta={t.verMas}
                        narrowLabel={t.resultNarrowInResults}
                        isSaved={savedIds.has(row.id)}
                        onToggleSave={leonixPersonalizationAllowed() ? () => toggleSavedId(row.id) : undefined}
                        saveAria={t.saveListingAria}
                        unsaveAria={t.unsaveListingAria}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {shown.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#2D241E]/25 bg-gradient-to-b from-[#FFFCF7] to-[#FDFBF7] px-5 py-10 text-center sm:px-8 sm:py-14 md:px-10">
                <p className="font-serif text-lg font-semibold text-[#2D241E]">{t.emptyTitle}</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#2D241E]/72">{t.emptyBody}</p>
                <Link
                  href={landingHref}
                  className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-[14px] border border-[#D97706]/45 bg-[#FFFCF7] px-6 text-sm font-semibold text-[#2D241E] shadow-sm transition hover:border-[#D97706]/65 hover:bg-[#FFF7ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50"
                >
                  {t.emptyCta}
                </Link>
              </div>
            ) : (
              <ul className="grid list-none grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 md:gap-6 lg:grid-cols-3">
                {shown.map((row) => (
                  <li key={row.id}>
                    <ResultCard
                      row={row}
                      lang={lang}
                      cta={t.verMas}
                      narrowLabel={t.resultNarrowInResults}
                      isSaved={savedIds.has(row.id)}
                      onToggleSave={leonixPersonalizationAllowed() ? () => toggleSavedId(row.id) : undefined}
                      saveAria={t.saveListingAria}
                      unsaveAria={t.unsaveListingAria}
                    />
                  </li>
                ))}
              </ul>
            )}

            {gridRows.length > visible ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="min-h-[48px] rounded-[14px] border border-[#2D241E]/15 px-8 text-sm font-semibold text-[#2D241E] hover:bg-[#FFFCF7]"
                  onClick={() => setVisible((v) => v + PAGE_SIZE)}
                >
                  {t.loadMore}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t.filters}>
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t.close}
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] bg-[#FDFBF7] p-5 pb-8 shadow-2xl sm:pb-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-lg font-semibold">{t.filters}</p>
              <button type="button" className="min-h-[44px] px-3 text-sm font-semibold text-[#D97706]" onClick={() => setMobileFiltersOpen(false)}>
                {t.close}
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultCard({
  row,
  lang,
  badge,
  cta,
  narrowLabel,
  isSaved,
  onToggleSave,
  saveAria,
  unsaveAria,
}: {
  row: RestaurantesPublicBlueprintRow;
  lang: RestaurantesDiscoveryLang;
  badge?: string;
  cta: string;
  narrowLabel: string;
  isSaved?: boolean;
  onToggleSave?: () => void;
  saveAria?: string;
  unsaveAria?: string;
}) {
  const narrowHref = buildRestaurantesResultsHref(lang, {
    ...restaurantesDiscoveryParamsForRowDeepLink({
      name: row.name,
      city: row.city,
      zip: row.zip,
      primaryCuisineKey: row.primaryCuisineKey,
      neighborhood: row.neighborhood,
    }),
  });
  const slug = row.slug?.trim();
  const primaryHref = slug
    ? appendLangToPath(`/clasificados/restaurantes/${encodeURIComponent(slug)}`, lang as Lang)
    : narrowHref;
  const showNarrowLink = Boolean(slug);
  return (
    <article
      className={`flex h-full max-w-full flex-col overflow-hidden rounded-[20px] border border-[#2D241E]/[0.09] bg-[#FFFCF7] shadow-[0_12px_40px_-22px_rgba(45,36,30,0.3)] transition-shadow duration-300 hover:shadow-[0_16px_44px_-20px_rgba(45,36,30,0.36)] ${
        badge ? "w-[min(100%,320px)] min-w-[260px] shrink-0 ring-1 ring-[#D97706]/22 sm:w-[300px]" : "w-full min-w-0"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[20px]">
        <Image
          src={row.imageSrc}
          alt=""
          fill
          className="object-cover object-center"
          sizes={badge ? "(max-width:640px) 85vw, 300px" : "(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"}
        />
        {badge ? (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-sm"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
          >
            {badge}
          </span>
        ) : row.promoted ? (
          <span
            className="absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold text-[#FFFCF7] shadow-sm"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
          >
            {lang === "es" ? "Patrocinado" : "Sponsored"}
          </span>
        ) : null}
        {row.leonixVerified ? (
          <span className="absolute right-3 top-3 rounded-full border border-sky-400/80 bg-sky-50/95 px-2 py-0.5 text-[10px] font-bold text-sky-950 shadow-sm backdrop-blur-sm">
            {lang === "es" ? "Verificado" : "Verified"}
          </span>
        ) : null}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <h3 className="break-words font-serif text-lg font-semibold leading-snug text-[#2D241E]">{row.name}</h3>
        <p className="mt-1 text-sm leading-snug text-[#2D241E]/65">{row.cuisineLine}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#2D241E]/55">
          <span className="inline-flex min-w-0 items-center gap-1">
            <FaStar className="h-3.5 w-3.5 shrink-0" style={{ color: ACCENT }} aria-hidden />
            {row.rating.toFixed(1)}
            {row.externalReviewCount != null ? (
              <span className="text-[#2D241E]/45"> ({row.externalReviewCount})</span>
            ) : null}
          </span>
          <span className="opacity-50" aria-hidden>
            ·
          </span>
          <span className="inline-flex min-w-0 items-start gap-1 break-words sm:items-center">
            <FaMapMarkerAlt className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" style={{ color: ACCENT }} aria-hidden />
            <span>
              {row.city}
              {row.zip ? ` · ${row.zip}` : ""}
            </span>
          </span>
        </div>
        <div className="mt-4 border-t border-[#2D241E]/8 pt-4">
          <div className={`flex flex-col gap-2 sm:flex-row ${onToggleSave ? "sm:items-stretch sm:gap-2" : ""}`}>
            {onToggleSave ? (
              <button
                type="button"
                onClick={onToggleSave}
                aria-pressed={Boolean(isSaved)}
                aria-label={isSaved ? unsaveAria : saveAria}
                className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-[14px] border border-[#2D241E]/15 bg-[#FFFCF7] text-[#D97706] shadow-sm transition hover:border-[#D97706]/35 hover:bg-[#FFF7ED] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706]/50"
              >
                <FaHeart className={`h-5 w-5 ${isSaved ? "" : "opacity-40"}`} aria-hidden />
              </button>
            ) : null}
            <div className={`flex min-w-0 flex-col gap-2 ${onToggleSave ? "sm:flex-1" : "w-full"}`}>
              <Link
                href={primaryHref}
                className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] text-sm font-bold text-[#FFFCF7] shadow-[0_8px_22px_-10px_rgba(180,83,9,0.45)] transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D97706] focus-visible:ring-offset-2"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, #c2410c)` }}
              >
                {cta}
              </Link>
              {showNarrowLink ? (
                <Link
                  href={narrowHref}
                  className="text-center text-[11px] font-semibold text-[#D97706] underline-offset-4 hover:underline sm:text-xs"
                >
                  {narrowLabel}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
