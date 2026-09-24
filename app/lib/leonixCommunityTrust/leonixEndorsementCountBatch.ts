/**
 * Bulk Community Trust counts from the one canonical vote table.
 * Same source the Servicios result cards already use — never a second engine.
 */

import type { LeonixEndorsementTargetType } from "./leonixEndorsementRegistry";

export function aggregateEndorsementCounts(
  rows: ReadonlyArray<{ target_id?: string | null }>,
  requestedIds: readonly string[],
): Map<string, number> {
  const keys = [...new Set(requestedIds.map((k) => k.trim()).filter(Boolean))];
  const out = new Map<string, number>();
  for (const k of keys) out.set(k, 0);
  for (const row of rows) {
    const tid = String(row.target_id ?? "").trim();
    if (tid && out.has(tid)) out.set(tid, (out.get(tid) ?? 0) + 1);
  }
  return out;
}

export const LEONIX_ENDORSEMENT_VOTES_TABLE = "leonix_endorsement_votes" as const;

export type EndorsementCountQuery = {
  table: typeof LEONIX_ENDORSEMENT_VOTES_TABLE;
  targetType: LeonixEndorsementTargetType;
  select: "target_id";
};

export function endorsementCountQuery(targetType: LeonixEndorsementTargetType): EndorsementCountQuery {
  return {
    table: LEONIX_ENDORSEMENT_VOTES_TABLE,
    targetType,
    select: "target_id",
  };
}
