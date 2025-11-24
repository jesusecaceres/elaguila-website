"use client";

import React, { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------
//  OMEGA MAX — NOTICIAS HUB WITH SMART THUMBNAILS (FINAL VERSION)
// ---------------------------------------------------------------

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

  // ---------------------------------------------
  // BILINGUAL TEXT DICTIONARY
  // ---------------------------------------------
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
      breaking: "Breaking News",
    },
  };

  const L = t[lang as "es" | "en"];
  const nav = (x: string) => `${x}?lang=${lang}`;

  // -------------------------------------------------------------
  // SMART THUMBNAIL MAP — THE HEART OF VISUAL CONSISTENCY 🔥
  // -------------------------------------------------------------
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

  // When RSS does NOT provide images, use a category-based thumbnail
  const getThumbForArticle = (title: string) => {
    const low = title.toLowerCase();

    if (low.includes("deporte")) return THUMBS.deportes;
    if (low.includes("sport")) return THUMBS.deportes;

    if (low.includes("tech") || low.includes("tecnología")) return THUMBS.tecnologia;

    if (low.includes("negocio") || low.includes("business")) return THUMBS.negocios;

    if (low.includes("internacional")) return THUMBS.internacional;

    if (low.includes("cultura")) return THUMBS.cultura;

    if (low.includes("local")) return THUMBS.local;

    if (low.includes("tendencia") || low.includes("trend")) return THUMBS.tendencias;

    return THUMBS.ultimas;
  };

  // -------------------------------------------------------------
  // FETCH NEWS FROM OUR OWN BACKEND
  // -------------------------------------------------------------
  const [articles, setArticles] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any | null>(null);
  const [modal, setModal] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/rss");
        const json = await res.json();

        if (json.length > 0) {
          // Assign thumbnails if missing
          const processed = json.map((a: any) => ({
            ...a,
            img: a.img || getThumbForArticle(a.title),
          }));

          setArticles(processed);
          setFeatured(processed[0]);
        }
      } catch (err) {
        console.error("RSS load failed:", err);
      }
    })();
  }, [lang]);

  // -------------------------------------------------------------
  // PAGE UI
  // -------------------------------------------------------------
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

          {/* LEFT TABS */}
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
              alt="El Águila Logo"
              style={{
                width: "320px",
                height: "auto",
                marginTop: "135px",
                filter: "drop-shadow(0 0 45px rgba(255,215,0,0.85))",
              }}
            />
          </a>

          {/* RIGHT TABS */}
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

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-48 pb-32">

        {/* BREAKING NEWS */}
        {featured && (
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
        )}

        {/* FEATURED STORY */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="rounded-xl overflow-hidden shadow-lg cursor-pointer mb-16"
            style={{ border: "1px solid rgba(255,215,0,0.25)" }}
            onClick={() => setModal(featured)}
          >
            <img src={featured.img} className="w-full h-96 object-cover" />
            <div className="p-6">
              <h2 className="text-3xl font-extrabold text-yellow-300">{featured.title}</h2>
            </div>
          </motion.div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* FEED */}
          <div className="lg:col-span-2 space-y-8">
            {articles.slice(1).map((a: any, i: number) => (
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
                  <h3 className="text-xl font-bold text-yellow-300">{a.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-10">
            <SidebarSection title={L.tendencias} items={articles.slice(0, 6)} setModal={setModal} />
            <SidebarSection title={L.deportes} items={articles.slice(0, 6)} setModal={setModal} />
            <SidebarSection title={L.tecnologia} items={articles.slice(0, 6)} setModal={setModal} />
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
            <h2 className="text-3xl text-yellow-300 font-bold mb-4">{modal.title}</h2>
            <img src={modal.img} className="w-full h-64 object-cover rounded-lg" />
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

// -------------------------------------------------------------
// SIDEBAR COMPONENT
// -------------------------------------------------------------
function SidebarSection({
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
