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
import { resolveWalletOwnerForPayment } from "@/app/lib/rewards/rewardsLedger";
import { earnRateCopy, formatCreditsCents } from "@/app/lib/rewards/rewardsPolicy";

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
};

export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  const userId = await getBearerUserId(request);
  if (!userId) return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });

  const lang = request.nextUrl.searchParams.get("lang") === "en" ? "en" : "es";

  // The wallet is resolved from the caller's own identity, never from a request parameter.
  const owner = await resolveWalletOwnerForPayment({ paymentRecordId: "", ownerUserId: userId });
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
    .select("id, pending_cents, available_cents, reserved_cents, lifetime_earned_cents, lifetime_redeemed_cents")
    .eq(column, value)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: "lookup_failed" }, { status: 500 });

  if (!walletRow) {
    // No wallet yet is a truthful zero state, not an error — the customer simply has not earned.
    return NextResponse.json({
      ok: true,
      wallet: {
        availableCents: 0,
        pendingCents: 0,
        reservedCents: 0,
        lifetimeEarnedCents: 0,
        lifetimeRedeemedCents: 0,
        availableDisplay: formatCreditsCents(0),
        pendingDisplay: formatCreditsCents(0),
        lifetimeEarnedDisplay: formatCreditsCents(0),
      },
      activity: [],
      explanation: earnRateCopy(lang),
    });
  }

  const w = walletRow as unknown as {
    id: string;
    pending_cents: number;
    available_cents: number;
    reserved_cents: number;
    lifetime_earned_cents: number;
    lifetime_redeemed_cents: number;
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

  return NextResponse.json({
    ok: true,
    wallet: {
      availableCents: w.available_cents,
      pendingCents: w.pending_cents,
      reservedCents: w.reserved_cents,
      lifetimeEarnedCents: w.lifetime_earned_cents,
      lifetimeRedeemedCents: w.lifetime_redeemed_cents,
      availableDisplay: formatCreditsCents(w.available_cents),
      pendingDisplay: formatCreditsCents(w.pending_cents),
      lifetimeEarnedDisplay: formatCreditsCents(w.lifetime_earned_cents),
    },
    activity,
    explanation: earnRateCopy(lang),
  });
}
