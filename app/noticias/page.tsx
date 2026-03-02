"use client";

import Image from "next/image";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import newLogo from "../../public/logo.png";

type Lang = "es" | "en";

type CategoryKey =
  | "ultimas"
  | "tendencias"
  | "deportes"
  | "tecnologia"
  | "negocios"
  | "internacional"
  | "cultura"
  | "local";

export default function NoticiasPage() {
  return (
    <Suspense fallback={null}>
      <NoticiasContent />
    </Suspense>
  );
}

function NoticiasContent() {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const t = useMemo(
    () => ({
      es: {
        pageTitle: "Noticias",
        subtitle:
          "Titulares, cultura y comunidad — actualizado al momento para nuestra gente.",

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
        close: "Cerrar",
      },
      en: {
        pageTitle: "News",
        subtitle:
          "Headlines, culture, and community — updated in real time for our people.",

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
        close: "Close",
      },
    }),
    []
  );

  const L = t[lang];

  const categories = useMemo(
    () =>
      [
        { key: "ultimas" as const, label: L.ultimas },
        { key: "tendencias" as const, label: L.tendencias },
        { key: "deportes" as const, label: L.deportes },
        { key: "tecnologia" as const, label: L.tecnologia },
        { key: "negocios" as const, label: L.negocios },
        { key: "internacional" as const, label: L.internacional },
        { key: "cultura" as const, label: L.cultura },
        { key: "local" as const, label: L.local },
      ] satisfies Array<{ key: CategoryKey; label: string }>,
    [
      L.ultimas,
      L.tendencias,
      L.deportes,
      L.tecnologia,
      L.negocios,
      L.internacional,
      L.cultura,
      L.local,
    ]
  );

  const [activeCategory, setActiveCategory] = useState<CategoryKey>("ultimas");
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);

  const THUMBS: Record<CategoryKey, string> = {
    ultimas: "/thumbs/thumb_ultimas.png",
    tendencias: "/thumbs/thumb_tendencias.png",
    deportes: "/thumbs/thumb_deportes.png",
    tecnologia: "/thumbs/thumb_tecnologia.png",
    negocios: "/thumbs/thumb_negocios.png",
    internacional: "/thumbs/thumb_internacional.png",
    cultura: "/thumbs/thumb_cultura.png",
    local: "/thumbs/thumb_local.png",
  };

  const getThumbForArticle = (title: string, category: CategoryKey) => {
    const tt = (title || "").toLowerCase();

    if (tt.includes("deporte") || tt.includes("sport")) return THUMBS.deportes;
    if (tt.includes("tech") || tt.includes("tecnolog")) return THUMBS.tecnologia;
    if (tt.includes("negocio") || tt.includes("business")) return THUMBS.negocios;
    if (tt.includes("internacional")) return THUMBS.internacional;
    if (tt.includes("cultura")) return THUMBS.cultura;
    if (tt.includes("local")) return THUMBS.local;
    if (tt.includes("tendencia") || tt.includes("trend")) return THUMBS.tendencias;

    return THUMBS[category] || THUMBS.ultimas;
  };

  async function loadNews() {
    try {
      setLoading(true);

      const res = await fetch(`/api/rss?category=${activeCategory}&lang=${lang}`);
      const data = await res.json();

      const fixed = (Array.isArray(data) ? data : []).map((a: any) => ({
        ...a,
        img: a?.img || getThumbForArticle(a?.title || "", activeCategory),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, lang]);

  const featured =
    articles[0] ||
    ({
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

  return (
    <main className="min-h-screen w-full bg-black text-white">
      {/* Background glow (aesthetics only) */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(800px 420px at 50% 120px, rgba(255, 215, 0, 0.16), transparent 65%), linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.9) 55%, rgba(0,0,0,1))",
        }}
      />

      <section className="max-w-screen-2xl mx-auto px-6 pt-28 pb-24">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center mb-10"
        >
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" priority />

          <h1 className="text-5xl md:text-6xl font-bold text-yellow-400">
            {L.pageTitle}
          </h1>
          <p className="mt-4 text-gray-300 max-w-3xl mx-auto text-base md:text-lg">
            {L.subtitle}
          </p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full mb-10 rounded-2xl border border-yellow-500/35 bg-black/35 backdrop-blur px-5 py-4"
        >
          <p className="text-center font-semibold tracking-wide text-yellow-200">
            🔥 {L.breaking}: <span className="text-yellow-100">{featured.title}</span>
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-10">
          {categories.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={
                  active
                    ? "px-4 py-2 text-sm md:text-base rounded-full bg-yellow-400 text-black font-semibold border border-yellow-300"
                    : "px-4 py-2 text-sm md:text-base rounded-full border border-yellow-500/40 bg-white/6 text-white font-semibold hover:bg-white/10 transition"
                }
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="w-full text-left rounded-2xl overflow-hidden border border-yellow-500/25 bg-black/30 hover:bg-black/40 transition shadow-[0_0_0_1px_rgba(255,215,0,0.08)]"
              onClick={() => setModal(featured)}
            >
              <img
                src={featured.img}
                className="w-full h-72 md:h-80 object-cover"
                alt={featured.title}
                loading="lazy"
              />
              <div className="p-6">
                <h2 className="text-2xl md:text-3xl font-bold text-yellow-300">
                  {featured.title}
                </h2>
                <p className="mt-3 text-gray-300">{featured.desc}</p>
              </div>
            </motion.button>

            {loading && (
              <div className="rounded-2xl border border-yellow-500/20 bg-black/30 p-6">
                <p className="text-yellow-200 font-semibold">{L.cargando}</p>
              </div>
            )}

            {!loading &&
              feed.map((a, i) => (
                <motion.button
                  type="button"
                  key={`${a?.title ?? "article"}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.03, 0.18) }}
                  className="w-full text-left flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-black/25 hover:bg-black/35 transition border border-white/10"
                  onClick={() => setModal(a)}
                >
                  <img
                    src={a.img}
                    className="w-full md:w-44 h-44 md:h-28 object-cover rounded-2xl border border-white/10"
                    alt={a.title}
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-yellow-300 leading-snug">
                      {a.title}
                    </h3>
                    <p className="mt-2 text-gray-300 line-clamp-3">{a.desc}</p>
                  </div>
                </motion.button>
              ))}
          </div>

          <div className="space-y-8">
            <Sidebar title={L.tendencias} items={feed.slice(0, 6)} setModal={setModal} />
            <Sidebar title={L.deportes} items={feed.slice(0, 6)} setModal={setModal} />
            <Sidebar title={L.tecnologia} items={feed.slice(0, 6)} setModal={setModal} />
          </div>
        </div>
      </section>

      {modal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999] px-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-2xl mx-auto rounded-2xl border border-yellow-500/35 bg-black/90 backdrop-blur p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-bold text-yellow-300">
                {modal.title}
              </h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="shrink-0 px-4 py-2 rounded-full border border-yellow-500/45 bg-white/6 text-white font-semibold hover:bg-white/10 transition"
              >
                {L.close}
              </button>
            </div>

            <img
              src={modal.img}
              className="mt-5 w-full h-56 md:h-64 object-cover rounded-2xl border border-white/10"
              alt={modal.title}
              loading="lazy"
            />
            <p className="mt-4 text-gray-200">{modal.desc}</p>

            {modal.link ? (
              <a
                href={modal.link}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-5 text-yellow-300 font-semibold underline underline-offset-4 hover:text-yellow-200 transition"
              >
                {L.verMas}
              </a>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}

function Sidebar({
  title,
  items,
  setModal,
}: {
  title: string;
  items: any[];
  setModal: (value: any) => void;
}) {
  return (
    <div className="rounded-2xl border border-yellow-500/20 bg-black/25 p-5">
      <h3 className="text-xl md:text-2xl font-bold text-yellow-300 mb-4">
        {title}
      </h3>

      <div className="space-y-3">
        {items.map((a, i) => (
          <button
            type="button"
            key={`${a?.title ?? "item"}-${i}`}
            className="w-full text-left p-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
            onClick={() => setModal(a)}
          >
            <p className="text-yellow-200 font-semibold leading-snug line-clamp-3">
              {a.title}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
