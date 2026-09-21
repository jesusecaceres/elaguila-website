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
import { buildRewardsStorePort, resolveWalletOwnerForUser } from "@/app/lib/rewards/rewardsLedger";
import {
  commitReservedCredits,
  postManualAdjustment,
  releaseReservedCredits,
  reserveCreditsForPurchase,
  reversalIdempotencyKey,
  type WalletOwnerRef,
} from "@/app/lib/rewards/rewardsLedgerCore";
import { formatCreditsCents } from "@/app/lib/rewards/rewardsPolicy";
import {
  RESTORATION_WORK_REASON_PREFIX,
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
import {
  queuedRefundAmountIsCumulative,
  refiledRefundResolution,
  resolutionIdempotencyAnchor,
} from "@/app/lib/rewards/rewardsPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The owner a staff action targets.
 *
 * Both ids must be canonical uuids: these values flow into wallet lookups, and a wallet is never
 * addressable by anything a human typed. An unparseable id is a refusal, not a best-effort match.
 */
async function ownerFromBody(body: Record<string, unknown>): Promise<WalletOwnerRef | null> {
  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  const ownerUserId = typeof body.ownerUserId === "string" ? body.ownerUserId.trim() : "";
  if (businessId) return isUuid(businessId) ? { kind: "business", businessId } : null;
  if (!ownerUserId) return null;
  if (!isUuid(ownerUserId)) return null;

  // A CUSTOMER'S WALLET IS WHICHEVER ONE THEY ARE BOUND TO, even when staff address them by user
  // id. Returning `{ kind: "user" }` verbatim bypassed the binding and broke in both directions:
  // for a customer bound to a BUSINESS wallet the adapter tried to create a second, personal
  // wallet, hit the `bound_user_id` unique index, and surfaced a raw duplicate-key string as a
  // 400 — every primary-owner customer who had ever earned was un-adjustable; and where it did
  // succeed it would have moved money into a wallet the customer's own surfaces never read.
  //
  // `resolveWalletOwnerForUser` is the same resolver the customer's wallet read and their
  // checkout use, so a staff correction lands exactly where the customer can see it.
  return (await resolveWalletOwnerForUser(ownerUserId)) ?? { kind: "user", ownerUserId };
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

    const disputeId = typeof body.disputeId === "string" ? body.disputeId.trim() : "";

    if (!isUuid(id)) return NextResponse.json({ ok: false, error: "invalid_resolution_id" }, { status: 400 });
    if (note.length < 3) return NextResponse.json({ ok: false, error: "note_required" }, { status: 400 });

    // EVERY REFUSAL HAPPENS BEFORE THE CLAIM. The claim CLOSES the row, so a validation that runs
    // after it returns a 400 to the operator while leaving the row `resolved` with nothing moved —
    // the obligation simply ceases to exist, invisibly, and the customer keeps credits for money
    // they got back. Two validations used to sit on the wrong side of that line: the canonical
    // refund id for a reversal, and the dispute id for a restoration. Both are pure checks on the
    // request, so both belong here, where a refusal costs nothing.
    if (wantsRestore && disputeId.length < 4) {
      return NextResponse.json({ ok: false, error: "dispute_id_required" }, { status: 400 });
    }
    if (!wantsRestore && outcome === "reversed" && (!refundExternalId || refundExternalId.length < 4)) {
      // Without a canonical refund id there is no stable idempotency anchor, and the whole reason
      // this row exists is that the payload did not carry one.
      return NextResponse.json({ ok: false, error: "refund_external_id_required" }, { status: 400 });
    }

    const row = await findOpenRefundResolution(id);
    if (!row) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    if (row.status !== "open") {
      return NextResponse.json({ ok: false, error: "already_resolved" }, { status: 409 });
    }

    // THE ROW'S OWN KIND IS THE AUTHORITY ON WHICH OUTCOME IS EVEN POSSIBLE.
    //
    // `wantsRestore` came from the request body and nothing compared it to the row. The API would
    // accept `reversed` on a won-dispute row — closing it as a clawback, moving nothing (its basis
    // is zero) and destroying the obligation — and `restored` on an ordinary refund row. The
    // screen's own discriminator is a render decision; this is the one that binds.
    //
    // `no_action_required` IS NOT A CONTRADICTION, AND REFUSING IT LEFT THE ROW UNCLOSEABLE.
    // Refusing every non-restore outcome meant a won-dispute row that genuinely needs nothing —
    // already settled by hand, a duplicate of a row already restored — had no working control at
    // all: Restore 409s `restoration_moved_nothing`, No-action 409s
    // `row_requires_restoration_outcome`, and the operator reads a raw error code either way. The
    // row stayed open for ever. What must be refused is `reversed`, which files a CLAWBACK as the
    // resolution of an obligation to give credits BACK; an audited, noted decision to close it
    // moving nothing is a legitimate staff outcome.
    if (row.isRestorationWork && !wantsRestore && outcome !== "no_action_required") {
      return NextResponse.json(
        { ok: false, error: "row_requires_restoration_outcome" },
        { status: 409 },
      );
    }
    if (!row.isRestorationWork && wantsRestore) {
      return NextResponse.json(
        { ok: false, error: "row_is_not_restoration_work" },
        { status: 409 },
      );
    }

    // THE IDEMPOTENCY ANCHOR COMES FROM THE ROW, NEVER FROM THE KEYBOARD.
    //
    // See `resolutionIdempotencyAnchor`. Checking a typed id against ids already on the ledger —
    // which is what the block below does — cannot catch the attack it was written for, because the
    // defining property of that attack is that the key is still FREE at the moment it is typed.
    // Taking the anchor from the row removes staff control over the key entirely; the block below
    // stays as a second line for rows whose own ref was filed wrong.
    const anchor = resolutionIdempotencyAnchor(row, wantsRestore ? disputeId : refundExternalId, {
      wantsRestore,
    });
    if (!anchor.ok) return NextResponse.json({ ok: false, error: anchor.error }, { status: 409 });
    const resolutionExternalId = anchor.anchor;

    // A TYPED ID THAT ALREADY BELONGS TO ANOTHER PAYMENT IS A TYPO, NOT A REVERSAL — AND THIS
    // REFUSES BEFORE THE CLAIM, like every other refusal on this path.
    //
    // `reverse:<kind>:<id>` is globally unique, and nothing checked that the id a human read off
    // Stripe belongs to THIS payment. One wrong character writes a reversal on payment A under
    // customer B's future refund id; when B's `charge.refunded` arrives the posting function finds
    // the key, deduplicates, and B's genuine clawback never happens while the ledger claims it
    // did. The amount is server-derived so nothing over-reverses — the damage is the poisoned key,
    // and it is silent.
    if (!wantsRestore && outcome === "reversed") {
      const existingUnderKey = await ports.findLedgerEntryByIdempotencyKey(
        reversalIdempotencyKey(row.kind, resolutionExternalId),
      );
      if (existingUnderKey) {
        const { data: ownerRow } = await db
          .from("leonix_rewards_ledger")
          .select("payment_record_id")
          .eq("id", existingUnderKey.id)
          .maybeSingle();
        const ownerPaymentId = (ownerRow as { payment_record_id?: string | null } | null)?.payment_record_id ?? null;
        if (ownerPaymentId && ownerPaymentId !== row.paymentRecordId) {
          return NextResponse.json(
            { ok: false, error: "refund_external_id_belongs_to_another_payment" },
            { status: 409 },
          );
        }
      }
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
      // A RESTORATION IS RECORDED AS A RESTORATION. Collapsing it into `reversed` made the audit
      // record state the opposite of the movement: credits given back, filed as clawed back.
      outcome: wantsRestore ? "restored" : outcome,
      note,
      actorAuthUserId,
      actorRosterId,
      refundExternalId: wantsRestore ? resolutionExternalId : outcome === "reversed" ? resolutionExternalId : null,
    });
    if (!claimed.ok) {
      return NextResponse.json({ ok: false, error: claimed.error }, { status: 409 });
    }

    let movedCents = 0;
    let recoveryAccruedCents = 0;
    if (wantsRestore) {
      const restored = await restoreCreditsForWonDispute({
        paymentRecordId: row.paymentRecordId,
        externalId: resolutionExternalId,
      });
      if (!restored.ok) {
        // `requeued` REPORTS WHAT HAPPENED. It used to be asserted unconditionally while the
        // enqueue's own `{ ok: false }` was discarded, so an operator could be told the work was
        // preserved at the exact moment it was lost.
        const refiled = await enqueueUnattributableRefund({
          paymentRecordId: row.paymentRecordId,
          kind: row.kind,
          cumulativeRefundedCents: row.cumulativeRefundedCents,
          // Prefixed, so the re-filed row is still recognised as restoration work and still
          // offers the only control that can settle it. Without the prefix it rendered as an
          // ordinary chargeback whose every button closes it having moved nothing.
          reason: `${RESTORATION_WORK_REASON_PREFIX}_retry${refiledRefundResolution(row, disputeId).evidenceSuffix}: staff_resolution_failed: ${restored.reason ?? "unknown"}`,
          stripeChargeId: row.stripeChargeId,
          // CARRIED THROUGH, NEVER INVENTED — see `refiledRefundResolution`. Keeping the row's own
          // `external_ref` is what keeps a payment's two unresolved disputes in two rows instead
          // of collapsing them at cumulative position zero and, just as importantly, what stops a
          // re-file turning a cumulative amount into a per-event one. The typed id is evidence in
          // the reason, never semantics in the key.
          externalRef: refiledRefundResolution(row, disputeId).externalRef,
        }).catch(() => ({ ok: false as const, error: "enqueue_threw" }));
        return NextResponse.json(
          { ok: false, error: restored.reason ?? "restoration_failed", requeued: refiled.ok },
          { status: 500 },
        );
      }
      // A RESTORATION THAT MOVED NOTHING IS NOT A RESOLUTION.
      //
      // `restoreCreditsForWonDispute` reports `skipped / nothing_was_reversed` when the dispute's
      // clawback has not arrived yet — which is the ORDERING case this row was filed for. The row
      // was already claimed, so returning 200 with `movedCents: 0` printed a green "Restored
      // $0.00" and closed the obligation: the clawback landed five minutes later, no key would
      // ever restore it, and the customer was silently charged their rewards for a dispute they
      // had won. `already_restored` is the genuine no-op — the credits are already back.
      const restoredReason = "reason" in restored ? String(restored.reason ?? "") : "";
      const quietSkip = restored.outcome === "skipped" && restoredReason === "already_restored";
      const movedNothing = restored.outcome !== "restored" && !quietSkip;
      if (movedNothing) {
        const refiled = await enqueueUnattributableRefund({
          paymentRecordId: row.paymentRecordId,
          kind: row.kind,
          cumulativeRefundedCents: row.cumulativeRefundedCents,
          // THE PREFIX IS LOAD-BEARING: it is what keeps the re-filed row classified as
          // restoration work, so the screen still offers the control that can settle it.
          reason: `${RESTORATION_WORK_REASON_PREFIX}_retry${refiledRefundResolution(row, disputeId).evidenceSuffix}: ${restoredReason || "moved_nothing"}`,
          stripeChargeId: row.stripeChargeId,
          // Same rule as above: the row's own ref, never one supplied by this call.
          externalRef: refiledRefundResolution(row, disputeId).externalRef,
        }).catch(() => ({ ok: false as const, error: "enqueue_threw" }));
        return NextResponse.json(
          { ok: false, error: restoredReason || "restoration_moved_nothing", requeued: refiled.ok },
          { status: 409 },
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
      // WHAT THE STORED AMOUNT MEANS DEPENDS ON WHY THE ROW EXISTS, AND THE ROW SAYS WHICH.
      //
      // A row with NO `external_ref` is the truncated-payload case: the rail gave a cumulative
      // `charge.amount_refunded` and no refund object to attribute it to, so the number IS the
      // cumulative position and must be passed as one.
      //
      // A row WITH an `external_ref` is one specific refund or dispute whose reversal failed, and
      // the number is that event's OWN amount. Passing a per-event amount as a cumulative position
      // was silently catastrophic: for a second $50.00 refund of a $100.00 payment the resolver
      // computed `max(0, 5000 - 5000) = 0`, moved nothing, returned 200, and closed the row as
      // `reversed` — while burning `reverse:refund:<id>` with a zero-amount entry so the real
      // delivery could never fix it. 450 credits written off with an audit row saying otherwise.
      const perEvent = !queuedRefundAmountIsCumulative(row);
      const reversed = await reverseCreditsForRefundOrDispute({
        paymentRecordId: row.paymentRecordId,
        refundedCents: row.cumulativeRefundedCents,
        cumulativeRefundedCents: perEvent ? null : row.cumulativeRefundedCents,
        kind: row.kind,
        externalId: resolutionExternalId,
      });
      if (!reversed.ok) {
        // The claim is already recorded, so the obligation would otherwise vanish. Re-file it as a
        // fresh open row naming the failure, rather than reporting an error and losing the work.
        const refiled = await enqueueUnattributableRefund({
          paymentRecordId: row.paymentRecordId,
          kind: row.kind,
          cumulativeRefundedCents: row.cumulativeRefundedCents,
          // A RE-FILE MUST NOT CHANGE WHAT THE AMOUNT MEANS.
          //
          // `external_ref` is not decoration: its presence is what says the stored amount is a
          // PER-EVENT figure, and its absence is what says the amount is a CUMULATIVE rail
          // position (the truncated-payload case, twenty lines above). Re-filing a cumulative row
          // with `?? refundExternalId` attached an external ref to a number it did not change,
          // flipping that number's meaning on the next resolution. Measured, on a $100.00 payment
          // that earned 900 with a first $25.00 refund already reversed: a second $25.00 refund
          // filed as cumulative 5000 then re-filed with an external ref reversed 675 instead of
          // 450 — 225 credits clawed back that the customer still owned, and on a spent balance
          // the excess would land as `recovery_cents` they never owed, freezing their redemptions.
          // The supplied id goes in the REASON, where it is evidence rather than semantics.
          reason: `staff_resolution_reversal_failed${refiledRefundResolution(row, refundExternalId).evidenceSuffix}: ${reversed.reason ?? "unknown"}`,
          stripeChargeId: row.stripeChargeId,
          externalRef: refiledRefundResolution(row, refundExternalId).externalRef,
        }).catch(() => ({ ok: false as const, error: "enqueue_threw" }));
        return NextResponse.json(
          { ok: false, error: reversed.reason ?? "reversal_failed", requeued: refiled.ok },
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
    const owner = await ownerFromBody(body);
    if (!owner) return NextResponse.json({ ok: false, error: "owner_required" }, { status: 400 });

    const requestedCents = Number(body.requestedCents);
    const amountDueCents = Number(body.amountDueCents);
    const redemptionRef = typeof body.redemptionRef === "string" ? body.redemptionRef.trim() : "";
    if (!Number.isFinite(requestedCents) || !Number.isFinite(amountDueCents) || !redemptionRef) {
      return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
    }

    // A RECORD THAT IS ALREADY NET OF CREDITS CANNOT TAKE MORE — AND THIS IS DECIDED FIRST.
    //
    // `createPendingPaymentRecord` writes `leonix_amount_is_net_of_credits: true` on every Revenue
    // OS checkout, and `earnBaseFromPaymentMetadata` then IGNORES `leonix_credits_applied_cents`
    // entirely — correctly, because that row's total was already reduced. Accumulating counter
    // credits onto such a row writes a number nothing will ever subtract, so a $100.00 record with
    // $50.00 of counter credits still earns 9% of the full $100.00. Credits earning credits is the
    // one thing the contract forbids outright.
    //
    // THE CHECK RAN AFTER THE RESERVE AND THE COMMIT. By the time it refused, `redeem_commit` had
    // already been posted: the customer's balance was $50.00 lighter, the redemption row said
    // `committed`, and staff saw a 409 and charged the counter price in full. Re-posting the same
    // reference returned `deduplicated`, so there was no recovery short of a manual adjustment.
    // It is the same error this file's refund-resolve path was repaired for — a refusal that runs
    // after the money has moved is not a refusal. The read is pure, so it belongs here.
    const redeemPaymentRecordId = typeof body.paymentRecordId === "string" ? body.paymentRecordId.trim() : "";
    if (redeemPaymentRecordId && isUuid(redeemPaymentRecordId)) {
      const { data: preRow } = await db
        .from("leonix_payment_records")
        .select("id, metadata")
        .eq("id", redeemPaymentRecordId)
        .maybeSingle();
      const preMeta = ((preRow as { metadata?: Record<string, unknown> | null } | null)?.metadata ?? {}) as Record<
        string,
        unknown
      >;
      if (preRow && preMeta.leonix_amount_is_net_of_credits === true) {
        return NextResponse.json(
          { ok: false, error: "payment_record_already_net_of_credits" },
          { status: 409 },
        );
      }
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
        // The pre-flight refusal above has already established this row is not already net of
        // credits; re-reading it here would be a second decision on a value that can no longer
        // change the outcome, because the money has moved.
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
    const owner = await ownerFromBody(body);
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

  // AND THE COOKIE IS NOT AUTHENTICATION. `requireAdminCookie` is `leonix_admin === "1"` — an
  // unsigned, unkeyed marker anyone can set — and `getCurrentAdminAccessContext()` defaults an
  // unresolved roster to `owner_admin`, which `hasPaymentTrackerAccess` grants unconditionally. A
  // single forged cookie therefore returned any named business's wallet balances and its last 100
  // ledger rows: another customer's money, to an unauthenticated caller.
  //
  // This response carries customer financial data, so it is gated by the same authority that can
  // MOVE that money: `requireRevenueProtectedWriteAccess` re-verifies the session against live
  // Supabase Auth, cross-checks the cookie email against the real auth email, looks the roster up
  // by `auth_user_id` rather than by email, and requires `super_admin`. The role check below then
  // still applies, so this only ever narrows who gets through.
  const readAccess = await requireRevenueProtectedWriteAccess();
  if (!readAccess.ok) {
    return NextResponse.json(
      { ok: false, error: "forbidden", reason: readAccess.reason },
      { status: revenueWriteDenialStatusCode(readAccess.reason) },
    );
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
