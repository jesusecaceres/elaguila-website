/**
 * LEO-22A — Conversation-first shell (source contract).
 * Self-contained. Does not nest historical verifiers.
 *
 *   npx tsx scripts/verify-leo-22a-conversation-first-shell.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import { resolveLeoPresentationIntent } from "../app/leo/_lib/leoPresentationIntent";
import { LEO_WORKSPACE_IDS, isLeoWorkspaceId } from "../app/leo/_lib/leoWorkspaceModel";

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

const page = "app/admin/(dashboard)/leo/page.tsx";
const panel = "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx";
const shell = "app/admin/(dashboard)/leo/_components/LeoOperatingShell.tsx";
const controller = "app/admin/(dashboard)/leo/_components/LeoWorkspaceController.tsx";
const surface = "app/admin/(dashboard)/leo/_components/LeoWorkspaceSurface.tsx";
const model = "app/leo/_lib/leoWorkspaceModel.ts";
const intent = "app/leo/_lib/leoPresentationIntent.ts";
const convoApi = "app/api/leo/conversation/route.ts";
const types = "app/leo/_lib/leoTypes.ts";

for (const p of [page, panel, shell, controller, surface, model, intent, convoApi, types]) {
  check(exists(p), `exists ${p}`);
}

const pageSrc = src(page);
const panelSrc = src(panel);
const shellSrc = src(shell);
const controllerSrc = src(controller);
const typesSrc = src(types);
const apiSrc = src(convoApi);

check(shellSrc.includes("data-leo-conversation-first"), "cold-start conversation-first marker");
check(pageSrc.indexOf("LeoOperatingShell") < pageSrc.indexOf("leo-controls-heading"), "conversation shell before utility controls");
check(
  pageSrc.includes("HOME: home") &&
    pageSrc.includes("<LeoOperatingShell") &&
    pageSrc.includes("<LeoMorningBriefPanel"),
  "operating shell wraps executive content; morning brief is a workspace slot",
);
check(panelSrc.includes("Ready when you are."), "cold-start greeting present");

check(LEO_WORKSPACE_IDS.includes("HOME") && LEO_WORKSPACE_IDS.includes("ATTENTION"), "typed workspace model");
check(isLeoWorkspaceId("GMAIL") && isLeoWorkspaceId("CALENDAR"), "gmail/calendar workspace ids exist");
check(controllerSrc.includes("goBack") && controllerSrc.includes("history"), "workspace back history");
check(controllerSrc.includes("setWorkspace") && controllerSrc.includes("activeWorkspace"), "workspace controller");

check(
  resolveLeoPresentationIntent("take me to reports").kind === "PRESENT" &&
    resolveLeoPresentationIntent("show me gmail").kind === "PRESENT" &&
    resolveLeoPresentationIntent("show me my calendar").kind === "PRESENT" &&
    resolveLeoPresentationIntent("go back").kind === "BACK" &&
    resolveLeoPresentationIntent("take me to the dashboard").kind === "NAVIGATE",
  "presentation resolver maps high-confidence commands",
);
check(
  resolveLeoPresentationIntent("why is technology degraded?").kind === "NONE",
  "reasoning questions are not treated as navigation",
);

check(src("app/api/leo/conversation/route.ts").includes("runLeoPersistentConversation"), "canonical conversation endpoint");
check(panelSrc.includes('fetch("/api/leo/conversation"'), "conversation panel still posts to canonical endpoint");
check(!pageSrc.includes("LeoConversationPanel2") && !exists("app/admin/(dashboard)/leo/_components/LeoConversationPanelAlt.tsx"), "no duplicate conversation system");

check(
  typesSrc.includes("activeWorkspace") &&
    panelSrc.includes("activeWorkspace: workspace.activeWorkspace") &&
    panelSrc.includes("selectedCardId") &&
    panelSrc.includes("selectedEntityRef") &&
    panelSrc.includes("visibleCardIds"),
  "client context preserves card/entity and includes active workspace",
);

check(
  !panelSrc.includes("LEO_GMAIL_REPLY_WRITE_ENABLED") &&
    !controllerSrc.includes("messages.send") &&
    !src("app/leo/_lib/leoPresentationIntent.ts").includes("messages.send"),
  "navigation does not enable Gmail write or send",
);
check(
  !panelSrc.includes("leoExecuteGovernedConnectedAction") &&
    !shellSrc.includes("leoExecuteGovernedConnectedAction"),
  "shell does not execute governed actions",
);

check(shellSrc.includes("lg:grid-cols-") || shellSrc.includes("lg:grid"), "desktop adaptive two-region layout");
check(panelSrc.includes("min-h-[44px]") || src("app/admin/(dashboard)/leo/_components/LeoComposer.tsx").includes("min-h-[48px]"), "touch targets");
check(pageSrc.includes("env(safe-area-inset-top)"), "safe-area insets");

check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write flag remains OFF in this process",
);

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22A verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22A verifier PASSED in ${elapsedMs}ms`);
