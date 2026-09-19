/**
 * Filters-BEFORE-limit pager for Admin data paths (2026-09 closeout 2).
 *
 * PURE (no Supabase import): the caller supplies `fetchPage(from, to)` (an inclusive `.range()` window
 * over an ordered query) and an optional `accept` predicate for filters that cannot be expressed in
 * SQL (parent gates, search over derived text, detail-pair reads ...). Rows are scanned page by page
 * until `limit` ACCEPTED rows exist, the source is exhausted, or `maxScan` raw rows were read — so an
 * older matching row is not hidden behind a page of non-matching newer rows, and the requested limit
 * is applied AFTER filtering, never before.
 *
 * With no `accept`, exactly one window of `limit` rows is fetched (identical cost to `.limit(limit)`).
 */

export type AdminPagedScanResult<T> = {
  rows: T[];
  error: string | null;
  /** Raw rows read from the source (before `accept`). */
  scanned: number;
  /** True when the scan stopped at `maxScan` before finding `limit` rows and before exhausting the source. */
  capped: boolean;
};

export const ADMIN_PAGED_SCAN_DEFAULT_MAX = 3000;

export async function scanPagedRows<T>(opts: {
  limit: number;
  /** Rows per window; default `min(max(limit, 100), 500)`. */
  pageSize?: number;
  /** Hard cap on raw rows read; default 3000. */
  maxScan?: number;
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>;
  /** Keep-only predicate applied to each window; may be async (e.g. batched parent lookups). */
  accept?: (rows: T[]) => T[] | Promise<T[]>;
  /** Used to drop duplicates when offset windows overlap under concurrent writes. */
  getId?: (row: T) => string | null | undefined;
}): Promise<AdminPagedScanResult<T>> {
  const limit = Math.max(1, Math.floor(opts.limit));
  const pageSize = opts.accept
    ? Math.max(1, Math.floor(opts.pageSize ?? Math.min(Math.max(limit, 100), 500)))
    : limit;
  const maxScan = Math.max(pageSize, Math.floor(opts.maxScan ?? ADMIN_PAGED_SCAN_DEFAULT_MAX));

  const accepted: T[] = [];
  const seen = new Set<string>();
  let scanned = 0;
  let from = 0;
  let exhausted = false;

  while (accepted.length < limit && scanned < maxScan) {
    const res = await opts.fetchPage(from, from + pageSize - 1);
    if (res.error) return { rows: [], error: res.error.message, scanned, capped: false };
    const page = res.data ?? [];
    scanned += page.length;

    let fresh = page;
    if (opts.getId) {
      fresh = page.filter((r) => {
        const id = opts.getId!(r);
        if (!id) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    }

    let kept: T[];
    try {
      kept = opts.accept ? await opts.accept(fresh) : fresh;
    } catch (e) {
      return { rows: [], error: e instanceof Error ? e.message : String(e), scanned, capped: false };
    }
    for (const r of kept) accepted.push(r);

    if (page.length < pageSize) {
      exhausted = true;
      break;
    }
    from += pageSize;
  }

  const capped = !exhausted && accepted.length < limit && scanned >= maxScan;
  return { rows: accepted.slice(0, limit), error: null, scanned, capped };
}
