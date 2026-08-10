import { redirect } from "next/navigation";
import { AdminPageHeader } from "../../../_components/AdminPageHeader";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../_lib/businessWorkspaceAccess";
import { CanvassForm } from "./CanvassForm";

export const dynamic = "force-dynamic";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

export default async function AdminCanvassPage() {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "conduct_canvassing")) {
    redirect("/admin/team?access_denied=1");
  }

  return (
    <div className="mx-auto max-w-xl px-3 pb-24">
      <AdminPageHeader title="Field Canvassing" eyebrow="Sales workspace" />
      <CanvassForm />
    </div>
  );
}
