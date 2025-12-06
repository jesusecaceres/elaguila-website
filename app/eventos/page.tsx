"use client";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageHero from "../components/PageHero";
import events from "../data/events";

export default function EventosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      title: "Eventos — El Águila en Vuelo",
      featured: "Eventos Destacados",
      counties: "Condados",
      categories: "Categorías",
      noResults: "No hay eventos disponibles.",
    },
    en: {
      title: "Events — El Águila en Vuelo",
      featured: "Featured Events",
      counties: "Counties",
      categories: "Categories",
      noResults: "No events available.",
    },
  };

  const L = t[lang];

  // Extract unique counties
  const counties = Array.from(new Set(events.map((e) => e.county)));

  // Categories (fixed)
  const categories = [
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

  // Read selected filters
  const activeCounty = searchParams.get("county") || "";
  const activeCategory = searchParams.get("category") || "";

  // Update URL filters
  const updateFilter = (type: "county" | "category", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(type) === value) {
      params.delete(type);
    } else {
      params.set(type, value);
    }
    router.push(`/eventos?${params.toString()}`);
  };

  // Filter events based on URL
  const filteredEvents = events.filter((event) => {
    const matchCounty = activeCounty ? event.county === activeCounty : true;
    const matchCategory = activeCategory
      ? event.category === activeCategory
      : true;
    return matchCounty && matchCategory;
  });

  const featuredEvents = events.filter((event) => event.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-black text-white pb-32">

      {/* 🔥 UNIVERSAL HERO */}
      <PageHero title={L.title} />

      {/* FEATURED EVENTS */}
      <section className="w-full max-w-5xl mx-auto mt-10 px-6">
        <h2 className="text-3xl font-bold text-[#FFD700] mb-6">
          {L.featured}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white/10 rounded-xl overflow-hidden shadow-lg border border-white/10"
            >
              <Image
                src={event.image}
                alt={event.title}
                width={600}
                height={400}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold text-[#FFD700]">{event.title}</h3>
                <p className="text-white/80">{event.date}</p>
                <p className="text-white/80">{event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COUNTY FILTERS */}
      <section className="w-full max-w-5xl mx-auto mt-14 px-6">
        <h3 className="text-2xl font-bold text-[#FFD700] mb-4">{L.counties}</h3>

        <div className="flex flex-wrap gap-3">
          {counties.map((county) => (
            <button
              key={county}
              onClick={() => updateFilter("county", county)}
              className={`px-5 py-2 rounded-full border transition-all
                ${
                  activeCounty === county
                    ? "bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] text-black border-none"
                    : "border-white text-white hover:bg-white/10"
                }
              `}
            >
              {county}
            </button>
          ))}
        </div>
      </section>

      {/* CATEGORY FILTERS */}
      <section className="w-full max-w-5xl mx-auto mt-10 px-6">
        <h3 className="text-2xl font-bold text-[#FFD700] mb-4">{L.categories}</h3>

        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateFilter("category", cat)}
              className={`px-5 py-2 rounded-full border transition-all
                ${
                  activeCategory === cat
                    ? "bg-gradient-to-r from-[#FFD700] via-[#FFC107] to-[#B8860B] text-black border-none"
                    : "border-white text-white hover:bg-white/10"
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* EVENT GRID */}
      <section className="w-full max-w-5xl mx-auto mt-14 px-6">
        {filteredEvents.length === 0 ? (
          <p className="text-white/60 text-lg">{L.noResults}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white/10 rounded-xl overflow-hidden shadow-lg border border-white/10"
              >
                <Image
                  src={event.image}
                  alt={event.title}
                  width={600}
                  height={400}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold text-[#FFD700]">{event.title}</h3>
                  <p className="text-white/80">{event.date}</p>
                  <p className="text-white/80">{event.location}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
