# W9 — SEO, Metadata, Social Share, Canonical, and Indexing Audit

**Audit date:** 2026-05-27  
**References:** W1–W8 audits, `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`  
**Scope:** Public SEO metadata, Open Graph/Twitter cards, canonical URLs, index/noindex guards, social share URL safety, sitemap/robots. No redesign, no fake OG images or listing copy, no Stripe.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves metadata/indexing/social behavior is real and safe |
| FALSE | Broken/fake metadata, indexable private/demo routes, or unsafe share targets |
| DEFERRED_INTENTIONAL | Safely hidden, noindexed, or documented bounded gap |
| NOT_APPLICABLE | Out of scope for this surface |

---

## 1. Main audit table

| Route group | Route/file | Required SEO behavior | Current implementation | Indexing behavior | Social/share behavior | Status | Notes |
|---|---|---|---|---|---|---|---|
| Core | `/` `app/(site)/page.tsx` | Splash; stable title | Client splash; inherits root `metadata` + `metadataBase` | Indexable (root `robots: index`) | OG = site logo (root) | DEFERRED_INTENTIONAL | Redirects users to `/home`; no route-specific title |
| Core | `/home` `home/page.tsx` | Home title + description | `metadata` + OG/Twitter from `leonixBrand` | Indexable; in `sitemap.xml` | Site-level OG image `/logo.png` | TRUE | |
| Core | `/about` | Lang-aware title/description | `generateMetadata` + `searchParams.lang` | Indexable | OG/Twitter match | TRUE | |
| Core | `/contacto` `/contact` | Lang-aware contact meta | `contacto/page.tsx` `generateMetadata` | Indexable | OG/Twitter | TRUE | `/contact` alias pattern per W1 |
| Core | `/magazine` | Hub metadata | Section content pages (W1) | Indexable; partial sitemap (`/magazine/2026`) | Inherited/site | TRUE | |
| Core | `/noticias` | News metadata | Page metadata present (W1) | Indexable; in sitemap | Site OG | TRUE | |
| Core | `/coupons` `/cupones` | Promo metadata | DB-backed coupon pages | Indexable | Site OG | TRUE | |
| Core | `/productos-promocion` | Product catalog meta | `generateMetadata` | Indexable | Site OG | TRUE | |
| Core | `/iglesias` | Directory metadata | Page exists (W1) | Indexable | Site OG | DEFERRED_INTENTIONAL | No dedicated `generateMetadata`; inherits root template |
| Core | `/legal` | Legal copy meta | **Client-only** page; no `metadata` export | Inherits root title | Generic site OG | FALSE | Add `generateMetadata` or server wrapper (W10) |
| Core | `/privacy` `/terms` | Policy meta | `generateMetadata` + `leonixPageTitle` | Indexable | Policy titles | TRUE | |
| Core | `/data-deletion` | Data-deletion instructions | `generateMetadata` lang-aware | Indexable | Policy-style title | TRUE | |
| Clasificados hub | `/clasificados` `clasificados/layout.tsx` | Hub description + canonical | Static `metadata`; canonical `/clasificados` (no `?lang=` in canonical) | Indexable; in sitemap | OG hub copy | TRUE | Child routes set own titles |
| Clasificados | `/clasificados/autos` | Category title/description | Client landing; inherits hub/root | Indexable | Share N/A on hub | DEFERRED_INTENTIONAL | No segment metadata; not misleading |
| Clasificados | `/clasificados/autos/resultados` | Results meta | Client results; inherits parent | Indexable | Card share uses public vehicle URLs | DEFERRED_INTENTIONAL | |
| Clasificados | `/clasificados/bienes-raices` | Category meta | `metadata` title + description | Indexable | Hub links to results | TRUE | |
| Clasificados | `/clasificados/bienes-raices/resultados` | Results meta | `metadata` on page | Indexable | Public anuncio URLs | TRUE | |
| Clasificados | `/clasificados/en-venta` | Hub meta | Client hub; inherits clasificados layout | Indexable | Public results URLs | DEFERRED_INTENTIONAL | |
| Clasificados | `/clasificados/en-venta/results` | Results meta | Client; inherits layout | Indexable | `LeonixShareButton` + safe URL helper | DEFERRED_INTENTIONAL | |
| Clasificados | `/clasificados/empleos` | Category meta | Static `metadata` + canonical `/clasificados/empleos` | Indexable | Job detail canonical URLs | TRUE | |
| Clasificados | `/clasificados/empleos/resultados` | Results meta | `metadata` export | Indexable | Share on cards | TRUE | |
| Clasificados | `/clasificados/rentas` | Category meta | Static `metadata` | Indexable | Listing/detail URLs | TRUE | |
| Clasificados | `/clasificados/rentas/results` | Results meta | `metadata` on `results/page.tsx` | Indexable | Share on detail | TRUE | |
| Clasificados | `/clasificados/servicios` | Landing meta | Client landing (inherits) | Indexable | Slug vitrina URLs | DEFERRED_INTENTIONAL | |
| Clasificados | `/clasificados/servicios/resultados` | Results meta | `metadata` title + description | Indexable | `LeonixShareButton` + `getSafePublicAdUrl` | TRUE | |
| Clasificados | `/clasificados/restaurantes` | Category meta | `restaurantes/layout.tsx` + canonical | Indexable | Slug detail URLs | TRUE | |
| Clasificados | `/clasificados/restaurantes/resultados` | Results meta | Inherits restaurantes layout | Indexable | Share on shell/cards | DEFERRED_INTENTIONAL | |
| Clasificados | `/clasificados/clases` … `viajes` | Category + results | Mix: client landings; community/busco/mascotas without segment metadata | Indexable | Public `/clasificados/anuncio/[id]` | DEFERRED_INTENTIONAL | W8 publish paths; generic inherited titles acceptable on hubs |
| Detail | `/clasificados/anuncio/[id]` | Dynamic title/desc/image | **W9:** `layout.tsx` `generateMetadata` + `fetchListingHeadMetadata`; missing → `noindex` | Published rows indexable; missing/unpublished `noindex` | OG image = first listing photo or `/logo.png` | TRUE | W9 fix |
| Detail | `/clasificados/autos/vehiculo/[id]` | Vehicle title | `generateMetadata` from live bundle | Indexable when live | Share on card; title only OG | TRUE | No per-vehicle OG image yet |
| Detail | `/clasificados/autos/dealer/[dealerInventoryGroupId]` | Dealer inventory meta | Client page; no `generateMetadata` | Indexable | Links to vehicle public URLs | DEFERRED_INTENTIONAL | |
| Detail | `/clasificados/bienes-raices/anuncio/[id]` | Canonical detail | **Redirect** → `/clasificados/anuncio/[id]?origen=br` | N/A (redirect) | Uses unified anuncio share | TRUE | |
| Detail | `/clasificados/empleos/[slug]` | Job title + company | DB row → title/description/OG; seed only when policy allows | Indexable when published | `empleosJobPublicAbsoluteUrl` canonical | TRUE | `empleosOmitMarketingSeedCatalog()` in prod |
| Detail | `/clasificados/rentas/anuncio/[id]` | Rentas detail | Redirect/alias to anuncio contract (W8) | Same as anuncio | Same | TRUE | |
| Detail | `/clasificados/rentas/listing/[id]` | Rentas title + address | `generateMetadata` from live row; demo only non-prod | Indexable when live | Share via rentas client | TRUE | |
| Detail | `/clasificados/servicios/[slug]` | Business name + about | `[slug]/layout.tsx` `generateMetadata` from DB `profile_json` | Indexable when published | OG title; no fake image | TRUE | Production vitrina |
| Detail | `/clasificados/restaurantes/[slug]` | Restaurant name + summary | `generateMetadata` from DB; `notFound()` when missing | Indexable when live | Share on `RestauranteAdStoryPreview` | TRUE | |
| Detail | `/clasificados/viajes/oferta/[slug]` | Offer title + description | Staged bundle first; curated demo only when `viajesAllowCuratedDemoCatalog()` | Indexable when staged public | Share uses public slug URL | TRUE | Prod: staged only |
| Detail | `/clasificados/viajes/negocio/[slug]` | Provider profile | Sample data; `notFound()` when demo catalog off | Demo slugs 404 in prod | N/A in prod | TRUE | Guarded by `viajesAllowCuratedDemoCatalog()` |
| Private | `/clasificados/publicar/*` | noindex | `publicar/layout.tsx` `robots: { index: false, follow: true }` | Blocked in `robots.txt` | Must not be shared as canonical | TRUE | |
| Private | `/publicar/*` | noindex | `publicar/layout.tsx` same robots | Blocked in `robots.txt` | Share helper blocks `/publicar` | TRUE | |
| Private | Preview routes | noindex | BR/rentas preview **layouts** `noindex`; W9 added `PREVIEW_NOINDEX_METADATA` to empleos/servicios previews; `robots.txt` expanded | Crawlers discouraged | `isLikelyInternalOrPreviewUrl` | TRUE | W9 tightened |
| Private | `/dashboard/*` | noindex | **W9:** `dashboard/layout.tsx` `robots: noindex` | `robots.txt` `/dashboard` | Auth redirect; not share targets | TRUE | W9 fix |
| Private | `/admin/*` | noindex | **W9:** `admin/layout.tsx` `robots: noindex` | `robots.txt` `/admin` | No admin URLs in share helper | TRUE | W9 fix |
| Private | Payment result `/clasificados/autos/pago/*` | noindex | No dedicated metadata; under `/clasificados` | Not in sitemap; not linked from SEO hubs | Not used as share URL | DEFERRED_INTENTIONAL | Add explicit noindex in W10 if needed |
| Legacy | `/servicios/perfil/[slug]` | Redirect or 404 | **W9:** 301-style `redirect` to `/clasificados/servicios/[slug]` when live; else `notFound()`; no demo SEO | `robots.txt` `/servicios/perfil` | Canonical points to clasificados slug | TRUE | W9 fix (W8 follow-up) |
| Language | `?lang=es|en` | Stable canonical | Most canonicals omit `lang` (good); Empleos job canonical includes lang in absolute URL intentionally | No duplicate canonical per lang on hubs | Share uses resolved public URL | TRUE | Empleos documents bilingual permalink |

---

## 2. Dynamic detail metadata matrix

| Detail type | Route | Title source | Description source | Image source | Canonical | Missing listing behavior | Status | Notes |
|---|---|---|---|---|---|---|---|
| Generic listing | `/clasificados/anuncio/[id]` | `listings.title` (server fetch) | Stripped `description` (max 155) | `images[0]` or `/logo.png` | `/clasificados/anuncio/{id}` | `noindex` + fallback title | TRUE | W9 `fetchListingHeadMetadata` |
| Autos vehicle | `/clasificados/autos/vehiculo/[id]` | `bundle.publicRow.vehicleTitle` | `{title} · {city}, {state}` | None in metadata | Path id (UUID) | Generic "Vehículo \| Leonix Autos" title | TRUE | Page `notFound` when not live |
| Autos dealer | `/clasificados/autos/dealer/[groupId]` | Inherited | Inherited | Site default | Path segment | Client handles empty inventory | DEFERRED_INTENTIONAL | |
| BR listing | `/clasificados/bienes-raices/anuncio/[id]` | Redirect to anuncio | — | — | Unified anuncio | Redirect | TRUE | |
| Empleos job | `/clasificados/empleos/[slug]` | `job.title — job.company` | `job.summary` | Not set (no fake OG) | Absolute URL with lang | Generic title; page `notFound` when no row+no seed | TRUE | |
| Rentas listing | `/clasificados/rentas/listing/[id]` | `listing.title — rentDisplay` | `listing.addressLine` | Not set | Path id | Generic "Rentas \| Leonix" | TRUE | |
| Servicios vitrina | `/clasificados/servicios/[slug]` | `profile.identity.businessName` | `about.text` slice | Not set | Slug path (layout) | Fallback title; page handles 404 | TRUE | `title.absolute` in layout |
| Restaurantes | `/clasificados/restaurantes/[slug]` | `business_name` | `summary_short` | Not set | Slug path | Fallback + `notFound()` | TRUE | |
| Viajes offer | `/clasificados/viajes/oferta/[slug]` | Staged `offer.title` | `offer.description` | Not set | Slug path | Generic title → `notFound()` | TRUE | |
| Legacy servicios | `/servicios/perfil/[slug]` | N/A (redirect) | N/A | N/A | `/clasificados/servicios/{slug}` | `notFound()` | TRUE | W9 redirect |

---

## 3. Private / noindex matrix

| Route type | Example route | Should index? | Current guard | Status | Notes |
|---|---|---:|---|---|---|
| Publish chooser | `/clasificados/publicar` | No | layout `noindex` + `robots.txt` | TRUE | |
| Publish flows | `/publicar/autos`, `/publicar/clases/quick` | No | `publicar/layout.tsx` + `robots.txt` `/publicar` | TRUE | |
| Session preview | `/clasificados/bienes-raices/preview/*` | No | preview layouts `noindex,nofollow` | TRUE | |
| Empleos marketing preview | `/clasificados/empleos/quick-preview` | No | W9 `PREVIEW_NOINDEX_METADATA` + robots disallow | TRUE | |
| En venta preview | `/clasificados/en-venta/preview` | No | `robots.txt` disallow | DEFERRED_INTENTIONAL | Add page-level noindex W10 |
| Restaurantes shell | `/clasificados/restaurantes/shell` | No | page `robots` + robots.txt | TRUE | |
| User dashboard | `/dashboard/mis-anuncios` | No | W9 `dashboard/layout.tsx` + robots.txt | TRUE | |
| Admin | `/admin/usuarios` | No | W9 `admin/layout.tsx` + robots.txt | TRUE | |
| API | `/api/*` | No | `robots.txt` `/api` | TRUE | |
| Legacy servicios demo | `/servicios/perfil/demo-slug` | No | redirect/notFound + robots disallow | TRUE | W9 |
| Launch checklist | `/clasificados/en-venta/launch-checklist` | No | page `noindex` + robots disallow | TRUE | |

---

## 4. Sitemap / robots

| Asset | Status | Notes |
|---|---|---|
| `app/robots.ts` | TRUE (W9 expanded) | Allows `/`; disallows `/admin`, `/api`, `/dashboard`, publish roots, legacy `/servicios/perfil`, major preview paths |
| `app/sitemap.ts` | DEFERRED_INTENTIONAL | Exists; lists core marketing URLs only (`/home`, `/clasificados`, `/magazine/2026`, policies). Does **not** enumerate dynamic listings yet — honest deferral |
| `metadataBase` | TRUE | `LEONIX_SITE_ORIGIN` in root layout resolves relative OG URLs |

---

## 5. Social share readiness

| Check | Status | Evidence |
|---|---|---|
| Share uses public URLs | TRUE | `LeonixShareButton` → `getSafePublicAdUrl` / `isLikelyInternalOrPreviewUrl` blocks `/admin`, `/dashboard`, `/publicar`, `/preview` |
| No preview/admin URLs in share hub | TRUE | `ctaDataHelpers.ts` `INTERNAL_PATH_SNIPPETS` |
| Detail pages have title for share sheet | TRUE | Listing title passed to share components on cards/detail |
| OG sufficient for WhatsApp/iMessage | DEFERRED_INTENTIONAL | Anuncio + root have images; many slug pages title/description only (no fabricated OG image) |
| Legacy demo not encouraged | TRUE | W9 redirect off `/servicios/perfil/[slug]` |

---

## 6. W8 follow-up — legacy Servicios perfil

| Item | W9 resolution |
|---|---|
| `/servicios/perfil/[slug]` demo sample data | **Fixed:** redirect to `/clasificados/servicios/[slug]` when DB listing exists; `notFound()` otherwise |
| Production `/clasificados/servicios/[slug]` | Unchanged; still source of truth |

---

## W9 blockers before launch

### Resolved in W9

| route/group | file path | issue | fix |
|---|---|---|---|
| Legacy Servicios demo | `app/(site)/servicios/perfil/[slug]/page.tsx` | Demo profiles indexable with fake metadata | Redirect + `notFound()`; robots disallow |
| Generic anuncio head | `app/(site)/clasificados/anuncio/[id]/layout.tsx` | Static "Anuncio" title for all listings | Server fetch listing title/description/image |
| Dashboard/admin indexing | `dashboard/layout.tsx`, `admin/layout.tsx` | No explicit `noindex` | Added `robots: { index: false, follow: false }` |
| Preview crawl | `app/robots.ts`, preview pages | Incomplete disallow | Expanded disallow + `PREVIEW_NOINDEX_METADATA` on key previews |

### Open for W10/W11

| route/group | file path | issue | SEO impact | social share impact | production risk | recommended fix | fixed in W9? |
|---|---|---|---|---|---|---|---|
| Legal hub | `app/(site)/legal/page.tsx` | Client-only; no route metadata | Generic root title in SERP | Generic OG | Low | Add `generateMetadata` or server page | No — W10 |
| Sitemap coverage | `app/sitemap.ts` | No category/results/detail URLs | Slower discovery of hubs | None | Low | Extend sitemap when URL policy locked | No — W10 |
| En venta preview | `clasificados/en-venta/preview/page.tsx` | robots.txt only | Possible index of preview | Preview URL could be shared | Low | Add `PREVIEW_NOINDEX_METADATA` | Partial (robots only) |
| Autos OG images | `autos/vehiculo/[id]/page.tsx` | No `openGraph.images` | Weaker rich previews | WhatsApp preview text-only | Low | Pass first gallery photo when available | No — W10 |
| `/` splash | `app/(site)/page.tsx` | No dedicated metadata | Splash competes with `/home` | Site-level only | Low | `noindex` splash or canonical to `/home` | No — W10 |

---

## 7. W9 verification checklist

| # | Item | Result |
|---|---|---|
| 1 | Public SEO routes audited | Core marketing + policies (see §1) |
| 2 | Clasificados/category metadata audited | Hub + results; mix of explicit metadata and safe inheritance |
| 3 | Detail/social metadata audited | Matrix §2; anuncio/servicios/empleos/restaurantes/viajes verified |
| 4 | Private/noindex verified | §3 + robots + W9 layout fixes |
| 5 | Sitemap/robots | robots expanded; sitemap minimal (documented) |
| 6 | Legacy Servicios demo | Redirect/notFound (W9 fix) |
| 7 | Blockers | 4 fixed in W9; 5 documented for W10 |
| 8 | Files changed | See §8 below |
| 9 | `npm run build` | PASS (`exit_code: 0`, 2026-05-27; Windows artifact retry) |

---

## 8. Files changed (W9)

| File | Change |
|---|---|
| `app/lib/website-audit/WEBSITE_W9_SEO_METADATA_SOCIAL_SHARE_AUDIT.md` | This audit |
| `app/lib/seo/fetchListingHeadMetadata.ts` | Server listing head fetch for anuncio metadata |
| `app/lib/seo/previewRouteMetadata.ts` | Shared preview `noindex` metadata |
| `app/(site)/clasificados/anuncio/[id]/layout.tsx` | Dynamic metadata + missing-listing `noindex` |
| `app/(site)/servicios/perfil/[slug]/page.tsx` | Redirect to production servicios slug |
| `app/robots.ts` | Expanded disallow list |
| `app/(site)/dashboard/layout.tsx` | Dashboard `noindex` |
| `app/admin/layout.tsx` | Admin `noindex` |
| `app/(site)/clasificados/empleos/quick-preview/page.tsx` | Preview noindex |
| `app/(site)/clasificados/empleos/premium-preview/page.tsx` | Preview noindex |
| `app/(site)/clasificados/empleos/feria-preview/page.tsx` | Preview noindex |
| `app/(site)/clasificados/publicar/servicios/preview/page.tsx` | Preview noindex |

---

## Build gate

```
npm run build
```

**Result:** PASS (`exit_code: 0`, 2026-05-27 local run, ~271s including one Windows `.next` artifact retry).
