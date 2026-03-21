"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  FiShoppingCart,
  FiHome,
  FiLayers,
  FiTruck,
  FiCoffee,
  FiTool,
  FiBriefcase,
  FiBook,
  FiUsers,
  FiMapPin,
  FiGrid,
} from "react-icons/fi";
import Navbar from "../../components/Navbar";
import { serviciosDrawerFilters } from "../config/categoryConfig";
import { BIENES_RAICES_SUBCATEGORIES, getBienesRaicesSubcategoryLabel } from "../bienes-raices/shared/fields/bienesRaicesTaxonomy";
import newLogo from "../../../public/logo.png";

import {
  CA_CITIES,
  CITY_ALIASES,
  ZIP_GEO,
  DEFAULT_CITY,
  DEFAULT_RADIUS_MI,
} from "../../data/locations/norcal";
import { SAMPLE_LISTINGS } from "../../data/classifieds/sampleListings";
import RecentlyViewedSection from "../components/RecentlyViewedSection";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { isProListing } from "../components/planHelpers";
import ProBadge from "../components/ProBadge";
import { parseBusinessMeta } from "../config/businessListingContract";

type ServicesTier = "standard" | "plus" | "premium";

function inferServicesTier(x: any): ServicesTier {
  const v = (typeof x?.servicesTier === "string" ? x.servicesTier : "").toLowerCase().trim();
  if (v === "premium" || v === "plus" || v === "standard") return v as ServicesTier;
  // Print advertisers or legacy fields can map here later.
  return "standard";
}

/** Sort a tier bucket: boosted (boostUntil > now) first by boostUntil desc, then rest by createdAtISO desc. */
function sortServiciosTierBucket(items: Listing[]): Listing[] {
  const now = Date.now();
  return [...items].sort((a, b) => {
    const untilA = (a as any).boostUntil != null ? new Date((a as any).boostUntil).getTime() : 0;
    const untilB = (b as any).boostUntil != null ? new Date((b as any).boostUntil).getTime() : 0;
    const activeA = untilA > now ? 1 : 0;
    const activeB = untilB > now ? 1 : 0;
    if (activeB !== activeA) return activeB - activeA; // active (boosted) first
    if (activeA && activeB && untilB !== untilA) return untilB - untilA; // then boostUntil desc
    const createdA = a.createdAtISO ? new Date(a.createdAtISO).getTime() : 0;
    const createdB = b.createdAtISO ? new Date(b.createdAtISO).getTime() : 0;
    return createdB - createdA;
  });
}

function getListingHref(x: any, lang: Lang) {
  return x?.category === "servicios"
    ? `/clasificados/servicios/${x.businessId || x.id}?lang=${lang}`
    : `/clasificados/anuncio/${x.id}?lang=${lang}`;
}
const RADIUS_OPTIONS = [10, 25, 40, 50] as const;

// ------------------------------------------------------------
// Servicios — Yelp-style taxonomy (UI + SEO params)
// NOTE: We keep a single /clasificados/lista engine.
// SEO is expressed via URL params (cat=servicios&stype=...).
// ------------------------------------------------------------

type ServiciosGroupKey = "home-garden" | "autos" | "health-beauty" | "more";

type ServicioKey =
  | "handyman"
  | "plumbing"
  | "electrician"
  | "painting"
  | "remodeling"
  | "landscaping"
  | "cleaning"
  | "moving"
  | "hvac"
  | "roofing"
  | "flooring"
  | "appliance"
  | "locksmith"
  | "mechanic"
  | "tires"
  | "smog"
  | "carwash"
  | "bodyshop"
  | "tow"
  | "oilchange"
  | "detail"
  | "glass"
  | "battery"
  | "alignment"
  | "barber"
  | "nails"
  | "massage"
  | "doctor"
  | "dentist"
  | "therapy"
  | "chiropractor"
  | "physicaltherapy"
  | "optometry"
  | "dermatology"
  | "spa"
  | "hair"
  | "pet"
  | "computer"
  | "cell"
  | "legal"
  | "financial"
  | "photography"
  | "tutoring"
  | "accounting"
  | "insurance"
  | "notary"
  | "translation"
  | "childcare"
  | "seniorcare"
  | "drycleaning"
  | "laundry"
  | "tailoring"
  | "realestate"
  | "banking"
  | "gym"
  | "other";

const SERVICIOS_GROUP_LABEL: Record<ServiciosGroupKey, { es: string; en: string }> = {
  "home-garden": { es: "Hogar y Jardín", en: "Home & Garden" },
  autos: { es: "Servicios Automotrices", en: "Auto Services" },
  "health-beauty": { es: "Salud y Bienestar", en: "Health & Wellness" },
  more: { es: "Más servicios", en: "More services" },
};

type ServicioItem = {
  key: ServicioKey;
  label: { es: string; en: string };
  // Keywords used for fuzzy typeahead.
  kw: string[];
};

const SERVICIOS_TAXONOMY: Record<ServiciosGroupKey, ServicioItem[]> = {
  "home-garden": [
    { key: "handyman", label: { es: "Contratistas y handyman", en: "Contractors & Handyman" }, kw: ["handyman", "manitas", "contratista", "contractor", "repair", "arreglo", "fix"] },
    { key: "plumbing", label: { es: "Plomería", en: "Plumbing" }, kw: ["plomero", "plomeria", "plumbing", "tuberia", "drain", "baño", "toilet", "fuga"] },
    { key: "electrician", label: { es: "Electricista", en: "Electrician" }, kw: ["electricista", "electric", "breaker", "panel", "wiring", "luz"] },
    { key: "painting", label: { es: "Pintura", en: "Painters" }, kw: ["pintor", "pintura", "paint", "painter"] },
    { key: "remodeling", label: { es: "Remodelación", en: "Remodeling" }, kw: ["remodel", "tile", "drywall", "cocina", "baño", "kitchen", "bath"] },
    { key: "landscaping", label: { es: "Jardinería", en: "Landscaping" }, kw: ["jardin", "jardineria", "landscap", "lawn", "cesped", "yard"] },
    { key: "cleaning", label: { es: "Limpieza del hogar", en: "Home Cleaning" }, kw: ["limpieza", "cleaning", "deep clean", "maid", "houseclean"] },
    { key: "moving", label: { es: "Mudanzas", en: "Movers" }, kw: ["mudanza", "moving", "movers", "haul", "junk"] },
    { key: "hvac", label: { es: "Calefacción y A/C", en: "Heating & A/C" }, kw: ["hvac", "ac", "a/c", "air conditioning", "calefaccion", "heater"] },
    { key: "roofing", label: { es: "Techos", en: "Roofing" }, kw: ["techo", "roof", "roofing", "shingle"] },
    { key: "flooring", label: { es: "Pisos", en: "Flooring" }, kw: ["piso", "pisos", "floor", "flooring", "laminate", "tile"] },
    { key: "appliance", label: { es: "Reparación de electrodomésticos", en: "Appliance Repair" }, kw: ["appliance", "electrodomestico", "refrigerador", "washer", "dryer"] },
    { key: "locksmith", label: { es: "Cerrajería", en: "Locksmiths" }, kw: ["cerrajero", "locksmith", "keys", "llaves"] },
  ],
  autos: [
    { key: "mechanic", label: { es: "Mecánico", en: "Auto Repair" }, kw: ["mecanico", "mechanic", "auto repair", "brakes", "frenos", "engine"] },
    { key: "bodyshop", label: { es: "Taller de carrocería", en: "Body Shops" }, kw: ["body shop", "carroceria", "paint", "collision", "choque"] },
    { key: "tires", label: { es: "Llantas", en: "Tires" }, kw: ["llantas", "tires", "tire", "alignment", "alineacion", "balance"] },
    { key: "oilchange", label: { es: "Cambio de aceite", en: "Oil Change" }, kw: ["oil", "aceite", "cambio", "lube"] },
    { key: "carwash", label: { es: "Lavado de autos", en: "Car Wash" }, kw: ["car wash", "lavado", "lavado de auto"] },
    { key: "detail", label: { es: "Detallado", en: "Auto Detailing" }, kw: ["detail", "detallado", "detailing", "pulido"] },
    { key: "smog", label: { es: "Smog y emisiones", en: "Smog Check" }, kw: ["smog", "emisiones", "inspection", "inspeccion"] },
    { key: "tow", label: { es: "Grúa", en: "Towing" }, kw: ["tow", "towing", "grua", "grúa", "remolque"] },
    { key: "glass", label: { es: "Vidrios y parabrisas", en: "Auto Glass" }, kw: ["glass", "vidrio", "parabrisas", "windshield"] },
    { key: "battery", label: { es: "Baterías", en: "Batteries" }, kw: ["battery", "bateria", "baterías"] },
    { key: "alignment", label: { es: "Alineación y balanceo", en: "Alignment & Balancing" }, kw: ["alignment", "alineacion", "balance", "balanceo"] },
  ],
  "health-beauty": [
    { key: "chiropractor", label: { es: "Quiroprácticos", en: "Chiropractors" }, kw: ["quiropráctico", "chiropractor", "columna"] },
    { key: "physicaltherapy", label: { es: "Fisioterapia", en: "Physical Therapy" }, kw: ["fisioterapia", "physical therapy", "rehabilitación"] },
    { key: "dentist", label: { es: "Dentistas", en: "Dentists" }, kw: ["dentista", "dentists", "dental"] },
    { key: "doctor", label: { es: "Doctores y clínicas", en: "Doctors & Clinics" }, kw: ["doctor", "doctores", "clinic", "clinica"] },
    { key: "therapy", label: { es: "Terapia", en: "Therapy" }, kw: ["therapy", "terapia", "psychological", "psicólogo"] },
    { key: "optometry", label: { es: "Optometría", en: "Optometry" }, kw: ["optometría", "optometry", "lentes", "gafas", "eyes"] },
    { key: "dermatology", label: { es: "Dermatología", en: "Dermatology" }, kw: ["dermatología", "dermatology", "piel", "skin"] },
    { key: "barber", label: { es: "Barberías", en: "Barbers" }, kw: ["barber", "barberia", "corte", "haircut"] },
    { key: "hair", label: { es: "Salones de cabello", en: "Hair Salons" }, kw: ["salon", "cabello", "hair", "peluquería"] },
    { key: "nails", label: { es: "Uñas", en: "Nail Salons" }, kw: ["unas", "uñas", "nails", "manicure", "pedicure"] },
    { key: "massage", label: { es: "Masajes", en: "Massage" }, kw: ["massage", "masaje"] },
    { key: "spa", label: { es: "Spa", en: "Spa" }, kw: ["spa", "relajación", "relax"] },
  ],
  more: [
    { key: "photography", label: { es: "Fotografía y video", en: "Photography & Video" }, kw: ["fotografía", "photography", "video", "fotos"] },
    { key: "tutoring", label: { es: "Clases particulares", en: "Tutoring" }, kw: ["clases", "tutoring", "particular", "tutor"] },
    { key: "legal", label: { es: "Servicios legales", en: "Legal" }, kw: ["legal", "abogado", "lawyer"] },
    { key: "accounting", label: { es: "Contabilidad e impuestos", en: "Accounting & Taxes" }, kw: ["contabilidad", "accounting", "tax", "impuestos"] },
    { key: "insurance", label: { es: "Seguros", en: "Insurance" }, kw: ["seguro", "insurance"] },
    { key: "notary", label: { es: "Notaría", en: "Notary" }, kw: ["notaría", "notary", "notario"] },
    { key: "translation", label: { es: "Traducciones", en: "Translation" }, kw: ["traducción", "translation", "intérprete"] },
    { key: "childcare", label: { es: "Cuidado de niños", en: "Childcare" }, kw: ["niños", "childcare", "guardería", "niñera"] },
    { key: "seniorcare", label: { es: "Cuidado de adultos mayores", en: "Senior Care" }, kw: ["adultos mayores", "senior", "cuidado", "care"] },
    { key: "pet", label: { es: "Mascotas", en: "Pet Services" }, kw: ["pet", "mascota", "groom", "veterinario"] },
    { key: "drycleaning", label: { es: "Limpieza en seco", en: "Dry Cleaning" }, kw: ["limpieza en seco", "dry cleaning", "tintorería"] },
    { key: "laundry", label: { es: "Lavanderías", en: "Laundromats" }, kw: ["lavandería", "laundry", "lavado"] },
    { key: "tailoring", label: { es: "Sastrería y alteraciones", en: "Tailoring & Alterations" }, kw: ["sastrería", "tailoring", "alteraciones", "costura"] },
    { key: "realestate", label: { es: "Bienes raíces (agentes)", en: "Real Estate" }, kw: ["bienes raíces", "real estate", "agente", "inmobiliaria"] },
    { key: "banking", label: { es: "Bancos y uniones de crédito", en: "Banking & Credit Unions" }, kw: ["banco", "banking", "unión de crédito", "credit union"] },
    { key: "gym", label: { es: "Gimnasios y yoga", en: "Gyms & Yoga" }, kw: ["gimnasio", "gym", "yoga", "fitness"] },
    { key: "computer", label: { es: "Reparación de computadoras", en: "Computer Repair" }, kw: ["computer", "computadora", "pc", "laptop", "repair"] },
    { key: "cell", label: { es: "Celulares y móviles", en: "Cell/Mobile" }, kw: ["cell", "celular", "iphone", "android", "screen", "pantalla"] },
    { key: "financial", label: { es: "Servicios financieros", en: "Financial" }, kw: ["financial", "finanzas", "asesor"] },
    { key: "other", label: { es: "Otros servicios", en: "Other" }, kw: ["other", "otros", "misc"] },
  ],
};

function servicioLabel(k: string, lang: Lang) {
  const key = (k || "").trim().toLowerCase() as ServicioKey;
  for (const grp of Object.keys(SERVICIOS_TAXONOMY) as ServiciosGroupKey[]) {
    const found = SERVICIOS_TAXONOMY[grp].find((x) => x.key === key);
    if (found) return found.label[lang];
  }
  return "";
}

function servicioGroupForKey(k: string): ServiciosGroupKey | null {
  const key = (k || "").trim().toLowerCase() as ServicioKey;
  for (const grp of Object.keys(SERVICIOS_TAXONOMY) as ServiciosGroupKey[]) {
    if (SERVICIOS_TAXONOMY[grp].some((x) => x.key === key)) return grp;
  }
  return null;
}

function scoreServicioSuggestion(queryNorm: string, item: ServicioItem) {
  if (!queryNorm) return -1;
  const label = normalize(`${item.label.es} ${item.label.en}`);
  const kws = item.kw.map((k) => normalize(k));

  if (label.includes(queryNorm)) return 100;
  if (kws.some((k) => k.includes(queryNorm))) return 95;

  // Levenshtein distance against keywords (typo tolerance)
  let best = 0;
  for (const k of [label, ...kws]) {
    const d = levenshtein(queryNorm, k.slice(0, Math.max(queryNorm.length, 12)));
    const s = Math.max(0, 60 - d * 8);
    if (s > best) best = s;
  }
  return best;
}

function getServicioSuggestions(queryRaw: string, lang: Lang) {
  const qn = normalize(queryRaw);
  if (!qn) return [] as Array<{ key: ServicioKey; label: string; group: ServiciosGroupKey }>;

  const all: Array<{ key: ServicioKey; label: string; group: ServiciosGroupKey; score: number }> = [];
  for (const grp of Object.keys(SERVICIOS_TAXONOMY) as ServiciosGroupKey[]) {
    for (const it of SERVICIOS_TAXONOMY[grp]) {
      const sc = scoreServicioSuggestion(qn, it);
      if (sc > 0) all.push({ key: it.key, label: it.label[lang], group: grp, score: sc });
    }
  }

  all.sort((a, b) => b.score - a.score);
  return all.slice(0, 8).map(({ key, label, group }) => ({ key, label, group }));
}

function clampRadiusMi(n: number) {
  if (!Number.isFinite(n)) return DEFAULT_RADIUS_MI;
  const v = Math.max(1, Math.round(n));
  const opts = Array.from(RADIUS_OPTIONS);
  if (opts.includes(v as any)) return v;
  let best = opts[0];
  let bestD = Math.abs(v - best);
  for (const o of opts) {
    const d = Math.abs(v - o);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

type Lang = "es" | "en";

type CategoryKey =
  | "all"
  | "en-venta"
  | "bienes-raices"
  | "rentas"
  | "autos"
  | "servicios"
  | "empleos"
  | "clases"
  | "comunidad"
  | "travel"
  | "restaurantes";

type SortKey = "newest" | "price-asc" | "price-desc";

function normalizeSort(v: string | null | undefined): SortKey {
  const s = (v ?? "").trim();
  if (s === "price_asc" || s === "price-asc") return "price-asc";
  if (s === "price_desc" || s === "price-desc") return "price-desc";
  return "newest";
}

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

  year?: number;
  make?: string;
  model?: string;

  // ✓ Rentas fields (optional; safe with existing sample data)
  rentMonthly?: number;
  beds?: number; // 0=studio, 1=1br (room can map to 1 in data later)
  baths?: number;
  propertyType?: string; // "apartment" | "house" | ...
  petsPolicy?: "any" | "dogs" | "cats" | "none";
  parking?: string; // "garage" | "assigned" | "street" | "none" | ...
  furnished?: boolean;
  utilitiesIncluded?: boolean;
  sqft?: number;
  availableNow?: boolean;
  availableInDays?: number;
  leaseTerm?: string; // "month-to-month" | "6" | "12" | etc.

  // ✓ Contact / close-the-sale fields (optional; safe)
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  businessName?: string;
  handle?: string; // e.g., @dealername
};

const CATEGORY_LABELS: Record<CategoryKey, { es: string; en: string }> = {
  all: { es: "Todos", en: "All" },
  "en-venta": { es: "En Venta", en: "For Sale" },
  "bienes-raices": { es: "Bienes Raíces", en: "Real Estate" },
  rentas: { es: "Rentas", en: "Rentals" },
  autos: { es: "Autos", en: "Autos" },
  servicios: { es: "Servicios", en: "Services" },
  empleos: { es: "Empleos", en: "Jobs" },
  clases: { es: "Clases", en: "Classes" },
  comunidad: { es: "Comunidad", en: "Community" },
  travel: { es: "Viajes", en: "Travel" },
  restaurantes: { es: "Restaurantes", en: "Restaurants" },
};

const CATEGORY_ORDER: CategoryKey[] = [
  "all",
  "en-venta",
  "bienes-raices",
  "rentas",
  "autos",
  "restaurantes",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
  "travel",
];

/** Pills only: real categories, no Todos. */
const CATEGORY_PILL_ORDER: CategoryKey[] = [
  "en-venta",
  "bienes-raices",
  "rentas",
  "autos",
  "restaurantes",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
  "travel",
];

/** Mobile-only: 2-column icon-card grid. "more" opens full category list drawer. */
const MOBILE_CATEGORY_GRID: Array<{
  key: CategoryKey | "more";
  labelEs: string;
  labelEn: string;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "en-venta", labelEs: "En Venta", labelEn: "For Sale", Icon: FiShoppingCart },
  { key: "bienes-raices", labelEs: "Bienes Raíces", labelEn: "Real Estate", Icon: FiLayers },
  { key: "rentas", labelEs: "Rentas", labelEn: "Rentals", Icon: FiHome },
  { key: "autos", labelEs: "Autos", labelEn: "Autos", Icon: FiTruck },
  { key: "restaurantes", labelEs: "Restaurantes", labelEn: "Restaurants", Icon: FiCoffee },
  { key: "servicios", labelEs: "Servicios", labelEn: "Services", Icon: FiTool },
  { key: "empleos", labelEs: "Empleos", labelEn: "Jobs", Icon: FiBriefcase },
  { key: "clases", labelEs: "Clases", labelEn: "Classes", Icon: FiBook },
  { key: "comunidad", labelEs: "Comunidad", labelEn: "Community", Icon: FiUsers },
  { key: "travel", labelEs: "Viajes", labelEn: "Travel", Icon: FiMapPin },
  { key: "more", labelEs: "Más", labelEn: "More", Icon: FiGrid },
];

/** Quick pick tiles for mobile Search Panel (icon + label). "more" opens Más filtros drawer. */
const QUICK_PICKS: Array<{ key: CategoryKey | "more"; icon: string; labelEs: string; labelEn: string }> = [
  { key: "all", icon: "📋", labelEs: "Todos", labelEn: "All" },
  { key: "servicios", icon: "🔧", labelEs: CATEGORY_LABELS.servicios.es, labelEn: CATEGORY_LABELS.servicios.en },
  { key: "rentas", icon: "🏠", labelEs: CATEGORY_LABELS.rentas.es, labelEn: CATEGORY_LABELS.rentas.en },
  { key: "empleos", icon: "💼", labelEs: CATEGORY_LABELS.empleos.es, labelEn: CATEGORY_LABELS.empleos.en },
  { key: "autos", icon: "🚗", labelEs: CATEGORY_LABELS.autos.es, labelEn: CATEGORY_LABELS.autos.en },
  { key: "en-venta", icon: "🛒", labelEs: CATEGORY_LABELS["en-venta"].es, labelEn: CATEGORY_LABELS["en-venta"].en },
  { key: "bienes-raices", icon: "🏢", labelEs: CATEGORY_LABELS["bienes-raices"].es, labelEn: CATEGORY_LABELS["bienes-raices"].en },
  { key: "restaurantes", icon: "🍽️", labelEs: CATEGORY_LABELS.restaurantes.es, labelEn: CATEGORY_LABELS.restaurantes.en },
  { key: "clases", icon: "📚", labelEs: CATEGORY_LABELS.clases.es, labelEn: CATEGORY_LABELS.clases.en },
  { key: "comunidad", icon: "👥", labelEs: CATEGORY_LABELS.comunidad.es, labelEn: CATEGORY_LABELS.comunidad.en },
  { key: "travel", icon: "✈️", labelEs: CATEGORY_LABELS.travel.es, labelEn: CATEGORY_LABELS.travel.en },
  { key: "more", icon: "⋯", labelEs: "Más", labelEn: "More" },
];

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
  clear: { es: "Limpiar", en: "Clear" },
  done: { es: "Listo", en: "Done" },
};

/** Category-native chips for the unified search shell (lower row = current category only). */
const EN_VENTA_CHIPS: Record<Lang, string[]> = {
  es: ["Electrónicos", "Hogar", "Ropa y accesorios", "Bebés y niños", "Herramientas", "Auto partes", "Deportes", "Juguetes y juegos", "Muebles", "Coleccionables", "Música / foto / video", "Otros"],
  en: ["Electronics", "Home", "Clothing & accessories", "Baby & kids", "Tools", "Auto parts", "Sports", "Toys & games", "Furniture", "Collectibles", "Music / photo / video", "Other"],
};
const RENTAS_CHIPS: Record<Lang, string[]> = {
  es: ["Casa", "Departamento", "Cuarto", "Estudio", "Otro"],
  en: ["House", "Apartment", "Room", "Studio", "Other"],
};
const AUTOS_CHIPS: Record<Lang, string[]> = {
  es: ["Carros", "Camionetas", "SUV", "Motos", "Refacciones", "Otro"],
  en: ["Cars", "Trucks", "SUV", "Motorcycles", "Parts", "Other"],
};
const EMPLEOS_CHIPS: Record<Lang, string[]> = {
  es: ["Tiempo completo", "Medio tiempo", "Temporal", "Por contrato", "Otro"],
  en: ["Full-time", "Part-time", "Temporary", "Contract", "Other"],
};
const CLASES_CHIPS: Record<Lang, string[]> = {
  es: ["Idiomas", "Música", "Tutoría", "Arte", "Computación", "Otros"],
  en: ["Languages", "Music", "Tutoring", "Art", "Computing", "Other"],
};
const COMUNIDAD_CHIPS: Record<Lang, string[]> = {
  es: ["Eventos", "Ayuda", "Avisos", "Voluntariado", "Otros"],
  en: ["Events", "Help", "Notices", "Volunteer", "Other"],
};
const TRAVEL_CHIPS: Record<Lang, string[]> = {
  es: ["Paquetes y Ofertas", "Agentes", "Resorts y Hoteles", "Cruceros", "Tours", "Otro"],
  en: ["Packages & Deals", "Agents", "Resorts & Hotels", "Cruises", "Tours", "Other"],
};

function getSearchPlaceholder(category: CategoryKey, lang: Lang) {
  const es = lang === "es";
  switch (category) {
    case "rentas":
      return es ? "Buscar: apartamento, cuarto, zona…" : "Search: apartment, room, area…";
    case "autos":
      return es ? "Buscar: Toyota, 2016, camioneta…" : "Search: Toyota, 2016, truck…";
    case "empleos":
      return es ? "Buscar: trabajo, empresa, jornada…" : "Search: job, company, shift…";
    case "servicios":
      return es ? "Buscar: plomero, jardinería, limpieza…" : "Search: plumber, landscaping, cleaning…";
    case "en-venta":
      return es ? "Buscar: sofá, celular, herramientas…" : "Search: sofa, phone, tools…";
    case "restaurantes":
      return es ? "Buscar: tacos, pupusas, mariscos…" : "Search: tacos, pupusas, seafood…";
    case "travel":
      return es ? "Buscar: vuelos, hotel, agente…" : "Search: flights, hotel, agent…";
    case "bienes-raices":
      return es ? "Zona, colonia o palabra clave…" : "Area, neighborhood or keyword…";
    case "clases":
      return es ? "Buscar: inglés, guitarra, tutoría…" : "Search: English, guitar, tutoring…";
    case "comunidad":
      return es ? "Buscar: evento, ayuda, anuncio…" : "Search: event, help, notice…";
    case "all":
    default:
      return es ? "Buscar en clasificados…" : "Search classifieds…";
  }
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalize(s: string) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function levenshtein(a: string, b: string) {
  const s = a;
  const t = b;
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

function parsePriceLabel(label: string) {
  const m = (label || "").replace(/,/g, "").match(/(\d+(\.\d+)?)/);
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

function getCityLatLng(cityName: string): LatLng | null {
  const want = normalize(cityName);
  const hit = CA_CITIES.find((c) => normalize(c.city) === want);
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lng) };
}

function canonicalizeCity(input: string) {
  const n = normalize(input);
  if (!n) return DEFAULT_CITY;
  const alias = (CITY_ALIASES as Record<string, string>)[n];
  return alias ?? input;
}

function isCategoryKey(v: string): v is CategoryKey {
  return (
    v === "all" ||
    v === "en-venta" ||
    v === "bienes-raices" ||
    v === "rentas" ||
    v === "autos" ||
    v === "servicios" ||
    v === "empleos" ||
    v === "clases" ||
    v === "comunidad" ||
    v === "travel" ||
    v === "restaurantes"
  );
}

function setUrlParams(next: Record<string, string | null | undefined>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const sp = url.searchParams;

  Object.entries(next).forEach(([k, v]) => {
    if (v === null || v === undefined || String(v).trim() === "") sp.delete(k);
    else sp.set(k, String(v));
  });

  const qs = sp.toString();
  const final = qs ? `${url.pathname}?${qs}` : url.pathname;
  window.history.replaceState({}, "", final);
}


/** ✓ Autos param helpers (internal only; no exports) */
type AutosParams = {
  aymin: string;
  aymax: string;
  amake: string;
  amodel: string;
  amilesmax: string;
  acond: string; // "new" | "used" | ""
  aseller: string; // "personal" | "business" | ""
};

const EMPTY_AUTOS_PARAMS: AutosParams = {
  aymin: "",
  aymax: "",
  amake: "",
  amodel: "",
  amilesmax: "",
  acond: "",
  aseller: "",
};

function applyAutosParams(list: Listing[], ap: AutosParams): Listing[] {
  const yMin = ap.aymin ? parseNumLoose(ap.aymin) : null;
  const yMax = ap.aymax ? parseNumLoose(ap.aymax) : null;
  const milesMax = ap.amilesmax ? parseNumLoose(ap.amilesmax) : null;
  const makeQ = (ap.amake || "").trim().toLowerCase();
  const modelQ = (ap.amodel || "").trim().toLowerCase();
  const cond = (ap.acond || "").trim().toLowerCase();

  return list.filter((x) => {
    if (yMin !== null && typeof x.year === "number" && x.year < yMin) return false;
    if (yMax !== null && typeof x.year === "number" && x.year > yMax) return false;

    if (makeQ) {
      const mk = (x.make || "").toLowerCase();
      if (!mk.includes(makeQ)) return false;
    }

    if (modelQ) {
      const md = (x.model || "").toLowerCase();
      if (!md.includes(modelQ)) return false;
    }

    if (milesMax !== null && typeof (x as any).mileage === "number") {
      const m = (x as any).mileage as number;
      if (Number.isFinite(m) && m > milesMax) return false;
    }

    if (cond && typeof (x as any).condition === "string") {
      const c = String((x as any).condition).toLowerCase();
      if (cond === "new" && c !== "new") return false;
      if (cond === "used" && c !== "used") return false;
    }

    // Seller type (personal/business) when available
    const seller = (ap.aseller || "").trim().toLowerCase();
    if (seller) {
      const st = typeof (x as any).sellerType === "string" ? String((x as any).sellerType).toLowerCase() : "";
      if (!st || st !== seller) return false;
    }

    return true;
  });
}

/** ✓ Rentas param helpers (internal only; no exports) */
type RentasParams = {
  rpmin: string;
  rpmax: string;
  rbeds: string;
  rbaths: string;
  rtype: string;
  rpets: string;
  rparking: string;
  rfurnished: string;
  rutilities: string;
  ravailable: string;
  rsqmin: string;
  rsqmax: string;
  rleaseterm: string;
  rseller: string; // "personal" | "business" | ""
};

const EMPTY_RENTAS_PARAMS: RentasParams = {
  rpmin: "",
  rpmax: "",
  rbeds: "",
  rbaths: "",
  rtype: "",
  rpets: "",
  rparking: "",
  rfurnished: "",
  rutilities: "",
  ravailable: "",
  rsqmin: "",
  rsqmax: "",
  rleaseterm: "",
  rseller: "",
};

function parseNumLoose(s: string): number | null {
  const cleaned = (s || "").replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function getRentasPriceValue(x: Listing): number | null {
  if (typeof x.rentMonthly === "number" && Number.isFinite(x.rentMonthly)) return x.rentMonthly;
  const lbl = x.priceLabel?.es ?? x.priceLabel?.en ?? "";
  if (/gratis|free/i.test(lbl)) return 0;
  return parseNumLoose(lbl);
}

function applyRentasParams(list: Listing[], rp: RentasParams): Listing[] {
  const min = rp.rpmin ? parseNumLoose(rp.rpmin) : null;
  const max = rp.rpmax ? parseNumLoose(rp.rpmax) : null;
  const sqMin = rp.rsqmin ? parseNumLoose(rp.rsqmin) : null;
  const sqMax = rp.rsqmax ? parseNumLoose(rp.rsqmax) : null;

  return list.filter((x) => {
    const rent = getRentasPriceValue(x);
    if (min !== null && rent !== null && rent < min) return false;
    if (max !== null && rent !== null && rent > max) return false;

    if (rp.rbeds) {
      if (typeof x.beds === "number") {
        if (rp.rbeds === "studio" && x.beds !== 0) return false;
        else if (rp.rbeds === "room" && x.beds !== 1) return false;
        else if (rp.rbeds === "4+" && x.beds < 4) return false;
        else if (!["studio", "room", "4+"].includes(rp.rbeds)) {
          const n = Number(rp.rbeds);
          if (Number.isFinite(n) && x.beds !== n) return false;
        }
      }
    }

    if (rp.rbaths) {
      if (typeof x.baths === "number") {
        if (rp.rbaths === "4+" && x.baths < 4) return false;
        else {
          const n = Number(rp.rbaths);
          if (Number.isFinite(n) && x.baths < n) return false;
        }
      }
    }

    if (rp.rtype) {
      if (x.propertyType && x.propertyType !== rp.rtype) return false;
    }

    if (rp.rpets) {
      if (x.petsPolicy) {
        if (rp.rpets === "none" && x.petsPolicy !== "none") return false;
        if (rp.rpets === "dogs" && x.petsPolicy !== "dogs" && x.petsPolicy !== "any") return false;
        if (rp.rpets === "cats" && x.petsPolicy !== "cats" && x.petsPolicy !== "any") return false;
      }
    }

    if (rp.rparking) {
      if (x.parking && x.parking !== rp.rparking) return false;
    }

    if (rp.rfurnished) {
      if (typeof x.furnished === "boolean") {
        if (rp.rfurnished === "yes" && x.furnished !== true) return false;
        if (rp.rfurnished === "no" && x.furnished !== false) return false;
      }
    }

    if (rp.rutilities) {
      if (typeof x.utilitiesIncluded === "boolean") {
        if (rp.rutilities === "included" && x.utilitiesIncluded !== true) return false;
      }
    }

    if (rp.ravailable) {
      if (rp.ravailable === "now") {
        if (typeof x.availableNow === "boolean" && x.availableNow !== true) return false;
      }
      if (rp.ravailable === "30") {
        if (typeof x.availableInDays === "number" && x.availableInDays > 30) return false;
      }
    }

    if (sqMin !== null || sqMax !== null) {
      if (typeof x.sqft === "number") {
        if (sqMin !== null && x.sqft < sqMin) return false;
        if (sqMax !== null && x.sqft > sqMax) return false;
      }
    }

    if (rp.rleaseterm) {
      if (x.leaseTerm && x.leaseTerm !== rp.rleaseterm) return false;
    }

    // Posted by (personal/business) when available
    const seller = (rp.rseller || "").trim().toLowerCase();
    if (seller) {
      const st = typeof (x as any).sellerType === "string" ? String((x as any).sellerType).toLowerCase() : "";
      if (!st || st !== seller) return false;
    }

    return true;
  });
}

/** Bienes Raíces filter params (subcategoría, price, beds, baths). Seller type is global (sellerType). */
type BienesRaicesParams = {
  subcategoria: string;
  priceMin: string;
  priceMax: string;
  beds: string;   // "" | "studio" | "1" | "2" | "3" | "4+"
  baths: string; // "" | "1" | "2" | "3" | "4+"
};

const EMPTY_BIENES_RAICES_PARAMS: BienesRaicesParams = {
  subcategoria: "",
  priceMin: "",
  priceMax: "",
  beds: "",
  baths: "",
};

function applyBienesRaicesParams(list: Listing[], p: BienesRaicesParams): Listing[] {
  const subcatKey = (p.subcategoria ?? "").trim();
  const pmin = (p.priceMin ?? "").trim() ? parseNumLoose(p.priceMin) : null;
  const pmax = (p.priceMax ?? "").trim() ? parseNumLoose(p.priceMax) : null;
  const bedsKey = (p.beds ?? "").trim();
  const bathsKey = (p.baths ?? "").trim();

  return list.filter((it) => {
    if (subcatKey) {
      const pairs = (it as any).detailPairs as Array<{ label: string; value: string }> | undefined;
      const tipoPair = Array.isArray(pairs) ? pairs.find((pr) => /tipo\s*de\s*propiedad|property\s*type/i.test(pr.label)) : undefined;
      const value = (tipoPair?.value ?? "").trim();
      const valueNorm = value.toLowerCase().replace(/\s+/g, " ");
      const labelEs = getBienesRaicesSubcategoryLabel(subcatKey, "es").toLowerCase().replace(/\s+/g, " ");
      const labelEn = getBienesRaicesSubcategoryLabel(subcatKey, "en").toLowerCase().replace(/\s+/g, " ");
      const keyNorm = subcatKey.toLowerCase().replace(/-/g, " ");
      if (!valueNorm || (valueNorm !== labelEs && valueNorm !== labelEn && !valueNorm.includes(keyNorm))) return false;
    }
    const price = parsePriceLabel((it as any).priceLabel?.en ?? (it as any).priceLabel?.es ?? "") ?? null;
    if (pmin != null && price != null && price < pmin) return false;
    if (pmax != null && price != null && price > pmax) return false;
    if (bedsKey && typeof (it as any).beds === "number") {
      const b = (it as any).beds as number;
      if (bedsKey === "studio" && b !== 0) return false;
      if (bedsKey === "4+" && b < 4) return false;
      if (!["studio", "4+"].includes(bedsKey)) {
        const n = Number(bedsKey);
        if (Number.isFinite(n) && b !== n) return false;
      }
    }
    if (bathsKey && typeof (it as any).baths === "number") {
      const b = (it as any).baths as number;
      if (bathsKey === "4+" && b < 4) return false;
      const n = Number(bathsKey);
      if (Number.isFinite(n) && b < n) return false;
    }
    return true;
  });
}

export default function ListaPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const lang: Lang = (params?.get("lang") as Lang) === "en" ? "en" : "es";

  const [q, setQ] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY);
  const [zip, setZip] = useState("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS_MI);

  const [category, setCategory] = useState<CategoryKey>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("grid");

  const [sellerType, setSellerType] = useState<SellerType | null>(null);
  const [onlyWithImage, setOnlyWithImage] = useState(false);

  // Favorites (works logged out via localStorage)
  const FAV_KEY = "leonix:favorites:v1";
  const [favIds, setFavIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as string[];
      if (Array.isArray(arr)) setFavIds(new Set(arr));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(favIds)));
    } catch {}
  }, [favIds]);

  const toggleFav = (id: string) => {
    setFavIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [page, setPage] = useState(1);
  const perPage = 20;
  const [infiniteScrollLimit, setInfiniteScrollLimit] = useState(20);
  const isEnVenta = category === "en-venta";

  const [compact, setCompact] = useState(true);
  const [isMobileUI, setIsMobileUI] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const [categoryFiltersOpen, setCategoryFiltersOpen] = useState(false);
  const [saveSearchLoading, setSaveSearchLoading] = useState(false);
  const [saveSearchDone, setSaveSearchDone] = useState(false);

// Category switching polish (A4.19)

/** ✓ Empleos param helpers (internal only; no exports) */
type EmpleosParams = {
  ejob: string;      // "full" | "part" | "contract" | "temp" | ""
  eremote: string;   // "remote" | "onsite" | ""
  epaymin: string;   // number string
  epaymax: string;   // number string
  eindustry: string; // industry key or ""
};

const EMPTY_EMPLEOS_PARAMS: EmpleosParams = {
  ejob: "",
  eremote: "",
  epaymin: "",
  epaymax: "",
  eindustry: "",
};

type EmpleoIndustry =
  | "construction"
  | "restaurant"
  | "cleaning"
  | "office"
  | "medical"
  | "driving"
  | "sales"
  | "warehouse"
  | "childcare"
  | "other";

const empleoIndustryLabel = (k: EmpleoIndustry, lang: Lang) => {
  const es: Record<EmpleoIndustry, string> = {
    construction: "Construcción",
    restaurant: "Restaurante",
    cleaning: "Limpieza",
    office: "Oficina",
    medical: "Salud",
    driving: "Manejo / Delivery",
    sales: "Ventas",
    warehouse: "Bodega",
    childcare: "Cuidado de niños",
    other: "Otro",
  };
  const en: Record<EmpleoIndustry, string> = {
    construction: "Construction",
    restaurant: "Restaurant",
    cleaning: "Cleaning",
    office: "Office",
    medical: "Medical",
    driving: "Driving / Delivery",
    sales: "Sales",
    warehouse: "Warehouse",
    childcare: "Childcare",
    other: "Other",
  };
  return lang === "es" ? es[k] : en[k];
};

const inferEmpleoIndustry = (title: string, blurb: string) => {
  const t = `${title} ${blurb}`.toLowerCase();

  if (/(construction|construcci[oó]n|framing|roof|roofer|concrete|drywall|painter|pintor|remodel)/i.test(t)) return "construction" as const;
  if (/(restaurant|restaurante|cocina|cook|cocinero|dishwasher|meser|mesero|server|bartender|barista|taquer|food)/i.test(t)) return "restaurant" as const;
  if (/(cleaning|limpieza|housekeeper|janitor|maid)/i.test(t)) return "cleaning" as const;
  if (/(office|oficina|admin|administrativ|reception|recepcion|assistant|asistente|clerical|data entry)/i.test(t)) return "office" as const;
  if (/(medical|clinic|clinica|hospital|caregiver|cuid[aá]dor|nurse|enfermer)/i.test(t)) return "medical" as const;
  if (/(driver|driving|delivery|uber|lyft|doordash|instacart|truck|trucking|camion|chofer|ch[oó]fer)/i.test(t)) return "driving" as const;
  if (/(sales|ventas|sell|vendedor|vendedora|closer|retail|store)/i.test(t)) return "sales" as const;
  if (/(warehouse|bodega|forklift|montacargas|picker|packer|fulfillment)/i.test(t)) return "warehouse" as const;
  if (/(childcare|ni[nñ]os|daycare|guarder[ií]a|babysit|nanny)/i.test(t)) return "childcare" as const;

  return "other" as const;
};

const parsePayNumberLoose = (salaryLabel: string | null, fallbackPrice: string) => {
  const src = `${salaryLabel || ""} ${fallbackPrice || ""}`;
  const m = src.match(/\$\s?(\d+(?:[\.,]\d+)?)/);
  if (!m) return null;
  const num = Number(String(m[1]).replace(",", ""));
  return Number.isFinite(num) ? num : null;
};

function applyEmpleosParams(list: Listing[], ep: EmpleosParams): Listing[] {
  const payMin = ep.epaymin ? parseNumLoose(ep.epaymin) : null;
  const payMax = ep.epaymax ? parseNumLoose(ep.epaymax) : null;
  const job = (ep.ejob || "").trim().toLowerCase();
  const remote = (ep.eremote || "").trim().toLowerCase();
  const industry = (ep.eindustry || "").trim().toLowerCase();

  return list.filter((x) => {
    if (x.category !== "empleos") return true;

    const title = x.title.es || x.title.en || "";
    const blurb = x.blurb.es || x.blurb.en || "";
    const payLabel = x.priceLabel.es || x.priceLabel.en || "";

    const parsed = parseEmpleoFromText(title, blurb, payLabel);
    const inferredIndustry = inferEmpleoIndustry(title, blurb);

    if (job) {
      const jt = (parsed.jobType || "").toLowerCase();
      if (jt !== job) return false;
    }

    if (remote) {
      if (remote === "remote" && !parsed.isRemote) return false;
      if (remote === "onsite" && parsed.isRemote) return false;
    }

    if (industry) {
      if (String(inferredIndustry) !== industry) return false;
    }

    if (payMin !== null || payMax !== null) {
      const pn = parsePayNumberLoose(parsed.salaryLabel, payLabel);
      if (pn === null) return false;
      if (payMin !== null && pn < payMin) return false;
      if (payMax !== null && pn > payMax) return false;
    }

    return true;
  });
}

/** ✓ Servicios param helpers (internal only; no exports) */
type ServiciosParams = {
  stype: string;   // service type key or ""
  savail: string;  // availability key or ""
  svisit: string;  // "comes" | "shop" | ""
  sfeat: string;   // comma-separated feature keys for deep filters
};

const EMPTY_SERVICIOS_PARAMS: ServiciosParams = {
  stype: "",
  savail: "",
  svisit: "",
  sfeat: "",
};


/** ✓ En Venta param helpers (internal only; no exports) */
type VentaParams = {
  vpmin: string;   // number string
  vpmax: string;   // number string
  vcond: string;   // condition key or ""
  vtype: string;   // item type key or ""
  vneg: string;    // "yes" | ""
  vpostedToday: boolean;
};

const EMPTY_VENTA_PARAMS: VentaParams = {
  vpmin: "",
  vpmax: "",
  vcond: "",
  vtype: "",
  vneg: "",
  vpostedToday: false,
};

type VentaCondition = "new" | "like-new" | "good" | "fair";
type VentaItemType =
  | "phone"
  | "computer"
  | "electronics"
  | "furniture"
  | "appliances"
  | "tools"
  | "baby-kids"
  | "clothing"
  | "sports"
  | "auto-parts"
  | "other";

const ventaConditionLabel = (k: VentaCondition, lang: Lang) => {
  const es: Record<VentaCondition, string> = {
    new: "Nuevo",
    "like-new": "Como nuevo",
    good: "Bueno",
    fair: "Regular",
  };
  const en: Record<VentaCondition, string> = {
    new: "New",
    "like-new": "Like new",
    good: "Good",
    fair: "Fair",
  };
  return lang === "es" ? es[k] : en[k];
};

const ventaItemTypeLabel = (k: VentaItemType, lang: Lang) => {
  const es: Record<VentaItemType, string> = {
    phone: "Teléfono",
    computer: "Computadora",
    electronics: "Electrónica",
    furniture: "Muebles",
    appliances: "Electrodomésticos",
    tools: "Herramientas",
    "baby-kids": "Bebés / Niños",
    clothing: "Ropa",
    sports: "Deportes",
    "auto-parts": "Partes de auto",
    other: "Otro",
  };
  const en: Record<VentaItemType, string> = {
    phone: "Phone",
    computer: "Computer",
    electronics: "Electronics",
    furniture: "Furniture",
    appliances: "Appliances",
    tools: "Tools",
    "baby-kids": "Baby / Kids",
    clothing: "Clothing",
    sports: "Sports",
    "auto-parts": "Auto parts",
    other: "Other",
  };
  return lang === "es" ? es[k] : en[k];
};

const inferVentaType = (title: string, blurb: string): VentaItemType => {
  const t = `${title} ${blurb}`.toLowerCase();

  if (/(iphone|android|galaxy|pixel|telefono|tel[eé]fono|celular|cell phone)/i.test(t)) return "phone";
  if (/(laptop|macbook|pc|computer|computadora|desktop|monitor|tablet|ipad)/i.test(t)) return "computer";
  if (/(tv|televisi[oó]n|camera|c[aá]mara|headphones|aud[ií]fonos|speaker|bocina|gaming|console|playstation|xbox|nintendo)/i.test(t)) return "electronics";
  if (/(sofa|couch|bed|mattress|colch[oó]n|dresser|mesa|table|chair|silla|mueble)/i.test(t)) return "furniture";
  if (/(refrigerator|fridge|refri|refrigerador|washer|dryer|lavadora|secadora|microwave|microondas|stove|estufa|oven|horno)/i.test(t)) return "appliances";
  if (/(tools?|herramientas?|drill|taladro|saw|sierra|wrench|llave|compressor|compresor)/i.test(t)) return "tools";
  if (/(baby|bebe|beb[eé]|stroller|car seat|cuna|crib|kids|ni[nñ]os?|toys?|juguetes?)/i.test(t)) return "baby-kids";
  if (/(clothes|ropa|shoes|zapatos?|jack(et)?|chaqueta|pants|pantalones|dress|vestido)/i.test(t)) return "clothing";
  if (/(bike|bici|bicycle|gym|pesas|soccer|f[uú]tbol|ball|pelota|skate|surf)/i.test(t)) return "sports";
  if (/(auto parts|partes|llantas?|tires?|rims?|rin(es)?|battery|bater[ií]a|brakes?|frenos?)/i.test(t)) return "auto-parts";

  return "other";
};

const inferVentaCondition = (title: string, blurb: string, explicit?: string): VentaCondition | null => {
  const raw = `${explicit ?? ""}`.toLowerCase().trim();
  if (raw === "new" || raw === "nuevo") return "new";
  if (raw === "like-new" || raw === "comonuevo" || raw === "como nuevo") return "like-new";
  if (raw === "good" || raw === "bueno") return "good";
  if (raw === "fair" || raw === "regular") return "fair";

  const t = `${title} ${blurb}`.toLowerCase();
  if (/(brand new|nuevo|sin usar|unopened|sellado)/i.test(t)) return "new";
  if (/(like new|como nuevo|casi nuevo|mint)/i.test(t)) return "like-new";
  if (/(good condition|buena condici[oó]n|excellent|excelente|great)/i.test(t)) return "good";
  if (/(fair|regular|needs work|para reparar|as[- ]?is)/i.test(t)) return "fair";
  return null;
};

/** ✓ Clases param helpers (internal only; no exports) */
type ClasesParams = {
  csub: string;    // subject key or ""
  clevel: string;  // level key or ""
  cmode: string;   // mode key or ""
};

const EMPTY_CLASES_PARAMS: ClasesParams = {
  csub: "",
  clevel: "",
  cmode: "",
};

type ClaseSubject = "music" | "tutoring" | "sports" | "dance" | "martial" | "coding" | "english" | "math" | "other";
type ClaseLevel = "kids" | "teen" | "adult" | "beginner" | "intermediate" | "advanced";
type ClaseMode = "inperson" | "online" | "hybrid";

const claseSubjectLabel = (k: ClaseSubject, lang: Lang) => {
  const es: Record<ClaseSubject, string> = {
    music: "Música",
    tutoring: "Tutoría",
    sports: "Deportes",
    dance: "Baile",
    martial: "Artes marciales",
    coding: "Programación",
    english: "Inglés",
    math: "Matemáticas",
    other: "Otro",
  };
  const en: Record<ClaseSubject, string> = {
    music: "Music",
    tutoring: "Tutoring",
    sports: "Sports",
    dance: "Dance",
    martial: "Martial arts",
    coding: "Coding",
    english: "English",
    math: "Math",
    other: "Other",
  };
  return lang === "es" ? es[k] : en[k];
};

const claseLevelLabel = (k: ClaseLevel, lang: Lang) => {
  const es: Record<ClaseLevel, string> = {
    kids: "Niños",
    teen: "Jóvenes",
    adult: "Adultos",
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  };
  const en: Record<ClaseLevel, string> = {
    kids: "Kids",
    teen: "Teens",
    adult: "Adults",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  };
  return lang === "es" ? es[k] : en[k];
};

const claseModeLabel = (k: ClaseMode, lang: Lang) => {
  const es: Record<ClaseMode, string> = {
    inperson: "En persona",
    online: "Online",
    hybrid: "Híbrido",
  };
  const en: Record<ClaseMode, string> = {
    inperson: "In-person",
    online: "Online",
    hybrid: "Hybrid",
  };
  return lang === "es" ? es[k] : en[k];
};

const inferClaseSubject = (title: string, blurb: string): ClaseSubject => {
  const t = `${title} ${blurb}`.toLowerCase();
  if (/(guitarra|guitar|piano|violin|viol[ií]n|drums|bater[ií]a|music|m[uú]sica|canto|singing)/i.test(t)) return "music";
  if (/(tutor|tutor[ií]a|tutoring|clases particulares|homework|tarea)/i.test(t)) return "tutoring";
  if (/(soccer|f[uú]tbol|basket|baseball|tennis|gym|fitness|pesas|training)/i.test(t)) return "sports";
  if (/(dance|baile|ballet|salsa|hip hop|folkl[oó]rico)/i.test(t)) return "dance";
  if (/(karate|boxing|boxeo|mma|jiu[- ]?jitsu|taekwondo|martial)/i.test(t)) return "martial";
  if (/(coding|programaci[oó]n|programming|python|javascript|web dev|desarrollo web)/i.test(t)) return "coding";
  if (/(english|ingl[eé]s|esl)/i.test(t)) return "english";
  if (/(math|matem[aá]ticas|algebra|c[aá]lculo|geometry|geometr[ií]a)/i.test(t)) return "math";
  return "other";
};

const inferClaseMode = (title: string, blurb: string): ClaseMode | null => {
  const t = `${title} ${blurb}`.toLowerCase();
  const hasOnline = /(online|zoom|virtual|remoto)/i.test(t);
  const hasInPerson = /(en persona|in-person|presencial|local|in studio|studio)/i.test(t);
  if (hasOnline && hasInPerson) return "hybrid";
  if (hasOnline) return "online";
  if (hasInPerson) return "inperson";
  return null;
};

const inferClaseLevel = (title: string, blurb: string): ClaseLevel | null => {
  const t = `${title} ${blurb}`.toLowerCase();
  if (/(kids|ni[nñ]os|infantil)/i.test(t)) return "kids";
  if (/(teen|j[oó]venes|adolesc)/i.test(t)) return "teen";
  if (/(adult|adultos)/i.test(t)) return "adult";
  if (/(beginner|principiante)/i.test(t)) return "beginner";
  if (/(intermediate|intermedio)/i.test(t)) return "intermediate";
  if (/(advanced|avanzado)/i.test(t)) return "advanced";
  return null;
};

/** ✓ Comunidad param helpers (internal only; no exports) */
type ComunidadParams = {
  gtype: string; // community type key or ""
};

const EMPTY_COMUNIDAD_PARAMS: ComunidadParams = {
  gtype: "",
};

type TravelParams = {
  ttype: string;   // travel type key or ""
  tbmin: string;   // budget min (number string) or ""
  tbmax: string;   // budget max (number string) or ""
};

const EMPTY_TRAVEL_PARAMS: TravelParams = {
  ttype: "",
  tbmin: "",
  tbmax: "",
};

type TravelType = "package" | "cruise" | "hotel" | "flight" | "tour" | "other";

const travelTypeLabel = (k: TravelType, lang: Lang) => {
  const es: Record<TravelType, string> = {
    package: "Paquete",
    cruise: "Crucero",
    hotel: "Hotel / Resort",
    flight: "Vuelo",
    tour: "Tour",
    other: "Otro",
  };
  const en: Record<TravelType, string> = {
    package: "Package",
    cruise: "Cruise",
    hotel: "Hotel / Resort",
    flight: "Flight",
    tour: "Tour",
    other: "Other",
  };
  return (lang === "es" ? es : en)[k];
};

type ComunidadType = "donation" | "help" | "church" | "youth" | "lostfound" | "announcement" | "event" | "other";

const comunidadTypeLabel = (k: ComunidadType, lang: Lang) => {
  const es: Record<ComunidadType, string> = {
    donation: "Donación",
    help: "Ayuda / Recursos",
    church: "Iglesia",
    youth: "Jóvenes",
    lostfound: "Perdido y encontrado",
    announcement: "Anuncio",
    event: "Evento",
    other: "Otro",
  };
  const en: Record<ComunidadType, string> = {
    donation: "Donation",
    help: "Help / Resources",
    church: "Church",
    youth: "Youth",
    lostfound: "Lost & found",
    announcement: "Announcement",
    event: "Event",
    other: "Other",
  };
  return lang === "es" ? es[k] : en[k];
};

const inferComunidadType = (title: string, blurb: string): ComunidadType => {
  const t = `${title} ${blurb}`.toLowerCase();

  if (/(donat|donaci[oó]n|gratis|free|regalo)/i.test(t)) return "donation";
  if (/(resource|recursos|ayuda|support|apoyo|food bank|banco de comida|clinic|cl[ií]nica)/i.test(t)) return "help";
  if (/(church|iglesia|misa|culto|worship|oraci[oó]n)/i.test(t)) return "church";
  if (/(youth|j[oó]venes|teen|adolesc)/i.test(t)) return "youth";
  if (/(lost|found|perdid|encontr|missing)/i.test(t)) return "lostfound";
  if (/(announce|anuncio|notice|aviso)/i.test(t)) return "announcement";
  if (/(event|evento|festival|feria|meetup|reuni[oó]n)/i.test(t)) return "event";

  return "other";
};

type ServicioType =
  | "cleaning"
  | "landscaping"
  | "mechanic"
  | "plumbing"
  | "electrician"
  | "painting"
  | "remodeling"
  | "moving"
  | "handyman"
  | "other";

const servicioTypeLabel = (k: ServicioType, lang: Lang) => {
  const es: Record<ServicioType, string> = {
    cleaning: "Limpieza",
    landscaping: "Jardinería",
    mechanic: "Mecánico",
    plumbing: "Plomero",
    electrician: "Electricista",
    painting: "Pintura",
    remodeling: "Remodelación",
    moving: "Mudanza",
    handyman: "Handyman",
    other: "Otro",
  };
  const en: Record<ServicioType, string> = {
    cleaning: "Cleaning",
    landscaping: "Landscaping",
    mechanic: "Mechanic",
    plumbing: "Plumber",
    electrician: "Electrician",
    painting: "Painting",
    remodeling: "Remodeling",
    moving: "Moving",
    handyman: "Handyman",
    other: "Other",
  };
  return lang === "es" ? es[k] : en[k];
};

type ServicioAvail = "anytime" | "weekends" | "evenings" | "appointment";

const servicioAvailLabel = (k: ServicioAvail, lang: Lang) => {
  const es: Record<ServicioAvail, string> = {
    anytime: "24/7 / Urgente",
    weekends: "Fines de semana",
    evenings: "Tardes / Noches",
    appointment: "Con cita",
  };
  const en: Record<ServicioAvail, string> = {
    anytime: "24/7 / Urgent",
    weekends: "Weekends",
    evenings: "Evenings",
    appointment: "By appointment",
  };
  return lang === "es" ? es[k] : en[k];
};

const inferServicioType = (title: string, blurb: string, explicit?: string) => {
  const base = (explicit || "").toLowerCase();
  const t = `${title} ${blurb}`.toLowerCase();

  const src = `${base} ${t}`;
  if (/(hvac|a\/c|ac repair|air conditioning|calefacci[oó]n|heater)/i.test(src)) return "hvac" as const;
  if (/(roof|roofing|techo|shingle)/i.test(src)) return "roofing" as const;
  if (/(floor|flooring|pisos?|laminate|tile)/i.test(src)) return "flooring" as const;
  if (/(appliance|electrodom[eé]stic|refrigerador|washer|dryer|lavadora|secadora)/i.test(src)) return "appliance" as const;
  if (/(locksmith|cerrajer|llaves|key fob)/i.test(src)) return "locksmith" as const;
  if (/(tire|tires|llantas|alineaci[oó]n|alignment|balanceo)/i.test(src)) return "tires" as const;
  if (/(smog|emisiones|emission)/i.test(src)) return "smog" as const;
  if (/(car wash|lavado de auto|lavado|detailing|detail)/i.test(src)) return "carwash" as const;
  if (/(body shop|carrocer[ií]a|collision|choque)/i.test(src)) return "bodyshop" as const;
  if (/(tow|towing|gr[uú]a|remolque)/i.test(src)) return "tow" as const;
  if (/(barber|barber[ií]a|haircut|corte de pelo)/i.test(src)) return "barber" as const;
  if (/(nails|u[nñ]as|manicure|pedicure)/i.test(src)) return "nails" as const;
  if (/(massage|masaje|spa)/i.test(src)) return "massage" as const;
  if (/(dentist|dentista|dental)/i.test(src)) return "dentist" as const;
  if (/(doctor|clinic|cl[ií]nica)/i.test(src)) return "doctor" as const;
  if (/(therapy|terapia|fisioterapia|physical therapy)/i.test(src)) return "therapy" as const;
  if (/(computer|computadora|pc|laptop)/i.test(src)) return "computer" as const;
  if (/(cell|celular|iphone|android|pantalla|screen repair)/i.test(src)) return "cell" as const;
  if (/(legal|abogado|lawyer|notar)/i.test(src)) return "legal" as const;
  if (/(tax|impuestos|insurance|seguro|financial|finanzas)/i.test(src)) return "financial" as const;
  if (/(pet|mascota|groom|veterin)/i.test(src)) return "pet" as const;
  if (/(cleaning|limpieza|houseclean|deep clean|maid|janitor)/i.test(src)) return "cleaning" as const;
  if (/(landscap|jardin|yard|lawn|cesped|césped)/i.test(src)) return "landscaping" as const;
  if (/(mechanic|mec[aá]nic|auto repair|brakes|oil change|tire)/i.test(src)) return "mechanic" as const;
  if (/(plumb|plomer|drain|toilet|sink|tuber[ií]a)/i.test(src)) return "plumbing" as const;
  if (/(electric|electricista|wiring|panel|breaker)/i.test(src)) return "electrician" as const;
  if (/(paint|pintur|painter|pintor)/i.test(src)) return "painting" as const;
  if (/(remodel|remodelaci[oó]n|kitchen|bath|tile|drywall)/i.test(src)) return "remodeling" as const;
  if (/(moving|mudanza|movers|haul|junk)/i.test(src)) return "moving" as const;
  if (/(handyman|manitas|fix|repair|arreglo)/i.test(src)) return "handyman" as const;

  return "other" as const;
};

const inferServicioAvail = (title: string, blurb: string) => {
  const t = `${title} ${blurb}`.toLowerCase();

  if (/(24\/7|emergency|urgente|same day|mismo d[ií]a|hoy mismo)/i.test(t)) return "anytime" as const;
  if (/(weekend|fines de semana|s[aá]bado|domingo)/i.test(t)) return "weekends" as const;
  if (/(evening|noche|tarde|after 5|despu[eé]s de las 5)/i.test(t)) return "evenings" as const;

  return "appointment" as const;
};


const inferServicioVisit = (title: string, blurb: string) => {
  const t = `${title} ${blurb}`.toLowerCase();

  if (/(a domicilio|domicilio|house call|we come|mobile|m[oó]vil|servicio m[oó]vil|voy a tu casa)/i.test(t)) return "comes" as const;
  if (/(en local|en tienda|visit us|shop|oficina|local (abierto|f[ií]sico))/i.test(t)) return "shop" as const;

  return "" as const;
};

type ServicioFeatureDef = { key: string; label: { es: string; en: string }; kw: string[] };

function parseCsvSet(v: string) {
  const s = (v || "").split(",").map((x) => x.trim()).filter(Boolean);
  return new Set(s);
}

function setToCsv(set: Set<string>) {
  return Array.from(set).sort().join(",");
}

function getServiciosFeatureDefs(stype: string): ServicioFeatureDef[] {
  const k = (stype || "").trim().toLowerCase() as ServicioKey;
  switch (k) {
    case "landscaping":
      return [
        { key: "lawn", label: { es: "Corte de pasto", en: "Lawn mowing" }, kw: ["pasto", "césped", "lawn", "mowing", "corte"] },
        { key: "trees", label: { es: "Poda de árboles", en: "Tree trimming" }, kw: ["poda", "árbol", "arbol", "trees", "trimming", "podar"] },
        { key: "irrigation", label: { es: "Riego", en: "Irrigation" }, kw: ["riego", "irrigation", "sprinkler", "aspersor"] },
      ];
    case "plumbing":
      return [
        { key: "leak", label: { es: "Fugas", en: "Leaks" }, kw: ["fuga", "leak", "gotera"] },
        { key: "drain", label: { es: "Drenaje", en: "Drains" }, kw: ["dren", "drain", "clog", "tapado"] },
        { key: "water-heater", label: { es: "Calentador de agua", en: "Water heater" }, kw: ["calentador", "boiler", "water heater"] },
      ];
    case "electrician":
      return [
        { key: "panel", label: { es: "Panel eléctrico", en: "Electrical panel" }, kw: ["panel", "breaker", "tablero"] },
        { key: "lighting", label: { es: "Iluminación", en: "Lighting" }, kw: ["luz", "luces", "lighting", "lámpara", "lampara"] },
        { key: "outlet", label: { es: "Contactos", en: "Outlets" }, kw: ["contacto", "enchufe", "outlet"] },
      ];
    case "mechanic":
      return [
        { key: "smog", label: { es: "Smog", en: "Smog" }, kw: ["smog", "emisiones", "inspection", "inspeccion"] },
        { key: "grua", label: { es: "Grúa", en: "Towing" }, kw: ["tow", "towing", "grua", "grúa", "remolque"] },
        { key: "llantas", label: { es: "Llantas", en: "Tires" }, kw: ["llanta", "tire", "tires", "neumatico"] },
        { key: "cambio-aceite", label: { es: "Cambio de aceite", en: "Oil change" }, kw: ["aceite", "oil change", "cambio de aceite"] },
        { key: "lavado-autos", label: { es: "Lavado de autos", en: "Car wash" }, kw: ["lavado", "car wash", "autos", "auto"] },
        { key: "detallado", label: { es: "Detallado", en: "Detailing" }, kw: ["detall", "detail", "detailing", "pulido"] },
        { key: "carroceria", label: { es: "Carrocería", en: "Body work" }, kw: ["carroceria", "body", "hail", "collision", "golpe"] },
        { key: "vidrios-parabrisas", label: { es: "Vidrios y parabrisas", en: "Glass & windshield" }, kw: ["vidrio", "parabrisas", "windshield", "glass"] },
        { key: "baterias", label: { es: "Baterías", en: "Batteries" }, kw: ["bateria", "battery", "baterías"] },
        { key: "alineacion", label: { es: "Alineación", en: "Alignment" }, kw: ["alineacion", "alignment", "balanceo"] },
        { key: "oil", label: { es: "Cambio de aceite", en: "Oil change" }, kw: ["aceite", "oil change", "cambio de aceite"] },
        { key: "brakes", label: { es: "Frenos", en: "Brakes" }, kw: ["freno", "frenos", "brake", "pads"] },
        { key: "diagnostic", label: { es: "Diagnóstico", en: "Diagnostics" }, kw: ["diagn", "scanner", "check engine"] },
      ];
    case "tow":
      return [
        { key: "24-7", label: { es: "Servicio 24/7", en: "24/7 service" }, kw: ["24/7", "24-7", "urgente", "emergency"] },
        { key: "flatbed", label: { es: "Plataforma", en: "Flatbed" }, kw: ["plataforma", "flatbed"] },
      ];
    case "cleaning":
      return [
        { key: "deep", label: { es: "Limpieza profunda", en: "Deep clean" }, kw: ["profunda", "deep"] },
        { key: "moveout", label: { es: "Move-out", en: "Move-out" }, kw: ["move out", "move-out", "mudanza"] },
      ];
    default:
      return [];
  }
}

function hasAnyKw(text: string, kws: string[]) {
  const t = (text || "").toLowerCase();
  return kws.some((k) => t.includes(String(k).toLowerCase()));
}


function applyServiciosParams(list: Listing[], sp: ServiciosParams): Listing[] {
  const st = (sp.stype || "").trim().toLowerCase();
  const av = (sp.savail || "").trim().toLowerCase();
  const sv = (sp.svisit || "").trim().toLowerCase();
  const feat = parseCsvSet(sp.sfeat);

  return list.filter((x) => {
    if (x.category !== "servicios") return true;

    const title = x.title.es || x.title.en || "";
    const blurb = x.blurb.es || x.blurb.en || "";
    const explicit = (x as any).serviceType ? String((x as any).serviceType) : "";

    const inferredType = inferServicioType(title, blurb, explicit);
    const inferredAvail = inferServicioAvail(title, blurb);
    const inferredVisit = inferServicioVisit(title, blurb);

    if (st && String(inferredType) !== st) return false;
    if (av && String(inferredAvail) !== av) return false;
    if (sv && String(inferredVisit) !== sv) return false;

    if (feat.size) {
      const explicitFeatures = Array.isArray((x as any).serviceFeatures) ? ((x as any).serviceFeatures as any[]).map(String) : [];
      const txt = `${title} ${blurb}`;
      const defs = getServiciosFeatureDefs(String(inferredType));
      for (const f of Array.from(feat)) {
        // If listing has structured features, use them; otherwise fall back to keyword match.
        if (explicitFeatures.length) {
          if (!explicitFeatures.includes(f)) return false;
        } else {
          const def = defs.find((d) => d.key === f);
          if (def && !hasAnyKw(txt, def.kw)) return false;
        }
      }
    }

    return true;
  });
}

function applyVentaParams(list: Listing[], vp: VentaParams): Listing[] {
  const pmin = Number(String(vp.vpmin || "").trim());
  const pmax = Number(String(vp.vpmax || "").trim());
  const hasMin = Number.isFinite(pmin) && String(vp.vpmin || "").trim() !== "";
  const hasMax = Number.isFinite(pmax) && String(vp.vpmax || "").trim() !== "";
  const cond = (vp.vcond || "").trim().toLowerCase();
  const type = (vp.vtype || "").trim().toLowerCase();
  const neg = (vp.vneg || "").trim().toLowerCase();

  return list.filter((x) => {
    if (x.category !== "en-venta") return true;

    const title = x.title.es || x.title.en || "";
    const blurb = x.blurb.es || x.blurb.en || "";

    const explicitCond = (x as any).condition ? String((x as any).condition) : "";
    const inferredCond = inferVentaCondition(title, blurb, explicitCond);
    const inferredType = (x as any).itemType
      ? String((x as any).itemType).toLowerCase()
      : inferVentaType(title, blurb);

    const inferredNeg = /(negociable|obo|best offer|mejor oferta|or best offer)/i.test(`${title} ${blurb}`);

    if (cond && String(inferredCond ?? "").toLowerCase() !== cond) return false;
    if (type && String(inferredType).toLowerCase() !== type) return false;
    if (neg === "yes" && !inferredNeg) return false;

    const pn = parsePriceLabel(x.priceLabel.en) ?? null;
    if (hasMin && pn !== null && pn < pmin) return false;
    if (hasMax && pn !== null && pn > pmax) return false;

    if (vp.vpostedToday) {
      const created = new Date(x.createdAtISO).getTime();
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      if (created < todayStart.getTime()) return false;
    }

    return true;
  });
}

function applyClasesParams(list: Listing[], cp: ClasesParams): Listing[] {
  const sub = (cp.csub || "").trim().toLowerCase();
  const lvl = (cp.clevel || "").trim().toLowerCase();
  const mode = (cp.cmode || "").trim().toLowerCase();

  return list.filter((x) => {
    if (x.category !== "clases") return true;

    const title = x.title.es || x.title.en || "";
    const blurb = x.blurb.es || x.blurb.en || "";

    const inferredSub = (x as any).subject
      ? String((x as any).subject).toLowerCase()
      : inferClaseSubject(title, blurb);

    const inferredMode = (x as any).mode
      ? String((x as any).mode).toLowerCase()
      : inferClaseMode(title, blurb);

    const inferredLvl = (x as any).level
      ? String((x as any).level).toLowerCase()
      : inferClaseLevel(title, blurb);

    if (sub && String(inferredSub).toLowerCase() !== sub) return false;
    if (mode && String(inferredMode ?? "").toLowerCase() !== mode) return false;
    if (lvl && String(inferredLvl ?? "").toLowerCase() !== lvl) return false;

    return true;
  });
}

function applyComunidadParams(list: Listing[], gp: ComunidadParams): Listing[] {
  const gtype = (gp.gtype || "").trim().toLowerCase();

  return list.filter((x) => {
    if (x.category !== "comunidad") return true;

    const title = x.title.es || x.title.en || "";
    const blurb = x.blurb.es || x.blurb.en || "";

    const inferred = (x as any).ctype
      ? String((x as any).ctype).toLowerCase()
      : inferComunidadType(title, blurb);

    if (gtype && String(inferred).toLowerCase() !== gtype) return false;
    return true;
  });
}


const resultsTopRef = useRef<HTMLDivElement | null>(null);
const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);
const switchTimerRef = useRef<number | null>(null);
const [isSwitchingCategory, setIsSwitchingCategory] = useState(false);

const scrollToResultsTop = (behavior: ScrollBehavior = "smooth") => {
  const el = resultsTopRef.current;
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 96; // navbar + breathing room
  window.scrollTo({ top: Math.max(0, y), behavior });
};

const switchCategory = (next: CategoryKey) => {
  if (next === category) return;
  // subtle "state change" feel without layout shift
  if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
  setIsSwitchingCategory(true);
  setCategory(next);
  scrollToResultsTop("smooth");
  switchTimerRef.current = window.setTimeout(() => setIsSwitchingCategory(false), 180);
};

useEffect(() => {
  return () => {
    if (switchTimerRef.current) window.clearTimeout(switchTimerRef.current);
  };
}, []);

// ✓ Mobile full-screen Filters/Sort panel (A3)
const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
const [mobilePanelTab, setMobilePanelTab] = useState<"filters" | "sort">("filters");
  const [moreCategoriesOpen, setMoreCategoriesOpen] = useState(false);

useEffect(() => {
  if (!mobilePanelOpen) return;
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prev;
  };
}, [mobilePanelOpen]);

  useEffect(() => {
    if (!moreCategoriesOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [moreCategoriesOpen]);

  const [moreOpen, setMoreOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [locMsg, setLocMsg] = useState("");

  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestOpen, setCitySuggestOpen] = useState(false);
  const citySuggestRef = useRef<HTMLDivElement | null>(null);

  const didHydrateRef = useRef(false);

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<Exclude<CategoryKey, "all">>>([]);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Servicios: Yelp-style typeahead + hover menu + "All" drawer
  const isServiciosCat = category === "servicios";
  const [serviciosTypeOpen, setServiciosTypeOpen] = useState(false);
  const serviciosTypeRef = useRef<HTMLDivElement | null>(null);
  const serviciosTypeSuggestions = useMemo(
    () => (isServiciosCat ? getServicioSuggestions(q, lang) : []),
    [q, lang, isServiciosCat]
  );

  const [serviciosHover, setServiciosHover] = useState<ServiciosGroupKey | null>(null);
  const [serviciosAllOpen, setServiciosAllOpen] = useState(false);
  useEffect(() => {
    if (!serviciosAllOpen) return;
    setServiciosDraft(serviciosParams);
  }, [serviciosAllOpen]);

  // ✓ Rentas param state (only used when cat=rentas)
  const [rentasParams, setRentasParams] = useState<RentasParams>(EMPTY_RENTAS_PARAMS);

  // ✓ Autos param state (only used when cat=autos)
  const [autosParams, setAutosParams] = useState<AutosParams>(EMPTY_AUTOS_PARAMS);


  // ✓ Empleos param state (only used when cat=empleos)
  const [empleosParams, setEmpleosParams] = useState<EmpleosParams>(EMPTY_EMPLEOS_PARAMS);

  // ✓ Servicios param state (only used when cat=servicios)
  const [serviciosParams, setServiciosParams] = useState<ServiciosParams>(EMPTY_SERVICIOS_PARAMS);
  const [serviciosDraft, setServiciosDraft] = useState<ServiciosParams>(EMPTY_SERVICIOS_PARAMS);


  // ✓ Keep Servicios deep-link params in sync (SEO + shareable URLs)
  useEffect(() => {
    if (category !== "servicios") return;
    setUrlParams({
      cat: "servicios",
      stype: serviciosParams.stype || null,
      savail: serviciosParams.savail || null,
      svisit: serviciosParams.svisit || null,
      sfeat: serviciosParams.sfeat || null,
    });
  }, [category, serviciosParams]);

  // ✓ Servicios: merge drawer URL params (sv_mobile, sv_shop, sv_247, sv_mech_*) into effective filter state
  const effectiveServiciosParams = useMemo(() => {
    if (category !== "servicios") return serviciosParams;
    const p = params;
    const svisit = p?.get("sv_mobile") === "1" ? "comes" : p?.get("sv_shop") === "1" ? "shop" : serviciosParams.svisit || "";
    const savail = p?.get("sv_247") === "1" ? "anytime" : serviciosParams.savail || "";
    let sfeat = serviciosParams.sfeat || "";
    const stype = (serviciosParams.stype || "").trim().toLowerCase();
    if (stype === "mechanic") {
      const mechOpts = serviciosDrawerFilters.byStype.mechanic?.options ?? [];
      const mechKeys = mechOpts.filter((o) => p?.get(o.paramKey) === "1").map((o) => o.key);
      if (mechKeys.length) sfeat = setToCsv(new Set([...parseCsvSet(sfeat), ...mechKeys]));
    }
    return { ...serviciosParams, svisit, savail, sfeat };
  }, [category, serviciosParams, params]);

  // ✓ En Venta param state (only used when cat=en-venta)
  const [ventaParams, setVentaParams] = useState<VentaParams>(EMPTY_VENTA_PARAMS);

  // ✓ Clases param state (only used when cat=clases)
  const [clasesParams, setClasesParams] = useState<ClasesParams>(EMPTY_CLASES_PARAMS);

  // ✓ Comunidad param state (only used when cat=comunidad)
  const [comunidadParams, setComunidadParams] = useState<ComunidadParams>(EMPTY_COMUNIDAD_PARAMS);

  // ✓ Travel param state (only used when cat=travel)
  const [travelParams, setTravelParams] = useState<TravelParams>(EMPTY_TRAVEL_PARAMS);

  // ✓ Bienes Raíces param state (only used when cat=bienes-raices)
  const [brParams, setBrParams] = useState<BienesRaicesParams>(EMPTY_BIENES_RAICES_PARAMS);

  // ✓ Hydrate state from URL params (deep-links + refresh + back/forward)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hydrateFromSearch = () => {
      const sp = new URLSearchParams(window.location.search);
      const get = (k: string) => (sp.get(k) ?? "").trim();

      const q0 = get("q");
      const cat0Raw = get("cat") || "all";
      const cat0 = cat0Raw === "viajes" ? "travel" : cat0Raw;
      const sort0 = get("sort");
      const view0 = get("view");
      const r0 = get("r");
      const zip0 = get("zip").replace(/\D/g, "").slice(0, 5);
      const city0 = get("city");

      setQ(q0);

      if (isCategoryKey(cat0)) setCategory(cat0);
      else setCategory("all");

      setSort(normalizeSort(sort0));

      if (view0 === "list" || view0 === "grid") setView(view0);
      else setView("grid");

      if (r0) {
        const n = Number(r0);
        setRadiusMi(clampRadiusMi(n));
      } else {
        setRadiusMi(DEFAULT_RADIUS_MI);
      }

      if (zip0.length === 5) {
        setZip(zip0);
        setCity(DEFAULT_CITY);
      } else {
        setZip("");
        setCity(city0 ? canonicalizeCity(city0) : DEFAULT_CITY);
      }

      // Category-specific params (only hydrate when cat matches; otherwise reset)
      if (cat0 === "rentas") {
        setRentasParams({
          rpmin: get("rpmin"),
          rpmax: get("rpmax"),
          rbeds: get("rbeds"),
          rbaths: get("rbaths"),
          rtype: get("rtype"),
          rpets: get("rpets"),
          rparking: get("rparking"),
          rfurnished: get("rfurnished"),
          rutilities: get("rutilities"),
          ravailable: get("ravailable"),
          rsqmin: get("rsqmin"),
          rsqmax: get("rsqmax"),
          rleaseterm: get("rleaseterm"),
          rseller: get("rseller"),
        });
      } else {
        setRentasParams(EMPTY_RENTAS_PARAMS);
      }

      if (cat0 === "autos") {
        setAutosParams({
          aymin: get("aymin"),
          aymax: get("aymax"),
          amake: get("amake"),
          amodel: get("amodel"),
          amilesmax: get("amilesmax"),
          acond: get("acond"),
          aseller: get("aseller"),
        });
      } else {
        setAutosParams(EMPTY_AUTOS_PARAMS);
      }

      if (cat0 === "empleos") {
        setEmpleosParams({
          ejob: get("ejob"),
          eremote: get("eremote"),
          epaymin: get("epaymin"),
          epaymax: get("epaymax"),
          eindustry: get("eindustry"),
        });
      } else {
        setEmpleosParams(EMPTY_EMPLEOS_PARAMS);
      }

      if (cat0 === "servicios") {
        setServiciosParams({
          stype: get("stype"),
          savail: get("savail"),
          svisit: get("svisit"),
          sfeat: get("sfeat"),
        });
      } else {
        setServiciosParams(EMPTY_SERVICIOS_PARAMS);
        setServiciosDraft(EMPTY_SERVICIOS_PARAMS);
      }

      if (cat0 === "en-venta") {
        setVentaParams({
          vpmin: get("vpmin"),
          vpmax: get("vpmax"),
          vcond: get("vcond"),
          vtype: get("vtype"),
          vneg: get("vneg"),
          vpostedToday: get("vpostedToday") === "1",
        });
      } else {
        setVentaParams(EMPTY_VENTA_PARAMS);
      }

      if (cat0 === "clases") {
        setClasesParams({
          csub: get("csub"),
          clevel: get("clevel"),
          cmode: get("cmode"),
        });
      } else {
        setClasesParams(EMPTY_CLASES_PARAMS);
      }

      if (cat0 === "comunidad") {
        setComunidadParams({
          gtype: get("gtype"),
        });
      } else {
        setComunidadParams(EMPTY_COMUNIDAD_PARAMS);
      }


      if (cat0 === "travel") {
        setTravelParams({
          ttype: get("ttype"),
          tbmin: get("tbmin"),
          tbmax: get("tbmax"),
        });
      } else {
        setTravelParams(EMPTY_TRAVEL_PARAMS);
      }

      if (cat0 === "bienes-raices") {
        setBrParams({
          subcategoria: get("brSub"),
          priceMin: get("brPmin"),
          priceMax: get("brPmax"),
          beds: get("brBeds"),
          baths: get("brBaths"),
        });
      } else {
        setBrParams(EMPTY_BIENES_RAICES_PARAMS);
      }
    };

    if (!didHydrateRef.current) {
      hydrateFromSearch();
      didHydrateRef.current = true;
    }

    const onPop = () => hydrateFromSearch();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    setIsMobileUI(isMobile);
    const savedView = localStorage.getItem("leonix_view_mode");
    if (savedView) {
      setView(savedView as any);
    } else {
      setView(isMobile ? "list" : "grid");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onScroll = () => setCompact(window.scrollY > 150);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (searchBoxRef.current && searchBoxRef.current.contains(t)) return;
      if (serviciosTypeRef.current && serviciosTypeRef.current.contains(t)) return;
      setSuggestionsOpen(false);
      setServiciosTypeOpen(false);
      setServiciosHover(null);
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  useEffect(() => {
    const pQ = params?.get("q") ?? null;
    const pCity = params?.get("city") ?? null;
    const pZip = params?.get("zip") ?? null;
    const pR = params?.get("r") ?? null;
    const pCatRaw = params?.get("cat") ?? null;
    const pCat = pCatRaw === "viajes" ? "travel" : pCatRaw;
    const pSort = params?.get("sort") ?? null;
    const pView = params?.get("view") ?? null;

    if (pQ) setQ(pQ);
    if (pCity) setCity(canonicalizeCity(pCity));
    if (pZip) setZip(pZip.replace(/\D/g, "").slice(0, 5));
    if (pR && Number.isFinite(Number(pR))) setRadiusMi(clampRadiusMi(Number(pR)));

    if (pCat && isCategoryKey(pCat)) setCategory(pCat as CategoryKey);

    const sortOk: SortKey[] = ["newest", "price-asc", "price-desc"];
    if (pSort) setSort(normalizeSort(pSort));

    const viewOk: ViewMode[] = ["grid", "list", "list-img"];
    if (pView && viewOk.includes(pView as ViewMode)) setView(pView as ViewMode);

    // ✓ Rentas params: only track them if cat=rentas
    const catIsRentas = pCat === "rentas";
    if (catIsRentas) {
      setRentasParams({
        rpmin: params?.get("rpmin") ?? "",
        rpmax: params?.get("rpmax") ?? "",
        rbeds: params?.get("rbeds") ?? "",
        rbaths: params?.get("rbaths") ?? "",
        rtype: params?.get("rtype") ?? "",
        rpets: params?.get("rpets") ?? "",
        rparking: params?.get("rparking") ?? "",
        rfurnished: params?.get("rfurnished") ?? "",
        rutilities: params?.get("rutilities") ?? "",
        ravailable: params?.get("ravailable") ?? "",
        rsqmin: params?.get("rsqmin") ?? "",
        rsqmax: params?.get("rsqmax") ?? "",
        rleaseterm: params?.get("rleaseterm") ?? "",
        rseller: params?.get("rseller") ?? "",
      });
} else {
      setRentasParams(EMPTY_RENTAS_PARAMS);
    }

    // ✓ Autos params: only track them if cat=autos
    const catIsAutos = pCat === "autos";
    if (catIsAutos) {
      setAutosParams({
        aymin: params?.get("aymin") ?? "",
        aymax: params?.get("aymax") ?? "",
        amake: params?.get("amake") ?? "",
        amodel: params?.get("amodel") ?? "",
        amilesmax: params?.get("amilesmax") ?? "",
        acond: params?.get("acond") ?? "",
        aseller: params?.get("aseller") ?? "",
      });
    } else {
      setAutosParams(EMPTY_AUTOS_PARAMS);
    }

    // ✓ En Venta params: only track them if cat=en-venta
    const catIsVenta = pCat === "en-venta";
    if (catIsVenta) {
      setVentaParams({
        vpmin: params?.get("vpmin") ?? "",
        vpmax: params?.get("vpmax") ?? "",
        vcond: params?.get("vcond") ?? "",
        vtype: params?.get("vtype") ?? "",
        vneg: params?.get("vneg") ?? "",
        vpostedToday: params?.get("vpostedToday") === "1",
      });
    } else {
      setVentaParams(EMPTY_VENTA_PARAMS);
    }

    // ✓ Clases params: only track them if cat=clases
    const catIsClases = pCat === "clases";
    if (catIsClases) {
      setClasesParams({
        csub: params?.get("csub") ?? "",
        clevel: params?.get("clevel") ?? "",
        cmode: params?.get("cmode") ?? "",
      });
    } else {
      setClasesParams(EMPTY_CLASES_PARAMS);
    }

    // ✓ Comunidad params: only track them if cat=comunidad
    const catIsComunidad = pCat === "comunidad";
    if (catIsComunidad) {
      setComunidadParams({
        gtype: params?.get("gtype") ?? "",
      });
    } else {
      setComunidadParams(EMPTY_COMUNIDAD_PARAMS);
    }

    // ✓ Bienes Raíces params: hydrate from URL when cat=bienes-raices; reset when not
    if (pCat === "bienes-raices") {
      setBrParams({
        subcategoria: params?.get("brSub") ?? "",
        priceMin: params?.get("brPmin") ?? "",
        priceMax: params?.get("brPmax") ?? "",
        beds: params?.get("brBeds") ?? "",
        baths: params?.get("brBaths") ?? "",
      });
    } else {
      setBrParams(EMPTY_BIENES_RAICES_PARAMS);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const zipClean = useMemo(() => zip.replace(/\D/g, "").slice(0, 5), [zip]);
  const zipModeRaw = zipClean.length === 5;

  const zipAnchor = useMemo(() => {
    if (!zipModeRaw) return { known: false, latLng: null as LatLng | null };
    const ll = (ZIP_GEO as Record<string, LatLng | undefined>)[zipClean];
    return { known: Boolean(ll), latLng: ll ? { lat: ll.lat, lng: ll.lng } : null };
  }, [zipModeRaw, zipClean]);

  const zipMode = zipModeRaw && zipAnchor.known && !!zipAnchor.latLng;

  const canonicalCity = useMemo(() => canonicalizeCity(city), [city]);

  const resolvedCity = useMemo(() => {
    const direct = getCityLatLng(canonicalCity);
    if (direct) return { name: canonicalCity, latLng: direct, from: "direct" as const };

    const key = normalize(canonicalCity);
    if (!key || key.length < 3) {
      return { name: DEFAULT_CITY, latLng: getCityLatLng(DEFAULT_CITY), from: "default" as const };
    }

    let best = "";
    let bestDist = Number.POSITIVE_INFINITY;
    const names = CA_CITIES.map((c) => normalize(c.city));

    for (const n of names) {
      const d = levenshtein(key, n);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    }

    const maxLen = Math.max(key.length, best.length);
    const similarity = maxLen === 0 ? 0 : 1 - bestDist / maxLen;
    if (best && bestDist <= 2 && similarity >= 0.6) {
      const hit = CA_CITIES.find((c) => normalize(c.city) === best);
      if (hit) {
        return {
          name: hit.city,
          latLng: { lat: hit.lat, lng: hit.lng },
          from: "fuzzy" as const,
        };
      }
    }

    return { name: DEFAULT_CITY, latLng: getCityLatLng(DEFAULT_CITY), from: "default" as const };
  }, [canonicalCity]);

  const anchor = useMemo<LatLng | null>(() => {
    if (zipMode && zipAnchor.latLng) return zipAnchor.latLng;
    return resolvedCity.latLng ?? null;
  }, [zipMode, zipAnchor.latLng, resolvedCity.latLng]);

  const zipNearestCity = useMemo(() => {
    if (!zipMode || !zipAnchor.latLng) return "";
    let bestCity = "";
    let bestD = Number.POSITIVE_INFINITY;
    for (const c of CA_CITIES) {
      const d = haversineMi(zipAnchor.latLng, { lat: c.lat, lng: c.lng });
      if (d < bestD) {
        bestD = d;
        bestCity = c.city;
      }
    }
    return bestCity;
  }, [zipMode, zipAnchor.latLng]);

  useEffect(() => {
    if (zipModeRaw && !zipAnchor.known) {
      setLocMsg(
        lang === "es"
          ? "ZIP no encontrado — no se aplicó ubicación."
          : "ZIP not found — location not applied."
      );
      return;
    }
    if (zipMode) {
      setLocMsg(
        zipNearestCity
          ? lang === "es"
            ? `Cerca de: ${zipNearestCity}`
            : `Near: ${zipNearestCity}`
          : ""
      );
      return;
    }
    if (usingMyLocation) {
      setLocMsg(lang === "es" ? "Usando tu ubicación actual" : "Using your current location");
      return;
    }
    if (resolvedCity.from === "fuzzy") {
      setLocMsg(
        lang === "es"
          ? `Buscando cerca de: ${resolvedCity.name}`
          : `Searching near: ${resolvedCity.name}`
      );
      return;
    }
    setLocMsg("");
  }, [zipModeRaw, zipAnchor.known, zipMode, zipNearestCity, usingMyLocation, lang, resolvedCity.from, resolvedCity.name]);

  const nearbyCityChips = useMemo(() => {
    if (!anchor) return [];
    const cap = radiusMi <= 10 ? 6 : radiusMi <= 25 ? 10 : 14;

    const rows = CA_CITIES
      .map((c) => ({
        city: c.city,
        d: haversineMi(anchor, { lat: c.lat, lng: c.lng }),
      }))
      .filter((x) => x.d <= radiusMi)
      .sort((a, b) => a.d - b.d);

    const seen = new Set<string>();
    const out: Array<{ city: string; d: number }> = [];
    for (const r of rows) {
      const k = normalize(r.city);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(r);
      if (out.length >= cap) break;
    }
    return out;
  }, [anchor, radiusMi]);

  const cityOptions = useMemo(() => {
    const names = CA_CITIES.map((c) => c.city).filter(Boolean);
    const nq = normalize(cityQuery);
    if (!nq) return names.slice(0, 25);

    const prefix = names.filter((n) => normalize(n).startsWith(nq));
    const contains = names.filter((n) => !normalize(n).startsWith(nq) && normalize(n).includes(nq));
    return [...prefix, ...contains].slice(0, 25);
  }, [cityQuery]);

  const synonymIndex = useMemo(() => {
    const base: Array<[Exclude<CategoryKey, "all">, string[]]> = [
      [
        "autos",
        [
          "auto",
          "autos",
          "carro",
          "carros",
          "coche",
          "coches",
          "troca",
          "trocas",
          "camioneta",
          "camionetas",
          "pickup",
          "pick up",
          "pick-up",
          "camion",
          "camión",
          "van",
          "suv",
          "car",
          "cars",
          "truck",
          "trucks",
        ],
      ],
      [
        "rentas",
        [
          "renta",
          "rentas",
          "alquiler",
          "alquilo",
          "apartamento",
          "depa",
          "departamento",
          "casa",
          "cuarto",
          "habitacion",
          "habitación",
          "roomie",
          "rent",
          "rental",
          "rentals",
          "apartment",
          "apt",
          "house",
          "home",
          "room",
          "studio",
        ],
      ],
      [
        "empleos",
        [
          "empleo",
          "empleos",
          "trabajo",
          "trabajos",
          "jale",
          "vacante",
          "vacantes",
          "contratando",
          "se busca",
          "job",
          "jobs",
          "work",
          "hiring",
          "position",
          "positions",
        ],
      ],
      [
        "servicios",
        [
          "servicio",
          "servicios",
          "mecanico",
          "mecánico",
          "plomero",
          "electricista",
          "limpieza",
          "jardineria",
          "jardinería",
          "pintor",
          "remodelacion",
          "remodelación",
          "mudanza",
          "service",
          "services",
          "mechanic",
          "plumber",
          "electrician",
          "cleaning",
          "landscaping",
          "moving",
          "remodel",
          "remodeling",
        ],
      ],
      [
        "en-venta",
        [
          "vendo",
          "venta",
          "en venta",
          "se vende",
          "oferta",
          "precio",
          "barato",
          "segunda mano",
          "usado",
          "usados",
          "sale",
          "for sale",
          "selling",
          "used",
          "second hand",
        ],
      ],
      [
        "clases",
        [
          "clase",
          "clases",
          "curso",
          "cursos",
          "tutor",
          "tutoria",
          "tutoría",
          "lecciones",
          "class",
          "classes",
          "course",
          "courses",
          "tutor",
          "tutoring",
          "lessons",
        ],
      ],
      [
        "comunidad",
        [
          "comunidad",
          "evento",
          "eventos",
          "iglesia",
          "ayuda",
          "donacion",
          "donación",
          "voluntario",
          "community",
          "event",
          "events",
          "church",
          "help",
          "donation",
          "volunteer",
        ],
      ],
      [
        "travel",
        [
          "viaje",
          "viajes",
          "vacacion",
          "vacación",
          "vacaciones",
          "turismo",
          "tour",
          "tours",
          "excursion",
          "excursión",
          "excursiones",
          "crucero",
          "cruceros",
          "resort",
          "resorts",
          "paquete",
          "paquetes",
          "hotel",
          "hoteles",
          "vuelo",
          "vuelos",
          "flight",
          "flights",
          "trip",
          "trips",
          "travel",
          "vacation",
          "vacations",
          "cruise",
          "cruises",
          "car rental",
          "car rentals",
          "rent a car",
          "renta de carro",
          "renta de autos",
          "agencia de viajes",
          "travel agent",
          "travel agency",
        ],
      ],

    ];

    const index = new Map<string, Exclude<CategoryKey, "all">>();
    for (const [cat, words] of base) {
      for (const w of words) {
        const key = normalize(w);
        if (key && !index.has(key)) index.set(key, cat);
      }
      index.set(normalize(cat), cat);
      index.set(normalize(CATEGORY_LABELS[cat][lang]), cat);
    }
    const keys = Array.from(index.keys());
    return { index, keys };
  }, [lang]);

  useEffect(() => {
    const val = normalize(q);

    if (!val || val.length < 3) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const { index, keys } = synonymIndex;

    const prefixMatches = new Set<Exclude<CategoryKey, "all">>();
    for (const k of keys) {
      if (k.startsWith(val)) {
        const cat = index.get(k);
        if (cat) prefixMatches.add(cat);
      }
    }

    let next: Array<Exclude<CategoryKey, "all">> = [];

    const ORDER: Array<Exclude<CategoryKey, "all">> = [
      "autos",
      "rentas",
      "empleos",
      "servicios",
      "en-venta",
      "bienes-raices",
      "clases",
      "comunidad",
    ];

    if (prefixMatches.size > 0) {
      for (const c of ORDER) if (prefixMatches.has(c)) next.push(c);
      next = next.slice(0, 3);
    } else if (val.length >= 5) {
      let bestKey = "";
      let bestCat: Exclude<CategoryKey, "all"> | null = null;
      let bestDist = Number.POSITIVE_INFINITY;

      for (const k of keys) {
        if (k.length < 4) continue;
        const d = levenshtein(val, k);
        if (d < bestDist) {
          bestDist = d;
          bestKey = k;
          bestCat = index.get(k) ?? null;
        }
      }

      if (bestCat) {
        const maxLen = Math.max(val.length, bestKey.length);
        const similarity = maxLen === 0 ? 0 : 1 - bestDist / maxLen;
        if (bestDist <= 2 && similarity >= 0.6) next = [bestCat];
      }
    }

    setSuggestions(next);
    setSuggestionsOpen(next.length > 0);
  }, [q, synonymIndex]);

  const [adminServiciosListings, setAdminServiciosListings] = useState<Listing[]>([]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("leonix_admin_servicios_listings_v1");
      if (!raw) return;
      const arr = JSON.parse(raw) as Array<{
        id: string;
        listingId?: string;
        businessId?: string;
        category: string;
        stype: string;
        title: string;
        city: string;
        zip?: string;
        tier: "premium" | "plus" | "standard";
        status: string;
        createdAt: string;
        phone?: string;
        website?: string;
        mobile?: boolean;
        shop?: boolean;
        urgent247?: boolean;
        boostUntil?: string;
      }>;
      if (!Array.isArray(arr)) return;
      const active = arr.filter((x) => x.status === "active");
      const mapped: Listing[] = active.map((a) => {
        const created = a.createdAt ? new Date(a.createdAt).toISOString() : "1970-01-01T00:00:00.000Z";
        const listingId = a.listingId ?? a.id;
        return {
          id: listingId,
          category: "servicios" as const,
          title: { es: a.title, en: a.title },
          priceLabel: { es: "Cotización", en: "Quote" },
          city: a.city,
          zip: a.zip,
          postedAgo: { es: "hace 1 día", en: "1 day ago" },
          createdAtISO: created,
          hasImage: false,
          sellerType: "business" as const,
          blurb: { es: "", en: "" },
          phone: a.phone,
          website: a.website,
          serviceType: a.stype,
          servicesTier: a.tier,
          boostUntil: a.boostUntil,
          ...(a.businessId != null && { businessId: a.businessId }),
        } as Listing;
      });
      setAdminServiciosListings(mapped);
    } catch {
      /* ignore */
    }
  }, []);

  const listings = useMemo<Listing[]>(() => {
    const raw = (SAMPLE_LISTINGS as unknown as Listing[]) ?? [];
    const sample = raw.map((x) => ({
      ...x,
      createdAtISO: safeISO(x.createdAtISO),
      hasImage: Boolean(x.hasImage),
      sellerType: x.sellerType ?? "personal",
    }));
    if (typeof window !== "undefined" && adminServiciosListings.length > 0) {
      return [...sample, ...adminServiciosListings];
    }
    return sample;
  }, [adminServiciosListings]);

  const qSmart = useMemo(() => {
    const nq = normalize(q);
    if (!nq) return "";
    return nq
      .replace(/\btroca\b/g, "truck")
      .replace(/\btrocas\b/g, "truck")
      .replace(/\bcamioneta\b/g, "truck")
      .replace(/\bcamionetas\b/g, "truck")
      .replace(/\bpick-?up\b/g, "truck")
      .replace(/\btrabajo\b/g, "empleos")
      .replace(/\btrabajos\b/g, "empleos")
      .replace(/\bjobs?\b/g, "empleos")
      .replace(/\bhouse\b/g, "rentas")
      .replace(/\bhome\b/g, "rentas");
  }, [q]);

  const filtered = useMemo(() => {
    const nq = qSmart;
    const hasQ = nq.length > 0;

    const base = listings.filter((x) => {
      if (category !== "all" && x.category !== category) return false;
      if (sellerType && x.sellerType !== sellerType) return false;
      if (onlyWithImage && !x.hasImage) return false;

      if (hasQ) {
        const hay = normalize(
          `${x.title.es} ${x.title.en} ${x.blurb.es} ${x.blurb.en} ${x.city} ${x.year ?? ""} ${x.make ?? ""} ${x.model ?? ""}`
        );
        if (!hay.includes(nq)) return false;
      }

      if (!anchor) return true;
      const cityLL = getCityLatLng(canonicalizeCity(x.city));
      if (!cityLL) return true;
      return haversineMi(anchor, cityLL) <= radiusMi;
    });

    let catApplied = base;
    if (category === "autos") catApplied = applyAutosParams(base, autosParams);
    if (category === "rentas") catApplied = applyRentasParams(base, rentasParams);
    if (category === "empleos") catApplied = applyEmpleosParams(base, empleosParams);
    if (category === "servicios") catApplied = applyServiciosParams(base, effectiveServiciosParams);
    if (category === "en-venta") catApplied = applyVentaParams(base, ventaParams);
    if (category === "clases") catApplied = applyClasesParams(base, clasesParams);
    if (category === "comunidad") catApplied = applyComunidadParams(base, comunidadParams);
    if (category === "travel") catApplied = applyTravelParams(base, travelParams);
    if (category === "bienes-raices") catApplied = applyBienesRaicesParams(base, brParams);

    const now = Date.now();
    const engagementScore = (x: any) => (Number(x?.views) || 0) + 2 * (Number(x?.saves) || 0) + (Number(x?.shares) || 0);
    const sorted = [...catApplied].sort((a, b) => {
      // En-venta (and marketplace): 1) boosted first, 2) engagement score, 3) newest / recently updated, 4) older
      const isVentaOrAll = category === "en-venta" || category === "all";
      if (isVentaOrAll) {
        const boostA = (a as any).boostUntil != null ? new Date((a as any).boostUntil).getTime() : 0;
        const boostB = (b as any).boostUntil != null ? new Date((b as any).boostUntil).getTime() : 0;
        const activeA = boostA > now ? 1 : 0;
        const activeB = boostB > now ? 1 : 0;
        if (activeB !== activeA) return activeB - activeA;
        if (activeA && activeB && boostB !== boostA) return boostB - boostA;
        const scoreA = engagementScore(a);
        const scoreB = engagementScore(b);
        if (scoreB !== scoreA) return scoreB - scoreA;
        const updatedA = (a as any).updatedAtISO ? new Date((a as any).updatedAtISO).getTime() : 0;
        const updatedB = (b as any).updatedAtISO ? new Date((b as any).updatedAtISO).getTime() : 0;
        const createdA = new Date(a.createdAtISO).getTime();
        const createdB = new Date(b.createdAtISO).getTime();
        const sortA = updatedA || createdA;
        const sortB = updatedB || createdB;
        if (sortB !== sortA) return sortB - sortA;
        return createdB - createdA;
      }
      if (sort === "newest") {
        return (
          new Date(b.createdAtISO).getTime() -
          new Date(a.createdAtISO).getTime()
        );
      }
      const ap = parsePriceLabel(a.priceLabel.en) ?? Number.POSITIVE_INFINITY;
      const bp = parsePriceLabel(b.priceLabel.en) ?? Number.POSITIVE_INFINITY;
      return sort === "price-asc" ? ap - bp : bp - ap;
    });

    return sorted;
  }, [listings, qSmart, category, sellerType, onlyWithImage, anchor, radiusMi, sort, rentasParams, autosParams, empleosParams, serviciosParams, effectiveServiciosParams, ventaParams, clasesParams, comunidadParams, travelParams, brParams]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage(1);
    setInfiniteScrollLimit(20);
  }, [q, city, zip, radiusMi, category, sort, sellerType, onlyWithImage, rentasParams, autosParams, empleosParams, serviciosParams, ventaParams, clasesParams, comunidadParams, brParams]);

  
  // ------------------------------------------------------------
  // E2 — Fair visibility mix (guarantee Free listings appear early)
  // Rule: treat paid tiers as:
  //   - Business (Corona / Corona de Oro) => paid
  //   - Personal with handle (Joya)       => paid
  // Free = Personal without handle
  // Pattern: P, P, F repeating (until free runs out)
  // ------------------------------------------------------------
  const isPaidLike = (x: Listing) => {
    if (x.sellerType === "business") return true;
    if (x.sellerType === "personal" && !!x.handle) return true;
    return false;
  };

  const mixFair = (items: Listing[]) => {
    const paid: Listing[] = [];
    const free: Listing[] = [];
    for (const it of items) {
      (isPaidLike(it) ? paid : free).push(it);
    }
    // If user filtered to business-only, or one side is empty, don't mix.
    if (!free.length || !paid.length) return items;

    const out: Listing[] = [];
    let p = 0;
    let f = 0;

    // Repeat [P, P, F]
    while (p < paid.length || f < free.length) {
      for (let i = 0; i < 2 && p < paid.length; i++) out.push(paid[p++]);
      if (f < free.length) out.push(free[f++]);
      // If paid exhausted, append remaining free; if free exhausted, append remaining paid.
      if (p >= paid.length) {
        while (f < free.length) out.push(free[f++]);
        break;
      }
      if (f >= free.length) {
        while (p < paid.length) out.push(paid[p++]);
        break;
      }
    }
    return out;
  };


  const mixServicios = (items: Listing[]) => {
    // Servicios is business-first: Premium (print-only) gets featured cards,
    // then we interleave Standard/Plus.
    const premium: Listing[] = [];
    const rest: Listing[] = [];
    for (const it of items) {
      if (it.category === "servicios" && inferServicesTier(it) === "premium") premium.push(it);
      else rest.push(it);
    }
    if (!premium.length) return items;

    const out: Listing[] = [];
    let p = 0;
    let r = 0;

    // Repeat [3 Premium, 5 Rest]
    while (p < premium.length || r < rest.length) {
      for (let i = 0; i < 3 && p < premium.length; i++) out.push(premium[p++]);
      for (let i = 0; i < 5 && r < rest.length; i++) out.push(rest[r++]);

      if (p >= premium.length) {
        while (r < rest.length) out.push(rest[r++]);
        break;
      }
      if (r >= rest.length) {
        while (p < premium.length) out.push(premium[p++]);
        break;
      }
    }
    return out;
  };
const businessTop = useMemo(() => {
  // Show a small "Profesionales / Businesses" strip only on page 1,
  // and only when user isn't already filtering to business-only.
  if (pageClamped !== 1) return [] as Listing[];
  if (sellerType === "business") return [] as Listing[];
  const biz = filtered.filter((x) => x.sellerType === "business");
  return biz.slice(0, isMobileUI ? 2 : 4);
}, [filtered, pageClamped, sellerType]);

  // Category-level flag used across layout + filters
  const isServicios = category === "servicios";

  const serviciosGroup = useMemo(() => {
    if (!isServicios) return null;
    return servicioGroupForKey(serviciosParams.stype);
  }, [isServicios, serviciosParams.stype]);

  const serviciosBreadcrumb = useMemo(() => {
    if (!isServicios) return "";
    const g = serviciosGroup;
    const typeLbl = serviciosParams.stype ? servicioLabel(serviciosParams.stype, lang) : "";
    const gLbl = g ? SERVICIOS_GROUP_LABEL[g][lang] : "";
    if (!gLbl && !typeLbl) return CATEGORY_LABELS.servicios[lang];
    if (gLbl && !typeLbl) return `${CATEGORY_LABELS.servicios[lang]} › ${gLbl}`;
    if (!gLbl && typeLbl) return `${CATEGORY_LABELS.servicios[lang]} › ${typeLbl}`;
    return `${CATEGORY_LABELS.servicios[lang]} › ${gLbl} › ${typeLbl}`;
  }, [isServicios, serviciosGroup, serviciosParams.stype, lang]);

  const serviciosDeepChips = useMemo(() => {
    if (!isServicios) return [];
    const chips: Array<{ key: string; text: string; clear: () => void }> = [];
    if (serviciosParams.savail) chips.push({ key: "savail", text: servicioAvailLabel(serviciosParams.savail as any, lang), clear: () => setServiciosParams((p) => ({ ...p, savail: "" })) });
    if (serviciosParams.svisit) chips.push({ key: "svisit", text: serviciosParams.svisit === "comes" ? (lang === "es" ? "A domicilio" : "Comes to you") : (lang === "es" ? "En local" : "At shop"), clear: () => setServiciosParams((p) => ({ ...p, svisit: "" })) });
    if (serviciosParams.sfeat) {
      const defs = getServiciosFeatureDefs(serviciosParams.stype);
      const set = parseCsvSet(serviciosParams.sfeat);
      const names = Array.from(set).map((k) => defs.find((d) => d.key === k)?.label[lang] || k);
      if (names.length) chips.push({ key: "sfeat", text: names.join(", "), clear: () => setServiciosParams((p) => ({ ...p, sfeat: "" })) });
    }
    return chips;
  }, [isServicios, serviciosParams.savail, serviciosParams.svisit, serviciosParams.sfeat, serviciosParams.stype, lang]);

const visible = useMemo(() => {
  const topIds = new Set(businessTop.map((x) => x.id));
  const main = topIds.size ? filtered.filter((x) => !topIds.has(x.id)) : filtered;
  const mixed = category === "servicios" ? mixServicios(main) : mixFair(main);
  if (isEnVenta) {
    return mixed.slice(0, infiniteScrollLimit);
  }
  const start = (pageClamped - 1) * perPage;
  return mixed.slice(start, start + perPage);
}, [filtered, pageClamped, perPage, businessTop, isEnVenta, infiniteScrollLimit]);

  // Infinite scroll: when sentinel is in view, load next batch (en-venta only)
  useEffect(() => {
    if (!isEnVenta || visible.length >= filtered.length) return;
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInfiniteScrollLimit((n) => Math.min(n + perPage, filtered.length));
        }
      },
      { rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [isEnVenta, visible.length, filtered.length, perPage]);

  /** Servicios-only: Featured(3) -> Standard(4) -> Featured(3) -> Standard(4) -> ... */
  const serviciosSectioned = useMemo(() => {
    if (category !== "servicios") return null;
    const premium: Listing[] = [];
    const plus: Listing[] = [];
    const standard: Listing[] = [];
    for (const x of filtered) {
      if (x.category !== "servicios") continue;
      const t = inferServicesTier(x);
      if (t === "premium") premium.push(x);
      else if (t === "plus") plus.push(x);
      else standard.push(x);
    }
    const sortedPremium = sortServiciosTierBucket(premium);
    const sortedPlus = sortServiciosTierBucket(plus);
    const sortedStandard = sortServiciosTierBucket(standard);

    const featuredStream: Listing[] = [];
    let pi = 0;
    let pl = 0;
    for (;;) {
      let added = 0;
      if (pi < sortedPremium.length) { featuredStream.push(sortedPremium[pi++]); added++; }
      if (pi < sortedPremium.length) { featuredStream.push(sortedPremium[pi++]); added++; }
      if (pl < sortedPlus.length) { featuredStream.push(sortedPlus[pl++]); added++; }
      if (added === 0) break;
    }
    const standardStream = sortedStandard;

    type Block = { type: "featured"; items: Listing[] } | { type: "standard"; items: Listing[] };
    const renderBlocks: Block[] = [];
    let fi = 0;
    let si = 0;
    let turn = 0;
    while (fi < featuredStream.length || si < standardStream.length) {
      if (turn % 2 === 0) {
        const items = featuredStream.slice(fi, fi + 3);
        fi += items.length;
        if (items.length) renderBlocks.push({ type: "featured", items });
      } else {
        const items = standardStream.slice(si, si + 4);
        si += items.length;
        if (items.length) renderBlocks.push({ type: "standard", items });
      }
      turn++;
    }
    return { renderBlocks };
  }, [category, filtered]);

  const locationLabel = useMemo(() => {
    if (zipMode) return `ZIP ${zipClean}`;
    const alias = (CITY_ALIASES as Record<string, string>)[normalize(city)];
    return alias ?? city ?? DEFAULT_CITY;
  }, [zipMode, zipClean, city]);

  const activeChips = useMemo(() => {
    const chips: Array<{ key: string; text: string; clear: () => void }> = [];

    if (q.trim())
      chips.push({
        key: "q",
        text: `${UI.search[lang]}: ${q.trim()}`,
        clear: () => setQ(""),
      });

    if (zipMode) {
      chips.push({
        key: "zip",
        text: `ZIP: ${zipClean}`,
        clear: () => setZip(""),
      });
    } else if (normalize(city) && normalize(city) !== normalize(DEFAULT_CITY)) {
      chips.push({
        key: "city",
        text: `${locationLabel}`,
        clear: () => setCity(DEFAULT_CITY),
      });
    }

    if (radiusMi !== DEFAULT_RADIUS_MI) {
      chips.push({
        key: "r",
        text: `${UI.radius[lang]}: ${radiusMi} mi`,
        clear: () => setRadiusMi(DEFAULT_RADIUS_MI),
      });
    }

    // ✓ Rentas chips (only show when in rentas + has params)
    if (category === "rentas") {
      if (rentasParams.rpmin) chips.push({ key: "rpmin", text: `Min: $${rentasParams.rpmin}`, clear: () => setRentasParams((p) => ({ ...p, rpmin: "" })) });
      if (rentasParams.rpmax) chips.push({ key: "rpmax", text: `Max: $${rentasParams.rpmax}`, clear: () => setRentasParams((p) => ({ ...p, rpmax: "" })) });
      if (rentasParams.rbeds) chips.push({ key: "rbeds", text: `${lang === "es" ? "Recámaras" : "Beds"}: ${rentasParams.rbeds}`, clear: () => setRentasParams((p) => ({ ...p, rbeds: "" })) });
      if (rentasParams.rbaths) chips.push({ key: "rbaths", text: `${lang === "es" ? "Baños" : "Baths"}: ${rentasParams.rbaths}`, clear: () => setRentasParams((p) => ({ ...p, rbaths: "" })) });
      if (rentasParams.rtype) chips.push({ key: "rtype", text: `${lang === "es" ? "Tipo" : "Type"}: ${rentasParams.rtype}`, clear: () => setRentasParams((p) => ({ ...p, rtype: "" })) });
      if (rentasParams.rpets) chips.push({ key: "rpets", text: `${lang === "es" ? "Mascotas" : "Pets"}: ${rentasParams.rpets}`, clear: () => setRentasParams((p) => ({ ...p, rpets: "" })) });
      if (rentasParams.rparking) chips.push({ key: "rparking", text: `${lang === "es" ? "Estacion." : "Parking"}: ${rentasParams.rparking}`, clear: () => setRentasParams((p) => ({ ...p, rparking: "" })) });
      if (rentasParams.rfurnished) chips.push({ key: "rfurnished", text: `${lang === "es" ? "Amueblado" : "Furnished"}: ${rentasParams.rfurnished}`, clear: () => setRentasParams((p) => ({ ...p, rfurnished: "" })) });
      if (rentasParams.rutilities) chips.push({ key: "rutilities", text: `${lang === "es" ? "Utilidades" : "Utilities"}: ${rentasParams.rutilities}`, clear: () => setRentasParams((p) => ({ ...p, rutilities: "" })) });
      if (rentasParams.ravailable) chips.push({ key: "ravailable", text: `${lang === "es" ? "Disponible" : "Available"}: ${rentasParams.ravailable}`, clear: () => setRentasParams((p) => ({ ...p, ravailable: "" })) });
      if (rentasParams.rsqmin) chips.push({ key: "rsqmin", text: `Sqft min: ${rentasParams.rsqmin}`, clear: () => setRentasParams((p) => ({ ...p, rsqmin: "" })) });
      if (rentasParams.rsqmax) chips.push({ key: "rsqmax", text: `Sqft max: ${rentasParams.rsqmax}`, clear: () => setRentasParams((p) => ({ ...p, rsqmax: "" })) });
      if (rentasParams.rleaseterm) chips.push({ key: "rleaseterm", text: `${lang === "es" ? "Contrato" : "Lease"}: ${rentasParams.rleaseterm}`, clear: () => setRentasParams((p) => ({ ...p, rleaseterm: "" })) });
      if (rentasParams.rseller) chips.push({ key: "rseller", text: `${lang === "es" ? "Anunciante" : "Posted by"}: ${rentasParams.rseller === "business" ? (lang === "es" ? "Negocio" : "Business") : (lang === "es" ? "Personal" : "Personal")}`, clear: () => setRentasParams((p) => ({ ...p, rseller: "" })) });
    }


    // ✓ Autos chips (only show when in autos + has params)
    if (category === "autos") {
      if (autosParams.aymin) chips.push({ key: "aymin", text: `${lang === "es" ? "Año min" : "Year min"}: ${autosParams.aymin}`, clear: () => setAutosParams((p) => ({ ...p, aymin: "" })) });
      if (autosParams.aymax) chips.push({ key: "aymax", text: `${lang === "es" ? "Año max" : "Year max"}: ${autosParams.aymax}`, clear: () => setAutosParams((p) => ({ ...p, aymax: "" })) });
      if (autosParams.amake) chips.push({ key: "amake", text: `${lang === "es" ? "Marca" : "Make"}: ${autosParams.amake}`, clear: () => setAutosParams((p) => ({ ...p, amake: "" })) });
      if (autosParams.amodel) chips.push({ key: "amodel", text: `${lang === "es" ? "Modelo" : "Model"}: ${autosParams.amodel}`, clear: () => setAutosParams((p) => ({ ...p, amodel: "" })) });
      if (autosParams.aseller) chips.push({ key: "aseller", text: `${lang === "es" ? "Vendedor" : "Seller"}: ${autosParams.aseller === "business" ? (lang === "es" ? "Negocio" : "Business") : (lang === "es" ? "Personal" : "Personal")}`, clear: () => setAutosParams((p) => ({ ...p, aseller: "" })) });
      if (autosParams.amilesmax) chips.push({ key: "amilesmax", text: `${lang === "es" ? "Millas máx" : "Miles max"}: ${autosParams.amilesmax}`, clear: () => setAutosParams((p) => ({ ...p, amilesmax: "" })) });
      if (autosParams.aseller) chips.push({ key: "aseller", text: `${lang === "es" ? "Vendedor" : "Seller"}: ${autosParams.aseller === "business" ? (lang === "es" ? "Negocio" : "Business") : (lang === "es" ? "Personal" : "Personal")}`, clear: () => setAutosParams((p) => ({ ...p, aseller: "" })) });
      if (autosParams.acond) chips.push({ key: "acond", text: `${lang === "es" ? "Condición" : "Condition"}: ${autosParams.acond}`, clear: () => setAutosParams((p) => ({ ...p, acond: "" })) });
    }

    
    // ✓ Empleos chips (only show when in empleos + has params)
    if (category === "empleos") {
      if (empleosParams.ejob) chips.push({ key: "ejob", text: `${lang === "es" ? "Tipo" : "Type"}: ${empleoJobTypeLabel(empleosParams.ejob as any, lang) ?? empleosParams.ejob}`, clear: () => setEmpleosParams((p) => ({ ...p, ejob: "" })) });
      if (empleosParams.eremote) chips.push({ key: "eremote", text: `${lang === "es" ? "Modalidad" : "Mode"}: ${empleosParams.eremote === "remote" ? (lang === "es" ? "Remoto" : "Remote") : (lang === "es" ? "Presencial" : "On-site")}`, clear: () => setEmpleosParams((p) => ({ ...p, eremote: "" })) });
      if (empleosParams.epaymin) chips.push({ key: "epaymin", text: `${lang === "es" ? "Pago mín" : "Pay min"}: $${empleosParams.epaymin}`, clear: () => setEmpleosParams((p) => ({ ...p, epaymin: "" })) });
      if (empleosParams.epaymax) chips.push({ key: "epaymax", text: `${lang === "es" ? "Pago máx" : "Pay max"}: $${empleosParams.epaymax}`, clear: () => setEmpleosParams((p) => ({ ...p, epaymax: "" })) });
      if (empleosParams.eindustry) chips.push({ key: "eindustry", text: `${lang === "es" ? "Industria" : "Industry"}: ${empleoIndustryLabel(empleosParams.eindustry as any, lang)}`, clear: () => setEmpleosParams((p) => ({ ...p, eindustry: "" })) });
    }

    // ✓ Servicios chips (only show when in servicios + has params)
    if (category === "servicios") {
      if (serviciosParams.stype) {
        const lbl = servicioLabel(serviciosParams.stype, lang);
        if (lbl) chips.push({ key: "stype", text: `${lang === "es" ? "Tipo" : "Type"}: ${lbl}`, clear: () => setServiciosParams((p) => ({ ...p, stype: "" })) });
      }
      if (serviciosParams.savail) chips.push({ key: "savail", text: `${lang === "es" ? "Horario" : "Availability"}: ${servicioAvailLabel(serviciosParams.savail as any, lang)}`, clear: () => setServiciosParams((p) => ({ ...p, savail: "" })) });
      if (serviciosParams.svisit) chips.push({ key: "svisit", text: `${lang === "es" ? "Modalidad" : "Visit"}: ${serviciosParams.svisit === "comes" ? (lang === "es" ? "A domicilio" : "Comes to you") : (lang === "es" ? "En local" : "At shop")}`, clear: () => setServiciosParams((p) => ({ ...p, svisit: "" })) });
      if (serviciosParams.sfeat) {
        const defs = getServiciosFeatureDefs(serviciosParams.stype);
        const set = parseCsvSet(serviciosParams.sfeat);
        const names = Array.from(set).map((k) => defs.find((d) => d.key === k)?.label[lang] || k);
        if (names.length) chips.push({ key: "sfeat", text: `${lang === "es" ? "Más" : "More"}: ${names.join(", ")}`, clear: () => setServiciosParams((p) => ({ ...p, sfeat: "" })) });
      }
    }

    // ✓ En Venta chips (only show when in en-venta + has params)
    if (category === "en-venta") {
      if (ventaParams.vpmin) chips.push({ key: "vpmin", text: `${lang === "es" ? "Precio mín" : "Price min"}: $${ventaParams.vpmin}`, clear: () => setVentaParams((p) => ({ ...p, vpmin: "" })) });
      if (ventaParams.vpmax) chips.push({ key: "vpmax", text: `${lang === "es" ? "Precio máx" : "Price max"}: $${ventaParams.vpmax}`, clear: () => setVentaParams((p) => ({ ...p, vpmax: "" })) });
      if (ventaParams.vcond) chips.push({ key: "vcond", text: `${lang === "es" ? "Condición" : "Condition"}: ${ventaConditionLabel(ventaParams.vcond as any, lang)}`, clear: () => setVentaParams((p) => ({ ...p, vcond: "" })) });
      if (ventaParams.vtype) chips.push({ key: "vtype", text: `${lang === "es" ? "Tipo" : "Type"}: ${ventaItemTypeLabel(ventaParams.vtype as any, lang)}`, clear: () => setVentaParams((p) => ({ ...p, vtype: "" })) });
      if (ventaParams.vpostedToday) chips.push({ key: "vpostedToday", text: lang === "es" ? "Publicado hoy" : "Posted today", clear: () => setVentaParams((p) => ({ ...p, vpostedToday: false })) });
    }

    // ✓ Bienes Raíces chips (only show when in bienes-raices + has params)
    if (category === "bienes-raices") {
      if (brParams.subcategoria) chips.push({ key: "brSub", text: `${lang === "es" ? "Tipo" : "Type"}: ${getBienesRaicesSubcategoryLabel(brParams.subcategoria, lang)}`, clear: () => setBrParams((p) => ({ ...p, subcategoria: "" })) });
      if (brParams.priceMin) chips.push({ key: "brPmin", text: `${lang === "es" ? "Precio mín" : "Price min"}: $${brParams.priceMin}`, clear: () => setBrParams((p) => ({ ...p, priceMin: "" })) });
      if (brParams.priceMax) chips.push({ key: "brPmax", text: `${lang === "es" ? "Precio máx" : "Price max"}: $${brParams.priceMax}`, clear: () => setBrParams((p) => ({ ...p, priceMax: "" })) });
      if (brParams.beds) chips.push({ key: "brBeds", text: `${lang === "es" ? "Recámaras" : "Beds"}: ${brParams.beds === "studio" ? (lang === "es" ? "Estudio" : "Studio") : brParams.beds}`, clear: () => setBrParams((p) => ({ ...p, beds: "" })) });
      if (brParams.baths) chips.push({ key: "brBaths", text: `${lang === "es" ? "Baños" : "Baths"}: ${brParams.baths}`, clear: () => setBrParams((p) => ({ ...p, baths: "" })) });
    }

    // ✓ Clases chips (only show when in clases + has params)
    if (category === "clases") {
      if (clasesParams.csub) chips.push({ key: "csub", text: `${lang === "es" ? "Materia" : "Subject"}: ${claseSubjectLabel(clasesParams.csub as any, lang)}`, clear: () => setClasesParams((p) => ({ ...p, csub: "" })) });
      if (clasesParams.clevel) chips.push({ key: "clevel", text: `${lang === "es" ? "Nivel" : "Level"}: ${claseLevelLabel(clasesParams.clevel as any, lang)}`, clear: () => setClasesParams((p) => ({ ...p, clevel: "" })) });
      if (clasesParams.cmode) chips.push({ key: "cmode", text: `${lang === "es" ? "Modalidad" : "Mode"}: ${claseModeLabel(clasesParams.cmode as any, lang)}`, clear: () => setClasesParams((p) => ({ ...p, cmode: "" })) });
    }

    // ✓ Comunidad chips (only show when in comunidad + has params)
    if (category === "comunidad") {
      if (comunidadParams.gtype) chips.push({ key: "gtype", text: `${lang === "es" ? "Tipo" : "Type"}: ${comunidadTypeLabel(comunidadParams.gtype as any, lang)}`, clear: () => setComunidadParams((p) => ({ ...p, gtype: "" })) });
    }

    if (sellerType) {
      chips.push({
        key: "seller",
        text: `${UI.seller[lang]}: ${SELLER_LABELS[sellerType][lang]}`,
        clear: () => setSellerType(null),
      });
    }

    if (onlyWithImage) {
      chips.push({
        key: "img",
        text: `${UI.hasImage[lang]}`,
        clear: () => setOnlyWithImage(false),
      });
    }

    return chips;
  }, [q, lang, zipMode, zipClean, city, locationLabel, radiusMi, category, sellerType, onlyWithImage, rentasParams, autosParams, empleosParams, serviciosParams, ventaParams, clasesParams, comunidadParams]);

  useEffect(() => {
    setUrlParams({
      lang,
      q: q.trim() || null,
      cat: category !== "all" ? category : null,
      sort: sort !== "newest" ? sort : null,
      view: view !== "grid" ? view : null,
      r: radiusMi !== DEFAULT_RADIUS_MI ? String(radiusMi) : null,
      zip: zipMode ? zipClean : null,
      city: zipMode
        ? null
        : resolvedCity.from !== "default" && normalize(resolvedCity.name) !== normalize(DEFAULT_CITY)
          ? resolvedCity.name
          : null,

      // ✓ Rentas params are preserved in URL only when cat=rentas
      rpmin: category === "rentas" && rentasParams.rpmin ? rentasParams.rpmin : null,
      rpmax: category === "rentas" && rentasParams.rpmax ? rentasParams.rpmax : null,
      rbeds: category === "rentas" && rentasParams.rbeds ? rentasParams.rbeds : null,
      rbaths: category === "rentas" && rentasParams.rbaths ? rentasParams.rbaths : null,
      rtype: category === "rentas" && rentasParams.rtype ? rentasParams.rtype : null,
      rpets: category === "rentas" && rentasParams.rpets ? rentasParams.rpets : null,
      rparking: category === "rentas" && rentasParams.rparking ? rentasParams.rparking : null,
      rfurnished: category === "rentas" && rentasParams.rfurnished ? rentasParams.rfurnished : null,
      rutilities: category === "rentas" && rentasParams.rutilities ? rentasParams.rutilities : null,
      ravailable: category === "rentas" && rentasParams.ravailable ? rentasParams.ravailable : null,
      rsqmin: category === "rentas" && rentasParams.rsqmin ? rentasParams.rsqmin : null,
      rsqmax: category === "rentas" && rentasParams.rsqmax ? rentasParams.rsqmax : null,
      rleaseterm: category === "rentas" && rentasParams.rleaseterm ? rentasParams.rleaseterm : null,
      rseller: category === "rentas" && rentasParams.rseller ? rentasParams.rseller : null,

      // ✓ Autos params are preserved in URL only when cat=autos
      aymin: category === "autos" && autosParams.aymin ? autosParams.aymin : null,
      aymax: category === "autos" && autosParams.aymax ? autosParams.aymax : null,
      amake: category === "autos" && autosParams.amake ? autosParams.amake : null,
      amodel: category === "autos" && autosParams.amodel ? autosParams.amodel : null,
      amilesmax: category === "autos" && autosParams.amilesmax ? autosParams.amilesmax : null,
      acond: category === "autos" && autosParams.acond ? autosParams.acond : null,
      aseller: category === "autos" && autosParams.aseller ? autosParams.aseller : null,

      
      // ✓ Empleos params are preserved in URL only when cat=empleos
      ejob: category === "empleos" && empleosParams.ejob ? empleosParams.ejob : null,
      eremote: category === "empleos" && empleosParams.eremote ? empleosParams.eremote : null,
      epaymin: category === "empleos" && empleosParams.epaymin ? empleosParams.epaymin : null,
      epaymax: category === "empleos" && empleosParams.epaymax ? empleosParams.epaymax : null,
      eindustry: category === "empleos" && empleosParams.eindustry ? empleosParams.eindustry : null,

      // ✓ Servicios params are preserved in URL only when cat=servicios
      stype: category === "servicios" && serviciosParams.stype ? serviciosParams.stype : null,
      savail: category === "servicios" && serviciosParams.savail ? serviciosParams.savail : null,
      svisit: category === "servicios" && serviciosParams.svisit ? serviciosParams.svisit : null,

// ✓ En Venta params are preserved in URL only when cat=en-venta
      vpmin: category === "en-venta" && ventaParams.vpmin ? ventaParams.vpmin : null,
      vpmax: category === "en-venta" && ventaParams.vpmax ? ventaParams.vpmax : null,
      vcond: category === "en-venta" && ventaParams.vcond ? ventaParams.vcond : null,
      vtype: category === "en-venta" && ventaParams.vtype ? ventaParams.vtype : null,
      vneg: category === "en-venta" && ventaParams.vneg ? ventaParams.vneg : null,
      vpostedToday: category === "en-venta" && ventaParams.vpostedToday ? "1" : null,

      // ✓ Clases params are preserved in URL only when cat=clases
      csub: category === "clases" && clasesParams.csub ? clasesParams.csub : null,
      clevel: category === "clases" && clasesParams.clevel ? clasesParams.clevel : null,
      cmode: category === "clases" && clasesParams.cmode ? clasesParams.cmode : null,

      // ✓ Comunidad params are preserved in URL only when cat=comunidad
      gtype: category === "comunidad" && comunidadParams.gtype ? comunidadParams.gtype : null,

      // ✓ Bienes Raíces params are preserved in URL only when cat=bienes-raices
      brSub: category === "bienes-raices" && brParams.subcategoria ? brParams.subcategoria : null,
      brPmin: category === "bienes-raices" && brParams.priceMin ? brParams.priceMin : null,
      brPmax: category === "bienes-raices" && brParams.priceMax ? brParams.priceMax : null,
      brBeds: category === "bienes-raices" && brParams.beds ? brParams.beds : null,
      brBaths: category === "bienes-raices" && brParams.baths ? brParams.baths : null,
    });
  }, [lang, q, category, sort, view, radiusMi, zipMode, zipClean, city, rentasParams, autosParams, empleosParams, serviciosParams, ventaParams, clasesParams, comunidadParams, brParams]);

  const resetAllFilters = () => {
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
    setSuggestions([]);
    setSuggestionsOpen(false);
    setRentasParams(EMPTY_RENTAS_PARAMS);
    setAutosParams(EMPTY_AUTOS_PARAMS);
    setEmpleosParams(EMPTY_EMPLEOS_PARAMS);
    setServiciosDraft(EMPTY_SERVICIOS_PARAMS);
    setVentaParams(EMPTY_VENTA_PARAMS);
    setClasesParams(EMPTY_CLASES_PARAMS);
    setComunidadParams(EMPTY_COMUNIDAD_PARAMS);
    setBrParams(EMPTY_BIENES_RAICES_PARAMS);
  };

  const handleSaveSearch = async () => {
    setSaveSearchLoading(true);
    setSaveSearchDone(false);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert(lang === "es" ? "Inicia sesión para guardar búsquedas." : "Sign in to save searches.");
        setSaveSearchLoading(false);
        return;
      }
      await supabase.from("saved_searches").insert({
        user_id: user.id,
        query: q.trim().slice(0, 500),
        category: category,
        city: city.trim().slice(0, 200),
      });
      setSaveSearchDone(true);
      setTimeout(() => setSaveSearchDone(false), 3000);
    } catch {
      alert(lang === "es" ? "No se pudo guardar la búsqueda." : "Could not save search.");
    } finally {
      setSaveSearchLoading(false);
    }
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

          let bestCity = DEFAULT_CITY;
          let bestD = Number.POSITIVE_INFINITY;

          for (const c of CA_CITIES) {
            const d = haversineMi(me, { lat: c.lat, lng: c.lng });
            if (d < bestD) {
              bestD = d;
              bestCity = c.city;
            }
          }

          setZip("");
          setCity(bestCity);
          setCityQuery(bestCity);

          setLocMsg(
            lang === "es"
              ? `Ubicación detectada cerca de ${bestCity}.`
              : `Location detected near ${bestCity}.`
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

  const mapsHref = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
function applyTravelParams(list: Listing[], p: TravelParams): Listing[] {
  const ttype = (p.ttype ?? "").trim();
  const bmin = Number((p.tbmin ?? "").replace(/[^0-9.]/g, ""));
  const bmax = Number((p.tbmax ?? "").replace(/[^0-9.]/g, ""));

  const typeKeywords: Record<string, string[]> = {
    package: ["paquete", "packages", "package", "resort", "all inclusive", "todo incluido"],
    cruise: ["crucero", "cruise", "naviera"],
    hotel: ["hotel", "resort", "hospedaje", "stay"],
    flight: ["vuelo", "flight", "air", "aereo", "aéreo"],
    tour: ["tour", "excursion", "excursión", "paseo"],
    other: [],
  };

  return list.filter((it) => {
    const hay = `${it.title.es} ${it.title.en} ${it.blurb.es} ${it.blurb.en}`.toLowerCase();

    if (ttype) {
      const keys = typeKeywords[ttype] ?? [];
      if (keys.length > 0 && !keys.some((k) => hay.includes(k))) return false;
    }

    const price = parsePriceLabel(it.priceLabel.en) ?? parsePriceLabel(it.priceLabel.es) ?? Number.NaN;
    if (Number.isFinite(bmin) && bmin > 0 && Number.isFinite(price) && price < bmin) return false;
    if (Number.isFinite(bmax) && bmax > 0 && Number.isFinite(price) && price > bmax) return false;

    return true;
  });
}

function normalizeSpace(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

const parseAutoFromTitle = (title: string) => {
  const t = normalizeSpace(title);
  // Extract mileage (supports: 138k miles, 138,000 mi, 138k millas)
  const mileageMatch = t.match(/\b(\d{1,3}(?:[\.,]\d{3})+|\d+(?:\.\d+)?)\s*(k)?\s*(miles|millas|mi)\b/i);
  let mileageLabel: string | null = null;
  if (mileageMatch) {
    const rawNum = mileageMatch[1];
    const hasK = Boolean(mileageMatch[2]);
    const num = Number(String(rawNum).replace(/,/g, "").replace(/\./g, (m: string, off: number, str: string) => {
      // Keep decimals like 12.5; treat 138.000 as 138000 only if it looks like a thousands separator group.
      return m;
    }));
    if (!Number.isNaN(num)) {
      const miles = hasK ? Math.round(num * 1000) : Math.round(num);
      mileageLabel = miles >= 1000 ? `${miles.toLocaleString()} mi` : `${miles} mi`;
    } else {
      mileageLabel = normalizeSpace(mileageMatch[0]).replace(/millas|miles/i, "mi");
    }
  }

  // Extract year at start if present
  const yearMatch = t.match(/^(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : null;

  // Attempt to derive make/model tokens when title starts with year
  let specLabel: string | null = null;
  if (year) {
    // Remove year, remove mileage chunk, split remaining by separators
    const withoutMileage = mileageMatch ? t.replace(mileageMatch[0], "").trim() : t;
    const afterYear = normalizeSpace(withoutMileage.replace(new RegExp("^" + year + "\\b"), "").trim());
    const cleaned = afterYear.replace(/^[\-–—:\s]+/, "").trim();
    const tokens = cleaned.split(" ").filter(Boolean);
    const mm = tokens.slice(0, 3).join(" ").trim(); // allow 2–3 word models (e.g., "F-150 XLT")
    if (mm) specLabel = `${year} • ${mm}`;
  }

  return { year, specLabel, mileageLabel };
};

const inferRentasFromTitle = (title: string) => {
  const t = title.toLowerCase();
  if (/(\bcuarto\b|\bhabitaci[oó]n\b|\broom\b)/i.test(t)) return "room";
  if (/(\bstudio\b)/i.test(t)) return "studio";
  return null;
};


function parseEmpleoFromText(title: string, blurb: string, payLabel: string) {
  const t = `${title} ${blurb}`.toLowerCase();

  const isRemote = /(\bremoto\b|\bremote\b|\bhybrid\b|\bh[ií]brido\b|\bdesde casa\b|\bwork from home\b)/i.test(t);

  let jobType: "full" | "part" | "contract" | "temp" | null = null;
  if (/(tiempo completo|full[-\s]?time)/i.test(t)) jobType = "full";
  else if (/(tiempo parcial|part[-\s]?time)/i.test(t)) jobType = "part";
  else if (/(contrato|contract)/i.test(t)) jobType = "contract";
  else if (/(temporal|temp(\b|\s)|seasonal)/i.test(t)) jobType = "temp";

  // Salary / rate hint (only if explicitly present)
  const salaryMatch = (`${title} ${blurb} ${payLabel}`).match(/\$\s?\d+(?:[\.,]\d+)?\s?(?:\/\s?(?:h|hr|hora))?/i);
  const salaryLabel = salaryMatch ? normalizeSpace(salaryMatch[0].replace(/\s+/g, " ")) : null;

  return { isRemote, jobType, salaryLabel };
}

const empleoJobTypeLabel = (jobType: "full" | "part" | "contract" | "temp" | null, lang: Lang) => {
  if (!jobType) return null;
  const map = {
    full: { es: "Tiempo completo", en: "Full-time" },
    part: { es: "Tiempo parcial", en: "Part-time" },
    contract: { es: "Contrato", en: "Contract" },
    temp: { es: "Temporal", en: "Temporary" },
  } as const;
  return map[jobType][lang];
};

const serviceTagsFromText = (title: string, blurb: string) => {
  const t = `${title} ${blurb}`.toLowerCase();
  const tags: string[] = [];

  const add = (tag: string) => {
    if (!tags.includes(tag)) tags.push(tag);
  };

  if (/(plomer[ií]a|plumbing)/i.test(t)) add("Plomería");
  if (/(jardin|yard|mowing|pasto)/i.test(t)) add("Jardinería");
  if (/(limpieza|cleaning|cleanup)/i.test(t)) add("Limpieza");
  if (/(electric|electricidad|electricista)/i.test(t)) add("Electricidad");
  if (/(pintura|painting)/i.test(t)) add("Pintura");
  if (/(mudanza|moving)/i.test(t)) add("Mudanzas");
  if (/(tech|computadora|computer|wifi|internet)/i.test(t)) add("Tecnología");
  if (/(tutor|clase|lessons|classes)/i.test(t)) add("Clases");
  if (/(reparaci[oó]n|repair)/i.test(t)) add("Reparación");

  return tags.slice(0, 3);
};

const extractDepositFromText = (text: string): string | null => {
  const t = text.toLowerCase();
  // Look for "deposit"/"depósito"/"depos" plus a dollar amount nearby
  const m =
    t.match(/\$\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{1,6})(?:\s*(?:deposit|dep[oó]sito|depos))?/) ||
    t.match(/(?:deposit|dep[oó]sito|depos)\s*[:\-]?\s*\$\s*([0-9]{1,3}(?:,[0-9]{3})*|[0-9]{1,6})/);
  if (!m) return null;
  const amt = m[1];
  // Avoid showing rent price as "deposit" by requiring the keyword somewhere in the text
  if (!/(deposit|dep[oó]sito|depos)/.test(t)) return null;
  return `$${amt}`;
};

const rentasAvailabilityLabel = (x: Listing, lang: Lang): string | null => {
  if (x.availableNow) return lang === "es" ? "Disponible ahora" : "Available now";
  if (typeof x.availableInDays === "number") {
    return lang === "es"
      ? `Disponible en ${x.availableInDays} días`
      : `Available in ${x.availableInDays} days`;
  }
  return null;
};

const microLine = (x: Listing) => {
  // Phase C: category-specific micro facts
  // Autos gets a dedicated spec + mileage line in the card (stronger scan),
  // so we keep microLine for other categories only.
  if (x.category === "autos") {
    return null;
  }
  if (x.category === "rentas") {
    const deposit = extractDepositFromText(x.blurb[lang]);
    const avail = rentasAvailabilityLabel(x, lang);
    const bits = [
      typeof x.beds === "number"
        ? `${x.beds === 0 ? "Studio" : `${x.beds} bd`}`
        : inferRentasFromTitle(x.title[lang]) === "room"
          ? (lang === "es" ? "Cuarto" : "Room")
          : inferRentasFromTitle(x.title[lang]) === "studio"
            ? "Studio"
            : null,
      typeof x.baths === "number" ? `${x.baths} ba` : null,
      x.propertyType ? String(x.propertyType) : null,
      x.furnished ? (lang === "es" ? "Amueblado" : "Furnished") : null,
      deposit ? `${lang === "es" ? "Depósito" : "Deposit"} ${deposit}` : null,
      avail,
      x.leaseTerm ? `${lang === "es" ? "Contrato" : "Lease"} ${x.leaseTerm}` : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }
  if (x.category === "empleos") {
    const bits = [
      (x as any).jobType ? String((x as any).jobType) : null,
      (x as any).pay ? String((x as any).pay) : null,
      (x as any).remote ? (lang === "es" ? "Remoto" : "Remote") : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }
  if (x.category === "servicios") {
    const bits = [
      (x as any).serviceType ? String((x as any).serviceType) : null,
      (x as any).pricing ? String((x as any).pricing) : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }
  if (x.category === "en-venta") {
    const bits = [
      (x as any).condition ? String((x as any).condition) : null,
      (x as any).itemType ? String((x as any).itemType) : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }
  if (x.category === "clases") {
    const bits = [
      (x as any).subject ? String((x as any).subject) : null,
      (x as any).level ? String((x as any).level) : null,
      (x as any).mode ? String((x as any).mode) : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }
  if (x.category === "comunidad") {
    const bits = [
      (x as any).ctype ? String((x as any).ctype) : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" • ") : null;
  }
  return null;
};

const ActionPills = (x: Listing) => {
  const pills: Array<{ href: string; label: string; external?: boolean }> = [];
  if (x.phone) pills.push({ href: `tel:${x.phone}`, label: lang === "es" ? "Llamar" : "Call" });
  if (x.email) pills.push({ href: `mailto:${x.email}`, label: lang === "es" ? "Email" : "Email" });
  if (x.website) pills.push({ href: x.website, label: lang === "es" ? "Web" : "Website", external: true });
  if (x.address) pills.push({ href: mapsHref(x.address), label: lang === "es" ? "Mapa" : "Map", external: true });

  if (!pills.length) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Buscar anuncios — LEONIX Clasificados",
            description: "Busca anuncios por categoría, ciudad y filtros en LEONIX Clasificados.",
            url: "/clasificados/lista",
            potentialAction: {
              "@type": "SearchAction",
              target: "/clasificados/lista?search={search_term_string}",
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />

      {pills.slice(0, isMobileUI ? 2 : 4).map((p) => (
        <a
          key={p.href + p.label}
          href={p.href}
          target={p.external ? "_blank" : undefined}
          rel={p.external ? "noreferrer" : undefined}
          className="rounded-full border border-black/10 bg-[#F5F5F5] px-3 py-1.5 text-xs sm:py-1 text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
        >
          {p.label}
        </a>
      ))}
    </div>
  );
};

// ------------------------------------------------------------
// A4.13 — Visual hierarchy (NO ranking impact; UI only)
// ------------------------------------------------------------
type VisualTier = "joya" | "corona" | "corona-oro" | null;

const inferVisualTier = (x: Listing): VisualTier => {
  // Visual-only heuristic (does not affect ranking / filtering):
  // - Businesses: Corona (Lite) vs Corona de Oro (Premium)
  // - Individuals with handle: Joya (LEONIX Pro vibe)
  if (x.sellerType === "business") {
    const hasContact = Boolean(x.phone || x.email);
    const hasProfile = Boolean(x.website || x.address || x.businessName);
    return hasContact && hasProfile ? "corona-oro" : "corona";
  }
  if (x.sellerType === "personal" && x.handle) return "joya";
  return null;
};

/** Rentas-only plan tier for display (Privado Pro / Negocio Standard / Negocio Plus). */
type RentasPlanTier = "privado_pro" | "business_standard" | "business_plus";

function inferRentasPlanTier(x: Listing): RentasPlanTier | null {
  if (x.category !== "rentas") return null;
  const sellerType = x.sellerType ?? (x as any).seller_type ?? "personal";
  if (sellerType === "personal" && isProListing(x)) return "privado_pro";
  if (sellerType === "business") {
    const tier = (x as any).rentasTier ?? (x as any).rentas_tier ?? (x as any).servicesTier;
    if (tier === "plus" || tier === "premium") return "business_plus";
    return "business_standard";
  }
  return null;
}

/** Bienes Raíces business plan tier (Standard vs Plus). Same contract as Rentas negocio. */
function inferBienesRaicesPlanTier(x: Listing): "business_standard" | "business_plus" | null {
  if (x.category !== "bienes-raices") return null;
  const sellerType = x.sellerType ?? (x as any).seller_type ?? "personal";
  if (sellerType !== "business") return null;
  const tier = (x as any).rentasTier ?? (x as any).rentas_tier ?? (x as any).servicesTier;
  if (tier === "plus" || tier === "premium") return "business_plus";
  return "business_standard";
}

const TierBadge = ({ tier, lang }: { tier: VisualTier; lang: Lang }) => {
  if (!tier) return null;

  const label =
    tier === "joya"
      ? lang === "es"
        ? "Joya"
        : "Jewel"
      : tier === "corona"
        ? lang === "es"
          ? "Corona"
          : "Crown"
        : lang === "es"
          ? "Corona de Oro"
          : "Golden Crown";

  const icon = tier === "joya" ? "💎" : tier === "corona" ? "🔑" : "🔑✨";

  const cls =
    tier === "joya"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.16)]"
      : tier === "corona"
        ? "border-yellow-400/32 bg-[#111111]/10 text-yellow-50 shadow-[0_0_0_1px_rgba(250,204,21,0.14)]"
        : "border-yellow-300/80 bg-gradient-to-r from-yellow-500/18 via-yellow-300/14 to-yellow-500/18 text-yellow-50 shadow-[0_0_0_1px_rgba(250,204,21,0.28),0_0_16px_rgba(250,204,21,0.12)]";

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold tracking-wide leading-tight whitespace-nowrap",
        cls
      )}
      title={label}
    >
      <span aria-hidden="true" className="text-[11px] sm:text-[12px] leading-none">
        {icon}
      </span>
      <span className="leading-none">{label}</span>
    </span>
  );
};

const BadgeLegend = ({ lang }: { lang: Lang }) => {
  const summary =
    lang === "es" ? "¿Qué significan las insignias?" : "What do the badges mean?";

  const items: Array<{ tier: VisualTier; text: { es: string; en: string } }> = [
    {
      tier: "corona-oro",
      text: {
        es: "Corona de Oro — negocios con perfil completo y contacto directo.",
        en: "Gold Crown — businesses with a complete profile and direct contact.",
      },
    },
    {
      tier: "corona",
      text: {
        es: "Corona — negocio verificado (presencia profesional).",
        en: "Crown — verified business presence.",
      },
    },
    {
      tier: "joya",
      text: {
        es: "Joya — vendedor personal con perfil mejorado.",
        en: "Jewel — personal seller with an upgraded profile.",
      },
    },
  ];

  return (
    <details className="group mt-2 w-fit max-w-full text-left">
      <summary
        className={cx(
          "cursor-pointer select-none text-xs font-medium text-[#111111]",
          "hover:text-[#111111] focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/60",
          "rounded-md"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#111111]/60" aria-hidden="true" />
          {summary}
          <span
            className="text-[#111111] group-open:rotate-180 transition-transform"
            aria-hidden="true"
          >
            ▾
          </span>
        </span>
      </summary>

      <div className="mt-2 rounded-xl border border-black/10 bg-white/9 p-3">
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.tier ?? "none"} className="flex items-start gap-2">
              <div className="mt-[1px] shrink-0">
                <TierBadge tier={it.tier} lang={lang} />
              </div>
              <div className="text-xs text-[#111111] leading-snug">
                {it.text[lang]}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-[11px] text-[#111111]">
          {lang === "es"
            ? "Las insignias son una señal visual. No reemplazan los filtros."
            : "Badges are a visual signal. They don’t replace filters."}
        </div>
      </div>
    </details>
  );
};


// ------------------------------
// Servicios (Yelp-inspired) cards
// ------------------------------
function Stars({ value = 4.8, count, compact }: { value?: number; count?: string; compact?: boolean }) {
  const v = Math.max(0, Math.min(5, value));
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <div className={cx("flex items-center gap-2", compact ? "text-xs" : "text-sm")}>
      <div className="flex items-center gap-0.5 text-[#D23B3B]">
        {Array.from({ length: full }).map((_, i) => (
          <span key={"f"+i} aria-hidden="true">★</span>
        ))}
        {half ? <span aria-hidden="true">★</span> : null}
        {Array.from({ length: empty }).map((_, i) => (
          <span key={"e"+i} aria-hidden="true" className="opacity-35">★</span>
        ))}
      </div>
      <div className="text-[#2B2B2B]">
        {v.toFixed(1)}{count ? ` (${count})` : ""}
      </div>
    </div>
  );
}

function ServiciosTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.slice(0, 3).map((t) => (
        <span
          key={t}
          className="inline-flex items-center rounded bg-[#F3F3F3] px-2 py-1 text-[11px] font-medium text-[#2B2B2B]"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

function ServiciosVerified({ show, lang }: { show: boolean; lang: Lang }) {
  if (!show) return null;
  return (
    <div className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#1F5FBF]">
      <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#1F5FBF]/10">✓</span>
      <span>{lang === "es" ? "Licencia verificada" : "Verified License"}</span>
    </div>
  );
}

function ServiciosStandardCard(x: Listing, lang: Lang) {
  const href = getListingHref(x, lang);
  const tags = (Array.isArray((x as any).servicesTags) ? (x as any).servicesTags : (serviceTagsFromText(x.title[lang], x.blurb[lang]) ?? [])) as string[];
  const verified = Boolean((x as any).verifiedLicense);
  const img = (Array.isArray((x as any).photos) && (x as any).photos[0]) ? (x as any).photos[0] : "/classifieds-placeholder-bilingual.png";

  return (
    <a
      href={href}
      className={cx(
        "group block rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
      )}
    >
      <div className="aspect-[16/10] overflow-hidden rounded-xl border border-black/10 bg-[#F3F3F3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="mt-3">
        <div className="text-base font-extrabold text-[#111111] leading-snug line-clamp-2">
          {x.title[lang]}
        </div>

        {/* If rating fields exist later, show them. For now keep subtle. */}
        {(x as any).rating ? (
          <div className="mt-2">
            <Stars value={(x as any).rating} count={(x as any).reviewCount} compact />
          </div>
        ) : null}

        <ServiciosTags tags={tags} />
        <ServiciosVerified show={verified} lang={lang} />

        <div className="mt-3">
          <span className="inline-flex w-full items-center justify-center rounded-xl border border-black/10 bg-[#F7F7F7] px-4 py-2 text-sm font-semibold text-[#111111] hover:bg-[#EFEFEF]">
            {lang === "es" ? "Ver negocio" : "View business"}
          </span>
        </div>
      </div>
    </a>
  );

}

function ServiciosStandardMiniCard(x: Listing, lang: Lang) {
  const href = getListingHref(x, lang);
  const tags = (Array.isArray((x as any).servicesTags)
    ? (x as any).servicesTags
    : (serviceTagsFromText(x.title[lang], x.blurb[lang]) ?? [])) as string[];
  const verified = Boolean((x as any).verifiedLicense);
  const response = (x as any).responseTime?.[lang] as string | undefined;
  const img =
    (Array.isArray((x as any).photos) && (x as any).photos[0])
      ? (x as any).photos[0]
      : "/classifieds-placeholder-bilingual.png";

  return (
    <a
      href={href}
      className="group block w-[230px] shrink-0 rounded-2xl border border-black/10 bg-white p-3 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-[#F3F3F3]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt="" className="h-full w-full object-cover" />
      </div>

      <div className="mt-3">
        <div className="text-[15px] font-extrabold leading-snug text-[#111111] line-clamp-2">
          {x.title[lang]}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F2EFE8] px-2.5 py-1 text-[11px] font-semibold text-[#111111]">
              ✓ {lang === "es" ? "Licencia verificada" : "Verified license"}
            </span>
          ) : null}

          {response ? (
            <span className="inline-flex items-center rounded-full bg-[#EAF6EE] px-2.5 py-1 text-[11px] font-semibold text-[#1F7A3A]">
              {lang === "es" ? "Responde" : "Responds"} {response}
            </span>
          ) : null}
        </div>

        {tags?.length ? (
          <div className="mt-2">
            <span className="inline-flex items-center rounded-full border border-black/10 bg-[#F7F7F7] px-3 py-1 text-[12px] font-semibold text-[#111111]">
              {tags[0]}
            </span>
          </div>
        ) : null}
      </div>
    </a>
  );
}

function ServiciosStandardCarouselRow({
  items,
  lang,
  title,
}: {
  items: Listing[];
  lang: Lang;
  title?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = dir === "left" ? -720 : 720;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const label = title ?? (lang === "es" ? "Más opciones" : "More options");

  return (
    <section className="w-full rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-[#111111]">{label}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy("left")}
            className="h-9 w-9 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF]"
            aria-label={lang === "es" ? "Anterior" : "Previous"}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollBy("right")}
            className="h-9 w-9 rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF]"
            aria-label={lang === "es" ? "Siguiente" : "Next"}
          >
            ›
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="mt-4 flex gap-3 overflow-x-auto pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {items.map((x) => (
          <div key={x.id} style={{ scrollSnapAlign: "start" }}>
            {ServiciosStandardMiniCard(x, lang)}
          </div>
        ))}
      </div>
    </section>
  );
}

function ServiciosPlusOrPremiumRow(x: Listing, lang: Lang) {
  const href = getListingHref(x, lang);
  const tierS = inferServicesTier(x);
  const tags = (Array.isArray((x as any).servicesTags) ? (x as any).servicesTags : (serviceTagsFromText(x.title[lang], x.blurb[lang]) ?? [])) as string[];
  const verified = Boolean((x as any).verifiedLicense);
  const response = (x as any).responseTime?.[lang] as string | undefined;
  const img = (Array.isArray((x as any).photos) && (x as any).photos[0]) ? (x as any).photos[0] : "/classifieds-placeholder-bilingual.png";
  const portfolio = Array.isArray((x as any).portfolio) ? (x as any).portfolio : [];

  return (
    <a
      href={href}
      className={cx(
        "group block w-full rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md",
        tierS === "premium" ? "border-[#A98C2A]/55 ring-1 ring-[#A98C2A]/15" : "border-black/10"
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="md:w-[220px]">
          <div className="aspect-[4/3] overflow-hidden rounded-xl border border-black/10 bg-[#F3F3F3]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt="" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xl font-extrabold text-[#111111] leading-tight">
                {x.title[lang]}
              </div>

              {(x as any).rating ? (
                <div className="mt-2">
                  <Stars value={(x as any).rating} count={(x as any).reviewCount} />
                </div>
              ) : null}

              <ServiciosTags tags={tags} />
              <ServiciosVerified show={verified} lang={lang} />

              {response ? (
                <div className="mt-2 text-sm text-[#2B2B2B]">
                  <span className="font-semibold">{lang === "es" ? "Respuesta" : "Response"}:</span>{" "}
                  <span className="text-[#1F7A3A] font-semibold">{response}</span>
                </div>
              ) : null}

              <div className="mt-3 text-sm text-[#2B2B2B] line-clamp-2">
                {x.blurb[lang]}
              </div>
            </div>

            <div className="shrink-0">
              <div className="inline-flex items-center rounded-xl bg-[#111111] px-4 py-2 text-sm font-semibold text-white">
                {lang === "es" ? "Ver negocio" : "View business"}
              </div>
            </div>
          </div>

          {tierS === "premium" && portfolio.length ? (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {portfolio.slice(0, 4).map((p: any, i: number) => (
                <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg border border-black/10 bg-[#F3F3F3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image ?? img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </a>
  );
}

function ServiciosResult(x: Listing, lang: Lang) {
  const tierS = inferServicesTier(x);
  if (tierS === "standard") return ServiciosStandardCard(x, lang);
  return ServiciosPlusOrPremiumRow(x, lang);
}

/** Rentas card: image-first, premium rental layout (hero → price → facts → title → location → business/trust). */
function RentasCard({
  x,
  lang,
  isFav,
  onToggleFav,
  getHref,
  tier,
}: {
  x: Listing;
  lang: Lang;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  getHref: (x: Listing, lang: Lang) => string;
  tier: "corona" | "corona-oro" | "joya" | null;
}) {
  const href = getHref(x, lang);
  const rentLabel = x.priceLabel[lang];
  const avail = rentasAvailabilityLabel(x, lang);
  const rentasPlanTier = inferRentasPlanTier(x);
  const isNegocio = x.sellerType === "business" || (x as any).seller_type === "business";
  const businessName = (x.businessName ?? (x as any).business_name ?? "").trim();

  const images = (x as any).images ?? (x as any).photos;
  const imageUrls = Array.isArray(images) ? images.filter((u): u is string => typeof u === "string") : [];
  const heroUrl = imageUrls[0];
  const mediaCount = imageUrls.length;
  const hasVideo = Boolean((x as any).hasVideo ?? (x as any).proVideoId);

  const detailPairs = (x as any).detailPairs as Array<{ label: string; value: string }> | undefined;
  const sqftFromPairs = Array.isArray(detailPairs)
    ? detailPairs.find((p) => /pies|metros|sqft|sq\s*ft/i.test(p.label))?.value
    : null;
  const beds =
    typeof x.beds === "number"
      ? x.beds === 0
        ? (lang === "es" ? "Estudio" : "Studio")
        : `${x.beds} ${lang === "es" ? "rec" : "bd"}`
      : null;
  const baths = typeof x.baths === "number" ? `${x.baths} ${lang === "es" ? "ba" : "ba"}` : null;
  const sqft = x.sqft ? `${x.sqft} ${lang === "es" ? "pies²" : "sq ft"}` : sqftFromPairs ?? null;
  const quickFacts = [beds, baths, sqft].filter(Boolean).join(" · ") || null;

  const cardBorderStyles =
    rentasPlanTier === "business_plus"
      ? "border-yellow-300/50 ring-1 ring-yellow-300/20 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08),0_0_0_1px_rgba(250,204,21,0.12)]"
      : rentasPlanTier === "business_standard"
        ? "border-yellow-400/30 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)]"
        : rentasPlanTier === "privado_pro"
          ? "border-stone-300/50 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
          : tier === "corona-oro"
            ? "border-yellow-300/50 ring-1 ring-yellow-300/20 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]"
            : tier === "corona"
              ? "border-yellow-400/30 bg-white"
              : tier === "joya"
                ? "border-emerald-400/25 bg-white"
                : "border-black/10 bg-[#F5F5F5]";

  const topBarGradient =
    rentasPlanTier === "business_plus"
      ? "bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent"
      : rentasPlanTier === "business_standard"
        ? "bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent"
        : rentasPlanTier === "privado_pro"
          ? ""
          : tier === "corona-oro"
            ? "bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent"
            : tier === "corona"
              ? "bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent"
              : tier === "joya"
                ? "bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"
                : "";

  return (
    <a
      key={x.id}
      href={href}
      className={cx(
        "group relative block overflow-hidden rounded-2xl border text-left transition-all duration-200 ease-out",
        "hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)] hover:-translate-y-0.5",
        cardBorderStyles
      )}
    >
      {(rentasPlanTier === "privado_pro" ? false : (rentasPlanTier || tier)) ? (
        <div
          aria-hidden="true"
          className={cx("pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px]", topBarGradient)}
        />
      ) : null}

      {/* Hero image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8E8E8]">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : x.hasImage ? (
          <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#111111]/30 text-3xl" aria-hidden>🏠</div>
        )}
        {(mediaCount > 1 || hasVideo) && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
            {mediaCount > 1 && hasVideo
              ? `${mediaCount} ${lang === "es" ? "fotos" : "photos"} · ${lang === "es" ? "Video" : "Video"}`
              : mediaCount > 1
                ? `${mediaCount} ${lang === "es" ? "fotos" : "photos"}`
                : lang === "es"
                  ? "Video"
                  : "Video"}
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(x.id); }}
            className="rounded-full bg-white/95 p-2 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/40"
            aria-label={isFav ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : (lang === "es" ? "Guardar favorito" : "Save favorite")}
          >
            {isFav ? "★" : "☆"}
          </button>
        </div>
      </div>

      <div className={cx("p-3 sm:p-4", rentasPlanTier === "privado_pro" && "sm:p-4")}>
        {/* Price — prominent for privado */}
        <div className={cx(
          "font-extrabold text-[#111111]",
          rentasPlanTier === "privado_pro" ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
        )}>
          {/\$|\d/.test(rentLabel)
            ? (lang === "es" ? "Renta " : "Rent ") + formatListingPrice(rentLabel, { lang })
            : formatListingPrice(rentLabel, { lang })}
          {/\d/.test(rentLabel) && !/\/\s*mes|\/mes|month/i.test(rentLabel) ? (
            <span className="ml-1 text-sm font-semibold text-[#111111]/70">/ {lang === "es" ? "mes" : "mo"}</span>
          ) : null}
        </div>

        {/* Quick facts */}
        {quickFacts && (
          <div className={cx("mt-1.5 text-xs text-[#111111]/80", rentasPlanTier === "privado_pro" && "mt-2")}>
            {quickFacts}
          </div>
        )}

        {/* Title */}
        <h3 className={cx(
          "mt-2 line-clamp-2 font-semibold tracking-tight text-[#111111] leading-snug",
          rentasPlanTier === "privado_pro" ? "text-base sm:text-lg mt-2.5" : "text-base"
        )}>
          {x.title[lang]}
        </h3>

        {/* Location + availability */}
        <div className="mt-1.5 text-sm text-[#111111]/90">
          <span>{x.city}</span>
          {avail ? (
            <>
              <span className="text-[#111111]/50"> · </span>
              <span>{avail}</span>
            </>
          ) : null}
        </div>

        {/* Business / trust line — privado: soft "Privado" only; no business pills */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {rentasPlanTier === "privado_pro" && (
            <span className="text-xs font-medium text-[#111111]/70" title={lang === "es" ? "Anunciante privado" : "Private advertiser"}>
              {lang === "es" ? "Privado" : "Private"}
            </span>
          )}
          {rentasPlanTier === "business_plus" && (
            <span
              className={cx(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide whitespace-nowrap",
                "border-yellow-300/70 bg-yellow-500/12 text-[#111111]"
              )}
              title={lang === "es" ? "Negocio Plus" : "Business Plus"}
            >
              <span aria-hidden="true">🔑</span>
              {lang === "es" ? "Plus" : "Plus"}
            </span>
          )}
          {rentasPlanTier === "business_standard" && (
            <span
              className="inline-flex items-center rounded-full border border-yellow-400/40 bg-[#111111]/05 px-2 py-0.5 text-[10px] font-semibold text-[#111111]/90 whitespace-nowrap"
              title={lang === "es" ? "Perfil profesional" : "Professional profile"}
            >
              {lang === "es" ? "Negocio" : "Business"}
            </span>
          )}
          {!rentasPlanTier && tier ? <TierBadge tier={tier} lang={lang} /> : null}
          {isNegocio && businessName && (
            <span className="text-xs font-medium text-[#111111]/80 truncate max-w-[140px] sm:max-w-[180px]" title={businessName}>
              {businessName}
            </span>
          )}
          {!rentasPlanTier && !isNegocio && (x.sellerType === "personal" || !x.sellerType) && (
            <span className="text-xs text-[#111111]/70">{lang === "es" ? "Privado" : "Private"}</span>
          )}
        </div>

        <div className="mt-2 text-[11px] text-[#111111]/60">
          {x.postedAgo[lang]}
        </div>

        <p className="mt-2 line-clamp-1 text-sm text-[#111111]/85">
          {x.blurb[lang]}
        </p>

        <span
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#111111] group-hover:underline"
          aria-hidden
        >
          {lang === "es" ? "Ver detalle" : "View details"}
          <span className="opacity-70">→</span>
        </span>
      </div>
    </a>
  );
}

/** Bienes Raíces result card: premium real-estate layout (hero → price → title → location → facts → summary → business identity). */
function BienesRaicesCard({
  x,
  lang,
  isFav,
  onToggleFav,
  getHref,
  tier,
}: {
  x: Listing;
  lang: Lang;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  getHref: (x: Listing, lang: Lang) => string;
  tier: VisualTier | null;
}) {
  const href = getHref(x, lang);
  const brPlanTier = inferBienesRaicesPlanTier(x);
  const isBusiness = x.sellerType === "business" || (x as any).seller_type === "business";
  const businessName = (x.businessName ?? (x as any).business_name ?? "").trim();
  const businessMeta = x.category === "bienes-raices" ? parseBusinessMeta((x as any).business_meta) : null;
  const agentName = businessMeta?.negocioAgente?.trim() || "";

  const images = (x as any).images ?? (x as any).photos;
  const imageUrls = Array.isArray(images) ? images.filter((u): u is string => typeof u === "string") : [];
  const heroUrl = imageUrls[0];
  const mediaCount = imageUrls.length;
  const hasVideo = Boolean((x as any).hasVideo ?? (x as any).proVideoId);

  const detailPairs = (x as any).detailPairs as Array<{ label: string; value: string }> | undefined;
  const facts = Array.isArray(detailPairs) ? detailPairs : [];

  const cardBorderStyles =
    brPlanTier === "business_plus"
      ? "border-yellow-300/55 ring-1 ring-yellow-300/25 bg-white shadow-[0_4px_16px_-4px_rgba(0,0,0,0.10),0_0_0_1px_rgba(250,204,21,0.15)]"
      : brPlanTier === "business_standard"
        ? "border-yellow-400/30 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.06)]"
        : "border-black/10 bg-[#F5F5F5]";

  const topBarGradient =
    brPlanTier === "business_plus"
      ? "bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent h-[3px]"
      : brPlanTier === "business_standard"
        ? "bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent h-[2px]"
        : "";

  return (
    <a
      key={x.id}
      href={href}
      className={cx(
        "group relative block overflow-hidden rounded-2xl border text-left transition-all duration-200 ease-out",
        "hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.04)] hover:-translate-y-0.5",
        cardBorderStyles
      )}
    >
      {brPlanTier ? (
        <div
          aria-hidden="true"
          className={cx("pointer-events-none absolute inset-x-0 top-0 z-10", topBarGradient)}
        />
      ) : null}

      {/* Hero image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E8E8E8]">
        {heroUrl ? (
          <img
            src={heroUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
          />
        ) : x.hasImage ? (
          <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#111111]/30 text-3xl" aria-hidden>🏠</div>
        )}
        {(mediaCount > 1 || hasVideo) && (
          <div className="absolute bottom-2 right-2 rounded-md bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
            {mediaCount > 1 && hasVideo
              ? `${mediaCount} ${lang === "es" ? "fotos" : "photos"} · ${lang === "es" ? "Video" : "Video"}`
              : mediaCount > 1
                ? `${mediaCount} ${lang === "es" ? "fotos" : "photos"}`
                : lang === "es"
                  ? "Video"
                  : "Video"}
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(x.id); }}
            className="rounded-full bg-white/95 p-2 shadow-sm hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/40"
            aria-label={isFav ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : (lang === "es" ? "Guardar favorito" : "Save favorite")}
          >
            {isFav ? "★" : "☆"}
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {/* Price */}
        <div className="font-extrabold text-lg sm:text-xl text-[#111111]">
          {formatListingPrice(x.priceLabel[lang], { lang })}
        </div>

        {/* Title */}
        <h3 className="mt-1.5 line-clamp-2 font-semibold tracking-tight text-[#111111] leading-snug text-base sm:text-lg">
          {x.title[lang]}
        </h3>

        {/* Location */}
        <div className="mt-1 text-sm text-[#111111]/90">
          {x.city}
        </div>

        {/* Quick facts strip (warm accent for BR continuity with open card) */}
        {facts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {facts.slice(0, 5).map((p, i) => (
              <span
                key={`${p.label}-${i}`}
                className="rounded-full border border-[#C9B46A]/25 bg-[#F8F6F0] px-2 py-0.5 text-[10px] sm:text-[11px] font-medium text-[#111111]"
              >
                {p.label}: {p.value}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        <p className="mt-2 line-clamp-2 text-sm text-[#111111]/85">
          {x.blurb[lang]}
        </p>

        {/* Business identity (business listings only) */}
        {isBusiness && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {brPlanTier === "business_plus" && (
              <span
                className={cx(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide whitespace-nowrap",
                  "border-yellow-300/70 bg-gradient-to-r from-yellow-500/15 to-yellow-400/10 text-[#111111]"
                )}
                title={lang === "es" ? "Negocio Plus" : "Business Plus"}
              >
                <span aria-hidden="true">🔑</span>
                {lang === "es" ? "Negocio Plus" : "Plus"}
              </span>
            )}
            {brPlanTier === "business_standard" && (
              <span
                className="inline-flex items-center rounded-full border border-yellow-400/40 bg-[#111111]/05 px-2 py-0.5 text-[10px] font-semibold text-[#111111]/90 whitespace-nowrap"
                title={lang === "es" ? "Negocio Estándar" : "Business Standard"}
              >
                {lang === "es" ? "Negocio" : "Business"}
              </span>
            )}
            {businessName && (
              <span className="text-xs font-medium text-[#111111]/85 truncate max-w-[140px] sm:max-w-[180px]" title={businessName}>
                {businessName}
              </span>
            )}
            {agentName && (
              <span className="text-[11px] text-[#111111]/70 truncate max-w-[120px] sm:max-w-[160px]" title={agentName}>
                {agentName}
              </span>
            )}
          </div>
        )}

        {!isBusiness && (
          <div className="mt-2 text-[11px] text-[#111111]/70">
            {lang === "es" ? "Privado" : "Private"}
          </div>
        )}

        <div className="mt-1.5 text-[11px] text-[#111111]/60">
          {x.postedAgo[lang]}
        </div>

        <span
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#111111] group-hover:underline"
          aria-hidden
        >
          {lang === "es" ? "Ver detalle" : "View details"}
          <span className="opacity-70">→</span>
        </span>
      </div>
    </a>
  );
}

/** En Venta card with hover expansion, mobile tap-to-expand, and engagement indicators */
function EnVentaCard({
  x,
  lang,
  isFav,
  onToggleFav,
  getHref,
}: {
  x: Listing;
  lang: Lang;
  isFav: boolean;
  onToggleFav: (id: string) => void;
  getHref: (x: Listing, lang: Lang) => string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  useEffect(() => {
    setTouchDevice(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const href = getHref(x, lang);
  const boostUntil = (x as any).boostUntil as string | undefined;
  const isBoosted = boostUntil && new Date(boostUntil).getTime() > Date.now();
  const hasVideo = Boolean((x as any).hasVideo || (x as any).proVideoId);
  const images = (x as any).images as string[] | undefined;
  const imageCount = Array.isArray(images) ? images.length : x.hasImage ? 1 : 0;
  const multiImage = Array.isArray(images) && images.length > 1;
  const viewCount = typeof (x as any).viewCount === "number" ? (x as any).viewCount : null;
  const viewsToday = typeof (x as any).viewsToday === "number" ? (x as any).viewsToday : null;
  const orig = (x as any).original_price != null ? Number((x as any).original_price) : null;
  const curr = (x as any).current_price != null ? Number((x as any).current_price) : null;
  const priceDrop = orig != null && curr != null && curr < orig;
  const isPopular = (viewsToday != null && viewsToday >= 5) || (viewCount != null && viewCount >= 20);

  const handleCardClick = (e: React.MouseEvent) => {
    if (touchDevice) {
      if (!expanded) {
        e.preventDefault();
        setExpanded(true);
      } else {
        e.preventDefault();
        router.push(href);
      }
    }
  };

  return (
    <a
      key={x.id}
      href={href}
      onClick={touchDevice ? handleCardClick : undefined}
      className={cx(
        "group relative block overflow-hidden rounded-2xl border border-black/10 bg-[#F5F5F5]",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.03] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.06)]",
        "hover:-translate-y-[1px] hover:bg-[#EFEFEF]",
        (touchDevice && expanded) && "ring-2 ring-[#A98C2A]/50 shadow-lg"
      )}
    >
      {/* Image on top */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E5E5E5]">
        {x.hasImage ? (
          <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center transition-transform duration-200 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-[#E5E5E5]" />
        )}
        {hasVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="rounded bg-black/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              ▶ VIDEO
            </span>
          </div>
        )}
        {multiImage && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {images!.slice(0, 5).map((_, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/80" aria-hidden />
            ))}
          </div>
        )}
      </div>
      <div className="p-3">
        {isPopular && (
          <div className="mb-1 text-[11px] font-semibold text-[#111111]">
            🔥 {lang === "es" ? "Popular hoy" : "Popular today"}
          </div>
        )}
        {isBoosted && (
          <div className="mb-1 text-[11px] font-medium text-[#111111]">
            🚀 {lang === "es" ? "Impulso de visibilidad" : "Visibility boost"}
          </div>
        )}
        {priceDrop && (
          <div className="mb-1 text-[11px] font-medium text-emerald-700">
            ⬇ {lang === "es" ? "Precio reducido" : "Price drop"}
          </div>
        )}
        <div className="text-lg font-extrabold text-[#111111]">{formatListingPrice(x.priceLabel[lang], { lang })}</div>
        <div className="mt-0.5 line-clamp-2 text-base font-semibold text-[#111111]">{x.title[lang]}</div>
        <div className="mt-1 text-sm text-[#111111]">{x.city}</div>
        <div className="text-xs text-[#111111]/80">
          {lang === "es" ? "Publicado" : "Posted"} {x.postedAgo[lang]}
        </div>
        {/* Media count */}
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[#111111]/80">
          {imageCount > 0 && (
            <span>📷 {imageCount} {lang === "es" ? "fotos" : "photos"}</span>
          )}
          {hasVideo && (
            <span>🎥 {lang === "es" ? "video incluido" : "video included"}</span>
          )}
        </div>
        {/* Expanded / hover indicators */}
        <div
          className={cx(
            "mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#111111]/70",
            "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
            touchDevice && expanded && "opacity-100"
          )}
        >
          {viewCount != null && (
            <span>👁 {viewCount} {lang === "es" ? "vistas" : "views"}</span>
          )}
          {imageCount > 0 && <span>📷 {imageCount}</span>}
          {isBoosted && <span>🚀</span>}
          {priceDrop && <span>⬇</span>}
        </div>
        {touchDevice && expanded && (
          <div className="mt-2 text-center">
            <span className="inline-block rounded-full bg-[#111111] px-4 py-1.5 text-xs font-semibold text-white">
              {lang === "es" ? "Toca de nuevo para ver" : "Tap again to view"}
            </span>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(x.id); }}
        className="absolute right-2 top-2 z-10 rounded-full border border-black/10 bg-white/90 p-1.5 shadow hover:bg-white"
        aria-label={isFav ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : (lang === "es" ? "Guardar favorito" : "Save favorite")}
      >
        {isFav ? "★" : "☆"}
      </button>
    </a>
  );
}

const ListingCardGrid = (x: Listing) => {
  const isFav = favIds.has(x.id);
  const isAutos = x.category === "autos";
  const isEmpleos = x.category === "empleos";
  const isServicios = x.category === "servicios";
  const isComunidad = x.category === "comunidad";
  const isEnVenta = x.category === "en-venta";
  const isRentas = x.category === "rentas";
  const tier = inferVisualTier(x);

  if (isEnVenta) {
    return (
      <EnVentaCard
        x={x}
        lang={lang}
        isFav={isFav}
        onToggleFav={toggleFav}
        getHref={getListingHref}
      />
    );
  }

  if (isRentas) {
    return (
      <RentasCard
        x={x}
        lang={lang}
        isFav={isFav}
        onToggleFav={toggleFav}
        getHref={getListingHref}
        tier={tier}
      />
    );
  }

  const isBienesRaices = x.category === "bienes-raices";
  if (isBienesRaices) {
    return (
      <BienesRaicesCard
        x={x}
        lang={lang}
        isFav={isFav}
        onToggleFav={toggleFav}
        getHref={getListingHref}
        tier={tier}
      />
    );
  }

  // Autos: structured scan (AutoTrader-style)
  const autosParsed = isAutos ? parseAutoFromTitle(x.title[lang]) : null;

  const autosSpec = isAutos
    ? ([x.year ? String(x.year) : null, x.make ?? null, x.model ?? null].filter(Boolean).join(" • ") ||
        autosParsed?.specLabel ||
        null)
    : null;

  const autosMileage =
    isAutos
      ? (typeof (x as any).mileage === "number"
          ? `${(x as any).mileage.toLocaleString()} mi`
          : typeof (x as any).mileage === "string"
            ? String((x as any).mileage)
            : autosParsed?.mileageLabel || null)
      : null;

// Keep autos meta in-scope and simple (avoid duplicate/undefined vars)
// autosSpec + autosMileage already include safe fallbacks.

// Empleos: Indeed-style clarity (safe inference; no fabricated data)
const empleo = isEmpleos ? parseEmpleoFromText(x.title[lang], x.blurb[lang], x.priceLabel[lang]) : null;
const empleoJobType = empleo ? empleoJobTypeLabel(empleo.jobType, lang) : null;

// Servicios: Yelp/Angi-style scan tags (derived from text only)
const serviceTags = isServicios ? serviceTagsFromText(x.title[lang], x.blurb[lang]) : null;

// Comunidad: lighter feel (keep trust + badges, reduce commercial emphasis)
const isComunidadLite = isComunidad;

  return (
    <div
      key={x.id}
      className={cx(
        "relative overflow-hidden rounded-2xl border bg-[#F5F5F5] p-2 sm:p-3 md:p-4 transition-all duration-200 ease-out",
        "hover:scale-[1.03] hover:-translate-y-[1px] hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.06)]",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        tier === "corona-oro"
          ? "border-yellow-300/60 ring-1 ring-yellow-300/25 bg-gradient-to-b from-yellow-500/12 via-black/25 to-black/25 shadow-[0_0_0_1px_rgba(250,204,21,0.18),0_0_22px_rgba(250,204,21,0.10),0_16px_46px_-20px_rgba(0,0,0,0.86)]"
          : tier === "corona"
            ? "border-yellow-500/25 bg-[#111111]/6"
            : tier === "joya"
              ? "border-emerald-400/22 bg-emerald-500/5"
              : "border-black/10"
      )}
    >
      {/* Tier accent (clarity, no layout shift) */}
      {tier ? (
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-[2px]",
            tier === "corona-oro"
              ? "bg-gradient-to-r from-transparent via-yellow-300/80 to-transparent"
              : tier === "corona"
                ? "bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"
                : tier === "joya"
                  ? "bg-gradient-to-r from-transparent via-emerald-400/55 to-transparent"
                  : ""
          )}
        />
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-base sm:text-lg font-semibold tracking-tight text-[#111111] leading-snug">
                {x.title[lang]}
              </div>
            </div>
            <div className={cx(isComunidadLite && "opacity-80")}><TierBadge tier={tier} lang={lang} /></div>
          </div>

          {/* Primary line (Price/Pay/CTA) */}
          <div
            className={cx(
              "mt-1 tracking-tight",
              isComunidadLite
                ? "font-bold text-[#111111] text-sm sm:text-base"
                : isServicios
                  ? "font-extrabold text-yellow-200 text-base sm:text-lg"
                  : isEmpleos
                    ? "font-extrabold text-yellow-200 text-lg sm:text-xl"
                    : isAutos
                      ? "font-extrabold text-yellow-200 text-lg sm:text-xl"
                      : "font-extrabold text-yellow-200 text-base sm:text-lg"
            )}
          >
            {isEmpleos && !/\$/.test(x.priceLabel[lang]) ? (
              <>
                <span className="text-[#111111] font-semibold mr-2">{lang === "es" ? "Pago:" : "Pay:"}</span>
                <span>{formatListingPrice(x.priceLabel[lang], { lang })}</span>
              </>
            ) : isServicios ? null : (
              formatListingPrice(x.priceLabel[lang], { lang })
            )}
          </div>

{/* Empleos: salary/job type/remote (Indeed-style) */}
{isEmpleos ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {empleo?.salaryLabel ? (
      <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] sm:text-xs text-[#111111]">
        {lang === "es" ? "Tarifa" : "Rate"}: {empleo.salaryLabel}
      </span>
    ) : null}
    {empleoJobType ? (
      <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] sm:text-xs text-[#111111]">
        {empleoJobType}
      </span>
    ) : null}
    {empleo?.isRemote ? (
      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] sm:text-xs text-emerald-700">
        {lang === "es" ? "Remoto" : "Remote"}
      </span>
    ) : null}
  </div>
) : null}

{/* Servicios: quick tags (Yelp/Angi-style scan) */}
{isServicios && serviceTags && serviceTags.length ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {serviceTags.map((t) => (
      <span
        key={t}
        className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] sm:text-xs text-[#111111]"
      >
        {t}
      </span>
    ))}
  </div>
) : null}

          {/* Autos: specs + mileage ABOVE location/time */}
          {isAutos && autosSpec ? (
            <div className="mt-1 text-xs sm:text-sm text-[#111111]">
              {autosSpec}
            </div>
          ) : null}
          {isAutos && autosMileage ? (
            <div className="mt-0.5 text-xs sm:text-sm font-semibold text-[#111111]">
              {autosMileage}
            </div>
          ) : null}

          {/* Business identity (Autos slightly earlier, stronger trust) */}
          {x.businessName ? (
            <div className={cx("mt-1 font-medium text-[#111111]/90", isAutos ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs")}>
              <span className="text-[#111111]">
                {isAutos
                  ? (lang === "es" ? "Agencia" : "Dealer")
                  : isEmpleos
                    ? (lang === "es" ? "Empresa" : "Company")
                    : isServicios
                      ? (lang === "es" ? "Negocio" : "Business")
                      : (lang === "es" ? "Perfil" : "Profile")}
                {" · "}
              </span>
              {x.businessName}
            </div>
          ) : null}
{isEmpleos && x.sellerType === "business" && !x.businessName ? (
  <div className="mt-1 text-[11px] sm:text-xs font-medium text-[#111111]/90">
    {lang === "es" ? "Empresa" : "Business"}
  </div>
) : null}


          {/* Location + time (Autos pushed lower for scan hierarchy) */}
          <div className={cx("text-[#111111]", isAutos ? "mt-1 text-xs sm:text-sm" : "mt-1 text-xs sm:text-sm")}>
            <span className="text-[#111111]">{x.city}</span>{" "}
            <span className="text-yellow-400/80">•</span>{" "}
            <span className="text-[#111111]">{x.postedAgo[lang]}</span>
          </div>

          {/* Micro facts (non-autos only) */}
          {!isAutos ? (
            <div className="mt-1 text-[11px] sm:text-xs text-[#111111]">
              {microLine(x)}
            </div>
          ) : null}

          {/* Chips */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {x.sellerType && tier !== "corona" && tier !== "corona-oro" ? (
              <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
                {SELLER_LABELS[x.sellerType][lang]}
              </span>
            ) : null}
            {x.handle ? (
              <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
                {x.handle}
              </span>
            ) : null}
            {x.hasImage ? (
              <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
                📷
              </span>
            ) : null}
          </div>
        </div>

        <div className={cx("shrink-0 flex flex-col items-end gap-2", !isAutos && "justify-start")}>
          {/* Autos/En Venta: consistent thumbnail (small, fixed, no layout shift) */}
          {(isAutos || x.category === "en-venta") ? (
            <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] overflow-hidden rounded-xl border border-black/10 bg-[#F5F5F5]">
              {x.hasImage ? (
                <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
              ) : (
                <div className="h-full w-full bg-[#F5F5F5]" />
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => toggleFav(x.id)}
            className={cx(
              "rounded-xl border px-2.5 py-1.5 text-sm",
              isFav
                ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            )}
            aria-label={
              isFav
                ? lang === "es"
                  ? "Quitar de favoritos"
                  : "Remove favorite"
                : lang === "es"
                  ? "Guardar favorito"
                  : "Save favorite"
            }
          >
            {isFav ? "★" : "☆"}
          </button>
        </div>
      </div>

      <div className="mt-2 line-clamp-2 text-sm text-[#111111]">
        {x.blurb[lang]}
      </div>

      {ActionPills(x)}

      <a
        href={getListingHref(x, lang)}
        className="mt-2.5 block rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-2 text-center text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
      >
        {isServicios ? (lang === "es" ? "Ver negocio" : "View business") : (lang === "es" ? "Ver detalle" : "View details")}
      </a>
    </div>
  );
};


const ListingRow = (x: Listing, withImg: boolean) => {
  const isFav = favIds.has(x.id);
  const isAutos = x.category === "autos";
  const isEmpleos = x.category === "empleos";
  const isServicios = x.category === "servicios";
  const isComunidad = x.category === "comunidad";
  const isComunidadLite = isComunidad;
  const tier = inferVisualTier(x);

  const autosSpec = isAutos
    ? [x.year ? String(x.year) : null, x.make ?? null, x.model ?? null].filter(Boolean).join(" • ")
    : null;

  const autosMileage =
    isAutos && typeof (x as any).mileage === "number"
      ? `${(x as any).mileage.toLocaleString()} mi`
      : isAutos && typeof (x as any).mileage === "string"
        ? String((x as any).mileage)
        : null;
const empleo = isEmpleos ? parseEmpleoFromText(x.title[lang], x.blurb[lang], x.priceLabel[lang]) : null;
const empleoJobType = empleo ? empleoJobTypeLabel(empleo.jobType, lang) : null;

const serviceTags = isServicios ? serviceTagsFromText(x.title[lang], x.blurb[lang]) : null;
  return (
    <div
      key={x.id}
      className={cx(
        "group relative overflow-hidden flex items-stretch gap-3 rounded-2xl border bg-[#F5F5F5] p-2 sm:p-3 md:p-4 hover:bg-[#EFEFEF] transition-all duration-200 ease-out hover:-translate-y-[1px]",
        tier === "corona-oro"
          ? "border-yellow-300/55 ring-1 ring-yellow-300/20 bg-gradient-to-b from-yellow-500/10 via-black/25 to-black/25 shadow-[0_0_0_1px_rgba(250,204,21,0.16),0_0_18px_rgba(250,204,21,0.08)]"
          : tier === "corona"
            ? "border-yellow-500/25 bg-[#111111]/6"
            : tier === "joya"
              ? "border-emerald-400/22 bg-emerald-500/5"
              : "border-black/10"
      )}
    >
      {/* Tier accent (clarity, no layout shift) */}
      {tier ? (
        <div
          aria-hidden="true"
          className={cx(
            "pointer-events-none absolute inset-x-0 top-0 h-[2px]",
            tier === "corona-oro"
              ? "bg-gradient-to-r from-transparent via-yellow-300/80 to-transparent"
              : tier === "corona"
                ? "bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent"
                : tier === "joya"
                  ? "bg-gradient-to-r from-transparent via-emerald-400/55 to-transparent"
                  : ""
          )}
        />
      ) : null}

      {withImg ? (
        <div
          className={cx(
            "shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#F5F5F5]",
            isAutos ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12 sm:h-14 sm:w-14"
          )}
        >
          {x.hasImage ? (
            <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
          ) : (
            <div className="h-full w-full bg-[#F5F5F5]" />
          )}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <a
            href={getListingHref(x, lang)}
            className="min-w-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold tracking-tight text-[#111111] leading-snug">
                  {x.title[lang]}
                </div>
              </div>
              <div className={cx(isComunidadLite && "opacity-80")}><TierBadge tier={tier} lang={lang} /></div>
            </div>

            <div
  className={cx(
    "mt-0.5 tracking-tight",
    isComunidadLite
      ? "font-bold text-[#111111] text-sm"
      : isServicios
        ? "font-extrabold text-yellow-200 text-sm sm:text-base"
        : isEmpleos
          ? "font-extrabold text-yellow-200 text-base sm:text-lg"
          : isAutos
            ? "font-extrabold text-yellow-200 text-base sm:text-lg"
            : "font-extrabold text-yellow-200 text-sm"
  )}
>
  {isEmpleos && !/\$/.test(x.priceLabel[lang]) ? (
    <>
      <span className="text-[#111111] font-semibold mr-2">{lang === "es" ? "Pago:" : "Pay:"}</span>
      <span>{formatListingPrice(x.priceLabel[lang], { lang })}</span>
    </>
  ) : isServicios ? null : (
    formatListingPrice(x.priceLabel[lang], { lang })
  )}
</div>

  {/* Empleos: salary/job type/remote (Indeed-style) */}
{isEmpleos ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {empleo?.salaryLabel ? (
      <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] sm:text-xs text-[#111111]">
        {lang === "es" ? "Tarifa" : "Rate"}: {empleo.salaryLabel}
      </span>
    ) : null}
    {empleoJobType ? (
      <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] sm:text-xs text-[#111111]">
        {empleoJobType}
      </span>
    ) : null}
    {empleo?.isRemote ? (
      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] sm:text-xs text-emerald-700">
        {lang === "es" ? "Remoto" : "Remote"}
      </span>
    ) : null}
  </div>
) : null}

{/* Servicios: quick tags (Yelp/Angi-style scan) */}
{isServicios && serviceTags && serviceTags.length ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {serviceTags.map((t) => (
      <span
        key={t}
        className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] sm:text-xs text-[#111111]"
      >
        {t}
      </span>
    ))}
  </div>
) : null}{/* Empleos: salary/job type/remote (Indeed-style) */}
{isEmpleos ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {empleo?.salaryLabel ? (
      <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
        {lang === "es" ? "Tarifa" : "Rate"}: {empleo.salaryLabel}
      </span>
    ) : null}
    {empleoJobType ? (
      <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
        {empleoJobType}
      </span>
    ) : null}
    {empleo?.isRemote ? (
      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-700">
        {lang === "es" ? "Remoto" : "Remote"}
      </span>
    ) : null}
  </div>
) : null}

{/* Servicios: quick tags */}
{isServicios && serviceTags && serviceTags.length ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {serviceTags.map((t) => (
      <span
        key={t}
        className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]"
      >
        {t}
      </span>
    ))}
  </div>
) : null}

{/* Autos: specs + mileage ABOVE location/time */}
{isAutos && autosSpec ? (
  <div className="mt-0.5 text-xs text-[#111111]">{autosSpec}</div>
) : null}
{isAutos && autosMileage ? (
  <div className="mt-0.5 text-xs font-semibold text-[#111111]">{autosMileage}</div>
) : null}


            {x.sellerType === "business" && x.businessName ? (
              <div className={cx("mt-0.5 font-medium text-[#111111]/90", isAutos ? "text-xs" : "text-[11px]")}>
                {x.businessName}
              </div>
            ) : null}
{isEmpleos && x.sellerType === "business" && !x.businessName ? (
  <div className="mt-0.5 text-[11px] font-medium text-[#111111]/90">
    {lang === "es" ? "Empresa" : "Business"}
  </div>
) : null}


            <div className="mt-0.5 text-xs text-[#111111]">
              <span className="text-[#111111]">{x.city}</span>{" "}
              <span className="text-yellow-400/80">•</span>{" "}
              <span className="text-[#111111]">{x.postedAgo[lang]}</span>
            </div>

            {!isAutos ? (
              <div className="mt-0.5 text-xs text-[#111111]">{microLine(x)}</div>
            ) : null}
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFav(x.id)}
              className={cx(
                "rounded-lg border px-2 py-1 text-xs",
                isFav
                  ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                  : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
              )}
              aria-label={
                isFav
                  ? lang === "es"
                    ? "Quitar de favoritos"
                    : "Remove favorite"
                  : lang === "es"
                    ? "Guardar favorito"
                    : "Save favorite"
              }
            >
              {isFav ? "★" : "☆"}
            </button>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {x.sellerType && tier !== "corona" && tier !== "corona-oro" ? (
            <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
              {SELLER_LABELS[x.sellerType][lang]}
            </span>
          ) : null}
          {x.handle ? (
            <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
              {x.handle}
            </span>
          ) : null}
          {x.hasImage ? (
            <span className="rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-0.5 text-[11px] text-[#111111]">
              📷
            </span>
          ) : null}
        </div>

        {ActionPills(x)}
      </div>
    </div>
  );
};


  return (
    <div className="min-h-screen bg-[#D9D9D9] text-[#111111] pb-28 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.10),transparent_60%)]">
      <Navbar />

      {/* Sticky quick actions (always reachable) */}
      <div className="sticky top-[56px] z-40 border-b border-black/10 bg-[#D9D9D9]/85 backdrop-blur">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-center gap-2 px-4 py-2">
          <a
            href={`/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar/en-venta?lang=${lang}`)}`}
            className="rounded-full bg-[#111111] px-3 py-1.5 text-xs font-semibold text-[#F5F5F5] hover:opacity-95 transition sm:px-4 sm:py-2 sm:text-sm"
          >
            {lang === "es" ? "Publicar anuncio" : "Post listing"}
          </a>

          <a
            href={`/clasificados/lista?lang=${lang}`}
            className="rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-[#F5F5F5] transition sm:px-4 sm:py-2 sm:text-sm"
          >
            {lang === "es" ? "Ver anuncios" : "View listings"}
          </a>

          <a
            href={`/clasificados/membresias?lang=${lang}`}
            className="rounded-full border border-[#C9B46A]/70 bg-[#F5F5F5] px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-[#F5F5F5] transition sm:px-4 sm:py-2 sm:text-sm"
          >
            {lang === "es" ? "Membresías" : "Memberships"}
          </a>
        </div>
      </div>


      {/* Subtle cinematic backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.12),rgba(0,0,0,0.75),rgba(0,0,0,1))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1),rgba(0,0,0,1))]" />
      </div>

      <main className="mx-auto w-full max-w-screen-2xl px-6 pt-24 md:pt-28">
        <div className="text-center">
          <div className="mx-auto mb-4 flex w-full items-center justify-center">
            <Image
              src={newLogo}
              alt="LEONIX"
              width={300}
              priority
              className="h-auto w-[240px] md:w-[300px]"
            />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-yellow-400 md:text-6xl">
            {lang === "es" ? "Clasificados" : "Classifieds"}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base text-[#111111] md:text-lg">
            {lang === "es"
              ? "Explora todos los anuncios con filtros."
              : "Browse all listings with filters."}
          </p>
        </div>

        <section className="mt-4">
          <div className="rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 shadow-sm ring-1 ring-[#C9B46A]/20">
            <div className="text-[11px] font-semibold text-[#111111]">
              {lang === "es" ? "Explorar por categoría" : "Browse by category"}
            </div>
            {/* Desktop: pill strip */}
            <div className="mt-2 hidden md:flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {CATEGORY_PILL_ORDER.map((c) => {
                const active = c === category;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => switchCategory(c)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "whitespace-nowrap snap-start rounded-full border px-2.5 py-1 text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30",
                      active
                        ? "border-yellow-500/50 bg-[#111111]/12 text-[#111111]"
                        : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF]"
                    )}
                  >
                    {CATEGORY_LABELS[c][lang]}
                  </button>
                );
              })}
            </div>
            {/* Mobile: 2-column icon-card grid (premium directory style) */}
            <div className="mt-2 md:hidden grid grid-cols-2 gap-2">
              {MOBILE_CATEGORY_GRID.map(({ key, labelEs, labelEn, Icon }) => {
                const label = lang === "es" ? labelEs : labelEn;
                if (key === "more") {
                  return (
                    <button
                      key="more"
                      type="button"
                      onClick={() => setMoreCategoriesOpen(true)}
                      className={cx(
                        "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white py-3 px-2",
                        "text-[#111111] hover:bg-[#F5F5F5] active:bg-[#EFEFEF]",
                        "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30 transition-colors"
                      )}
                      aria-label={label}
                    >
                      <Icon className="h-6 w-6 text-[#111111]" aria-hidden />
                      <span className="text-xs font-medium leading-tight">{label}</span>
                    </button>
                  );
                }
                const active = key === category;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => switchCategory(key)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 px-2",
                      "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30 transition-colors",
                      active
                        ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                        : "border-black/10 bg-white text-[#111111] hover:bg-[#F5F5F5] active:bg-[#EFEFEF]"
                    )}
                    aria-label={label}
                  >
                    <Icon className="h-6 w-6 text-[#111111]" aria-hidden />
                    <span className="text-xs font-medium leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>


<div ref={resultsTopRef} />

        <div
          className={cx(
            "transition-opacity duration-200 mt-2 md:grid md:items-start md:gap-4 md:grid-cols-[minmax(0,1fr)]",
            isSwitchingCategory ? "opacity-80" : "opacity-100"
          )}
        >
          <div className="md:mt-0 min-w-0 md:col-start-1">
          <div className={isServicios ? "mx-auto w-full max-w-6xl" : ""}>

        {/* TOP QUICK FILTERS (compact — Servicios-style master shell) */}
        <section className="mt-2">
          <div className={cx(
            "rounded-xl border bg-[#F5F5F5] px-3 py-2 ring-1",
            category === "bienes-raices" ? "border-[#C9B46A]/20 ring-[#C9B46A]/25" : "border-black/10 ring-[#C9B46A]/20"
          )}>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
              {isServicios ? (
                <div ref={serviciosTypeRef} className="w-full min-w-0 xl:col-span-12 xl:self-start">
                  <label className="block text-[11px] font-semibold text-[#111111]">{lang === "es" ? "Servicio" : "Service"}</label>
                  <div className="relative mt-1 w-full min-w-0">
                    <div className="grid w-full grid-cols-[minmax(0,1fr)_180px] gap-1.5 overflow-hidden rounded-lg border border-black/10 bg-[#F5F5F5]">
                      <div className="min-w-0 w-full">
                        <input
                          value={q}
                          onChange={(e) => {
                            setQ(e.target.value);
                            setServiciosTypeOpen(true);
                          }}
                          onFocus={() => setServiciosTypeOpen(true)}
                          placeholder={getSearchPlaceholder(category, lang)}
                          className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-[#111111] outline-none placeholder:text-[#111111]/80"
                          aria-label={lang === "es" ? "Buscar servicio" : "Search service"}
                        />
                      </div>
                      <div className="flex min-w-[180px] shrink-0 items-stretch">
                        <div className="w-px shrink-0 bg-black/10" aria-hidden="true" />
                        <button
                          type="button"
                          onClick={() => setLocationOpen(true)}
                          className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                          aria-label={UI.location[lang]}
                        >
                          {locationLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationOpen(true)}
                          className="shrink-0 px-2 py-1.5 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                          aria-label={UI.edit[lang]}
                          title={UI.edit[lang]}
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                    {serviciosTypeOpen && serviciosTypeSuggestions.length ? (
                      <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-md border border-black/10 bg-[#F5F5F5] shadow-md">
                        <div className="px-2 py-1 text-[11px] text-[#111111]/80">{lang === "es" ? "Sugerencias" : "Suggestions"}</div>
                        {serviciosTypeSuggestions.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => {
                              setServiciosParams((p) => ({ ...p, stype: s.key }));
                              setQ(s.label);
                              setServiciosTypeOpen(false);
                              setServiciosHover(null);
                              setPage(1);
                            }}
                            className="flex w-full items-center justify-between px-2 py-1.5 text-left text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                          >
                            <span className="truncate">{s.label}</span>
                            <span className="ml-2 shrink-0 text-[11px] text-[#111111]">{SERVICIOS_GROUP_LABEL[s.group][lang]}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setServiciosAllOpen(true)}
                      className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                    >
                      ☰ {lang === "es" ? "Todo" : "All"}
                    </button>
					{(Object.keys(SERVICIOS_TAXONOMY) as ServiciosGroupKey[])
						.filter((g) => {
							const only = servicioGroupForKey(serviciosDraft.stype);
							return !only || g === only;
						})
						.map((grp) => (
                      <div
                        key={grp}
                        className="relative"
                        onMouseEnter={() => setServiciosHover(grp)}
                        onMouseLeave={() => setServiciosHover((cur) => (cur === grp ? null : cur))}
                      >
                        <button
                          type="button"
                          onClick={() => setServiciosHover((cur) => (cur === grp ? null : grp))}
                          className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                        >
                          {SERVICIOS_GROUP_LABEL[grp][lang]} ▾
                        </button>
                        {serviciosHover === grp ? (
                          <div className="absolute left-0 top-full h-0.5" aria-hidden="true" />
                        ) : null}
                        {serviciosHover === grp ? (
                          <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[220px] overflow-hidden rounded-md border border-black/10 bg-[#F5F5F5] shadow-md">
                            <div className="grid grid-cols-2 gap-0.5 p-1.5">
                              {SERVICIOS_TAXONOMY[grp].map((it) => (
                                <button
                                  key={it.key}
                                  type="button"
                                  onClick={() => {
                                    setServiciosParams((p) => ({ ...p, stype: it.key }));
                                    setQ(it.label[lang]);
                                    setServiciosHover(null);
                                    setServiciosTypeOpen(false);
                                    setPage(1);
                                  }}
                                  className="rounded px-2 py-1.5 text-left text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                                >
                                  {it.label[lang]}
                                </button>
	                    ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1 flex min-h-[1rem] flex-wrap items-center gap-x-1.5 gap-y-0.5 overflow-hidden text-[11px] text-[#111111]">
                    <span className="min-w-0 truncate font-medium" title={serviciosBreadcrumb.replace(/ › /g, " > ")}>{serviciosBreadcrumb.replace(/ › /g, " > ")}</span>
                    {serviciosDeepChips.length > 0 && (
                      <>
                        <span className="text-black/40">|</span>
                        {serviciosDeepChips.map((c) => (
                          <button
                            key={c.key}
                            type="button"
                            onClick={c.clear}
                            className="rounded-full border border-black/15 bg-black/[0.06] px-2 py-0.5 text-[11px] text-[#111111] hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-[#A98C2A]/40"
                            aria-label={lang === "es" ? "Quitar filtro" : "Remove filter"}
                          >
                            {c.text} ×
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div ref={searchBoxRef} className="w-full min-w-0 xl:col-span-12 xl:self-start">
                  <label className="block text-[11px] font-semibold text-[#111111]">{category === "bienes-raices" ? (lang === "es" ? "Propiedad o zona" : "Property or area") : UI.search[lang]}</label>
                  <div className="relative mt-1 w-full min-w-0">
                    <div className="grid w-full grid-cols-[minmax(0,1fr)_180px] gap-1.5 overflow-hidden rounded-lg border border-black/10 bg-[#F5F5F5]">
                      <div className="min-w-0 w-full">
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder={getSearchPlaceholder(category, lang)}
                          className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-[#111111] outline-none placeholder:text-[#111111]/80 focus:ring-0"
                          aria-label={category === "bienes-raices" ? (lang === "es" ? "Buscar propiedad, zona o colonia" : "Search property, area or neighborhood") : UI.search[lang]}
                        />
                      </div>
                      <div className="flex min-w-[180px] shrink-0 items-stretch">
                        <div className="w-px shrink-0 bg-black/10" aria-hidden="true" />
                        <button
                          type="button"
                          onClick={() => setLocationOpen(true)}
                          className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                          aria-label={UI.location[lang]}
                        >
                          {locationLabel}
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocationOpen(true)}
                          className="shrink-0 px-2 py-1.5 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                          aria-label={UI.edit[lang]}
                          title={UI.edit[lang]}
                        >
                          ✎
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <button
                      type="button"
                      onClick={() => setCategoryFiltersOpen(true)}
                      className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                    >
                      ☰ {category === "bienes-raices" ? (lang === "es" ? "Filtros" : "Filters") : (lang === "es" ? "Todo" : "All")}
                    </button>
                    {category === "bienes-raices" && BIENES_RAICES_SUBCATEGORIES.slice(0, 4).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => { setBrParams((p) => ({ ...p, subcategoria: p.subcategoria === opt.key ? "" : opt.key })); setPage(1); }}
                        className={cx(
                          "shrink-0 rounded-full border px-2 py-1 text-[11px] text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30",
                          brParams.subcategoria === opt.key ? "border-[#C9B46A]/60 bg-[#F8F6F0]" : "border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF]"
                        )}
                      >
                        {lang === "es" ? opt.label.es : opt.label.en}
                      </button>
                    ))}
                    {category === "en-venta" && EN_VENTA_CHIPS[lang].map((label) => (
                      <button key={label} type="button" onClick={() => { setQ(label); setPage(1); }} className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30">
                        {label}
                      </button>
                    ))}
                    {category === "rentas" && RENTAS_CHIPS[lang].map((label) => (
                      <button key={label} type="button" onClick={() => { setQ(label); setPage(1); }} className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30">
                        {label}
                      </button>
                    ))}
                    {category === "autos" && AUTOS_CHIPS[lang].map((label) => (
                      <button key={label} type="button" onClick={() => { setQ(label); setPage(1); }} className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30">
                        {label}
                      </button>
                    ))}
                    {category === "empleos" && EMPLEOS_CHIPS[lang].map((label) => (
                      <button key={label} type="button" onClick={() => { setQ(label); setPage(1); }} className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30">
                        {label}
                      </button>
                    ))}
                    {category === "clases" && CLASES_CHIPS[lang].map((label) => (
                      <button key={label} type="button" onClick={() => { setQ(label); setPage(1); }} className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30">
                        {label}
                      </button>
                    ))}
                    {category === "comunidad" && COMUNIDAD_CHIPS[lang].map((label) => (
                      <button key={label} type="button" onClick={() => { setQ(label); setPage(1); }} className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30">
                        {label}
                      </button>
                    ))}
                    {category === "travel" && TRAVEL_CHIPS[lang].map((label) => (
                      <button key={label} type="button" onClick={() => { setQ(label); setPage(1); }} className="shrink-0 rounded-full border border-black/10 bg-[#F5F5F5] px-2 py-1 text-[11px] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30">
                        {label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleSaveSearch}
                      disabled={saveSearchLoading}
                      className="shrink-0 rounded-full border border-[#C9B46A]/50 bg-[#F2EFE8] px-2 py-1 text-[11px] font-medium text-[#111111] hover:bg-[#E8E4D8] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30 disabled:opacity-50"
                    >
                      {saveSearchDone ? (lang === "es" ? "✓ Guardada" : "✓ Saved") : saveSearchLoading ? "…" : (lang === "es" ? "Guardar búsqueda" : "Save search")}
                    </button>
                  </div>
                </div>
              )}
                  </div>
          </div>
        </section>



        {/* RESULTS TOOLBAR + mobile Ordenar trigger (no bottom bar) */}
        <section className="mt-3 z-20" aria-busy={isSwitchingCategory}>
          <div className="md:hidden flex justify-end mb-2">
            <button
              type="button"
              onClick={() => {
                setMobilePanelTab("sort");
                setMobilePanelOpen(true);
              }}
              className="rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-xs font-medium text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            >
              {lang === "es" ? "Ordenar" : "Sort"}
            </button>
          </div>

{/* Mobile full-screen Filters/Sort (A3) */}
{mobilePanelOpen ? (
  <div className="fixed inset-0 z-50 md:hidden">
    <div
      className="absolute inset-0 bg-black/20"
      onClick={() => setMobilePanelOpen(false)}
    />
    <div className="absolute inset-0 flex flex-col">
      <div className="mx-auto w-full max-w-screen-2xl px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-[#F5F5F5] backdrop-blur p-3">
          <div className="flex items-center gap-2">
            {!isServicios && (
            <button
              type="button"
              onClick={() => setMobilePanelTab("filters")}
              className={cx(
                "rounded-xl border px-3 py-2 text-sm",
                mobilePanelTab === "filters"
                  ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                  : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
              )}
            >
              {lang === "es" ? "Filtros" : "Filters"}
            </button>
            )}
            <button
              type="button"
              onClick={() => setMobilePanelTab("sort")}
              className={cx(
                "rounded-xl border px-3 py-2 text-sm",
                mobilePanelTab === "sort"
                  ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                  : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
              )}
            >
              {lang === "es" ? "Ordenar" : "Sort"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            aria-label={lang === "es" ? "Cerrar" : "Close"}
          >
            ✖
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-2xl flex-1 px-4 pb-6 pt-3">
        <div className="h-full overflow-y-auto rounded-2xl border border-black/10 bg-[#F5F5F5] backdrop-blur p-4">
          {mobilePanelTab === "filters" && !isServicios ? (
            <div className="space-y-4">
              {/* Row 1: Single large search (icon + placeholder only) */}
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#111111]/50 text-lg" aria-hidden="true">⌕</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length) setSuggestionsOpen(true);
                  }}
                  placeholder={getSearchPlaceholder(category, lang)}
                  className="w-full rounded-xl border border-[#C9B46A]/30 bg-[#F5F5F5] py-3 pl-10 pr-4 text-sm text-[#111111] outline-none placeholder:text-[#111111]/70 focus:border-[#A98C2A]/60 focus:ring-1 focus:ring-[#A98C2A]/20"
                  aria-label={category === "bienes-raices" ? (lang === "es" ? "Buscar propiedad, zona o colonia" : "Search property, area or neighborhood") : UI.search[lang]}
                />
                {suggestionsOpen && suggestions.length ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-black/10 bg-[#F5F5F5] shadow-xl">
                    <div className="px-3 py-2 text-[11px] text-[#111111]">
                      {lang === "es" ? "Sugerencias" : "Suggestions"}
                    </div>
                    {suggestions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCategory(c);
                          setSuggestionsOpen(false);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                      >
                        <span>{CATEGORY_LABELS[c][lang]}</span>
                        <span className="text-xs text-[#111111]">
                          {lang === "es" ? "Categoría" : "Category"}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Row 2: Location pill + edit */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="flex flex-1 items-center gap-2 rounded-full border border-[#C9B46A]/25 bg-[#F5F5F5] px-4 py-2.5 text-left text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                  aria-label={UI.location[lang]}
                >
                  <span className="text-[#111111]/60" aria-hidden="true">📍</span>
                  <span className="truncate flex-1">{locationLabel}</span>
                  <span className="shrink-0 text-xs text-[#111111]/70">{UI.edit[lang]}</span>
                </button>
              </div>
              {locMsg ? (
                <div className="text-[11px] text-[#111111]/80">{locMsg}</div>
              ) : null}

              {/* Row 3: Category Quick Picks (icon tiles) */}
              <div>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {QUICK_PICKS.map((item) => {
                    const label = lang === "es" ? item.labelEs : item.labelEn;
                    const isMore = item.key === "more";
                    const isActive = !isMore && category === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          if (isMore) {
                            setMoreOpen(true);
                          } else {
                            setCategory(item.key as CategoryKey);
                          }
                        }}
                        className={cx(
                          "shrink-0 snap-start rounded-xl border px-3 py-2.5 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30",
                          isActive
                            ? "border-[#C9B46A]/50 bg-[#111111]/10 text-[#111111]"
                            : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] hover:border-[#C9B46A]/20"
                        )}
                        aria-label={label}
                        aria-current={isActive && !isMore ? "true" : undefined}
                      >
                        <span className="block text-lg leading-none" aria-hidden="true">{item.icon}</span>
                        <span className="mt-1 block text-[11px] font-medium leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 4: Más filtros + small Limpiar */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="flex-1 rounded-xl border border-[#C9B46A]/30 bg-[#F5F5F5] px-4 py-2.5 text-sm font-medium text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                  aria-label={UI.moreFilters[lang]}
                >
                  {UI.moreFilters[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => resetAllFilters()}
                  className="rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5 text-xs text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                  aria-label={UI.clear[lang]}
                >
                  {UI.clear[lang]}
                </button>
              </div>

              {activeChips.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {activeChips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={c.clear}
                      className={cx(
                        "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs text-[#111111] transition",
                        category === "bienes-raices"
                          ? "border-[#C9B46A]/30 bg-[#F8F6F0] hover:bg-[#F0EDE5]"
                          : "border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF]"
                      )}
                      aria-label={lang === "es" ? "Quitar filtro" : "Remove filter"}
                    >
                      {c.text} <span className="ml-1 opacity-80">×</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-[#111111]">
                  {lang === "es" ? "Vista" : "View"}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setView("list"); localStorage.setItem("leonix_view_mode","list"); }}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-sm",
                      view === "list"
                        ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                        : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                    )}
                  >
                    {lang === "es" ? "Lista" : "List"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setView("list-img"); localStorage.setItem("leonix_view_mode","list-img"); }}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-sm",
                      view === "list-img"
                        ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                        : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                    )}
                  >
                    {lang === "es" ? "Lista + foto" : "List + image"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setView("grid"); localStorage.setItem("leonix_view_mode","grid"); }}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-sm",
                      view === "grid"
                        ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                        : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                    )}
                  >
                    {lang === "es" ? "Cuadrícula" : "Grid"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111111]">
                  {UI.sort[lang]}
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5 text-sm text-[#111111] outline-none"
                  aria-label={UI.sort[lang]}
                >
                  <option value="newest">{SORT_LABELS.newest[lang]}</option>
                  <option value="price-asc">{SORT_LABELS["price-asc"][lang]}</option>
                  <option value="price-desc">{SORT_LABELS["price-desc"][lang]}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="rounded-xl border border-[#C9B46A]/70 bg-[#111111]/15 px-5 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#111111]/20 focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
            aria-label={UI.done[lang]}
          >
            {UI.done[lang]}
          </button>
        </div>
      </div>
    </div>
  </div>
) : null}

</section>

        
{businessTop.length && category !== "servicios" ? (
  <section className="mt-6">
    <div className="mb-3 flex items-end justify-between">
      <div>
        <div className="text-sm font-semibold text-yellow-200">
          {lang === "es" ? "Profesionales" : "Businesses"}
        </div>
        <div className="text-xs font-medium text-[#111111]">
          {lang === "es"
            ? "Opciones de negocios y profesionales (sin ocultar anuncios personales)"
            : "Business & pro options (personal listings are never hidden)"}
        </div>
      </div>
      <a
        href={`/clasificados/lista?lang=${lang}&cat=${category !== "all" ? category : "all"}&seller=business`}
        className="text-xs text-yellow-200/90 underline underline-offset-4 hover:text-yellow-200"
      >
        {lang === "es" ? "Ver todos los negocios" : "View all businesses"}
      </a>
    </div>

    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
      {businessTop.map((x) => (
        <div key={x.id} className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#111111]">
                {x.businessName ?? x.title[lang]}
              </div>
              <div className="mt-0.5 text-xs text-[#111111]">
                {x.city} • {x.postedAgo[lang]}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleFav(x.id)}
              className={cx(
                "shrink-0 rounded-lg border px-2 py-1 text-xs",
                favIds.has(x.id)
                  ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                  : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
              )}
              aria-label={favIds.has(x.id) ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : (lang === "es" ? "Guardar favorito" : "Save favorite")}
            >
              {favIds.has(x.id) ? "★" : "☆"}
            </button>
          </div>

          {x.category !== "servicios" || (x.priceLabel[lang] !== "Cotización" && x.priceLabel[lang] !== "Quote") ? (
            <div className="mt-2 text-sm font-bold text-yellow-200 tracking-tight">{formatListingPrice(x.priceLabel[lang], { lang })}</div>
          ) : null}

          <a
            href={getListingHref(x, lang)}
            className="mt-3 block rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-center text-xs font-medium text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
          >
            {x.category === "servicios" ? (lang === "es" ? "Ver negocio" : "View business") : (lang === "es" ? "Ver detalle" : "View details")}
          </a>
        </div>
      ))}
    </div>
  </section>
) : null}

        {isEnVenta ? (
          <section className="mt-6">
            <RecentlyViewedSection lang={lang} />
          </section>
        ) : null}

        <div className={cx("mt-6", isEnVenta && "lg:grid lg:grid-cols-[240px_1fr] lg:gap-6")}>
          {isEnVenta ? (
            <aside className="hidden lg:block shrink-0 space-y-4 rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
              <div className="text-sm font-semibold text-[#111111]">{lang === "es" ? "Filtros" : "Filters"}</div>
              <div>
                <label className="block text-xs font-medium text-[#111111]">{lang === "es" ? "Precio mín" : "Price min"}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="$0"
                  value={ventaParams.vpmin}
                  onChange={(e) => { setVentaParams((p) => ({ ...p, vpmin: e.target.value })); setPage(1); setInfiniteScrollLimit(20); }}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111111]">{lang === "es" ? "Precio máx" : "Price max"}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="$9999"
                  value={ventaParams.vpmax}
                  onChange={(e) => { setVentaParams((p) => ({ ...p, vpmax: e.target.value })); setPage(1); setInfiniteScrollLimit(20); }}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-[#111111]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111111]">{lang === "es" ? "Condición" : "Condition"}</label>
                <select
                  value={ventaParams.vcond}
                  onChange={(e) => { setVentaParams((p) => ({ ...p, vcond: e.target.value })); setPage(1); setInfiniteScrollLimit(20); }}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-[#111111]"
                >
                  <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                  {(["new", "like-new", "good", "fair"] as const).map((c) => (
                    <option key={c} value={c}>{ventaConditionLabel(c, lang)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#111111]">{lang === "es" ? "Radio" : "Radius"}</label>
                <select
                  value={radiusMi}
                  onChange={(e) => { setRadiusMi(Number(e.target.value)); setPage(1); setInfiniteScrollLimit(20); }}
                  className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-[#111111]"
                >
                  {RADIUS_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r} mi</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#111111]">
                <input
                  type="checkbox"
                  checked={ventaParams.vpostedToday}
                  onChange={(e) => { setVentaParams((p) => ({ ...p, vpostedToday: e.target.checked })); setPage(1); setInfiniteScrollLimit(20); }}
                  className="rounded border-black/20"
                />
                {lang === "es" ? "Publicado hoy" : "Posted today"}
              </label>
            </aside>
          ) : null}
          <div className="min-w-0">
        <section className={cx(isEnVenta && "mt-0")}>
          {category === "servicios" && serviciosSectioned ? (
            <div className="flex flex-col gap-6">
              {serviciosSectioned.renderBlocks.map((block, idx) =>
                block.type === "featured" ? (
                  <div key={"feat-" + idx}>
                    <h2 className="mb-3 text-sm font-semibold text-[#111111]">
                      {lang === "es" ? "Top Pros" : "Top Pros"}
                    </h2>
                    <div className="flex flex-col gap-4">
                      {block.items.map((x) => (
                        <div key={x.id}>{ServiciosPlusOrPremiumRow(x, lang)}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <ServiciosStandardCarouselRow
                    key={"std-" + idx + "-" + block.items.map((c) => c.id).join("-")}
                    items={block.items}
                    lang={lang}
                    title={lang === "es" ? "Opciones" : "Options"}
                  />
                )
              )}
            </div>
          ) : view === "grid" ? (
            <>
              {category === "bienes-raices" && (
                <p className="mb-3 text-sm font-medium text-[#111111]/90">
                  {lang === "es"
                    ? `${visible.length} ${visible.length === 1 ? "propiedad" : "propiedades"}`
                    : `${visible.length} ${visible.length === 1 ? "property" : "properties"}`}
                </p>
              )}
              <div
                className={cx(
                  "grid gap-2.5 sm:gap-3 md:gap-4",
                  "md:grid-cols-3 lg:grid-cols-4"
                )}
              >
                {visible.map(ListingCardGrid)}
              </div>
            </>
          ) : (
            <>
              {category === "bienes-raices" && (
                <p className="mb-3 text-sm font-medium text-[#111111]/90">
                  {lang === "es"
                    ? `${visible.length} ${visible.length === 1 ? "propiedad" : "propiedades"}`
                    : `${visible.length} ${visible.length === 1 ? "property" : "properties"}`}
                </p>
              )}
              <div className="flex flex-col gap-2.5 sm:gap-3">
                {visible.map((x) => ListingRow(x, view === "list-img"))}
              </div>
            </>
          )}
        </section>

        {category !== "servicios" ? (
        <>
          {isEnVenta ? (
            <section className="mt-6 pb-8 md:pb-6" aria-hidden>
              <div
                ref={loadMoreSentinelRef}
                className="h-4 w-full"
                data-infinite-sentinel
              />
              {visible.length < filtered.length && visible.length > 0 && (
                <div className="flex justify-center py-4">
                  <button
                    type="button"
                    onClick={() => setInfiniteScrollLimit((n) => n + perPage)}
                    className="rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-2 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                  >
                    {lang === "es" ? "Cargar más" : "Load more"}
                  </button>
                </div>
              )}
            </section>
          ) : (
            <section className="mt-6 flex items-center justify-center gap-3 pb-8 md:pb-6">
              <button
                type="button"
                disabled={pageClamped <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm",
                  pageClamped <= 1
                    ? "border-black/10 bg-[#F5F5F5] text-[#111111]"
                    : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                )}
              >
                {UI.prev[lang]}
              </button>
              <div className="rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-2 text-sm text-[#111111]">
                {pageClamped}/{totalPages}
              </div>
              <button
                type="button"
                disabled={pageClamped >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm",
                  pageClamped >= totalPages
                    ? "border-black/10 bg-[#F5F5F5] text-[#111111]"
                    : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                )}
              >
                {UI.next[lang]}
              </button>
            </section>
          )}
        </>
        ) : null}

            </div>
          </div>
        </div>
        </div>
        </div>
      </main>

      {/* Mobile "Más" category list drawer */}
      {moreCategoriesOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/25"
            onClick={() => setMoreCategoriesOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 top-[20%] rounded-t-2xl border-t border-black/10 bg-[#F5F5F5] shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <span className="text-sm font-semibold text-[#111111]">
                {lang === "es" ? "Todas las categorías" : "All categories"}
              </span>
              <button
                type="button"
                onClick={() => setMoreCategoriesOpen(false)}
                className="rounded-lg border border-black/10 bg-white p-2 text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                aria-label={lang === "es" ? "Cerrar" : "Close"}
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {CATEGORY_PILL_ORDER.map((c) => {
                const active = c === category;
                const label = CATEGORY_LABELS[c][lang];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      switchCategory(c);
                      setMoreCategoriesOpen(false);
                    }}
                    className={cx(
                      "flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30",
                      active
                        ? "bg-[#111111]/10 text-[#111111] font-medium"
                        : "text-[#111111] hover:bg-[#EFEFEF] active:bg-[#E5E5E5]"
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    <span className="text-sm">{label}</span>
                    <span className="text-[#111111]/60" aria-hidden>›</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* Category-native filters panel (Filtros for BR; Todo for others) */}
      {categoryFiltersOpen && !isServicios ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setCategoryFiltersOpen(false)} aria-hidden />
          <div className="absolute right-0 top-0 h-full w-[280px] max-w-[85vw] border-l border-black/10 bg-[#F5F5F5] shadow-xl p-3 overflow-y-auto">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#111111]">{lang === "es" ? "Filtros" : "Filters"}</span>
              <button type="button" onClick={() => setCategoryFiltersOpen(false)} className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-[#111111] hover:bg-[#EFEFEF]" aria-label={UI.close[lang]}>{UI.close[lang]}</button>
            </div>
            {category === "bienes-raices" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#111111]">{lang === "es" ? "Tipo de propiedad" : "Property type"}</label>
                  <select
                    value={brParams.subcategoria}
                    onChange={(e) => { setBrParams((p) => ({ ...p, subcategoria: e.target.value })); setPage(1); }}
                    className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none"
                  >
                    <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                    {BIENES_RAICES_SUBCATEGORIES.map((opt) => (
                      <option key={opt.key} value={opt.key}>{lang === "es" ? opt.label.es : opt.label.en}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#111111]">{lang === "es" ? "Precio mín" : "Price min"}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={brParams.priceMin}
                      onChange={(e) => { setBrParams((p) => ({ ...p, priceMin: e.target.value })); setPage(1); }}
                      placeholder="0"
                      className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#111111]">{lang === "es" ? "Precio máx" : "Price max"}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={brParams.priceMax}
                      onChange={(e) => { setBrParams((p) => ({ ...p, priceMax: e.target.value })); setPage(1); }}
                      placeholder="—"
                      className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#111111]">{lang === "es" ? "Recámaras" : "Bedrooms"}</label>
                    <select
                      value={brParams.beds}
                      onChange={(e) => { setBrParams((p) => ({ ...p, beds: e.target.value })); setPage(1); }}
                      className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none"
                    >
                      <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                      <option value="studio">{lang === "es" ? "Estudio" : "Studio"}</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#111111]">{lang === "es" ? "Baños" : "Bathrooms"}</label>
                    <select
                      value={brParams.baths}
                      onChange={(e) => { setBrParams((p) => ({ ...p, baths: e.target.value })); setPage(1); }}
                      className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none"
                    >
                      <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#111111]">{UI.seller[lang]}</label>
                  <select
                    value={sellerType ?? "all"}
                    onChange={(e) => setSellerType(e.target.value === "all" ? null : (e.target.value as "personal" | "business"))}
                    className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none"
                  >
                    <option value="all">{lang === "es" ? "Cualquiera" : "Any"}</option>
                    <option value="personal">{SELLER_LABELS.personal[lang]}</option>
                    <option value="business">{SELLER_LABELS.business[lang]}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#111111]">{UI.radius[lang]}</label>
                  <select value={String(radiusMi)} onChange={(e) => setRadiusMi(Number(e.target.value) as any)} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none">
                    {[10, 25, 40, 50].map((m) => <option key={m} value={String(m)}>{m} mi</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-[#111111]">{UI.radius[lang]}</label>
                <select value={String(radiusMi)} onChange={(e) => setRadiusMi(Number(e.target.value) as any)} className="mt-1 w-full rounded-lg border border-black/10 bg-white px-2.5 py-2 text-sm text-[#111111] outline-none">
                  {[10, 25, 40, 50].map((m) => <option key={m} value={String(m)}>{m} mi</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* MORE FILTERS DRAWER (unchanged) */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMoreOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-[#F5F5F5] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-semibold tracking-tight text-yellow-300">{UI.moreFilters[lang]}</div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-1 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
              >
                {UI.close[lang]}
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              {/* Radius (advanced — moved from main panel) */}
              <div>
                <label className="block text-xs font-semibold text-[#111111]">{UI.radius[lang]}</label>
                <select
                  value={radiusMi}
                  onChange={(e) => setRadiusMi(parseInt(e.target.value, 10))}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#A98C2A]/60"
                  aria-label={UI.radius[lang]}
                >
                  {[5, 10, 25, 40, 50].map((r) => (
                    <option key={r} value={r}>
                      {r} mi
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">{UI.seller[lang]}</label>
                <select
                  value={sellerType ?? "all"}
                  onChange={(e) => setSellerType(e.target.value === "all" ? null : (e.target.value as SellerType))}
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                >
                  <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                  <option value="personal">{SELLER_LABELS.personal[lang]}</option>
                  <option value="business">{SELLER_LABELS.business[lang]}</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-3 text-sm text-[#111111]">
                <input
                  type="checkbox"
                  checked={onlyWithImage}
                  onChange={(e) => setOnlyWithImage(e.target.checked)}
                />
                {UI.hasImage[lang]}
              </label>

              {category === "autos" ? (
                <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                  <div className="text-sm font-semibold text-[#111111]">{lang === "es" ? "Autos" : "Autos"}</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Año min" : "Year min"}</label>
                      <input
                        value={autosParams.aymin}
                        onChange={(e) => setAutosParams((p) => ({ ...p, aymin: e.target.value }))}
                        inputMode="numeric"
                        placeholder="2008"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Año max" : "Year max"}</label>
                      <input
                        value={autosParams.aymax}
                        onChange={(e) => setAutosParams((p) => ({ ...p, aymax: e.target.value }))}
                        inputMode="numeric"
                        placeholder="2024"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Marca" : "Make"}</label>
                      <input
                        value={autosParams.amake}
                        onChange={(e) => setAutosParams((p) => ({ ...p, amake: e.target.value }))}
                        placeholder={lang === "es" ? "Toyota" : "Toyota"}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Modelo" : "Model"}</label>
                      <input
                        value={autosParams.amodel}
                        onChange={(e) => setAutosParams((p) => ({ ...p, amodel: e.target.value }))}
                        placeholder={lang === "es" ? "Corolla" : "Corolla"}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Millas máx" : "Miles max"}</label>
                      <input
                        value={autosParams.amilesmax}
                        onChange={(e) => setAutosParams((p) => ({ ...p, amilesmax: e.target.value }))}
                        inputMode="numeric"
                        placeholder="120000"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Condición" : "Condition"}</label>
                      <select
                        value={autosParams.acond || ""}
                        onChange={(e) => setAutosParams((p) => ({ ...p, acond: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="used">{lang === "es" ? "Usado" : "Used"}</option>
                        <option value="new">{lang === "es" ? "Nuevo" : "New"}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Vendedor" : "Seller"}</label>
                      <select
                        value={autosParams.aseller || ""}
                        onChange={(e) => setAutosParams((p) => ({ ...p, aseller: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="personal">{lang === "es" ? "Personal" : "Personal"}</option>
                        <option value="business">{lang === "es" ? "Negocio" : "Business"}</option>
                      </select>
                    </div>

                  </div>
                </div>
              ) : null}

              {category === "rentas" ? (
                <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                  <div className="text-sm font-semibold text-[#111111]">{lang === "es" ? "Rentas" : "Rentals"}</div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Precio min" : "Price min"}</label>
                      <input
                        value={rentasParams.rpmin}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rpmin: e.target.value }))}
                        inputMode="numeric"
                        placeholder="1200"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Precio max" : "Price max"}</label>
                      <input
                        value={rentasParams.rpmax}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rpmax: e.target.value }))}
                        inputMode="numeric"
                        placeholder="2800"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Recámaras" : "Beds"}</label>
                      <select
                        value={rentasParams.rbeds}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rbeds: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="studio">{lang === "es" ? "Estudio" : "Studio"}</option>
                        <option value="room">{lang === "es" ? "Cuarto" : "Room"}</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4+">4+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Baños" : "Baths"}</label>
                      <select
                        value={rentasParams.rbaths}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rbaths: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4+">4+</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Tipo" : "Type"}</label>
                      <select
                        value={rentasParams.rtype}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rtype: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="apartment">{lang === "es" ? "Apartamento" : "Apartment"}</option>
                        <option value="house">{lang === "es" ? "Casa" : "House"}</option>
                        <option value="townhome">{lang === "es" ? "Townhome" : "Townhome"}</option>
                        <option value="condo">{lang === "es" ? "Condominio" : "Condo"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Mascotas" : "Pets"}</label>
                      <select
                        value={rentasParams.rpets}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rpets: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="any">{lang === "es" ? "Se aceptan" : "Allowed"}</option>
                        <option value="dogs">{lang === "es" ? "Perros" : "Dogs"}</option>
                        <option value="cats">{lang === "es" ? "Gatos" : "Cats"}</option>
                        <option value="none">{lang === "es" ? "No" : "None"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Estacionamiento" : "Parking"}</label>
                      <select
                        value={rentasParams.rparking}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rparking: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="garage">{lang === "es" ? "Garage" : "Garage"}</option>
                        <option value="assigned">{lang === "es" ? "Asignado" : "Assigned"}</option>
                        <option value="street">{lang === "es" ? "Calle" : "Street"}</option>
                        <option value="none">{lang === "es" ? "Ninguno" : "None"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Amueblado" : "Furnished"}</label>
                      <select
                        value={rentasParams.rfurnished}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rfurnished: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
                        <option value="no">{lang === "es" ? "No" : "No"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Utilidades incl." : "Utilities incl."}</label>
                      <select
                        value={rentasParams.rutilities}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rutilities: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="yes">{lang === "es" ? "Sí" : "Yes"}</option>
                        <option value="no">{lang === "es" ? "No" : "No"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Disponible" : "Available"}</label>
                      <select
                        value={rentasParams.ravailable}
                        onChange={(e) => setRentasParams((p) => ({ ...p, ravailable: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="now">{lang === "es" ? "Ahora" : "Now"}</option>
                        <option value="30">{lang === "es" ? "En 30 días" : "In 30 days"}</option>
                        <option value="60">{lang === "es" ? "En 60 días" : "In 60 days"}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">{lang === "es" ? "Contrato" : "Lease"}</label>
                      <select
                        value={rentasParams.rleaseterm}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rleaseterm: e.target.value }))}
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="month-to-month">{lang === "es" ? "Mes a mes" : "Month-to-month"}</option>
                        <option value="6">{lang === "es" ? "6 meses" : "6 months"}</option>
                        <option value="12">{lang === "es" ? "12 meses" : "12 months"}</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">Sqft min</label>
                      <input
                        value={rentasParams.rsqmin}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rsqmin: e.target.value }))}
                        inputMode="numeric"
                        placeholder="600"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#111111]">Sqft max</label>
                      <input
                        value={rentasParams.rsqmax}
                        onChange={(e) => setRentasParams((p) => ({ ...p, rsqmax: e.target.value }))}
                        inputMode="numeric"
                        placeholder="1200"
                        className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-3 text-sm text-[#111111] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : null}


              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => resetAllFilters()}
                  className="rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-xs text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                  aria-label={UI.clear[lang]}
                >
                  {UI.clear[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-xl border border-[#C9B46A]/70 bg-[#111111]/15 px-4 py-2 text-sm text-[#111111] hover:bg-[#111111]/20"
                >
                  {lang === "es" ? "Aplicar" : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* LOCATION MODAL (unchanged) */}
      {locationOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setLocationOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-[#F5F5F5] p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-semibold tracking-tight text-yellow-300">{UI.location[lang]}</div>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                className="rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-1 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
              >
                {UI.close[lang]}
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div ref={citySuggestRef} className="relative">
                <label className="block text-xs font-semibold text-[#111111]">
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
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#111111] focus:border-[#A98C2A]/60"
                />

                {citySuggestOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-56 overflow-auto rounded-xl border border-black/10 bg-[#F5F5F5] shadow-xl">
                    {cityOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setCity(name);
                          setZip("");
                          setCityQuery(name);
                          setCitySuggestOpen(false);
                          setLocMsg("");
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-1 text-[11px] text-[#111111]">
                  {lang === "es"
                    ? "Si eliges ciudad, el ZIP se limpia automáticamente."
                    : "If you pick a city, ZIP is cleared automatically."}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111]">
                  {UI.zip[lang]}
                </label>
                <input
                  value={zip}
                  onChange={(e) => {
                    const next = e.target.value;
                    const cleaned = next.replace(/\D/g, "").slice(0, 5);
                    setZip(next);

                    if (cleaned.length === 5) {
                      const known = Boolean((ZIP_GEO as Record<string, LatLng | undefined>)[cleaned]);
                      if (known) {
                        setCity(DEFAULT_CITY);
                        setCityQuery("");
                        setLocMsg("");
                      }
                    }
                  }}
                  placeholder={lang === "es" ? "Ej: 95116" : "e.g. 95116"}
                  inputMode="numeric"
                  className="mt-2 w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-3 text-sm text-[#111111] outline-none placeholder:text-[#111111] focus:border-[#A98C2A]/60"
                />

                <div className="mt-1 text-[11px] text-[#111111]">
                  {lang === "es"
                    ? "ZIP solo aplica si existe (5 dígitos). Si no existe, no se aplica ubicación."
                    : "ZIP only applies if it exists (5 digits). If not found, location won’t apply."}
                </div>

                {zipModeRaw && !zipAnchor.known ? (
                  <div className="mt-2 text-xs text-red-300">
                    {lang === "es" ? "ZIP no encontrado." : "ZIP not found."}
                  </div>
                ) : null}

                {zipMode && zipNearestCity ? (
                  <div className="mt-2 text-xs text-[#111111]">
                    {lang === "es" ? `Cerca de: ${zipNearestCity}` : `Near: ${zipNearestCity}`}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={onUseMyLocation}
                disabled={usingMyLocation}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm",
                  usingMyLocation
                    ? "border-black/10 bg-[#F5F5F5] text-[#111111]"
                    : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
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
                  className="rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-2 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                >
                  {UI.clear[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  className="rounded-xl border border-[#C9B46A]/70 bg-[#111111]/15 px-4 py-2 text-sm text-[#111111] hover:bg-[#111111]/20"
                >
                  {UI.done[lang]}
                </button>
              </div>
            </div>

            {nearbyCityChips.length ? (
              <div className="mt-5">
                <div className="text-xs font-semibold text-[#111111]">
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
                        "rounded-full border px-3 py-1.5 text-xs sm:py-1",
                        normalize(c.city) === normalize(resolvedCity.name)
                          ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                          : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
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

      {/* Servicios "All" deep-search drawer (Yelp-style) */}
      {isServicios && serviciosAllOpen ? (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/25"
            onClick={() => {
                    setServiciosParams(serviciosDraft);
                    setServiciosAllOpen(false);
                  }}
          />

          <div className="absolute inset-y-0 left-0 w-[92vw] max-w-[420px] overflow-hidden rounded-r-2xl border border-black/10 bg-[#F5F5F5] shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-3">
              <div className="text-sm font-semibold text-[#111111]">
                {lang === "es" ? "Filtros" : "Filters"}
              </div>
              <button
                type="button"
                onClick={() => setServiciosAllOpen(false)}
                className="rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
              >
                {lang === "es" ? "Cerrar" : "Close"}
              </button>
            </div>

            <div className="h-full overflow-y-auto px-4 pb-6 pt-4">
              {/* Servicios-only header: subcategory context or hint to choose above */}
              <div className="text-xs text-[#111111]">
                {serviciosDraft.stype
                  ? (lang === "es" ? "Filtros para: " : "Filters for: ") + servicioLabel(serviciosDraft.stype, lang)
                  : lang === "es"
                    ? "Elige una subcategoría arriba para ver filtros específicos."
                    : "Choose a subcategory above to see specific filters."}
              </div>

              {/* Universal Servicios filters (URL params: sv_mobile, sv_shop, sv_247) */}
              <div className="mt-4 text-xs font-semibold text-[#111111]">
                {lang === "es" ? "Sugerido" : "Suggested"}
              </div>
              <div className="mt-3 grid gap-2">
                {serviciosDrawerFilters.universal.map((opt) => {
                  const checked = params?.get(opt.paramKey) === "1";
                  const toggle = () => {
                    const next = new URLSearchParams(params?.toString() ?? "");
                    if (next.get(opt.paramKey) === "1") next.delete(opt.paramKey);
                    else next.set(opt.paramKey, "1");
                    router.replace(pathname + (next.toString() ? "?" + next.toString() : ""));
                  };
                  return (
                    <label key={opt.paramKey} className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5 text-sm text-[#111111]">
                      <input type="checkbox" checked={checked} onChange={toggle} />
                      {opt.label[lang]}
                    </label>
                  );
                })}
              </div>

              {/* Subtype-specific: mechanic (URL params sv_mech_*) */}
              {serviciosDraft.stype === "mechanic" && serviciosDrawerFilters.byStype.mechanic ? (
                <>
                  <div className="mt-6 text-xs font-semibold text-[#111111]">
                    {serviciosDrawerFilters.byStype.mechanic.sectionLabel[lang]}
                  </div>
                  <div className="mt-3 grid gap-2">
                    {serviciosDrawerFilters.byStype.mechanic.options.map((opt) => {
                      const checked = params?.get(opt.paramKey) === "1";
                      const toggle = () => {
                        const next = new URLSearchParams(params?.toString() ?? "");
                        if (next.get(opt.paramKey) === "1") next.delete(opt.paramKey);
                        else next.set(opt.paramKey, "1");
                        router.replace(pathname + (next.toString() ? "?" + next.toString() : ""));
                      };
                      return (
                        <label key={opt.paramKey} className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5 text-sm text-[#111111]">
                          <input type="checkbox" checked={checked} onChange={toggle} />
                          {opt.label[lang]}
                        </label>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {/* Más filtros (non-mechanic subtypes only) */}
              {serviciosDraft.stype && serviciosDraft.stype !== "mechanic" ? (() => {
                const defs = getServiciosFeatureDefs(serviciosDraft.stype);
                if (!defs.length) return null;
                const set = parseCsvSet(serviciosDraft.sfeat);
                return (
                  <>
                    <div className="mt-6 text-xs font-semibold text-[#111111]">
                      {lang === "es" ? "Más filtros" : "More filters"}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {defs.map((d) => {
                        const active = set.has(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => {
                              const next = new Set(set);
                              if (active) next.delete(d.key);
                              else next.add(d.key);
                              setServiciosDraft((p) => ({ ...p, sfeat: setToCsv(next) }));
                              setPage(1);
                            }}
                            className={cx(
                              "rounded-full border px-3 py-2 text-sm",
                              active
                                ? "border-yellow-500/40 bg-[#111111]/15 text-[#111111]"
                                : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                            )}
                          >
                            {d.label[lang]}
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })() : null}

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setServiciosDraft(EMPTY_SERVICIOS_PARAMS);
                    setServiciosParams(EMPTY_SERVICIOS_PARAMS);
                    setQ("");
                    const next = new URLSearchParams(params?.toString() ?? "");
                    Array.from(next.keys()).forEach((k) => { if (k.startsWith("sv_")) next.delete(k); });
                    router.replace(pathname + (next.toString() ? "?" + next.toString() : ""));
                  }}
                  className="rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-2 text-sm text-[#111111] hover:bg-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                >
                  {lang === "es" ? "Limpiar" : "Clear"}
                </button>
                <button
                  type="button"
                  onClick={() => setServiciosAllOpen(false)}
                  className="rounded-xl bg-[#111111] px-4 py-2 text-sm text-[#F5F5F5] hover:bg-black focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30"
                >
                  {lang === "es" ? "Aplicar" : "Apply"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Back To Top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-[#111111] p-3 text-[#F5F5F5] shadow-lg hover:bg-[#111111] md:hidden"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
