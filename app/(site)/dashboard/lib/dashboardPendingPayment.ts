/**
 * CLOSEOUT 2 (2026-09, golden-survivor port) — owner-dashboard "awaiting payment" truth for Restaurantes.
 *
 * Pure, zero-I/O. SLIM port of `integration/category-circuit-closeout-2026-09`'s dashboardPendingPayment.ts:
 * only the copy + Restaurantes resume routing the Restaurantes dashboard needs. The one-time-lane Revenue OS
 * payload builders of the source file were NOT ported (no caller on this branch).
 *
 * Restaurantes base plans (Quick $249 / Full $399) are monthly SUBSCRIPTIONS that hard-require the
 * recurring-billing consent captured by the shared checkout checkpoint, so the dashboard never starts their
 * checkout directly: it resumes into the category's own draft preview (checkpoint) — carrying the plan the
 * row's unresolved checkout was started for — or, when that plan cannot be proven, into the Restaurantes
 * Quick/Full checkpoint selector so the owner re-confirms it. Nothing here is price or entitlement authority:
 * the preview re-derives the package key and Revenue OS re-prices server-side.
 */
import {
  RESTAURANTES_BASE_CHECKOUT,
  RESTAURANTES_QUICK_CHECKOUT,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { carryBusinessPlanParam, type BusinessPlanChoice } from "@/app/lib/listingPlans/businessQuickPlanSignal";

type Lang = "es" | "en";

// ── copy ────────────────────────────────────────────────────────────────────────────────────────

export function dashboardAwaitingPaymentLabel(lang: Lang): string {
  return lang === "es" ? "Pago pendiente" : "Payment pending";
}

export function dashboardCompletePaymentLabel(lang: Lang): string {
  return lang === "es" ? "Completar pago" : "Complete payment";
}

export function dashboardStartingPaymentLabel(lang: Lang): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

export function dashboardNotLiveNote(lang: Lang): string {
  return lang === "es"
    ? "Aún no está publicado: se publica cuando se confirma el pago. Puedes editarlo o completar el pago."
    : "Not published yet: it goes live once payment is confirmed. You can edit it or complete payment.";
}

// ── Restaurantes ─────────────────────────────────────────────────────────────────────────────────

/** Restaurantes: hidden pre-checkout save (`restaurantes_public_listings.status = 'pending_payment'`). */
export function isRestauranteAwaitingPayment(status: string | null | undefined): boolean {
  return String(status ?? "").trim().toLowerCase() === "pending_payment";
}

/**
 * The plan a pending Restaurantes row was being bought on, from the server's base-plan offer
 * (`/api/revenue-os/business-base-plan`, ledger truth: the most recent UNRESOLVED base checkout).
 * Only a `resume` answer naming one of the two Restaurantes base keys proves the plan; anything else
 * (no checkout ever started, expired session, unreadable ledger) is `null` = "unknown, ask again".
 */
export function restauranteResumePlanFromOffer(
  offer: { mode?: string | null; sellPackageKey?: string | null } | null | undefined,
): BusinessPlanChoice | null {
  if (!offer || String(offer.mode ?? "") !== "resume") return null;
  const key = String(offer.sellPackageKey ?? "").trim().toLowerCase();
  if (key === RESTAURANTES_QUICK_CHECKOUT.packageKey) return "quick";
  if (key === RESTAURANTES_BASE_CHECKOUT.packageKey) return "full";
  return null;
}

/** Category draft-preview page that hosts the shared checkout checkpoint (recurring consent + Pay). */
export function restauranteResumePaymentPreviewHref(
  lang: Lang,
  anchor: "preview" | "checkout",
  plan: BusinessPlanChoice = "full",
): string {
  // Quick is carried as `plan=quick` (the only marker the preview reads for a not-listing-bound session);
  // Full is never written into a link — absent means Full.
  const base = carryBusinessPlanParam(`/clasificados/restaurantes/preview?lang=${lang}`, plan);
  return anchor === "checkout" ? `${base}#publish-checkout-checkpoint` : base;
}

/** Golden's Restaurantes Quick ($249) / Full ($399) checkpoint selector — used when the plan is unknown. */
export function restauranteResumePlanCheckpointHref(lang: Lang): string {
  return `/clasificados/publicar/restaurantes?lang=${lang}`;
}

/** One routing answer for a dashboard "Completar pago" on a pending Restaurantes row. */
export function restauranteResumePaymentHref(
  lang: Lang,
  target: "preview" | "checkout",
  plan: BusinessPlanChoice | null,
): string {
  return plan ? restauranteResumePaymentPreviewHref(lang, target, plan) : restauranteResumePlanCheckpointHref(lang);
}
