/**
 * CLOSEOUT 2 (2026-09) — browser action behind every dashboard "Completar pago / Complete payment" button
 * for the ONE-TIME paid lanes (Empleos quick/premium, Rentas, Bienes Raíces FSBO, Clases paid, Autos Privado).
 *
 * REVENUE OS ONLY: this builds the payload from the existing constants (`dashboardPendingPayment.ts`) and
 * calls `startRevenueCategoryCheckout` -> `redirectToRevenueCategoryCheckout`. It creates no other payment
 * path. The server (`/api/revenue-os/checkout`) re-validates ownership + pre-payment state and answers
 * 404/403/409 with codes; the checkout client already turns the no-recharge codes into an owner-safe message,
 * which is returned here untouched.
 */
import {
  redirectToRevenueCategoryCheckout,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { buildDashboardResumePaymentPayload, type DashboardPendingPaymentLane } from "./dashboardPendingPayment";

export type DashboardResumePaymentResult = { ok: true } | { ok: false; userMessage: string };

/** Owner-safe copy when a resume-payment is attempted without the listing's own id (never starts a listing-less checkout). */
export function dashboardResumePaymentMissingListingMessage(lang: "es" | "en"): string {
  return lang === "es"
    ? "No pudimos identificar este anuncio para completar el pago. Actualiza la p\u00e1gina e int\u00e9ntalo de nuevo."
    : "We could not identify this listing to complete payment. Refresh the page and try again.";
}

export async function startDashboardResumePayment(input: {
  lane: DashboardPendingPaymentLane;
  listingId: string;
  leonixAdId?: string | null;
  lang: "es" | "en";
}): Promise<DashboardResumePaymentResult> {
  // Gate 2 (item 12): a resume-payment ALWAYS carries the listing row's own id. A blank id would post a checkout with
  // no `listingId`, which the server treats as a fresh base purchase - never a resume - so it is refused here.
  if (!String(input.listingId ?? "").trim()) {
    return { ok: false, userMessage: dashboardResumePaymentMissingListingMessage(input.lang) };
  }
  const checkout = await startRevenueCategoryCheckout(buildDashboardResumePaymentPayload(input));
  if (!checkout.ok) return { ok: false, userMessage: checkout.userMessage };
  redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
  return { ok: true };
}
