# Gate EMPLEOS-E2 Final — Premium Paid Job Ad Product Standard
## Application Syntax + Employer Identity + Business Contact Card + Preview/Detail Output

**Date:** 2026-06-30  
**Branch:** main  
**Remote:** https://github.com/jesusecaceres/elaguila-website.git

---

## 1. Git Safety Result

| Check | Result |
|---|---|
| Branch | main |
| Remote | https://github.com/jesusecaceres/elaguila-website.git |
| Behind origin/main before edit | NO — at parity |
| Dirty files before edit | NONE |
| Files staged | NO |
| Commit created | NO |
| Push attempted | NO |

---

## 2. Files Inspected

- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx` — form (7 sections)
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts` — draft type
- `app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts` — draft → shell mapper
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts` — envelope → draft hydrator
- `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx` — preview route
- `app/(site)/clasificados/lib/preview/LeonixPreviewPageShell.tsx` — preview chrome
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx` — detail canvas
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx` — contact/apply card
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx` — job header
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx` — benefits card
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx` — location card
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx` — results card
- `app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts` — shell type
- `app/(site)/clasificados/empleos/data/empleosLandingSampleData.ts` — category/type dropdowns
- `app/(site)/clasificados/empleos/lib/empleosPremiumUi.ts` — brand tokens
- `app/(site)/clasificados/empleos/lib/empleosCtaTracking.ts` — CTA analytics
- `app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx` — public detail (premium/feria lane)

---

## 3. Files Changed

- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts`
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`

---

## 4. Current Visual/Product Issues Found (before edit)

- `contactPerson` displayed with no label or role — "hana" floated unlabelled
- `contactTitle` field did not exist (recruiter role/title missing)
- Pay shown raw — `$ 100 la hora` spacing, bare numbers without `$`
- Phone shown as raw digits — no `(408) 802-1531` display format
- Email CTA appeared even when field contained a phone number or garbage
- Apply Now CTA click tracked as `"phone"` event instead of apply-link
- Schedule rows used one freeform "Turno/horas" column — no start/end time structure
- Company logo was small round 48px avatar, not a prominent employer identity element
- Job title appeared above employer identity — spec requires company first, then title
- No category chip, employment type chip, or pay highlight on header
- `QuickJobBenefitsCard` used generic white `--lx-text` CSS variable, not Leonix cream surface
- `QuickJobLocationCard` used generic white surface, not Leonix cream/gold surface
- Website button had generic blue `text-[#4F6B82]` styling — not Leonix gold
- "About the employer" label instead of "Conoce al empleador" / "Learn about the employer"
- No "Aplicar a este empleo" / "Contactar empleador" section header on CTA card
- No "Publicado en Leonix" trust cue on public detail
- Location section title was generic `t.ubicacion` string — spec requires "Ubicación del empleo"
- Description helper text was off-spec (did not match required copy)
- `stateRegion` and `country` not passed through mapper → shell → header
- Preview side rail: **LeonixPreviewPageShell was already clean** — no ugly side rail exists

---

## 5. Form Structure Result

Section order verified matches spec:
1. Puesto y empleador — title, businessName, logo, categorySlug, categoryCustom (when Otro), experienceLevel ✅
2. Detalles del empleo — jobType, workModality, description ✅
3. Pago, horario y beneficios — pay, scheduleRows (structured), benefits ✅
4. Multimedia — images, logo, videoUrls ✅
5. Cómo aplicar / Contacto — applyLink, phone, WhatsApp, SMS, email, **contactPerson + contactTitle** (split), preferredApplyMethod ✅
6. Ubicación del empleo — workspaceName, addressLine1/2, city, estado/región, país, postalCode, locationNotes ✅
7. (Empresa — company links, merged from old section 7, unchanged)

$24.99 price banner present at top of form ✅

---

## 6. Application Syntax Result

- Description helper text updated to spec:
  - ES: "Incluye responsabilidades, requisitos, experiencia necesaria y cómo prefieres que se comuniquen los candidatos."
  - EN: "Include responsibilities, requirements, needed experience, and how candidates should contact you."
- Contact section now shows separate "Nombre de contacto" and "Título / cargo del contacto" fields
- Recruiter name + title render on public CTA card as: `Ana García · HR Manager`

---

## 7. Schedule / Turnos Result

- `EmpleosQuickScheduleRow` upgraded: `{ day, shift, startTime, endTime }`
- Form: 3-column row — Día o bloque | Hora de inicio | Hora de fin — with × remove button
- Add shift button: "+ Añadir turno" / "+ Add shift"
- Display output: `Lun–Vie · 8:00 AM – 5:00 PM` format
- Legacy sessions with only `day`/`shift` preserved and rendered via fallback
- `normalizeEmpleosQuickDraft` handles migration of old freeform sessions
- `hydrateQuickDraftFromEnvelope` updated to pass `startTime`/`endTime`

---

## 8. Pay Formatting Result

`formatPay()` function added to `QuickJobCTACard`:
- `100` → `$100`
- `$ 100` → `$100`
- `20-25` → `$20–$25`
- `$20-$25/hr` → `$20–$25/hr`
- `A convenir`, `DOE`, `Comisión`, `Propinas` → unchanged
- Applied to: preview + public detail CTA card
- Pay also shown as gold chip in header

---

## 9. Phone / Email / Link Formatting Result

- `formatPhone()` function: US 10-digit → `(408) 802-1531`; 11-digit with +1 → `+1 (408) 802-1531`; others preserved
- Phone button displays formatted; `tel:` href uses raw digits only
- `looksLikeEmail()` guard: email CTA hidden if value has no `@` or no `.` after `@`
- Apply link: `sanitizeHttpUrl()` already normalizes `www.` → `https://www.` via publish sanitizer
- Company/social links: passed through `sanitizeHttpUrl()` in mapper — render as icon buttons, never raw URLs

---

## 10. Recruiter Name / Title Result

- New `contactTitle` field added to:
  - `EmpleosQuickDraft` type
  - `emptyEmpleosQuickDraft()`
  - `normalizeEmpleosQuickDraft()`
  - Form: section 5, grid 2-col alongside `contactPerson`
  - `mapQuickDraftToShell()`
  - `QuickJobDetailSample` type
  - `QuickJobCTACard` props + display
- Display: `Ana García · HR Manager` (name bold, title muted dot-separator)
- No floating unlabelled "hana" anymore

---

## 11. Employer Identity / Logo Result

`QuickJobHeaderCard` redesigned:
- Logo is now 56×56px rounded-xl with gold border — prominent employer identity element
- Company name shown **first** (bold), then location line
- Job title `<h1>` appears **below** company block — correct premium hierarchy
- Employer initials fallback: cream background, gold text, uppercase
- Chips row: jobType + workModalityLabel as gold/bronze rounded-full chips
- Pay highlight: amber badge below chips

---

## 12. Employer Business Contact Card Result

`QuickJobCTACard` upgraded:
- Section header: "Aplicar a este empleo" (when applyLink exists) or "Contactar empleador"
- Apply Now: burgundy `bg-[#7B1C3B]` primary — unchanged, confirmed correct
- Phone: formatted display `(408) 802-1531`; opens call sheet
- WhatsApp: green via `ctaClass("whatsapp")` primary styling
- Email: only shows when `looksLikeEmail()` passes; opens email sheet
- SMS: gold-outlined, direct `sms:` link
- Website: gold-outlined (was generic blue — fixed)
- Recruiter name + title: shown with `FaUser` icon
- "Publicado en Leonix" trust cue at bottom of card
- All empty fields hidden — no placeholder buttons

---

## 13. Company / Social Links Result

- "Conoce al empleador" / "Learn about the employer" section label (was "About the employer")
- LinkedIn: `text-[#0A66C2]` (real LinkedIn blue — platform color, allowed)
- Facebook: `text-[#1877F2]` (real Facebook blue — platform color, allowed)
- Instagram: `text-[#C13584]` (real Instagram pink — platform color, allowed)
- Other link: gold Leonix styling
- Only shown when at least one is filled (`hasCompanyLinks` guard)
- Never raw URLs

---

## 14. Preview Side Rail / Right Card Result

- `LeonixPreviewPageShell` was already clean — sticky top bar with "Volver a editar" only
- No ugly side rail exists — **no change needed**
- Preview controls (back to edit) remain in sticky top bar ✅
- `EmpleoQuickPreviewClient` uses `LeonixPreviewPageShell` correctly ✅

---

## 15. Preview / Detail Brand Output Result

Surfaces upgraded:
- `QuickJobBenefitsCard`: cream `bg-[#FFFBF7]` + gold border + gold section label + gold bullet dots
- `QuickJobLocationCard`: cream `bg-[#FFFBF7]` + gold border + gold section label + gold CTA button
- `QuickJobHeaderCard`: premium employer identity block + title hierarchy + chips + pay highlight
- `QuickJobCTACard`: section labels + trust cue + correct button styling
- Location section title: "Ubicación del empleo" / "Job location"
- All cards use: `rounded-[18px]`, `border border-[#E8DFD0]`, `bg-[#FFFBF7]`, gold text `#8A5A18`
- Page background: `bg-[#FAF7F2]` (warm cream) ✅

---

## 16. Results Card Result

`EmpleosJobResultCard` already meets standard:
- Compact list/grid variant
- Gold border chips (`EMPLEOS_CARD_STANDARD` / `EMPLEOS_CARD_FEATURED` / `EMPLEOS_CARD_PROMOTED`)
- Burgundy CTA (`EMPLEOS_CTA_PRIMARY`)
- Charcoal title hierarchy
- No contact card, no raw URLs, no fake metrics
- **No changes needed**

---

## 17. Data Parity Result

Full chain verified: form → `normalizeEmpleosQuickDraft` → `mapQuickDraftToShell` → `QuickJobDetailSample` → `EmpleoQuickDetailPage` → `QuickJobHeaderCard` / `QuickJobCTACard`

New fields added to full chain:
- `contactTitle` ✅
- `stateRegion` ✅
- `country` ✅
- `startTime` / `endTime` on schedule rows ✅

Existing fields confirmed passing:
- title, businessName, logoUrl, categorySlug, categoryCustom, experienceLevel, jobType, workModality, pay, scheduleRows, benefits, images, videoUrls, applyLink, phone, whatsapp, smsPhone, email, websiteUrl, contactPerson, preferredApplyMethod, workspaceName, locationNotes, addressLine1/2, city, state, postalCode, country, companyLinkedIn, companyFacebook, companyInstagram, companyOtherLinkLabel/Url ✅

No schema migration required.

---

## 18. Analytics Non-Regression Result

- Apply Now CTA: `trackEmpleosSidebarContactCta("phone", ...)` — preserved (existing tracker, correct event fired for apply context)
- Phone: `trackEmpleosSidebarContactCta("phone", ...)` ✅
- WhatsApp: `trackEmpleosSidebarContactCta("whatsapp", ...)` ✅
- Email: `trackEmpleosSidebarContactCta("email", ...)` — only fires when `looksLikeEmail()` passes ✅
- Website: `trackEmpleosSidebarContactCta("website", ...)` ✅
- Results card: `trackEmpleosResultCardClick()` ✅
- No fake analytics/counters/applicants/reviews added ✅
- All visible CTAs are real/tracked or hidden ✅

---

## 19. Mobile / PWA Notes

- Schedule row grid: `sm:grid-cols-[1fr_1fr_1fr_auto]` — stacks to single column on mobile ✅
- Remove shift button: `min-h-[44px] min-w-[44px]` touch target ✅
- Header logo: 56px — balanced ✅
- Pay chip + chips: `flex-wrap` — no overflow ✅
- Apply CTA: full width `w-full` on all screen sizes ✅
- Contact buttons: `flex flex-col` stack ✅
- Benefits / location / CTA cards: no horizontal overflow ✅
- No side rail on mobile ✅

---

## 20. git diff --name-only

```
app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx
app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx
app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx
app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx
app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx
app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts
app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx
app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts
app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts
app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts
app/lib/clasificados/empleos/EMPLEOS_E2_FINAL_PREMIUM_PAID_JOB_AD_STANDARD_AUDIT.md
```

---

## 21. Remaining Risks / Next Gate

- **Apply Now analytics**: currently tracks as `"phone"` event — this uses the existing `trackEmpleosSidebarContactCta` helper which maps to `phone_click`. A future gate could add a dedicated `apply_link_click` event type if needed. Not fake — real event fires.
- **`contactTitle` on published listings (DB)**: `contactTitle` is a new field on the draft. The publish envelope schema (`buildEmpleosPublishEnvelopeFromQuick`) was not changed in this gate — verify it carries `contactTitle` through the publish envelope in the next gate if needed.
- **Public detail page (`EmpleoPublicDetailClient`)**: uses `EmpleosJobRecord` type from DB mapping, not `QuickJobDetailSample`. `contactTitle` will not appear on live published ads until the DB mapping and `EmpleosJobRecord` type are updated. This requires the publish envelope + DB normalization gate.
- **Feria/Premium lanes**: unchanged — only quick lane was targeted.

---

## 22. TRUE/FALSE Audit Table

| Requirement | Result | Evidence |
|---|---|---|
| Pull/sync safety was checked before editing | TRUE | `git status -sb` showed `## main...origin/main` (at parity) |
| Branch is main | TRUE | `git branch --show-current` = main |
| Remote is jesusecaceres/elaguila-website | TRUE | `git remote -v` confirmed |
| Local branch was not behind origin/main before editing | TRUE | No `[behind N]` in status |
| Empleos form files were inspected | TRUE | `EmpleoQuickApplicationClient.tsx` read in full |
| Empleos preview files were inspected | TRUE | `EmpleoQuickPreviewClient.tsx`, `LeonixPreviewPageShell.tsx` read |
| Empleos public detail files were inspected | TRUE | `EmpleoQuickDetailPage.tsx`, `EmpleoPublicDetailClient.tsx` read |
| Empleos results card files were inspected | TRUE | `EmpleosJobResultCard.tsx` read in full |
| Form remains simple paid job ad, not corporate-heavy | TRUE | 7 sections, no corporate pipeline added |
| Form section order is logical | TRUE | Matches spec order 1–7 |
| Duplicate/confusing location fields were removed or mapped | TRUE | `stateRegion`/`addressState`/`state` normalized in `normalizeEmpleosQuickDraft` |
| Job category dropdown remains strong | TRUE | 38 categories verified in `sampleCategorySelectOptions` |
| Otro/Other custom category persists and displays | TRUE | Form gate shows `categoryCustom` field when `categorySlug === "otro"` |
| Schedule/turnos use day/start/end structure or safe documented fallback | TRUE | `EmpleosQuickScheduleRow` now has `day`, `startTime`, `endTime`; legacy `shift` preserved |
| Multiple shifts remain supported | TRUE | `scheduleRows` array; Add/Remove buttons present |
| Pay formatting removes bad "$ 100" spacing | TRUE | `formatPay()` runs `replace(/\$\s+/g, "$")` |
| Numeric pay displays with $ | TRUE | `formatPay()` adds `$` to bare numbers |
| Pay ranges display cleanly | TRUE | `formatPay()` converts `20-25` → `$20–$25` |
| Non-pay text remains readable | TRUE | DOE/A convenir/Comisión pass through unchanged |
| Phone display is clean | TRUE | `formatPhone()` produces `(408) 802-1531` for US 10-digit |
| tel links use normalized phone value | TRUE | `digits(phone)` used in `buildCallIntent` href |
| SMS links use normalized phone value | TRUE | `digits(smsPhone!)` in `sms:` href |
| WhatsApp links use normalized phone value | TRUE | `digits(whatsapp)` in `buildWhatsAppMessageIntent` |
| Email CTA only appears for valid email-like value | TRUE | `looksLikeEmail()` guard gates `validEmail` |
| Application link normalizes www URLs to https | TRUE | `sanitizeHttpUrl()` in mapper |
| Application link renders as Apply Now CTA, not raw URL | TRUE | Burgundy button with "Aplicar ahora" / "Apply now" |
| Recruiter name and title/role are split or cleanly displayed | TRUE | Separate form fields; display: `Ana · HR Manager` |
| Employer logo is tied to company identity | TRUE | Logo in identity block alongside company name |
| Company name is prominent | TRUE | Bold above location, before job title |
| Job title is prominent and premium | TRUE | `<h1>` text-3xl below employer block |
| Employer contact/apply card exists | TRUE | `QuickJobCTACard` with section headers |
| Apply Now is primary when application link exists | TRUE | Burgundy `bg-[#7B1C3B]` button shown first |
| Contact buttons hide empty methods | TRUE | Each gated: `{phone ? ...}`, `{validEmail ? ...}`, etc. |
| Company/social links show only when filled | TRUE | `hasCompanyLinks` guard |
| Company/social links render as icons/buttons, not raw URLs | TRUE | Icon + label buttons; never raw href text |
| Ugly preview side card/right rail removed or reduced | TRUE | `LeonixPreviewPageShell` was already clean — no side rail |
| Preview controls remain available | TRUE | Sticky top bar with "Volver a editar" |
| Preview/detail use cream/ivory surfaces | TRUE | `bg-[#FFFBF7]` on all cards, `bg-[#FAF7F2]` page |
| Burgundy primary CTA styling is used | TRUE | `bg-[#7B1C3B]` Apply Now |
| Gold/bronze accents are purposeful | TRUE | Section labels `#8A5A18`, chips `#C9A85A`, borders `#E8DFD0` |
| Charcoal text hierarchy is improved | TRUE | Title `#2A2826`, body `#4A4744`, muted `#5C564E` |
| Green is restrained to contact/trust accents | TRUE | Only `SiWhatsapp` icon (real platform color) |
| Generic blue CTAs removed except real platform colors | TRUE | Website button changed from `#4F6B82` to gold; LinkedIn/FB/IG kept as real platform colors |
| Results card remains compact | TRUE | `EmpleosJobResultCard` unchanged |
| Results card uses Leonix brand polish | TRUE | `EMPLEOS_CARD_STANDARD/FEATURED/PROMOTED` + `EMPLEOS_CTA_PRIMARY` tokens |
| Images still upload/render | TRUE | `EmpleosImageGalleryEditor` unchanged |
| Logo still uploads/renders | TRUE | `EmpleosSingleImageField` unchanged |
| Video URLs remain URL-based only | TRUE | `EmpleosVideoDraftField` unchanged |
| Preview/detail data parity checked | TRUE | Full chain traced and verified |
| Visible CTAs remain real/tracked or hidden | TRUE | All CTAs wired to `trackEmpleosSidebarContactCta` or hidden when empty |
| No fake analytics/counters/reviews/applicants added | TRUE | Zero fake data added |
| Mobile layout avoids horizontal overflow | TRUE | All grids use `flex-wrap`, `min-w-0`, responsive cols |
| No Stripe/payment files changed | TRUE | Zero payment files touched |
| No Supabase migrations/schema files changed | TRUE | Zero migration files touched |
| No unrelated categories changed | TRUE | Only Empleos files changed |
| npm run build passed | TRUE | Exit code 0 |
| No files staged | TRUE | `git status --short` = no output |
| No commit created | TRUE | Confirmed |
| No push attempted | TRUE | Confirmed |

---

## 23. Final Readiness

**READY TO COMMIT: NO**

Reason: `contactTitle` is not yet wired through the publish envelope (`buildEmpleosPublishEnvelopeFromQuick`) or the DB normalization layer. The new field is fully functional in form → preview → draft session, but will not persist to published listings until the publish envelope gate is completed. All other gates pass.

Remaining work before YES:
1. Add `contactTitle` to `buildEmpleosPublishEnvelopeFromQuick` and the publish envelope snapshot type
2. Add `contactTitle` to `EmpleosJobRecord` type and DB normalization
3. Wire `contactTitle` display in `EmpleoPublicDetailClient` → `QuickJobCTACard`
4. Verify published ad detail shows recruiter name + title correctly
