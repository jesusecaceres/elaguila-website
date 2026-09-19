/**
 * Restaurantes - first-save duplicate reconciliation (closeout 2, NO schema change).
 *
 * `restaurantes_public_listings.draft_listing_id` has no unique index (Comida Local does), so two concurrent
 * first saves of the same draft can both INSERT. The publish route already addresses the OLDEST row by
 * primary key on every later edit; this module makes the two racing inserts converge on that same row:
 * after a fresh insert, the route re-reads every row for the draft, and if its own row is not the oldest by
 * (`published_at`, `id`) it archives ITS row (status `archived` is allowed by the status check) and returns
 * the winner's identity - so at most one row is ever live / payable and the client always checks out
 * against the same UUID / Leonix Ad ID.
 *
 * The ordering is a pure total order over data both requests wrote, so every participant computes the same
 * winner regardless of commit order. PURE - zero I/O.
 */

export type RestauranteDraftRowLite = {
  id: string;
  slug?: string | null;
  leonix_ad_id?: string | null;
  status?: string | null;
  published_at?: string | null;
  owner_user_id?: string | null;
};

function publishedMs(row: RestauranteDraftRowLite): number {
  const ms = row.published_at ? new Date(row.published_at).getTime() : NaN;
  // Null / unparsable sorts LAST, exactly like `.order("published_at", { ascending: true, nullsFirst: false })`.
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

/** Oldest first by (published_at, id) - the SAME order the route's lookup uses to pick the canonical row. */
export function orderRestauranteDraftRows<T extends RestauranteDraftRowLite>(rows: readonly T[]): T[] {
  return [...rows].sort((a, b) => {
    const pa = publishedMs(a);
    const pb = publishedMs(b);
    if (pa !== pb) return pa < pb ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export type RestauranteFirstSaveReconciliation<T extends RestauranteDraftRowLite> =
  | { role: "winner"; winner: T }
  | { role: "loser"; winner: T }
  | { role: "absent"; winner: null };

/** Decides whether `ownId` (the row this request just inserted) is the canonical row for the draft. */
export function reconcileRestauranteFirstSave<T extends RestauranteDraftRowLite>(
  rows: readonly T[],
  ownId: string,
): RestauranteFirstSaveReconciliation<T> {
  const ordered = orderRestauranteDraftRows(rows);
  if (!ordered.some((r) => r.id === ownId)) return { role: "absent", winner: null };
  const winner = ordered[0];
  return winner.id === ownId ? { role: "winner", winner } : { role: "loser", winner };
}
