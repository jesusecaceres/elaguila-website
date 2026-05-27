# W3 — Auth, User Account, Login Methods, and Profile Identity Audit

**Audit date:** 2026-05-26  
**References:** W1 route inventory, W2 homepage/nav audit, C1-C6 clasificados gates  
**Scope:** User authentication, account creation, login methods, profile identity, publish/account handoff, dashboard protection, admin user lookup. No visual polish, no Stripe, no dashboard redesign.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves the behavior is real, safe, and connected |
| FALSE | Feature is visual-only, disconnected, unsafe, or breaks ownership |
| DEFERRED_INTENTIONAL | Safely hidden or clearly not active yet |
| NOT_APPLICABLE | Not relevant to this surface |

---

## 1. Auth routes and entry points

| Area | Surface / file | Required behavior | Current implementation | User impact | Admin impact | Status | Notes |
|---|---|---|---|---|---|---|---|
| Login route | `app/(site)/login/page.tsx` | Supports login mode safely | `mode` param parsed as `login|signup|post|reset`; default `login`. Auth check redirects already-logged-in users. | User sees correct UI per mode | N/A | TRUE | Full mode support |
| Signup mode | `/login?mode=signup` | Creates account safely | Email/password signup with strength meter + confirm; Google/Facebook OAuth; magic link. Confirmed email required before password sign-in. | User can create account | N/A | TRUE | |
| Post/publish mode | `/login?mode=post` | Redirects to publish after auth | `redirectTo` defaults to `/dashboard/perfil?require=post` if no explicit `redirect` param | User returns to intended publish route | N/A | TRUE | |
| Password reset mode | `/login?mode=reset` | Sends recovery email safely | Uses `supabase.auth.resetPasswordForEmail` with `resetCallbackUrl` pointing to `/auth/callback?redirect=/dashboard/seguridad?recovery=1` | User gets recovery email | N/A | TRUE | |
| OAuth callback | `app/(site)/auth/callback/page.tsx` | Handles OAuth/magic-link callback | Exchanges code or hash tokens for session; redirects per `?redirect=` param | User lands at intended destination | N/A | TRUE | |
| Callback onboarding | `/auth/callback` (new user) | Routes new users to profile setup | If no `full_name`/`name` in metadata and no explicit redirect → `/dashboard/perfil?onboarding=1` | New user completes profile | N/A | TRUE | |
| Clasificados login | `app/(site)/clasificados/login/page.tsx` | Routes to main login safely | Client-side redirect to `/login?mode=post&lang=...&redirect=...` | User gets to login with publish intent | N/A | TRUE | Thin redirect page |
| Sign-out | Navbar `signOut()` | Redirects safely after logout | `supabase.auth.signOut()` → `router.push(/home?lang=...&signed_out=1)` | User sees homepage with toast | N/A | TRUE | |
| Redirect safety | `safeInternalRedirect()` | Blocks external/unsafe URLs | Only accepts paths starting with `/`; returns `""` otherwise | No open-redirect vulnerability | No impersonation | TRUE | Used in login, callback, perfil |
| Preserve redirect | Navbar/Clasificados CTAs | Pass redirect to login flow | "Anúnciate" → `/login?mode=post&redirect=/clasificados/publicar/en-venta?lang=...` | User returns to intended page | N/A | TRUE | |
| Auth-required redirect | Dashboard pages | Redirect to login when logged out | Each page calls `supabase.auth.getUser()` / `getSession()` → if no user, redirects to `/login?redirect=<current_path>` | User prompted to log in; returns after auth | N/A | TRUE | Consistent pattern across all dashboard pages |

---

## 2. Login methods

### Login method matrix

| Login method | UI exposed | Callback/config exists | Creates/links user identity | Dashboard compatible | Status | Notes |
|---|---|---|---|---|---|---|
| Google OAuth | Yes — primary CTA on `/login` | `signInWithOAuth({ provider: "google" })` → `/auth/callback` | Yes — Supabase auto-creates auth.users row | Yes — same `user.id` | TRUE | `callbackUrl` built client-side from `window.location.origin` |
| Facebook OAuth | Yes — secondary CTA on `/login` | `signInWithOAuth({ provider: "facebook" })` → `/auth/callback` | Yes — Supabase auto-creates auth.users row | Yes — same `user.id` | TRUE | |
| Apple Login | Not exposed | Not configured | N/A | N/A | DEFERRED_INTENTIONAL | No Apple button, no Apple config anywhere |
| Magic link (OTP) | Yes — email link section on `/login` | `signInWithOtp({ email })` → `/auth/callback` | Yes — creates user if new, links if existing | Yes — same `user.id` | TRUE | 60-second cooldown for rate limits |
| Email/password sign-in | Yes — password section on `/login` | `signInWithPassword({ email, password })` — no callback needed | Links to existing user | Yes | TRUE | |
| Email/password sign-up | Yes — on `/login?mode=signup` | `signUp({ email, password })` — confirmation email via callback | Yes — creates auth.users row | Yes — same `user.id` | TRUE | Strength meter enforces 10+ chars, upper, lower, number, symbol, no email local part |
| Password reset | Yes — `/login?mode=reset` | `resetPasswordForEmail` → `/auth/callback?redirect=/dashboard/seguridad?recovery=1` | N/A (existing user) | Yes — redirects to security page in recovery mode | TRUE | |
| Password change | Yes — `/dashboard/seguridad` | `supabase.auth.updateUser({ password })` after re-auth or recovery flow | N/A | Yes | TRUE | Re-auth required unless in recovery mode |
| Connected provider IDs | Not surfaced to user | Stored by Supabase Auth internally (identities array) | N/A | N/A | DEFERRED_INTENTIONAL | Not shown in profile/dashboard; admin can check via Supabase Auth dashboard link |

### Failed auth behavior

| Scenario | Behavior | Safe |
|---|---|---|
| OAuth timeout/network error | Bilingual error message displayed; user can retry | Yes |
| Wrong password | `mapAuthErrorMessage` → "Correo o contraseña incorrectos" | Yes |
| Rate limit hit | Message displayed + 60s cooldown timer | Yes |
| Email already registered (signup) | Clear message suggesting login or password reset | Yes |
| Email not confirmed | Clear message: "Confirma tu correo" | Yes |
| Callback failure | Error UI with "Volver a intentar" button → redirects to `/login` | Yes |

---

## 3. User profile fields

### Profile field matrix

| Field | User profile display | User editable | Persisted | Admin visible | Used by publish/dashboard | Status | Notes |
|---|---|---|---|---|---|---|---|
| Full name / display_name | Yes — `/dashboard/perfil` | Yes — text input | Yes — `auth.updateUser({ data: { full_name } })` + `profiles.upsert({ display_name })` | Yes — admin list/detail shows `display_name` | Yes — dashboard shell, listing ownership | TRUE | Required field; validated non-empty |
| Email | Yes — shown read-only | No (tied to auth identity) | Yes — from `auth.users.email`; mirrored in `profiles.email` | Yes — admin list/detail | Yes — dashboard shell | TRUE | Cannot be changed from profile page |
| Phone | Yes — formatted input | Yes — 10-digit US format | Yes — `auth.updateUser({ data: { phone } })` + `profiles.upsert({ phone })` | Yes — admin list/detail | Yes — required for publish (`require=post` mode) | TRUE | Persisted in both auth metadata and profiles table |
| City (home_city) | Yes — CityAutocomplete | Yes — California cities only | Yes — `auth.updateUser({ data: { city } })` + `profiles.upsert({ home_city })` | Yes — admin detail | Yes — required for publish | TRUE | Validated against canonical California city names |
| Avatar/profile photo | Not present | No | No | No | No | DEFERRED_INTENTIONAL | No avatar upload UI or storage |
| Preferred language | Not stored — derived from `?lang=` param | Toggle via URL | No — session-level only | No | Yes — all pages use `?lang=` | TRUE | Intentional: language is URL-driven, not profile-stored |
| Account type | Shown in profile section ("account metadata") | No (admin-only) | Yes — `profiles.account_type` | Yes — admin can set personal/business | Yes — used for plan context | TRUE | |
| Membership tier | Shown in profile section | No (admin-only) | Yes — `profiles.membership_tier` | Yes — admin can set gratis/pro/business_lite/business_premium | Yes — used for plan display | TRUE | |
| Created date | Not shown to user | No | Yes — `profiles.created_at` | Yes — admin detail | No | TRUE | |
| Last login | Not shown | No | Managed by Supabase Auth internally | Can check via Supabase Auth dashboard | No | DEFERRED_INTENTIONAL | Not surfaced to admin panel |
| User ID / auth UID | Shown as "Cuenta # XXXX-YYYY" | No | Yes — `auth.users.id` = `profiles.id` | Yes — shown as full UUID + ref format | Yes — owner matching | TRUE | |
| WhatsApp | Yes — input on profile | Yes | Yes — `auth.updateUser({ data: { whatsapp } })` | Not in admin list | Yes — shown on listings | TRUE | |
| Business name | Yes — profile business section | Yes | Yes — `auth.updateUser({ data: { business_name } })` | Not in admin list | Yes — used in business listings | TRUE | Stored in auth metadata |
| Business description | Yes — textarea | Yes | Yes — auth metadata | No | Yes — business context | TRUE | |
| Website/Instagram/Facebook/TikTok | Yes — profile business section | Yes | Yes — auth metadata | No | Optional business info | TRUE | |
| Business hours | Yes — profile | Yes | Yes — auth metadata | No | Optional | TRUE | |
| Newsletter opt-in | Not shown to user | Not directly editable by user | Yes — `profiles.newsletter_opt_in` | Yes — admin list | No | TRUE | |
| Is disabled | Not shown to user | No | Yes — `profiles.is_disabled` | Yes — admin can toggle | Yes — affects account access | TRUE | |

---

## 4. Profile persistence

| Area | Surface / file | Required behavior | Current implementation | User impact | Admin impact | Status | Notes |
|---|---|---|---|---|---|---|---|
| Read profile | `/dashboard/perfil` load | Reads current user data | `fetchDashboardProfile(sb, u.id)` → tries EXTENDED, MEDIUM, MINIMAL selects on `profiles` table; falls back to auth metadata | User sees real data | N/A | TRUE | Graceful fallback if columns missing |
| Save profile | `/dashboard/perfil` submit | Persists changes to correct table | `supabase.auth.updateUser({ data: {...} })` + `supabase.from("profiles").upsert({ id, email, display_name, phone, home_city }, { onConflict: "id" })` | User changes persist | Visible in admin | TRUE | Dual-write: auth metadata + profiles table |
| Phone persistence | Profile save | Not visual-only | Phone saved to both `auth.user_metadata.phone` and `profiles.phone` | Phone available for listings/contact | Admin sees phone | TRUE | Formatted (xxx) xxx-xxxx |
| Name update persistence | Profile save | Persists | Saved to `auth.user_metadata.full_name` + `profiles.display_name` | Name shown in dashboard shell, listings | Admin sees name | TRUE | |
| Email tied to auth | Email display | Read-only from auth identity | `u.email` displayed; mirrored to `profiles.email` on save | User cannot change email from profile | Admin sees auth email | TRUE | |
| Missing optional fields | Profile page | Honest empty states | Empty string shows as `"—"` in admin; inputs show placeholder text for user | No fake data shown | No confusion | TRUE | |
| Profile available to admin | Admin user lookup | Admin can see profile data | `fetchProfilesForAdminList` and direct `profiles` query by ID with service role | N/A | Full visibility | TRUE | |
| Profile available to dashboard | Dashboard shell | Data populates shell | `fetchDashboardProfile` called in every dashboard page | User sees their name/email/plan | N/A | TRUE | |

---

## 5. Publish/account handoff

| Area | Surface / file | Required behavior | Current implementation | User impact | Admin impact | Status | Notes |
|---|---|---|---|---|---|---|---|
| Login → publish return | `/login?mode=post&redirect=...` | Returns to publish after login | `redirectTo` uses `safeInternalRedirect(redirectParam)`; OAuth callback preserves redirect in URL | User lands at intended publish page | N/A | TRUE | |
| Profile gate for publish | `/dashboard/perfil?require=post` | Requires phone+city before publish | If `require=post`, phone (10 digits) and city (California canonical) are mandatory; blocks save without them | User must complete profile before posting | N/A | TRUE | |
| Profile → publish redirect | After profile save in post mode | Continues to publish | `router.replace(redirectTo || /clasificados/publicar)` | User reaches publish form | N/A | TRUE | |
| Listing ownership via session | Publish flows (Autos, Empleos, BR, etc.) | Attaches authenticated user ID | All publish flows call `supabase.auth.getSession()` and use `session.access_token` for API calls; API routes verify auth | Listing is owned by user | Admin sees owner | TRUE | Token passed as Bearer header to `/api/clasificados/...` |
| No orphaned listings | Normal publish flow | Every listing has owner | API routes require valid auth token; if no session → publish blocked with "login required" message | User cannot create unowned listing | N/A | TRUE | Autos/Empleos/Servicios/Viajes all check session |
| Account creation + category routing | Sign up → publish flow | Category preserved | `?redirect=` includes full category path (e.g., `/clasificados/publicar/en-venta?lang=es`); signup creates user → callback redirects to profile → profile redirects to intended category | User reaches correct category | N/A | TRUE | |
| Deep link from chooser | `/clasificados/publicar?cat=autos` | Routes to correct category publish | `normalizeChooserDeepLink` validates category → `router.replace(dest)` | User lands at right category form | N/A | TRUE | |

---

## 6. Dashboard account protection

| Area | Surface / file | Required behavior | Current implementation | User impact | Admin impact | Status | Notes |
|---|---|---|---|---|---|---|---|
| `/dashboard` (main) | `app/(site)/dashboard/page.tsx` | Requires login | `supabase.auth.getSession()` → if no session.user → shows "Sign in" prompt with login button | No data exposed before auth | N/A | TRUE | Client-side check |
| `/dashboard/perfil` | Profile page | Requires login | `supabase.auth.getUser()` → if no user → `router.replace(/login?redirect=...)` | User prompted to log in | N/A | TRUE | |
| `/dashboard/seguridad` | Security page | Requires login | Same pattern as perfil | No password form until authed | N/A | TRUE | |
| `/dashboard/mis-anuncios` | My listings | Requires login | Same client-side auth check pattern | No listing data until authed | N/A | TRUE | |
| `/dashboard/guardados` | Saved listings | Requires login | Same pattern | No saved data until authed | N/A | TRUE | |
| `/dashboard/analytics` | Analytics page | Requires login | Same pattern | No analytics until authed | N/A | TRUE | |
| `/dashboard/mensajes` | Messages | Requires login | Same pattern | No messages until authed | N/A | TRUE | |
| `/dashboard/notificaciones` | Notifications | Requires login | Same pattern | No notifications until authed | N/A | TRUE | |
| Sensitive data exposure | All dashboard pages | Not visible before auth | Client renders loading state or sign-in prompt until session confirmed | Zero data leakage | N/A | TRUE | |
| Auth redirect safety | Redirect param | Only internal paths accepted | `safeInternalRedirect` blocks external URLs | No open redirect | N/A | TRUE | |

---

## 7. Admin user lookup readiness

| Area | Surface / file | Required behavior | Current implementation | User impact | Admin impact | Status | Notes |
|---|---|---|---|---|---|---|---|
| User list search | `app/admin/(dashboard)/usuarios/page.tsx` | Search by name, email, phone, ID | `fetchProfilesForAdminList` with server-side Postgres search + client-side `matchesSearch` (name, email, phone, ref ID, raw UUID) | N/A | Full search across all user identifiers | TRUE | |
| Display fields in list | Admin user list | Name, email, phone, city, type, tier, date | Table shows: Account#, Name, Email, Phone, City, Type, Membership, Newsletter, Date, Status | N/A | All identity fields visible at-a-glance | TRUE | |
| User detail page | `app/admin/(dashboard)/usuarios/[id]/page.tsx` | Full user identity | Shows: UUID, Ref#, name, email, phone, city, account type, membership, newsletter, created date, disabled status | N/A | Full support/debugging identity | TRUE | |
| Owned listings link | User detail → Ads Command Center | Connect user to their listings | `fetchAdminUserAdsForUser(clientId)` shows all ads across sources with IDs, status, public links, admin manage links | N/A | Full listing ownership traceability | TRUE | |
| Cross-entity search | User detail → Customer ops | Find user across systems | Link to `/admin/ops?q=<uuid>`, email search, phone search | N/A | Unified user/ads/orders search | TRUE | |
| Tienda orders | User detail | Show user's store orders | Query `tienda_orders` by `customer_user_id` | N/A | Order history visible | TRUE | |
| Auth provider visibility | User detail | Admin can inspect auth | Link to Supabase Auth dashboard (`getSupabaseAuthUsersDashboardUrl`) | N/A | Can check providers/identities in Supabase | TRUE | Not in custom panel; deferred to Supabase UI |
| Fake provider/payment state | User detail | Not shown | No fake provider badges or payment status in admin panel | N/A | No misleading data | TRUE | |
| Enable/disable account | User detail | Admin action available | `AdminUserActions` component with disable/enable toggle on `profiles.is_disabled` | N/A | Can suspend accounts | TRUE | Audited via `auditAdminWrite` |
| Account type/tier override | User detail | Admin can set | Form with `account_type` (personal/business) and `membership_tier` selects; server action with validation + audit | N/A | Administrative override | TRUE | |

---

## Billing section note (profile page)

The `/dashboard/perfil` page contains a "Billing" card that references `NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL`:
- If the env var is **not set**: shows disabled button + "Portal no configurado" message
- If the env var **is set**: links to external Stripe Customer Portal

**Status:** TRUE — This is safe. No fake payment portal is exposed. When the env var is unset (which it currently is), the button is visibly disabled with an honest explanation. This does not expose unfinished Stripe features.

---

## W3 blockers before launch

**No FALSE status items found.**

All auth flows are real, backed by Supabase Auth, with proper error handling and safe redirects. Profile persistence is dual-written to both `auth.user_metadata` and the `profiles` table. Publish flows verify auth before creating listings. Dashboard pages are protected. Admin has full user lookup capability.

### Deferred items (not blockers)

| Item | Impact | Risk | Note |
|---|---|---|---|
| Apple Login | Users who prefer Apple cannot use it | Low — Google/Facebook/password/magic-link cover most users | No Apple button shown; no fake claim |
| Avatar/profile photo | No visual identity beyond name | Low — functional without | Not present in UI; can add later |
| Connected providers display | User cannot see which providers are linked | Low — rarely needed by end users | Admin can check via Supabase Auth dashboard |
| Last login timestamp | Not visible to user or admin in custom panel | Low — available in Supabase Auth dashboard | |
| Stripe billing portal | Button disabled when env var is unset | None — honest disabled state shown | Ready to activate when Stripe is configured |

---

## Summary

| Section | Elements audited | TRUE | FALSE | DEFERRED | N/A |
|---|---|---|---|---|---|
| Auth routes & entry points | 11 | 11 | 0 | 0 | 0 |
| Login methods | 9 | 7 | 0 | 2 | 0 |
| Profile fields | 18 | 15 | 0 | 3 | 0 |
| Profile persistence | 8 | 8 | 0 | 0 | 0 |
| Publish/account handoff | 7 | 7 | 0 | 0 | 0 |
| Dashboard protection | 9 | 9 | 0 | 0 | 0 |
| Admin user lookup | 10 | 10 | 0 | 0 | 0 |
| **Total** | **72** | **67** | **0** | **5** | **0** |

---

## Files changed (W3)

- `app/lib/website-audit/WEBSITE_W3_AUTH_USER_PROFILE_AUDIT.md` (this file — new)

No code changes were needed. All auth/profile surfaces are production-safe and correctly connected.
