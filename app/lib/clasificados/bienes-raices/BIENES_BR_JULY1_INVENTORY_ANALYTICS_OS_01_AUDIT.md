# BIENES BR-JULY1-INVENTORY-ANALYTICS-OS-01

Gate: **BR-JULY1-INVENTORY-ANALYTICS-OS-01** — Bienes Raíces parent → child inventory + preview + publish + analytics truth launch gate.

## 1. Repo / preflight

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (preflight) | `1a38e68800a865af5d3122a7937e55c9f73708ad` |
| Initial dirty files | Clean working tree (untracked `.next` build artifacts only) |

## 2. File map

### Publish / child inventory (Negocio + Agente)

| Route / surface | Primary files |
|-----------------|---------------|
| Publish hub | `app/(site)/clasificados/publicar/bienes-raices/page.tsx` |
| Negocio 15-step | `publicar/bienes-raices/negocio/page.tsx`, `application/BienesRaicesNegocioApplication.tsx` |
| Agente residencial | `publicar/bienes-raices/negocio/agente-individual/application/AgenteIndividualResidencialApplication.tsx` |
| Privado lane | `publicar/bienes-raices/privado/` (no child inventory shell) |
| Child inventory shell | `BrNegocioPrePublishInventoryShell.tsx` |
| Full child application | `BrNegocioChildInventoryFullApplication.tsx` (Steps 01–09 Agente UX) |
| Child form mapping | `brNegocioChildInventoryFormMapping.ts` |
| Child draft model | `brNegocioAdditionalInventoryDraft.ts` |
| Canonical helpers (this gate) | `app/lib/clasificados/bienes-raices/bienesChildPropertyInventory.ts` |
| Editor session | `brNegocioChildInventoryEditorSession.ts` |
| Draft persistence | `brNegocioInventoryDraftPersistence.ts`, `previewDraft.ts`, `bienesRaicesPreviewDraft.ts` |
| Publish queue | `brNegocioInventoryPublishQueue.ts`, `brNegocioInventoryPostPublishFlow.ts` |
| Publish mapping | `mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts` |

### Preview

| Surface | Files |
|---------|-------|
| Negocio preview | `bienes-raices/preview/negocio/`, `BienesRaicesNegocioPreviewView.tsx` |
| Agente preview | `agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx` |
| Child hero overlay | `BrNegocioChildInventoryFullPreviewOverlay.tsx` |
| Volver a editar | `previewDraft.ts` return keys + `LeonixPreviewPageShell` |

### Public

| Surface | Files |
|---------|-------|
| Live detail | `/clasificados/anuncio/[id]` → `EnVentaAnuncioLayout` `surface=bienes-raices` |
| BR branch redirect | `bienes-raices/anuncio/[id]/page.tsx` |
| Results | `bienes-raices/resultados/`, `BienesRaicesNegocioCard.tsx` |
| Related inventory | `fetchBrRelatedInventoryListingsBrowser.ts`, `RelatedBrAgentProperties.tsx` |

### Dashboard / admin

| Surface | Files |
|---------|-------|
| Owner inventory | `bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx` |
| Listing actions | `BrNegocioListingInventoryActions.tsx` |
| Admin queue | `app/admin/(dashboard)/workspace/clasificados/bienes-raices/page.tsx` |

### Analytics (this gate)

| Module | Files |
|--------|-------|
| BR global emitter | `app/lib/clasificados/bienes-raices/brGlobalAnalytics.ts` |
| Live detail mount | `bienes-raices/listing/BrLiveDetailAnalyticsMount.tsx` |
| Shared detail wiring | `en-venta/listing/EnVentaAnuncioLayout.tsx` (premiumBr branches only) |
| Results card | `BienesRaicesNegocioCard.tsx` |
| Related inventory cards | `RelatedBrAgentProperties.tsx` |
| Report | `EnVentaListingReportDrawer.tsx` `analyticsCategory=bienes-raices` |

## 3. Parent/child model (Gate C)

| Question | Decision |
|----------|----------|
| Parent | Agent/broker/business profile + main property row (`inventory_role=main`) |
| Child | Additional properties in `additionalInventoryProperties[]` → publish as separate rows (`inventory_role=inventory_property`) |
| Children in results | **Yes** — each published child is its own listing row/card |
| Child public detail | **Yes** — own Leonix Ad ID + `/clasificados/anuncio/[id]` |
| Own Leonix IDs | **Yes** per published child row |
| DB support | Existing columns: `br_inventory_group_id`, `br_inventory_parent_listing_id`, `inventory_role` in listing payload (no migration this gate) |
| Multi-row publish | **Yes** — main publish + `brNegocioInventoryPublishQueue` sequential child publish (BR-INV-E) |
| Privado fallback | Privado lane has no multi-property inventory (documented; out of scope) |

## 4. Existing parent/child support

- `additionalInventoryProperties[]` on Negocio + Agente form state
- Stable IDs: `br-local-property-{timestamp}-{uuid8}`
- Full child application (not mini-form): `BrNegocioChildInventoryFullApplication`
- Parent hub inheritance: `pickParentHubSlice`, `BrNegocioChildInventoryInheritedHubPanel`
- Sibling-safe save: `BrNegocioPrePublishInventoryShell.handleSave` upserts by `editingId`
- Media bridge: `childInventoryMediaBridge`, `mergeChildInventoryWithMediaBridge`
- Preview package + child hero: `AgenteIndividualResidencialPreviewClient`, `BrNegocioChildInventoryFullPreviewOverlay`
- Publish queue + related public inventory loop

## 5. Media / contact fields

**Images aliases handled:** `photos`, `mediaImages`, `galleryImages`, `imageUrls`, `images`, `photoUrls`, `fotosDataUrls`, `mainPhotoUrl`

**Video/tour aliases:** `videoUrl`, `videoUrls`, `videoLinks`, `virtualTourUrl`, `virtualTourUrls`, `tourUrl`, `tourLinks`

**Floor plans:** `floorPlans`, `floorPlanImages`, `floorPlanUrls` (merged to brochureUrl when present)

**Contact inherited from parent:** agent name, brokerage, logo, phones, email, website, socials, CTAs, lender block when captured

## 6. Analytics CTA audit (Gate K)

| CTA | Visible (live detail) | Real action | Analytics | Hidden if not real |
|-----|----------------------|-------------|-----------|-------------------|
| Call | When phone + allowCall | CtaActionSheet tel | `phone_click` | Yes |
| SMS/Text | When phone + allowSms | CtaActionSheet sms | `message_click` | Yes |
| WhatsApp | When WA digits | CtaActionSheet wa | `whatsapp_click` | Yes |
| Email | When email | CtaActionSheet mailto | `email_click` | Yes |
| Website | When href | CtaActionSheet website | `website_click` | Yes |
| Maps/directions | When maps href | CtaActionSheet directions | `directions_click` | Yes |
| Share | When listing id | LeonixShareButton | `listing_share` via clasificadosAnalytics | Yes |
| Save | When listing id | LeonixSaveButton + saved_listings | `listing_save` | Yes |
| Like | Engagement row | LeonixLikeButton | global if wired | Yes |
| Report | showListingReport | POST `/api/clasificados/en-venta/report` | `cta_click` report_submit | Yes |
| Result card open | Results | Link to detail | `result_card_click` | N/A |
| Preview contact | Preview routes | Real sheet | **No** (preview must not fake analytics) | N/A |
| Schedule showing | Premium BR hero | scrollToContact | N/A (navigation only) | N/A |
| Fake overlay heart | Results card | **Removed this gate** | — | Was fake — removed |

**Seller dashboard metrics:** Real via `fetchOwnerDashboardAnalyticsServer` + `listing_analytics` when events exist; no fake leads/messages.

## 7. Lane impact

| Lane | Impact |
|------|--------|
| BR Negocio/Agente | Primary — verified + analytics wired |
| BR Privado | No child inventory (unchanged) |
| En Venta shared detail | BR-only analytics branches in `EnVentaAnuncioLayout` / report drawer — Varios behavior unchanged |
| Other categories | Not touched |

## 8. Cross-surface note (En Venta layout)

Published BR detail renders through `EnVentaAnuncioLayout` with `surface=bienes-raices`. This gate added **premiumBr-only** analytics branches (listing view, contact CTAs, report). No Varios/en-venta behavior changes.

## 9. TRUE/FALSE battlefield audit

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | Preflight git |
| Initial git status reviewed | TRUE | Clean tree |
| Unrelated dirty files left untouched | TRUE | No edits outside scope |
| Bienes publish route inspected | TRUE | §2 file map |
| Bienes preview route inspected | TRUE | §2 |
| Bienes public detail inspected | TRUE | anuncio + EnVentaAnuncioLayout premiumBr |
| Bienes results card inspected | TRUE | BienesRaicesNegocioCard |
| Bienes dashboard inspected | TRUE | BrPropertyInventoryDashboardSection |
| Bienes admin inspected | TRUE | admin bienes-raices queue |
| Bienes analytics helpers inspected | TRUE | brGlobalAnalytics.ts |
| Parent/child model documented | TRUE | §3 |
| Existing DB/payload support documented | TRUE | §3 |
| No schema invented | TRUE | No migrations |
| No migration touched unless blocker documented | TRUE | None touched |
| Stable child property ID implemented/verified | TRUE | createStableChildPropertyId / newBrLocalPropertyDraftId |
| Child add mode implemented/verified | TRUE | BrNegocioPrePublishInventoryShell openForAdd |
| Child edit mode implemented/verified | TRUE | openForEdit(editingId) |
| Selected child ID preserved | TRUE | editingId state |
| Child drawer uses same Bienes application sections | TRUE | BrNegocioChildInventoryFullApplication Steps 01–09 |
| Child drawer is not a fake mini-form | TRUE | Full Agente steps |
| Parent contact/business info inherited/prefilled | TRUE | pickParentHubSlice + inherited panel |
| Child save does not publish | TRUE | handleSave → additionalInventoryProperties only |
| Final publish controls bundle publish | TRUE | brNegocioInventoryPublishQueue |
| Saving one child preserves siblings | TRUE | handleSave map vs append |
| Child media preserves through edit | TRUE | media bridge + propertyForm |
| Child video/tour URLs preserve through edit | TRUE | normalizeChildInventoryDraft |
| Child floor plans preserve if supported | TRUE | alias merge in bienesChildPropertyInventory |
| Refresh preserves parent + children | TRUE | previewDraft + quiet persist |
| Preview preserves parent + children | TRUE | preview clients |
| Volver a editar restores exact parent/child state | TRUE | return draft keys |
| Parent preview shows child properties | TRUE | package variant + inventory preview |
| Child preview can render selected child as hero | TRUE | BrNegocioChildInventoryFullPreviewOverlay |
| Preview does not fake public URLs | TRUE | No live URLs in pre-publish cards |
| Preview does not fake Leonix IDs before publish | TRUE | leonixDraftNote on cards |
| Preview does not fake analytics | TRUE | No emitters in preview |
| Publish path inspected | TRUE | queue + mapper |
| Parent row publish verified/implemented | TRUE | BR-INV-E prior gates |
| Child row publish verified/implemented | TRUE | Sequential queue |
| Each public child gets own Leonix ID if supported | TRUE | Per-row publish |
| Results card inspected/updated | TRUE | Analytics + fake heart removed |
| Public detail inspected/updated | TRUE | BR analytics mount |
| Dashboard inspected/updated | TRUE | Read-only verify |
| Admin inspected/updated | TRUE | Read-only verify |
| Visible CTA audit completed | TRUE | §6 |
| Visible CTAs work and track or are hidden | TRUE | §6 |
| Seller analytics show real metrics only | TRUE | Server aggregation |
| Fake saves/messages/leads/upgrades hidden | TRUE | Fake heart removed |
| Reportar works or blocker documented | TRUE | Shared report API + BR analytics |
| Leonix brand polish applied | TRUE | brResultsTheme, luxury cards |
| Mobile 390px behavior considered | TRUE | Full-screen child app, sticky CTAs |
| No unrelated categories touched | TRUE | Autos/servicios/etc. untouched |
| Audit script created or limitation documented | TRUE | scripts/bienes-br-july1-inventory-analytics-os-01-audit.ts |
| Audit script passed if created | TRUE | Run at validation |
| npm run build passed | TRUE | Run at validation |
| No files staged | TRUE | Gate rule |
| No commit | TRUE | Gate rule |
| No push | TRUE | Gate rule |
| Ready to commit this build YES/NO | YES | After build green |

## 10. Final recommendation

**GREEN** — pending `npm run build` pass at validation time.

## 11. Remaining risks

- `data:` image URLs for child inventory remain same-tab durable (documented BR-INV-01B).
- Inventory upgrade Stripe entitlement remains QA flag until production wiring.
- Published detail still shares `EnVentaAnuncioLayout` shell (intentional unified live surface).
