/**
 * LEONIX IX REWARDS — unresolved refund queue.
 *
 * A `charge.refunded` payload that carries no refund objects cannot be attributed to a canonical
 * refund id. Reversing it under a charge-derived key was the defect that once double-counted the
 * same refunded dollars and over-charged a customer, so the webhook refuses — correctly.
 *
 * Refusing SILENTLY would be its own defect: money went back to the customer and the credits that
 * payment earned are still spendable. This page is where that backlog lives, so it is worked by a
 * person instead of decaying in an audit log.
 *
 * Same authorization shape as the rewards workspace: the READ gate here, the WRITE gate inside
 * `/api/admin/rewards` behind `requireRevenueProtectedWriteAccess()`.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import {
  getCurrentAdminAccessContext,
  requirePaymentTrackerAccess,
  requireRevenueProtectedWriteAccess,
} from "@/app/admin/_lib/adminAccessControl";
import { RewardsRefundQueueClient } from "./RewardsRefundQueueClient";

export const dynamic = "force-dynamic";

export default async function RewardsRefundQueuePage() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) redirect("/admin/login");
  const ctx = await getCurrentAdminAccessContext();
  requirePaymentTrackerAccess(ctx);
  // THE PAGE GATE MUST MATCH THE API GATE, or the screen is a dead end.
  //
  // Every action on this screen goes through `POST /api/admin/rewards`, which requires a roster
  // `super_admin`. The page required only `hasPaymentTrackerAccess` — owner_admin OR any roster
  // member with `can_view_payments` — so a billing-support member could open it and get "forbidden"
  // on everything, including the read. That mismatch was invisible while the screen was reachable
  // only by typing its URL; adding it to the workspace navigation made it a visible dead end.
  const write = await requireRevenueProtectedWriteAccess();
  if (!write.ok) redirect("/admin/team?access_denied=1");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-[#2F2A1F]">Reembolsos sin resolver / Unresolved refunds</h1>
        <p className="mt-1 text-sm text-[#5D4A25]">
          Stripe devolvió dinero al cliente, pero el evento no identificó el reembolso, así que los
          créditos de esa compra siguen disponibles. Resuelve cada fila con el ID del reembolso.
          {" "}
          Stripe returned money to the customer, but the event did not identify which refund it was,
          so the credits that purchase earned are still spendable. Resolve each row with the refund ID.
        </p>
      </header>
      <RewardsRefundQueueClient />
    </main>
  );
}
