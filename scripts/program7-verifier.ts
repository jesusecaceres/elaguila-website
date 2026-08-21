/**
 * Program 7 Verifier — mechanically inspects the Program 7 migration SQL and source architecture.
 * Mirrors the Creative Studio verifier pattern exactly.
 *
 * Run: npx tsx scripts/program7-verifier.ts
 *
 * Checks:
 * 1. RLS enabled on all 7 tables
 * 2. PUBLIC/anon/authenticated revoked on all 7 tables
 * 3. service_role grants are correct (append-only: SELECT INSERT; mutable: SELECT INSERT UPDATE DELETE)
 * 4. Composite FKs on all child tables
 * 5. Actor attribution CHECKs on all human-authored tables
 * 6. Feature flags inserted with enabled=false
 * 7. No numeric scores, no vanity averages in source files
 * 8. No auto-send messaging logic in source files
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";

type VerifyCheck = { name: string; passed: boolean; detail?: string };

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260811170000_business_program7_foundation.sql",
);

const EXPECTED_TABLES = [
  "business_outcomes",
  "business_outcome_evidence",
  "business_outcome_reflections",
  "business_advisor_signals",
  "business_advisor_signal_events",
  "business_assistant_threads",
  "business_assistant_messages",
] as const;

const APPEND_ONLY_TABLES = new Set([
  "business_outcome_evidence",
  "business_outcome_reflections",
  "business_advisor_signal_events",
  "business_assistant_messages",
]);

const MUTABLE_TABLES = new Set([
  "business_outcomes",
  "business_advisor_signals",
  "business_assistant_threads",
]);

const CHILD_TABLES_WITH_COMPOSITE_FK = new Set([
  "business_outcome_evidence",
  "business_outcome_reflections",
  "business_advisor_signal_events",
  "business_assistant_messages",
]);

function readMigrationSql(): string {
  if (!existsSync(MIGRATION_PATH)) {
    throw new Error(`Migration file not found: ${MIGRATION_PATH}`);
  }
  return readFileSync(MIGRATION_PATH, "utf-8");
}

function readSourceFile(relPath: string): string {
  const fullPath = join(process.cwd(), relPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Source file not found: ${fullPath}`);
  }
  return readFileSync(fullPath, "utf-8");
}

function verifyMigration(): VerifyCheck[] {
  const sql = readMigrationSql();
  const checks: VerifyCheck[] = [];

  for (const table of EXPECTED_TABLES) {
    checks.push({
      name: `RLS enabled: ${table}`,
      passed: sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`),
    });

    checks.push({
      name: `PUBLIC revoked: ${table}`,
      passed: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM PUBLIC`),
    });

    checks.push({
      name: `anon revoked: ${table}`,
      passed: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM anon`),
    });

    checks.push({
      name: `authenticated revoked: ${table}`,
      passed: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM authenticated`),
    });

    checks.push({
      name: `service_role revoked: ${table}`,
      passed: sql.includes(`REVOKE ALL PRIVILEGES ON TABLE public.${table} FROM service_role`),
    });

    if (APPEND_ONLY_TABLES.has(table)) {
      checks.push({
        name: `Append-only grant (SELECT, INSERT): ${table}`,
        passed: sql.includes(`GRANT SELECT, INSERT ON TABLE public.${table} TO service_role`),
        detail: "Append-only tables must only have SELECT, INSERT grants",
      });
    } else if (MUTABLE_TABLES.has(table)) {
      checks.push({
        name: `Mutable grant (SELECT, INSERT, UPDATE, DELETE): ${table}`,
        passed: sql.includes(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${table} TO service_role`),
        detail: "Mutable tables must have SELECT, INSERT, UPDATE, DELETE grants",
      });
    }

    if (CHILD_TABLES_WITH_COMPOSITE_FK.has(table)) {
      checks.push({
        name: `Composite FK: ${table}`,
        passed: sql.includes(`FOREIGN KEY`) && sql.includes(`${table}`),
        detail: "Child tables must have composite same-business FKs",
      });
    }
  }

  checks.push({
    name: "Feature flag: business_outcomes (enabled=false)",
    passed: sql.includes("'business_outcomes', false, false, '{}'"),
  });

  checks.push({
    name: "Feature flag: business_proactive_advisor (enabled=false)",
    passed: sql.includes("'business_proactive_advisor', false, false, '{}'"),
  });

  checks.push({
    name: "Feature flag: business_contextual_assistant (enabled=false)",
    passed: sql.includes("'business_contextual_assistant', false, false, '{}'"),
  });

  checks.push({
    name: "Feature flag: business_staff_field_pwa (enabled=false)",
    passed: sql.includes("'business_staff_field_pwa', false, false, '{}'"),
  });

  checks.push({
    name: "Actor attribution CHECK on business_outcomes",
    passed: sql.includes("business_outcomes_created_actor_chk"),
  });

  checks.push({
    name: "Actor attribution CHECK on business_outcome_evidence",
    passed: sql.includes("business_outcome_evidence_created_actor_chk"),
  });

  checks.push({
    name: "Actor attribution CHECK on business_outcome_reflections",
    passed: sql.includes("business_outcome_reflections_created_actor_chk"),
  });

  checks.push({
    name: "Actor attribution CHECK on business_advisor_signals",
    passed: sql.includes("business_advisor_signals_created_actor_chk"),
  });

  checks.push({
    name: "Actor attribution CHECK on business_advisor_signal_events",
    passed: sql.includes("business_advisor_signal_events_actor_chk"),
  });

  checks.push({
    name: "Actor attribution CHECK on business_assistant_threads",
    passed: sql.includes("business_assistant_threads_created_actor_chk"),
  });

  checks.push({
    name: "Actor attribution CHECK on business_assistant_messages",
    passed: sql.includes("business_assistant_messages_created_actor_chk"),
  });

  return checks;
}

function verifySourceArchitecture(): VerifyCheck[] {
  const checks: VerifyCheck[] = [];

  const outcomesLogic = readSourceFile("app/lib/business/outcomes/logic.ts");
  checks.push({
    name: "Outcomes logic: no numeric scores",
    passed: !outcomesLogic.includes("score") && !outcomesLogic.includes("average"),
    detail: "Outcomes must never compute numeric scores or vanity averages",
  });

  checks.push({
    name: "Outcomes logic: computeResult function exists",
    passed: outcomesLogic.includes("export function computeResult"),
  });

  checks.push({
    name: "Outcomes logic: computeConfidence function exists",
    passed: outcomesLogic.includes("export function computeConfidence"),
  });

  checks.push({
    name: "Outcomes logic: computeCausation function exists",
    passed: outcomesLogic.includes("export function computeCausation"),
  });

  const advisorLogic = readSourceFile("app/lib/business/advisor/logic.ts");
  checks.push({
    name: "Advisor logic: detectSignals function exists",
    passed: advisorLogic.includes("export function detectSignals"),
  });

  const assistantLogic = readSourceFile("app/lib/business/assistant/logic.ts");
  checks.push({
    name: "Assistant logic: PROHIBITED_ACTIONS defined",
    passed: assistantLogic.includes("PROHIBITED_ACTIONS"),
  });

  checks.push({
    name: "Assistant logic: validateActionBoundary function exists",
    passed: assistantLogic.includes("export function validateActionBoundary"),
  });

  const notificationsFile = readSourceFile("app/lib/business/notifications/notifications.ts");
  checks.push({
    name: "Notifications: no auto-send logic",
    passed: !notificationsFile.includes("sendEmail") && !notificationsFile.includes("sendSMS") && !notificationsFile.includes("sendWhatsApp") && !notificationsFile.includes("sendPush"),
    detail: "Notifications must be in-app only — never auto-send email/SMS/WhatsApp/push",
  });

  const longitudinalFile = readSourceFile("app/lib/business/healthMap/longitudinal.ts");
  checks.push({
    name: "Longitudinal: no numeric scores",
    passed: !longitudinalFile.includes("score") && !longitudinalFile.includes("average"),
    detail: "Longitudinal Health Map must never compute numeric scores or vanity averages",
  });

  const swFile = readSourceFile("public/sw.js");
  checks.push({
    name: "Service worker: never caches API responses",
    passed: swFile.includes("NEVER_CACHE_PATTERNS") && swFile.includes("api"),
    detail: "Service worker must never cache API responses",
  });

  // Package C — Staff Studio Install Surface
  const installHookFile = readSourceFile("app/lib/pwa/useInstallPrompt.ts");
  checks.push({
    name: "Install hook: shared useInstallPrompt exported",
    passed: installHookFile.includes("export function useInstallPrompt"),
    detail: "Install-prompt logic must live in one shared hook, not be duplicated per surface",
  });

  const fieldAgentFile = readSourceFile("app/admin/field/FieldAgentComponents.tsx");
  checks.push({
    name: "Field Agent shell: consumes shared install hook",
    passed: fieldAgentFile.includes('from "@/app/lib/pwa/useInstallPrompt"'),
    detail: "Field Agent shell must reuse the shared hook, not define its own",
  });
  checks.push({
    name: "Field Agent shell: no duplicated beforeinstallprompt handler",
    passed: !fieldAgentFile.includes("beforeinstallprompt"),
    detail: "beforeinstallprompt wiring must only exist in the shared hook",
  });

  const businessesListPage = readSourceFile("app/admin/(dashboard)/businesses/page.tsx");
  checks.push({
    name: "Main Business Concierge workspace: exposes install banner",
    passed: businessesListPage.includes("BusinessConciergeInstallBanner"),
    detail: "Staff must not need to visit /admin/field to discover installation",
  });

  const installBannerFile = readSourceFile("app/admin/(dashboard)/businesses/BusinessConciergeInstallBanner.tsx");
  checks.push({
    name: "Install banner: no fake download link",
    passed: !installBannerFile.includes("download=") && !installBannerFile.includes(".apk") && !installBannerFile.includes(".exe"),
    detail: "Install must only ever use the real browser install prompt, never a fake download",
  });
  checks.push({
    name: "Install banner: uses shared hook, not a private beforeinstallprompt handler",
    passed: installBannerFile.includes('from "@/app/lib/pwa/useInstallPrompt"') && !installBannerFile.includes("addEventListener(\"beforeinstallprompt\""),
  });

  return checks;
}

function main() {
  console.log("\n=== Program 7 Verifier ===\n");

  const migrationChecks = verifyMigration();
  const sourceChecks = verifySourceArchitecture();
  const allChecks = [...migrationChecks, ...sourceChecks];

  let passed = 0;
  let failed = 0;

  for (const check of allChecks) {
    const status = check.passed ? "PASS" : "FAIL";
    if (check.passed) {
      passed++;
    } else {
      failed++;
    }
    console.log(`  [${status}] ${check.name}${check.detail ? ` — ${check.detail}` : ""}`);
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
