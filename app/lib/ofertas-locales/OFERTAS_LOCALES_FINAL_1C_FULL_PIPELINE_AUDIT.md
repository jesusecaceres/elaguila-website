# Stack FINAL-1C — Full Pipeline Audit

Classification key: `TRUE_NOW` | `MUST_FIX_NOW` | `SAFE_TO_DEFER_*` | `FUTURE_AI` | `BLOCKER`

## A. Application / draft

| Finding | Class |
|---------|-------|
| Route `/publicar/ofertas-locales` exists | TRUE_NOW |
| Auth gate (login redirect) | TRUE_NOW |
| Wizard steps | TRUE_NOW |
| Draft survives step changes | TRUE_NOW |
| Draft survives preview/back | TRUE_NOW |
| Refresh preserves draft (same tab) | TRUE_NOW |
| New tab starts clean | TRUE_NOW (sessionStorage) |
| Reset draft button | TRUE_NOW |
| Long-term saved draft / resume URL | DO_NOT_BUILD_YET |

## B. Upload / assets

| Finding | Class |
|---------|-------|
| Client file validation | TRUE_NOW |
| Vercel Blob upload API + auth | TRUE_NOW |
| Metadata in draft (no File/base64 in storage) | TRUE_NOW |
| Survives preview/back | TRUE_NOW |
| Submitted in publish payload | TRUE_NOW |
| DB `flyer_assets`/`coupon_assets` | TRUE_NOW (code; BLOCKER live DB) |

## C. Business data

| Field group | Class |
|-------------|-------|
| Offer/business/location/contact | TRUE_NOW in mapper |
| Social + Google Business | TRUE_NOW |
| Google Review + Yelp | TRUE_NOW (FINAL-1B+) |
| AI + featured intent | TRUE_NOW (internal_notes metadata) |
| customMarketType | TRUE_NOW |

## D. Publish

| Finding | Class |
|---------|-------|
| API auth + validation | TRUE_NOW |
| `pending_review` only | TRUE_NOW |
| Success state, no public link | TRUE_NOW |
| Live submit | BLOCKER (DB tables missing) |

## E. Production DB

| Table | Class |
|-------|-------|
| ofertas_locales | BLOCKER — missing in production |
| oferta_local_scan_jobs | BLOCKER |
| oferta_local_items | BLOCKER |
| RLS owner-only | TRUE_NOW in repo migrations |

## F. Public page/results

| Finding | Class |
|---------|-------|
| Route exists | TRUE_NOW |
| Filters + empty state + CTA | TRUE_NOW |
| Excludes pending/draft/rejected | TRUE_NOW |
| No raw internal_notes in JSON response | TRUE_NOW |
| No owner_id in public API | TRUE_NOW |

## G. Public card/detail

| Finding | Class |
|---------|-------|
| Offer cards + drawer | TRUE_NOW (partial Hub) |
| Item search cards | TRUE_NOW |
| Social on approved items (parsed metadata) | TRUE_NOW (+ googleReview/yelp Gate C) |
| Social on offer cards | SAFE_TO_DEFER_ADMIN (no internal_notes in public-offers API) |
| Fake reviews/ratings | TRUE_NOW — none |

## H. AI pipeline

| Finding | Class |
|---------|-------|
| Scan route + auth | TRUE_NOW |
| Tables in repo migration | TRUE_NOW |
| Items default pending/inactive | TRUE_NOW |
| Owner review UI (publish flow) | PARTIAL — Stack B panel |
| Public AI items | TRUE_NOW — approved+active+parent approved only |
| Live AI smoke | BLOCKER (DB) |

## I. Shopping list / route / email-SMS

| Finding | Class |
|---------|-------|
| Shopping list V1 localStorage | TRUE_NOW |
| Public-safe items only | TRUE_NOW |
| Route optimizer | DO_NOT_BUILD_YET |
| Open map via directions/address | TRUE_NOW |
| Email/SMS share | PENDING_NEXT_STACK (FINAL-7) |

## J–M. Admin / dashboard / analytics

| Area | Class |
|------|-------|
| pending_review shape sufficient | TRUE_NOW |
| Admin queue | SAFE_TO_DEFER_ADMIN — FINAL-2 |
| Seller dashboard | SAFE_TO_DEFER_DASHBOARD — FINAL-3 |
| Analytics events defined | TRUE_NOW (names only) |
| Analytics implementation | SAFE_TO_DEFER_ANALYTICS — FINAL-5 |

## MUST_FIX_NOW summary (Gate C)

1. ✅ sessionStorage draft (prior stack)
2. ✅ googleReview/yelp publish + UI (prior stack)
3. ✅ googleReview/yelp public social parse (Gate C)
4. ❌ Production DB apply — **BLOCKER for Chuy**, not code fix

## BLOCKER

**Production Supabase migrations not applied.** No live submit, no live AI scan, no RLS verification in prod until Chuy runs SQL Editor apply.
