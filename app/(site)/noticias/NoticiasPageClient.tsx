"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { NoticiasPageCopy } from "@/app/lib/siteSectionContent/noticiasPageMerge";
import {
  SUBCATEGORIES,
  articleDedupeKey,
  buildEditorialGroups,
  excludeShown,
  distinctSummary,
  formatArticleDate,
  isUsableImageSrc,
  sourceLabel,
  splitDisplayTitle,
  type CategoryKey,
  type Lang,
  type NewsArticle,
} from "./noticiasEditorialModel";

function StoryImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!isUsableImageSrc(src) || failed) return null;
  return (
    // RSS images are remote and not in next/image allowlists per provider.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`${className} object-cover`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function StoryMeta({
  source,
  date,
  category,
}: {
  source?: string;
  date?: string;
  category?: string;
}) {
  const parts = [category, source, date].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--lx-muted)]">
      {parts.join(" · ")}
    </p>
  );
}

function StoryCard({
  article,
  lang,
  categoryLabel,
  variant,
}: {
  article: NewsArticle;
  lang: Lang;
  categoryLabel?: string;
  variant: "lead" | "row" | "local" | "trend";
}) {
  const display = splitDisplayTitle(article.title);
  const title = display.headline || (lang === "es" ? "Sin título" : "Untitled");
  const source = sourceLabel(article);
  const date = formatArticleDate(article.date, lang);
  const summary = distinctSummary(article.title, article.desc);
  const className =
    variant === "lead"
      ? "group block w-full overflow-hidden rounded-md border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] text-left shadow-[0_18px_48px_rgba(42,36,22,0.08)] transition hover:border-[color:var(--lx-gold)] focus-visible:outline-none"
      : variant === "row"
        ? "group flex w-full min-h-[44px] flex-col gap-4 rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4 text-left transition hover:border-[color:var(--lx-gold)] focus-visible:outline-none md:flex-row"
        : "group block w-full min-h-[44px] rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-3 text-left transition hover:border-[color:var(--lx-gold)] focus-visible:outline-none";

  const inner =
    variant === "lead" ? (
      <>
        <StoryImage src={article.img} alt={title} className="h-64 w-full md:h-[22rem] lg:h-[26rem]" />
        <div className="space-y-3 px-5 py-6 md:px-7 md:py-7">
          <StoryMeta source={source} date={date} category={categoryLabel} />
          <h2 className="font-serif text-3xl font-bold leading-[1.12] tracking-tight text-[color:var(--lx-text)] md:text-4xl lg:text-[2.6rem]">
            {title}
          </h2>
          {summary ? (
            <p className="max-w-3xl text-base leading-relaxed text-[color:var(--lx-text-2)] md:text-lg">
              {summary}
            </p>
          ) : null}
        </div>
      </>
    ) : variant === "row" ? (
      <>
        <StoryImage
          src={article.img}
          alt={title}
          className="h-44 w-full shrink-0 rounded-sm md:h-28 md:w-44"
        />
        <div className="min-w-0 space-y-2">
          <StoryMeta source={source} date={date} category={categoryLabel} />
          <h3 className="font-serif text-lg font-bold leading-snug text-[color:var(--lx-text)] md:text-xl">
            {title}
          </h3>
          {summary ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{summary}</p>
          ) : null}
        </div>
      </>
    ) : variant === "local" ? (
      <>
        <StoryImage src={article.img} alt={title} className="mb-3 h-36 w-full rounded-sm" />
        <StoryMeta source={source} date={date} />
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-[color:var(--lx-text)]">{title}</h3>
        {summary ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{summary}</p>
        ) : null}
      </>
    ) : (
      <>
        <StoryMeta source={source} date={date} />
        <h3 className="mt-1 font-serif text-base font-semibold leading-snug text-[color:var(--lx-text)] group-hover:text-[#7A1E2C]">
          {title}
        </h3>
      </>
    );

  if (article.link) {
    return (
      <a href={article.link} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return <article className={className}>{inner}</article>;
}

export function NoticiasPageClient({ shell }: { shell: NoticiasPageCopy }) {
  const searchParams = useSearchParams();
  const lang: Lang = searchParams?.get("lang") === "en" ? "en" : "es";

  const t = useMemo(
    () => ({
      es: {
        eyebrow: "LEONIX NOTICIAS",
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
        localSupport: "Historias con señal geográfica real en este recorte.",
        more: "Más noticias",
        breaking: shell.es.breakingLabel,
        cargando: "Cargando noticias...",
        empty: "No hay historias disponibles en este momento.",
        emptyLocal: "No hay coincidencias locales verificables en este recorte.",
      },
      en: {
        eyebrow: "LEONIX NEWS",
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
        localSupport: "Stories with a real geographic signal in this slice.",
        more: "More stories",
        breaking: shell.en.breakingLabel,
        cargando: "Loading news...",
        empty: "No stories are available right now.",
        emptyLocal: "No verifiable local matches in this slice.",
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
    [L.cultura, L.deportes, L.internacional, L.local, L.negocios, L.tecnologia, L.tendencias, L.ultimas]
  );

  const [activeCategory, setActiveCategory] = useState<CategoryKey>("ultimas");
  const [activeSubcategory, setActiveSubcategory] = useState<string>(SUBCATEGORIES.ultimas[lang][0]);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const subcategories = useMemo(() => SUBCATEGORIES[activeCategory][lang], [activeCategory, lang]);
  const subcategoryNavLabel = lang === "es" ? "Subcategorías de noticias" : "News subcategories";
  const categoryNavLabel = lang === "es" ? "Categorías de noticias" : "News categories";
  const activeCategoryLabel = categories.find((cat) => cat.key === activeCategory)?.label;

  useEffect(() => {
    setActiveSubcategory(SUBCATEGORIES[activeCategory][lang][0]);
  }, [activeCategory, lang]);

  useEffect(() => {
    let cancelled = false;

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
            img: isUsableImageSrc(a.img) ? a.img.trim() : undefined,
            link: typeof a.link === "string" ? a.link : undefined,
            date: typeof a.date === "string" ? a.date : undefined,
          };
        });
        if (!cancelled) setArticles(fixed);
      } catch (err) {
        console.error("NEWS LOAD ERROR:", err);
        if (!cancelled) setArticles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNews();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeSubcategory, lang]);

  const featured = articles[0];
  const feed = articles.slice(1);
  const groups = useMemo(() => buildEditorialGroups(feed, featured), [feed, featured]);
  const moreStories = useMemo(
    () => excludeShown(feed, [...groups.trendingArticles, ...groups.localArticles]),
    [feed, groups.localArticles, groups.trendingArticles]
  );
  const showLocalSection = activeCategory !== "local";

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto w-full max-w-[88rem] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <header className="border-b border-[color:var(--lx-gold-border)] pb-6">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#7A1E2C]">{L.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl font-bold leading-none tracking-tight text-[color:var(--lx-text)] sm:text-5xl">
            {L.pageTitle}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-[color:var(--lx-text-2)] sm:text-lg">
            {L.subtitle}
          </p>
        </header>

        {featured?.title ? (
          <p
            className="mt-5 flex min-h-[44px] flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-[color:var(--lx-gold-border)] bg-[#7A1E2C]/8 px-3 py-3 text-sm sm:px-4"
            role="status"
          >
            <span className="shrink-0 font-bold uppercase tracking-[0.18em] text-[#7A1E2C]">{L.breaking}</span>
            <span className="min-w-0 font-medium text-[color:var(--lx-text)]">{featured.title}</span>
          </p>
        ) : null}

        <nav aria-label={categoryNavLabel} className="mt-6 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <div className="flex w-max min-w-0 gap-2 pb-1">
            {categories.map((cat) => {
              const active = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  aria-current={active ? "true" : undefined}
                  className={
                    active
                      ? "min-h-11 shrink-0 rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFDF7]"
                      : "min-h-11 shrink-0 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:border-[color:var(--lx-gold)]"
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </nav>

        <nav aria-label={subcategoryNavLabel} className="mt-3 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <div className="flex w-max min-w-0 gap-2 pb-1">
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
                      ? "min-h-10 shrink-0 rounded-full border border-[#7A1E2C] bg-[#7A1E2C]/10 px-3 py-1.5 text-xs font-semibold text-[#7A1E2C] sm:text-sm"
                      : "min-h-10 shrink-0 rounded-full border border-[color:var(--lx-border)] bg-transparent px-3 py-1.5 text-xs font-medium text-[color:var(--lx-text-2)] hover:border-[color:var(--lx-gold)] hover:text-[color:var(--lx-text)] sm:text-sm"
                  }
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </nav>

        {loading ? (
          <p className="mt-10 text-sm font-semibold text-[color:var(--lx-text-2)]">{L.cargando}</p>
        ) : !featured ? (
          <p className="mt-10 text-sm text-[color:var(--lx-text-2)]">{L.empty}</p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <section className="lg:col-span-8" aria-labelledby="noticias-lead-title">
                <h2 id="noticias-lead-title" className="sr-only">
                  {lang === "es" ? "Historia principal" : "Lead story"}
                </h2>
                <StoryCard article={featured} lang={lang} categoryLabel={activeCategoryLabel} variant="lead" />
              </section>

              <aside className="lg:col-span-4" aria-labelledby="noticias-trending-title">
                <h2
                  id="noticias-trending-title"
                  className="font-serif text-2xl font-bold text-[color:var(--lx-text)]"
                >
                  {L.tendencias}
                </h2>
                <ol className="mt-4 space-y-3">
                  {groups.trendingArticles.map((article, index) => (
                    <li key={articleDedupeKey(article)} className="flex gap-3">
                      <span className="mt-3 w-6 shrink-0 font-serif text-lg font-bold text-[#7A1E2C]">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <StoryCard article={article} lang={lang} variant="trend" />
                      </div>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>

            {showLocalSection ? (
              <section
                className="mt-12 rounded-md border border-[color:var(--lx-gold-border)] border-l-4 border-l-[#2A4536] bg-[color:var(--lx-section)] px-4 py-8 sm:px-6"
                aria-labelledby="noticias-local-title"
              >
                <h2 id="noticias-local-title" className="font-serif text-3xl font-bold text-[color:var(--lx-text)]">
                  {L.local}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[color:var(--lx-text-2)]">{L.localSupport}</p>
                {groups.localArticles.length === 0 ? (
                  <p className="mt-6 text-sm text-[color:var(--lx-text-2)]">{L.emptyLocal}</p>
                ) : (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {groups.localArticles.map((article) => (
                      <StoryCard key={articleDedupeKey(article)} article={article} lang={lang} variant="local" />
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            <section className="mt-12" aria-labelledby="noticias-more-title">
              <h2 id="noticias-more-title" className="font-serif text-3xl font-bold text-[color:var(--lx-text)]">
                {L.more}
              </h2>
              <div className="mt-6 space-y-4">
                {moreStories.map((article) => (
                  <StoryCard
                    key={articleDedupeKey(article)}
                    article={article}
                    lang={lang}
                    categoryLabel={activeCategoryLabel}
                    variant="row"
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
