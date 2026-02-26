"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Restaurant } from "../../data/restaurants";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function safeHost(url: string) {
  try {
    const u = new URL(url);
    return u.host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function RestaurantsBrowser({ restaurants }: { restaurants: Restaurant[] }) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [cuisine, setCuisine] = useState("all");

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

  const filtered = useMemo(() => {
    const qq = normalize(q);
    return restaurants.filter((r) => {
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
  }, [restaurants, q, city, cuisine]);

  const hasAny = restaurants.length > 0;

  return (
    <section className="w-full max-w-6xl mx-auto px-6 pb-20">
      {/* Filters */}
      <div className="bg-black/30 border border-yellow-600/20 rounded-2xl p-4 md:p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search restaurants, cuisine, city…"
            className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-gray-100 placeholder:text-gray-400 outline-none focus:border-yellow-500/50"
          />
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

        <div className="mt-3 flex items-center justify-between text-sm text-gray-300">
          <div>
            {hasAny ? (
              <span>
                Showing <span className="text-gray-100">{filtered.length}</span> of{" "}
                <span className="text-gray-100">{restaurants.length}</span>
              </span>
            ) : (
              <span>Ready for your first restaurant.</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setQ("");
              setCity("all");
              setCuisine("all");
            }}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-100"
          >
            Reset
          </button>
        </div>
      </div>

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
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <article key={r.id} className="bg-black/30 border border-yellow-600/20 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-gray-100">{r.name}</div>
                  <div className="mt-1 text-sm text-gray-300">
                    {[r.cuisine, r.city].filter(Boolean).join(" • ")}
                  </div>
                </div>
                {r.supporter ? (
                  <span className="text-xs px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
                    {r.supporter}
                  </span>
                ) : null}
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
