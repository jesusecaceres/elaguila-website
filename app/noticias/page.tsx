"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

// Fetch from our own serverless API route to bypass CORS
async function getNews(lang: string) {
  try {
    const res = await fetch(`/api/rss?lang=${lang}`);
    if (!res.ok) throw new Error("RSS API failed");
    return await res.json();
  } catch (err) {
    console.error("NEWS FETCH ERROR:", err);
    return [];
  }
}

export default function NoticiasPage() {
  return (
    <Suspense fallback={null}>
      <NoticiasContent />
    </Suspense>
  );
}

function NoticiasContent() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") || "es";

  // TEXT SYSTEM
  const t = {
    es: {
      noticias: "Noticias",
      revista: "Revista",
      eventos: "Eventos",
      cupones: "Cupones",
      sorteos: "Sorteos",
      clasificados: "Clasificados",
      tienda: "Tienda",
      about: "Sobre Nosotros",
      ultimas: "Últimas",
      tendencias: "Tendencias",
      deportes: "Deportes",
      tecnologia: "Tecnología",
      negocios: "Negocios",
      internacional: "Internacional",
      cultura: "Cultura Latina",
      local: "Noticias Locales",
      breaking: "Última Hora",
    },
    en: {
      noticias: "News",
      revista: "Magazine",
      eventos: "Events",
      cupones: "Coupons",
      sorteos: "Sweepstakes",
      clasificados: "Classifieds",
      tienda: "Shop",
      about: "About Us",
      ultimas: "Latest",
      tendencias: "Trending",
      deportes: "Sports",
      tecnologia: "Tech",
      negocios: "Business",
      internacional: "International",
      cultura: "Latino Culture",
      local: "Local News",
      breaking: "Breaking",
    },
  };

  const L = t[lang as "es" | "en"];
  const nav = (p: string) => `${p}?lang=${lang}`;

  // STATE FOR LIVE NEWS
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);

  // LIVE FETCH
  useEffect(() => {
    getNews(lang).then((items) => {
      setNews(items);
      setLoading(false);
    });
  }, [lang]);

  // FEATURED ARTICLE
  const featured = news[0] || {
    title:
      lang === "es"
        ? "El Águila lanza plataforma digital 2026"
        : "El Águila launches digital platform 2026",
    img: "/featured.png",
    desc:
      lang === "es"
        ? "El nuevo hub digital llega para transformar la comunicación latina."
        : "The new digital hub arrives to transform Latino media.",
  };

  const trending = news.slice(1, 6);
  const feed = news.slice(6);

  return (
    <main className="relative min-h-screen w-full text-white">

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="fixed top-0 left-0 w-full z-50 backdrop-blur-md"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.45), rgba(0,0,0,0.35), rgba(0,0,0,0.45))",
          boxShadow: "0 0 25px rgba(255,215,0,0.35)",
          height: "96px",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-full">
          <div className="flex gap-6 text-lg font-semibold">
            <a href={nav("/noticias")} className="text-yellow-300">{L.noticias}</a>
            <a href={nav("/revista")} className="hover:text-yellow-300 transition">{L.revista}</a>
            <a href={nav("/eventos")} className="hover:text-yellow-300 transition">{L.eventos}</a>
            <a href={nav("/cupones")} className="hover:text-yellow-300 transition">{L.cupones}</a>
          </div>

          <a href={nav("/home")} className="flex justify-center items-center">
            <img
              src="/logo.png"
              alt="El Aguila Logo"
              style={{
                width: "320px",
                height: "auto",
                marginTop: "135px",
                filter: "drop-shadow(0 0 45px rgba(255,215,0,0.85))",
              }}
            />
          </a>

          <div className="flex gap-6 text-lg font-semibold">
            <a href={nav("/sorteos")} className="hover:text-yellow-300 transition">{L.sorteos}</a>
            <a href={nav("/clasificados")} className="hover:text-yellow-300 transition">{L.clasificados}</a>
            <a href={nav("/tienda")} className="hover:text-yellow-300 transition">{L.tienda}</a>
            <a href={nav("/about")} className="hover:text-yellow-300 transition">{L.about}</a>
          </div>
        </div>
      </motion.nav>

      {/* BACKGROUND OVERLAY */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.4), rgba(0,0,0,0.6))",
        }}
      />

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-48 pb-32">

        {/* BREAKING NEWS BAR */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full py-3 mb-10 rounded-lg"
          style={{
            background: "linear-gradient(to right, #FFD70033, #B8860B55)",
            border: "1px solid rgba(255,215,0,0.4)",
          }}
        >
          <p className="text-center font-bold tracking-wide text-yellow-300">
            🔥 {L.breaking}: {featured.title}
          </p>
        </motion.div>

        {/* CATEGORIES */}
        <div className="flex flex-wrap gap-4 mb-10 text-lg font-semibold">
          {[L.ultimas, L.tendencias, L.deportes, L.tecnologia, L.negocios, L.internacional, L.cultura, L.local].map(
            (cat, i) => (
              <span
                key={i}
                className="cursor-pointer px-4 py-2 rounded-full bg-white/10 hover:bg-yellow-300 hover:text-black transition border border-white/20"
              >
                {cat}
              </span>
            )
          )}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT COL */}
          <div className="lg:col-span-2 space-y-10">

            {/* FEATURED STORY */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden shadow-lg cursor-pointer"
              style={{ border: "1px solid rgba(255,215,0,0.25)" }}
              onClick={() => setModal(featured)}
            >
              <img src={featured.img} className="w-full h-80 object-cover" />
              <div className="p-6">
                <h2 className="text-3xl font-extrabold text-yellow-300 drop-shadow">{featured.title}</h2>
                <p className="mt-3 text-gray-300">{featured.desc}</p>
              </div>
            </motion.div>

            {/* FEED */}
            <div className="space-y-8">
              {loading && (
                <p className="text-yellow-300 text-xl">Cargando noticias...</p>
              )}
              {!loading &&
                feed.map((a, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-5 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer border border-white/10"
                    onClick={() => setModal(a)}
                  >
                    <img
                      src={a.img || "/featured.png"}
                      className="w-40 h-32 object-cover rounded-md"
                    />
                    <div>
                      <h3 className="text-xl font-bold text-yellow-300">{a.title}</h3>
                      <p className="text-gray-300">{a.desc}</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-10">
            <Sidebar title={L.tendencias} items={trending} setModal={setModal} />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-black/90 p-6 rounded-xl max-w-2xl mx-auto border border-yellow-500/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl text-yellow-300 font-bold drop-shadow mb-4">
              {modal.title}
            </h2>
            <img
              src={modal.img}
              className="w-full h-64 object-cover rounded-lg"
            />
            <p className="mt-4 text-gray-200 text-lg">{modal.desc}</p>
            <button
              onClick={() => setModal(null)}
              className="mt-6 px-6 py-3 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// SIDEBAR COMPONENT
function Sidebar({
  title,
  items,
  setModal,
}: {
  title: string;
  items: any[];
  setModal: any;
}) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-yellow-300 mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((a, i) => (
          <div
            key={i}
            className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 cursor-pointer"
            onClick={() => setModal(a)}
          >
            <p className="text-yellow-200 font-semibold">{a.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
