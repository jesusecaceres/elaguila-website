# Production Preview Bypass

Secure owner-only access to the full production site while the public Coming Soon lock remains active for everyone else.

## What it does

- Lets the site owner unlock production preview with a **one-time private URL** visit.
- Sets an HTTP-only cookie (`leonix_preview_access`) on the domain for **30 days**.
- The cookie works across **all paths**, **tabs**, and **browser sessions** on the same device until it expires or is cleared.
- Public visitors without the cookie still see **Coming Soon** (`/coming-soon-v2`).
- Staff with an existing **`leonix_admin`** session cookie continue to bypass the lock as before.

## What it does not do

- Does **not** open the site to the public.
- Does **not** disable the global Coming Soon / launch lock.
- Does **not** weaken admin authentication or Supabase staff auth.
- Does **not** expose the bypass token in client code or the repository.
- Does **not** add a public unlock button on any page.
- Does **not** change listing, category, Stripe, or payment behavior.

## Required Vercel environment variable

| Variable | Scope | Description |
|----------|-------|-------------|
| `LEONIX_PREVIEW_BYPASS_TOKEN` | Server only (Production) | Long random secret used to validate unlock requests. **Never** commit this value. |

If this variable is **missing**, unlock requests fail closed with **401 Unauthorized**.

Generate a strong token (e.g. 32+ random bytes) and add it in Vercel → Project → Settings → Environment Variables for **Production** only.

## How the owner unlocks production preview

1. Deploy with `LEONIX_PREVIEW_BYPASS_TOKEN` set in Vercel.
2. Visit once (replace `YOUR_SECRET_TOKEN` with the env value):

   ```
   https://leonixmedia.com/api/preview/unlock?token=YOUR_SECRET_TOKEN
   ```

3. Optional safe redirect after unlock (internal paths only):

   ```
   https://leonixmedia.com/api/preview/unlock?token=YOUR_SECRET_TOKEN&next=/clasificados
   ```

4. The browser receives `leonix_preview_access=1` and is redirected to `/` (or `next`).

## How the owner locks production preview again

Visit:

```
https://leonixmedia.com/api/preview/lock
```

This clears the preview cookie and redirects to `/`. You will see Coming Soon again on locked public routes until you unlock again.

## Why this is better than relying only on Google / session cookies

- **Independent of Supabase auth** — owner QA does not require logging in as staff or maintaining a Google session.
- **Persistent across tabs** — one unlock applies site-wide via a domain cookie, not per-tab session state.
- **Explicit opt-in** — only someone with the server-side secret can set the cookie; there is no public UI to trigger it.
- **Revocable** — `/api/preview/lock` clears access without changing global launch settings.

## Cookie behavior

| Attribute | Value |
|-----------|-------|
| Name | `leonix_preview_access` |
| Value | `1` |
| Path | `/` |
| Max-Age | 30 days |
| HttpOnly | `true` |
| Secure | `true` in production |
| SameSite | `Lax` |

Because the cookie uses `path=/`, it is sent on every request to the domain, so new tabs and deep links work immediately after unlock.

## Security notes

- Token is validated **server-side only** in `/api/preview/unlock`.
- Invalid or missing tokens return **401**; missing env var also returns **401**.
- The `next` redirect parameter only accepts paths starting with `/` (no external URLs).
- Do not share the unlock URL in public channels; treat the token like a password.
- Rotate `LEONIX_PREVIEW_BYPASS_TOKEN` in Vercel if it may have been exposed.

## QA URLs (after unlock)

With the preview cookie set, verify these load instead of Coming Soon:

- https://leonixmedia.com/
- https://leonixmedia.com/clasificados
- https://leonixmedia.com/clasificados/servicios
- https://leonixmedia.com/admin
- https://leonixmedia.com/admin/workspace/clasificados
- https://leonixmedia.com/admin/workspace/clasificados/servicios

Without the cookie (or after `/api/preview/lock`), public routes such as `/` and `/clasificados` should redirect to Coming Soon while `/admin` remains reachable via normal admin auth.

## Verification

```bash
npm run verify:production-preview-bypass
```
