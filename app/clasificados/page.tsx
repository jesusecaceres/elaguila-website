"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import logo from "../../public/logo.png";

type Lang = "es" | "en";
type ViewMode = "grid" | "list";

type CategoryKey =
  | "all"
  | "en-venta"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad";

type SellerType = "any" | "personal" | "business";
type PostedRange = "any" | "24h" | "7d" | "30d";
type Condition = "any" | "new" | "like-new" | "good" | "fair";
type SortMode = "balanced" | "newest" | "price_asc" | "price_desc";

type Listing = {
  id: string;
  category: Exclude<CategoryKey, "all">;
  seller: "business" | "personal";
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  postedAgo: { es: string; en: string };
  summary: { es: string; en: string };
  hasImage: boolean;
  condition: Exclude<Condition, "any">;
};

const CATEGORIES_ORDER: Array<Exclude<CategoryKey, "all">> = [
  "en-venta",
  "rentas",
  "autos",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
];

function catLabel(cat: CategoryKey, lang: Lang) {
  const map: Record<CategoryKey, { es: string; en: string }> = {
    all: { es: "Todas", en: "All" },
    "en-venta": { es: "En Venta", en: "For Sale" },
    rentas: { es: "Rentas", en: "Rentals" },
    autos: { es: "Autos", en: "Autos" },
    servicios: { es: "Servicios", en: "Services" },
    empleos: { es: "Empleos", en: "Jobs" },
    clases: { es: "Clases", en: "Classes" },
    comunidad: { es: "Comunidad", en: "Community" },
  };
  return map[cat][lang];
}

function sortLabel(mode: SortMode, lang: Lang) {
  const map: Record<SortMode, { es: string; en: string }> = {
    balanced: { es: "Equilibrado", en: "Balanced" },
    newest: { es: "Más reciente", en: "Newest" },
    price_asc: { es: "Precio ↑", en: "Price ↑" },
    price_desc: { es: "Precio ↓", en: "Price ↓" },
  };
  return map[mode][lang];
}

function postedLabel(v: PostedRange, lang: Lang) {
  const map: Record<PostedRange, { es: string; en: string }> = {
    any: { es: "Cualquier fecha", en: "Any time" },
    "24h": { es: "Últimas 24 horas", en: "Last 24 hours" },
    "7d": { es: "Últimos 7 días", en: "Last 7 days" },
    "30d": { es: "Últimos 30 días", en: "Last 30 days" },
  };
  return map[v][lang];
}

function sellerLabel(v: SellerType, lang: Lang) {
  const map: Record<SellerType, { es: string; en: string }> = {
    any: { es: "Cualquiera", en: "Any" },
    personal: { es: "Personal", en: "Personal" },
    business: { es: "Negocio", en: "Business" },
  };
  return map[v][lang];
}

function conditionLabel(v: Condition, lang: Lang) {
  const map: Record<Condition, { es: string; en: string }> = {
    any: { es: "Cualquiera", en: "Any" },
    new: { es: "Nuevo", en: "New" },
    "like-new": { es: "Como nuevo", en: "Like new" },
    good: { es: "Bueno", en: "Good" },
    fair: { es: "Regular", en: "Fair" },
  };
  return map[v][lang];
}

function money(n: number) {
  return Number.isFinite(n) ? n.toString() : "";
}

const PRICE_PRESETS = [
  { min: 0, max: 30 },
  { min: 31, max: 50 },
  { min: 51, max: 100 },
  { min: 101, max: 250 },
  { min: 251, max: 500 },
  { min: 501, max: 1000 },
];

export default function ClasificadosPage() {
  const params = useSearchParams();
  const lang = ((params.get("lang") || "es") as Lang) ?? "es";

  const t = useMemo(() => {
    const es = {
      pageTitle: "Clasificados",
      subtitle:
        "Acceso justo para todos. Comunidad primero. Ventaja premium para quienes invierten — sin esconder anuncios gratuitos.",
      post: "Publicar anuncio",
      view: "Ver anuncios",
      memberships: "Membresías",
      filters: "Filtros",
      signIn: "Iniciar sesión",
      create: "Crear cuenta",
      signOut: "Cerrar sesión",
      filterTitle: "Filtrar anuncios",
      search: "Buscar",
      searchPh: "Buscar anuncios…",
      location: "Ubicación",
      edit: "Editar",
      city: "Ciudad",
      zip: "ZIP",
      nearby: "Ciudades cercanas",
      radius: "Radio",
      save: "Guardar",
      reset: "Restablecer",
      resetAll: "Restablecer filtros",
      moreFilters: "Más filtros",
      priceRange: "Rango de precio",
      min: "Min",
      max: "Max",
      posted: "Publicado",
      image: "Imagen",
      any: "Cualquiera",
      hasImage: "Con imagen",
      seller: "Vendedor",
      condition: "Condición",
      exploreByCat: "Explorar por categoría",
      clearCat: "Quitar categoría",
      results: "Resultados",
      showing: "Mostrando",
      of: "de",
      sort: "Orden",
      viewMode: "Vista",
      grid: "Grid",
      list: "List",
      noResults: "No encontramos anuncios",
      noResultsDesc:
        "Intenta ajustar filtros. Si estás buscando cerca, aumenta el radio o revisa todas las categorías.",
      clearFilters: "Quitar filtros",
      expandRadius: "Aumentar radio",
      seeAll: "Ver todo",
      page: "Página",
      prev: "Anterior",
      next: "Siguiente",
      businessHeader: "Negocios",
      businessSub:
        "Negocios verificados y activos en esta categoría. (Se muestran junto a anuncios personales.)",
      personalHeader: "Anuncios personales",
      businessOnly: "Ver negocios en esta categoría",
      businessOnlyOff: "Ver todo",
      membershipsTitle: "Membresías",
      membershipsNote:
        "Resumen rápido. Beneficios completos se muestran en la página de Membresías.",
      free: "Gratis",
      pro: "LEONIX Pro",
      bizLite: "Business Lite",
      bizPrem: "Business Premium",
      freeBullets: ["1 imagen", "Duración: 7 días", "Siempre visible y buscable"],
      proBullets: [
        "$16.99/mes",
        "Duración: 30 días",
        "Analíticas básicas (vistas/guardados)",
        "2 boosts por anuncio (48 horas c/u)",
      ],
      bizLiteBullets: [
        "$89/mes",
        "Insignia de negocio y confianza",
        "Más anuncios activos",
        "Más visibilidad que perfiles personales",
      ],
      bizPremBullets: [
        "$149/mes",
        "Perfil mejorado y prioridad de conversión",
        "Herramientas de contacto/leads por anuncio",
        "Enlaces a sitio y redes (según membresía)",
      ],
      printVsClassifieds:
        "Print Ads = Trust, Engagement, Coupons, Sweepstakes • Classifieds = Search, Intent, Speed, Conversion",
    };

    const en = {
      pageTitle: "Classifieds",
      subtitle:
        "Fair access for everyone. Community first. Premium advantage for investors — without hiding free listings.",
      post: "Post listing",
      view: "View listings",
      memberships: "Memberships",
      filters: "Filters",
      signIn: "Sign in",
      create: "Create account",
      signOut: "Sign out",
      filterTitle: "Filter listings",
      search: "Search",
      searchPh: "Search listings…",
      location: "Location",
      edit: "Edit",
      city: "City",
      zip: "ZIP",
      nearby: "Nearby cities",
      radius: "Radius",
      save: "Save",
      reset: "Reset",
      resetAll: "Reset filters",
      moreFilters: "More filters",
      priceRange: "Price range",
      min: "Min",
      max: "Max",
      posted: "Posted",
      image: "Image",
      any: "Any",
      hasImage: "Has image",
      seller: "Seller",
      condition: "Condition",
      exploreByCat: "Explore by category",
      clearCat: "Clear category",
      results: "Results",
      showing: "Showing",
      of: "of",
      sort: "Sort",
      viewMode: "View",
      grid: "Grid",
      list: "List",
      noResults: "No listings found",
      noResultsDesc:
        "Try adjusting filters. If you’re searching nearby, increase radius or check all categories.",
      clearFilters: "Clear filters",
      expandRadius: "Increase radius",
      seeAll: "See all",
      page: "Page",
      prev: "Previous",
      next: "Next",
      businessHeader: "Businesses",
      businessSub:
        "Active businesses in this category. (Shown alongside personal listings.)",
      personalHeader: "Personal listings",
      businessOnly: "Show businesses in this category",
      businessOnlyOff: "Show all",
      membershipsTitle: "Memberships",
      membershipsNote:
        "Quick summary. Full benefits are shown on the Memberships page.",
      free: "Free",
      pro: "LEONIX Pro",
      bizLite: "Business Lite",
      bizPrem: "Business Premium",
      freeBullets: ["1 image", "Duration: 7 days", "Always visible & searchable"],
      proBullets: [
        "$16.99/mo",
        "Duration: 30 days",
        "Basic analytics (views/saves)",
        "2 boosts per listing (48h each)",
      ],
      bizLiteBullets: [
        "$89/mo",
        "Business trust signal",
        "More active listings",
        "Higher visibility than personal profiles",
      ],
      bizPremBullets: [
        "$149/mo",
        "Enhanced profile + conversion priority",
        "Contact/lead tools per listing",
        "Website + social links (by plan)",
      ],
      printVsClassifieds:
        "Print Ads = Trust, Engagement, Coupons, Sweepstakes • Classifieds = Search, Intent, Speed, Conversion",
    };

    return lang === "es" ? es : en;
  }, [lang]);

  // Demo listings: 1 business + 1 personal for EACH category
  const listings: Listing[] = useMemo(() => {
    const mk = (p: Omit<Listing, "title" | "priceLabel" | "postedAgo" | "summary"> & {
      titleEs: string; titleEn: string;
      priceEs: string; priceEn: string;
      agoEs: string; agoEn: string;
      sumEs: string; sumEn: string;
    }): Listing => ({
      id: p.id,
      category: p.category,
      seller: p.seller,
      city: p.city,
      hasImage: p.hasImage,
      condition: p.condition,
      title: { es: p.titleEs, en: p.titleEn },
      priceLabel: { es: p.priceEs, en: p.priceEn },
      postedAgo: { es: p.agoEs, en: p.agoEn },
      summary: { es: p.sumEs, en: p.sumEn },
    });

    const data: Listing[] = [];

    // EN VENTA
    data.push(
      mk({
        id: "biz-enventa-1",
        category: "en-venta",
        seller: "business",
        city: "San José",
        hasImage: true,
        condition: "good",
        titleEs: "Taller: Paquetes de mantenimiento",
        titleEn: "Shop: Maintenance packages",
        priceEs: "Desde $49",
        priceEn: "From $49",
        agoEs: "hace 2 horas",
        agoEn: "2 hours ago",
        sumEs: "Servicio rápido. Citas disponibles hoy. Se habla español.",
        sumEn: "Fast service. Appointments available today.",
      }),
      mk({
        id: "per-enventa-1",
        category: "en-venta",
        seller: "personal",
        city: "Santa Clara",
        hasImage: true,
        condition: "like-new",
        titleEs: "Mesa de comedor 6 sillas",
        titleEn: "Dining table + 6 chairs",
        priceEs: "$120",
        priceEn: "$120",
        agoEs: "hace 1 día",
        agoEn: "1 day ago",
        sumEs: "Buen estado. Recoger en Santa Clara.",
        sumEn: "Good condition. Pickup in Santa Clara.",
      })
    );

    // RENTAS
    data.push(
      mk({
        id: "biz-rentas-1",
        category: "rentas",
        seller: "business",
        city: "San José",
        hasImage: true,
        condition: "good",
        titleEs: "Rentas: Apartamentos disponibles",
        titleEn: "Rentals: Apartments available",
        priceEs: "2H/1B desde $2,450",
        priceEn: "2B/1B from $2,450",
        agoEs: "hace 5 horas",
        agoEn: "5 hours ago",
        sumEs: "Cerca de transporte. Depósito flexible (según perfil).",
        sumEn: "Near transit. Flexible deposit (by profile).",
      }),
      mk({
        id: "per-rentas-1",
        category: "rentas",
        seller: "personal",
        city: "Milpitas",
        hasImage: false,
        condition: "good",
        titleEs: "Cuarto en renta (utilities incl.)",
        titleEn: "Room for rent (utilities incl.)",
        priceEs: "$850",
        priceEn: "$850",
        agoEs: "hace 3 días",
        agoEn: "3 days ago",
        sumEs: "Cuarto privado. Solo personas serias.",
        sumEn: "Private room. Serious inquiries only.",
      })
    );

    // AUTOS
    data.push(
      mk({
        id: "biz-autos-1",
        category: "autos",
        seller: "business",
        city: "San José",
        hasImage: true,
        condition: "good",
        titleEs: "Dealer: Sedán 2017 (financiamiento)",
        titleEn: "Dealer: 2017 sedan (financing)",
        priceEs: "$10,990",
        priceEn: "$10,990",
        agoEs: "hace 6 horas",
        agoEn: "6 hours ago",
        sumEs: "Millaje bajo. Prueba de manejo hoy.",
        sumEn: "Low miles. Test drive today.",
      }),
      mk({
        id: "per-autos-1",
        category: "autos",
        seller: "personal",
        city: "Campbell",
        hasImage: true,
        condition: "fair",
        titleEs: "Honda 2009 — título limpio",
        titleEn: "Honda 2009 — clean title",
        priceEs: "$3,800",
        priceEn: "$3,800",
        agoEs: "hace 2 días",
        agoEn: "2 days ago",
        sumEs: "Corre bien. Detalles cosméticos.",
        sumEn: "Runs well. Cosmetic wear.",
      })
    );

    // SERVICIOS
    data.push(
      mk({
        id: "biz-serv-1",
        category: "servicios",
        seller: "business",
        city: "Sunnyvale",
        hasImage: true,
        condition: "good",
        titleEs: "Plomería 24/7 — presupuesto",
        titleEn: "Plumbing 24/7 — quote",
        priceEs: "Cotización gratis",
        priceEn: "Free quote",
        agoEs: "hace 4 horas",
        agoEn: "4 hours ago",
        sumEs: "Reparaciones, instalaciones y emergencias.",
        sumEn: "Repairs, installs, emergencies.",
      }),
      mk({
        id: "per-serv-1",
        category: "servicios",
        seller: "personal",
        city: "San José",
        hasImage: false,
        condition: "good",
        titleEs: "Clases de guitarra (a domicilio)",
        titleEn: "Guitar lessons (in-home)",
        priceEs: "Desde $25",
        priceEn: "From $25",
        agoEs: "hace 7 días",
        agoEn: "7 days ago",
        sumEs: "Principiantes bienvenidos. Horarios flexibles.",
        sumEn: "Beginners welcome. Flexible schedule.",
      })
    );

    // EMPLEOS
    data.push(
      mk({
        id: "biz-job-1",
        category: "empleos",
        seller: "business",
        city: "San José",
        hasImage: true,
        condition: "good",
        titleEs: "Se busca barbero (tiempo parcial)",
        titleEn: "Hiring barber (part-time)",
        priceEs: "$$",
        priceEn: "$$",
        agoEs: "hace 1 día",
        agoEn: "1 day ago",
        sumEs: "Experiencia requerida. Buen ambiente.",
        sumEn: "Experience required. Great team.",
      }),
      mk({
        id: "per-job-1",
        category: "empleos",
        seller: "personal",
        city: "Santa Clara",
        hasImage: false,
        condition: "good",
        titleEs: "Busco trabajo: limpieza / ayuda",
        titleEn: "Looking for work: cleaning / help",
        priceEs: "A convenir",
        priceEn: "Negotiable",
        agoEs: "hace 4 días",
        agoEn: "4 days ago",
        sumEs: "Disponible fines de semana. Responsable.",
        sumEn: "Weekends available. Reliable.",
      })
    );

    // CLASES
    data.push(
      mk({
        id: "biz-class-1",
        category: "clases",
        seller: "business",
        city: "San José",
        hasImage: true,
        condition: "good",
        titleEs: "Inglés conversacional (grupos)",
        titleEn: "Conversational English (groups)",
        priceEs: "Desde $15/clase",
        priceEn: "From $15/class",
        agoEs: "hace 2 días",
        agoEn: "2 days ago",
        sumEs: "Niveles básicos e intermedios.",
        sumEn: "Beginner + intermediate levels.",
      }),
      mk({
        id: "per-class-1",
        category: "clases",
        seller: "personal",
        city: "Milpitas",
        hasImage: false,
        condition: "good",
        titleEs: "Tutoría de matemáticas (HS)",
        titleEn: "Math tutoring (HS)",
        priceEs: "$20/h",
        priceEn: "$20/hr",
        agoEs: "hace 6 días",
        agoEn: "6 days ago",
        sumEs: "Álgebra / geometría. Online o en persona.",
        sumEn: "Algebra / geometry. Online or in-person.",
      })
    );

    // COMUNIDAD
    data.push(
      mk({
        id: "biz-com-1",
        category: "comunidad",
        seller: "business",
        city: "San José",
        hasImage: true,
        condition: "good",
        titleEs: "Centro comunitario — clases gratis",
        titleEn: "Community center — free classes",
        priceEs: "Gratis",
        priceEn: "Free",
        agoEs: "hace 8 horas",
        agoEn: "8 hours ago",
        sumEs: "Recursos y apoyo. Consulta horarios.",
        sumEn: "Resources and support. Check schedule.",
      }),
      mk({
        id: "per-com-1",
        category: "comunidad",
        seller: "personal",
        city: "Campbell",
        hasImage: false,
        condition: "good",
        titleEs: "Donación de ropa (tallas mixtas)",
        titleEn: "Clothing donation (mixed sizes)",
        priceEs: "Gratis",
        priceEn: "Free",
        agoEs: "hace 1 día",
        agoEn: "1 day ago",
        sumEs: "Solo recoger. Todo limpio.",
        sumEn: "Pickup only. Clean items.",
      })
    );

    return data;
  }, []);

  // Filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<SortMode>("balanced");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [city, setCity] = useState("San José");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState<number>(25);

  const [moreOpen, setMoreOpen] = useState(false);
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  const [posted, setPosted] = useState<PostedRange>("any");
  const [seller, setSeller] = useState<SellerType>("any");
  const [cond, setCond] = useState<Condition>("any");
  const [hasImage, setHasImage] = useState<"any" | "yes">("any");

  const [locOpen, setLocOpen] = useState(false);
  const [draftCity, setDraftCity] = useState(city);
  const [draftZip, setDraftZip] = useState(zip);
  const [draftRadius, setDraftRadius] = useState(radius);

  const [businessOnly, setBusinessOnly] = useState(false);

  const filtersRef = useRef<HTMLDivElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const membershipsRef = useRef<HTMLDivElement | null>(null);

  // When category changes via pills, keep dropdown in sync + scroll to results
  const selectCategory = (c: CategoryKey, scrollToResults = true) => {
    setCategory(c);
    if (scrollToResults) {
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("all");
    setSort("balanced");
    setCity("San José");
    setZip("");
    setRadius(25);
    setMoreOpen(false);
    setPriceMin("");
    setPriceMax("");
    setPosted("any");
    setSeller("any");
    setCond("any");
    setHasImage("any");
    setBusinessOnly(false);
  };

  const activePrice = useMemo(() => {
    const mn = Number(priceMin);
    const mx = Number(priceMax);
    const hasMin = priceMin.trim().length > 0 && Number.isFinite(mn);
    const hasMax = priceMax.trim().length > 0 && Number.isFinite(mx);
    if (!hasMin && !hasMax) return null;
    return { min: hasMin ? mn : null, max: hasMax ? mx : null };
  }, [priceMin, priceMax]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let items = listings.slice();

    if (category !== "all") items = items.filter((x) => x.category === category);

    if (businessOnly) items = items.filter((x) => x.seller === "business");

    if (q) {
      items = items.filter((x) => {
        const text = `${x.title.es} ${x.title.en} ${x.summary.es} ${x.summary.en}`.toLowerCase();
        return text.includes(q);
      });
    }

    if (seller !== "any") items = items.filter((x) => x.seller === seller);

    if (cond !== "any") items = items.filter((x) => x.condition === cond);

    if (hasImage === "yes") items = items.filter((x) => x.hasImage);

    // Price filtering is demo-only (uses digits found in priceLabel)
    if (activePrice) {
      items = items.filter((x) => {
        const priceText = (lang === "es" ? x.priceLabel.es : x.priceLabel.en).replace(/[^0-9]/g, "");
        const n = priceText ? Number(priceText) : NaN;
        if (!Number.isFinite(n)) return true; // keep "Gratis", "A convenir", "$$"
        if (activePrice.min != null && n < activePrice.min) return false;
        if (activePrice.max != null && n > activePrice.max) return false;
        return true;
      });
    }

    // Posted filter is demo-only, we don’t have real timestamps yet
    // Keeping it as UI/UX placeholder.

    // Sorting
    const sorters: Record<SortMode, (a: Listing, b: Listing) => number> = {
      balanced: (a, b) => {
        // slight preference businesses first, but still mixed later in UI
        if (a.seller !== b.seller) return a.seller === "business" ? -1 : 1;
        return a.id.localeCompare(b.id);
      },
      newest: (a, b) => b.id.localeCompare(a.id),
      price_asc: (a, b) => a.id.localeCompare(b.id),
      price_desc: (a, b) => b.id.localeCompare(a.id),
    };
    items.sort(sorters[sort]);

    return items;
  }, [listings, category, businessOnly, query, seller, cond, hasImage, activePrice, sort, lang]);

  const businesses = useMemo(() => filtered.filter((x) => x.seller === "business"), [filtered]);
  const personals = useMemo(() => filtered.filter((x) => x.seller === "personal"), [filtered]);

  const pageSize = viewMode === "grid" ? 18 : 10;
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [query, category, city, zip, radius, moreOpen, priceMin, priceMax, posted, seller, cond, hasImage, businessOnly, sort, viewMode]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (clampedPage - 1) * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, clampedPage, pageSize]);

  // Split view: always show business section + personal section, but keep pagination for overall list
  // For demo UX: if there are results, show sections without paginating separately.
  const showSections = true;

  const nearbyCities = useMemo(() => {
    // Placeholder: later this should be computed based on radius + chosen city/zip
    const base = ["Santa Clara", "Milpitas", "Campbell", "Sunnyvale"];
    return base.filter((c) => c.toLowerCase() !== city.toLowerCase());
  }, [city, radius]);

  const goFilters = () => filtersRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const goResults = () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const goMemberships = () => membershipsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const authHref = (path: string) => `${path}?lang=${lang}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* HERO (Magazine style) */}
      <section className="relative pt-24">
        <div className="absolute inset-0 -z-10">
          <div className="h-[520px] w-full bg-gradient-to-b from-black via-yellow-700/20 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.18),rgba(0,0,0,0.55)_55%,rgba(0,0,0,1)_80%)]" />
        </div>

        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="flex items-center justify-between gap-3">
            <div className="opacity-0" aria-hidden="true">
              spacer
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={authHref("/clasificados/login")}
                className="rounded-full border border-white/15 bg-black/40 px-5 py-2 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.signIn}
              </Link>
              <Link
                href={authHref("/clasificados/login")}
                className="rounded-full border border-yellow-400/25 bg-yellow-400/15 px-5 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-400/20 transition"
              >
                {t.create}
              </Link>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Image
              src={logo}
              alt="LEONIX"
              width={120}
              height={120}
              className="rounded-2xl shadow-[0_0_30px_rgba(250,204,21,0.15)]"
              priority
            />
          </div>

          <h1 className="mt-8 text-5xl md:text-7xl font-extrabold tracking-tight text-yellow-200 drop-shadow">
            {t.pageTitle}
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg md:text-xl text-gray-200/90">
            {t.subtitle}
          </p>

          {/* Primary pills (ONLY ONE ROW here) */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href={authHref("/clasificados/publicar")}
              className="rounded-full border border-yellow-400/30 bg-yellow-400/15 px-8 py-3 text-sm md:text-base font-semibold text-yellow-200 hover:bg-yellow-400/20 transition"
            >
              {t.post}
            </Link>
            <button
              onClick={goResults}
              className="rounded-full border border-white/15 bg-black/40 px-8 py-3 text-sm md:text-base font-semibold text-gray-100 hover:bg-white/5 transition"
            >
              {t.view}
            </button>
            <button
              onClick={goMemberships}
              className="rounded-full border border-white/15 bg-black/40 px-8 py-3 text-sm md:text-base font-semibold text-gray-100 hover:bg-white/5 transition"
            >
              {t.memberships}
            </button>
          </div>

          <div className="mt-10 border-t border-white/10" />
        </div>
      </section>

      {/* FILTERS */}
      <section ref={filtersRef} id="filters" className="mx-auto max-w-6xl px-6 pt-14">
        <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-yellow-200">
          {t.filterTitle}
        </h2>

        <div className="mt-8 rounded-3xl border border-yellow-600/20 bg-black/35 p-6 backdrop-blur">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* Search */}
            <div className="md:col-span-5">
              <div className="text-sm font-semibold text-gray-300">{t.search}</div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPh}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-400/30"
              />
            </div>

            {/* Location summary */}
            <div className="md:col-span-4">
              <div className="text-sm font-semibold text-gray-300">{t.location}</div>
              <div className="mt-2 flex gap-3">
                <button
                  onClick={() => {
                    setDraftCity(city);
                    setDraftZip(zip);
                    setDraftRadius(radius);
                    setLocOpen(true);
                  }}
                  className="flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-left text-gray-100 hover:bg-white/5 transition"
                >
                  {city} • {radius} mi{zip ? ` • ${zip}` : ""}
                </button>
                <button
                  onClick={() => {
                    setDraftCity(city);
                    setDraftZip(zip);
                    setDraftRadius(radius);
                    setLocOpen(true);
                  }}
                  className="rounded-2xl border border-white/10 bg-black/50 px-5 py-3 font-semibold text-gray-200 hover:bg-white/5 transition"
                >
                  {t.edit}
                </button>
              </div>
            </div>

            {/* Category */}
            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-gray-300">{t.location ? t.city : ""}</div>
              <div className="text-sm font-semibold text-gray-300">{t.location ? "" : ""}</div>
              <div className="text-sm font-semibold text-gray-300">{t.location ? "" : ""}</div>
              <div className="text-sm font-semibold text-gray-300">{/* spacer */}</div>
              <div className="text-sm font-semibold text-gray-300">{/* spacer */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>
              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>
              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>

              <div className="text-sm font-semibold text-gray-300">{/* keep layout */}</div>
            </div>

            <div className="md:col-span-2">
              <div className="text-sm font-semibold text-gray-300">{t.filters ? t.filters : ""}</div>
              <div className="text-sm font-semibold text-gray-300">{t.filters ? "" : ""}</div>
              <div className="text-sm font-semibold text-gray-300">{t.filters ? "" : ""}</div>

              <div className="text-sm font-semibold text-gray-300">{/* label */}Categoría</div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryKey)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-400/30"
              >
                <option value="all">{catLabel("all", lang)}</option>
                {CATEGORIES_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {catLabel(c, lang)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="md:col-span-1">
              <div className="text-sm font-semibold text-gray-300">{t.sort}</div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-400/30"
              >
                <option value="balanced">{sortLabel("balanced", lang)}</option>
                <option value="newest">{sortLabel("newest", lang)}</option>
                <option value="price_asc">{sortLabel("price_asc", lang)}</option>
                <option value="price_desc">{sortLabel("price_desc", lang)}</option>
              </select>
            </div>
          </div>

          {/* More filters */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="rounded-full border border-white/15 bg-black/40 px-5 py-2 font-semibold text-gray-100 hover:bg-white/5 transition"
            >
              {t.moreFilters} <span className="ml-2 opacity-70">{moreOpen ? "▲" : "▼"}</span>
            </button>

            <button
              onClick={() => {
                setBusinessOnly((v) => !v);
                requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
              }}
              className={`rounded-full border px-5 py-2 font-semibold transition ${
                businessOnly
                  ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-200"
                  : "border-white/15 bg-black/40 text-gray-100 hover:bg-white/5"
              }`}
            >
              {businessOnly ? t.businessOnlyOff : t.businessOnly}
            </button>
          </div>

          {moreOpen && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-black/35 p-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
                {/* Price */}
                <div className="md:col-span-4">
                  <div className="text-sm font-semibold text-gray-300">{t.priceRange}</div>

                  <div className="mt-2 flex gap-3">
                    <input
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      inputMode="numeric"
                      placeholder={t.min}
                      className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-400/30"
                    />
                    <input
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      inputMode="numeric"
                      placeholder={t.max}
                      className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-400/30"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {PRICE_PRESETS.map((p) => (
                      <button
                        key={`${p.min}-${p.max}`}
                        onClick={() => {
                          setPriceMin(String(p.min));
                          setPriceMax(String(p.max));
                        }}
                        className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
                      >
                        {`$${money(p.min)}–$${money(p.max)}`}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setPriceMin("");
                        setPriceMax("");
                      }}
                      className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
                    >
                      {t.reset}
                    </button>
                  </div>
                </div>

                {/* Posted */}
                <div className="md:col-span-3">
                  <div className="text-sm font-semibold text-gray-300">{t.posted}</div>
                  <select
                    value={posted}
                    onChange={(e) => setPosted(e.target.value as PostedRange)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-400/30"
                  >
                    <option value="any">{postedLabel("any", lang)}</option>
                    <option value="24h">{postedLabel("24h", lang)}</option>
                    <option value="7d">{postedLabel("7d", lang)}</option>
                    <option value="30d">{postedLabel("30d", lang)}</option>
                  </select>
                </div>

                {/* Image */}
                <div className="md:col-span-2">
                  <div className="text-sm font-semibold text-gray-300">{t.image}</div>
                  <button
                    onClick={() => setHasImage((v) => (v === "any" ? "yes" : "any"))}
                    className={`mt-2 w-full rounded-2xl border px-4 py-3 font-semibold transition ${
                      hasImage === "yes"
                        ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-200"
                        : "border-white/10 bg-black/50 text-gray-100 hover:bg-white/5"
                    }`}
                  >
                    {hasImage === "yes" ? t.hasImage : t.any}
                  </button>
                </div>

                {/* Seller */}
                <div className="md:col-span-2">
                  <div className="text-sm font-semibold text-gray-300">{t.seller}</div>
                  <select
                    value={seller}
                    onChange={(e) => setSeller(e.target.value as SellerType)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-400/30"
                  >
                    <option value="any">{sellerLabel("any", lang)}</option>
                    <option value="personal">{sellerLabel("personal", lang)}</option>
                    <option value="business">{sellerLabel("business", lang)}</option>
                  </select>
                </div>

                {/* Condition */}
                <div className="md:col-span-1">
                  <div className="text-sm font-semibold text-gray-300">{t.condition}</div>
                  <select
                    value={cond}
                    onChange={(e) => setCond(e.target.value as Condition)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 outline-none focus:border-yellow-400/30"
                  >
                    <option value="any">{conditionLabel("any", lang)}</option>
                    <option value="new">{conditionLabel("new", lang)}</option>
                    <option value="like-new">{conditionLabel("like-new", lang)}</option>
                    <option value="good">{conditionLabel("good", lang)}</option>
                    <option value="fair">{conditionLabel("fair", lang)}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Category pills */}
          <div className="mt-8">
            <div className="text-sm font-semibold text-gray-300">{t.exploreByCat}</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {CATEGORIES_ORDER.map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    onClick={() => selectCategory(c)}
                    className={`rounded-full border px-5 py-2 font-semibold transition ${
                      active
                        ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-200"
                        : "border-white/15 bg-black/40 text-gray-100 hover:bg-white/5"
                    }`}
                  >
                    {catLabel(c, lang)}
                  </button>
                );
              })}

              <button
                onClick={() => selectCategory("all")}
                className="rounded-full border border-white/15 bg-black/40 px-5 py-2 font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.clearCat}
              </button>
            </div>
          </div>

          {/* Active chips */}
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-gray-100">
              {t.city}: {city} ✕
            </span>
            <span className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-gray-100">
              {t.radius}: {radius} mi ✕
            </span>
            {category !== "all" && (
              <span className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-gray-100">
                {catLabel(category, lang)} ✕
              </span>
            )}
            <button
              onClick={resetFilters}
              className="rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
            >
              {t.resetAll}
            </button>
          </div>
        </div>

        {/* Location modal */}
        {locOpen && (
          <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm">
            <div className="mx-auto mt-20 w-[92%] max-w-2xl rounded-3xl border border-yellow-600/20 bg-black/70 p-6">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-extrabold text-yellow-200">{t.location}</div>
                <button
                  onClick={() => setLocOpen(false)}
                  className="rounded-full border border-white/15 bg-black/40 px-5 py-2 font-semibold text-gray-100 hover:bg-white/5 transition"
                >
                  {lang === "es" ? "Cerrar" : "Close"}
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-white/10 bg-black/35 p-5">
                <div className="text-xl font-bold text-yellow-100">
                  {lang === "es" ? "Permiso de ubicación (opcional)" : "Location permission (optional)"}
                </div>
                <p className="mt-2 text-gray-300">
                  {lang === "es"
                    ? "Puedes usar tu ubicación para sugerir ciudad. No guardamos tu ubicación precisa — solo la ciudad y el radio que elijas."
                    : "Use location to suggest a city. We don’t store precise location — only the city and radius you choose."}
                </p>
                <button
                  onClick={() => {
                    // Placeholder UX: later connect browser geolocation
                    setDraftCity("San José");
                  }}
                  className="mt-4 rounded-full border border-white/15 bg-black/40 px-6 py-3 font-semibold text-gray-100 hover:bg-white/5 transition"
                >
                  {lang === "es" ? "Usar mi ubicación" : "Use my location"}
                </button>
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold text-gray-300">{t.city}</div>
                <input
                  value={draftCity}
                  onChange={(e) => setDraftCity(e.target.value)}
                  placeholder={lang === "es" ? "Escribe tu ciudad…" : "Type your city…"}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-400/30"
                />

                <div className="mt-4 text-sm font-semibold text-gray-300">{t.zip}</div>
                <input
                  value={draftZip}
                  onChange={(e) => setDraftZip(e.target.value)}
                  inputMode="numeric"
                  placeholder={lang === "es" ? "Opcional" : "Optional"}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-gray-100 placeholder:text-gray-500 outline-none focus:border-yellow-400/30"
                />

                {/* Radius under city (as requested) */}
                <div className="mt-6 text-sm font-semibold text-gray-300">{t.radius}</div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {[10, 25, 40, 50].map((r) => {
                    const active = draftRadius === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setDraftRadius(r)}
                        className={`rounded-full border px-5 py-2 font-semibold transition ${
                          active
                            ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-200"
                            : "border-white/15 bg-black/40 text-gray-100 hover:bg-white/5"
                        }`}
                      >
                        {r} mi
                      </button>
                    );
                  })}
                </div>

                <p className="mt-3 text-gray-400">
                  {lang === "es"
                    ? "La ciudad es el selector principal. El radio ampliará el alcance (lógica de distancia se conecta después)."
                    : "City is the primary selector. Radius expands reach (distance logic comes later)."}
                </p>

                <div className="mt-6 text-sm font-semibold text-gray-300">{t.nearby}</div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {["Santa Clara", "Milpitas", "Campbell", "Sunnyvale"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setDraftCity(c)}
                      className="rounded-full border border-white/15 bg-black/40 px-5 py-2 font-semibold text-gray-100 hover:bg-white/5 transition"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  onClick={() => {
                    setDraftCity("San José");
                    setDraftZip("");
                    setDraftRadius(25);
                  }}
                  className="rounded-full border border-white/15 bg-black/40 px-6 py-3 font-semibold text-gray-100 hover:bg-white/5 transition"
                >
                  {t.reset}
                </button>
                <button
                  onClick={() => {
                    setCity(draftCity || "San José");
                    setZip(draftZip);
                    setRadius(draftRadius);
                    setLocOpen(false);
                  }}
                  className="rounded-full border border-yellow-400/30 bg-yellow-400/15 px-7 py-3 font-semibold text-yellow-200 hover:bg-yellow-400/20 transition"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* RESULTS + STICKY ACTION BAR (ONLY HERE) */}
      <section ref={resultsRef} id="results" className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        {/* Sticky bar begins here (no double row) */}
        <div className="sticky top-20 z-40 -mx-6 px-6 py-4 bg-black/60 backdrop-blur border-y border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <Link
                href={authHref("/clasificados/publicar")}
                className="rounded-full border border-yellow-400/30 bg-yellow-400/15 px-6 py-2 text-sm font-semibold text-yellow-200 hover:bg-yellow-400/20 transition"
              >
                {t.post}
              </Link>
              <button
                onClick={goResults}
                className="rounded-full border border-white/15 bg-black/40 px-6 py-2 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.view}
              </button>
              <button
                onClick={goMemberships}
                className="rounded-full border border-white/15 bg-black/40 px-6 py-2 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.memberships}
              </button>
              <button
                onClick={goFilters}
                className="rounded-full border border-white/15 bg-black/40 px-6 py-2 text-sm font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.filters}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="rounded-2xl border border-white/10 bg-black/50 px-4 py-2 text-gray-100 outline-none focus:border-yellow-400/30"
              >
                <option value="balanced">{sortLabel("balanced", lang)}</option>
                <option value="newest">{sortLabel("newest", lang)}</option>
                <option value="price_asc">{sortLabel("price_asc", lang)}</option>
                <option value="price_desc">{sortLabel("price_desc", lang)}</option>
              </select>

              {/* Icons + labels */}
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "grid"
                    ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-200"
                    : "border-white/10 bg-black/50 text-gray-100 hover:bg-white/5"
                }`}
                aria-label={t.grid}
              >
                <span className="text-base">▦</span>
                <span>{t.grid}</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "list"
                    ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-200"
                    : "border-white/10 bg-black/50 text-gray-100 hover:bg-white/5"
                }`}
                aria-label={t.list}
              >
                <span className="text-base">≡</span>
                <span>{t.list}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-yellow-200">
              {t.results}
            </h2>
            <div className="mt-2 text-gray-300">
              {t.showing} {total === 0 ? "0" : "1"}–{Math.min(total, total)} {t.of} {total}
            </div>
          </div>
        </div>

        {/* Sections (Business top, then Personal) */}
        {total === 0 ? (
          <div className="mt-10 rounded-3xl border border-yellow-600/20 bg-black/35 p-8">
            <div className="text-2xl font-extrabold text-yellow-200">{t.noResults}</div>
            <p className="mt-3 text-gray-300">{t.noResultsDesc}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={resetFilters}
                className="rounded-full border border-white/15 bg-black/40 px-6 py-3 font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.clearFilters}
              </button>
              <button
                onClick={() => setRadius((r) => (r === 50 ? 50 : r + 15))}
                className="rounded-full border border-white/15 bg-black/40 px-6 py-3 font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.expandRadius}
              </button>
              <button
                onClick={() => selectCategory("all", false)}
                className="rounded-full border border-white/15 bg-black/40 px-6 py-3 font-semibold text-gray-100 hover:bg-white/5 transition"
              >
                {t.seeAll}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-10">
            {/* Business block */}
            <div className="rounded-3xl border border-yellow-600/25 bg-black/35 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl md:text-2xl font-extrabold text-yellow-200">
                    {t.businessHeader}
                  </div>
                  <div className="mt-1 text-gray-300">{t.businessSub}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {businesses.length === 0 ? (
                  <div className="text-gray-300">
                    {lang === "es"
                      ? "No hay negocios con estos filtros."
                      : "No business listings with these filters."}
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-3 gap-4"
                        : "flex flex-col gap-4"
                    }
                  >
                    {businesses.map((x) => (
                      <ListingCard key={x.id} x={x} lang={lang} emphasis />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="my-10 h-px bg-gradient-to-r from-transparent via-yellow-600/30 to-transparent" />

            {/* Personal block */}
            <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
              <div className="text-xl md:text-2xl font-extrabold text-yellow-100">
                {t.personalHeader}
              </div>

              <div className="mt-6">
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-3 gap-4"
                      : "flex flex-col gap-4"
                  }
                >
                  {personals.map((x) => (
                    <ListingCard key={x.id} x={x} lang={lang} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination (simple) */}
        <div className="mt-12 flex items-center justify-between text-gray-300">
          <div>
            {t.page} {clampedPage} {lang === "es" ? "de" : "of"} {totalPages}
          </div>
          <div className="flex gap-3">
            <button
              disabled={clampedPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-white/15 bg-black/40 px-6 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition"
            >
              {t.prev}
            </button>
            <button
              disabled={clampedPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-full border border-white/15 bg-black/40 px-6 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5 transition"
            >
              {t.next}
            </button>
          </div>
        </div>

        {/* MEMBERSHIPS preview */}
        <div ref={membershipsRef} id="memberships" className="mt-20">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-yellow-200">
            {t.membershipsTitle}
          </h2>
          <p className="mt-3 text-gray-300">{t.membershipsNote}</p>

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            <MembershipCard title={t.free} bullets={t.freeBullets} />
            <MembershipCard title={t.pro} bullets={t.proBullets} ctaHref={authHref("/clasificados/membrecias")} ctaText={t.memberships} />
            <MembershipCard title={t.bizLite} bullets={t.bizLiteBullets} ctaHref={authHref("/clasificados/membrecias-negocio")} ctaText={t.memberships} />
            <MembershipCard title={t.bizPrem} bullets={t.bizPremBullets} ctaHref={authHref("/clasificados/membrecias-negocio")} ctaText={t.memberships} />
          </div>

          <div className="mt-8 text-sm text-gray-400">{t.printVsClassifieds}</div>
        </div>
      </section>
    </div>
  );
}

function ListingCard({
  x,
  lang,
  emphasis,
}: {
  x: Listing;
  lang: Lang;
  emphasis?: boolean;
}) {
  const title = lang === "es" ? x.title.es : x.title.en;
  const price = lang === "es" ? x.priceLabel.es : x.priceLabel.en;
  const ago = lang === "es" ? x.postedAgo.es : x.postedAgo.en;
  const sum = lang === "es" ? x.summary.es : x.summary.en;

  return (
    <button
      onClick={() => {
        // Placeholder: later route to /clasificados/anuncio/[id]
        alert(`${title}`);
      }}
      className={`text-left rounded-3xl border bg-black/35 p-5 transition hover:bg-white/5 ${
        emphasis ? "border-yellow-400/25" : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-extrabold text-yellow-100">{title}</div>
        <div
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
            x.seller === "business"
              ? "border-yellow-400/30 bg-yellow-400/15 text-yellow-200"
              : "border-white/15 bg-black/40 text-gray-200"
          }`}
        >
          {x.seller === "business" ? (lang === "es" ? "Negocio" : "Business") : (lang === "es" ? "Personal" : "Personal")}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-gray-300">
        <div className="font-semibold">{price}</div>
        <div>
          {x.city} • {ago}
        </div>
      </div>

      <div className="mt-3 text-gray-300">{sum}</div>

      <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
          {lang === "es" ? "Condición:" : "Condition:"}{" "}
          {conditionLabel(x.condition, lang)}
        </span>
        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1">
          {x.hasImage ? (lang === "es" ? "Con imagen" : "Has image") : (lang === "es" ? "Sin imagen" : "No image")}
        </span>
      </div>
    </button>
  );
}

function MembershipCard({
  title,
  bullets,
  ctaHref,
  ctaText,
}: {
  title: string;
  bullets: string[];
  ctaHref?: string;
  ctaText?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
      <div className="text-2xl font-extrabold text-yellow-100">{title}</div>
      <ul className="mt-4 space-y-2 text-gray-300">
        {bullets.map((b) => (
          <li key={b}>• {b}</li>
        ))}
      </ul>

      {ctaHref && ctaText && (
        <div className="mt-6">
          <Link
            href={ctaHref}
            className="inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/15 px-6 py-3 font-semibold text-yellow-200 hover:bg-yellow-400/20 transition"
          >
            {ctaText}
          </Link>
        </div>
      )}
    </div>
  );
}
