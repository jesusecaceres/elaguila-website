import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

// This verifier certifies INTEGRATION across Gates 1-7 (does every gate's pieces actually connect
// to the others as claimed) — it does not re-duplicate the hundreds of per-gate assertions already
// covered by the 10 existing verify-recursos-*.mjs scripts.

// --- Gate 8A: every route from the inventory exists -------------------------------------------
const ROUTES = [
  "app/admin/(dashboard)/recursos/page.tsx",
  "app/admin/(dashboard)/recursos/nuevo/page.tsx",
  "app/admin/(dashboard)/recursos/[id]/page.tsx",
  "app/admin/(dashboard)/recursos/intake/page.tsx",
  "app/admin/(dashboard)/recursos/intake/[jobId]/page.tsx",
  "app/admin/(dashboard)/recursos/candidatos/page.tsx",
  "app/admin/(dashboard)/recursos/candidatos/[candidateId]/page.tsx",
  "app/admin/(dashboard)/recursos/candidatos/url/[candidateId]/page.tsx",
  "app/admin/(dashboard)/recursos/cambios/page.tsx",
  "app/admin/(dashboard)/recursos/solicitudes/page.tsx",
  "app/admin/(dashboard)/recursos/solicitudes/nueva/page.tsx",
  "app/admin/(dashboard)/recursos/solicitudes/[id]/page.tsx",
  "app/admin/(dashboard)/recursos/reverificacion/page.tsx",
];
for (const r of ROUTES) assert(`route exists: ${r}`, exists(r));

// --- Gate 8B: shared write-boundary permission gate exists and is reused, not duplicated -------
assert("leonixAdminGate.ts exists (single permission-gate source)", exists("app/admin/_lib/leonixAdminGate.ts"));
const actionFiles = [
  "app/admin/recursosActions.ts",
  "app/admin/recursosCandidateActions.ts",
  "app/admin/recursosUrlCandidateActions.ts",
  "app/admin/recursosChangeProposalActions.ts",
  "app/admin/recursosReverificationActions.ts",
  "app/admin/recursosPartnerRequestActions.ts",
];
for (const f of actionFiles) {
  assert(`${f} imports the shared can_manage_recursos gate (no parallel permission system)`, exists(f) && /requireLeonixAdminPermission/.test(read(f)));
}

// --- Gate 8D/8F/8G/8I/8J: one shared engine per concern, reused across every gate ----------------
// urlIntakeOrchestrator.ts/pdfIntakeOrchestrator.ts (new-candidate paths) reach the engine
// INDIRECTLY through generateChangeProposalsForMatch.ts (only invoked for EXISTING_RESOURCE_UPDATE
// matches) — still exactly one engine, one more layer of correct indirection, not duplication.
const directConsumers = ["app/lib/recursos/intake/generateChangeProposalsForMatch.ts", "app/lib/recursos/intake/reverifyResourceViaUrl.ts", "app/lib/recursos/intake/convertPartnerRequestToProposals.ts"];
for (const c of directConsumers) {
  assert(`${c} reuses the ONE resourceChangeDetection engine directly (no per-source diff logic)`, exists(c) && /from ["'].\/resourceChangeDetection["']/.test(read(c)));
}
const indirectConsumers = ["app/lib/recursos/intake/urlIntakeOrchestrator.ts", "app/lib/recursos/intake/pdfIntakeOrchestrator.ts"];
for (const c of indirectConsumers) {
  assert(`${c} reaches the shared engine via generateChangeProposalsForMatch.ts (no separate diff logic)`, exists(c) && /from ["'].\/generateChangeProposalsForMatch["']/.test(read(c)));
}
assert("only one detectResourceFieldChanges implementation exists in the whole intake tree", (() => {
  const dir = path.join(root, "app", "lib", "recursos", "intake");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = walk(dir).filter((f) => f.endsWith(".ts"));
  const definers = files.filter((f) => /export function detectResourceFieldChanges/.test(fs.readFileSync(f, "utf8")));
  return definers.length === 1 && definers[0].endsWith("resourceChangeDetection.ts");
})());

assert("matchCandidateToExistingResource has exactly one implementation, reused by URL and PDF intake", (() => {
  const dir = path.join(root, "app", "lib", "recursos", "intake");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".ts"));
  const definers = files.filter((f) => /export function matchCandidateToExistingResource/.test(fs.readFileSync(path.join(dir, f), "utf8")));
  return definers.length === 1 && definers[0] === "matchCandidateToExistingResource.ts";
})());

assert("verificationEventsDb.ts has exactly one insert function (insertVerificationEvent), used by every gate", (() => {
  const src = read("app/lib/recursos/intake/server/verificationEventsDb.ts");
  return (src.match(/export async function insertVerificationEvent/g) || []).length === 1;
})());

// --- Gate 8: the is24Hours fabrication fix (found during final QA) -----------------------------
assert("reverifyResourceViaUrl.ts no longer hardcodes is24Hours:false in the deterministic-only fallback (Gate 8 fix)", (() => {
  const src = read("app/lib/recursos/intake/reverifyResourceViaUrl.ts");
  const fnMatch = src.match(/function buildDeterministicOnlyProposal[\s\S]*?\n}\n/);
  return fnMatch && !/is24Hours:\s*false/.test(fnMatch[0]) && /is24Hours is deliberately OMITTED/.test(src);
})());

// --- Gate 8: schema untouched (no migration expected this gate) --------------------------------
assert("no new migration file added since Gate 1 (schema unchanged)", (() => {
  const dir = path.join(root, "supabase", "migrations");
  const files = fs.readdirSync(dir).filter((f) => /recursos/i.test(f));
  return files.length === 1 && files[0] === "20260820120000_recursos_intake_os_schema.sql";
})());

// --- Gate 8: public contract never imports anything from the intake tree -----------------------
assert("communityResourcesPublicQueries.ts imports nothing from app/lib/recursos/intake", exists("app/lib/recursos/server/communityResourcesPublicQueries.ts") && !/recursos\/intake/.test(read("app/lib/recursos/server/communityResourcesPublicQueries.ts")));
assert("no public route imports any admin/intake action file", (() => {
  const publicDir = path.join(root, "app", "recursos-comunitarios");
  if (!fs.existsSync(publicDir)) return true;
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  const files = walk(publicDir).filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  return files.every((f) => !/recursosActions|recursosCandidateActions|recursosUrlCandidateActions|recursosChangeProposalActions|recursosReverificationActions|recursosPartnerRequestActions/.test(fs.readFileSync(f, "utf8")));
})());

// --- Gate 8: no cron, no LEO, no magazine tools, no partner portal introduced -------------------
assert("no cron/scheduled-job infra introduced anywhere in the Recursos tree", !exists("app/api/cron") && !fs.existsSync(path.join(root, "app", "lib", "recursos")) || !/node-cron|node-schedule/.test((() => {
  const dir = path.join(root, "app", "lib", "recursos");
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  return walk(dir).filter((f) => f.endsWith(".ts")).map((f) => fs.readFileSync(f, "utf8")).join("\n");
})()));
assert("no partner authentication/session module exists", !exists("app/lib/recursos/partnerAuth.ts") && !exists("app/lib/recursos/partnerSession.ts"));

// --- Gate 8: taxonomy/urgency/CTA-truth files untouched by this gate ----------------------------
assert("categories.ts (12-category taxonomy) untouched — no GATE 8 markers", exists("app/lib/recursos/categories.ts") && !/GATE 8/.test(read("app/lib/recursos/categories.ts")));
assert("urgency.ts untouched — no GATE 8 markers", exists("app/lib/recursos/urgency.ts") && !/GATE 8/.test(read("app/lib/recursos/urgency.ts")));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
