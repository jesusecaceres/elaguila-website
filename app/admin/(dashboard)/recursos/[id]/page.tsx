import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminActionProofErr, adminActionProofOk, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { RecursoForm } from "@/app/admin/_components/recursos/RecursoForm";
import { dbGetCommunityResourceById } from "@/app/lib/recursos/server/communityResourcesDb";
import { updateRecursoAction } from "@/app/admin/recursosActions";

export const dynamic = "force-dynamic";

export default async function EditRecursoPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string }>;
}) {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const record = await dbGetCommunityResourceById(id);
  if (!record) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos · Data OS"
        title={`Edit — ${record.organizationName}`}
        subtitle={record.programName ?? undefined}
        rightSlot={
          <Link href="/admin/recursos" className={adminCtaChipSecondary}>
            ← Back to list
          </Link>
        }
      />
      {sp.saved ? <p className={`${adminActionProofOk} mb-6`}>Saved.</p> : null}
      {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}
      <RecursoForm mode="edit" initial={record} action={updateRecursoAction} />
    </div>
  );
}
