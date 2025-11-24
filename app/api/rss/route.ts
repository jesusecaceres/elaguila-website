import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser: any = new Parser({
  headers: {
    "User-Agent": "ElAguilaNewsBot",
  },
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "es";

  // Latino news sources (REAL feeds)
  const feedsES = [
    // Univision
    "https://www.univision.com/feed/news",
    // CNN Español
    "http://rss.cnn.com/rss/cnn_latest.rss",
    // BBC Mundo
    "http://feeds.bbci.co.uk/mundo/rss.xml",
    // El País América
    "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada",
    // Associated Press Spanish
    "https://apnews.com/apf-latina/rss",
    // Telemundo (unofficial but stable)
    "https://feeds.feedburner.com/tmnews/latest",
  ];

  const feedsEN = [
    // CNN US
    "http://rss.cnn.com/rss/cnn_topstories.rss",
    // AP US
    "https://feeds.apnews.com/apf-topnews",
    // BBC World
    "http://feeds.bbci.co.uk/news/world/rss.xml",
  ];

  const sources = lang === "es" ? feedsES : feedsEN;

  let allArticles: any[] = [];

  try {
    const feedPromises = sources.map((url) =>
      parser
        .parseURL(url)
        .then((data: any) => {
          const items = data.items.map((item: any) => ({
            title: item.title,
            desc: item.contentSnippet || item.description || "",
            link: item.link,
            date: item.isoDate || item.pubDate || "",
            img:
              item.enclosure?.url ||
              extractImage(item.content) ||
              "/featured.png",
          }));

          return items;
        })
        .catch((err: any) => {
          console.error("Feed failed:", url, err);
          return [];
        })
    );

    const results = await Promise.all(feedPromises);

    results.forEach((arr) => {
      allArticles = allArticles.concat(arr);
    });

    // Sort newest → oldest
    allArticles.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Return first 50 for performance
    return NextResponse.json(allArticles.slice(0, 50));
  } catch (err) {
    console.error("RSS ENGINE ERROR:", err);
    return NextResponse.json([]);
  }
}

// Helper to extract <img> URLs from HTML content
function extractImage(html: string) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match ? match[1] : null;
}
