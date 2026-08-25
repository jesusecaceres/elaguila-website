/**
 * Program 5 — Logic tests for Meeting Studio, Proposals, and Promise Keeper.
 * Run: npx tsx scripts/program5-tests.ts
 */
import {
  canTransitionMeetingStatus,
  noteRequiresConfirmation,
  noteSourceClassForType,
  canPromoteNoteToFact,
  canPromoteNote,
  eligiblePromotionDestinations,
  mapNoteSourceClassToLivingBook,
  confidenceForNoteSourceClass,
  consentTypeRequiresExplicitAck,
  isAudioRecordingLive,
  isTranscriptionLive,
  buildDefaultAgenda,
} from "../app/lib/business/meetingStudio/logic";
import {
  canTransitionProposalStatus,
  isPricingConfirmed,
  pricingRequiresStaffConfirmation,
  proposalAcceptanceDoesNotCharge,
  proposalAcceptanceDoesNotGrantEntitlement,
  isValidAcceptanceActor,
  ownerAcceptanceRequiresNoStaffRoster,
  staffAcceptanceRequiresRoster,
} from "../app/lib/business/proposals/logic";
import { PROPOSAL_STATUSES, isValidProposalStatusTransition } from "../app/lib/business/proposals/constants";
import type { ProposalActor } from "../app/lib/business/proposals/types";
import {
  canTransitionCommitmentStatus,
  isCapacityStretched,
  permitsReducedScope,
  permitsRelease,
  isShameLanguage,
} from "../app/lib/business/promiseKeeper/logic";
import { isValidCommitmentStatusTransition } from "../app/lib/business/promiseKeeper/constants";
import * as fs from "fs";
import * as path from "path";

type TestResult = { name: string; passed: boolean; detail: string };
const results: TestResult[] = [];

function test(name: string, fn: () => boolean | string) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      results.push({ name, passed: true, detail: "" });
    } else if (typeof result === "string") {
      results.push({ name, passed: false, detail: result });
    } else {
      results.push({ name, passed: false, detail: "returned false" });
    }
  } catch (e) {
    results.push({ name, passed: false, detail: String(e) });
  }
}

const root = path.resolve(__dirname, "..");
const migration1 = fs.readFileSync(path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql"), "utf-8");
const migration2 = fs.readFileSync(path.join(root, "supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql"), "utf-8");

function sqlContains(sql: string, pattern: RegExp): boolean {
  return pattern.test(sql);
}

// === Meeting Studio ===

test("meeting status: planned -> prepared", () => canTransitionMeetingStatus("planned", "prepared"));
test("meeting status: planned -> in_progress (invalid)", () => !canTransitionMeetingStatus("planned", "in_progress"));
test("meeting status: in_progress -> completed", () => canTransitionMeetingStatus("in_progress", "completed"));
test("meeting status: completed -> planned (invalid)", () => !canTransitionMeetingStatus("completed", "planned"));
test("meeting status: cancelled -> anything (invalid)", () => !canTransitionMeetingStatus("cancelled", "planned"));

test("note: owner_statement requires confirmation", () => noteRequiresConfirmation("owner_statement"));
test("note: potential_fact requires confirmation", () => noteRequiresConfirmation("potential_fact"));
test("note: staff_observation does not require confirmation", () => !noteRequiresConfirmation("staff_observation"));
test("note: decision does not require confirmation", () => !noteRequiresConfirmation("decision"));

test("note source: owner_statement -> owner_stated", () => noteSourceClassForType("owner_statement") === "owner_stated");
test("note source: staff_observation -> staff_observed", () => noteSourceClassForType("staff_observation") === "staff_observed");
test("note source: potential_fact -> system_derived", () => noteSourceClassForType("potential_fact") === "system_derived");

test("can promote potential_fact to fact", () => canPromoteNoteToFact("potential_fact"));
test("cannot promote owner_statement to fact", () => !canPromoteNoteToFact("owner_statement"));
test("cannot promote staff_observation to fact", () => !canPromoteNoteToFact("staff_observation"));

test("consent: notes does not require explicit ack", () => !consentTypeRequiresExplicitAck("notes"));
test("consent: audio_recording requires explicit ack", () => consentTypeRequiresExplicitAck("audio_recording"));
test("consent: transcription requires explicit ack", () => consentTypeRequiresExplicitAck("transcription"));

test("no live audio recording", () => isAudioRecordingLive("anything") === false);
test("no live transcription", () => isTranscriptionLive("manual_import") === false);

test("default agenda has sections", () => {
  const agenda = buildDefaultAgenda("discovery");
  return Array.isArray((agenda as { sections: unknown[] }).sections) && (agenda as { sections: unknown[] }).sections.length > 0;
});

// === Proposals ===

test("proposal status: draft -> staff_review", () => canTransitionProposalStatus("draft", "staff_review"));
test("proposal status: draft -> owner_review (invalid)", () => !canTransitionProposalStatus("draft", "owner_review"));
test("proposal status: staff_review -> owner_review", () => canTransitionProposalStatus("staff_review", "owner_review"));
test("proposal status: owner_review -> accepted", () => canTransitionProposalStatus("owner_review", "accepted"));
test("proposal status: owner_review -> declined", () => canTransitionProposalStatus("owner_review", "declined"));
test("proposal status: accepted -> draft (invalid)", () => !canTransitionProposalStatus("accepted", "draft"));
test("proposal status: cancelled -> anything (invalid)", () => !canTransitionProposalStatus("cancelled", "draft"));
test("proposal statuses do not include postponed", () => !PROPOSAL_STATUSES.includes("postponed"));
test("proposal cannot transition to postponed", () => !isValidProposalStatusTransition("owner_review", "postponed"));
test("proposal cannot transition from accepted to declined", () => !canTransitionProposalStatus("accepted", "declined"));
test("proposal cannot skip to accepted from draft", () => !canTransitionProposalStatus("draft", "accepted"));

test("pricing confirmed when source is revenue_pricing_matrix and confirmed", () =>
  isPricingConfirmed({ packageKey: "test", packageLabel: "Test", priceCents: 100, billingMode: "one_time", durationDays: 30, pricingSource: "revenue_pricing_matrix", pricingConfirmed: true }));
test("pricing not confirmed when source is unknown", () =>
  !isPricingConfirmed({ packageKey: null, packageLabel: null, priceCents: null, billingMode: null, durationDays: null, pricingSource: "unknown", pricingConfirmed: false }));
test("pricing requires staff confirmation when not confirmed", () =>
  pricingRequiresStaffConfirmation({ packageKey: "test", packageLabel: "Test", priceCents: 100, billingMode: "one_time", durationDays: 30, pricingSource: "revenue_pricing_matrix", pricingConfirmed: false }));
test("pricing does not require staff confirmation when confirmed", () =>
  !pricingRequiresStaffConfirmation({ packageKey: "test", packageLabel: "Test", priceCents: 100, billingMode: "one_time", durationDays: 30, pricingSource: "revenue_pricing_matrix", pricingConfirmed: true }));

test("proposal acceptance does not charge", () => proposalAcceptanceDoesNotCharge() === true);
test("proposal acceptance does not grant entitlement", () => proposalAcceptanceDoesNotGrantEntitlement() === true);

// === Promise Keeper ===

test("commitment status: planned -> active", () => canTransitionCommitmentStatus("planned", "active"));
test("commitment status: planned -> completed (invalid)", () => !canTransitionCommitmentStatus("planned", "completed"));
test("commitment status: active -> blocked", () => canTransitionCommitmentStatus("active", "blocked"));
test("commitment status: active -> completed", () => canTransitionCommitmentStatus("active", "completed"));
test("commitment status: blocked -> active", () => canTransitionCommitmentStatus("blocked", "active"));
test("commitment status: completed -> anything (invalid)", () => !canTransitionCommitmentStatus("completed", "active"));
test("commitment status: released -> anything (invalid)", () => !canTransitionCommitmentStatus("released", "active"));

test("capacity stretched detected", () => isCapacityStretched("stretched"));
test("capacity normal not stretched", () => !isCapacityStretched("normal"));

test("permits reduced scope: modify", () => permitsReducedScope("modify"));
test("permits reduced scope: delegate", () => permitsReducedScope("delegate"));
test("permits reduced scope: release", () => permitsReducedScope("release"));
test("does not permit reduced scope: continue", () => !permitsReducedScope("continue"));

test("permits release: release", () => permitsRelease("release"));
test("does not permit release: continue", () => !permitsRelease("continue"));

test("shame language detected: 'overdue panic'", () => isShameLanguage("This is an overdue panic situation"));
test("shame language detected: 'broken promise'", () => isShameLanguage("This is a broken promise"));
test("no shame language: 'capacity is stretched'", () => !isShameLanguage("Your capacity is stretched, let's reduce scope"));
test("no shame language: 'blocked on resource'", () => !isShameLanguage("Blocked on resource availability"));

test("commitment transition validation: planned -> released", () => isValidCommitmentStatusTransition("planned", "released"));
test("commitment transition validation: active -> released", () => isValidCommitmentStatusTransition("active", "released"));

// === Gate H: Negative DB Constraint Tests ===
// These verify that the SQL migration files contain the constraints that would reject
// cross-business linkage, lifecycle violations, and actor attribution violations at the DB level.

// 1. Business A meeting + Business B attendee → rejected
test("NEG-1: cross-business attendee rejected (composite FK)", () =>
  sqlContains(migration1, /business_meeting_attendees_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/));

// 2. Business A meeting + Business B consent → rejected
test("NEG-2: cross-business consent rejected (composite FK)", () =>
  sqlContains(migration1, /business_meeting_consents_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/));

// 3. Business A meeting + Business B note → rejected
test("NEG-3: cross-business note rejected (composite FK)", () =>
  sqlContains(migration1, /business_meeting_notes_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/));

// 4. Business A meeting + Business B transcript → rejected
test("NEG-4: cross-business transcript rejected (composite FK)", () =>
  sqlContains(migration1, /business_meeting_transcript_imports_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/));

// 5. Business A consent + Business B transcript → rejected
test("NEG-5: cross-business consent-transcript rejected (composite FK)", () =>
  sqlContains(migration1, /business_meeting_transcript_imports_consent_business_fk[\s\S]*?FOREIGN KEY\s*\(consent_record_id,\s*business_id\)\s*REFERENCES public\.business_meeting_consents\(id,\s*business_id\)/));

// 6. Business A recommendation + Business B proposal → rejected
test("NEG-6: cross-business recommendation-proposal rejected (composite FK)", () =>
  sqlContains(migration2, /business_proposals_recommendation_business_fk[\s\S]*?FOREIGN KEY\s*\(source_recommendation_id,\s*business_id\)\s*REFERENCES public\.business_recommendations\(id,\s*business_id\)/));

// 7. Business A proposal + Business B commitment → rejected
test("NEG-7: cross-business proposal-commitment rejected (composite FK)", () =>
  sqlContains(migration2, /business_commitments_proposal_business_fk[\s\S]*?FOREIGN KEY\s*\(proposal_id,\s*business_id\)\s*REFERENCES public\.business_proposals\(id,\s*business_id\)/));

// 8. Business A meeting + Business B commitment → rejected
test("NEG-8: cross-business meeting-commitment rejected (composite FK)", () =>
  sqlContains(migration2, /business_commitments_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/));

// 9. Business A recommendation + Business B commitment → rejected
test("NEG-9: cross-business recommendation-commitment rejected (composite FK)", () =>
  sqlContains(migration2, /business_commitments_recommendation_business_fk[\s\S]*?FOREIGN KEY\s*\(recommendation_id,\s*business_id\)\s*REFERENCES public\.business_recommendations\(id,\s*business_id\)/));

// 10. Business A commitment + Business B event → rejected
test("NEG-10: cross-business commitment-event rejected (composite FK)", () =>
  sqlContains(migration2, /business_commitment_events_commitment_business_fk[\s\S]*?FOREIGN KEY\s*\(commitment_id,\s*business_id\)\s*REFERENCES public\.business_commitments\(id,\s*business_id\)/));

// 11. Accepted proposal without accepted_at → rejected
test("NEG-11: accepted proposal without accepted_at rejected (CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_requires_at_chk[\s\S]*?status != 'accepted' OR accepted_at IS NOT NULL/));

// 12. Accepted proposal without acceptance attribution → rejected
test("NEG-12: accepted proposal without acceptance attribution rejected (CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_atomic_chk[\s\S]*?accepted_by_auth_user_id IS NOT NULL AND[\s\S]*?accepted_by_email IS NOT NULL/));

// 13. Declined proposal without declined_at → rejected
test("NEG-13: declined proposal without declined_at rejected (CHECK)", () =>
  sqlContains(migration2, /business_proposals_declined_requires_at_chk[\s\S]*?status != 'declined' OR declined_at IS NOT NULL/));

// 14. Owner actor carrying staff roster identity → rejected
test("NEG-14: owner actor with staff roster_id rejected (CHECK)", () =>
  sqlContains(migration1, /created_actor_type = 'owner' AND created_by_roster_id IS NULL/) &&
  sqlContains(migration2, /created_actor_type = 'owner' AND created_by_roster_id IS NULL/));

// 15. Staff actor without roster identity → rejected
test("NEG-15: staff actor without roster_id rejected (CHECK)", () =>
  sqlContains(migration1, /created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL/) &&
  sqlContains(migration2, /created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL/));

// === Fix 1: Invalid ADD CONSTRAINT syntax removed ===
test("FIX1-1: no invalid ADD CONSTRAINT IF NOT EXISTS SQL in migration 2", () =>
  !sqlContains(migration2, /ADD\s+CONSTRAINT\s+IF\s+NOT\s+EXISTS\s+business_recommendations/));

test("FIX1-2: DO block with pg_constraint guard exists", () =>
  sqlContains(migration2, /DO\s*\$\$[\s\S]*?pg_constraint[\s\S]*?business_recommendations_id_business_id_uk/));

// === Fix 2: Delete semantics — ON DELETE RESTRICT on all composite FKs ===
test("DEL-1: transcript consent composite FK uses ON DELETE RESTRICT", () =>
  sqlContains(migration1, /business_meeting_transcript_imports_consent_business_fk[\s\S]*?ON DELETE RESTRICT/));

test("DEL-2: proposal recommendation composite FK uses ON DELETE RESTRICT", () =>
  sqlContains(migration2, /business_proposals_recommendation_business_fk[\s\S]*?ON DELETE RESTRICT/));

test("DEL-3: commitment meeting composite FK uses ON DELETE RESTRICT", () =>
  sqlContains(migration2, /business_commitments_meeting_business_fk[\s\S]*?ON DELETE RESTRICT/));

test("DEL-4: commitment recommendation composite FK uses ON DELETE RESTRICT", () =>
  sqlContains(migration2, /business_commitments_recommendation_business_fk[\s\S]*?ON DELETE RESTRICT/));

test("DEL-5: commitment proposal composite FK uses ON DELETE RESTRICT", () =>
  sqlContains(migration2, /business_commitments_proposal_business_fk[\s\S]*?ON DELETE RESTRICT/));

// === Fix 3: Owner-safe proposal acceptance actor ===

const ownerActor: ProposalActor = { type: "owner", authUserId: "auth-1", email: "owner@test.com" };
const staffActor: ProposalActor = { type: "staff", rosterId: "roster-1", authUserId: "auth-2", email: "staff@test.com", role: "sales_manager" };
const staffActorNoRoster: ProposalActor = { type: "staff", rosterId: "", authUserId: "auth-3", email: "staff2@test.com", role: "sales_rep" };

// 1. Owner acceptance with roster_id NULL succeeds
test("ACC-1: owner acceptance with roster_id NULL succeeds", () =>
  isValidAcceptanceActor(ownerActor) && ownerAcceptanceRequiresNoStaffRoster(ownerActor));

// 2. Owner acceptance with staff roster_id fails
test("ACC-2: owner acceptance with staff roster_id fails (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_owner_no_roster_chk[\s\S]*?accepted_actor_type\s*!=\s*'owner'\s+OR\s+accepted_by_roster_id\s+IS\s+NULL/));

// 3. Staff acceptance with roster_id succeeds
test("ACC-3: staff acceptance with roster_id succeeds", () =>
  isValidAcceptanceActor(staffActor) && staffAcceptanceRequiresRoster(staffActor));

// 4. Staff acceptance without roster_id fails
test("ACC-4: staff acceptance without roster_id fails", () =>
  !isValidAcceptanceActor(staffActorNoRoster) || !staffAcceptanceRequiresRoster(staffActorNoRoster));

// 5. Accepted proposal without accepted_actor_type fails (DB CHECK)
test("ACC-5: accepted proposal without accepted_actor_type fails (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_requires_actor_type_chk[\s\S]*?status\s*!=\s*'accepted'\s+OR\s+accepted_actor_type\s+IS\s+NOT\s+NULL/));

// 6. Accepted proposal without accepted_at fails (DB CHECK)
test("ACC-6: accepted proposal without accepted_at fails (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_requires_at_chk[\s\S]*?status\s*!=\s*'accepted'\s+OR\s+accepted_at\s+IS\s+NOT\s+NULL/));

// 7. Accepted proposal without auth user fails (DB CHECK)
test("ACC-7: accepted proposal without auth user fails (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_atomic_chk[\s\S]*?accepted_by_auth_user_id\s+IS\s+NOT\s+NULL/));

// 8. Accepted proposal without email/role fails (DB CHECK)
test("ACC-8: accepted proposal without email/role fails (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_atomic_chk[\s\S]*?accepted_by_email\s+IS\s+NOT\s+NULL\s+AND\s+char_length/) &&
  sqlContains(migration2, /business_proposals_accepted_atomic_chk[\s\S]*?accepted_by_role\s+IS\s+NOT\s+NULL\s+AND\s+char_length/));

// 9. Draft proposal cannot carry accepted_at (DB CHECK)
test("ACC-9: draft proposal cannot carry accepted_at (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'draft'[\s\S]*?accepted_at\s+IS\s+NULL\s+AND\s+accepted_actor_type\s+IS\s+NULL/));

// 10. Owner acceptance does not create payment
test("ACC-10: owner acceptance does not create payment", () =>
  proposalAcceptanceDoesNotCharge() === true);

// 11. Owner acceptance does not grant entitlement
test("ACC-11: owner acceptance does not grant entitlement", () =>
  proposalAcceptanceDoesNotGrantEntitlement() === true);

// === Lifecycle Mutual-Exclusion Tests ===

// 1. accepted + declined_at -> rejected
test("LIFE-1: accepted + declined_at rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_accepted_not_declined_chk[\s\S]*?status\s*!=\s*'accepted'\s+OR\s+declined_at\s+IS\s+NULL/));

// 2. declined + accepted_at -> rejected
test("LIFE-2: declined + accepted_at rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_declined_not_accepted_chk[\s\S]*?status\s*!=\s*'declined'\s+OR\s+\([\s\S]*?accepted_at\s+IS\s+NULL/));

// 3. declined + accepted_actor_type -> rejected
test("LIFE-3: declined + accepted_actor_type rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_declined_not_accepted_chk[\s\S]*?accepted_actor_type\s+IS\s+NULL/));

// 4. declined + accepted auth attribution -> rejected
test("LIFE-4: declined + accepted auth attribution rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_declined_not_accepted_chk[\s\S]*?accepted_by_auth_user_id\s+IS\s+NULL\s+AND[\s\S]*?accepted_by_email\s+IS\s+NULL\s+AND[\s\S]*?accepted_by_role\s+IS\s+NULL/));

// 5. draft + declined_at -> rejected
test("LIFE-5: draft + declined_at rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'draft'[\s\S]*?declined_at\s+IS\s+NULL/));

// 6. staff_review + declined_at -> rejected
test("LIFE-6: staff_review + declined_at rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'staff_review'[\s\S]*?declined_at\s+IS\s+NULL/));

// 7. owner_review + accepted_at -> rejected
test("LIFE-7: owner_review + accepted_at rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'owner_review'[\s\S]*?accepted_at\s+IS\s+NULL/));

// 8. owner_review + declined_at -> rejected
test("LIFE-8: owner_review + declined_at rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'owner_review'[\s\S]*?declined_at\s+IS\s+NULL/));

// 9. expired + contradictory decision attribution -> rejected
test("LIFE-9: expired + decision attribution rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'expired'[\s\S]*?accepted_at\s+IS\s+NULL[\s\S]*?declined_at\s+IS\s+NULL/));

// 10. cancelled + contradictory decision attribution -> rejected
test("LIFE-10: cancelled + decision attribution rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'cancelled'[\s\S]*?accepted_at\s+IS\s+NULL[\s\S]*?declined_at\s+IS\s+NULL/));

// 11. superseded: cannot carry BOTH accepted_at and declined_at
test("LIFE-11: superseded cannot carry both accepted_at and declined_at (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_not_both_decisions_chk[\s\S]*?status\s*!=\s*'superseded'\s+OR\s+accepted_at\s+IS\s+NULL\s+OR\s+declined_at\s+IS\s+NULL/));

// === Superseded Acceptance Actor Integrity Tests ===

// 1. superseded accepted owner + roster NULL -> allowed (constraint exists and permits this)
test("SUP-1: superseded accepted owner with roster NULL allowed (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_owner_no_roster_chk[\s\S]*?status\s*!=\s*'superseded'\s+OR\s+accepted_at\s+IS\s+NULL\s+OR\s+accepted_actor_type\s*!=\s*'owner'\s+OR\s+accepted_by_roster_id\s+IS\s+NULL/));

// 2. superseded accepted owner + roster NOT NULL -> rejected
test("SUP-2: superseded accepted owner with roster NOT NULL rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_owner_no_roster_chk[\s\S]*?accepted_actor_type\s*!=\s*'owner'\s+OR\s+accepted_by_roster_id\s+IS\s+NULL/));

// 3. superseded accepted staff + roster NOT NULL -> allowed
test("SUP-3: superseded accepted staff with roster NOT NULL allowed (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_staff_requires_roster_chk[\s\S]*?status\s*!=\s*'superseded'\s+OR\s+accepted_at\s+IS\s+NULL\s+OR\s+accepted_actor_type\s*!=\s*'staff'\s+OR\s+accepted_by_roster_id\s+IS\s+NOT\s+NULL/));

// 4. superseded accepted staff + roster NULL -> rejected
test("SUP-4: superseded accepted staff with roster NULL rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_staff_requires_roster_chk[\s\S]*?accepted_actor_type\s*!=\s*'staff'\s+OR\s+accepted_by_roster_id\s+IS\s+NOT\s+NULL/));

// 5. superseded declined with no acceptance attribution -> allowed (no accepted_at)
test("SUP-5: superseded declined with no acceptance attribution allowed (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_owner_no_roster_chk[\s\S]*?accepted_at\s+IS\s+NULL/) &&
  sqlContains(migration2, /business_proposals_superseded_staff_requires_roster_chk[\s\S]*?accepted_at\s+IS\s+NULL/));

// 6. superseded cannot contain both accepted_at and declined_at (re-verify)
test("SUP-6: superseded cannot contain both accepted_at and declined_at (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_not_both_decisions_chk[\s\S]*?accepted_at\s+IS\s+NULL\s+OR\s+declined_at\s+IS\s+NULL/));

// 7. superseded partial acceptance remains rejected
test("SUP-7: superseded partial acceptance remains rejected (DB CHECK)", () =>
  sqlContains(migration2, /business_proposals_superseded_no_partial_accepted_chk[\s\S]*?accepted_at\s+IS\s+NULL\s+AND\s+accepted_actor_type\s+IS\s+NULL/));

// 12. proposal_versions retains decision history (append-only, composite FK)
test("LIFE-12: proposal_versions retains decision history (append-only + composite FK)", () =>
  sqlContains(migration2, /GRANT SELECT, INSERT ON TABLE public\.business_proposal_versions TO service_role/) &&
  sqlContains(migration2, /business_proposal_versions_proposal_business_fk[\s\S]*?FOREIGN KEY\s*\(proposal_id,\s*business_id\)/));

// 13. Repository clears stale attribution on declined transition
test("LIFE-13: repository clears acceptance attribution on declined transition", () =>
  sqlContains(fs.readFileSync(path.join(root, "app/lib/business/proposals/repository.ts"), "utf-8"),
    /input\.newStatus === "declined"[\s\S]*?update\.accepted_at = null/));

// 14. Repository clears declined_at on accepted transition
test("LIFE-14: repository clears declined_at on accepted transition", () =>
  sqlContains(fs.readFileSync(path.join(root, "app/lib/business/proposals/repository.ts"), "utf-8"),
    /input\.newStatus === "accepted"[\s\S]*?update\.declined_at = null/));

// 15. Repository clears all decision attribution on expired/cancelled
test("LIFE-15: repository clears all decision attribution on expired/cancelled", () =>
  sqlContains(fs.readFileSync(path.join(root, "app/lib/business/proposals/repository.ts"), "utf-8"),
    /input\.newStatus === "expired" \|\| input\.newStatus === "cancelled"[\s\S]*?update\.declined_at = null/));

// === Promotion workflow logic tests ===

// Positive: eligible destinations per note type
test("PROMO-1: owner_statement eligible for fact promotion", () => {
  const dests = eligiblePromotionDestinations("owner_statement");
  return dests.includes("fact") && dests.length === 1;
});
test("PROMO-2: staff_observation eligible for fact promotion", () => {
  const dests = eligiblePromotionDestinations("staff_observation");
  return dests.includes("fact") && dests.length === 1;
});
test("PROMO-3: potential_fact eligible for fact promotion", () => {
  const dests = eligiblePromotionDestinations("potential_fact");
  return dests.includes("fact") && dests.length === 1;
});
test("PROMO-4: unknown note eligible for unknown promotion only", () => {
  const dests = eligiblePromotionDestinations("unknown");
  return dests.includes("unknown") && !dests.includes("fact") && dests.length === 1;
});
test("PROMO-5: contradiction note eligible for contradiction promotion only", () => {
  const dests = eligiblePromotionDestinations("contradiction");
  return dests.includes("contradiction") && !dests.includes("fact") && dests.length === 1;
});
test("PROMO-6: decision note has no eligible promotion destination", () => {
  return eligiblePromotionDestinations("decision").length === 0;
});
test("PROMO-7: action_item note has no eligible promotion destination", () => {
  return eligiblePromotionDestinations("action_item").length === 0;
});

// canPromoteNote helper
test("PROMO-8: canPromoteNote true for owner_statement", () => canPromoteNote("owner_statement"));
test("PROMO-9: canPromoteNote true for staff_observation", () => canPromoteNote("staff_observation"));
test("PROMO-10: canPromoteNote true for potential_fact", () => canPromoteNote("potential_fact"));
test("PROMO-11: canPromoteNote false for decision", () => !canPromoteNote("decision"));
test("PROMO-12: canPromoteNote false for action_item", () => !canPromoteNote("action_item"));

// canPromoteNoteToFact: backward-compat — only potential_fact returns true
test("PROMO-13: canPromoteNoteToFact still only true for potential_fact (backward compat)", () =>
  canPromoteNoteToFact("potential_fact") &&
  !canPromoteNoteToFact("owner_statement") &&
  !canPromoteNoteToFact("staff_observation"));

// Source class mapping — truthful, no false confirmation
test("PROMO-14: owner_stated maps to owner_statement (NOT owner_confirmed)", () =>
  mapNoteSourceClassToLivingBook("owner_stated") === "owner_statement");
test("PROMO-15: staff_observed maps to staff_observation", () =>
  mapNoteSourceClassToLivingBook("staff_observed") === "staff_observation");
test("PROMO-16: system_derived maps to system_derived", () =>
  mapNoteSourceClassToLivingBook("system_derived") === "system_derived");
test("PROMO-17: ai_inference maps to ai_inference", () =>
  mapNoteSourceClassToLivingBook("ai_inference") === "ai_inference");

// Confidence — conservative defaults
test("PROMO-18: owner_stated confidence is medium (not high)", () => {
  const c = confidenceForNoteSourceClass("owner_stated");
  return c === "medium";
});
test("PROMO-19: staff_observed confidence is low", () => {
  const c = confidenceForNoteSourceClass("staff_observed");
  return c === "low";
});
test("PROMO-20: system_derived confidence is low", () => {
  const c = confidenceForNoteSourceClass("system_derived");
  return c === "low";
});

// Negative: note types ineligible for wrong destinations
test("NEG-PROMO-1: owner_statement is not eligible for unknown promotion", () =>
  !eligiblePromotionDestinations("owner_statement").includes("unknown"));
test("NEG-PROMO-2: unknown note is not eligible for fact promotion", () =>
  !eligiblePromotionDestinations("unknown").includes("fact"));
test("NEG-PROMO-3: contradiction note is not eligible for fact promotion", () =>
  !eligiblePromotionDestinations("contradiction").includes("fact"));
test("NEG-PROMO-4: contradiction requires two-sided input (not automatically parsed)", () => {
  // Structural test: the eligible destination for contradiction is "contradiction",
  // which requires explicit claimA and claimB — no single-label automatic inference.
  const dests = eligiblePromotionDestinations("contradiction");
  return dests.length === 1 && dests[0] === "contradiction";
});

// Schema structure tests for promotion migration
test("SCHEMA-PROMO-1: promotion migration file exists", () => {
  const migPath = path.join(root, "supabase/migrations/20260813120000_business_meeting_note_promotions.sql");
  return fs.existsSync(migPath);
});

const migration3 = fs.readFileSync(
  path.join(root, "supabase/migrations/20260813120000_business_meeting_note_promotions.sql"),
  "utf-8",
);

test("SCHEMA-PROMO-2: promotion table has UNIQUE(meeting_note_id)", () =>
  sqlContains(migration3, /business_meeting_note_promotions_note_uk\s+UNIQUE\s*\(meeting_note_id\)/));
test("SCHEMA-PROMO-3: promotion table RLS enabled", () =>
  sqlContains(migration3, /ALTER TABLE public\.business_meeting_note_promotions ENABLE ROW LEVEL SECURITY/));
test("SCHEMA-PROMO-4: promotion table anon revoked", () =>
  sqlContains(migration3, /REVOKE ALL PRIVILEGES ON TABLE public\.business_meeting_note_promotions FROM anon/));
test("SCHEMA-PROMO-5: promotion table authenticated revoked", () =>
  sqlContains(migration3, /REVOKE ALL PRIVILEGES ON TABLE public\.business_meeting_note_promotions FROM authenticated/));
test("SCHEMA-PROMO-6: promotion table append-only (SELECT, INSERT only)", () =>
  sqlContains(migration3, /GRANT SELECT, INSERT ON TABLE public\.business_meeting_note_promotions TO service_role/));
test("SCHEMA-PROMO-7: promotion table same-business FK for meeting", () =>
  sqlContains(migration3, /business_meeting_note_promotions_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/));
test("SCHEMA-PROMO-8: promotion table same-business FK for note", () =>
  sqlContains(migration3, /business_meeting_note_promotions_note_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_note_id,\s*business_id\)\s*REFERENCES public\.business_meeting_notes\(id,\s*business_id\)/));
test("SCHEMA-PROMO-9: business_meeting_notes gets UNIQUE(id, business_id) additive constraint", () =>
  sqlContains(migration3, /business_meeting_notes_id_business_id_uk/));
test("SCHEMA-PROMO-10: no CREATE POLICY on promotion table (service_role bypasses RLS)", () =>
  !sqlContains(migration3, /CREATE POLICY/));
test("SCHEMA-PROMO-11: destination_type CHECK constraint limits to valid destinations", () =>
  sqlContains(migration3, /destination_type[\s\S]*?CHECK[\s\S]*?'fact'[\s\S]*?'unknown'[\s\S]*?'contradiction'[\s\S]*?'correction'/));

const meetingActionsUi = fs.readFileSync(path.join(root, "app/admin/(dashboard)/businesses/[businessId]/MeetingStudioActions.tsx"), "utf-8");
const meetingJourneyUi = fs.readFileSync(path.join(root, "app/admin/(dashboard)/businesses/[businessId]/MeetingJourney.tsx"), "utf-8");
test("GATE05: MeetingJourney labels Lion's Cockpit as Meeting Prep", () =>
  meetingJourneyUi.includes("Meeting Prep") && meetingJourneyUi.includes("Lion"));
test("GATE05: MeetingStudioActions remains the canonical conduct surface", () =>
  meetingJourneyUi.includes("<CreateMeetingForm") && meetingJourneyUi.includes("<MeetingDetailPanel"));
test("GATE05: live recording is explicitly unavailable and MediaRecorder is absent", () =>
  meetingActionsUi.includes("Live meeting recording is not currently available") &&
  !meetingActionsUi.includes("MediaRecorder") &&
  !meetingActionsUi.includes("Whisper") &&
  !meetingActionsUi.includes("Deepgram"));
test("GATE05: transcript import remains manual_import / import_transcript", () =>
  meetingActionsUi.includes("action: \"import_transcript\"") &&
  meetingActionsUi.includes("Import Transcript") &&
  meetingActionsUi.includes("This is not live recording"));
test("GATE05: Living Book promotion remains explicit human action", () =>
  meetingActionsUi.includes("Promote to Living Book") &&
  meetingActionsUi.includes("action: \"promote_note\"") &&
  meetingJourneyUi.includes("Nothing here auto-promotes"));
test("GATE05: sales follow-up and Promise Keeper remain separate navigation", () =>
  meetingJourneyUi.includes("#outreach") &&
  meetingJourneyUi.includes("#promises") &&
  meetingJourneyUi.includes("do not auto-create"));

// Report
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log("\n=== Program 5 Logic Tests ===\n");
for (const r of results) {
  console.log(`${r.passed ? "PASS" : "FAIL"} — ${r.name}`);
  if (!r.passed) console.log(`       ${r.detail}`);
}
console.log(`\n${passed} passed, ${failed} failed, ${results.length} total\n`);

if (failed > 0) {
  process.exit(1);
}
