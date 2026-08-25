import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminActionProofErr, adminActionProofOk, adminBtnPrimary, adminCardBase, adminCtaChip, adminCtaChipCompact, adminCtaChipSecondary } from "@/app/admin/_components/adminTheme";
import { ExecutiveHubConfirmSubmitButton } from "@/app/admin/_components/executiveHub/ExecutiveHubConfirmSubmitButton";
import { RecursoForm } from "@/app/admin/_components/recursos/RecursoForm";
import { VerificationTimeline } from "@/app/admin/_components/recursos/VerificationTimeline";
import { dbGetCommunityResourceById } from "@/app/lib/recursos/server/communityResourcesDb";
import { updateRecursoAction, setVerificationStatusAction } from "@/app/admin/recursosActions";
import { dbListPendingResourceChangeProposalsForResource } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbListVerificationEventsForResource } from "@/app/lib/recursos/intake/server/verificationEventsDb";
import { dbGetCommunityResourceSpanishStatus } from "@/app/lib/recursos/intake/server/resourceSpanishStatusDb";
import { isHighRiskResourceForTranslation } from "@/app/lib/recursos/intake/resourceChangeDetection";
import {
  generateSpanishTranslationAction,
  regenerateSpanishTranslationAction,
  confirmOfficialSpanishAction,
  editTranslationProposalAction,
  approveSpanishTranslationAction,
} from "@/app/admin/recursosTranslationActions";
import { attachOfficialSpanishSourceAction } from "@/app/admin/recursosOfficialSpanishActions";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import { buildTranslationWorkspaceModel, type TranslationFieldModel, type TranslationFieldStatus } from "@/app/lib/recursos/intake/translation/resourceTranslationWorkspace";
import { recursosResourcePath } from "@/app/lib/recursos/recursosUrls";

export const dynamic = "force-dynamic";

const LEONIX_PUBLIC_ORIGIN = "https://www.leonixmedia.com";

const FIELD_STATUS_META: Record<TranslationFieldStatus, { label: string; badge: string; border: string; bg: string }> = {
  sin_contenido_base: { label: "Sin contenido base", badge: "border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[#7A7164]", border: "border-[color:var(--lx-border)]", bg: "bg-[color:var(--lx-card)]" },
  no_generado: { label: "Sin contenido base", badge: "border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[#7A7164]", border: "border-[color:var(--lx-border)]", bg: "bg-[color:var(--lx-card)]" },
  pendiente_de_revision: { label: "Pendiente de revisión", badge: "border border-amber-200 bg-amber-50 text-amber-950", border: "border-amber-200", bg: "bg-amber-50/40" },
  requiere_atencion: { label: "Requiere atención", badge: "border border-rose-300 bg-rose-50 text-rose-900", border: "border-rose-300", bg: "bg-rose-50/50" },
  publicado: { label: "Publicado", badge: "border border-emerald-200 bg-emerald-50 text-emerald-950", border: "border-emerald-200", bg: "bg-emerald-50/40" },
};

function StepProgress({ activeStep, isPublished, labels }: { activeStep: 1 | 2 | 3; isPublished: boolean; labels: [string, string, string] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = isPublished || n < activeStep;
        const active = !isPublished && n === activeStep;
        return (
          <span key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] ${
                done ? "border-emerald-700 bg-emerald-700 text-white" : active ? "border-[#7A1E2C] bg-[#7A1E2C] text-white" : "border-[color:var(--lx-border)] bg-[color:var(--lx-card)] text-[#7A7164]"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={active ? "text-[#7A1E2C]" : done ? "text-emerald-800" : "text-[#7A7164]"}>
              {n}. {label}
            </span>
            {i < labels.length - 1 ? <span className="font-normal normal-case text-[#C9B46A]">→</span> : null}
          </span>
        );
      })}
    </div>
  );
}

function ReviewFieldRow({ field, resourceId }: { field: TranslationFieldModel; resourceId: string }) {
  const meta = FIELD_STATUS_META[field.status];
  return (
    <div className={`rounded-lg border ${meta.border} ${meta.bg} p-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5C4E2E]">{field.label}</p>
        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>{meta.label}</span>
      </div>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">English — hechos verificados</p>
          <p className="mt-1 rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-2 text-sm leading-relaxed text-[#1E1810]">
            {field.enValue?.trim() || "Sin contenido en inglés"}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Español — propuesta</p>
          {field.pendingProposal ? (
            <form action={editTranslationProposalAction} className="mt-1">
              <input type="hidden" name="resourceId" value={resourceId} />
              <input type="hidden" name="proposalId" value={field.pendingProposal.id} />
              <textarea
                name="proposedValue"
                defaultValue={field.proposedValue ?? ""}
                rows={3}
                className="w-full rounded-md border border-[color:var(--lx-border)] bg-white p-2 text-sm leading-relaxed text-[#1E1810] focus:border-[#7A1E2C] focus:outline-none"
              />
              {field.integrityInvented && field.integrityInvented.length > 0 ? (
                <p className="mt-1 text-[11px] font-semibold text-rose-900">
                  Conflicto: el texto propuesto contiene algo que no aparece en el inglés verificado ({field.integrityInvented.join(", ")}). Corrígelo antes de aprobar.
                </p>
              ) : null}
              <button type="submit" className={`${adminCtaChip} ${adminCtaChipCompact} mt-1.5`}>
                Guardar edición
              </button>
            </form>
          ) : (
            <p className="mt-1 rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] p-2 text-sm leading-relaxed text-[#7A7164]">
              {field.status === "sin_contenido_base" ? "Sin contenido en inglés — no requiere traducción." : field.esApprovedValue?.trim() || "—"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const hasOfficialSpanishEvidence = spanishSourceType === "official_spanish_source" || spanishSourceType === "official_bilingual_source";
  // ES-5J: official Spanish source content awaiting confirmation must never be nudged toward AI
  // translation — official Spanish wins, no unnecessary AI spend.
  const officialSpanishAwaitingConfirmation = hasOfficialSpanishEvidence && spanishStatus === "needs_translation_review";
  const SPANISH_FIELD_NAMES = new Set(["shortDescriptionEs", "detailsEs", "eligibilityEs", "hoursNoteEs"]);
  const pendingOnSpanishFields = pendingChanges.filter((p) => SPANISH_FIELD_NAMES.has(p.fieldName));
  const canConfirmOfficialSpanish = isVerified && hasOfficialSpanishEvidence && hasSpanishContent && pendingOnSpanishFields.length === 0 && spanishStatus !== "official_spanish";
  // Existing Resource Official-Spanish Bridge (Gate ES-9I): the attach control only ever appears
  // for verified, non-high-risk resources that aren't already publicly-trusted official Spanish —
  // matches prepareOfficialSpanishProposals.ts's own hard requirements exactly, so the UI never
  // offers an action the server would refuse anyway.
  const canAttachOfficialSpanishSource = isVerified && !highRisk && spanishStatus !== "official_spanish";
  const pendingOfficialSpanishOnPage = pendingChanges.filter((p) => p.proposalSource === "official_spanish");

  // Owner Spanish Translation Review Workspace — the single model driving the 3-step workflow.
  const workspace = buildTranslationWorkspaceModel(record, spanishStatus, spanishSourceType, pendingChanges);
  const lastApprovalEvent = [...translationEvents].reverse().find((e) => e.eventType === "evidence_recorded" && e.notes?.startsWith("Aprobación final"));
  const publicEsUrl = `${LEONIX_PUBLIC_ORIGIN}${recursosResourcePath(record.slug)}?lang=es`;
  const publicEnUrl = `${LEONIX_PUBLIC_ORIGIN}${recursosResourcePath(record.slug)}?lang=en`;

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

        {!isVerified ? <p className="mt-2 text-xs text-[#8B7E70]">El recurso debe estar verificado (con verificación vigente) antes de generar o aprobar una traducción.</p> : null}

        {/* ================= FUENTE OFICIAL EN ESPAÑOL (attach) — Gate ES-9I ================= */}
        {canAttachOfficialSpanishSource ? (
          <details className="mt-4 rounded-lg border border-sky-200 bg-sky-50/60 px-4 py-3">
            <summary className="cursor-pointer text-sm font-bold text-sky-950">FUENTE OFICIAL EN ESPAÑOL</summary>
            <p className="mt-2 text-xs text-[#5C5346]">
              Adjunta una fuente oficial en español o bilingüe encontrada para este recurso ya verificado. Esto crea propuestas pendientes — nada se publica aquí. La
              revisión y aprobación (individual o en lote) ocurre en{" "}
              <Link href="/admin/recursos/espanol" className="font-bold underline">
                /admin/recursos/espanol
              </Link>
              .
            </p>
            {pendingOfficialSpanishOnPage.length > 0 ? (
              <p className="mt-2 text-xs font-semibold text-amber-900">
                Ya hay {pendingOfficialSpanishOnPage.length} propuesta(s) de fuente oficial pendiente(s) para este recurso — revísalas antes de adjuntar una fuente
                nueva.
              </p>
            ) : (
              <form action={attachOfficialSpanishSourceAction} className="mt-3 space-y-3">
                <input type="hidden" name="resourceId" value={id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                    URL de la fuente oficial en español
                    <input
                      type="url"
                      name="sourceUrl"
                      required
                      placeholder="https://..."
                      className="mt-1 w-full rounded-md border border-[color:var(--lx-border)] bg-white px-2.5 py-1.5 text-xs font-normal normal-case text-[#1E1810]"
                    />
                  </label>
                  <label className="block text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                    Tipo de fuente
                    <select
                      name="sourceType"
                      required
                      defaultValue="official_spanish_source"
                      className="mt-1 w-full rounded-md border border-[color:var(--lx-border)] bg-white px-2.5 py-1.5 text-xs font-normal normal-case text-[#1E1810]"
                    >
                      <option value="official_spanish_source">Fuente oficial en español</option>
                      <option value="official_bilingual_source">Fuente oficial bilingüe</option>
                    </select>
                  </label>
                </div>

                <div className="space-y-3">
                  {(
                    [
                      { name: "shortDescriptionEs", label: "Descripción", en: record.shortDescriptionEn },
                      { name: "detailsEs", label: "Detalles", en: record.detailsEn },
                      { name: "eligibilityEs", label: "Elegibilidad", en: record.eligibilityEn },
                      { name: "hoursNoteEs", label: "Horario", en: record.contact.hoursNoteEn },
                    ] as const
                  ).map((f) => (
                    <div key={f.name} className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A79A87]">{f.label} (EN, solo lectura)</p>
                        <p className="mt-1 rounded-md border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-2.5 py-1.5 text-xs text-[#5C5346]">
                          {f.en?.trim() || "—"}
                        </p>
                      </div>
                      <label className="block">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#A79A87]">{f.label} (ES, opcional — solo si la fuente oficial lo respalda)</p>
                        {/* Gate ES-QA1: rows 2→6 + min-h + resize-y — a real official-source
                            paragraph (e.g. eligibility or details text) didn't fit in 2 rows,
                            forcing a tiny internal scrollbar to read/edit what was typed. */}
                        <textarea
                          name={f.name}
                          rows={6}
                          className="mt-1 min-h-[9rem] w-full resize-y rounded-md border border-[color:var(--lx-border)] bg-white px-2.5 py-1.5 text-xs text-[#1E1810]"
                        />
                      </label>
                    </div>
                  ))}
                </div>

                <ExecutiveHubConfirmSubmitButton
                  confirmMessage="¿Adjuntar esta fuente oficial en español? Se crean propuestas pendientes para los campos completados — nada se publica todavía."
                  className={`${adminCtaChip} border-sky-700 bg-sky-700 text-white hover:bg-sky-800`}
                >
                  Adjuntar fuente oficial en español
                </ExecutiveHubConfirmSubmitButton>
              </form>
            )}
          </details>
        ) : null}

        {/* ================= PUBLISHED STATE ================= */}
        {workspace.isPublished ? (
          <div className="mt-4">
            <StepProgress activeStep={3} isPublished labels={["Generar", "Revisar", "Publicar"]} />
            <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3">
              <p className="text-sm font-bold text-emerald-950">ESPAÑOL PUBLICADO ✓</p>
              {lastApprovalEvent ? (
                <p className="mt-1 text-xs text-emerald-900">Última aprobación ES: {new Date(lastApprovalEvent.createdAt).toLocaleString()}</p>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a href={publicEsUrl} target="_blank" rel="noopener noreferrer" className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                Ver publicación ES ↗
              </a>
              <a href={publicEnUrl} target="_blank" rel="noopener noreferrer" className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                Ver publicación EN ↗
              </a>
              {!hasOfficialSpanishEvidence ? (
                <a href="#recurso-form" className={`${adminCtaChip} ${adminCtaChipCompact}`}>
                  Editar español
                </a>
              ) : null}
              {!hasOfficialSpanishEvidence ? (
                <form action={regenerateSpanishTranslationAction}>
                  <input type="hidden" name="resourceId" value={id} />
                  <ExecutiveHubConfirmSubmitButton
                    confirmMessage="¿Regenerar la traducción desde los hechos verificados actuales? Se crea un borrador nuevo para revisar — el español ya publicado no se sobrescribe directamente hasta que apruebes el nuevo borrador."
                    className={`${adminCtaChip} ${adminCtaChipCompact}`}
                  >
                    Regenerar desde hechos verificados
                  </ExecutiveHubConfirmSubmitButton>
                </form>
              ) : null}
            </div>

            <div className="mt-4 space-y-2">
              {workspace.fields.map((f) => (
                <div key={f.key} className="grid gap-2 border-t border-[color:var(--lx-border)]/50 pt-2 first:border-0 first:pt-0 sm:grid-cols-2">
                  <p className="text-xs text-[#5C5346]">
                    <span className="font-bold uppercase tracking-wide text-[#7A7164]">{f.label} (EN):</span> {f.enValue?.trim() || "SIN CONTENIDO BASE"}
                  </p>
                  <p className="text-xs text-[#5C5346]">
                    <span className="font-bold uppercase tracking-wide text-[#7A7164]">{f.label} (ES):</span>{" "}
                    {f.status === "sin_contenido_base" ? "SIN CONTENIDO BASE" : f.esApprovedValue?.trim() || "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : workspace.path === "no_base_content" ? (
          /* ================= NO BASE CONTENT ================= */
          <div className="mt-4 rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-3.5">
            <p className="text-sm font-bold text-[#1E1810]">FALTA CONTENIDO BASE EN INGLÉS</p>
            <p className="mt-1 text-xs text-[#7A7164]">No hay texto verificado para traducir todavía.</p>
            <a href="#recurso-form" className={`${adminBtnPrimary} mt-3 inline-flex`}>
              Completar información verificada
            </a>
          </div>
        ) : workspace.path === "official_spanish" ? (
          /* ================= OFFICIAL SPANISH PATH ================= */
          <div className="mt-4">
            <StepProgress
              activeStep={officialSpanishAwaitingConfirmation ? 2 : 3}
              isPublished={false}
              labels={["Fuente oficial ES encontrada", "Revisar español oficial", "Confirmar y publicar"]}
            />
            <p className="mt-3 rounded-lg border border-sky-300 bg-sky-50 px-3 py-2.5 text-xs font-semibold text-sky-950">
              {spanishSourceType === "official_bilingual_source" ? "Fuente oficial bilingüe" : "Fuente oficial en español"} — el contenido en español proviene directamente de la fuente oficial, no de una traducción por IA. El español oficial siempre tiene prioridad sobre generar una traducción.
            </p>
            <div className="mt-4 space-y-2">
              {workspace.fields.map((f) => (
                <div key={f.key} className="grid gap-2 border-t border-[color:var(--lx-border)]/50 pt-2 first:border-0 first:pt-0 sm:grid-cols-2">
                  <p className="text-xs text-[#5C5346]">
                    <span className="font-bold uppercase tracking-wide text-[#7A7164]">{f.label} (EN):</span> {f.enValue?.trim() || "SIN CONTENIDO BASE"}
                  </p>
                  <p className="text-xs text-[#5C5346]">
                    <span className="font-bold uppercase tracking-wide text-[#7A7164]">{f.label} (ES oficial):</span> {f.esApprovedValue?.trim() || "—"}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <form action={confirmOfficialSpanishAction}>
                <input type="hidden" name="resourceId" value={id} />
                <ExecutiveHubConfirmSubmitButton
                  confirmMessage="¿Confirmar este español como oficial? Esto certifica que el contenido en español proviene directamente de la fuente oficial. Esto NO modifica la verificación factual del recurso."
                  className={`${adminBtnPrimary} ${canConfirmOfficialSpanish ? "" : "pointer-events-none opacity-40"}`}
                >
                  3. Confirmar y publicar
                </ExecutiveHubConfirmSubmitButton>
              </form>
            </div>
          </div>
        ) : (
          /* ================= AI TRANSLATION PATH ================= */
          <div className="mt-4">
            <StepProgress activeStep={workspace.activeStep} isPublished={false} labels={["Generar", "Revisar y editar", "Aprobar y publicar"]} />

            {workspace.pendingTranslationCount === 0 ? (
              <div className="mt-4">
                <form action={generateSpanishTranslationAction}>
                  <input type="hidden" name="resourceId" value={id} />
                  <ExecutiveHubConfirmSubmitButton
                    confirmMessage="¿Generar una traducción al español a partir de los hechos verificados en inglés? Esto solo crea propuestas revisables — no publica nada automáticamente."
                    className={`${adminBtnPrimary} ${isVerified ? "" : "pointer-events-none opacity-40"}`}
                  >
                    1. Generar traducción
                  </ExecutiveHubConfirmSubmitButton>
                </form>
              </div>
            ) : (
              <>
                <div className="mt-4 space-y-3">
                  {workspace.fields.map((f) => (
                    <ReviewFieldRow key={f.key} field={f} resourceId={id} />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <form action={regenerateSpanishTranslationAction}>
                    <input type="hidden" name="resourceId" value={id} />
                    <ExecutiveHubConfirmSubmitButton
                      confirmMessage="¿Regenerar la traducción desde los hechos verificados actuales? Cualquier propuesta de traducción pendiente se rechazará y se reemplazará por un borrador nuevo."
                      className={`rounded-lg border border-[color:var(--lx-border)] bg-[color:var(--lx-card)] px-4 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-section)] ${isVerified ? "" : "pointer-events-none opacity-40"}`}
                    >
                      Regenerar desde hechos verificados
                    </ExecutiveHubConfirmSubmitButton>
                  </form>
                  <form action={approveSpanishTranslationAction}>
                    <input type="hidden" name="resourceId" value={id} />
                    <ExecutiveHubConfirmSubmitButton
                      confirmMessage="¿Aprobar esta presentación en español? Se guardarán tus ediciones, se aceptarán las traducciones mostradas y la presentación en español quedará disponible públicamente. Esto NO modifica la verificación factual del recurso."
                      className={`${adminBtnPrimary} ${workspace.readyForFinalApproval ? "" : "pointer-events-none opacity-40"}`}
                    >
                      3. Aprobar español y publicar
                    </ExecutiveHubConfirmSubmitButton>
                  </form>
                </div>
                {!workspace.readyForFinalApproval ? (
                  <p className="mt-2 text-xs text-[#8B7E70]">Resuelve los campos marcados &quot;Requiere atención&quot; antes de aprobar y publicar.</p>
                ) : null}
              </>
            )}
            {officialSpanishAwaitingConfirmation ? (
              <p className="mt-2 text-xs text-[#8B7E70]">Generar traducción está desactivado — este recurso ya tiene contenido de una fuente oficial en español esperando confirmación.</p>
            ) : null}
          </div>
        )}

        <p className="mt-5 text-xs text-[#8B7E70]">
          <Link href="/admin/recursos/cambios?tipo=traducciones" className="underline">
            Ver en Cambios
          </Link>{" "}
          — la cola de cambios sigue siendo el mecanismo de revisión subyacente; este flujo de una página es la forma habitual de trabajar, no un reemplazo.
        </p>

        {translationEvents.length > 0 ? (
          <div className="mt-5">
            <VerificationTimeline events={translationEvents} title="Historial de traducción (interno) — ver historial completo en Cambios" compact />
          </div>
        ) : null}
      </section>

      <div id="recurso-form">
        <RecursoForm mode="edit" initial={record} action={updateRecursoAction} />
      </div>

      <div className="mt-8">
        <VerificationTimeline events={timeline} />
      </div>
    </div>
  );
}
