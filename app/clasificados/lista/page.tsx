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

const LABELS = {
  search: { es: "Buscar", en: "Search" },
  location: { es: "Ubicación", en: "Location" },
  radius: { es: "Radio", en: "Radius" },
  category: { es: "Categoría", en: "Category" },
  sort: { es: "Ordenar", en: "Sort" },
  moreFilters: { es: "Más filtros", en: "More filters" },
  reset: { es: "Restablecer", en: "Reset" },
  useMyLocation: { es: "Usar mi ubicación", en: "Use my location" },
  seller: { es: "Vendedor", en: "Seller" },
  hasImage: { es: "Con foto", en: "Has image" },
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

// Great-circle distance (mi)
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
 * CA_CITIES / ZIP_GEO shape guard:
 * Supports either:
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
  // Some Next/TS setups type this as ReadonlyURLSearchParams | null.
  // So we MUST guard every usage.
  const params = useSearchParams();
  const lang: Lang = (params?.get("lang") as Lang) || "es";

  const [q, setQ] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY);
  const [zip, setZip] = useState("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS_MI);

  const [category, setCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const [sellerType, setSellerType] = useState<SellerType | null>(null);
  const [onlyWithImage, setOnlyWithImage] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 9;

  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [locMsg, setLocMsg] = useState("");

  // Search suggestions
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // City autocomplete
  const [cityOpen, setCityOpen] = useState(false);
  const cityBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(t)) {
        setSuggestionsOpen(false);
      }
      if (cityBoxRef.current && !cityBoxRef.current.contains(t)) {
        setCityOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const zipClean = useMemo(() => zip.replace(/\D/g, "").slice(0, 5), [zip]);
  const zipMode = zipClean.length === 5;

  const resolveCityToCanonical = useMemo(() => {
    const n = normalize(city);
    const alias = (CITY_ALIASES as Record<string, string>)[n];
    const canonicalCity = alias ?? city;
    const latLng = getCityLatLng(canonicalCity);
    return { canonicalCity, latLng };
  }, [city]);

  const anchor = useMemo(() => {
    // ZIP anchor
    if (zipMode) {
      const z = (ZIP_GEO as Record<string, unknown>)[zipClean];
      const zll = toLatLngLoose(z);
      if (zll) return zll;
    }

    // City anchor
    if (resolveCityToCanonical.latLng) return resolveCityToCanonical.latLng;

    // Default city anchor fallback
    return getCityLatLng(DEFAULT_CITY);
  }, [zipMode, zipClean, resolveCityToCanonical.latLng]);

  const nearbyCityChips = useMemo(() => {
    if (!anchor) return [];
    const list = CA_CITIES as unknown as Array<any>;

    return list
      .map((c) => {
        const cName = String(c?.city ?? "");
        const ll = toLatLngLoose(c);
        if (!cName || !ll) return null;
        return { city: cName, d: haversineMi(anchor, ll) };
      })
      .filter(Boolean)
      .map((x) => x as { city: string; d: number })
      .filter((x) => x.d <= radiusMi)
      .sort((a, b) => a.d - b.d)
      .slice(0, 12);
  }, [anchor, radiusMi]);

  // Initialize from URL params (guarded)
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

    // Only accept known keys (avoid junk URL values)
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

  const suggestions = useMemo(() => {
    const n = normalize(q);
    if (!n) return [];
    const hits: CategoryKey[] = [];
    if (/(renta|rent|cuarto|apto|apart|room)/.test(n)) hits.push("rentas");
    if (/(carro|auto|truck|troca|camioneta|suv)/.test(n)) hits.push("autos");
    if (/(trabajo|empleo|job)/.test(n)) hits.push("empleos");
    if (/(servicio|plom|electric|clean|yard|handyman)/.test(n)) hits.push("servicios");
    if (/(clase|tutor|curso|lessons)/.test(n)) hits.push("clases");
    if (/(comunidad|evento|iglesia|church)/.test(n)) hits.push("comunidad");
    if (/(vendo|venta|sell|for sale|iphone|mueble)/.test(n)) hits.push("en-venta");
    return Array.from(new Set(hits)).slice(0, 4);
  }, [q]);

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
          const { latitude, longitude } = pos.coords;
          const me: LatLng = { lat: latitude, lng: longitude };

          const list = CA_CITIES as unknown as Array<any>;
          const best = list
            .map((c) => {
              const cName = String(c?.city ?? "");
              const ll = toLatLngLoose(c);
              if (!cName || !ll) return null;
              return { city: cName, d: haversineMi(me, ll) };
            })
            .filter(Boolean)
            .map((x) => x as { city: string; d: number })
            .sort((a, b) => a.d - b.d)[0];

          setZip("");
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

      const d = haversineMi(anchor, cityLL);
      return d <= radiusMi;
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

  const [view, setView] = useState<"grid" | "list" | "list-img">("grid");
  const [moreOpen, setMoreOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    setView(isMobile ? "list-img" : "grid");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setCompact(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];
    const add = (key: string, label: string, onClear: () => void) => chips.push({ key, label, onClear });

    if (q.trim()) add("q", `${LABELS.search[lang]}: ${q.trim()}`, () => setQ(""));

    if (zipMode) {
      add("zip", `ZIP: ${zipClean}`, () => setZip(""));
    } else if (normalize(city) && normalize(city) !== normalize(DEFAULT_CITY)) {
      add("city", `${resolveCityToCanonical.canonicalCity}`, () => setCity(DEFAULT_CITY));
    }

    if (radiusMi !== DEFAULT_RADIUS_MI)
      add("radius", `${LABELS.radius[lang]}: ${radiusMi} mi`, () => setRadiusMi(DEFAULT_RADIUS_MI));

    if (category !== "all")
      add("category", `${LABELS.category[lang]}: ${CATEGORY_LABELS[category][lang]}`, () => setCategory("all"));

    if (sort !== "newest")
      add("sort", `${LABELS.sort[lang]}: ${SORT_LABELS[sort][lang]}`, () => setSort("newest"));

    if (sellerType)
      add("seller", `${LABELS.seller[lang]}: ${SELLER_LABELS[sellerType][lang]}`, () => setSellerType(null));

    if (onlyWithImage) add("img", `${LABELS.hasImage[lang]}`, () => setOnlyWithImage(false));

    return chips;
  }, [
    q,
    lang,
    zipMode,
    zipClean,
    city,
    resolveCityToCanonical.canonicalCity,
    radiusMi,
    category,
    sort,
    sellerType,
    onlyWithImage,
  ]);

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
  };

  const locationLabel = useMemo(() => {
    if (zipMode) return `ZIP ${zipClean}`;
    const c = resolveCityToCanonical.latLng ? resolveCityToCanonical.canonicalCity : DEFAULT_CITY;
    return c;
  }, [zipMode, zipClean, resolveCityToCanonical.latLng, resolveCityToCanonical.canonicalCity]);

  const ResultsHeader = () => (
    <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="text-left">
        <div className="text-xl font-semibold text-yellow-300">{lang === "es" ? "Resultados" : "Results"}</div>
        <div className="text-sm text-gray-300">
          {lang === "es" ? `Mostrando ${visible.length} de ${filtered.length}` : `Showing ${visible.length} of ${filtered.length}`}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
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

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
          aria-label={LABELS.sort[lang]}
        >
          <option value="newest">{SORT_LABELS.newest[lang]}</option>
          <option value="price-asc">{SORT_LABELS["price-asc"][lang]}</option>
          <option value="price-desc">{SORT_LABELS["price-desc"][lang]}</option>
        </select>
      </div>
    </div>
  );

  const ListingCardGrid = (x: Listing) => {
    const title = x.title[lang];
    const blurb = x.blurb[lang];
    const time = x.postedAgo[lang];

    return (
      <div
        key={x.id}
        className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">{title}</div>
            <div className="mt-1 text-sm text-gray-300">
              {x.city} • {time}
            </div>
          </div>
          {x.hasImage ? (
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">📷</div>
          ) : null}
        </div>

        <div className="mt-3 text-lg font-semibold text-yellow-300">{x.priceLabel[lang]}</div>
        <div className="mt-3 line-clamp-3 text-sm text-gray-200">{blurb}</div>

        <a
          href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
          className="mt-5 block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10"
        >
          {lang === "es" ? "Ver detalle" : "View details"}
        </a>
      </div>
    );
  };

  const ListingRow = (x: Listing, withImg: boolean) => {
    const title = x.title[lang];
    const blurb = x.blurb[lang];
    const time = x.postedAgo[lang];

    return (
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
              <div className="truncate text-sm font-semibold text-white group-hover:text-yellow-100">{title}</div>
              <div className="mt-1 text-xs text-gray-300">
                {x.city} • {time}
              </div>
            </div>
            <div className="shrink-0 text-sm font-semibold text-yellow-300">{x.priceLabel[lang]}</div>
          </div>
          <div className="mt-2 line-clamp-2 text-xs text-gray-200">{blurb}</div>
        </div>
      </a>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-6 pt-28">
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
            {lang === "es" ? "Explora todos los anuncios con filtros." : "Browse all listings with filters."}
          </p>
        </div>

        {/* STICKY FILTER BAR */}
        <section
          className={cx(
            "sticky top-[72px] z-30 mt-10",
            "rounded-2xl border border-white/10 bg-black/60 backdrop-blur",
            compact ? "shadow-lg" : ""
          )}
        >
          <div className={cx("p-4 md:p-5", compact ? "md:py-4" : "")}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:items-end">
              <div className="col-span-2 md:col-span-5">
                <label className="block text-xs font-semibold text-gray-300">{LABELS.search[lang]}</label>

                <div ref={searchBoxRef} className="relative mt-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => setSuggestionsOpen(suggestions.length > 0)}
                    placeholder={lang === "es" ? "Buscar: trabajo, troca, cuarto…" : "Search: jobs, truck, room…"}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                  />

                  {suggestionsOpen && suggestions.length > 0 ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-xl">
                      <div className="px-3 py-2 text-xs text-gray-400">{lang === "es" ? "Sugerencias" : "Suggestions"}</div>
                      <div className="max-h-56 overflow-auto">
                        {suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setCategory(s);
                              setSuggestionsOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                          >
                            <span>{CATEGORY_LABELS[s][lang]}</span>
                            <span className="text-xs text-gray-400">{lang === "es" ? "Categoría" : "Category"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-semibold text-gray-300">{LABELS.location[lang]}</label>
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="mt-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
                >
                  <span className="truncate">{locationLabel}</span>
                  <span className="ml-3 shrink-0 text-xs text-gray-400">{lang === "es" ? "Editar" : "Edit"}</span>
                </button>
                {locMsg ? <div className="mt-1 text-[11px] text-gray-400">{locMsg}</div> : null}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">{LABELS.radius[lang]}</label>
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

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">{LABELS.category[lang]}</label>
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

              <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-12 md:justify-end">
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {LABELS.moreFilters[lang]}
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {LABELS.reset[lang]}
                </button>
              </div>
            </div>

            {activeChips.length > 0 ? (
              <div className={cx("mt-4 flex items-center gap-2 overflow-x-auto pb-1", compact ? "hidden md:flex" : "")}>
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.onClear}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"
                  >
                    <span className="whitespace-nowrap">{c.label}</span>
                    <span className="text-gray-400">✕</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <ResultsHeader />

        <section className="mt-6">
          {visible.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center text-gray-300">
              {lang === "es" ? "No hay resultados." : "No results."}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">{visible.map(ListingCardGrid)}</div>
          ) : (
            <div className="flex flex-col gap-3">{visible.map((x) => ListingRow(x, view === "list-img"))}</div>
          )}
        </section>

        <div className="mt-10 flex items-center justify-center gap-3 pb-16">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={pageClamped === 1}
            className={cx(
              "rounded-xl border px-4 py-2 text-sm",
              pageClamped === 1 ? "border-white/10 bg-white/5 text-gray-500" : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            )}
          >
            {lang === "es" ? "Anterior" : "Prev"}
          </button>

          <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-gray-200">
            {pageClamped}/{totalPages}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={pageClamped === totalPages}
            className={cx(
              "rounded-xl border px-4 py-2 text-sm",
              pageClamped === totalPages ? "border-white/10 bg-white/5 text-gray-500" : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            )}
          >
            {lang === "es" ? "Siguiente" : "Next"}
          </button>
        </div>
      </main>

      {/* LOCATION MODAL */}
      {locationOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold text-white">{lang === "es" ? "Ubicación" : "Location"}</div>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div ref={cityBoxRef} className="relative">
                  <label className="block text-xs font-semibold text-gray-300">{lang === "es" ? "Ciudad" : "City"}</label>
                  <input
                    value={city}
                    onChange={(e) => {
                      setUsingMyLocation(false);
                      setCity(e.target.value);
                      setCityOpen(true);
                    }}
                    onFocus={() => setCityOpen(true)}
                    placeholder={lang === "es" ? "Ej: San José" : "e.g., San Jose"}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                    disabled={zipMode}
                  />

                  {cityOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-xl">
                      <div className="max-h-56 overflow-auto">
                        {(CA_CITIES as unknown as Array<any>)
                          .filter((c) => normalize(String(c?.city ?? "")).includes(normalize(city || "")))
                          .slice(0, 12)
                          .map((o) => (
                            <button
                              key={String(o.city)}
                              type="button"
                              onClick={() => {
                                setCity(String(o.city));
                                setCityOpen(false);
                              }}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                            >
                              <span>{String(o.city)}</span>
                              <span className="text-xs text-gray-400">{lang === "es" ? "Ciudad" : "City"}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300">ZIP</label>
                  <input
                    value={zip}
                    onChange={(e) => {
                      setUsingMyLocation(false);
                      setZip(e.target.value);
                    }}
                    inputMode="numeric"
                    placeholder={lang === "es" ? "Código ZIP" : "ZIP code"}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  type="button"
                  onClick={onUseMyLocation}
                  disabled={usingMyLocation}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 disabled:opacity-60"
                >
                  {LABELS.useMyLocation[lang]}
                </button>
                <div className="text-xs text-gray-400">{locMsg}</div>
              </div>

              {nearbyCityChips.length > 0 ? (
                <div className="mt-5">
                  <div className="text-xs font-semibold text-gray-300">{lang === "es" ? "Cerca de ti" : "Nearby"}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nearbyCityChips.map((c) => (
                      <button
                        key={c.city}
                        type="button"
                        onClick={() => {
                          setZip("");
                          setCity(c.city);
                        }}
                        className={cx(
                          "rounded-full border px-3 py-1.5 text-xs",
                          normalize(c.city) === normalize(resolveCityToCanonical.canonicalCity)
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

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCity(DEFAULT_CITY);
                    setZip("");
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {lang === "es" ? "Restablecer ubicación" : "Reset location"}
                </button>

                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  className="rounded-xl border border-yellow-500/40 bg-yellow-500/15 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-500/20"
                >
                  {lang === "es" ? "Guardar" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* MORE FILTERS MODAL */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="text-sm font-semibold text-white">{LABELS.moreFilters[lang]}</div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10"
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-300">{LABELS.seller[lang]}</label>
                  <select
                    value={sellerType ?? ""}
                    onChange={(e) => setSellerType((e.target.value || null) as SellerType | null)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none focus:border-yellow-500/40"
                  >
                    <option value="">{lang === "es" ? "Todos" : "All"}</option>
                    <option value="personal">{SELLER_LABELS.personal[lang]}</option>
                    <option value="business">{SELLER_LABELS.business[lang]}</option>
                  </select>
                </div>

                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white">
                    <input
                      type="checkbox"
                      checked={onlyWithImage}
                      onChange={(e) => setOnlyWithImage(e.target.checked)}
                      className="h-4 w-4 accent-yellow-400"
                    />
                    <span>{LABELS.hasImage[lang]}</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {LABELS.reset[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-xl border border-yellow-500/40 bg-yellow-500/15 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-500/20"
                >
                  {lang === "es" ? "Aplicar" : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
