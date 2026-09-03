import { articleDedupeKey, composeHomepageFeed, isUsableArticleLink, type NewsArticle } from "../noticiasEditorialModel";

/**
 * N4 security regression guard: only absolute http(s) article links may ever become a clickable
 * href. Guards against a malformed/malicious RSS `link` value (javascript:, data:, vbscript:, a
 * bare non-URL string) ever being rendered as an outbound link.
 */
export function assertNoticiasEditorialModelSmoke(): boolean {
  const checks: boolean[] = [];

  checks.push(isUsableArticleLink("https://www.espn.com/soccer/story/_/id/1") === true);
  checks.push(isUsableArticleLink("http://example.com/article") === true);
  checks.push(isUsableArticleLink("  https://example.com/padded  ") === true);

  checks.push(isUsableArticleLink("javascript:alert(1)") === false);
  checks.push(isUsableArticleLink("data:text/html,<script>alert(1)</script>") === false);
  checks.push(isUsableArticleLink("vbscript:msgbox(1)") === false);
  checks.push(isUsableArticleLink("//evil.com/open-redirect") === false);
  checks.push(isUsableArticleLink("not a url") === false);
  checks.push(isUsableArticleLink("") === false);
  checks.push(isUsableArticleLink("   ") === false);
  checks.push(isUsableArticleLink(undefined) === false);
  checks.push(isUsableArticleLink(null) === false);
  checks.push(isUsableArticleLink(42) === false);

  // Owner-QA Gate 1: composeHomepageFeed must never let one article appear in two sections, and
  // must respect each section's limit.
  const makeArticles = (count: number, prefix: string): NewsArticle[] =>
    Array.from({ length: count }, (_, i) => ({
      title: `${prefix} story ${i}`,
      link: `https://example.com/${prefix}-${i}`,
    }));

  const feed = makeArticles(20, "feed");
  const composed = composeHomepageFeed(feed, undefined, { trending: 6, support: 4, rich: 6 });
  checks.push(composed.trendingArticles.length === 6);
  checks.push(composed.supportArticles.length === 4);
  checks.push(composed.richMoreStories.length === 6);
  checks.push(composed.compactMoreStories.length === 20 - 6 - 4 - 6);

  const allKeys = [
    ...composed.trendingArticles,
    ...composed.supportArticles,
    ...composed.richMoreStories,
    ...composed.compactMoreStories,
  ].map(articleDedupeKey);
  checks.push(new Set(allKeys).size === allKeys.length);
  checks.push(allKeys.length === feed.length);

  // A shorter feed than the combined limits should not throw or duplicate -- every section just
  // gets whatever remains, in order, with no overlap.
  const shortFeed = makeArticles(5, "short");
  const shortComposed = composeHomepageFeed(shortFeed, undefined, { trending: 6, support: 4, rich: 6 });
  const shortKeys = [
    ...shortComposed.trendingArticles,
    ...shortComposed.supportArticles,
    ...shortComposed.richMoreStories,
    ...shortComposed.compactMoreStories,
  ].map(articleDedupeKey);
  checks.push(new Set(shortKeys).size === shortKeys.length);
  checks.push(shortKeys.length === shortFeed.length);

  return checks.every(Boolean);
}
