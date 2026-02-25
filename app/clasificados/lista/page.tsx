"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  | "comunidad"
  | "travel"
  | "restaurantes";

type SortKey = "newest" | "price-asc" | "price-desc";
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

  // ✅ Rentas fields (optional; safe with existing sample data)
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

  // ✅ Contact / close-the-sale fields (optional; safe)
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
  "rentas",
  "autos",
  "restaurantes",
  "servicios",
  "empleos",
  "clases",
  "comunidad",
  "travel",
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

  const final = `${url.pathname}?${sp.toString()}`;
  window.history.replaceState({}, "", final);
}

/** ✅ Rentas param helpers (internal only; no exports) */
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

    return true;
  });
}

export default function ListaPage() {
  const params = useSearchParams();
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
  const perPage = 9;

  const [compact, setCompact] = useState(true);
  const [isMobileUI, setIsMobileUI] = useState(false);
  const [showTop, setShowTop] = useState(false);

  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

// Category switching polish (A4.19)
const resultsTopRef = useRef<HTMLDivElement | null>(null);
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

// ✅ Mobile full-screen Filters/Sort panel (A3)
const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
const [mobilePanelTab, setMobilePanelTab] = useState<"filters" | "sort">("filters");

useEffect(() => {
  if (!mobilePanelOpen) return;
  const prev = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = prev;
  };
}, [mobilePanelOpen]);

  const [moreOpen, setMoreOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  const [usingMyLocation, setUsingMyLocation] = useState(false);
  const [locMsg, setLocMsg] = useState("");

  const [cityQuery, setCityQuery] = useState("");
  const [citySuggestOpen, setCitySuggestOpen] = useState(false);
  const citySuggestRef = useRef<HTMLDivElement | null>(null);

  const chipsRowRef = useRef<HTMLDivElement | null>(null);

  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<Exclude<CategoryKey, "all">>>([]);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // ✅ Rentas param state (only used when cat=rentas)
  const [rentasParams, setRentasParams] = useState<RentasParams>(EMPTY_RENTAS_PARAMS);

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
      setSuggestionsOpen(false);
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
    const pCat = params?.get("cat") ?? null;
    const pSort = params?.get("sort") ?? null;
    const pView = params?.get("view") ?? null;

    if (pQ) setQ(pQ);
    if (pCity) setCity(pCity);
    if (pZip) setZip(pZip);
    if (pR && Number.isFinite(Number(pR))) setRadiusMi(Number(pR));

    if (pCat && isCategoryKey(pCat)) setCategory(pCat as CategoryKey);

    const sortOk: SortKey[] = ["newest", "price-asc", "price-desc"];
    if (pSort && sortOk.includes(pSort as SortKey)) setSort(pSort as SortKey);

    const viewOk: ViewMode[] = ["grid", "list", "list-img"];
    if (pView && viewOk.includes(pView as ViewMode)) setView(pView as ViewMode);

    // ✅ Rentas params: only track them if cat=rentas
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
      });
    } else {
      setRentasParams(EMPTY_RENTAS_PARAMS);
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

  const listings = useMemo<Listing[]>(() => {
    const raw = (SAMPLE_LISTINGS as unknown as Listing[]) ?? [];
    return raw.map((x) => ({
      ...x,
      createdAtISO: safeISO(x.createdAtISO),
      hasImage: Boolean(x.hasImage),
      sellerType: x.sellerType ?? "personal",
    }));
  }, []);

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

    const rentasApplied = category === "rentas" ? applyRentasParams(base, rentasParams) : base;

    const sorted = [...rentasApplied].sort((a, b) => {
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
  }, [listings, qSmart, category, sellerType, onlyWithImage, anchor, radiusMi, sort, rentasParams]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage(1);
  }, [q, city, zip, radiusMi, category, sort, sellerType, onlyWithImage, rentasParams]);

  const businessTop = useMemo(() => {
  // Show a small "Profesionales / Businesses" strip only on page 1,
  // and only when user isn't already filtering to business-only.
  if (pageClamped !== 1) return [] as Listing[];
  if (sellerType === "business") return [] as Listing[];
  const biz = filtered.filter((x) => x.sellerType === "business");
  return biz.slice(0, isMobileUI ? 2 : 4);
}, [filtered, pageClamped, sellerType]);

const visible = useMemo(() => {
  const topIds = new Set(businessTop.map((x) => x.id));
  const main = topIds.size ? filtered.filter((x) => !topIds.has(x.id)) : filtered;
  const start = (pageClamped - 1) * perPage;
  return main.slice(start, start + perPage);
}, [filtered, pageClamped, perPage, businessTop]);

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

    if (category !== "all") {
      chips.push({
        key: "cat",
        text: `${UI.category[lang]}: ${CATEGORY_LABELS[category][lang]}`,
        clear: () => setCategory("all"),
      });
    }

    // ✅ Rentas chips (only show when in rentas + has params)
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
    }

    if (sort !== "newest") {
      chips.push({
        key: "sort",
        text: `${UI.sort[lang]}: ${SORT_LABELS[sort][lang]}`,
        clear: () => setSort("newest"),
      });
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
  }, [q, lang, zipMode, zipClean, city, locationLabel, radiusMi, category, sort, sellerType, onlyWithImage, rentasParams]);

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
        : normalize(city) && normalize(city) !== normalize(DEFAULT_CITY)
          ? city
          : null,

      // ✅ Rentas params are preserved in URL only when cat=rentas
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
    });
  }, [lang, q, category, sort, view, radiusMi, zipMode, zipClean, city, rentasParams]);

  const resetAll = () => {
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

  const scrollChips = (dir: "left" | "right") => {
    const el = chipsRowRef.current;
    if (!el) return;
    const dx = dir === "left" ? -260 : 260;
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  const mapsHref = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

const normalizeSpace = (s: string) => s.replace(/\s+/g, " ").trim();

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


const parseEmpleoFromText = (title: string, blurb: string, payLabel: string) => {
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
};

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
      {pills.slice(0, isMobileUI ? 2 : 4).map((p) => (
        <a
          key={p.href + p.label}
          href={p.href}
          target={p.external ? "_blank" : undefined}
          rel={p.external ? "noreferrer" : undefined}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs sm:py-1 text-gray-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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

  const icon = tier === "joya" ? "💎" : tier === "corona" ? "👑" : "👑✨";

  const cls =
    tier === "joya"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.16)]"
      : tier === "corona"
        ? "border-yellow-400/32 bg-yellow-400/10 text-yellow-50 shadow-[0_0_0_1px_rgba(250,204,21,0.14)]"
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
          "cursor-pointer select-none text-xs font-medium text-gray-300",
          "hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/60",
          "rounded-md"
        )}
      >
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500/60" aria-hidden="true" />
          {summary}
          <span
            className="text-gray-400 group-open:rotate-180 transition-transform"
            aria-hidden="true"
          >
            ▾
          </span>
        </span>
      </summary>

      <div className="mt-2 rounded-xl border border-white/12 bg-black/40 p-3">
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.tier ?? "none"} className="flex items-start gap-2">
              <div className="mt-[1px] shrink-0">
                <TierBadge tier={it.tier} lang={lang} />
              </div>
              <div className="text-xs text-gray-300 leading-snug">
                {it.text[lang]}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-[11px] text-gray-400">
          {lang === "es"
            ? "Las insignias son una señal visual. No reemplazan los filtros."
            : "Badges are a visual signal. They don’t replace filters."}
        </div>
      </div>
    </details>
  );
};

const ListingCardGrid = (x: Listing) => {
  const isFav = favIds.has(x.id);
  const isAutos = x.category === "autos";
  const isEmpleos = x.category === "empleos";
  const isServicios = x.category === "servicios";
  const isComunidad = x.category === "comunidad";
  const tier = inferVisualTier(x);

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
        "relative overflow-hidden rounded-2xl border bg-black/25 p-2 sm:p-3 md:p-4 transition-all duration-200 ease-out hover:-translate-y-[1px] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]",
        tier === "corona-oro"
          ? "border-yellow-300/60 ring-1 ring-yellow-300/25 bg-gradient-to-b from-yellow-500/12 via-black/25 to-black/25 shadow-[0_0_0_1px_rgba(250,204,21,0.18),0_0_22px_rgba(250,204,21,0.10),0_16px_46px_-20px_rgba(0,0,0,0.86)]"
          : tier === "corona"
            ? "border-yellow-400/25 bg-yellow-500/6"
            : tier === "joya"
              ? "border-emerald-400/22 bg-emerald-500/5"
              : "border-white/10"
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
              <div className="truncate text-base sm:text-lg font-semibold tracking-tight text-white leading-snug">
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
                ? "font-bold text-gray-100 text-sm sm:text-base"
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
                <span className="text-gray-300 font-semibold mr-2">{lang === "es" ? "Pago:" : "Pay:"}</span>
                <span>{x.priceLabel[lang]}</span>
              </>
            ) : isServicios && !/\$/.test(x.priceLabel[lang]) && x.priceLabel[lang] !== "Gratis" && x.priceLabel[lang] !== "Free" ? (
              <>
                <span className="text-gray-300 font-semibold mr-2">{lang === "es" ? "Acción:" : "Action:"}</span>
                <span>{x.priceLabel[lang]}</span>
              </>
            ) : (
              x.priceLabel[lang]
            )}
          </div>

{/* Empleos: salary/job type/remote (Indeed-style) */}
{isEmpleos ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {empleo?.salaryLabel ? (
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] sm:text-xs text-gray-100">
        {lang === "es" ? "Tarifa" : "Rate"}: {empleo.salaryLabel}
      </span>
    ) : null}
    {empleoJobType ? (
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] sm:text-xs text-gray-100">
        {empleoJobType}
      </span>
    ) : null}
    {empleo?.isRemote ? (
      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] sm:text-xs text-emerald-100">
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
        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] sm:text-xs text-gray-100"
      >
        {t}
      </span>
    ))}
  </div>
) : null}

          {/* Autos: specs + mileage ABOVE location/time */}
          {isAutos && autosSpec ? (
            <div className="mt-1 text-xs sm:text-sm text-gray-200">
              {autosSpec}
            </div>
          ) : null}
          {isAutos && autosMileage ? (
            <div className="mt-0.5 text-xs sm:text-sm font-semibold text-gray-100">
              {autosMileage}
            </div>
          ) : null}

          {/* Business identity (Autos slightly earlier, stronger trust) */}
          {x.businessName ? (
            <div className={cx("mt-1 font-medium text-gray-100/90", isAutos ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs")}>
              <span className="text-gray-400">
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
  <div className="mt-1 text-[11px] sm:text-xs font-medium text-gray-100/90">
    {lang === "es" ? "Empresa" : "Business"}
  </div>
) : null}


          {/* Location + time (Autos pushed lower for scan hierarchy) */}
          <div className={cx("text-gray-300", isAutos ? "mt-1 text-xs sm:text-sm" : "mt-1 text-xs sm:text-sm")}>
            <span className="text-gray-200">{x.city}</span>{" "}
            <span className="text-gray-500">•</span>{" "}
            <span className="text-gray-300">{x.postedAgo[lang]}</span>
          </div>

          {/* Micro facts (non-autos only) */}
          {!isAutos ? (
            <div className="mt-1 text-[11px] sm:text-xs text-gray-300">
              {microLine(x)}
            </div>
          ) : null}

          {/* Chips */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {x.sellerType && tier !== "corona" && tier !== "corona-oro" ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
                {SELLER_LABELS[x.sellerType][lang]}
              </span>
            ) : null}
            {x.handle ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
                {x.handle}
              </span>
            ) : null}
            {x.hasImage ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
                📷
              </span>
            ) : null}
          </div>
        </div>

        <div className={cx("shrink-0 flex flex-col items-end gap-2", !isAutos && "justify-start")}>
          {/* Autos/En Venta: consistent thumbnail (small, fixed, no layout shift) */}
          {(isAutos || x.category === "en-venta") ? (
            <div className="h-16 w-16 sm:h-[72px] sm:w-[72px] overflow-hidden rounded-xl border border-white/10 bg-white/5">
              {x.hasImage ? (
                <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
              ) : (
                <div className="h-full w-full bg-white/5" />
              )}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => toggleFav(x.id)}
            className={cx(
              "rounded-xl border px-2.5 py-1.5 text-sm",
              isFav
                ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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

      <div className="mt-2 line-clamp-2 text-sm text-gray-200">
        {x.blurb[lang]}
      </div>

      {ActionPills(x)}

      <a
        href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
        className="mt-2.5 block rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
      >
        {lang === "es" ? "Ver detalle" : "View details"}
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
        "group relative overflow-hidden flex items-stretch gap-3 rounded-2xl border bg-black/25 p-2 sm:p-3 md:p-4 hover:bg-white/10 transition-all duration-200 ease-out hover:-translate-y-[1px]",
        tier === "corona-oro"
          ? "border-yellow-300/55 ring-1 ring-yellow-300/20 bg-gradient-to-b from-yellow-500/10 via-black/25 to-black/25 shadow-[0_0_0_1px_rgba(250,204,21,0.16),0_0_18px_rgba(250,204,21,0.08)]"
          : tier === "corona"
            ? "border-yellow-400/25 bg-yellow-500/6"
            : tier === "joya"
              ? "border-emerald-400/22 bg-emerald-500/5"
              : "border-white/10"
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
            "shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5",
            isAutos ? "h-14 w-14 sm:h-16 sm:w-16" : "h-12 w-12 sm:h-14 sm:w-14"
          )}
        >
          {x.hasImage ? (
            <div className="h-full w-full bg-[url('/classifieds-placeholder-bilingual.png')] bg-cover bg-center" />
          ) : (
            <div className="h-full w-full bg-white/5" />
          )}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <a
            href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
            className="min-w-0"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold tracking-tight text-white leading-snug">
                  {x.title[lang]}
                </div>
              </div>
              <div className={cx(isComunidadLite && "opacity-80")}><TierBadge tier={tier} lang={lang} /></div>
            </div>

            <div
  className={cx(
    "mt-0.5 tracking-tight",
    isComunidadLite
      ? "font-bold text-gray-100 text-sm"
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
      <span className="text-gray-300 font-semibold mr-2">{lang === "es" ? "Pago:" : "Pay:"}</span>
      <span>{x.priceLabel[lang]}</span>
    </>
  ) : isServicios && !/\$/.test(x.priceLabel[lang]) && x.priceLabel[lang] !== "Gratis" && x.priceLabel[lang] !== "Free" ? (
    <>
      <span className="text-gray-300 font-semibold mr-2">{lang === "es" ? "Acción:" : "Action:"}</span>
      <span>{x.priceLabel[lang]}</span>
    </>
  ) : (
    x.priceLabel[lang]
  )}
</div>

  {/* Empleos: salary/job type/remote (Indeed-style) */}
{isEmpleos ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {empleo?.salaryLabel ? (
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] sm:text-xs text-gray-100">
        {lang === "es" ? "Tarifa" : "Rate"}: {empleo.salaryLabel}
      </span>
    ) : null}
    {empleoJobType ? (
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] sm:text-xs text-gray-100">
        {empleoJobType}
      </span>
    ) : null}
    {empleo?.isRemote ? (
      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] sm:text-xs text-emerald-100">
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
        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] sm:text-xs text-gray-100"
      >
        {t}
      </span>
    ))}
  </div>
) : null}{/* Empleos: salary/job type/remote (Indeed-style) */}
{isEmpleos ? (
  <div className="mt-1 flex flex-wrap items-center gap-2">
    {empleo?.salaryLabel ? (
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
        {lang === "es" ? "Tarifa" : "Rate"}: {empleo.salaryLabel}
      </span>
    ) : null}
    {empleoJobType ? (
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
        {empleoJobType}
      </span>
    ) : null}
    {empleo?.isRemote ? (
      <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-100">
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
        className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100"
      >
        {t}
      </span>
    ))}
  </div>
) : null}

{/* Autos: specs + mileage ABOVE location/time */}
{isAutos && autosSpec ? (
  <div className="mt-0.5 text-xs text-gray-200">{autosSpec}</div>
) : null}
{isAutos && autosMileage ? (
  <div className="mt-0.5 text-xs font-semibold text-gray-100">{autosMileage}</div>
) : null}


            {x.sellerType === "business" && x.businessName ? (
              <div className={cx("mt-0.5 font-medium text-gray-100/90", isAutos ? "text-xs" : "text-[11px]")}>
                {x.businessName}
              </div>
            ) : null}
{isEmpleos && x.sellerType === "business" && !x.businessName ? (
  <div className="mt-0.5 text-[11px] font-medium text-gray-100/90">
    {lang === "es" ? "Empresa" : "Business"}
  </div>
) : null}


            <div className="mt-0.5 text-xs text-gray-300">
              <span className="text-gray-200">{x.city}</span>{" "}
              <span className="text-gray-500">•</span>{" "}
              <span className="text-gray-300">{x.postedAgo[lang]}</span>
            </div>

            {!isAutos ? (
              <div className="mt-0.5 text-xs text-gray-300">{microLine(x)}</div>
            ) : null}
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleFav(x.id)}
              className={cx(
                "rounded-lg border px-2 py-1 text-xs",
                isFav
                  ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                  : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
              {SELLER_LABELS[x.sellerType][lang]}
            </span>
          ) : null}
          {x.handle ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
              {x.handle}
            </span>
          ) : null}
          {x.hasImage ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-gray-100">
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
    <div className="min-h-screen bg-black text-white pb-28 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.10),transparent_55%)]">
      <Navbar />

      {/* Sticky quick actions (always reachable) */}
      <div className="sticky top-[72px] z-40 border-b border-white/10 bg-black/35 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-4 py-3">
          <a
            href={`/clasificados/publicar?lang=${lang}`}
            className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-95 transition"
          >
            {lang === "es" ? "Publicar anuncio" : "Post listing"}
          </a>

          <a
            href={`/clasificados/lista?lang=${lang}`}
            className="rounded-full border border-yellow-600/20 bg-black/25 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-black/30 transition"
          >
            {lang === "es" ? "Ver anuncios" : "View listings"}
          </a>

          <a
            href={`/clasificados/membresias?lang=${lang}`}
            className="rounded-full border border-yellow-600/20 bg-black/25 px-4 py-2 text-sm font-semibold text-gray-100 hover:bg-black/30 transition"
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

      <main className="mx-auto w-full max-w-6xl px-6 pt-24 md:pt-28">
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

          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 md:text-lg">
            {lang === "es"
              ? "Explora todos los anuncios con filtros."
              : "Browse all listings with filters."}
          </p>
        </div>

        <section className="mt-6">
          <div className="rounded-2xl border border-white/12 bg-black/30 px-4 py-4 shadow-[0_20px_60px_-45px_rgba(0,0,0,0.85)] ring-1 ring-yellow-600/10 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-gray-200">
                {lang === "es" ? "Explorar por categoría" : "Browse by category"}
              </div>

              <div className="hidden md:flex items-center gap-1 text-[11px] text-gray-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-500/60" />
                <span>{lang === "es" ? "Cambio rápido" : "Quick switch"}</span>
              </div>
            </div>

            {/* Switch feedback (no layout shift) */}
            <div
              className={cx(
                "mt-3 h-0.5 w-full overflow-hidden rounded-full bg-white/10 transition-colors",
                isSwitchingCategory ? "bg-yellow-500/25" : ""
              )}
              aria-hidden="true"
            >
              <div
                className={cx(
                  "h-full w-full transition-opacity",
                  isSwitchingCategory ? "opacity-100 animate-pulse bg-yellow-400/40" : "opacity-0"
                )}
              />
            </div>

            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORY_ORDER.map((c) => {
                const active = c === category;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => switchCategory(c)}
                    aria-current={active ? "page" : undefined}
                    className={cx(
                      "whitespace-nowrap snap-start snap-always rounded-full border px-3 py-1.5 text-xs sm:py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/40",
                      active
                        ? "border-yellow-500/50 bg-yellow-500/15 text-gray-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                  >
                    {CATEGORY_LABELS[c][lang]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>


<div ref={resultsTopRef} />

        <div
          className={cx(
            "mt-6 transition-opacity duration-200",
            "md:grid md:gap-6",
            filtersCollapsed ? "md:grid-cols-[72px,1fr]" : "md:grid-cols-[320px,1fr]",
            isSwitchingCategory ? "opacity-80" : "opacity-100"
          )}
        >
        {/* FILTERS SIDEBAR (desktop) */}
        <aside
          className={cx(
            "hidden md:block",
            "sticky top-[calc(72px+16px)] z-30",
            "rounded-2xl border border-white/12 bg-neutral-800/45 backdrop-blur shadow-sm",
            compact ? "shadow-lg" : ""
          )}
        >
          {filtersCollapsed ? (
            <div className="flex h-full flex-col items-center justify-start p-2">
              <button
                type="button"
                onClick={() => setFiltersCollapsed(false)}
                className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                aria-label={lang === "es" ? "Mostrar filtros" : "Show filters"}
                title={lang === "es" ? "Mostrar filtros" : "Show filters"}
              >
                ≡
              </button>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-200">
                    {lang === "es" ? "Filtros" : "Filters"}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {lang === "es"
                      ? "Ajusta para afinar resultados."
                      : "Adjust to refine results."}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFiltersCollapsed(true)}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  aria-label={lang === "es" ? "Colapsar" : "Collapse"}
                >
                  {lang === "es" ? "Colapsar" : "Collapse"}
                </button>
              </div>

              {/* Category-shaped: RENTAS */}
              {category === "rentas" ? (
                <div className="mt-4 grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300">
                        {lang === "es" ? "Precio mín." : "Min price"}
                      </label>
                      <input
                        value={rentasParams.rpmin}
                        onChange={(e) =>
                          setRentasParams((p) => ({ ...p, rpmin: e.target.value }))
                        }
                        inputMode="numeric"
                        placeholder="$"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300">
                        {lang === "es" ? "Precio máx." : "Max price"}
                      </label>
                      <input
                        value={rentasParams.rpmax}
                        onChange={(e) =>
                          setRentasParams((p) => ({ ...p, rpmax: e.target.value }))
                        }
                        inputMode="numeric"
                        placeholder="$"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-300">
                        {lang === "es" ? "Recámaras" : "Beds"}
                      </label>
                      <select
                        value={rentasParams.rbeds}
                        onChange={(e) =>
                          setRentasParams((p) => ({ ...p, rbeds: e.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="0">{lang === "es" ? "Estudio" : "Studio"}</option>
                        <option value="1">1+</option>
                        <option value="2">2+</option>
                        <option value="3">3+</option>
                        <option value="4">4+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300">
                        {lang === "es" ? "Baños" : "Baths"}
                      </label>
                      <select
                        value={rentasParams.rbaths}
                        onChange={(e) =>
                          setRentasParams((p) => ({ ...p, rbaths: e.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                      >
                        <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                        <option value="1">1+</option>
                        <option value="1.5">1.5+</option>
                        <option value="2">2+</option>
                        <option value="2.5">2.5+</option>
                        <option value="3">3+</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Generic advanced filters */}
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-300">
                    {UI.seller[lang]}
                  </label>
                  <select
                    value={sellerType ?? "all"}
                    onChange={(e) =>
                      setSellerType(
                        e.target.value === "all"
                          ? null
                          : (e.target.value as SellerType)
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                  >
                    <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                    <option value="personal">{SELLER_LABELS.personal[lang]}</option>
                    <option value="business">{SELLER_LABELS.business[lang]}</option>
                  </select>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={onlyWithImage}
                    onChange={(e) => setOnlyWithImage(e.target.checked)}
                  />
                  {UI.hasImage[lang]}
                </label>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSellerType(null);
                      setOnlyWithImage(false);
                      setRentasParams((p) => ({
                        ...p,
                        rpmin: "",
                        rpmax: "",
                        rbeds: "",
                        rbaths: "",
                        rtype: "",
                        rpets: "",
                      }));
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  >
                    {UI.clear[lang]}
                  </button>

                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  >
                    {UI.reset[lang]}
                  </button>
                </div>

                <div className="text-[11px] text-gray-500">
                  {lang === "es"
                    ? "Consejo: en móvil usa “Más filtros”."
                    : "Tip: on mobile use “More filters”."}
                </div>
              </div>
            </div>
          )}
        </aside>

<div className="md:col-start-2 md:mt-0">

        {/* TOP QUICK FILTERS (compact) */}
        <section className="mt-3">
          <div className="rounded-2xl border border-white/12 bg-black/30 px-4 py-3 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] ring-1 ring-yellow-600/10 backdrop-blur">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-12 xl:items-end">
              {/* Search */}
              <div ref={searchBoxRef} className="xl:col-span-5">
                <label className="block text-xs font-semibold text-gray-300">{UI.search[lang]}</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={category === "rentas"
                    ? (lang === "es" ? "Buscar: apartamento, cuarto, zona…" : "Search: apartment, room, area…")
                    : category === "autos"
                      ? (lang === "es" ? "Buscar: Toyota, 2016, camioneta…" : "Search: Toyota, 2016, truck…")
                      : (lang === "es" ? "Buscar: trabajo, troca, cuarto…" : "Search: job, truck, room…")}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-yellow-400/40"
                />
              </div>

              {/* Location */}
              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold text-gray-300">{UI.location[lang]}</label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationOpen(true)}
                    className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-left text-sm text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  >
                    {locationLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocationOpen(true)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                  >
                    {UI.edit[lang]}
                  </button>
                </div>
              </div>

              {/* Radius */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">{UI.radius[lang]}</label>
                <select
                  value={String(radiusMi)}
                  onChange={(e) => setRadiusMi(Number(e.target.value) as any)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                >
                  {[10, 25, 40, 50].map((m) => (
                    <option key={m} value={String(m)}>{m} mi</option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">{UI.category[lang]}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryKey)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                >
                  {CATEGORY_ORDER.map((k) => (
                    <option key={k} value={k}>{CATEGORY_LABELS[k][lang]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only">{UI.sort[lang]}</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                >
                  {Object.keys(SORT_LABELS).map((k) => (
                    <option key={k} value={k}>{SORT_LABELS[k as SortKey][lang]}</option>
                  ))}
                </select>

                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                  {(["grid","list","list-img"] as ViewMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setView(m)}
                      className={cx(
                        "rounded-lg px-2 py-1.5 text-xs",
                        view === m ? "bg-yellow-500/20 text-yellow-200" : "text-gray-300 hover:bg-white/10"
                      )}
                      aria-label={m}
                      title={m}
                    >
                      {m === "grid" ? "▦" : m === "list" ? "≡" : "▤"}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40 md:hidden"
                >
                  {UI.moreFilters[lang]}
                </button>
              </div>

              <button
                type="button"
                onClick={resetAll}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              >
                {UI.reset[lang]}
              </button>
            </div>

            {activeChips.length ? (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.clear}
                    className="whitespace-nowrap rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs sm:py-1 text-gray-100 hover:bg-white/8 transition"
                    aria-label={lang === "es" ? "Quitar filtro" : "Remove filter"}
                  >
                    {c.text} <span className="ml-1 opacity-80">×</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>



        {/* RESULTS TOOLBAR (unchanged) */}
        <section className="mt-3 md:sticky md:top-[calc(72px+16px)] z-20" aria-busy={isSwitchingCategory}>
          <div className={cx("rounded-2xl border border-white/10 bg-neutral-900/55 backdrop-blur px-4 py-2.5 sm:py-3 ring-1 ring-yellow-600/10 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] transition-opacity duration-200", isSwitchingCategory ? "opacity-85" : "opacity-100")}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="text-left">
                <div className="text-lg sm:text-xl font-semibold tracking-tight text-yellow-300">
                  {UI.results[lang]}
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                  <span className={cx("inline-flex h-1.5 w-1.5 rounded-full bg-white/20 transition-opacity", isSwitchingCategory ? "opacity-100 bg-yellow-400/60 animate-pulse" : "opacity-0")} aria-hidden="true" />
                  <span className={cx("transition-opacity", isSwitchingCategory ? "opacity-100" : "opacity-0")} aria-live="polite">
                    {lang === "es" ? "Cambiando categoría…" : "Switching category…"}
                  </span>
                </div>
                {category !== "all" ? (
                  <a
                    href={`/clasificados/${category}?lang=${lang}${qSmart ? `&q=${encodeURIComponent(qSmart)}` : ""}${zipMode && zipClean ? `&zip=${encodeURIComponent(zipClean)}` : ""}${!zipMode && city ? `&city=${encodeURIComponent(city)}` : ""}${radiusMi ? `&r=${encodeURIComponent(String(radiusMi))}` : ""}`}
                    className="mt-1 inline-block text-xs text-yellow-200/90 hover:text-yellow-200 underline underline-offset-4"
                  >
                    {lang === "es"
                      ? `Ver página de ${CATEGORY_LABELS[category].es}`
                      : `Open ${CATEGORY_LABELS[category].en} page`}
                  </a>
                ) : null}

                <div className="text-xs font-medium text-gray-300">
                  {UI.showing[lang]}{" "}
                  {filtered.length === 0
                    ? 0
                    : (pageClamped - 1) * perPage + 1}
                  {"–"}
                  {filtered.length === 0
                    ? 0
                    : Math.min(
                        (pageClamped - 1) * perPage +
                          (visible.length + businessTop.length),
                        filtered.length
                      )}{" "}
                  {UI.of[lang]} {filtered.length}
                
                <div className="mt-1 text-[11px] text-gray-400">
                  {lang === "es"
                    ? "Sin trucos: lo gratis también aparece. Anti‑spam automático."
                    : "No tricks: free listings still show. Automatic anti-spam."}
                </div>
</div>

                <div className="mt-1 text-xs text-gray-400">
                  <span className="font-medium text-gray-300">{CATEGORY_LABELS[category][lang]}</span>
                  <span className="mx-2 text-gray-500">•</span>
                  <span>{lang === "es" ? "en" : "in"} {city}</span>
                  <span className="mx-2 text-gray-500">•</span>
                  <span>{radiusMi} mi</span>
                </div>

                                <div className="mt-2 text-[11px] text-gray-400/90">
                  {lang === "es"
                    ? "Tip: en móvil, la vista en cuadrícula muestra más anuncios a la vez."
                    : "Tip: on mobile, grid view shows more listings at once."}
                </div>

<BadgeLegend lang={lang} />
              </div>

              <div className="hidden md:flex items-center justify-between gap-3 md:justify-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setView("list"); localStorage.setItem("leonix_view_mode","list"); }}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "list"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                    )}
                    aria-label={lang === "es" ? "Vista de lista" : "List view"}
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    onClick={() => { setView("list-img"); localStorage.setItem("leonix_view_mode","list-img"); }}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "list-img"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                    )}
                    aria-label={lang === "es" ? "Lista con imagen" : "List with images"}
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    onClick={() => { setView("grid"); localStorage.setItem("leonix_view_mode","grid"); }}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "grid"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                    )}
                    aria-label={lang === "es" ? "Vista de cuadrícula" : "Grid view"}
                  >
                    ▦
                  </button>
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
                  aria-label={UI.sort[lang]}
                >
                  <option value="newest">{SORT_LABELS.newest[lang]}</option>
                  <option value="price-asc">{SORT_LABELS["price-asc"][lang]}</option>
                  <option value="price-desc">{SORT_LABELS["price-desc"][lang]}</option>
                </select>
              </div>
            </div>
          </div>
        
{/* Mobile full-screen Filters/Sort (A3) */}
{mobilePanelOpen ? (
  <div className="fixed inset-0 z-50 md:hidden">
    <div
      className="absolute inset-0 bg-black/70"
      onClick={() => setMobilePanelOpen(false)}
    />
    <div className="absolute inset-0 flex flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/95 backdrop-blur p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobilePanelTab("filters")}
              className={cx(
                "rounded-xl border px-3 py-2 text-sm",
                mobilePanelTab === "filters"
                  ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                  : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              )}
            >
              {lang === "es" ? "Filtros" : "Filters"}
              {activeChips.length ? (
                <span className="ml-2 text-xs text-gray-200/80">
                  ({activeChips.length})
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setMobilePanelTab("sort")}
              className={cx(
                "rounded-xl border px-3 py-2 text-sm",
                mobilePanelTab === "sort"
                  ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                  : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              )}
            >
              {lang === "es" ? "Ordenar" : "Sort"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
            aria-label={lang === "es" ? "Cerrar" : "Close"}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-6 pt-3">
        <div className="h-full overflow-y-auto rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur p-4">
          {mobilePanelTab === "filters" ? (
            <div className="grid grid-cols-1 gap-3">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.search[lang]}
                </label>
                <div className="relative mt-1.5">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length) setSuggestionsOpen(true);
                    }}
                    placeholder={
                      lang === "es"
                        ? "Buscar: trabajo, troca, cuarto…"
                        : "Search: jobs, truck, room…"
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                    aria-label={UI.search[lang]}
                  />

                  {suggestionsOpen && suggestions.length ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/10 bg-black/90 shadow-2xl">
                      <div className="px-3 py-2 text-[11px] text-gray-400">
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
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                        >
                          <span>{CATEGORY_LABELS[c][lang]}</span>
                          <span className="text-xs text-gray-400">
                            {lang === "es" ? "Categoría" : "Category"}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.location[lang]}
                </label>
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                >
                  <span className="truncate">{locationLabel}</span>
                  <span className="ml-3 shrink-0 text-xs text-gray-400">
                    {UI.edit[lang]}
                  </span>
                </button>
                {locMsg ? (
                  <div className="mt-1 text-[11px] text-gray-400">{locMsg}</div>
                ) : null}
              </div>

              {/* Radius */}
              <div>
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.radius[lang]}
                </label>
                <select
                  value={radiusMi}
                  onChange={(e) => setRadiusMi(parseInt(e.target.value, 10))}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/40"
                >
                  {[5, 10, 25, 40, 50].map((r) => (
                    <option key={r} value={r}>
                      {r} mi
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.category[lang]}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryKey)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/40"
                >
                  <option value="all">{CATEGORY_LABELS.all[lang]}</option>
                  <option value="en-venta">{CATEGORY_LABELS["en-venta"][lang]}</option>
                  <option value="rentas">{CATEGORY_LABELS.rentas[lang]}</option>
                  <option value="autos">{CATEGORY_LABELS.autos[lang]}</option>
                  <option value="servicios">{CATEGORY_LABELS.servicios[lang]}</option>
                  <option value="empleos">{CATEGORY_LABELS.empleos[lang]}</option>
                  <option value="clases">{CATEGORY_LABELS.clases[lang]}</option>
                  <option value="comunidad">{CATEGORY_LABELS.comunidad[lang]}</option>
                  <option value="travel">{CATEGORY_LABELS.travel[lang]}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              >
                {UI.moreFilters[lang]}
              </button>

              {activeChips.length ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeChips.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={c.clear}
                      className="whitespace-nowrap rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-xs sm:py-1 text-gray-100 hover:bg-white/8 transition"
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
                <div className="text-sm font-semibold text-gray-200">
                  {lang === "es" ? "Vista" : "View"}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setView("list"); localStorage.setItem("leonix_view_mode","list"); }}
                    className={cx(
                      "rounded-lg border px-3 py-2 text-sm",
                      view === "list"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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
                        ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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
                        ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                    )}
                  >
                    {lang === "es" ? "Cuadrícula" : "Grid"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200">
                  {UI.sort[lang]}
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
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

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => {
              resetAll();
            }}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
          >
            {UI.reset[lang]}
          </button>
          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="flex-1 rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-3 text-sm font-semibold text-gray-100 hover:bg-yellow-500/20"
          >
            {UI.done[lang]}
          </button>
        </div>
      </div>
    </div>
  </div>
) : null}

<div className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
  <div className="mx-auto w-full max-w-6xl px-4 pb-4">
    <div className="rounded-2xl border border-white/10 bg-neutral-900/80 backdrop-blur shadow-lg">
      <div className="flex items-center gap-3 p-3">
        <button
          type="button"
          onClick={() => {
            setMobilePanelTab("filters");
            setMobilePanelOpen(true);
          }}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
        >
          {lang === "es" ? "Filtros" : "Filters"}
          {activeChips.length ? (
            <span className="ml-2 text-xs font-medium text-gray-200/80">
              ({activeChips.length})
            </span>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => {
            setMobilePanelTab("sort");
            setMobilePanelOpen(true);
          }}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gray-100 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
        >
          {lang === "es" ? "Ordenar" : "Sort"}
        </button>
      </div>
    </div>
  </div>
</div>

</section>

        
{businessTop.length ? (
  <section className="mt-6">
    <div className="mb-3 flex items-end justify-between">
      <div>
        <div className="text-sm font-semibold text-yellow-200">
          {lang === "es" ? "Profesionales" : "Businesses"}
        </div>
        <div className="text-xs font-medium text-gray-300">
          {lang === "es"
            ? "Opciones de negocios y profesionales (sin ocultar anuncios personales)"
            : "Business & pro options (personal listings are never hidden)"}
        </div>
      </div>
      <a
        href={`/clasificados/lista?lang=${lang}&cat=${category !== "all" ? category : "all"}&seller=business`}
        className="text-xs text-yellow-200/90 underline underline-offset-4 hover:text-yellow-200"
      >
        {lang === "es" ? "Ver todos" : "View all"}
      </a>
    </div>

    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
      {businessTop.map((x) => (
        <div key={x.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {x.businessName ?? x.title[lang]}
              </div>
              <div className="mt-0.5 text-xs text-gray-300">
                {x.city} • {x.postedAgo[lang]}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleFav(x.id)}
              className={cx(
                "shrink-0 rounded-lg border px-2 py-1 text-xs",
                favIds.has(x.id)
                  ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                  : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              )}
              aria-label={favIds.has(x.id) ? (lang === "es" ? "Quitar de favoritos" : "Remove favorite") : (lang === "es" ? "Guardar favorito" : "Save favorite")}
            >
              {favIds.has(x.id) ? "★" : "☆"}
            </button>
          </div>

          <div className="mt-2 text-sm font-bold text-yellow-200 tracking-tight">{x.priceLabel[lang]}</div>

          <a
            href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
            className="mt-3 block rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
          >
            {lang === "es" ? "Ver detalle" : "View details"}
          </a>
        </div>
      ))}
    </div>
  </section>
) : null}        <section className="mt-6">
          {view === "grid" ? (
            <div
              className={cx(
                "grid gap-2.5 sm:gap-3 md:gap-4",
                filtersCollapsed ? "md:grid-cols-3 lg:grid-cols-4" : "md:grid-cols-3 lg:grid-cols-3"
              )}
            >
              {visible.map(ListingCardGrid)}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 sm:gap-3">
              {visible.map((x) => ListingRow(x, view === "list-img"))}
            </div>
          )}
        </section>

        <section className="mt-6 flex items-center justify-center gap-3 pb-14">
          <button
            type="button"
            disabled={pageClamped <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cx(
              "rounded-xl border px-4 py-2 text-sm",
              pageClamped <= 1
                ? "border-white/10 bg-white/5 text-gray-500"
                : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
            )}
          >
            {UI.prev[lang]}
          </button>

          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200">
            {pageClamped}/{totalPages}
          </div>

          <button
            type="button"
            disabled={pageClamped >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cx(
              "rounded-xl border px-4 py-2 text-sm",
              pageClamped >= totalPages
                ? "border-white/10 bg-white/5 text-gray-500"
                : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
            )}
          >
            {UI.next[lang]}
          </button>
        </section>

        </div>
        </div>
      </main>

      {/* MORE FILTERS DRAWER (unchanged) */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMoreOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-semibold tracking-tight text-yellow-300">{UI.moreFilters[lang]}</div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              >
                {UI.close[lang]}
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300">{UI.seller[lang]}</label>
                <select
                  value={sellerType ?? "all"}
                  onChange={(e) => setSellerType(e.target.value === "all" ? null : (e.target.value as SellerType))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none"
                >
                  <option value="all">{lang === "es" ? "Todos" : "All"}</option>
                  <option value="personal">{SELLER_LABELS.personal[lang]}</option>
                  <option value="business">{SELLER_LABELS.business[lang]}</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={onlyWithImage}
                  onChange={(e) => setOnlyWithImage(e.target.checked)}
                />
                {UI.hasImage[lang]}
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSellerType(null);
                    setOnlyWithImage(false);
                  }}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                >
                  {UI.clear[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-2 text-sm text-gray-100 hover:bg-yellow-500/20"
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
          <div className="absolute inset-0 bg-black/70" onClick={() => setLocationOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-lg sm:text-xl font-semibold tracking-tight text-yellow-300">{UI.location[lang]}</div>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
              >
                {UI.close[lang]}
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div ref={citySuggestRef} className="relative">
                <label className="block text-xs font-semibold text-gray-300">
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                />

                {citySuggestOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/90 shadow-xl">
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
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="mt-1 text-[11px] text-gray-400">
                  {lang === "es"
                    ? "Si eliges ciudad, el ZIP se limpia automáticamente."
                    : "If you pick a city, ZIP is cleared automatically."}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300">
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                />

                <div className="mt-1 text-[11px] text-gray-400">
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
                  <div className="mt-2 text-xs text-gray-300">
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
                    ? "border-white/10 bg-white/5 text-gray-500"
                    : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
                >
                  {UI.clear[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-2 text-sm text-gray-100 hover:bg-yellow-500/20"
                >
                  {UI.done[lang]}
                </button>
              </div>
            </div>

            {nearbyCityChips.length ? (
              <div className="mt-5">
                <div className="text-xs font-semibold text-gray-300">
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
                          ? "border-yellow-500/40 bg-yellow-500/15 text-gray-100"
                          : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-yellow-400/40"
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

      {/* Back To Top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-yellow-500 p-3 text-black shadow-lg hover:bg-yellow-400 md:hidden"
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}