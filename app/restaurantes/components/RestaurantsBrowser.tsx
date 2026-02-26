"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Restaurant } from "../../data/restaurants";

type SortKey = "recommended" | "az" | "supporters";

function normalize(s: string) {
  return s.trim().toLowerCase();
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


export default function RestaurantsBrowser({ restaurants }: { restaurants: Restaurant[] }) {
  const searchParams = useSearchParams();
  const lang = searchParams?.get("lang") || "es";
  const [favIds, setFavIds] = useState<string[]>([]);

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


  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [cuisine, setCuisine] = useState("all");
  const [sort, setSort] = useState<SortKey>("recommended");

  const businessHref = `/restaurantes/negocio?lang=${lang}`;
  const packagesHref = `/restaurantes/planes?lang=${lang}`;

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
      if (!r.cuisine) return;
      counts.set(r.cuisine, (counts.get(r.cuisine) || 0) + 1);
    });
    const ranked = Array.from(counts.entries())
      .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
      .map(([name]) => name);
    return ranked.slice(0, 8);
  }, [restaurants]);

  const filtered = useMemo(() => {
    const qq = normalize(q);
    const base = restaurants.filter((r) => {
      if (showFavs && !favSet.has(r.id)) return false;
      if (city !== "all" && (r.city || "") !== city) return false;
      if (cuisine !== "all" && (r.cuisine || "") !== cuisine) return false;
      if (!qq) return true;
      const hay = normalize(
        [
          r.name,
          r.cuisine || "",
          r.city || "",
          r.address || "",
          r.text || "",
          r.website || "",
          r.instagram || "",
          r.facebook || "",
        ].join(" ")
      );
      return hay.includes(qq);
    });

    const sorted = [...base].sort((a, b) => {
      if (sort === "supporters") {
        const sr = supporterRank(b.supporter) - supporterRank(a.supporter);
        if (sr !== 0) return sr;
        return a.name.localeCompare(b.name);
      }
      if (sort === "az") return a.name.localeCompare(b.name);

      // recommended: supporters float, then verified, then name
      const s = supporterRank(b.supporter) - supporterRank(a.supporter);
      if (s !== 0) return s;
      const v = (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
      if (v !== 0) return v;
      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [restaurants, q, city, cuisine, sort, showFavs, favSet]);

  const hasAny = restaurants.length > 0;

  const topPicks = useMemo(() => {
    if (restaurants.length === 0) return [];
    // If a city is selected, pick from that city first.
    const pool = city !== "all" ? restaurants.filter((r) => (r.city || "").toLowerCase() === city) : restaurants;
    // Use the same sorting logic (supporters/verified) by reusing the filtered list when possible.
    const sorted = [...pool].sort((a, b) => {
      const s = supporterRank(b.supporter) - supporterRank(a.supporter);
      if (s !== 0) return s;
      const v = (b.verified ? 1 : 0) - (a.verified ? 1 : 0);
      if (v !== 0) return v;
      return a.name.localeCompare(b.name);
    });
    return sorted.slice(0, 8);
  }, [restaurants, city]);


  const hasActiveFilters = q.trim() !== "" || city !== "all" || cuisine !== "all" || sort !== "recommended";

  function resetAllFilters() {
    setQ("");
    setCity("all");
    setCuisine("all");
    setSort("recommended");
  }

  return (
    <section className="w-full max-w-6xl mx-auto px-6 pb-20">
      {/* Business CTA */}
      <div className="mb-4 bg-black/30 border border-yellow-600/20 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-100">{lang === "es" ? "¿Eres dueño de un restaurante?" : "Own a restaurant?"}</div>
          <div className="mt-1 text-xs text-gray-300">{lang === "es" ? "Crea tu perfil verificado y empieza a recibir clientes." : "Create a verified profile and start getting customers."}</div>
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

      {/* Filters */}
      <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search restaurants, cuisine, city…"
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
                <option key={c} value={c} className="bg-black">
                  {c === "all" ? "All Cities" : c}
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
                <option key={c} value={c} className="bg-black">
                  {c === "all" ? "All Cuisines" : c}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 outline-none focus:border-yellow-500/50"
            >
              <option value="recommended" className="bg-black">
                Recommended
              </option>
              <option value="supporters" className="bg-black">
                Supporters first
              </option>
              <option value="az" className="bg-black">
                A–Z
              </option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFavs((v) => !v)}
            className={[
              "px-3 py-2 rounded-xl text-sm font-semibold border transition",
              showFavs
                ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                : "bg-black/30 border-white/10 text-gray-100 hover:bg-black/40",
            ].join(" ")}
          >
            {lang === "es" ? "Guardados" : "Saved"}
          </button>
          {showFavs ? (
            <span className="text-xs text-gray-400">
              {lang === "es" ? "Mostrando tus favoritos" : "Showing your favorites"}
            </span>
          ) : null}
        </div>

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
                  className={
                    active
                      ? "px-3 py-1.5 rounded-full bg-yellow-500/15 border border-yellow-500/40 text-yellow-200 text-sm"
                      : "px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100 text-sm"
                  }
                >
                  {c}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Active filter chips */}
        {hasAny && hasActiveFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {q.trim() !== "" ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                title="Clear search"
              >
                Search: “{q.trim()}” ✕
              </button>
            ) : null}
            {city !== "all" ? (
              <button
                type="button"
                onClick={() => setCity("all")}
                className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                title="Clear city"
              >
                City: {city} ✕
              </button>
            ) : null}
            {cuisine !== "all" ? (
              <button
                type="button"
                onClick={() => setCuisine("all")}
                className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                title="Clear cuisine"
              >
                Cuisine: {cuisine} ✕
              </button>
            ) : null}
            {sort !== "recommended" ? (
              <button
                type="button"
                onClick={() => setSort("recommended")}
                className="text-sm px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                title="Reset sort"
              >
                Sort: {sort === "az" ? "A–Z" : "Supporters first"} ✕
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between text-sm text-gray-300">
          <div>
            {hasAny ? (
              <span>
                Showing <span className="text-gray-100">{filtered.length}</span> of{" "}
                <span className="text-gray-100">{restaurants.length}</span>
              </span>
            ) : (
              <span>{lang === "es" ? "Listo para tu primer restaurante." : "Ready for your first restaurant."}</span>
            )}
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
          >
            Reset
          </button>
        </div>
      </div>


      {hasAny && topPicks.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-100">
              {city !== "all" ? `Top picks in ${city}` : "Top picks nearby"}
            </div>
            <div className="text-xs text-gray-400">Tap a card for details</div>
          </div>

          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {topPicks.map((r) => (
              <Link
                key={r.id}
                href={restaurantHref({ id: r.id, name: r.name })}
                className="min-w-[240px] bg-black/30 border border-yellow-600/20 rounded-2xl p-4 hover:bg-white/5 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-gray-100">{r.name}</div>
                    <div className="mt-1 text-xs text-gray-300">{[r.cuisine, r.city].filter(Boolean).join(" • ")}</div>
                  </div>
                  {r.supporter ? (
                    <span className="shrink-0 text-[11px] px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                      {r.supporter}
                    </span>
                  ) : null}
                </div>

                {r.address ? <div className="mt-2 text-xs text-gray-300 line-clamp-2">{r.address}</div> : null}

                <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-300">
                  {r.price ? <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">{r.price}</span> : null}
                  {r.verified ? <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10">✅ Verified</span> : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Empty state */}
      {!hasAny ? (
        <div className="mt-8 bg-black/30 border border-yellow-600/20 rounded-2xl p-6 md:p-8 text-center">
          <div className="text-2xl md:text-3xl font-semibold text-yellow-300">Restaurants are launching.</div>
          <div className="mt-2 text-gray-300 max-w-2xl mx-auto">
            This page ships placeholder-safe — we don’t publish fake businesses. As restaurants join, you’ll see
            verified profiles, real contact info, and community-trust signals.
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/clasificados?lang=es"
              className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
            >
              Explore Clasificados
            </Link>
            <a
              href="mailto:chuy@leonixmedia.com?subject=Add%20my%20restaurant%20to%20LEONIX"
              className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-100 hover:bg-white/10"
            >
              Add my restaurant
            </a>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 bg-black/30 border border-yellow-600/20 rounded-2xl p-6 md:p-8 text-center">
          <div className="text-2xl md:text-3xl font-semibold text-yellow-300">No matches</div>
          <div className="mt-2 text-gray-300">Try a broader search or reset filters.</div>
          <div className="mt-5">
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-5 py-3 rounded-xl bg-yellow-500 text-black font-semibold hover:bg-yellow-400"
            >
              Reset filters
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <article key={r.id} className="bg-black/30 border border-yellow-600/20 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={restaurantHref({ id: r.id, name: r.name })} className="text-lg font-semibold text-gray-100 hover:text-yellow-200">{r.name}</Link>
                  <div className="mt-1 text-sm text-gray-300">
                    {[r.cuisine, r.city].filter(Boolean).join(" • ")}
                  </div>
                  {r.verified ? <div className="mt-1 text-xs text-yellow-200">Verified</div> : null}
                </div>
                {r.supporter ? (
                  <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                    {r.supporter}
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    const ids = readFavs();
                    const next = ids.includes(r.id) ? ids.filter((x) => x !== r.id) : [...ids, r.id];
                    writeFavs(next);
                    setFavIds(next);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("leonix:favorites", { detail: { ids: next } }));
                    }
                  }}
                  aria-label={favSet.has(r.id) ? (lang === "es" ? "Quitar de guardados" : "Remove from saved") : (lang === "es" ? "Guardar" : "Save")}
                  className={[
                    "ml-2 inline-flex items-center justify-center h-10 w-10 rounded-xl border transition",
                    favSet.has(r.id)
                      ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-200"
                      : "bg-black/30 border-white/10 text-gray-200 hover:bg-black/40",
                  ].join(" ")}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill={favSet.has(r.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-7.5-4.7-9.6-9.1C.9 8.7 2.5 6 5.5 6c1.8 0 3 .9 3.7 1.8.7-.9 1.9-1.8 3.7-1.8 3 0 4.6 2.7 3.1 5.9C19.5 16.3 12 21 12 21z" />
                  </svg>
                </button>
              </div>

              {r.address ? <div className="mt-3 text-sm text-gray-300">{r.address}</div> : null}

              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {r.website ? (
                  <a
                    href={r.website}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                  >
                    {safeHost(r.website)}
                  </a>
                ) : null}
                {r.instagram ? (
                  <a
                    href={r.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                  >
                    Instagram
                  </a>
                ) : null}
                {r.facebook ? (
                  <a
                    href={r.facebook}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
                  >
                    Facebook
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {hasAny ? (
        <div className="mt-10 text-center text-xs text-gray-400">
          Verified restaurants will carry trust signals and clearer contact actions. No fake listings.
        </div>
      ) : null}
    </section>
  );
}