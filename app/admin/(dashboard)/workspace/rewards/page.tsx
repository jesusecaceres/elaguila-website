/**
 * LEONIX IX REWARDS — staff workspace.
 *
 * Server component following the same shape as the existing payment-tracker workspace: the page
 * itself authorizes and renders, and every mutation goes through the authenticated
 * `/api/admin/rewards` route behind `requireRevenueProtectedWriteAccess()`.
 *
 * There are no decorative controls here: search, redeem, adjust and release each call a real
 * server action that moves real ledger value, and every one of them is audited.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import {
  getCurrentAdminAccessContext,
  requirePaymentTrackerAccess,
  requireRevenueProtectedWriteAccess,
} from "@/app/admin/_lib/adminAccessControl";
import { RewardsWorkspaceClient } from "./RewardsWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function RewardsWorkspacePage() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) redirect("/admin/login");
  const ctx = await getCurrentAdminAccessContext();
  requirePaymentTrackerAccess(ctx);
  // THE PAGE GATE MUST MATCH THE API GATE, or the screen is a dead end.
  //
  // Every action on this screen — including the customer SEARCH and the balance read — goes through
  // `POST /api/admin/rewards`, which requires a roster `super_admin`. The page required only
  // `hasPaymentTrackerAccess`: owner_admin OR any roster member with `can_view_payments`. A
  // billing-support member could therefore open it and get "forbidden" on everything. That
  // mismatch was invisible while the screen was reachable only by typing its URL; putting it in
  // the workspace navigation made it a visible dead end.
  const write = await requireRevenueProtectedWriteAccess();
  if (!write.ok) redirect("/admin/team?access_denied=1");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-[#2F2A1F]">Leonix IX Rewards</h1>
        <p className="mt-1 text-sm text-[#5D4A25]">
          Busca al cliente, revisa su saldo y aplica créditos a un pago en oficina.
          {" "}
          Search a customer, review their balance, and apply credits to an in-office payment.
        </p>
        <p className="mt-2 rounded-lg bg-[#FFF6E7] p-3 text-xs text-[#5D4A25]">
          El historial nunca se edita ni se borra. Una corrección se registra como un asiento nuevo,
          firmado y con motivo. · History is never edited or deleted. A correction is posted as a new,
          signed, reasoned entry.
        </p>
      </header>
      <RewardsWorkspaceClient />
    </main>
  );
}
