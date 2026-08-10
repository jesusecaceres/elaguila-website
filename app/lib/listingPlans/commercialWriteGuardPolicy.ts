/**
 * Package C Build 1 (decision 11) — pure commercial write policy (no server imports;
 * behaviorally testable). The impure guard in commercialWriteGuard.ts resolves the real
 * entitlements/counts/subscription state and applies this policy.
 */

export type CommercialWriteOperation =
  | "child_create"
  | "child_restore"
  | "child_republish"
  | "child_edit"
  | "addon_checkout"
  | "publish_increase";

export type CommercialWriteDecision =
  | { allowed: true; limit: number; activeCount: number; graceActive: boolean }
  | {
      allowed: false;
      code:
        | "capacity_reached"
        | "grace_blocks_new_capacity"
        | "subscription_suspended"
        | "subscription_canceled"
        | "parent_not_found"
        | "parent_not_owned"
        | "parent_wrong_role"
        | "guard_unavailable"
        // Package C Build 4 (C7, Gate 2) — server-verified childListingId linkage failures.
        // A caller-supplied child id is never trusted: it must resolve to a real row, owned by
        // the same owner, whose own parent-linkage column equals the parent being written to.
        | "child_not_found"
        | "child_not_owned"
        | "child_wrong_parent";
      message: string;
      messageEs: string;
      limit?: number;
      activeCount?: number;
    };

export function decideCommercialWrite(input: {
  operation: CommercialWriteOperation;
  capacityDelta: number;
  activeCount: number;
  limit: number;
  subscriptionStatus: "none" | "pending" | "active" | "grace" | "suspended" | "canceled";
}): CommercialWriteDecision {
  const increasesCapacity = input.capacityDelta > 0;

  if (!increasesCapacity) {
    // Ordinary edits to existing paid inventory stay allowed through grace (locked rule).
    if (input.subscriptionStatus === "suspended") {
      // Content-preserving edits remain allowed even suspended; visibility is already off.
      return { allowed: true, limit: input.limit, activeCount: input.activeCount, graceActive: false };
    }
    return {
      allowed: true,
      limit: input.limit,
      activeCount: input.activeCount,
      graceActive: input.subscriptionStatus === "grace",
    };
  }

  if (input.subscriptionStatus === "grace") {
    return {
      allowed: false,
      code: "grace_blocks_new_capacity",
      message: "A payment issue is pending on this subscription. New inventory, restores, and upgrades are paused until payment is resolved (7-day grace policy). Existing listings remain active and editable.",
      messageEs: "Hay un problema de pago pendiente en esta suscripción. Nuevo inventario, restauraciones y mejoras están pausados hasta resolver el pago (política de gracia de 7 días). Tus anuncios existentes siguen activos y editables.",
      limit: input.limit,
      activeCount: input.activeCount,
    };
  }
  if (input.subscriptionStatus === "suspended") {
    return {
      allowed: false,
      code: "subscription_suspended",
      message: "This subscription is suspended for nonpayment. Resolve payment to restore access. Your content is preserved.",
      messageEs: "Esta suscripción está suspendida por falta de pago. Resuelve el pago para restaurar el acceso. Tu contenido está preservado.",
      limit: input.limit,
      activeCount: input.activeCount,
    };
  }
  if (input.subscriptionStatus === "canceled") {
    return {
      allowed: false,
      code: "subscription_canceled",
      message: "This subscription is canceled. A new subscription is required to add inventory.",
      messageEs: "Esta suscripción está cancelada. Se requiere una nueva suscripción para agregar inventario.",
      limit: input.limit,
      activeCount: input.activeCount,
    };
  }

  // Purchasing an add-on ADDS capacity — it is state-gated (grace/suspension/cancel above)
  // but never blocked by the current count (a full dealer is exactly who needs the boost).
  if (input.operation === "addon_checkout") {
    return { allowed: true, limit: input.limit, activeCount: input.activeCount, graceActive: false };
  }

  if (input.activeCount + input.capacityDelta > input.limit) {
    return {
      allowed: false,
      code: "capacity_reached",
      message: `Active inventory limit reached (${input.activeCount}/${input.limit}). Add capacity with the inventory add-on or deactivate an existing listing first.`,
      messageEs: `Límite de inventario activo alcanzado (${input.activeCount}/${input.limit}). Agrega capacidad con el paquete de inventario o desactiva un anuncio existente primero.`,
      limit: input.limit,
      activeCount: input.activeCount,
    };
  }

  return { allowed: true, limit: input.limit, activeCount: input.activeCount, graceActive: false };
}
