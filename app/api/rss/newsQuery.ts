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
        en: 'soccer MLS Liga MX FIFA CONCACAF Latino -NFL -"college football" -gridiron',
      },
      soccer: {
        es: "fútbol soccer noticias latinoamérica",
        en: 'soccer MLS Liga MX FIFA CONCACAF Latino -NFL -"college football" -gridiron',
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
        es: "San José Santa Clara noticias comunidad latina",
        en: "San Jose Santa Clara County Latino community news",
      },
      "san josé": {
        es: "San José Santa Clara noticias comunidad latina",
        en: "San Jose Santa Clara County Latino community news",
      },
      "santa clara": {
        es: "Santa Clara County San José noticias comunidad latina",
        en: "Santa Clara County San Jose local news",
      },
      "santa clara county": {
        es: "Santa Clara County San José noticias comunidad latina",
        en: "Santa Clara County San Jose local news",
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
        en: "viral trending social media Latino",
      },
      "redes sociales": {
        es: "redes sociales tendencias viral latino",
        en: "social media trending viral Latino",
      },
      "social media": {
        es: "redes sociales tendencias viral latino",
        en: "social media trending viral Latino",
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
