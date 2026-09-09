/**
 * LEO-9B Owner Executive Experience Polish — construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-9b-executive-polish.ts
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
  const page = src(pagePath);
  const attention = src(`${componentsDir}/LeoAttentionPanel.tsx`);
  const conv = src(`${componentsDir}/LeoConversationPanel.tsx`);
  const care = src(`${componentsDir}/LeoClientCarePanel.tsx`);
  const memory = src(`${componentsDir}/LeoMemoryPanel.tsx`);
  const gov = src(`${componentsDir}/LeoGovernanceLegend.tsx`);
  const cap = src(`${componentsDir}/LeoCapabilityStrip.tsx`);
  const header = src(`${componentsDir}/LeoExecutiveHeader.tsx`);
  const presentation = src(`${componentsDir}/leoOwnerPresentation.ts`);
  const attentionEngine = src("app/leo/_lib/leoAttentionEngine.ts");
  const attentionSvc = src("app/leo/_lib/leoAttentionService.ts");
  const nav = src("app/admin/_lib/adminGlobalNav.ts");
  const access = src("app/admin/_lib/adminAccessControl.ts");
  const strings = src("app/admin/_lib/adminStrings.ts");

  const componentFiles = walkFiles(componentsDir);
  const leoUi = page + "\n" + componentFiles.map((f) => src(f)).join("\n");

  check(exists(pagePath), "1. /admin/leo still exists");
  check(/resolveLeoAccess/.test(page), "2. owner-only security preserved");

  const askIdx = page.indexOf("<LeoConversationPanel");
  const attIdx = page.indexOf("<LeoAttentionPanel");
  check(askIdx >= 0 && attIdx >= 0 && askIdx < attIdx, "3. Ask LEO precedes Attention in page hierarchy");

  check(/\/api\/leo\/conversation/.test(conv), "4. Ask LEO still uses existing conversation API");
  check(
    !/stream|ReadableStream|EventSource|AI is thinking|powered by AI/i.test(leoUi) &&
      /Checking Leonix evidence/.test(conv),
    "5. no fake AI/streaming",
  );

  check(
    !/ATTENTION_WEIGHTS|buildLeoAttentionBrief/.test(attention) &&
      /getLeoAttentionBrief/.test(page) &&
      /ATTENTION_WEIGHTS/.test(attentionEngine),
    "6. Attention engine unchanged (UI consumes service only)",
  );

  check(
    !/score \{item\.score\}|>\s*score\s*\{/.test(attention) && /Internal rank score/.test(attention),
    "7. Attention raw score not primary visible emphasis",
  );

  check(/#\{rank\}|Priority \$\{rank\}|rank=\{index/.test(attention), "8. ranked #1/#2/#3 presentation exists");

  check(!/listing_reports/.test(attention + care + conv + header + memory + page), "9. listing_reports not primary owner copy");
  check(!/review_queue_preview/.test(attention + care + conv + header + memory + page), "10. review_queue_preview not primary owner copy");
  check(!/\bneeds_reply\b/.test(attention + care + header + memory), "11. needs_reply not raw in primary panels");
  check(!/promotionalProducts/.test(attention + care + conv + header + memory + page), "12. promotionalProducts not primary owner copy");
  check(
    /presentAttention|scrubOwnerFacing|Reason unavailable|flag reason is unavailable/i.test(presentation + attention),
    "13. unknown reason remains truthfully represented",
  );

  check(/EXPLICIT/.test(care) && /HEURISTIC/.test(care), "14. Client Care EXPLICIT vs HEURISTIC remains visible");
  check(!/customerEmail|phoneNumber|phone_number|\.email\b/.test(leoUi), "15. no PII expansion");

  check(
    /no executive memories recorded yet/i.test(memory) && /never\s+invents\s+memory/i.test(memory),
    "16. Living Book empty state says no memory without inventing one",
  );

  check(/GREEN/.test(gov) && /YELLOW/.test(gov) && /RED/.test(gov) && /NEVER/.test(gov), "17. governance semantics preserved");
  check(/CHUY APPROVAL REQUIRED/i.test(conv), "18. RED still says Chuy approval");
  check(
    !/>\s*Send\s*<|>\s*Deploy\s*<|>\s*Publish\s*<|>\s*Schedule\s*<|>\s*Pay\s*</i.test(leoUi),
    "19. no execution controls",
  );
  check(
    /Evidence-grounded AI reasoning/.test(cap) &&
      /Not connected yet|Coming later/i.test(cap) &&
      !/Coming later[\s\S]*AI reasoning|Not connected yet[\s\S]*AI reasoning/i.test(cap),
    "20. capability unavailable features marked not connected; AI reasoning available",
  );

  check(/href:\s*["']\/admin\/leo["']/.test(nav), "21. Admin navigation contains /admin/leo");
  check(
    /href:\s*["']\/admin["']/.test(nav) &&
      /href:\s*["']\/admin\/leads\/inbox["']/.test(nav) &&
      /href:\s*["']\/admin\/tienda["']/.test(nav),
    "22. nav change does not remove existing entries",
  );

  // Broad Admin change smoke: Command Center / dashboard data helpers untouched in this gate's leo paths
  check(
    !/AdminCommandCenter|getAdminDashboardSnapshot/.test(leoUi),
    "23. no broad Admin changes in LEO UI",
  );

  check(!/openai|@ai-sdk|anthropic|generateText|chat\.completions/i.test(leoUi), "24. no AI/provider import added");

  const migrations = existsSync(path.join(ROOT, "supabase/migrations"))
    ? readdirSync(path.join(ROOT, "supabase/migrations")).filter((m) => m.endsWith(".sql"))
    : [];
  const leoMigrations = migrations.filter((m) => /leo_/i.test(m) || /_leo_/i.test(m));
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "25. no migration",
  );
  check(!/serviceWorker|workbox|next-pwa/i.test(leoUi), "26. no PWA change");
  check(!/from\s+['\"][^'\"]*concierge|BusinessConcierge/i.test(leoUi), "27. no Business Concierge integration");
  check(!/sendEmail|resend|vercel\.deploy|gh workflow|calendar\.events/i.test(leoUi), "28. no external action path");
  check(/min-w-0|flex-col|sm:|max-w-/.test(leoUi), "29. mobile-safe classes/patterns preserved");
  check(/logo-clean\.png/.test(header), "30. official logo reference remains public/logo-clean.png");

  check(/isOwnerAdminRole/.test(access) && /\/admin\/leo/.test(access), "nav allowlist owner_admin gated");
  check(/"nav\.leo"/.test(strings), "nav label string exists");
  check(/Today(&apos;|')s Top Priorities|What Needs Attention/.test(attention), "priorities section titled for owners");
  check(/Who(&apos;|')s Waiting|Client Care/.test(care), "care section titled for owners");
  check(/getLeoAttentionBrief/.test(attentionSvc), "attention service still the load path");

  if (failures > 0) {
    console.error(`\nLEO-9B verifier: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nLEO-9B verifier: PASS");
}

main();
