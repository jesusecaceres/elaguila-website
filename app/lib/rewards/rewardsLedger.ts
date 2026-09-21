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
import type {
  LedgerEntryInput,
  RedemptionRecord,
  RewardsStorePort,
  WalletOwnerRef,
  WalletSnapshot,
} from "./rewardsLedgerCore";

type WalletRow = {
  id: string;
  pending_cents: number;
  available_cents: number;
  reserved_cents: number;
  lifetime_earned_cents: number;
  lifetime_redeemed_cents: number;
  lifetime_reversed_cents: number;
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
  };
}

const WALLET_COLUMNS =
  "id, pending_cents, available_cents, reserved_cents, lifetime_earned_cents, lifetime_redeemed_cents, lifetime_reversed_cents";

/** Postgres unique violation — a concurrent create that lost the race is still the desired state. */
const PG_UNIQUE_VIOLATION = "23505";

export function buildRewardsStorePort(): RewardsStorePort {
  const db = getAdminSupabase();

  return {
    async resolveWallet(owner: WalletOwnerRef) {
      const column = owner.kind === "business" ? "business_id" : "owner_user_id";
      const value = owner.kind === "business" ? owner.businessId : owner.ownerUserId;

      const { data: existing, error: readError } = await db
        .from("leonix_rewards_wallets")
        .select(WALLET_COLUMNS)
        .eq(column, value)
        .maybeSingle();
      if (readError) return { ok: false as const, error: readError.message.slice(0, 300) };
      if (existing) return { ok: true as const, wallet: toSnapshot(existing as unknown as WalletRow) };

      const { data: created, error: insertError } = await db
        .from("leonix_rewards_wallets")
        .insert({ [column]: value })
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
        // A CHECK violation here means the movement would have driven a bucket negative. That is a
        // refusal by design, surfaced as such rather than swallowed.
        const negative = /violates check constraint|nonneg/i.test(error.message);
        return { ok: false as const, error: negative ? "negative_balance_refused" : error.message.slice(0, 300) };
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
        .select("id, wallet_id, amount_cents, status, idempotency_key")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (existing) {
        const r = existing as unknown as { id: string; wallet_id: string; amount_cents: number; status: RedemptionRecord["status"]; idempotency_key: string };
        return {
          ok: true as const,
          redemption: { id: r.id, walletId: r.wallet_id, amountCents: r.amount_cents, status: r.status, idempotencyKey: r.idempotency_key },
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
          status: "reserved",
        })
        .select("id, wallet_id, amount_cents, status, idempotency_key")
        .single();
      if (error || !data) return { ok: false as const, error: error?.message.slice(0, 300) ?? "insert_failed" };

      const r = data as unknown as { id: string; wallet_id: string; amount_cents: number; status: RedemptionRecord["status"]; idempotency_key: string };
      return {
        ok: true as const,
        redemption: { id: r.id, walletId: r.wallet_id, amountCents: r.amount_cents, status: r.status, idempotencyKey: r.idempotency_key },
        deduplicated: false,
      };
    },

    async findRedemption(idempotencyKey: string) {
      const { data } = await db
        .from("leonix_rewards_redemptions")
        .select("id, wallet_id, amount_cents, status, idempotency_key")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (!data) return null;
      const r = data as unknown as { id: string; wallet_id: string; amount_cents: number; status: RedemptionRecord["status"]; idempotency_key: string };
      return { id: r.id, walletId: r.wallet_id, amountCents: r.amount_cents, status: r.status, idempotencyKey: r.idempotency_key };
    },

    async setRedemptionStatus({ redemptionId, status, settleLedgerId }) {
      // Compare-and-set from 'reserved' so a late release cannot undo a commit.
      const { data, error } = await db
        .from("leonix_rewards_redemptions")
        .update({ status, settle_ledger_id: settleLedgerId ?? null, updated_at: new Date().toISOString() })
        .eq("id", redemptionId)
        .eq("status", "reserved")
        .select("id");
      if (error) return { ok: false, error: error.message.slice(0, 300) };
      if (!data?.length) return { ok: false, error: "redemption_not_reserved" };
      return { ok: true };
    },

    async sumReversedForPayment(paymentRecordId: string) {
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("amount_cents, entry_type")
        .eq("payment_record_id", paymentRecordId)
        .in("entry_type", ["refund_reversal", "chargeback_reversal"]);
      return ((data ?? []) as { amount_cents: number }[]).reduce((a, r) => a + Number(r.amount_cents ?? 0), 0);
    },

    async findEarnForPayment(paymentRecordId: string) {
      const { data } = await db
        .from("leonix_rewards_ledger")
        .select("amount_cents, meta")
        .eq("payment_record_id", paymentRecordId)
        .in("entry_type", ["earn_pending", "earn_available"])
        .limit(1)
        .maybeSingle();
      if (!data) return null;
      const row = data as unknown as { amount_cents: number; meta: Record<string, unknown> | null };
      return {
        amountCents: Number(row.amount_cents ?? 0),
        eligibleNetCents: Number((row.meta as { eligible_net_cents?: number } | null)?.eligible_net_cents ?? 0),
      };
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

  const { data: link } = await db
    .from("business_external_links")
    .select("business_id")
    .eq("record_type", "leonix_payment_records")
    .eq("record_id", input.paymentRecordId)
    .eq("status", "verified")
    .limit(1)
    .maybeSingle();
  const businessId = (link as { business_id?: string } | null)?.business_id;
  if (businessId) return { kind: "business", businessId: String(businessId) };

  // No payment-level link: fall back to the payer's single active business membership, then to
  // the user themselves.
  if (input.ownerUserId) {
    const { data: memberships } = await db
      .from("business_memberships")
      .select("business_id, is_primary_owner")
      .eq("user_id", input.ownerUserId)
      .eq("membership_status", "active")
      .limit(10);
    const rows = (memberships ?? []) as { business_id: string; is_primary_owner: boolean | null }[];
    if (rows.length === 1) return { kind: "business", businessId: rows[0]!.business_id };
    const owned = rows.filter((r) => r.is_primary_owner === true);
    if (owned.length === 1) return { kind: "business", businessId: owned[0]!.business_id };
    return { kind: "user", ownerUserId: input.ownerUserId };
  }

  return null;
}
