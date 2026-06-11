# A5.FINAL-ACCEPTANCE — Autos Negocios + Privado Live Completion Proof Gate

## Gate title

A5.FINAL-ACCEPTANCE — Autos Negocios + Privado Live Completion Proof Gate

## Repo/source confirmation

| Field | Value |
|-------|-------|
| Root | `C:/projects/elaguila-website` |
| Remote | `origin https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (gate run) | `38d2bd1720c3870abbe1216defb498a114e73457` |
| Autos RECOVERY-10 | Committed on main (child 7-step application architecture) |
| Working tree (gate) | Only gate deliverables + unrelated ofertas-locales WIP (out of Autos scope) |

## Files inspected

Prior audits: `AUTOS_A5_RECOVERY_10_FIELD_PARITY_AUDIT.md`, `AUTOS_A5_SHIP_01_TRUE_PREVIEW_LIVE_PUBLISH_PROOF_AUDIT.md`, `AUTOS_A5_QA_08E_PUBLISH_MAPPER_INVENTORY_GROUP_FIELDS_AUDIT.md`, `AUTOS_A5_QA_08D_SUPABASE_PRODUCTION_VERIFICATION_LIVE_PROOF_AUDIT.md`, `AUTOS_A5_QA_08P_PRIVADO_CROSS_IMPACT_AUDIT.md`, `AUTOS_SHARED_IMPACT_POLICY.md`.

Source: `AutosNegociosApplication`, `AutosNegociosAddInventoryDrawer`, `AutosNegociosInventoryChildApplication`, `AutosInventoryInheritedDealerStep`, `AutosInventoryVehicleDrawerForm`, `AutosNegociosInventoryBundlePreview`, `AutosNegociosChildInventoryPreviewOverlay`, `AutosNegociosMediaManager`, `autosNegociosBundlePublish`, `autosClassifiedsListingService`, `mapAutosClassifiedsToPublic`, `autoDealerDraftDefaults`, `autosDealerCustomLinks`, `AutosDealerHoursEditor`, `AutosPrivadoApplication`.

## Files changed (this gate only)

- `app/lib/clasificados/autos/AUTOS_A5_FINAL_ACCEPTANCE_LIVE_COMPLETION_AUDIT.md` (new)
- `scripts/autos-a5-final-acceptance-live-completion-audit.ts` (new)
- `package.json` (audit script entry only)

## Live source acceptance matrix

| Item | Expected result | Source proof | Manual QA needed | Status | Fix/blocker |
| ---- | --------------- | ------------ | ---------------- | ------ | ----------- |
| **A. Main Negocios Step 1** | Identity fields work | `AutosNegociosApplication` + `AutosVehicleIdentityFields` | Yes | TRUE | — |
| **A. Step 2** | Specs work | Shared spec fields + `useAutosVehicleStructuredSpecFill` | Yes | TRUE | — |
| **A. Step 3** | Highlights/equipment | BADGE/FEATURE + `AutosCustomEquipmentField` | Yes | TRUE | — |
| **A. Step 4** | Media | `AutosNegociosMediaManager` | Yes | TRUE | — |
| **A. Step 5** | Dealer/contact | Finance + links + `AutosDealerHoursEditor` | Yes | TRUE | — |
| **A. Step 6** | Description | textarea on listing | Yes | TRUE | — |
| **A. Step 7** | Review + inventory | `AutosApplicationReviewStep` + bundle preview | Yes | TRUE | — |
| **A. preview/back** | Data preserved | session draft + `flushDraft` | Yes | TRUE | — |
| **A. refresh** | Session draft | `useAutoDealerDraft` + IDB refs | Yes | TRUE | — |
| **A. no parent wipe** | Parent isolated | child patches `additionalInventoryVehicles` only | Yes | TRUE | — |
| **B. opens from CTA** | Drawer opens | `AutosNegociosAddInventoryTrigger` | Yes | TRUE | — |
| **B. desktop modal** | 1120px | `max-w-[min(1120px,...)]` in drawer | Yes | TRUE | — |
| **B. mobile modal** | Full height + picker | drawer + `AutosInventoryChildSteppedShell` | Yes | TRUE | — |
| **B. same step flow** | 7 steps | `AutosNegociosInventoryChildApplication` | Yes | TRUE | — |
| **B. same field logic** | Shared components | `AutosInventoryVehicleDrawerForm` steppedMode | Yes | TRUE | — |
| **B. child Steps 1–4,6–7** | Per-step render | `activeStep` in drawer form | Yes | TRUE | — |
| **B. child Step 5 inherited** | Read-only parent | `AutosInventoryInheritedDealerStep` | Yes | TRUE | — |
| **B. Guardar en inventario** | Save CTA step 7 | `autosAddInventorySaveCta` | Yes | TRUE | — |
| **B. Guardar y agregar otro** | Secondary CTA | `autosAddInventorySaveAndAnotherCta` | Yes | TRUE | — |
| **B. no publish in child** | No Publish | drawer footer + grep | Yes | TRUE | — |
| **C. All child vehicle fields** | Parity | See field table below | Yes | TRUE | — |
| **D. Inherited Step 5 fields** | From parent listing | `AutosInventoryInheritedDealerStep` + `AUTOS_INVENTORY_INHERITED_FIELD_GROUPS` | Yes | TRUE | — |
| **E. Save flow** | Card + no fake IDs | `AutosNegociosInventoryBundlePreview` + copy | Yes | TRUE | — |
| **F. Data loss protection** | Leonix modal | `AutosUnsavedChangesModal` | Yes | TRUE | Remove uses `window.confirm` (owner action, not child close) |
| **G. Image reorder** | reindex on drop | `AutosNegociosMediaManager.commitImages` | Yes | TRUE | Pre-publish blob URLs session-only (SHIP-07) |
| **G. Custom city** | Persists + search | `normalizeCityField` + `buildSearchableBlurb` | Yes | TRUE | — |
| **G. Dealer links/hours** | Labels + max 2 + AM/PM | `autosNegociosCopy` + `AutosDealerHoursEditor` | Yes | TRUE | — |
| **H. Preview proof** | Real draft data | preview clients + inherited merge | Yes | TRUE | — |
| **I. Publish/Supabase** | Main + child rows | `publishNegociosBundleAdditionalVehicles` + `createAutosClassifiedsListingWithInventoryParent` | **Yes (SQL)** | TRUE (code) | Live grouped rows need Chuy SQL (QA-08D) |
| **I. inventory_role additional** | Child role set | DB value `inventory_vehicle` (= additional child) | Yes | TRUE | Naming: not literal `additional` string |
| **J. Results/detail** | Real rows + related | `listActiveDealerInventoryByGroupId` + `mapAutosPublicListingToAutoDealer` | Yes | TRUE | — |
| **K. Privado guardrail** | No dealer features | grep clean on privado publish | Yes | TRUE | — |

## Main Autos Negocios result

**PASS (source)** — 7-step `AutosApplicationSteppedShell`, session draft persistence, dealer Step 5 with labeled links section, AM/PM hours, finance separate.

## Added inventory full application parity result

**PASS (source)** — RECOVERY-10 architecture committed: `AutosNegociosInventoryChildApplication` + stepped shell + inherited Step 5 + save on Step 7 only.

## Field-by-field child inventory proof

| Field | Rendered | Usable | Persisted | Preview/card | Child draft |
| ----- | -------- | ------ | --------- | ------------ | ----------- |
| Year | TRUE | TRUE | TRUE | TRUE | TRUE |
| Make | TRUE | TRUE | TRUE | TRUE | TRUE |
| Model | TRUE | TRUE | TRUE | TRUE | TRUE |
| Trim/version | TRUE | TRUE | TRUE | TRUE | TRUE |
| Manual trim | TRUE | TRUE | TRUE | TRUE | TRUE |
| VIN | TRUE | TRUE | TRUE | TRUE | TRUE |
| VIN decode | TRUE | TRUE | TRUE | TRUE | TRUE |
| Generated title | TRUE | TRUE | TRUE | TRUE | TRUE |
| Custom title | TRUE | TRUE | TRUE | TRUE | TRUE |
| Condition | TRUE | TRUE | TRUE | TRUE | TRUE |
| Price | TRUE | TRUE | TRUE | TRUE | TRUE |
| Monthly payment | TRUE | TRUE | TRUE | TRUE | TRUE |
| Mileage | TRUE | TRUE | TRUE | TRUE | TRUE |
| City | TRUE | TRUE | TRUE | TRUE | TRUE |
| State | TRUE | TRUE | TRUE | TRUE | TRUE |
| ZIP | TRUE | TRUE | TRUE | TRUE | TRUE |
| Stock number | TRUE | TRUE | TRUE | TRUE | TRUE |
| Transmission | TRUE | TRUE | TRUE | TRUE | TRUE |
| Drivetrain | TRUE | TRUE | TRUE | TRUE | TRUE |
| Motor/engine | TRUE | TRUE | TRUE | TRUE | TRUE |
| Fuel | TRUE | TRUE | TRUE | TRUE | TRUE |
| MPG city/highway | TRUE | TRUE | TRUE | TRUE | TRUE |
| Body style | TRUE | TRUE | TRUE | TRUE | TRUE |
| Exterior/interior color | TRUE | TRUE | TRUE | TRUE | TRUE |
| Doors/seats | TRUE | TRUE | TRUE | TRUE | TRUE |
| Title status | TRUE | TRUE | TRUE | TRUE | TRUE |
| Badges | TRUE | TRUE | TRUE | TRUE | TRUE |
| Selected equipment | TRUE | TRUE | TRUE | TRUE | TRUE |
| Custom equipment | TRUE | TRUE | TRUE | TRUE | TRUE |
| Additional details textarea | TRUE | TRUE | TRUE | TRUE | TRUE |
| Local photos | TRUE | TRUE | TRUE | TRUE | TRUE |
| Image URL / batch | TRUE | TRUE | TRUE | TRUE | TRUE |
| Photo reorder | TRUE | TRUE | TRUE | TRUE | TRUE |
| Cover image | TRUE | TRUE | TRUE | TRUE | TRUE |
| Remove image | TRUE | TRUE | TRUE | TRUE | TRUE |
| Video URL | TRUE | TRUE | TRUE | TRUE | TRUE |
| Description | TRUE | TRUE | TRUE | TRUE | TRUE |

Evidence: `AutosInventoryVehicleDrawerForm` (steppedMode) + `autosAdditionalInventoryDraft` + `mapInheritedDealerPreviewListing`.

## Step 5 inherited/prefilled proof

**PASS (source)** — `AutosInventoryInheritedDealerStep` displays read-only: dealer name, phones, email, website, booking URL, address, finance fields, socials, Google/Yelp, custom links (max 2 from parent), hours. Copy: “Esta información se toma de la solicitud principal del concesionario.” Edit action navigates to parent Step 5 without mutating parent from child.

## Save/save-and-add result

**PASS (source)** — `validateInventoryVehicleDraftForSave` → `onSave` → `upsertAdditionalInventoryVehicle`; `persist(true)` resets child with new id; parent listing untouched.

## Data-loss protection result

**PASS (source)** — Dirty close uses `AutosUnsavedChangesModal` (outside click, Escape, Cancel). `onInProgressChange` persists in-progress child. Saved children in `additionalInventoryVehicles` survive close. **Note:** Remove child card still uses `window.confirm` (intentional owner delete confirm, not child-close path).

## Image reorder result

**PASS (source)** — `onReorder` → `commitImages` → `reindex` + `ensureOnePrimary`; persisted via draft flush/IDB. **Blocker:** blob: URLs not cloud-durable pre-publish (SHIP-07 YELLOW).

## NorCal/custom city result

**PASS (source)** — `CityAutocomplete` without `stripInvalidOnBlur`; `normalizeCityField` returns `leadingTrimmed` when not canonical; `buildSearchableBlurb` includes `L.city`.

## Dealer links/hours result

**PASS (source)** — “Contactos y enlaces del concesionario”, “Enlaces útiles del concesionario”, “Añadir enlace del concesionario”, `MAX_CUSTOM_LINKS = 2`, `AutosDealerHoursEditor`, “Añadir horario especial”.

## Preview result

**PASS (source)** — Parent preview shows main + bundle; child overlay merges inherited dealer; no fake Leonix ID/URL before publish; analytics gated on live non-zero metrics.

## Publish/Supabase result

**PASS (code)** — `createAutosClassifiedsListing` writes `owner_user_id`, `lane`, `listing_payload`, `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role`. Main promoted via `promoteNegociosMainInventoryListing`. Children via `createAutosClassifiedsListingWithInventoryParent` + `publishNegociosBundleAdditionalVehicles`. Drawer save does not call publish.

**Manual blocker:** Live production SQL verification (QA-08D checklist) not executed in this agent session — Chuy must run post-publish SQL.

## Results/detail result

**PASS (source)** — `listActiveDealerInventoryByGroupId`, related cards exclude self (`row.id !== current.id`), public pages omit owner CTAs.

## Privado result

**PASS** — No dealer inventory, Boost, finance image, reviews, custom links, or Business Hub in Privado publish path (grep verified).

## What was intentionally not changed

Unrelated categories, Stripe/payment, schema/migrations, ofertas-locales WIP, remove-child `window.confirm`, pre-publish cloud media upload route.

## Remaining risks

1. **Manual live QA** — Browser proof of dropdowns, drag-reorder after refresh, publish + Supabase SQL not run in this session.
2. **Pre-publish media** — Local blob/IDB only until publish (SHIP-07).
3. **Production inventory rows** — Schema exists; grouped Negocios rows may be zero until first live bundle publish (QA-08D).
4. **Legacy audit scripts** — SHIP-06/SHIP-07 scripts still assert pre-RECOVERY-10 drawer patterns if run separately.

## Manual QA checklist

1. Open `/publicar/autos/negocios?lang=es`.
2. Fill main app Steps 1–5.
3. Add photos.
4. Reorder photos.
5. Set cover.
6. Add custom city.
7. Add dealer links.
8. Add special hours.
9. Go to Paso 7.
10. Click Agregar vehículo al inventario.
11. Confirm child opens with same app UX/UI.
12. Confirm desktop modal is large enough.
13. Go through child Steps 1–7.
14. Confirm Step 5 is inherited/prefilled.
15. Click outside with unsaved child data.
16. Confirm Leonix modal appears.
17. Click Seguir editando and confirm data remains.
18. Save child.
19. Confirm child result card appears.
20. Reopen child and confirm data remains.
21. Use Guardar y agregar otro.
22. Confirm first child remains and new child starts.
23. Preview parent ad.
24. Confirm main + added inventory + Business Hub + finance + inventory section appear.
25. Publish with protected QA path.
26. Run Supabase SQL.
27. Confirm main + child rows exist.
28. Confirm inventory_role main / inventory_vehicle.
29. Confirm shared dealer_inventory_group_id.
30. Confirm child parent id points to main id.
31. Open public main detail.
32. Open public child detail.
33. Confirm related inventory works.
34. Open `/publicar/autos/privado?lang=es`.
35. Confirm no dealer-only features appear in Privado.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | git rev-parse |
| Autos-only scope respected | TRUE | gate diff scope |
| Main Autos Negocios 7-step flow wired | TRUE | `AutosNegociosApplication` |
| Added inventory full application parity | TRUE | `AutosNegociosInventoryChildApplication` |
| Child Step 5 inherited from parent | TRUE | `AutosInventoryInheritedDealerStep` |
| Save to inventory not publish | TRUE | drawer Step 7 CTAs |
| Save and add another works in code | TRUE | `persist(true)` |
| Child result card in parent inventory | TRUE | `AutosNegociosInventoryBundlePreview` |
| Leonix unsaved modal on dirty close | TRUE | `AutosUnsavedChangesModal` |
| No window.confirm in child close path | TRUE | drawer grep |
| Image reorder persists in media manager | TRUE | `commitImages`/`reindex` |
| Custom city preserved in draft normalize | TRUE | `normalizeCityField` |
| Custom city in searchable blurb | TRUE | `buildSearchableBlurb` |
| Dealership links section labeled | TRUE | `dealershipContactsHeading` |
| Custom dealership links max 2 | TRUE | `MAX_CUSTOM_LINKS = 2` |
| Hours AM/PM editor wired | TRUE | `AutosDealerHoursEditor` |
| Preview uses real draft data | TRUE | preview clients |
| Publish creates child Supabase rows in code | TRUE | `publishNegociosBundleAdditionalVehicles` |
| Inventory group columns in publish mapper | TRUE | `autosClassifiedsListingService` |
| Drawer save does not publish | TRUE | drawer `onSave` only upserts draft |
| Related inventory excludes self | TRUE | `mapAutosPublicListingToAutoDealer` |
| Privado free of dealer-only features | TRUE | privado grep |
| No global Stripe/payment files modified | TRUE | autos gate diff |
| No schema/migration files modified | TRUE | autos gate diff |
| No unrelated categories modified | TRUE | autos gate diff |
| Field-by-field child inventory proof exists | TRUE | matrix above |
| npm run build passed | TRUE | build exit 0 |

## Final recommendation

Final recommendation: YELLOW — All in-scope Autos Negocios + Privado source acceptance criteria are TRUE with file-level evidence and build passing; **live browser QA and post-publish Supabase SQL proof remain required from Chuy** before production GREEN. Pre-publish local media durability remains a documented non-regression blocker (SHIP-07).
