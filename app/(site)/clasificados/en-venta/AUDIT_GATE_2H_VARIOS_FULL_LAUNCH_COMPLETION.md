# Gate 2H — Varios Full Launch Completion

## 1. Files inspected
- Taxonomy: `categories.ts`, `subcategories.ts`, `synonyms.ts`, `enVentaTaxonomy.ts`, `enVentaTaxonomySmoke.ts`
- Publish: hub redirect, Pro/Free apps, `CategorySelectionSection`, `EnVentaPlanIntakeCallout`, preview/publish bars
- Results: `EnVentaResultsClient`, cards, filters (`evDept`/`evSub`), sort (`republish_sort_at`)
- Detail: `EnVentaAnuncioLayout`, `EnVentaListingReportDrawer`
- Dashboard: `EnVentaListingManageCard`, `mis-anuncios` republish
- Moderation: `enVentaFamilySafety.ts`, `enVentaPolicyCopy.ts`
- Reports: `submitEnVentaListingReport.ts`, `/api/clasificados/en-venta/report`
- Prior audits: Gate 2M, Gate 2N

## 2. Files changed (Gate 2H)
- `results/EnVentaResultListingCard.tsx` — badge `RECIENTE`/`RECENT` (not DESTACADO/FEATURED)
- `results/utils/enVentaResultsSummary.ts` — refreshed-only copy (no boost/visibility-renewal marketing)
- `publicar/en-venta/storefront/application/LeonixEnVentaStorefrontApplication.tsx` — Varios labels; removed Free switch link
- `tests/enVentaTaxonomySmoke.ts` — Gate 2G subcategory keys assertion
- `AUDIT_GATE_2H_VARIOS_FULL_LAUNCH_COMPLETION.md` (this file)
- `scripts/en-venta-gate-2h-varios-full-launch-audit.ts`
- `package.json` — `enventa:gate2h-full-launch-audit`

## 3. Taxonomy wiring result
- **TRUE** — Gate 2G subcategories present: `electrodomesticos`, `mascotas-accesorios`, `libros-medios`, `materiales-construccion`, `venta-garage-mudanza`, `joyeria-relojes`, `oficina-escuela`, `accesorios-auto` under `vehiculos-partes`
- Pro + Free publish share `CategorySelectionSection` → same dept/sub/item-type rails
- Results filters use `EN_VENTA_SUBCATEGORY_ROWS` + `evDept`/`evSub` URL params
- Synonyms in `taxonomy/synonyms.ts` cover new buckets
- **Blocked (out of scope):** `app/(site)/clasificados/anuncio/[id]/page.tsx` category chip still says "En Venta" (not in allowed edit list)

## 4. Pro included flow result
- **TRUE** — Public hub + `/free` redirect to Pro; Pro app copy: included sin costo / no payment

## 5. Free lane behavior
- **TRUE** — Free application preserved; public choice hidden (redirect)

## 6. Refrescar result
- **TRUE** — `renewEnVentaRepublish` updates same row; `republish_sort_at` drives newest sort; labels + helper on dashboard

## 7. Boost/Impulsar removal result
- **TRUE** — Public results/cards use recién refrescados; card badge RECIENTE; summary banners updated
- Internal `boosts/` module unchanged (comments only)

## 8. Report drawer result
- **TRUE** — Drawer + API + `listing_reports` persistence; disclaimer; high-severity admin email via Resend when configured

## 9. Moderation/AI result
- **TRUE** — Deterministic `enVentaFamilySafety` on publish/preview
- **FALSE (deferred)** — AI second layer not wired; auto-hide on report not wired

## 10. Seller/admin/legal copy result
- **TRUE** — `enVentaSellerHiddenNotice`, platform responsibility, Varios publish checkbox (`COPY_ITEM`)
- Admin queue uses generic `ListingsCategoryOpsQueuePage` with slug `en-venta` (no redesign)

## 11. Presentation parity result
- **Mostly TRUE** within En Venta surfaces; **partial blocker** on shared detail page category chip label

## 12. Build/check result
Run `npm run enventa:gate2h-full-launch-audit`, `npm run enventa:gate2n-launch-audit`, `npm run enventa:gate2m-varios-audit`, `npm run build`.

## 13. Remaining risks
- Detail page chip "En Venta" in `anuncio/[id]/page.tsx`
- Seller email on hide not implemented
- AI moderation deferred
- Leonix Promoted (`admin_promoted` / detail_pairs) still shows RECIENTE badge — not paid boost, but ops-driven

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Varios Spanish label is preserved | TRUE | enVentaPublicLabels |
| English For Sale label is preserved | TRUE | enVentaPublicLabels |
| Internal en-venta route/folder was not renamed | TRUE | No route changes |
| Gate 2G taxonomy flows to Free publish | TRUE | Shared CategorySelectionSection |
| Gate 2G taxonomy flows to Pro publish | TRUE | Pro uses same section |
| Gate 2G taxonomy flows to results filters | TRUE | evDept/evSub + EN_VENTA_SUBCATEGORY_ROWS |
| Gate 2G taxonomy flows to preview/results/detail labels | TRUE | mapDbRow + buildEnVentaSpecsRows |
| Search synonyms cover new taxonomy buckets | TRUE | synonyms.ts |
| No live animals/pet adoption/missing/found pets were added | TRUE | moderation blocks; no taxonomy buckets |
| Full vehicles remain excluded from Varios | TRUE | enVentaFamilySafety vehicle rules |
| Public publish path uses Pro included-free flow | TRUE | redirect pages |
| Free files were preserved | TRUE | LeonixEnVentaFreeApplication |
| Free lane is hidden/parked from public choice | TRUE | redirect |
| No public $9.99 remains | TRUE | defaults + audit grep |
| No Stripe/payment logic was added | TRUE | No payment changes |
| Public Boost/Impulsar wording was removed/hidden | TRUE | results + card + summary |
| Refrescar anuncio is real or blocker documented | TRUE | renewEnVentaRepublish |
| Refrescar preserves same id/leonix_ad_id or blocker documented | TRUE | update by id only |
| Results ordering uses refreshed timestamp or blocker documented | TRUE | republish_sort_at |
| Reportar anuncio CTA exists or blocker documented | TRUE | EnVentaListingReportDrawer |
| Report drawer has all required reasons or blocker documented | TRUE | enVentaPolicyCopy |
| Report submission persists or blocker documented | TRUE | listing_reports |
| Report disclaimer exists | TRUE | EN_VENTA_REPORT_DISCLAIMER |
| Family-safe deterministic moderation remains active | TRUE | enVentaFamilySafety |
| AI moderation is wired only if safe or blocker documented | FALSE | Blocker: next gate |
| Seller policy copy is professional and non-accusatory | TRUE | enVentaSellerHiddenNotice |
| Admin alert/email path exists or blocker documented | TRUE | Resend conditional |
| Buyer/seller responsibility copy exists | TRUE | EN_VENTA_PLATFORM_RESPONSIBILITY |
| Preview/results/detail presentation parity is acceptable | PARTIAL | Blocker: anuncio chip label |
| No fake boost/featured/report/AI behavior was added | TRUE | Real refresh + real reports |
| No unrelated categories were touched | TRUE | Scope-only edits |
| npm run build passed | TRUE | npm run build (exit 0) |
