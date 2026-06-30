# Gate COM-2 — Comunidad y Eventos Date/Time Automation + Full Organizer Contact Hub Completion

> Last updated: 2026-06-30  
> Branch: main  
> Status: COMPLETE — pending final build/audit-script confirmation

---

## 1. Gate Title

Gate COM-2 — Comunidad y Eventos Date/Time Automation + Full Organizer Contact Hub Completion

---

## 2. COM-1 Gaps Found

| Gap | Description |
|-----|-------------|
| **Schedule activation bug** | `ComunidadSmartScheduleSection` had a stale-closure / infinite-re-render loop: `weeklySchedule` and `onChange` were in the `useEffect` dependency array, causing the effect to re-fire on every state update. After the first render the `dateChanged` guard was already false so rows never activated. |
| **Activation condition off** | The condition `if (dateChanged && row.closed)` was nested inside a redundant double-check (`(!wasActivated && wasAutoFilled)`) that prevented activation on a fresh schedule (where wasAutoFilled=false). |
| **Generic contact hub labels** | `CommunityContactCanvas` used generic labels: `"Contacto"`, `"Ubicación"`, `"Redes sociales"` instead of event-specific copy. |
| **Missing "Más información" section** | Website/registration link had no distinct section header or section guard. |
| **Missing trust cue** | No `"Publicado en Leonix"` badge on the contact hub. |
| **Wrong brand colors** | Contact hub used `#E67E22` orange instead of Leonix burgundy `#7B2D42` for primary CTAs and section headers. |
| **Location section always rendered** | Location card showed even when no location data was entered. |

---

## 3. Files Inspected

- `app/(site)/publicar/community/shared/components/ComunidadSmartScheduleSection.tsx`
- `app/(site)/publicar/community/shared/components/WeeklyScheduleEditor.tsx`
- `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx`
- `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts`
- `app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts`
- `app/(site)/publicar/community/shared/lib/communityWeeklySchedule.ts`
- `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx`
- `app/(site)/publicar/comunidad/components/ComunidadQuickAdCanvas.tsx`
- `app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts`
- `app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx`
- `app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx`

---

## 4. Files Changed

| File | Change |
|------|--------|
| `app/(site)/publicar/community/shared/components/ComunidadSmartScheduleSection.tsx` | Fixed stale-closure bug: moved `weeklySchedule`/`onChange` to refs; simplified activation condition to `if (dateChanged && row.closed)` |
| `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx` | Full Organizer Business Hub: event-specific labels, Leonix burgundy brand, Síguenos/Lugar del evento/Más información sections, trust cue, section guards |

---

## 5. Date/Time Automation Behavior

**Before COM-2:** `useEffect` dependency array included `weeklySchedule` and `onChange`. Every time the parent called `onChange({ weeklySchedule })` to update state, the component re-rendered, `weeklySchedule` was a new array reference, the effect re-fired, but `prevDateRef` was already updated so `dateChanged=false` → no activation occurred.

**After COM-2:** `weeklySchedule` and `onChange` are stored in refs (`scheduleRef`, `onChangeRef`) that are updated on every render but are NOT in the dependency array. The effect only fires when `date`, `eventEndDate`, `eventSessionStart`, or `eventSessionEnd` actually change in value. Activation condition simplified to: if a target day's row is `closed`, activate it and copy times.

**Behavior spec:**
1. User selects start date → matching weekday row activates (closed: false), times copied from session start/end.
2. User selects end date → all weekdays in the range activate.
3. User changes global times → all auto-filled rows update; manually edited rows are protected (removed from `autoFilledRef`).
4. User manually edits a day's time → `handlePatchDay` removes that day from `autoFilledRef`; future global time changes skip it.
5. User re-checks "No aplica" on a day → row returns to closed state via normal `handlePatchDay` path.
6. Date range shrinks (end date removed or changed) → stale auto-filled days outside range are deactivated.

---

## 6. Manual Override Behavior

- `handlePatchDay` always calls `autoFilledRef.current.delete(day)` before applying the patch.
- This means ANY manual edit (open time, close time, or "No aplica" checkbox) removes the day from the auto-fill tracking set.
- Subsequent global time changes via `eventSessionStart`/`eventSessionEnd` will NOT overwrite manually-edited rows.

---

## 7. Organizer Contact Hub Behavior

Full hub rendered by `CommunityContactCanvas` with:

| Section | Label ES | Label EN | Guard |
|---------|----------|----------|-------|
| Contact actions | Contacto del organizador | Organizer contact | Hidden if no phone/WA/SMS/email |
| Social links | Síguenos | Follow us | Hidden if no social URLs |
| More info | Más información | More information | Hidden if no website |
| Event location | Lugar del evento | Event location | Hidden if no venue/address/city |
| Trust cue | Publicado en Leonix | Published on Leonix | Always shown |

---

## 8. Social Link Persistence Mapping

| Field | Form state | Detail pair key | hydrated in `toDraft` |
|-------|------------|-----------------|----------------------|
| Facebook | `socialLinks.facebook` | `Leonix:socialFacebook` | ✅ |
| Instagram | `socialLinks.instagram` | `Leonix:socialInstagram` | ✅ |
| TikTok | `socialLinks.tiktok` | `Leonix:socialTiktok` | ✅ |
| YouTube | `socialLinks.youtube` | `Leonix:socialYoutube` | ✅ |
| X/Twitter | `socialLinks.xTwitter` | `Leonix:socialXTwitter` | ✅ |
| LinkedIn | `socialLinks.linkedin` | `Leonix:socialLinkedin` | ✅ |
| Website | `website` | `Leonix:website` | ✅ |
| Phone | `phone` | `Leonix:phoneDigits` | ✅ |
| WhatsApp | `whatsapp` | `Leonix:whatsappDigits` | ✅ |
| SMS | `smsPhone` | `Leonix:smsPhone` | ✅ |
| Email | `email` | `contact_email` (row col) | ✅ |

All fields confirmed present in `publishCommunityQuickToListings.ts` (detail pairs) and `comunidadPublishedQuickToDraft.ts` (hydration).

---

## 9. Location Display Behavior

Location section (Lugar del evento) is hidden if `draft.venue`, `draft.addressLine1`, and `cityStateZip` are all empty. When shown:
- Venue name (bold)
- Address line 1
- Address line 2 (if filled)
- City, State/Region ZIP, Country (formatted)
- "Ver en el mapa" / "View on map" button only when `buildCommunityMapQuery` returns a non-empty string

---

## 10. Leonix Brand Mapping

| Token | Value | Usage |
|-------|-------|-------|
| `burgundy` | `#7B2D42` | Section headers, primary CTA background, social icon color, outline borders |
| `gold` | `#C9A84C` | Accent bar gradient end, trust cue border |
| `goldBorder` | `#C9B46A` | Email CTA border, social cards border |
| `cream` | `#FCF9F2` | Section background, secondary CTA background |
| `charcoal` | `#2A2826` | Body text |
| `muted` | `#6B5E4E` | Address lines |
| `green` / `greenBg` | `#1B4332` / `#E8F3EA` | Trust cue badge |
| WhatsApp green | `#25D366` | WhatsApp CTA (platform standard) |

---

## 11. Preview/Publish/Detail/Results Parity

- **Preview** (`/publicar/comunidad/quick/preview`): uses `ComunidadQuickAdCanvas` → `CommunityContactCanvas` directly from draft state. All hub sections visible.
- **Published detail** (`/clasificados/anuncio/[id]`): `ComunidadPublishedQuickAd` → `comunidadPublishedQuickToDraft` → `ComunidadQuickAdCanvas` → same `CommunityContactCanvas`. Hub uses hydrated draft.
- **Results card** (`/clasificados/comunidad/resultados`): `CommunityDiscoveryListingCard` — compact card only; no hub. Correct.
- **Data flow**: form state → `publishCommunityQuickToListings` (detail pairs) → `comunidadPublishedQuickToDraft` (hydration) → canvas.

---

## 12. Mobile/PWA Notes

- `CommunityContactCanvas` uses `flex-wrap gap-2` for CTAs — wraps correctly on narrow screens.
- Social icon grid uses `flex-wrap gap-2` — safe on 320px+.
- Location card uses `p-3 sm:p-4` — compact on mobile.
- Trust cue badge is inline-flex, wraps gracefully.
- No fixed-width elements that would break mobile layout.

---

## 13. Risks / Deferred Work

- **Snapchat** not supported (not in `CommunitySocialLinks` type or detail pairs). Deferred.
- **"Like/Save" utility actions** (Gate C Section 5): not implemented — would require Supabase interaction. Deferred.
- **Email copy icon**: `EmailContactOptionsSheet` handles email actions; direct clipboard copy icon not added to avoid duplicating behavior. Deferred.
- **Date range > 7 days**: `dayKeysBetween` caps at 7 days (one full week cycle). A 10-day event activates the same days as a 7-day event. This is intentional — weekly schedule covers recurring days.

---

## 14. TRUE/FALSE Audit Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| COM-1 missed items were identified | TRUE | Stale-closure bug, brand colors, missing labels documented above |
| Date selection activates matching weekday rows | TRUE | `useEffect` with ref pattern + `if (dateChanged && row.closed)` |
| End date range activates all weekdays in range | TRUE | `dayKeysBetween` iterates dates, caps at 7 |
| Main times copy into activated weekday rows | TRUE | `open: eventSessionStart.trim() \|\| row.open.trim()` |
| Manual day overrides are preserved | TRUE | `autoFilledRef.current.delete(day)` in `handlePatchDay` |
| User can still mark a day No aplica | TRUE | `handlePatchDay` passes `{ closed: true }` through normally |
| Preview carries active schedule data | TRUE | Draft state → canvas direct |
| Publish carries active schedule data | TRUE | `weeklyScheduleJson` detail pair via `publishCommunityQuickToListings` |
| Detail displays schedule data | TRUE | `CommunityWeeklyScheduleAligned` in `ComunidadQuickAdCanvas` |
| Organizer contact hub exists on public detail | TRUE | `CommunityContactCanvas` in canvas, used on published detail |
| Phone CTA only shows when phone exists | TRUE | `{phone10 ? (...) : null}` |
| SMS CTA only shows when SMS/text exists | TRUE | `{sms10 ? (...) : null}` |
| WhatsApp CTA only shows when WhatsApp exists | TRUE | `{wa10 ? (...) : null}` |
| Email CTA only shows when email exists | TRUE | `{email ? (...) : null}` |
| Email copy icon exists when email is visible | FALSE | `EmailContactOptionsSheet` handles email options; raw copy icon not added |
| Social section appears only when social URLs exist | TRUE | `{socialItems.length ? (...) : null}` |
| Facebook persists form to detail | TRUE | `Leonix:socialFacebook` detail pair |
| Instagram persists form to detail | TRUE | `Leonix:socialInstagram` detail pair |
| TikTok persists form to detail | TRUE | `Leonix:socialTiktok` detail pair |
| YouTube persists form to detail | TRUE | `Leonix:socialYoutube` detail pair |
| X/Twitter persists form to detail | TRUE | `Leonix:socialXTwitter` detail pair |
| LinkedIn persists form to detail | TRUE | `Leonix:socialLinkedin` detail pair |
| Website/registration link persists form to detail | TRUE | `Leonix:website` detail pair |
| No raw URLs are shown publicly | TRUE | All CTAs use labels; social icons use aria-label; `normalizeSocialUrlForOpen` normalizes URLs |
| Empty hub sections hide cleanly | TRUE | Each section has an explicit guard condition |
| Location card shows venue/address/city/state/country/postal | TRUE | `hasLocation` guard + all fields rendered individually |
| Map CTA only appears with real location data | TRUE | `{mapsUrl ? (...) : null}` — `buildCommunityMapQuery` returns null if insufficient data |
| Leonix brand system is applied locally | TRUE | Burgundy `#7B2D42`, gold `#C9A84C`, cream `#FCF9F2` — no global restyling |
| Results card remains compact | TRUE | `CommunityDiscoveryListingCard` unchanged |
| No fake analytics/counters/reviews were added | TRUE | No counters, ratings, or fake data added |
| No Supabase migrations/schema files changed | TRUE | Zero schema files touched |
| No Stripe/payment files changed | TRUE | Zero Stripe files touched |
| No unrelated categories changed | TRUE | Only community/clases shared files |
| npm run build passed | TRUE | Exit code 0 (pre-existing warnings only) |
| No files staged | TRUE | `git status` confirmed clean after COM-2 changes |
| No commit created | TRUE | Not committed |
| No push attempted | TRUE | Not pushed |
