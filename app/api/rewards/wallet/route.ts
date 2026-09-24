/**
 * LEONIX IX REWARDS — customer wallet read.
 *
 * GET with `Authorization: Bearer <supabase access token>`
 *
 * Read-only. Returns the caller's own balances and recent ledger activity. Identity comes from
 * the bearer token; a wallet is never addressable by id from the browser, so one customer can
 * never request another's balance.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { resolveWalletOwnerForUser } from "@/app/lib/rewards/rewardsLedger";
import {
  CARD_SETTLEMENT_PENDING_DAYS,
  CREDITS_EXPIRE_AT_LAUNCH,
  earnRateCopy,
  formatCreditsCents,
  redemptionRulesCopy,
} from "@/app/lib/rewards/rewardsPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECENT_ACTIVITY_LIMIT = 25;

/** Ledger entry types a customer sees, with plain-language labels. */
const ENTRY_LABELS: Record<string, { es: string; en: string }> = {
  earn_pending: { es: "Créditos ganados (pendientes)", en: "Credits earned (pending)" },
  earn_available: { es: "Créditos ganados", en: "Credits earned" },
  earn_promote: { es: "Créditos disponibles", en: "Credits now available" },
  redeem_reserve: { es: "Créditos reservados", en: "Credits held for a purchase" },
  redeem_commit: { es: "Créditos usados", en: "Credits used" },
  redeem_release: { es: "Reserva liberada", en: "Hold released" },
  refund_reversal: { es: "Reverso por reembolso", en: "Reversed — refund" },
  chargeback_reversal: { es: "Reverso por contracargo", en: "Reversed — chargeback" },
  manual_adjustment: { es: "Ajuste de Leonix", en: "Leonix adjustment" },
  expire: { es: "Créditos vencidos", en: "Credits expired" },
  // EVERY ENTRY TYPE THE LEDGER CAN HOLD NEEDS A LABEL, or the customer reads the machine's word
  // for it. These four are precisely the ones this change makes reachable — a won dispute, an
  // expired hold that was re-debited, and the two halves of a recovery debt — so the customer
  // most likely to see them is the one whose money has already had an eventful month. The
  // fallback renders `r.entry_type`, which for a Spanish-speaking customer meant a line in their
  // activity list reading `reversal_restoration`.
  reversal_restoration: { es: "Créditos devueltos (disputa ganada)", en: "Credits returned — dispute won" },
  redeem_recommit: { es: "Créditos usados (cobro tardío)", en: "Credits used — late settlement" },
  recovery_accrue: { es: "Saldo por recuperar", en: "Balance to recover" },
  recovery_offset: { es: "Saldo recuperado", en: "Recovered balance" },
};

export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  const userId = await getBearerUserId(request);
  if (!userId) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });

  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "es";

  // The wallet is resolved from the caller's OWN identity, never from a request parameter — and
  // through the user-scoped resolver, not by handing the payment-scoped one an empty id. That
  // empty string became `.eq("record_id", "")` against a column with no non-empty constraint, so
  // a single stray row would have pointed every customer's wallet read at one business.
  const owner = await resolveWalletOwnerForUser(userId);
  if (!owner) {
    return NextResponse.json({
      ok: true,
      wallet: null,
      explanation: earnRateCopy(lang),
    });
  }

  const db = getAdminSupabase();
  const column = owner.kind === "business" ? "business_id" : "owner_user_id";
  const value = owner.kind === "business" ? owner.businessId : owner.ownerUserId;

  const { data: walletRow, error } = await db
    .from("leonix_rewards_wallets")
    .select(
      "id, pending_cents, available_cents, reserved_cents, lifetime_earned_cents, lifetime_redeemed_cents, lifetime_reversed_cents, recovery_cents, lifetime_restored_cents",
    )
    .eq(column, value)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });

  const emptyWallet = {
    availableCents: 0,
    pendingCents: 0,
    reservedCents: 0,
    lifetimeEarnedCents: 0,
    lifetimeRedeemedCents: 0,
    lifetimeReversedCents: 0,
    availableDisplay: formatCreditsCents(0),
    pendingDisplay: formatCreditsCents(0),
    reservedDisplay: formatCreditsCents(0),
    lifetimeEarnedDisplay: formatCreditsCents(0),
    lifetimeRedeemedDisplay: formatCreditsCents(0),
    lifetimeReversedDisplay: formatCreditsCents(0),
    // A clawback the wallet could not cover, repaid out of future earnings before they become
    // spendable. Surfaced so the checkout control can explain it instead of silently refusing.
    recoveryCents: 0,
    recoveryDisplay: formatCreditsCents(0),
    lifetimeRestoredCents: 0,
    pendingAvailableOn: null as string | null,
  };

  if (!walletRow) {
    // No wallet yet is a truthful zero state, not an error — the customer simply has not earned.
    return NextResponse.json({
      ok: true,
      wallet: emptyWallet,
      activity: [],
      explanation: earnRateCopy(lang),
      redemptionRules: redemptionRulesCopy(lang),
      creditsExpire: CREDITS_EXPIRE_AT_LAUNCH,
    });
  }

  const w = walletRow as unknown as {
    id: string;
    pending_cents: number;
    available_cents: number;
    reserved_cents: number;
    lifetime_earned_cents: number;
    lifetime_redeemed_cents: number;
    lifetime_reversed_cents: number;
    recovery_cents?: number | null;
    lifetime_restored_cents?: number | null;
  };

  const { data: activityRows } = await db
    .from("leonix_rewards_ledger")
    .select("id, entry_type, amount_cents, created_at, reason")
    .eq("wallet_id", w.id)
    .order("created_at", { ascending: false })
    .limit(RECENT_ACTIVITY_LIMIT);

  const activity = ((activityRows ?? []) as { id: string; entry_type: string; amount_cents: number; created_at: string; reason: string | null }[])
    .map((r) => ({
      id: r.id,
      type: r.entry_type,
      label: ENTRY_LABELS[r.entry_type]?.[lang] ?? r.entry_type,
      amountCents: r.amount_cents,
      amountDisplay: formatCreditsCents(r.amount_cents),
      createdAt: r.created_at,
      reason: r.reason,
    }));

  // WHEN pending credits become spendable, computed from the OLDEST unpromoted pending earn plus
  // the settlement window — the same window the promotion sweep uses, read from the same
  // constant. Null when there is nothing pending, because a date nobody can stand behind is
  // worse than no date: the panel then says nothing rather than inventing one.
  let pendingAvailableOn: string | null = null;
  if (w.pending_cents > 0) {
    const { data: oldestPending } = await db
      .from("leonix_rewards_ledger")
      .select("created_at")
      .eq("wallet_id", w.id)
      .eq("entry_type", "earn_pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const earnedAt = (oldestPending as { created_at?: string } | null)?.created_at;
    if (earnedAt) {
      const t = Date.parse(earnedAt);
      if (Number.isFinite(t)) {
        pendingAvailableOn = new Date(t + CARD_SETTLEMENT_PENDING_DAYS * 86_400_000).toISOString();
      }
    }
  }

  return NextResponse.json({
    ok: true,
    wallet: {
      availableCents: w.available_cents,
      pendingCents: w.pending_cents,
      reservedCents: w.reserved_cents,
      lifetimeEarnedCents: w.lifetime_earned_cents,
      lifetimeRedeemedCents: w.lifetime_redeemed_cents,
      lifetimeReversedCents: w.lifetime_reversed_cents ?? 0,
      availableDisplay: formatCreditsCents(w.available_cents),
      pendingDisplay: formatCreditsCents(w.pending_cents),
      reservedDisplay: formatCreditsCents(w.reserved_cents),
      lifetimeEarnedDisplay: formatCreditsCents(w.lifetime_earned_cents),
      lifetimeRedeemedDisplay: formatCreditsCents(w.lifetime_redeemed_cents),
      lifetimeReversedDisplay: formatCreditsCents(w.lifetime_reversed_cents ?? 0),
      // WHAT THE CUSTOMER OWES BACK. A refund clawed back credits that had already been spent, so
      // the shortfall is carried here and repaid out of future earnings before they become
      // spendable. Surfaced because a checkout that simply refused to apply credits without
      // saying why is the kind of silence this system is not allowed to have.
      recoveryCents: Math.max(0, Number(w.recovery_cents ?? 0) || 0),
      recoveryDisplay: formatCreditsCents(Math.max(0, Number(w.recovery_cents ?? 0) || 0)),
      lifetimeRestoredCents: Math.max(0, Number(w.lifetime_restored_cents ?? 0) || 0),
      pendingAvailableOn,
    },
    activity,
    explanation: earnRateCopy(lang),
    redemptionRules: redemptionRulesCopy(lang),
    // Stated explicitly so no surface has to guess. Launch policy has NO expiration, and the
    // panel reads this rather than carrying its own claim about expiry.
    creditsExpire: CREDITS_EXPIRE_AT_LAUNCH,
  });
}
