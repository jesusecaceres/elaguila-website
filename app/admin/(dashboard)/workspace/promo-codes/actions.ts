"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  assertCanManagePromoCode,
  getCurrentAdminAccessContext,
  resolveSalesRepFieldsForCreate,
} from "@/app/admin/_lib/adminAccessControl";
import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { buildPromoCodeRulePreview, generateLeonixPromoCode, normalizePromoCodeForStorage } from "@/app/lib/listingPlans/promoCodeLifecycle";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

const ALLOWED_CODE_TYPES = new Set([
  "entitlement",
  "discount",
  "newsletter",
  "sms",
  "sales_rep",
  "contract",
  "founding_partner",
  "owner_override",
]);

const ALLOWED_STATUSES = new Set(["draft", "active", "expired", "revoked", "redeemed"]);

function parseDateTimeLocal(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

function redirectWith(query: Record<string, string>): never {
  const p = new URLSearchParams(query);
  redirect(`/admin/workspace/promo-codes?${p.toString()}`);
}

export async function createPromoCodeAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
  const access = await getCurrentAdminAccessContext();

  let code = normalizePromoCodeForStorage(String(formData.get("code") ?? ""));
  if (!code) code = generateLeonixPromoCode();

  const codeType = String(formData.get("code_type") ?? "entitlement").trim();
  if (!ALLOWED_CODE_TYPES.has(codeType)) {
    redirectWith({ error: "invalid_code_type" });
  }

  const status = String(formData.get("status") ?? "active").trim();
  if (!ALLOWED_STATUSES.has(status)) {
    redirectWith({ error: "invalid_status" });
  }

  const startsAt = parseDateTimeLocal(String(formData.get("starts_at") ?? ""));
  const endsAt = parseDateTimeLocal(String(formData.get("ends_at") ?? ""));
  if (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    redirectWith({ error: "end_before_start" });
  }

  const category = String(formData.get("category") ?? "").trim().toLowerCase() || null;
  const packageTier = String(formData.get("package_tier") ?? "").trim() || null;
  const contractTerm = String(formData.get("contract_term") ?? "").trim() || null;
  const customerName = String(formData.get("customer_name") ?? "").trim() || null;
  const businessName = String(formData.get("business_name") ?? "").trim() || null;
  const customerEmail = String(formData.get("customer_email") ?? "").trim() || null;
  const customerPhone = String(formData.get("customer_phone") ?? "").trim() || null;
  const formSalesRepId = String(formData.get("sales_rep_id") ?? "").trim() || null;
  const formSalesRepName = String(formData.get("sales_rep_name") ?? "").trim() || null;
  const { salesRepId, salesRepName } = resolveSalesRepFieldsForCreate(access, formSalesRepId, formSalesRepName);
  const packageEntitlementId = String(formData.get("package_entitlement_id") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 4000) || null;

  const promoPreview = buildPromoCodeRulePreview({ codeType, status });
  const metadata: Record<string, unknown> = {
    source: "admin_promo_code_manager",
    created_via: "gate_g1_6f",
    notes,
    promo_rule: {
      promo_code_type: promoPreview.codeType,
      status: promoPreview.status,
      non_stackable: promoPreview.nonStackable,
      one_time_use: promoPreview.oneTimeUse,
      requires_owner_approval: promoPreview.requiresOwnerApproval,
      requires_subscriber_identity: promoPreview.requiresSubscriberIdentity,
      requires_sales_rep_attribution: promoPreview.requiresSalesRepAttribution,
      can_create_package_entitlement: promoPreview.canCreatePackageEntitlement,
      can_discount_payment: promoPreview.canDiscountPayment,
    },
  };

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_promo_codes")
    .insert({
      code,
      code_type: codeType,
      status,
      non_stackable: true,
      one_time_use: promoPreview.oneTimeUse,
      starts_at: startsAt,
      ends_at: endsAt,
      package_tier: packageTier,
      contract_term: contractTerm,
      category,
      customer_name: customerName,
      business_name: businessName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      sales_rep_id: salesRepId,
      sales_rep_name: salesRepName,
      created_by: access.authUserId,
      package_entitlement_id: packageEntitlementId,
      requires_owner_approval: promoPreview.requiresOwnerApproval,
      metadata,
      updated_at: now,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      redirectWith({ error: "duplicate_code" });
    }
    redirectWith({ error: "insert_failed", detail: error.message.slice(0, 120) });
  }

  void appendAdminAuditLog({
    action: "promo_code_created",
    targetType: "leonix_promo_code",
    targetId: data?.id ? String((data as { id: string }).id) : code,
    meta: { code, code_type: codeType, category, package_entitlement_id: packageEntitlementId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workspace/promo-codes");
  redirectWith({ created: "1", code });
}

export async function revokePromoCodeAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");
  const access = await getCurrentAdminAccessContext();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirectWith({ error: "missing_id" });

  try {
    await assertCanManagePromoCode(id, access);
  } catch {
    redirectWith({ error: "forbidden" });
  }

  const supabase = getAdminSupabase();
  const { data: existing } = await supabase.from("leonix_promo_codes").select("metadata").eq("id", id).maybeSingle();
  const meta =
    existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("leonix_promo_codes")
    .update({
      status: "revoked",
      revoked_at: now,
      updated_at: now,
      metadata: { ...meta, revoked_by_name: "Admin", revoked_by_role: "admin" },
    })
    .eq("id", id);

  if (error) {
    redirectWith({ error: "revoke_failed", detail: error.message.slice(0, 120) });
  }

  void appendAdminAuditLog({
    action: "promo_code_revoked",
    targetType: "leonix_promo_code",
    targetId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workspace/promo-codes");
  redirectWith({ revoked: "1" });
}
