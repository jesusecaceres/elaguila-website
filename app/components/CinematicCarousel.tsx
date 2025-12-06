"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface CarouselItem {
  id: string;
  title: string;
  description: string;
  date?: string;
  link?: string;
  image?: string;
  county?: string;
  category?: string;
}

interface Props {
  items: CarouselItem[];
  title: string; // Section title above the carousel
  lang: "es" | "en";
}

export default function CinematicCarousel({ items, title, lang }: Props) {
  const [index, setIndex] = useState(0);

  const prev = () => {
    setIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const next = () => {
    setIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const current = items[index];

  return (
    <div className="w-full flex flex-col items-center mt-16 mb-24">
      {/* SECTION TITLE */}
      <h2 className="text-4xl font-bold text-center text-[#FFD700] mb-10 drop-shadow-lg">
        {title}
      </h2>

      {/* CAROUSEL WRAPPER */}
      <div className="relative w-full max-w-5xl flex items-center justify-center">

        {/* LEFT ARROW */}
        <button
          onClick={prev}
          className="absolute left-0 z-20 bg-gradient-to-b from-[#FFD700] to-[#B8860B] text-black w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all border border-yellow-400"
        >
          <span className="text-3xl font-bold">{lang === "es" ? "‹" : "‹"}</span>
        </button>

        {/* RIGHT ARROW */}
        <button
          onClick={next}
          className="absolute right-0 z-20 bg-gradient-to-b from-[#FFD700] to-[#B8860B] text-black w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition-all border border-yellow-400"
        >
          <span className="text-3xl font-bold">{lang === "es" ? "›" : "›"}</span>
        </button>

        {/* CINEMATIC CARD */}
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="bg-black/40 backdrop-blur-xl border border-yellow-700 rounded-3xl p-8 max-w-3xl shadow-[0_0_40px_rgba(255,215,0,0.25)]"
        >
          {/* IMAGE */}
          <div className="w-full h-72 relative mb-6 rounded-xl overflow-hidden bg-black">
            <Image
              src={current.image || "/event-fallback.png"}
              alt={current.title}
              fill
              className="object-cover opacity-90"
            />
          </div>

          {/* TITLE */}
          <h3 className="text-2xl font-bold text-[#FFD700] mb-2">
            {current.title}
          </h3>

          {/* DESCRIPTION */}
          <p className="text-white/90 text-lg mb-4">{current.description}</p>

          {/* DATE */}
          {current.date && (
            <p className="text-white/70 text-sm mb-4">{current.date}</p>
          )}

          {/* VIEW BUTTON */}
          {current.link && (
            <a
              href={current.link}
              target="_blank"
              className="inline-block bg-gradient-to-b from-[#FFD700] to-[#B8860B] text-black font-semibold px-6 py-3 rounded-xl hover:scale-105 transition-all shadow-lg"
            >
              {lang === "es" ? "Ver Evento" : "View Event"}
            </a>
          )}
        </motion.div>
      </div>

      {/* PAGINATION DOTS */}
      <div className="flex gap-3 mt-6">
        {items.map((_, i) => (
          <div
            key={i}
            onClick={() => setIndex(i)}
            className={`w-4 h-4 rounded-full cursor-pointer transition-all ${
              index === i
                ? "bg-[#FFD700] shadow-[0_0_15px_#FFD700]"
                : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
