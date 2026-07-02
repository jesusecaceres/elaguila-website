/**
 * Revenue OS public display helpers (pure + safe labels).
 * Gate STRIPE-REVENUE-OS-ADMIN-USER-REVENUE-PROOF-01
 */

import { getRevenuePackageDefinition } from "./revenuePricingMatrix";
import { formatMoneyCents } from "./packagePricingRules";
import { isPaymentCleared, normalizePaymentStatus } from "./paymentTracking";

export type RevenuePaymentDisplayState =
  | "confirmed"
  | "processing"
  | "canceled"
  | "expired"
  | "missing";

export type RevenueEntitlementDisplayState = "active" | "pending" | "expired" | "missing";

export function normalizeRevenuePaymentDisplayState(
  paymentStatus: string | null | undefined,
): RevenuePaymentDisplayState {
  const s = normalizePaymentStatus(paymentStatus);
  if (isPaymentCleared(s)) return "confirmed";
  if (s === "pending" || s === "unpaid" || s === "requires_action") return "processing";
  if (s === "canceled") return "canceled";
  if (s === "failed" || s === "refunded" || s === "disputed") return "expired";
  return "missing";
}

export function formatRevenueAmount(input: {
  amountCents?: number | null;
  billingMode?: string | null;
  currency?: string | null;
  lang?: "en" | "es";
}): string | null {
  const cents = input.amountCents;
  if (cents == null || !Number.isFinite(cents) || cents <= 0) return null;
  const base = formatMoneyCents(cents);
  if (input.billingMode === "monthly_subscription") {
    return input.lang === "es" ? `${base}/mes` : `${base}/mo`;
  }
  return base;
}

export function formatRevenueDate(iso: string | null | undefined, lang: "en" | "es"): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  return d.toLocaleDateString(lang === "es" ? "es-US" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function resolveRevenuePackageLabel(
  packageKey: string | null | undefined,
  lang: "en" | "es",
): string {
  const key = String(packageKey ?? "").trim().toLowerCase();
  const def = getRevenuePackageDefinition(key);
  if (def?.label) return def.label;
  if (!key) return lang === "es" ? "Paquete" : "Package";
  return key.replace(/_/g, " ");
}

export function resolveRevenueCategoryLabel(category: string | null | undefined, lang: "en" | "es"): string {
  const c = String(category ?? "").trim().toLowerCase();
  const map: Record<string, { en: string; es: string }> = {
    rentas: { en: "Rentas", es: "Rentas" },
    empleos: { en: "Empleos", es: "Empleos" },
    autos: { en: "Autos", es: "Autos" },
    "bienes-raices": { en: "Bienes Raíces", es: "Bienes Raíces" },
    restaurantes: { en: "Restaurantes", es: "Restaurantes" },
    servicios: { en: "Servicios", es: "Servicios" },
    viajes: { en: "Viajes", es: "Viajes" },
    clases: { en: "Clases", es: "Clases" },
    comunidad: { en: "Comunidad", es: "Comunidad" },
  };
  return map[c]?.[lang] ?? c.replace(/-/g, " ");
}

/** Listing/ad plan badge — never account plan. */
export function revenueAdPlanBadgeLabel(input: {
  category?: string | null;
  packageKey?: string | null;
  billingMode?: string | null;
  customerType?: string | null;
  lang: "en" | "es";
  activeUntil?: string | null;
}): string | null {
  const key = String(input.packageKey ?? "").trim().toLowerCase();
  if (!key) return null;

  const def = getRevenuePackageDefinition(key);
  const lang = input.lang;

  let planLabel: string | null = null;
  if (key.includes("job_post") || key === "empleos_job_post_paid") {
    planLabel = lang === "es" ? "Empleo pagado" : "Paid job";
  } else if (key.includes("restaurantes")) {
    planLabel = lang === "es" ? "Restaurante pagado" : "Paid restaurant";
  } else if (def?.customerType?.includes("business") || def?.billingMode === "monthly_subscription") {
    planLabel = lang === "es" ? "Negocio pagado" : "Paid business";
  } else if (def?.billingMode === "one_time") {
    planLabel = lang === "es" ? "Privado pagado" : "Paid private";
  }

  if (!planLabel) {
    planLabel = lang === "es" ? "Plan del anuncio" : "Ad plan";
  }

  const until = formatRevenueDate(input.activeUntil, lang);
  if (until) {
    return lang === "es" ? `${planLabel} · Activo hasta ${until}` : `${planLabel} · Active until ${until}`;
  }
  return planLabel;
}

export function maskStripeReference(value: string | null | undefined): string {
  const v = String(value ?? "").trim();
  if (!v) return "—";
  if (v.length <= 12) return v;
  return `${v.slice(0, 10)}…`;
}
