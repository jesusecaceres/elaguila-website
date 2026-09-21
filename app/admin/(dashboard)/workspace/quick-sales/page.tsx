/**
 * LEONIX QUICK — staff sales workspace.
 *
 * ONE screen for the whole sales motion, and deliberately the SMALLEST one that can carry it:
 * pick a category, name the customer's business, establish server-issued assisted custody, jump to
 * the category's EXISTING intake, come back, issue a prospect preview link, and publish only once
 * the server says the money is in.
 *
 * WHAT THIS SCREEN IS NOT: a fifth Quick intake. The four category intakes are not duplicated,
 * wrapped, or re-implemented here — this screen hands the staff member to them and holds the
 * custody that makes their "save for client" write the same canonical row every time.
 *
 * The page gate matches the API gate exactly (`assisted_category_publishing`), so a staff member
 * who can open this screen can actually use it; a mismatch there is how a workspace becomes a
 * visible dead end.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { QuickSalesWorkspaceClient } from "./QuickSalesWorkspaceClient";

export const dynamic = "force-dynamic";

export default async function QuickSalesWorkspacePage() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) redirect("/admin/login");
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) redirect("/admin/team?access_denied=1");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-[#2F2A1F]">Quick — Venta asistida / Assisted sale</h1>
        <p className="mt-1 text-sm text-[#5D4A25]">
          Elige la categoría y el negocio del cliente, arma el anuncio en la herramienta de esa
          categoría, y comparte una vista previa privada antes de cobrar.
          {" "}
          Pick the category and the customer&apos;s business, build the ad in that category&apos;s own tool,
          and share a private preview before taking payment.
        </p>
        <p className="mt-2 rounded-lg bg-[#FFF6E7] p-3 text-xs text-[#5D4A25]">
          Guardar para el cliente nunca publica. Publicar requiere un pago confirmado por el
          servidor. · Saving for a client never publishes. Publishing requires a payment the server
          itself has confirmed.
        </p>
      </header>
      <QuickSalesWorkspaceClient actorEmail={access.actor.email} />
    </main>
  );
}
