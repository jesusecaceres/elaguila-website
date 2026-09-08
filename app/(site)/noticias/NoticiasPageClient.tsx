"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { NoticiasPageCopy } from "@/app/lib/siteSectionContent/noticiasPageMerge";
import {
  SUBCATEGORIES,
  articleDedupeKey,
  composeHomepageFeed,
  excludeShown,
  distinctSummary,
  formatArticleDate,
  isUsableArticleLink,
  isUsableImageSrc,
  sourceLabel,
  splitDisplayTitle,
  type CategoryKey,
  type Lang,
  type NewsArticle,
} from "./noticiasEditorialModel";

/** Restrained masthead dateline: coverage geography + today's date, localized at render time. */
function buildPublicationLine(lang: Lang): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = get("weekday");
  const day = get("day");
  const month = get("month");
  const dateLabel = lang === "en" ? `${weekday}, ${month} ${day}` : `${weekday} ${day} de ${month}`;
  const geo = lang === "en" ? "San Jose · Bay Area" : "San José · Área de la Bahía";
  return `${geo} · ${dateLabel}`;
}

/** Both `/api/rss` (active feed) and the independent Local feed (Gate 4) return the same raw
 * shape and need the same trust boundary applied to it -- shared here so that boundary can't
 * drift between the two call sites. */
function normalizeArticles(data: unknown): NewsArticle[] {
  return (Array.isArray(data) ? data : []).map((raw: unknown) => {
    const a = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const title = typeof a.title === "string" ? a.title : "";
    return {
      title,
      desc: typeof a.desc === "string" ? a.desc : undefined,
      img: isUsableImageSrc(a.img) ? a.img.trim() : undefined,
      link: isUsableArticleLink(a.link) ? a.link.trim() : undefined,
      date: typeof a.date === "string" ? a.date : undefined,
    };
  });
}

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
    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--lx-muted)]">
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
  variant: "lead" | "row" | "local" | "trend" | "compact";
}) {
  const display = splitDisplayTitle(article.title);
  const title = display.headline || (lang === "es" ? "Sin título" : "Untitled");
  const source = sourceLabel(article);
  const date = formatArticleDate(article.date, lang);
  const summary = distinctSummary(article.title, article.desc);
  // The site ships a global accessible focus ring (:where(a, button, input, select,
  // textarea):focus-visible { outline: none; box-shadow: 0 0 0 3px var(--lx-focus-ring) }), but
  // verified live in-browser it does not reliably win the box-shadow property on these story
  // links specifically (confirmed via computed style: box-shadow stays at its zero-value default
  // on focus even with no competing ring/shadow utility present) -- while it works correctly on
  // plainer elements elsewhere on the page. Rather than depend on that, set the same ring
  // directly as a single arbitrary-property declaration (bypassing Tailwind's multi-layer ring
  // composition, which doesn't compose cleanly across combined ring-* utilities either) with `!`
  // so it always wins, guaranteeing keyboard focus is visible on every story link.
  const focusRing =
    "focus-visible:outline-none focus-visible:[box-shadow:0_0_0_3px_var(--lx-focus-ring)]!";
  const className =
    variant === "lead"
      ? `group block w-full overflow-hidden rounded-md border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] text-left shadow-[0_18px_48px_rgba(42,36,22,0.08)] transition hover:border-[color:var(--lx-gold)] ${focusRing}`
      : variant === "row"
        ? `group flex w-full min-h-[44px] flex-col gap-4 rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4 text-left transition hover:border-[color:var(--lx-gold)] md:flex-row ${focusRing}`
        : variant === "compact"
          ? `group flex min-h-11 w-full flex-col gap-1.5 rounded-sm border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-3 text-left transition hover:border-[color:var(--lx-gold)] hover:bg-[color:var(--lx-section)] ${focusRing}`
          : variant === "trend"
            ? `group block w-full min-h-[44px] text-left transition ${focusRing}`
            : `group block w-full min-h-[44px] rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-3 text-left transition hover:border-[color:var(--lx-gold)] ${focusRing}`;

  const inner =
    variant === "lead" ? (
      <>
        <StoryImage src={article.img} alt={title} className="h-64 w-full md:h-[22rem] lg:h-[26rem]" />
        <div className="space-y-3 px-5 py-6 md:px-7 md:py-7">
          {!isUsableImageSrc(article.img) ? (
            <div className="h-1 w-12 rounded-full bg-[#7A1E2C]" aria-hidden="true" />
          ) : null}
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
    ) : variant === "compact" ? (
      <>
        <h3 className="font-serif text-[0.95rem] font-semibold leading-snug text-[color:var(--lx-text)] group-hover:text-[#7A1E2C]">
          {title}
        </h3>
        <StoryMeta source={source} date={date} category={categoryLabel} />
      </>
    ) : (
      <>
        <h3 className="font-serif text-base font-bold leading-snug text-[color:var(--lx-text)] group-hover:text-[#7A1E2C]">
          {title}
        </h3>
        <div className="mt-1.5">
          <StoryMeta source={source} date={date} />
        </div>
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

export function NoticiasPageClient({ shell, lang }: { shell: NoticiasPageCopy; lang: Lang }) {

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
        localSupport: "San José · Santa Clara · Área de la Bahía",
        more: "Más noticias",
        breaking: shell.es.breakingLabel,
        cargando: "Cargando noticias...",
        empty: "No hay historias disponibles en este momento.",
        unavailable: "No pudimos cargar las noticias en este momento. Intenta de nuevo en unos minutos.",
        emptyLocal: "No hay coincidencias locales verificables en este recorte.",
        editorialNote:
          "Leonix Noticias selecciona y organiza historias de distintas fuentes informativas en español e inglés. Cada historia enlaza directamente a la fuente original.",
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
        localSupport: "San Jose · Santa Clara · Bay Area",
        more: "More stories",
        breaking: shell.en.breakingLabel,
        cargando: "Loading news...",
        empty: "No stories are available right now.",
        unavailable: "We couldn't load the news right now. Please try again in a few minutes.",
        emptyLocal: "No verifiable local matches in this slice.",
        editorialNote:
          "Leonix News curates and organizes stories from news sources in Spanish and English. Every story links directly to its original source.",
      },
    }),
    [shell]
  );

  const L = t[lang];

  // Computed client-side only (after mount) to avoid an SSR/client date or
  // timezone mismatch on hydration; empty on first paint is intentional.
  const [publicationLine, setPublicationLine] = useState("");
  useEffect(() => {
    setPublicationLine(buildPublicationLine(lang));
  }, [lang]);

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
  const [unavailable, setUnavailable] = useState(false);

  const subcategories = useMemo(() => SUBCATEGORIES[activeCategory][lang], [activeCategory, lang]);
  const subcategoryNavLabel = lang === "es" ? "Subcategorías de noticias" : "News subcategories";
  const categoryNavLabel = lang === "es" ? "Categorías de noticias" : "News categories";
  const activeCategoryLabel = categories.find((cat) => cat.key === activeCategory)?.label;

  useEffect(() => {
    setActiveSubcategory(SUBCATEGORIES[activeCategory][lang][0]);
  }, [activeCategory, lang]);

  useEffect(() => {
    // A primary-category click updates activeCategory first; the separate reset effect above
    // then updates activeSubcategory to that category's default on the following render. For
    // the one render in between, activeSubcategory is still the OLD category's value (e.g.
    // category="tecnologia" paired with subcategory="NFL"), which is not a real selection and
    // would otherwise cost a wasted /api/rss request. Skip it -- the reset effect's render will
    // re-run this effect with a valid pairing right after.
    const validSubcategories: readonly string[] = SUBCATEGORIES[activeCategory][lang];
    if (!validSubcategories.includes(activeSubcategory)) {
      return;
    }

    let cancelled = false;

    async function loadNews() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/rss?category=${activeCategory}&subcategory=${encodeURIComponent(activeSubcategory)}&lang=${lang}`
        );
        const data = await res.json();
        const fixed = normalizeArticles(data);
        if (!cancelled) {
          setArticles(fixed);
          // A 503 from /api/rss means every upstream feed failed for this exact selection (see
          // route.ts) -- a temporary outage, not a genuinely empty result. Distinguish it so the
          // empty state can say so truthfully instead of implying there is simply no news.
          setUnavailable(!res.ok);
        }
      } catch (err) {
        console.error("NEWS LOAD ERROR:", err);
        if (!cancelled) {
          setArticles([]);
          setUnavailable(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNews();
    return () => {
      cancelled = true;
    };
  }, [activeCategory, activeSubcategory, lang]);

  // Owner-QA Gate 4 (2026-09-03): the homepage Local News module used to derive its content by
  // keyword-scanning whatever feed happened to be active (Sports selected -> Local scanned Sports
  // articles for place names) -- so it was almost never genuinely local. It now fetches its own
  // independent dataset from the same /api/rss endpoint (no new API), keyed only on `lang` so
  // switching category/subcategory (Sports -> NFL -> Soccer) never re-triggers it; the existing
  // s-maxage CDN cache already makes repeat mount-time fetches for the same lang cheap.
  const [localArticles, setLocalArticles] = useState<NewsArticle[]>([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [localUnavailable, setLocalUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadLocalNews() {
      try {
        setLocalLoading(true);
        const localSubcategory = SUBCATEGORIES.local[lang][0];
        const res = await fetch(
          `/api/rss?category=local&subcategory=${encodeURIComponent(localSubcategory)}&lang=${lang}`
        );
        const data = await res.json();
        const fixed = normalizeArticles(data);
        if (!cancelled) {
          setLocalArticles(fixed);
          setLocalUnavailable(!res.ok);
        }
      } catch (err) {
        console.error("LOCAL NEWS LOAD ERROR:", err);
        if (!cancelled) {
          setLocalArticles([]);
          setLocalUnavailable(true);
        }
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    }

    loadLocalNews();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const featured = articles[0];
  const feed = articles.slice(1);
  const composed = useMemo(() => composeHomepageFeed(feed, featured), [feed, featured]);
  const showLocalSection = activeCategory !== "local";

  // Independent Local results occasionally overlap with what's already visible in the active
  // feed (e.g. a San Jose story surfaces in both the Local feed and a broader Latest search) --
  // drop those duplicates using the same dedupe key the rest of the page already uses.
  const shownElsewhere = useMemo(
    () => [
      ...(featured ? [featured] : []),
      ...composed.supportArticles,
      ...composed.trendingArticles,
      ...composed.richMoreStories,
      ...composed.compactMoreStories,
    ],
    [featured, composed]
  );
  const dedupedLocalArticles = useMemo(
    () => excludeShown(localArticles, shownElsewhere),
    [localArticles, shownElsewhere]
  );
  const localFeature = dedupedLocalArticles[0];
  const localSupport = dedupedLocalArticles.slice(1, 4);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[color:var(--lx-page)] text-[color:var(--lx-text)]">
      <div className="mx-auto w-full max-w-[88rem] px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <header className="border-b border-[color:var(--lx-gold-border)] pb-6 text-center md:text-left">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[#7A1E2C]">{L.eyebrow}</p>
          <h1 className="mt-2 font-serif text-4xl font-bold leading-none tracking-tight text-[color:var(--lx-text)] sm:text-5xl">
            {L.pageTitle}
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-base leading-relaxed text-[color:var(--lx-text-2)] sm:text-lg md:mx-0">
            {L.subtitle}
          </p>
          {publicationLine ? (
            <p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--lx-muted)]">
              {publicationLine}
            </p>
          ) : null}
        </header>

        {/* Gated on !loading: `articles` still holds the PREVIOUS selection's results while a
            new category/subcategory fetch is in flight, so showing this unconditionally could
            flash the old selection's headline labeled as the new selection's top story. */}
        {!loading && featured?.title ? (
          <p
            className="mt-5 flex min-h-[44px] flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-[color:var(--lx-gold-border)] bg-[#7A1E2C]/8 px-3 py-3 text-sm sm:px-4"
            role="status"
          >
            <span className="shrink-0 font-bold uppercase tracking-[0.18em] text-[#7A1E2C]">{L.breaking}</span>
            <span className="min-w-0 font-medium text-[color:var(--lx-text)]">{featured.title}</span>
          </p>
        ) : null}

        {/* Owner-QA Gate 3: mobile keeps the original horizontal-scroll pill rail unchanged; at
            md+ these become a centered publication section bar (underline tabs, shared bottom
            rule) instead of a row of filter-style bubbles, so the primary categories read as
            LEONIX NEWS's actual sections rather than a search filter. */}
        <nav aria-label={categoryNavLabel} className="mt-6">
          <div className="flex w-max min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] md:w-full md:flex-wrap md:justify-center md:gap-x-7 md:gap-y-2 md:overflow-visible md:border-b md:border-[color:var(--lx-border)] md:pb-0">
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
                      ? "min-h-11 shrink-0 rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-semibold text-[#FFFDF7] md:rounded-none md:border-b-2 md:border-[#7A1E2C] md:bg-transparent md:px-1 md:pb-3 md:tracking-wide md:text-[#7A1E2C]"
                      : "min-h-11 shrink-0 rounded-full border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-card)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:border-[color:var(--lx-gold)] md:rounded-none md:border-none md:border-b-2 md:border-transparent md:bg-transparent md:px-1 md:pb-3 md:tracking-wide md:hover:border-[color:var(--lx-gold-border)]"
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </nav>

        <nav aria-label={subcategoryNavLabel} className="mt-3">
          <div className="flex w-max min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] md:w-full md:flex-wrap md:justify-center md:overflow-visible">
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
                      ? "min-h-10 shrink-0 rounded-full border border-[#7A1E2C]/40 bg-[#7A1E2C]/8 px-3 py-1.5 text-xs font-semibold text-[#7A1E2C] sm:text-sm"
                      : "min-h-10 shrink-0 rounded-full border border-transparent px-3 py-1.5 text-xs font-medium text-[color:var(--lx-muted)] hover:text-[color:var(--lx-text)] sm:text-sm"
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
          <p className="mt-10 text-sm text-[color:var(--lx-text-2)]">{unavailable ? L.unavailable : L.empty}</p>
        ) : (
          <>
            {/* Owner-QA Gate 1: the lead story is followed by its own subordinate support grid
                (same left column) instead of sharing a CSS grid row with the much-taller Trending
                list -- that mismatch was the giant dead-space bug: the row's height was set by
                Trending, and nothing filled the gap under a short (imageless) lead. */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
              <section className="lg:col-span-8" aria-labelledby="noticias-lead-title">
                <h2 id="noticias-lead-title" className="sr-only">
                  {lang === "es" ? "Historia principal" : "Lead story"}
                </h2>
                <StoryCard article={featured} lang={lang} categoryLabel={activeCategoryLabel} variant="lead" />
                {composed.supportArticles.length > 0 ? (
                  <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {composed.supportArticles.map((article) => (
                      <StoryCard
                        key={articleDedupeKey(article)}
                        article={article}
                        lang={lang}
                        categoryLabel={activeCategoryLabel}
                        variant="local"
                      />
                    ))}
                  </div>
                ) : null}
              </section>

              <aside
                className="border-t border-[color:var(--lx-gold-border)] pt-5 lg:col-span-4 lg:border-l lg:border-t-0 lg:border-[color:var(--lx-border)] lg:pl-8 lg:pt-0"
                aria-labelledby="noticias-trending-title"
              >
                <h2
                  id="noticias-trending-title"
                  className="font-serif text-2xl font-bold text-[color:var(--lx-text)]"
                >
                  {L.tendencias}
                </h2>
                <ol className="mt-4 divide-y divide-[color:var(--lx-border)]">
                  {composed.trendingArticles.map((article, index) => (
                    <li key={articleDedupeKey(article)} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                      <span className="w-7 shrink-0 font-serif text-lg font-bold leading-none text-[#7A1E2C]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <StoryCard article={article} lang={lang} variant="trend" />
                      </div>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>

            {/* Owner-QA Gate 4/5: independently fetched (see the loadLocalNews effect above), not
                a keyword scan of whatever feed is currently active -- so Local genuinely shows
                local news on Sports, Tech, or any other category, not just when Local itself is
                selected. */}
            {showLocalSection ? (
              <section
                className="mt-14 rounded-md border border-[color:var(--lx-gold-border)] border-l-4 border-l-[#2A4536] bg-[color:var(--lx-section)] px-4 py-6 sm:px-6"
                aria-labelledby="noticias-local-title"
              >
                <h2 id="noticias-local-title" className="font-serif text-3xl font-bold text-[color:var(--lx-text)]">
                  {L.local}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-[color:var(--lx-text-2)]">{L.localSupport}</p>
                {localLoading ? (
                  <p className="mt-6 text-sm text-[color:var(--lx-text-2)]">{L.cargando}</p>
                ) : !localFeature ? (
                  <p className="mt-6 text-sm text-[color:var(--lx-text-2)]">
                    {localUnavailable ? L.unavailable : L.emptyLocal}
                  </p>
                ) : (
                  <div className="mt-6 space-y-4">
                    <StoryCard article={localFeature} lang={lang} variant="row" />
                    {localSupport.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {localSupport.map((article) => (
                          <StoryCard key={articleDedupeKey(article)} article={article} lang={lang} variant="local" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </section>
            ) : null}

            {/* Owner-QA Gate 2: two intentionally-designed density tiers all the way down --
                Tier A stays the existing rich row cards; Tier B (previously bare divide-y rows
                that read as raw database output at scale) is now a contained two-column card
                grid using the same restrained surface/border language as the rest of the page. */}
            <section
              className="mt-14 border-t border-[color:var(--lx-gold-border)] pt-8"
              aria-labelledby="noticias-more-title"
            >
              <h2 id="noticias-more-title" className="font-serif text-3xl font-bold text-[color:var(--lx-text)]">
                {L.more}
              </h2>
              <div className="mt-6 space-y-4">
                {composed.richMoreStories.map((article) => (
                  <StoryCard
                    key={articleDedupeKey(article)}
                    article={article}
                    lang={lang}
                    categoryLabel={activeCategoryLabel}
                    variant="row"
                  />
                ))}
              </div>
              {composed.compactMoreStories.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {composed.compactMoreStories.map((article) => (
                    <StoryCard
                      key={articleDedupeKey(article)}
                      article={article}
                      lang={lang}
                      categoryLabel={activeCategoryLabel}
                      variant="compact"
                    />
                  ))}
                </div>
              ) : null}
            </section>

            <p className="mt-14 border-t border-[color:var(--lx-gold-border)] pt-6 text-xs leading-relaxed text-[color:var(--lx-muted)]">
              {L.editorialNote}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
