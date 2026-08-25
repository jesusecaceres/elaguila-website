-- Package 3 (owner lock 2026-08-25) — Viajes community-benefit truth column.
--
-- Server/admin-owned truth for the public "Leonix Community Benefit" badge. The provider's
-- benefit CLAIM lives inside listing_json.intake.communityBenefit (owner-writable via the
-- intake API); this COLUMN is the review verdict and is deliberately NOT part of listing_json
-- because owner revisions rewrite that envelope wholesale — an owner must never be able to
-- write 'approved'.
--
-- Write paths (all service-role via Next.js API; RLS grants no client write on this table):
--   * intake save        -> 'claimed' (benefit actually asserted) or 'none' (no claim);
--                           any owner intake save recomputes this, which fail-safes an
--                           already-'approved' benefit back to 'claimed' for re-review.
--   * admin moderation   -> 'claimed' -> 'approved' (the only path to 'approved').
--
-- Public rendering is fail-closed: badge only when status = 'approved'. Until this migration
-- is applied, the column is absent, code reads undefined, and no badge can ever render.
--
-- Additive only: no lifecycle-constraint change, no RLS change, no index (admin queue is a
-- bounded <=500-row select; no query filters on this column at SQL level).

alter table public.viajes_staged_listings
  add column if not exists community_benefit_status text not null default 'none'
    check (community_benefit_status in ('none', 'claimed', 'approved'));

comment on column public.viajes_staged_listings.community_benefit_status is
  'Package 3: admin-reviewed community-benefit truth (none|claimed|approved). Claim data lives in listing_json.intake.communityBenefit; only admin moderation may set approved. Public badge renders only on approved.';
