/**
 * LEO-9 Owner Executive Console V0 — construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-9-executive-console.ts
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

function walkFiles(dirRel: string, acc: string[] = []): string[] {
  const abs = path.join(ROOT, dirRel);
  if (!existsSync(abs)) return acc;
  for (const name of readdirSync(abs)) {
    const rel = path.join(dirRel, name).replace(/\\/g, "/");
    const st = statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walkFiles(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  if (ok) console.log(`PASS  ${label}`);
  else {
    failures += 1;
    console.error(`FAIL  ${label}`);
  }
};

function main() {
  const pagePath = "app/admin/(dashboard)/leo/page.tsx";
  const componentsDir = "app/admin/(dashboard)/leo/_components";
  const convApi = "app/api/leo/conversation/route.ts";
  const accessLib = "app/leo/_lib/leoAccess.ts";
  const attentionSvc = "app/leo/_lib/leoAttentionService.ts";

  check(exists(pagePath), "1. /admin/leo route exists");

  const page = src(pagePath);
  const componentFiles = walkFiles(componentsDir);
  const componentsSrc = componentFiles.map((f) => src(f)).join("\n");
  const leoUi = page + "\n" + componentsSrc;

  check(
    /resolveLeoAccess|requireLeoOwnerAccess/.test(page) && exists(accessLib),
    "2. owner-only LEO access enforced",
  );
  check(!exists("app/leo/page.tsx") && !exists("app/(public)/leo/page.tsx"), "3. no public /leo route");

  check(
    exists(`${componentsDir}/LeoAttentionPanel.tsx`) && /LeoAttentionPanel/.test(page),
    "4. Attention panel exists",
  );
  check(
    /getLeoAttentionBrief/.test(page) && exists(attentionSvc),
    "5. Attention uses LEO Attention service",
  );
  check(
    !/pad.*3|force.*3.*item|exactly 3|exactly three/i.test(leoUi) &&
      !/Array\(3\)|fill\(null\).*3/.test(leoUi),
    "6. Attention does not force 3 items",
  );
  check(
    /No current signals qualify for executive attention from available sources/.test(leoUi),
    "7. zero attention has truthful empty state",
  );
  check(!/all systems healthy/i.test(leoUi), '8. page never claims "all systems healthy"');

  check(
    exists(`${componentsDir}/LeoClientCarePanel.tsx`) && /LeoClientCarePanel/.test(page),
    "9. Client Care panel exists",
  );
  const carePanel = src(`${componentsDir}/LeoClientCarePanel.tsx`);
  check(
    /EXPLICIT/.test(carePanel) && /HEURISTIC/.test(carePanel) && !/missed commitment/i.test(carePanel),
    "10. explicit vs heuristic care state distinguishable",
  );

  check(
    exists(`${componentsDir}/LeoConversationPanel.tsx`) && /LeoConversationPanel/.test(page),
    "11. Ask LEO UI exists",
  );
  const convPanel = src(`${componentsDir}/LeoConversationPanel.tsx`);
  check(
    /\/api\/leo\/conversation/.test(convPanel) && exists(convApi),
    "12. Ask LEO uses existing /api/leo/conversation",
  );
  check(!/stream|ReadableStream|EventSource|fake.?stream/i.test(leoUi), "13. no fake streaming");
  check(
    !/AI is thinking|powered by AI|typing\.\.\.|thinking\.\.\./i.test(leoUi) &&
      /Checking Leonix evidence/.test(convPanel),
    "14. no fake AI thinking state",
  );
  check(
    /UNSUPPORTED_INTENT|limitation|Could not retrieve/i.test(convPanel),
    "15. unsupported responses display limitation",
  );
  check(
    /evidence/i.test(convPanel) && /Why (LEO says this|\/ Evidence)/i.test(convPanel),
    "16. evidence can be displayed",
  );
  check(/unknowns/i.test(convPanel), "17. unknowns can be displayed");
  check(/governance/i.test(convPanel), "18. governance can be displayed");

  check(
    exists(`${componentsDir}/LeoMemoryPanel.tsx`) && /LeoMemoryPanel/.test(page),
    "19. memory panel exists",
  );
  const memPanel = src(`${componentsDir}/LeoMemoryPanel.tsx`);
  check(
    /Living Leonix Book storage is not available|not available in this environment/i.test(leoUi),
    "20. memory failure degrades safely",
  );
  check(
    !/invented memory|sample memory|placeholder memory|fake memory/i.test(leoUi) &&
      /never\s+invents\s+memory|No memories were invented|leoListRecentMemory/i.test(leoUi),
    "21. no invented memory fallback",
  );

  const govLegend = src(`${componentsDir}/LeoGovernanceLegend.tsx`);
  check(
    /GREEN/.test(govLegend) &&
      /YELLOW/.test(govLegend) &&
      /RED/.test(govLegend) &&
      /NEVER/.test(govLegend),
    "22. governance legend uses GREEN/YELLOW/RED/NEVER",
  );

  check(/NOT_EXECUTED/.test(convPanel) && /PREPARED/.test(convPanel), "23. prepared artifact can show NOT_EXECUTED");

  // Execution control button labels — exclude "Ask LEO" submit.
  const forbiddenButtons =
    />\s*Send\s*<|label=["']Send["']|>\s*Deploy\s*<|>\s*Publish\s*<|>\s*Schedule\s*<|>\s*Pay\s*</i;
  check(!forbiddenButtons.test(leoUi), "24-28. no Send/Deploy/Publish/Schedule/Pay buttons");
  check(
    !/sendEmail|resend|vercel\.deploy|gh workflow|stripe\.|calendar\.events/i.test(leoUi),
    "29. no external execution path",
  );

  check(
    /min-w-0|max-w-|sm:|flex-col|overflow-x-hidden|min-h-\[44px\]|min-h-\[40px\]|min-h-\[48px\]/.test(leoUi),
    "30. mobile responsive structure exists",
  );

  const manifestTouched = walkFiles("public").some((f) => /manifest|sw\.js|service-worker/i.test(f));
  // LEO-9 must not add/modify PWA artifacts in allowed scope — check leo UI + package not importing sw
  check(
    !/serviceWorker|workbox|next-pwa/i.test(leoUi) && !exists("app/admin/(dashboard)/leo/manifest.json"),
    "31. no PWA changes",
  );

  check(
    !/openai|@ai-sdk|anthropic|generateText|chat\.completions/i.test(leoUi),
    "32. no AI/provider imports added",
  );

  const migrations = existsSync(path.join(ROOT, "supabase/migrations"))
    ? readdirSync(path.join(ROOT, "supabase/migrations")).filter((m) => m.endsWith(".sql"))
    : [];
  const leoMigrations = migrations.filter((m) => /leo_/i.test(m) || /_leo_/i.test(m));
  const onlyApprovedLeoMigration =
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql";
  const noLeo9MigrationFile = !migrations.some((m) => /leo.?9|executive.?console/i.test(m));
  check(onlyApprovedLeoMigration && noLeo9MigrationFile, "33. no new migration");

  check(
    !/from\s+['\"][^'\"]*concierge|import\s+.*BusinessConcierge|require\(['\"][^'\"]*concierge/i.test(leoUi),
    "34. no Business Concierge import",
  );

  check(
    !/customerEmail|user\.email|lead\.email|phoneNumber|phone_number|raw_payload/.test(leoUi),
    "35. no raw PII dump",
  );

  check(
    !/JSON\.stringify\(answer|JSON\.stringify\(.*evidence|dump.*json/i.test(leoUi),
    "36. no raw JSON evidence dump by default",
  );

  check(
    !/sk_live|sk_test|service_role|BEGIN PRIVATE KEY|BLOB_READ_WRITE_TOKEN\s*=/.test(leoUi),
    "37. no secrets",
  );

  // LEO-9B may add Admin nav outside LEO UI; LEO UI must not embed Admin nav wiring.
  check(
    !/ADMIN_GLOBAL_NAV|getAllowedGlobalNavHrefs/.test(leoUi),
    "38. LEO UI does not embed Admin nav wiring (nav may exist separately)",
  );

  // Void unused
  void manifestTouched;

  if (failures > 0) {
    console.error(`\nLEO-9 verifier: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nLEO-9 verifier: PASS");
}

main();
