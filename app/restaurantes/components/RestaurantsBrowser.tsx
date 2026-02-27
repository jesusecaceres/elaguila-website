"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AlertsPanel from "./AlertsPanel";
import { useSearchParams } from "next/navigation";
import type { Restaurant } from "../../data/restaurants";

type SortKey = "recommended" | "az" | "supporters";
type PriceKey = "all" | "$" | "$$" | "$$$" | "$$$$";
type RadiusKey = 10 | 25 | 40 | 50;

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeSlug(s: string) {
  return s.trim().toLowerCase();
}

function getSlugCandidate(r: { id: string; name: string }) {
  const base = r.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return `${base}-${r.id}`;
}

function restaurantHref(r: { id: string; name: string }) {
  return `/restaurantes/${normalizeSlug(getSlugCandidate(r))}`;
}

function formatPhoneForTel(phone: string) {
  return phone.replace(/[^0-9+]/g, "");
}

function safeHost(url: string) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function supporterRank(supporter?: Restaurant["supporter"]) {
  // Higher is better
  if (supporter === "Corona de Oro") return 2;
  if (supporter === "Corona") return 1;
  return 0;
}

function tagHasAny(tags: string[] | undefined, patterns: RegExp[]) {
  const t = (Array.isArray(tags) ? tags : []).join(" ").toLowerCase();
  return patterns.some((p) => p.test(t));
}

function isOpenNowByTags(r: Restaurant) {
  return tagHasAny(r.tags, [/open\s*now/i, /abierto\s*ahora/i, /abierto\b/i, /open\b/i]);
}

function isFamilyFriendlyByTags(r: Restaurant) {
  return tagHasAny(r.tags, [/family/i, /familia/i, /kids?/i, /niñ[oa]s?/i, /family-friendly/i]);
}

function isDietaryFriendlyByTags(r: Restaurant) {
  return tagHasAny(r.tags, [/vegan/i, /vegano/i, /vegetarian/i, /vegetar/i, /halal/i, /gluten\s*-?free/i, /sin\s*gluten/i, /kosher/i]);
}

function hasSpecialsSignal(r: Restaurant) {
  // Real signals only: couponsUrl or explicit tags
  if (r.couponsUrl) return true;
  return tagHasAny(r.tags, [/special/i, /oferta/i, /promo/i, /descuento/i, /coupon/i, /cupon/i]);
}

function renderTrustPills(r: Restaurant, lang: "es" | "en") {
  const isOpenNow = isOpenNowByTags(r);
  const fastResponse = Boolean(r?.phone || r?.email || r?.text);

  const pills: { key: string; label: string; className: string }[] = [];
  if (r?.verified) {
    pills.push({
      key: "verified",
      label: lang === "es" ? "Verificado" : "Verified",
      className: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
    });
  }
  if (fastResponse) {
    pills.push({
      key: "fast",
      label: lang === "es" ? "Respuesta rápida" : "Fast response",
      className: "bg-white/5 border-white/10 text-gray-200",
    });
  }
  if (isOpenNow) {
    pills.push({
      key: "open",
      label: lang === "es" ? "Abierto ahora" : "Open now",
      className: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
    });
  }

  if (!pills.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {pills.map((p) => (
        <span key={p.key} className={["text-xs px-2 py-1 rounded-lg border", p.className].join(" ")}>
          {p.label}
        </span>
      ))}
    </div>
  );
}

const FAV_KEY = "leonix_restaurant_favorites_v1";

function readFavs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    return [];
  } catch {
    return [];
  }
}

function writeFavs(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAV_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

function emitFavs(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("leonix:favorites", { detail: { ids } }));
  } catch {
    // ignore
  }
}

export default function RestaurantsBrowser({ restaurants }: { restaurants: Restaurant[] }) {
  const searchParams = useSearchParams();
  const lang: "es" | "en" = searchParams?.get("lang") === "en" ? "en" : "es";

  const [favIds, setFavIds] = useState<string[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [radius, setRadius] = useState<RadiusKey>(25);
  const [cuisine, setCuisine] = useState("all");
  const [price, setPrice] = useState<PriceKey>("all");
  const [openNow, setOpenNow] = useState(false);
  const [family, setFamily] = useState(false);
  const [dietary, setDietary] = useState(false);
  const [specialsOnly, setSpecialsOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommended");

  const businessHref = `/restaurantes/negocio?lang=${lang}`;
  const packagesHref = `/restaurantes/planes?lang=${lang}`;

  useEffect(() => {
    const apply = () => setFavIds(readFavs());
    apply();
    const onEvt = (e: Event) => {
      const ce = e as CustomEvent<{ ids?: string[] }>;
      if (ce?.detail?.ids && Array.isArray(ce.detail.ids)) setFavIds(ce.detail.ids);
      else apply();
    };
    window.addEventListener("leonix:favorites", onEvt as EventListener);
    return () => window.removeEventListener("leonix:favorites", onEvt as EventListener);
  }, []);

  const favSet = useMemo(() => new Set(favIds), [favIds]);
  const [showFavs, setShowFavs] = useState(false);

  const cities = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.city && set.add(r.city));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [restaurants]);

  const cuisines = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.cuisine && set.add(r.cuisine));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [restaurants]);

  const topCuisineChips = useMemo(() => {
    const counts = new Map<string, number>();
    restaurants.forEach((r) => {
      const c = (r.cuisine || "").trim();
      if (!c) return;
      counts.set(c, (counts.get(c) || 0) + 1);
    });
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
    return sorted.slice(0, 8);
  }, [restaurants]);

  const filtered = useMemo(() => {
    const nq = normalize(q);
    let list = (restaurants || []).slice();

    if (city !== "all") {
      const nc = normalize(city);
      list = list.filter((r) => normalize(r.city || "") === nc);
    }

    // Note: radius is a preference UI right now (we only apply city filtering until geo coordinates exist).
    // We still surface radius in the results header + alerts for future expansion.

    if (cuisine !== "all") {
      const nc = normalize(cuisine);
      list = list.filter((r) => normalize(r.cuisine || "") === nc);
    }

    if (price !== "all") {
      list = list.filter((r) => (r.price || "") === price);
    }

    if (openNow) list = list.filter((r) => isOpenNowByTags(r));
    if (family) list = list.filter((r) => isFamilyFriendlyByTags(r));
    if (dietary) list = list.filter((r) => isDietaryFriendlyByTags(r));
    if (specialsOnly) list = list.filter((r) => hasSpecialsSignal(r));

    if (nq) {
      list = list.filter((r) => {
        const hay =
          normalize(r.name || "") +
          " " +
          normalize(r.cuisine || "") +
          " " +
          normalize(r.city || "") +
          " " +
          normalize(r.address || "") +
          " " +
          normalize((r.tags || []).join(" "));
        return hay.includes(nq);
      });
    }

    // Favorites mode (post-filter)
    if (showFavs) list = list.filter((r) => favSet.has(r.id));

    // Sorting
    if (sort === "az") {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "supporters") {
      list.sort((a, b) => {
        const v = supporterRank(b.supporter) - supporterRank(a.supporter);
        if (v !== 0) return v;
        return (a.name || "").localeCompare(b.name || "");
      });
    } else {
      // recommended: supporters first, verified next, then alpha
      list.sort((a, b) => {
        const s = supporterRank(b.supporter) - supporterRank(a.supporter);
        if (s !== 0) return s;
        const v = Number(!!b.verified) - Number(!!a.verified);
        if (v !== 0) return v;
        return (a.name || "").localeCompare(b.name || "");
      });
    }

    return list;
  }, [restaurants, q, city, cuisine, price, openNow, family, dietary, specialsOnly, sort, showFavs, favSet, radius]);

  const hasAny = (restaurants || []).length > 0;
  const hasActiveFilters =
    q.trim() !== "" ||
    city !== "all" ||
    cuisine !== "all" ||
    price !== "all" ||
    openNow ||
    family ||
    dietary ||
    specialsOnly ||
    sort !== "recommended" ||
    showFavs;

  function scrollToFilters() {
    if (typeof document === "undefined") return;
    const el = document.getElementById("restaurants-filters");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetAllFilters() {
    setQ("");
    setCity("all");
    setRadius(25);
    setCuisine("all");
    setPrice("all");
    setOpenNow(false);
    setFamily(false);
    setDietary(false);
    setSpecialsOnly(false);
    setSort("recommended");
    setShowFavs(false);
  }

  function toggleFavorite(id: string) {
    const next = new Set(readFavs());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const ids = Array.from(next);
    writeFavs(ids);
    setFavIds(ids);
    emitFavs(ids);
  }

  function handleSpecialsNearMe() {
    setSpecialsOnly(true);
    scrollToFilters();
  }

  const resultsLabel = useMemo(() => {
    const parts: string[] = [];
    if (city !== "all") parts.push(city);
    if (city !== "all") parts.push(`${radius} mi`);
    return parts.join(" • ");
  }, [city, radius]);

  return (
    <section className="w-full max-w-6xl mx-auto px-6 pb-20">
      {/* Business CTA */}
      <div className="mb-4 bg-black/30 border border-yellow-600/20 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-100">
            {lang === "es" ? "¿Eres dueño de un restaurante?" : "Own a restaurant?"}
          </div>
          <div className="mt-1 text-xs text-gray-300">
            {lang === "es"
              ? "Crea tu perfil verificado y empieza a recibir clientes."
              : "Create a verified profile and start getting customers."}
          </div>
        </div>
        <Link
          href={businessHref}
          className="inline-flex items-center justify-center rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 px-4 py-3 text-sm font-semibold hover:bg-yellow-500/20 transition"
        >
          {lang === "es" ? "Publicar mi restaurante" : "List my restaurant"}
        </Link>
        <Link
          href={packagesHref}
          className="inline-flex items-center justify-center rounded-xl bg-black/30 border border-yellow-500/25 text-gray-100 px-4 py-3 text-sm font-semibold hover:bg-black/40 transition"
        >
          {lang === "es" ? "Ver planes" : "View plans"}
        </Link>
      </div>

      {/* Quick actions */}
      <div className="mb-4 bg-black/30 border border-yellow-600/20 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm font-semibold text-gray-100">
            {lang === "es" ? "Encuentra un lugar confiable cerca de ti" : "Find a trusted place near you"}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSpecialsNearMe}
              className="px-3 py-2 rounded-xl text-sm font-semibold border transition bg-yellow-500/15 border-yellow-500/35 text-yellow-200 hover:bg-yellow-500/20"
            >
              {lang === "es" ? "Ofertas cerca de mí" : "Specials near me"}
            </button>

            <button
              type="button"
              onClick={() => setAlertsOpen(true)}
              className="px-3 py-2 rounded-xl text-sm font-semibold border transition bg-black/30 border-white/10 text-gray-100 hover:bg-white/5"
            >
              {lang === "es" ? "Alertas" : "Alerts"}
            </button>

            <button
              type="button"
              onClick={() => setShowFavs((v) => !v)}
              className={cx(
                "px-3 py-2 rounded-xl text-sm font-semibold border transition",
                showFavs
                  ? "bg-yellow-500/15 border-yellow-500/35 text-yellow-200"
                  : "bg-black/30 border-white/10 text-gray-100 hover:bg-white/5"
              )}
            >
              {showFavs ? (lang === "es" ? "Ver todos" : "View all") : (lang === "es" ? "Favoritos" : "Favorites")}
            </button>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-3 py-2 rounded-xl text-sm font-semibold border transition bg-black/30 border-white/10 text-gray-100 hover:bg-white/5"
              >
                {lang === "es" ? "Restablecer" : "Reset"}
              </button>
            ) : null}
          </div>
        </div>

        {showFavs ? (
          <p className="mt-2 text-xs text-gray-400">{lang === "es" ? "Mostrando tus favoritos" : "Showing your favorites"}</p>
        ) : null}

        {/* Quick cuisine chips */}
        {hasAny && topCuisineChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {topCuisineChips.map((c) => {
              const active = cuisine === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCuisine(active ? "all" : c)}
                  className={cx(
                    "text-xs px-3 py-2 rounded-xl border transition",
                    active
                      ? "bg-yellow-500/15 border-yellow-500/35 text-yellow-200"
                      : "bg-black/20 border-white/10 text-gray-100 hover:bg-white/5"
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* Filters */}
      <div id="restaurants-filters" className="bg-black/30 border border-yellow-600/20 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "es" ? "Buscar restaurante, comida, ciudad…" : "Search restaurants, cuisine, city…"}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 placeholder:text-gray-400 outline-none focus:border-yellow-500/50"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? (lang === "es" ? "Todas las ciudades" : "All cities") : c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value) as RadiusKey)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
            >
              {[10, 25, 40, 50].map((m) => (
                <option key={m} value={m}>
                  {lang === "es" ? `${m} mi` : `${m} mi`}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
            >
              {cuisines.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? (lang === "es" ? "Todas las cocinas" : "All cuisines") : c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value as PriceKey)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
            >
              <option value="all">{lang === "es" ? "Todos los precios" : "All prices"}</option>
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
              <option value="$$$$">$$$$</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
            >
              <option value="recommended">{lang === "es" ? "Recomendados" : "Recommended"}</option>
              <option value="supporters">{lang === "es" ? "Supporters primero" : "Supporters first"}</option>
              <option value="az">{lang === "es" ? "A–Z" : "A–Z"}</option>
            </select>
          </div>

          <div className="md:col-span-9 flex flex-wrap gap-2 items-center">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/10">
              <input
                type="checkbox"
                checked={openNow}
                onChange={(e) => setOpenNow(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-100">{lang === "es" ? "Abierto ahora" : "Open now"}</span>
            </label>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/10">
              <input
                type="checkbox"
                checked={family}
                onChange={(e) => setFamily(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-100">{lang === "es" ? "Familiar" : "Family-friendly"}</span>
            </label>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/10">
              <input
                type="checkbox"
                checked={dietary}
                onChange={(e) => setDietary(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-100">{lang === "es" ? "Dietas" : "Dietary"}</span>
            </label>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/10">
              <input
                type="checkbox"
                checked={specialsOnly}
                onChange={(e) => setSpecialsOnly(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm text-gray-100">{lang === "es" ? "Ofertas" : "Specials"}</span>
            </label>

            {city !== "all" ? (
              <span className="text-xs text-gray-400">
                {lang === "es"
                  ? "Radio es preferencia (geo pronto)."
                  : "Radius is a preference (geo soon)."}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Results header */}
      <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-gray-100">
            {lang === "es" ? "Resultados" : "Results"}
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {lang === "es"
              ? `Mostrando ${filtered.length} ${resultsLabel ? `en ${resultsLabel}` : ""}`
              : `Showing ${filtered.length} ${resultsLabel ? `in ${resultsLabel}` : ""}`}
          </div>
        </div>

        <div className="text-xs text-gray-500">
          {lang === "es"
            ? "Más rápido para cerrar: contacto + ofertas + alertas."
            : "Faster to close: contact + specials + alerts."}
        </div>
      </div>

      {/* List */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((r) => {
          const href = restaurantHref({ id: r.id, name: r.name });
          const phoneTel = r.phone ? formatPhoneForTel(r.phone) : "";
          const websiteHost = r.website ? safeHost(r.website) : "";

          return (
            <div key={r.id} className="bg-black/30 border border-yellow-600/20 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={href} className="block text-lg font-semibold text-yellow-200 hover:underline truncate">
                    {r.name}
                  </Link>
                  <div className="mt-1 text-sm text-gray-200">
                    {[
                      r.cuisine || "",
                      r.city || "",
                      r.price || "",
                    ].filter(Boolean).join(" • ")}
                  </div>
                  {renderTrustPills(r, lang)}
                </div>

                <button
                  type="button"
                  onClick={() => toggleFavorite(r.id)}
                  className={cx(
                    "shrink-0 px-3 py-2 rounded-xl border text-sm font-semibold transition",
                    favSet.has(r.id)
                      ? "bg-yellow-500/15 border-yellow-500/35 text-yellow-200"
                      : "bg-black/20 border-white/10 text-gray-100 hover:bg-white/5"
                  )}
                >
                  {favSet.has(r.id) ? (lang === "es" ? "Guardado" : "Saved") : (lang === "es" ? "Guardar" : "Save")}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {phoneTel ? (
                  <a
                    href={`tel:${phoneTel}`}
                    className="px-4 py-2 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
                  >
                    {lang === "es" ? "Llamar" : "Call"}
                  </a>
                ) : null}

                {r.text ? (
                  <a
                    href={`sms:${formatPhoneForTel(r.text)}`}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                  >
                    {lang === "es" ? "Texto" : "Text"}
                  </a>
                ) : null}

                {r.website ? (
                  <a
                    href={r.website}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                  >
                    {lang === "es" ? "Sitio" : "Website"}{websiteHost ? ` • ${websiteHost}` : ""}
                  </a>
                ) : null}

                <Link
                  href={href}
                  className="px-4 py-2 rounded-xl bg-black/30 border border-yellow-500/25 text-gray-100 hover:bg-black/40 font-semibold"
                >
                  {lang === "es" ? "Ver perfil" : "View profile"}
                </Link>
              </div>

              {r.address ? <p className="mt-3 text-xs text-gray-400">{r.address}</p> : null}
            </div>
          );
        })}
      </div>

      {!hasAny ? (
        <div className="mt-8 bg-black/30 border border-yellow-600/20 rounded-2xl p-6 text-center">
          <div className="text-sm font-semibold text-gray-100">{lang === "es" ? "Aún no hay restaurantes" : "No restaurants yet"}</div>
          <div className="mt-2 text-xs text-gray-300">
            {lang === "es"
              ? "Los negocios se publicarán aquí con perfiles verificados."
              : "Businesses will publish here with verified profiles."}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              href={businessHref}
              className="inline-flex items-center justify-center rounded-xl bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 px-4 py-3 text-sm font-semibold hover:bg-yellow-500/20 transition"
            >
              {lang === "es" ? "Publicar mi restaurante" : "List my restaurant"}
            </Link>
            <Link
              href={packagesHref}
              className="inline-flex items-center justify-center rounded-xl bg-black/30 border border-yellow-500/25 text-gray-100 px-4 py-3 text-sm font-semibold hover:bg-black/40 transition"
            >
              {lang === "es" ? "Ver planes" : "View plans"}
            </Link>
          </div>
        </div>
      ) : null}

      <AlertsPanel open={alertsOpen} onClose={() => setAlertsOpen(false)} lang={lang} restaurants={restaurants} />
    </section>
  );
}
