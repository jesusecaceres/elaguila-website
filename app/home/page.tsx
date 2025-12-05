"use client";

import React, { Suspense } from "react";
import { motion } from "framer-motion";
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
      pronto: "Muy pronto podrás hojear la primera edición digital.",
      verRevista: "Ver Revista",
    },
    en: {
      bienvenidos: "Welcome to",
      comunidad: "Community, Culture & Latino Pride",
      revistaActual: "Digital Magazine — Current Edition",
      pronto: "Soon you will be able to browse the first digital edition.",
      verRevista: "View Magazine",
    },
  };

  const L = t[lang as "es" | "en"];

  // 🔥 Language-based routing
  const magazineLink =
    lang === "es" ? "/revista?lang=es" : "/magazine?lang=en";

  return (
    <main className="relative min-h-screen w-full text-white">

      {/* BACKGROUND OVERLAY */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
        }}
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-48 pb-32 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
        >
          {L.bienvenidos} <span className="text-yellow-400">El Águila</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-6 text-xl md:text-2xl font-light text-gray-200"
        >
          {L.comunidad}
        </motion.p>

        {/* CURRENT EDITION SECTION */}
        <section className="mt-28">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl font-extrabold text-yellow-300"
          >
            {L.revistaActual}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="mt-10 flex justify-center"
          >
            <a href={magazineLink}>
              <div className="w-64 h-96 rounded-lg border-2 border-yellow-400/60 shadow-[0_0_25px_rgba(255,215,0,0.6)] overflow-hidden cursor-pointer hover:scale-105 transition">

                {/* FIXED IMAGE LINE — CLEAN, NO ERRORS */}
                <img
                  src="/home_thumbnail.png"
                  alt="Current Magazine Cover"
                  className="w-full h-full object-cover"
                />

              </div>
            </a>
          </motion.div>

          <p className="mt-4 text-gray-300 text-lg">{L.pronto}</p>
        </section>
      </div>
    </main>
  );
}
