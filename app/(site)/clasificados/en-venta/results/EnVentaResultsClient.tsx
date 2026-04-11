"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { isListingSaved, onSavedListingsChange, toggleListingSaved } from "@/app/clasificados/components/savedListings";
import { EN_VENTA_DEPARTMENTS } from "../taxonomy/categories";
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
import newLogo from "../../../../../public/logo.png";
import { EnVentaResultsEmpty } from "./EnVentaResultsEmpty";
import { EnVentaResultsChipsRow } from "./components/EnVentaResultsChipsRow";
import { EnVentaResultsListingSections } from "./components/EnVentaResultsListingSections";
import {
  buildLocationSummaryLine,
  buildSearchSummaryLine,
  catalogSectionSubtitle,
  catalogSectionTitle,
  featuredOnlyBanner,
} from "./utils/enVentaResultsSummary";
import type { EnVentaAnuncioDTO } from "../shared/types/enVentaListing.types";

type Lang = "es" | "en";
type SortId = "newest" | "price-asc" | "price-desc";

const PAGE_SIZE = 24;
const PROMO_CAP = 2;
const VIEW_PREF_KEY = "en-venta-results-view";

type RowPack = {
  row: Record<string, unknown>;
  dto: EnVentaAnuncioDTO;
  priceNum: number;
  boosted: boolean;
  effectiveDept: string | null;
};

function priceNumFromRow(row: Record<string, unknown>): number {
  const raw = row.price;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  return Number(String(raw ?? "").replace(/[^0-9.]/g, "")) || 0;
}

function isRowBoosted(row: Record<string, unknown>): boolean {
  const b = row.boost_expires;
  if (b == null) return false;
  const t = new Date(typeof b === "string" ? b : String(b)).getTime();
  return Number.isFinite(t) && t > Date.now();
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

function textMatch(q: string, dto: EnVentaAnuncioDTO): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const blob = `${dto.title.es} ${dto.description} ${dto.city}`.toLowerCase();
  return blob.includes(needle);
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
  const sort = (sp?.get("sort") ?? "newest") as SortId;
  const view = sp?.get("view") === "list" ? "list" : "grid";
  const page = Math.max(1, Number(sp?.get("page") ?? "1") || 1);

  const [rows, setRows] = useState<RowPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [favTick, setFavTick] = useState(0);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileFiltersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setMobileFiltersOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

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
        const { data, error } = await supabase
          .from("listings")
          .select(
            "id, owner_id, title, description, city, zip, category, price, is_free, detail_pairs, seller_type, business_name, status, is_published, created_at, images, boost_expires, views, rentas_tier"
          )
          .eq("category", "en-venta")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(800);

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
          if (row.is_published === false) continue;
          try {
            const dto = mapDbRowToEnVentaAnuncioDTO(row);
            if (!dto.id) continue;
            const effectiveDept = resolveEffectiveDept(dto);
            packs.push({
              row,
              dto,
              priceNum: priceNumFromRow(row),
              boosted: isRowBoosted(row),
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
    let list = rows.filter(({ dto, effectiveDept, priceNum }) => {
      if (!textMatch(q, dto)) return false;
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
      list = list.filter((p) => p.boosted);
    }

    list = [...list].sort((a, b) => {
      if (sort === "price-asc") return a.priceNum - b.priceNum;
      if (sort === "price-desc") return b.priceNum - a.priceNum;
      const ta = new Date(String(a.row.created_at ?? 0)).getTime();
      const tb = new Date(String(b.row.created_at ?? 0)).getTime();
      return tb - ta;
    });

    return list;
  }, [rows, q, evDept, evSub, city, zip, featuredOnly, cond, pickup, ship, delivery, seller, priceMin, priceMax, sort]);

  const promotedPool = useMemo(() => {
    if (featuredOnly) return [];
    return filtered.filter((p) => p.boosted).slice(0, PROMO_CAP);
  }, [filtered, featuredOnly]);

  const promotedIds = useMemo(() => new Set(promotedPool.map((p) => p.dto.id)), [promotedPool]);

  const restFiltered = useMemo(() => {
    if (featuredOnly) return filtered;
    return filtered.filter((p) => !promotedIds.has(p.dto.id));
  }, [filtered, featuredOnly, promotedIds]);

  const total = filtered.length;
  const totalRest = restFiltered.length;
  const pageCount = Math.max(1, Math.ceil(totalRest / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const standardSlice = restFiltered.slice(startIdx, startIdx + PAGE_SIZE);

  const t = {
    es: {
      title: "En Venta",
      count: (a: number, b: number, tot: number) => `Mostrando ${a} – ${b} de ${tot} resultados`,
      searchPh: "Buscar en En Venta…",
      cityPh: "Ciudad",
      sort: "Ordenar",
      go: "Buscar",
      grid: "Cuadrícula",
      list: "Lista",
      latest: "Más recientes",
      promoted: "Destacado Pro",
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
      featuredMode: "Solo destacados Pro",
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
      mapRadiusSoon: "Radio en mapa (próximamente)",
      mapRadiusBody:
        "El refinamiento por distancia real vendrá con mapa. Mientras tanto, usa ciudad y CP para acotar.",
      groupSearchLoc: "Buscar y ubicación",
      groupSortView: "Orden, vista y destacados",
      groupRefine: "Refinar listado",
      cityZipHelp: "Ciudad canónica NorCal; CP de 5 dígitos acota cuando hay datos.",
      refineIntro: "Categoría, precio y entrega",
      viewLabel: "Vista",
    },
    en: {
      title: "For Sale",
      count: (a: number, b: number, tot: number) => `Showing ${a} – ${b} of ${tot} results`,
      searchPh: "Search For Sale…",
      cityPh: "City",
      sort: "Sort",
      go: "Search",
      grid: "Grid",
      list: "List",
      latest: "Latest",
      promoted: "Pro Featured",
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
      featuredMode: "Pro featured only",
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
      mapRadiusSoon: "Map radius (coming soon)",
      mapRadiusBody:
        "True distance search will ship with a map. For now, use city and ZIP to narrow results.",
      groupSearchLoc: "Search & location",
      groupSortView: "Sort, view & featured",
      groupRefine: "Refine listings",
      cityZipHelp: "Canonical NorCal city; 5-digit ZIP narrows when listings include ZIP.",
      refineIntro: "Category, price & fulfillment",
      viewLabel: "View",
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
        sort,
        view,
        page: String(safePage),
        featured: featuredOnly ? "1" : undefined,
        ...next,
      };
      for (const [k, v] of Object.entries(merged)) {
        if (v != null && v !== "") sp2.set(k, v);
      }
      router.push(`${EN_VENTA_RESULTS_PATH}?${sp2.toString()}`);
    },
    [router, lang, q, evDept, evSub, city, zip, featuredOnly, cond, priceMin, priceMax, pickup, ship, delivery, seller, sort, view, safePage]
  );

  const onSubmitSearch = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    const el = formEvent.currentTarget;
    const fd = new FormData(el);
    const pickupOn = (el.elements.namedItem("pickup") as HTMLInputElement | null)?.checked ?? false;
    const shipOn = (el.elements.namedItem("ship") as HTMLInputElement | null)?.checked ?? false;
    const deliveryOn = (el.elements.namedItem("delivery") as HTMLInputElement | null)?.checked ?? false;
    const featuredOn = fd.get("featured") === "on" || fd.get("featured") === "1";
    pushParams({
      q: String(fd.get("q") ?? "").trim() || undefined,
      city: String(fd.get("city") ?? "").trim() || undefined,
      zip: String(fd.get("zip") ?? "").trim() || undefined,
      sort: String(fd.get("sort") ?? "newest"),
      view: String(fd.get("view") ?? view),
      evDept: String(fd.get("evDept") ?? "").trim() || undefined,
      evSub: String(fd.get("evSub") ?? "").trim() || undefined,
      cond: String(fd.get("cond") ?? "").trim() || undefined,
      priceMin: String(fd.get("priceMin") ?? "").trim() || undefined,
      priceMax: String(fd.get("priceMax") ?? "").trim() || undefined,
      pickup: pickupOn ? "1" : undefined,
      ship: shipOn ? "1" : undefined,
      delivery: deliveryOn ? "1" : undefined,
      seller: String(fd.get("seller") ?? "").trim() || undefined,
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
    if (priceMin.trim()) out.push({ key: "pmin", label: `≥ ${priceMin}`, onRemove: () => rm({ priceMin: undefined }) });
    if (priceMax.trim()) out.push({ key: "pmax", label: `≤ ${priceMax}`, onRemove: () => rm({ priceMax: undefined }) });
    if (featuredOnly)
      out.push({
        key: "featured",
        label: lang === "es" ? "Solo destacados Pro" : "Pro featured only",
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
    priceMin,
    priceMax,
    featuredOnly,
    lang,
    pushParams,
    condOptions,
    subOptions,
    t.ind,
    t.biz,
  ]);

  const countLine =
    total === 0
      ? lang === "es"
        ? "Sin resultados"
        : "No results"
      : featuredOnly
        ? lang === "es"
          ? `${total} destacado(s) Pro (visibilidad activa)`
          : `${total} Pro featured (active visibility)`
        : t.count(startIdx + 1, Math.min(startIdx + standardSlice.length, totalRest), totalRest) +
          (promotedPool.length ? (lang === "es" ? ` · ${promotedPool.length} destacado(s)` : ` · ${promotedPool.length} featured`) : "");

  const isFav = (id: string) => isListingSaved(id);
  const onFav = (id: string) => {
    toggleListingSaved(id);
    setFavTick((x) => x + 1);
  };

  const searchSummaryLine = buildSearchSummaryLine(q, lang);
  const locationSummaryLine = buildLocationSummaryLine(city, zip, lang);

  return (
    <div
      className="relative min-h-screen text-[#2C2416]"
      style={{
        backgroundColor: "#F3EBDD",
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
          radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
          radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
        `,
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <main className="relative mx-auto w-full min-w-0 max-w-[min(100%,90rem)] overflow-x-hidden px-4 pb-28 pt-14 sm:px-6 sm:pt-16 lg:px-10 lg:pt-16 xl:px-14">
        <header className="w-full border-b border-[#E8DFD0]/70 pb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-10">
            <div className="flex min-w-0 flex-1 gap-4 sm:gap-5">
              <Image
                src={newLogo}
                alt="Leonix"
                width={88}
                height={88}
                className="h-[72px] w-[72px] shrink-0 sm:h-[88px] sm:w-[88px]"
                priority
              />
              <div className="min-w-0 flex-1 text-left">
                <Link
                  href={`/clasificados/en-venta?lang=${lang}`}
                  className="inline-flex text-[13px] font-semibold text-[#2F4A65] underline-offset-4 hover:underline"
                >
                  {lang === "es" ? "← Inicio En Venta" : "← For Sale home"}
                </Link>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl lg:text-4xl">{t.title}</h1>
                <p className="mt-2 text-sm font-semibold text-[#3D3428]">{loading ? t.loading : countLine}</p>
                {searchSummaryLine ? <p className="mt-1 text-sm text-[#5C5346]">{searchSummaryLine}</p> : null}
                {locationSummaryLine ? <p className="mt-0.5 text-sm text-[#5C5346]">{locationSummaryLine}</p> : null}
                <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-[#5C5346]/90">{t.privacyNote}</p>
              </div>
            </div>
          </div>
        </header>

        {activeChips.length > 0 ? (
          <div className="mt-6 w-full sm:mt-8">
            <EnVentaResultsChipsRow
              label={t.activeFilters}
              clearLabel={t.clearAll}
              chips={activeChips}
              onClearAll={resetFilters}
            />
          </div>
        ) : null}

        <form
          id="ev-results-form"
          onSubmit={onSubmitSearch}
          className="mt-6 w-full rounded-[28px] border border-[#E8DFD0] bg-[#FFFCF7]/95 p-4 shadow-[0_16px_56px_-20px_rgba(42,36,22,0.18)] backdrop-blur-sm sm:mt-8 sm:p-6 lg:p-8"
        >
          <input type="hidden" name="lang" value={lang} />

          <div className="rounded-2xl border border-[#E8DFD0]/80 bg-gradient-to-br from-white/90 to-[#FAF7F2]/80 p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7164]">{t.groupSearchLoc}</p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#5C5346]/90">{t.cityZipHelp}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
              <label className="flex min-h-[48px] min-w-0 flex-col justify-center rounded-2xl border border-[#E8DFD0] bg-white/95 px-3 py-2 shadow-inner sm:col-span-2 lg:col-span-5">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]">{t.searchPh}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="text-[#5C5346]" aria-hidden>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3-3" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input
                    name="q"
                    defaultValue={q}
                    placeholder={t.searchPh}
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm text-[#1E1810] outline-none"
                  />
                </span>
              </label>
              <label className="flex min-h-[48px] min-w-0 flex-col justify-center rounded-2xl border border-[#E8DFD0] bg-white/95 px-3 py-2 shadow-inner lg:col-span-4">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]">{t.cityPh}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span aria-hidden>📍</span>
                  <input
                    name="city"
                    defaultValue={city}
                    placeholder={t.cityPh}
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
                  />
                </span>
              </label>
              <label className="flex min-h-[48px] min-w-0 flex-col justify-center rounded-2xl border border-[#E8DFD0] bg-white/95 px-3 py-2 shadow-inner lg:col-span-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]">{t.zip}</span>
                <span className="mt-1 flex items-center gap-2">
                  <span className="text-[#4A6678]" aria-hidden>
                    #
                  </span>
                  <input
                    name="zip"
                    defaultValue={zip}
                    placeholder={t.zip}
                    inputMode="numeric"
                    maxLength={5}
                    className="min-w-0 flex-1 bg-transparent py-1 text-sm outline-none"
                  />
                </span>
              </label>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#E8DFD0]/80 bg-white/70 p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7164]">{t.groupSortView}</p>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end lg:gap-4">
              <label className="min-w-0 lg:min-w-[200px]">
                <span className="sr-only">{t.sort}</span>
                <select
                  name="sort"
                  defaultValue={sort}
                  className="min-h-[48px] w-full rounded-2xl border border-[#E8DFD0] bg-white px-4 py-2.5 text-sm font-medium text-[#2C2416] shadow-sm"
                >
                  {EN_VENTA_SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label[lang]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#7A7164]">{t.viewLabel}</span>
                <div className="flex items-center gap-1 rounded-full border border-[#E8DFD0] bg-[#FAF7F2] p-1">
                  <button
                    type="button"
                    onClick={() => applyViewPreference("grid")}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${view === "grid" ? "bg-white shadow-sm" : "text-[#5C5346]"}`}
                  >
                    {t.grid}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyViewPreference("list")}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${view === "list" ? "bg-white shadow-sm" : "text-[#5C5346]"}`}
                  >
                    {t.list}
                  </button>
                </div>
              </div>
              <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-2xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#FFFBF0]/90 to-[#F5F8FB]/80 px-4 py-2.5 text-sm font-semibold text-[#2F4A65]">
                <input type="checkbox" name="featured" value="1" defaultChecked={featuredOnly} className="rounded border-[#C9B46A]" />
                <span>{t.featuredMode}</span>
              </label>
              <input type="hidden" name="view" value={view} readOnly />
              <button
                type="submit"
                className="min-h-[48px] flex-1 rounded-full bg-gradient-to-br from-[#F0D78C] via-[#D4A03E] to-[#C18A2E] px-8 py-2.5 text-sm font-semibold text-[#1E1810] shadow-md lg:flex-initial"
              >
                {t.go}
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[48px] rounded-full border border-[#E8DFD0] bg-white px-5 text-sm font-semibold text-[#2C2416] shadow-sm hover:bg-[#FAF7F2]"
              >
                {t.clearAll}
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-[#E8DFD0]/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onUseMyLocation}
                className="rounded-full border border-[#D4E0EA] bg-[#F5F8FB] px-4 py-2.5 text-xs font-semibold text-[#2F4A65] hover:bg-[#E8EEF3]"
              >
                {t.useLocation}
              </button>
              {geoHint ? <span className="text-xs text-[#8B4513]">{geoHint}</span> : null}
            </div>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="shrink-0 rounded-full border border-[#E8DFD0] bg-white px-4 py-2.5 text-xs font-semibold text-[#2C2416] shadow-sm lg:hidden"
            >
              {t.filtersOpen}
            </button>
          </div>

          {mobileFiltersOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-black/35 lg:hidden"
              aria-label={t.close}
              onClick={() => setMobileFiltersOpen(false)}
            />
          ) : null}

          <div
            className={
              "relative z-[61] mt-4 space-y-4 max-lg:flex max-lg:min-h-0 max-lg:flex-col " +
              (mobileFiltersOpen
                ? "max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:top-[6vh] max-lg:overflow-hidden max-lg:rounded-t-[28px] max-lg:border max-lg:border-[#E8DFD0] max-lg:bg-[#FFFCF7] max-lg:shadow-[0_-12px_48px_-16px_rgba(42,36,22,0.28)] "
                : "max-lg:hidden ") +
              "lg:block"
            }
          >
            <div className="flex items-center justify-between border-b border-[#E8DFD0]/80 pb-3 lg:hidden">
              <span className="text-sm font-bold text-[#2C2416]">{t.filters}</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="text-sm font-semibold text-[#2F4A65] underline underline-offset-2"
              >
                {t.close}
              </button>
            </div>
            <div className="max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-y-auto max-lg:overscroll-contain lg:overflow-visible">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A7164]">{t.groupRefine}</p>
              <p className="mt-1 text-sm font-medium text-[#3D3428]">{t.refineIntro}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.dept}
              <select
                name="evDept"
                defaultValue={evDept}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              >
                <option value="">{t.all}</option>
                {deptOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.sub}
              <select
                name="evSub"
                defaultValue={evSub}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              >
                <option value="">{t.all}</option>
                {subOptions.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label[lang]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {lang === "es" ? "Condición" : "Condition"}
              <select name="cond" defaultValue={cond} className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
                <option value="">{t.all}</option>
                {condOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.seller}
              <select name="seller" defaultValue={seller} className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm">
                <option value="">{t.all}</option>
                <option value="individual">{t.ind}</option>
                <option value="business">{t.biz}</option>
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.priceMin}
              <input
                name="priceMin"
                defaultValue={priceMin}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-left text-[11px] font-semibold uppercase tracking-wide text-[#7A7164]">
              {t.priceMax}
              <input
                name="priceMax"
                defaultValue={priceMax}
                inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-t border-[#E8DFD0]/80 pt-4 text-sm text-[#3D3428]">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="pickup" defaultChecked={pickup} className="rounded border-[#C9B46A]" />
              {lang === "es" ? "Recogida" : "Pickup"}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="ship" defaultChecked={ship} className="rounded border-[#C9B46A]" />
              {lang === "es" ? "Envío" : "Shipping"}
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" name="delivery" defaultChecked={delivery} className="rounded border-[#C9B46A]" />
              {lang === "es" ? "Entrega local" : "Local delivery"}
            </label>
          </div>

          <details className="mt-4 rounded-2xl border border-[#E8DFD0]/90 bg-white/60 p-4 text-left text-sm text-[#5C5346]">
            <summary className="cursor-pointer list-none font-semibold text-[#7A7164] [&::-webkit-details-marker]:hidden">
              {t.mapRadiusSoon}
            </summary>
            <p className="mt-2 text-[11px] leading-relaxed text-[#7A7164]/95">{t.mapRadiusBody}</p>
          </details>
            </div>
            <div className="border-t border-[#E8DFD0] bg-[#FFFCF7] p-4 lg:hidden">
              <button
                type="button"
                className="w-full rounded-full bg-gradient-to-br from-[#F0D78C] via-[#D4A03E] to-[#C18A2E] px-6 py-3 text-sm font-semibold text-[#1E1810] shadow-md"
                onClick={() => {
                  setMobileFiltersOpen(false);
                  (document.getElementById("ev-results-form") as HTMLFormElement | null)?.requestSubmit();
                }}
              >
                {t.applyFilters}
              </button>
            </div>
          </div>
        </form>

        {loadErr ? <p className="mt-8 text-center text-sm text-red-700">{t.err}</p> : null}

        {!loading && !loadErr && total === 0 ? (
          <div className="mt-12">
            <EnVentaResultsEmpty lang={lang} onReset={resetFilters} featuredOnly={featuredOnly} />
          </div>
        ) : null}

        {!loading && !loadErr && total > 0 ? (
          <div className="mt-10 w-full sm:mt-12">
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
              t={{
                promoted: t.promoted,
                featuredMode: t.featuredMode,
                latest: t.latest,
                catalog: catalogSectionTitle(lang),
                catalogSub: catalogSectionSubtitle(lang),
                page: t.page,
                featuredBanner: featuredOnlyBanner(lang),
              }}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="mt-16 text-center text-sm text-[#5C5346]">{t.loading}</div>
        ) : null}

        <p className="mt-16 text-center text-[12px] font-medium tracking-wide text-[#7A7164]">{t.trust}</p>

        <div className="mt-8 text-center">
          <Link href={`/clasificados/en-venta?lang=${lang}`} className="text-sm font-semibold text-[#2A2620] underline">
            {lang === "es" ? "← Volver al inicio En Venta" : "← Back to For Sale home"}
          </Link>
        </div>
      </main>
    </div>
  );
}
