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
      portadaAqui: "Portada Aquí",
      pronto: "Muy pronto podrás hojear la primera edición digital.",
      noticias: "Noticias",
      revista: "Revista",
      eventos: "Eventos",
      cupones: "Cupones",
      sorteos: "Sorteos",
      clasificados: "Clasificados",
      tienda: "Tienda",
      about: "Sobre Nosotros",
    },
    en: {
      bienvenidos: "Welcome to",
      comunidad: "Community, Culture & Latino Pride",
      revistaActual: "Digital Magazine — Current Edition",
      portadaAqui: "Cover Here",
      pronto: "Soon you will be able to browse the first digital edition.",
      noticias: "News",
      revista: "Magazine",
      eventos: "Events",
      cupones: "Coupons",
      sorteos: "Sweepstakes",
      clasificados: "Classifieds",
      tienda: "Shop",
      about: "About Us",
    },
  };

  const L = t[lang as "es" | "en"];
  const nav = (p: string) => `${p}?lang=${lang}`;

  return (
    <main className="relative min-h-screen w-full text-white">

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="fixed top-0 left-0 w-full z-50 backdrop-blur-md"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0.35), rgba(0,0,0,0.45))",
          boxShadow: "0 0 25px rgba(255,215,0,0.35)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-1">
          <div className="flex gap-6 text-lg font-semibold">
            <a href={nav("/noticias")} className="hover:text-yellow-300 transition">{L.noticias}</a>
            <a href={nav("/revista")} className="hover:text-yellow-300 transition">{L.revista}</a>
            <a href={nav("/eventos")} className="hover:text-yellow-300 transition">{L.eventos}</a>
            <a href={nav("/cupones")} className="hover:text-yellow-300 transition">{L.cupones}</a>
          </div>

          <a href={nav("/home")}>
            <img
              src="/logo.png"
              alt="El Aguila Logo"
              className="h-20 relative top-3 drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]"
            />
          </a>

          <div className="flex gap-6 text-lg font-semibold">
            <a href={nav("/sorteos")} className="hover:text-yellow-300 transition">{L.sorteos}</a>
            <a href={nav("/clasificados")} className="hover:text-yellow-300 transition">{L.clasificados}</a>
            <a href={nav("/tienda")} className="hover:text-yellow-300 transition">{L.tienda}</a>
            <a href={nav("/about")} className="hover:text-yellow-300 transition">{L.about}</a>
          </div>
        </div>
      </motion.nav>

      {/* BACKGROUND OVERLAY */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
        }}
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-40 pb-32 text-center">
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
            <div className="w-64 h-96 bg-white/20 rounded-lg border border-white/30 flex items-center justify-center text-white text-xl font-bold">
              {L.portadaAqui}
            </div>
          </motion.div>

          <p className="mt-4 text-gray-300 text-lg">{L.pronto}</p>
        </section>
      </div>
    </main>
  );
}
