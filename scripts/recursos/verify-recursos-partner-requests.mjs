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

const FIELD_MAP = "app/lib/recursos/intake/partnerRequestFieldMap.ts";
const CONVERT = "app/lib/recursos/intake/convertPartnerRequestToProposals.ts";
const REQUESTS_DB = "app/lib/recursos/intake/server/partnerUpdateRequestsDb.ts";
const CHANGE_DETECTION = "app/lib/recursos/intake/resourceChangeDetection.ts";
const ACTIONS = "app/admin/recursosPartnerRequestActions.ts";
const FORM = "app/admin/_components/recursos/PartnerRequestForm.tsx";
const LIST_PAGE = "app/admin/(dashboard)/recursos/solicitudes/page.tsx";
const NEW_PAGE = "app/admin/(dashboard)/recursos/solicitudes/nueva/page.tsx";
const DETAIL_PAGE = "app/admin/(dashboard)/recursos/solicitudes/[id]/page.tsx";
const REVERIFICACION_PAGE = "app/admin/(dashboard)/recursos/reverificacion/page.tsx";
const RESOURCE_DETAIL_PAGE = "app/admin/(dashboard)/recursos/[id]/page.tsx";
const MIGRATION = "supabase/migrations/20260820120000_recursos_intake_os_schema.sql";
const PUBLIC_QUERIES = "app/lib/recursos/server/communityResourcesPublicQueries.ts";

// --- solicitudes form exists ---------------------------------------------------------------
assert("PartnerRequestForm.tsx exists", exists(FORM));
assert("solicitudes/nueva page exists and hosts the form", exists(NEW_PAGE) && /PartnerRequestForm/.test(read(NEW_PAGE)));
assert("solicitudes list page links to Nueva solicitud", exists(LIST_PAGE) && /solicitudes\/nueva/.test(read(LIST_PAGE)));
assert("solicitudes detail page exists", exists(DETAIL_PAGE));

// --- admin permission required everywhere ---------------------------------------------------
for (const p of [ACTIONS, NEW_PAGE, DETAIL_PAGE]) {
  assert(`${p}: requires can_manage_recursos`, exists(p) && (read(p).match(/requireLeonixAdminPermission\("can_manage_recursos"\)/g) || []).length >= 1);
}
if (exists(ACTIONS)) {
  const src = read(ACTIONS);
  const exportCount = (src.match(/^export async function \w+Action/gm) || []).length;
  const gateCount = (src.match(/requireLeonixAdminPermission\("can_manage_recursos"\)/g) || []).length;
  assert("every exported action in recursosPartnerRequestActions.ts is permission-gated", exportCount > 0 && gateCount >= exportCount, { exportCount, gateCount });
}

// --- request type allow-list exists ----------------------------------------------------------
assert("partnerRequestFieldMap.ts exists", exists(FIELD_MAP));
if (exists(FIELD_MAP)) {
  const src = read(FIELD_MAP);
  assert("PARTNER_REQUEST_TYPES allow-list exists", /PARTNER_REQUEST_TYPES/.test(src));
  assert("isValidPartnerRequestType guard exists", /export function isValidPartnerRequestType/.test(src));
  for (const t of ["phone_change", "website_change", "email_change", "address_change", "hours_change", "program_update", "eligibility_update", "service_area_update", "other"]) {
    assert(`request type includes ${t}`, src.includes(`"${t}"`));
  }
  assert("strict field map (REQUEST_TYPE_FIELDS) exists", /export const REQUEST_TYPE_FIELDS/.test(src));
  assert("field map self-checks every field against WRITABLE_FIELD_COLUMNS at import time", /WRITABLE_FIELD_COLUMNS/.test(src) && /throw new Error/.test(src));
  assert('"other" request type reports zero fields', /other:\s*\[\]/.test(src));
}

// --- partner_update_requests used, write path exists ------------------------------------------
assert("partnerUpdateRequestsDb.ts exists", exists(REQUESTS_DB));
if (exists(REQUESTS_DB)) {
  const src = read(REQUESTS_DB);
  assert("dbCreatePartnerUpdateRequest exists (status=pending)", /export async function dbCreatePartnerUpdateRequest/.test(src) && /status:\s*"pending"/.test(src));
  assert("dbGetPartnerUpdateRequest exists", /export async function dbGetPartnerUpdateRequest/.test(src));
  assert("dbUpdatePartnerUpdateRequestStatus exists and re-checks fromStatuses server-side", /export async function dbUpdatePartnerUpdateRequestStatus/.test(src) && /fromStatuses/.test(src) && /\.in\("status", fromStatuses\)/.test(src));
  assert("status check constraint values preserved (pending/reviewing/resolved/rejected)", /"reviewing" \| "resolved" \| "rejected"/.test(src));
}

// --- no direct resource write on creation ------------------------------------------------------
if (exists(ACTIONS)) {
  const src = read(ACTIONS);
  const createFnMatch = src.match(/export async function createPartnerUpdateRequestAction[\s\S]*?\n}\n/);
  const createFnSrc = createFnMatch ? createFnMatch[0] : "";
  assert("createPartnerUpdateRequestAction never writes community_resources directly", createFnSrc.length > 0 && !/dbUpdateCommunityResource|dbUpdateSingleResourceField|from\("community_resources"\)/.test(createFnSrc));
  assert("createPartnerUpdateRequestAction only reads formData under allow-listed field_ keys", /field_\$\{field\}/.test(src) && /REQUEST_TYPE_FIELDS\[requestType/.test(src));
}

// --- proposal_source=partner_request, Gate 5 engine reused, no second diff engine --------------
assert("convertPartnerRequestToProposals.ts exists", exists(CONVERT));
if (exists(CONVERT)) {
  const src = read(CONVERT);
  assert('proposalSource is "partner_request"', /proposalSource:\s*"partner_request"/.test(src));
  assert("reuses detectResourceFieldChanges (Gate 5 engine, no second diff engine)", /from "\.\/resourceChangeDetection"/.test(src) && /detectResourceFieldChanges\(/.test(src));
  assert("reuses dbCreateResourceChangeProposalIfNotPending (idempotent create, no second insert path)", /dbCreateResourceChangeProposalIfNotPending\(/.test(src));
  assert("does not define a second/local field-comparison function", !/function detectResourceFieldChanges|function compareFields|function diffFields/.test(src));
}
assert('proposal_source check constraint includes partner_request (Gate 1, unchanged)', exists(MIGRATION) && /'partner_request'/.test(read(MIGRATION)));

// --- safety fields remain individually reviewed (never offered for bulk-safe accept) -----------
if (exists(FIELD_MAP) && exists(CHANGE_DETECTION)) {
  const fieldMapSrc = read(FIELD_MAP);
  const changeDetectionSrc = read(CHANGE_DETECTION);
  const addressFieldsOffered = /address_change:\s*\["addressLine1", "addressCity", "addressState", "addressZip"\]/.test(fieldMapSrc);
  const addressFieldsAreSafetySensitive = /SAFETY_SENSITIVE_FIELDS[\s\S]{0,300}"addressLine1"[\s\S]{0,300}"addressCity"[\s\S]{0,300}"addressState"[\s\S]{0,300}"addressZip"/.test(changeDetectionSrc);
  assert("address_change request type maps only to fields already marked safety-sensitive (excluded from bulk-safe accept)", addressFieldsOffered && addressFieldsAreSafetySensitive);
  const requestTypeFieldsBlock = fieldMapSrc.match(/export const REQUEST_TYPE_FIELDS[\s\S]*?\n};/)?.[0] ?? "";
  assert("partner request field map never offers crisisPhone/sms/is24Hours/category/urgency as reportable fields", requestTypeFieldsBlock.length > 0 && !/crisisPhone|"sms"|is24Hours|primaryCategory|urgencyLevel/.test(requestTypeFieldsBlock));
}

// --- request statuses preserved, resolve != accept proposal -------------------------------------
if (exists(ACTIONS)) {
  const src = read(ACTIONS);
  const resolveFnMatch = src.match(/export async function resolvePartnerRequestAction[\s\S]*?\n}\n/);
  const resolveFnSrc = resolveFnMatch ? resolveFnMatch[0] : "";
  assert("resolvePartnerRequestAction exists and never calls a change-proposal accept function", resolveFnSrc.length > 0 && !/acceptChangeProposalAction|dbUpdateResourceChangeProposalStatus\(.*"accepted"/.test(resolveFnSrc));
  const rejectFnMatch = src.match(/export async function rejectPartnerRequestAction[\s\S]*?\n}\n/);
  const rejectFnSrc = rejectFnMatch ? rejectFnMatch[0] : "";
  assert("rejectPartnerRequestAction never touches community_resources or change proposals", rejectFnSrc.length > 0 && !/dbUpdateCommunityResource|dbUpdateSingleResourceField|ResourceChangeProposalStatus/.test(rejectFnSrc));
  assert("markPartnerRequestReviewingAction exists and only transitions from pending", /markPartnerRequestReviewingAction/.test(src) && /"reviewing", actor, \["pending"\]/.test(src));
  assert("convertPartnerRequestToProposalsAction refuses already-closed requests", /convertPartnerRequestToProposalsAction/.test(src) && /request!\.status === "resolved" \|\| request!\.status === "rejected"/.test(src));
}

// --- auditAdminWrite used for every request-state action ----------------------------------------
if (exists(ACTIONS)) {
  const src = read(ACTIONS);
  for (const action of ["recurso_partner_request_created", "recurso_partner_request_review_started", "recurso_partner_request_rejected", "recurso_partner_request_resolved", "recurso_partner_request_converted"]) {
    assert(`auditAdminWrite records ${action}`, src.includes(`"${action}"`));
  }
}

// --- reverification page shows operational fields, pending change awareness ---------------------
assert("reverificacion page shows pending change counts per resource", exists(REVERIFICACION_PAGE) && /pendingChangeCounts/.test(read(REVERIFICACION_PAGE)) && /dbListResourceChangeProposals/.test(read(REVERIFICACION_PAGE)));
assert("reverificacion page shows official-website availability per resource", exists(REVERIFICACION_PAGE) && /hasWebsite/.test(read(REVERIFICACION_PAGE)));
assert("resource detail page warns before reverification completion when changes are pending (does not silently allow overlooking them)", exists(RESOURCE_DETAIL_PAGE) && /pendingChanges\.length > 0/.test(read(RESOURCE_DETAIL_PAGE)) && /Atención: hay/.test(read(RESOURCE_DETAIL_PAGE)));
{
  const reverifyBtnBlock = exists(RESOURCE_DETAIL_PAGE) ? (read(RESOURCE_DETAIL_PAGE).match(/Marcar reverificación completada[\s\S]{0,400}/)?.[0] ?? "") : "";
  const reverifyBtnBlockBefore = exists(RESOURCE_DETAIL_PAGE) ? (read(RESOURCE_DETAIL_PAGE).match(/[\s\S]{0,400}Marcar reverificación completada/)?.[0] ?? "") : "";
  assert(
    "reverification completion is not blocked outright — a resource can still be reverified unchanged (Gate 6 behavior preserved)",
    reverifyBtnBlock.length > 0 && !/pointer-events-none/.test(reverifyBtnBlock) && !/pointer-events-none/.test(reverifyBtnBlockBefore),
  );
}

// --- dashboard integration ------------------------------------------------------------------------
const DASHBOARD = "app/admin/(dashboard)/recursos/page.tsx";
assert("dashboard 'Solicitudes pendientes' stat links to solicitudes queue", exists(DASHBOARD) && /"Solicitudes pendientes"[\s\S]{0,400}actionHref="\/admin\/recursos\/solicitudes"/.test(read(DASHBOARD)));
assert("dashboard 'Cambios pendientes' stat links to cambios queue", exists(DASHBOARD) && /"Cambios pendientes"[\s\S]{0,400}actionHref="\/admin\/recursos\/cambios"/.test(read(DASHBOARD)));
assert("dashboard 'Reverificación vencida' stat links to reverificacion queue", exists(DASHBOARD) && /"Reverificación vencida"[\s\S]{0,400}actionHref="\/admin\/recursos\/reverificacion"/.test(read(DASHBOARD)));

// --- public routes unchanged, no external partner portal, no public write path -------------------
assert("communityResourcesPublicQueries.ts untouched by Gate 7 (no partner/solicitud references)", exists(PUBLIC_QUERIES) && !/partner_update_request|solicitud/i.test(read(PUBLIC_QUERIES)));
assert("no external partner auth/session module introduced", !exists("app/lib/recursos/partnerAuth.ts") && !exists("app/lib/recursos/partnerSession.ts"));
assert("no public partner-facing route introduced under app/recursos-comunitarios", (() => {
  try {
    const dir = path.join(root, "app", "recursos-comunitarios");
    if (!fs.existsSync(dir)) return true;
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    return !walk(dir).some((f) => /solicitud|partner-request|partner-portal/i.test(f));
  } catch {
    return true;
  }
})());
assert("migration grants no public/anon policy on partner_update_requests (Gate 1, unchanged)", exists(MIGRATION) && !/grant[^\n]*partner_update_requests[^\n]*to (anon|public|authenticated)/i.test(read(MIGRATION)));
assert("partner_update_requests already has service_role select/insert/update from Gate 1 (no new grant needed)", exists(MIGRATION) && /grant select, insert, update on public\.partner_update_requests to service_role/.test(read(MIGRATION)));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
