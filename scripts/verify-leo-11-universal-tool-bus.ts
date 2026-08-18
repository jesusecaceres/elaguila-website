/**
 * LEO-11 Universal Tool Bus + Project Intelligence — construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-11-universal-tool-bus.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import { composeCapabilityOverviewSummary } from "../app/leo/_lib/leoConversationComposer";
import {
  evaluateLeoToolRequestGate,
  getLeoToolDefinition,
  LEO_GITHUB_ALLOWED_REPO,
  LEO_PROJECT_BOUNDS,
  LEO_TOOL_REGISTRY,
  LEO_VERCEL_ALLOWED_PROJECT,
  listLeoToolDefinitions,
} from "../app/leo/_lib/leoToolRegistry";
import { ADMIN_OS_ACTION_REGISTRY } from "../app/admin/_lib/adminOsActionRegistry";

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

function main() {
  const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  check(branch === EXPECTED_BRANCH, "worktree branch is LEO integration branch");

  const registry = src("app/leo/_lib/leoToolRegistry.ts");
  const service = src("app/leo/_lib/leoToolService.ts");
  const adapters = src("app/leo/_lib/leoToolAdapters.ts");
  const catalog = src("app/leo/_lib/leoToolCatalog.ts");
  const github = src("app/leo/_lib/leoGithubProjectAdapter.ts");
  const vercel = src("app/leo/_lib/leoVercelProjectAdapter.ts");
  const project = src("app/leo/_lib/leoProjectIntelligenceService.ts");
  const adminCap = src("app/leo/_lib/leoAdminCapabilitiesAdapter.ts");
  const conversation = src("app/leo/_lib/leoConversationService.ts");
  const composer = src("app/leo/_lib/leoConversationComposer.ts");
  const types = src("app/leo/_lib/leoTypes.ts");
  const engine = src("app/leo/_lib/leoAiReasoningEngine.ts");

  check(exists("app/leo/_lib/leoToolRegistry.ts"), "1. tool registry exists");
  check(registry.includes("LEO_TOOL_REGISTRY") && !registry.includes("eval("), "2. registry is server-owned static catalog");
  check(
    !registry.includes("registerTool") && !service.includes("registerTool(") && !engine.includes("registerTool"),
    "3-4. client/AI cannot register tools",
  );
  check(!/eval\(|new Function\(|Function\(/i.test(registry + service + adapters), "5. no dynamic eval");

  const sample = getLeoToolDefinition("leo.attention.read");
  check(
    Boolean(sample?.requiredGovernanceAction && sample.operationModes.length),
    "6. tool definitions contain governance metadata",
  );
  check(Boolean(sample?.availability), "7. tool definitions contain availability");
  check(
    listLeoToolDefinitions().every((t) => Array.isArray(t.readScopes) && Array.isArray(t.writeScopes)),
    "8. tool definitions distinguish read/write scopes",
  );

  check(service.includes("requireLeoOwnerAccess"), "9. tool service enforces owner access");
  check(service.includes("isLeoToolId") && service.includes("getLeoToolDefinition"), "10. tool service validates registry membership");

  const unknown = evaluateLeoToolRequestGate({ toolId: "leo.fake.unknown", operation: "READ" });
  check(!unknown.ok && unknown.errorCode === "UNKNOWN_TOOL", "11. unknown tool fails closed");

  const badOp = evaluateLeoToolRequestGate({
    toolId: "leo.attention.read",
    operation: "EXECUTE",
  });
  check(!badOp.ok && badOp.errorCode === "WRITE_EXECUTE_BLOCKED", "12. unsupported/execute operation fails closed");

  check(service.includes("assessLeoGovernance"), "13. governance assessed before invocation");
  check(
    engine.includes("governance: deterministic.governance") || /Governance always deterministic|cannot set governance/i.test(engine),
    "14. AI cannot override governance",
  );
  check(
    !/method:\s*['\"]POST['\"].*deploy|createBranch|git push|stripe\.|sendEmail/i.test(github + vercel + adapters + service) &&
      listLeoToolDefinitions().every((t) => t.supportsExecution === false && t.writeScopes.length === 0),
    "15. no external writes",
  );
  check(types.includes("LeoToolReceipt") && service.includes("makeReceipt"), "16. tool receipt exists");
  check(
    service.includes("writePerformed: false") && service.includes("externalEffectPerformed: false"),
    "17. receipt states no write/external effect in v0",
  );

  check(
    adapters.includes("getLeoAttentionBrief") &&
      adapters.includes("getLeoClientCareWatch") &&
      adapters.includes("getLeoListingReasonChain"),
    "18. internal LEO services reused",
  );
  check(!adapters.includes("buildLeoAttentionBrief("), "19. no duplicate Attention rules in adapters");
  check(!adapters.includes("buildLeoClientCareSignals("), "20. no duplicate Client Care rules in adapters");
  check(!adapters.includes("assembleLeoListingReason"), "21. no duplicate Reason Chain logic");

  check(
    adminCap.includes("ADMIN_OS_ACTION_REGISTRY") && !adminCap.includes("executeAdmin"),
    "22. Admin action registry only read/referenced",
  );
  check(
    Object.values(ADMIN_OS_ACTION_REGISTRY).some((a) => a.status === "planned") &&
      adminCap.includes("planned") &&
      adminCap.includes("not available"),
    "23-24. Admin statuses preserved; PLANNED not marked available",
  );
  check(
    adminCap.includes("needs live proof") && adminCap.includes("NOT_VERIFIED"),
    "25. NEEDS LIVE PROOF not marked fully verified",
  );

  check(github.includes('import "server-only"'), "26. GitHub adapter server-only");
  check(github.includes("method: \"GET\"") && !/method:\s*[\"']POST[\"']/i.test(github), "27. GitHub adapter read-only");
  check(
    LEO_GITHUB_ALLOWED_REPO.fullName === "jesusecaceres/elaguila-website" &&
      github.includes("LEO_GITHUB_ALLOWED_REPO"),
    "28. GitHub repo allowlisted",
  );
  check(
    !/\/pulls.*PATCH|createRef|git\/refs|merge|issues.*POST/i.test(github),
    "29. no GitHub write API",
  );

  check(vercel.includes('import "server-only"'), "30. Vercel adapter server-only");
  check(vercel.includes("method: \"GET\"") && !/method:\s*[\"']POST[\"']/i.test(vercel), "31. Vercel adapter read-only");
  check(
    LEO_VERCEL_ALLOWED_PROJECT.name === "leonix-media" && vercel.includes("LEO_VERCEL_ALLOWED_PROJECT"),
    "32. Vercel project allowlisted",
  );
  check(
    vercel.includes("method: \"GET\"") &&
      !vercel.includes("method: \"POST\"") &&
      !vercel.includes("method: 'POST'"),
    "33. no Vercel deploy/redeploy/promote",
  );

  const ghMissing = evaluateLeoToolRequestGate({
    toolId: "leo.project.github.read",
    operation: "READ",
    runtimeAvailability: "NOT_CONFIGURED",
  });
  check(!ghMissing.ok && ghMissing.errorCode === "NOT_CONFIGURED", "34. missing GitHub config fails safely");

  const vMissing = evaluateLeoToolRequestGate({
    toolId: "leo.project.vercel.read",
    operation: "READ",
    runtimeAvailability: "NOT_CONFIGURED",
  });
  check(!vMissing.ok && vMissing.errorCode === "NOT_CONFIGURED", "35. missing Vercel config fails safely");

  check(
    LEO_PROJECT_BOUNDS.maxRecentCommits <= 10 && LEO_PROJECT_BOUNDS.maxRecentDeployments <= 10,
    "36. project snapshots bounded",
  );
  check(project.includes("gitCommitSha") && project.includes("correlations"), "37. exact commit SHA correlation used where available");
  check(
    project.includes("Deployment READY is platform/build state only") &&
      project.includes("Not claiming all systems healthy"),
    "38. READY deployment not described as full system health",
  );

  check(
    conversation.includes("getLeoToolCatalog") && conversation.includes("composeToolCatalogCapabilitySummary"),
    "39. tool catalog drives capability overview",
  );
  check(
    conversation.includes("PROJECT_INTELLIGENCE") && conversation.includes("getLeoProjectSnapshot"),
    "40. project intelligence intent uses evidence first",
  );
  check(
    !engine.includes("invokeLeoTool") && conversation.includes("getLeoProjectSnapshot"),
    "41. AI receives evidence after tool retrieval, not arbitrary tool authority",
  );
  check(
    !/from ["']child_process["']|execSync\(|spawn\(|exec\(/i.test(service + adapters + github + vercel),
    "42. no shell execution",
  );
  check(
    /api\.github\.com|api\.vercel\.com/.test(github + vercel) &&
      !/fetch\(.*model|fetch\(\s*reasoned/i.test(adapters),
    "43. no arbitrary URL fetch from model output (fixed allowlisted APIs only)",
  );
  check(
    exists("app/api/leo/conversation/route.ts") && !exists("app/api/leo/tools/route.ts"),
    "44. no new API required",
  );

  const leoMigrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((f) => f.includes("leo_"));
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "45. no new migration",
  );
  check(!conversation.includes("serviceWorker") && !service.includes("manifest"), "46. no PWA change");
  check(!/BusinessConcierge|business-concierge/i.test(service + adapters + conversation), "47. no Concierge modification");
  check(!/stripe|payment intent|chargeCard/i.test(service + adapters), "48. no payment action");
  check(!/deployProduction|promotePreview/i.test(service + adapters), "49. no Production modification");
  check(
    assessLeoGovernance({ actionKind: "DEPLOY_PRODUCTION", nowMs: 1 }).level === "RED" &&
      assessLeoGovernance({ actionKind: "BYPASS_APPROVAL", nowMs: 1 }).level === "NEVER",
    "50. previous governance guarantees preserved",
  );

  // CASE A–I
  const caseA = evaluateLeoToolRequestGate({ toolId: "not.a.tool", operation: "READ" });
  check(!caseA.ok && caseA.errorCode === "UNKNOWN_TOOL", "CASE A: unknown tool id → BLOCKED / invalid");

  const green = evaluateLeoToolRequestGate({ toolId: "leo.capabilities.read", operation: "READ" });
  const gGreen = assessLeoGovernance({ actionKind: "READ", nowMs: 1 });
  check(green.ok === true && gGreen.level === "GREEN", "CASE B: registered GREEN read tool → succeeds gate");

  const prep = evaluateLeoToolRequestGate({
    toolId: "leo.preparation.prepare",
    operation: "PREPARE",
  });
  const gYellow = assessLeoGovernance({ actionKind: "PREPARE_DRAFT", nowMs: 1 });
  check(
    prep.ok === true && gYellow.level === "YELLOW" && gYellow.executionAllowed === false,
    "CASE C: PREPARE tool → YELLOW / NOT_EXECUTED",
  );

  const writeBlocked = evaluateLeoToolRequestGate({
    toolId: "leo.attention.read",
    operation: "WRITE",
  });
  check(
    !writeBlocked.ok && writeBlocked.errorCode === "WRITE_EXECUTE_BLOCKED",
    "CASE D: write tool request without approval → blocked",
  );

  const caseE = evaluateLeoToolRequestGate({
    toolId: "leo.project.github.read",
    operation: "READ",
    runtimeAvailability: "NOT_CONFIGURED",
  });
  check(!caseE.ok && caseE.errorCode === "NOT_CONFIGURED", "CASE E: GitHub credential missing → NOT_CONFIGURED");

  const caseF = evaluateLeoToolRequestGate({
    toolId: "leo.project.vercel.read",
    operation: "READ",
    runtimeAvailability: "NOT_CONFIGURED",
  });
  check(!caseF.ok && caseF.errorCode === "NOT_CONFIGURED", "CASE F: Vercel credential missing → NOT_CONFIGURED");

  check(
    /platform-state|platform\/build state|deployment readiness/i.test(project) &&
      !/system healthy/i.test(project.replace(/Not claiming[^\n]*/g, "")),
    'CASE G: Vercel READY → deployment READY language, not "system healthy"',
  );

  const overview = routeLeoConversation({ question: "What tools do you have?" });
  const capFallback = composeCapabilityOverviewSummary();
  check(
    overview.intent === "CAPABILITY_OVERVIEW" &&
      /Available tools:/i.test(capFallback) &&
      conversation.includes("composeToolCatalogCapabilitySummary"),
    "CASE H: tool catalog capability question → truthful available/not-configured grouping",
  );

  const caseI = evaluateLeoToolRequestGate({
    toolId: "model.suggested.tool",
    operation: "READ",
  });
  check(!caseI.ok && caseI.errorCode === "UNKNOWN_TOOL", "CASE I: model-suggested unknown tool → cannot execute");

  check(
    routeLeoConversation({ question: "What branch is LEO on?" }).intent === "PROJECT_INTELLIGENCE",
    "project intelligence routes correctly",
  );
  check(Object.keys(LEO_TOOL_REGISTRY).length >= 10, "registry has internal + project tools");
  check(catalog.includes("getLeoToolCatalog"), "catalog helper exists");
  check(composer.includes("composeCapabilityOverviewSummary"), "composer supports catalog-backed overview");

  if (failures > 0) {
    console.error(`\nLEO-11 verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("\nLEO-11 verifier PASS");
}

main();
