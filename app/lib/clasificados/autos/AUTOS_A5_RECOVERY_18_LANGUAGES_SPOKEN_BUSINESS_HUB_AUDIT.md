# A5.RECOVERY-18 — Autos Negocios Languages Spoken Business Hub Gate

## 1. Gate title

A5.RECOVERY-18 — Autos Negocios Business Information: Languages Spoken Chips Gate

## 2. Repo confirmation

| Field | Value |
|-------|-------|
| Repo root | `C:/projects/elaguila-website` |
| Remote | `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `0de2cd2170e8d2d5f085b0d0c2b517001083d474` |

## 3. Files inspected

| Area | Files |
|------|--------|
| Step 5 form | `AutosNegociosApplication.tsx`, `AutosDealerLanguagesField.tsx` |
| Copy | `autosNegociosCopy.ts` |
| Types / normalize | `autoDealerListing.ts`, `autoDealerDraftDefaults.ts` |
| Language helpers | `autosDealerLanguages.ts` |
| Business Hub | `mapAutosDealerToBusinessHubContact.ts`, `DealerBusinessStack.tsx` |
| Child inheritance | `autosInventoryInheritedPreview.ts`, `AutosInventoryInheritedDealerStep.tsx`, `autosDealerInventoryAddFlow.ts` |
| Draft persistence | Session draft via A5.RECOVERY-17 (full listing JSON) |
| Publish payload | `autosListingPayloadPersistence.ts` (pass-through JSON field) |

## 4. Files changed

- `app/lib/clasificados/autos/autosDealerLanguages.ts` (new)
- `app/(site)/publicar/autos/shared/components/AutosDealerLanguagesField.tsx` (new)
- `app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts`
- `app/(site)/clasificados/autos/negocios/lib/autoDealerDraftDefaults.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts`
- `app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts`
- `app/(site)/clasificados/autos/negocios/lib/autosNegociosBusinessHubContactTypes.ts`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx`
- `app/lib/clasificados/autos/autosInventoryInheritedPreview.ts`
- `app/lib/clasificados/autos/autosAdditionalInventoryDraft.ts`
- `app/lib/clasificados/autos/autosDealerInventoryAddFlow.ts`
- `scripts/autos-a5-recovery-18-languages-spoken-business-hub-audit.ts` (new)
- `package.json` (audit script only)

## 5. Business information languages field result

**PASS** — Step 5 includes “Idiomas que hablamos” / “Languages we speak” with preset chips (Español, English, Otro) and selected-language chip list.

## 6. Custom language result

**PASS** — Selecting Otro reveals custom input + “Añadir idioma” / “Add language”. Empty and duplicate custom values blocked. Custom labels stored as typed (e.g. Portugués). “Otro” is never stored as a language value.

## 7. Max 3 limit result

**PASS** — `AUTOS_DEALER_LANGUAGES_MAX = 3`; preset toggles and custom add respect limit; limit copy shown when full.

## 8. Draft/session persistence result

**PASS** — `dealerLanguages` lives on `AutoDealerListing`, normalized in `normalizeLoadedListing`, persisted in existing session draft JSON (A5.RECOVERY-17). No refresh/persistence logic changed.

## 9. Preview/public Business Hub result

**PASS** — `mapAutosDealerToBusinessHubContact` outputs `languages`; `DealerBusinessStack` renders chip row under “Idiomas” / “Languages”. Section hidden when empty.

## 10. Added inventory inheritance result

**PASS** — `dealerLanguages` in inherited parent field groups; child Step 5 preview shows parent languages; child drawer blocklist includes `dealerLanguages`; `mapInheritedDealerPreviewListing` spreads parent dealer data.

## 11. Privado/shared guardrail result

**PASS** — No `AutosDealerLanguagesField` or languages form in Privado. Shared renderer only maps output when field present on Negocios listing data.

## 12. Build/check result

See STEP 9 validation output.

## 13. Remaining risks

- Language labels are free-text for custom entries (no taxonomy validation beyond length/dedupe).
- Public display uses stored labels as-is (Español/English presets fixed strings).

## 14. Manual QA checklist

See gate STEP 10 response.

## 15. TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|-------------|------------|----------|
| Correct repo confirmed | TRUE | git rev-parse |
| Autos Negocios scope respected | TRUE | Scope audit |
| Business information flow inspected | TRUE | §3 |
| Languages field added to Step 5 | TRUE | `AutosDealerLanguagesField` in application |
| Español option exists | TRUE | Preset chip + copy |
| English option exists | TRUE | Preset chip + copy |
| Otro option exists | TRUE | Preset Other/Otro chip |
| Otro opens custom language input | TRUE | `otherOpen` panel |
| Custom language can be added | TRUE | `addAutosDealerCustomLanguage` |
| Empty custom language is blocked | TRUE | `reason: "empty"` |
| Duplicate language is blocked | TRUE | case-insensitive dedupe |
| Max 3 languages enforced | TRUE | `AUTOS_DEALER_LANGUAGES_MAX` |
| Selected languages display as chips in form | TRUE | Selected chip list |
| Chips can be removed if supported | TRUE | Remove × on each chip |
| “Otro” does not render publicly without custom text | TRUE | Otro never stored; output uses `dealerLanguagesForOutput` |
| Languages persist through step navigation | TRUE | Listing state + draft autosave |
| Languages persist through refresh/session draft | TRUE | `dealerLanguages` in session draft JSON |
| Languages persist through preview/back | TRUE | Full listing in draft |
| Languages map to listing_payload | TRUE | JSON field on `AutoDealerListing` |
| Preview Business Hub shows language chips | TRUE | `DealerBusinessStack` |
| Public Business Hub shows language chips | TRUE | Same stack on live detail |
| Empty languages section hides | TRUE | `showLanguages` guard |
| Added inventory child inherits parent languages | TRUE | Inherited field group + preview |
| No dealer-only features leaked to Privado | TRUE | Privado app grep |
| No unrelated categories touched | TRUE | Scope audit |
| No global Stripe/payment touched | TRUE | Scope audit |
| No schema/migration touched | TRUE | JSON-only field |
| npm run build passed | TRUE | STEP 9 build |

## 16. Final recommendation

Final recommendation: **GREEN**
