"use client";

import Image from "next/image";
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

type SellerType = "personal" | "business";
type ListingStatus = "active" | "sold";

type Listing = {
  id: string;
  category: Exclude<CategoryKey, "all">;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
  sellerType: SellerType;
  hasImage: boolean;
  images?: string[];
  status?: ListingStatus;

  // Optional “smart” fields (future)
  year?: number;
  make?: string;
  model?: string;
  price?: number;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalize(s: string) {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function tokenize(s: string) {
  return normalize(s)
    .split(/[^a-z0-9]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function ClasificadosListaPage() {
  const params = useSearchParams();

  // ✅ SAFETY: in some TS environments, params can be typed as possibly null
  const getParam = (key: string) => params?.get(key) ?? "";

  const lang = ((getParam("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        title: "Clasificados",
        subtitle:
          "Filtros primero. Resultados claros. Comunidad primero — ventaja premium sin esconder anuncios gratis.",
        ctaPost: "Publicar anuncio",
        ctaView: "Ver anuncios",
        ctaMemberships: "Membresías",

        filtersTitle: "Filtros",
        searchLabel: "Buscar",
        searchPh: "Busca: “troca”, “cuarto”, “chamba”, “2003 Toyota Celica”…",
        categoryLabel: "Categoría",
        locationLabel: "Ubicación",
        radiusLabel: "Radio",
        sortLabel: "Ordenar",
        moreFilters: "Más filtros",
        reset: "Reiniciar",
        apply: "Aplicar",

        sortNewest: "Más nuevos",
        sortPriceAsc: "Precio ↑",
        sortPriceDesc: "Precio ↓",

        all: "Todo",
        autos: "Autos",
        rentas: "Rentas",
        empleos: "Empleos",
        servicios: "Servicios",
        enVenta: "En Venta",
        clases: "Clases",
        comunidad: "Comunidad",

        resultsTitle: "Resultados",
        showing: "Mostrando",
        of: "de",
        business: "Negocios",
        community: "Comunidad",
        sold: "Vendido",
        personal: "Personal",
        biz: "Negocio",

        trust: "🛡️ LEONIX AI anti-spam activo: contenido familiar, sin duplicados, sin bait pricing.",
      },
      en: {
        title: "Classifieds",
        subtitle:
          "Filters first. Clear results. Community first — premium advantage without hiding free listings.",
        ctaPost: "Post listing",
        ctaView: "View listings",
        ctaMemberships: "Memberships",

        filtersTitle: "Filters",
        searchLabel: "Search",
        searchPh: 'Try: "truck", "room", "job", "2003 Toyota Celica"...',
        categoryLabel: "Category",
        locationLabel: "Location",
        radiusLabel: "Radius",
        sortLabel: "Sort",
        moreFilters: "More filters",
        reset: "Reset",
        apply: "Apply",

        sortNewest: "Newest",
        sortPriceAsc: "Price ↑",
        sortPriceDesc: "Price ↓",

        all: "All",
        autos: "Autos",
        rentas: "Rentals",
        empleos: "Jobs",
        servicios: "Services",
        enVenta: "For Sale",
        clases: "Classes",
        comunidad: "Community",

        resultsTitle: "Results",
        showing: "Showing",
        of: "of",
        business: "Business",
        community: "Community",
        sold: "Sold",
        personal: "Personal",
        biz: "Business",

        trust:
          "🛡️ LEONIX AI anti-spam active: family-safe content, no duplicates, no bait pricing.",
      },
    } as const;

    return ui[lang];
  }, [lang]);

  const categoryLabel = useMemo(() => {
    const map: Record<Exclude<CategoryKey, "all">, { es: string; en: string }> = {
      "en-venta": { es: "En Venta", en: "For Sale" },
      rentas: { es: "Rentas", en: "Rentals" },
      autos: { es: "Autos", en: "Autos" },
      servicios: { es: "Servicios", en: "Services" },
      empleos: { es: "Empleos", en: "Jobs" },
      clases: { es: "Clases", en: "Classes" },
      comunidad: { es: "Comunidad", en: "Community" },
    };
    return map;
  }, []);

  const CATEGORY_ORDER: Array<Exclude<CategoryKey, "all">> = useMemo(
    () => ["autos", "rentas", "empleos", "servicios", "en-venta", "clases", "comunidad"],
    []
  );

  // URL params (from landing) — ✅ safe getParam()
  const qParam = (getParam("q") || "").trim();
  const catParam = (getParam("cat") || "").trim() as CategoryKey;
  const cityParam = (getParam("city") || "").trim();
  const zipParam = (getParam("zip") || "").trim();
  const rParam = Number(getParam("r") || "");

  // State (filters)
  const [search, setSearch] = useState<string>(qParam);
  const [category, setCategory] = useState<CategoryKey>(
    catParam && (catParam === "all" || CATEGORY_ORDER.includes(catParam as any))
      ? catParam
      : "all"
  );
  const [city, setCity] = useState<string>(cityParam || DEFAULT_CITY);
  const [zip, setZip] = useState<string>(zipParam || "");
  const [radiusMi, setRadiusMi] = useState<number>(
    Number.isFinite(rParam) && rParam > 0 ? rParam : DEFAULT_RADIUS_MI
  );
  const [sort, setSort] = useState<"newest" | "priceAsc" | "priceDesc">("newest");
  const [showMore, setShowMore] = useState(false);

  // Keep state in sync on first load
  useEffect(() => {
    setSearch(qParam);
    setCategory(
      catParam && (catParam === "all" || CATEGORY_ORDER.includes(catParam as any))
        ? catParam
        : "all"
    );
    setCity(cityParam || DEFAULT_CITY);
    setZip(zipParam || "");
    setRadiusMi(Number.isFinite(rParam) && rParam > 0 ? rParam : DEFAULT_RADIUS_MI);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Location helpers
  const haversineMi = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 3958.8;
    const toRad = (d: number) => (d * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);

    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  const resolveZipLatLng = (z: string) => {
    const clean = (z || "").replace(/[^0-9]/g, "").slice(0, 5);
    const hit = ZIP_GEO[clean];
    return hit ? { lat: hit.lat, lng: hit.lng, zip: clean, city: hit.city } : null;
  };

  const resolveCityLatLng = (inputCity: string) => {
    const key = normalize(inputCity);
    const canonical = CITY_ALIASES[key] ?? inputCity;
    const found = CA_CITIES.find((c) => normalize(c.city) === normalize(canonical));
    return found ? { lat: found.lat, lng: found.lng, city: found.city } : null;
  };

  const geoAnchor = useMemo(() => {
    if (zip) {
      const z = resolveZipLatLng(zip);
      if (z) return { lat: z.lat, lng: z.lng };
    }
    const c = resolveCityLatLng(city);
    return c ? { lat: c.lat, lng: c.lng } : null;
  }, [city, zip]);

  const filtered = useMemo(() => {
    const q = normalize(search);
    const tokens = tokenize(search);

    const anchor = geoAnchor;
    const withinRadius = (listingCity: string) => {
      if (!anchor) return true;
      const c = resolveCityLatLng(listingCity);
      if (!c) return true;
      const d = haversineMi(anchor, { lat: c.lat, lng: c.lng });
      return d <= radiusMi;
    };

    return (SAMPLE_LISTINGS as Listing[])
      .filter((x) => (category === "all" ? true : x.category === category))
      .filter((x) => withinRadius(x.city))
      .filter((x) => {
        if (!q) return true;
        const hay = normalize(`${x.title.es} ${x.title.en} ${x.blurb.es} ${x.blurb.en} ${x.city}`);
        if (hay.includes(q)) return true;
        // token match for multi-word queries like "2003 toyota celica"
        return tokens.every((tok) => hay.includes(tok));
      });
  }, [search, category, geoAnchor, radiusMi]);

  const sorted = useMemo(() => {
    const items = [...filtered];
    if (sort === "newest") return items;
    if (sort === "priceAsc") {
      return items.sort((a, b) => (a.price ?? 9e15) - (b.price ?? 9e15));
    }
    return items.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  }, [filtered, sort]);

  const businessCount = useMemo(
    () => sorted.filter((x) => x.sellerType === "business").length,
    [sorted]
  );
  const personalCount = useMemo(
    () => sorted.filter((x) => x.sellerType === "personal").length,
    [sorted]
  );

  // Pagination (simple)
  const [page, setPage] = useState(1);
  const perPage = useMemo(
    () => (typeof window !== "undefined" && window.innerWidth < 768 ? 10 : 18),
    []
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paged = useMemo(
    () => sorted.slice((page - 1) * perPage, page * perPage),
    [sorted, page, perPage]
  );

  useEffect(() => {
    setPage(1);
  }, [search, category, city, zip, radiusMi, sort]);

  // UI
  return (
    <div className="bg-black min-h-screen text-white pb-28">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="text-center">
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />
          <h1 className="text-6xl md:text-7xl font-bold text-yellow-400">{t.title}</h1>
          <p className="mt-5 text-gray-300 max-w-3xl mx-auto text-lg md:text-xl">{t.subtitle}</p>

          {/* Sticky CTA pills */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a
              href={`/clasificados/publicar?lang=${lang}`}
              className="px-5 py-2.5 rounded-full bg-yellow-400 text-black font-extrabold hover:opacity-95 transition"
            >
              {t.ctaPost}
            </a>
            <a
              href={`#filters`}
              className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              {t.ctaView}
            </a>
            <a
              href={`#membresias`}
              className="px-5 py-2.5 rounded-full border border-yellow-600/20 bg-black/30 text-yellow-200 font-semibold hover:bg-black/45 transition"
            >
              {t.ctaMemberships}
            </a>
          </div>

          <div className="mt-8 max-w-4xl mx-auto text-sm text-gray-300">{t.trust}</div>
        </div>

        {/* FILTER BAR */}
        <div id="filters" className="mt-12 border border-yellow-600/20 rounded-2xl bg-black/30 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-lg font-bold text-yellow-200">{t.filtersTitle}</div>
            <button
              onClick={() => setShowMore((v) => !v)}
              className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition text-sm"
            >
              {t.moreFilters}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <div className="text-sm text-gray-300 mb-2 text-left">{t.searchLabel}</div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPh}
                className="w-full rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 px-5 py-3"
              />
            </div>

            <div className="md:col-span-3">
              <div className="text-sm text-gray-300 mb-2 text-left">{t.locationLabel}</div>
              <input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setZip("");
                }}
                placeholder={DEFAULT_CITY}
                className="w-full rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 px-5 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-gray-300 mb-2 text-left">ZIP</div>
              <input
                value={zip}
                onChange={(e) => {
                  setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5));
                }}
                inputMode="numeric"
                placeholder="95116"
                className="w-full rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 px-5 py-3"
              />
            </div>

            <div className="md:col-span-2">
              <div className="text-sm text-gray-300 mb-2 text-left">{t.categoryLabel}</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="w-full rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 px-4 py-3"
              >
                <option value="all">{t.all}</option>
                {CATEGORY_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {categoryLabel[k][lang]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showMore && (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-6">
                <div className="text-sm text-gray-300 mb-2 text-left">
                  {t.radiusLabel}: {radiusMi} mi
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={radiusMi}
                  onChange={(e) => setRadiusMi(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-4">
                <div className="text-sm text-gray-300 mb-2 text-left">{t.sortLabel}</div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                  className="w-full rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 px-4 py-3"
                >
                  <option value="newest">{t.sortNewest}</option>
                  <option value="priceAsc">{t.sortPriceAsc}</option>
                  <option value="priceDesc">{t.sortPriceDesc}</option>
                </select>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button
                  onClick={() => {
                    setSearch("");
                    setCategory(catParam && catParam !== "all" ? catParam : "all");
                    setCity(cityParam || DEFAULT_CITY);
                    setZip(zipParam || "");
                    setRadiusMi(
                      Number.isFinite(rParam) && rParam > 0 ? rParam : DEFAULT_RADIUS_MI
                    );
                    setSort("newest");
                  }}
                  className="w-full px-4 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
                >
                  {t.reset}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS */}
        <div className="mt-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="text-2xl font-bold text-yellow-200">{t.resultsTitle}</div>
              <div className="text-sm text-gray-300 mt-1">
                {t.showing}{" "}
                <span className="text-gray-100 font-semibold">
                  {sorted.length === 0 ? 0 : (page - 1) * perPage + 1}–
                  {Math.min(page * perPage, sorted.length)}
                </span>{" "}
                {t.of} <span className="text-gray-100 font-semibold">{sorted.length}</span>
                {" • "}
                <span className="text-gray-100 font-semibold">
                  {t.business}: {businessCount}
                </span>
                {" • "}
                <span className="text-gray-100 font-semibold">
                  {t.community}: {personalCount}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            {paged.map((x) => {
              const title = x.title[lang];
              const price = x.priceLabel[lang];
              const ago = x.postedAgo[lang];
              const blurb = x.blurb[lang];
              const status = x.status || "active";

              return (
                <a
                  key={x.id}
                  href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
                  className="rounded-2xl border border-white/10 bg-black/30 hover:bg-black/40 transition p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-lg font-extrabold text-gray-100">{title}</div>
                    <div className="text-yellow-200 font-extrabold">{price}</div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full border border-white/10 bg-black/30 text-gray-200">
                      {x.city}
                    </span>
                    <span className="px-2 py-1 rounded-full border border-white/10 bg-black/30 text-gray-400">
                      {ago}
                    </span>
                    <span className="px-2 py-1 rounded-full border border-white/10 bg-black/30 text-gray-200">
                      {x.sellerType === "business" ? t.biz : t.personal}
                    </span>
                    {status === "sold" && (
                      <span className="px-2 py-1 rounded-full border border-yellow-400/40 bg-yellow-400/10 text-yellow-200 font-semibold">
                        {t.sold}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-sm text-gray-300 line-clamp-3">{blurb}</div>

                  <div className="mt-4 text-sm text-gray-400">
                    {lang === "es" ? "Ver detalles →" : "View details →"}
                  </div>
                </a>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition disabled:opacity-40 disabled:hover:bg-black/30"
            >
              {lang === "es" ? "Anterior" : "Prev"}
            </button>
            <div className="text-sm text-gray-300">
              {page} / {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition disabled:opacity-40 disabled:hover:bg-black/30"
            >
              {lang === "es" ? "Siguiente" : "Next"}
            </button>
          </div>
        </div>

        {/* Memberships anchor (placeholder for now) */}
        <div id="membresias" className="mt-16 border border-yellow-600/20 rounded-2xl bg-black/30 p-6">
          <div className="text-2xl font-bold text-yellow-200">
            {lang === "es" ? "Membresías" : "Memberships"}
          </div>
          <div className="mt-2 text-gray-300">
            {lang === "es"
              ? "Próximo: resumen de planes (Gratis, LEONIX Pro, Business Lite, Business Premium)."
              : "Next: plan summary (Free, LEONIX Pro, Business Lite, Business Premium)."}
          </div>
        </div>
      </section>
    </div>
  );
}
