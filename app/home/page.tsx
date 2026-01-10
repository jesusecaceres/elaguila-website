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
  const lang = (searchParams.get("lang") || "es") as "es" | "en";

  const t = {
    es: {
      title: "LEONIX",
      identity: "Comunidad, Cultura y Fe",
      precedent: "Revista de Comunidad, Cultura y Negocios",
      ctaPrimary: "Explorar la revista",
      ctaSecondary: "Edición digital",
      coverAlt: "Portada de la revista LEONIX",
    },
    en: {
      title: "LEONIX",
      identity: "Community, Culture & Faith",
      precedent: "Magazine of Community, Culture & Business",
      ctaPrimary: "Explore the magazine",
      ctaSecondary: "Digital edition",
      coverAlt: "LEONIX magazine cover",
    },
  };

  const L = t[lang];
  const magazineLink = `/magazine?lang=${lang}`;

  return (
    <main className="relative min-h-screen w-full text-white overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.30), rgba(0,0,0,0.65))",
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 16%, rgba(255,215,0,0.10), rgba(0,0,0,0) 58%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-14 text-center">
        {/* HERO */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight drop-shadow-[0_0_14px_rgba(255,215,0,0.40)]"
        >
          {L.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.9 }}
          className="mt-3 text-base md:text-lg font-light text-gray-100"
        >
          {L.identity}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.9 }}
          className="mt-2 text-sm md:text-base text-gray-300"
        >
          {L.precedent}
        </motion.p>

        {/* MAGAZINE COVER + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.22, duration: 0.9 }}
          className="mt-7 md:mt-8 flex flex-col items-center"
        >
          <a href={magazineLink} className="block">
            <div className="rounded-2xl border-2 border-yellow-400/70 overflow-hidden shadow-[0_0_60px_rgba(255,215,0,0.26)] hover:shadow-[0_0_80px_rgba(255,215,0,0.34)] transition-all duration-300">
              <div className="w-80 sm:w-[26rem] md:w-[30rem]">
                <img
                  src="/home_thumbnail.png"
                  alt={L.coverAlt}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </a>

          <div className="mt-4 flex flex-col items-center gap-2">
            <a
              href={magazineLink}
              className="inline-flex items-center justify-center rounded-full border border-yellow-400/80 bg-black/35 px-7 py-3 text-sm md:text-base font-semibold text-yellow-200 hover:bg-black/55 hover:text-yellow-100 shadow-[0_0_28px_rgba(255,215,0,0.18)] hover:shadow-[0_0_40px_rgba(255,215,0,0.26)] transition-all duration-300"
            >
              {L.ctaPrimary}
            </a>

            <p className="text-xs md:text-sm text-gray-300">
              {L.ctaSecondary}
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
