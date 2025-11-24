"use client";

import React, { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------
// OMEGA MAX — NOTICIAS HUB V3 (LIVE RSS + JSON FALLBACK + MAGAZINE UI)
// ---------------------------------------------------------------------

export default function NoticiasPage() {
  return (
    <Suspense fallback={null}>
      <NoticiasContent />
    </Suspense>
  );
}

function NoticiasContent() {
  const searchParams = useSearchParams();
  const lang = (searchParams.get("lang") || "es") as "es" | "en";

  const [jsonData, setJsonData] = useState<any>(null);   // fallback JSON
  const [rssData, setRssData] = useState<any[]>([]);     // live RSS
  const [category, setCategory] = useState<string>("all");
  const [modal, setModal] = useState<any>(null);

  // -------------------------------------------------------------------
  // LOAD JSON FALLBACK
  // -------------------------------------------------------------------
  useEffect(() => {
    fetch("/data/news.json")
      .then((r) => r.json())
      .then((j) => setJsonData(j));
  }, []);

  // -------------------------------------------------------------------
  // LOAD LIVE RSS NEWS
  // -------------------------------------------------------------------
  useEffect(() => {
    fetch(`/api/rss?lang=${lang}`)
      .then((r) => r.json())
      .then((j) => setRssData(j.articles));
  }, [lang]);

  if (!jsonData) return null;

  const featured = jsonData.featured;

  // MERGE JSON + RSS
  const allArticles = [
    ...jsonData.articles,
    ...rssData.map((a, i) => ({
      id: 1000 + i,
      title: { es: a.title, en: a.title },
      desc: { es: a.desc, en: a.desc },
      img: a.img,
      link: a.link,
      category: "tendencias"
    }))
  ];

  // FILTER ARTICLES
  const filtered =
    category === "all"
      ? allArticles
      : allArticles.filter((a) => a.category === category);

  // TRANSLATIONS
  const L = {
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
      breaking: "Última Hora"
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
      breaking: "Breaking"
    }
  }[lang];

  const nav = (p: string) => `${p}?lang=${lang}`;

  return (
    <main className="relative min-h-screen w-full text-white">

      {/* CINEMATIC BACKGROUND */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('/cinema-flags-final-v2.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(6px) brightness(0.35)"
        }}
      />

      {/* SOFT GOLD OVERLAY */}
      <div
        className="fixed inset-0 -z-[5]"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.65))"
        }}
      />

      {/* NAVBAR */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.55), rgba(0,0,0,0.45), rgba(0,0,0,0.55))",
          boxShadow: "0 0 25px rgba(255,215,0,0.35)",
          height: "96px"
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-full">
          <div className="flex gap-6 text-lg font-semibold">
            <a href={nav("/noticias")} className="text-yellow-300">{L.noticias}</a>
            <a href={nav("/revista")} className="hover:text-yellow-300">{L.revista}</a>
            <a href={nav("/eventos")} className="hover:text-yellow-300">{L.eventos}</a>
            <a href={nav("/cupones")} className="hover:text-yellow-300">{L.cupones}</a>
          </div>

          <a href={nav("/home")} className="flex justify-center items-center">
            <img
              src="/logo.png"
              className="w-[320px]"
              style={{
                marginTop: "135px",
                filter: "drop-shadow(0 0 45px rgba(255,215,0,0.85))"
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

      {/* MAIN CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-48 pb-32">

        {/* BREAKING TICKER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full py-3 mb-10 rounded-lg backdrop-blur-md"
          style={{
            background: "linear-gradient(to right, #FFD70033, #B8860B55)",
            border: "1px solid rgba(255,215,0,0.4)"
          }}
        >
          <p className="text-center font-bold tracking-wide text-yellow-300">
            🔥 {L.breaking}: {featured.title[lang]}
          </p>
        </motion.div>

        {/* CATEGORIES */}
        <h2 className="text-3xl font-extrabold text-yellow-300 mb-6">{L.categorias}</h2>
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            { key: "all", label: L.ultimas },
            { key: "tendencias", label: L.tendencias },
            { key: "deportes", label: L.deportes },
            { key: "tecnologia", label: L.tecnologia },
            { key: "negocios", label: L.negocios },
            { key: "internacional", label: L.internacional },
            { key: "cultura", label: L.cultura },
            { key: "local", label: L.local }
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-5 py-2 rounded-full border text-sm font-bold transition ${
                category === cat.key
                  ? "bg-yellow-300 text-black border-yellow-300"
                  : "bg-white/10 text-white border-white/20 hover:bg-yellow-300 hover:text-black"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-10">

            {/* FEATURED STORY */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden shadow-2xl backdrop-blur-md"
              style={{ border: "1px solid rgba(255,215,0,0.25)" }}
              onClick={() => setModal(featured)}
            >
              <img src={featured.img} className="w-full h-80 object-cover" />
              <div className="p-6 bg-black/60 backdrop-blur-md">
                <h2 className="text-3xl font-extrabold text-yellow-300 drop-shadow">
                  {featured.title[lang]}
                </h2>
                <p className="mt-3 text-gray-300">{featured.desc[lang]}</p>
              </div>
            </motion.div>

            {/* FEED */}
            {filtered.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-5 p-4 rounded-xl backdrop-blur-md bg-white/5 hover:bg-white/10 transition cursor-pointer border border-white/10"
                onClick={() => setModal(a)}
              >
                <img
                  src={a.img}
                  className="w-40 h-32 object-cover rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-bold text-yellow-300">
                    {a.title[lang]}
                  </h3>
                  <p className="text-gray-300">{a.desc[lang]}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="space-y-10">
            <SidebarSection
              title={L.tendencias}
              items={allArticles.slice(0, 5)}
              lang={lang}
              setModal={setModal}
            />
            <SidebarSection
              title={L.deportes}
              items={allArticles.filter((a) => a.category === "deportes")}
              lang={lang}
              setModal={setModal}
            />
            <SidebarSection
              title={L.tecnologia}
              items={allArticles.filter((a) => a.category === "tecnologia")}
              lang={lang}
              setModal={setModal}
            />
          </div>
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[999]"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-black/90 p-6 rounded-xl max-w-2xl mx-auto border border-yellow-500/40 backdrop-blur-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl text-yellow-300 font-bold drop-shadow mb-4">
              {modal.title[lang]}
            </h2>
            <img
              src={modal.img}
              className="w-full h-64 object-cover rounded-lg"
            />
            <p className="mt-4 text-gray-200 text-lg">{modal.desc[lang]}</p>

            <div className="text-right mt-6">
              <button
                onClick={() => setModal(null)}
                className="px-6 py-3 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------
// SIDEBAR COMPONENT
// ---------------------------------------------------------------------
function SidebarSection({ title, items, lang, setModal }: any) {
  return (
    <div>
      <h3 className="text-2xl font-bold text-yellow-300 mb-4">{title}</h3>
      <div className="space-y-4">
        {items.slice(0, 4).map((a) => (
          <div
            key={a.id}
            className="p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 cursor-pointer"
            onClick={() => setModal(a)}
          >
            <p className="text-yellow-200 font-semibold">{a.title[lang]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
