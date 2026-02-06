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

type LatLng = { lat: number; lng: number };

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
  useMyLocation: { es: "Usar mi ubicación", en: "Use my location" },
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

/** Small, controlled Levenshtein for fuzzy assist (typos) */
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

/** Distance in miles */
function haversineMi(a: LatLng, b: LatLng) {
  const R = 3958.8; // miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(aa));
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

  // Suggestions UX state (SEARCH ONLY)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<
    Array<Exclude<CategoryKey, "all">>
  >([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Location UX state
  const [locMsg, setLocMsg] = useState<string>("");
  const [usingMyLocation, setUsingMyLocation] = useState(false);

  // City dropdown (autocomplete)
  const [cityOpen, setCityOpen] = useState(false);
  const [cityOptions, setCityOptions] = useState<Array<{ city: string; d: number }>>(
    []
  );
  const cityBoxRef = useRef<HTMLDivElement | null>(null);
  const cityInputRef = useRef<HTMLInputElement | null>(null);

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

  /** Controlled synonym map → category (categories-only suggestions) */
  const synonymIndex = useMemo(() => {
    const base: Array<[Exclude<CategoryKey, "all">, string[]]> = [
      [
        "autos",
        [
          // ES
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
          // EN
          "car",
          "cars",
          "truck",
          "trucks",
          "pickup",
          "suv",
          "van",
        ],
      ],
      [
        "rentas",
        [
          // ES
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
          // EN
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
          // ES
          "empleo",
          "empleos",
          "trabajo",
          "trabajos",
          "jale",
          "vacante",
          "vacantes",
          "contratando",
          "se busca",
          // EN
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
          // ES
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
          // EN
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
          // ES
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
          // EN
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
          // ES
          "clase",
          "clases",
          "curso",
          "cursos",
          "tutor",
          "tutoria",
          "tutoría",
          "lecciones",
          // EN
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
          // ES
          "comunidad",
          "evento",
          "eventos",
          "iglesia",
          "ayuda",
          "donacion",
          "donación",
          "voluntario",
          // EN
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

    // Build an index: normalized synonym → category
    const index = new Map<string, Exclude<CategoryKey, "all">>();

    for (const [cat, words] of base) {
      for (const w of words) {
        const key = normalize(w);
        if (!key) continue;
        if (!index.has(key)) index.set(key, cat);
      }
      index.set(normalize(categoryLabel(cat)), cat);
      index.set(normalize(cat), cat);
    }

    const keys = Array.from(index.keys());
    return { index, keys };
  }, [lang]);

  /** Compute search suggestions (categories only) */
  useEffect(() => {
    const val = normalize(q);

    // Rule 1: no suggestions until 3 chars
    if (!val || val.length < 3) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const { index, keys } = synonymIndex;

    // Mode A: prefix matches
    const prefixMatches = new Set<Exclude<CategoryKey, "all">>();
    for (const k of keys) {
      if (k.startsWith(val)) {
        const cat = index.get(k);
        if (cat) prefixMatches.add(cat);
      }
    }

    let next: Array<Exclude<CategoryKey, "all">> = [];

    if (prefixMatches.size > 0) {
      for (const c of CATEGORY_ORDER) {
        if (prefixMatches.has(c)) next.push(c);
      }
      next = next.slice(0, 3);
    } else if (val.length >= 5) {
      // Mode B: fuzzy assist
      let bestKey = "";
      let bestCat: Exclude<CategoryKey, "all"> | null = null;
      let bestDist = Number.POSITIVE_INFINITY;

      for (const k of keys) {
        if (k.length < 4) continue;
        const d = levenshtein(val, k);
        if (d < bestDist) {
          bestDist = d;
          bestKey = k;
          bestCat = synonymIndex.index.get(k) ?? null;
        }
      }

      if (bestCat) {
        const maxLen = Math.max(val.length, bestKey.length);
        const similarity = maxLen === 0 ? 0 : 1 - bestDist / maxLen;
        if (bestDist <= 2 && similarity >= 0.6) {
          next = [bestCat];
        }
      }
    }

    setSuggestions(next);
    setSuggestionsOpen(next.length > 0);
  }, [q, synonymIndex]);

  /** Close search suggestions on true outside pointerdown (capture phase) */
  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (searchBoxRef.current && searchBoxRef.current.contains(t)) return;
      setSuggestionsOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  // --- LOCATION DERIVED STATE (NO norcal.ts changes) ---
  const zipClean = useMemo(() => {
    const digits = (zip || "").replace(/\D/g, "").slice(0, 5);
    return digits;
  }, [zip]);

  const zipMode = zipClean.length === 5;

  const caCityIndex = useMemo(() => {
    const byNorm = new Map<string, { city: string; lat: number; lng: number }>();
    for (const c of CA_CITIES) {
      byNorm.set(normalize((c as any).city), { city: (c as any).city, lat: c.lat, lng: c.lng });
    }
    const norms = Array.from(byNorm.keys());
    return { byNorm, norms };
  }, []);

  const resolveCityToCanonical = useMemo(() => {
    const typed = city;
    const n = normalize(typed);
    if (!n) return { canonicalCity: DEFAULT_CITY, latLng: undefined as LatLng | undefined, resolvedFrom: "default" as const };

    // alias -> canonical name
    const alias = CITY_ALIASES[n];
    const key = alias ? normalize(alias) : n;

    const direct = caCityIndex.byNorm.get(key);
    if (direct) {
      return { canonicalCity: direct.city, latLng: { lat: direct.lat, lng: direct.lng }, resolvedFrom: "direct" as const };
    }

    // fuzzy to nearest NAME (string similarity) – conservative
    if (key.length >= 3) {
      let bestNorm = "";
      let bestDist = Number.POSITIVE_INFINITY;

      for (const k of caCityIndex.norms) {
        const d = levenshtein(key, k);
        if (d < bestDist) {
          bestDist = d;
          bestNorm = k;
        }
      }

      const maxLen = Math.max(key.length, bestNorm.length);
      const similarity = maxLen === 0 ? 0 : 1 - bestDist / maxLen;

      // conservative gating: prevents weird jumps on short inputs
      if (bestNorm && bestDist <= 2 && similarity >= 0.6) {
        const hit = caCityIndex.byNorm.get(bestNorm);
        if (hit) {
          return { canonicalCity: hit.city, latLng: { lat: hit.lat, lng: hit.lng }, resolvedFrom: "fuzzy" as const };
        }
      }
    }

    return { canonicalCity: DEFAULT_CITY, latLng: undefined as LatLng | undefined, resolvedFrom: "unknown" as const };
  }, [city, caCityIndex.byNorm, caCityIndex.norms]);

  const zipAnchor = useMemo(() => {
    if (!zipMode) return { known: false, latLng: undefined as LatLng | undefined };
    const ll = (ZIP_GEO as any)[zipClean] as LatLng | undefined;
    return { known: Boolean(ll), latLng: ll };
  }, [zipClean, zipMode]);

  const anchor = useMemo(() => {
    // ZIP wins when valid/known
    if (zipMode && zipAnchor.known && zipAnchor.latLng) {
      return { latLng: zipAnchor.latLng, anchorCityLabel: "" };
    }
    // else use city if resolvable
    if (resolveCityToCanonical.latLng) {
      return { latLng: resolveCityToCanonical.latLng, anchorCityLabel: resolveCityToCanonical.canonicalCity };
    }
    // no anchor => none
    return { latLng: undefined as LatLng | undefined, anchorCityLabel: "" };
  }, [zipMode, zipAnchor.known, zipAnchor.latLng, resolveCityToCanonical.latLng, resolveCityToCanonical.canonicalCity]);

  const nearbyCityChips = useMemo(() => {
    if (!anchor.latLng) return [];

    const cap = radiusMi <= 10 ? 6 : radiusMi <= 25 ? 10 : 14;
    const rows: Array<{ city: string; d: number }> = [];

    for (const c of CA_CITIES) {
      const d = haversineMi(anchor.latLng, { lat: c.lat, lng: c.lng });
      if (d <= radiusMi) rows.push({ city: (c as any).city, d });
    }

    rows.sort((a, b) => a.d - b.d);

    // Remove duplicates by normalized city
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
  }, [anchor.latLng, radiusMi]);

  // Location helper text (premium + calm)
  useEffect(() => {
    if (zipMode) {
      if (!zipAnchor.known) {
        setLocMsg(
          lang === "es"
            ? "ZIP no reconocido — usando ciudad + radio."
            : "ZIP not found — using city + radius."
        );
      } else if (usingMyLocation) {
        setLocMsg(lang === "es" ? "Usando tu ubicación actual" : "Using your current location");
      } else {
        setLocMsg("");
      }
      return;
    }

    // City mode
    if (usingMyLocation) {
      setLocMsg(lang === "es" ? "Usando tu ubicación actual" : "Using your current location");
      return;
    }

    if (resolveCityToCanonical.resolvedFrom === "fuzzy") {
      setLocMsg(
        lang === "es"
          ? `Buscando cerca de: ${resolveCityToCanonical.canonicalCity}`
          : `Searching near: ${resolveCityToCanonical.canonicalCity}`
      );
      return;
    }

    if (resolveCityToCanonical.resolvedFrom === "unknown" && normalize(city) && normalize(city) !== normalize(DEFAULT_CITY)) {
      setLocMsg(
        lang === "es"
          ? `Buscando en NorCal (cerca de ${DEFAULT_CITY})`
          : `Searching NorCal (near ${DEFAULT_CITY})`
      );
      return;
    }

    setLocMsg("");
  }, [zipMode, zipAnchor.known, usingMyLocation, lang, resolveCityToCanonical.resolvedFrom, resolveCityToCanonical.canonicalCity, city]);

  // --- CITY AUTOCOMPLETE DROPDOWN ---
  useEffect(() => {
    if (zipMode) {
      setCityOpen(false);
      setCityOptions([]);
      return;
    }

    const n = normalize(city);
    if (!n || n.length < 2) {
      setCityOpen(false);
      setCityOptions([]);
      return;
    }

    // prefix first, then includes (kept light)
    const prefix: Array<{ city: string; d: number }> = [];
    const contains: Array<{ city: string; d: number }> = [];

    for (const c of CA_CITIES) {
      const name = (c as any).city as string;
      const nn = normalize(name);
      if (nn.startsWith(n)) prefix.push({ city: name, d: 0 });
      else if (nn.includes(n)) contains.push({ city: name, d: 1 });
    }

    const next = [...prefix.slice(0, 8), ...contains.slice(0, Math.max(0, 8 - prefix.length))];
    setCityOptions(next);
    setCityOpen(next.length > 0);
  }, [city, zipMode]);

  /** Close city dropdown on true outside pointerdown (capture phase) */
  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      const t = e.target as Node | null;
      if (!t) return;
      if (cityBoxRef.current && cityBoxRef.current.contains(t)) return;
      setCityOpen(false);
    }
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, []);

  // --- GEOLOCATION BUTTON ---
  const onUseMyLocation = () => {
    setUsingMyLocation(true);
    setLocMsg("");

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocMsg(lang === "es" ? "Ubicación no disponible" : "Location unavailable");
      setUsingMyLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        // NorCal safety: if clearly outside our dataset bounds, snap to DEFAULT_CITY
        let minLat = Number.POSITIVE_INFINITY;
        let maxLat = Number.NEGATIVE_INFINITY;
        let minLng = Number.POSITIVE_INFINITY;
        let maxLng = Number.NEGATIVE_INFINITY;

        for (const c of CA_CITIES) {
          minLat = Math.min(minLat, c.lat);
          maxLat = Math.max(maxLat, c.lat);
          minLng = Math.min(minLng, c.lng);
          maxLng = Math.max(maxLng, c.lng);
        }

        const margin = 0.75; // ~ generous envelope
        const inside =
          ll.lat >= minLat - margin &&
          ll.lat <= maxLat + margin &&
          ll.lng >= minLng - margin &&
          ll.lng <= maxLng + margin;

        if (!inside) {
          setCity(DEFAULT_CITY);
          setZip("");
          setLocMsg(
            lang === "es"
              ? `Mostrando resultados en NorCal (cerca de ${DEFAULT_CITY})`
              : `Showing NorCal results (near ${DEFAULT_CITY})`
          );
          setUsingMyLocation(false);
          return;
        }

        // Pick nearest canonical city by distance
        let bestCity = DEFAULT_CITY;
        let bestD = Number.POSITIVE_INFINITY;

        for (const c of CA_CITIES) {
          const d = haversineMi(ll, { lat: c.lat, lng: c.lng });
          if (d < bestD) {
            bestD = d;
            bestCity = (c as any).city;
          }
        }

        setCity(bestCity);
        setZip("");
        setLocMsg(lang === "es" ? "Usando tu ubicación actual" : "Using your current location");
        setUsingMyLocation(false);
      },
      () => {
        setLocMsg(
          lang === "es"
            ? "No se pudo obtener tu ubicación"
            : "Unable to get your location"
        );
        setUsingMyLocation(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  };

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

    const wantLatLng = (() => {
      // ZIP wins if known
      if (zipMode && zipAnchor.known && zipAnchor.latLng) return zipAnchor.latLng;

      // Else city anchor if resolvable
      if (resolveCityToCanonical.latLng) return resolveCityToCanonical.latLng;

      return undefined;
    })();

    const withinRadius = (listingCity: string) => {
      if (!wantLatLng) return true;

      const lcNorm = normalize(listingCity);
      const alias = CITY_ALIASES[lcNorm];
      const key = alias ? normalize(alias) : lcNorm;

      const c = CA_CITIES.find((x) => normalize((x as any).city) === key);
      if (!c) return true;

      const d = haversineMi(wantLatLng, { lat: c.lat, lng: c.lng });
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
          .replace(/\bpick-?up\b/g, "truck")
          .replace(/\btrabajo\b/g, "empleos")
          .replace(/\bjobs?\b/g, "empleos")
          .replace(/\bhouse\b/g, "rentas")
          .replace(/\bhome\b/g, "rentas");

        return hay.includes(qSyn);
      })
      .sort((a, b) => {
        if (sort === "newest") return 0;
        const ap = a.price ?? 0;
        const bp = b.price ?? 0;
        if (sort === "price-asc") return ap - bp;
        return bp - ap;
      });
  }, [
    q,
    category,
    city,
    zip,
    radiusMi,
    sellerType,
    onlyWithImage,
    sort,
    zipMode,
    zipAnchor.known,
    zipAnchor.latLng,
    resolveCityToCanonical.latLng,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageClamped = Math.min(Math.max(1, page), totalPages);

  const visible = useMemo(() => {
    const start = (pageClamped - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, pageClamped, perPage]);

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
              <div ref={searchBoxRef} className="relative md:col-span-5">
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
                      ? "Buscar: trabajo, troca, cuarto..."
                      : "Search: jobs, truck, room..."
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/40"
                />
                {suggestionsOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-xl">
                    {suggestions.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setCategory(cat);
                          setSuggestionsOpen(false);
                          inputRef.current?.focus();
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
                      >
                        {categoryLabel(cat)}
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
                  {/* City + dropdown */}
                  <div ref={cityBoxRef} className="relative">
                    <input
                      ref={cityInputRef}
                      value={city}
                      onChange={(e) => {
                        setCity(e.target.value);
                        setUsingMyLocation(false);
                      }}
                      onFocus={() => {
                        if (!zipMode && cityOptions.length > 0) setCityOpen(true);
                      }}
                      placeholder={LABELS.city[lang]}
                      disabled={zipMode}
                      className={cx(
                        "w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/40",
                        zipMode && "cursor-not-allowed opacity-60"
                      )}
                    />

                    {cityOpen && !zipMode && cityOptions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/95 shadow-xl">
                        {cityOptions.map((opt) => (
                          <button
                            key={opt.city}
                            type="button"
                            onPointerDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setCity(opt.city);
                              setZip("");
                              setUsingMyLocation(false);
                              setCityOpen(false);
                              cityInputRef.current?.focus();
                            }}
                            className="block w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/5"
                          >
                            {opt.city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ZIP */}
                  <input
                    value={zip}
                    onChange={(e) => {
                      setZip(e.target.value);
                      setUsingMyLocation(false);
                      // If they start using ZIP, close city dropdown
                      setCityOpen(false);
                    }}
                    placeholder={LABELS.zip[lang]}
                    inputMode="numeric"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-yellow-400/40"
                  />
                </div>

                {/* Helper + Use my location */}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="min-h-[16px] text-[11px] text-gray-400">
                    {locMsg}
                  </div>

                  <button
                    type="button"
                    onClick={onUseMyLocation}
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10"
                  >
                    {LABELS.useMyLocation[lang]}
                  </button>
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

            {/* Nearby city chips (expand with radius) */}
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                {nearbyCityChips.map((c) => (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() => {
                      setCity(c.city);
                      setZip("");
                      setUsingMyLocation(false);
                      setCityOpen(false);
                    }}
                    className={cx(
                      "rounded-full border px-3 py-1 text-[11px] transition",
                      normalize(city) === normalize(c.city) && !zipMode
                        ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-200"
                        : "border-white/10 bg-white/5 text-gray-200 hover:bg-white/10"
                    )}
                    title={`${Math.round(c.d)} mi`}
                  >
                    {c.city}
                  </button>
                ))}

                {nearbyCityChips.length === 0 && (
                  <div className="text-[11px] text-gray-500">
                    {lang === "es"
                      ? "Escribe una ciudad o ZIP para ver áreas cercanas."
                      : "Type a city or ZIP to see nearby areas."}
                  </div>
                )}
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
                  setCityOpen(false);
                  setUsingMyLocation(false);
                  setLocMsg("");
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
