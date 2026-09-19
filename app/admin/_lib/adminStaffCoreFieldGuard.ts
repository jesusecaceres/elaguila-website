/**
 * Staff "Edit listing" form guard (2026-09 forensic closeout).
 *
 * The generic staff Edit form exposes free-text `category`, `status` and an `is_published` checkbox. Written
 * verbatim they were a second publication authority: a never-paid `pending` Rentas / Bienes / Clases row could be
 * switched `active` + published with no payment, a FSBO row could skip its term, a Negocio row could skip the
 * capacity RPC, and `category` could move a row to another lane.
 *
 * Rule: field edits (title, description, city, price, detail_pairs, is_free) are always saved. `category` is
 * never changed here. `status` / `is_published` are saved only when they do NOT activate a row that is not
 * already live — activation is Restore / Republish (which own the payment, term and capacity gates).
 *
 * PURE: no I/O.
 */
import { decideAdminReactivation } from "@/app/admin/_lib/adminReactivationPolicy";
import { decideBrFsboAdminRestore, isAdminBrFsboRow } from "@/app/admin/_lib/adminBrFsboRestorePolicy";

export type StaffCoreCurrentRow = {
  category?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  published_at?: string | null;
  expires_at?: string | null;
  seller_type?: string | null;
  listing_json?: unknown;
};

export type StaffCoreRequested = { category: string; status: string; isPublished: boolean };

export type StaffCoreLifecycleDecision = {
  /** Always the row's existing category (an empty existing category accepts the typed one). */
  category: string;
  /** Present only when the requested lifecycle change is allowed; omit from the patch otherwise. */
  lifecyclePatch: { status: string; is_published: boolean } | null;
  /** Human-readable reasons a requested field was ignored (audit meta). */
  ignored: string[];
};

function norm(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

export function guardStaffCoreFieldLifecycle(
  current: StaffCoreCurrentRow,
  requested: StaffCoreRequested,
): StaffCoreLifecycleDecision {
  const ignored: string[] = [];
  const currentCategory = String(current.category ?? "").trim();
  let category = requested.category;
  if (currentCategory) {
    if (norm(requested.category) !== norm(currentCategory)) ignored.push("category_change_ignored");
    category = currentCategory;
  }

  const curStatus = norm(current.status);
  const curPublished = current.is_published === true;
  const reqStatus = norm(requested.status) || "active";
  const unchanged = reqStatus === curStatus && requested.isPublished === curPublished;
  if (unchanged) return { category, lifecyclePatch: { status: requested.status, is_published: requested.isPublished }, ignored };

  const currentLiveFlags = curPublished && curStatus === "active";
  const requestsLive = requested.isPublished || reqStatus === "active";
  if (!requestsLive || currentLiveFlags) {
    return { category, lifecyclePatch: { status: requested.status, is_published: requested.isPublished }, ignored };
  }

  // Activation of a row that is not already live: only through the gated Restore / Republish actions.
  const cat = norm(category);
  const reactivation = decideAdminReactivation({
    category,
    status: current.status,
    published_at: current.published_at,
    expires_at: current.expires_at,
  });
  if (reactivation.blocked) {
    ignored.push("activation_ignored_payment_required");
    return { category, lifecyclePatch: null, ignored };
  }
  const fsbo = decideBrFsboAdminRestore({
    category,
    seller_type: current.seller_type,
    listing_json: current.listing_json,
    status: current.status,
    published_at: current.published_at,
    expires_at: current.expires_at,
  });
  if (fsbo.fsbo && fsbo.blocked) {
    ignored.push(`activation_ignored_${fsbo.code}`);
    return { category, lifecyclePatch: null, ignored };
  }
  if (cat === "bienes-raices" && !isAdminBrFsboRow({ category, seller_type: current.seller_type, listing_json: current.listing_json })) {
    ignored.push("activation_ignored_capacity_rpc_required");
    return { category, lifecyclePatch: null, ignored };
  }
  if (fsbo.fsbo) {
    ignored.push("activation_ignored_use_restore");
    return { category, lifecyclePatch: null, ignored };
  }
  return { category, lifecyclePatch: { status: requested.status, is_published: requested.isPublished }, ignored };
}
