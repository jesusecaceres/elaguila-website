import Link from "next/link";
import { getCurrentAdminAccessContext, requireAdminTeamAccess } from "@/app/admin/_lib/adminAccessControl";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { StaffTeamNav } from "@/app/admin/_components/StaffTeamNav";
import { adminActionProofErr, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubForm } from "@/app/admin/_components/executiveHub/ExecutiveHubForm";
import { createExecutiveHubAction } from "@/app/admin/executiveHubActions";

export const dynamic = "force-dynamic";

export default async function NewExecutiveHubPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const access = await getCurrentAdminAccessContext();
  requireAdminTeamAccess(access);
  const sp = props.searchParams ? await props.searchParams : {};

  return (
    <div>
      <StaffTeamNav showRosterLink />
      <div className="mt-6">
        <AdminPageHeader
          eyebrow="Team · Executive Hub"
          title="New executive"
          subtitle="Fill in identity, contact, theme, and status. You can preview before publishing."
          rightSlot={
            <Link href="/admin/team/executive-hub" className={adminCtaChipSecondary}>
              ← Back to list
            </Link>
          }
        />
        {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}
        <ExecutiveHubForm mode="create" action={createExecutiveHubAction} />
      </div>
    </div>
  );
}
