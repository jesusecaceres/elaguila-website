/**
 * LEO-1 Executive Truth Adapter Foundation — targeted construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-1-executive-truth-adapter.ts
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function src(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel: string): boolean {
  return existsSync(path.join(ROOT, rel));
}

/** LEO-7 allows exactly one API: app/api/leo/conversation/route.ts — no other LEO routes. */
function leoSurfaceAllowed(): boolean {
  if (!exists("app/api/leo")) return true;
  if (!exists("app/api/leo/conversation/route.ts")) return false;
  const routes: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === "route.ts") routes.push(path.relative(path.join(ROOT, "app/api/leo"), p));
    }
  };
  walk(path.join(ROOT, "app/api/leo"));
  return routes.length === 1 && routes[0].replace(/\\/g, "/") === "conversation/route.ts";
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
  const typesPath = "app/leo/_lib/leoTypes.ts";
  const accessPath = "app/leo/_lib/leoAccess.ts";
  const adapterPath = "app/leo/_lib/leoAdminTruthAdapter.ts";

  check(exists(typesPath), "Foundation file exists: leoTypes.ts");
  check(exists(accessPath), "Foundation file exists: leoAccess.ts");
  check(exists(adapterPath), "Foundation file exists: leoAdminTruthAdapter.ts");

  const types = src(typesPath);
  const access = src(accessPath);
  const adapter = src(adapterPath);

  // --- Access: owner-only, server-only ---
  check(access.includes('import "server-only"'), "leoAccess is server-only");
  check(
    access.includes("getCurrentAdminAccessContext") && access.includes("isOwnerAdminRole"),
    "leoAccess reuses Admin access helpers",
  );
  check(
    access.includes('role: "owner_admin"') && access.includes("hasAdminCookie"),
    "leoAccess requires owner_admin + admin cookie",
  );
  check(
    access.includes('"sales_rep"') && access.includes('"support_admin"'),
    "leoAccess explicitly denies sales_rep and support_admin paths",
  );
  check(!access.includes("middleware"), "leoAccess does not modify middleware");
  check(!/cookies\(\)\.set|createCookie|new cookie/i.test(access), "leoAccess does not invent cookies");

  // --- Types: unavailable/unknown representable ---
  check(
    types.includes('"LIVE"') &&
      types.includes('"PARTIAL"') &&
      types.includes('"UNAVAILABLE"') &&
      types.includes('"UNKNOWN"'),
    "leoTypes includes LIVE/PARTIAL/UNAVAILABLE/UNKNOWN",
  );
  check(types.includes("LeoProvenance") && types.includes("LeoObservation"), "leoTypes has provenance + observation contracts");
  check(
    !types.includes("AttentionEngine") && !/openai|llm|generateText/i.test(types),
    "leoTypes has no AttentionEngine class name and no AI architecture",
  );

  // --- Adapter: read Admin truth, no writes, no AI, no Concierge ---
  check(adapter.includes('import "server-only"'), "leoAdminTruthAdapter is server-only");
  check(
    adapter.includes("getAdminDashboardSnapshot") && adapter.includes("getAdminDashboardLeadsCounts"),
    "adapter imports existing Admin dashboard truth helpers",
  );
  check(
    adapter.includes("requireLeoOwnerAccess") || adapter.includes("resolveLeoAccess"),
    "adapter enforces LEO owner access",
  );
  check(adapter.includes("getLeoExecutiveTruthSnapshot"), "adapter exports getLeoExecutiveTruthSnapshot");
  check(
    adapter.includes("classifyDashboardReviewRowFlagTruth"),
    "adapter reuses Admin flag truth classifier for review provenance",
  );
  check(
    adapter.includes("ADMIN_REVIEW_REASON_SECONDARY_FALLBACK") || adapter.includes("UNKNOWN"),
    "adapter preserves unavailable/unknown reason semantics",
  );

  const writePatterns = [
    /\.insert\s*\(/,
    /\.update\s*\(/,
    /\.upsert\s*\(/,
    /\.delete\s*\(/,
    /\.rpc\s*\(/,
  ];
  check(
    writePatterns.every((re) => !re.test(adapter)),
    "adapter contains no Supabase mutation/write calls",
  );

  check(
    !/openai\.com|chat\.completions|generateText|generateObject|from ["']openai["']|@ai-sdk|anthropic|geminiAssistant|runListingAiModeration/i.test(
      adapter,
    ),
    "adapter contains no LLM/provider calls",
  );
  check(
    !/business-concierge|BusinessConcierge|diyConcierge|living.?business.?book|app\/lib\/business/i.test(adapter),
    "adapter does not import Business Concierge",
  );
  check(
    !/ownerEmail|ownerPhone|contact_email|contact_phone|raw_result|raw_input/i.test(adapter) ||
      (!adapter.includes("ownerEmail:") && !adapter.includes("ownerPhone:")),
    "adapter does not dump owner email/phone or raw moderation payloads",
  );
  check(
    !adapter.includes("process.env.SUPABASE_SERVICE_ROLE_KEY") &&
      !adapter.includes("process.env.OPENAI_API_KEY") &&
      !adapter.includes("process.env.RESEND_API_KEY"),
    "adapter does not surface service-role or provider secrets",
  );
  check(
    !/from ["']@\/app\/(api|components|leo\/ui)/.test(adapter) && !adapter.includes("use client"),
    "adapter is not a public/client UI or API route",
  );
  check(
    !/guess reason|likely reason|probably because|invent/i.test(adapter),
    "adapter has no guess-reason behavior",
  );
  check(
    adapter.includes("UNAVAILABLE") && (adapter.includes("UNKNOWN") || adapter.includes("PARTIAL")),
    "adapter preserves degraded availability states",
  );
  check(
    adapter.includes("notClaiming") || adapter.includes("LEO_1_NOT_CLAIMING"),
    "adapter explicitly documents what LEO-1 is not claiming",
  );

  // --- Scope: no UI; only optional LEO-7 conversation API ---
  check(!exists("app/leo/page.tsx"), "no LEO UI page created");
  check(leoSurfaceAllowed(), "LEO API surface limited to conversation route (or absent)");
  check(!exists("app/leo/_components"), "no LEO UI components directory created");

  // --- Admin / Concierge / schema untouched at source level of this verifier scope ---
  check(exists("app/admin/_lib/adminDashboardData.ts"), "Admin dashboard data still present (reuse target)");
  check(
    !adapter.includes("supabase/migrations") && !types.includes("CREATE TABLE"),
    "no schema creation in LEO foundation files",
  );

  if (failures > 0) {
    console.error(`\nLEO-1 verifier FAILED with ${failures} check(s).`);
    process.exit(1);
  }
  console.log("\nLEO-1 verifier PASSED.");
}

main();
