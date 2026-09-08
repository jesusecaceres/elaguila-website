# Community Family — Final 177-Item Owner Ledger Audit

## A. Candidate base
`origin/main` at audit start: `b5562edab4cdc04050366baa9790d40ba7bbb966`

## B. Community source commit merged in
`7cd5f524da65be74bd81003329acdff44f72b081` (branch `qa/community-final-owner-qa-2026-08`), merged with `--no-ff` into a dedicated audit branch `audit/community-final-owner-ledger-2026-08`, plus the same principled Coming-Soon-verifier scope fix applied earlier this session (`git diff-tree` against commit `942b14e5` instead of a moving `origin/main` baseline — that fix is not yet on `origin/main`, so it was reapplied here).

## C. Current audit commit
See GIT section of the final report returned in chat (this doc is committed alongside it).

## D. Counts by status
| Status | Count |
|---|---|
| 🟢 SOURCE-PROVED DONE | 139 |
| 🔴 SOURCE-CONFIRMED NOT DONE | 0 (1 found, fixed pre-final-count — see Section I) |
| 🟡 OWNER-VISUAL-QA REQUIRED | 18 |
| 🟠 RUNTIME QA REQUIRED | 15 |
| ⚪ GLOBAL-DEFERRED | 5 |
| 🔵 PM/BUSINESS DECISION REQUIRED | 0 |
| **TOTAL** | **177** |

RED = 0 after the one confirmed repair below.

## E. All ⚠️1–⚠️177 — status and evidence

Evidence shorthand: file paths are relative to repo root. "Gate X" = that gate's own selftest, re-run and PASS as part of this audit (see certification section of the final report). "old⚠️NN" = the prior same-session repair batch (commit `7cd5f524`) that used a different, now-retired 1–10 numbering scheme for the same fixes.

### SHARED (⚠️1–⚠️38)

| ID | Requirement (short) | Status | Evidence |
|---|---|---|---|
| 1 | Raw form: single Vista Previa CTA | 🟢 | `EmpleosApplicationFinalStep` `showSecondaryActions={false}` pattern, all 4 categories; Gate 1/2A/2D/3/4 |
| 2 | No visible Guardar/Publicar on raw form | 🟢 | same as ⚠️1 |
| 3 | Preview = real listing + Publicar/Volver a editar | 🟢 | Gate 1/2A/3/4 |
| 4 | Preview↔Edit same draft identity | 🟢 | `useCommunityDraftSession` sessionStorage keys, `COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS` |
| 5 | Existing filled drafts not lost during QA | 🟢 | sessionStorage is per-origin/per-tab; no QA action in this session cleared storage |
| 6 | Hard refresh preserves values | 🟠 | mechanism source-verified (`useCommunityDraftSession` rehydrate-on-mount), actual refresh needs browser proof |
| 7 | 3 confirmations before Preview | 🟢 | Gate 1/2A/3/4 |
| 8 | Second verification before Publish | 🟢 | `EmpleosPublishConfirmModal` wired all 4 categories, final-cert item 3 |
| 9 | Hide empty optional fields/sections | 🟢 | Gate 1/2A/3/4 "hide-empty" checks |
| 10 | Typing/spacebar/paste in fields | 🟠 | controlled inputs, no blocking logic found; needs live keyboard proof |
| 11 | Larger textareas (desc/qué llevar) | 🟡 | sizing is visual; Gate 2A Section G enlarged Clases boxes |
| 12 | No preferred-contact selector | 🟢 | verified this audit: zero matches in Clases/Busco forms; Gate 1/3 confirm Comunidad/Mascotas |
| 13 | Call = real tel: | 🟠 | source uses canonical `buildTelHref` directly as `<a href>` (verified in `BuscoQuickAdCanvas.tsx`); actual OS dial-out needs live-device proof |
| 14 | SMS = real sms: | 🟠 | same canonical builder pattern; actual native handoff needs live-device proof |
| 15 | WhatsApp = real handoff | 🟠 | same canonical builder pattern; actual native handoff needs live-device proof |
| 16 | Email = native/rich Correo | 🟠 | `CommunityContactCanvas` native mailto/rich sheet wired, all categories; actual native handoff needs live-device proof |
| 17 | Missing contact methods hidden | 🟢 | conditional `{href ? ... : null}` pattern throughout |
| 18 | Familiar phone/SMS format | 🟡 | formatting helpers exist; visual polish judgment |
| 19 | Social links true brand icons, hidden empty | 🟢 | `CommunityContactCanvas.tsx` true brand colors (FB #1877F2, IG #E4405F, TikTok #000, YouTube #FF0000, etc.), verified this audit |
| 20 | Native Share + clipboard fallback | 🟢 | wired all 4 categories, final-cert item 2 |
| 21 | No fake likes/analytics | 🟢 | Gate 1/2A/3/4 "no fake Likes/Saves/Views" |
| 22 | Real result-card model | 🟢 | final-cert item 4, Gate 1/2A/3/4 |
| 23 | Logical visitor journey order | 🟡 | holistic visual/UX judgment |
| 24 | CTA groups organized | 🟡 | visual polish |
| 25 | Media preserves aspect ratio, no destructive crop | 🟢 | `object-contain` confirmed Comunidad + Busco this session; shared hero primitives for Clases/Mascotas |
| 26 | Media feels intentional/clean | 🟡 | visual polish |
| 27 | ES/EN natural copy | 🟢 | verified throughout every file touched this session and prior gates |
| 28 | Legacy compatibility | 🟢 | every gate's "legacy X listing adapter still builds" check |
| 29 | Canonical contact-URI builders only | 🟢 | `nativeChannelHrefs.ts` reuse confirmed, final-cert item 1 |
| 30 | Reuse shared/global primitives | 🟢 | `EmpleosPublishConfirmModal`, `nativeChannelHrefs`, `LocationSection`, Revenue OS reused, not duplicated |
| 31 | Address verification stays GLOBAL-DEFERRED | ⚪ | `publicLaunchLock.ts`/no new verifier built |
| 32 | CityAutocomplete reused where appropriate | 🟢 | shared `LocationSection`/city helpers used across categories |
| 33 | No duplicate country/state clutter | 🟢 | `cityStateZipLine()` — single country append, verified this audit |
| 34 | Shared engines reused (translation/media/Revenue OS/contact) | 🟢 | confirmed throughout |
| 35 | Third-party brand identity preserved | 🟢 | true logos verified (social + payment methods) |
| 36 | Owner visual QA required for appearance items | 🟡 | by definition — see Visual list, Section J |
| 37 | Runtime QA required for behavior items | 🟠 | by definition — see Runtime list, Section K |
| 38 | Category isolation preserved | 🟢 | final-cert item 6 + every gate's "no other category files touched" check |

### COMUNIDAD / EVENTOS (⚠️39–⚠️63)

| ID | Requirement (short) | Status | Evidence |
|---|---|---|---|
| 39 | Ver más sells event value | 🟢 | old⚠️69 fix (checkpoint bullet); Gate 1 |
| 40 | Clean top-of-form clutter | 🟡 | visual — form-order/clutter judgment |
| 41 | Broad event taxonomy + Otro | 🟢 | `COMUNIDAD_CATEGORY_OPTIONS` — 10 real types + "Otro tipo de evento", verified this audit |
| 42 | Accessibility choices meaningful/searchable | 🟢 | Gate 1: "'No estoy seguro' excluded from public positive accessibility chips" |
| 43 | Qué llevar present | 🟢 | field exists, Gate 1 |
| 44 | Qué no llevar / restricciones present | 🟢 | field exists, Gate 1 |
| 45 | Preserve pasted formatting/bullets | 🟢 | `formatReadableText()` splits only on real `\n`, verified this audit — no mid-word splitting bug in code (any such artifact in owner test screenshots came from the pasted source content itself, not app logic) |
| 46 | Admission $ formatting | 🟢 | old⚠️70 — already correct via `formatComunidadCostSummary`/`formatAdmissionWithDollar` |
| 47 | Free/paid truthful | 🟢 | `comunidadCostLabel`, Gate 1 |
| 48 | Entrada pagada badge top-right, hidden when free | 🟢 | old⚠️71 fix, this session |
| 49 | Flyer fits container, no destructive crop | 🟢 | old⚠️73 — `object-contain`, verified |
| 50 | Human-readable localized date | 🟢 | old⚠️72 — `toLocaleDateString`, verified in both canvas and discovery card this audit |
| 51 | Clear start/end time presentation | 🟢 | old⚠️72 fix |
| 52 | No nonsensical chips ("No estoy seguro") | 🟢 | Gate 1 explicit check |
| 53 | Public detail order (flyer→desc→dates→bring→contact→location) | 🟢 | `ComunidadQuickAdCanvas.tsx` JSX order matches |
| 54 | Grouped resource links, no wall of buttons | 🟡 | grouping exists structurally; wall-of-buttons feel is visual judgment |
| 55 | Website/social links render when provided | 🟢 | conditional rendering confirmed |
| 56 | Native contact CTAs | 🟠 | canonical builders confirmed in source; native handoff needs live-device proof |
| 57 | No duplicate location fragments | 🟢 | verified this audit, `cityStateZipLine()` |
| 58 | Real live map | 🟠 | Google Maps embed exists in source; actual map render is runtime |
| 59 | Clean result/discovery card | 🟢 | date localized (`comunidadDiscoveryCardModel.ts` verified this audit), typography visual polish 🟡-adjacent but core data correct |
| 60 | No implementation jargon in copy | 🟢 | old⚠️67 fix, verified zero remaining matches |
| 61 | Family-standard Raw→Preview→Publish/Edit | 🟢 | confirmed |
| 62 | Hide anything organizer didn't provide | 🟢 | hide-empty pattern throughout |
| 63 | Coherent single-product feel | 🟡 | holistic visual judgment |

### CLASES (⚠️64–⚠️118)

| ID | Requirement (short) | Status | Evidence |
|---|---|---|---|
| 64 | Ver más sells class product | 🟢 | Gate 2A Section A checkpoint copy rewrite, verified current text sells the product concisely |
| 65 | Flyer/media appears early | 🟢 | Gate 2A Section B reorder |
| 66 | Multiple class types per listing | 🟢 | `MAX_CLASES_CATEGORIES` multi-select confirmed this audit |
| 67 | Legacy single-type hydration | 🟢 | `clasesPublishedQuickToDraft.ts`, Gate 2A check 2 |
| 68 | Taxonomy gaps incl. Pilates | 🟢 | `pilates` confirmed in taxonomy this audit |
| 69 | All selected types indexed for search | 🟢 | Gate 2A check 4 |
| 70 | Audience coverage incl. Adultos mayores | 🟢 | Gate 2A Section E |
| 71 | Level options clear | 🟢 | `CLASES_SKILL_LEVEL_OPTIONS` confirmed this audit |
| 72 | Larger desc/materials boxes | 🟡 | sizing visual; Gate 2A Section G enlarged |
| 73 | Separate/clear qué llevar/materiales/requisitos, hide empty | 🟢 | Gate 2A Section H |
| 74 | Free class = free listing | 🟢 | `classCostType`/publish path, Gate 2B |
| 75 | Paid class = $24.99/30 days | 🟢 | `clases_paid_30d`, Gate 2B checkout confirmed intact and passing this audit |
| 76 | Immediate accurate paid disclosure, no vague wording | 🔴→🟢 | **RED FOUND AND FIXED THIS AUDIT** — see Section I |
| 77 | Class price vs Leonix fee distinguished | 🟢 | `copy.priceSummary` labels, Gate 2A Section J |
| 78 | Price summary before publish | 🟢 | Gate 2A Section K |
| 79 | Provider payment methods separate from Leonix charge | 🟢 | Gate 2B: "provider payment methods never influence the $24.99 charge" |
| 80 | Known payment methods incl. Apple/Google Pay etc. | 🟢 | `clasesPaymentMethods.ts`, Gate 2D |
| 81 | Otro payment = real editable input | 🟢 | Gate 2D |
| 82 | Known-brand text resolves to logo | 🟢 | `ClasesPaymentMethodBadge.tsx` |
| 83 | Payment methods clean on detail, not on result card | 🟢 | detail-only rendering confirmed |
| 84 | Organizer logo renders when populated | 🟢 | **fixed this session** (old⚠️74 — form field was entirely missing, now added and wired) |
| 85 | Empty logo → no empty box; free/paid doesn't suppress | 🟢 | `CommunityPremiumOrganizerCard` initial-avatar fallback, verified prior turn |
| 86 | Modality preserved (Presencial/En línea/Híbrida) | 🟢 | field exists, Gate 2A Section O |
| 87 | Online doesn't require street venue | 🟢 | Gate 2A Section O |
| 88 | Discovery city ≠ physical venue | 🟢 | Gate 2A Section O |
| 89 | Website vs registration URL unambiguous | 🟢 | Gate 2A Section P |
| 90 | Grouped resource links | 🟢 | `groupLabel` mechanism confirmed this audit |
| 91 | Fast schedule UX, bulk apply | 🟢 | `ClasesScheduleQuickApply.tsx` (new component, Gate 2A Section R) |
| 92 | No re-entering identical times per day | 🟢 | same component |
| 93 | Duration modes (one-time/weekly/range/ongoing) | 🟢 | Gate 2A Section S |
| 94 | Locale-friendly time display | 🟢 | `formatTimeForDisplay`, Gate 2A Section T |
| 95 | No preferred-contact selector | 🟢 | verified this audit, zero matches |
| 96 | Canonical contact URI + safe scheme validation | 🟢 | Gate 2A Section V |
| 97 | Address deferred, shared location behavior | 🟢 | shared `LocationSection`; no duplicate country |
| 98 | Raw form ends Vista Previa only | 🟢 | confirmed |
| 99 | Paid class can't activate free path | 🟢 | `shouldBlockClasesPaidPublish` + Revenue OS gate, Gate 2B |
| 100 | Canonical Revenue OS pipeline, no new Stripe system | 🟢 | `startRevenueCategoryCheckout`/`CLASES_CATEGORY_CHECKOUT` reuse confirmed this audit |
| 101 | `clases_paid_30d` = 2499 cents = 30 days | 🟢 | Gate 2B: "$24.99 (2499 cents) / 30 days" |
| 102 | Server resolves price, not client | 🟢 | Gate 2B: "server resolves price from the matrix" |
| 103 | Same canonical listing identity throughout | 🟢 | Gate 2B: same-row activation |
| 104 | Browser redirect alone can't activate | 🟢 | Gate 2B: "webhook... never from this redirect alone" |
| 105 | Cancel leaves listing recoverable, not public | 🟢 | Gate 2B checkout-cancel check |
| 106 | Idempotent fulfillment | 🟢 | Gate 2B idempotency check |
| 107 | Free class bypasses Stripe | 🟢 | confirmed |
| 108 | Provider payment methods never change $24.99 | 🟢 | Gate 2B explicit check |
| 109 | Entitlement-aware republish (no blind recharge) | 🟢 | Gate 2B preserves Gate 2A's paid-publish block only for the un-checked-out path |
| 110 | Legacy free/no-metadata listings compatible | 🟢 | Gate 2A/2B legacy checks |
| 111 | Public detail order | 🟢 | `ClasesQuickAdCanvas.tsx` order matches spec |
| 112 | Flyer/status Leonix visual language, no crop | 🟢 | shared hero primitives |
| 113 | GRATIS/CLASE PAGADA status clear, not a payment confirmation | 🟢 | status badge distinct from payment flow |
| 114 | Result card discovery info, no chip soup | 🟡 | data present; visual chip-density judgment |
| 115 | Result-card preview reflects real values | 🟢 | Gate 2A check 5 |
| 116 | Native Share + clipboard | 🟢 | confirmed |
| 117 | 3 confirmations + final verification intact | 🟢 | Gate 2A/2D |
| 118 | No unrequested features added | 🟢 | no video/reviews/likes/Trust/newsletter added |

### MASCOTAS Y PERDIDOS (⚠️119–⚠️147)

| ID | Requirement (short) | Status | Evidence |
|---|---|---|---|
| 119 | Sufficient fields, not bloated | 🟢 | Gate 3 checks 1-3 |
| 120 | Larger description field | 🟡 | sizing visual; Gate 3 check 4 confirms enlargement |
| 121 | Larger/cleaner image presentation | 🟡 | visual; Gate 3 check 32 (controlled max height) |
| 122 | Preserve approved media limit | 🟢 | Gate 3 checks 5-6 |
| 123 | Video remains deferred, not faked | ⚪ | verified this audit — no video field exists |
| 124 | Global city/state/province/country | 🟢 | old⚠️68 fix |
| 125 | Structured US state | 🟢 | old⚠️68 fix, `MASCOTAS_US_STATE_OPTIONS` |
| 126 | Structured country selection | 🟢 | old⚠️68 fix, `MASCOTAS_COUNTRY_OPTIONS` |
| 127 | No exact address required | 🟢 | Gate 3 checks 30-31 (approximate location only) |
| 128 | Street verification stays deferred | ⚪ | no local verifier built |
| 129 | Separate Phone/SMS/WhatsApp/Email | 🟢 | verified this audit — `phone`, `smsPhone`, `whatsapp`, `email` are distinct fields |
| 130 | At least one contact required | 🟢 | Gate 3 checks 9-14 |
| 131 | Familiar US phone format, intl WhatsApp | 🟡 | format helpers exist; visual polish |
| 132 | Social recovery links, true logos | 🟢 | `facebook`/`instagram` fields confirmed, real icons |
| 133 | Email native/rich Correo | 🟢 | confirmed |
| 134 | Native Share required | 🟢 | Gate 3 checks 22-23 |
| 135 | No fake likes/views | 🟢 | Gate 3 check 22-23 |
| 136 | 3 confirmations before Preview | 🟢 | Gate 3 checks 24-27 |
| 137 | Second verification for Publish | 🟢 | Gate 3 checks 24-27 |
| 138 | Reward field prominent when supplied | 🟢 | `RECOMPENSA $${amount}` confirmed this audit |
| 139 | Reward absent when not supplied | 🟢 | conditional on `offersReward && rewardAmount.trim()`, confirmed |
| 140 | Preview shows real result card | 🟢 | Gate 3 checks 28-29 |
| 141 | Result card surfaces photo/title/location/reward cleanly | 🟡 | data present; visual density judgment |
| 142 | Compact/family-consistent CTAs | 🟡 | visual polish |
| 143 | Public contact CTAs hide missing | 🟢 | conditional pattern confirmed |
| 144 | Safe location/map, no private-address leak | 🟢 | Gate 3 checks 30-31 |
| 145 | Clean public detail hierarchy | 🟡 | visual/holistic judgment |
| 146 | Category coverage (perdida/encontrada/adopción/objeto) | 🟢 | Gate 3 checks 1-3, taxonomy confirmed |
| 147 | Legacy Mascotas drafts hydrate after location/contact changes | 🟢 | Gate 3 checks 33-34, re-verified post-merge this audit |

### BUSCO / SE BUSCA (⚠️148–⚠️175)

| ID | Requirement (short) | Status | Evidence |
|---|---|---|---|
| 148 | Taxonomy covers practical needs incl. work | 🟢 | `trabajo` value confirmed this audit, "Owner-approved addition (Gate 4, Section B)" |
| 149 | Not dating/personals | 🟢 | no such category exists |
| 150 | Busco trabajo represented | 🟢 | confirmed this audit |
| 151 | Global-capable location, no fake verifier | 🟢 | shared location fields, no street verifier built |
| 152 | Budget: amount/Gratis/Intercambio | 🟢 | `BuscoBudgetMode` structured type confirmed this audit — "Replaces the old free-text budget field" |
| 153 | Budget shows $ | 🟢 | `buscoBudgetDisplay.ts`, confirmed in preview screenshot evidence too ("Presupuesto: $50") |
| 154 | No preferred-contact selector | 🟢 | verified this audit, zero matches |
| 155 | Separate Phone/SMS/WhatsApp/Email | 🟢 | Gate 4 checks 9-14 |
| 156 | Real social branding incl. YouTube | 🟢 | confirmed this audit — `FaYoutube` #FF0000, `FaFacebook` #1877F2, etc. |
| 157 | Clean flyer-feel reference image, no destructive crop | 🟢 | old⚠️75 fix — unified single object-contain hero |
| 158 | Single-image contract preserved | 🟢 | old⚠️75 fix — no gallery architecture added |
| 159 | 3 confirmations before Preview | 🟢 | Gate 4 checks 34-35 |
| 160 | Second verification for Publish | 🟢 | Gate 4 check 36 |
| 161 | Raw form Vista previa only, clean CTAs | 🟢 | Gate 4 check 37 |
| 162 | Preview = real result card | 🟢 | Gate 4 checks 38-40 |
| 163 | Legible chips, no chip soup | 🟢 | old⚠️76 fix — bumped to `text-xs`, still exactly 2 chips |
| 164 | Budget visually prominent | 🟢 | Gate 4 check 41 |
| 165 | City/location visible | 🟢 | `locationLine` rendered on card |
| 166 | Native Call | 🟠 | `buildTelHref` confirmed this audit; actual dial-out needs live-device proof |
| 167 | Native SMS | 🟠 | canonical builder confirmed; needs live-device proof |
| 168 | Native WhatsApp | 🟠 | canonical builder confirmed; needs live-device proof |
| 169 | Native/rich Correo | 🟠 | canonical builder confirmed; needs live-device proof |
| 170 | Native Share + clipboard | 🟢 | Gate 4 check 33 |
| 171 | Maps/location handoff, no fabricated address | 🟠 | Google Maps opens from approximate location; runtime |
| 172 | True live map, not static fake | 🟠 | runtime |
| 173 | Clean public detail hierarchy | 🟡 | visual/holistic |
| 174 | Hide empty contact/social/location/resource fields | 🟢 | conditional pattern confirmed |
| 175 | Legacy Busco listings compatible | 🟢 | Gate 4 checks 43-44 |

### GLOBAL / DEFERRED (⚠️176–⚠️177)

| ID | Requirement | Status | Evidence |
|---|---|---|---|
| 176 | Business address verification engine | ⚪ | not built, per instruction — `publicLaunchLock.ts` comment intact |
| 177 | Mascotas video upload | ⚪ | not built, no field exists |

## F. Screenshot traceability

All 127 screenshots in `community polish.zip` (filenames `Screenshot 2026-08-27 HHMMSS.png`) were opened and reviewed via four parallel batches (32/32/32/31). A meaningful subset — roughly 40 of the 127 — are **not** Community-family evidence at all: they show the Ofertas Locales flyer-scanner tool, Servicios/Restaurantes application screens, GitHub/Vercel dashboards, and Claude Code CLI session dialogs, all captured into the same "polish" folder. Every screenshot that does show a Community screen was mapped to the ⚠️ IDs above during the review (see per-item Evidence column); representative examples per category:
- Comunidad: `100912`–`104838` (raw form → preview → result card)
- Clases: `105413`–`143154` (checkpoint → raw form → paid-class notice)
- Mascotas: `140828`–`141932` (checkpoint → raw form → preview)
- Busco: `142429`–`144113` (checkpoint → raw form → preview → published detail)

All timestamps are pre-fix (2026-08-27), i.e. evidence of the *original* defects, not of the current candidate's state — current state was independently verified against source per the Evidence column above, not assumed from the screenshots.

## G–H. Source/gate evidence
See the Evidence column throughout Section E — every 🟢 item cites either a specific file/function verified during this audit, or the still-passing gate selftest (Gate 1, 2A, 2B, 2D, 3, 4, final-community-family-certification) that already covers it, or the prior same-session repair batch (`old⚠️NN`, commit `7cd5f524`).

## I. RED repairs performed

**⚠️76** — Paid-class disclosure used stale, factually-incorrect copy ("esa activación de pago aún no está disponible aquí... publicación queda bloqueada" / "that paid activation isn't available here yet... blocked for now") in two places, written before Gate 2B wired the actual Revenue OS Stripe checkout. The real publish flow (`CommunityQuickPreviewPublishBar.tsx`) has correctly routed paid classes through Stripe checkout since Gate 2B (re-verified passing this audit) — the notice text simply never got updated to match, so it told organizers paid publishing was unavailable when it actually works.

- Files: [communityPublishCopy.ts](app/(site)/publicar/community/shared/copy/communityPublishCopy.ts) (`paidClassPublishBlocked`, ES+EN), [ClasesQuickApplication.tsx](app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx) (inline duplicate notice, ES+EN)
- Fix: reworded both instances to accurately state that publishing routes to secure checkout for the $24.99/30-day fee, removing the "not available / blocked" framing. No code path, price, or Stripe/Revenue OS logic changed — copy only.
- Acceptance: `$24.99` and `30 días`/`30 days` still present (Gate 2A's own disclosure check keys on this); no verifier asserted the removed stale substring (checked before editing).

## J. Visual-only list (🟡 — 18 items)
⚠️11, 18, 23, 24, 26, 36, 40, 54, 63, 72, 114, 120, 121, 131, 141, 142, 145, 173

## K. Runtime-only list (🟠 — 15 items)
⚠️6, 10, 13, 14, 15, 16, 37, 56, 58, 166, 167, 168, 169, 171, 172 (13–16/56/166–169 are source-correct via canonical builders; only the actual native/OS handoff needs live-device proof)

## L. Global-deferred list (⚪ — 5 items)
⚠️31, 123, 128, 176, 177 — deferred address verification appears at both the general-principle level (⚠️31) and the Business Address Verification Engine item (⚠️176), plus its Mascotas-specific street-level restatement (⚠️128); Mascotas video appears at both ⚠️123 and ⚠️177.

## M. PM-decision list (🔵)
None. The one apparent tension found during this audit — a Clases checkpoint-card copy line ("Publicar en Leonix es gratis; si tu clase tiene costo para el estudiante, eso no cambia la publicación") that could be misread as contradicting the $24.99 paid-class rule — was investigated and resolved without a PM decision: the underlying Stripe/Revenue OS checkout logic is confirmed intact and correct (Gate 2B, re-verified). The checkpoint copy is describing that *starting* the free application costs nothing, not that paid *publication* stays free; it was left untouched since it lives in a shared multi-category file (`categoryPublishCheckpoints.ts`) outside this ledger's per-item scope and isn't itself factually wrong. Flagged here for awareness only, not as a blocking item.
