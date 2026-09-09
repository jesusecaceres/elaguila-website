/**
 * LEO-8 Watchers + Yellow Preparation — targeted construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-8-watchers-preparation.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import {
  buildLeoPreparedAction,
  isConsequentialActionRequest,
} from "../app/leo/_lib/leoPreparationEngine";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import {
  evaluateLeoWatcherRequest,
  runLeoWatcherOnEvidence,
} from "../app/leo/_lib/leoWatcherEngine";
import { LEO_WATCHER_REGISTRY, isLeoWatcherKind } from "../app/leo/_lib/leoWatcherRegistry";
import { buildLeoClientCareSignals } from "../app/leo/_lib/leoClientCareWatcher";
import type { LeoClientCareLeadRecord } from "../app/leo/_lib/leoClientCareWatcher";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

function lead(partial: Partial<LeoClientCareLeadRecord> & Pick<LeoClientCareLeadRecord, "id">): LeoClientCareLeadRecord {
  return {
    id: partial.id,
    status: partial.status ?? "contacted",
    created_at: partial.created_at ?? "2026-08-01T00:00:00.000Z",
    updated_at: partial.updated_at ?? "2026-08-01T00:00:00.000Z",
    last_contacted_at: partial.last_contacted_at === undefined ? "2026-08-10T00:00:00.000Z" : partial.last_contacted_at,
    follow_up_at: partial.follow_up_at === undefined ? null : partial.follow_up_at,
    archived_at: partial.archived_at === undefined ? null : partial.archived_at,
    deleted_at: partial.deleted_at === undefined ? null : partial.deleted_at,
    safeLabel: partial.safeLabel ?? "advertising",
  };
}

function main() {
  const registryPath = "app/leo/_lib/leoWatcherRegistry.ts";
  const watcherPath = "app/leo/_lib/leoWatcherEngine.ts";
  const prepPath = "app/leo/_lib/leoPreparationEngine.ts";
  const prepSvcPath = "app/leo/_lib/leoPreparationService.ts";
  const convRouter = src("app/leo/_lib/leoConversationRouter.ts");
  const convSvc = src("app/leo/_lib/leoConversationService.ts");
  const living = src("app/leo/_lib/leoLivingBookService.ts");

  check(exists(registryPath), "1. watcher registry exists");
  check(exists(watcherPath), "2. watcher engine exists");
  check(exists(prepPath), "3. preparation engine exists");
  check(exists(prepSvcPath), "4. preparation service exists");

  const registry = src(registryPath);
  const watcher = src(watcherPath);
  const prep = src(prepPath);
  const prepSvc = src(prepSvcPath);
  const all = registry + watcher + prep + prepSvc;

  check(!/openai\.com|chat\.completions|generateText|@ai-sdk|anthropic/i.test(all), "5. no AI/provider imports");
  check(
    !/\.insert\s*\(|\.update\s*\(|sendEmail|resend|nodemailer|calendar\.events|vercel\.deploy|gh workflow/i.test(all),
    "6-8. no external execution / DB writes patterns",
  );
  const leoMigrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((f) => f.includes("leo_"));
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "8. no new migration",
  );
  check(!/setInterval|setTimeout|node-cron|cron\.schedule/i.test(all), "9-10. no cron/timers/polling");
  check(!/notification|twilio|sms send|gmail/i.test(all) || all.includes("No notification"), "11-13. no notification/email/calendar senders");
  check(registry.includes("LEO_WATCHER_REGISTRY"), "15. watcher kinds centralized");
  check(Object.keys(LEO_WATCHER_REGISTRY).length === 5, "15b. five supported watchers");

  const nowMs = Date.parse("2026-08-17T18:00:00.000Z");

  // CASE 1: empty client care
  const emptyWatch = buildLeoClientCareSignals({ leads: [], supportTickets: [], nowMs });
  const case1 = runLeoWatcherOnEvidence(
    { watcherKind: "CLIENT_CARE", nowMs },
    { clientCare: emptyWatch },
  );
  check(case1.findings.length === 0 && case1.totalFindings === 0, "CASE 1: no client-care findings → empty");

  // CASE 2: overdue follow-up
  const overdueWatch = buildLeoClientCareSignals({
    leads: [
      lead({
        id: "L1",
        status: "contacted",
        follow_up_at: "2026-08-10T12:00:00.000Z",
        last_contacted_at: "2026-08-09T12:00:00.000Z",
      }),
    ],
    supportTickets: [],
    nowMs,
  });
  const case2 = runLeoWatcherOnEvidence(
    { watcherKind: "FOLLOW_UP", nowMs },
    { clientCare: overdueWatch },
  );
  check(
    case2.findings.length === 1 && case2.findings[0]!.findingType === "follow_up",
    "CASE 2: overdue follow-up → watcher finding",
  );

  // CASE 3: prepare follow-up → YELLOW + NOT_EXECUTED
  const case3 = buildLeoPreparedAction({
    request: {
      preparationKind: "FOLLOW_UP_DRAFT",
      watcherKind: "FOLLOW_UP",
      nowMs,
      question: "Prepare a follow-up for this lead",
    },
    findings: case2.findings,
    watcherResult: case2,
  });
  check(
    case3.ok &&
      case3.prepared?.governance.level === "YELLOW" &&
      case3.prepared.status === "NOT_EXECUTED" &&
      case3.prepared.executionAllowed === false,
    "CASE 3: prepare follow-up → YELLOW + NOT_EXECUTED",
  );
  check(
    case3.ok &&
      !/SENT|SCHEDULED|DELIVERED/.test(case3.prepared!.status) &&
      case3.prepared!.notClaiming.some((n) => n.includes("Not SENT")),
    "26. preparation does not imply sent/scheduled",
  );

  // CASE 4: send follow-up → RED no execution
  const case4 = buildLeoPreparedAction({
    request: {
      preparationKind: "FOLLOW_UP_DRAFT",
      requestedActionKind: "SEND_EXTERNAL",
      nowMs,
    },
    findings: case2.findings,
  });
  check(
    !case4.ok &&
      case4.governance.level === "RED" &&
      case4.governance.executionAllowed === false &&
      case4.prepared === null,
    "CASE 4: send follow-up → RED + NO execution",
  );
  check(isConsequentialActionRequest("Send this follow-up now") === "SEND_EXTERNAL", "32. send this maps consequential");

  // CASE 5: deploy
  const case5 = buildLeoPreparedAction({
    request: {
      preparationKind: "INTERNAL_TASK_DRAFT",
      requestedActionKind: "DEPLOY_PRODUCTION",
      nowMs,
    },
    findings: [],
  });
  check(
    !case5.ok && case5.governance.level === "RED" && case5.prepared === null,
    "CASE 5: deploy → RED + NO execution",
  );

  // CASE 6: bypass
  const case6g = assessLeoGovernance({ actionKind: "BYPASS_APPROVAL", nowMs });
  check(case6g.level === "NEVER", "CASE 6: bypass governance → NEVER");

  // CASE 7: unsupported watcher
  const case7 = evaluateLeoWatcherRequest({ watcherKind: "SYSTEM_HEALTH", nowMs }, {});
  check(
    "ok" in case7 && case7.ok === false && case7.error === "unsupported_watcher",
    "CASE 7: unsupported watcher → fail closed",
  );
  check(!isLeoWatcherKind("SYSTEM_HEALTH"), "7b. SYSTEM_HEALTH not registered");

  // CASE 8: deterministic
  const a = runLeoWatcherOnEvidence({ watcherKind: "FOLLOW_UP", nowMs }, { clientCare: overdueWatch });
  const b = runLeoWatcherOnEvidence({ watcherKind: "FOLLOW_UP", nowMs }, { clientCare: overdueWatch });
  check(
    JSON.stringify(a.findings.map((f) => f.key)) === JSON.stringify(b.findings.map((f) => f.key)),
    "CASE 8: same input twice → deterministic structural result",
  );

  check(watcher.includes("buildLeoClientCareSignals") || watcher.includes("clientCare"), "18. Client Care reused");
  check(watcher.includes("buildLeoAttentionBrief") || watcher.includes("attentionBrief"), "19. Attention reused");
  check(prep.includes("assessLeoGovernance") && prep.includes("PREPARE_DRAFT"), "21-22. preparation uses governance YELLOW");
  check(assessLeoGovernance({ actionKind: "PREPARE_DRAFT", nowMs }).level === "YELLOW", "22. PREPARE_DRAFT is YELLOW");
  check(prepSvc.includes('import "server-only"') && prepSvc.includes("requireLeoOwnerAccess"), "33. owner-only service");
  check(
    !prep.includes("createLeoMemory") && !living.includes("buildLeoPreparedAction"),
    "29-30. preparation not auto-persisted / Living Book not auto-written",
  );
  check(convRouter.includes('"PREPARATION"') && convSvc.includes("runLeoPreparation"), "31. conversation preparation intent");
  check(routeLeoConversation({ question: "Prepare a follow-up for lead X" }).intent === "PREPARATION", "31b. prepare routes PREPARATION");
  check(routeLeoConversation({ question: "Who needs follow-up?" }).intent === "CLIENT_CARE", "31c. who needs follow-up stays CLIENT_CARE");
  check(routeLeoConversation({ question: "Send this follow-up" }).intent === "CAPABILITY_GOVERNANCE", "32b. send routes capability");
  check(!/phone|customer_email|SUPABASE_SERVICE_ROLE/.test(all), "34. no raw PII/secrets");
  check(case3.ok && case3.prepared!.sourceEvidenceRefs.length > 0, "27. source evidence preserved");
  check(case3.ok && case3.prepared!.limitations.length > 0, "28. limitations preserved");
  check(!exists("app/leo/page.tsx"), "no UI");

  if (failures > 0) {
    console.error(`\nLEO-8 verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("\nLEO-8 verifier PASS");
}

main();
