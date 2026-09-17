import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../../../_components/AdminPageHeader";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../../_lib/businessWorkspaceAccess";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getBusinessByIdForCurrentUser } from "@/app/lib/business/repositories/businessesRepo";
import { BusinessInformationEditorClient } from "./BusinessInformationEditorClient";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

/**
 * LEONIX BUSINESS INFORMATION EDITOR (Gate 1) — the ONE staff-facing canonical identity editor.
 * The owner should never have to wonder where to fix a business's phone/website/social/address:
 * this is that place. Reachable from a top-priority hero action on the business detail page.
 */
export default async function BusinessInformationPage({ params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    redirect("/admin/team?access_denied=1");
  }

  const { businessId } = await params;
  const admin = getAdminSupabase();
  const business = await getBusinessByIdForCurrentUser(admin, businessId);
  if (!business) {
    return (
      <div className="max-w-3xl">
        <AdminPageHeader title="Business not found" eyebrow="Business Concierge" />
        <Link href="/admin/businesses" className="text-sm font-semibold text-[#7A1E2C] underline">
          ← Back to businesses
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-16">
      <AdminPageHeader
        title={`Información del negocio / Business Information — ${business.displayName}`}
        eyebrow="Business Concierge"
      />
      <p className="text-sm text-[#6B5E47]">
        Ver, corregir y actualizar la información que Leonix reutiliza en anuncios y perfiles. / View, correct, and update the information Leonix reuses across ads and profiles.
      </p>
      <BusinessInformationEditorClient businessId={businessId} businessName={business.displayName} />
    </div>
  );
}
