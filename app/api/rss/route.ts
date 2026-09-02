import { NextResponse } from "next/server";
import Parser from "rss-parser";
import {
  buildSearchQuery,
  filterSoccerResultQuality,
  googleNewsRssUrl,
  normalizeSubcategory,
} from "./newsQuery";

const parser = new Parser({
  timeout: 8000,
  headers: { "User-Agent": "LeonixMediaRSSBot/1.0" },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
    ],
  },
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
    "https://news.google.com/rss/search?q=San+Jos%C3%A9+Santa+Clara+noticias&hl=es&gl=US&ceid=US:es",
    "https://news.google.com/rss/search?q=%C3%81rea+de+la+Bah%C3%ADa+Silicon+Valley+noticias&hl=es&gl=US&ceid=US:es",
    "https://localnewsmatters.org/feed/",
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
    "https://news.google.com/rss/search?q=San+Jose+Santa+Clara+County+news&hl=en&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Bay+Area+Silicon+Valley+news&hl=en&gl=US&ceid=US:en",
    "https://localnewsmatters.org/feed/",
    "https://www.nbcbayarea.com/news/local/feed/",
  ],
  ultimas: [
    "https://news.google.com/rss/search?q=latino+news&hl=en&gl=US&ceid=US:en",
  ],
  tendencias: [
    "https://news.google.com/rss/search?q=trending+latino&hl=en&gl=US&ceid=US:en",
  ],
};

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

  const normalizedSub = normalizeSubcategory(trimmed);
  const isSoccerSubcategory =
    category === "deportes" && (normalizedSub === "futbol" || normalizedSub === "soccer");
  if (isSoccerSubcategory) {
    // The general deportes base feeds (e.g. ESPN's all-sports feed) are not soccer-scoped and
    // flood this subcategory with unrelated sports (golf, NCAA eligibility, MLB, etc). Soccer
    // relies only on its two dedicated, query-scoped Google News searches.
    return [googleNewsRssUrl(primaryQuery, lang), googleNewsRssUrl(secondaryQuery, lang)];
  }

  return [
    googleNewsRssUrl(primaryQuery, lang),
    googleNewsRssUrl(secondaryQuery, lang),
    // Include two publisher feeds so image-bearing sources (e.g. Engadget enclosures) surface alongside Google News.
    ...baseFeeds.slice(0, 2),
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
          const record = item as unknown as Record<string, unknown>;
          const content =
            typeof record.content === "string"
              ? record.content
              : typeof record["content:encoded"] === "string"
                ? record["content:encoded"]
                : undefined;

          return {
            title: typeof item.title === "string" ? item.title : "",
            link: typeof item.link === "string" ? item.link : "",
            img: extractArticleImage(item, content),
            date: item.isoDate || item.pubDate || undefined,
            desc: item.contentSnippet || "",
          } satisfies RssArticle;
        });
      } catch (err) {
        console.error("Feed error:", url, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    const deduped = dedupeArticles(results.flat());
    const all = filterSoccerResultQuality(deduped, category, subcategory);

    all.sort(
      (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
    );

    return NextResponse.json(all.slice(0, 40));
  } catch (err) {
    console.error("RSS ENGINE ERROR:", err);
    return NextResponse.json([]);
  }
}

/** Accept only absolute http(s) image URLs; never throw on malformed input. */
function normalizeImageUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url = trimmed;
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^https?:\/\//i.test(url)) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function isHardRejectedImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  if (lower.includes("pixel")) return true;
  if (lower.includes("tracking")) return true;
  if (lower.includes("spacer")) return true;
  if (lower.includes("blank")) return true;
  if (lower.includes("favicon")) return true;
  if (lower.endsWith(".gif")) return true;
  return false;
}

function isLogoImageUrl(url: string): boolean {
  return url.toLowerCase().includes("logo");
}

/** Pick the first usable candidate; defer logo URLs unless nothing else is available. */
function selectBestImageUrl(candidates: string[]): string | null {
  let logoFallback: string | null = null;

  for (const raw of candidates) {
    const url = normalizeImageUrl(raw);
    if (!url) continue;
    if (isHardRejectedImageUrl(url)) continue;
    if (isLogoImageUrl(url)) {
      if (!logoFallback) logoFallback = url;
      continue;
    }
    return url;
  }

  return logoFallback;
}

function extractMediaUrl(value: unknown): string | null {
  if (value == null) return null;

  if (typeof value === "string") {
    return normalizeImageUrl(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const url = extractMediaUrl(entry);
      if (url) return url;
    }
    return null;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const medium = String(
      (record.medium as string | undefined) ??
        ((record.$ as Record<string, unknown> | undefined)?.medium as string | undefined) ??
        ""
    ).toLowerCase();
    if (medium && medium !== "image") return null;

    const direct =
      normalizeImageUrl(record.url) ??
      normalizeImageUrl(record.href) ??
      normalizeImageUrl((record.$ as Record<string, unknown> | undefined)?.url) ??
      normalizeImageUrl((record.$ as Record<string, unknown> | undefined)?.href);
    if (direct) return direct;
  }

  return null;
}

function extractImagesFromHtml(html?: string): string[] {
  if (!html || typeof html !== "string") return [];

  const urls: string[] = [];
  const imgTagRe = /<img\b[^>]*>/gi;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = imgTagRe.exec(html)) !== null) {
    const tag = tagMatch[0];
    const srcMatch =
      tag.match(/\bsrc=["']([^"']+)["']/i) ?? tag.match(/\bsrc=([^\s>]+)/i);
    if (srcMatch?.[1]) urls.push(srcMatch[1]);

    const srcsetMatch = tag.match(/\bsrcset=["']([^"']+)["']/i);
    if (srcsetMatch?.[1]) {
      const first = srcsetMatch[1].split(",")[0]?.trim().split(/\s+/)[0];
      if (first) urls.push(first);
    }
  }

  return urls;
}

function itemHtmlContent(item: Record<string, unknown>, encoded?: string): string[] {
  const blocks: string[] = [];
  if (encoded) blocks.push(encoded);
  if (typeof item.description === "string") blocks.push(item.description);
  if (typeof item.summary === "string") blocks.push(item.summary);
  if (typeof item.contentSnippet === "string") blocks.push(item.contentSnippet);
  return blocks;
}

/** Best-effort image URL from RSS item fields (priority order per Gate 3). */
function extractArticleImage(
  item: { enclosure?: { url?: string; type?: string }; contentSnippet?: string },
  encodedContent?: string
): string | null {
  const record = item as unknown as Record<string, unknown>;
  const candidates: string[] = [];

  const push = (url: string | null | undefined) => {
    if (url) candidates.push(url);
  };

  // 1. media:content
  push(extractMediaUrl(record["media:content"]));
  push(extractMediaUrl(record.mediaContent));

  // 2. media:thumbnail
  push(extractMediaUrl(record["media:thumbnail"]));
  push(extractMediaUrl(record.mediaThumbnail));

  // 3. enclosure (image/*)
  if (item.enclosure?.url) {
    const type = (item.enclosure.type || "").toLowerCase();
    if (!type || type.startsWith("image/")) {
      push(item.enclosure.url);
    }
  }

  // 4. image / itunes:image
  push(extractMediaUrl(record.image));
  if (record.image && typeof record.image === "object") {
    const imageObj = record.image as Record<string, unknown>;
    push(normalizeImageUrl(imageObj.url));
  }
  push(extractMediaUrl(record["itunes:image"]));

  // 5. <img> inside content / description HTML
  for (const html of itemHtmlContent(record, encodedContent)) {
    candidates.push(...extractImagesFromHtml(html));
  }

  return selectBestImageUrl(candidates);
}
