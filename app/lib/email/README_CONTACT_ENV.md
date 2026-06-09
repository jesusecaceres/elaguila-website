# Contact form email (Resend)

`/contacto` submits to `POST /api/leads` (Supabase `leonix_leads` save first, then Resend). `POST /api/contact` is an alias. `/tienda/contacto` uses its own API route.

## Required (production)

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key (Vercel Resend integration sets this automatically) |

## Optional (recommended)

| Variable | Purpose |
|----------|---------|
| `LEONIX_RESEND_FROM` | Verified sender, e.g. `Leonix Media <noreply@leonixmedia.com>` |
| `TIENDA_ORDER_EMAIL_FROM` | Alternate From address (Tienda orders + contact) |

If neither From variable is set but `RESEND_API_KEY` exists, the app uses:

`Leonix Media <noreply@leonixmedia.com>`

**The domain must be verified in Resend** or sends return `503` with `EMAIL_UNAVAILABLE`.

## Recipients (hardcoded — not env)

| Route | Recipient |
|-------|-----------|
| `POST /api/leads` (and `/api/contact` alias) | `info@leonixmedia.com` |
| `POST /api/tienda/contact` | `tienda@leonixmedia.com` |

## Supabase

`POST /api/leads` saves to `public.leonix_leads` when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.

Launch signups use `public.leonix_newsletter_subscribers` via `POST /api/newsletter/subscribe`.

## Vercel setup

1. Add Resend integration or set `RESEND_API_KEY` in Project → Settings → Environment Variables.
2. Verify `leonixmedia.com` in Resend Domains.
3. Optionally set `LEONIX_RESEND_FROM`.
4. Redeploy after env changes.
