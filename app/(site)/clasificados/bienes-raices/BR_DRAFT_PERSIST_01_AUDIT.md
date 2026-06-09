# BR-DRAFT-PERSIST-01 — Bienes Raíces Agente Full Draft + Inventory Persistence

Gate: **BR-DRAFT-PERSIST-01** — parent application, child inventory, media, Step 7/8, drawer safety, preview/Volver a editar, publish mapping.

## Repo confirmation

| Field | Value |
|-------|-------|
| Root | `C:/projects/elaguila-website` |
| Branch | `main` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |

## Dirty files (not touched by this gate)

Unrelated working tree: contact/newsletter/lead-capture files only. BR changes isolated to allowed scope.

## Working category patterns inspected

| Category | Draft storage | Media persistence |
|----------|---------------|-------------------|
| **Rentas** | sessionStorage + localStorage quota fallback | Strips `videoLocalDataUrl` in JSON |
| **Servicios** | sessionStorage + **IndexedDB** for heavy `data:` blobs | `clasificadosServiciosDraftMediaIdb.ts` |
| **Autos** | sessionStorage editor keys | Bundle publish session |
| **En Venta/Varios** | Category-specific preview handoff | Reference only |

**BR now follows Servicios IndexedDB pattern + Rentas LS fallback.**

## Current BR persistence bug cause (pre-fix)

1. Parent/child `data:` images lived primarily in in-memory `fullDraftMediaBridge` / `childInventoryMediaBridge` — **lost on hard refresh**.
2. sessionStorage stripped `data:` URLs for quota — refresh restored fields but not local file previews.
3. Child editor session stored stripped propertyForm — in-progress child photos lost on refresh.
4. Child editor baseline was computed from empty boot, not restored session — dirty detection could be wrong.

## Storage keys

| Key | Storage | Purpose |
|-----|---------|---------|
| `br-negocio-agente-residencial-preview-draft` | sessionStorage | Preview + refresh metadata/IDB refs |
| `br-negocio-agente-residencial-return-draft` | sessionStorage | Volver a editar handoff |
| `br-negocio-agente-residencial-draft-ls-fallback` | localStorage | Quota fallback (Rentas pattern) |
| `br-negocio-child-inventory-editor-session` | sessionStorage | In-progress child editor |
| `lx-br-agente-res-draft` | **IndexedDB** | Heavy `data:` blobs (Servicios pattern) |
| `fullDraftMediaBridge` | in-memory | Same-tab navigation |
| `childInventoryMediaBridge` | in-memory | Same-tab child photo merge |

No key renames. No blind clears during edit flow.

## Parent application persistence result

**PASS** — `persistAgenteResApplicationDraftResolved` debounced (800ms) saves full form including Step 7/8, `additionalInventoryProperties`, offloads media to IndexedDB, writes session + return keys.

## Step 7/8 persistence result

**PASS** — Agent/broker/contact/financing/social/CTA fields are part of `AgenteIndividualResidencialFormState` and persist with parent draft. Child flow uses `pickParentHubSlice` — never overwrites parent hub keys.

## Child inventory persistence result

**PASS** — Save copies full `propertyForm` + photo metadata into `additionalInventoryProperties`. Editor session persists step + property slice with IDB media. Restore via `loadChildInventoryEditorSessionResolved` on drawer reopen.

## Drawer dirty-close protection result

**PASS** — Full-screen child flow: Escape + Cancel use `unsavedCloseConfirm`. No backdrop dismiss. In-progress session autosaved every 400ms.

## Media persistence result

**PASS (with documented limits)** — Main + child photos/agent logo/video/tour/brochure `data:` URLs offload to IndexedDB (`BR_AGENTE_IDB_PREFIX` refs in session JSON). Rehydrate on bootstrap/preview via `rehydrateAgenteResDraftMediaFromIdb`.

**Limitation:** IndexedDB unavailable or cleared → https URLs persist; local `data:` may not. Publish path uploads durable URLs — public pages never use `blob:`.

## Preview / Volver a editar hydration result

**PASS** — Preview client uses `loadAgenteResPreviewDraftResolved`. Bootstrap + return draft merge child inventory media bridge + IDB inline. `saveAgenteResPreviewReturnDraft` → full resolved persist.

## Publish mapping result

**PASS (preserved)** — Existing publish queue/mappers unchanged. `leonixPublishRealEstateListingCore` rejects blob URLs for public insert. Child listings inherit parent hub via prefill mappers.

## Storage clear rules

| Event | Clears draft? |
|-------|---------------|
| Step change | No |
| Preview / Volver a editar | No (handoff) |
| Refresh | No (session + IDB) |
| Child save / drawer close | No (parent quiet persist) |
| Outside click / Escape dirty | No (confirm or stay) |
| Successful publish | Yes (`clearAgenteIndividualResidencialPublishTempState` + IDB namespace clear) |
| New visit with no draft keys | IDB namespace cleared on empty bootstrap |

Tab close clears sessionStorage per browser; IndexedDB cleared when no draft keys on next empty bootstrap.

## Files changed

- `previewDraft.ts` — IDB resolved persist, LS fallback, rehydrate exports
- `brAgenteResDraftMedia.ts` / `brAgenteResDraftMediaIdb.ts` — NEW
- `brNegocioChildInventoryEditorSession.ts` — IDB child editor persist/restore
- `BrNegocioChildInventoryFullApplication.tsx` — baseline fix, async session restore
- `AgenteIndividualResidencialApplication.tsx` — IDB rehydrate on bootstrap
- `AgenteIndividualResidencialPreviewClient.tsx` — resolved preview load/publish

## Remaining limitations

- Very large galleries may exceed IndexedDB/browser storage — metadata still persists; user may need to re-add photos in edge cases.
- `blob:` URLs (if any legacy path) are preview-only; not published publicly.
- Unrelated contact/newsletter dirty files remain in working tree — not modified.

## Manual QA checklist

See gate final report section 22.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| --------------------------------------------------------- | ---------- | -------- |
| Repo confirmed | TRUE | elaguila-website |
| Dirty files inspected | TRUE | contact-only unrelated |
| Working category draft patterns inspected | TRUE | Rentas/Servicios/Autos |
| Working category media patterns inspected | TRUE | Servicios IDB |
| Current BR persistence bug cause documented | TRUE | Section above |
| Parent draft saves all property fields | TRUE | full form state persist |
| Parent draft saves Step 7 professional info | TRUE | agente* / marca* fields |
| Parent draft saves Step 8 contact/action data | TRUE | permitir* / cta* fields |
| Parent draft saves media metadata | TRUE | IDB + session refs |
| Parent draft saves additionalInventoryProperties | TRUE | quiet persist |
| Parent draft survives step changes | TRUE | React state + debounced persist |
| Parent draft survives preview | TRUE | preview draft keys |
| Parent draft survives Volver a editar | TRUE | return key + memory bridge |
| Parent draft survives refresh while tab/session active | TRUE | session + IDB rehydrate |
| Parent draft survives child drawer open | TRUE | isolated child session |
| Parent draft survives child drawer close | TRUE | parent quiet persist |
| Parent draft survives child save | TRUE | onItemsChange + persist |
| Step 7/8 data is not wiped by child flow | TRUE | pickParentHubSlice |
| Child in-progress draft is protected from outside click | TRUE | full-screen, no backdrop dismiss |
| Child in-progress draft is protected from Escape key | TRUE | confirmClose |
| Dirty close confirmation exists | TRUE | unsavedCloseConfirm |
| Child data saves into additionalInventoryProperties | TRUE | propertyForm on draft |
| Child media saves into additionalInventoryProperties | TRUE | photoUrls + propertyForm |
| Child saved card restores after preview/back | TRUE | parent state |
| Child saved card restores after refresh if supported | TRUE | IDB + session |
| Child edit restores all fields | TRUE | propertyForm round-trip |
| Save and add another preserves previous child | TRUE | shell handleSave |
| Main images appear in preview | TRUE | resolved load |
| Child images appear on saved child card | TRUE | card model cover |
| Child images appear in full child preview | TRUE | overlay + IDB |
| Parent inventory carousel shows child images | TRUE | preview cards |
| Publish mapping includes parent media | TRUE | existing mapper |
| Publish mapping includes child media | TRUE | queue prefill |
| Child listing inherits parent contact/agent data | TRUE | hub prefill |
| Public media does not use blob URLs | TRUE | publish core guard |
| Public media does not use data URLs unless uploaded first | TRUE | upload at publish |
| Draft is not cleared on route change | TRUE | no clear on navigate |
| Draft is not cleared on preview/back | TRUE | handoff keys |
| Draft is not cleared on refresh | TRUE | session + IDB |
| Draft is not cleared on child drawer close | TRUE | only child session optional clear on save |
| Clear behavior is documented | TRUE | storage clear table |
| BR Privado not polluted | TRUE | no BR privado edits |
| Rentas not polluted | TRUE | read-only reference |
| Autos/Servicios/etc. not modified | TRUE | no edits |
| No schema/migration touched | TRUE | no migration files |
| npm run build passed | TRUE | validation run |

**Final recommendation: GREEN**
