/**
 * Package C Build 4 (C7) — thin TS wrappers around the two atomic capacity+lifecycle-deriving
 * activation RPCs (`autos_dealer_activate_listing`, `br_negocio_activate_listing`; see the
 * migration `20260810120000_autos_br_negocio_capacity_activation_rpc.sql`). These RPCs are the
 * FINAL financial authority for any capacity-increasing ACTIVE transition — `commercialWriteGuard.ts`
 * remains UX/preflight only. Every real Autos/Bienes activation write path must call the
 * corresponding wrapper here instead of a bare `.update({status:'active'})`.
 *
 * NOTE: the migration is authored but NOT applied to any database in this build (Package C Build
 * 4 convention) — these wrappers will fail with a real Postgres "function does not exist" error
 * until the migration is applied as a separate, later, explicitly-authorized step. That failure
 * mode is intentional and matches every prior build's "authored, not applied" migration discipline.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type CapacityActivationBlockedReason =
  | "not_found_or_owner_mismatch"
  | "status_mismatch"
  | "no_parent_link"
  | "parent_not_found_or_owner_mismatch"
  | "grace_blocks_new_capacity"
  | "subscription_suspended"
  | "subscription_canceled"
  | "capacity_reached";

export type CapacityActivationResult = {
  ok: boolean;
  activated: boolean;
  idempotent: boolean;
  blockedReason: CapacityActivationBlockedReason | null;
  activeCount: number | null;
  effectiveLimit: number | null;
  /** Set only on an unexpected RPC/transport failure (e.g. migration not yet applied). */
  rpcError?: string;
};

type RpcRow = {
  activated: boolean;
  idempotent: boolean;
  blocked_reason: string | null;
  active_count: number | null;
  effective_limit: number | null;
};

function mapRpcRow(row: RpcRow | null | undefined): CapacityActivationResult {
  if (!row) {
    return { ok: false, activated: false, idempotent: false, blockedReason: null, activeCount: null, effectiveLimit: null, rpcError: "empty_rpc_result" };
  }
  return {
    ok: true,
    activated: row.activated === true,
    idempotent: row.idempotent === true,
    blockedReason: (row.blocked_reason as CapacityActivationBlockedReason) ?? null,
    activeCount: row.active_count ?? null,
    effectiveLimit: row.effective_limit ?? null,
  };
}

/**
 * Autos dealer inventory — atomic activation. `fromStatus` must be the row's expected current
 * status (e.g. "draft", "pending_payment") for a fresh activation; an already-active target is
 * handled idempotently by the RPC regardless of `fromStatus`.
 */
export async function activateAutosDealerListingAtomic(input: {
  listingId: string;
  ownerUserId: string;
  fromStatus: string;
}): Promise<CapacityActivationResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, activated: false, idempotent: false, blockedReason: null, activeCount: null, effectiveLimit: null, rpcError: "supabase_not_configured" };
  }
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("autos_dealer_activate_listing", {
    p_listing_id: input.listingId,
    p_owner_user_id: input.ownerUserId,
    p_from_status: input.fromStatus,
  });
  if (error) {
    return { ok: false, activated: false, idempotent: false, blockedReason: null, activeCount: null, effectiveLimit: null, rpcError: error.message };
  }
  const row = Array.isArray(data) ? (data[0] as RpcRow | undefined) : (data as RpcRow | undefined);
  return mapRpcRow(row);
}

/**
 * Bienes Raíces Negocio inventory — atomic activation. Same contract shape as the Autos wrapper.
 */
export async function activateBrNegocioListingAtomic(input: {
  listingId: string;
  ownerId: string;
  fromStatus: string;
}): Promise<CapacityActivationResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, activated: false, idempotent: false, blockedReason: null, activeCount: null, effectiveLimit: null, rpcError: "supabase_not_configured" };
  }
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("br_negocio_activate_listing", {
    p_listing_id: input.listingId,
    p_owner_id: input.ownerId,
    p_from_status: input.fromStatus,
  });
  if (error) {
    return { ok: false, activated: false, idempotent: false, blockedReason: null, activeCount: null, effectiveLimit: null, rpcError: error.message };
  }
  const row = Array.isArray(data) ? (data[0] as RpcRow | undefined) : (data as RpcRow | undefined);
  return mapRpcRow(row);
}
