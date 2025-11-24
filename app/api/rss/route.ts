import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "ElAguilaNewsBot/1.0" },
});

/* -------------------------------------------------------------
   CATEGORY SOURCES — Trusted Latino Feeds
   ------------------------------------------------------------- */
const SOURCES: any = {
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
   GET API — /api/rss?category=deportes&lang=es
   ------------------------------------------------------------- */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "ultimas";
  const lang = searchParams.get("lang") || "es";

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
          desc:
            lang === "es"
              ? item.contentSnippet
              : item.contentSnippet,
        }));
      } catch (err) {
        console.error("Feed error:", url, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const all = results.flat();

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
   Helper: Extract image URL from HTML
   ------------------------------------------------------------- */
function extractImage(html?: string) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}
