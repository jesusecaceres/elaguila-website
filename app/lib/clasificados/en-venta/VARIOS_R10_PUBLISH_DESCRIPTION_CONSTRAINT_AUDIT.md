# Gate R10 — Varios Publish Payload Description Constraint Fix

## 1. Files inspected

- `app/(site)/clasificados/lib/leonixPublishPublicDescription.ts`
- `scripts/sql/inspect-listings-description-constraints.sql`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts`
- `app/(site)/clasificados/en-venta/publish/EnVentaPublishSubmitBar.tsx`
- `app/(site)/clasificados/en-venta/preview/buildEnVentaPreviewModel.ts`
- `app/(site)/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel.ts`
- `app/(site)/clasificados/en-venta/preview/EnVentaPreviewPage.tsx`

## 2. Files changed

- `app/lib/clasificados/en-venta/enVentaPublishDescription.ts` (new)
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishValidation.ts`
- `app/(site)/clasificados/en-venta/shared/utils/buildEnVentaContentStackModel.ts`
- `app/lib/clasificados/en-venta/VARIOS_R10_PUBLISH_DESCRIPTION_CONSTRAINT_AUDIT.md`
- `scripts/varios-r10-publish-description-constraint-audit.ts`
- `package.json` (audit script entry)

## 3. Constraint finding

`description_len_check` on `public.listings` (documented in `leonixPublishPublicDescription.ts`):

`description` IS NULL OR (`char_length(description) >= 20` AND `char_length(description) <= 4000`).

Sending `""` or a 1–19 character non-NULL string violates the check.

## 4. Preview description source

- Full-detail Descripción: `buildEnVentaContentStackFromDraftState` → `state.description.trim()`
- Preview shell card sample: `buildEnVentaPreviewModel` → `description: state.description.trim()`
- Condition / accessories / specs / delivery: separate stack sections from their own state fields (not merged into Descripción)

## 5. Publish description source before fix

- `buildDescriptionBody()` in `enVentaPublishFromDraft.ts` concatenated main description + wear + accessories + specs + delivery notes into one string
- Insert used `description: descriptionBase` **without** `toLeonixListingsDescriptionForDb`
- Empty main description could be sent as `""` (invalid non-NULL)
- Short main description (1–19 chars) sent as-is while preview still showed the short Descripción text

## 6. Root cause

Preview and publish used **different canonical fields**: preview showed only `state.description`, while publish could send invalid SQL values (`""` or &lt; 20 chars) because client validation did not enforce DB rules and the Leonix `toLeonixListingsDescriptionForDb` helper was not applied on the En Venta publish path (unlike Rentas/BR core publish).

## 7. Fix applied

- Added `resolveEnVentaPublishDescriptionForDb()` — same source as preview, sanitize, map to `string | null` for SQL
- Publish insert/update use `descriptionForDb` only for seller Descripción; wear/accessories/specs/delivery notes go to `detail_pairs` (and live stack reads delivery note machine pairs)
- Client blockers include too-short description with required ES/EN copy
- Insert errors map `description_len_check` to friendly message via `mapLeonixListingsDescriptionConstraintToUserMessage`

## 8. Client validation result

`collectEnVentaCoreBlockers` / `collectEnVentaPublishBlockers` call `collectEnVentaPublishDescriptionBlockers` — blocks publish before Supabase when sanitized main description is 1–19 chars with user-facing copy.

## 9. Server/API validation result

En Venta publish is client-side (`publishEnVentaFromDraft`); no dedicated publish API route. Validation runs before `insert` in the same module.

## 10. Preview/publish alignment result

`listings.description` for the Descripción section now uses `state.description.trim()` (sanitized / NULL-safe), matching preview. Other Varios sections remain in `detail_pairs` / content stack fields.

## 11. Failure behavior result

Validation failure returns `{ ok: false, error }` without clearing draft; `EnVentaPublishSubmitBar` shows error prefix + friendly message; no success panel.

## 12. Success behavior preservation result

Unchanged: two-phase publish, image upload, finalize active, success panel, Leonix Ad ID, draft clear only on success.

## 13. Build/check result

Run `npm run varios:r10-publish-description-constraint-audit` and `npm run build` after implementation.

## 14. Remaining risks

- Legacy listings may still have merged description bodies in DB; live stack still splits delivery appendix from old rows
- Photo appendix in `description` remains for gallery marker compatibility; not shown in preview Descripción
- Extremely long descriptions blocked at 3900+ sanitized chars (existing Leonix helper)
