import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "LeonixMediaRSSBot/1.0" },
});

type Lang = "es" | "en";

type RssArticle = {
  title?: string;
  link?: string;
  img?: string | null;
  date?: string;
  desc?: string;
};

const SOURCES_ES: Record<string, string[]> = {
  deportes: [
    "https://www.univision.com/feeds/sports.xml",
    "https://www.telemundodeportes.com/rss.xml",
    "https://www.espn.com/espn/rss/news",
    "https://news.google.com/rss/search?q=deportes+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
  tecnologia: [
    "https://www.xataka.com/tag/rss",
    "https://cnnespanol.cnn.com/category/tecnologia/rss",
    "https://news.google.com/rss/search?q=tecnologia+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
  negocios: [
    "https://cnnespanol.cnn.com/category/economia/rss",
    "https://www.forbes.com.mx/feed/",
    "https://news.google.com/rss/search?q=negocios+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
  internacional: [
    "https://www.bbc.com/mundo/ultimas_noticias/index.xml",
    "https://cnnespanol.cnn.com/category/internacional/rss",
    "https://news.google.com/rss/search?q=noticias+internacionales&hl=es&gl=US&ceid=US:es",
  ],
  cultura: [
    "https://www.univision.com/feeds/entertainment.xml",
    "https://www.telemundo.com/rss/entretenimiento",
    "https://peopleenespanol.com/feed/",
    "https://news.google.com/rss/search?q=cultura+latina&hl=es&gl=US&ceid=US:es",
  ],
  local: [
    "https://news.google.com/rss/search?q=Pennsylvania+Philadelphia+Latino+community+news&hl=es&gl=US&ceid=US:es",
    "https://news.google.com/rss/search?q=Lancaster+Reading+Allentown+Latino+news&hl=es&gl=US&ceid=US:es",
  ],
  ultimas: [
    "https://news.google.com/rss/search?q=noticias+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
  tendencias: [
    "https://news.google.com/rss/search?q=tendencias+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
};

const SOURCES_EN: Record<string, string[]> = {
  deportes: [
    "https://www.espn.com/espn/rss/news",
    "https://news.google.com/rss/search?q=latino+sports&hl=en&gl=US&ceid=US:en",
  ],
  tecnologia: [
    "https://www.theverge.com/rss/index.xml",
    "https://www.engadget.com/rss.xml",
    "https://news.google.com/rss/search?q=technology+latino&hl=en&gl=US&ceid=US:en",
  ],
  negocios: [
    "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    "https://news.google.com/rss/search?q=latino+business&hl=en&gl=US&ceid=US:en",
  ],
  internacional: [
    "https://feeds.bbci.co.uk/news/world/rss.xml",
    "https://rss.cnn.com/rss/cnn_world.rss",
    "https://news.google.com/rss/search?q=latin+america+news&hl=en&gl=US&ceid=US:en",
  ],
  cultura: [
    "https://news.google.com/rss/search?q=latino+culture&hl=en&gl=US&ceid=US:en",
    "https://www.nbcnews.com/latino/latino-news/rss.xml",
  ],
  local: [
    "https://news.google.com/rss/search?q=Pennsylvania+Philadelphia+Latino+community+news&hl=en&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Lancaster+Reading+Allentown+Latino+news&hl=en&gl=US&ceid=US:en",
  ],
  ultimas: [
    "https://news.google.com/rss/search?q=latino+news&hl=en&gl=US&ceid=US:en",
  ],
  tendencias: [
    "https://news.google.com/rss/search?q=trending+latino&hl=en&gl=US&ceid=US:en",
  ],
};

function normalizeSubcategory(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function googleNewsRssUrl(query: string, lang: Lang): string {
  const hl = lang === "en" ? "en" : "es";
  const ceid = lang === "en" ? "US:en" : "US:es";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=${hl}&gl=US&ceid=${ceid}`;
}

function buildSearchQuery(category: string, subcategory: string, lang: Lang): string {
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
        en: "soccer football news Latino",
      },
      soccer: {
        es: "fútbol soccer noticias latinoamérica",
        en: "soccer football news Latino",
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
      pensilvania: {
        es: "Pensilvania Lancaster Reading Allentown noticias comunidad latina",
        en: "Pennsylvania Lancaster Reading Allentown Latino community news",
      },
      pennsylvania: {
        es: "Pensilvania Lancaster Reading Allentown noticias comunidad latina",
        en: "Pennsylvania Lancaster Reading Allentown Latino community news",
      },
      filadelfia: {
        es: "Filadelfia Philadelphia noticias comunidad latina hispana",
        en: "Philadelphia Latino Hispanic community local news",
      },
      philadelphia: {
        es: "Filadelfia Philadelphia noticias comunidad latina hispana",
        en: "Philadelphia Latino Hispanic community local news",
      },
      "negocios locales": {
        es: "pequeños negocios locales Pensilvania Filadelfia emprendedores latinos",
        en: "local small business Pennsylvania Philadelphia Latino entrepreneurs",
      },
      "local business": {
        es: "pequeños negocios locales Pensilvania Filadelfia emprendedores latinos",
        en: "local small business Pennsylvania Philadelphia Latino entrepreneurs",
      },
      eventos: {
        es: "eventos comunidad latina Pensilvania Filadelfia",
        en: "events Latino community Pennsylvania Philadelphia",
      },
      events: {
        es: "eventos comunidad latina Pensilvania Filadelfia",
        en: "events Latino community Pennsylvania Philadelphia",
      },
      comunidad: {
        es: "comunidad latina hispana Pensilvania Filadelfia Lancaster Reading",
        en: "Latino Hispanic community Pennsylvania Philadelphia Lancaster Reading",
      },
      community: {
        es: "comunidad latina hispana Pensilvania Filadelfia Lancaster Reading",
        en: "Latino Hispanic community Pennsylvania Philadelphia Lancaster Reading",
      },
    };
    if (local[sub]) return local[sub][lang];
    return lang === "es"
      ? `${subcategory} Pensilvania Filadelfia Lancaster Reading Allentown ${latino}`
      : `${subcategory} Pennsylvania Philadelphia Lancaster Reading Allentown ${latino}`;
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

function getFeedUrls(category: string, subcategory: string | null, lang: Lang): string[] {
  const sources = lang === "en" ? SOURCES_EN : SOURCES_ES;
  const baseFeeds = sources[category] ?? sources.ultimas;

  const trimmed = subcategory?.trim();
  if (!trimmed) {
    return baseFeeds;
  }

  const primaryQuery = buildSearchQuery(category, trimmed, lang);
  const secondaryQuery =
    lang === "es"
      ? `${trimmed} ${category} noticias comunidad latina`
      : `${trimmed} ${category} news Latino community`;

  return [
    googleNewsRssUrl(primaryQuery, lang),
    googleNewsRssUrl(secondaryQuery, lang),
    ...baseFeeds.slice(0, 1),
  ];
}

function dedupeArticles(items: RssArticle[]): RssArticle[] {
  const seenLinks = new Set<string>();
  const seenTitles = new Set<string>();
  const deduped: RssArticle[] = [];

  for (const item of items) {
    const link = (item.link || "").trim();
    const title = (item.title || "").trim().toLowerCase();

    if (link) {
      if (seenLinks.has(link)) continue;
      seenLinks.add(link);
    } else if (title) {
      if (seenTitles.has(title)) continue;
      seenTitles.add(title);
    }

    deduped.push(item);
  }

  return deduped;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "ultimas";
  const subcategory = searchParams.get("subcategory");
  const langParam = searchParams.get("lang") || "es";
  const lang: Lang = langParam === "en" ? "en" : "es";

  const feeds = getFeedUrls(category, subcategory, lang);

  try {
    const promises = feeds.map(async (url: string) => {
      try {
        const feed = await parser.parseURL(url);
        return feed.items.map((item) => {
          const record = item as Record<string, unknown>;
          const content =
            typeof record.content === "string"
              ? record.content
              : typeof record["content:encoded"] === "string"
                ? record["content:encoded"]
                : undefined;

          return {
            title: typeof item.title === "string" ? item.title : "",
            link: typeof item.link === "string" ? item.link : "",
            img: extractImage(content),
            date: item.isoDate || item.pubDate || new Date().toISOString(),
            desc: item.contentSnippet || "",
          } satisfies RssArticle;
        });
      } catch (err) {
        console.error("Feed error:", url, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const all = dedupeArticles(results.flat());

    all.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );

    return NextResponse.json(all.slice(0, 40));
  } catch (err) {
    console.error("RSS ENGINE ERROR:", err);
    return NextResponse.json([]);
  }
}

function extractImage(html?: string) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}
