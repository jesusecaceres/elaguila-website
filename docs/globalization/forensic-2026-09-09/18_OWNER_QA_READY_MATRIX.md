# 18 — OWNER QA READY MATRIX
Ref: `origin/main` = `a0a47839`. **All 22 category/lanes scored.**
A category is READY when a full publish→pay→view→edit→republish pass can be run **without destroying
owner data, double-charging, or producing knowingly false results.**

> ### ⛔ TWO PLATFORM-WIDE BLOCKERS GATE ALL QA
> **PB-1 — The primary checkout is 112 commits stale.** Any QA run against
> `C:\projects\elaguila-website` tests code that is not production. **`git pull --ff-only` first.**
> **PB-2 — Admin QA is blocked entirely** until GAP-001 (`teamProvisioningActions.ts:35`) and
> GAP-091 (lead CSV behind an unsigned cookie) are closed. The fix for GAP-001 already exists at
> `adminAuthBoundary.ts:44-46` and has zero call sites.
>
> These two aside, **category QA is independent** — a blocker in one category does not block another.

---

## THE MATRIX

| # | CATEGORY / LANE | READY | BLOCKING GAPS | ONE-LINE REASON |
|---|---|---|---|---|
| 1 | **Restaurantes** | ✅ **YES** | — | Edit SAFE · same-row · only full `categoryStandardV2` results adopter · highest adoption score (32/43) |
| 2 | **Comida Local** | ⚠️ **YES, with a hard stop** | GAP-003 | Edit SAFE, publish fine — **but do NOT QA billing**: no `LANE_SUSPENSION`, so non-payment never unpublishes |
| 3 | **Bienes Raíces — privado/FSBO** | ⚠️ **YES, with two stops** | GAP-057, GAP-054 | Edit SAFE (narrow patch editor) — but **no view analytics** and Stripe retry can duplicate pending rows |
| 4 | **Autos — dealer parent** | ⚠️ **YES, with a stop** | GAP-064 | Edit SAFE, G40 18/18 — but the parent row eats a paid slot (9/19 not 10/20) |
| 5 | **En Venta / Varios** | ✅ **YES** | — | The **reference community lane** (26/36). Edit SAFE, analytics complete |
| 6 | **Comunidad / Eventos** | ⚠️ **YES, with a stop** | GAP-071 | Edit SAFE — but listings **never expire** |
| 7 | **Busco / Se Busca** | ✅ **YES** | — | Edit SAFE, free lane, 20/36 |
| 8 | **Viajes — affiliate (free)** | ⚠️ **YES, limited** | GAP-069 | Only the free intake path; the negocio profile 404s in production |
| 9 | **Bienes Raíces — negocio parent** | ❌ **NO** | **GAP-002**, GAP-055, GAP-054 | **Dashboard edit destroys ~130 of ~150 fields.** Base plan allows **0** addable properties |
| 10 | **Rentas — negocio** | ❌ **NO** | **GAP-002** | Dashboard edit wipes `business_meta` — 10+ business identity fields |
| 11 | **Rentas — privado** | ❌ **NO** | **GAP-040** | Destructive on **both** refs — Sept does not fix it. Forces country to `"United States"` |
| 12 | **Bienes Raíces — inventory child** | ❌ **NO** | **GAP-041**, GAP-059 | Destroys state/zip/address/video/tour; the generic edit route is suppressed, not fixed |
| 13 | **Autos — dealer inventory child** | ❌ **NO** | **GAP-042** | Missing fields **inherit the parent's values** — the child page plays the parent's video |
| 14 | **Autos — privado** | ❌ **NO** | **GAP-045** | **No edit path at all** — the form opens and no save ever reaches the DB |
| 15 | **Empleos — premium/paid** | ❌ **NO — DO NOT TOUCH WITH A REAL CARD** | **GAP-039**, GAP-062, GAP-075 | Republish **inserts a new row and opens a second Stripe checkout**. Photos 100% discarded |
| 16 | **Empleos — quick (paid)** | ❌ **NO — DO NOT TOUCH WITH A REAL CARD** | **GAP-061**, GAP-062, GAP-075 | Same double-charge; Quick is a **paid** lane |
| 17 | **Empleos — feria** | ⚠️ **YES, limited** | GAP-075, GAP-066 | Identity handled correctly here — but photos discarded; emits `JobPosting` JSON-LD for a job fair |
| 18 | **Servicios** | ❌ **NO** | **GAP-043**, GAP-048, GAP-090 | Edit destroys highlights/trust; **`sessionStorage` identity can create duplicate rows**; anon SELECT has no status gate |
| 19 | **Ofertas Locales — flyer** | ❌ **NO** | **GAP-077**, GAP-005, GAP-044 | Public flyer is a bare "Open PDF" link; exact address leaks; pre-approval edit destructive |
| 20 | **Ofertas Locales — coupon** | ❌ **NO** | GAP-012, GAP-011 | Price is **$199 in one source and $0 in another**; the promo field can never succeed |
| 21 | **Clases** | ❌ **NO** | **GAP-076**, GAP-071 | The address is **baked into description text** — un-gateable later. Never expires |
| 22 | **Mascotas / Perdidos** | ❌ **NO** | **GAP-072** | **Zero analytics and zero Report control**, in the category most exposed to scam posts |
| 23 | **Negocios Locales** | ✅ **N/A** | — | Static marketing hub, no listings, no owner surface — correctly so |
| 24 | **Newsletter** | ❌ **NO** | GAP-096 | No send pipeline; unsubscribe unreachable — **CAN-SPAM exposure** |
| 25 | **Admin OS** | ❌ **NO** | **GAP-001**, GAP-091 | See PB-2 |

---

## COUNTS

| Verdict | Count | Categories |
|---|---|---|
| ✅ **READY NOW** | **3** | Restaurantes · En Venta/Varios · Busco |
| ⚠️ **READY WITH A NAMED STOP** | **6** | Comida Local · BR privado · Autos dealer parent · Comunidad · Viajes (free intake) · Empleos feria |
| ❌ **NOT READY** | **15** | rows 9–22, 24, 25 |
| ✅ N/A | 1 | Negocios Locales |
| **TOTAL SCORED** | **25** | |

---

## THE SHORTEST PATH TO "MOST CATEGORIES READY"

| Action | Categories it unblocks |
|---|---|
| **1. Merge the Sept seal** (after the GAP-100 migration rename) | BR negocio · Rentas negocio → **2** |
| **2. Fix the 6 remaining destructive lanes** (reference: `git show 733408dd`) | Rentas privado · BR child · Autos child · Servicios · Ofertas · Empleos quick → **6** |
| **3. Fix Empleos identity** (`buildEmpleosPublishEnvelope.ts:250`) | Empleos premium + quick → **2** |
| **4. Port the media upload path** from Clases/Comunidad/Mascotas | Empleos ×3 · improves all |
| **5. Adopt the Ofertas preview flyer viewer into the public page** | Ofertas flyer → **1** |
| **6. Wire `adminAuthBoundary.ts:44-46`** | **Admin OS — unblocks all admin QA** |

**Steps 1–3 alone move 10 lanes from NOT READY to READY.**

---

## WHAT "READY" DOES NOT MEAN

A ✅ here means **source-complete and safe to exercise**. It does **not** mean verified working —
every ✅ still carries `OWNER_QA_REQUIRED`. This audit executed **no runtime, no browser, no Stripe
transaction, and no database query** at any point. Doc `19` is the click-path for converting each ✅
into a runtime pass.

Three platform-wide facts apply to every row and are not repeated per category:
analytics numbers are unreliable until GAP-004 is fixed · no subscription is ever suspended until
GAP-082 is fixed · saved-search notification emails never retry until GAP-030 is fixed.
