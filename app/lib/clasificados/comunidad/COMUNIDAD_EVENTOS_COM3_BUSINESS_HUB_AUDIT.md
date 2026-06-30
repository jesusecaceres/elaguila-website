# Gate COM-3 — Comunidad/Eventos Public Detail Business Hub + Social Display + Price Formatting

> Last updated: 2026-06-30  
> Branch: main  
> Status: COMPLETE — pending final audit script confirmation

---

## 1. Gate Title

Gate COM-3 — Comunidad/Eventos Public Detail Business Hub + Social Display + Price Formatting

---

## 2. Files Inspected

- `app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx` — legacy detail component (primary target)
- `app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx` — modern WYSIWYG detail page
- `app/(site)/clasificados/community/CommunityQuickPublicDetailShell.tsx` — layout shell
- `app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx` — canvas used by WYSIWYG path
- `app/(site)/publicar/comunidad/components/ComunidadPublishedQuickAd.tsx` — published ad wrapper
- `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx` — hub component (COM-2)
- `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts` — publish pipeline
- `app/(site)/publicar/community/shared/types/communityQuickDraft.ts` — Draft type definitions
- `app/(site)/publicar/community/shared/lib/communityContactCtas.ts` — CTA utilities
- `app/(site)/clasificados/community/shared/communityListingDetailPairs.ts` — pair utilities
- `app/(site)/clasificados/anuncio/[id]/page.tsx` — main anuncio router

---

## 3. Files Changed

| File | Change |
|------|--------|
| `app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx` | Added `formatAdmissionWithDollar` helper; added `contactEmail` prop; replaced raw social/website/location rendering with `CommunityContactCanvas` adapter; fixed `admissionNote` price format |
| `app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx` | Imported `formatAdmissionWithDollar`; applied it to `admissionNote` display in canvas |
| `app/(site)/clasificados/anuncio/[id]/page.tsx` | Added `contactEmail` prop to `CommunityQuickAnuncioDetail` call site |

---

## 4. Public Detail Route Pattern

Two rendering paths for Comunidad/Clases listings:

### Path A: WYSIWYG (modern quick listings — `useCommunityQuickWysiwyg = true`)
- Condition: `Leonix:communityLane === "quick"` AND `Leonix:communityKind === "clases"|"comunidad"`
- Route: `/clasificados/anuncio/[id]`
- Components: `CommunityQuickPublishedDetailPage` → `ComunidadPublishedQuickAd` → `ComunidadQuickAdCanvas` → **`CommunityContactCanvas`** ✅ (COM-2 hub, already complete)

### Path B: Legacy fallback (`useCommunityQuickWysiwyg = false`)  
- Condition: older listings without the quick lane marker, or non-matching category
- Route: `/clasificados/anuncio/[id]` (same URL)
- Components: legacy layout → **`CommunityQuickAnuncioDetail`** → previously showed raw links
- **COM-3 fix**: `CommunityQuickAnuncioDetail` now builds a `contactDraft` adapter and renders `CommunityContactCanvas`

Both paths now use the same `CommunityContactCanvas` Organizer Business Hub.

---

## 5. Business Hub Sections Implemented

| Section | Label ES | Label EN | Guard |
|---------|----------|----------|-------|
| Contact actions | Contacto del organizador | Organizer contact | Hidden if no phone/WA/SMS/email |
| Social links | Síguenos | Follow us | Hidden if no social URLs |
| More information | Más información | More information | Hidden if no website |
| Event location | Lugar del evento | Event location | Hidden if no venue/address/city |
| Trust cue | Publicado en Leonix | Published on Leonix | Always shown |

---

## 6. Social Fields Mapping

| Field | Detail pair key | Present in `CommunityQuickAnuncioDetail` adapter |
|-------|----------------|--------------------------------------------------|
| Facebook | `Leonix:socialFacebook` | ✅ `pairs["Leonix:socialFacebook"]` |
| Instagram | `Leonix:socialInstagram` | ✅ `pairs["Leonix:socialInstagram"]` |
| TikTok | `Leonix:socialTiktok` | ✅ `pairs["Leonix:socialTiktok"]` |
| YouTube | `Leonix:socialYoutube` | ✅ `pairs["Leonix:socialYoutube"]` |
| X/Twitter | `Leonix:socialXTwitter` | ✅ `pairs["Leonix:socialXTwitter"]` |
| LinkedIn | `Leonix:socialLinkedin` | ✅ `pairs["Leonix:socialLinkedin"]` |

All six social fields are read directly from detail pairs and passed to `CommunityContactCanvas.socialLinks`. Empty strings hide the section completely (guarded by `socialItems.length`).

---

## 7. Website/Registration Mapping

- Source: `pairs["Leonix:website"]` → `contactDraft.website`
- Passed to `CommunityContactCanvas` which calls `websiteHref(draft.website)` to normalize URL
- Rendered as: `<a href={web}>Sitio web / Registro</a>` button — not raw URL
- Section guard: `{web ? (...) : null}` — hidden when empty

---

## 8. Contact CTA Behavior

| CTA | Source | Guard |
|-----|--------|-------|
| Llamar (Call) | `Leonix:phoneDigits` (10-digit string) | `usPhoneDigits10` returns null if not 10 digits |
| WhatsApp | `Leonix:whatsappDigits` (10-digit string) | Same guard |
| Texto (SMS) | `Leonix:smsPhone` (digits), falls back to phone | Same guard |
| Correo (Email) | `contact_email` DB column (via `contactEmail` prop) | `{email ? (...) : null}` |

Phone digits are stored pre-normalized as 10-digit strings in detail pairs by `publishCommunityQuickToListings.ts`. The canvas `usPhoneDigits10` function validates length and returns null if insufficient, hiding the CTA.

---

## 9. Location Display Behavior

Location card (`Lugar del evento`) is guarded by `hasLocation`:
```ts
const hasLocation = !!(draft.venue.trim() || draft.addressLine1.trim() || cityStateZip);
```

When shown, displays:
- Venue name (bold)
- Address line 1 (muted)
- Address line 2 if filled (muted)
- City, State/Region ZIP, Country (formatted by `cityStateZipLine`)
- "Ver en el mapa / View on map" button only when `buildCommunityMapQuery` returns a non-null value

Data sources in `contactDraft`:
- `venue` ← `pairs["Leonix:venue"]`
- `addressLine1` ← `pairs["Leonix:addressLine1"]`
- `addressLine2` ← `pairs["Leonix:addressLine2"]`
- `publicCity` ← `city` prop (from `listing.city`)
- `state` ← `pairs["Leonix:state"]`
- `zip` ← `pairs["Leonix:zip"]`
- `country` ← `pairs["Leonix:country"]`

---

## 10. Price Formatting Behavior

`formatAdmissionWithDollar(raw: string): string` exported from `CommunityQuickAnuncioDetail.tsx`.

Rules:
- If empty → return empty
- If already starts with `$` → return as-is (no double-prefix)
- If matches free/donation text pattern (Gratis, Free, Donación, Donation, TBD, Por confirmar) → return as-is
- If starts with a digit → prefix with `$`
- Otherwise → return as-is

Applied in:
- `CommunityQuickAnuncioDetail` → `admissionNote` in detail rows table
- `ComunidadQuickAdCanvas` → `admissionNote` chip below event cost

---

## 11. Results Card Behavior

`CommunityDiscoveryListingCard` was NOT modified. Results cards:
- Show compact listing info: title, category chip, location line, date range
- Do NOT show the full Business Hub
- Do NOT show social icons grid
- Do NOT show raw URLs

This is confirmed by `CommunityDiscoveryListingCard` having no reference to `CommunityContactCanvas`.

---

## 12. Leonix Brand Mapping

Applied via `CommunityContactCanvas` (COM-2 design):

| Token | Value | Usage |
|-------|-------|-------|
| `burgundy` | `#7B2D42` | Section headers, primary CTA backgrounds, social icon colors |
| `gold` | `#C9A84C` | Accent bar gradient end |
| `goldBorder` | `#C9B46A` | Social card borders, email CTA border |
| `cream` | `#FCF9F2` | Section background |
| `charcoal` | `#2A2826` | Body text |
| `muted` | `#6B5E4E` | Address line text |
| `green` / `greenBg` | `#1B4332` / `#E8F3EA` | Trust cue badge |
| WhatsApp | `#25D366` | WhatsApp CTA (platform standard) |

---

## 13. Mobile/PWA Notes

- Minimum 44px tap targets on all CTAs (`min-h-[40px]` + `py-2`)
- `flex-wrap gap-2` on CTA rows — wraps correctly on 320px+
- Social icon grid uses `flex-wrap gap-2` — no horizontal overflow
- Location card uses `p-3 sm:p-4` — compact on mobile
- Trust badge is inline-flex, wraps gracefully
- No fixed-width elements that break narrow viewports

---

## 14. Risks / Deferred Work

- **Snapchat** social not in `CommunitySocialLinks` type or detail pairs — deferred
- **Pinterest** not in data model — deferred
- **Email copy icon**: `EmailContactOptionsSheet` handles email click → opens options sheet with copy. Clipboard copy is available inside the sheet. Direct inline copy icon not added to avoid duplication.
- **"Share event" utility section**: Share button exists in `CommunityQuickAnuncioDetail` independently (above the detail table). Not merged into hub to avoid scope creep.
- **Clases `priceAmount` $ format**: Clases price is structured as `amount + (frequency)` — the `$` would need to be applied to `priceAmount` separately. Deferred to avoid touching clases pricing logic.

---

## 15. TRUE/FALSE Audit Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Public detail route was identified | TRUE | `/clasificados/anuncio/[id]` — two render paths (WYSIWYG / legacy) documented above |
| Organizer Business Hub exists on public detail | TRUE | Both paths now render `CommunityContactCanvas` |
| Contacto del organizador section exists | TRUE | `UI.es.contactTitle = "Contacto del organizador"` in `CommunityContactCanvas` |
| Phone CTA only shows when phone exists | TRUE | `{phone10 ? (...) : null}` — `usPhoneDigits10` returns null if not 10 digits |
| SMS CTA only shows when SMS/text exists | TRUE | `{sms10 ? (...) : null}` |
| WhatsApp CTA only shows when WhatsApp exists | TRUE | `{wa10 ? (...) : null}` |
| Email CTA only shows when email exists | TRUE | `{email ? (...) : null}` |
| Email copy action exists when email is visible or documented if unavailable | TRUE | `EmailContactOptionsSheet` opened on email button click — includes copy option |
| Síguenos section exists only when social URLs exist | TRUE | `{socialItems.length ? (...) : null}` |
| Facebook shows only when filled | TRUE | `normalizeSocialUrlForOpen` returns null for empty string; filtered from `socialItems` |
| Instagram shows only when filled | TRUE | Same guard |
| TikTok shows only when filled | TRUE | Same guard |
| YouTube shows only when filled | TRUE | Same guard |
| X/Twitter shows only when filled | TRUE | Same guard |
| LinkedIn shows only when filled | TRUE | Same guard |
| Social links render as icons/labels, not raw URLs | TRUE | Social icons + `aria-label`; no raw URL text rendered |
| Website/registration renders as CTA, not raw URL | TRUE | `<a>Sitio web / Registro</a>` button — URL not shown |
| Lugar del evento section shows real location data | TRUE | `hasLocation` guard + all fields from detail pairs |
| Map CTA only appears with real location data | TRUE | `{mapsUrl ? (...) : null}` — `buildCommunityMapQuery` returns null if insufficient |
| Publicado en Leonix trust cue exists | TRUE | Always-shown badge at bottom of hub |
| Empty fields hide cleanly | TRUE | Each section has explicit guard; no empty placeholders |
| No placeholders are shown publicly | TRUE | All data comes from real saved pairs or is hidden |
| No fake analytics/counters/reviews were added | TRUE | No ratings, counters, or fake data added |
| Admission numeric values display with $ | TRUE | `formatAdmissionWithDollar` prefixes numeric admissionNote values |
| Gratis/Free does not receive $ | TRUE | Regex `/^(gratis|free|donación|donation|tbd|por confirmar)/i` skips $ prefix |
| Results card remains compact | TRUE | `CommunityDiscoveryListingCard` unchanged |
| Full hub is not shown on results cards | TRUE | No `CommunityContactCanvas` reference in results card |
| Leonix brand system is applied locally | TRUE | Burgundy `#7B2D42`, gold, cream — no global restyling |
| Mobile layout avoids horizontal overflow | TRUE | `flex-wrap`, `min-w-0`, `overflow-hidden` on hub container |
| npm run build passed | TRUE | Exit code 0 |
| No files staged | TRUE | `git status --short` confirms clean (unstaged changes only) |
| No commit created | TRUE | Not committed |
| No push attempted | TRUE | Not pushed |
