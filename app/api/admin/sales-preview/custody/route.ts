/**
 * LEONIX QUICK SALES WORKSPACE — establish server-issued assisted custody.
 *
 * POST { category, businessId, clientUserId?, listingId? }
 *
 * This is the ONE place a staff member acquires authority to prepare a Quick ad on a customer's
 * behalf, and the one place the canonical row id is BOUND to that authority. Everything after it
 * — the four existing intakes, the four existing assisted save endpoints, the preview link — reads
 * the context this route issued and never invents one.
 *
 * What it refuses, and why each refusal is not optional:
 *  - No staff session with `assisted_category_publishing` → there is no actor.
 *  - An unknown category → a context scoped to nothing is a context scoped to everything.
 *  - A client user who is not an ACTIVE member of this business → the id would be written into the
 *    listing's owner column, where every later authorization check reads it.
 *  - A listing id this business does not hold in the custody ledger → binding it would hand a
 *    staff member a signed pointer at someone else's row.
 *
 * It issues a cookie and nothing else. It cannot publish, cannot take payment, and grants the
 * prospect nothing at all.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import {
  ASSISTED_PUBLISH_MAX_AGE_SEC,
  applyAssistedPublishingCookie,
  readActiveAssistedPublishingContext,
} from "@/app/lib/auth/assistedPublishingSession";
import { isListingLinkedToBusiness } from "@/app/lib/business/assistedListingCustody";
import { readListingPackagePaymentAuthority } from "@/app/lib/listingPlans/listingPackagePaymentAuthorityServer";
import { isClientAuthorizedForBusiness } from "@/app/lib/sales/assistedClientAuthorization";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { QUICK_SALES_CATEGORY_MAP, isQuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import {
  resolveStaffBusinessPackage,
  staffIntakePathForCategory,
} from "@/app/lib/sales/staffBusinessProduct";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — what the server believes right now: which context is live, which canonical row it is bound
 * to, and whether the money for that row has actually cleared. The workspace reads publication
 * readiness from HERE, never from anything the browser is holding.
 */
export async function GET(request: NextRequest) {
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }
  const ctx = await readActiveAssistedPublishingContext(request.cookies);
  if (!ctx || !isQuickSalesCategory(ctx.category)) {
    return NextResponse.json({ ok: true, context: null }, { headers: { "cache-control": "no-store" } });
  }
  const descriptor = QUICK_SALES_CATEGORY_MAP[ctx.category];
  const listingId = typeof ctx.listingId === "string" ? ctx.listingId : "";
  const resolved = resolveStaffBusinessPackage({
    category: ctx.category,
    livePackageKey: ctx.packageKey,
  });
  const plan = resolved.ok && resolved.plan ? resolved.plan : null;
  const packageKey = resolved.ok && resolved.packageKey ? resolved.packageKey : ctx.packageKey ?? null;
  const boundPackageKey = typeof ctx.packageKey === "string" ? ctx.packageKey.trim() : "";
  const paymentDecision =
    listingId && boundPackageKey
      ? await readListingPackagePaymentAuthority({
          listingSource: descriptor.listingSource,
          listingId,
          packageKey: boundPackageKey,
          category: ctx.category,
        })
      : null;
  const paymentCleared = paymentDecision?.ok === true;
  const paymentState = listingId
    ? paymentCleared
      ? "cleared"
      : paymentDecision && !paymentDecision.ok && paymentDecision.error === "wrong_package"
        ? "wrong_package"
        : "not_cleared"
    : "no_listing";
  return NextResponse.json(
    {
      ok: true,
      context: {
        category: ctx.category,
        businessId: ctx.businessId,
        listingId: listingId || null,
        clientUserId: typeof ctx.clientUserId === "string" ? ctx.clientUserId : null,
        listingSource: descriptor.listingSource,
        intakePath: staffIntakePathForCategory(ctx.category, plan, descriptor.intakePath),
        saveEndpoint: descriptor.saveEndpoint,
        assistedAction: ctx.assistedAction ?? null,
        packageKey,
        plan,
        expiresAtMs: ctx.expiresAtMs,
        paymentState,
        publishReady: paymentCleared,
      },
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!isQuickSalesCategory(category)) {
    return NextResponse.json({ ok: false, error: "invalid_category" }, { status: 400 });
  }
  const descriptor = QUICK_SALES_CATEGORY_MAP[category];

  const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  if (!businessId) {
    return NextResponse.json({ ok: false, error: "business_id_required" }, { status: 400 });
  }

  const clientUserId = typeof body.clientUserId === "string" ? body.clientUserId.trim() : "";
  if (descriptor.requiresClientUserId && !clientUserId) {
    return NextResponse.json({ ok: false, error: "client_user_id_required" }, { status: 400 });
  }
  if (clientUserId) {
    const authorized = await isClientAuthorizedForBusiness({ businessId, clientUserId });
    if (!authorized) {
      await recordSalesWorkspaceAudit({
        action: "quick_sales_custody_established",
        actorRosterId: access.actor.rosterId,
        businessId,
        clientUserId,
        category,
        listingSource: descriptor.listingSource,
        outcome: "client_not_authorized_for_business",
      });
      return NextResponse.json({ ok: false, error: "client_not_authorized_for_business" }, { status: 403 });
    }
  }

  // Reopening an existing draft: the custody ledger, not the browser, decides whether this
  // business holds this row. A bound id that failed this check would be a signed pointer at
  // someone else's listing.
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const live = await readActiveAssistedPublishingContext(request.cookies);
  const liveSameScope =
    Boolean(live) && live!.businessId === businessId && live!.category === category;
  const resolvedPackage = resolveStaffBusinessPackage({
    category,
    requestedPlan: body.plan,
    requestedPackageKey: body.packageKey,
    livePackageKey: liveSameScope ? live!.packageKey : null,
  });
  if (!resolvedPackage.ok) {
    return NextResponse.json({ ok: false, error: resolvedPackage.error }, { status: 400 });
  }
  const packageKey = resolvedPackage.packageKey;
  const plan = resolvedPackage.plan;
  if (listingId) {
    const linked = await isListingLinkedToBusiness({
      businessId,
      listingSource: descriptor.listingSource,
      listingId,
    });
    if (!linked) {
      await recordSalesWorkspaceAudit({
        action: "quick_sales_custody_established",
        actorRosterId: access.actor.rosterId,
        businessId,
        clientUserId: clientUserId || null,
        category,
        listingSource: descriptor.listingSource,
        listingId,
        outcome: "listing_not_linked_to_business",
      });
      return NextResponse.json({ ok: false, error: "listing_not_linked_to_business" }, { status: 403 });
    }
  }

  const res = NextResponse.json({
    ok: true,
    category,
    businessId,
    listingId: listingId || null,
    listingSource: descriptor.listingSource,
    intakePath: staffIntakePathForCategory(category, plan, descriptor.intakePath),
    saveEndpoint: descriptor.saveEndpoint,
    assistedAction: "save_for_client",
    packageKey,
    plan,
    expiresInSec: ASSISTED_PUBLISH_MAX_AGE_SEC,
  });

  // Fails closed: when ASSISTED_PUBLISHING_SESSION_SECRET is absent no token can be minted, the
  // cookie is explicitly CLEARED rather than left stale, and the caller is told the truth.
  const applied = applyAssistedPublishingCookie(res, {
    businessId,
    category,
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    listingId: listingId || null,
    clientUserId: clientUserId || null,
    assistedAction: "save_for_client",
    packageKey,
  });
  if (!applied) {
    return NextResponse.json({ ok: false, error: "assisted_context_unavailable" }, { status: 503 });
  }

  await recordSalesWorkspaceAudit({
    action: "quick_sales_custody_established",
    actorRosterId: access.actor.rosterId,
    businessId,
    clientUserId: clientUserId || null,
    category,
    listingSource: descriptor.listingSource,
    listingId: listingId || null,
    outcome: "ok",
  });

  return res;
}
