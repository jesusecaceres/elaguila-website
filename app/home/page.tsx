"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

export default function HomePage() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "es";

  // TEXT CONTENT BASED ON LANGUAGE
  const content =
    lang === "es"
      ? {
          headline: "Bienvenidos a El Águila",
          subtext: "Comunidad, Cultura y Orgullo Latino",
          newsButton: "Explorar Noticias",
          newsLink: "/noticias?lang=es",
          magTitle: "Revista Digital — Edición Actual",
          magSoon: "Muy pronto podrás hojear la primera edición digital.",
        }
      : {
          headline: "Welcome to El Águila",
          subtext: "Community, Culture and Latino Pride",
          newsButton: "Explore News",
          newsLink: "/noticias?lang=en",
          magTitle: "Digital Magazine — Current Edition",
          magSoon: "You will soon be able to browse the first digital issue.",
        };

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
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">

        {/* HEADLINE */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
        >
          {content.headline}
        </motion.h1>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-6 text-xl md:text-2xl font-light text-gray-200"
        >
          {content.subtext}
        </motion.p>

        {/* NEWS BUTTON */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16"
        >
          <a
            href={content.newsLink}
            className="inline-block px-10 py-4 bg-yellow-400 text-black font-bold rounded-xl shadow-[0_0_25px_rgba(255,215,0,0.6)] hover:scale-105 transition-transform duration-300"
          >
            {content.newsButton}
          </a>
        </motion.div>

        {/* MAGAZINE SECTION */}
        <section className="mt-28">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl font-extrabold text-yellow-300"
          >
            {content.magTitle}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="mt-10 flex justify-center"
          >
            <div className="w-64 h-96 bg-white/20 rounded-lg border border-white/30 flex items-center justify-center text-white text-xl font-bold">
              {lang === "es" ? "Portada Aquí" : "Cover Here"}
            </div>
          </motion.div>

          <p className="mt-4 text-gray-300 text-lg">{content.magSoon}</p>
        </section>
      </div>
    </main>
  );
}
