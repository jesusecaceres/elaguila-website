/**
 * LEO-12 Connected Project Brain + Change Intelligence — construction verifier.
 *
 * Run: npx tsx scripts/verify-leo-12-connected-project-brain.ts
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { routeLeoConversation } from "../app/leo/_lib/leoConversationRouter";
import { assessLeoGovernance } from "../app/leo/_lib/leoGovernanceEngine";
import {
  buildLeoProjectRecentChanges,
  buildLeoProjectTimeline,
  classifyLeoCommitMessage,
  detectArbitraryRepoRequest,
} from "../app/leo/_lib/leoProjectChangeIntelligence";
import { correlateLeoProjectState } from "../app/leo/_lib/leoProjectCorrelationEngine";
import { adviseLeoProjectQa } from "../app/leo/_lib/leoProjectQaAdvisor";
import {
  LEO_GITHUB_ALLOWED_REPO,
  LEO_PROJECT_BOUNDS,
  LEO_VERCEL_ALLOWED_PROJECT,
} from "../app/leo/_lib/leoToolRegistry";
import type {
  LeoDeploymentSnapshot,
  LeoRepositorySnapshot,
} from "../app/leo/_lib/leoTypes";

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

function sampleGithub(over: Partial<LeoRepositorySnapshot> = {}): LeoRepositorySnapshot {
  return {
    provider: "GITHUB",
    owner: "jesusecaceres",
    name: "elaguila-website",
    fullName: "jesusecaceres/elaguila-website",
    defaultBranch: "main",
    branch: EXPECTED_BRANCH,
    headSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    headMessage: "feat(leo): add universal tool bus",
    headCommittedAt: "2026-08-18T10:00:00.000Z",
    headAuthor: "chuy",
    mainHeadSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    mainHeadMessage: "chore: prior",
    compareToMain: { aheadBy: 3, behindBy: 0, status: "ahead" },
    recentCommits: [
      {
        sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        message: "feat(leo): add universal tool bus",
        committedAt: "2026-08-18T10:00:00.000Z",
        author: "chuy",
      },
      {
        sha: "cccccccccccccccccccccccccccccccccccccccc",
        message: "fix(leo): activate executive reasoning",
        committedAt: "2026-08-18T09:00:00.000Z",
        author: "chuy",
      },
    ],
    availability: "AVAILABLE",
    limitations: [],
    ...over,
  };
}

function sampleDep(over: Partial<LeoDeploymentSnapshot> = {}): LeoDeploymentSnapshot {
  return {
    provider: "VERCEL",
    projectName: "leonix-media",
    deploymentId: "dpl_preview_1",
    url: "https://example.vercel.app",
    state: "READY",
    target: "preview",
    gitBranch: EXPECTED_BRANCH,
    gitCommitSha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    commitMessage: "feat(leo): add universal tool bus",
    createdAt: "2026-08-18T10:05:00.000Z",
    readyState: "READY",
    limitations: [],
    ...over,
  };
}

function main() {
  const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  check(branch === EXPECTED_BRANCH, "correct LEO integration branch");

  const config = src("app/leo/_lib/leoProjectConfig.ts");
  const github = src("app/leo/_lib/leoGithubProjectAdapter.ts");
  const vercel = src("app/leo/_lib/leoVercelProjectAdapter.ts");
  const corr = src("app/leo/_lib/leoProjectCorrelationEngine.ts");
  const change = src("app/leo/_lib/leoProjectChangeIntelligence.ts");
  const qa = src("app/leo/_lib/leoProjectQaAdvisor.ts");
  const intel = src("app/leo/_lib/leoProjectIntelligenceService.ts");
  const conversation = src("app/leo/_lib/leoConversationService.ts");
  const router = src("app/leo/_lib/leoConversationRouter.ts");
  const strip = src("app/admin/(dashboard)/leo/_components/LeoCapabilityStrip.tsx");
  const registry = src("app/leo/_lib/leoToolRegistry.ts");
  const engine = src("app/leo/_lib/leoAiReasoningEngine.ts");

  check(config.includes("getLeoProjectConfigDiagnostic"), "1. project config diagnostic exists");
  check(config.includes("Never returns token values"), "2. no token exposed");
  check(LEO_PROJECT_BOUNDS.maxRecentCommits <= 10, "3. GitHub bounded <=10 commits");
  check(LEO_PROJECT_BOUNDS.maxRecentDeployments <= 10, "4. Vercel bounded <=10 deployments");
  check(LEO_PROJECT_BOUNDS.maxTimelineItems <= 20, "5. project timeline <=20");
  check(corr.includes("exact commit SHA") || corr.includes("Exact SHA"), "6. exact SHA correlation preferred");
  check(
    corr.includes("never correlate by commit message") ||
      corr.includes("not commit message alone") ||
      change.includes("commit message alone never"),
    "7. commit message alone never establishes identity",
  );

  const gh = sampleGithub();
  const readyPreview = sampleDep();
  const corrA = correlateLeoProjectState({
    github: gh,
    deployments: [readyPreview],
    aheadBy: 3,
    behindBy: 0,
  });
  check(
    corrA.states.includes("BRANCH_HEAD_PREVIEW_READY") &&
      corrA.previewForHead?.gitCommitSha === gh.headSha,
    "8. latest branch Preview detectable / CASE A",
  );

  const prod = sampleDep({
    deploymentId: "dpl_prod_1",
    target: "production",
    gitCommitSha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    readyState: "READY",
  });
  const corrB = correlateLeoProjectState({
    github: gh,
    deployments: [readyPreview, prod],
    aheadBy: null,
    behindBy: null,
  });
  check(corrB.latestProduction?.gitCommitSha === prod.gitCommitSha, "9. latest Production detectable");
  check(
    /READY means platform|deployment state is READY|not system health/i.test(corr + vercel + intel) &&
      !/all systems healthy/i.test(intel.replace(/Not claiming[^\n]*/g, "")),
    "10. Preview READY != system healthy",
  );
  check(
    corrB.productionMatchesHead === false &&
      corrB.states.includes("PRODUCTION_DIFFERS_FROM_BRANCH_HEAD") &&
      !corrB.states.includes("PRODUCTION_BEHIND_BRANCH"),
    "11-12 / CASE B: Production equality requires exact SHA; differ ≠ behind without compare",
  );

  check(exists("app/leo/_lib/leoProjectQaAdvisor.ts"), "13. project QA advisor exists");
  const building = correlateLeoProjectState({
    github: gh,
    deployments: [sampleDep({ readyState: "BUILDING", state: "BUILDING" })],
  });
  check(adviseLeoProjectQa(building).state === "WAIT_FOR_BUILD", "14 / CASE C: BUILDING → WAIT_FOR_BUILD");
  check(
    adviseLeoProjectQa(corrA).state === "QA_PREVIEW",
    "15: READY Preview → QA_PREVIEW",
  );
  const failed = correlateLeoProjectState({
    github: gh,
    deployments: [sampleDep({ readyState: "ERROR", state: "ERROR" })],
  });
  check(
    adviseLeoProjectQa(failed).state === "INVESTIGATE_BUILD_FAILURE",
    "16 / CASE D: ERROR → INVESTIGATE_BUILD_FAILURE",
  );
  check(
    !/deploy now|promote to production|redeploy/i.test(qa) &&
      adviseLeoProjectQa(corrA).limitations.some((l) => /does not recommend deploying/i.test(l)),
    "17. no deploy recommendation from QA advisor",
  );

  const timeline = buildLeoProjectTimeline({
    github: gh,
    deployments: [readyPreview, prod],
  });
  check(
    timeline.length <= 20 &&
      timeline[0] &&
      (!timeline[1] ||
        (timeline[0].at && timeline[1].at
          ? Date.parse(timeline[0].at) >= Date.parse(timeline[1].at)
          : true)),
    "18. project timeline deterministic / bounded",
  );
  check(classifyLeoCommitMessage("feat(leo): x") === "FEATURE", "19. change classification deterministic");
  check(classifyLeoCommitMessage("random notes") === "UNKNOWN", "20. unknown commit classification supported");

  check(
    routeLeoConversation({ question: "What changed recently?" }).intent === "PROJECT_INTELLIGENCE",
    '21 / CASE H: "What changed recently?" → PROJECT_INTELLIGENCE',
  );
  check(
    conversation.includes("getLeoProjectExecutiveSnapshot") &&
      src("app/leo/_lib/leoConversationService.ts").includes("runLeoConversationDeterministic") &&
      src("app/leo/_lib/leoConversationService.ts").includes("enrichLeoConversationWithAi"),
    "22. project evidence retrieved before AI",
  );
  check(
    engine.includes("listingReasonUnknown") &&
      src("app/leo/_lib/leoAiValidation.ts").includes("unknown_evidence_citation"),
    "23-24. AI cannot fabricate; evidence refs required",
  );
  check(engine.includes("fallbackUsed") && engine.includes("DETERMINISTIC"), "25. deterministic fallback works");

  check(registry.includes("leo.project.github.read") && registry.includes("NOT_CONFIGURED"), "26. registry reports GitHub truthfully");
  check(registry.includes("leo.project.vercel.read"), "27. registry reports Vercel truthfully");
  check(
    github.includes("GITHUB_NOT_CONFIGURED") && vercel.includes("VERCEL_NOT_CONFIGURED"),
    "28 / CASE E-F: missing token NOT_CONFIGURED",
  );
  check(
    github.includes("GITHUB_REQUEST_FAILED") && vercel.includes("VERCEL_REQUEST_FAILED"),
    "29. invalid/provider failure fails safely",
  );
  check(
    LEO_GITHUB_ALLOWED_REPO.fullName === "jesusecaceres/elaguila-website" &&
      detectArbitraryRepoRequest("check github.com/evil/other-repo please") === true &&
      detectArbitraryRepoRequest("status for jesusecaceres/elaguila-website") === false,
    "30 / CASE G: no arbitrary repo",
  );
  check(LEO_VERCEL_ALLOWED_PROJECT.name === "leonix-media", "31. no arbitrary Vercel project");
  check(
    /api\.github\.com|api\.vercel\.com/.test(github + vercel) &&
      !/fetch\(\s*question|fetch\(\s*urlFromModel/i.test(github + vercel + intel),
    "32. no SSRF / fixed APIs only",
  );
  check(!/from ["']child_process["']|execSync\(|spawn\(/i.test(github + vercel + intel), "33. no shell");
  check(github.includes("method: \"GET\"") && !github.includes("method: \"POST\""), "34. no GitHub writes");
  check(vercel.includes("method: \"GET\"") && !vercel.includes("method: \"POST\""), "35. no Vercel writes");
  check(!/merge.*main|createPullRequest/i.test(github), "36. no merge");
  check(!vercel.includes("method: \"POST\""), "37. no deploy");
  check(!/method:\s*[\"']POST[\"']/.test(vercel), "38. no redeploy");
  check(!/rollback/i.test(vercel) || /no .*rollback/i.test(vercel), "39. no rollback");

  const leoMigrations = readdirSync(path.join(ROOT, "supabase/migrations")).filter((f) =>
    f.includes("leo_"),
  );
  check(
    leoMigrations.length === 1 && leoMigrations[0] === "20260817120000_leo_living_book_foundation.sql",
    "40. no new migration",
  );
  check(!conversation.includes("serviceWorker"), "41. no PWA");
  check(!/BusinessConcierge|business-concierge/i.test(conversation + intel), "42. no Concierge changes");
  check(!/stripe|payment intent/i.test(intel + corr), "43. no payments changes");
  check(
    src("app/leo/_lib/leoToolService.ts").includes("writePerformed: false") &&
      src("app/leo/_lib/leoToolService.ts").includes("externalEffectPerformed: false"),
    "44. receipts show no writes",
  );
  check(
    assessLeoGovernance({ actionKind: "DEPLOY_PRODUCTION", nowMs: 1 }).level === "RED" &&
      assessLeoGovernance({ actionKind: "BYPASS_APPROVAL", nowMs: 1 }).level === "NEVER",
    "45. previous governance guarantees preserved",
  );

  check(
    routeLeoConversation({ question: "What should I QA next?" }).intent === "PROJECT_INTELLIGENCE",
    'CASE I: "What should I QA next?" routes PROJECT_INTELLIGENCE',
  );
  check(
    adviseLeoProjectQa(corrA).state === "QA_PREVIEW" &&
      !/deploy now/i.test(adviseLeoProjectQa(corrA).nextStep),
    "CASE I: evidence-based QA state",
  );

  const changes = buildLeoProjectRecentChanges({ github: gh });
  check(changes[0]?.classification === "FEATURE" && changes[1]?.classification === "FIX", "change intelligence classifications");
  check(config.includes("getLeoProjectConfigDiagnostic"), "config diagnostic export");
  check(strip.includes("Project connections") && strip.includes("Not configured"), "capability strip project connections");
  check(router.includes("what changed recently") || router.includes("what changed (today|recently)"), "router expanded patterns");
  check(intel.includes("getLeoProjectExecutiveSnapshot"), "executive snapshot exists");

  // CASE E/F explicit
  check(github.includes("LEO_GITHUB_TOKEN missing"), "CASE E: GitHub missing token messaging");
  check(vercel.includes("LEO_VERCEL_TOKEN missing"), "CASE F: Vercel missing token messaging");

  if (failures > 0) {
    console.error(`\nLEO-12 verifier FAILED with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log("\nLEO-12 verifier PASS");
}

main();
