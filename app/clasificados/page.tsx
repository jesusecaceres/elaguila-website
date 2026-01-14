"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import newLogo from "../../public/logo.png";

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

type Listing = {
  id: string;
  category: Exclude<CategoryKey, "all">;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string }; // keep flexible: "$850", "Gratis", etc.
  city: string;
  postedAgo: { es: string; en: string };
  blurb: { es: string; en: string };
  hasImage: boolean;
  condition: "any" | "new" | "good" | "fair";
  sellerType: SellerType;
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

        // sticky pills extras
        stickyFilters: "Ir a filtros",

        resultsTitle: "Resultados",
        showing: (a: number, b: number, total: number) =>
          `Mostrando ${a}-${b} de ${total}`,
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
        dividerLabel: "Separación",

        // sorting
        sortBalanced: "Equilibrado",
        sortNewest: "Más nuevos",
        sortPriceAsc: "Precio ↑",
        sortPriceDesc: "Precio ↓",

        grid: "Grid",
        list: "List",

        // pagination
        pageXofY: (x: number, y: number) => `Página ${x} de ${y}`,
        prev: "Anterior",
        next: "Siguiente",

        // memberships section
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

        // links (routes you confirmed)
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
        dividerLabel: "Divider",

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

  // ----- Sample listings (one per category, plus one business example per category) -----
  const sampleListings: Listing[] = useMemo(
    () => [
      // EN VENTA
      {
        id: "enventa-personal-1",
        category: "en-venta",
        title: { es: "iPhone 13 desbloqueado", en: "Unlocked iPhone 13" },
        priceLabel: { es: "$420", en: "$420" },
        city: "San José",
        postedAgo: { es: "hace 2 días", en: "2 days ago" },
        blurb: {
          es: "Excelente condición. Incluye caja y cargador.",
          en: "Great condition. Includes box and charger.",
        },
        hasImage: true,
        condition: "good",
        sellerType: "personal",
      },
      {
        id: "enventa-biz-1",
        category: "en-venta",
        title: { es: "Tienda: electrónicos reacondicionados", en: "Shop: refurbished electronics" },
        priceLabel: { es: "Desde $49", en: "From $49" },
        city: "San José",
        postedAgo: { es: "hace 1 día", en: "1 day ago" },
        blurb: {
          es: "Garantía y recogida local. Pregunta por disponibilidad.",
          en: "Warranty + local pickup. Ask for availability.",
        },
        hasImage: true,
        condition: "good",
        sellerType: "business",
      },

      // RENTAS
      {
        id: "rentas-personal-1",
        category: "rentas",
        title: { es: "Cuarto en renta (utilities incl.)", en: "Room for rent (utilities incl.)" },
        priceLabel: { es: "$850", en: "$850" },
        city: "Milpitas",
        postedAgo: { es: "hace 3 días", en: "3 days ago" },
        blurb: {
          es: "Cuarto privado. Solo personas serias.",
          en: "Private room. Serious inquiries only.",
        },
        hasImage: false,
        condition: "good",
        sellerType: "personal",
      },
      {
        id: "rentas-biz-1",
        category: "rentas",
        title: { es: "Propiedades disponibles (citas)", en: "Available rentals (appointments)" },
        priceLabel: { es: "Ver precios", en: "See pricing" },
        city: "San José",
        postedAgo: { es: "hace 6 horas", en: "6 hours ago" },
        blurb: {
          es: "Apartamentos y casas. Agenda visita hoy.",
          en: "Apartments & homes. Book a visit today.",
        },
        hasImage: true,
        condition: "good",
        sellerType: "business",
      },

      // AUTOS
      {
        id: "autos-personal-1",
        category: "autos",
        title: { es: "Honda Civic 2012 — 138k millas", en: "2012 Honda Civic — 138k miles" },
        priceLabel: { es: "$5,900", en: "$5,900" },
        city: "Santa Clara",
        postedAgo: { es: "hace 5 días", en: "5 days ago" },
        blurb: {
          es: "Título limpio. Mantenimiento al día.",
          en: "Clean title. Maintenance up to date.",
        },
        hasImage: true,
        condition: "good",
        sellerType: "personal",
      },
      {
        id: "autos-biz-1",
        category: "autos",
        title: { es: "Dealer: autos certificados", en: "Dealer: certified vehicles" },
        priceLabel: { es: "Financiamiento", en: "Financing" },
        city: "San José",
        postedAgo: { es: "hace 12 horas", en: "12 hours ago" },
        blurb: {
          es: "Citas disponibles. Pregunta por inventario.",
          en: "Appointments available. Ask about inventory.",
        },
        hasImage: true,
        condition: "good",
        sellerType: "business",
      },

      // SERVICIOS
      {
        id: "servicios-personal-1",
        category: "servicios",
        title: { es: "Jardinería (fines de semana)", en: "Yard work (weekends)" },
        priceLabel: { es: "Cotización", en: "Quote" },
        city: "San José",
        postedAgo: { es: "hace 1 día", en: "1 day ago" },
        blurb: {
          es: "Corte, limpieza y mantenimiento.",
          en: "Mowing, cleanup, maintenance.",
        },
        hasImage: false,
        condition: "any",
        sellerType: "personal",
      },
      {
        id: "servicios-biz-1",
        category: "servicios",
        title: { es: "Plomería 24/7 (negocio local)", en: "Plumbing 24/7 (local business)" },
        priceLabel: { es: "Llama hoy", en: "Call today" },
        city: "San José",
        postedAgo: { es: "hace 2 horas", en: "2 hours ago" },
        blurb: {
          es: "Urgencias, instalaciones, reparaciones.",
          en: "Emergencies, installs, repairs.",
        },
        hasImage: true,
        condition: "any",
        sellerType: "business",
      },

      // EMPLEOS
      {
        id: "empleos-personal-1",
        category: "empleos",
        title: { es: "Se busca ayudante de cocina", en: "Kitchen helper needed" },
        priceLabel: { es: "Pago semanal", en: "Weekly pay" },
        city: "San José",
        postedAgo: { es: "hace 4 días", en: "4 days ago" },
        blurb: {
          es: "Tiempo parcial. Experiencia preferida.",
          en: "Part-time. Experience preferred.",
        },
        hasImage: false,
        condition: "any",
        sellerType: "personal",
      },
      {
        id: "empleos-biz-1",
        category: "empleos",
        title: { es: "Empresa contratando: tiempo completo", en: "Company hiring: full-time" },
        priceLabel: { es: "Ver detalles", en: "See details" },
        city: "San José",
        postedAgo: { es: "hace 8 horas", en: "8 hours ago" },
        blurb: {
          es: "Beneficios y crecimiento. Aplica hoy.",
          en: "Benefits + growth. Apply today.",
        },
        hasImage: true,
        condition: "any",
        sellerType: "business",
      },

      // CLASES
      {
        id: "clases-personal-1",
        category: "clases",
        title: { es: "Clases de guitarra (principiantes)", en: "Guitar lessons (beginners)" },
        priceLabel: { es: "$25/hr", en: "$25/hr" },
        city: "San José",
        postedAgo: { es: "hace 6 días", en: "6 days ago" },
        blurb: {
          es: "En persona u online. Horarios flexibles.",
          en: "In-person or online. Flexible schedule.",
        },
        hasImage: true,
        condition: "any",
        sellerType: "personal",
      },
      {
        id: "clases-biz-1",
        category: "clases",
        title: { es: "Academia: cursos certificados", en: "Academy: certified courses" },
        priceLabel: { es: "Inscripción", en: "Enrollment" },
        city: "San José",
        postedAgo: { es: "hace 1 día", en: "1 day ago" },
        blurb: {
          es: "Programas por nivel. Cupos limitados.",
          en: "Programs by level. Limited seats.",
        },
        hasImage: true,
        condition: "any",
        sellerType: "business",
      },

      // COMUNIDAD
      {
        id: "comunidad-personal-1",
        category: "comunidad",
        title: { es: "Donación: ropa para niños", en: "Donation: kids clothing" },
        priceLabel: { es: "Gratis", en: "Free" },
        city: "San José",
        postedAgo: { es: "hace 2 días", en: "2 days ago" },
        blurb: {
          es: "Tallas 4–8. Recoger en zona sur.",
          en: "Sizes 4–8. Pickup in south SJ.",
        },
        hasImage: true,
        condition: "good",
        sellerType: "personal",
      },
      {
        id: "comunidad-biz-1",
        category: "comunidad",
        title: { es: "Organización: recursos gratuitos", en: "Organization: free resources" },
        priceLabel: { es: "Gratis", en: "Free" },
        city: "San José",
        postedAgo: { es: "hace 10 horas", en: "10 hours ago" },
        blurb: {
          es: "Apoyo comunitario. Información y ayuda.",
          en: "Community support. Info and help.",
        },
        hasImage: true,
        condition: "any",
        sellerType: "business",
      },
    ],
    []
  );

  // ----- State -----
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<"balanced" | "newest" | "priceAsc" | "priceDesc">("balanced");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Location + advanced filters (restored from pagesample2 UX)
  const DEFAULT_CITY = "San José";
  const DEFAULT_RADIUS = 25;

  const CITY_OPTIONS = useMemo(
    () => ["San José", "Santa Clara", "Milpitas", "Campbell", "Sunnyvale", "Cupertino", "Mountain View", "Palo Alto"],
    []
  );

  const [moreOpen, setMoreOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [city, setCity] = useState(DEFAULT_CITY);
  const [zip, setZip] = useState("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS);

  const [cityDraft, setCityDraft] = useState(city);
  const [zipDraft, setZipDraft] = useState(zip);
  const [radiusDraft, setRadiusDraft] = useState(radiusMi);

  const [hasImage, setHasImage] = useState<"any" | "yes" | "no">("any");
  const [seller, setSeller] = useState<"any" | "business" | "personal">("any");
  const [condition, setCondition] = useState<"any" | "new" | "good" | "fair">("any");

  const [boostInfoOpen, setBoostInfoOpen] = useState<null | "free" | "pro">(null);


  const nearbyCities = useMemo(() => {
    if (radiusMi <= 10) return ["Santa Clara", "Milpitas"];
    if (radiusMi <= 25) return ["Santa Clara", "Milpitas", "Campbell", "Sunnyvale"];
    if (radiusMi <= 40) return ["Santa Clara", "Milpitas", "Campbell", "Sunnyvale", "Cupertino", "Mountain View"];
    return ["Santa Clara", "Milpitas", "Campbell", "Sunnyvale", "Cupertino", "Mountain View", "Palo Alto"];
  }, [radiusMi]);

  const citySuggestions = useMemo(() => {
    const q = cityDraft.trim().toLowerCase();
    if (!q) return CITY_OPTIONS.slice(0, 6);
    return CITY_OPTIONS.filter((c) => c.toLowerCase().includes(q)).slice(0, 6);
  }, [CITY_OPTIONS, cityDraft]);

  const locationSummary = useMemo(() => {
    const base = zip ? (lang === "es" ? `ZIP ${zip}` : `ZIP ${zip}`) : city;
    return `${base} • ${radiusMi} ${lang === "es" ? "mi" : "mi"}`;
  }, [city, zip, radiusMi, lang]);

  const openLocation = () => {
    setCityDraft(city);
    setZipDraft(zip);
    setRadiusDraft(radiusMi);
    setLocationOpen(true);
  };

  const applyLocation = () => {
    setCity(cityDraft.trim() || DEFAULT_CITY);
    setZip(zipDraft.trim());
    setRadiusMi(radiusDraft);
    setLocationOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // For now (until geocoding is wired), we default to San José.
        setCityDraft("San José");
        setZipDraft("");
      },
      () => {
        // If denied, keep current draft.
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };


  // ----- Anchors -----
  const filtersRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const membershipsRef = useRef<HTMLDivElement | null>(null);

  // Sticky pills appear when user reaches results
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = resultsRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      // when results reaches near top (sticky becomes active)
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

  const filtered = useMemo(() => {
    let list = sampleListings;

    if (selectedCategory !== "all") {
      list = list.filter((l) => l.category === selectedCategory);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((l) => {
        const title = l.title[lang].toLowerCase();
        const blurb = l.blurb[lang].toLowerCase();
        const city = l.city.toLowerCase();
        return title.includes(q) || blurb.includes(q) || city.includes(q);
      });
    }

    // Location filter (City + Radius). ZIP support is UI-only for now (no geocoding yet).
    if (!zip) {
      const allowedCities = Array.from(new Set([city, ...nearbyCities]));
      list = list.filter((l) => allowedCities.includes(l.city));
    }

    // Advanced filters
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
      // Pull first number from strings like "$5,900", "From $49", etc.
      const m = s.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
      return m ? Number(m[1]) : Number.NaN;
    };

    if (sort === "newest") {
      // sample data doesn't have real timestamps; keep stable
      return list;
    }
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
  }, [sampleListings, selectedCategory, search, sort, lang]);

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
    // always jump to results so user sees it worked
    setTimeout(() => scrollTo(resultsRef), 0);
  };

  const resetAll = () => {
    setSearch("");
    setSelectedCategory("all");
    setSort("balanced");

    // Location + advanced filters
    setCity(DEFAULT_CITY);
    setZip("");
    setRadiusMi(DEFAULT_RADIUS);
    setHasImage("any");
    setSeller("any");
    setCondition("any");
    setMoreOpen(false);
  };

  // ----- UI helpers -----
  const sortLabel = (value: typeof sort) => {
    if (value === "balanced") return t.sortBalanced;
    if (value === "newest") return t.sortNewest;
    if (value === "priceAsc") return t.sortPriceAsc;
    return t.sortPriceDesc;
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

    return (
      <a
        href={`/clasificados/${item.category}/${item.id}`}
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

            <span
              className={cx(
                "shrink-0 px-3 py-1 rounded-full text-xs font-semibold border",
                isBusiness
                  ? "border-yellow-400/40 text-yellow-200 bg-yellow-400/10"
                  : "border-white/10 text-gray-200 bg-white/5"
              )}
            >
              {isBusiness ? (lang === "es" ? "Negocio" : "Business") : lang === "es" ? "Personal" : "Personal"}
            </span>
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
              {item.hasImage ? (lang === "es" ? "Con imagen" : "Has image") : lang === "es" ? "Sin imagen" : "No image"}
            </span>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className="bg-black min-h-screen text-white pb-32">
      <Navbar />

      {/* HERO — match magazine style */}
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="relative text-center mb-16">
          {/* Auth buttons (mobile-safe) */}
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

          {/* BIGGER logo (same as magazine) */}
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
              <div className="mt-2">
                <button
                  onClick={() => {
                    // placeholder for location edit; will be wired later
                    alert(lang === "es" ? "Editar ubicación (próximamente)" : "Edit location (coming soon)");
                  }}
                  className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
                >
                  {lang === "es" ? "Editar" : "Edit"}
                </button>
              </div>
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

            {/* active chips */}
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
            </div>
          </div>

          {moreOpen && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-300 mb-2">{lang === "es" ? "Con imagen" : "Has image"}</div>
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
                  <div className="text-sm text-gray-300 mb-2">{lang === "es" ? "Vendedor" : "Seller"}</div>
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
                  <div className="text-sm text-gray-300 mb-2">{lang === "es" ? "Condición" : "Condition"}</div>
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

        {/* Explore by category pills */}
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
                  onChange={(e) => setCityDraft(e.target.value)}
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
                <div className="text-sm text-gray-300 mb-2">{lang === "es" ? "ZIP (opcional)" : "ZIP (optional)"}</div>
                <input
                  value={zipDraft}
                  onChange={(e) => setZipDraft(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
                  inputMode="numeric"
                  placeholder="95112"
                  className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                />
                <div className="text-xs text-gray-400 mt-2">
                  {lang === "es"
                    ? "Nota: por ahora el ZIP es para guardarlo en tu preferencia (geocoding después)."
                    : "Note: ZIP is saved as a preference for now (geocoding later)."}
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
                    {radiusDraft} {lang === "es" ? "mi" : "mi"}
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


      {/* BOOST INFO MODAL */}
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
                <div className="text-sm text-gray-300 mt-1">
                  {boostInfoOpen === "pro"
                    ? lang === "es"
                      ? "Tus ventanas de visibilidad se activan por 48 horas."
                      : "Your visibility windows activate for 48 hours."
                    : lang === "es"
                    ? "El impulso opcional dura 48 horas."
                    : "The optional boost lasts 48 hours."}
                </div>
              </div>

              <button
                onClick={() => setBoostInfoOpen(null)}
                className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            <div className="mt-6 space-y-3 text-gray-300 leading-relaxed">
              <p>
                {lang === "es"
                  ? "• Al activarlo, tu anuncio sube al frente de los resultados por 48 horas."
                  : "• When you activate it, your listing moves to the front for 48 hours."}
              </p>
              <p>
                {lang === "es"
                  ? "• Si otras personas publican durante ese tiempo, tu anuncio puede ir bajando — pero mantiene visibilidad destacada mientras dura."
                  : "• If others post during that time, your listing can move down — but it stays highlighted while the window is active."}
              </p>
              <p>
                {lang === "es"
                  ? "• No oculta anuncios gratis: solo mejora la posición y la atención por un tiempo."
                  : "• It never hides free listings: it only improves position and attention for a limited time."}
              </p>
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

      {/* RESULTS */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div ref={resultsRef} id="results" className="scroll-mt-28" />

        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-5xl font-bold text-yellow-400">{t.resultsTitle}</h2>
            <div className="mt-2 text-gray-300">
              {t.showing(filtered.length ? 1 : 0, filtered.length ? filtered.length : 0, filtered.length)}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={cx(
                  "px-4 py-2.5 rounded-full border font-semibold transition flex items-center gap-2",
                  viewMode === "grid"
                    ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                    : "border-white/10 bg-black/30 text-gray-100 hover:bg-black/45"
                )}
              >
                <span aria-hidden>▦</span> {t.grid}
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cx(
                  "px-4 py-2.5 rounded-full border font-semibold transition flex items-center gap-2",
                  viewMode === "list"
                    ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                    : "border-white/10 bg-black/30 text-gray-100 hover:bg-black/45"
                )}
              >
                <span aria-hidden>≡</span> {t.list}
              </button>
            </div>
          </div>
        </div>

        {/* Sticky actions (mobile-optimized) */}
        {/* Desktop: top sticky */}
        <div
          className={cx(
            "hidden md:block sticky top-[76px] z-40 mt-8",
            showSticky ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="border border-white/10 bg-black/50 backdrop-blur rounded-2xl px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <a
                href={t.routePost}
                className="px-5 py-2.5 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
              >
                {t.ctaPost}
              </a>

              <button
                onClick={() => scrollTo(resultsRef)}
                className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
              >
                {t.ctaView}
              </button>

              <button
                onClick={() => scrollTo(membershipsRef)}
                className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
              >
                {t.ctaMemberships}
              </button>

              <button
                onClick={() => scrollTo(filtersRef)}
                className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
              >
                {t.stickyFilters}
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-4 py-2.5 rounded-full bg-black/40 border border-white/10 text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              >
                <option value="balanced">{t.sortBalanced}</option>
                <option value="newest">{t.sortNewest}</option>
                <option value="priceAsc">{t.sortPriceAsc}</option>
                <option value="priceDesc">{t.sortPriceDesc}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile: bottom sticky (keeps screen free for listings) */}
        <div
          className={cx(
            "md:hidden fixed left-0 right-0 bottom-0 z-50 px-4 pb-4",
            showSticky ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <div className="border border-white/10 bg-black/70 backdrop-blur rounded-2xl px-3 py-2 flex items-center justify-between gap-2">
            <button
              onClick={() => scrollTo(filtersRef)}
              className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold"
            >
              {t.stickyFilters}
            </button>

            <a
              href={t.routePost}
              className="px-5 py-2 rounded-full bg-yellow-400 text-black font-extrabold"
            >
              {t.ctaPost}
            </a>

            <button
              onClick={() => scrollTo(membershipsRef)}
              className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold"
            >
              {lang === "es" ? "Pro" : "Pro"}
            </button>
          </div>
        </div>

        {/* Result body */}
        <div className="mt-8 border border-white/10 bg-black/30 rounded-2xl p-8">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-10">
              <div className="text-3xl font-bold text-yellow-200">{t.noResultsTitle}</div>
              <p className="mt-3 text-gray-300">{t.noResultsBody}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={resetAll}
                  className="px-6 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
                >
                  {t.clearFiltersBtn}
                </button>
                <button
                  onClick={() => alert(lang === "es" ? "Radio (próximamente)" : "Radius (coming soon)")}
                  className="px-6 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
                >
                  {t.widenRadiusBtn}
                </button>
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="px-6 py-3 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition"
                >
                  {t.viewAllBtn}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              {/* BUSINESS TOP */}
              <div>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-2xl font-bold text-yellow-200">{t.businessHeader}</div>
                    <div className="text-gray-300 mt-2">{t.businessHint}</div>
                  </div>
                  <a
                    href={t.routeBusinessDirectory}
                    className="px-6 py-3 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 font-semibold hover:bg-yellow-400/15 transition"
                  >
                    {lang === "es" ? "Ver directorio de negocios" : "View business directory"}
                  </a>
                </div>

                <div
                  className={cx(
                    "mt-6 grid gap-6",
                    viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                  )}
                >
                  {businessListings.length ? (
                    businessListings.map((item) => <ListingCard key={item.id} item={item} />)
                  ) : (
                    <div className="text-gray-400">
                      {lang === "es"
                        ? "Aún no hay negocios en este filtro."
                        : "No business listings for this filter yet."}
                    </div>
                  )}
                </div>
              </div>

              {/* DIVIDER */}
              <div className="my-10 h-px bg-white/10 w-full" />

              {/* PERSONAL / COMMUNITY */}
              <div>
                <div className="text-2xl font-bold text-gray-100">{t.personalHeader}</div>
                <div
                  className={cx(
                    "mt-6 grid gap-6",
                    viewMode === "grid" ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                  )}
                >
                  {personalListings.map((item) => (
                    <ListingCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pagination (placeholder, 1 page) */}
        <div className="mt-10 flex items-center justify-between">
          <div className="text-gray-300">{t.pageXofY(1, 1)}</div>
          <div className="flex gap-3">
            <button
              disabled
              className="px-6 py-3 rounded-full border border-white/10 bg-black/30 text-gray-500 font-semibold"
            >
              {t.prev}
            </button>
            <button
              disabled
              className="px-6 py-3 rounded-full border border-white/10 bg-black/30 text-gray-500 font-semibold"
            >
              {t.next}
            </button>
          </div>
        </div>
      </section>

      {/* MEMBERSHIPS */}
      <section className="max-w-6xl mx-auto px-6 mt-20">
        <div ref={membershipsRef} id="memberships" className="scroll-mt-28" />

        <h2 className="text-5xl font-bold text-yellow-400">{t.membershipsTitle}</h2>
        <p className="mt-3 text-gray-300">{t.membershipsSubtitle}</p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Free */}
          <div className="border border-white/10 rounded-2xl p-8 bg-black/30">
            <div className="text-2xl font-bold text-gray-100">{t.freeTitle}</div>
            <ul className="mt-6 space-y-3 text-gray-300">
              {t.freeBullets.map((x) => (
                <li key={x}>• {x}</li>
              ))}
              <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>• {lang === "es" ? "Impulso opcional: $9.99 (48 horas)" : "Optional boost: $9.99 (48 hours)"}</span>
                <button
                  type="button"
                  onClick={() => setBoostInfoOpen("free")}
                  className="text-yellow-200 hover:text-yellow-100 underline underline-offset-4 text-sm"
                >
                  {lang === "es" ? "¿Cómo funciona?" : "How it works"}
                </button>
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="border border-yellow-400/25 rounded-2xl p-8 bg-black/35">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-bold text-yellow-200">{t.proTitle}</div>
              <div className="text-sm font-semibold text-yellow-200/90">{t.proPrice}</div>
            </div>
            <ul className="mt-6 space-y-3 text-gray-300">
              {t.proBullets.map((x) => (
                <li key={x}>• {x}</li>
              ))}
              <li className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>• {lang === "es" ? "Ventanas de visibilidad (48h) incluidas" : "Included visibility windows (48h)"}</span>
                <button
                  type="button"
                  onClick={() => setBoostInfoOpen("pro")}
                  className="text-yellow-200 hover:text-yellow-100 underline underline-offset-4 text-sm"
                >
                  {lang === "es" ? "¿Cómo funciona?" : "How it works"}
                </button>
              </li>
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={t.routeMemberships}
                className="px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold hover:opacity-95 transition"
              >
                {lang === "es" ? "Ver detalles de Pro" : "See Pro details"}
              </a>
            </div>
          </div>

          {/* Business Lite */}
          <div className="border border-white/10 rounded-2xl p-8 bg-black/30">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-bold text-gray-100">{t.bizLiteTitle}</div>
              <div className="text-sm font-semibold text-gray-200/90">{t.bizLitePrice}</div>
            </div>
            <ul className="mt-6 space-y-3 text-gray-300">
              {t.bizLiteBullets.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
            <div className="mt-7">
              <a
                href={t.routeBizMemberships}
                className="px-6 py-3 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 font-semibold hover:bg-yellow-400/15 transition"
              >
                {lang === "es" ? "Ver membresías de negocio" : "See business memberships"}
              </a>
            </div>
          </div>

          {/* Business Premium */}
          <div className="border border-white/10 rounded-2xl p-8 bg-black/30">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl font-bold text-gray-100">{t.bizPremTitle}</div>
              <div className="text-sm font-semibold text-gray-200/90">{t.bizPremPrice}</div>
            </div>
            <ul className="mt-6 space-y-3 text-gray-300">
              {t.bizPremBullets.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
            <div className="mt-7">
              <a
                href={t.routeBizMemberships}
                className="px-6 py-3 rounded-full border border-yellow-400/30 bg-yellow-400/10 text-yellow-200 font-semibold hover:bg-yellow-400/15 transition"
              >
                {lang === "es" ? "Comparar Lite vs Premium" : "Compare Lite vs Premium"}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 text-sm text-gray-400 text-center">
          {t.printVsClassifieds.split(" • ").map((part) => (
            <div key={part} className="leading-relaxed">
              {part}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
