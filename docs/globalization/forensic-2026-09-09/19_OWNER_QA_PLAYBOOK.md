# 19 — OWNER QA PLAYBOOK
Source-confirmed click paths. Ref: `origin/main` = `a0a47839`.
Read `18_OWNER_QA_READY_MATRIX.md` first — **do not run a playbook for a NOT-READY category.**

---

## 0. BEFORE YOU CLICK ANYTHING

```bash
cd C:\projects\elaguila-website && git pull --ff-only
```
The checkout is **112 commits behind**. Without this you are QA-ing code that is not production.

**Three findings you must not "discover" as bugs — they are known and logged:**
1. Analytics counts are unreliable platform-wide (GAP-004) and **Bienes Raíces records no views at
   all** (GAP-054).
2. **No subscription is ever suspended** — the sweep has zero callers (GAP-082).
3. Saved-search emails **never retry** on failure (GAP-030).

**Never QA these with a real card:** Empleos premium, Empleos quick (GAP-039/061 — a second Stripe
checkout is opened and the original paid row is orphaned).

---

## 1. START HERE — RESTAURANTES (the only fully-clear category)

| Step | Route / action | Expect | Status |
|---|---|---|---|
| Landing | `/clasificados/restaurantes` | live inventory renders | SOURCE READY |
| Results | `/clasificados/restaurantes/results` | filters apply; **`/resultados` now permanently redirects** | SOURCE READY |
| ⚠ Sort | set any sort other than "newest" | **paid placement is discarded** (GAP-018) — expected defect, log it | KNOWN FALSE |
| Application | `/publicar/restaurantes` | multi-step form | SOURCE READY |
| Draft | fill 3 steps, **hard-refresh** | state restores (sessionStorage) | OWNER_QA_REQUIRED |
| Unsaved guard | navigate away mid-form | browser prompt (`useBusinessApplicationLeaveGuard.ts:35`) | SOURCE READY |
| Preview | preview route | matches the form | SOURCE READY |
| Preview→edit | "volver a editar" | **state preserved** | SOURCE READY |
| Checkout | `restaurantes_base_monthly` | Stripe subscription mode | SOURCE READY |
| Promo | apply a code | works — restaurantes is promo-eligible | SOURCE READY |
| Webhook | complete payment | entitlement row appears | OWNER_QA_REQUIRED |
| Public detail | `/clasificados/restaurantes/[slug]` | renders | SOURCE READY |
| ⚠ Media | publish **without** a hero image | **a stock Unsplash photo appears** (GAP-026) | KNOWN FALSE |
| ⚠ Price | publish with no price level | **silently shows `$$`** (GAP-026) | KNOWN FALSE |
| CTAs | phone · SMS · WhatsApp · email · website · directions | all fire | SOURCE READY |
| Trust | Community Trust widget | renders (5/5 public mount) | SOURCE READY |
| ⚠ Address | look for a privacy toggle | **none exists; defaults to exact** (GAP-079) | KNOWN FALSE |
| **Dashboard edit** | edit one field → republish | **every other field survives, same row** | **SOURCE READY — the key test** |
| No-recharge | republish an active listing | **HTTP 409**, no second charge | SOURCE READY |
| Admin | `/admin/workspace/clasificados/restaurantes` | queue works | BLOCKED (PB-2) |
| SEO | view source | JSON-LD + breadcrumb present | SOURCE READY |

---

## 2. EN VENTA / VARIOS — the community reference lane

Same shape, plus: analytics is the **reference implementation** (`enVentaGlobalAnalytics.ts`) so
Save/Like/Share/Report should all record; free publish (no checkout — `en_venta_free_v1`,
`stripeEligible: false`); edit is the shared patch editor and is **SAFE**.
⚠ Expect: **no SEO/JSON-LD** · the results client **discards the stored language** (GAP-073) ·
the free plan displays as a generic "Plan del anuncio", never "Gratis" (GAP-068).

---

## 3. BUSCO — free lane

Publish → preview → publish → public detail → save/like/share/report → dashboard edit → republish.
Edit is SAFE. ⚠ Same language-discard and free-label defects as §2.

---

## 4. COMIDA LOCAL — ⛔ STOP BEFORE BILLING

Publish, preview, publish, view, **edit and republish** are all safe — run them.
**DO NOT QA the billing lifecycle.** `comida_local_base_monthly` is a live **$129/mo** subscription
with **no `LANE_SUSPENSION` entry** (GAP-003), so a cancelled or failed payment will **never**
unpublish the listing and you will be left with a live listing you cannot suspend from the UI.
⚠ Also expect: the landing page **is** the results page (no results route) · **no pagination** — only
the first 300 rows are reachable · **no JSON-LD, no breadcrumb** (GAP-052) · admin row actions are
missing (no Featured/verify/republish) and the category is **unauditable** (GAP-087).

---

## 5. BIENES RAÍCES — PRIVADO/FSBO ONLY

Publish → checkpoint → application → preview → checkout (`br_fsbo_45d`) → public → **edit → republish**.
The privado edit is a narrow patch editor and is **SAFE**.
⛔ **Do not retry a failed Stripe payment in a new tab** — BR privado is excluded from DB pending-row
reuse, so you will create a duplicate pending row (GAP-057).
⚠ Expect: **no view analytics whatsoever** (GAP-054) · **no leave guard** (GAP-056) · listings
**never expire** (GAP-014) · results paginate only to **row 80** (GAP-017) · 19 URL filters silently
do nothing (GAP-017b) · a missing photo shows a **stock Unsplash image**.
❌ **Do not QA BR negocio, BR inventory child, or Rentas at all** — see doc `18` rows 9–12.

---

## 6. AUTOS — DEALER PARENT ONLY

Dealer application → preview → checkout (`autos_dealer_monthly`) → public dealership page →
inventory tools → **dealer parent edit → republish** (SAFE, whole-blob round trip).
Parent/child protections are the platform's **best** (G40 18/18) — the parent-inactive cascade and
wrong-owner prevention are worth exercising.
⚠ Expect: you get **9 addable vehicles on a 10-pack** — the parent row consumes a slot (GAP-064).
❌ **Do not QA autos privado** (no edit path at all, GAP-045) **or autos dealer inventory child**
(fields inherit the parent's values, GAP-042).

---

## 7. COMUNIDAD / EVENTOS

Free publish → public detail → engagement → edit (SAFE) → republish.
⚠ Expect: listings **never expire** (GAP-071) · Share and the connection hub are **unreachable**
because the lane returns early before them (GAP-073) · no SEO.

---

## 8. VIAJES — FREE INTAKE ONLY

Only the free affiliate/community intake path is testable.
❌ The negocio profile **404s in production by design** — the gate refuses to serve sample data and
there is no real data path on main (GAP-069).
⛔ **Do not attempt the $399/mo Viajes checkout.** The checkpoint advertises it with a coupon banner,
but there is **no fulfillment writer** — a payment would be taken and nothing activated (GAP-067).

---

## 9. EMPLEOS — FERIA ONLY, AND WITHOUT PHOTOS

Feria handles identity correctly. Publish → preview → publish → public.
⚠ **Every photo you attach will be discarded** (GAP-075) — this is not your mistake.
❌ Do not QA premium or quick with a real card.

---

## 10. THE THREE TESTS THAT MATTER MOST AFTER ANY FIX LANDS

### T1 — The destructive-edit test (run per lane)
1. Publish a listing with **every optional field populated** — business identity, socials,
   Google/Yelp, hours, languages, custom links, all media.
2. Screenshot the public detail page.
3. Dashboard → edit → change **one** field → republish.
4. Compare against the screenshot **field by field**.
**PASS** = nothing else changed and the row id is identical. Anything missing is the GAP-002 class.
Currently expected to FAIL on: rentas privado · BR negocio · BR child · autos child · empleos ×2 ·
servicios · ofertas.

### T2 — The double-charge test (Stripe test mode ONLY)
Publish a paid listing → pay → dashboard → edit → republish.
**PASS** = no second Stripe session, same row id, `published_at` unchanged.
Currently expected to FAIL on Empleos premium and quick.

### T3 — The forged-cookie test (after GAP-001 is fixed)
With **only** `Cookie: leonix_admin=1` and no login, attempt:
`createStaffUserWithAuthAction` · `/api/admin/revenue-os/manual-payments` (`verify_cleared`) ·
`/api/admin/leads/*/export`.
**PASS** = all three refuse.

---

## 11. WHAT THIS PLAYBOOK CANNOT TELL YOU

This audit ran **no runtime, no browser, no Stripe call, and no database query**. Every "SOURCE READY"
means the code path is complete and traced — not that it works. All of it is `OWNER_QA_REQUIRED`.
Five P0s additionally need one live DB query each before they can even be classified — see
`22_FINAL_RECONCILIATION_PLAN.md §2`.
