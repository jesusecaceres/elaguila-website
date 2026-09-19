/**
 * Admin Restore / Republish for a Bienes Raices FSBO (Privado) row — closeout 2.
 *
 * WHY THIS EXISTS: the generic `listings` admin route treated ANY bienes-raices row with a null
 * `inventory_role` as a Negocio "main" and reactivated it through `br_negocio_activate_listing`, an RPC
 * built for the Negocio SUBSCRIPTION model (capacity, no `expires_at`, no payment check). An FSBO row
 * is a one-time, fixed-term (`expires_at`) product — routing it through the Negocio RPC could switch a
 * never-paid or already-elapsed listing back on with no term and no payment.
 *
 * FSBO Restore is therefore its OWN path with three invariants:
 *   1. only a row that WAS live can be restored (`published_at` or `expires_at` present — the Revenue OS
 *      fulfilment writes both on the first paid activation; a pending-payment insert writes neither);
 *   2. the existing `expires_at` is NEVER extended or re-granted — if the term has elapsed the answer is
 *      "renewal required" (a paid renewal through Revenue OS, not an admin write);
 *   3. a `pending` / `pending_payment` / `draft` row can never be activated here.
 * Negocio rows are unaffected and keep the RPC.
 *
 * PURE: no I/O.
 */
import { isBrFsboRow } from "@/app/lib/listingLifecycle/bienesFsboLifecycle";

export type BrFsboRestoreRow = {
  category?: string | null;
  seller_type?: string | null;
  listing_json?: unknown;
  status?: string | null;
  published_at?: string | null;
  expires_at?: string | null;
};

export type BrFsboRestoreDecision =
  | { fsbo: false }
  | { fsbo: true; blocked: true; code: "payment_required" | "renewal_required"; message: string }
  | { fsbo: true; blocked: false; expectedStatus: string; patch: { status: "active"; is_published: true } };

function norm(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}
function validIso(v: unknown): number | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const ms = new Date(v).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function isAdminBrFsboRow(row: BrFsboRestoreRow): boolean {
  return isBrFsboRow({
    category: row.category,
    seller_type: row.seller_type,
    listing_json: row.listing_json,
  });
}

export function decideBrFsboAdminRestore(row: BrFsboRestoreRow, nowMs: number = Date.now()): BrFsboRestoreDecision {
  if (!isAdminBrFsboRow(row)) return { fsbo: false };
  const status = norm(row.status);
  const publishedMs = validIso(row.published_at);
  const expiresMs = validIso(row.expires_at);

  if (status === "pending" || status === "pending_payment" || status === "draft" || (publishedMs === null && expiresMs === null)) {
    return {
      fsbo: true,
      blocked: true,
      code: "payment_required",
      message:
        "This private-seller listing was never live (no verified payment / publication on record). Restore cannot activate it; it goes live only through a verified payment.",
    };
  }
  if (expiresMs !== null && expiresMs <= nowMs) {
    return {
      fsbo: true,
      blocked: true,
      code: "renewal_required",
      message:
        "renewal required: this private-seller listing's paid term has elapsed. Restore never grants a new term — the owner must renew through Revenue OS.",
    };
  }
  return { fsbo: true, blocked: false, expectedStatus: status, patch: { status: "active", is_published: true } };
}
