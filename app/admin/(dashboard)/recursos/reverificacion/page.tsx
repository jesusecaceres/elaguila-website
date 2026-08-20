import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { adminActionProofErr, adminBtnPrimary, adminCardBase, adminDesktopTableOnly, adminMobileCardList, adminTableWrap, adminTableZebraRow } from "@/app/admin/_components/adminTheme";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import { buildReverificationQueue, DUE_SOON_WINDOW_DAYS, type ReverificationQueueEntry } from "@/app/lib/recursos/intake/reverificationQueue";

export const dynamic = "force-dynamic";

const URGENCY_BADGE: Record<string, string> = {
  "help-now": "border border-rose-300 bg-rose-50 text-rose-900",
  "i-need-help": "border border-[#8FA467] bg-[#F4F7EC] text-[#3E5324]",
  "want-to-connect": "border border-[#7C93B0] bg-[#EEF3F8] text-[#2E4A66]",
};

function QueueTable({ entries }: { entries: ReverificationQueueEntry[] }) {
  return (
    <>
      <div className={`${adminDesktopTableOnly} ${adminTableWrap}`}>
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--lx-border)]/70 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <th className="px-4 py-3">Organización / programa</th>
              <th className="px-4 py-3">Urgencia</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Próxima revisión</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ record: r }) => (
              <tr key={r.id} className={adminTableZebraRow}>
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#1E1810]">{r.organizationName}</p>
                  {r.programName ? <p className="text-xs text-[#7A7164]">{r.programName}</p> : null}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${URGENCY_BADGE[r.urgencyLevel]}`}>
                    {getUrgencyLabel(r.urgencyLevel, "es")}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#5C5346]">{getPrimaryCategoryLabel(r.primaryCategory, "es")}</td>
                <td className="px-4 py-3 text-xs text-[#7A7164]">
                  {r.verification.nextVerificationAt ? new Date(r.verification.nextVerificationAt).toLocaleDateString() : "— sin fecha —"}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/recursos/${r.id}`} className="text-xs font-bold text-[#6B5B2E] underline">
                    Revisar →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={adminMobileCardList}>
        {entries.map(({ record: r }) => (
          <div key={r.id} className="rounded-2xl border border-[color:var(--lx-border)]/70 bg-[color:var(--lx-card)] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[#1E1810]">{r.organizationName}</p>
                {r.programName ? <p className="text-xs text-[#7A7164]">{r.programName}</p> : null}
              </div>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${URGENCY_BADGE[r.urgencyLevel]}`}>
                {getUrgencyLabel(r.urgencyLevel, "es")}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#5C5346]">
              <div>
                <dt className="text-[#7A7164]">Categoría</dt>
                <dd>{getPrimaryCategoryLabel(r.primaryCategory, "es")}</dd>
              </div>
              <div>
                <dt className="text-[#7A7164]">Próxima revisión</dt>
                <dd>{r.verification.nextVerificationAt ? new Date(r.verification.nextVerificationAt).toLocaleDateString() : "— sin fecha —"}</dd>
              </div>
            </dl>
            <div className="mt-3">
              <Link href={`/admin/recursos/${r.id}`} className="text-xs font-bold text-[#6B5B2E] underline">
                Revisar →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default async function RecursosReverificacionPage() {
  await requireLeonixAdminPermission("can_manage_recursos");

  const { rows, unavailable } = await dbListCommunityResources();
  const queue = buildReverificationQueue(rows);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Reverificación"
        subtitle="Cola operativa de recursos activos según su fecha de próxima verificación. No cambia la regla de 90 días ni crea ningún estado nuevo — lee directamente next_verification_at de community_resources."
        rightSlot={
          <Link href="/admin/recursos" className={adminBtnPrimary}>
            ← Volver al panel
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Cola de reverificación — real"
        purpose="Agrupa los recursos activos en Vencidos, Próximos (dentro de 14 días) y Al día, priorizando siempre ayuda-ahora primero y luego la fecha de próxima verificación más antigua."
        dataSource="Supabase `public.community_resources` vía dbListCommunityResources() — la misma fuente que el panel principal de Recursos. No agrega columnas ni tablas nuevas."
        status="real"
        safeActions={["Ver recursos vencidos o próximos a vencer", "Ir directamente a editar/reverificar un recurso"]}
        nextGate="Gate 6 añade el registro de eventos de verificación (verification_events) para cada reverificación completada."
        warningNote={`Ventana "Próximos" = ${DUE_SOON_WINDOW_DAYS} días. El valor por defecto de 90 días entre verificaciones no cambia en este Gate.`}
      />

      {unavailable ? (
        <p className={`${adminActionProofErr} mb-6`}>
          Supabase no está configurado o no responde — la cola de reverificación no se puede cargar en este momento.
        </p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <AdminStatCard title="Vencidos" value={queue.overdue.length} accent={queue.overdue.length > 0 ? "rose" : "default"} />
            <AdminStatCard title="Próximos (14 días)" value={queue.due_soon.length} accent={queue.due_soon.length > 0 ? "amber" : "default"} />
            <AdminStatCard title="Al día" value={queue.current.length} />
          </div>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-rose-900">Vencidos / Overdue</h2>
            {queue.overdue.length === 0 ? (
              <AdminEmptyState title="Nada vencido" description="Ningún recurso activo tiene su fecha de reverificación ya pasada." />
            ) : (
              <QueueTable entries={queue.overdue} />
            )}
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-900">Próximos / Due soon</h2>
            {queue.due_soon.length === 0 ? (
              <AdminEmptyState title="Nada próximo a vencer" description={`Ningún recurso activo vence en los próximos ${DUE_SOON_WINDOW_DAYS} días.`} />
            ) : (
              <QueueTable entries={queue.due_soon} />
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#2A4536]">Al día — resumen</h2>
            <div className={`${adminCardBase} p-5`}>
              <p className="text-sm text-[#5C5346]">
                <span className="font-bold text-[#1E1810]">{queue.current.length}</span> recursos activos están al día — su próxima
                verificación no vence en los próximos {DUE_SOON_WINDOW_DAYS} días. No se muestra la lista completa aquí para
                mantener el foco operativo en lo que realmente necesita atención.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
