# CLASES CL-1 — Full Launch Stack Audit

**Gate:** CL-1  
**Category:** clases  
**Date:** 2026-06-30  
**Status:** ✅ PASS

---

## Summary

Applied the full Comunidad/Eventos launch-readiness stack to the Clases category:

- Smart weekly schedule (existing — carried over from COM gate)
- Global-ready location fields (existing — carried over from COM gate)
- Full Instructor Business Hub on public detail (contact, socials, class-specific useful links)
- Registration-required UX with reveal + confirmation of registration URL
- `$` price formatting for paid Clases
- Compact results cards (unchanged)
- Preview/publish/detail parity
- Audit files + script

---

## Files Modified

| File | Change |
|------|--------|
| `app/(site)/publicar/community/shared/types/communityQuickDraft.ts` | Add `ClasesClassLinks` type; add `classLinks` field to `ClasesQuickDraft`; add `emptyClassLinks`, `normalizeClassLinks` |
| `app/(site)/publicar/community/shared/publish/communityPublishSnapshots.ts` | Add `ClasesClassLinks` import; add `classLinks`, `addressLine2`, `country` to `ClasesQuickPublishSnapshot` |
| `app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts` | Add `snapshotClassLinks`; include `classLinks` in `buildClasesQuickPublishSnapshot` |
| `app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts` | Persist all `ClasesClassLinks` fields as `Leonix:cls*` detail pairs |
| `app/(site)/publicar/clases/lib/clasesPublishedQuickToDraft.ts` | Hydrate `snapchat`, `pinterest`, and all `classLinks` fields from detail pairs |
| `app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx` | Add `ClasesClassLinksSection` export with `CLASS_LINKS_COPY`; import `ClasesClassLinks` |
| `app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx` | Import `ClasesClassLinksSection`; wire into `ClasesQuickApplication` form after "Más contacto" |
| `app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx` | Add `UI_CLASES` + `UI_COMUNIDAD` split; import `ClasesClassLinks`; build `classLinkItems`; use `allLinkItems` in render; kind-aware labels (`locationTitle`, `contactTitle`, `moreTitle`, `website`) |
| `app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx` | Apply `$` prefix to numeric `priceAmount` |
| `app/(site)/clasificados/community/CommunityQuickAnuncioDetail.tsx` | Add `classLinks` object to `contactDraft` adapter |

---

## ClasesClassLinks fields (Leonix:cls* detail pair keys)

| Field | Pair key |
|-------|----------|
| registrationUrl | `Leonix:clsRegistrationUrl` |
| paymentUrl | `Leonix:clsPaymentUrl` |
| ticketsUrl | `Leonix:clsTicketsUrl` |
| donationUrl | `Leonix:clsDonationUrl` |
| classMaterialsUrl | `Leonix:clsMaterialsUrl` |
| syllabusUrl | `Leonix:clsSyllabusUrl` |
| classGuideUrl | `Leonix:clsGuideUrl` |
| instructorPageUrl | `Leonix:clsInstructorUrl` |
| studentPortalUrl | `Leonix:clsStudentPortalUrl` |
| vendorsResourcesUrl | `Leonix:clsVendorsUrl` |
| foodVendorsUrl | `Leonix:clsFoodVendorsUrl` |
| sponsorsUrl | `Leonix:clsSponsorsUrl` |
| customLink1Label | `Leonix:clsCustom1Label` |
| customLink1Url | `Leonix:clsCustom1Url` |
| customLink2Label | `Leonix:clsCustom2Label` |
| customLink2Url | `Leonix:clsCustom2Url` |

---

## Socials (previously missing for Clases)

| Field | Pair key |
|-------|----------|
| snapchat | `Leonix:socialSnapchat` |
| pinterest | `Leonix:socialPinterest` |

Both now hydrated in `clasesPublishedQuickToDraft.ts`.

---

## Category-aware wording (CommunityContactCanvas)

| Label | Clases (es) | Comunidad (es) |
|-------|-------------|----------------|
| contactTitle | Contacto del instructor | Contacto del organizador |
| locationTitle | Lugar de la clase | Lugar del evento |
| moreTitle | Más información de la clase | Más información |
| website | Sitio web de la clase | Sitio web del evento |

---

## Price formatting

- Paid Clases: `priceAmount` gains `$` prefix when it starts with a digit (e.g. `20` → `$20`)
- Free Clases: displays "Gratis" / "Free"
- No double `$` prefix applied

---

## Registration-required UX

- `ClasesClassLinksSection` reveals prominent green banner + plain `registrationUrl` label (no "optional") when `registrationRequired === "si"`
- Otherwise all fields shown as optional

---

## Forbidden actions confirmed NOT taken

- No schema migrations
- No Stripe/payment infra changes
- No unrelated category changes
- No fake data or placeholder icons/URLs
- No staging, committing, or pushing

---

## Build

`npm run build` → exit code 0, compiled with warnings (pre-existing), zero TypeScript errors.
