# Admin AI Moderation Engine (ADMIN-AI-MODERATION-ENGINE-01 + POLICY-02)

Leonix admin can run **real** server-side AI moderation on generic `public.listings` rows. Results are stored in Supabase and shown in the review queue and listing edit snapshot. **Human admin review remains the final decision.**

## Policy Brain v2 (Leonix Safety & Trust)

**Policy version:** `2.0.0` (`LEONIX_MODERATION_POLICY_VERSION`)  
**Prompt version:** `2.0.0` (`LEONIX_MODERATION_PROMPT_VERSION`)

Before OpenAI runs, a **deterministic keyword/risk scanner** inspects listing content and produces:

- `riskLevel`: `low` | `medium` | `high` | `critical`
- `policyFlags`, `keywordFlags`, `categoryRules`
- `recommendedAction` (advisory only)
- `scannerSummary`

The AI prompt includes scanner findings + category policy notes. If scanner risk is **critical** but AI says **approved**, the engine escalates to **needs_review** and records the conflict in `raw_result`.

### Category-specific rules

Rules exist for: En Venta, Autos, Servicios, Empleos, Rentas, Bienes Raíces, Restaurantes, Comunidad, Viajes.

See `app/admin/_lib/listingModerationPolicy.ts`.

### Expanded reason categories

`safe`, `spam`, `scam`, `adult_or_sexual`, `weapons`, `drugs_or_controlled_substances`, `counterfeit_or_stolen`, `fraud_or_payment_scam`, `fake_business_claim`, `unsafe_service`, `fake_job`, `rental_scam`, `prohibited_item`, `suspicious_price`, `duplicate_listing`, `low_quality_or_missing_info`, `unsafe_contact`, `off_platform_risk`, `misleading_claim`, `policy_review`, `other`

(v1 rows may still show legacy values like `duplicate`, `missing_info`.)

### Recommended admin actions (advisory only)

| Action | Admin meaning |
|--------|----------------|
| `approve` | Looks safe — admin may clear/review. |
| `review_manually` | Review manually before approving. |
| `contact_seller` | Contact seller for verification. |
| `request_more_info` | Ask seller for more information. |
| `edit_listing` | Edit listing before approving. |
| `archive` | Archive if seller cannot verify. |
| `remove_listing` | Remove listing if policy violation is confirmed. |

AI **never** executes these actions automatically.

## What AI reviews

For each listing, the engine loads:

- Title, description/body
- Category, price, free flag
- City, zip, status
- Seller/contact fields (`contact_email`, `contact_phone`, `business_name`, `seller_type`)
- Owner profile email (when available)
- Image URLs and count (when `images` column exists)

## Decisions

| Decision | Meaning |
|----------|---------|
| `approved` | Content appears legitimate and policy-safe for a local classifieds marketplace. |
| `needs_review` | Uncertain or borderline — human judgment required. |
| `rejected` | Clear scam, prohibited item, or severe policy violation (still **no auto-delete**). |
| `unavailable` | Provider/env missing, listing not found, or API/parse error. Stored for audit; not treated as AI proof. |

## Confidence

`low` | `medium` | `high` — stored as text; never fabricated when no review ran.

## Storage

Table: `public.listing_moderation_reviews`  
Migrations:

- `supabase/migrations/20260625180000_listing_moderation_reviews.sql` (v1 table)
- `supabase/migrations/20260612193000_listing_moderation_policy_upgrade.sql` (policy columns)

Policy columns: `risk_level`, `recommended_action`, `policy_flags`, `keyword_flags`, `category_rules`, `scanner_result`, `policy_version`, `prompt_version`

Append-style rows (latest per `listing_id` shown in admin UI). RLS enabled; admin reads/writes via service role (`getAdminSupabase`).

## No auto-delete / no auto-clear-flag policy

AI review **does not**:

- Delete or archive listings
- Hide/unpublish listings
- Clear flags or change `status`
- Contact sellers automatically
- Auto-reject without human/admin action

Admins use existing queue actions after reading AI + report + status truth.

> AI review stores a recommendation and reason only. It does not automatically remove, approve, or clear this listing.

## Human review requirement

AI output is one source in the flag-truth model (alongside user reports, manual notes, and status-only flags). Final approve/remove/publish decisions stay with staff.

## Environment variables (Vercel)

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Yes (for live AI) | Server-only. Never `NEXT_PUBLIC_*`. |
| `OPENAI_MODERATION_MODEL` | No | Default `gpt-4o-mini`. |

### High-power model guidance

- **`gpt-4o-mini`** — acceptable for low-cost testing and dev.
- **Stronger models** (e.g. `gpt-4o`, `gpt-4.1`) — recommended for production moderation when cost allows; set via `OPENAI_MODERATION_MODEL`.
- The model used is stored on each review row and shown in admin UI.

If `OPENAI_API_KEY` is missing, **Run AI review** stores `decision: unavailable` with message `AI review unavailable: missing provider configuration (OPENAI_API_KEY).` Queue keeps honest status-only fallback until a successful AI row exists.

After adding env vars in Vercel → **redeploy** production/preview.

Also required (existing): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` for admin DB access.

## Admin actions

- **Run AI review** — per listing (queue card + edit snapshot) → `POST /api/admin/clasificados/listings/[id]/ai-review`
- **Run AI review on selected** — bulk, max 15 visible selected rows → `POST /api/admin/clasificados/listings/ai-review/bulk`

Action proof examples:

- `AI review completed: needs_review — suspicious_price [high risk]: …`
- `AI review unavailable: missing provider configuration (OPENAI_API_KEY).`

## Old status-only flags

Listings flagged before AI review show:

> Flagged by status. No AI or report reason is stored for this listing.

No automatic backfill on deploy. Staff runs **Run AI review** manually (single or bulk selected).

## Current ads QA steps (safe manual testing)

### A. Single listing test (recommended first)

1. Apply both migrations to Supabase.
2. Set `OPENAI_API_KEY` (+ optional `OPENAI_MODERATION_MODEL`) in Vercel/local.
3. Open flagged queue: `/admin/workspace/clasificados?status=flagged#queue`
   - Or search: `/admin/workspace/clasificados?q=SALE-2026-000081#queue`
4. Click **Run AI review** on one listing.
5. Confirm queue card shows: decision, risk level, category, reason, confidence, recommended action, reviewed_at, model (if set).
6. Confirm listing **status/flag is NOT cleared**, **NOT deleted**, **NOT archived**.
7. Open edit page → review snapshot shows same AI row + scanner/policy details.

### B. Limited bulk selected test

1. Filter/search queue first.
2. Select **only 2 rows** (max 15 supported).
3. Click **Run AI review on selected**.
4. Confirm results store per listing; no auto-clear/delete/archive.

### C. Verification commands

```bash
npm run verify:admin-ai-moderation-policy
npm run verify:admin-ai-moderation-engine
npm run build
```

## QA URLs

- Flagged queue: `/admin/workspace/clasificados?status=flagged#queue`
- Example search: `/admin/workspace/clasificados?q=SALE-2026-000081#queue`
- Admin dashboard: `/admin`
- Listing edit: `/admin/workspace/clasificados/listings/[id]/edit`

## Key files

- `app/admin/_lib/listingModerationPolicy.ts` — Leonix Safety & Trust policy brain + scanner
- `app/admin/_lib/listingAiModerationEngine.ts` — server-only OpenAI JSON moderation
- `app/admin/_lib/listingAiModerationService.ts` — load listing, run AI, persist
- `app/admin/_lib/listingModerationReviewsDb.ts` — fetch/insert reviews
- `app/admin/_lib/listingModerationDisplay.ts` — admin-friendly action/risk labels
- `app/admin/_lib/adminReviewFlagTruth.ts` — honest source priority
- `app/admin/(dashboard)/workspace/clasificados/_components/AdminAiReviewSummary.tsx` — compact AI display
- `scripts/verify-admin-ai-moderation-policy.mjs` — policy gate verifier
- `scripts/verify-admin-ai-moderation-engine.mjs` — engine gate verifier
