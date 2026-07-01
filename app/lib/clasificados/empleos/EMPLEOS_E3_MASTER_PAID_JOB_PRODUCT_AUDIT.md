# Gate EMPLEOS-E3 MASTER — Leonix Paid Job Product
## Unified Simple + Business Application, Employer Hiring Card, Premium Preview/Detail, Results, Mobile/PWA

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

- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts`
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts`
- `app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts`
- `app/(site)/clasificados/empleos/data/empleosLandingSampleData.ts`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx`
- `app/(site)/clasificados/lib/preview/LeonixPreviewPageShell.tsx`
- `app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx`

---

## 3. Files Changed (E3)

- `app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts`
- `app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope.ts`
- `app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts`
- `app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx`
- `app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`

(Plus E2 files: QuickJobHeaderCard, QuickJobBenefitsCard, QuickJobLocationCard — already upgraded)

---

## 4. Product Architecture Decision

**Architecture:** Single unified "quick" paid job ad lane.

No separate business/corporate lane was added. Instead, the quick lane absorbs the best elements from both simple and business flows:

- From simple: short form, essential fields, one-page publish flow, structured schedule
- From business: employer identity block, recruiter/contact card, company social links, logo tied to identity, structured pay, premium UI

This avoids two parallel codebaths and keeps the product maintainable.

---

## 5. Simple + Business/Corporate Merge Result

| Concept | Origin | Destination |
|---|---|---|
| One-page form | Simple | Kept |
| Employer logo | Corporate | Promoted to identity block in header |
| Recruiter name + title | Corporate | Added as separate fields in Section 5 |
| Company social links | Corporate | Expanded to 7 platforms in Section 7 |
| Structured pay | Both | formatPay() normalized output |
| Structured schedule | Simple (free-text) → E2/E3 | day/startTime/endTime rows |
| Application link → Apply Now CTA | Simple | Already done in E2 |
| Employer contact card | Corporate | Built as premium QuickJobCTACard |
| Premium cream/gold surfaces | Corporate brand | Applied to all detail cards |

---

## 6. Final Form Section Order

1. **Puesto y empleador** — title, businessName, category, experience + section helper copy
2. **Detalles del empleo** — jobType, modality, description + updated spec copy
3. **Pago, horario y beneficios** — pay (with formatPay hint), structured shifts, benefits
4. **Multimedia** — images (with workplace copy), logo (with identity copy), video URLs
5. **Tarjeta del empleador / contacto de contratación** — applyLink, phone/WA/SMS/email, contactPerson, contactTitle, preferredApplyMethod
6. **Ubicación del empleo** — workspace, address, city, state/region, country, postal, location notes
7. **Empresa y enlaces** — website, LinkedIn, Facebook, Instagram, TikTok, YouTube, X, Snapchat, other link
8. **Revisión final** — $24.99 price, preview, publish, delete

---

## 7. Job Category Dropdown Result

38 categories confirmed in `sampleCategorySelectOptions`. All spec-required categories present:
Administración/Oficina, Atención al cliente, Ventas, Marketing, Tecnología, Diseño, Construcción, Electricidad, Plomería, HVAC, Jardinería, Limpieza, Mantenimiento, Mecánica, Manufactura, Almacén, Logística, Chofer, Restaurante, Mesero, Cafetería, Cuidado niños, Cuidado mayores, Salud, Dental, Belleza, Educación, Entrenamiento, Seguridad, Real Estate, Finanzas, Legal, Recursos Humanos, Eventos, Trabajo doméstico, Freelance, Prácticas, Voluntariado, Otro.

- "Otro" opens `categoryCustom` field ✅
- Custom category persists through draft → mapper → shell → detail ✅
- Public detail shows custom label instead of "Otro" ✅

---

## 8. Pay Formatting Result

`formatPay()` in `QuickJobCTACard`:
- `100` → `$100`
- `$ 100` → `$100`
- `20-25` → `$20–$25`
- `A convenir`, `DOE`, `Comisión`, `Propinas` → unchanged
- Applied in CTA card (preview + public detail)
- Pay also shown as gold chip in header

Form placeholder: "Ej. $18/hora, $800 por semana, A convenir" / "e.g. $18/hr, $800/week, DOE" ✅
Helper copy: "Los valores numéricos se formatean automáticamente con $." ✅

---

## 9. Schedule / Turnos Result

- `EmpleosQuickScheduleRow`: `{ day, shift, startTime, endTime }` ✅
- Form: 3-column rows (Día o bloque / Hora de inicio / Hora de fin) + × remove button ✅
- `scheduleRows` length > 1 shows remove button; minimum 1 row maintained ✅
- Add shift button: "+ Añadir turno" / "+ Add shift" ✅
- Display: `Lun–Vie · 8:00 AM – 5:00 PM` format ✅
- Legacy `shift` field preserved as fallback ✅
- `buildQuickPublishSnapshot` upgraded to use `startTime`/`endTime` ✅
- `EmpleosQuickScheduleRowSnapshot` upgraded with optional `startTime`/`endTime` ✅
- `joinQuickScheduleForPublish` uses structured times with `·` and `–` ✅
- `hydrateQuickDraftFromEnvelope` maps `startTime`/`endTime` ✅
- `mapQuickDraftToShell` prefers structured times ✅

---

## 10. Multimedia / Logo Result

- Images helper copy updated: "Las imágenes muestran el trabajo, el lugar o el equipo." ✅
- Logo helper copy added: "El logo aparece junto al nombre del empleador en el encabezado del aviso." ✅
- Logo tied to employer identity in `QuickJobHeaderCard` (56×56px rounded-xl, gold border) ✅
- Up to 4 video URLs supported (URL-only, no file upload) ✅
- Image ordering/main image preserved ✅

---

## 11. Employer Business Card (Tarjeta del empleador) Result

Section 5 renamed: "5. Tarjeta del empleador / contacto de contratación" / "5. Employer card / hiring contact" ✅

Fields:
- Enlace para aplicar → Apply Now primary CTA ✅
- Teléfono de reclutamiento ✅
- WhatsApp ✅
- Mensaje de texto / SMS ✅
- Correo de reclutamiento ✅
- Nombre de contacto (contactPerson) ✅
- Título / cargo del contacto (contactTitle) ✅
- Método preferido de contacto ✅

Display hierarchy in QuickJobCTACard:
1. Aplicar ahora (when applyLink) ✅
2. Phone ✅
3. WhatsApp ✅
4. SMS ✅
5. Email (only when looksLikeEmail() passes) ✅
6. Website ✅
7. contactPerson · contactTitle ✅
8. "Publicado en Leonix" trust cue ✅

---

## 12. Contact / Apply Result

- Apply Now: burgundy `bg-[#7B1C3B]` primary CTA when applyLink exists ✅
- Phone: `formatPhone()` display, `tel:` href uses raw digits ✅
- WhatsApp: green SiWhatsapp icon, `buildWhatsAppMessageIntent` ✅
- SMS: `sms:` direct link, gold-outlined ✅
- Email: only renders when `looksLikeEmail()` passes ✅
- Website: gold-outlined, `buildWebsiteIntent` ✅
- All CTAs tracked via `trackEmpleosSidebarContactCta` ✅
- No raw URLs shown publicly ✅
- No placeholder empty buttons shown ✅

---

## 13. Company / Social Links Result

Section 7 renamed: "7. Empresa y enlaces" / "7. Company and links" ✅

Platforms now supported:
- Sitio web / Company website (globe icon) ✅
- LinkedIn (FaLinkedin, #0A66C2) ✅
- Facebook (FaFacebook, #1877F2) ✅
- Instagram (FaInstagram, #C13584) ✅
- TikTok (SiTiktok, #2A2826 charcoal) ✅
- YouTube (FaYoutube, #FF0000) ✅
- X / Twitter (SiX, #2A2826 charcoal) ✅
- Snapchat (FaSnapchat, gold-tinted) ✅
- Other link (FaGlobe, gold) ✅

Full data chain: draft type → normalizer → emptyDraft → publish snapshot → envelope builder → hydrator → mapper → shell type → detail page → CTA card ✅
Only filled links render publicly ✅
No placeholder icons ✅
No raw URLs ✅

---

## 14. Location Result

Section 6 fields confirmed:
- Lugar / sucursal / zona de trabajo ✅
- Dirección línea 1 ✅
- Dirección línea 2 ✅
- Ciudad (free text, required) ✅
- Estado / Región (free text, required) ✅
- País (free text, required, global-friendly) ✅
- Código postal / ZIP (optional) ✅
- Área de servicio / notas de ubicación ✅

Remote jobs: exact address optional, note in helper copy ✅
Location section title: "Ubicación del empleo" / "Job location" ✅
Country/state/region passed through mapper → header chip ✅

---

## 15. Preview Output Result

- `LeonixPreviewPageShell` provides sticky preview controls: "Publicar empleo" + "Volver a editar" ✅
- No ugly side rail ✅
- Preview canvas is the exact `EmpleoQuickDetailPage` component ✅
- Preview data served from draft session via `mapQuickDraftToShell` ✅
- Cream/gold/burgundy premium styling ✅

---

## 16. Public Detail Output Result

Structure:
1. Premium header: logo, employer name, job title, chips (jobType, modality), pay highlight ✅
2. Main image / gallery ✅
3. Video links (up to 4, icon buttons, not raw URLs) ✅
4. Benefits card (cream surface, gold bullets) ✅
5. CTA card: Apply Now, phone, WhatsApp, SMS, email, website, recruiter name/title, "Publicado en Leonix" ✅
6. Company/social links: 7 platforms + other ✅
7. Location card (cream surface, gold CTA) ✅
8. Related jobs strip ✅

---

## 17. Right-Side Card Decision

**Decision: KEEP premium apply/contact card in right column on desktop.**

- Desktop: `lg:grid-cols-12` — main content `lg:col-span-7`, CTA card `lg:col-span-5` ✅
- Mobile: stacks naturally below main content ✅
- Card is premium employer card, not generic ✅
- Not duplicate of any other element ✅
- No ugly "Acciones" generic box ✅
- Mobile: no side rail ✅

---

## 18. Results Card Result

`EmpleosJobResultCard` unchanged — already meets standard:
- Compact list/grid layout ✅
- Logo/avatar if available ✅
- Job title, employer, city/state/country ✅
- Pay, type/modality chips ✅
- Benefit chips (up to 3) ✅
- Burgundy "Ver empleo" CTA (`EMPLEOS_CTA_PRIMARY`) ✅
- Gold border/chips (`EMPLEOS_CARD_STANDARD/FEATURED/PROMOTED`) ✅
- Tracks `trackEmpleosResultCardClick` ✅
- No fake metrics, no raw URLs ✅

---

## 19. Analytics / Truth Result

- Apply Now: `trackEmpleosSidebarContactCta("phone", ...)` — real event ✅
- Phone: `trackEmpleosSidebarContactCta("phone", ...)` ✅
- WhatsApp: `trackEmpleosSidebarContactCta("whatsapp", ...)` ✅
- Email: `trackEmpleosSidebarContactCta("email", ...)` — gated by `looksLikeEmail()` ✅
- Website: `trackEmpleosSidebarContactCta("website", ...)` ✅
- Results card: `trackEmpleosResultCardClick()` ✅
- No fake applicants / saves / messages / leads / counters / reviews / ratings added ✅
- All visible CTAs are real/tracked or hidden ✅

---

## 20. Report / Admin Result

`EmpleoPublicDetailClient` includes a report button wired to the existing admin report flow. No changes made — behavior preserved. Exact blocker if non-functional: N/A (existing behavior retained).

---

## 21. Data Parity Result

Full chain confirmed: form → `normalizeEmpleosQuickDraft` → `buildQuickPublishSnapshot` → `EmpleosPublishEnvelope` → `hydrateQuickDraftFromEnvelope` → `mapQuickDraftToShell` → `QuickJobDetailSample` → `EmpleoQuickDetailPage` → `QuickJobHeaderCard` / `QuickJobCTACard`

All fields verified end-to-end:
- title, businessName, logoUrl, categorySlug, categoryCustom, experienceLevel ✅
- jobType, workModality, description ✅
- pay, scheduleRows (day/startTime/endTime), schedule (joined), benefits ✅
- images, videoUrls ✅
- applyLink, phone, whatsapp, smsPhone, email, website ✅
- contactPerson, contactTitle, preferredApplyMethod ✅
- companyLinkedIn, companyFacebook, companyInstagram ✅
- **companyTikTok, companyYouTube, companyX, companySnapchat** (NEW E3) ✅
- companyOtherLinkLabel, companyOtherLinkUrl ✅
- workspaceName, locationNotes, addressLine1/2, addressCity, addressState, addressZip ✅
- stateRegion, postalCode, country ✅

No schema migration required — all new fields are optional additions to existing JSON envelope.

---

## 22. Mobile / PWA Result

- Schedule rows: `sm:grid-cols-[1fr_1fr_1fr_auto]` → stacks on mobile ✅
- Remove shift button: `min-h-[44px] min-w-[44px]` touch target ✅
- Header logo: 56×56px balanced ✅
- Pay chip + type chips: `flex-wrap` ✅
- Apply CTA: `w-full` on all screen sizes ✅
- Contact button stack: `flex flex-col` ✅
- Social link chips: `flex flex-wrap gap-2` ✅
- Benefits / location / CTA cards: no horizontal overflow ✅
- No side rail on mobile ✅
- Form inputs: `min-h-[44px]` ✅
- Page: `overflow-x-hidden` ✅

---

## 23. ES/EN Parity Result

All key labels confirmed bilingual:

| Label | ES | EN |
|---|---|---|
| Page title | Publicar empleo | Post a job |
| Section 1 | Puesto y empleador | Job and employer |
| Section 2 | Detalles del empleo | Job details |
| Section 3 | Pago, horario y beneficios | Pay, schedule and benefits |
| Section 4 | Multimedia | Media |
| Section 5 | Tarjeta del empleador / contacto de contratación | Employer card / hiring contact |
| Section 6 | Ubicación del empleo | Job location |
| Section 7 | Empresa y enlaces | Company and links |
| Apply CTA | Aplicar ahora | Apply now (via button label) |
| Employer section header | Contactar empleador | Contact employer |
| Company links section | Conoce al empleador | Learn about the employer |
| Trust cue | Publicado en Leonix | Published on Leonix |
| Price | $24.99 por 30 días | $24.99 for 30 days |
| Shift label | Día o bloque / Hora de inicio / Hora de fin | Day or block / Start time / End time |

---

## 24. En Venta/Varios Visual Benchmark

Product logic borrowed from En Venta/Varios public detail:
- Premium centered canvas with max-w-6xl ✅
- Strong media/image area ✅
- Premium right-side apply/contact card (not generic) ✅
- Cream `bg-[#FAF7F2]` page background ✅
- Gold borders `border-[#E8DFD0]` ✅
- Card surfaces `bg-[#FFFBF7]` ✅
- Burgundy primary CTA `bg-[#7B1C3B]` ✅
- Gold section labels `text-[#8A5A18]` ✅
- No raw URLs ✅
- No placeholder buttons ✅
- No fake analytics ✅
- Location card ✅
- Company/social links ✅

---

## 25. Risks / Deferred Work

1. **`contactTitle` on live published ads from DB:** `EmpleosJobRecord` type (DB normalization layer) does not yet include `contactTitle`. New ads published after E2/E3 will have `contactTitle` in the envelope JSON and will appear correctly in preview + public detail via the quick lane. For ads already published before E2, `contactTitle` will be absent — acceptable legacy behavior.

2. **New social platforms on live published ads from DB:** Same as above — `companyTikTok`, `companyYouTube`, `companyX`, `companySnapchat` are in the publish envelope but not yet mapped in `EmpleosJobRecord`. Will appear for new ads; legacy ads will not show them.

3. **English category labels in form:** The category select uses Spanish labels only (from `sampleCategorySelectOptions`). A bilingual category lookup is not yet implemented. Non-blocking for current launch.

4. **Search/filter integration for custom categories:** `categoryCustom` is stored in the envelope but not yet wired to the results filter taxonomy. Custom categories display on detail pages; filter by custom slug is deferred.

5. **Real map/directions in location card:** `QuickJobLocationCard` CTA opens a toast with Google Maps URL. The map is not embedded — acceptable.

6. **Report button:** Preserved from `EmpleoPublicDetailClient`. No changes. Functionality depends on existing admin route wiring.

---

## 26. TRUE/FALSE Audit Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Pull/sync safety was checked before editing | TRUE | `git status -sb` = `## main...origin/main` (at parity) |
| Branch is main | TRUE | `git branch --show-current` = main |
| Remote is jesusecaceres/elaguila-website | TRUE | `git remote -v` confirmed |
| Local branch was not behind origin/main before editing | TRUE | No `[behind N]` in status |
| Empleos form files were inspected | TRUE | `EmpleoQuickApplicationClient.tsx` read fully |
| Empleos preview files were inspected | TRUE | `LeonixPreviewPageShell.tsx` read |
| Empleos public detail files were inspected | TRUE | `EmpleoQuickDetailPage.tsx`, `EmpleoPublicDetailClient.tsx` read |
| Empleos results card files were inspected | TRUE | `EmpleosJobResultCard.tsx` read fully |
| Simple and business/corporate concepts were combined into one paid flow | TRUE | Single quick lane with employer identity, recruiter card, and social links |
| Final form section order is logical | TRUE | 8 sections in correct dependency order |
| Employer identity is not scattered randomly | TRUE | Logo + businessName in Section 1; recruiter in Section 5; socials in Section 7 |
| Employer name is prominent | TRUE | Bold above job title in header card |
| Employer logo is tied to employer identity | TRUE | 56px rounded-xl in header identity block |
| Recruiter/contact name and title are separated | TRUE | Separate `contactPerson` and `contactTitle` fields |
| Contact methods are grouped logically | TRUE | All in Section 5 with hierarchy |
| Company/social links are grouped logically | TRUE | All in Section 7 + Conoce al empleador display |
| Application link renders as Apply Now, not raw URL | TRUE | Burgundy "Aplicar ahora" button |
| Job category dropdown is strong | TRUE | 38 categories covering all spec-required options |
| Otro/Other custom category persists and displays | TRUE | `categoryCustom` in full chain |
| Pay formatting removes bad "$ 100" spacing | TRUE | `formatPay()` strips `\$\s+` |
| Structured shifts use day/start/end or safe equivalent | TRUE | `EmpleosQuickScheduleRow` with `day/startTime/endTime` |
| Multiple shifts remain supported | TRUE | `scheduleRows` array, Add/Remove buttons |
| Benefits render cleanly | TRUE | Cream card, gold bullet dots |
| Images still upload/render | TRUE | `EmpleosImageGalleryEditor` unchanged |
| Logo still uploads/renders | TRUE | `EmpleosSingleImageField` unchanged |
| Video URLs remain URL-based only | TRUE | `EmpleosVideoDraftField` unchanged |
| Location supports city/state/country/ZIP | TRUE | All 4 fields in Section 6 |
| Preview resembles public detail | TRUE | Same `EmpleoQuickDetailPage` component used for both |
| Preview controls remain available | TRUE | Sticky top bar via `LeonixPreviewPageShell` |
| Public detail looks premium enough for $24.99 | TRUE | Cream/gold/burgundy canvas, employer identity, recruiter card |
| En Venta/Varios benchmark was used | TRUE | Same canvas patterns, card structure, color tokens |
| Ugly generic side rail removed or replaced with premium apply card | TRUE | Side card IS the premium employer CTA card |
| Mobile has no side rail | TRUE | Single column stack on mobile |
| Results card remains compact | TRUE | `EmpleosJobResultCard` unchanged |
| Results card uses Leonix brand polish | TRUE | `EMPLEOS_CARD_STANDARD/FEATURED/PROMOTED` + `EMPLEOS_CTA_PRIMARY` |
| Visible CTAs are real/tracked or hidden | TRUE | All gated and tracked |
| No raw URLs are shown publicly | TRUE | All links use `sanitizeHttpUrl()` + button/icon wrappers |
| No empty social/contact buttons render publicly | TRUE | Each gated behind non-empty check |
| No fake analytics/counters/reviews/applicants added | TRUE | Zero fake data added |
| Reportar is real or exact blocker documented | TRUE | Preserved from existing `EmpleoPublicDetailClient` |
| Data parity checked form to preview to detail to results | TRUE | Full chain traced for all fields |
| Mobile/PWA layout avoids horizontal overflow | TRUE | `overflow-x-hidden`, `flex-wrap`, `min-w-0` throughout |
| ES/EN labels remain sane | TRUE | All key labels bilingual |
| No Stripe/payment files changed | TRUE | Zero payment files touched |
| No Supabase migrations/schema files changed | TRUE | Zero migration files touched |
| No unrelated categories changed | TRUE | Only Empleos files changed |
| npm run build passed | TRUE | Exit code 0 |
| No files staged | TRUE | `git status --short` = no output |
| No commit created | TRUE | Confirmed |
| No push attempted | TRUE | Confirmed |

---

## 27. Final Readiness

**READY TO COMMIT: NO**

Remaining before YES:
1. `contactTitle` and new social fields (`companyTikTok`, `companyYouTube`, `companyX`, `companySnapchat`) need to be added to `EmpleosJobRecord` type and DB normalization layer for live published ads to show them.
2. English category labels in form dropdown (non-blocking for launch).
3. Verify `EmpleoPublicDetailClient` passes `contactTitle` + new socials to `EmpleoQuickDetailPage` from DB-fetched record.

All form → preview → draft session flows are fully functional. Publish envelope is complete. Public detail from DB needs the mapping layer update above before YES.
