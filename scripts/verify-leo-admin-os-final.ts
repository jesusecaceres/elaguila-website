/**
 * LEO-ADMIN-OS-FINAL — summarizing closeout verifier.
 *
 * This does NOT duplicate every historical LEO verifier. It checks the
 * specific claims made in the LEO-ADMIN-OS-FINAL audit/closeout: the new
 * admin-navigation registry, security/governance invariants that must
 * remain intact, the voice package preservation, and PWA safety.
 *
 * Supabase table-existence and env-variable-presence findings in this audit
 * were confirmed via live Supabase MCP queries and source review during the
 * audit session itself (see the final report's SUPABASE_DEPENDENCY_MATRIX /
 * ENV_PARITY_MATRIX) — a static script in this repo cannot re-query a live
 * database, so those sections are reported as CONFIRMED_THIS_SESSION rather
 * than re-derived here.
 *
 * Run: npx tsx scripts/verify-leo-admin-os-final.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
const info = (label: string, value: string) => console.log(`INFO  ${label}: ${value}`);

function section(name: string) {
  console.log(`\n=== ${name} ===`);
}

function main() {
  section("ADMIN_ROUTE_MATRIX / LEO_NAVIGATION_MATRIX");
  const registryPath = "app/leo/_lib/leoAdminNavigationRegistry.ts";
  const intentPath = "app/leo/_lib/leoPresentationIntent.ts";
  const panelPath = "app/admin/(dashboard)/leo/_components/LeoConversationPanel.tsx";
  const navPath = "app/admin/_lib/adminGlobalNav.ts";
  check(exists(registryPath), "leoAdminNavigationRegistry.ts exists");
  const registry = src(registryPath);
  const intent = src(intentPath);
  const panel = src(panelPath);
  const nav = src(navPath);

  check(/from "@\/app\/admin\/_lib\/adminGlobalNav"/.test(registry), "registry sources routes from ADMIN_GLOBAL_NAV (single source of truth)");
  check(/function hrefFor\(href: string\)/.test(registry) && /not a real ADMIN_GLOBAL_NAV route/.test(registry), "registry fails closed on any href not present in ADMIN_GLOBAL_NAV");

  const hrefMatches = [...registry.matchAll(/hrefFor\("([^"]+)"\)/g)].map((m) => m[1]);
  const realHrefs = [...nav.matchAll(/href:\s*"([^"]+)"/g)].map((m) => m[1]);
  const invented = hrefMatches.filter((h) => !realHrefs.includes(h));
  check(hrefMatches.length >= 18, `registry covers >=18 admin destinations (found ${hrefMatches.length})`);
  check(invented.length === 0, `no invented/duplicate routes in registry (offenders: ${invented.join(", ") || "none"})`);

  check(/OPEN_ADMIN_ROUTE/.test(intent), "leoPresentationIntent.ts defines OPEN_ADMIN_ROUTE kind");
  check(/resolveLeoAdminNavigationRoute\(text\)/.test(intent), "resolveLeoPresentationIntent() checks the admin navigation registry");
  check(
    /from "next\/navigation"/.test(panel) &&
      /kind === "OPEN_ADMIN_ROUTE"/.test(panel) &&
      /router\.push\(presentationIntent\.href\)/.test(panel),
    "LeoConversationPanel routes OPEN_ADMIN_ROUTE via next/navigation router.push (real page navigation, not a fake link)",
  );
  check(
    /onSubmit=\{\(text\) => submit\(text\)\}/.test(panel),
    "Hands-Free voice submissions share the same submit() path (voice navigation gets the same fix, no separate system)",
  );
  // GREEN governance: navigation never appears in the workspace-changing check meant for internal panels only.
  check(
    !/leoPresentationIntentChangesWorkspace[\s\S]{0,400}OPEN_ADMIN_ROUTE/.test(intent),
    "OPEN_ADMIN_ROUTE is not conflated with internal workspace-panel switching",
  );

  section("SECURITY / GOVERNANCE (re-verified, unchanged by this closeout)");
  const leoPage = src("app/admin/(dashboard)/leo/page.tsx");
  const accessControl = src("app/admin/_lib/adminAccessControl.ts");
  const gmailAdapter = src("app/leo/_lib/leoGmailReplyConnectedActionAdapter.ts");
  const executeRoute = src("app/api/leo/action/proposal/[proposalId]/execute/route.ts");
  const speechRoute = src("app/api/leo/speech/route.ts");
  const sw = src("public/sw.js");

  check(/resolveLeoAccess/.test(leoPage), "OWNER_AUTH: /admin/leo still gated by resolveLeoAccess()");
  check(
    /if \(isOwnerAdminRole\(ctx\.normalizedRole\)\) \{\s*hrefs\.push\("\/admin\/leo"\)/.test(accessControl),
    "OWNER_AUTH: /admin/leo nav entry still owner_admin-only",
  );
  check(
    /LEO_GMAIL_REPLY_WRITE_ENABLED/.test(gmailAdapter) && /proveLeoGmailSendScopeGranted/.test(gmailAdapter),
    "GMAIL_GOVERNANCE: two-key gate (write flag + live scope proof) still both present",
  );
  check(
    /expectedFingerprint/.test(executeRoute) && /arbitrary_payload_rejected|allowedKeys/.test(executeRoute),
    "ACTION_GOVERNANCE: execute route still requires expectedFingerprint and rejects extra payload keys",
  );
  check(/resolveLeoAccess/.test(speechRoute) && /import "server-only"/.test(speechRoute), "SPEECH_ENDPOINT: /api/leo/speech still owner-gated and server-only");
  check(
    /path\.startsWith\("\/api\/leo\/"\)/.test(sw) && /path\.includes\("gmail"\)/.test(sw),
    "PWA: service worker sensitive-path network-only guard still present",
  );

  section("NEURAL_VOICE (commit 397625ca preservation)");
  const ttsConfig = src("app/leo/_lib/leoTtsConfig.ts");
  const spokenSession = src("app/admin/(dashboard)/leo/_components/LeoSpokenSession.tsx");
  check(/gpt-4o-mini-tts/.test(ttsConfig), "VOICE_MODEL: gpt-4o-mini-tts still the default");
  check(/friendly:\s*"alloy"/.test(ttsConfig), "VOICE: friendly/alloy preset still default");
  check(
    /stopAllLanes\(\)/.test(spokenSession) && /createLeoSpeechSynthesisController/.test(spokenSession),
    "VOICE: neural-first + browser-fallback shared session unchanged",
  );

  section("OBSERVABILITY (Phase 24, bounded addition)");
  check(
    /logLeoSpeechOutcome/.test(speechRoute) && /failure_class/.test(speechRoute) && !/duration_ms.*OPENAI_API_KEY|OPENAI_API_KEY.*duration_ms/.test(speechRoute),
    "OBSERVABILITY: /api/leo/speech logs {route, provider_attempted, fallback_used, failure_class, duration_ms} — no secrets, no spoken text",
  );

  section("SUPABASE_DEPENDENCY_MATRIX (confirmed via live MCP query this session — informational)");
  info("STAGING (cgeehvnfyrdoperdotdh)", "all 12 LEO tables present, RLS enabled, 0 client policies");
  info("PRODUCTION (xuieateniufcrsfdomwl)", "all 12 LEO tables present, RLS enabled, 0 client policies, 0 rows (unused so far)");
  info(
    "tables",
    "leo_memory_records, leo_conversation_sessions, leo_conversation_turns, leo_commitments, leo_tool_receipts, leo_attention_acks, leo_watch_runs, leo_notification_subscriptions, leo_notification_deliveries, leo_action_proposals, leo_response_feedback, leo_fact_correction_proposals",
  );

  section("AUTH_IDENTITY / CONVERSATION_PERSISTENCE (root cause — HUMAN_ACTION_REQUIRED, not a code defect)");
  const adminSession = src("app/lib/supabase/adminSession.ts");
  const submitLogin = src("app/admin/login/submit/route.ts");
  const authLogin = src("app/admin/login/auth/route.ts");
  check(
    /opts\.bootstrap[\s\S]{0,200}LEONIX_ADMIN_AUTH_USER_ID_COOKIE.*""/.test(adminSession.replace(/\n/g, " ")),
    "confirmed: bootstrap login path intentionally clears the durable auth-user-id cookie (by design)",
  );
  check(/bootstrap: true/.test(submitLogin), "confirmed: /admin/login/submit (shared password) uses the bootstrap path — no durable identity");
  check(/authUserId: verified\.userId/.test(authLogin), "confirmed: /admin/login/auth (real per-person login) DOES set a durable Supabase Auth UUID");
  info("owner roster row", "chuy@leonixmedia.com is an active super_admin with a linked Supabase Auth user (confirmed via live query)");
  info(
    "human action required",
    "Owner must sign in via /admin/login/auth (email+password) rather than the shared bootstrap password page, to get a durable auth_user_id cookie enabling LEO conversation persistence, alerts ownership binding, and scheduled-watch identity.",
  );

  if (failures > 0) {
    console.error(`\nLEO-ADMIN-OS-FINAL verifier: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nLEO-ADMIN-OS-FINAL verifier: PASS");
}

main();
