/**
 * LEONIX IX REWARDS — production store adapter.
 *
 * The thin `server-only` edge of the ledger. It owns no policy and no orchestration: it builds a
 * `RewardsStorePort` over Supabase and hands it to `rewardsLedgerCore.ts`.
 *
 * Every credit movement goes through the `leonix_rewards_post_entry` RPC rather than direct table
 * writes, because that function is what makes a movement ATOMIC (ledger row + cached balances in
 * one statement), IDEMPOTENT (unique idempotency_key), and SAFE (bucket deltas derived in SQL from
 * the entry type, plus non-negative CHECK constraints). Writing the tables directly from here
 * would bypass all three.
 */
import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  reserveIdempotencyKey,
  type LedgerEntryInput,
  type RedemptionRecord,
  type RewardsStorePort,
  type WalletOwnerRef,
  type WalletSnapshot,
} from "./rewardsLedgerCore";

type WalletRow = {
  id: string;
  pending_cents: number;
  available_cents: number;
  reserved_cents: number;
  lifetime_earned_cents: number;
  lifetime_redeemed_cents: number;
  lifetime_reversed_cents: number;
  recovery_cents?: number | null;
  lifetime_recovery_accrued_cents?: number | null;
  lifetime_recovery_offset_cents?: number | null;
  lifetime_restored_cents?: number | null;
  bound_user_id?: string | null;
};

function toSnapshot(row: WalletRow): WalletSnapshot {
  return {
    id: String(row.id),
    pendingCents: Number(row.pending_cents ?? 0),
    availableCents: Number(row.available_cents ?? 0),
    reservedCents: Number(row.reserved_cents ?? 0),
    lifetimeEarnedCents: Number(row.lifetime_earned_cents ?? 0),
    lifetimeRedeemedCents: Number(row.lifetime_redeemed_cents ?? 0),
    lifetimeReversedCents: Number(row.lifetime_reversed_cents ?? 0),
    recoveryCents: Number(row.recovery_cents ?? 0),
    lifetimeRecoveryAccruedCents: Number(row.lifetime_recovery_accrued_cents ?? 0),
    lifetimeRecoveryOffsetCents: Number(row.lifetime_recovery_offset_cents ?? 0),
    lifetimeRestoredCents: Number(row.lifetime_restored_cents ?? 0),
  };
}

const WALLET_COLUMNS =
  "id, pending_cents, available_cents, reserved_cents, lifetime_earned_cents, lifetime_redeemed_cents, " +
  "lifetime_reversed_cents, recovery_cents, lifetime_recovery_accrued_cents, lifetime_recovery_offset_cents, " +
  "lifetime_restored_cents, bound_user_id";

/** Postgres unique violation — a concurrent create that lost the race is still the desired state. */
const PG_UNIQUE_VIOLATION = "23505";
/** Postgres check violation — how the posting function reports a refused movement. */
const PG_CHECK_VIOLATION = "23514";

/**
 * The namespace `reserveIdempotencyKey()` writes. The expiry sweep reads reservation rows back by
 * their stored key, so it needs the same prefix the core wrote; keeping it here rather than
 * re-typing the literal is what stops the two drifting apart.
 */
const RESERVE_KEY_PREFIX = reserveIdempotencyKey("");

const REDEMPTION_COLUMNS = "id, wallet_id, amount_cents, status, idempotency_key, expires_at";

type RedemptionRow = {
  id: string;
  wallet_id: string;
  amount_cents: number;
  status: RedemptionRecord["status"];
  idempotency_key: string;
  expires_at: string | null;
};

function toRedemption(row: RedemptionRow): RedemptionRecord {
  return {
    id: String(row.id),
    walletId: String(row.wallet_id),
    amountCents: Number(row.amount_cents ?? 0),
    status: row.status,
    idempotencyKey: String(row.idempotency_key),
    expiresAtIso: row.expires_at ?? null,
  };
}

export function buildRewardsStorePort(): RewardsStorePort {
  const db = getAdminSupabase();

  return {
    async resolveWallet(owner: WalletOwnerRef) {
      const column = owner.kind === "business" ? "business_id" : "owner_user_id";
      const value = owner.kind === "business" ? owner.businessId : owner.ownerUserId;
      // The auth user this resolution is FOR, which is what gets pinned to the wallet so every
      // later lookup returns the same one. A business wallet reached through its primary owner is
      // bound to that owner; a business reached without a user in hand binds nothing.
      const bindUserId = owner.kind === "user" ? owner.ownerUserId : (owner.boundUserId ?? null);

      const { data: existing, error: readError } = await db
        .from("leonix_rewards_wallets")
        .select(WALLET_COLUMNS)
        .eq(column, value)
        .maybeSingle();
      if (readError) return { ok: false as const, error: readError.message.slice(0, 300) };
      if (existing) {
        // PIN IT, ONCE. A wallet with no binding yet adopts this user; one already bound keeps its
        // binding, so a second customer can never take over the first customer's wallet identity.
        const row = existing as unknown as WalletRow & { bound_user_id?: string | null };
        if (bindUserId && !row.bound_user_id) {
          await db
            .from("leonix_rewards_wallets")
            .update({ bound_user_id: bindUserId, updated_at: new Date().toISOString() })
            .eq("id", row.id)
            .is("bound_user_id", null);
        }
        return { ok: true as const, wallet: toSnapshot(existing as unknown as WalletRow) };
      }

      const { data: created, error: insertError } = await db
        .from("leonix_rewards_wallets")
        .insert({ [column]: value, ...(bindUserId ? { bound_user_id: bindUserId } : {}) })
        .select(WALLET_COLUMNS)
        .single();

      if (insertError) {
        // Another request created it first: read it back rather than failing.
        if ((insertError as { code?: string }).code === PG_UNIQUE_VIOLATION) {
          const { data: raced } = await db
            .from("leonix_rewards_wallets")
            .select(WALLET_COLUMNS)
            .eq(column, value)
            .maybeSingle();
          if (raced) return { ok: true as const, wallet: toSnapshot(raced as unknown as WalletRow) };
        }
        return { ok: false as const, error: insertError.message.slice(0, 300) };
      }
      return { ok: true as const, wallet: toSnapshot(created as unknown as WalletRow) };
    },

    async getWalletById(walletId: string) {
      const { data } = await db.from("leonix_rewards_wallets").select(WALLET_COLUMNS).eq("id", walletId).maybeSingle();
      return data ? toSnapshot(data as unknown as WalletRow) : null;
    },

    async postEntry(input: LedgerEntryInput) {
      // Detect the idempotent replay BEFORE calling the RPC so the caller learns it was a
      // duplicate. The RPC is itself idempotent, so this is an optimization and a signal, never
      // the guarantee — the guarantee is UNIQUE(idempotency_key).
      const { data: prior } = await db
        .from("leonix_rewards_ledger")
        .select("id, wallet_id, entry_type, amount_cents, idempotency_key")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();

      const { data, error } = await db.rpc("leonix_rewards_post_entry", {
        p_wallet_id: input.walletId,
        p_entry_type: input.entryType,
        p_amount_cents: Math.floor(input.amountCents),
        p_source_kind: input.sourceKind,
        p_idempotency_key: input.idempotencyKey,
        p_source_id: input.sourceId ?? null,
        p_payment_record_id: input.paymentRecordId ?? null,
        p_redemption_id: input.redemptionId ?? null,
        p_reason: input.reason ?? null,
        p_actor_auth_user_id: input.actorAuthUserId ?? null,
        p_actor_roster_id: input.actorRosterId ?? null,
        p_meta: input.meta ?? {},
      });

      if (error) {
        // A CHECK violation here means the movement would have driven a bucket negative, or the
        // posting function refused it outright by SQLSTATE. Either is a refusal BY DESIGN, named
        // as such rather than swallowed or reported as an unexplained database error.
        const refused =
          (error as { code?: string }).code === PG_CHECK_VIOLATION ||
          /violates check constraint|nonneg|exceeds (available|pending|reserved)/i.test(error.message);
        return { ok: false as const, error: refused ? "negative_balance_refused" : error.message.slice(0, 300) };
      }

      const row = (Array.isArray(data) ? data[0] : data) as { id?: string } | null;
      if (!row?.id) return { ok: false as const, error: "post_entry_returned_no_row" };

      return {
        ok: true as const,
        entry: {
          id: String(row.id),
          walletId: input.walletId,
          entryType: input.entryType,
          amountCents: Math.floor(input.amountCents),
          idempotencyKey: input.idempotencyKey,
          deduplicated: Boolean(prior?.id),
        },
      };
    },

    async createRedemption(input) {
      const { data: existing } = await db
        .from("leonix_rewards_redemptions")
        .select(REDEMPTION_COLUMNS)
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (existing) {
        return {
          ok: true as const,
          redemption: toRedemption(existing as unknown as RedemptionRow),
          deduplicated: true,
        };
      }

      const { data, error } = await db
        .from("leonix_rewards_redemptions")
        .insert({
          wallet_id: input.walletId,
          amount_cents: Math.floor(input.amountCents),
          idempotency_key: input.idempotencyKey,
          context_kind: input.contextKind,
          stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
          payment_record_id: input.paymentRecordId ?? null,
          actor_auth_user_id: input.actorAuthUserId ?? null,
          // Written on RESERVE, never inferred later. A `reserved` row without it is refused by
          // leonix_rewards_redemptions_live_expiry_chk.
          expires_at: input.expiresAtIso,
          status: "reserved",
        })
        .select(REDEMPTION_COLUMNS)
        .single();

      if (error || !data) {
        // Another request reserved the same reference first: return theirs rather than failing.
        if ((error as { code?: string } | null)?.code === PG_UNIQUE_VIOLATION) {
          const { data: raced } = await db
            .from("leonix_rewards_redemptions")
            .select(REDEMPTION_COLUMNS)
            .eq("idempotency_key", input.idempotencyKey)
            .maybeSingle();
          if (raced) {
            return { ok: true as const, redemption: toRedemption(raced as unknown as RedemptionRow), deduplicated: true };
          }
        }
        return { ok: false as const, error: error?.message.slice(0, 300) ?? "insert_failed" };
      }

      return {
        ok: true as const,
        redemption: toRedemption(data as unknown as RedemptionRow),
        deduplicated: false,
      };
    },

    async findRedemption(idempotencyKey: string) {
      const { data } = await db
        .from("leonix_rewards_redemptions")
        .select(REDEMPTION_COLUMNS)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (!data) return null;
      return toRedemption(data as unknown as RedemptionRow);
    },

    async setRedemptionStatus({ redemptionId, status, settleLedgerId, fromAnyStatus }) {
      // Compare-and-set from 'reserved' so a late release cannot undo a commit. The re-debit path
      // opts out explicitly: it is finalising a row that is already released or expired, having
      // just taken the credits again, and there is no `reserved` state left to compare against.
      let q = db
        .from("leonix_rewards_redemptions")
        .update({ status, settle_ledger_id: settleLedgerId ?? null, updated_at: new Date().toISOString() })
        .eq("id", redemptionId);
      if (!fromAnyStatus) q = q.eq("status", "reserved");
      const { data, error } = await q.select("id");
      if (error) return { ok: false, error: error.message.slice(0, 300) };
      if (!data?.length) return { ok: false, error: "redemption_not_reserved" };
      return { ok: true };
    },

    async findLedgerEntryByIdempotencyKey(idempotencyKey: string) {
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("id, wallet_id, entry_type, amount_cents")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (!data) return null;
      const row = data as unknown as { id: string; wallet_id: string; entry_type: string; amount_cents: number };
      return {
        id: String(row.id),
        walletId: String(row.wallet_id),
        entryType: String(row.entry_type),
        amountCents: Number(row.amount_cents ?? 0),
      };
    },

    async sumRestoredForPayment(paymentRecordId: string) {
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("amount_cents")
        .eq("payment_record_id", paymentRecordId)
        .eq("entry_type", "reversal_restoration");
      return ((data ?? []) as { amount_cents: number }[]).reduce((a, r) => a + Number(r.amount_cents ?? 0), 0);
    },

    async sumReversedForPaymentByKind(paymentRecordId: string, kind: "refund" | "chargeback") {
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("amount_cents")
        .eq("payment_record_id", paymentRecordId)
        .eq("entry_type", kind === "refund" ? "refund_reversal" : "chargeback_reversal");
      return ((data ?? []) as { amount_cents: number }[]).reduce((a, r) => a + Number(r.amount_cents ?? 0), 0);
    },

    async sumReversedForPayment(paymentRecordId: string) {
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("amount_cents, entry_type")
        .eq("payment_record_id", paymentRecordId)
        .in("entry_type", ["refund_reversal", "chargeback_reversal"]);
      return ((data ?? []) as { amount_cents: number }[]).reduce((a, r) => a + Number(r.amount_cents ?? 0), 0);
    },

    async sumReversalBasisForPayment(paymentRecordId: string, kind: "refund" | "chargeback") {
      // A WON DISPUTE WITHDRAWS THE BASIS IT ADDED. `reversal_restoration` rows carry a NEGATIVE
      // `basis_contribution_cents`, so including them for the chargeback kind is what stops a
      // later refund measuring its position against a charge that was already given back. The
      // total is floored at zero — the position can be withdrawn to nothing, never below it.
      const entryTypes =
        kind === "refund" ? ["refund_reversal"] : ["chargeback_reversal", "reversal_restoration"];
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("meta")
        .eq("payment_record_id", paymentRecordId)
        .in("entry_type", entryTypes);
      // `basis_contribution_cents` is the MONEY this entry accounted for, which is not the same as
      // the credits it moved: a refund landing on an already fully-reversed payment contributes
      // real money to the position while moving zero credits.
      const total = ((data ?? []) as { meta: Record<string, unknown> | null }[]).reduce((sum, row) => {
        const raw = (row.meta as { basis_contribution_cents?: number } | null)?.basis_contribution_cents;
        const contribution = Number(raw ?? 0);
        return sum + (Number.isFinite(contribution) ? Math.floor(contribution) : 0);
      }, 0);
      return Math.max(0, total);
    },

    async findEarnForPayment(paymentRecordId: string) {
      // `wallet_id` is selected because a reversal must debit the wallet this payment CREDITED.
      // Re-resolving the payer's wallet at reversal time would send the clawback wherever that
      // payer maps TODAY, which is not necessarily where the credits went.
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("wallet_id, amount_cents, meta")
        .eq("payment_record_id", paymentRecordId)
        .in("entry_type", ["earn_pending", "earn_available"])
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const row = data as unknown as {
        wallet_id: string;
        amount_cents: number;
        meta: Record<string, unknown> | null;
      };
      return {
        walletId: String(row.wallet_id),
        amountCents: Number(row.amount_cents ?? 0),
        eligibleNetCents: Number((row.meta as { eligible_net_cents?: number } | null)?.eligible_net_cents ?? 0),
      };
    },

    async listPromotablePendingEarns({ olderThanIso, limit }) {
      // Pending card earns old enough to promote. Filtering out the already-promoted ones here is
      // a cheap pre-pass; the real guarantee is the `promote:payment:<id>` idempotency key, which
      // makes a promotion that slips past this filter a no-op rather than a second one.
      const { data: candidates } = await db
        .from("leonix_rewards_ledger")
        .select("wallet_id, payment_record_id, amount_cents, created_at")
        .eq("entry_type", "earn_pending")
        .not("payment_record_id", "is", null)
        .lte("created_at", olderThanIso)
        .order("created_at", { ascending: true })
        .limit(limit);

      const rows = ((candidates ?? []) as {
        wallet_id: string;
        payment_record_id: string | null;
        amount_cents: number;
        created_at: string;
      }[]).filter((r): r is typeof r & { payment_record_id: string } => Boolean(r.payment_record_id));
      if (!rows.length) return [];

      const paymentIds = Array.from(new Set(rows.map((r) => r.payment_record_id)));
      const { data: promoted } = await db
        .from("leonix_rewards_ledger")
        .select("payment_record_id")
        .eq("entry_type", "earn_promote")
        .in("payment_record_id", paymentIds);
      const alreadyPromoted = new Set(
        ((promoted ?? []) as { payment_record_id: string }[]).map((r) => r.payment_record_id),
      );

      return rows
        .filter((r) => !alreadyPromoted.has(r.payment_record_id))
        .map((r) => ({
          walletId: String(r.wallet_id),
          paymentRecordId: String(r.payment_record_id),
          amountCents: Number(r.amount_cents ?? 0),
          earnedAtIso: String(r.created_at),
        }));
    },

    async listExpiredReservations({ nowIso, limit }) {
      const { data } = await db
        .from("leonix_rewards_redemptions")
        .select("id, amount_cents, idempotency_key")
        .eq("status", "reserved")
        .not("expires_at", "is", null)
        .lte("expires_at", nowIso)
        .order("expires_at", { ascending: true })
        .limit(limit);

      return ((data ?? []) as { id: string; amount_cents: number; idempotency_key: string }[])
        // The stored key is `reserve:<ref>`; the release path is addressed by the bare ref.
        .filter((r) => typeof r.idempotency_key === "string" && r.idempotency_key.startsWith(RESERVE_KEY_PREFIX))
        .map((r) => ({
          redemptionId: String(r.id),
          redemptionRef: r.idempotency_key.slice(RESERVE_KEY_PREFIX.length),
          amountCents: Number(r.amount_cents ?? 0),
        }));
    },
  };
}

/** True when the rewards subsystem can run at all. Callers fail soft rather than breaking a payment. */
export function isRewardsConfigured(): boolean {
  return isSupabaseAdminConfigured();
}

/**
 * Resolve which entity a payment's credits belong to.
 *
 * Prefers the BUSINESS when the payment is linked to one through the existing
 * `business_external_links` bridge (whose own table comment names `leonix_payment_records` as a
 * link target), and falls back to the individual auth user. Name and phone are never consulted:
 * they are search keys on other surfaces, never identity here.
 */
export async function resolveWalletOwnerForPayment(input: {
  paymentRecordId: string;
  ownerUserId: string | null;
}): Promise<WalletOwnerRef | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const db = getAdminSupabase();

  // An EMPTY payment id means "there is no payment to look up", not "look up the empty payment".
  // `business_external_links.record_id` is `text NOT NULL` with no non-empty constraint, so a
  // single row with `record_id = ''` — from a backfill, a fixture, or a future writer — would
  // otherwise make EVERY caller resolve to that one business's wallet. Customer isolation must
  // not depend on an application-layer invariant over an unconstrained column.
  const paymentRecordId = input.paymentRecordId.trim();
  if (!paymentRecordId) return resolveWalletOwnerForUser(input.ownerUserId);

  // THE CUSTOMER'S BINDING OUTRANKS A PAYMENT-LEVEL LINK.
  //
  // This link is staff-created. Consulting it first meant a customer already bound to their
  // personal wallet EARNED into a business wallet they could never spend from at checkout, because
  // redemption resolves through the binding. Earn and spend have to land on one wallet, so the
  // binding is checked first and the link only decides a customer who has no wallet identity yet.
  // ONLY A REAL BINDING SHORT-CIRCUITS. `resolveWalletOwnerForUser` never returns null for a real
  // user, so calling IT here returned on every identified payer and left the link lookup below
  // unreachable — silently disabling staff payment-to-business attribution and pinning the whole
  // award to the payer's personal wallet. A customer with no wallet identity yet falls through.
  const bound = await findBoundWalletOwner(input.ownerUserId);
  if (bound) return bound;

  const { data: link } = await db
    .from("business_external_links")
    .select("business_id")
    .eq("record_type", "leonix_payment_records")
    .eq("record_id", paymentRecordId)
    .eq("status", "verified")
    .limit(1)
    .maybeSingle();
  const businessId = (link as { business_id?: string } | null)?.business_id;
  if (businessId) {
    // Carry the payer through so this first resolution PINS the identity, instead of leaving the
    // next lookup to re-derive a different answer.
    return { kind: "business", businessId: String(businessId), boundUserId: input.ownerUserId ?? null };
  }

  // No payment-level link: fall back to who the payer is.
  return resolveWalletOwnerForUser(input.ownerUserId);
}

/**
 * Which wallet a USER's money belongs to, with no payment in hand.
 *
 * Split out from `resolveWalletOwnerForPayment` so callers that genuinely have no payment — the
 * customer's own wallet read, a checkout about to reserve credits — say so, instead of passing an
 * empty payment id and hoping nothing matches it.
 *
 * PRIMARY OWNERSHIP WINS OVER BARE MEMBERSHIP. Being added as an ordinary member of a business
 * does not hand that business the credits someone earned as an individual, which is what a
 * "exactly one active membership" rule alone would have done: a customer with an individual
 * wallet who later joins one business as a `member` would have silently started resolving to the
 * business wallet, and their own balance would have vanished from the panel. Wallets are never
 * merged automatically — a locked decision — so the resolver must not effect a merge by accident.
 */
/**
 * The wallet ALREADY BOUND to this user, or null when they have no wallet identity yet.
 *
 * Distinct from `resolveWalletOwnerForUser`, which never returns null for a real user — it falls
 * through to `{ kind: "user" }`. Short-circuiting on that fallback made the payment-link branch in
 * `resolveWalletOwnerForPayment` dead code: every identified payer returned before it, so a
 * staff-verified link from a payment to a business stopped attributing anything and the whole
 * award went to the payer's personal wallet instead.
 */
export async function findBoundWalletOwner(ownerUserId: string | null): Promise<WalletOwnerRef | null> {
  if (!ownerUserId || !isSupabaseAdminConfigured()) return null;
  const { data } = await getAdminSupabase()
    .from("leonix_rewards_wallets")
    .select("business_id, owner_user_id")
    .eq("bound_user_id", ownerUserId)
    .maybeSingle();
  const row = data as { business_id?: string | null; owner_user_id?: string | null } | null;
  if (row?.business_id) return { kind: "business", businessId: String(row.business_id) };
  if (row?.owner_user_id) return { kind: "user", ownerUserId: String(row.owner_user_id) };
  return null;
}

export async function resolveWalletOwnerForUser(ownerUserId: string | null): Promise<WalletOwnerRef | null> {
  if (!ownerUserId || !isSupabaseAdminConfigured()) return null;
  const db = getAdminSupabase();

  // THE BINDING IS THE IDENTITY, AND IT IS PINNED AT FIRST USE.
  //
  // Everything below this line is a LIVE query over `business_memberships`, which means the answer
  // could change under the customer: someone who earned as an individual and later became primary
  // owner of a business silently started resolving to the BUSINESS wallet, and their own balance
  // vanished from every surface while their credits sat in a wallet nothing would spend from.
  //
  // Once a wallet has been bound to this user it IS their wallet, for earning, promotion,
  // redemption, reversal, release and restoration alike. The membership rules below decide only
  // which wallet to bind the FIRST time, and never get to change the answer afterwards. This
  // effects no merge: a wallet already bound to someone else is never taken over.
  const { data: bound } = await db
    .from("leonix_rewards_wallets")
    .select("business_id, owner_user_id")
    .eq("bound_user_id", ownerUserId)
    .maybeSingle();
  const boundRow = bound as { business_id?: string | null; owner_user_id?: string | null } | null;
  if (boundRow?.business_id) return { kind: "business", businessId: String(boundRow.business_id) };
  if (boundRow?.owner_user_id) return { kind: "user", ownerUserId: String(boundRow.owner_user_id) };

  const { data: memberships } = await db
    .from("business_memberships")
    .select("business_id, is_primary_owner")
    .eq("user_id", ownerUserId)
    .eq("membership_status", "active")
    .limit(10);
  const rows = (memberships ?? []) as { business_id: string; is_primary_owner: boolean | null }[];

  // A single business they actually OWN is their business wallet — and the binding is carried
  // through, so this membership query decides the answer ONCE and never again for this customer.
  const owned = rows.filter((r) => r.is_primary_owner === true);
  if (owned.length === 1) {
    return { kind: "business", businessId: owned[0]!.business_id, boundUserId: ownerUserId };
  }

  // Otherwise the money is theirs personally: no owned business, several owned businesses, or
  // membership of a business they do not own.
  return { kind: "user", ownerUserId };
}
