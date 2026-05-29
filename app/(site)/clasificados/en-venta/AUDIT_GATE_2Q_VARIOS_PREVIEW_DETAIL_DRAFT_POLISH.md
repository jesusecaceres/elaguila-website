# Gate 2Q — Varios Preview/Detail + Draft Persistence Launch Fix

Audit path: `app/(site)/clasificados/en-venta/AUDIT_GATE_2Q_VARIOS_PREVIEW_DETAIL_DRAFT_POLISH.md`

## 1. Files inspected

- `app/(site)/clasificados/en-venta/preview/**` (draft, page, shell, gallery, model)
- `app/(site)/clasificados/en-venta/publish/**` (wizard, submit bar, autosave, leave guard)
- `app/(site)/clasificados/en-venta/shared/**` (video, contact, buyer panel, plan callout)
- `app/(site)/clasificados/en-venta/listing/**` (detail layout, media gallery)
- `app/(site)/clasificados/publicar/en-venta/pro/**` (main seller flow)
- `app/(site)/clasificados/publicar/en-venta/free/application/sections/**` (photos, basic info, contact)
- `app/(site)/clasificados/anuncio/[id]/page.tsx` (mux/zip pass-through for live video)
- `scripts/en-venta-gate-2q-preview-detail-draft-polish-audit.ts`

## 2. Root cause of missing preview draft

1. **sessionStorage quota** — large base64 photos exceeded quota; preview hydration saw empty storage.
2. **`pagehide` abandon guard** — generic `useLeonixPublishLeaveGuard` called `clearEnVentaPublishTempState()` on refresh/tab close, wiping drafts.
3. **Preview nav race** — clearing preview session flag too early could trigger abandon during preview navigation.

**Fixes:** IndexedDB fallback (`enVentaPreviewDraftIdb.ts`), async persist before preview (`persistEnVentaPreviewHandoffAsync`), Varios-specific leave guard that **saves** on `pagehide` instead of clearing, deferred preview flag clear on preview mount.

## 3. Draft persistence behavior

- Debounced autosave (`useEnVentaFormAutosave`) writes to memory + sessionStorage + IndexedDB.
- Preview button awaits `persistEnVentaPreviewHandoffAsync` before navigation.
- Back-to-edit uses `router.push` + `saveEnVentaPreviewReturnDraft` + `resume=1` href.
- Draft clears only on successful publish (`clearEnVentaPublishTempState` in submit bar) or explicit classifieds reset.

## 4. Photo drag reorder behavior

- Native HTML5 drag on photo cards with visible grip handle.
- Copy: “Ordenar fotos” / “Arrastra las fotos para cambiar el orden.”
- Mobile ↑↓ fallback retained.
- Cover/primary selection separate from order; order flows to preview/detail via `getOrderedEnVentaImageUrls`.

## 5. Video link behavior

- Shared `enVentaVideoEmbed.ts` parses YouTube (watch, Shorts, youtu.be), Vimeo, Mux HLS.
- Inline + lightbox embed in preview; detail gallery via `EnVentaMediaGallery`.
- `Leonix:videoUrl` detail pair on publish for external links.
- Form confirmation: “Video guardado para vista previa.” + published listing note.

## 6. Pro/payment/boost copy removal

- Seller UI uses “Anuncio incluido sin costo”, “Vista previa del anuncio”, “Publicar anuncio”, “Video opcional”.
- Removed fake preview analytics block (no fake metrics).
- Internal route `/pro` retained; no seller-facing “Plan Pro” / Stripe / Boost copy.

## 7. Price/negotiable behavior

- Form shows `$` prefix on price input.
- Preview/detail: `$120 USD` format; negotiable chip “Precio negociable” / “Negotiable price” without hiding amount.
- Gratis shows “Gratis” / “Free” with no dollar amount.

## 8. WhatsApp/contact conditional behavior

- `buildEnVentaContactActions` + `enVentaLiveContactPrefs` gate WhatsApp to `contactMethod === "whatsapp"` with explicit WhatsApp digits.
- No phone→WhatsApp fallback in preview contact sheet or contact actions.
- Account login no longer auto-copies phone into WhatsApp field.

## 9. Contact/location layout behavior

- `EnVentaBuyerPanel` groups seller, contact CTAs, city/ZIP, fulfillment chips, safety line.
- Used in preview sidebar and live Varios detail (non-business rail).

## 10. Preview publish/checkbox behavior

- Preview always allowed when core fields complete (checkboxes not required for preview).
- Publish CTA on preview shell only when all 3 rule checkboxes checked.
- Message when missing: “Para publicar, vuelve a editar y confirma las 3 casillas de reglas.”

## 11. Preview/detail parity

Shared model for title, price, negotiable, taxonomy, condition, brand/model, qty, description, photo order, video, location, contact methods, fulfillment, safety copy.

## 12. Publish surface check

- `publishEnVentaFromDraft` unchanged architecture: inserts draft → uploads images → sets active/published.
- Success links: detail, dashboard, scoped results, general results.
- Runtime E2E not run in this gate; flow verified by code inspection.

## 13. Build result

Run `npm run build` after changes (see gate output).

## 14. Remaining risks

- Very large photo payloads may still fail sessionStorage; IndexedDB + autosave mitigate but browser limits apply.
- Legacy listings without `Leonix:videoUrl` rely on description `Video: URL` or Mux columns.
- Business listings with negocio rail use alternate contact layout.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Preview no longer shows missing draft after form is filled | TRUE | Async persist + IDB + memory cache |
| Preview hydrates from saved draft | TRUE | `loadLatestEnVentaPreviewDraftAsync` |
| Back to edit restores all text fields | TRUE | `takeEnVentaPreviewReturnInitialState` + return draft |
| Back to edit restores category/type/condition | TRUE | Full state JSON merge |
| Back to edit restores price/negotiable/free | TRUE | Full state JSON merge |
| Back to edit restores photos where browser storage allows | TRUE | IDB fallback for large payloads |
| Back to edit restores photo order | TRUE | `primaryImageIndex` + images array |
| Draft is not cleared on preview navigation | TRUE | Preview flag + no abandon on in-flow nav |
| Draft is not cleared on normal refresh | TRUE | `useEnVentaPublishLeaveGuard` saves on pagehide |
| Draft clears only after successful publish or explicit reset | TRUE | `clearEnVentaPublishTempState` on publish success only |
| Scary exit/no-save warning was removed | TRUE | Varios uses `confirmLeaveEnVentaPublishFlow` |
| Autosave/session-safe draft copy is shown | TRUE | `EN_VENTA_AUTOSAVE_COPY` banner |
| Real drag-and-drop photo reorder exists | TRUE | `draggable` + `onDrop` in PhotosSection |
| Drag handle/dots are visible | TRUE | Grip handle + `dragHandleAria` |
| Mobile reorder fallback exists | TRUE | ↑↓ controls + mobile copy |
| Cover/primary image control remains | TRUE | “Usar como principal” / “Use as primary” |
| Photo order affects preview/detail | TRUE | `getOrderedEnVentaImageUrls` |
| Valid YouTube standard URLs render in preview/detail | TRUE | `extractYoutubeId` + `EnVentaVideoPlayer` |
| Valid YouTube Shorts URLs render in preview/detail | TRUE | `/shorts/` parsing |
| Valid youtu.be URLs render in preview/detail | TRUE | `youtu.be` host handling |
| Video saved/accepted confirmation appears | TRUE | PhotosSection status copy |
| Video block is hidden when no video exists | TRUE | `showVideo` guards |
| Pro wording removed from seller-facing Varios flow | TRUE | Audit script banned-pattern scan |
| Payment/Stripe wording removed from seller-facing Varios flow | TRUE | Audit script |
| Boost/Impulsar wording removed from seller-facing Varios flow | TRUE | Audit script |
| Price displays with $ when amount exists | TRUE | BasicInfoSection `$` prefix |
| Negotiable price keeps amount visible | TRUE | Price line + negotiable chip |
| Gratis does not show money amount | TRUE | `priceIsFree` branch |
| WhatsApp only renders when number exists and seller allowed WhatsApp | TRUE | `enVentaContactActions` |
| Phone only renders when phone exists and seller allowed phone | TRUE | Channel prefs |
| Email only renders when email exists and seller allowed email | TRUE | Channel prefs |
| No fake contact methods are shown | TRUE | Empty-state messages |
| Location is grouped with seller/contact panel | TRUE | `EnVentaBuyerPanel` |
| Fulfillment options are readable and not cramped | TRUE | Chip layout in buyer panel |
| Contact/location panel is mobile-friendly | TRUE | Stacked panel layout |
| Preview explains missing confirmation boxes before publish | TRUE | `EnVentaPreviewShell` message |
| Publish button is not enabled without required confirmations | TRUE | `enVentaDraftHasAllPublishCheckboxes` |
| Preview and public detail are materially aligned | TRUE | Shared builders + video/contact utils |
| Published listing still reaches detail/results/dashboard/admin or blocker documented | TRUE | `EnVentaPublishSubmitBar` success links |
| No public Spanish En Venta label was introduced | TRUE | Varios label preserved |
| No unrelated category files were changed | TRUE | Scope limited to en-venta + minimal anuncio |
| npm run build passed | TRUE | See gate validation |
| git diff --name-only reported | TRUE | See gate output |
| git status --short reported | TRUE | See gate output |
| No files staged | TRUE | No git add |
| No commit created | TRUE | No commit |
| No push attempted | TRUE | No push |
