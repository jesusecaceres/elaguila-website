"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  labelForBusinessType,
  labelForCuisine,
  RESTAURANTE_BUSINESS_TYPES,
  RESTAURANTE_CUISINES,
  RESTAURANTE_HIGHLIGHTS,
  RESTAURANTE_PRICE_LEVELS,
  RESTAURANTE_SERVICE_MODES,
} from "@/app/clasificados/restaurantes/application/restauranteTaxonomy";
import type {
  RestauranteCuisineKey,
  RestauranteHighlightKey,
  RestauranteServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import Navbar from "@/app/components/Navbar";
import type { RestaurantePublicResultsRow } from "@/app/clasificados/restaurantes/lib/restaurantesPublicListingMapper";

type Lang = "es" | "en";
type SortId = "newest" | "name-asc";

function textMatch(q: string, row: RestaurantePublicResultsRow): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const blob = `${row.businessName} ${row.summaryShort} ${row.cityCanonical} ${row.neighborhood ?? ""}`.toLowerCase();
  return blob.includes(t);
}

/** URL + discovery may send canonical keys or English discovery chips — normalize to taxonomy keys. */
const DISCOVERY_CUISINE_ALIASES: Record<string, RestauranteCuisineKey> = {
  mexican: "mexican",
  latino: "latin_mixed",
  american: "american",
  bbq: "bbq",
  chinese: "chinese",
  japanese: "japanese",
  korean: "korean",
  thai: "thai",
  vietnamese: "vietnamese",
  indian: "indian",
  greek: "greek",
  italian: "italian",
  seafood: "seafood",
  breakfast: "breakfast_brunch",
  coffee: "cafe_food",
  dessert: "dessert",
};

function rowMatchesCuisineFilter(param: string, row: RestaurantePublicResultsRow): boolean {
  const raw = param.trim();
  if (!raw) return true;

  let key: RestauranteCuisineKey | null = null;
  if (RESTAURANTE_CUISINES.some((c) => c.key === raw)) {
    key = raw as RestauranteCuisineKey;
  } else {
    const lower = raw.toLowerCase();
    key = DISCOVERY_CUISINE_ALIASES[lower] ?? null;
  }

  if (key) {
    return row.primaryCuisineKey === key || row.secondaryCuisineKey === key;
  }

  const q = raw.toLowerCase();
  const p = labelForCuisine(row.primaryCuisineKey).toLowerCase();
  const s = row.secondaryCuisineKey ? labelForCuisine(row.secondaryCuisineKey).toLowerCase() : "";
  return p.includes(q) || (s.length > 0 && s.includes(q));
}

export function RestauranteResultsClient({ initialListings }: { initialListings: RestaurantePublicResultsRow[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const lang: Lang = sp?.get("lang") === "en" ? "en" : "es";

  const q = (sp?.get("q") ?? "").trim();
  const city = (sp?.get("city") ?? "").trim();
  const zip = (sp?.get("zip") ?? "").trim();
  const cuisine = (sp?.get("cuisine") ?? "").trim();
  const bt = (sp?.get("bt") ?? "").trim();
  const price = (sp?.get("price") ?? "").trim();
  const svc = (sp?.get("svc") ?? "").trim();
  const mv = sp?.get("mv") === "1";
  const hb = sp?.get("hb") === "1";
  const ft = sp?.get("ft") === "1";
  const hl = (sp?.get("hl") ?? "").trim();
  const sort = (sp?.get("sort") ?? "newest") as SortId;

  const [filtersOpen, setFiltersOpen] = useState(false);
  const qInputRef = useRef<HTMLInputElement>(null);

  const setParam = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(sp?.toString() ?? "");
      next.set("lang", lang);
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      }
      router.push(`/clasificados/restaurantes/resultados?${next.toString()}`);
    },
    [lang, router, sp]
  );

  const filtered = useMemo(() => {
    let list = initialListings.filter((row) => {
      if (!textMatch(q, row)) return false;
      if (city && !row.cityCanonical.toLowerCase().includes(city.toLowerCase())) return false;
      if (zip && (row.zipCode ?? "").trim() !== zip) return false;
      if (!rowMatchesCuisineFilter(cuisine, row)) return false;
      if (bt && row.businessTypeKey !== bt) return false;
      if (price && row.priceLevel !== price) return false;
      if (svc && !row.serviceModeKeys.includes(svc as RestauranteServiceMode)) return false;
      if (mv && !row.movingVendor) return false;
      if (hb && !row.homeBasedBusiness) return false;
      if (ft && !row.foodTruck && row.businessTypeKey !== "food_truck") return false;
      if (hl && !row.highlightKeys.includes(hl as RestauranteHighlightKey)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name-asc") return a.businessName.localeCompare(b.businessName, "es");
      return b.listedAt.localeCompare(a.listedAt);
    });

    return list;
  }, [initialListings, q, city, zip, cuisine, bt, price, svc, mv, hb, ft, hl, sort]);

  const promoted = useMemo(() => filtered.filter((r) => r.sponsored).slice(0, 2), [filtered]);
  const promotedIds = useMemo(() => new Set(promoted.map((p) => p.id)), [promoted]);
  const gridRows = useMemo(() => filtered.filter((r) => !promotedIds.has(r.id)), [filtered, promotedIds]);

  const t = {
    title: lang === "es" ? "Restaurantes" : "Restaurants",
    subtitle:
      lang === "es"
        ? "Explora listados publicados reales; los filtros usan solo campos guardados en cada anuncio."
        : "Browse real published listings; filters use only fields stored on each listing.",
    searchPh: lang === "es" ? "Buscar nombre o palabras…" : "Search name or keywords…",
    cityPh: lang === "es" ? "Ciudad" : "City",
    zipPh: lang === "es" ? "ZIP" : "ZIP",
    apply: lang === "es" ? "Aplicar" : "Apply",
    reset: lang === "es" ? "Restablecer" : "Reset",
    empty: lang === "es" ? "No hay resultados con estos filtros." : "No results for these filters.",
    sponsored: lang === "es" ? "Destacados" : "Featured",
    sortNew: lang === "es" ? "Más recientes" : "Newest",
    sortName: lang === "es" ? "Nombre A–Z" : "Name A–Z",
    filters: lang === "es" ? "Filtros" : "Filters",
    open: lang === "es" ? "Ver anuncio" : "View listing",
  };

  return (
    <div className="min-h-screen bg-[#F3EBDD] text-[color:var(--lx-text)]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-5 lg:px-6">
        <header className="border-b border-black/10 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--lx-muted)]">Leonix Clasificados</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--lx-text-2)]">{t.subtitle}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              ref={qInputRef}
              type="search"
              defaultValue={q}
              placeholder={t.searchPh}
              className="min-h-[44px] min-w-[200px] flex-1 rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-3 py-2 text-sm text-[color:var(--lx-text)] shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") setParam({ q: (e.target as HTMLInputElement).value });
              }}
            />
            <button
              type="button"
              className="min-h-[44px] rounded-xl bg-[color:var(--lx-cta-dark)] px-4 text-sm font-semibold text-[color:var(--lx-cta-light)]"
              onClick={() => setParam({ q: qInputRef.current?.value ?? "" })}
            >
              {t.apply}
            </button>
          </div>
        </header>

        <div className="mt-6 lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
          {/* Desktop filters */}
          <aside className="mb-6 hidden lg:block">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm">
              <FilterFields lang={lang} sp={sp} setParam={setParam} />
              <button
                type="button"
                className="w-full rounded-xl border border-[color:var(--lx-nav-border)] py-2 text-sm font-semibold text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-hover)]"
                onClick={() => {
                  router.push(`/clasificados/restaurantes/resultados?lang=${lang}`);
                }}
              >
                {t.reset}
              </button>
            </div>
          </aside>

          {/* Mobile filters */}
          <div className="lg:hidden">
            <button
              type="button"
              className="flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 py-3 text-left text-sm font-semibold shadow-sm"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              {t.filters}
              <span aria-hidden>{filtersOpen ? "−" : "+"}</span>
            </button>
            {filtersOpen ? (
              <div className="mt-3 space-y-4 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-sm">
                <FilterFields lang={lang} sp={sp} setParam={setParam} />
              </div>
            ) : null}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[color:var(--lx-text-2)]">
                {lang === "es" ? "Mostrando" : "Showing"}{" "}
                <span className="font-semibold text-[color:var(--lx-text)]">{filtered.length}</span>
              </p>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-[color:var(--lx-muted)]">{lang === "es" ? "Orden" : "Sort"}</span>
                <select
                  className="min-h-[44px] rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-1.5 text-sm"
                  value={sort}
                  onChange={(e) => setParam({ sort: e.target.value })}
                >
                  <option value="newest">{t.sortNew}</option>
                  <option value="name-asc">{t.sortName}</option>
                </select>
              </label>
            </div>

            {promoted.length ? (
              <section className="mt-6" aria-label={t.sponsored}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-[color:var(--lx-muted)]">{t.sponsored}</h2>
                <div className="mt-3 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {promoted.map((row) => (
                    <ResultCard key={row.id} row={row} lang={lang} compact />
                  ))}
                </div>
              </section>
            ) : null}

            <ul className="mt-8 grid list-none grid-cols-1 gap-4 sm:grid-cols-2">
              {gridRows.length === 0 ? (
                <li className="col-span-full rounded-2xl border border-dashed border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)]/60 px-6 py-12 text-center text-sm text-[color:var(--lx-text-2)]">
                  {t.empty}
                </li>
              ) : (
                gridRows.map((row) => (
                  <li key={row.id}>
                    <ResultCard row={row} lang={lang} />
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterFields({
  lang,
  sp,
  setParam,
}: {
  lang: Lang;
  sp: ReturnType<typeof useSearchParams>;
  setParam: (patch: Record<string, string | undefined>) => void;
}) {
  const city = sp?.get("city") ?? "";
  const zip = sp?.get("zip") ?? "";
  const cuisine = sp?.get("cuisine") ?? "";
  const bt = sp?.get("bt") ?? "";
  const price = sp?.get("price") ?? "";
  const svc = sp?.get("svc") ?? "";
  const mv = sp?.get("mv") === "1";
  const hb = sp?.get("hb") === "1";
  const ft = sp?.get("ft") === "1";
  const hl = sp?.get("hl") ?? "";

  const lab = (es: string, en: string) => (lang === "es" ? es : en);

  return (
    <>
      <div>
        <label className="text-xs font-semibold text-[color:var(--lx-muted)]">{lab("Ciudad", "City")}</label>
        <input
          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-2 text-sm"
          defaultValue={city}
          onBlur={(e) => setParam({ city: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[color:var(--lx-muted)]">ZIP</label>
        <input
          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-2 text-sm"
          defaultValue={zip}
          inputMode="numeric"
          onBlur={(e) => setParam({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-[color:var(--lx-muted)]">{lab("Cocina (principal)", "Cuisine")}</label>
        <select
          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-2 text-sm"
          value={cuisine}
          onChange={(e) => setParam({ cuisine: e.target.value })}
        >
          <option value="">{lab("Todas", "All")}</option>
          {RESTAURANTE_CUISINES.filter((c) => c.key !== "other").map((c) => (
            <option key={c.key} value={c.key}>
              {c.labelEs}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[color:var(--lx-muted)]">{lab("Tipo de negocio", "Business type")}</label>
        <select
          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-2 text-sm"
          value={bt}
          onChange={(e) => setParam({ bt: e.target.value })}
        >
          <option value="">{lab("Todos", "All")}</option>
          {RESTAURANTE_BUSINESS_TYPES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.labelEs}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[color:var(--lx-muted)]">{lab("Precio", "Price")}</label>
        <select
          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-2 text-sm"
          value={price}
          onChange={(e) => setParam({ price: e.target.value })}
        >
          <option value="">{lab("Todos", "All")}</option>
          {RESTAURANTE_PRICE_LEVELS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.labelEs}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[color:var(--lx-muted)]">{lab("Modo de servicio", "Service mode")}</label>
        <select
          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-2 text-sm"
          value={svc}
          onChange={(e) => setParam({ svc: e.target.value })}
        >
          <option value="">{lab("Cualquiera", "Any")}</option>
          {RESTAURANTE_SERVICE_MODES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.labelEs}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-[color:var(--lx-muted)]">{lab("Destacado", "Highlight")}</label>
        <select
          className="mt-1 w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-white px-2 py-2 text-sm"
          value={hl}
          onChange={(e) => setParam({ hl: e.target.value })}
        >
          <option value="">{lab("Cualquiera", "Any")}</option>
          {RESTAURANTE_HIGHLIGHTS.map((c) => (
            <option key={c.key} value={c.key}>
              {c.labelEs}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={mv} onChange={(e) => setParam({ mv: e.target.checked ? "1" : undefined })} />
          {lab("Ubicación móvil", "Mobile vendor")}
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={hb} onChange={(e) => setParam({ hb: e.target.checked ? "1" : undefined })} />
          {lab("Desde casa", "Home-based")}
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={ft} onChange={(e) => setParam({ ft: e.target.checked ? "1" : undefined })} />
          {lab("Food truck", "Food truck")}
        </label>
      </div>
    </>
  );
}

function ResultCard({
  row,
  lang,
  compact,
}: {
  row: RestaurantePublicResultsRow;
  lang: Lang;
  compact?: boolean;
}) {
  const line = [
    labelForCuisine(row.primaryCuisineKey),
    row.secondaryCuisineKey ? labelForCuisine(row.secondaryCuisineKey) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const badges: string[] = [];
  if (row.movingVendor) badges.push(lang === "es" ? "Móvil" : "Mobile");
  if (row.homeBasedBusiness) badges.push(lang === "es" ? "Desde casa" : "Home");
  if (row.foodTruck) badges.push("Food truck");
  if (row.popUp) badges.push("Pop-up");

  const meta = [row.cityCanonical, row.zipCode].filter(Boolean).join(" · ");

  const href = `/clasificados/restaurantes/${encodeURIComponent(row.slug)}`;

  return (
    <Link
      href={href}
      className={`group block overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_32px_-12px_rgba(42,36,22,0.15)] transition hover:border-[color:var(--lx-gold-border)] hover:shadow-md ${
        compact ? "w-[min(100vw-2rem,320px)] shrink-0" : "w-full"
      }`}
    >
      <div className={`relative ${compact ? "aspect-[5/3]" : "aspect-[16/10]"} w-full overflow-hidden bg-[color:var(--lx-section)]`}>
        {row.heroImageUrl ? (
          <Image
            src={row.heroImageUrl}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            sizes={compact ? "320px" : "(max-width:640px) 100vw, 50vw"}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] to-[#4a4034]" aria-hidden />
        )}
        {row.sponsored ? (
          <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {lang === "es" ? "Patrocinio" : "Sponsored"}
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 text-base font-bold text-[color:var(--lx-text)] group-hover:underline">{row.businessName}</h3>
        <p className="text-xs font-medium text-[color:var(--lx-gold)]">{line}</p>
        <p className="text-xs text-[color:var(--lx-muted)]">{meta}</p>
        <p className="line-clamp-2 text-sm text-[color:var(--lx-text-2)]">{row.summaryShort}</p>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="rounded-full border border-[color:var(--lx-gold-border)]/60 bg-[color:var(--lx-section)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--lx-text-2)]">
            {labelForBusinessType(row.businessTypeKey)}
          </span>
          {row.priceLevel ? (
            <span className="rounded-full border border-[color:var(--lx-nav-border)] px-2 py-0.5 text-[11px] text-[color:var(--lx-text-2)]">
              {row.priceLevel}
            </span>
          ) : null}
          {badges.slice(0, 3).map((b) => (
            <span
              key={b}
              className="rounded-full border border-[color:var(--lx-nav-border)] px-2 py-0.5 text-[11px] text-[color:var(--lx-text-2)]"
            >
              {b}
            </span>
          ))}
        </div>
        {row.externalRatingValue != null && row.externalReviewCount != null ? (
          <p className="text-[11px] text-[color:var(--lx-muted)]">
            ★ {row.externalRatingValue.toFixed(1)} · {row.externalReviewCount}{" "}
            {lang === "es" ? "reseñas (ref.)" : "reviews (ref.)"}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
