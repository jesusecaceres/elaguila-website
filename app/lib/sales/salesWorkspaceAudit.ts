import "server-only";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";

/**
 * REQUIRED REPAIR 6 — staff audit for the assisted sales workflow.
 *
 * Written through the EXISTING canonical audit architecture: `appendAdminAuditLog` into
 * `admin_audit_log`, the one audit table in this codebase whose `action` column is free-form text
 * with no CHECK constraint — which is precisely why no migration is needed to record these
 * actions. (`business_sales_audit_log` and `admin_roster_audit_log` both pin `action` to a locked
 * enumeration; adding to either would require applying a migration, which this work may not do.)
 *
 * The writer resolves the acting operator from the admin session itself, so the staff actor on the
 * row is the real one rather than whatever the caller passed. It is best-effort and never throws:
 * an audit failure must not be able to fail a save that already succeeded, and must equally never
 * be able to make a refused save look like it happened.
 *
 * NEVER LOGGED: the preview token, any signing secret, any bearer token, or any payload field that
 * could carry one. A preview issuance records THAT a link was issued, for which row, and when it
 * expires — never the link itself, because an audit log is read by more people than a preview link
 * is meant for.
 */

export type SalesWorkspaceAuditAction =
  | "quick_sales_custody_established"
  | "quick_sales_save_for_client"
  | "quick_sales_preview_issued"
  | "quick_sales_publish_attempted"
  | "quick_sales_publish_completed";

export type SalesWorkspaceAuditEntry = {
  action: SalesWorkspaceAuditAction;
  /** The staff roster member the assisted context names (attribution, not authority). */
  actorRosterId?: string | null;
  businessId?: string | null;
  /** The customer whose account the listing is attributed to, where the category has one. */
  clientUserId?: string | null;
  category?: string | null;
  listingSource?: string | null;
  /** The canonical listing / draft row this action concerned. */
  listingId?: string | null;
  /** Payment / entitlement state as the SERVER resolved it, whenever publication was in play. */
  paymentState?: string | null;
  /** "ok" or the machine refusal code. Refusals are audited exactly as successes are. */
  outcome: string;
  /** Any additional non-sensitive context. Values are passed through verbatim — keep them safe. */
  detail?: Record<string, unknown>;
};

/** Keys that must never reach an audit row, whatever a caller passes in `detail`. */
const FORBIDDEN_DETAIL_KEYS = new Set([
  "token",
  "previewToken",
  "preview_token",
  "secret",
  "password",
  "authorization",
  "cookie",
  "accessToken",
  "access_token",
]);

function scrubDetail(detail: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!detail) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(detail)) {
    if (FORBIDDEN_DETAIL_KEYS.has(key)) continue;
    out[key] = value;
  }
  return out;
}

export async function recordSalesWorkspaceAudit(entry: SalesWorkspaceAuditEntry): Promise<void> {
  try {
    await appendAdminAuditLog({
      action: entry.action,
      // The canonical listing row is the audit target whenever there is one; before the first save
      // creates it, the business is. An audit row with no target is not useful to anyone.
      targetType: entry.listingId ? "listing" : "business",
      targetId: entry.listingId || entry.businessId || null,
      meta: {
        source: "leonix_quick_sales_workspace",
        category: entry.category ?? null,
        business_id: entry.businessId ?? null,
        client_user_id: entry.clientUserId ?? null,
        listing_source: entry.listingSource ?? null,
        listing_id: entry.listingId ?? null,
        assisted_roster_id: entry.actorRosterId ?? null,
        payment_state: entry.paymentState ?? null,
        outcome: entry.outcome,
        at: new Date().toISOString(),
        ...scrubDetail(entry.detail),
      },
    });
  } catch {
    // Best-effort by contract. See the module comment.
  }
}
