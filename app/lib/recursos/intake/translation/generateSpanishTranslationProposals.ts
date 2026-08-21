import "server-only";

/**
 * Recursos Spanish Bridge — Gate ES-3E. Generates resource_change_proposals rows for the 4
 * translatable presentation fields from a resource's own already-verified English facts. Never
 * writes community_resources directly — every proposal goes through the exact same Gate 5
 * accept-flow every other field type already uses. Reuses detectResourceFieldChanges (no second
 * diff engine) by casting a minimal ES-only proposal shape to UrlCandidateProposal, the same
 * technique already used by Gate 7's partner-request converter
 * (app/lib/recursos/intake/convertPartnerRequestToProposals.ts).
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import type { UrlCandidateProposal } from "../urlCandidateProposal";
import { detectResourceFieldChanges } from "../resourceChangeDetection";
import { dbCreateResourceChangeProposalIfNotPending, dbListPendingResourceChangeProposalsForResource } from "../server/resourceChangeProposalsDb";
import { insertVerificationEvent } from "../server/verificationEventsDb";
import { translateVerifiedFacts, translationModelIdentifier, type TranslationOutput } from "./spanishTranslationAdapter";
import { checkFieldTranslationIntegrity } from "./translationIntegrityCheck";

export type GenerateTranslationResult =
  | { ok: true; createdCount: number; skippedIntegrityFields: string[]; alreadyPending: false }
  | { ok: true; createdCount: 0; skippedIntegrityFields: []; alreadyPending: true }
  | { ok: false; reason: string };

const FIELD_ORDER: { key: keyof TranslationOutput; proposalField: string }[] = [
  { key: "shortDescription", proposalField: "shortDescriptionEs" },
  { key: "details", proposalField: "detailsEs" },
  { key: "eligibility", proposalField: "eligibilityEs" },
  { key: "hoursNote", proposalField: "hoursNoteEs" },
];

/**
 * Generates translation proposals for one resource. Requires the resource's EFFECTIVE
 * verification status (staleness-aware — resolveEffectiveVerificationStatus, "the fact, not the
 * claim") to be 'verified'. Cost/double-click guard (ES-3F): if a pending translation proposal
 * already exists for this resource, the AI is never called again — callers wanting a fresh draft
 * must explicitly regenerate (see recursosTranslationActions.ts's regenerateSpanishTranslationAction).
 */
export async function generateSpanishTranslationProposals(resource: ResourceRecord, actorEmail: string | null): Promise<GenerateTranslationResult> {
  const effectiveStatus = resolveEffectiveVerificationStatus(resource.verification);
  if (effectiveStatus !== "verified") {
    return { ok: false, reason: "El recurso debe estar verificado (con verificación vigente) antes de generar una traducción." };
  }

  const existingPending = await dbListPendingResourceChangeProposalsForResource(resource.id);
  if (existingPending.some((p) => p.proposalSource === "translation")) {
    return { ok: true, createdCount: 0, skippedIntegrityFields: [], alreadyPending: true };
  }

  const translated = await translateVerifiedFacts(
    {
      organizationName: resource.organizationName,
      programName: resource.programName ?? null,
      shortDescription: resource.shortDescriptionEn || null,
      details: resource.detailsEn || null,
      eligibility: resource.eligibilityEn || null,
      hoursNote: resource.contact.hoursNoteEn || null,
    },
    "en-to-es",
  );
  if (!translated) return { ok: false, reason: "El traductor no está disponible o no devolvió una respuesta válida." };

  const sourceByKey: Record<string, string | null> = {
    shortDescription: resource.shortDescriptionEn || null,
    details: resource.detailsEn || null,
    eligibility: resource.eligibilityEn || null,
    hoursNote: resource.contact.hoursNoteEn || null,
  };

  const proposalPartial: Record<string, string | null> = {};
  const skippedIntegrityFields: string[] = [];
  for (const { key, proposalField } of FIELD_ORDER) {
    const translatedValue = translated[key];
    if (!translatedValue) continue; // nothing to propose for an empty source field
    const integrity = checkFieldTranslationIntegrity(sourceByKey[key], translatedValue);
    if (!integrity.ok) {
      skippedIntegrityFields.push(proposalField);
      continue; // reject this field's proposal only — never auto-correct, never block the others
    }
    proposalPartial[proposalField] = translatedValue;
  }

  if (Object.keys(proposalPartial).length === 0) {
    if (skippedIntegrityFields.length > 0) {
      return { ok: false, reason: `La traducción propuesta no pasó la verificación de integridad para: ${skippedIntegrityFields.join(", ")}.` };
    }
    return { ok: false, reason: "No hay contenido en inglés verificado para traducir." };
  }

  const changes = detectResourceFieldChanges(proposalPartial as unknown as UrlCandidateProposal, resource);

  let createdCount = 0;
  for (const change of changes) {
    const result = await dbCreateResourceChangeProposalIfNotPending({
      resourceId: resource.id,
      sourceIntakeJobId: null,
      fieldName: change.field,
      oldValue: change.oldValue,
      proposedValue: change.proposedValue,
      proposalSource: "translation",
    });
    if (result.ok && !result.skippedDuplicate) createdCount++;
  }

  if (createdCount > 0) {
    await insertVerificationEvent({
      resourceId: resource.id,
      eventType: "ai_proposal_generated",
      actorEmail,
      sourceType: "translation",
      notes: `${createdCount} campo(s) de traducción propuesto(s) (modelo: ${translationModelIdentifier()})${skippedIntegrityFields.length > 0 ? `; excluidos por integridad: ${skippedIntegrityFields.join(", ")}` : ""}`,
    });
  }

  return { ok: true, createdCount, skippedIntegrityFields, alreadyPending: false };
}
