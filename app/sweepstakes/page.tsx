"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function SweepstakesPage() {
  const searchParams = useSearchParams()!;
  const lang = searchParams.get("lang") || "en";

  // TEXTS
  const t = {
    en: {
      title: "Weekly & Grand Prize Sweepstakes",
      weeklyTitle: "Weekly Prize",
      grandTitle: "Grand Prize",
      watchVideo: "Watch Video to Enter",
      enterNow: "Enter Now",
      winners: "View Winners",
      rules: "Sweepstakes Rules",
      weeklyDesc:
        "Win this week's featured prize by watching the promotional ad!",
      grandDesc:
        "Every entry this season also enters you automatically into the Grand Prize!",
      back: "← Back to Home",
    },
  };

  const L = t.en;

  // TEMPORARY placeholder prize info
  const weeklyPrize = {
    title: "Weekly Gift Card - $50",
    img: "/weekly-prize.png", // You can update this anytime
  };

  const grandPrize = {
    title: "Grand Prize: $500 Mega Giveaway",
    img: "/grand-prize.png",
  };

  return (
    <main className="min-h-screen bg-black text-white pt-28 px-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* BACK LINK */}
        <Link
          href="/home?lang=en"
          className="text-yellow-300 underline text-lg hover:text-yellow-500"
        >
          {L.back}
        </Link>

        {/* TITLE */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-center mt-6 text-yellow-300 drop-shadow-[0_0_18px_rgba(255,215,0,0.6)]">
          {L.title}
        </h1>

        {/* WEEKLY PRIZE SECTION */}
        <section className="mt-16 bg-[#111] border border-yellow-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(255,215,0,0.3)]">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            {L.weeklyTitle}
          </h2>

          <img
            src={weeklyPrize.img}
            alt="Weekly Prize"
            className="w-full rounded-lg border border-yellow-500/20"
          />

          <p className="mt-4 text-gray-300">{L.weeklyDesc}</p>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* English Video Button */}
            <a
              href="/video?lang=en&target=weekly"
              className="flex-1 text-center px-6 py-4 bg-yellow-400 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              {L.watchVideo}
            </a>

            {/* Spanish Video Button */}
            <a
              href="/video?lang=es&target=weekly"
              className="flex-1 text-center px-6 py-4 bg-yellow-400/80 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              Ver Video (Español)
            </a>
          </div>
        </section>

        {/* GRAND PRIZE SECTION */}
        <section className="mt-20 bg-[#111] border border-yellow-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(255,215,0,0.3)]">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4">
            {L.grandTitle}
          </h2>

          <img
            src={grandPrize.img}
            alt="Grand Prize"
            className="w-full rounded-lg border border-yellow-500/20"
          />

          <p className="mt-4 text-gray-300">{L.grandDesc}</p>

          <div className="mt-6 flex flex-col md:flex-row gap-4">
            {/* English Video Button */}
            <a
              href="/video?lang=en&target=grand"
              className="flex-1 text-center px-6 py-4 bg-yellow-400 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              {L.watchVideo}
            </a>

            {/* Spanish Video Button */}
            <a
              href="/video?lang=es&target=grand"
              className="flex-1 text-center px-6 py-4 bg-yellow-400/80 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              Ver Video (Español)
            </a>
          </div>
        </section>

        {/* WINNERS + RULES LINKS */}
        <div className="mt-20 text-center">
          <a
            href="/sweepstakes/winners"
            className="block text-xl text-yellow-300 underline hover:text-yellow-500 mb-4"
          >
            {L.winners}
          </a>

          <a
            href="/rules?lang=en"
            className="block text-lg text-gray-300 underline hover:text-gray-100"
          >
            {L.rules}
          </a>
        </div>
      </div>
    </main>
  );
}
