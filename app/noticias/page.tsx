"use client";

import React, { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { fetchLiveNews, NewsArticle } from "@/app/lib/news";

// ------------------------------------------------------------
// NOTICIAS — OMEGA MAX LIVE VERSION
// ------------------------------------------------------------
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

  // Bilingual text
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
      categorias: "Categorías",
      ultimas: "Últimas",
      tendencias: "Tendencias",
      deportes: "Deportes",
      tecnologia: "Tecnología",
      negocios: "Negocios",
      internacional: "Internacional",
      cultura: "Cultura Latina",
      local: "Noticias Locales",
      breaking: "Última Hora",
      cargando: "Cargando noticias...",
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
      categorias: "Categories",
      ultimas: "Latest",
      tendencias: "Trending",
      deportes: "Sports",
      tecnologia: "Tech",
      negocios: "Business",
      internacional: "International",
      cultura: "Latino Culture",
      local: "Local News",
      breaking: "Breaking",
      cargando: "Loading news...",
    },
  };

  const L = t[lang as "es" | "en"];
  const nav = (p: string) => `${p}?lang=${lang}`;

  // ------------------------------------------------------------
  // FETCH LIVE NEWS
  // ------------------------------------------------------------
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const news = await fetchLiveNews(30);
      setArticles(news);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="pt-48 text-center text-yellow-300 text-3xl font-bold">
        {L.cargando}
      </div>
    );
  }

  // Featured story = first article
  const featured = articles[0];
  const trending = articles.slice(1, 6);
  const sports = articles.slice(6, 11);
  const alerts = articles.slice(11, 15);

  const [modal, setModal] = useState<NewsArticle | null>(null);

  // ------------------------------------------------------------
  // PAGE RENDER
  // ------------------------------------------------------------
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
            <a href={nav("/revista")} className="hover:text-yellow-300">{L.revista}</a>
            <a href={nav("/eventos")} className="hover:text-yellow-300">{L.eventos}</a>
            <a href={nav("/cupones")} className="hover:text-yellow-300">{L.cupones}</a>
          </div>

          {/* CENTER LOGO */}
          <a href={nav("/home")} className="flex justify-center items-center">
            <img
              src="/logo.png"
              style={{
                width: "320px",
                marginTop: "135px",
                filter: "drop-shadow(0 0 45px rgba(255,215,0,0.85))",
              }}
            />
          </a>

          <div className="flex gap-6 text-lg font-semibold">
            <a href={nav("/sorteos")} className="hover:text-yellow-300">{L.sorteos}</a>
            <a href={nav("/clasificados")} className="hover:text-yellow-300">{L.clasificados}</a>
            <a href={nav("/tienda")} className="hover:text-yellow-300">{L.tienda}</a>
            <a href={nav("/about")} className="hover:text-yellow-300">{L.about}</a>
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

        {/* BREAKING TICKER */}
        <div
          className="w-full py-3 mb-10 rounded-lg"
          style={{
            background: "linear-gradient(to right, #FFD70033, #B8860B55)",
            border: "1px solid rgba(255,215,0,0.4)",
          }}
        >
          <p className="text-center font-bold text-yellow-300">
            🔥 {L.breaking}: {featured?.title}
          </p>
        </div>

        {/* CATEGORIES */}
        <div className="flex flex-wrap gap-4 mb-10 text-lg font-semibold">
          {[L.ultimas, L.tendencias, L.deportes, L.tecnologia, L.negocios, L.internacional, L.cultura, L.local].map((cat, i) => (
            <span key={i} className="px-4 py-2 rounded-full bg-white/10 border border-white/20">
              {cat}
            </span>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-10">

            {/* FEATURED */}
            {featured && (
              <div
                className="rounded-xl overflow-hidden border border-yellow-500/30 cursor-pointer"
                onClick={() => setModal(featured)}
              >
                <img src={featured.img} className="w-full h-80 object-cover" />
                <div className="p-6">
                  <h2 className="text-3xl font-extrabold text-yellow-300">
                    {featured.title}
                  </h2>
                  <p className="text-gray-300 mt-3">{featured.desc}</p>
                </div>
              </div>
            )}

            {/* LIVE FEED */}
            <div className="space-y-8">
              {articles.map((a) => (
                <div
                  key={a.id}
                  className="flex gap-5 p-4 rounded-lg bg-white/5 border border-white/10 cursor-pointer"
                  onClick={() => setModal(a)}
                >
                  <img src={a.img} className="w-40 h-32 object-cover rounded-md" />
                  <div>
                    <h3 className="text-xl font-bold text-yellow-300">{a.title}</h3>
                    <p className="text-gray-300">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-10">
            <Sidebar title={L.tendencias} items={trending} setModal={setModal} />
            <Sidebar title={L.deportes} items={sports} setModal={setModal} />
            <Sidebar title="Alerts" items={alerts} setModal={setModal} />
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
            className="bg-black/90 p-6 rounded-xl max-w-2xl border border-yellow-500/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl text-yellow-300 mb-4">{modal.title}</h2>
            <img src={modal.img} className="w-full h-64 object-cover rounded-lg" />
            <p className="mt-4 text-gray-200">{modal.desc}</p>
            <a
              href={modal.url}
              target="_blank"
              className="block mt-4 text-yellow-400 underline font-bold"
            >
              Ver artículo completo →
            </a>
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
  items: NewsArticle[];
  setModal: (a: NewsArticle) => void;
}) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-yellow-300 mb-4">{title}</h3>
      <div className="space-y-4">
        {items.map((a) => (
          <div
            key={a.id}
            className="p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer"
            onClick={() => setModal(a)}
          >
            <p className="text-yellow-200 font-semibold">{a.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
