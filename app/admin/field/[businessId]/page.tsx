import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSalesWorkspaceAccess, type SalesWorkspaceDenialReason } from "../../_lib/businessWorkspaceAccess";
import { getBusinessWorkspaceDetail } from "../../_lib/businessWorkspaceData";
import { BusinessQuickActions, CameraFileCapture, NetworkStatusIndicator } from "../FieldAgentComponents";
import { FieldAgentDictationSection } from "./FieldAgentDictationSection";

/**
 * Program 7, Gate 7G — Mobile Field Agent per-business capture screen.
 * Reuses the canonical staff access resolver + Field Discovery upload pipeline.
 */

export const dynamic = "force-dynamic";

const IDENTITY_DENIAL_REASONS: readonly SalesWorkspaceDenialReason[] = ["no_admin_cookie", "bootstrap_session_not_allowed", "no_operator_identity", "auth_user_not_found"];

export default async function FieldAgentBusinessPage({ params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    redirect(IDENTITY_DENIAL_REASONS.includes(access.reason) ? "/admin/login" : "/admin/team?access_denied=1");
  }

  const { businessId } = await params;
  const detail = await getBusinessWorkspaceDetail(businessId, access.actor);
  if (!detail) {
    return (
      <div className="mx-auto max-w-md px-4 pt-4">
        <p className="text-sm">Negocio no encontrado. / Business not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/admin/field" className="text-xs font-semibold text-[#7A1E2C] underline">
          ← Field Agent
        </Link>
        <NetworkStatusIndicator />
      </div>
      <h1 className="text-lg font-bold text-[color:var(--lx-text)]">{detail.business.displayName}</h1>

      <BusinessQuickActions businessId={businessId} />

      <section className="rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4">
        <h2 className="mb-2 text-sm font-bold text-[color:var(--lx-text)]">Captura / Capture</h2>
        <CameraFileCapture businessId={businessId} />
      </section>

      <section className="rounded-2xl border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-4">
        <h2 className="mb-2 text-sm font-bold text-[color:var(--lx-text)]">Nota por voz / Voice note</h2>
        <FieldAgentDictationSection businessId={businessId} />
      </section>
    </div>
  );
}
