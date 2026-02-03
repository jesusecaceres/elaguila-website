"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SorteosPage() {
  const searchParams = useSearchParams()!;
  const lang = searchParams.get("lang") || "es";

  const t = {
    es: {
      title: "Sorteos — Premio Semanal y Gran Premio",
      weeklyTitle: "Premio Semanal",
      grandTitle: "Gran Premio",
      watchVideo: "Ver Video para Participar",
      winners: "Ver Ganadores",
      rules: "Reglas del Sorteo",
      weeklyDesc:
        "¡Mira el anuncio promocional de esta semana para participar en el premio semanal!",
      grandDesc:
        "Cada participación también entra automáticamente al Sorteo del Gran Premio.",
      back: "← Regresar a Inicio",
    },
  };

  const L = t.es;

  // TEMPORARY placeholder prizes
  const weeklyPrize = {
    title: "Tarjeta de Regalo — $50",
    img: "/weekly-prize.png",
  };

  const grandPrize = {
    title: "Gran Premio: $500 Mega Sorteo",
    img: "/grand-prize.png",
  };

  return (
    <main className="min-h-screen bg-black text-white pt-28 px-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* BACK LINK */}
        <Link
          href="/home?lang=es"
          className="text-yellow-300 underline text-lg hover:text-yellow-500"
        >
          {L.back}
        </Link>

        {/* TITLE */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mt-6 text-yellow-300 drop-shadow-[0_0_18px_rgba(255,215,0,0.6)]">
          {L.title}
        </h1>

        {/* WEEKLY PRIZE */}
        <section className="mt-16 bg-[#111] border border-yellow-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(255,215,0,0.3)]">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            {L.weeklyTitle}
          </h2>

          <img
            src={weeklyPrize.img}
            alt="Premio Semanal"
            className="w-full rounded-lg border border-yellow-500/20"
          />

          <p className="mt-4 text-gray-300">{L.weeklyDesc}</p>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* Spanish Video */}
            <a
              href="/video?lang=es&target=weekly"
              className="flex-1 text-center px-6 py-4 bg-yellow-400 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              {L.watchVideo}
            </a>

            {/* English fallback */}
            <a
              href="/video?lang=en&target=weekly"
              className="flex-1 text-center px-6 py-4 bg-yellow-400/80 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              Watch Video (English)
            </a>
          </div>
        </section>

        {/* GRAND PRIZE */}
        <section className="mt-20 bg-[#111] border border-yellow-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(255,215,0,0.3)]">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            {L.grandTitle}
          </h2>

          <img
            src={grandPrize.img}
            alt="Gran Premio"
            className="w-full rounded-lg border border-yellow-500/20"
          />

          <p className="mt-4 text-gray-300">{L.grandDesc}</p>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* Spanish Video */}
            <a
              href="/video?lang=es&target=grand"
              className="flex-1 text-center px-6 py-4 bg-yellow-400 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              {L.watchVideo}
            </a>

            {/* English fallback */}
            <a
              href="/video?lang=en&target=grand"
              className="flex-1 text-center px-6 py-4 bg-yellow-400/80 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              Watch Video (English)
            </a>
          </div>
        </section>

        {/* WINNERS / RULES */}
        <div className="mt-20 text-center">
          <a
            href="/sorteos/ganadores"
            className="block text-xl text-yellow-300 underline hover:text-yellow-500 mb-4"
          >
            {L.winners}
          </a>

          <a
            href="/rules?lang=es"
            className="block text-lg text-gray-300 underline hover:text-gray-100"
          >
            {L.rules}
          </a>
        </div>
      </div>
    </main>
  );
}
