import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../_lib/businessWorkspaceAccess";
import { listBusinessesForWorkspace } from "../_lib/businessWorkspaceData";
import { InstallCta, NetworkStatusIndicator } from "./FieldAgentComponents";
import { FieldAgentHomeHeader } from "./FieldAgentIdentity";

/**
 * Program 7, Gate 7G / Gate 03 — Mobile Staff Field Agent home.
 * Reuses the existing canonical staff access resolver (requireSalesWorkspaceAccess) —
 * no separate PWA authentication path. Reuses listBusinessesForWorkspace (Sales Workspace,
 * Program 1) — no duplicated business listing query.
 */

export const dynamic = "force-dynamic";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

export default async function FieldAgentShellPage() {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }

  const { items } = await listBusinessesForWorkspace({ limit: 25 });

  return (
    <div className="mx-auto max-w-md overflow-x-hidden px-4 pb-24 pt-4">
      <div className="mb-3 flex justify-end">
        <NetworkStatusIndicator />
      </div>
      <div className="space-y-4">
        <FieldAgentHomeHeader />
        <InstallCta />
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">
            Negocios / Businesses
          </h2>
          {items.map(({ business }) => (
            <Link
              key={business.id}
              href={`/admin/field/${business.id}`}
              className="flex min-h-[44px] items-center rounded-lg border border-[#D6C7AD]/85 bg-[#FFFDF7] px-3 py-2 text-sm font-semibold text-[#1E1810]"
            >
              {business.displayName}
            </Link>
          ))}
          {items.length === 0 ? (
            <p className="text-xs text-[#7A7164]">No hay negocios asignados. / No businesses assigned.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
