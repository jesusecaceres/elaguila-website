"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function GrandPrizeMarch2026() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      title: "Gran Premio Trimestral – Marzo 2026",
      subtitle: "Participa para ganar el gran premio de esta temporada.",
      description:
        "Este premio especial se entrega una vez por trimestre a un ganador afortunado que participa en nuestros sorteos de El Águila en Vuelo.",
      prizeDetailsTitle: "Detalles del Premio",
      prizeDetails: [
        "Premio principal exclusivo de El Águila en Vuelo.",
        "Incluye promoción especial en la revista y redes sociales.",
        "El premio exacto será anunciado antes de la fecha del sorteo."
      ],
      howToEnterTitle: "Cómo Obtener Entradas",
      howToEnter: [
        "Participa en los sorteos semanales durante el trimestre.",
        "Entradas adicionales pueden obtenerse mediante acciones promocionales (por ejemplo: seguir redes sociales, compartir contenido o suscribirse).",
        "No se requiere compra para participar."
      ],
      cta: "Entrar al Premio Mayor",
      rules: "Ver Reglas Oficiales",
    },

    en: {
      title: "Quarterly Grand Prize – March 2026",
      subtitle: "Enter for a chance to win this season’s grand prize.",
      description:
        "This special prize is awarded once per quarter to one lucky winner who participates in El Águila en Vuelo sweepstakes.",
      prizeDetailsTitle: "Prize Details",
      prizeDetails: [
        "Exclusive grand prize from El Águila en Vuelo.",
        "Includes special promotion in the magazine and social media.",
        "Exact prize details will be announced before the drawing date."
      ],
      howToEnterTitle: "How to Earn Entries",
      howToEnter: [
        "Enter the weekly giveaways throughout the quarter.",
        "Bonus entries may be earned through promotional actions (e.g., following social media, sharing content, or subscribing).",
        "No purchase is necessary to enter."
      ],
      cta: "Enter Grand Prize",
      rules: "View Official Rules",
    },
  }[lang];

  return (
    <main className="min-h-screen w-full text-white px-6 pb-24 mt-20">
      <section className="max-w-5xl mx-auto bg-white/10 p-10 rounded-2xl shadow-xl backdrop-blur-xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center">
          {t.title}
        </h1>
        <p className="text-lg md:text-xl opacity-90 text-center mb-6">
          {t.subtitle}
        </p>
        <p className="text-base md:text-lg opacity-80 text-center mb-8">
          {t.description}
        </p>

        {/* Visual placeholder for prize image / video */}
        <div className="relative w-full mx-auto aspect-[16/9] rounded-2xl bg-neutral-900 mb-8 shadow-2xl" />

        {/* Prize details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold mb-3">{t.prizeDetailsTitle}</h2>
            <ul className="list-disc pl-6 space-y-2 opacity-90">
              {t.prizeDetails.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-3">{t.howToEnterTitle}</h2>
            <ul className="list-disc pl-6 space-y-2 opacity-90">
              {t.howToEnter.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center space-y-4">
          <button className="bg-yellow-400 text-black px-10 py-4 rounded-full text-xl font-bold hover:brightness-110 shadow-lg">
            {t.cta}
          </button>

          <Link
            href={`/legal/sweepstakes-rules?lang=${lang}`}
            className="underline opacity-80 hover:text-yellow-400"
          >
            {t.rules}
          </Link>
        </div>
      </section>
    </main>
  );
}
