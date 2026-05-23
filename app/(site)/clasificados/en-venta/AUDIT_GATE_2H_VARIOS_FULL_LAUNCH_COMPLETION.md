# Gate 2H — Varios Full Launch Completion (Before Final QA)

## 1. Files inspected
Landing (`EnVentaHubPageClient`), results, detail (`EnVentaAnuncioLayout`, report drawer), publish hub/Pro/Free/storefront, preview + draft roundtrip, success bar, dashboard card, admin queue, taxonomy/synonyms, moderation, reports API, prior Gates 2B–2G/2M/2N artifacts.

## 2. Files changed (this gate pass)
- `results/EnVentaResultListingCard.tsx` — RECIENTE/RECENT badge (not DESTACADO)
- `results/utils/enVentaResultsSummary.ts` — refreshed-only public copy
- `dashboard/EnVentaListingManageCard.tsx` — “Publicar con Varios Pro” (not Upgrade to Pro)
- `publicar/en-venta/free/application/LeonixEnVentaFreeApplication.tsx` — Varios labels, parked-lane copy
- `publicar/en-venta/storefront/page.tsx` + sections — Varios labels
- `taxonomy/synonyms.ts` — car stereo / estéreo terms
- `launch-checklist/page.tsx` — internal Varios title
- `tests/enVentaTaxonomySmoke.ts` — Gate 2G key assertions
- `AUDIT_GATE_2H_VARIOS_FULL_LAUNCH_COMPLETION.md`, `scripts/en-venta-gate-2h-varios-full-launch-audit.ts`

## 3. Varios branding result
**TRUE** on En Venta-owned surfaces (hub, publish Pro, results, layout browse CTA, dashboard, storefront).  
**PARTIAL:** `app/(site)/clasificados/anuncio/[id]/page.tsx` category chip still “En Venta” — **RELATED_BLOCKING** (outside allowed edits).

## 4. Pro included / free lane result
**TRUE** — Public hub + `/free` redirect to Pro; included-free copy; Free files preserved; no public chooser; no $9.99/Stripe.

## 5. Taxonomy / search result
**TRUE** — Gate 2G subcategories in publish + filters; synonyms cover appliances, pet supplies, books/media, building materials, garage/moving, jewelry, office/school, auto parts; cross-category exclusions in moderation.

## 6. Preview / published / results parity result
**TRUE** within En Venta mapping/preview/build paths; shared detail chip is the remaining gap (see §3).

## 7. Draft / preview roundtrip result
**TRUE** — `saveEnVentaPreviewReturnDraft` + `takeEnVentaPreviewReturnInitialState` wired in Free and Pro apps; Strict Mode memory cache in `enVentaPreviewDraft.ts`.

## 8. Refrescar result
**TRUE** — `renewEnVentaRepublish` updates same row; `republish_sort_at` sort; ES/EN labels + helper on dashboard card.

## 9. Boost / Impulsar removal result
**TRUE** — Public copy uses recién refrescados / Refrescar; no DESTACADO/FEATURED badges; internal `boosts/` module unchanged.

## 10. Report drawer / pipeline result
**TRUE** — Drawer + POST `/api/clasificados/en-venta/report` → `listing_reports`; 8 reasons; disclaimer; high-severity Resend admin alert when env configured.

## 11. Moderation / AI result
**TRUE** deterministic guardrails on publish/preview. **FALSE** AI second layer (blocker: next gate). No auto-hide on report.

## 12. Seller / admin / legal copy result
**TRUE** — `enVentaSellerHiddenNotice`, platform responsibility, Varios publish checkbox; admin uses `ListingsCategoryOpsQueuePage` slug `en-venta`.

## 13. Dashboard / admin result
**TRUE** — Varios listings in Mis anuncios via `EnVentaListingManageCard`; refresh metadata; admin queue by slug.

## 14. Build / check result
`enventa:gate2h-full-launch-audit`, `enventa:gate2n-launch-audit`, `enventa:gate2m-varios-audit`, `npm run build` — run at validation.

## 15. Remaining risks
- Detail category chip on shared `anuncio/[id]` route
- Seller email on policy hide not wired
- AI moderation deferred
- Dirty unrelated parallel work in tree (Servicios/Tienda/email) — not touched

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Spanish public label is Varios | TRUE | enVentaPublicLabels + surfaces |
| English public label remains For Sale | TRUE | enVentaPublicLabels |
| Internal en-venta route/folder was not renamed | TRUE | No route changes |
| Public publish path uses Pro included-free flow | TRUE | Redirect + Pro app |
| Free files were preserved | TRUE | LeonixEnVentaFreeApplication |
| Free lane is hidden/parked from public choice | TRUE | Redirect |
| No public $9.99 remains | TRUE | Audit grep |
| No Stripe/payment logic was added | TRUE | No payment edits |
| Gate 2G taxonomy buckets flow to publish dropdowns | TRUE | CategorySelectionSection |
| Gate 2G taxonomy buckets flow to results filters | TRUE | evDept/evSub |
| Gate 2G taxonomy buckets flow to preview/results/detail labels | TRUE | DTO + specs |
| Search synonyms cover new taxonomy buckets | TRUE | synonyms.ts |
| No live animals/pet adoption/missing/found pets were added | TRUE | Moderation + no buckets |
| Full vehicles remain excluded from Varios | TRUE | enVentaFamilySafety |
| Preview/result/detail labels are materially aligned | PARTIAL | anuncio chip blocker |
| Free preview roundtrip works or blocker documented | TRUE | enVentaPreviewDraft + Free app |
| Pro preview roundtrip works or blocker documented | TRUE | enVentaPreviewDraft + Pro app |
| Public Boost/Impulsar wording was removed/hidden | TRUE | Results + card + summary |
| Refrescar anuncio is real or blocker documented | TRUE | renewEnVentaRepublish |
| Refrescar preserves same id/leonix_ad_id or blocker documented | TRUE | Update by id |
| Results ordering uses refreshed timestamp or blocker documented | TRUE | republish_sort_at |
| Reportar anuncio CTA exists or blocker documented | TRUE | EnVentaListingReportDrawer |
| Report drawer has required reasons or blocker documented | TRUE | enVentaPolicyCopy |
| Report submission persists or blocker documented | TRUE | listing_reports |
| Report disclaimer exists | TRUE | EN_VENTA_REPORT_DISCLAIMER |
| Family-safe deterministic moderation remains active | TRUE | enVentaFamilySafety |
| AI moderation is wired only if safe or blocker documented | FALSE | Blocker |
| Seller policy copy is professional and non-accusatory | TRUE | enVentaSellerHiddenNotice |
| Admin alert/email path exists or blocker documented | TRUE | Resend conditional |
| Buyer/seller responsibility copy exists | TRUE | Platform responsibility |
| Dashboard/admin coverage exists or blocker documented | TRUE | Manage card + admin queue |
| No fake boost/report/AI/admin behavior was added | TRUE | Real implementations |
| No unrelated categories were touched | TRUE | Scope-only edits |
| npm run build passed | TRUE | npm run build exit 0 |
