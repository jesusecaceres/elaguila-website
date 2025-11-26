"use client";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Week01() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      title: "Sorteo Semanal – Semana 01",
      desc: "Participa en el sorteo de esta semana. ¡Totalmente gratis!",
      prize: "Premio de la Semana",
      btn: "Entrar al Sorteo →",
      rules: "Reglas del Sorteo",
    },
    en: {
      title: "Weekly Mega Giveaway – Week 01",
      desc: "Enter this week's giveaway. Completely free!",
      prize: "This Week's Prize",
      btn: "Enter to Win →",
      rules: "Giveaway Rules",
    }
  }[lang];

  return (
    <main className="min-h-screen w-full text-white px-6 pb-24">
      <section className="max-w-5xl mx-auto mt-20 text-center">
        <h1 className="text-5xl font-extrabold mb-4">{t.title}</h1>
        <p className="text-lg opacity-80 mb-6">{t.desc}</p>

        <h2 className="text-3xl font-bold mb-4">{t.prize}</h2>

        <div className="relative w-full max-w-2xl mx-auto aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl mb-8 bg-neutral-800"></div>

        <Link href="#" className="px-10 py-4 bg-yellow-400 text-black font-bold text-xl rounded-full shadow-xl hover:bg-yellow-300 transition">
          {t.btn}
        </Link>

        <div className="mt-16 bg-white/10 p-6 rounded-2xl backdrop-blur-xl shadow-xl text-left">
          <h3 className="text-2xl font-bold mb-4">{t.rules}</h3>
          <ul className="list-disc pl-6 opacity-80 space-y-2">
            {lang === "es" ? (
              <>
                <li>1 entrada por persona.</li>
                <li>Debe tener 18+ años.</li>
                <li>El ganador será anunciado el lunes.</li>
              </>
            ) : (
              <>
                <li>1 entry per person.</li>
                <li>Must be 18+ years old.</li>
                <li>Winner will be announced Monday.</li>
              </>
            )}
          </ul>
        </div>
      </section>
    </main>
  );
}
