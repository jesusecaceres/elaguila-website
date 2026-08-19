import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminActionProofErr, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { RecursoForm } from "@/app/admin/_components/recursos/RecursoForm";
import { createRecursoAction } from "@/app/admin/recursosActions";

export const dynamic = "force-dynamic";

export default async function NewRecursoPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const sp = props.searchParams ? await props.searchParams : {};

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos · Data OS"
        title="New resource"
        subtitle="Fill in identity, description, category/urgency, contact, and verification. Only populated contact fields will ever show a CTA."
        rightSlot={
          <Link href="/admin/recursos" className={adminCtaChipSecondary}>
            ← Back to list
          </Link>
        }
      />
      {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}
      <RecursoForm mode="create" action={createRecursoAction} />
    </div>
  );
}
