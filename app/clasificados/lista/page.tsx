"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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

type Suggestion =
  | { kind: "term"; label: string; value: string }
  | { kind: "category"; label: string; cat: Exclude<CategoryKey, "all"> }
  | { kind: "recent"; label: string; value: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ClasificadosLandingPage() {
  const router = useRouter();
  const params = useSearchParams()!;
  const lang = ((params.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        pageTitle: "Clasificados",
        subtitle:
          "Busca rápido. Publica fácil. Comunidad primero. Ventaja premium para quienes invierten — sin esconder anuncios gratuitos.",
        searchLabel: "Buscar",
        searchPh: "Busca: “troca”, “cuarto”, “chamba”, “2003 Toyota Celica”…",
        locationLabel: "Ubicación",
        categoryLabel: "Categoría",

        ctaSearch: "Buscar",
        ctaPost: "Publicar anuncio",
        ctaBrowseAll: "Ver todo",

        popularTitle: "Búsquedas populares",
        categoriesTitle: "Explorar por categoría",

        locationModalTitle: "Ubicación",
        locationModalHint:
          "Elige ciudad o ZIP y ajusta el radio. Cancelar no cambia nada.",
        cityLabel: "Ciudad",
        zipLabel: "ZIP (opcional)",
        radiusLabel: "Radio",
        useMyLocation: "Usar mi ubicación",
        cancel: "Cancelar",
        apply: "Aplicar",

        sourceCity: "Ciudad",
        sourceZip: "ZIP",
        sourceGps: "GPS",

        routePost: "/clasificados/publicar",
        routeBrowseAll: "/clasificados/lista",
      },
      en: {
        pageTitle: "Classifieds",
        subtitle:
          "Search fast. Post easily. Community first. Premium advantage for investors — without hiding free listings.",
        searchLabel: "Search",
        searchPh: 'Try: "truck", "room", "job", "2003 Toyota Celica"...',
        locationLabel: "Location",
        categoryLabel: "Category",

        ctaSearch: "Search",
        ctaPost: "Post listing",
        ctaBrowseAll: "Browse all",

        popularTitle: "Popular searches",
        categoriesTitle: "Explore by category",

        locationModalTitle: "Location",
        locationModalHint:
          "Choose a city or ZIP and adjust the radius. Cancel changes nothing.",
        cityLabel: "City",
        zipLabel: "ZIP (optional)",
        radiusLabel: "Radius",
        useMyLocation: "Use my location",
        cancel: "Cancel",
        apply: "Apply",

        sourceCity: "City",
        sourceZip: "ZIP",
        sourceGps: "GPS",

        routePost: "/clasificados/publicar",
        routeBrowseAll: "/clasificados/lista",
      },
    } as const;

    return ui[lang];
  }, [lang]);

  // -------------------------
  // Helpers
  // -------------------------
  const normalize = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const tokenize = (s: string) =>
    normalize(s)
      .split(/[^a-z0-9]+/g)
      .map((x) => x.trim())
      .filter(Boolean);

  const levenshtein = (a: string, b: string) => {
    const s = normalize(a);
    const t2 = normalize(b);
    const n = s.length;
    const m = t2.length;
    if (!n) return m;
    if (!m) return n;
    const dp = new Array(m + 1).fill(0);
    for (let j = 0; j <= m; j++) dp[j] = j;
    for (let i = 1; i <= n; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= m; j++) {
        const cur = dp[j];
        const cost = s[i - 1] === t2[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = cur;
      }
    }
    return dp[m];
  };

  const isFuzzyHit = (query: string, candidate: string) => {
    const q = normalize(query);
    const c = normalize(candidate);
    if (!q || !c) return false;
    if (c.includes(q)) return true;
    const max = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
    return levenshtein(q, c) <= max;
  };

  const haversineMi = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ) => {
    const R = 3958.8;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
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

  // -------------------------
  // Category labels
  // -------------------------
  const categoryMeta = useMemo(() => {
    const map: Record<Exclude<CategoryKey, "all">, { es: string; en: string }> =
      {
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

  const CATEGORY_ORDER: Array<Exclude<CategoryKey, "all">> = useMemo(
    () => ["autos", "rentas", "empleos", "servicios", "en-venta", "clases", "comunidad"],
    []
  );

  // -------------------------
  // Search intelligence
  // -------------------------
  const CANONICAL_TERMS = useMemo(() => {
    const es = [
      "Autos",
      "Automóvil",
      "Vehículo",
      "Rentas",
      "Departamento",
      "Casa",
      "Cuarto",
      "Servicios",
      "Empleos",
      "Trabajo",
      "Clases",
      "Comunidad",
      "En Venta",
    ];
    const en = [
      "Autos",
      "Vehicle",
      "Car",
      "Rentals",
      "Apartment",
      "House",
      "Room",
      "Services",
      "Jobs",
      "Work",
      "Classes",
      "Community",
      "For Sale",
    ];
    return lang === "es" ? es : en;
  }, [lang]);

  const SLANG_TO_CANONICAL = useMemo(() => {
    const es: Record<string, string[]> = {
      carro: ["Autos", "Automóvil", "Vehículo"],
      troca: ["Autos", "Vehículo"],
      camioneta: ["Autos", "Vehículo"],
      coche: ["Autos", "Automóvil"],
      depa: ["Rentas", "Departamento"],
      apartamento: ["Rentas", "Departamento"],
      renta: ["Rentas"],
      rentar: ["Rentas"],
      cuarto: ["Rentas", "Cuarto"],
      trabajo: ["Empleos", "Trabajo"],
      jale: ["Empleos", "Trabajo"],
      chamba: ["Empleos", "Trabajo"],
      empleo: ["Empleos", "Trabajo"],
      clases: ["Clases"],
      comunidad: ["Comunidad"],
      venta: ["En Venta"],
      vendiendo: ["En Venta"],
      servicio: ["Servicios"],
      servicios: ["Servicios"],
    };

    const en: Record<string, string[]> = {
      car: ["Autos", "Car", "Vehicle"],
      vehicle: ["Vehicle", "Autos"],
      truck: ["Vehicle", "Autos"],
      apt: ["Rentals", "Apartment"],
      apartment: ["Rentals", "Apartment"],
      rent: ["Rentals"],
      job: ["Jobs", "Work"],
      work: ["Jobs", "Work"],
      classes: ["Classes"],
      community: ["Community"],
      sale: ["For Sale"],
      services: ["Services"],
      service: ["Services"],
    };

    return lang === "es" ? es : en;
  }, [lang]);

  const QUERY_TO_CATEGORY = useMemo(() => {
    const es: Array<{ keys: string[]; cat: Exclude<CategoryKey, "all"> }> = [
      {
        keys: ["auto", "autos", "automovil", "vehiculo", "carro", "troca", "camioneta", "coche"],
        cat: "autos",
      },
      {
        keys: ["renta", "rentas", "depa", "departamento", "casa", "cuarto", "apartamento"],
        cat: "rentas",
      },
      { keys: ["trabajo", "empleos", "empleo", "chamba", "jale"], cat: "empleos" },
      { keys: ["servicio", "servicios"], cat: "servicios" },
      { keys: ["clase", "clases"], cat: "clases" },
      { keys: ["comunidad"], cat: "comunidad" },
      { keys: ["venta", "vendiendo", "enventa"], cat: "en-venta" },
    ];

    const en: Array<{ keys: string[]; cat: Exclude<CategoryKey, "all"> }> = [
      { keys: ["auto", "autos", "car", "vehicle", "truck"], cat: "autos" },
      { keys: ["rent", "rentals", "apartment", "apt", "house", "room"], cat: "rentas" },
      { keys: ["job", "jobs", "work"], cat: "empleos" },
      { keys: ["service", "services"], cat: "servicios" },
      { keys: ["class", "classes"], cat: "clases" },
      { keys: ["community"], cat: "comunidad" },
      { keys: ["sale", "for sale"], cat: "en-venta" },
    ];

    return lang === "es" ? es : en;
  }, [lang]);

  const inferCategoryFromQuery = (qRaw: string): Exclude<CategoryKey, "all"> | null => {
    const q = normalize(qRaw);
    if (!q) return null;

    const tokens = tokenize(q);

    // Numeric patterns strongly suggest Autos (year) in many cases
    const hasYearLike = tokens.some(
      (x) => /^\d{4}$/.test(x) && Number(x) >= 1980 && Number(x) <= 2035
    );
    if (hasYearLike) return "autos";

    const match = QUERY_TO_CATEGORY.find((x) =>
      x.keys.some((k) => tokens.includes(normalize(k)) || q.includes(normalize(k)))
    );
    return match ? match.cat : null;
  };

  // -------------------------
  // Recent searches (per language)
  // -------------------------
  const RECENTS_KEY = `leonix_recent_searches_${lang}`;
  const readRecents = () => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .map((x) => (typeof x === "string" ? x : ""))
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 5);
    } catch {
      return [];
    }
  };
  const writeRecent = (term: string) => {
    const v = term.trim();
    if (!v) return;
    try {
      const cur = readRecents();
      const next = [v, ...cur.filter((x) => normalize(x) !== normalize(v))].slice(0, 5);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {}
  };

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    setRecentSearches(readRecents());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // -------------------------
  // Landing state
  // -------------------------
  const [search, setSearch] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");

  // Location (applied)
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const [zip, setZip] = useState<string>("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS_MI);
  const [geoAnchor, setGeoAnchor] = useState<{ lat: number; lng: number } | null>(null);

  // Location (draft)
  const [locationOpen, setLocationOpen] = useState(false);
  const [cityDraft, setCityDraft] = useState<string>(DEFAULT_CITY);
  const [zipDraft, setZipDraft] = useState<string>("");
  const [radiusDraft, setRadiusDraft] = useState<number>(DEFAULT_RADIUS_MI);
  const [geoDraft, setGeoDraft] = useState<{ lat: number; lng: number } | null>(null);

  // -------------------------
  // Suggestion logic (fixes the “one letter then stops typing” bug)
  // - no blur-based closing
  // - close only on outside click / escape / selection
  // -------------------------
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = searchWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown as any);
    };
  }, []);

  const buildSuggestions = (raw: string): Suggestion[] => {
    const q = normalize(raw);

    // empty: show recents
    if (!q) {
      return recentSearches.map((r) => ({ kind: "recent", label: r, value: r })).slice(0, 5);
    }

    const out: Suggestion[] = [];
    const tokens = tokenize(q);

    // 1) slang prefix + exact token support (THIS fixes troca/camioneta while typing)
    // We scan slang keys and match if key startsWith(q) OR any token startsWith(key prefix)
    const slangKeys = Object.keys(SLANG_TO_CANONICAL);
    const slangMatches = slangKeys
      .filter((k) => k.startsWith(q) || tokens.some((tok) => k.startsWith(tok)))
      .slice(0, 6);

    for (const k of slangMatches) {
      const vals = SLANG_TO_CANONICAL[k] || [];
      for (const v of vals) out.push({ kind: "term", label: v, value: v });
    }

    // 2) canonical fuzzy
    const canonicalHits = CANONICAL_TERMS.filter((term) => isFuzzyHit(q, term)).slice(0, 6);
    for (const v of canonicalHits) out.push({ kind: "term", label: v, value: v });

    // 3) category quick suggestion
    const inferred = inferCategoryFromQuery(raw);
    if (inferred) {
      out.push({
        kind: "category",
        label:
          lang === "es"
            ? `Categoría: ${categoryMeta[inferred][lang]}`
            : `Category: ${categoryMeta[inferred][lang]}`,
        cat: inferred,
      });
    }

    // 4) recent fuzzy
    const recentHits = recentSearches.filter((r) => isFuzzyHit(q, r)).slice(0, 2);
    for (const r of recentHits) out.push({ kind: "recent", label: r, value: r });

    // de-dupe
    const seen = new Set<string>();
    const deduped: Suggestion[] = [];
    for (const s of out) {
      const key = s.kind === "category" ? `cat:${s.cat}` : `${s.kind}:${normalize((s as any).value)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }

    return deduped.slice(0, 7);
  };

  const suggestions = useMemo(() => buildSuggestions(search), [search, recentSearches]);

  const selectSuggestion = (s: Suggestion) => {
    if (s.kind === "category") {
      setSelectedCategory(s.cat);
      setSuggestOpen(false);
      return;
    }
    setSearch(s.value);
    writeRecent(s.value);
    setRecentSearches(readRecents());
    setSuggestOpen(false);
  };

  const commitSearch = () => {
    const v = search.trim();
    if (!v) return;
    writeRecent(v);
    setRecentSearches(readRecents());
  };

  // -------------------------
  // Location summary (show source label so testing is obvious)
  // -------------------------
  const sourceLabel = useMemo(() => {
    if (geoAnchor) return t.sourceGps;
    if (zip) return t.sourceZip;
    return t.sourceCity;
  }, [geoAnchor, zip, t.sourceCity, t.sourceGps, t.sourceZip]);

  const locationSummary = useMemo(() => {
    const z = zip ? resolveZipLatLng(zip) : null;
    const base = zip
      ? z
        ? `${t.sourceZip} ${z.zip} (${z.city})`
        : `${t.sourceZip} ${zip}`
      : city;

    return `${sourceLabel}: ${base} • ${radiusMi} mi`;
  }, [city, zip, radiusMi, sourceLabel, t.sourceZip]);

  const openLocation = () => {
    setCityDraft(city);
    setZipDraft(zip);
    setRadiusDraft(radiusMi);
    setGeoDraft(geoAnchor);
    setLocationOpen(true);
  };

  const cancelLocation = () => {
    setCityDraft(city);
    setZipDraft(zip);
    setRadiusDraft(radiusMi);
    setGeoDraft(null);
    setLocationOpen(false);
  };

  const applyLocation = () => {
    const nextZip = zipDraft.trim().replace(/[^0-9]/g, "").slice(0, 5);
    const nextCityRaw = cityDraft.trim();

    setRadiusMi(radiusDraft);

    if (geoDraft) {
      setGeoAnchor({ lat: geoDraft.lat, lng: geoDraft.lng });
      setZip("");
      const resolvedCity = resolveCityLatLng(nextCityRaw);
      setCity(resolvedCity?.city ?? city ?? DEFAULT_CITY);
      setGeoDraft(null);
      setLocationOpen(false);
      return;
    }

    if (nextZip) {
      const z = resolveZipLatLng(nextZip);
      setZip(nextZip);
      if (z?.city) setCity(z.city);
      else {
        const resolved = resolveCityLatLng(nextCityRaw);
        setCity(resolved?.city ?? city ?? DEFAULT_CITY);
      }
      setGeoAnchor(null);
      setGeoDraft(null);
      setLocationOpen(false);
      return;
    }

    const resolved = resolveCityLatLng(nextCityRaw);
    setCity(resolved?.city ?? city ?? DEFAULT_CITY);
    setZip("");
    setGeoAnchor(null);
    setGeoDraft(null);
    setLocationOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoDraft({ lat, lng });
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

  const CITY_OPTIONS = useMemo(() => CA_CITIES.map((c) => c.city), []);

  const citySuggestions = useMemo(() => {
    const q = normalize(cityDraft);
    if (!q) return CITY_OPTIONS.slice(0, 10);
    const hits = CA_CITIES
      .filter((c) => {
        const nm = normalize(c.city);
        if (nm.includes(q)) return true;
        return (c.aliases || []).some((a) => normalize(a).includes(q));
      })
      .map((c) => c.city)
      .slice(0, 16);

    const aliasHit = CITY_ALIASES[q];
    const merged = [...new Set([...(aliasHit ? [aliasHit] : []), ...hits])];
    return merged.slice(0, 10);
  }, [CITY_OPTIONS, cityDraft]);

  // -------------------------
  // Routing (safe now: send to /lista with cat param; later swap to /clasificados/:cat)
  // -------------------------
  const goSearch = (forcedCategory?: Exclude<CategoryKey, "all"> | null) => {
    commitSearch();

    const q = search.trim();
    const inferred =
      forcedCategory ??
      (selectedCategory !== "all" ? (selectedCategory as any) : inferCategoryFromQuery(q));
    const catParam = inferred ? inferred : "all";

    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (catParam && catParam !== "all") qs.set("cat", catParam);
    if (city) qs.set("city", city);
    if (zip) qs.set("zip", zip);
    if (radiusMi) qs.set("r", String(radiusMi));
    qs.set("lang", lang);

    router.push(`${t.routeBrowseAll}?${qs.toString()}`);
  };

  const popularSearches = useMemo(() => {
    return lang === "es"
      ? ["Troca barata", "Cuarto en renta", "Chamba cerca", "Toyota", "Herramientas", "Ropa de niño"]
      : ["Cheap truck", "Room for rent", "Jobs near me", "Toyota", "Tools", "Kids clothes"];
  }, [lang]);

  return (
    <div className="bg-black min-h-screen text-white pb-28">
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="text-center">
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />
          <h1 className="text-6xl md:text-7xl font-bold text-yellow-400">{t.pageTitle}</h1>
          <p className="mt-5 text-gray-300 max-w-3xl mx-auto text-lg md:text-xl">{t.subtitle}</p>

          <div className="mt-10 max-w-3xl mx-auto">
            <div className="border border-yellow-600/20 rounded-2xl bg-black/30 p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-6">
                  <div className="text-sm text-gray-300 mb-2 text-left">{t.searchLabel}</div>

                  <div ref={searchWrapRef} className="relative">
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setSuggestOpen(true);
                      }}
                      onFocus={() => setSuggestOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSuggestOpen(false);
                          goSearch();
                        }
                        if (e.key === "Escape") setSuggestOpen(false);
                      }}
                      placeholder={t.searchPh}
                      lang={lang}
                      spellCheck={true}
                      className={cx(
                        "w-full rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500",
                        "focus:outline-none focus:ring-2 focus:ring-yellow-400/40",
                        "px-5 py-3"
                      )}
                    />

                    {suggestOpen && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 z-50">
                        <div className="rounded-2xl border border-white/10 bg-black/90 backdrop-blur shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
                          {suggestions.map((s, idx) => (
                            <button
                              key={`${s.kind}-${idx}-${"value" in s ? s.value : s.cat}`}
                              tabIndex={-1}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                selectSuggestion(s);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 transition flex items-center justify-between gap-3"
                            >
                              <span className="text-gray-100 font-semibold">{s.label}</span>
                              <span className="text-xs text-gray-400">
                                {s.kind === "category"
                                  ? lang === "es"
                                    ? "Categoría"
                                    : "Category"
                                  : s.kind === "recent"
                                  ? lang === "es"
                                    ? "Reciente"
                                    : "Recent"
                                  : lang === "es"
                                  ? "Sugerencia"
                                  : "Suggestion"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <div className="text-sm text-gray-300 mb-2 text-left">{t.locationLabel}</div>
                  <button
                    onClick={openLocation}
                    className="w-full text-left px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 hover:bg-black/45 transition"
                  >
                    {locationSummary}
                  </button>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm text-gray-300 mb-2 text-left opacity-0 select-none">.</div>
                  <button
                    onClick={() => goSearch()}
                    className="w-full px-6 py-3 rounded-full bg-yellow-400 text-black font-extrabold hover:opacity-95 transition"
                  >
                    {t.ctaSearch}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ORDER.map((k) => {
                    const active = selectedCategory === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setSelectedCategory(active ? "all" : k)}
                        className={cx(
                          "px-4 py-2 rounded-full border font-semibold transition text-sm",
                          active
                            ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                            : "border-white/10 bg-black/30 text-gray-100 hover:bg-black/45"
                        )}
                      >
                        {categoryMeta[k][lang]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`${t.routeBrowseAll}?lang=${lang}`}
                    className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition text-sm"
                  >
                    {t.ctaBrowseAll}
                  </a>

                  <a
                    href={`${t.routePost}?lang=${lang}`}
                    className="px-4 py-2 rounded-full bg-yellow-400 text-black font-extrabold hover:opacity-95 transition text-sm"
                  >
                    {t.ctaPost}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 max-w-4xl mx-auto">
            <div className="text-sm text-gray-300 mb-3">{t.popularTitle}</div>
            <div className="flex flex-wrap justify-center gap-3">
              {popularSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSearch(s);
                    setSelectedCategory("all");
                    setTimeout(() => goSearch(), 0);
                  }}
                  className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {locationOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            aria-label={lang === "es" ? "Cerrar" : "Close"}
            className="absolute inset-0 bg-black/70"
            onClick={cancelLocation}
          />
          <div className="relative w-full sm:max-w-xl bg-black border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            {/* modal content unchanged */}
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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

type Suggestion =
  | { kind: "term"; label: string; value: string }
  | { kind: "category"; label: string; cat: Exclude<CategoryKey, "all"> }
  | { kind: "recent"; label: string; value: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function ClasificadosLandingPage() {
  const router = useRouter();
  const params = useSearchParams()!;
  const lang = ((params.get("lang") || "es") as Lang) === "en" ? "en" : "es";

  const t = useMemo(() => {
    const ui = {
      es: {
        pageTitle: "Clasificados",
        subtitle:
          "Busca rápido. Publica fácil. Comunidad primero. Ventaja premium para quienes invierten — sin esconder anuncios gratuitos.",
        searchLabel: "Buscar",
        searchPh: "Busca: “troca”, “cuarto”, “chamba”, “2003 Toyota Celica”…",
        locationLabel: "Ubicación",
        categoryLabel: "Categoría",

        ctaSearch: "Buscar",
        ctaPost: "Publicar anuncio",
        ctaBrowseAll: "Ver todo",

        popularTitle: "Búsquedas populares",
        categoriesTitle: "Explorar por categoría",

        locationModalTitle: "Ubicación",
        locationModalHint:
          "Elige ciudad o ZIP y ajusta el radio. Cancelar no cambia nada.",
        cityLabel: "Ciudad",
        zipLabel: "ZIP (opcional)",
        radiusLabel: "Radio",
        useMyLocation: "Usar mi ubicación",
        cancel: "Cancelar",
        apply: "Aplicar",

        sourceCity: "Ciudad",
        sourceZip: "ZIP",
        sourceGps: "GPS",

        routePost: "/clasificados/publicar",
        routeBrowseAll: "/clasificados/lista",
      },
      en: {
        pageTitle: "Classifieds",
        subtitle:
          "Search fast. Post easily. Community first. Premium advantage for investors — without hiding free listings.",
        searchLabel: "Search",
        searchPh: 'Try: "truck", "room", "job", "2003 Toyota Celica"...',
        locationLabel: "Location",
        categoryLabel: "Category",

        ctaSearch: "Search",
        ctaPost: "Post listing",
        ctaBrowseAll: "Browse all",

        popularTitle: "Popular searches",
        categoriesTitle: "Explore by category",

        locationModalTitle: "Location",
        locationModalHint:
          "Choose a city or ZIP and adjust the radius. Cancel changes nothing.",
        cityLabel: "City",
        zipLabel: "ZIP (optional)",
        radiusLabel: "Radius",
        useMyLocation: "Use my location",
        cancel: "Cancel",
        apply: "Apply",

        sourceCity: "City",
        sourceZip: "ZIP",
        sourceGps: "GPS",

        routePost: "/clasificados/publicar",
        routeBrowseAll: "/clasificados/lista",
      },
    } as const;

    return ui[lang];
  }, [lang]);

  // -------------------------
  // Helpers
  // -------------------------
  const normalize = (s: string) =>
    (s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const tokenize = (s: string) =>
    normalize(s)
      .split(/[^a-z0-9]+/g)
      .map((x) => x.trim())
      .filter(Boolean);

  const levenshtein = (a: string, b: string) => {
    const s = normalize(a);
    const t2 = normalize(b);
    const n = s.length;
    const m = t2.length;
    if (!n) return m;
    if (!m) return n;
    const dp = new Array(m + 1).fill(0);
    for (let j = 0; j <= m; j++) dp[j] = j;
    for (let i = 1; i <= n; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= m; j++) {
        const cur = dp[j];
        const cost = s[i - 1] === t2[j - 1] ? 0 : 1;
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
        prev = cur;
      }
    }
    return dp[m];
  };

  const isFuzzyHit = (query: string, candidate: string) => {
    const q = normalize(query);
    const c = normalize(candidate);
    if (!q || !c) return false;
    if (c.includes(q)) return true;
    const max = q.length <= 4 ? 1 : q.length <= 7 ? 2 : 3;
    return levenshtein(q, c) <= max;
  };

  const haversineMi = (
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
  ) => {
    const R = 3958.8;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
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

  // -------------------------
  // Category labels
  // -------------------------
  const categoryMeta = useMemo(() => {
    const map: Record<Exclude<CategoryKey, "all">, { es: string; en: string }> =
      {
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

  const CATEGORY_ORDER: Array<Exclude<CategoryKey, "all">> = useMemo(
    () => ["autos", "rentas", "empleos", "servicios", "en-venta", "clases", "comunidad"],
    []
  );

  // -------------------------
  // Search intelligence
  // -------------------------
  const CANONICAL_TERMS = useMemo(() => {
    const es = [
      "Autos",
      "Automóvil",
      "Vehículo",
      "Rentas",
      "Departamento",
      "Casa",
      "Cuarto",
      "Servicios",
      "Empleos",
      "Trabajo",
      "Clases",
      "Comunidad",
      "En Venta",
    ];
    const en = [
      "Autos",
      "Vehicle",
      "Car",
      "Rentals",
      "Apartment",
      "House",
      "Room",
      "Services",
      "Jobs",
      "Work",
      "Classes",
      "Community",
      "For Sale",
    ];
    return lang === "es" ? es : en;
  }, [lang]);

  const SLANG_TO_CANONICAL = useMemo(() => {
    const es: Record<string, string[]> = {
      carro: ["Autos", "Automóvil", "Vehículo"],
      troca: ["Autos", "Vehículo"],
      camioneta: ["Autos", "Vehículo"],
      coche: ["Autos", "Automóvil"],
      depa: ["Rentas", "Departamento"],
      apartamento: ["Rentas", "Departamento"],
      renta: ["Rentas"],
      rentar: ["Rentas"],
      cuarto: ["Rentas", "Cuarto"],
      trabajo: ["Empleos", "Trabajo"],
      jale: ["Empleos", "Trabajo"],
      chamba: ["Empleos", "Trabajo"],
      empleo: ["Empleos", "Trabajo"],
      clases: ["Clases"],
      comunidad: ["Comunidad"],
      venta: ["En Venta"],
      vendiendo: ["En Venta"],
      servicio: ["Servicios"],
      servicios: ["Servicios"],
    };

    const en: Record<string, string[]> = {
      car: ["Autos", "Car", "Vehicle"],
      vehicle: ["Vehicle", "Autos"],
      truck: ["Vehicle", "Autos"],
      apt: ["Rentals", "Apartment"],
      apartment: ["Rentals", "Apartment"],
      rent: ["Rentals"],
      job: ["Jobs", "Work"],
      work: ["Jobs", "Work"],
      classes: ["Classes"],
      community: ["Community"],
      sale: ["For Sale"],
      services: ["Services"],
      service: ["Services"],
    };

    return lang === "es" ? es : en;
  }, [lang]);

  const QUERY_TO_CATEGORY = useMemo(() => {
    const es: Array<{ keys: string[]; cat: Exclude<CategoryKey, "all"> }> = [
      {
        keys: ["auto", "autos", "automovil", "vehiculo", "carro", "troca", "camioneta", "coche"],
        cat: "autos",
      },
      {
        keys: ["renta", "rentas", "depa", "departamento", "casa", "cuarto", "apartamento"],
        cat: "rentas",
      },
      { keys: ["trabajo", "empleos", "empleo", "chamba", "jale"], cat: "empleos" },
      { keys: ["servicio", "servicios"], cat: "servicios" },
      { keys: ["clase", "clases"], cat: "clases" },
      { keys: ["comunidad"], cat: "comunidad" },
      { keys: ["venta", "vendiendo", "enventa"], cat: "en-venta" },
    ];

    const en: Array<{ keys: string[]; cat: Exclude<CategoryKey, "all"> }> = [
      { keys: ["auto", "autos", "car", "vehicle", "truck"], cat: "autos" },
      { keys: ["rent", "rentals", "apartment", "apt", "house", "room"], cat: "rentas" },
      { keys: ["job", "jobs", "work"], cat: "empleos" },
      { keys: ["service", "services"], cat: "servicios" },
      { keys: ["class", "classes"], cat: "clases" },
      { keys: ["community"], cat: "comunidad" },
      { keys: ["sale", "for sale"], cat: "en-venta" },
    ];

    return lang === "es" ? es : en;
  }, [lang]);

  const inferCategoryFromQuery = (qRaw: string): Exclude<CategoryKey, "all"> | null => {
    const q = normalize(qRaw);
    if (!q) return null;

    const tokens = tokenize(q);

    // Numeric patterns strongly suggest Autos (year) in many cases
    const hasYearLike = tokens.some(
      (x) => /^\d{4}$/.test(x) && Number(x) >= 1980 && Number(x) <= 2035
    );
    if (hasYearLike) return "autos";

    const match = QUERY_TO_CATEGORY.find((x) =>
      x.keys.some((k) => tokens.includes(normalize(k)) || q.includes(normalize(k)))
    );
    return match ? match.cat : null;
  };

  // -------------------------
  // Recent searches (per language)
  // -------------------------
  const RECENTS_KEY = `leonix_recent_searches_${lang}`;
  const readRecents = () => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .map((x) => (typeof x === "string" ? x : ""))
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 5);
    } catch {
      return [];
    }
  };
  const writeRecent = (term: string) => {
    const v = term.trim();
    if (!v) return;
    try {
      const cur = readRecents();
      const next = [v, ...cur.filter((x) => normalize(x) !== normalize(v))].slice(0, 5);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {}
  };

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  useEffect(() => {
    setRecentSearches(readRecents());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // -------------------------
  // Landing state
  // -------------------------
  const [search, setSearch] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");

  // Location (applied)
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const [zip, setZip] = useState<string>("");
  const [radiusMi, setRadiusMi] = useState<number>(DEFAULT_RADIUS_MI);
  const [geoAnchor, setGeoAnchor] = useState<{ lat: number; lng: number } | null>(null);

  // Location (draft)
  const [locationOpen, setLocationOpen] = useState(false);
  const [cityDraft, setCityDraft] = useState<string>(DEFAULT_CITY);
  const [zipDraft, setZipDraft] = useState<string>("");
  const [radiusDraft, setRadiusDraft] = useState<number>(DEFAULT_RADIUS_MI);
  const [geoDraft, setGeoDraft] = useState<{ lat: number; lng: number } | null>(null);

  // -------------------------
  // Suggestion logic (fixes the “one letter then stops typing” bug)
  // - no blur-based closing
  // - close only on outside click / escape / selection
  // -------------------------
  const searchWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      const el = searchWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown as any);
    };
  }, []);

  const buildSuggestions = (raw: string): Suggestion[] => {
    const q = normalize(raw);

    // empty: show recents
    if (!q) {
      return recentSearches.map((r) => ({ kind: "recent", label: r, value: r })).slice(0, 5);
    }

    const out: Suggestion[] = [];
    const tokens = tokenize(q);

    // 1) slang prefix + exact token support (THIS fixes troca/camioneta while typing)
    // We scan slang keys and match if key startsWith(q) OR any token startsWith(key prefix)
    const slangKeys = Object.keys(SLANG_TO_CANONICAL);
    const slangMatches = slangKeys
      .filter((k) => k.startsWith(q) || tokens.some((tok) => k.startsWith(tok)))
      .slice(0, 6);

    for (const k of slangMatches) {
      const vals = SLANG_TO_CANONICAL[k] || [];
      for (const v of vals) out.push({ kind: "term", label: v, value: v });
    }

    // 2) canonical fuzzy
    const canonicalHits = CANONICAL_TERMS.filter((term) => isFuzzyHit(q, term)).slice(0, 6);
    for (const v of canonicalHits) out.push({ kind: "term", label: v, value: v });

    // 3) category quick suggestion
    const inferred = inferCategoryFromQuery(raw);
    if (inferred) {
      out.push({
        kind: "category",
        label:
          lang === "es"
            ? `Categoría: ${categoryMeta[inferred][lang]}`
            : `Category: ${categoryMeta[inferred][lang]}`,
        cat: inferred,
      });
    }

    // 4) recent fuzzy
    const recentHits = recentSearches.filter((r) => isFuzzyHit(q, r)).slice(0, 2);
    for (const r of recentHits) out.push({ kind: "recent", label: r, value: r });

    // de-dupe
    const seen = new Set<string>();
    const deduped: Suggestion[] = [];
    for (const s of out) {
      const key = s.kind === "category" ? `cat:${s.cat}` : `${s.kind}:${normalize((s as any).value)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(s);
    }

    return deduped.slice(0, 7);
  };

  const suggestions = useMemo(() => buildSuggestions(search), [search, recentSearches]);

  const selectSuggestion = (s: Suggestion) => {
    if (s.kind === "category") {
      setSelectedCategory(s.cat);
      setSuggestOpen(false);
      return;
    }
    setSearch(s.value);
    writeRecent(s.value);
    setRecentSearches(readRecents());
    setSuggestOpen(false);
  };

  const commitSearch = () => {
    const v = search.trim();
    if (!v) return;
    writeRecent(v);
    setRecentSearches(readRecents());
  };

  // -------------------------
  // Location summary (show source label so testing is obvious)
  // -------------------------
  const sourceLabel = useMemo(() => {
    if (geoAnchor) return t.sourceGps;
    if (zip) return t.sourceZip;
    return t.sourceCity;
  }, [geoAnchor, zip, t.sourceCity, t.sourceGps, t.sourceZip]);

  const locationSummary = useMemo(() => {
    const z = zip ? resolveZipLatLng(zip) : null;
    const base = zip
      ? z
        ? `${t.sourceZip} ${z.zip} (${z.city})`
        : `${t.sourceZip} ${zip}`
      : city;

    return `${sourceLabel}: ${base} • ${radiusMi} mi`;
  }, [city, zip, radiusMi, sourceLabel, t.sourceZip]);

  const openLocation = () => {
    setCityDraft(city);
    setZipDraft(zip);
    setRadiusDraft(radiusMi);
    setGeoDraft(geoAnchor);
    setLocationOpen(true);
  };

  const cancelLocation = () => {
    setCityDraft(city);
    setZipDraft(zip);
    setRadiusDraft(radiusMi);
    setGeoDraft(null);
    setLocationOpen(false);
  };

  const applyLocation = () => {
    const nextZip = zipDraft.trim().replace(/[^0-9]/g, "").slice(0, 5);
    const nextCityRaw = cityDraft.trim();

    setRadiusMi(radiusDraft);

    if (geoDraft) {
      setGeoAnchor({ lat: geoDraft.lat, lng: geoDraft.lng });
      setZip("");
      const resolvedCity = resolveCityLatLng(nextCityRaw);
      setCity(resolvedCity?.city ?? city ?? DEFAULT_CITY);
      setGeoDraft(null);
      setLocationOpen(false);
      return;
    }

    if (nextZip) {
      const z = resolveZipLatLng(nextZip);
      setZip(nextZip);
      if (z?.city) setCity(z.city);
      else {
        const resolved = resolveCityLatLng(nextCityRaw);
        setCity(resolved?.city ?? city ?? DEFAULT_CITY);
      }
      setGeoAnchor(null);
      setGeoDraft(null);
      setLocationOpen(false);
      return;
    }

    const resolved = resolveCityLatLng(nextCityRaw);
    setCity(resolved?.city ?? city ?? DEFAULT_CITY);
    setZip("");
    setGeoAnchor(null);
    setGeoDraft(null);
    setLocationOpen(false);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGeoDraft({ lat, lng });
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

  const CITY_OPTIONS = useMemo(() => CA_CITIES.map((c) => c.city), []);

  const citySuggestions = useMemo(() => {
    const q = normalize(cityDraft);
    if (!q) return CITY_OPTIONS.slice(0, 10);
    const hits = CA_CITIES
      .filter((c) => {
        const nm = normalize(c.city);
        if (nm.includes(q)) return true;
        return (c.aliases || []).some((a) => normalize(a).includes(q));
      })
      .map((c) => c.city)
      .slice(0, 16);

    const aliasHit = CITY_ALIASES[q];
    const merged = [...new Set([...(aliasHit ? [aliasHit] : []), ...hits])];
    return merged.slice(0, 10);
  }, [CITY_OPTIONS, cityDraft]);

  // -------------------------
  // Routing (safe now: send to /lista with cat param; later swap to /clasificados/:cat)
  // -------------------------
  const goSearch = (forcedCategory?: Exclude<CategoryKey, "all"> | null) => {
    commitSearch();

    const q = search.trim();
    const inferred =
      forcedCategory ??
      (selectedCategory !== "all" ? (selectedCategory as any) : inferCategoryFromQuery(q));
    const catParam = inferred ? inferred : "all";

    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (catParam && catParam !== "all") qs.set("cat", catParam);
    if (city) qs.set("city", city);
    if (zip) qs.set("zip", zip);
    if (radiusMi) qs.set("r", String(radiusMi));
    qs.set("lang", lang);

    router.push(`${t.routeBrowseAll}?${qs.toString()}`);
  };

  const popularSearches = useMemo(() => {
    return lang === "es"
      ? ["Troca barata", "Cuarto en renta", "Chamba cerca", "Toyota", "Herramientas", "Ropa de niño"]
      : ["Cheap truck", "Room for rent", "Jobs near me", "Toyota", "Tools", "Kids clothes"];
  }, [lang]);

  return (
    <div className="bg-black min-h-screen text-white pb-28">
      <Navbar />
      <section className="max-w-6xl mx-auto px-6 pt-28">
        <div className="text-center">
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" />
          <h1 className="text-6xl md:text-7xl font-bold text-yellow-400">{t.pageTitle}</h1>
          <p className="mt-5 text-gray-300 max-w-3xl mx-auto text-lg md:text-xl">{t.subtitle}</p>

          <div className="mt-10 max-w-3xl mx-auto">
            <div className="border border-yellow-600/20 rounded-2xl bg-black/30 p-4 md:p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-6">
                  <div className="text-sm text-gray-300 mb-2 text-left">{t.searchLabel}</div>

                  <div ref={searchWrapRef} className="relative">
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setSuggestOpen(true);
                      }}
                      onFocus={() => setSuggestOpen(true)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          setSuggestOpen(false);
                          goSearch();
                        }
                        if (e.key === "Escape") setSuggestOpen(false);
                      }}
                      placeholder={t.searchPh}
                      lang={lang}
                      spellCheck={true}
                      className={cx(
                        "w-full rounded-full bg-black/40 border border-white/10 text-gray-100 placeholder:text-gray-500",
                        "focus:outline-none focus:ring-2 focus:ring-yellow-400/40",
                        "px-5 py-3"
                      )}
                    />

                    {suggestOpen && suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 z-50">
                        <div className="rounded-2xl border border-white/10 bg-black/90 backdrop-blur shadow-[0_0_40px_rgba(0,0,0,0.6)] overflow-hidden">
                          {suggestions.map((s, idx) => (
                            <button
                              key={`${s.kind}-${idx}-${"value" in s ? s.value : s.cat}`}
                              tabIndex={-1}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                selectSuggestion(s);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-white/5 transition flex items-center justify-between gap-3"
                            >
                              <span className="text-gray-100 font-semibold">{s.label}</span>
                              <span className="text-xs text-gray-400">
                                {s.kind === "category"
                                  ? lang === "es"
                                    ? "Categoría"
                                    : "Category"
                                  : s.kind === "recent"
                                  ? lang === "es"
                                    ? "Reciente"
                                    : "Recent"
                                  : lang === "es"
                                  ? "Sugerencia"
                                  : "Suggestion"}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <div className="text-sm text-gray-300 mb-2 text-left">{t.locationLabel}</div>
                  <button
                    onClick={openLocation}
                    className="w-full text-left px-5 py-3 rounded-full bg-black/40 border border-white/10 text-gray-100 hover:bg-black/45 transition"
                  >
                    {locationSummary}
                  </button>
                </div>

                <div className="md:col-span-2">
                  <div className="text-sm text-gray-300 mb-2 text-left opacity-0 select-none">.</div>
                  <button
                    onClick={() => goSearch()}
                    className="w-full px-6 py-3 rounded-full bg-yellow-400 text-black font-extrabold hover:opacity-95 transition"
                  >
                    {t.ctaSearch}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ORDER.map((k) => {
                    const active = selectedCategory === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setSelectedCategory(active ? "all" : k)}
                        className={cx(
                          "px-4 py-2 rounded-full border font-semibold transition text-sm",
                          active
                            ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-200"
                            : "border-white/10 bg-black/30 text-gray-100 hover:bg-black/45"
                        )}
                      >
                        {categoryMeta[k][lang]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`${t.routeBrowseAll}?lang=${lang}`}
                    className="px-4 py-2 rounded-full border border-white/10 bg-black/30 text-gray-100 font-semibold hover:bg-black/45 transition text-sm"
                  >
                    {t.ctaBrowseAll}
                  </a>

                  <a
                    href={`${t.routePost}?lang=${lang}`}
                    className="px-4 py-2 rounded-full bg-yellow-400 text-black font-extrabold hover:opacity-95 transition text-sm"
                  >
                    {t.ctaPost}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 max-w-4xl mx-auto">
            <div className="text-sm text-gray-300 mb-3">{t.popularTitle}</div>
            <div className="flex flex-wrap justify-center gap-3">
              {popularSearches.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSearch(s);
                    setSelectedCategory("all");
                    setTimeout(() => goSearch(), 0);
                  }}
                  className="px-5 py-2.5 rounded-full border border-white/10 bg-black/30 text-gray-100 hover:bg-black/45 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {locationOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <button
            aria-label={lang === "es" ? "Cerrar" : "Close"}
            className="absolute inset-0 bg-black/70"
            onClick={cancelLocation}
          />
          <div className="relative w-full sm:max-w-xl bg-black border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 shadow-[0_0_60px_rgba(0,0,0,0.6)]">
            {/* modal content unchanged */}
          </div>
        </div>
      )}
    </div>
  );
}
