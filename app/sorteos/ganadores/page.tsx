"use client";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function WinnersPage() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";

  const t = {
    es: {
      title: "Ganadores",
      weekly: "Ganador Semanal",
      grand: "Ganador del Premio Mayor",
      past: "Ganadores Pasados",
      coming: "Próximamente",
    },
    en: {
      title: "Winners",
      weekly: "Weekly Winner",
      grand: "Grand Prize Winner",
      past: "Past Winners",
      coming: "Coming Soon",
    }
  }[lang];

  const sampleWeekly = {
    name: "Carla M.",
    city: "San José, CA",
    prize: lang === "es" ? "Tarjeta de Regalo $50" : "$50 Gift Card",
  };

  const sampleGrand = {
    name: "Luis R.",
    city: "Gilroy, CA",
    prize: lang === "es" ? "Laptop Samsung" : "Samsung Laptop",
  };

  const pastWinners = [
    { name: "Erik C.", city: "San José, CA" },
    { name: "Brenda R.", city: "Sunnyvale, CA" },
    { name: "Mario L.", city: "Morgan Hill, CA" }
  ];

  return (
    <main className="min-h-screen w-full text-white px-6 pb-24">

      <h1 className="text-5xl font-extrabold text-center mt-20 mb-12">{t.title}</h1>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">

        <div className="bg-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t.weekly}</h2>

          <div className="relative w-full max-w-sm mx-auto aspect-[4/5] rounded-xl overflow-hidden shadow-xl bg-neutral-800 mb-4"></div>

          <p className="text-xl font-semibold">{sampleWeekly.name}</p>
          <p className="opacity-80 mb-2">{sampleWeekly.city}</p>
          <p className="font-bold text-yellow-400">{sampleWeekly.prize}</p>
        </div>

        <div className="bg-white/10 p-6 rounded-2xl shadow-xl backdrop-blur-xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t.grand}</h2>

          <div className="relative w-full max-w-sm mx-auto aspect-[4/5] rounded-xl overflow-hidden shadow-xl bg-neutral-800 mb-4"></div>

          <p className="text-xl font-semibold">{sampleGrand.name}</p>
          <p className="opacity-80 mb-2">{sampleGrand.city}</p>
          <p className="font-bold text-yellow-400">{sampleGrand.prize}</p>
        </div>

      </section>

      <section className="max-w-6xl mx-auto mt-20">
        <h2 className="text-3xl font-bold mb-8 text-center">{t.past}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {pastWinners.map((w, i) => (
            <div key={i} className="bg-white/10 p-5 rounded-2xl shadow-xl text-center">
              <p className="text-xl font-semibold">{w.name}</p>
              <p className="opacity-80">{w.city}</p>
            </div>
          ))}

          <div className="bg-white/5 p-5 rounded-2xl text-center border border-white/10">
            <p className="opacity-60">{t.coming}</p>
          </div>
        </div>
      </section>

    </main>
  );
}
