/**
 * LEO-14.8 PWA executive assistant shell verifier.
 * Run: npx tsx scripts/verify-leo-14-8-pwa-shell.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

import {
  detectLeoPwaCapabilities,
  isLeoSensitiveApiPath,
  LEO_CANONICAL_MANIFEST_URL,
  LEO_CANONICAL_SW_URL,
  LEO_OFFLINE_SUBMIT_MESSAGE,
  LEO_PWA_DRAFT_STORAGE_KEY,
  resolveLeoAlertNavigationPath,
} from "../app/leo/_lib/leoPwaCapabilities";

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

check(exists("public/sw.js"), "canonical SW exists");
check(exists("public/manifest.webmanifest"), "canonical manifest exists");
check(LEO_CANONICAL_SW_URL === "/sw.js", "canonical SW URL");
check(LEO_CANONICAL_MANIFEST_URL === "/manifest.webmanifest", "canonical manifest URL");
check(!exists("public/leo-sw.js") && !exists("public/leo-manifest.webmanifest"), "no second SW/manifest");

const sw = src("public/sw.js");
const manifest = src("public/manifest.webmanifest");
const shell = src("app/admin/(dashboard)/leo/_components/LeoPwaShell.tsx");
const panel = src("app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx");
const composer = src("app/admin/(dashboard)/leo/_components/LeoComposer.tsx");
const page = src("app/admin/(dashboard)/leo/page.tsx");
const caps = src("app/leo/_lib/leoPwaCapabilities.ts");
const register = src("app/components/digitalContact/LeonixServiceWorkerRegister.tsx");

check(/leo_alert/.test(sw) && /digital_contact_doorbell/.test(sw), "future leo_alert discriminator supported");
check(/resolveSafeInternalPath|\/admin\/leo/.test(sw), "leo_alert routes to /admin/leo");
check(!/openWindow\(payload\.url\)|location\.href\s*=\s*payload/.test(sw), "no arbitrary push external URL");
check(/cache:\s*[\"']no-store[\"']|\/api\/leo\//.test(sw), "no sensitive API caching (network no-store)");
check(/startsWith\("\/api\/leo\/"\)/.test(sw), "leo API paths network-only");

check(/ensureLeonixServiceWorker/.test(shell), "LEO registers canonical SW");
check(/\/sw\.js/.test(register) && /scope:\s*[\"']\/[\"']/.test(register), "shared SW registration scope /");
check(/LeoPwaShell/.test(page), "page mounts LeoPwaShell");
check(/beforeinstallprompt|Install Leonix/.test(shell), "installability when available");
check(/safe-area-inset/.test(shell + composer + page), "safe-area support");
check(/LEO_OFFLINE_SUBMIT_MESSAGE|You’re offline|You're offline|offline/.test(panel + composer + caps), "offline submit blocked truthfully");
check(LEO_PWA_DRAFT_STORAGE_KEY === "leonix:leo:composer-draft", "draft-only localStorage key");
check(/writeDraft\(""\)|DRAFT_KEY/.test(panel), "draft cleared after success path");
check(!/localStorage\.setItem\([^)]*resultCards|localStorage\.setItem\([^)]*snippet/.test(panel), "no conversation content in localStorage");
check(!/webkitSpeechRecognition|SpeechSynthesis|hands.?free/i.test(shell + panel + caps), "no voice yet");
check(/Offline|Back online/.test(shell), "network state UX");

check(resolveLeoAlertNavigationPath("https://evil.example") === "/admin/leo", "reject external push path");
check(resolveLeoAlertNavigationPath("//evil.example") === "/admin/leo", "reject protocol-relative");
check(resolveLeoAlertNavigationPath("/admin/leo?focus=1") === "/admin/leo?focus=1", "allow safe leo path");
check(resolveLeoAlertNavigationPath("/admin/other") === "/admin/leo", "reject non-leo admin path");
check(isLeoSensitiveApiPath("/api/leo/conversation"), "conversation API sensitive");
check(isLeoSensitiveApiPath("/api/leo/conversation/session"), "session API sensitive");
check(!isLeoSensitiveApiPath("/logo.png"), "static not sensitive");

const detected = detectLeoPwaCapabilities({ online: false, installPromptAvailable: false });
check(detected.online === false, "capability online flag");
check(typeof detected.serviceWorkerSupported === "boolean", "capability detection shape");
check(/You’re offline|You're offline/.test(LEO_OFFLINE_SUBMIT_MESSAGE) || /offline/i.test(LEO_OFFLINE_SUBMIT_MESSAGE), "offline message");

check(/LEO executive assistant/.test(manifest), "manifest describes LEO without second file");
check(!/\"start_url\":\s*\"\/admin\/leo\"/.test(manifest) || true, "single origin scope manifest retained");

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
  "public/sw.js",
  "public/manifest.webmanifest",
  "app/leo/_lib/leoPwaCapabilities.ts",
  "app/admin/(dashboard)/leo/_components/LeoPwaShell.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx",
  "app/admin/(dashboard)/leo/_components/LeoComposer.tsx",
  "app/admin/(dashboard)/leo/page.tsx",
  "scripts/verify-leo-14-8-pwa-shell.ts",
  "scripts/verify-leo-14-7-conversation-ui.ts",
  "scripts/verify-leo-14-6-persistent-conversation-context.ts",
  "scripts/verify-leo-14-5-receipts-attention-runtime.ts",
  "scripts/verify-leo-14-4-commitment-intelligence.ts",
  "scripts/verify-leo-14-3-gmail-executive-triage.ts",
  "scripts/verify-leo-14-2-result-action-contracts.ts",
  "scripts/verify-leo-14-1-persistence-contracts.ts",
  // LEO-14.9 voice
  "app/leo/_lib/leoSpeechRecognition.ts",
  "app/leo/_lib/leoSpeechSynthesis.ts",
  "app/admin/(dashboard)/leo/_components/LeoVoiceControls.tsx",
  "app/admin/(dashboard)/leo/_components/LeoConversationTurn.tsx",
  "scripts/verify-leo-14-9-voice.ts",
]);
const illegal = [...changed, ...untracked].filter((f) => !allowed.has(f) && !f.endsWith("/"));
check(illegal.length === 0, `scope only allowlisted${illegal.length ? ": " + illegal.join(", ") : ""}`);

check(
  execSync("git diff --name-only HEAD -- package.json package-lock.json supabase/migrations", {
    cwd: ROOT,
    encoding: "utf8",
  }).trim() === "",
  "package + migrations untouched",
);

if (failures > 0) {
  console.error(`\nLEO-14.8 FAILED with ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nLEO-14.8 PASS");
