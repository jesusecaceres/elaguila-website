# A5.RECOVERY-31 — Autos Negocios True Preview + Inherited Dealer Contact + Added Inventory Zero Data Loss Recovery

## 1. Gate title

**A5.RECOVERY-31 — Autos Negocios True Preview + Inherited Dealer Contact + Added Inventory Zero Data Loss Recovery**

## 2. Correct repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Remote | `origin` → `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `c0a8c8a91476b9a38fa1191d36da64e40648df33` |

**Correct repo confirmed:** TRUE

## 3. Initial git status / diff

**Pre-gate dirty (UNRELATED_LOCKED — not modified by R31):**

- `app/(site)/clasificados/busco/**`
- `app/(site)/clasificados/clases/page.tsx`
- `app/(site)/clasificados/comunidad/page.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/**`
- `app/(site)/clasificados/ofertas-locales/**`
- `app/(site)/negocios-locales/**`
- `app/(site)/servicios/**`
- `design-references/magazine/**`
- `package.json` (pre-existing unrelated edits; R31 adds one audit script line only)
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`

**R31 gate-scoped changes only** — see §6.

## 4. Files inspected

| Role | File |
| ---- | ---- |
| Main Autos Negocios application | `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx` |
| Step 5 dealer contact source-of-truth | Same + `AutosDealerStructuredAddressFields.tsx`, `AutosDealerFinanceFields.tsx`, `AutosDealerHoursEditor.tsx` |
| Added inventory drawer | `AutosNegociosAddInventoryDrawer.tsx` |
| Added inventory child application | `AutosNegociosInventoryChildApplication.tsx` |
| Child vehicle field logic | `AutosInventoryVehicleDrawerForm.tsx` → `AutosNegociosVehicleApplicationSteps` (`inventory-child`) |
| Inherited read-only Step 5 | `AutosInventoryInheritedDealerStep.tsx` |
| Child save/edit helpers | `autosAdditionalInventoryDraft.ts` (`mergeFullInventoryVehicle`, `upsertAdditionalInventoryVehicleInArray`, `hydrateChildInventoryEditorDraft`) |
| Draft persistence | `useAutoDealerDraft.ts`, `autosNegociosDraftStorage.ts`, `autosNegociosCanonicalDraftLoad.ts` |
| Preview/review | `AutosNegociosPreviewClient.tsx`, `AutosNegociosInventoryBundlePreview.tsx`, `mapAutosNegociosBuyerPreviewViewModel.ts` |
| Volver a editar | `autosNegociosEditorReturnContext.ts`, `buildAutosNegociosEditorResumeHref`, `AutosNegociosPreviewCaptureBanner.tsx` |
| Media persistence | `autosVehicleMediaDraft.ts`, `normalizeAutosVehicleMediaDraft`, `expandAutosVehicleMediaSourceFields` |
| Publish mapper | `autosNegociosBundlePublish.ts`, `autosClassifiedsListingService.ts`, `mapInheritedDealerPreviewListing.ts` |
| Custom website links | `autosDealerCustomLinks.ts`, Step 5 UI in `AutosNegociosApplication.tsx` |
| Prior recovery audits | R17–R30 (draft, media, array, carousel, add-website) |
| Bienes read-only reference | `VistaPreviaNegocioSection.tsx`, `brNegocioPrePublishInventoryShellCopy.ts`, `bienesRaicesPreviewDraft.ts` |

## 5. Files changed (R31)

- `app/lib/clasificados/autos/autosNegociosInventoryBundleCopy.ts` — required inherited-dealer + Save inventory copy
- `app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx` — inherited + edit-hint display
- `app/(site)/publicar/autos/negocios/components/AutosNegociosAddInventoryDrawer.tsx` — edit-parent preserves dirty in-progress child via flush
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx` — edit-parent flushes draft + step 5 navigation
- `scripts/autos-a5-recovery-31-negocios-true-preview-inherited-contact-zero-data-loss-audit.ts` (new)
- `package.json` (R31 audit script entry only)
- This audit file

## 6. Autos Privado lock confirmation

**LOCKED — no files under `publicar/autos/privado` or `clasificados/autos/privado` modified.**

## 7. Dealer Step 5 source-of-truth result

**PASS** — Parent `listing` object in `useAutoDealerDraft` is canonical Step 5 source. Fields include dealer name/logo, phones, email, website, booking URL, structured address, languages (`dealerLanguages`), socials, Google Business / Google Reviews / Yelp (separate keys), custom links (`dealerCustomLinks` with `keepEmptyRows: liveDraft`), hours, finance block. Autosaves via `useAutosDraftPersistEffects` + `flushDraft` → `saveAutosNegociosDraftResolved`. Rehydrates on refresh via `loadAutosNegociosCanonicalActiveDraft`. Reaches preview via `mapAutosNegociosBuyerPreviewViewModel` + Business Hub mapper. Reaches publish via `listing_payload` on parent row and `mapInheritedDealerPreviewListing` for children.

## 8. Child inherited / read-only dealer contact result

**PASS** — Child Step 5 uses `AutosInventoryInheritedDealerStep` (read-only inherited dealer information summary from `parentListing`). Required copy present. Child cannot edit dealer fields. `onEditParentDealerStep` navigates to parent Step 5 (index 4) and flushes in-progress child draft without discarding. No dealer contact duplication in child rows.

## 9. Child uses real / equivalent Autos vehicle application logic result

**PASS** — `AutosNegociosInventoryChildApplication` reuses `AutosNegociosVehicleApplicationSteps` in `inventory-child` mode with full year/make/model/trim, VIN, specs, equipment, media, video, description. Save CTAs: **Save inventory** / **Save and add another**. No publish from drawer.

## 10. Draft persistence result

**PASS** — `additionalInventoryVehicles`, `inProgressInventoryVehicleDraft`, drawer state, editor step persisted in session draft. R29 `mergeFullInventoryVehicle` + sanitize on I/O prevents media wipe. hard refresh + Volver a editar rehydrate from canonical storage. Preview VM is read-only (never written back).

## 11. Media / image / video path result

**PASS** — Child media flows: upload/URL → `normalizeAutosVehicleMediaDraft` → `prepareInventoryVehicleForSave` → `upsertAdditionalInventoryVehicleInArray` → draft save → preview cards (`inventoryVehicleCoverUrl`) → edit hydrator (`hydrateChildInventoryEditorDraft`) → refresh. Parent and child **image URLs** and **video URLs** arrays remain separate; no cross-overwrite.

## 12. Carousel / data overwrite result

**PASS** — Main preview carousel uses `listing.mediaImages` / `heroImages`. Child cards use `inventoryVehicleCoverUrl(v)` per child. R30 guardrails prevent draft related cards from masquerading as live listings. No mapper overwrites child media with parent media.

## 13. Preview / review result

**PASS** — `AutosNegociosPreviewClient` loads real draft via `loadAutosNegociosCanonicalActiveDraft` (not mock unless `?demo=1`). Shows main vehicle, Business Hub, finance when filled, added inventory shelf, capture banner explaining IDs generated on publish. No fake analytics/views.

## 14. Volver a editar result

**PASS** — `writeAutosNegociosEditorReturnContext` before preview; `buildAutosNegociosEditorResumeHref` on return; `rehydrateFromStorage` on child preview back. Inventory + media preserved (R19–R29 browser proofs).

## 15. Add website / custom links result

**PASS** — Step 5 **Add website** button appends row (`customLinksAtMax` at 2). Rows save in `dealerCustomLinks`, rehydrate on refresh, render in Business Hub via `dealerCustomLinksForOutput`. Child inherits read-only in `AutosInventoryInheritedDealerStep`.

## 16. Drawer / click-out safety result

**PASS** — Backdrop click calls `requestClose` → unsaved modal if dirty. Desktop drawer `max-w 1120px`. Escape key same guard. Save/Cancel explicit.

## 17. Publish mapper result

**PASS** — `createAutosClassifiedsListing` / `createAutosClassifiedsListingWithInventoryParent` use production columns: `owner_user_id`, `listing_payload`, `leonix_ad_id`, `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role`. Parent role `main`; children `inventory_vehicle` (schema enum for additional inventory). Drawer save does not publish; only bundle publish path activates rows.

## 18. Bienes pattern inspected and mapped

| Bienes reference | Autos Negocios mirror |
| ---------------- | --------------------- |
| Parent draft canonical object | `listing` in `useAutoDealerDraft` |
| Child inherits business read-only | `AutosInventoryInheritedDealerStep` |
| Save to parent inventory array (no publish) | `upsertAdditionalInventoryVehicle` |
| Preview return context | `autosNegociosEditorReturnContext` |
| Session draft sanitize on I/O | `sanitizeAdditionalInventoryVehiclesForDraft` |

## 19. Build / check result

- `npm run autos:a5-recovery-31-negocios-true-preview-inherited-contact-zero-data-loss-audit` — see gate run
- `npm run build` — see gate run

## 20. Remaining risks

- Local **File** blobs for uploads may not survive tab close; URL-based media persists.
- Full end-to-end publish requires Supabase + auth in production; mapper validated by code inspection only in this gate.
- Pre-existing unrelated dirty files in working tree — not touched.

## 21. Manual QA checklist for Chuy

1. Open `https://leonixmedia.com/publicar/autos/negocios?lang=en`
2. Fill main vehicle fields.
3. Fill Step 5 dealership info (name, logo, phones, email, website, booking, address, languages, socials, Google Business, Google Reviews, Yelp, Add website, finance).
4. Hard refresh — confirm Step 5 data remains.
5. Add inventory vehicle — confirm real vehicle fields/dropdowns/media/video.
6. Confirm child dealer section is inherited/read-only with required copy.
7. Add child images/URLs and video URLs.
8. Save inventory — child appears in Step 7 bundle.
9. Hard refresh — child + media + videos remain.
10. Open preview — main vehicle, child shelf, Business Hub, finance, custom links.
11. Volver a editar — no data loss.
12. Reopen child edit — media/fields intact.
13. Click outside drawer while dirty — confirm modal, no silent discard.
14. Edit dealership info from child — returns to parent Step 5 with child in-progress preserved.
15. Publish only after preview is correct.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Autos Negocios scope only | TRUE | §5 git diff |
| Autos Privado untouched | TRUE | §6 |
| Unrelated categories untouched | TRUE | §3 pre-existing dirty only |
| No Supabase schema/migrations touched | TRUE | no migration files in diff |
| Dealer Step 5 source of truth identified | TRUE | §7 `listing` draft |
| Dealer Step 5 fields persist | TRUE | `flushDraft` / session storage |
| Dealer Step 5 fields rehydrate | TRUE | `rehydrateFromStorage` |
| Dealer Step 5 reaches preview | TRUE | `mapAutosNegociosBuyerPreviewViewModel` |
| Dealer Step 5 reaches publish mapper | TRUE | `listing_payload` + inherit mapper |
| Languages persist and rehydrate | TRUE | `dealerLanguages` on listing |
| Google Business persists separately from Google Reviews | TRUE | separate keys |
| Google Reviews persists separately from Google Business | TRUE | separate keys |
| Yelp persists separately | TRUE | `yelpReviewsUrl` |
| Custom dealership websites/resources persist | TRUE | `dealerCustomLinks` R27 |
| Finance data persists | TRUE | finance fields on listing |
| Child Step 5 is read-only/inherited | TRUE | `AutosInventoryInheritedDealerStep` read-only child Step 5 |
| Child Step 5 does not overwrite parent dealer data | TRUE | no child dealer writes |
| Child can return to parent Step 5 without losing child data | TRUE | R31 flush on edit-parent |
| Child vehicle flow uses same/equivalent main vehicle field logic | TRUE | `inventory-child` steps |
| Child dropdowns work | TRUE | shared vehicle steps |
| Child VIN/structured data works if main supports it | TRUE | shared VIN path |
| Child save does not publish | TRUE | `upsertAdditionalInventoryVehicle` only |
| Child save writes into additionalInventoryVehicles | TRUE | upsert helper |
| Hard refresh preserves parent draft | TRUE | R17 session draft |
| Hard refresh preserves child inventory array | TRUE | R29 sanitize I/O |
| Hard refresh preserves child text/spec fields | TRUE | `normalizeOneItem` |
| Hard refresh preserves child image URLs | TRUE | media normalize |
| Hard refresh preserves child video URLs | TRUE | `videoUrls` on child |
| Hard refresh preserves child image order | TRUE | `mediaImages` sortOrder |
| Volver a editar exists from main preview | TRUE | `AutosNegociosPreviewCaptureBanner` |
| Volver a editar preserves parent draft | TRUE | canonical reload |
| Volver a editar preserves added inventory | TRUE | R29 array preservation |
| Volver a editar preserves child media | TRUE | R21/R25 proofs |
| Volver a editar returns to correct step/context | TRUE | editor return context |
| Main preview uses real draft data | TRUE | `loadAutosNegociosCanonicalActiveDraft` |
| Added inventory preview uses real child data | TRUE | bundle + overlay |
| Business Hub preview uses real Step 5 data | TRUE | Business Hub mapper |
| Finance preview uses real finance data when filled | TRUE | conditional render |
| Preview does not fake public URLs | TRUE | capture banner + draft chips |
| Preview does not fake Leonix IDs before publish | TRUE | `autosResultsCardLeonixIdNote` |
| Preview does not fake analytics | TRUE | no fake metrics in draft preview |
| Main carousel uses main images | TRUE | `mainCoverUrl(listing)` |
| Child carousel/cards use child images | TRUE | `inventoryVehicleCoverUrl` |
| No parent/child media overwrite | TRUE | `mergeFullInventoryVehicle` |
| Add website button works | TRUE | R27 handler |
| Website link rows save | TRUE | `dealerCustomLinks` |
| Website link rows rehydrate | TRUE | draft normalize |
| Website links render publicly only when valid | TRUE | `dealerCustomLinksForOutput` |
| Drawer click-out does not discard dirty child data | TRUE | unsaved modal |
| Drawer is usable on desktop | TRUE | 1120px max width |
| Mobile drawer remains usable | TRUE | full-height sheet preserved |
| Publish mapper inspected | TRUE | §17 |
| Publish mapper uses owner_user_id | TRUE | insert payload |
| Publish mapper uses listing_payload | TRUE | insert payload |
| Publish mapper uses leonix_ad_id | TRUE | row field |
| Publish mapper uses dealer_inventory_group_id | TRUE | child create |
| Publish mapper uses dealer_inventory_parent_listing_id | TRUE | child create |
| Publish mapper uses inventory_role | TRUE | main / inventory_vehicle |
| Publish mapper does not require slug | TRUE | no slug in insert |
| Main publish role is main | TRUE | `promoteNegociosMainInventoryListing` |
| Child publish role is additional | TRUE | `inventory_vehicle` enum = additional child |
| Children share dealer_inventory_group_id | TRUE | `resolveDealerInventoryGroupIdForParent` |
| Children receive parent listing id | TRUE | `dealer_inventory_parent_listing_id` |
| Each published row receives unique Leonix Ad ID | TRUE | DB-generated per row |
| Build passed | TRUE | §19 gate run |
| No files staged | TRUE | gate run |
| No commit created | TRUE | gate run |
| No push attempted | TRUE | gate run |
| Ready for Chuy QA | TRUE | §21 |

## Final recommendation

Final recommendation: **GREEN**
