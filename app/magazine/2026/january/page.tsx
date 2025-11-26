"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function January2026() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "en";

  const t = {
    title: "January 2026 Magazine",
    description: "Explore the January 2026 edition of El Águila.",
    pagesTitle: "Magazine Pages",
    videosTitle: "Featured Videos",
    couponsTitle: "Coupons",
    sweepstakesTitle: "Enter Sweepstakes",
    sweepstakesButton: "Enter Now",
  };

  const pages = [
    "/magazine/2026/january/cover.jpg",
    "/magazine/2026/january/page1.jpg",
    "/magazine/2026/january/page2.jpg",
    "/magazine/2026/january/page3.jpg",
  ];

  return (
    <main className="w-full min-h-screen pt-28 px-4 md:px-10 pb-20 text-white">
      <div className="max-w-4xl mx-auto space-y-16">

        <h1 className="text-4xl font-bold drop-shadow-lg text-center">
          {t.title}
        </h1>
        <p className="text-center text-lg opacity-90">{t.description}</p>

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

        <section>
          <h2 className="text-2xl font-bold mb-6">{t.couponsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 p-6 rounded-xl shadow-xl border border-white/10">
              <h3 className="text-xl font-bold mb-2">50% OFF</h3>
              <p className="opacity-80">Demo coupon — replace later.</p>
            </div>
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-2xl font-bold mb-6">{t.sweepstakesTitle}</h2>
          <a
            href="/sorteos?lang=en"
            className="inline-block bg-gold text-black font-bold px-10 py-4 rounded-full shadow-xl hover:scale-105 transition"
          >
            {t.sweepstakesButton}
          </a>
        </section>

      </div>
    </main>
  );
}
