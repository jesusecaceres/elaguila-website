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

const CATEGORY_ORDER: Array<Exclude<CategoryKey, "all">> = [
  "autos",
  "rentas",
  "empleos",
  "servicios",
  "en-venta",
  "clases",
  "comunidad",
];

const LABELS = {
  title: { es: "Clasificados", en: "Classifieds" },
  results: { es: "Resultados", en: "Results" },
  search: { es: "Buscar", en: "Search" },
  location: { es: "Ubicación", en: "Location" },
  city: { es: "Ciudad", en: "City" },
  zip: { es: "Código ZIP", en: "ZIP" },
  radius: { es: "Radio", en: "Radius" },
  category: { es: "Categoría", en: "Category" },
  sort: { es: "Ordenar", en: "Sort" },
  more: { es: "Más filtros", en: "More filters" },
  reset: { es: "Restablecer", en: "Reset" },
  posted: { es: "Publicado", en: "Posted" },
  seller: { es: "Vendedor", en: "Seller" },
  hasImage: { es: "Con foto", en: "Has image" },
  any: { es: "Todos", en: "All" },
  newest: { es: "Más nuevos", en: "Newest" },
  priceAsc: { es: "Precio ↑", en: "Price ↑" },
  priceDesc: { es: "Precio ↓", en: "Price ↓" },
  personal: { es: "Personal", en: "Personal" },
  business: { es: "Negocio", en: "Business" },
  free: { es: "Gratis", en: "Free" },
};

function isCategoryKey(v: string): v is CategoryKey {
  return (
    v === "all" ||
    v === "en-venta" ||
    v === "rentas" ||
    v === "autos" ||
    v === "servicios" ||
    v === "empleos" ||
    v === "clases" ||
    v === "comunidad"
  );
}

type SortKey = "newest" | "price-asc" | "price-desc";

const RADIUS_OPTIONS = [10, 25, 40, 50];

function formatMi(mi: number, lang: Lang) {
  return lang === "es" ? `${mi} mi` : `${mi} mi`;
}

function toNumberOrUndefined(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default function ClasificadosListaPage() {
  const params = useSearchParams();
  const getParam = (k: string) => params?.get(k) ?? "";

  const lang = (getParam("lang") as Lang) === "en" ? "en" : "es";

  // Query params
  const qParam = getParam("q");
  const catParam = getParam("cat");
  const cityParam = getParam("city");
  const zipParam = getParam("zip");
  const rParam = getParam("r");
  const sortParam = getParam("sort");

  // Local state mirrors params (for controlled inputs)
  const [q, setQ] = useState<string>(qParam);
  const [category, setCategory] = useState<CategoryKey>(
    isCategoryKey(catParam) ? catParam : "all"
  );
  const [city, setCity] = useState<string>(cityParam || DEFAULT_CITY);
  const [zip, setZip] = useState<string>(zipParam);
  const [radiusMi, setRadiusMi] = useState<number>(
    toNumberOrUndefined(rParam) ?? DEFAULT_RADIUS_MI
  );
  const [sort, setSort] = useState<SortKey>(
    sortParam === "price-asc" ||
      sortParam === "price-desc" ||
      sortParam === "newest"
      ? (sortParam as SortKey)
      : "newest"
  );

  const [sellerType, setSellerType] = useState<"" | SellerType>("");
  const [onlyWithImage, setOnlyWithImage] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // Suggestions UX state
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const sugRef = useRef<HTMLDivElement | null>(null);

  // Keep state in sync if params change (rare, but safe)
  useEffect(() => {
    setQ(qParam);
    setCategory(isCategoryKey(catParam) ? catParam : "all");
    setCity(cityParam || DEFAULT_CITY);
    setZip(zipParam);
    setRadiusMi(toNumberOrUndefined(rParam) ?? DEFAULT_RADIUS_MI);
    setSort(
      sortParam === "price-asc" ||
        sortParam === "price-desc" ||
        sortParam === "newest"
        ? (sortParam as SortKey)
        : "newest"
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qParam, catParam, cityParam, zipParam, rParam, sortParam]);

  // Suggestion dictionary
  const searchDictionary = useMemo(() => {
    const base = new Set<string>();

    // Categories / common terms
    base.add(lang === "es" ? "autos" : "cars");
    base.add(lang === "es" ? "rentas" : "rentals");
    base.add(lang === "es" ? "empleos" : "jobs");
    base.add(lang === "es" ? "servicios" : "services");

    // Slang / variants (requested)
    base.add("troca");
    base.add("camioneta");
    base.add("pickup");
    base.add("pick-up");
    base.add("truck");

    // Extract words from listings (simple)
    for (const l of SAMPLE_LISTINGS as any) {
      const t = `${l?.title?.es ?? ""} ${l?.title?.en ?? ""} ${l?.blurb?.es ?? ""} ${
        l?.blurb?.en ?? ""
      }`;
      for (const w of t.split(/\s+/g)) {
        const n = normalize(w);
        if (n.length >= 3) base.add(n);
      }
    }

    return Array.from(base);
  }, [lang]);

  // Update suggestions as user types
  useEffect(() => {
    const val = normalize(q);
    if (!val || val.length < 1) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const hits = searchDictionary
      .filter((s) => normalize(s).includes(val))
      .slice(0, 8);

    setSuggestions(hits);
    setSuggestionsOpen(hits.length > 0);
  }, [q, searchDictionary]);

  // Close suggestions on outside click
  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (inputRef.current && inputRef.current.contains(t)) return;
      if (sugRef.current && sugRef.current.contains(t)) return;
      setSuggestionsOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  // Pagination
  const perPage = useMemo(
    () => (typeof window !== "undefined" && window.innerWidth < 768 ? 10 : 18),
    []
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [q, category, city, zip, radiusMi, sellerType, onlyWithImage, sort]);

  // Compute listing matches
  const filtered = useMemo(() => {
    const nq = normalize(q);
    const hasQ = nq.length > 0;

    const cityNorm = normalize(city);
    const zipNorm = zip.trim();

    const wantLatLng = (() => {
      if (zipNorm) return ZIP_GEO[zipNorm];
      const alias = CITY_ALIASES[cityNorm];
      const key = alias ? normalize(alias) : cityNorm;

      // ✅ CityRecord uses `city`, not `name`
      const c = CA_CITIES.find((x) => normalize(x.city) === key);
      return c ? { lat: c.lat, lng: c.lng } : undefined;
    })();

    const withinRadius = (listingCity: string) => {
      if (!wantLatLng) return true;

      const lcNorm = normalize(listingCity);
      const alias = CITY_ALIASES[lcNorm];
      const key = alias ? normalize(alias) : lcNorm;

      // ✅ CityRecord uses `city`, not `name`
      const c = CA_CITIES.find((x) => normalize(x.city) === key);
      if (!c) return true; // if unknown city, don't block it

      // Haversine-ish
      const R = 3958.8; // miles
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(c.lat - wantLatLng.lat);
      const dLng = toRad(c.lng - wantLatLng.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(wantLatLng.lat)) *
          Math.cos(toRad(c.lat)) *
          Math.sin(dLng / 2) ** 2;
      const d = 2 * R * Math.asin(Math.sqrt(a));
      return d <= radiusMi;
    };

    return (SAMPLE_LISTINGS as unknown as Listing[])
      .filter((x) => (category === "all" ? true : x.category === category))
      .filter((x) => (sellerType ? x.sellerType === sellerType : true))
      .filter((x) => (onlyWithImage ? x.hasImage : true))
      .filter((x) => withinRadius(x.city))
      .filter((x) => {
        if (!hasQ) return true;

        const hay = normalize(
          `${x.title.es} ${x.title.en} ${x.blurb.es} ${x.blurb.en} ${x.city} ${
            x.year ?? ""
          } ${x.make ?? ""} ${x.model ?? ""}`
        );

        const qSyn = nq
          .replace(/\btroca\b/g, "truck")
          .replace(/\bcamioneta\b/g, "truck")
          .replace(/\bpick-?up\b/g, "truck");

        return hay.includes(qSyn);
      })
      .sort((a, b) => {
        if (sort === "newest") return 0; // sample data already “recent-ish”
        const ap = a.price ?? 0;
        const bp = b.price ?? 0;
        if (sort === "price-asc") return ap - bp;
        return bp - ap;
      });
  }, [q, category, city, zip, radiusMi, sellerType, onlyWithImage, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  const visible = useMemo(() => {
    const start = (pageClamped - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, pageClamped, perPage]);

  const categoryLabel = (c: CategoryKey) => {
    if (c === "all") return LABELS.any[lang];
    const map: Record<Exclude<CategoryKey, "all">, { es: string; en: string }> = {
      "en-venta": { es: "En Venta", en: "For Sale" },
      rentas: { es: "Rentas", en: "Rentals" },
      autos: { es: "Autos", en: "Cars" },
      servicios: { es: "Servicios", en: "Services" },
      empleos: { es: "Empleos", en: "Jobs" },
      clases: { es: "Clases", en: "Classes" },
      comunidad: { es: "Comunidad", en: "Community" },
    };
    return map[c][lang];
  };

  const badgeFor = (t: SellerType) => {
    if (t === "business")
      return {
        text: lang === "es" ? "Corona" : "Crown",
        cls: "bg-yellow-500/15 text-yellow-200 border-yellow-400/30",
      };
    return {
      text: lang === "es" ? "Joya" : "Gem",
      cls: "bg-white/10 text-white border-white/20",
    };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#241300] to-black opacity-90" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 md:py-16 text-center">
          <div className="mx-auto mb-6 flex w-full justify-center">
            <Image
              src={newLogo}
              alt="LEONIX MEDIA"
              width={140}
              height={140}
              priority
              className="h-auto w-[110px] md:w-[140px]"
            />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-yellow-300 md:text-5xl">
            {LABELS.title[lang]}
          </h1>
          <p className="mt-3 text-sm text-gray-300 md:text-base">
            {lang === "es"
              ? "Explora todos los anuncios con filtros."
              : "Browse all listings with filters."}
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 pb-20">
        {/* Filter Bar */}
        <section className="sticky top-0 z-30 -mx-4 bg-black/80 px-4 py-3 backdrop-blur md:py-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg md:p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-3">
              {/* Search */}
              <div className="relative md:col-span-5">
                <label className="mb-1 block text-xs text-gray-300">
                  {LABELS.search[lang]}
                </label>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setSuggestionsOpen(true);
                  }}
                  placeholder={
                    lang === "es"
                      ? "Buscar: celica 2003, troca, cuarto..."
                      : "Search: 2003 celica, truck, room..."
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/40"
                />
                {suggestionsOpen && suggestions.length > 0 && (
                  <div
                    ref={sugRef}
                    className="absolute left-0 right-0 mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-xl"
                  >
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onMouseDown={(e) => {
                          // prevent input blur
                          e.preventDefault();
                        }}
                        onClick={() => {
                          setQ(s);
                          setSuggestionsOpen(false);
                          inputRef.current?.focus();
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="md:col-span-3">
                <label className="mb-1 block text-xs text-gray-300">
                  {LABELS.location[lang]}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={LABELS.city[lang]}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/40"
                  />
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    placeholder={LABELS.zip[lang]}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/40"
                  />
                </div>
              </div>

              {/* Radius */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-gray-300">
                  {LABELS.radius[lang]}
                </label>
                <select
                  value={radiusMi}
                  onChange={(e) => setRadiusMi(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/40"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {formatMi(r, lang)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category + Sort */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs text-gray-300">
                  {LABELS.category[lang]}
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const v = e.target.value;
                    setCategory(isCategoryKey(v) ? v : "all");
                  }}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/40"
                >
                  <option value="all">{LABELS.any[lang]}</option>
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabel(c)}
                    </option>
                  ))}
                </select>

                <div className="mt-2">
                  <label className="mb-1 block text-xs text-gray-300">
                    {LABELS.sort[lang]}
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/40"
                  >
                    <option value="newest">{LABELS.newest[lang]}</option>
                    <option value="price-asc">{LABELS.priceAsc[lang]}</option>
                    <option value="price-desc">{LABELS.priceDesc[lang]}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* More filters */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowMore((s) => !s)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10"
              >
                {LABELS.more[lang]}
              </button>

              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setCategory("all");
                  setCity(DEFAULT_CITY);
                  setZip("");
                  setRadiusMi(DEFAULT_RADIUS_MI);
                  setSort("newest");
                  setSellerType("");
                  setOnlyWithImage(false);
                  setShowMore(false);
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10"
              >
                {LABELS.reset[lang]}
              </button>
            </div>

            {showMore && (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-300">
                    {LABELS.seller[lang]}
                  </label>
                  <select
                    value={sellerType}
                    onChange={(e) => setSellerType(e.target.value as any)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/40"
                  >
                    <option value="">{LABELS.any[lang]}</option>
                    <option value="personal">{LABELS.personal[lang]}</option>
                    <option value="business">{LABELS.business[lang]}</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="hasImage"
                    type="checkbox"
                    checked={onlyWithImage}
                    onChange={(e) => setOnlyWithImage(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40"
                  />
                  <label htmlFor="hasImage" className="text-sm text-gray-200">
                    {LABELS.hasImage[lang]}
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Results header */}
        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-yellow-200 md:text-xl">
              {LABELS.results[lang]}
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              {lang === "es"
                ? `Mostrando ${visible.length} de ${filtered.length}`
                : `Showing ${visible.length} of ${filtered.length}`}
            </p>
          </div>

          <div className="text-xs text-gray-400">
            {lang === "es"
              ? `Página ${pageClamped} de ${totalPages}`
              : `Page ${pageClamped} of ${totalPages}`}
          </div>
        </div>

        {/* Listings */}
        <section className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((x) => {
            const b = badgeFor(x.sellerType);
            return (
              <article
                key={x.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">
                      {x.title[lang]}
                    </div>
                    <div className="mt-1 text-xs text-gray-400">
                      {x.city} • {x.postedAgo[lang]}
                    </div>
                  </div>
                  <div
                    className={cx(
                      "shrink-0 rounded-full border px-2 py-1 text-[11px]",
                      b.cls
                    )}
                  >
                    {b.text}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-yellow-200">
                    {x.priceLabel[lang] || LABELS.free[lang]}
                  </div>
                  <div className="text-xs text-gray-400">
                    {x.hasImage ? "📷" : ""}
                  </div>
                </div>

                <p className="mt-3 text-sm text-gray-300">{x.blurb[lang]}</p>

                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-gray-100 hover:bg-black/40"
                  >
                    {lang === "es" ? "Ver detalle" : "View details"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={pageClamped <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cx(
              "rounded-xl border border-white/10 px-3 py-2 text-sm",
              pageClamped <= 1
                ? "bg-white/5 text-gray-500"
                : "bg-white/10 text-gray-100 hover:bg-white/15"
            )}
          >
            {lang === "es" ? "Anterior" : "Prev"}
          </button>

          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200">
            {pageClamped}/{totalPages}
          </div>

          <button
            type="button"
            disabled={pageClamped >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cx(
              "rounded-xl border border-white/10 px-3 py-2 text-sm",
              pageClamped >= totalPages
                ? "bg-white/5 text-gray-500"
                : "bg-white/10 text-gray-100 hover:bg-white/15"
            )}
          >
            {lang === "es" ? "Siguiente" : "Next"}
          </button>
        </div>

        {/* Membership anchor placeholder */}
        <section id="membresias" className="mt-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold text-yellow-200">
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
    </div>
  );
}
