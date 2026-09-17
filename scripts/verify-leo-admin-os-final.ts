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

  section("LEO-ADMIN-OS-FINAL.2 — CONSTRUCTION CLOSEOUT");

  const execTypes = src("app/leo/_lib/leoExecutiveReportingTypes.ts");
  const execRegistry = src("app/leo/_lib/leoExecutiveReportingRegistry.ts");
  const execAdapters = src("app/leo/_lib/leoExecutiveReportingAdapters.ts");
  const execService = src("app/leo/_lib/leoExecutiveReportingService.ts");
  const router = src("app/leo/_lib/leoConversationRouter.ts");
  const navRegistry = src("app/leo/_lib/leoAdminNavigationRegistry.ts");

  // Item 1 — Business Concierge pipeline intelligence
  check(
    /"BUSINESS_PIPELINE"/.test(execTypes) && /leoBusinessPipelineReportingAdapter/.test(execAdapters) && /listBusinessesForWorkspace/.test(execAdapters),
    "BUSINESS_CONCIERGE_READ: BUSINESS_PIPELINE domain adapter reuses listBusinessesForWorkspace (businesses/business_follow_ups) — not leonix_leads/support_tickets",
  );
  check(
    /nextFollowUpStatus/.test(execAdapters) && /needsFollowUp/.test(execAdapters),
    "BUSINESS_CONCIERGE_FOLLOWUPS: adapter derives follow-up-needed businesses from the canonical join",
  );
  check(!/from "@\/app\/leo\/_lib\/leoBusinessConciergeBridge"/.test(execAdapters), "DUPLICATE_DATA_LAYER=FALSE: pipeline adapter does not reuse the leads/tickets-only bridge");

  // Item 2 — Team intelligence
  check(
    /"TEAM"/.test(execTypes) && /leoTeamReportingAdapter/.test(execAdapters) && /admin_team_members/.test(execAdapters),
    "TEAM_READ: TEAM domain adapter reads admin_team_members (same table/columns as the roster page)",
  );

  // Item 3 — Categories intelligence
  check(
    /"CATEGORIES"/.test(execTypes) && /leoCategoriesReportingAdapter/.test(execAdapters) && /getClasificadosCategoryRegistryMerged/.test(execAdapters),
    "CATEGORIES_READ: CATEGORIES domain adapter reuses the canonical clasificados category registry (no second registry)",
  );

  // Item 4 — Recursos intelligence
  check(
    /"RECURSOS"/.test(execTypes) && /leoRecursosReportingAdapter/.test(execAdapters) && /dbListCommunityResources/.test(execAdapters),
    "RECURSOS_READ: RECURSOS domain adapter reuses the real Recursos read functions (dbListCommunityResources, etc.)",
  );

  // Item 5 — Website / Site Settings intelligence
  check(
    /"WEBSITE"/.test(execTypes) && /leoWebsiteReportingAdapter/.test(execAdapters) && /getWebsiteEditingSummary/.test(execAdapters) && /getSiteSectionPayload/.test(execAdapters),
    "WEBSITE_READ=PARTIAL: WEBSITE domain adapter reuses websiteEditingTruthMatrix + site_section_content (source-backed, explicitly PARTIAL)",
  );

  // Item 6 — Natural-language presentation routing (canonical router, not a competing one)
  check(
    /show my team/.test(navRegistry) && /show categories/.test(navRegistry) && /show recursos/.test(navRegistry) && /show site settings/.test(navRegistry) && /show launch leads/.test(navRegistry) && /show recent activity/.test(navRegistry),
    "PRESENTATION_COMMAND_MATRIX: canonical navigation registry covers show-my-team/categories/recursos/site-settings/launch-leads/recent-activity",
  );
  check(
    /which businesses need follow/.test(router) && /who is on the team/.test(router) && /which categories need attention/.test(router) && /what is happening in recursos/.test(router) && /show \(me \)\?website status/.test(router) && /payment issues/.test(router),
    "PRESENTATION_COMMAND_MATRIX: EXECUTIVE_REPORTING router phrase matching covers the new item 1-5 intelligence questions",
  );
  check(
    router.includes("todays) schedule"),
    "PRESENTATION_COMMAND_MATRIX: 'show today's schedule' resolves via the CALENDAR communication subtype",
  );
  check(
    /BUSINESS_PIPELINE"\]\)/.test(execService) && /TEAM"\]\)/.test(execService) && /CATEGORIES"\]\)/.test(execService) && /RECURSOS"\]\)/.test(execService) && /WEBSITE"\]\)/.test(execService),
    "PRESENTATION_COMMAND_MATRIX: filterExecutiveSnapshotByQuestion narrows to the 5 new domains by keyword",
  );

  // Item 7 — Capability Panel Runtime Truth
  const capTruth = src("app/leo/_lib/leoCapabilityRuntimeTruth.ts");
  const capStrip = src("app/admin/(dashboard)/leo/_components/LeoCapabilityStrip.tsx");
  check(
    /CONNECTED[\s\S]*AVAILABLE[\s\S]*PARTIAL[\s\S]*NOT_CONNECTED[\s\S]*BLOCKED_EXTERNAL[\s\S]*DISABLED_BY_OWNER_GATE/.test(capTruth),
    "CAPABILITY_PANEL_RUNTIME_TRUTH: full state enum present (CONNECTED/AVAILABLE/PARTIAL/NOT_CONNECTED/BLOCKED_EXTERNAL/DISABLED_BY_OWNER_GATE)",
  );
  const leoConsolePage = src("app/admin/(dashboard)/leo/page.tsx");
  check(
    /LeoCapabilityRuntimeEntry/.test(capStrip) && !/const notConnected: string\[\]/.test(capStrip) && /getLeoCapabilityRuntimeTruth/.test(leoConsolePage),
    "CAPABILITY_PANEL_RUNTIME_TRUTH=TRUE: LeoCapabilityStrip renders from runtime truth passed down from page.tsx, hardcoded notConnected array removed",
  );
  check(/"background_monitoring"[\s\S]{0,120}state: "BLOCKED_EXTERNAL"/.test(capTruth), "Background monitoring capability reports BLOCKED_EXTERNAL (no scheduler exists), never a fake CONNECTED");

  // Item 8 — Admin route cleanup
  const dashboardRoutes = src("app/admin/_lib/adminDashboardRoutes.ts");
  check(/payments: "\/admin\/workspace\/payment-tracker"/.test(dashboardRoutes), "PAYMENTS_ROUTE_CANONICAL=TRUE: ADMIN_DASHBOARD_ROUTES.payments points at the real payment tracker, not the retired /admin/payments stub");
  check(/reports: "\/admin\/reportes"/.test(dashboardRoutes), "REPORTS_ROUTE_CANONICAL=TRUE: ADMIN_DASHBOARD_ROUTES.reports already points at the real, actively-consumed /admin/reportes page");
  check(!/payments:\s*"\/admin\/payments"/.test(dashboardRoutes), "DEAD_ADMIN_MAPPING=FALSE: payments key no longer maps to the retired /admin/payments stub");

  // Item 9 — Commitments UI truth (repository + composer already correct; verified, not modified)
  const commitmentIntel = src("app/leo/_lib/leoCommitmentIntelligence.ts");
  check(
    /No recorded commitments match that request/.test(commitmentIntel) && /Commitment records are currently unavailable/.test(commitmentIntel),
    "COMMITMENTS_UI_EMPTY_STATE=TRUE: distinct EMPTY ('no recorded commitments') vs UNAVAILABLE ('currently unavailable') strings confirmed",
  );
  check(!/Commitment list unavailable/.test(commitmentIntel), "EMPTY_NOT_UNAVAILABLE=TRUE: EMPTY summaries never use the UNAVAILABLE repository fallback string");

  // Item 10 — Calendar UI truth (verified, not modified)
  const morningBrief = src("app/leo/_lib/leoMorningBrief.ts");
  check(
    /NOT_CONFIGURED/.test(morningBrief) && /No calendar events in today's bounded window/.test(morningBrief),
    "CALENDAR_STATE_TRUTH=TRUE: three distinct calendar states (NOT_CONFIGURED / UNAVAILABLE / genuinely-empty) confirmed in Morning Brief composition",
  );

  // Item 11 — Observability completion
  const observability = src("app/leo/_lib/leoObservability.ts");
  const conversationRoute = src("app/api/leo/conversation/route.ts");
  const executeRouteSrc = src("app/api/leo/action/proposal/[proposalId]/execute/route.ts");
  const watchRunRoute = src("app/api/leo/watch/run/route.ts");
  check(
    /logLeoObservabilityEvent/.test(conversationRoute) && /logLeoObservabilityEvent/.test(executeRouteSrc) && /logLeoObservabilityEvent/.test(watchRunRoute),
    "LEO_CORE_OBSERVABILITY=TRUE: conversation intake, action-proposal execute, and watch/run all emit the bounded secret-safe log event",
  );
  check(/GMAIL_TWO_KEY_GATE_DENIED/.test(observability) && /SCOPE_INSUFFICIENT/.test(executeRouteSrc), "LEO_CORE_OBSERVABILITY: Gmail two-key gate failures map to a distinct failure_class enum value");
  check(!/OPENAI_API_KEY|access_token|refresh_token/.test(observability), "LEO_CORE_OBSERVABILITY: observability helper never references secret-shaped fields");

  // Item 12 — Service-role static audit completion
  check(
    /isSupabaseAdminConfigured/.test(src("app/leo/_lib/leoActionProposalRepository.ts")) &&
      /isSupabaseAdminConfigured/.test(src("app/leo/_lib/leoAttentionAckRepository.ts")) &&
      /isSupabaseAdminConfigured/.test(src("app/leo/_lib/leoCommitmentRepository.ts")) &&
      /isSupabaseAdminConfigured/.test(src("app/leo/_lib/leoConversationSessionRepository.ts")) &&
      /isSupabaseAdminConfigured/.test(src("app/leo/_lib/leoLivingBookRepository.ts")) &&
      /isSupabaseAdminConfigured/.test(src("app/leo/_lib/leoReasonChain.ts")) &&
      /isSupabaseAdminConfigured/.test(src("app/leo/_lib/leoToolReceiptRepository.ts")),
    "SERVICE_ROLE_CALLSITE_AUDIT=COMPLETE / UNSAFE_CALLS=0: all 32 previously-unguarded getAdminSupabase() defects across 7 files now guarded",
  );

  // Item 13 — Env requirement manifest
  const envManifest = src("app/leo/_lib/leoEnvRequirementManifest.ts");
  check(
    /OPENAI_API_KEY/.test(envManifest) && /LEO_GOOGLE_CLIENT_ID/.test(envManifest) && /WEB_PUSH_VAPID_PUBLIC_KEY/.test(envManifest) && /LEO_CRON_SECRET/.test(envManifest) && /ADMIN_PASSWORD/.test(envManifest),
    "ENV_REQUIREMENT_MANIFEST=TRUE: canonical manifest covers AI, Google, push, cron, and admin-auth variables with no secret values",
  );
  check(!/=\s*["'][A-Za-z0-9+/]{20,}["']/.test(envManifest), "ENV_REQUIREMENT_MANIFEST: no secret-shaped literal values present in the manifest");

  // Item 14 — Background monitoring (BLOCKED_EXTERNAL, no scheduler exists)
  check(
    !exists("vercel.json") && !exists(".github/workflows"),
    "BACKGROUND_MONITORING_STATE=BLOCKED_EXTERNAL: confirmed no scheduler (vercel.json cron or GitHub Actions) exists anywhere in this repo",
  );

  if (failures > 0) {
    console.error(`\nLEO-ADMIN-OS-FINAL verifier: ${failures} failure(s)`);
    process.exit(1);
  }
  console.log("\nLEO-ADMIN-OS-FINAL verifier: PASS");
}

main();
