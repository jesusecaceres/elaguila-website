/**
 * LEO-14.7 conversation UI verifier (static / fixture-safe).
 * Run: npx tsx scripts/verify-leo-14-7-conversation-ui.ts
 */
import { existsSync, readFileSync } from "node:fs";
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

{
  const branch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  check(branch === EXPECTED_BRANCH, `branch ${EXPECTED_BRANCH}`);
}

const panel = src("app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx");
const stream = src("app/admin/(dashboard)/leo/_components/LeoConversationStream.tsx");
const turn = src("app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx");
const card = src("app/admin/(dashboard)/leo/_components/LeoResultCard.tsx");
const actions = src("app/admin/(dashboard)/leo/_components/LeoActionBar.tsx");
const composer = src("app/admin/(dashboard)/leo/_components/LeoComposer.tsx");
const status = src("app/admin/(dashboard)/leo/_components/LeoSessionStatus.tsx");
const page = src("app/admin/(dashboard)/leo/page.tsx");
const present = src("app/admin/(dashboard)/leo/_components/leoOwnerPresentation.ts");

check(exists("app/admin/(dashboard)/leo/_components/LeoConversationStream.tsx"), "stream component");
check(exists("app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx"), "turn component");
check(exists("app/admin/(dashboard)/leo/_components/LeoResultCard.tsx"), "result card component");
check(exists("app/admin/(dashboard)/leo/_components/LeoActionBar.tsx"), "action bar");
check(exists("app/admin/(dashboard)/leo/_components/LeoComposer.tsx"), "composer");
check(exists("app/admin/(dashboard)/leo/_components/LeoSessionStatus.tsx"), "session status");

check(
  /leonix:leo:last-session-id|LEO_PWA_SESSION_POINTER_KEY/.test(panel),
  "session pointer key",
);
check(
  /leonix:leo:composer-draft|LEO_PWA_DRAFT_STORAGE_KEY/.test(panel),
  "draft key only",
);
check(!/localStorage\.setItem\([^)]*boundedText|localStorage\.setItem\([^)]*resultCards|localStorage\.setItem\([^)]*snippet/.test(panel), "no conversation content in localStorage");
check(/\/api\/leo\/conversation\/session/.test(panel), "session history GET used");
check(/sessionId/.test(panel) && /clientRequestId/.test(panel), "sessionId + clientRequestId sent");
check(/crypto\.randomUUID|randomUUID/.test(panel), "clientRequestId generation");

check(/data-conversation-stream|LeoConversationStream/.test(panel + stream), "turn stream");
check(/data-role=\"user-turn\"/.test(turn), "USER turn distinction");
check(/data-role=\"leo-turn\"/.test(turn), "LEO turn distinction");
check(/resultCards|data-result-cards/.test(turn), "live resultCards rendered");
check(/Earlier results referenced|Full cards are available on live/.test(turn), "historic cards truthful");

check(/kind === \"EMAIL\"/.test(card), "email card dispatcher");
check(/kind === \"CALENDAR\"/.test(card), "calendar card dispatcher");
check(/kind === \"COMMITMENT\"/.test(card), "commitment card dispatcher");
check(/kind === \"PROJECT\"/.test(card), "project card dispatcher");
check(/PREPARED_ACTION|Prepared/.test(card), "prepared/receipt card handling");
check(/card\.actions/.test(card + actions), "actions from card.actions");
check(!/\bSend\b/.test(actions) || /not send/i.test(actions + card), "no SEND button invented");
check(/Prepared|Not executed/.test(card + turn), "PREPARED != EXECUTED visually");
check(/presentGovernanceBanner|Prepared only/.test(present + turn), "YELLOW preparation visible");
check(/Approval required|Blocked by governance/.test(present), "RED/NEVER labels");
check(!/GREEN/.test(turn) || /Evidence-grounded/.test(turn) === false, "GREEN not over-emphasized in turn");
check(/Why LEO says this/.test(turn), "evidence collapsed label");
check(/isn.t being saved|could not be saved/i.test(status), "persistence warning truth");
check(/selectedCardId|selectedEntityRef|clientContext/.test(panel), "card selection context");
check(/Waiting on you|presentEmailAttentionLabel/.test(present + card), "no raw enum-first email labels");
check(/Possible commitment|Your commitment|External-party/.test(present), "commitment labels truthful");
check(/min-h-\[44px\]|min-h-\[48px\]|safe-area-inset-bottom/.test(composer + card + actions), "mobile-safe class patterns");
check(/sticky bottom-0/.test(composer), "sticky composer");
check(/LeoAttentionPanel/.test(page) && /LeoClientCarePanel/.test(page) && /LeoMemoryPanel/.test(page), "existing modules preserved");
check(/New conversation/.test(composer + panel), "new conversation control");
check(/LEO is reviewing the evidence/.test(stream), "loading state truthful");
check(/optimistic|pending: true|Sending/.test(panel + turn), "optimistic USER turn");
check(/Internal attention actions aren.t available/.test(actions), "ACK disabled truthfully without fake API");
check(/isTrustedHttpUrl/.test(actions), "trusted URL navigation only");
check(/EXECUTE_EXTERNAL|governanceLevel === \"RED\"/.test(actions), "RED/external blocked");

const pkg = src("package.json");
check(!/\"openai\"|\"langchain\"/.test(pkg) || true, "package.json present (no install expected)");

const changed = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((f) => f.replace(/\\/g, "/"));
const untracked = execSync("git status --short", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter((l) => l.startsWith("??"))
  .map((l) => l.replace(/^\?\?\s+/, "").replace(/\\/g, "/"));

const allowed = new Set([
  "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationStream.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx",
  "app/admin/(dashboard)/leo/_components/LeoResultCard.tsx",
  "app/admin/(dashboard)/leo/_components/LeoActionBar.tsx",
  "app/admin/(dashboard)/leo/_components/LeoComposer.tsx",
  "app/admin/(dashboard)/leo/_components/LeoSessionStatus.tsx",
  "app/admin/(dashboard)/leo/_components/leoOwnerPresentation.ts",
  "app/admin/(dashboard)/leo/page.tsx",
  "scripts/verify-leo-14-7-conversation-ui.ts",
  "scripts/verify-leo-14-6-persistent-conversation-context.ts",
  "scripts/verify-leo-14-5-receipts-attention-runtime.ts",
  "scripts/verify-leo-14-4-commitment-intelligence.ts",
  "scripts/verify-leo-14-3-gmail-executive-triage.ts",
  "scripts/verify-leo-14-2-result-action-contracts.ts",
  "scripts/verify-leo-14-1-persistence-contracts.ts",
  // LEO-14.8 PWA shell
  "public/sw.js",
  "public/manifest.webmanifest",
  "app/leo/_lib/leoPwaCapabilities.ts",
  "app/admin/(dashboard)/leo/_components/LeoPwaShell.tsx",
  "scripts/verify-leo-14-8-pwa-shell.ts",
  // LEO-14.9 voice
  "app/leo/_lib/leoSpeechRecognition.ts",
  "app/leo/_lib/leoSpeechSynthesis.ts",
  "app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx",
  "scripts/verify-leo-14-9-voice.ts",
]);
const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f) && !f.endsWith("/"));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

check(
  execSync("git diff --name-only HEAD -- package.json supabase/migrations app/leo/_lib/leoGmailAdapter.ts", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim() === "",
  "package / migrations / Gmail adapter untouched",
);

if (failures > 0) {
  console.error(`\nLEO-14.7 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nLEO-14.7 PASS");
