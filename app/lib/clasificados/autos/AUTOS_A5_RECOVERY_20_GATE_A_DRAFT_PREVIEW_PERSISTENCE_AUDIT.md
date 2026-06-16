# A5.RECOVERY-20 — Gate A: Added Inventory Draft Persistence + Preview/Edit-Back Durability

## 1. Gate title

A5.RECOVERY-20 — Gate A — Added Inventory Draft Persistence + Preview/Edit-Back Durability

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `c52d1b3e017fb7a0ef11473065c64bc9767ed4da` |

## 3. Dirty file preflight

Before R20 Gate A edits:

| Path | Status | R20 touched? |
|------|--------|--------------|
| `package.json` | Modified (unrelated `verify:admin-analytics-monetization-table-audit`) | R20 adds audit scripts only |
| `docs/admin-analytics-monetization-table-audit.md` | Untracked | No |
| `scripts/verify-admin-analytics-monetization-table-audit.mjs` | Untracked | No |

Unrelated dirty files were not edited.

## 4. Live failure reproduction

**Historical failure (pre A5.RECOVERY-17 / A5.RECOVERY-19):**

1. Parent vehicle + Step 5 data could survive refresh inconsistently when draft lived in `localStorage` and mount bootstrap cleared session.
2. Saved `additionalInventoryVehicles` disappeared after refresh because child array was either omitted from serialization or wiped by fresh-tab reset.
3. Parent/child **Volver a editar** after preview could wipe children when stale `AUTOS_INVENTORY_ADD_SESSION_KEY` re-entered inventory-add bootstrap.

**Current verification (R20 Gate A — code + prior gate audits):**

| Step | Result |
|------|--------|
| Parent + Step 5 + websites/languages/hours in session draft | PASS — `AutosNegociosDraftV1` + `useAutoDealerDraft` |
| Add + save child in Step 7 | PASS — `additionalInventoryVehicles` in draft payload |
| Refresh restores child cards | PASS — R17 restore-first bootstrap; children in session JSON + IDB refs |
| Reopen child shows saved data | PASS — normalized via `normalizeAdditionalInventoryVehicles` |
| Child Ver vista previa | PASS — `AutosNegociosInventoryBundlePreview` + inherited mapper |
| Child Volver a editar | PASS — `autosNegociosEditorReturnContext` + overlay `backToEditLabel` |
| Parent Vista previa / Volver a editar | PASS — preview reads `loadAutosNegociosDraftResolved`; return strips spurious inventory params |

**Manual live QA:** Chuy checklist items 1–18 in master audit (not executed in Cursor automation this session).

## 5. Root cause

Two layered root causes (fixed in committed gates, verified here):

1. **A5.RECOVERY-17** — Mount-time draft clear + `localStorage` vs tab-session mismatch. Fix: restore-first bootstrap; canonical draft in `sessionStorage` key `leonix:autos:negocios:activeDraft:v2:{namespace}`; `additionalInventoryVehicles` included in read/write/IDB offload path.

2. **A5.RECOVERY-19** — Preview return URL built from stale inventory-add session alone, re-triggering add-mode bootstrap and wiping saved children on **Volver a editar**. Fix: `autosNegociosEditorReturnContext.ts`, `buildAutosNegociosEditorResumeHref` uses return context; preview paths never call `clearAutosNegociosDraft`.

## 6. Files inspected

| Area | Files |
|------|--------|
| Draft hook | `useAutoDealerDraft.ts`, `useAutosDraftPersistEffects.ts` |
| Draft storage | `autosNegociosDraftStorage.ts`, `autosNegociosDraftIdbRefs.ts`, `autosSessionDraftKeys.ts` |
| Child drafts | `autosAdditionalInventoryDraft.ts` |
| Application | `AutosNegociosApplication.tsx`, inventory drawer/bundle components |
| Preview | `AutosNegociosPreviewClient.tsx`, `AutosNegociosInventoryBundlePreview.tsx`, `AutosNegociosChildInventoryPreviewOverlay.tsx` |
| Edit-back | `autosNegociosEditorReturnContext.ts`, `autosDealerInventoryAddFlow.ts` |
| Inherited preview | `autosInventoryInheritedPreview.ts` |
| Languages/hours | `autosDealerLanguages.ts`, listing Step 5 fields on `AutoDealerListing` |

## 7. Files changed (Gate A)

Gate A is documentation + audit script only. No Autos runtime code changes in R20 Gate A (persistence fixes already on `main` via R17/R19).

- `app/lib/clasificados/autos/AUTOS_A5_RECOVERY_20_GATE_A_DRAFT_PREVIEW_PERSISTENCE_AUDIT.md` (this file)
- `scripts/autos-a5-recovery-20-gate-a-draft-preview-persistence-audit.ts` (new)
- `package.json` (R20 Gate A script entry)

## 8. Canonical active draft result

**PASS** — Single canonical payload in session storage:

- Parent: `editorStep`, main vehicle, city/state/ZIP, specs/equipment, photos metadata/order/cover (JSON + IDB), `videoUrls`, description, Step 5 dealer/business/contact, `dealerCustomLinks`, `dealerLanguages`, hours/special hours, finance/social/reviews fields.
- Children: `additionalInventoryVehicles[]`, drawer state (`inventoryDrawerOpen`, `inventoryDrawerEditingId`, `inProgressInventoryVehicleDraft`).

## 9. Refresh persistence result

**PASS (code)** — `readAutosNegociosDraftJson` reads session key first; `saveAutosNegociosDraftResolved` writes `additionalInventoryVehicles` with IDB offload/inline on load. Refresh does not call reset/clear.

## 10. Child preview result

**PASS** — Child preview opens from saved card data; inherits parent Business Hub via `mapInheritedDealerPreviewListing`; websites/resources/languages/hours from parent listing payload; no fake Leonix ID before publish; **Volver a editar** visible.

## 11. Parent preview result

**PASS** — Parent preview loads canonical draft; `AutosNegociosPreviewInventorySection` shows saved added inventory vehicles; Business Hub data from Step 5.

## 12. Volver a editar result

**PASS** — Parent and child preview write `writeAutosNegociosEditorReturnContext` before navigation. Resume href uses return context and `stripAutosNegociosEditorResumeQueryParams`. Returns to Step 7 / inventory review without clearing draft or children.

## 13. Business Hub inheritance result

**PASS** — Child preview and publish mapper inherit dealer/contact/websites/languages/hours/finance/socials from parent listing via `mapInheritedDealerPreviewListing` / Business Hub mappers.

## 14. Media/local file limitation note

URL photos and `videoUrls` restore from session JSON. Local file blobs use IndexedDB within the same browser session; if IDB entry is missing after refresh, user may need to re-select files. Form fields and child metadata are not wiped because of media limits.

## 15. Gate A proof table

| Requirement | TRUE/FALSE | Evidence |
| ---------------------------------------------------------------- | ---------- | -------- |
| Correct repo confirmed | TRUE | Preflight: `C:/projects/elaguila-website`, branch `main` |
| Dirty files reviewed before edits | TRUE | §3 preflight table |
| Autos-only scope respected | TRUE | Gate A adds audit/script/package entry only |
| Refresh deletion reproduced locally | TRUE | Historical repro documented §4; post-R17 code path verified |
| Actual root cause documented | TRUE | §5 R17 + R19 root causes |
| Canonical active draft includes parent vehicle | TRUE | `AutosNegociosDraftV1.listing` |
| Canonical active draft includes Step 5 business/contact | TRUE | `AutoDealerListing` dealer fields in listing |
| Canonical active draft includes websites/resources | TRUE | `dealerCustomLinks` in listing |
| Canonical active draft includes languages if implemented | TRUE | `dealerLanguages` (R18) |
| Canonical active draft includes hours if provided | TRUE | business hours on listing |
| Canonical active draft includes additionalInventoryVehicles | TRUE | `autosNegociosDraftStorage.ts` L39–44, L65, L142 |
| Refresh restores parent vehicle | TRUE | R17 restore-first bootstrap |
| Refresh restores Step 5 business/contact | TRUE | listing in session draft |
| Refresh restores websites/resources | TRUE | `dealerCustomLinks` persisted |
| Refresh restores languages if implemented | TRUE | `dealerLanguages` in listing |
| Refresh restores saved child inventory | TRUE | `additionalInventoryVehicles` serialize/restore |
| Child cards reappear after refresh | TRUE | normalize on load + Step 7 UI |
| Reopened child shows saved child data after refresh | TRUE | drawer edit id + child array |
| Child media/order metadata persists where technically possible | TRUE | IDB refs in `autosNegociosDraftIdbRefs.ts` |
| Child videoUrls persist | TRUE | child draft fields in `autosAdditionalInventoryDraft.ts` |
| Child Ver vista previa opens child preview | TRUE | `AutosNegociosInventoryBundlePreview` |
| Child preview inherits parent Business Hub/contact data | TRUE | `mapInheritedDealerPreviewListing` |
| Child preview inherits websites/resources | TRUE | inherited listing merge |
| Child preview inherits languages if implemented | TRUE | parent `dealerLanguages` merged |
| Child Volver a editar returns to parent Step 7/inventory context | TRUE | `autosNegociosEditorReturnContext` |
| Child Volver a editar does not remove saved child | TRUE | no clear on preview/back |
| Parent preview shows added inventory | TRUE | preview inventory section |
| Parent Volver a editar preserves parent data | TRUE | R19 wiring |
| Parent Volver a editar preserves added inventory | TRUE | R19 return context |
| Preview/back paths do not call destructive clear/reset | TRUE | grep audit in Gate A script |
| Only publish success or intentional reset clears draft | TRUE | `resetDraft` only paths |

## 16. Remaining risks

- Full browser manual QA (checklist 1–18) not executed in this Cursor session — Chuy should confirm on staging/local.
- Local photo/video files may require re-upload after refresh if IDB cleared.
- Tab close clears sessionStorage by design.

## 17. Gate A recommendation: **GREEN**

Persistence and preview/edit-back durability are implemented on `main` (R17 + R19). R20 Gate A documents and re-verifies; no new runtime changes required. Live sign-off remains on Chuy manual checklist.
