"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import newLogo from "../../../public/logo.png";
import type { NoticiasPageCopy } from "@/app/lib/siteSectionContent/noticiasPageMerge";

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

type NewsArticle = {
  title?: string;
  desc?: string;
  img?: string;
  link?: string;
};

const SUBCATEGORIES: Record<CategoryKey, Record<Lang, readonly string[]>> = {
  ultimas: {
    es: ["Última hora", "Estados Unidos", "Mundo", "Comunidad", "Lo más visto"],
    en: ["Breaking", "U.S.", "World", "Community", "Most read"],
  },
  tendencias: {
    es: ["Viral", "Redes sociales", "Celebridades", "Comunidad", "Opinión"],
    en: ["Viral", "Social media", "Celebrities", "Community", "Opinion"],
  },
  deportes: {
    es: ["NFL", "NBA", "MLB", "NHL", "Fútbol", "Boxeo", "NCAA"],
    en: ["NFL", "NBA", "MLB", "NHL", "Soccer", "Boxing", "NCAA"],
  },
  tecnologia: {
    es: ["IA", "Móviles", "Apps", "Internet", "Negocios tech", "Seguridad"],
    en: ["AI", "Mobile", "Apps", "Internet", "Tech business", "Security"],
  },
  negocios: {
    es: ["Emprendedores", "Economía", "Mercado", "Pequeños negocios", "Finanzas"],
    en: ["Entrepreneurs", "Economy", "Markets", "Small business", "Finance"],
  },
  internacional: {
    es: [
      "El Salvador",
      "Honduras",
      "México",
      "Latinoamérica",
      "Europa",
      "Asia",
      "Migración",
      "Mundo",
    ],
    en: [
      "El Salvador",
      "Honduras",
      "Mexico",
      "Latin America",
      "Europe",
      "Asia",
      "Migration",
      "World",
    ],
  },
  cultura: {
    es: ["Música", "Comida", "Tradiciones", "Arte", "Eventos", "Familia"],
    en: ["Music", "Food", "Traditions", "Art", "Events", "Family"],
  },
  local: {
    es: ["Pensilvania", "Filadelfia", "Negocios locales", "Eventos", "Comunidad"],
    en: ["Pennsylvania", "Philadelphia", "Local business", "Events", "Community"],
  },
};

const SIDEBAR_LIMIT = 6;

const SPORTS_KEYWORDS = [
  "nba",
  "nfl",
  "mlb",
  "nhl",
  "ncaa",
  "soccer",
  "futbol",
  "fútbol",
  "boxeo",
  "boxing",
  "playoffs",
  "playoff",
  "league",
  "liga",
  "team",
  "equipo",
  "partido",
  "match",
  "deportes",
  "sports",
  "basketball",
  "baloncesto",
  "baseball",
  "beisbol",
  "béisbol",
  "hockey",
  "futbol americano",
  "football",
] as const;

const TECH_KEYWORDS = [
  "ai",
  "ia",
  "inteligencia artificial",
  "artificial intelligence",
  "tecnologia",
  "tecnología",
  "technology",
  "tech",
  "app",
  "apps",
  "aplicacion",
  "aplicación",
  "mobile",
  "movil",
  "móvil",
  "smartphone",
  "internet",
  "security",
  "seguridad",
  "ciberseguridad",
  "cybersecurity",
  "software",
  "hardware",
  "google",
  "apple",
  "microsoft",
  "startup",
] as const;

const LOCAL_KEYWORDS = [
  "pennsylvania",
  "pensilvania",
  "philadelphia",
  "filadelfia",
  "lancaster",
  "reading",
  "allentown",
  "comunidad",
  "community",
  "local",
  "locales",
  "inmigracion",
  "inmigración",
  "immigration",
  "migration",
  "migracion",
  "migración",
  "negocio local",
  "local business",
  "small business",
  "pequeños negocios",
  "hispanic",
  "latino",
  "latina",
  "hispana",
] as const;

const TRENDING_KEYWORDS = [
  "viral",
  "trending",
  "tendencia",
  "tendencias",
  "breaking",
  "ultima hora",
  "última hora",
  "most read",
  "lo mas visto",
  "lo más visto",
  "redes sociales",
  "social media",
  "celebridad",
  "celebrity",
] as const;

type SidebarArticleGroups = {
  trendingArticles: NewsArticle[];
  localArticles: NewsArticle[];
  sportsArticles: NewsArticle[];
  techArticles: NewsArticle[];
};

function normalizeMatchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function articleText(article: NewsArticle): string {
  return normalizeMatchText(`${article.title || ""} ${article.desc || ""}`);
}

function matchesKeywords(text: string, keywords: readonly string[]): boolean {
  if (keywords.length === 0) return false;
  return keywords.some((keyword) => text.includes(normalizeMatchText(keyword)));
}

function articleDedupeKey(article: NewsArticle): string {
  const link = (article.link || "").trim();
  if (link) return `link:${link}`;
  return `title:${(article.title || "").trim().toLowerCase()}`;
}

function isSameArticle(a: NewsArticle, b: NewsArticle): boolean {
  return articleDedupeKey(a) === articleDedupeKey(b);
}

function buildSidebarGroups(
  feed: NewsArticle[],
  featured?: NewsArticle,
  limit = SIDEBAR_LIMIT
): SidebarArticleGroups {
  const pool = featured
    ? feed.filter((article) => !isSameArticle(article, featured))
    : [...feed];

  const usedKeys = new Set<string>();

  const takeMatched = (keywords: readonly string[]): NewsArticle[] => {
    const matched: NewsArticle[] = [];
    for (const article of pool) {
      if (matched.length >= limit) break;
      const key = articleDedupeKey(article);
      if (usedKeys.has(key)) continue;
      if (!matchesKeywords(articleText(article), keywords)) continue;
      matched.push(article);
      usedKeys.add(key);
    }
    return matched;
  };

  const takeFallback = (count: number): NewsArticle[] => {
    const fallback: NewsArticle[] = [];
    for (const article of pool) {
      if (fallback.length >= count) break;
      const key = articleDedupeKey(article);
      if (usedKeys.has(key)) continue;
      fallback.push(article);
      usedKeys.add(key);
    }
    return fallback;
  };

  const fillSection = (keywords: readonly string[]): NewsArticle[] => {
    const matched = takeMatched(keywords);
    if (matched.length >= limit) return matched;
    return [...matched, ...takeFallback(limit - matched.length)];
  };

  const trendingMatched = takeMatched(TRENDING_KEYWORDS);
  const trendingArticles =
    trendingMatched.length > 0
      ? [...trendingMatched, ...takeFallback(Math.max(0, limit - trendingMatched.length))]
      : takeFallback(limit);

  return {
    trendingArticles,
    localArticles: fillSection(LOCAL_KEYWORDS),
    sportsArticles: fillSection(SPORTS_KEYWORDS),
    techArticles: fillSection(TECH_KEYWORDS),
  };
}

export function NoticiasPageClient({ shell }: { shell: NoticiasPageCopy }) {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const t = useMemo(
    () => ({
      es: {
        pageTitle: shell.es.pageTitle,
        subtitle: shell.es.subtitle,
        ultimas: "Últimas",
        tendencias: "Tendencias",
        deportes: "Deportes",
        tecnologia: "Tecnología",
        negocios: "Negocios",
        internacional: "Internacional",
        cultura: "Cultura Latina",
        local: "Noticias Locales",
        breaking: shell.es.breakingLabel,
        cargando: "Cargando noticias...",
        verMas: "Ver artículo completo →",
        close: "Cerrar",
      },
      en: {
        pageTitle: shell.en.pageTitle,
        subtitle: shell.en.subtitle,
        ultimas: "Latest",
        tendencias: "Trending",
        deportes: "Sports",
        tecnologia: "Tech",
        negocios: "Business",
        internacional: "International",
        cultura: "Latino Culture",
        local: "Local News",
        breaking: shell.en.breakingLabel,
        cargando: "Loading news...",
        verMas: "Read full article →",
        close: "Close",
      },
    }),
    [shell]
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
  const [activeSubcategory, setActiveSubcategory] = useState<string>(
    SUBCATEGORIES.ultimas[lang][0]
  );
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<NewsArticle | null>(null);

  const subcategories = useMemo(
    () => SUBCATEGORIES[activeCategory][lang],
    [activeCategory, lang]
  );

  const subcategoryNavLabel =
    lang === "es" ? "Subcategorías de noticias" : "News subcategories";

  useEffect(() => {
    setActiveSubcategory(SUBCATEGORIES[activeCategory][lang][0]);
  }, [activeCategory, lang]);

  const THUMBS: Record<CategoryKey, string> = {
    ultimas: "/el-aguila/public/images/news/ultimas.jpg",
    tendencias: "/el-aguila/public/images/news/tendencias.jpg",
    deportes: "/el-aguila/public/images/news/deportes.jpg",
    tecnologia: "/el-aguila/public/images/news/tecnologia.jpg",
    negocios: "/el-aguila/public/images/news/negocios.jpg",
    internacional: "/el-aguila/public/images/news/internacional.jpg",
    cultura: "/el-aguila/public/images/news/cultura-latina.jpg",
    local: "/el-aguila/public/images/news/noticias-locales.jpg",
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

  const isUsableImageSrc = (src: unknown): src is string => {
    if (typeof src !== "string") return false;
    const trimmed = src.trim();
    if (!trimmed) return false;
    return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed);
  };

  const resolveArticleImage = (apiImg: unknown, title: string, category: CategoryKey) =>
    isUsableImageSrc(apiImg) ? apiImg.trim() : getThumbForArticle(title, category);

  const onArticleImageError = (
    event: React.SyntheticEvent<HTMLImageElement>,
    title: string,
    category: CategoryKey
  ) => {
    const el = event.currentTarget;
    const fallback = getThumbForArticle(title, category);
    if (!el.src.endsWith(fallback)) {
      el.src = fallback;
    }
  };

  async function loadNews() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/rss?category=${activeCategory}&subcategory=${encodeURIComponent(activeSubcategory)}&lang=${lang}`
      );
      const data = await res.json();

      const fixed: NewsArticle[] = (Array.isArray(data) ? data : []).map((raw: unknown) => {
        const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
        const title = typeof a.title === "string" ? a.title : "";
        return {
          title,
          desc: typeof a.desc === "string" ? a.desc : undefined,
          img: resolveArticleImage(a.img, title, activeCategory),
          link: typeof a.link === "string" ? a.link : undefined,
        };
      });

      setArticles(fixed);
    } catch (err) {
      console.error("NEWS LOAD ERROR:", err);
      setArticles([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNews();
  }, [activeCategory, activeSubcategory, lang]);

  const featured: NewsArticle =
    articles[0] ||
    {
      title:
        lang === "es"
          ? "Leonix Media amplía su plataforma digital 2026"
          : "Leonix Media expands its digital platform in 2026",
      img: "/featured.png",
      desc:
        lang === "es"
          ? "Noticias en vivo, cultura y comunidad en un solo lugar."
          : "Live news, culture and community in one place.",
    };

  const feed = articles.slice(1);

  const sidebarGroups = useMemo(
    () => buildSidebarGroups(feed, articles.length > 0 ? articles[0] : undefined),
    [feed, articles]
  );

  return (
    <main
      className="min-h-screen w-full text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.22), transparent 55%),
          radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.55), transparent 52%),
          radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.10), transparent 50%)
        `,
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <section className="max-w-screen-2xl mx-auto px-6 pt-28 pb-24">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="text-center mb-10"
        >
          <Image src={newLogo} alt="LEONIX" width={320} className="mx-auto mb-6" priority />

          <h1 className="text-5xl md:text-6xl font-bold text-[color:var(--lx-text)]">{L.pageTitle}</h1>
          <p className="mt-4 text-[color:var(--lx-text-2)]/85 max-w-3xl mx-auto text-base md:text-lg">{L.subtitle}</p>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-full mb-10 rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/70 backdrop-blur px-5 py-4 shadow-[0_14px_34px_rgba(42,36,22,0.08)]"
        >
          <p className="text-center font-semibold tracking-wide text-[color:var(--lx-text-2)]">
            🔥 {L.breaking}: <span className="text-[color:var(--lx-text)]">{featured.title}</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap justify-center gap-3 md:gap-4 mb-4 max-w-full"
        >
          {categories.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.key);
                  setActiveSubcategory(SUBCATEGORIES[cat.key][lang][0]);
                }}
                className={
                  active
                    ? "px-4 py-2 text-sm md:text-base rounded-full bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)] font-semibold border border-[color:var(--lx-nav-border)]"
                    : "px-4 py-2 text-sm md:text-base rounded-full border border-[color:var(--lx-nav-border)] bg-white/60 text-[color:var(--lx-text)] font-semibold hover:bg-white/80 transition"
                }
              >
                {cat.label}
              </button>
            );
          })}
        </motion.div>

        <div className="w-full max-w-full overflow-hidden mb-10">
          <nav
            aria-label={subcategoryNavLabel}
            className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          >
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex flex-nowrap gap-2 pb-1 w-max max-w-none md:w-full md:max-w-full md:flex-wrap md:justify-center min-w-0"
            >
              {subcategories.map((sub) => {
                const active = activeSubcategory === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setActiveSubcategory(sub)}
                    aria-current={active ? "true" : undefined}
                    className={
                      active
                        ? "shrink-0 px-3 py-1.5 text-xs md:text-sm rounded-full bg-[color:var(--lx-nav-active)] text-[color:var(--lx-text)] font-semibold border border-[color:var(--lx-gold)] shadow-[0_2px_10px_rgba(201,164,74,0.18)]"
                        : "shrink-0 px-3 py-1.5 text-xs md:text-sm rounded-full border border-[color:var(--lx-nav-border)] bg-white/55 text-[color:var(--lx-text-2)] font-medium hover:bg-white/80 hover:text-[color:var(--lx-text)] transition"
                    }
                  >
                    {sub}
                  </button>
                );
              })}
            </motion.div>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="w-full text-left rounded-2xl overflow-hidden border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] hover:bg-white/90 transition shadow-[0_18px_48px_rgba(42,36,22,0.10)]"
              onClick={() => setModal(featured)}
            >
              <img
                src={featured.img}
                className="w-full h-72 md:h-80 object-cover"
                alt={featured.title}
                loading="lazy"
                onError={(e) => onArticleImageError(e, featured.title || "", activeCategory)}
              />
              <div className="p-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[color:var(--lx-text)]">{featured.title}</h2>
                <p className="mt-3 text-[color:var(--lx-text-2)]/85">{featured.desc}</p>
              </div>
            </motion.button>

            {loading && (
              <div className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/70 p-6">
                <p className="text-[color:var(--lx-text-2)] font-semibold">{L.cargando}</p>
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
                  className="w-full text-left flex flex-col md:flex-row gap-4 p-4 rounded-2xl bg-[color:var(--lx-card)]/70 hover:bg-[color:var(--lx-card)] transition border border-[color:var(--lx-nav-border)] shadow-[0_10px_34px_rgba(42,36,22,0.06)]"
                  onClick={() => setModal(a)}
                >
                  <img
                    src={a.img}
                    className="w-full md:w-44 h-44 md:h-28 object-cover rounded-2xl border border-black/10"
                    alt={a.title}
                    loading="lazy"
                    onError={(e) => onArticleImageError(e, a.title || "", activeCategory)}
                  />
                  <div className="min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-[color:var(--lx-text)] leading-snug">{a.title}</h3>
                    <p className="mt-2 text-[color:var(--lx-text-2)]/85 line-clamp-3">{a.desc}</p>
                  </div>
                </motion.button>
              ))}
          </div>

          <div className="min-w-0 max-w-full space-y-8">
            <Sidebar title={L.tendencias} items={sidebarGroups.trendingArticles} setModal={setModal} />
            <Sidebar title={L.local} items={sidebarGroups.localArticles} setModal={setModal} />
            <Sidebar title={L.deportes} items={sidebarGroups.sportsArticles} setModal={setModal} />
            <Sidebar title={L.tecnologia} items={sidebarGroups.techArticles} setModal={setModal} />
          </div>
        </div>
      </section>

      {modal && (
        <div
          className="fixed inset-0 bg-black/45 flex items-center justify-center z-[999] px-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-2xl mx-auto rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] backdrop-blur p-6 shadow-[0_22px_70px_rgba(42,36,22,0.22)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl md:text-3xl font-bold text-[color:var(--lx-text)]">{modal.title}</h2>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="shrink-0 px-4 py-2 rounded-full border border-[color:var(--lx-nav-border)] bg-white/60 text-[color:var(--lx-text)] font-semibold hover:bg-white/80 transition"
              >
                {L.close}
              </button>
            </div>

            <img
              src={modal.img}
              className="mt-5 w-full h-56 md:h-64 object-cover rounded-2xl border border-black/10"
              alt={modal.title}
              loading="lazy"
              onError={(e) => onArticleImageError(e, modal.title || "", activeCategory)}
            />
            <p className="mt-4 text-[color:var(--lx-text-2)]/90">{modal.desc}</p>

            {modal.link ? (
              <a
                href={modal.link}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-5 text-[color:var(--lx-text)] font-semibold underline decoration-[color:var(--lx-gold)] underline-offset-4 hover:text-[color:var(--lx-gold)] transition"
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
  items: NewsArticle[];
  setModal: (value: NewsArticle) => void;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/70 p-5 shadow-[0_14px_34px_rgba(42,36,22,0.08)]">
      <h3 className="text-xl md:text-2xl font-bold text-[color:var(--lx-text)] mb-4">{title}</h3>

      <div className="space-y-3">
        {items.map((a, i) => (
          <button
            type="button"
            key={`${articleDedupeKey(a)}-${i}`}
            className="w-full text-left p-3 rounded-2xl border border-black/10 bg-white/60 hover:bg-white/80 transition"
            onClick={() => setModal(a)}
          >
            <p className="text-[color:var(--lx-text-2)] font-semibold leading-snug line-clamp-3">{a.title}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
