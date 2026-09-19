/**
 * Servicios Final Consolidated Lifecycle Execution — Gate 17 (subscription lifecycle/cron,
 * 2026-09-18).
 *
 * No vercel.json existed anywhere in the project. The subscription-sweep endpoint's own doc
 * comment confirmed it: "No cron exists in this build ... an external pinger/CI may call this
 * with the signed machine secret to get cron-like behavior." Confirmed by grep: every
 * cron-shaped endpoint in this codebase (this one, and app/api/leo/watch/run) used the same
 * custom-secret + external-pinger pattern, never Vercel's native Cron feature — so grace/
 * suspension enforcement for Servicios (and every other category sharing this sweep) had no
 * actual schedule driving it in production.
 *
 * Fix: added vercel.json with a single daily cron entry, and a new GET handler on the sweep route
 * authorized the standard Vercel way (Authorization: Bearer $CRON_SECRET, which Vercel
 * automatically attaches to every cron invocation — Vercel Cron only ever sends GET, never POST,
 * and carries no custom headers or body). The existing POST path (staff session OR
 * LEONIX_SUBSCRIPTION_SWEEP_KEY machine header) is completely unchanged for any existing external
 * pinger/CI. The underlying sweep call, its same-row transition table (renew -> grace ->
 * suspension -> restoration -> cancellation), and Stripe retry logic are untouched — this gate
 * only adds a new, additive entry point.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-exec-gate17-subscription-cron.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync, existsSync } from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}
const raw = (rel: string) =>
  stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n"));

const ROUTE = "app/api/revenue-os/admin/subscription-sweep/route.ts";
const VERCEL_JSON_URL = new URL("../vercel.json", import.meta.url);

check("vercel.json exists and schedules the subscription-sweep endpoint", () => {
  assert.ok(existsSync(VERCEL_JSON_URL), "vercel.json must exist at the project root");
  const parsed = JSON.parse(readFileSync(VERCEL_JSON_URL, "utf8")) as { crons?: { path?: string; schedule?: string }[] };
  assert.ok(Array.isArray(parsed.crons) && parsed.crons.length >= 1);
  const entry = parsed.crons!.find((c) => c.path === "/api/revenue-os/admin/subscription-sweep");
  assert.ok(entry, "the sweep endpoint must be scheduled");
  assert.ok(typeof entry!.schedule === "string" && entry!.schedule.trim().length > 0);
});

check("the route exposes a GET handler Vercel Cron can invoke (Cron only ever sends GET)", () => {
  const src = raw(ROUTE);
  assert.ok(src.includes("export async function GET(request: NextRequest) {"));
});

check("GET is authorized only via the standard Vercel CRON_SECRET bearer convention, never the staff-session path", () => {
  const src = raw(ROUTE);
  const idx = src.indexOf("function vercelCronAuthorized(request: NextRequest): boolean {");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes("process.env.CRON_SECRET"));
  assert.ok(block.includes('startsWith("Bearer ")'));
  assert.ok(block.includes("timingSafeEqual"), "must use constant-time comparison, matching the existing machine-key pattern");

  const getIdx = src.indexOf("export async function GET(request: NextRequest) {");
  const getBody = src.slice(getIdx, getIdx + 250);
  assert.ok(getBody.includes("vercelCronAuthorized(request)"));
  assert.ok(!getBody.includes("requireRevenueProtectedWriteAccess"), "GET must never accept a staff session — Cron cannot present one");
});

check("REGRESSION GUARD: the existing POST path (staff session OR machine-secret header) is completely unchanged", () => {
  const src = raw(ROUTE);
  const idx = src.indexOf("export async function POST(request: NextRequest) {");
  assert.ok(idx > 0);
  const block = src.slice(idx, idx + 500);
  assert.ok(block.includes("machineKeyAuthorized(request)"));
  assert.ok(block.includes("requireRevenueProtectedWriteAccess()"));
  assert.ok(src.includes("process.env.LEONIX_SUBSCRIPTION_SWEEP_KEY"), "the existing machine-secret env var must be untouched");
});

check("REGRESSION GUARD: both GET and POST call the SAME underlying sweep (same-row transitions, no duplicated/divergent logic)", () => {
  const src = raw(ROUTE);
  const runSweepDefs = (src.match(/async function runSweep\(/g) ?? []).length;
  assert.equal(runSweepDefs, 1, "there must be exactly one shared sweep call, not a second copy for GET");
  assert.ok(src.includes("sweepDueSubscriptionTransitions({ dryRun: opts.dryRun, limit: opts.limit })"));
});

check("REGRESSION GUARD: Stripe retry logic is not touched by this gate (no stripe.* calls added to this route)", () => {
  const src = raw(ROUTE);
  assert.ok(!/stripe\./i.test(src));
});

check("a scheduled (GET) run is always a real, non-dry sweep — Vercel Cron carries no body to request dryRun", () => {
  const src = raw(ROUTE);
  const getIdx = src.indexOf("export async function GET(request: NextRequest) {");
  const block = src.slice(getIdx, getIdx + 250);
  assert.ok(block.includes("runSweep({ dryRun: false })"));
});

if (failures.length) {
  console.error(`\nverify-servicios-exec-gate17-subscription-cron: ${failures.length} failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-servicios-exec-gate17-subscription-cron: PASS");
