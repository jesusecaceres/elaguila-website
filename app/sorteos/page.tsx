"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SorteosHome() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      title: "Sorteos Semanales",
      description:
        "Participa cada semana para ganar premios increíbles. ¡Tu entrada es completamente gratis!",
      weekly: "Entrar al Sorteo",
      grandTitle: "Próximo Premio Mayor",
      grandPrize: "Gran Premio Trimestral – Marzo 2026",
      grandButton: "Entrar al Premio Mayor →",
      rules: "Ver Reglas",
    },

    en: {
      title: "Weekly Sweepstakes",
      description:
        "Enter every week for a chance to win amazing prizes. Your entry is completely free!",
      weekly: "Enter the Giveaway",
      grandTitle: "Next Grand Prize",
      grandPrize: "Quarterly Grand Prize – March 2026",
      grandButton: "Enter Grand Prize →",
      rules: "View Rules",
    },
  }[lang];

  return (
    <main className="min-h-screen w-full text-white px-6 pb-24 mt-20">
      <h1 className="text-5xl font-extrabold text-center">{t.title}</h1>
      <p className="text-center opacity-80 mt-4 mb-10 max-w-2xl mx-auto">
        {t.description}
      </p>

      {/* Weekly */}
      <div className="max-w-4xl mx-auto bg-white/10 p-10 rounded-2xl shadow-xl backdrop-blur-xl text-center">
        <div className="relative w-full mx-auto aspect-[4/5] rounded-xl bg-neutral-800 mb-6"></div>

        <Link
          href={`/sorteos/2026/week-01?lang=${lang}`}
          className="bg-yellow-400 text-black px-10 py-4 rounded-full text-xl font-bold hover:brightness-110 shadow-lg"
        >
          {t.weekly} →
        </Link>
      </div>

      {/* Grand Prize */}
      <section className="max-w-5xl mx-auto mt-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          {t.grandTitle}
        </h2>

        <div className="bg-white/10 p-10 rounded-2xl shadow-xl backdrop-blur-xl text-center">
          <p className="text-xl font-semibold mb-4">{t.grandPrize}</p>

          <div className="relative w-full mx-auto aspect-[4/5] rounded-xl bg-neutral-800 mb-6"></div>

          <Link
            href={`/sorteos/grand/marzo-2026?lang=${lang}`}
            className="bg-yellow-400 text-black px-10 py-4 rounded-full text-xl font-bold hover:brightness-110 shadow-lg"
          >
            {t.grandButton}
          </Link>
        </div>
      </section>

      <div className="text-center mt-10">
        <Link
          href={`/legal/sweepstakes-rules?lang=${lang}`}
          className="underline opacity-80 hover:text-yellow-400"
        >
          {t.rules}
        </Link>
      </div>
    </main>
  );
}
