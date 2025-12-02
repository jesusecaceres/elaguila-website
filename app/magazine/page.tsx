// app/magazine/page.tsx
"use client";

import Link from "next/link";
import Navbar from "../components/Navbar";

export default function MagazineHubPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {/* NAVBAR */}
      <Navbar />

      {/* CONTENT */}
      <section className="max-w-5xl mx-auto px-4 pt-32 pb-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          El Águila Digital Magazine
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto">
          Stories, businesses, and culture from our Latino community in the Bay
          Area and beyond. Browse the current issue or explore past editions.
        </p>

        {/* CURRENT ISSUE CARD */}
        <div className="mt-12 flex flex-col items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-52 md:w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-[0_0_35px_rgba(255,215,0,0.5)] border border-yellow-400/60">
              {/* Just the cover image from public/magazine/2026/january/cover.png */}
              <img
                src="/magazine/2026/january/cover.png"
                alt="El Águila Digital Magazine — January 2026 Cover"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-left max-w-md">
              <h2 className="text-2xl md:text-3xl font-bold text-yellow-300 mb-2">
                January 2026 — Digital Edition
              </h2>
              <p className="text-gray-300 mb-4">
                Kick off the year with our launch issue featuring local
                businesses, community spotlights, and exclusive ads with
                coupons and sweepstakes opportunities.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/magazine/2026/january"
                  className="px-5 py-3 rounded-full bg-yellow-400 text-black font-semibold text-sm md:text-base shadow-lg hover:bg-yellow-300 transition"
                >
                  Open January 2026 Issue
                </Link>

                <Link
                  href="/magazine/2026"
                  className="px-5 py-3 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-sm md:text-base hover:bg-yellow-400/10 transition"
                >
                  View 2026 Editions
                </Link>
              </div>
            </div>
          </div>

          {/* ARCHIVE NOTE */}
          <p className="text-sm text-gray-400 max-w-xl">
            As new issues are released, they&apos;ll appear in the yearly index.
            You&apos;ll always be able to return here to discover previous
            editions of <span className="font-semibold">El Águila</span>.
          </p>
        </div>
      </section>
    </main>
  );
}
