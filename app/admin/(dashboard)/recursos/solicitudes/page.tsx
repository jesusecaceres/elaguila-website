import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { adminActionProofErr, adminBtnPrimary, adminDesktopTableOnly, adminMobileCardList, adminTableWrap, adminTableZebraRow } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbListPartnerUpdateRequests } from "@/app/lib/recursos/intake/server/partnerUpdateRequestsDb";

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

export default async function RecursosSolicitudesPage() {
  await requireLeonixAdminPermission("can_manage_recursos");

  const { rows, unavailable } = await dbListPartnerUpdateRequests();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Solicitudes de socios"
        subtitle="Correcciones y actualizaciones que una organización comunicó a Leonix (por teléfono, correo o en persona). En Gate 2 es una vista de solo lectura — el registro directo por el equipo llega en Gate 7."
        rightSlot={
          <Link href="/admin/recursos" className={adminBtnPrimary}>
            ← Volver al panel
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Cola de solicitudes — Gate 2 (solo lectura)"
        purpose="Vista de solo lectura de public.partner_update_requests. V1 es exclusivamente de entrada por el equipo de Leonix — no existe ni existirá en este build un formulario público de envío ni un portal de socios."
        dataSource="Supabase `public.partner_update_requests` (supabase/migrations/20260820120000_recursos_intake_os_schema.sql). Tabla privada — service_role únicamente. La información de contacto se trata como interna, nunca pública."
        status="real"
        safeActions={["Ver solicitudes de socios existentes con su estado actual"]}
        nextGate="Gate 7 activa el registro directo por el equipo y su conversión en propuestas de cambio revisables."
        warningNote="Ninguna solicitud de socio modifica un recurso publicado directamente — siempre pasa primero por la cola de Cambios propuestos para revisión campo por campo."
      />

      {unavailable ? (
        <p className={`${adminActionProofErr} mb-6`}>
          Supabase no está configurado o no responde — la cola de solicitudes no se puede cargar en este momento.
        </p>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="Sin solicitudes de socios todavía"
          description="Esta cola se llenará cuando el equipo registre correcciones reportadas por organizaciones (Gate 7) o, más adelante, si se habilita un formulario público de sugerencias. Por ahora no hay ninguna solicitud pendiente."
        />
      ) : (
        <>
          <div className={`${adminDesktopTableOnly} ${adminTableWrap}`}>
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--lx-border)]/70 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                  <th className="px-4 py-3">Organización / recurso</th>
                  <th className="px-4 py-3">Tipo de solicitud</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((req) => (
                  <tr key={req.id} className={adminTableZebraRow}>
                    <td className="px-4 py-3">
                      {req.resourceId ? (
                        <Link href={`/admin/recursos/${req.resourceId}`} className="font-semibold text-[#6B5B2E] underline">
                          {req.resourceOrganizationName ?? req.organizationName ?? req.resourceId}
                        </Link>
                      ) : (
                        <span className="font-semibold text-[#1E1810]">{req.organizationName ?? "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#5C5346]">{req.requestType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[req.status] ?? ""}`}>
                        {STATUS_LABEL[req.status] ?? req.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7A7164]">{req.submittedContactName ?? req.submittedContactEmail ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#7A7164]">{new Date(req.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={adminMobileCardList}>
            {rows.map((req) => (
              <div key={req.id} className="rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[#1E1810]">{req.resourceOrganizationName ?? req.organizationName ?? "—"}</p>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[req.status] ?? ""}`}>
                    {STATUS_LABEL[req.status] ?? req.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5C5346]">
                  <div>
                    <dt className="text-[#7A7164]">Tipo</dt>
                    <dd>{req.requestType}</dd>
                  </div>
                  <div>
                    <dt className="text-[#7A7164]">Contacto</dt>
                    <dd className="truncate">{req.submittedContactName ?? req.submittedContactEmail ?? "—"}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
