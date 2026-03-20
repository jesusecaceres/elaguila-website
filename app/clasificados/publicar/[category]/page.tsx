"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
} from "react-icons/fi";
import { MdOutlineBed, MdOutlineBathtub, MdOutlineSquareFoot } from "react-icons/md";
import { createSupabaseBrowserClient, withAuthTimeout, AUTH_CHECK_TIMEOUT_MS } from "../../../lib/supabase/browser";
import { clearAllClassifiedsDrafts, RULES_CONFIRMED_KEY, getStoredDraftId, setStoredDraftId, clearStoredDraftId } from "../../lib/classifiedsDraftStorage";
import {
  createDraft,
  updateDraft,
  getDraft,
  getDraftsForCategory,
  getLatestDraftForCategory,
  getLatestDraftForRentasBranch,
  deleteDraftInDb,
  type DraftDataPayload,
  type ListingDraftRow,
} from "../../lib/listingDraftsDb";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { categoryConfig, type CategoryKey } from "../../config/categoryConfig";
import { getStepOrderForCategory } from "../../config/categorySchema";
import {
  EN_VENTA_SUBCATEGORIES,
  getArticuloOptionsForSubcategory,
  getArticuloLabel,
} from "../../config/enVentaTaxonomy";

/** En Venta (BR-style) Basics: property types. */
const EN_VENTA_BR_PROPERTY_TYPES: Array<{ value: string; label: { es: string; en: string } }> = [
  { value: "casa", label: { es: "Casa", en: "House" } },
  { value: "apartamento", label: { es: "Apartamento", en: "Apartment" } },
  { value: "condo", label: { es: "Condo", en: "Condo" } },
  { value: "townhouse", label: { es: "Townhouse", en: "Townhouse" } },
  { value: "lote", label: { es: "Lote", en: "Lot" } },
  { value: "finca", label: { es: "Finca", en: "Farm / ranch" } },
  { value: "oficina", label: { es: "Oficina", en: "Office" } },
  { value: "local-comercial", label: { es: "Local comercial", en: "Commercial space" } },
  { value: "edificio", label: { es: "Edificio", en: "Building" } },
  { value: "proyecto-nuevo", label: { es: "Proyecto nuevo", en: "New development" } },
];

/** BR Privado: property type groups for conditional fields. Do not add to negocio in this pass. */
const BR_RESIDENTIAL_TYPES = ["casa", "apartamento", "condo", "townhouse", "finca"];
const BR_LOTE_TYPES = ["lote"];
const BR_COMERCIAL_TYPES = ["oficina", "local-comercial"];
const BR_EDIFICIO_TYPES = ["edificio"];
const BR_PROYECTO_NUEVO_TYPES = ["proyecto-nuevo"];

function isBrPrivadoResidential(propertyType: string): boolean {
  return BR_RESIDENTIAL_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}
function isBrPrivadoLote(propertyType: string): boolean {
  return BR_LOTE_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}
function isBrPrivadoComercial(propertyType: string): boolean {
  return BR_COMERCIAL_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}
function isBrPrivadoEdificio(propertyType: string): boolean {
  return BR_EDIFICIO_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}
function isBrPrivadoProyectoNuevo(propertyType: string): boolean {
  return BR_PROYECTO_NUEVO_TYPES.includes((propertyType ?? "").trim().toLowerCase());
}
import {
  RENTAS_SUBCATEGORIES,
  getTipoOptionsForSubcategory,
  getRentasDetailFields,
} from "../../config/rentasTaxonomy";

/** Rentas Negocio: price per post (30 days). Single source of truth. */
const RENTAS_NEGOCIO_PRICE_PER_POST = "$29.99";

/** BR Privado: price per post. */
const BR_PRIVADO_PRICE_PER_POST = "$49.99";
/** BR Negocio: weekly or monthly. */
const BR_NEGOCIO_PRICE_WEEKLY = "$89.99";
const BR_NEGOCIO_PRICE_MONTHLY = "$329.99";
import { BUSINESS_META_KEYS } from "../../config/businessListingContract";
import { buildNegocioRedesPayload, formatUsPhone10 } from "../../lib/brNegocioContactHelpers";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaTwitter, FaYoutube } from "react-icons/fa";
import { BIENES_RAICES_SUBCATEGORIES, getBienesRaicesSubcategoryLabel } from "../../config/bienesRaicesTaxonomy";
import { EnVentaPublishShell } from "../../en-venta/publish/EnVentaPublishShell";
import { BienesRaicesNegocioPublishShell } from "../../bienes-raices/negocio/publish/BienesRaicesNegocioPublishShell";
import { BienesRaicesPublishShell } from "../../bienes-raices/shared/publish/BienesRaicesPublishShell";
import { BienesRaicesPublishTrackStep } from "../../bienes-raices/shared/publish/BienesRaicesPublishTrackStep";
import { RentasNegocioPublishShell } from "../../rentas/negocio/publish/RentasNegocioPublishShell";
import { RentasPublishShell } from "../../rentas/shared/publish/RentasPublishShell";
import { RentasPublishTrackStep } from "../../rentas/shared/publish/RentasPublishTrackStep";

/** BR private: 6-bucket subcategory keys (source of truth for type-aware copy). */
type BrSubcategoriaKey = "residencial" | "condos-townhomes" | "multifamiliar" | "terrenos" | "comercial" | "industrial";

/** Derive 6-bucket subcategory from property type value. Used when bienesRaicesSubcategoria is not set. */
function getBrSubcategoriaFromPropertyType(propertyType: string): BrSubcategoriaKey {
  const pt = (propertyType ?? "").trim().toLowerCase();
  if (["casa", "apartamento", "finca"].includes(pt)) return "residencial";
  if (["condo", "townhouse"].includes(pt)) return "condos-townhomes";
  if (["edificio"].includes(pt)) return "multifamiliar";
  if (["lote"].includes(pt)) return "terrenos";
  if (["oficina", "local-comercial"].includes(pt)) return "comercial";
  if (["proyecto-nuevo"].includes(pt)) return "residencial";
  return "residencial";
}

/** BR private: copy profile per subcategory. Drives placeholders, helpers, and field emphasis. */
const BR_PRIVATE_COPY_PROFILES: Record<BrSubcategoriaKey, {
  titlePlaceholder: { es: string; en: string };
  subtypePlaceholder: { es: string; en: string };
  descriptionHelper: { es: string; en: string };
  descriptionPlaceholder: { es: string; en: string };
  emphasize: string[];
  hideOrOptional: string[];
}> = {
  residencial: {
    titlePlaceholder: { es: "Ej: Casa 3 recámaras en zona tranquila", en: "e.g. 3-bedroom home in a quiet area" },
    subtypePlaceholder: { es: "Ej: Casa independiente, Duplex", en: "e.g. Single-family home, Duplex" },
    descriptionHelper: { es: "Describe la propiedad, su ubicación y características principales.", en: "Describe the property, location, and main features." },
    descriptionPlaceholder: { es: "Ej: Casa amplia con jardín, 3 recámaras, zona tranquila.", en: "e.g. Spacious home with garden, 3 bedrooms, quiet area." },
    emphasize: ["recámaras", "baños", "pies²", "niveles", "estacionamiento", "terreno"],
    hideOrOptional: [],
  },
  "condos-townhomes": {
    titlePlaceholder: { es: "Ej: Condo 2 recámaras cerca del centro", en: "e.g. 2-bedroom condo near downtown" },
    subtypePlaceholder: { es: "Ej: Condominio, Townhome", en: "e.g. Condo, Townhome" },
    descriptionHelper: { es: "Describe la unidad, ubicación y amenidades importantes.", en: "Describe the unit, location, and key amenities." },
    descriptionPlaceholder: { es: "Ej: Condo con área de asador, estacionamiento incluido.", en: "e.g. Condo with BBQ area, parking included." },
    emphasize: ["recámaras", "baños", "pies²", "estacionamiento"],
    hideOrOptional: ["terreno"],
  },
  multifamiliar: {
    titlePlaceholder: { es: "Ej: Propiedad multifamiliar con 2 unidades", en: "e.g. Multi-family property with 2 units" },
    subtypePlaceholder: { es: "Ej: Duplex, Triplex, Fourplex", en: "e.g. Duplex, Triplex, Fourplex" },
    descriptionHelper: { es: "Describe la propiedad, cantidad de unidades y sus características principales.", en: "Describe the property, number of units, and main features." },
    descriptionPlaceholder: { es: "Ej: Duplex con 2 unidades de 2 recámaras cada una.", en: "e.g. Duplex with 2 units, 2 bedrooms each." },
    emphasize: ["recámaras", "baños", "pies²", "estacionamiento"],
    hideOrOptional: [],
  },
  terrenos: {
    titlePlaceholder: { es: "Ej: Terreno residencial en buena ubicación", en: "e.g. Residential lot in a great location" },
    subtypePlaceholder: { es: "Ej: Lote residencial, Parcela", en: "e.g. Residential lot, Parcel" },
    descriptionHelper: { es: "Describe el terreno, ubicación, tamaño y usos posibles.", en: "Describe the lot, location, size, and possible uses." },
    descriptionPlaceholder: { es: "Ej: Terreno plano, servicios en la calle, zona residencial.", en: "e.g. Flat lot, utilities at street, residential zone." },
    emphasize: ["terreno", "zonificación", "servicios disponibles", "ubicación"],
    hideOrOptional: ["recámaras", "baños", "niveles"],
  },
  comercial: {
    titlePlaceholder: { es: "Ej: Oficina en zona comercial", en: "e.g. Office space in a commercial area" },
    subtypePlaceholder: { es: "Ej: Oficina, Local comercial", en: "e.g. Office, Retail space" },
    descriptionHelper: { es: "Describe el espacio, ubicación, tamaño y uso ideal.", en: "Describe the space, location, size, and ideal use." },
    descriptionPlaceholder: { es: "Ej: Oficina 800 pies², baño, estacionamiento.", en: "e.g. 800 sq ft office, restroom, parking." },
    emphasize: ["pies²", "estacionamiento", "zonificación", "ubicación"],
    hideOrOptional: ["recámaras"],
  },
  industrial: {
    titlePlaceholder: { es: "Ej: Bodega industrial con amplio espacio", en: "e.g. Industrial warehouse with ample space" },
    subtypePlaceholder: { es: "Ej: Bodega, Nave industrial, Taller", en: "e.g. Warehouse, Industrial space, Workshop" },
    descriptionHelper: { es: "Describe el espacio, tamaño, acceso y uso industrial.", en: "Describe the space, size, access, and industrial use." },
    descriptionPlaceholder: { es: "Ej: Bodega 5,000 pies², carga y descarga fácil.", en: "e.g. 5,000 sq ft warehouse, easy loading." },
    emphasize: ["pies²", "terreno", "estacionamiento", "zonificación"],
    hideOrOptional: ["recámaras"],
  },
};
import { CA_CITIES, CITY_ALIASES } from "@/app/data/locations/norcal";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { MediaUploader } from "../../components/MediaUploader";
import ListingView, { type ListingData } from "../../components/ListingView";
import RentasPrivadoPublishPreview from "../../components/RentasPrivadoPublishPreview";

/** Real categories for publicar (no "all", no "Más"). Same order and icons as lista explorer. */
const PUBLICAR_CATEGORIES: Array<{
  key: Exclude<CategoryKey, "all">;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "en-venta", Icon: FiShoppingCart },
  { key: "bienes-raices", Icon: FiLayers },
  { key: "rentas", Icon: FiHome },
  { key: "autos", Icon: FiTruck },
  { key: "restaurantes", Icon: FiCoffee },
  { key: "servicios", Icon: FiTool },
  { key: "empleos", Icon: FiBriefcase },
  { key: "clases", Icon: FiBook },
  { key: "comunidad", Icon: FiUsers },
  { key: "travel", Icon: FiMapPin },
];

type Lang = "es" | "en";
type PublishStep = "category" | "rentas-track" | "bienes-raices-track" | "basics" | "details" | "media";

type DraftV1 = {
  v: 1;
  step: PublishStep;
  title: string;
  description: string;
  isFree: boolean;
  price: string;
  city: string;
  category: string;
  details: Record<string, string>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  updatedAt: string;
};

function safeInternalRedirect(raw: string | null | undefined) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  if (v.startsWith("/")) return v;
  return "";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = r.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64 ?? "");
    };
    r.onerror = () => reject(new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

/** Full data URL for an image file. Used in preview draft so images survive navigation (blob URLs are revoked on unmount). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string) ?? "");
    r.onerror = () => reject(new Error("File read failed"));
    r.readAsDataURL(file);
  });
}

function formatMoneyMaybe(raw: string, lang: Lang) {
  const cleaned = (raw ?? "").replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n <= 0) return "";
  try {
    return new Intl.NumberFormat(lang === "es" ? "es-US" : "en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

function formatPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

function formatPhoneDisplay(raw: string): string {
  const digits = formatPhoneDigits(raw);
  if (digits.length <= 3) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function getPhoneDigits(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 10);
}

function getShortPreviewText(raw: string, maxLen = 90): string {
  const t = (raw ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "";
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen).trim() + "…";
}

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  sacramento: { lat: 38.5816, lng: -121.4944 },
  "san jose": { lat: 37.3382, lng: -121.8863 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  oakland: { lat: 37.8044, lng: -122.2712 },
  berkeley: { lat: 37.8715, lng: -122.273 },
  fremont: { lat: 37.5483, lng: -121.9886 },
  stockton: { lat: 37.9577, lng: -121.2908 },
  modesto: { lat: 37.6391, lng: -120.9969 },
  "palo alto": { lat: 37.4419, lng: -122.143 },
  "santa clara": { lat: 37.3541, lng: -121.9552 },
  sunnyvale: { lat: 37.3688, lng: -122.0363 },
  hayward: { lat: 37.6688, lng: -122.0808 },
  concord: { lat: 37.978, lng: -122.0311 },
  vallejo: { lat: 38.1041, lng: -122.2566 },
  "san leandro": { lat: 37.7249, lng: -122.1561 },
};

function normalizeCityKey(input: string): string {
  return stripDiacritics((input ?? "").trim().toLowerCase()).replace(/\s+/g, " ").trim();
}

function getCityCoords(cityName: string): { lat: number; lng: number } | null {
  const key = normalizeCityKey(cityName);
  if (!key) return null;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  const record = CA_CITIES.find(
    (r) => normalizeCityKey(r.city) === key || r.aliases?.some((a) => normalizeCityKey(a) === key)
  );
  return record ? { lat: record.lat, lng: record.lng } : null;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRoughDistanceMiles(viewerCity: string, listingCity: string): number | null {
  const a = getCityCoords(viewerCity);
  const b = getCityCoords(listingCity);
  if (!a || !b) return null;
  return haversineMiles(a.lat, a.lng, b.lat, b.lng);
}

function getRoughDistanceLabel(viewerCity: string, listingCity: string, lang: "es" | "en"): string {
  const miles = getRoughDistanceMiles(viewerCity, listingCity);
  if (miles === null) {
    return lang === "es"
      ? "Agrega una ciudad reconocida para estimar distancia"
      : "Enter a recognized city to estimate distance";
  }
  return lang === "es"
    ? `Aproximadamente a ${Math.round(miles)} millas de ti`
    : `Approximately ${Math.round(miles)} miles from you`;
}

function normalizeCategory(raw: string): CategoryKey | "" {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "";
  const mapped = v === "viajes" ? "travel" : v;
  const keys = Object.keys(categoryConfig) as CategoryKey[];
  return keys.includes(mapped as CategoryKey) ? (mapped as CategoryKey) : "";
}


function parseIsoMaybe(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isFinite(d.getTime()) ? d : null;
}

function isoPlusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function daysBetween(a: Date, b: Date) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function stripDiacritics(s: string): string {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function toCityKey(raw: string): string {
  return stripDiacritics((raw || "").trim().toLowerCase())
    .replace(/[.,']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCity(raw: string): string {
  const key = toCityKey(raw);
  if (!key) return "";
  const fromAlias = CITY_ALIASES[key];
  if (fromAlias) return fromAlias;
  for (const record of CA_CITIES) {
    if (toCityKey(record.city) === key) return record.city;
    if (record.aliases?.some((a) => toCityKey(a) === key)) return record.city;
  }
  return "";
}

function getStableSessionId(userId: string | null): string {
  if (userId) return userId;
  if (typeof window === "undefined") return "ssr";
  const key = "leonix_listing_draft_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

/** Condición options for En Venta (Basics). */
const EN_VENTA_CONDICION: Array<{ value: string; labelEs: string; labelEn: string }> = [
  { value: "new", labelEs: "Nuevo", labelEn: "New" },
  { value: "like-new", labelEs: "Como nuevo", labelEn: "Like new" },
  { value: "good", labelEs: "Buen estado", labelEn: "Good" },
  { value: "fair", labelEs: "Regular", labelEn: "Fair" },
];

type DetailField = {
  key: string;
  label: { es: string; en: string };
  type: "text" | "number" | "select";
  placeholder?: { es: string; en: string };
  options?: Array<{ value: string; label: { es: string; en: string } }>;
};

const DETAIL_FIELDS: Record<string, DetailField[]> = {
  autos: [
    { key: "year", label: { es: "Año", en: "Year" }, type: "number", placeholder: { es: "Ej: 2018", en: "e.g. 2018" } },
    { key: "make", label: { es: "Marca", en: "Make" }, type: "text", placeholder: { es: "Ej: Toyota", en: "e.g. Toyota" } },
    { key: "model", label: { es: "Modelo", en: "Model" }, type: "text", placeholder: { es: "Ej: Camry", en: "e.g. Camry" } },
    { key: "mileage", label: { es: "Millas", en: "Mileage" }, type: "number", placeholder: { es: "Ej: 85000", en: "e.g. 85000" } },
    {
      key: "condition",
      label: { es: "Condición", en: "Condition" },
      type: "select",
      options: [
        { value: "new", label: { es: "Nuevo", en: "New" } },
        { value: "used", label: { es: "Usado", en: "Used" } },
        { value: "certified", label: { es: "Certificado", en: "Certified" } },
      ],
    },
    {
      key: "transmission",
      label: { es: "Transmisión", en: "Transmission" },
      type: "select",
      options: [
        { value: "auto", label: { es: "Automática", en: "Automatic" } },
        { value: "manual", label: { es: "Manual", en: "Manual" } },
      ],
    },
  ],
  /** Rentas uses getCategoryFields("rentas", details) for dynamic field groups by subcategoría/tipo. */
  rentas: [],
  /** Bienes Raíces: property details for preview and final ad. */
  "bienes-raices": [
    { key: "recamaras", label: { es: "Recámaras", en: "Bedrooms" }, type: "number", placeholder: { es: "Ej: 3", en: "e.g. 3" } },
    { key: "banos", label: { es: "Baños", en: "Bathrooms" }, type: "number", placeholder: { es: "Ej: 2", en: "e.g. 2" } },
    { key: "piesCuadrados", label: { es: "Pies cuadrados", en: "Square feet" }, type: "text", placeholder: { es: "Ej: 1,200", en: "e.g. 1,200" } },
    { key: "comodidades", label: { es: "Comodidades / características", en: "Amenities / features" }, type: "text", placeholder: { es: "Otras (opcional)", en: "Other (optional)" } },
    { key: "direccionPropiedad", label: { es: "Dirección o zona", en: "Address or area" }, type: "text", placeholder: { es: "Ej: Calle Principal 123, San José", en: "e.g. 123 Main St, San Jose" } },
  ],
  empleos: [
    { key: "company", label: { es: "Empresa", en: "Company" }, type: "text", placeholder: { es: "Nombre de la empresa", en: "Company name" } },
    {
      key: "jobType",
      label: { es: "Tipo de trabajo", en: "Job type" },
      type: "select",
      options: [
        { value: "full", label: { es: "Tiempo completo", en: "Full-time" } },
        { value: "part", label: { es: "Medio tiempo", en: "Part-time" } },
        { value: "contract", label: { es: "Contrato", en: "Contract" } },
        { value: "temp", label: { es: "Temporal", en: "Temporary" } },
      ],
    },
    {
      key: "workMode",
      label: { es: "Modalidad", en: "Work mode" },
      type: "select",
      options: [
        { value: "onsite", label: { es: "Presencial", en: "On-site" } },
        { value: "remote", label: { es: "Remoto", en: "Remote" } },
        { value: "hybrid", label: { es: "Híbrido", en: "Hybrid" } },
      ],
    },
    { key: "pay", label: { es: "Pago", en: "Pay" }, type: "text", placeholder: { es: "Ej: $22/hr o $900/sem", en: "e.g. $22/hr or $900/wk" } },
  ],
  servicios: [
    { key: "serviceType", label: { es: "Tipo de servicio", en: "Service type" }, type: "text", placeholder: { es: "Ej: Jardinería, Plomería", en: "e.g. Landscaping, Plumbing" } },
    { key: "area", label: { es: "Zona", en: "Service area" }, type: "text", placeholder: { es: "Ej: San José + 15 mi", en: "e.g. San Jose + 15 mi" } },
    { key: "availability", label: { es: "Disponibilidad", en: "Availability" }, type: "text", placeholder: { es: "Ej: Lun–Sáb", en: "e.g. Mon–Sat" } },
  ],
  "en-venta": [
    {
      key: "rama",
      label: { es: "Subcategoría", en: "Subcategory" },
      type: "select",
      options: EN_VENTA_SUBCATEGORIES.map((s) => ({ value: s.key, label: s.label })),
    },
    { key: "itemType", label: { es: "Artículo", en: "Item type" }, type: "text", placeholder: { es: "Definido por subcategoría", en: "Set by subcategory" } },
    {
      key: "condition",
      label: { es: "Condición", en: "Condition" },
      type: "select",
      options: EN_VENTA_CONDICION.map((c) => ({ value: c.value, label: { es: c.labelEs, en: c.labelEn } })),
    },
  ],
  restaurantes: [
    {
      key: "placeType",
      label: { es: "Tipo de negocio", en: "Business type" },
      type: "select",
      options: [
        { value: "brick", label: { es: "Local (restaurante / café)", en: "Brick & mortar (restaurant / café)" } },
        { value: "truck", label: { es: "Food truck", en: "Food truck" } },
        { value: "popup", label: { es: "Pop-up / puesto temporal", en: "Pop-up / temporary stand" } },
      ],
    },
    { key: "cuisine", label: { es: "Cocina", en: "Cuisine" }, type: "text", placeholder: { es: "Ej: Mexicana, Pupusas", en: "e.g. Mexican, Pupusas" } },
    { key: "address", label: { es: "Dirección (opcional)", en: "Address (optional)" }, type: "text", placeholder: { es: "Ej: 123 Main St", en: "e.g. 123 Main St" } },
    { key: "zip", label: { es: "ZIP (opcional)", en: "ZIP (optional)" }, type: "text", placeholder: { es: "Ej: 95112", en: "e.g. 95112" } },
    { key: "hours", label: { es: "Horario (opcional)", en: "Hours (optional)" }, type: "text", placeholder: { es: "Ej: Lun–Sáb 10am–9pm", en: "e.g. Mon–Sat 10am–9pm" } },
    { key: "website", label: { es: "Sitio web (opcional)", en: "Website (optional)" }, type: "text", placeholder: { es: "https://", en: "https://" } },
    { key: "notes", label: { es: "Notas (opcional)", en: "Notes (optional)" }, type: "text", placeholder: { es: "Pedidos por teléfono, especialidades…", en: "Phone orders, specialties…" } },
  ],

};

/** Common amenities for BR; click to add/remove from comodidades (comma-separated). */
const BR_COMODIDADES_OPTIONS: Array<{ es: string; en: string }> = [
  { es: "Estacionamiento", en: "Parking" },
  { es: "Jardín", en: "Garden" },
  { es: "A/C", en: "A/C" },
  { es: "Calefacción", en: "Heating" },
  { es: "Lavandería", en: "Laundry" },
  { es: "Seguridad 24h", en: "24h security" },
  { es: "Gimnasio", en: "Gym" },
  { es: "Alberca", en: "Pool" },
  { es: "Área de juegos", en: "Playground" },
  { es: "Mascotas permitidas", en: "Pets allowed" },
];

function getCategoryFields(cat: string, details?: Record<string, string>): DetailField[] {
  if (cat === "rentas" && details) {
    const sub = (details.rentasSubcategoria ?? "").trim();
    const tipo = (details.tipoPropiedad ?? "").trim();
    if (!sub || !tipo) return [];
    return getRentasDetailFields(sub, tipo) as DetailField[];
  }
  if (cat === "bienes-raices" && details) {
    const brBranch = (details.bienesRaicesBranch ?? "").trim().toLowerCase();
    const pt = (details.enVentaPropertyType ?? "").trim();
    // BR application branches by sub property type (bienesRaicesSubcategoria / enVentaPropertyType); taxonomy is source of truth.
    if (brBranch === "negocio") return DETAIL_FIELDS["bienes-raices"] ?? [];
    if (brBranch === "privado") {
      if (isBrPrivadoResidential(pt)) return DETAIL_FIELDS["bienes-raices"] ?? [];
      if (isBrPrivadoLote(pt) || isBrPrivadoComercial(pt) || isBrPrivadoEdificio(pt) || isBrPrivadoProyectoNuevo(pt)) return [];
    }
  }
  return DETAIL_FIELDS[cat] ?? [];
}

const RENTAS_PLAZO_LABELS: Record<string, { es: string; en: string }> = {
  "mes-a-mes": { es: "Mes a mes", en: "Month to month" },
  "6-meses": { es: "6 meses", en: "6 months" },
  "12-meses": { es: "12 meses", en: "12 months" },
  "1-ano": { es: "1 año", en: "1 year" },
  "2-anos": { es: "2 años", en: "2 years" },
};

/** Digits only for BR negocio sqft / lot stored values. */
function brNegocioDigitsOnly(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

/** Comma-grouped display while typing (US grouping); underlying value uses `brNegocioDigitsOnly`. */
function formatBrNegocioIntegerInputDisplay(raw: string): string {
  const d = brNegocioDigitsOnly(raw);
  if (!d) return "";
  return Number(d).toLocaleString("en-US");
}

/** BR negocio listing price: comma display; validation uses digits stripped from state. */
function formatBrNegocioPriceInputDisplay(raw: string): string {
  const d = raw.replace(/[^0-9]/g, "");
  if (!d) return "";
  return Number(d).toLocaleString("en-US");
}

/** Preview / detail row: "123 Main St, City, ST 95112" or legacy single line. */
function formatBrNegocioAddressLine(details: Record<string, string>, cityDisplay: string): string {
  const num = (details.brNegocioStreetNumber ?? "").trim();
  const st = (details.brNegocioStreet ?? "").trim();
  const streetPart = [num, st].filter(Boolean).join(" ");
  const c = (cityDisplay ?? "").trim();
  const state = (details.brNegocioState ?? "").trim();
  const zip = (details.brNegocioZip ?? "").trim();
  const stateZip = [state, zip].filter(Boolean).join(" ");
  const parts: string[] = [];
  if (streetPart) parts.push(streetPart);
  if (c) parts.push(c);
  if (stateZip) parts.push(stateZip);
  if (parts.length) return parts.join(", ");
  return (details.enVentaAddress ?? "").trim() || (details.direccionPropiedad ?? "").trim();
}

function formatBrNegocioDetailNumberDisplay(raw: string): string {
  const d = raw.replace(/[^\d]/g, "");
  if (!d) return raw.trim();
  return Number(d).toLocaleString("en-US");
}

function isFloorplanUrlProbablyPdf(url: string): boolean {
  const u = url.split("?")[0]?.toLowerCase() ?? "";
  return u.endsWith(".pdf") || u.includes(".pdf");
}

function isFloorplanUrlProbablyImage(url: string): boolean {
  const u = url.split("?")[0] ?? "";
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(u);
}

function getDetailPairs(cat: string, lang: Lang, details: Record<string, string>, cityDisplay = "") {
  const fields = getCategoryFields(cat, details);
  const out: Array<{ label: string; value: string }> = [];
  // En Venta: item-selling details come from fields (rama, itemType, condition) only.
  if (cat === "bienes-raices") {
    const brBranch = (details.bienesRaicesBranch ?? "").trim().toLowerCase();
    const pt = (details.enVentaPropertyType ?? "").trim();
    if (pt) {
      const opt = EN_VENTA_BR_PROPERTY_TYPES.find((o) => o.value === pt);
      out.push({ label: lang === "es" ? "Tipo de propiedad" : "Property type", value: opt ? opt.label[lang] : pt });
    }
    const subtype = (details.enVentaPropertySubtype ?? "").trim();
    if (subtype) out.push({ label: lang === "es" ? "Subtipo" : "Subtype", value: subtype });
    const zone = (details.enVentaZone ?? "").trim();
    if (zone) out.push({ label: lang === "es" ? "Nombre de la vecindad" : "Neighborhood name", value: zone });
    // Canonical labels for preview summary (BienesRaicesPreviewListing): "Dirección" / "Address".
    // BR negocio: split street / city / state / zip; else legacy single line (+ direccionPropiedad).
    const addrLine =
      brBranch === "negocio"
        ? formatBrNegocioAddressLine(details, cityDisplay)
        : (details.enVentaAddress ?? "").trim() || (details.direccionPropiedad ?? "").trim();
    if (addrLine) out.push({ label: lang === "es" ? "Dirección" : "Address", value: addrLine });
    if (isBrPrivadoResidential(pt) || brBranch === "negocio") {
      const br = (details.enVentaBedrooms ?? "").trim();
      if (br) out.push({ label: lang === "es" ? "Recámaras" : "Bedrooms", value: br });
      const ba = (details.enVentaBathrooms ?? "").trim();
      if (ba) out.push({ label: lang === "es" ? "Baños" : "Bathrooms", value: ba });
      const hb = (details.enVentaHalfBathrooms ?? "").trim();
      if (hb) out.push({ label: lang === "es" ? "Medios baños" : "Half bathrooms", value: hb });
    }
    const sq = (details.enVentaSquareFeet ?? "").trim();
    if (sq) {
      const sqVal = brBranch === "negocio" ? formatBrNegocioDetailNumberDisplay(sq) : sq;
      out.push({ label: lang === "es" ? "Pies²" : "Sq ft", value: sqVal });
    }
    const lot = (details.enVentaLotSize ?? "").trim();
    if (lot) {
      const lotVal = brBranch === "negocio" ? formatBrNegocioDetailNumberDisplay(lot) : lot;
      out.push({ label: lang === "es" ? "Terreno" : "Lot size", value: lotVal });
    }
    const lv = (details.enVentaLevels ?? "").trim();
    if (lv) out.push({ label: lang === "es" ? "Niveles" : "Levels", value: lv });
    const pk = (details.enVentaParkingSpaces ?? "").trim();
    if (pk) out.push({ label: lang === "es" ? "Estacionamiento" : "Parking", value: pk });
    const videoUrl = (details.enVentaVideoUrl ?? "").trim();
    if (videoUrl) out.push({ label: lang === "es" ? "Video de la propiedad" : "Property video", value: videoUrl });
    const virtualTour = (details.enVentaVirtualTourUrl ?? details.negocioRecorridoVirtual ?? "").trim();
    if (virtualTour) out.push({ label: lang === "es" ? "Tour virtual" : "Virtual tour", value: virtualTour });
    const floorPlan = (details.negocioFloorPlanUrl ?? "").trim();
    if (floorPlan) out.push({ label: lang === "es" ? "Plano / Floorplan" : "Floorplan", value: floorPlan });
    const yearBuilt = (details.enVentaYearBuilt ?? "").trim();
    if (yearBuilt) out.push({ label: lang === "es" ? "Año de construcción" : "Year built", value: yearBuilt });
    const zoning = (details.enVentaZoning ?? "").trim();
    if (zoning) out.push({ label: lang === "es" ? "Zonificación" : "Zoning", value: zoning });
    const servAgua = (details.enVentaServicioAgua ?? "").trim().toLowerCase();
    const servElec = (details.enVentaServicioElectricidad ?? "").trim().toLowerCase();
    const servGas = (details.enVentaServicioGas ?? "").trim().toLowerCase();
    const servDrenaje = (details.enVentaServicioDrenaje ?? "").trim().toLowerCase();
    const servInternet = (details.enVentaServicioInternet ?? "").trim().toLowerCase();
    const serviciosList: string[] = [];
    if (servAgua === "si" || servAgua === "sí" || servAgua === "yes") serviciosList.push(lang === "es" ? "Agua" : "Water");
    if (servElec === "si" || servElec === "sí" || servElec === "yes") serviciosList.push(lang === "es" ? "Electricidad" : "Electric");
    if (servGas === "si" || servGas === "sí" || servGas === "yes") serviciosList.push(lang === "es" ? "Gas" : "Gas");
    if (servDrenaje === "si" || servDrenaje === "sí" || servDrenaje === "yes") serviciosList.push(lang === "es" ? "Drenaje" : "Sewer");
    if (servInternet === "si" || servInternet === "sí" || servInternet === "yes") serviciosList.push("Internet");
    if (serviciosList.length > 0) out.push({ label: lang === "es" ? "Servicios disponibles" : "Utilities available", value: serviciosList.join(", ") });
    const utilDetails = (details.enVentaUtilitiesForProperty ?? "").trim();
    if (utilDetails && brBranch !== "negocio") {
      out.push({ label: lang === "es" ? "Detalles adicionales de servicios" : "Additional utility details", value: utilDetails });
    }
    if (brBranch === "negocio") {
      const negocioNombre = (details.negocioNombre ?? "").trim() || (details.enVentaBusinessName ?? "").trim();
      if (negocioNombre) out.push({ label: lang === "es" ? "Nombre del negocio" : "Business name", value: negocioNombre });
      out.push({ label: lang === "es" ? "Plan" : "Plan", value: lang === "es" ? "Negocio" : "Business" });
      const negocioAgente = (details.negocioAgente ?? "").trim() || (details.enVentaAgentName ?? "").trim();
      if (negocioAgente) out.push({ label: lang === "es" ? "Agente" : "Agent", value: negocioAgente });
    }
  }
  if (cat === "rentas") {
    const rentasBranch = (details.rentasBranch ?? "").trim().toLowerCase();
    if (rentasBranch === "negocio") {
      const negocioNombre = (details.negocioNombre ?? "").trim();
      if (negocioNombre) {
        out.push({ label: lang === "es" ? "Nombre del negocio" : "Business name", value: negocioNombre });
      }
      out.push({ label: lang === "es" ? "Plan" : "Plan", value: lang === "es" ? "Negocio" : "Business" });
      const negocioAgente = (details.negocioAgente ?? "").trim();
      if (negocioAgente) {
        out.push({ label: lang === "es" ? "Agente" : "Agent", value: negocioAgente });
      }
    }
    const plazo = (details.plazo_contrato ?? "").trim();
    if (plazo) {
      const label = lang === "es" ? "Plazo del contrato" : "Lease term";
      const value = plazo === "otro"
        ? (details.plazo_contrato_otro ?? "").trim() || (lang === "es" ? "Otro" : "Other")
        : (RENTAS_PLAZO_LABELS[plazo]?.[lang] ?? plazo);
      out.push({ label, value });
    }
    const fechaDisp = (details.fechaDisponible ?? "").trim();
    if (fechaDisp) {
      out.push({
        label: lang === "es" ? "Fecha disponible" : "Available date",
        value: fechaDisp,
      });
    }
  }
  for (const f of fields) {
    if (cat === "rentas" && f.key === "plazo_contrato") continue;
    // BR: address + optional zone are emitted above with summary-friendly labels; skip legacy row to avoid duplicates/wrong labels.
    if (cat === "bienes-raices" && f.key === "direccionPropiedad") continue;
    const raw = (details[f.key] ?? "").toString().trim();
    if (!raw) continue;

    if (f.type === "select" && f.options && f.options.length > 0) {
      const opt = f.options.find((o) => o.value === raw);
      out.push({ label: f.label[lang], value: opt ? opt.label[lang] : raw });
      continue;
    }

    if (cat === "en-venta" && f.key === "itemType") {
      const rama = (details.rama ?? "").trim();
      const label = getArticuloLabel(rama, raw, lang);
      out.push({ label: f.label[lang], value: label });
      continue;
    }

    out.push({ label: f.label[lang], value: raw });
  }
  return out;
}

function buildDetailsAppendix(cat: string, lang: Lang, details: Record<string, string>, cityDisplay?: string) {
  const pairs = getDetailPairs(cat, lang, details, cityDisplay ?? "");
  if (!pairs.length) return "";
  const header = lang === "es" ? "Detalles" : "Details";
  const lines = pairs.map((p) => `${p.label}: ${p.value}`).join("\n");
  return `\n\n—\n${header}:\n${lines}`.trim();
}

/** Normalized shape for En Venta (and shared) preview, validation, and insert. Single source of truth. */
export type EnVentaDraftSnapshot = {
  category: string;
  title: string;
  description: string;
  city: string;
  cityCanonical: string | null;
  priceRaw: string;
  isFree: boolean;
  priceLabel: string;
  images: string[];
  detailPairs: Array<{ label: string; value: string }>;
  details: Record<string, string>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  isPro: boolean;
  proVideoThumbUrl: string | null;
  proVideoUrl: string | null;
  proVideoThumbUrl2: string | null;
  proVideoUrl2: string | null;
  lang: Lang;
};

/** Build normalized snapshot from current form state. Drives preview, validation, and insert. */
function buildEnVentaDraftSnapshot(params: {
  title: string;
  description: string;
  city: string;
  price: string;
  isFree: boolean;
  details: Record<string, string>;
  contactMethod: "phone" | "email" | "both";
  contactPhone: string;
  contactEmail: string;
  category: string;
  lang: Lang;
  isPro: boolean;
  imageUrls: string[];
  proVideoThumbUrl: string | null;
  proVideoUrl: string | null;
  proVideoThumbUrl2?: string | null;
  proVideoUrl2?: string | null;
}): EnVentaDraftSnapshot {
  const { title, description, city, price, isFree, details, contactMethod, contactPhone, contactEmail, category, lang, isPro, imageUrls, proVideoThumbUrl, proVideoUrl, proVideoThumbUrl2 = null, proVideoUrl2 = null } = params;
  const cityCanonical = normalizeCity(city) || null;
  const priceNum = (price ?? "").replace(/[^0-9.]/g, "");
  const hasPrice = priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0;
  const isBrNegocioPricing =
    category === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio";
  const priceLabel =
    isFree
      ? (lang === "es" ? "Gratis" : "Free")
      : hasPrice
        ? Number(priceNum) === 0
          ? (lang === "es" ? "Gratis" : "Free")
          : isBrNegocioPricing
            ? `$${Number(priceNum).toLocaleString(lang === "es" ? "es-US" : "en-US", { maximumFractionDigits: 0 })}`
            : `$${Math.round(Number(priceNum))}`
        : (lang === "es" ? "(Sin precio)" : "(No price)");
  const detailPairs = getDetailPairs(category, lang, details, cityCanonical ?? city.trim());
  return {
    category: category.trim(),
    title: title.trim(),
    description: description.trim(),
    city: city.trim(),
    cityCanonical,
    priceRaw: price.trim(),
    isFree,
    priceLabel,
    images: imageUrls.filter(Boolean),
    detailPairs,
    details: { ...details },
    contactMethod,
    contactPhone: contactPhone.trim(),
    contactEmail: contactEmail.trim(),
    isPro,
    proVideoThumbUrl: proVideoThumbUrl ?? null,
    proVideoUrl: proVideoUrl ?? null,
    proVideoThumbUrl2: proVideoThumbUrl2 ?? null,
    proVideoUrl2: proVideoUrl2 ?? null,
    lang,
  };
}

/** Dedicated full-preview content for private bienes-raices (no ListingView). Uses raw form fields; only shows placeholders when field is truly blank. */
function PrivateBrPreviewContent(props: {
  lang: Lang;
  description: string;
  rawPrice: string;
  rawTitle: string;
  rawCity: string;
  details: Record<string, string>;
  previewDetailPairs: Array<{ label: string; value: string }>;
  images: string[];
  sellerDisplayName: string;
  previewPhone: string;
  previewEmail: string;
  formatMoneyMaybe: (raw: string, lang: Lang) => string;
  copyRulesConfirm: string;
  copyFullPreviewInfoConfirm: string;
  copyFullPreviewBackToEdit: string;
  copyFullPreviewConfirmPublish: string;
  copyPublishing: string;
  fullPreviewRulesConfirmed: boolean;
  setFullPreviewRulesConfirmed: (v: boolean) => void;
  fullPreviewInfoConfirmed: boolean;
  setFullPreviewInfoConfirmed: (v: boolean) => void;
  setShowRulesModal: (v: boolean) => void;
  closeFullPreviewModal: () => void;
  handleFullPreviewConfirmPublish: () => void;
  publishing: boolean;
  onSave?: () => void | Promise<void>;
  onShare?: () => void | Promise<void>;
}) {
  const {
    lang,
    description,
    rawPrice,
    rawTitle,
    rawCity,
    details,
    previewDetailPairs,
    images,
    sellerDisplayName,
    previewPhone,
    previewEmail,
    formatMoneyMaybe,
    copyRulesConfirm,
    copyFullPreviewInfoConfirm,
    copyFullPreviewBackToEdit,
    copyFullPreviewConfirmPublish,
    copyPublishing,
    fullPreviewRulesConfirmed,
    setFullPreviewRulesConfirmed,
    fullPreviewInfoConfirmed,
    setFullPreviewInfoConfirmed,
    setShowRulesModal,
    closeFullPreviewModal,
    handleFullPreviewConfirmPublish,
    publishing,
    onSave,
    onShare,
  } = props;

  const confirmSectionRef = useRef<HTMLDivElement>(null);
  const resumenRef = useRef<HTMLDivElement>(null);
  const ubicacionRef = useRef<HTMLDivElement>(null);
  const contactoRef = useRef<HTMLDivElement>(null);
  const detallesRef = useRef<HTMLElement>(null);
  const interiorRef = useRef<HTMLDivElement>(null);
  const exteriorRef = useRef<HTMLDivElement>(null);
  const [heroStartIndex, setHeroStartIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoomIndex, setLightboxZoomIndex] = useState<number | null>(null);
  const [contactSheet, setContactSheet] = useState<"solicitar" | "visita" | null>(null);
  const [saveFeedbackMessage, setSaveFeedbackMessage] = useState<"saved" | "signin" | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);
  const n = images.length;
  const handleSave = useCallback(() => {
    if (typeof onSave === "function") {
      setSaveFeedbackMessage(null);
      void Promise.resolve(onSave()).then(() => {
        setSaveFeedbackMessage("saved");
        setTimeout(() => setSaveFeedbackMessage(null), 2000);
      });
    } else {
      setSaveFeedbackMessage("signin");
      setTimeout(() => setSaveFeedbackMessage(null), 2500);
    }
  }, [onSave]);
  const handleShare = useCallback(() => {
    if (typeof onShare === "function") {
      void Promise.resolve(onShare()).then(() => {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      });
    }
  }, [onShare]);
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const addr = (details.enVentaAddress ?? "").trim();
  const zone = (details.enVentaZone ?? "").trim();
  const addressForMessage = (addr || rawTitle.trim() || zone || (lang === "es" ? "esta propiedad" : "this property")).trim() || (lang === "es" ? "esta propiedad" : "this property");
  const msgSolicitar = lang === "es" ? `Hola, me interesa tu propiedad en ${addressForMessage}. La vi en Leonix Media y me gustaría recibir más información.` : `Hi, I'm interested in your property at ${addressForMessage}. I saw it on Leonix Media and would like more information.`;
  const msgVisita = lang === "es" ? `Hola, me interesa mucho tu propiedad en ${addressForMessage}. La vi en Leonix Media y quería saber cuándo sería posible programar una visita.` : `Hi, I'm very interested in your property at ${addressForMessage}. I saw it on Leonix Media and wanted to know when it might be possible to schedule a visit.`;
  const emailSubject = lang === "es" ? "Consulta sobre tu propiedad" : "Question about your property";
  const phoneDigits = (previewPhone ?? "").replace(/\D/g, "");
  const hasPhone = phoneDigits.length >= 10;
  const hasEmail = !!(previewEmail ?? "").trim();
  const canCycle = n > 3;
  const maxStart = Math.max(0, n - 3);
  const safeStart = n ? Math.min(heroStartIndex, maxStart) : 0;
  const primaryImage = n ? images[safeStart] : null;
  const side1 = n > 1 ? images[(safeStart + 1) % n] : null;
  const side2 = n > 2 ? images[(safeStart + 2) % n] : null;
  const hasRealCity = rawCity.trim() !== "" && rawCity !== (lang === "es" ? "(Ciudad)" : "(City)");
  const mainLine = addr ? addr : hasRealCity ? rawCity.trim() : "";
  const brSubcat = (details.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType((details.enVentaPropertyType ?? "").trim());
  const br = (details.enVentaBedrooms ?? "").trim();
  const ba = (details.enVentaBathrooms ?? "").trim();
  const sqRaw = (details.enVentaSquareFeet ?? "").trim();
  const sqNum = sqRaw ? Number(sqRaw.replace(/,/g, "").replace(/\s/g, "").trim()) : NaN;
  const sqDisplay = Number.isFinite(sqNum) ? sqNum.toLocaleString(lang === "es" ? "es-US" : "en-US") : sqRaw;
  const hideBedrooms = brSubcat === "terrenos" || brSubcat === "comercial" || brSubcat === "industrial";
  const quickFacts = [
    !hideBedrooms && br && { label: lang === "es" ? "Recámaras" : "Bedrooms", value: br },
    brSubcat !== "terrenos" && ba && { label: lang === "es" ? "Baños" : "Bathrooms", value: ba },
    sqRaw && { label: lang === "es" ? "Pies²" : "Sq ft", value: sqDisplay },
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const featureTagsFromDetails: Array<{ label: string; value: string }> = [];
  const zoneVal = (details.enVentaZone ?? "").trim();
  if (zoneVal) featureTagsFromDetails.push({ label: lang === "es" ? "Vecindad" : "Neighborhood", value: zoneVal });
  const parkingVal = (details.enVentaParkingSpaces ?? "").trim();
  if (parkingVal) featureTagsFromDetails.push({ label: lang === "es" ? "Estacionamiento" : "Parking", value: parkingVal });
  const lotVal = (details.enVentaLotSize ?? "").trim();
  if (lotVal) featureTagsFromDetails.push({ label: lang === "es" ? "Terreno" : "Lot size", value: lotVal });
  const levelsVal = (details.enVentaLevels ?? "").trim();
  if (levelsVal) featureTagsFromDetails.push({ label: lang === "es" ? "Niveles" : "Levels", value: levelsVal });
  const hasPrice = rawPrice.trim() !== "" && /[\d]/.test(rawPrice.replace(/,/g, ""));
  const priceDisplay = hasPrice ? (formatMoneyMaybe(rawPrice, lang) || rawPrice.trim()) : (lang === "es" ? "Precio no indicado" : "Price not specified");
  const hasTitle = rawTitle.trim().length > 0;
  const titleDisplay = hasTitle ? rawTitle.trim() : (lang === "es" ? "(Sin título)" : "(No title)");

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-0">
      {/* Full-page warm canvas: wraps entire preview content */}
      <div className="rounded-2xl border border-[#C9B46A]/15 bg-[#F8F4EE] shadow-sm p-4 sm:p-6 min-h-[60vh] space-y-6 sm:space-y-5">
        {/* A. Header: brand + Publicar (no search) */}
        <header className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="inline-flex items-center gap-2 rounded-xl border border-[#C9B46A]/45 bg-gradient-to-b from-[#FDFBF7] to-[#F8F4EE] px-5 py-2.5 text-base font-extrabold tracking-tight text-[#1a1510] shadow-sm">
            <span className="h-5 w-0.5 rounded-full bg-[#C9B46A]/70" aria-hidden />
            {lang === "es" ? "Leonix Clasificados" : "Leonix Classifieds"}
          </span>
          <button
            type="button"
            onClick={() => confirmSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="rounded-xl bg-[#2D5016] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#244012] transition"
          >
            {lang === "es" ? "Publicar" : "Post"}
          </button>
        </header>
        {/* B. Section nav row: scroll to sections */}
        <nav className="flex flex-wrap gap-2 mb-5" aria-label={lang === "es" ? "Secciones" : "Sections"}>
          {[
            { id: "resumen", es: "Resumen", en: "Summary", ref: resumenRef },
            { id: "interior", es: "Interior", en: "Interior", ref: interiorRef },
            { id: "exterior", es: "Exterior", en: "Exterior", ref: exteriorRef },
            { id: "detalles", es: "Detalles", en: "Details", ref: detallesRef },
            { id: "ubicacion", es: "Ubicación", en: "Location", ref: ubicacionRef },
            { id: "contacto", es: "Contacto", en: "Contact", ref: contactoRef },
          ].map(({ id, es, en, ref: sectionRef }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(sectionRef as React.RefObject<HTMLElement>)}
              className="rounded-lg border border-[#C9B46A]/30 bg-[#F8F6F0] px-3 py-2 text-xs font-medium text-[#111111]/90 hover:bg-[#EFE7D8] hover:border-[#C9B46A]/40 transition"
            >
              {lang === "es" ? es : en}
            </button>
          ))}
        </nav>
        {/* C + D + E */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-6">
          <div className="lg:col-span-8 space-y-5 sm:space-y-5">
            {/* C. Hero gallery: main + two side slots; cycle when >3 images */}
            <div ref={resumenRef} id="resumen" className="relative scroll-mt-4">
              {primaryImage ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-8 relative rounded-xl overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[220px]">
                    <img src={primaryImage} alt="" className="w-full h-full object-cover" />
                    {canCycle && (
                      <>
                        <button
                          type="button"
                          onClick={() => setHeroStartIndex((i) => Math.max(0, i - 1))}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-lg font-bold"
                          aria-label={lang === "es" ? "Anterior" : "Previous"}
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeroStartIndex((i) => Math.min(maxStart, i + 1))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center text-lg font-bold"
                          aria-label={lang === "es" ? "Siguiente" : "Next"}
                        >
                          →
                        </button>
                      </>
                    )}
                  </div>
                  <div className="md:col-span-4 flex flex-col gap-2">
                    {side1 ? (
                      <div className="rounded-lg overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[90px]">
                        <img src={side1} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#C9B46A]/15 bg-[#F8F6F0]/50 aspect-[4/3] min-h-[90px]" aria-hidden />
                    )}
                    {side2 ? (
                      <div className="rounded-lg overflow-hidden bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[4/3] min-h-[90px]">
                        <img src={side2} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#C9B46A]/15 bg-[#F8F6F0]/50 aspect-[4/3] min-h-[90px]" aria-hidden />
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-[#E8E8E8] border border-[#C9B46A]/20 aspect-[16/10] min-h-[200px] flex items-center justify-center">
                  <span className="text-[#111111]/50 text-sm">{lang === "es" ? "Sin imagen" : "No image"}</span>
                </div>
              )}
              {n > 0 && (
                <div className="mt-2 flex items-center justify-between gap-2">
                  {canCycle && (
                    <span className="text-[11px] text-[#111111]/60">
                      {safeStart + 1}–{Math.min(safeStart + 3, n)} {lang === "es" ? "de" : "of"} {n}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setLightboxOpen(true)}
                    className="rounded-lg border border-[#C9B46A]/40 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111] hover:bg-[#EFE7D8] transition"
                  >
                    {lang === "es" ? "Ver todas las fotos" : "View all photos"}
                  </button>
                </div>
              )}
            </div>
            {/* D. Main info: price, title, address, zone, facts, features (Ubicación) */}
            <div ref={ubicacionRef} id="ubicacion" className="rounded-xl border border-[#C9B46A]/20 bg-[#FAFAF8] p-5 scroll-mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-[#111111] tracking-tight">
                {priceDisplay}
              </div>
              <h2 className="mt-3 text-xl sm:text-2xl font-bold text-[#111111] leading-tight">
                {titleDisplay}
              </h2>
              {mainLine && <p className="mt-3 text-sm text-[#111111]/85 font-medium">{mainLine}</p>}
              {zone && <p className="mt-1 text-xs text-[#111111]/65">{lang === "es" ? "Vecindad: " : "Neighborhood: "}{zone}</p>}
              {quickFacts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {quickFacts.map((f) => (
                    <span key={f.label} className="rounded-full border border-[#C9B46A]/35 bg-[#F8F6F0] px-3 py-1.5 text-xs font-medium text-[#111111]">
                      {f.label}: {f.value}
                    </span>
                  ))}
                </div>
              )}
              {featureTagsFromDetails.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {featureTagsFromDetails.map((item, i) => (
                    <span key={i} className="rounded-lg border border-[#C9B46A]/25 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#111111]/90">
                      {item.label}: {item.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        {/* E. Right private seller card: info + 2x2 action grid (Guardar, Compartir | Solicitar, Programar visita) */}
        <div className="lg:col-span-4">
          <div ref={contactoRef} id="contacto" className="rounded-xl border border-[#C9B46A]/25 bg-[#FAFAF8] p-4 sm:p-5 shadow-sm scroll-mt-4 space-y-5">
            <div>
              <h4 className="text-sm font-bold text-[#111111] mb-1 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#C9B46A]/50" aria-hidden />
                {lang === "es" ? "Contactar" : "Contact"}
              </h4>
              <p className="text-base font-semibold text-[#111111] mt-2 leading-snug">
                {sellerDisplayName.trim() || (lang === "es" ? "Propietario" : "Owner")}
              </p>
              {previewPhone && (
                <p className="mt-2 text-sm text-[#111111]">
                  <a href={`tel:${previewPhone.replace(/\D/g, "")}`} className="font-medium hover:underline">{previewPhone}</a>
                </p>
              )}
              {previewEmail && (
                <p className="mt-1 text-sm text-[#111111] break-all">
                  <a href={`mailto:${previewEmail}`} className="font-medium hover:underline">{previewEmail}</a>
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-2 min-h-[44px]">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-xl bg-[#B8860B]/90 text-white px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#A0780A] transition border border-[#C9B46A]/40 shadow-sm min-h-[44px] leading-tight"
                title={lang === "es" ? "Guardar progreso" : "Save progress"}
              >
                {saveFeedbackMessage === "saved" ? (lang === "es" ? "Guardado" : "Saved") : saveFeedbackMessage === "signin" ? (lang === "es" ? "Inicia sesión para guardar" : "Sign in to save") : (lang === "es" ? "Guardar" : "Save")}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F4EE] text-[#111111] px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#EFE7D8] transition min-h-[44px] leading-tight"
                title={lang === "es" ? "Compartir enlace" : "Share link"}
              >
                {shareFeedback ? (lang === "es" ? "¡Copiado!" : "Copied!") : (lang === "es" ? "Compartir" : "Share")}
              </button>
              <button
                type="button"
                onClick={() => setContactSheet("solicitar")}
                className="rounded-xl bg-[#2D5016] text-white px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#244012] transition border border-[#2D5016]/80 min-w-0 min-h-[44px] leading-tight"
              >
                {lang === "es" ? "Solicitar información" : "Request info"}
              </button>
              <button
                type="button"
                onClick={() => setContactSheet("visita")}
                className="rounded-xl border-2 border-[#2D5016]/70 bg-[#2D5016]/08 text-[#2D5016] px-4 py-3.5 sm:py-2.5 text-sm sm:text-xs font-semibold hover:bg-[#2D5016]/15 transition min-w-0 min-h-[44px] leading-tight"
              >
                {lang === "es" ? "Programar visita" : "Schedule visit"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Bottom: Descripción + Detalles de la propiedad (private BR only) */}
      <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8 max-w-2xl">
        <section>
          <h3 className="text-lg font-bold text-[#111111] mb-3 flex items-center gap-2 pb-2 border-b border-[#C9B46A]/30">
            <span className="w-1 h-6 rounded-full bg-[#C9B46A]/60" aria-hidden />
            {lang === "es" ? "Descripción" : "About this property"}
          </h3>
          <div className="rounded-xl border border-[#C9B46A]/20 bg-[#FAFAF8] p-4 sm:p-5 text-[#111111] leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
            {(description ?? "").trim() ? description.trim() : (lang === "es" ? "Sin descripción." : "No description.")}
          </div>
        </section>
        <section ref={detallesRef} id="detalles" className="scroll-mt-4">
          <h3 className="text-lg font-bold text-[#111111] mb-3 flex items-center gap-2 pb-2 border-b border-[#C9B46A]/30">
            <span className="w-1 h-6 rounded-full bg-[#C9B46A]/60" aria-hidden />
            {lang === "es" ? "Detalles de la propiedad" : "Property details"}
          </h3>
          <div className="space-y-5">
            {(() => {
              const subcat = (details.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType((details.enVentaPropertyType ?? "").trim());
              const showResidentialInterior = subcat === "residencial" || subcat === "condos-townhomes" || subcat === "multifamiliar";
              const interiorRows: Array<{ label: string; value: string }> = [];
              if (showResidentialInterior) {
                const brVal = (details.enVentaBedrooms ?? "").trim();
                if (brVal) interiorRows.push({ label: lang === "es" ? "Recámaras" : "Bedrooms", value: brVal });
              }
              const baVal = (details.enVentaBathrooms ?? "").trim();
              if (baVal && subcat !== "terrenos") interiorRows.push({ label: lang === "es" ? "Baños" : "Bathrooms", value: baVal });
              const sqVal = (details.enVentaSquareFeet ?? "").trim();
              if (sqVal) interiorRows.push({ label: lang === "es" ? "Pies²" : "Sq ft", value: sqVal });
              const lvVal = (details.enVentaLevels ?? "").trim();
              if (lvVal && subcat !== "terrenos") interiorRows.push({ label: lang === "es" ? "Niveles" : "Levels", value: lvVal });
              const exteriorRows: Array<{ label: string; value: string }> = [];
              const lotVal = (details.enVentaLotSize ?? "").trim();
              if (lotVal) exteriorRows.push({ label: lang === "es" ? "Terreno" : "Lot size", value: lotVal });
              const pkVal = (details.enVentaParkingSpaces ?? "").trim();
              if (pkVal) exteriorRows.push({ label: lang === "es" ? "Estacionamiento" : "Parking", value: pkVal });
              const zoneVal = (details.enVentaZone ?? "").trim();
              if (zoneVal) exteriorRows.push({ label: lang === "es" ? "Vecindad" : "Neighborhood", value: zoneVal });
              const extraRows: Array<{ label: string; value: string }> = [];
              const ptVal = (details.enVentaPropertyType ?? "").trim();
              if (ptVal) extraRows.push({ label: lang === "es" ? "Tipo de propiedad" : "Property type", value: ptVal });
              const stVal = (details.enVentaPropertySubtype ?? "").trim();
              if (stVal) extraRows.push({ label: lang === "es" ? "Subtipo" : "Subtype", value: stVal });
              const ybVal = (details.enVentaYearBuilt ?? "").trim();
              if (ybVal) extraRows.push({ label: lang === "es" ? "Año de construcción" : "Year built", value: ybVal });
              const utilVal = (details.enVentaUtilitiesForProperty ?? "").trim();
              if (utilVal) extraRows.push({ label: lang === "es" ? "Servicios disponibles" : "Utilities", value: utilVal });
              const zonVal = (details.enVentaZoning ?? "").trim();
              if (zonVal) extraRows.push({ label: lang === "es" ? "Zonificación" : "Zoning", value: zonVal });
              const multiRows: Array<{ label: string; value: string }> = [];
              const vtVal = (details.enVentaVirtualTourUrl ?? "").trim();
              if (vtVal) multiRows.push({ label: lang === "es" ? "Tour virtual" : "Virtual tour", value: vtVal });
              const vUrlVal = (details.enVentaVideoUrl ?? "").trim();
              if (vUrlVal) multiRows.push({ label: lang === "es" ? "Video" : "Video", value: vUrlVal });
              const hasAny = interiorRows.length > 0 || exteriorRows.length > 0 || extraRows.length > 0 || multiRows.length > 0;
              if (!hasAny) return <p className="text-sm text-[#111111]/70">{lang === "es" ? "Sin detalles adicionales." : "No additional details."}</p>;
              return (
                <>
                  {interiorRows.length > 0 && (
                    <div ref={interiorRef} id="interior" className="scroll-mt-4">
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Interior" : "Interior"}
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {interiorRows.map((r) => (
                          <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111]">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {exteriorRows.length > 0 && (
                    <div ref={exteriorRef} id="exterior" className="scroll-mt-4">
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Exterior / Terreno" : "Exterior / Lot"}
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {exteriorRows.map((r) => (
                          <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111]">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {extraRows.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Información adicional" : "Additional info"}
                      </h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {extraRows.map((r) => (
                          <div key={r.label} className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-center rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111] break-all">{r.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                  {multiRows.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-[#111111] mb-2 flex items-center gap-2">
                        <span className="w-0.5 h-4 rounded-full bg-[#C9B46A]/50" aria-hidden />
                        {lang === "es" ? "Multimedia" : "Multimedia"}
                      </h4>
                      <dl className="grid grid-cols-1 gap-3">
                        {multiRows.map((r) => (
                          <div key={r.label} className="rounded-lg bg-[#F8F6F0]/80 px-4 py-3 sm:px-3 sm:py-2">
                            <dt className="text-xs sm:text-sm text-[#111111]/80">{r.label}</dt>
                            <dd className="text-sm font-medium text-[#111111] mt-1 break-all">
                              <a href={r.value} target="_blank" rel="noopener noreferrer" className="text-[#A98C2A] hover:underline">{r.value}</a>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>
      </div>
      {/* Lightbox: all photos inside preview modal */}
      {lightboxOpen && n > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={lang === "es" ? "Galería de fotos" : "Photo gallery"}
          onClick={() => { setLightboxZoomIndex(null); setLightboxOpen(false); }}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => { setLightboxZoomIndex(null); setLightboxOpen(false); }}
              className="absolute top-4 right-4 z-10 rounded-full bg-white/90 text-[#111111] w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-white"
              aria-label={lang === "es" ? "Cerrar" : "Close"}
            >
              ×
            </button>
            {lightboxZoomIndex !== null ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-full max-h-[85vh] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden">
                  <img
                    src={images[lightboxZoomIndex]}
                    alt=""
                    className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                  />
                  {n > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightboxZoomIndex((prev) => (prev === 0 ? n - 1 : (prev ?? 0) - 1)); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-2xl font-bold"
                        aria-label={lang === "es" ? "Anterior" : "Previous"}
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLightboxZoomIndex((prev) => ((prev ?? 0) + 1) % n); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-2xl font-bold"
                        aria-label={lang === "es" ? "Siguiente" : "Next"}
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
                <p className="text-sm text-white/90">
                  {lightboxZoomIndex + 1} {lang === "es" ? "de" : "of"} {n}
                </p>
                <button
                  type="button"
                  onClick={() => setLightboxZoomIndex(null)}
                  className="rounded-lg bg-white/90 text-[#111111] px-4 py-2 text-sm font-medium hover:bg-white"
                >
                  {lang === "es" ? "Ver todas" : "View all"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-4xl w-full">
                {images.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxZoomIndex(i)}
                    className="rounded-lg overflow-hidden bg-[#222] aspect-square focus:ring-2 ring-white/50"
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Contact chooser: always open when either CTA is clicked; show options when phone/email exist */}
      {contactSheet && (() => {
        const msg = contactSheet === "solicitar" ? msgSolicitar : msgVisita;
        const emailAddr = (previewEmail ?? "").trim();
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(emailAddr)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msg)}`;
        const yahooUrl = `https://compose.mail.yahoo.com/?to=${encodeURIComponent(emailAddr)}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msg)}`;
        const mailtoUrl = `mailto:${encodeURIComponent(emailAddr)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(msg)}`;
        const copyEmail = () => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(emailAddr).catch(() => {});
          }
          setContactSheet(null);
        };
        const copyPhone = () => {
          if (typeof navigator !== "undefined" && navigator.clipboard) {
            navigator.clipboard.writeText(previewPhone ?? "").catch(() => {});
          }
          setContactSheet(null);
        };
        return (
          <div
            className="fixed inset-0 z-[99] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={lang === "es" ? "Opciones de contacto" : "Contact options"}
            onClick={() => setContactSheet(null)}
          >
            <div
              className="w-full max-w-sm rounded-t-2xl sm:rounded-2xl bg-white shadow-xl p-4 pb-safe space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-[#111111] pb-2 border-b border-black/10">
                {contactSheet === "solicitar"
                  ? (lang === "es" ? "Solicitar información" : "Request info")
                  : (lang === "es" ? "Programar visita" : "Schedule visit")}
              </p>
              {!(hasPhone || hasEmail) ? (
                <p className="text-sm text-[#111111]/80">
                  {lang === "es" ? "Añade tu teléfono o correo en el formulario para que los compradores puedan contactarte." : "Add your phone or email in the form so buyers can contact you."}
                </p>
              ) : null}
              {hasEmail && (
                <div>
                  <p className="text-xs font-medium text-[#111111]/70 mb-2">{lang === "es" ? "Email" : "Email"}</p>
                  <div className="space-y-2">
                    <a href={gmailUrl} target="_blank" rel="noopener noreferrer" onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition min-h-[44px]">
                      {lang === "es" ? "Abrir Gmail" : "Open Gmail"}
                    </a>
                    <a href={yahooUrl} target="_blank" rel="noopener noreferrer" onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition min-h-[44px]">
                      {lang === "es" ? "Abrir Yahoo Mail" : "Open Yahoo Mail"}
                    </a>
                    <button type="button" onClick={copyEmail} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition text-left min-h-[44px]">
                      {lang === "es" ? "Copiar email" : "Copy email"}
                    </button>
                    <a href={mailtoUrl} onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111]/80 hover:bg-[#E8E8E8] transition min-h-[44px]">
                      {lang === "es" ? "Usar app predeterminada" : "Use default app"}
                    </a>
                  </div>
                </div>
              )}
              {hasPhone && (
                <div>
                  <p className="text-xs font-medium text-[#111111]/70 mb-2">{lang === "es" ? "Teléfono" : "Phone"}</p>
                  <div className="flex flex-col space-y-2">
                    <button type="button" onClick={copyPhone} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111] hover:bg-[#E8E8E8] transition text-left min-h-[44px] order-3 sm:order-1">
                      {lang === "es" ? "Copiar teléfono" : "Copy phone"}
                    </button>
                    <a href={`tel:${phoneDigits}`} onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111]/80 hover:bg-[#E8E8E8] transition min-h-[44px] order-1 sm:order-2">
                      {lang === "es" ? "Llamar" : "Call"}
                    </a>
                    <a href={`sms:${phoneDigits}?body=${encodeURIComponent(msg)}`} onClick={() => setContactSheet(null)} className="flex w-full items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3.5 sm:py-2.5 text-sm font-medium text-[#111111]/80 hover:bg-[#E8E8E8] transition min-h-[44px] order-2 sm:order-3">
                      {lang === "es" ? "Texto / SMS" : "Text / SMS"}
                    </a>
                  </div>
                </div>
              )}
              <button type="button" onClick={() => setContactSheet(null)} className="w-full rounded-xl border border-black/15 py-3.5 sm:py-3 text-sm font-medium text-[#111111] hover:bg-[#F5F5F5] transition min-h-[44px]">
                {lang === "es" ? "Cancelar" : "Cancel"}
              </button>
            </div>
          </div>
        );
      })()}
      {/* Confirm block */}
      <div ref={confirmSectionRef} id="confirmar" className="mt-10 pt-8 border-t border-black/10 max-w-2xl space-y-3 scroll-mt-4">
        <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
          <input
            type="checkbox"
            checked={fullPreviewRulesConfirmed}
            onChange={(e) => setFullPreviewRulesConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
          />
          <span>
            {copyRulesConfirm}
            {" "}
            <button type="button" onClick={() => setShowRulesModal(true)} className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium">
              {lang === "es" ? "Ver reglas" : "View rules"}
            </button>
          </span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
          <input
            type="checkbox"
            checked={fullPreviewInfoConfirmed}
            onChange={(e) => setFullPreviewInfoConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
          />
          <span>{copyFullPreviewInfoConfirm}</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={closeFullPreviewModal}
            className="flex-1 w-full max-w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
          >
            {copyFullPreviewBackToEdit}
          </button>
          <button
            type="button"
            onClick={handleFullPreviewConfirmPublish}
            disabled={!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed || publishing}
            className={cx(
              "flex-1 w-full max-w-full rounded-xl font-semibold py-3.5 text-center transition",
              fullPreviewRulesConfirmed && fullPreviewInfoConfirmed && !publishing
                ? "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                : "bg-[#D9D9D9] text-[#111111]/60 cursor-not-allowed"
            )}
          >
            {publishing ? copyPublishing : copyFullPreviewConfirmPublish}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function PublicarPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ category?: string }>();

  const urlLang = searchParams?.get("lang");
  const lang: Lang = urlLang === "en" ? "en" : "es";

  const slugFromUrl = (params?.category ?? "").trim().toLowerCase();
  const categoryFromUrl = normalizeCategory(params?.category ?? "") || "en-venta";
  const showFormPlaceholder = slugFromUrl !== "" && normalizeCategory(params?.category ?? "") === "";

  // Prefill support (used by category-specific pre-forms like Restaurants)
  const prefill = useMemo(() => {
    const get = (k: string) => (searchParams?.get(k) ?? "").trim();
    const bizName = get("bizName") || get("name");
    const placeType = get("placeType");
    const cuisine = get("cuisine");
    const prefillCity = normalizeCity(get("city"));
    const phone = get("phone");
    const website = get("website");
    const notes = get("notes");
    return { bizName, placeType, cuisine, city: prefillCity, phone, website, notes };
  }, [searchParams]);

  const redirectForLogin = useMemo(() => {
    const slug = categoryFromUrl || "en-venta";
    const qs = searchParams?.toString() ?? "";
    const here = qs
      ? `/clasificados/publicar/${slug}?${qs}`
      : `/clasificados/publicar/${slug}?lang=${lang}`;
    return safeInternalRedirect(here) || `/clasificados/publicar/${slug}?lang=${lang}`;
  }, [lang, searchParams, categoryFromUrl]);

  /** Sync draftId in URL (canonical source for which draft is being edited). Preserves lang and other params. */
  const syncDraftIdInUrl = useCallback(
    (draftId: string | null) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      if (draftId) p.set("draftId", draftId);
      else p.delete("draftId");
      const qs = p.toString();
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "en-venta"}`;
      router.replace(qs ? `${path}?${qs}` : path);
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  const [step, setStep] = useState<PublishStep>(() => {
    const cat = categoryFromUrl || "en-venta";
    const steps: PublishStep[] = cat === "en-venta" ? ["category", "basics", "media"] : cat === "rentas" ? ["category", "rentas-track", "basics", "details", "media"] : cat === "bienes-raices" ? ["category", "bienes-raices-track", "basics", "media"] : ["category", "basics", "details", "media"];
    const s = searchParams?.get("step")?.trim();
    if (s && (["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"] as const).includes(s as PublishStep) && steps.includes(s as PublishStep)) return s as PublishStep;
    if (cat === "bienes-raices" && s === "details") return "media";
    return "category";
  });
  const [category, setCategory] = useState<CategoryKey | "">(() => categoryFromUrl);

  /** Full step order for current category. BR has no details step (category → bienes-raices-track → basics → media). */
  const stepsForCategory = useMemo((): PublishStep[] => {
    const cat = categoryFromUrl || "en-venta";
    if (cat === "en-venta") return ["category", "basics", "media"];
    if (cat === "rentas") return ["category", "rentas-track", "basics", "details", "media"];
    if (cat === "bienes-raices") return ["category", "bienes-raices-track", "basics", "media"];
    return ["category", "basics", "details", "media"];
  }, [categoryFromUrl]);

  /** Previous logical step for in-app Back. Returns null only when already at category. */
  const getPreviousStep = useCallback((): PublishStep | null => {
    const idx = stepsForCategory.indexOf(step);
    if (idx <= 0) return null;
    return stepsForCategory[idx - 1];
  }, [stepsForCategory, step]);

  /** Options for step URL sync when category is bienes-raices (branch in query). */
  type StepSyncOptions = { branch?: "privado" | "negocio" };

  /** Sync step into URL query (preserves lang, draftId, etc.). For BR, includes branch= when set. Replace = no new history entry. scroll: false to avoid double scroll. */
  const syncStepInUrl = useCallback(
    (newStep: PublishStep, options?: StepSyncOptions) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("step", newStep);
      if (categoryFromUrl === "bienes-raices") {
        const br = (options?.branch ?? (detailsRefForBrBranch.current?.bienesRaicesBranch ?? "").trim().toLowerCase());
        if (br === "privado" || br === "negocio") p.set("branch", br);
        else p.delete("branch");
      }
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "en-venta"}`;
      router.replace(`${path}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** Push step to URL so browser Back has a previous step in the flow. For BR, includes branch= when set. Use when user navigates forward (goToStep). scroll: false so we scroll once in goToStep. */
  const syncStepInUrlPush = useCallback(
    (newStep: PublishStep, options?: StepSyncOptions) => {
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("step", newStep);
      if (categoryFromUrl === "bienes-raices") {
        const br = (options?.branch ?? (detailsRefForBrBranch.current?.bienesRaicesBranch ?? "").trim().toLowerCase());
        if (br === "privado" || br === "negocio") p.set("branch", br);
        else p.delete("branch");
      }
      const path = pathname ?? `/clasificados/publicar/${categoryFromUrl || "en-venta"}`;
      router.push(`${path}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** BR only: set or update branch= in URL (replace). Use when user selects Negocio so URL reflects before next step. */
  const syncBrBranchInUrl = useCallback(
    (branch: "privado" | "negocio") => {
      if (categoryFromUrl !== "bienes-raices") return;
      const p = new URLSearchParams(searchParams?.toString() ?? "");
      p.set("branch", branch);
      const path = pathname ?? `/clasificados/publicar/bienes-raices`;
      router.replace(`${path}?${p.toString()}`);
    },
    [router, pathname, searchParams, categoryFromUrl]
  );

  /** When true, step→URL effect should skip (we just pushed in goToStep). */
  const skipStepSyncRef = useRef(false);

  /** BR branch for URL sync (details is declared later; we read this in syncStepInUrl/syncStepInUrlPush). */
  const detailsRefForBrBranch = useRef<Record<string, string>>({});

  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [sellerDisplayName, setSellerDisplayName] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [isPro, setIsPro] = useState(false);

  // Free listing rules: 7 days, 3 photos, no video, no boosts. Free reposts: 2 max.
  const FREE_REPOST_LIMIT = 2;
  // Garage Mode (Free-only, En Venta only) — +4 temporary listings for 7 days, once per 30 days.
  const FREE_EN_VENTA_LIMIT = 2;
  const GARAGE_EXTRA = 4;
  const GARAGE_WINDOW_DAYS = 7;
  const GARAGE_COOLDOWN_DAYS = 30;

  const [enVentaActiveCount, setEnVentaActiveCount] = useState<number | null>(null);
  const [garageActive, setGarageActive] = useState(false);
  const [garageExpiresAt, setGarageExpiresAt] = useState<string>("");
  const [garageLastUsedAt, setGarageLastUsedAt] = useState<string>("");
  const [garageLoading, setGarageLoading] = useState(false);
  const [videoFiles, setVideoFiles] = useState<[File | null, File | null]>([null, null]);
  const [videoThumbBlobs, setVideoThumbBlobs] = useState<[Blob | null, Blob | null]>([null, null]);
  const [videoErrors, setVideoErrors] = useState<[string, string]>(["", ""]);
  const [expandedVideoIndex, setExpandedVideoIndex] = useState<0 | 1 | null>(null);
  const [previewViewed, setPreviewViewed] = useState(false);

  useEffect(() => {
    setCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  // Invalid category slug: send to Clasificados hub (do not force a default publish category like en-venta).
  useEffect(() => {
    if (slugFromUrl === "" || normalizeCategory(params?.category ?? "") !== "") return;
    const p = new URLSearchParams();
    p.set("lang", lang);
    router.replace(`/clasificados?${p.toString()}`);
  }, [slugFromUrl, params?.category, lang, router]);

  useEffect(() => {
    if (searchParams?.get("fromPreview") === "1") setPreviewViewed(true);
  }, [searchParams]);

  // Derive step from URL when it changes (initial load and browser Back/Forward). Keeps app step and URL in sync. Skip step->URL effect so we don't replace again (no loop, no extra scroll).
  const stepsForCategoryRef = useRef(stepsForCategory);
  stepsForCategoryRef.current = stepsForCategory;
  useEffect(() => {
    const urlStep = searchParams?.get("step")?.trim();
    if (!urlStep || !VALID_STEPS.includes(urlStep as PublishStep)) return;
    const steps = stepsForCategoryRef.current;
    if (!steps.includes(urlStep as PublishStep)) return;
    skipStepSyncRef.current = true;
    setStep(urlStep as PublishStep);
  }, [searchParams]);

  // BR only: hydrate branch from URL so details.bienesRaicesBranch and ?branch= stay in sync (load, refresh, restore).
  useEffect(() => {
    if (categoryFromUrl !== "bienes-raices") return;
    const urlBranch = searchParams?.get("branch")?.trim().toLowerCase();
    if (urlBranch !== "privado" && urlBranch !== "negocio") return;
    setDetails((prev) => {
      const cur = (prev?.bienesRaicesBranch ?? "").trim().toLowerCase();
      if (cur === urlBranch) return prev;
      return { ...prev, bienesRaicesBranch: urlBranch };
    });
  }, [categoryFromUrl, searchParams]);

  // When step changes in-app, sync step to URL (replace). Skip when we just pushed in goToStep or when URL already matches (avoids re-run on searchParams change and double sync).
  useEffect(() => {
    if (skipStepSyncRef.current) {
      skipStepSyncRef.current = false;
      return;
    }
    if (searchParams?.get("step") === step) return;
    syncStepInUrl(step);
    // Intentionally omit searchParams from deps so we don't re-run when replace() updates the URL and causes a jump.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, syncStepInUrl]);

  type ServicesPackage = "" | "standard" | "plus";
  const [servicesPackage, setServicesPackage] = useState<ServicesPackage>("");
  const [showServicesGate, setShowServicesGate] = useState(false);
  /** After user clicks “Siguiente”, show strong validation styling for that step (publish flow only). */
  const [publishNextAttempted, setPublishNextAttempted] = useState<Partial<Record<PublishStep, boolean>>>({});

  // Restaurants do not require a listing price in our flow (treated as Free by default)
  useEffect(() => {
    if (category === "restaurantes") {
      setIsFree(true);
      setPrice("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const stepOrder: PublishStep[] = getStepOrderForCategory(category || "en-venta");
  const isEnVentaFlow = stepOrder.length === 3;
  const safeStepForProgress: PublishStep =
    (isEnVentaFlow && step === "details") || (categoryFromUrl === "bienes-raices" && step === "details") ? "media" : step;
  const currentStepIndex = Math.max(0, stepOrder.indexOf(safeStepForProgress));

  // En Venta has no "details" step; normalize invalid ?step=details to media.
  useEffect(() => {
    if (categoryFromUrl === "en-venta" && step === "details") {
      setStep("media");
    }
  }, [categoryFromUrl, step]);

  // BR has no details step; normalize ?step=details or stray step state to media so BR never lands on the legacy details screen.
  useEffect(() => {
    if (categoryFromUrl !== "bienes-raices") return;
    const urlStep = searchParams?.get("step")?.trim();
    if (urlStep === "details" || step === "details") {
      skipStepSyncRef.current = true;
      setStep("media");
      syncStepInUrl("media");
    }
  }, [categoryFromUrl, searchParams, step, syncStepInUrl]);

  // Details (category-specific structured fields)
  const [details, setDetails] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    // Pre-fill from category pre-forms (e.g., Restaurants)
    if (prefill.placeType) d["placeType"] = prefill.placeType;
    if (prefill.cuisine) d["cuisine"] = prefill.cuisine;
    if (prefill.website) d["website"] = prefill.website;
    if (prefill.notes) d["notes"] = prefill.notes;
    return d;
  });
  detailsRefForBrBranch.current = details;
  // Basics
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>(() => {
    if (prefill.notes) return prefill.notes;
    return "";
  });
  const [isFree, setIsFree] = useState<boolean>(false);
  const [price, setPrice] = useState<string>("");
  const [city, setCity] = useState<string>(() => prefill.city || "");

  // Media + contact
  const [contactMethod, setContactMethod] = useState<"phone" | "email" | "both">("both");
  const [contactPhone, setContactPhone] = useState<string>(() => formatPhoneDisplay(prefill.phone || ""));
  const [contactEmail, setContactEmail] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  /** Rentas Privado is Pro-only; no free/pro comparison. */
  const isRentasPrivado = categoryFromUrl === "rentas" && (details.rentasBranch ?? "").trim() === "privado";
  /** Bienes Raíces negocio gets premium media (12 images, 1 video) like Rentas premium. */
  const isBienesRaicesNegocio = categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim() === "negocio";
  /** Private BR: sale-by-owner; single preview CTA, no free/pro comparison. */
  const isBienesRaicesPrivado = categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "privado";
  const effectiveIsPro = isPro || isRentasPrivado || isBienesRaicesNegocio;
  const maxImages = isRentasPrivado ? 15 : (categoryFromUrl === "bienes-raices" ? 12 : (effectiveIsPro ? 12 : 3));

  // If plan changes to Free, trim images to Free limit (3). Rentas Privado and private BR keep higher limits.
  useEffect(() => {
    if (!effectiveIsPro && !isBienesRaicesPrivado && images.length > 3) {
      setImages((prev) => prev.slice(0, 3));
    }
  }, [effectiveIsPro, isBienesRaicesPrivado, images.length]);

  const proVideoThumbPreviewUrls: [string, string] = useMemo(() => {
    const out: [string, string] = ["", ""];
    videoThumbBlobs.forEach((blob, i) => {
      if (blob) try { out[i] = URL.createObjectURL(blob); } catch {}
    });
    return out;
  }, [videoThumbBlobs]);

  const proVideoPreviewUrls: [string, string] = useMemo(() => {
    const out: [string, string] = ["", ""];
    videoFiles.forEach((file, i) => {
      if (file) try { out[i] = URL.createObjectURL(file); } catch {}
    });
    return out;
  }, [videoFiles]);

  useEffect(() => {
    return () => {
      proVideoThumbPreviewUrls.forEach((u) => { if (u) URL.revokeObjectURL(u); });
      proVideoPreviewUrls.forEach((u) => { if (u) URL.revokeObjectURL(u); });
    };
  }, [proVideoThumbPreviewUrls, proVideoPreviewUrls]);

  // Publish
  const [publishError, setPublishError] = useState<string>("");
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishedId, setPublishedId] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showDraftRestoreModal, setShowDraftRestoreModal] = useState<boolean>(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState<boolean>(false);
  const [fullPreviewVariant, setFullPreviewVariant] = useState<"free" | "pro">("free");
  /** Pro comparison: which benefit is highlighted in the preview (e.g. "more-photos", "pro-video"). */
  const [proHighlightId, setProHighlightId] = useState<string | null>(null);
  const [fullPreviewRulesConfirmed, setFullPreviewRulesConfirmed] = useState<boolean>(false);
  const [fullPreviewInfoConfirmed, setFullPreviewInfoConfirmed] = useState<boolean>(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [saveProgressing, setSaveProgressing] = useState<boolean>(false);
  const [leaveSaving, setLeaveSaving] = useState<boolean>(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [dbSaveStatus, setDbSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [recoveredDraftMessage, setRecoveredDraftMessage] = useState<string | null>(null);
  const draftCheckedRef = useRef(false);
  /** Rentas: branches we already ran restore check for (so we don’t re-fetch). */
  const checkedRentasBranchesRef = useRef<Set<string>>(new Set());
  /** Rentas: user chose "Start new" for this branch this session; don’t show restore modal again. */
  const startNewRentasBranchesRef = useRef<Set<string>>(new Set());
  const saveSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbSaveSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDbSaveRef = useRef<ReturnType<typeof setTimeout> | number | null>(null);
  /** When true, session gate must NOT redirect to login (preview is open; keep user on publish flow). */
  const fullPreviewModalOpenRef = useRef<boolean>(false);
  const sessionGateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rulesConfirmed, setRulesConfirmed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(RULES_CONFIRMED_KEY) === "1";
  });
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [agentPhotoUploading, setAgentPhotoUploading] = useState(false);
  const [floorPlanUploading, setFloorPlanUploading] = useState(false);

  const setRulesConfirmedPersisted = (value: boolean) => {
    setRulesConfirmed(value);
    if (typeof window !== "undefined") {
      if (value) sessionStorage.setItem(RULES_CONFIRMED_KEY, "1");
      else sessionStorage.removeItem(RULES_CONFIRMED_KEY);
    }
  };

  /** Upload business logo or agent photo to listing-images; store public URL in details. Used by BR negocio and Rentas negocio. */
  const uploadBusinessImage = useCallback(
    async (file: File, kind: "logo" | "agent") => {
      if (!userId) return;
      const setBusy = kind === "logo" ? setLogoUploading : setAgentPhotoUploading;
      const key = kind === "logo" ? "negocioLogoUrl" : "negocioFotoAgenteUrl";
      setBusy(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const rawExt = (file.name.split(".").pop() || "jpg").toLowerCase();
        const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : "jpg";
        const path = `${userId}/drafts/business-${kind}-${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
        if (error) throw error;
        const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
        setDetails((prev) => ({ ...prev, [key]: url }));
      } catch (e: unknown) {
        console.warn("business image upload failed", e);
        if (typeof window !== "undefined") alert(lang === "es" ? "No se pudo subir la imagen. Intenta de nuevo." : "Upload failed. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [userId, lang]
  );

  /** Upload BR negocio floorplan asset (image/pdf) and store public URL in details.negocioFloorPlanUrl. */
  const uploadBusinessFloorPlan = useCallback(
    async (file: File) => {
      if (!userId) return;
      setFloorPlanUploading(true);
      try {
        const supabase = createSupabaseBrowserClient();
        const rawExt = (file.name.split(".").pop() || "pdf").toLowerCase();
        const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : "pdf";
        const path = `${userId}/drafts/business-floorplan-${Date.now()}.${ext}`;
        const isPdf = ext === "pdf" || file.type === "application/pdf";
        const contentType =
          file.type && file.type !== "application/octet-stream"
            ? file.type
            : isPdf
              ? "application/pdf"
              : "image/jpeg";
        const { error } = await supabase.storage.from("listing-images").upload(path, file, { upsert: true, contentType });
        if (error) throw error;
        const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
        setDetails((prev) => ({ ...prev, negocioFloorPlanUrl: url }));
      } catch (e: unknown) {
        console.warn("floorplan upload failed", e);
        if (typeof window !== "undefined") {
          alert(lang === "es" ? "No se pudo subir el plano. Intenta de nuevo." : "Floorplan upload failed. Please try again.");
        }
      } finally {
        setFloorPlanUploading(false);
      }
    },
    [userId, lang]
  );

  const draftTimer = useRef<number | null>(null);
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const categoryActionsRef = useRef<HTMLDivElement | null>(null);
  const previousStepRef = useRef<PublishStep | null>(null);
  const confirmPublishTriggered = useRef(false);

  /** Category-scoped so BR draft never overwrites En Venta draft (and vice versa). */
  const draftKey = useMemo(
    () => `listing_draft_${getStableSessionId(userId || null)}_${categoryFromUrl || "unknown"}`,
    [userId, categoryFromUrl]
  );

  function scrollFormToTop(behavior: ScrollBehavior = "smooth") {
    if (typeof window === "undefined") return;

    const navbarEl = document.querySelector("[data-navbar-root]");
    const navbarHeight = navbarEl ? navbarEl.getBoundingClientRect().height : 0;
    const gapBelowNavbar = 16;
    const offset = navbarHeight > 0 ? navbarHeight + gapBelowNavbar : 72;

    if (topAnchorRef.current) {
      const rect = topAnchorRef.current.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top - offset;
      window.scrollTo({
        top: Math.max(0, absoluteTop),
        behavior,
      });
      return;
    }

    window.scrollTo({ top: 0, behavior });
  }

  /** Navigate to a step: push URL so browser Back has history; scroll form to top. Use for forward step navigation only. For Back use handleBack(). Options.branch for BR when step is set before details has committed. */
  const goToStep = useCallback(
    (newStep: PublishStep, options?: StepSyncOptions) => {
      skipStepSyncRef.current = true;
      setStep(newStep);
      syncStepInUrlPush(newStep, options);
      requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto")));
    },
    [syncStepInUrlPush]
  );

  /** In-app Atrás: always go to the real previous step in the flow (setStep + replace URL). Never router.back() so we never leave the publish flow. */
  const handleBack = useCallback(() => {
    const prev = getPreviousStep();
    if (!prev) return;
    skipStepSyncRef.current = true;
    setStep(prev);
    syncStepInUrl(prev);
    requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto")));
  }, [getPreviousStep, setStep, syncStepInUrl]);

  function scrollCategoryActionsIntoView() {
    if (typeof window === "undefined") return;
    requestAnimationFrame(() => {
      const el = categoryActionsRef.current;
      const isShortViewport = window.innerHeight <= 700;
      if (el && isShortViewport) {
        el.scrollIntoView({ behavior: "smooth", block: "end" });
      }
    });
  }

  // Scroll only in goToStep and handleBack to avoid double scroll and passive URL-restore scroll.
  // (previousStepRef kept for any future use; no scroll-on-step-change here.)

  // Session gate: redirect to login if not authenticated; fail-safe timeout so "Verificando sesión…" never hangs.
  const SESSION_GATE_TIMEOUT_MS = 8000;
  useEffect(() => {
    let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (e: any) {
      setAuthError(
        (e?.message as string) ||
          (lang === "es"
            ? "Faltan variables de entorno de Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY)."
            : "Missing Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).")
      );
      setChecking(false);
      return;
    }

    let mounted = true;
    const loginUrl = () => `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(redirectForLogin)}`;

    const clearTimeoutAndRedirectToLogin = () => {
      if (fullPreviewModalOpenRef.current) {
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.log("[publish session gate] skip redirect: preview modal is open");
        }
        return;
      }
      if (sessionGateTimeoutRef.current) {
        clearTimeout(sessionGateTimeoutRef.current);
        sessionGateTimeoutRef.current = null;
      }
      setChecking(false);
      router.replace(loginUrl());
    };

    sessionGateTimeoutRef.current = setTimeout(() => {
      sessionGateTimeoutRef.current = null;
      if (!mounted) return;
      clearTimeoutAndRedirectToLogin();
    }, SESSION_GATE_TIMEOUT_MS);

    async function check() {
      try {
        const { data } = await withAuthTimeout(
          supabase!.auth.getUser(),
          AUTH_CHECK_TIMEOUT_MS
        );
        if (!mounted) return;
        if (sessionGateTimeoutRef.current) {
          clearTimeout(sessionGateTimeoutRef.current);
          sessionGateTimeoutRef.current = null;
        }

        if (!data.user) {
          if (fullPreviewModalOpenRef.current) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.log("[publish session gate] skip redirect (no user): preview modal is open");
            }
            return;
          }
          setChecking(false);
          router.replace(loginUrl());
          return;
        }

        const meta = data.user.user_metadata || {};
        const profilePhoneDigits = (meta.phone || meta.contact_phone || "").toString().replace(/\D/g, "");
        const profileCityCanonical = normalizeCity((meta.city || meta.location || "").toString().trim());
        const profileCompleteForPost = profilePhoneDigits.length === 10 && Boolean(profileCityCanonical);
        if (!profileCompleteForPost) {
          if (fullPreviewModalOpenRef.current) {
            if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
              // eslint-disable-next-line no-console
              console.log("[publish session gate] skip redirect (profile): preview modal is open");
            }
            return;
          }
          setChecking(false);
          const perfilUrl = `/dashboard/perfil?lang=${lang}&require=post&redirect=${encodeURIComponent(redirectForLogin)}`;
          router.replace(perfilUrl);
          return;
        }

        setUserId(data.user.id);
        setSignedIn(true);
        const name = (meta.full_name ?? meta.name ?? meta.fullName ?? "").toString().trim();
        setSellerDisplayName(name || "");

        const planRaw =
          (data.user.user_metadata?.leonix_plan as string | undefined) ||
          (data.user.user_metadata?.plan as string | undefined) ||
          (data.user.app_metadata?.plan as string | undefined) ||
          "";
        const plan = String(planRaw).toLowerCase();
        setIsPro(plan.includes("pro"));

        const gm = (data.user.user_metadata as any)?.garage_mode_en_venta || null;
        const lastUsed = (gm && (gm.lastUsedAt || gm.last_used_at || gm.last_used)) ? String(gm.lastUsedAt || gm.last_used_at || gm.last_used) : "";
        const expires = (gm && (gm.expiresAt || gm.expires_at || gm.expires)) ? String(gm.expiresAt || gm.expires_at || gm.expires) : "";
        setGarageLastUsedAt(lastUsed);
        setGarageExpiresAt(expires);
        const expD = parseIsoMaybe(expires);
        setGarageActive(!!(expD && expD.getTime() > Date.now()));

        setChecking(false);
      } catch {
        if (!mounted) return;
        if (fullPreviewModalOpenRef.current) {
          if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.log("[publish session gate] skip redirect (catch): preview modal is open");
          }
          return;
        }
        if (sessionGateTimeoutRef.current) {
          clearTimeout(sessionGateTimeoutRef.current);
          sessionGateTimeoutRef.current = null;
        }
        setChecking(false);
        router.replace(loginUrl());
      }
    }

    check();

    return () => {
      mounted = false;
      if (sessionGateTimeoutRef.current) {
        clearTimeout(sessionGateTimeoutRef.current);
        sessionGateTimeoutRef.current = null;
      }
    };
  }, [router, redirectForLogin, lang]);

  const copy = useMemo(
    () => ({
      es: {
        title: "Publicar tu anuncio",
        subtitle: "Publica con claridad. Mientras más completo, más confianza y mejores resultados.",
        steps: { category: "Categoría", "rentas-track": "Rama", "bienes-raices-track": "Tipo de anunciante", basics: "Básicos", details: "Detalles", media: "Media + Contacto + Vista previa" },
        deleteDraft: "Eliminar progreso guardado",
        basicsTitle: "Básicos",
        categoryTitle: "Elige la categoría",
        categoryNote: "Esto asegura que tu anuncio salga en el lugar correcto y muestre los campos adecuados.",
        fieldTitle: "Título",
        fieldDesc: "Descripción",
        fieldPrice: "Precio",
        freeToggle: "Gratis",
        fieldCity: "Ciudad",
        next: "Siguiente",
        back: "Atrás",
        detailsTitle: "Detalles (por categoría)",
        detailsNote:
          "Agrega solo lo que aplica. Estos detalles ayudan a que tu anuncio se vea más profesional.",
        mediaTitle: "Media + Contacto",
        images: "Fotos (mínimo 1)",
        addImages: "Agregar fotos",
        video: "Videos (Pro, hasta 2 por anuncio)",
        addVideo: "Agregar video",
        videoHint: "Hasta 2 videos por anuncio. Máx 15s, 1080p, ~75MB.",
        rentasPrivadoVideo: "Video (Pro, hasta 1 por anuncio)",
        rentasPrivadoVideoHint: "Hasta 1 video. Máx 15s, 1080p, ~75MB.",
        videoLocked: "Desbloquea video con LEONIX Pro.",
        contact: "Método de contacto",
        phone: "Teléfono",
        email: "Email",
        both: "Ambos",
        publish: "Publicar",
        publishing: "Publicando anuncio…",
        rulesConfirm: "Confirmo que mi anuncio cumple con las reglas de la comunidad.",
        errorTitle: "Error al publicar anuncio",
        successTitle: "Anuncio publicado",
        goToMyListings: "Ir a mis anuncios",
        preview: "Vista previa",
        cardPreview: "Tarjeta (grid)",
        detailPreview: "Detalle",
        requiredHint: "Requisitos: Categoría + Título + Descripción + Precio/Gratis + Ciudad + 1 foto + Contacto.",
        published: "¡Listo! Tu anuncio fue publicado.",
        viewListing: "Ver anuncio",
        needReqs: "Revisa los requisitos antes de publicar.",
        checking: "Verificando sesión…",
        todayLabel: "Publicado hoy",
        saveLabel: "Guardar",
        shareLabel: "Compartir",
        contactLabel: "Contactar",
        fullPreviewCta: "Ver versión gratis",
        viewYourListingCta: "Ver tu anuncio",
        fullPreviewTitle: "Vista completa del anuncio",
        fullPreviewBackToEdit: "Volver a editar",
        fullPreviewInfoConfirm: "Confirmo que la información es correcta.",
        fullPreviewConfirmPublish: "Confirmar y publicar",
        proPreviewCta: "Ver cómo se vería con Pro",
        proPreviewTitle: "Vista previa Pro",
        proPreviewUpgradeCta: "Mejorar a Pro",
        proPreviewBackToListing: "Volver a mi anuncio",
        proPreviewViewFreeCta: "Ver versión gratis",
        sendMessageLabel: "Enviar mensaje",
        contactHelperText: "Así verán los usuarios cómo pueden contactarte.",
        draftInProgress: "Tienes una aplicación en progreso",
        continueDraft: "Continuar con lo guardado",
        createNewAd: "Crear anuncio nuevo",
        createNewAdHint: "La aplicación actual se conserva; empezarás otro anuncio desde cero.",
        deleteCurrentApplication: "Eliminar aplicación actual",
        deleteApplication: "Eliminar aplicación",
        leaveSaveDraft: "Guardar progreso y salir",
        leaveConfirmTitle: "¿Salir de la publicación?",
        leaveKeepEditing: "Seguir editando",
        exitLink: "Salir",
        saveProgress: "Guardar progreso",
        saveProgressSuccess: "Progreso guardado",
      },
      en: {
        title: "Post your ad",
        subtitle: "Post with clarity. The more complete it is, the more trust—and better results.",
        steps: { category: "Category", "rentas-track": "Track", "bienes-raices-track": "Seller type", basics: "Basics", details: "Details", media: "Media + Contact + Preview" },
        deleteDraft: "Delete application",
        basicsTitle: "Basics",
        categoryTitle: "Choose a category",
        categoryNote: "This ensures your listing appears in the right place and shows the right fields.",
        fieldTitle: "Title",
        fieldDesc: "Description",
        fieldPrice: "Price",
        freeToggle: "Free",
        fieldCity: "City",
        next: "Next",
        back: "Back",
        detailsTitle: "Details (per category)",
        detailsNote:
          "We’ll add structured category fields in the next batch. For now, we keep the experience clean and safe.",
        mediaTitle: "Media + Contact",
        images: "Photos (min 1)",
        addImages: "Add photos",
        video: "Videos (Pro, up to 2 per listing)",
        addVideo: "Add video",
        videoHint: "Up to 2 videos per listing. Max 15s, 1080p, ~75MB.",
        rentasPrivadoVideo: "Video (Pro, up to 1 per listing)",
        rentasPrivadoVideoHint: "Up to 1 video. Max 15s, 1080p, ~75MB.",
        videoLocked: "Unlock video with LEONIX Pro.",
        contact: "Contact method",
        phone: "Phone",
        email: "Email",
        both: "Both",
        publish: "Publish",
        publishing: "Publishing listing…",
        rulesConfirm: "I confirm that my listing complies with the community rules.",
        errorTitle: "Error publishing listing",
        successTitle: "Listing published",
        goToMyListings: "Go to my listings",
        preview: "Preview",
        cardPreview: "Card (grid)",
        detailPreview: "Detail",
        requiredHint: "Requirements: Category + Title + Description + Price/Free + City + 1 photo + Contact.",
        published: "Done! Your listing is live.",
        viewListing: "View listing",
        needReqs: "Please meet the requirements before publishing.",
        checking: "Checking session…",
        todayLabel: "Posted today",
        saveProgress: "Save progress",
        saveProgressSuccess: "Progress saved",
        saveLabel: "Save",
        shareLabel: "Share",
        contactLabel: "Contact",
        fullPreviewCta: "View free version",
        viewYourListingCta: "View your listing",
        fullPreviewTitle: "Full listing preview",
        fullPreviewBackToEdit: "Back to edit",
        fullPreviewInfoConfirm: "I confirm the information is correct.",
        fullPreviewConfirmPublish: "Confirm & Publish",
        proPreviewCta: "See how it would look with Pro",
        proPreviewTitle: "Pro preview",
        proPreviewUpgradeCta: "Upgrade to Pro",
        proPreviewBackToListing: "Back to my listing",
        proPreviewViewFreeCta: "View free version",
        sendMessageLabel: "Send message",
        contactHelperText: "This is how users will see how to contact you.",
        draftInProgress: "You have an application in progress",
        continueDraft: "Continue with saved draft",
        createNewAd: "Create new ad",
        createNewAdHint: "Your current application is kept; you'll start a separate ad from scratch.",
        deleteCurrentApplication: "Delete current application",
        deleteApplication: "Delete application",
        leaveConfirmTitle: "Leave publish flow?",
        leaveSaveDraft: "Save progress and exit",
        leaveKeepEditing: "Keep editing",
        exitLink: "Exit",
      },
    }),
    []
  )[lang];

  const IMAGES_RESTORE_KEY = "leonix_listing_draft_images_restore";

  const VALID_STEPS: PublishStep[] = ["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"];

  /** Restore form + images from DB draft_data payload. Restores saved step; fallback to basics (not category) for existing draft resume. */
  function applyDraftPayloadFromDb(payload: DraftDataPayload) {
    applyDraftToForm(payload as Partial<DraftV1>);
    if (payload.step && VALID_STEPS.includes(payload.step as PublishStep)) {
      setStep(payload.step as PublishStep);
    } else {
      setStep("basics");
    }
    if (payload.images && Array.isArray(payload.images) && payload.images.length > 0) {
      const files: File[] = [];
      for (let i = 0; i < payload.images.length; i++) {
        const img = payload.images[i];
        const b64 = img?.base64 ?? "";
        const name = img?.name || `image-${i + 1}.jpg`;
        const type = img?.type || "image/jpeg";
        if (!b64) continue;
        try {
          const bin = atob(b64);
          const arr = new Uint8Array(bin.length);
          for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
          files.push(new File([new Blob([arr], { type })], name, { type }));
        } catch {
          // skip invalid image
        }
      }
      if (files.length) setImages(files);
    }
  }

  // When returning from Pro page: auto-restore draft and step. For signed-in users, prefer DB over localStorage.
  useEffect(() => {
    if (searchParams?.get("fromPro") !== "1" || draftKey === "listing_draft_ssr") return;
    const raw = localStorage.getItem(draftKey);
    const parsed = raw ? (() => { try { return JSON.parse(raw) as Partial<DraftV1>; } catch { return null; } })() : null;
    if (!parsed || parsed.v !== 1) return;

    let cancelled = false;
    if (signedIn && userId) {
      draftCheckedRef.current = true;
      (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const categoryForQuery = categoryFromUrl || undefined;
          if (categoryForQuery === "rentas") {
            const branch = ((parsed as any)?.details as Record<string, string> | undefined)?.rentasBranch?.trim().toLowerCase();
            if (branch === "privado" || branch === "negocio") {
              const latest = await getLatestDraftForRentasBranch(supabase, userId, branch);
              if (!cancelled && latest?.draft_data) {
                applyDraftPayloadFromDb(latest.draft_data as DraftDataPayload);
                setDraftId(latest.id);
                setStoredDraftId(userId, latest.id);
                syncDraftIdInUrl(latest.id);
                return;
              }
            }
          } else {
            const latest = await getLatestDraftForCategory(supabase, userId, categoryForQuery);
            if (!cancelled && latest?.draft_data) {
              applyDraftPayloadFromDb(latest.draft_data as DraftDataPayload);
              setDraftId(latest.id);
              setStoredDraftId(userId, latest.id);
              syncDraftIdInUrl(latest.id);
              return;
            }
          }
        } catch {
          // fall through to localStorage fallback
        }
        if (!cancelled) {
          applyDraftToForm(parsed);
          setStep("basics");
          const stored = getStoredDraftId(userId);
          if (stored) setDraftId(stored);
        }
      })();
      return () => { cancelled = true; };
    }

    draftCheckedRef.current = true;
    applyDraftToForm(parsed);
    setStep("basics");
    if (userId) {
      const stored = getStoredDraftId(userId);
      if (stored) setDraftId(stored);
    }
  }, [searchParams, draftKey, userId, signedIn, categoryFromUrl, syncDraftIdInUrl]);

  // Re-entry: URL is source of truth for draft. First try draftId from URL (owned by user); then show restore modal if latest exists and URL has no draftId (no auto-hydrate).
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || draftCheckedRef.current) return;
    if (searchParams?.get("fromPro") === "1") return;

    if (!signedIn || !userId) {
      // Not signed in: local/session only; show modal only if local draft is for this category
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<DraftV1>;
          if (parsed.v === 1) {
            const parsedCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
            if (parsedCat === categoryFromUrl) setShowDraftRestoreModal(true);
          }
        } catch {
          // ignore
        }
      }
      return;
    }

    let cancelled = false;
    draftCheckedRef.current = true;
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const categoryForQuery = categoryFromUrl || undefined;

        // 1) URL draftId first: load exact draft if present and owned. Stay category-scoped: if draft is for another category, redirect to that route.
        const urlDraftId = searchParams?.get("draftId")?.trim();
        if (urlDraftId) {
          const row = await getDraft(supabase, urlDraftId, userId);
          if (cancelled) return;
          if (row?.draft_data) {
            const payload = row.draft_data as DraftDataPayload & { category?: string };
            const draftCat = typeof payload?.category === "string" ? normalizeCategory(payload.category) : "";
            if (draftCat && draftCat !== categoryForQuery) {
              const p = new URLSearchParams(searchParams?.toString() ?? "");
              p.set("draftId", row.id);
              if (!p.has("lang")) p.set("lang", lang);
              router.replace(`/clasificados/publicar/${draftCat}?${p.toString()}`);
              return;
            }
            applyDraftPayloadFromDb(row.draft_data as DraftDataPayload);
            setDraftId(row.id);
            setStoredDraftId(userId, row.id);
            syncDraftIdInUrl(row.id);
            return;
          }
          // Invalid or not owned: strip from URL and fall through
          syncDraftIdInUrl(null);
        }

        // 2) No draftId in URL: if latest draft exists, show restore modal (do not hydrate)
        if (categoryForQuery === "rentas") {
          const raw = localStorage.getItem(draftKey);
          let branchHint: string | null = null;
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Partial<DraftV1>;
              const d = (parsed as any)?.details as Record<string, string> | undefined;
              const b = (d?.rentasBranch ?? "").trim().toLowerCase();
              if (b === "privado" || b === "negocio") branchHint = b;
            } catch {
              // ignore
            }
          }
          if (branchHint) {
            const latest = await getLatestDraftForRentasBranch(supabase, userId, branchHint);
            if (cancelled) return;
            if (latest?.draft_data) {
              setDraftId(latest.id);
              setStoredDraftId(userId, latest.id);
              setShowDraftRestoreModal(true);
              return;
            }
          }
          // No branch chosen yet: do not offer a random rentas draft; wait for branch selection (see effect below)
          return;
        }
        // Bienes Raíces: auto-hydrate latest in-progress draft (e.g. return from /agente with returnTo missing draftId).
        // Only Start new / Eliminar aplicación should clear; do not leave an empty form behind a blocking modal.
        if (categoryForQuery === "bienes-raices") {
          const branchInUrl = searchParams?.get("branch")?.trim().toLowerCase();
          let pick: ListingDraftRow | null = null;
          if (branchInUrl === "privado" || branchInUrl === "negocio") {
            const rows = await getDraftsForCategory(supabase, userId, "bienes-raices", 20);
            if (cancelled) return;
            pick =
              rows.find(
                (row) =>
                  ((row.draft_data?.details as Record<string, string> | undefined)?.bienesRaicesBranch ?? "")
                    .trim()
                    .toLowerCase() === branchInUrl
              ) ?? null;
          }
          if (!pick) {
            pick = await getLatestDraftForCategory(supabase, userId, "bienes-raices");
          }
          if (cancelled) return;
          if (pick?.draft_data) {
            const payload = pick.draft_data as DraftDataPayload;
            applyDraftPayloadFromDb(payload);
            setDraftId(pick.id);
            setStoredDraftId(userId, pick.id);
            syncDraftIdInUrl(pick.id);
            const brSteps: PublishStep[] = ["category", "bienes-raices-track", "basics", "media"];
            let restoredStep: PublishStep = "basics";
            if (categoryFromUrl === "bienes-raices" && payload.step === "details") {
              restoredStep = "media";
            } else if (payload.step && brSteps.includes(payload.step as PublishStep)) {
              restoredStep = payload.step as PublishStep;
            }
            setStep(restoredStep);
            const brBranch = (payload.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
            const branchOpt = brBranch === "privado" || brBranch === "negocio" ? { branch: brBranch as "privado" | "negocio" } : undefined;
            syncStepInUrl(restoredStep, branchOpt);
            setRecoveredDraftMessage(lang === "es" ? "Progreso guardado recuperado." : "Recovered saved progress.");
            return;
          }
        } else {
          const latest = await getLatestDraftForCategory(supabase, userId, categoryForQuery);
          if (cancelled) return;
          if (latest?.draft_data) {
            setDraftId(latest.id);
            setStoredDraftId(userId, latest.id);
            setShowDraftRestoreModal(true);
            return;
          }
        }

        // 3) No DB draft: fall back to local; show modal only if local draft is for this category
        const raw = localStorage.getItem(draftKey);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DraftV1>;
          if (parsed.v === 1) {
            const parsedCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
            if (parsedCat === categoryFromUrl) setShowDraftRestoreModal(true);
          }
        }
      } catch {
        if (!cancelled) {
          syncDraftIdInUrl(null);
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Partial<DraftV1>;
              if (parsed.v === 1) setShowDraftRestoreModal(true);
            } catch {
              // ignore
            }
          }
          draftCheckedRef.current = true;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [draftKey, signedIn, userId, categoryFromUrl, searchParams, syncDraftIdInUrl, syncStepInUrl, router, lang]);

  // Rentas: when user selects a branch, run restore check for that branch only (no modal before branch is chosen).
  useEffect(() => {
    if (categoryFromUrl !== "rentas" || !signedIn || !userId || searchParams?.get("draftId")?.trim()) return;
    const branch = (details.rentasBranch ?? "").trim().toLowerCase();
    if (branch !== "privado" && branch !== "negocio") return;
    if (checkedRentasBranchesRef.current.has(branch) || startNewRentasBranchesRef.current.has(branch)) return;

    let cancelled = false;
    checkedRentasBranchesRef.current.add(branch);
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const latest = await getLatestDraftForRentasBranch(supabase, userId, branch);
        if (cancelled) return;
        if (startNewRentasBranchesRef.current.has(branch)) return;
        if (latest?.draft_data) {
          setDraftId(latest.id);
          setStoredDraftId(userId, latest.id);
          setShowDraftRestoreModal(true);
        }
      } catch {
        // leave modal closed
      }
    })();
    return () => { cancelled = true; };
  }, [categoryFromUrl, signedIn, userId, details.rentasBranch, searchParams]);

  /** Restore only form values from draft; step is not restored (avoids random step jumps). Never sync category from draft when it would differ from URL (route must be updated elsewhere first). */
  function applyDraftToForm(parsed: Partial<DraftV1>) {
    setTitle(typeof parsed.title === "string" ? parsed.title : "");
    setDescription(typeof parsed.description === "string" ? parsed.description : "");
    setIsFree(Boolean(parsed.isFree));
    setPrice(typeof parsed.price === "string" ? parsed.price : "");
    const loadedCity = typeof parsed.city === "string" ? parsed.city : "";
    setCity(loadedCity ? (normalizeCity(loadedCity) || loadedCity.trim()) : "");
    const draftCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
    if (draftCat && draftCat === categoryFromUrl) setCategory(draftCat);
    setDetails(typeof (parsed as any).details === "object" && (parsed as any).details ? ((parsed as any).details as Record<string, string>) : {});
    const method = parsed.contactMethod === "phone" || parsed.contactMethod === "email" || parsed.contactMethod === "both" ? parsed.contactMethod : "both";
    setContactMethod(method);
    setContactPhone(typeof parsed.contactPhone === "string" ? formatPhoneDisplay(parsed.contactPhone) : "");
    setContactEmail(typeof parsed.contactEmail === "string" ? parsed.contactEmail : "");
  }

  function resetFormToEmpty() {
    const d: Record<string, string> = {};
    if (prefill.placeType) d["placeType"] = prefill.placeType;
    if (prefill.cuisine) d["cuisine"] = prefill.cuisine;
    if (prefill.website) d["website"] = prefill.website;
    if (prefill.notes) d["notes"] = prefill.notes;
    setTitle("");
    setDescription(prefill.notes || "");
    setPrice("");
    setIsFree(false);
    setCity(prefill.city || "");
    setDetails(d);
    setContactMethod("both");
    setContactPhone(formatPhoneDisplay(prefill.phone || ""));
    setContactEmail("");
    setImages([]);
    setFilePreviews([]);
    setStep("category");
    setCategory(categoryFromUrl);
  }

  useEffect(() => {
    if (!recoveredDraftMessage) return;
    const t = setTimeout(() => setRecoveredDraftMessage(null), 3000);
    return () => clearTimeout(t);
  }, [recoveredDraftMessage]);

  async function handleContinueDraft() {
    setShowDraftRestoreModal(false);
    try {
      if (draftId && userId) {
        const supabase = createSupabaseBrowserClient();
        const row = await getDraft(supabase, draftId, userId);
        if (row?.draft_data) {
          const payload = row.draft_data as DraftDataPayload & { category?: string };
          const draftCat = typeof payload?.category === "string" ? normalizeCategory(payload.category) : "";
          if (draftCat && draftCat !== categoryFromUrl) {
            const p = new URLSearchParams(searchParams?.toString() ?? "");
            p.set("draftId", draftId);
            if (!p.has("lang")) p.set("lang", lang);
            if (draftCat === "bienes-raices") {
              const stepVal = (payload as DraftDataPayload).step;
              if (stepVal && ["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"].includes(stepVal)) p.set("step", stepVal);
              const brBranch = (payload.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
              if (brBranch === "privado" || brBranch === "negocio") p.set("branch", brBranch);
            }
            router.replace(`/clasificados/publicar/${draftCat}?${p.toString()}`);
            return;
          }
          applyDraftPayloadFromDb(payload);
          const restoredStep = (categoryFromUrl === "bienes-raices" && payload.step === "details")
            ? "media"
            : (payload.step && (["category", "rentas-track", "bienes-raices-track", "basics", "details", "media"] as const).includes(payload.step as PublishStep) && stepsForCategory.includes(payload.step as PublishStep)) ? (payload.step as PublishStep) : "basics";
          setStep(restoredStep);
          syncDraftIdInUrl(draftId);
          const brBranch = (payload.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
          const branchOpt = (brBranch === "privado" || brBranch === "negocio") ? { branch: brBranch as "privado" | "negocio" } : undefined;
          syncStepInUrl(restoredStep, branchOpt);
          setRecoveredDraftMessage(lang === "es" ? "Progreso guardado recuperado." : "Recovered saved progress.");
          return;
        }
      }
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DraftV1>;
      if (parsed.v !== 1) return;
      const parsedCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
      if (parsedCat && parsedCat !== categoryFromUrl) {
        const p = new URLSearchParams(searchParams?.toString() ?? "");
        if (!p.has("lang")) p.set("lang", lang);
        if (parsedCat === "bienes-raices") {
          const brBranch = (parsed.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
          if (brBranch === "privado" || brBranch === "negocio") p.set("branch", brBranch);
        }
        router.replace(`/clasificados/publicar/${parsedCat}?${p.toString()}`);
        return;
      }
      applyDraftToForm(parsed);
      setStep("basics");
      const localBrBranch = (parsed.details as Record<string, string> | undefined)?.bienesRaicesBranch?.trim().toLowerCase();
      const localBranchOpt = (localBrBranch === "privado" || localBrBranch === "negocio") ? { branch: localBrBranch as "privado" | "negocio" } : undefined;
      syncStepInUrl("basics", localBranchOpt);
      try {
        const imgRaw = sessionStorage.getItem(draftKey + "_images");
        if (imgRaw) {
          const { base64: b64List, names, types } = JSON.parse(imgRaw) as { base64: string[]; names: string[]; types: string[] };
          if (Array.isArray(b64List) && Array.isArray(names) && b64List.length > 0) {
            const files: File[] = [];
            for (let i = 0; i < b64List.length; i++) {
              const b64 = b64List[i];
              const name = (names && names[i]) || `image-${i + 1}.jpg`;
              const type = (types && types[i]) || "image/jpeg";
              const bin = atob(b64);
              const arr = new Uint8Array(bin.length);
              for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
              files.push(new File([new Blob([arr], { type })], name, { type }));
            }
            if (files.length) setImages(files);
          }
        }
      } catch {
        // ignore image restore
      }
    } catch {
      // already closed modal
    }
  }

  function handleCreateNewAd() {
    if (categoryFromUrl === "rentas") {
      const b = (details.rentasBranch ?? "").trim().toLowerCase();
      if (b === "privado" || b === "negocio") startNewRentasBranchesRef.current.add(b);
    }
    setDraftId(null);
    if (userId) clearStoredDraftId(userId);
    resetFormToEmpty();
    setShowDraftRestoreModal(false);
    syncDraftIdInUrl(null);
    if (categoryFromUrl === "rentas") {
      setStep("rentas-track");
      syncStepInUrl("rentas-track");
    } else if (categoryFromUrl === "bienes-raices") {
      setStep("bienes-raices-track");
      syncStepInUrl("bienes-raices-track");
    } else {
      setStep("category");
      syncStepInUrl("category");
    }
  }

  async function handleDeleteCurrentDraft() {
    if (draftId && userId) {
      try {
        const supabase = createSupabaseBrowserClient();
        await deleteDraftInDb(supabase, draftId, userId);
      } catch {
        // ignore
      }
      setDraftId(null);
      clearStoredDraftId(userId);
    }
    clearAllClassifiedsDrafts({ draftKey, userId });
    resetFormToEmpty();
    setShowDraftRestoreModal(false);
    syncDraftIdInUrl(null);
    if (categoryFromUrl === "rentas") {
      setStep("rentas-track");
      syncStepInUrl("rentas-track");
    } else if (categoryFromUrl === "bienes-raices") {
      setStep("bienes-raices-track");
      syncStepInUrl("bienes-raices-track");
    } else {
      setStep("category");
      syncStepInUrl("category");
    }
  }

  // Restore images from sessionStorage when returning from preview (prevents form reset)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(IMAGES_RESTORE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(IMAGES_RESTORE_KEY);
      const { base64: b64List, names, types } = JSON.parse(raw) as { base64: string[]; names: string[]; types: string[] };
      if (!Array.isArray(b64List) || !Array.isArray(names) || b64List.length === 0) return;
      const files: File[] = [];
      for (let i = 0; i < b64List.length; i++) {
        const b64 = b64List[i];
        const name = (names && names[i]) || `image-${i + 1}.jpg`;
        const type = (types && types[i]) || "image/jpeg";
        const bin = atob(b64);
        const arr = new Uint8Array(bin.length);
        for (let j = 0; j < bin.length; j++) arr[j] = bin.charCodeAt(j);
        const blob = new Blob([arr], { type });
        files.push(new File([blob], name, { type }));
      }
      if (files.length) setImages(files);
    } catch {
      sessionStorage.removeItem(IMAGES_RESTORE_KEY);
    }
  }, []);

  // When returning from preview with Confirm & Publish: set rules/preview state and run publish once.
  useEffect(() => {
    if (searchParams?.get("confirmPublish") !== "1" || confirmPublishTriggered.current) return;
    confirmPublishTriggered.current = true;
    setRulesConfirmedPersisted(true);
    setPreviewViewed(true);
    setStep("media");
    const t = setTimeout(() => {
      publish();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional single run with current publish
  }, [searchParams]);

  // Load active listing count for Garage Mode messaging (Free-only, En Venta).
  useEffect(() => {
    if (!signedIn || !userId) return;

    if (category !== "en-venta") {
      setEnVentaActiveCount(null);
      return;
    }

    let mounted = true;
    async function loadCount() {
      setGarageLoading(true);
      try {
        const supabase = createSupabaseBrowserClient();

        // Try the most correct query first (status + owner_id). Fall back safely if schema differs.
        const base = supabase.from("listings").select("id", { count: "exact", head: true }).eq("category", "en-venta");

        // Attempt with owner_id + status=active
        let r = await base.eq("owner_id", userId).eq("status", "active");
        if (r.error) {
          const msg = String(r.error.message || "");
          // Missing status column
          if (/status/i.test(msg) && /(does not exist|unknown|column)/i.test(msg)) {
            r = await base.eq("owner_id", userId);
          }
        }

        if (r.error) {
          // If owner_id column is missing, we can't enforce Garage Mode safely.
          if (mounted) setEnVentaActiveCount(null);
          return;
        }

        if (mounted) setEnVentaActiveCount(typeof r.count === "number" ? r.count : 0);
      } finally {
        if (mounted) setGarageLoading(false);
      }
    }

    loadCount();
    return () => {
      mounted = false;
    };
  }, [signedIn, userId, category]);


  // Draft autosave to localStorage (quick resilience) — 250ms debounce
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal) return;
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      const draft: DraftV1 = {
        v: 1,
        step,
        title,
        description,
        isFree,
        price,
        city: normalizeCity(city) || city.trim(),
        category,
        details,
        contactMethod,
        contactPhone,
        contactEmail,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {
        // ignore
      }
    }, 250);
    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
  }, [draftKey, showDraftRestoreModal, step, title, description, isFree, price, city, category, contactMethod, contactPhone, contactEmail, details]);

  // Persist images with draft (local fallback); debounced.
  const draftImagesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal || images.length === 0) return;
    if (draftImagesTimerRef.current) clearTimeout(draftImagesTimerRef.current);
    draftImagesTimerRef.current = setTimeout(() => {
      const key = draftKey + "_images";
      Promise.all(images.map((f) => fileToBase64(f)))
        .then((base64) => {
          const names = images.map((f) => f.name);
          const types = images.map((f) => f.type || "image/jpeg");
          sessionStorage.setItem(key, JSON.stringify({ base64, names, types }));
        })
        .catch(() => {});
      draftImagesTimerRef.current = null;
    }, 400);
    return () => {
      if (draftImagesTimerRef.current) clearTimeout(draftImagesTimerRef.current);
    };
  }, [draftKey, showDraftRestoreModal, images]);

  /** Build full normalized payload for DB (includes images as base64). */
  const buildPayloadAsync = useCallback(async (): Promise<DraftDataPayload> => {
    const imagePayload =
      images.length > 0
        ? await Promise.all(
            images.map(async (f) => ({
              base64: await fileToBase64(f),
              name: f.name,
              type: f.type || "image/jpeg",
            }))
          )
        : [];
    return {
      v: 1,
      step,
      category: category || "",
      title,
      description,
      isFree,
      price,
      city: normalizeCity(city) || city.trim(),
      details,
      contactMethod,
      contactPhone,
      contactEmail,
      images: imagePayload,
      updatedAt: new Date().toISOString(),
    };
  }, [step, category, title, description, isFree, price, city, details, contactMethod, contactPhone, contactEmail, images]);

  /** Persist draft to DB (one active draft per category per user; for rentas, per branch). Then localStorage fallback. */
  const performDbSave = useCallback(async () => {
    if (draftKey === "listing_draft_ssr" || !userId || showDraftRestoreModal) return;
    try {
      const payload = await buildPayloadAsync();
      const hasContent =
        (payload.title || "").trim() ||
        (payload.description || "").trim() ||
        (payload.city || "").trim() ||
        (payload.price || "").trim() ||
        payload.images.length > 0 ||
        Object.values(payload.details || {}).some((v) => (v || "").trim());
      if (!draftId && !hasContent) return;

      const categorySlug = payload.category || "en-venta";
      const rentasBranch = (payload.details?.rentasBranch ?? "").trim().toLowerCase();
      const bienesRaicesBranch = (payload.details?.bienesRaicesBranch ?? "").trim().toLowerCase();
      if (categorySlug === "rentas" && rentasBranch !== "privado" && rentasBranch !== "negocio") {
        // Don't write to DB until branch is chosen; keep local autosave only
        const { images: _img, ...rest } = payload;
        localStorage.setItem(draftKey, JSON.stringify(rest as Partial<DraftV1>));
        return;
      }
      if (categorySlug === "bienes-raices" && bienesRaicesBranch !== "privado" && bienesRaicesBranch !== "negocio") {
        const { images: _img, ...rest } = payload;
        localStorage.setItem(draftKey, JSON.stringify(rest as Partial<DraftV1>));
        return;
      }

      setDbSaveStatus("saving");
      const supabase = createSupabaseBrowserClient();

      if (draftId) {
        const result = await updateDraft(supabase, draftId, userId, payload);
        if (result.ok) {
          setDbSaveStatus("saved");
          if (dbSaveSuccessTimerRef.current) clearTimeout(dbSaveSuccessTimerRef.current);
          dbSaveSuccessTimerRef.current = setTimeout(() => {
            setDbSaveStatus("idle");
            dbSaveSuccessTimerRef.current = null;
          }, 2000);
        } else {
          setDbSaveStatus("error");
        }
      } else {
        // One active draft per category per user (for rentas: per branch)
        const isRentasWithBranch = categorySlug === "rentas" && (rentasBranch === "privado" || rentasBranch === "negocio");
        const existing = isRentasWithBranch
          ? await getLatestDraftForRentasBranch(supabase, userId, rentasBranch)
          : await getLatestDraftForCategory(supabase, userId, categorySlug);
        if (existing) {
          const result = await updateDraft(supabase, existing.id, userId, payload);
          if (result.ok) {
            setDraftId(existing.id);
            setStoredDraftId(userId, existing.id);
            syncDraftIdInUrl(existing.id);
            setDbSaveStatus("saved");
            if (dbSaveSuccessTimerRef.current) clearTimeout(dbSaveSuccessTimerRef.current);
            dbSaveSuccessTimerRef.current = setTimeout(() => {
              setDbSaveStatus("idle");
              dbSaveSuccessTimerRef.current = null;
            }, 2000);
          } else {
            setDbSaveStatus("error");
          }
        } else {
          const created = await createDraft(supabase, userId, categorySlug, payload);
          if (created) {
            setDraftId(created.id);
            setStoredDraftId(userId, created.id);
            syncDraftIdInUrl(created.id);
            setDbSaveStatus("saved");
            if (dbSaveSuccessTimerRef.current) clearTimeout(dbSaveSuccessTimerRef.current);
            dbSaveSuccessTimerRef.current = setTimeout(() => {
              setDbSaveStatus("idle");
              dbSaveSuccessTimerRef.current = null;
            }, 2000);
          } else {
            setDbSaveStatus("error");
          }
        }
      }

      const { images: _img, ...rest } = payload;
      const forLocal = rest as Partial<DraftV1>;
      localStorage.setItem(draftKey, JSON.stringify(forLocal));
      if (payload.images.length > 0) {
        const payloadStr = JSON.stringify({
          base64: payload.images.map((i) => i.base64),
          names: payload.images.map((i) => i.name),
          types: payload.images.map((i) => i.type),
        });
        sessionStorage.setItem(IMAGES_RESTORE_KEY, payloadStr);
        sessionStorage.setItem(draftKey + "_images", payloadStr);
      }
    } catch {
      setDbSaveStatus("error");
    }
  }, [
    draftKey,
    userId,
    draftId,
    showDraftRestoreModal,
    buildPayloadAsync,
    syncDraftIdInUrl,
  ]);

  // DB autosave — immediate for step, category, contactMethod, isFree, images
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal || !userId) return;
    if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    pendingDbSaveRef.current = null;
    void performDbSave();
    return () => {
      if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    };
  }, [step, category, contactMethod, isFree, images, draftKey, showDraftRestoreModal, userId, performDbSave]);

  // DB autosave — debounced 500ms for typing-heavy fields
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || showDraftRestoreModal || !userId) return;
    if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    pendingDbSaveRef.current = window.setTimeout(() => {
      pendingDbSaveRef.current = null;
      void performDbSave();
    }, 500);
    return () => {
      if (pendingDbSaveRef.current) clearTimeout(pendingDbSaveRef.current);
    };
  }, [title, description, price, city, contactPhone, contactEmail, details, draftKey, showDraftRestoreModal, userId, performDbSave]);

  // Flush pending DB save on visibilitychange (tab hidden / closed)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && pendingDbSaveRef.current) {
        clearTimeout(pendingDbSaveRef.current);
        pendingDbSaveRef.current = null;
        void performDbSave();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [performDbSave]);

  /** Flush draft and images so when seller returns from Pro page their ad is intact. Also persists to DB. */
  const saveDraftAndImagesForProReturn = useCallback(async () => {
    if (draftKey === "listing_draft_ssr") return;
    try {
      const draft: DraftV1 = {
        v: 1,
        step,
        title,
        description,
        isFree,
        price,
        city: normalizeCity(city) || city.trim(),
        category,
        details,
        contactMethod,
        contactPhone,
        contactEmail,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      if (images.length > 0) {
        const base64 = await Promise.all(images.map((f) => fileToBase64(f)));
        const names = images.map((f) => f.name);
        const types = images.map((f) => f.type || "image/jpeg");
        const payload = JSON.stringify({ base64, names, types });
        sessionStorage.setItem(IMAGES_RESTORE_KEY, payload);
        sessionStorage.setItem(draftKey + "_images", payload);
      }
      await performDbSave();
    } catch {
      // ignore
    }
  }, [draftKey, step, title, description, isFree, price, city, category, details, contactMethod, contactPhone, contactEmail, images, performDbSave]);

  const handleSaveProgress = useCallback(async () => {
    setSaveProgressing(true);
    try {
      await saveDraftAndImagesForProReturn();
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
      setShowSaveSuccess(true);
      saveSuccessTimerRef.current = setTimeout(() => {
        setShowSaveSuccess(false);
        saveSuccessTimerRef.current = null;
      }, 3000);
    } finally {
      setSaveProgressing(false);
    }
  }, [saveDraftAndImagesForProReturn]);

  useEffect(() => {
    return () => {
      if (saveSuccessTimerRef.current) clearTimeout(saveSuccessTimerRef.current);
    };
  }, []);

  const isFormDirty = useMemo(() => {
    return (
      title.trim().length > 0 ||
      description.trim().length > 0 ||
      city.trim().length > 0 ||
      (price.trim().length > 0 && !isFree) ||
      images.length > 0 ||
      Object.values(details).some((v) => String(v ?? "").trim().length > 0)
    );
  }, [title, description, city, price, isFree, images.length, details]);

  function handleExitClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isFormDirty) setShowLeaveConfirmModal(true);
    else void handleExitSaveAndNavigate();
  }

  /** Salir: always persist progress (local + DB) then go to Clasificados — never clear drafts here. */
  async function handleExitSaveAndNavigate() {
    setLeaveSaving(true);
    try {
      await saveDraftAndImagesForProReturn();
      setShowLeaveConfirmModal(false);
      router.push(`/clasificados?lang=${lang}`);
    } finally {
      setLeaveSaving(false);
    }
  }

  async function handleLeaveSaveDraft() {
    await handleExitSaveAndNavigate();
  }

  // Image previews (from images state)
  useEffect(() => {
    const urls = images.map((f) => URL.createObjectURL(f));
    setFilePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  // Single normalized snapshot for preview, validation, and insert (same source of truth).
  const enVentaSnapshot = useMemo(() => {
    const isPrivate = category === "rentas" && (details.rentasBranch ?? "").trim() === "privado";
    const descriptionForSnapshot =
      category === "bienes-raices"
        ? (details.enVentaFullDescription ?? "").trim() || ""
        : description;
    return buildEnVentaDraftSnapshot({
      title,
      description: descriptionForSnapshot,
      city,
      price,
      isFree: category === "en-venta" || category === "bienes-raices" ? false : isFree,
      details,
      contactMethod,
      contactPhone,
      contactEmail,
      category,
      lang,
      isPro: effectiveIsPro,
      imageUrls: filePreviews,
      proVideoThumbUrl: proVideoThumbPreviewUrls[0] || null,
      proVideoUrl: proVideoPreviewUrls[0] || null,
      proVideoThumbUrl2: isPrivate ? null : (proVideoThumbPreviewUrls[1] || null),
      proVideoUrl2: isPrivate ? null : (proVideoPreviewUrls[1] || null),
    });
  }, [
    title,
    description,
    city,
    price,
    isFree,
    details,
    contactMethod,
    contactPhone,
    contactEmail,
    category,
    lang,
    effectiveIsPro,
    filePreviews,
    proVideoThumbPreviewUrls,
    proVideoPreviewUrls,
  ]);

  // Validation from snapshot so we validate what preview/insert use.
  const requirements = useMemo(() => {
    const s = enVentaSnapshot;
    const categoryOk = !!normalizeCategory(s.category);
    const titleOk = s.title.length >= 5;
    const descOk = s.description.length >= 5;
    const cityOk = Boolean(s.cityCanonical);
    const priceNum = (s.priceRaw ?? "").replace(/[^0-9.]/g, "");
    const priceOk =
      s.category === "rentas" || s.category === "bienes-raices"
        ? priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0
        : s.isFree || (priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0);
    const imagesOk = s.images.length >= 1;
    const bienesRaicesBranchEarly = (s.details.bienesRaicesBranch ?? "").trim().toLowerCase();
    const isBienesRaicesNegocioContact = s.category === "bienes-raices" && bienesRaicesBranchEarly === "negocio";
    const brNegocioOfficeDigits = (s.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
    const brNegocioBizEmailOk = /.+@.+\..+/.test((s.details.negocioEmail ?? "").trim());
    const phoneDigits = getPhoneDigits(s.contactPhone);
    const phoneOk =
      s.contactMethod === "email"
        ? true
        : phoneDigits.length === 10 || (isBienesRaicesNegocioContact && brNegocioOfficeDigits.length === 10);
    const emailOk =
      s.contactMethod === "phone"
        ? true
        : /.+@.+\..+/.test(s.contactEmail.trim()) || (isBienesRaicesNegocioContact && brNegocioBizEmailOk);
    const contactOk =
      phoneDigits.length === 10 ||
      /.+@.+\..+/.test(s.contactEmail.trim()) ||
      (isBienesRaicesNegocioContact && (brNegocioOfficeDigits.length === 10 || brNegocioBizEmailOk));
    // En Venta: item-selling metadata (subcategoría, artículo, condición).
    const enVentaMetaOk =
      s.category !== "en-venta" ||
      (!!(s.details.rama ?? "").trim() &&
        !!(s.details.itemType ?? "").trim() &&
        !!(s.details.condition ?? "").trim());
    const rentasBranch = (s.details.rentasBranch ?? "").trim();
    const rentasNegocio = s.category === "rentas" && rentasBranch === "negocio";
    const rentasNegocioNameOk = !rentasNegocio || !!(s.details.negocioNombre ?? "").trim();
    const rentasNegocioTierOk = !rentasNegocio || !!(s.details.rentasTier ?? "").trim();
    const negocioOfficePhone = (s.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
    const rentasNegocioContactOk =
      !rentasNegocio ||
      contactOk ||
      negocioOfficePhone.length === 10;
    const rentasMetaOk =
      s.category !== "rentas" ||
      (!!(s.details.rentasSubcategoria ?? "").trim() &&
        !!(s.details.tipoPropiedad ?? "").trim() &&
        !!rentasBranch &&
        !!(s.details.fechaDisponible ?? "").trim() &&
        rentasNegocioNameOk &&
        rentasNegocioTierOk &&
        rentasNegocioContactOk);
    const bienesRaicesBranch = (s.details.bienesRaicesBranch ?? "").trim().toLowerCase();
    const isBienesRaicesNegocio = s.category === "bienes-raices" && bienesRaicesBranch === "negocio";
    const brDescription = (s.details.enVentaFullDescription ?? "").trim();
    const brPt = (s.details.enVentaPropertyType ?? "").trim();
    const brSubcat = (s.details.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType(brPt);
    const brPrivadoCoreOk = !!(s.details.enVentaPropertyType ?? "").trim() && brDescription.length >= 5;
    const brPrivadoTypeOk =
      brSubcat === "terrenos"
        ? !!(s.details.enVentaLotSize ?? "").trim()
        : brSubcat === "comercial" || brSubcat === "industrial"
          ? !!(s.details.enVentaSquareFeet ?? "").trim()
          : (brSubcat === "residencial" || brSubcat === "condos-townhomes" || brSubcat === "multifamiliar")
            ? !!(s.details.enVentaBedrooms ?? "").trim() && !!(s.details.enVentaBathrooms ?? "").trim() && !!(s.details.enVentaSquareFeet ?? "").trim()
            : isBrPrivadoLote(brPt)
              ? !!(s.details.enVentaLotSize ?? "").trim()
              : isBrPrivadoComercial(brPt) || isBrPrivadoEdificio(brPt)
                ? !!(s.details.enVentaSquareFeet ?? "").trim()
                : isBrPrivadoProyectoNuevo(brPt)
                  ? true
                  : true;
    const bienesRaicesMetaOk =
      s.category !== "bienes-raices" ||
      (
        ["privado", "negocio"].includes(bienesRaicesBranch) &&
        !!brPt &&
        brDescription.length >= 5 &&
        (bienesRaicesBranch === "negocio"
          ? !!(s.details.enVentaBedrooms ?? "").trim() &&
            !!(s.details.enVentaBathrooms ?? "").trim() &&
            !!(s.details.enVentaSquareFeet ?? "").trim() &&
            !!(s.details.negocioNombre ?? s.details.enVentaBusinessName ?? "").trim()
          : brPrivadoTypeOk)
      );
    return {
      categoryOk,
      titleOk,
      descOk,
      cityOk,
      priceOk,
      imagesOk,
      phoneOk,
      emailOk,
      contactOk,
      enVentaMetaOk,
      rentasMetaOk,
      bienesRaicesMetaOk,
      allOk:
        categoryOk &&
        titleOk &&
        descOk &&
        cityOk &&
        priceOk &&
        imagesOk &&
        contactOk &&
        phoneOk &&
        emailOk &&
        enVentaMetaOk &&
        rentasMetaOk &&
        bienesRaicesMetaOk,
    };
  }, [enVentaSnapshot]);

  /** BR private: type-aware copy profile for placeholders and helpers. Uses bienesRaicesSubcategoria or derives from enVentaPropertyType. */
  const brPrivateCopyProfile = useMemo(() => {
    if (categoryFromUrl !== "bienes-raices" || (details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "privado") return null;
    const subcat = (details.bienesRaicesSubcategoria ?? "").trim() || getBrSubcategoriaFromPropertyType(details.enVentaPropertyType ?? "");
    const key = (["residencial", "condos-townhomes", "multifamiliar", "terrenos", "comercial", "industrial"] as const).includes(subcat as BrSubcategoriaKey) ? subcat as BrSubcategoriaKey : "residencial";
    return BR_PRIVATE_COPY_PROFILES[key];
  }, [categoryFromUrl, details.bienesRaicesBranch, details.bienesRaicesSubcategoria, details.enVentaPropertyType]);

  const basicsOk =
    categoryFromUrl === "en-venta"
      ? requirements.enVentaMetaOk &&
        requirements.titleOk &&
        requirements.descOk &&
        requirements.priceOk &&
        requirements.cityOk
      : categoryFromUrl === "rentas"
        ? requirements.rentasMetaOk &&
          requirements.titleOk &&
          requirements.descOk &&
          requirements.priceOk &&
          requirements.cityOk
        : categoryFromUrl === "bienes-raices"
          ? requirements.bienesRaicesMetaOk &&
            requirements.titleOk &&
            requirements.descOk &&
            requirements.priceOk &&
            requirements.cityOk
          : requirements.titleOk && requirements.descOk && requirements.priceOk && requirements.cityOk;

  /** First invalid basics section for scroll-into-view after failed “Siguiente”. */
  const getFirstBasicsInvalidElementId = (): string | null => {
    if (basicsOk) return null;
    if (categoryFromUrl === "en-venta") {
      if (!requirements.enVentaMetaOk) return "publish-basics-enVenta-meta";
      if (!requirements.titleOk) return "publish-basics-title";
      if (!requirements.descOk) return "publish-basics-desc";
      if (!requirements.priceOk) return "publish-basics-price";
      if (!requirements.cityOk) return "publish-basics-city";
      return null;
    }
    if (categoryFromUrl === "rentas") {
      if (!requirements.rentasMetaOk) return "publish-basics-rentas-meta";
      if (!requirements.titleOk) return "publish-basics-title";
      if (!requirements.descOk) return "publish-basics-desc";
      if (!requirements.priceOk) return "publish-basics-price";
      if (!requirements.cityOk) return "publish-basics-city";
      return null;
    }
    if (categoryFromUrl === "bienes-raices") {
      if (!requirements.bienesRaicesMetaOk) return "publish-basics-br-meta";
      if (!requirements.titleOk) return "publish-basics-title";
      if (!requirements.descOk) return "publish-basics-desc";
      if (!requirements.priceOk) return "publish-basics-price";
      if (!requirements.cityOk) return "publish-basics-city";
      return null;
    }
    if (!requirements.titleOk) return "publish-basics-title";
    if (!requirements.descOk) return "publish-basics-desc";
    if (!requirements.priceOk) return "publish-basics-price";
    if (!requirements.cityOk) return "publish-basics-city";
    return null;
  };

  const requirementItems = useMemo(() => {
    const items: Array<{ key: string; label: string; ok: boolean; step: PublishStep }> = [
      {
        key: "category",
        label: lang === "es" ? "Categoría" : "Category",
        ok: requirements.categoryOk,
        step: "category",
      },
      {
        key: "title",
        label: lang === "es" ? "Título" : "Title",
        ok: requirements.titleOk,
        step: "basics",
      },
      {
        key: "desc",
        label: lang === "es" ? "Descripción" : "Description",
        ok: requirements.descOk,
        step: "basics",
      },
      {
        key: "price",
        label:
          categoryFromUrl === "rentas"
            ? lang === "es"
              ? "Renta mensual"
              : "Monthly rent"
            : lang === "es"
              ? (isFree ? "Gratis" : "Precio")
              : (isFree ? "Free" : "Price"),
        ok: requirements.priceOk,
        step: "basics",
      },
      {
        key: "city",
        label: lang === "es" ? "Ciudad válida" : "Valid city",
        ok: requirements.cityOk,
        step: "basics",
      },
      ...(categoryFromUrl === "en-venta"
        ? [
            {
              key: "itemDetails" as const,
              label: lang === "es" ? "Subcategoría, artículo y condición" : "Subcategory, item type and condition",
              ok: requirements.enVentaMetaOk,
              step: "basics" as const,
            },
          ]
        : categoryFromUrl === "rentas"
          ? [
              {
                key: "rentasDetails" as const,
                label:
                  lang === "es"
                    ? "Subcategoría, tipo, rama, fecha disponible" + (details.rentasBranch === "negocio" ? ", plan y nombre del negocio" : "")
                    : "Subcategory, type, branch, availability" + (details.rentasBranch === "negocio" ? ", plan & business name" : ""),
                ok: requirements.rentasMetaOk,
                step: "basics" as const,
              },
            ]
          : categoryFromUrl === "bienes-raices"
            ? [
                {
                  key: "bienesRaicesSubcat" as const,
                  label: lang === "es"
                    ? "Datos de propiedad (tipo, recámaras, baños, pies², descripción)"
                    : "Property data (type, beds, baths, sq ft, description)",
                  ok: requirements.bienesRaicesMetaOk,
                  step: "basics" as const,
                },
              ]
            : []),
      {
        key: "images",
        label: lang === "es" ? "1+ foto" : "1+ photo",
        ok: requirements.imagesOk,
        step: "media",
      },
      // Contact: show method-specific requirement(s) so seller sees exactly what to fix
      ...(contactMethod === "both"
        ? [
            { key: "contactPhone", label: lang === "es" ? "Teléfono válido (10 dígitos)" : "Valid phone (10 digits)", ok: requirements.phoneOk, step: "media" as PublishStep },
            { key: "contactEmail", label: lang === "es" ? "Email válido" : "Valid email", ok: requirements.emailOk, step: "media" as PublishStep },
          ]
        : contactMethod === "phone"
          ? [{ key: "contact", label: lang === "es" ? "Contacto válido (teléfono)" : "Valid contact (phone)", ok: requirements.phoneOk, step: "media" as PublishStep }]
          : [{ key: "contact", label: lang === "es" ? "Contacto válido (email)" : "Valid contact (email)", ok: requirements.emailOk, step: "media" as PublishStep }]),
    ];
    return items;
  }, [requirements, lang, isFree, contactMethod, categoryFromUrl, details.rentasBranch]);

  const missingRequirementsText = useMemo(() => {
    const missing = requirementItems.filter((i) => !i.ok).map((i) => i.label);
    if (missing.length === 0) return "";
    const prefix = lang === "es" ? "Falta:" : "Missing:";
    return `${prefix} ${missing.join(" · ")}`;
  }, [requirementItems, lang]);

  const missingBasicsRequirementsText = useMemo(() => {
    const missing = requirementItems.filter((i) => i.step === "basics" && !i.ok).map((i) => i.label);
    if (missing.length === 0) return "";
    const prefix = lang === "es" ? "Falta:" : "Missing:";
    return `${prefix} ${missing.join(" · ")}`;
  }, [requirementItems, lang]);

  const garage = useMemo(() => {
    if (category !== "en-venta") {
      return {
        applicable: false,
        active: false,
        eligibleToActivate: false,
        effectiveLimit: null as number | null,
        remaining: null as number | null,
        cooldownDaysLeft: null as number | null,
      };
    }

    const now = new Date();
    const expD = parseIsoMaybe(garageExpiresAt);
    const lastD = parseIsoMaybe(garageLastUsedAt);

    const active = !!(expD && expD.getTime() > now.getTime());
    const cooldownDaysLeft =
      lastD && Number.isFinite(lastD.getTime())
        ? Math.max(0, GARAGE_COOLDOWN_DAYS - daysBetween(lastD, now))
        : 0;

    const effectiveLimit = FREE_EN_VENTA_LIMIT + (active ? GARAGE_EXTRA : 0);

    const remaining =
      typeof enVentaActiveCount === "number"
        ? Math.max(0, effectiveLimit - enVentaActiveCount)
        : null;

    const eligibleToActivate =
      !isPro && !active && cooldownDaysLeft === 0 && typeof enVentaActiveCount === "number" && enVentaActiveCount >= FREE_EN_VENTA_LIMIT;

    return {
      applicable: !isPro,
      active,
      eligibleToActivate,
      effectiveLimit,
      remaining,
      cooldownDaysLeft,
    };
  }, [
    category,
    isPro,
    enVentaActiveCount,
    garageExpiresAt,
    garageLastUsedAt,
    FREE_EN_VENTA_LIMIT,
    GARAGE_EXTRA,
    GARAGE_COOLDOWN_DAYS,
  ]);


  function deleteDraft() {
    if (draftId && userId) {
      try {
        const supabase = createSupabaseBrowserClient();
        void deleteDraftInDb(supabase, draftId, userId);
      } catch {
        // ignore
      }
      setDraftId(null);
      clearStoredDraftId(userId);
    }
    try {
      localStorage.removeItem(draftKey);
      sessionStorage.removeItem(draftKey + "_images");
    } catch {
      // ignore
    }
  }

  
async function inspectAndThumbVideo(file: File, index: number) {
  setVideoErrors((prev) => {
    const n: [string, string] = [...prev];
    n[index] = "";
    return n;
  });
  setVideoThumbBlobs((prev) => {
    const n: [Blob | null, Blob | null] = [...prev];
    n[index] = null;
    return n;
  });

  if (!file.type.startsWith("video/")) {
    setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
    setVideoErrors((prev) => {
      const n: [string, string] = [...prev];
      n[index] = lang === "es" ? "Selecciona un archivo de video." : "Please select a video file.";
      return n;
    });
    return;
  }

  const maxBytes = 75 * 1024 * 1024; // ~75MB
  if (file.size > maxBytes) {
    setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
    setVideoErrors((prev) => {
      const n: [string, string] = [...prev];
      n[index] = lang === "es"
        ? "El video es muy grande. Usa un clip más corto o comprimido (máx ~75MB)."
        : "Video file is too large. Please use a shorter/compressed clip (max ~75MB).";
      return n;
    });
    return;
  }

  const url = URL.createObjectURL(file);
  try {
    const info = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;
      const cleanup = () => { v.removeAttribute("src"); try { v.load(); } catch {} };
      v.onloadedmetadata = () => {
        const duration = Number(v.duration || 0);
        const width = Number((v as any).videoWidth || 0);
        const height = Number((v as any).videoHeight || 0);
        cleanup();
        resolve({ duration, width, height });
      };
      v.onerror = () => { cleanup(); reject(new Error("metadata")); };
    });

    if (info.duration > 15.2) {
      setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
      setVideoErrors((prev) => {
        const n: [string, string] = [...prev];
        n[index] = lang === "es" ? "El video debe ser de 15 segundos o menos." : "Video must be 15 seconds or less.";
        return n;
      });
      return;
    }
    if (info.width > 1920 || info.height > 1080) {
      setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
      setVideoErrors((prev) => {
        const n: [string, string] = [...prev];
        n[index] = lang === "es" ? "El video debe ser 1080p o menos (1920×1080)." : "Video must be 1080p or less (1920×1080).";
        return n;
      });
      return;
    }

    const thumb = await new Promise<Blob | null>((resolve) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.src = url;
      const done = (b: Blob | null) => { v.removeAttribute("src"); try { v.load(); } catch {}; resolve(b); };
      v.onloadeddata = () => {
        const t = Math.min(0.5, Math.max(0, (v.duration || 1) * 0.1));
        try { v.currentTime = t; } catch { done(null); }
      };
      v.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = (v as any).videoWidth || 640;
          canvas.height = (v as any).videoHeight || 360;
          const ctx = canvas.getContext("2d");
          if (!ctx) return done(null);
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((b) => done(b), "image/jpeg", 0.82);
        } catch { done(null); }
      };
      v.onerror = () => done(null);
    });

    setVideoThumbBlobs((prev) => { const n: [Blob | null, Blob | null] = [...prev]; n[index] = thumb; return n; });
  } catch {
    setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[index] = null; return n; });
    setVideoErrors((prev) => {
      const n: [string, string] = [...prev];
      n[index] = lang === "es" ? "No se pudo leer el video. Prueba otro archivo (máx 15s, 1080p, ~75MB)." : "Could not read video. Try another file (max 15s, 1080p, ~75MB).";
      return n;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
async function publish() {
    setPublishError("");
    setPublishedId("");

    if (!rulesConfirmed) {
      setPublishError(lang === "es" ? "Debes confirmar que tu anuncio cumple con las reglas de la comunidad." : "You must confirm that your listing complies with the community rules.");
      return;
    }
    if (!requirements.allOk) {
      setPublishError(`${copy.needReqs}${missingRequirementsText ? " " + missingRequirementsText : ""}`);
      return;
    }

    if (!enVentaSnapshot.cityCanonical) {
      setPublishError(lang === "es" ? "Selecciona una ciudad válida del Norte de California." : "Select a valid city in Northern California.");
      return;
    }

    let supabase: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      supabase = createSupabaseBrowserClient();
    } catch (e: any) {
      setPublishError((e?.message as string) || "Supabase config error");
      return;
    }

    setPublishing(true);
    try {
      // Garage Mode enforcement (Free-only, En Venta only).
      if (!isPro && categoryFromUrl === "en-venta" && typeof enVentaActiveCount === "number") {
        const now = new Date();
        const expD = parseIsoMaybe(garageExpiresAt);
        const lastD = parseIsoMaybe(garageLastUsedAt);

        const garageIsActive = !!(expD && expD.getTime() > now.getTime());
        const cooldownLeft =
          lastD && Number.isFinite(lastD.getTime())
            ? Math.max(0, GARAGE_COOLDOWN_DAYS - daysBetween(lastD, now))
            : 0;

        const effectiveLimit = FREE_EN_VENTA_LIMIT + (garageIsActive ? GARAGE_EXTRA : 0);

        // Hard stop if user is already at/over the maximum possible during the window.
        if (enVentaActiveCount >= effectiveLimit) {
          const expText = garageIsActive && expD ? expD.toLocaleDateString(lang === "es" ? "es-US" : "en-US") : "";
          const msg =
            lang === "es"
              ? garageIsActive
                ? `Has alcanzado tu límite actual de En Venta (${effectiveLimit}). Tu Modo Garaje está activo hasta ${expText}. Marca anuncios como vendidos o espera, o mejora a LEONIX Pro.`
                : `Has alcanzado tu límite de En Venta (${FREE_EN_VENTA_LIMIT}). Para publicar más, mejora a LEONIX Pro.`
              : garageIsActive
                ? `You’ve reached your current For Sale limit (${effectiveLimit}). Garage Mode is active until ${expText}. Mark items sold or wait, or upgrade to LEONIX Pro.`
                : `You’ve reached your For Sale limit (${FREE_EN_VENTA_LIMIT}). To post more, upgrade to LEONIX Pro.`;
          setPublishError(msg);
          return;
        }

        // If user is at/over the free limit and Garage Mode is not active, try to activate once per 30 days.
        if (!garageIsActive && enVentaActiveCount >= FREE_EN_VENTA_LIMIT) {
          if (cooldownLeft > 0) {
            const msg =
              lang === "es"
                ? `Ya usaste el Modo Garaje recientemente. Podrás usarlo de nuevo en ${cooldownLeft} día(s). Mientras tanto, mejora a LEONIX Pro para publicar sin límites de Free.`
                : `You’ve used Garage Mode recently. You can use it again in ${cooldownLeft} day(s). Meanwhile, upgrade to LEONIX Pro to post beyond Free limits.`;
            setPublishError(msg);
            return;
          }

          // Activate Garage Mode now (7-day window, +4 listings). Store in user_metadata to persist.
          const newExpires = isoPlusDays(GARAGE_WINDOW_DAYS);
          const newMeta: any = {
            ...(await supabase.auth.getUser()).data.user?.user_metadata,
            garage_mode_en_venta: {
              lastUsedAt: now.toISOString(),
              expiresAt: newExpires,
            },
          };

          const up = await supabase.auth.updateUser({ data: newMeta });
          if (up.error) {
            // If metadata update fails, we don't risk breaking publish; we just continue with Free rules.
            console.warn("garage mode metadata update failed", up.error.message);
          } else {
            setGarageLastUsedAt(now.toISOString());
            setGarageExpiresAt(newExpires);
            setGarageActive(true);
          }
        }
      }

      const snap = enVentaSnapshot;
      const finalDescription = (snap.description + buildDetailsAppendix(snap.category, snap.lang, snap.details, snap.cityCanonical ?? snap.city)).trim();
      const rentasBranch = (snap.details.rentasBranch ?? "").trim();
      const bienesRaicesBranch = (snap.details.bienesRaicesBranch ?? "").trim().toLowerCase();
      const isRentasNegocio = snap.category === "rentas" && rentasBranch === "negocio";
      const isBienesRaicesNegocio = snap.category === "bienes-raices" && bienesRaicesBranch === "negocio";
      // Insert from same normalized snapshot as preview/validation (DB field names unchanged).
      const mediaPhoneDigits = getPhoneDigits(snap.contactPhone);
      const officePhoneDigits = (snap.details.negocioTelOficina ?? "").replace(/\D/g, "").slice(0, 10);
      const resolvedPhoneForInsert =
        mediaPhoneDigits.length === 10 ? mediaPhoneDigits : isBienesRaicesNegocio && officePhoneDigits.length === 10 ? officePhoneDigits : null;
      const negocioEmailTrim = (snap.details.negocioEmail ?? "").trim();
      const resolvedEmailForInsert =
        snap.contactEmail.trim() || (isBienesRaicesNegocio && /.+@.+\..+/.test(negocioEmailTrim) ? negocioEmailTrim : "");
      const insertPayload: any = {
        owner_id: userId,
        title: snap.title,
        description: finalDescription,
        city: snap.cityCanonical!,
        category: snap.category,
        price: snap.isFree ? 0 : Number((snap.priceRaw ?? "").replace(/[^0-9.]/g, "")) || 0,
        is_free: snap.isFree,
        contact_phone: snap.contactMethod === "email" ? null : resolvedPhoneForInsert,
        contact_email: snap.contactMethod === "phone" ? null : resolvedEmailForInsert || null,
        status: "active",
        is_published: true,
        detail_pairs: Array.isArray(snap.detailPairs) && snap.detailPairs.length > 0 ? snap.detailPairs : null,
      };
      if (snap.category === "rentas") {
        insertPayload.seller_type = rentasBranch === "negocio" ? "business" : "personal";
        if (isRentasNegocio) {
          const tier = (snap.details.rentasTier ?? "").trim();
          insertPayload.rentas_tier = (tier === "business_plus" || tier === "negocio") ? "plus" : "standard";
          insertPayload.business_name =
            (snap.details.negocioNombre ?? "").trim() || (snap.details.enVentaBusinessName ?? "").trim() || null;
          const businessMeta: Record<string, string> = {};
          for (const k of BUSINESS_META_KEYS) {
            let v = (snap.details[k] ?? "").trim();
            if (!v && k === "negocioNombre") v = (snap.details.enVentaBusinessName ?? "").trim();
            if (!v && k === "negocioAgente") v = (snap.details.enVentaAgentName ?? "").trim();
            if (v) businessMeta[k] = v;
          }
          const mergedRedes = buildNegocioRedesPayload(snap.details as Record<string, string | undefined>);
          if (mergedRedes.trim()) {
            businessMeta.negocioRedes = mergedRedes.trim();
          }
          if (!businessMeta.negocioEmail?.trim()) {
            const ce = (snap.contactEmail ?? "").trim();
            if (/.+@.+\..+/.test(ce)) businessMeta.negocioEmail = ce;
          }
          if (Object.keys(businessMeta).length > 0) {
            insertPayload.business_meta = JSON.stringify(businessMeta);
          }
        }
      }
      if (snap.category === "bienes-raices") {
        insertPayload.seller_type = bienesRaicesBranch === "negocio" ? "business" : "personal";
        if (isBienesRaicesNegocio) {
          insertPayload.rentas_tier = "negocio";
          insertPayload.business_name =
            (snap.details.negocioNombre ?? "").trim() || (snap.details.enVentaBusinessName ?? "").trim() || null;
          const businessMeta: Record<string, string> = {};
          for (const k of BUSINESS_META_KEYS) {
            let v = (snap.details[k] ?? "").trim();
            if (!v && k === "negocioNombre") v = (snap.details.enVentaBusinessName ?? "").trim();
            if (!v && k === "negocioAgente") v = (snap.details.enVentaAgentName ?? "").trim();
            if (v) businessMeta[k] = v;
          }
          const mergedRedesBr = buildNegocioRedesPayload(snap.details as Record<string, string | undefined>);
          if (mergedRedesBr.trim()) {
            businessMeta.negocioRedes = mergedRedesBr.trim();
          }
          if (!businessMeta.negocioEmail?.trim()) {
            const ce = (snap.contactEmail ?? "").trim();
            if (/.+@.+\..+/.test(ce)) businessMeta.negocioEmail = ce;
          }
          if (Object.keys(businessMeta).length > 0) {
            insertPayload.business_meta = JSON.stringify(businessMeta);
          }
        }
      }

      const { data, error } = await supabase
        .from("listings")
        .insert([insertPayload])
        .select("id")
        .single();

      if (error) {
        setPublishError(error.message);
        return;
      }

      const id = (data as any)?.id as string | undefined;
      if (!id) {
        setPublishError(lang === "es" ? "Publicado, pero no se recibió ID." : "Published, but no ID returned.");
        return;
      }

      let descriptionForUpdate = finalDescription;

      // Upload photos (required). Store URLs in description to avoid schema guessing.
      const photoUrls: string[] = [];
      try {
        const basePath = `${userId}/${id}/photos`;
        setUploadProgress({ current: 0, total: images.length });
        for (let i = 0; i < images.length; i++) {
          const f = images[i];
          const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
          const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "jpg";
          const path = `${basePath}/${String(i + 1).padStart(2, "0")}.${safeExt}`;

          const up = await supabase.storage
            .from("listing-images")
            .upload(path, f, { upsert: true, contentType: f.type || "image/jpeg" });

          if (up.error) {
            console.warn("photo upload failed", up.error.message);
            continue;
          }
          const url = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;
          if (url) photoUrls.push(url);
          setUploadProgress({ current: i + 1, total: images.length });
        }

        if (photoUrls.length) {
          const marker =
            `[LEONIX_IMAGES]\n` + photoUrls.map((u) => `url=${u}`).join("\n") + `\n[/LEONIX_IMAGES]`;

          const photosAppendix =
            lang === "es"
              ? `\n\n— Fotos —\n${photoUrls.join("\n")}\n${marker}\n`
              : `\n\n— Photos —\n${photoUrls.join("\n")}\n${marker}\n`;

          descriptionForUpdate = (descriptionForUpdate + photosAppendix).trim();

          await supabase.from("listings").update({ description: descriptionForUpdate }).eq("id", id);
        }
      } catch (e: any) {
        // If photo upload fails, don't crash the publish flow; listing is already live.
        console.warn("photo upload error", e?.message || e);
      } finally {
        setUploadProgress(null);
      }
      // Optimistic local count update for Free En Venta caps (keeps UI in sync without extra fetch).
      if (!isPro && categoryFromUrl === "en-venta" && typeof enVentaActiveCount === "number") {
        setEnVentaActiveCount((prev) => (typeof prev === "number" ? prev + 1 : prev));
      }


// Pro video upload (optional, Pro-only). BR negocio: 1 video; others: up to 2.
const videoLimit = categoryFromUrl === "bienes-raices" ? 1 : 2;
for (let vi = 0; vi < videoLimit; vi++) {
  const videoFile = videoFiles[vi];
  const videoThumbBlob = videoThumbBlobs[vi];
  const videoError = videoErrors[vi];
  if (!isPro || !videoFile || videoError) continue;
  try {
    const basePath = vi === 0 ? `${userId}/${id}/video` : `${userId}/${id}/video2`;
    const ext = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
    const videoPath = `${basePath}/clip.${/^[a-z0-9]+$/.test(ext) ? ext : "mp4"}`;
    const up1 = await supabase.storage
      .from("listing-images")
      .upload(videoPath, videoFile, { upsert: true, contentType: videoFile.type });

    if (up1.error) throw up1.error;

    const videoUrl = supabase.storage.from("listing-images").getPublicUrl(videoPath).data.publicUrl;
    let thumbUrl: string | null = null;
    if (videoThumbBlob) {
      const thumbPath = `${basePath}/thumb.jpg`;
      const up2 = await supabase.storage
        .from("listing-images")
        .upload(thumbPath, videoThumbBlob, { upsert: true, contentType: "image/jpeg" });
      if (!up2.error) thumbUrl = supabase.storage.from("listing-images").getPublicUrl(thumbPath).data.publicUrl;
    }

    const tag = vi === 0 ? "LEONIX_PRO_VIDEO" : "LEONIX_PRO_VIDEO_2";
    const marker = `[${tag}]\nurl=${videoUrl}\n` + (thumbUrl ? `thumb=${thumbUrl}\n` : "") + `[/${tag}]`;
    const videoAppendix =
      lang === "es"
        ? `\n\n— Video (Pro) ${vi + 1} —\nVideo: ${videoUrl}${thumbUrl ? `\nMiniatura: ${thumbUrl}` : ""}\n${marker}\n`
        : `\n\n— Video (Pro) ${vi + 1} —\nVideo: ${videoUrl}${thumbUrl ? `\nThumbnail: ${thumbUrl}` : ""}\n${marker}\n`;

    descriptionForUpdate = (descriptionForUpdate + videoAppendix).trim();
    await supabase.from("listings").update({ description: descriptionForUpdate }).eq("id", id);
  } catch (e: any) {
    console.warn(`video ${vi + 1} upload failed`, e?.message || e);
  }
}

      setPublishedId(id);
      setShowSuccessModal(true);
      deleteDraft();
    } catch (e: any) {
      setPublishError((e?.message as string) || "Unknown error");
    } finally {
      setPublishing(false);
    }
  }

  // Lazy require to avoid hard-coupling to repo types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ListingCard: any = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("../../components/ListingCard").default;
    } catch {
      return null;
    }
  }, []);

  // Preview UI strings derived from snapshot so card/preview stay in sync.
  const previewTitle = enVentaSnapshot.title || (lang === "es" ? "(Sin título)" : "(No title)");
  const previewDescription = enVentaSnapshot.description || (lang === "es" ? "(Sin descripción)" : "(No description)");
  const previewPrice = enVentaSnapshot.priceLabel;
  const previewCity = (enVentaSnapshot.cityCanonical ?? enVentaSnapshot.city) || (lang === "es" ? "(Ciudad)" : "(City)");
  const previewPosted = copy.todayLabel;
  const COMPACT_TEASER_MAX_LEN = 80;
  const previewShortDescription = getShortPreviewText(enVentaSnapshot.description, COMPACT_TEASER_MAX_LEN);
  const previewPhone = enVentaSnapshot.contactMethod === "email" ? "" : formatPhoneDisplay(enVentaSnapshot.contactPhone);
  const previewEmail = enVentaSnapshot.contactMethod === "phone" ? "" : enVentaSnapshot.contactEmail;
  const previewDetailPairs = enVentaSnapshot.detailPairs;
  const compactBrPrivateDetailPairs = useMemo(() => {
    if (categoryFromUrl !== "bienes-raices" || !isBienesRaicesPrivado || !previewDetailPairs.length) return [];
    const order = lang === "es"
      ? ["Tipo de propiedad", "Dirección", "Recámaras", "Baños", "Pies²"]
      : ["Property type", "Address", "Bedrooms", "Bathrooms", "Sq ft"];
    const byLabel = new Map(previewDetailPairs.map((p) => [p.label, p]));
    return order.map((label) => byLabel.get(label)).filter(Boolean) as Array<{ label: string; value: string }>;
  }, [categoryFromUrl, isBienesRaicesPrivado, previewDetailPairs, lang]);
  const previewCategoryLabel = enVentaSnapshot.category ? categoryConfig[enVentaSnapshot.category as CategoryKey]?.label[lang] ?? "" : "";
  const previewContactMethod = enVentaSnapshot.contactMethod;
  const coverImage = enVentaSnapshot.images[0] ?? null;
  const extraPreviewImages = enVentaSnapshot.images.slice(1, 5);

  /** Current publish URL (path + query) so `/agente/[id]` can link back to this draft/preview flow. */
  const previewPublishReturnPath = useMemo(() => {
    const q = searchParams?.toString() ?? "";
    return `${pathname ?? ""}${q ? `?${q}` : ""}`;
  }, [pathname, searchParams]);

  // ListingData for in-page full preview modal (same shape as ListingView expects; uses current filePreviews so no navigation).
  const fullPreviewListingData = useMemo((): ListingData => {
    const snap = enVentaSnapshot;
    const imgs = snap.images?.length ? snap.images : ["/logo.png"];
    const base: ListingData = {
      title: snap.title || (lang === "es" ? "(Sin título)" : "(No title)"),
      priceLabel: snap.priceLabel,
      city: (snap.cityCanonical ?? snap.city) || (lang === "es" ? "Ciudad" : "City"),
      description: snap.description || (lang === "es" ? "(Sin descripción)" : "(No description)"),
      todayLabel: copy.todayLabel,
      images: imgs,
      detailPairs: snap.detailPairs ?? [],
      contactMethod: snap.contactMethod,
      contactPhone: formatPhoneDisplay(snap.contactPhone),
      contactEmail: snap.contactEmail,
      isPro: snap.isPro,
      proVideoThumbUrl: snap.proVideoThumbUrl ?? null,
      proVideoUrl: snap.proVideoUrl ?? null,
      proVideoThumbUrl2: snap.proVideoThumbUrl2 ?? null,
      proVideoUrl2: snap.proVideoUrl2 ?? null,
      lang,
      sellerName: sellerDisplayName || undefined,
      categoryLabel: previewCategoryLabel || undefined,
      approximateArea: category === "rentas" && snap.details?.zonaDireccion?.trim() ? snap.details.zonaDireccion.trim() : undefined,
      ownerId: userId?.trim() ? userId.trim() : undefined,
    };
    // BR negocio: add business rail so full preview matches open card (company name, agent, logo, photo, phone, website, socials, availability).
    if (category === "bienes-raices" && (snap.details?.bienesRaicesBranch ?? "").trim() === "negocio") {
      const d = snap.details;
      let availabilityRows: Array<{ title: string; price: string; size: string; ctaText?: string; ctaLink?: string }> = [];
      try {
        const raw = (d.negocioDisponibilidadPrecios ?? "").trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) availabilityRows = parsed;
        }
      } catch { /* ignore */ }
      base.category = "bienes-raices";
      base.businessRailTier = "business_plus";
      const phoneFmt = (d.negocioTelOficina ?? "").trim();
      const extFmt = (d.negocioTelExtension ?? "").trim();
      const officeDisplay =
        phoneFmt ? (extFmt ? `${phoneFmt} · Ext. ${extFmt}` : phoneFmt) : "";
      const mergedRedesPreview = buildNegocioRedesPayload(d as Record<string, string | undefined>);
      const rawSocialsPreview = mergedRedesPreview.trim() || (d.negocioRedes ?? "").trim();
      base.businessRail = {
        name: (d.negocioNombre ?? "").trim() || (lang === "es" ? "Negocio" : "Business"),
        agent: (d.negocioAgente ?? "").trim(),
        role: (d.negocioCargo ?? "").trim(),
        agentLicense: (d.negocioLicencia ?? "").trim() || undefined,
        officePhone: officeDisplay,
        agentEmail: (d.negocioEmail ?? "").trim() || null,
        website: (d.negocioSitioWeb ?? "").trim() || null,
        socialLinks: [],
        rawSocials: rawSocialsPreview,
        logoUrl: (d.negocioLogoUrl ?? "").trim() || null,
        agentPhotoUrl: (d.negocioFotoAgenteUrl ?? "").trim() || null,
        languages: (d.negocioIdiomas ?? "").trim(),
        hours: (d.negocioHorario ?? "").trim(),
        // Same merge as negocio media step UI (negocio field + legacy en-venta URL).
        virtualTourUrl: (d.negocioRecorridoVirtual ?? d.enVentaVirtualTourUrl ?? "").trim() || null,
        plusMoreListings: (d.negocioPlusMasAnuncios ?? "") === "si",
        businessDescription: (d.negocioDescripcion ?? "").trim() || undefined,
        availabilityRows: availabilityRows.length > 0 ? availabilityRows : undefined,
      };

      // BR Negocio: floorplan + tour + Pro video feed BienesRaicesPreviewListing’s 2×2 utility tiles (main image stays left).
      base.floorPlanUrl = (d.negocioFloorPlanUrl ?? "").trim() || null;
      base.agentProfileReturnUrl = previewPublishReturnPath;
    }
    return base;
  }, [enVentaSnapshot, lang, copy.todayLabel, previewCategoryLabel, sellerDisplayName, category, userId, previewPublishReturnPath]);

  // Open in-page full preview modal. No route change, no auth round-trip. Preserves draft and form state.
  const openFullPreview = useCallback(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[publish preview] openFullPreview called", { isBienesRaicesPrivado, draftId, step });
    }
    if (userId && typeof performDbSave === "function") {
      void performDbSave();
    }
    fullPreviewModalOpenRef.current = true;
    if (isRentasPrivado) {
      setFullPreviewVariant("pro");
      setFullPreviewRulesConfirmed(false);
      setFullPreviewInfoConfirmed(false);
      setShowFullPreviewModal(true);
    } else if (isBienesRaicesNegocio) {
      setFullPreviewVariant("pro");
      setFullPreviewRulesConfirmed(false);
      setFullPreviewInfoConfirmed(false);
      setShowFullPreviewModal(true);
    } else if (isBienesRaicesPrivado) {
      setFullPreviewVariant("pro");
      setFullPreviewRulesConfirmed(false);
      setFullPreviewInfoConfirmed(false);
      setShowFullPreviewModal(true);
    } else {
      setFullPreviewVariant("free");
      setFullPreviewRulesConfirmed(false);
      setFullPreviewInfoConfirmed(false);
      setShowFullPreviewModal(true);
    }
  }, [isRentasPrivado, isBienesRaicesNegocio, isBienesRaicesPrivado, userId, performDbSave, draftId, step]);

  const handleSharePreview = useCallback(() => {
    if (typeof window === "undefined") return Promise.resolve();
    const url = window.location.href;
    const shareTitle = (title?.trim() || (lang === "es" ? "Vista previa" : "Preview")) + (lang === "es" ? " — Leonix" : " — Leonix");
    if (navigator.share) {
      return navigator.share({ title: shareTitle, url }).catch(() => navigator.clipboard?.writeText(url) ?? Promise.resolve());
    }
    return navigator.clipboard?.writeText(url) ?? Promise.resolve();
  }, [title, lang]);

  // Open same preview in Pro mode (same data; Pro badge styling). Used for En Venta Pro comparison.
  const openProPreview = () => {
    setFullPreviewVariant("pro");
    setFullPreviewRulesConfirmed(false);
    setFullPreviewInfoConfirmed(false);
    setShowFullPreviewModal(true);
  };

  const closeFullPreviewModal = useCallback(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[publish preview] closeFullPreviewModal called");
    }
    fullPreviewModalOpenRef.current = false;
    setShowFullPreviewModal(false);
    setProHighlightId(null);
  }, []);

  const handleFullPreviewConfirmPublish = () => {
    if (!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed) return;
    setRulesConfirmedPersisted(true);
    setPreviewViewed(true);
    setShowFullPreviewModal(false);
    setTimeout(() => publish(), 600);
  };

  const basicsShowValidation = publishNextAttempted.basics ?? false;
  const categoryShowValidation = publishNextAttempted.category ?? false;

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16 [overflow-anchor:auto]">
      <div className="max-w-4xl mx-auto px-6" style={{ overflowAnchor: "none" } as React.CSSProperties}>
        <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#111111] text-center">
              {copy.title}
            </h1>
            <p className="text-[#111111] text-center max-w-2xl mx-auto">
              {checking ? copy.checking : copy.subtitle}
            </p>
            {authError && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {authError}
              </div>
            )}
            {recoveredDraftMessage && (
              <p className="mt-2 text-sm text-[#111111]/70" role="status">
                {recoveredDraftMessage}
              </p>
            )}
          </div>

          {!checking && signedIn && showFormPlaceholder && (
            <div className="mt-6 rounded-2xl border border-black/10 bg-[#F5F5F5] p-8 text-center text-[#111111]">
              <p className="text-lg font-medium">
                {lang === "es" ? "Formulario disponible próximamente." : "Form available soon."}
              </p>
              <Link
                href={`/clasificados/publicar/en-venta${lang ? `?lang=${lang}` : ""}`}
                className="mt-4 inline-block rounded-xl bg-[#A98C2A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f7a24]"
              >
                {lang === "es" ? "Publicar en En Venta" : "Post in For Sale"}
              </Link>
            </div>
          )}

          {!checking && signedIn && !showFormPlaceholder && (
            <>
              {/* Draft restore: do not auto-load; let user choose */}
              {showDraftRestoreModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="draft-restore-title">
                  <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 max-w-md w-full shadow-xl">
                    <h2 id="draft-restore-title" className="text-xl font-bold text-[#111111]">{copy.draftInProgress}</h2>
                    <p className="mt-2 text-sm text-[#111111]/80">
                      {lang === "es"
                        ? "Puedes continuar con lo guardado, crear otro anuncio nuevo (esta aplicación se conserva) o eliminar esta aplicación."
                        : "You can continue with saved progress, create a separate new ad (this application is kept), or delete this application."}
                    </p>
                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleContinueDraft}
                        className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8f7a24]"
                      >
                        {copy.continueDraft}
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateNewAd}
                        className="w-full rounded-xl border border-[#111111]/30 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8]"
                      >
                        {copy.createNewAd}
                      </button>
                      <p className="text-xs text-[#111111]/60 px-1">{copy.createNewAdHint}</p>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCurrentDraft()}
                        className="mt-1 text-sm text-[#111111]/70 underline hover:text-[#111111]"
                      >
                        {copy.deleteCurrentApplication}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Leave confirmation when user has unsaved changes */}
              {showLeaveConfirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="leave-confirm-title">
                  <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 max-w-md w-full shadow-xl">
                    <h2 id="leave-confirm-title" className="text-xl font-bold text-[#111111]">{copy.leaveConfirmTitle}</h2>
                    <div className="mt-6 flex flex-col gap-3">
                      <button
                        type="button"
                        disabled={leaveSaving}
                        onClick={() => void handleLeaveSaveDraft()}
                        className="w-full rounded-xl bg-[#A98C2A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#8f7a24] disabled:opacity-70 disabled:cursor-wait"
                      >
                        {leaveSaving ? (lang === "es" ? "Guardando…" : "Saving…") : copy.leaveSaveDraft}
                      </button>
                      <button
                        type="button"
                        disabled={leaveSaving}
                        onClick={() => setShowLeaveConfirmModal(false)}
                        className="w-full rounded-xl border border-[#111111]/30 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8] disabled:opacity-70"
                      >
                        {copy.leaveKeepEditing}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* In-page full preview modal — no route, no sessionStorage; uses current form state and ListingView */}
              {showFullPreviewModal && (
                <div
                  className="fixed inset-0 z-[110] overflow-y-auto overscroll-y-contain bg-[#D9D9D9] text-[#111111]"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="full-preview-title"
                >
                  <h2 id="full-preview-title" className="sr-only">{copy.fullPreviewTitle}</h2>
                  <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 border-b border-black/10 bg-[#F5F5F5] shadow-sm">
                    <button
                      type="button"
                      onClick={closeFullPreviewModal}
                      className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] transition"
                    >
                      ← {copy.fullPreviewBackToEdit}
                    </button>
                    <span className="text-xs text-[#111111]/50">
                      {isRentasPrivado || isBienesRaicesPrivado
                        ? (lang === "es" ? "Vista previa" : "Preview")
                        : fullPreviewVariant === "pro"
                          ? copy.proPreviewTitle
                          : lang === "es"
                            ? "Vista previa (como la verán los compradores)"
                            : "Preview (as buyers will see it)"}
                    </span>
                  </div>
                  <section
                    className={cx(
                      "mx-auto px-4 sm:px-6 py-6 w-full min-w-0",
                      // BR negocio: same max width as main publish shell (max-w-4xl); width owned here only.
                      isBienesRaicesNegocio ? "max-w-4xl" : "max-w-screen-2xl"
                    )}
                  >
                    {isRentasPrivado ? (
                      <>
                        <RentasPrivadoPublishPreview
                          listing={fullPreviewListingData}
                          previewMode={true}
                        />
                        <div className="mt-10 pt-8 border-t border-black/10 max-w-2xl mx-auto space-y-3">
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewRulesConfirmed}
                              onChange={(e) => setFullPreviewRulesConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>
                              {copy.rulesConfirm}
                              {" "}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowRulesModal(true); }}
                                className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium"
                              >
                                {lang === "es" ? "Ver reglas" : "View rules"}
                              </button>
                            </span>
                          </label>
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewInfoConfirmed}
                              onChange={(e) => setFullPreviewInfoConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>{copy.fullPreviewInfoConfirm}</span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={closeFullPreviewModal}
                              className="flex-1 w-full max-w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
                            >
                              {copy.fullPreviewBackToEdit}
                            </button>
                            <button
                              type="button"
                              onClick={handleFullPreviewConfirmPublish}
                              disabled={!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed || publishing}
                              className={cx(
                                "flex-1 w-full max-w-full rounded-xl font-semibold py-3.5 text-center transition",
                                fullPreviewRulesConfirmed && fullPreviewInfoConfirmed && !publishing
                                  ? "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                                  : "bg-[#D9D9D9] text-[#111111]/60 cursor-not-allowed"
                              )}
                            >
                              {publishing ? copy.publishing : copy.fullPreviewConfirmPublish}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : isBienesRaicesPrivado ? (
                      <PrivateBrPreviewContent
                        lang={lang}
                        description={enVentaSnapshot.description ?? ""}
                        rawPrice={price}
                        rawTitle={title}
                        rawCity={city}
                        details={details}
                        previewDetailPairs={previewDetailPairs}
                        images={enVentaSnapshot.images ?? []}
                        sellerDisplayName={sellerDisplayName ?? ""}
                        previewPhone={previewPhone}
                        previewEmail={previewEmail}
                        formatMoneyMaybe={formatMoneyMaybe}
                        copyRulesConfirm={copy.rulesConfirm}
                        copyFullPreviewInfoConfirm={copy.fullPreviewInfoConfirm}
                        copyFullPreviewBackToEdit={copy.fullPreviewBackToEdit}
                        copyFullPreviewConfirmPublish={copy.fullPreviewConfirmPublish}
                        copyPublishing={copy.publishing}
                        fullPreviewRulesConfirmed={fullPreviewRulesConfirmed}
                        setFullPreviewRulesConfirmed={setFullPreviewRulesConfirmed}
                        fullPreviewInfoConfirmed={fullPreviewInfoConfirmed}
                        setFullPreviewInfoConfirmed={setFullPreviewInfoConfirmed}
                        setShowRulesModal={setShowRulesModal}
                        closeFullPreviewModal={closeFullPreviewModal}
                        handleFullPreviewConfirmPublish={handleFullPreviewConfirmPublish}
                        publishing={publishing}
                        onSave={userId ? performDbSave : undefined}
                        onShare={handleSharePreview}
                      />
                    ) : (
                      <ListingView
                        listing={fullPreviewListingData}
                        previewMode={true}
                        previewProUpgrade={category === "bienes-raices" ? false : fullPreviewVariant === "pro"}
                        proHighlight={category === "bienes-raices" ? null : fullPreviewVariant === "pro" ? proHighlightId : null}
                        onProBenefitClick={category === "bienes-raices" ? undefined : fullPreviewVariant === "pro" ? setProHighlightId : undefined}
                        hideProComparisonUI={category === "bienes-raices"}
                      />
                    )}
                    {(!isRentasPrivado && !isBienesRaicesPrivado && categoryFromUrl !== "bienes-raices") ||
                    (categoryFromUrl === "bienes-raices" && isBienesRaicesNegocio) ? (
                  <div className="mt-8 border-t border-black/10 bg-[#F5F5F5] p-4 safe-area-pb">
                    <div className="max-w-md mx-auto space-y-3">
                      {categoryFromUrl === "bienes-raices" ? (
                        <>
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewRulesConfirmed}
                              onChange={(e) => setFullPreviewRulesConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>
                              {copy.rulesConfirm}
                              {" "}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowRulesModal(true); }}
                                className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium"
                              >
                                {lang === "es" ? "Ver reglas" : "View rules"}
                              </button>
                            </span>
                          </label>
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewInfoConfirmed}
                              onChange={(e) => setFullPreviewInfoConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>{copy.fullPreviewInfoConfirm}</span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={closeFullPreviewModal}
                              className="flex-1 w-full max-w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
                            >
                              {copy.fullPreviewBackToEdit}
                            </button>
                            <button
                              type="button"
                              onClick={handleFullPreviewConfirmPublish}
                              disabled={!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed || publishing}
                              className={cx(
                                "flex-1 w-full max-w-full rounded-xl font-semibold py-3.5 text-center transition",
                                fullPreviewRulesConfirmed && fullPreviewInfoConfirmed && !publishing
                                  ? "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                                  : "bg-[#D9D9D9] text-[#111111]/60 cursor-not-allowed"
                              )}
                            >
                              {publishing ? copy.publishing : copy.fullPreviewConfirmPublish}
                            </button>
                          </div>
                        </>
                      ) : fullPreviewVariant === "pro" ? (
                        <>
                          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={closeFullPreviewModal}
                              className="flex-1 min-w-0 w-full sm:max-w-none rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
                            >
                              {copy.proPreviewBackToListing}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setFullPreviewVariant("free"); setProHighlightId(null); }}
                              className="flex-1 min-w-0 w-full sm:max-w-none rounded-xl border border-[#111111]/20 bg-white text-[#111111] font-semibold py-3.5 text-center hover:bg-[#F5F5F5] transition"
                            >
                              {copy.proPreviewViewFreeCta}
                            </button>
                            <Link
                              href={categoryFromUrl === "en-venta" ? `/clasificados/publicar/en-venta/pro?lang=${lang}` : `/clasificados/membresias?lang=${lang}`}
                              className="flex-1 min-w-0 w-full sm:max-w-none rounded-xl font-semibold py-3.5 text-center transition bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                            >
                              {copy.proPreviewUpgradeCta}
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewRulesConfirmed}
                              onChange={(e) => setFullPreviewRulesConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>
                              {copy.rulesConfirm}
                              {" "}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setShowRulesModal(true); }}
                                className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium"
                              >
                                {lang === "es" ? "Ver reglas" : "View rules"}
                              </button>
                            </span>
                          </label>
                          <label className="flex items-start gap-2 cursor-pointer text-sm text-[#111111]">
                            <input
                              type="checkbox"
                              checked={fullPreviewInfoConfirmed}
                              onChange={(e) => setFullPreviewInfoConfirmed(e.target.checked)}
                              className="mt-0.5 rounded border-[#C9B46A]/60 text-[#C9B46A] focus:ring-[#C9B46A]/40"
                            />
                            <span>{copy.fullPreviewInfoConfirm}</span>
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              type="button"
                              onClick={closeFullPreviewModal}
                              className="flex-1 w-full max-w-full rounded-xl border border-[#C9B46A]/55 bg-[#F5F5F5] text-[#111111] font-semibold py-3.5 text-center hover:bg-[#E8E8E8] transition"
                            >
                              {copy.fullPreviewBackToEdit}
                            </button>
                            <button
                              type="button"
                              onClick={() => setFullPreviewVariant("pro")}
                              className="flex-1 w-full max-w-full rounded-xl border border-[#111111]/20 bg-white text-[#111111] font-semibold py-3.5 text-center hover:bg-[#F5F5F5] transition"
                            >
                              {copy.proPreviewCta}
                            </button>
                            <button
                              type="button"
                              onClick={handleFullPreviewConfirmPublish}
                              disabled={!fullPreviewRulesConfirmed || !fullPreviewInfoConfirmed || publishing}
                              className={cx(
                                "flex-1 w-full max-w-full rounded-xl font-semibold py-3.5 text-center transition",
                                fullPreviewRulesConfirmed && fullPreviewInfoConfirmed && !publishing
                                  ? "bg-[#111111] text-[#F5F5F5] hover:opacity-95"
                                  : "bg-[#D9D9D9] text-[#111111]/60 cursor-not-allowed"
                              )}
                            >
                              {publishing ? copy.publishing : copy.fullPreviewConfirmPublish}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                    ) : null}
                  </section>
                </div>
              )}

              {/* In-page rules modal — no navigation, same publish state; z-[120] so it appears above full preview */}
              {showRulesModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="rules-modal-title">
                  <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl">
                    <h2 id="rules-modal-title" className="text-xl font-bold text-[#111111]">
                      {lang === "es" ? "Reglas de la comunidad" : "Community rules"}
                    </h2>
                    <p className="mt-3 text-sm text-[#111111]/80">
                      {lang === "es"
                        ? "Al publicar en LEONIX Clasificados aceptas que tu anuncio cumple con estas reglas. Esto nos ayuda a mantener un espacio útil para todos."
                        : "By posting on LEONIX Classifieds you confirm your listing complies with these rules. This helps us keep the space useful for everyone."}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-[#111111]/90 list-disc list-inside">
                      {(lang === "es"
                        ? [
                            "El contenido debe ser real y corresponder a lo que ofreces (producto, servicio, renta, etc.).",
                            "No está permitido el spam, contenido engañoso ni duplicados abusivos.",
                            "Respeta a la comunidad: sin contenido ofensivo, discriminatorio o ilegal.",
                            "Los anuncios gratuitos tienen duración y límites (por ejemplo 7 días, 3 fotos). Los planes Pro ofrecen más fotos, video y mayor visibilidad.",
                          ]
                        : [
                            "Content must be real and match what you offer (item, service, rental, etc.).",
                            "Spam, misleading content, and abusive duplicates are not allowed.",
                            "Respect the community: no offensive, discriminatory, or illegal content.",
                            "Free listings have duration and limits (e.g. 7 days, 3 photos). Pro plans offer more photos, video, and visibility.",
                          ]
                      ).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setShowRulesModal(false)}
                      className="mt-6 w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-4 py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8]"
                    >
                      {lang === "es" ? "Volver a publicar" : "Back to publish"}
                    </button>
                  </div>
                </div>
              )}

              <div ref={topAnchorRef} aria-hidden className="h-px w-full" />
              {/* Progress bar — Salir moved to category step bottom left */}
              <div className="mt-6">
                <div className="min-w-0 rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={stepOrder.length} aria-label={lang === "es" ? "Progreso de publicación" : "Publish progress"}>
                  <div className="flex items-center gap-1 sm:gap-2">
                  {stepOrder.map((s, idx) => {
                    const isActive = safeStepForProgress === s;
                    const isPast = stepOrder.indexOf(s) < currentStepIndex;
                    const isUpcoming = !isActive && !isPast;
                    const label = s === "category" ? copy.steps.category : s === "rentas-track" ? copy.steps["rentas-track"] : s === "bienes-raices-track" ? copy.steps["bienes-raices-track"] : s === "basics" ? copy.steps.basics : s === "details" ? copy.steps.details : copy.steps.media;
                    return (
                      <span
                        key={s}
                        className={cx(
                          "inline-flex items-center text-[11px] sm:text-xs font-medium select-none",
                          isActive && "text-[#111111]",
                          isPast && "text-[#111111]/70",
                          isUpcoming && "text-[#111111]/40"
                        )}
                      >
                        <span
                          className={cx(
                            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold",
                            isActive && "border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111]",
                            isPast && "border-black/15 bg-[#E8E8E8] text-[#111111]/80",
                            isUpcoming && "border-black/10 bg-[#F5F5F5] text-[#111111]/40"
                          )}
                        >
                          {isPast ? "✓" : idx + 1}
                        </span>
                        <span className="ml-1.5 hidden sm:inline">{label}</span>
                        {idx < stepOrder.length - 1 && <span className="mx-1 text-[#111111]/25" aria-hidden>›</span>}
                      </span>
                    );
                  })}
                  </div>
                </div>
              </div>

              {/* Visible checklist from same normalized source as preview/publish — pass/fail so form and system stay in sync */}
              <div className="mt-3 rounded-xl border border-black/10 bg-[#F5F5F5] px-4 py-3">
                <div className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide mb-2">
                  {lang === "es" ? "Requisitos para publicar" : "Publish requirements"}
                </div>
                <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                  {requirementItems.map((item) => (
                    <li key={item.key} className={cx("flex items-center gap-1.5", item.ok ? "text-[#111111]/80" : "text-red-700")}>
                      {item.ok ? <span aria-hidden>✓</span> : <span aria-hidden>✗</span>}
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Always reserve one line so status toggles do not cause layout shift while typing */}
              <div className="mt-2 min-h-[1.5rem] text-sm flex items-center" role="status" aria-live="polite">
                {showSaveSuccess && <span className="text-[#0d7a0d] font-medium">✓ {copy.saveProgressSuccess}</span>}
                {saveProgressing && !showSaveSuccess && <span className="text-[#111111]/70">{lang === "es" ? "Guardando…" : "Saving…"}</span>}
                {dbSaveStatus === "saved" && !showSaveSuccess && <span className="text-[#0d7a0d] font-medium">{lang === "es" ? "Guardado" : "Saved"}</span>}
                {dbSaveStatus === "error" && <span className="text-red-600" role="alert">{lang === "es" ? "Error al guardar. Reintenta." : "Error saving. Try again."}</span>}
                {!saveProgressing && !showSaveSuccess && dbSaveStatus !== "saved" && dbSaveStatus !== "error" && (
                  <span className="invisible select-none text-[#111111]/70" aria-hidden>.</span>
                )}
              </div>

              <div className="mt-6 grid gap-6">
                {/* CATEGORY (STEP 1) — icon cards, all real categories, no Más */}
                {step === "category" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.categoryTitle}</h2>
                    <p className="mt-2 text-sm text-[#111111]">{copy.categoryNote}</p>

                    <div
                      className={cx(
                        "mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3",
                        categoryShowValidation && !requirements.categoryOk && "rounded-xl p-2 ring-2 ring-red-500/45"
                      )}
                    >
                      {PUBLICAR_CATEGORIES.map(({ key, Icon }) => {
                        const label = categoryConfig[key].label[lang];
                        const selected = category === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const qs = searchParams?.toString() || `lang=${lang}`;
                              router.replace(`/clasificados/publicar/${key}?${qs}`);
                              setCategory(key);
                              scrollCategoryActionsIntoView();
                            }}
                            className={cx(
                              "flex flex-col items-center justify-center gap-2 rounded-xl border py-4 px-3 transition-colors",
                              "focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/30",
                              selected
                                ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                                : "border-black/10 bg-white text-[#111111] hover:bg-[#F5F5F5] active:bg-[#EFEFEF]"
                            )}
                            aria-pressed={selected}
                            aria-label={label}
                          >
                            <Icon className="h-7 w-7 shrink-0 text-[#111111]" aria-hidden />
                            <span className="text-sm font-medium leading-tight text-center">{label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {categoryShowValidation && !requirements.categoryOk && (
                      <div className="mt-4 rounded-xl border border-red-300 bg-red-50/90 p-3 text-xs text-red-800" role="alert">
                        {lang === "es" ? "Selecciona una categoría para continuar." : "Choose a category to continue."}
                      </div>
                    )}

                    <div ref={categoryActionsRef} className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleExitClick}
                        className="rounded-xl border border-black/15 bg-[#F5F5F5] hover:bg-[#E8E8E8] text-[#111111] font-semibold px-5 py-3"
                      >
                        {copy.exitLink}
                      </button>
                      <button
                        type="button"
                        disabled={saveProgressing}
                        onClick={() => void handleSaveProgress()}
                        className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCurrentDraft()}
                        className="rounded-xl border border-red-600/40 bg-red-50/80 hover:bg-red-100/80 text-red-800 font-semibold px-4 py-2.5 text-sm"
                      >
                        {copy.deleteApplication}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (categoryFromUrl === "servicios" && !servicesPackage) {
                            setShowServicesGate(true);
                            return;
                          }
                          if (!requirements.categoryOk) {
                            setPublishNextAttempted((prev) => ({ ...prev, category: true }));
                            return;
                          }
                          setPublishNextAttempted((prev) => ({ ...prev, category: false }));
                          if (categoryFromUrl === "rentas") goToStep("rentas-track");
                          else if (categoryFromUrl === "bienes-raices") goToStep("bienes-raices-track");
                          else goToStep("basics");
                        }}
                        className="rounded-xl font-semibold px-5 py-3 bg-yellow-500/90 hover:bg-yellow-500 text-black"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* RENTAS TRACK (step 2 for Rentas only): Privado vs Negocio + plan */}
                {step === "rentas-track" && categoryFromUrl === "rentas" && (
                  <RentasPublishShell>
                    <RentasPublishTrackStep
                      lang={lang}
                      cx={cx}
                      details={details}
                      setDetails={setDetails}
                      goToStep={goToStep}
                      handleBack={handleBack}
                      rentasNegocioPricePerPost={RENTAS_NEGOCIO_PRICE_PER_POST}
                      copyBack={copy.back}
                    />
                  </RentasPublishShell>
                )}

                {/* BIENES RAÍCES TRACK: Privado vs Negocio/Profesional */}
                {step === "bienes-raices-track" && categoryFromUrl === "bienes-raices" && (
                  <BienesRaicesPublishShell>
                    <BienesRaicesPublishTrackStep
                      lang={lang}
                      cx={cx}
                      details={details}
                      setDetails={setDetails}
                      goToStep={goToStep}
                      handleBack={handleBack}
                      brPrivadoPricePerPost={BR_PRIVADO_PRICE_PER_POST}
                      brNegocioPriceWeekly={BR_NEGOCIO_PRICE_WEEKLY}
                      brNegocioPriceMonthly={BR_NEGOCIO_PRICE_MONTHLY}
                      copyBack={copy.back}
                    />
                  </BienesRaicesPublishShell>
                )}

                {/* BASICS */}
                {step === "basics" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.basicsTitle}</h2>
                    {false && !isPro && categoryFromUrl === "en-venta" && (
                      <div className="mt-4 rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-[#111111]">
                              {lang === "es" ? "Modo Garaje" : "Garage Mode"}
                            </div>
                            <p className="mt-1 text-xs text-[#111111] max-w-xl">
                              {lang === "es"
                                ? "Solo para usuarios Free en En Venta. Cuando llegas al límite, puedes desbloquear +4 anuncios por 7 días (1 vez cada 30 días)."
                                : "Free users in For Sale only. When you hit the limit, unlock +4 listings for 7 days (once every 30 days)."}
                            </p>
                          </div>

                          <div className="text-xs text-[#111111]">
                            {garageLoading
                              ? (lang === "es" ? "Calculando…" : "Calculating…")
                              : typeof enVentaActiveCount === "number"
                                ? (lang === "es"
                                    ? `Activos: ${enVentaActiveCount} / ${garage.effectiveLimit ?? FREE_EN_VENTA_LIMIT}`
                                    : `Active: ${enVentaActiveCount} / ${garage.effectiveLimit ?? FREE_EN_VENTA_LIMIT}`)
                                : (lang === "es" ? "Activos: —" : "Active: —")}
                          </div>
                        </div>

                        {garage.active && garageExpiresAt && (
                          <div className="mt-3 rounded-xl border border-yellow-400/20 bg-[#F2EFE8] p-3 text-xs text-[#111111]">
                            {lang === "es"
                              ? `Modo Garaje activo hasta ${new Date(garageExpiresAt).toLocaleDateString("es-US")}.`
                              : `Garage Mode active until ${new Date(garageExpiresAt).toLocaleDateString("en-US")}.`}
                          </div>
                        )}

                        {!garage.active && typeof garage.cooldownDaysLeft === "number" && (garage.cooldownDaysLeft ?? 0) > 0 && (
                          <div className="mt-3 rounded-xl border border-black/10 bg-[#F5F5F5] p-3 text-xs text-[#111111]">
                            {lang === "es"
                              ? `Disponible de nuevo en ${garage.cooldownDaysLeft ?? 0} día(s).`
                              : `Available again in ${garage.cooldownDaysLeft ?? 0} day(s).`}
                          </div>
                        )}

                        {!garage.active && garage.eligibleToActivate && (
                          <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-xs text-emerald-100">
                            {lang === "es"
                              ? "Estás en el límite. Al publicar, activaremos Modo Garaje automáticamente para darte +4 anuncios por 7 días."
                              : "You’re at the limit. When you publish, we’ll automatically activate Garage Mode to give you +4 listings for 7 days."}
                          </div>
                        )}
                      </div>
                    )}


                    <div className="mt-4 grid gap-4">
                      {categoryFromUrl === "en-venta" ? (
                        <EnVentaPublishShell>
                        <>
                          {/* En Venta: item-selling Basics (subcategoría, artículo, condición, title, description, price, city) */}
                          <div
                            id="publish-basics-enVenta-meta"
                            className={cx(
                              "grid grid-cols-1 sm:grid-cols-2 gap-3",
                              basicsShowValidation && !requirements.enVentaMetaOk && "rounded-xl p-2 ring-2 ring-red-500/45"
                            )}
                          >
                            <div>
                              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Subcategoría" : "Subcategory"}{" *"}</label>
                              <select
                                value={details.rama ?? ""}
                                onChange={(e) => setDetails((prev) => ({ ...prev, rama: e.target.value, itemType: "" }))}
                                aria-invalid={basicsShowValidation && !details.rama?.trim()}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                  basicsShowValidation && !details.rama?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                )}
                              >
                                <option value="">{lang === "es" ? "Elige subcategoría…" : "Choose subcategory…"}</option>
                                {EN_VENTA_SUBCATEGORIES.map((s) => (
                                  <option key={s.key} value={s.key}>{lang === "es" ? s.label.es : s.label.en}</option>
                                ))}
                              </select>
                              {!details.rama?.trim() && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido." : "Required."}</div>
                              )}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Artículo" : "Item type"}{" *"}</label>
                              {(() => {
                                const articuloResult = getArticuloOptionsForSubcategory(details.rama ?? "");
                                const disabled = !(details.rama ?? "").trim();
                                const itemErr = basicsShowValidation && !disabled && !details.itemType?.trim();
                                if (articuloResult.type === "grouped") {
                                  return (
                                    <select
                                      value={details.itemType ?? ""}
                                      onChange={(e) => setDetails((prev) => ({ ...prev, itemType: e.target.value }))}
                                      disabled={disabled}
                                      aria-invalid={!!itemErr}
                                      className={cx(
                                        "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60",
                                        itemErr ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                      )}
                                    >
                                      <option value="">{disabled ? (lang === "es" ? "Elige subcategoría primero" : "Choose subcategory first") : (lang === "es" ? "Elige artículo…" : "Choose item…")}</option>
                                      {articuloResult.groups.map((g) => (
                                        <optgroup key={g.groupLabel.es} label={lang === "es" ? g.groupLabel.es : g.groupLabel.en}>
                                          {g.options.map((o) => (
                                            <option key={o.value} value={o.value}>{lang === "es" ? o.label.es : o.label.en}</option>
                                          ))}
                                        </optgroup>
                                      ))}
                                    </select>
                                  );
                                }
                                return (
                                  <select
                                    value={details.itemType ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, itemType: e.target.value }))}
                                    disabled={disabled}
                                    aria-invalid={!!itemErr}
                                    className={cx(
                                      "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60",
                                      itemErr ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                    )}
                                  >
                                    <option value="">{disabled ? (lang === "es" ? "Elige subcategoría primero" : "Choose subcategory first") : (lang === "es" ? "Elige artículo…" : "Choose item…")}</option>
                                    {articuloResult.options.map((o) => (
                                      <option key={o.value} value={o.value}>{lang === "es" ? o.label.es : o.label.en}</option>
                                    ))}
                                  </select>
                                );
                              })()}
                              {!details.itemType?.trim() && details.rama?.trim() && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido." : "Required."}</div>
                              )}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Condición" : "Condition"}{" *"}</label>
                              <select
                                value={details.condition ?? ""}
                                onChange={(e) => setDetails((prev) => ({ ...prev, condition: e.target.value }))}
                                aria-invalid={basicsShowValidation && !details.condition?.trim()}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                  basicsShowValidation && !details.condition?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                )}
                              >
                                <option value="">{lang === "es" ? "Elige condición…" : "Choose condition…"}</option>
                                {EN_VENTA_CONDICION.map((c) => (
                                  <option key={c.value} value={c.value}>{lang === "es" ? c.labelEs : c.labelEn}</option>
                                ))}
                              </select>
                              {!details.condition?.trim() && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido." : "Required."}</div>
                              )}
                            </div>
                          </div>
                          <div id="publish-basics-title">
                            <label className="text-sm font-medium text-[#111111]">{copy.fieldTitle}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">{lang === "es" ? "Un título claro ayuda a que te encuentren." : "A clear title helps people find your listing."}</p>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={lang === "es" ? "Ej: Sofá en excelente condición" : "e.g. Great-condition sofa"}
                              aria-invalid={basicsShowValidation && !requirements.titleOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.titleOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.titleOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}</div>
                            )}
                          </div>
                          <div id="publish-basics-desc">
                            <label className="text-sm font-medium text-[#111111]">{copy.fieldDesc}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">{lang === "es" ? "Describe el estado, medidas, entrega, etc." : "Describe condition, size, pickup/delivery, etc."}</p>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder={lang === "es" ? "Describe el estado, medidas, entrega, etc." : "Describe condition, size, pickup/delivery, etc."}
                              rows={5}
                              aria-invalid={basicsShowValidation && !requirements.descOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.descOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.descOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}</div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2" id="publish-basics-price">
                              <label className="text-sm font-medium text-[#111111]">{copy.fieldPrice}{" *"}</label>
                              <input
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={isFree}
                                placeholder={lang === "es" ? "Ej: 120" : "e.g. 120"}
                                aria-invalid={basicsShowValidation && !requirements.priceOk}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2",
                                  isFree
                                    ? "border-white/5 bg-[#F5F5F5] text-[#111111]"
                                    : basicsShowValidation && !requirements.priceOk
                                      ? "border-red-500 ring-1 ring-red-500/35 bg-white/90 focus:ring-yellow-400/30"
                                      : "border-black/10 bg-white/90 focus:ring-yellow-400/30"
                                )}
                              />
                              {!requirements.priceOk && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Agrega un precio o marca Gratis." : "Add a price or mark Free."}</div>
                              )}
                            </div>
                            <div className="sm:col-span-1">
                              <label className="text-sm font-medium text-[#111111]">{copy.freeToggle}</label>
                              <button
                                type="button"
                                onClick={() => { setIsFree((v) => !v); if (!isFree) setPrice(""); }}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold",
                                  isFree ? "border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111]" : "border-black/10 bg-white/90 text-[#111111] hover:bg-white/12"
                                )}
                              >
                                {isFree ? (lang === "es" ? "Sí, es Gratis" : "Yes, it's Free") : (lang === "es" ? "No" : "No")}
                              </button>
                            </div>
                          </div>
                          <div id="publish-basics-city">
                            <label className="text-sm font-medium text-[#111111]">{copy.fieldCity}{" *"}</label>
                            <CityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder={lang === "es" ? "Ej: San José" : "e.g. San Jose"}
                              lang={lang}
                              label=""
                              variant="light"
                              className="mt-2"
                              invalid={basicsShowValidation && !requirements.cityOk}
                            />
                            {!requirements.cityOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Agrega tu ciudad." : "Add your city."}</div>
                            )}
                          </div>
                        </>
                        </EnVentaPublishShell>
                      ) : categoryFromUrl === "bienes-raices" ? (
                        <BienesRaicesPublishShell>
                        <div
                          id="publish-basics-br-meta"
                          className={cx(
                            "space-y-4",
                            basicsShowValidation && !requirements.bienesRaicesMetaOk && "rounded-xl p-2 ring-2 ring-red-500/45"
                          )}
                        >
                          {/* Bienes Raíces: read-only advertiser summary (set in previous step); Cambiar goes back to bienes-raices-track */}
                          <div className="rounded-xl border border-[#C9B46A]/25 bg-[#F8F6F0]/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
                                {lang === "es" ? "Publicando como" : "Posting as"}
                              </p>
                              <p className="mt-1 text-sm font-medium text-[#111111]">
                                {details.bienesRaicesBranch === "negocio"
                                  ? (lang === "es" ? "Negocio" : "Business")
                                  : (lang === "es" ? "Privado" : "Private")}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => goToStep("bienes-raices-track")}
                              className="text-sm font-semibold text-[#111111]/80 hover:text-[#111111] underline"
                            >
                              {lang === "es" ? "Cambiar" : "Change"}
                            </button>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Tipo de propiedad" : "Property type"}{" *"}</label>
                            <select
                              value={details.enVentaPropertyType ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDetails((prev) => ({ ...prev, enVentaPropertyType: v, bienesRaicesSubcategoria: getBrSubcategoriaFromPropertyType(v) }));
                              }}
                              aria-invalid={basicsShowValidation && !details.enVentaPropertyType?.trim()}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !details.enVentaPropertyType?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            >
                              <option value="">{lang === "es" ? "Elige tipo de propiedad…" : "Choose property type…"}</option>
                              {EN_VENTA_BR_PROPERTY_TYPES.map((o) => <option key={o.value} value={o.value}>{lang === "es" ? o.label.es : o.label.en}</option>)}
                            </select>
                            {!details.enVentaPropertyType?.trim() && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido." : "Required."}</div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Subtipo de propiedad" : "Property subtype"}</label>
                            <input value={details.enVentaPropertySubtype ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaPropertySubtype: e.target.value }))} placeholder={brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.subtypePlaceholder.es : brPrivateCopyProfile.subtypePlaceholder.en) : (lang === "es" ? "Ej: Casa independiente, Duplex" : "e.g. Single family, Duplex")} className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30" />
                          </div>
                          <div id="publish-basics-title">
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Título del anuncio" : "Listing title"}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">{lang === "es" ? "Un título claro que describa la propiedad." : "A clear title that describes the property."}</p>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.titlePlaceholder.es : brPrivateCopyProfile.titlePlaceholder.en) : (lang === "es" ? "Ej: Casa 3 recámaras en zona céntrica" : "e.g. 3-bed house in central area")}
                              aria-invalid={basicsShowValidation && !requirements.titleOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.titleOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.titleOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}</div>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div id="publish-basics-price">
                              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Precio" : "Price"}{" *"}</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={price}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if ((details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio") {
                                    setPrice(formatBrNegocioPriceInputDisplay(v));
                                  } else {
                                    setPrice(v.replace(/[^0-9.]/g, ""));
                                  }
                                }}
                                placeholder={
                                  (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio"
                                    ? (lang === "es" ? "Ej: 1,200,000" : "e.g. 1,200,000")
                                    : lang === "es"
                                      ? "Ej: 250000"
                                      : "e.g. 250000"
                                }
                                aria-invalid={basicsShowValidation && !requirements.priceOk}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                  basicsShowValidation && !requirements.priceOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                )}
                              />
                              {!requirements.priceOk && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Indica el precio." : "Enter price."}</div>
                              )}
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Modo de precio" : "Price display"}</label>
                              <div className="mt-2 flex rounded-xl border border-black/10 overflow-hidden bg-[#F5F5F5]">
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, enVentaPriceDisplayMode: "exacto" }))} className={cx("flex-1 py-3 text-sm font-semibold", (details.enVentaPriceDisplayMode ?? "exacto") === "exacto" ? "bg-[#C9B46A]/40 text-[#111111]" : "text-[#111111]/70 hover:bg-[#EFEFEF]")}>{lang === "es" ? "Exacto" : "Exact"}</button>
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, enVentaPriceDisplayMode: "desde" }))} className={cx("flex-1 py-3 text-sm font-semibold", (details.enVentaPriceDisplayMode ?? "") === "desde" ? "bg-[#C9B46A]/40 text-[#111111]" : "text-[#111111]/70 hover:bg-[#EFEFEF]")}>{lang === "es" ? "Desde" : "From"}</button>
                              </div>
                            </div>
                          </div>
                          <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                            <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Ubicación" : "Location"}</h4>
                            <div id="publish-basics-city">
                              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Ciudad" : "City"}{" *"}</label>
                              <CityAutocomplete
                                value={city}
                                onChange={setCity}
                                placeholder={lang === "es" ? "Ej: San José" : "e.g. San Jose"}
                                lang={lang}
                                label=""
                                variant="light"
                                className="mt-1"
                                invalid={basicsShowValidation && !requirements.cityOk}
                              />
                              {!requirements.cityOk && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido." : "Required."}</div>
                              )}
                            </div>
                            <div>
                              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Nombre de la vecindad" : "Neighborhood name"}</label>
                              <input value={details.enVentaZone ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaZone: e.target.value }))} placeholder={lang === "es" ? "Ej: Rose Garden, Downtown, Little Portugal, Willow Glen" : "e.g. Rose Garden, Downtown, Little Portugal, Willow Glen"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                            </div>
                            {(details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio" ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Número" : "Street number"}</label>
                                  <input
                                    value={details.brNegocioStreetNumber ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioStreetNumber: e.target.value }))}
                                    placeholder={lang === "es" ? "Ej: 123" : "e.g. 123"}
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Calle" : "Street"}</label>
                                  <input
                                    value={details.brNegocioStreet ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioStreet: e.target.value }))}
                                    placeholder={lang === "es" ? "Ej: Av. Central" : "e.g. Main St"}
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estado" : "State"}</label>
                                  <input
                                    value={details.brNegocioState ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioState: e.target.value }))}
                                    placeholder={lang === "es" ? "Ej: CA" : "e.g. CA"}
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Código postal" : "ZIP code"}</label>
                                  <input
                                    value={details.brNegocioZip ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioZip: e.target.value.replace(/[^\d-]/g, "").slice(0, 10) }))}
                                    placeholder={lang === "es" ? "Ej: 95112" : "e.g. 95112"}
                                    inputMode="numeric"
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Dirección (opcional)" : "Address (optional)"}</label>
                                <input value={details.enVentaAddress ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAddress: e.target.value }))} placeholder={lang === "es" ? "Ej: Calle 5, Av. Central" : "e.g. 123 Main St"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                            )}
                            <div>
                              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Mostrar ubicación" : "Location display"}</label>
                              <div className="mt-1 flex rounded-lg border border-black/10 overflow-hidden bg-[#F5F5F5]">
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, enVentaLocationDisplayMode: "exacta" }))} className={cx("flex-1 py-2 text-xs font-semibold", (details.enVentaLocationDisplayMode ?? "exacta") === "exacta" ? "bg-[#C9B46A]/30 text-[#111111]" : "text-[#111111]/70")}>{lang === "es" ? "Exacta" : "Exact"}</button>
                                <button type="button" onClick={() => setDetails((prev) => ({ ...prev, enVentaLocationDisplayMode: "aproximada" }))} className={cx("flex-1 py-2 text-xs font-semibold", (details.enVentaLocationDisplayMode ?? "") === "aproximada" ? "bg-[#C9B46A]/30 text-[#111111]" : "text-[#111111]/70")}>{lang === "es" ? "Aproximada" : "Approximate"}</button>
                              </div>
                            </div>
                          </div>
                          {/* Shared optional fields for all BR (Privado and Negocio) */}
                          <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                            <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Datos opcionales de la propiedad" : "Optional property info"}</h4>
                            {(details.bienesRaicesBranch ?? "").trim().toLowerCase() === "privado" && (
                              <p className="text-[11px] text-[#111111]/65">{lang === "es" ? "Todos opcionales. Completa solo lo que conozcas." : "All optional. Fill in only what you know."}</p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "negocio" && (
                                <>
                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-[#111111]/80">{lang === "es" ? "Video de la propiedad" : "Property video"}</label>
                                    <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Pega el enlace del video de tu propiedad. Puede ser de YouTube, TikTok, Vimeo, Instagram u otro enlace público." : "Paste the link to your property video. Can be from YouTube, TikTok, Vimeo, Instagram or another public link."}</p>
                                    <input value={details.enVentaVideoUrl ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaVideoUrl: e.target.value }))} placeholder="https://" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-[#111111]/80">{lang === "es" ? "Tour virtual" : "Virtual tour"}</label>
                                    <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Pega el enlace del recorrido virtual o tour 3D de la propiedad. Puede ser de Matterport, YouTube o del sitio web donde esté publicado." : "Paste the link to the virtual tour or 3D walkthrough. Can be Matterport, YouTube or the site where it is published."}</p>
                                    <input value={details.enVentaVirtualTourUrl ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaVirtualTourUrl: e.target.value }))} placeholder="https://" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                  </div>
                                </>
                              )}
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Año de construcción" : "Year built"}</label>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Año en que se construyó la propiedad o la última remodelación importante." : "Year the property was built or last major remodel."}</p>
                                <input value={details.enVentaYearBuilt ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaYearBuilt: e.target.value }))} placeholder={lang === "es" ? "Ej: 1995" : "e.g. 1995"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Código de uso del suelo. Ej: R-1 (residencial), C-1 (comercial), agrícola." : "Land use code. e.g. R-1 (residential), C-1 (commercial), agricultural."}</p>
                                <input value={details.enVentaZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaZoning: e.target.value }))} placeholder={lang === "es" ? "Ej: R-1, comercial" : "e.g. R-1, commercial"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Solo si aplica. Ej: se vende tal como está, short sale, probate, propiedad rentada." : "Only if applicable. e.g. as-is, short sale, probate, tenant-occupied."}</p>
                                <input value={details.enVentaSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSpecialConditions: e.target.value }))} placeholder={lang === "es" ? "Opcional" : "Optional"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-xs text-[#111111]/80">{lang === "es" ? "Servicios disponibles" : "Utilities available"}</span>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Marca los servicios con los que cuenta la propiedad." : "Check the utilities available at the property."}</p>
                                <div className="mt-2 flex flex-wrap gap-3">
                                  {[
                                    { key: "enVentaServicioAgua", labelEs: "Agua", labelEn: "Water" },
                                    { key: "enVentaServicioElectricidad", labelEs: "Electricidad", labelEn: "Electric" },
                                    { key: "enVentaServicioGas", labelEs: "Gas", labelEn: "Gas" },
                                    { key: "enVentaServicioDrenaje", labelEs: "Drenaje", labelEn: "Sewer" },
                                    { key: "enVentaServicioInternet", labelEs: "Internet", labelEn: "Internet" },
                                  ].map(({ key, labelEs, labelEn }) => {
                                    const val = (details[key as keyof typeof details] ?? "").toString().trim().toLowerCase();
                                    const isOn = val === "si" || val === "sí" || val === "yes";
                                    return (
                                      <label key={key} className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={isOn} onChange={(e) => setDetails((prev) => ({ ...prev, [key]: e.target.checked ? "si" : "" }))} className="rounded border-black/20 text-[#C9B46A] focus:ring-[#C9B46A]/30" />
                                        <span className="text-sm text-[#111111]">{lang === "es" ? labelEs : labelEn}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                {(details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "negocio" && (
                                  <div className="mt-3">
                                    <label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles adicionales de servicios" : "Additional utility details"}</label>
                                    <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: PG&E, San Jose Water, pozo, fosa séptica, panel solar." : "e.g. PG&E, San Jose Water, well, septic, solar."}</p>
                                    <input value={details.enVentaUtilitiesForProperty ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaUtilitiesForProperty: e.target.value }))} placeholder={lang === "es" ? "Opcional" : "Optional"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {/* Property-type–conditional sections: BR Privado only. Negocio keeps single Quick facts block. */}
                          {details.bienesRaicesBranch === "negocio" ? (
                            <div className="rounded-xl border border-black/10 bg-white/80 p-4">
                              <h4 className="text-sm font-medium text-[#111111] mb-3">{lang === "es" ? "Datos rápidos" : "Quick facts"}</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Recámaras" : "Bedrooms"}{" *"}</label><input value={details.enVentaBedrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaBedrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.enVentaBedrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Baños" : "Bathrooms"}{" *"}</label><input value={details.enVentaBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.enVentaBathrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Medios baños" : "Half baths"}</label><input value={details.enVentaHalfBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaHalfBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label>
                                  <input
                                    value={formatBrNegocioIntegerInputDisplay(details.enVentaSquareFeet ?? "")}
                                    onChange={(e) =>
                                      setDetails((prev) => ({
                                        ...prev,
                                        enVentaSquareFeet: brNegocioDigitsOnly(e.target.value),
                                      }))
                                    }
                                    placeholder={lang === "es" ? "Ej: 1,200" : "e.g. 1,200"}
                                    inputMode="numeric"
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                  {!details.enVentaSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}
                                </div>
                                <div>
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label>
                                  <input
                                    value={formatBrNegocioIntegerInputDisplay(details.enVentaLotSize ?? "")}
                                    onChange={(e) =>
                                      setDetails((prev) => ({
                                        ...prev,
                                        enVentaLotSize: brNegocioDigitsOnly(e.target.value),
                                      }))
                                    }
                                    placeholder={lang === "es" ? "Ej: 5,000" : "e.g. 5,000"}
                                    inputMode="numeric"
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                  />
                                </div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.enVentaLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLevels: e.target.value }))} placeholder="1" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking"}</label><input value={details.enVentaParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingSpaces: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                              </div>
                            </div>
                          ) : (() => {
                            const pt = (details.enVentaPropertyType ?? "").trim();
                            const hideBrPrivateTechnical = (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "privado";
                            if (isBrPrivadoResidential(pt)) {
                              return (
                                <>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4">
                                    <h4 className="text-sm font-medium text-[#111111] mb-3">{lang === "es" ? "Datos rápidos residenciales" : "Residential quick facts"}</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Recámaras" : "Bedrooms"}{" *"}</label><input value={details.enVentaBedrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaBedrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.enVentaBedrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Baños" : "Bathrooms"}{" *"}</label><input value={details.enVentaBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.enVentaBathrooms?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Medios baños" : "Half baths"}</label><input value={details.enVentaHalfBathrooms ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaHalfBathrooms: e.target.value }))} placeholder="0" inputMode="numeric" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label><input value={details.enVentaSquareFeet ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSquareFeet: e.target.value }))} placeholder={lang === "es" ? "Ej: 1200" : "e.g. 1200"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.enVentaSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label><input value={details.enVentaLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLotSize: e.target.value }))} placeholder={lang === "es" ? "m² o pies²" : "sq ft"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.enVentaLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLevels: e.target.value }))} placeholder="1" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Número de espacios de estacionamiento." : "Number of parking spaces."}</p>
                                        <input value={details.enVentaParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingSpaces: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Interior y distribución" : "Interior & layout"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div className="sm:col-span-2">
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Espacios de la propiedad" : "Property spaces"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Marca o escribe los espacios principales que tiene la propiedad. Ej: sala, comedor, oficina, cuarto de lavado, family room." : "List the main spaces. e.g. living room, dining room, office, laundry room, family room."}</p>
                                        <input value={details.enVentaRoomTypes ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaRoomTypes: e.target.value }))} placeholder={lang === "es" ? "Ej: sala, comedor, family room" : "e.g. living room, dining, family room"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Recámara principal" : "Primary bedroom"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: walk-in closet, baño completo, vista al jardín." : "e.g. walk-in closet, en suite bath, garden view."}</p>
                                        <input value={details.enVentaPrimaryBedroomFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaPrimaryBedroomFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Baño principal" : "Primary bathroom"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: doble lavabo, tina, regadera, acabados de lujo." : "e.g. double vanity, tub, shower, luxury finishes."}</p>
                                        <input value={details.enVentaPrimaryBathroomFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaPrimaryBathroomFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Comedor" : "Dining room"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: comedor formal, espacio para 8, conexión con cocina." : "e.g. formal dining, seats 8, open to kitchen."}</p>
                                        <input value={details.enVentaDiningRoomFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaDiningRoomFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Cocina" : "Kitchen"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: isla, granito, electrodomésticos de acero inoxidable, desayunador." : "e.g. island, granite, stainless appliances, breakfast nook."}</p>
                                        <input value={details.enVentaKitchenFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaKitchenFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Sistemas y equipamiento" : "Systems & equipment"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Calefacción" : "Heating"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: central de gas, piso radiante, calefactor de pared." : "e.g. central gas, radiant floor, wall heater."}</p>
                                        <input value={details.enVentaHeating ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaHeating: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Enfriamiento" : "Cooling"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: aire central, mini splits, ventiladores de techo." : "e.g. central A/C, mini splits, ceiling fans."}</p>
                                        <input value={details.enVentaCooling ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaCooling: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Electrodomésticos incluidos" : "Appliances included"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: refrigerador, estufa, lavavajillas, microondas, lavadora y secadora." : "e.g. fridge, range, dishwasher, microwave, washer & dryer."}</p>
                                        <input value={details.enVentaAppliancesIncluded ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAppliancesIncluded: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Lavandería" : "Laundry"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: cuarto de lavado, área en el garaje, conexiones dentro de la casa." : "e.g. laundry room, garage hookups, in-unit."}</p>
                                        <input value={details.enVentaLaundryFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLaundryFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Acabados e interior" : "Finishes & interior"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Pisos" : "Flooring"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: madera, laminado, loseta, alfombra, concreto pulido." : "e.g. hardwood, laminate, tile, carpet, polished concrete."}</p>
                                        <input value={details.enVentaFlooring ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFlooring: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de chimeneas" : "Fireplace count"}</label><input value={details.enVentaFireplaceCount ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFireplaceCount: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div className="sm:col-span-2">
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles de chimenea" : "Fireplace features"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: chimenea de leña, gas, piedra, en sala y recámara principal." : "e.g. wood-burning, gas, stone, in living room and primary bedroom."}</p>
                                        <input value={details.enVentaFireplaceFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFireplaceFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Estacionamiento y acceso" : "Parking & access"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento (detalles)" : "Parking features"}</label>
                                        <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: cochera cubierta 2 autos, entrada directa, EV charger." : "e.g. 2-car garage, direct access, EV charger."}</p>
                                        <input value={details.enVentaParkingFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      </div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cocheras cubiertas" : "Attached garage spaces"}</label><input value={details.enVentaAttachedGarageSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAttachedGarageSpaces: e.target.value }))} placeholder="0" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Espacios descubiertos" : "Uncovered spaces"}</label><input value={details.enVentaUncoveredSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaUncoveredSpaces: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Accesibilidad" : "Accessibility features"}</label><input value={details.enVentaAccessibilityFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAccessibilityFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Exterior y terreno" : "Exterior & lot"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cercado" : "Fencing"}</label><input value={details.enVentaFencing ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFencing: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Características del terreno" : "Lot features"}</label><input value={details.enVentaLotFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLotFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Patio / portal" : "Patio & porch features"}</label><input value={details.enVentaPatioPorchFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaPatioPorchFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Exterior" : "Exterior features"}</label><input value={details.enVentaExteriorFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaExteriorFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div className="sm:col-span-2"><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estructuras adicionales" : "Additional structures"}</label><input value={details.enVentaAdditionalStructures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAdditionalStructures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Construcción y legal" : "Construction & legal"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estilo arquitectónico" : "Architectural style"}</label><input value={details.enVentaArchitecturalStyle ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaArchitecturalStyle: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Materiales" : "Materials"}</label><input value={details.enVentaMaterials ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaMaterials: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cimentación" : "Foundation"}</label><input value={details.enVentaFoundation ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFoundation: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Techo" : "Roof"}</label><input value={details.enVentaRoof ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaRoof: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Construcción nueva" : "New construction"}</label><input value={details.enVentaNewConstruction ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaNewConstruction: e.target.value }))} placeholder={lang === "es" ? "Sí/No" : "Yes/No"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela" : "Parcel number"}</label><input value={details.enVentaParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Servicios" : "Services"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.enVentaSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSewer: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Agua" : "Water"}</label><input value={details.enVentaWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaWater: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.enVentaGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                </>
                              );
                            }
                            if (isBrPrivadoLote(pt)) {
                              return (
                                <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                  <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Terreno" : "Land"}</h4>
                                  <p className="text-[11px] text-[#111111]/55">{lang === "es" ? "Solo información relevante para terreno o lote. No se piden recámaras, baños ni cocina." : "Only land/lot-relevant info. Bedrooms, bathrooms and kitchen are not asked."}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno (tamaño)" : "Lot size"}{" *"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Superficie en m², pies² o acres. Ej: 500 m², 0.25 acres." : "Area in sq ft, m² or acres. e.g. 500 m², 0.25 acres."}</p>
                                      <input value={details.enVentaLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLotSize: e.target.value }))} placeholder={lang === "es" ? "m² o pies² o acres" : "sq ft, m² or acres"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                      {!details.enVentaLotSize?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Características del terreno" : "Lot features"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Ej: plano, con pendiente, vista, esquina, acceso a calle." : "e.g. flat, sloped, view, corner lot, street access."}</p>
                                      <input value={details.enVentaLotFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLotFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cercado" : "Fencing"}</label><input value={details.enVentaFencing ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFencing: e.target.value }))} placeholder={lang === "es" ? "Ej: sí, reja perimetral" : "e.g. yes, perimeter"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div>
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela / APN" : "Parcel / APN"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Número de parcela o Assessor Parcel Number del catastro." : "Parcel number or Assessor Parcel Number."}</p>
                                      <input value={details.enVentaParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Uso de suelo permitido. Ej: residencial, agrícola, comercial." : "Permitted use. e.g. residential, agricultural, commercial."}</p>
                                      <input value={details.enVentaZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaZoning: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Solo si aplica. Ej: se vende tal como está, short sale, probate." : "Only if applicable. e.g. as-is, short sale, probate."}</p>
                                      <input value={details.enVentaSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSpecialConditions: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div className="sm:col-span-2">
                                      <label className="text-xs text-[#111111]/80">{lang === "es" ? "Acceso" : "Access"}</label>
                                      <p className="mt-0.5 text-[11px] text-[#111111]/55">{lang === "es" ? "Cómo se accede al terreno: calle pavimentada, camino de tierra, easement, etc." : "How the lot is accessed: paved road, dirt road, easement, etc."}</p>
                                      <input value={details.enVentaAccessDescription ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAccessDescription: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                    </div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Servicios disponibles: Agua" : "Water available"}</label><input value={details.enVentaWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaWater: e.target.value }))} placeholder={lang === "es" ? "Ej: municipal, pozo, no" : "e.g. city, well, none"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.enVentaSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSewer: e.target.value }))} placeholder={lang === "es" ? "Ej: municipal, fosa, no" : "e.g. city, septic, none"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.enVentaGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    <div className="sm:col-span-2"><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estructuras adicionales" : "Additional structures"}</label><input value={details.enVentaAdditionalStructures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAdditionalStructures: e.target.value }))} placeholder={lang === "es" ? "Ej: bodega, caseta" : "e.g. shed, guardhouse"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                  </div>
                                </div>
                              );
                            }
                            if (isBrPrivadoComercial(pt)) {
                              return (
                                <>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Espacio comercial" : "Commercial space"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label><input value={details.enVentaSquareFeet ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSquareFeet: e.target.value }))} placeholder={lang === "es" ? "Ej: 1200" : "e.g. 1200"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.enVentaSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label><input value={details.enVentaLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLotSize: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.enVentaLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLevels: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking spaces"}</label><input value={details.enVentaParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingSpaces: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles estacionamiento" : "Parking features"}</label><input value={details.enVentaParkingFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Accesibilidad" : "Accessibility features"}</label><input value={details.enVentaAccessibilityFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAccessibilityFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Uso y legal" : "Use & legal"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label><input value={details.enVentaZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaZoning: e.target.value }))} placeholder={lang === "es" ? "Ej: C-1, comercial" : "e.g. C-1, commercial"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label><input value={details.enVentaSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSpecialConditions: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela / APN" : "Parcel / APN"}</label><input value={details.enVentaParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Construcción" : "Construction"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Año de construcción" : "Year built"}</label><input value={details.enVentaYearBuilt ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaYearBuilt: e.target.value }))} placeholder={lang === "es" ? "Ej: 1995" : "e.g. 1995"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Materiales" : "Materials"}</label><input value={details.enVentaMaterials ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaMaterials: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cimentación" : "Foundation"}</label><input value={details.enVentaFoundation ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFoundation: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Techo" : "Roof"}</label><input value={details.enVentaRoof ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaRoof: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Servicios" : "Services"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.enVentaSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSewer: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Agua" : "Water"}</label><input value={details.enVentaWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaWater: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.enVentaGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Exterior / acceso" : "Exterior / access"}</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Exterior" : "Exterior features"}</label><input value={details.enVentaExteriorFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaExteriorFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Descripción de acceso" : "Access description"}</label><input value={details.enVentaAccessDescription ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAccessDescription: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                </>
                              );
                            }
                            if (isBrPrivadoEdificio(pt)) {
                              return (
                                <>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Datos del edificio" : "Building data"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"}{" *"}</label><input value={details.enVentaSquareFeet ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSquareFeet: e.target.value }))} placeholder={lang === "es" ? "Ej: 5000" : "e.g. 5000"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />{!details.enVentaSquareFeet?.trim() && <div className="mt-0.5 text-xs text-[#111111]/40">{lang === "es" ? "Requerido." : "Required."}</div>}</div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot size"}</label><input value={details.enVentaLotSize ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLotSize: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label><input value={details.enVentaLevels ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLevels: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking spaces"}</label><input value={details.enVentaParkingSpaces ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingSpaces: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Detalles estacionamiento" : "Parking features"}</label><input value={details.enVentaParkingFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Legal y uso" : "Legal & use"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonificación" : "Zoning"}</label><input value={details.enVentaZoning ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaZoning: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Número de parcela / APN" : "Parcel / APN"}</label><input value={details.enVentaParcelNumber ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParcelNumber: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div className="sm:col-span-2"><label className="text-xs text-[#111111]/80">{lang === "es" ? "Condiciones especiales de la venta" : "Special sale conditions"}</label><input value={details.enVentaSpecialConditions ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSpecialConditions: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Construcción" : "Construction"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Año de construcción" : "Year built"}</label><input value={details.enVentaYearBuilt ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaYearBuilt: e.target.value }))} placeholder={lang === "es" ? "Ej: 1995" : "e.g. 1995"} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Materiales" : "Materials"}</label><input value={details.enVentaMaterials ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaMaterials: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Cimentación" : "Foundation"}</label><input value={details.enVentaFoundation ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFoundation: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Techo" : "Roof"}</label><input value={details.enVentaRoof ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaRoof: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  {!hideBrPrivateTechnical && (
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Servicios" : "Services"}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Drenaje" : "Sewer"}</label><input value={details.enVentaSewer ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSewer: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Agua" : "Water"}</label><input value={details.enVentaWater ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaWater: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Gas" : "Gas"}</label><input value={details.enVentaGas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaGas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                  )}
                                  <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
                                    <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Exterior" : "Exterior"}</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Exterior" : "Exterior features"}</label><input value={details.enVentaExteriorFeatures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaExteriorFeatures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                      <div><label className="text-xs text-[#111111]/80">{lang === "es" ? "Estructuras adicionales" : "Additional structures"}</label><input value={details.enVentaAdditionalStructures ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, enVentaAdditionalStructures: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" /></div>
                                    </div>
                                  </div>
                                </>
                              );
                            }
                            if (isBrPrivadoProyectoNuevo(pt)) {
                              return null;
                            }
                            return null;
                          })()}
                          <div id="publish-basics-desc">
                            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Descripción de la propiedad" : "Property description"}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">{brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.descriptionHelper.es : brPrivateCopyProfile.descriptionHelper.en) : (lang === "es" ? "Descripción completa del anuncio. Se usará en la ficha y para búsquedas (mín. 5 caracteres)." : "Full listing description for the listing page and search (min 5 characters).")}</p>
                            <textarea
                              value={details.enVentaFullDescription ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFullDescription: e.target.value }))}
                              placeholder={brPrivateCopyProfile ? (lang === "es" ? brPrivateCopyProfile.descriptionPlaceholder.es : brPrivateCopyProfile.descriptionPlaceholder.en) : (lang === "es" ? "Describa la propiedad, ubicación, acabados, características, etc." : "Describe the property, location, finishes, features, etc.")}
                              rows={5}
                              aria-invalid={basicsShowValidation && !requirements.descOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.descOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.descOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>{lang === "es" ? "Requerido. Mínimo 5 caracteres." : "Required. Min 5 characters."}</div>
                            )}
                          </div>
                          <BienesRaicesNegocioPublishShell>
                          {details.bienesRaicesBranch === "negocio" && (
                            <div className="rounded-xl border border-black/10 bg-[#F8F6F0]/80 p-4 space-y-3">
                              <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Identidad del negocio" : "Business identity"}</h4>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Nombre del negocio" : "Business name"}{" *"}</label>
                                <input value={details.negocioNombre ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioNombre: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                                {!details.negocioNombre?.trim() && <div className="mt-1 text-xs text-[#111111]/40">{lang === "es" ? "Requerido para negocio." : "Required for business."}</div>}
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Nombre del agente" : "Agent name"}</label>
                                <input value={details.negocioAgente ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioAgente: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Cargo o rol" : "Role or title"}</label>
                                <input
                                  value={details.negocioCargo ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioCargo: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Agente de venta, Asistente de venta" : "e.g. Sales agent, Sales assistant"}
                                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Logo del negocio" : "Business logo"}</label>
                                <div className="mt-2 flex items-center gap-3">
                                  <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
                                    {logoUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir imagen" : "Upload image")}
                                    <input type="file" accept="image/*" className="sr-only" disabled={logoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "logo"); e.target.value = ""; }} />
                                  </label>
                                  {details.negocioLogoUrl ? <img src={details.negocioLogoUrl} alt="" className="h-12 w-12 rounded-lg border border-black/10 object-cover bg-white" /> : null}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Foto del agente" : "Agent photo"}</label>
                                <div className="mt-2 flex items-center gap-3">
                                  <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
                                    {agentPhotoUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir imagen" : "Upload image")}
                                    <input type="file" accept="image/*" className="sr-only" disabled={agentPhotoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "agent"); e.target.value = ""; }} />
                                  </label>
                                  {details.negocioFotoAgenteUrl ? <img src={details.negocioFotoAgenteUrl} alt="" className="h-12 w-12 rounded-lg border border-black/10 object-cover bg-white" /> : null}
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Licencia profesional" : "Professional license"}</label>
                                <input
                                  value={details.negocioLicencia ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioLicencia: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">
                                  {lang === "es" ? "Zonas de servicio" : "Service areas"}
                                </label>
                                <p className="mt-0.5 text-[11px] text-[#111111]/55 leading-snug">
                                  {lang === "es"
                                    ? "Ciudades o zonas separadas por comas (se guardan tal cual)."
                                    : "Cities or areas, separated by commas (saved as entered)."}
                                </p>
                                <textarea
                                  value={details.negocioZonasServicio ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioZonasServicio: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: San José, Milpitas, Fremont" : "e.g. San Jose, Milpitas, Fremont"}
                                  rows={3}
                                  className="mt-1.5 w-full min-h-[4.5rem] rounded-lg border border-black/10 px-3 py-2 text-sm resize-y"
                                />
                              </div>
                              <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                                <div className="min-w-0 flex-1">
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Teléfono de oficina" : "Office phone"}</label>
                                  <input
                                    value={details.negocioTelOficina ?? ""}
                                    onChange={(e) => setDetails((prev) => ({ ...prev, negocioTelOficina: formatUsPhone10(e.target.value) }))}
                                    inputMode="numeric"
                                    autoComplete="tel"
                                    className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm tabular-nums"
                                  />
                                </div>
                                <div className="w-[4.75rem] shrink-0">
                                  <label className="text-xs text-[#111111]/80">{lang === "es" ? "Ext." : "Ext."}</label>
                                  <input
                                    value={details.negocioTelExtension ?? ""}
                                    onChange={(e) =>
                                      setDetails((prev) => ({
                                        ...prev,
                                        negocioTelExtension: e.target.value.replace(/[^\dA-Za-z#*]/g, "").slice(0, 8),
                                      }))
                                    }
                                    className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
                                    inputMode="text"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Correo electrónico" : "Email"}</label>
                                <input
                                  type="email"
                                  value={details.negocioEmail ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioEmail: e.target.value }))}
                                  autoComplete="email"
                                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Sitio web" : "Website"}</label>
                                <input
                                  value={details.negocioSitioWeb ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioSitioWeb: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#111111]/55">{lang === "es" ? "Redes sociales" : "Social media"}</p>
                                {(
                                  [
                                    { key: "negocioSocialFacebook" as const, Icon: FaFacebook, lab: lang === "es" ? "Facebook" : "Facebook" },
                                    { key: "negocioSocialInstagram" as const, Icon: FaInstagram, lab: lang === "es" ? "Instagram" : "Instagram" },
                                    { key: "negocioSocialYoutube" as const, Icon: FaYoutube, lab: lang === "es" ? "YouTube" : "YouTube" },
                                    { key: "negocioSocialTiktok" as const, Icon: FaTiktok, lab: lang === "es" ? "TikTok" : "TikTok" },
                                    { key: "negocioSocialWhatsapp" as const, Icon: FaWhatsapp, lab: lang === "es" ? "WhatsApp" : "WhatsApp" },
                                    { key: "negocioSocialX" as const, Icon: FaTwitter, lab: lang === "es" ? "X" : "X" },
                                  ] as const
                                ).map(({ key, Icon, lab }) => (
                                  <div key={key} className="flex items-center gap-2.5">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/10 bg-white text-[#111111]/75" title={lab}>
                                      <Icon className="h-3.5 w-3.5" aria-hidden />
                                    </span>
                                    <input
                                      value={(details as Record<string, string>)[key] ?? ""}
                                      onChange={(e) => setDetails((prev) => ({ ...prev, [key]: e.target.value }))}
                                      className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm"
                                      aria-label={lab}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div>
                                <label className="text-xs text-[#111111]/80">{lang === "es" ? "Idiomas" : "Languages"}</label>
                                <input
                                  value={details.negocioIdiomas ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioIdiomas: e.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          )}
                          </BienesRaicesNegocioPublishShell>
                        </div>
                        </BienesRaicesPublishShell>
                      ) : categoryFromUrl === "rentas" ? (
                        <RentasPublishShell>
                        <div
                          id="publish-basics-rentas-meta"
                          className={cx(
                            "space-y-4",
                            basicsShowValidation && !requirements.rentasMetaOk && "rounded-xl p-2 ring-2 ring-red-500/45"
                          )}
                        >
                          <div className="grid-details grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-[#111111]">
                                {lang === "es" ? "Subcategoría" : "Subcategory"}{" *"}
                              </label>
                              <select
                                value={details.rentasSubcategoria ?? ""}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setDetails((prev) => ({ ...prev, rentasSubcategoria: v, tipoPropiedad: "" }));
                                }}
                                aria-invalid={basicsShowValidation && !details.rentasSubcategoria?.trim()}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                  basicsShowValidation && !details.rentasSubcategoria?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                                )}
                              >
                                <option value="">{lang === "es" ? "Elige una subcategoría…" : "Choose one…"}</option>
                                {RENTAS_SUBCATEGORIES.map((s) => (
                                  <option key={s.key} value={s.key}>
                                    {lang === "es" ? s.label.es : s.label.en}
                                  </option>
                                ))}
                              </select>
                              {!details.rentasSubcategoria?.trim() && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                  {lang === "es" ? "Requerido." : "Required."}
                                </div>
                              )}
                            </div>
                            <div>
                              <label className="text-sm text-[#111111]">
                                {lang === "es" ? "Tipo de propiedad" : "Property type"}{" *"}
                              </label>
                              <select
                                value={details.tipoPropiedad ?? ""}
                                onChange={(e) => setDetails((prev) => ({ ...prev, tipoPropiedad: e.target.value }))}
                                disabled={!details.rentasSubcategoria?.trim()}
                                aria-invalid={basicsShowValidation && !!details.rentasSubcategoria?.trim() && !details.tipoPropiedad?.trim()}
                                className={cx(
                                  "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60",
                                  basicsShowValidation && !!details.rentasSubcategoria?.trim() && !details.tipoPropiedad?.trim()
                                    ? "border-red-500 ring-1 ring-red-500/35"
                                    : "border-black/10"
                                )}
                              >
                                <option value="">{lang === "es" ? "Elige tipo…" : "Choose type…"}</option>
                                {getTipoOptionsForSubcategory(details.rentasSubcategoria ?? "").map((o) => (
                                  <option key={o.value} value={o.value}>
                                    {lang === "es" ? o.label.es : o.label.en}
                                  </option>
                                ))}
                              </select>
                              {!details.tipoPropiedad?.trim() && details.rentasSubcategoria?.trim() && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                  {lang === "es" ? "Requerido." : "Required."}
                                </div>
                              )}
                            </div>
                            {/* Rentas branch/plan set on previous step (rentas-track); show read-only summary */}
                            <div className="sm:col-span-2 rounded-xl border border-[#C9B46A]/25 bg-[#F8F6F0]/60 px-4 py-3">
                              <p className="text-xs font-semibold text-[#111111]/80 uppercase tracking-wide">
                                {lang === "es" ? "Publicando como" : "Posting as"}
                              </p>
                              <p className="mt-1 text-sm font-medium text-[#111111]">
                                {details.rentasBranch === "negocio"
                                  ? (lang === "es" ? "Negocio" : "Business")
                                  : (lang === "es" ? "Privado" : "Private")}
                              </p>
                              <button
                                type="button"
                                onClick={() => goToStep("rentas-track")}
                                className="mt-1 text-xs text-[#111111]/70 hover:underline"
                              >
                                {lang === "es" ? "Cambiar" : "Change"}
                              </button>
                            </div>
                          </div>
                          <div id="publish-basics-title">
                            <label className="text-sm text-[#111111]">{copy.fieldTitle}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">
                              {lang === "es"
                                ? "Un título claro ayuda a que te encuentren."
                                : "A clear title helps people find you."}
                            </p>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={lang === "es" ? "Ej: Apartamento 2 recámaras cerca del centro" : "Ex: 2-bed apartment near downtown"}
                              spellCheck
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              lang={lang === "es" ? "es" : "en"}
                              inputMode="text"
                              aria-invalid={basicsShowValidation && !requirements.titleOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.titleOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.titleOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>
                          <div id="publish-basics-desc">
                            <label className="text-sm text-[#111111]">{copy.fieldDesc}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">
                              {lang === "es"
                                ? "Describe el espacio, servicios incluidos y condiciones."
                                : "Describe the space, utilities included, and conditions."}
                            </p>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder={
                                lang === "es"
                                  ? "Estado del inmueble, qué incluye la renta, reglas, etc."
                                  : "Condition, what's included, rules, etc."
                              }
                              spellCheck
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              lang={lang === "es" ? "es" : "en"}
                              aria-invalid={basicsShowValidation && !requirements.descOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.descOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.descOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>
                          <div id="publish-basics-price">
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Renta mensual" : "Monthly rent"}{" *"}
                            </label>
                            <input
                              value={price}
                              onChange={(e) => setPrice(e.target.value)}
                              placeholder={lang === "es" ? "Ej: 1500" : "Ex: 1500"}
                              aria-invalid={basicsShowValidation && !requirements.priceOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.priceOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.priceOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Agrega la renta mensual." : "Add monthly rent."}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Depósito" : "Deposit"}
                            </label>
                            <input
                              value={details.deposito ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, deposito: e.target.value }))}
                              placeholder={lang === "es" ? "Ej: $1500 / 1 mes" : "e.g. $1500 / 1 month"}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                          </div>
                          <div id="publish-basics-city">
                            <label className="text-sm text-[#111111]">{copy.fieldCity}{" *"}</label>
                            <CityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                              lang={lang}
                              label=""
                              variant="light"
                              className="mt-2"
                              invalid={basicsShowValidation && !requirements.cityOk}
                            />
                            {!requirements.cityOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Agrega tu ciudad." : "Add your city."}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Calles principales o dirección aproximada" : "Main streets or approximate address"}
                            </label>
                            <input
                              value={details.zonaDireccion ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, zonaDireccion: e.target.value }))}
                              placeholder={lang === "es" ? "Ej: Calle A y Calle B, Centro" : "e.g. Street A & Street B, Downtown"}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Fecha disponible" : "Available date"}{" *"}
                            </label>
                            <input
                              value={details.fechaDisponible ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, fechaDisponible: e.target.value }))}
                              placeholder={lang === "es" ? "Ej: Inmediato / 1 de marzo" : "e.g. Immediate / Mar 1"}
                              aria-invalid={basicsShowValidation && !details.fechaDisponible?.trim()}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !details.fechaDisponible?.trim() ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!details.fechaDisponible?.trim() && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Requerido." : "Required."}
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Plazo del contrato" : "Lease term"}
                            </label>
                            <select
                              value={details.plazo_contrato ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, plazo_contrato: e.target.value, plazo_contrato_otro: e.target.value === "otro" ? (prev.plazo_contrato_otro ?? "") : "" }))}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            >
                              <option value="">{lang === "es" ? "Elige…" : "Choose…"}</option>
                              <option value="mes-a-mes">{lang === "es" ? "Mes a mes" : "Month to month"}</option>
                              <option value="6-meses">{lang === "es" ? "6 meses" : "6 months"}</option>
                              <option value="12-meses">{lang === "es" ? "12 meses" : "12 months"}</option>
                              <option value="1-ano">{lang === "es" ? "1 año" : "1 year"}</option>
                              <option value="2-anos">{lang === "es" ? "2 años" : "2 years"}</option>
                              <option value="otro">{lang === "es" ? "Otro" : "Other"}</option>
                            </select>
                            {details.plazo_contrato === "otro" && (
                              <input
                                value={details.plazo_contrato_otro ?? ""}
                                onChange={(e) => setDetails((prev) => ({ ...prev, plazo_contrato_otro: e.target.value }))}
                                placeholder={lang === "es" ? "Ej: 18 meses" : "e.g. 18 months"}
                                className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                              />
                            )}
                          </div>
                          <RentasNegocioPublishShell>
                          {details.rentasBranch === "negocio" && (
                            <>
                              <div className="sm:col-span-2 mt-4 pt-4 border-t border-black/10">
                                <h4 className="text-sm font-semibold text-[#111111] mb-3">
                                  {lang === "es" ? "Identidad del negocio" : "Business identity"}
                                </h4>
                                <p className="text-xs text-[#111111]/70 mb-3">
                                  {lang === "es"
                                    ? "Nombre del negocio es obligatorio. El resto ayuda a dar confianza."
                                    : "Business name is required. The rest helps build trust."}
                                </p>
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Nombre del negocio" : "Business name"}{" *"}
                                </label>
                                <input
                                  value={details.negocioNombre ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioNombre: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Inmobiliaria López" : "e.g. Lopez Realty"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                                {!details.negocioNombre?.trim() && (
                                  <div className="mt-1 text-xs text-[#111111]/40">
                                    {lang === "es" ? "Requerido para negocio." : "Required for business."}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Nombre del agente" : "Agent name"}
                                </label>
                                <input
                                  value={details.negocioAgente ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioAgente: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: María García" : "e.g. Maria Garcia"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Cargo / rol" : "Role / title"}
                                </label>
                                <input
                                  value={details.negocioCargo ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioCargo: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Agente de rentas" : "e.g. Rental agent"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Teléfono de oficina" : "Office phone"}
                                  {details.rentasBranch === "negocio" ? " *" : ""}
                                </label>
                                <input
                                  value={details.negocioTelOficina ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioTelOficina: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: (408) 555-0100" : "e.g. (408) 555-0100"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                                {details.rentasBranch === "negocio" && (details.negocioTelOficina ?? "").replace(/\D/g, "").length !== 10 && (details.negocioTelOficina ?? "").length > 0 && (
                                  <div className="mt-1 text-xs text-[#111111]/40">
                                    {lang === "es" ? "Requerido: 10 dígitos." : "Required: 10 digits."}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Sitio web" : "Website"}
                                </label>
                                <input
                                  type="url"
                                  value={details.negocioSitioWeb ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioSitioWeb: e.target.value }))}
                                  placeholder="https://"
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Redes sociales" : "Social links"}
                                </label>
                                <input
                                  value={details.negocioRedes ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioRedes: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Facebook: url, Instagram: url" : "e.g. Facebook: url, Instagram: url"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">{lang === "es" ? "Logo del negocio" : "Business logo"}</label>
                                <div className="mt-2 flex items-center gap-3">
                                  <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
                                    {logoUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir imagen" : "Upload image")}
                                    <input type="file" accept="image/*" className="sr-only" disabled={logoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "logo"); e.target.value = ""; }} />
                                  </label>
                                  {details.negocioLogoUrl ? <img src={details.negocioLogoUrl} alt="" className="h-14 w-14 rounded-lg border border-black/10 object-cover bg-white" /> : null}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">{lang === "es" ? "Foto del agente" : "Agent photo"}</label>
                                <div className="mt-2 flex items-center gap-3">
                                  <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
                                    {agentPhotoUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir imagen" : "Upload image")}
                                    <input type="file" accept="image/*" className="sr-only" disabled={agentPhotoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "agent"); e.target.value = ""; }} />
                                  </label>
                                  {details.negocioFotoAgenteUrl ? <img src={details.negocioFotoAgenteUrl} alt="" className="h-14 w-14 rounded-lg border border-black/10 object-cover bg-white" /> : null}
                                </div>
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Idiomas" : "Languages"}
                                </label>
                                <input
                                  value={details.negocioIdiomas ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioIdiomas: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Español, inglés" : "e.g. Spanish, English"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Horario de atención" : "Business hours"}
                                </label>
                                <input
                                  value={details.negocioHorario ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioHorario: e.target.value }))}
                                  placeholder={lang === "es" ? "Ej: Lun–Vie 9am–6pm" : "e.g. Mon–Fri 9am–6pm"}
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-[#111111]">
                                  {lang === "es" ? "Recorrido virtual (URL)" : "Virtual tour (URL)"}
                                </label>
                                <input
                                  type="url"
                                  value={details.negocioRecorridoVirtual ?? ""}
                                  onChange={(e) => setDetails((prev) => ({ ...prev, negocioRecorridoVirtual: e.target.value }))}
                                  placeholder="https://"
                                  className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                />
                              </div>
                              {((details.rentasTier ?? "").trim() === "business_plus" || (details.rentasTier ?? "").trim() === "negocio" || (details.bienesRaicesBranch ?? "").trim() === "negocio") && (
                                <div className="sm:col-span-2">
                                  <label className="flex items-center gap-2 text-sm text-[#111111]">
                                    <input
                                      type="checkbox"
                                      checked={(details.negocioPlusMasAnuncios ?? "") === "si"}
                                      onChange={(e) => setDetails((prev) => ({ ...prev, negocioPlusMasAnuncios: e.target.checked ? "si" : "" }))}
                                      className="rounded border-black/20"
                                    />
                                    {lang === "es" ? "Más anuncios de esta empresa" : "More listings from this company"}
                                  </label>
                                </div>
                              )}
                            </>
                          )}
                          </RentasNegocioPublishShell>
                        </div>
                        </RentasPublishShell>
                      ) : (
                        <>
                          <div id="publish-basics-title">
                            <label className="text-sm text-[#111111]">{copy.fieldTitle}</label>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={lang === "es" ? "Ej: Sofá en excelente condición" : "Ex: Great-condition sofa"}
                              aria-invalid={basicsShowValidation && !requirements.titleOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.titleOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.titleOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div id="publish-basics-desc">
                            <label className="text-sm text-[#111111]">{copy.fieldDesc}</label>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder={
                                lang === "es"
                                  ? "Describe el estado, medidas, entrega, etc."
                                  : "Describe condition, size, pickup/delivery, etc."
                              }
                              rows={5}
                              aria-invalid={basicsShowValidation && !requirements.descOk}
                              className={cx(
                                "mt-2 w-full rounded-xl border bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30",
                                basicsShowValidation && !requirements.descOk ? "border-red-500 ring-1 ring-red-500/35" : "border-black/10"
                              )}
                            />
                            {!requirements.descOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2" id="publish-basics-price">
                              <label className="text-sm text-[#111111]">{copy.fieldPrice}</label>
                              <input
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={isFree}
                                placeholder={lang === "es" ? "Ej: 120" : "Ex: 120"}
                                aria-invalid={basicsShowValidation && !requirements.priceOk}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2",
                                  isFree
                                    ? "border-white/5 bg-[#F5F5F5] text-[#111111]"
                                    : basicsShowValidation && !requirements.priceOk
                                      ? "border-red-500 ring-1 ring-red-500/35 bg-white/9 focus:ring-yellow-400/30"
                                      : "border-black/10 bg-white/9 focus:ring-yellow-400/30"
                                )}
                              />
                              {!requirements.priceOk && (
                                <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                  {lang === "es" ? "Agrega un precio o marca Gratis." : "Add a price or mark Free."}
                                </div>
                              )}
                            </div>

                            <div className="sm:col-span-1">
                              <label className="text-sm text-[#111111]">{copy.freeToggle}</label>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsFree((v) => !v);
                                  if (!isFree) setPrice("");
                                }}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-sm font-semibold",
                                  isFree
                                    ? "border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111]"
                                    : "border-black/10 bg-white/9 text-[#111111] hover:bg-white/12"
                                )}
                              >
                                {isFree ? (lang === "es" ? "Sí, es Gratis" : "Yes, it's Free") : lang === "es" ? "No" : "No"}
                              </button>
                            </div>
                          </div>

                          <div id="publish-basics-city">
                            <CityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                              lang={lang}
                              label={copy.fieldCity}
                              variant="light"
                              className="mt-0"
                              invalid={basicsShowValidation && !requirements.cityOk}
                            />
                            {!requirements.cityOk && (
                              <div className={cx("mt-1 text-xs", basicsShowValidation ? "text-red-600" : "text-[#111111]/40")}>
                                {lang === "es" ? "Agrega tu ciudad." : "Add your city."}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {basicsShowValidation && !basicsOk && missingBasicsRequirementsText && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2 text-sm text-red-800" role="alert">
                        {missingBasicsRequirementsText}
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleBack()}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                          {copy.back}
                        </button>
                      <button
                        type="button"
                        disabled={saveProgressing}
                        onClick={() => void handleSaveProgress()}
                        className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCurrentDraft()}
                        className="rounded-xl border border-red-600/40 bg-red-50/80 hover:bg-red-100/80 text-red-800 font-semibold px-4 py-2.5 text-sm"
                      >
                        {copy.deleteApplication}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!basicsOk) {
                            setPublishNextAttempted((prev) => ({ ...prev, basics: true }));
                            requestAnimationFrame(() => {
                              const id = getFirstBasicsInvalidElementId();
                              document.getElementById(id ?? "")?.scrollIntoView({ behavior: "smooth", block: "center" });
                            });
                            return;
                          }
                          setPublishNextAttempted((prev) => ({ ...prev, basics: false }));
                          goToStep(isEnVentaFlow ? "media" : "details");
                        }}
                        className="rounded-xl font-semibold px-5 py-3 bg-yellow-500/90 hover:bg-yellow-500 text-black"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* DETAILS — only for categories that include details in their step flow (e.g. Rentas). BR has no details step. */}
                {step === "details" && stepsForCategory.includes("details") && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.detailsTitle}</h2>
                    <p className="mt-2 text-sm text-[#111111]">
                      {lang === "es"
                        ? "Estos detalles ayudan a que tu anuncio se vea como en las mejores plataformas. Solo llena lo que aplica."
                        : "These details help your listing look like the top platforms. Fill only what applies."}
                    </p>

                    <div className="mt-4 rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                      <div className="text-sm text-[#111111]">
                        {lang === "es" ? "Categoría:" : "Category:"}{" "}
                        <span className="text-[#111111]/90 font-semibold">{categoryFromUrl}</span>
                      </div>

                      {getCategoryFields(categoryFromUrl, details).length === 0 ? (
                        <div className="mt-3 text-sm text-[#111111]/55">
                          {lang === "es"
                            ? "Por ahora no hay campos extra para esta categoría."
                            : "No extra fields for this category yet."}
                        </div>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {getCategoryFields(categoryFromUrl, details).map((f) => {
                            const v = details[f.key] ?? "";
                            const label = f.label[lang];
                            const placeholder = f.placeholder ? f.placeholder[lang] : undefined;

                            if (f.type === "select" && f.options) {
                              return (
                                <label key={f.key} className="block">
                                  <div className="text-xs text-[#111111] mb-1">{label}</div>
                                  <select
                                    value={v}
                                    onChange={(e) =>
                                      setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                    }
                                    className="w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] outline-none focus:border-white/20"
                                  >
                                    <option value="">{lang === "es" ? "Selecciona…" : "Select…"}</option>
                                    {f.options.map((o) => (
                                      <option key={o.value} value={o.value}>
                                        {o.label[lang]}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              );
                            }

                            if (categoryFromUrl === "bienes-raices" && f.key === "comodidades") {
                              const parts = (v || "").split(/,/).map((s) => s.trim()).filter(Boolean);
                              const toggle = (opt: { es: string; en: string }) => {
                                const token = opt[lang];
                                const has = parts.some((p) => p.toLowerCase() === token.toLowerCase());
                                const next = has ? parts.filter((p) => p.toLowerCase() !== token.toLowerCase()) : [...parts, token];
                                setDetails((prev) => ({ ...prev, comodidades: next.join(", ") }));
                              };
                              return (
                                <div key={f.key} className="sm:col-span-2">
                                  <div className="text-xs text-[#111111] mb-1">{label}</div>
                                  <p className="text-[10px] text-[#111111]/60 mb-2">
                                    {lang === "es" ? "Toca para agregar o quitar." : "Tap to add or remove."}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {BR_COMODIDADES_OPTIONS.map((opt) => {
                                      const token = opt[lang];
                                      const selected = parts.some((p) => p.toLowerCase() === token.toLowerCase());
                                      return (
                                        <button
                                          key={token}
                                          type="button"
                                          onClick={() => toggle(opt)}
                                          className={cx(
                                            "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                                            selected
                                              ? "border-[#C9B46A]/60 bg-[#F8F6F0] text-[#111111]"
                                              : "border-black/15 bg-white/80 text-[#111111]/70 hover:border-black/25 hover:bg-white"
                                          )}
                                        >
                                          {token}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <input
                                    value={v}
                                    onChange={(e) =>
                                      setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                    }
                                    placeholder={placeholder}
                                    className="w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] placeholder:text-[#111111]/30 outline-none focus:border-white/20"
                                  />
                                </div>
                              );
                            }

                            return (
                              <label key={f.key} className="block">
                                <div className="text-xs text-[#111111] mb-1">{label}</div>
                                <input
                                  value={v}
                                  onChange={(e) =>
                                    setDetails((prev) => ({ ...prev, [f.key]: e.target.value }))
                                  }
                                  inputMode={f.type === "number" ? "numeric" : undefined}
                                  placeholder={placeholder}
                                  className="w-full rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2 text-sm text-[#111111] placeholder:text-[#111111]/30 outline-none focus:border-white/20"
                                />
                              </label>
                            );
                          })}
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        {category !== "rentas" && (
                          <button
                            type="button"
                            onClick={() => setDetails({})}
                            className="text-xs text-[#111111] hover:text-[#111111]"
                          >
                            {lang === "es" ? "Limpiar detalles" : "Clear details"}
                          </button>
                        )}
                        <div className="text-xs text-[#111111]/40">
                          {lang === "es"
                            ? "Estos detalles se guardan automáticamente."
                            : "These details are saved automatically."}
                        </div>
                      </div>
                    </div>

<div className="mt-5 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => { if (category === "servicios" && !servicesPackage) { setShowServicesGate(true); return; } handleBack(); }}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                        {copy.back}
                      </button>
                      <button
                        type="button"
                        disabled={saveProgressing}
                        onClick={() => void handleSaveProgress()}
                        className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                      >
                        {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCurrentDraft()}
                        className="rounded-xl border border-red-600/40 bg-red-50/80 hover:bg-red-100/80 text-red-800 font-semibold px-4 py-2.5 text-sm"
                      >
                        {copy.deleteApplication}
                      </button>
                      <button
                        type="button"
                        onClick={() => goToStep("media")}
                        className="rounded-xl bg-yellow-500/90 hover:bg-yellow-500 text-black font-semibold px-5 py-3"
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* MEDIA + CONTACT + PREVIEW */}
                {step === "media" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.mediaTitle}</h2>

                    <div className="mt-4 grid gap-5">
                      <MediaUploader
                        images={images}
                        onImagesChange={setImages}
                        videoFiles={videoFiles}
                        onVideoChange={(idx, f) => {
                          setVideoFiles((prev) => {
                            const n: [File | null, File | null] = [...prev];
                            n[idx] = f;
                            return n;
                          });
                          setVideoErrors((prev) => { const n: [string, string] = [...prev]; n[idx] = ""; return n; });
                          setVideoThumbBlobs((prev) => { const n: [Blob | null, Blob | null] = [...prev]; n[idx] = null; return n; });
                          if (f) inspectAndThumbVideo(f, idx);
                        }}
                        onVideoRemove={(idx) => {
                          setVideoFiles((prev) => { const n: [File | null, File | null] = [...prev]; n[idx] = null; return n; });
                          setVideoThumbBlobs((prev) => { const n: [Blob | null, Blob | null] = [...prev]; n[idx] = null; return n; });
                          setVideoErrors((prev) => { const n: [string, string] = [...prev]; n[idx] = ""; return n; });
                        }}
                        isPro={effectiveIsPro}
                        maxImages={maxImages}
                        lang={lang}
                        uploadProgress={uploadProgress}
                        videoPreviewUrls={proVideoPreviewUrls}
                        videoErrors={videoErrors}
                        proUpgradeHref={
                          categoryFromUrl === "en-venta"
                            ? `/clasificados/publicar/en-venta/pro?lang=${lang}&return=${encodeURIComponent(
                                `${pathname ?? "/clasificados/publicar/en-venta"}?lang=${lang}&step=media&fromPro=1`
                              )}`
                            : undefined
                        }
                        onBeforeProNavigate={categoryFromUrl === "en-venta" ? saveDraftAndImagesForProReturn : undefined}
                        maxVideos={categoryFromUrl === "bienes-raices" ? 1 : (isRentasPrivado ? 1 : 2)}
                        copy={{
                          addImages: copy.addImages,
                          addVideo: copy.addVideo,
                          video: isRentasPrivado ? (copy as { rentasPrivadoVideo?: string }).rentasPrivadoVideo : copy.video,
                          videoHint: isRentasPrivado ? (copy as { rentasPrivadoVideoHint?: string }).rentasPrivadoVideoHint : copy.videoHint,
                          images: copy.images,
                        }}
                      />

                      {/* BR Negocio media links in Media + Contacto (active user-facing flow). */}
                      {categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio" && (
                        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 space-y-3">
                          <h4 className="text-sm font-semibold text-[#111111]">
                            {lang === "es" ? "Medios de la propiedad (Negocio)" : "Property media (Business)"}
                          </h4>
                          <div>
                            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Video de la propiedad (URL)" : "Property video (URL)"}</label>
                            <input
                              type="url"
                              value={details.enVentaVideoUrl ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, enVentaVideoUrl: e.target.value }))}
                              placeholder="https://"
                              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Tour virtual (URL)" : "Virtual tour (URL)"}</label>
                            <input
                              type="url"
                              value={details.negocioRecorridoVirtual ?? details.enVentaVirtualTourUrl ?? ""}
                              onChange={(e) =>
                                setDetails((prev) => ({
                                  ...prev,
                                  negocioRecorridoVirtual: e.target.value,
                                  enVentaVirtualTourUrl: e.target.value,
                                }))
                              }
                              placeholder="https://"
                              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                      )}

                      {/* BR Negocio: Floorplan (URL) for top-half media tiles. */}
                      {categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio" && (
                        <div className="rounded-2xl border border-black/10 bg-white/60 p-4">
                          <label className="text-sm text-[#111111] font-semibold">
                            {lang === "es" ? "Plano / Floorplan" : "Floorplan"}
                          </label>
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <label className="shrink-0 cursor-pointer rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFE7D8] focus-within:ring-2 focus-within:ring-yellow-400/30">
                              {floorPlanUploading ? (lang === "es" ? "Subiendo…" : "Uploading…") : (lang === "es" ? "Subir plano" : "Upload floorplan")}
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf"
                                className="sr-only"
                                disabled={floorPlanUploading}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadBusinessFloorPlan(f);
                                  e.target.value = "";
                                }}
                              />
                            </label>
                            {details.negocioFloorPlanUrl ? (
                              (() => {
                                const u = (details.negocioFloorPlanUrl ?? "").trim();
                                if (isFloorplanUrlProbablyPdf(u)) {
                                  return (
                                    <a
                                      href={u}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-[#F5F5F5] px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                                    >
                                      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#111111]/80">PDF</span>
                                      {lang === "es" ? "Abrir archivo PDF" : "Open PDF file"}
                                    </a>
                                  );
                                }
                                if (isFloorplanUrlProbablyImage(u)) {
                                  return (
                                    <a
                                      href={u}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 rounded-lg border border-black/10 bg-white p-1.5 pr-2 hover:bg-[#F8F6F0] transition"
                                    >
                                      <img src={u} alt="" className="h-14 w-20 rounded object-cover bg-[#E8E8E8]" />
                                      <span className="text-xs font-medium text-[#111111] underline decoration-[#C9B46A]/70">
                                        {lang === "es" ? "Ver imagen" : "View image"}
                                      </span>
                                    </a>
                                  );
                                }
                                return (
                                  <a
                                    href={u}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-[#111111] underline decoration-[#C9B46A]/70"
                                  >
                                    {lang === "es" ? "Abrir archivo" : "Open file"}
                                  </a>
                                );
                              })()
                            ) : null}
                          </div>
                          <input
                            type="url"
                            value={details.negocioFloorPlanUrl ?? ""}
                            onChange={(e) => setDetails((prev) => ({ ...prev, negocioFloorPlanUrl: e.target.value }))}
                            placeholder="https://"
                            className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                          />
                          {details.negocioFloorPlanUrl &&
                          !floorPlanUploading &&
                          (() => {
                            const u = (details.negocioFloorPlanUrl ?? "").trim();
                            if (!u || u.startsWith("blob:")) return null;
                            if (isFloorplanUrlProbablyImage(u)) {
                              return (
                                <div className="mt-3 rounded-lg border border-black/10 bg-[#E8E8E8]/50 p-2">
                                  <img src={u} alt="" className="max-h-40 w-full rounded object-contain bg-white" />
                                </div>
                              );
                            }
                            if (isFloorplanUrlProbablyPdf(u)) {
                              return (
                                <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-black/15 bg-white/80 px-3 py-2 text-xs text-[#111111]/80">
                                  <span className="rounded bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] font-bold uppercase">PDF</span>
                                  {lang === "es"
                                    ? "Archivo PDF: usa “Abrir archivo PDF” arriba para verlo."
                                    : "PDF file: use “Open PDF file” above to view it."}
                                </div>
                              );
                            }
                            return (
                              <p className="mt-3 text-xs text-[#111111]/60">
                                {lang === "es"
                                  ? "Enlace guardado. Usa “Abrir archivo” arriba si la vista previa no aplica."
                                  : "Link saved. Use “Open file” above if no inline preview applies."}
                              </p>
                            );
                          })()}
                          <p className="mt-1 text-xs text-[#111111]/50">
                            {lang === "es"
                              ? "Sube imagen/PDF o pega enlace. (Se abrirá en nueva pestaña.)"
                              : "Upload image/PDF or paste URL. (Opens in a new tab.)"}
                          </p>
                        </div>
                      )}

                        {!requirements.imagesOk && (
                          <div className="mt-1 text-xs text-[#111111]/40">
                            {lang === "es" ? "Requerido: mínimo 1 foto." : "Required: at least 1 photo."}
                          </div>
                        )}

                        {!(categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() === "negocio") && (
                          <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                            <div className="text-sm text-[#111111]">{copy.contact}</div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {([
                                ["phone", copy.phone],
                                ["email", copy.email],
                                ["both", copy.both],
                              ] as const).map(([value, label]) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setContactMethod(value)}
                                  className={cx(
                                    "rounded-xl border px-3 py-2 text-sm font-semibold",
                                    contactMethod === value
                                      ? "border-[#C9B46A]/50 bg-[#F8F6F0] text-[#111111]"
                                      : "border-black/10 bg-[#F5F5F5] text-[#111111] hover:bg-[#EFEFEF]"
                                  )}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(contactMethod === "phone" || contactMethod === "both") && (
                                <div>
                                  <label className="text-xs text-[#111111]">{copy.phone}</label>
                                  <input
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(formatPhoneDisplay(e.target.value))}
                                    placeholder="(408) 555-1234"
                                    className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                  />
                                  {!requirements.phoneOk && (
                                    <div className="mt-1 text-xs text-red-600">
                                      {lang === "es" ? "Agrega un teléfono válido (10 dígitos)." : "Add a valid phone (10 digits)."}
                                    </div>
                                  )}
                                </div>
                              )}

                              {(contactMethod === "email" || contactMethod === "both") && (
                                <div>
                                  <label className="text-xs text-[#111111]">{copy.email}</label>
                                  <input
                                    value={contactEmail}
                                    onChange={(e) => setContactEmail(e.target.value)}
                                    placeholder={lang === "es" ? "Ej: nombre@email.com" : "Ex: name@email.com"}
                                    className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                  />
                                  {!requirements.emailOk && (
                                    <div className="mt-1 text-xs text-red-600">
                                      {lang === "es" ? "Agrega un email válido." : "Add a valid email."}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Preview */}
                      <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-[#111111]">{copy.preview}</div>
                          <div className="text-xs text-[#111111]/40">
                            {lang === "es" ? "Así se verá tu anuncio" : "This is how your listing will look"}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
                          {/* Left: compact feed card — Zillow-style for BR private only */}
                          {categoryFromUrl === "bienes-raices" && (details.bienesRaicesBranch ?? "").trim().toLowerCase() !== "negocio" ? (
                            <div className="max-w-[280px] lg:max-w-none">
                              <div className="text-[10px] text-[#111111]/50 uppercase tracking-wide mb-1.5">{copy.cardPreview}</div>
                              <article className="rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm">
                                <div className="relative h-36 w-full overflow-hidden bg-[#E8E8E8] flex items-center justify-center rounded-t-xl">
                                  {coverImage ? (
                                    <img src={coverImage} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex items-center justify-center text-[#111111]/45 text-xs px-2 text-center">
                                      {lang === "es" ? "Tu foto principal aparecerá aquí" : "Your main photo will appear here"}
                                    </div>
                                  )}
                                </div>
                                <div className="p-4">
                                  <div className="rounded-lg bg-[#F8F6F0]/70 pl-0 pr-2.5 py-2.5 mb-4">
                                    <div className="text-lg font-extrabold text-[#111111] leading-tight tracking-tight">
                                      {formatMoneyMaybe(previewPrice, lang) || formatListingPrice(previewPrice, { lang, isFree: false })}
                                    </div>
                                  </div>
                                  {(() => {
                                    const d = details;
                                    type Fact = { type: "bed"; value: string } | { type: "bath"; value: string } | { type: "sqft"; value: string; label: string } | { type: "posted" };
                                    const parts: Fact[] = [];
                                    const br = (d.enVentaBedrooms ?? "").trim();
                                    if (br) parts.push({ type: "bed", value: br });
                                    const ba = (d.enVentaBathrooms ?? "").trim();
                                    if (ba) parts.push({ type: "bath", value: ba });
                                    const sqRaw = (d.enVentaSquareFeet ?? "").trim();
                                    if (sqRaw) {
                                      const sqNum = sqRaw.replace(/[^0-9]/g, "");
                                      const sqDisplay = sqNum && Number.isFinite(Number(sqNum)) ? Number(sqNum).toLocaleString(lang === "es" ? "es-US" : "en-US") : sqRaw;
                                      parts.push({ type: "sqft", value: sqDisplay, label: lang === "es" ? "pies²" : "sq ft" });
                                    }
                                    parts.push({ type: "posted" });
                                    const iconClass = "w-3.5 h-3.5 text-[#111111]/50 flex-shrink-0";
                                    return parts.length > 0 ? (
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1.5 text-[11px] leading-relaxed">
                                        {parts.map((p, i) => (
                                          <span key={i} className="inline-flex items-center gap-1.5">
                                            {i > 0 && <span className="text-[#111111]/30 select-none" aria-hidden>·</span>}
                                            {p.type === "posted" ? (
                                              <span className="text-[#111111]/65">{previewPosted}</span>
                                            ) : p.type === "bed" ? (
                                              <><MdOutlineBed className={iconClass} aria-hidden /><span className="font-bold text-[#111111]">{p.value}</span></>
                                            ) : p.type === "bath" ? (
                                              <><MdOutlineBathtub className={iconClass} aria-hidden /><span className="font-bold text-[#111111]">{p.value}</span></>
                                            ) : (
                                              <><MdOutlineSquareFoot className={iconClass} aria-hidden /><span className="font-bold text-[#111111]">{p.value}</span><span className="text-[#111111]/70">{p.label}</span></>
                                            )}
                                          </span>
                                        ))}
                                      </div>
                                    ) : null;
                                  })()}
                                  {(() => {
                                    const addr = (details.enVentaAddress ?? "").trim();
                                    const zone = (details.enVentaZone ?? "").trim();
                                    const city = previewCity;
                                    const mainLine = addr ? addr : (zone ? `${zone}, ${city}` : city);
                                    if (!mainLine) return null;
                                    return (
                                      <div className="mt-1.5 space-y-0.5">
                                        <p className="text-[11px] font-medium text-[#111111]/70 leading-snug">{mainLine}</p>
                                        {zone ? (
                                          <p className="text-[10px] text-[#111111]/55 leading-snug">
                                            {lang === "es" ? "Vecindad: " : "Neighborhood: "}{zone}
                                          </p>
                                        ) : null}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </article>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-black/10 bg-white overflow-hidden shadow-sm max-w-[280px] lg:max-w-none">
                              <div className="text-[10px] text-[#111111]/50 uppercase tracking-wide mb-1.5">{copy.cardPreview}</div>
                              <div className="relative rounded-lg border border-black/10 overflow-hidden bg-[#E8E8E8] h-48 flex items-center justify-center">
                                {coverImage ? (
                                  <img src={coverImage} alt="" className="max-h-full max-w-full w-full object-contain" />
                                ) : (
                                  <div className="flex items-center justify-center text-[#111111]/45 text-xs px-3 text-center h-full">
                                    {lang === "es" ? "Tu foto principal aparecerá aquí" : "Your main photo will appear here"}
                                  </div>
                                )}
                                <span className="absolute top-1.5 right-1.5 rounded-full border border-black/10 bg-white/95 px-2 py-0.5 text-[9px] font-semibold text-[#111111]">
                                  {copy.saveLabel}
                                </span>
                              </div>
                              <div className="p-2">
                                <div className="text-sm font-semibold text-[#111111]">{formatListingPrice(previewPrice, { lang, isFree: enVentaSnapshot.isFree })}</div>
                                <h3 className="mt-0.5 text-xs font-semibold text-[#111111] line-clamp-2 leading-tight">{previewTitle}</h3>
                                <div className="mt-0.5 text-[10px] text-[#111111]/55">
                                  {previewCity} · {previewPosted}
                                </div>
                                {previewShortDescription ? (
                                  <p className="mt-1.5 text-[10px] text-[#111111]/75 line-clamp-2">{previewShortDescription}</p>
                                ) : null}
                              </div>
                            </div>
                          )}

                          {/* Right: summary + launcher */}
                          <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4 flex flex-col">
                            <div className="text-[10px] text-[#111111]/50 uppercase tracking-wide mb-2">{copy.detailPreview}</div>

                            <div className="rounded-lg border border-black/10 overflow-hidden bg-[#E8E8E8] h-40 flex items-center justify-center mb-3">
                              {coverImage ? (
                                <img src={coverImage} alt="" className="max-h-full max-w-full w-full object-contain" />
                              ) : (
                                <div className="flex items-center justify-center text-[#111111]/45 text-xs px-3 text-center h-full">
                                  {lang === "es" ? "La vista detallada mostrará tu foto principal aquí" : "The detail view will show your main photo here"}
                                </div>
                              )}
                            </div>

                            <h2 className="text-base font-semibold text-[#111111] leading-snug">{previewTitle}</h2>
                            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm">
                              <span className="font-semibold text-[#111111]">{formatListingPrice(previewPrice, { lang, isFree: enVentaSnapshot.isFree })}</span>
                              <span className="text-[#111111]/40">·</span>
                              <span className="text-[#111111]/80">{previewCity}</span>
                              <span className="text-[#111111]/40">·</span>
                              <span className="text-[#111111]/60 text-xs">{previewPosted}</span>
                            </div>
                            {previewCategoryLabel ? (
                              <span className="mt-2 inline-block rounded-md border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-[#111111]/80">
                                {previewCategoryLabel}
                              </span>
                            ) : null}
                            {categoryFromUrl === "bienes-raices" && (details.bienesRaicesSubcategoria ?? "").trim() ? (
                              <p className="mt-2 text-xs font-medium text-[#111111]">
                                {lang === "es" ? "Tipo de propiedad:" : "Property type:"}{" "}
                                <span className="font-semibold">{getBienesRaicesSubcategoryLabel(details.bienesRaicesSubcategoria.trim(), lang)}</span>
                              </p>
                            ) : null}

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-medium text-[#111111]">
                                {copy.saveLabel}
                              </span>
                              <span className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[10px] font-medium text-[#111111]">
                                {copy.shareLabel}
                              </span>
                              <span className="rounded-full border border-[#C9B46A]/40 bg-[#F8F6F0] px-2.5 py-1 text-[10px] font-semibold text-[#111111]">
                                {copy.contactLabel}
                              </span>
                            </div>

                            {previewDetailPairs.length > 0 && (categoryFromUrl === "bienes-raices" && isBienesRaicesPrivado ? (
                              <>
                                {compactBrPrivateDetailPairs.length > 0 && (
                                  <div className="mt-3 rounded-lg border border-black/10 bg-white p-3 sm:hidden space-y-2.5">
                                    <div className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide">
                                      {lang === "es" ? "Resumen" : "Summary"}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      {compactBrPrivateDetailPairs.map((p) => (
                                        <div key={p.label} className="flex flex-col gap-0.5">
                                          <span className="text-[10px] text-[#111111]/55">{p.label}</span>
                                          <span className="text-xs font-medium text-[#111111]">{p.value}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5 hidden sm:block">
                                  <div className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide mb-1.5">
                                    {lang === "es" ? "Detalles" : "Details"}
                                  </div>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                    {previewDetailPairs.map((p) => (
                                      <div key={p.label}>
                                        <span className="text-[#111111]/55">{p.label}</span>
                                        <span className="ml-1 font-medium text-[#111111]">{p.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5">
                                <div className="text-[10px] font-semibold text-[#111111]/70 uppercase tracking-wide mb-1.5">
                                  {lang === "es" ? "Detalles" : "Details"}
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                  {previewDetailPairs.map((p) => (
                                    <div key={p.label}>
                                      <span className="text-[#111111]/55">{p.label}</span>
                                      <span className="ml-1 font-medium text-[#111111]">{p.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5">
                              <p className="text-xs text-[#111111] line-clamp-3 whitespace-pre-wrap">
                                {previewShortDescription || previewDescription || (lang === "es" ? "(Sin descripción)" : "(No description)")}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/10 flex flex-col gap-2">
                              {isRentasPrivado ? (
                                <button
                                  type="button"
                                  onClick={openFullPreview}
                                  className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                >
                                  {lang === "es" ? "Vista previa" : "Preview"}
                                </button>
                              ) : isBienesRaicesNegocio ? (
                                <button
                                  type="button"
                                  onClick={openFullPreview}
                                  className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                >
                                  {lang === "es" ? "Vista previa" : "Preview"}
                                </button>
                              ) : isBienesRaicesPrivado ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    openFullPreview();
                                  }}
                                  className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                >
                                  {(copy as { viewYourListingCta?: string }).viewYourListingCta ?? (lang === "es" ? "Ver tu anuncio" : "View your listing")}
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={openFullPreview}
                                    className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                  >
                                    {copy.fullPreviewCta}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={openProPreview}
                                    className="w-full rounded-xl border border-[#111111]/20 bg-white py-2.5 text-sm font-semibold text-[#111111]/90 hover:bg-[#F5F5F5] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                                  >
                                    {copy.proPreviewCta}
                                  </button>
                                </>
                              )}
                            </div>

                            {isPro && (videoFiles[0] || (!isRentasPrivado && videoFiles[1])) && (
                              <div className="mt-4 rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
                                <div className="text-sm font-semibold text-yellow-200">
                                  {lang === "es" ? "Videos (Pro)" : "Pro Videos"}
                                </div>
                                <div className="mt-1 text-xs text-[#111111]">
                                  {lang === "es"
                                    ? "Toque la miniatura para reproducir. No se reproduce automáticamente."
                                    : "Tap the thumbnail to play. No autoplay."}
                                </div>
                                <div className="mt-3 space-y-3">
                                  {(isRentasPrivado ? [0] : [0, 1]).map((idx) => {
                                    if (!videoFiles[idx] || videoErrors[idx]) return null;
                                    const thumb = proVideoThumbPreviewUrls[idx];
                                    const src = proVideoPreviewUrls[idx];
                                    const expanded = expandedVideoIndex === idx;
                                    return (
                                      <div key={idx} className="rounded-xl border border-black/10 overflow-hidden bg-[#1a1a1a]">
                                        <div className="text-[10px] font-medium text-white/70 px-2 py-1">
                                          {lang === "es" ? `Video ${idx + 1}` : `Video ${idx + 1}`}
                                        </div>
                                        {expanded ? (
                                          <video
                                            className="w-full aspect-video bg-black"
                                            controls
                                            preload="none"
                                            playsInline
                                            poster={thumb || undefined}
                                            src={src || undefined}
                                          />
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => setExpandedVideoIndex(idx as 0 | 1)}
                                            className="group relative block w-full overflow-hidden rounded-b-xl border-0"
                                            aria-label={lang === "es" ? "Reproducir video" : "Play video"}
                                          >
                                            {thumb ? (
                                              <img src={thumb} alt="" className="h-auto w-full object-cover opacity-95 group-hover:opacity-100" loading="lazy" />
                                            ) : (
                                              <div className="aspect-video flex items-center justify-center text-white/60">🎥</div>
                                            )}
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                              <div className="rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm font-semibold text-[#111111]">
                                                {lang === "es" ? "▶ Reproducir" : "▶ Play"}
                                              </div>
                                            </div>
                                          </button>
                                        )}
                                        {expanded && (
                                          <button
                                            type="button"
                                            onClick={() => setExpandedVideoIndex(null)}
                                            className="w-full py-1.5 text-xs text-white/70 hover:text-white"
                                          >
                                            {lang === "es" ? "Cerrar" : "Close"}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {publishError && (
                        <div
                          className="rounded-xl p-4 text-sm"
                          style={{ background: "#ffe5e5", border: "2px solid red", color: "#b00020" }}
                          role="alert"
                        >
                          <div className="font-semibold">❌ {copy.errorTitle}</div>
                          <div className="mt-1">{publishError}</div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-col gap-1">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rulesConfirmed}
                            onChange={(e) => setRulesConfirmedPersisted(e.target.checked)}
                            className="mt-1 rounded border-black/20"
                          />
                          <span className="text-sm text-[#111111]">
                            {copy.rulesConfirm}
                            {" "}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setShowRulesModal(true); }}
                              className="text-[#A98C2A] hover:text-[#8f7a24] underline font-medium"
                            >
                              {lang === "es" ? "Ver reglas" : "View rules"}
                            </button>
                          </span>
                        </label>
                      </div>

                      <label className="mt-3 flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          id="confirmPreview"
                          checked={previewViewed}
                          onChange={(e) => setPreviewViewed(e.target.checked)}
                          className="mt-1 rounded border-black/20 text-[#C9B46A] focus:ring-yellow-400/30"
                        />
                        <span className="text-sm text-[#111111]">
                          {lang === "es" ? "Confirmo que revisé mi anuncio y que toda la información es correcta." : "I confirm I reviewed my listing and all information is correct."}
                        </span>
                      </label>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleBack()}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                          {copy.back}
                        </button>
                        <button
                          type="button"
                          disabled={saveProgressing}
                          onClick={() => void handleSaveProgress()}
                          className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                        >
                          {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDeleteCurrentDraft()}
                          className="rounded-xl border border-red-600/40 bg-red-50/80 hover:bg-red-100/80 text-red-800 font-semibold px-4 py-2.5 text-sm"
                        >
                          {copy.deleteApplication}
                        </button>
                        <button
                          type="button"
                          disabled={publishing || !requirements.allOk || !previewViewed || !rulesConfirmed}
                          onClick={publish}
                          className={cx(
                            "rounded-xl font-semibold px-6 py-3",
                            publishing || !requirements.allOk || !previewViewed || !rulesConfirmed
                              ? "bg-yellow-500/40 text-black/70 cursor-not-allowed"
                              : "bg-yellow-500/90 hover:bg-yellow-500 text-black"
                          )}
                        >
                          {publishing ? copy.publishing : copy.publish}
                        </button>
                      </div>
                      {!previewViewed && (
                        <p className="mt-2 text-sm text-amber-700">
                          Debes revisar el anuncio completo antes de publicarlo.
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Success modal after publish */}
              {showSuccessModal && publishedId && (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="success-modal-title"
                >
                  <div
                    className="absolute inset-0 bg-black/60"
                    aria-hidden
                    onClick={() => setShowSuccessModal(false)}
                  />
                  <div className="relative z-10 w-full max-w-md rounded-2xl border border-black/10 bg-[#F5F5F5] shadow-xl p-6">
                    <h2 id="success-modal-title" className="text-xl font-bold text-[#111111] text-center">
                      ✅ {copy.successTitle}
                    </h2>
                    <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => router.push(`/clasificados/anuncio/${publishedId}?lang=${lang}`)}
                        className="rounded-xl bg-[#111111] text-white font-semibold px-5 py-3 hover:bg-[#333333]"
                      >
                        {copy.viewListing}
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/dashboard/mis-anuncios?lang=${lang}`)}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] text-[#111111] font-semibold px-5 py-3 hover:bg-[#EFEFEF]"
                      >
                        {copy.goToMyListings}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 text-xs text-[#111111]/40 text-center">
                {lang === "es"
                  ? `Sesión: ${userId ? userId.slice(0, 8) + "…" : ""} · Guardado automático activo`
                  : `Session: ${userId ? userId.slice(0, 8) + "…" : ""} · Autosave active`}
              </div>
            </>
          )}
        </div>
      </div>
          {showServicesGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl border border-black/10 bg-white shadow-xl">
            <div className="p-5">
              <div className="text-sm font-semibold text-[#111111]">
                {lang === "es" ? "Servicios es para negocios" : "Services is for businesses"}
              </div>
              <div className="mt-1 text-xs text-[#5A5A5A]">
                {lang === "es"
                  ? "Elige tu nivel de presencia digital. No se te cobrará hasta publicar."
                  : "Choose your digital presence level. You won’t be charged until you publish."}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setServicesPackage("standard");
                    setShowServicesGate(false);
                    goToStep("basics");
                  }}
                  className="rounded-2xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] p-4 text-left"
                >
                  <div className="text-sm font-semibold text-[#111111]">Business Standard</div>
                  <div className="mt-0.5 text-xs text-[#5A5A5A]">$200 / {lang === "es" ? "mes" : "month"}</div>
                  <ul className="mt-3 space-y-1 text-xs text-[#2B2B2B]">
                    <li>• {lang === "es" ? "Logo de su negocio" : "Business logo"}</li>
                    <li>• {lang === "es" ? "Perfil básico" : "Basic profile"}</li>
                    <li>• {lang === "es" ? "Aparece en búsquedas y filtros" : "Shows in search & filters"}</li>
                  </ul>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setServicesPackage("plus");
                    setShowServicesGate(false);
                    goToStep("basics");
                  }}
                  className="rounded-2xl border border-[#A98C2A]/60 bg-[#F2EFE8] hover:bg-[#EFE7D8] p-4 text-left"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[#111111]">Business Plus</div>
                    <span className="rounded-full bg-[#111111] px-2 py-0.5 text-[10px] font-semibold text-white">
                      {lang === "es" ? "Recomendado" : "Recommended"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-[#5A5A5A]">$349 / {lang === "es" ? "mes" : "month"}</div>
                  <ul className="mt-3 space-y-1 text-xs text-[#2B2B2B]">
                    <li>• {lang === "es" ? "Más fotos + más detalles" : "More photos + more detail"}</li>
                    <li>• {lang === "es" ? "Su negocio más visible" : "More visibility"}</li>
                    <li>• {lang === "es" ? "Oportunidades mayores para obtener más clientes" : "More chances to win customers"}</li>
                    <li>• {lang === "es" ? "Posibilidad de poner videos también" : "Option to add videos"}</li>
                  </ul>
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-[11px] text-[#5A5A5A]">
                  {lang === "es"
                    ? "¿Anuncias en la revista impresa? Tu cuenta incluye beneficios adicionales."
                    : "Print advertiser? Your account includes additional benefits."}
                </div>
                <button
                  type="button"
                  onClick={() => setShowServicesGate(false)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-[#111111] hover:bg-[#EFEFEF]"
                >
                  {lang === "es" ? "Cancelar" : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
</main>
  );
}
