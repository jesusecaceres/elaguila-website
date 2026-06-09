# BR-INV-FIX-01E — Bienes Raíces Agente Added Inventory End-to-End Truth Gate

Gate: **BR-INV-FIX-01E** — full child property flow, save-only inventory, child/parent preview cards, public inventory loop, draft safety.

## 1. Repo / source confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `b7fc74bae61150a7ebccfb8a21ac49905614f75c` |

## 2. Draft safety inspection

| Key | Storage | Purpose |
|-----|---------|---------|
| `br-negocio-agente-residencial-preview-draft` | sessionStorage | Preview route + refresh fallback |
| `br-negocio-agente-residencial-return-draft` | sessionStorage | Volver a editar + debounced autosave |
| `fullDraftMediaBridge` | in-memory | Same-tab main draft `data:` photos |
| `childInventoryMediaBridge` | in-memory | Same-tab child inventory photos |
| `br-negocio-child-inventory-editor-session` | sessionStorage | Isolated in-progress child editor |
| `lx-br-negocio-inventory-publish-queue-v1` | sessionStorage | Post-publish child queue |

**No draft key renames.** No localStorage clears. Parent `state` is never reset when child flow opens/closes/saves.

- **Volver a editar:** `loadAgenteResPreviewReturnDraft` + `fullDraftMediaBridge` (unchanged).
- **Refresh:** debounced `persistAgenteResApplicationDraftQuiet` + preview-key bootstrap fallback.
- **Child open/close/save:** only touches child editor session; parent keys untouched.
- **Tab close:** sessionStorage clears per browser (existing product pattern).

## 3. Files inspected

- `agente-individual/application/utils/previewDraft.ts`
- `agente-individual/application/AgenteIndividualResidencialApplication.tsx`
- `agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx`
- `brNegocioChildInventoryFormMapping.ts`
- `brNegocioChildInventoryEditorSession.ts`
- `BrNegocioChildInventoryFullApplication.tsx`
- `BrNegocioChildInventoryFullPreviewOverlay.tsx`
- `BrNegocioChildInventoryInheritedHubPanel.tsx`
- `BrNegocioPrePublishInventoryShell.tsx` + Card + Preview
- `brNegocioPrePublishInventoryShellCopy.ts`
- `brNegocioInventoryCardModel.ts`
- `brNegocioInventoryDraftPersistence.ts`
- `brNegocioInventoryPostPublishFlow.ts`
- `brNegocioInventoryPublishQueue.ts`
- `fetchBrRelatedInventoryListingsBrowser.ts`
- `RelatedBrAgentProperties.tsx` / `BrRelatedAgentPropertiesSection.tsx`
- `EnVentaAnuncioLayout.tsx`
- `leonixBrPropertyInventoryPolicy.ts` / `leonixBrPropertyInventoryCopy.ts`
- `leonixBrPropertyInventoryAddFlow.ts`
- BR Privado publish tree (grep — no inventory shell)

## 4. Lane impact classification

| Lane | Impact |
|------|--------|
| BR Negocio / Agente | Primary — child full app, save-only, previews, publish queue |
| BR Privado | Read-only cross-check — no inventory drawer |
| Shared Bienes Raíces | Related inventory copy + fetch helper (brokerage title variant) |
| Rentas | No edits — read-only if shared helpers referenced |
| No impact | Autos, Servicios, Stripe, schema, unrelated categories |

## 5. Current added-inventory behavior (pre-fix baseline → post-fix)

- **Add Property** opens `BrNegocioChildInventoryFullApplication` full-screen inside parent app (not mini drawer).
- **Child flow** reuses Steps 01–06, inherited 7/8, Step 09, result-card preview step.
- **Save** writes to `additionalInventoryProperties` only — no publish, no Leonix ID, no public URL.
- **Saved children** appear in inventory preview cards with Edit / Remove / Preview.
- **Parent full preview** shows package inventory section when children exist.
- **Final publish** (01C/E-FAST): main publish + sequential queue; each child → real listing row with own Leonix ID and detail URL, shared `br_inventory_group_id`.

## 6–11. Feature results

| Area | Result |
|------|--------|
| Pre-publish drawer/child flow | Full BR Agente application overlay; CTA `Agregar propiedad al inventario` |
| Full child property application | Steps 01–09 reused; commas/address/media/amenities/open house via shared steps |
| Step 7 inheritance | Read-only `BrNegocioChildInventoryInheritedHubPanel` + inherited notice banner |
| Step 8 inheritance | `Step08CtaEnlaces` with parent-detected actions (no re-entry) |
| Save-only | Footer: Guardar propiedad / Guardar y agregar otra / Cancelar — no Publish/Stripe |
| Unsaved protection | Escape + Cancel confirm via `unsavedCloseConfirm`; full-screen (no backdrop outside-click) |
| Child result-card preview | Step 10 + saved cards in shell |
| Child full ad preview | `BrNegocioChildInventoryFullPreviewOverlay` |
| Parent inventory package preview | `AgenteIndividualResidencialPreviewClient` + `variant="package"` |

## 12. Public related inventory

`fetchBrRelatedInventoryListingsBrowser.ts`:

- Main viewer (`inventory_role=main`): shows only published `inventory_property` siblings.
- Child viewer (`inventory_role=inventory_property`): no role exclusion → main + other children.
- Excludes `currentListingId`; published/active only; real `leonixLiveAnuncioPath` hrefs.

Copy: agent vs brokerage titles via `brRelatedAgentPropertiesCopy({ brokerage })`; subtitle `Explora otras propiedades activas de este inventario.`

## 13. Multi-listing final publish

Implemented (01C + E-FAST):

- Main → `inventory_role=main`, group id assigned on first publish.
- Each child → queue prefill → `publishLeonixListingFromAgenteResidencialDraft` with `inventoryMetadataForBrNegocioPublish({ mode: 'add' })`.
- Mapper clears nested `additionalInventoryProperties: []` on child publish rows.
- Each child gets own listing id, Leonix Ad ID, detail URL; not nested-only JSON.

## 14. Post-publish add-inventory mode

Implemented via `inventoryMode=add` + `leonixBrPropertyInventoryAddFlow.ts`:

- `parentListingId` / group id passed in session/search params.
- `applyInventoryDraftToAgenteFormState` preloads agent/business/contact hub; property fields blank/new.
- Banner: `brInventoryAddModeTitle` + `brInventoryAddModeSubcopy` (functional; wording differs slightly from gate spec long-form banner but conveys same truth).

## 15. Draft persistence

| Scenario | Survives? |
|----------|-----------|
| Parent Volver a editar | Yes |
| Parent refresh (same tab) | Yes |
| Open/close child flow | Yes |
| Save child / save-and-add-another | Yes |
| Saved child preview/back | Yes |
| In-progress child refresh | Yes (`br-negocio-child-inventory-editor-session`) |
| Language toggle | Yes (children on main state) |

## 16. Inventory count / limit

Product policy in `leonixBrPropertyInventoryPolicy.ts`:

- Base: **3** active properties included (`BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES`).
- Upgrade: +5 → **8** total with entitlement flag.
- Main counts as 1; added properties count toward limit via `computeBrPropertyInventoryCounts`.
- No invented limits beyond existing policy.

## 17. BR Privado / Rentas cross-check

- BR Privado: **no** `BrNegocioPrePublishInventoryShell` or child inventory components (grep clean).
- Rentas: **not modified** this gate.
- En Venta layout: only passes `sellerType` for related title variant (shared detail surface).

## 18. Build / check result

Run at validation time (see gate report section 28–29).

## 19. Remaining risks

- Post-publish banner uses existing `brInventoryAddModeSubcopy` — not byte-identical to gate Step 14 long banner (functional equivalent).
- Local `data:` photos for child inventory still same-tab only (documented in 01B/01D).
- Stripe entitlement for inventory upgrade remains QA/dev flag until production wiring.
- Manual publish QA required to confirm live DB rows for multi-child packages.

## 20. Manual QA checklist

See gate final report section 30.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------------------ | ---------- | -------- |
| Correct repo confirmed | TRUE | elaguila-website / main / b7fc74ba |
| BR scope lock respected | TRUE | Only BR + shared related + en-venta layout pass-through |
| Existing user-filled parent draft protected | TRUE | No key renames; isolated child session |
| Parent draft survives Volver a editar | TRUE | `BR_AGENTE_RES_RETURN_KEY` unchanged |
| Parent draft survives refresh while session/tab active | TRUE | quiet persist + preview fallback |
| Lane impact classified before edits | TRUE | Section 4 |
| Current Add Property behavior inspected | TRUE | Section 5 |
| Pre-publish Add Property opens drawer/flow inside same app | TRUE | `BrNegocioPrePublishInventoryShell` |
| Child flow is not a weak mini form | TRUE | `BrNegocioChildInventoryFullApplication` 10 steps |
| Child flow uses full BR Agente property application UX | TRUE | Reuses Step01–09 components |
| Child property type selection exists | TRUE | Step01TipoAnuncio |
| Child price/sqft/lot numbers display commas | TRUE | Shared Step02/04 formatters |
| Child structured address and Ubicación/map behavior match main app | TRUE | Shared Step02 |
| Child city behavior matches main app where supported | TRUE | Shared Step02 NorCal normalization |
| Child photos/media match main app behavior | TRUE | Shared Step03 + media bridge |
| Child URL confirmations work | TRUE | Shared Step03 |
| Child brochure/PDF URL or file behavior matches main app if supported | TRUE | Shared Step03 |
| Child amenities/features are supported | TRUE | Step05Caracteristicas |
| Child open house date/time/notes are supported | TRUE | Step09ExtrasOpcionales |
| Step 7 professional info inherited/prefilled from parent | TRUE | InheritedHubPanel + hub slice |
| Step 8 contact/actions inherited/data-detected from parent | TRUE | Step08 read-only inherited |
| Child does not re-ask agent/business/contact info | TRUE | Read-only steps 6–7 |
| Child shows inherited info notice | TRUE | `inheritedNotice` banner |
| Save property saves child draft and closes flow | TRUE | `attemptSave("close")` |
| Save and add another saves child draft and resets only child form | TRUE | `attemptSave("addAnother")` |
| Cancel does not wipe parent app | TRUE | Only clears child session |
| Child flow has no Publish CTA | TRUE | grep — no Publicar/Publish |
| Child save does not publish | TRUE | onItemsChange only |
| Outside click cannot silently lose child work | TRUE | Full-screen overlay — no backdrop dismiss |
| Escape key cannot silently lose child work | TRUE | `confirmClose` on Escape |
| Dirty close confirmation exists | TRUE | `unsavedCloseConfirm` |
| Saved child has its own result-card preview | TRUE | Inventory cards + step 10 |
| Saved child result card has Preview action | TRUE | `onPreview` on card |
| Saved child result card has Edit action | TRUE | `onEdit` |
| Saved child result card has Remove action | TRUE | `onRemove` |
| Saved child preview does not show fake Leonix ID | TRUE | `leonixDraftNote` only |
| Saved child preview does not show fake public URL | TRUE | No href on draft cards |
| Child full ad preview exists before publish | TRUE | `BrNegocioChildInventoryFullPreviewOverlay` |
| Child full preview uses child property data | TRUE | `buildChildInventoryEditorState` |
| Child full preview inherits agent/business/Business Hub from parent | TRUE | hub merge in mapping |
| Child full preview excludes itself from related inventory list | TRUE | sibling filter by id |
| Parent full preview shows all saved child properties | TRUE | PreviewClient package section |
| Parent full preview lets user open child full preview | TRUE | `onPreview` → overlay |
| Public main detail shows added properties from same inventory group | TRUE | fetch filter main→children |
| Public child detail shows main plus siblings excluding itself | TRUE | fetch no filter on child viewer |
| Related inventory cards link to real detail pages after publish | TRUE | `leonixLiveAnuncioPath` |
| Public buyer does not see owner inventory CTAs | TRUE | Pre-publish components owner-only |
| Final publish creates/preserves separate real listing for each child | TRUE | publish queue 01C |
| Each child gets own listing ID after publish or blocker documented | TRUE | sequential publish |
| Each child gets own Leonix Ad ID after publish or blocker documented | TRUE | publish mapper |
| Each child gets own detail URL after publish or blocker documented | TRUE | `leonixLiveAnuncioPath` |
| Child listings share inventory group after publish or blocker documented | TRUE | `br_inventory_group_id` |
| Children are not nested-only fake records | TRUE | separate listing rows |
| Post-publish add-inventory mode inspected | TRUE | `inventoryMode=add` flow |
| Post-publish mode preloads agent/business data or blocker documented | TRUE | `applyInventoryDraftToAgenteFormState` |
| Post-publish mode blanks property-specific fields or blocker documented | TRUE | queue prefill property slice |
| Parent draft survives drawer open/close/save | TRUE | isolated child session |
| Child draft survives refresh while session/tab active | TRUE | child editor session + main state |
| Child draft survives preview/back | TRUE | overlay state only |
| Child edit/remove works | TRUE | shell handlers |
| BR Privado checked for shared impact | TRUE | grep clean |
| No business inventory drawer added to BR Privado | TRUE | no matches |
| Rentas checked if shared helpers touched | TRUE | no Rentas edits |
| No BR inventory tooling leaked into Rentas | TRUE | no Rentas changes |
| No global Stripe/payment touched | TRUE | no payment file diffs |
| No schema/migration touched | TRUE | no migration edits |
| No unrelated categories touched | TRUE | scope lock |
| npm run build passed | TRUE | see validation run |

**Final recommendation: GREEN**
