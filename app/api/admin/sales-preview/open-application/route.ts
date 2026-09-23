/**
 * Staff master launcher — open an existing canonical application or staff admin route.
 * Assisted families reuse custody (and may create a draft business). Other families mint the
 * same assisted cookie so PublishAuthGate skips customer login, then return the proven href.
 */
import { NextResponse, type NextRequest } from "next/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import {
  ASSISTED_PUBLISH_MAX_AGE_SEC,
  applyAssistedPublishingCookie,
} from "@/app/lib/auth/assistedPublishingSession";
import { createMinimalAssistedBusiness } from "@/app/lib/sales/createMinimalAssistedBusiness";
import {
  parseStaffBusinessPlan,
  resolveStaffBusinessPackage,
  staffIntakePathForCategory,
  type StaffBusinessPlan,
} from "@/app/lib/sales/staffBusinessProduct";
import { QUICK_SALES_CATEGORY_MAP, isQuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import { staffLauncherItem } from "@/app/lib/sales/staffMasterLauncher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export async function POST(request: NextRequest) {
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) return fail(access.status, access.reason);

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail(400, "bad_json");
  }

  const launcherId = typeof body.launcherId === "string" ? body.launcherId.trim() : "";
  const item = staffLauncherItem(launcherId);
  if (!item) return fail(400, "invalid_launcher");

  const requestedPlan = parseStaffBusinessPlan(body.plan);
  const productId = typeof body.productId === "string" ? body.productId.trim() : "";
  const product = item.products.find((p) => p.id === productId) ?? item.products[0] ?? null;
  const existingBusinessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
  const listingId = typeof body.listingId === "string" ? body.listingId.trim() : "";
  const newClient = body.newClient === true || !existingBusinessId;

  if (item.mode === "admin") {
    return NextResponse.json({
      ok: true,
      launcherId: item.id,
      href: product?.staffHref || item.staffHref,
      sameTab: true,
      staffAdmin: true,
    });
  }

  let businessId = existingBusinessId;
  if (newClient || !businessId) {
    const drafted = await createMinimalAssistedBusiness(
      { businessName: `Borrador · ${item.labelEs}`, confirmCreateDespiteDuplicates: true },
      access.actor,
    );
    if (!drafted.ok) return fail(drafted.error === "invalid_input" ? 400 : 500, drafted.error);
    businessId = drafted.businessId;
  }

  if (item.mode === "assisted" && item.assistedCategory && isQuickSalesCategory(item.assistedCategory)) {
    const category = item.assistedCategory;
    const descriptor = QUICK_SALES_CATEGORY_MAP[category];
    const resolved = resolveStaffBusinessPackage({
      category,
      requestedPlan,
      requestedPackageKey: product?.packageKey,
    });
    if (!resolved.ok) return fail(400, resolved.error);
    const plan = resolved.plan;
    const packageKey = resolved.packageKey;
    const intakePath = staffIntakePathForCategory(category, plan, product?.staffHref || descriptor.intakePath);
    const res = NextResponse.json({
      ok: true,
      launcherId: item.id,
      category,
      businessId,
      intakePath,
      href: intakePath,
      packageKey,
      plan,
      sameTab: true,
      expiresInSec: ASSISTED_PUBLISH_MAX_AGE_SEC,
    });
    const applied = applyAssistedPublishingCookie(res, {
      businessId,
      category,
      rosterId: access.actor.rosterId,
      authUserId: access.actor.authUserId,
      listingId: listingId || null,
      clientUserId: null,
      assistedAction: "save_for_client",
      packageKey,
    });
    if (!applied) return fail(503, "assisted_context_unavailable");
    return res;
  }

  const href = product?.staffHref || item.staffHref;
  const plan: StaffBusinessPlan | null = requestedPlan;
  const res = NextResponse.json({
    ok: true,
    launcherId: item.id,
    category: item.id,
    businessId,
    href,
    intakePath: href,
    plan,
    sameTab: true,
    expiresInSec: ASSISTED_PUBLISH_MAX_AGE_SEC,
  });
  const applied = applyAssistedPublishingCookie(res, {
    businessId,
    category: item.id,
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    listingId: null,
    clientUserId: null,
    assistedAction: "save_for_client",
    packageKey: product?.packageKey ?? null,
  });
  if (!applied) return fail(503, "assisted_context_unavailable");
  return res;
}
