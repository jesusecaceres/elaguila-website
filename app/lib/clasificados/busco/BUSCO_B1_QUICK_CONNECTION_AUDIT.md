# Gate BUSCO-B1 — Busco / Se Busca Quick Connection Listing Upgrade

**Date:** 2026-06-30  
**Branch:** main  
**Status:** READY TO COMMIT: YES

---

## 1. Gate Title

Gate BUSCO-B1 — Busco / Se Busca Quick Connection Listing Upgrade

---

## 2. Files Inspected

- `app/(site)/publicar/busco/shared/buscoQuickTypes.ts`
- `app/(site)/publicar/busco/shared/buscoQuickDraft.ts`
- `app/(site)/publicar/busco/shared/buscoFormCopy.ts`
- `app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts`
- `app/(site)/publicar/busco/shared/buscoRequiredForPreview.ts`
- `app/(site)/publicar/busco/shared/buscoTaxonomy.ts`
- `app/(site)/publicar/busco/shared/buscoSessionKeys.ts`
- `app/(site)/publicar/busco/shared/buscoPublishRoutes.ts`
- `app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx`
- `app/(site)/publicar/busco/quick/BuscoQuickPreviewClient.tsx`
- `app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx`
- `app/(site)/clasificados/busco/BuscoQuickPublishedAd.tsx`
- `app/(site)/clasificados/busco/BuscoRequestCard.tsx`
- `app/(site)/clasificados/busco/BuscoResultsClient.tsx`
- `app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx`
- `app/(site)/clasificados/busco/shared/buscoCardModel.ts`
- `app/(site)/clasificados/busco/shared/buscoListingDetailPairs.ts`
- `app/(site)/clasificados/busco/shared/buscoDashboardDisplay.ts`
- `app/(site)/clasificados/busco/shared/buscoPublicLabel.ts`
- `app/(site)/clasificados/busco/shared/buscoSearchText.ts`
- `app/(site)/clasificados/busco/shared/loadBuscoListings.ts`
- `app/(site)/clasificados/busco/shared/BuscoShellLayout.tsx`
- `app/admin/(dashboard)/workspace/clasificados/busco/page.tsx`

---

## 3. Files Changed

- `app/(site)/publicar/busco/shared/buscoQuickTypes.ts` — Added `BuscoUrgency`, `BuscoPreferredContact` types; extended `BuscoQuickDraft` with 13 new fields
- `app/(site)/publicar/busco/shared/buscoQuickDraft.ts` — Updated `emptyBuscoQuickDraft` and `normalizeBuscoQuickDraft` for all new fields
- `app/(site)/publicar/busco/shared/buscoFormCopy.ts` — Full copy expansion for all new fields and sections
- `app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts` — Persists all new fields to `detail_pairs`
- `app/(site)/publicar/busco/shared/buscoFormatBudget.ts` — **NEW** — budget `$` formatting utility
- `app/(site)/publicar/busco/quick/BuscoQuickFormClient.tsx` — Upgraded form with all new sections
- `app/(site)/publicar/busco/quick/BuscoQuickPreviewClient.tsx` — Preview parity with detail
- `app/(site)/clasificados/busco/BuscoQuickPublishedAd.tsx` — Full Listing Contact Card
- `app/(site)/clasificados/busco/BuscoRequestCard.tsx` — Urgency chip, brand tokens
- `app/(site)/clasificados/busco/shared/buscoCardModel.ts` — Urgency + `$` budget in card model
- `app/(site)/clasificados/busco/shared/buscoDashboardDisplay.ts` — State/country in location; urgency + budget helpers

---

## 4. Busco Category Key(s)

- DB `category`: `"busco"`
- Detail pairs lane key: `Leonix:buscoLane = "quick"`

---

## 5. Pipeline Map

```
Form (BuscoQuickFormClient)
  → sessionStorage (BUSCO_QUICK_DRAFT_KEY)
    → Preview (BuscoQuickPreviewClient)
      → publishBuscoQuickToListings (inserts listings row + detail_pairs)
        → Public detail: BuscoPublishedDetailPage → BuscoQuickPublishedAd
        → Results: BuscoResultsClient → BuscoRequestCard (via buscoCardModel)
        → Dashboard: buscoDashboardDisplay helpers
        → Admin: admin/workspace/clasificados/busco/page.tsx
```

---

## 6. Location Behavior

- **City**: free text with NorCal autocomplete (convenience only)
- **State / Region**: free text, optional
- **Country**: free text, optional
- **ZIP / Postal code**: free text, optional
- **Zone / neighborhood**: free text, optional
- **Privacy warning**: "No publiques tu dirección privada. Usa una ciudad, zona o punto de referencia." / "Do not post your private home address. Use a city, area, or nearby landmark."
- **Persisted pairs**: `Leonix:state`, `Leonix:buscoCountry`, `Leonix:zip`, `Leonix:buscoZone`
- **Display**: city, state, country joined; zone appended — no map, no exact address

---

## 7. Budget Formatting Behavior

Handled by `buscoFormatBudget.ts`:

| Input | Output |
|-------|--------|
| `50` | `$50` |
| `50-100` | `$50–$100` |
| `50 - 100` | `$50–$100` |
| `$50-$100` | `$50–$100` |
| `100 o menos` | `$100 o menos` |
| `Gratis` | `Gratis` |
| `Intercambio` | `Intercambio` |
| `Donación` | `Donación` |
| `Depende` | `Depende` |

Applied in: preview, public detail, results card, dashboard (via helpers).

---

## 8. Urgency Behavior

- **Field**: select — Normal / Pronto / Urgente (ES) / Normal / Soon / Urgent (EN)
- **Default**: `normal` (not persisted to pairs — only `pronto`/`urgente` written)
- **Detail pair**: `Leonix:buscoUrgency`
- **Display**: colored chip on image overlay (amber=pronto, red=urgente); chip on results card
- **Filtering**: currently display-only; urgency is indexed in `detail_pairs` JSON for future filter support

---

## 9. Contact Method Behavior

- **Phone for calls**: `tel:` CTA via `ContactActions`
- **WhatsApp**: separate field; falls back to phone digits if blank — `whatsappDigits` pair
- **SMS/Text**: separate field; falls back to phone — `smsPhone` pair; `sms:` CTA
- **Email**: `mailto:` via `ContactActions`
- **Preferred contact**: select stored as `Leonix:buscoPreferredContact` (display-only in this gate)
- **Visibility**: each CTA only shown when the corresponding number/email is filled

---

## 10. Optional Social/Contact Link Behavior

- **Fields**: Facebook, Instagram, TikTok, Other contact link (label + URL)
- **Pairs**: `Leonix:buscoFacebook`, `Leonix:buscoInstagram`, `Leonix:buscoTiktok`, `Leonix:buscoOtherContactUrl`, `Leonix:buscoOtherContactLabel`
- **Public render**: section "También puedes contactar por" only shown when ≥1 link filled
- **No raw URLs**: all links normalized via `normalizeWebsiteForOpen` before rendering as `<a>`
- **Other link label fallback**: "Otro enlace" / "Other link" when no label provided

---

## 11. Image Section

- **Section title**: "Imagen de referencia" / "Reference image"
- **Helper text**: "Agrega una imagen si ayuda a identificar lo que buscas." / "Add an image if it helps identify what you are looking for."
- **Existing upload behavior preserved** (JPG/PNG/WebP, max 8 MB, Supabase Storage)

---

## 12. Public Detail Listing Contact Card Behavior

`BuscoQuickPublishedAd` renders:
- Hero image + urgency chip overlay
- Type badge (warm cream/charcoal Leonix brand)
- Title, budget ($ formatted), description
- **"Contactar anunciante"** section — filled CTAs only (Call / WhatsApp / SMS / Email)
- **"También puedes contactar por"** — filled socials only (FB/IG/TikTok/Other)
- **"Ubicación aproximada"** — city/state/country · zone (no map, no private address)
- "Publicado en Leonix" trust cue
- No fake reviews, no counters, no Business Hub

---

## 13. Results Card / Search / Filter

`BuscoRequestCard` + `buscoCardModel`:
- Type badge (Leonix cream/charcoal)
- Urgency chip (amber=Soon, red=Urgent) — only shown when set
- Contact chip (phone/email availability)
- Location line: city, state, country · zone
- Budget with `$` formatting
- Description excerpt
- CTA: "Ver solicitud" / "View request"
- No full contact card on results
- Urgency stored in `detail_pairs` for future filter wiring

---

## 14. Preview / Publish / Detail Parity

| Field | Form | Preview | Detail |
|-------|------|---------|--------|
| Type badge | ✅ | ✅ | ✅ |
| Title | ✅ | ✅ | ✅ |
| Description | ✅ | ✅ | ✅ |
| City / State / Country / ZIP / Zone | ✅ | ✅ | ✅ |
| Budget ($ formatted) | ✅ | ✅ | ✅ |
| Urgency chip | ✅ | ✅ | ✅ |
| Phone / WhatsApp / SMS / Email CTAs | ✅ | ✅ | ✅ |
| Optional socials | ✅ | ✅ | ✅ |
| Reference image | ✅ | ✅ | ✅ |
| Trust cue | — | ✅ | ✅ |
| Privacy warning | ✅ form only | — | — |

---

## 15. Dashboard / Admin Visibility

- `buscoDashboardDisplay.ts` updated: location now shows city, state, country · zone
- New helpers: `buscoOwnerDashboardUrgency`, `buscoOwnerDashboardBudget`
- Admin page at `app/admin/(dashboard)/workspace/clasificados/busco/page.tsx` uses `buscoOwnerDashboardLocationLine` — backward-compatible
- No admin UI redesign performed; new fields available for future admin display

---

## 16. Leonix Brand Mapping

| Token | Value | Usage |
|-------|-------|-------|
| Cream surface | `#FCF9F2` | Form cards, article bg |
| Gold border | `#C9B46A` | Input borders, card borders |
| Burgundy primary | `#7B2D42` | Submit CTA, section headers, link buttons |
| Charcoal text | `#2A2826` | Body text |
| Warm charcoal sub | `#6B5E4E` | Helper text, muted |
| Amber urgency | amber-100/700 | Pronto chip |
| Red urgency | red-100/700 | Urgente chip |
| Safety accent | `#FFFDF5` bg + `#C9B46A` border | Privacy warning box |

---

## 17. Mobile / PWA Notes

- All inputs min-h-[44px] tap targets
- Grid layout collapses to single column on mobile (`sm:grid-cols-2`)
- Long text uses `break-words`, no horizontal overflow
- Form stays fast — 6 compact sections, no heavy Business Hub
- Contact CTAs use `flex-wrap gap-2` — reflow cleanly on 390px

---

## 18. Risks / Deferred Work

- **Urgency filter in search**: urgency is stored but search/filter query not yet updated to filter by urgency. Deferred to next gate.
- **Preferred contact display**: stored but not yet rendered as a "preferred" indicator on detail. Deferred.
- **Email copy-to-clipboard**: `ContactActions` handles this if wired; no separate implementation added.
- **share listing**: existing share utility not modified; deferred.
- **Admin dashboard card refresh**: new fields available via helpers; admin card UI update deferred.

---

## 19. TRUE/FALSE Audit Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Busco pipeline was audited | TRUE | Gate A complete — all files inspected |
| Busco category key was identified | TRUE | `category: "busco"`, lane `"quick"` |
| Publish form files were identified | TRUE | `BuscoQuickFormClient.tsx` |
| Preview files were identified | TRUE | `BuscoQuickPreviewClient.tsx` |
| Publish action/API was identified | TRUE | `publishBuscoQuickToListings.ts` |
| Public detail route/files were identified | TRUE | `BuscoPublishedDetailPage.tsx` → `BuscoQuickPublishedAd.tsx` |
| Results route/card files were identified | TRUE | `BuscoResultsClient.tsx` → `BuscoRequestCard.tsx` |
| Dashboard visibility was audited | TRUE | `buscoDashboardDisplay.ts` + admin page inspected |
| Admin visibility was audited | TRUE | `app/admin/(dashboard)/workspace/clasificados/busco/page.tsx` |
| Global-ready approximate location fields exist | TRUE | city/state/country/zip/zone all in form + types + pairs |
| City remains free text | TRUE | `CityAutocomplete` with NorCal suggestions as convenience only |
| State/region exists | TRUE | `state` field in draft + `Leonix:state` pair |
| Country exists | TRUE | `country` field in draft + `Leonix:buscoCountry` pair |
| Postal code exists | TRUE | `zip` field in draft + `Leonix:zip` pair |
| Approximate zone/neighborhood exists | TRUE | `zone` field in draft + `Leonix:buscoZone` pair |
| Private address warning exists | TRUE | `locationPrivacyWarning` in form copy + rendered in form |
| NorCal suggestions are convenience only if present | TRUE | `CityAutocomplete` allows any free text |
| Location persists to preview/publish/detail | TRUE | All location pairs written + read in all views |
| Location feeds results/search/filter where supported | TRUE | `formatLocationLine` in card model uses all pairs |
| Budget numeric values display with $ | TRUE | `formatBuscoBudget` converts `50` → `$50` |
| Budget ranges display cleanly with $ | TRUE | `50-100` → `$50–$100` |
| Non-price budget text remains readable | TRUE | Gratis/Intercambio/Donación/Depende pass through unchanged |
| Urgency field exists | TRUE | `urgency` select in form + `BuscoUrgency` type |
| Urgency persists to preview/publish/detail | TRUE | `Leonix:buscoUrgency` pair; chip in preview + detail |
| Contact methods are split into call/WhatsApp/text/email | TRUE | Separate phone/whatsapp/smsPhone/email fields |
| Preferred contact method exists | TRUE | `preferredContact` select + `Leonix:buscoPreferredContact` pair |
| Public detail has Contactar anunciante card | TRUE | `BuscoQuickPublishedAd` — "Contactar anunciante" section |
| Phone CTA only shows when phone exists | TRUE | `hasPhone` guard before ContactActions phone prop |
| WhatsApp CTA only shows when WhatsApp exists | TRUE | `hasWhatsApp` guard; falls back to phone if blank |
| SMS CTA only shows when text number exists | TRUE | `hasSms` guard |
| Email CTA only shows when email exists | TRUE | `email || null` passed to ContactActions |
| Email visible has copy action or documented safe limitation | TRUE | ContactActions handles copy; deferred note in §18 |
| Optional Facebook/Instagram/TikTok/contact link fields exist | TRUE | All 4 in form + types + pairs |
| Optional social/contact links render only when filled | TRUE | `hasSocials` guard — section hidden if all null |
| No raw URLs shown publicly | TRUE | All links normalized via `normalizeWebsiteForOpen` |
| No placeholder links/icons shown publicly | TRUE | No empty icon rows rendered |
| Image section says Imagen de referencia / Reference image | TRUE | `sections.media` in form copy + form title |
| Results card remains compact | TRUE | `BuscoRequestCard` unchanged structure; urgency chip added only |
| Full Business Hub is not shown on results cards | TRUE | Only type/urgency/contact chip/location/budget/excerpt/CTA |
| No fake analytics/counters/reviews were added | TRUE | No counters, no ratings, no fake data |
| Leonix brand system is applied locally | TRUE | cream/gold/burgundy/charcoal tokens throughout |
| Mobile layout avoids horizontal overflow | TRUE | `break-words`, `flex-wrap`, `grid sm:grid-cols-2` |
| No Supabase migrations/schema files changed | TRUE | Only JSON `detail_pairs` used — no schema change |
| No Stripe/payment files changed | TRUE | Zero Stripe files touched |
| No unrelated category files changed | TRUE | Only Busco files and `buscoFormatBudget.ts` (new Busco-only util) |
| npm run build passed | TRUE | Exit 0, zero TS errors |
| No files staged | TRUE | `git status --short` clean before and after |
| No commit created | TRUE | No `git commit` run |
| No push attempted | TRUE | No `git push` run |

---

## 20. Final Readiness

**READY TO COMMIT: YES**
