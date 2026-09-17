import { redirect } from "next/navigation";
import { Suspense } from "react";
import { actorHasCapability, requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../../../_lib/businessWorkspaceAccess";
import { HandoffClient } from "./HandoffClient";

export const dynamic = "force-dynamic";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

/**
 * Assisted Publishing (Gate 07) — same-tab handoff: fetch the Business Identity projection,
 * seed the category's EXISTING browser draft (existing draft wins), then continue into the real
 * application. Server shell only does the auth gate; the seeding must run in the browser because
 * that is where the category draft stores live.
 */
export default async function CreateForClientHandoffPage() {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    redirect("/admin/team?access_denied=1");
  }
  return (
    <Suspense fallback={<p className="text-sm text-[#7A7164]">Preparando… / Preparing…</p>}>
      <HandoffClient />
    </Suspense>
  );
}
