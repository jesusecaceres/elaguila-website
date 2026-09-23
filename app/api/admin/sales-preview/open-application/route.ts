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
  provisionAssistedCustomerAccount,
  resolvePrimaryCustomerUserIdForBusiness,
} from "@/app/lib/sales/assistedCustomerAccount";
import {
  isStaffBusinessPairCategory,
  parseStaffBusinessPlan,
  resolveStaffBusinessPackage,
  staffBusinessCheckpointHref,
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
  let clientUserId: string | null = null;
  let accountInviteSent = false;
  let accountInviteNote: string | null = null;

  if (newClient || !businessId) {
    const businessName = typeof body.newBusinessName === "string" ? body.newBusinessName.trim() : "";
    const clientName = typeof body.newClientName === "string" ? body.newClientName.trim() : "";
    const clientEmail = typeof body.newClientEmail === "string" ? body.newClientEmail.trim() : "";
    const clientPhone = typeof body.newClientPhone === "string" ? body.newClientPhone.trim() : "";
    if (!businessName) return fail(400, "business_name_required");
    if (!clientEmail || !clientEmail.includes("@")) return fail(400, "client_email_required");

    const drafted = await createMinimalAssistedBusiness(
      {
        businessName,
        publicName: businessName,
        contactName: clientName || null,
        phone: clientPhone || null,
        email: clientEmail,
        confirmCreateDespiteDuplicates: true,
      },
      access.actor,
    );
    if (!drafted.ok) return fail(drafted.error === "invalid_input" ? 400 : 500, drafted.error);
    businessId = drafted.businessId;

    const account = await provisionAssistedCustomerAccount({
      businessId,
      email: clientEmail,
      displayName: clientName || businessName,
      phone: clientPhone || null,
      invitedByAuthUserId: access.actor.authUserId,
    });
    if (!account.ok) {
      return fail(
        account.error === "business_already_owned" ? 409 : account.error === "invalid_email" ? 400 : 500,
        account.error,
        account.detail ? { detail: account.detail } : {},
      );
    }
    clientUserId = account.userId;
    accountInviteSent = account.inviteSent;
    accountInviteNote = account.inviteNote;
  } else {
    clientUserId = await resolvePrimaryCustomerUserIdForBusiness(businessId);
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
    const checkpointHref =
      plan && isStaffBusinessPairCategory(category)
        ? staffBusinessCheckpointHref(category, plan)
        : null;
    const res = NextResponse.json({
      ok: true,
      launcherId: item.id,
      category,
      businessId,
      intakePath,
      href: checkpointHref ?? intakePath,
      entryKind: checkpointHref ? "checkpoint" : "application",
      packageKey,
      plan,
      clientUserId,
      accountInviteSent,
      accountInviteNote,
      sameTab: true,
      expiresInSec: ASSISTED_PUBLISH_MAX_AGE_SEC,
    });
    const applied = applyAssistedPublishingCookie(res, {
      businessId,
      category,
      rosterId: access.actor.rosterId,
      authUserId: access.actor.authUserId,
      listingId: listingId || null,
      clientUserId,
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
    clientUserId,
    accountInviteSent,
    accountInviteNote,
    sameTab: true,
    expiresInSec: ASSISTED_PUBLISH_MAX_AGE_SEC,
  });
  const applied = applyAssistedPublishingCookie(res, {
    businessId,
    category: item.id,
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    listingId: null,
    clientUserId,
    assistedAction: "save_for_client",
    packageKey: product?.packageKey ?? null,
  });
  if (!applied) return fail(503, "assisted_context_unavailable");
  return res;
}
