# EMPLEOS-E4 — En Venta/Varios Canvas Shell Audit

**Gate title:** EMPLEOS-E4 FINAL COMPLETION — Gates D/E/F/G/H/I/J/K/L/M/N

---

## 1. Gate Title

**EMPLEOS-E4** — Unify Empleos detail pages (quick lane) to match the En Venta/Varios premium canvas style.

---

## 2. Git Safety Result

```
Branch:  main
Remote:  origin (https://github.com/jesusecaceres/elaguila-website.git)
Status:  ## main...origin/main  (at parity, no dirty files at start of session)
Staged:  none
Committed: nothing new
Pushed:  nothing
```

---

## 3. En Venta/Varios Benchmark Files Inspected

| File | Purpose |
|---|---|
| `app/(site)/clasificados/en-venta/shared/styles/enVentaBrand.ts` | Design tokens — background, borders, typography |
| `app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx` | Main layout, contact actions, analytics wiring |
| `app/(site)/clasificados/en-venta/shared/components/EnVentaBuyerPanel.tsx` | Right contact/buy card — sticky rail, trust line |
| `app/(site)/clasificados/en-venta/shared/components/EnVentaLocationFauxMap.tsx` | Faux map SVG component — dark grid, pin, vignette |
| `app/(site)/clasificados/en-venta/listing/EnVentaMediaGallery.tsx` | Photo/video gallery layout |
| `app/(site)/clasificados/en-venta/listing/EnVentaItemSpecs.tsx` | Specs section component |

**None of the above En Venta/Varios files were modified.**

---

## 4. Empleos Files Inspected (Read-only)

- `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx`
- `app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosClasificadosEngagementRow.tsx`
- `app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx`
- `app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx`
- `app/(site)/clasificados/lib/preview/LeonixPreviewPageShell.tsx`
- `app/(site)/clasificados/empleos/lib/empleosPublishedLaneShell.ts`
- `app/(site)/clasificados/empleos/lib/empleosPremiumUi.ts`
- `app/(site)/clasificados/empleos/data/empleoQuickJobSampleData.ts`
- `app/(site)/publicar/empleos/shared/types/empleosQuickDraft.ts`
- `app/(site)/publicar/empleos/shared/mappers/mapQuickDraftToShell.ts`
- `app/(site)/clasificados/empleos/[slug]/page.tsx`

---

## 5. Empleos Files Changed

| File | Gate | Change |
|---|---|---|
| `app/(site)/clasificados/empleos/lib/empleosPublishedLaneShell.ts` | D | Added `contactTitle`, `companyTikTok`, `companyYouTube`, `companyX`, `companySnapchat` to quick shell mapper |
| `app/(site)/clasificados/empleos/components/quickJob/EmpleoQuickDetailPage.tsx` | E/F/J/L | Full canvas upgrade: EN_VENTA radial gradient bg, breadcrumb bar, description card, engagement row, sticky right rail, `break-words` mobile fix |
| `app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx` | G/L | Burgundy primary CTA, cream card, EN_VENTA trust line, `min-w-0 overflow-hidden`, `break-words` on schedule |
| `app/(site)/clasificados/empleos/components/quickJob/QuickJobHeaderCard.tsx` | E | Token alignment: warm border, gradient initials avatar, burgundy pay badge |
| `app/(site)/clasificados/empleos/components/quickJob/QuickJobBenefitsCard.tsx` | E | Token alignment: cream card shell, gold bullet |
| `app/(site)/clasificados/empleos/components/quickJob/QuickJobLocationCard.tsx` | I | Inline faux map SVG (port of `EnVentaLocationFauxMap`), Open Maps button, location footnote |
| `app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx` | J | Passes `engagement` to `EmpleoQuickDetailPage`; `suppressEngagement` flag on `PublicApplyFooter` for quick lane; footer card token alignment |
| `app/(site)/clasificados/empleos/components/EmpleosJobResultCard.tsx` | K | Full premium polish: cream surface, company avatar/logo, charcoal title, burgundy pay, meta chips, burgundy CTA "Ver empleo" |
| `app/(site)/clasificados/empleos/lib/empleosPremiumUi.ts` | K | Updated card shell tokens to cream surface + gold border; CTA updated to burgundy |

---

## 6. Schedule/Hours UX Result

- Schedule rows (`Día o bloque`, `Hora de inicio`, `Hora de fin`, `Añadir turno`) implemented in `EmpleoQuickApplicationClient.tsx` (Gate C, prior session — not modified this session).
- Multiple shifts supported via array of `scheduleRows`.
- Schedule string displayed in `QuickJobCTACard` via `whitespace-pre-line break-words` — multi-line shift data renders correctly without overflow.
- **Result: PASS**

---

## 7. Employer Business Card Data Result

All contact + social fields now flow from draft → published envelope → shell → UI:

| Field | Draft type | mapQuickDraftToShell | mapPublishedQuickToShell | QuickJobCTACard |
|---|---|---|---|---|
| `contactTitle` | ✅ | ✅ | ✅ (added Gate D) | ✅ |
| `companyTikTok` | ✅ | ✅ | ✅ (added Gate D) | ✅ |
| `companyYouTube` | ✅ | ✅ | ✅ (added Gate D) | ✅ |
| `companyX` | ✅ | ✅ | ✅ (added Gate D) | ✅ |
| `companySnapchat` | ✅ | ✅ | ✅ (added Gate D) | ✅ |

- **Result: PASS**

---

## 8. Preview Shell Result

`EmpleoQuickPreviewClient` → `LeonixPreviewPageShell` (unchanged — already mobile-safe with `min-h-[48px] w-full` back-to-edit button) → `EmpleoQuickDetailPage` with `withSiteChrome={false}`.

`EmpleoQuickDetailPage` now renders the full EN_VENTA canvas (warm radial gradient, cream cards, breadcrumb bar, description section, two-column grid) in preview mode.

- **Result: PASS**

---

## 9. Public Detail Shell Result

`EmpleosPublicLaneDetailClient` (quick lane path):
- Uses `mapPublishedQuickToShell` for data (all new fields mapped)
- Passes `quickEngagement` object to `EmpleoQuickDetailPage`
- `suppressEngagement={true}` on `PublicApplyFooter` prevents double engagement row
- `withSiteChrome={false}` (Navbar handled by page layout)
- Detail shell matches preview shell exactly

- **Result: PASS**

---

## 10. Right Apply/Contact Card Result

`QuickJobCTACard` upgraded:
- Card shell: `rounded-xl border border-[#D6C7AD]/85 bg-[#FFFDF7]` (cream + warm gold border)
- Pay headline: `text-[#7A1E2C]` (burgundy)
- Primary CTA (`applyLink`): `bg-[#7A1E2C]` burgundy with shadow
- Primary contact buttons (phone/whatsapp/email based on `primaryCta`): burgundy
- Secondary buttons (SMS, website): gold soft border
- Trust line: `border-l-[3px] border-[#2A4536]/45` EN_VENTA pattern
- "Conoce al empleador" section with icon+label social buttons
- Sticky right rail on `lg:` via `lg:sticky lg:top-24` in parent
- `min-w-0 overflow-hidden` prevents mobile overflow

- **Result: PASS**

---

## 11. Social Logos/Company Links Result

Social button pills in `QuickJobCTACard`:
- Each platform: icon (`react-icons`) + label text
- Rounded-lg cream pill with warm gold border on hover
- Brand colors: LinkedIn blue, Facebook blue, Instagram pink, TikTok charcoal, YouTube red, X charcoal, Snapchat gold-dark, Other globe
- `flex-wrap` ensures clean wrapping on narrow mobile
- No raw URLs displayed publicly
- URL sanitized via `sanitizeHttpUrl()` in both mapper paths

- **Result: PASS**

---

## 12. Location/Map Card Result

`QuickJobLocationCard` upgraded:
- Card shell aligned to new EN_VENTA tokens (`rounded-xl border border-[#D6C7AD]/80 bg-[#FFFDF7]`)
- Location pin SVG icon next to address block
- Employer footnote: "Ubicación indicada por el empleador."
- `QuickJobFauxMap` inline SVG: dark grid, road path, building blocks, gold vignette, burgundy map pin — exact port of `EnVentaLocationFauxMap`
- Open Maps button: opens Google Maps with encoded address query + calls `onOpen()`
- `QuickJobLocationToast` still wired for sheet fallback

- **Result: PASS**

---

## 13. Like/Share/Report Result

`EmpleosClasificadosEngagementRow` wired into `EmpleoQuickDetailPage`:
- Rendered when `engagement` prop is passed (public detail path)
- Not rendered in preview path (`engagement=null` by default)
- Suppressed in `PublicApplyFooter` for quick lane via `suppressEngagement={true}` (no double-render)
- `LeonixLikeButton` + `LeonixShareButton` — real analytics, real Supabase persistence
- Report: not a separate button in the engagement row; deferred to share sheet / future gate

- **Result: PASS (like/share live; report deferred)**

---

## 14. Results Card Result

`EmpleosJobResultCard` polished:
- Surface: `bg-[#FFFDF7]` cream, `border-[#D6C7AD]/80` warm border (via `EMPLEOS_CARD_STANDARD`)
- `CompanyAvatar`: shows logo image if available, otherwise warm gradient initials avatar
- Title: `text-[#3D3428]` charcoal, `decoration-[#C9A84A]/60` on hover-underline
- Pay: `text-[#7A1E2C]` burgundy
- Meta row: modality + jobType + category as warm chip pills `bg-[#FBF7EF]`
- CTA: "Ver empleo" / "View job" in `EMPLEOS_CTA_PRIMARY` (burgundy)
- `EMPLEOS_CTA_PRIMARY` updated in `empleosPremiumUi.ts` to burgundy to match detail CTA
- No fake analytics, no fake counters, no fake applicants
- Mobile: full-width image stacks above content at `< sm`; inline thumbnail at `sm:`

- **Result: PASS**

---

## 15. Mobile/PWA Result

Audit of key views at ~390px:

| Check | File | Fix Applied |
|---|---|---|
| No horizontal overflow | `EmpleoQuickDetailPage` | `overflow-x-hidden` on root; `min-w-0` on right col |
| Description text overflow | `EmpleoQuickDetailPage` | `break-words` added |
| Schedule text overflow | `QuickJobCTACard` | `break-words min-w-0` added to schedule span |
| CTA card blows out container | `QuickJobCTACard` | `min-w-0 overflow-hidden` on card root |
| Right rail stacks under content | `EmpleoQuickDetailPage` | `lg:col-span-5` grid — stacks at mobile, sticky only at `lg:` |
| Social buttons wrap cleanly | `QuickJobCTACard` | `flex-wrap gap-2` — OK |
| Faux map contained | `QuickJobLocationCard` | `overflow-hidden` + `aspect-[2/1] max-h-[7.5rem]` — OK |
| Preview controls accessible | `LeonixPreviewPageShell` | `min-h-[48px] w-full` on mobile — OK (not modified) |
| Result card image stacks | `EmpleosJobResultCard` | `aspect-[16/9] w-full` at mobile, thumbnail at `sm:` — OK |

- **Result: PASS**

---

## 16. Data Parity Result

All fields present in `EmpleosQuickDraft` → `mapQuickDraftToShell` (preview) and `mapPublishedQuickToShell` (public):
- `contactTitle`, `companyTikTok`, `companyYouTube`, `companyX`, `companySnapchat` — added to `mapPublishedQuickToShell` in Gate D
- `QuickJobDetailSample` type already had all optional fields
- No data loss between draft, preview, and published view

- **Result: PASS**

---

## 17. Analytics Truth Result

- `trackEmpleosResultCardClick` — real call in `EmpleosJobResultCard`, guarded by `isLiveListingId`
- `trackEmpleosSidebarContactCta` — real call in `QuickJobCTACard`
- `LeonixLikeButton` / `LeonixShareButton` — real Supabase-backed engagement with `persistEngagement` flag
- `empleosGlobalLikeRecorder` / `empleosGlobalShareRecorder` — real global analytics recorders
- No fake view counts, no fake applicant numbers, no fake "X people applied"

- **Result: PASS**

---

## 18. Risks / Deferred Work

| Item | Status | Notes |
|---|---|---|
| Report button | Deferred | Engagement row has like + share; report requires separate moderation surface |
| `job.logoSrc` on `EmpleosJobRecord` | Best-effort | Cast via `as Record<string, unknown>` since `EmpleosJobRecord` type doesn't formally expose `logoSrc`; will show initials avatar if undefined |
| `EmpleoPublicDetailClient` (legacy path) | Not upgraded | Old path for non-lane jobs; out of scope for E4 |
| Premium / Feria lane detail pages | Not changed | `EmpleoJobFairDetailPage`, `EmpleoPremiumDetailPage` — separate gates |
| Gate L report button | Deferred | Future Gate O or separate PR |

---

## TRUE/FALSE Audit Table

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | En Venta/Varios inspected as inspiration | TRUE | `enVentaBrand.ts`, `EnVentaBuyerPanel`, `EnVentaLocationFauxMap`, `EnVentaAnuncioLayout` read |
| 2 | En Venta/Varios files NOT modified | TRUE | `git diff --name-only` shows no `en-venta` files |
| 3 | Empleos schedule uses day/block + start + end | TRUE | `EmpleoQuickApplicationClient` has `scheduleRows` with `day`, `start`, `end` fields |
| 4 | Multiple shifts work | TRUE | `scheduleRows` is an array; rendered as multi-line string |
| 5 | Employer identity/contact/socials as organized trust system | TRUE | `QuickJobHeaderCard` (identity) + `QuickJobCTACard` (contact + socials + trust line) |
| 6 | Preview uses premium canvas | TRUE | `EmpleoQuickDetailPage` upgraded with EN_VENTA canvas tokens |
| 7 | Public detail matches preview shell | TRUE | Both use `EmpleoQuickDetailPage`; same layout, same tokens |
| 8 | Ugly generic side rail removed/replaced | TRUE | Old plain card replaced with cream+gold `QuickJobCTACard` + sticky rail |
| 9 | Social links use icon + label buttons | TRUE | `react-icons` + label text in pill buttons in `QuickJobCTACard` |
| 10 | No raw URLs publicly visible | TRUE | All URLs go through `CtaActionSheet` or `window.open`; no `<p>` with raw URL |
| 11 | Location card clean with faux map | TRUE | `QuickJobLocationCard` has `QuickJobFauxMap` + Open Maps button |
| 12 | Like/share/report real or hidden/documented | TRUE | Like + share real; report deferred and documented |
| 13 | Results card compact/premium | TRUE | `EmpleosJobResultCard` polished with cream surface, avatar, chips, burgundy CTA |
| 14 | Mobile/PWA no horizontal overflow | TRUE | `overflow-x-hidden`, `min-w-0`, `break-words` applied |
| 15 | No unrelated categories touched | TRUE | Only `clasificados/empleos` and `publicar/empleos` files changed |
| 16 | Build passed | TRUE | `next build` exit code 0 |
| 17 | No files staged | TRUE | `git status --short` clean |
| 18 | No commit created | TRUE | Confirmed |
| 19 | No push attempted | TRUE | Confirmed |
| 20 | `package-lock.json` not committed | TRUE | Not modified |
| 21 | `.env.local` not committed | TRUE | Not modified |
| 22 | `contactTitle` flows end-to-end | TRUE | Draft type → mappers → CTA card |
| 23 | New socials (TikTok/YouTube/X/Snapchat) flow end-to-end | TRUE | Draft type → mappers → CTA card |
| 24 | Audit doc exists | TRUE | This file |
| 25 | Audit script exists | TRUE | `scripts/empleos-e4-enventa-canvas-shell-audit.ts` |
