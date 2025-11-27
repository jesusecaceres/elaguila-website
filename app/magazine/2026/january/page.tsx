"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";

export default function January2026MagazineReader() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get("lang");
  const lang = langParam === "en" ? "en" : "es";

  const L = {
    es: {
      title: "Revista Digital — Enero 2026",
      note: "Estás viendo el PDF completo de la revista, tal como fue diseñado en Canva.",
      back: "← Volver a la revista",
    },
    en: {
      title: "Digital Magazine — January 2026",
      note: "You are viewing the full magazine PDF exactly as designed in Canva.",
      back: "← Back to magazine hub",
    },
  }[lang];

  const backUrl = `/magazine?lang=${lang}`;

  return (
    <main className="relative min-h-screen w-full text-white">
      <Navbar />

      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.4), rgba(0,0,0,0.7))",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-40 pb-16">
        <a href={backUrl} className="text-yellow-300 hover:text-yellow-200 text-sm">
          {L.back}
        </a>

        <h1 className="mt-2 text-3xl md:text-4xl font-extrabold text-yellow-300">
          {L.title}
        </h1>

        <p className="mt-3 text-gray-200 text-sm md:text-base">{L.note}</p>

        {/* PDF VIEWER */}
        <div className="mt-6 w-full rounded-lg overflow-hidden border border-yellow-500/40 bg-black/60">
          <iframe
            src="/magazines/2026/january.pdf"
            className="w-full"
            style={{ minHeight: "70vh" }}
          />
        </div>

        <p className="mt-3 text-xs text-gray-400">
          {lang === "en"
            ? "If the PDF does not load, check that you exported it from Canva and placed it at /public/magazines/2026/january.pdf."
            : "Si el PDF no carga, verifica que lo exportaste desde Canva y lo colocaste en /public/magazines/2026/january.pdf."}
        </p>
      </div>
    </main>
  );
}
