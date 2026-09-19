/**
 * EMPLEOS ADMIN — the ONE server implementation of every staff lifecycle / trust action.
 * Both `PATCH /api/admin/empleos/listings/[id]` and the legacy `POST .../moderate` shim call this;
 * neither route owns lifecycle logic any more. Reads (row + verified payment record) and ONE update;
 * writes an audit-log row for every applied action. Never marks anything paid.
 *
 * No static `server-only` import so the tsx verifier can drive it with an injected fake Supabase / audit /
 * revalidate; production callers use the defaults.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { loadAdminListingCommercialTruth } from "@/app/admin/_lib/adminListingCommercialTruth";
import {
  decideEmpleosStaffAction,
  empleosStaffActionNeedsPaymentCheck,
  empleosStaffActionNeedsReversalCheck,
  isEmpleosStaffAction,
  type EmpleosStaffAction,
} from "@/app/admin/_lib/adminEmpleosStaffActions";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const ROW_SELECT =
  "id, slug, lifecycle_status, lane, published_at, moderation_reason, admin_promoted, leonix_verified, republish_count, republish_override";

export type RunEmpleosStaffActionResult = { status: number; body: Record<string, unknown> };

export type RunEmpleosStaffActionDeps = {
  supabase?: SupabaseClient;
  audit?: (entry: { action: string; targetType: string; targetId: string; meta: Record<string, unknown> }) => Promise<unknown>;
  revalidate?: (path: string) => void;
  /** Override the verified-payment read (tests). Default: read-only commercial truth loader. */
  paymentCleared?: (listingId: string, supabase: SupabaseClient) => Promise<boolean>;
  /** Override the dispute read (tests). Default: read-only commercial truth loader. Unreadable => NOT reversed (never-live rows stay gated by paymentCleared). */
  paymentReversed?: (listingId: string, supabase: SupabaseClient) => Promise<boolean>;
};

/** Read-only: a `paid` payment record exists for the listing. Anything unreadable / absent => not cleared. */
async function defaultPaymentCleared(listingId: string, supabase: SupabaseClient): Promise<boolean> {
  try {
    const map = await loadAdminListingCommercialTruth({ category: "empleos", listingIds: [listingId], supabase });
    const t = map[listingId];
    return Boolean(t && t.state === "known" && ["paid", "succeeded", "cleared", "payment_cleared"].includes(String(t.paymentStatus ?? "").trim().toLowerCase()));
  } catch {
    return false;
  }
}

/** Read-only: the newest money-final payment record is DISPUTED (chargeback). Anything unreadable => false (no claim). */
async function defaultPaymentReversed(listingId: string, supabase: SupabaseClient): Promise<boolean> {
  try {
    const map = await loadAdminListingCommercialTruth({ category: "empleos", listingIds: [listingId], supabase });
    const t = map[listingId];
    return Boolean(t && t.state === "known" && String(t.paymentStatus ?? "").trim().toLowerCase() === "disputed");
  } catch {
    return false;
  }
}

export async function runEmpleosStaffAction(
  input: { id: string; action: unknown; reason?: unknown },
  deps: RunEmpleosStaffActionDeps = {},
): Promise<RunEmpleosStaffActionResult> {
  const id = String(input.id ?? "").trim();
  if (!id) return { status: 400, body: { ok: false, error: "missing_id" } };
  if (!isEmpleosStaffAction(input.action)) return { status: 400, body: { ok: false, error: "invalid_action" } };
  const action: EmpleosStaffAction = input.action;

  let supabase = deps.supabase;
  if (!supabase) {
    if (!isSupabaseAdminConfigured()) return { status: 503, body: { ok: false, error: "supabase_not_configured" } };
    supabase = getAdminSupabase();
  }

  const { data: row, error: rErr } = await supabase.from("empleos_public_listings").select(ROW_SELECT).eq("id", id).maybeSingle();
  if (rErr || !row) return { status: 404, body: { ok: false, error: "not_found" } };
  const rowRec = row as Record<string, unknown>;

  const rowState = {
    lifecycle_status: rowRec.lifecycle_status as string | null,
    lane: rowRec.lane as string | null,
    published_at: rowRec.published_at as string | null,
    moderation_reason: rowRec.moderation_reason as string | null,
    republish_count: rowRec.republish_count as number | null,
    republish_override: rowRec.republish_override as boolean | null,
  };
  const paymentCleared = empleosStaffActionNeedsPaymentCheck(action, rowState)
    ? await (deps.paymentCleared ?? defaultPaymentCleared)(id, supabase)
    : null;

  const paymentReversed = empleosStaffActionNeedsReversalCheck(action, rowState)
    ? await (deps.paymentReversed ?? defaultPaymentReversed)(id, supabase)
    : null;

  const decision = decideEmpleosStaffAction({ action, row: rowState, reason: input.reason, now: new Date().toISOString(), paymentCleared, paymentReversed });
  if (!decision.ok) {
    return { status: decision.status, body: { ok: false, error: decision.error, message: decision.message } };
  }

  let q = supabase.from("empleos_public_listings").update(decision.patch).eq("id", id);
  // Optimistic guard: a lifecycle change applies only to the status the decision was made on (a webhook
  // activation or an owner action may have moved the row meanwhile).
  if (decision.lifecycle && rowState.lifecycle_status) q = q.eq("lifecycle_status", rowState.lifecycle_status);
  const { data: updated, error } = await q.select("id");
  if (error) return { status: 500, body: { ok: false, error: error.message } };
  if (!updated || updated.length === 0) {
    return { status: 409, body: { ok: false, error: "state_changed", message: "The listing changed while you were acting on it. Reload and try again." } };
  }

  const slug = String(rowRec.slug ?? "");
  // Lazy import: adminAuditLogServer is `server-only` (fine in a route, unloadable under the raw tsx verifier).
  const audit = deps.audit ?? (await import("@/app/admin/_lib/adminAuditLogServer")).appendAdminAuditLog;
  await audit({
    action: decision.auditAction,
    targetType: "empleos_public_listing",
    targetId: id,
    meta: {
      slug,
      patch: decision.patch,
      previous_status: rowState.lifecycle_status,
      lane: rowState.lane,
      ...(input.reason ? { reason: decision.patch.moderation_reason ?? null } : {}),
    },
  });

  const revalidate = deps.revalidate ?? revalidatePath;
  revalidate("/clasificados/empleos");
  revalidate("/clasificados/empleos/resultados");
  revalidate("/admin/workspace/clasificados/empleos");
  if (slug) revalidate(`/clasificados/empleos/${slug}`);

  return { status: 200, body: { ok: true, id, slug, ...decision.patch } };
}
