# Review Mobile Moderation Truth Audit (ADMIN-REVIEW-MOBILE-MODERATION-TRUTH-03)

## 1. Files inspected

- `app/admin/(dashboard)/workspace/clasificados/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/AdminListingsTable.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminQueueRowActionsPanel.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/ClassifiedAdminRowActions.tsx`
- `app/admin/(dashboard)/workspace/clasificados/_components/AdminListingReviewSnapshot.tsx`
- `app/admin/(dashboard)/workspace/clasificados/listings/[id]/edit/page.tsx`
- `app/admin/_lib/adminDashboardData.ts`
- `app/admin/_lib/adminReviewFlagTruth.ts`
- `app/admin/_lib/adminReviewFlagContext.ts`
- `supabase/migrations/20250312000001_listing_reports.sql`
- `supabase/migrations/20260410210000_empleos_public_listings.sql`
- `supabase/migrations/20260410180000_viajes_staged_listings.sql`

## 2. Current flag source diagnosis

| Source | Exists for generic `listings`? |
|--------|----------------------------------|
| `listings.status = flagged` | Yes — primary signal today |
| `listing_reports` | Yes — separate table, joined at queue load |
| `moderation_reason` / AI columns | No on generic listings |
| Manual admin flag field | No dedicated field on generic listings |
| Empleos / Viajes moderation fields | Yes on vertical tables only |

## 3. Why flagged rows show no true reason

Generic listings only store `status = flagged`. There is no `moderation_reason` column on `public.listings`. Owner-created ads can be flagged by staff status changes, imports, or legacy workflows without persisting a reason string.

## 4. AI moderation infrastructure

| Component | Found? |
|-----------|--------|
| OpenAI / AI provider config | Partial — Ofertas Locales scan jobs only (`oferta_local_ai_scan_items`) |
| Generic listing AI moderation API | **Not found** |
| Generic listing moderation storage | **Not found** |
| Run moderation admin action | **Not found** for generic listings |
| Scheduled moderation job | **Not found** for generic listings |

**Verdict:** Display wired to existing stored data only. No fake AI.

**Next gate:** `ADMIN-AI-MODERATION-ENGINE-01` — moderation storage, AI review API, run-on-create/update, admin “Run AI review”, reason/category/confidence storage, queue display, human review required, no auto-delete.

## 5. New flag source labels

- **AI** — only when `moderation_source` or reason proves AI
- **Report** — `listing_reports` reason present
- **Manual** — empleos/viajes/servicios stored moderation notes
- **Status** — `status=flagged|pending` without stored reason
- **Legacy** — review state with no provable source
- **Unknown** — no reliable source when not in review

## 6. Mobile action collapse architecture

Mobile cards (`layout=card`):

- Always visible: checkbox + listing summary + flag truth + Edit listing + View public
- Collapsed `<details>`: **Seller** (profile + copy/email when available), Lifecycle, Monetization & trust, Danger
- Desktop table (`layout=compact`): expanded groups preserved

## 7. Actions preserved

Republish, Restore/Suspend, Archive, Feature, Verify Leonix, soft Delete, seller profile, contact helpers — all preserved.

## 8. Bulk cleanup preserved

Row/mobile checkboxes, select all visible, selected count, bulk bar, soft delete, protected permanent delete, action proof banners — unchanged.

## 9–10. Desktop / mobile result

- Desktop: table columns + expanded action groups unchanged
- Mobile: shorter default cards, 44px tappable summaries, `overflow-x-hidden`

## 10. Future AI moderation engine

See section 4 — defer to `ADMIN-AI-MODERATION-ENGINE-01`.

## 11. TRUE/FALSE audit

All flags expected true after verify + build pass.
