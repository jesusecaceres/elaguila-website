# Admin Sales Rep Access Model

**Gate ADMIN-ROLES-SALES — limited sales rep Admin access before final monetization QA**

## 1. Owner/admin full visibility

Users with roster role `super_admin` (normalized `owner_admin`) or cookie-only admins without a scoped roster row keep **full** Admin access: all promo codes, package entitlements, sales tracker reps, payment tracker, team, CMS, and site settings (subject to existing optional `ADMIN_ENFORCE_ROSTER_PERMISSIONS` checks on mutations).

## 2. Sales rep limited access

Roster role `sales_rep` (normalized `sales_rep`) gets a **limited** Admin shell:

- Dashboard home shows only monetization shortcuts (promo codes, package entitlements, sales tracker).
- Workspace nav shows only those three monetization pages.
- Global sidebar hides team, settings, activity log, clasificados ops, tienda, users, and payment tracker.
- Direct URLs to other workspace routes redirect to promo codes with `access_denied=1` (via `x-admin-pathname` middleware header + workspace layout guard).

## 3. Own records only

Sales reps see and manage only rows where:

- **Promo codes:** `leonix_promo_codes.sales_rep_id` equals their resolved rep id.
- **Package entitlements:** `metadata.sales_rep_id` equals their resolved rep id.

List UIs filter in memory after fetch; mutations call `assertCanManagePromoCode` / `assertCanManageEntitlement` before revoke, extend, or attach.

## 4. Sales rep ID auto-assignment

When `ADMIN_OPERATOR_EMAIL` matches an active `admin_team_members` row with role `sales_rep`:

- `sales_rep_id` defaults to the roster row **uuid** (stable internal id).
- `sales_rep_name` defaults to `display_name` or email local-part.
- Create forms hide manual rep fields and submit hidden values; server actions use `resolveSalesRepFieldsForCreate` so reps cannot impersonate another rep.

**Gap:** Shared-password login does not yet bind a unique operator per browser session without `ADMIN_OPERATOR_EMAIL` + roster row. Multi-rep environments must set env + roster per deployment or move to per-user Auth.

## 5. Owner override

Owner/admin (`super_admin` / default cookie admin) can still set `sales_rep_id` and `sales_rep_name` manually on create forms and view all reps in the sales tracker.

## 6. Sales manager

Roster role `sales_manager` maps to normalized `sales_manager`: **all** sales records (same as owner for monetization lists), but **no** payment tracker (owner-only).

## 7. Payment tracker owner-only

`/admin/workspace/payment-tracker` calls `requirePaymentTrackerAccess` — only `owner_admin`. Sales reps and sales managers are redirected to `/admin?access_denied=payment_tracker`.

## 8. Blocked for sales reps

- Other reps’ promo codes and entitlements
- Global payment tracker and owner revenue totals
- Admin team / user management (`/admin/team` guarded)
- Site settings and CMS workspace sections (nav hidden + workspace layout guard)
- Activity log (nav hidden)
- Commission payout / payroll (not implemented)
- Stripe Checkout / payment collection (not in this gate)

## 9. Role mapping (existing roster → normalized)

| `admin_team_members.role` | Normalized access   |
|---------------------------|---------------------|
| `super_admin`             | `owner_admin`       |
| `sales_manager`           | `sales_manager`     |
| `sales_rep`               | `sales_rep`         |
| `billing_support`         | `admin_manager`     |
| `content_manager`         | `content_admin`     |
| `support_agent`           | `support_admin`     |
| Other / unknown           | `owner_admin` (legacy full access) |

Preferred future names (`owner_admin`, `admin_manager`, …) are documented here; roster storage continues to use the table above to avoid duplicate enums.

## 10. Explicitly later

- Stripe Checkout activation (global)
- Payment collection and commission payout
- Public redemption and public ranking changes
- Per-session Supabase Auth binding for sales reps without env email

## 11. Code

- `app/admin/_lib/adminAccessControl.ts`
- Workspace layout guard: `app/admin/(dashboard)/workspace/layout.tsx`
- Middleware pathname header: `middleware.ts`

## 12. Final QA

After this gate, run one full monetization QA sweep (Servicios, Restaurantes, admin promo/entitlement/sales flows).
