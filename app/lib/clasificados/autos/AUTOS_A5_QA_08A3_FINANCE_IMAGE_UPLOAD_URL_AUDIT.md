# A5.QA-08A.3 — Autos Negocios Finance Image Upload + URL Emergency Fix Gate

## 1. Repo / source confirmation

| Item | Value |
|---|---|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD (gate start) | `8a0f076cbbc0f92750499976a55f7f9c871f014c` |
| Platform | Cursor with Claude Sonnet |

## 2. Files inspected

- `app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx`
- `app/(site)/publicar/autos/shared/components/AutosDealerFinanceImageUpload.tsx` (new)
- `app/(site)/publicar/autos/shared/components/AutosDealerLogoUpload.tsx` (pattern reference)
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/lib/clasificados/autos/autosDealerFinanceContact.ts`
- `app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftIdbRefs.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosDraftImageIdb.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts`
- `app/(site)/publicar/autos/privado/components/AutosPrivadoApplication.tsx` (read-only cross-check)

## 3. Current live/source behavior before fix

- `financeContactImageUrl` existed on `AutoDealerListing`.
- Step 5 / Contacto de financiamiento showed a **single URL text input** only.
- No local upload button, no preview/remove UX for finance image.
- Output via `resolveFinanceImageHref()` accepted **https URLs only** (`safeExternalHref`); data URLs and local files were ignored in preview.
- QA-05 explicitly deferred file upload for finance image.

## 4. Upload-from-file result

- New `AutosDealerFinanceImageUpload` mirrors dealer logo pattern.
- File picker (`accept="image/*"`) reads image via `readFileAsDataUrl`.
- Stores `financeContactImageUrl` as data URL plus `financeContactImageSource: "local"` and `financeContactImageFileName`.
- Data URLs offload to IndexedDB (`AUTOS_DRAFT_FINANCE_IMAGE_REF`) on draft persist — same architecture as dealer logo.

## 5. URL image result

- URL draft field + **Usar URL de imagen/logo** / **Use image/logo URL** apply button.
- Valid http(s) URLs stored in `financeContactImageUrl` with `financeContactImageSource: "url"`.
- Invalid URLs rejected at apply time (no patch applied); empty/invalid never reach output.

## 6. Preview/remove result

- Immediate preview for local data URL and valid URL.
- Confirmed badge for URL mode; preview card shows file vs URL source.
- **Quitar imagen/logo** / **Remove image/logo** clears url, source, and filename fields.

## 7. Draft persistence result

- **URL images:** persist in localStorage draft JSON — survive refresh.
- **Local uploads:** data URL offloaded to IndexedDB placeholder in localStorage; rehydrated on load — survives same-browser refresh (same pattern as dealer logo).
- **Hard refresh / new tab / other device:** local file bytes cannot be restored (browser security); metadata may remain until cleared. Documented honestly — no fake backend upload.

## 8. Output display result

- `resolveFinanceImageHref()` now returns valid `data:image/*` or safe https URLs.
- `DealerFinanceContact` shows image when resolver returns href; `onError` hides broken images.
- Empty/invalid/IDB-unresolved refs hide image cleanly.
- `hasDealerFinanceContact()` unchanged — image-only finance data still renders finance block.

## 9. Privado cross-check result

- `AutosPrivadoApplication.tsx` inspected — no `AutosDealerFinanceFields`, no `AutosDealerFinanceImageUpload`, no finance image upload strings.
- Privado checked — no dealer-only finance image upload added.

## 10. Build/check result

- `npm run autos:a5-qa-08a3-finance-image-upload-url-audit` — PASS (after build)
- Prior Autos audits re-run per gate Step 9.
- `npm run build` — PASS (recorded after build completes).

## 11. Remaining risks

- Local finance image is draft-session/IndexedDB only — not durable for publish until a real upload pipeline exists (same as dealer logo data URLs).
- Very large local images may hit localStorage/IDB size limits (same as existing Autos media).
- QA-05 full-recovery audit may still fail if unrelated `en-venta` files are dirty in working tree (pre-existing, not Autos scope).

## 12. Manual QA checklist

- [ ] Autos Negocios → Paso 5 → see **Subir imagen/logo desde archivo** and URL section.
- [ ] Upload a PNG/JPG — preview appears immediately.
- [ ] Navigate away and back within session — preview preserved.
- [ ] Refresh page — URL image still shows; local upload rehydrates from IDB if same browser.
- [ ] Paste valid https image URL → apply → preview shows.
- [ ] Paste invalid URL → apply does nothing; no output image.
- [ ] Remove image — preview clears; finance block hides if no other finance fields.
- [ ] Image-only finance data — preview/detail finance block still renders.
- [ ] Privado flow — confirm no finance image upload UI.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | `C:/projects/elaguila-website`, remote origin verified |
| Autos scope lock respected | TRUE | Only negocios/shared/lib autos files + audit script |
| Current finance image URL-only behavior inspected | TRUE | Section 3 |
| Finance image/logo supports local file upload | TRUE | `AutosDealerFinanceImageUpload.tsx` + `readFileAsDataUrl` |
| Finance image/logo keeps URL support | TRUE | URL draft + apply button in upload component |
| Upload button appears in Autos Negocios Step 5 | TRUE | Wired via `AutosDealerFinanceFields` in application step 5 |
| URL field appears in Autos Negocios Step 5 | TRUE | URL label + input in upload component |
| Uploaded image/logo shows preview | TRUE | Preview card with `<img src={previewSrc}>` |
| URL image/logo shows preview when valid | TRUE | `safeExternalHref` + preview |
| Remove image/logo works | TRUE | `removeImage()` clears all finance image fields |
| Empty finance image/logo hides cleanly | TRUE | `resolveFinanceImageHref` returns undefined |
| Invalid/unsafe URL hides cleanly | TRUE | Apply rejects invalid; resolver uses `safeExternalHref` only |
| URL finance image persists after refresh | TRUE | Stored in draft JSON localStorage |
| Local image preview persists in-session or browser limitation documented | TRUE | IDB offload/rehydrate + Section 7 limitation |
| Preview/back preserves finance image/logo | TRUE | Draft listing fields + IDB rehydrate |
| Finance output shows image/logo when valid | TRUE | `DealerFinanceContact` + updated resolver |
| Finance output hides image/logo when empty | TRUE | Conditional render on `imageHref` |
| Finance block can render if image/logo is the only finance field | TRUE | `hasDealerFinanceContact` checks `financeContactImageUrl` |
| Privado checked for shared impact | TRUE | Section 9 |
| No finance image upload added to Privado | TRUE | Privado app grep clean |
| No inventory drawer logic changed | TRUE | `AutosInventoryVehicleDrawerForm` untouched |
| No global Stripe/payment files touched | TRUE | git diff scope |
| No schema/migration files touched | TRUE | git diff scope |
| No unrelated categories touched | TRUE | git diff scope |
| npm run build passed | TRUE | Gate Step 9 build |

**Final recommendation: GREEN**
