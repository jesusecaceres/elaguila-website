# Admin AI Moderation Engine (ADMIN-AI-MODERATION-ENGINE-01)

Leonix admin can run **real** server-side AI moderation on generic `public.listings` rows. Results are stored in Supabase and shown in the review queue and listing edit snapshot. **Human admin review remains the final decision.**

## What AI reviews

For each listing, the engine loads:

- Title, description/body
- Category, price, free flag
- City, zip, status
- Seller/contact fields (`contact_email`, `contact_phone`, `business_name`, `seller_type`)
- Owner profile email (when available)
- Image URLs and count (when `images` column exists)

The model evaluates scam patterns, prohibited/unsafe content, suspicious pricing, missing critical info, unsafe off-platform contact, spam/duplicate signals, and policy-review edge cases.

## Decisions

| Decision | Meaning |
|----------|---------|
| `approved` | Content appears legitimate and policy-safe for a local classifieds marketplace. |
| `needs_review` | Uncertain or borderline — human judgment required. |
| `rejected` | Clear scam, prohibited item, or severe policy violation (still **no auto-delete**). |
| `unavailable` | Provider/env missing, listing not found, or API/parse error. Stored for audit; not treated as AI proof. |

## Reason categories

`safe`, `spam`, `scam`, `prohibited_item`, `suspicious_price`, `duplicate`, `missing_info`, `unsafe_contact`, `policy_review`, `other`

## Confidence

`low` | `medium` | `high` — stored as text; never fabricated when no review ran.

## Storage

Table: `public.listing_moderation_reviews`  
Migration: `supabase/migrations/20260625180000_listing_moderation_reviews.sql`

Append-style rows (latest per `listing_id` shown in admin UI). RLS enabled; admin reads/writes via service role (`getAdminSupabase`).

## No auto-delete policy

AI review **does not**:

- Delete or archive listings
- Hide/unpublish listings
- Clear flags or change `status`
- Contact sellers automatically

Admins use existing queue actions after reading AI + report + status truth.

## Human review requirement

AI output is one source in the flag-truth model (alongside user reports, manual notes, and status-only flags). Final approve/remove/publish decisions stay with staff.

## Environment variables (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Yes (for live AI) | Server-only. Never `NEXT_PUBLIC_*`. |
| `OPENAI_MODERATION_MODEL` | No | Default `gpt-4o-mini`. |

If `OPENAI_API_KEY` is missing, **Run AI review** stores `decision: unavailable` with message `AI review unavailable: missing provider configuration (OPENAI_API_KEY).` Queue keeps honest status-only fallback until a successful AI row exists.

After adding env vars in Vercel → **redeploy** production/preview.

Also required (existing): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for admin DB access.

## Admin actions

- **Run AI review** — per listing (queue card + edit snapshot) → `POST /api/admin/clasificados/listings/[id]/ai-review`
- **Run AI review on selected** — bulk, max 15 visible selected rows → `POST /api/admin/clasificados/listings/ai-review/bulk`

Action proof examples:

- `AI review completed: needs_review — suspicious_price: …`
- `AI review unavailable: missing provider configuration (OPENAI_API_KEY).`
- `AI review unavailable: listing content not found.`

## Old status-only flags

Listings flagged before this gate show:

> Flagged by status. No AI or report reason is stored for this listing.

No automatic backfill on deploy. Staff runs **Run AI review** manually (single or bulk selected).

## How to test

1. Apply migration to Supabase (or confirm table exists).
2. Set `OPENAI_API_KEY` locally in `.env.local` (not committed).
3. `npm run verify:admin-ai-moderation-engine`
4. `npm run build`
5. Admin cookie session → open flagged queue, run AI on one listing, confirm badge/reason/confidence/reviewed date.
6. Open listing edit → review snapshot shows same AI row + listing content reviewed.

## QA URLs

- Flagged queue: `/admin/workspace/clasificados?status=flagged#queue`
- Example search: `/admin/workspace/clasificados?q=SALE-2026-000081#queue`
- Admin dashboard: `/admin`
- Listing edit: `/admin/workspace/clasificados/listings/[id]/edit`

## Key files

- `app/admin/_lib/listingAiModerationEngine.ts` — server-only OpenAI JSON moderation
- `app/admin/_lib/listingAiModerationService.ts` — load listing, run AI, persist
- `app/admin/_lib/listingModerationReviewsDb.ts` — fetch/insert reviews
- `app/admin/_lib/adminReviewFlagTruth.ts` — honest source priority (report → stored AI → legacy → status)
- `app/admin/(dashboard)/workspace/clasificados/_components/AdminListingFlagTruthBlock.tsx` — queue display
- `scripts/verify-admin-ai-moderation-engine.mjs` — gate verifier
