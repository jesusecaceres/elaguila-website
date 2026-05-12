/**
 * DASHBOARD DATA CONTRACT (audit summary — Phase 1)
 *
 * Supabase (authenticated RLS):
 * - `profiles`: display_name, email, phone, home_city, membership_tier, account_type,
 *   owned_city_slug, newsletter_opt_in, is_disabled, created_at (see admin ADMIN_PROFILE_LIST_SELECT).
 * - `listings`: core clasificados rows per owner_id; optional columns tier-loaded in ownerListingsQuery.
 * - `listing_analytics` (optional in live Supabase): event_type ∈ listing_view | listing_save | listing_share | message_sent | profile_view | listing_open — dashboard shows zeros + one degraded notice when missing
 * - `messages`: sender_id, receiver_id, listing_id, message, created_at; optional read_at (migration) for unread
 * - `saved_listings` (live): per-user saved listing keys for Guardados (do not point dashboard queries at deprecated saved-table names from older drafts)
 * - Recently viewed: separate surface / local where applicable
 *
 * Not present in schema (placeholders / localStorage only):
 * - Dedicated `notifications` feed table — UI uses localStorage prefs + sample copy
 * - Stripe Customer Portal route — billing CTA documents required API
 * - Category-specific drafts in localStorage / separate tables — server drafts = listings where draft/unpublished
 *
 * Mux: only surfaced via listing row fields (e.g. mux_asset_id) on detail routes — not a dashboard dependency.
 */

export const DASHBOARD_DATA_CONTRACT_VERSION = 1;
