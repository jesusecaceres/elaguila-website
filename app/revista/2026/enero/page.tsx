"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function Enero2026() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "es";

  // Spanish text content
  const t = {
    title: "Revista Enero 2026",
    description: "Explora la edición de enero 2026 de El Águila.",
    pagesTitle: "Páginas de la Revista",
    videosTitle: "Videos Destacados",
    couponsTitle: "Cupones",
    sweepstakesTitle: "Participa en Sorteos",
    sweepstakesButton: "Entrar al Sorteo",
  };

  // Placeholder magazine pages inside public folder
  const pages = [
    "/revista/2026/enero/cover.jpg",
    "/revista/2026/enero/page1.jpg",
    "/revista/2026/enero/page2.jpg",
    "/revista/2026/enero/page3.jpg",
  ];

  return (
    <main className="w-full min-h-screen pt-28 px-4 md:px-10 pb-20 text-white">
      <div className="max-w-4xl mx-auto space-y-16">

        {/* TITLE */}
        <h1 className="text-4xl font-bold drop-shadow-lg text-center">
          {t.title}
        </h1>
        <p className="text-center text-lg opacity-90">{t.description}</p>

        {/* MAGAZINE PAGES */}
        <section>
          <h2 className="text-2xl font-bold mb-6">{t.pagesTitle}</h2>
          <div className="space-y-10">
            {pages.map((src, index) => (
              <div key={index} className="w-full rounded-xl overflow-hidden shadow-xl">
                <Image
                  src={src}
                  alt={`Magazine Page ${index + 1}`}
                  width={1080}
                  height={1600}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            ))}
          </div>
        </section>

        {/* VIDEOS SECTION */}
        <section>
          <h2 className="text-2xl font-bold mb-6">{t.videosTitle}</h2>
          <div className="space-y-6">
            <iframe
              className="w-full rounded-xl shadow-xl aspect-video"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              allowFullScreen
            ></iframe>
          </div>
        </section>

        {/* COUPONS SECTION */}
        <section>
          <h2 className="text-2xl font-bold mb-6">{t.couponsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 p-6 rounded-xl shadow-xl border border-white/10">
              <h3 className="text-xl font-bold mb-2">50% OFF</h3>
              <p className="opacity-80">Cupón de prueba — Reemplazar después.</p>
            </div>
          </div>
        </section>

        {/* SWEEPSTAKES */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-6">{t.sweepstakesTitle}</h2>
          <a
            href="/sorteos?lang=es"
            className="inline-block bg-gold text-black font-bold px-10 py-4 rounded-full shadow-xl hover:scale-105 transition"
          >
            {t.sweepstakesButton}
          </a>
        </section>

      </div>
    </main>
  );
}
