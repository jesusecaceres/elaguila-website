"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";

// Phase 2 Data
import { manualFeaturedEvents } from "@/app/data/manual-events";
import { communityEvents } from "@/app/data/community-events";

// Phase 1 Data
import { counties, DEFAULT_CITY } from "@/app/api/events/helpers/cityMap";

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------
export default function EventosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const labels = {
    pageTitle: lang === "en" ? "Events" : "Eventos",
    featured: lang === "en" ? "Golden Wings" : "Alas de Oro",
    community: lang === "en" ? "Community Events" : "Eventos de la Comunidad",
    regional: lang === "en" ? "Regional Events" : "Eventos Regionales",
    countyLabel: lang === "en" ? "Select County" : "Seleccionar Condado",
    cityLabel: lang === "en" ? "Select City" : "Seleccionar Ciudad",
    noEvents: lang === "en" ? "No events found." : "No se encontraron eventos.",
    loadMore: lang === "en" ? "Load More" : "Cargar Más",
    viewEvent: lang === "en" ? "View Event" : "Ver Evento",
  };

  // ------------------------------------------------------------
  // Language Toggle
  // ------------------------------------------------------------
  const toggleLang = (newLang: "es" | "en") => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("lang", newLang);
    router.push(`/eventos?${params.toString()}`);
  };

  // ------------------------------------------------------------
  // Phase 1 — API Events
  // ------------------------------------------------------------
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const [apiEvents, setApiEvents] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [loading, setLoading] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState("");

  const filteredCities = selectedCounty
    ? counties.find((c) => c.county === selectedCounty)?.cities || []
    : [];

  // 🔑 UPDATED: explicit flag controls Eventbrite
  const fetchApiEvents = async (slug: string, explicit = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ city: slug });

      if (explicit) {
        params.set("includeEventbrite", "true");
      }

      const res = await fetch(`/api/events/core?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();
      setApiEvents(data?.events || []);
    } catch {
      setApiEvents([]);
    }
    setLoading(false);
  };

  // Default load (Ticketmaster only)
  useEffect(() => {
    fetchApiEvents(selectedCity, false);
  }, [selectedCity]);

  useEffect(() => {
    setVisibleCount(9);
  }, [selectedCity]);

  // ------------------------------------------------------------
  // Phase 2 — RSS Events
  // ------------------------------------------------------------
  const [rssEvents, setRssEvents] = useState<any[]>([]);

  const fetchRss = async () => {
    try {
      const res = await fetch(`/api/events/rss`, { cache: "no-store" });
      const data = await res.json();
      setRssEvents(data?.events || []);
    } catch {
      setRssEvents([]);
    }
  };

  useEffect(() => {
    fetchRss();
  }, []);

  // ------------------------------------------------------------
  // HERO
  // ------------------------------------------------------------
  const hero = (
    <div className="flex flex-col items-center pt-40 pb-20 text-center">
      <Image
        src="/logo.png"
        alt="El Águila Logo"
        width={160}
        height={160}
        className="mb-6 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]"
      />
      <h1 className="text-5xl md:text-6xl font-bold text-[#FFD700] tracking-wide">
        {labels.pageTitle}
      </h1>

      <div className="flex gap-6 mt-6 text-lg">
        <button
          onClick={() => toggleLang("es")}
          className={`px-4 py-2 rounded ${
            lang === "es"
              ? "bg-[#FFD700] text-black font-bold"
              : "bg-black bg-opacity-40"
          }`}
        >
          ES
        </button>
        <button
          onClick={() => toggleLang("en")}
          className={`px-4 py-2 rounded ${
            lang === "en"
              ? "bg-[#FFD700] text-black font-bold"
              : "bg-black bg-opacity-40"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );

  // ------------------------------------------------------------
  // Divider
  // ------------------------------------------------------------
  const Divider = () => (
    <div className="w-1/2 mx-auto h-[1px] bg-[#FFD700]/40 my-14" />
  );

  // ------------------------------------------------------------
  // Carousel (unchanged)
  // ------------------------------------------------------------
  const Carousel = ({
    title,
    icon,
    events,
  }: {
    title: string;
    icon?: string;
    events: any[];
  }) => {
    if (!events || events.length === 0) return null;
    const [index, setIndex] = useState(0);

    const prev = () =>
      setIndex((i) => (i === 0 ? events.length - 1 : i - 1));
    const next = () =>
      setIndex((i) => (i === events.length - 1 ? 0 : i + 1));

    return (
      <div className="w-full max-w-6xl mx-auto px-6 mb-20">
        <div className="flex flex-col items-center mb-10">
          {icon && (
            <Image
              src={icon}
              alt={title}
              width={150}
              height={150}
              className="mb-4 drop-shadow-[0_0_18px_rgba(255,215,0,0.7)]"
            />
          )}
          <h2 className="text-4xl font-bold text-[#FFD700] text-center">
            {title}
          </h2>
        </div>

        <div className="relative flex items-center">
          <button
            onClick={prev}
            className="absolute left-0 z-20 bg-black/40 p-4 rounded-full"
          >
            ❮
          </button>

          <div className="w-full overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {events.map((event, idx) => (
                <div key={event.id || idx} className="min-w-full flex justify-center">
                  <div className="bg-black/50 rounded-2xl p-6 w-80 border border-[#FFD700]/30">
                    <div className="w-full h-64 relative rounded-xl overflow-hidden mb-4">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-sm opacity-80 mb-2">
                      {new Date(event.startDate).toLocaleString(
                        lang === "en" ? "en-US" : "es-ES",
                        { dateStyle: "full", timeStyle: "short" }
                      )}
                    </p>
                    <p className="text-sm opacity-70 mb-4">{event.venue}</p>
                    <a
                      href={event.url}
                      target="_blank"
                      className="inline-block px-4 py-2 rounded bg-[#FFD700] text-black font-bold"
                    >
                      {labels.viewEvent}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={next}
            className="absolute right-0 z-20 bg-black/40 p-4 rounded-full"
          >
            ❯
          </button>
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="relative w-full min-h-screen text-white animate-fadein">
      {hero}

      <div className="parallax-sec">
        <Carousel
          title={labels.featured}
          icon={
            lang === "en"
              ? "/branding/golden-wings.png"
              : "/branding/alas-de-oro.png"
          }
          events={manualFeaturedEvents}
        />
      </div>

      <Divider />

      <div className="parallax-sec">
        <Carousel title={labels.community} events={communityEvents} />
      </div>

      <Divider />

      <div className="parallax-sec">
        <Carousel title={labels.regional} events={rssEvents} />
      </div>

      {/* Filters */}
      <div className="max-w-5xl mx-auto px-6 pb-12 mt-16">
        <label className="block mb-2 text-lg font-semibold">
          {labels.countyLabel}
        </label>
        <select
          className="w-full text-black p-3 rounded mb-6"
          value={selectedCounty}
          onChange={(e) => {
            setSelectedCounty(e.target.value);
            setSelectedCity("");
          }}
        >
          <option value="">
            {lang === "en" ? "Choose a county" : "Elige un condado"}
          </option>
          {counties.map((c) => (
            <option key={c.county} value={c.county}>
              {c.county}
            </option>
          ))}
        </select>

        {selectedCounty && (
          <>
            <label className="block mb-2 text-lg font-semibold">
              {labels.cityLabel}
            </label>
            <select
              className="w-full text-black p-3 rounded"
              value={selectedCity}
              onChange={(e) => {
                const city = e.target.value;
                setSelectedCity(city);
                fetchApiEvents(city, true); // 👈 explicit Eventbrite trigger
              }}
            >
              <option value="">
                {lang === "en" ? "Choose a city" : "Elige una ciudad"}
              </option>
              {filteredCities.map((city) => (
                <option key={city.slug} value={city.slug}>
                  {city.name}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 text-xl font-semibold">
          {lang === "en" ? "Loading events..." : "Cargando eventos..."}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 pb-32">
          {apiEvents.length === 0 ? (
            <p className="text-center text-xl py-20">{labels.noEvents}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {apiEvents.slice(0, visibleCount).map((event: any) => (
                  <div
                    key={event.id}
                    className="bg-black/40 rounded-2xl p-5 border border-[#FFD700]/40"
                  >
                    <div className="w-full h-48 relative mb-4 rounded overflow-hidden">
                      <Image
                        src={event.image || "/default-event.png"}
                        alt={event.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-sm opacity-80 mb-2">
                      {new Date(event.startDate).toLocaleString(
                        lang === "en" ? "en-US" : "es-ES",
                        { dateStyle: "full", timeStyle: "short" }
                      )}
                    </p>
                    <p className="text-sm opacity-70 mb-4">{event.venue}</p>
                    <a
                      href={event.url}
                      target="_blank"
                      className="inline-block px-4 py-2 rounded bg-[#FFD700] text-black font-bold"
                    >
                      {labels.viewEvent}
                    </a>
                  </div>
                ))}
              </div>

              {visibleCount < apiEvents.length && (
                <div className="text-center mt-10">
                  <button
                    onClick={() => setVisibleCount((v) => v + 9)}
                    className="px-8 py-4 bg-[#FFD700] text-black font-bold rounded-xl"
                  >
                    {labels.loadMore}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
