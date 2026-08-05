/**
 * Package C Build 1 (C2+C3, Gate 14) — shared commercial-state badge resolver (pure,
 * client-safe). Maps subscription/payment truth to independent, truthful display labels.
 * Never conflates account plan, listing plan, payment, entitlement, placement, verification,
 * or grant source — each surface renders exactly the states below, nothing inferred.
 */

export type CommercialStateBadgeInput = {
  subscriptionStatus?: string | null; // pending|active|grace|suspended|canceled
  cancelAtPeriodEnd?: boolean | null;
  graceEndsAt?: string | null;
  suspensionReason?: string | null; // payment_failure|chargeback|admin
  recoveredAt?: string | null;
  paymentStatus?: string | null; // pending|paid|refunded|disputed|canceled|...
  manualState?: string | null; // pending_verification|cleared|rejected|reversed
  grantSource?: string | null; // stripe_webhook|admin_manual|print_included|comp|partner|manual_cleared_payment
};

export type CommercialStateBadge = {
  key:
    | "active"
    | "payment_issue"
    | "grace"
    | "suspended_nonpayment"
    | "disputed"
    | "cancels_at_period_end"
    | "canceled"
    | "refunded"
    | "payment_recovered"
    | "manual_cleared_payment"
    | "manual_pending_verification"
    | "included_with_print";
  labelEs: string;
  labelEn: string;
  /** Display date (grace end) when relevant. */
  date?: string | null;
};

function formatBadgeDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

export function resolveCommercialStateBadges(input: CommercialStateBadgeInput): CommercialStateBadge[] {
  const badges: CommercialStateBadge[] = [];
  const sub = String(input.subscriptionStatus ?? "").trim().toLowerCase();

  if (sub === "grace") {
    const date = formatBadgeDate(input.graceEndsAt);
    badges.push({
      key: "grace",
      labelEs: date ? `Problema de pago — gracia hasta ${date}` : "Problema de pago — período de gracia",
      labelEn: date ? `Payment issue — grace until ${date}` : "Payment issue — grace period",
      date,
    });
  } else if (sub === "suspended") {
    if (String(input.suspensionReason ?? "") === "chargeback") {
      badges.push({ key: "disputed", labelEs: "Pago en disputa — visibilidad pausada", labelEn: "Payment disputed — visibility paused" });
    } else {
      badges.push({ key: "suspended_nonpayment", labelEs: "Suspendido por falta de pago — contenido preservado", labelEn: "Suspended for nonpayment — content preserved" });
    }
  } else if (sub === "canceled") {
    badges.push({ key: "canceled", labelEs: "Suscripción cancelada", labelEn: "Subscription cancelled" });
  } else if (sub === "active") {
    if (input.cancelAtPeriodEnd) {
      badges.push({ key: "cancels_at_period_end", labelEs: "Se cancela al final del período pagado", labelEn: "Cancels at period end" });
    } else {
      badges.push({ key: "active", labelEs: "Suscripción activa", labelEn: "Subscription active" });
    }
    if (input.recoveredAt) {
      badges.push({ key: "payment_recovered", labelEs: "Pago recuperado", labelEn: "Payment recovered" });
    }
  }

  const pay = String(input.paymentStatus ?? "").trim().toLowerCase();
  if (pay === "refunded") badges.push({ key: "refunded", labelEs: "Reembolsado", labelEn: "Refunded" });
  if (pay === "disputed" && sub !== "suspended") {
    badges.push({ key: "disputed", labelEs: "Pago en disputa", labelEn: "Payment disputed" });
  }

  const manual = String(input.manualState ?? "").trim().toLowerCase();
  if (manual === "cleared") badges.push({ key: "manual_cleared_payment", labelEs: "Pago manual verificado", labelEn: "Manual payment cleared" });
  if (manual === "pending_verification") {
    badges.push({ key: "manual_pending_verification", labelEs: "Pago manual en verificación", labelEn: "Manual payment pending verification" });
  }

  if (String(input.grantSource ?? "") === "print_included") {
    badges.push({ key: "included_with_print", labelEs: "Incluido con paquete impreso", labelEn: "Included with print package" });
  }

  return badges;
}
