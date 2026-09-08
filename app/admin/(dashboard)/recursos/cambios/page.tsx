import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { adminActionProofErr, adminActionProofOk, adminBtnPrimary, adminCardBase, adminCtaChip, adminCtaChipCompact } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { dbListResourceChangeProposals, type ResourceChangeProposalRow } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { isSafetySensitiveField, isHighRiskResourceForTranslation } from "@/app/lib/recursos/intake/resourceChangeDetection";
import { acceptAllSafeChangeProposalsAction, acceptChangeProposalAction, needsMoreResearchChangeProposalAction, rejectChangeProposalAction } from "@/app/admin/recursosChangeProposalActions";

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
  translation: "Traducción",
  official_spanish: "Fuente oficial ES",
};

function shortValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s.length > 80 ? `${s.slice(0, 77)}...` : s;
}

function ProposalRow({ p }: { p: ResourceChangeProposalRow }) {
  const safety = isSafetySensitiveField(p.fieldName);
  const isTranslation = p.proposalSource === "translation";
  const isOfficialSpanish = p.proposalSource === "official_spanish";
  // Gate ES-9H: high-risk defense-in-depth badge now covers official_spanish rows too, not just
  // translation — a high-risk official_spanish proposal should never exist (prepareOfficialSpanishProposals
  // refuses it structurally), but this is a display-only second signal, never the enforcement point.
  const highRisk = (isTranslation || isOfficialSpanish) && isHighRiskResourceForTranslation({
    primaryCategory: p.resourcePrimaryCategory,
    crisisPhone: p.resourceCrisisPhone,
    is24Hours: p.resourceIs24Hours,
  });
  return (
    <div className={`${adminCardBase} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{p.fieldName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#7A7164] line-through">{shortValue(p.oldValue)}</span>
            <span className="text-[#7A7164]">→</span>
            <span className="font-semibold text-[#1E1810]">{shortValue(p.proposedValue)}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {isTranslation ? (
            <span className="inline-flex rounded-md border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-900">
              Traducción ES
            </span>
          ) : null}
          {isOfficialSpanish ? (
            <span className="inline-flex rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-900">
              Fuente oficial ES — no es traducción por IA
            </span>
          ) : null}
          {highRisk ? (
            <span className="inline-flex rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-900">
              Alto riesgo — revisar individualmente
            </span>
          ) : safety ? (
            <span className="inline-flex rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-900">
              Sensible / seguridad
            </span>
          ) : null}
          <span className="text-[10px] text-[#8B7E70]">{SOURCE_LABEL[p.proposalSource] ?? p.proposalSource} · {new Date(p.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <form action={acceptChangeProposalAction}>
          <input type="hidden" name="proposalId" value={p.id} />
          <ExecutiveHubConfirmSubmitButton
            confirmMessage={`¿Aceptar este cambio? Actualizará únicamente el campo "${p.fieldName}" en el recurso publicado.`}
            className={`${adminCtaChip} ${adminCtaChipCompact} border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800`}
          >
            Aceptar
          </ExecutiveHubConfirmSubmitButton>
        </form>
        <form action={rejectChangeProposalAction}>
          <input type="hidden" name="proposalId" value={p.id} />
          <ExecutiveHubConfirmSubmitButton confirmMessage="¿Rechazar esta propuesta? El recurso publicado no cambia." className={`${adminCtaChip} ${adminCtaChipCompact}`}>
            Rechazar
          </ExecutiveHubConfirmSubmitButton>
        </form>
        <form action={needsMoreResearchChangeProposalAction}>
          <input type="hidden" name="proposalId" value={p.id} />
          <ExecutiveHubConfirmSubmitButton confirmMessage="¿Marcar como que necesita más investigación? El recurso publicado no cambia." className={`${adminCtaChip} ${adminCtaChipCompact}`}>
            Necesita más investigación
          </ExecutiveHubConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}

type CambiosTipo = "todos" | "datos" | "traducciones" | "oficial_es";
const TIPO_TABS: { value: CambiosTipo; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "datos", label: "Datos" },
  { value: "traducciones", label: "Traducciones" },
  { value: "oficial_es", label: "Fuente oficial ES" },
];

export default async function RecursosCambiosPage(props: { searchParams?: Promise<{ status_saved?: string; error?: string; tipo?: string }> }) {
  await requireLeonixAdminPermission("can_manage_recursos");
  const sp = props.searchParams ? await props.searchParams : {};
  const tipo: CambiosTipo = sp.tipo === "datos" || sp.tipo === "traducciones" || sp.tipo === "oficial_es" ? sp.tipo : "todos";

  const { rows: allRows, unavailable } = await dbListResourceChangeProposals();
  // Gate ES-9H: three-way split — official_spanish is its own bucket, never lumped into "datos"
  // (factual) alongside pdf_reextraction/url_recheck/partner_request/manual, and never mixed into
  // "traducciones" either — translation-tab semantics are unchanged from before this gate.
  const rows =
    tipo === "todos"
      ? allRows
      : tipo === "traducciones"
        ? allRows.filter((p) => p.proposalSource === "translation")
        : tipo === "oficial_es"
          ? allRows.filter((p) => p.proposalSource === "official_spanish")
          : allRows.filter((p) => p.proposalSource !== "translation" && p.proposalSource !== "official_spanish");
  const pending = rows.filter((p) => p.status === "pending");
  const decided = rows.filter((p) => p.status !== "pending");

  const pendingByResource = new Map<string, ResourceChangeProposalRow[]>();
  for (const p of pending) {
    const list = pendingByResource.get(p.resourceId) ?? [];
    list.push(p);
    pendingByResource.set(p.resourceId, list);
  }

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
        title="Cola de cambios — Gate 5 (operacional)"
        purpose="Revisión campo por campo de public.resource_change_proposals. Aceptar actualiza únicamente ese campo en community_resources; Rechazar y Necesita más investigación nunca tocan el recurso."
        dataSource="Supabase `public.resource_change_proposals`. Cada acción re-lee la propuesta en el servidor, confirma que sigue pendiente, y escribe solo la columna permitida — nunca una sobrescritura completa."
        status="real"
        safeActions={["Aceptar un cambio de campo", "Rechazar una propuesta", "Marcar que necesita más investigación", "Aceptar todos los cambios seguros de un recurso (excluye campos sensibles, traducciones y fuente oficial ES)"]}
        nextGate="Ninguno planeado en esta fase — la aprobación habitual de español oficial vive en /admin/recursos/espanol."
        warningNote="Los campos sensibles (teléfono de crisis, SMS, dirección, 24/7), toda propuesta de traducción, y toda propuesta de fuente oficial en español siempre requieren revisión individual o el flujo dedicado — ninguno se incluye en 'Aceptar cambios seguros'."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TIPO_TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "todos" ? "/admin/recursos/cambios" : `/admin/recursos/cambios?tipo=${t.value}`}
            className={`${adminCtaChip} ${adminCtaChipCompact} ${tipo === t.value ? "border-[#7A1E2C] bg-[#7A1E2C] text-white hover:bg-[#6B1A26]" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {sp.status_saved ? <p className={`${adminActionProofOk} mb-6`}>Guardado.</p> : null}
      {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}

      {unavailable ? (
        <p className={`${adminActionProofErr} mb-6`}>Supabase no está configurado o no responde — la cola de cambios no se puede cargar en este momento.</p>
      ) : pending.length === 0 && decided.length === 0 ? (
        <AdminEmptyState
          title="Sin propuestas de cambio todavía"
          description="Esta cola se llena cuando el intake por PDF/URL encuentra un recurso ya publicado con datos actualizados. Por ahora, ningún recurso existente tiene cambios pendientes."
        />
      ) : (
        <>
          {pendingByResource.size === 0 ? (
            <AdminEmptyState title="Sin cambios pendientes" description="Todas las propuestas ya fueron revisadas — ver el historial más abajo." />
          ) : (
            <div className="space-y-6">
              {[...pendingByResource.entries()].map(([resourceId, proposals]) => {
                const safeCount = proposals.filter(
                  (p) => !isSafetySensitiveField(p.fieldName) && p.proposalSource !== "translation" && p.proposalSource !== "official_spanish",
                ).length;
                return (
                  <section key={resourceId}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/admin/recursos/${resourceId}`} className="text-base font-bold text-[#6B5B2E] underline">
                        {proposals[0].resourceOrganizationName ?? resourceId}
                      </Link>
                      {proposals.length > 1 && safeCount > 1 ? (
                        <form action={acceptAllSafeChangeProposalsAction}>
                          <input type="hidden" name="resourceId" value={resourceId} />
                          <ExecutiveHubConfirmSubmitButton
                            confirmMessage={`¿Aceptar los ${safeCount} cambios no sensibles de este recurso? Los campos sensibles (teléfono de crisis, SMS, dirección, 24/7) y cualquier propuesta de traducción quedarán para revisión individual.`}
                            className={`${adminCtaChip} ${adminCtaChipCompact} border-[#C9B46A]/80 bg-[#FFFCF7] text-[#5C4E2E]`}
                          >
                            Aceptar cambios seguros ({safeCount})
                          </ExecutiveHubConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                    <div className="space-y-3">
                      {proposals.map((p) => (
                        <ProposalRow key={p.id} p={p} />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {decided.length > 0 ? (
            <section className="mt-10">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Historial ({decided.length})</h2>
              <div className="space-y-2">
                {decided.slice(0, 50).map((p) => (
                  <div key={p.id} className={`${adminCardBase} flex flex-wrap items-center justify-between gap-2 p-3`}>
                    <div className="min-w-0 text-xs text-[#5C5346]">
                      <span className="font-semibold text-[#1E1810]">{p.resourceOrganizationName ?? p.resourceId}</span> · {p.fieldName}:{" "}
                      <span className="line-through">{shortValue(p.oldValue)}</span> → {shortValue(p.proposedValue)}
                    </div>
                    <span className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_BADGE[p.status] ?? ""}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
