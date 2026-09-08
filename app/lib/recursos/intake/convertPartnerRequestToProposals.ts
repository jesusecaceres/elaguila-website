import "server-only";

/**
 * Recursos Intake OS — Gate 7F: converts one partner_update_requests row into
 * resource_change_proposals using the EXACT SAME Gate 5 engine every other intake source uses
 * (detectResourceFieldChanges + dbCreateResourceChangeProposalIfNotPending) — no second diff
 * engine for partner-reported facts.
 *
 * detectResourceFieldChanges reads a proposal object by bracket-accessing only the keys present
 * in WRITABLE_FIELD_COLUMNS. Rather than constructing a full UrlCandidateProposal (whose type
 * requires non-nullable booleans like is24Hours), this builds a PARTIAL object containing only
 * the fields the partner actually reported. An omitted key reads as `undefined` at runtime, which
 * detectResourceFieldChanges correctly treats as "nothing proposed" and skips — so a field the
 * partner never mentioned can never accidentally generate a change proposal (e.g. a hardcoded
 * `is24Hours: false` default would incorrectly propose turning off 24/7 status; this shape avoids
 * that class of bug entirely by never setting fields outside REQUEST_TYPE_FIELDS at all).
 */
import type { ResourceRecord } from "@/app/lib/recursos/types";
import type { UrlCandidateProposal } from "./urlCandidateProposal";
import { detectResourceFieldChanges } from "./resourceChangeDetection";
import { dbCreateResourceChangeProposalIfNotPending } from "./server/resourceChangeProposalsDb";
import { insertVerificationEvent } from "./server/verificationEventsDb";
import type { PartnerUpdateRequestRow } from "./server/partnerUpdateRequestsDb";

export type ConvertPartnerRequestResult =
  | { ok: true; createdCount: number; skippedDuplicateCount: number; totalChanges: number }
  | { ok: false; reason: string };

export async function convertPartnerRequestToProposals(
  request: PartnerUpdateRequestRow,
  resource: ResourceRecord,
  actorEmail: string | null,
): Promise<ConvertPartnerRequestResult> {
  if (!request.resourceId || request.resourceId !== resource.id) {
    return { ok: false, reason: "Esta solicitud no está vinculada a este recurso." };
  }
  if (Object.keys(request.requestedChanges).length === 0) {
    return { ok: false, reason: 'Esta solicitud no tiene campos reportados que convertir (tipo "Otro" o sin datos).' };
  }

  const partialProposal = request.requestedChanges as unknown as UrlCandidateProposal;
  const changes = detectResourceFieldChanges(partialProposal, resource);

  let createdCount = 0;
  let skippedDuplicateCount = 0;
  for (const change of changes) {
    const result = await dbCreateResourceChangeProposalIfNotPending({
      resourceId: resource.id,
      sourceIntakeJobId: null,
      fieldName: change.field,
      oldValue: change.oldValue,
      proposedValue: change.proposedValue,
      proposalSource: "partner_request",
    });
    if (result.ok) {
      if (result.skippedDuplicate) skippedDuplicateCount++;
      else createdCount++;
    }
  }

  if (changes.length > 0) {
    await insertVerificationEvent({
      resourceId: resource.id,
      eventType: "evidence_recorded",
      actorEmail,
      sourceType: "partner_request",
      notes: `Solicitud de socio convertida — ${createdCount} cambio(s) propuesto(s) nuevo(s)${skippedDuplicateCount > 0 ? `, ${skippedDuplicateCount} ya pendiente(s)` : ""}.`,
    });
  }

  return { ok: true, createdCount, skippedDuplicateCount, totalChanges: changes.length };
}
