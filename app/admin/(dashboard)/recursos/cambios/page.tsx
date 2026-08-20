import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { adminActionProofErr, adminBtnPrimary, adminDesktopTableOnly, adminMobileCardList, adminTableWrap, adminTableZebraRow } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbListResourceChangeProposals } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptado",
  rejected: "Rechazado",
  needs_more_research: "Necesita más investigación",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "border border-amber-200 bg-amber-50 text-amber-950",
  accepted: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  rejected: "border border-rose-200 bg-rose-50 text-rose-900",
  needs_more_research: "border border-sky-200 bg-sky-50 text-sky-950",
};

const SOURCE_LABEL: Record<string, string> = {
  pdf_reextraction: "Reextracción de PDF",
  url_recheck: "Revisión de URL",
  partner_request: "Solicitud de socio",
  manual: "Manual",
};

function shortValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 60 ? `${s.slice(0, 57)}...` : s;
}

export default async function RecursosCambiosPage() {
  await requireLeonixAdminPermission("can_manage_recursos");

  const { rows, unavailable } = await dbListResourceChangeProposals();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Cambios propuestos"
        subtitle="Propuestas de cambio a nivel de campo (valor anterior → valor propuesto) para recursos ya publicados. Ningún cambio se aplica automáticamente."
        rightSlot={
          <Link href="/admin/recursos" className={adminBtnPrimary}>
            ← Volver al panel
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Cola de cambios — Gate 2 (solo lectura)"
        purpose="Vista de solo lectura de public.resource_change_proposals. Cada fila representa un campo específico de un recurso existente que podría necesitar actualización, con su valor anterior y el valor propuesto, lado a lado."
        dataSource="Supabase `public.resource_change_proposals` (supabase/migrations/20260820120000_recursos_intake_os_schema.sql). Tabla privada — service_role únicamente."
        status="real"
        safeActions={["Ver propuestas de cambio existentes con su estado actual"]}
        nextGate="Gate 5 activa Aceptar / Rechazar / Necesita más investigación por campo. Ningún cambio se escribe en community_resources hasta entonces."
        warningNote="Nunca hay sobrescritura silenciosa: cada propuesta permanece en estado pendiente hasta que un administrador la revise explícitamente, campo por campo."
      />

      {unavailable ? (
        <p className={`${adminActionProofErr} mb-6`}>
          Supabase no está configurado o no responde — la cola de cambios no se puede cargar en este momento.
        </p>
      ) : rows.length === 0 ? (
        <AdminEmptyState
          title="Sin propuestas de cambio todavía"
          description="Esta cola se llenará cuando el intake por PDF/URL (Gates 3–4) o el motor de detección de cambios (Gate 5) generen propuestas. Por ahora, ningún recurso existente tiene cambios pendientes de revisión."
        />
      ) : (
        <>
          <div className={`${adminDesktopTableOnly} ${adminTableWrap}`}>
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-[color:var(--lx-border)]/70 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                  <th className="px-4 py-3">Recurso</th>
                  <th className="px-4 py-3">Campo</th>
                  <th className="px-4 py-3">Valor anterior</th>
                  <th className="px-4 py-3">Valor propuesto</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className={adminTableZebraRow}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/recursos/${p.resourceId}`} className="font-semibold text-[#6B5B2E] underline">
                        {p.resourceOrganizationName ?? p.resourceId}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#5C5346]">{p.fieldName}</td>
                    <td className="px-4 py-3 text-xs text-[#7A7164]">{shortValue(p.oldValue)}</td>
                    <td className="px-4 py-3 text-xs text-[#1E1810]">{shortValue(p.proposedValue)}</td>
                    <td className="px-4 py-3 text-xs text-[#7A7164]">{SOURCE_LABEL[p.proposalSource] ?? p.proposalSource}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[p.status] ?? ""}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#7A7164]">{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={adminMobileCardList}>
            {rows.map((p) => (
              <div key={p.id} className="rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/admin/recursos/${p.resourceId}`} className="font-semibold text-[#6B5B2E] underline">
                    {p.resourceOrganizationName ?? p.resourceId}
                  </Link>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[p.status] ?? ""}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5C5346]">
                  <div>
                    <dt className="text-[#7A7164]">Campo</dt>
                    <dd>{p.fieldName}</dd>
                  </div>
                  <div>
                    <dt className="text-[#7A7164]">Origen</dt>
                    <dd>{SOURCE_LABEL[p.proposalSource] ?? p.proposalSource}</dd>
                  </div>
                  <div>
                    <dt className="text-[#7A7164]">Anterior</dt>
                    <dd className="truncate">{shortValue(p.oldValue)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#7A7164]">Propuesto</dt>
                    <dd className="truncate">{shortValue(p.proposedValue)}</dd>
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
