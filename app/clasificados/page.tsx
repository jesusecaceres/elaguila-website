// app/clasificados/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Lang = "es" | "en";

type ListingTier = "FREE" | "PRO" | "BIZ_LITE" | "BIZ_PREMIUM";
type SellerType = "PERSONAL" | "BUSINESS";
type ListingCondition = "NEW" | "LIKE_NEW" | "GOOD" | "FAIR" | "FOR_PARTS";

type ClassifiedCategory =
  | "servicios"
  | "empleos"
  | "rentas"
  | "en-venta"
  | "autos"
  | "clases"
  | "comunidad";

type SortMode = "BALANCED" | "NEWEST" | "PRICE_ASC" | "PRICE_DESC";
type PostedTimeframe = "ANY" | "24H" | "7D" | "30D";

type ClassifiedItem = {
  id: string;
  title: string;
  category: ClassifiedCategory;
  price?: number; // undefined = Gratis
  currency?: "USD";
  city: string;
  createdAtISO: string; // ISO string
  hasImage?: boolean;
  thumbnailUrl?: string; // small thumbnail only (cards)
  tier: ListingTier;
  sellerType: SellerType;
  condition?: ListingCondition;
  boostedUntilISO?: string; // optional
};

type RadiusMiles = 10 | 25 | 40 | 50;

const DEFAULT_CITY = "San José";
const DEFAULT_RADIUS: RadiusMiles = 25;

const CATEGORIES: { key: ClassifiedCategory; label: string }[] = [
  { key: "servicios", label: "Servicios" },
  { key: "empleos", label: "Empleos" },
  { key: "rentas", label: "Rentas" },
  { key: "en-venta", label: "En Venta" },
  { key: "autos", label: "Autos" },
  { key: "clases", label: "Clases" },
  { key: "comunidad", label: "Comunidad" },
];

const RADIUS_OPTIONS: RadiusMiles[] = [10, 25, 40, 50];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function formatPrice(price?: number) {
  if (price === undefined || price === null) return "Gratis";
  try {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `$${price}`;
  }
}

function parseISODate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}

function timeAgoES(iso: string) {
  const d = parseISODate(iso);
  if (!d) return "hace un momento";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);

  if (sec < 60) return "hace unos segundos";
  if (min < 60) return `hace ${min} min`;
  if (hr < 24) return `hace ${hr} h`;
  if (day < 7) return `hace ${day} d`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `hace ${wk} sem`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `hace ${mo} mes`;
  const yr = Math.floor(day / 365);
  return `hace ${yr} año`;
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeText(s: string) {
  return s.trim().toLowerCase();
}

function withinTimeframe(createdAtISO: string, tf: PostedTimeframe) {
  if (tf === "ANY") return true;
  const d = parseISODate(createdAtISO);
  if (!d) return true;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  if (tf === "24H") return hours <= 24;
  if (tf === "7D") return hours <= 24 * 7;
  if (tf === "30D") return hours <= 24 * 30;
  return true;
}

function isBoostActive(item: ClassifiedItem, now = new Date()) {
  if (!item.boostedUntilISO) return false;
  const until = parseISODate(item.boostedUntilISO);
  if (!until) return false;
  return until.getTime() > now.getTime();
}

/**
 * Fair Placement Logic (UI-ready)
 * - Boosted items temporarily at top
 * - Then mixed rotation of tiers:
 *   Business Premium, Business Lite, LEONIX Pro, Free
 * - Free listings are guaranteed visibility via interleaving (not shoved to the end)
 */
function fairMix(items: ClassifiedItem[]): ClassifiedItem[] {
  const now = new Date();

  const boosted: ClassifiedItem[] = [];
  const rest: ClassifiedItem[] = [];

  for (const it of items) {
    (isBoostActive(it, now) ? boosted : rest).push(it);
  }

  // Stable newest-first inside each pool for predictable UX
  const byNewest = (a: ClassifiedItem, b: ClassifiedItem) => {
    const da = parseISODate(a.createdAtISO)?.getTime() ?? 0;
    const db = parseISODate(b.createdAtISO)?.getTime() ?? 0;
    return db - da;
  };

  boosted.sort(byNewest);

  const premium: ClassifiedItem[] = [];
  const lite: ClassifiedItem[] = [];
  const pro: ClassifiedItem[] = [];
  const free: ClassifiedItem[] = [];

  for (const it of rest) {
    if (it.tier === "BIZ_PREMIUM") premium.push(it);
    else if (it.tier === "BIZ_LITE") lite.push(it);
    else if (it.tier === "PRO") pro.push(it);
    else free.push(it);
  }

  premium.sort(byNewest);
  lite.sort(byNewest);
  pro.sort(byNewest);
  free.sort(byNewest);

  const mixed: ClassifiedItem[] = [];
  // Rotation pattern guarantees FREE shows up consistently
  const queues: ClassifiedItem[][] = [premium, lite, pro, free];
  let safety = 0;

  while (queues.some((q) => q.length > 0) && safety < 100000) {
    safety++;
    for (const q of queues) {
      if (q.length) mixed.push(q.shift()!);
    }
  }

  return [...boosted, ...mixed];
}

function badgeForTier(tier: ListingTier) {
  if (tier === "PRO") return { label: "Joya", tone: "gold" as const };
  if (tier === "BIZ_LITE") return { label: "Corona", tone: "silver" as const };
  if (tier === "BIZ_PREMIUM") return { label: "Corona de Oro", tone: "goldStrong" as const };
  return null;
}

function toneClasses(tone: "gold" | "silver" | "goldStrong") {
  if (tone === "silver") {
    return "border-white/20 bg-white/5 text-white/85";
  }
  if (tone === "goldStrong") {
    return "border-amber-400/40 bg-amber-400/10 text-amber-200";
  }
  return "border-amber-300/25 bg-amber-300/10 text-amber-100";
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function PillButton(props: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-300/40";
  const primary =
    "bg-gradient-to-r from-amber-200/20 via-amber-200/10 to-amber-200/20 text-amber-100 border border-amber-200/25 hover:border-amber-200/40 hover:bg-amber-200/15";
  const ghost =
    "bg-white/5 text-white/85 border border-white/10 hover:border-white/20 hover:bg-white/8";

  const cls = cn(base, props.variant === "ghost" ? ghost : primary, props.className);

  if (props.href) {
    return (
      <Link href={props.href} className={cls}>
        {props.children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={props.onClick} className={cls}>
      {props.children}
    </button>
  );
}

function SectionTitle(props: { children: React.ReactNode; id?: string; className?: string }) {
  return (
    <h2
      id={props.id}
      className={cn(
        "text-xl md:text-2xl font-extrabold tracking-tight text-amber-100",
        props.className
      )}
    >
      {props.children}
    </h2>
  );
}

function SoftDivider() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
}

function TopRightAccount() {
  // Future: connect auth. For now: top-right login/avatar with initials fallback (blueprint requirement).
  const user = null as null | { name: string; photoUrl?: string };
  const initials = "CM"; // Coach/Member placeholder (non-functional)

  return (
    <div className="flex items-center gap-2">
      {user ? (
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/8 hover:border-white/20 transition"
          aria-label="Cuenta"
        >
          <span className="hidden sm:block text-sm font-semibold text-white/85">Mi cuenta</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/30 text-xs font-extrabold text-amber-100">
            {user.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoUrl}
                alt="Avatar"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </span>
        </button>
      ) : (
        <PillButton href="/login" variant="ghost" className="px-3 py-2">
          <span className="hidden sm:inline">Iniciar sesión</span>
          <span className="sm:hidden">Login</span>
        </PillButton>
      )}
    </div>
  );
}

function CategoryPills(props: {
  activeCategory?: ClassifiedCategory;
  onPick: (c?: ClassifiedCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const active = props.activeCategory === c.key;
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => props.onPick(c.key)}
            className={cn(
              "rounded-full px-3 py-2 text-sm font-semibold border transition",
              active
                ? "border-amber-200/35 bg-amber-200/10 text-amber-100"
                : "border-white/10 bg-white/5 text-white/80 hover:bg-white/8 hover:border-white/20"
            )}
          >
            {c.label}
          </button>
        );
      })}
      {props.activeCategory ? (
        <button
          type="button"
          onClick={() => props.onPick(undefined)}
          className="rounded-full px-3 py-2 text-sm font-semibold border border-white/10 bg-transparent text-white/65 hover:text-white/85 hover:border-white/20 transition"
        >
          Quitar categoría
        </button>
      ) : null}
    </div>
  );
}

function FilterChip(props: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={props.onRemove}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/8 hover:border-white/20 transition"
      aria-label={`Eliminar filtro ${props.label}`}
    >
      <span>{props.label}</span>
      <span className="text-white/50">×</span>
    </button>
  );
}

function ModalShell(props: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={props.onClose} />
      <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center p-3 md:p-6">
        <div className="w-full md:max-w-xl rounded-2xl border border-white/10 bg-black/90 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="text-base font-extrabold text-amber-100">{props.title}</div>
            <button
              type="button"
              onClick={props.onClose}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/8 hover:border-white/20 transition"
            >
              Cerrar
            </button>
          </div>
          <div className="px-4 py-4 max-h-[70vh] overflow-auto">{props.children}</div>
          {props.footer ? (
            <div className="px-4 py-3 border-t border-white/10">{props.footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ClassifiedsPage() {
  // Language support can be wired via searchParams later (blueprint is UI-first).
  const lang: Lang = "es";

  // Data integration point:
  // Replace `items` with your real classifieds source (e.g., /app/data/classifieds.ts).
  const items: ClassifiedItem[] = [];

  // Breakpoints
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isMobile = useMediaQuery("(max-width: 767px)");

  // Sticky action bar trigger
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const sentinel = document.createElement("div");
    sentinel.style.position = "absolute";
    sentinel.style.left = "0";
    sentinel.style.right = "0";
    sentinel.style.bottom = "0";
    sentinel.style.height = "1px";
    sentinel.style.pointerEvents = "none";
    el.style.position = "relative";
    el.appendChild(sentinel);

    const obs = new IntersectionObserver(
      ([entry]) => setShowSticky(!entry.isIntersecting),
      { threshold: 0 }
    );

    obs.observe(sentinel);

    return () => {
      obs.disconnect();
      el.removeChild(sentinel);
    };
  }, []);

  // Filters (default visible)
  const [search, setSearch] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY);
  const [radius, setRadius] = useState<RadiusMiles>(DEFAULT_RADIUS);
  const [category, setCategory] = useState<ClassifiedCategory | undefined>(undefined);
  const [sort, setSort] = useState<SortMode>("BALANCED");

  // More filters (collapsed)
  const [moreOpen, setMoreOpen] = useState(false);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [timeframe, setTimeframe] = useState<PostedTimeframe>("ANY");
  const [hasImage, setHasImage] = useState<boolean>(false);
  const [sellerType, setSellerType] = useState<SellerType | "ANY">("ANY");
  const [condition, setCondition] = useState<ListingCondition | "ANY">("ANY");

  // Mobile full-screen filter modal requirement
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Location modal with soft permission prompt + nearby cities chips (only inside modal)
  const [locationOpen, setLocationOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<"idle" | "asking" | "granted" | "denied">("idle");
  const nearbyCities = useMemo(() => {
    // System-side logic later. UI shows chips only inside modal (blueprint).
    return ["Santa Clara", "Milpitas", "Campbell", "Sunnyvale"];
  }, []);

  const perPage = isDesktop ? 18 : 10;
  const [page, setPage] = useState(1);

  // Apply filters
  const filtered = useMemo(() => {
    const q = normalizeText(search);

    const minP = typeof minPrice === "number" ? minPrice : undefined;
    const maxP = typeof maxPrice === "number" ? maxPrice : undefined;

    let out = items.filter((it) => {
      // Search
      if (q) {
        const hay = `${it.title} ${it.city}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Location model is UI-first:
      // City is primary selector; radius expands reach (true geo later).
      // For now, treat "city" as a primary match (future: radius-based distance).
      if (city && normalizeText(it.city) !== normalizeText(city)) {
        // In the future this will be replaced by distance logic.
        // For now, if city selected, show city exact matches to keep behavior predictable.
        return false;
      }

      // Category
      if (category && it.category !== category) return false;

      // More filters
      if (timeframe !== "ANY" && !withinTimeframe(it.createdAtISO, timeframe)) return false;
      if (hasImage && !it.hasImage) return false;
      if (sellerType !== "ANY" && it.sellerType !== sellerType) return false;
      if (condition !== "ANY" && it.condition !== condition) return false;

      // Price range: ignore Gratis if minPrice set > 0 (keeps logic factual)
      if (minP !== undefined || maxP !== undefined) {
        const p = it.price;
        if (p === undefined) {
          if ((minP ?? 0) > 0) return false;
        } else {
          if (minP !== undefined && p < minP) return false;
          if (maxP !== undefined && p > maxP) return false;
        }
      }

      return true;
    });

    // Sorting
    if (sort === "NEWEST") {
      out = out.slice().sort((a, b) => {
        const da = parseISODate(a.createdAtISO)?.getTime() ?? 0;
        const db = parseISODate(b.createdAtISO)?.getTime() ?? 0;
        return db - da;
      });
    } else if (sort === "PRICE_ASC" || sort === "PRICE_DESC") {
      out = out.slice().sort((a, b) => {
        const pa = a.price ?? -1; // Gratis first in asc (keeps consistent)
        const pb = b.price ?? -1;
        return sort === "PRICE_ASC" ? pa - pb : pb - pa;
      });
    } else {
      // BALANCED: fair placement logic (boost + rotation)
      out = fairMix(out);
    }

    return out;
  }, [
    items,
    search,
    city,
    radius, // kept for future logic; UI currently uses it
    category,
    sort,
    minPrice,
    maxPrice,
    timeframe,
    hasImage,
    sellerType,
    condition,
  ]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = clamp(page, 1, totalPages);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    city,
    radius,
    category,
    sort,
    minPrice,
    maxPrice,
    timeframe,
    hasImage,
    sellerType,
    condition,
  ]);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, safePage, perPage]);

  const showingFrom = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const showingTo = total === 0 ? 0 : Math.min(total, safePage * perPage);

  // Active filter chips
  const chips = useMemo(() => {
    const list: Array<{ key: string; label: string; onRemove: () => void }> = [];

    if (search) list.push({ key: "q", label: `Buscar: "${search}"`, onRemove: () => setSearch("") });

    // Location chips (City + Radius)
    if (city) {
      list.push({
        key: "city",
        label: `Ciudad: ${city}`,
        onRemove: () => setCity(DEFAULT_CITY),
      });
    }
    if (radius) {
      list.push({
        key: "radius",
        label: `Radio: ${radius} mi`,
        onRemove: () => setRadius(DEFAULT_RADIUS),
      });
    }

    if (category) {
      const label = CATEGORIES.find((c) => c.key === category)?.label ?? category;
      list.push({ key: "cat", label: `Categoría: ${label}`, onRemove: () => setCategory(undefined) });
    }

    if (sort !== "BALANCED") {
      const label =
        sort === "NEWEST" ? "Más recientes" : sort === "PRICE_ASC" ? "Precio ↑" : "Precio ↓";
      list.push({ key: "sort", label: `Orden: ${label}`, onRemove: () => setSort("BALANCED") });
    }

    if (typeof minPrice === "number") {
      list.push({ key: "min", label: `Min: ${formatPrice(minPrice)}`, onRemove: () => setMinPrice("") });
    }
    if (typeof maxPrice === "number") {
      list.push({ key: "max", label: `Max: ${formatPrice(maxPrice)}`, onRemove: () => setMaxPrice("") });
    }

    if (timeframe !== "ANY") {
      const label = timeframe === "24H" ? "24 h" : timeframe === "7D" ? "7 días" : "30 días";
      list.push({ key: "tf", label: `Publicado: ${label}`, onRemove: () => setTimeframe("ANY") });
    }

    if (hasImage) {
      list.push({ key: "img", label: "Con imagen", onRemove: () => setHasImage(false) });
    }

    if (sellerType !== "ANY") {
      list.push({
        key: "seller",
        label: sellerType === "PERSONAL" ? "Personal" : "Negocio",
        onRemove: () => setSellerType("ANY"),
      });
    }

    if (condition !== "ANY") {
      const label =
        condition === "NEW"
          ? "Nuevo"
          : condition === "LIKE_NEW"
          ? "Como nuevo"
          : condition === "GOOD"
          ? "Bueno"
          : condition === "FAIR"
          ? "Regular"
          : "Para partes";
      list.push({ key: "cond", label: `Condición: ${label}`, onRemove: () => setCondition("ANY") });
    }

    return list;
  }, [search, city, radius, category, sort, minPrice, maxPrice, timeframe, hasImage, sellerType, condition]);

  function resetFilters() {
    setSearch("");
    setCity(DEFAULT_CITY);
    setRadius(DEFAULT_RADIUS);
    setCategory(undefined);
    setSort("BALANCED");
    setMoreOpen(false);
    setMinPrice("");
    setMaxPrice("");
    setTimeframe("ANY");
    setHasImage(false);
    setSellerType("ANY");
    setCondition("ANY");
  }

  function handleCategoryPick(cat?: ClassifiedCategory) {
    setCategory(cat);
    // Explorer shortcut should scroll to listings (per blueprint)
    scrollToId("listings");
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("asking");
    navigator.geolocation.getCurrentPosition(
      () => {
        // System-side: reverse geocode and set city later.
        // For now: just mark granted (blueprint: soft prompt + privacy reassurance).
        setGeoStatus("granted");
      },
      () => setGeoStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  // View mode: desktop grid default, mobile list default
  const [viewMode, setViewMode] = useState<"grid" | "list">(isDesktop ? "grid" : "list");
  useEffect(() => {
    setViewMode(isDesktop ? "grid" : "list");
  }, [isDesktop]);

  const heroTitle = lang === "es" ? "Clasificados" : "Classifieds";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sticky Action Bar */}
      <div
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-transform duration-300",
          showSticky ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="border-b border-white/10 bg-black/85 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="text-sm font-extrabold tracking-tight text-amber-100">
                {heroTitle}
              </div>
              <div className="hidden md:block text-xs text-white/60">
                Acceso justo • Comunidad primero • Premium para quienes invierten
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PillButton href="/clasificados/publicar">Publicar anuncio</PillButton>
              <PillButton variant="ghost" onClick={() => scrollToId("listings")}>
                Ver anuncios
              </PillButton>
              <PillButton variant="ghost" onClick={() => scrollToId("memberships")}>
                Membresías
              </PillButton>
            </div>
          </div>
        </div>
      </div>

      {/* Cinematic Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
          <div className="absolute -top-24 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-120px] h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[-160px] right-[-160px] h-96 w-96 rounded-full bg-amber-200/5 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 pt-10 pb-8 md:pt-14 md:pb-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Logo placeholder: use your public/logo.png in your layout if already standard */}
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-amber-100 font-extrabold">
                L
              </div>
              <div className="text-xs uppercase tracking-[0.22em] text-white/60">LEONIX</div>
            </div>
            <TopRightAccount />
          </div>

          <div className="mt-8 md:mt-10">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-amber-100">
              {heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-base md:text-lg text-white/70 leading-relaxed">
              Acceso justo para todos. Comunidad primero. Ventaja premium para quienes invierten —
              sin esconder anuncios gratuitos.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PillButton href="/clasificados/publicar">Publicar anuncio</PillButton>
              <PillButton variant="ghost" onClick={() => scrollToId("listings")}>
                Ver anuncios
              </PillButton>
              <PillButton variant="ghost" onClick={() => scrollToId("memberships")}>
                Membresías
              </PillButton>
            </div>

            <div className="mt-6 text-xs text-white/55">
              Moderación AI (spam/duplicados/precios falsos) • Publicación asistida en oficina •
              Privacidad respetada
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        <SoftDivider />

        {/* FILTER BAR (ANCHOR — MUST APPEAR BEFORE LISTINGS) */}
        <section id="filters" className="pt-8">
          <div className="flex items-end justify-between gap-3">
            <SectionTitle>Filtrar anuncios</SectionTitle>

            {/* Mobile: open full-screen modal */}
            {isMobile ? (
              <PillButton variant="ghost" onClick={() => setMobileFiltersOpen(true)}>
                Abrir filtros
              </PillButton>
            ) : null}
          </div>

          {/* Desktop / Tablet visible filter bar */}
          {!isMobile ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Search */}
                <div className="md:col-span-4">
                  <label className="block text-xs font-semibold text-white/65 mb-1">Buscar</label>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por título…"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                  />
                </div>

                {/* Location (City + Radius) */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-white/65 mb-1">Ubicación</label>
                  <button
                    type="button"
                    onClick={() => setLocationOpen(true)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left text-sm text-white/85 hover:border-white/20 transition"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate">
                        {city} • {radius} mi
                      </span>
                      <span className="text-white/40">Editar</span>
                    </div>
                  </button>
                </div>

                {/* Category dropdown */}
                <div className="md:col-span-3">
                  <label className="block text-xs font-semibold text-white/65 mb-1">Categoría</label>
                  <select
                    value={category ?? ""}
                    onChange={(e) =>
                      setCategory((e.target.value || undefined) as ClassifiedCategory | undefined)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                  >
                    <option value="">Todas</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-white/65 mb-1">Orden</label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortMode)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                  >
                    <option value="BALANCED">Balanced</option>
                    <option value="NEWEST">Newest</option>
                    <option value="PRICE_ASC">Price ↑</option>
                    <option value="PRICE_DESC">Price ↓</option>
                  </select>
                </div>
              </div>

              {/* More filters */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setMoreOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/8 hover:border-white/20 transition"
                >
                  <span>More filters</span>
                  <span className="text-white/50">{moreOpen ? "▲" : "▼"}</span>
                </button>

                {moreOpen ? (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Price range */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-white/65 mb-1">
                        Rango de precio
                      </label>
                      <div className="flex gap-2">
                        <input
                          inputMode="numeric"
                          value={minPrice}
                          onChange={(e) =>
                            setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="Min"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                        />
                        <input
                          inputMode="numeric"
                          value={maxPrice}
                          onChange={(e) =>
                            setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
                          }
                          placeholder="Max"
                          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                        />
                      </div>
                    </div>

                    {/* Posted timeframe */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-white/65 mb-1">
                        Publicado
                      </label>
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value as PostedTimeframe)}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                      >
                        <option value="ANY">Cualquier fecha</option>
                        <option value="24H">Últimas 24 h</option>
                        <option value="7D">Últimos 7 días</option>
                        <option value="30D">Últimos 30 días</option>
                      </select>
                    </div>

                    {/* Has image */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-white/65 mb-1">
                        Imagen
                      </label>
                      <button
                        type="button"
                        onClick={() => setHasImage((v) => !v)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2 text-sm font-semibold transition",
                          hasImage
                            ? "border-amber-200/30 bg-amber-200/10 text-amber-100"
                            : "border-white/10 bg-black/40 text-white/80 hover:border-white/20"
                        )}
                      >
                        {hasImage ? "Solo con imagen" : "Cualquiera"}
                      </button>
                    </div>

                    {/* Seller type */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-white/65 mb-1">
                        Vendedor
                      </label>
                      <select
                        value={sellerType}
                        onChange={(e) => setSellerType(e.target.value as SellerType | "ANY")}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                      >
                        <option value="ANY">Cualquiera</option>
                        <option value="PERSONAL">Personal</option>
                        <option value="BUSINESS">Negocio</option>
                      </select>
                    </div>

                    {/* Condition (when applicable) */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-white/65 mb-1">
                        Condición
                      </label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value as ListingCondition | "ANY")}
                        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                      >
                        <option value="ANY">Cualquiera</option>
                        <option value="NEW">Nuevo</option>
                        <option value="LIKE_NEW">Como nuevo</option>
                        <option value="GOOD">Bueno</option>
                        <option value="FAIR">Regular</option>
                        <option value="FOR_PARTS">Para partes</option>
                      </select>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Category Pills (Shortcuts Only) */}
          <div className="mt-6">
            <div className="text-xs font-semibold text-white/60 mb-2">Explorar por categoría</div>
            <CategoryPills activeCategory={category} onPick={handleCategoryPick} />
          </div>

          {/* Active Filter Chips */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {chips.map((c) => (
              <FilterChip key={c.key} label={c.label} onRemove={c.onRemove} />
            ))}
            {chips.length > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-1 inline-flex items-center rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-sm font-semibold text-white/65 hover:text-white/85 hover:border-white/20 transition"
              >
                Reset filters
              </button>
            ) : (
              <div className="text-sm text-white/45">Sin filtros activos</div>
            )}
          </div>
        </section>

        <div className="mt-8">
          <SoftDivider />
        </div>

        {/* Listings */}
        <section id="listings" className="pt-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <SectionTitle>Resultados</SectionTitle>
              <div className="mt-1 text-sm text-white/60">
                Showing {showingFrom}–{showingTo} of {total}
              </div>
            </div>

            {/* Results Header controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Sort selector (also here per blueprint) */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
              >
                <option value="BALANCED">Balanced</option>
                <option value="NEWEST">Newest</option>
                <option value="PRICE_ASC">Price ↑</option>
                <option value="PRICE_DESC">Price ↓</option>
              </select>

              {/* Grid/List toggle (desktop) */}
              <div className="hidden lg:flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    viewMode === "grid"
                      ? "bg-amber-200/10 text-amber-100"
                      : "text-white/70 hover:text-white/90"
                  )}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    viewMode === "list"
                      ? "bg-amber-200/10 text-amber-100"
                      : "text-white/70 hover:text-white/90"
                  )}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Feed */}
          {pageItems.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="text-lg font-extrabold text-amber-100">No encontramos anuncios</div>
              <p className="mt-2 text-sm text-white/65 max-w-2xl">
                Intenta ajustar filtros. Si estás buscando cerca, aumenta el radio o revisa todas las
                categorías.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <PillButton variant="ghost" onClick={resetFilters}>
                  Quitar filtros
                </PillButton>
                <PillButton
                  variant="ghost"
                  onClick={() => {
                    setRadius((r) => (r === 50 ? 50 : (RADIUS_OPTIONS[RADIUS_OPTIONS.indexOf(r) + 1] ?? 50)));
                    scrollToId("listings");
                  }}
                >
                  Aumentar radio
                </PillButton>
                <PillButton
                  variant="ghost"
                  onClick={() => {
                    setCategory(undefined);
                    scrollToId("listings");
                  }}
                >
                  Ver todo
                </PillButton>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "mt-6",
                viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"
              )}
            >
              {pageItems.map((it) => (
                <ListingCard key={it.id} item={it} mode={viewMode} />
              ))}
            </div>
          )}

          {/* Pagination only */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <div className="text-sm text-white/60">
              Página {safePage} de {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  safePage === 1
                    ? "border-white/10 bg-white/5 text-white/35 cursor-not-allowed"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/8 hover:border-white/20"
                )}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                  safePage === totalPages
                    ? "border-white/10 bg-white/5 text-white/35 cursor-not-allowed"
                    : "border-white/10 bg-white/5 text-white/80 hover:bg-white/8 hover:border-white/20"
                )}
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>

        <div className="mt-10">
          <SoftDivider />
        </div>

        {/* Membership Summary Anchor */}
        <section id="memberships" className="pt-8">
          <SectionTitle>Membresías</SectionTitle>
          <p className="mt-2 text-sm text-white/65 max-w-3xl">
            Resumen rápido. Beneficios completos se muestran en la página de Membresías.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <MembershipCard
              title="Free"
              badge={null}
              points={[
                "Publicación básica",
                "Siempre visible y buscable",
                "Ranking estándar (sin esconder anuncios)",
              ]}
            />
            <MembershipCard
              title="LEONIX Pro"
              badge={{ label: "Joya", tone: "gold" }}
              points={[
                "Más duración y mejor presentación",
                "Analíticas básicas (vistas/guardados)",
                "Ventana de visibilidad por anuncio (sin llamarlo boost)",
              ]}
            />
            <MembershipCard
              title="Business Lite"
              badge={{ label: "Corona", tone: "silver" }}
              points={[
                "Insignia de negocio",
                "Más anuncios activos",
                "Mayor visibilidad que perfiles personales",
              ]}
            />
            <MembershipCard
              title="Business Premium"
              badge={{ label: "Corona de Oro", tone: "goldStrong" }}
              points={[
                "Prioridad de ranking",
                "Perfil mejorado",
                "Herramientas de contacto/leads por anuncio",
              ]}
            />
          </div>
        </section>
      </div>

      {/* Mobile Filter Modal (full screen) */}
      <ModalShell
        open={mobileFiltersOpen}
        title="Filtros"
        onClose={() => setMobileFiltersOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm font-semibold text-white/70 hover:text-white/90 hover:border-white/20 transition"
            >
              Reset filters
            </button>
            <PillButton
              onClick={() => {
                setMobileFiltersOpen(false);
                scrollToId("listings");
              }}
            >
              Ver resultados
            </PillButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/65 mb-1">Buscar</label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título…"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/65 mb-1">Ubicación</label>
            <button
              type="button"
              onClick={() => setLocationOpen(true)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-left text-sm text-white/85 hover:border-white/20 transition"
            >
              {city} • {radius} mi
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/65 mb-1">Categoría</label>
            <select
              value={category ?? ""}
              onChange={(e) =>
                setCategory((e.target.value || undefined) as ClassifiedCategory | undefined)
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
            >
              <option value="">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/65 mb-1">Orden</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
            >
              <option value="BALANCED">Balanced</option>
              <option value="NEWEST">Newest</option>
              <option value="PRICE_ASC">Price ↑</option>
              <option value="PRICE_DESC">Price ↓</option>
            </select>
          </div>

          <div className="pt-2">
            <div className="text-sm font-extrabold text-amber-100">More filters</div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-white/65 mb-1">
                  Rango de precio
                </label>
                <div className="flex gap-2">
                  <input
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Min"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                  />
                  <input
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Max"
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/65 mb-1">Publicado</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as PostedTimeframe)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                >
                  <option value="ANY">Cualquier fecha</option>
                  <option value="24H">Últimas 24 h</option>
                  <option value="7D">Últimos 7 días</option>
                  <option value="30D">Últimos 30 días</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/65 mb-1">Imagen</label>
                <button
                  type="button"
                  onClick={() => setHasImage((v) => !v)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    hasImage
                      ? "border-amber-200/30 bg-amber-200/10 text-amber-100"
                      : "border-white/10 bg-black/40 text-white/80 hover:border-white/20"
                  )}
                >
                  {hasImage ? "Solo con imagen" : "Cualquiera"}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/65 mb-1">Vendedor</label>
                <select
                  value={sellerType}
                  onChange={(e) => setSellerType(e.target.value as SellerType | "ANY")}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                >
                  <option value="ANY">Cualquiera</option>
                  <option value="PERSONAL">Personal</option>
                  <option value="BUSINESS">Negocio</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/65 mb-1">Condición</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ListingCondition | "ANY")}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
                >
                  <option value="ANY">Cualquiera</option>
                  <option value="NEW">Nuevo</option>
                  <option value="LIKE_NEW">Como nuevo</option>
                  <option value="GOOD">Bueno</option>
                  <option value="FAIR">Regular</option>
                  <option value="FOR_PARTS">Para partes</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </ModalShell>

      {/* Location Modal (soft permission + privacy reassurance + nearby city chips inside modal only) */}
      <ModalShell
        open={locationOpen}
        title="Ubicación"
        onClose={() => setLocationOpen(false)}
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setCity(DEFAULT_CITY);
                setRadius(DEFAULT_RADIUS);
              }}
              className="rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm font-semibold text-white/70 hover:text-white/90 hover:border-white/20 transition"
            >
              Restaurar
            </button>
            <PillButton onClick={() => setLocationOpen(false)}>Guardar</PillButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-sm font-extrabold text-amber-100">Permiso de ubicación (opcional)</div>
            <p className="mt-2 text-sm text-white/65">
              Puedes usar tu ubicación para sugerir ciudad. No guardamos tu ubicación precisa — solo
              la ciudad y el radio que elijas.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <PillButton variant="ghost" onClick={requestLocation}>
                Usar mi ubicación
              </PillButton>
              <span className="text-xs text-white/55">
                {geoStatus === "idle"
                  ? ""
                  : geoStatus === "asking"
                  ? "Solicitando permiso…"
                  : geoStatus === "granted"
                  ? "Permiso concedido"
                  : "Permiso denegado"}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/65 mb-1">Ciudad</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej: San José"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/85 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-amber-300/25"
            />
            <div className="mt-2 text-xs font-semibold text-white/55">Ciudades cercanas</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {nearbyCities.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white/80 hover:bg-white/8 hover:border-white/20 transition"
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/65 mb-1">Radio</label>
            <div className="flex flex-wrap gap-2">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadius(r)}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-semibold border transition",
                    radius === r
                      ? "border-amber-200/35 bg-amber-200/10 text-amber-100"
                      : "border-white/10 bg-white/5 text-white/80 hover:bg-white/8 hover:border-white/20"
                  )}
                >
                  {r} mi
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-white/55">
              La ciudad es el selector principal. El radio ampliará el alcance (lógica de distancia se
              conecta después).
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}

function ListingCard(props: { item: ClassifiedItem; mode: "grid" | "list" }) {
  const { item } = props;
  const badge = badgeForTier(item.tier);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/15 transition overflow-hidden",
        props.mode === "list" ? "p-4" : "p-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="text-base font-extrabold text-white/90 truncate">{item.title}</div>
            {badge ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold",
                  toneClasses(badge.tone)
                )}
              >
                {badge.label}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
            <span className="font-extrabold text-amber-100">{formatPrice(item.price)}</span>
            <span>•</span>
            <span className="truncate">{item.city}</span>
            <span>•</span>
            <span>Publicado {timeAgoES(item.createdAtISO)}</span>
          </div>
        </div>

        {/* Small thumbnail if available (cards only) */}
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt=""
            className="h-14 w-14 rounded-xl border border-white/10 object-cover bg-black/30 shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-xl border border-white/10 bg-black/30 shrink-0" />
        )}
      </div>

      {/* No full images here. Detail page later. */}
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-white/55">
          {/* AI-first moderation assumed. */}
          Anuncio verificado por reglas de plataforma
        </div>
        <Link
          href={`/clasificados/${item.id}`}
          className="text-sm font-extrabold text-amber-100 hover:text-amber-50 transition"
        >
          Ver detalles →
        </Link>
      </div>
    </div>
  );
}

function MembershipCard(props: {
  title: string;
  badge: null | { label: string; tone: "gold" | "silver" | "goldStrong" };
  points: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-lg font-extrabold text-white/90">{props.title}</div>
        {props.badge ? (
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-extrabold",
              toneClasses(props.badge.tone)
            )}
          >
            {props.badge.label}
          </span>
        ) : null}
      </div>
      <ul className="mt-3 space-y-2">
        {props.points.map((p, idx) => (
          <li key={idx} className="text-sm text-white/70">
            <span className="text-amber-100 mr-2">•</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
