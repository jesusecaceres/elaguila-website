# 01 — REPOSITORY AND WORKTREE INVENTORY
Audit 2026-09-09 · READ-ONLY · No refs, source, or working trees modified.

---

## 1. PHASE 1 — PREFLIGHT

| Field | Value |
|---|---|
| PRIMARY CHECKOUT | `C:\projects\elaguila-website` |
| WORKSPACE ROOT | `C:\projects` |
| REMOTE | `origin` → https://github.com/jesusecaceres/elaguila-website.git |
| CURRENT BRANCH | `main` |
| CURRENT HEAD | `d09d979c1bdba40002ac5e985d6971ce6a87bb0f` (2026-09-03) |
| DIRTY/CLEAN | CLEAN — only untracked `.release-qa/` |
| ACTIVE GIT OPERATION | NONE |
| WORKTREE COUNT | 39 registered |
| DISK FOLDERS `elaguila-website*` | 38 (+ 1 non-git recovery folder) |
| LOCAL BRANCHES | 79 |
| ALL REFS | 148 |

### 1.1 P1-REPO-01 — THE PRIMARY CHECKOUT IS STALE
```
git rev-list --left-right --count main...origin/main  →  0    107   (111 after mid-audit drift)
git merge-base main origin/main                       →  d09d979c  (== main)
```
`main` is a **strict ancestor** of `origin/main`: 0 ahead, 111 behind.

**Consequence:** any audit — including prior ones — that read files from this working tree read source
111 commits out of date. This audit therefore treats `origin/main` as CURRENT SOURCE and reads it via
`git show origin/main:<path>` / `git grep origin/main`.
**ACTION:** `git pull --ff-only` before any Owner QA. Severity **P1** (QA-fidelity hazard, not data loss).

### 1.2 P2-REPO-02 — `origin/main` MOVED DURING THIS AUDIT
Pinned at `2dcf5c70` at start; advanced to `056a1486` (2026-09-09 12:13:21 -0700).
`.git/FETCH_HEAD` is dated 2026-09-03 → the ref advanced by a **local push from the
`elaguila-website-final-audit-fixes` worktree**, not a fetch.

Delta = 4 commits / 75 files: `056a1486`, `273d9ff3`, `94bd78c2` (fix(admin): sign the bootstrap
session token), `6cf70b87` (business-concierge actor-safety repair + owner claim/handoff).

**Containment check:** the delta intersects the globalization audit surface (`listingPlans`,
`packageEntitlement`, `clasificados/publicar`, `revenuePricingMatrix`, analytics, savedSearch) in
**0 files**. All findings pinned at `2dcf5c70` remain valid at `056a1486`; the seed Ofertas defect was
re-verified present at `056a1486`.

Note `94bd78c2` is an admin auth security fix that moved from unintegrated → integrated *during* the audit.

### 1.3 OBSERVATION WINDOW
The repository is a live, moving target. Every statement is pinned to `origin/main` ∈
{`2dcf5c70`, `056a1486`} and Sept seal `e3956df8`, observed 2026-09-09 ≈ 11:45–15:00 -0700.

---

## 2. SEALED SEPTEMBER BASELINE — INDEPENDENTLY VERIFIED

| Field | Result |
|---|---|
| BRANCH | `fix/globalization-final-closeout-2026-09` |
| SEALED HEAD | `e3956df893f5041ca22371c999038f297d536eae` — **VALID** (type: commit) |
| Subject | "docs(globalization): record Wave 3 G09/G10 and G26 fixes as done" (2026-09-09 11:47:32 -0700) |
| LOCAL == REMOTE | **YES** |
| TREE AT SEAL | **CLEAN** (0 modified, 0 untracked) |
| MERGE BASE with origin/main | `7878d856` (2026-09-08) |
| AHEAD / BEHIND | **51 / 62** |

### 2.1 ALL 8 CLAIMED COMMITS VERIFIED PRESENT
`733408dd` ✅ Bienes Negocio destructive-edit repair · `67919479` ✅ Rentas Negocio destructive-edit
repair · `16f45c77` ✅ Wave 4 ledger · `9ae1a0f2` ✅ international phone normalization ·
`ed0c5582` ✅ Wave 3 ledger · `3eacdec9` ✅ self-engagement/report ownership ·
`bd2ee01e` ✅ dropped-media intent warning · `e3956df8` ✅ Wave 3 ledger.

**The sealed baseline is CERTIFIED ACCURATE AS DESCRIBED. It was not modified.**

### 2.2 CRITICAL — THE SEAL IS NOT IN PRODUCTION
All 51 Sept commits, including **both Wave 4 P0 data-destruction fixes**, are NOT contained in
`origin/main`. Production `main` today still carries the defects they repair.

---

## 3. HISTORICAL COORDINATE VALIDATION

| Supplied SHA | Valid | In main | In Sept | Date | Subject |
|---|---|---|---|---|---|
| `b60801e2…` | ✅ | Y | Y | 2026-08-03 | shared preview-mode contract and Empleos checkout defect |
| `8b3d405c…` | ✅ | Y | Y | 2026-07-29 | point canonical BR results constant at /resultados |
| `c17ebc9c` | ✅ | Y | Y | 2026-07-31 | complete runtime device qa |
| `ad9bf37b…` | ✅ | Y | Y | 2026-07-31 | certify full catalog preview runtime |
| `79e4afd1…` | ✅ | Y | Y | 2026-08-03 | unblock runtime ad lifecycle flows |
| `740c247b…` | ✅ | Y | Y | 2026-08-03 | close global preview edit and checkpoint lifecycle |
| `3fae3e8d…` | ✅ | Y | Y | 2026-08-01 | hide additional languages on coming-soon |
| `6b155cf3…` | ✅ | Y | Y | 2026-08-19 | **Globalization Build 05: final production closeout** |
| `390b939c…` | ✅ | Y | Y | 2026-08-19 | **Globalization Build 03: community trust + CTA truth** |
| `a6ab8410…` | ✅ | **N** | **N** | 2026-08-28 | business-applications SOURCE RED burndown |
| `cbad30f4…` | ✅ | Y | Y | 2026-08-28 | business-applications SOURCE RED burndown (same subject) |
| `41b109b6…` | ✅ | Y | Y | 2026-08-28 | Merge PR #40 |

`integration/lifecycle-foundation-2026-07` — VALID; local `18bc2b5b`, remote `f4364cf8` — **DIVERGED**.

**§3.1** `a6ab8410` and `cbad30f4` share an identical subject; only `cbad30f4` shipped.
`a6ab8410` = **HISTORICALLY_BUILT_SUPERSEDED**. Its branch carries 3 further unique commits.

---

## 4. WORKSPACE TOPOLOGY

All 37 sibling folders are **git worktrees of the single primary repo** — one object store,
`GIT_COMMON_DIR = C:/projects/elaguila-website/.git`, same `origin`. All ancestry checks are valid
workspace-wide.

- `C:\projects\recursos-recovery-backup-20260821` — **not a git repo.** `all65.json` (69 KB) +
  `dump-all.mjs` (1 KB). Class **RECOVERY**.
- `.claude/worktrees/zen-northcutt-84724c` — tool-created, detached `7cd5f524`. **Generated artifact.**

### 4.1 INVENTORY (38 folders)
Legend: ANC_M/ANC_S = ancestor of origin/main / Sept · UNIQ_M = commits not in origin/main

| FOLDER | BRANCH | HEAD | STATE (M/U) | LAST | ANC_M/S | UNIQ_M | LOCAL-ONLY | CLASS |
|---|---|---|---|---|---|---|---|---|
| elaguila-website | main | d09d979c | CLEAN(0/1) | 09-03 | Y/Y | 0 | N | PRIMARY (stale) |
| -ad-branding-studio | integration/ad-branding-studio-foundation-2026-08 | b3086746 | (0/1) | 08-20 | N/N | 1 | N | MEDIA |
| -address-foundation | feature/global-address-verification-foundation | b045763b | CLEAN | 08-27 | Y/Y | 0 | N | ADDRESS |
| -autos-dealership | autos-dealership | 8500a26e | (0/1) | 09-01 | Y/Y | 0 | N | CATEGORY_ADOPTION |
| -autos-privados-preview | autos-privados-preview | 18d9eaf2 | (1/1) | 08-13 | N/N | 2 | N | CATEGORY_ADOPTION ⚠ |
| -business-applications-final | integration/business-apps-source-red-burndown-2026-08 | cbad30f4 | (0/1) | 08-28 | Y/Y | 0 | N | BUSINESS_HUB |
| -business-shared-primitives | feature/business-shared-primitives | 47838256 | CLEAN | 08-26 | Y/Y | 0 | N | BUSINESS_HUB |
| -comida-local-category-fixes | feature/comida-local-category-fixes | 0c0a878c | CLEAN | 08-26 | Y/Y | 0 | N | CATEGORY_ADOPTION |
| -community-final-audit | audit/community-final-owner-ledger-2026-08 | a2977915 | CLEAN | 08-28 | Y/Y | 0 | N | HISTORICAL |
| -concierge | feature/business-concierge-systemic-repair-2026-09 | 273d9ff3 | (0/42) | 09-09 | Y*/N | 0* | N | BUSINESS_HUB |
| -digital-contact | feature/executive-hub-staff-flow-final | 0314ca6b | CLEAN | 08-12 | Y/Y | 0 | Y (no upstream) | HISTORICAL |
| **-final-audit-fixes** | qa/community-final-owner-qa-2026-08 | **a0a47839** | DIRTY | **09-09 12:15** | N/N | 1 | **Y (unpushed)** | MEDIA ⚠⚠ |
| -final-audit-reconcile | (detached) | a8c4c08c | CLEAN | 08-27 | Y/Y | 0 | Y | HISTORICAL |
| -global-qa-foundation | feature/global-qa-foundation-2026-08 | fc55a50f | CLEAN | 08-26 | Y/Y | 0 | N | GLOBALIZATION_CORE |
| **-globalization-final-closeout** | **fix/globalization-final-closeout-2026-09** | **e3956df8** | **CLEAN** | 09-09 | **N**/— | **51** | N | **GLOBALIZATION_CORE ⚠⚠⚠** |
| -globalization-reconcile | globalization-release-reconcile-2026-08-14 | c0912a71 | (0/1) | 08-25 | N/N | 5 | N | REVENUE_OS ⚠⚠ |
| -hotfix-es-en | hotfix/es-en-launch-gateway-2026-08 | 3fae3e8d | CLEAN | 08-01 | Y/Y | 0 | N | HISTORICAL |
| -leo | integration/leo-executive-operating-intelligence-2026-08 | 584824c8 | (5/0) | 09-09 | N/N | 2–3 | Y (ahead 6) | ADMIN_OS ⚠⚠ |
| **-leo-final** | integration/leo-final-closeout-2026-08 | dfdcab7d | **(8/15)** | 08-19 | N/N | 3 | **Y (never pushed)** | **ADMIN_OS ⚠⚠⚠** |
| -leo-release-temp | (detached) | 66f208b1 | CLEAN | 09-08 | Y/N | 0 | Y | HISTORICAL |
| -newsletter-v2 | feature/newsletter-engine-v2 | cd52ffd2 | CLEAN | 08-27 | Y/Y | 0 | N | MEDIA |
| -noticias-n2 | noticias-n2-front-page-finish-2026-09-02 | 0496ef39 | (0/1) | 09-02 | Y/Y | 0 | N | MEDIA |
| -noticias-n3 | noticias-n3-editorial-quality-2026-09-03 | d09d979c | CLEAN | 09-03 | Y/Y | 0 | N | MEDIA |
| -noticias-n4 | noticias-n4-final-production-seal-2026-09-03 | 807cd3fd | CLEAN | 09-03 | Y/Y | 0 | N | MEDIA |
| -noticias-owner-qa | noticias-owner-qa-final-composition-2026-09-03 | 66fa8de1 | CLEAN | 09-03 | Y/Y | 0 | N | MEDIA |
| -ofertas | integration/ofertas-locales-2026-07 | a8dfed7d | (0/1) | 08-31 | N/N | 1 | N | REVENUE_OS ⚠ |
| -ofertas-owner-reconcile | integration/ofertas-owner-command-center-reconcile-2026-09 | 70e68ff6 | CLEAN | 09-01 | Y/Y | 0 | N | REVENUE_OS |
| -owner-command-center | integration/owner-command-center-globalization-2026-08 | 3f4c6fe2 | (0/1) | 08-25 | Y/Y | 0 | N | USER_DASHBOARD |
| -recursos | feature/recursos-community-hub | b55eab25 | (1/2) | 08-24 | Y/Y | 0 | N | CATEGORY_ADOPTION |
| -remove-coming-soon-gate | fix/remove-coming-soon-gate-2026-08 | 942b14e5 | CLEAN | 08-28 | Y/Y | 0 | N | HISTORICAL |
| -restaurantes-category-fixes | feature/restaurantes-category-fixes | 9ff33293 | CLEAN | 08-26 | Y/Y | 0 | N | CATEGORY_ADOPTION |
| -revenue-entitlement-guard | feature/revenue-active-entitlement-edit-guard | a6727e1a | CLEAN | 08-27 | Y/Y | 0 | N | REVENUE_OS |
| -saved-search-global | global-final-production-closeout-2026-08 | 90d0bd2d | CLEAN | 08-19 | N/N | 1 | N | SAVED_SEARCH |
| -servicios-category-fixes | feature/servicios-category-fixes | ee65dae4 | CLEAN | 08-26 | Y/Y | 0 | N | CATEGORY_ADOPTION |
| -servicios-final-application | fix/servicios-application-final-qa-2026-08 | 64a80187 | CLEAN | 08-28 | N/N | 1 | N | CATEGORY_ADOPTION ⚠ |
| **-viajes** | integration/viajes-launch-qa-2026-08 | f563cdf3 | **(46/8)** | 08-04 | N/N | 1 | **Y (never pushed)** | **CATEGORY_ADOPTION ⚠⚠⚠** |
| -virtual-front-desk | feature/virtual-front-desk | 72c2daa1 | CLEAN | 08-11 | Y/Y | 0 | N | HISTORICAL |
| -website | noticias-editorial-polish | 49597244 | (0/1) | 09-02 | Y/Y | 0 | N | MEDIA |

\* `-concierge`'s commits landed in `origin/main` at 12:13 during the audit; now contained.

---

## 5. UNINTEGRATED WORK

**132 commits across 11 branches unreachable from `origin/main`. 30 of 79 local branches not
contained in main. 26 branches have no upstream at all.**

### R1 — `fix/globalization-final-closeout-2026-09` — 51 commits — PUSHED
The entire Wave 1–4 remediation program. Not at loss risk; **not in production.** See §2.2.

### R2 — `fix/br-negocio-inventory-hub-media-hydration-2026-08-27` — 32 commits / 92 files — PUSHED
2026-08-27/28. In **neither** main nor Sept. Merge-base `03584cc5`. Includes data-loss-class fixes:
`b3d85dc1` harden draft-media hydration against reload data loss · `5d3f27cf` preserve inherited
parent hub in inventory child · `42d68aa8` wire multi-video + custom highlights through publish ·
`2d0f63cd` HOA/Open House to published Privado listings · `0d80e891` restore production build
(BR results static-prerender opt-out) · `8d14de69` BR `tel:` not E.164 · `522b97f8` Suspense reveal
never fires with lang param · `629c5a46` adopt global application leave guard.

**⚠ 20-FILE CONFLICT SURFACE WITH THE SEPT SEAL**, incl. the exact Wave-4 P0 files:
```
…/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts
…/rentas/shared/rentasDashboardEditHydration.ts
…/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts
…/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts
…/rentas/negocio/application/RentasNegocioForm.tsx
…/rentas/negocio/application/mapping/rentasNegocioToBienesRaicesNegocioState.ts
…/rentas/negocio/schema/rentasNegocioFormState.ts
…/rentas/privado/schema/rentasPrivadoFormState.ts
…/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts
…/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx
…/bienes-raices/listing/mapBrListingRowToPrivadoPreviewVm.ts
…/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts
…/bienes-raices/negocio/agente-individual/sections/steps01-03.tsx
…/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts
…/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx
…/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx
…/rentas/listing/mapRentasListingLiveToPreviewVm.ts
…/rentas/preview/shared/RentasVisualMatchPreviewView.tsx
app/lib/i18n/rentasLaunchUiExtras.ts
scripts/br-manual-qa-catalog-seed.ts
```
Conflict surface with the 62 main-only commits: **0 files.**
**Merge Sept first; then reconcile this branch with Sept-seal semantics winning on the reverse mappers.**

### R3 — `elaguila-website-leo-final` — 🔴 NEVER PUSHED — HIGHEST LOSS RISK
3 unmerged commits + 8 modified + 15 untracked, including files existing **nowhere in git**:
```
app/api/leo/action/                     (new route dir)
app/leo/_lib/leoActionExecutionService.ts
app/leo/_lib/leoActionProposalFingerprint.ts
app/leo/_lib/leoActionProposalRepository.ts
app/leo/_lib/leoCalendarWriteAdapter.ts
app/leo/_lib/leoConnectedActionPreparationService.ts
app/leo/_lib/leoGmailWriteAdapter.ts
app/leo/_lib/leoPeopleAdapter.ts
supabase/migrations/20260819223000_leo_final02_connected_action_truth.sql   ← UNCOMMITTED MIGRATION
scripts/verify-leo-final02-*.ts         (5 verifiers)
```
An uncommitted Supabase migration on one machine's disk is **one `git clean` from permanent loss.**
**Owner decision required — this audit wrote nothing.**

### R4 — `qa/community-final-owner-qa-2026-08` @ `a0a47839` — UNPUSHED
Committed **at 12:15 during this audit**: "install final owner-approved landing imagery", 113 files.
No upstream configured — exists only on this machine.

### R5 — `integration/viajes-launch-qa-2026-08` — NEVER PUSHED
`f563cdf3` + 46 modified / 8 untracked spanning all of `clasificados/viajes/**` and
`publicar/viajes/**`. The commit is duplicated on `integration/viajes-complete-2026-08`; the
**working-tree changes are unique to this folder and exist nowhere else.**

### R6 — `globalization-release-reconcile-2026-08-14` — 5 commits / 67 files — PUSHED
`078c806c` canonicalize commercial listing identity · `d1447ae7` lock free Viajes/Cupones catalog ·
`6d736840` free community opportunity intake · `8fef4d26` make community coupons free ·
`c0912a71` label free Viajes/Cupones as free. **Directly relevant to the Ofertas coupon-price
contradiction (doc 00 §9).**

### R7 — `feature/digital-contact-platform` — 6 commits / 59 files — PUSHED
Digital Contact Platform v1 → Executive Contact Platform → Executive Hub foundation.

### R8 — `fix/business-applications-final-polish-2026-08` — 4 commits / 24 files — PUSHED
`a6ab8410` (superseded twin) + 3 unique: `afcf9532`, `b18352a5`, `5680d07d` (Restaurantes
"Prueba Externa" label).

### R9 — AUTOS micro-branches — ⚠ **SUPERSEDED: DISCARD ALL THREE**
> **This entry was WRONG when first written.** A content-level diff in Batch 4 proved all three are
> **already captured on `origin/main` under different SHAs**. `git merge-base --is-ancestor` returned
> "not contained" for all 6 commits — **a false negative.**

| Branch | Content-level finding |
|---|---|
| `autos-privados-preview` (`ea429664`, `18d9eaf2`) | Twin `18bc2b5b` **is on main**; 50 of 53 files byte-identical; the 3 differing files have **MORE** on main (F3 promo concurrency). `autosVehicleJsonLd.ts` and `AutosAnuncioAnalyticsStrip.tsx` are the **same git blobs** (`c903d466` / `227c16d3`) |
| `autos-dealership-before-main-sync` (`25635f6c`, `eece90c0`) | Local-only confirmed, but `git cherry` marks it **upstream**; twin `29ee58fc`. **Merging it would DELETE `AutosNegociosPreviewEngagementStrip` from the dealer preview** — a regression |
| `autos-location-readiness-micro-patches` (`f97d7141`, `be717d65`) | `git diff` vs `origin/main` across all 5 paths is **EMPTY** |

> ### 🔬 METHODOLOGICAL FINDING — SHA ANCESTRY IS NOT PROOF IN THIS REPOSITORY
> Content is frequently re-landed under new SHAs (rebases, cherry-picks, re-applications). **Every
> "unintegrated" claim in this document must be content-diffed before anyone acts on it.**
> Already applied: R9 (discard). **Still to be re-tested this way: R11's nine `global-*` feeder
> branches** — already an EVIDENCE GAP, and now materially more likely to be already-captured.
> R1, R2 and R3 are *not* affected: R1/R2 were verified by file-level diff and live-defect probing
> (all 5 sampled R2 defects reproduce on main today), and R3 contains files that exist nowhere in git.

### R10 — Single-commit branches
`integration/ofertas-locales-2026-07` (`a8dfed7d` rebuild owner dashboard + pre-payment checkout) ·
`fix/servicios-application-final-qa-2026-08` · `integration/ad-branding-studio-foundation-2026-08` ·
`global-final-production-closeout-2026-08` · LEO voice/nav commits.

### R11 — Nine `global-*` feeder branches (2026-08-17/19) — **EVIDENCE GAP**
`global-lifecycle-translate-seo`, `global-business-hub-trust-cta-media`,
`global-saved-search-{autos-matcher,autos-outbox,autos-ui,br-rentas,email-delivery,storage-rls,watchlist-architecture}`,
`global-location-privacy-security-proof`, `global-business-hub-os`.
Probably captured downstream — **not proven.** Per-branch diffs were not run. **Do not delete.**

---

## 6. SUMMARY

| Metric | Count |
|---|---|
| Folders inventoried | 38 (+1 recovery) |
| Registered worktrees | 39 |
| Local branches | 79 |
| All refs | 148 |
| Branches NOT in origin/main | 30 |
| Branches never pushed | 26 |
| Commits unreachable from origin/main | 132 |
| Branches carrying unintegrated commits | 11 |
| Folders with unique commits OR valuable uncommitted work | 12 |
| Inert folders (merged + clean/noise-only) | 26 |
| Worktrees with uncommitted source work | 6 |
| Never-pushed branches carrying real work | 3 |

**SOURCE / MAIN / REFS / DATABASE / PRODUCTION MODIFIED: NO**
