// app/lib/news.ts

import Parser from "rss-parser";

// --------------------------------------------------------
// TYPES
// --------------------------------------------------------
export type NewsArticle = {
  id: string;
  title: string;
  img: string;
  desc: string;
  url: string;
  date: string;
};

// --------------------------------------------------------
// RSS SOURCES (You can add more later)
// --------------------------------------------------------
const sources = [
  "https://news.google.com/rss?hl=es-US&gl=US&ceid=US:es",
  "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
];

// --------------------------------------------------------
// MAIN FETCHER
// --------------------------------------------------------
export async function fetchLiveNews(limit = 25): Promise<NewsArticle[]> {
  const parser = new Parser();
  let articles: NewsArticle[] = [];

  for (const url of sources) {
    try {
      const feed = await parser.parseURL(url);

      const parsed = (feed.items || []).map((item, i) => {
        const title = item.title || "";
        const desc =
          item.contentSnippet ||
          item.content ||
          item.summary ||
          "Descripción no disponible.";

        // Extract image from Google News URL if available
        let img = "/featured.png";
        if (item.enclosure?.url) img = item.enclosure.url;

        return {
          id: `${url}-${i}`,
          title,
          desc,
          img,
          url: item.link || "",
          date: item.isoDate || "",
        };
      });

      articles = [...articles, ...parsed];
    } catch (err) {
      console.error("RSS fetch error:", err);
    }
  }

  // Clean duplicates + limit amount
  const cleaned = articles
    .filter((a) => a.title && a.url)
    .slice(0, limit);

  return cleaned;
}
