"use client";

import { useState } from "react";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";

export default function January2026Magazine() {
  // Flipbook pages in order
  const pages = [
    "/magazine/2026/january/cover.png",
    "/magazine/2026/january/war-fitness-ad.png",
    "/magazine/2026/january/advertise.png",
  ];

  const [pageIndex, setPageIndex] = useState(0);

  const goPrev = () => {
    if (pageIndex > 0) setPageIndex(pageIndex - 1);
  };

  const goNext = () => {
    if (pageIndex < pages.length - 1) setPageIndex(pageIndex + 1);
  };

  return (
    <main className="relative min-h-screen w-full bg-black text-white">
      {/* NAVBAR */}
      <Navbar />

      {/* MAGAZINE CONTAINER */}
      <div
        className="
          flex flex-col items-center justify-center 
          pt-28 pb-10
          w-full
        "
      >
        <div
          className="
            relative
            flex items-center justify-center
            bg-black
            rounded-xl
            shadow-2xl
            px-4
          "
          style={{
            maxWidth: "100%",
          }}
        >
          {/* LEFT ARROW */}
          {pageIndex > 0 && (
            <button
              onClick={goPrev}
              className="
                absolute left-0 z-20 
                text-4xl text-yellow-400 
                px-4 py-2
                hover:text-yellow-300 transition
              "
            >
              ‹
            </button>
          )}

          {/* PAGE IMAGE (AUTO-SCALED, NO SCROLLING) */}
          <div
            className="
              flex items-center justify-center
              overflow-hidden
            "
            style={{
              width: "100%",
              maxWidth: "900px",
              maxHeight: "80vh",
            }}
          >
            <Image
              src={pages[pageIndex]}
              alt={`Magazine Page ${pageIndex + 1}`}
              width={900}
              height={1400}
              className="object-contain w-auto h-[80vh] select-none"
              priority
            />
          </div>

          {/* RIGHT ARROW */}
          {pageIndex < pages.length - 1 && (
            <button
              onClick={goNext}
              className="
                absolute right-0 z-20 
                text-4xl text-yellow-400 
                px-4 py-2
                hover:text-yellow-300 transition
              "
            >
              ›
            </button>
          )}
        </div>

        {/* PAGE COUNTER */}
        <p className="mt-4 text-yellow-300 text-lg tracking-wide">
          Página {pageIndex + 1} de {pages.length}
        </p>
      </div>
    </main>
  );
}
