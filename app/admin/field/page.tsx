import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../_lib/businessWorkspaceAccess";
import { listBusinessesForWorkspace } from "../_lib/businessWorkspaceData";
import { InstallCta, NetworkStatusIndicator } from "./FieldAgentComponents";

/**
 * Program 7, Gate 7G — Mobile Staff Field Agent shell.
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
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4">
      <div className="flex items-center justify-between">
        <AdminPageHeader title="Field Agent" eyebrow="Leonix Business Concierge" />
        <NetworkStatusIndicator />
      </div>
      <InstallCta />
      <div className="space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wide text-[color:var(--lx-text-muted)]">
          Negocios / Businesses
        </h2>
        {items.map(({ business }) => (
          <Link
            key={business.id}
            href={`/admin/field/${business.id}`}
            className="block rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-3 text-sm font-semibold text-[color:var(--lx-text)]"
          >
            {business.displayName}
          </Link>
        ))}
        {items.length === 0 ? (
          <p className="text-xs text-[color:var(--lx-text-muted)]">No hay negocios asignados. / No businesses assigned.</p>
        ) : null}
      </div>
    </div>
  );
}
