import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "ElAguilaNewsBot/1.0" },
});

/* -------------------------------------------------------------
   SPANISH SOURCES (DEFAULT)
------------------------------------------------------------- */
const SOURCES_ES: any = {
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
    "https://news.google.com/rss/search?q=San+Jose+CA+noticias&hl=es&gl=US&ceid=US:es",
    "https://www.nbcbayarea.com/feed/",
    "https://www.telemundoareadelabahia.com/feed/",
  ],
  ultimas: [
    "https://news.google.com/rss/search?q=noticias+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
  tendencias: [
    "https://news.google.com/rss/search?q=tendencias+latinoamerica&hl=es&gl=US&ceid=US:es",
  ],
};

/* -------------------------------------------------------------
   ENGLISH SOURCES (U.S. LATINO ENGLISH NEWS) — OPTION A
------------------------------------------------------------- */
const SOURCES_EN: any = {
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
    "https://www.reuters.com/finance/rss",
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
    "https://news.google.com/rss/search?q=San+Jose+CA+news&hl=en&gl=US&ceid=US:en",
    "https://www.nbcbayarea.com/feed/",
  ],
  ultimas: [
    "https://news.google.com/rss/search?q=latino+news&hl=en&gl=US&ceid=US:en",
  ],
  tendencias: [
    "https://news.google.com/rss/search?q=trending+latino&hl=en&gl=US&ceid=US:en",
  ],
};

/* -------------------------------------------------------------
   MAIN API HANDLER
------------------------------------------------------------- */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "ultimas";
  const lang = searchParams.get("lang") || "es";

  // Pick source set by language
  const SOURCES = lang === "en" ? SOURCES_EN : SOURCES_ES;

  const feeds = SOURCES[category] || SOURCES["ultimas"];

  try {
    const promises = feeds.map(async (url: string) => {
      try {
        const feed = await parser.parseURL(url);
        return feed.items.map((item: any) => ({
          title: item.title,
          link: item.link,
          img: extractImage(item.content || item["content:encoded"]),
          date: item.isoDate || item.pubDate || new Date().toISOString(),
          desc: item.contentSnippet || "",
        }));
      } catch (err) {
        console.error("Feed error:", url, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const all = results.flat();

    // Sort newest first
    all.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(all.slice(0, 40));
  } catch (err) {
    console.error("RSS ENGINE ERROR:", err);
    return NextResponse.json([]);
  }
}

/* -------------------------------------------------------------
   IMAGE EXTRACTOR
------------------------------------------------------------- */
function extractImage(html?: string) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}
