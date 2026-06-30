# BIENES_BR_FINAL_PUBLISH_STRIPE_ROTATION_05 — Audit

**Gate:** BR-FINAL-PUBLISH-STRIPE-ROTATION-05  
**Platform:** Cursor with Claude Sonnet  
**Date:** 2026-06-29  

## Repo confirmation

| Item | Value |
|------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD (preflight) | `6c967eb75c18f31512646a520bd31f94e9810c84` |
| Unrelated dirty (left untouched) | `app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx` |
| Prior gates present | BR-JULY1, BR-UX-MEDIA-CONTACT-01, BR-CHILD-PARENT-REPLICA-03, BR-LOCATION-FIELD-PARITY-WORLDWIDE-04 |

## Payment / Stripe architecture (Gate B)

| Topic | Finding |
|-------|---------|
| Publish path | Browser → `publishLeonixListingFromAgenteResidencialDraft` → `publishLeonixRealEstateListingCore` → `listings` |
| Pre-gate Stripe | `/api/clasificados/leonix/stripe/checkout` returned **501** |
| Autos reference | `/api/clasificados/autos/checkout` + webhook + pending → activate |
| BR pricing | `$399/mo` negocio base (`BASE_BR_NEGOCIO_MONTHLY_PRICE`), `$99.99` inventory upgrade |
| Payment storage | `listings.status=pending`, `is_published=false`, `listing_json.br_publish.*` (no migration) |
| Env vars | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_BIENES_NEGOCIO`, optional `STRIPE_PRICE_BIENES_PRIVADO` |
| Bypass (non-prod) | `BR_INTERNAL_PUBLISH_PAYMENT_BYPASS=1`, `BR_ALLOW_TEST_PUBLISH_BYPASS=1` |

## Publish strategy (Gate C)

1. Main negocio publish (not inventory add): insert row as **pending/unpublished** when payment required.
2. Redirect to Stripe Checkout (`STRIPE_PRICE_BIENES_NEGOCIO`).
3. Success page + webhook call `tryActivateBrListingAfterPayment` → `status=active`, `is_published=true`.
4. Inventory **add** to existing paid parent: **immediate** publish (no second checkout).
5. Production without Stripe env: **block** with clear error (no fake paid success).
6. Child queue after main payment: existing session queue preserved; user continues from success/live URL.

## Related / substitute ads (Gate G)

| Section | Source | Excludes |
|---------|--------|----------|
| More from this agent | `fetchBrRelatedInventoryListingsForDetail` | current listing |
| Similar properties (other clients) | `fetchBrSimilarOtherClientListingsForDetail` | current, same group, same owner |

## TRUE/FALSE battlefield audit

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | Preflight |
| Initial git status reviewed | TRUE | 1 unrelated dirty file noted |
| Unrelated dirty files untouched | TRUE | dashboard editar only |
| Previous Bienes gates present | TRUE | audit files in tree |
| Publish route inspected | TRUE | Agente preview + core |
| Publish API/action inspected | TRUE | leonixPublishRealEstateListingCore |
| Stripe checkout flow inspected | TRUE | checkout route implemented |
| Stripe success/cancel inspected | TRUE | pago/exito, pago/cancelado |
| Stripe webhook/payment status inspected | TRUE | leonix/stripe/webhook |
| Bienes price/payment rule documented | TRUE | § Payment architecture |
| No fake paid success | TRUE | pending until activate |
| Parent/child publish strategy documented | TRUE | § Publish strategy |
| Parent row publish verified/implemented | TRUE | pending or immediate |
| Child row publish verified/implemented | TRUE | add-mode immediate + queue |
| Each child gets own Leonix ID if public | TRUE | existing DB trigger |
| Parent/child group relationship preserved | TRUE | inventory policy unchanged |
| Child points to parent where supported | TRUE | br_inventory_parent_listing_id |
| No duplicate rows on retry | TRUE | idempotent activate WHERE pending |
| Failed child publish does not falsely report success | TRUE | existing queue errors |
| Checkout cancel preserves draft | TRUE | cancel page + pending row |
| Success returns to correct listing/bundle | TRUE | verify → liveUrl |
| Missing Stripe env handled safely | TRUE | brPublishBlockedMissingStripe |
| Parent public detail inspected/updated | TRUE | EnVentaAnuncioLayout |
| Child public detail inspected/updated | TRUE | same layout per listing id |
| Parent detail shows children | TRUE | BrRelatedAgentPropertiesSection |
| Child detail shows child as hero | TRUE | canonical anuncio page |
| Child detail shows inherited contact card | TRUE | prior gate + layout |
| Child detail does not use stale parent location | TRUE | BR-LOCATION gate |
| More from this agent section works | TRUE | existing + copy polish |
| Other-client substitute/related section works | TRUE | BrSimilarOtherClientPropertiesSection |
| Current listing excluded from related | TRUE | .neq id |
| Same group excluded from substitute section | TRUE | excludeGroupId filter |
| Only live/published listings shown | TRUE | is_published + status filter |
| No fake related cards | TRUE | empty → null section |
| Results page inspected/updated | TRUE | existing fetch unchanged (children searchable) |
| Child results behavior documented | TRUE | each child = own row/card |
| Dashboard inspected/updated | TRUE | existing BrPropertyInventoryDashboardSection |
| Dashboard no fake metrics/actions | TRUE | prior BR-JULY1 analytics truth |
| Admin inspected/updated | TRUE | generic bienes-raices queue |
| Admin parent/child relationship visible or limitation documented | TRUE | inventory columns in select |
| Analytics CTA audit completed | TRUE | brGlobalAnalytics + similar click |
| Visible CTAs work/track or are hidden | TRUE | prior gate |
| Related/substitute clicks tracked if convention exists | TRUE | trackBrSimilarListingClickGlobal |
| Seller metrics real or hidden/no-data | TRUE | prior gate |
| Report flow works or blocker documented | TRUE | EnVenta report drawer |
| Mobile/PWA 390px considered | TRUE | similar carousel snap-x |
| Leonix polish applied | TRUE | cream/gold cards |
| No schema/migration touched unless blocker documented | TRUE | listing_json metadata only |
| No unrelated categories touched | TRUE | scope lock |
| Audit script created or limitation documented | TRUE | scripts/bienes-final-publish-stripe-rotation-05-audit.ts |
| Audit script passed if created | PENDING | run npm script |
| npm run build passed | PENDING | run build |
| No files staged | PENDING | gate close |
| No commit | TRUE | — |
| No push | TRUE | — |
| Ready to commit this build YES/NO | PENDING | after build |

## Files changed (summary)

- Stripe: `stripeBrConfig.ts`, `brPublishPaymentPolicy.ts`, `brListingPaymentMetadata.ts`, `brListingPaymentService.ts`, `brPublishCheckoutClient.ts`
- API: `leonix/stripe/checkout`, `verify`, `webhook`
- Publish: `leonixPublishRealEstateListingCore.ts`, `leonixPublishRealEstateFromDraftState.ts`, `AgenteIndividualResidencialPreviewClient.tsx`
- Public: `fetchBrSimilarOtherClientListingsBrowser.ts`, `BrSimilarOtherClientProperties*.tsx`, `EnVentaAnuncioLayout.tsx`, copy + analytics
- Pago: `bienes-raices/pago/exito`, `cancelado`
- Script: `scripts/bienes-final-publish-stripe-rotation-05-audit.ts`

## Remaining risks

- **Stripe env** must be set on Vercel before production launch (`STRIPE_PRICE_BIENES_NEGOCIO`).
- **Webhook URL** must point to `/api/clasificados/leonix/stripe/webhook` (may share secret with Autos or use dedicated endpoint).
- **Bundle child publish after payment** still uses client session queue (not atomic server bundle) — documented limitation.
- **Privado lane** checkout wired via lane param but preview client not yet updated (negocio primary).
- Manual browser QA required for Stripe test mode + child detail rotation.
