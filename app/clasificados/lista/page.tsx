"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

import {
  CA_CITIES,
  CITY_ALIASES,
  ZIP_GEO,
  DEFAULT_CITY,
  DEFAULT_RADIUS_MI,
} from "../../data/locations/norcal";
import { SAMPLE_LISTINGS } from "../../data/classifieds/sampleListings";

type Lang = "es" | "en";

type CategoryKey =
  | "all"
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad";

type SortKey = "newest" | "price-asc" | "price-desc";
type SellerType = "personal" | "business";
type ViewMode = "grid" | "list" | "list-img";

type LatLng = { lat: number; lng: number };

type Listing = {
  id: string;
  category: Exclude<CategoryKey, "all">;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  zip?: string;
  postedAgo: { es: string; en: string };
  createdAtISO: string;
  hasImage?: boolean;
  sellerType?: SellerType;
  blurb: { es: string; en: string };
};

const CATEGORY_LABELS: Record<CategoryKey, { es: string; en: string }> = {
  all: { es: "Todos", en: "All" },
  "en-venta": { es: "En Venta", en: "For Sale" },
  rentas: { es: "Rentas", en: "Rentals" },
  autos: { es: "Autos", en: "Autos" },
  servicios: { es: "Servicios", en: "Services" },
  empleos: { es: "Empleos", en: "Jobs" },
  clases: { es: "Clases", en: "Classes" },
  comunidad: { es: "Comunidad", en: "Community" },
};

const SORT_LABELS: Record<SortKey, { es: string; en: string }> = {
  newest: { es: "Más nuevos", en: "Newest" },
  "price-asc": { es: "Precio ↑", en: "Price ↑" },
  "price-desc": { es: "Precio ↓", en: "Price ↓" },
};

const SELLER_LABELS: Record<SellerType, { es: string; en: string }> = {
  personal: { es: "Personal", en: "Personal" },
  business: { es: "Negocio", en: "Business" },
};

const UI = {
  search: { es: "Buscar", en: "Search" },
  location: { es: "Ubicación", en: "Location" },
  radius: { es: "Radio", en: "Radius" },
  category: { es: "Categoría", en: "Category" },
  sort: { es: "Ordenar", en: "Sort" },
  view: { es: "Vista", en: "View" },
  moreFilters: { es: "Más filtros", en: "More filters" },
  reset: { es: "Restablecer", en: "Reset" },
  useMyLocation: { es: "Usar mi ubicación", en: "Use my location" },
  edit: { es: "Editar", en: "Edit" },
  zip: { es: "Código ZIP", en: "ZIP code" },
  seller: { es: "Vendedor", en: "Seller" },
  hasImage: { es: "Con foto", en: "Has image" },
  results: { es: "Resultados", en: "Results" },
  showing: { es: "Mostrando", en: "Showing" },
  of: { es: "de", en: "of" },
  prev: { es: "Anterior", en: "Previous" },
  next: { es: "Siguiente", en: "Next" },
  close: { es: "Cerrar", en: "Close" },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parsePriceLabel(label: string) {
  const m = label.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function haversineMi(a: LatLng, b: LatLng) {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function safeISO(dateStr: string) {
  const d = new Date(dateStr);
  return Number.isFinite(d.getTime())
    ? d.toISOString()
    : "1970-01-01T00:00:00.000Z";
}

/**
 * Supports either city objects:
 *  - { latLng: { lat, lng } }
 *  - { lat: number, lng: number }
 */
function toLatLngLoose(obj: unknown): LatLng | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as any;

  const ll = o.latLng;
  if (ll && typeof ll === "object") {
    const lat = Number(ll.lat);
    const lng = Number(ll.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  }

  const lat = Number(o.lat);
  const lng = Number(o.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

  return null;
}

function getCityLatLng(cityName: string): LatLng | null {
  const cityKey = normalize(cityName);
  const list = CA_CITIES as unknown as Array<any>;
  const hit = list.find((c) => normalize(String(c?.city ?? "")) === cityKey);
  return hit ? toLatLngLoose(hit) : null;
}

export default function ListaPage() {
  // Guard for Next typing (some setups type this as nullable)
  const params = useSearchParams();
  const lang: Lang = (params?.get("lang") as Lang) || "es";

  const [q, setQ] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY);
  const [zip, setZip] = useState("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS_MI);

  const [category, setCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");

  const [sellerType, setSellerType] = useState<SellerType | null>(null);
  const [onlyWithImage, setOnlyWithImage] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 9;

  const [compact, setCompact] = useState(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [locMsg, setLocMsg] = useState("");

  // City autocomplete (inside modal)
  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestOpen, setCitySuggestOpen] = useState(false);
  const citySuggestRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (citySuggestRef.current && !citySuggestRef.current.contains(t)) {
        setCitySuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const zipClean = useMemo(() => zip.replace(/\D/g, "").slice(0, 5), [zip]);
  const zipMode = zipClean.length === 5;

  // Mobile default view
  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    setView(isMobile ? "list-img" : "grid");
  }, []);

  // Compact filter bar when scrolling
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setCompact(window.scrollY > 150);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Read URL params (safe)
  useEffect(() => {
    const pQ = params?.get("q") ?? null;
    const pCity = params?.get("city") ?? null;
    const pZip = params?.get("zip") ?? null;
    const pR = params?.get("r") ?? null;
    const pCat = params?.get("cat") ?? null;
    const pSort = params?.get("sort") ?? null;

    if (pQ) setQ(pQ);
    if (pCity) setCity(pCity);
    if (pZip) setZip(pZip);
    if (pR && Number.isFinite(Number(pR))) setRadiusMi(Number(pR));

    const catOk: CategoryKey[] = [
      "all",
      "en-venta",
      "rentas",
      "autos",
      "servicios",
      "empleos",
      "clases",
      "comunidad",
    ];
    if (pCat && catOk.includes(pCat as CategoryKey)) setCategory(pCat as CategoryKey);

    const sortOk: SortKey[] = ["newest", "price-asc", "price-desc"];
    if (pSort && sortOk.includes(pSort as SortKey)) setSort(pSort as SortKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Resolve canonical city name (aliases)
  const canonicalCity = useMemo(() => {
    const n = normalize(city);
    const alias = (CITY_ALIASES as Record<string, string>)[n];
    return alias ?? city;
  }, [city]);

  // Anchor point for radius filtering
  const anchor = useMemo<LatLng | null>(() => {
    if (zipMode) {
      const z = (ZIP_GEO as Record<string, unknown>)[zipClean];
      const zll = toLatLngLoose(z);
      if (zll) return zll;
    }
    const cityLL = getCityLatLng(canonicalCity);
    if (cityLL) return cityLL;

    return getCityLatLng(DEFAULT_CITY);
  }, [zipMode, zipClean, canonicalCity]);

  const nearbyCityChips = useMemo(() => {
    if (!anchor) return [];
    const list = CA_CITIES as unknown as Array<any>;

    return list
      .map((c) => {
        const name = String(c?.city ?? "");
        const ll = toLatLngLoose(c);
        if (!name || !ll) return null;
        return { city: name, d: haversineMi(anchor, ll) };
      })
      .filter(Boolean)
      .map((x) => x as { city: string; d: number })
      .filter((x) => x.d <= radiusMi)
      .sort((a, b) => a.d - b.d)
      .slice(0, 12);
  }, [anchor, radiusMi]);

  // Listings (sample for now)
  const listings = useMemo<Listing[]>(() => {
    const raw = (SAMPLE_LISTINGS as unknown as Listing[]) ?? [];
    return raw.map((x) => ({
      ...x,
      createdAtISO: safeISO(x.createdAtISO),
      hasImage: Boolean(x.hasImage),
      sellerType: x.sellerType ?? "personal",
    }));
  }, []);

  const filtered = useMemo(() => {
    const nq = normalize(q);

    const base = listings.filter((x) => {
      if (category !== "all" && x.category !== category) return false;
      if (sellerType && x.sellerType !== sellerType) return false;
      if (onlyWithImage && !x.hasImage) return false;

      if (nq) {
        const hay = normalize(`${x.title.es} ${x.title.en} ${x.blurb.es} ${x.blurb.en} ${x.city}`);
        if (!hay.includes(nq)) return false;
      }

      if (!anchor) return true;

      const cityLL = getCityLatLng(x.city);
      if (!cityLL) return true;

      return haversineMi(anchor, cityLL) <= radiusMi;
    });

    const sorted = [...base].sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.createdAtISO).getTime() - new Date(a.createdAtISO).getTime();
      }
      const ap = parsePriceLabel(a.priceLabel.en) ?? Number.POSITIVE_INFINITY;
      const bp = parsePriceLabel(b.priceLabel.en) ?? Number.POSITIVE_INFINITY;
      return sort === "price-asc" ? ap - bp : bp - ap;
    });

    return sorted;
  }, [listings, q, category, sellerType, onlyWithImage, anchor, radiusMi, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage(1);
  }, [q, city, zip, radiusMi, category, sort, sellerType, onlyWithImage]);

  const visible = useMemo(() => {
    const start = (pageClamped - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, pageClamped]);

  const locationLabel = useMemo(() => {
    if (zipMode) return `ZIP ${zipClean}`;
    const n = normalize(city);
    const alias = (CITY_ALIASES as Record<string, string>)[n];
    return alias ?? city ?? DEFAULT_CITY;
  }, [zipMode, zipClean, city]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; text: string; clear: () => void }> = [];

    if (q.trim()) chips.push({ key: "q", text: `${UI.search[lang]}: ${q.trim()}`, clear: () => setQ("") });

    if (zipMode) {
      chips.push({ key: "zip", text: `ZIP: ${zipClean}`, clear: () => setZip("") });
    } else if (normalize(city) && normalize(city) !== normalize(DEFAULT_CITY)) {
      chips.push({ key: "city", text: `${locationLabel}`, clear: () => setCity(DEFAULT_CITY) });
    }

    if (radiusMi !== DEFAULT_RADIUS_MI) {
      chips.push({ key: "r", text: `${UI.radius[lang]}: ${radiusMi} mi`, clear: () => setRadiusMi(DEFAULT_RADIUS_MI) });
    }

    if (category !== "all") {
      chips.push({
        key: "cat",
        text: `${UI.category[lang]}: ${CATEGORY_LABELS[category][lang]}`,
        clear: () => setCategory("all"),
      });
    }

    if (sort !== "newest") {
      chips.push({ key: "sort", text: `${UI.sort[lang]}: ${SORT_LABELS[sort][lang]}`, clear: () => setSort("newest") });
    }

    if (sellerType) {
      chips.push({
        key: "seller",
        text: `${UI.seller[lang]}: ${SELLER_LABELS[sellerType][lang]}`,
        clear: () => setSellerType(null),
      });
    }

    if (onlyWithImage) {
      chips.push({ key: "img", text: `${UI.hasImage[lang]}`, clear: () => setOnlyWithImage(false) });
    }

    return chips;
  }, [q, lang, zipMode, zipClean, city, locationLabel, radiusMi, category, sort, sellerType, onlyWithImage]);

  const resetAll = () => {
    setQ("");
    setCity(DEFAULT_CITY);
    setZip("");
    setRadiusMi(DEFAULT_RADIUS_MI);
    setCategory("all");
    setSort("newest");
    setSellerType(null);
    setOnlyWithImage(false);
    setLocMsg("");
    setUsingMyLocation(false);
    setCityQuery("");
  };

  const onUseMyLocation = async () => {
    try {
      setUsingMyLocation(true);
      setLocMsg(lang === "es" ? "Detectando ubicación…" : "Detecting location…");

      if (!navigator.geolocation) {
        setLocMsg(lang === "es" ? "Geolocalización no disponible." : "Geolocation not available.");
        setUsingMyLocation(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const me: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          const list = CA_CITIES as unknown as Array<any>;
          const best = list
            .map((c) => {
              const name = String(c?.city ?? "");
              const ll = toLatLngLoose(c);
              if (!name || !ll) return null;
              return { city: name, d: haversineMi(me, ll) };
            })
            .filter(Boolean)
            .map((x) => x as { city: string; d: number })
            .sort((a, b) => a.d - b.d)[0];

          setZip(""); // don’t lock the user
          setCity(best?.city ?? DEFAULT_CITY);
          setLocMsg(
            lang === "es"
              ? `Ubicación detectada cerca de ${best?.city ?? DEFAULT_CITY}.`
              : `Location detected near ${best?.city ?? DEFAULT_CITY}.`
          );
          setUsingMyLocation(false);
        },
        () => {
          setLocMsg(lang === "es" ? "No se pudo obtener ubicación." : "Could not get location.");
          setUsingMyLocation(false);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    } catch {
      setLocMsg(lang === "es" ? "Error de ubicación." : "Location error.");
      setUsingMyLocation(false);
    }
  };

  const cityOptions = useMemo(() => {
    const list = CA_CITIES as unknown as Array<any>;
    const names = list
      .map((c) => String(c?.city ?? ""))
      .filter(Boolean);

    const nq = normalize(cityQuery);
    if (!nq) return names.slice(0, 25);

    return names
      .filter((n) => normalize(n).includes(nq))
      .slice(0, 25);
  }, [cityQuery]);

  const ListingCardGrid = (x: Listing) => (
    <div
      key={x.id}
      className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{x.title[lang]}</div>
          <div className="mt-1 text-sm text-gray-300">
            {x.city} • {x.postedAgo[lang]}
          </div>
        </div>
        {x.hasImage ? (
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            📷
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-lg font-semibold text-yellow-300">{x.priceLabel[lang]}</div>
      <div className="mt-3 line-clamp-3 text-sm text-gray-200">{x.blurb[lang]}</div>

      <a
        href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
        className="mt-5 block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10"
      >
        {lang === "es" ? "Ver detalle" : "View details"}
      </a>
    </div>
  );

  const ListingRow = (x: Listing, withImg: boolean) => (
    <a
      key={x.id}
      href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
      className="group flex items-stretch gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-white/10"
    >
      {withImg ? (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {x.hasImage ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-200">📷</div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">—</div>
          )}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white group-hover:text-yellow-100">
              {x.title[lang]}
            </div>
            <div className="mt-1 text-xs text-gray-300">
              {x.city} • {x.postedAgo[lang]}
            </div>
          </div>
          <div className="shrink-0 text-sm font-semibold text-yellow-300">{x.priceLabel[lang]}</div>
        </div>
        <div className="mt-2 line-clamp-2 text-xs text-gray-200">{x.blurb[lang]}</div>
      </div>
    </a>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-28">
        {/* HERO */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex w-full items-center justify-center">
            <Image
              src={newLogo}
              alt="LEONIX Media"
              width={110}
              height={110}
              priority
              className="h-auto w-[110px]"
            />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-yellow-400 md:text-6xl">
            {lang === "es" ? "Clasificados" : "Classifieds"}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 md:text-lg">
            {lang === "es"
              ? "Explora todos los anuncios con filtros."
              : "Browse all listings with filters."}
          </p>
        </div>

        {/* FILTER BAR (sticky + compact) */}
        <section
          className={cx(
            "sticky top-[72px] z-30 mt-10",
            "rounded-2xl border border-white/10 bg-black/60 backdrop-blur",
            compact ? "shadow-lg" : ""
          )}
        >
          <div className={cx("p-4 md:p-5", compact ? "md:py-4" : "")}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:items-end">
              {/* Search */}
              <div className="col-span-2 md:col-span-5">
                <label className="block text-xs font-semibold text-gray-300">{UI.search[lang]}</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={lang === "es" ? "Buscar: trabajo, troca, cuarto…" : "Search: jobs, truck, room…"}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                />
              </div>

              {/* Location */}
              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-semibold text-gray-300">{UI.location[lang]}</label>
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
                >
                  <span className="truncate">{locationLabel}</span>
                  <span className="ml-3 shrink-0 text-xs text-gray-400">{UI.edit[lang]}</span>
                </button>
                {locMsg ? <div className="mt-1 text-[11px] text-gray-400">{locMsg}</div> : null}
              </div>

              {/* Radius */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">{UI.radius[lang]}</label>
                <select
                  value={radiusMi}
                  onChange={(e) => setRadiusMi(parseInt(e.target.value, 10))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-yellow-500/40"
                >
                  {[5, 10, 25, 40, 50].map((r) => (
                    <option key={r} value={r}>
                      {r} mi
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">{UI.category[lang]}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryKey)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-yellow-500/40"
                >
                  <option value="all">{CATEGORY_LABELS.all[lang]}</option>
                  <option value="en-venta">{CATEGORY_LABELS["en-venta"][lang]}</option>
                  <option value="rentas">{CATEGORY_LABELS.rentas[lang]}</option>
                  <option value="autos">{CATEGORY_LABELS.autos[lang]}</option>
                  <option value="servicios">{CATEGORY_LABELS.servicios[lang]}</option>
                  <option value="empleos">{CATEGORY_LABELS.empleos[lang]}</option>
                  <option value="clases">{CATEGORY_LABELS.clases[lang]}</option>
                  <option value="comunidad">{CATEGORY_LABELS.comunidad[lang]}</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-12 md:justify-end">
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {UI.moreFilters[lang]}
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {UI.reset[lang]}
                </button>
              </div>
            </div>

            {/* Chips (keep clean + scrollable) */}
            {activeChips.length ? (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.clear}
                    className="whitespace-nowrap rounded-full border border-yellow-600/30 bg-yellow-600/10 px-3 py-1 text-xs text-yellow-100 hover:bg-yellow-600/15"
                    aria-label={lang === "es" ? "Quitar filtro" : "Remove filter"}
                  >
                    {c.text} <span className="ml-1 opacity-80">×</span>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Nearby cities row (desktop shows; mobile stays minimal) */}
            {nearbyCityChips.length ? (
              <div className="mt-3 hidden items-center gap-2 overflow-x-auto pb-1 md:flex">
                {nearbyCityChips.map((c) => (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() => {
                      setCity(c.city);
                      setZip(""); // city selection clears zip
                    }}
                    className={cx(
                      "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
                      normalize(c.city) === normalize(canonicalCity)
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                  >
                    {c.city}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {/* STICKY RESULTS BAR (view + sort always available) */}
        <section className="sticky top-[calc(72px+16px)] z-20 mt-4">
          <div className="rounded-2xl border border-white/10 bg-black/55 backdrop-blur px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-left">
                <div className="text-lg font-semibold text-yellow-300">{UI.results[lang]}</div>
                <div className="text-xs text-gray-300">
                  {UI.showing[lang]} {visible.length} {UI.of[lang]} {filtered.length}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                {/* View buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "list"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                    aria-label={lang === "es" ? "Vista de lista" : "List view"}
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list-img")}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "list-img"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                    aria-label={lang === "es" ? "Lista con imagen" : "List with images"}
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "grid"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                    aria-label={lang === "es" ? "Vista de cuadrícula" : "Grid view"}
                  >
                    ▦
                  </button>
                </div>

                {/* Sort */}
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                  aria-label={UI.sort[lang]}
                >
                  <option value="newest">{SORT_LABELS.newest[lang]}</option>
                  <option value="price-asc">{SORT_LABELS["price-asc"][lang]}</option>
                  <option value="price-desc">{SORT_LABELS["price-desc"][lang]}</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* RESULTS */}
        <section className="mt-6">
          {view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map(ListingCardGrid)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((x) => ListingRow(x, view === "list-img"))}
            </div>
          )}
        </section>

        {/* PAGINATION */}
        <section className="mt-8 flex items-center justify-center gap-3 pb-16">
          <button
            type="button"
            disabled={pageClamped <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cx(
              "rounded-xl border px-4 py-2 text-sm",
              pageClamped <= 1
                ? "border-white/10 bg-white/5 text-gray-500"
                : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            )}
          >
            {UI.prev[lang]}
          </button>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
            {pageClamped}/{totalPages}
          </div>

          <button
            type="button"
            disabled={pageClamped >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cx(
              "rounded-xl border px-4 py-2 text-sm",
              pageClamped >= totalPages
                ? "border-white/10 bg-white/5 text-gray-500"
                : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            )}
          >
            {UI.next[lang]}
          </button>
        </section>
      </main>

      {/* MORE FILTERS DRAWER */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-yellow-300">
                {UI.moreFilters[lang]}
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200 hover:bg-white/10"
              >
                {UI.close[lang]}
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.seller[lang]}
                </label>
                <select
                  value={sellerType ?? "all"}
                  onChange={(e) =>
                    setSellerType(e.target.value === "all" ? null : (e.target.value as SellerType))
                  }
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                  <option value="personal">{SELLER_LABELS.personal[lang]}</option>
                  <option value="business">{SELLER_LABELS.business[lang]}</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={onlyWithImage}
                  onChange={(e) => setOnlyWithImage(e.target.checked)}
                />
                {UI.hasImage[lang]}
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSellerType(null);
                    setOnlyWithImage(false);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {lang === "es" ? "Limpiar" : "Clear"}
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-500/20"
                >
                  {lang === "es" ? "Aplicar" : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* LOCATION MODAL */}
      {locationOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setLocationOpen(false)}
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-yellow-300">{UI.location[lang]}</div>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200 hover:bg-white/10"
              >
                {UI.close[lang]}
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {/* City */}
              <div ref={citySuggestRef} className="relative">
                <label className="block text-xs font-semibold text-gray-300">
                  {lang === "es" ? "Ciudad" : "City"}
                </label>
                <input
                  value={cityQuery}
                  onChange={(e) => {
                    setCityQuery(e.target.value);
                    setCitySuggestOpen(true);
                  }}
                  onFocus={() => setCitySuggestOpen(true)}
                  placeholder={lang === "es" ? "Ej: San José" : "e.g. San Jose"}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                />

                {citySuggestOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/95 shadow-xl">
                    {cityOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setCity(name);
                          setZip(""); // IMPORTANT: city selection clears ZIP so user isn’t locked
                          setCityQuery(name);
                          setCitySuggestOpen(false);
                          setLocMsg("");
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-1 text-[11px] text-gray-400">
                  {lang === "es"
                    ? "Si eliges ciudad, el ZIP se limpia automáticamente."
                    : "If you pick a city, ZIP is cleared automatically."}
                </div>
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-xs font-semibold text-gray-300">{UI.zip[lang]}</label>
                <input
                  value={zip}
                  onChange={(e) => {
                    const next = e.target.value;
                    setZip(next);
                    // If a valid ZIP is being entered, clear city query to avoid conflicts
                    const cleaned = next.replace(/\D/g, "").slice(0, 5);
                    if (cleaned.length === 5) {
                      setCity(DEFAULT_CITY); // neutral label; ZIP drives anchor
                      setCityQuery("");
                      setLocMsg("");
                    }
                  }}
                  placeholder={lang === "es" ? "Ej: 95116" : "e.g. 95116"}
                  inputMode="numeric"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                />
                <div className="mt-1 text-[11px] text-gray-400">
                  {lang === "es"
                    ? "Si usas ZIP (5 dígitos), la ciudad se limpia automáticamente."
                    : "If you use a ZIP (5 digits), city is cleared automatically."}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={onUseMyLocation}
                disabled={usingMyLocation}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm",
                  usingMyLocation
                    ? "border-white/10 bg-white/5 text-gray-500"
                    : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                )}
              >
                {UI.useMyLocation[lang]}
              </button>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCity(DEFAULT_CITY);
                    setZip("");
                    setCityQuery("");
                    setLocMsg("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {lang === "es" ? "Limpiar" : "Clear"}
                </button>
                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-500/20"
                >
                  {lang === "es" ? "Listo" : "Done"}
                </button>
              </div>
            </div>

            {/* Nearby chips inside modal (as you requested earlier) */}
            {nearbyCityChips.length ? (
              <div className="mt-5">
                <div className="text-xs font-semibold text-gray-300">
                  {lang === "es" ? "Ciudades cercanas" : "Nearby cities"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {nearbyCityChips.map((c) => (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => {
                        setCity(c.city);
                        setZip("");
                        setCityQuery(c.city);
                        setLocMsg("");
                      }}
                      className={cx(
                        "rounded-full border px-3 py-1 text-xs",
                        normalize(c.city) === normalize(canonicalCity)
                          ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                          : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                      )}
                    >
                      {c.city}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
