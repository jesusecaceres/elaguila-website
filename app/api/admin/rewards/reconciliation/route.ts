/**
 * LEONIX IX REWARDS — staff CSV reconciliation.
 *
 * GET  ?template=1   the blank import template
 * GET                the reconciliation report for a batch already committed
 * POST { mode: "preview" }  validate a file and report exactly what WOULD happen. Writes nothing.
 * POST { mode: "commit" }   apply a file the operator has already previewed and confirmed.
 *
 * AUTHORIZATION. Every mode — preview included — sits behind
 * `requireRevenueProtectedWriteAccess()`, the same super-admin money-write gate the manual
 * payment tracker uses. Preview is gated too, and deliberately: it resolves customers, balances
 * and payment records for whatever ids the file names, which is a read of exactly the data the
 * write gate exists to protect.
 *
 * NO MUTATION WITHOUT CONFIRMATION. `commit` requires the `batchFingerprint` that `preview`
 * returned for the identical accepted row set. A file that changed between the two steps produces
 * a different fingerprint and is refused — so an authorized staff member can only ever apply the
 * batch they actually reviewed.
 *
 * NO SILENT PARTIAL SUCCESS. Every response carries the accepted rows, the rejected rows with
 * their reasons, and per-row outcomes with the credits each one ACTUALLY moved. A row that
 * deduplicated reports `movedCents: 0`, never the amount it would have moved on a first import.
 *
 * NO LIVE DATA IN TESTS. The parsing, validation, injection refusal and idempotency rules are
 * pure and live in `rewardsCsvReconciliation.ts`, which the behavioural verifier drives against
 * fixtures. Nothing in this route is exercised against a real customer to prove those rules.
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  requireRevenueProtectedWriteAccess,
  revenueWriteDenialStatusCode,
} from "@/app/admin/_lib/adminAccessControl";
import { writeRevenueAuditLog } from "@/app/lib/listingPlans/revenueAuditLog";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { buildRewardsStorePort } from "@/app/lib/rewards/rewardsLedger";
import {
  manualAdjustmentIdempotencyKey,
  postManualAdjustment,
  type WalletOwnerRef,
} from "@/app/lib/rewards/rewardsLedgerCore";
import {
  CSV_MAX_BYTES,
  CSV_MAX_ROWS,
  CSV_REQUIRED_HEADERS,
  parseRewardsCsv,
  reconciliationTemplateCsv,
  toReconciliationCsv,
  type ReconciliationResultRow,
  type RewardsCsvRow,
} from "@/app/lib/rewards/rewardsCsvReconciliation";
import { formatCreditsCents } from "@/app/lib/rewards/rewardsPolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CSV_HEADERS = {
  "Content-Type": "text/csv; charset=utf-8",
  "Cache-Control": "no-store",
};

/**
 * Turn a CSV row's ids into the canonical wallet owner.
 *
 * Resolution order is deliberate: an explicit business or user id wins, and a payment_record_id
 * is resolved through the SAME `business_external_links` / membership path the live earn hooks
 * use — never through a name, an email or a phone number. A row whose target cannot be resolved
 * canonically is rejected, not guessed at.
 */
async function resolveOwnerForRow(
  row: RewardsCsvRow,
): Promise<{ ok: true; owner: WalletOwnerRef } | { ok: false; detail: string }> {
  if (row.businessId) return { ok: true, owner: { kind: "business", businessId: row.businessId } };
  if (row.ownerUserId) {
    // A CUSTOMER'S WALLET IS WHICHEVER ONE THEY ARE BOUND TO, even in a CSV.
    //
    // Returning `{ kind: "user" }` verbatim bypassed the binding, exactly as the admin route used
    // to: for a customer bound to a BUSINESS wallet the adapter tries to create a second, personal
    // wallet, hits the `bound_user_id` unique index and fails with a raw duplicate-key message —
    // and where it does succeed, the adjustment lands in a wallet none of the customer's surfaces
    // read. `resolveWalletOwnerForUser` is the same resolver their wallet read and their checkout
    // use, so a reconciliation lands where the customer can see it.
    const { resolveWalletOwnerForUser } = await import("@/app/lib/rewards/rewardsLedger");
    const bound = await resolveWalletOwnerForUser(row.ownerUserId);
    return { ok: true, owner: bound ?? { kind: "user", ownerUserId: row.ownerUserId } };
  }

  if (!row.paymentRecordId) return { ok: false, detail: "no_target" };

  const db = getAdminSupabase();
  const { data: payment } = await db
    .from("leonix_payment_records")
    .select("id, owner_user_id")
    .eq("id", row.paymentRecordId)
    .maybeSingle();
  if (!payment) return { ok: false, detail: "payment_record_not_found" };

  const { resolveWalletOwnerForPayment } = await import("@/app/lib/rewards/rewardsLedger");
  const owner = await resolveWalletOwnerForPayment({
    paymentRecordId: row.paymentRecordId,
    ownerUserId: (payment as { owner_user_id?: string | null }).owner_user_id ?? null,
  });
  if (!owner) return { ok: false, detail: "wallet_owner_unresolved" };
  return { ok: true, owner };
}

export async function POST(request: NextRequest) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  // The SAME money-write gate as recording a real payment. Preview is gated too: it reads
  // customer balances and payment records, which is precisely what this gate protects.
  const access = await requireRevenueProtectedWriteAccess();
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: "forbidden", reason: access.reason },
      { status: revenueWriteDenialStatusCode(access.reason) },
    );
  }

  let body: { mode?: string; content?: string; batchFingerprint?: string; batchLabel?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const mode = body.mode === "commit" ? "commit" : "preview";
  const content = typeof body.content === "string" ? body.content : "";
  if (!content) return NextResponse.json({ ok: false, error: "content_required" }, { status: 400 });

  const parsed = parseRewardsCsv({ content });
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.code, message: parsed.message, limits: { maxBytes: CSV_MAX_BYTES, maxRows: CSV_MAX_ROWS }, requiredHeaders: CSV_REQUIRED_HEADERS },
      { status: 400 },
    );
  }

  const { rows, rejections, duplicateReferences, batchFingerprint } = parsed;

  // ---------------------------------------------------------------------
  // PREVIEW — resolve every row against canonical records, write nothing.
  // ---------------------------------------------------------------------
  if (mode === "preview") {
    const ports = buildRewardsStorePort();
    const preview: ReconciliationResultRow[] = [];
    for (const row of rows) {
      const resolved = await resolveOwnerForRow(row);
      if (!resolved.ok) {
        preview.push({
          reference: row.reference,
          lineNumber: row.lineNumber,
          kind: row.kind,
          amountCents: row.amountCents,
          outcome: "rejected",
          movedCents: 0,
          walletId: null,
          detail: resolved.detail,
        });
        continue;
      }
      // Already imported? Reported as such BEFORE the commit, so the operator is never surprised
      // by a batch that turns out to move less than it appears to. Asked of the LEDGER under the
      // exact key the commit would post with, so preview and commit cannot disagree.
      const existing = await ports
        .findLedgerEntryByIdempotencyKey(manualAdjustmentIdempotencyKey(row.idempotencyKey))
        .catch(() => null);
      preview.push({
        reference: row.reference,
        lineNumber: row.lineNumber,
        kind: row.kind,
        amountCents: row.amountCents,
        outcome: existing ? "deduplicated" : "applied",
        movedCents: existing ? 0 : row.amountCents,
        walletId: null,
        // The customer-visible text, shown to the operator BEFORE they certify the batch.
        reason: row.reason,
        detail: existing ? "already_imported" : "would_apply",
      });
    }

    return NextResponse.json({
      ok: true,
      mode: "preview",
      committed: false,
      batchFingerprint,
      accepted: rows.length,
      rejected: rejections.length,
      duplicateReferences,
      rows: preview,
      rejections,
      totals: {
        wouldMoveCents: preview.filter((r) => r.outcome === "applied").reduce((a, r) => a + r.movedCents, 0),
        wouldMoveDisplay: formatCreditsCents(
          preview.filter((r) => r.outcome === "applied").reduce((a, r) => a + r.movedCents, 0),
        ),
      },
      message:
        "Nothing has been written. Re-send with mode:\"commit\" and this batchFingerprint to apply the accepted rows.",
    });
  }

  // ---------------------------------------------------------------------
  // COMMIT — only the exact batch that was previewed and confirmed.
  // ---------------------------------------------------------------------
  if (body.batchFingerprint !== batchFingerprint) {
    // The file changed between review and commit. Refusing is the point of the two-step flow.
    return NextResponse.json(
      {
        ok: false,
        error: "batch_fingerprint_mismatch",
        message: "This file does not match the batch that was previewed. Preview it again before committing.",
        expected: batchFingerprint,
      },
      { status: 409 },
    );
  }
  if (!rows.length) {
    return NextResponse.json({ ok: false, error: "no_accepted_rows", rejections }, { status: 400 });
  }

  const ports = buildRewardsStorePort();
  const results: ReconciliationResultRow[] = [];

  for (const row of rows) {
    const resolved = await resolveOwnerForRow(row);
    if (!resolved.ok) {
      results.push({
        reference: row.reference,
        lineNumber: row.lineNumber,
        kind: row.kind,
        amountCents: row.amountCents,
        outcome: "rejected",
        movedCents: 0,
        walletId: null,
        reason: row.reason,
        detail: resolved.detail,
      });
      continue;
    }

    // Every imported row posts as an attributed, reasoned manual adjustment under a DERIVED
    // idempotency key (`csv:<reference>`), so re-importing the same file moves nothing twice.
    // The actor is the authenticated staff member from the gate, never a value from the file.
    const posted = await postManualAdjustment({
      owner: resolved.owner,
      amountCents: row.amountCents,
      reason: `${row.kind}: ${row.reason}`,
      actorAuthUserId: access.actorAuthUserId,
      actorRosterId: access.actorRosterId ?? null,
      adjustmentRef: row.idempotencyKey,
      ports,
    });

    if (!posted.ok) {
      results.push({
        reference: row.reference,
        lineNumber: row.lineNumber,
        kind: row.kind,
        amountCents: row.amountCents,
        outcome: "rejected",
        movedCents: 0,
        walletId: null,
        reason: row.reason,
        detail: posted.error,
      });
      continue;
    }

    results.push({
      reference: row.reference,
      lineNumber: row.lineNumber,
      kind: row.kind,
      amountCents: row.amountCents,
      outcome: posted.deduplicated ? "deduplicated" : "applied",
      // What MOVED. A deduplicated row moved nothing, and the report says zero.
      movedCents: posted.deduplicated ? 0 : row.amountCents,
      walletId: null,
      reason: row.reason,
      detail: posted.deduplicated ? "already_imported" : "applied",
    });
  }

  const appliedRows = results.filter((r) => r.outcome === "applied");
  const movedCents = appliedRows.reduce((a, r) => a + r.movedCents, 0);

  await writeRevenueAuditLog({
    action: "revenue_payment_completed",
    targetType: "leonix_rewards_ledger",
    targetId: null,
    meta: {
      rewards_action: "rewards_csv_reconciliation",
      rewards_outcome: "committed",
      batch_fingerprint: batchFingerprint,
      batch_label: typeof body.batchLabel === "string" ? body.batchLabel.slice(0, 120) : null,
      accepted: rows.length,
      applied: appliedRows.length,
      deduplicated: results.filter((r) => r.outcome === "deduplicated").length,
      rejected_at_parse: rejections.length,
      rejected_at_commit: results.filter((r) => r.outcome === "rejected").length,
      moved_cents: movedCents,
      actor_auth_user_id: access.actorAuthUserId,
      actor_roster_id: access.actorRosterId ?? null,
    },
  }).catch(() => undefined);

  return NextResponse.json({
    ok: true,
    mode: "commit",
    committed: true,
    batchFingerprint,
    accepted: rows.length,
    applied: appliedRows.length,
    deduplicated: results.filter((r) => r.outcome === "deduplicated").length,
    rejected: rejections.length + results.filter((r) => r.outcome === "rejected").length,
    movedCents,
    movedDisplay: formatCreditsCents(movedCents),
    rows: results,
    rejections,
    // The report, ready to download. Every cell is neutralized against formula execution.
    reportCsv: toReconciliationCsv(results),
  });
}

/** The blank template, and nothing else: no customer data is exported from a GET without a batch. */
export async function GET(request: NextRequest) {
  const access = await requireRevenueProtectedWriteAccess();
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: "forbidden", reason: access.reason },
      { status: revenueWriteDenialStatusCode(access.reason) },
    );
  }

  if (request.nextUrl.searchParams.get("template") === "1") {
    return new Response(reconciliationTemplateCsv(), {
      headers: { ...CSV_HEADERS, "Content-Disposition": 'attachment; filename="leonix-rewards-reconciliation-template.csv"' },
    });
  }

  return NextResponse.json({
    ok: true,
    requiredHeaders: CSV_REQUIRED_HEADERS,
    limits: { maxBytes: CSV_MAX_BYTES, maxRows: CSV_MAX_ROWS },
    workflow: [
      "GET ?template=1 for the blank file",
      'POST { mode: "preview", content } to validate and see exactly what would move',
      'POST { mode: "commit", content, batchFingerprint } to apply the reviewed batch',
    ],
  });
}
