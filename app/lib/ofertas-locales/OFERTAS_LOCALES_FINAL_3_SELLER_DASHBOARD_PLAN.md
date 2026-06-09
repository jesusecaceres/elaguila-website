# Stack FINAL-3 — Seller Dashboard Status + Manage/Edit

## En Venta / Varios files inspected

| File | Pattern |
|------|---------|
| `app/(site)/dashboard/mis-anuncios/page.tsx` | Multi-category owner inventory, status chips, manage links |
| `app/(site)/dashboard/mis-anuncios/[id]/page.tsx` | Per-listing manage workspace, auth redirect |
| `app/(site)/clasificados/en-venta/dashboard/EnVentaListingManageCard.tsx` | Status display, edit href, no self-publish |
| `app/(site)/dashboard/components/LeonixDashboardShell.tsx` | Auth shell, sidebar nav |

## Servicios files inspected

| File | Pattern |
|------|---------|
| `app/(site)/dashboard/servicios/page.tsx` | Bearer token + `/api/.../my-listings`, empty state, no fake metrics |
| `app/api/clasificados/servicios/my-listings/route.ts` | `getUser(token)` + owner-scoped server query |

## Empleos (tertiary — dedicated dashboard page)

| File | Pattern |
|------|---------|
| `app/(site)/dashboard/empleos/page.tsx` | Login redirect, owner `.eq(owner_user_id)`, empty + publish CTA |
| `app/(site)/dashboard/empleos/[listingId]/page.tsx` | Manage detail, ownership via API |

## Recommended routes

| Route | Purpose |
|-------|---------|
| `/dashboard/ofertas-locales` | Owner list |
| `/dashboard/ofertas-locales/[id]` | Manage/detail + safe edit |
| `/api/ofertas-locales/owner` | GET list (Bearer auth) |
| `/api/ofertas-locales/owner/[id]` | GET detail + PATCH resubmit |

## Owner list fields

business_name, title, offer_type, business_category, city, zip_code, submitted_at, valid_from/until, status, asset count, AI intent, featured intent, safe rejection hint, View/manage link

## Owner detail fields

Full business/offer/contact/location, assets (read-only), socials from metadata, membership/coupon, AI/featured intent, timestamps, status messaging

## Safe edit rules by status

| Status | Edit |
|--------|------|
| `pending_review`, `submitted`, `draft` | Allowed → saves as `pending_review` |
| `rejected` | Edit and resubmit → `pending_review` |
| `approved` | Read-only + contact Leonix CTA |
| `archived`, `expired` | Read-only |

**Forbidden:** owner sets `approved`; mutates `owner_id`; reads raw admin-only notes

## Rejection note visibility

Only `[admin_review]` entries with `action: "reject"` and `note` field shown to owner. Otherwise generic rejection copy.

## DB compatibility

- `owner_id` + RLS SELECT for owner ✅
- RLS UPDATE only for draft/submitted/pending_review — owner PATCH uses service role + owner_id verify ✅
- No migration required

## Files to create

- `ofertasLocalesOwnerHelpers.ts`
- `ofertasLocalesOwnerUpdateMapper.ts`
- `app/api/ofertas-locales/owner/route.ts`
- `app/api/ofertas-locales/owner/[id]/route.ts`
- `app/(site)/dashboard/ofertas-locales/page.tsx`
- `app/(site)/dashboard/ofertas-locales/[id]/page.tsx`
- Owner dashboard/manage client components
- Audit script + doc

## What will NOT be built

Payment, analytics, SMS/email, route optimization, admin changes, fake metrics, self-approve, asset re-upload wizard (assets read-only on edit; text/contact resubmit only)

## Next stack

**FINAL-4** — Public Detail + Business Hub Lite Full Card
