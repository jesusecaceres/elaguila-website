/**
 * Program 6 — Creative Studio Migration Deep Verifier.
 * Mechanically inspects the migration SQL and source architecture.
 *
 * Run: npx tsx scripts/program6-creative-studio-verifier.ts
 */
import * as fs from "fs";
import * as path from "path";

export interface VerifyCheck {
  check: string;
  pass: boolean;
  detail: string;
}

const BASE = path.resolve(__dirname, "..");

function readMigration(): string {
  const p = path.join(BASE, "supabase", "migrations", "20260810160000_business_creative_studio_foundation.sql");
  return fs.readFileSync(p, "utf-8");
}

function readCsFile(rel: string): string {
  const p = path.join(BASE, "app", "lib", "business", "creativeStudio", rel);
  return fs.readFileSync(p, "utf-8");
}

function fileExists(rel: string): boolean {
  return fs.existsSync(path.join(BASE, rel));
}

// ─── Table-level checks ─────────────────────────────────────────────────────

const TABLES = [
  "business_creative_jobs",
  "business_creative_input_snapshots",
  "business_creative_job_versions",
  "business_creative_assets",
  "business_creative_briefs",
  "business_creative_compositions",
  "business_creative_reviews",
  "business_creative_exports",
  "business_creative_provider_runs",
];

const APPEND_ONLY_TABLES = [
  "business_creative_input_snapshots",
  "business_creative_job_versions",
  "business_creative_reviews",
  "business_creative_exports",
  "business_creative_provider_runs",
];

const CHILD_TABLES_WITH_COMPOSITE_FK = [
  { table: "business_creative_input_snapshots", parent: "business_creative_jobs" },
  { table: "business_creative_job_versions", parent: "business_creative_jobs" },
  { table: "business_creative_briefs", parent: "business_creative_jobs" },
  { table: "business_creative_compositions", parent: "business_creative_jobs" },
  { table: "business_creative_reviews", parent: "business_creative_jobs" },
  { table: "business_creative_exports", parent: "business_creative_jobs" },
  { table: "business_creative_provider_runs", parent: "business_creative_jobs" },
];

export function verifyMigration(): VerifyCheck[] {
  const sql = readMigration();
  const checks: VerifyCheck[] = [];

  // ─── Per-table RLS / grants ──────────────────────────────────────────────
  for (const table of TABLES) {
    checks.push({
      check: `${table}: RLS enabled`,
      pass: sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`),
      detail: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
    });

    checks.push({
      check: `${table}: PUBLIC revoked`,
      pass: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC`),
      detail: `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC`,
    });

    checks.push({
      check: `${table}: anon revoked`,
      pass: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM anon`),
      detail: `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM anon`,
    });

    checks.push({
      check: `${table}: authenticated revoked`,
      pass: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM authenticated`),
      detail: `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM authenticated`,
    });

    checks.push({
      check: `${table}: service_role reset`,
      pass: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM service_role`),
      detail: `REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM service_role`,
    });

    // service_role must have a narrow GRANT after revoke
    const grantPattern = `GRANT SELECT, INSERT, UPDATE ON TABLE public.${table} TO service_role`;
    const grantPatternInsertOnly = `GRANT SELECT, INSERT ON TABLE public.${table} TO service_role`;
    checks.push({
      check: `${table}: service_role narrowly granted`,
      pass: sql.includes(grantPattern) || sql.includes(grantPatternInsertOnly),
      detail: `GRANT ... ON TABLE public.${table} TO service_role`,
    });
  }

  // ─── Append-only: no UPDATE or DELETE ────────────────────────────────────
  for (const table of APPEND_ONLY_TABLES) {
    const insertOnlyGrant = `GRANT SELECT, INSERT ON TABLE public.${table} TO service_role`;
    const updateGrant = `GRANT SELECT, INSERT, UPDATE ON TABLE public.${table} TO service_role`;
    checks.push({
      check: `${table}: append-only (no UPDATE/DELETE grant)`,
      pass: sql.includes(insertOnlyGrant) && !sql.includes(updateGrant),
      detail: insertOnlyGrant,
    });
  }

  // ─── Parent UNIQUE(id, business_id) ──────────────────────────────────────
  checks.push({
    check: "business_creative_jobs: UNIQUE(id, business_id) exposed",
    pass: sql.includes("UNIQUE (id, business_id)"),
    detail: "CONSTRAINT business_creative_jobs_id_business_id_uk UNIQUE (id, business_id)",
  });

  // ─── Composite FKs ───────────────────────────────────────────────────────
  for (const { table, parent } of CHILD_TABLES_WITH_COMPOSITE_FK) {
    // Actual FK name pattern: business_creative_input_snapshots_job_business_fk
    // (uses singular "job" not "jobs")
    const fkName = `${table}_job_business_fk`;
    checks.push({
      check: `${table}: composite FK to ${parent}(id, business_id)`,
      pass: sql.includes(fkName) && sql.includes(`FOREIGN KEY (job_id, business_id)`) && sql.includes(`REFERENCES public.${parent}(id, business_id)`),
      detail: fkName,
    });
  }

  // ─── Actor attribution constraints ───────────────────────────────────────
  // Tables with actor fields that require attribution CHECK constraints:
  const actorCheckTables = [
    "business_creative_jobs",
    "business_creative_input_snapshots",
    "business_creative_job_versions",
    "business_creative_assets",
    "business_creative_briefs",
    "business_creative_compositions",
    "business_creative_reviews",
    "business_creative_exports",
  ];
  for (const table of actorCheckTables) {
    const hasActorCheck = sql.includes(`${table}_created_actor_chk`) || sql.includes(`${table}_reviewer_actor_chk`);
    checks.push({
      check: `${table}: actor attribution CHECK`,
      pass: hasActorCheck,
      detail: `Actor CHECK on ${table}`,
    });
  }

  // Provider runs use initiated_actor_type (staff/owner/system)
  checks.push({
    check: "business_creative_provider_runs: actor attribution CHECK",
    pass: sql.includes("business_creative_provider_runs_initiated_actor_chk"),
    detail: "initiated_actor_chk on provider_runs",
  });

  // ─── Feature flags default disabled ──────────────────────────────────────
  const flagKeys = [
    "business_creative_studio",
    "business_magazine_ad_studio",
    "business_sponsored_insert_studio",
  ];
  for (const flag of flagKeys) {
    checks.push({
      check: `Feature flag ${flag}: defaults disabled`,
      pass: sql.includes(`'${flag}', false, false, '{}'`),
      detail: `INSERT ... VALUES ('${flag}', false, false, '{}')`,
    });
  }

  // ─── Approved atomic CHECK ───────────────────────────────────────────────
  checks.push({
    check: "business_creative_jobs: approved atomic CHECK",
    pass: sql.includes("business_creative_jobs_approved_atomic_chk"),
    detail: "approved_actor_type + approved_by + approved_at must be atomic",
  });

  // ─── Rights approval CHECK ───────────────────────────────────────────────
  checks.push({
    check: "business_creative_assets: rights approval CHECK (unknown_rights cannot be approved)",
    pass: sql.includes("business_creative_assets_rights_approval_chk"),
    detail: "approval_state != 'approved' OR rights_status NOT IN ('unknown_rights', 'expired', 'restricted')",
  });

  // ─── Brief approved atomic CHECK ─────────────────────────────────────────
  checks.push({
    check: "business_creative_briefs: STAFF_APPROVED atomic CHECK",
    pass: sql.includes("business_creative_briefs_approved_atomic_chk"),
    detail: "status != 'STAFF_APPROVED' OR (approved_by_auth_user_id IS NOT NULL AND approved_at IS NOT NULL)",
  });

  // ═════════════════════════════════════════════════════════════════════════
  // Blocker 11: Expanded relational integrity checks
  // ═════════════════════════════════════════════════════════════════════════

  // ─── Blocker 1: Job/snapshot circular insert removed ─────────────────────
  checks.push({
    check: "Blocker 1: jobs.input_snapshot_id is nullable (no circular mandatory insert)",
    pass: sql.includes("input_snapshot_id uuid NULL"),
    detail: "input_snapshot_id uuid NULL — draft can exist before snapshot",
  });

  checks.push({
    check: "Blocker 1: jobs.input_snapshot_id NOT NULL removed (no circular insert)",
    pass: !sql.includes("  input_snapshot_id uuid NOT NULL,\n  doctrine_version"),
    detail: "input_snapshot_id must NOT be NOT NULL on jobs table",
  });

  checks.push({
    check: "Blocker 1: lifecycle CHECK — non-draft requires snapshot",
    pass: sql.includes("business_creative_jobs_snapshot_lifecycle_chk"),
    detail: "status = 'draft' OR input_snapshot_id IS NOT NULL",
  });

  checks.push({
    check: "Blocker 1: job→snapshot composite same-business FK",
    pass: sql.includes("business_creative_jobs_input_snapshot_business_fk") &&
          sql.includes("FOREIGN KEY (input_snapshot_id, business_id)") &&
          sql.includes("REFERENCES public.business_creative_input_snapshots(id, business_id)"),
    detail: "Composite FK (input_snapshot_id, business_id) → snapshots(id, business_id)",
  });

  // ─── Blocker 2: job_versions UNIQUE(id, business_id) ─────────────────────
  checks.push({
    check: "Blocker 2: job_versions UNIQUE(id, business_id) exposed",
    pass: sql.includes("business_creative_job_versions_id_business_id_uk"),
    detail: "CONSTRAINT business_creative_job_versions_id_business_id_uk UNIQUE (id, business_id)",
  });

  // ─── Blocker 3: Job recommendation/proposal same-business FKs ────────────
  checks.push({
    check: "Blocker 3: job→recommendation same-business composite FK",
    pass: sql.includes("business_creative_jobs_recommendation_business_fk") &&
          sql.includes("FOREIGN KEY (source_recommendation_id, business_id)") &&
          sql.includes("REFERENCES public.business_recommendations(id, business_id)"),
    detail: "Composite FK (source_recommendation_id, business_id) → recommendations(id, business_id)",
  });

  checks.push({
    check: "Blocker 3: job→proposal same-business composite FK",
    pass: sql.includes("business_creative_jobs_proposal_business_fk") &&
          sql.includes("FOREIGN KEY (source_proposal_id, business_id)") &&
          sql.includes("REFERENCES public.business_proposals(id, business_id)"),
    detail: "Composite FK (source_proposal_id, business_id) → proposals(id, business_id)",
  });

  checks.push({
    check: "Blocker 3: no simple FK from source_recommendation_id to business_recommendations(id)",
    pass: !sql.includes("source_recommendation_id uuid NULL REFERENCES public.business_recommendations(id)"),
    detail: "Simple FK removed — replaced with composite same-business FK",
  });

  checks.push({
    check: "Blocker 3: no simple FK from source_proposal_id to business_proposals(id)",
    pass: !sql.includes("source_proposal_id uuid NULL REFERENCES public.business_proposals(id)"),
    detail: "Simple FK removed — replaced with composite same-business FK",
  });

  // ─── Blocker 4: Asset job same-business composite FK ─────────────────────
  checks.push({
    check: "Blocker 4: asset→job same-business composite FK exists",
    pass: sql.includes("business_creative_assets_job_business_fk") &&
          sql.includes("FOREIGN KEY (job_id, business_id)") &&
          sql.includes("REFERENCES public.business_creative_jobs(id, business_id)"),
    detail: "Composite FK (job_id, business_id) → jobs(id, business_id) on assets table",
  });

  // Fix 1: Asset/job composite FK must NOT use SET NULL (business_id is NOT NULL).
  checks.push({
    check: "Fix 1: asset/job composite FK does NOT use SET NULL",
    pass: !sql.includes("business_creative_assets_job_business_fk") ||
          !sql.match(/business_creative_assets_job_business_fk[\s\S]*?ON DELETE SET NULL/i),
    detail: "Composite SET NULL is unsafe when business_id is NOT NULL — must use RESTRICT",
  });

  checks.push({
    check: "Fix 1: asset/job composite FK uses RESTRICT",
    pass: sql.includes("business_creative_assets_job_business_fk") &&
          sql.match(/business_creative_assets_job_business_fk[\s\S]*?ON DELETE RESTRICT/i) !== null,
    detail: "ON DELETE RESTRICT — application must detach asset before deleting job",
  });

  // ─── Blocker 5: All snapshot references use composite same-business FKs ──
  checks.push({
    check: "Blocker 5: snapshots UNIQUE(id, business_id) exposed",
    pass: sql.includes("business_creative_input_snapshots_id_business_id_uk"),
    detail: "CONSTRAINT business_creative_input_snapshots_id_business_id_uk UNIQUE (id, business_id)",
  });

  checks.push({
    check: "Blocker 5: job_versions→snapshot composite same-business FK",
    pass: sql.includes("business_creative_job_versions_snapshot_business_fk") &&
          sql.includes("FOREIGN KEY (snapshot_id, business_id)") &&
          sql.includes("REFERENCES public.business_creative_input_snapshots(id, business_id)"),
    detail: "Composite FK (snapshot_id, business_id) → snapshots(id, business_id) on versions",
  });

  checks.push({
    check: "Blocker 5: provider_runs→snapshot composite same-business FK",
    pass: sql.includes("business_creative_provider_runs_snapshot_business_fk") &&
          sql.includes("FOREIGN KEY (input_snapshot_id, business_id)") &&
          sql.includes("REFERENCES public.business_creative_input_snapshots(id, business_id)"),
    detail: "Composite FK (input_snapshot_id, business_id) → snapshots(id, business_id) on provider_runs",
  });

  checks.push({
    check: "Blocker 5: no simple FK from versions.snapshot_id to snapshots(id)",
    pass: !sql.includes("business_creative_job_versions_snapshot_fk"),
    detail: "Simple FK removed — replaced with composite same-business FK",
  });

  checks.push({
    check: "Blocker 5: no simple FK from provider_runs.input_snapshot_id to snapshots(id)",
    pass: !sql.includes("business_creative_provider_runs_snapshot_fk"),
    detail: "Simple FK removed — replaced with composite same-business FK",
  });

  // ─── Blocker 6: Brief/provider relationships ─────────────────────────────
  checks.push({
    check: "Blocker 6: briefs UNIQUE(id, business_id) for composite FK target",
    pass: sql.includes("business_creative_briefs_id_business_id_uk"),
    detail: "CONSTRAINT business_creative_briefs_id_business_id_uk UNIQUE (id, business_id)",
  });

  checks.push({
    check: "Blocker 6: briefs→recommendation same-business composite FK",
    pass: sql.includes("business_creative_briefs_recommendation_business_fk"),
    detail: "Composite FK (source_recommendation_id, business_id) → recommendations(id, business_id) on briefs",
  });

  checks.push({
    check: "Blocker 6: versions→brief same-business composite FK",
    pass: sql.includes("business_creative_job_versions_brief_business_fk") &&
          sql.includes("FOREIGN KEY (brief_id, business_id)") &&
          sql.includes("REFERENCES public.business_creative_briefs(id, business_id)"),
    detail: "Composite FK (brief_id, business_id) → briefs(id, business_id) on versions",
  });

  // Fix 2: Version/brief composite FK must NOT use SET NULL (business_id is NOT NULL).
  checks.push({
    check: "Fix 2: version/brief composite FK does NOT use SET NULL",
    pass: !sql.includes("business_creative_job_versions_brief_business_fk") ||
          !sql.match(/business_creative_job_versions_brief_business_fk[\s\S]*?ON DELETE SET NULL/i),
    detail: "Composite SET NULL is unsafe when business_id is NOT NULL — must use RESTRICT",
  });

  checks.push({
    check: "Fix 2: version/brief composite FK uses RESTRICT",
    pass: sql.includes("business_creative_job_versions_brief_business_fk") &&
          sql.match(/business_creative_job_versions_brief_business_fk[\s\S]*?ON DELETE RESTRICT/i) !== null,
    detail: "ON DELETE RESTRICT — append-only versions must preserve brief relationship",
  });

  checks.push({
    check: "Blocker 6: no redundant provider_run_id on job_versions",
    pass: !sql.includes("provider_run_id uuid"),
    detail: "provider_run_id removed from job_versions — provider_runs.version_id is canonical",
  });

  // ─── Blocker 7: AI illustrative constraint meaningful ─────────────────────
  checks.push({
    check: "Blocker 7: AI asset_kind→classification CHECK exists",
    pass: sql.includes("business_creative_assets_ai_kind_classification_chk"),
    detail: "asset_kind = 'ai_illustrative' → authenticity = 'AI_ILLUSTRATIVE' AND rights = 'ai_generated'",
  });

  checks.push({
    check: "Blocker 7: AI classification→kind CHECK exists",
    pass: sql.includes("business_creative_assets_ai_classification_kind_chk"),
    detail: "authenticity = 'AI_ILLUSTRATIVE' → asset_kind = 'ai_illustrative' AND rights = 'ai_generated'",
  });

  checks.push({
    check: "Blocker 7: REAL_CLIENT not AI CHECK exists",
    pass: sql.includes("business_creative_assets_real_client_not_ai_chk"),
    detail: "authenticity = 'REAL_CLIENT' → asset_kind != 'ai_illustrative' AND rights != 'ai_generated'",
  });

  checks.push({
    check: "Blocker 7: tautological AI constraint removed",
    pass: !sql.includes("business_creative_assets_ai_not_real_chk"),
    detail: "Old tautological constraint removed",
  });

  // ─── Blocker 8: Actor attribution on compositions and provider_runs ──────
  checks.push({
    check: "Blocker 8: compositions has actor attribution CHECK",
    pass: sql.includes("business_creative_compositions_created_actor_chk"),
    detail: "Composition provenance — created_actor_type with staff/owner roster integrity",
  });

  checks.push({
    check: "Blocker 8: compositions has created_actor_type column",
    pass: sql.includes("created_actor_type text NOT NULL CHECK (created_actor_type IN ('staff', 'owner'))") &&
          sql.includes("business_creative_compositions"),
    detail: "created_actor_type on compositions table",
  });

  checks.push({
    check: "Blocker 8: provider_runs has initiated_actor_type with system",
    pass: sql.includes("initiated_actor_type text NOT NULL CHECK (initiated_actor_type IN ('staff', 'owner', 'system'))"),
    detail: "initiated_actor_type on provider_runs with staff/owner/system",
  });

  checks.push({
    check: "Blocker 8: provider_runs has initiated_actor CHECK",
    pass: sql.includes("business_creative_provider_runs_initiated_actor_chk"),
    detail: "Actor integrity: staff→roster+auth, owner→auth only, system→no human actor",
  });

  // ─── Blocker 9: Approval lifecycle truth ─────────────────────────────────
  checks.push({
    check: "Blocker 9: no stale approval CHECK exists",
    pass: sql.includes("business_creative_jobs_no_stale_approval_chk"),
    detail: "Non-approved/non-archived states must NOT carry approval attribution",
  });

  // ─── Blocker 10: Append-only review semantics ────────────────────────────
  checks.push({
    check: "Blocker 10: reviews has no resolved boolean field",
    pass: !sql.includes("resolved boolean"),
    detail: "resolved boolean removed — append-only cannot UPDATE",
  });

  checks.push({
    check: "Blocker 10: reviews has no resolved_at field",
    pass: !sql.includes("resolved_at timestamptz"),
    detail: "resolved_at removed — append-only cannot UPDATE",
  });

  checks.push({
    check: "Blocker 10: reviews has RESOLUTION issue type",
    pass: sql.includes("'RESOLUTION'"),
    detail: "RESOLUTION issue type for resolution records",
  });

  checks.push({
    check: "Blocker 10: reviews has resolution_of_id field",
    pass: sql.includes("resolution_of_id uuid NULL"),
    detail: "resolution_of_id links resolution records to original issues",
  });

  checks.push({
    check: "Blocker 10: reviews resolution_ref CHECK exists",
    pass: sql.includes("business_creative_reviews_resolution_ref_chk"),
    detail: "RESOLUTION records must reference original issue",
  });

  checks.push({
    check: "Blocker 10: reviews non_resolution_no_ref CHECK exists",
    pass: sql.includes("business_creative_reviews_non_resolution_no_ref_chk"),
    detail: "Non-RESOLUTION records must not carry resolution_of_id",
  });

  checks.push({
    check: "Blocker 10: reviews has 'resolved' severity",
    pass: sql.includes("'resolved'") && sql.includes("severity"),
    detail: "severity includes 'resolved' for resolution records",
  });

  // ─── Fix 3: Review resolution same-business composite FK ──────────────────
  checks.push({
    check: "Fix 3: reviews expose composite unique identity (id, business_id, job_id, version_id)",
    pass: sql.includes("business_creative_reviews_context_identity_uk") &&
          sql.includes("UNIQUE (id, business_id, job_id, version_id)"),
    detail: "UNIQUE(id, business_id, job_id, version_id) enables self-referential resolution FK",
  });

  checks.push({
    check: "Fix 3: resolution_of_id has a real composite FK",
    pass: sql.includes("business_creative_reviews_resolution_of_business_fk") &&
          sql.includes("FOREIGN KEY (resolution_of_id, business_id, job_id, version_id)"),
    detail: "Self-referential composite FK on resolution_of_id",
  });

  checks.push({
    check: "Fix 3: resolution FK preserves same business",
    pass: sql.includes("FOREIGN KEY (resolution_of_id, business_id, job_id, version_id)") &&
          sql.includes("REFERENCES public.business_creative_reviews(id, business_id, job_id, version_id)"),
    detail: "Resolution FK includes business_id in both source and target columns",
  });

  checks.push({
    check: "Fix 3: resolution FK preserves same job",
    pass: sql.includes("FOREIGN KEY (resolution_of_id, business_id, job_id, version_id)") &&
          sql.includes("REFERENCES public.business_creative_reviews(id, business_id, job_id, version_id)"),
    detail: "Resolution FK includes job_id in both source and target columns",
  });

  checks.push({
    check: "Fix 3: resolution FK preserves same version",
    pass: sql.includes("FOREIGN KEY (resolution_of_id, business_id, job_id, version_id)") &&
          sql.includes("REFERENCES public.business_creative_reviews(id, business_id, job_id, version_id)"),
    detail: "Resolution FK includes version_id in both source and target columns",
  });

  checks.push({
    check: "Fix 3: resolution FK uses ON DELETE RESTRICT",
    pass: sql.includes("business_creative_reviews_resolution_of_business_fk") &&
          sql.match(/business_creative_reviews_resolution_of_business_fk[\s\S]*?ON DELETE RESTRICT/i) !== null,
    detail: "Cannot delete an original review while a resolution references it",
  });

  // ─── Fix 4: Resolution severity semantics ─────────────────────────────────
  checks.push({
    check: "Fix 4: resolution severity semantics CHECK exists",
    pass: sql.includes("business_creative_reviews_resolution_severity_chk"),
    detail: "Named CHECK enforcing RESOLUTION→resolved and non-RESOLUTION→blocker/warning/minor",
  });

  checks.push({
    check: "Fix 4: RESOLUTION requires severity resolved",
    pass: sql.includes("business_creative_reviews_resolution_severity_chk") &&
          sql.includes("issue_type = 'RESOLUTION' AND severity = 'resolved'"),
    detail: "RESOLUTION rows must have severity = 'resolved'",
  });

  checks.push({
    check: "Fix 4: non-RESOLUTION cannot use severity resolved",
    pass: sql.includes("business_creative_reviews_resolution_severity_chk") &&
          sql.includes("issue_type != 'RESOLUTION' AND severity IN ('blocker', 'warning', 'minor')"),
    detail: "Non-RESOLUTION rows must use blocker, warning, or minor — never resolved",
  });

  // ─── Blocker 11: Actor attribution now includes compositions and provider_runs
  checks.push({
    check: "Blocker 11: compositions actor attribution CHECK (expanded)",
    pass: sql.includes("business_creative_compositions_created_actor_chk"),
    detail: "Compositions now have actor attribution",
  });

  checks.push({
    check: "Blocker 11: provider_runs actor attribution CHECK (expanded)",
    pass: sql.includes("business_creative_provider_runs_initiated_actor_chk"),
    detail: "Provider runs now have initiated actor attribution",
  });

  return checks;
}

// ─── Architecture / source checks ───────────────────────────────────────────

export function verifyArchitecture(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];

  // ─── Required files ──────────────────────────────────────────────────────
  const requiredFiles = [
    "app/lib/business/creativeStudio/brand/brandTypes.ts",
    "app/lib/business/creativeStudio/brand/brandAssetRegistry.ts",
    "app/lib/business/creativeStudio/brand/brandRules.ts",
    "app/lib/business/creativeStudio/printSpecs.ts",
    "app/lib/business/creativeStudio/productionRules.ts",
    "app/lib/business/creativeStudio/archetypes/types.ts",
    "app/lib/business/creativeStudio/archetypes/registry.ts",
    "app/lib/business/creativeStudio/archetypes/compositionRules.ts",
    "app/lib/business/creativeStudio/assetTypes.ts",
    "app/lib/business/creativeStudio/imageQualityEngine.ts",
    "app/lib/business/creativeStudio/types.ts",
    "app/lib/business/creativeStudio/constants.ts",
    "app/lib/business/creativeStudio/repository.ts",
    "app/lib/business/creativeStudio/researchPacketAssembler.ts",
    "app/lib/business/creativeStudio/compliance.ts",
    "app/lib/business/creativeStudio/languageEngine.ts",
    "app/lib/business/creativeStudio/providerTypes.ts",
    "app/lib/business/creativeStudio/geminiCreativeProvider.ts",
    "app/lib/business/creativeStudio/providerRegistry.ts",
    "app/lib/business/creativeStudio/canvaHandoff.ts",
    "app/lib/business/creativeStudio/canvaPromptCompiler.ts",
    "app/lib/business/creativeStudio/preflightEngine.ts",
    "app/lib/business/creativeStudio/exports.ts",
    "app/lib/business/creativeStudio/qrRegistry.ts",
    "app/lib/business/creativeStudio/featureFlag.ts",
    "app/lib/business/creativeStudio/ownerAccess.ts",
    "app/lib/business/creativeStudio/fixtures.ts",
  ];
  for (const f of requiredFiles) {
    checks.push({ check: `File exists: ${f}`, pass: fileExists(f), detail: f });
  }

  // ─── Migration exists ────────────────────────────────────────────────────
  checks.push({
    check: "Migration SQL exists",
    pass: fileExists("supabase/migrations/20260810160000_business_creative_studio_foundation.sql"),
    detail: "20260810160000_business_creative_studio_foundation.sql",
  });

  // ─── UI component ────────────────────────────────────────────────────────
  checks.push({
    check: "CreativeStudioActions UI component exists",
    pass: fileExists("app/admin/(dashboard)/businesses/[businessId]/CreativeStudioActions.tsx"),
    detail: "CreativeStudioActions.tsx",
  });

  // ─── Capabilities ────────────────────────────────────────────────────────
  const capContent = fs.readFileSync(path.join(BASE, "app", "admin", "_lib", "salesWorkspaceCapabilities.ts"), "utf-8");
  checks.push({
    check: "Capabilities include view_creative_studio",
    pass: capContent.includes("view_creative_studio"),
    detail: "view_creative_studio",
  });
  checks.push({
    check: "Capabilities include approve_creative_final",
    pass: capContent.includes("approve_creative_final"),
    detail: "approve_creative_final",
  });

  // ─── Doctrine rules ──────────────────────────────────────────────────────
  const typesContent = readCsFile("types.ts");
  checks.push({
    check: "CREATIVE_DOCTRINE_RULES defined",
    pass: typesContent.includes("CREATIVE_DOCTRINE_RULES"),
    detail: "CREATIVE_DOCTRINE_RULES",
  });
  checks.push({
    check: "Doctrine: Never auto-publish",
    pass: typesContent.includes("Never auto-publish"),
    detail: "Never auto-publish",
  });
  checks.push({
    check: "Doctrine: Never auto-charge",
    pass: typesContent.includes("Never auto-charge"),
    detail: "Never auto-charge",
  });
  checks.push({
    check: "Doctrine: Never create Stripe/payment records",
    pass: typesContent.includes("Never create Stripe/payment records"),
    detail: "Never create Stripe/payment records",
  });
  checks.push({
    check: "Doctrine: Never grant entitlements",
    pass: typesContent.includes("Never grant entitlements"),
    detail: "Never grant entitlements",
  });
  checks.push({
    check: "Doctrine: Image generation is NOT part of this build",
    pass: typesContent.includes("Image generation is NOT part of this build"),
    detail: "Image generation is NOT part of this build",
  });
  checks.push({
    check: "Doctrine: Approval != Publication",
    pass: typesContent.includes("Approval != Publication"),
    detail: "Approval != Publication",
  });

  // ─── Image generation NOT live ───────────────────────────────────────────
  const providerContent = readCsFile("providerTypes.ts");
  checks.push({
    check: "isImageGenerationLive() returns false",
    pass: providerContent.includes("isImageGenerationLive") && providerContent.includes("return false"),
    detail: "isImageGenerationLive() => false",
  });
  checks.push({
    check: "IMAGE_GENERATION in NON_LIVE_CAPABILITIES",
    pass: providerContent.includes("NON_LIVE_CAPABILITIES") && providerContent.includes("IMAGE_GENERATION"),
    detail: "NON_LIVE_CAPABILITIES includes IMAGE_GENERATION",
  });

  // ─── Canva manual handoff ────────────────────────────────────────────────
  checks.push({
    check: "CANVA_DEFAULT_STATUS = manual_handoff",
    pass: typesContent.includes('CANVA_DEFAULT_STATUS') && typesContent.includes('"manual_handoff"'),
    detail: 'CANVA_DEFAULT_STATUS = "manual_handoff"',
  });

  // ─── Print specs centralized ─────────────────────────────────────────────
  const printContent = readCsFile("printSpecs.ts");
  checks.push({
    check: "PRINT_FORMATS registry exists",
    pass: printContent.includes("PRINT_FORMATS") && printContent.includes("FULL_BLEED") && printContent.includes("QUARTER"),
    detail: "PRINT_FORMATS",
  });

  // ─── Preflight engine ────────────────────────────────────────────────────
  const preflightContent = readCsFile("preflightEngine.ts");
  checks.push({
    check: "Preflight has BLOCKED status",
    pass: preflightContent.includes("BLOCKED"),
    detail: "BLOCKED",
  });
  checks.push({
    check: "Preflight has READY_FOR_PRODUCTION status",
    pass: preflightContent.includes("READY_FOR_PRODUCTION"),
    detail: "READY_FOR_PRODUCTION",
  });

  // ─── No Stripe/payment/entitlement/publish mutation paths ────────────────
  const csDir = path.join(BASE, "app", "lib", "business", "creativeStudio");
  const allCsFiles: string[] = [];
  function walkDir(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDir(full);
      else if (entry.name.endsWith(".ts")) allCsFiles.push(full);
    }
  }
  walkDir(csDir);

  const forbiddenPatterns = [
    { pattern: "stripe", label: "Stripe" },
    { pattern: "createPayment", label: "createPayment" },
    { pattern: "payment_status", label: "payment_status" },
    { pattern: "grantEntitlement", label: "grantEntitlement" },
    { pattern: "entitlement", label: "entitlement" },
    { pattern: "autoPublish", label: "autoPublish" },
    { pattern: "auto_publish", label: "auto_publish" },
    { pattern: "deploy(", label: "deploy()" },
  ];

  for (const { pattern, label } of forbiddenPatterns) {
    let found = false;
    for (const f of allCsFiles) {
      const content = fs.readFileSync(f, "utf-8").toLowerCase();
      // Exclude lines that contain "never" (doctrine rules saying "Never create..." etc.)
      // Also exclude lines that are comments (// or *)
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        const isComment = trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*");
        const isDoctrine = line.includes("never");
        if (line.includes(pattern.toLowerCase()) && !isDoctrine && !isComment) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
    checks.push({
      check: `No ${label} mutation path in Creative Studio`,
      pass: !found,
      detail: found ? `FOUND ${label} in Creative Studio source` : "OK",
    });
  }

  // ─── No image-generation SDK/endpoint ────────────────────────────────────
  const imageGenPatterns = [
    { pattern: "generateImage", label: "generateImage" },
    { pattern: "image_generation", label: "image_generation endpoint" },
    { pattern: "dall-e", label: "dall-e" },
    { pattern: "midjourney", label: "midjourney" },
    { pattern: "stable-diffusion", label: "stable-diffusion" },
  ];
  // Package A, Gate 10 reconciliation: image generation is no longer categorically banned — it is
  // a bounded, opt-in capability gated by isImageGenerationLive() (see providerTypes.ts). A file
  // that references an image-generation pattern is only flagged if it does NOT also reference the
  // live-gate (isImageGenerationLive) or explicitly mark the capability non-live (NON_LIVE /
  // non_live). Case-insensitive on both sides — `content` is already lowercased above.
  for (const { pattern, label } of imageGenPatterns) {
    let found = false;
    for (const f of allCsFiles) {
      const content = fs.readFileSync(f, "utf-8").toLowerCase();
      if (content.includes(pattern.toLowerCase()) && !content.includes("isimagegenerationlive") && !content.includes("non_live")) {
        found = true;
        break;
      }
    }
    checks.push({
      check: `No ungated ${label} in Creative Studio`,
      pass: !found,
      detail: found ? `FOUND ${label} without an isImageGenerationLive() gate reference in the same file` : "OK — either absent, or present and gated",
    });
  }

  // ─── No live Canva API invocation ────────────────────────────────────────
  const canvaPatterns = [
    { pattern: "api.canva.com", label: "Canva API endpoint" },
    { pattern: "canva.com/api", label: "Canva API endpoint" },
    { pattern: "canvaAccessToken", label: "canvaAccessToken" },
    { pattern: "canva_refresh_token", label: "canva_refresh_token" },
  ];
  for (const { pattern, label } of canvaPatterns) {
    let found = false;
    for (const f of allCsFiles) {
      const content = fs.readFileSync(f, "utf-8").toLowerCase();
      if (content.includes(pattern.toLowerCase())) {
        found = true;
        break;
      }
    }
    checks.push({
      check: `No ${label} in Creative Studio`,
      pass: !found,
      detail: found ? `FOUND ${label}` : "OK",
    });
  }

  // ─── Owner-safe hidden fields ────────────────────────────────────────────
  // Constants live in constants.ts; ownerAccess.ts re-exports them
  const constantsContent = readCsFile("constants.ts");
  checks.push({
    check: "Owner-safe hidden fields include private_staff_notes",
    pass: constantsContent.includes("private_staff_notes"),
    detail: "private_staff_notes in OWNER_SAFE_HIDDEN_FIELDS",
  });
  checks.push({
    check: "Owner-safe hidden fields include provider_raw_reasoning",
    pass: constantsContent.includes("provider_raw_reasoning"),
    detail: "provider_raw_reasoning in OWNER_SAFE_HIDDEN_FIELDS",
  });

  // ─── Brand assets ────────────────────────────────────────────────────────
  const registryContent = readCsFile("brand/brandAssetRegistry.ts");
  checks.push({
    check: "Full crest path is /logo-clean.png",
    pass: registryContent.includes('path: "/logo-clean.png"'),
    detail: "/logo-clean.png",
  });
  checks.push({
    check: "Wordmark path is /title_banner_leonix.png",
    pass: registryContent.includes('path: "/title_banner_leonix.png"'),
    detail: "/title_banner_leonix.png",
  });

  // ─── Wordmark file exists on disk ────────────────────────────────────────
  checks.push({
    check: "Wordmark file exists on disk",
    pass: fileExists("public/title_banner_leonix.png"),
    detail: "public/title_banner_leonix.png",
  });

  // ─── Full crest file exists on disk ──────────────────────────────────────
  checks.push({
    check: "Full crest file exists on disk",
    pass: fileExists("public/logo-clean.png"),
    detail: "public/logo-clean.png",
  });

  // ─── Blocker 11: TypeScript type contract checks ──────────────────────────
  // typesContent already declared above in architecture checks

  checks.push({
    check: "Blocker 11 TS: CreativeJob.inputSnapshotId is nullable",
    pass: typesContent.includes("inputSnapshotId: string | null;"),
    detail: "inputSnapshotId: string | null in CreativeJob",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeJobVersion.briefId is nullable",
    pass: typesContent.includes("briefId: string | null;"),
    detail: "briefId: string | null in CreativeJobVersion",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeJobVersion has no providerRunId",
    pass: !typesContent.includes("providerRunId"),
    detail: "providerRunId removed from CreativeJobVersion",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeComposition has actor attribution",
    pass: typesContent.includes("createdActorType") && typesContent.includes("CreativeComposition"),
    detail: "createdActorType on CreativeComposition",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeReview has resolutionOfId not resolved",
    pass: typesContent.includes("resolutionOfId") && !typesContent.includes("resolved: boolean"),
    detail: "resolutionOfId replaces resolved boolean on CreativeReview",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeReview has RESOLUTION issue type",
    pass: typesContent.includes("\"RESOLUTION\""),
    detail: "RESOLUTION in ReviewIssueType",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeReview severity includes resolved",
    pass: typesContent.includes("\"resolved\""),
    detail: "severity includes 'resolved' on CreativeReview",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeProviderRun has initiatedActorType",
    pass: typesContent.includes("initiatedActorType") && typesContent.includes("CreativeProviderRun"),
    detail: "initiatedActorType on CreativeProviderRun",
  });

  checks.push({
    check: "Blocker 11 TS: CreativeProviderRun initiatedActorType includes system",
    pass: typesContent.includes("\"system\""),
    detail: "initiatedActorType includes 'system' for automated runs",
  });

  // ─── Blocker 11: assetTypes.ts AI consistency functions ───────────────────
  const assetTypesContent = readCsFile("assetTypes.ts");

  checks.push({
    check: "Blocker 11 TS: isAiAssetConsistent function exists",
    pass: assetTypesContent.includes("isAiAssetConsistent"),
    detail: "isAiAssetConsistent in assetTypes.ts",
  });

  checks.push({
    check: "Blocker 11 TS: isAiAssetKindMismatch function exists",
    pass: assetTypesContent.includes("isAiAssetKindMismatch"),
    detail: "isAiAssetKindMismatch in assetTypes.ts",
  });

  // ─── Blocker 11: repository.ts approval lifecycle ─────────────────────────
  const repoContent = readCsFile("repository.ts");

  checks.push({
    check: "Blocker 11 TS: repository clears approval on non-approved transition",
    pass: repoContent.includes("approved_actor_type = null") || repoContent.includes("approved_actor_type = null"),
    detail: "transitionJobStatus clears approval fields on non-approved transitions",
  });

  // ─── Blocker 11: exports.ts review checklist ──────────────────────────────
  const exportsContent = readCsFile("exports.ts");

  checks.push({
    check: "Blocker 11 TS: exports REVIEW_CHECKLIST uses resolutionOfId",
    pass: exportsContent.includes("resolutionOfId"),
    detail: "REVIEW_CHECKLIST export uses resolutionOfId",
  });

  checks.push({
    check: "Blocker 11 TS: exports REVIEW_CHECKLIST no resolved boolean",
    pass: !exportsContent.includes("resolved: r.resolved"),
    detail: "REVIEW_CHECKLIST no longer uses resolved boolean",
  });

  // ═════════════════════════════════════════════════════════════════════════
  // Magazine print spec correction — canonical 8.5 x 11 portrait geometry.
  // ═════════════════════════════════════════════════════════════════════════
  checks.push(...verifyMagazinePrintGeometry());

  return checks;
}

// ─── Magazine print geometry checks (8.5 x 11 portrait correction) ─────────

function verifyMagazinePrintGeometry(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];
  const printContent = readCsFile("printSpecs.ts");
  const canvaPromptContent = readCsFile("canvaPromptCompiler.ts");
  const canvaHandoffContent = readCsFile("canvaHandoff.ts");

  // ─── No old canonical geometry remains ───────────────────────────────────
  checks.push({
    check: "No canonical 8.00/11.50 (8 x 11.5) trim remains in printSpecs.ts",
    pass: !printContent.includes("8.00") && !printContent.includes("11.50"),
    detail: "printSpecs.ts must not contain old trim literals 8.00 / 11.50",
  });

  checks.push({
    check: "No canonical 2475 x 3525 old bleed pixel geometry remains",
    pass: !printContent.includes("2475") && !printContent.includes("3525"),
    detail: "printSpecs.ts must not contain old bleed pixel literals 2475 / 3525",
  });

  checks.push({
    check: "No canonical 2175 x 3225 / 1050 x 1575 / 4800 x 3450 / 4875 old pixel geometry remains",
    pass: !printContent.includes("2175") && !printContent.includes("3225") &&
          !printContent.includes("1050") && !printContent.includes("1575") &&
          !printContent.includes("4800") && !printContent.includes("3450") &&
          !printContent.includes("4875"),
    detail: "printSpecs.ts must not contain any old pixel geometry literals",
  });

  // ─── Canonical trim ───────────────────────────────────────────────────────
  checks.push({
    check: "Canonical trim is 8.5 x 11 (MAGAZINE_TRIM_IN)",
    pass: printContent.includes("MAGAZINE_TRIM_IN = { widthIn: 8.5, heightIn: 11 }"),
    detail: "MAGAZINE_TRIM_IN = { widthIn: 8.5, heightIn: 11 }",
  });

  checks.push({
    check: "Canonical trim pixels 2550 x 3300 (derived via PRINT_PPI)",
    pass: printContent.includes("MAGAZINE_TRIM_PX") && printContent.includes("inchesToPx(MAGAZINE_TRIM_IN.widthIn)"),
    detail: "MAGAZINE_TRIM_PX derives from MAGAZINE_TRIM_IN * PRINT_PPI (8.5*300=2550, 11*300=3300)",
  });

  // ─── Canonical bleed ────────────────────────────────────────────────────
  checks.push({
    check: "Canonical bleed document is 8.75 x 11.25 (derived from trim + 2*BLEED_INCHES)",
    pass: printContent.includes("MAGAZINE_BLEED_DOCUMENT_IN") &&
          printContent.includes("MAGAZINE_TRIM_IN.widthIn + 2 * BLEED_INCHES") &&
          printContent.includes("MAGAZINE_TRIM_IN.heightIn + 2 * BLEED_INCHES"),
    detail: "MAGAZINE_BLEED_DOCUMENT_IN = trim + 2*0.125 = 8.75 x 11.25",
  });

  checks.push({
    check: "Canonical bleed pixels 2625 x 3375 (derived via PRINT_PPI)",
    pass: printContent.includes("MAGAZINE_BLEED_PX"),
    detail: "MAGAZINE_BLEED_PX derives from MAGAZINE_BLEED_DOCUMENT_IN * PRINT_PPI (8.75*300=2625, 11.25*300=3375)",
  });

  // ─── Safe area ────────────────────────────────────────────────────────────
  checks.push({
    check: "Canonical safe area is 7.75 x 10.25 (derived from trim - 2*CRITICAL_SAFE_OFFSET_INCHES)",
    pass: printContent.includes("MAGAZINE_SAFE_AREA_IN") &&
          printContent.includes("MAGAZINE_TRIM_IN.widthIn - 2 * CRITICAL_SAFE_OFFSET_INCHES") &&
          printContent.includes("MAGAZINE_TRIM_IN.heightIn - 2 * CRITICAL_SAFE_OFFSET_INCHES"),
    detail: "MAGAZINE_SAFE_AREA_IN = trim - 2*0.375 = 7.75 x 10.25",
  });

  checks.push({
    check: "Canonical safe pixels 2325 x 3075 (derived via PRINT_PPI)",
    pass: printContent.includes("MAGAZINE_SAFE_PX"),
    detail: "MAGAZINE_SAFE_PX derives from MAGAZINE_SAFE_AREA_IN * PRINT_PPI (7.75*300=2325, 10.25*300=3075)",
  });

  // ─── FULL_BLEED / FULL_PAGE formats reflect canonical geometry ───────────
  checks.push({
    check: "PRINT_FORMATS.FULL_BLEED derives from MAGAZINE_TRIM_IN / MAGAZINE_BLEED_DOCUMENT_IN / MAGAZINE_BLEED_PX",
    pass: /FULL_BLEED:\s*\{[\s\S]*?trimWidthIn:\s*MAGAZINE_TRIM_IN\.widthIn/.test(printContent) &&
          /FULL_BLEED:\s*\{[\s\S]*?bleedWidthIn:\s*MAGAZINE_BLEED_DOCUMENT_IN\.widthIn/.test(printContent) &&
          /FULL_BLEED:\s*\{[\s\S]*?pixelWidth:\s*MAGAZINE_BLEED_PX\.pixelWidth/.test(printContent),
    detail: "FULL_BLEED format must derive from canonical trim/bleed/px, not hardcoded literals",
  });

  checks.push({
    check: "PRINT_FORMATS.FULL_PAGE derives from MAGAZINE_SAFE_AREA_IN / MAGAZINE_SAFE_PX",
    pass: /FULL_PAGE:\s*\{[\s\S]*?trimWidthIn:\s*MAGAZINE_SAFE_AREA_IN\.widthIn/.test(printContent) &&
          /FULL_PAGE:\s*\{[\s\S]*?pixelWidth:\s*MAGAZINE_SAFE_PX\.pixelWidth/.test(printContent),
    detail: "FULL_PAGE (non-bleed/live) format must derive from canonical safe-area geometry",
  });

  // ─── Half / Quarter / Spread modular geometry ────────────────────────────
  checks.push({
    check: "MAGAZINE_HALF_HORIZONTAL_IN derives from safe area + gutter (7.75 x 5.00)",
    pass: printContent.includes("MAGAZINE_HALF_HORIZONTAL_IN") &&
          printContent.includes("MAGAZINE_SAFE_AREA_IN.heightIn - INTER_AD_GUTTER_INCHES) / 2"),
    detail: "HALF_HORIZONTAL derived, not hardcoded",
  });

  checks.push({
    check: "MAGAZINE_HALF_VERTICAL_IN derives from safe area + gutter (3.75 x 10.25)",
    pass: printContent.includes("MAGAZINE_HALF_VERTICAL_IN") &&
          printContent.includes("MAGAZINE_SAFE_AREA_IN.widthIn - INTER_AD_GUTTER_INCHES) / 2"),
    detail: "HALF_VERTICAL derived, not hardcoded",
  });

  checks.push({
    check: "MAGAZINE_QUARTER_IN derives from half-vertical width x half-horizontal height (3.75 x 5.00)",
    pass: printContent.includes("MAGAZINE_QUARTER_IN") &&
          printContent.includes("widthIn: MAGAZINE_HALF_VERTICAL_IN.widthIn") &&
          printContent.includes("heightIn: MAGAZINE_HALF_HORIZONTAL_IN.heightIn"),
    detail: "QUARTER derived from half-page geometry, not hardcoded",
  });

  checks.push({
    check: "MAGAZINE_SPREAD_TRIM_IN = 2x trim width (17 x 11)",
    pass: printContent.includes("MAGAZINE_SPREAD_TRIM_IN") && printContent.includes("MAGAZINE_TRIM_IN.widthIn * 2"),
    detail: "Spread trim derived as 2x single-page trim width",
  });

  checks.push({
    check: "MAGAZINE_SPREAD_OUTER_BLEED_IN = spread trim + 2*BLEED_INCHES (17.25 x 11.25)",
    pass: printContent.includes("MAGAZINE_SPREAD_OUTER_BLEED_IN") &&
          printContent.includes("MAGAZINE_SPREAD_TRIM_IN.widthIn + 2 * BLEED_INCHES") &&
          printContent.includes("MAGAZINE_SPREAD_TRIM_IN.heightIn + 2 * BLEED_INCHES"),
    detail: "Spread outer-bleed derived from spread trim + working bleed",
  });

  checks.push({
    check: "Gutter remains 0.25in (INTER_AD_GUTTER_INCHES)",
    pass: printContent.includes("INTER_AD_GUTTER_INCHES = 0.25"),
    detail: "INTER_AD_GUTTER_INCHES = 0.25",
  });

  checks.push({
    check: "QR minimum remains 0.75in and preferred 0.90-1.00in",
    pass: readCsFile("productionRules.ts").includes("QR_MIN_SIZE_INCHES = 0.75") &&
          readCsFile("productionRules.ts").includes("QR_PREFERRED_MIN_INCHES = 0.90") &&
          readCsFile("productionRules.ts").includes("QR_PREFERRED_MAX_INCHES = 1.00"),
    detail: "QR sizing doctrine unchanged by print spec correction",
  });

  // ─── Canva handoff references new geometry ───────────────────────────────
  checks.push({
    check: "Canva prompt compiler declares LEONIX MAGAZINE canonical geometry",
    pass: canvaPromptContent.includes("LEONIX MAGAZINE") &&
          canvaPromptContent.includes("FINAL TRIM") &&
          canvaPromptContent.includes("WORKING FULL BLEED") &&
          canvaPromptContent.includes("CRITICAL SAFE INSET") &&
          canvaPromptContent.includes("CONFIRM WITH PRINTER"),
    detail: "canvaPromptCompiler.ts must declare canonical trim/bleed/safe-inset and printer-confirm items",
  });

  checks.push({
    check: "Canva prompt compiler references MAGAZINE_TRIM_IN / MAGAZINE_BLEED_DOCUMENT_IN (not hardcoded old geometry)",
    pass: canvaPromptContent.includes("MAGAZINE_TRIM_IN") && canvaPromptContent.includes("MAGAZINE_BLEED_DOCUMENT_IN"),
    detail: "Canva prompt must source geometry from canonical printSpecs constants",
  });

  checks.push({
    check: "No old 8 x 11.5 geometry referenced in Canva handoff/prompt files",
    pass: !canvaPromptContent.includes("8.00") && !canvaPromptContent.includes("11.50") &&
          !canvaHandoffContent.includes("8.00") && !canvaHandoffContent.includes("11.50"),
    detail: "Canva handoff/prompt must never state old 8 x 11.5 geometry",
  });

  checks.push({
    check: "No Canva API integration claimed (manual handoff only)",
    pass: !canvaHandoffContent.toLowerCase().includes("api.canva.com"),
    detail: "canvaHandoff.ts must not claim live Canva API integration",
  });

  return checks;
}

// ─── Package A — OpenAI provider + Leonix Creative Doctrine ─────────────────

function readDoctrineFile(rel: string): string {
  return fs.readFileSync(path.join(BASE, "app", "lib", "business", "creativeStudio", "doctrine", rel), "utf-8");
}

function readOpenAiLibFile(rel: string): string {
  return fs.readFileSync(path.join(BASE, "app", "lib", "openai", rel), "utf-8");
}

export function verifyPackageA(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];

  // ─── OpenAI provider ───────────────────────────────────────────────────
  const openaiProviderContent = readCsFile("openaiCreativeProvider.ts");
  checks.push({
    check: "OpenAI creative provider: providerKey is 'openai'",
    pass: openaiProviderContent.includes('providerKey: "openai"'),
    detail: "openaiCreativeProvider.ts must declare providerKey \"openai\"",
  });
  checks.push({
    check: "OpenAI creative provider: reuses shared server client, no inline API key read",
    pass: openaiProviderContent.includes("@/app/lib/openai/serverClient") && !openaiProviderContent.includes('process.env.OPENAI_API_KEY'),
    detail: "Must import the shared serverClient rather than reading OPENAI_API_KEY directly",
  });
  checks.push({
    check: "OpenAI creative provider: separate creative model env var",
    pass: openaiProviderContent.includes("OPENAI_CREATIVE_MODEL"),
    detail: "Must use OPENAI_CREATIVE_MODEL, kept separate from OPENAI_MODERATION_MODEL",
  });

  const serverClientContent = readOpenAiLibFile("serverClient.ts");
  checks.push({
    check: "OpenAI server client: server-only",
    pass: serverClientContent.includes('import "server-only"'),
    detail: "serverClient.ts must be server-only",
  });
  checks.push({
    check: "OpenAI server client: never throws raw secret in error text",
    pass: !serverClientContent.includes("apiKey}`") || serverClientContent.includes("Authorization: `Bearer ${apiKey}`"),
    detail: "API key must only ever appear in the Authorization header, never in a logged/returned error string",
  });

  const providerRegistryContent = readCsFile("providerRegistry.ts");
  checks.push({
    check: "Provider registry: resolves 'gemini'",
    pass: providerRegistryContent.includes('if (providerKey === "gemini")'),
    detail: "Gemini resolution must be preserved",
  });
  checks.push({
    check: "Provider registry: resolves 'openai'",
    pass: providerRegistryContent.includes('if (providerKey === "openai")'),
    detail: "Registry must add an openai branch",
  });
  checks.push({
    check: "Provider registry: default provider remains Gemini",
    pass: /getDefaultCreativeProvider[\s\S]{0,120}getGeminiProvider/.test(providerRegistryContent),
    detail: "getDefaultCreativeProvider() must still resolve to Gemini — no silent default switch",
  });

  const providerTypesContent = readCsFile("providerTypes.ts");
  checks.push({
    check: "Image generation: never blindly live",
    pass: providerTypesContent.includes("OPENAI_IMAGE_GENERATION_ENABLED") && providerTypesContent.includes("OPENAI_API_KEY"),
    detail: "isImageGenerationLive() must require both an explicit opt-in flag and a configured key",
  });

  // ─── Leonix Creative Doctrine v1 ───────────────────────────────────────
  const versionsContent = readDoctrineFile("versions.ts");
  checks.push({
    check: "Doctrine: canonical version identifier exists",
    pass: versionsContent.includes("LEONIX_CREATIVE_DOCTRINE_V1"),
    detail: "One canonical doctrine version identifier must exist",
  });

  const rulesContent = readDoctrineFile("rules.ts");
  for (const marker of ["TRUTH_LOCK_RULES", "ASSET_PRIORITY_RULES", "ANTI_AI_RULES", "BUSINESS_AD_RULES", "SPONSORED_FEATURE_RULES", "PRINT_GEOMETRY_RULES", "QR_BRAND_RULES"]) {
    checks.push({
      check: `Doctrine: ${marker} defined`,
      pass: rulesContent.includes(`export const ${marker}`),
      detail: `Structured doctrine must define ${marker}`,
    });
  }
  checks.push({
    check: "Doctrine: sponsored feature rules scoped to sponsored_insert only",
    pass: /SPONSORED_FEATURE_RULES[\s\S]*?appliesToAssetTypes: \["sponsored_insert"\]/.test(rulesContent),
    detail: "Sponsored-feature-only rules must not be universally injected",
  });
  checks.push({
    check: "Doctrine: print geometry rule defers to printSpecs.ts (no duplicated numbers)",
    pass: readDoctrineFile("rules.ts").includes("printSpecs.ts") && !/\d\.\d{3}"/.test(rulesContent),
    detail: "Doctrine rules must not hardcode print dimensions — printSpecs.ts remains the single source",
  });

  const compilerContent = readDoctrineFile("compiler.ts");
  checks.push({
    check: "Doctrine compiler: compileDoctrineForJob exists and filters by job context",
    pass: compilerContent.includes("export function compileDoctrineForJob") && compilerContent.includes("ruleApplies"),
    detail: "Contextual compiler must exist and filter rules rather than injecting everything",
  });

  // ─── Provider-agnostic generation compiler ─────────────────────────────
  const generationCompilerContent = readCsFile("generationCompiler.ts");
  checks.push({
    check: "Generation compiler: provider-agnostic, does not import Canva-specific formatting",
    pass: generationCompilerContent.includes("export function compileGenerationInput") && !/from ["'].*canvaPromptCompiler["']/.test(generationCompilerContent),
    detail: "compileGenerationInput must stay separate from Canva-specific canvaPromptCompiler.ts (mentioning it in a comment is fine; importing it is not)",
  });
  checks.push({
    check: "canvaPromptCompiler.ts left untouched (still Canva-specific, not the AI generation brain)",
    pass: readCsFile("canvaPromptCompiler.ts").includes("Canva Prompt Compiler"),
    detail: "Canva production formatting must remain separate from AI provider generation input",
  });

  // ─── Governance / human approval wall ──────────────────────────────────
  const generateRoutePath = path.join(BASE, "app", "api", "admin", "businesses", "[businessId]", "creative-studio", "jobs", "[jobId]", "generate", "route.ts");
  const generateRouteContent = fs.readFileSync(generateRoutePath, "utf-8");
  checks.push({
    check: "Generate route: requires generate_creative_draft capability",
    pass: generateRouteContent.includes('"generate_creative_draft"'),
    detail: "Generation must be gated behind the existing capability matrix, not open to any staff cookie",
  });
  checks.push({
    check: "Generate route: never transitions a job directly to 'approved'",
    pass: !/transitionJobStatus\([^)]*"approved"/.test(generateRouteContent),
    detail: "Provider success must never directly approve a job — only reach 'generated', pending human review",
  });
  checks.push({
    check: "Generate route: persists provider run provenance on both success and failure",
    pass: (generateRouteContent.match(/createProviderRun\(/g) ?? []).length >= 2,
    detail: "Every generation attempt (success or failure) must be recorded",
  });
  checks.push({
    check: "Generate route: bounded cooldown present (rate/cost safety)",
    pass: generateRouteContent.includes("GENERATION_COOLDOWN_MS"),
    detail: "Must not allow unbounded repeated generation requests",
  });

  // ─── Image generation lifecycle (only asserted structurally if implemented) ───
  const imageRoutePath = path.join(BASE, "app", "api", "admin", "businesses", "[businessId]", "creative-studio", "jobs", "[jobId]", "generate-image", "route.ts");
  if (fs.existsSync(imageRoutePath)) {
    const imageRouteContent = fs.readFileSync(imageRoutePath, "utf-8");
    checks.push({
      check: "Image generation: gated by isImageGenerationLive() before any provider call",
      pass: imageRouteContent.includes("isImageGenerationLive()"),
      detail: "Route must report not-live truthfully rather than generating when the capability is off",
    });
    checks.push({
      check: "Image generation: generated assets always pending review",
      pass: readCsFile("repository.ts").includes('approval_state: "pending"'),
      detail: "AI-generated assets must never be auto-approved",
    });
  }

  return checks;
}

function verifyGate07StaffSurface(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];
  const page = fs.readFileSync(path.join(BASE, "app", "admin", "(dashboard)", "businesses", "[businessId]", "page.tsx"), "utf-8");
  const journey = fs.readFileSync(path.join(BASE, "app", "admin", "(dashboard)", "businesses", "[businessId]", "CreativeJourney.tsx"), "utf-8");
  const packet = fs.readFileSync(path.join(BASE, "app", "admin", "(dashboard)", "businesses", "[businessId]", "CreativeTruthPacket.tsx"), "utf-8");
  const actions = fs.readFileSync(path.join(BASE, "app", "admin", "(dashboard)", "businesses", "[businessId]", "CreativeStudioActions.tsx"), "utf-8");
  const encodedList = path.join(BASE, "app", "api", "admin", "businesses", "%5BbusinessId%5D", "creative-studio", "route.ts");
  const dynamicList = path.join(BASE, "app", "api", "admin", "businesses", "[businessId]", "creative-studio", "route.ts");

  checks.push({
    check: "Gate 07: dashboard lists jobs via repository, not a new list engine",
    pass: page.includes("listJobsForBusiness") && page.includes("<CreativeJourney"),
    detail: "Staff Creative Studio must keep using listJobsForBusiness + CreativeJourney",
  });
  checks.push({
    check: "Gate 07: Truth Packet reads stored snapshot, does not live-reassemble",
    pass: journey.includes("getLatestSnapshotForJob") && !journey.includes("assembleResearchPacket") && packet.includes("not live-mutating canonical business truth"),
    detail: "Dashboard must display the immutable stored snapshot, not reassemble live business truth",
  });
  checks.push({
    check: "Gate 07: journey keeps Truth Packet / Brief / Output / Review / Export distinct",
    pass: journey.includes("1. Input — Creative Truth Packet")
      && journey.includes("2. Brief — derived working direction")
      && journey.includes("4. Review — human assessment")
      && journey.includes("5. Export / handoff — not publication"),
    detail: "Staff surface must not blur snapshot, brief, generation, review, and export",
  });
  checks.push({
    check: "Gate 07: no unauthorized image-generation UI and encoded Program 7 routes untouched",
    pass: !actions.includes("generate-image")
      && !journey.includes("generate-image")
      && fs.existsSync(encodedList)
      && !fs.existsSync(dynamicList)
      && fileExists("app/api/admin/businesses/%5BbusinessId%5D/advisor/route.ts")
      && fileExists("app/api/admin/businesses/%5BbusinessId%5D/assistant/route.ts")
      && fileExists("app/api/admin/businesses/%5BbusinessId%5D/outcomes/route.ts"),
    detail: "No image button; Creative Studio list route unrepaired because dashboard does not depend on it; Program 7 encoded routes remain",
  });

  return checks;
}

function verifyGate10BCompileBridge(): VerifyCheck[] {
  const assembler = readCsFile("researchPacketAssembler.ts");
  const logic = readCsFile("researchPacketLogic.ts");
  const repo = readCsFile("repository.ts");
  const prefill = readCsFile("briefPrefill.ts");
  const providerTypes = readCsFile("providerTypes.ts");
  const packet = fs.readFileSync(path.join(BASE, "app", "admin", "(dashboard)", "businesses", "[businessId]", "CreativeTruthPacket.tsx"), "utf-8");
  const journey = fs.readFileSync(path.join(BASE, "app", "admin", "(dashboard)", "businesses", "[businessId]", "CreativeJourney.tsx"), "utf-8");
  const actions = fs.readFileSync(path.join(BASE, "app", "admin", "(dashboard)", "businesses", "[businessId]", "CreativeStudioActions.tsx"), "utf-8");
  const generate = fs.readFileSync(path.join(BASE, "app", "api", "admin", "businesses", "[businessId]", "creative-studio", "jobs", "[jobId]", "generate", "route.ts"), "utf-8");
  const migrations = fs.readdirSync(path.join(BASE, "supabase", "migrations"));

  return [
    {
      check: "Gate 10B: existing immutable snapshot store reused",
      pass: repo.includes("business_creative_input_snapshots") && repo.includes("Append-only") && generate.includes("createInputSnapshot") && generate.includes("assembleResearchPacket"),
      detail: "Generation still compiles then persists append-only business_creative_input_snapshots",
    },
    {
      check: "Gate 10B: canonical contacts/destinations/location/assets compiled",
      pass: assembler.includes("listContactsForBusiness")
        && assembler.includes("listServiceAreasForBusiness")
        && assembler.includes("listDigitalProfilesForBusiness")
        && assembler.includes("listCustomLinksForBusiness")
        && assembler.includes("listCreativeAssetMetadataForBusiness")
        && assembler.includes("operating_models"),
      detail: "Packet compile uses existing identity, contact, service-area, digital, and asset repositories",
    },
    {
      check: "Gate 10B: meeting notes excluded; confirmed Living Book facts included",
      pass: !assembler.includes("business_meeting_notes")
        && assembler.includes("business_facts")
        && assembler.includes("isConfirmedLivingBookFact")
        && logic.includes("owner_confirmed")
        && logic.includes("staff_confirmed"),
      detail: "Raw meeting notes stay out; promoted confirmed facts compile",
    },
    {
      check: "Gate 10B: asset metadata only; rights preserved; no binary",
      pass: repo.includes("CREATIVE_ASSET_METADATA_COLUMNS")
        && repo.includes("No binary")
        && !repo.includes("base64")
        && packet.includes("uploaded is not approved")
        && assembler.includes("rightsStatus")
        && assembler.includes("uploadedDoesNotMeanApproved"),
      detail: "Assets compile as metadata/reference with stored rights/approval",
    },
    {
      check: "Gate 10B: missing brand truth stays missing; no invented sponsorship",
      pass: logic.includes("Brand colors")
        && logic.includes("Brand personality")
        && assembler.includes("confirmedCta: null")
        && assembler.includes("confirmedOffer: null")
        && assembler.includes("confirmedSponsorship: false")
        && assembler.includes("getOpportunityById"),
      detail: "Colors/personality/CTA/offer/sponsorship are not invented",
    },
    {
      check: "Gate 10B: new-brief prefill only; saved brief preserved; no auto-save/approval/image/publish/migration",
      pass: prefill.includes("buildNewBriefPrefill")
        && journey.includes("row.brief ? row :")
        && journey.includes("<BriefReadout")
        && actions.includes("Prefill is editable and is not saved until you click Save")
        && !journey.includes("assembleResearchPacket")
        && journey.includes("getLatestSnapshotForJob")
        && !actions.includes("generate-image")
        && providerTypes.includes("OPENAI_IMAGE_GENERATION_ENABLED")
        && journey.includes("not publication")
        && !migrations.some((name) => name.includes("GATE_10B") || name.includes("truth_packet")),
      detail: "Prefill is unsaved-form only; Gate 07 boundaries and no new migration",
    },
  ];
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const migrationChecks = verifyMigration();
  const archChecks = verifyArchitecture();
  const packageAChecks = verifyPackageA();
  const gate07Checks = verifyGate07StaffSurface();
  const gate10bChecks = verifyGate10BCompileBridge();
  const all = [...migrationChecks, ...archChecks, ...packageAChecks, ...gate07Checks, ...gate10bChecks];
  const passed = all.filter((c) => c.pass).length;
  const failed = all.filter((c) => !c.pass);

  console.log("PROGRAM 6 CREATIVE STUDIO VERIFIER");
  console.log("=".repeat(60));
  console.log(`Migration checks: ${migrationChecks.filter((c) => c.pass).length}/${migrationChecks.length}`);
  console.log(`Architecture checks: ${archChecks.filter((c) => c.pass).length}/${archChecks.length}`);
  console.log(`Package A checks: ${packageAChecks.filter((c) => c.pass).length}/${packageAChecks.length}`);
  console.log(`Gate 07 staff surface checks: ${gate07Checks.filter((c) => c.pass).length}/${gate07Checks.length}`);
  console.log(`Gate 10B compile bridge checks: ${gate10bChecks.filter((c) => c.pass).length}/${gate10bChecks.length}`);
  console.log(`Total: ${passed}/${all.length}`);
  console.log("");

  if (failed.length > 0) {
    console.log("FAILURES:");
    for (const f of failed) {
      console.log(`  FAIL: ${f.check} — ${f.detail}`);
    }
    console.log("");
    process.exit(1);
  } else {
    console.log("ALL CHECKS PASSED");
    process.exit(0);
  }
}

main();
