export type Lang = "es" | "en";

export type CategoryKey =
  | "ultimas"
  | "tendencias"
  | "deportes"
  | "tecnologia"
  | "negocios"
  | "internacional"
  | "cultura"
  | "local";

export type NewsArticle = {
  title?: string;
  desc?: string;
  img?: string;
  link?: string;
  date?: string;
};

export const SUBCATEGORIES: Record<CategoryKey, Record<Lang, readonly string[]>> = {
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
    es: ["El Salvador", "Honduras", "México", "Latinoamérica", "Europa", "Asia", "Migración", "Mundo"],
    en: ["El Salvador", "Honduras", "Mexico", "Latin America", "Europe", "Asia", "Migration", "World"],
  },
  cultura: {
    es: ["Música", "Comida", "Tradiciones", "Arte", "Eventos", "Familia"],
    en: ["Music", "Food", "Traditions", "Art", "Events", "Family"],
  },
  local: {
    es: ["San José", "Santa Clara", "Silicon Valley", "Área de la Bahía", "Comunidad"],
    en: ["San Jose", "Santa Clara County", "Silicon Valley", "Bay Area", "Community"],
  },
};

const SIDEBAR_LIMIT = 6;

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

/** Place-name evidence only — California / Latino / community / immigration are not enough. */
const LOCAL_KEYWORDS = [
  "san jose",
  "san josé",
  "santa clara",
  "silicon valley",
  "sunnyvale",
  "mountain view",
  "cupertino",
  "milpitas",
  "los gatos",
  "morgan hill",
  "gilroy",
  "palo alto",
  "bay area",
  "area de la bahia",
  "área de la bahía",
  "east bay",
  "south bay",
  "condado de santa clara",
  "santa clara county",
] as const;

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

export function articleDedupeKey(article: NewsArticle): string {
  const link = (article.link || "").trim();
  if (link) return `link:${link}`;
  return `title:${(article.title || "").trim().toLowerCase()}`;
}

export function isSameArticle(a: NewsArticle, b: NewsArticle): boolean {
  return articleDedupeKey(a) === articleDedupeKey(b);
}

export function isUsableImageSrc(src: unknown): src is string {
  if (typeof src !== "string") return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed);
}

export function splitDisplayTitle(title?: string): { headline: string; publisher?: string } {
  const raw = (title || "").trim();
  if (!raw) return { headline: "" };
  const idx = raw.lastIndexOf(" - ");
  if (idx <= 0) return { headline: raw };
  const publisher = raw.slice(idx + 3).trim();
  const headline = raw.slice(0, idx).trim();
  if (!headline || !publisher || publisher.length > 80) return { headline: raw };
  return { headline, publisher };
}

export function sourceHostFromLink(link?: string): string | undefined {
  if (!link) return undefined;
  try {
    const host = new URL(link).hostname.replace(/^www\./, "");
    return host || undefined;
  } catch {
    return undefined;
  }
}

export function sourceLabel(article: NewsArticle): string | undefined {
  const fromTitle = splitDisplayTitle(article.title).publisher;
  if (fromTitle) return fromTitle;
  const host = sourceHostFromLink(article.link);
  if (!host || host === "news.google.com" || host.endsWith(".google.com")) return undefined;
  return host;
}

export function distinctSummary(title?: string, desc?: string): string | undefined {
  if (!desc?.trim()) return undefined;
  const headline = splitDisplayTitle(title).headline;
  const nTitle = normalizeMatchText(headline);
  const nDesc = normalizeMatchText(desc);
  if (!nTitle) return desc.trim();
  if (nDesc === nTitle || nDesc.startsWith(nTitle)) return undefined;
  return desc.trim();
}

export function formatArticleDate(raw: string | undefined, lang: Lang): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsed);
  } catch {
    return undefined;
  }
}

export function buildEditorialGroups(feed: NewsArticle[], featured?: NewsArticle, limit = SIDEBAR_LIMIT) {
  const pool = featured ? feed.filter((article) => !isSameArticle(article, featured)) : [...feed];
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

  const trendingMatched = takeMatched(TRENDING_KEYWORDS);
  const trendingArticles =
    trendingMatched.length > 0
      ? [...trendingMatched, ...takeFallback(Math.max(0, limit - trendingMatched.length))]
      : takeFallback(limit);

  return {
    trendingArticles,
    localArticles: takeMatched(LOCAL_KEYWORDS),
  };
}

export function excludeShown(feed: NewsArticle[], shown: NewsArticle[]): NewsArticle[] {
  const keys = new Set(shown.map(articleDedupeKey));
  return feed.filter((article) => !keys.has(articleDedupeKey(article)));
}
