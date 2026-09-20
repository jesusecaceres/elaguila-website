# LEONIX QUICK — Remaining Family Coverage: Field Wiring, Media, Security, Protection Proof

## Gate 11 — Customer Entry / Management Truth

Per-family customer destinations, as encoded in `QUICK_REMAINING_DEFINITIONS`
(`app/lib/quickRemaining/quickRemainingRegistry.ts`):

| Family | Customer Entry (Quick hands off to) | Customer Management |
|---|---|---|
| Comida Local | `/publicar/comida-local/rapido` → existing preview → existing checkout | `/dashboard/mis-anuncios?cat=comida-local` (existing) |
| Ofertas Locales | `/publicar/ofertas-locales` (existing, direct) | `/dashboard/ofertas-locales` (existing) |
| Negocios Locales | `/negocios-locales` (content) | none — not a product, nothing to manage |
| Viajes | `/publicar/viajes` (existing, direct) | `/dashboard/viajes` (existing) |
| Iglesias | `/iglesias/registrar` (existing, direct) | none — free directory listing, no owner dashboard exists for it |
| Recursos | `/recursos-comunitarios` (content) | none — editorial, not owned by any customer |

No new management surface was built. Every non-null `manageHref` points to a route that already exists
today; `null` is used only where no such destination has ever existed (content-only families and free
Iglesias listings, which the church directory itself doesn't give individual dashboards for).

## Gate 12 — Field Wiring Proof (Comida Local Quick Form — the one new form)

Every visible Quick field maps 1:1 onto a real `ComidaLocalDraft` field, verified directly against
`buildDraftFromValues` in `ComidaLocalQuickIntakeClient.tsx`:

| Quick field (step "business"/"contact") | Canonical `ComidaLocalDraft` field | Mapping |
|---|---|---|
| `businessName` (text, required) | `businessName` | direct |
| `foodType` (select, required) | `foodType` | direct (`ComidaLocalFoodType \| ""`) |
| `foodTypeCustom` (text, required only when `foodType === "otro"`) | `foodTypeCustom` | direct |
| `city` (city picker, required) | `cityDisplay` + `cityCanonical` | `cityDisplay: cityRaw`, `cityCanonical: getCanonicalCityName(cityRaw) \|\| ""` — same resolver the Full app and `resolveComidaLocalCityCanonical` use |
| `queVendes` (textarea, required, ≥20 chars enforced by the existing strict validator) | `queVendes` | direct |
| `phone` (phone, `atLeastOne` with whatsapp) | `phone` | direct |
| `whatsapp` (phone, `atLeastOne` with phone) | `whatsapp` | direct |
| media step (≥1 photo required) | `mainPhoto` (first item, uploaded with `role: "main"`) + `galleryImages` (next 5 items, `role: "gallery"`) | uploaded via the existing `uploadComidaLocalDraftImage`, never a raw data URL |

All other `ComidaLocalDraft` fields (hours, logo, social links, secondary phone labels, etc.) are left
at `createEmptyComidaLocalDraft()` defaults — never fabricated — and are added later by the customer
from the existing dashboard, exactly as `COPY.reviewHandoffNote` tells them. No phantom field is
asserted onto the draft that the Quick form doesn't actually collect.

`draft.media.length === 0` disables the submit button, so the required-photo rule is enforced at the UI
level in addition to `validateQuickMedia`/`validateComidaLocalDraftForFuturePublish`.

Before handing off, `submit()` runs the full existing strict gate
(`validateComidaLocalDraftForFuturePublish(canonical, lang === "es")`) against the real canonical draft
— not a Quick-only shortcut check — so a draft that reaches the existing preview has already passed the
same bar the Full app enforces.

## Gate 13 — Media Truth

| Family | Media handling |
|---|---|
| Comida Local | Real upload at submit time via the existing `uploadComidaLocalDraftImage` → existing `/api/clasificados/comida-local/draft-media-upload` endpoint (documented MEDIA EXCEPTION, see file header). No new endpoint, no new storage bucket, no owner id attached by Quick. |
| Ofertas Locales, Viajes, Iglesias | PROVEN_NA — Quick never touches media for these; DIRECT_CANONICAL_LINK sends the customer straight to the existing form, which handles its own media exactly as it does today. |
| Negocios Locales, Recursos | PROVEN_NA — content-only, no submission, no media at all. |

## Gate 14 — Security / Payment / Ownership Proof

- **No new Stripe SKU, package, or price** was created anywhere in this mission. Comida Local Quick
  reads the existing `comida_local_base_monthly` price live via `getRevenuePackagePriceCents` — the
  number shown is whatever the pricing matrix says at render time, never hardcoded.
- **No row insert, update, upsert, or direct `/api/` POST** happens inside the Quick Comida Local
  intake tree, except the one documented, narrow media-upload call to the pre-existing
  `/api/clasificados/comida-local/draft-media-upload` endpoint (an upload, not a listing/payment write —
  it stores no price, no owner id, no publish state). Everything else the intake does is local state,
  sessionStorage/IndexedDB, and a `localStorage` write via the existing
  `saveComidaLocalDraftToStorage` helper — the exact same call the Full app itself makes.
- **Ownership**: the customer signs into the existing `/publicar/**` auth gate
  (`PublishAuthGateLayout`) with their own account, exactly like every other Quick and Full flow. Staff
  never publish under their own identity — the launchpad card only opens/copies/shares a link; it never
  submits anything on the staff member's behalf.
- **No payment collection happens inside the Quick tree at all** — for all six families, checkout
  (where one exists) is on the existing canonical route (Comida Local's existing Stripe checkout after
  the existing preview; Ofertas Locales' own checkout; none for the rest).

## Gate 15 — Structured System Protection Proof

Verified directly against git, not asserted:

```
$ git rev-parse HEAD
b66322ba01482dcf433220de0a1855d6824f54c4   (before this mission's commit)

$ git merge-base --is-ancestor b66322ba01482dcf433220de0a1855d6824f54c4 HEAD && echo ANCESTOR_OK
ANCESTOR_OK
```

- Certified Core branch `claude/quick-business-core-build-2026-09` at `b66322ba…` was never checked out
  or modified — this mission's branch `claude/quick-remaining-families-build-2026-09` was created FROM
  that exact SHA and only additive commits sit on top of it.
- `git status --short` (see Gate 22 for the final snapshot) shows only: one modified file
  (`QuickApplicationsLaunchpad.tsx`, additive JSX + helpers) and two new, wholly additive
  directories/files (`app/(site)/publicar/comida-local/rapido/**`, `app/lib/quickRemaining/**`). No
  file inside the certified Quick Classifieds (`app/lib/quickClassifieds/**`,
  `app/(site)/publicar/rapido/**`) or Quick Business Core (`app/lib/quickBusiness/**`,
  `app/(site)/publicar/negocio-rapido/**`) trees was touched.
- No pricing file, Stripe config, migration, `.env*`, or CI/CD file appears in the diff.
