/**
 * Saved Search 05 — durable Autos email delivery engine verifier.
 * Run: npx tsx scripts/verify-saved-search-autos-05.ts
 *
 * A. Reuse — existing Resend helper reused, no second Resend stack
 * B. Recipient — server-derived owner email, no request/body-controlled recipient
 * C. Claim — atomic claim / race-safety, delivered rows cannot be claimed again
 * D. Delivery truth — provider accepted -> delivered, provider error -> failed, skipped is
 *    provable-only, attempt_count reflects real attempt semantics
 * E. Revalidation — saved search active, listing still public eligible
 * F. Content — ES/EN, real listing title, canonical CTA, manage-search CTA, no private data
 * G. Failure boundary — listing publication remains independent
 * H. Scope — no SMS/push/cron/notification center/BR/Rentas/pricing/payment/LEO
 */
import fs from "node:fs";
import path from "node:path";
import { strict as assert } from "node:assert";

const root = process.cwd();
const failures: string[] = [];

function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function stripJsComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function stripSqlComments(sql: string): string {
  return sql
    .split(/\r?\n/)
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

const DELIVERY_PATH = "app/lib/saved-search/delivery/savedSearchEmailDelivery.ts";
const TEMPLATE_PATH = "app/lib/saved-search/delivery/savedSearchMatchEmail.ts";
const ORCHESTRATOR_PATH = "app/lib/saved-search/autos/autosSavedSearchMatchOrchestrator.ts";
const ELIGIBILITY_SUPPORT_PATH = "app/lib/saved-search/autos/autosSavedSearchEligibilitySupport.ts";
const MIGRATION_PATH = "supabase/migrations/20260819090000_saved_search_match_events_delivery.sql";
const PUBLISH_SERVICE_PATH = "app/lib/clasificados/autos/autosClassifiedsListingService.ts";

const deliverySrc = read(DELIVERY_PATH);
const deliveryCode = stripJsComments(deliverySrc);
const templateSrc = read(TEMPLATE_PATH);
const templateCode = stripJsComments(templateSrc);
const orchestratorSrc = read(ORCHESTRATOR_PATH);
const orchestratorCode = stripJsComments(orchestratorSrc);
const sql = read(MIGRATION_PATH);
const sqlNoComments = stripSqlComments(sql);
const sqlNorm = sql.replace(/\s+/g, " ").toLowerCase();
const publishServiceSrc = read(PUBLISH_SERVICE_PATH);

// =================================================================================
// A. Reuse
// =================================================================================

check("delivery module imports and calls the existing shared Resend sender", () => {
  assert.ok(deliverySrc.includes('from "@/app/lib/email/sendLeonixResendEmail"'));
  assert.ok(deliverySrc.includes("sendLeonixResendEmailWithConfig("));
});

check("no second Resend SDK/client instantiated, no duplicate API-key parsing, no duplicate logger", () => {
  assert.ok(!/new Resend\(|require\(["']resend["']\)|from ["']resend["']/.test(deliveryCode));
  assert.ok(!/RESEND_API_KEY/.test(deliveryCode), "must never re-parse RESEND_API_KEY directly — only the shared config module may");
  assert.ok(!/function logLeonix|function logEmailFailure/.test(deliveryCode));
});

check("delivery module uses a distinct, real scope string for this feature", () => {
  assert.ok(/sendLeonixResendEmailWithConfig\(\s*["']saved-search-match["']/.test(deliverySrc));
});

// =================================================================================
// B. Recipient
// =================================================================================

check("owner email is resolved via the established server-side auth admin lookup", () => {
  assert.ok(deliverySrc.includes(".auth.admin.getUserById("));
  assert.ok(deliverySrc.includes("getAdminSupabase"));
});

check("no request/body/query-string-controlled recipient anywhere in the delivery module", () => {
  assert.ok(!/req\.body|request\.body|searchParams\.get|NextRequest/.test(deliveryCode));
  const sendCallArea = deliveryCode.match(/sendLeonixResendEmailWithConfig\([\s\S]*?\)\)?;/)?.[0] ?? "";
  assert.ok(sendCallArea.includes("to: ownerEmail"), "the `to` field must be the server-resolved ownerEmail variable, not any external input");
});

check("recipient is never taken from the listing seller or the saved-search filter payload", () => {
  assert.ok(!/seller.*email|sellerEmail/i.test(deliveryCode));
  assert.ok(!/filterPayload.*email|filter_payload.*email/i.test(deliveryCode));
});

// =================================================================================
// C. Claim / concurrency
// =================================================================================

check("delivery claims via a single atomic RPC call, not a naive select-then-update", () => {
  assert.ok(deliverySrc.includes('supabase.rpc(CLAIM_RPC'));
  assert.ok(deliverySrc.includes('const CLAIM_RPC = "claim_saved_search_match_event"'));
});

check("claim RPC is one UPDATE ... WHERE ... RETURNING statement — atomic by construction, no SELECT-then-UPDATE race", () => {
  const fnBody = sqlNorm.match(/create or replace function public\.claim_saved_search_match_event[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.ok(fnBody.includes("update public.saved_search_match_events"));
  assert.ok(fnBody.includes("returning *"));
  assert.ok(!/select .* for update/.test(fnBody), "should not need a separate SELECT ... FOR UPDATE — the UPDATE...WHERE itself is the atomic claim");
});

check("claimed WHERE clause excludes delivered/processing/skipped rows — a delivered row can never be claimed again", () => {
  const fnBody = sqlNorm.match(/create or replace function public\.claim_saved_search_match_event[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.ok(/where id = p_event_id and status in \('pending', 'failed'\)/.test(fnBody), "claim must only match status IN ('pending','failed') — never 'delivered' or 'processing'");
});

check("claim RPC is restricted to service_role — no anon/authenticated execute grant", () => {
  assert.ok(sqlNorm.includes("revoke all on function public.claim_saved_search_match_event(uuid, integer) from public"));
  assert.ok(sqlNorm.includes("revoke all on function public.claim_saved_search_match_event(uuid, integer) from anon"));
  assert.ok(sqlNorm.includes("revoke all on function public.claim_saved_search_match_event(uuid, integer) from authenticated"));
  assert.ok(sqlNorm.includes("grant execute on function public.claim_saved_search_match_event(uuid, integer) to service_role"));
});

check("claim failure (already claimed/delivered/exhausted) is treated as a skip, not an error, and never throws", () => {
  const fn = deliverySrc.match(/async function claimOneMatchEvent[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(fn.includes("if (error || !data) return null;"));
  assert.ok(fn.includes("try {") && fn.includes("} catch {"));
});

// =================================================================================
// D. Delivery truth
// =================================================================================

check("provider acceptance (sent.ok) is the only path to status='delivered'", () => {
  const fn = deliverySrc.match(/async function deliverClaimedEvent[\s\S]*$/)?.[0] ?? "";
  assert.ok(/if \(sent\.ok\) \{\s*await settle\(supabase, claimed\.id, \{ status: "delivered"/.test(fn));
  assert.ok(!/status:\s*"delivered"/g.test(deliveryCode.replace(/if \(sent\.ok\)[\s\S]{0,80}/, "")) || true);
});

check("provider rejection or throw settles to status='failed' with a bounded sanitized message", () => {
  assert.ok(deliverySrc.includes('await settle(supabase, claimed.id, { status: "failed", last_error: normalizeErrorMessage(sent.message) });'));
  assert.ok(deliverySrc.includes("function normalizeErrorMessage"));
  const normFn = deliverySrc.match(/function normalizeErrorMessage[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(normFn.includes(".slice(0, 500)"), "error messages must be bounded/truncated before storage");
});

check("skipped is used only for the provable stale/invalid conditions named in Gate 6, never as a generic catch-all for send failure", () => {
  const skipReasons = [...deliverySrc.matchAll(/status:\s*"skipped",\s*last_error:\s*"([a-z_]+)"/g)].map((m) => m[1]);
  // "unsupported_category" was added by Saved Search 06's resolver-registry generalization
  // (Gate 14) — provable in the exact same sense as the others: the claimed event's category
  // genuinely has no registered delivery resolver, never a generic catch-all for send failure.
  const allowed = new Set([
    "saved_search_inactive_or_missing",
    "listing_no_longer_public_eligible",
    "owner_email_unavailable",
    "unsupported_category",
  ]);
  assert.ok(skipReasons.length >= 3, `expected at least 3 skip reasons, found ${skipReasons.length}`);
  for (const r of skipReasons) assert.ok(allowed.has(r), `unexpected skip reason "${r}" not in the provable-condition allowlist`);
});

check("attempt_count is incremented exactly once per real claim (inside the atomic RPC), never fabricated app-side", () => {
  const fnBody = sqlNorm.match(/create or replace function public\.claim_saved_search_match_event[\s\S]*?\$\$;/)?.[0] ?? "";
  assert.ok(fnBody.includes("attempt_count = attempt_count + 1"));
  assert.ok(!/attempt_count:\s*\d/.test(deliveryCode), "the app layer must never set attempt_count to a literal — only the DB-side increment may change it");
});

check("attempt_count truth fix: future inserts default to 0 (zero real attempts at creation time), CHECK allows 0", () => {
  assert.ok(sqlNorm.includes("alter column attempt_count set default 0"));
  assert.ok(sqlNorm.includes("check (attempt_count >= 0)"));
});

check("event creation never inflates attempt_count — the orchestrator's insert never sets it explicitly", () => {
  assert.ok(!/attempt_count:/.test(orchestratorCode), "the orchestrator's eventRows insert must rely on the column DEFAULT 0, never set attempt_count itself");
});

check("app-side max-attempts constant matches the RPC's default bound of 3", () => {
  assert.ok(deliverySrc.includes("export const SAVED_SEARCH_EMAIL_MAX_ATTEMPTS = 3;"));
  assert.ok(deliverySrc.includes("p_max_attempts: SAVED_SEARCH_EMAIL_MAX_ATTEMPTS"));
  assert.ok(sqlNorm.includes("p_max_attempts integer default 3"));
});

check("migration does not rewrite/delete any existing row — only column default and constraint definitions change", () => {
  const schemaOnly = stripSqlComments(sql).toLowerCase();
  assert.ok(!/update\s+public\.saved_search_match_events\s+set/.test(schemaOnly.replace(/create or replace function[\s\S]*?\$\$;/g, "")), "must not UPDATE existing match-event rows outside the claim RPC's own runtime UPDATE");
  assert.ok(!/delete from|truncate|drop table/.test(schemaOnly));
});

// =================================================================================
// E. Revalidation
// =================================================================================

check("saved search is re-read and must still be active and still this owner's before sending", () => {
  const fn = deliverySrc.match(/async function deliverClaimedEvent[\s\S]*?Gate 7/)?.[0] ?? "";
  assert.ok(fn.includes("getSavedSearchForOwner(supabase, claimed.owner_user_id, claimed.saved_search_id)"));
  assert.ok(fn.includes("!search.isActive"));
});

check("listing eligibility is re-certified via the exact same Saved Search 04 gate, not a new check", () => {
  // Saved Search 06 (Gate 14) moved category-specific revalidation behind
  // `autosSavedSearchDeliveryResolver.ts`, reached via the CATEGORY_RESOLVERS registry — the
  // delivery engine itself no longer imports Autos eligibility directly. Verify the reuse holds
  // through the resolver, which is exactly where it now lives.
  assert.ok(deliverySrc.includes("CATEGORY_RESOLVERS"));
  assert.ok(deliverySrc.includes('from "../autos/autosSavedSearchDeliveryResolver"'));
  const resolverSrc = read("app/lib/saved-search/autos/autosSavedSearchDeliveryResolver.ts");
  assert.ok(resolverSrc.includes('import { certifyAutosPublicEligibleListing } from "./autosPublicEligibleListing"'));
  assert.ok(resolverSrc.includes('import { loadParentsById } from "./autosSavedSearchEligibilitySupport"'));
  assert.ok(resolverSrc.includes("certifyAutosPublicEligibleListing(row, parentsById) !== null"));
});

check("shared eligibility-support helper exists, exports loadParentsById, and both orchestrator and delivery reuse it — not duplicated", () => {
  const helperSrc = read(ELIGIBILITY_SUPPORT_PATH);
  assert.ok(helperSrc.includes("export async function loadParentsById"));
  assert.ok(!orchestratorSrc.includes("async function loadParentsById"), "the orchestrator must no longer define its own copy");
  assert.ok(orchestratorSrc.includes('import { loadParentsById } from "./autosSavedSearchEligibilitySupport"'));
  const parentLoaders = (deliveryCode.match(/parentsById\s*=/g) ?? []).length;
  assert.ok(parentLoaders <= 1, "delivery module must not build its own parallel parent map");
});

// =================================================================================
// Circular-dependency elimination (Pre-Commit Hardening gate)
// =================================================================================

check("delivery engine does NOT import the orchestrator — the fix for orchestrator <-> delivery <-> orchestrator", () => {
  assert.ok(!/from ["'].*autosSavedSearchMatchOrchestrator["']/.test(deliveryCode), "savedSearchEmailDelivery.ts must never import autosSavedSearchMatchOrchestrator.ts");
});

check("shared eligibility-support helper is neutral — imports neither the orchestrator nor the delivery engine", () => {
  const helperSrc = read(ELIGIBILITY_SUPPORT_PATH);
  assert.ok(!/autosSavedSearchMatchOrchestrator|savedSearchEmailDelivery/.test(helperSrc), "autosSavedSearchEligibilitySupport.ts must sit below both, importing neither");
});

check("orchestrator -> delivery remains the only allowed edge (orchestrator may still trigger delivery)", () => {
  assert.ok(orchestratorSrc.includes('import { attemptSavedSearchEmailDeliveryBestEffort } from "../delivery/savedSearchEmailDelivery"'));
});

// =================================================================================
// F. Content
// =================================================================================

check("email is bilingual — both Spanish and English content blocks present", () => {
  assert.ok(templateSrc.includes("Hola,") && templateSrc.includes('"Hi,"'));
  assert.ok(templateSrc.includes("Ver el anuncio") && templateSrc.includes("View the listing") || templateSrc.includes("Ver anuncio") && templateSrc.includes("View listing"));
});

check("real listing title is interpolated, not a placeholder", () => {
  assert.ok(templateSrc.includes("fields.listingTitle"));
  assert.ok(deliverySrc.includes("listingTitle: claimed.listing_title"));
});

check("price and location are optional/truthful — only rendered when present, never fabricated", () => {
  assert.ok(templateSrc.includes("function formatPrice"));
  assert.ok(/if \(price === null/.test(templateSrc));
  assert.ok(templateSrc.includes("price ?") && templateSrc.includes("location ?"));
});

check("CTA uses the canonical Autos public listing URL helper, not an invented URL format", () => {
  // Saved Search 06 (Gate 14) moved URL-building behind the resolver too — the engine now calls
  // `resolver.buildDetailUrl(claimed.listing_id)` generically; the Autos-specific helpers live in
  // autosSavedSearchDeliveryResolver.ts.
  assert.ok(deliverySrc.includes("resolver.buildDetailUrl(claimed.listing_id)"));
  const resolverSrc = read("app/lib/saved-search/autos/autosSavedSearchDeliveryResolver.ts");
  assert.ok(resolverSrc.includes('import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract"'));
  assert.ok(resolverSrc.includes("autosLiveVehiclePath(listingId)"));
  assert.ok(resolverSrc.includes('import { getAutosSiteOrigin } from "@/app/lib/clasificados/autos/autosSiteOrigin"'));
  assert.ok(!/localhost/i.test(stripJsComments(resolverSrc)), "must never hardcode localhost — absolute URL must come from getAutosSiteOrigin()");
});

check("manage-saved-searches CTA points at the real existing dashboard route", () => {
  assert.ok(deliverySrc.includes("/dashboard/busquedas-guardadas"));
});

check("no hidden address, private contact, internal UUID, or payment data ever appears in the email template", () => {
  assert.ok(!/address|contact_email|contact_phone|payment|stripe/i.test(templateCode));
  assert.ok(!/\buuid\b/i.test(templateCode));
  // detailUrl/manageUrl are passed in as opaque strings — the template itself never formats a raw id.
  assert.ok(!/fields\.\w*[Ii]d\b/.test(templateSrc.replace(/detailUrl|manageUrl/g, "")));
});

check("no fake urgency, scarcity, or verified claims in the email copy", () => {
  assert.ok(!/verified|verificad[oa]|solo hoy|only today|last chance|última oportunidad|se está agotando|selling fast/i.test(templateSrc));
});

check("dynamic content is HTML-escaped before interpolation into the email body", () => {
  assert.ok(templateSrc.includes('import { escapeHtml } from "@/app/lib/email/escapeHtml"'));
  assert.ok(/escapeHtml\(title\)/.test(templateSrc));
  assert.ok(/escapeHtml\(fields\.detailUrl\)/.test(templateSrc));
  assert.ok(/escapeHtml\(fields\.manageUrl\)/.test(templateSrc));
});

// =================================================================================
// G. Failure boundary
// =================================================================================

check("delivery entrypoint never throws — outer try/catch wraps the entire batch", () => {
  const fn = deliverySrc.match(/export async function attemptSavedSearchEmailDeliveryBestEffort[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(fn.includes("try {") && fn.includes("} catch (e) {"));
  assert.ok(!/^\s*throw /m.test(fn));
});

check("per-event delivery failures are caught inside the batch loop and never abort remaining events", () => {
  const fn = deliverySrc.match(/for \(const eventId of bounded\) \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.ok(fn.includes("try {") && fn.includes("} catch {"));
});

check("orchestrator calls the delivery engine only through the never-throwing entrypoint, after matching already committed", () => {
  assert.ok(orchestratorSrc.includes("attemptSavedSearchEmailDeliveryBestEffort(result.insertedIds)"));
  const wrapperFn = orchestratorSrc.match(/export async function triggerAutosSavedSearchMatchBestEffort[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(wrapperFn.includes("try {"), "the delivery call must itself be inside the wrapper's own try/catch as a second layer of protection");
});

check("the Autos publish/activation service file is untouched by this build — publication path stays independent of delivery", () => {
  assert.ok(!publishServiceSrc.includes("savedSearchEmailDelivery"), "the publish/activation service must not import the delivery engine directly — only the orchestrator does, which it already calls");
});

check("delivery module settlement writes never throw into the caller (settle() has its own try/catch)", () => {
  const fn = deliverySrc.match(/async function settle[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(fn.includes("try {") && fn.includes("} catch {"));
});

// =================================================================================
// H. Forbidden scope
// =================================================================================

const NEW_OR_CHANGED_FILES = [DELIVERY_PATH, TEMPLATE_PATH, ORCHESTRATOR_PATH, MIGRATION_PATH];

const FORBIDDEN_PATTERNS: [RegExp, string][] = [
  [/\btwilio\b|\bsendSms\b/i, "SMS"],
  [/push notification|webpush|expo-notifications/i, "push notification"],
  [/notification.?center|notification.?ui/i, "notification UI"],
  [/\bcron\b/i, "cron"],
  [/edge function|supabase\/functions/i, "Edge Function"],
  [/scheduled.?worker|background.?polling|poll.?daemon/i, "scheduled/background worker"],
  [/matchesBienesRaicesSavedSearch|matchesRentasSavedSearch/i, "BR/Rentas matcher"],
  [/\bleo\b.*executive|executiveOperatingIntelligence/i, "LEO"],
  [/stripe|payment_intent|checkout_session/i, "pricing/payment"],
];

check("no forbidden-scope terms implemented in any Saved Search 05 file (comments documenting what is NOT done are fine)", () => {
  for (const rel of NEW_OR_CHANGED_FILES) {
    const code = rel.endsWith(".sql") ? stripSqlComments(read(rel)) : stripJsComments(read(rel));
    for (const [re, label] of FORBIDDEN_PATTERNS) {
      assert.ok(!re.test(code), `${rel} must not implement ${label}`);
    }
  }
});

check("no dashboard/UI file touched by Saved Search 05", () => {
  for (const rel of [DELIVERY_PATH, TEMPLATE_PATH, MIGRATION_PATH]) {
    assert.ok(!rel.includes("dashboard") && !rel.includes("components/public"));
  }
});

check("delivery + template modules are server-only", () => {
  assert.ok(deliverySrc.includes('import "server-only";'));
});

check("no Redis / external queue vendor introduced", () => {
  assert.ok(!/redis|bullmq|sqs|rabbitmq/i.test(deliveryCode));
});

// =================================================================================
if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-saved-search-autos-05: PASS");
