# 03B — G49 Newsletter · G50 SEO · G51 A11y/Responsive · G52 PWA · G53 Security/RLS/Privacy

**Batch 8 · Read-only forensic audit · 2026-09-09**

## 0. Refs used (verified at audit time)

| Label | SHA | Notes |
|---|---|---|
| **TRUE current — `origin/main`** | `a0a47839` (`a0a4783971b42ea1d71ab2602d4720d0d590baf8`) | Verified twice: at audit start and immediately before writing this file. **Every finding below is read from this ref** via `git show origin/main:<path>` / `git grep -n … origin/main`. |
| Primary working tree (`main`) | `d09d979c` | **112 commits STALE** (`git rev-list --count HEAD..origin/main` = 112). Not read. |
| Sealed Sept | `e3956df8` | A **FORK**, not an ancestor. Merge-base `7878d856`. Read only where explicitly labelled. |
| Newsletter worktree | `cd52ffd2` (`feature/newsletter-engine-v2`) | See §1.0 — **ancestor of `origin/main`**. |

Unless a row says otherwise, **every `path:line` in this document is on `origin/main` (`a0a47839`)**.

---

# G49 — NEWSLETTER

## 1.0 Worktree `/c/projects/elaguila-website-newsletter-v2` — MERGE-vs-DISCARD verdict

**VERDICT: DISCARD. Fully integrated. Nothing to merge.**

Both the ancestry check *and* the mandated content diff agree — this is **not** a false negative like the three autos branches in Batch 4.

```
git rev-list --count origin/main..cd52ffd2   ->  0
git log --oneline origin/main..cd52ffd2      ->  (empty)
git merge-base origin/main cd52ffd2          ->  cd52ffd2c5afb039223f8c511a281427a5f648a4
```

The merge-base **equals the branch tip**, i.e. `cd52ffd2` is a strict ancestor of `origin/main`.

**Content diff (the check Batch 4 proved is mandatory):**

```
git diff --stat origin/main cd52ffd2  ->  1317 files changed, 14316 insertions(+), 179842 deletions(-)
```

Direction matters: those 179,842 deletions are what you would *lose* going `origin/main -> cd52ffd2`. `origin/main` is strictly ahead. Newsletter-path files confirm it:

| File | `origin/main` -> `cd52ffd2` |
|---|---|
| `app/api/newsletter/unsubscribe/route.ts` | **D** (exists only on origin/main) |
| `app/lib/newsletter/newsletterUnsubscribeServer.ts` | **D** |
| `app/lib/newsletter/newsletterUnsubscribeToken.ts` | **D** |
| `app/(site)/newsletter/unsubscribe/page.tsx` | **D** |
| `supabase/migrations/20260827180000_leonix_newsletter_unsubscribe.sql` | **D** |
| `app/api/newsletter/subscribe/route.ts`, `checkout-capture/route.ts`, `checkoutNewsletterCapture.ts`, `scripts/verify-newsletter-engine-v2.ts` | **M** (origin/main newer) |

The whole Step-5 unsubscribe subsystem exists **only on `origin/main`** — the worktree predates it.

`git diff --diff-filter=A --name-only origin/main cd52ffd2` returns **30 files**, and **none are newsletter files**. All 30 are `bienes-raices/negocio` preview-mockup / application section files that `origin/main` *deleted* (see §2.5 — the robots.txt disallow list still references one of those removed routes).

**No action. The worktree can be pruned.**

## 1.1 Newsletter system inventory (`origin/main`)

| Concern | Status | Evidence |
|---|---|---|
| Signup UI | **PRESENT** — public page + client | `app/(site)/newsletter/page.tsx`, `app/(site)/newsletter/NewsletterPageClient.tsx` |
| Secondary capture | **PRESENT** — paid-checkout opt-in checkbox, 8 category sources | `app/lib/newsletter/checkoutNewsletterCapture.ts:24-35` (`CHECKOUT_NEWSLETTER_SOURCES`) |
| Storage table | `public.leonix_newsletter_subscribers` | created by the `leonix_lead_capture` migration; extended by 3 later migrations (below) |
| Migrations | 3 | `supabase/migrations/20260611120000_newsletter_media_kit_lifecycle.sql` (soft archive/delete), `…20260826130000_leonix_newsletter_verification_state.sql` (double-opt-in columns), `…20260827180000_leonix_newsletter_unsubscribe.sql` (unsubscribe token) |
| **Double opt-in** | **FALSE — schema only, zero wiring** | See §1.2 |
| Send pipeline | **FALSE — no bulk/campaign sender exists** | See §1.3 |
| Provider | Resend, single-message HTTP only | `app/lib/email/sendLeonixResendEmail.ts:41` — `fetch("https://api.resend.com/emails")`. No Audiences/Contacts/Broadcasts API call anywhere. |
| **Scheduler** | **FALSE — none, confirmed for newsletter** | See §1.4 |
| Admin surface | **PRESENT** | `app/admin/(dashboard)/leads/newsletter/page.tsx`, `app/admin/_components/leads/AdminNewsletterSubscribersInboxClient.tsx`, `…AdminNewsletterSubscriberDetailDrawer.tsx` |
| Unsubscribe | **PRESENT and correct — but unreachable** | See §1.5 |
| GDPR / CAN-SPAM | **PARTIAL** | See §1.6 |

## 1.2 Double opt-in — FALSE (foundation is dead code)

The migration itself says so, in its own header (`supabase/migrations/20260826130000_leonix_newsletter_verification_state.sql`, lines 12-17):

> *"this migration is STORAGE/SCHEMA ONLY. No outbound verification email is sent by any code in this change: nothing currently writes `'pending_verification'` or a token."*

Confirmed against `origin/main`, not just taken on trust:

- `git grep -n "newsletterVerificationState" origin/main -- app/` returns **zero importers**. The only hits are two comment references inside `app/lib/newsletter/newsletterUnsubscribeToken.ts:5,11`.
- No app code writes `pending_verification` to `leonix_newsletter_subscribers`. Every `pending_verification` hit in `app/` belongs to the unrelated **manual-payment** state machine (`app/lib/listingPlans/manualClearedPayments.ts:76,93,128,134,174`; `app/lib/listingPlans/refundDisputePolicy.ts:49,52`).
- The client contract concedes it: `app/lib/newsletter/checkoutNewsletterCapture.ts:56-58` — *"`PENDING_VERIFICATION` is reserved for a future double-opt-in flow … no current server code returns it yet."*

`app/lib/newsletter/newsletterVerificationState.ts` is a complete, unused module. **Every subscriber is single-opt-in.**

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Newsletter (same subsystem) | **REFERENCE PATH:** `app/lib/newsletter/newsletterUnsubscribeToken.ts` + `app/lib/newsletter/newsletterUnsubscribeServer.ts:35-51` + `app/api/newsletter/unsubscribe/route.ts` + `app/(site)/newsletter/unsubscribe/page.tsx` — a working end-to-end opaque-token issue/validate/consume flow, deliberately built as the twin of the verification token | **TARGET PATH:** `app/lib/newsletter/newsletterVerificationState.ts` | **DIFFERENCE:** the unsubscribe twin has a token generator wired into the write path (`app/lib/leonix/leadCaptureServer.ts:170,180-181`), a route, and a page; the verification twin has none of the three | **ACTION: ADOPT EXISTING** — mirror the unsubscribe flow's three missing pieces.

## 1.3 Send pipeline — FALSE (no newsletter is ever sent to anyone)

There is **no campaign, broadcast, blast, digest, or batch sender**. `git grep -in "campaign\|broadcast\|blast" origin/main -- app/lib/email/ app/api/newsletter/` returns **zero hits**.

Only three routes touch `/api/newsletter/**`: `subscribe`, `checkout-capture`, `unsubscribe`. The **only** email `subscribe` sends is an **internal team notification**, addressed to the ops mailbox, not to the subscriber:

`app/api/newsletter/subscribe/route.ts:139,155-162` — `resolveLeonixNotificationEmail()` -> `sendLeonixResendEmail({ to: notificationTo, … })`, with the subscriber's address used only as `replyTo`. The route comment at `:166` labels it *"Internal team notification (not the subscriber-facing promo email)."*

The one subscriber-facing email that ever existed has been **retired**: `app/api/newsletter/subscribe/route.ts:203-205` — *"Newsletter promo code minting (Launch 25) has been retired"*; `promoCodeCreated/Reused/EmailSent` are now hardcoded `false` and `promoCodeEmailStatus` hardcoded `"not_created"` (`:206-215`). `app/lib/email/newsletterPromoCodeEmail.ts` remains on disk.

**The newsletter is a subscriber-collection system with no outbound newsletter.** The de-facto send channel is a human downloading the CSV (§1.6, §5.3).

## 1.4 Scheduler — FALSE (confirmed for newsletter, matching `14_SEARCH_…_AUDIT.md §A.1`)

Independently re-confirmed on `origin/main`:

- `git ls-tree -r --name-only origin/main | grep -i vercel` -> only `app/leo/_lib/leoVercelProjectAdapter.ts`, `public/vercel.svg`, `public/public/vercel.svg`. **There is no `vercel.json` anywhere in the repo.** No Vercel Cron can exist.
- `git grep -in "pg_cron\|cron.schedule" origin/main -- supabase/` -> **zero hits** across all 163 migrations.
- `git ls-tree -r --name-only origin/main -- app/api/ | grep -i cron` -> **zero** cron route handlers.
- No `.github/workflows` (see §4.1) — so no scheduled GitHub Action either.

**There is no mechanism of any kind, in this repo, that could fire a newsletter on a schedule.**

## 1.5 Unsubscribe — PRESENT, correct, and **structurally unreachable**

The implementation is genuinely good:

- Separate secret from the verification token, by design — `app/lib/newsletter/newsletterUnsubscribeToken.ts:5-9`, restated in the migration comment `…20260827180000_leonix_newsletter_unsubscribe.sql:32-34` (*"never accept this value in place of a verification token or vice versa"*).
- Lookup is **by token only, never by email** — `app/lib/newsletter/newsletterUnsubscribeServer.ts:35-36` (`.eq("unsubscribe_token", token)`), so one subscriber can never affect another's row.
- Token checked **before** status, so an invalid token cannot probe whether a row exists — `newsletterUnsubscribeToken.ts:74-80`.
- Idempotent, GET-safe, RFC 8058-shaped — `app/api/newsletter/unsubscribe/route.ts:8-18`.
- Token is issued eagerly on every write path, including backfill for pre-existing rows — `app/lib/leonix/leadCaptureServer.ts:145-149` (patch when absent), `:170,180-181` (insert), `:209-213` (insert-race branch). 730-day expiry.
- Confirmation page is bilingual, truthful, and `robots: { index: false, follow: false }` — `app/(site)/newsletter/unsubscribe/page.tsx:29`.

**The defect:** `git grep -n "newsletter/unsubscribe" origin/main -- app/ scripts/ docs/` returns exactly **one** hit — a verifier reading the route's source (`scripts/verify-newsletter-engine-v2.ts:276`). **No email, template, or header anywhere emits the unsubscribe URL.** `git grep -in "list-unsubscribe" origin/main -- app/` -> **zero hits**, and `sendLeonixResendEmail` has no `headers` parameter at all (`app/lib/email/sendLeonixResendEmail.ts:28-45` — the payload accepts only `from/to/subject/text/html/reply_to`).

A correct unsubscribe engine that no subscriber can ever discover.

## 1.6 GDPR / CAN-SPAM

| Requirement | Status | Evidence |
|---|---|---|
| Explicit consent required | **PASS** | `app/api/newsletter/subscribe/route.ts:52-66` — hard 400 without consent |
| Consent timestamp stored | **PASS** | `:68` `consentTimestamp`, persisted and exported |
| Privacy policy page | **PASS** | `app/(site)/privacy/page.tsx`, `app/(site)/legal/page.tsx` |
| Data-deletion request path | **PASS** | `app/(site)/data-deletion/page.tsx` |
| Subscriber erasure (operator side) | **PASS** | `app/api/admin/leads/newsletter/[id]/route.ts:34-46` — archive/restore/delete; soft-delete columns from `…20260611120000_newsletter_media_kit_lifecycle.sql` |
| Suppression respected on export | **PASS (send-ready CSV)** | `app/admin/_lib/leonixLeadsCsv.ts` — `newsletterReadyEmailsCsv` filters `r.status === "subscribed"` |
| **Unsubscribe link in every commercial message** | **N/A today, FAILS the moment a send happens** | §1.5 — no message carries one; no `List-Unsubscribe` header capability exists |
| **Double opt-in** | **FALSE** | §1.2 |
| **Full CSV includes unsubscribed rows + full PII** | **RISK** | `newsletterSubscribersToCsv` emits `email, name, city, zip_code, preferred_language, consent_timestamp, status` for **all** non-soft-deleted rows, unsubscribed included. Only `deleted_at IS NULL` is filtered (`app/admin/_lib/leonixLeadsData.ts`, `fetchAllNewsletterSubscribersForExport`). |

Because no bulk mail is sent from this codebase, CAN-SPAM is not currently violated *by this repo*. The exposure is operational: the only way to actually mail the list is to export the CSV and send from an external tool, and the CSV carries no unsubscribe token — so any send performed that way is unsubscribe-less by construction.

---

# G50 — SEO

## 2.1 Global discovery contracts

| Item | Status | Evidence |
|---|---|---|
| `app/sitemap.ts` | PRESENT, hub+marketing+recursos | delegates to `buildLeonixSitemap` and adds `EXTRA_MARKETING_PATHS` + DB-backed Recursos entries |
| `app/robots.ts` | PRESENT | delegates to `buildLeonixRobots`, `app/lib/seo/leonixDiscoveryContracts.ts:60-73` |
| `app/metadata.ts` | **VESTIGIAL** | its own header: *"Legacy entry point — root `app/layout.tsx` owns live metadata."* Live metadata is `app/layout.tsx:15-64`. |
| `LEONIX_SITEMAP_CATEGORY_HUBS` | **VERIFIED — all 14 present** | `app/lib/seo/leonixDiscoveryContracts.ts:31-46` |
| Per-listing detail URLs in sitemap | **INTENTIONALLY ABSENT** | `leonixSitemapOmitsPerListingDetailUrls(): true` at `app/lib/seo/leonixDiscoveryContracts.ts:108`; rationale in `app/sitemap.ts` header. Zero detail URLs submitted for any of the 14 categories. |
| **Canonical URL builder in `app/lib/seo/`** | **DOES NOT EXIST** | `app/lib/seo/` contains only 4 files: `breadcrumbJsonLd.ts`, `fetchListingHeadMetadata.ts`, `leonixDiscoveryContracts.ts`, `previewRouteMetadata.ts`. None exports one. |
| Nearest thing to a builder | `buildPublicPillarMetadata(id, lang)` — `app/lib/leonix/publicPillarSeo.ts:152`, canonical at `:159` from the `PUBLIC_PILLAR_PATH` map at `:22` | **Of the 14 category hubs, only viajes calls it** (`app/(site)/clasificados/viajes/page.tsx:15`). Every other clasificados canonical is a hand-typed string literal — which is precisely why 5 hubs have none. |

## 2.2 THE PER-CATEGORY MATRIX (all 14 hubs)

Legend: **Y** = present · **N** = absent · **inh** = inherited from a segment `layout.tsx`

| # | Category hub | (a) hub metadata | (a) hub `alternates.canonical` | (b) hub JSON-LD | (c) `BreadcrumbList` JSON-LD | (d) detail canonical | (d) detail JSON-LD @type | (e) hreflang |
|---|---|---|---|---|---|---|---|---|
| 1 | `/clasificados/en-venta` | Y `en-venta/page.tsx:13` | **Y** `seo/enVentaMetadata.ts:16` | N | Y (conditional, premium BR lane only) `en-venta/listing/EnVentaAnuncioLayout.tsx:778` | Y `clasificados/anuncio/[id]/layout.tsx:22,50` | `ClassifiedAd` `anuncio/[id]/page.tsx:1569` | **N** |
| 2 | `/clasificados/rentas` | Y `rentas/page.tsx:4` | **N** | N | **N** (visual only, `rentas/results/components/RentasResultsTopBar.tsx:20`) | Y `rentas/listing/[id]/page.tsx:31` | **NONE** *(GAP-060 CONFIRMED)* | **N** |
| 3 | `/clasificados/empleos` | Y `empleos/page.tsx:5` | **Y** `:9-11` | N | **N** (visual only, `EmpleoPublicDetailClient.tsx:153`) | Y (absolute) `empleos/[slug]/page.tsx:31,39` | `JobPosting` `page.tsx:118` -> `lib/empleosJobPostingSchema.ts:28` | **N** |
| 4 | `/clasificados/autos` | Y `autos/page.tsx:7` | **Y** `:7-9` | N | **N** (visual only, on a noindexed preview chrome) | Y `autos/vehiculo/[id]/page.tsx:22,32` | `Vehicle` `page.tsx:72` -> `seo/autosVehicleJsonLd.ts:25` | **N** |
| 5 | `/clasificados/bienes-raices` | Y `bienes-raices/page.tsx:5` | **N** | N | Y (via the BR branch of the En Venta layout) | Y — detail is a redirect shim `bienes-raices/anuncio/[id]/page.tsx:10` -> `/clasificados/anuncio/[id]` (`layout.tsx:50`) | `ClassifiedAd` | **N** |
| 6 | `/clasificados/servicios` | Y `servicios/page.tsx:8` | **Y** `:12-14` | N | **N** | Y `servicios/[slug]/layout.tsx:46` | `LocalBusiness` `[slug]/page.tsx:203` -> `app/(site)/servicios/seo/serviciosJsonLd.ts:22` (only when `isPublishedLive`, `:188`) | **N** |
| 7 | `/clasificados/restaurantes` | **N** on `page.tsx` | **Y (inh)** `restaurantes/layout.tsx:7-9` — see §2.5 leak | N | **Y** `restaurantes/[slug]/page.tsx:117` | Y `[slug]/page.tsx:46` | `Restaurant` `:116` -> `seo/restauranteJsonLd.ts:23` + `BreadcrumbList` | **N** |
| 8 | `/clasificados/comida-local` | Y `comida-local/page.tsx:29` | **Y** `:33` | **N** | **N** | Y `comida-local/[slug]/page.tsx:52` | **NONE** *(GAP-052 CONFIRMED)* | **N** |
| 9 | `/clasificados/viajes` | Y `viajes/page.tsx:11-16` | **Y** `app/lib/leonix/publicPillarSeo.ts:159` | **Y — `CollectionPage`** `viajes/page.tsx:28` -> `publicPillarSeo.ts:183` | **N** | **N** `viajes/negocio/[slug]/page.tsx:30-39`, `viajes/oferta/[slug]/page.tsx:34-45` | **NONE** | **N** |
| 10 | `/clasificados/comunidad` | **N — `"use client"`** `comunidad/page.tsx:1` | **N** | N | N | Y (shared `/clasificados/anuncio/[id]`) | `ClassifiedAd` | **N** |
| 11 | `/clasificados/clases` | **N — `"use client"`** `clases/page.tsx:1` | **N** | N | N | Y (shared) | `ClassifiedAd` | **N** |
| 12 | `/clasificados/busco` | **N — `"use client"`** `busco/page.tsx:1` | **N** | N | **N** (visual only, `busco/shared/BuscoShellLayout.tsx:24`) | Y (shared) | `ClassifiedAd` | **N** |
| 13 | `/clasificados/mascotas-y-perdidos` | **N — `"use client"`** `mascotas-y-perdidos/page.tsx:1` | **N** | N | **N** (visual only, `…/shared/MascotasPerdidosShellLayout.tsx:24`) | Y (shared) | `ClassifiedAd` | **N** |
| 14 | `/clasificados/ofertas-locales` | Y `ofertas-locales/page.tsx:8` | **N** | N | **N** | **N** `ofertas-locales/[id]/page.tsx:19-38` | **NONE** | **N** |

### Collapsed counts

| Metric | Score |
|---|---|
| Hub declares its own metadata | **9 / 14** (10 counting restaurantes' inherited layout) |
| Hub `alternates.canonical` | **8 / 14** (9 counting restaurantes' inherited — which is itself a bug, §2.5) |
| **Hub JSON-LD of any type** | **1 / 14** — viajes only |
| **`BreadcrumbList` JSON-LD anywhere on the category** | **2 / 14** — restaurantes, en-venta (conditional) |
| Detail route canonical | **10 / 14** |
| Detail route JSON-LD | **8 / 14** |
| **hreflang / `alternates.languages`** | **0 / 14 — zero across the entire `app/` tree** |
| `ItemList` structured data on any results/hub page | **0** — emitted nowhere |

### The four client-component hubs — a structural, not cosmetic, gap

`comunidad`, `clases`, `busco`, `mascotas-y-perdidos` all begin with `"use client"` on **line 1**. Next.js **cannot** export `metadata`/`generateMetadata` from a client component, and `app/(site)/clasificados/layout.tsx:1-4` is a deliberate no-op segment layout that supplies nothing. So these four ship with **no title, no description, no canonical, no JSON-LD** — and all four are nevertheless submitted to Google in the sitemap (`app/lib/seo/leonixDiscoveryContracts.ts:41-45`). This **CONFIRMS GAP-073** at the SEO layer and identifies the root cause.

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Viajes | **REFERENCE PATH:** `app/(site)/clasificados/viajes/page.tsx:11-16,28` + `app/lib/leonix/publicPillarSeo.ts:152,159,183` | **TARGET PATH:** the 4 client hubs above, plus rentas / bienes-raices / ofertas-locales for canonical, plus 13 of 14 for hub JSON-LD | **DIFFERENCE:** viajes is a server component that calls `buildPublicPillarMetadata` (canonical) and renders `<PublicPillarJsonLd>` (`CollectionPage`); the targets are either client components that structurally cannot, or server components that simply never call the builder | **ACTION: ADOPT EXISTING** — split each client hub into a thin server `page.tsx` (metadata + JSON-LD) wrapping the existing client body, then register the 13 missing hub paths in `PUBLIC_PILLAR_PATH` (`publicPillarSeo.ts:22`).

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Restaurantes | **REFERENCE PATH:** `app/lib/seo/breadcrumbJsonLd.ts:21,23` consumed at `app/(site)/clasificados/restaurantes/[slug]/page.tsx:108,117` | **TARGET PATH:** the 12 categories with no `BreadcrumbList` — notably busco, mascotas-y-perdidos, empleos and autos, which render a **visual** breadcrumb with no structured counterpart | **DIFFERENCE:** the helper exists and is proven in production on one route; the other 12 never import it | **ACTION: ADOPT EXISTING.** `app/lib/seo/breadcrumbJsonLd.ts:4-7` already documents this exact gap.

> **PROVEN REFERENCE EXISTS: NO** (for hreflang) | **REFERENCE CATEGORY:** — | **REFERENCE PATH:** none; `alternates.languages` appears nowhere in `app/` | **TARGET PATH:** all 14 categories + every public page | **DIFFERENCE:** the site is bilingual via a `?lang=es|en` query parameter, so every ES and EN rendering of every page shares one canonical with no language annotation — Google sees one page, not two | **ACTION: NET NEW.**

## 2.3 Full JSON-LD `@type` inventory (every emission site in `app/`)

| Emitter | `@type`(s) |
|---|---|
| `app/layout.tsx:70` -> `app/components/LeonixRootJsonLd.tsx:11,16,20,27,31` | `Organization`, `ImageObject`, `WebSite` (site-wide `@graph`) |
| `app/components/PublicPillarJsonLd.tsx:7` -> `app/lib/leonix/publicPillarSeo.ts:183` | `WebPage` (home) / `CollectionPage` (pillars), `WebSite` |
| `app/(site)/clasificados/anuncio/[id]/page.tsx:1564,1569` | `ClassifiedAd`, `PostalAddress` |
| `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx:776,778` -> `en-venta/seo/enVentaJsonLd.ts:10,17` | `ClassifiedAd`, `PostalAddress`, `BreadcrumbList` |
| `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx:72` -> `autos/seo/autosVehicleJsonLd.ts:25,29,32,40,49` | `Vehicle`, `Brand`, `Offer`, `QuantitativeValue`, `PostalAddress` |
| `app/(site)/clasificados/empleos/components/EmpleosJobPostingJsonLd.tsx:18` -> `empleos/lib/empleosJobPostingSchema.ts:28,34,38,40,50,64,67` | `JobPosting`, `Organization`, `Place`, `PostalAddress`, `PropertyValue`, `MonetaryAmount`, `QuantitativeValue` |
| `app/(site)/clasificados/restaurantes/[slug]/page.tsx:116,117` -> `restaurantes/seo/restauranteJsonLd.ts:23` | `Restaurant`, `BreadcrumbList` |
| `app/(site)/clasificados/servicios/[slug]/page.tsx:203` -> `app/(site)/servicios/seo/serviciosJsonLd.ts:22` | `LocalBusiness` |
| `app/(site)/iglesias/[slug]/page.tsx:72,78,92` | `Church`, `PostalAddress` |
| `app/(site)/recursos-comunitarios/[category]/page.tsx:73,78,83` | `CollectionPage`, `WebSite` |
| `app/(site)/recursos-comunitarios/recurso/[slug]/page.tsx:139` -> `app/lib/recursos/recursosResourceJsonLd.ts:28,32,43` | `GovernmentOrganization` \| `LocalBusiness` \| `Organization` (dynamic), `PostalAddress` |
| `app/components/digitalContact/DigitalContactJsonLd.tsx:7` -> `app/lib/digitalContact/digitalContactSeo.ts:53,58,66,74,88,95` | `Organization`, `Person`, `PostalAddress`, `ContactPoint` |
| `app/lib/seo/breadcrumbJsonLd.ts:21,23` | `BreadcrumbList`, `ListItem` |

**Two anomalies:**

1. **`ClassifiedAd` is not a schema.org type.** It is emitted on the universal detail route (`anuncio/[id]/page.tsx:1569`) and on En Venta — i.e. on the detail page shared by en-venta, bienes-raices, comunidad, clases, busco and mascotas-y-perdidos, **6 of the 14 categories**. Google will not parse it as a rich result. This is a larger blast radius than the feria `JobPosting`-for-a-job-fair mistype (**GAP-066**, cited, not re-derived).
2. **`ItemList` is emitted nowhere.** No hub or results page in the entire application has list structured data.

## 2.4 Established gaps — confirmed on `origin/main` (cited, not re-derived)

| Gap | Status on `a0a47839` |
|---|---|
| **GAP-052** — comida-local emits no JSON-LD and no breadcrumb | **CONFIRMED.** Hub row 8 and detail: JSON-LD `NONE`, breadcrumb `N`. |
| **GAP-060** — canonical rentas detail route has no JSON-LD | **CONFIRMED.** `rentas/listing/[id]/page.tsx:31` has canonical, no JSON-LD. |
| **GAP-073** — 4 community lanes have no SEO/JSON-LD | **CONFIRMED, with root cause identified:** all four are `"use client"` on line 1 and therefore *cannot* export metadata (§2.2). |
| **GAP-066** — feria emits `JobPosting` for a job fair | Cited. Not re-derived. |
| **GAP-016 / GAP-066** — `/clasificados/publicar/autos` is a live duplicate-render shadow route | **CONFIRMED STILL LIVE.** `app/(site)/clasificados/publicar/autos/page.tsx:3` imports and renders `PublicarAutosBranchClient` from `@/app/publicar/autos/…` — the identical component served by the canonical `/publicar/autos` family (66 files). No redirect entry in `next.config.ts`, no canonical tag. |
| **GAP-016** — servicios and restaurantes serve the same page at two URLs | **⚠ PARTIALLY RESOLVED on `origin/main` — correct the ledger.** `app/(site)/restaurantes/**` **no longer exists** (0 files). `app/(site)/servicios/page.tsx` is **absent**; only `/servicios/perfil/**` and `/servicios/publicar` remain, and `/servicios/perfil` is already in the robots disallow list (`leonixDiscoveryContracts.ts:15`). The prior finding was almost certainly derived from the 112-commit-stale primary tree. **The autos half of GAP-016 is still live; the servicios/restaurantes half is fixed.** |

## 2.5 New duplicate-URL / canonical findings on `origin/main`

1. **`/results` vs `/resultados` — 11 categories carry both page files.** `next.config.ts` has **11** redirect `source:` entries (`:51-140`) but the direction is **inconsistent**: BR, empleos, busco, clases, mascotas, comunidad redirect `results -> resultados`, while en-venta, autos, restaurantes, servicios redirect `resultados -> results`.
2. **Viajes has both `results/` and `resultados/` page files and NO redirect entry in `next.config.ts`, and neither declares a canonical.** A genuine, unmitigated duplicate.
3. `app/(site)/clasificados/autos/results/page.tsx:3` re-exports the default from `../resultados/page` — one component, two paths; the canonical is declared only on the `/results` file (`:10`).
4. **Canonical leak — restaurantes.** `app/(site)/clasificados/restaurantes/layout.tsx:7-9` sets `canonical: "/clasificados/restaurantes"` on the **whole segment**, so `restaurantes/resultados`, `restaurantes/results` and every non-overriding child inherit the hub canonical. Only `paquetes/layout.tsx:6` and `[slug]/page.tsx:46` override. `app/(site)/clasificados/layout.tsx:1-4` explicitly documents avoiding exactly this pattern.
5. `app/(site)/clasificados/dealers-de-autos/page.tsx` + `dealers-de-autos/results/page.tsx:2` reuse `AutosPublicResultsShell` — a **third** URL family for Autos results, with no canonical.
6. **Stale robots entry.** `LEONIX_ROBOTS_DISALLOW_PATHS` still disallows `/clasificados/bienes-raices/negocio/preview-mockup` (`leonixDiscoveryContracts.ts:24`), a route `origin/main` has deleted (it survives only on the stale `cd52ffd2`, §1.0).
7. **4 URL-encoded literal shadow API routes** — see §5.5.

---

# G51 — ACCESSIBILITY / RESPONSIVE

## 3.1 What exists

`git ls-tree -r --name-only origin/main -- scripts/ | grep -i 'a11y\|accessib'` returns **exactly 2 files** out of **1,057** scripts:

- `scripts/ofertas-accessibility-baseline-audit.mjs`
- `scripts/ofertas-package-12-mobile-es-en-accessibility-audit.mjs`

Plus 16 "mobile/responsive" scripts, of which the only cross-cutting one is `scripts/verify-responsive-rendering-launch-gate-01.mjs`.

`cbc4cec1` *"fix(a11y): responsive + accessibility audit fixes across BR/Rentas surfaces (items 43,44)"* **is in `origin/main`** (verified ancestor). It was a **real, code-level** audit and produced **real** fixes: Escape-key handlers on `RentasFiltersDrawer.tsx` and `LeonixCorreoLeadModal.tsx`, a missing `htmlFor`/`id` pairing on a textarea label, and `aria-label` on 6 `sr-only` file inputs across `BienesRaicesPrivadoForm.tsx` / `RentasPrivadoForm.tsx` / `RentasNegocioForm.tsx`. **Scope: 16 BR/Rentas surfaces. One-time. No regression guard was added.**

## 3.2 What is actually ENFORCED — stated honestly

**Nothing. There is no automated accessibility or responsive enforcement in this repository.**

| Enforcement channel | Reality |
|---|---|
| **CI** | **NONE.** `git ls-tree -r --name-only origin/main \| grep -c "^\.github"` -> **0**. No `.github/workflows`, no `.gitlab-ci`, no `Jenkinsfile`, no `.circleci`, no `azure-pipelines`. |
| **Pre-commit hooks** | **NONE.** No `husky`, no `lint-staged`, no `.pre-commit-config`; `package.json` has no `prepare` hook. |
| **a11y lint plugin** | **NOT INSTALLED.** `eslint.config.mjs` extends `next/core-web-vitals` + `next/typescript` only. `eslint-plugin-jsx-a11y` is not configured. The only a11y rules in force are the ~6 that Next bundles (`alt-text`, `aria-props`, `aria-proptypes`, `aria-unsupported-elements`, `role-has-required-aria-props`, `role-supports-aria-props`). |
| **…and even those barely run** | `package.json` `"lint"` is scoped to **AUTOS PATHS ONLY**: `eslint "app/(site)/clasificados/autos/**" "app/(site)/publicar/autos/**" "app/lib/clasificados/autos/**" "app/api/clasificados/autos/**" "app/admin/(dashboard)/workspace/clasificados/autos/**" "scripts/autos-*.ts"`. Two more scoped scripts exist (`lint:br`, `lint:servicios`). **The rest of `app/` is never linted by any npm script.** |
| **a11y test deps** | **NONE.** `package.json` contains no `axe`, `jest-axe`, `pa11y`, or `lighthouse` dependency, and no `a11y`/`accessib` npm script. |
| **Build gate** | `"build": "node scripts/next-build.js"` is a Windows ENOENT/EPERM retry wrapper. It runs no verifier. |

## 3.3 The two a11y scripts do not test accessibility

`scripts/ofertas-accessibility-baseline-audit.mjs` reads **5 Ofertas source files** and asserts that the concatenated text **contains substrings**: `type="button"`, `href=`, `aria-label`, `aria-modal="true"`, `role="dialog"`, `aria-labelledby`, `alt={`, `onKeyDown`, `Escape`, `focus:ring`, `min-h-11`. It renders nothing, computes no contrast, traverses no accessibility tree, and cannot tell whether an `aria-label` is on the right element. **Neither script is wired into `package.json`** (`grep -n "ofertas-accessibility\|ofertas-package-12"` -> no match), so neither runs even manually via `npm run`.

`scripts/verify-responsive-rendering-launch-gate-01.mjs` **is** wired (`package.json:602`) — but it verifies that `docs/responsive-rendering-launch-gate-01.md` contains 14 required **section headings** and that a screenshot directory contains at least one `.png`. **It verifies that a document was written, not that the app is responsive.**

## 3.4 Honest verdict

Accessibility and responsiveness in this codebase are **documented, manually audited in narrow slices, and enforced nowhere**. Real fixes were made (`cbc4cec1`, the Ofertas passes); they are point-in-time and unguarded. Any of them can silently regress on the next commit. There are 272 `verify:*` npm scripts and **not one thing that runs them**.

> **PROVEN REFERENCE EXISTS: NO** | **REFERENCE CATEGORY:** — | **REFERENCE PATH:** none — no CI config, no a11y plugin, no axe/pa11y dependency exists anywhere in the repo | **TARGET PATH:** repo root (`.github/workflows/`), `eslint.config.mjs`, `package.json` `"lint"` | **DIFFERENCE:** the entire enforcement layer is absent; the nearest analogue is the *scoped* `lint`/`lint:br`/`lint:servicios` pattern, which proves the team's convention is per-category opt-in lint rather than repo-wide | **ACTION: NET NEW.**

---

# G52 — PWA

## 3.5 `app/manifest.ts` — actual contents (read in full, per the batch instruction)

```
name:             "Leonix Business Concierge"
short_name:       "Leonix Concierge"
id:               "/admin/businesses"
start_url:        "/admin/businesses"
scope:            "/admin/"
display:          "standalone"
background_color: "#FAF6EE"
theme_color:      "#7A1E2C"
icons:            /pwa/icon-192.png (192, any), /pwa/icon-512.png (512, any),
                  /pwa/icon-512-maskable.png (512, maskable)
categories:       ["business", "productivity"]
lang: "es"  ·  dir: "ltr"
```

Structurally this is a **complete, valid, installable manifest** — correct `id`, `scope`, `display`, and all three required icon variants including a maskable one. All four icon files exist (`public/pwa/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`, `apple-touch-icon.png`).

**But it is an ADMIN-ONLY manifest.** `scope: "/admin/"` and `start_url: "/admin/businesses"` mean the installed app covers **only the staff console** — the entire public classifieds platform is out of scope. And `/admin` is in the robots disallow list (`leonixDiscoveryContracts.ts:10`), so the installable app is the one part of the site search engines are told to ignore. That is a coherent design choice, but it means **there is no PWA for the public product**.

## 3.6 ⚠ P0 — TWO CONFLICTING MANIFESTS AT THE SAME URL

`app/manifest.ts` generates the route **`/manifest.webmanifest`**. `public/manifest.webmanifest` is a **static file served at the same path**. Both are present on `origin/main`. They disagree on every meaningful field:

| Field | `app/manifest.ts` (route) | `public/manifest.webmanifest` (static) |
|---|---|---|
| `name` | Leonix Business Concierge | Leonix Media |
| `start_url` | `/admin/businesses` | `/` |
| `scope` | `/admin/` | `/` |
| `theme_color` | `#7A1E2C` | `#1F241C` |
| `background_color` | `#FAF6EE` | `#1F241C` |
| icons | 3 purpose-separated PWA icons | `logo-clean.png` + `logo.png`, both declared `512x512`, one `"any maskable"` |

`app/layout.tsx:24-25` points at `manifest: "/manifest.webmanifest"` and sets `themeColor: "#1F241C"` — matching the **static** file, contradicting `app/manifest.ts`. History shows both are live and neither is a leftover-in-progress: `public/manifest.webmanifest` last touched `868397e3` (2026-08-19, LEO-14.8), `app/manifest.ts` last touched `2506f616` (2026-08-25). The newer commit edited the file that may well be the one being shadowed.

**EVIDENCE GAP:** which one Next 15.5.7 actually serves at `/manifest.webmanifest` cannot be settled from source alone — it requires fetching the URL from a running deployment. Either resolution is a defect: if the static file wins, `2506f616`'s entire installability work is dead and the app installs as a root-scoped "Leonix Media" with two same-sized icons; if the route wins, the layout's `themeColor` and the public-facing branding are wrong.

## 3.7 `2506f616` — what it actually did

Verified ancestor of `origin/main`. 16 files, +325/−93:

- Added the four real PWA icon binaries (`public/pwa/*.png`) — these did not exist before.
- Rewrote `app/manifest.ts` (+17/−?) into the shape in §3.5.
- Reworked `BusinessConciergeInstallBanner.tsx` (76 lines) and `app/lib/pwa/useInstallPrompt.ts` (58 lines).
- Touched `app/admin/layout.tsx`, `AdminShell.tsx`, `adminStrings.ts`, `FieldAgentComponents.tsx`.
- Adjusted `public/sw.js` (16 lines).
- Added `FINAL_PWA_INSTALLABILITY_AUDIT.md` (140 lines) and extended 3 verifier scripts.

It is **genuine installability work, not a doc-only commit** — it shipped the missing icons and a correct install-prompt hook. Its blind spot is that it never reconciled `public/manifest.webmanifest` (§3.6).

## 3.8 Service worker

**PRESENT:** `public/sw.js`, registered from the root layout — `app/layout.tsx:6,71` -> `app/components/ServiceWorkerRegistration.tsx:16-22`, `navigator.serviceWorker.register("/sw.js", { scope: "/" })`, gated on `process.env.NODE_ENV === "production"`. A second registrar, `app/components/digitalContact/LeonixServiceWorkerRegister.tsx:15,25`, registers the **same** `/sw.js` at the **same** scope for the doorbell/LEO push surfaces — idempotent, but it means SW registration has two owners.

Note the scope mismatch: the SW is registered at **`/`** while the manifest scopes the app to **`/admin/`**.

**What it actually does** (`public/sw.js`):

- `install`: `cache.addAll(["/offline"])` then `skipWaiting()`. **Only one URL is precached.**
- `activate`: deletes all non-current caches, `clients.claim()`.
- `fetch` (single handler, deliberately — the header notes a second `respondWith` listener would throw):
  - **network-only, `cache: "no-store"`** for `/api/leo/`, `/api/auth`, `*/oauth*`, `*gmail*`, `*google*`, `/admin/api` — correct.
  - **never touched**: `/api/`, `/auth/`, `supabase.co` — correct.
  - **cache-first** for `/_next/static/`, `/_next/chunks/`, `/pwa/`, and `css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2`.
  - everything else: network, with `caches.match("/offline")` for `request.mode === "navigate"`, else a `503 "Offline"`.
- `push` + `notificationclick`: Web Push for the doorbell and LEO alerts, with a real internal-path allowlist (`resolveSafeInternalPath`) that refuses `//`, `://`, and any non-same-origin target. **This is the strongest security code in the PWA layer.**

The file's own header states the design: *"Truthful offline behavior: show offline page, not fake data / No offline mutation queues / No background sync."*

**No build-time SW tooling.** `package.json` contains no `next-pwa`, `workbox`, or `serwist`. `public/sw.js` is hand-written and hand-maintained.

## 3.9 Offline route & install prompt

- `app/offline/page.tsx` — a bilingual static page that says, truthfully, *"You cannot access Business Concierge tools without an internet connection."* Plus `app/offline/RetryButton.tsx`.
- `app/lib/pwa/useInstallPrompt.ts` — a correct `beforeinstallprompt` capture + `appinstalled` listener, with `useIsStandaloneDisplay()` (matchMedia + iOS `navigator.standalone`) and `useIsIosSafari()` (handles the iPadOS desktop-UA case) so iOS users can be shown manual instructions. Good quality.

Note `/offline` sits **outside** the manifest's `/admin/` scope, so a navigation that falls back to it exits the installed app's scope.

## 3.10 PWA VERDICT

**Installable: YES — for staff, on `/admin/`, and only if the manifest conflict in §3.6 resolves in favour of the route.** All the hard prerequisites are met: HTTPS-served manifest, `display: standalone`, `id`, `scope`, `start_url`, 192px + 512px + maskable icons that exist on disk, a registered service worker with a `fetch` handler, an install-prompt hook, and an iOS fallback path.

**Works offline in a meaningful way: NO — and deliberately so.** Precache is a single URL (`/offline`). Static assets are cached only opportunistically *after* first fetch, so a cold install has no shell. Every navigation is network-first; every failure yields the "you are offline" page. There are no offline mutation queues and no background sync, by explicit design. The honest description is **"an installable, push-capable web app with a truthful offline error page"** — not an offline-capable application.

**Two real defects:** the duplicate/conflicting manifest (§3.6, P0) and the fact that the public product has no PWA at all (the manifest is admin-scoped).

> **PROVEN REFERENCE EXISTS: YES** (for the manifest conflict) | **REFERENCE CATEGORY:** Business Concierge / admin | **REFERENCE PATH:** `app/manifest.ts` (the typed Next metadata route, kept current by `2506f616`) | **TARGET PATH:** `public/manifest.webmanifest` | **DIFFERENCE:** two files claim `/manifest.webmanifest` with contradictory `name`/`scope`/`start_url`/colors/icons; the static one is 6 days older and has two identically-sized icons | **ACTION: FIX REGRESSION** — delete `public/manifest.webmanifest`, fold whatever public-facing identity is genuinely wanted into `app/manifest.ts` (or a second, distinctly-named manifest), and reconcile `app/layout.tsx:25` `themeColor`.

> **PROVEN REFERENCE EXISTS: NO** (for public-product offline capability) | **REFERENCE PATH:** none — `public/sw.js` precaches exactly one URL and the codebase has no build-time SW tooling | **TARGET PATH:** `public/sw.js`, `app/manifest.ts` | **DIFFERENCE:** no app-shell precache manifest, no revisioned asset list, no public-scope manifest | **ACTION: NET NEW** (and only if genuinely wanted — the current behaviour is *honest*, which is better than a fake-data offline mode).

---

# G53 — SECURITY / RLS / PRIVACY

## 4. (a) RLS COVERAGE

### 4.1 Corpus

163 migration files. Zero `DISABLE ROW LEVEL SECURITY`, zero `FORCE ROW LEVEL SECURITY`, zero `ALTER POLICY`. **`ENABLE ROW LEVEL SECURITY` is written in two casings — 73 uppercase, 59 lowercase — and every lane listing table (`servicios_/restaurantes_/comida_local_/empleos_public_listings`, `autos_classifieds_listings`, `viajes_staged_listings`, `ofertas_locales`, `oferta_local_items`, and `public.listings` itself) uses the lowercase form.** Any case-sensitive audit of this repo silently misses all of them. Every figure below is case-insensitive.

Computed set difference over the whole corpus (independently reproduced twice):

| Measure | Count |
|---|---|
| Distinct tables `CREATE TABLE`d in migrations | **185** |
| Distinct tables with `ENABLE ROW LEVEL SECURITY` | **183** |
| `CREATE POLICY` statements | **85** |
| **Distinct tables carrying ≥1 policy** | **49** |
| **Tables created WITHOUT any RLS enable** | **3** — `autos_classifieds_analytics_events`, `leonix_ad_id_counters`, `listing_lifecycle_reminder_events` |
| **Tables with RLS enabled that are NEVER created by any migration** | **1** — `public.listings` (see §4.3) |
| `REVOKE` lines | 267 |

**Headline: 183 of 186 distinct tables have RLS enabled (98.4%) — but only 49 of those 183 carry a single policy. 134 are RLS-on / no-policy, i.e. reachable *only* by `service_role`.** RLS *enablement* is near-universal; the real posture is "deny everyone, let the service role through." That posture is safe on its own — and it is precisely what makes §4.5 catastrophic.

### 4.1b The GRANT inventory corroborates §4.5's root cause exactly

All table-level `GRANT`s in the entire migration corpus:

- **To `authenticated`: 3 statements, 3 tables** — `user_liked_listings`, `user_saved_listings` (`supabase/migrations/20260508160000_engagement_liked_saved_grants.sql:5,6`), `saved_listings` (`20260513160000_saved_listings_canonical.sql:21`). Each is paired with a `FOR ALL USING/WITH CHECK (auth.uid() = user_id)` policy. The file header explains the grant exists because PostgREST returns *permission denied* without it **even when RLS allows the row** — the exact mechanism that breaks `service_role` in §4.5.
- **To `anon`: 4 table `SELECT`s + 3 column-restricted `SELECT`s, all Iglesias** — `churches`, `church_services`, `church_ministries`, `church_media` (`20260819120000_iglesias_churches.sql:85,157,217,259`); column-level grants withholding sensitive columns on prayer requests/updates and `church_prayer_teams` (`20260819185941_iglesias_prayer.sql:111,187`, `20260819203513_iglesias_prayer_network.sql:69`). Iglesias is the only subsystem that has actually wired anon+RLS end to end.
- **To `service_role`: ~75 statements — and every single one belongs to a Business Concierge / Recursos-era migration** (`admin_roster_foundation`, `living_business_book`, `business_health_map`, `business_learning_center` + `20260807130000_..._privilege_hardening.sql`, `business_diy_concierge`, `business_stewardship_engine`, `field_discovery_canvassing`, `business_ai_research_engine`, `business_meeting_studio`, `business_proposal_promise_keeper`, `business_creative_studio`, `business_program7`, `business_ownership_claim`, `recursos_intake_os`). Verbs are correctly narrowed per table, and several headers state the rule: *"never `GRANT ALL PRIVILEGES`, never a grant to anon/authenticated/PUBLIC."*

**No pre-Business-Concierge migration grants `service_role` anything.** That is `14a78d46`'s root cause, visible in the file tree without ever reading the commit.

### 4.2 The required-table matrix

All 23 tables: **RLS ENABLED = YES, 23/23.** The differentiator is policy coverage and predicate quality.

| TABLE | RLS enabled (migration:line) | Policies by command — predicate |
|---|---|---|
| **`listings`** | `20260421130001_listings_enable_rls_full_policies.sql:4` | **SELECT ×2** — `listings_anon_select_public_catalog` (`TO anon`): 4 category branches; `listings_authenticated_select`: `owner_id = auth.uid()` OR party to a `public.messages` row OR the same 4 branches. **INSERT** `owner_id = auth.uid()`. **UPDATE** / **DELETE** same. **No parent predicate anywhere — §4.4.** Table itself never created — §4.3 |
| **`servicios_public_listings`** | `20260402160000:18` | **SELECT ×1** — `servicios_public_listings_select_public`, **no `TO` role (⇒ PUBLIC/anon)**, **`USING (true)`**. ⚠ **NO STATUS GATE — §4.4b.** No write policies. |
| `restaurantes_public_listings` | `20260408120000:46` | **SELECT ×2** — `_select_public` (PUBLIC) `USING (status = 'published')`; `_select_owner` (`authenticated`) `owner_user_id = auth.uid()`. No writes. |
| `comida_local_public_listings` | `20260604120000:90` | **SELECT ×2** — `_select_public` (PUBLIC) `USING (status = 'published')`; `_select_owner` (`authenticated`). No writes. **The only table whose public read path actually exercises these (§5.2).** |
| `autos_classifieds_listings` | `20260409120000:29` | **SELECT ×2** — `_select_active` (PUBLIC) `USING (status = 'active')`; `_select_own` (`authenticated`). No writes. |
| `empleos_public_listings` | `20260410210000:59` | **SELECT ×2** — `_select_published` (PUBLIC) `USING (lifecycle_status = 'published')`; `_select_owner` (PUBLIC role, predicate `auth.uid() is not null and owner_user_id = auth.uid()` — safe for anon, style inconsistency only). No writes. |
| `ofertas_locales` | `20260605120000:80`, re-asserted `20260616130000:72` | **SELECT** owner-only; **INSERT** `owner_id = auth.uid()`; **UPDATE** owner + `status IN ('draft','submitted','pending_review')`. No DELETE. **No public SELECT at all** — public discovery is service-role-only by design. |
| `oferta_local_items` | `20260606120000:179`, re-asserted `20260616130000:174` | **SELECT** owner; **INSERT** owner; **UPDATE** owner + `review_status IN ('pending','needs_review','rejected')` (WITH CHECK also allows `'approved'`). No DELETE. |
| `viajes_staged_listings` | `20260410180000:56` | **SELECT ×2** — `_select_public_approved` (PUBLIC) `USING (lifecycle_status='approved' AND is_public=true)`; `_select_owner`. No writes. |
| **`listing_analytics`** | `20250311000000:15`, re-asserted `20260507180000:86` | **INSERT** `Allow insert listing_analytics` **`WITH CHECK (true)` — open to anon by design** (§6.2b). **SELECT** originally `USING (true)`; **dropped** at `20260812090000:31` and replaced by owner-only `auth.uid() IS NOT NULL AND owner_user_id = auth.uid()::text`. No UPDATE/DELETE. |
| `saved_searches` | `20250313000002:13`, re-asserted `20260817120000:262` | **ALL** — `auth.uid() = user_id` (USING + WITH CHECK). |
| **`saved_search_match_events`** | `20260818120000:66` | **ZERO** — explicit comment *"access via service role only."* |
| **`listing_package_entitlements`** | `20260521120000:65` | **ZERO** — explicit service-role-only comment. |
| **`leonix_payment_records`** | `20260526120000:123` | **ZERO** |
| **`leonix_promo_codes`** | `20260522120000:90` | **ZERO** — explicit service-role-only comment. |
| **`leonix_subscription_records`** | `20260805090100:75` | **ZERO** — explicit service-role-only comment. |
| **`leonix_stripe_webhook_events`** | `20260805090000:44` | **ZERO** — explicit service-role-only comment. |
| **`admin_audit_log`** | `20260410120000:17` | **ZERO** |
| `listing_reports` | `20250312000001:15` | **INSERT only** — `Anyone can insert report` `WITH CHECK (true)` (anon may write). No SELECT/UPDATE/DELETE ⇒ write-only to clients. |
| `saved_listings` | `20260513160000:15` | **ALL** — `auth.uid() = user_id`; + `GRANT SELECT,INSERT,UPDATE,DELETE TO authenticated`. |
| `user_liked_listings` | `20260506200000:12` | **ALL** — `auth.uid() = user_id`; grant at `20260508160000:5`. |
| **`leonix_newsletter_subscribers`** | `20260527200000:59` | **ZERO** |
| **`leonix_media_kit_leads`** | `20260527200000:60` | **ZERO** |

**23/23 have RLS enabled. 13/23 carry ≥1 policy; 10/23 have ZERO policies.** Zero-policy is a *correct and safe* posture — anon and authenticated are denied everything, only `service_role` (which bypasses RLS) reaches the data — and all 10 are genuinely sensitive (payments, webhooks, subscriptions, audit log, subscriber PII). It is also exactly what makes §4.5 catastrophic: with RLS denying everyone and no `GRANT` admitting `service_role`, **nothing can read them at all.**

### 4.2b Repo-wide: 134 tables are RLS-on / zero-policy

Most carry an explicit `-- No anon/authenticated policies: access via service role only.` comment plus `REVOKE ALL FROM PUBLIC` + a narrow `GRANT … TO service_role`, i.e. deliberate. A subset has **no such comment and sits behind a user-facing surface**, so a browser-side query silently returns `[]` rather than erroring — worth a design review: `support_tickets`, `site_section_content`, `site_page_blocks`, `magazine_issues`, `tienda_catalog_items` / `tienda_catalog_images` / `tienda_catalog_pricing_rules` / `tienda_orders` / `tienda_order_assets`, `translation_records`, `servicios_public_leads`, `servicios_listing_reviews`, `servicios_analytics_events`, `church_submissions`, `prayer_acknowledgements`, `prayer_reports`, `leonix_endorsement_votes`.

### 4.2c The 3 RLS-off tables — needs live verification

| Table | Created | Exposure |
|---|---|---|
| `autos_classifieds_analytics_events` | `20260408140000_autos_classifieds_analytics_events.sql:3` | RLS never enabled, **and no `REVOKE`/`GRANT` in any migration**. Table comment says *"inserted by Next.js API with service role."* If Supabase's stock `anon`/`authenticated` grants on `public` apply, it is readable **and writable** through PostgREST with the publishable anon key. Highest-priority of the three. |
| `leonix_ad_id_counters` | `20260506150000_leonix_ad_id_all_classifieds.sql:7` | RLS never enabled. The migration `REVOKE`s/`GRANT`s on the *functions* (`leonix_allocate_formatted`, `bump_leonix_ad_counter` → `service_role`) but never touches the table. Anon write here would desynchronise ad-ID allocation platform-wide. |
| `listing_lifecycle_reminder_events` | `20260714231500_rentas_lifecycle_reminders_and_expiration_index.sql:11` | RLS never enabled, no REVOKE/GRANT. Holds `dedupe_key`, `channel`, `delivery_status`, listing/owner linkage. |

Stated honestly: migrations contain **no** grant/revoke for these three, so actual exposure depends on the project's default privileges, which are not in this repository. **Flagged as needs-live-verification, not asserted as a confirmed breach.**

### 4.3 `public.listings` — the schema verdict

**GAP-073 CONFIRMED, unambiguously. No migration in the repository creates `public.listings`.**

```
git grep -inE "create table (if not exists )?(public\.)?listings\b" origin/main -- supabase/
  ->  (no output)
```

There is also no declarative schema and no dump: `git ls-tree -r --name-only origin/main -- supabase/` outside `migrations/` yields exactly one file, `supabase/.temp/cli-latest` — no `supabase/schema.sql`, no `supabase/schemas/`, no `seed.sql`, **not even a `config.toml`**.

**One place in the whole repo does define it — and it proves the point rather than refuting it.** `scripts/c9-certification-schema-setup.sql:65` contains `create table if not exists public.listings (…)`. It is a **test-fixture bootstrap script, not a migration**, and its own header states it was *"built verbatim from the supplied Production schema snapshot."* A hand-transcribed copy of a production snapshot, living in `scripts/`, outside the migration chain and outside any drift detection, is evidence that `public.listings` is an out-of-band production-only object — not a refutation of the gap.

Yet **33 migrations** `ALTER`, index, FK, trigger, policy, or otherwise depend on it — spanning `20250311000001_listings_price_drop.sql` all the way to `20260819150000_saved_search_match_events_br_rentas.sql`, and including `20260421130001_listings_enable_rls_full_policies.sql`, `20260423180000_listing_audit_events.sql` (FK + triggers), `20260518112000_gate12d_listing_structured_payload.sql` and `20260804120000_listings_publish_attempt_idempotency_key.sql`.

**The drift is already known and tolerated rather than fixed:** two migrations guard their own statements on `pg_class` / `pg_policies` existence checks precisely so they survive the missing table — `20260421120000_rentas_listings_zip_and_public_read.sql:16` and `20260616130000`.

The set-difference in §4.1 is the cleanest possible proof: across 185 created tables and 183 RLS-enabled tables, `public.listings` is the **only** table that appears in the RLS set and not in the created set.

**Consequence:** the platform's most-used table has **no tracked schema definition anywhere in version control**. A clean `supabase db reset` against an empty project fails at the first `ALTER TABLE public.listings`. Its column set, types, defaults, and constraints exist only in the live Staging database. There is no reproducible path from this repository to a working database.

### 4.4 GAP-058 — CONFIRMED verbatim

`supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql`:

- **`:13-38`** `listings_anon_select_public_catalog` — `for select to anon using (…)`: four category branches on `category`, `status`, and `is_published`. **No parent/child predicate of any kind.**
- **`:40-71`** `listings_authenticated_select` — adds `owner_id = auth.uid()` and a `public.messages` participation branch, then repeats the same four category branches. **Again no parent predicate.**
- **`:73-77`** `listings_authenticated_insert_own` — `with check (owner_id = auth.uid())` **only**. Nothing constrains which parent a child row may attach to.
- `:79-84` UPDATE and `:86-90` DELETE — both `owner_id = auth.uid()`.

**The BR child–parent visibility gate is enforced in the application layer alone.** Autos is in the same position with wider app-layer enforcement (Batch 4).

**Two further predicate defects in the same policy, not previously recorded:**

1. **Case-sensitivity hole in the anon fallback branch.** Lines `:19,24,29,53,58,63` compare `lower(coalesce(category,''))`, but the catch-all fallback at `:36` / `:70` compares the **raw** value: `coalesce(category, '') not in ('rentas', 'en-venta', 'bienes-raices')`. A row whose `category` is stored as `'Rentas'`, `'En-Venta'` or `'Bienes-Raices'` therefore fails every lowercase-specific branch **and** passes the `not in` fallback — so it is visible to `anon` on the weaker condition `status='active' AND is_published IS DISTINCT FROM false`, bypassing the stricter per-category gate that was written for it. Bienes-raices is the worst case: its dedicated branch demands `is_published = true`, while the fallback accepts `NULL`.
2. **`is_published IS DISTINCT FROM false` treats NULL as published.** Applied at `:21,25,35,55,59,69` for rentas, en-venta and the fallback. Only the `bienes-raices` branch (`:30,64`) requires `is_published = true`. Any row inserted without an explicit `is_published` is publicly visible.

### 4.4b ⚠ P0 (NEW) — `servicios_public_listings` public SELECT is `USING (true)`

`supabase/migrations/20260402160000` creates exactly one policy on the table:

```sql
create policy servicios_public_listings_select_public
  on public.servicios_public_listings
  for select
  using (true);
```

**No `TO` clause** (so it applies to PUBLIC, including `anon`) and **no status predicate whatsoever**. Every sibling lane table gates its public SELECT: restaurantes `status='published'`, comida-local `status='published'`, autos `status='active'`, empleos `lifecycle_status='published'`, viajes `approved AND is_public`. Servicios alone does not.

Later migrations add exactly the states that make this dangerous — `20260407140000_servicios_listing_status.sql` (`draft` / `pending_review` / `rejected` / `suspended`) and `20260713153000_servicios_pending_payment_status_and_published_at.sql` (`pending_payment`) — and **no migration ever narrows the policy**. So draft, rejected, suspended and unpaid Servicios listings appear to be **anon-readable via PostgREST with the publishable key**, independently of the application.

This compounds §5.4's finding rather than duplicating it: §5.4 is *the app never lets RLS run*; this is *RLS would not have stopped anything anyway*. And it is doubly obscured by §4.5 — while the `service_role` grant is missing, the anon path may be the only one that works at all.

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Restaurantes / Comida Local / Autos / Empleos / Viajes — five independent instances | **REFERENCE PATH:** `supabase/migrations/20260408120000:46` (`USING (status = 'published')`), `20260604120000:90`, `20260409120000:29`, `20260410210000:59`, `20260410180000:56` | **TARGET PATH:** `supabase/migrations/20260402160000:18` — `servicios_public_listings_select_public` | **DIFFERENCE:** every peer lane gates its public SELECT on a published/active status and names the role; servicios uses a bare `USING (true)` with no role clause | **ACTION: FIX REGRESSION** — new additive migration dropping and re-creating the policy as `to anon, authenticated using (listing_status = 'published')`, matching the sibling pattern exactly.

### 4.5 (d) ⚠⚠ P0 — Sept-only `14a78d46` is NOT on `origin/main`

```
git merge-base --is-ancestor 14a78d46 origin/main  ->  NOT-IN-MAIN
git merge-base --is-ancestor 14a78d46 e3956df8     ->  YES-IN-SEPT
```

`14a78d46` *"fix(globalization): grant service_role DML on all pre-Concierge Staging tables"* (2026-09-08) adds one 90-line file, `supabase/migrations/20260909120000_service_role_dml_grants_global_fix.sql`, which **exists only on the Sept fork**. `origin/main`'s migration tree has no grant migration of any kind (`git ls-tree … | grep -i "grant\|service_role"` returns only two unrelated 2026-05/08 files).

**What the commit establishes** (root-caused against live Vercel runtime error logs, per its message, and verified post-migration by `SET LOCAL ROLE service_role`):

- `service_role` — *"the one every server route authenticates as via `getAdminSupabase()`"* — was **never granted SELECT/INSERT/UPDATE/DELETE on any table created before the Business Concierge merge**. **45 tables affected.**
- Root cause is `pg_default_acl`: two competing default-ACL entries for schema `public`. The `supabase_admin` default grants full DML to all roles; a narrower default for role `postgres` — the confirmed owner of all 122 public tables — grants `service_role` only `TRUNCATE/REFERENCES/TRIGGER`. Business Concierge migrations shipped their own explicit `GRANT`s and escaped; every older table inherited the restrictive default.
- The migration file's own header (`:22-25`): *"a single missing-grant defect that silently breaks BOTH the write path (publish/checkout persistence) AND the read path (public listing detail/results pages also read via the admin client)."*

**Implication for `origin/main`.** Combine this with §4.2 and §4.1b: 10 of the 23 required tables (and 134 repo-wide) are RLS-on with zero policies, so `anon` cannot read them; and without the grant, `service_role` cannot read or write them either — **because RLS bypass does not bypass table-level GRANTs.** §4.1b shows this from the file tree alone: ~75 `GRANT … TO service_role` statements exist and **every one belongs to a Business Concierge-era migration**; not a single pre-Concierge table has one. The `20260508160000_engagement_liked_saved_grants.sql` header states the mechanism explicitly — PostgREST returns *permission denied* without a table grant **even when RLS allows the row**. On `origin/main`'s migration set, the following are unreachable by every client the application has:

- `public.listings`, `listing_analytics`, `listing_lifecycle_audit`
- `servicios_public_listings` (+ leads/reviews/analytics), `restaurantes_public_listings`, `comida_local_public_listings`, `autos_classifieds_listings`
- all 12 `ofertas_locales` / `oferta_local_*` / `ofertas_local_*` tables
- **the entire Revenue OS payment pipeline** — `leonix_payment_records`, `leonix_stripe_webhook_events`, `leonix_subscription_records`, `leonix_placement_entitlements`, `leonix_promo_codes`, `leonix_promo_code_redemptions`, `leonix_verified_intro_discount_redemptions`, `leonix_billing_consents`
- `leonix_newsletter_subscribers`, `leonix_media_kit_leads`, `leonix_ad_id_counters`, `leonix_professional_identities`, `leonix_endorsement_votes`

Every one throws Postgres **42501 permission denied**. **This is the single highest-severity finding in this batch.** Servicios publish returning 503 `persist_failed` is the observed symptom; the same defect silently breaks Stripe webhook persistence and every public listing read that goes through `getAdminSupabase()` (§5.1).

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Business Concierge migrations (and the Sept fork) | **REFERENCE PATH:** `supabase/migrations/20260909120000_service_role_dml_grants_global_fix.sql` **on `e3956df8` only** — a complete, additive, GRANT-only, idempotent, re-runnable fix with an explicit enumerated table list plus `ALTER DEFAULT PRIVILEGES FOR ROLE postgres` to prevent recurrence; the Business Concierge migrations already on `origin/main` demonstrate the same explicit-GRANT convention | **TARGET PATH:** `supabase/migrations/` on `origin/main` — the file is absent | **DIFFERENCE:** `origin/main` has no grant migration at all; 45 pre-Concierge tables inherit the restrictive `postgres` default ACL | **ACTION: ADOPT EXISTING** — cherry-pick `14a78d46` onto `origin/main`. Nothing needs to be written; the fix exists, is scoped to `service_role` only (anon/authenticated and RLS untouched, no ownership change), and was verified live.

## 5. (b) SERVICE-ROLE USAGE ON PUBLIC PATHS

### 5.1 The scale

`getAdminSupabase()` — the **service role**, which **bypasses RLS entirely** — is imported by **288 files** under `app/`. `getServerSupabaseAnon()` — the RLS-respecting client — is imported by **5** (`app/lib/supabase/server.ts` and its doc, `comidaLocalPublicQueries.ts`, `iglesias/churchQueries.ts`, `iglesias/prayerQueries.ts`, `magazine/getApprovedMagazineVisualAsset.ts`, `supabase/adminSession.ts`).

### 5.2 Public-facing read paths, by client

| Public read module | `getAdminSupabase()` | `getServerSupabaseAnon()` | RLS active for anonymous visitors? |
|---|---|---|---|
| `app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts` | **7** (`:107,136,156,182,206,342`) | 0 | **BYPASSED** |
| `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingsServer.ts` | **7** (`:101,127,145,162,192,286`) | 0 | **BYPASSED** |
| `app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts` | **15** | 0 | **BYPASSED** |
| `app/lib/clasificados/autos/autosClassifiedsListingService.ts` | **14** | 0 | **BYPASSED** |
| `app/(site)/clasificados/viajes/lib/viajesStagedListingsDbServer.ts` | **10** | 0 | **BYPASSED** |
| `app/lib/recursos/server/communityResourcesDb.ts` | **8** | 0 | **BYPASSED** (and this feeds `app/sitemap.ts`) |
| `app/lib/tienda/tiendaCatalogQueries.ts` | 3 | 0 | **BYPASSED** |
| `app/lib/siteBlocks/sitePageBlocksData.ts` | 3 | 0 | **BYPASSED** |
| `app/lib/iglesias/prayerQueries.ts` | 1 | 1 | mixed |
| `app/lib/iglesias/churchQueries.ts` | 0 | **2** | **RESPECTED** |
| **`app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts`** | fallback only | **primary** (`:106`) | **RESPECTED** |

### 5.3 The reference implementation, verbatim

`app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts:100-112`:

```ts
type ComidaLocalPublicReadChannel = "anon_rls" | "admin";

function resolveComidaLocalPublicReadClient() {
  if (isSupabasePublicReadConfigured()) {
    return { ok: true, supabase: getServerSupabaseAnon(), channel: "anon_rls" };
  }
  if (isSupabaseAdminConfigured()) {
    return { ok: true, supabase: getAdminSupabase(), channel: "admin" };
  }
  return { ok: false, error: "supabase_unconfigured" };
}
```

Anon-first, service-role only as an explicit, *labelled* degradation. The channel is even carried through the return type so callers can see which one served the data. `app/lib/supabase/server.ts:12-14` documents the intent: *"Server-only anon client for RLS-gated public reads (e.g. published Comida Local rows). Never use for owner/admin writes."*

### 5.4 Is RLS actually bypassed for anonymous visitors? — YES, and here is the concrete cost

**Yes.** On every module marked BYPASSED above, an anonymous visitor's page render is executed by `service_role`, so the row-visibility policies in §4.2 are not evaluated at all. Row visibility is decided **only** by whatever `.eq()`/`.filter()` the TypeScript happens to apply. Two concrete demonstrations:

1. **`serviciosPublicListingsServer.ts:175-201`** — `getServiciosPublicListingBySlugFromDb` queries by slug with **no status filter in SQL at all** (`.eq("slug", slug).maybeSingle()`), fetches the row unconditionally under service role, and *then* decides visibility in JavaScript (`:190-196`): `if (visibility === "published_only") { if (listingStatus !== …PUBLISHED) return null; }`. Every draft, `pending_review`, `rejected` and `suspended` row leaves the database on a public request; one wrong `visibility` argument or an early `return row` publishes it. `SLUG_PAGE_STATUSES` at `:98` explicitly enumerates `published, paused_unpublished, pending_review, rejected, suspended` as reachable through this same function.
2. **`serviciosPublicListingsServer.ts:100-152`** — a **public** servicios page render reads `user_liked_listings` and `saved_listings` — per-user engagement tables — with the **service role**. It selects only `listing_id` for counting, so no user identity reaches the page today; but two personal-data tables whose entire RLS model is "you see your own rows" are being queried, unfiltered by user, from an anonymous request path.

Restaurantes is better: `restaurantesPublicListingsServer.ts:105,131,149,167` do apply `.eq("status", "published")` in SQL. The protection is still app-layer, but at least it is in the query.

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Comida Local (with Iglesias as a second, independent instance) | **REFERENCE PATH:** `app/lib/clasificados/comida-local/comidaLocalPublicQueries.ts:100-112` + `app/lib/supabase/server.ts:15-31` (`getServerSupabaseAnon`); second instance `app/lib/iglesias/churchQueries.ts` | **TARGET PATH:** `serviciosPublicListingsServer.ts:107,136,156,182,206,342`; `restaurantesPublicListingsServer.ts:101,127,145,162`; `empleosPublicListingsDbServer.ts`; `autosClassifiedsListingService.ts`; `viajesStagedListingsDbServer.ts`; `communityResourcesDb.ts`; `tiendaCatalogQueries.ts`; `siteBlocks/sitePageBlocksData.ts` | **DIFFERENCE:** comida-local resolves an anon/RLS client first and falls back to service role only when the public key is unconfigured, labelling the channel; the targets call `getAdminSupabase()` unconditionally, so RLS never runs for anonymous visitors and row visibility rests entirely on hand-written TypeScript filters — one of which (servicios slug read) applies no SQL filter at all | **ACTION: ADOPT EXISTING** — port `resolveComidaLocalPublicReadClient` into a shared helper and switch the public **read** paths to it. Note the ordering dependency: this cannot land before §4.5, because the RLS policies these tables carry have never actually been exercised by a real anon client in production.

## 5.5 ⚠ P0 — the lead-export surface is protected by an unsigned, client-settable cookie

All four lead-export routes and three lead-mutation routes share one gate:

`app/api/admin/leads/newsletter/export/route.ts:9` · `…/newsletter/emails-export/route.ts:9` · `…/leads/inbox/export/route.ts` · `…/leads/media-kit/export/route.ts` · `…/newsletter/[id]/route.ts:14` · `…/inbox/[id]/route.ts` · `…/media-kit/[id]/route.ts` — every one begins:

```ts
const denied = await assertAdminLeadExportAccess();
if (denied) return denied;
```

And that function, **in its entirety** (`app/admin/_lib/adminLeadExportAuth.ts:8-14`):

```ts
export async function assertAdminLeadExportAccess(): Promise<Response | null> {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) return new Response("Unauthorized", { status: 401 });
  return null;
}
```

`requireAdminCookie` (`app/lib/supabase/server.ts:70-72`) is:

```ts
export function requireAdminCookie(cookies: CookieStore): boolean {
  return cookies.get("leonix_admin")?.value === "1";
}
```

**The codebase says out loud that this is not a security boundary.** `app/lib/supabase/server.ts:56-69` — *"Intentionally a coarse 'an admin session exists' marker, **not a security boundary by itself**, and **NOT signed** … Real identity is always re-verified independently downstream of this check."*

**On these seven routes there is no downstream re-verification.** The claim in that comment is false for this surface. And `middleware.ts:80-82` does not help: it gates `pathname.startsWith("/admin")`, which **does not match `/api/admin/...`**.

Net effect: `curl -H 'Cookie: leonix_admin=1' https://<host>/api/admin/leads/newsletter/export` returns the **entire subscriber database as CSV** — `id, created_at, updated_at, consent_timestamp, email, name, city, zip_code, preferred_language, interests, source, lang, status` (`app/admin/_lib/leonixLeadsCsv.ts`, `newsletterSubscribersToCsv`), for every row with `deleted_at IS NULL`, unsubscribed rows included. The same cookie also reaches `/api/admin/leads/inbox/export`, `/api/admin/leads/media-kit/export`, and the PATCH routes that archive/delete subscribers. This is **09A's coarse cookie gate, confirmed unchanged and quantified**.

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Business Concierge admin API | **REFERENCE PATH:** `requireSalesWorkspaceAccess()` — `app/admin/_lib/businessWorkspaceAccess.ts:106`, used by **dozens** of `app/api/admin/businesses/**/route.ts` handlers; it re-checks the operator-email / auth-user-id cookies against live Supabase Auth **and** the staff roster on every request. Second reference: `isAdminBootstrapSession()` — `app/lib/supabase/adminSession.ts:104` (signed, expiring token) | **TARGET PATH:** `app/admin/_lib/adminLeadExportAuth.ts:8-14`, and through it all 7 routes listed above | **DIFFERENCE:** the Business Concierge routes verify a real identity server-side per request; the lead routes check one unsigned boolean cookie the client controls and perform no downstream re-verification | **ACTION: ADOPT EXISTING** — replace the body of `assertAdminLeadExportAccess` with `requireSalesWorkspaceAccess()` (or `requireSalesWorkspaceAccess() || isAdminBootstrapSession()`). One function, one file, seven routes fixed.

### 5.5b New finding — 4 URL-encoded literal shadow API routes

`git ls-tree -r --name-only origin/main -- app/ | grep "%5B"` returns exactly four files:

```
app/api/admin/businesses/%5BbusinessId%5D/advisor/route.ts
app/api/admin/businesses/%5BbusinessId%5D/assistant/route.ts
app/api/admin/businesses/%5BbusinessId%5D/creative-studio/route.ts
app/api/admin/businesses/%5BbusinessId%5D/outcomes/route.ts
```

These are **literal directories named `%5BbusinessId%5D`**, not dynamic segments — Next.js will route them at the literal path `/api/admin/businesses/%5BbusinessId%5D/…`. Three have a real `[businessId]` counterpart whose contents **differ** (advisor, assistant, outcomes) — divergent duplicate handlers on the same admin surface. **`creative-studio` has NO `[businessId]` counterpart at all**, so `/api/admin/businesses/<realId>/creative-studio` does not exist and the endpoint is reachable only at the broken literal path. Almost certainly a Windows/CI checkout artefact that was committed.

## 6. (c) PRIVACY

### 6.1 Exact-address exposure

**GAP-005 (Ofertas) and GAP-047 (the zero-importer address engine) — CITED, and GAP-047 re-confirmed on `origin/main` with harder evidence than before.**

`app/lib/businessAddress/` contains a complete, carefully-designed address privacy boundary — 5 modules plus an examples file. `businessAddressPrivacy.ts:1-15` states the contract: *"`resolveBusinessAddressPublicView` is the only place allowed to decide whether an exact address line reaches a public view model."* `:34-38` describes the structural guarantee: `exactAddressLine` is assigned inside exactly one branch, gated on a strict boolean, *"never from string content, so there is no edge case … that can leak the private line."* It is genuinely good code.

**It has zero application consumers.**

```
git grep -n "from \"@/app/lib/businessAddress" origin/main -- app/   ->  (no output)
git grep -n "resolveBusinessAddressPublicView" origin/main -- app/ scripts/
  ->  its own definition (businessAddressPrivacy.ts:5,40)
      app/lib/businessAddress/examples/comidaLocalAddressMappingExample.ts:28,62
      scripts/verify-business-address-foundation.ts  (10 call sites)
```

Every caller is either the module itself, its own `examples/` file, or its own verifier. **Not one production route, mapper, or page imports it.** The verifier (`scripts/verify-business-address-foundation.ts:160-260`) exhaustively proves the privacy guarantee holds — for code nothing calls. The module header even names the shipped pattern it was meant to generalise (`app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts`), which remains the only place a `showAddressPublicly` opt-in is actually enforced.

> **PROVEN REFERENCE EXISTS: YES** | **REFERENCE CATEGORY:** Comida Local | **REFERENCE PATH:** `app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm.ts` — private `businessAddressLine` + explicit `showAddressPublicly` owner opt-in gating the public preview VM; the generalised form already exists, tested, at `app/lib/businessAddress/businessAddressPrivacy.ts:40` | **TARGET PATH:** every other category's public detail/preview mapper — servicios, restaurantes, autos dealer (`app/lib/clasificados/autos/autosDealerStructuredAddress.ts`), ofertas-locales, bienes-raices, rentas | **DIFFERENCE:** the boundary module is built, documented and verified but has **zero importers**; every other category decides address visibility ad hoc or not at all | **ACTION: ADOPT EXISTING** — this is the cheapest high-value fix in the batch: the hard part is already written and proven.

### 6.2 PII in analytics metadata — `sanitizeAnalyticsMetadata` is a SHAPE sanitizer, not a PII filter

`app/lib/analytics/server/validateAnalyticsEvent.ts:79-105`. What it enforces: at most 32 keys; key names ≤ 80 chars; string values truncated to 500 chars; only `string | number | boolean | null` retained (objects and arrays dropped).

**What it does not do:** there is **no key denylist**, **no value pattern-matching**, and **no email/phone/address/name detection**. Any key name and any string content passes through verbatim.

The endpoint is **public and largely unauthenticated**. `app/api/analytics/events/route.ts:49-52` calls `assertAnalyticsEventAuth`, which (`validateAnalyticsEvent.ts:~110`) requires a bearer user **only** for the 3 members of `AUTH_REQUIRED_ANALYTICS_EVENTS` (`listing_save`, `listing_unsave`, `message_sent`). The other **28** event types in `ANONYMOUS_SAFE_ANALYTICS_EVENTS` (`:11-37`) — including `lead_created`, `apply_submitted`, `phone_click`, `whatsapp_click`, `email_click`, `contact_click` — are accepted from any anonymous caller. The sanitized metadata is then written straight into `listing_analytics.metadata` (jsonb) by the **service role** (`route.ts:90-92,111`).

So: any anonymous client can POST up to 32 arbitrary key/value pairs of up to 500 characters each into a durable table, and the categories most likely to carry PII are exactly the contact/lead events. Whether real PII is being written today depends on what the client callers pass — that is an **EVIDENCE GAP** requiring live table inspection.

### 6.2b The API route is not even the only way in

`listing_analytics` carries an **INSERT policy with `WITH CHECK (true)`** — `Allow insert listing_analytics`, `supabase/migrations/20250311000000:15`, re-asserted `20260507180000:86`. It is deliberate (documented in the `20260812090000` header), but it means an anonymous client holding the publishable key can `INSERT` **directly through PostgREST**, bypassing `parseAnalyticsEventBody`, `sanitizeAnalyticsMetadata`, `assertAnalyticsEventAuth`, the source-table allowlist, the identity resolver **and** the dedupe check. Arbitrary `metadata` jsonb, arbitrary `owner_user_id`, arbitrary `event_type`.

The read side was correctly tightened: the original `USING (true)` SELECT policy was **dropped** at `20260812090000:31` and replaced with owner-only `auth.uid() IS NOT NULL AND owner_user_id = auth.uid()::text`. So the table cannot be read back by anon — but it can still be **filled** by anon, unvalidated. Analytics integrity (and any PII written into it) rests entirely on nobody bothering.

> **PROVEN REFERENCE EXISTS: NO** | **REFERENCE CATEGORY:** — | **REFERENCE PATH:** none — there is no key-allowlist or PII-scrubbing helper anywhere in `app/lib/analytics/`; the nearest analogue in spirit is `app/lib/businessAddress/businessAddressPrivacy.ts`'s "structural gate" approach (§6.1), which is a design pattern rather than a reusable implementation | **TARGET PATH:** `app/lib/analytics/server/validateAnalyticsEvent.ts:79-105` | **DIFFERENCE:** the function validates shape only; it needs an explicit key **allowlist** (reject unknown keys rather than truncate them) | **ACTION: NET NEW.**

### 6.3 `console.log` of PII — largely clean

A targeted sweep (`console.(log|info|warn|error)` whose argument mentions email/phone/address/whatsapp/ssn/fullName) returns **17 call sites across 10 files**. Inspection of the newsletter, media-kit, leads, tienda, doorbell and saved-search sites shows the logged fields are **operational, not personal**: `subscriberId`, `to: notificationTo` (the internal ops mailbox resolved by `resolveLeonixNotificationEmail()`, not the subscriber), `source`, `sourceCta`, `updated`, provider error `code`. E.g. `app/api/newsletter/subscribe/route.ts:171-177` and `:179-190`. `app/lib/email/logLeonixEmailFailure.ts:6` truncates provider detail to 240 chars. `newsletterUnsubscribeToken.ts:20-21` and both token migrations explicitly instruct *"Never log or print"* the bearer tokens, and no code does.

**No P0 here.** The one residual risk is `app/lib/saved-search/delivery/savedSearchEmailDelivery.ts:205`, which logs a raw exception object (`console.error("[saved-search] email delivery batch threw unexpectedly", e)`) — an unbounded error payload from an email-delivery path could carry recipient data into logs.

### 6.4 Lead-export CSV surface — see §5.5 (P0)

---

## 7. FINDINGS LEDGER

| # | Sev | Finding | Path:line (ref `origin/main` `a0a47839` unless noted) |
|---|---|---|---|
| 1 | **P0** | `service_role` has **no DML grant** on 45 pre-Concierge tables — `listings`, every public listing table, the entire Revenue OS payment pipeline. All `getAdminSupabase()` reads **and** writes throw Postgres 42501. Fix exists on the Sept fork only. | absent from `supabase/migrations/`; fix = `14a78d46` -> `supabase/migrations/20260909120000_service_role_dml_grants_global_fix.sql` **on `e3956df8` only** |
| 2 | **P0** | Full subscriber/lead CSV (email, name, city, zip, consent timestamp) and archive/delete PATCH routes are gated by a single **unsigned, client-settable** cookie `leonix_admin=1`, with no downstream re-verification; `middleware.ts` does not cover `/api/admin/**`. | `app/admin/_lib/adminLeadExportAuth.ts:8-14` -> `app/lib/supabase/server.ts:70-72`; `middleware.ts:80-82`; 7 routes under `app/api/admin/leads/**` |
| 3 | **P0** | No migration creates `public.listings`. 26 migrations depend on it. No declarative schema, no dump. Set-difference proof: it is the only RLS-enabled table never created. **GAP-073 confirmed.** | `git grep -inE "create table .*listings\b" origin/main -- supabase/` -> empty; `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql:4` |
| 4 | **P0** | Two conflicting manifests both claim `/manifest.webmanifest`, disagreeing on name, `scope`, `start_url`, colors and icons. `app/layout.tsx` points at the static one. | `app/manifest.ts` vs `public/manifest.webmanifest`; `app/layout.tsx:24-25` |
| 4b | **P0** | `servicios_public_listings` public SELECT policy is `USING (true)` with **no status gate and no role clause** — unlike all five sibling lane tables. Draft / `pending_review` / rejected / suspended / `pending_payment` rows appear anon-readable via PostgREST. | `supabase/migrations/20260402160000:18`; states added by `20260407140000_servicios_listing_status.sql`, `20260713153000_servicios_pending_payment_status_and_published_at.sql` |
| 4c | **P1** | `listings` anon policy: the catch-all branch compares **raw** `category` while every other branch uses `lower()`, so a mixed-case `'Rentas'` row bypasses its stricter per-category gate; and `is_published IS DISTINCT FROM false` treats NULL as published for rentas / en-venta / fallback. | `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql:19-21,24-25,35-36,53-55,58-59,69-70` |
| 4d | **P1** | `listing_analytics` INSERT policy is `WITH CHECK (true)` — anon can insert arbitrary rows **directly via PostgREST**, bypassing every server-side validator, allowlist and dedupe check. SELECT was correctly tightened to owner-only; INSERT was not. | `supabase/migrations/20250311000000:15`, `20260507180000:86`; read side fixed at `20260812090000:31` |
| 5 | **P1** | Public reads bypass RLS: 8+ public modules use `getAdminSupabase()` unconditionally. Servicios slug read applies **no SQL status filter at all** — every draft/rejected/suspended row leaves the DB on a public request. | `serviciosPublicListingsServer.ts:182-201`; `restaurantesPublicListingsServer.ts:101,127,145,162`; `empleosPublicListingsDbServer.ts`; `autosClassifiedsListingService.ts`; `viajesStagedListingsDbServer.ts` |
| 6 | **P1** | A public servicios page render queries the per-user tables `user_liked_listings` and `saved_listings` with the service role, unfiltered by user. | `serviciosPublicListingsServer.ts:100-152` |
| 7 | **P1** | `sanitizeAnalyticsMetadata` has no PII key denylist or value pattern-matching; 28 of 31 event types accept anonymous POSTs, including `lead_created`, `email_click`, `phone_click`. | `app/lib/analytics/server/validateAnalyticsEvent.ts:79-105`, `:11-37`; `app/api/analytics/events/route.ts:49-52,90-92` |
| 8 | **P1** | GAP-058 confirmed verbatim: `listings` SELECT and INSERT policies carry **no parent predicate**; BR child–parent visibility is app-layer only. | `supabase/migrations/20260421130001_listings_enable_rls_full_policies.sql:13-38,40-71,73-77` |
| 9 | **P1** | GAP-047 confirmed: the address privacy engine has **zero application importers** — only its own examples file and its own verifier. | `app/lib/businessAddress/businessAddressPrivacy.ts:40`; only callers = `examples/comidaLocalAddressMappingExample.ts:28,62`, `scripts/verify-business-address-foundation.ts` |
| 10 | **P1** | Unsubscribe engine is correct and **unreachable** — no email, template or `List-Unsubscribe` header ever emits the link; `sendLeonixResendEmail` has no headers parameter. | `app/api/newsletter/unsubscribe/route.ts`; `git grep -in "list-unsubscribe" origin/main -- app/` -> 0; `app/lib/email/sendLeonixResendEmail.ts:28-45` |
| 11 | **P1** | Double opt-in is dead code — zero importers of `newsletterVerificationState.ts`; nothing ever writes `pending_verification`. All subscribers single-opt-in. | `app/lib/newsletter/newsletterVerificationState.ts` (0 importers); `supabase/migrations/20260826130000_leonix_newsletter_verification_state.sql:12-17` |
| 12 | **P1** | Hub JSON-LD 1/14 · `BreadcrumbList` 2/14 · hreflang **0/14 and 0 repo-wide** · `ItemList` emitted nowhere. 4 hubs are `"use client"` and therefore *cannot* carry metadata, yet all 4 are in the sitemap. | §2.2; `comunidad|clases|busco|mascotas-y-perdidos/page.tsx:1`; `app/lib/seo/leonixDiscoveryContracts.ts:41-45` |
| 13 | **P1** | `ClassifiedAd` is not a schema.org type and is emitted on the shared detail route serving 6 of 14 categories. | `app/(site)/clasificados/anuncio/[id]/page.tsx:1569`; `en-venta/seo/enVentaJsonLd.ts:10` |
| 14 | **P1** | Zero automated a11y/responsive enforcement: no CI, no pre-commit, no `jsx-a11y` plugin, no axe/pa11y; `npm run lint` is **autos-only**; the "responsive gate" verifies doc headings. | no `.github/`; `eslint.config.mjs`; `package.json` `"lint"`; `scripts/verify-responsive-rendering-launch-gate-01.mjs:6-27` |
| 15 | **P1** | 4 URL-encoded literal shadow API routes; 3 diverge from their `[businessId]` twins and `creative-studio` has **no** twin. | `app/api/admin/businesses/%5BbusinessId%5D/{advisor,assistant,creative-studio,outcomes}/route.ts` |
| 16 | **P2** | Viajes ships both `results/` and `resultados/` with **no** `next.config.ts` redirect and no canonical on either. `/results` vs `/resultados` redirect direction is inconsistent across the other 11 categories. | `next.config.ts:51-140` (11 sources); `viajes/results/page.tsx`, `viajes/resultados/page.tsx` |
| 17 | **P2** | Segment-level canonical leak: the restaurantes layout stamps the hub canonical on every non-overriding child. | `app/(site)/clasificados/restaurantes/layout.tsx:7-9` vs the warning at `app/(site)/clasificados/layout.tsx:1-4` |
| 18 | **P2** | GAP-016 (autos half) confirmed live: `/clasificados/publicar/autos` renders the identical `PublicarAutosBranchClient` as `/publicar/autos`, no redirect, no canonical. | `app/(site)/clasificados/publicar/autos/page.tsx:3` |
| 19 | **P1** | 3 tables created with **no** RLS enable **and no `REVOKE`/`GRANT` in any migration** — exposure depends on the project's default privileges, which are not in this repo. Needs live verification. | `20260408140000_autos_classifieds_analytics_events.sql:3`; `20260506150000_leonix_ad_id_all_classifieds.sql:7`; `20260714231500_rentas_lifecycle_reminders_and_expiration_index.sql:11` |
| 19b | **P2** | 134 of 183 RLS-enabled tables carry **zero** policies. Most are deliberately service-role-only, but ~16 sit behind user-facing surfaces with no such comment, so any browser-side query silently returns `[]`. | `support_tickets`, `site_page_blocks`, `site_section_content`, `magazine_issues`, `tienda_*` (5), `translation_records`, `servicios_public_leads`, `servicios_listing_reviews`, `servicios_analytics_events`, `church_submissions`, `prayer_acknowledgements`, `prayer_reports`, `leonix_endorsement_votes` |
| 19c | **P2** | `ENABLE ROW LEVEL SECURITY` appears in two casings (73 upper / 59 lower); **every lane listing table uses the lowercase form**, so any case-sensitive audit of this repo reports them as unprotected. | §4.1 |
| 20 | **P2** | Full-CSV export includes unsubscribed rows with full PII (only `deleted_at IS NULL` filtered). The send-ready email CSV correctly filters to `status === "subscribed"`. | `app/admin/_lib/leonixLeadsCsv.ts` (`newsletterSubscribersToCsv` vs `newsletterReadyEmailsCsv`); `app/admin/_lib/leonixLeadsData.ts` |
| 21 | **P3** | Stale robots disallow for a route `origin/main` deleted. | `app/lib/seo/leonixDiscoveryContracts.ts:24` |
| 22 | **P3** | `app/metadata.ts` is vestigial — `app/layout.tsx` owns live metadata. | `app/metadata.ts:1-3` |
| 23 | **CORRECTION** | GAP-016's servicios/restaurantes half is **RESOLVED** on `origin/main`: `app/(site)/restaurantes/**` has 0 files and `app/(site)/servicios/page.tsx` is absent. The prior finding was derived from the 112-commit-stale tree. | `git ls-tree -r origin/main -- "app/(site)/restaurantes"` -> 0; `git cat-file -e origin/main:app/(site)/servicios/page.tsx` -> absent |

---

## 8. EVIDENCE GAPS

1. **Which manifest actually serves at `/manifest.webmanifest`** (§3.6) cannot be determined from source under Next 15.5.7. Requires `curl https://<deployment>/manifest.webmanifest`. Both outcomes are defects; the fix (delete the static file) is the same either way.
2. **Whether real PII is present in `listing_analytics.metadata` today** (§6.2) requires querying the live table. The *capability* to write it is proven from source; the *occurrence* is not.
3. **`public.listings`' actual schema** (§4.3) exists only in the live Staging database. Its columns, types, defaults and constraints could not be recovered from this repository.
4. **Whether `14a78d46` was applied out-of-band to the Staging database** (§4.5). The commit message says it was verified live against project `cgeehvnfyrdoperdotdh`. If so, Staging works while `origin/main`'s migration history does not reproduce it — the repo and the database have silently diverged, which is its own P0.
5. **Runtime behaviour of the 4 `%5BbusinessId%5D` routes** (§5.5b) — whether Next 15 serves, ignores, or errors on them was not tested.
6. **Actual a11y quality.** No tool in this repo measures it. `cbc4cec1` and the Ofertas passes are real but manual and unguarded; nothing here supports a claim about the current state of the other ~1,000 components.
7. **This is a migration-file matrix, not a live `pg_policies` / `pg_class` dump.** `public.listings` proves the production schema contains objects the migration history does not create, so there may be further live tables, policies or grants that no file in this repo describes — including on the three RLS-off tables in §4.2c. Only `select relname, relrowsecurity from pg_class` + `select * from pg_policies` against the real project can close this.
8. Five migrations create policies inside idempotent `DO $$ … pg_policies` guards (`20260421120000`, `20260616130000`, `20260801003000`, `20260801013000`, `20260801023000`). They create *only if absent*, so the effective live predicate may differ from the file text where an earlier or manually-applied version exists.
9. Table-name extraction for the corpus-wide counts (§4.1) is regex-based over concatenated SQL, cross-checked by two independent passes that agreed on 185 / 183 / 49. A table name split across a line break inside a `CREATE TABLE` could still be miscounted.
10. §4.4b's conclusion that draft/rejected/suspended Servicios rows are anon-readable follows from the policy text plus the absence of any narrowing migration. It has **not** been confirmed by an actual anon-key query against the live project — do that before treating it as an active breach rather than a latent one.
