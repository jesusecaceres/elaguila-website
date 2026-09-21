# 22 — FINAL RECONCILIATION PLAN
Audit 2026-09-09 · READ-ONLY · **Nothing in this plan was executed.** Every step is for the Owner to
authorize and perform.

Refs: `origin/main` = `a0a47839` · Sept seal `e3956df8` · BR branch `0d80e891` · merge-base `7878d856`.

---

## 0. THE ONE-PARAGRAPH SUMMARY

Three lines of work exist. **`origin/main` (63 commits of LEO/Concierge) and the September seal
(51 commits of globalization remediation) do not conflict at all — 0 files.** A third branch
(`fix/br-negocio-inventory-hub-media-hydration-2026-08-27`, 32 commits, +3364/−786) carries BR/Rentas
fixes that are **all still live defects on main** and **conflicts with September on 20 files**.
Merge order is therefore load-bearing. **One hard blocker must be cleared first: a migration timestamp
collision.** After all three merge, **6 of the 8 destructive-edit lanes and 8 further P0s remain open**
— the merge is necessary and nowhere near sufficient.

---

## 1. ⛔ PREREQUISITE — CLEAR THE MERGE BLOCKER (GAP-100)

```
Sept: supabase/migrations/20260909120000_service_role_dml_grants_global_fix.sql
Main: supabase/migrations/20260909120000_business_ownership_claim_foundation.sql
```
**Identical timestamps → undefined apply order.** One of them is the fix for GAP-088.
**Rename the Sept migration to a later timestamp before any merge is attempted.**
Nothing else in this plan is safe until this is done.

---

## 2. ⛔ PREREQUISITE — FIVE LIVE DATABASE CHECKS

This audit had **no database access** for its entire duration. Five P0s are contingent on a live
check, and **each needs exactly one query**. Authorize the Supabase connector first
(claude.ai connector settings, or `/mcp` in an interactive session).

| # | Gap | Query | Why it changes the plan |
|---|---|---|---|
| 1 | **GAP-088** | `information_schema.role_table_grants` for `service_role` on `public.listings` | If grants are absent → merge `14a78d46` urgently. If present → **the repo and the live DB have silently diverged**, which is its own P0 |
| 2 | GAP-089 | `\d public.listings` | Capture the output as a baseline migration; `supabase db reset` cannot currently reproduce production |
| 3 | GAP-090 | anon-key `select … from servicios_public_listings where status <> 'published'` | If rows return, unpublished Servicios listings are publicly readable |
| 4 | GAP-080 | does `ofertas_locales.google_review_url` exist? | Ghost column written and read in code, in no migration |
| 5 | GAP-099 | `curl -I https://<host>/manifest.webmanifest` | Determines which of two conflicting manifests serves |

---

## 3. THE MERGE SEQUENCE

### STEP 1 — `git pull --ff-only` the primary checkout
`C:\projects\elaguila-website` is **112 commits behind**. Any QA run against it tests stale code.
*(Doc `01 §1.1`.)*

### STEP 2 — Merge the September seal into main
| Fact | Value |
|---|---|
| Conflict surface vs main | **0 files** — verified two independent ways |
| Commits | 51 |
| Files | 264 |
| Prerequisite | §1 rename |

**Closes:** GAP-002 (2 of 8 destructive lanes) · GAP-003 Comida Local suspension lane ·
GAP-005 Ofertas address privacy (+ its migration) · GAP-006 one-time-lane recharge guards ·
GAP-008 the 4 self-engagement gaps · GAP-021/055/064 parent-row capacity (BR + Autos) ·
GAP-063 child identity guard · GAP-047 G23 adoption for 5 categories · GAP-051 Save/Report/Recently-Viewed ·
`09A` finding I self-report guard.
**Does NOT close:** everything in §5.

### STEP 3 — Reconcile the BR branch, resolving 20 files with Sept semantics winning
`fix/br-negocio-inventory-hub-media-hydration-2026-08-27` — **all 5 sampled fixes verified still live
on main; zero supersession; main is byte-identical to the pre-fix state.**
Conflict surface with main-only work: **0 files.** With Sept: **20 files**, listed in doc `01 §5 R2`.
**On the two reverse-mapper files — `mapAgenteResidencialFormStateToNegocioForPublish.ts` and
`rentasDashboardEditHydration.ts` — Sept's semantics must win**, because those are the P0 fixes.
**Closes:** BR draft-media reload loss · inherited parent-hub freeze · multi-video/custom highlights ·
HOA/Open House · BR results production build · BR `tel:` E.164 · Suspense/lang reveal ·
GAP-056 leave guard for 4 of 5 lanes.

### STEP 4 — Integrate `globalization-release-reconcile-2026-08-14` (5 commits)
**Closes GAP-067** — production currently advertises a **$399/mo Viajes charge with a coupon banner
that the system can neither collect nor honour**, six weeks after the Owner locked Viajes as free.
Also resolves the Ofertas coupon-price contradiction (GAP-012).

### STEP 5 — Owner decision on the never-pushed worktrees
| Worktree | Recommendation |
|---|---|
| `elaguila-website-leo-final` | **Commit/push to a backup ref immediately.** 15 untracked files exist nowhere in git, including an uncommitted Supabase migration. One `git clean` from permanent loss |
| `elaguila-website-viajes` | **FORWARD-PORT, do not merge** (GAP-070). Sole home of the only DB-backed Viajes provider resolver, +10,215/−3,488 across 121 files, ~80 paths existing nowhere else. It predates and lacks `publicar/viajes/checkpoint/page.tsx`, so a naive merge deletes it |

### STEP 6 — Archive, do not delete
**Safe to archive (proven already-captured):** the **nine `global-*` feeder branches** — 11/11
confirmed already captured by byte-identical root tree SHA (GAP-101) — and the **three autos
micro-branches** (doc `01 §5 R9`, content-diffed).
**⚠ `git merge-base --is-ancestor` produced a FALSE NEGATIVE on 14 of 14 branches tested this way.**
Content is routinely re-landed under new SHAs. **Never conclude "unintegrated" from ancestry alone.**

---

## 4. AFTER THE MERGES — THE ORDERED FIX LIST

### 4A. P0, and each fix already exists in-tree (ADOPT EXISTING)
| # | Gap | Wire this | Into this |
|---|---|---|---|
| 1 | **GAP-001** admin staff-provisioning escalation | `adminAuthBoundary.ts:44-46` `canCreateStaffUsers` (**zero call sites**) | `teamProvisioningActions.ts:35` |
| 2 | GAP-091 lead/subscriber CSV behind unsigned cookie | `businessWorkspaceAccess.ts:106-168` | `adminLeadExportAuth.ts:8-14` (7 routes) |
| 3 | GAP-075 **Empleos discards 100% of photos** | the identical editor used by Clases/Comunidad/Mascotas | Empleos upload path |
| 4 | GAP-090 servicios anon SELECT `USING (true)` | the five sibling lane-table policies | `20260402160000:18` |
| 5 | GAP-032 Google/Yelp panel never renders | pass `externalReputation` from the owner pages | `OwnerEntityWorkspace.tsx` |

### 4B. P0, genuinely NET NEW
| Gap | Work |
|---|---|
| GAP-039 / GAP-061 | **Empleos premium AND quick fork identity and double-charge.** `buildEmpleosPublishEnvelope.ts:250` hardcodes `listingId: null`. Note the Sept recharge guard does **not** help — a fresh id is minted before checkout. Needs the identity fix **and** the guard |
| GAP-089 | Capture a `public.listings` baseline migration |
| GAP-099 | Resolve the two conflicting PWA manifests |
| GAP-076 | Four exact-address leaks — **Clases is the urgent one**, its address is baked into description text (`clasesPublishPayload.ts:69`) and is un-gateable later |

### 4C. The six destructive-edit lanes the merge does NOT fix
rentas privado · BR inventory child · autos dealer child · empleos premium · empleos quick ·
servicios · ofertas (pre-approval). **Reference for all of them: Sept's reverse-mapper pattern
(`git show 733408dd`).** *(GAP-040/041/042/043/044/045.)*

### 4D. One decision closes two P1s
**There is no scheduler anywhere in this repository** — no `vercel.json`, no cron route, no `pg_cron`.
Choosing a mechanism closes **GAP-030** (saved-search retry — failed notification emails stay
`pending` forever) **and GAP-082** (grace-expiry suspension never runs, so no subscription is ever
suspended platform-wide). `subscription-sweep/route.ts:39` is a working, machine-key-authorized
endpoint with zero callers — it is the reference shape.

### 4E. Structural debt, owner-decision
| Gap | Decision |
|---|---|
| GAP-010 / GAP-086 | **Three independent copy-paste category registry families** (5-item, 10-item, 6-source), none derived from `CanonicalDbCategory` or `REVENUE_V1_PACKAGE_MATRIX`. Collapse them |
| GAP-103 | **836 string-asserting verifier gates (79% of `scripts/`); `test:gates` runs 5 of ~792; 2 are provably red; 85 assert orphaned component names.** Delete or convert to behavioural tests. `e2e/` (33 specs) is the one trustworthy surface |
| GAP-104 | **230 of 230 docs are stale**; 58 assert COMPLETE/CERTIFIED in a heading; 446 more `.md` files live inside `app/` |
| GAP-015 | The shared Business Hub engine was never built; every category ships its own. Build it, or formally accept the forks and archive the orphaned shared layer |
| GAP-102 / GAP-105 | ≈394 route-unreachable files (a floor) and ≈428 committed build artifacts. **DO NOT DELETE NOW** — archive after the merges settle |

---

## 5. WHAT THE MERGES DO NOT FIX — READ THIS BEFORE PLANNING QA

> **Merging all three branches leaves 6 of the 8 destructive-edit lanes broken and at least 8 P0s
> open.** "Merge September" is a necessary first step, not a remediation plan.

Still open after every merge in §3:
GAP-001 · GAP-030 · GAP-039 · GAP-056 (BR-CHILD) · GAP-061 · GAP-074 (Sept's media fix is
`console.warn` only — **users still lose media on Sept**) · GAP-075 · GAP-078 · GAP-082 · GAP-088 ·
GAP-089 · GAP-090 · GAP-091 · GAP-099 · GAP-100 · GAP-103 · GAP-104 · and the six destructive lanes.

---

## 6. SUGGESTED SEQUENCING

| Phase | Contents | Gate to exit |
|---|---|---|
| **0 — Preserve** | Push `leo-final`; back up the viajes worktree | Nothing exists only on one disk |
| **1 — Verify** | The five DB queries (§2) | GAP-088 branch (A) or (B) settled |
| **2 — Unblock** | Rename the colliding migration (§1) | Timestamps unique |
| **3 — Integrate** | Steps 2→3→4 in order | Build green; the 5 sampled BR defects no longer reproduce |
| **4 — Secure** | §4A items 1, 2, 4 + GAP-085 | Forged cookie reaches nothing privileged |
| **5 — Stop data loss** | §4C six lanes + GAP-039/061 + GAP-074/075 | Publish→edit→republish preserves every field, on every lane |
| **6 — Schedule** | §4D | Subscriptions suspend; saved-search retries |
| **7 — QA** | Doc `19` playbook, category by category | Per doc `18` |
| **8 — Debt** | §4E | Owner's call |

**Do not begin Phase 7 for a category until its blockers in doc `18` are cleared.**

---

**SOURCE MODIFIED: NO · MAIN MODIFIED: NO · DATABASE MODIFIED: NO · PRODUCTION MODIFIED: NO ·
NOTHING IN THIS PLAN WAS EXECUTED.**
