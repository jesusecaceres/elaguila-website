import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminActionProofErr, adminActionProofOk, adminBtnPrimary, adminCardBase, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { RecursoForm } from "@/app/admin/_components/recursos/RecursoForm";
import { VerificationTimeline } from "@/app/admin/_components/recursos/VerificationTimeline";
import { dbGetCommunityResourceById } from "@/app/lib/recursos/server/communityResourcesDb";
import { updateRecursoAction, setVerificationStatusAction } from "@/app/admin/recursosActions";
import { dbListPendingResourceChangeProposalsForResource } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbListVerificationEventsForResource } from "@/app/lib/recursos/intake/server/verificationEventsDb";

export const dynamic = "force-dynamic";

export default async function EditRecursoPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string; reverify_changes?: string }>;
}) {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const record = await dbGetCommunityResourceById(id);
  if (!record) notFound();

  const [pendingChanges, timeline] = await Promise.all([
    dbListPendingResourceChangeProposalsForResource(id),
    dbListVerificationEventsForResource(id),
  ]);

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
      {sp.reverify_changes !== undefined ? (
        <p className={`${adminActionProofOk} mb-6`}>
          Reverificación iniciada — {sp.reverify_changes} cambio(s) propuesto(s). Nada se verificó ni publicó automáticamente.{" "}
          {Number(sp.reverify_changes) > 0 ? (
            <Link href="/admin/recursos/cambios" className="font-bold underline">
              Revisar cambios →
            </Link>
          ) : null}
        </p>
      ) : null}

      <div className={`${adminCardBase} mb-6 flex flex-wrap items-center justify-between gap-3 p-5`}>
        <div>
          <p className="text-sm font-bold text-[#1E1810]">
            Verificación: {record.verification.verificationStatus} · Última: {record.verification.lastVerifiedAt ? new Date(record.verification.lastVerifiedAt).toLocaleDateString() : "—"} · Próxima:{" "}
            {record.verification.nextVerificationAt ? new Date(record.verification.nextVerificationAt).toLocaleDateString() : "—"}
          </p>
          {pendingChanges.length > 0 ? (
            <p className="mt-1 text-xs text-amber-900">
              {pendingChanges.length} cambio(s) pendiente(s) —{" "}
              <Link href="/admin/recursos/cambios" className="font-bold underline">
                revisar en Cambios
              </Link>
            </p>
          ) : null}
        </div>
        <form action={setVerificationStatusAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="verificationStatus" value="verified" />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage={
              pendingChanges.length > 0
                ? `Atención: hay ${pendingChanges.length} cambio(s) pendiente(s) sin revisar para este recurso. ¿Marcar la reverificación como completada de todos modos? Esto NO revisa ni descarta esos cambios — seguirán esperando en la cola de Cambios.`
                : "¿Marcar la reverificación como completada? Esto confirma que el recurso sigue siendo válido — no requiere que haya cambios pendientes."
            }
            className={adminBtnPrimary}
          >
            Marcar reverificación completada
          </ExecutiveHubConfirmSubmitButton>
        </form>
      </div>

      <RecursoForm mode="edit" initial={record} action={updateRecursoAction} />

      <div className="mt-8">
        <VerificationTimeline events={timeline} />
      </div>
    </div>
  );
}
