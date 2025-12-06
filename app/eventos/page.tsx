"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { events } from "../data/events";
import PageHero from "../components/PageHero";
import { useMemo } from "react";

export default function EventosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const L = {
    es: {
      title: "Eventos",
      featured: "Destacados",
      countyTitle: "Condados",
      categoryTitle: "Categorías",
      posted: "Fecha:",
      city: "Ciudad:",
      county: "Condado:",
      noEvents: "No hay eventos disponibles.",
      counties: [
        "Santa Clara",
        "Alameda",
        "San Mateo",
        "Contra Costa",
        "Central Valley"
      ],
      categories: {
        singles: "Solteros",
        youth: "Juventud/Niños",
        family: "Familia",
        couples: "Parejas",
        nightlife: "Noche",
        food: "Comida",
        music: "Música",
        community: "Comunidad",
        holiday: "Festividades",
        sports: "Deportes"
      }
    },
    en: {
      title: "Events",
      featured: "Featured",
      countyTitle: "Counties",
      categoryTitle: "Categories",
      posted: "Date:",
      city: "City:",
      county: "County:",
      noEvents: "No events available.",
      counties: [
        "Santa Clara",
        "Alameda",
        "San Mateo",
        "Contra Costa",
        "Central Valley"
      ],
      categories: {
        singles: "Singles",
        youth: "Youth/Kids",
        family: "Family",
        couples: "Couples",
        nightlife: "Nightlife",
        food: "Food",
        music: "Music",
        community: "Community",
        holiday: "Holiday",
        sports: "Sports"
      }
    }
  }[lang];

  // Featured events
  const featured = events.filter(e => e.featured);

  // Main events (non-featured)
  const mainEvents = events.filter(e => !e.featured);

  return (
    <div className="bg-black min-h-screen text-white pb-32">

      {/* HERO */}
      <PageHero title={L.title} />

      <div className="max-w-6xl mx-auto px-6 mt-10">

        {/* FEATURED SECTION */}
        {featured.length > 0 && (
          <div className="mb-14">
            <h2 className="text-3xl font-bold text-[#FFD700] mb-6">{L.featured}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featured.map(evt => (
                <div
                  key={evt.id}
                  className="bg-white/5 rounded-xl p-4 shadow-lg border border-[#FFD700]/30"
                >
                  <Image
                    src={evt.flyer}
                    alt={evt.title}
                    width={500}
                    height={300}
                    className="rounded-lg object-cover w-full h-56"
                  />

                  <h3 className="text-xl font-bold text-[#FFD700] mt-4">{evt.title}</h3>

                  <p className="text-sm text-white/80 mt-2">{evt.description}</p>

                  <p className="text-sm text-white/60 mt-2">
                    {L.posted} {evt.date}
                  </p>

                  <p className="text-sm text-white/60">{L.city} {evt.city}</p>
                  <p className="text-sm text-white/60">{L.county} {evt.county}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAIN GRID */}
        <h2 className="text-3xl font-bold text-[#FFD700] mb-6">{L.title}</h2>

        {mainEvents.length === 0 && (
          <p className="text-white/70">{L.noEvents}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainEvents.map(evt => (
            <div
              key={evt.id}
              className="bg-white/5 rounded-xl p-4 shadow-lg border border-white/10"
            >
              <Image
                src={evt.flyer}
                alt={evt.title}
                width={500}
                height={300}
                className="rounded-lg object-cover w-full h-56"
              />

              <h3 className="text-xl font-bold text-[#FFD700] mt-4">{evt.title}</h3>

              <p className="text-sm text-white/80 mt-2">{evt.description}</p>

              <p className="text-sm text-white/60 mt-2">
                {L.posted} {evt.date}
              </p>

              <p className="text-sm text-white/60">{L.city} {evt.city}</p>
              <p className="text-sm text-white/60">{L.county} {evt.county}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
