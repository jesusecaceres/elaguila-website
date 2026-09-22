/**
 * LEONIX QUICK SALES WORKSPACE — publish the SAME canonical row, after the money is in.
 *
 * POST {} → activates the listing the server-issued assisted context is bound to.
 *
 * THE ONE THING THIS MUST NEVER DO IS CREATE A LISTING. Publication here is a state transition on
 * the row the prospect already reviewed — the same id the draft was saved under, the same id the
 * preview link pointed at. There is no insert in this file. A workflow where "publish" makes a
 * second row is a workflow where the customer pays for an ad nobody previewed.
 *
 * PAYMENT IS RESOLVED SERVER-SIDE, FROM THE PAYMENT RECORD, EVERY TIME. There is no `paid` flag a
 * client can send, and no staff capability that skips the check: a staff actor who can reach this
 * route and whose customer has not paid gets a truthful 402 and an audited refusal, exactly like
 * every other assisted publish path in this codebase.
 *
 * The activation predicates below are the same ones the four assisted category routes use — a
 * compare-and-set from the pre-publish states only, so a concurrent moderation or webhook write is
 * never overwritten, and a zero-row result is reported rather than reported as success.
 *
 * CLEARED PAYMENT IS NECESSARY, NEVER SUFFICIENT. A `save_for_client` draft is allowed to be
 * incomplete on purpose. Before any status is written, the category's OWN publish-time contract is
 * re-run against the STORED row through `assessCanonicalPublishReadiness` — the same readiness,
 * media, product and required-child predicates the category route runs on a request body — and a
 * refusal is answered with the category route's own status and body, audited as a refusal.
 *
 * REPLAY IS REFUSED EXPLICITLY: a row that is already public answers 409 `already_published`
 * before the compare-and-set even runs, so a double tap is never reported as a second success.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { readActiveAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import { isListingLinkedToBusiness } from "@/app/lib/business/assistedListingCustody";
import { refuseUnlessAuthoritativePayment } from "@/app/lib/listingPlans/listingPackagePaymentAuthorityServer";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { activateAutosDealerListing, assessCanonicalPublishReadiness } from "@/app/lib/sales/canonicalPublishReadiness";
import {
  QUICK_SALES_CATEGORY_MAP,
  isQuickSalesCategory,
  type QuickSalesCategory,
} from "@/app/lib/sales/quickSalesCategories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Per-source: the column set that makes a row public, and the states it may be reached from. */
const ACTIVATION: Record<
  QuickSalesCategory,
  { table: string; patch: (nowIso: string) => Record<string, unknown>; fromStates: string[] }
> = {
  servicios: {
    table: "servicios_public_listings",
    patch: (nowIso) => ({ listing_status: "published", published_at: nowIso, updated_at: nowIso }),
    fromStates: ["draft", "pending_payment", "payment_failed", "paused"],
  },
  restaurantes: {
    table: "restaurantes_public_listings",
    patch: (nowIso) => ({ status: "published", published_at: nowIso, updated_at: nowIso }),
    fromStates: ["draft", "pending_payment", "payment_failed"],
  },
  autos: {
    table: "autos_classifieds_listings",
    patch: (nowIso) => ({ status: "active", published_at: nowIso, updated_at: nowIso }),
    fromStates: ["draft", "pending_payment", "payment_failed"],
  },
  "bienes-raices": {
    table: "listings",
    patch: (nowIso) => ({ status: "active", is_published: true, published_at: nowIso, updated_at: nowIso }),
    fromStates: ["pending", "draft", "payment_failed"],
  },
};

const STATUS_COLUMN: Record<QuickSalesCategory, string> = {
  servicios: "listing_status",
  restaurantes: "status",
  autos: "status",
  "bienes-raices": "status",
};

export async function POST(request: NextRequest) {
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }

  const ctx = await readActiveAssistedPublishingContext(request.cookies);
  if (!ctx || !isQuickSalesCategory(ctx.category)) {
    return NextResponse.json({ ok: false, error: "assisted_context_required" }, { status: 403 });
  }
  const category = ctx.category;
  const descriptor = QUICK_SALES_CATEGORY_MAP[category];

  const listingId = typeof ctx.listingId === "string" ? ctx.listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "no_bound_listing" }, { status: 409 });
  }

  const linked = await isListingLinkedToBusiness({
    businessId: ctx.businessId,
    listingSource: descriptor.listingSource,
    listingId,
  });
  if (!linked) {
    return NextResponse.json({ ok: false, error: "listing_not_linked_to_business" }, { status: 403 });
  }

  // PAYMENT FIRST, AND NOTHING IS WRITTEN BEFORE IT ANSWERS.
  // Exact listing + exact signed package. A Quick payment cannot publish Full.
  const packageKey = typeof ctx.packageKey === "string" ? ctx.packageKey.trim() : "";
  const paid = await refuseUnlessAuthoritativePayment({
    listingSource: descriptor.listingSource,
    listingId,
    packageKey: packageKey,
    category,
  });
  if (!paid.ok) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_publish_attempted",
      actorRosterId: ctx.rosterId,
      businessId: ctx.businessId,
      category,
      listingSource: descriptor.listingSource,
      listingId,
      paymentState: paid.paymentState,
      outcome: paid.error,
    });
    return NextResponse.json(
      {
        ok: false,
        error: paid.error,
        message: "Record and clear the payment first. The draft stays private until it clears.",
        listingId,
      },
      { status: 402 },
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "db_not_configured" }, { status: 503 });
  }

  // THE CATEGORY'S OWN CONTRACT, AGAINST THE STORED ROW, AFTER THE MONEY AND BEFORE ANY WRITE.
  // Nothing from the request body is read: listing, owner, product and readiness are all server
  // truth bound to the signed context.
  const readiness = await assessCanonicalPublishReadiness({
    category,
    listingId,
    assistedPackageKey: ctx.packageKey ?? null,
  });
  if (!readiness.ok) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_publish_attempted",
      actorRosterId: ctx.rosterId,
      businessId: ctx.businessId,
      category,
      listingSource: descriptor.listingSource,
      listingId,
      paymentState: "cleared",
      outcome: readiness.error,
      detail: { http_status: readiness.status },
    });
    return NextResponse.json({ ...readiness.body, listingId }, { status: readiness.status });
  }

  const nowIso = new Date().toISOString();
  const db = getAdminSupabase();
  let data: { id?: string } | null = null;
  let error: unknown = null;
  if (category === "autos") {
    // The dealer parent publishes WITH its required vehicle child, through the Quick-only
    // activation whose semantics mirror the (unchanged) Autos assisted route.
    if (!readiness.childListingId) {
      return NextResponse.json({ ok: false, error: "vehicle_listing_required_for_publish", listingId }, { status: 400 });
    }
    const activation = await activateAutosDealerListing({ mainListingId: listingId, vehicleListingId: readiness.childListingId });
    if (activation.ok) data = { id: listingId };
    else if (activation.status === 500) error = activation.error;
    else {
      // A zero-row child or parent write is a refusal with its own code, never a green tick.
      await recordSalesWorkspaceAudit({
        action: "quick_sales_publish_attempted",
        actorRosterId: ctx.rosterId,
        businessId: ctx.businessId,
        category,
        listingSource: descriptor.listingSource,
        listingId,
        paymentState: "cleared",
        outcome: activation.error,
      });
      return NextResponse.json({ ok: false, error: activation.error, listingId }, { status: activation.status });
    }
  } else {
    const plan = ACTIVATION[category];
    const res = await db
      .from(plan.table)
      .update(plan.patch(nowIso))
      .eq("id", listingId)
      .in(STATUS_COLUMN[category], plan.fromStates)
      .select("id")
      .maybeSingle();
    data = res.data as { id?: string } | null;
    error = res.error;
  }

  if (error) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_publish_attempted",
      actorRosterId: ctx.rosterId,
      businessId: ctx.businessId,
      category,
      listingSource: descriptor.listingSource,
      listingId,
      paymentState: "cleared",
      outcome: "activate_failed",
    });
    return NextResponse.json({ ok: false, error: "activate_failed", listingId }, { status: 500 });
  }
  if (!data?.id) {
    // Zero rows is not success: the row was not in a publishable state (already live, removed, or
    // moved on by a webhook). Staff are told, rather than shown a green tick over nothing.
    await recordSalesWorkspaceAudit({
      action: "quick_sales_publish_attempted",
      actorRosterId: ctx.rosterId,
      businessId: ctx.businessId,
      category,
      listingSource: descriptor.listingSource,
      listingId,
      paymentState: "cleared",
      outcome: "status_transition_not_allowed",
    });
    return NextResponse.json({ ok: false, error: "status_transition_not_allowed", listingId }, { status: 409 });
  }

  await recordSalesWorkspaceAudit({
    action: "quick_sales_publish_completed",
    actorRosterId: ctx.rosterId,
    businessId: ctx.businessId,
    category,
    listingSource: descriptor.listingSource,
    listingId,
    paymentState: "cleared",
    outcome: "ok",
  });

  return NextResponse.json({ ok: true, category, listingId, listingSource: descriptor.listingSource });
}
