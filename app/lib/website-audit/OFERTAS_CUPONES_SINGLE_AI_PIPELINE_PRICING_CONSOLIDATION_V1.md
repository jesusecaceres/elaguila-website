# OFERTAS / CUPONES — Single AI Pipeline Pricing Consolidation V1

## Task classification

**BATTLEFIELD ARCHITECTURE BUILD** — commercial pipeline consolidation (application → draft → AI entitlement → review → preview → publish metadata). Not a public visual rebuild. Stripe untouched.

## Locked business decision

| Product | Price | Duration | AI |
|---------|-------|----------|-----|
| Volante interactivo Leonix | $399 | 30 days | Included |
| Cupones Leonix | $199 | 30 days | Included |

Retired: basic flyer without AI, +$199 AI add-on, manual-only customer path, $598 total.

## Branch / HEAD

- **Branch:** `main`
- **HEAD:** `d0bcdb1bc7411c46868ff577c4556296b29f9a3d`

## Initial dirty state

- **Staged:** none
- **Unrelated dirty:** servicios like-display files, `package.json`, verify script (pre-existing)
- **Ofertas/Cupones dirty at start:** none
- **Stripe files dirty:** NO

## Files inspected

- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/ofertasLocalesTwoLaneProductModel.ts` (read-only)
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx` (read-only)
- `app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts` (read-only)
- Public Ofertas/Cupones routes (read-only regression)

## Files changed

- `app/lib/ofertas-locales/ofertasLocalesConstants.ts`
- `app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesDraftPersistence.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx`
- `app/lib/website-audit/OFERTAS_CUPONES_SINGLE_AI_PIPELINE_PRICING_CONSOLIDATION_V1.md`
- `scripts/verify-ofertas-cupones-single-ai-pipeline.mjs`

## Old product architecture

| Area | Before |
|------|--------|
| Step 1 | Two lane cards ($399/mes, $199/mes) + separate AI toggle (+$199/mes) |
| Draft field | `wantsAiSearchableSpecials` (default false) controlled AI entitlement |
| Step 5–7 | AI scan/review blocked when flag false |
| Step 7 pricing | Base + optional AI line → up to $598/mes |
| Publish metadata | `wantsAiSearchableSpecials: true` only when draft flag true |

## Old AI add-on field mapping

| Field | Old meaning | New meaning |
|-------|-------------|-------------|
| `wantsAiSearchableSpecials` | Customer purchased AI add-on | **Deprecated** — normalized to `true` when a publish product lane is selected; kept for backward-compatible publish metadata |
| `OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY` | +$199 display | **Deprecated** — audit/legacy only |

## Old manual / non-AI branch

- No separate manual item-entry product path in Step 1; non-AI behavior was **`wantsAiSearchableSpecials === false`** which skipped AI scan panel, product grid in preview, and Step 5 checkpoints.
- Manual correction **after** AI remains unchanged.

## New Ofertas product contract

```ts
interactive_flyer: {
  key: "interactive_flyer",
  displayPriceUsd: 399,
  durationDays: 30,
  aiIncluded: true,
  productSearchIncluded: true,
  flyerViewerIncluded: true,
  shoppingListIncluded: true,
}
```

Source: `OFERTAS_LOCALES_PUBLISH_PRODUCT_CATALOG` in `ofertasLocalesConstants.ts`.

## New Cupones product contract

```ts
coupons: {
  key: "coupons",
  displayPriceUsd: 199,
  durationDays: 30,
  aiIncluded: true,
  productSearchIncluded: false,
  productShoppingListIncluded: false,
}
```

## Step 1 before / after

**Before:** Lane titles from two-lane model + `/mes` + AI add-on card.

**After:** Two complete package cards — Volante interactivo Leonix ($399 / 30 días, IA incluida) and Cupones Leonix ($199 / 30 días, IA incluida) with included bullets and one-price note. No AI checkbox.

## Automatic AI entitlement behavior

- `isOfertaLocalAiIncludedInPackage(draft)` returns true when `shopping_specials` or `local_coupons` lane is selected.
- `normalizeOfertaLocalDraftProductEntitlements()` sets `wantsAiSearchableSpecials: true` for legacy drafts with false.
- Application uses `aiIncludedInPackage` for Step 5–7 gating; sync effect keeps draft flag aligned for existing AI panel components.

## Legacy draft normalization

- On load/save: `mergeDraft` → `normalizeOfertaLocalDraftProductEntitlements`
- Old `wantsAiSearchableSpecials: false` + weekly flyer lane → AI enabled on reopen
- Flyer assets, reviewed products, contact data preserved

## Review / preview pricing cleanup

- Step 7 shows one package price + duration + “IA incluida”
- Removed AI surcharge line and $598 total arithmetic
- Preview visual layout unchanged (no pricing copy changes required in preview card)

## Publish mapper behavior

- Writes `wantsAiSearchableSpecials: true` when `isOfertaLocalAiIncludedInPackage(draft)`
- Adds metadata: `publishProductKey`, `publishDisplayPriceUsd`, `publishDurationDays`, `aiIncluded`
- No schema migration; no payment claim

## Admin / dashboard copy cleanup

- No commercial AI-upgrade labels found requiring change in allowed scope
- Operational labels (“AI scan”, `wantsAiSearchableSpecials` column) retained for processing status

## Public regression findings

- No public landing/results/hub/card files modified
- Cupones remains cart-free
- Shopping list unchanged

## Stripe handoff (separate chat)

**Do not implement in this gate.**

| Future product | Internal key | Label | Price | Duration | Notes |
|----------------|--------------|-------|-------|----------|-------|
| A | `interactive_flyer` | Volante interactivo Leonix | $399 | 30 days | One checkout line, AI included |
| B | `coupons` | Cupones Leonix | $199 | 30 days | One checkout line, AI included |

**Read-only inspection:** No Stripe integration under `app/api/ofertas-locales/`. Category Stripe routes live outside this scope (see `OFERTAS_FINAL_LAUNCH_GATE_AUDIT.md`).

**Obsolete (to retire in Stripe chat):**

- Base weekly flyer without AI (if ever created)
- AI Searchable Specials add-on price (~$199–$249/mo in CFO constants)
- Any composite $598 checkout

**Required later:** Map one Stripe Price per product; dashboard entitlement from paid product key, not deprecated `wants_ai_searchable_specials` alone.

## Deferred cleanup

- Remove deprecated `OFERTAS_LOCALES_AI_PRODUCT_SEARCH_ADDON_DISPLAY_MONTHLY` after Stripe migration
- Refactor locked AI panel/readiness files to use `isOfertaLocalAiIncludedInPackage` directly
- Update `scripts/ofertas-locales-stack-9b-product-architecture-audit.ts` (expects old +$199 UI)
- Dashboard “AI requested” column → “IA incluida” when product catalog metadata present

## TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Ofertas price is $399 | TRUE |
| Ofertas duration is 30 days | TRUE |
| Ofertas AI included | TRUE |
| Cupones price is $199 | TRUE |
| Cupones duration is 30 days | TRUE |
| Cupones AI included | TRUE |
| AI add-on card removed | TRUE |
| AI +$199 wording removed | TRUE |
| $598 total removed | TRUE |
| Manual-only customer path removed | TRUE |
| Existing AI scan preserved | TRUE |
| Existing product extraction preserved | TRUE |
| Existing review workspace preserved | TRUE |
| Customer correction preserved | TRUE |
| Existing flyer preview preserved | TRUE |
| Existing product grid preserved | TRUE |
| Existing product drawer preserved | TRUE |
| Existing clickable flyer architecture preserved | TRUE |
| Existing public flyer hub preserved | TRUE |
| Existing shopping list preserved | TRUE |
| Admin approval pipeline preserved | TRUE |
| Pending/rejected privacy preserved | TRUE |
| Old drafts normalize safely | TRUE |
| Old AI false no longer disables AI | TRUE |
| Uploaded flyer/media preserved | TRUE |
| Reviewed products preserved | TRUE |
| Review summary shows one package price | TRUE |
| Preview has no obsolete AI surcharge | TRUE |
| Publish mapper uses complete package | TRUE |
| No schema/migration/RLS touched | TRUE |
| No Stripe/payment touched | TRUE |
| No checkout/webhook touched | TRUE |
| No auth touched | TRUE |
| No global layout touched | TRUE |
| No other categories touched | TRUE |
| Cupones remains cart-free | TRUE |
| ES/EN copy updated | TRUE |
| Verifier passed | (run gate) |
| Build passed | (run gate) |
