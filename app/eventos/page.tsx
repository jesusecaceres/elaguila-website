"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";

import PageHero from "../components/PageHero";
import manualEvents from "../data/manual-events";
import getRSSEvents from "../data/rss-events";

export default function EventosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  // ----------------------------
  // UI TRANSLATIONS
  // ----------------------------
  const t = {
    title: lang === "en" ? "Events in Your Community" : "Eventos en tu Comunidad",
    featured: lang === "en" ? "Featured Events" : "Eventos Destacados",
    allEvents: lang === "en" ? "All Events" : "Todos los Eventos",
    countyFilter: lang === "en" ? "County" : "Condado",
    categoryFilter: lang === "en" ? "Category" : "Categoría",
    noEvents: lang === "en" ? "No events available" : "No hay eventos disponibles",
  };

  // ----------------------------
  // FILTER OPTIONS
  // ----------------------------
  const counties = [
    "Santa Clara",
    "Alameda",
    "San Francisco",
    "California",
    "Contra Costa",
  ];

  const categories = [
    "Family",
    "Music",
    "Food",
    "Community",
    "Holiday",
    "Sports",
    "Nightlife",
    "Kids",
    "General",
  ];

  const [rssEvents, setRssEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-refresh every 3 hours
  useEffect(() => {
    async function loadRSS() {
      setLoading(true);
      const data = await getRSSEvents();
      setRssEvents(data);
      setLoading(false);
    }

    loadRSS();
    const interval = setInterval(loadRSS, 3 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Merge manual + RSS → manual events always appear FIRST
  const allEvents = [...manualEvents, ...rssEvents];

  // Filter state
  const [county, setCounty] = useState("All");
  const [category, setCategory] = useState("All");

  const filteredEvents = allEvents.filter((ev) => {
    const matchCounty = county === "All" || ev.county === county;
    const matchCategory = category === "All" || ev.category === category;
    return matchCounty && matchCategory;
  });

  return (
    <div className="min-h-screen text-white">

      {/* ---------------------- */}
      {/* HERO */}
      {/* ---------------------- */}
      <PageHero title={t.title} />

      {/* ---------------------- */}
      {/* FEATURED EVENTS */}
      {/* ---------------------- */}
      <section className="max-w-6xl mx-auto px-6 mt-10">
        <h2 className="text-3xl font-bold text-yellow-400 mb-5">
          {t.featured}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {manualEvents.length === 0 && (
            <p className="text-gray-400">{t.noEvents}</p>
          )}

          {manualEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-black/40 border border-yellow-700 rounded-xl overflow-hidden shadow-lg"
            >
              <Image
                src={ev.image || "/event-fallback.png"}
                alt={ev.title}
                width={600}
                height={400}
                className="w-full h-56 object-cover"
              />

              <div className="p-5">
                <h3 className="text-xl font-bold text-yellow-400 mb-2">
                  {ev.title}
                </h3>

                <p className="text-white text-sm mb-3">
                  {ev.description}
                </p>

                <p className="text-gray-400 text-xs mb-3">
                  {ev.date}
                </p>

                <a
                  href={ev.link}
                  target="_blank"
                  className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition"
                >
                  {lang === "en" ? "View Event" : "Ver Evento"}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------- */}
      {/* FILTERS */}
      {/* ---------------------- */}
      <section className="max-w-6xl mx-auto px-6 mt-14">
        <div className="flex flex-col md:flex-row gap-6">

          {/* County */}
          <div className="flex flex-col w-full">
            <label className="text-yellow-400 font-bold mb-1">
              {t.countyFilter}
            </label>
            <select
              className="bg-black/40 border border-yellow-700 px-3 py-2 rounded-lg"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
            >
              <option value="All">{lang === "en" ? "All Counties" : "Todos los Condados"}</option>
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col w-full">
            <label className="text-yellow-400 font-bold mb-1">
              {t.categoryFilter}
            </label>
            <select
              className="bg-black/40 border border-yellow-700 px-3 py-2 rounded-lg"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="All">{lang === "en" ? "All Categories" : "Todas las Categorías"}</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* ---------------------- */}
      {/* ALL EVENTS GRID */}
      {/* ---------------------- */}
      <section className="max-w-6xl mx-auto px-6 mt-14 mb-20">
        <h2 className="text-3xl font-bold text-yellow-400 mb-5">
          {t.allEvents}
        </h2>

        {loading ? (
          <p className="text-gray-400">Loading events...</p>
        ) : filteredEvents.length === 0 ? (
          <p className="text-gray-400">{t.noEvents}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {filteredEvents.map((ev) => (
              <div
                key={ev.id}
                className="bg-black/40 border border-yellow-700 rounded-xl overflow-hidden shadow-lg"
              >
                <Image
                  src={ev.image || "/event-fallback.png"}
                  alt={ev.title}
                  width={600}
                  height={400}
                  className="w-full h-56 object-cover"
                />

                <div className="p-5">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">
                    {ev.title}
                  </h3>

                  <p className="text-white text-sm mb-3">
                    {ev.description}
                  </p>

                  <p className="text-gray-400 text-xs mb-3">
                    {ev.date}
                  </p>

                  <a
                    href={ev.link}
                    target="_blank"
                    className="inline-block bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition"
                  >
                    {lang === "en" ? "View Event" : "Ver Evento"}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
