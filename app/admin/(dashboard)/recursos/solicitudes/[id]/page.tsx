import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminActionProofErr, adminActionProofOk, adminBtnPrimary, adminCardBase } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbGetPartnerUpdateRequest } from "@/app/lib/recursos/intake/server/partnerUpdateRequestsDb";
import {
  convertPartnerRequestToProposalsAction,
  markPartnerRequestReviewingAction,
  rejectPartnerRequestAction,
  resolvePartnerRequestAction,
} from "@/app/admin/recursosPartnerRequestActions";
import { PARTNER_REQUEST_TYPES, REQUEST_TYPE_FIELDS, fieldLabel, type PartnerRequestType } from "@/app/lib/recursos/intake/partnerRequestFieldMap";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  reviewing: "En revisión",
  resolved: "Resuelto",
  rejected: "Rechazado",
};
const STATUS_BADGE: Record<string, string> = {
  pending: "border border-amber-200 bg-amber-50 text-amber-950",
  reviewing: "border border-sky-200 bg-sky-50 text-sky-950",
  resolved: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  rejected: "border border-rose-200 bg-rose-50 text-rose-900",
};

export default async function SolicitudDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; status_saved?: string; created?: string; converted?: string; skipped?: string }>;
}) {
  await requireLeonixAdminPermission("can_manage_recursos");
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};

  const request = await dbGetPartnerUpdateRequest(id);
  if (!request) notFound();

  const requestTypeLabel = PARTNER_REQUEST_TYPES.find((t) => t.value === request.requestType)?.label ?? request.requestType;
  const reportedFields = REQUEST_TYPE_FIELDS[request.requestType as PartnerRequestType] ?? [];
  const isClosed = request.status === "resolved" || request.status === "rejected";
  const canConvert = !isClosed && Boolean(request.resourceId) && reportedFields.length > 0;

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos — Solicitud de socio"
        title={request.resourceOrganizationName ?? request.organizationName ?? "Solicitud"}
        subtitle={requestTypeLabel}
        rightSlot={
          <Link href="/admin/recursos/solicitudes" className={adminBtnPrimary}>
            ← Volver a solicitudes
          </Link>
        }
      />

      {sp.created ? <p className={`${adminActionProofOk} mb-6`}>Solicitud registrada.</p> : null}
      {sp.status_saved ? <p className={`${adminActionProofOk} mb-6`}>Guardado.</p> : null}
      {sp.converted !== undefined ? (
        <p className={`${adminActionProofOk} mb-6`}>
          Convertido — {sp.converted} cambio(s) propuesto(s) nuevo(s){Number(sp.skipped) > 0 ? `, ${sp.skipped} ya estaban pendientes` : ""}. Nada se aceptó ni publicó
          automáticamente.{" "}
          <Link href="/admin/recursos/cambios" className="font-bold underline">
            Revisar cambios →
          </Link>
        </p>
      ) : null}
      {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}

      <section className={`${adminCardBase} mb-6 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Detalle de la solicitud</h3>
          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[request.status] ?? ""}`}>
            {STATUS_LABEL[request.status] ?? request.status}
          </span>
        </div>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Recurso vinculado</dt>
            <dd className="text-sm text-[#1E1810]">
              {request.resourceId ? (
                <Link href={`/admin/recursos/${request.resourceId}`} className="font-bold underline">
                  {request.resourceOrganizationName ?? request.resourceId}
                </Link>
              ) : (
                <span>Sin vincular — {request.organizationName ?? "organización sin nombre"}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Tipo de solicitud</dt>
            <dd className="text-sm text-[#1E1810]">{requestTypeLabel}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Contacto</dt>
            <dd className="text-sm text-[#1E1810]">{request.submittedContactName ?? "—"} {request.submittedContactEmail ? `· ${request.submittedContactEmail}` : ""}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Registrado</dt>
            <dd className="text-sm text-[#1E1810]">
              {new Date(request.createdAt).toLocaleString()} {request.createdBy ? `· ${request.createdBy}` : ""}
            </dd>
          </div>
          {request.reviewedBy || request.reviewedAt ? (
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Última revisión</dt>
              <dd className="text-sm text-[#1E1810]">
                {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : "—"} {request.reviewedBy ? `· ${request.reviewedBy}` : ""}
              </dd>
            </div>
          ) : null}
        </dl>

        <div className="mt-4">
          <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Cambios reportados</dt>
          {Object.keys(request.requestedChanges).length === 0 ? (
            <dd className="mt-1 text-sm text-[#7A7164]">Ninguno — este tipo de solicitud no reporta campos (ver notas).</dd>
          ) : (
            <dl className="mt-2 grid gap-2 sm:grid-cols-2">
              {Object.entries(request.requestedChanges).map(([field, value]) => (
                <div key={field} className="rounded-lg border border-[color:var(--lx-border)] bg-white/60 px-3 py-2">
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{fieldLabel(field)}</dt>
                  <dd className="text-sm text-[#1E1810]">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {request.sourceNotes ? (
          <div className="mt-4">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">Notas</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-[#1E1810]">{request.sourceNotes}</dd>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <form action={convertPartnerRequestToProposalsAction}>
          <input type="hidden" name="requestId" value={id} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="¿Convertir esta solicitud en cambios propuestos? Esto NO acepta ni publica ningún cambio — solo crea propuestas revisables en la cola de Cambios."
            className={`${adminBtnPrimary} ${canConvert ? "" : "pointer-events-none opacity-40"}`}
          >
            Convertir en propuesta
          </ExecutiveHubConfirmSubmitButton>
        </form>
        <form action={markPartnerRequestReviewingAction}>
          <input type="hidden" name="requestId" value={id} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="¿Marcar esta solicitud como en revisión?"
            className={`rounded-lg border border-sky-700 bg-sky-700 px-4 py-2 text-sm font-bold text-white hover:bg-sky-800 ${request.status === "pending" ? "" : "pointer-events-none opacity-40"}`}
          >
            Marcar en revisión
          </ExecutiveHubConfirmSubmitButton>
        </form>
        <form action={resolvePartnerRequestAction}>
          <input type="hidden" name="requestId" value={id} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="¿Marcar esta solicitud como resuelta? Esto cierra el flujo de la solicitud — no acepta ningún cambio propuesto por sí solo."
            className={`rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800 ${isClosed ? "pointer-events-none opacity-40" : ""}`}
          >
            Resolver
          </ExecutiveHubConfirmSubmitButton>
        </form>
        <form action={rejectPartnerRequestAction}>
          <input type="hidden" name="requestId" value={id} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage="¿Rechazar esta solicitud como no válida o no sustanciada?"
            className={`rounded-lg border border-rose-800 bg-rose-800 px-4 py-2 text-sm font-bold text-white hover:bg-rose-900 ${isClosed ? "pointer-events-none opacity-40" : ""}`}
          >
            Rechazar solicitud
          </ExecutiveHubConfirmSubmitButton>
        </form>
      </div>
      {!canConvert && !isClosed ? (
        <p className="mt-2 text-xs text-[#8B7E70]">
          {request.resourceId ? 'Convertir se deshabilita para solicitudes tipo "Otro" — no reportan campos comparables.' : "Convertir requiere un recurso existente vinculado."}
        </p>
      ) : null}
    </div>
  );
}
