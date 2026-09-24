import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireRevenueProtectedWriteAccess } from "@/app/admin/_lib/adminAccessControl";
import {
  runRewardsReservationExpirySweep,
  runRewardsSettlementPromotionSweep,
} from "@/app/lib/rewards/rewardsFulfillment";
import { CARD_SETTLEMENT_PENDING_DAYS, REDEMPTION_RESERVATION_MINUTES } from "@/app/lib/rewards/rewardsPolicy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * LEONIX IX REWARDS — the scheduled maintenance seam.
 *
 * TWO JOBS, ONE ENDPOINT, because they share an authorization posture and both are pure
 * catch-up work that must run whether or not anyone visits a page:
 *
 *   1. SETTLEMENT PROMOTION — card credits earned more than 30 calendar days ago become
 *      spendable, provided the payment was not refunded, disputed, reversed or otherwise
 *      invalidated in the meantime.
 *   2. RESERVATION EXPIRY — checkout holds older than 30 minutes are released, so an abandoned
 *      checkout never keeps a customer's balance out of reach.
 *
 * Both are idempotent: promotion is keyed on `promote:payment:<id>` and release on
 * `release:<ref>`, so a double-fired cron, an overlapping run, a retry or a manual re-run moves
 * nothing twice.
 *
 * AUTHORIZATION — modelled exactly on /api/revenue-os/admin/subscription-sweep, deliberately, so
 * there is ONE scheduler posture in this codebase rather than a second one invented here.
 *
 *   POST: a fully-verified super_admin staff session (requireRevenueProtectedWriteAccess()), OR
 *         an `x-leonix-rewards-sweep-key` header matching LEONIX_REWARDS_SWEEP_KEY.
 *   GET:  `Authorization: Bearer <CRON_SECRET>` only — Vercel Cron's own documented convention,
 *         and the only mechanism a scheduled invocation can actually present.
 *
 * FAIL CLOSED. Every comparison below returns false when its env var is UNSET or empty. A
 * deployment that forgets to configure the secret gets 401 on every call — it does not get an
 * open money endpoint. The comparison is constant-time, and the env value is never logged or
 * echoed in a response; only the NAME appears, here in this comment.
 *
 * NOT SCHEDULED BY THIS CHANGE. The cron entry is authored in `vercel.json` as configuration
 * only. Nothing here deploys, and no schedule is activated by committing it.
 */
function machineKeyAuthorized(request: NextRequest): boolean {
  const configured = process.env.LEONIX_REWARDS_SWEEP_KEY?.trim();
  // Unset secret => no machine path. Fail closed.
  if (!configured) return false;
  const provided = request.headers.get("x-leonix-rewards-sweep-key")?.trim() ?? "";
  if (!provided || provided.length !== configured.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(configured, "utf8"));
  } catch {
    return false;
  }
}

function vercelCronAuthorized(request: NextRequest): boolean {
  const configured = process.env.CRON_SECRET?.trim();
  // Unset secret => no cron path. Fail closed.
  if (!configured) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!provided || provided.length !== configured.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, "utf8"), Buffer.from(configured, "utf8"));
  } catch {
    return false;
  }
}

async function runRewardsSweeps(opts: { dryRun: boolean; limit?: number }) {
  // Expiry first: a hold released now frees `available` that a promotion posted in the same run
  // would otherwise be reported against inconsistently. Order is a reporting nicety, not a
  // correctness requirement — both are independently idempotent.
  const expiry = await runRewardsReservationExpirySweep({ dryRun: opts.dryRun, limit: opts.limit });
  const promotion = await runRewardsSettlementPromotionSweep({ dryRun: opts.dryRun, limit: opts.limit });

  return NextResponse.json({
    ok: expiry.ok && promotion.ok,
    dryRun: opts.dryRun === true,
    policy: {
      settlementDays: CARD_SETTLEMENT_PENDING_DAYS,
      reservationMinutes: REDEMPTION_RESERVATION_MINUTES,
    },
    reservationExpiry: expiry,
    settlementPromotion: promotion,
  });
}

export async function POST(request: NextRequest) {
  let authorized = machineKeyAuthorized(request);
  if (!authorized) {
    const access = await requireRevenueProtectedWriteAccess();
    authorized = access.ok;
  }
  if (!authorized) {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }

  let body: { dryRun?: boolean; limit?: number } = {};
  try {
    body = (await request.json()) as { dryRun?: boolean; limit?: number };
  } catch {
    /* empty body allowed */
  }

  return runRewardsSweeps({ dryRun: body.dryRun === true, limit: body.limit });
}

/** Vercel Cron's actual invocation mechanism: a GET request, `CRON_SECRET`-authorized only. */
export async function GET(request: NextRequest) {
  if (!vercelCronAuthorized(request)) {
    return NextResponse.json({ ok: false, code: "unauthorized" }, { status: 401 });
  }
  return runRewardsSweeps({ dryRun: false });
}
