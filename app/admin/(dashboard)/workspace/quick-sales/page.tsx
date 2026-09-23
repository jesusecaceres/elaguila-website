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
 * QUICK SALES ENTRY CONSOLIDATION — this is now the SOLE staff entry for creating a Leonix-managed
 * client ad in the four paid categories. Every other admin launcher (Create for Client, the Quick
 * launchpad, the Managed inventory, the category queues) deep-links HERE with `?category=`,
 * `?businessId=` and optionally `?listingId=` (reopen the same row), and never opens a category's
 * public application on the staff member's own browser again. Preselection is a convenience for
 * the operator; custody is still established only by the server route below.
 *
 * The page gate matches the API gate exactly (`assisted_category_publishing`), so a staff member
 * who can open this screen can actually use it; a mismatch there is how a workspace becomes a
 * visible dead end.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSupabase, requireAdminCookie } from "@/app/lib/supabase/server";
import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { isQuickSalesCategory, type QuickSalesCategory } from "@/app/lib/sales/quickSalesCategories";
import { QuickSalesWorkspaceClient } from "./QuickSalesWorkspaceClient";

export const dynamic = "force-dynamic";

type SearchParams = { category?: string; businessId?: string; listingId?: string; lang?: string };

export default async function QuickSalesWorkspacePage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) redirect("/admin/login");
  const access = await requireStaffWorkspaceWriteAccess("assisted_category_publishing");
  if (!access.ok) redirect("/admin/team?access_denied=1");

  const sp = (await searchParams) ?? {};
  const initialCategory: QuickSalesCategory | null = isQuickSalesCategory(sp.category) ? sp.category : null;
  const requestedBusinessId = (sp.businessId ?? "").trim();
  // Resolved server-side with the admin client — the same lookup Create for Client uses — so the
  // cockpit opens with the business NAMED, not just an id the operator has to trust.
  const business = requestedBusinessId ? await getBusinessByIdForCurrentUser(getAdminSupabase(), requestedBusinessId) : null;
  // A supplied but unknown id must never silently fall through to "no business selected".
  const missingBusiness = Boolean(requestedBusinessId && !business);
  const initialListingId = (sp.listingId ?? "").trim() || null;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6">
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold text-[#2F2A1F]">Crear anuncio / Create an ad</h1>
        <p className="mt-1 text-sm text-[#5D4A25]">
          Elige la categoría, elige el producto, y abre la aplicación. El cliente nuevo no necesita
          un perfil primero. · Choose the category, choose the product, and open the application. A
          new client does not need a profile first.
        </p>
        <p className="mt-2 rounded-lg bg-[#FFF6E7] p-3 text-xs text-[#5D4A25]">
          Guardar para el cliente nunca publica. Publicar requiere un pago confirmado por el
          servidor. · Saving for a client never publishes. Publishing requires a payment the server
          itself has confirmed.
        </p>
        {missingBusiness ? (
          <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            Negocio no encontrado — búscalo abajo. / Business not found — search for it below.
          </p>
        ) : null}
      </header>
      <QuickSalesWorkspaceClient
        actorEmail={access.actor.email}
        initialCategory={initialCategory}
        initialBusiness={business ? { id: business.id, name: business.publicName || business.displayName } : null}
        initialListingId={initialListingId}
      />
    </main>
  );
}
