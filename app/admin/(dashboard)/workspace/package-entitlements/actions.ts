"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";
import { PREMIUM_INVENTORY_SOFT_CAP } from "@/app/admin/_lib/packageEntitlementConstants";
import { countActivePremiumEntitlements } from "@/app/admin/_lib/packageEntitlementData";
import {
  getPackageEntitlementBenefits,
  normalizePackageEntitlementTier,
  type PackageEntitlementTier,
} from "@/app/lib/listingPlans/packageEntitlements";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";

const ALLOWED_TIERS = new Set([
  "premium",
  "full_page",
  "half_page",
  "quarter_page",
  "classified_print",
  "digital_only",
]);

const ALLOWED_CATEGORIES = new Set(["servicios", "restaurantes", "autos", "bienes-raices", "rentas"]);

const ALLOWED_SCOPES = new Set(["homepage", "clasificados", "category", "results"]);

function generateEntitlementCode(): string {
  return `LX-ENT-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function parseDateTimeLocal(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString();
}

function initialStatus(startsAt: string, endsAt: string, now: Date): "active" | "scheduled" | "expired" {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (end.getTime() <= now.getTime()) return "expired";
  if (start.getTime() > now.getTime()) return "scheduled";
  return "active";
}

function redirectWith(query: Record<string, string>): never {
  const p = new URLSearchParams(query);
  redirect(`/admin/workspace/package-entitlements?${p.toString()}`);
}

function creatorSnapshot(): Record<string, string | null> {
  return {
    creator_name: "Admin",
    creator_role: "admin",
    creator_email: null,
  };
}

function mergeMetadata(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return { ...existing, ...patch };
}

async function loadEntitlementRow(id: string) {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.from("listing_package_entitlements").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Record<string, unknown>;
}

export async function createPackageEntitlementAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const packageTierRaw = String(formData.get("package_tier") ?? "").trim();
  const tier = normalizePackageEntitlementTier(packageTierRaw);
  if (!ALLOWED_TIERS.has(tier)) {
    redirectWith({ error: "invalid_tier" });
  }

  const category = String(formData.get("category") ?? "").trim().toLowerCase();
  if (!ALLOWED_CATEGORIES.has(category)) {
    redirectWith({ error: "invalid_category" });
  }

  const listingSource = String(formData.get("listing_source") ?? "").trim();
  const listingIdRaw = String(formData.get("listing_id") ?? "").trim();
  const listingId = listingIdRaw || null;
  if (!listingSource) {
    redirectWith({ error: "missing_listing_source" });
  }

  const startsAt = parseDateTimeLocal(String(formData.get("starts_at") ?? ""));
  const endsAt = parseDateTimeLocal(String(formData.get("ends_at") ?? ""));
  if (!startsAt || !endsAt) {
    redirectWith({ error: "invalid_dates" });
  }
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    redirectWith({ error: "end_before_start" });
  }

  const scopes = formData
    .getAll("placement_scope")
    .map((s) => String(s).trim())
    .filter((s) => ALLOWED_SCOPES.has(s));

  let entitlementCode = String(formData.get("entitlement_code") ?? "").trim().toUpperCase();
  if (!entitlementCode) entitlementCode = generateEntitlementCode();

  const contractCode = String(formData.get("contract_code") ?? "").trim() || null;
  const customerName = String(formData.get("customer_name") ?? "").trim() || null;
  const businessName = String(formData.get("business_name") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 4000) || null;
  const salesRepId = String(formData.get("sales_rep_id") ?? "").trim() || null;
  const salesRepName = String(formData.get("sales_rep_name") ?? "").trim() || null;

  const now = new Date();
  if (tier === "premium") {
    const premiumActive = await countActivePremiumEntitlements(now);
    if (premiumActive != null && premiumActive >= PREMIUM_INVENTORY_SOFT_CAP) {
      redirectWith({ error: "premium_cap", warn: String(PREMIUM_INVENTORY_SOFT_CAP) });
    }
  }

  const def = getPackageEntitlementBenefits(tier as PackageEntitlementTier);
  const status = initialStatus(startsAt, endsAt, now);
  const metadata = {
    source: "admin_manual",
    visibility_bucket: def.visibilityBucket,
    created_via: "gate_g1_6c_admin",
    listing_attachment: listingId ? "attached" : "pending",
    sales_rep_id: salesRepId,
    sales_rep_name: salesRepName,
    ...creatorSnapshot(),
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    payment_status: null,
  };

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("listing_package_entitlements")
    .insert({
      status,
      category,
      listing_source: listingSource,
      listing_id: listingId,
      package_tier: tier,
      entitlement_code: entitlementCode,
      contract_code: contractCode,
      customer_name: customerName,
      business_name: businessName,
      notes,
      starts_at: startsAt,
      ends_at: endsAt,
      placement_scope: scopes,
      benefits: def.benefits,
      metadata,
      updated_at: now.toISOString(),
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
    action: "package_entitlement_created",
    targetType: "listing_package_entitlement",
    targetId: data?.id ? String((data as { id: string }).id) : entitlementCode,
    meta: {
      category,
      listing_source: listingSource,
      listing_id: listingId,
      package_tier: tier,
      entitlement_code: entitlementCode,
      sales_rep_id: salesRepId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workspace/package-entitlements");
  redirectWith({ created: "1", code: entitlementCode });
}

export async function revokePackageEntitlementAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirectWith({ error: "missing_id" });

  const existing = await loadEntitlementRow(id);
  const meta =
    existing?.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("listing_package_entitlements")
    .update({
      status: "revoked",
      revoked_at: now,
      updated_at: now,
      metadata: mergeMetadata(meta, {
        revoked_by_name: "Admin",
        revoked_by_role: "admin",
      }),
    })
    .eq("id", id);

  if (error) {
    redirectWith({ error: "revoke_failed", detail: error.message.slice(0, 120) });
  }

  void appendAdminAuditLog({
    action: "package_entitlement_revoked",
    targetType: "listing_package_entitlement",
    targetId: id,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workspace/package-entitlements");
  redirectWith({ revoked: "1" });
}

export async function extendPackageEntitlementAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "").trim();
  const endsAt = parseDateTimeLocal(String(formData.get("ends_at") ?? ""));
  if (!id || !endsAt) redirectWith({ error: "extend_invalid" });

  const existing = await loadEntitlementRow(id);
  if (!existing) redirectWith({ error: "not_found" });

  const startsAt = String(existing.starts_at);
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) {
    redirectWith({ error: "end_before_start" });
  }

  const now = new Date();
  const status = initialStatus(startsAt, endsAt, now);
  const meta =
    existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("listing_package_entitlements")
    .update({
      ends_at: endsAt,
      status,
      updated_at: now.toISOString(),
      metadata: mergeMetadata(meta, {
        extended_at: now.toISOString(),
        extended_by_name: "Admin",
      }),
    })
    .eq("id", id);

  if (error) {
    redirectWith({ error: "extend_failed", detail: error.message.slice(0, 120) });
  }

  void appendAdminAuditLog({
    action: "package_entitlement_extended",
    targetType: "listing_package_entitlement",
    targetId: id,
    meta: { ends_at: endsAt },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workspace/package-entitlements");
  redirectWith({ extended: "1" });
}

export async function attachListingToPackageEntitlementAction(formData: FormData): Promise<void> {
  const c = await cookies();
  if (!requireAdminCookie(c)) throw new Error("Unauthorized");

  const id = String(formData.get("id") ?? "").trim();
  const listingId = String(formData.get("listing_id") ?? "").trim();
  if (!id || !listingId) redirectWith({ error: "attach_invalid" });

  const existing = await loadEntitlementRow(id);
  if (!existing) redirectWith({ error: "not_found" });

  const meta =
    existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
      ? (existing.metadata as Record<string, unknown>)
      : {};

  const now = new Date().toISOString();
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("listing_package_entitlements")
    .update({
      listing_id: listingId,
      updated_at: now,
      metadata: mergeMetadata(meta, {
        listing_attachment: "attached",
        attached_at: now,
        attached_by_name: "Admin",
      }),
    })
    .eq("id", id);

  if (error) {
    redirectWith({ error: "attach_failed", detail: error.message.slice(0, 120) });
  }

  void appendAdminAuditLog({
    action: "package_entitlement_listing_attached",
    targetType: "listing_package_entitlement",
    targetId: id,
    meta: { listing_id: listingId },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/workspace/package-entitlements");
  redirectWith({ attached: "1" });
}
