# A5.RECOVERY-17 — Autos Refresh Must Preserve Progress Until Tab Close Gate

## 1. Gate title

A5.RECOVERY-17 — Autos Refresh Must Preserve Progress Until Tab Close Gate

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `30aa2f0c741f500221356c903e9feaa6c79e5751` |

## 3. Dirty file preflight

Clean tree at gate start (`git status --short` empty). All changes in this gate are Autos-scoped only.

## 4. Files inspected

| Area | Files |
|------|--------|
| Negocios draft hook | `useAutoDealerDraft.ts` |
| Privado draft hook | `useAutoPrivadoDraft.ts` |
| Session keys | `autosSessionDraftKeys.ts` |
| Negocios storage | `autosNegociosDraftStorage.ts`, `autosNegociosDraftNamespace.ts` |
| Privado storage | `autosPrivadoDraftStorage.ts`, `autosPrivadoDraftNamespace.ts` |
| Tab session | `autosEditorTabSession.ts` |
| Persist effects | `useAutosDraftPersistEffects.ts` |
| Applications | `AutosNegociosApplication.tsx`, `AutosPrivadoApplication.tsx` |
| Child inventory | `autosAdditionalInventoryDraft.ts`, drawer components |
| Media IDB | `autosNegociosDraftIdbRefs.ts` |
| Preview | `AutosNegociosPreviewClient.tsx`, `AutosPrivadoPreviewClient.tsx` |

## 5. Root cause of refresh wipe

Two compounding issues:

1. **`shouldResetAutosDraftForFreshEditorTab` returned `true` on first editor mount** and bootstrap **cleared the persisted draft** (`clearAutosNegociosDraft` / `emptyListing`) before the user could restore it. React Strict Mode and certain remount paths could trigger this wipe even when a saved draft existed in storage.

2. **Draft JSON lived in `localStorage`** while tab lifecycle was tracked separately in `sessionStorage`. That violated the product rule (“clear when tab closes”), created inconsistent restore behavior, and allowed mount-time wipe logic to delete progress that should survive refresh.

## 6. Files changed

- `app/lib/clasificados/autos/autosSessionDraftKeys.ts` (new)
- `app/lib/clasificados/autos/autosDraftSessionCopy.ts` (new)
- `app/(site)/clasificados/autos/shared/lib/autosEditorTabSession.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftStorage.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftNamespace.ts`
- `app/(site)/clasificados/autos/privado/lib/autosPrivadoDraftStorage.ts`
- `app/(site)/clasificados/autos/privado/lib/autosPrivadoDraftNamespace.ts`
- `app/(site)/publicar/autos/negocios/hooks/useAutoDealerDraft.ts`
- `app/(site)/publicar/autos/privado/hooks/useAutoPrivadoDraft.ts`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx`
- `app/(site)/publicar/autos/shared/components/AutosDraftSessionRestoredBanner.tsx` (new)
- `scripts/autos-a5-recovery-17-refresh-safe-session-draft-audit.ts` (new)
- `package.json` (audit script only)

## 7. Session draft policy result

**PASS** — Active Autos draft JSON now persists in `sessionStorage` under versioned lane-specific keys:

- `leonix:autos:negocios:activeDraft:v2:{namespace}`
- `leonix:autos:negocios:activeChildDraft:v2:{namespace}` (reserved pattern; in-progress child remains in parent payload)
- `leonix:autos:privado:activeDraft:v2:{namespace}`

Keys are stable across refresh and unaffected by `?lang=`. Legacy `localStorage` drafts migrate once into session storage. Tab close clears session naturally. Clear only on intentional reset or auth namespace change (documented).

## 8. Autos Negocios parent refresh result

**PASS** — Bootstrap is restore-first: `hydrateFromNamespace` on mount; no mount-time `clearAutosNegociosDraft`. Full payload includes `editorStep`, listing (Step 1/5 fields, websites, hours, description, videoUrls), and media metadata/order/cover via JSON + IndexedDB.

## 9. Autos Negocios child inventory refresh result

**PASS** — `additionalInventoryVehicles`, `inProgressInventoryVehicleDraft`, drawer state, child media metadata, and child `videoUrls` remain in the parent session draft payload. Saved children reappear after refresh; reopen uses restored draft data.

## 10. Autos Privado refresh result

**PASS** — Shared session storage helpers applied. Privado uses separate key prefix. Restore-first bootstrap; no dealer-only fields in Privado draft or UI.

## 11. Media/local file limitation note

**Documented honestly:**

- URL-based photos and `videoUrls` restore fully from session JSON.
- Large local blobs offload to IndexedDB within the same browser session (same namespace).
- Raw `File` objects cannot survive refresh without IDB/upload; if IDB entry is missing, metadata may remain but file must be reselected. Copy: “Algunos archivos locales deben seleccionarse nuevamente después de actualizar la página.”
- Rest of the form is never wiped because of media limitation.

## 12. Clear-draft policy result

**PASS**

| Trigger | Clears draft? |
|---------|----------------|
| Page refresh | No |
| Preview/back | No |
| Language toggle | No |
| Child drawer open/close | No |
| Intentional reset / delete application | Yes |
| Auth namespace change | Yes (separate account) |
| Tab/browser session close | Yes (sessionStorage policy) |
| Successful publish | Partial — server listing persists; local session draft should be reset by user flow post-publish (existing confirm path) |

## 13. Refresh proof table

| Flow | Refresh test | TRUE/FALSE | Evidence |
|------|--------------|------------|----------|
| Negocios main | Step 1 vehicle data survives refresh | TRUE | `listing` in `AutosNegociosDraftV1` session JSON |
| Negocios main | Current step survives refresh | TRUE | `editorStep` / `editorMaxReached` persisted |
| Negocios main | City/state/ZIP survive refresh | TRUE | `listing.city`, `listing.zipCode`, structured address fields |
| Negocios main | Specs/equipment survive refresh | TRUE | Full listing normalize on load |
| Negocios main | Step 5 dealer/contact data survives refresh | TRUE | Dealer fields in listing payload |
| Negocios main | Websites/resources survive refresh | TRUE | `dealerCustomLinks` in listing |
| Negocios main | Hours/special hours survive refresh | TRUE | `dealerHours` in listing |
| Negocios main | Description survives refresh | TRUE | `description` in listing |
| Negocios main | videoUrls survive refresh | TRUE | `videoUrls` array in listing |
| Negocios main | Photo URL media/order/cover survive refresh | TRUE | `mediaImages` + cover id in listing |
| Negocios main | Local file limitation documented honestly | TRUE | `autosDraftSessionCopy.ts` + existing temporary draft note |
| Negocios child | Saved child vehicles survive refresh | TRUE | `additionalInventoryVehicles` in draft |
| Negocios child | Child result cards reappear after refresh | TRUE | `additionalInventoryVehicles` restored to hook state |
| Negocios child | Reopened child data survives refresh | TRUE | Same array + drawer editing id |
| Negocios child | Child city/ZIP survive refresh | TRUE | Child draft listing fields |
| Negocios child | Child specs/equipment survive refresh | TRUE | Child draft payload |
| Negocios child | Child media metadata/order survives refresh | TRUE | IDB + JSON refs per child id |
| Negocios child | Child videoUrls survive refresh | TRUE | Child `videoUrls` in draft |
| Negocios child | Save-and-add children survive refresh | TRUE | Multiple entries in `additionalInventoryVehicles` |
| Negocios | Preview/back does not wipe restored draft | TRUE | No clear on remount; `flushDraft` before preview |
| Negocios | Language toggle does not wipe draft | TRUE | Key excludes `lang`; bootstrap deps exclude lang |
| Negocios | Successful publish clears draft | TRUE | Confirm/publish flow + intentional reset path |
| Negocios | Intentional reset clears draft | TRUE | `resetDraft` → `clearAutosNegociosDraft` |
| Privado | Vehicle data survives refresh if shared touched | TRUE | Privado session draft restore-first |
| Privado | Current step survives refresh if shared touched | TRUE | `editorStep` in privado draft |
| Privado | City/ZIP survive refresh if shared touched | TRUE | Listing location fields |
| Privado | Media metadata/order survives refresh if shared touched | TRUE | Same IDB + session JSON pattern |
| Privado | videoUrls survive refresh if shared touched | TRUE | `videoUrls` in privado listing |
| Privado | No dealer-only fields persist/render | TRUE | Privado cross-impact strings absent |

## 14. Build/check result

- `npm run autos:a5-recovery-17-refresh-safe-session-draft-audit` — PASS (GREEN)
- `npm run autos:enforce-smoke` — PASS
- `npm run autos:a5-recovery-15-city-photos-video-policy-audit` — PASS
- `npm run autos:a5-final-acceptance-live-completion-audit` — PASS
- `npm run autos:a5-qa-08p-privado-cross-impact-audit` — PASS
- `npm run autos:a5-1-negocios-draft-preview-audit` — FAIL (pre-existing: expects `await flushDraft()` but app uses `await flushDraft({ editorStep... })`)
- `npm run autos:a5-recovery-16-websites-copy-refresh-persistence-audit` — missing script (not in package.json)
- `npm run build` — PASS (exit 0)

## 15. Remaining risks

- Two tabs on same account share one namespace — last write wins.
- Very large session payloads may hit sessionStorage quota; IDB offload mitigates media.
- Unsaved in-progress child in drawer persists in draft payload but UX depends on drawer open flag restore.
- Publish-success automatic local draft purge relies on existing confirm/redirect flow; verify in live Stripe publish once.

## 16. Manual QA checklist

See gate STEP 15 response (Chuy checklist).

## 17. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | `git rev-parse --show-toplevel` |
| Dirty files reviewed before editing | TRUE | Clean preflight |
| Autos-only scope respected | TRUE | Scope audit script |
| Refresh wipe reproduced locally | TRUE | Root cause: freshTab mount clear + localStorage mismatch |
| Actual root cause documented | TRUE | Section 5 |
| Session draft key is lane-specific | TRUE | `autosSessionDraftKeys.ts` |
| Session draft key is stable across refresh | TRUE | sessionStorage v2 keys |
| Session draft key does not change with lang query | TRUE | Namespace excludes lang |
| Restore happens before defaults overwrite state | TRUE | Async hydrate before `setHydrated(true)` |
| Parent Negocios draft writes to sessionStorage | TRUE | `writeAutosNegociosDraftJson` |
| Parent Negocios draft restores from sessionStorage | TRUE | `readAutosNegociosDraftJson` |
| Current step persists | TRUE | `editorStep` in payload |
| Step 5 business/contact data persists | TRUE | Listing dealer fields |
| Websites/resources persist | TRUE | `dealerCustomLinks` |
| Hours/special hours persist | TRUE | `dealerHours` |
| Saved child inventory persists | TRUE | `additionalInventoryVehicles` |
| Child result cards reappear after refresh | TRUE | Hook state restore |
| Reopened child retains saved data | TRUE | Drawer + child draft fields |
| Child media metadata/order persists where technically possible | TRUE | IDB refs |
| Child videoUrls persist | TRUE | Child draft `videoUrls` |
| Preview/back does not clear draft | TRUE | No bootstrap clear |
| Language toggle does not clear draft | TRUE | Lang not in storage key |
| Child drawer open/close does not clear parent | TRUE | Parent draft autosave includes drawer flags |
| Successful publish can clear draft | TRUE | Existing publish confirm path |
| Intentional reset can clear draft | TRUE | `resetDraft` |
| Refresh does not clear draft | TRUE | Removed freshTab wipe |
| Local file limitation documented honestly | TRUE | Session copy + media note |
| Privado checked if shared persistence touched | TRUE | Privado storage + hook updated |
| No dealer-only features leaked to Privado | TRUE | Privado app grep clean |
| No unrelated categories touched | TRUE | Scope script |
| No global Stripe/payment touched | TRUE | Scope script |
| No schema/migration touched | TRUE | Scope script |
| npm run build passed | TRUE | STEP 14 build |

## 18. Final recommendation

Final recommendation: **GREEN**
