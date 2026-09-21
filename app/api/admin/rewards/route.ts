/**
 * LEONIX IX REWARDS — staff operations.
 *
 * POST { action, ... }
 *
 * Every action here moves money-equivalent value, so all of them sit behind
 * `requireRevenueProtectedWriteAccess()` — the SAME gate the existing manual-payment tracker uses
 * for recording and clearing real payments. The acting staff identity comes from that gate, never
 * from the request body, and every write is attributed and audited.
 *
 * Actions:
 *   search            — find a customer's wallet by business or user (read)
 *   redeem            — apply credits to a manual/office payment (reserve + commit in one step,
 *                       because an office payment is taken in person and settles immediately)
 *   adjust            — authorized manual correction, signed, reasoned, attributed
 *   release           — return a stale hold to the customer's available balance
 *
 * Historical ledger rows are never edited or deleted: a correction is a new compensating entry.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  getCurrentAdminAccessContext,
  hasPaymentTrackerAccess,
  requireRevenueProtectedWriteAccess,
  revenueWriteDenialStatusCode,
} from "@/app/admin/_lib/adminAccessControl";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { buildRewardsStorePort } from "@/app/lib/rewards/rewardsLedger";
import {
  commitReservedCredits,
  postManualAdjustment,
  releaseReservedCredits,
  reserveCreditsForPurchase,
  type WalletOwnerRef,
} from "@/app/lib/rewards/rewardsLedgerCore";
import { formatCreditsCents } from "@/app/lib/rewards/rewardsPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A wallet is addressed by a canonical uuid. Anything else is refused before it reaches a query. */
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * The owner a staff action targets.
 *
 * Both ids must be canonical uuids: these values flow into wallet lookups, and a wallet is never
 * addressable by anything a human typed. An unparseable id is a refusal, not a best-effort match.
 */
function ownerFromBody(body: Record<string, unknown>): WalletOwnerRef | null {
  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  const ownerUserId = typeof body.ownerUserId === "string" ? body.ownerUserId.trim() : "";
  if (businessId) return isUuid(businessId) ? { kind: "business", businessId } : null;
  if (ownerUserId) return isUuid(ownerUserId) ? { kind: "user", ownerUserId } : null;
  return null;
}

/**
 * Make a human-typed search term safe to place inside a PostgREST `.or()` filter string.
 *
 * `.or()` takes a single string whose grammar uses `,` to separate conditions, `.` to separate
 * operator from operand, and `()` to group. Interpolating a raw term into it is not a SQL
 * injection — Supabase still parameterizes — but it IS a FILTER injection: a term containing a
 * comma adds a condition the server never intended, and one containing `)` can close the group
 * early. A term of `a,status.eq.deleted` would have widened the result set past the `status`
 * filter applied beside it.
 *
 * So: drop every character that carries meaning in that grammar, collapse the `%` and `_` LIKE
 * wildcards to literals, and bound the length. What survives is a plain substring to match on.
 * Returns null when nothing usable is left, and the caller refuses rather than searching for "".
 */
function sanitizeSearchTerm(raw: string): string | null {
  const cleaned = raw
    .replace(/[(),.*"'\\]/g, " ")
    .replace(/[%_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return cleaned.length >= 2 ? cleaned : null;
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  // Same authorization gate as recording a real payment. Staff identity is returned by the gate.
  const access = await requireRevenueProtectedWriteAccess();
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: "forbidden", reason: access.reason },
      { status: revenueWriteDenialStatusCode(access.reason) },
    );
  }
  const actorAuthUserId = access.actorAuthUserId;
  const actorRosterId = access.actorRosterId ?? null;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action.trim() : "";
  const db = getAdminSupabase();
  const ports = buildRewardsStorePort();

  // -------------------------------------------------------------------------
  // SEARCH — name and phone are SEARCH KEYS ONLY. The wallet is keyed on the
  // canonical business/user id that the search resolves to, never on the phone.
  // -------------------------------------------------------------------------
  if (action === "search") {
    const raw = typeof body.query === "string" ? body.query.trim() : "";
    if (raw.length < 2) return NextResponse.json({ ok: false, error: "query_too_short" }, { status: 400 });

    // The term is stripped of every character that means something to the PostgREST `.or()`
    // grammar before it is interpolated. Without this, a comma in the term adds a condition of
    // the caller's choosing to the filter, and the `status = active` restriction beside it stops
    // being a restriction.
    const q = sanitizeSearchTerm(raw);
    if (!q) return NextResponse.json({ ok: false, error: "query_unusable" }, { status: 400 });

    const { data: businesses } = await db
      .from("businesses")
      .select("id, display_name, public_name, slug")
      .or(`display_name.ilike.%${q}%,public_name.ilike.%${q}%,normalized_name.ilike.%${q}%`)
      .eq("status", "active")
      .limit(20);

    const rows = (businesses ?? []) as { id: string; display_name: string; public_name: string | null; slug: string | null }[];
    const ids = rows.map((r) => r.id);

    const { data: wallets } = ids.length
      ? await db
          .from("leonix_rewards_wallets")
          .select("business_id, available_cents, pending_cents, reserved_cents, lifetime_earned_cents, lifetime_redeemed_cents")
          .in("business_id", ids)
      : { data: [] };

    const byBusiness = new Map(
      ((wallets ?? []) as { business_id: string; available_cents: number; pending_cents: number; reserved_cents: number; lifetime_earned_cents: number; lifetime_redeemed_cents: number }[])
        .map((w) => [w.business_id, w]),
    );

    return NextResponse.json({
      ok: true,
      results: rows.map((r) => {
        const w = byBusiness.get(r.id);
        return {
          businessId: r.id,
          displayName: r.display_name,
          publicName: r.public_name,
          availableCents: w?.available_cents ?? 0,
          pendingCents: w?.pending_cents ?? 0,
          reservedCents: w?.reserved_cents ?? 0,
          lifetimeEarnedCents: w?.lifetime_earned_cents ?? 0,
          lifetimeRedeemedCents: w?.lifetime_redeemed_cents ?? 0,
          availableDisplay: formatCreditsCents(w?.available_cents ?? 0),
        };
      }),
    });
  }

  // -------------------------------------------------------------------------
  // REDEEM — credits applied to an in-person payment. The SERVER computes how
  // many credits may actually be applied; the amount typed by staff is a request.
  // -------------------------------------------------------------------------
  if (action === "redeem") {
    const owner = ownerFromBody(body);
    if (!owner) return NextResponse.json({ ok: false, error: "owner_required" }, { status: 400 });

    const requestedCents = Number(body.requestedCents);
    const amountDueCents = Number(body.amountDueCents);
    const redemptionRef = typeof body.redemptionRef === "string" ? body.redemptionRef.trim() : "";
    if (!Number.isFinite(requestedCents) || !Number.isFinite(amountDueCents) || !redemptionRef) {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const reserved = await reserveCreditsForPurchase({
      owner,
      requestedCents: Math.floor(requestedCents),
      amountDueCents: Math.floor(amountDueCents),
      // An office payment is taken at the counter and can settle at zero, so no rail floor
      // applies; the $1 minimum and the 50% ceiling still do.
      allowZeroCharge: true,
      redemptionRef,
      contextKind: "manual_payment",
      paymentRecordId: typeof body.paymentRecordId === "string" ? body.paymentRecordId : null,
      actorAuthUserId,
      ports,
    });
    if (!reserved.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: reserved.reason,
          // What the customer COULD apply, so staff can correct the figure instead of guessing.
          maxRedeemableCents: reserved.maxRedeemableCents ?? 0,
          maxRedeemableDisplay: formatCreditsCents(reserved.maxRedeemableCents ?? 0),
        },
        { status: 409 },
      );
    }

    // A REUSED reference is not a second redemption. It matched a hold that already exists, so
    // nothing new was reserved and nothing new may be committed — reporting `redeemedCents` here
    // as though it were fresh is exactly how a reused reference becomes a phantom discount, with
    // staff handing the customer money off a second time against one movement of credits.
    if (reserved.deduplicated) {
      return NextResponse.json({
        ok: true,
        deduplicated: true,
        movedCents: 0,
        redemptionId: reserved.redemptionId,
        alreadyAppliedCents: reserved.redeemCents,
        alreadyAppliedDisplay: formatCreditsCents(reserved.redeemCents),
        message:
          "This redemption reference was already used. No new credits were applied; the amount shown is the existing redemption.",
      });
    }

    // An office payment is taken in person, so it settles in the same interaction: commit at once.
    const committed = await commitReservedCredits({
      redemptionRef,
      paymentRecordId: typeof body.paymentRecordId === "string" ? body.paymentRecordId : null,
      ports,
    });
    if (!committed.ok) {
      return NextResponse.json({ ok: false, error: committed.error, redemptionId: reserved.redemptionId }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      deduplicated: false,
      movedCents: reserved.redeemCents,
      redemptionId: reserved.redemptionId,
      redeemedCents: reserved.redeemCents,
      redeemedDisplay: formatCreditsCents(reserved.redeemCents),
      remainingDueCents: reserved.remainingDueCents,
      remainingDueDisplay: formatCreditsCents(reserved.remainingDueCents),
    });
  }

  // -------------------------------------------------------------------------
  // ADJUST — authorized correction. Signed, reasoned, attributed, audited.
  // -------------------------------------------------------------------------
  if (action === "adjust") {
    const owner = ownerFromBody(body);
    if (!owner) return NextResponse.json({ ok: false, error: "owner_required" }, { status: 400 });

    const amountCents = Number(body.amountCents);
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    const adjustmentRef = typeof body.adjustmentRef === "string" ? body.adjustmentRef.trim() : "";
    if (!Number.isFinite(amountCents) || !reason || !adjustmentRef) {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    const res = await postManualAdjustment({
      owner,
      amountCents: Math.floor(amountCents),
      reason,
      actorAuthUserId,
      actorRosterId,
      adjustmentRef,
      ports,
    });
    if (!res.ok) {
      const status = res.error === "negative_balance_refused" ? 409 : 400;
      return NextResponse.json(
        {
          ok: false,
          error: res.error,
          // A negative adjustment draws from available first, then pending, and is REFUSED when
          // it exceeds both. It cannot drive a wallet negative, and it cannot bypass the balance
          // constraints; the remainder is a conversation with the customer, not a negative wallet.
          ...(res.error === "negative_balance_refused"
            ? { message: "The adjustment is larger than the wallet's available plus pending balance and was refused." }
            : {}),
        },
        { status },
      );
    }
    // A reused adjustment reference moved nothing. Saying so is the difference between an
    // idempotent retry and a staff member believing they applied a second correction.
    return NextResponse.json({
      ok: true,
      deduplicated: res.deduplicated,
      movedCents: res.deduplicated ? 0 : res.amountCents,
      amountCents: res.amountCents,
      amountDisplay: formatCreditsCents(res.amountCents),
      ...(res.deduplicated
        ? { message: "This adjustment reference was already applied. No new movement was recorded." }
        : {}),
    });
  }

  // -------------------------------------------------------------------------
  // RELEASE — return a stale hold.
  // -------------------------------------------------------------------------
  if (action === "release") {
    const redemptionRef = typeof body.redemptionRef === "string" ? body.redemptionRef.trim() : "";
    if (!redemptionRef) return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    const res = await releaseReservedCredits({ redemptionRef, expired: body.expired === true, ports });
    if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 409 });
    return NextResponse.json({ ok: true, outcome: res.outcome, amountCents: res.amountCents });
  }

  return NextResponse.json({ ok: false, error: "unsupported_action" }, { status: 400 });
}

/**
 * Read-only wallet + ledger view for a staff member inspecting one customer.
 *
 * GATED LIKE THE PAYMENT TRACKER, because that is what it is: a view of money-equivalent value
 * held for a named customer. `getCurrentAdminAccessContext()` on its own was NOT that gate — it
 * resolves a context for any admin session and defaults an unresolved roster to `owner_admin` for
 * navigation, so by itself it let any authenticated admin read any customer's balance and their
 * entire credit history. `hasPaymentTrackerAccess()` is the same READ authority the
 * payment-tracker workspace page requires, and it is the correct one here.
 */
export async function GET(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }
  const ctx = await getCurrentAdminAccessContext();
  if (!ctx || !hasPaymentTrackerAccess(ctx)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const businessId = (request.nextUrl.searchParams.get("businessId") ?? "").trim();
  if (!businessId) return NextResponse.json({ ok: false, error: "businessId_required" }, { status: 400 });
  // The wallet is addressed by a canonical uuid and nothing else. Refusing a malformed id here
  // keeps a crafted value out of the query layer entirely, rather than trusting it to escape.
  if (!isUuid(businessId)) {
    return NextResponse.json({ ok: false, error: "businessId_invalid" }, { status: 400 });
  }

  const db = getAdminSupabase();
  const { data: wallet } = await db
    .from("leonix_rewards_wallets")
    .select("id, pending_cents, available_cents, reserved_cents, lifetime_earned_cents, lifetime_redeemed_cents, lifetime_reversed_cents")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!wallet) return NextResponse.json({ ok: true, wallet: null, activity: [] });

  const w = wallet as unknown as { id: string } & Record<string, number>;
  const { data: activity } = await db
    .from("leonix_rewards_ledger")
    // `actor_auth_user_id` is deliberately NOT selected, and neither is `meta`. Staff reviewing a
    // balance need to see WHAT moved and WHY; which colleague's auth id signed it, and the
    // internal reconciliation fields in meta, are not part of that job. Both remain on the
    // immutable ledger row and in the revenue audit log, where an investigation reaches them
    // under its own authorization instead of every reviewer receiving them in a browser response.
    .select("id, entry_type, amount_cents, source_kind, reason, created_at, balance_available_after")
    .eq("wallet_id", w.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ ok: true, wallet, activity: activity ?? [] });
}
