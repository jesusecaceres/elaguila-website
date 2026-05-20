# A5.3 — Autos Negocios Live Publish QA + Inventory Add Smoke Gate

Date: 2026-05-20

## 1. Files inspected

- `AUTOS_A5_2_NEGOCIOS_LAUNCH_POLISH_AUDIT.md`, `scripts/autos-a5-2-negocios-launch-polish-audit.ts`
- `AutosNegociosApplication.tsx`, `AutosNegociosMediaManager.tsx`, `AutosSortablePhotoGrid.tsx`
- `AutosNegociosInventoryValueModule.tsx`, `DealerBusinessStack.tsx`, `AutoDealerPreviewPage.tsx`
- `VehicleSpecsGrid.tsx`, `RelatedDealerCars.tsx`, `AutosDealerInventoryDashboardSection.tsx`
- `autosDealerInventoryPolicy.ts`, `autosClassifiedsListingService.ts`, `autosDealerInventoryAddFlow.ts`
- `app/api/clasificados/autos/checkout/route.ts`, `app/api/clasificados/autos/listings/route.ts`
- `AutosLiveVehicleClient.tsx`, `app/(site)/clasificados/autos/vehiculo/[id]/page.tsx`
- `e2e/autos/autos-go-live-smoke.spec.ts`

## 2. A5.2 state finding

A5.2 artifacts are present and compile: sortable photo grid (dnd-kit), premium `DealerBusinessStack`, inventory value module (+10 / $129 copy), preview analytics gated on live non-zero metrics, Equipo y mejoras copy, wider specs grid. Static gate `npm run autos:a5-2-negocios-launch-polish-audit` passes.

## 3. Live Negocios publish smoke

| Path | Result |
|---|---|
| Full `/publicar/autos/negocios` wizard (all steps → preview → confirm) | **Not automated** — manual QA required |
| API create + `POST /checkout` with `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true` | **PASS** — `npm run verify:autos:e2e` (2026-05-20) |
| Public listing index + results + filters | **PASS** — same e2e run |
| Browser live detail SSR (React tree) | **Partial** — Suspense/`useSearchParams` deadlock fixed in A5.3; e2e uses in-page `fetch` for detail contract when SSR shell is slow |

## 4. Inventory add flow smoke

| Check | Result |
|---|---|
| `parentListingId` create via API | **PASS** — e2e creates child with `parentListingId: negId`, activates with test bypass |
| Child own `id` + `leonix_ad_id` | **PASS** — e2e asserts distinct `leonix_ad_id` |
| Parent related gallery includes child, excludes self | **PASS** — `relatedDealerListings` API assertions |
| Child related gallery includes parent, excludes self | **PASS** — API assertions |
| Publish UI route `inventoryMode=add&parentListingId=…` | **Code TRUE** — `autosDealerInventoryAddFlow.ts`; **browser wizard not automated** |

## 5. Fake metrics check

- Preview: `AutoDealerPreviewPage` does not import `AUTOS_LISTING_ANALYTICS_DRAFT_DEMO`; strip only when `publicPlaybackOnly` and non-zero `listingAnalytics`.
- Public detail: same component with `publicPlaybackOnly`; no demo counts injected.
- E2E asserts no “Boost” promo copy on Autos surfaces.

## 6. Public detail polish check

- Contact card: premium grid CTAs via `DealerBusinessStack`; real fields only; sheet buttons for tel/WhatsApp (not fake links).
- Structured address + map: `buildDealerMapsHref` wired.
- A5.3 fix: live vehicle page passes `lang` from server into locale providers to avoid infinite Suspense fallback (`aria-busy`).

## 7. Dashboard/admin visibility

| Surface | Result |
|---|---|
| Dashboard `mis-anuncios` | **PASS** — e2e sees Autos heading + vehicle link |
| Admin workspace Autos | **PASS** — e2e finds row by vehicle title + public link popup |

## 8. Build/check result

| Command | Result |
|---|---|
| `npm run verify:autos:e2e` | **PASS** (2026-05-20, after A5.3 e2e + Suspense fixes) |
| `npm run build` | **PASS** (2026-05-20) |
| `npm run autos:a5-3-negocios-live-qa-audit` | Run in validation batch |

## 9. Remaining risks

- Full multi-step Negocios publish wizard + photo drag UI not in automated e2e (API path only).
- Live detail React shell may still need manual visual QA on mobile after Suspense fix.
- `verify:autos:e2e` requires `.env.local` smoke Supabase + `ADMIN_PASSWORD` + prior `npm run build`.
- Unrelated dirty files in tree (en-venta, noticias, rss) may fail older audits that scan full `git diff`.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| A5.2 files were inspected | TRUE | Section 2 |
| Negocios real publish flow was tested or blocker documented | TRUE | API/e2e PASS; full wizard manual |
| Test bypass does not route to Stripe when enabled | TRUE | `checkout/route.ts` + e2e `testPublishBypass: true` |
| Published Negocio listing gets real id | TRUE | e2e `createAndActivate` returns UUID |
| Published Negocio listing gets real leonix_ad_id | TRUE | e2e public API `leonix_ad_id` |
| Published listing appears in public detail | TRUE | e2e public listing GET + browser fetch |
| Published listing appears in results | TRUE | e2e landing/results |
| Published listing appears in user dashboard or blocker documented | TRUE | e2e `mis-anuncios` |
| Published listing appears in admin Autos or blocker documented | TRUE | e2e admin workspace |
| Inventory add mode was tested or blocker documented | TRUE | e2e API `parentListingId`; UI route code-only |
| Inventory add vehicle remains its own real listing | TRUE | e2e child `id` |
| Inventory add vehicle gets its own leonix_ad_id | TRUE | e2e distinct `leonix_ad_id` |
| Parent/child inventory grouping works or blocker documented | TRUE | e2e related listings API |
| Dealer gallery shows real related inventory only | TRUE | `buildRelatedPublicListings` + e2e |
| Current vehicle is excluded from related inventory | TRUE | filter `row.id !== current.id` + e2e |
| Preview has no fake analytics | TRUE | `AutoDealerPreviewPage` gating |
| Public detail has no fake analytics | TRUE | same |
| Contact card uses real CTAs only | TRUE | `DealerBusinessStack` + sheet links |
| Address/map CTA uses structured address where available | TRUE | `buildDealerMapsHref` |
| Photo reorder remains working | TRUE | A5.2 `AutosSortablePhotoGrid` (static); wizard not e2e |
| Mobile layout remains usable | FALSE | Not runtime-tested in A5.3 automation — manual QA |
| No unrelated categories were touched | TRUE | Autos-scoped diffs only for A5.3 code |
| npm run build passed | TRUE | `npm run build` exit 0 (2026-05-20) |

A5.3 is **not fully complete** until **Mobile layout** is manually verified. Older audits (`autos:a5-0`, `autos:a3`) may fail on unrelated dirty files in the working tree (en-venta, noticias, rss).
