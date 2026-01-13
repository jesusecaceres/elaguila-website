// app/clasificados/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type ListingTier = "FREE" | "PRO" | "BIZ_LITE" | "BIZ_PREMIUM";
type SellerType = "PERSONAL" | "BUSINESS";
type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "FOR_PARTS";

type ClassifiedCategory =
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad";

type SortMode = "balanced" | "newest" | "price_asc" | "price_desc";

type Listing = {
  id: string;
  title: string;
  description?: string;
  price?: number | null;
  city: string;
  createdAt: string; // ISO
  category: ClassifiedCategory;
  tier: ListingTier;
  sellerType: SellerType;
  hasImage?: boolean;
  condition?: ListingCondition;
  boostedUntil?: string | null; // ISO
};

type Filters = {
  q: string;
  city: string;
  radiusMi: number;
  category: ClassifiedCategory | "all";
  sort: SortMode;

  // more filters
  priceMin?: number | null;
  priceMax?: number | null;
  posted: "any" | "24h" | "7d" | "30d";
  hasImage: "any" | "yes";
  seller: "any" | SellerType;
  condition: "any" | ListingCondition;
};

const DEFAULT_CITY = "San José";
const DEFAULT_RADIUS = 25;

const CATEGORY_ORDER: ClassifiedCategory[] = [
  "en-venta",
  "rentas",
  "autos",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
];

const CATEGORY_LABELS: Record<Lang, Record<ClassifiedCategory, string>> = {
  es: {
    "en-venta": "En Venta",
    rentas: "Rentas",
    autos: "Autos",
    servicios: "Servicios",
    empleos: "Empleos",
    clases: "Clases",
    comunidad: "Comunidad",
  },
  en: {
    "en-venta": "For Sale",
    rentas: "Rentals",
    autos: "Cars",
    servicios: "Services",
    empleos: "Jobs",
    clases: "Classes",
    comunidad: "Community",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatRelative(iso: string, lang: Lang) {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 60) return lang === "es" ? `hace ${mins} min` : `${mins}m ago`;
  if (hrs < 24) return lang === "es" ? `hace ${hrs} h` : `${hrs}h ago`;
  return lang === "es" ? `hace ${days} d` : `${days}d ago`;
}

function priceLabel(price: number | null | undefined, lang: Lang) {
  if (price === null || price === undefined) return lang === "es" ? "Gratis" : "Free";
  if (price === 0) return lang === "es" ? "Gratis" : "Free";
  return `$${price.toLocaleString()}`;
}

function isWithinPosted(createdAtIso: string, posted: Filters["posted"]) {
  if (posted === "any") return true;
  const created = new Date(createdAtIso).getTime();
  const now = Date.now();
  const diff = now - created;

  const day = 24 * 60 * 60 * 1000;
  if (posted === "24h") return diff <= day;
  if (posted === "7d") return diff <= 7 * day;
  if (posted === "30d") return diff <= 30 * day;
  return true;
}

function tierRank(tier: ListingTier) {
  // Higher = more priority in balanced
  switch (tier) {
    case "BIZ_PREMIUM":
      return 4;
    case "BIZ_LITE":
      return 3;
    case "PRO":
      return 2;
    case "FREE":
    default:
      return 1;
  }
}

function isBoostedNow(l: Listing) {
  if (!l.boostedUntil) return false;
  return new Date(l.boostedUntil).getTime() > Date.now();
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="2" width="5" height="5" rx="1.2" className={active ? "fill-yellow-300" : "fill-zinc-500"} />
        <rect x="9" y="2" width="5" height="5" rx="1.2" className={active ? "fill-yellow-300" : "fill-zinc-500"} />
        <rect x="2" y="9" width="5" height="5" rx="1.2" className={active ? "fill-yellow-300" : "fill-zinc-500"} />
        <rect x="9" y="9" width="5" height="5" rx="1.2" className={active ? "fill-yellow-300" : "fill-zinc-500"} />
      </svg>
      <span>Grid</span>
    </span>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="3" width="12" height="2" rx="1" className={active ? "fill-yellow-300" : "fill-zinc-500"} />
        <rect x="2" y="7" width="12" height="2" rx="1" className={active ? "fill-yellow-300" : "fill-zinc-500"} />
        <rect x="2" y="11" width="12" height="2" rx="1" className={active ? "fill-yellow-300" : "fill-zinc-500"} />
      </svg>
      <span>List</span>
    </span>
  );
}

export default function ClassifiedsPage() {
  const searchParams = useSearchParams();

  // lang from URL (?lang=es|en). Default ES.
  const lang: Lang = (searchParams.get("lang") === "en" ? "en" : "es") as Lang;

  const t = useMemo(() => {
    const dict = {
      es: {
        title: "Clasificados",
        subtitle:
          "Acceso justo para todos. Comunidad primero. Ventaja premium para quienes invierten — sin esconder anuncios gratuitos.",
        ctaPost: "Publicar anuncio",
        ctaView: "Ver anuncios",
        ctaMemberships: "Membrecias",
        login: "Iniciar sesión",

        filterTitle: "Filtrar anuncios",
        searchLabel: "Buscar",
        searchPlaceholder: "Buscar anuncios…",
        locationLabel: "Ubicación",
        edit: "Editar",
        categoryLabel: "Categoría",
        all: "Todas",
        sortLabel: "Orden",
        sortBalanced: "Equilibrado",
        sortNewest: "Más recientes",
        sortPriceAsc: "Precio: menor → mayor",
        sortPriceDesc: "Precio: mayor → menor",

        moreFilters: "Más filtros",
        hideFilters: "Ocultar filtros",
        priceRange: "Rango de precio",
        min: "Min",
        max: "Max",
        posted: "Publicado",
        postedAny: "Cualquier fecha",
        posted24: "Últimas 24 horas",
        posted7: "Últimos 7 días",
        posted30: "Últimos 30 días",
        image: "Imagen",
        any: "Cualquiera",
        yes: "Sí",
        seller: "Vendedor",
        personal: "Personal",
        business: "Negocio",
        condition: "Condición",
        condAny: "Cualquiera",
        condNew: "Nuevo",
        condLikeNew: "Como nuevo",
        condGood: "Bueno",
        condFair: "Regular",
        condParts: "Para partes",

        exploreByCategory: "Explorar por categoría",
        clearCategory: "Quitar categoría",

        chipsReset: "Restablecer filtros",
        chipsCity: "Ciudad",
        chipsRadius: "Radio",

        results: "Resultados",
        showing: "Mostrando",
        of: "de",
        viewBusinesses: "Ver negocios",
        viewAll: "Ver todo",

        emptyTitle: "No encontramos anuncios",
        emptyBody:
          "Intenta ajustar filtros. Si estás buscando cerca, aumenta el radio o revisa todas las categorías.",
        removeFilters: "Quitar filtros",
        increaseRadius: "Aumentar radio",
        viewEverything: "Ver todo",

        page: "Página",
        prevPage: "Página anterior",
        nextPage: "Siguiente página",

        locationModalTitle: "Ubicación",
        close: "Cerrar",
        locationPermissionTitle: "Permiso de ubicación (opcional)",
        locationPermissionBody:
          "Puedes usar tu ubicación para sugerir ciudad. No guardamos tu ubicación precisa — solo la ciudad y el radio que elijas.",
        useMyLocation: "Usar mi ubicación",
        city: "Ciudad",
        nearbyCities: "Ciudades cercanas",
        radius: "Radio",
        radiusHint: "La ciudad es el selector principal. El radio ampliará el alcance (lógica de distancia se conecta después).",
        restore: "Restablecer",
        save: "Guardar",

        membershipsTitle: "Membrecias",
        membershipsSubtitle:
          "Resumen rápido. Beneficios completos se muestran en la página de Membrecias.",
        free: "Gratis",
        free1: "Publicación básica",
        free2: "Siempre visible y buscable",
        free3: "Ranking estándar (sin esconder anuncios)",

        pro: "LEONIX Pro",
        proBadge: "Joya",
        pro1: "Más duración y mejor presentación",
        pro2: "Analíticas básicas (vistas/guardados)",
        pro3: "Ventana de visibilidad por anuncio (sin llamarlo boost)",
        proPrice: "$16.99/mes",
        proCta: "Ver LEONIX Pro",

        bizLite: "Business Lite",
        bizLite1: "Insignia de negocio y presencia estable",
        bizLite2: "Más anuncios activos y mejor visibilidad",
        bizLite3: "Aparece en exploración de negocios",
        bizLiteCta: "Comparar membresías de negocio",

        bizPremium: "Business Premium",
        bizPremium1: "Prioridad de ranking y mejor perfil",
        bizPremium2: "Herramientas de contacto/leads por anuncio",
        bizPremium3: "Máxima visibilidad dentro de la categoría",
        bizPremiumCta: "Comparar membresías de negocio",
      },
      en: {
        title: "Classifieds",
        subtitle:
          "Fair access for everyone. Community first. Premium advantage for investors — without hiding free listings.",
        ctaPost: "Post an ad",
        ctaView: "View listings",
        ctaMemberships: "Memberships",
        login: "Sign in",

        filterTitle: "Filter listings",
        searchLabel: "Search",
        searchPlaceholder: "Search listings…",
        locationLabel: "Location",
        edit: "Edit",
        categoryLabel: "Category",
        all: "All",
        sortLabel: "Sort",
        sortBalanced: "Balanced",
        sortNewest: "Newest",
        sortPriceAsc: "Price: low → high",
        sortPriceDesc: "Price: high → low",

        moreFilters: "More filters",
        hideFilters: "Hide filters",
        priceRange: "Price range",
        min: "Min",
        max: "Max",
        posted: "Posted",
        postedAny: "Any time",
        posted24: "Last 24 hours",
        posted7: "Last 7 days",
        posted30: "Last 30 days",
        image: "Image",
        any: "Any",
        yes: "Yes",
        seller: "Seller",
        personal: "Personal",
        business: "Business",
        condition: "Condition",
        condAny: "Any",
        condNew: "New",
        condLikeNew: "Like new",
        condGood: "Good",
        condFair: "Fair",
        condParts: "For parts",

        exploreByCategory: "Explore by category",
        clearCategory: "Clear category",

        chipsReset: "Reset filters",
        chipsCity: "City",
        chipsRadius: "Radius",

        results: "Results",
        showing: "Showing",
        of: "of",
        viewBusinesses: "Businesses",
        viewAll: "All",

        emptyTitle: "No listings found",
        emptyBody:
          "Try adjusting filters. If you're searching nearby, increase the radius or check all categories.",
        removeFilters: "Clear filters",
        increaseRadius: "Increase radius",
        viewEverything: "View all",

        page: "Page",
        prevPage: "Previous page",
        nextPage: "Next page",

        locationModalTitle: "Location",
        close: "Close",
        locationPermissionTitle: "Location permission (optional)",
        locationPermissionBody:
          "You can use your location to suggest a city. We don’t store your precise location — only the city and radius you choose.",
        useMyLocation: "Use my location",
        city: "City",
        nearbyCities: "Nearby cities",
        radius: "Radius",
        radiusHint: "City is the primary selector. Radius expands reach (distance logic connects later).",
        restore: "Restore",
        save: "Save",

        membershipsTitle: "Memberships",
        membershipsSubtitle: "Quick summary. Full benefits are on the Memberships page.",
        free: "Free",
        free1: "Basic posting",
        free2: "Always visible & searchable",
        free3: "Standard ranking (no hidden listings)",

        pro: "LEONIX Pro",
        proBadge: "Jewel",
        pro1: "Longer duration & better presentation",
        pro2: "Basic analytics (views/saves)",
        pro3: "Visibility window per listing (not called a boost)",
        proPrice: "$16.99/mo",
        proCta: "View LEONIX Pro",

        bizLite: "Business Lite",
        bizLite1: "Business presence and stable visibility",
        bizLite2: "More active listings and better placement",
        bizLite3: "Appears in business exploration",
        bizLiteCta: "Compare business memberships",

        bizPremium: "Business Premium",
        bizPremium1: "Priority ranking and enhanced profile",
        bizPremium2: "Lead/contact tools per listing",
        bizPremium3: "Maximum visibility inside the category",
        bizPremiumCta: "Compare business memberships",
      },
    } as const;

    return dict[lang];
  }, [lang]);

  // Anchors
  const listingsRef = useRef<HTMLDivElement | null>(null);
  const membershipsRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  // Sticky filter behavior
  const [filterSticky, setFilterSticky] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    q: "",
    city: DEFAULT_CITY,
    radiusMi: DEFAULT_RADIUS,
    category: "all",
    sort: "balanced",

    priceMin: null,
    priceMax: null,
    posted: "any",
    hasImage: "any",
    seller: "any",
    condition: "any",
  });

  const [moreOpen, setMoreOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [cityDraft, setCityDraft] = useState(filters.city);
  const [radiusDraft, setRadiusDraft] = useState(filters.radiusMi);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showBusinessesOnly, setShowBusinessesOnly] = useState(false);

  // Demo data placeholder (kept empty for now)
  const listings: Listing[] = useMemo(() => {
    return [];
  }, []);

  // Responsive default: Mobile = list, Desktop = grid
  useEffect(() => {
    const onResize = () => {
      const isMobile = window.innerWidth < 768;
      setViewMode(isMobile ? "list" : "grid");
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sticky filter observer
  useEffect(() => {
    const el = filterRef.current;
    if (!el) return;

    const sentinel = document.createElement("div");
    sentinel.style.position = "absolute";
    sentinel.style.top = "-1px";
    sentinel.style.left = "0";
    sentinel.style.width = "1px";
    sentinel.style.height = "1px";
    el.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => {
        // when sentinel is not visible, user scrolled past filter top => sticky on
        setFilterSticky(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      try {
        el.removeChild(sentinel);
      } catch {}
    };
  }, []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    let arr = listings.slice();

    // category
    if (filters.category !== "all") {
      arr = arr.filter((l) => l.category === filters.category);
    }

    // business-only toggle
    if (showBusinessesOnly) {
      arr = arr.filter((l) => l.tier === "BIZ_LITE" || l.tier === "BIZ_PREMIUM" || l.sellerType === "BUSINESS");
    }

    // search
    if (q) {
      arr = arr.filter((l) => (l.title + " " + (l.description ?? "")).toLowerCase().includes(q));
    }

    // posted timeframe
    arr = arr.filter((l) => isWithinPosted(l.createdAt, filters.posted));

    // image
    if (filters.hasImage === "yes") {
      arr = arr.filter((l) => Boolean(l.hasImage));
    }

    // seller
    if (filters.seller !== "any") {
      arr = arr.filter((l) => l.sellerType === filters.seller);
    }

    // condition
    if (filters.condition !== "any") {
      arr = arr.filter((l) => l.condition === filters.condition);
    }

    // price range
    const min = filters.priceMin ?? null;
    const max = filters.priceMax ?? null;
    if (min !== null) arr = arr.filter((l) => (l.price ?? 0) >= min);
    if (max !== null) arr = arr.filter((l) => (l.price ?? 0) <= max);

    // sort
    if (filters.sort === "newest") {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sort === "price_asc") {
      arr.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (filters.sort === "price_desc") {
      arr.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else {
      // balanced: boosted first, then tier rank, then recency
      arr.sort((a, b) => {
        const ab = isBoostedNow(a) ? 1 : 0;
        const bb = isBoostedNow(b) ? 1 : 0;
        if (ab !== bb) return bb - ab;

        const tr = tierRank(b.tier) - tierRank(a.tier);
        if (tr !== 0) return tr;

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return arr;
  }, [listings, filters, showBusinessesOnly]);

  // pagination
  const pageSize = useMemo(() => {
    const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;
    return isMobile ? 10 : 18;
  }, []);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filters, showBusinessesOnly]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageSafe = clamp(page, 1, totalPages);

  const slice = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    const end = Math.min(total, start + pageSize);
    return { start, end, items: filtered.slice(start, end) };
  }, [filtered, pageSafe, pageSize, total]);

  const goToListings = () => listingsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const goToMemberships = () => membershipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const goToFilters = () => filterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleCategoryPick = (cat: ClassifiedCategory) => {
    setFilters((f) => ({ ...f, category: cat }));
    // ensure chips show + move user to results while keeping sticky filter available
    setTimeout(() => goToListings(), 0);
  };

  const clearCategory = () => setFilters((f) => ({ ...f, category: "all" }));

  const resetFilters = () => {
    setFilters({
      q: "",
      city: DEFAULT_CITY,
      radiusMi: DEFAULT_RADIUS,
      category: "all",
      sort: "balanced",
      priceMin: null,
      priceMax: null,
      posted: "any",
      hasImage: "any",
      seller: "any",
      condition: "any",
    });
    setShowBusinessesOnly(false);
    setMoreOpen(false);
    setPage(1);
  };

  const chips = useMemo(() => {
    const out: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (filters.city !== DEFAULT_CITY) {
      out.push({
        key: "city",
        label: `${t.chipsCity}: ${filters.city}`,
        onRemove: () => setFilters((f) => ({ ...f, city: DEFAULT_CITY })),
      });
    } else {
      out.push({
        key: "city_default",
        label: `${t.chipsCity}: ${filters.city}`,
        onRemove: () => {},
      });
    }

    if (filters.radiusMi !== DEFAULT_RADIUS) {
      out.push({
        key: "radius",
        label: `${t.chipsRadius}: ${filters.radiusMi} mi`,
        onRemove: () => setFilters((f) => ({ ...f, radiusMi: DEFAULT_RADIUS })),
      });
    } else {
      out.push({
        key: "radius_default",
        label: `${t.chipsRadius}: ${filters.radiusMi} mi`,
        onRemove: () => {},
      });
    }

    if (filters.category !== "all") {
      out.push({
        key: "category",
        label: `${t.categoryLabel}: ${CATEGORY_LABELS[lang][filters.category]}`,
        onRemove: () => clearCategory(),
      });
    }
    if (filters.q.trim()) {
      out.push({
        key: "q",
        label: `${t.searchLabel}: “${filters.q.trim()}”`,
        onRemove: () => setFilters((f) => ({ ...f, q: "" })),
      });
    }
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      out.push({
        key: "min",
        label: `${t.min}: $${filters.priceMin}`,
        onRemove: () => setFilters((f) => ({ ...f, priceMin: null })),
      });
    }
    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      out.push({
        key: "max",
        label: `${t.max}: $${filters.priceMax}`,
        onRemove: () => setFilters((f) => ({ ...f, priceMax: null })),
      });
    }
    if (filters.posted !== "any") {
      const map = {
        "24h": t.posted24,
        "7d": t.posted7,
        "30d": t.posted30,
        any: t.postedAny,
      } as const;
      out.push({
        key: "posted",
        label: `${t.posted}: ${map[filters.posted]}`,
        onRemove: () => setFilters((f) => ({ ...f, posted: "any" })),
      });
    }
    if (filters.hasImage !== "any") {
      out.push({
        key: "img",
        label: `${t.image}: ${t.yes}`,
        onRemove: () => setFilters((f) => ({ ...f, hasImage: "any" })),
      });
    }
    if (filters.seller !== "any") {
      out.push({
        key: "seller",
        label: `${t.seller}: ${filters.seller === "BUSINESS" ? t.business : t.personal}`,
        onRemove: () => setFilters((f) => ({ ...f, seller: "any" })),
      });
    }
    if (filters.condition !== "any") {
      const map: Record<ListingCondition, string> = {
        NEW: t.condNew,
        LIKE_NEW: t.condLikeNew,
        GOOD: t.condGood,
        FAIR: t.condFair,
        FOR_PARTS: t.condParts,
      };
      out.push({
        key: "cond",
        label: `${t.condition}: ${map[filters.condition]}`,
        onRemove: () => setFilters((f) => ({ ...f, condition: "any" })),
      });
    }

    if (showBusinessesOnly) {
      out.push({
        key: "bizOnly",
        label: t.viewBusinesses,
        onRemove: () => setShowBusinessesOnly(false),
      });
    }

    return out;
  }, [filters, lang, showBusinessesOnly, t]);

  const nearbyCities = useMemo(() => {
    // Placeholder chips (we’ll make dynamic by radius later)
    return ["Santa Clara", "Milpitas", "Campbell", "Sunnyvale"];
  }, []);

  const openLocation = () => {
    setCityDraft(filters.city);
    setRadiusDraft(filters.radiusMi);
    setLocationOpen(true);
  };

  const saveLocation = () => {
    setFilters((f) => ({ ...f, city: cityDraft.trim() || DEFAULT_CITY, radiusMi: radiusDraft }));
    setLocationOpen(false);
  };

  const restoreLocation = () => {
    setCityDraft(DEFAULT_CITY);
    setRadiusDraft(DEFAULT_RADIUS);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // For now we only suggest the default city (future: reverse geocode)
        setCityDraft(DEFAULT_CITY);
      },
      () => {
        // ignore
      },
      { enableHighAccuracy: false, timeout: 6000 }
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* HERO — Magazine-standard centered layout */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_10%,rgba(234,179,8,0.22),transparent_60%),linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,0.75),rgba(0,0,0,1))]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-14 text-center">
          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="LEONIX"
              className="h-14 w-14 rounded-2xl bg-black/30 border border-yellow-600/25 shadow-[0_0_30px_rgba(234,179,8,0.15)]"
            />
          </div>

          <h1 className="mt-6 text-5xl md:text-6xl font-extrabold tracking-tight text-yellow-200">
            {t.title}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
            {t.subtitle}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/clasificados/publicar"
              className="px-6 py-3 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition shadow-[0_0_30px_rgba(234,179,8,0.12)]"
            >
              {t.ctaPost}
            </Link>
            <button
              onClick={goToListings}
              className="px-6 py-3 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
            >
              {t.ctaView}
            </button>
            <button
              onClick={goToMemberships}
              className="px-6 py-3 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
            >
              {t.ctaMemberships}
            </button>
          </div>
        </div>

        {/* Sticky CTA bar */}
        <div className="sticky top-[64px] z-40 border-t border-white/5 border-b border-white/5 bg-black/55 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-center gap-2">
            <Link
              href="/clasificados/publicar"
              className="px-4 py-2 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition"
            >
              {t.ctaPost}
            </Link>
            <button
              onClick={goToListings}
              className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
            >
              {t.ctaView}
            </button>
            <button
              onClick={goToMemberships}
              className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
            >
              {t.ctaMemberships}
            </button>

            {/* Quick access back to filters (extra safety) */}
            <button
              onClick={goToFilters}
              className="hidden md:inline-flex ml-2 px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/80 hover:bg-black/45 transition"
            >
              {lang === "es" ? "Filtros" : "Filters"}
            </button>
          </div>
        </div>
      </section>

      {/* FILTER BAR (anchor + premium + becomes sticky) */}
      <section ref={filterRef} className="relative">
        <div
          className={cx(
            "transition-all",
            filterSticky ? "sticky top-[116px] z-30" : ""
          )}
        >
          <div className="max-w-6xl mx-auto px-6 pt-10">
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-200">{t.filterTitle}</h2>

            <div className="mt-5 rounded-2xl border border-yellow-600/20 bg-black/35 backdrop-blur p-5 shadow-[0_0_40px_rgba(234,179,8,0.08)]">
              {/* row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="text-sm text-gray-300">{t.searchLabel}</label>
                  <input
                    value={filters.q}
                    onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                    placeholder={t.searchPlaceholder}
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="text-sm text-gray-300">{t.locationLabel}</label>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white">
                      {filters.city} • {filters.radiusMi} mi
                    </div>
                    <button
                      onClick={openLocation}
                      className="px-4 py-3 rounded-2xl bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
                    >
                      {t.edit}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-300">{t.categoryLabel}</label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters((f) => ({
                        ...f,
                        category: e.target.value as Filters["category"],
                      }))
                    }
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                  >
                    <option value="all">{t.all}</option>
                    {CATEGORY_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[lang][c]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1">
                  <label className="text-sm text-gray-300">{t.sortLabel}</label>
                  <select
                    value={filters.sort}
                    onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortMode }))}
                    className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                  >
                    <option value="balanced">{t.sortBalanced}</option>
                    <option value="newest">{t.sortNewest}</option>
                    <option value="price_asc">{t.sortPriceAsc}</option>
                    <option value="price_desc">{t.sortPriceDesc}</option>
                  </select>
                </div>
              </div>

              {/* More filters toggle */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => setMoreOpen((v) => !v)}
                  className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition inline-flex items-center gap-2"
                >
                  {moreOpen ? t.hideFilters : t.moreFilters}
                  <span className="text-white/60">{moreOpen ? "▲" : "▼"}</span>
                </button>
              </div>

              {/* More filters panel */}
              {moreOpen && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="text-sm text-gray-300">{t.priceRange}</label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <input
                        inputMode="numeric"
                        placeholder={t.min}
                        value={filters.priceMin ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setFilters((f) => ({ ...f, priceMin: v === "" ? null : Number(v) }));
                        }}
                        className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                      />
                      <input
                        inputMode="numeric"
                        placeholder={t.max}
                        value={filters.priceMax ?? ""}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setFilters((f) => ({ ...f, priceMax: v === "" ? null : Number(v) }));
                        }}
                        className="px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                      />
                    </div>

                    {/* Quick price chips (optional helper, not replacing min/max) */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        [0, 30],
                        [31, 50],
                        [51, 100],
                        [101, 300],
                      ].map(([a, b]) => (
                        <button
                          key={`${a}-${b}`}
                          onClick={() => setFilters((f) => ({ ...f, priceMin: a, priceMax: b }))}
                          className="px-3 py-1.5 rounded-full bg-black/35 border border-white/10 text-white/80 hover:bg-black/45 transition text-sm"
                        >
                          ${a}–${b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-sm text-gray-300">{t.posted}</label>
                    <select
                      value={filters.posted}
                      onChange={(e) => setFilters((f) => ({ ...f, posted: e.target.value as Filters["posted"] }))}
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                    >
                      <option value="any">{t.postedAny}</option>
                      <option value="24h">{t.posted24}</option>
                      <option value="7d">{t.posted7}</option>
                      <option value="30d">{t.posted30}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-300">{t.image}</label>
                    <select
                      value={filters.hasImage}
                      onChange={(e) => setFilters((f) => ({ ...f, hasImage: e.target.value as Filters["hasImage"] }))}
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                    >
                      <option value="any">{t.any}</option>
                      <option value="yes">{t.yes}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-300">{t.seller}</label>
                    <select
                      value={filters.seller}
                      onChange={(e) => setFilters((f) => ({ ...f, seller: e.target.value as Filters["seller"] }))}
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                    >
                      <option value="any">{t.any}</option>
                      <option value="PERSONAL">{t.personal}</option>
                      <option value="BUSINESS">{t.business}</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-300">{t.condition}</label>
                    <select
                      value={filters.condition}
                      onChange={(e) => setFilters((f) => ({ ...f, condition: e.target.value as Filters["condition"] }))}
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                    >
                      <option value="any">{t.condAny}</option>
                      <option value="NEW">{t.condNew}</option>
                      <option value="LIKE_NEW">{t.condLikeNew}</option>
                      <option value="GOOD">{t.condGood}</option>
                      <option value="FAIR">{t.condFair}</option>
                      <option value="FOR_PARTS">{t.condParts}</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Category pills */}
              <div className="mt-6">
                <div className="text-sm text-gray-300">{t.exploreByCategory}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {CATEGORY_ORDER.map((c) => {
                    const active = filters.category === c;
                    return (
                      <button
                        key={c}
                        onClick={() => handleCategoryPick(c)}
                        className={cx(
                          "px-4 py-2 rounded-full border transition",
                          active
                            ? "bg-yellow-400/15 border-yellow-600/35 text-yellow-200"
                            : "bg-black/35 border-white/10 text-white/85 hover:bg-black/45"
                        )}
                      >
                        {CATEGORY_LABELS[lang][c]}
                      </button>
                    );
                  })}

                  {filters.category !== "all" && (
                    <button
                      onClick={() => {
                        clearCategory();
                        setTimeout(() => goToListings(), 0);
                      }}
                      className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/85 hover:bg-black/45 transition"
                    >
                      {t.clearCategory}
                    </button>
                  )}
                </div>
              </div>

              {/* Active chips */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <span
                    key={c.key}
                    className={cx(
                      "px-4 py-2 rounded-full border text-sm",
                      "bg-black/35 border-white/10 text-white/85"
                    )}
                  >
                    {c.label}
                    {c.onRemove.toString() !== (() => {}).toString() && (
                      <button className="ml-2 text-white/60 hover:text-white" onClick={c.onRemove}>
                        ×
                      </button>
                    )}
                  </span>
                ))}
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/85 hover:bg-black/45 transition"
                >
                  {t.chipsReset}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Location modal */}
        {locationOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
            <div className="max-w-2xl mx-auto px-6 pt-24">
              <div className="rounded-2xl border border-yellow-600/20 bg-black/60 shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="px-6 py-5 flex items-center justify-between border-b border-white/5">
                  <div className="text-2xl font-bold text-yellow-200">{t.locationModalTitle}</div>
                  <button
                    onClick={() => setLocationOpen(false)}
                    className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/85 hover:bg-black/45 transition"
                  >
                    {t.close}
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
                    <div className="text-lg font-semibold text-yellow-200">{t.locationPermissionTitle}</div>
                    <p className="mt-2 text-gray-300">{t.locationPermissionBody}</p>
                    <button
                      onClick={useMyLocation}
                      className="mt-4 px-5 py-3 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
                    >
                      {t.useMyLocation}
                    </button>
                  </div>

                  {/* City first */}
                  <div>
                    <div className="text-sm text-gray-300">{t.city}</div>
                    <input
                      value={cityDraft}
                      onChange={(e) => setCityDraft(e.target.value)}
                      className="mt-2 w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-600/30"
                      placeholder={lang === "es" ? "Escribe tu ciudad o ZIP…" : "Type your city or ZIP…"}
                    />
                  </div>

                  {/* Radius directly under city */}
                  <div>
                    <div className="text-sm text-gray-300">{t.radius}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[10, 25, 40, 50].map((r) => {
                        const active = radiusDraft === r;
                        return (
                          <button
                            key={r}
                            onClick={() => setRadiusDraft(r)}
                            className={cx(
                              "px-4 py-2 rounded-full border transition",
                              active
                                ? "bg-yellow-400/15 border-yellow-600/35 text-yellow-200"
                                : "bg-black/35 border-white/10 text-white/85 hover:bg-black/45"
                            )}
                          >
                            {r} mi
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-gray-400 text-sm">{t.radiusHint}</p>
                  </div>

                  {/* Nearby cities below radius */}
                  <div>
                    <div className="text-sm text-gray-300">{t.nearbyCities}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {nearbyCities.map((c) => (
                        <button
                          key={c}
                          onClick={() => setCityDraft(c)}
                          className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/85 hover:bg-black/45 transition"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={restoreLocation}
                      className="px-5 py-3 rounded-full bg-black/35 border border-white/10 text-white/85 hover:bg-black/45 transition"
                    >
                      {t.restore}
                    </button>
                    <button
                      onClick={saveLocation}
                      className="px-6 py-3 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition"
                    >
                      {t.save}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* RESULTS */}
      <section ref={listingsRef} className="max-w-6xl mx-auto px-6 pt-14 pb-16">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-200">{t.results}</h2>
            <div className="mt-2 text-gray-300">
              {t.showing} {total === 0 ? "0" : slice.start + 1}–{slice.end} {t.of} {total}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Business visibility toggle */}
            <button
              onClick={() => setShowBusinessesOnly((v) => !v)}
              className={cx(
                "px-4 py-2 rounded-full border transition",
                showBusinessesOnly
                  ? "bg-yellow-400/15 border-yellow-600/35 text-yellow-200"
                  : "bg-black/35 border-white/10 text-white/85 hover:bg-black/45"
              )}
            >
              {showBusinessesOnly ? t.viewAll : t.viewBusinesses}
            </button>

            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as SortMode }))}
              className="px-4 py-2 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition focus:outline-none"
            >
              <option value="balanced">{t.sortBalanced}</option>
              <option value="newest">{t.sortNewest}</option>
              <option value="price_asc">{t.sortPriceAsc}</option>
              <option value="price_desc">{t.sortPriceDesc}</option>
            </select>

            {/* Grid/List toggle */}
            <div className="flex items-center rounded-full overflow-hidden border border-white/10 bg-black/35">
              <button
                onClick={() => setViewMode("grid")}
                className={cx(
                  "px-4 py-2 text-white/90 transition",
                  viewMode === "grid" ? "bg-yellow-400/10" : "hover:bg-black/45"
                )}
              >
                <GridIcon active={viewMode === "grid"} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cx(
                  "px-4 py-2 text-white/90 transition",
                  viewMode === "list" ? "bg-yellow-400/10" : "hover:bg-black/45"
                )}
              >
                <ListIcon active={viewMode === "list"} />
              </button>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {total === 0 ? (
          <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/35 p-8">
            <div className="text-2xl font-bold text-yellow-200">{t.emptyTitle}</div>
            <p className="mt-3 text-gray-300">{t.emptyBody}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={resetFilters}
                className="px-5 py-3 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
              >
                {t.removeFilters}
              </button>
              <button
                onClick={() => {
                  setFilters((f) => ({ ...f, radiusMi: 50 }));
                  setTimeout(() => goToFilters(), 0);
                }}
                className="px-5 py-3 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
              >
                {t.increaseRadius}
              </button>
              <button
                onClick={() => {
                  setFilters((f) => ({ ...f, category: "all" }));
                  setTimeout(() => goToFilters(), 0);
                }}
                className="px-5 py-3 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition"
              >
                {t.viewEverything}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Listings feed */}
            <div
              className={cx(
                "mt-8",
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              )}
            >
              {slice.items.map((l) => {
                const isBiz = l.tier === "BIZ_LITE" || l.tier === "BIZ_PREMIUM" || l.sellerType === "BUSINESS";
                return (
                  <Link
                    key={l.id}
                    href={`/clasificados/${l.id}`}
                    className={cx(
                      "group rounded-2xl border p-4 bg-black/35 transition",
                      isBiz
                        ? "border-yellow-600/25 hover:border-yellow-500/35 shadow-[0_0_35px_rgba(234,179,8,0.08)]"
                        : "border-white/10 hover:border-white/15"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      {/* thumbnail (small) */}
                      <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/10 flex-shrink-0 overflow-hidden">
                        {l.hasImage ? (
                          <img src="/classifieds-placeholder-bilingual.png" alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-semibold text-white group-hover:text-yellow-200 transition truncate">
                            {l.title}
                          </div>
                          <div className={cx("text-sm font-semibold", isBiz ? "text-yellow-200" : "text-white/80")}>
                            {priceLabel(l.price ?? null, lang)}
                          </div>
                        </div>

                        <div className="mt-1 text-sm text-gray-300 flex items-center gap-2">
                          <span className="truncate">{l.city}</span>
                          <span className="text-white/25">•</span>
                          <span>{lang === "es" ? "Publicado" : "Posted"} {formatRelative(l.createdAt, lang)}</span>
                        </div>

                        {/* Optional subtle status badge (no “paid” language) */}
                        {(l.tier === "PRO" || l.tier === "BIZ_LITE" || l.tier === "BIZ_PREMIUM") && (
                          <div className="mt-3">
                            <span
                              className={cx(
                                "inline-flex items-center px-3 py-1 rounded-full text-xs border",
                                l.tier === "PRO"
                                  ? "border-yellow-600/35 bg-yellow-400/10 text-yellow-200"
                                  : "border-yellow-600/25 bg-black/35 text-yellow-200"
                              )}
                            >
                              {l.tier === "PRO" ? t.proBadge : lang === "es" ? "Negocio" : "Business"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex items-center justify-between">
              <div className="text-gray-300">
                {t.page} {pageSafe} {lang === "es" ? "de" : "of"} {totalPages}
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={pageSafe <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={cx(
                    "px-5 py-3 rounded-full border transition",
                    pageSafe <= 1
                      ? "bg-black/25 border-white/10 text-white/35 cursor-not-allowed"
                      : "bg-black/35 border-white/10 text-white/85 hover:bg-black/45"
                  )}
                >
                  {t.prevPage}
                </button>
                <button
                  disabled={pageSafe >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className={cx(
                    "px-5 py-3 rounded-full border transition",
                    pageSafe >= totalPages
                      ? "bg-black/25 border-white/10 text-white/35 cursor-not-allowed"
                      : "bg-black/35 border-white/10 text-white/85 hover:bg-black/45"
                  )}
                >
                  {t.nextPage}
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* MEMBERSHIPS SUMMARY */}
      <section ref={membershipsRef} className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-yellow-200">{t.membershipsTitle}</h2>
            <p className="mt-2 text-gray-300">{t.membershipsSubtitle}</p>
          </div>
          <Link
            href="/clasificados/membrecias"
            className="px-5 py-3 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition"
          >
            {lang === "es" ? "Ver detalles" : "View details"}
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-6">
            <div className="text-2xl font-bold text-white">{t.free}</div>
            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• {t.free1}</li>
              <li>• {t.free2}</li>
              <li>• {t.free3}</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-yellow-600/25 bg-black/35 p-6 shadow-[0_0_35px_rgba(234,179,8,0.08)]">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{t.pro}</div>
              <span className="px-3 py-1 rounded-full text-xs border border-yellow-600/35 bg-yellow-400/10 text-yellow-200">
                {t.proBadge}
              </span>
            </div>
            <div className="mt-2 text-yellow-200 font-semibold">{t.proPrice}</div>
            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• {t.pro1}</li>
              <li>• {t.pro2}</li>
              <li>• {t.pro3}</li>
            </ul>
            <div className="mt-5">
              <Link
                href="/clasificados/membrecias"
                className="inline-flex px-5 py-3 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition"
              >
                {t.proCta}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-600/20 bg-black/35 p-6">
            <div className="text-2xl font-bold text-white">{t.bizLite}</div>
            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• {t.bizLite1}</li>
              <li>• {t.bizLite2}</li>
              <li>• {t.bizLite3}</li>
            </ul>
            <div className="mt-5">
              <Link
                href="/clasificados/membrecias-negocio"
                className="inline-flex px-5 py-3 rounded-full bg-black/35 border border-white/10 text-white/90 hover:bg-black/45 transition"
              >
                {t.bizLiteCta}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-yellow-600/25 bg-black/35 p-6 shadow-[0_0_35px_rgba(234,179,8,0.08)]">
            <div className="text-2xl font-bold text-white">{t.bizPremium}</div>
            <ul className="mt-4 space-y-2 text-gray-300">
              <li>• {t.bizPremium1}</li>
              <li>• {t.bizPremium2}</li>
              <li>• {t.bizPremium3}</li>
            </ul>
            <div className="mt-5">
              <Link
                href="/clasificados/membrecias-negocio"
                className="inline-flex px-5 py-3 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition"
              >
                {t.bizPremiumCta}
              </Link>
            </div>
          </div>
        </div>

        {/* Business directory CTA (keeps businesses visible + discoverable) */}
        <div className="mt-8 rounded-2xl border border-yellow-600/20 bg-black/35 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold text-yellow-200">
              {lang === "es" ? "Explora negocios" : "Explore businesses"}
            </div>
            <div className="mt-1 text-gray-300">
              {lang === "es"
                ? "Directorio de negocios dentro de Clasificados."
                : "Business directory inside Classifieds."}
            </div>
          </div>
          <Link
            href="/clasificados/negocios"
            className="px-6 py-3 rounded-full bg-yellow-400/15 border border-yellow-600/35 text-yellow-200 hover:bg-yellow-400/20 transition"
          >
            {lang === "es" ? "Ver negocios" : "View businesses"}
          </Link>
        </div>
      </section>
    </div>
  );
}
