"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { communityEvents } from "../data/events";
import { manualEvents } from "../data/manual-events";

// -----------------------------
// LANGUAGE HANDLER
// -----------------------------
const translations = {
  es: {
    title: "Eventos",
    featured: "Alas de Oro — Eventos Destacados",
    community: "Eventos Comunitarios",
    explore: "Explorar Eventos en California",
    submit: "Enviar tu evento",
    counties: "Condados",
    categories: "Categorías",
  },
  en: {
    title: "Events",
    featured: "Golden Wings — Featured Events",
    community: "Community Events",
    explore: "Explore California Events",
    submit: "Submit Your Event",
    counties: "Counties",
    categories: "Categories",
  },
};

const countyOptions = [
  "Santa Clara",
  "San Mateo",
  "San Francisco",
  "Alameda",
  "Contra Costa",
  "San Joaquin",
  "Stanislaus",
  "Merced",
  "Monterey",
  "San Benito",
  "Santa Cruz",
];

const categoryOptions = [
  "Singles",
  "Youth/Kids",
  "Family",
  "Couples",
  "Nightlife",
  "Food",
  "Music",
  "Community",
  "Holiday",
  "Sports",
];

// -----------------------------
// CINEMATIC CAROUSEL
// -----------------------------
function CinematicCarousel({ items, lang }: any) {
  return (
    <div className="w-full overflow-x-auto flex gap-8 py-10 scrollbar-hide">
      {items.map((ev: any) => (
        <div
          key={ev.id}
          className="min-w-[300px] max-w-[300px] bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 overflow-hidden"
        >
          <Image
            src={ev.image}
            alt={ev.title}
            width={300}
            height={200}
            className="w-full h-[200px] object-cover"
          />

          <div className="p-4 text-white">
            <h3 className="font-bold text-lg mb-2">
              {ev.title?.[lang] || ev.title}
            </h3>

            <p className="text-sm opacity-80">
              {ev.description?.[lang] || ev.description}
            </p>

            {ev.sourceUrl && (
              <a
                href={ev.sourceUrl}
                target="_blank"
                className="text-yellow-300 text-sm underline block mt-2"
              >
                {lang === "es" ? "Ver evento" : "View event"}
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// -----------------------------
// MAIN PAGE
// -----------------------------
export default function EventsPage() {
  const params = useSearchParams();
  const lang = params.get("lang") === "en" ? "en" : "es";
  const t = translations[lang];

  const [selectedCounty, setSelectedCounty] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch live RSS/API events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events/rss", { cache: "no-store" });
        const data = await res.json();
        setLiveEvents(data);
      } catch (err) {
        console.error("Error loading live events:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  function filterEvents(events: any[]) {
    return events.filter((ev) => {
      const countyMatch = selectedCounty
        ? ev.county === selectedCounty
        : true;
      const catMatch = selectedCategory
        ? ev.category === selectedCategory
        : true;
      return countyMatch && catMatch;
    });
  }

  return (
    <div className="text-white relative">

      {/* HERO */}
      <div className="w-full flex flex-col items-center justify-center pt-32 pb-16 text-center">
        <Image
          src="/logo.png"
          alt="El Águila Logo"
          width={200}
          height={200}
          className="drop-shadow-[0_0_25px_rgba(255,215,0,0.8)]"
        />

        <h1 className="mt-6 text-6xl font-bold bg-gradient-to-b from-yellow-300 to-yellow-600 text-transparent bg-clip-text drop-shadow-lg">
          {t.title}
        </h1>
      </div>

      {/* FILTERS */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-6 justify-center">

          {/* County Filter */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">{t.counties}</label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="text-black p-2 rounded-lg"
            >
              <option value="">All</option>
              {countyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex flex-col">
            <label className="font-semibold mb-1">{t.categories}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-black p-2 rounded-lg"
            >
              <option value="">All</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="text-center mt-10">
          <a
            href="mailto:info@elaguilamagazine.com"
            className="inline-block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold py-4 px-10 rounded-full shadow-xl hover:scale-105 transition-all"
          >
            {t.submit}
          </a>
        </div>
      </div>

      {/* FEATURED / ALAS DE ORO */}
      <section className="mt-20 px-6">
        <h2 className="text-4xl font-bold mb-4">{t.featured}</h2>
        <CinematicCarousel
          items={filterEvents(manualEvents)}
          lang={lang}
        />
      </section>

      {/* COMMUNITY EVENTS */}
      <section className="mt-20 px-6">
        <h2 className="text-4xl font-bold mb-4">{t.community}</h2>
        <CinematicCarousel
          items={filterEvents(communityEvents)}
          lang={lang}
        />
      </section>

      {/* LIVE EVENTS */}
      <section className="mt-20 px-6 mb-32">
        <h2 className="text-4xl font-bold mb-4">{t.explore}</h2>

        {loading ? (
          <p className="text-white text-lg opacity-80">
            {lang === "es" ? "Cargando eventos..." : "Loading events..."}
          </p>
        ) : (
          <CinematicCarousel
            items={filterEvents(liveEvents)}
            lang={lang}
          />
        )}
      </section>
    </div>
  );
}
