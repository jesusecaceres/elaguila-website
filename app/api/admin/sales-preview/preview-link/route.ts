/**
 * LEONIX QUICK SALES WORKSPACE — issue the expiring, read-only PROSPECT PREVIEW link.
 *
 * POST { listingId?, ttlSec? }  → { ok, previewPath, expiresAtMs }
 *
 * The link this mints is the only artifact in the workflow that leaves the building. Everything
 * about it is therefore narrow on purpose:
 *
 *  - It is issued only to an authenticated staff actor holding `assisted_category_publishing` AND
 *    a live server-issued assisted context. A staff session alone is not enough: the context is
 *    what names the business and the row.
 *  - It is scoped to ONE category and ONE canonical row, and that row must still be held by that
 *    business in the custody ledger at the moment of issuance.
 *  - It expires, with a hard 72-hour ceiling enforced by the token itself.
 *  - It carries no authority: not staff, not owner, not payment. The preview reader accepts it for
 *    reading safe public fields and nothing else; no mutation endpoint accepts it at all.
 *  - The token is NEVER written to the audit log. The audit records that a link was issued, for
 *    which row, by whom, and when it dies — an audit log is read by more people than a preview
 *    link is meant for.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { readActiveAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import {
  PROSPECT_PREVIEW_MAX_AGE_SEC,
  buildProspectPreviewPath,
  createProspectPreviewToken,
  isProspectPreviewConfigured,
} from "@/app/lib/auth/prospectPreviewSession";
import { isProspectPreviewCategory, isProspectPreviewSource } from "@/app/lib/auth/prospectPreviewToken";
import { isListingLinkedToBusiness } from "@/app/lib/business/assistedListingCustody";
import { resolveAssistedRowBinding } from "@/app/lib/sales/assistedSameRowBinding";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { QUICK_SALES_CATEGORY_MAP, isQuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });
  }

  // Roster re-checked at redemption, exactly as every other assisted write does.
  const assistedContext = await readActiveAssistedPublishingContext(request.cookies);
  if (!assistedContext || !isQuickSalesCategory(assistedContext.category)) {
    return NextResponse.json({ ok: false, error: "assisted_context_required" }, { status: 403 });
  }
  const descriptor = QUICK_SALES_CATEGORY_MAP[assistedContext.category];

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const binding = resolveAssistedRowBinding({
    contextListingId: assistedContext.listingId,
    // The context's action names the assisted operation it authorizes; issuing a read-only link
    // for the row it already names is within that, so the action is not re-narrowed here.
    contextAssistedAction: null,
    requestedAction: "",
    bodyListingId: typeof body.listingId === "string" ? body.listingId : null,
  });
  if (!binding.ok) {
    return NextResponse.json({ ok: false, error: binding.error }, { status: binding.status });
  }
  const listingId = binding.listingId;
  if (!listingId) {
    // There is no draft yet. A preview of nothing is not a preview.
    return NextResponse.json({ ok: false, error: "no_bound_listing" }, { status: 409 });
  }

  // Custody is re-proven now, not assumed from an earlier signature.
  const linked = await isListingLinkedToBusiness({
    businessId: assistedContext.businessId,
    listingSource: descriptor.listingSource,
    listingId,
  });
  if (!linked) {
    await recordSalesWorkspaceAudit({
      action: "quick_sales_preview_issued",
      actorRosterId: assistedContext.rosterId,
      businessId: assistedContext.businessId,
      category: assistedContext.category,
      listingSource: descriptor.listingSource,
      listingId,
      outcome: "listing_not_linked_to_business",
    });
    return NextResponse.json({ ok: false, error: "listing_not_linked_to_business" }, { status: 403 });
  }

  if (!isProspectPreviewConfigured()) {
    // An honest refusal. There is deliberately no unsigned fallback link.
    return NextResponse.json({ ok: false, error: "preview_signing_unavailable" }, { status: 503 });
  }

  if (!isProspectPreviewCategory(assistedContext.category) || !isProspectPreviewSource(descriptor.listingSource)) {
    return NextResponse.json({ ok: false, error: "preview_category_unsupported" }, { status: 400 });
  }

  const requestedTtl = typeof body.ttlSec === "number" && Number.isFinite(body.ttlSec) ? Math.floor(body.ttlSec) : undefined;
  const token = createProspectPreviewToken({
    category: assistedContext.category,
    listingSource: descriptor.listingSource,
    listingId,
    businessId: assistedContext.businessId,
    issuedByRosterId: assistedContext.rosterId,
    ttlSec: requestedTtl,
  });
  if (!token) {
    return NextResponse.json({ ok: false, error: "preview_signing_unavailable" }, { status: 503 });
  }

  const ttlSec = Math.max(60, Math.min(PROSPECT_PREVIEW_MAX_AGE_SEC, requestedTtl ?? PROSPECT_PREVIEW_MAX_AGE_SEC));
  const expiresAtMs = Date.now() + ttlSec * 1000;

  await recordSalesWorkspaceAudit({
    action: "quick_sales_preview_issued",
    actorRosterId: assistedContext.rosterId,
    businessId: assistedContext.businessId,
    category: assistedContext.category,
    listingSource: descriptor.listingSource,
    listingId,
    outcome: "ok",
    // The link's lifetime, never the link.
    detail: { expires_at: new Date(expiresAtMs).toISOString(), ttl_sec: ttlSec },
  });

  return NextResponse.json(
    {
      ok: true,
      category: assistedContext.category,
      listingId,
      previewPath: buildProspectPreviewPath(assistedContext.category, token),
      expiresAtMs,
      ttlSec,
    },
    // The response body contains a live preview link. It is never cached anywhere.
    { headers: { "cache-control": "no-store" } },
  );
}
