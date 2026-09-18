/**
 * Paid-term enforcement ON READ for generic `listings` rows (2026-09 category closeout).
 *
 * `expires_at` is stamped at activation for paid Rentas (30d) and paid Clases (30d), but the
 * public generic detail route and the Clases/Comunidad browse query never looked at it, so an
 * expired paid row kept showing publicly. This is the one shared, PURE rule (same shape as
 * `isBrFsboRowWithinTerm`): it only ever hides rows of the enforced categories whose `expires_at`
 * is a real past instant. Null / missing / unparsable `expires_at` (legacy rows, free lanes,
 * En Venta, Busco, Comunidad, Mascotas) is always "within term" — nothing is hidden by guesswork.
 */
const ENFORCED_TERM_CATEGORIES: ReadonlySet<string> = new Set(["rentas", "clases"]);

export type EnforcedTermRowLike = { category?: string | null; expires_at?: string | null };

export function isListingRowWithinEnforcedTerm(row: EnforcedTermRowLike, nowMs: number = Date.now()): boolean {
  if (!ENFORCED_TERM_CATEGORIES.has(String(row.category ?? "").trim().toLowerCase())) return true;
  const raw = row.expires_at;
  if (typeof raw !== "string" || !raw.trim()) return true;
  const ms = new Date(raw).getTime();
  if (!Number.isFinite(ms)) return true;
  return ms > nowMs;
}
