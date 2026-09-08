/**
 * Work Package I.9A — display-only Admin status/attention helper. Reuses the owner-dashboard's
 * `resolveOwnerDashboardStatusDisplay()` (app/(site)/dashboard/lib/dashboardOwnerStatusDisplay.ts,
 * I.8A/I.8B) directly for every category it already covers correctly — Restaurantes, Servicios,
 * Empleos, Viajes all use identical DB status vocabularies in Admin as in the owner dashboard
 * (same tables, same columns), so there is no reason to duplicate that mapping table here per
 * Objective H's "reuse or adapt existing display-only status normalization where appropriate."
 * Adds only what's genuinely Admin-specific on top: attention reasons that only make sense from
 * a staff perspective (unsupported pipeline, unsafe/no-handler route, pending moderation, missing
 * owner, parent/child identity inconsistency, incomplete Admin action).
 *
 * Pure, no I/O, no writes, no notifications, no background jobs — same contract as the
 * owner-dashboard equivalents this reuses.
 */
import { resolveOwnerDashboardStatusDisplay, type OwnerDashboardStatusDisplay } from "@/app/(site)/dashboard/lib/dashboardOwnerStatusDisplay";
import type { AdminActionStatus } from "./adminActionTruth";

export type AdminAttentionSeverity = "info" | "warn" | "urgent";

export type AdminAttentionReasonKey =
  | "unsupported_pipeline"
  | "unsafe_or_missing_route"
  | "unknown_status"
  | "pending_moderation"
  | "suspended_listing"
  | "payment_required"
  | "expired_entitlement"
  | "missing_owner"
  | "parent_child_inconsistency"
  | "incomplete_admin_action";

export type AdminAttentionItem = {
  id: string;
  category: string;
  severity: AdminAttentionSeverity;
  reasonKey: AdminAttentionReasonKey;
  labelEs: string;
  labelEn: string;
};

/** Delegates directly to the owner-dashboard helper — same real mapping tables, same
 * unknown-never-active contract. Re-exported under an Admin-facing name for call-site clarity. */
export function resolveAdminListingStatusDisplay(category: string, rawStatus: string | null | undefined): OwnerDashboardStatusDisplay {
  return resolveOwnerDashboardStatusDisplay(category, rawStatus);
}

function item(id: string, category: string, severity: AdminAttentionSeverity, reasonKey: AdminAttentionReasonKey, labelEs: string, labelEn: string): AdminAttentionItem {
  return { id, category, severity, reasonKey, labelEs, labelEn };
}

export type AdminAttentionRowInput = {
  id: string;
  category: string;
  /** Set when `classifyAdminListingRow()` returned group "unsupported". */
  isUnsupportedPipeline?: boolean;
  /** A resolved display status, when the category has a real mapping (Empleos/Viajes/
   * Restaurantes/Servicios via `resolveAdminListingStatusDisplay`, or "unknown" when the caller
   * has no mapping for this category — never guessed. */
  statusDisplayKey?: OwnerDashboardStatusDisplay["displayKey"] | "unknown";
  /** True when the listing's own status column is a real, recognized "suspended" value for its
   * category (e.g. Restaurantes `status === "suspended"`). */
  isSuspended?: boolean;
  /** True when the caller confirmed a real, unresolved (status "pending") moderation/report
   * item exists for this row — from a real queue, never fabricated. */
  hasPendingModeration?: boolean;
  /** True only when the caller has real, server-verified entitlement/payment truth showing
   * payment is required (mirrors the owner-dashboard's same strict contract). */
  paymentRequired?: boolean;
  /** True only when the caller has real, server-verified entitlement data showing it is expired. */
  entitlementExpired?: boolean;
  /** True when the row's `owner_id`/`owner_user_id` is null/empty — a real data-integrity fact,
   * never inferred. */
  missingOwner?: boolean;
  /** True when the caller confirmed (via `classifyAdminListingRow`) this is a child inventory
   * row being viewed/acted on without its parent context resolved. */
  parentChildInconsistent?: boolean;
  /** Real action-truth statuses for this row's pipeline (from `resolveAdminActionTruth`) — used
   * to flag genuinely incomplete tools, never a guess. */
  actionStatuses?: AdminActionStatus[];
};

/**
 * Derive the (possibly empty) list of Admin attention items for one listing row. Every item is
 * strictly gated on caller-supplied, already-verified facts — this function invents nothing.
 */
export function resolveAdminAttentionItems(row: AdminAttentionRowInput): AdminAttentionItem[] {
  const out: AdminAttentionItem[] = [];
  const { id, category } = row;

  if (row.isUnsupportedPipeline) {
    out.push(item(id, category, "warn", "unsupported_pipeline", "Categoría no organizada por Admin todavía.", "Category not yet organized by Admin.", ));
  }

  if (row.statusDisplayKey === "unknown") {
    out.push(item(id, category, "warn", "unknown_status", "Estado desconocido — revisar manualmente.", "Unknown status — review manually."));
  }

  if (row.isSuspended) {
    out.push(item(id, category, "urgent", "suspended_listing", "Anuncio suspendido.", "Listing suspended."));
  }

  if (row.hasPendingModeration) {
    out.push(item(id, category, "warn", "pending_moderation", "Reporte o moderación pendiente.", "Pending report or moderation item."));
  }

  if (row.paymentRequired) {
    out.push(item(id, category, "urgent", "payment_required", "Pago pendiente confirmado por el servidor.", "Server-confirmed payment pending."));
  }

  if (row.entitlementExpired) {
    out.push(item(id, category, "warn", "expired_entitlement", "Entitlement expirado.", "Entitlement expired."));
  }

  if (row.missingOwner) {
    out.push(item(id, category, "urgent", "missing_owner", "Anuncio sin propietario identificado.", "Listing has no identified owner."));
  }

  if (row.parentChildInconsistent) {
    out.push(item(id, category, "warn", "parent_child_inconsistency", "Fila de inventario hijo sin contexto de padre resuelto.", "Child inventory row without a resolved parent context."));
  }

  const incompleteCount = (row.actionStatuses ?? []).filter((s) => s === "ui_only_no_handler" || s === "stale_or_unsafe").length;
  if (incompleteCount > 0) {
    out.push(item(id, category, "info", "incomplete_admin_action", `${incompleteCount} acción(es) de Admin incompleta(s) o insegura(s) para este anuncio.`, `${incompleteCount} incomplete or unsafe Admin action(s) for this listing.`));
  }

  return out;
}

export function countAdminAttentionBySeverity(items: AdminAttentionItem[]): Record<AdminAttentionSeverity, number> {
  const out: Record<AdminAttentionSeverity, number> = { info: 0, warn: 0, urgent: 0 };
  for (const it of items) out[it.severity] += 1;
  return out;
}
