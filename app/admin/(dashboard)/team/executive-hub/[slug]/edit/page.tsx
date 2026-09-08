import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentAdminAccessContext, requireAdminTeamAccess } from "@/app/admin/_lib/adminAccessControl";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { StaffTeamNav } from "@/app/admin/_components/StaffTeamNav";
import { adminActionProofErr, adminActionProofOk, adminCtaChip, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubForm } from "@/app/admin/_components/executiveHub/ExecutiveHubForm";
import { ExecutiveHubLivePreviewPanel } from "@/app/admin/_components/executiveHub/ExecutiveHubLivePreviewPanel";
import { getExecutiveHubRecord } from "@/app/admin/_lib/executiveHubStore";
import { updateExecutiveHubAction } from "@/app/admin/executiveHubActions";

export const dynamic = "force-dynamic";

export default async function EditExecutiveHubPage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const access = await getCurrentAdminAccessContext();
  requireAdminTeamAccess(access);

  const { slug } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const record = await getExecutiveHubRecord(slug);
  if (!record) notFound();

  return (
    <div>
      <StaffTeamNav showRosterLink />
      <div className="mt-6">
        <AdminPageHeader
          eyebrow="Team · Executive Hub"
          title={`Edit — ${record.fullName}`}
          subtitle={`/contact/${record.slug}`}
          rightSlot={
            <div className="flex flex-wrap gap-2">
              <Link href={`/admin/team/executive-hub/${record.slug}/preview`} className={adminCtaChip}>
                Preview
              </Link>
              <Link href="/admin/team/executive-hub" className={adminCtaChipSecondary}>
                ← Back to list
              </Link>
            </div>
          }
        />
        {sp.saved ? <p className={`${adminActionProofOk} mb-6`}>Saved.</p> : null}
        {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          <ExecutiveHubForm mode="edit" initial={record} action={updateExecutiveHubAction} />
          <ExecutiveHubLivePreviewPanel slug={record.slug} />
        </div>
      </div>
    </div>
  );
}
