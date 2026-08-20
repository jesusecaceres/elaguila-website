/**
 * Saved Search 02 — generic normalized contract shared by every category's Saved Search adapter.
 * Mirrors the storage columns proven in `20260817120000_saved_searches_v1_reconcile.sql`
 * (category, city, min_price, max_price, filter_payload) — nothing here invents a field the
 * database contract doesn't already have a home for.
 */

/** Category-agnostic normalized shape. `filterPayload` holds only fields this category's public
 * results filter actually uses to decide inclusion — never cosmetic UI state, pagination, or
 * sort order. */
export type SavedSearchNormalizedInput = {
  category: string;
  /** '' means "no city filter" — same truthful-empty-string convention as the DB column. */
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  filterPayload: Record<string, unknown>;
};

/** A `saved_searches` row as read back from the database (server-side shape; RLS-scoped to the
 * requesting owner). Mirrors `20260817120000_saved_searches_v1_reconcile.sql` exactly — no field
 * exists here that doesn't have a real column. */
export type SavedSearchRow = {
  id: string;
  category: string;
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  filterPayload: Record<string, unknown>;
  fingerprint: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
