"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import newLogo from "../../../public/logo.png";

import {
  CA_CITIES,
  CITY_ALIASES,
  ZIP_GEO,
  DEFAULT_CITY,
  DEFAULT_RADIUS_MI,
} from "../../data/locations/norcal";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type Lang = "es" | "en";

type CategoryKey =
  | "todos"
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad";

type SellerType = "personal" | "negocio";

type ViewMode = "grid" | "list" | "media";

// Template-only listing type (sample data)
type Listing = {
  id: string;
  category: Exclude<CategoryKey, "todos">;
  title: { es: string; en: string };
  priceLabel?: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  description: { es: string; en: string };
  hasPhoto: boolean;
  sellerType: SellerType;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ------------------------------------------------------------
// Text helpers
// ------------------------------------------------------------

const UI = {
  es: {
    title: "Clasificados",
    subtitle: "Explora todos los anuncios con filtros.",
    searchLabel: "Buscar",
    searchPlaceholder: "Buscar: trabajo, troca, cuarto...",
    locationLabel: "Ubicación",
    zipLabel: "Código ZIP",
    radiusLabel: "Radio",
    categoryLabel: "Categoría",
    sortLabel: "Ordenar",
    moreFilters: "Más filtros",
    reset: "Restablecer",
    useMyLocation: "Usar mi ubicación",
    edit: "Editar",
    close: "Cerrar",
    done: "Listo",
    clear: "Limpiar",
    cityInputLabel: "Ciudad",
    cityInputPlaceholder: "Ej: San José",
    zipInputPlaceholder: "Ej: 95116",
    nearCities: "Ciudades cercanas",
    results: "Resultados",
    showing: (shown: number, total: number) => `Mostrando ${shown} de ${total}`,
    viewDetail: "Ver detalle",
    withPhoto: "Con foto",
    seller: "Vendedor",
    all: "Todos",
    personal: "Personal",
    business: "Negocio",
    sortNewest: "Más nuevos",
    sortPriceAsc: "Precio ↑",
    sortPriceDesc: "Precio ↓",
    view: "Vista",
  },
  en: {
    title: "Classifieds",
    subtitle: "Browse listings with filters.",
    searchLabel: "Search",
    searchPlaceholder: "Search: jobs, truck, room...",
    locationLabel: "Location",
    zipLabel: "ZIP code",
    radiusLabel: "Radius",
    categoryLabel: "Category",
    sortLabel: "Sort",
    moreFilters: "More filters",
    reset: "Reset",
    useMyLocation: "Use my location",
    edit: "Edit",
    close: "Close",
    done: "Done",
    clear: "Clear",
    cityInputLabel: "City",
    cityInputPlaceholder: "e.g. San José",
    zipInputPlaceholder: "e.g. 95116",
    nearCities: "Nearby cities",
    results: "Results",
    showing: (shown: number, total: number) => `Showing ${shown} of ${total}`,
    viewDetail: "View details",
    withPhoto: "With photo",
    seller: "Seller",
    all: "All",
    personal: "Personal",
    business: "Business",
    sortNewest: "Newest",
    sortPriceAsc: "Price ↑",
    sortPriceDesc: "Price ↓",
    view: "View",
  },
} as const;

// ------------------------------------------------------------
// Normalization + geo helpers
// ------------------------------------------------------------

function normalize(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.7613; // Earth radius (mi)
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function canonicalizeCity(inputCity: string) {
  const key = normalize(inputCity);
  const alias = CITY_ALIASES[key];
  return alias ?? inputCity;
}

// ------------------------------------------------------------
// Mock listings (template only)
// ------------------------------------------------------------

const SAMPLE_LISTINGS: Listing[] = [
  {
    id: "enventa-personal-1",
    category: "en-venta",
    title: { es: "iPhone 13 desbloqueado", en: "Unlocked iPhone 13" },
    priceLabel: { es: "$420", en: "$420" },
    city: "San José",
    postedAgo: { es: "hace 2 días", en: "2 days ago" },
    description: {
      es: "Excelente condición. Incluye caja y cargador.",
      en: "Great condition. Includes box and charger.",
    },
    hasPhoto: true,
    sellerType: "personal",
  },
  {
    id: "servicios-negocio-1",
    category: "servicios",
    title: { es: "Tienda: electrónicos reacondicionados", en: "Shop: refurbished electronics" },
    priceLabel: { es: "Desde $49", en: "From $49" },
    city: "San José",
    postedAgo: { es: "hace 1 día", en: "1 day ago" },
    description: {
      es: "Garantía y recogida local. Pregunta por disponibilidad.",
      en: "Warranty and local pickup. Ask for availability.",
    },
    hasPhoto: true,
    sellerType: "negocio",
  },
  {
    id: "rentas-personal-1",
    category: "rentas",
    title: { es: "Cuarto en renta (utilities incl.)", en: "Room for rent (utilities incl.)" },
    priceLabel: { es: "$850", en: "$850" },
    city: "Milpitas",
    postedAgo: { es: "hace 3 días", en: "3 days ago" },
    description: {
      es: "Cuarto privado. Solo personas serias.",
      en: "Private room. Serious inquiries only.",
    },
    hasPhoto: true,
    sellerType: "personal",
  },
  {
    id: "rentas-negocio-1",
    category: "rentas",
    title: { es: "Propiedades disponibles (citas)", en: "Available properties (appointments)" },
    priceLabel: { es: "Ver precios", en: "See pricing" },
    city: "San José",
    postedAgo: { es: "hace 6 horas", en: "6 hours ago" },
    description: {
      es: "Apartamentos y casas. Agenda visita hoy.",
      en: "Apartments and houses. Schedule a visit today.",
    },
    hasPhoto: true,
    sellerType: "negocio",
  },
  {
    id: "autos-personal-1",
    category: "autos",
    title: { es: "Honda Civic 2012 — 138k millas", en: "2012 Honda Civic — 138k miles" },
    priceLabel: { es: "$5,900", en: "$5,900" },
    city: "Santa Clara",
    postedAgo: { es: "hace 5 días", en: "5 days ago" },
    description: {
      es: "Título limpio. Mantenimiento al día.",
      en: "Clean title. Well maintained.",
    },
    hasPhoto: true,
    sellerType: "personal",
  },
  {
    id: "autos-negocio-1",
    category: "autos",
    title: { es: "Dealer: autos certificados", en: "Dealer: certified cars" },
    priceLabel: { es: "Financiamiento", en: "Financing" },
    city: "San José",
    postedAgo: { es: "hace 12 horas", en: "12 hours ago" },
    description: {
      es: "Citas disponibles. Pregunta por inventario.",
      en: "Appointments available. Ask about inventory.",
    },
    hasPhoto: true,
    sellerType: "negocio",
  },
];

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function ListaPage() {
  const params = useSearchParams();

  const lang = ((params?.get("lang") as Lang) ?? "es");
  const t = UI[lang];

  const [q, setQ] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY);
  const [zip, setZip] = useState("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS_MI);
  const [category, setCategory] = useState<CategoryKey>("todos");
  const [sort, setSort] = useState<"newest" | "priceAsc" | "priceDesc">("newest");
  const [seller, setSeller] = useState<"all" | SellerType>("all");
  const [withPhoto, setWithPhoto] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Location modal state
  const [locOpen, setLocOpen] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [zipInput, setZipInput] = useState("");

  const ZIP_KEYS = useMemo(() => Object.keys(ZIP_GEO), []);
  const CITY_KEYS = useMemo(() => CA_CITIES.map((c) => c.city), []);

  // ----------------------------------------------------------
  // Anchor (city or zip)
  // ----------------------------------------------------------

  const { anchor, anchorLabel, zipMode } = useMemo(() => {
    const cleanedZip = zip.trim();
    if (cleanedZip.length === 5 && ZIP_GEO[cleanedZip]) {
      const z = ZIP_GEO[cleanedZip];
      return {
        anchor: { lat: z.lat, lng: z.lng },
        anchorLabel: `ZIP ${cleanedZip}`,
        zipMode: true,
      };
    }

    const canonicalCity = canonicalizeCity(city);
    const cityKey = normalize(canonicalCity);
    const found = CA_CITIES.find((c) => normalize(c.city) === cityKey);

    if (found) {
      return {
        anchor: { lat: found.lat, lng: found.lng },
        anchorLabel: canonicalCity,
        zipMode: false,
      };
    }

    // Final fallback
    const fallbackKey = normalize(DEFAULT_CITY);
    const fallback = CA_CITIES.find((c) => normalize(c.city) === fallbackKey) ?? CA_CITIES[0];
    return {
      anchor: { lat: fallback.lat, lng: fallback.lng },
      anchorLabel: DEFAULT_CITY,
      zipMode: false,
    };
  }, [city, zip]);

  // Nearby city chips (based on anchor + radius)
  const nearbyCityChips = useMemo(() => {
    const within = CA_CITIES.map((c) => {
      const d = haversineMiles(anchor, { lat: c.lat, lng: c.lng });
      return { city: c.city, d };
    })
      .filter((x) => x.d <= radiusMi)
      .sort((a, b) => a.d - b.d)
      .slice(0, 12);

    // Always keep the anchor city first when NOT zip mode
    if (!zipMode) {
      const canonical = canonicalizeCity(city);
      const key = normalize(canonical);
      const idx = within.findIndex((x) => normalize(x.city) === key);
      if (idx > 0) {
        const [hit] = within.splice(idx, 1);
        within.unshift(hit);
      }
    }

    return within.map((x) => x.city);
  }, [anchor, radiusMi, zipMode, city]);

  // ----------------------------------------------------------
  // Suggestions
  // ----------------------------------------------------------

  const CITY_SUGGESTIONS = useMemo(() => {
    const n = normalize(cityInput);
    if (!n) return [];
    const hits: string[] = [];

    for (const c of CA_CITIES) {
      const base = normalize(c.city);
      if (base.startsWith(n) || base.includes(n)) hits.push(c.city);

      if (c.aliases?.length) {
        for (const a of c.aliases) {
          const an = normalize(a);
          if (an.startsWith(n) || an.includes(n)) {
            hits.push(c.city);
            break;
          }
        }
      }
      if (hits.length >= 10) break;
    }

    // de-dupe while preserving order
    return Array.from(new Set(hits)).slice(0, 10);
  }, [cityInput]);

  const ZIP_SUGGESTIONS = useMemo(() => {
    const z = zipInput.trim();
    if (!z) return [];
    const hits = ZIP_KEYS.filter((k) => k.startsWith(z)).slice(0, 10);
    return hits;
  }, [zipInput, ZIP_KEYS]);

  // ----------------------------------------------------------
  // Filtering + sorting (template listings)
  // ----------------------------------------------------------

  const filtered = useMemo(() => {
    let list = [...SAMPLE_LISTINGS];

    // category
    if (category !== "todos") {
      list = list.filter((x) => x.category === category);
    }

    // seller
    if (seller !== "all") {
      list = list.filter((x) => x.sellerType === seller);
    }

    // photo
    if (withPhoto) list = list.filter((x) => x.hasPhoto);

    // search query
    const nq = normalize(q);
    if (nq) {
      list = list.filter((x) => {
        const hay = normalize(
          `${x.title[lang]} ${x.description[lang]} ${x.city} ${x.category}`
        );
        return hay.includes(nq);
      });
    }

    // location: keep results within radius of anchor
    list = list.filter((x) => {
      const cityKey = normalize(x.city);
      const c = CA_CITIES.find((cc) => normalize(cc.city) === cityKey);
      if (!c) return true; // if unknown city in template, don't hide it
      const d = haversineMiles(anchor, { lat: c.lat, lng: c.lng });
      return d <= radiusMi;
    });

    // sorting (template-friendly)
    if (sort === "newest") {
      // Template has no timestamps; keep stable order for now
      // (Real data will sort by created_at DESC by default)
    } else if (sort === "priceAsc" || sort === "priceDesc") {
      const num = (s?: string) => {
        if (!s) return Number.NaN;
        const m = s.replace(/[^\d.]/g, "");
        const v = Number(m);
        return Number.isFinite(v) ? v : Number.NaN;
      };

      list = list
        .map((x) => ({ x, p: num(x.priceLabel?.en) }))
        .sort((a, b) => {
          const ap = a.p;
          const bp = b.p;
          const aBad = Number.isNaN(ap);
          const bBad = Number.isNaN(bp);
          if (aBad && bBad) return 0;
          if (aBad) return 1;
          if (bBad) return -1;
          return sort === "priceAsc" ? ap - bp : bp - ap;
        })
        .map((o) => o.x);
    }

    return list;
  }, [category, seller, withPhoto, q, lang, anchor, radiusMi, sort]);

  // ----------------------------------------------------------
  // Chips (active filters) – clean + removable
  // ----------------------------------------------------------

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onClear: () => void }> = [];

    const cleanedZip = zip.trim();
    if (cleanedZip) {
      chips.push({
        key: "zip",
        label: `ZIP: ${cleanedZip}`,
        onClear: () => setZip(""),
      });
    } else if (city && city !== DEFAULT_CITY) {
      chips.push({
        key: "city",
        label: city,
        onClear: () => setCity(DEFAULT_CITY),
      });
    }

    if (radiusMi !== DEFAULT_RADIUS_MI) {
      chips.push({
        key: "radius",
        label: `${t.radiusLabel}: ${radiusMi} mi`,
        onClear: () => setRadiusMi(DEFAULT_RADIUS_MI),
      });
    }

    if (category !== "todos") {
      chips.push({
        key: "category",
        label: category,
        onClear: () => setCategory("todos"),
      });
    }

    if (seller !== "all") {
      chips.push({
        key: "seller",
        label: seller === "personal" ? t.personal : t.business,
        onClear: () => setSeller("all"),
      });
    }

    if (withPhoto) {
      chips.push({
        key: "photo",
        label: t.withPhoto,
        onClear: () => setWithPhoto(false),
      });
    }

    return chips;
  }, [zip, city, radiusMi, category, seller, withPhoto, t]);

  // ----------------------------------------------------------
  // UX: keep view/sort controls sticky (mobile + desktop)
  // ----------------------------------------------------------

  const topControlsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // no-op placeholder for future sticky polish if needed
  }, []);

  // ----------------------------------------------------------
  // Actions
  // ----------------------------------------------------------

  function resetAll() {
    setQ("");
    setCity(DEFAULT_CITY);
    setZip("");
    setRadiusMi(DEFAULT_RADIUS_MI);
    setCategory("todos");
    setSort("newest");
    setSeller("all");
    setWithPhoto(false);
    setViewMode("grid");
  }

  function openLocationModal() {
    setCityInput("");
    setZipInput(zip);
    setLocOpen(true);
  }

  function commitLocation(pendingCity: string, pendingZip: string) {
    const cz = pendingZip.trim();
    const cc = pendingCity.trim();

    if (cz.length === 5 && ZIP_GEO[cz]) {
      setZip(cz);
      setCity(DEFAULT_CITY); // city becomes irrelevant in zipMode
      setLocOpen(false);
      return;
    }

    if (cc) {
      // Try to map to a known city
      const canon = canonicalizeCity(cc);
      setCity(canon);
      setZip(""); // if city is chosen, ZIP should clear (avoid lock-in)
      setLocOpen(false);
      return;
    }

    // If neither valid, just close without changes
    setLocOpen(false);
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-28 text-center">
        <div className="flex justify-center">
          <Image
            src={newLogo}
            alt="LEONIX Media"
            width={140}
            height={140}
            className="h-auto w-[120px] md:w-[140px]"
            priority
          />
        </div>
        <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-yellow-400 md:text-6xl">
          {t.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 md:text-lg">
          {t.subtitle}
        </p>
      </section>

      {/* Filter Bar */}
      <section className="mx-auto mt-10 max-w-6xl px-6">
        <div
          ref={topControlsRef}
          className={cx(
            "rounded-3xl border border-yellow-600/20 bg-black/40 p-5 shadow-[0_0_0_1px_rgba(255,200,0,0.06)]",
            "backdrop-blur",
            "sticky top-16 z-20"
          )}
        >
          {/* Row 1 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Search */}
            <div className="md:col-span-5">
              <label className="block text-sm font-semibold text-gray-200">
                {t.searchLabel}
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-500/40"
              />
            </div>

            {/* Location summary */}
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-200">
                {t.locationLabel}
              </label>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={openLocationModal}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-left text-gray-100 hover:border-yellow-500/30"
                >
                  <span className="truncate">{anchorLabel}</span>
                  <span className="ml-3 text-sm text-gray-400">{t.edit}</span>
                </button>
              </div>
            </div>

            {/* Radius */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-200">
                {t.radiusLabel}
              </label>
              <select
                value={radiusMi}
                onChange={(e) => setRadiusMi(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/40"
              >
                {[5, 10, 25, 50, 100].map((m) => (
                  <option key={m} value={m}>
                    {m} mi
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-200">
                {t.categoryLabel}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/40"
              >
                <option value="todos">{t.all}</option>
                <option value="en-venta">En Venta</option>
                <option value="rentas">Rentas</option>
                <option value="autos">Autos</option>
                <option value="servicios">Servicios</option>
                <option value="empleos">Empleos</option>
                <option value="clases">Clases</option>
                <option value="comunidad">Comunidad</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="mt-4 grid grid-cols-1 items-end gap-4 md:grid-cols-12">
            {/* Sort */}
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-200">
                {t.sortLabel}
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/40"
              >
                <option value="newest">{t.sortNewest}</option>
                <option value="priceAsc">{t.sortPriceAsc}</option>
                <option value="priceDesc">{t.sortPriceDesc}</option>
              </select>
            </div>

            {/* View buttons */}
            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-gray-200">
                {t.view}
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cx(
                    "rounded-2xl border px-4 py-3 text-sm",
                    viewMode === "grid"
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-200"
                      : "border-white/10 bg-black/50 text-gray-200 hover:border-yellow-500/30"
                  )}
                >
                  ⬛⬛
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cx(
                    "rounded-2xl border px-4 py-3 text-sm",
                    viewMode === "list"
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-200"
                      : "border-white/10 bg-black/50 text-gray-200 hover:border-yellow-500/30"
                  )}
                >
                  ☰
                </button>
                <button
                  onClick={() => setViewMode("media")}
                  className={cx(
                    "rounded-2xl border px-4 py-3 text-sm",
                    viewMode === "media"
                      ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-200"
                      : "border-white/10 bg-black/50 text-gray-200 hover:border-yellow-500/30"
                  )}
                >
                  🖼
                </button>
              </div>
            </div>

            {/* More filters (for now: seller + photo) */}
            <div className="md:col-span-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-200">
                    {t.seller}
                  </label>
                  <select
                    value={seller}
                    onChange={(e) => setSeller(e.target.value as any)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/40"
                  >
                    <option value="all">{t.all}</option>
                    <option value="personal">{t.personal}</option>
                    <option value="negocio">{t.business}</option>
                  </select>
                </div>

                <label className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-gray-200 hover:border-yellow-500/30">
                  <input
                    type="checkbox"
                    checked={withPhoto}
                    onChange={(e) => setWithPhoto(e.target.checked)}
                    className="h-4 w-4 accent-yellow-500"
                  />
                  {t.withPhoto}
                </label>
              </div>
            </div>

            {/* Reset */}
            <div className="md:col-span-2">
              <button
                onClick={resetAll}
                className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-200 hover:border-yellow-500/30"
              >
                {t.reset}
              </button>
            </div>
          </div>

          {/* Chips row */}
          {(activeChips.length > 0 || nearbyCityChips.length > 0) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={c.onClear}
                  className="inline-flex items-center gap-2 rounded-full border border-yellow-500/25 bg-yellow-500/10 px-3 py-1 text-sm text-yellow-200 hover:border-yellow-500/40"
                  title="Quitar filtro"
                >
                  <span>{c.label}</span>
                  <span className="opacity-80">×</span>
                </button>
              ))}

              {/* Nearby city quick-pills (not removable; selecting changes city mode) */}
              {!zipMode &&
                nearbyCityChips.map((c) => (
                  <button
                    key={`near-${c}`}
                    onClick={() => setCity(c)}
                    className={cx(
                      "rounded-full border px-3 py-1 text-sm",
                      normalize(c) === normalize(city)
                        ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-200"
                        : "border-white/10 bg-black/40 text-gray-200 hover:border-yellow-500/30"
                    )}
                  >
                    {c}
                  </button>
                ))}
            </div>
          )}
        </div>
      </section>

      {/* Results header */}
      <section className="mx-auto mt-6 max-w-6xl px-6">
        <div className="flex items-center justify-between rounded-3xl border border-yellow-600/20 bg-black/30 px-5 py-4">
          <div>
            <div className="text-xl font-bold text-yellow-400">{t.results}</div>
            <div className="text-sm text-gray-300">
              {t.showing(filtered.length, SAMPLE_LISTINGS.length)}
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto mt-6 max-w-6xl px-6 pb-20">
        <div
          className={cx(
            viewMode === "grid" && "grid grid-cols-1 gap-4 md:grid-cols-3",
            viewMode === "list" && "flex flex-col gap-4",
            viewMode === "media" && "grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
          )}
        >
          {filtered.map((x) => (
            <div
              key={x.id}
              className="rounded-3xl border border-white/10 bg-black/40 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-white">{x.title[lang]}</div>
                  <div className="mt-1 text-sm text-gray-300">
                    {x.city} • {x.postedAgo[lang]}
                  </div>
                </div>
                {x.hasPhoto && (
                  <div className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-gray-200">
                    📷
                  </div>
                )}
              </div>

              {x.priceLabel && (
                <div className="mt-3 text-xl font-extrabold text-yellow-300">
                  {x.priceLabel[lang]}
                </div>
              )}

              <div className="mt-3 text-sm text-gray-200">{x.description[lang]}</div>

              <div className="mt-5">
                <Link
                  href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
                  className="block w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-center text-sm text-gray-100 hover:border-yellow-500/30"
                >
                  {t.viewDetail}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Location Modal */}
      {locOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-yellow-600/20 bg-black/70 p-6 shadow-2xl backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-2xl font-extrabold text-yellow-400">
                  {t.locationLabel}
                </div>
              </div>
              <button
                onClick={() => setLocOpen(false)}
                className="rounded-2xl border border-white/10 bg-black/60 px-4 py-2 text-gray-200 hover:border-yellow-500/30"
              >
                {t.close}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* City */}
              <div>
                <label className="block text-sm font-semibold text-gray-200">
                  {t.cityInputLabel}
                </label>
                <input
                  value={cityInput}
                  onChange={(e) => {
                    setCityInput(e.target.value);
                    if (e.target.value.trim().length > 0) setZipInput("");
                  }}
                  placeholder={t.cityInputPlaceholder}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-500/40"
                />
                <div className="mt-2 text-xs text-gray-400">
                  Si eliges ciudad, el ZIP se limpia automáticamente.
                </div>

                {CITY_SUGGESTIONS.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {CITY_SUGGESTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCityInput(c);
                          setZipInput("");
                        }}
                        className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-sm text-gray-200 hover:border-yellow-500/30"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ZIP */}
              <div>
                <label className="block text-sm font-semibold text-gray-200">
                  {t.zipLabel}
                </label>
                <input
                  value={zipInput}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, "").slice(0, 5);
                    setZipInput(v);
                    if (v.length > 0) setCityInput("");
                  }}
                  placeholder={t.zipInputPlaceholder}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-500/40"
                />
                <div className="mt-2 text-xs text-gray-400">
                  Si usas ZIP (5 dígitos), la ciudad se limpia automáticamente.
                </div>

                {ZIP_SUGGESTIONS.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ZIP_SUGGESTIONS.map((z) => (
                      <button
                        key={z}
                        onClick={() => {
                          setZipInput(z);
                          setCityInput("");
                        }}
                        className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-sm text-gray-200 hover:border-yellow-500/30"
                      >
                        {z}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  // keep as a simple action for now (real geolocation can be wired later)
                  // For now, just default to DEFAULT_CITY and clear ZIP
                  setCity(DEFAULT_CITY);
                  setZip("");
                  setLocOpen(false);
                }}
                className="rounded-2xl border border-white/10 bg-black/60 px-5 py-3 text-gray-200 hover:border-yellow-500/30"
              >
                {t.useMyLocation}
              </button>

              <div className="ml-auto flex gap-3">
                <button
                  onClick={() => {
                    setCityInput("");
                    setZipInput("");
                  }}
                  className="rounded-2xl border border-white/10 bg-black/60 px-5 py-3 text-gray-200 hover:border-yellow-500/30"
                >
                  {t.clear}
                </button>

                <button
                  onClick={() => commitLocation(cityInput, zipInput)}
                  className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-3 font-semibold text-yellow-200 hover:border-yellow-500/60"
                >
                  {t.done}
                </button>
              </div>
            </div>

            {/* Nearby cities (preview) */}
            <div className="mt-6">
              <div className="text-sm font-semibold text-gray-200">{t.nearCities}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {nearbyCityChips.slice(0, 10).map((c) => (
                  <button
                    key={`chip-${c}`}
                    onClick={() => {
                      setCityInput(c);
                      setZipInput("");
                    }}
                    className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-sm text-gray-200 hover:border-yellow-500/30"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
