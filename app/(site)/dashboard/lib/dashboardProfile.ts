/**
 * Shared profile read shape for dashboard pages — single source for safe column lists.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Columns known from admin tooling + migrations; narrow select avoids 42703 on older DBs. */
export const PROFILE_SELECT_MINIMAL = "display_name, email, membership_tier";

/**
 * Gate I.5.5 — corrected `disabled` → `is_disabled`: the production `profiles` table has no
 * `disabled` column (confirmed via live read-only check), only `is_disabled` — the same column
 * name already used correctly everywhere in admin tooling (`adminProfilesQuery.ts`,
 * `admin/actions.ts`, `admin/(dashboard)/usuarios/*`). With the old name, every call guaranteed
 * two failed round trips (EXTENDED then MEDIUM) before falling back to MINIMAL, and the field was
 * never actually available to any caller — no owner-dashboard page currently reads it.
 */
export const PROFILE_SELECT_EXTENDED =
  "display_name, email, phone, home_city, membership_tier, account_type, owned_city_slug, newsletter_opt_in, is_disabled, created_at";

export type DashboardProfileRow = {
  display_name: string | null;
  email: string | null;
  phone: string | null;
  home_city: string | null;
  membership_tier: string | null;
  account_type: string | null;
  owned_city_slug: string | null;
  newsletter_opt_in: boolean | null;
  is_disabled: boolean | null;
  created_at: string | null;
};

const PROFILE_SELECT_MEDIUM =
  "display_name, email, phone, home_city, membership_tier, account_type, owned_city_slug, is_disabled, created_at";

export async function fetchDashboardProfile(
  sb: SupabaseClient,
  userId: string
): Promise<{ row: Partial<DashboardProfileRow> | null; usedExtended: boolean }> {
  const tiers = [PROFILE_SELECT_EXTENDED, PROFILE_SELECT_MEDIUM, PROFILE_SELECT_MINIMAL];
  for (const sel of tiers) {
    const res = await sb.from("profiles").select(sel).eq("id", userId).maybeSingle();
    if (!res.error && res.data) {
      return { row: res.data as Partial<DashboardProfileRow>, usedExtended: sel === PROFILE_SELECT_EXTENDED };
    }
  }
  return { row: null, usedExtended: false };
}
