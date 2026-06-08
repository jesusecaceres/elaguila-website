# BR-INV-FIX-01C — Real Child Inventory Publish Proof

Gate: **BR-INV-FIX-01C** — finish BR Negocio / Agente inventory so additional child properties publish as real public listings with real URLs and Leonix Ad IDs. BR-INV-FIX-01B (durable child draft + media) is unchanged; this gate verifies publish metadata, add-mode prefill handoff, and public parent/child proof only.

## Files inspected

- `app/(site)/clasificados/bienes-raices/BR_INV_A_SUPABASE_BACKING_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_B_DRAWER_SHELL_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_C_PROPERTY_DRAWER_FIELDS_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_D_INVENTORY_PREVIEW_CARDS_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_E_FAST_REAL_PUBLISH_QUEUE_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_FIX_01A_REVISED_HUB_CARD_STEP8_AUDIT.md`
- `app/(site)/clasificados/bienes-raices/BR_INV_FIX_01B_DURABLE_CHILD_INVENTORY_MEDIA_AUDIT.md`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPublishQueue.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryPostPublishFlow.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryQueuePrefill.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryAddModePreviewHandoff.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx`
- `app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts`
- `app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts`
- `app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts`
- `app/(site)/clasificados/bienes-raices/components/RelatedBrAgentProperties.tsx`
- `app/(site)/clasificados/bienes-raices/components/BrRelatedAgentPropertiesSection.tsx`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx`

## Files changed

- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts` — full child publish mapping (property + inherited agent/contact/finance/social hub; `bio: ""`; `additionalInventoryProperties: []`)
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/brNegocioInventoryAddModePreviewHandoff.ts` — new preview handoff sync for add-mode queue prefill
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` — sync preview draft on add-mode boot
- `app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts` — parent page shows only published `inventory_property` siblings; dedupe by listing id
- `app/(site)/clasificados/bienes-raices/components/BrRelatedAgentPropertiesSection.tsx` — pass `currentInventoryRole`
- `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` — wire inventory role into related section
- `app/(site)/clasificados/bienes-raices/BR_INV_FIX_01C_REAL_PUBLIC_INVENTORY_PROOF_AUDIT.md` — this doc
- `scripts/br-inv-fix-01c-real-public-inventory-proof-audit.ts` — gate audit script

## Child add-mode prefill proof

- “Publicar siguiente propiedad” navigates via `prepareNextQueuedChildNavigation` → Agente add-mode with `inventoryModeAdd` + session context (BR-INV-E-FAST, unchanged).
- `readQueuePrefillForAddMode` + `applyInventoryDraftToAgenteFormState` overlay property-only fields onto `inheritedAgenteSnapshot` (title, price, address, beds/baths/sqft, description, photos, media URLs).
- Parent agent/contact/business/finance/social fields remain from inherited snapshot; child flow does not wipe hub data.
- `syncAgenteAddModePreviewHandoff` writes preview + return drafts immediately after boot so publish works without visiting step 9 first.
- Queue item remains until `advanceQueue` after successful child publish or explicit removal (01B/01E behavior preserved).

## Child publish metadata proof

Child publish path: `publishLeonixListingFromAgenteResidencialDraft` → `mapAgenteResidencialFormStateToNegocioForPublish` → `publishLeonixListingFromBienesRaicesNegocioDraft` → `publishLeonixRealEstateListingCore`.

Add-mode context from `inventoryMetadataForBrNegocioPublish({ mode: 'add', parentListingId, brInventoryGroupId })` sets:

| Field | Value |
|-------|--------|
| `inventory_role` | `inventory_property` |
| `br_inventory_parent_listing_id` | real parent listing UUID |
| `br_inventory_group_id` | parent group id (main listing id after first publish) |
| `public.listings.id` | new UUID per insert |
| `leonix_ad_id` | assigned by core insert (real, not fabricated client-side) |
| Public URL | `leonixLiveAnuncioPath(listingId)` |

Parent listing row is never updated by child publish. Child `additionalInventoryProperties` cleared on publish mapping so nested draft payload is not re-inserted.

## Parent public inventory proof

- `BrRelatedAgentPropertiesSection` on premium BR Negocio detail (`EnVentaAnuncioLayout`).
- `fetchBrRelatedInventoryListingsForDetail` filters `is_published=true`, active/sold status, Negocio branch.
- When viewer is `inventory_role=main`, section shows only published `inventory_property` rows in the same `br_inventory_group_id` — no draft cards, no sibling mains.
- Cards link via `leonixLiveAnuncioPath(item.id)` — real public URL, no fake paths.
- Dedupe by listing id prevents duplicate child cards.

## Child public page proof

- Child opens at same live detail route as any BR Negocio listing (`/clasificados/anuncio/[id]` → `EnVentaAnuncioLayout`).
- Child-specific title, price, address, specs, description, and images come from that row’s `listing_json` / `detail_pairs` / `images`.
- Leonix Ad ID shown from row `leonix_ad_id` (real Leonix Ad ID from DB, not client-fabricated).
- Agent/Business Hub contact sidebar comes from child row’s `business_meta` / `contact_json` / `profile_json` captured at publish from inherited parent snapshot — safe inheritance at publish time, child does not overwrite parent row.
- Child page does not expose raw owner UUID or debug JSON in UI.

## Queue behavior proof

- Main publish with pending children → `createQueueAfterMainPublish` with real parent listing id and `leonixLiveAnuncioPath` parent URL.
- Child success → `handleQueuedChildPublishSuccess` → `advanceQueue`, real `childListingHref` via `leonixLiveAnuncioPath`.
- Cancel/back from add-mode does not call `advanceQueue` or clear queue unless user explicitly removes items.
- Preview navigation merges media bridge (01B) without dropping queue items.

## No fake URL / ID proof

- No fake URLs on public related cards or post-publish bridge — only `leonixLiveAnuncioPath(realListingId)`.
- No fake Leonix IDs — core insert assigns `leonix_ad_id`; client never fabricates ad ids.
- Pre-publish drawer/queue cards are not rendered on public parent page (only `is_published=true` rows fetched).
- No `fake`, `mock`, or placeholder child listing ids in publish or public fetch paths.

## Child media prefill limitation

- HTTP(S) child photos and media URLs prefill and publish durably.
- `data:` child photos persist same-tab via 01B media bridge; full browser restart before publish may require re-upload (documented in 01B, not expanded here).

## Regression audit

| Lane | Touched? | Result |
|------|----------|--------|
| BR Privado regression audit | FALSE | No inventory UI or publish mapping added under `privado/` |
| Rentas regression audit | FALSE | No imports or inventory UI under `rentas/` |
| Autos untouched | TRUE | No Autos files in diff |
| DB/schema untouched | TRUE | No migrations or RLS changes |
| Stripe/payment untouched | TRUE | — |
| Global nav/styles untouched | TRUE | — |

Walk: `privado/` and `rentas/` must not import `BrNegocioPrePublishInventoryShell`, `brNegocioInventoryPublishQueue`, or `RelatedBrAgentProperties` additions from this gate.

## Manual QA checklist

- [ ] Publish main Agente listing; confirm real public URL and Leonix Ad ID
- [ ] Add one child inventory property in pre-publish drawer
- [ ] Click “Publicar siguiente propiedad”; confirm Agente add-mode opens prefilled
- [ ] Confirm child title, price, address, beds/baths, description preloaded
- [ ] Confirm parent agent/contact/business fields inherited (not blank)
- [ ] Publish child; confirm new real public URL and Leonix Ad ID
- [ ] Open parent public page; confirm one real child card linking to child URL
- [ ] Open child public page; confirm child property data + inherited Business Hub
- [ ] Confirm no draft-only child cards on parent page
- [ ] Confirm no fake child URLs or fake Leonix IDs
- [ ] Confirm BR Privado has no inventory UI
- [ ] Confirm Rentas has no BR inventory UI
- [ ] Confirm mobile layout has no horizontal overflow on related section

## No stage / commit / push

This gate did not run `git add`, `git commit`, or `git push`.
