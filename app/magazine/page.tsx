"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";

type Lang = "es" | "en";

type Edition = {
  year: number;
  monthKey: string;      // folder name, e.g. "january"
  cover: string;         // cover image in /public
  pdfPath: string;       // pdf path in /public
};

const EDITIONS: Edition[] = [
  {
    year: 2026,
    monthKey: "january",
    cover: "/magazine-covers/2026-january.jpg",
    pdfPath: "/magazines/2026/january.pdf",
  },
  // 🔥 When you have more editions, just add them here
  // {
  //   year: 2026,
  //   monthKey: "february",
  //   cover: "/magazine-covers/2026-february.jpg",
  //   pdfPath: "/magazines/2026/february.pdf",
  // },
];

function getMonthLabel(lang: Lang, monthKey: string, year: number) {
  const map: Record<string, { en: string; es: string }> = {
    january: { en: "January", es: "Enero" },
    february: { en: "February", es: "Febrero" },
    march: { en: "March", es: "Marzo" },
    april: { en: "April", es: "Abril" },
    may: { en: "May", es: "Mayo" },
    june: { en: "June", es: "Junio" },
    july: { en: "July", es: "Julio" },
    august: { en: "August", es: "Agosto" },
    september: { en: "September", es: "Septiembre" },
    october: { en: "October", es: "Octubre" },
    november: { en: "November", es: "Noviembre" },
    december: { en: "December", es: "Diciembre" },
  };

  const base = map[monthKey] || { en: monthKey, es: monthKey };
  const text = lang === "en" ? base.en : base.es;
  return `${text} ${year}`;
}

export default function MagazinePage() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const lang: Lang = langParam === "en" ? "en" : "es";

  const L = {
    es: {
      title: "Revista Digital",
      currentEdition: "Edición Actual",
      archives: "Ediciones Anteriores",
      readNow: "Leer ahora",
      comingSoon: "Muy pronto encontrarás todas las ediciones archivadas aquí.",
    },
    en: {
      title: "Digital Magazine",
      currentEdition: "Current Edition",
      archives: "Past Editions",
      readNow: "Read now",
      comingSoon: "Soon you’ll find all archived editions here.",
    },
  }[lang];

  // current edition = first in array for now
  const current = EDITIONS[0];

  const editionUrl = (edition: Edition) =>
    `/magazine/${edition.year}/${edition.monthKey}?lang=${lang}`;

  return (
    <main className="relative min-h-screen w-full text-white">
      {/* NAVBAR (already global & bilingual) */}
      <Navbar />

      {/* BACKGROUND OVERLAY */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.7))",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-40 pb-24">
        {/* PAGE TITLE */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-yellow-300 mb-8 text-center">
          {L.title} — El Águila
        </h1>

        {/* CURRENT EDITION */}
        {current && (
          <section className="mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-yellow-200 mb-6">
              {L.currentEdition}:{" "}
              {getMonthLabel(lang, current.monthKey, current.year)}
            </h2>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Cover */}
              <a
                href={editionUrl(current)}
                className="block w-64 h-96 bg-white/10 rounded-lg border border-yellow-400/60 overflow-hidden shadow-lg hover:scale-105 transition transform"
              >
                <img
                  src={current.cover}
                  alt="Current magazine cover"
                  className="w-full h-full object-cover"
                />
              </a>

              {/* Info + Button */}
              <div className="flex-1">
                <p className="text-lg text-gray-200 mb-4">
                  {lang === "en"
                    ? "Click the cover or the button below to open the full digital magazine. You’ll view the complete PDF exactly as designed in Canva."
                    : "Haz clic en la portada o en el botón para abrir la revista digital completa. Verás el PDF tal como fue diseñado en Canva."}
                </p>

                <a
                  href={editionUrl(current)}
                  className="inline-block mt-2 px-6 py-3 rounded-full bg-yellow-400 text-black font-bold text-lg hover:bg-yellow-300 transition"
                >
                  {L.readNow}
                </a>
              </div>
            </div>
          </section>
        )}

        {/* ARCHIVE EDITIONS */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-200 mb-6">
            {L.archives}
          </h2>

          {EDITIONS.length <= 1 ? (
            <p className="text-gray-300 text-base md:text-lg">
              {L.comingSoon}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {EDITIONS.slice(1).map((edition) => (
                <a
                  key={`${edition.year}-${edition.monthKey}`}
                  href={editionUrl(edition)}
                  className="block bg-white/5 border border-white/15 rounded-lg overflow-hidden hover:bg-white/10 transition"
                >
                  <div className="w-full h-64 bg-black/40">
                    <img
                      src={edition.cover}
                      alt={`Cover ${edition.year} ${edition.monthKey}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-yellow-200">
                      {getMonthLabel(lang, edition.monthKey, edition.year)}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                      {lang === "en"
                        ? "Tap to open this edition."
                        : "Toca para abrir esta edición."}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
