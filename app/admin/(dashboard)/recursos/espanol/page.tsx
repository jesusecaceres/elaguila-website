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
  MAX_BULK_SPANISH_DRAFT_BATCH,
  type SpanishReconciliationEntry,
  type BulkSpanishDraftSummary,
} from "@/app/lib/recursos/intake/spanishReconciliationQueue";
import { SPANISH_READINESS_LABEL, type SpanishReadinessClassification } from "@/app/lib/recursos/intake/spanishReadinessClassification";
import { getPrimaryCategoryLabel } from "@/app/lib/recursos/categories";
import { getUrgencyLabel } from "@/app/lib/recursos/urgency";
import { verificationStatusLabel, resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import { generateSpanishTranslationAction, regenerateSpanishTranslationAction, confirmOfficialSpanishAction } from "@/app/admin/recursosTranslationActions";
import { generateSpanishDraftsBatchAction } from "@/app/admin/recursosSpanishReconciliationActions";

export const dynamic = "force-dynamic";

type FiltroTab = "todos" | "oficial" | "traduccion" | "necesita_traduccion" | "necesita_revision" | "reverificar";
const FILTRO_TABS: { value: FiltroTab; label: string; matches: (c: SpanishReadinessClassification) => boolean }[] = [
  { value: "todos", label: "Todos", matches: () => true },
  { value: "oficial", label: "Oficial listo", matches: (c) => c === "SPANISH_READY_OFFICIAL" },
  { value: "traduccion", label: "Traducción lista", matches: (c) => c === "SPANISH_READY_VERIFIED_TRANSLATION" },
  { value: "necesita_traduccion", label: "Necesita traducción", matches: (c) => c === "NEEDS_SPANISH_TRANSLATION" },
  { value: "necesita_revision", label: "Necesita revisión", matches: (c) => c === "NEEDS_TRANSLATION_REVIEW" },
  { value: "reverificar", label: "Reverificar fuente", matches: (c) => c === "SOURCE_REVERIFICATION_REQUIRED" },
];

const CLASSIFICATION_BADGE: Record<SpanishReadinessClassification, string> = {
  SPANISH_READY_OFFICIAL: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  SPANISH_READY_VERIFIED_TRANSLATION: "border border-sky-200 bg-sky-50 text-sky-950",
  NEEDS_SPANISH_TRANSLATION: "border border-amber-200 bg-amber-50 text-amber-950",
  NEEDS_TRANSLATION_REVIEW: "border border-orange-200 bg-orange-50 text-orange-950",
  SOURCE_REVERIFICATION_REQUIRED: "border border-rose-200 bg-rose-50 text-rose-900",
};

const SOURCE_TYPE_LABEL: Record<string, string> = {
  official_spanish_source: "Fuente oficial en español",
  official_bilingual_source: "Fuente oficial bilingüe",
  ai_translation_reviewed: "Traducción IA revisada",
  staff_written: "Escrito por el equipo",
  none: "Ninguna",
};

function EntryRow({ entry }: { entry: SpanishReconciliationEntry }) {
  const { resource, classification, spanishStatus, spanishSourceType, highRisk, hasOfficialSourceUrl, pendingTranslationCount, officialSpanishAwaitingConfirmation } = entry;
  const effective = resolveEffectiveVerificationStatus(resource.verification);
  const canGenerate = classification === "NEEDS_SPANISH_TRANSLATION" && !officialSpanishAwaitingConfirmation && pendingTranslationCount === 0;
  const canRegenerate = pendingTranslationCount > 0 || spanishStatus === "verified_translation" || classification === "NEEDS_TRANSLATION_REVIEW";
  const canConfirmOfficial = officialSpanishAwaitingConfirmation && entry.hasExistingSpanishText;
  const canReverify = classification === "SOURCE_REVERIFICATION_REQUIRED";
  const eligibleForBulk = isEligibleForBulkTranslationDraft(entry);

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
          <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CLASSIFICATION_BADGE[classification]}`}>
            {SPANISH_READINESS_LABEL[classification]}
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

      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/admin/recursos/${resource.id}`} className={`${adminCtaChip} ${adminCtaChipCompact}`}>
          Ver recurso
        </Link>
        {canGenerate ? (
          <label className={`${adminCtaChip} ${adminCtaChipCompact} flex cursor-pointer items-center gap-1.5 border-[#C9B46A]/80 bg-[#FFFCF7]`}>
            <input type="checkbox" name="resourceId" value={resource.id} form="bulk-draft-form" className="h-3.5 w-3.5" />
            Incluir en lote
          </label>
        ) : null}
        {canGenerate ? (
          <form action={generateSpanishTranslationAction}>
            <input type="hidden" name="resourceId" value={resource.id} />
            <ExecutiveHubConfirmSubmitButton confirmMessage="¿Generar una traducción propuesta para este recurso? Se crea como propuesta pendiente — no se publica nada automáticamente." className={`${adminCtaChip} ${adminCtaChipCompact}`}>
              Generar traducción
            </ExecutiveHubConfirmSubmitButton>
          </form>
        ) : null}
        {canRegenerate ? (
          <form action={regenerateSpanishTranslationAction}>
            <input type="hidden" name="resourceId" value={resource.id} />
            <ExecutiveHubConfirmSubmitButton confirmMessage="¿Revisar traducción? Esto abre la cola de Cambios filtrada por traducciones para este recurso." className={`${adminCtaChip} ${adminCtaChipCompact}`}>
              Revisar traducción
            </ExecutiveHubConfirmSubmitButton>
          </form>
        ) : null}
        {canConfirmOfficial ? (
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
        {canReverify ? (
          <Link href={`/admin/recursos/${resource.id}`} className={`${adminCtaChip} ${adminCtaChipCompact} border-rose-700 bg-rose-50 text-rose-900`}>
            Reverificar fuente
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export default async function RecursosEspanolPage(props: { searchParams?: Promise<{ tab?: string; error?: string; batch_summary?: string }> }) {
  await requireLeonixAdminPermission("can_manage_recursos");
  const sp = props.searchParams ? await props.searchParams : {};
  const tab: FiltroTab = FILTRO_TABS.some((t) => t.value === sp.tab) ? (sp.tab as FiltroTab) : "todos";

  const snapshot = await loadSpanishReconciliationSnapshot();

  const counts = {
    official: snapshot.entries.filter((e) => e.classification === "SPANISH_READY_OFFICIAL").length,
    translation: snapshot.entries.filter((e) => e.classification === "SPANISH_READY_VERIFIED_TRANSLATION").length,
    needsTranslation: snapshot.entries.filter((e) => e.classification === "NEEDS_SPANISH_TRANSLATION").length,
    needsReview: snapshot.entries.filter((e) => e.classification === "NEEDS_TRANSLATION_REVIEW").length,
    reverify: snapshot.entries.filter((e) => e.classification === "SOURCE_REVERIFICATION_REQUIRED").length,
  };
  const eligibleForBatch = snapshot.entries.filter(isEligibleForBulkTranslationDraft);

  const activeTab = FILTRO_TABS.find((t) => t.value === tab) ?? FILTRO_TABS[0];
  const rows = snapshot.entries.filter((e) => activeTab.matches(e.classification));

  let batchSummary: BulkSpanishDraftSummary | null = null;
  if (sp.batch_summary) {
    try {
      batchSummary = JSON.parse(sp.batch_summary) as BulkSpanishDraftSummary;
    } catch {
      batchSummary = null;
    }
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Recursos"
        title="Reconciliación de español"
        subtitle="Clasificación en vivo de la disponibilidad de español para los 65 recursos verificados. Ninguna clasificación se guarda — se calcula en cada carga a partir de spanish_status, la frescura de verificación y las propuestas pendientes."
        rightSlot={
          <Link href="/admin/recursos" className={adminBtnPrimary}>
            ← Volver al panel
          </Link>
        }
      />

      <AdminPagePurposeCard
        title="Cola de reconciliación de español — Gate ES-6 (operacional)"
        purpose="Clasifica cada recurso verificado en una de cinco categorías operativas y permite generar borradores de traducción en lote o dirigir el trabajo a la acción correcta (confirmar español oficial, revisar traducción, reverificar fuente)."
        dataSource="Deriva de community_resources (incluye spanish_status/spanish_source_type) + resource_change_proposals pendientes. Reutiliza generateSpanishTranslationProposals() — no existe un segundo motor de traducción."
        status="real"
        safeActions={["Generar traducción (individual o en lote de hasta 20)", "Revisar traducción existente", "Confirmar español oficial", "Ver recurso / reverificar fuente"]}
        nextGate="ES-7 — clasificación de entidades múltiples en fuentes PDF."
        warningNote="Esta cola nunca aprueba ni publica nada automáticamente. La fuente oficial en español siempre tiene prioridad sobre la traducción por IA, y los recursos con hechos desactualizados o cambios pendientes quedan excluidos de la generación en lote."
      />

      <section className={`${adminCardBase} mb-6 p-5`}>
        <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Métricas de español</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#7A7164]">
          Cada número se calcula en el momento de cargar esta página. Si una consulta falla, se muestra &quot;no disponible&quot; en vez de un cero falso.
        </p>
        <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <AdminStatCard title="ES oficial listo" value={snapshot.unavailable ? "—" : counts.official} />
          <AdminStatCard title="Traducción verificada lista" value={snapshot.unavailable ? "—" : counts.translation} />
          <AdminStatCard title="Necesita traducción" value={snapshot.unavailable ? "—" : counts.needsTranslation} accent={!snapshot.unavailable && counts.needsTranslation > 0 ? "amber" : "default"} />
          <AdminStatCard title="Necesita revisión de español" value={snapshot.unavailable ? "—" : counts.needsReview} accent={!snapshot.unavailable && counts.needsReview > 0 ? "amber" : "default"} />
          <AdminStatCard title="Fuente necesita reverificación" value={snapshot.unavailable ? "—" : counts.reverify} accent={!snapshot.unavailable && counts.reverify > 0 ? "rose" : "default"} />
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

          <form id="bulk-draft-form" action={generateSpanishDraftsBatchAction} className={`${adminCardBase} mb-6 flex flex-wrap items-center justify-between gap-3 p-4`}>
            <div className="text-xs text-[#5C5346]">
              <p>
                <span className="font-bold">{eligibleForBatch.length}</span> recurso(s) elegible(s) ahora mismo para un borrador de traducción (máximo{" "}
                {MAX_BULK_SPANISH_DRAFT_BATCH} por lote).
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
