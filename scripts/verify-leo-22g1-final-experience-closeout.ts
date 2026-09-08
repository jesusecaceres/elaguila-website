/**
 * LEO-22G.1 — Final experience closeout (three scoped repairs).
 * Self-contained. Does not nest historical verifiers. Does not apply migrations.
 *
 *   npx tsx scripts/verify-leo-22g1-final-experience-closeout.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  leoResultCardsToAddressableItems,
  resolveLeoVisibleItemByNumber,
} from "../app/leo/_lib/leoSpokenContext";
import type { LeoResultCard } from "../app/leo/_lib/leoTypes";
import { LEO_WORKSPACE_CATALOG } from "../app/leo/_lib/leoWorkspaceModel";

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

const files = {
  hands: "app/admin/(dashboard)/leo/_components/LeoHandsFreeMode.tsx",
  session: "app/admin/(dashboard)/leo/_components/LeoSpokenSession.tsx",
  synth: "app/leo/_lib/leoSpeechSynthesis.ts",
  hfState: "app/leo/_lib/leoHandsFreeState.ts",
  spoken: "app/leo/_lib/leoSpokenContext.ts",
  page: "app/admin/(dashboard)/leo/page.tsx",
  reports: "app/admin/(dashboard)/leo/_components/LeoExecutiveReportsPanel.tsx",
  service: "app/leo/_lib/leoExecutiveReportingService.ts",
  surface: "app/admin/(dashboard)/leo/_components/LeoWorkspaceSurface.tsx",
  catalog: "app/leo/_lib/leoWorkspaceModel.ts",
  shell: "app/admin/(dashboard)/leo/_components/LeoOperatingShell.tsx",
  gmailCfg: "app/leo/_lib/leoGoogleWorkspaceConfig.ts",
};

for (const f of Object.values(files)) check(exists(f), `exists ${f}`);

const hands = src(files.hands);
const session = src(files.session);
const synth = src(files.synth);
const hfState = src(files.hfState);
const spoken = src(files.spoken);
const page = src(files.page);
const reports = src(files.reports);
const service = src(files.service);
const surface = src(files.surface);
const catalog = src(files.catalog);
const shell = src(files.shell);
const gmailCfg = src(files.gmailCfg);

check(
  synth.includes("onEnd?:") && synth.includes("callbacks.onEnd?.()"),
  "synthesis exposes real completion callback",
);
check(
  session.includes("options?: { onEnded?: () => void }") &&
    session.includes("utteranceEndedRef") &&
    session.includes("fireUtteranceEnded") &&
    session.includes("onEnd: () =>") &&
    session.includes("utteranceEndedRef.current = null"),
  "spoken session forwards synthesis onEnd and clears callback on stop",
);
check(
  hands.includes("spokenSession.speak") &&
    hands.includes("onEnded: completeSpeech") &&
    hands.includes('apply("SPEECH_END")') &&
    !hands.includes("createLeoSpeechSynthesisController"),
  "Hands-Free SPEECH_END is driven by shared session onEnded (no second TTS owner)",
);
check(
  hands.includes("watchdogRef") &&
    hands.includes("clearSpeechWatchdog") &&
    hands.includes("Math.max(20000") &&
    !hands.includes("Math.min(12000") &&
    hands.indexOf("onEnded: completeSpeech") < hands.indexOf("watchdogRef.current = window.setTimeout"),
  "length timer is watchdog fallback only; cancelled on real completion",
);
check(
  hands.includes("utteranceIdRef") &&
    hands.includes("if (!activeRef.current) return") &&
    hands.includes("utteranceIdRef.current !== utteranceId") &&
    hands.includes("stateRef.current !== \"SPEAKING\""),
  "stale/cancelled/unmounted onEnd cannot advance a new utterance",
);
check(
  !hands.includes("getUserMedia") &&
    hands.includes("if (!active) return null") &&
    hands.includes("Pause hands-free") &&
    hands.includes("End hands-free") &&
    hands.includes("Stop speaking") &&
    hands.includes("Repeat"),
  "no automatic mic start; owner controls preserved",
);
check(
  hands.includes("leoHandsFreeGenericYesCannotExecute") &&
    !hands.includes("leoExecuteGovernedConnectedAction") &&
    hfState.includes("leoHandsFreeGenericYesCannotExecute"),
  "RED voice execution remains impossible from Hands-Free",
);

const emailItems = leoResultCardsToAddressableItems([
  {
    kind: "EMAIL",
    cardId: "card-email-1",
    title: "Invoice follow-up",
    subtitle: null,
    whyItMatters: null,
    reason: null,
    evidenceRefs: [],
    sourceSystem: "GOOGLE_GMAIL",
    actions: [],
    spokenSummary: "Invoice from Ana.",
    messageId: "msg-1",
    threadId: "thread-88",
    senderDisplayName: null,
    senderAddress: null,
    subject: "Invoice",
    snippet: null,
    receivedAt: null,
    readState: "UNREAD",
    direction: "INBOUND",
    triageState: null,
    senderClass: "UNKNOWN",
    relationshipClass: "UNKNOWN",
    attentionLabel: "NONE",
    gmailOpenUrl: null,
  } as unknown as LeoResultCard,
]);
check(emailItems.length === 1 && emailItems[0].index === 1, "numbered addressable ordering preserved");
check(
  emailItems[0]?.entityRef?.id === "thread-88" &&
    emailItems[0]?.entityRef?.kind === "EMAIL" &&
    emailItems[0]?.entityRef?.system === "GOOGLE_GMAIL",
  "email result card retains canonical thread identity",
);

const genericItems = leoResultCardsToAddressableItems([
  {
    kind: "GENERIC",
    cardId: "card-generic-1",
    title: "Note",
    subtitle: null,
    whyItMatters: null,
    reason: null,
    evidenceRefs: [],
    sourceSystem: "LEO",
    actions: [],
    spokenSummary: "A note.",
  } as unknown as LeoResultCard,
]);
check(genericItems[0]?.entityRef === null, "generic cards do not fabricate entity ids");
check(
  spoken.includes("function entityRefFromResultCard") &&
    spoken.includes("entityRef: entityRefFromResultCard(card)") &&
    !spoken.includes("entityRef: null") &&
    spoken.includes("resolveLeoVisibleItemByNumber") &&
    !spoken.includes("crypto.randomUUID") &&
    !spoken.includes("Math.random()"),
  "entityRef mapped from real card identity; numbered resolution not duplicated",
);
check(
  resolveLeoVisibleItemByNumber(emailItems, 1)?.cardId === "card-email-1" &&
    resolveLeoVisibleItemByNumber(emailItems, 2) === null,
  "numbered item resolution preserved",
);

check(
  !page.includes("REPORTS: home") &&
    page.includes("<LeoExecutiveReportsPanel") &&
    page.includes("getLeoExecutiveReportingSnapshot") &&
    reports.includes("composeLeoExecutiveReportingSummary") &&
    reports.includes('data-leo-workspace-panel="REPORTS"') &&
    !reports.includes("collectLeoExecutiveReportingSnapshot") &&
    service.includes("collectLeoExecutiveReportingSnapshot") &&
    service.includes("export async function getLeoExecutiveReportingSnapshot"),
  "REPORTS is distinct from HOME and uses canonical executive snapshot",
);
check(
  page.includes("HOME: home") &&
    page.includes("<LeoMorningBriefPanel") &&
    catalog.includes('panelHint: "LeoExecutiveReportsPanel"') &&
    catalog.includes('panelHint: "LeoMorningBriefPanel"'),
  "HOME remains morning brief; REPORTS catalog points at reports panel",
);

const reportsDef = LEO_WORKSPACE_CATALOG.find((w) => w.id === "REPORTS");
const gmailDef = LEO_WORKSPACE_CATALOG.find((w) => w.id === "GMAIL");
const calendarDef = LEO_WORKSPACE_CATALOG.find((w) => w.id === "CALENDAR");
const projectsDef = LEO_WORKSPACE_CATALOG.find((w) => w.id === "PROJECTS");
const revenueDef = LEO_WORKSPACE_CATALOG.find((w) => w.id === "REVENUE");
check(reportsDef?.renderer === "existing", "REPORTS renderer is existing panel");
check(
  gmailDef?.renderer === "conversation_backed_placeholder" &&
    calendarDef?.renderer === "conversation_backed_placeholder" &&
    projectsDef?.renderer === "conversation_backed_placeholder" &&
    revenueDef?.renderer === "conversation_backed_placeholder" &&
    surface.includes("data-leo-workspace-placeholder") &&
    !page.includes("GMAIL:") &&
    !page.includes("CALENDAR:") &&
    !page.includes("PROJECTS:") &&
    !page.includes("REVENUE:"),
  "Gmail/Calendar/Projects/Revenue stay conversation-backed placeholders",
);

check(shell.includes("data-leo-conversation-first"), "conversation-first shell preserved");
check(
  !hands.includes("classifyLeoConversationFallback") &&
    !page.includes("callLeoAiProvider") &&
    src("app/leo/_lib/leoConversationService.ts").includes("GENERAL_REASONING"),
  "general AI runtime unchanged by this closeout",
);
check(
  src("app/admin/(dashboard)/leo/_components/LeoResponseActionBar.tsx").includes("Thumbs down"),
  "feedback runtime unchanged",
);
check(
  src("app/leo/_lib/leoCockpitHealth.ts").includes("AUTH_REQUIRED"),
  "cockpit truth unchanged",
);
check(
  gmailCfg.includes("LEO_GMAIL_REPLY_WRITE_CAPABILITY_ENABLED: boolean = false") &&
    gmailCfg.includes('v.trim().toLowerCase() === "true"'),
  "Gmail write flag unchanged / remains disabled",
);
check(
  !process.env.LEO_GMAIL_REPLY_WRITE_ENABLED ||
    process.env.LEO_GMAIL_REPLY_WRITE_ENABLED.trim().toLowerCase() !== "true",
  "write env remains OFF",
);
check(!page.includes("leoExecuteGovernedConnectedAction"), "no RED bypass on LEO page");
check(!reports.includes("messages.send"), "reports panel does not send email");

const elapsedMs = Date.now() - started;
if (failures > 0) {
  console.error(`\nLEO-22G.1 verifier FAILED (${failures}) in ${elapsedMs}ms`);
  process.exit(1);
}
console.log(`\nLEO-22G.1 verifier PASSED in ${elapsedMs}ms`);
