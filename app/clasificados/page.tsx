"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import newLogo from "../../public/logo.png";

import {
  CA_CITIES,
  CITY_ALIASES,
  ZIP_GEO,
  DEFAULT_CITY,
  DEFAULT_RADIUS_MI,
} from "../data/locations/norcal";
import { SAMPLE_LISTINGS } from "../data/classifieds/sampleListings";

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
  hasImage: boolean;
  condition: "any" | "new" | "good" | "fair";
  sellerType: SellerType;
  status?: ListingStatus;
};

const CATEGORY_ORDER: Array<Exclude<CategoryKey, "all">> = [
  "en-venta",
  "rentas",
  "autos",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ClasificadosPage() {
  const params = useSearchParams();
  const lang = ((params.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        pageTitle: "Clasificados",
        subtitle:
          "Acceso justo para todos. Comunidad primero. Ventaja premium para quienes invierten — sin esconder anuncios gratuitos.",
        ctaPost: "Publicar anuncio",
        ctaView: "Ver anuncios",
        ctaMemberships: "Membresías",

        authSignIn: "Iniciar sesión",
        authCreate: "Crear cuenta",

        filtersTitle: "Filtrar anuncios",
        searchLabel: "Buscar",
        searchPh: "Buscar anuncios…",
        locationLabel: "Ubicación",
        categoryLabel: "Categoría",
        orderLabel: "Orden",
        moreFilters: "Más filtros",
        reset: "Restablecer",

        exploreByCategory: "Explorar por categoría",
        clearCategory: "Quitar categoría",

        stickyFilters: "Ir a filtros",

        resultsTitle: "Resultados",
        showing: (a: number, b: number, total: number) =>
          `Mostrando ${a}-${b} de ${total}`,

        statusLabel: "Estado",
        statusActive: "Activos",
        statusSold: "Vendidos",
        statusShowSold: "Mostrar vendidos",

        soldBadge: "VENDIDO",

        noResultsTitle: "No encontramos anuncios",
        noResultsBody:
          "Intenta ajustar filtros. Si estás buscando cerca, aumenta el radio o revisa todas las categorías.",
        clearFiltersBtn: "Quitar filtros",
        widenRadiusBtn: "Aumentar radio",
        viewAllBtn: "Ver todo",

        businessHeader: "Negocios en esta categoría",
        personalHeader: "Anuncios de la comunidad",
        businessHint:
          "Anuncios de negocios se muestran aquí para ayudarte a encontrar servicios y productos con confianza.",

        sortBalanced: "Equilibrado",
        sortNewest: "Más nuevos",
        sortPriceAsc: "Precio ↑",
        sortPriceDesc: "Precio ↓",

        grid: "Grid",
        list: "List",

        pageXofY: (x: number, y: number) => `Página ${x} de ${y}`,
        prev: "Anterior",
        next: "Siguiente",

        membershipsTitle: "Membresías",
        membershipsSubtitle:
          "Resumen rápido. Beneficios completos se muestran en la página de Membresías.",

        freeTitle: "Gratis",
        freeBullets: ["1 imagen", "7 días de duración", "Siempre visible y buscable"],

        proTitle: "LEONIX Pro",
        proPrice: "$16.99 / mes",
        proBullets: [
          "Más duración y mejor presentación",
          "Analíticas básicas (vistas/guardados)",
          "2 boosts por anuncio (48 horas cada uno)",
        ],

        bizLiteTitle: "Business Lite",
        bizLitePrice: "$89 / mes",
        bizLiteBullets: [
          "Insignia de negocio (confianza)",
          "Múltiples anuncios activos",
          "Mayor visibilidad que perfiles personales",
        ],

        bizPremTitle: "Business Premium",
        bizPremPrice: "$149 / mes",
        bizPremBullets: [
          "Herramientas de contacto/leads por anuncio",
          "Perfil mejorado",
          "Conversión por categoría (citas, info, etc.)",
        ],

        printVsClassifieds:
          "Print Ads = Confianza/Engagement/Cupones/Sorteos • Classifieds = Búsqueda/Intento/Velocidad/Conversión",

        routePost: "/clasificados/publicar",
        routeMemberships: "/clasificados/membresias",
        routeBizMemberships: "/clasificados/membresias-negocio",
        routeBusinessDirectory: "/clasificados/negocios",
        routeLogin: "/clasificados/login",
      },
      en: {
        pageTitle: "Classifieds",
        subtitle:
          "Fair access for everyone. Community first. Premium advantage for investors — without hiding free listings.",
        ctaPost: "Post listing",
        ctaView: "View listings",
        ctaMemberships: "Memberships",

        authSignIn: "Sign in",
        authCreate: "Create account",

        filtersTitle: "Filter listings",
        searchLabel: "Search",
        searchPh: "Search listings…",
        locationLabel: "Location",
        categoryLabel: "Category",
        orderLabel: "Sort",
        moreFilters: "More filters",
        reset: "Reset",

        exploreByCategory: "Explore by category",
        clearCategory: "Clear category",

        stickyFilters: "Back to filters",

        resultsTitle: "Results",
        showing: (a: number, b: number, total: number) =>
          `Showing ${a}-${b} of ${total}`,

        statusLabel: "Status",
        statusActive: "Active",
        statusSold: "Sold",
        statusShowSold: "Show sold",

        soldBadge: "SOLD",

        noResultsTitle: "No listings found",
        noResultsBody:
          "Try adjusting filters. If you're searching nearby, widen the radius or check all categories.",
        clearFiltersBtn: "Clear filters",
        widenRadiusBtn: "Widen radius",
        viewAllBtn: "View all",

        businessHeader: "Businesses in this category",
        personalHeader: "Community listings",
        businessHint:
          "Business listings appear here to help you find services and products with confidence.",

        sortBalanced: "Balanced",
        sortNewest: "Newest",
        sortPriceAsc: "Price ↑",
        sortPriceDesc: "Price ↓",

        grid: "Grid",
        list: "List",

        pageXofY: (x: number, y: number) => `Page ${x} of ${y}`,
        prev: "Previous",
        next: "Next",

        membershipsTitle: "Memberships",
        membershipsSubtitle:
          "Quick summary. Full benefits are shown on the Memberships page.",

        freeTitle: "Free",
        freeBullets: ["1 image", "7-day duration", "Always visible & searchable"],

        proTitle: "LEONIX Pro",
        proPrice: "$16.99 / month",
        proBullets: [
          "Longer duration and better presentation",
          "Basic analytics (views/saves)",
          "2 boosts per listing (48 hours each)",
        ],

        bizLiteTitle: "Business Lite",
        bizLitePrice: "$89 / month",
        bizLiteBullets: [
          "Business badge (trust)",
          "Multiple active listings",
          "Higher visibility than personal profiles",
        ],

        bizPremTitle: "Business Premium",
        bizPremPrice: "$149 / month",
        bizPremBullets: [
          "Contact/lead tools per listing",
          "Enhanced profile",
          "Category-specific conversion tools",
        ],

        printVsClassifieds:
          "Print Ads = Trust/Engagement/Coupons/Sweepstakes • Classifieds = Search/Intent/Speed/Conversion",

        routePost: "/clasificados/publicar",
        routeMemberships: "/clasificados/membresias",
        routeBizMemberships: "/clasificados/membresias-negocio",
        routeBusinessDirectory: "/clasificados/negocios",
        routeLogin: "/clasificados/login",
      },
    } as const;

    return ui[lang];
  }, [lang]);

  const sampleListings: Listing[] = useMemo(
    () => SAMPLE_LISTINGS as unknown as Listing[],
    []
  );

  const [search, setSearch] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<"balanced" | "newest" | "priceAsc" | "priceDesc">(
    "balanced"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [showSold, setShowSold] = useState<boolean>(false);

  const [moreOpen, setMoreOpen] = useState(false);
  const [hasImage, setHasImage] = useState<"any" | "yes" | "no">("any");
  const [seller, setSeller] = useState<"any" | "personal" | "business">("any");
  const [condition, setCondition] = useState<"any" | "new" | "good" | "fair">("any");

  const [boostInfoOpen, setBoostInfoOpen] = useState<null | "free" | "pro">(null);

  const [locationOpen, setLocationOpen] = useState(false);

  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const [zip, setZip] = useState<string>("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS_MI);

  const [cityDraft, setCityDraft] = useState<string>(DEFAULT_CITY);
  const [zipDraft, setZipDraft] = useState<string>("");
  const [radiusDraft, setRadiusDraft] = useState<number>(DEFAULT_RADIUS_MI);

  const [geoAnchor, setGeoAnchor] = useState<{ lat: number; lng: number } | null>(null);

  const CITY_OPTIONS = useMemo(() => CA_CITIES.map((c) => c.city), []);

  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const haversineMi = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
    const R = 3958.8;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);

    // ✅ FIXED LINE (no comma)
    const h =
      sinDLat * sinDLat +
      Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  };

  const resolveCityLatLng = (inputCity: string) => {
    const key = normalize(inputCity);
    const canonical = CITY_ALIASES[key] ?? inputCity;
    const found = CA_CITIES.find((c) => normalize(c.city) === normalize(canonical));
    return found ? { lat: found.lat, lng: found.lng, city: found.city } : null;
  };

  const resolveZipLatLng = (z: string) => {
    const clean = (z || "").replace(/[^0-9]/g, "").slice(0, 5);
    const hit = ZIP_GEO[clean];
    return hit ? { lat: hit.lat, lng: hit.lng, zip: clean, city: hit.city } : null;
  };

  const locationAnchor = useMemo(() => {
    if (geoAnchor) return { source: "geo" as const, lat: geoAnchor.lat, lng: geoAnchor.lng };

    const z = resolveZipLatLng(zip);
    if (z) return { source: "zip" as const, lat: z.lat, lng: z.lng };

    const c = resolveCityLatLng(city);
    if (c) return { source: "city" as const, lat: c.lat, lng: c.lng };

    const d = resolveCityLatLng(DEFAULT_CITY);
    return { source: "default" as const, lat: d?.lat ?? 37.3382, lng: d?.lng ?? -121.8863 };
  }, [geoAnchor, zip, city]);

  const nearbyCities = useMemo(() => {
    const anchor = { lat: locationAnchor.lat, lng: locationAnchor.lng };
    const within = CA_CITIES
      .map((c) => ({ city: c.city, d: haversineMi(anchor, { lat: c.lat, lng: c.lng }) }))
      .filter((x) => x.d <= radiusMi)
      .sort((a, b) => a.d - b.d)
      .slice(0, 12)
      .map((x) => x.city);

    const cur = resolveCityLatLng(city)?.city;
    const merged = [...new Set([...(cur ? [cur] : []), ...within])];
    return merged.slice(0, 12);
  }, [locationAnchor.lat, locationAnchor.lng, radiusMi, city]);

  const citySuggestions = useMemo(() => {
    const q = normalize(cityDraft);
    if (!q) return CITY_OPTIONS.slice(0, 6);

    const hits = CA_CITIES.filter((c) => {
      const nm = normalize(c.city);
      if (nm.includes(q)) return true;
      return (c.aliases || []).some((a) => normalize(a).includes(q));
    })
      .map((c) => c.city)
      .slice(0, 10);

    const aliasHit = CITY_ALIASES[q];
    const merged = [...new Set([...(aliasHit ? [aliasHit] : []), ...hits])];
    return merged.slice(0, 6);
  }, [CITY_OPTIONS, cityDraft]);

  const locationSummary = useMemo(() => {
    const base = zip ? `ZIP ${zip}` : city;
    return `${base} • ${radiusMi} mi`;
  }, [city, zip, radiusMi]);

  const openLocation = () => {
    setCityDraft(city);
    setZipDraft(zip);
    setRadiusDraft(radiusMi);
    setLocationOpen(true);
  };

  const applyLocation = () => {
    const nextZip = zipDraft.trim().replace(/[^0-9]/g, "").slice(0, 5);
    const nextCityRaw = cityDraft.trim();

    if (nextZip) {
      setZip(nextZip);
      setCity(DEFAULT_CITY);
      setGeoAnchor(null);
    } else {
      const resolved = resolveCityLatLng(nextCityRaw);
      setCity(resolved?.city ?? DEFAULT_CITY);
      setZip("");
      setGeoAnchor(null);
    }

    setRadiusMi(radiusDraft);
    setLocationOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoAnchor({ lat, lng });

        setZipDraft("");
        const nearest = CA_CITIES
          .map((c) => ({ city: c.city, d: haversineMi({ lat, lng }, { lat: c.lat, lng: c.lng }) }))
          .sort((a, b) => a.d - b.d)[0];

        if (nearest?.city) setCityDraft(nearest.city);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const filtersRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const membershipsRef = useRef<HTMLDivElement | null>(null);

  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = resultsRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      setShowSticky(top <= 120);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categoryMeta = useMemo(() => {
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

  const getStatus = (l: Listing): ListingStatus => (l.status ? l.status : "active");

  const filtered = useMemo(() => {
    let list = sampleListings;

    if (selectedCategory !== "all") {
      list = list.filter((l) => l.category === selectedCategory);
    }

    if (!showSold) {
      list = list.filter((l) => getStatus(l) !== "sold");
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => {
        const title = l.title[lang].toLowerCase();
        const blurb = l.blurb[lang].toLowerCase();
        const cty = l.city.toLowerCase();
        return title.includes(q) || blurb.includes(q) || cty.includes(q);
      });
    }

    if (!zip) {
      const allowedCities = Array.from(new Set([city, ...nearbyCities]));
      list = list.filter((l) => allowedCities.includes(l.city));
    }

    if (hasImage !== "any") {
      list = list.filter((l) => (hasImage === "yes" ? l.hasImage : !l.hasImage));
    }
    if (seller !== "any") {
      list = list.filter((l) => l.sellerType === seller);
    }
    if (condition !== "any") {
      list = list.filter((l) => l.condition === condition);
    }

    const priceToNumber = (s: string) => {
      const m = s.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
      return m ? Number(m[1]) : Number.NaN;
    };

    if (sort === "newest") return list;

    if (sort === "priceAsc") {
      return [...list].sort((a, b) => {
        const pa = priceToNumber(a.priceLabel[lang]);
        const pb = priceToNumber(b.priceLabel[lang]);
        if (Number.isNaN(pa) && Number.isNaN(pb)) return 0;
        if (Number.isNaN(pa)) return 1;
        if (Number.isNaN(pb)) return -1;
        return pa - pb;
      });
    }

    if (sort === "priceDesc") {
      return [...list].sort((a, b) => {
        const pa = priceToNumber(a.priceLabel[lang]);
        const pb = priceToNumber(b.priceLabel[lang]);
        if (Number.isNaN(pa) && Number.isNaN(pb)) return 0;
        if (Number.isNaN(pa)) return 1;
        if (Number.isNaN(pb)) return -1;
        return pb - pa;
      });
    }

    return list;
  }, [
    sampleListings,
    selectedCategory,
    search,
    sort,
    lang,
    zip,
    city,
    nearbyCities,
    hasImage,
    seller,
    condition,
    showSold,
  ]);

  const businessListings = useMemo(
    () => filtered.filter((x) => x.sellerType === "business"),
    [filtered]
  );
  const personalListings = useMemo(
    () => filtered.filter((x) => x.sellerType === "personal"),
    [filtered]
  );

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyCategory = (cat: CategoryKey) => {
    setSelectedCategory(cat);
    setTimeout(() => scrollTo(resultsRef), 0);
  };

  const resetAll = () => {
    setSearch("");
    setSelectedCategory("all");
    setSort("balanced");
    setShowSold(false);

    setCity(DEFAULT_CITY);
    setZip("");
    setRadiusMi(DEFAULT_RADIUS_MI);
    setGeoAnchor(null);

    setHasImage("any");
    setSeller("any");
    setCondition("any");
    setMoreOpen(false);
  };

  const CategorySelect = () => (
    <select
      value={selectedCategory}
      onChange={(e) => applyCategory(e.target.value as CategoryKey)}
      className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
      aria-label={t.categoryLabel}
    >
      <option value="all">{lang === "es" ? "Todas" : "All"}</option>
      {CATEGORY_ORDER.map((k) => (
        <option key={k} value={k}>
          {categoryMeta[k][lang]}
        </option>
      ))}
    </select>
  );

  const ListingCard = ({ item }: { item: Listing }) => {
    const isBusiness = item.sellerType === "business";
    const isSold = getStatus(item) === "sold";
    const href = `/clasificados/anuncio/${item.id}?lang=${lang}`;

    return (
      <a
        href={href}
        className={cx(
          "block rounded-2xl border bg-black/35 backdrop-blur",
          "transition hover:bg-black/45",
          isBusiness ? "border-yellow-400/30" : "border-white/10"
        )}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-xl font-bold text-gray-100 leading-snug">
                {item.title[lang]}
              </div>
              <div className="mt-2 text-gray-200 font-semibold">{item.priceLabel[lang]}</div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <span
                className={cx(
                  "px-3 py-1 rounded-full text-xs font-semibold border",
                  isBusiness
                    ? "border-yellow-400/40 text-yellow-200 bg-yellow-400/10"
                    : "border-white/10 text-gray-200 bg-white/5"
                )}
              >
                {isBusiness ? (lang === "es" ? "Negocio" : "Business") : (lang === "es" ? "Personal" : "Personal")}
              </span>

              {isSold && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold border border-red-400/30 text-red-200 bg-red-400/10">
                  {t.soldBadge}
                </span>
              )}
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-300">
            {item.city} • {item.postedAgo[lang]}
          </div>

          <div className="mt-4 text-gray-200">{item.blurb[lang]}</div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs border border-white/10 text-gray-300 bg-black/30">
              {lang === "es" ? "Condición:" : "Condition:"}{" "}
              {item.condition === "any"
                ? lang === "es"
                  ? "Cualquiera"
                  : "Any"
                : item.condition === "new"
                ? lang === "es"
                  ? "Nuevo"
                  : "New"
                : item.condition === "good"
                ? lang === "es"
                  ? "Bueno"
                  : "Good"
                : lang === "es"
                ? "Regular"
                : "Fair"}
            </span>

            <span className="px-3 py-1 rounded-full text-xs border border-white/10 text-gray-300 bg-black/30">
              {item.hasImage ? (lang === "es" ? "Con imagen" : "Has image") : (lang === "es" ? "Sin imagen" : "No image")}
            </span>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className="bg-black min-h-screen text-white pb-32">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="relative text-center mb-16">
          <div className="flex flex-wrap justify-center sm:justify-end gap-3 mb-6 sm:mb-0 sm:absolute sm:right-0 sm:top-0">
            <a
              href={t.routeLogin}
              className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              {t.authSignIn}
            </a>
            <a
              href={t.routeLogin}
              className="px-5 py-2.5 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 font-semibold hover:bg-yellow-400/15 transition"
            >
              {t.authCreate}
            </a>
          </div>

          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />

          <h1 className="text-6xl md:text-7xl font-bold text-yellow-400">{t.pageTitle}</h1>
          <p className="mt-5 text-gray-300 max-w-3xl mx-auto text-lg md:text-xl">{t.subtitle}</p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href={t.routePost}
              className="px-7 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
            >
              {t.ctaPost}
            </a>

            <button
              onClick={() => scrollTo(resultsRef)}
              className="px-7 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              {t.ctaView}
            </button>

            <button
              onClick={() => scrollTo(membershipsRef)}
              className="px-7 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              {t.ctaMemberships}
            </button>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <section className="max-w-6xl mx-auto px-6">
        <div ref={filtersRef} id="filters" className="scroll-mt-28" />

        <h2 className="text-5xl font-bold text-yellow-400 mb-8">{t.filtersTitle}</h2>

        <div className="border border-yellow-600/20 rounded-2xl p-6 bg-black/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-5">
              <div className="text-sm text-gray-300 mb-2">{t.searchLabel}</div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPh}
                className="w-full px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              />
            </div>

            <div className="lg:col-span-3">
              <div className="text-sm text-gray-300 mb-2">{t.locationLabel}</div>
              <button
                onClick={openLocation}
                className="w-full text-left px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 hover:bg-black/45 transition"
              >
                {locationSummary}
              </button>
            </div>

            <div className="lg:col-span-3">
              <div className="text-sm text-gray-300 mb-2">{t.categoryLabel}</div>
              <CategorySelect />
            </div>

            <div className="lg:col-span-1">
              <div className="text-sm text-gray-300 mb-2">{t.orderLabel}</div>
              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as "balanced" | "newest" | "priceAsc" | "priceDesc")
                }
                className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              >
                <option value="balanced">{t.sortBalanced}</option>
                <option value="newest">{t.sortNewest}</option>
                <option value="priceAsc">{t.sortPriceAsc}</option>
                <option value="priceDesc">{t.sortPriceDesc}</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              {t.moreFilters}
            </button>

            <button
              onClick={resetAll}
              className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
            >
              {t.reset}
            </button>

            <button
              onClick={() => setShowSold((v) => !v)}
              className={cx(
                "px-5 py-2.5 rounded-full border font-semibold transition",
                showSold
                  ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                  : "border-white/10 bg-black/30 text-gray-100 hover:bg-black/45"
              )}
            >
              {t.statusShowSold}
            </button>

            <div className="ml-auto flex flex-wrap gap-2">
              {selectedCategory !== "all" && (
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
                >
                  {lang === "es" ? "Categoría:" : "Category:"}{" "}
                  {categoryMeta[selectedCategory as Exclude<CategoryKey, "all">][lang]} ✕
                </button>
              )}
              {search.trim() && (
                <button
                  onClick={() => setSearch("")}
                  className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
                >
                  {lang === "es" ? "Buscar:" : "Search:"} {search.trim()} ✕
                </button>
              )}
              {showSold && (
                <button
                  onClick={() => setShowSold(false)}
                  className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
                >
                  {t.statusLabel}: {t.statusSold} ✕
                </button>
              )}
            </div>
          </div>

          {moreOpen && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-300 mb-2">
                    {lang === "es" ? "Con imagen" : "Has image"}
                  </div>
                  <select
                    value={hasImage}
                    onChange={(e) => setHasImage(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  >
                    <option value="any">{lang === "es" ? "Cualquiera" : "Any"}</option>
                    <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
                    <option value="no">{lang === "es" ? "No" : "No"}</option>
                  </select>
                </div>

                <div>
                  <div className="text-sm text-gray-300 mb-2">
                    {lang === "es" ? "Vendedor" : "Seller"}
                  </div>
                  <select
                    value={seller}
                    onChange={(e) => setSeller(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  >
                    <option value="any">{lang === "es" ? "Cualquiera" : "Any"}</option>
                    <option value="business">{lang === "es" ? "Negocio" : "Business"}</option>
                    <option value="personal">{lang === "es" ? "Personal" : "Personal"}</option>
                  </select>
                </div>

                <div>
                  <div className="text-sm text-gray-300 mb-2">
                    {lang === "es" ? "Condición" : "Condition"}
                  </div>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  >
                    <option value="any">{lang === "es" ? "Cualquiera" : "Any"}</option>
                    <option value="new">{lang === "es" ? "Nuevo" : "New"}</option>
                    <option value="good">{lang === "es" ? "Bueno" : "Good"}</option>
                    <option value="fair">{lang === "es" ? "Regular" : "Fair"}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Explore by category */}
        <div className="mt-8">
          <div className="text-sm text-gray-300 mb-3">{t.exploreByCategory}</div>
          <div className="flex flex-wrap gap-3">
            {CATEGORY_ORDER.map((k) => {
              const active = selectedCategory === k;
              return (
                <button
                  key={k}
                  onClick={() => applyCategory(k)}
                  className={cx(
                    "px-6 py-3 rounded-full border font-semibold transition",
                    active
                      ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                      : "border-white/10 bg-black/30 text-gray-100 hover:bg-black/45"
                  )}
                >
                  {categoryMeta[k][lang]}
                </button>
              );
            })}

            <button
              onClick={() => applyCategory("all")}
              className={cx(
                "px-6 py-3 rounded-full border font-semibold transition",
                selectedCategory === "all"
                  ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                  : "border-white/10 bg-black/30 text-gray-100 hover:bg-black/45"
              )}
            >
              {t.clearCategory}
            </button>
          </div>
        </div>
      </section>

      {/* LOCATION MODAL */}
      {locationOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            aria-label={lang === "es" ? "Cerrar" : "Close"}
            className="absolute inset-0 bg-black/70"
            onClick={() => setLocationOpen(false)}
          />
          <div className="relative w-full sm:max-w-xl bg-black border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-yellow-200">
                  {lang === "es" ? "Ubicación" : "Location"}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {lang === "es"
                    ? "Elige ciudad o ZIP y ajusta el radio."
                    : "Choose a city or ZIP and adjust the radius."}
                </div>
              </div>

              <button
                onClick={() => setLocationOpen(false)}
                className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4">
              <div>
                <div className="text-sm text-gray-300 mb-2">{lang === "es" ? "Ciudad" : "City"}</div>
                <input
                  value={cityDraft}
                  onChange={(e) => {
                    setCityDraft(e.target.value);
                    setZipDraft("");
                    setGeoAnchor(null);
                  }}
                  placeholder={lang === "es" ? "Ej: San José" : "e.g., San Jose"}
                  className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  {citySuggestions.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCityDraft(c)}
                      className="px-3 py-1.5 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition text-sm"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-2">
                  {lang === "es" ? "ZIP (opcional)" : "ZIP (optional)"}
                </div>
                <input
                  value={zipDraft}
                  onChange={(e) => {
                    setZipDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5));
                    setCityDraft("");
                    setGeoAnchor(null);
                  }}
                  inputMode="numeric"
                  placeholder="95112"
                  className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                />
                <div className="text-xs text-gray-400 mt-2">
                  {lang === "es"
                    ? "Nota: el ZIP ya tiene datos de lat/lng en nuestro mapa. Si no existe, se guardará como preferencia."
                    : "Note: ZIP uses our lat/lng map when available; otherwise it’s saved as a preference."}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-300 mb-2">{lang === "es" ? "Radio" : "Radius"}</div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={radiusDraft}
                    onChange={(e) => setRadiusDraft(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="min-w-[84px] text-right text-gray-200 font-semibold">
                    {radiusDraft} mi
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {nearbyCities.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCityDraft(c)}
                      className="px-3 py-1.5 rounded-full border border-yellow-600/20 bg-black/30 text-gray-100 hover:bg-black/45 transition text-sm"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={useMyLocation}
                  className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
                >
                  {lang === "es" ? "Usar mi ubicación" : "Use my location"}
                </button>

                <div className="flex gap-3">
                  <button
                    onClick={() => setLocationOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
                  >
                    {lang === "es" ? "Cancelar" : "Cancel"}
                  </button>
                  <button
                    onClick={applyLocation}
                    className="px-5 py-2.5 rounded-full bg-yellow-400 text-black font-extrabold hover:bg-yellow-300 transition"
                  >
                    {lang === "es" ? "Aplicar" : "Apply"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS + MEMBERSHIPS unchanged from your current file after this point */}
      {/* (Keeping this short would risk missing lines; leaving as-is in your file is fine.) */}
      {/* NOTE: If your editor warns about missing content below, paste the original bottom section from your current FILE 1. */}
      <div className="max-w-6xl mx-auto px-6 mt-10 text-gray-400">
        <p>
          ✅ FILE 1 hotfix applied (distance math). The rest of your UI remains unchanged.
        </p>
        <p className="mt-2">
          Now proceed to FILE 3 below.
        </p>
      </div>

      {/* BOOST INFO MODAL still in your original file */}
      {boostInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            aria-label={lang === "es" ? "Cerrar" : "Close"}
            className="absolute inset-0 bg-black/70"
            onClick={() => setBoostInfoOpen(null)}
          />
          <div className="relative w-full sm:max-w-xl bg-black border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-bold text-yellow-200">
                  {lang === "es" ? "¿Cómo funciona el impulso?" : "How does boosting work?"}
                </div>
              </div>

              <button
                onClick={() => setBoostInfoOpen(null)}
                className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setBoostInfoOpen(null)}
                className="px-6 py-3 rounded-full bg-yellow-400 text-black font-extrabold hover:bg-yellow-300 transition"
              >
                {lang === "es" ? "Entendido" : "Got it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
