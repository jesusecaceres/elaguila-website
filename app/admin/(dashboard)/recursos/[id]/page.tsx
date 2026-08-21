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
import { dbGetCommunityResourceSpanishStatus } from "@/app/lib/recursos/intake/server/resourceSpanishStatusDb";
import { isHighRiskResourceForTranslation } from "@/app/lib/recursos/intake/resourceChangeDetection";
import { generateSpanishTranslationAction, regenerateSpanishTranslationAction, markSpanishReviewedAction } from "@/app/admin/recursosTranslationActions";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";

export const dynamic = "force-dynamic";

const SPANISH_STATUS_LABEL: Record<string, string> = {
  official_spanish: "Español oficial",
  official_english_only: "Solo inglés oficial",
  verified_translation: "Traducción verificada",
  needs_translation_review: "Necesita revisión de traducción",
  not_available: "No disponible",
};
const SPANISH_STATUS_BADGE: Record<string, string> = {
  official_spanish: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  verified_translation: "border border-emerald-200 bg-emerald-50 text-emerald-950",
  needs_translation_review: "border border-amber-200 bg-amber-50 text-amber-950",
  official_english_only: "border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)]",
  not_available: "border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[color:var(--lx-text)]",
};
const SPANISH_SOURCE_TYPE_LABEL: Record<string, string> = {
  official_spanish_source: "Fuente oficial en español",
  official_bilingual_source: "Fuente oficial bilingüe",
  ai_translation_reviewed: "Traducción por IA, revisada por humano",
  staff_written: "Escrito por el equipo",
  none: "Ninguno",
};

function BilingualFieldRow({ label, en, es }: { label: string; en: string | null | undefined; es: string | null | undefined }) {
  return (
    <div className="grid gap-3 border-t border-[color:var(--lx-border)]/50 py-3 first:border-0 first:pt-0 sm:grid-cols-2">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{label} · English</p>
        <p className="mt-0.5 text-sm text-[#1E1810]">{en?.trim() || "—"}</p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{label} · Español</p>
        <p className="mt-0.5 text-sm text-[#1E1810]">{es?.trim() || "—"}</p>
      </div>
    </div>
  );
}

export default async function EditRecursoPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ saved?: string; error?: string; reverify_changes?: string }>;
}) {
  const { id } = await props.params;
  const sp = props.searchParams ? await props.searchParams : {};
  const record = await dbGetCommunityResourceById(id);
  if (!record) notFound();

  const [pendingChanges, timeline, spanishStatusRow] = await Promise.all([
    dbListPendingResourceChangeProposalsForResource(id),
    dbListVerificationEventsForResource(id),
    dbGetCommunityResourceSpanishStatus(id),
  ]);

  const pendingTranslations = pendingChanges.filter((p) => p.proposalSource === "translation");
  const translationEvents = timeline.filter((e) => e.sourceType === "translation");
  const spanishStatus = spanishStatusRow?.spanishStatus ?? "not_available";
  const spanishSourceType = spanishStatusRow?.spanishSourceType ?? null;
  const isVerified = resolveEffectiveVerificationStatus(record.verification) === "verified";
  const highRisk = isHighRiskResourceForTranslation({
    primaryCategory: record.primaryCategory,
    crisisPhone: record.contact.crisisPhone,
    is24Hours: record.contact.is24Hours,
  });
  const hasSpanishContent = Boolean(record.shortDescriptionEs?.trim() || record.detailsEs?.trim() || record.eligibilityEs?.trim() || record.contact.hoursNoteEs?.trim());

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

      <section className={`${adminCardBase} mb-8 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C4E2E]">Presentación bilingüe</h2>
          <div className="flex flex-wrap gap-1.5">
            <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${SPANISH_STATUS_BADGE[spanishStatus] ?? ""}`}>
              {SPANISH_STATUS_LABEL[spanishStatus] ?? spanishStatus}
            </span>
            {spanishSourceType ? (
              <span className="inline-flex rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#5C5346]">
                {SPANISH_SOURCE_TYPE_LABEL[spanishSourceType] ?? spanishSourceType}
              </span>
            ) : null}
          </div>
        </div>

        {highRisk ? (
          <p className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-900">
            Alto riesgo — revisar cada traducción individualmente. Este recurso es de ayuda urgente, tiene teléfono de crisis, o está disponible 24/7.
          </p>
        ) : null}

        <p className="mt-3 text-xs text-[#7A7164]">
          Fuente oficial: {record.verification.officialSourceUrl ?? "—"} · Última verificación:{" "}
          {record.verification.lastVerifiedAt ? new Date(record.verification.lastVerifiedAt).toLocaleDateString() : "—"}
        </p>

        {pendingTranslations.length > 0 ? (
          <p className="mt-2 text-xs font-semibold text-amber-900">
            {pendingTranslations.length} propuesta(s) de traducción pendiente(s) —{" "}
            <Link href="/admin/recursos/cambios?tipo=traducciones" className="underline">
              revisar en Cambios
            </Link>
          </p>
        ) : null}

        <div className="mt-4">
          <BilingualFieldRow label="Descripción breve" en={record.shortDescriptionEn} es={record.shortDescriptionEs} />
          <BilingualFieldRow label="Detalles" en={record.detailsEn} es={record.detailsEs} />
          <BilingualFieldRow label="Elegibilidad" en={record.eligibilityEn} es={record.eligibilityEs} />
          <BilingualFieldRow label="Horario" en={record.contact.hoursNoteEn} es={record.contact.hoursNoteEs} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <form action={generateSpanishTranslationAction}>
            <input type="hidden" name="resourceId" value={id} />
            <ExecutiveHubConfirmSubmitButton
              confirmMessage="¿Generar una traducción al español a partir de los hechos verificados en inglés? Esto solo crea propuestas revisables — no publica nada automáticamente."
              className={`${adminBtnPrimary} ${isVerified ? "" : "pointer-events-none opacity-40"}`}
            >
              Generar traducción
            </ExecutiveHubConfirmSubmitButton>
          </form>
          <form action={regenerateSpanishTranslationAction}>
            <input type="hidden" name="resourceId" value={id} />
            <ExecutiveHubConfirmSubmitButton
              confirmMessage="¿Regenerar la traducción desde los hechos verificados actuales? Cualquier propuesta de traducción pendiente se rechazará y se reemplazará por un borrador nuevo. El español ya aceptado no se sobrescribe directamente — solo se proponen cambios revisables."
              className={`rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-section)] ${isVerified ? "" : "pointer-events-none opacity-40"}`}
            >
              Regenerar desde hechos verificados
            </ExecutiveHubConfirmSubmitButton>
          </form>
          <form action={markSpanishReviewedAction}>
            <input type="hidden" name="resourceId" value={id} />
            <ExecutiveHubConfirmSubmitButton
              confirmMessage="¿Marcar el español como revisado y aprobado? Esto NO modifica la verificación factual del recurso — solo certifica la presentación en español."
              className={`rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 ${isVerified && pendingTranslations.length === 0 && hasSpanishContent ? "" : "pointer-events-none opacity-40"}`}
            >
              Marcar español revisado
            </ExecutiveHubConfirmSubmitButton>
          </form>
        </div>
        {!isVerified ? <p className="mt-2 text-xs text-[#8B7E70]">El recurso debe estar verificado (con verificación vigente) antes de generar o aprobar una traducción.</p> : null}

        {translationEvents.length > 0 ? (
          <div className="mt-5">
            <VerificationTimeline events={translationEvents} title="Historial de traducción (interno)" compact />
          </div>
        ) : null}
      </section>

      <RecursoForm mode="edit" initial={record} action={updateRecursoAction} />

      <div className="mt-8">
        <VerificationTimeline events={timeline} />
      </div>
    </div>
  );
}
