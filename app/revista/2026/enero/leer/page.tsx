"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function RevistaSwipeEnero2026() {
  // TOTAL NUMBER OF PAGES — replace later with dynamic admin values
  const TOTAL_PAGES = 5;

  // Swipe state
  const [page, setPage] = useState(1);

  // Navigate pages
  const goNext = () => {
    if (page < TOTAL_PAGES) setPage(page + 1);
  };

  const goPrev = () => {
    if (page > 1) setPage(page - 1);
  };

  // Each "page" of the magazine (placeholder content)
  const pages = [
    {
      id: 1,
      type: "image",
      src: "/revista-pages/enero-2026/page1-placeholder.jpg",
    },
    {
      id: 2,
      type: "video",
      src: "/videos/sample-video.mp4",
    },
    {
      id: 3,
      type: "coupon",
      src: "/placeholders/featured-coupon.jpg",
    },
    {
      id: 4,
      type: "sweepstakes",
      src: "/placeholders/featured-sweepstakes.jpg",
    },
    {
      id: 5,
      type: "image",
      src: "/revista-pages/enero-2026/page5-placeholder.jpg",
    },
  ];

  const currentPage = pages.find((p) => p.id === page);

  return (
    <main className="w-full h-screen bg-black text-white select-none relative overflow-hidden">

      {/* HEADER BUTTONS */}
      <div className="absolute top-4 left-4 z-50 flex gap-4">
        <Link
          href="/revista/2026/enero"
          className="px-6 py-2 text-lg font-semibold bg-white/10 rounded-xl hover:bg-white/20 transition"
        >
          ← Regresar
        </Link>
      </div>

      {/* PAGE COUNTER */}
      <div className="absolute top-4 right-6 z-50 text-xl font-bold opacity-80">
        {page} / {TOTAL_PAGES}
      </div>

      {/* SWIPE/TAP AREA */}
      <div className="w-full h-full flex items-center justify-center px-4 relative">

        {/* LEFT TAP ZONE */}
        <div
          onClick={goPrev}
          className="absolute left-0 top-0 h-full w-1/3 cursor-pointer"
        />

        {/* RIGHT TAP ZONE */}
        <div
          onClick={goNext}
          className="absolute right-0 top-0 h-full w-1/3 cursor-pointer"
        />

        {/* PAGE CONTENT */}
        <div className="w-full max-w-xl h-[85%] bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-white/20">

          {/* ------ IMAGE PAGE ------ */}
          {currentPage?.type === "image" && (
            <div className="relative w-full h-full">
              <Image
                src={currentPage.src}
                alt="Revista Page"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* ------ VIDEO PAGE ------ */}
          {currentPage?.type === "video" && (
            <video
              src={currentPage.src}
              controls
              className="w-full h-full object-cover"
            />
          )}

          {/* ------ COUPON PAGE ------ */}
          {currentPage?.type === "coupon" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6">
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-6 shadow-xl">
                <Image
                  src={currentPage.src}
                  alt="Cupón"
                  fill
                  className="object-cover"
                />
              </div>
              <Link
                href="#"
                className="text-yellow-300 text-2xl font-bold hover:underline"
              >
                Canjear cupón →
              </Link>
            </div>
          )}

          {/* ------ SWEEPSTAKES PAGE ------ */}
          {currentPage?.type === "sweepstakes" && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6">
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-6 shadow-xl">
                <Image
                  src={currentPage.src}
                  alt="Sorteo"
                  fill
                  className="object-cover"
                />
              </div>
              <Link
                href="/sorteos/january-2026"
                className="text-yellow-300 text-2xl font-bold hover:underline"
              >
                Entrar al sorteo →
              </Link>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
