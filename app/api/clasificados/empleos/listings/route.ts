import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import type { EmpleosPublishEnvelope } from "@/app/publicar/empleos/shared/publish/empleosPublishSnapshots";
import { upsertEmpleosListingFromEnvelope } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { fetchEmpleosPublishedJobRecords } from "@/app/clasificados/empleos/lib/empleosPublicListingsDbServer";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE } from "@/app/(site)/clasificados/lib/quickListingIdempotency";
import { getBearerUserId } from "../../_lib/bearerUser";
import { resolveCanonicalPlacementRankWeights } from "@/app/lib/listingPlans/placementResultsOverlay";
import { applyAssistedPublishingCookie } from "@/app/lib/auth/assistedPublishingSession";
import { isListingLinkedToBusiness, linkAssistedListingToBusiness } from "@/app/lib/business/assistedListingCustody";
import { recordSalesWorkspaceAudit } from "@/app/lib/sales/salesWorkspaceAudit";
import { resolveStaffAssistedCategorySave, isStaffAssistedSaveRefusal } from "@/app/lib/sales/staffAssistedCategorySave";

export const runtime = "nodejs";

/** Public read: published catalog (used as a runtime fallback when server props are empty). */
export async function GET(): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }
  const jobs = await fetchEmpleosPublishedJobRecords();

  // Package D Build D3, Gate 1 — canonical leonix_placement_entitlements weight, batched.
  const canonicalWeights = await resolveCanonicalPlacementRankWeights(jobs, {
    category: "empleos",
    surface: "category_results",
  });
  const jobsWithPlacement =
    canonicalWeights.size > 0
      ? jobs.map((j) => {
          const w = canonicalWeights.get(j.id);
          return w != null ? { ...j, canonicalPlacementRankWeight: w } : j;
        })
      : jobs;

  return NextResponse.json({ ok: true, jobs: jobsWithPlacement });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const envelope = b.envelope as EmpleosPublishEnvelope | undefined;
  if (!envelope || typeof envelope !== "object") {
    return NextResponse.json({ ok: false, error: "missing_envelope" }, { status: 400 });
  }

  const assisted = await resolveStaffAssistedCategorySave({
    request: req,
    expectedCategory: "empleos",
    assistedActionRaw: typeof b.assistedAction === "string" ? b.assistedAction : "",
    bodyListingId: envelope.listingId,
    bodyClientUserId: typeof b.clientUserId === "string" ? b.clientUserId : null,
  });
  if (isStaffAssistedSaveRefusal(assisted)) {
    return NextResponse.json({ ok: false, error: assisted.error }, { status: assisted.status });
  }

  let ownerUserId: string | null = await getBearerUserId(req);
  let staffMode: "draft" | "publish" | null = null;
  // True only after the ledger re-proof below succeeds for the signed-context row (assisted reopen).
  let assistedCustodyProven = false;
  if (assisted.assisted) {
    if (assisted.isPublish) {
      return NextResponse.json({ ok: false, error: "publish_via_cockpit_only" }, { status: 403 });
    }
    ownerUserId = assisted.clientUserId;
    staffMode = "draft";
    if (assisted.listingId) {
      const linked = await isListingLinkedToBusiness({
        businessId: assisted.ctx.businessId,
        listingSource: "empleos_public_listings",
        listingId: assisted.listingId,
      });
      if (!linked) {
        return NextResponse.json({ ok: false, error: "listing_not_linked_to_business" }, { status: 403 });
      }
      envelope.listingId = assisted.listingId;
      assistedCustodyProven = true;
    }
  } else if (!ownerUserId) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const mode = staffMode ?? (b.mode === "draft" ? "draft" : "publish");

  const wasNew = !String(envelope.listingId ?? "").trim();
  const res = await upsertEmpleosListingFromEnvelope({
    envelope,
    ownerUserId,
    mode,
    assistedCustody: assistedCustodyProven,
  });
  if (!res.ok) {
    const status =
      res.error === "forbidden"
        ? 403
        : res.error === "payment_required"
          ? 402
          : res.error === "not_publishable"
            ? 409
            : res.error === "lane_mismatch" ||
                res.error === "lane_payload_mismatch" ||
                res.error === "invalid_lane" ||
                res.error === "invalid_envelope" ||
                res.error === "invalid_feria_payload" ||
                res.error === QUICK_LISTING_EXISTING_IDENTITY_INVALID_CODE
              ? 400
              : 500;
    return NextResponse.json({ ok: false, error: res.error }, { status });
  }

  if (assisted.assisted && wasNew) {
    await linkAssistedListingToBusiness({
      businessId: assisted.ctx.businessId,
      listingSource: "empleos_public_listings",
      listingId: res.id,
      linkedByAuthUserId: assisted.ctx.authUserId,
    });
    await recordSalesWorkspaceAudit({
      action: "quick_sales_save_for_client",
      actorRosterId: assisted.ctx.rosterId,
      businessId: assisted.ctx.businessId,
      category: "empleos",
      listingSource: "empleos_public_listings",
      listingId: res.id,
      outcome: "ok",
    });
  }

  revalidatePath("/clasificados/empleos/resultados");
  revalidatePath(`/clasificados/empleos/${res.slug}`);
  revalidatePath("/clasificados/empleos");
  revalidatePath("/dashboard/empleos");

  let leonixAdId: string | null = null;
  try {
    const { getAdminSupabase } = await import("@/app/lib/supabase/server");
    const supabase = getAdminSupabase();
    const { data } = await supabase
      .from("empleos_public_listings")
      .select("leonix_ad_id")
      .eq("id", res.id)
      .maybeSingle();
    leonixAdId = (data as { leonix_ad_id?: string | null } | null)?.leonix_ad_id?.trim() || null;
  } catch {
    /* optional */
  }

  const json = NextResponse.json({
    ok: true,
    id: res.id,
    listingId: res.id,
    slug: res.slug,
    lifecycle_status: res.lifecycle_status,
    leonix_ad_id: leonixAdId,
  });
  if (assisted.assisted && wasNew) {
    applyAssistedPublishingCookie(json, {
      businessId: assisted.ctx.businessId,
      category: "empleos",
      rosterId: assisted.ctx.rosterId,
      authUserId: assisted.ctx.authUserId,
      listingId: res.id,
      clientUserId: assisted.clientUserId,
      assistedAction: "save_for_client",
      packageKey: assisted.ctx.packageKey ?? null,
    });
  }
  return json;
}
