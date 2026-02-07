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
  | "comunidad";

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
};

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
    v === "comunidad"
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

  const [page, setPage] = useState(1);
  const perPage = 9;

  const [compact, setCompact] = useState(false);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    setView(isMobile ? "list-img" : "grid");
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

    const sorted = [...base].sort((a, b) => {
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
  }, [listings, qSmart, category, sellerType, onlyWithImage, anchor, radiusMi, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage(1);
  }, [q, city, zip, radiusMi, category, sort, sellerType, onlyWithImage]);

  const visible = useMemo(() => {
    const start = (pageClamped - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, pageClamped]);

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
  }, [q, lang, zipMode, zipClean, city, locationLabel, radiusMi, category, sort, sellerType, onlyWithImage]);

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
    });
  }, [lang, q, category, sort, view, radiusMi, zipMode, zipClean, city]);

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

  const ListingCardGrid = (x: Listing) => (
    <div
      key={x.id}
      className="rounded-2xl border border-white/10 bg-black/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{x.title[lang]}</div>
          <div className="mt-1 text-sm text-gray-300">
            {x.city} • {x.postedAgo[lang]}
          </div>
        </div>
        {x.hasImage ? (
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
            📷
          </div>
        ) : null}
      </div>

      <div className="mt-3 text-lg font-semibold text-yellow-300">
        {x.priceLabel[lang]}
      </div>
      <div className="mt-3 line-clamp-3 text-sm text-gray-200">
        {x.blurb[lang]}
      </div>

      <a
        href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
        className="mt-5 block rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10"
      >
        {lang === "es" ? "Ver detalle" : "View details"}
      </a>
    </div>
  );

  const ListingRow = (x: Listing, withImg: boolean) => (
    <a
      key={x.id}
      href={`/clasificados/anuncio/${x.id}?lang=${lang}`}
      className="group flex items-stretch gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 hover:bg-white/10"
    >
      {withImg ? (
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {x.hasImage ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-200">
              📷
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
              —
            </div>
          )}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white group-hover:text-yellow-100">
              {x.title[lang]}
            </div>
            <div className="mt-1 text-xs text-gray-300">
              {x.city} • {x.postedAgo[lang]}
            </div>
          </div>
          <div className="shrink-0 text-sm font-semibold text-yellow-300">
            {x.priceLabel[lang]}
          </div>
        </div>
        <div className="mt-2 line-clamp-2 text-xs text-gray-200">
          {x.blurb[lang]}
        </div>
      </div>
    </a>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-6 pt-28">
        <div className="text-center">
          <div className="mx-auto mb-4 flex w-full items-center justify-center">
            <Image
              src={newLogo}
              alt="LEONIX Media"
              width={110}
              height={110}
              priority
              className="h-auto w-[110px]"
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

        {/* FILTER BAR (Option B: shorter height ONLY) */}
        <section
          className={cx(
            "sticky top-[72px] z-30 mt-10",
            "rounded-2xl border border-white/10 bg-black/60 backdrop-blur",
            compact ? "shadow-lg" : ""
          )}
        >
          {/* CHANGED: p-4 md:p-5 -> p-3 md:p-4 */}
          <div className={cx("p-3 md:p-4", compact ? "md:py-3" : "")}>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:items-end">
              {/* Search */}
              <div ref={searchBoxRef} className="col-span-2 md:col-span-5">
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.search[lang]}
                </label>
                <div className="relative mt-1.5">
                  {/* CHANGED: py-3 -> py-2.5 */}
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
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                    aria-label={UI.search[lang]}
                  />

                  {suggestionsOpen && suggestions.length ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-2xl">
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
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-white hover:bg-white/10"
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
              <div className="col-span-1 md:col-span-3">
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.location[lang]}
                </label>
                {/* CHANGED: py-3 -> py-2.5 */}
                <button
                  type="button"
                  onClick={() => setLocationOpen(true)}
                  className="mt-1.5 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-left text-sm text-white hover:bg-white/10"
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
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.radius[lang]}
                </label>
                {/* CHANGED: py-3 -> py-2.5 */}
                <select
                  value={radiusMi}
                  onChange={(e) => setRadiusMi(parseInt(e.target.value, 10))}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/40"
                >
                  {[5, 10, 25, 40, 50].map((r) => (
                    <option key={r} value={r}>
                      {r} mi
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-gray-300">
                  {UI.category[lang]}
                </label>
                {/* CHANGED: py-3 -> py-2.5 */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryKey)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-500/40"
                >
                  <option value="all">{CATEGORY_LABELS.all[lang]}</option>
                  <option value="en-venta">
                    {CATEGORY_LABELS["en-venta"][lang]}
                  </option>
                  <option value="rentas">{CATEGORY_LABELS.rentas[lang]}</option>
                  <option value="autos">{CATEGORY_LABELS.autos[lang]}</option>
                  <option value="servicios">
                    {CATEGORY_LABELS.servicios[lang]}
                  </option>
                  <option value="empleos">
                    {CATEGORY_LABELS.empleos[lang]}
                  </option>
                  <option value="clases">{CATEGORY_LABELS.clases[lang]}</option>
                  <option value="comunidad">
                    {CATEGORY_LABELS.comunidad[lang]}
                  </option>
                </select>
              </div>

              {/* Buttons */}
              <div className="col-span-2 flex items-center justify-between gap-3 md:col-span-12 md:justify-end">
                <button
                  type="button"
                  onClick={() => setMoreOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {UI.moreFilters[lang]}
                </button>

                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {UI.reset[lang]}
                </button>
              </div>
            </div>

            {/* CHANGED: mt-3 -> mt-2 */}
            {activeChips.length ? (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1">
                {activeChips.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={c.clear}
                    className="whitespace-nowrap rounded-full border border-yellow-600/30 bg-yellow-600/10 px-3 py-1 text-xs text-yellow-100 hover:bg-yellow-600/15"
                    aria-label={lang === "es" ? "Quitar filtro" : "Remove filter"}
                  >
                    {c.text} <span className="ml-1 opacity-80">×</span>
                  </button>
                ))}
              </div>
            ) : null}

            {/* CHANGED: mt-3 -> mt-2 */}
            {nearbyCityChips.length ? (
              <div className="mt-2 hidden items-center gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => scrollChips("left")}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"
                  aria-label={lang === "es" ? "Desplazar izquierda" : "Scroll left"}
                >
                  ‹
                </button>
                <div
                  ref={chipsRowRef}
                  className="flex flex-1 items-center gap-2 overflow-x-auto pb-1"
                >
                  {nearbyCityChips.map((c) => (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => {
                        setCity(c.city);
                        setZip("");
                      }}
                      className={cx(
                        "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
                        normalize(c.city) === normalize(resolvedCity.name)
                          ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                          : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                      )}
                    >
                      {c.city}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => scrollChips("right")}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-gray-200 hover:bg-white/10"
                  aria-label={lang === "es" ? "Desplazar derecha" : "Scroll right"}
                >
                  ›
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* RESULTS TOOLBAR (unchanged) */}
        <section className="sticky top-[calc(72px+16px)] z-20 mt-4">
          <div className="rounded-2xl border border-white/10 bg-black/55 backdrop-blur px-4 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-left">
                <div className="text-lg font-semibold text-yellow-300">
                  {UI.results[lang]}
                </div>
                <div className="text-xs text-gray-300">
                  {UI.showing[lang]} {visible.length} {UI.of[lang]}{" "}
                  {filtered.length}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 md:justify-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "list"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                    aria-label={lang === "es" ? "Vista de lista" : "List view"}
                  >
                    ≡
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list-img")}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "list-img"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                    aria-label={lang === "es" ? "Lista con imagen" : "List with images"}
                  >
                    ☰
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("grid")}
                    className={cx(
                      "rounded-lg border px-2 py-2 text-xs",
                      view === "grid"
                        ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                    aria-label={lang === "es" ? "Vista de cuadrícula" : "Grid view"}
                  >
                    ▦
                  </button>
                </div>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
                  aria-label={UI.sort[lang]}
                >
                  <option value="newest">{SORT_LABELS.newest[lang]}</option>
                  <option value="price-asc">{SORT_LABELS["price-asc"][lang]}</option>
                  <option value="price-desc">{SORT_LABELS["price-desc"][lang]}</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {view === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visible.map(ListingCardGrid)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visible.map((x) => ListingRow(x, view === "list-img"))}
            </div>
          )}
        </section>

        <section className="mt-8 flex items-center justify-center gap-3 pb-16">
          <button
            type="button"
            disabled={pageClamped <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cx(
              "rounded-xl border px-4 py-2 text-sm",
              pageClamped <= 1
                ? "border-white/10 bg-white/5 text-gray-500"
                : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
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
                : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
            )}
          >
            {UI.next[lang]}
          </button>
        </section>
      </main>

      {/* MORE FILTERS DRAWER (unchanged) */}
      {moreOpen ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMoreOpen(false)} />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-yellow-300">{UI.moreFilters[lang]}</div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200 hover:bg-white/10"
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm text-white outline-none"
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
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {UI.clear[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-500/20"
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
              <div className="text-lg font-semibold text-yellow-300">{UI.location[lang]}</div>
              <button
                type="button"
                onClick={() => setLocationOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-gray-200 hover:bg-white/10"
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
                />

                {citySuggestOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-56 overflow-auto rounded-xl border border-white/10 bg-black/95 shadow-xl">
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
                        className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
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
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-500/40"
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

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={onUseMyLocation}
                disabled={usingMyLocation}
                className={cx(
                  "rounded-xl border px-4 py-2 text-sm",
                  usingMyLocation
                    ? "border-white/10 bg-white/5 text-gray-500"
                    : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
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
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10"
                >
                  {UI.clear[lang]}
                </button>
                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  className="rounded-xl border border-yellow-500/30 bg-yellow-500/15 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-500/20"
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
                        "rounded-full border px-3 py-1 text-xs",
                        normalize(c.city) === normalize(resolvedCity.name)
                          ? "border-yellow-500/40 bg-yellow-500/15 text-yellow-100"
                          : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
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
    </div>
  );
}
