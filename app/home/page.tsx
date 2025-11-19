"use client";

import React from "react";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full text-white">
      {/* BACKGROUND OVERLAY — smooth, elegant, not dark or depressing */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
        }}
      />

      {/* MAIN CONTAINER */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">

        {/* HEADLINE */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2 }}
          className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
        >
          Bienvenidos a <span className="text-yellow-400">El Águila</span>
        </motion.h1>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-6 text-xl md:text-2xl font-light text-gray-200"
        >
          Comunidad, Cultura y Orgullo Latino
        </motion.p>

        {/* ENGLISH VERSION BELOW (auto shows when ?lang=en) */}
        {/* Later we will detect lang and auto-switch text */}

        {/* CALL TO ACTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16"
        >
          <a
            href="/noticias?lang=es"
            className="inline-block px-10 py-4 bg-yellow-400 text-black font-bold rounded-xl shadow-[0_0_25px_rgba(255,215,0,0.6)] hover:scale-105 transition-transform duration-300"
          >
            Explorar Noticias
          </a>
        </motion.div>

        {/* MAGAZINE PREVIEW SECTION (placeholder until design) */}
        <section className="mt-28">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-4xl font-extrabold text-yellow-300"
          >
            Revista Digital — Edición Actual
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 1 }}
            className="mt-10 flex justify-center"
          >
            <div className="w-64 h-96 bg-white/20 rounded-lg border border-white/30 flex items-center justify-center text-white text-xl font-bold">
              Portada Aquí
            </div>
          </motion.div>

          <p className="mt-4 text-gray-300 text-lg">
            Muy pronto podrás hojear la primera edición digital.
          </p>
        </section>
      </div>
    </main>
  );
}
