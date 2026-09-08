/**
 * Gate I.10A — Owner self-engagement guard (Like/Save only; Share is never gated).
 */

function normalize(id: string | null | undefined): string {
  return (id ?? "").trim().toLowerCase();
}

/**
 * True when the signed-in user is the listing owner — used to block Like/Save
 * on a listing the same user owns. Fails open (false) when either id is unknown,
 * since there's nothing to prove self-engagement against.
 */
export function isSelfEngagement(
  currentUserId: string | null | undefined,
  ownerUserId: string | null | undefined,
): boolean {
  const current = normalize(currentUserId);
  const owner = normalize(ownerUserId);
  if (!current || !owner) return false;
  return current === owner;
}
