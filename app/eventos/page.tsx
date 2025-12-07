"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { manualEvents } from "../data/manual-events";
import { communityEvents } from "../data/events";

// -----------------------------
// LANGUAGE STRINGS
// -----------------------------
const translations = {
  es: {
    title: "Eventos — El Águila en Vuelo",
    alasDeOro: "Alas de Oro",
    community: "Eventos Comunitarios",
    explore: "Eventos Cerca de Ti",
    submit: "Enviar tu evento",
    counties: "Condados",
    categories: "Categorías",
    loading: "Cargando eventos...",
  },
  en: {
    title: "Events — El Águila en Vuelo",
    alasDeOro: "Golden Wings",
    community: "Community Events",
    explore: "Events Near You",
    submit: "Submit Your Event",
    counties: "Counties",
    categories: "Categories",
    loading: "Loading events...",
  },
};

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

const countyOptions = [
  "Santa Clara",
  "Alameda",
  "San Mateo",
  "San Francisco",
  "Contra Costa",
  "Marin",
  "Napa",
  "Sonoma",
  "Stanislaus",
  "San Joaquin",
  "Merced",
  "Fresno",
  "Madera",
  "Santa Cruz",
  "Monterey",
  "San Benito",
];

// -----------------------------
// CINEMATIC CAROUSEL
// -----------------------------
function getLocalizedText(value: any, lang: "es" | "en") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value["es"] || value["en"] || "";
}

function CinematicCarousel({ items, lang }: { items: any[]; lang: "es" | "en" }) {
  if (!items || items.length === 0)
    return (
      <p className="text-center text-white/70 mt-4">
        {lang === "es" ? "No hay eventos disponibles." : "No events available."}
      </p>
    );

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-8 py-10 px-1">
        {items.map((ev) => {
          const title = getLocalizedText(ev.title, lang);
          const desc = getLocalizedText(ev.description, lang);

          return (
            <div
              key={ev.id}
              className="min-w-[280px] max-w-[280px] md:min-w-[320px] md:max-w-[320px] 
              bg-black/50 border border-white/15 rounded-2xl shadow-2xl overflow-hidden 
              backdrop-blur-md transform hover:-translate-y-1 hover:scale-[1.02] 
              transition-all duration-300"
            >
              <div className="relative w-full h-[180px] md:h-[200px]">
                <Image
                  src={ev.image}
                  alt={title}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-4 flex flex-col gap-2">
                <h3 className="font-semibold text-lg md:text-xl text-white line-clamp-2">
                  {title}
                </h3>

                {desc && (
                  <p className="text-sm text-white/75 line-clamp-3">{desc}</p>
                )}

                {ev.sourceUrl && (
                  <a
                    href={ev.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 text-sm font-semibold text-yellow-300 underline underline-offset-2 hover:text-yellow-200"
                  >
                    {lang === "es" ? "Ver evento" : "View event"}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------
// PAGE COMPONENT
// -----------------------------
export default function EventosPage() {
  const params = useSearchParams();
  const lang: "es" | "en" = params.get("lang") === "en" ? "en" : "es";
  const t = translations[lang];

  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("");

  useEffect(() => {
    async function loadLiveEvents() {
      try {
        const res = await fetch("/api/events/live", { cache: "no-store" });
        const data = await res.json();
        setLiveEvents(data || []);
      } catch (err) {
        setLiveEvents([]);
      } finally {
        setLoadingLive(false);
      }
    }
    loadLiveEvents();
  }, []);

  const filteredLive = liveEvents.filter((ev) => {
    const matchCategory = selectedCategory ? ev.category === selectedCategory : true;
    const matchCounty = selectedCounty ? ev.county === selectedCounty : true;
    return matchCategory && matchCounty;
  });

  return (
    <div className="text-white relative w-full">

      {/* HERO — EXACTLY LIKE ABOUT PAGE */}
      <section className="w-full bg-gradient-to-b from-black via-[#2b210c] to-[#3a2c0f] py-24 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <Image
            src="/logo.png"
            alt="El Águila Logo"
            width={260}
            height={260}
            className="mx-auto drop-shadow-[0_0_35px_rgba(255,215,0,0.9)]"
          />

          <h1 className="mt-8 text-5xl md:text-6xl font-bold text-yellow-400">
            {t.title}
          </h1>
        </div>
      </section>

      {/* SECTION A: ALAS DE ORO */}
      <section className="max-w-6xl mx-auto px-4 mt-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-yellow-300">{t.alasDeOro}</h2>

          <div className="mt-6 flex justify-center">
            <div className="relative w-full max-w-3xl h-28">
              <Image
                src="/branding/alas-de-oro.png"
                alt="Alas de Oro Divider"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <CinematicCarousel items={manualEvents} lang={lang} />
      </section>

      {/* SECTION B: COMMUNITY EVENTS */}
      <section className="max-w-6xl mx-auto px-4 mt-20">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-yellow-300">{t.community}</h2>

          <div className="mt-6 flex justify-center">
            <div className="relative w-full max-w-3xl h-28">
              <Image
                src="/branding/alas-de-oro.png"
                alt="Eventos Comunitarios Divider"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <a
            href="mailto:info@elaguilamagazine.com"
            className="inline-block bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-600 text-black font-bold py-3 px-10 rounded-full shadow-xl hover:scale-105 transition-all"
          >
            {t.submit}
          </a>
        </div>

        <CinematicCarousel items={communityEvents} lang={lang} />
      </section>

      {/* SECTION C: EXPLORE / LIVE EVENTS */}
      <section className="max-w-6xl mx-auto px-4 mt-20 mb-32">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-yellow-300">{t.explore}</h2>
        </div>

        {/* FILTERS */}
        <div className="mt-10 flex flex-col md:flex-row justify-center items-center gap-10">

          <div className="flex flex-col text-white">
            <label className="text-lg font-semibold mb-2">{t.categories}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-black p-3 rounded-xl min-w-[220px]"
            >
              <option value="">{lang === "es" ? "Todas" : "All"}</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col text-white">
            <label className="text-lg font-semibold mb-2">{t.counties}</label>
            <select
              value={selectedCounty}
              onChange={(e) => setSelectedCounty(e.target.value)}
              className="text-black p-3 rounded-xl min-w-[220px]"
            >
              <option value="">{lang === "es" ? "Todos" : "All"}</option>
              {countyOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

        </div>

        <div className="mt-12">
          {loadingLive ? (
            <p className="text-center text-white/80">{t.loading}</p>
          ) : (
            <CinematicCarousel items={filteredLive} lang={lang} />
          )}
        </div>
      </section>
    </div>
  );
}
