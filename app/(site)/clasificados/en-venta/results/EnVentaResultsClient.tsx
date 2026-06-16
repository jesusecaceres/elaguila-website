"use client";

/**
 * En Venta results — browse contract (defaults):
 * - Data: Supabase `listings` rows with `category=en-venta`, `status=active`, `is_published!==false`,
 *   filtered client-side by `isEnVentaListingPubliclyVisible` (same rule as public detail).
 * - Default sort (`sort=newest` or absent): **newest recency first** using
 *   `coalesce(republished_at, published_at, created_at)` (via `republish_sort_at` when selected).
 *   Pro “featured” rail (up to `PROMO_CAP` rows) uses staff/`Leonix:promoted` placement, not republish ordering.
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { leonixPromotedFromDetailPairs } from "@/app/(site)/dashboard/lib/dashboardListingMeta";
import { isListingSaved, onSavedListingsChange, toggleListingSaved } from "@/app/clasificados/components/savedListings";
import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
import {
  enVentaPublicLabel,
  enVentaSearchPlaceholder,
} from "../shared/constants/enVentaPublicLabels";
import { EN_VENTA_SUBCATEGORY_ROWS } from "../taxonomy/subcategories";
import { mapDbRowToEnVentaAnuncioDTO } from "../mapping/mapDbRowToEnVentaListingData";
import { inferEnVentaDeptFromSubKey } from "../mapping/enVentaInferDeptFromSub";
import {
  EN_VENTA_SORT_OPTIONS,
  enVentaConditionFilterOptions,
  enVentaDepartmentFilterOptions,
} from "../filters/enVentaFilterGroups";
import { buildEnVentaResultsUrl, EN_VENTA_RESULTS_PATH } from "../shared/constants/enVentaResultsRoutes";
import { getCityZips } from "@/app/data/locations/californiaLocationHelpers";
import { listingMatchesCityFilter, listingMatchesZipFilter } from "./utils/enVentaLocationMatch";
import { nearestCanonicalCityFromLatLng } from "./utils/enVentaNearestCity";
import { EV_RESULTS_PARAM } from "./contracts/enVentaResultsUrlParams";
import { EnVentaResultsEmpty } from "./EnVentaResultsEmpty";
import { EnVentaResultsChipsRow } from "./components/EnVentaResultsChipsRow";
import { EnVentaResultsFiltersDrawer } from "./components/EnVentaResultsFiltersDrawer";
import { EnVentaResultsListingSections } from "./components/EnVentaResultsListingSections";
import {
  buildLocationSummaryLine,
  buildSearchSummaryLine,
  catalogSectionSubtitle,
  catalogSectionTitle,
  featuredOnlyBanner,
} from "./utils/enVentaResultsSummary";
import { buildEnVentaListingDetailHrefFromResults } from "./utils/enVentaListingLinks";
import {
  EN_VENTA_PER_PAGE_OPTIONS,
  enVentaPerPageToParam,
  parseEnVentaPerPage,
} from "./utils/enVentaPerPage";
import { enVentaQueryMatchesListing } from "./utils/buildEnVentaSearchText";
import type { EnVentaAnuncioDTO } from "../shared/types/enVentaListing.types";
import { isEnVentaListingPubliclyVisible } from "../lib/enVentaListingVisibility";
import { queryEnVentaBrowseListings } from "../lib/enVentaListingPublicSelect";
import { EN_VENTA_HUB_CITY_PRESETS } from "../enVentaHubCityPresets";

type Lang = "es" | "en";
type SortId = "newest" | "price-asc" | "price-desc";

const PROMO_CAP = 2;
const VIEW_PREF_KEY = "en-venta-results-view";

type RowPack = {
  row: Record<string, unknown>;
  dto: EnVentaAnuncioDTO;
  priceNum: number;
  /** Staff / Leonix promoted spotlight — not republish ordering. */
  featuredHighlight: boolean;
  effectiveDept: string | null;
};

function priceNumFromRow(row: Record<string, unknown>): number {
  if (row.is_free === true) return 0;
  const raw = row.price;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return Number(String(raw ?? "").replace(/[^0-9.]/g, "")) || 0;
}

function isFeaturedPlacement(row: Record<string, unknown>): boolean {
  return Boolean(row.admin_promoted) || leonixPromotedFromDetailPairs(row.detail_pairs);
}

function listingRecencyMs(row: Record<string, unknown>): number {
  const raw = row.republish_sort_at ?? row.republished_at ?? row.published_at ?? row.created_at;
  return new Date(String(raw ?? 0)).getTime();
}
function resolveEffectiveDept(dto: EnVentaAnuncioDTO): string | null {
  const dk = (dto.departmentKey ?? "").trim();
  if (dk) {
    if (EN_VENTA_DEPARTMENTS.some((d) => d.key === dk)) return dk;
    const byLabel = EN_VENTA_DEPARTMENTS.find((d) => d.label.es === dk || d.label.en === dk);
    if (byLabel) return byLabel.key;
  }
  return inferEnVentaDeptFromSubKey(dto.subKey);
}

export function EnVentaResultsClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const q = (sp?.get("q") ?? "").trim();
  const evDept = (sp?.get("evDept") ?? "").trim();
  const evSub = (sp?.get("evSub") ?? "").trim();
  const city = (sp?.get("city") ?? "").trim();
  const zip = (sp?.get("zip") ?? "").trim();
  const featuredOnly = sp?.get(EV_RESULTS_PARAM.featured) === "1";
  const cond = (sp?.get("cond") ?? "").trim();
  const priceMin = sp?.get("priceMin") ?? "";
  const priceMax = sp?.get("priceMax") ?? "";
  const pickup = sp?.get("pickup") === "1";
  const ship = sp?.get("ship") === "1";
  const delivery = sp?.get("delivery") === "1";
  const seller = (sp?.get("seller") ?? "").trim();
  const freeOnly = sp?.get(EV_RESULTS_PARAM.free) === "1";
  const negotiableOnly = sp?.get(EV_RESULTS_PARAM.nego) === "1";
  const meetupOnly = sp?.get(EV_RESULTS_PARAM.meetup) === "1";
  const sort = (sp?.get("sort") ?? "newest") as SortId;
  const view = sp?.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(sp?.get("page") ?? "1") || 1);
  const perPage = parseEnVentaPerPage(sp?.get(EV_RESULTS_PARAM.perPage));

  const [rows, setRows] = useState<RowPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [, setFavTick] = useState(0);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  useEffect(() => {
    if (!filtersPanelOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersPanelOpen]);

  useEffect(() => {
    if (!filtersPanelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFiltersPanelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersPanelOpen]);

  useEffect(() => {
    return onSavedListingsChange(() => setFavTick((t) => t + 1));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data, error } = await queryEnVentaBrowseListings(supabase);

        if (cancelled) return;
        if (error) {
          setLoadErr(error.message);
          setRows([]);
          setLoading(false);
          return;
        }

        const packs: RowPack[] = [];
        for (const raw of data ?? []) {
          const row = raw as Record<string, unknown>;
          if (!isEnVentaListingPubliclyVisible(row)) continue;
          try {
            const dto = mapDbRowToEnVentaAnuncioDTO(row);
            if (!dto.id) continue;
            const effectiveDept = resolveEffectiveDept(dto);
            packs.push({
              row,
              dto,
              priceNum: priceNumFromRow(row),
              featuredHighlight: isFeaturedPlacement(row),
              effectiveDept,
            });
          } catch {
            /* skip bad row */
          }
        }
        setRows(packs);
      } catch (e: unknown) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const cityFilterOn = Boolean(city.trim());
    let list = rows.filter(({ dto, effectiveDept, priceNum, row }) => {
      if (!enVentaQueryMatchesListing(q, dto, effectiveDept)) return false;
      if (freeOnly && !row.is_free) return false;
      if (negotiableOnly && !dto.negotiable) return false;
      if (meetupOnly && !dto.meetupOffered) return false;
      if (evDept && effectiveDept !== evDept) return false;
      if (evSub && (dto.subKey ?? "").trim() !== evSub) return false;
      const cityOk = listingMatchesCityFilter(dto.city, city);
      if (cityFilterOn && !cityOk) return false;
      if (!listingMatchesZipFilter(dto.zip, zip, cityFilterOn, cityOk)) return false;
      if (cond && (dto.conditionKey ?? "").trim().toLowerCase() !== cond.toLowerCase()) return false;
      if (pickup && !dto.fulfillment.pickup) return false;
      if (ship && !dto.fulfillment.shipping) return false;
      if (delivery && !dto.fulfillment.delivery) return false;
      if (seller === "business" && dto.sellerKind !== "business") return false;
      if (seller === "individual" && dto.sellerKind !== "individual") return false;

      const pMin = priceMin.trim() ? Number(priceMin.replace(/[^0-9.]/g, "")) : null;
      const pMax = priceMax.trim() ? Number(priceMax.replace(/[^0-9.]/g, "")) : null;
      if (pMin != null && Number.isFinite(pMin) && priceNum < pMin) return false;
      if (pMax != null && Number.isFinite(pMax) && priceNum > pMax) return false;

      return true;
    });

    if (featuredOnly) {
      list = list.filter((p) => p.featuredHighlight);
    }

    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.priceNum - b.priceNum;
      if (sort === "price-desc") return b.priceNum - a.priceNum;
      const ta = listingRecencyMs(a.row);
      const tb = listingRecencyMs(b.row);
      return tb - ta;
    });

    return list;
  }, [
    rows,
    q,
    evDept,
    evSub,
    city,
    zip,
    featuredOnly,
    cond,
    pickup,
    ship,
    delivery,
    seller,
    priceMin,
    priceMax,
    sort,
    freeOnly,
    negotiableOnly,
    meetupOnly,
  ]);

  const promotedPool = useMemo(() => {
    if (featuredOnly) return [];
    return filtered.filter((p) => p.featuredHighlight).slice(0, PROMO_CAP);
  }, [filtered, featuredOnly]);

  const promotedIds = useMemo(() => new Set(promotedPool.map((p) => p.dto.id)), [promotedPool]);

  const restFiltered = useMemo(() => {
    if (featuredOnly) return filtered;
    return filtered.filter((p) => !promotedIds.has(p.dto.id));
  }, [filtered, featuredOnly, promotedIds]);

  const total = filtered.length;
  const totalRest = restFiltered.length;
  const pageCount = Math.max(1, Math.ceil(totalRest / perPage));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * perPage;
  const standardSlice = restFiltered.slice(startIdx, startIdx + perPage);

  const t = {
    es: {
      title: enVentaPublicLabel("es"),
      count: (a: number, b: number, tot: number) => `Mostrando ${a} – ${b} de ${tot} resultados`,
      searchPh: enVentaSearchPlaceholder("es"),
      cityPh: "Ciudad",
      sort: "Ordenar",
      go: "Buscar",
      grid: "Cuadrícula",
      list: "Lista",
      latest: "Más recientes",
      promoted: "Recién refrescados",
      loading: "Cargando…",
      err: "No se pudieron cargar los anuncios.",
      page: (p: number, pc: number) => `Página ${p} de ${pc}`,
      radius: "Distancia",
      km: "km",
      filters: "Filtros",
      priceMin: "Precio mín",
      priceMax: "Precio máx",
      dept: "Departamento",
      sub: "Subcategoría",
      seller: "Vendedor",
      all: "Todos",
      ind: "Particular",
      biz: "Negocio",
      trust: "Comunidad Leonix · anuncios moderados · contacto directo",
      zip: "CP / ZIP",
      featuredMode: "Solo recién refrescados",
      clearAll: "Limpiar filtros",
      useLocation: "Usar mi ubicación",
      geoDenied: "Permiso denegado — elige ciudad o CP manualmente.",
      geoUnavailable: "Ubicación no disponible.",
      geoNeedHttps: "Usa HTTPS para compartir ubicación.",
      filtersOpen: "Filtros",
      close: "Cerrar",
      activeFilters: "Filtros activos",
      privacyNote:
        "La ubicación solo se usa si la solicitas; no guardamos tu posición exacta en el servidor.",
      applyFilters: "Aplicar filtros",
      mapRadiusSoon: "Mapa / radio (aún no disponible — no filtra resultados)",
      mapRadiusBody:
        "El refinamiento por distancia real vendrá con mapa; esta sección es informativa. Ciudad y CP sí filtran cuando el anuncio tiene esos datos.",
      groupSearchLoc: "Buscar y ubicación",
      groupSortView: "Orden, vista y refresco",
      groupRefine: "Refinar listado",
      cityZipHelp: "Ciudad o CP de 5 dígitos; filtra por lo que guardaron los anuncios.",
      refineIntro: "Categoría, precio y entrega",
      freeOnly: "Solo gratis / regalo",
      negoOnly: "Solo negociables",
      meetupOnly: "Solo con encuentro",
      viewLabel: "Vista",
      standardEngineLine:
        "Listado principal: respeta tus filtros y la página; no repite los recién refrescados de arriba.",
      perPage: "Mostrar",
      perPageSuffix: "por página",
    },
    en: {
      title: enVentaPublicLabel("en"),
      count: (a: number, b: number, tot: number) => `Showing ${a} – ${b} of ${tot} results`,
      searchPh: enVentaSearchPlaceholder("en"),
      cityPh: "City",
      sort: "Sort",
      go: "Search",
      grid: "Grid",
      list: "List",
      latest: "Latest",
      promoted: "Recently refreshed",
      loading: "Loading…",
      err: "Could not load listings.",
      page: (p: number, pc: number) => `Page ${p} of ${pc}`,
      radius: "Distance",
      km: "km",
      filters: "Filters",
      priceMin: "Min price",
      priceMax: "Max price",
      dept: "Department",
      sub: "Subcategory",
      seller: "Seller",
      all: "All",
      ind: "Individual",
      biz: "Business",
      trust: "Leonix community · moderated listings · direct contact",
      zip: "ZIP",
      featuredMode: "Recently refreshed only",
      clearAll: "Clear filters",
      useLocation: "Use my location",
      geoDenied: "Permission denied — choose city or ZIP manually.",
      geoUnavailable: "Location not available.",
      geoNeedHttps: "Use HTTPS to share location.",
      filtersOpen: "Filters",
      close: "Close",
      activeFilters: "Active filters",
      privacyNote: "Location is only used when you ask; we do not store your precise position on the server.",
      applyFilters: "Apply filters",
      mapRadiusSoon: "Map / radius (not available yet — does not filter)",
      mapRadiusBody:
        "True distance search will ship with a map; this panel is informational only. City and ZIP filter when listings store them.",
      groupSearchLoc: "Search & location",
      groupSortView: "Sort, view & refresh",
      groupRefine: "Refine listings",
      cityZipHelp: "City or 5-digit ZIP; filters match what listings stored.",
      refineIntro: "Category, price & fulfillment",
      freeOnly: "Free / gift only",
      negoOnly: "Negotiable only",
      meetupOnly: "Meetup offered",
      viewLabel: "View",
      standardEngineLine:
        "Main feed: honors your filters and page; recently refreshed listings above are not duplicated here.",
      perPage: "Show",
      perPageSuffix: "per page",
    },
  }[lang];

  const pushParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const sp2 = new URLSearchParams();
      sp2.set("lang", lang);
      const merged: Record<string, string | undefined> = {
        q: q || undefined,
        evDept: evDept || undefined,
        evSub: evSub || undefined,
        city: city || undefined,
        zip: zip || undefined,
        cond: cond || undefined,
        priceMin: priceMin || undefined,
        priceMax: priceMax || undefined,
        pickup: pickup ? "1" : undefined,
        ship: ship ? "1" : undefined,
        delivery: delivery ? "1" : undefined,
        seller: seller || undefined,
        free: freeOnly ? "1" : undefined,
        nego: negotiableOnly ? "1" : undefined,
        meetup: meetupOnly ? "1" : undefined,
        sort,
        view,
        page: String(safePage),
        perPage: enVentaPerPageToParam(perPage),
        featured: featuredOnly ? "1" : undefined,
        ...next,
      };
      for (const [k, v] of Object.entries(merged)) {
        if (v != null && v !== "") sp2.set(k, v);
      }
      router.push(`${EN_VENTA_RESULTS_PATH}?${sp2.toString()}`);
    },
    [
      router,
      lang,
      q,
      evDept,
      evSub,
      city,
      zip,
      featuredOnly,
      cond,
      priceMin,
      priceMax,
      pickup,
      ship,
      delivery,
      seller,
      freeOnly,
      negotiableOnly,
      meetupOnly,
      sort,
      view,
      safePage,
      perPage,
    ]
  );

  const onSubmitSearch = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const el = formEvent.currentTarget;
    const fd = new FormData(el);
    const pickupOn = (el.elements.namedItem("pickup") as HTMLInputElement | null)?.checked ?? false;
    const shipOn = (el.elements.namedItem("ship") as HTMLInputElement | null)?.checked ?? false;
    const deliveryOn = (el.elements.namedItem("delivery") as HTMLInputElement | null)?.checked ?? false;
    const freeOn = (el.elements.namedItem("free") as HTMLInputElement | null)?.checked ?? false;
    const negoOn = (el.elements.namedItem("nego") as HTMLInputElement | null)?.checked ?? false;
    const meetupOn = (el.elements.namedItem("meetupFilter") as HTMLInputElement | null)?.checked ?? false;
    const featuredOn = fd.get("featured") === "on" || fd.get("featured") === "1";
    pushParams({
      q: String(fd.get("q") ?? "").trim() || undefined,
      city: String(fd.get("city") ?? "").trim() || undefined,
      zip: String(fd.get("zip") ?? "").trim() || undefined,
      sort,
      view: String(fd.get("view") ?? view),
      perPage: enVentaPerPageToParam(perPage),
      evDept: String(fd.get("evDept") ?? "").trim() || undefined,
      evSub: String(fd.get("evSub") ?? "").trim() || undefined,
      cond: String(fd.get("cond") ?? "").trim() || undefined,
      priceMin: String(fd.get("priceMin") ?? "").trim() || undefined,
      priceMax: String(fd.get("priceMax") ?? "").trim() || undefined,
      pickup: pickupOn ? "1" : undefined,
      ship: shipOn ? "1" : undefined,
      delivery: deliveryOn ? "1" : undefined,
      seller: String(fd.get("seller") ?? "").trim() || undefined,
      free: freeOn ? "1" : undefined,
      nego: negoOn ? "1" : undefined,
      meetup: meetupOn ? "1" : undefined,
      featured: featuredOn ? "1" : undefined,
      page: "1",
    });
  };

  const resetFilters = () => {
    router.push(buildEnVentaResultsUrl(lang));
  };

  const applyViewPreference = useCallback(
    (v: "grid" | "list") => {
      try {
        localStorage.setItem(VIEW_PREF_KEY, v);
      } catch {
        /* ignore */
      }
      pushParams({ view: v, page: "1" });
    },
    [pushParams]
  );

  const applySort = useCallback(
    (nextSort: SortId) => {
      pushParams({ sort: nextSort, page: "1" });
    },
    [pushParams]
  );

  const applyPerPage = useCallback(
    (nextPerPage: number) => {
      pushParams({ perPage: enVentaPerPageToParam(nextPerPage), page: "1" });
    },
    [pushParams]
  );

  const onUseMyLocation = useCallback(() => {
    setGeoHint(null);
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoHint(lang === "es" ? "Ubicación no disponible." : "Location not available.");
      return;
    }
    if (!window.isSecureContext) {
      setGeoHint(lang === "es" ? "Usa HTTPS para compartir ubicación." : "Use HTTPS to share location.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const cityGuess = nearestCanonicalCityFromLatLng(pos.coords.latitude, pos.coords.longitude);
        if (!cityGuess) {
          setGeoHint(lang === "es" ? "No se pudo aproximar una ciudad." : "Could not approximate a city.");
          return;
        }
        const zips = getCityZips(cityGuess);
        const zipGuess = zips[0];
        pushParams({ city: cityGuess, zip: zipGuess || undefined, page: "1" });
      },
      () =>
        setGeoHint(
          lang === "es"
            ? "Permiso denegado — elige ciudad o CP manualmente."
            : "Permission denied — choose city or ZIP manually."
        ),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 }
    );
  }, [lang, pushParams]);

  const deptOptions = enVentaDepartmentFilterOptions(lang);
  const condOptions = enVentaConditionFilterOptions(lang);
  const subOptions = EN_VENTA_SUBCATEGORY_ROWS.filter((r) => !evDept || r.dept === evDept);

  const activeChips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];
    const rm = (patch: Record<string, string | undefined>) => pushParams({ ...patch, page: "1" });
    if (q.trim()) out.push({ key: "q", label: `“${q.trim()}”`, onRemove: () => rm({ q: undefined }) });
    if (city.trim())
      out.push({
        key: "city",
        label: `${lang === "es" ? "Ciudad" : "City"}: ${city}`,
        onRemove: () => rm({ city: undefined }),
      });
    if (zip.trim()) out.push({ key: "zip", label: `ZIP: ${zip}`, onRemove: () => rm({ zip: undefined }) });
    if (evDept) {
      const dn = EN_VENTA_DEPARTMENTS.find((d) => d.key === evDept)?.label[lang] ?? evDept;
      out.push({
        key: "evDept",
        label: dn,
        onRemove: () => rm({ evDept: undefined, evSub: undefined }),
      });
    }
    if (evSub) {
      const sn = subOptions.find((s) => s.key === evSub)?.label[lang] ?? evSub;
      out.push({ key: "evSub", label: sn, onRemove: () => rm({ evSub: undefined }) });
    }
    if (cond) {
      const cn = condOptions.find((c) => c.value === cond)?.label ?? cond;
      out.push({ key: "cond", label: cn, onRemove: () => rm({ cond: undefined }) });
    }
    if (seller === "individual") out.push({ key: "seller", label: t.ind, onRemove: () => rm({ seller: undefined }) });
    if (seller === "business") out.push({ key: "seller", label: t.biz, onRemove: () => rm({ seller: undefined }) });
    if (pickup) out.push({ key: "pickup", label: lang === "es" ? "Recogida" : "Pickup", onRemove: () => rm({ pickup: undefined }) });
    if (ship) out.push({ key: "ship", label: lang === "es" ? "Envío" : "Shipping", onRemove: () => rm({ ship: undefined }) });
    if (delivery)
      out.push({
        key: "delivery",
        label: lang === "es" ? "Entrega local" : "Local delivery",
        onRemove: () => rm({ delivery: undefined }),
      });
    if (freeOnly) out.push({ key: "free", label: t.freeOnly, onRemove: () => rm({ free: undefined }) });
    if (negotiableOnly) out.push({ key: "nego", label: t.negoOnly, onRemove: () => rm({ nego: undefined }) });
    if (meetupOnly) out.push({ key: "meetup", label: t.meetupOnly, onRemove: () => rm({ meetup: undefined }) });
    if (priceMin.trim()) out.push({ key: "pmin", label: `≥ ${priceMin}`, onRemove: () => rm({ priceMin: undefined }) });
    if (priceMax.trim()) out.push({ key: "pmax", label: `≤ ${priceMax}`, onRemove: () => rm({ priceMax: undefined }) });
    if (featuredOnly)
      out.push({
        key: "featured",
        label: lang === "es" ? "Solo visibilidad Pro renovada" : "Renewed Pro visibility only",
        onRemove: () => rm({ featured: undefined }),
      });
    return out;
  }, [
    q,
    city,
    zip,
    evDept,
    evSub,
    cond,
    seller,
    pickup,
    ship,
    delivery,
    freeOnly,
    negotiableOnly,
    meetupOnly,
    priceMin,
    priceMax,
    featuredOnly,
    lang,
    pushParams,
    condOptions,
    subOptions,
    t.ind,
    t.biz,
    t.freeOnly,
    t.negoOnly,
    t.meetupOnly,
  ]);

  const countLine =
    total === 0
      ? lang === "es"
        ? "Sin resultados"
        : "No results"
      : featuredOnly
        ? lang === "es"
          ? `${total} anuncio(s) recién refrescado(s)`
          : `${total} recently refreshed listing(s)`
        : t.count(startIdx + 1, Math.min(startIdx + standardSlice.length, totalRest), totalRest) +
          (promotedPool.length
            ? lang === "es"
              ? ` · ${promotedPool.length} refrescado(s)`
              : ` · ${promotedPool.length} refreshed`
            : "");

  const isFav = (id: string) => isListingSaved(id);
  const onFav = (id: string) => {
    toggleListingSaved(id);
    setFavTick((x) => x + 1);
  };

  const searchSummaryLine = buildSearchSummaryLine(q, lang);
  const locationSummaryLine = buildLocationSummaryLine(city, zip, lang);

  const listingHref = useCallback(
    (listingId: string) =>
      buildEnVentaListingDetailHrefFromResults(listingId, lang, sp ?? new URLSearchParams()),
    [lang, sp]
  );

  const swipeHint = lang === "es" ? "Desliza →" : "Swipe →";

  const applyFiltersFromDrawer = () => {
    setFiltersPanelOpen(false);
    (document.getElementById("ev-results-form") as HTMLFormElement | null)?.requestSubmit();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      <main className="relative mx-auto w-full min-w-0 max-w-6xl overflow-x-hidden px-3 pb-12 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <header className="space-y-1 border-b border-[#D6C7AD]/50 pb-3">
          <Link
            href={`/clasificados/en-venta?lang=${lang}`}
            className="inline-flex text-xs font-semibold text-[#556B3E] hover:text-[#7A1E2C] sm:text-sm"
          >
            {lang === "es" ? `← ${enVentaPublicLabel("es")}` : `← ${enVentaPublicLabel("en")}`}
          </Link>
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <h1 className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">{t.title}</h1>
            <p className="text-xs font-semibold text-[#556B3E] sm:text-sm">{loading ? t.loading : countLine}</p>
          </div>
          {searchSummaryLine || locationSummaryLine ? (
            <p className="text-xs text-[#3D3428]/85 sm:text-sm">
              {[searchSummaryLine, locationSummaryLine].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </header>

        <form
          id="ev-results-form"
          onSubmit={onSubmitSearch}
          role="search"
          className="mt-3 w-full rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-2 shadow-[0_4px_18px_-14px_rgba(31,36,28,0.12)] sm:p-3"
        >
          <input type="hidden" name="lang" value={lang} />
          <input type="hidden" name="view" value={view} readOnly />

          <div className="flex flex-col gap-0 overflow-hidden rounded-lg border border-[#D6C7AD] bg-white sm:grid sm:grid-cols-12 sm:items-stretch">
            <label className="flex min-h-[2.5rem] min-w-0 items-center gap-2 px-3 sm:col-span-5">
              <span className="shrink-0 text-[#556B3E]" aria-hidden>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3-3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                name="q"
                type="search"
                defaultValue={q}
                placeholder={t.searchPh}
                aria-label={t.searchPh}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm text-[#1E1810] outline-none"
              />
            </label>
            <label className="flex min-h-[2.5rem] min-w-0 items-center gap-2 border-t border-[#D6C7AD] px-3 sm:col-span-3 sm:border-l sm:border-t-0">
              <input
                name="city"
                type="text"
                list="en-venta-results-city-presets"
                defaultValue={city}
                placeholder={t.cityPh}
                aria-label={t.cityPh}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
              />
              <datalist id="en-venta-results-city-presets">
                {EN_VENTA_HUB_CITY_PRESETS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="flex min-h-[2.5rem] min-w-0 items-center gap-2 border-t border-[#D6C7AD] px-3 sm:col-span-2 sm:border-l sm:border-t-0">
              <span className="text-[#4A6678]" aria-hidden>#</span>
              <input
                name="zip"
                defaultValue={zip}
                placeholder={t.zip}
                inputMode="numeric"
                maxLength={5}
                aria-label={t.zip}
                className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
              />
            </label>
            <div className="border-t border-[#D6C7AD] p-1.5 sm:col-span-2 sm:border-l sm:border-t-0">
              <button
                type="submit"
                className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] hover:bg-[#5e1721] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
              >
                {t.go}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersPanelOpen(true)}
            className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-[#D4E0EA] bg-[#F5F8FB] px-3.5 py-2 text-xs font-semibold text-[#2F4A65] shadow-sm hover:bg-[#E8EEF3] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
            aria-haspopup="dialog"
            aria-expanded={filtersPanelOpen}
          >
            {t.filtersOpen}
          </button>
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="sr-only">{t.sort}</span>
            <select
              value={sort}
              onChange={(e) => applySort(e.target.value as SortId)}
              className="min-h-[36px] max-w-[11rem] rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-medium text-[#2C2416] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
              aria-label={t.sort}
            >
              {EN_VENTA_SORT_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label[lang]}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-[#7A7164] sm:inline">{t.perPage}</span>
            <select
              value={perPage}
              onChange={(e) => applyPerPage(Number(e.target.value))}
              className="min-h-[36px] rounded-full border border-[#E8DFD0] bg-white px-3 py-1.5 text-xs font-medium text-[#2C2416] focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
              aria-label={`${t.perPage} ${t.perPageSuffix}`}
            >
              {EN_VENTA_PER_PAGE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center gap-0.5 rounded-full border border-[#E8DFD0] bg-[#FAF7F2] p-0.5" role="group" aria-label={t.viewLabel}>
            <button
              type="button"
              onClick={() => applyViewPreference("grid")}
              className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 ${
                view === "grid"
                  ? "bg-white text-[#1E1810] shadow-sm ring-1 ring-[#C9A84A]/30"
                  : "text-[#5C5346]"
              }`}
              aria-pressed={view === "grid"}
            >
              {t.grid}
            </button>
            <button
              type="button"
              onClick={() => applyViewPreference("list")}
              className={`rounded-full px-2.5 py-1.5 text-[11px] font-semibold focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 ${
                view === "list"
                  ? "bg-white text-[#1E1810] shadow-sm ring-1 ring-[#C9A84A]/30"
                  : "text-[#5C5346]"
              }`}
              aria-pressed={view === "list"}
            >
              {t.list}
            </button>
          </div>
        </div>

        {activeChips.length > 0 ? (
          <div className="mt-2 w-full">
            <EnVentaResultsChipsRow
              label={t.activeFilters}
              clearLabel={t.clearAll}
              chips={activeChips}
              onClearAll={resetFilters}
              swipeHint={swipeHint}
            />
          </div>
        ) : null}

        <EnVentaResultsFiltersDrawer
          open={filtersPanelOpen}
          lang={lang}
          t={{
            filters: t.filters,
            close: t.close,
            groupRefine: t.groupRefine,
            refineIntro: t.refineIntro,
            dept: t.dept,
            sub: t.sub,
            seller: t.seller,
            all: t.all,
            ind: t.ind,
            biz: t.biz,
            priceMin: t.priceMin,
            priceMax: t.priceMax,
            freeOnly: t.freeOnly,
            negoOnly: t.negoOnly,
            meetupOnly: t.meetupOnly,
            featuredMode: t.featuredMode,
            useLocation: t.useLocation,
            applyFilters: t.applyFilters,
          }}
          evDept={evDept}
          evSub={evSub}
          cond={cond}
          seller={seller}
          priceMin={priceMin}
          priceMax={priceMax}
          pickup={pickup}
          ship={ship}
          delivery={delivery}
          freeOnly={freeOnly}
          negotiableOnly={negotiableOnly}
          meetupOnly={meetupOnly}
          featuredOnly={featuredOnly}
          deptOptions={deptOptions}
          condOptions={condOptions}
          subOptions={subOptions}
          geoHint={geoHint}
          onClose={() => setFiltersPanelOpen(false)}
          onApply={applyFiltersFromDrawer}
          onUseMyLocation={onUseMyLocation}
        />

        {loadErr ? <p className="mt-4 text-center text-sm text-red-700">{t.err}</p> : null}

        {!loading && !loadErr && total === 0 ? (
          <div className="mt-4">
            <EnVentaResultsEmpty lang={lang} onReset={resetFilters} featuredOnly={featuredOnly} />
          </div>
        ) : null}

        {!loading && !loadErr && total > 0 ? (
          <div className="mt-4 w-full sm:mt-5">
            <EnVentaResultsListingSections
              lang={lang}
              featuredOnly={featuredOnly}
              promotedPool={promotedPool}
              standardSlice={standardSlice}
              view={view}
              sort={sort}
              safePage={safePage}
              pageCount={pageCount}
              onPagePrev={() => pushParams({ page: String(Math.max(1, safePage - 1)) })}
              onPageNext={() => pushParams({ page: String(Math.min(pageCount, safePage + 1)) })}
              isFav={isFav}
              onFav={onFav}
              listingHref={listingHref}
              t={{
                promoted: t.promoted,
                featuredMode: t.featuredMode,
                latest: t.latest,
                catalog: catalogSectionTitle(lang),
                catalogSub: catalogSectionSubtitle(lang),
                standardEngineLine: t.standardEngineLine,
                page: t.page,
                featuredBanner: featuredOnlyBanner(lang),
              }}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 text-center text-sm text-[#5C5346]">{t.loading}</div>
        ) : null}

        <p className="mt-8 text-center text-[12px] font-medium tracking-wide text-[#7A7164]">{t.trust}</p>

        <div className="mt-6 text-center">
          <Link href={`/clasificados/en-venta?lang=${lang}`} className="text-sm font-semibold text-[#2A2620] underline">
            {lang === "es"
              ? `← Volver al inicio ${enVentaPublicLabel("es")}`
              : `← Back to ${enVentaPublicLabel("en")} home`}
          </Link>
        </div>
      </main>
    </div>
  );
}
