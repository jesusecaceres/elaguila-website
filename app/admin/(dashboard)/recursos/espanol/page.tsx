import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { AdminPagePurposeCard } from "@/app/admin/_components/AdminPagePurposeCard";
import { AdminEmptyState } from "@/app/admin/_components/AdminEmptyState";
import { AdminStatCard } from "@/app/admin/_components/AdminStatCard";
import { adminActionProofErr, adminActionProofOk, adminBtnPrimary, adminCardBase, adminCtaChip, adminCtaChipCompact } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import {
  loadSpanishReconciliationSnapshot,
  isEligibleForBulkTranslationDraft,
  isEligibleForOfficialSpanishBatchApproval,
  MAX_BULK_SPANISH_DRAFT_BATCH,
  SPANISH_QUEUE_STATUS_LABEL,
  type SpanishReconciliationEntry,
  type BulkSpanishDraftSummary,
  type SpanishQueueStatus,
} from "@/app/lib/recursos/intake/spanishReconciliationQueue";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import { verificationStatusLabel, resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import { confirmOfficialSpanishAction } from "@/app/admin/recursosTranslationActions";
import { generateSpanishDraftsBatchAction } from "@/app/admin/recursosSpanishReconciliationActions";
import { approveOfficialSpanishBatchAction, type OfficialSpanishBatchSummary } from "@/app/admin/recursosOfficialSpanishActions";
import { recursosResourcePath } from "@/app/lib/recursos/recursosUrls";

export const dynamic = "force-dynamic";

const LEONIX_PUBLIC_ORIGIN = "https://www.leonixmedia.com";

type FiltroTab = "todos" | "sin_contenido" | "listo_generar" | "revision_pendiente" | "listo_publicar" | "publicado" | "oficial_es" | "reverificar";
const FILTRO_TABS: { value: FiltroTab; label: string; matches: (s: SpanishQueueStatus) => boolean }[] = [
  { value: "todos", label: "Todos", matches: () => true },
  { value: "sin_contenido", label: "Sin contenido base", matches: (s) => s === "SIN_CONTENIDO_BASE" },
  { value: "listo_generar", label: "Listo para generar", matches: (s) => s === "LISTO_PARA_GENERAR" },
  { value: "revision_pendiente", label: "Revisión pendiente", matches: (s) => s === "REVISION_PENDIENTE" },
  { value: "listo_publicar", label: "Listo para publicar", matches: (s) => s === "LISTO_PARA_PUBLICAR" },
  { value: "publicado", label: "Español publicado", matches: (s) => s === "ESPANOL_PUBLICADO" },
  { value: "oficial_es", label: "Fuente oficial ES", matches: (s) => s === "FUENTE_OFICIAL_ES" },
  { value: "reverificar", label: "Reverificar primero", matches: (s) => s === "REVERIFICAR_PRIMERO" },
];

const QUEUE_STATUS_BADGE: Record<SpanishQueueStatus, string> = {
  SIN_CONTENIDO_BASE: "border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[#7A7164]",
  LISTO_PARA_GENERAR: "border border-[#C9B46A]/80 bg-[#FFFCF7] text-[#5C4E2E]",
  REVISION_PENDIENTE: "border border-amber-200 bg-amber-50 text-amber-950",
  LISTO_PARA_PUBLICAR: "border border-sky-200 bg-sky-50 text-sky-950",
  ESPANOL_PUBLICADO: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  FUENTE_OFICIAL_ES: "border border-sky-300 bg-sky-50 text-sky-950",
  REVERIFICAR_PRIMERO: "border border-rose-200 bg-rose-50 text-rose-900",
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  official_spanish_source: "Fuente oficial en español",
  official_bilingual_source: "Fuente oficial bilingüe",
  ai_translation_reviewed: "Traducción IA revisada",
  staff_written: "Escrito por el equipo",
  none: "Ninguna",
};

const ES_FIELD_LABEL: Record<string, string> = {
  shortDescriptionEs: "Descripción corta",
  detailsEs: "Detalles",
  eligibilityEs: "Elegibilidad",
  hoursNoteEs: "Horario",
};

/** Existing Resource Official-Spanish Bridge — the resource's own EN value for the paired preview, matching prepareOfficialSpanishProposals.ts's field mapping. */
function currentEnValueFor(resource: SpanishReconciliationEntry["resource"], fieldName: string): string {
  switch (fieldName) {
    case "shortDescriptionEs":
      return resource.shortDescriptionEn || "";
    case "detailsEs":
      return resource.detailsEn || "";
    case "eligibilityEs":
      return resource.eligibilityEn || "";
    case "hoursNoteEs":
      return resource.contact.hoursNoteEn || "";
    default:
      return "";
  }
}

function EntryRow({ entry }: { entry: SpanishReconciliationEntry }) {
  const {
    resource,
    queueStatus,
    spanishStatus,
    spanishSourceType,
    highRisk,
    hasOfficialSourceUrl,
    pendingTranslationCount,
    pendingOfficialSpanish,
    pendingOfficialSpanishClean,
  } = entry;
  const effective = resolveEffectiveVerificationStatus(resource.verification);
  const eligibleForBulk = isEligibleForBulkTranslationDraft(entry);
  const eligibleForOfficialSpanishBatch = isEligibleForOfficialSpanishBatchApproval(entry);
  const publicEsUrl = `${LEONIX_PUBLIC_ORIGIN}${recursosResourcePath(resource.slug)}?lang=es`;

  return (
    <div className={`${adminCardBase} p-4`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-[#1E1810]">{resource.organizationName}</p>
          {resource.programName ? <p className="text-xs text-[#7A7164]">{resource.programName}</p> : null}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-[#7A7164]">
            <span>{getPrimaryCategoryLabel(resource.primaryCategory, "en")}</span>
            <span>·</span>
            <span>{getUrgencyLabel(resource.urgencyLevel, "en")}</span>
            <span>·</span>
            <span>{verificationStatusLabel(effective, "en")}</span>
            <span>·</span>
            <span>{hasOfficialSourceUrl ? "Fuente oficial ✓" : "Sin URL oficial"}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${QUEUE_STATUS_BADGE[queueStatus]}`}>
            {SPANISH_QUEUE_STATUS_LABEL[queueStatus]}
          </span>
          {highRisk ? (
            <span className="inline-flex rounded-md border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-900">
              ALTO RIESGO
            </span>
          ) : null}
          {eligibleForBulk ? (
            <span className="inline-flex rounded-md border border-[#C9B46A]/80 bg-[#FFFCF7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#5C4E2E]">
              Elegible para lote
            </span>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-[11px] text-[#8B7E70]">
        spanish_status: <span className="font-semibold">{spanishStatus}</span> · spanish_source_type:{" "}
        <span className="font-semibold">{spanishSourceType ? (SOURCE_TYPE_LABEL[spanishSourceType] ?? spanishSourceType) : "—"}</span>
        {pendingTranslationCount > 0 ? <> · {pendingTranslationCount} propuesta(s) de traducción pendiente(s)</> : null}
      </p>

      {queueStatus === "FUENTE_OFICIAL_ES" && pendingOfficialSpanish.length > 0 ? (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-sky-950">
              {pendingOfficialSpanish.length} campo(s) propuesto(s) desde fuente oficial
            </p>
            <span
              className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                pendingOfficialSpanishClean ? "border border-emerald-300 bg-emerald-50 text-emerald-900" : "border border-rose-300 bg-rose-50 text-rose-900"
              }`}
            >
              {pendingOfficialSpanishClean ? "Integridad: PASS" : "Integridad: HOLD"}
            </span>
          </div>
          {hasOfficialSourceUrl ? (
            <p className="mt-1 text-[11px] text-[#5C5346]">
              Fuente:{" "}
              <a href={resource.verification.officialSourceUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="underline">
                {resource.verification.officialSourceUrl}
              </a>
            </p>
          ) : null}
          <div className="mt-2 space-y-3">
            {pendingOfficialSpanish.map((p) => (
              <div key={p.id} className="rounded-md border border-[color:var(--lx-border)] bg-white p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{ES_FIELD_LABEL[p.fieldName] ?? p.fieldName}</p>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#A79A87]">EN (actual)</p>
                    <p className="text-xs text-[#5C5346]">{currentEnValueFor(resource, p.fieldName) || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wide text-[#A79A87]">ES (propuesto, fuente oficial)</p>
                    <p className="text-xs font-semibold text-[#1E1810]">{p.proposedValue == null ? "—" : String(p.proposedValue)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/admin/recursos/${resource.id}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
          Ver recurso
        </Link>
        {eligibleForBulk ? (
          <label className={`${adminCtaChip} ${adminCtaChipCompact} flex cursor-pointer items-center gap-1.5 border-[#C9B46A]/80 bg-[#FFFCF7]`}>
            <input type="checkbox" name="resourceId" value={resource.id} form="bulk-draft-form" className="h-3.5 w-3.5" />
            Incluir en lote (traducción)
          </label>
        ) : null}
        {eligibleForOfficialSpanishBatch ? (
          <label className={`${adminCtaChip} ${adminCtaChipCompact} flex cursor-pointer items-center gap-1.5 border-emerald-700/80 bg-emerald-50`}>
            <input type="checkbox" name="resourceId" value={resource.id} form="bulk-official-spanish-form" className="h-3.5 w-3.5" defaultChecked />
            Incluir en lote (español oficial)
          </label>
        ) : null}

        {queueStatus === "SIN_CONTENIDO_BASE" ? (
          <Link href={`/admin/recursos/${resource.id}#recurso-form`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
            Completar recurso
          </Link>
        ) : null}
        {queueStatus === "LISTO_PARA_GENERAR" ? (
          <Link href={`/admin/recursos/${resource.id}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
            Generar
          </Link>
        ) : null}
        {queueStatus === "REVISION_PENDIENTE" ? (
          <Link href={`/admin/recursos/${resource.id}`} className={`${adminCtaChip} ${adminCtaChipCompact} border-amber-300 bg-amber-50 text-amber-950`}>
            Revisar
          </Link>
        ) : null}
        {queueStatus === "LISTO_PARA_PUBLICAR" ? (
          <Link href={`/admin/recursos/${resource.id}`} className={`${adminCtaChip} ${adminCtaChipCompact} border-sky-300 bg-sky-50 text-sky-950`}>
            Publicar
          </Link>
        ) : null}
        {queueStatus === "ESPANOL_PUBLICADO" ? (
          <a href={publicEsUrl} target="_blank" rel="noopener noreferrer" className={`${adminCtaChip} ${adminCtaChipCompact}`}>
            Ver publicación ES ↗
          </a>
        ) : null}
        {queueStatus === "FUENTE_OFICIAL_ES" ? (
          <form action={confirmOfficialSpanishAction}>
            <input type="hidden" name="resourceId" value={resource.id} />
            <ExecutiveHubConfirmSubmitButton
              confirmMessage="¿Confirmar que el español de este recurso proviene de una fuente oficial? Esto marca spanish_status como official_spanish."
              className={`${adminCtaChip} ${adminCtaChipCompact} border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800`}
            >
              Confirmar español oficial
            </ExecutiveHubConfirmSubmitButton>
          </form>
        ) : null}
        {queueStatus === "REVERIFICAR_PRIMERO" ? (
          <Link href={`/admin/recursos/${resource.id}`} className={`${adminCtaChip} ${adminCtaChipCompact} border-rose-700 bg-rose-50 text-rose-900`}>
            Reverificar
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function RecursosEspanolPage(props: {
  searchParams?: Promise<{ tab?: string; error?: string; batch_summary?: string; oficial_batch_summary?: string }>;
}) {
  await requireLeonixAdminPermission("can_manage_recursos");
  const sp = props.searchParams ? await props.searchParams : {};
  const tab: FiltroTab = FILTRO_TABS.some((t) => t.value === sp.tab) ? (sp.tab as FiltroTab) : "todos";

  const snapshot = await loadSpanishReconciliationSnapshot();

  const counts = {
    listosParaTraducir: snapshot.entries.filter((e) => e.queueStatus === "LISTO_PARA_GENERAR").length,
    sinContenidoBase: snapshot.entries.filter((e) => e.queueStatus === "SIN_CONTENIDO_BASE").length,
    pendientesRevision: snapshot.entries.filter((e) => e.queueStatus === "REVISION_PENDIENTE" || e.queueStatus === "LISTO_PARA_PUBLICAR").length,
    listosPublicar: snapshot.entries.filter((e) => e.queueStatus === "LISTO_PARA_PUBLICAR").length,
    publicado: snapshot.entries.filter((e) => e.queueStatus === "ESPANOL_PUBLICADO").length,
    fuenteOficial: snapshot.entries.filter((e) => e.queueStatus === "FUENTE_OFICIAL_ES").length,
    reverificar: snapshot.entries.filter((e) => e.queueStatus === "REVERIFICAR_PRIMERO").length,
  };
  const eligibleForBatch = snapshot.entries.filter(isEligibleForBulkTranslationDraft);
  const eligibleForOfficialSpanishBatch = snapshot.entries.filter(isEligibleForOfficialSpanishBatchApproval);

  const activeTab = FILTRO_TABS.find((t) => t.value === tab) ?? FILTRO_TABS[0];
  const rows = snapshot.entries.filter((e) => activeTab.matches(e.queueStatus));

  let batchSummary: BulkSpanishDraftSummary | null = null;
  if (sp.batch_summary) {
    try {
      batchSummary = JSON.parse(sp.batch_summary) as BulkSpanishDraftSummary;
    } catch {
      batchSummary = null;
    }
  }

  let oficialBatchSummary: OfficialSpanishBatchSummary | null = null;
  if (sp.oficial_batch_summary) {
    try {
      oficialBatchSummary = JSON.parse(sp.oficial_batch_summary) as OfficialSpanishBatchSummary;
    } catch {
      oficialBatchSummary = null;
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Reconciliación de español"
        subtitle="Clasificación en vivo de la disponibilidad de español para los 65 recursos verificados. Ninguna clasificación se guarda — se calcula en cada carga a partir de spanish_status, la frescura de verificación, el contenido base en inglés y las propuestas pendientes."
        rightSlot={
          <Link href="/admin/recursos" className={adminBtnPrimary}>
            ← Volver al panel
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Cola de reconciliación de español (operacional)"
        purpose="Clasifica cada recurso verificado en uno de siete estados operativos y siempre sugiere la acción correcta: completar contenido base, generar, revisar, publicar, confirmar español oficial o reverificar."
        dataSource="Deriva de community_resources (incluye spanish_status/spanish_source_type) + resource_change_proposals pendientes (translation y official_spanish). Reutiliza generateSpanishTranslationProposals() y prepareOfficialSpanishProposals() — no existe un segundo motor de revisión."
        status="real"
        safeActions={[
          "Generar traducción (individual o en lote de hasta 20)",
          "Revisar y aprobar en el flujo de una página",
          "Confirmar español oficial (individual o en lote de hasta 20)",
          "Ver recurso / reverificar fuente",
        ]}
        nextGate="Ninguno planeado — el flujo de revisión de una página es la forma habitual de trabajar."
        warningNote="Esta cola nunca aprueba ni publica nada automáticamente. Los recursos sin contenido base en inglés nunca se cuentan como listos para traducir, la fuente oficial en español siempre tiene prioridad sobre la traducción por IA, y los recursos de alto riesgo nunca aparecen en ningún lote de aprobación."
      />

      <section className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Métricas de español</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#7A7164]">
          Cada número se calcula en el momento de cargar esta página. Si una consulta falla, se muestra &quot;no disponible&quot; en vez de un cero falso.
        </p>
        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
          <AdminStatCard title="Listos para traducir" value={snapshot.unavailable ? "—" : counts.listosParaTraducir} />
          <AdminStatCard title="Sin contenido base EN" value={snapshot.unavailable ? "—" : counts.sinContenidoBase} accent={!snapshot.unavailable && counts.sinContenidoBase > 0 ? "amber" : "default"} />
          <AdminStatCard title="Pendientes de revisión" value={snapshot.unavailable ? "—" : counts.pendientesRevision} accent={!snapshot.unavailable && counts.pendientesRevision > 0 ? "amber" : "default"} />
          <AdminStatCard title="Listos para publicar" value={snapshot.unavailable ? "—" : counts.listosPublicar} />
          <AdminStatCard title="Español publicado" value={snapshot.unavailable ? "—" : counts.publicado} />
          <AdminStatCard title="Fuente oficial ES" value={snapshot.unavailable ? "—" : counts.fuenteOficial} />
          <AdminStatCard title="Reverificación requerida" value={snapshot.unavailable ? "—" : counts.reverificar} accent={!snapshot.unavailable && counts.reverificar > 0 ? "rose" : "default"} />
        </div>
      </section>

      {snapshot.unavailable ? (
        <p className={`${adminActionProofErr} mb-6`}>Supabase no está configurado o no responde — la cola de reconciliación no se puede cargar.</p>
      ) : (
        <>
          {sp.error ? <p className={`${adminActionProofErr} mb-6`}>{sp.error}</p> : null}
          {batchSummary ? (
            <p className={`${adminActionProofOk} mb-6`}>
              Lote procesado: {batchSummary.processed}/{batchSummary.requested} solicitado(s) · {batchSummary.proposalsCreated} propuesta(s) creada(s) ·{" "}
              {batchSummary.skippedPending} omitido(s) por traducción pendiente · {batchSummary.skippedNotVerified} omitido(s) por no elegible ·{" "}
              {batchSummary.failed} fallido(s). Nada se aprobó ni se publicó automáticamente.
            </p>
          ) : null}

          {oficialBatchSummary ? (
            <div className={`${adminActionProofOk} mb-6`}>
              <p>
                Lote de español oficial procesado: {oficialBatchSummary.processed}/{oficialBatchSummary.requested} solicitado(s) ·{" "}
                <span className="font-bold">{oficialBatchSummary.published} publicado(s)</span> · {oficialBatchSummary.skipped.length} omitido(s) ·{" "}
                {oficialBatchSummary.failed.length} fallido(s).
              </p>
              {oficialBatchSummary.skipped.length > 0 || oficialBatchSummary.failed.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs">
                  {oficialBatchSummary.skipped.map((s) => (
                    <li key={`skipped-${s.resourceId}`}>
                      Omitido — <span className="font-semibold">{s.organizationName}</span>: {s.reason}
                    </li>
                  ))}
                  {oficialBatchSummary.failed.map((f) => (
                    <li key={`failed-${f.resourceId}`}>
                      Fallido — <span className="font-semibold">{f.organizationName}</span>: {f.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          <form id="bulk-draft-form" action={generateSpanishDraftsBatchAction} className={`${adminCardBase} mb-6 flex flex-wrap items-center justify-between gap-3 p-4`}>
            <div className="text-xs text-[#5C5346]">
              <p>
                <span className="font-bold">{eligibleForBatch.length}</span> recurso(s) elegible(s) ahora mismo para un borrador de traducción (máximo{" "}
                {MAX_BULK_SPANISH_DRAFT_BATCH} por lote). Los recursos sin contenido base en inglés nunca se incluyen.
              </p>
              <p className="mt-0.5 text-[#8B7E70]">
                Marca casillas individuales arriba para elegir recursos específicos, o deja todo sin marcar para procesar los primeros {MAX_BULK_SPANISH_DRAFT_BATCH}{" "}
                elegibles automáticamente.
              </p>
            </div>
            <ExecutiveHubConfirmSubmitButton
              confirmMessage={`¿Generar borradores ES para hasta ${MAX_BULK_SPANISH_DRAFT_BATCH} recursos elegibles? Esto solo crea propuestas pendientes — ninguna se aprueba ni se publica automáticamente.`}
              className={`${adminCtaChip} border-[#7A1E2C] bg-[#7A1E2C] text-white hover:bg-[#6B1A26]`}
            >
              Generar borradores ES
            </ExecutiveHubConfirmSubmitButton>
          </form>

          <form
            id="bulk-official-spanish-form"
            action={approveOfficialSpanishBatchAction}
            className={`${adminCardBase} mb-6 flex flex-wrap items-center justify-between gap-3 border-emerald-700/40 p-4`}
          >
            <div className="text-xs text-[#5C5346]">
              <p>
                <span className="font-bold">{eligibleForOfficialSpanishBatch.length}</span> recurso(s) listo(s) para confirmar como español oficial (máximo{" "}
                {MAX_BULK_SPANISH_DRAFT_BATCH} por lote). Recursos de alto riesgo nunca se incluyen; cada uno se re-verifica individualmente en el momento de aprobar.
              </p>
              <p className="mt-0.5 text-[#8B7E70]">Las casillas de &quot;español oficial&quot; arriba vienen pre-marcadas — desmárcalas para excluir un recurso de este lote.</p>
            </div>
            <ExecutiveHubConfirmSubmitButton
              confirmMessage={`¿Aprobar español oficial y publicar para hasta ${MAX_BULK_SPANISH_DRAFT_BATCH} recursos marcados? Cada recurso se re-verifica individualmente; uno que falle no bloquea a los demás.`}
              className={`${adminCtaChip} border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800`}
            >
              Aprobar español oficial y publicar
            </ExecutiveHubConfirmSubmitButton>
          </form>

          <div className="mb-6 flex flex-wrap gap-2">
            {FILTRO_TABS.map((t) => (
              <Link
                key={t.value}
                href={t.value === "todos" ? "/admin/recursos/espanol" : `/admin/recursos/espanol?tab=${t.value}`}
                className={`${adminCtaChip} ${adminCtaChipCompact} ${tab === t.value ? "border-[#7A1E2C] bg-[#7A1E2C] text-white hover:bg-[#6B1A26]" : ""}`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {rows.length === 0 ? (
            <AdminEmptyState title="Sin recursos en esta categoría" description="Ningún recurso verificado cae en esta clasificación en este momento." />
          ) : (
            <div className="space-y-3">
              {rows.map((entry) => (
                <EntryRow key={entry.resource.id} entry={entry} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
