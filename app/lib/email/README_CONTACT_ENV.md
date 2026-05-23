# Contact form email (Resend)

Both `/contacto` and `/tienda/contacto` POST to API routes that send via [Resend](https://resend.com).

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
| `POST /api/contact` | `info@leonixmedia.com` |
| `POST /api/tienda/contact` | `tienda@leonixmedia.com` |

## Supabase

Contact forms do **not** use Supabase. Email only.

## Vercel setup

1. Add Resend integration or set `RESEND_API_KEY` in Project → Settings → Environment Variables.
2. Verify `leonixmedia.com` in Resend Domains.
3. Optionally set `LEONIX_RESEND_FROM`.
4. Redeploy after env changes.
