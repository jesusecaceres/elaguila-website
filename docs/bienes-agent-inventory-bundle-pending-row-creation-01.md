# Bienes Agent Inventory Bundle Pending Row Creation — Gate 01

## Executive Summary

When an agente parent application includes Inventory Pack children before preview checkout, this gate creates **real pending child listing rows** in `public.listings` immediately after the parent pending publish and **before** Stripe checkout redirect. Children use `inventory_role = inventory_property`, share the parent `br_inventory_group_id`, and reference the parent via `br_inventory_parent_listing_id`. No activation, no Stripe/webhook changes.

## Task Classification

**SCOPED GATED BUILD** — Bienes negocio/agente inventory bundle SQL readiness at publish time.

## Autos Reference Comparison

| Autos (`autosNegociosBundlePublish.ts`) | Bienes (this gate) |
|----------------------------------------|-------------------|
| Promotes main as group owner | Parent core insert patches `br_inventory_group_id = parent id` |
| Loops publishable child drafts | `publishBrAgenteInventoryBundlePendingRows` loops validated child drafts |
| Merges inherited dealer data | `buildChildInventoryEditorState` + `mergeParentHubWithChildProperty` |
| Creates real child rows | `publishLeonixListingFromAgenteResidencialDraft` with `mode: "add"` |
| **Activates** children immediately | Children use `activationMode: "pending_payment"` — **not activated** |

## Bienes Gap (before this gate)

Parent pending row created correctly; children only created later via sequential queue / add-mode after payment or manual “Publish next property.”

## Implementation

### New helper

`app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryBundlePendingPublish.ts`

- Filters publishable children (title, price, city, photos, etc.)
- Max 4 children (`BR_INVENTORY_PACK_MAX_CHILDREN`)
- Dedupe: session proof by draft id + existing DB rows by normalized title under same parent
- Calls `publishLeonixListingFromAgenteResidencialDraft` per child with:
  - `inventory: { mode: "add", parentListingId, brInventoryGroupId }`
  - `activationMode: "pending_payment"`
- Returns created child ids / leonix_ad_ids / warnings

### Preview wiring

`AgenteIndividualResidencialPreviewClient.tsx` — on `pendingPayment && needsPayment` and `additionalInventoryProperties.length > 0`:

1. Parent already published as pending/main
2. Run bundle helper
3. Store warnings in `lx_br_publish_warnings` session
4. Proceed to existing `startRevenueCategoryCheckout` redirect

**Not called** in inventory add-mode (`inventoryCtx.mode === "add"`).

### Queue fallback

Pending-payment path returns before `handleMainPublishWithOptionalQueue` — no duplicate queue + bundle. Sequential queue remains for immediate (non-payment) publish and manual post-publish add-mode.

## Parent Row Behavior

Unchanged — `publishLeonixListingFromAgenteResidencialDraft` with `mode: "main"`, `activationMode: "pending_payment"`:

- `inventory_role = main`
- `br_inventory_group_id = parent listing id` (post-insert patch)
- `br_inventory_parent_listing_id = null`
- `status = pending`, `is_published = false`

## Child Pending Row Behavior

Per child via add-mode inventory metadata:

- `inventory_role = inventory_property`
- `br_inventory_group_id = parent group id`
- `br_inventory_parent_listing_id = parent listing id`
- `status = pending`, `is_published = false`
- Own `id` and `leonix_ad_id` from DB/core insert
- Child-specific property fields from draft; parent hub/contact inherited

## SQL Proof Query

```sql
select
  id,
  leonix_ad_id,
  title,
  category,
  seller_type,
  status,
  is_published,
  br_inventory_group_id,
  br_inventory_parent_listing_id,
  inventory_role,
  created_at,
  published_at
from public.listings
where category = 'bienes-raices'
  and (
    id = '<PARENT_ID>'
    or br_inventory_group_id = '<PARENT_ID>'
    or br_inventory_parent_listing_id = '<PARENT_ID>'
  )
order by created_at asc;
```

### Expected

| Row | inventory_role | br_inventory_group_id | br_inventory_parent_listing_id | status | is_published |
|-----|----------------|----------------------|-------------------------------|--------|--------------|
| Parent | main | parent id | null | pending | false |
| Each child | inventory_property | parent id | parent id | pending | false |

## Retry / Duplicate Risk

- `publishBusy` held through bundle + checkout redirect
- Session proof `lx-br-bundle-pending-publish-v1` maps draft id → listing id
- DB title dedupe under same parent
- **Remaining risk:** distinct drafts with identical titles may skip second; retry after partial failure may need manual QA

## Stripe / Webhook / Schema

Not touched.

## Manual QA Checklist

- [ ] Create agente parent + accept Inventory Pack + add 1 child
- [ ] Preview → publish/continue to payment
- [ ] Before Stripe completion, run SQL proof query
- [ ] Confirm parent main + 1 child pending rows
- [ ] Add up to 4 children; confirm row count
- [ ] Retry publish click; confirm no duplicate children
- [ ] Manual add-mode after paid parent still works (separate flow)
- [ ] Stripe activation remains separate

## Remaining Risks

- Partial child failure shows warning but checkout may still proceed
- Title-based dedupe is not as strong as draft-id in `listing_json` (deferred)
- Generic negocio preview lane not wired in this gate (agente-individual only)
