/**
 * LEONIX IX REWARDS — how a posted ledger row is read back.
 *
 * `leonix_rewards_post_entry` RETURNS the ledger row, and on an idempotency-key replay that is the
 * ORIGINAL row: a different wallet, a different entry type, a different amount, written by someone
 * else, possibly long ago. What the caller learns from that row is not a formatting detail — it is
 * the input to `postManualAdjustment`'s cross-wallet refusal and to every "nothing moved" report in
 * the audit log.
 *
 * This lives in its own module, outside `server-only`, so the verifier can CALL it with crafted
 * rows instead of grepping the adapter for reassuring substrings. The adapter and the test both
 * go through this one function, which is what makes their agreement mean something.
 */
import type { LedgerEntryRecord } from "@/app/lib/rewards/rewardsLedgerCore";

/** The row shape `leonix_rewards_post_entry` hands back through PostgREST. */
export type PostedLedgerRow = {
  id?: string;
  wallet_id?: string | null;
  entry_type?: string | null;
  amount_cents?: number | string | null;
  meta?: { post_nonce?: unknown } | null;
} | null;

export type PostedEntryRequest = {
  walletId: string;
  entryType: string;
  amountCents: number;
  idempotencyKey: string;
  /** This call's nonce, written into `meta` on the way in. */
  postNonce: string;
  /** The id a pre-read found for this idempotency key, when it found one. */
  priorEntryId?: string | null;
};

/**
 * Read the posted row, or say why it cannot be read.
 *
 * THE ROW WINS OVER THE REQUEST, ALWAYS. Echoing the request back is what made the cross-wallet
 * guard a tautology (`x !== x`) in production while the in-memory store — which returned the real
 * row — made the covering assertion pass. Staff reusing a correction code on a second customer got
 * `ok: true` with an amount, that customer's wallet never moved, and for a NEGATIVE adjustment the
 * clawback silently never happened.
 *
 * THE NONCE IS THE ONLY EXACT DEDUPE SIGNAL. The posting function short-circuits on
 * `idempotency_key` before it takes the wallet lock, so a pre-read loses the very race it exists to
 * detect. A returned nonce that is not this call's is proof that this call created nothing. Every
 * other signal here can only ADD deduplication, never remove it: reporting a dedupe as a creation
 * is the direction that puts a number in the audit log for money that never moved.
 */
export function readPostedEntry(
  request: PostedEntryRequest,
  row: PostedLedgerRow,
): { ok: true; entry: LedgerEntryRecord } | { ok: false; error: string } {
  if (!row?.id) return { ok: false, error: "post_entry_returned_no_row" };

  const walletId = row.wallet_id ? String(row.wallet_id) : request.walletId;
  const entryType = row.entry_type ? String(row.entry_type) : request.entryType;
  const amountCents = Number.isFinite(Number(row.amount_cents))
    ? Math.floor(Number(row.amount_cents))
    : Math.floor(request.amountCents);

  const returnedNonce =
    row.meta && typeof row.meta === "object" ? (row.meta as { post_nonce?: unknown }).post_nonce : undefined;
  const nonceSaysCreated = typeof returnedNonce === "string" && returnedNonce === request.postNonce;

  // A row that disagrees with what was ASKED for is a replay of a different movement, detectable
  // even on a database whose rows predate the nonce.
  const disagreesWithRequest =
    walletId !== request.walletId ||
    entryType !== request.entryType ||
    amountCents !== Math.floor(request.amountCents);

  const deduplicated = nonceSaysCreated
    ? false
    : typeof returnedNonce === "string" || Boolean(request.priorEntryId) || disagreesWithRequest;

  return {
    ok: true,
    entry: {
      id: String(row.id),
      walletId,
      entryType,
      amountCents,
      idempotencyKey: request.idempotencyKey,
      deduplicated,
    },
  };
}
