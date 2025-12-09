"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { CITY_MAP, CitySlug } from "../api/events/helpers/cityMap";
import { FinalEvent, EventCategory } from "../api/events/helpers/types";

// ------------------------------------------------------------
// UI TRANSLATIONS
// ------------------------------------------------------------
const ui = {
  es: {
    title: "Eventos",
    city: "Ciudad",
    category: "Categoría",
    noEvents: "No hay eventos disponibles para esta ciudad.",
    loading: "Cargando eventos...",
  },
  en: {
    title: "Events",
    city: "City",
    category: "Category",
    noEvents: "No events available for this city.",
    loading: "Loading events...",
  },
};

// ------------------------------------------------------------
// CATEGORY OPTIONS
// ------------------------------------------------------------
const categoryOptions: { value: EventCategory | ""; label: string; labelEs: string }[] = [
  { value: "", label: "All Categories", labelEs: "Todas las categorías" },
  { value: "music", label: "Music", labelEs: "Música" },
  { value: "food", label: "Food", labelEs: "Comida" },
  { value: "family", label: "Family", labelEs: "Familia" },
  { value: "youth", label: "Youth/Kids", labelEs: "Juventud/Niños" },
  { value: "nightlife", label: "Nightlife", labelEs: "Vida Nocturna" },
  { value: "holiday", label: "Holiday", labelEs: "Festividades" },
  { value: "sports", label: "Sports", labelEs: "Deportes" },
  { value: "community", label: "Community", labelEs: "Comunidad" },
  { value: "singles", label: "Singles", labelEs: "Solteros" },
  { value: "couples", label: "Couples", labelEs: "Parejas" },
];

// ------------------------------------------------------------
// MAIN PAGE COMPONENT
// ------------------------------------------------------------
export default function EventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  // Initial values from URL
  const initialCity = (searchParams.get("city") as CitySlug) || "sanjose";
  const initialCategory = (searchParams.get("category") as EventCategory | "") || "";

  const [city, setCity] = useState<CitySlug>(initialCity);
  const [category, setCategory] = useState<EventCategory | "">(initialCategory);
  const [events, setEvents] = useState<FinalEvent[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  // ------------------------------------------------------------
  // FETCH EVENTS WHEN FILTER CHANGES
  // ------------------------------------------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);
      setEvents(null);

      const params = new URLSearchParams();
      params.set("city", city);
      if (category) params.set("category", category);

      const res = await fetch(`/api/events/core?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.events?.length > 0) {
        setEvents(data.events);
        setMessage("");
      } else {
        setEvents([]);
        setMessage(ui[lang].noEvents);
      }

      setLoading(false);
    }

    load();
  }, [city, category, lang]);

  // ------------------------------------------------------------
  // UPDATE URL WHEN FILTERS CHANGE
  // ------------------------------------------------------------
  function updateUrl(newCity: CitySlug, newCategory: EventCategory | "") {
    const params = new URLSearchParams();
    params.set("city", newCity);
    if (newCategory) params.set("category", newCategory);
    params.set("lang", lang);

    router.replace(`/eventos?${params.toString()}`);
  }

  function handleCityChange(e: any) {
    const slug = e.target.value as CitySlug;
    setCity(slug);
    updateUrl(slug, category);
  }

  function handleCategoryChange(e: any) {
    const val = e.target.value as EventCategory | "";
    setCategory(val);
    updateUrl(city, val);
  }

  // ------------------------------------------------------------
  // RENDER PAGE
  // ------------------------------------------------------------
  return (
    <div className="min-h-screen w-full text-white bg-black">

      {/* HERO SECTION */}
      <div className="relative w-full flex flex-col items-center justify-center py-32 text-center">
        <Image
          src="/logo.png"
          alt="El Águila Logo"
          width={180}
          height={180}
          className="drop-shadow-[0_0_25px_rgba(255,215,0,0.8)] mb-6"
        />

        <h1 className="text-6xl md:text-7xl font-bold text-[#FFD700] tracking-wide">
          {ui[lang].title}
        </h1>
      </div>

      {/* FILTER BAR */}
      <div className="w-full max-w-5xl mx-auto mt-6 px-4 flex flex-col md:flex-row gap-4">

        {/* CITY SELECT */}
        <div className="flex-1">
          <label className="block mb-2 text-sm text-white/80">
            {ui[lang].city}
          </label>

          <select
            value={city}
            onChange={handleCityChange}
            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white"
          >
            {Object.entries(CITY_MAP).map(([slug, data]) => (
              <option key={slug} value={slug}>
                {data.query}
              </option>
            ))}
          </select>
        </div>

        {/* CATEGORY SELECT */}
        <div className="flex-1">
          <label className="block mb-2 text-sm text-white/80">
            {ui[lang].category}
          </label>

          <select
            value={category}
            onChange={handleCategoryChange}
            className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white"
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {lang === "es" ? opt.labelEs : opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-center text-white/60 mt-24 text-xl">
          {ui[lang].loading}
        </p>
      )}

      {/* NO EVENTS */}
      {!loading && events?.length === 0 && (
        <p className="text-center text-white/60 mt-24 text-xl">{message}</p>
      )}

      {/* EVENTS GRID */}
      {!loading && events && events.length > 0 && (
        <div className="w-full max-w-6xl mx-auto mt-12 px-4 pb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((ev) => (
            <a
              key={ev.id}
              href={ev.url}
              target="_blank"
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl overflow-hidden hover:scale-[1.03] transition-all duration-300"
            >
              <img
                src={ev.image}
                alt={ev.title}
                className="w-full h-56 object-cover"
              />

              <div className="p-5">
                <h3 className="text-xl font-semibold text-[#FFD700] leading-tight mb-2">
                  {ev.title}
                </h3>

                <p className="text-white/70 text-sm line-clamp-3 mb-3">{ev.description}</p>

                <p className="text-white/50 text-xs">
                  {CITY_MAP[city].query} • {ev.source.toUpperCase()}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
