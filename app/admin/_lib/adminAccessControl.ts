/**
 * Leonix admin role + sales-rep scoping (Gate ADMIN-ROLES-SALES).
 *
 * Layer 1: shared admin cookie (unchanged).
 * Layer 2: optional `admin_team_members` row matched by `ADMIN_OPERATOR_EMAIL`.
 *
 * Role mapping (roster `role` → normalized access):
 * | Roster role      | Normalized        | Monetization access        |
 * |------------------|-------------------|----------------------------|
 * | super_admin      | owner_admin       | Full                       |
 * | sales_manager    | sales_manager     | Full sales records         |
 * | sales_rep        | sales_rep         | Own records only           |
 * | billing_support  | admin_manager     | Full (no payment tracker*) |
 * | content_manager  | content_admin     | Full CMS nav (monetization full) |
 * | others           | owner_admin**     | Full (legacy cookie admins) |
 *
 * * Payment tracker: owner_admin + sales_manager only (not billing_support sales totals).
 * ** When no roster email is configured, cookie admins keep full owner access.
 */
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";
import type { AdminTeamRole } from "@/app/admin/_lib/teamTypes";

export type NormalizedAdminRole =
  | "owner_admin"
  | "admin_manager"
  | "sales_manager"
  | "sales_rep"
  | "support_admin"
  | "content_admin";

export type AdminAccessContext = {
  /** True when `leonix_admin` cookie is present. */
  hasAdminCookie: boolean;
  normalizedRole: NormalizedAdminRole;
  /** Roster email when `ADMIN_OPERATOR_EMAIL` is set. */
  operatorEmail: string | null;
  /** Active roster row id (used as default sales_rep_id when role is sales_rep). */
  rosterMemberId: string | null;
  rosterDisplayName: string | null;
  rosterRole: AdminTeamRole | string | null;
  /** Resolved sales rep id for scoping (roster id, else email local-part, else email). */
  salesRepId: string | null;
  salesRepName: string | null;
  /** When true, roster row was found and role drives scoping. */
  rosterResolved: boolean;
};

const OWNER_ROLES = new Set<NormalizedAdminRole>(["owner_admin", "admin_manager", "sales_manager", "content_admin"]);

function normalizeAdminRole(raw: string | null | undefined): NormalizedAdminRole {
  const r = (raw ?? "").trim().toLowerCase();
  switch (r) {
    case "super_admin":
    case "owner_admin":
      return "owner_admin";
    case "sales_manager":
      return "sales_manager";
    case "sales_rep":
      return "sales_rep";
    case "billing_support":
    case "admin_manager":
      return "admin_manager";
    case "content_manager":
    case "content_admin":
      return "content_admin";
    case "support_agent":
    case "support_admin":
      return "support_admin";
    case "ads_moderator":
    case "magazine_editor":
    case "read_only":
      return "owner_admin";
    default:
      return "owner_admin";
  }
}

export function isOwnerAdminRole(role: NormalizedAdminRole): boolean {
  return role === "owner_admin";
}

export function isSalesManagerRole(role: NormalizedAdminRole): boolean {
  return role === "sales_manager";
}

export function isSalesRepRole(role: NormalizedAdminRole): boolean {
  return role === "sales_rep";
}

export function canViewAllSalesRecords(role: NormalizedAdminRole): boolean {
  return OWNER_ROLES.has(role);
}

export function canManageAllPromoCodes(role: NormalizedAdminRole): boolean {
  return canViewAllSalesRecords(role);
}

export function canManageOwnPromoCodes(role: NormalizedAdminRole): boolean {
  return isSalesRepRole(role) || canManageAllPromoCodes(role);
}

export function canManageAllPackageEntitlements(role: NormalizedAdminRole): boolean {
  return canViewAllSalesRecords(role);
}

export function canManageOwnPackageEntitlements(role: NormalizedAdminRole): boolean {
  return isSalesRepRole(role) || canManageAllPackageEntitlements(role);
}

export function canViewPaymentTracker(role: NormalizedAdminRole): boolean {
  return role === "owner_admin";
}

export function canViewAdminUsers(role: NormalizedAdminRole): boolean {
  return role === "owner_admin";
}

export function canViewAdminTeam(role: NormalizedAdminRole): boolean {
  return role === "owner_admin";
}

export function canViewActivityLogs(role: NormalizedAdminRole): boolean {
  return role === "owner_admin";
}

export function canViewSiteSettings(role: NormalizedAdminRole): boolean {
  return role === "owner_admin" || role === "content_admin";
}

export function canViewGlobalAdminNav(role: NormalizedAdminRole): boolean {
  return !isSalesRepRole(role);
}

export type SalesRepScope = {
  salesRepId: string;
  salesRepName: string;
};

export function getSalesRepScopeForAdmin(ctx: AdminAccessContext): SalesRepScope | null {
  if (!isSalesRepRole(ctx.normalizedRole)) return null;
  if (!ctx.salesRepId) return null;
  return {
    salesRepId: ctx.salesRepId,
    salesRepName: ctx.salesRepName ?? ctx.salesRepId,
  };
}

function resolveSalesRepIdentity(
  email: string | null,
  roster: { id: string; display_name: string | null } | null,
): { salesRepId: string | null; salesRepName: string | null } {
  if (roster) {
    const name = roster.display_name?.trim() || (email ? email.split("@")[0] : "Sales rep");
    return { salesRepId: roster.id, salesRepName: name };
  }
  if (email) {
    const local = email.split("@")[0] || email;
    return { salesRepId: email, salesRepName: local };
  }
  return { salesRepId: null, salesRepName: null };
}

export async function getCurrentAdminAccessContext(): Promise<AdminAccessContext> {
  const c = await cookies();
  const hasAdminCookie = requireAdminCookie(c);
  const operatorEmail = (process.env.ADMIN_OPERATOR_EMAIL ?? "").trim().toLowerCase() || null;

  if (!hasAdminCookie) {
    return {
      hasAdminCookie: false,
      normalizedRole: "owner_admin",
      operatorEmail,
      rosterMemberId: null,
      rosterDisplayName: null,
      rosterRole: null,
      salesRepId: null,
      salesRepName: null,
      rosterResolved: false,
    };
  }

  if (!operatorEmail) {
    return {
      hasAdminCookie: true,
      normalizedRole: "owner_admin",
      operatorEmail: null,
      rosterMemberId: null,
      rosterDisplayName: null,
      rosterRole: null,
      salesRepId: null,
      salesRepName: null,
      rosterResolved: false,
    };
  }

  try {
    const supabase = getAdminSupabase();
    const { data: row } = await supabase
      .from("admin_team_members")
      .select("id, email, display_name, role, is_active")
      .eq("email", operatorEmail)
      .maybeSingle();

    if (!row || !row.is_active) {
      return {
        hasAdminCookie: true,
        normalizedRole: "owner_admin",
        operatorEmail,
        rosterMemberId: null,
        rosterDisplayName: null,
        rosterRole: null,
        salesRepId: null,
        salesRepName: null,
        rosterResolved: false,
      };
    }

    const rosterRole = String((row as { role?: string }).role ?? "");
    const normalizedRole = normalizeAdminRole(rosterRole);
    const rosterMemberId = String((row as { id: string }).id);
    const rosterDisplayName =
      (row as { display_name?: string | null }).display_name != null
        ? String((row as { display_name: string }).display_name)
        : null;
    const { salesRepId, salesRepName } = resolveSalesRepIdentity(operatorEmail, {
      id: rosterMemberId,
      display_name: rosterDisplayName,
    });

    return {
      hasAdminCookie: true,
      normalizedRole,
      operatorEmail,
      rosterMemberId,
      rosterDisplayName,
      rosterRole,
      salesRepId,
      salesRepName,
      rosterResolved: true,
    };
  } catch {
    return {
      hasAdminCookie: true,
      normalizedRole: "owner_admin",
      operatorEmail,
      rosterMemberId: null,
      rosterDisplayName: null,
      rosterRole: null,
      salesRepId: null,
      salesRepName: null,
      rosterResolved: false,
    };
  }
}

export function promoCodeBelongsToSalesRep(
  row: { sales_rep_id: string | null },
  salesRepId: string,
): boolean {
  const id = row.sales_rep_id?.trim();
  if (!id) return false;
  return id === salesRepId;
}

export function entitlementBelongsToSalesRep(
  row: { metadata: Record<string, unknown> },
  salesRepId: string,
): boolean {
  const meta = row.metadata ?? {};
  const id =
    meta.sales_rep_id != null
      ? String(meta.sales_rep_id).trim()
      : "";
  if (!id) return false;
  return id === salesRepId;
}

export function filterPromoCodesForAccess<T extends { sales_rep_id: string | null }>(
  rows: T[],
  ctx: AdminAccessContext,
): T[] {
  const scope = getSalesRepScopeForAdmin(ctx);
  if (!scope) return rows;
  return rows.filter((r) => promoCodeBelongsToSalesRep(r, scope.salesRepId));
}

export function filterEntitlementsForAccess<T extends { metadata: Record<string, unknown> }>(
  rows: T[],
  ctx: AdminAccessContext,
): T[] {
  const scope = getSalesRepScopeForAdmin(ctx);
  if (!scope) return rows;
  return rows.filter((r) => entitlementBelongsToSalesRep(r, scope.salesRepId));
}

export function resolveSalesRepFieldsForCreate(
  ctx: AdminAccessContext,
  formSalesRepId: string | null,
  formSalesRepName: string | null,
): { salesRepId: string | null; salesRepName: string | null } {
  const scope = getSalesRepScopeForAdmin(ctx);
  if (scope) {
    return { salesRepId: scope.salesRepId, salesRepName: scope.salesRepName };
  }
  return {
    salesRepId: formSalesRepId,
    salesRepName: formSalesRepName,
  };
}

export function requirePaymentTrackerAccess(ctx: AdminAccessContext): void {
  if (!canViewPaymentTracker(ctx.normalizedRole)) {
    redirect("/admin?access_denied=payment_tracker");
  }
}

export function requireAdminTeamAccess(ctx: AdminAccessContext): void {
  if (!canViewAdminTeam(ctx.normalizedRole)) {
    redirect("/admin?access_denied=team");
  }
}

/** Workspace sub-nav hrefs visible for the current admin. */
export function getAllowedWorkspaceNavHrefs(ctx: AdminAccessContext): string[] {
  if (isSalesRepRole(ctx.normalizedRole)) {
    return [];
  }
  return [
    "/admin/workspace/home",
    "/admin/workspace/clasificados",
    "/admin/workspace/package-entitlements",
    "/admin/workspace/promo-codes",
    "/admin/workspace/sales-tracker",
    "/admin/workspace/payment-tracker",
    "/admin/workspace/tienda",
    "/admin/workspace/nosotros",
    "/admin/workspace/revista",
    "/admin/workspace/contacto",
    "/admin/workspace/noticias",
    "/admin/workspace/iglesias",
    "/admin/workspace/cupones",
    "/admin/workspace/anunciate",
  ];
}

/** Global sidebar hrefs (top-level admin shell). */
export function getAllowedGlobalNavHrefs(ctx: AdminAccessContext): string[] {
  if (isSalesRepRole(ctx.normalizedRole)) {
    return ["/admin/team", "/admin/support"];
  }
  const hrefs = ["/admin"];
  if (canViewGlobalAdminNav(ctx.normalizedRole)) {
    hrefs.push(
      "/admin/team",
      "/admin/workspace/clasificados",
      "/admin/tienda",
      "/admin/workspace",
      "/admin/clasificados/viajes",
      "/admin/usuarios",
      "/admin/ops",
      "/admin/leads/newsletter",
      "/admin/support",
    );
    if (canViewPaymentTracker(ctx.normalizedRole)) {
      hrefs.push("/admin/workspace/payment-tracker");
    }
    if (canViewAdminTeam(ctx.normalizedRole)) {
      hrefs.push("/admin/team/roster");
    }
    if (canViewActivityLogs(ctx.normalizedRole)) {
      hrefs.push("/admin/activity-log");
    }
    if (canViewSiteSettings(ctx.normalizedRole)) {
      hrefs.push("/admin/settings", "/admin/workspace/language-audit");
    }
  }
  return hrefs;
}

export async function loadPromoCodeForAccessCheck(id: string) {
  const supabase = getAdminSupabase();
  const { data } = await supabase.from("leonix_promo_codes").select("id, sales_rep_id").eq("id", id).maybeSingle();
  if (!data) return null;
  return {
    id: String((data as { id: string }).id),
    sales_rep_id:
      (data as { sales_rep_id?: string | null }).sales_rep_id != null
        ? String((data as { sales_rep_id: string }).sales_rep_id)
        : null,
  };
}

export async function loadEntitlementForAccessCheck(id: string) {
  const supabase = getAdminSupabase();
  const { data } = await supabase.from("listing_package_entitlements").select("id, metadata").eq("id", id).maybeSingle();
  if (!data) return null;
  const metaRaw = (data as { metadata?: unknown }).metadata;
  const metadata =
    metaRaw && typeof metaRaw === "object" && !Array.isArray(metaRaw)
      ? (metaRaw as Record<string, unknown>)
      : {};
  return { id: String((data as { id: string }).id), metadata };
}

export async function assertCanManagePromoCode(id: string, ctx: AdminAccessContext): Promise<void> {
  if (canManageAllPromoCodes(ctx.normalizedRole)) return;
  const scope = getSalesRepScopeForAdmin(ctx);
  if (!scope) throw new Error("Forbidden");
  const row = await loadPromoCodeForAccessCheck(id);
  if (!row || !promoCodeBelongsToSalesRep(row, scope.salesRepId)) {
    throw new Error("Forbidden: promo code not in your sales scope");
  }
}

export async function assertCanManageEntitlement(id: string, ctx: AdminAccessContext): Promise<void> {
  if (canManageAllPackageEntitlements(ctx.normalizedRole)) return;
  const scope = getSalesRepScopeForAdmin(ctx);
  if (!scope) throw new Error("Forbidden");
  const row = await loadEntitlementForAccessCheck(id);
  if (!row || !entitlementBelongsToSalesRep(row, scope.salesRepId)) {
    throw new Error("Forbidden: entitlement not in your sales scope");
  }
}

export async function guardWorkspaceMonetizationPage(
  pathname: string,
  ctx: AdminAccessContext,
): Promise<void> {
  if (!isSalesRepRole(ctx.normalizedRole)) return;
  const allowed = getAllowedWorkspaceNavHrefs(ctx);
  const ok = allowed.some((h) => pathname === h || pathname.startsWith(`${h}/`));
  if (!ok) {
    redirect("/admin/team?access_denied=1");
  }
}
