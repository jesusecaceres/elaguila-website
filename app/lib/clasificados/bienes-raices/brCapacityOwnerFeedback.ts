/**
 * Gate BIENES-NEGOCIO-1 — owner-safe language for a Bienes Raíces Negocio capacity outcome.
 *
 * Gate Zero found that a capacity rejection reached the owner as a generic unexplained failure —
 * exactly the "owner discovers an infrastructure problem through a raw error" case the Owner
 * Command Center Bible §37 and the Admin OS Book §7 both forbid. This module maps the REAL
 * `br_negocio_activate_listing` blocked reasons (and the RPC's own unavailability) into: what
 * happened, why, and the legitimate next action.
 *
 * It is NOT a capacity authority and must never become one:
 *  - it never counts rows, never derives a limit, never decides whether activation is allowed;
 *  - it only renders numbers the SERVER already returned (`activeCount` / `effectiveLimit`), and
 *    omits them entirely when the server did not send them;
 *  - it never infers or fabricates entitlement. The inventory-boost next step is offered ONLY when
 *    the caller passes `boostAvailable: true`, which callers must source from real entitlement
 *    truth (`fetchBienesInventoryPackEntitlementActive` / the dashboard entitlement badge), never
 *    from a guess.
 *
 * Pure: no I/O, no framework imports.
 */

/** The blocked reasons `br_negocio_activate_listing` can return (see the authored RPC migration). */
export type BrCapacityBlockedReason =
  | "not_found_or_owner_mismatch"
  | "status_mismatch"
  | "no_parent_link"
  | "parent_not_found_or_owner_mismatch"
  | "grace_blocks_new_capacity"
  | "subscription_suspended"
  | "subscription_canceled"
  | "capacity_reached";

/** The route-level code emitted when the RPC itself could not be reached. */
export const BR_CAPACITY_RPC_UNAVAILABLE = "capacity_rpc_unavailable" as const;

export type BrCapacityOwnerFeedback = {
  /** What happened, in the owner's language. */
  title: string;
  /** Why it happened, from server truth only. */
  detail: string;
  /** The legitimate next action. */
  nextAction: string;
  /** True only when the caller proved a boost is purchasable — never inferred here. */
  offerInventoryBoost: boolean;
};

export type BrCapacityOwnerFeedbackInput = {
  reason: BrCapacityBlockedReason | typeof BR_CAPACITY_RPC_UNAVAILABLE | string | null | undefined;
  lang: "es" | "en";
  /** Server-returned. Omitted from the copy when absent — never defaulted to a number. */
  activeCount?: number | null;
  effectiveLimit?: number | null;
  /**
   * Whether an inventory boost is genuinely purchasable for this parent, proven from entitlement
   * truth by the caller. Undefined/false means the upsell is NOT shown.
   */
  boostAvailable?: boolean;
};

function limitSentence(input: BrCapacityOwnerFeedbackInput): string {
  const es = input.lang !== "en";
  const used = typeof input.activeCount === "number" ? input.activeCount : null;
  const limit = typeof input.effectiveLimit === "number" ? input.effectiveLimit : null;
  if (used == null || limit == null) {
    // The server did not tell us the numbers — say so rather than inventing a limit.
    return es
      ? "Tu plan ya está usando todas las propiedades activas que incluye."
      : "Your plan is already using all of the active properties it includes.";
  }
  return es
    ? `Tu plan incluye ${limit} ${limit === 1 ? "propiedad activa" : "propiedades activas"} y ya tienes ${used}.`
    : `Your plan includes ${limit} active ${limit === 1 ? "property" : "properties"} and you already have ${used}.`;
}

export function brCapacityOwnerFeedback(input: BrCapacityOwnerFeedbackInput): BrCapacityOwnerFeedback {
  const es = input.lang !== "en";
  const reason = String(input.reason ?? "").trim();

  if (reason === "capacity_reached") {
    const boost = input.boostAvailable === true;
    return {
      title: es ? "Alcanzaste el límite de propiedades activas" : "You've reached your active-property limit",
      detail: limitSentence(input),
      nextAction: boost
        ? es
          ? "Pausa o archiva una propiedad activa para liberar espacio, o agrega el paquete de inventario (+3 propiedades) desde tu panel."
          : "Pause or archive an active property to free a slot, or add the inventory pack (+3 properties) from your dashboard."
        : es
          ? "Pausa o archiva una propiedad activa para liberar espacio. Tus propiedades pausadas se conservan completas."
          : "Pause or archive an active property to free a slot. Your paused properties are kept intact.",
      offerInventoryBoost: boost,
    };
  }

  if (reason === "grace_blocks_new_capacity") {
    return {
      title: es ? "Hay un pago pendiente en tu cuenta" : "There's a pending payment on your account",
      detail: es
        ? "Mientras un pago está en periodo de gracia no podemos activar propiedades adicionales. Tus anuncios actuales no se eliminan."
        : "While a payment is in its grace period we can't activate additional properties. Your existing listings are not removed.",
      nextAction: es
        ? "Actualiza tu método de pago y vuelve a intentarlo."
        : "Update your payment method and try again.",
      offerInventoryBoost: false,
    };
  }

  if (reason === "subscription_suspended" || reason === "subscription_canceled") {
    const canceled = reason === "subscription_canceled";
    return {
      title: es ? "Tu suscripción no está activa" : "Your subscription isn't active",
      detail: canceled
        ? es
          ? "Tu suscripción de Bienes Raíces Negocio está cancelada, así que no se pueden activar propiedades. Tu contenido, fotos e historial se conservan."
          : "Your Bienes Raíces Negocio subscription is canceled, so properties can't be activated. Your content, photos and history are preserved."
        : es
          ? "Tu suscripción de Bienes Raíces Negocio está suspendida, así que no se pueden activar propiedades. Tu contenido, fotos e historial se conservan."
          : "Your Bienes Raíces Negocio subscription is suspended, so properties can't be activated. Your content, photos and history are preserved.",
      nextAction: es ? "Reactiva tu plan desde tu panel." : "Reactivate your plan from your dashboard.",
      offerInventoryBoost: false,
    };
  }

  if (reason === "no_parent_link" || reason === "parent_not_found_or_owner_mismatch") {
    return {
      title: es ? "No pudimos conectar esta propiedad con tu negocio" : "We couldn't link this property to your business",
      detail: es
        ? "Esta propiedad no está asociada a un anuncio de negocio activo tuyo, así que no se publicó."
        : "This property isn't linked to an active business listing of yours, so it wasn't published.",
      nextAction: es
        ? "Abre tu inventario desde el panel y usa «Agregar propiedad» desde el negocio correcto."
        : "Open your inventory from the dashboard and use “Add property” from the correct business.",
      offerInventoryBoost: false,
    };
  }

  if (reason === "not_found_or_owner_mismatch" || reason === "status_mismatch") {
    return {
      title: es ? "No pudimos activar esta propiedad" : "We couldn't activate this property",
      detail: es
        ? "El estado de esta propiedad cambió mientras trabajabas en ella, así que no aplicamos el cambio."
        : "This property's state changed while you were working on it, so we didn't apply the change.",
      nextAction: es
        ? "Vuelve a abrirla desde tu panel para ver su estado actual."
        : "Reopen it from your dashboard to see its current state.",
      offerInventoryBoost: false,
    };
  }

  if (reason === BR_CAPACITY_RPC_UNAVAILABLE) {
    // Honest operator-facing state: the capacity authority is not reachable. We deliberately do
    // NOT fall back to any other capacity decision — see `capacityActivationRpc.ts`.
    return {
      title: es ? "No pudimos verificar tu inventario ahora mismo" : "We couldn't verify your inventory right now",
      detail: es
        ? "El servicio que confirma cuántas propiedades puedes tener activas no está disponible, así que no activamos nada. No se te cobró y no se perdió información."
        : "The service that confirms how many properties you can keep active is unavailable, so nothing was activated. You weren't charged and nothing was lost.",
      nextAction: es
        ? "Intenta de nuevo en unos minutos. Si continúa, contacta a Leonix."
        : "Try again in a few minutes. If it continues, contact Leonix.",
      offerInventoryBoost: false,
    };
  }

  return {
    title: es ? "No pudimos activar esta propiedad" : "We couldn't activate this property",
    detail: es
      ? "No recibimos una razón específica del servidor, así que no aplicamos ningún cambio."
      : "We didn't receive a specific reason from the server, so no change was applied.",
    nextAction: es
      ? "Vuelve a intentarlo desde tu panel. Si continúa, contacta a Leonix."
      : "Try again from your dashboard. If it continues, contact Leonix.",
    offerInventoryBoost: false,
  };
}

/** Single-paragraph form for surfaces with one message slot. */
export function brCapacityOwnerFeedbackText(input: BrCapacityOwnerFeedbackInput): string {
  const f = brCapacityOwnerFeedback(input);
  return [f.title, f.detail, f.nextAction].filter(Boolean).join(" ");
}
