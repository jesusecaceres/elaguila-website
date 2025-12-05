"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "es";

  const t = {
    es: {
      bienvenidos: "Bienvenidos a",
      comunidad: "Comunidad, Cultura y Orgullo Latino",
      revistaActual: "Revista Digital — Edición Actual",
      pronto: "Muy pronto podrás hojear la primera edición digital."
    },
    en: {
      bienvenidos: "Welcome to",
      comunidad: "Community, Culture & Latino Pride",
      revistaActual: "Digital Magazine — Current Edition",
      pronto: "Soon you will be able to browse the first digital edition."
    }
  };

  const L = t[lang];
  const magazineLink = `/magazine?lang=${lang}`;

  return (
    <main className="relative min-h-screen w-full text-white">
      <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.4), rgba(0,0,0,0.65))" }}></div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-[0_0_12px_rgba(255,215,0,0.5)]">
          {L.bienvenidos} <span className="text-yellow-400">El Águila</span>
        </h1>

        <p className="mt-4 text-lg md:text-xl font-light text-gray-200">{L.comunidad}</p>

        <section className="mt-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-yellow-300">{L.revistaActual}</h2>

          <div className="mt-8 flex justify-center">
            <a href={magazineLink}>
              <div className="w-80 h-[29rem] rounded-xl border-2 border-yellow-400/70 shadow-[0_0_35px_rgba(255,215,0,0.7)] overflow-hidden cursor-pointer hover:scale-105 hover:shadow-[0_0_45px_rgba(255,215,0,0.85)] transition-all duration-300">
                <img src="/home_thumbnail.png" alt="Current Magazine Cover" className="w-full h-full object-cover" />
              </div>
            </a>
          </div>

          <p className="mt-3 text-gray-300 text-base md:text-lg">{L.pronto}</p>
        </section>
        
      </div>
    </main>
  );
}
