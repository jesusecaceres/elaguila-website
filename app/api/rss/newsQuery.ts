export type Lang = "es" | "en";

export function normalizeSubcategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function googleNewsRssUrl(query: string, lang: Lang): string {
  const hl = lang === "en" ? "en" : "es";
  const ceid = lang === "en" ? "US:en" : "US:es";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=US&ceid=${ceid}`;
}

export function buildSearchQuery(category: string, subcategory: string, lang: Lang): string {
  const sub = normalizeSubcategory(subcategory);
  const latino =
    lang === "es" ? "comunidad latina hispana" : "Latino Hispanic community";

  if (category === "deportes") {
    const sports: Record<string, { es: string; en: string }> = {
      nfl: {
        es: "NFL fútbol americano noticias última hora",
        en: "NFL football news latest",
      },
      nba: { es: "NBA baloncesto noticias", en: "NBA basketball news" },
      mlb: { es: "MLB béisbol noticias", en: "MLB baseball news" },
      nhl: { es: "NHL hockey noticias", en: "NHL hockey news" },
      futbol: {
        es: "fútbol soccer noticias latinoamérica",
        en: "soccer MLS Liga MX FIFA CONCACAF Latino -NFL -gridiron",
      },
      soccer: {
        es: "fútbol soccer noticias latinoamérica",
        en: "soccer MLS Liga MX FIFA CONCACAF Latino -NFL -gridiron",
      },
      boxeo: { es: "boxeo noticias", en: "boxing news" },
      boxing: { es: "boxeo noticias", en: "boxing news" },
      ncaa: { es: "NCAA deportes universitarios", en: "NCAA college sports news" },
    };
    if (sports[sub]) return sports[sub][lang];
    return lang === "es"
      ? `${subcategory} deportes ${latino}`
      : `${subcategory} sports ${latino}`;
  }

  if (category === "tecnologia") {
    const tech: Record<string, { es: string; en: string }> = {
      ia: {
        es: "inteligencia artificial IA tecnología noticias",
        en: "artificial intelligence AI technology news",
      },
      ai: {
        es: "inteligencia artificial IA tecnología noticias",
        en: "artificial intelligence AI technology news",
      },
      moviles: {
        es: "móviles smartphones tecnología noticias",
        en: "mobile smartphones technology news",
      },
      mobile: {
        es: "móviles smartphones tecnología noticias",
        en: "mobile smartphones technology news",
      },
      apps: {
        es: "aplicaciones apps tecnología noticias",
        en: "mobile apps technology news",
      },
      internet: {
        es: "internet tecnología redes noticias",
        en: "internet technology web news",
      },
      "negocios tech": {
        es: "negocios tecnología startups emprendedores",
        en: "tech business startups entrepreneurs",
      },
      "tech business": {
        es: "negocios tecnología startups emprendedores",
        en: "tech business startups entrepreneurs",
      },
      seguridad: {
        es: "ciberseguridad tecnología noticias",
        en: "cybersecurity technology news",
      },
      security: {
        es: "ciberseguridad tecnología noticias",
        en: "cybersecurity technology news",
      },
    };
    if (tech[sub]) return tech[sub][lang];
    return lang === "es"
      ? `${subcategory} tecnología ${latino}`
      : `${subcategory} technology ${latino}`;
  }

  if (category === "negocios") {
    const business: Record<string, { es: string; en: string }> = {
      emprendedores: {
        es: "emprendedores pequeños negocios economía latina",
        en: "entrepreneurs small business Latino economy",
      },
      entrepreneurs: {
        es: "emprendedores pequeños negocios economía latina",
        en: "entrepreneurs small business Latino economy",
      },
      economia: {
        es: "economía finanzas noticias latinoamérica",
        en: "economy finance news Latino",
      },
      economy: {
        es: "economía finanzas noticias latinoamérica",
        en: "economy finance news Latino",
      },
      mercado: {
        es: "mercado bolsa finanzas economía",
        en: "stock market finance economy news",
      },
      markets: {
        es: "mercado bolsa finanzas economía",
        en: "stock market finance economy news",
      },
      "pequenos negocios": {
        es: "pequeños negocios emprendedores economía local",
        en: "small business entrepreneurs local economy",
      },
      "small business": {
        es: "pequeños negocios emprendedores economía local",
        en: "small business entrepreneurs local economy",
      },
      finanzas: {
        es: "finanzas economía emprendedores",
        en: "finance economy entrepreneurs",
      },
      finance: {
        es: "finanzas economía emprendedores",
        en: "finance economy entrepreneurs",
      },
    };
    if (business[sub]) return business[sub][lang];
    return lang === "es"
      ? `${subcategory} negocios emprendedores economía ${latino}`
      : `${subcategory} business entrepreneurs economy ${latino}`;
  }

  if (category === "local") {
    const local: Record<string, { es: string; en: string }> = {
      "san jose": {
        es: "San José California Santa Clara noticias comunidad latina",
        en: "San Jose California Santa Clara County Latino community news",
      },
      "san josé": {
        es: "San José California Santa Clara noticias comunidad latina",
        en: "San Jose California Santa Clara County Latino community news",
      },
      "santa clara": {
        es: "Santa Clara County California San José noticias comunidad latina",
        en: "Santa Clara County California San Jose local news",
      },
      "santa clara county": {
        es: "Santa Clara County California San José noticias comunidad latina",
        en: "Santa Clara County California San Jose local news",
      },
      "silicon valley": {
        es: "Silicon Valley San José Sunnyvale Cupertino noticias",
        en: "Silicon Valley San Jose Sunnyvale Cupertino news",
      },
      "area de la bahia": {
        es: "Área de la Bahía San José noticias comunidad latina",
        en: "San Francisco Bay Area San Jose Latino community news",
      },
      "área de la bahía": {
        es: "Área de la Bahía San José noticias comunidad latina",
        en: "San Francisco Bay Area San Jose Latino community news",
      },
      "bay area": {
        es: "Área de la Bahía San José noticias comunidad latina",
        en: "San Francisco Bay Area San Jose Latino community news",
      },
      "negocios locales": {
        es: "pequeños negocios locales San José Santa Clara Silicon Valley",
        en: "local small business San Jose Santa Clara County Silicon Valley",
      },
      "local business": {
        es: "pequeños negocios locales San José Santa Clara Silicon Valley",
        en: "local small business San Jose Santa Clara County Silicon Valley",
      },
      eventos: {
        es: "eventos comunidad latina San José Santa Clara Área de la Bahía",
        en: "events Latino community San Jose Santa Clara Bay Area",
      },
      events: {
        es: "eventos comunidad latina San José Santa Clara Área de la Bahía",
        en: "events Latino community San Jose Santa Clara Bay Area",
      },
      comunidad: {
        es: "comunidad latina hispana San José Santa Clara Área de la Bahía",
        en: "Latino Hispanic community San Jose Santa Clara County Bay Area",
      },
      community: {
        es: "comunidad latina hispana San José Santa Clara Área de la Bahía",
        en: "Latino Hispanic community San Jose Santa Clara County Bay Area",
      },
    };
    if (local[sub]) return local[sub][lang];
    return lang === "es"
      ? `${subcategory} San José Santa Clara Área de la Bahía Silicon Valley ${latino}`
      : `${subcategory} San Jose Santa Clara County Bay Area Silicon Valley ${latino}`;
  }

  if (category === "cultura") {
    const culture: Record<string, { es: string; en: string }> = {
      musica: {
        es: "música cultura latina hispana comunidad",
        en: "music Latino Hispanic culture community",
      },
      music: {
        es: "música cultura latina hispana comunidad",
        en: "music Latino Hispanic culture community",
      },
      comida: {
        es: "comida cultura latina tradiciones",
        en: "food Latino culture traditions",
      },
      food: {
        es: "comida cultura latina tradiciones",
        en: "food Latino culture traditions",
      },
      tradiciones: {
        es: "tradiciones cultura latina hispana familia",
        en: "traditions Latino Hispanic culture family",
      },
      traditions: {
        es: "tradiciones cultura latina hispana familia",
        en: "traditions Latino Hispanic culture family",
      },
      arte: {
        es: "arte cultura latina hispana comunidad",
        en: "art Latino Hispanic culture community",
      },
      art: {
        es: "arte cultura latina hispana comunidad",
        en: "art Latino Hispanic culture community",
      },
      eventos: {
        es: "eventos cultura latina comunidad hispana",
        en: "events Latino culture Hispanic community",
      },
      events: {
        es: "eventos cultura latina comunidad hispana",
        en: "events Latino culture Hispanic community",
      },
      familia: {
        es: "familia cultura latina hispana tradiciones",
        en: "family Latino Hispanic culture traditions",
      },
      family: {
        es: "familia cultura latina hispana tradiciones",
        en: "family Latino Hispanic culture traditions",
      },
    };
    if (culture[sub]) return culture[sub][lang];
    return lang === "es"
      ? `${subcategory} cultura latina hispana ${latino}`
      : `${subcategory} Latino Hispanic culture ${latino}`;
  }

  if (category === "internacional") {
    const intl: Record<string, { es: string; en: string }> = {
      "el salvador": {
        es: "noticias El Salvador actualidad centroamérica",
        en: "El Salvador news latest Central America",
      },
      honduras: {
        es: "noticias Honduras actualidad centroamérica",
        en: "Honduras news latest Central America",
      },
      mexico: {
        es: "México noticias internacionales latinoamérica",
        en: "Mexico international news Latin America",
      },
      latinoamerica: {
        es: "Latinoamérica noticias internacionales",
        en: "Latin America international news",
      },
      "latin america": {
        es: "Latinoamérica noticias internacionales",
        en: "Latin America international news",
      },
      europa: { es: "Europa noticias internacionales", en: "Europe international news" },
      europe: { es: "Europa noticias internacionales", en: "Europe international news" },
      asia: { es: "Asia noticias internacionales", en: "Asia international news" },
      migracion: {
        es: "migración inmigración noticias latino",
        en: "migration immigration Latino news",
      },
      migration: {
        es: "migración inmigración noticias latino",
        en: "migration immigration Latino news",
      },
      mundo: {
        es: "mundo noticias internacionales",
        en: "world international news",
      },
      world: {
        es: "mundo noticias internacionales",
        en: "world international news",
      },
    };
    if (intl[sub]) return intl[sub][lang];
    return lang === "es"
      ? `${subcategory} noticias internacionales ${latino}`
      : `${subcategory} international news ${latino}`;
  }

  if (category === "ultimas") {
    const latest: Record<string, { es: string; en: string }> = {
      "ultima hora": {
        es: "última hora noticias breaking latino",
        en: "breaking news latest Latino",
      },
      breaking: {
        es: "última hora noticias breaking latino",
        en: "breaking news latest Latino",
      },
      "estados unidos": {
        es: "Estados Unidos noticias comunidad latina",
        en: "United States news Latino community",
      },
      "u.s.": {
        es: "Estados Unidos noticias comunidad latina",
        en: "United States news Latino community",
      },
      mundo: { es: "mundo noticias internacionales", en: "world news international" },
      world: { es: "mundo noticias internacionales", en: "world news international" },
      comunidad: {
        es: `noticias ${latino}`,
        en: `${latino} news`,
      },
      community: {
        es: `noticias ${latino}`,
        en: `${latino} news`,
      },
      "lo mas visto": {
        es: "lo más visto noticias tendencias latino",
        en: "most read trending Latino news",
      },
      "most read": {
        es: "lo más visto noticias tendencias latino",
        en: "most read trending Latino news",
      },
    };
    if (latest[sub]) return latest[sub][lang];
    return lang === "es"
      ? `${subcategory} noticias ${latino}`
      : `${subcategory} news ${latino}`;
  }

  if (category === "tendencias") {
    const trends: Record<string, { es: string; en: string }> = {
      viral: {
        es: "viral tendencias redes sociales latino",
        // N3 (2026-09-03): the plain "viral trending social media Latino" query surfaced
        // tabloid/inflammatory clickbait that merely mentioned "Spanish" or "Latino" in passing
        // (confirmed live) -- the ES equivalent doesn't have this problem. Naming the platforms
        // these community trends actually originate on keeps the query anchored to genuine
        // Latino/Hispanic viral culture instead of generic English-language viral news.
        en: "viral trending TikTok Instagram Latino Hispanic community",
      },
      "redes sociales": {
        es: "redes sociales tendencias viral latino",
        en: "social media trending TikTok Instagram Latino Hispanic community",
      },
      "social media": {
        es: "redes sociales tendencias viral latino",
        en: "social media trending TikTok Instagram Latino Hispanic community",
      },
      celebridades: {
        es: "celebridades entretenimiento tendencias latino",
        en: "celebrities entertainment trending Latino",
      },
      celebrities: {
        es: "celebridades entretenimiento tendencias latino",
        en: "celebrities entertainment trending Latino",
      },
      opinion: {
        es: "opinión tendencias comunidad latina",
        en: "opinion trending Latino community",
      },
      comunidad: {
        es: `tendencias ${latino}`,
        en: `trending ${latino}`,
      },
      community: {
        es: `tendencias ${latino}`,
        en: `trending ${latino}`,
      },
    };
    if (trends[sub]) return trends[sub][lang];
    return lang === "es"
      ? `${subcategory} tendencias ${latino}`
      : `${subcategory} trending ${latino}`;
  }

  return lang === "es"
    ? `${subcategory} noticias ${latino}`
    : `${subcategory} news ${latino}`;
}

/**
 * Categories whose English base feed is a broad, topic-general publisher feed (ESPN's all-sports
 * feed, general tech-blog feeds, CNBC's general business feed, BBC's general world feed) that
 * dilutes a narrower subcategory's results with unrelated content from the same broad category,
 * rather than a real duplicate story. Evidence gathered during the N3 audit (2026-09-03):
 *  - deportes: NBA/MLB/NHL/Boxing/Soccer diluted with unrelated sports (golf, tennis, NFL) --
 *    the same mechanism first proven for Soccer (see filterSoccerResultQuality below).
 *  - negocios: "Entrepreneurs" diluted with unrelated general business news (an NFL
 *    stadium-expansion story appeared under Business -> Entrepreneurs).
 *  - tecnologia: general-tech-blog content crowding out subcategory-specific coverage (e.g. AI).
 *  - internacional: a general world-news feed isn't scoped to any one subcategory's region.
 * "local" is excluded: its own base feeds are themselves geography-scoped Google queries (San
 * Jose / Bay Area), not a generic unscoped publisher feed, so they supplement rather than
 * dilute. "ultimas"/"tendencias" are excluded: their base feed is already just a single Google
 * query, not a real static publisher feed, so there is nothing to dilute. Scoped to English
 * only: the Spanish base feeds left after the N3 dead-feed cleanup are either a single Google
 * query (tecnologia/negocios/cultura/deportes -- nothing to dilute) or BBC Mundo, a legitimate
 * Spanish-language global feed (internacional) not proven to dilute the same way.
 */
const CATEGORIES_WITH_DILUTING_BASE_FEEDS = new Set(["deportes", "tecnologia", "negocios", "internacional"]);

/**
 * (category, subcategory) pairs proven, by direct evidence, to actually benefit from keeping
 * the generic base feed -- e.g. ESPN's naturally NFL-heavy general feed reinforces the NFL
 * subcategory instead of diluting it. NCAA is included: its own label is intentionally broad
 * college sports, not one sport, so a general sports feed does not misrepresent it.
 */
const EN_SUBCATEGORIES_KEEPING_BASE_FEEDS = new Set(["deportes:nfl", "deportes:ncaa"]);

export function shouldUseSpecializedFeeds(category: string, subcategory: string, lang: Lang): boolean {
  if (lang !== "en") return false;
  if (!CATEGORIES_WITH_DILUTING_BASE_FEEDS.has(category)) return false;
  const sub = normalizeSubcategory(subcategory);
  return !EN_SUBCATEGORIES_KEEPING_BASE_FEEDS.has(`${category}:${sub}`);
}

/**
 * Terms that are essentially unique to American/gridiron football coverage.
 * Deliberately narrow (no team nicknames, no bare "football") so this cannot
 * bleed into unrelated categories or reject legitimate soccer stories.
 */
const AMERICAN_FOOTBALL_SIGNAL = [
  "nfl",
  "super bowl",
  "quarterback",
  "touchdown",
  "gridiron",
  "college football",
  "ncaa football",
  "american football",
  "wide receiver",
  "tight end",
  "field goal",
] as const;

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function isAmericanFootballNoise(title?: string, desc?: string): boolean {
  const text = normalizeForMatch(`${title || ""} ${desc || ""}`);
  return AMERICAN_FOOTBALL_SIGNAL.some((term) => text.includes(term));
}

/**
 * Belt-and-suspenders result-quality filter: drops American-football contamination
 * from the Soccer/Fútbol subcategory only. Feeds shared across deportes subcategories
 * (e.g. a general sports publisher feed) are not query-scoped, so this catches noise
 * the search query alone cannot exclude — without touching NFL or any other subcategory.
 */
export function filterSoccerResultQuality<T extends { title?: string; desc?: string }>(
  items: T[],
  category: string,
  subcategory: string | null | undefined
): T[] {
  const sub = normalizeSubcategory(subcategory || "");
  const isSoccerSubcategory = category === "deportes" && (sub === "futbol" || sub === "soccer");
  if (!isSoccerSubcategory) return items;
  return items.filter((item) => !isAmericanFootballNoise(item.title, item.desc));
}

/**
 * Mirrors the "Headline - Publisher" split heuristic used for display (see
 * app/(site)/noticias/noticiasEditorialModel.ts splitDisplayTitle) so two RSS results that are
 * the same underlying wire story -- differing only in which publisher's syndicated copy a
 * query happened to surface -- key to the same normalized headline instead of showing twice.
 * Deliberately conservative: only strips a trailing " - Publisher" when it looks like one
 * (short, present), never a legitimate hyphenated headline.
 */
export function normalizedHeadlineKey(rawTitle: string): string {
  const raw = rawTitle.trim();
  const idx = raw.lastIndexOf(" - ");
  if (idx <= 0) return raw.toLowerCase();
  const publisher = raw.slice(idx + 3).trim();
  const headline = raw.slice(0, idx).trim();
  if (!headline || !publisher || publisher.length > 80) return raw.toLowerCase();
  return headline.toLowerCase();
}

/**
 * Deduplicates RSS results across all queried feeds for a subcategory. A subcategory's primary
 * and secondary Google News queries (see getFeedUrls in route.ts) frequently surface the same
 * real-world article, but Google News gives each query-result pair its own tracking-URL blob --
 * so link-based dedup alone misses it. Three independent keys catch it without needing the link
 * and title to agree on which was seen first:
 *   1. exact link
 *   2. exact title (case-insensitive)
 *   3. normalized headline (title with any "- Publisher" suffix stripped)
 */
export function dedupeRssArticles<T extends { link?: string; title?: string }>(items: T[]): T[] {
  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();
  const seenHeadlines = new Set<string>();
  const deduped: T[] = [];

  for (const item of items) {
    const link = (item.link || "").trim();
    const title = (item.title || "").trim().toLowerCase();
    const headlineKey = item.title ? normalizedHeadlineKey(item.title) : "";

    if (link && seenLinks.has(link)) continue;
    if (title && seenTitles.has(title)) continue;
    if (headlineKey && seenHeadlines.has(headlineKey)) continue;

    if (link) seenLinks.add(link);
    if (title) seenTitles.add(title);
    if (headlineKey) seenHeadlines.add(headlineKey);

    deduped.push(item);
  }

  return deduped;
}

/**
 * True only when every single feed fetch for this request threw (upstream unreachable, 429,
 * timeout, malformed XML, etc) -- never when feeds fetched successfully but simply had nothing
 * matching a narrow query. This distinction (see route.ts GET) lets the API return a distinct
 * "temporarily unavailable" signal instead of silently reporting a genuinely-empty result as if
 * upstream were healthy. Deliberately conservative: an empty `results` array (no feeds configured
 * at all) is not treated as a failure -- there is nothing to have failed.
 */
export function didAllFeedsFail(results: { ok: boolean }[]): boolean {
  return results.length > 0 && results.every((r) => !r.ok);
}
