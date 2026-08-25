import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { adminActionProofErr, adminBtnPrimary, adminCardBase, adminCtaChip, adminCtaChipCompact, adminDesktopTableOnly, adminMobileCardList, adminTableWrap, adminTableZebraRow } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbListCommunityResources } from "@/app/lib/recursos/server/communityResourcesDb";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import { buildReverificationQueue, DUE_SOON_WINDOW_DAYS, type ReverificationQueueEntry } from "@/app/lib/recursos/intake/reverificationQueue";
import { startUrlReverificationAction } from "@/app/admin/recursosReverificationActions";
import { dbListResourceChangeProposals } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";

export const dynamic = "force-dynamic";

const URGENCY_BADGE: Record<string, string> = {
  "help-now": "border border-rose-300 bg-rose-50 text-rose-900",
  "i-need-help": "border border-[#8FA467] bg-[#F4F7EC] text-[#3E5324]",
  "want-to-connect": "border border-[#7C93B0] bg-[#EEF3F8] text-[#2E4A66]",
};

function QueueTable({ entries, pendingChangeCounts }: { entries: ReverificationQueueEntry[]; pendingChangeCounts: Map<string, number> }) {
  return (
    <>
      <div className={`${adminDesktopTableOnly} ${adminTableWrap}`}>
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--lx-border)]/70 text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <th className="px-4 py-3">Organización / programa</th>
              <th className="px-4 py-3">Urgencia</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3">Última / próxima revisión</th>
              <th className="px-4 py-3">Sitio oficial</th>
              <th className="px-4 py-3">Cambios pendientes</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(({ record: r }) => {
              const hasWebsite = Boolean(r.contact.websiteUrl || r.verification.officialSourceUrl);
              const pendingCount = pendingChangeCounts.get(r.id) ?? 0;
              return (
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
                    {r.verification.lastVerifiedAt ? new Date(r.verification.lastVerifiedAt).toLocaleDateString() : "— sin verificar —"} →{" "}
                    {r.verification.nextVerificationAt ? new Date(r.verification.nextVerificationAt).toLocaleDateString() : "— sin fecha —"}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#7A7164]">{hasWebsite ? "Sí" : "No"}</td>
                  <td className="px-4 py-3">
                    {pendingCount > 0 ? (
                      <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
                        {pendingCount} pendiente(s)
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#8B7E70]">Ninguno</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/recursos/${r.id}`} className="text-xs font-bold text-[#6B5B2E] underline">
                        Revisar →
                      </Link>
                      {hasWebsite ? (
                        <form action={startUrlReverificationAction}>
                          <input type="hidden" name="resourceId" value={r.id} />
                          <ExecutiveHubConfirmSubmitButton
                            confirmMessage={`¿Iniciar reverificación de "${r.organizationName}"? Se obtendrá su sitio oficial y se generarán propuestas de cambio si algo difiere — no se verifica ni publica nada automáticamente.`}
                            className={`${adminCtaChip} ${adminCtaChipCompact}`}
                          >
                            Iniciar reverificación
                          </ExecutiveHubConfirmSubmitButton>
                        </form>
                      ) : (
                        <span className="text-[11px] text-[#8B7E70]">Sin sitio oficial para reverificar automáticamente</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={adminMobileCardList}>
        {entries.map(({ record: r }) => {
          const hasWebsite = Boolean(r.contact.websiteUrl || r.verification.officialSourceUrl);
          const pendingCount = pendingChangeCounts.get(r.id) ?? 0;
          return (
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
                <div>
                  <dt className="text-[#7A7164]">Sitio oficial</dt>
                  <dd>{hasWebsite ? "Sí" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-[#7A7164]">Cambios pendientes</dt>
                  <dd>{pendingCount > 0 ? `${pendingCount} pendiente(s)` : "Ninguno"}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link href={`/admin/recursos/${r.id}`} className="text-xs font-bold text-[#6B5B2E] underline">
                  Revisar →
                </Link>
                {hasWebsite ? (
                  <form action={startUrlReverificationAction}>
                    <input type="hidden" name="resourceId" value={r.id} />
                    <ExecutiveHubConfirmSubmitButton
                      confirmMessage={`¿Iniciar reverificación de "${r.organizationName}"?`}
                      className={`${adminCtaChip} ${adminCtaChipCompact}`}
                    >
                      Iniciar reverificación
                    </ExecutiveHubConfirmSubmitButton>
                  </form>
                ) : (
                  <span className="text-[11px] text-[#8B7E70]">Sin sitio oficial</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default async function RecursosReverificacionPage() {
  await requireLeonixAdminPermission("can_manage_recursos");

  const { rows, unavailable } = await dbListCommunityResources();
  const queue = buildReverificationQueue(rows);

  const { rows: pendingProposals } = await dbListResourceChangeProposals(500);
  const pendingChangeCounts = new Map<string, number>();
  for (const p of pendingProposals) {
    if (p.status !== "pending") continue;
    pendingChangeCounts.set(p.resourceId, (pendingChangeCounts.get(p.resourceId) ?? 0) + 1);
  }

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
        safeActions={["Ver recursos vencidos o próximos a vencer", "Ver cuántos cambios pendientes tiene cada uno", "Iniciar reverificación por URL o ir directamente a editar/reverificar un recurso"]}
        nextGate="Ninguno planeado — la cola ya es completamente operativa."
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
              <QueueTable entries={queue.overdue} pendingChangeCounts={pendingChangeCounts} />
            )}
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-900">Próximos / Due soon</h2>
            {queue.due_soon.length === 0 ? (
              <AdminEmptyState title="Nada próximo a vencer" description={`Ningún recurso activo vence en los próximos ${DUE_SOON_WINDOW_DAYS} días.`} />
            ) : (
              <QueueTable entries={queue.due_soon} pendingChangeCounts={pendingChangeCounts} />
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
