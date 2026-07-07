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
import {
  buildPromoCodeRulePreview,
  generateLeonixPromoCode,
  normalizePromoCodeForStorage,
  promoCodePrefixForCategory,
} from "@/app/lib/listingPlans/promoCodeLifecycle";
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

function normalizeEmail(raw: string | null): string | null {
  const v = String(raw ?? "").trim().toLowerCase();
  return v || null;
}

function normalizePhone(raw: string | null): string | null {
  const v = String(raw ?? "").trim();
  return v || null;
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
  // Server is the source of truth for generated codes; never trust a client code.
  if (!code) code = generateLeonixPromoCode(promoCodePrefixForCategory(category, codeType));
  const packageTier = String(formData.get("package_tier") ?? "").trim() || null;
  const contractTerm = String(formData.get("contract_term") ?? "").trim() || null;
  const customerName = String(formData.get("customer_name") ?? "").trim() || null;
  const businessName = String(formData.get("business_name") ?? "").trim() || null;
  const customerEmail = normalizeEmail(String(formData.get("customer_email") ?? ""));
  const customerPhone = normalizePhone(String(formData.get("customer_phone") ?? ""));
  const formSalesRepId = String(formData.get("sales_rep_id") ?? "").trim() || null;
  const formSalesRepName = String(formData.get("sales_rep_name") ?? "").trim() || null;
  const { salesRepId, salesRepName } = resolveSalesRepFieldsForCreate(access, formSalesRepId, formSalesRepName);
  const packageEntitlementId = String(formData.get("package_entitlement_id") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 4000) || null;
  const packageScopeSelected = String(formData.get("package_scope") ?? "").trim().toLowerCase();
  const packageScopeCustom = String(formData.get("package_scope_custom") ?? "").trim().toLowerCase();
  const packageScopeRaw = packageScopeCustom || packageScopeSelected;
  const packageScope = packageScopeRaw ? [packageScopeRaw] : null;

  if (codeType === "newsletter" && !customerEmail) {
    redirectWith({ error: "newsletter_email_required" });
  }
  if (codeType === "sms" && !customerPhone) {
    redirectWith({ error: "sms_phone_required" });
  }

  const promoPreviewEarly = buildPromoCodeRulePreview({ codeType, status });

  let promoType: string | null = null;
  let percentOff: number | null = null;
  let amountOffCents: number | null = null;

  const discountEligible =
    codeType === "discount" || (promoPreviewEarly.canDiscountPayment && codeType !== "entitlement");

  if (discountEligible) {
    const promoTypeRaw = String(formData.get("promo_type") ?? "").trim().toLowerCase();
    const percentOffRaw = String(formData.get("percent_off") ?? "").trim();
    const amountOffDollarsRaw = String(formData.get("amount_off_dollars") ?? "").trim();
    const hasDiscountInput = Boolean(promoTypeRaw || percentOffRaw || amountOffDollarsRaw);

    if (codeType === "discount" || hasDiscountInput) {
      if (promoTypeRaw === "percent_off" || promoTypeRaw === "amount_off") {
        promoType = promoTypeRaw;
      } else if (percentOffRaw) {
        promoType = "percent_off";
      } else if (amountOffDollarsRaw) {
        promoType = "amount_off";
      } else if (codeType === "discount") {
        redirectWith({ error: "discount_value_required" });
      }

      if (promoType === "percent_off") {
        percentOff = Number(percentOffRaw);
        if (!Number.isFinite(percentOff) || percentOff <= 0 || percentOff > 100) {
          redirectWith({ error: "invalid_percent" });
        }
      }

      if (promoType === "amount_off") {
        const dollars = Number(amountOffDollarsRaw);
        if (!Number.isFinite(dollars) || dollars <= 0) {
          redirectWith({ error: "invalid_amount" });
        }
        amountOffCents = Math.round(dollars * 100);
      }
    }
  }

  const promoPreview = buildPromoCodeRulePreview({ codeType, status });
  const metadata: Record<string, unknown> = {
    source: "admin_promo_code_manager",
    created_via: "promo_admin_os_polish_newsletter_readiness",
    source_page: "admin_workspace_promo_codes",
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
    ...(promoType
      ? {
          discount_type: promoType,
          discount_percent: percentOff,
          discount_amount_cents: amountOffCents,
        }
      : {}),
    ...(codeType === "newsletter"
      ? {
          subscriber_identity_required: true,
          intended_delivery_channel: "email",
          email_send_status: "not_sent",
          ...(customerEmail ? { customer_email_normalized: customerEmail } : {}),
        }
      : {}),
    ...(codeType === "sms"
      ? {
          subscriber_identity_required: true,
          intended_delivery_channel: "sms",
          sms_send_status: "not_sent",
          ...(customerPhone ? { customer_phone_normalized: customerPhone } : {}),
        }
      : {}),
  };

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leonix_promo_codes")
    .insert({
      code,
      code_type: codeType,
      status,
      promo_type: promoType,
      percent_off: percentOff,
      amount_off_cents: amountOffCents,
      is_active: status === "active",
      non_stackable: true,
      one_time_use: promoPreview.oneTimeUse,
      starts_at: startsAt,
      ends_at: endsAt,
      package_tier: packageTier,
      contract_term: contractTerm,
      category,
      category_scope: category ? [category] : null,
      package_scope: packageScope,
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
