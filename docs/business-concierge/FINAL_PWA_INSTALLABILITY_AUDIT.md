# Final PWA Installability Audit

**Date:** 2026-08-25
**Worktree:** `C:\projects\elaguila-website-concierge`
**Branch:** `integration/business-concierge-foundation-2026-07`
**Baseline HEAD:** `0f22a9637ae22334c389475df4ca693921abaf6b`
**Commit / push / deploy:** none (Coach review first)

This is an installability closeout of the existing Package C / Gate 7G PWA, not a second app.

---

## Manifest

Single Next.js app manifest: `app/manifest.ts` → `/manifest.webmanifest`.

| Field | Value |
| --- | --- |
| name | Leonix Business Concierge |
| short_name | Leonix Concierge (existing certified concise name) |
| id | `/admin/businesses` |
| start_url | `/admin/businesses` |
| scope | `/admin/` (Command Center, dashboards, Field Agent `/admin/field`) |
| display | standalone |
| theme_color | `#7A1E2C` |
| background_color | `#FAF6EE` (Leonix cream splash) |
| orientation | omitted (portrait was blocking natural tablet use) |

One manifest for every authorized person. No per-user manifest.

## App identity

The installed product is **Leonix Business Concierge**. Login/session selects the person. Staff A can log out and Staff B can log in on the same installed app.

## Icons

Generated from approved crest `public/logo-clean.png` (not redrawn):

- `/pwa/icon-192.png` — 192×192
- `/pwa/icon-512.png` — 512×512
- `/pwa/icon-512-maskable.png` — 512×512 maskable with cream padding
- `/pwa/apple-touch-icon.png` — 180×180 for iOS Add to Home Screen

Prior manifest claimed 192/512 while serving 1024×1024 `/logo.png`, which commonly prevents Chromium `beforeinstallprompt`.

Admin layout also sets `appleWebApp` + apple icon.

## Service worker

`public/sw.js` registered from [`ServiceWorkerRegistration`](app/components/ServiceWorkerRegistration.tsx) in the root layout, scope `/`.

Cache name: `leonix-business-concierge-v1` (replaces field-era `leonix-field-v1`; activate deletes old caches).

Registration remains production-only (`NODE_ENV === "production"`), which includes Vercel Preview/Production builds. Local `next dev` does not register a worker (honest).

## Caching rules

Caches only static shell (`/_next/static`, `/_next/chunks`, `/pwa/`, image/font/css/js).

Never caches:

- `/api/`
- `/auth/`
- `supabase.co`

HTML navigations are network-first; failure shows `/offline`. No IndexedDB, no background sync, no mutation queue.

## Install CTA

[`BusinessConciergeInstallBanner`](app/admin/(dashboard)/businesses/BusinessConciergeInstallBanner.tsx) on Staff Command Center and Field Agent (`InstallCta`).

Hook: [`useInstallPrompt`](app/lib/pwa/useInstallPrompt.ts) — one `beforeinstallprompt` / `appinstalled` handler.

## Chrome / Edge

When `beforeinstallprompt` fires: **Install Business Concierge** (44px). `prompt()` only after click. `userChoice` accepted/dismissed handled. `appinstalled` clears the prompt.

## iOS / iPadOS

Safari never fires `beforeinstallprompt`. Detection includes classic iPhone/iPad UA and iPadOS desktop UA (`MacIntel` + `maxTouchPoints > 1`).

UI: **Add to Home Screen** → Share → Add to Home Screen. Copy states automatic install is not available.

## Already-installed detection

`display-mode: standalone` and iOS `navigator.standalone`. Standalone shows **Installed** (deep green success) and hides the install button.

Session Dismiss hides the help card until reload. Chromium `userChoice` dismissed consumes the prompt for this page life and shows a dismissed note instead of a false “cannot install” message. `accepted` / `appinstalled` switch to Installed.

## Admin / owner doorway

- Admin home card: Open Business Concierge → `/admin/businesses`
- Global admin nav label: **Business Concierge** → `/admin/businesses` (also visible from `/admin/usuarios` via the shell)
- Link does not grant access; `requireSalesWorkspaceAccess` remains authoritative

## Staff doorway

`sales_rep` allowed global hrefs already include `/admin/businesses`. Same nav label. Field Agent remains `/admin/field`.

## Shared-app identity

ONE manifest, ONE service worker, ONE install surface. No user id in manifest/SW.

## Authentication

Installed start URL is `/admin/businesses`. Unsigned/expired sessions still hit [`AdminProtectedLayout`](app/admin/(dashboard)/layout.tsx) → `/admin/login`. After login, existing redirect architecture applies. No second PWA login. No passwords in cache.

## Owner bootstrap

Unchanged. May open Command Center and install. Does not receive a fake roster. Roster-required writes stay restricted. Install does not change capabilities.

## Permissions

Server-authoritative. Unauthorized users opening the installed app still fail access checks. Public users do not gain staff access.

## Offline behavior

[`/offline`](app/offline/page.tsx): honest “you are offline / cannot access Business Concierge tools without internet.” No fake save success.

## Mobile / tablet / desktop

- 390px: install card stacks; 44px targets; `overflow-hidden` / wrap
- ~768px tablet: same card; portrait lock removed; `viewport-fit: cover` + safe-area padding on AdminShell
- Desktop: Command Center install card beside title

## Tests

Program 7 behavioral tests + verifier PWA checks; sales workspace PWA installability check.

## Remaining human installation tests

Code cannot prove every device UI:

- Chrome/Edge Add to app on Windows/Android
- Safari Share → Add to Home Screen on a real iPhone and iPad
- Launch standalone → Command Center
- Logout / second authorized user on the same installed app
- Expired session → login → return

ENGINEERING INSTALLABILITY is verified from manifest/SW/install handling. REAL DEVICE INSTALL remains HUMAN QA REQUIRED.
