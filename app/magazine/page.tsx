// app/magazine/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import newLogo from "../../public/logo.png";

export default function MagazineHubPage() {
  const params = useSearchParams();
  const lang = (params.get("lang") || "es") as "es" | "en";

  const t = {
    es: {
      title: "LEONIX Media — Revista",
      subtitle:
        "Revista de Comunidad, Cultura y Negocios. Una experiencia editorial — creada para elevar historias, familias y negocios locales con un estilo premium y limpio.",
      coverTitle: "Edición Digital — Enero 2026",
      coverText:
        "Explora una edición enfocada en comunidad, cultura y negocios locales. Sin ruido, sin clutter — solo lo esencial, bien presentado.",
      primaryCta: "Explorar la revista",
      secondaryCta: "Ver ediciones 2026",
      pillarsTitle: "Dentro de la revista",
      pillars: [
        "Negocios locales",
        "Comunidad",
        "Cultura",
        "Recetas",
        "Eventos",
        "Fe y familia",
      ],
      note:
        "A medida que publiquemos nuevas ediciones, aparecerán organizadas por año. Este hub siempre será tu punto de entrada a la revista.",
    },
    en: {
      title: "LEONIX Media — Magazine",
      subtitle:
        "A magazine for Community, Culture, and Business. An editorial-first experience — built to elevate stories, families, and local businesses with a premium, clean standard.",
      coverTitle: "Digital Edition — January 2026",
      coverText:
        "Explore an issue rooted in community, culture, and local business. No clutter — only what matters, presented with intention.",
      primaryCta: "Explore the magazine",
      secondaryCta: "View 2026 editions",
      pillarsTitle: "Inside the magazine",
      pillars: [
        "Local business",
        "Community",
        "Culture",
        "Recipes",
        "Events",
        "Faith & family",
      ],
      note:
        "As new editions are released, they’ll be organized by year. This hub will always be your entry point to the magazine.",
    },
  };

  const L = t[lang];

  return (
    <div className="bg-black text-white min-h-screen pb-32">
      {/* NAVBAR */}
      <Navbar />

      {/* HERO (match About hero standard) */}
      <div className="w-full text-center pt-28 pb-16 bg-gradient-to-b from-black via-[#2b210c] to-[#3a2c0f]">
        <Image
          src={newLogo}
          alt="LEONIX Media"
          width={320}
          className="mx-auto mb-6 drop-shadow-[0_0_18px_rgba(255,215,0,0.55)]"
          priority
        />
        <h1 className="text-5xl font-bold text-yellow-400 px-4">{L.title}</h1>
        <p className="mt-6 text-lg md:text-xl text-gray-200/90 max-w-4xl mx-auto px-6">
          {L.subtitle}
        </p>
      </div>

      {/* CONTENT */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        {/* COVER + CTA CARD */}
        <div className="flex flex-col items-center gap-10">
          <div className="flex flex-col md:flex-row items-center gap-10 w-full">
            <div className="w-56 md:w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-[0_0_35px_rgba(255,215,0,0.5)] border border-yellow-400/60 bg-black">
              {/* Keep the existing cover path to avoid breaking */}
              <img
                src="/magazine/2026/january/cover.png"
                alt="LEONIX Media Magazine — January 2026 Cover"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="text-left max-w-xl">
              <h2 className="text-3xl font-bold text-yellow-400 mb-3">
                {L.coverTitle}
              </h2>
              <p className="text-lg leading-relaxed text-gray-300 mb-6">
                {L.coverText}
              </p>

              <div className="flex flex-wrap gap-3">
                {/* Preserve your existing routes (non-breaking) */}
                <Link
                  href={`/magazine/2026/january?lang=${lang}`}
                  className="px-6 py-3 rounded-full bg-yellow-400 text-black font-semibold text-sm md:text-base shadow-lg hover:bg-yellow-300 transition"
                >
                  {L.primaryCta}
                </Link>

                <Link
                  href={`/magazine/2026?lang=${lang}`}
                  className="px-6 py-3 rounded-full border border-yellow-400/70 text-yellow-300 font-semibold text-sm md:text-base hover:bg-yellow-400/10 transition"
                >
                  {L.secondaryCta}
                </Link>
              </div>
            </div>
          </div>

          {/* PILLARS (clean editorial signals) */}
          <div className="w-full border-t border-yellow-700/20 pt-14">
            <h3 className="text-3xl font-bold text-yellow-400 mb-8 text-center">
              {L.pillarsTitle}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {L.pillars.map((item) => (
                <div
                  key={item}
                  className="bg-black/40 border border-yellow-600/25 rounded-xl px-6 py-5"
                >
                  <p className="text-lg font-semibold text-gray-200">{item}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-sm text-gray-400 text-center max-w-3xl mx-auto">
              {L.note}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
