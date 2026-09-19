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

export async function startDashboardResumePayment(input: {
  lane: DashboardPendingPaymentLane;
  listingId: string;
  leonixAdId?: string | null;
  lang: "es" | "en";
}): Promise<DashboardResumePaymentResult> {
  const checkout = await startRevenueCategoryCheckout(buildDashboardResumePaymentPayload(input));
  if (!checkout.ok) return { ok: false, userMessage: checkout.userMessage };
  redirectToRevenueCategoryCheckout(checkout.checkoutUrl);
  return { ok: true };
}
