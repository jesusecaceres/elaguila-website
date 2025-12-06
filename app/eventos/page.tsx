"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageHero from "../components/PageHero";
import { events } from "../data/events";

export default function EventosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      title: "Eventos — El Águila en Vuelo",
      featured: "Eventos Destacados",
      allEvents: "Todos los Eventos",
      countyFilter: "Filtrar por Condado",
      categoryFilter: "Filtrar por Categoría",
      noEvents: "No hay eventos disponibles.",
    },
    en: {
      title: "Events — El Águila en Vuelo",
      featured: "Featured Events",
      allEvents: "All Events",
      countyFilter: "Filter by County",
      categoryFilter: "Filter by Category",
      noEvents: "No events available.",
    },
  };

  const L = t[lang];

  // List of counties for filtering
  const counties = ["Santa Clara", "San Mateo", "Alameda", "Contra Costa", "San Joaquin", "Stanislaus"];

  // List of event categories
  const categories = ["Music", "Youth", "Family", "Food", "Nightlife", "Sports", "Community", "Holiday"];

  const selectedCounty = searchParams.get("county") || "all";
  const selectedCategory = searchParams.get("category") || "all";

  // Apply filters
  const filtered = events.filter((event) => {
    const countyMatch = selectedCounty === "all" || event.county === selectedCounty;
    const categoryMatch = selectedCategory === "all" || event.category === selectedCategory;
    return countyMatch && categoryMatch;
  });

  // Featured events (max 3)
  const featuredEvents = events.filter((ev) => ev.featured).slice(0, 3);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/eventos?${params.toString()}`);
  };

  return (
    <div className="text-white bg-black min-h-screen pb-32">

      {/* HERO */}
      <PageHero title={L.title} />

      {/* Featured Section */}
      <section className="max-w-5xl mx-auto px-6 mt-20">
        <h2 className="text-4xl font-bold text-yellow-400 mb-10">{L.featured}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {featuredEvents.map((ev) => (
            <div key={ev.id} className="bg-neutral-900 rounded-xl shadow-lg p-4 border border-yellow-700/20">
              <Image
                src={ev.image}
                width={500}
                height={300}
                alt={ev.title}
                className="rounded-lg object-cover w-full h-48"
              />
              <h3 className="text-xl font-bold mt-4 text-yellow-300">{ev.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{ev.description}</p>
              <p className="mt-2 text-sm text-yellow-400 font-semibold">{ev.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Filters */}
      <section className="max-w-5xl mx-auto px-6 mt-20">
        <h2 className="text-3xl font-bold text-yellow-400 mb-6">{L.allEvents}</h2>

        <div className="flex flex-col md:flex-row gap-6 mb-10">

          {/* County Filter */}
          <div>
            <label className="text-yellow-400 font-semibold block mb-2">{L.countyFilter}</label>
            <select
              value={selectedCounty}
              onChange={(e) => updateFilter("county", e.target.value)}
              className="bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700"
            >
              <option value="all">{lang === "es" ? "Todos" : "All"}</option>
              {counties.map((county) => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-yellow-400 font-semibold block mb-2">{L.categoryFilter}</label>
            <select
              value={selectedCategory}
              onChange={(e) => updateFilter("category", e.target.value)}
              className="bg-neutral-800 text-white p-3 rounded-lg border border-neutral-700"
            >
              <option value="all">{lang === "es" ? "Todas" : "All"}</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {filtered.length === 0 && (
            <p className="text-gray-400 text-lg">{L.noEvents}</p>
          )}

          {filtered.map((ev) => (
            <div key={ev.id} className="bg-neutral-900 rounded-xl shadow-lg p-4 border border-neutral-800">
              <Image
                src={ev.image}
                width={500}
                height={300}
                alt={ev.title}
                className="rounded-lg object-cover w-full h-48"
              />
              <h3 className="text-xl font-bold mt-4 text-yellow-300">{ev.title}</h3>
              <p className="mt-2 text-sm text-gray-300">{ev.description}</p>
              <p className="mt-2 text-sm text-yellow-400 font-semibold">{ev.date}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
