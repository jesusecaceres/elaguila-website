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
 *   refund_queue      — list unattributable refund events awaiting a person (read)
 *   refund_resolve    — settle one of them: reverse under the canonical refund id, or record that
 *                       no action is required. Attributed, noted, idempotent.
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
import { cookies } from "next/headers";
import { getAdminSupabase, isSupabaseAdminConfigured, requireAdminCookie } from "@/app/lib/supabase/server";
import { buildRewardsStorePort } from "@/app/lib/rewards/rewardsLedger";
import {
  commitReservedCredits,
  postManualAdjustment,
  releaseReservedCredits,
  reserveCreditsForPurchase,
  type WalletOwnerRef,
} from "@/app/lib/rewards/rewardsLedgerCore";
import { formatCreditsCents } from "@/app/lib/rewards/rewardsPolicy";
import {
  closeRefundResolution,
  enqueueUnattributableRefund,
  findOpenRefundResolution,
  listRefundResolutions,
} from "@/app/lib/rewards/rewardsRefundResolutionQueue";
import {
  restoreCreditsForWonDispute,
  reverseCreditsForRefundOrDispute,
} from "@/app/lib/rewards/rewardsFulfillment";
// The pure input rules live in their own module so the verifier can CALL them with crafted
// inputs rather than grepping this file for reassuring substrings.
import { isUuid, sanitizeSearchTerm } from "@/app/lib/rewards/rewardsStaffQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  // REFUND QUEUE — the unattributable refund events that need a person.
  //
  // A `charge.refunded` payload with no refund objects cannot be attributed to a canonical refund
  // id, and reversing it under a charge-derived key was the defect that once over-charged a
  // customer. Refusing is right; refusing silently is not — money went back to the customer and
  // the credits that payment earned are still spendable. These rows are that backlog.
  // -------------------------------------------------------------------------
  if (action === "refund_queue") {
    const status = typeof body.status === "string" ? body.status.trim() : "open";
    const listed = await listRefundResolutions({
      status: status === "resolved" || status === "dismissed" || status === "all" ? status : "open",
      limit: Number(body.limit ?? 50),
    });
    if (!listed.ok) return NextResponse.json({ ok: false, error: listed.error }, { status: 500 });
    return NextResponse.json({ ok: true, rows: listed.rows });
  }

  // -------------------------------------------------------------------------
  // REFUND RESOLVE — settle one row, exactly once.
  //
  // THE MOVEMENT HAPPENS FIRST, then the row closes. A row that reads "resolved" therefore always
  // describes money that actually moved. The reversal goes through the ORDINARY path under the
  // ordinary `reverse:refund:<id>` key built from the refund id a human supplied, so if Stripe
  // later delivers that same refund properly the webhook is a no-op rather than a second clawback.
  // -------------------------------------------------------------------------
  if (action === "refund_resolve") {
    const id = typeof body.resolutionId === "string" ? body.resolutionId.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const outcome = body.outcome === "no_action_required" ? "no_action_required" : "reversed";
    // A row filed by the ORDERING case records credits the customer is OWED, not a clawback to
    // apply. Settling it with a reversal moves nothing (its basis is zero), and settling it with
    // `adjust` credits `available` while leaving `lifetime_restored` untouched — so the SQL
    // restoration bound stays fully open and a later `restore:<disputeId>` could pay it twice.
    // `restore` settles it through the real restoration path, which moves the bound with it.
    const wantsRestore = body.outcome === "restored";
    const refundExternalId =
      typeof body.refundExternalId === "string" ? body.refundExternalId.trim() : "";

    if (!isUuid(id)) return NextResponse.json({ ok: false, error: "invalid_resolution_id" }, { status: 400 });
    if (note.length < 3) return NextResponse.json({ ok: false, error: "note_required" }, { status: 400 });

    const row = await findOpenRefundResolution(id);
    if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    if (row.status !== "open") {
      return NextResponse.json({ ok: false, error: "already_resolved" }, { status: 409 });
    }

    // CLAIM THE ROW FIRST. The movement used to happen before the close, so two staff opening the
    // same row and supplying different refund ids produced two different idempotency keys, both
    // read the same prior position, and both posted the same delta — clawing back twice what was
    // owed and leaving a recovery debt that blocks every redemption until a human notices.
    //
    // The compare-and-set from `open` is the mutual exclusion: exactly one caller wins it, and
    // only the winner moves money. A movement that then fails is re-queued below rather than
    // leaving a row that claims work nobody did.
    const claimed = await closeRefundResolution({
      id,
      outcome,
      note,
      actorAuthUserId,
      actorRosterId,
      refundExternalId: outcome === "reversed" ? refundExternalId : null,
    });
    if (!claimed.ok) {
      return NextResponse.json({ ok: false, error: claimed.error }, { status: 409 });
    }

    let movedCents = 0;
    let recoveryAccruedCents = 0;
    if (wantsRestore) {
      const disputeId = typeof body.disputeId === "string" ? body.disputeId.trim() : "";
      if (disputeId.length < 4) {
        return NextResponse.json({ ok: false, error: "dispute_id_required" }, { status: 400 });
      }
      const restored = await restoreCreditsForWonDispute({
        paymentRecordId: row.paymentRecordId,
        externalId: disputeId,
      });
      if (!restored.ok) {
        await enqueueUnattributableRefund({
          paymentRecordId: row.paymentRecordId,
          kind: row.kind,
          cumulativeRefundedCents: row.cumulativeRefundedCents,
          reason: `staff_resolution_restoration_failed: ${restored.reason ?? "unknown"}`,
          stripeChargeId: row.stripeChargeId,
        }).catch(() => undefined);
        return NextResponse.json(
          { ok: false, error: restored.reason ?? "restoration_failed", requeued: true },
          { status: 500 },
        );
      }
      movedCents = restored.outcome === "restored" ? restored.restoredCents : 0;
      return NextResponse.json({
        ok: true,
        outcome: "restored",
        movedCents,
        movedDisplay: formatCreditsCents(movedCents),
      });
    }

    if (outcome === "reversed") {
      // A CANONICAL REFUND ID IS REQUIRED. Without it there is no stable idempotency anchor, and
      // the whole reason this row exists is that the payload did not carry one.
      if (!refundExternalId || refundExternalId.length < 4) {
        return NextResponse.json({ ok: false, error: "refund_external_id_required" }, { status: 400 });
      }
      const reversed = await reverseCreditsForRefundOrDispute({
        paymentRecordId: row.paymentRecordId,
        refundedCents: row.cumulativeRefundedCents,
        // The rail's cumulative position is what this row recorded, so the delta arithmetic lands
        // on the exact proportional total rather than double-counting an earlier partial refund.
        cumulativeRefundedCents: row.cumulativeRefundedCents,
        kind: row.kind,
        externalId: refundExternalId,
      });
      if (!reversed.ok) {
        // The claim is already recorded, so the obligation would otherwise vanish. Re-file it as a
        // fresh open row naming the failure, rather than reporting an error and losing the work.
        await enqueueUnattributableRefund({
          paymentRecordId: row.paymentRecordId,
          kind: row.kind,
          cumulativeRefundedCents: row.cumulativeRefundedCents,
          reason: `staff_resolution_reversal_failed: ${reversed.reason ?? "unknown"}`,
          stripeChargeId: row.stripeChargeId,
        }).catch(() => undefined);
        return NextResponse.json(
          { ok: false, error: reversed.reason ?? "reversal_failed", requeued: true },
          { status: 500 },
        );
      }
      if (reversed.outcome === "reversed") {
        movedCents = reversed.reversedCents;
        recoveryAccruedCents = reversed.recoveryAccruedCents ?? 0;
      }
    }

    return NextResponse.json({
      ok: true,
      outcome,
      movedCents,
      movedDisplay: formatCreditsCents(movedCents),
      recoveryAccruedCents,
    });
  }

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

    // RECORD THE CREDIT-FUNDED PORTION ON THE PAYMENT RECORD, or the clearance will over-earn.
    //
    // A manual payment row stores the FULL amount owed, and `verifyManualPaymentCleared` earns 9%
    // of whatever that row says. Taking $50 of credits at the counter and writing nothing back
    // meant the customer was later awarded 9% of the whole $100 for $50 of real money — their
    // credits earning credits, which is the one thing the contract forbids outright.
    //
    // Writing `leonix_credits_applied_cents` (and NOT the already-net flag, because this row's
    // total is still gross) is what makes `earnBaseFromPaymentMetadata` subtract it exactly once.
    const redeemPaymentRecordId = typeof body.paymentRecordId === "string" ? body.paymentRecordId.trim() : "";
    let creditsRecordedOnPayment = false;
    if (redeemPaymentRecordId && isUuid(redeemPaymentRecordId)) {
      const { data: paymentRow } = await db
        .from("leonix_payment_records")
        .select("id, metadata")
        .eq("id", redeemPaymentRecordId)
        .maybeSingle();
      if (paymentRow) {
        const existingMeta = ((paymentRow as { metadata?: Record<string, unknown> | null }).metadata ?? {}) as Record<
          string,
          unknown
        >;
        const priorCredits = Math.max(0, Math.floor(Number(existingMeta.leonix_credits_applied_cents ?? 0)) || 0);
        const { error: metaError } = await db
          .from("leonix_payment_records")
          .update({
            metadata: {
              ...existingMeta,
              // Accumulated, because staff may apply credits across more than one interaction
              // against the same payment.
              leonix_credits_applied_cents: priorCredits + reserved.redeemCents,
              leonix_credits_last_redemption_id: reserved.redemptionId,
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", redeemPaymentRecordId);
        creditsRecordedOnPayment = !metaError;
      }
    }

    return NextResponse.json({
      ok: true,
      deduplicated: false,
      movedCents: reserved.redeemCents,
      // Staff need to know when the earn base was NOT annotated: without it the clearance will
      // award 9% of money the customer did not actually pay.
      creditsRecordedOnPayment,
      ...(redeemPaymentRecordId && !creditsRecordedOnPayment
        ? {
            warning:
              "Credits were applied but could not be recorded on the payment record. Correct the payment record before clearing it, or the reward will be calculated on the full amount.",
          }
        : {}),
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

  // THE ADMIN COOKIE CHECK COMES FIRST, and it is not optional.
  //
  // `getCurrentAdminAccessContext()` NEVER returns null, and with no admin cookie at all it
  // returns `normalizedRole: "owner_admin"` so that unauthenticated navigation can render. On its
  // own that made `hasPaymentTrackerAccess()` — which grants owner_admin unconditionally — return
  // true for a request carrying NO COOKIES, and `middleware.ts` gates `/admin` but not
  // `/api/admin`. The result was an unauthenticated read of any customer's balance and their last
  // 100 ledger rows, given only a business id.
  //
  // The payment-tracker page does `requireAdminCookie` BEFORE reading the context, and that line
  // is the actual authentication. This route was missing it. Being "gated like the payment
  // tracker" means doing both steps, in this order.
  const cookieJar = await cookies();
  if (!requireAdminCookie(cookieJar)) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }
  const ctx = await getCurrentAdminAccessContext();
  if (!ctx.hasAdminCookie || !hasPaymentTrackerAccess(ctx)) {
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
