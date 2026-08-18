# Global Business Hub OS — Adoption Playbook

## Revised strategy (this pass)

The original plan called for full shared-renderer adoption (`FullBusinessHubCard`/`ListingContactCard`)
across 6 pilot categories. On inspection, every pilot's existing card turned out to be a revenue-driving
surface with real category-specific coupling (monetization CTAs, bespoke analytics trackers, offer/order
logic). Wholesale replacement risked regressing proven behavior for cosmetic consistency. This pass
instead did: **shared contract (already landed) + shared safe primitives + surgical adoption + truth
fixes** — no category's card was replaced wholesale.

## Classification scheme

- **A — Safe full-renderer adoption**: card is small, self-contained, uses uniform prop-injectable
  analytics, and a full swap is low-risk. None of the 6 pilots qualified on inspection (see below);
  reserved for a future category with a genuinely simple, isolated card.
- **B — Surgical shared-primitive adoption**: card stays, but truth fixes (fake ratings) and safe
  shared primitives (map embed formula, clipboard) are adopted where behavior-equivalent.
- **C — Requires future category refactor before full adoption**: card is deeply interleaved with
  unrelated logic (shared multi-category renderer, large monolith) — extraction itself is the
  prerequisite work, not something to attempt inside a primitive-adoption pass.

## Pilot categories — final classification

| Category | Class | Why |
|---|---|---|
| Servicios | B | `ServiciosBusinessHubContactCard.tsx` is revenue-critical (quote CTA flow, offer cards, service-area logic, DB-backed engagement) — too coupled for a full swap. Fixed: removed the owner-typed `hero.rating`/`reviewCount` badge (the one real fake-rating spot); swapped the review-link button to the new shared Level-A component (behavior-equivalent, defense-in-depth); re-pointed its clipboard copy to the shared helper; its map-embed formula is now a thin re-export of the shared one. Location/address logic left untouched (already correctly implicit-coarse in practice; not a plan-authorized change). |
| Restaurantes | B | Contact hub is coupled to order/reserve/menu CTAs and DB-backed engagement. Fixed: removed fake-rating rendering in **4 separate files** (not just the contact hub — `RestauranteProfileHeader.tsx`, `RestaurantePreviewCard.tsx`, `RestauranteAdStoryPreview.tsx`, `RestauranteResultsClient.tsx` — the actual unsafe rendering was in the hero/preview-card layer, a real correction to the original plan's premise); threaded `showExactAddress` out of `buildRestaurantContactHub.ts` so the faux map can be replaced by a real embed only when the address is genuinely public; re-pointed clipboard copy to the shared helper. `RestaurantHubReviewLinkButton.tsx` was already safe by construction (no rating field exists in its type at all) — left untouched. |
| Autos Dealer | B | `DealerBusinessStack.tsx` has 9-platform social, languages, finance contact, hours, and bespoke per-section analytics trackers (some disambiguated by string-matching link labels) — the most coupled of the 6. No fake-rating issue found. Only change: its map-embed formula documented as intentionally matching the shared one (kept as its own 3-line implementation rather than delegated, since the shared helper's minimum-length guard would be a real behavior change for this specific, already-reviewed function). |
| Autos Privado | B (surgical fix, not full Mode B renderer) | `PrivadoContactStrip.tsx` is genuinely simple with uniform prop-injectable analytics — a real Mode B `ListingContactCard` candidate. Judgment call: a full renderer swap with verified byte-parity was a larger, higher-risk undertaking than the confirmed defect actually required to fix. Instead: **structural leak fix** — this card shares `AutoDealerListing` (the Dealer type) with no separate Privado type, and previously rendered `dealerSocials`/`dealerWebsite` (an inconsistent 5-of-9-platform subset) and an exact dealer/business address with a real "get directions" link whenever those fields happened to be populated (no sanitizer strips them). Now: these fields are never read at all (an absent code path, not a runtime gate) — social links list is always empty, "meeting location" is always absent, vehicle location stays coarse city/state/zip only. This is a real fix for a real, currently-live leak. |
| Bienes Raíces Privado | C | No standalone card exists — the seller contact rail is ~155 lines inlined inside a 984-line shared multi-category renderer (`BienesRaicesPrivadoPreviewView.tsx`, covers residencial/comercial/terreno, shape-compatible with Rentas Privado, with dead disabled-identity-block code sitting beside the live rail). Not a clean extraction target inside a primitive-adoption pass. **Named follow-up, not fixed this pass**: the *pre-publish preview* mapper (`mapBienesRaicesPrivadoStateToPreviewVm.ts`) reads `contactChannels` (website/social fields) into the rendered VM, while the *live/published* mapper (`mapBrListingRowToPrivadoPreviewVm.ts`) already correctly discards them (`websiteHref: null, socialLinks: undefined`). The live/public surface is safe today; only the seller's own pre-publish preview can show these fields. Low urgency, but should be closed in a future pass by aligning the preview mapper with the live mapper's behavior. |
| Bienes Raíces Negocio | B | The real contact rail (`BrAgenteResContactSidebar.tsx`, 661 lines) is cleanly isolated **outside** the `anuncio/[id]/page.tsx` monolith — confirmed the monolith's own BR-related code (`bienesBusinessMetaLinks`, lines 743-768/1723-1737/2619-2621) is dead/unreachable (a `bienes-raices` listing already returns via `BienesRaicesNegocioLiveDetailShell`/`BienesRaicesPrivadoLiveDetailShell` before that code is ever reached). No monolith restructuring needed — the STOP condition didn't trigger. But the sidebar itself has MLS/tour/brochure/second-agent-rail features and its own bespoke CTA stack — similarly coupled to Servicios/Restaurantes/Autos Dealer, so treated the same way. No fake-rating issue found (confirmed no star/rating rendering in the sidebar). Fixed: publish-side video cap (`AGENTE_RES_MAX_VIDEO_URLS`) and — critically — the **live-display** cap at `BienesRaicesNegocioLiveDetailShell.tsx:242` (not the dead monolith literal at `anuncio/[id]/page.tsx:762`, which has zero live effect). |

## Deferred categories (not implemented this pass)

| Category | Mode | Existing contact component | Location-visibility pattern to copy | Notes |
|---|---|---|---|---|
| Viajes negocio | A/B (needs inspection) | Isolated worktree, not inspected this pass | TBD | Owned by a separate isolated workstream; coordinate before touching. |
| Comida Local | B (likely) | Has its own card/contact flow | Coarse-only (no public-address toggle found in prior audits) | Not inspected in depth this pass. |
| Rentas | B (likely) | Uses the generic `ListingView`/contact patterns shared with En Venta/Busco/Comunidad | Coarse-only for Privado lanes; follow the BR Privado `mostrarDireccionExacta` reference pattern where a lane has an explicit toggle | Multi-category shared renderer — same class-C risk as BR Privado if a card swap is ever attempted. |
| Empleos | N/A | No business "contact hub" — employer contact is a dedicated flow | N/A | Not a Business Hub candidate; different product shape. |
| En Venta/Varios | N/A | Generic `ListingView` seller strip (Mode B shape) | Coarse-only, no toggle exists | Smallest, most Mode-B-like of the deferred set — good first candidate for a future Class A attempt if `ListingContactCard` is ever built. |
| Ofertas Locales | A (source, not target) | `OfertasLocalesBusinessHubLiteCard.tsx` — **this is the ORIGINAL source of the shared map-embed formula** (via `ofertasLocalesPreviewHelpers.ts`), left untouched this pass (isolated worktree, out of scope) | N/A | Its own eventual adoption is "swap to the re-exported shared helper," not "build one" — it's the donor, not a recipient. |
| Comunidad | B (flag for cleanup) | Own free/private-post contact flow | N/A | Currently over-collects 8 social platforms on what should be a free/private post — flagged for a future cleanup consideration, not fixed this pass (out of scope, not a Business Hub adoption target). |
| Clases | B (flag for cleanup) | Same pattern as Comunidad | N/A | Same over-collection flag as Comunidad. |
| Mascotas/Perdidos | N/A | No business contact hub | N/A | Free/private listing category, not a Business Hub candidate. |
| Busco | N/A | Generic `ListingView` seller strip, same shape as En Venta | Coarse-only | Same deferred-Mode-B shape as En Venta. |

## Template adapter (for a future Class A attempt)

Given no category qualified for full renderer adoption this pass, `FullBusinessHubCard.tsx` and
`ListingContactCard.tsx` were **not built** — building them without a real, safe adoption target would
be exactly the "shared abstraction that duplicates/wraps existing logic without real reuse" the
original plan's own safety rules warn against. When a genuinely simple, isolated Class A candidate is
identified (En Venta's `ListingView` seller strip is the most promising deferred candidate), build the
renderer against that adapter first, using `app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx`'s CTA-stack shape (Call/WhatsApp/Message/Email/SMS, uniform `trackAutosListingContactCta`-style callback injection) as the reference pattern for what a clean, portable Mode B adapter/analytics contract looks like.

## What was actually built (reusable now)

- `app/components/contact/connectionHub/renderers/SharedConnectionHubReviewButton.tsx` — Level A,
  link-only review button (Google/Yelp visuals, never renders a rating).
- `app/(site)/clasificados/shared/constants/sharedConnectionHubLocationHelpers.ts` —
  `buildSharedConnectionHubMapEmbedSrc`, `buildSharedConnectionHubDirectionsHref`,
  `isCoarseLocationLine`.
- `copyToClipboard()` added to `app/components/cta/ctaLaunchers.ts`.
- Servicios' and Autos Dealer's map-embed builders reference (Servicios re-exports; Autos Dealer
  documents the match) the shared formula instead of independently duplicating it.
