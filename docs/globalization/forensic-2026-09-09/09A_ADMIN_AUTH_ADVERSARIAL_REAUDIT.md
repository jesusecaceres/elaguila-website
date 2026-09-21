# 09A — Admin Auth: Adversarial Re-Audit (Correction Stream)

**Date:** 2026-09-09
**Ref audited:** `origin/main` = `a0a4783971b42ea1d71ab2602d4720d0d590baf8` (verified via `git rev-parse origin/main`).
**Local working tree is 112 commits stale and was NOT used for any finding.** Every `path:line` below is
resolved against `origin/main` via `git show origin/main:<path>` / `git grep -n <pat> origin/main`.
**Scope:** read-only. No application source modified. No git write commands executed.

---

## 0. Executive verdict

The prior stream's claim — *"`curl -H 'Cookie: leonix_admin=1'` = full admin"* — is **PARTIALLY CORRECT
AND MATERIALLY OVERSTATED IN ITS BLANKET FORM, BUT THE P0 SURVIVES ON A NARROWER, FULLY-TRACED PATH.**

The owner's challenge is **substantially vindicated on the specific defense they named**: the
`businessWorkspaceAccess` family is genuinely fail-closed, and commit `94bd78c2` (confirmed present in
`origin/main`) really did sign the bootstrap token. 51 of 82 admin API route files re-verify identity
against live Supabase Auth + roster on every request and cannot be reached with a forged cookie. The
sweeping "full admin" characterization is **not supported** and should not be carried forward.

However, the P0 is **not** rescued, because the coarse gate is load-bearing on 31 route files and on the
monetization/staff-provisioning server actions — and one of those actions **mints a real Supabase Auth
staff identity**, which then legitimately satisfies the strong guard. The strong guard is sound; it is
simply **reachable around** rather than through.

**CLASSIFICATION: P0 FORGEABLE ADMIN — CONFIRMED, SCOPED.**
Named end-to-end exploitable route (privilege escalation to genuine staff identity):
**`app/admin/teamProvisioningActions.ts:41` `createStaffUserWithAuthAction`** (§6).
Named end-to-end exploitable route (entitlement mint):
**`app/api/admin/revenue-os/manual-payments/route.ts:26` POST**, `action=record` → `action=verify_cleared` (§5.a).

---

## 1. `middleware.ts` — EVIDENCE GAP RESOLVED

`git show origin/main:middleware.ts`. **Verdict: middleware CONFIRMS the finding; it does not invalidate it.**

Three determinations, each dispositive:

**1.1 — It gates `/admin`, but only on the raw unsigned cookie value.**

`middleware.ts:13` `const ADMIN_COOKIE = "leonix_admin";`
`middleware.ts:79-81` — `if (pathname.startsWith("/admin")) return handleAdminRequest(req);`
`middleware.ts:37-42`:

```ts
if (!isPublicAdminLoginPath(pathname) && req.cookies.get(ADMIN_COOKIE)?.value !== "1") {
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
```

This is a **string comparison against the constant `"1"`**. No HMAC, no secret, no session lookup, no
call to `isAdminBootstrapSession()`, no call to `requireSalesWorkspaceAccess()`. Edge middleware
performs **zero identity re-verification**. `git grep` confirms `middleware.ts` imports nothing from
`app/lib/supabase/adminSession.ts` or `app/admin/_lib/businessWorkspaceAccess.ts` — its only admin
import is `ADMIN_UI_LANG_COOKIE` (`middleware.ts:3`), a cosmetic language cookie.

**1.2 — It does NOT gate `/api/admin` at all.**

`handleAdminRequest` is invoked only under `pathname.startsWith("/admin")` (`middleware.ts:79`).
`/api/admin/**` starts with `/api`, so it **never enters that branch**. The matcher
(`middleware.ts:112-114`) covers the path, but every `/api/admin/**` request falls through to the
public-launch-lock logic and, absent the launch lock, exits at `middleware.ts:100`
(`if (!isPublicLaunchLockEnabled()) return NextResponse.next();`). **All API-route authorization is
per-handler.** The same applies to `/api/revenue-os/admin/**`.

**1.3 — It explicitly whitelists the `ofertas-locales` admin API.**

`middleware.ts:19-25` `isOfertasLocalesQaPath()` matches `pathname.startsWith("/api/ofertas-locales/")`,
and `middleware.ts:87-89` returns `NextResponse.next()` unconditionally for it. The six
`/api/ofertas-locales/admin/**` routes are therefore reachable with **no** middleware involvement
whatsoever, even when the public launch lock is on.

**Net effect:** middleware is *itself* an instance of the coarse gate, not a compensating control. It
raises the bar for `/admin/**` pages by exactly zero bits (the required value is a public constant) and
provides no coverage at all for the API surface.

---

## 2. Is `leonix_admin=1` actually forgeable? — YES

`app/lib/supabase/server.ts:71-73`:

```ts
export function requireAdminCookie(cookies: CookieStore): boolean {
  return cookies.get("leonix_admin")?.value === "1";
}
```

The value is the literal `"1"`. It carries no signature, no nonce, no expiry, and no binding to any
principal. The doc comment at `app/lib/supabase/server.ts:58-70` is **accurate and candid** about this
("Intentionally a coarse ... marker, not a security boundary by itself, and NOT signed").

The cookie is set `httpOnly`, `sameSite: "strict"`, `secure` in production
(`app/lib/supabase/adminSession.ts:131-134`). Those flags defeat XSS theft and CSRF from a browser —
they are **irrelevant to a direct HTTP client**. `curl -H 'Cookie: leonix_admin=1'` is unaffected by all
three. Forgeability requires only knowledge of the cookie *name*, which is hardcoded in
`middleware.ts:13`, `app/lib/supabase/server.ts:72`, and `app/lib/supabase/adminSession.ts:8`.

**Confirmed forgeable. The premise of the original finding is sound.**

---

## 3. What the owner was RIGHT about — the strong guards are real

### 3.1 `requireSalesWorkspaceAccess()` is genuinely fail-closed — CONFIRMED

`app/admin/_lib/businessWorkspaceAccess.ts:106-168`. Verified line by line:

| Step | Line | Check | Fail-closed? |
|---|---|---|---|
| 0 | :109-111 | `requireAdminCookie(jar)` → `no_admin_cookie` | coarse only |
| 1 | :112-114 | `isAdminBootstrapSession(jar)` → `ownerBootstrapAccess()` | **signed token, see 3.2** |
| 2 | :116-120 | operator-email AND auth-user-id cookies both present | yes |
| 3 | :125-128 | `lookupAuthUserById()` — **live Supabase Auth Admin API** call; forged/stale/nonexistent UUID rejected | yes |
| 4 | :132-134 | cookie email must equal the **real Auth email** | yes |
| 5 | :139-142 | roster resolved **by `auth_user_id`**, never by email | yes |
| 6 | :147-149 | roster row's own email must **also** match the verified Auth email | yes |
| 7 | :151-154 | `isSalesWorkspaceRole(normalizedRole)` | yes |

A forged `leonix_admin=1` alone reaches **step 2 and stops** (`no_operator_identity`, 401 via
`denialStatusCode` at :186). Forging `leonix_admin_operator_email` and `leonix_admin_auth_user_id`
alongside it stops at **step 3**, because `lookupAuthUserById` (`app/lib/supabase/adminSession.ts:294-308`)
performs a real `supabase.auth.admin.getUserById()` round-trip and returns `{ok:false}` on any error.
No caching across requests (:104-105 doc). **This guard is sound. The prior stream was wrong to imply
otherwise.**

`toStaffWriteActor()` (`:246-262`) additionally denies `owner_bootstrap` writes outright
(`bootstrap_write_denied`, :248) and denies any staff actor missing a link in the chain (:251).

### 3.2 Bootstrap token IS now signed — commit `94bd78c2` CONFIRMED IN `origin/main`

`git merge-base --is-ancestor 94bd78c2 origin/main` → **true**. This is the decisive correction the
task anticipated.

`app/lib/supabase/adminSession.ts:100-116` `isAdminBootstrapSession()`:
- `:101-102` returns `false` when `ADMIN_BOOTSTRAP_SESSION_SECRET` is unset — **fails closed, bootstrap
  becomes entirely unavailable** rather than reverting to bare `"1"`.
- `:105-106` requires exactly 3 dot-separated parts; a legacy forged `"1"` fails here.
- `:110-112` rejects future-issued and expired tokens (12h max age, `:47`).
- `:113-115` `safeEqualHex` → `timingSafeEqual` (`:57-62`) — constant-time, no `===` on attacker input.

Issuance (`app/admin/login/submit/route.ts:6-20`) requires `ADMIN_PASSWORD` equality (`:9-12`) and
**fails closed** if the signing secret is missing (`:16-19`) rather than redirecting to a
success-looking `/admin`.

**Verdict: a forged bootstrap cookie can no longer reach `ownerBootstrapAccess()`. Prior claim (a) on
bootstrap is CORRECTED — that specific hole is closed.**

### 3.3 Real staff login is a proper password flow — CONFIRMED

`app/admin/login/auth/route.ts:20-52`: `verifyAdminSupabaseCredentials()` performs a real
`supabase.auth.signInWithPassword()` (`app/lib/supabase/adminSession.ts:213-217`), then
`lookupActiveAdminRosterByEmail()` requires an **active** roster row (`:36-40`), **before** any cookie is
set (`:48-52`). There is a genuine password step. Item (e) is **CORRECTED in the app's favor** for this
path.

---

## 4. What the owner's defense does NOT cover — the coarse gate is load-bearing

### 4.1 Route census (exhaustive, mechanical, over `origin/main`)

Enumerated with
`git ls-tree -r --name-only origin/main -- app/api/admin app/api/ofertas-locales/admin app/api/revenue-os/admin`
(82 files), each file's body fetched with `git show` and classified by which guard symbols it references.

| Class | Route files | Exported HTTP handlers |
|---|---|---|
| **Strong** (`requireSalesWorkspaceAccess` / `requireStaffWorkspaceWriteAccess` / `toStaffWriteActor`) | **51** | — |
| **Coarse gate only** | **31** | **33** → **23 mutating**, **10 read** |
| **No auth reference at all** | **0** | 0 |

**Answering the owner's count question directly: 23 mutating admin API handlers rely on the coarse gate
alone; 51 route files are genuinely re-verified downstream; 0 route files are entirely unauthenticated.**

The 51 strong files are the entire `app/api/admin/businesses/**` tree (48) plus
`app/api/admin/field-discovery/assets/{upload,upload-intent,client-upload}/route.ts` (3). **This is the
tree the owner's cited defense protects, and it protects it correctly.**

### 4.2 The 31 coarse-gate-only route files

Mutating (23 handlers across these files) — a forged cookie alone reaches the DB write:

| Route (`origin/main`) | Method | Guard | Q3 write reached |
|---|---|---|---|
| `app/api/admin/revenue-os/manual-payments/route.ts` | POST | `requireLeonixAdminPermission` :27 | **entitlement mint** (§5.a) |
| `app/api/revenue-os/admin/subscription-sweep/route.ts` | POST | `requireLeonixAdminPermission` | subscription state sweep |
| `app/api/admin/autos/listings/[id]/route.ts` | PATCH | `requireAdminCookie` | listing moderation/publish |
| `app/api/admin/clasificados/listings/[id]/route.ts` | PATCH | `requireAdminCookie` | listing moderation/publish |
| `app/api/admin/clasificados/listings/[id]/ai-review/route.ts` | POST | `requireAdminCookie` | AI review write |
| `app/api/admin/clasificados/listings/ai-review/bulk/route.ts` | POST | `requireAdminCookie` | **bulk** AI review write |
| `app/api/admin/empleos/listings/[id]/route.ts` | PATCH | `requireAdminCookie` | listing write |
| `app/api/admin/empleos/listings/moderate/route.ts` | POST | raw `leonix_admin` inline | moderation write |
| `app/api/admin/restaurantes/listings/[id]/route.ts` | PATCH | `requireAdminCookie` | listing write |
| `app/api/admin/servicios/listings/[id]/route.ts` | PATCH | `requireAdminCookie` | listing write |
| `app/api/admin/viajes/listings/[id]/route.ts` | PATCH | `requireAdminCookie` | listing write |
| `app/api/admin/viajes/staged-listings/moderate/route.ts` | POST | raw `leonix_admin` inline | moderation write |
| `app/api/admin/executive-hub/upload/route.ts` | POST | raw `leonix_admin` inline | storage upload |
| `app/api/admin/magazine/upload/route.ts` | POST | raw `leonix_admin` inline | storage upload |
| `app/api/admin/recursos/intake/pdf-upload/route.ts` | POST | `requireLeonixAdminPermission` | storage upload |
| `app/api/admin/leads/inbox/[id]/route.ts` | PATCH | `assertAdminLeadExportAccess` | lead row mutate |
| `app/api/admin/leads/media-kit/[id]/route.ts` | PATCH | `assertAdminLeadExportAccess` | lead row mutate |
| `app/api/admin/leads/newsletter/[id]/route.ts` | PATCH | `assertAdminLeadExportAccess` | subscriber row mutate |
| `app/api/ofertas-locales/admin/[id]/review/route.ts` | POST | `requireAdminCookie` | offer review/publish |
| `app/api/ofertas-locales/admin/[id]/renewals/route.ts` | PATCH | `requireAdminCookie` | renewal state |
| `app/api/ofertas-locales/admin/cleanup-queue/route.ts` | PATCH | `resolveOfertasLocalesOwnerOrAdminAuth` :33 | queue row update :57-60 |
| `app/api/ofertas-locales/admin/cleanup-queue/execute/route.ts` | POST | `authenticateOfertaLocalAdminOrWorker` :15 | lease claim / asset deletion :71 |
| `app/api/ofertas-locales/admin/renewals/activate-due/route.ts` | POST | `authenticateOfertaLocalAdminOrWorker` :15 | **`rpc("activate_due_oferta_local_renewal")` :63** |

Both `ofertas-locales` helpers reduce to the same primitive:
`app/lib/ofertas-locales/ofertasLocalesAdminWorkerAuth.ts:22` — `if (requireAdminCookie(cookieStore)) return { ok: true, source: "admin_cookie" };`
`app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts:19-22` — `if (requireAdminCookie(cookieStore)) { ... return { actorUserId: bearerId ?? "admin", isAdmin: true }; }`
Note the latter **synthesizes the literal actor id `"admin"`** when no bearer token accompanies the
forged cookie, poisoning attribution on every write it authorizes.

Read (10 handlers) — Q4 answered **YES**, sensitive PII is readable with a forged cookie:
`app/api/admin/leads/inbox/export/route.ts`, `.../media-kit/export/route.ts`,
`.../newsletter/export/route.ts`, `.../newsletter/emails-export/route.ts`,
`app/api/admin/clasificados/category-ops-audit/route.ts`,
`app/api/admin/empleos/listings/route.ts`, `app/api/admin/viajes/staged-listings/route.ts`,
`app/api/ofertas-locales/admin/cleanup-queue/route.ts`, `.../readiness/route.ts`.

---

## 5. Previously-flagged items — confirm or correct, one by one

### (a) `app/api/admin/revenue-os/manual-payments/route.ts` — **CONFIRMED P0. Entitlement mint reachable.**

Question asked: *does either guard re-verify real identity?* **Neither does.**

- `:27` `await requireLeonixAdminPermission("can_view_payments")` — see (d): with
  `ADMIN_ENFORCE_ROSTER_PERMISSIONS` unset (the default, §5.d), this function returns at
  `app/admin/_lib/leonixAdminGate.ts:45-47` after **only** `requireLeonixAdminCookie()`. It is a
  cookie check wearing a permission check's name.
- `:48` `const access = await getCurrentAdminAccessContext()` — used **solely for audit attribution**
  (`:49` `const adminUserId = access.authUserId ?? access.operatorEmail ?? access.rosterMemberId ?? "admin"`).
  It is **never branched on**. It authorizes nothing. And per (c) it fails open to `owner_admin`, so with
  a bare forged cookie every write is attributed to the literal string `"admin"`.

**Q5 — can it mint entitlements with only a forged cookie? YES. Full trace:**

1. `POST /api/admin/revenue-os/manual-payments` with `Cookie: leonix_admin=1`, body
   `{"action":"record", "category":..., "packageKey":..., "amountCents":..., "listingId":...}`
   → `:55` `recordManualPaymentPendingVerification(...)`
   → `app/lib/listingPlans/manualClearedPayments.ts:58-59` `.from("leonix_payment_records").insert({...})`
   via the **service-role** client. Returns a `paymentRecordId`.
2. Second call, `{"action":"verify_cleared","paymentRecordId":"<id>"}`
   → `:81` `verifyManualPaymentCleared({adminUserId, paymentRecordId})`
   → `app/lib/listingPlans/manualClearedPayments.ts:131-132` CAS update to
     `manual_state: "cleared", payment_status: "paid"`
   → **`:143` `await activateEntitlementsForPayment({...})`**
     (imported `:20` from `./revenueEntitlementFulfillment`) — the standard entitlement writer, grant
     source `manual_cleared_payment`.

No payment processor is involved; the route's own doc comment (`:20-24`) states `verify_cleared`
"fulfills entitlement, exactly once, via the standard entitlement writer." **An unsigned cookie
converts directly into a paid entitlement.** Q6 (publish) follows, since entitlements drive placement.

### (b) `app/api/admin/leads/**` — **CONFIRMED. Pure cookie passthrough.**

`app/admin/_lib/adminLeadExportAuth.ts:6-12` is the entire implementation:

```ts
export async function assertAdminLeadExportAccess(): Promise<Response | null> {
  const jar = await cookies();
  if (!requireAdminCookie(jar)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
```

It calls `requireAdminCookie` and nothing else — **no roster lookup, no Auth lookup, no permission
key.** It is a rename of the coarse gate, not a check.

7 handlers depend on it (census §4.2): 4 bulk PII CSV exports + 3 PATCH mutations, plus
`clasificados/category-ops-audit`. `app/api/admin/leads/newsletter/emails-export/route.ts:8-9` →
`fetchAllNewsletterSubscribersForExport()` → `newsletterReadyEmailsCsv` → **entire subscriber email
list as CSV**. `app/api/admin/leads/inbox/export/route.ts:8-9` → `fetchAllLeonixLeadsForExport()` →
**full lead database as CSV**.

**Q4 = YES. Severity: HIGH (mass PII exfiltration, one unauthenticated GET, no rate limit, `Cache-Control: no-store` only).**
Prior flag stands, corrected only in count: 8 handlers, not "6-9 handlers" loosely.

### (c) `app/admin/_lib/adminAccessControl.ts` — **CONFIRMED. Fails open to `owner_admin` on three branches.**

`getCurrentAdminAccessContext()` spans `:178-285`. Precise branch behavior:

| Branch | Line | Returns `normalizedRole` | `rosterResolved` |
|---|---|---|---|
| **no `leonix_admin` cookie at all** | `:193-207` | `"owner_admin"` | `false` |
| cookie present, **no operator email** (neither cookie nor `ADMIN_OPERATOR_EMAIL`) | `:209-223` | `"owner_admin"` | `false` |
| roster row missing **or** `is_active` false | `:234-248` | `"owner_admin"` | `false` |
| Supabase throws | `:271-284` | `"owner_admin"` | `false` |

The header comment is explicit at `:18` — *"When no roster email is configured, cookie admins keep full
owner access."* This is documented intent, not an oversight, but it is a fail-open.

**What `owner_admin` can then do:** `:60` `OWNER_ROLES` includes `owner_admin`;
`getSalesRepScopeForAdmin` (`:153-160`) returns `null` for any non-`sales_rep` role, so
`filterPromoCodesForAccess` (`:308-314`) and `filterEntitlementsForAccess` (`:316-322`) apply **no
row filtering at all** — every promo code and every entitlement in the system is visible and
manageable. `requireAdminTeamAccess` (`:349-353`) admits it. This branch is the **precondition for §6**.

Note the compounding factor: the fail-open is *maximised* by sending the **minimum** forgery. An
attacker who sends only `leonix_admin=1` and omits the operator-email cookie lands in the `:209-223`
branch and receives `owner_admin` with `rosterResolved:false` — strictly more privilege than supplying
a guessed email, which would risk landing in a scoped `sales_rep` role. **Adding forged data reduces the
attacker's privilege; the minimal forgery is the strongest one.**

### (d) `app/admin/_lib/leonixAdminGate.ts` — **CONFIRMED no-op by default.**

`:38-70` `requireLeonixAdminPermission()`:

```ts
await requireLeonixAdminCookie();                                   // :39  — coarse gate only
const enforce = process.env.ADMIN_ENFORCE_ROSTER_PERMISSIONS === "1";  // :41
...
if (!enforce || !email) { return; }                                 // :45-47  ← RETURNS. No check.
```

Roster/permission logic (`:49-69`) is unreachable unless the env var is exactly `"1"`.

**Default deployment posture — determined from `git grep -n "ADMIN_ENFORCE_ROSTER_PERMISSIONS" origin/main`
(12 hits, all consistent):**

- `app/admin/_lib/leonixAdminGate.ts:6` — documented as **"Layer 2 (optional)"**.
- `app/lib/website-audit/WEBSITE_W5_ADMIN_USER_CLIENT_DASHBOARD_AUDIT.md:46` —
  status `DEFERRED_INTENTIONAL`, **"Default: shared-password cookie only"**.
- `docs/globalization/package-e/E3_ADMIN_OS_GLOBAL_OPERATIONS_CLOSURE.md:71` —
  **"was not changed (locked, per instruction) ... REQUIRES OWNER QA"**, and notes flipping it blind
  "risks locking out legitimate staff."
- `docs/globalization/package-f/F2_FINAL_FIX_BUILD_CLOSURE.md:49` — still listed as open item `P0-6`.
- `scripts/verify-admin-staff-launch-readiness.mjs:96` — listed under **"Optional:"**.
- **No `.env` file, `vercel.json`, or CI config in `origin/main` sets it.**

**Verdict: OFF by default, deliberately, and known to be off.** Therefore every one of the ~28
`requireLeonixAdminPermission(...)` call sites across `app/admin/**` — including `manual-payments`
(§5.a), `subscription-sweep`, `recursos/intake/pdf-upload`, and all of `adminTeamActions.ts` —
degrades to a bare cookie check in production. `leonixAdminGate.ts:22` concedes this in its own words:
*"Not yet gated by roster (cookie only)."* Prior flag **stands, fully confirmed.**

### (e) Cookie issuance — **CORRECTED IN THE APP'S FAVOR (partially)**

Two issuance paths, both requiring a real secret:

- `app/admin/login/submit/route.ts:9-12` — shared `ADMIN_PASSWORD`; issues the **signed** bootstrap
  token (`:14-19`), fails closed without `ADMIN_BOOTSTRAP_SESSION_SECRET`.
- `app/admin/login/auth/route.ts:28-40` — real Supabase Auth password + active roster row.

**There IS a password step. `94bd78c2` IS in `origin/main` and the bootstrap token IS genuinely signed
(§3.2).** The prior stream's implication that bootstrap was trivially forgeable is **OBSOLETE and must
be retracted.**

**But this does not rescue the finding**, and the distinction is the crux of this re-audit: `94bd78c2`
hardened `leonix_admin_bootstrap` and **explicitly, deliberately left `leonix_admin` unsigned.** Its own
commit message states *"`leonix_admin` itself is intentionally left as the existing coarse ... marker ...
it was never the actual authority boundary for bootstrap or staff."* That reasoning is **correct for the
51 strong routes and false for the 31 coarse ones**, where `leonix_admin` is not merely *an* authority
boundary — it is the *only* one. The hardening closed the bootstrap door and left the 31 side doors open.

### (f) `app/admin/actions.ts:13` `submitListingReportAction` — **CONFIRMED, BUT SEVERITY CORRECTED DOWNWARD**

The code is exactly as flagged (`:13-23`): no guard, service-role `.insert()` into `listing_reports`,
`reporter_id` taken verbatim from the third parameter.

**However — this action is BY DESIGN publicly callable.** `git grep` shows it imported by **client**
components on public pages:
`app/(site)/clasificados/components/LeonixInlineListingReport.tsx:5` (called `:50`),
`app/(site)/clasificados/anuncio/[id]/page.tsx:47` (called `:1163`),
`app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx:12` (called `:118`),
`app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx:13` (called `:213`).
Every call site passes `user?.id ?? null` — i.e. the *client* asserts its own identity.

So this is **not an admin-auth bypass** (it never was admin-gated, and gating it would break the public
report feature). It lives in `app/admin/actions.ts` purely by file-placement accident. The real,
narrower defects are:

1. **Reporter spoofing** — `reporterId` is client-supplied and never reconciled against the server-side
   session, so any reporter can be impersonated or a report attributed to an arbitrary user id.
2. **Unauthenticated unbounded service-role insert** — no rate limit, no captcha, no auth requirement
   (`reporterId` may be `null`), writing with the service-role key, i.e. bypassing RLS. A trivial script
   can flood `listing_reports`.

**Severity: MEDIUM** (integrity/abuse, not privilege escalation). The prior stream's instinct was right
but its framing as an *admin* finding was wrong. Fix is to resolve `reporterId` server-side and add rate
limiting — not to add an admin gate.

### (g) `app/admin/recursosTranslationActions.ts:178` `confirmOfficialSpanishCore` — **CONFIRMED unguarded; exploitability is an EVIDENCE GAP**

Verified directly. The file opens `"use server"` (`:1`). Every sibling export calls the gate on its
first line — `:48/:49`, `:88/:89`, `:126/:127`, `:226/:227`, `:249/:250`, `:283/:284` all begin
`await requireLeonixAdminPermission("can_manage_recursos");`. **`:178` `confirmOfficialSpanishCore` is
the sole export in the file with no guard call anywhere in its body (`:178-223`).** It reaches a real
write at `:213` `dbSetCommunityResourceSpanishStatus(resourceId, "official_spanish", sourceType)` plus
`insertVerificationEvent(...)` at `:219` — i.e. it can **certify content as officially-sourced Spanish**,
a Q6 publish-class operation.

The omission is an artifact of a refactor: the doc comment (`:170-176`) explains it was "extracted into
a plain async function (no FormData/redirect)" so that both `confirmOfficialSpanishAction` (`:226`,
guarded at `:227`) and `approveOfficialSpanishBatchAction`
(`app/admin/recursosOfficialSpanishActions.ts:194`, guarded) could share it. Both *callers* are guarded —
the author reasonably treated it as an internal helper. The bug is that **`export` from a `"use server"`
module is not internal.**

**Does Next.js register it as a callable endpoint?** Per Next.js `"use server"` module semantics (repo is
`next: ^15.5.7`, `package.json`), a file-level `"use server"` directive marks **every export** of that
module as a Server Action with its own action id — the framework docs warn explicitly about this. So the
registration is real.

**EVIDENCE GAP (stated as required):** invoking it requires the action's build-time id hash. I cannot
determine from source alone whether that id is discoverable in a shipped client bundle. Notably, no
client component imports `confirmOfficialSpanishCore` (only two server-side callers, per `git grep`),
which makes the id **unlikely** to be emitted into client JS — but confirming that requires inspecting a
production build artifact (`.next/`), which is out of scope for a read-only source audit and is not
committed to the repo.

**Severity: MEDIUM, pending that build-artifact check.** Treat as a real hardening defect regardless —
the fix is one line (`await requireLeonixAdminPermission("can_manage_recursos");` at `:179`) and removes
the question entirely.

---

## 6. The escalation bridge — why the P0 survives the downgrade

This is the finding that prevents a clean downgrade, and it was **not** in the prior stream's report.

`app/admin/teamProvisioningActions.ts:41-46`:

```ts
export async function createStaffUserWithAuthAction(formData: FormData) {
  await requireLeonixAdminCookie();          // :42  — coarse gate ONLY
  const access = await getCurrentAdminAccessContext();   // :43  — fails open (§5.c)
  requireSuperAdminStaffCreator(access);     // :44
```

`requireSuperAdminStaffCreator` (`:33-38`):

```ts
function requireSuperAdminStaffCreator(access) {
  requireAdminTeamAccess(access);
  if (access.rosterResolved && access.rosterRole !== "super_admin") {   // :35
    redirect("/admin/team/users/new?error=forbidden");
  }
}
```

**The role check at `:35` is guarded by `access.rosterResolved`.** With a bare forged
`leonix_admin=1` and no operator-email cookie, `getCurrentAdminAccessContext()` returns
`{ normalizedRole: "owner_admin", rosterResolved: false }` (`adminAccessControl.ts:209-223`). The `&&`
**short-circuits to `false`, the redirect never fires, and the super-admin check is skipped entirely.**
`requireAdminTeamAccess` (`adminAccessControl.ts:349-353`) then admits `owner_admin` (in `OWNER_ROLES`,
`:60`). Both gates pass.

Execution proceeds to `:65-76` `provisionStaffAuthUser({ email, role, permissions, passwordSetupMode,
temporaryPassword, ... })` — which creates a **real Supabase Auth user and a real
`admin_team_members` roster row linked by `auth_user_id`**, with attacker-chosen `role` (validated only
against `isAllowedStaffRosterRole`, `:63`), attacker-chosen `permissions` (`:55-57`), and an
**attacker-chosen `temporary_password`** (`:52`).

**Full end-to-end chain (Q8 — the exact proof of exploitability):**

1. `POST /admin/team/users/new` server action with `Cookie: leonix_admin=1` only,
   `role=super_admin`, `password_setup_mode=temporary`, `temporary_password=<attacker choice>`.
   *(Middleware §1.1 passes it — cookie value is `"1"`. Both role gates pass — §6.)*
2. A genuine Supabase Auth user + active `admin_team_members` row now exist, linked by `auth_user_id`,
   role `super_admin`, permissions of the attacker's choosing.
3. `POST /admin/login/auth` with that email + chosen password → passes
   `verifyAdminSupabaseCredentials` (`app/admin/login/auth/route.ts:28`) and
   `lookupActiveAdminRosterByEmail` (`:33`) **legitimately**, and receives real session cookies (`:48-52`).
4. The attacker now satisfies **every one of the seven steps** in `requireSalesWorkspaceAccess`
   (§3.1) — real Auth user, matching emails, roster row keyed by `auth_user_id`, permitted role — and
   also passes `toStaffWriteActor` (non-empty `rosterId` and `authUserId`).
5. **All 51 "strong" routes are now open, with `super_admin` capabilities.**

The strong guard is never defeated. It is **satisfied with credentials the attacker legitimately
minted through the weak guard.** Any downgrade that treats the 51 strong routes as protected must
account for this: they are protected only as long as *no* coarse-gated route can manufacture a staff
identity — and `:41` can.

The same fail-open pattern gates a second entitlement-mint path:
`app/admin/(dashboard)/workspace/package-entitlements/actions.ts:466-468`
`grantComplimentaryPackageEntitlementAction` — `requireAdminCookie` at `:467`, then
`getCurrentAdminAccessContext()` at `:468` used only for attribution (`:492`), reaching
`grantComplimentaryAccess`/`grantPartnerCourtesy` at `:494-503`. All 5 exports in that file and both in
`promo-codes/actions.ts` follow the identical `requireAdminCookie` + fail-open-context shape.

---

## 7. The owner's 8 questions — consolidated answers

| # | Question | Answer |
|---|---|---|
| 1 | Only `requireAdminCookie` / raw inline check? | **31 of 82** API route files; 5 of 5 monetization workspace action files; `teamProvisioningActions.ts`. 51 route files do more. |
| 2 | Subsequent real identity check? | **Yes on 51 files** — `requireSalesWorkspaceAccess` (`businessWorkspaceAccess.ts:106-168`) / `requireStaffWorkspaceWriteAccess` (`:284-296`) / `toStaffWriteActor` (`:246`). **No on the other 31** — `requireLeonixAdminPermission` returns early (`leonixAdminGate.ts:45-47`), `assertAdminLeadExportAccess` is a passthrough (`adminLeadExportAuth.ts:6-12`), `getCurrentAdminAccessContext` is attribution-only and fails open (`adminAccessControl.ts:209-223`). |
| 3 | Unsigned cookie alone → privileged WRITE? | **YES.** 23 mutating handlers. Fully traced: `manual-payments` → `activateEntitlementsForPayment` (`manualClearedPayments.ts:143`); `createStaffUserWithAuthAction` → `provisionStaffAuthUser` (`teamProvisioningActions.ts:65`); `activate-due` → `rpc("activate_due_oferta_local_renewal")` (`:63`). |
| 4 | READ sensitive data / PII? | **YES.** 4 bulk CSV exports of the full lead + newsletter-subscriber databases (§5.b), plus the whole `/admin/**` page tree via middleware `:37-42`. |
| 5 | MINT entitlements / payments? | **YES, two independent paths** — `manual-payments` POST (§5.a) and `grantComplimentaryPackageEntitlementAction` (§6). |
| 6 | PUBLISH / UNPUBLISH? | **YES.** 9 listing-moderation PATCH/POST handlers across autos/clasificados/empleos/restaurantes/servicios/viajes/ofertas-locales; plus `confirmOfficialSpanishCore` (§5.g). |
| 7 | MODIFY users or staff? | **YES.** `createStaffUserWithAuthAction` (§6) creates Auth users + roster rows; `createCustomerUserWithAuthAction` (`:111-112`) likewise; all 4 `adminTeamActions.ts` exports (invite, create, permissions, activate/deactivate) sit behind `requireLeonixAdminPermission("can_manage_team")`, a no-op by default (§5.d). |
| 8 | Exact route proving exploitability | **`app/admin/teamProvisioningActions.ts:41` `createStaffUserWithAuthAction`** — 5-step chain in §6, terminating in full `super_admin` access to all 51 otherwise-protected routes. Secondary: `app/api/admin/revenue-os/manual-payments/route.ts:26` POST. |

---

## 8. Corrected findings register

| ID | Finding | Severity | Status vs. prior stream |
|---|---|---|---|
| **A** | `createStaffUserWithAuthAction` (`teamProvisioningActions.ts:41`, role check short-circuited by `rosterResolved` at `:35`) lets a forged cookie mint a genuine `super_admin` Auth+roster identity → full escalation into the strong-guarded tree | **P0** | **NEW — not previously reported** |
| **B** | `manual-payments` POST (`app/api/admin/revenue-os/manual-payments/route.ts:26`) mints entitlements on a forged cookie; both "guards" are no-ops | **P0** | **CONFIRMED**, mechanism corrected (guards are no-ops, not weak) |
| **C** | `grantComplimentaryPackageEntitlementAction` (`package-entitlements/actions.ts:466`) — second entitlement-mint path, same pattern | **P0** | **NEW** |
| **D** | Mass PII exfiltration via 4 lead/newsletter CSV exports; `assertAdminLeadExportAccess` (`adminLeadExportAuth.ts:6-12`) is a pure passthrough | **HIGH** | **CONFIRMED** |
| **E** | `getCurrentAdminAccessContext` fails open to `owner_admin` on 4 branches (`adminAccessControl.ts:193,209,234,271`); minimal forgery yields maximal privilege | **HIGH** | **CONFIRMED**, with the counterintuitive minimal-forgery detail added |
| **F** | `ADMIN_ENFORCE_ROSTER_PERMISSIONS` off by default → all ~28 `requireLeonixAdminPermission` sites are cookie-only (`leonixAdminGate.ts:45-47`) | **HIGH** | **CONFIRMED** |
| **G** | 23 mutating + 10 read handlers on the coarse gate alone (§4.2); middleware adds nothing (§1) | **HIGH** | **CONFIRMED**, with exact counts |
| **H** | `confirmOfficialSpanishCore` (`recursosTranslationActions.ts:178`) — unguarded export from a `"use server"` module | **MEDIUM** | **CONFIRMED**; exploitability = EVIDENCE GAP (action-id discoverability needs a build artifact) |
| **I** | `submitListingReportAction` (`actions.ts:13`) — spoofable `reporterId`, unauthenticated unbounded service-role insert | **MEDIUM** | **CONFIRMED but RECLASSIFIED** — public by design, not an admin bypass |
| — | Bootstrap cookie forgeable → `ownerBootstrapAccess()` | — | **RETRACTED — fixed by `94bd78c2` (§3.2)** |
| — | "`leonix_admin=1` = full admin" (blanket) | — | **RETRACTED as stated — 51/82 routes genuinely re-verify (§3.1)** |

---

## 9. Bottom line for the owner

You were right to push back, and right about the specific thing you named: `requireSalesWorkspaceAccess`
is a well-built, fail-closed guard, `94bd78c2` genuinely fixed the bootstrap token, and the blanket
claim of "full admin" was not earned — **51 of 82 admin API route files cannot be touched with a forged
cookie.** That deserves to be stated plainly, and the prior stream should not have generalized.

The reason the P0 nonetheless stands is narrower and more specific than what was originally reported:
the coarse gate is not merely "coarse," it is **the sole gate on 31 route files and on the
staff-provisioning action** — and that action can manufacture the very staff identity the strong guard
is designed to verify. The doctrine in `businessWorkspaceAccess.ts:38-40` ("every page and route calls
this independently — never trust the dashboard layout's cookie check alone") is correct and was simply
never extended past the Business Concierge tree.

**Smallest change that collapses the P0 (A + C + the escalation bridge):** fix the short-circuit at
`teamProvisioningActions.ts:35` — require an affirmatively resolved `super_admin` roster row rather than
skipping the check when `rosterResolved` is false. That one line removes the identity-minting bridge and
reduces every remaining item to its own bounded blast radius.

**Full remediation** requires either signing `leonix_admin` or routing the 31 coarse route files through
a real identity check. The commit message for `94bd78c2` argued signing `leonix_admin` carried "no
additional security benefit" — this audit demonstrates that conclusion was reached by considering only
the bootstrap and Business Concierge paths, and does not hold for the 31 files enumerated in §4.2.

---

*Read-only audit. No application source modified; no git write commands executed. Sole artifact written:
this file. All findings resolved against `origin/main` @ `a0a4783971b42ea1d71ab2602d4720d0d590baf8`.*
