"use client";

import { useSearchParams } from "next/navigation";
import EntryForm from "../../components/EntryForm";

export default function Week1Sweepstake() {
  const params = useSearchParams()!;
  const lang = params.get("lang") || "es";
  const isES = lang === "es";

  const title = isES
    ? "Sorteo Semana 01 — Enero 2026"
    : "Week 01 Giveaway — January 2026";

  const description = isES
    ? "Participa para ganar el premio de esta semana. Fácil, rápido y gratis."
    : "Enter for a chance to win this week's prize. Fast, easy, and free.";

  return (
    <div className="relative z-20 min-h-screen pt-36 px-8 max-w-5xl mx-auto">
      <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-4">
        {title}
      </h1>
      <p className="text-xl text-white drop-shadow mb-10">{description}</p>

      {/* SWEEPSTAKE IMAGE */}
      <img
        src="/sorteo-sample.png"
        alt="sweepstake"
        className="rounded-3xl w-full shadow-2xl mb-10"
      />

      {/* ENTRY FORM */}
      <EntryForm sweepstakeId="2026-week-01" />
    </div>
  );
}
