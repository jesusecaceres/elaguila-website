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
import { getCurrentAdminAccessContext, requirePaymentTrackerAccess } from "@/app/admin/_lib/adminAccessControl";
import { RewardsWorkspaceClient } from "./RewardsWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function RewardsWorkspacePage() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) redirect("/admin/login");
  const ctx = await getCurrentAdminAccessContext();
  // Reuses the payment-tracker READ gate: anyone who may see payments may see credit balances.
  // Every WRITE is separately gated inside the API by requireRevenueProtectedWriteAccess().
  requirePaymentTrackerAccess(ctx);

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
