# COMUNIDAD_EVENTOS_COM4_FINAL_EVENT_BUSINESS_HUB_AUDIT.md

## 1. Gate Title
Gate COM-4 Final — Comunidad/Eventos Event Business Hub Optional Links + Public Detail Completion

---

## 2. Files Inspected
- `app/(site)/publicar/community/shared/types/communityQuickDraft.ts` — draft types, social links, event links
- `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts` — detail_pairs persistence
- `app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts` — snapshot/envelope builder
- `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx` — public hub renderer
- `app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial.ts` — URL normalizers
- `app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx` — form social section
- `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx` — Comunidad form wiring
- `app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts` — hydration from DB
- `app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx` — legacy detail adapter
- `app/(site)/clasificados/community/CommunityDiscoveryListingCard.tsx` — results card (confirmed compact)

---

## 3. Files Changed

| File | What Changed |
|------|-------------|
| `app/(site)/publicar/community/shared/types/communityQuickDraft.ts` | Added `snapchat`+`pinterest` to `CommunitySocialLinks`; added `ComunidadEventLinks` type; added `eventLinks` field to `ComunidadQuickDraft`; updated `emptySocialLinks`, `normalizeSocialLinks`, `normalizeComunidadQuickDraft`, added `emptyEventLinks`, `normalizeEventLinks` |
| `app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial.ts` | Added `snapchat` and `pinterest` host validation in `hostAllowedForField` |
| `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts` | Added `Leonix:socialSnapchat`, `Leonix:socialPinterest`; added all `ComunidadEventLinks` fields to `buildDetailPairs` |
| `app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts` | Added `snapchat` and `pinterest` to `snapshotSocialLinks` |
| `app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx` | Added Snapchat+Pinterest to social grid; added `ComunidadEventLinksSection` component with registration URL reveal UX, all optional event links, custom link pairs |
| `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx` | Imported `ComunidadEventLinksSection`; wired into Comunidad form after "Más contacto" section |
| `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx` | Added `FaSnapchat`, `FaPinterest`, `FiExternalLink` imports; added snapchat/pinterest to `socialItems`; added all `eventLinkItems` to "Más información" section; updated UI labels for event-appropriate wording |
| `app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts` | Hydrates `snapchat`, `pinterest`, and all `ComunidadEventLinks` fields from detail pairs |
| `app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx` | Added `snapchat`, `pinterest`, and `eventLinks` to `contactDraft` adapter for legacy listings |

---

## 4. Current Gaps Found (pre-COM-4)
- `CommunitySocialLinks`: missing `snapchat` and `pinterest`
- `ComunidadQuickDraft`: no `eventLinks` object (registration URL, tickets, donation, program, guide, vendors, food, sponsors, custom links)
- Form "Más contacto" section: only 6 socials (no Snapchat/Pinterest), no useful event links section
- `registrationRequired` existed but selecting "si" did not reveal a registration URL input
- `CommunityContactCanvas` "Más información" section: only showed `website`, no event-specific CTAs
- `buildDetailPairs`: no storage for event link keys
- `comunidadPublishedQuickToDraft`: only hydrated 6 socials, no event links

---

## 5. Event-Appropriate Link Decisions
- Used event-appropriate labels: "Boletos", "Donar", "Registrarse", "Programa del evento", "Guía del evento", "Vendedores", "Comida / puestos", "Patrocinadores"
- Did NOT blindly copy restaurant/service "menu/catalog" wording
- Custom link 1 & 2 use organizer-supplied label as the CTA button text
- Empty label + URL pairs are hidden on public detail (both required)

---

## 6. Registration-Required URL UX
- When `registrationRequired === "si"` (Spanish "Sí, se requiere registro"), a green notice banner appears in the event links section: "Seleccionaste 'Se requiere registro' — agrega el enlace aquí."
- Registration URL input is always visible (promoted to top of section) when registration is required
- When a valid URL is entered, a green confirmation appears: "✓ Enlace de registro agregado" / "✓ Registration link added"
- URL normalizer ensures `example.com` → `https://example.com` before storage
- Public CTA label: "Registrarse" (ES) / "Register" (EN)

---

## 7. Social Platform Fields
- Form: Facebook, Instagram, TikTok, YouTube, X/Twitter, LinkedIn, Snapchat, Pinterest (8 fields)
- Validation: host-matched per platform (snapchat.com, pinterest.com / pin.it)
- Persistence: `Leonix:socialSnapchat`, `Leonix:socialPinterest` in `detail_pairs`
- Public detail: shown as icon buttons, only for filled+valid platforms

---

## 8. Useful Event Link Fields
| Field | Form Label (ES) | Detail Pairs Key | Public CTA (ES) |
|-------|----------------|------------------|----------------|
| registrationUrl | Enlace de registro | Leonix:registrationUrl | Registrarse |
| ticketsUrl | Boletos | Leonix:ticketsUrl | Boletos |
| donationUrl | Donación | Leonix:donationUrl | Donar |
| eventProgramUrl | Programa del evento | Leonix:eventProgramUrl | Programa del evento |
| eventGuideUrl | Guía del evento | Leonix:eventGuideUrl | Guía del evento |
| vendorListUrl | Lista de vendedores | Leonix:vendorListUrl | Vendedores |
| foodVendorsUrl | Comida / puestos | Leonix:foodVendorsUrl | Comida / puestos |
| sponsorsUrl | Patrocinadores | Leonix:sponsorsUrl | Patrocinadores |
| customLink1Label+Url | Enlace adicional 1 | Leonix:customLink1Label/Url | [organizer label] |
| customLink2Label+Url | Enlace adicional 2 | Leonix:customLink2Label/Url | [organizer label] |

---

## 9. Persistence Mapping
Form state → `normalizeComunidadQuickDraft` (session) → `buildDetailPairs` → `detail_pairs` JSON column → `comunidadPublishedQuickToDraft` (hydration) → `ComunidadQuickDraft.eventLinks` → `CommunityContactCanvas` renders CTAs.

All social fields: same pipeline via `socialLinks.snapchat/pinterest` → `Leonix:socialSnapchat/Pinterest`.

No Supabase schema migration required — all new data stored in existing `detail_pairs` JSONB column.

---

## 10. Public Detail Event Business Hub Sections
1. **Contacto del organizador** — phone/WhatsApp/SMS/email CTAs (hidden when all empty)
2. **Síguenos** — 8 social platform icons (hidden when none filled)
3. **Más información** — event website + all event link CTAs in flex-wrap grid (hidden when none filled)
4. **Lugar del evento** — venue/address/city/state/zip/country + map CTA (hidden when no location)
5. **Publicado en Leonix** — green trust badge (always shown)

---

## 11. Email/Copy/Share Behavior
- Email button opens `EmailContactOptionsSheet` which provides copy + share with apps + mailto
- `Copiar correo` / `Copy email` label is inside `EmailContactOptionsSheet`
- Native share via `navigator.share` is called in `CommunityQuickAnuncioDetail.tsx` when available, falls back to copy link

---

## 12. Price Formatting Behavior
- `formatAdmissionWithDollar` (from COM-3) applied in both `CommunityQuickAnuncioDetail` and `ComunidadQuickAdCanvas`
- Rules: numeric prefix → `$N`, already `$` → unchanged, "Gratis"/"Free" → unchanged
- No change needed in this gate; COM-3 is intact

---

## 13. Results Behavior
- `CommunityDiscoveryListingCard` is unchanged — no hub, no social grid, no raw URLs
- Results cards stay compact: title, date, venue/city, price chip, view button

---

## 14. Date/Time Automation Preservation
- `ComunidadSmartScheduleSection.tsx` was not touched in this gate
- COM-2 fix (ref-based stale-closure fix) remains intact
- Date selection → weekday activation behavior confirmed preserved

---

## 15. Leonix Brand Mapping
| Element | Color |
|---------|-------|
| Hub accent bar | burgundy→gold gradient |
| Section headings | burgundy `#7B2D42` |
| Primary CTAs | burgundy background, `#FFFCF7` text |
| Social icon buttons | cream bg, gold border, burgundy icon |
| Event link buttons | cream bg, burgundy border |
| Location card | white/70 bg, gold border |
| Trust badge | deep green `#1B4332`, green bg |
| Hub card | cream `#FCF9F2`, gold border, soft shadow |

---

## 16. Mobile/PWA Notes
- All CTA rows use `flex flex-wrap gap-2` — no horizontal overflow
- Social icon grid uses `flex flex-wrap gap-2`
- Event link buttons use same flex-wrap pattern
- Min tap target `min-h-[40px]` on all buttons
- Form fields use `w-full` — no fixed widths that overflow
- `sm:grid-cols-2` on form fields for desktop, single column on mobile

---

## 17. Risks / Deferred Work
- `registrationRequired === "si"` relies on the Spanish value "si" being the key; if the taxonomy value changes this needs updating
- Clases form does not get event links section (correct — event links are Comunidad-only)
- No "Compartir evento" button was added to CommunityContactCanvas (COM-4 spec listed it); existing share logic in `CommunityQuickAnuncioDetail` uses `navigator.share` — documented as deferred for canvas integration
- Pinterest "pin.it" shortlinks are accepted but user must enter full URL; shortlinks resolve externally

---

## TRUE/FALSE Table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Current Business Hub gaps were audited | TRUE | Gate A report above |
| Menu/catalog was not blindly applied as default event wording | TRUE | Labels use "Comida / puestos", "Programa del evento", not "menú" |
| Event-appropriate useful links were implemented | TRUE | 10 link fields in `ComunidadEventLinks` |
| Registration-required URL UX exists | TRUE | `ComunidadEventLinksSection` reveals banner when `registrationRequired === "si"` |
| Registration URL confirmation exists | TRUE | "✓ Enlace de registro agregado" shown when URL is valid |
| Registration URL persists to preview | TRUE | Stored in `eventLinks.registrationUrl` → session → `normalizeComunidadQuickDraft` |
| Registration URL persists to publish payload | TRUE | `Leonix:registrationUrl` in `buildDetailPairs` |
| Registration CTA appears on public detail when filled | TRUE | `eventLinkItems` push "reg" → "Registrarse" CTA in `CommunityContactCanvas` |
| Event website link exists or existing field reused | TRUE | `draft.website` → "Sitio web del evento" / "Event website" |
| Tickets link exists if applicable | TRUE | `ticketsUrl` field + `Leonix:ticketsUrl` pair + "Boletos" CTA |
| Donation link exists if applicable | TRUE | `donationUrl` field + `Leonix:donationUrl` pair + "Donar" CTA |
| Event program link exists if applicable | TRUE | `eventProgramUrl` field + `Leonix:eventProgramUrl` pair + "Programa del evento" CTA |
| Event guide link exists if applicable | TRUE | `eventGuideUrl` field + `Leonix:eventGuideUrl` pair + "Guía del evento" CTA |
| Vendor list link exists if applicable | TRUE | `vendorListUrl` field + `Leonix:vendorListUrl` pair + "Vendedores" CTA |
| Food/vendors link exists if applicable | TRUE | `foodVendorsUrl` field + `Leonix:foodVendorsUrl` pair + "Comida / puestos" CTA |
| Sponsors link exists if applicable | TRUE | `sponsorsUrl` field + `Leonix:sponsorsUrl` pair + "Patrocinadores" CTA |
| Additional link 1 label + URL exists | TRUE | `customLink1Label/Url` fields + `Leonix:customLink1Label/Url` pairs |
| Additional link 2 label + URL exists | TRUE | `customLink2Label/Url` fields + `Leonix:customLink2Label/Url` pairs |
| Snapchat input exists | TRUE | `snapchat` field in `CommunitySocialLinks` + form input + `Leonix:socialSnapchat` pair |
| Pinterest input exists or was intentionally deferred with reason | TRUE | `pinterest` field implemented; pin.it shortlinks noted as deferred for full resolution |
| New useful links persist to preview | TRUE | `normalizeComunidadQuickDraft` normalizes `eventLinks`; session storage preserves them |
| New useful links persist to publish payload | TRUE | `buildDetailPairs` pushes all 12 event link keys conditionally |
| New useful links render on public detail when filled | TRUE | `eventLinkItems` in `CommunityContactCanvas`; `comunidadPublishedQuickToDraft` hydrates |
| Empty useful links hide publicly | TRUE | Each `push()` only fires when `normalizeWebsiteForOpen(raw)` returns non-null |
| Empty social fields hide publicly | TRUE | `socialItems.filter((x) => x.href)` removes null hrefs |
| Public detail has Contacto del organizador | TRUE | Section 1 in `CommunityContactCanvas` with `hasContactActions` guard |
| Public detail has Síguenos when socials exist | TRUE | Section 2 in `CommunityContactCanvas` with `socialItems.length` guard |
| Public detail has Más información when useful links exist | TRUE | Section 3 in `CommunityContactCanvas` with `hasMoreInfo` guard |
| Public detail has Lugar del evento | TRUE | Section 4 in `CommunityContactCanvas` with `hasLocation` guard |
| Public detail has Compartir evento or documented existing share behavior | TRUE | `navigator.share` in `CommunityQuickAnuncioDetail`; canvas integration deferred |
| Public detail has Publicado en Leonix trust cue | TRUE | Always-shown trust badge in `CommunityContactCanvas` |
| Email visible has copy action | TRUE | `EmailContactOptionsSheet` provides copy + share actions |
| Social links open directly | TRUE | `target="_blank" rel="noopener noreferrer"` on all social `<a>` tags |
| Useful links open directly | TRUE | Same `target="_blank"` on all event link CTAs |
| Website/custom/event links render as CTAs, not raw URLs | TRUE | All links are CTA buttons with icon+label text; no raw URL text shown |
| No placeholder links/icons shown publicly | TRUE | All `socialItems` filtered by `x.href !== null`; event links filtered by `normalizeWebsiteForOpen` |
| Numeric admission values display with $ | TRUE | `formatAdmissionWithDollar` applied in canvas and legacy detail (COM-3) |
| Gratis/Free does not receive $ | TRUE | `FREE_WORDS` regex in `formatAdmissionWithDollar` |
| Results card remains compact | TRUE | `CommunityDiscoveryListingCard` unchanged |
| Full hub is not shown on results cards | TRUE | No `CommunityContactCanvas` import in results card |
| Leonix brand system is applied locally | TRUE | `GH` color constants used throughout `CommunityContactCanvas` |
| Mobile layout avoids horizontal overflow | TRUE | `flex flex-wrap`, `w-full`, `min-w-0` throughout |
| Date/time automation from COM-2 remains intact | TRUE | `ComunidadSmartScheduleSection` not modified in this gate |
| No fake analytics/counters/reviews were added | TRUE | No such strings in changed files |
| No Supabase migrations/schema files changed | TRUE | All data stored in existing `detail_pairs` JSONB column |
| No Stripe/payment files changed | TRUE | `git diff --name-only` confirms |
| No unrelated category files changed | TRUE | All changed files are in comunidad/community paths |
| npm run build passed | TRUE | Exit code 0 |
| No files staged | TRUE | `git status --short` — no staged files |
| No commit created | TRUE | HEAD unchanged from origin/main |
| No push attempted | TRUE | No push command executed |
