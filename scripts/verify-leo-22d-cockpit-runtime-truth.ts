/**
 * LEO-22D — Cockpit runtime truth (source contract).
 * Self-contained. Does not nest historical verifiers. Does not apply migrations.
 *
 *   npx tsx scripts/verify-leo-22d-cockpit-runtime-truth.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { classifyLeoKnownLoadError } from "../app/leo/_lib/leoCockpitHealth";

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

const started = Date.now();
const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
check(branch === EXPECTED_BRANCH, "correct integration branch");

const files = [
  "app/leo/_lib/leoCockpitHealth.ts",
  "app/leo/_lib/leoCockpitLoaders.ts",
  "app/leo/_lib/leoGoogleWorkspaceCapabilityTruth.ts",
  "app/admin/(dashboard)/leo/page.tsx",
  "app/admin/(dashboard)/leo/_components/LeoCapabilityStrip.tsx",
  "supabase/migrations/20260822120000_leo22c_response_feedback.sql",
];
for (const f of files) check(exists(f), `exists ${f}`);

const health = src("app/leo/_lib/leoCockpitHealth.ts");
const loaders = src("app/leo/_lib/leoCockpitLoaders.ts");
const google = src("app/leo/_lib/leoGoogleWorkspaceCapabilityTruth.ts");
const page = src("app/admin/(dashboard)/leo/page.tsx");
const strip = src("app/admin/(dashboard)/leo/_components/LeoCapabilityStrip.tsx");
const attention = src("app/admin/(dashboard)/leo/_components/LeoAttentionPanel.tsx");
const governed = src("app/admin/(dashboard)/leo/_components/LeoGovernedActionsPanel.tsx");
const alerts = src("app/admin/(dashboard)/leo/_components/LeoNotificationSettings.tsx");
const project = src("app/leo/_lib/leoProjectConfig.ts");
const mig = src("supabase/migrations/20260822120000_leo22c_response_feedback.sql");
const gmailCfg = src("app/leo/_lib/leoGoogleWorkspaceConfig.ts");

check(
  health.includes("AUTH_REQUIRED") &&
    health.includes("UNPROVEN") &&
    health.includes("NOT_CONFIGURED") &&
    health.includes("PERMISSION_REQUIRED"),
  "canonical owner-facing health semantic",
);
check(loaders.includes("missing_owner_actor_id") || health.includes("missing_owner_actor_id"), "auth identity classified");
check(loaders.includes("loadLeoGovernedActionsCockpit") && loaders.includes("AUTH_REQUIRED"), "governed action load classified");
check(loaders.includes("loadLeoAttentionCockpit") && !page.includes("Attention data is currently unavailable."), "attention no longer generic-only");
check(alerts.includes("missing_auth_user_id") && alerts.includes("AUTH_REQUIRED"), "alerts auth limitation classified");
check(
  strip.includes("connector connected") &&
    strip.includes("project intelligence") &&
    project.includes("connectorConnected") &&
    project.includes("projectIntelligenceConfigured"),
  "GitHub/Vercel connector vs project-config distinguished",
);
check(
  google.includes("gmailSendScopeProven") &&
    google.includes("writeFlagEnabled") &&
    google.includes("gmailReplyExecutionAvailable") &&
    google.includes("UNPROVEN"),
  "Google Workspace capability truth includes read/send-scope/flag/execution",
);
check(page.includes("loadLeoAttentionCockpit") && page.includes("loadLeoGovernedActionsCockpit"), "page uses classified loaders");
check(page.includes("ATTENTION:") && page.includes("GOVERNED_ACTIONS:"), "22 workspace integration preserved");
check(attention.includes("data-leo-health") && governed.includes("data-leo-health"), "classified health rendered");
check(!mig.includes("DROP TABLE") && mig.includes("ENABLE ROW LEVEL SECURITY") && !mig.includes("TO anon"), "feedback migration safe / unapplied");
check(gmailCfg.includes('v.trim().toLowerCase() === "true"'), "Gmail write flag unchanged");
check(!page.includes("leoExecuteGovernedConnectedAction"), "no RED bypass on page");
check(src("app/admin/(dashboard)/leo/_components/LeoOperatingShell.tsx").includes("data-leo-conversation-first"), "22A preserved");
check(src("app/leo/_lib/leoSpokenContext.ts").includes("resolveLeoReadableContext"), "22B preserved");
check(src("app/admin/(dashboard)/leo/_components/LeoResponseActionBar.tsx").includes("Thumbs down"), "22C preserved");
check(classifyLeoKnownLoadError("missing_auth_user_id") === "AUTH_REQUIRED", "classifier maps missing auth user id");

check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22D verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22D verifier PASSED in ${elapsedMs}ms`);
