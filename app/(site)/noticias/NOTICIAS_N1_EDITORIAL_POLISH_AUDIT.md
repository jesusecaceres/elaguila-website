# Noticias N1 — Editorial polish audit

## 1. Files inspected

- `app/(site)/noticias/page.tsx`
- `app/(site)/noticias/NoticiasPageClient.tsx`
- `app/lib/siteSectionContent/noticiasPageMerge.ts`
- `app/lib/siteSectionContent/payloadTypes.ts` (noticias copy fields)
- `app/api/rss/route.ts`
- `app/lib/leonix/publicPillarSeo.ts` (noticias pillar metadata + CollectionPage JSON-LD)
- `app/components/PublicPillarJsonLd.tsx`
- `app/globals.css` (token reference only)
- `app/(site)/layout.tsx` (global header/footer ownership — not edited)

Admin `app/admin/(dashboard)/workspace/noticias/**` was identified and left untouched.

## 2. Files changed

- `app/(site)/noticias/NoticiasPageClient.tsx`
- `app/(site)/noticias/noticiasEditorialModel.ts` (new, extracted grouping/truth helpers)
- `app/lib/siteSectionContent/noticiasPageMerge.ts`
- `app/api/rss/route.ts` (N1: stop synthesizing dates; N1.1: Bay Area local geography)
- `app/(site)/noticias/noticiasEditorialModel.ts` (N1 grouping; N1.1: Bay Area keywords + local subcategories)
- `app/(site)/noticias/NOTICIAS_N1_EDITORIAL_POLISH_AUDIT.md` (this file)

## 3. Current content/data architecture

Noticias is a client page that fetches `/api/rss?category=&subcategory=&lang=`.

The RSS route mixes Google News search feeds with a small set of publisher RSS URLs, dedupes by link/title, sorts by date, and returns up to 40 items: `title`, `link`, `img`, `date`, `desc`.

There is no Leonix-authored article CMS on the public page. `site_section_content` (`noticias_page`) only supplies masthead strings.

There is no `/noticias/[slug]` article detail route. Cards now link to the original `article.link`.

## 4. Sources/providers

Google News RSS (primary), plus category publisher feeds such as Univision, Telemundo, ESPN, BBC Mundo, CNN Español, The Verge, CNBC, depending on category/lang.

Images come from RSS media/enclosure/HTML when present. Missing or broken images are omitted (no fake stock thumbs; previous `/el-aguila/public/images/news/*` paths do not exist in this repo).

## 5. Truth/freshness findings

- Freshness is live RSS sort by `isoDate`/`pubDate`.
- Dates are shown only when parseable. The API no longer fills missing dates with `new Date()`.
- Source labels prefer the publisher suffix already present in Google titles (`Headline - Outlet`). `news.google.com` is not shown as if it were the publisher.
- Leonix does not claim authorship.
- Removed the fabricated empty-feed fallback (“Leonix Media amplía su plataforma digital 2026”).
- Última hora repeats the current lead title from the live feed (presentation duplicate of the lead, not a second invented story).

## 6. Duplicate-story findings

Lead is `articles[0]`. Tendencias and Locales exclude the lead. The lower feed excludes stories already shown in Tendencias/Locales.

Google News snippets often duplicated the title; summaries that match the headline are hidden.

## 7. Local-news logic

**Old (pre-N1.1):** category `local` Google News queries and subcategory maps targeted Pennsylvania / Philadelphia / Lancaster / Reading / Allentown.

**New (N1.1):**

- Primary geography: San José, Santa Clara County
- Secondary: Silicon Valley and named South Bay cities in the keyword matcher
- Regional: Área de la Bahía / Bay Area, East Bay, South Bay
- ES/EN use the same places; language only changes query language (`hl`/`ceid`) and labels

**Local category feeds:** Google News geographic searches plus verified publisher RSS:

- `https://localnewsmatters.org/feed/` (RSS 2.0, items present)
- EN also includes `https://www.nbcbayarea.com/news/local/feed/` (RSS 2.0, items present)

Not added (failed verification): Univision 14 RSS 404, Telemundo Área de la Bahía `/rss` empty, Bay City News `/feed` 404, Mercury News 403.

**Two paths, same geography:**

1. Category `local` → `/api/rss?category=local&subcategory=…` (San José / Santa Clara / Silicon Valley / Área de la Bahía / Comunidad)
2. Noticias Locales band on other categories → keyword match only (no backfill)

**Classification:** place names only. `California`, `Latino`, `community`, `immigration`, `Spanish` are not local proof.

**Empty state:** if the band has no geographic matches, N1 honest empty copy remains. No Pennsylvania fill, no fabricated Leonix locals.

## 8. ES/EN behavior

`?lang=es|en` selects copy, subcategory labels, and RSS `hl`/`ceid`. Masthead defaults:

- ES: “Noticias locales, comunidad, cultura y actualidad para nuestra gente.”
- EN: “Local news, community, culture and current stories for our community.”

CMS `noticias_page` payload can still override these strings.

## 9. Visual changes

- Removed the 320px centered logo.
- Compact editorial masthead (eyebrow, one H1, support line).
- Burgundy Última hora strip, category pills, ranked Tendencias rail.
- Dedicated Noticias Locales band with restrained green left edge.
- Direct crawlable story links (modal removed).

## 10. Responsive changes

- Canvas `max-w-[88rem]`.
- Lead + Tendencias: 8/4 columns from `lg`.
- Locales: 1 / 2 / 4 cards.
- Category rails: horizontal scroll; `overflow-x-hidden` on main.
- Measured no document overflow at 390 and 768.

## 11. SEO findings

Kept existing pillar SEO (`buildPublicPillarMetadata("noticias")`):

- title/description/canonical `/noticias`
- OG + Twitter
- CollectionPage JSON-LD (not per-article NewsArticle)

Did not add Article schema (RSS author/publisher fields are not reliable enough).

One H1. Story URLs are now in the HTML as `href`.

## 12. Remaining risks (after N1.1)

- Google News still mixes some off-geography items into a local recorte; the Locales band filters by place-name evidence and may be empty on Últimas.
- Google News links remain aggregator URLs.
- Univision 14 / Telemundo 48 / Bay City News do not expose a compatible public RSS endpoint we could verify.
- Many RSS items have no image.
- Tendencias still fills remaining slots from the same recency-sorted feed when viral keywords are scarce.
- Admin workspace Noticias CMS was not redesigned.

## TRUE/FALSE TABLE

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Giant centered Noticias logo removed | TRUE | `NoticiasPageClient` no longer imports `/logo.png` |
| Global Leonix header remains untouched | TRUE | Navbar/Footer not in diff |
| Noticias masthead is compact and editorial | TRUE | Eyebrow + serif H1 + support line, `pt-24` |
| H1 is clear and singular | TRUE | One `<h1>` locally; CDP `h1: 1` |
| Última hora remains truthful | TRUE | Uses live lead title only |
| Category rail remains functional | TRUE | Same 8 categories + subcategory fetch params |
| Lead story has stronger hierarchy | TRUE | Serif headline, source/date, no empty image box |
| Tendencias remains functional | TRUE | Ranked rail from same feed, lead excluded |
| Noticias Locales is more prominent | TRUE | Full-width section under the grid |
| No fake local stories added | TRUE | Geographic match only; honest empty state |
| Existing source attribution preserved/improved | TRUE | Publisher suffix + no Google host as publisher |
| No fake metadata added | TRUE | Date/source only from RSS/title/link |
| No fake Article schema fields added | TRUE | CollectionPage unchanged |
| Story links remain truthful | TRUE | `href={article.link}` original URL |
| Duplicate presentation improved where safe | TRUE | Lead/trending/local/feed exclusion |
| Page uses Leonix cream/burgundy/gold/charcoal intentionally | TRUE | `--lx-page/card/gold` + `#7A1E2C` |
| Green is restrained to community/local usage | TRUE | Local section `border-l-[#2A4536]` only |
| Desktop width uses space better | TRUE | `max-w-[88rem]`, 8/4 grid at 1440 |
| Mobile has no horizontal overflow | TRUE | 390 `scrollWidth === clientWidth` |
| ES works | TRUE | `/noticias?lang=es` masthead + categories |
| EN works | TRUE | `/noticias?lang=en` “News” / “LEONIX NEWS” |
| Navbar/Footer untouched | TRUE | Not in git diff |
| Iglesias untouched | TRUE | Not in git diff |
| Recursos untouched | TRUE | Not in git diff |
| npm run build passes | TRUE | See gate report after build |
| Pennsylvania/Philadelphia local sourcing removed | TRUE | No PA strings remain in `rss/route.ts` or `noticiasEditorialModel.ts` |
| Local geography targets San José/Santa Clara County | TRUE | Local Google queries + subcategory map |
| Bay Area is supported as the wider regional market | TRUE | Área de la Bahía / Bay Area query + `bay area` / `east bay` keywords |
| Spanish local query uses correct geography | TRUE | ES `hl=es` San José / Santa Clara / Área de la Bahía |
| English local query uses correct geography | TRUE | EN `hl=en` San Jose / Santa Clara County / Bay Area |
| No fabricated RSS endpoint was added | TRUE | Only verified `localnewsmatters.org/feed` and NBC Bay Area local feed |
| Local stories require geographic evidence | TRUE | Keyword matcher is place names only |
| Generic California stories are not automatically local | TRUE | `california` is not a local keyword |
| Empty local inventory stays truthful | TRUE | N1 empty copy; no backfill |
| N1 visual redesign remains unchanged | TRUE | Client layout/colors/masthead not restyled in N1.1 |
