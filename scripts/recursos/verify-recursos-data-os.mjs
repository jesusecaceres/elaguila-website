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

// --- Build 01 preservation -------------------------------------------------
for (const rel of [
  "app/lib/recursos/types.ts",
  "app/lib/recursos/categories.ts",
  "app/lib/recursos/urgency.ts",
  "app/lib/recursos/copy.ts",
  "app/lib/recursos/lanes.ts",
  "app/lib/recursos/resourceFilters.ts",
  "app/lib/recursos/resourceCatalog.ts",
  "app/lib/recursos/resourceCtaAdapter.ts",
  "app/(site)/recursos-comunitarios/page.tsx",
]) {
  assert(`Build 01 file preserved: ${rel}`, exists(rel), rel);
}
const typesSrc = read("app/lib/recursos/types.ts");
assert("toPublicResource() still exists and strips internal", /export function toPublicResource/.test(typesSrc));
assert("toPublicResource destructures internal out", /const \{ internal, \.\.\.rest \} = resource/.test(typesSrc));

// --- Migration ---------------------------------------------------------------
const migrationFiles = fs.readdirSync(path.join(root, "supabase/migrations")).filter((f) => f.includes("community_resources"));
assert("community_resources migration exists", migrationFiles.length > 0, migrationFiles);
const migrationSrc = migrationFiles.length ? read(path.join("supabase/migrations", migrationFiles[0])) : "";
assert("migration creates community_resources table", /create table if not exists public\.community_resources/.test(migrationSrc));
assert("migration enforces slug uniqueness", /slug text not null unique/.test(migrationSrc));
assert("migration has urgency_level check constraint", /check \(urgency_level in \('help-now', 'i-need-help', 'want-to-connect'\)\)/.test(migrationSrc));
assert("migration has verification_status check constraint", /check \(verification_status in \('verified', 'needs_review', 'stale', 'inactive'\)\)/.test(migrationSrc));
assert("migration has primary_category check constraint", /check \(primary_category in \(/.test(migrationSrc));
assert("migration has age range check constraint", /community_resources_age_range_chk/.test(migrationSrc));
assert("migration enables RLS", /alter table public\.community_resources enable row level security/.test(migrationSrc));
assert(
  "migration public select policy requires active=true",
  /using \(active = true and verification_status <> 'inactive'\)/.test(migrationSrc),
);
assert("migration has category index", /community_resources_primary_category_idx/.test(migrationSrc));
assert("migration has urgency index", /community_resources_urgency_level_idx/.test(migrationSrc));
assert("migration has verification_status index", /community_resources_verification_status_idx/.test(migrationSrc));
assert("migration has active index", /community_resources_active_idx/.test(migrationSrc));
assert("migration has updated_at index", /community_resources_updated_at_idx/.test(migrationSrc));
assert("migration has no INSERT/UPDATE/DELETE public policy (writes are service-role only)", !/create policy[\s\S]*for (insert|update|delete)/i.test(migrationSrc));

// --- Data access layer --------------------------------------------------------
assert("communityResourcesDb.ts exists", exists("app/lib/recursos/server/communityResourcesDb.ts"));
assert("communityResourcesPublicQueries.ts exists", exists("app/lib/recursos/server/communityResourcesPublicQueries.ts"));
const dbSrc = read("app/lib/recursos/server/communityResourcesDb.ts");
assert("communityResourcesDb.ts is server-only", /import "server-only"/.test(dbSrc));
assert("communityResourcesDb.ts uses admin (service role) client", /getAdminSupabase/.test(dbSrc));
assert("communityResourcesDb.ts never imports anon client", !/getServerSupabaseAnon/.test(dbSrc));
for (const fn of [
  "dbListCommunityResources",
  "dbGetCommunityResourceById",
  "dbGetCommunityResourceBySlug",
  "dbCreateCommunityResource",
  "dbUpdateCommunityResource",
  "dbSetCommunityResourceActive",
  "dbSetCommunityResourceVerificationStatus",
]) {
  assert(`communityResourcesDb.ts exports ${fn}`, new RegExp(`export async function ${fn}`).test(dbSrc));
}

const publicSrc = read("app/lib/recursos/server/communityResourcesPublicQueries.ts");
assert("public queries filter active = true", /\.eq\("active", true\)/.test(publicSrc));
assert("public queries exclude inactive verification_status", /\.neq\("verification_status", "inactive"\)/.test(publicSrc));
assert("public queries return via toPublicResource()", /toPublicResource\(/.test(publicSrc));
assert("public queries never select internal_notes as a returned raw field", /toPublicResource\(rowToResourceRecord/.test(publicSrc));

// --- Security / permission gating --------------------------------------------
const teamTypesSrc = read("app/admin/_lib/teamTypes.ts");
assert("can_manage_recursos permission key added", /"can_manage_recursos"/.test(teamTypesSrc));

const actionsSrc = read("app/admin/recursosActions.ts");
assert("recursosActions.ts is a server actions module", /"use server"/.test(actionsSrc));
assert("recursosActions.ts gates on can_manage_recursos", /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(actionsSrc));
for (const fn of ["createRecursoAction", "updateRecursoAction", "setResourceActiveAction", "setVerificationStatusAction"]) {
  assert(`recursosActions.ts exports ${fn}`, new RegExp(`export async function ${fn}`).test(actionsSrc));
}
assert("every exported action calls assertRecursosAdmin()", (actionsSrc.match(/export async function \w+\(formData: FormData\): Promise<void> \{\n  await assertRecursosAdmin\(\);/g) ?? []).length === 4);
assert("verification action enforces help-now validation before marking verified", /validateResourceForVerification\(record!\)/.test(actionsSrc));
assert("audit log write present for create/update/status changes", /auditAdminWrite\(/.test(actionsSrc));

// --- Admin routes --------------------------------------------------------------
for (const rel of [
  "app/admin/(dashboard)/recursos/page.tsx",
  "app/admin/(dashboard)/recursos/nuevo/page.tsx",
  "app/admin/(dashboard)/recursos/[id]/page.tsx",
]) {
  assert(`admin route exists: ${rel}`, exists(rel));
}
const navSrc = read("app/admin/_lib/adminGlobalNav.ts");
assert("nav includes /admin/recursos", /href: "\/admin\/recursos"/.test(navSrc));
const accessSrc = read("app/admin/_lib/adminAccessControl.ts");
assert("allowed global nav hrefs includes /admin/recursos", /"\/admin\/recursos"/.test(accessSrc));

// --- Verification OS + urgent safety -----------------------------------------
const verifSrc = read("app/lib/recursos/verificationStatus.ts");
assert("verificationStatus.ts never returns verified without lastVerifiedAt", /if \(!verification\.lastVerifiedAt\) \{/.test(verifSrc));
assert("verificationStatus.ts exports resolveEffectiveVerificationStatus", /export function resolveEffectiveVerificationStatus/.test(verifSrc));

const urgentSrc = read("app/lib/recursos/urgentResourceValidation.ts");
assert("urgent validation requires official source for help-now", /urgencyLevel === "help-now"/.test(urgentSrc) && /officialSourceUrl/.test(urgentSrc));
assert("urgent validation requires actionable contact", /hasActionableContact/.test(urgentSrc));

// --- Truthful CTA form hints ---------------------------------------------------
const formSrc = read("app/admin/_components/recursos/RecursoForm.tsx");
for (const hint of [
  "CALL button hidden",
  "TEXT button hidden",
  "WhatsApp button hidden",
  "EMAIL button hidden",
  "WEBSITE button hidden",
  "APPLY button hidden",
]) {
  assert(`form communicates truthful CTA hint: "${hint}"`, formSrc.includes(hint));
}
assert("form never hardcodes 24/7 as default-checked", !/name="is24Hours"\s*\n?\s*defaultChecked=\{true\}/.test(formSrc));
assert("form supports address withheld for safety", /addressWithheldForSafety/.test(formSrc));

// --- Seeding policy -------------------------------------------------------------
const seedSrc = exists("scripts/recursos/seed-verified-resources.ts") ? read("scripts/recursos/seed-verified-resources.ts") : "";
assert("seed script exists", Boolean(seedSrc));
assert("seed script VERIFIED_RESOURCES starts empty", /const VERIFIED_RESOURCES: CommunityResourceInput\[\] = \[\];/.test(seedSrc));
assert("seed script requires --confirm to write", /--confirm/.test(seedSrc));

// --- Report --------------------------------------------------------------------
const failed = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}`);
}
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length > 0) {
  console.error("\nFAILURES:");
  for (const f of failed) console.error(`- ${f.name}`, f.detail ?? "");
  process.exitCode = 1;
}
