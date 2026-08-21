/**
 * LEO-20B Self-Intelligence executive cockpit verifier (static + regression).
 *
 * Run:
 *   npx tsx scripts/verify-leo-20b-self-intelligence-cockpit.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED_BRANCH = "integration/leo-executive-operating-intelligence-2026-08";

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

const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

const pageRel = "app/admin/(dashboard)/leo/page.tsx";
const panelRel = "app/admin/(dashboard)/leo/_components/LeoSelfIntelligencePanel.tsx";
const presentRel = "app/admin/(dashboard)/leo/_components/leoOwnerPresentation.ts";
const serviceRel = "app/leo/_lib/leoSelfIntelligenceService.ts";

check(exists(pageRel), "existing LEO owner page reused");
check(exists(panelRel), "Self-Intelligence panel component exists");
check(exists(serviceRel), "canonical Self-Intelligence service exists");

const pageSrc = src(pageRel);
const panelSrc = src(panelRel);
const presentSrc = src(presentRel);
const serviceSrc = src(serviceRel);

check(pageSrc.includes("LeoSelfIntelligencePanel"), "page mounts Self-Intelligence panel");
check(pageSrc.includes("getLeoSelfIntelligence"), "page uses canonical SI service");
check(pageSrc.includes("resolveLeoAccess"), "owner-only access preserved on page");
check(!pageSrc.includes("createLeoSelfIntelligence"), "no alternate SI factory on page");
check(
  !exists("app/admin/(dashboard)/leo/self-intelligence/page.tsx") &&
    !exists("app/leo/self-intelligence/page.tsx"),
  "no new parallel dashboard route",
);

check(panelSrc.includes("getLeoSelfIntelligence") === false, "panel does not call SI service itself");
check(panelSrc.includes("assembleLeonixInternalIntelligenceProfile") === false, "no profile calc in UI");
check(panelSrc.includes("rankLeoSelfIntelligenceNextMoves") === false, "no NRM ranking in UI");
check(panelSrc.includes("adaptLeoSelfIntelligence") === false, "no adapters in UI");
check(panelSrc.includes("overallInterpretation"), "overall interpretation visible");
check(panelSrc.includes("topNextMove") || panelSrc.includes("NextRightMoveHero"), "Next Right Move visible");
check(panelSrc.includes("What LEO cannot currently measure"), "blind spots section visible");
check(panelSrc.includes("LEO_SELF_INTELLIGENCE_V1_DIMENSIONS"), "four V1 dimensions driven by canonical list");
check(panelSrc.includes("Recommendation only"), "authority language present");
check(!/execute\s*button|onExecute|Execute now|Run recommendation/i.test(panelSrc), "no execute button");
check(!/createLeoActionProposal|proposeAction|automatic proposal/i.test(panelSrc), "no automatic proposal");
check(!panelSrc.includes("health ="), "no fake health score string");
check(!/\bletter\s*grade\b/i.test(panelSrc), "no letter grade");
check(!/trend|sparkline|MRR|ARR|SEO is poor/i.test(panelSrc), "no fake analytics/trends claims");
check(panelSrc.includes("grid-cols-1"), "mobile-first single column layout");
check(panelSrc.includes("min-w-0"), "overflow-safe min-w-0");
check(panelSrc.includes("touch-manipulation"), "touch-safe controls");
check(panelSrc.includes("Temporarily unavailable") || panelSrc.includes("temporarily unavailable"), "failure state present");

check(presentSrc.includes("presentSelfIntelligenceDimension"), "owner dimension labels");
check(presentSrc.includes("Revenue & Monetization"), "human Revenue label");
check(presentSrc.includes("Needs attention"), "human NEEDS_ATTENTION label");
check(presentSrc.includes("Not measured"), "human NOT_MEASURED label");
check(presentSrc.includes("Product Operations"), "human Product Operations label");

check(serviceSrc.includes("requireLeoOwnerAccess"), "SI service owner-only");

const nrmSrc = src("app/leo/_lib/leoSelfIntelligenceNextMove.ts");
check(nrmSrc.includes("leoCanExecuteWithCurrentAuthority: false"), "leoCanExecute defaults false");
check(panelSrc.includes("Capability is not authority"), "UI states CAPABILITY != AUTHORITY");

const migrationsDir = path.join(ROOT, "supabase", "migrations");
if (existsSync(migrationsDir)) {
  const recent = readdirSync(migrationsDir).filter((f) => /self.?intelligence|si_cockpit|20b/i.test(f));
  check(recent.length === 0, "no Self-Intelligence migration added");
} else {
  check(true, "no Self-Intelligence migration added (no migrations dir match)");
}

check(!panelSrc.includes("supabase.from"), "no new persistence in SI UI");
check(!pageSrc.includes("create table"), "no SQL in page");
check(
  !pageSrc.includes("collectLeoExecutiveReportingSnapshot") &&
    pageSrc.includes("getLeoSelfIntelligence"),
  "no duplicate Executive Reporting queries in page for SI",
);
check(!panelSrc.includes("buildLeoSystemHealthSnapshot"), "UI does not own System Health");

console.log("\n--- LEO-20A regression ---");
try {
  execSync("npx tsx scripts/verify-leo-20a-self-intelligence-foundation.ts", {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  check(true, "20A verifier still passes");
} catch {
  check(false, "20A verifier still passes");
}

if (failures > 0) {
  console.error(`\nLEO-20B verifier FAILED (${failures}).`);
  process.exit(1);
}
console.log("\nLEO-20B verifier PASSED.");
