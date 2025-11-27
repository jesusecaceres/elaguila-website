"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// Props:
// pages = ["/path/page-01.png", "/path/page-02.png", ...]
// lang  = "es" | "en"
export default function MagazineReader({
  pages,
  lang,
}: {
  pages: string[];
  lang: string;
}) {
  const [index, setIndex] = useState(0);
  const total = pages.length;

  /* -----------------------------
     SMART FIT MODE (Option 3C)
     Phones/Tablets = Fit Height
     Desktop = Fit Width
  ----------------------------- */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsMobile(window.innerWidth <= 900 || window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fitStyle = isMobile
    ? { height: "100%", width: "auto" } // Fit height (phones)
    : { width: "100%", height: "auto" }; // Fit width (desktops)

  /* -----------------------------
     Preload next image
  ----------------------------- */
  useEffect(() => {
    if (index + 1 < total) {
      const next = new Image();
      next.src = pages[index + 1];
    }
  }, [index, total]);

  /* -----------------------------
     Navigation
  ----------------------------- */
  const nextPage = useCallback(() => {
    setIndex((prev) => Math.min(prev + 1, total - 1));
  }, [total]);

  const prevPage = useCallback(() => {
    setIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  /* Keyboard arrows */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextPage, prevPage]);

  /* Swipe support */
  let touchStartX = 0;
  let touchEndX = 0;

  const onTouchStart = (e: any) => {
    touchStartX = e.changedTouches[0].screenX;
  };

  const onTouchEnd = (e: any) => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) nextPage();
    if (touchEndX > touchStartX + 50) prevPage();
  };

  /* Gold arrow styles (Option 2A) */
  const arrowBtn =
    "absolute top-1/2 -translate-y-1/2 text-yellow-300 text-6xl font-bold px-4 py-2 cursor-pointer select-none transition transform hover:scale-125 drop-shadow-[0_0_12px_rgba(255,215,0,0.9)]";

  /* Translation */
  const T = {
    es: { page: "Página" },
    en: { page: "Page" },
  }[lang as "es" | "en"];

  return (
    <div
      className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* LEFT ARROW */}
      {index > 0 && (
        <div
          className={`${arrowBtn} left-4`}
          onClick={prevPage}
        >
          ‹
        </div>
      )}

      {/* RIGHT ARROW */}
      {index < total - 1 && (
        <div
          className={`${arrowBtn} right-4`}
          onClick={nextPage}
        >
          ›
        </div>
      )}

      {/* PAGE CONTAINER */}
      <motion.img
        key={index}
        src={pages[index]}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        alt={`page-${index}`}
        className="rounded-lg shadow-[0_0_90px_rgba(0,0,0,0.8)]"
        style={{
          ...fitStyle,
          maxWidth: "95%",
          maxHeight: "95%",
          objectFit: "contain",
          filter: "drop-shadow(0 0 25px black)",
        }}
      />

      {/* PAGE INDICATOR */}
      <div className="absolute bottom-6 text-yellow-300 font-semibold text-lg tracking-wide drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">
        {T.page} {index + 1} / {total}
      </div>
    </div>
  );
}
