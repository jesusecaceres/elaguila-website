"use client";

import React, { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

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

  /* -------------------------------
     BILINGUAL TEXT
  --------------------------------*/
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
      cargando: "Cargando noticias...",
      verMas: "Ver artículo completo →",
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
      cargando: "Loading news...",
      verMas: "Read full article →",
    },
  };

  const L = t[lang as "es" | "en"];
  const nav = (p: string) => `${p}?lang=${lang}`;

  /* -------------------------------
     CATEGORY BUTTONS
  --------------------------------*/
  const categories = [
    { key: "ultimas", label: L.ultimas },
    { key: "tendencias", label: L.tendencias },
    { key: "deportes", label: L.deportes },
    { key: "tecnologia", label: L.tecnologia },
    { key: "negocios", label: L.negocios },
    { key: "internacional", label: L.internacional },
    { key: "cultura", label: L.cultura },
    { key: "local", label: L.local },
  ];

  const [activeCategory, setActiveCategory] = useState("ultimas");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);

  /* -------------------------------
     CATEGORY → THUMBNAIL MAP
  --------------------------------*/
  const THUMBS: Record<string, string> = {
    ultimas: "/thumbs/thumb_ultimas.png",
    tendencias: "/thumbs/thumb_tendencias.png",
    deportes: "/thumbs/thumb_deportes.png",
    tecnologia: "/thumbs/thumb_tecnologia.png",
    negocios: "/thumbs/thumb_negocios.png",
    internacional: "/thumbs/thumb_internacional.png",
    cultura: "/thumbs/thumb_cultura.png",
    local: "/thumbs/thumb_local.png",
  };

  const getThumbForArticle = (title: string, category: string) => {
    const t = title.toLowerCase();

    if (t.includes("deporte") || t.includes("sport")) return THUMBS.deportes;
    if (t.includes("tech") || t.includes("tecnología")) return THUMBS.tecnologia;
    if (t.includes("negocio") || t.includes("business")) return THUMBS.negocios;
    if (t.includes("internacional")) return THUMBS.internacional;
    if (t.includes("cultura")) return THUMBS.cultura;
    if (t.includes("local")) return THUMBS.local;
    if (t.includes("tendencia") || t.includes("trend")) return THUMBS.tendencias;

    // fallback to category
    return THUMBS[category] || THUMBS.ultimas;
  };

  /* -------------------------------
     LOAD NEWS FROM BACKEND
  --------------------------------*/
  async function loadNews() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/rss?category=${activeCategory}&lang=${lang}`
      );
      const data = await res.json();

      const fixed = data.map((a: any) => ({
        ...a,
        img: a.img || getThumbForArticle(a.title, activeCategory),
      }));

      setArticles(fixed);
    } catch (err) {
      console.error("NEWS LOAD ERROR:", err);
      setArticles([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNews();
  }, [activeCategory, lang]);

  /* -------------------------------
     FEATURED ARTICLE
  --------------------------------*/
  const featured =
    articles[0] || ({
      title:
        lang === "es"
          ? "El Águila lanza nueva plataforma digital"
          : "El Águila launches new digital platform",
      img: "/featured.png",
      desc:
        lang === "es"
          ? "Noticias en vivo, cultura y comunidad en un solo lugar."
          : "Live news, culture and community in one place.",
    } as any);

  const feed = articles.slice(1);

  /* -------------------------------
     PAGE UI
  --------------------------------*/
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
          {/* LEFT */}
          <div className="flex gap-6 text-lg font-semibold">
            <a href={nav("/noticias")} className="text-yellow-300">{L.noticias}</a>
            <a href={nav("/revista")} className="hover:text-yellow-300">{L.revista}</a>
            <a href={nav("/eventos")} className="hover:text-yellow-300">{L.eventos}</a>
            <a href={nav("/cupones")} className="hover:text-yellow-300">{L.cupones}</a>
          </div>

          {/* LOGO */}
          <a href={nav("/home")} className="flex justify-center items-center">
            <img
              src="/logo.png"
              alt="El Águila Logo"
              style={{
                width: "320px",
                height: "auto",
                marginTop: "135px",
                filter: "drop-shadow(0 0 45px rgba(255,215,0,0.85))",
              }}
            />
          </a>

          {/* RIGHT */}
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

      {/* MAIN */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-48 pb-32">

        {/* BREAKING */}
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

        {/* CATEGORY TABS */}
        <div className="flex flex-wrap gap-4 mb-10 text-lg font-semibold">
          {categories.map((cat) => (
            <span
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`cursor-pointer px-4 py-2 rounded-full border transition ${
                activeCategory === cat.key
                  ? "bg-yellow-300 text-black border-yellow-400"
                  : "bg-white/10 hover:bg-yellow-300 hover:text-black border-white/20"
              }`}
            >
              {cat.label}
            </span>
          ))}
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-10">

            {/* FEATURED */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl overflow-hidden shadow-lg cursor-pointer"
              style={{ border: "1px solid rgba(255,215,0,0.25)" }}
              onClick={() => setModal(featured)}
            >
              <img
                src={featured.img}
                className="w-full h-80 object-cover"
              />
              <div className="p-6">
                <h2 className="text-3xl font-extrabold text-yellow-300">
                  {featured.title}
                </h2>
                <p className="mt-3 text-gray-300">{featured.desc}</p>
              </div>
            </motion.div>

            {/* FEED */}
            {loading && <p className="text-yellow-300 text-xl">{L.cargando}</p>}

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
                    src={a.img}
                    className="w-40 h-32 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-yellow-300">
                      {a.title}
                    </h3>
                    <p className="text-gray-300">{a.desc}</p>
                  </div>
                </motion.div>
              ))}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-10">
            <Sidebar title={L.tendencias} items={feed.slice(0, 6)} setModal={setModal} />
            <Sidebar title={L.deportes} items={feed.slice(0, 6)} setModal={setModal} />
            <Sidebar title={L.tecnologia} items={feed.slice(0, 6)} setModal={setModal} />
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
            <h2 className="text-3xl text-yellow-300 mb-4">{modal.title}</h2>
            <img
              src={modal.img}
              className="w-full h-64 object-cover rounded-lg"
            />
            <p className="mt-4 text-gray-200">{modal.desc}</p>
            <a
              href={modal.link}
              target="_blank"
              className="block mt-4 text-yellow-400 underline font-bold"
            >
              {L.verMas}
            </a>
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------
   SIDEBAR COMPONENT
--------------------------------*/
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
