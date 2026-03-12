"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FiShoppingCart,
  FiHome,
  FiTruck,
  FiCoffee,
  FiTool,
  FiBriefcase,
  FiBook,
  FiUsers,
  FiMapPin,
} from "react-icons/fi";
import { createSupabaseBrowserClient } from "../../../lib/supabase/browser";
import { setPreviewDraft } from "@/app/lib/previewListingDraft";
import { clearAllClassifiedsDrafts, RULES_CONFIRMED_KEY } from "../../lib/classifiedsDraftStorage";
import { formatListingPrice } from "@/app/lib/formatListingPrice";
import { categoryConfig, type CategoryKey } from "../../config/categoryConfig";
import { CA_CITIES, CITY_ALIASES } from "@/app/data/locations/norcal";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { MediaUploader } from "../../components/MediaUploader";

/** Real categories for publicar (no "all", no "Más"). Same order and icons as lista explorer. */
const PUBLICAR_CATEGORIES: Array<{
  key: Exclude<CategoryKey, "all">;
  Icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "en-venta", Icon: FiShoppingCart },
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
type PublishStep = "category" | "basics" | "details" | "media";

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

/** En Venta: rama principal (taxonomy-first Basics). */
const EN_VENTA_RAMAS: Array<{ value: string; labelEs: string; labelEn: string }> = [
  { value: "electronicos", labelEs: "Electrónicos", labelEn: "Electronics" },
  { value: "hogar", labelEs: "Hogar", labelEn: "Home" },
  { value: "muebles", labelEs: "Muebles", labelEn: "Furniture" },
  { value: "ropa-accesorios", labelEs: "Ropa y accesorios", labelEn: "Clothing & accessories" },
  { value: "bebes-ninos", labelEs: "Bebés y niños", labelEn: "Babies & kids" },
  { value: "herramientas", labelEs: "Herramientas", labelEn: "Tools" },
  { value: "auto-partes", labelEs: "Auto partes", labelEn: "Auto parts" },
  { value: "deportes", labelEs: "Deportes", labelEn: "Sports" },
  { value: "juguetes-juegos", labelEs: "Juguetes y juegos", labelEn: "Toys & games" },
  { value: "coleccionables", labelEs: "Coleccionables", labelEn: "Collectibles" },
  { value: "musica-foto-video", labelEs: "Música / foto / video", labelEn: "Music / photo / video" },
  { value: "otros", labelEs: "Otros", labelEn: "Other" },
];

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
  rentas: [
    {
      key: "beds",
      label: { es: "Recámaras", en: "Bedrooms" },
      type: "select",
      options: [
        { value: "studio", label: { es: "Estudio", en: "Studio" } },
        { value: "1", label: { es: "1", en: "1" } },
        { value: "2", label: { es: "2", en: "2" } },
        { value: "3", label: { es: "3", en: "3" } },
        { value: "4+", label: { es: "4+", en: "4+" } },
        { value: "room", label: { es: "Cuarto (Room)", en: "Room" } },
      ],
    },
    {
      key: "baths",
      label: { es: "Baños", en: "Bathrooms" },
      type: "select",
      options: [
        { value: "1", label: { es: "1", en: "1" } },
        { value: "1.5", label: { es: "1.5", en: "1.5" } },
        { value: "2", label: { es: "2", en: "2" } },
        { value: "2.5", label: { es: "2.5", en: "2.5" } },
        { value: "3+", label: { es: "3+", en: "3+" } },
      ],
    },
    { key: "deposit", label: { es: "Depósito", en: "Deposit" }, type: "text", placeholder: { es: "Ej: $1500 / 1 mes", en: "e.g. $1500 / 1 month" } },
    { key: "available", label: { es: "Disponible", en: "Available" }, type: "text", placeholder: { es: "Ej: Inmediato / 1 de Marzo", en: "e.g. Now / Mar 1" } },
    {
      key: "furnished",
      label: { es: "Amueblado", en: "Furnished" },
      type: "select",
      options: [
        { value: "yes", label: { es: "Sí", en: "Yes" } },
        { value: "no", label: { es: "No", en: "No" } },
      ],
    },
    {
      key: "pets",
      label: { es: "Mascotas", en: "Pets" },
      type: "select",
      options: [
        { value: "allowed", label: { es: "Permitidas", en: "Allowed" } },
        { value: "no", label: { es: "No", en: "No" } },
        { value: "cats", label: { es: "Solo gatos", en: "Cats only" } },
        { value: "dogs", label: { es: "Solo perros", en: "Dogs only" } },
      ],
    },
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
      label: { es: "Categoría", en: "Category" },
      type: "select",
      options: EN_VENTA_RAMAS.map((r) => ({ value: r.value, label: { es: r.labelEs, en: r.labelEn } })),
    },
    { key: "itemType", label: { es: "Tipo de artículo", en: "Item type" }, type: "text", placeholder: { es: "Definido en Básicos", en: "Set in Basics" } },
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

/** En Venta: tipo de artículo por rama. */
const EN_VENTA_TIPO_BY_RAMA: Record<string, Array<{ value: string; labelEs: string; labelEn: string }>> = {
  electronicos: [
    { value: "celular", labelEs: "Celular", labelEn: "Phone" },
    { value: "laptop", labelEs: "Laptop", labelEn: "Laptop" },
    { value: "tablet", labelEs: "Tablet", labelEn: "Tablet" },
    { value: "tv", labelEs: "TV", labelEn: "TV" },
    { value: "bocina", labelEs: "Bocina", labelEn: "Speaker" },
    { value: "audifonos", labelEs: "Audífonos", labelEn: "Headphones" },
    { value: "camara", labelEs: "Cámara", labelEn: "Camera" },
    { value: "videojuego-consola", labelEs: "Videojuego / consola", labelEn: "Video game / console" },
    { value: "accesorios", labelEs: "Accesorios", labelEn: "Accessories" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  hogar: [
    { value: "electrodomestico", labelEs: "Electrodoméstico", labelEn: "Appliance" },
    { value: "decoracion", labelEs: "Decoración", labelEn: "Decor" },
    { value: "cocina", labelEs: "Cocina", labelEn: "Kitchen" },
    { value: "organizacion", labelEs: "Organización", labelEn: "Organization" },
    { value: "limpieza", labelEs: "Limpieza", labelEn: "Cleaning" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  muebles: [
    { value: "sofa", labelEs: "Sofá", labelEn: "Sofa" },
    { value: "mesa", labelEs: "Mesa", labelEn: "Table" },
    { value: "silla", labelEs: "Silla", labelEn: "Chair" },
    { value: "cama", labelEs: "Cama", labelEn: "Bed" },
    { value: "comoda", labelEs: "Cómoda", labelEn: "Dresser" },
    { value: "escritorio", labelEs: "Escritorio", labelEn: "Desk" },
    { value: "estante", labelEs: "Estante", labelEn: "Shelf" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  "ropa-accesorios": [
    { value: "camisa", labelEs: "Camisa", labelEn: "Shirt" },
    { value: "pantalon", labelEs: "Pantalón", labelEn: "Pants" },
    { value: "zapatos", labelEs: "Zapatos", labelEn: "Shoes" },
    { value: "bolsa", labelEs: "Bolsa", labelEn: "Bag" },
    { value: "joyeria", labelEs: "Joyería", labelEn: "Jewelry" },
    { value: "accesorios", labelEs: "Accesorios", labelEn: "Accessories" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  "bebes-ninos": [
    { value: "ropa", labelEs: "Ropa", labelEn: "Clothing" },
    { value: "juguete", labelEs: "Juguete", labelEn: "Toy" },
    { value: "carriola", labelEs: "Carriola", labelEn: "Stroller" },
    { value: "cuna", labelEs: "Cuna", labelEn: "Crib" },
    { value: "silla-carro", labelEs: "Silla para carro", labelEn: "Car seat" },
    { value: "accesorios", labelEs: "Accesorios", labelEn: "Accessories" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  herramientas: [
    { value: "taladro", labelEs: "Taladro", labelEn: "Drill" },
    { value: "caja-herramientas", labelEs: "Caja de herramientas", labelEn: "Toolbox" },
    { value: "sierra", labelEs: "Sierra", labelEn: "Saw" },
    { value: "generador", labelEs: "Generador", labelEn: "Generator" },
    { value: "jardineria", labelEs: "Jardinería", labelEn: "Gardening" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  "auto-partes": [
    { value: "llantas", labelEs: "Llantas", labelEn: "Tires" },
    { value: "rines", labelEs: "Rines", labelEn: "Rims" },
    { value: "bateria", labelEs: "Batería", labelEn: "Battery" },
    { value: "luces", labelEs: "Luces", labelEn: "Lights" },
    { value: "estereo", labelEs: "Estéreo", labelEn: "Stereo" },
    { value: "accesorios", labelEs: "Accesorios", labelEn: "Accessories" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  deportes: [
    { value: "bicicleta", labelEs: "Bicicleta", labelEn: "Bicycle" },
    { value: "pesas", labelEs: "Pesas", labelEn: "Weights" },
    { value: "equipo", labelEs: "Equipo", labelEn: "Equipment" },
    { value: "ropa-deportiva", labelEs: "Ropa deportiva", labelEn: "Sportswear" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  "juguetes-juegos": [
    { value: "juguetes", labelEs: "Juguetes", labelEn: "Toys" },
    { value: "juegos-mesa", labelEs: "Juegos de mesa", labelEn: "Board games" },
    { value: "consola", labelEs: "Consola", labelEn: "Console" },
    { value: "videojuego", labelEs: "Videojuego", labelEn: "Video game" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  coleccionables: [
    { value: "monedas", labelEs: "Monedas", labelEn: "Coins" },
    { value: "tarjetas", labelEs: "Tarjetas", labelEn: "Cards" },
    { value: "antiguedades", labelEs: "Antigüedades", labelEn: "Antiques" },
    { value: "figuras", labelEs: "Figuras", labelEn: "Figures" },
    { value: "memorabilia", labelEs: "Memorabilia", labelEn: "Memorabilia" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  "musica-foto-video": [
    { value: "instrumento", labelEs: "Instrumento", labelEn: "Instrument" },
    { value: "microfono", labelEs: "Micrófono", labelEn: "Microphone" },
    { value: "camara", labelEs: "Cámara", labelEn: "Camera" },
    { value: "lente", labelEs: "Lente", labelEn: "Lens" },
    { value: "iluminacion", labelEs: "Iluminación", labelEn: "Lighting" },
    { value: "audio", labelEs: "Audio", labelEn: "Audio" },
    { value: "otro", labelEs: "Otro", labelEn: "Other" },
  ],
  otros: [{ value: "otro", labelEs: "Otro", labelEn: "Other" }],
};

function getCategoryFields(cat: string): DetailField[] {
  return DETAIL_FIELDS[cat] ?? [];
}

function getDetailPairs(cat: string, lang: Lang, details: Record<string, string>) {
  const fields = getCategoryFields(cat);
  const out: Array<{ label: string; value: string }> = [];
  for (const f of fields) {
    const raw = (details[f.key] ?? "").toString().trim();
    if (!raw) continue;

    if (f.type === "select" && f.options && f.options.length > 0) {
      const opt = f.options.find((o) => o.value === raw);
      out.push({ label: f.label[lang], value: opt ? opt.label[lang] : raw });
      continue;
    }

    if (cat === "en-venta" && f.key === "itemType") {
      const rama = (details.rama ?? "").trim();
      const tipos = EN_VENTA_TIPO_BY_RAMA[rama] ?? [];
      const t = tipos.find((o) => o.value === raw);
      out.push({ label: f.label[lang], value: t ? (lang === "es" ? t.labelEs : t.labelEn) : raw });
      continue;
    }

    out.push({ label: f.label[lang], value: raw });
  }
  return out;
}

function buildDetailsAppendix(cat: string, lang: Lang, details: Record<string, string>) {
  const pairs = getDetailPairs(cat, lang, details);
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
}): EnVentaDraftSnapshot {
  const { title, description, city, price, isFree, details, contactMethod, contactPhone, contactEmail, category, lang, isPro, imageUrls, proVideoThumbUrl, proVideoUrl } = params;
  const cityCanonical = normalizeCity(city) || null;
  const priceNum = (price ?? "").replace(/[^0-9.]/g, "");
  const hasPrice = priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0;
  const priceLabel =
    isFree
      ? (lang === "es" ? "Gratis" : "Free")
      : hasPrice
        ? (Number(priceNum) === 0 ? (lang === "es" ? "Gratis" : "Free") : `$${Math.round(Number(priceNum))}`)
        : (lang === "es" ? "(Sin precio)" : "(No price)");
  const detailPairs = getDetailPairs(category, lang, details);
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
    lang,
  };
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoThumbBlob, setVideoThumbBlob] = useState<Blob | null>(null);
  const [videoInfo, setVideoInfo] = useState<{ duration: number; width: number; height: number } | null>(null);
  const [videoError, setVideoError] = useState<string>("");
  const [showProVideoPreview, setShowProVideoPreview] = useState(false);
  const [previewViewed, setPreviewViewed] = useState(false);

  const [step, setStep] = useState<PublishStep>("category");
  const [category, setCategory] = useState<CategoryKey | "">(() => categoryFromUrl);

  useEffect(() => {
    setCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    if (searchParams?.get("fromPreview") === "1") setPreviewViewed(true);
  }, [searchParams]);

  useEffect(() => {
    const s = searchParams?.get("step");
    if (s === "media") setStep("media");
  }, [searchParams]);

  type ServicesPackage = "" | "standard" | "plus";
  const [servicesPackage, setServicesPackage] = useState<ServicesPackage>("");
  const [showServicesGate, setShowServicesGate] = useState(false);

  // Restaurants do not require a listing price in our flow (treated as Free by default)
  useEffect(() => {
    if (category === "restaurantes") {
      setIsFree(true);
      setPrice("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const isEnVentaFlow = category === "en-venta";
  const stepOrder: PublishStep[] = isEnVentaFlow
    ? ["category", "basics", "media"]
    : ["category", "basics", "details", "media"];
  const safeStepForProgress: PublishStep =
    isEnVentaFlow && step === "details" ? "media" : step;
  const currentStepIndex = Math.max(0, stepOrder.indexOf(safeStepForProgress));

  useEffect(() => {
    if (category === "en-venta" && step === "details") {
      setStep("media");
    }
  }, [category, step]);

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

  const maxImages = isPro ? 12 : 3;

  // If plan changes to Free, trim images to Free limit (3).
  useEffect(() => {
    if (!isPro && images.length > 3) {
      setImages((prev) => prev.slice(0, 3));
    }
  }, [isPro, images.length]);

  const proVideoThumbPreviewUrl = useMemo(() => {
    if (!videoThumbBlob) return "";
    try {
      return URL.createObjectURL(videoThumbBlob);
    } catch {
      return "";
    }
  }, [videoThumbBlob]);

  const proVideoPreviewUrl = useMemo(() => {
    if (!videoFile) return "";
    try {
      return URL.createObjectURL(videoFile);
    } catch {
      return "";
    }
  }, [videoFile]);

  useEffect(() => {
    return () => {
      if (proVideoThumbPreviewUrl) URL.revokeObjectURL(proVideoThumbPreviewUrl);
      if (proVideoPreviewUrl) URL.revokeObjectURL(proVideoPreviewUrl);
    };
  }, [proVideoThumbPreviewUrl, proVideoPreviewUrl]);

  // Publish
  const [publishError, setPublishError] = useState<string>("");
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishedId, setPublishedId] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showDraftRestoreModal, setShowDraftRestoreModal] = useState<boolean>(false);
  const [showLeaveConfirmModal, setShowLeaveConfirmModal] = useState<boolean>(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState<boolean>(false);
  const [saveProgressing, setSaveProgressing] = useState<boolean>(false);
  const [leaveSaving, setLeaveSaving] = useState<boolean>(false);
  const draftCheckedRef = useRef(false);
  const saveSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rulesConfirmed, setRulesConfirmed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(RULES_CONFIRMED_KEY) === "1";
  });
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  const setRulesConfirmedPersisted = (value: boolean) => {
    setRulesConfirmed(value);
    if (typeof window !== "undefined") {
      if (value) sessionStorage.setItem(RULES_CONFIRMED_KEY, "1");
      else sessionStorage.removeItem(RULES_CONFIRMED_KEY);
    }
  };

  const draftTimer = useRef<number | null>(null);
  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const categoryActionsRef = useRef<HTMLDivElement | null>(null);
  const previousStepRef = useRef<PublishStep | null>(null);
  const confirmPublishTriggered = useRef(false);

  const draftKey = useMemo(
    () => `listing_draft_${getStableSessionId(userId || null)}`,
    [userId]
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

  // Step transitions only: scroll form start into view. Initial load is handled by main pt-28.
  useEffect(() => {
    if (checking || !signedIn) return;
    const prev = previousStepRef.current;
    previousStepRef.current = step;
    if (prev != null && prev !== step) {
      scrollFormToTop("auto");
    }
  }, [step, checking, signedIn]);

  // Session gate
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

    async function check() {
      const { data } = await supabase!.auth.getUser();
      if (!mounted) return;

      if (!data.user) {
        const next = `/login?redirect=${encodeURIComponent(redirectForLogin)}`;
        router.replace(next);
        return;
      }

      const meta = data.user.user_metadata || {};
      const profilePhoneDigits = (meta.phone || meta.contact_phone || "").toString().replace(/\D/g, "");
      const profileCityCanonical = normalizeCity((meta.city || meta.location || "").toString().trim());
      const profileCompleteForPost = profilePhoneDigits.length === 10 && Boolean(profileCityCanonical);
      if (!profileCompleteForPost) {
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
    }

    check();

    return () => {
      mounted = false;
    };
  }, [router, redirectForLogin, lang]);

  const copy = useMemo(
    () => ({
      es: {
        title: "Publicar tu anuncio",
        subtitle: "Publica con claridad. Mientras más completo, más confianza y mejores resultados.",
        steps: { category: "Categoría", basics: "Básicos", details: "Detalles", media: "Media + Contacto + Vista previa" },
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
        video: "Video (solo Pro, 1 por anuncio)",
        addVideo: "Agregar video",
        videoHint: "Máx 20s, 720p. Sin autoplay en la lista.",
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
        fullPreviewCta: "Ver anuncio completo",
        fullPreviewTitle: "Vista completa del anuncio",
        sendMessageLabel: "Enviar mensaje",
        contactHelperText: "Así verán los usuarios cómo pueden contactarte.",
        draftInProgress: "Tienes una publicación en progreso",
        continueDraft: "Continuar con lo que guardaste",
        startNew: "Empezar de nuevo",
        leaveConfirmTitle: "¿Salir de la publicación?",
        leaveSaveDraft: "Guardar progreso y salir",
        leaveDiscard: "Salir sin guardar",
        leaveKeepEditing: "Seguir editando",
        exitLink: "Salir",
        saveProgress: "Guardar progreso",
        saveProgressSuccess: "Tu anuncio ha sido guardado",
      },
      en: {
        title: "Post your ad",
        subtitle: "Post with clarity. The more complete it is, the more trust—and better results.",
        steps: { category: "Category", basics: "Basics", details: "Details", media: "Media + Contact + Preview" },
        deleteDraft: "Delete draft",
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
        video: "Video (Pro only, 1 per listing)",
        addVideo: "Add video",
        videoHint: "Max 20s, 720p. No autoplay in grid.",
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
        saveProgressSuccess: "Your listing has been saved",
        saveLabel: "Save",
        shareLabel: "Share",
        contactLabel: "Contact",
        fullPreviewCta: "Open full listing preview",
        fullPreviewTitle: "Full listing preview",
        sendMessageLabel: "Send message",
        contactHelperText: "This is how users will see how to contact you.",
        draftInProgress: "You have a draft in progress",
        continueDraft: "Continue draft",
        startNew: "Start over",
        leaveConfirmTitle: "Leave publish flow?",
        leaveSaveDraft: "Save draft",
        leaveDiscard: "Leave without saving",
        leaveKeepEditing: "Keep editing",
        exitLink: "Exit",
      },
    }),
    []
  )[lang];

  const IMAGES_RESTORE_KEY = "leonix_listing_draft_images_restore";

  // When returning from Pro page: auto-restore draft and step so seller lands back on same ad (no modal).
  useEffect(() => {
    if (searchParams?.get("fromPro") !== "1" || draftKey === "listing_draft_ssr") return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DraftV1>;
      if (parsed.v !== 1) return;
      draftCheckedRef.current = true;
      applyDraftToForm(parsed);
      setStep("media");
    } catch {
      // ignore
    }
  }, [searchParams, draftKey]);

  // Draft restore: do not auto-load; show modal so user chooses Continuar borrador or Empezar de nuevo.
  useEffect(() => {
    if (draftKey === "listing_draft_ssr" || draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<DraftV1>;
      if (parsed.v === 1) setShowDraftRestoreModal(true);
    } catch {
      // ignore
    }
  }, [draftKey]);

  /** Restore only form values from draft; step is not restored (avoids random step jumps). */
  function applyDraftToForm(parsed: Partial<DraftV1>) {
    setTitle(typeof parsed.title === "string" ? parsed.title : "");
    setDescription(typeof parsed.description === "string" ? parsed.description : "");
    setIsFree(Boolean(parsed.isFree));
    setPrice(typeof parsed.price === "string" ? parsed.price : "");
    const loadedCity = typeof parsed.city === "string" ? parsed.city : "";
    setCity(loadedCity ? (normalizeCity(loadedCity) || loadedCity.trim()) : "");
    const draftCat = typeof parsed.category === "string" ? normalizeCategory(parsed.category) : "";
    if (draftCat) setCategory(draftCat);
    setDetails(typeof (parsed as any).details === "object" && (parsed as any).details ? ((parsed as any).details as Record<string, string>) : {});
    const method = parsed.contactMethod === "phone" || parsed.contactMethod === "email" || parsed.contactMethod === "both" ? parsed.contactMethod : "both";
    setContactMethod(method);
    setContactPhone(typeof parsed.contactPhone === "string" ? formatPhoneDisplay(parsed.contactPhone) : "");
    setContactEmail(typeof parsed.contactEmail === "string" ? parsed.contactEmail : "");
  }

  function handleContinueDraft() {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) {
        setShowDraftRestoreModal(false);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<DraftV1>;
      if (parsed.v !== 1) {
        setShowDraftRestoreModal(false);
        return;
      }
      applyDraftToForm(parsed);
      setShowDraftRestoreModal(false);
    } catch {
      setShowDraftRestoreModal(false);
    }
  }

  function handleStartNewDraft() {
    clearAllClassifiedsDrafts({ draftKey });
    setShowDraftRestoreModal(false);
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


  // Draft autosave (debounced) — when title, description, price, category, etc. change; skip while restore modal is open
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

  /** Flush draft and images so when seller returns from Pro page their ad is intact. */
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
        sessionStorage.setItem(IMAGES_RESTORE_KEY, JSON.stringify({ base64, names, types }));
      }
    } catch {
      // ignore
    }
  }, [draftKey, step, title, description, isFree, price, city, category, details, contactMethod, contactPhone, contactEmail, images]);

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

  useEffect(() => {
    if (!isFormDirty || showLeaveConfirmModal) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isFormDirty, showLeaveConfirmModal]);

  function handleExitClick(e: React.MouseEvent) {
    e.preventDefault();
    if (isFormDirty) setShowLeaveConfirmModal(true);
    else router.push(`/clasificados?lang=${lang}`);
  }

  async function handleLeaveSaveDraft() {
    setLeaveSaving(true);
    try {
      await saveDraftAndImagesForProReturn();
      setShowLeaveConfirmModal(false);
      router.push(`/clasificados?lang=${lang}`);
    } finally {
      setLeaveSaving(false);
    }
  }

  function handleLeaveDiscard() {
    clearAllClassifiedsDrafts({ draftKey });
    setShowLeaveConfirmModal(false);
    router.push(`/clasificados?lang=${lang}`);
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
  const enVentaSnapshot = useMemo(
    () =>
      buildEnVentaDraftSnapshot({
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
        isPro,
        imageUrls: filePreviews,
        proVideoThumbUrl: proVideoThumbPreviewUrl ?? null,
        proVideoUrl: proVideoPreviewUrl ?? null,
      }),
    [
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
      isPro,
      filePreviews,
      proVideoThumbPreviewUrl,
      proVideoPreviewUrl,
    ]
  );

  // Validation from snapshot so we validate what preview/insert use.
  const requirements = useMemo(() => {
    const s = enVentaSnapshot;
    const categoryOk = !!normalizeCategory(s.category);
    const titleOk = s.title.length >= 5;
    const descOk = s.description.length >= 5;
    const cityOk = Boolean(s.cityCanonical);
    const priceNum = (s.priceRaw ?? "").replace(/[^0-9.]/g, "");
    const priceOk = s.isFree || (priceNum !== "" && Number.isFinite(Number(priceNum)) && Number(priceNum) >= 0);
    const imagesOk = s.images.length >= 1;
    const phoneDigits = getPhoneDigits(s.contactPhone);
    const phoneOk = s.contactMethod === "email" ? true : phoneDigits.length === 10;
    const emailOk = s.contactMethod === "phone" ? true : /.+@.+\..+/.test(s.contactEmail.trim());
    const contactOk = phoneDigits.length === 10 || /.+@.+\..+/.test(s.contactEmail.trim());
    const enVentaMetaOk =
      s.category !== "en-venta" ||
      (!!(s.details.rama ?? "").trim() &&
        !!(s.details.itemType ?? "").trim() &&
        !!(s.details.condition ?? "").trim());
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
        enVentaMetaOk,
    };
  }, [enVentaSnapshot]);

  const basicsOk =
    category === "en-venta"
      ? requirements.enVentaMetaOk &&
        requirements.titleOk &&
        requirements.descOk &&
        requirements.priceOk &&
        requirements.cityOk
      : requirements.titleOk && requirements.descOk && requirements.priceOk && requirements.cityOk;

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
        label: lang === "es" ? (isFree ? "Gratis" : "Precio") : (isFree ? "Free" : "Price"),
        ok: requirements.priceOk,
        step: "basics",
      },
      {
        key: "city",
        label: lang === "es" ? "Ciudad válida" : "Valid city",
        ok: requirements.cityOk,
        step: "basics",
      },
      ...(category === "en-venta"
        ? [
      {
        key: "itemDetails" as const,
            label: lang === "es" ? "Detalles requeridos" : "Required details",
              ok: requirements.enVentaMetaOk,
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
      {
        key: "contact",
        label: lang === "es" ? "Contacto válido" : "Valid contact",
        ok: requirements.phoneOk && requirements.emailOk,
        step: "media",
      },
    ];
    return items;
  }, [requirements, lang, isFree, contactMethod, category]);

  const missingRequirementsText = useMemo(() => {
    const missing = requirementItems.filter((i) => !i.ok).map((i) => i.label);
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
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
  }

  
async function inspectAndThumbVideo(file: File) {
  setVideoError("");
  setVideoInfo(null);
  setVideoThumbBlob(null);

  if (!file.type.startsWith("video/")) {
    setVideoError(lang === "es" ? "Selecciona un archivo de video." : "Please select a video file.");
    return;
  }

  // Size safety (keeps uploads reliable on mobile)
  const maxBytes = 25 * 1024 * 1024; // 25MB
  if (file.size > maxBytes) {
    setVideoError(
      lang === "es"
        ? "El video es muy grande. Usa un clip más corto o comprimido (máx ~25MB)."
        : "Video file is too large. Please use a shorter/compressed clip (max ~25MB)."
    );
    return;
  }

  const url = URL.createObjectURL(file);
  try {
    const info = await new Promise<{ duration: number; width: number; height: number }>((resolve, reject) => {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;

      const cleanup = () => {
        v.removeAttribute("src");
        try { v.load(); } catch {}
      };

      v.onloadedmetadata = () => {
        const duration = Number(v.duration || 0);
        const width = Number((v as any).videoWidth || 0);
        const height = Number((v as any).videoHeight || 0);
        cleanup();
        resolve({ duration, width, height });
      };
      v.onerror = () => {
        cleanup();
        reject(new Error("metadata"));
      };
    });

    if (info.duration > 20.2) {
      setVideoError(lang === "es" ? "El video debe ser de 20 segundos o menos." : "Video must be 20 seconds or less.");
      return;
    }
    if (info.width > 1280 || info.height > 720) {
      setVideoError(
        lang === "es"
          ? "El video debe ser 720p o menos (1280×720)."
          : "Video must be 720p or less (1280×720)."
      );
      return;
    }

    setVideoInfo(info);

    // Generate thumbnail (capture ~0.5s)
    const thumb = await new Promise<Blob | null>((resolve) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.src = url;

      const done = (b: Blob | null) => {
        v.removeAttribute("src");
        try { v.load(); } catch {}
        resolve(b);
      };

      v.onloadeddata = () => {
        const t = Math.min(0.5, Math.max(0, (v.duration || 1) * 0.1));
        try {
          v.currentTime = t;
        } catch {
          done(null);
        }
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
        } catch {
          done(null);
        }
      };

      v.onerror = () => done(null);
    });

    setVideoThumbBlob(thumb);
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
      if (!isPro && category === "en-venta" && typeof enVentaActiveCount === "number") {
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
      const finalDescription = (snap.description + buildDetailsAppendix(snap.category, snap.lang, snap.details)).trim();
      // Insert from same normalized snapshot as preview/validation (DB field names unchanged).
      const insertPayload: any = {
        owner_id: userId,
        title: snap.title,
        description: finalDescription,
        city: snap.cityCanonical!,
        category: snap.category,
        price: snap.isFree ? 0 : Number((snap.priceRaw ?? "").replace(/[^0-9.]/g, "")) || 0,
        is_free: snap.isFree,
        contact_phone: snap.contactMethod === "email" ? null : (getPhoneDigits(snap.contactPhone).length === 10 ? getPhoneDigits(snap.contactPhone) : null),
        contact_email: snap.contactMethod === "phone" ? null : snap.contactEmail.trim(),
        contact_method: snap.contactMethod || null,
        status: "active",
        is_published: true,
      };

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
      if (!isPro && category === "en-venta" && typeof enVentaActiveCount === "number") {
        setEnVentaActiveCount((prev) => (typeof prev === "number" ? prev + 1 : prev));
      }


// Pro video upload (optional, Pro-only). We store URLs inside description to avoid schema guessing.
let videoUrl: string | null = null;
let thumbUrl: string | null = null;

if (isPro && videoFile && !videoError) {
  try {
    const basePath = `${userId}/${id}/video`;
    const ext = (videoFile.name.split(".").pop() || "mp4").toLowerCase();
    const videoPath = `${basePath}/clip.${ext}`;
    const up1 = await supabase.storage
      .from("listing-images")
      .upload(videoPath, videoFile, { upsert: true, contentType: videoFile.type });

    if (up1.error) throw up1.error;

    videoUrl = supabase.storage.from("listing-images").getPublicUrl(videoPath).data.publicUrl;

    if (videoThumbBlob) {
      const thumbPath = `${basePath}/thumb.jpg`;
      const up2 = await supabase.storage
        .from("listing-images")
        .upload(thumbPath, videoThumbBlob, { upsert: true, contentType: "image/jpeg" });

      if (!up2.error) {
        thumbUrl = supabase.storage.from("listing-images").getPublicUrl(thumbPath).data.publicUrl;
      }
    }

    if (videoUrl) {
      const marker =
        `[LEONIX_PRO_VIDEO]\nurl=${videoUrl}\n` +
        (thumbUrl ? `thumb=${thumbUrl}\n` : "") +
        `[/LEONIX_PRO_VIDEO]`;

      const videoAppendix =
        lang === "es"
          ? `\n\n— Video (Pro) —\nVideo: ${videoUrl}${thumbUrl ? `\nMiniatura: ${thumbUrl}` : ""}\n${marker}\n`
          : `\n\n— Video (Pro) —\nVideo: ${videoUrl}${thumbUrl ? `\nThumbnail: ${thumbUrl}` : ""}\n${marker}\n`;

      await supabase
        .from("listings")
        .update({ description: (descriptionForUpdate + videoAppendix).trim() })
        .eq("id", id);

      descriptionForUpdate = (descriptionForUpdate + videoAppendix).trim();
    }
  } catch (e: any) {
    // Don't fail the publish for video issues; keep listing live.
    console.warn("video upload failed", e?.message || e);
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
  const previewCategoryLabel = enVentaSnapshot.category ? categoryConfig[enVentaSnapshot.category as CategoryKey]?.label[lang] ?? "" : "";
  const previewContactMethod = enVentaSnapshot.contactMethod;
  const coverImage = enVentaSnapshot.images[0] ?? null;
  const extraPreviewImages = enVentaSnapshot.images.slice(1, 5);

  // Full-screen seller preview: one normalized draft with exact ordered media so preview/detail stay in sync.
  // Use data URLs for imageUrls so they survive navigation (blob URLs are revoked when this page unmounts).
  const openFullPreview = async () => {
    const slug = (enVentaSnapshot.category || "en-venta").trim().toLowerCase();
    const qs = new URLSearchParams(searchParams?.toString() ?? "");
    qs.set("lang", lang);
    qs.set("fromPreview", "1");
    qs.set("step", "media");
    const backToEditUrl = `${pathname ?? `/clasificados/publicar/${slug}`}?${qs.toString()}`;
    if (images.length > 0) {
      try {
        const base64 = await Promise.all(images.map((f) => fileToBase64(f)));
        const names = images.map((f) => f.name);
        const types = images.map((f) => f.type || "image/jpeg");
        sessionStorage.setItem(IMAGES_RESTORE_KEY, JSON.stringify({ base64, names, types }));
      } catch {
        // proceed without image restore
      }
    }
    const snap = enVentaSnapshot;
    // Exact upload order; data URLs so preview page can show them after navigation (no stale blob URLs).
    const orderedImageUrls =
      images.length > 0
        ? await Promise.all(images.map((f) => fileToDataUrl(f)))
        : [];
    setPreviewDraft({
      backToEditUrl,
      lang: snap.lang,
      category: slug,
      title: snap.title || (lang === "es" ? "(Sin título)" : "(No title)"),
      description: snap.description || (lang === "es" ? "(Sin descripción)" : "(No description)"),
      isFree: snap.isFree,
      price: snap.priceRaw,
      city: (snap.cityCanonical ?? snap.city) || (lang === "es" ? "(Ciudad)" : "(City)"),
      todayLabel: copy.todayLabel,
      detailPairs: snap.detailPairs,
      contactMethod: snap.contactMethod,
      contactPhone: formatPhoneDisplay(snap.contactPhone),
      contactEmail: snap.contactEmail,
      imageUrls: orderedImageUrls,
      proVideoThumbUrl: snap.proVideoThumbUrl,
      proVideoUrl: snap.proVideoUrl,
      isPro: snap.isPro,
      sellerName: sellerDisplayName || undefined,
    });
    await new Promise((r) => setTimeout(r, 0));
    router.push(`/preview-listing?lang=${lang}`);
  };

  return (
    <main className="min-h-screen bg-[#D9D9D9] text-[#111111] pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-6">
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
                      {lang === "es" ? "¿Continuar con lo que guardaste o empezar de nuevo?" : "Continue with what you saved or start over?"}
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
                        onClick={handleStartNewDraft}
                        className="w-full rounded-xl border border-[#111111]/30 bg-white px-4 py-3 text-sm font-semibold text-[#111111] hover:bg-[#E8E8E8]"
                      >
                        {copy.startNew}
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
                        onClick={handleLeaveDiscard}
                        className="w-full rounded-xl border border-red-600/50 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-70"
                      >
                        {copy.leaveDiscard}
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

              <div ref={topAnchorRef} aria-hidden className="h-px w-full" />
              {/* Progress bar — Salir moved to category step bottom left */}
              <div className="mt-6">
                <div className="min-w-0 rounded-xl border border-black/10 bg-[#F5F5F5] px-3 py-2.5" role="progressbar" aria-valuenow={currentStepIndex + 1} aria-valuemin={1} aria-valuemax={stepOrder.length} aria-label={lang === "es" ? "Progreso de publicación" : "Publish progress"}>
                  <div className="flex items-center gap-1 sm:gap-2">
                  {stepOrder.map((s, idx) => {
                    const isActive = safeStepForProgress === s;
                    const isPast = stepOrder.indexOf(s) < currentStepIndex;
                    const isUpcoming = !isActive && !isPast;
                    const label = s === "category" ? copy.steps.category : s === "basics" ? copy.steps.basics : s === "details" ? copy.steps.details : copy.steps.media;
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

              {/* Guardar progreso — visible on every step, desktop + mobile */}
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <button
                  type="button"
                  disabled={saveProgressing}
                  onClick={() => void handleSaveProgress()}
                  className="rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] hover:bg-[#EFE7D8] text-[#111111] font-semibold px-4 py-2.5 text-sm shrink-0 disabled:opacity-70 disabled:cursor-wait"
                >
                  {saveProgressing ? (lang === "es" ? "Guardando…" : "Saving…") : copy.saveProgress}
                </button>
                {showSaveSuccess && (
                  <span className="text-sm text-[#0d7a0d] font-medium" role="status">
                    ✓ {copy.saveProgressSuccess}
                  </span>
                )}
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

              <div className="mt-6 grid gap-6">
                {/* CATEGORY (STEP 1) — icon cards, all real categories, no Más */}
                {step === "category" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.categoryTitle}</h2>
                    <p className="mt-2 text-sm text-[#111111]">{copy.categoryNote}</p>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {PUBLICAR_CATEGORIES.map(({ key, Icon }) => {
                        const label = categoryConfig[key].label[lang];
                        const selected = category === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
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

                    {!requirements.categoryOk && (
                      <div className="mt-4 rounded-xl border border-[#C9B46A]/30 bg-[#F8F6F0] p-3 text-xs text-[#111111]">
                        {lang === "es" ? "Selecciona una categoría para continuar." : "Choose a category to continue."}
                      </div>
                    )}

                    <div ref={categoryActionsRef} className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={handleExitClick}
                        className="rounded-xl border border-black/15 bg-[#F5F5F5] hover:bg-[#E8E8E8] text-[#111111] font-semibold px-5 py-3"
                      >
                        {copy.exitLink}
                      </button>
                      <button
                        type="button"
                        disabled={!requirements.categoryOk}
                        onClick={() => {
                          if (category === "servicios" && !servicesPackage) { setShowServicesGate(true); return; }
                          setStep("basics");
                          requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto")));
                        }}
                        className={cx(
                          "rounded-xl font-semibold px-5 py-3",
                          requirements.categoryOk
                            ? "bg-yellow-500/90 hover:bg-yellow-500 text-black"
                            : "bg-black/10 text-[#111111]/40 cursor-not-allowed"
                        )}
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* BASICS */}
                {step === "basics" && (
                  <section className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5">
                    <h2 className="text-lg font-semibold text-[#111111]">{copy.basicsTitle}</h2>
                    {false && !isPro && category === "en-venta" && (
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
                      {category === "en-venta" ? (
                        <>
                          <div className="grid-details grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-[#111111]">
                                {lang === "es" ? "Categoría" : "Category"}{" *"}
                              </label>
                            <select
                              value={details.rama ?? ""}
                              onChange={(e) => {
                                const v = e.target.value;
                                setDetails((prev) => ({ ...prev, rama: v, itemType: "" }));
                              }}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            >
                              <option value="">{lang === "es" ? "Elige una categoría…" : "Choose one…"}</option>
                              {EN_VENTA_RAMAS.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {lang === "es" ? r.labelEs : r.labelEn}
                                </option>
                              ))}
                            </select>
                            {!details.rama?.trim() && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Requerido." : "Required."}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Tipo de artículo" : "Item type"}{" *"}
                            </label>
                            <select
                              value={details.itemType ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, itemType: e.target.value }))}
                              disabled={!details.rama?.trim()}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30 disabled:opacity-60"
                            >
                              <option value="">{lang === "es" ? "Elige el tipo…" : "Choose type…"}</option>
                              {(EN_VENTA_TIPO_BY_RAMA[details.rama ?? ""] ?? []).map((t) => (
                                <option key={t.value} value={t.value}>
                                  {lang === "es" ? t.labelEs : t.labelEn}
                                </option>
                              ))}
                            </select>
                            {!details.itemType?.trim() && details.rama?.trim() && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Requerido." : "Required."}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm text-[#111111]">
                              {lang === "es" ? "Condición" : "Condition"}{" *"}
                            </label>
                            <select
                              value={details.condition ?? ""}
                              onChange={(e) => setDetails((prev) => ({ ...prev, condition: e.target.value }))}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-[#111111] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            >
                              <option value="">{lang === "es" ? "Elige condición…" : "Choose condition…"}</option>
                              {EN_VENTA_CONDICION.map((c) => (
                                <option key={c.value} value={c.value}>
                                  {lang === "es" ? c.labelEs : c.labelEn}
                                </option>
                              ))}
                            </select>
                            {!details.condition?.trim() && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Requerido." : "Required."}
                              </div>
                            )}
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-[#111111]">{copy.fieldTitle}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">
                              {lang === "es"
                                ? "Un título claro que describa el artículo ayuda a que te encuentren."
                                : "A clear title that describes the item helps people find you."}
                            </p>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={lang === "es" ? "Ej: Sofá 3 plazas en buen estado" : "Ex: 3-seat sofa in good condition"}
                              spellCheck
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              lang={lang === "es" ? "es" : "en"}
                              inputMode="text"
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                            {!requirements.titleOk && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div>
                            <label className="text-sm text-[#111111]">{copy.fieldDesc}{" *"}</label>
                            <p className="mt-1 text-xs text-[#111111]/60">
                              {lang === "es"
                                ? "Escribe lo esencial: estado, qué incluye, y si entregas o deben recoger."
                                : "Include condition, what's included, and whether you deliver or they pick up."}
                            </p>
                            <textarea
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder={
                                lang === "es"
                                  ? "Estado, medidas, entrega o recoger, etc."
                                  : "Condition, size, pickup/delivery, etc."
                              }
                              spellCheck
                              autoCorrect="on"
                              autoCapitalize="sentences"
                              lang={lang === "es" ? "es" : "en"}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                            {!requirements.descOk && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className={cx("sm:col-span-2", isFree && "hidden")}>
                              <label className="text-sm text-[#111111]">{copy.fieldPrice}{" *"}</label>
                              <input
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={isFree}
                                placeholder={lang === "es" ? "Ej: 120" : "Ex: 120"}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2",
                                  isFree
                                    ? "border-white/5 bg-[#F5F5F5] text-[#111111]"
                                    : "border-black/10 bg-white/9 focus:ring-yellow-400/30"
                                )}
                              />
                              {!isFree && !requirements.priceOk && (
                                <div className="mt-1 text-xs text-[#111111]/40">
                                  {lang === "es" ? "Agrega el precio." : "Add the price."}
                                </div>
                              )}
                            </div>
                            <div className={cx(isFree ? "sm:col-span-2" : "sm:col-span-1")}>
                              <label className="text-sm text-[#111111]">{lang === "es" ? "Gratis" : "Free"}{" *"}</label>
                              <div className="mt-2 flex rounded-xl border border-black/10 overflow-hidden bg-[#F5F5F5]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsFree(true);
                                    setPrice("");
                                  }}
                                  className={cx(
                                    "flex-1 py-3 text-sm font-semibold",
                                    isFree
                                      ? "bg-[#C9B46A]/40 text-[#111111] border border-[#C9B46A]/50"
                                      : "text-[#111111]/70 hover:bg-[#EFEFEF] hover:text-[#111111]"
                                  )}
                                >
                                  {lang === "es" ? "Sí" : "Yes"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsFree(false)}
                                  className={cx(
                                    "flex-1 py-3 text-sm font-semibold",
                                    !isFree
                                      ? "bg-[#C9B46A]/40 text-[#111111] border border-[#C9B46A]/50"
                                      : "text-[#111111]/70 hover:bg-[#EFEFEF] hover:text-[#111111]"
                                  )}
                                >
                                  {lang === "es" ? "No" : "No"}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-[#111111]">{copy.fieldCity}{" *"}</label>
                            <CityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                              lang={lang}
                              label=""
                              variant="light"
                              className="mt-2"
                            />
                            {!requirements.cityOk && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Agrega tu ciudad." : "Add your city."}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm text-[#111111]">{copy.fieldTitle}</label>
                            <input
                              value={title}
                              onChange={(e) => setTitle(e.target.value)}
                              placeholder={lang === "es" ? "Ej: Sofá en excelente condición" : "Ex: Great-condition sofa"}
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                            {!requirements.titleOk && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div>
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
                              className="mt-2 w-full rounded-xl border border-black/10 bg-white/9 px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                            />
                            {!requirements.descOk && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Mínimo 5 caracteres." : "Min 5 characters."}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                              <label className="text-sm text-[#111111]">{copy.fieldPrice}</label>
                              <input
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                disabled={isFree}
                                placeholder={lang === "es" ? "Ej: 120" : "Ex: 120"}
                                className={cx(
                                  "mt-2 w-full rounded-xl border px-4 py-3 text-[#111111] placeholder:text-[#111111]/30 focus:outline-none focus:ring-2",
                                  isFree
                                    ? "border-white/5 bg-[#F5F5F5] text-[#111111]"
                                    : "border-black/10 bg-white/9 focus:ring-yellow-400/30"
                                )}
                              />
                              {!requirements.priceOk && (
                                <div className="mt-1 text-xs text-[#111111]/40">
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

                          <div>
                            <CityAutocomplete
                              value={city}
                              onChange={setCity}
                              placeholder={lang === "es" ? "Ej: San José" : "Ex: San Jose"}
                              lang={lang}
                              label={copy.fieldCity}
                              variant="light"
                              className="mt-0"
                            />
                            {!requirements.cityOk && (
                              <div className="mt-1 text-xs text-[#111111]/40">
                                {lang === "es" ? "Agrega tu ciudad." : "Add your city."}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => { setStep("category"); requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto"))); }}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                        {copy.back}
                      </button>
                      <div className="text-xs text-[#111111]/40 flex-1 text-center hidden sm:block">{copy.requiredHint}</div>
                      <button
                        type="button"
                        disabled={!basicsOk}
                        onClick={() => { if (basicsOk) { setStep(isEnVentaFlow ? "media" : "details"); requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto"))); } }}
                        className={cx(
                          "rounded-xl font-semibold px-5 py-3",
                          basicsOk
                            ? "bg-yellow-500/90 hover:bg-yellow-500 text-black"
                            : "bg-black/10 text-[#111111]/40 cursor-not-allowed"
                        )}
                      >
                        {copy.next}
                      </button>
                    </div>
                  </section>
                )}

                {/* DETAILS */}
                {step === "details" && !isEnVentaFlow && (
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
                        <span className="text-[#111111]/90 font-semibold">{category}</span>
                      </div>

                      {getCategoryFields(category).length === 0 ? (
                        <div className="mt-3 text-sm text-[#111111]/55">
                          {lang === "es"
                            ? "Por ahora no hay campos extra para esta categoría."
                            : "No extra fields for this category yet."}
                        </div>
                      ) : (
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {getCategoryFields(category).map((f) => {
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
                        <button
                          type="button"
                          onClick={() => setDetails({})}
                          className="text-xs text-[#111111] hover:text-[#111111]"
                        >
                          {lang === "es" ? "Limpiar detalles" : "Clear details"}
                        </button>
                        <div className="text-xs text-[#111111]/40">
                          {lang === "es"
                            ? "Estos detalles se guardan automáticamente."
                            : "These details are saved automatically."}
                        </div>
                      </div>
                    </div>

<div className="mt-5 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => { if (category === "servicios" && !servicesPackage) { setShowServicesGate(true); return; } setStep("basics"); requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto"))); }}
                        className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                      >
                        {copy.back}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStep("media"); requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto"))); }}
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
                        videoFile={videoFile}
                        onVideoChange={(f) => {
                          setVideoFile(f);
                          setVideoError("");
                          setVideoInfo(null);
                          setVideoThumbBlob(null);
                          if (f) inspectAndThumbVideo(f);
                        }}
                        onVideoRemove={() => {
                          setVideoFile(null);
                          setVideoThumbBlob(null);
                          setVideoInfo(null);
                          setVideoError("");
                          setShowProVideoPreview(false);
                        }}
                        isPro={isPro}
                        maxImages={maxImages}
                        lang={lang}
                        uploadProgress={uploadProgress}
                        videoPreviewUrl={proVideoPreviewUrl}
                        videoError={videoError}
                        proUpgradeHref={
                          category === "en-venta"
                            ? `/clasificados/publicar/en-venta/pro?lang=${lang}&return=${encodeURIComponent(
                                `${pathname ?? "/clasificados/publicar/en-venta"}?lang=${lang}&step=media&fromPro=1`
                              )}`
                            : undefined
                        }
                        onBeforeProNavigate={category === "en-venta" ? saveDraftAndImagesForProReturn : undefined}
                        copy={{
                          addImages: copy.addImages,
                          addVideo: copy.addVideo,
                          video: copy.video,
                          videoHint: copy.videoHint,
                          images: copy.images,
                        }}
                      />

                        {!requirements.imagesOk && (
                          <div className="mt-1 text-xs text-[#111111]/40">
                            {lang === "es" ? "Requerido: mínimo 1 foto." : "Required: at least 1 photo."}
                          </div>
                        )}

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
                                <div className="mt-1 text-xs text-[#111111]/40">
                                  {lang === "es" ? "Agrega un teléfono válido." : "Add a valid phone."}
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
                                <div className="mt-1 text-xs text-[#111111]/40">
                                  {lang === "es" ? "Agrega un email válido." : "Add a valid email."}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-[#111111]">{copy.preview}</div>
                          <div className="text-xs text-[#111111]/40">
                            {lang === "es" ? "Así se verá tu anuncio" : "This is how your listing will look"}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-4">
                          {/* Left: compact feed card */}
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

                            {previewDetailPairs.length > 0 && (
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
                            )}

                            <div className="mt-3 rounded-lg border border-black/10 bg-white p-2.5">
                              <p className="text-xs text-[#111111] line-clamp-3 whitespace-pre-wrap">
                                {previewShortDescription || previewDescription || (lang === "es" ? "(Sin descripción)" : "(No description)")}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/10">
                              <button
                                type="button"
                                onClick={openFullPreview}
                                className="w-full rounded-xl border border-[#C9B46A]/50 bg-[#F8F6F0] py-2.5 text-sm font-semibold text-[#111111] hover:bg-[#EFE7D8] focus:outline-none focus:ring-2 focus:ring-yellow-400/30"
                              >
                                {copy.fullPreviewCta}
                              </button>
                            </div>

                            {isPro && videoFile && (
                              <div className="mt-4 rounded-xl border border-black/10 bg-[#F5F5F5] p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-yellow-200">
                                      {lang === "es" ? "Video (Pro)" : "Pro Video"}
                                    </div>
                                    <div className="mt-1 text-xs text-[#111111]">
                                      {lang === "es"
                                        ? "Toque la miniatura para reproducir. No se reproduce automáticamente."
                                        : "Tap the thumbnail to play. No autoplay."}
                                    </div>
                                  </div>
                                  {!showProVideoPreview && (
                                    <button
                                      type="button"
                                      onClick={() => setShowProVideoPreview(true)}
                                      className="rounded-full border border-[#C9B46A]/70 bg-[#F2EFE8] px-4 py-2 text-xs font-semibold text-yellow-100 hover:bg-[#F2EFE8]"
                                    >
                                      {lang === "es" ? "Reproducir" : "Play"}
                                    </button>
                                  )}
                                </div>

                                <div className="mt-3">
                                  {!showProVideoPreview ? (
                                    proVideoThumbPreviewUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => setShowProVideoPreview(true)}
                                        className="group relative block w-full overflow-hidden rounded-xl border border-black/10"
                                        aria-label={lang === "es" ? "Reproducir video" : "Play video"}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={proVideoThumbPreviewUrl}
                                          alt={lang === "es" ? "Miniatura del video" : "Video thumbnail"}
                                          className="h-auto w-full object-cover opacity-95 group-hover:opacity-100"
                                          loading="lazy"
                                        />
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                          <div className="rounded-full border border-white/20 bg-white/14 px-4 py-2 text-sm font-semibold text-[#111111]">
                                            {lang === "es" ? "▶ Reproducir" : "▶ Play"}
                                          </div>
                                        </div>
                                      </button>
                                    ) : (
                                      <div className="rounded-xl border border-black/10 bg-[#F5F5F5] p-4 text-sm text-[#111111]">
                                        {lang === "es"
                                          ? "Este anuncio incluirá un video Pro al publicarse."
                                          : "This listing will include a Pro video when published."}
                                      </div>
                                    )
                                  ) : (
                                    <video
                                      className="w-full rounded-xl border border-black/10 bg-black"
                                      controls
                                      preload="none"
                                      playsInline
                                      poster={proVideoThumbPreviewUrl || undefined}
                                      src={proVideoPreviewUrl || undefined}
                                    />
                                  )}
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
                          <span className="text-sm text-[#111111]">{copy.rulesConfirm}</span>
                        </label>
                        <Link
                          href={`/clasificados/reglas?lang=${lang}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#111111]/70 hover:text-[#111111] underline ml-6"
                        >
                          {lang === "es" ? "Ver reglas" : "View rules"}
                        </Link>
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

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => { setStep(isEnVentaFlow ? "basics" : "details"); requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto"))); }}
                          className="rounded-xl border border-black/10 bg-[#F5F5F5] hover:bg-[#EFEFEF] text-[#111111] font-semibold px-5 py-3"
                        >
                          {copy.back}
                        </button>

                        {!previewViewed && (
                          <p className="text-sm text-amber-700 mb-3">
                            Debes revisar el anuncio completo antes de publicarlo.
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
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
                      </div>
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
                    setStep("basics");
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto")));
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
                    setStep("basics");
                    requestAnimationFrame(() => requestAnimationFrame(() => scrollFormToTop("auto")));
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
