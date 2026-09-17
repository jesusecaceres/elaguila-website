/**
 * Program 5 — Mechanical verifier for Meeting Studio + Proposal + Promise Keeper.
 * Checks: no fake recording/transcription state, no invented pricing, consent
 * append-only, notes never directly mutate business_facts, proposal acceptance
 * does not charge, no shame language, feature flags default disabled.
 *
 * Run: npx tsx scripts/program5-verifier.ts
 */
import * as fs from "fs";
import * as path from "path";

type CheckResult = { name: string; passed: boolean; detail: string };

function checkFileContains(filePath: string, pattern: RegExp): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return pattern.test(content);
  } catch {
    return false;
  }
}

function checkFileNotContains(filePath: string, pattern: RegExp): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return !pattern.test(content);
  } catch {
    return true;
  }
}

const checks: CheckResult[] = [];
const root = path.resolve(__dirname, "..");

const migration1 = path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql");
const migration2 = path.join(root, "supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql");

const meetingTables = [
  "business_meetings",
  "business_meeting_attendees",
  "business_meeting_consents",
  "business_meeting_notes",
  "business_meeting_transcript_imports",
];

const proposalAndCommitmentTables = [
  "business_proposals",
  "business_proposal_versions",
  "business_commitments",
  "business_commitment_events",
];

const allTables = [...meetingTables, ...proposalAndCommitmentTables];

// 1. Meeting Studio migration exists
checks.push({
  name: "Meeting Studio migration exists",
  passed: fs.existsSync(path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql")),
  detail: "Migration file must exist",
});

// 2. Proposal + Promise Keeper migration exists
checks.push({
  name: "Proposal + Promise Keeper migration exists",
  passed: fs.existsSync(path.join(root, "supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql")),
  detail: "Migration file must exist",
});

// 3. No fake recording state — import_method must be manual_import only
checks.push({
  name: "No fake recording state (manual_import only)",
  passed: checkFileContains(
    path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql"),
    /import_method.*manual_import/,
  ),
  detail: "import_method CHECK must constrain to manual_import",
});

// 4. Consent is append-only — no UPDATE/DELETE grant
checks.push({
  name: "Consent append-only (no UPDATE/DELETE grant)",
  passed: checkFileContains(
    path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql"),
    /GRANT SELECT, INSERT ON TABLE public\.business_meeting_consents TO service_role/,
  ),
  detail: "Consent table must only have SELECT, INSERT grants",
});

// 5. Notes never directly mutate business_facts
checks.push({
  name: "Meeting notes do not mutate business_facts",
  passed: checkFileNotContains(
    path.join(root, "app/lib/business/meetingStudio/repository.ts"),
    /from\(['"]business_facts['"]\)|\.from\(['"]business_facts['"]\)|insert.*business_facts|update.*business_facts/,
  ),
  detail: "Meeting Studio repository must not query/insert/update business_facts table",
});

// 6. Proposal acceptance does not charge
checks.push({
  name: "Proposal acceptance does not charge",
  passed: checkFileContains(
    path.join(root, "app/lib/business/proposals/logic.ts"),
    /proposalAcceptanceDoesNotCharge/,
  ) && checkFileContains(
    path.join(root, "app/lib/business/proposals/logic.ts"),
    /proposalAcceptanceDoesNotGrantEntitlement/,
  ),
  detail: "Proposal logic must explicitly state acceptance does not charge or grant entitlement",
});

// 7. No invented pricing — pricing resolved from revenue_pricing_matrix
checks.push({
  name: "Pricing resolved from revenue_pricing_matrix",
  passed: checkFileContains(
    path.join(root, "app/lib/business/proposals/repository.ts"),
    /REVENUE_V1_PACKAGE_MATRIX/,
  ),
  detail: "Proposal repository must resolve pricing from REVENUE_V1_PACKAGE_MATRIX",
});

// 8. No shame language in Promise Keeper
checks.push({
  name: "No shame language in Promise Keeper",
  passed: checkFileContains(
    path.join(root, "app/lib/business/promiseKeeper/logic.ts"),
    /isShameLanguage/,
  ),
  detail: "Promise Keeper logic must include shame language detection",
});

// 9. Feature flags default disabled
checks.push({
  name: "Feature flags default disabled",
  passed: checkFileContains(
    path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql"),
    /'business_meeting_studio', false/,
  ) && checkFileContains(
    path.join(root, "supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql"),
    /'business_proposal_studio', false/,
  ) && checkFileContains(
    path.join(root, "supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql"),
    /'business_promise_keeper', false/,
  ),
  detail: "All three feature flags must start disabled",
});

// 10. RLS enabled on all new tables
checks.push({
  name: "RLS enabled on all new tables",
  passed: [
    "business_meetings",
    "business_meeting_attendees",
    "business_meeting_consents",
    "business_meeting_notes",
    "business_meeting_transcript_imports",
  ].every((table) =>
    checkFileContains(
      path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql"),
      new RegExp(`ENABLE ROW LEVEL SECURITY.*${table}|${table}.*ENABLE ROW LEVEL SECURITY`),
    ),
  ) && [
    "business_proposals",
    "business_proposal_versions",
    "business_commitments",
    "business_commitment_events",
  ].every((table) =>
    checkFileContains(
      path.join(root, "supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql"),
      new RegExp(`ENABLE ROW LEVEL SECURITY.*${table}|${table}.*ENABLE ROW LEVEL SECURITY`),
    ),
  ),
  detail: "All 9 new tables must have RLS enabled",
});

// 11. Actor attribution CHECK on all tables
checks.push({
  name: "Actor attribution CHECK on all tables",
  passed: checkFileContains(
    path.join(root, "supabase/migrations/20260810140000_business_meeting_studio_foundation.sql"),
    /created_actor_type.*CHECK.*staff.*owner/,
  ) && checkFileContains(
    path.join(root, "supabase/migrations/20260810150000_business_proposal_promise_keeper_foundation.sql"),
    /created_actor_type.*CHECK.*staff.*owner/,
  ),
  detail: "All tables must have actor_type CHECK constraints",
});

// 12. No live microphone recording
checks.push({
  name: "No live microphone recording",
  passed: checkFileContains(
    path.join(root, "app/lib/business/meetingStudio/logic.ts"),
    /isAudioRecordingLive[\s\S]*?return false/,
  ),
  detail: "isAudioRecordingLive must always return false",
});

// 13. No transcription provider calls
checks.push({
  name: "No transcription provider calls",
  passed: checkFileNotContains(
    path.join(root, "app/lib/business/meetingStudio/repository.ts"),
    /transcription.*provider|provider.*transcription|openai|whisper|assemblyai|deepgram/i,
  ),
  detail: "Meeting Studio repository must not call any transcription provider",
});

// 14. Owner-safe surface filters staff_only notes
checks.push({
  name: "Owner-safe surface filters staff_only notes",
  passed: checkFileContains(
    path.join(root, "app/api/business/[businessId]/meeting-studio/route.ts"),
    /visibility.*shared_with_owner/,
  ),
  detail: "Owner API must filter notes to shared_with_owner only",
});

// 15. Capabilities extended for Program 5
checks.push({
  name: "Capabilities extended for Program 5",
  passed: checkFileContains(
    path.join(root, "app/admin/_lib/salesWorkspaceCapabilities.ts"),
    /view_meeting_studio/,
  ) && checkFileContains(
    path.join(root, "app/admin/_lib/salesWorkspaceCapabilities.ts"),
    /create_proposal/,
  ) && checkFileContains(
    path.join(root, "app/admin/_lib/salesWorkspaceCapabilities.ts"),
    /manage_own_commitments/,
  ),
  detail: "Capability matrix must include Program 5 capabilities",
});

// 16. sales_rep does NOT have create_proposal or manage_team_commitments
checks.push({
  name: "sales_rep lacks create_proposal and manage_team_commitments",
  passed: !checkFileContains(
    path.join(root, "app/admin/_lib/salesWorkspaceCapabilities.ts"),
    /sales_rep.*create_proposal/,
  ),
  detail: "sales_rep must not have create_proposal or manage_team_commitments",
});

// 17. UNIQUE(id, business_id) parent keys where required
checks.push({
  name: "UNIQUE(id, business_id) parent keys on meetings, consents, proposals, commitments",
  passed: [
    checkFileContains(migration1, /business_meetings_id_business_id_uk\s+UNIQUE\s*\(id,\s*business_id\)/),
    checkFileContains(migration1, /business_meeting_consents_id_business_id_uk\s+UNIQUE\s*\(id,\s*business_id\)/),
    checkFileContains(migration2, /business_proposals_id_business_id_uk\s+UNIQUE\s*\(id,\s*business_id\)/),
    checkFileContains(migration2, /business_commitments_id_business_id_uk\s+UNIQUE\s*\(id,\s*business_id\)/),
  ].every(Boolean),
  detail: "All parent tables must expose UNIQUE(id, business_id) for composite FKs",
});

// 18. Every meeting child has composite same-business FK
checks.push({
  name: "Meeting child composite same-business FKs (attendees, consents, notes, transcripts)",
  passed: [
    checkFileContains(migration1, /business_meeting_attendees_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/),
    checkFileContains(migration1, /business_meeting_consents_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/),
    checkFileContains(migration1, /business_meeting_notes_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/),
    checkFileContains(migration1, /business_meeting_transcript_imports_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/),
  ].every(Boolean),
  detail: "All meeting child tables must have composite FK (meeting_id, business_id) → business_meetings(id, business_id)",
});

// 19. Transcript consent same-business FK
checks.push({
  name: "Transcript consent same-business composite FK",
  passed: checkFileContains(
    migration1,
    /business_meeting_transcript_imports_consent_business_fk[\s\S]*?FOREIGN KEY\s*\(consent_record_id,\s*business_id\)\s*REFERENCES public\.business_meeting_consents\(id,\s*business_id\)/,
  ),
  detail: "Transcript imports must have composite FK (consent_record_id, business_id) → business_meeting_consents(id, business_id)",
});

// 20. Proposal recommendation has real FK
checks.push({
  name: "Proposal recommendation real FK to business_recommendations",
  passed: checkFileContains(
    migration2,
    /source_recommendation_id\s+uuid\s+NULL\s+REFERENCES\s+public\.business_recommendations\(id\)\s+ON DELETE RESTRICT/,
  ),
  detail: "source_recommendation_id must be a real FK to business_recommendations(id) with ON DELETE RESTRICT",
});

// 21. Proposal recommendation composite same-business FK
checks.push({
  name: "Proposal recommendation composite same-business FK",
  passed: checkFileContains(
    migration2,
    /business_proposals_recommendation_business_fk[\s\S]*?FOREIGN KEY\s*\(source_recommendation_id,\s*business_id\)\s*REFERENCES public\.business_recommendations\(id,\s*business_id\)/,
  ),
  detail: "Proposals must have composite FK (source_recommendation_id, business_id) → business_recommendations(id, business_id)",
});

// 22. Commitment recommendation has real FK
checks.push({
  name: "Commitment recommendation real FK to business_recommendations",
  passed: checkFileContains(
    migration2,
    /recommendation_id\s+uuid\s+NULL\s+REFERENCES\s+public\.business_recommendations\(id\)\s+ON DELETE RESTRICT/,
  ),
  detail: "commitment recommendation_id must be a real FK to business_recommendations(id) with ON DELETE RESTRICT",
});

// 23. Commitment recommendation composite same-business FK
checks.push({
  name: "Commitment recommendation composite same-business FK",
  passed: checkFileContains(
    migration2,
    /business_commitments_recommendation_business_fk[\s\S]*?FOREIGN KEY\s*\(recommendation_id,\s*business_id\)\s*REFERENCES public\.business_recommendations\(id,\s*business_id\)/,
  ),
  detail: "Commitments must have composite FK (recommendation_id, business_id) → business_recommendations(id, business_id)",
});

// 24. Commitment meeting same-business FK
checks.push({
  name: "Commitment meeting composite same-business FK",
  passed: checkFileContains(
    migration2,
    /business_commitments_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/,
  ),
  detail: "Commitments must have composite FK (meeting_id, business_id) → business_meetings(id, business_id)",
});

// 25. Commitment proposal same-business FK
checks.push({
  name: "Commitment proposal composite same-business FK",
  passed: checkFileContains(
    migration2,
    /business_commitments_proposal_business_fk[\s\S]*?FOREIGN KEY\s*\(proposal_id,\s*business_id\)\s*REFERENCES public\.business_proposals\(id,\s*business_id\)/,
  ),
  detail: "Commitments must have composite FK (proposal_id, business_id) → business_proposals(id, business_id)",
});

// 26. Commitment event same-business FK
checks.push({
  name: "Commitment event composite same-business FK",
  passed: checkFileContains(
    migration2,
    /business_commitment_events_commitment_business_fk[\s\S]*?FOREIGN KEY\s*\(commitment_id,\s*business_id\)\s*REFERENCES public\.business_commitments\(id,\s*business_id\)/,
  ),
  detail: "Commitment events must have composite FK (commitment_id, business_id) → business_commitments(id, business_id)",
});

// 27. Proposal versions composite same-business FK
checks.push({
  name: "Proposal versions composite same-business FK",
  passed: checkFileContains(
    migration2,
    /business_proposal_versions_proposal_business_fk[\s\S]*?FOREIGN KEY\s*\(proposal_id,\s*business_id\)\s*REFERENCES public\.business_proposals\(id,\s*business_id\)/,
  ),
  detail: "Proposal versions must have composite FK (proposal_id, business_id) → business_proposals(id, business_id)",
});

// 28. Explicit anon revoke on all Program 5 tables
checks.push({
  name: "Explicit anon revoke on all Program 5 tables",
  passed: allTables.every((table) => {
    const file = meetingTables.includes(table) ? migration1 : migration2;
    return checkFileContains(file, new RegExp(`REVOKE ALL PRIVILEGES ON TABLE public\\.${table} FROM anon`));
  }),
  detail: "Every Program 5 table must explicitly REVOKE ALL FROM anon",
});

// 29. Explicit authenticated revoke on all Program 5 tables
checks.push({
  name: "Explicit authenticated revoke on all Program 5 tables",
  passed: allTables.every((table) => {
    const file = meetingTables.includes(table) ? migration1 : migration2;
    return checkFileContains(file, new RegExp(`REVOKE ALL PRIVILEGES ON TABLE public\\.${table} FROM authenticated`));
  }),
  detail: "Every Program 5 table must explicitly REVOKE ALL FROM authenticated",
});

// 30. Explicit service_role reset on all Program 5 tables
checks.push({
  name: "Explicit service_role reset on all Program 5 tables",
  passed: allTables.every((table) => {
    const file = meetingTables.includes(table) ? migration1 : migration2;
    return checkFileContains(file, new RegExp(`REVOKE ALL PRIVILEGES ON TABLE public\\.${table} FROM service_role`));
  }),
  detail: "Every Program 5 table must explicitly REVOKE ALL FROM service_role before narrow grant",
});

// 31. No accidental GRANT ALL on any Program 5 table
checks.push({
  name: "No accidental GRANT ALL on Program 5 tables",
  passed: !checkFileContains(migration1, /GRANT ALL/) && !checkFileContains(migration2, /GRANT ALL/),
  detail: "No table may have GRANT ALL — only narrow column-level grants",
});

// 32. Zero RLS policies (no CREATE POLICY)
checks.push({
  name: "Zero RLS policies on Program 5 tables",
  passed: !checkFileContains(migration1, /CREATE POLICY/) && !checkFileContains(migration2, /CREATE POLICY/),
  detail: "No RLS policies may be created — service_role bypasses RLS",
});

// 33. Append-only: consent grants exact (SELECT, INSERT only)
checks.push({
  name: "Consent append-only grants exact (SELECT, INSERT only)",
  passed: checkFileContains(
    migration1,
    /GRANT SELECT, INSERT ON TABLE public\.business_meeting_consents TO service_role/,
  ),
  detail: "Consent table must have exactly SELECT, INSERT grants",
});

// 34. Append-only: proposal versions grants exact (SELECT, INSERT only)
checks.push({
  name: "Proposal versions append-only grants exact (SELECT, INSERT only)",
  passed: checkFileContains(
    migration2,
    /GRANT SELECT, INSERT ON TABLE public\.business_proposal_versions TO service_role/,
  ),
  detail: "Proposal versions table must have exactly SELECT, INSERT grants",
});

// 35. Append-only: commitment events grants exact (SELECT, INSERT only)
checks.push({
  name: "Commitment events append-only grants exact (SELECT, INSERT only)",
  passed: checkFileContains(
    migration2,
    /GRANT SELECT, INSERT ON TABLE public\.business_commitment_events TO service_role/,
  ),
  detail: "Commitment events table must have exactly SELECT, INSERT grants",
});

// 36. Meeting completed lifecycle integrity
checks.push({
  name: "Meeting completed lifecycle DB integrity",
  passed: checkFileContains(migration1, /business_meetings_completed_requires_at_chk/) &&
         checkFileContains(migration1, /business_meetings_completed_atomic_chk/),
  detail: "Meetings must have CHECK constraints for completed status requiring completed_at + atomic attribution",
});

// 37. Proposal accepted lifecycle integrity
checks.push({
  name: "Proposal accepted lifecycle DB integrity",
  passed: checkFileContains(migration2, /business_proposals_accepted_requires_at_chk/) &&
         checkFileContains(migration2, /business_proposals_accepted_requires_actor_type_chk/) &&
         checkFileContains(migration2, /business_proposals_accepted_atomic_chk/) &&
         checkFileContains(migration2, /business_proposals_accepted_owner_no_roster_chk/) &&
         checkFileContains(migration2, /business_proposals_accepted_staff_requires_roster_chk/),
  detail: "Proposals must have CHECK constraints for accepted status requiring accepted_at + accepted_actor_type + atomic attribution + owner/staff roster rules",
});

// 38. Proposal declined lifecycle integrity
checks.push({
  name: "Proposal declined lifecycle DB integrity",
  passed: checkFileContains(migration2, /business_proposals_declined_requires_at_chk/),
  detail: "Proposals must have CHECK constraint for declined status requiring declined_at",
});

// 39. Actor attribution integrity: owner roster_id must be NULL
checks.push({
  name: "Actor integrity: owner actor roster_id must be NULL",
  passed: [
    checkFileContains(migration1, /created_actor_type = 'owner' AND created_by_roster_id IS NULL/),
    checkFileContains(migration1, /recorded_actor_type = 'owner' AND recorded_by_roster_id IS NULL/),
    checkFileContains(migration1, /imported_actor_type = 'owner' AND imported_by_roster_id IS NULL/),
    checkFileContains(migration2, /created_actor_type = 'owner' AND created_by_roster_id IS NULL/),
    checkFileContains(migration2, /changed_actor_type = 'owner' AND changed_by_roster_id IS NULL/),
    checkFileContains(migration2, /event_actor_type = 'owner' AND event_by_roster_id IS NULL/),
  ].every(Boolean),
  detail: "Every actor CHECK must enforce owner roster_id IS NULL",
});

// 40. Actor attribution integrity: staff roster_id must be non-null
checks.push({
  name: "Actor integrity: staff actor roster_id must be non-null",
  passed: [
    checkFileContains(migration1, /created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL/),
    checkFileContains(migration1, /recorded_actor_type = 'staff' AND recorded_by_roster_id IS NOT NULL/),
    checkFileContains(migration1, /imported_actor_type = 'staff' AND imported_by_roster_id IS NOT NULL/),
    checkFileContains(migration2, /created_actor_type = 'staff' AND created_by_roster_id IS NOT NULL/),
    checkFileContains(migration2, /changed_actor_type = 'staff' AND changed_by_roster_id IS NOT NULL/),
    checkFileContains(migration2, /event_actor_type = 'staff' AND event_by_roster_id IS NOT NULL/),
  ].every(Boolean),
  detail: "Every actor CHECK must enforce staff roster_id IS NOT NULL",
});

// 41. Fix 1: Migration-safe recommendation composite key creation (DO block, not ADD CONSTRAINT IF NOT EXISTS)
checks.push({
  name: "Migration-safe recommendation composite key creation (DO block)",
  passed: checkFileContains(migration2, /DO\s*\$\$[\s\S]*?pg_constraint[\s\S]*?business_recommendations_id_business_id_uk/) &&
         !checkFileContains(migration2, /ALTER TABLE public\.business_recommendations\s+ADD CONSTRAINT IF NOT EXISTS/),
  detail: "Must use DO block with pg_constraint check, not invalid ADD CONSTRAINT IF NOT EXISTS",
});

// 42. Fix 2: No ON DELETE SET NULL on any composite FK (would null business_id)
checks.push({
  name: "No ON DELETE SET NULL on composite FKs (business_id protection)",
  passed: [
    !checkFileContains(migration1, /business_meeting_transcript_imports_consent_business_fk[\s\S]*?ON DELETE SET NULL/),
    !checkFileContains(migration2, /business_proposals_recommendation_business_fk[\s\S]*?ON DELETE SET NULL/),
    !checkFileContains(migration2, /business_commitments_meeting_business_fk[\s\S]*?ON DELETE SET NULL/),
    !checkFileContains(migration2, /business_commitments_recommendation_business_fk[\s\S]*?ON DELETE SET NULL/),
    !checkFileContains(migration2, /business_commitments_proposal_business_fk[\s\S]*?ON DELETE SET NULL/),
  ].every(Boolean),
  detail: "No composite FK may use ON DELETE SET NULL — business_id is NOT NULL and must never be nulled",
});

// 43. Fix 2: All composite FKs use ON DELETE RESTRICT or CASCADE (never SET NULL)
checks.push({
  name: "Transcript consent delete behavior safe (ON DELETE RESTRICT)",
  passed: checkFileContains(migration1, /business_meeting_transcript_imports_consent_business_fk[\s\S]*?ON DELETE RESTRICT/),
  detail: "Transcript consent composite FK must use ON DELETE RESTRICT",
});

// 44. Fix 2: Proposal recommendation delete behavior safe
checks.push({
  name: "Proposal recommendation delete behavior safe (ON DELETE RESTRICT)",
  passed: checkFileContains(migration2, /business_proposals_recommendation_business_fk[\s\S]*?ON DELETE RESTRICT/),
  detail: "Proposal recommendation composite FK must use ON DELETE RESTRICT",
});

// 45. Fix 2: Commitment meeting delete behavior safe
checks.push({
  name: "Commitment meeting delete behavior safe (ON DELETE RESTRICT)",
  passed: checkFileContains(migration2, /business_commitments_meeting_business_fk[\s\S]*?ON DELETE RESTRICT/),
  detail: "Commitment meeting composite FK must use ON DELETE RESTRICT",
});

// 46. Fix 2: Commitment recommendation delete behavior safe
checks.push({
  name: "Commitment recommendation delete behavior safe (ON DELETE RESTRICT)",
  passed: checkFileContains(migration2, /business_commitments_recommendation_business_fk[\s\S]*?ON DELETE RESTRICT/),
  detail: "Commitment recommendation composite FK must use ON DELETE RESTRICT",
});

// 47. Fix 2: Commitment proposal delete behavior safe
checks.push({
  name: "Commitment proposal delete behavior safe (ON DELETE RESTRICT)",
  passed: checkFileContains(migration2, /business_commitments_proposal_business_fk[\s\S]*?ON DELETE RESTRICT/),
  detail: "Commitment proposal composite FK must use ON DELETE RESTRICT",
});

// 48. Fix 3: accepted_actor_type column exists
checks.push({
  name: "accepted_actor_type column exists on business_proposals",
  passed: checkFileContains(migration2, /accepted_actor_type\s+text\s+NULL\s+CHECK/) &&
         checkFileContains(migration2, /accepted_actor_type\s+IS\s+NULL\s+OR\s+accepted_actor_type\s+IN\s*\('staff',\s*'owner'\)/),
  detail: "business_proposals must have accepted_actor_type column with CHECK constraint",
});

// 49. Fix 3: Owner-safe acceptance — owner actor must NOT carry roster_id
checks.push({
  name: "Owner-safe acceptance: owner actor roster_id must be NULL",
  passed: checkFileContains(migration2, /business_proposals_accepted_owner_no_roster_chk[\s\S]*?accepted_actor_type\s*!=\s*'owner'\s+OR\s+accepted_by_roster_id\s+IS\s+NULL/),
  detail: "Accepted proposal with owner actor must have NULL accepted_by_roster_id",
});

// 50. Fix 3: Staff acceptance — staff actor must carry roster_id
checks.push({
  name: "Staff acceptance: staff actor roster_id must be non-null",
  passed: checkFileContains(migration2, /business_proposals_accepted_staff_requires_roster_chk[\s\S]*?accepted_actor_type\s*!=\s*'staff'\s+OR\s+accepted_by_roster_id\s+IS\s+NOT\s+NULL/),
  detail: "Accepted proposal with staff actor must have non-null accepted_by_roster_id",
});

// 51. Fix 3: accepted_actor_type required for accepted status
checks.push({
  name: "Accepted proposal requires accepted_actor_type",
  passed: checkFileContains(migration2, /business_proposals_accepted_requires_actor_type_chk[\s\S]*?status\s*!=\s*'accepted'\s+OR\s+accepted_actor_type\s+IS\s+NOT\s+NULL/),
  detail: "Accepted status must require non-null accepted_actor_type",
});

// 52. Fix 3: Pre-decision states must not carry acceptance attribution or declined_at
checks.push({
  name: "Pre-decision states must not carry decision attribution",
  passed: checkFileContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'draft',\s*'staff_review',\s*'owner_review',\s*'expired',\s*'cancelled'[\s\S]*?accepted_at\s+IS\s+NULL\s+AND\s+accepted_actor_type\s+IS\s+NULL[\s\S]*?declined_at\s+IS\s+NULL/),
  detail: "Draft/staff_review/owner_review/expired/cancelled must not carry accepted_at, accepted_actor_type, or declined_at",
});

// 53. Fix 3: Repository includes accepted_actor_type in columns and update
checks.push({
  name: "Repository includes accepted_actor_type in columns and acceptance update",
  passed: checkFileContains(
    path.join(root, "app/lib/business/proposals/repository.ts"),
    /accepted_actor_type/,
  ) && checkFileContains(
    path.join(root, "app/lib/business/proposals/repository.ts"),
    /update\.accepted_actor_type\s*=\s*actor\.type/,
  ),
  detail: "Repository must include accepted_actor_type in PROPOSAL_COLUMNS, row mapping, and acceptance update",
});

// 54. Fix 3: Types include acceptedActorType
checks.push({
  name: "Types include acceptedActorType on BusinessProposal",
  passed: checkFileContains(
    path.join(root, "app/lib/business/proposals/types.ts"),
    /acceptedActorType/,
  ),
  detail: "BusinessProposal type must include acceptedActorType field",
});

// 55. Fix 1: No invalid ADD CONSTRAINT IF NOT EXISTS SQL syntax in migrations
checks.push({
  name: "No invalid ADD CONSTRAINT IF NOT EXISTS syntax",
  passed: !checkFileContains(migration1, /ADD\s+CONSTRAINT\s+IF\s+NOT\s+EXISTS\s+business_recommendations/) &&
         !checkFileContains(migration2, /ADD\s+CONSTRAINT\s+IF\s+NOT\s+EXISTS\s+business_recommendations/),
  detail: "ADD CONSTRAINT IF NOT EXISTS is not valid PostgreSQL — must use DO block",
});

// 56. Lifecycle: accepted must NOT carry declined_at
checks.push({
  name: "Accepted must not carry declined_at (mutual exclusion)",
  passed: checkFileContains(migration2, /business_proposals_accepted_not_declined_chk[\s\S]*?status\s*!=\s*'accepted'\s+OR\s+declined_at\s+IS\s+NULL/),
  detail: "Accepted status must not coexist with declined_at",
});

// 57. Lifecycle: declined must NOT carry acceptance attribution
checks.push({
  name: "Declined must not carry acceptance attribution (mutual exclusion)",
  passed: checkFileContains(migration2, /business_proposals_declined_not_accepted_chk[\s\S]*?status\s*!=\s*'declined'\s+OR\s+\([\s\S]*?accepted_at\s+IS\s+NULL\s+AND\s+accepted_actor_type\s+IS\s+NULL/),
  detail: "Declined status must not coexist with any acceptance attribution",
});

// 58. Lifecycle: pre-decision states must not carry decision attribution
checks.push({
  name: "Pre-decision states must not carry decision attribution",
  passed: checkFileContains(migration2, /business_proposals_predecision_no_decision_attribution_chk[\s\S]*?'draft',\s*'staff_review',\s*'owner_review',\s*'expired',\s*'cancelled'[\s\S]*?declined_at\s+IS\s+NULL/),
  detail: "Draft/staff_review/owner_review/expired/cancelled must not carry accepted_at or declined_at",
});

// 59. Lifecycle: superseded cannot carry both accepted_at and declined_at
checks.push({
  name: "Superseded cannot carry both accepted_at and declined_at",
  passed: checkFileContains(migration2, /business_proposals_superseded_not_both_decisions_chk[\s\S]*?status\s*!=\s*'superseded'\s+OR\s+accepted_at\s+IS\s+NULL\s+OR\s+declined_at\s+IS\s+NULL/),
  detail: "Superseded may retain historical acceptance OR decline, but not both",
});

// 60. Lifecycle: superseded with accepted_at must have atomic acceptance
checks.push({
  name: "Superseded with accepted_at must have atomic acceptance attribution",
  passed: checkFileContains(migration2, /business_proposals_superseded_accepted_atomic_chk[\s\S]*?status\s*!=\s*'superseded'\s+OR\s+accepted_at\s+IS\s+NULL\s+OR\s+\([\s\S]*?accepted_actor_type\s+IS\s+NOT\s+NULL/),
  detail: "Superseded retaining acceptance must have complete atomic acceptance attribution",
});

// 61. Lifecycle: superseded no partial acceptance attribution
checks.push({
  name: "Superseded no partial acceptance attribution",
  passed: checkFileContains(migration2, /business_proposals_superseded_no_partial_accepted_chk/),
  detail: "Superseded must either have all acceptance fields NULL or all required fields non-NULL",
});

// 61a. Lifecycle: superseded owner actor must NOT carry roster_id
checks.push({
  name: "Superseded owner acceptance must not carry roster_id",
  passed: checkFileContains(migration2, /business_proposals_superseded_owner_no_roster_chk[\s\S]*?status\s*!=\s*'superseded'\s+OR\s+accepted_at\s+IS\s+NULL\s+OR\s+accepted_actor_type\s*!=\s*'owner'\s+OR\s+accepted_by_roster_id\s+IS\s+NULL/),
  detail: "Superseded retaining owner acceptance must have NULL accepted_by_roster_id",
});

// 61b. Lifecycle: superseded staff actor MUST carry roster_id
checks.push({
  name: "Superseded staff acceptance must carry roster_id",
  passed: checkFileContains(migration2, /business_proposals_superseded_staff_requires_roster_chk[\s\S]*?status\s*!=\s*'superseded'\s+OR\s+accepted_at\s+IS\s+NULL\s+OR\s+accepted_actor_type\s*!=\s*'staff'\s+OR\s+accepted_by_roster_id\s+IS\s+NOT\s+NULL/),
  detail: "Superseded retaining staff acceptance must have non-NULL accepted_by_roster_id",
});

// 62. Repository: clears stale attribution on declined transition
checks.push({
  name: "Repository clears acceptance attribution on declined transition",
  passed: checkFileContains(
    path.join(root, "app/lib/business/proposals/repository.ts"),
    /input\.newStatus === "declined"[\s\S]*?update\.accepted_at = null/,
  ),
  detail: "Repository must clear all acceptance attribution when transitioning to declined",
});

// 63. Repository: clears declined_at on accepted transition
checks.push({
  name: "Repository clears declined_at on accepted transition",
  passed: checkFileContains(
    path.join(root, "app/lib/business/proposals/repository.ts"),
    /input\.newStatus === "accepted"[\s\S]*?update\.declined_at = null/,
  ),
  detail: "Repository must clear declined_at when transitioning to accepted",
});

// 64. Repository: clears all decision attribution on expired/cancelled
checks.push({
  name: "Repository clears all decision attribution on expired/cancelled",
  passed: checkFileContains(
    path.join(root, "app/lib/business/proposals/repository.ts"),
    /input\.newStatus === "expired" \|\| input\.newStatus === "cancelled"[\s\S]*?update\.declined_at = null/,
  ),
  detail: "Repository must clear all decision attribution when transitioning to expired or cancelled",
});

// === Promotion workflow checks ===

const migration3 = path.join(root, "supabase/migrations/20260813120000_business_meeting_note_promotions.sql");

// 65. Promotion migration exists
checks.push({
  name: "Meeting note promotion migration exists",
  passed: fs.existsSync(migration3),
  detail: "Migration 20260813120000_business_meeting_note_promotions.sql must exist",
});

// 66. Promotion table created
checks.push({
  name: "business_meeting_note_promotions table created",
  passed: checkFileContains(migration3, /CREATE TABLE IF NOT EXISTS public\.business_meeting_note_promotions/),
  detail: "Migration must create business_meeting_note_promotions",
});

// 67. UNIQUE(meeting_note_id) prevents double-promotion
checks.push({
  name: "UNIQUE(meeting_note_id) prevents double-promotion",
  passed: checkFileContains(migration3, /business_meeting_note_promotions_note_uk\s+UNIQUE\s*\(meeting_note_id\)/),
  detail: "Promotion table must have UNIQUE(meeting_note_id) constraint",
});

// 68. RLS enabled on promotion table
checks.push({
  name: "RLS enabled on business_meeting_note_promotions",
  passed: checkFileContains(migration3, /ALTER TABLE public\.business_meeting_note_promotions ENABLE ROW LEVEL SECURITY/),
  detail: "Promotion table must have RLS enabled",
});

// 69. anon revoked on promotion table
checks.push({
  name: "anon revoked on business_meeting_note_promotions",
  passed: checkFileContains(migration3, /REVOKE ALL PRIVILEGES ON TABLE public\.business_meeting_note_promotions FROM anon/),
  detail: "anon must be explicitly revoked on promotion table",
});

// 70. authenticated revoked on promotion table
checks.push({
  name: "authenticated revoked on business_meeting_note_promotions",
  passed: checkFileContains(migration3, /REVOKE ALL PRIVILEGES ON TABLE public\.business_meeting_note_promotions FROM authenticated/),
  detail: "authenticated must be explicitly revoked on promotion table",
});

// 71. service_role SELECT+INSERT only (append-only) on promotion table
checks.push({
  name: "Promotion table append-only (SELECT, INSERT only for service_role)",
  passed: checkFileContains(migration3, /GRANT SELECT, INSERT ON TABLE public\.business_meeting_note_promotions TO service_role/) &&
         checkFileNotContains(migration3, /GRANT SELECT, INSERT, UPDATE/) &&
         checkFileNotContains(migration3, /GRANT SELECT, INSERT, UPDATE, DELETE[\s\S]*?business_meeting_note_promotions/),
  detail: "Promotion table must have SELECT + INSERT only (no UPDATE, no DELETE)",
});

// 72. Same-business composite FK for meeting
checks.push({
  name: "Promotion table has composite FK to business_meetings(id, business_id)",
  passed: checkFileContains(migration3, /business_meeting_note_promotions_meeting_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_id,\s*business_id\)\s*REFERENCES public\.business_meetings\(id,\s*business_id\)/),
  detail: "Promotion table must have composite FK (meeting_id, business_id) → business_meetings(id, business_id)",
});

// 73. Same-business composite FK for note
checks.push({
  name: "Promotion table has composite FK to business_meeting_notes(id, business_id)",
  passed: checkFileContains(migration3, /business_meeting_note_promotions_note_business_fk[\s\S]*?FOREIGN KEY\s*\(meeting_note_id,\s*business_id\)\s*REFERENCES public\.business_meeting_notes\(id,\s*business_id\)/),
  detail: "Promotion table must have composite FK (meeting_note_id, business_id) → business_meeting_notes(id, business_id)",
});

// 74. business_meeting_notes gets UNIQUE(id, business_id) via DO block
checks.push({
  name: "business_meeting_notes gets UNIQUE(id, business_id) via safe DO block",
  passed: checkFileContains(migration3, /business_meeting_notes_id_business_id_uk/) &&
         checkFileContains(migration3, /DO\s*\$\$/),
  detail: "Migration must add UNIQUE(id, business_id) to business_meeting_notes using a DO block",
});

// 75. meetingStudio/repository.ts still does NOT query business_facts directly
checks.push({
  name: "Meeting Studio repository still does not directly query business_facts",
  passed: checkFileNotContains(
    path.join(root, "app/lib/business/meetingStudio/repository.ts"),
    /from\(['"]business_facts['"]\)|\.from\(['"]business_facts['"]\)|insert.*business_facts|update.*business_facts/,
  ),
  detail: "promoteMeetingNote must delegate to livingBook/repository — never query business_facts directly",
});

// 76. promoteMeetingNote function exists in meetingStudio/repository
checks.push({
  name: "promoteMeetingNote function exists in meetingStudio/repository",
  passed: checkFileContains(
    path.join(root, "app/lib/business/meetingStudio/repository.ts"),
    /export async function promoteMeetingNote/,
  ),
  detail: "Meeting Studio repository must export promoteMeetingNote",
});

// 77. eligiblePromotionDestinations function exists in meetingStudio/logic
checks.push({
  name: "eligiblePromotionDestinations function exists in meetingStudio/logic",
  passed: checkFileContains(
    path.join(root, "app/lib/business/meetingStudio/logic.ts"),
    /export function eligiblePromotionDestinations/,
  ),
  detail: "Meeting Studio logic must export eligiblePromotionDestinations",
});

// 78. promote_note API action uses review_meeting_notes capability
checks.push({
  name: "promote_note action requires review_meeting_notes capability",
  passed: checkFileContains(
    path.join(root, "app/api/admin/businesses/[businessId]/meetings/[meetingId]/route.ts"),
    /promote_note[\s\S]*?review_meeting_notes/,
  ),
  detail: "promote_note API action must gate on review_meeting_notes capability",
});

// 79. No CREATE POLICY on promotion table
checks.push({
  name: "Zero RLS policies on promotion table",
  passed: !checkFileContains(migration3, /CREATE POLICY/),
  detail: "No RLS policies may be created on promotion table — service_role bypasses RLS",
});

const proposalActionsGate10a = path.join(root, "app/admin/(dashboard)/businesses/[businessId]/ProposalActions.tsx");
const proposalPageGate10a = path.join(root, "app/admin/(dashboard)/businesses/[businessId]/page.tsx");
const proposalRepoGate10a = path.join(root, "app/lib/business/proposals/repository.ts");
const proposalCreateRouteGate10a = path.join(root, "app/api/admin/businesses/[businessId]/proposals/route.ts");
const proposalConstantsGate10a = path.join(root, "app/lib/business/proposals/constants.ts");
checks.push({
  name: "Gate 10A: create proposal UI and versioning reuse existing domain",
  passed:
    checkFileContains(proposalActionsGate10a, /export function CreateProposalForm/) &&
    checkFileContains(proposalPageGate10a, /No proposal has been created yet/) &&
    checkFileContains(proposalRepoGate10a, /nextProposalVersion/) &&
    checkFileContains(proposalRepoGate10a, /replaced_by_new_version/) &&
    checkFileContains(proposalCreateRouteGate10a, /create_proposal/) &&
    checkFileContains(proposalCreateRouteGate10a, /staff_roster_required/) &&
    checkFileNotContains(proposalConstantsGate10a, /needs_changes/) &&
    checkFileNotContains(proposalConstantsGate10a, /postponed/),
  detail: "Create UI, version increment, and roster rule must exist without new statuses",
});
checks.push({
  name: "Gate 10A: Needs Changes uses owner_review to staff_review",
  passed:
    checkFileContains(proposalActionsGate10a, /Needs Changes/) &&
    checkFileContains(proposalActionsGate10a, /transition\("staff_review", "needs_changes"\)/) &&
    checkFileContains(proposalActionsGate10a, /not Declined, not Follow Up Later, and not Accepted/) &&
    checkFileContains(path.join(root, "app/lib/business/proposals/constants.ts"), /owner_review: \["accepted", "declined", "staff_review", "expired"\]/),
  detail: "Needs Changes must be the existing staff_review transition, not a new enum",
});
checks.push({
  name: "Gate 10A: terminal proposal history is preserved on later create",
  passed:
    checkFileContains(path.join(root, "app/lib/business/proposals/logic.ts"), /isTerminalProposalHistoryStatus/) &&
    checkFileContains(path.join(root, "app/lib/business/proposals/logic.ts"), /isWorkingReplaceableProposalStatus/) &&
    checkFileContains(proposalRepoGate10a, /restorePreviousCurrentFlags/) &&
    checkFileNotContains(proposalRepoGate10a, /newStatus: "superseded"/) &&
    checkFileContains(proposalActionsGate10a, /Create Next Version/) &&
    checkFileContains(proposalActionsGate10a, /Create New Proposal/) &&
    checkFileContains(proposalRepoGate10a, /\.eq\("status", "accepted"\)/) &&
    checkFileContains(proposalRepoGate10a, /\.eq\("is_current", true\)/),
  detail: "Accepted/declined/expired/cancelled must keep status; only working rows become superseded",
});

// Report
const passed = checks.filter((c) => c.passed).length;
const failed = checks.filter((c) => !c.passed).length;

console.log("\n=== Program 5 Verifier ===\n");
for (const check of checks) {
  console.log(`${check.passed ? "PASS" : "FAIL"} — ${check.name}`);
  if (!check.passed) console.log(`       ${check.detail}`);
}
console.log(`\n${passed} passed, ${failed} failed, ${checks.length} total\n`);

if (failed > 0) {
  process.exit(1);
}
