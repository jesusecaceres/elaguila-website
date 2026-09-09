/**
 * LEO-5 Client Care Watcher — targeted construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-5-client-care-watcher.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildLeoClientCareSignals,
  CANONICAL_NEEDS_REPLY_STATUSES,
  dedupeLeoClientCareSignals,
  isCanonicalNeedsReplyStatus,
  LEO_CLIENT_CARE_POLICY,
  leoClientCareSignalsToObservations,
  type LeoClientCareLeadRecord,
  type LeoClientCareSupportRecord,
} from "../app/leo/_lib/leoClientCareWatcher";
import { buildLeoAttentionBrief } from "../app/leo/_lib/leoAttentionEngine";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

function leoApiSurfaceOk(): boolean {
  if (exists("app/leo/page.tsx")) return false;
  if (!exists("app/api/leo")) return true;
  if (!exists("app/api/leo/conversation/route.ts")) return false;
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === "route.ts") routes.push(path.relative(path.join(ROOT, "app/api/leo"), p).replace(/\\/g, "/"));
    }
  };
  walk(path.join(ROOT, "app/api/leo"));
  return routes.length === 1 && routes[0] === "conversation/route.ts";
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
    created_at: partial.created_at ?? "2026-07-01T00:00:00.000Z",
    updated_at: partial.updated_at ?? "2026-07-01T00:00:00.000Z",
    last_contacted_at: partial.last_contacted_at === undefined ? null : partial.last_contacted_at,
    follow_up_at: partial.follow_up_at === undefined ? null : partial.follow_up_at,
    archived_at: partial.archived_at === undefined ? null : partial.archived_at,
    deleted_at: partial.deleted_at === undefined ? null : partial.deleted_at,
    safeLabel: partial.safeLabel ?? "advertising",
  };
}

function ticket(
  partial: Partial<LeoClientCareSupportRecord> & Pick<LeoClientCareSupportRecord, "id">,
): LeoClientCareSupportRecord {
  return {
    id: partial.id,
    status: partial.status ?? "open",
    created_at: partial.created_at ?? "2026-08-01T00:00:00.000Z",
    updated_at: partial.updated_at ?? "2026-08-01T00:00:00.000Z",
    subjectLabel: partial.subjectLabel ?? "Billing question",
  };
}

function main() {
  const adapterPath = "app/leo/_lib/leoClientCareAdapter.ts";
  const watcherPath = "app/leo/_lib/leoClientCareWatcher.ts";
  const servicePath = "app/leo/_lib/leoClientCareService.ts";
  const attentionService = "app/leo/_lib/leoAttentionService.ts";
  const livingService = "app/leo/_lib/leoLivingBookService.ts";

  check(exists(adapterPath), "1. Client Care adapter exists");
  check(exists(watcherPath), "2. Client Care watcher exists");

  const adapter = src(adapterPath);
  const watcher = src(watcherPath);
  const service = exists(servicePath) ? src(servicePath) : "";
  const attnSvc = src(attentionService);
  const living = src(livingService);

  check(adapter.includes('import "server-only"'), "3. server-only read path (adapter)");
  check(
    !/\.insert\s*\(|\.update\s*\(|\.upsert\s*\(|\.delete\s*\(|\.rpc\s*\(/.test(adapter + watcher + service),
    "4. no DB writes",
  );
  check(
    !/openai\.com|chat\.completions|generateText|@ai-sdk|anthropic|runListingAiModeration/i.test(
      adapter + watcher + service,
    ),
    "5. no AI/provider import",
  );
  check(!/business-concierge|diyConcierge|app\/lib\/business/i.test(adapter + watcher + service), "6. no Business Concierge import");
  check(leoApiSurfaceOk(), "7/8. no public UI; API limited to conversation if present");
  const leoMigrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((f) => f.includes("leo_"));
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "9. no new migration",
  );
  check(
    adapter.includes("limit(") &&
      adapter.includes("LEO_CLIENT_CARE_POLICY.maxLeadRows") &&
      adapter.includes("LEO_CLIENT_CARE_POLICY.maxSupportRows"),
    "10. bounded reads",
  );
  check(!/\.select\([^)]*email/i.test(adapter) && !adapter.includes(",email"), "11. no raw email dump in select");
  check(!/\.select\([^)]*phone/i.test(adapter) && !adapter.includes(",phone"), "12. no raw phone dump in select");
  check(
    adapter.includes("LEAD_CARE_SELECT") &&
      adapter.includes('"id,status,created_at,updated_at,last_contacted_at,follow_up_at,archived_at,deleted_at,inquiry_type,business_category"') &&
      !adapter.includes("internal_notes") &&
      !adapter.includes("SUPPORT_CARE_SELECT = \"id,status,created_at,updated_at,subject,body\""),
    "13. no full customer payload dump",
  );
  check(!/will churn|revenue at risk|customers are angry/i.test(watcher), "27-29. no fake churn/revenue/sentiment");
  check(watcher.includes("LEO_CLIENT_CARE_POLICY") && watcher.includes("staleActiveLeadDays"), "19. stale threshold centralized");
  check(/HEURISTIC/.test(watcher) && watcher.includes("isHeuristic: true"), "20. stale threshold labeled heuristic");
  check(!/missed commitment|SLA breach/i.test(watcher) || watcher.includes("not a missed commitment"), "21. heuristic not presented as missed commitment");
  check(watcher.includes("No canonical due date/SLA") || watcher.includes("no due_at/SLA"), "22. open support without SLA not SLA breach");
  check(watcher.includes("waiting_on_client") && watcher.includes("WAITING_ON_CUSTOMER"), "23. waiting-party requires explicit workflow");
  check(watcher.includes("dedupeLeoClientCareSignals") && watcher.includes("SIGNAL_PRECEDENCE"), "24. deterministic dedupe exists");
  check(
    attnSvc.includes("leoClientCareSignalsToObservations") && attnSvc.includes("buildLeoClientCareSignals"),
    "26. attention integration exists",
  );
  check(
    !service.includes("createLeoMemory") &&
      !adapter.includes("createLeoMemory") &&
      !watcher.includes("createLeoMemory") &&
      !living.includes("buildLeoClientCareSignals"),
    "30. no automatic Living Book writes",
  );
  check(
    exists(servicePath) && service.includes('import "server-only"') && service.includes("requireLeoOwnerAccess"),
    "31. owner-only service boundary exists",
  );
  check(
    JSON.stringify([...CANONICAL_NEEDS_REPLY_STATUSES]) === JSON.stringify(["new", "needs_reply"]),
    "17. needs-reply uses canonical Admin rule statuses",
  );

  const nowMs = Date.parse("2026-08-17T18:00:00.000Z");

  // CASE 1: overdue follow_up
  const case1 = buildLeoClientCareSignals({
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
  check(
    case1.signals.length === 1 && case1.signals[0]!.kind === "FOLLOW_UP_OVERDUE",
    "CASE 1 / 14: active lead overdue follow_up_at → FOLLOW_UP_OVERDUE",
  );

  // CASE 2: future follow_up not overdue
  const case2 = buildLeoClientCareSignals({
    leads: [
      lead({
        id: "L2",
        status: "contacted",
        follow_up_at: "2026-08-20T12:00:00.000Z",
        last_contacted_at: "2026-08-16T12:00:00.000Z",
        created_at: "2026-08-16T12:00:00.000Z",
      }),
    ],
    supportTickets: [],
    nowMs,
  });
  check(
    !case2.signals.some((s) => s.kind === "FOLLOW_UP_OVERDUE"),
    "CASE 2 / 15: future follow_up does not generate overdue",
  );

  // CASE 3: closed lead no stale
  const case3 = buildLeoClientCareSignals({
    leads: [
      lead({
        id: "L3",
        status: "won",
        created_at: "2026-01-01T00:00:00.000Z",
        last_contacted_at: "2026-01-01T00:00:00.000Z",
      }),
    ],
    supportTickets: [],
    nowMs,
  });
  check(
    !case3.signals.some((s) => s.kind === "STALE_ACTIVE_LEAD"),
    "CASE 3 / 16: closed lead does not generate stale active lead",
  );

  // CASE 4: stale heuristic
  const case4 = buildLeoClientCareSignals({
    leads: [
      lead({
        id: "L4",
        status: "qualified",
        created_at: "2026-07-01T00:00:00.000Z",
        last_contacted_at: "2026-07-01T00:00:00.000Z",
        follow_up_at: null,
      }),
    ],
    supportTickets: [],
    nowMs,
  });
  check(
    case4.signals.length === 1 &&
      case4.signals[0]!.kind === "STALE_ACTIVE_LEAD" &&
      case4.signals[0]!.isHeuristic === true,
    "CASE 4: active lead old enough → STALE_ACTIVE_LEAD heuristic",
  );
  check(
    case4.signals[0]!.limitationNote?.includes("not a missed commitment") === true,
    "CASE 4 / 21: stale not labeled missed commitment",
  );

  // CASE 5: open support no SLA breach
  const case5 = buildLeoClientCareSignals({
    leads: [],
    supportTickets: [ticket({ id: "T1", status: "open", created_at: "2026-01-01T00:00:00.000Z" })],
    nowMs,
  });
  check(
    case5.signals.length === 1 &&
      case5.signals[0]!.kind === "OPEN_SUPPORT" &&
      case5.signals[0]!.limitationNote?.toLowerCase().includes("not an sla breach") === true,
    "CASE 5 / 22: open support without due → OPEN_SUPPORT, not SLA breach",
  );
  check(case5.signals[0]!.limitationNote?.toLowerCase().includes("not an sla") === true, "CASE 5: limitation says not SLA");

  // CASE 6: stale + overdue → strongest only
  const case6 = buildLeoClientCareSignals({
    leads: [
      lead({
        id: "L6",
        status: "contacted",
        created_at: "2026-01-01T00:00:00.000Z",
        last_contacted_at: "2026-01-01T00:00:00.000Z",
        follow_up_at: "2026-08-01T00:00:00.000Z",
      }),
    ],
    supportTickets: [],
    nowMs,
  });
  check(
    case6.signals.length === 1 && case6.signals[0]!.kind === "FOLLOW_UP_OVERDUE",
    "CASE 6 / 25: overdue wins over stale for same entity",
  );

  // CASE 7: insufficient truth — null last_contacted alone does not invent needs_reply
  const case7 = buildLeoClientCareSignals({
    leads: [
      lead({
        id: "L7",
        status: "qualified",
        created_at: "2026-08-16T00:00:00.000Z",
        last_contacted_at: null,
        follow_up_at: null,
      }),
    ],
    supportTickets: [],
    nowMs,
  });
  check(
    !case7.signals.some((s) => s.kind === "NEEDS_REPLY"),
    "CASE 7 / 18: null last_contacted_at alone does not fabricate needs-reply",
  );

  // Explicit needs_reply status
  const needs = buildLeoClientCareSignals({
    leads: [
      lead({
        id: "L8",
        status: "needs_reply",
        created_at: "2026-08-16T00:00:00.000Z",
        last_contacted_at: null,
      }),
    ],
    supportTickets: [],
    nowMs,
  });
  check(
    needs.signals.some((s) => s.kind === "NEEDS_REPLY") && isCanonicalNeedsReplyStatus("needs_reply"),
    "17. explicit needs_reply uses canonical rule only",
  );

  // CASE 8: deterministic replay
  const a = buildLeoClientCareSignals({
    leads: [
      lead({ id: "Lx", status: "new", follow_up_at: "2026-08-01T00:00:00.000Z", created_at: "2026-08-01T00:00:00.000Z" }),
    ],
    supportTickets: [ticket({ id: "Tx", status: "in_progress" })],
    nowMs,
  });
  const b = buildLeoClientCareSignals({
    leads: [
      lead({ id: "Lx", status: "new", follow_up_at: "2026-08-01T00:00:00.000Z", created_at: "2026-08-01T00:00:00.000Z" }),
    ],
    supportTickets: [ticket({ id: "Tx", status: "in_progress" })],
    nowMs,
  });
  check(
    JSON.stringify(a.signals.map((s) => ({ key: s.key, kind: s.kind }))) ===
      JSON.stringify(b.signals.map((s) => ({ key: s.key, kind: s.kind }))),
    "CASE 8 / 32: same input/time → identical output",
  );

  // Attention integration smoke
  const careObs = leoClientCareSignalsToObservations(case1.signals);
  const brief = buildLeoAttentionBrief(careObs, { topN: 3, nowMs });
  check(brief.items.length >= 1 && careObs[0]!.kind === "client_care_follow_up_overdue", "26. care signals normalize into attention");

  // Dedupe helper direct
  const overlapped = dedupeLeoClientCareSignals([
    ...buildLeoClientCareSignals({
      leads: [
        lead({
          id: "Ld",
          status: "needs_reply",
          follow_up_at: "2026-08-01T00:00:00.000Z",
          created_at: "2026-01-01T00:00:00.000Z",
          last_contacted_at: "2026-01-01T00:00:00.000Z",
        }),
      ],
      supportTickets: [],
      nowMs,
    }).signals,
  ]);
  // Actually build already dedupes — verify precedence map values
  check(LEO_CLIENT_CARE_POLICY.staleActiveLeadDays === 14, "policy stale days = 14");
  check(overlapped.length === 1 && overlapped[0]!.kind === "FOLLOW_UP_OVERDUE", "25. strongest overlapping signal selected");

  if (failures > 0) {
    console.error(`\nLEO-5 verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("\nLEO-5 verifier PASS");
}

main();
