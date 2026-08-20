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

const DASHBOARD_PATH = "app/admin/(dashboard)/recursos/page.tsx";
const INTAKE_PATH = "app/admin/(dashboard)/recursos/intake/page.tsx";
const CAMBIOS_PATH = "app/admin/(dashboard)/recursos/cambios/page.tsx";
const SOLICITUDES_PATH = "app/admin/(dashboard)/recursos/solicitudes/page.tsx";
const REVERIFICACION_PATH = "app/admin/(dashboard)/recursos/reverificacion/page.tsx";
const NUEVO_PATH = "app/admin/(dashboard)/recursos/nuevo/page.tsx";
const CANDIDATOS_PATH = "app/admin/(dashboard)/recursos/candidatos/page.tsx";
const CANDIDATE_REVIEW_FORM_PATH = "app/admin/_components/recursos/CandidateReviewForm.tsx";
const EVIDENCE_PATH = "app/lib/recursos/verificationEvidence.ts";
const PUBLIC_QUERIES_PATH = "app/lib/recursos/server/communityResourcesPublicQueries.ts";
const TOPUBLIC_TYPES_PATH = "app/lib/recursos/types.ts";
const JOBS_DB_PATH = "app/lib/recursos/intake/server/resourceIntakeJobsDb.ts";
const PROPOSALS_DB_PATH = "app/lib/recursos/intake/server/resourceChangeProposalsDb.ts";
const REQUESTS_DB_PATH = "app/lib/recursos/intake/server/partnerUpdateRequestsDb.ts";
const REVERIFICATION_QUEUE_PATH = "app/lib/recursos/intake/reverificationQueue.ts";

// --- four new routes exist ------------------------------------------------------------------
assert("intake route exists", exists(INTAKE_PATH));
assert("cambios route exists", exists(CAMBIOS_PATH));
assert("solicitudes route exists", exists(SOLICITUDES_PATH));
assert("reverificacion route exists", exists(REVERIFICACION_PATH));

// --- existing routes preserved ---------------------------------------------------------------
assert("existing manual-entry route (/admin/recursos/nuevo) preserved", exists(NUEVO_PATH));
assert("existing candidate queue route preserved", exists(CANDIDATOS_PATH));

// --- server-side permission gate on every new route -----------------------------------------
for (const [label, p] of [
  ["intake", INTAKE_PATH],
  ["cambios", CAMBIOS_PATH],
  ["solicitudes", SOLICITUDES_PATH],
  ["reverificacion", REVERIFICACION_PATH],
]) {
  if (exists(p)) {
    const src = read(p);
    assert(`${label} page calls requireLeonixAdminPermission("can_manage_recursos") server-side`, /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(src));
    assert(`${label} page does not gate only via client-side/UI hiding (no "use client" at top)`, !/^"use client"/.test(src.trim()));
  }
}

// --- Gate 1 private tables referenced only server/admin-side ---------------------------------
for (const p of [JOBS_DB_PATH, PROPOSALS_DB_PATH, REQUESTS_DB_PATH]) {
  assert(`${p} exists`, exists(p));
  if (exists(p)) {
    const src = read(p);
    assert(`${p} is server-only`, /import "server-only"/.test(src));
    assert(`${p} uses admin (service role) Supabase client only`, /getAdminSupabase/.test(src));
    assert(`${p} never imports an anon/browser Supabase client`, !/createSupabaseBrowserClient|anonClient/.test(src));
  }
}
assert("reverification queue helper exists (pure, no new DB table)", exists(REVERIFICATION_QUEUE_PATH));
if (exists(REVERIFICATION_QUEUE_PATH)) {
  const src = read(REVERIFICATION_QUEUE_PATH);
  assert("reverification queue reads nextVerificationAt (no new column)", /nextVerificationAt/.test(src));
  assert("reverification queue does not import a Supabase client (pure function only)", !/getAdminSupabase|createClient/.test(src));
}

// --- no public API introduced for the new Intake-OS tables ------------------------------------
assert("no new app/api/**/recursos-intake route created in Gate 2", (() => {
  if (!exists("app/api")) return true;
  const apiDir = path.join(root, "app", "api");
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let found = false;
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (walk(full)) found = true;
      } else if (/route\.ts$/.test(e.name)) {
        const src = fs.readFileSync(full, "utf8");
        if (/resource_intake_jobs|resource_change_proposals|partner_update_requests|source_documents|verification_events/.test(src)) {
          found = true;
        }
      }
    }
    return found;
  };
  return !walk(apiDir);
})());

// --- no public Recursos query modified --------------------------------------------------------
assert("communityResourcesPublicQueries.ts untouched by Gate 2", exists(PUBLIC_QUERIES_PATH));
if (exists(PUBLIC_QUERIES_PATH)) {
  const src = read(PUBLIC_QUERIES_PATH);
  assert(
    "public query functions still reference no Intake-OS table",
    !/source_documents|resource_intake_jobs|resource_change_proposals|partner_update_requests|verification_events/.test(src),
  );
}
assert("types.ts (toPublicResource) untouched by Gate 2", exists(TOPUBLIC_TYPES_PATH));
if (exists(TOPUBLIC_TYPES_PATH)) {
  const src = read(TOPUBLIC_TYPES_PATH);
  assert(
    "types.ts still references no Intake-OS table",
    !/source_documents|resource_intake_jobs|resource_change_proposals|partner_update_requests|verification_events/.test(src),
  );
}

// --- no fake PDF/URL processing ----------------------------------------------------------------
assert("intake page exists for PDF/URL honesty checks", exists(INTAKE_PATH));
if (exists(INTAKE_PATH)) {
  const src = read(INTAKE_PATH);
  assert("intake page does not import or call any PDF processing function", !/pdfExtraction|processDocument|DocumentProcessorServiceClient/.test(src));
  assert("intake page does not import or call any URL AI extraction function", !/urlExtraction|extractFromUrl|geminiExtract/.test(src));
  assert(
    "intake page marks PDF as pending (status=\"pending\" renders Próximamente) — URL went live in Gate 3",
    /title="PDF"[\s\S]*?status="pending"/.test(src) && /Próximamente/.test(src),
  );
  assert("intake page still links to the manual-entry route", /\/admin\/recursos\/nuevo/.test(src));
}

// --- researching disposition supported in candidate UI -----------------------------------------
assert("verificationEvidence.ts CandidateReviewDisposition includes researching", exists(EVIDENCE_PATH) && /"researching"/.test(read(EVIDENCE_PATH)));
assert("candidateReviewDispositionLabel handles researching", exists(EVIDENCE_PATH) && /case "researching":/.test(read(EVIDENCE_PATH)));
assert("CandidateReviewForm.tsx offers a researching option", exists(CANDIDATE_REVIEW_FORM_PATH) && /value="researching"/.test(read(CANDIDATE_REVIEW_FORM_PATH)));
assert(
  "existing dispositions (pending/ready_for_promotion/promoted/dropped) preserved in CandidateReviewForm.tsx",
  exists(CANDIDATE_REVIEW_FORM_PATH) &&
    ["pending", "ready_for_promotion", "dropped"].every((d) => new RegExp(`value="${d}"`).test(read(CANDIDATE_REVIEW_FORM_PATH))),
);

// --- reverification uses next_verification_at, no new DB state --------------------------------
assert("reverificacion page reads dbListCommunityResources (no new table)", exists(REVERIFICACION_PATH) && /dbListCommunityResources/.test(read(REVERIFICACION_PATH)));
assert(
  "reverificacion page does not introduce a new Supabase table for the queue itself",
  exists(REVERIFICACION_PATH) &&
    !/\.from\("(source_documents|resource_intake_jobs|resource_change_proposals|partner_update_requests|verification_events)"\)/.test(read(REVERIFICACION_PATH)),
);

// --- dashboard command center wiring ------------------------------------------------------------
assert("dashboard page exists", exists(DASHBOARD_PATH));
if (exists(DASHBOARD_PATH)) {
  const src = read(DASHBOARD_PATH);
  assert("dashboard imports buildReverificationQueue", /buildReverificationQueue/.test(src));
  assert("dashboard imports dbCountActiveResourceIntakeJobs", /dbCountActiveResourceIntakeJobs/.test(src));
  assert("dashboard imports dbCountPendingResourceChangeProposals", /dbCountPendingResourceChangeProposals/.test(src));
  assert("dashboard imports dbCountPendingPartnerUpdateRequests", /dbCountPendingPartnerUpdateRequests/.test(src));
  assert("dashboard links to /admin/recursos/intake", /\/admin\/recursos\/intake/.test(src));
  assert("dashboard links to /admin/recursos/cambios", /\/admin\/recursos\/cambios/.test(src));
  assert("dashboard links to /admin/recursos/solicitudes", /\/admin\/recursos\/solicitudes/.test(src));
  assert("dashboard links to /admin/recursos/reverificacion", /\/admin\/recursos\/reverificacion/.test(src));
  assert("dashboard does not fabricate a zero when a count is unavailable (uses .unavailable check)", /\.unavailable \? "no disponible"/.test(src));
}

// --- absolute do-not-touch guard ------------------------------------------------------------------
const FORBIDDEN_TOUCHED_PATHS = [
  "app/(site)/recursos-comunitarios/page.tsx",
  "app/(site)/recursos-comunitarios/RecursosComunitariosClient.tsx",
  "app/lib/recursos/resourceFilters.ts",
  "app/lib/recursos/categories.ts",
  "app/lib/recursos/urgency.ts",
  "app/components/Navbar.tsx",
  "app/components/Footer.tsx",
  "app/lib/publicNavConfig.ts",
  "app/sitemap.ts",
  "app/lib/recursos/urgentResourceValidation.ts",
];
for (const p of FORBIDDEN_TOUCHED_PATHS) {
  if (exists(p)) {
    const src = read(p);
    assert(`${p} was not touched by this Gate (no Intake-OS admin symbols present)`, !/resource_intake_jobs|resource_change_proposals|partner_update_requests|buildReverificationQueue/.test(src));
  }
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
