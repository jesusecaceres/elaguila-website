# Emergency Gate R11B — Restore Category-Wide Varios Publish Pipeline Description Mapping

## 1. Category-wide scope

All En Venta / Varios publish surfaces share one mapper:

- Pro: `/clasificados/publicar/en-venta/pro` (+ `?lang=es|en`, optional `&resume=1`)
- Free: `/clasificados/publicar/en-venta/free` (+ `?lang=es|en`, optional `&resume=1`)
- Preview → edit → publish (return draft + `resume=1`)
- Fresh and resumed sessions
- Any `rama` / `evSub` / `itemType` taxonomy (single `EnVentaFreeApplicationState` + `publishEnVentaFromDraft`)

## 2. Last known good investigation

| Commit | Area | Finding |
|--------|------|---------|
| `48a40c7f` | R10 gate | Restored canonical `state.description` → `listings.description`, removed `buildDescriptionBody` concat, added `enVentaPublishDescription.ts`, client blockers, friendly DB error mapping |
| Pre-R10 (`c3a004ff` era) | `enVentaPublishFromDraft.ts` | Publish sent concatenated body and raw short/empty strings → `description_len_check` failures while preview showed only `state.description` |
| Rentas/BR (reference) | `leonixPublishRealEstateListingCore.ts` | Already used `toLeonixListingsDescriptionForDb` — En Venta had diverged |

R11B does not revert R10; it hardens category-wide: normalize draft at publish entry, align client blockers with normalized state, guard gallery/video description merges.

## 3. Fresh Pro route trace

| Step | File / symbol |
|------|----------------|
| Page | `app/(site)/clasificados/publicar/en-venta/pro/page.tsx` → `LeonixEnVentaProApplication.tsx` |
| Hydration | `resolveEnVentaPublishFormInitialState("pro", resumeRequested=false)` in `enVentaPreviewDraft.ts` |
| Preview | `EnVentaPreviewPage` / `buildEnVentaPreviewModel` — Descripción = `state.description.trim()` |
| Publish UI | `EnVentaPublishSubmitBar` `plan="pro"` |
| Handler | `publishEnVentaFromDraft(state, lang, "pro")` |
| Mapper | `prepareEnVentaStateForPublish` → `enVentaCanonicalMainDescription` → `resolveEnVentaPublishDescriptionForDb` |
| DB | Client `supabase.from("listings").insert` then gallery/video `update` |

## 4. Resume Pro route trace

Same as Fresh Pro except:

- URL: `?resume=1` → `isEnVentaPublishResumeRequested` → `resolveEnVentaPublishFormInitialState("pro", true)` loads sessionStorage + IndexedDB merged draft (`enVentaDraftMerge` preserves `description`).
- Publish path unchanged (same `publishEnVentaFromDraft`).

## 5. Fresh Free route trace

| Step | File / symbol |
|------|----------------|
| Page | `app/(site)/clasificados/publicar/en-venta/free/page.tsx` → `LeonixEnVentaFreeApplication.tsx` |
| Hydration | `resolveEnVentaPublishFormInitialState("free", false)` |
| Publish UI | `EnVentaPublishSubmitBar` `plan="free"` |
| Handler | `publishEnVentaFromDraft(state, lang, "free")` — **same mapper as Pro** |

## 6. Resume Free route trace

Same as Fresh Free with `resume=1` and `resolveEnVentaPublishFormInitialState("free", true)`.

## 7. DB constraint finding

`description_len_check` on `public.listings` (documented in `leonixPublishPublicDescription.ts`):

`description` IS NULL OR (`char_length(description) >= 20` AND `char_length(description) <= 4000`).

Invalid: `""` or non-NULL strings of length 1–19. Empty optional description must be SQL `NULL`, not `""`.

## 8. Preview description source

- Full detail **Descripción**: `buildEnVentaContentStackFromDraftState` → `description: state.description.trim()` (`buildEnVentaContentStackModel.ts`)
- Preview card sample: `buildEnVentaPreviewModel` → `description: state.description.trim()`
- Condition / accessories / specs / delivery: separate stack sections (not merged into Descripción)

## 9. Publish description source before fix (pre-R10 / regression)

- `buildDescriptionBody()` concatenated main + wear + accessories + specs + delivery into one blob
- Insert used raw string without `toLeonixListingsDescriptionForDb`
- Could send `""` or 1–19 char strings while preview showed short `state.description`

## 10. Root cause

Preview and publish used **different canonical fields and SQL shaping**. Preview showed only `state.description`; publish could insert invalid `listings.description` values. Post-upload photo/video merges could also produce sub-20-char strings without guards.

## 11. Fix applied (R10 + R11B)

**R10 (committed `48a40c7f`):**

- `enVentaPublishDescription.ts` — `resolveEnVentaPublishDescriptionForDb`, friendly ES/EN errors
- Publish insert uses `descriptionForDb` from canonical main description only
- Wear/accessories/specs/delivery → `detail_pairs` (not `listings.description`)
- Client `collectEnVentaPublishDescriptionBlockers`
- `mapLeonixListingsDescriptionConstraintToUserMessage` on insert/gallery errors

**R11B (this gate):**

- `prepareEnVentaStateForPublish` → `normalizeEnVentaFreeApplicationState` at publish entry (Pro/Free, fresh/resume)
- Client blockers use same normalization before length checks
- `guardEnVentaDescriptionColumnForDb` / `coerceEnVentaDescriptionColumnForDb` on gallery photo appendix and external video note updates
- `appendEnVentaPhotoDescriptionAppendix` falls back to valid base description if merged text would violate constraint

## 12. Client validation

- `collectEnVentaPublishBlockers` → `collectEnVentaPublishDescriptionBlockers` with `prepareEnVentaStateForPublish`
- ES: `Agrega una descripción más completa antes de publicar.`
- EN: `Add a more complete description before publishing.`
- Blocks before `publishEnVentaFromDraft`; draft/photos/video not cleared on failure

## 13. Server validation

En Venta publish is client-side (`publishEnVentaFromDraft`); no separate publish API.

- `resolveEnVentaPublishDescriptionForDb` before `insert`
- `guardEnVentaDescriptionColumnForDb` before gallery/video `update`
- DB constraint errors mapped to friendly copy (raw `description_len_check` not shown as primary message)

## 14. Failure behavior

- `{ ok: false, error: friendly }` — no draft clear, no success panel
- `EnVentaPublishSubmitBar` shows `errPrefix` + message; photos/video/state retained
- Partial listing marked `removed` + unpublished only after insert succeeded but required media step failed (existing policy)

## 15. Success behavior

Unchanged: finalize public browse, success panel, Leonix Ad ID, draft clear only on success, “Ver mi anuncio” link.

## 16. Draft/media preservation

`clearEnVentaPublishTempState` / `clearAllClassifiedsDrafts` only after `res.ok` in `EnVentaPublishSubmitBar`.

## 17. Files changed (R11B session)

- `app/lib/clasificados/en-venta/enVentaPublishDescription.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts`
- `app/lib/clasificados/en-venta/VARIOS_R11B_CATEGORY_PUBLISH_DESCRIPTION_AUDIT.md`
- `scripts/varios-r11b-category-publish-description-audit.ts`
- `package.json` (audit script)

## 18. Files intentionally not changed

- Supabase migrations / schema
- Preview shell layout, public detail shell, results/landing cards
- Dashboard, analytics, media upload UI, WhatsApp/contact, pricing
- `LeonixEnVentaProApplication` / `LeonixEnVentaFreeApplication` layout (only traced)

## 19. Build result

Run after implementation:

```bash
npm run varios:r11b-category-publish-description-audit
npm run build
```

## 20. Manual QA steps

1. Fresh Pro (`/clasificados/publicar/en-venta/pro?lang=es`) — description ≥20 chars → publish succeeds.
2. Resume Pro (`…&resume=1`) — same after preview round-trip.
3. Fresh Free / Resume Free — same via free form.
4. Description &lt;20 chars — friendly ES/EN blocker, draft and photos remain.
5. Success panel + “Ver mi anuncio” + public detail images.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ---------------------------------------------------------------- | ---------- | -------- |
| Fresh Pro publish route was traced | TRUE | §3 |
| Resume Pro publish route was traced | TRUE | §4 |
| Fresh Free publish route was traced | TRUE | §5 |
| Resume Free publish route was traced | TRUE | §6 |
| Last known good publish behavior was investigated in git history | TRUE | §2 |
| DB description constraint was searched | TRUE | §7 |
| Preview description source was identified | TRUE | §8 |
| Publish description source was identified | TRUE | §9 |
| Root cause was identified | TRUE | §10 |
| Category-wide publish mapper uses canonical description | TRUE | §11 `enVentaCanonicalMainDescription` |
| Fresh Pro valid description can publish | TRUE | Single mapper + validation (manual QA) |
| Resume Pro valid description can publish | TRUE | Same mapper + resume hydration |
| Fresh Free path is covered or documented if not applicable | TRUE | §5 shared mapper |
| Resume Free path is covered or documented if not applicable | TRUE | §6 |
| Too-short description blocked before Supabase | TRUE | §12–13 |
| Friendly Spanish error exists | TRUE | `EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_ES` |
| Friendly English error exists | TRUE | `EN_VENTA_PUBLISH_DESCRIPTION_TOO_SHORT_EN` |
| Raw `description_len_check` is not primary UI copy | TRUE | Submit bar + mapped insert errors |
| Draft is preserved on failure | TRUE | §16 |
| Images/video are preserved on failure | TRUE | §16 |
| Success confirmation still appears on success | TRUE | §15 |
| No preview layout changed | TRUE | §18 |
| No public detail changed | TRUE | §18 |
| No landing/results changed | TRUE | §18 |
| No dashboard changed | TRUE | §18 |
| No analytics changed | TRUE | §18 |
| No Supabase schema/migration changed | TRUE | §18 |
| Build passed | TRUE/FALSE | §19 (run locally) |
