import "server-only";

/**
 * Existing Resource Official-Spanish Bridge — Gate ES-9D. Lets an EXISTING, already-verified,
 * non-high-risk resource enter the official-Spanish review pipeline for the first time. This is
 * the one missing entry point identified by the pre-build audit: spanish_source_type could
 * previously only become official_* during brand-new candidate promotion
 * (recursosUrlCandidateActions.ts) — this function is the equivalent write for a resource that
 * already exists and is already published in English.
 *
 * Never writes community_resources content fields directly — every field goes through the exact
 * same resource_change_proposals row + owner review + explicit accept that every other proposal
 * source already uses (Gate 5's engine, reused, not duplicated). Never AI-generates missing
 * content: `input` fields are supplied by the caller (a human, or a research/discovery pass whose
 * output a human still reviews before anything publishes) — a field the caller omits is simply
 * never proposed, never filled with a guess.
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import { isHighRiskResourceForTranslation, detectResourceFieldChanges } from "../resourceChangeDetection";
import type { UrlCandidateProposal } from "../urlCandidateProposal";
import { dbCreateResourceChangeProposalIfNotPending, dbListPendingResourceChangeProposalsForResource } from "../server/resourceChangeProposalsDb";
import { dbGetCommunityResourceSpanishStatus, dbSetCommunityResourceSpanishStatus } from "../server/resourceSpanishStatusDb";
import { insertVerificationEvent } from "../server/verificationEventsDb";
import { checkOfficialSpanishFieldIntegrity, type OfficialSpanishStructuredFacts } from "./translationIntegrityCheck";

export type OfficialSpanishSourceType = "official_spanish_source" | "official_bilingual_source";

export type PrepareOfficialSpanishInput = {
  sourceUrl: string;
  sourceType: OfficialSpanishSourceType;
  shortDescriptionEs?: string | null;
  detailsEs?: string | null;
  eligibilityEs?: string | null;
  hoursNoteEs?: string | null;
};

export type PrepareOfficialSpanishResult =
  | {
      ok: true;
      createdCount: number;
      skippedDuplicateFields: string[];
      skippedIntegrityFields: string[];
      integrityDetails: Record<string, string[]>;
    }
  | { ok: false; reason: string };

const FIELD_ORDER: { inputKey: keyof PrepareOfficialSpanishInput; proposalField: string; enSource: (r: ResourceRecord) => string | null }[] = [
  { inputKey: "shortDescriptionEs", proposalField: "shortDescriptionEs", enSource: (r) => r.shortDescriptionEn || null },
  { inputKey: "detailsEs", proposalField: "detailsEs", enSource: (r) => r.detailsEn ?? null },
  { inputKey: "eligibilityEs", proposalField: "eligibilityEs", enSource: (r) => r.eligibilityEn ?? null },
  { inputKey: "hoursNoteEs", proposalField: "hoursNoteEs", enSource: (r) => r.contact.hoursNoteEn ?? null },
];

/** Shared with spanishReconciliationQueue.ts's live re-check and the batch approval action — one field->EN-source mapping, never duplicated. */
export function relatedEnTextForOfficialSpanishField(fieldName: string, resource: ResourceRecord): string | null {
  const entry = FIELD_ORDER.find((f) => f.proposalField === fieldName);
  return entry ? entry.enSource(resource) : null;
}

/**
 * Shared builder — also reused by spanishReconciliationQueue.ts to live-recompute integrity for
 * the owner-workspace preview and by the batch approval action's re-check-at-approval-time step,
 * so all three call sites can never drift into checking different fact sets.
 */
export function buildOfficialSpanishStructuredFacts(resource: ResourceRecord): OfficialSpanishStructuredFacts {
  return {
    phone: resource.contact.phone ?? null,
    crisisPhone: resource.contact.crisisPhone ?? null,
    sms: resource.contact.sms ?? null,
    websiteUrl: resource.contact.websiteUrl ?? null,
    applicationUrl: resource.contact.applicationUrl ?? null,
    officialSourceUrl: resource.verification.officialSourceUrl ?? null,
    email: resource.contact.email ?? null,
    addressLine1: resource.contact.address?.line1 ?? null,
    addressZip: resource.contact.address?.zip ?? null,
    ageMin: resource.ageMin ?? null,
    ageMax: resource.ageMax ?? null,
    is24Hours: resource.contact.is24Hours ?? null,
  };
}

/**
 * Prepares official-Spanish field proposals for one existing resource. Requirements below are
 * checked, in order, BEFORE any write — the function returns { ok: false, reason } on the first
 * one that fails and creates nothing. Every requirement here mirrors the pre-build plan's Gate 4
 * list exactly; do not relax any of them without a new PM gate.
 */
export async function prepareOfficialSpanishProposals(
  resource: ResourceRecord,
  actorEmail: string | null,
  input: PrepareOfficialSpanishInput,
): Promise<PrepareOfficialSpanishResult> {
  // effective verification = verified (the fact, not the claim — same staleness-aware check every
  // other write path in this system already uses)
  const effectiveStatus = resolveEffectiveVerificationStatus(resource.verification);
  if (effectiveStatus !== "verified") {
    return { ok: false, reason: "El recurso debe estar verificado (con verificación vigente) antes de adjuntar una fuente oficial en español." };
  }

  // resource is NOT high-risk, using the REAL helper — never a proxy field like urgencyLevel.
  const highRisk = isHighRiskResourceForTranslation({
    primaryCategory: resource.primaryCategory,
    crisisPhone: resource.contact.crisisPhone,
    is24Hours: resource.contact.is24Hours,
  });
  if (highRisk) {
    return { ok: false, reason: "Este recurso es de alto riesgo — la fuente oficial en español no puede prepararse aquí. Requiere el flujo de alto riesgo dedicado." };
  }

  // source URL present + source type valid
  const sourceUrl = input.sourceUrl.trim();
  if (!sourceUrl) {
    return { ok: false, reason: "Falta la URL de la fuente oficial en español." };
  }
  if (input.sourceType !== "official_spanish_source" && input.sourceType !== "official_bilingual_source") {
    return { ok: false, reason: "Tipo de fuente inválido." };
  }

  // spanish_status is not already official_spanish — never silently overwrite published official Spanish.
  const spanishRow = await dbGetCommunityResourceSpanishStatus(resource.id);
  if (spanishRow?.spanishStatus === "official_spanish") {
    return {
      ok: false,
      reason: "Este recurso ya tiene español oficial publicado — usa el flujo de reverificación, no vuelvas a adjuntar una fuente desde cero.",
    };
  }

  // at least one supported ES field supplied
  const suppliedFields = FIELD_ORDER.filter((f) => {
    const v = input[f.inputKey];
    return typeof v === "string" && v.trim().length > 0;
  });
  if (suppliedFields.length === 0) {
    return { ok: false, reason: "Debes proporcionar al menos un campo en español respaldado por la fuente oficial." };
  }

  // no conflicting translation proposal AND no conflicting official_spanish proposal on the same field
  const existingPending = await dbListPendingResourceChangeProposalsForResource(resource.id);
  const conflictingFields = suppliedFields.filter((f) =>
    existingPending.some((p) => p.fieldName === f.proposalField && (p.proposalSource === "translation" || p.proposalSource === "official_spanish")),
  );
  if (conflictingFields.length > 0) {
    return {
      ok: false,
      reason: `Ya existe una propuesta pendiente (traducción u oficial) para: ${conflictingFields.map((f) => f.proposalField).join(", ")}. Revísala antes de adjuntar una nueva fuente.`,
    };
  }

  // field integrity passes — checked against the resource's own structured facts, never against
  // English prose alone (checkFieldTranslationIntegrity's model does not apply here).
  const facts = buildOfficialSpanishStructuredFacts(resource);
  const skippedIntegrityFields: string[] = [];
  const integrityDetails: Record<string, string[]> = {};
  const passingFields: { proposalField: string; value: string }[] = [];
  for (const f of suppliedFields) {
    const value = String(input[f.inputKey]).trim();
    const integrity = checkOfficialSpanishFieldIntegrity({ ...facts, relatedVerifiedEnText: f.enSource(resource) }, value);
    if (!integrity.ok) {
      skippedIntegrityFields.push(f.proposalField);
      integrityDetails[f.proposalField] = integrity.invented;
      continue; // reject this field only — never auto-correct, never block the others
    }
    passingFields.push({ proposalField: f.proposalField, value });
  }

  if (passingFields.length === 0) {
    return {
      ok: false,
      reason: `Ningún campo pasó la verificación de integridad: ${skippedIntegrityFields.join(", ")}. No se creó ninguna propuesta.`,
    };
  }

  // Build old/proposed pairs the same way generateSpanishTranslationProposals does — reuse
  // detectResourceFieldChanges, never a second diff engine.
  const proposalPartial: Record<string, string> = {};
  for (const f of passingFields) proposalPartial[f.proposalField] = f.value;
  const changes = detectResourceFieldChanges(proposalPartial as unknown as UrlCandidateProposal, resource);

  let createdCount = 0;
  const skippedDuplicateFields: string[] = [];
  for (const change of changes) {
    const result = await dbCreateResourceChangeProposalIfNotPending({
      resourceId: resource.id,
      sourceIntakeJobId: null,
      fieldName: change.field,
      oldValue: change.oldValue,
      proposedValue: change.proposedValue,
      proposalSource: "official_spanish",
    });
    if (result.ok && result.skippedDuplicate) skippedDuplicateFields.push(change.field);
    else if (result.ok) createdCount++;
  }

  if (createdCount > 0) {
    // Place the resource into the pending official-source state — spanish_status stays
    // needs_translation_review (never official_spanish here; only the dedicated confirmation core
    // can set that), spanish_source_type becomes the truthful provenance. This is the exact write
    // candidate promotion already makes at ES-5G, now reused for an existing resource.
    await dbSetCommunityResourceSpanishStatus(resource.id, "needs_translation_review", input.sourceType);

    await insertVerificationEvent({
      resourceId: resource.id,
      eventType: "evidence_recorded",
      actorEmail,
      sourceUrl,
      sourceType: input.sourceType,
      notes: `Fuente oficial en español adjuntada — ${createdCount} campo(s) propuesto(s)${skippedIntegrityFields.length > 0 ? `; excluidos por integridad: ${skippedIntegrityFields.join(", ")}` : ""}${skippedDuplicateFields.length > 0 ? `; ya pendientes: ${skippedDuplicateFields.join(", ")}` : ""}.`,
    });
  }

  return { ok: true, createdCount, skippedDuplicateFields, skippedIntegrityFields, integrityDetails };
}
