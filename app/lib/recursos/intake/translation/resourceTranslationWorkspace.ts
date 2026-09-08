/**
 * Owner Spanish Translation Review Workspace — pure composer. Builds the single per-resource
 * model that drives the 3-step Generar → Revisar y editar → Aprobar y publicar workflow on
 * /admin/recursos/[id]. No DB access here (fed already-fetched rows) — the actual persistence
 * (dbCreateResourceChangeProposalIfNotPending, dbUpdatePendingResourceChangeProposalValue,
 * dbUpdateSingleResourceField, dbSetCommunityResourceSpanishStatus) stays exactly where it
 * already lives; this module only decides what to SHOW and whether the final-approval CTA is
 * allowed to fire. Reuses checkFieldTranslationIntegrity (ES-3D) unchanged — never a second
 * integrity checker.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import type { SpanishStatus, SpanishSourceType } from "../server/resourceSpanishStatusDb";
import type { ResourceChangeProposalRow } from "../server/resourceChangeProposalsDb";
import { checkFieldTranslationIntegrity } from "./translationIntegrityCheck";
import { hasTranslatableBaseContent } from "../spanishReconciliationQueue";

export type TranslationFieldKey = "shortDescription" | "details" | "eligibility" | "hoursNote";

export type TranslationFieldStatus = "sin_contenido_base" | "pendiente_de_revision" | "requiere_atencion" | "publicado" | "no_generado";

export type TranslationFieldModel = {
  key: TranslationFieldKey;
  label: string;
  fieldName: string; // e.g. "shortDescriptionEs" — the resource_change_proposals field_name / WRITABLE_FIELD_COLUMNS key
  enValue: string | null;
  esApprovedValue: string | null;
  pendingProposal: ResourceChangeProposalRow | null;
  proposedValue: string | null;
  status: TranslationFieldStatus;
  integrityInvented: string[] | null;
};

export type TranslationWorkspacePath = "ai_translation" | "official_spanish" | "no_base_content";

export type TranslationWorkspaceModel = {
  path: TranslationWorkspacePath;
  fields: TranslationFieldModel[];
  hasBaseContent: boolean;
  pendingTranslationCount: number;
  allPendingFieldsClean: boolean;
  readyForFinalApproval: boolean;
  isPublished: boolean;
  /** 1 = Generar, 2 = Revisar y editar, 3 = Aprobar y publicar (also the "done" step once published). */
  activeStep: 1 | 2 | 3;
};

const FIELD_DEFS: { key: TranslationFieldKey; label: string; fieldName: string; en: (r: ResourceRecord) => string | null; es: (r: ResourceRecord) => string | null }[] = [
  { key: "shortDescription", label: "Descripción breve", fieldName: "shortDescriptionEs", en: (r) => r.shortDescriptionEn, es: (r) => r.shortDescriptionEs },
  { key: "details", label: "Detalles", fieldName: "detailsEs", en: (r) => r.detailsEn ?? null, es: (r) => r.detailsEs ?? null },
  { key: "eligibility", label: "Elegibilidad", fieldName: "eligibilityEs", en: (r) => r.eligibilityEn ?? null, es: (r) => r.eligibilityEs ?? null },
  { key: "hoursNote", label: "Horario", fieldName: "hoursNoteEs", en: (r) => r.contact.hoursNoteEn ?? null, es: (r) => r.contact.hoursNoteEs ?? null },
];

const TRUSTED_SPANISH_STATUSES: ReadonlySet<SpanishStatus> = new Set(["official_spanish", "verified_translation"]);

export function buildTranslationWorkspaceModel(
  resource: ResourceRecord,
  spanishStatus: SpanishStatus,
  spanishSourceType: SpanishSourceType | null,
  pendingProposals: ResourceChangeProposalRow[],
): TranslationWorkspaceModel {
  const isOfficialSourceEvidence = spanishSourceType === "official_spanish_source" || spanishSourceType === "official_bilingual_source";
  const isPublished = TRUSTED_SPANISH_STATUSES.has(spanishStatus);
  const hasBaseContent = hasTranslatableBaseContent(resource);
  const pendingByFieldName = new Map(pendingProposals.filter((p) => p.proposalSource === "translation").map((p) => [p.fieldName, p]));

  const fields: TranslationFieldModel[] = FIELD_DEFS.map((def) => {
    const enValue = def.en(resource);
    const esApprovedValue = def.es(resource);
    const pendingProposal = pendingByFieldName.get(def.fieldName) ?? null;
    const proposedValue = pendingProposal ? (pendingProposal.proposedValue == null ? null : String(pendingProposal.proposedValue)) : null;

    let status: TranslationFieldStatus;
    let integrityInvented: string[] | null = null;
    if (!enValue?.trim()) {
      status = "sin_contenido_base";
    } else if (pendingProposal) {
      const integrity = checkFieldTranslationIntegrity(enValue, proposedValue);
      if (!integrity.ok) {
        status = "requiere_atencion";
        integrityInvented = integrity.invented;
      } else {
        status = "pendiente_de_revision";
      }
    } else if (isPublished && esApprovedValue?.trim()) {
      status = "publicado";
    } else {
      status = "no_generado"; // has EN content, no proposal yet, not published — only relevant before Step 1's CTA is used
    }

    return { key: def.key, label: def.label, fieldName: def.fieldName, enValue, esApprovedValue, pendingProposal, proposedValue, status, integrityInvented };
  });

  const pendingTranslationCount = fields.filter((f) => f.pendingProposal !== null).length;
  const allPendingFieldsClean = fields.every((f) => f.pendingProposal === null || f.status === "pendiente_de_revision" || f.status === "publicado");
  const readyForFinalApproval = pendingTranslationCount > 0 && allPendingFieldsClean;

  const path: TranslationWorkspacePath = isOfficialSourceEvidence ? "official_spanish" : hasBaseContent ? "ai_translation" : "no_base_content";

  let activeStep: 1 | 2 | 3;
  if (isPublished) activeStep = 3;
  else if (pendingTranslationCount > 0) activeStep = readyForFinalApproval ? 3 : 2;
  else activeStep = 1;

  return { path, fields, hasBaseContent, pendingTranslationCount, allPendingFieldsClean, readyForFinalApproval, isPublished, activeStep };
}
