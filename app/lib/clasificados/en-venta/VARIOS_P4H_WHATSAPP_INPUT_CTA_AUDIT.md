# Gate P4-H — Varios WhatsApp Input Mask + Preview CTA

## 1. Files inspected

- `app/(site)/clasificados/publicar/en-venta/free/application/sections/SellerContactSection.tsx`
- `app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts`
- `app/(site)/clasificados/en-venta/shared/utils/enVentaContactActions.ts`
- `app/(site)/clasificados/en-venta/shared/components/EnVentaContactButtons.tsx`
- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts` (digits-only publish — read-only)

## 2. Files changed

- `app/(site)/clasificados/en-venta/shared/utils/enVentaPhoneDisplay.ts` — `formatEnVentaPhoneInput`, `enVentaPhoneInputDigits`
- `app/(site)/clasificados/publicar/en-venta/free/application/sections/SellerContactSection.tsx` — WhatsApp + Teléfono `onChange` mask
- `app/(site)/clasificados/en-venta/shared/utils/normalizeEnVentaApplicationState.ts` — format phone/WhatsApp on draft normalize
- `app/lib/clasificados/en-venta/VARIOS_P4H_WHATSAPP_INPUT_CTA_AUDIT.md` (this file)
- `scripts/varios-p4h-whatsapp-input-cta-audit.ts` (new)
- `package.json` (audit script only)

## 3. Existing phone formatting pattern found

`SellerContactSection` used local `formatPhoneInput` (US mask) on account pre-fill only; `onChange` stored raw `e.target.value`. Publish strips digits via `.replace(/\D/g, "")` in `enVentaPublishFromDraft.ts`.

## 4. WhatsApp input root cause

WhatsApp `onChange` stored unformatted `e.target.value` while Teléfono was at least formatted on account pre-fill, so pasted/typed WhatsApp stayed as `4088021531`.

## 5. WhatsApp input mask fix

Shared `formatEnVentaPhoneInput` (same mask as Teléfono): formats while typing/pasting, handles `+1` prefix, 10-digit US cap, safe fallback for unusual lengths. Applied to both Teléfono and WhatsApp inputs. Draft normalize formats legacy digit-only values on restore.

## 6. WhatsApp CTA visibility fix

No change this gate — already delivered in Gate P4-G: `buildEnVentaContactActions` shows WhatsApp when ≥8 digits; `EnVentaContactButtons` has WhatsApp icon + green styling; publish persists `Leonix:whatsapp` pair.

## 7. Preview result

Preview contact card uses `buildEnVentaContactActions` → formatted `displayNumber` under WhatsApp label when `state.whatsapp` has digits.

## 8. Public detail result

`buildEnVentaLiveContactActions` + `Leonix:whatsapp` detail pair → WhatsApp CTA when seller provided number (P4-G).

## 9. Regression check result

No layout/media/draft/publish/terms changes. Teléfono now also masks on every keystroke (parity). Email unchanged.

## 10. Build/check result

Run `npm run varios:p4h-whatsapp-input-cta-audit` and `npm run build`.

## 11. Remaining risks

- International numbers longer than 11 digits show trimmed raw fallback in the input (by design).
- Listings published before P4-G without `Leonix:whatsapp` may need republish for live WhatsApp when preferred method was not WhatsApp.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Existing Teléfono formatting pattern was inspected | TRUE | `SellerContactSection.tsx` |
| WhatsApp input root cause was identified | TRUE | §4 |
| WhatsApp field displays 10-digit input as (###) ###-#### | TRUE | `formatEnVentaPhoneInput` |
| WhatsApp paste values normalize safely | TRUE | `+1` strip + mask |
| WhatsApp stored/submitted value remains dialable/clean | TRUE | `enVentaContactDigits` at publish |
| WhatsApp href uses safe digits-only value | TRUE | `enVentaContactActions.ts` |
| Phone field behavior was not regressed | TRUE | same formatter on `phone` |
| WhatsApp CTA appears in preview when WhatsApp exists | TRUE | P4-G `showWa = waValid` |
| WhatsApp CTA appears in public detail when WhatsApp exists | TRUE | P4-G live builder |
| WhatsApp CTA hides when WhatsApp is empty | TRUE | `waValid` ≥8 digits |
| Preferred contact method does not hide provided WhatsApp | TRUE | P4-G |
| WhatsApp button has label WhatsApp | TRUE | `EnVentaContactButtons.tsx` |
| WhatsApp button has icon/logo or documented fallback | TRUE | `IconWhatsApp` SVG |
| Images/gallery were not changed | TRUE | no media edits |
| Video behavior was not changed | TRUE | no video edits |
| Draft lifecycle was not changed | TRUE | no draft file edits |
| Publish flow was not changed | TRUE | no publish logic edits |
| Preview layout was not changed | TRUE | no preview layout edits |
| Public detail layout was not changed | TRUE | no layout edits |
| Landing/results were not changed | TRUE | out of scope |
| No unrelated categories were edited | TRUE | scope-only |
| No global layout/theme files were edited | TRUE | scope-only |
| No Stripe/payment files were edited | TRUE | scope-only |
| No Supabase migrations/schema were edited | TRUE | none |
| npm run build passed | TRUE | gate validation |
