/**
 * READ-ONLY evidence loaders for `adminPaymentSuspensionPolicy.ts` (2026-09 Gate 5).
 *
 * Both loaders only SELECT - Admin never writes payment, entitlement or subscription truth. Any error (a missing
 * column, a network failure) is reported as "unreadable" so the caller fails CLOSED for a reactivation; it is never
 * mapped to "no hold". Takes the Supabase client as a parameter (no `server-only` import) so the verifier can drive
 * it with an in-memory fake.
 */
import {
  ADMIN_BASE_ENTITLEMENT_PACKAGE_KEYS,
  classifyAdminEntitlementRows,
  decideAdminReactivationHold,
  type AdminEntitlementEvidence,
  type AdminReactivationHoldDecision,
  type AdminSuspendedReasonRead,
} from "@/app/admin/_lib/adminPaymentSuspensionPolicy";

type SupabaseLike = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** `suspended_reason` of one row (`null` value = the column was read and holds no reason). */
export async function readAdminSuspendedReason(supabase: SupabaseLike, table: string, id: string): Promise<AdminSuspendedReasonRead> {
  try {
    const { data, error } = await supabase.from(table).select("suspended_reason").eq("id", id).maybeSingle();
    if (error || !data) return { read: false };
    const raw = (data as { suspended_reason?: unknown }).suspended_reason;
    return { read: true, value: typeof raw === "string" && raw.trim() ? raw.trim() : null };
  } catch {
    return { read: false };
  }
}

/** Base-package entitlement evidence for one listing (read-only). */
export async function readAdminBaseEntitlementEvidence(supabase: SupabaseLike, listingId: string, nowMs: number = Date.now()): Promise<AdminEntitlementEvidence> {
  try {
    const { data, error } = await supabase
      .from("listing_package_entitlements")
      .select("status, ends_at, package_key")
      .eq("listing_id", listingId)
      .in("package_key", [...ADMIN_BASE_ENTITLEMENT_PACKAGE_KEYS])
      .limit(50);
    if (error || !Array.isArray(data)) return "unreadable";
    return classifyAdminEntitlementRows(data as { status?: unknown; ends_at?: unknown }[], nowMs);
  } catch {
    return "unreadable";
  }
}

/**
 * The one call every reactivating Admin route makes: load the evidence, then decide.
 * `requireEntitlement` - true for lanes that sell a base package (Servicios, Restaurantes, Comida Local, Autos
 * dealer, Bienes Raices Negocio); false for one-time / term lanes.
 */
export async function evaluateAdminReactivationHold(
  supabase: SupabaseLike,
  input: {
    table: string;
    id: string;
    status?: string | null;
    paymentEngineStatus?: string | null;
    requireEntitlement: boolean;
    /** Already-read reason (e.g. the row was fetched with `suspended_reason`); skips the extra read. */
    suspendedReason?: AdminSuspendedReasonRead;
  },
): Promise<AdminReactivationHoldDecision> {
  const suspendedReason = input.suspendedReason ?? (await readAdminSuspendedReason(supabase, input.table, input.id));
  const entitlement = input.requireEntitlement ? await readAdminBaseEntitlementEvidence(supabase, input.id) : undefined;
  return decideAdminReactivationHold({
    status: input.status,
    suspendedReason,
    paymentEngineStatus: input.paymentEngineStatus,
    entitlement,
  });
}
