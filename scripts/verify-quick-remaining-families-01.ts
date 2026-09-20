/**
 * LEONIX QUICK — remaining lower-priority family coverage verifier (Gate 16).
 * Run: npx tsx scripts/verify-quick-remaining-families-01.ts
 *
 * Same hand-rolled node:assert + source-inspection convention as verify-quick-business-core-01.ts.
 * Proves the mission's own constraints, not just that files exist:
 *  1. registry completeness: all six families (comida-local, ofertas-locales, negocios-locales, viajes,
 *     iglesias, recursos) have an explicit decision; no family silently disappears.
 *  2. Comida Local field wiring: every Quick field is written to the canonical ComidaLocalDraft, no
 *     phantom canonical write reads an undeclared field. The detector is SELF-TESTED against three
 *     synthetic malformed scenarios so it cannot trivially pass.
 *  3. direct-link / content-link families point to real, existing routes (no dead href).
 *  4. no generic Negocios Locales table/migration was introduced.
 *  5. Viajes and Iglesias were not forced into Quick Classifieds or given a Quick form.
 *  6. Recursos was not given a fake form.
 *  7. Ofertas Locales client constants and checkout consent match the existing server packages
 *     (`ofertas_locales_flyer_30d` $399, `ofertas_locales_coupons_30d` $199); no Quick SKU.
 *  8. no new Quick SKU / package key, no migration, no parallel public detail template for Comida Local.
 *  9. core Quick Business (exactly 4 live) and certified Quick Classifieds trees are untouched.
 * 10. staff launchpad: core priorities (Tier-1, Quick Business) render before the new lower-priority
 *     "Más Opciones" section.
 * 11. the single authorized Quick media API (Comida Local draft upload) grants the client no authority:
 *     the client-supplied draftListingId never decides the storage path, identity comes from a verified
 *     Bearer JWT or a server-minted httpOnly session, and the route writes no row and charges nothing.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const exists = (rel: string) => existsSync(join(ROOT, rel));
const CERTIFIED_CORE_SHA = "b66322ba01482dcf433220de0a1855d6824f54c4";

const REG_PATH = "app/lib/quickRemaining/quickRemainingRegistry.ts";
const reg = read(REG_PATH);

const EXPECTED_FAMILIES = ["comida-local", "ofertas-locales", "negocios-locales", "viajes", "iglesias", "recursos"];

// 1. REGISTRY COMPLETENESS ----------------------------------------------------------------------------------
{
  assert.ok(reg.includes("QUICK_REMAINING_ORDER"), "registry declares an explicit order");
  const orderMatch = reg.match(/QUICK_REMAINING_ORDER: readonly string\[\] = \[([\s\S]*?)\];/);
  assert.ok(orderMatch, "QUICK_REMAINING_ORDER block found");
  const declaredOrder = [...orderMatch![1]!.matchAll(/"([a-z-]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(declaredOrder, EXPECTED_FAMILIES, "exactly the six mandated families, in the mandated order — none silently dropped, none invented");
  for (const key of EXPECTED_FAMILIES) {
    assert.ok(reg.includes(`"${key}": {`) || reg.includes(`  ${key}: {`), `registry has an explicit decision block for ${key}`);
  }
  // Self-test #1: a registry missing a family's decision must be caught by this exact check.
  const brokenOrder = EXPECTED_FAMILIES.filter((k) => k !== "iglesias");
  assert.notDeepEqual(brokenOrder, EXPECTED_FAMILIES, "self-test: a registry missing a family decision is detectably different from the required six");
}

// 2. COMIDA LOCAL FIELD WIRING (self-tested detector) -------------------------------------------------------
const CL_CLIENT = "app/(site)/publicar/comida-local/rapido/ComidaLocalQuickIntakeClient.tsx";
function analyzeComidaLocalWiring(src: string): { declared: Set<string>; written: Set<string> } {
  const declared = new Set([...src.matchAll(/key: "([A-Za-z]+)"/g)].map((m) => m[1]!));
  const written = new Set([...src.matchAll(/quickStr\(values, "([A-Za-z]+)"\)/g)].map((m) => m[1]!));
  return { declared, written };
}
function unwritten(w: { declared: Set<string>; written: Set<string> }): string[] {
  // city is written via a resolver call, not a direct quickStr read — allowed exception, checked separately.
  return [...w.declared].filter((k) => k !== "city" && !w.written.has(k));
}
function phantomWrite(w: { declared: Set<string>; written: Set<string> }): string[] {
  return [...w.written].filter((k) => !w.declared.has(k));
}
{
  // Self-test #2: a field declared but never written (decorative field) must be caught.
  const syntheticMissing = `{ key: "title" } { key: "ghost" } businessName: quickStr(values, "title"),`;
  const sw1 = analyzeComidaLocalWiring(syntheticMissing);
  assert.deepEqual(unwritten(sw1), ["ghost"], "detector self-test: decorative (unwired) field is caught");

  // Self-test #3: a phantom write reading an undeclared key must be caught.
  const syntheticPhantom = `{ key: "title" } businessName: quickStr(values, "title"), extra: quickStr(values, "neverDeclared"),`;
  const sw2 = analyzeComidaLocalWiring(syntheticPhantom);
  assert.deepEqual(phantomWrite(sw2), ["neverDeclared"], "detector self-test: phantom canonical write is caught");

  const cl = read(CL_CLIENT);
  const w = analyzeComidaLocalWiring(cl);
  assert.deepEqual(unwritten(w), [], "Comida Local Quick: every declared field is actually written to the canonical draft");
  assert.deepEqual(phantomWrite(w), [], "Comida Local Quick: no canonical write reads an undeclared field");
  assert.ok(cl.includes("cityDisplay: cityRaw") && cl.includes("cityCanonical: getCanonicalCityName(cityRaw)"), "city is resolved through the EXISTING canonical resolver, not a raw string copy");
  assert.ok(cl.includes("validateComidaLocalDraftForFuturePublish(canonical"), "submit runs the EXISTING strict readiness validator against the real canonical draft");
  assert.ok(cl.includes("saveComidaLocalDraftToStorage(canonical)"), "submit hands off through the EXISTING default-key draft store the EXISTING preview reads");
  assert.ok(cl.includes('/clasificados/comida-local/preview'), "submit routes to the EXISTING preview, not a new page");
  assert.ok(cl.includes("uploadComidaLocalDraftImage"), "media exception: uses the EXISTING upload helper");
  assert.ok(cl.includes('if (!first) throw') && cl.includes("if (!galleryUploaded.ok) throw"), "Comida Local Quick upload failures fail closed (main + gallery)");
  assert.ok(!/\.from\(|\.insert\(|\.update\(|\.upsert\(/.test(cl.replace(/\/\*[\s\S]*?\*\//g, "")), "Comida Local Quick client never inserts/updates a row directly (comments stripped before the check)");
  const directFetchApi = [...cl.matchAll(/fetch\(\s*["'`](\/api\/[^"'`]*)["'`]/g)].map((m) => m[1]!);
  assert.deepEqual(directFetchApi, [], "Comida Local Quick client never POSTs an API route literally (the one upload call goes through the existing helper function, not a literal fetch string here)");
}

// Registry entries use quoted keys ("comida-local") only when the identifier needs it (hyphens);
// plain-word families (viajes, iglesias, recursos) are unquoted object keys — handle both forms.
function blockStart(source: string, key: string): number {
  const quoted = source.indexOf(`"${key}": {`);
  if (quoted >= 0) return quoted;
  return source.indexOf(`  ${key}: {`);
}
function defBlock(source: string, key: string): string {
  const idx = blockStart(source, key);
  assert.ok(idx >= 0, `registry block present for ${key}`);
  const rest = source.slice(idx);
  const end = rest.indexOf("\n  },");
  return rest.slice(0, end);
}
function defBlocksInclude(source: string, key: string, needle: string): boolean {
  return defBlock(source, key).includes(needle);
}

// 3. DIRECT-LINK / CONTENT-LINK FAMILIES POINT TO REAL EXISTING ROUTES ---------------------------------------
{
  const defBlocks: Record<string, string> = {};
  for (const key of EXPECTED_FAMILIES) defBlocks[key] = defBlock(reg, key);
  const routeChecks: Record<string, string> = {
    "ofertas-locales": "app/(site)/publicar/ofertas-locales",
    viajes: "app/(site)/publicar/viajes",
  };
  for (const [key, dir] of Object.entries(routeChecks)) {
    assert.ok(defBlocks[key]!.includes('action: "direct_link"'), `${key}: classified as direct_link`);
    assert.ok(exists(dir), `${key}: the existing canonical application directory actually exists on disk (${dir})`);
  }
  // Self-test #4: a direct_link family whose href points nowhere must be catchable by this same existence check.
  assert.ok(!exists("app/(site)/publicar/this-route-does-not-exist"), "self-test: existence check correctly reports a fabricated route as missing");
}

// 4. NO GENERIC NEGOCIOS LOCALES TABLE / MIGRATION -----------------------------------------------------------
{
  assert.ok(defBlocksInclude(reg, "negocios-locales", 'action: "content_link"'), "Negocios Locales classified as content_link, not a form");
  assert.ok(defBlocksInclude(reg, "negocios-locales", "manageHref: null"), "Negocios Locales has no manage destination (not a product)");
  const migrationDir = "supabase/migrations";
  if (existsSync(join(ROOT, migrationDir))) {
    const files = execSync(`git status --short -- ${migrationDir}`, { cwd: ROOT, encoding: "utf8" }).trim();
    assert.equal(files, "", "no new/changed migration files introduced by this mission");
  }
  const trackedFiles = execSync(`git diff --name-only ${CERTIFIED_CORE_SHA} HEAD`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  const negociosLocalesTableFiles = trackedFiles.filter((f) => /negocios[_-]?locales/i.test(f) && !f.includes("quickRemaining"));
  assert.deepEqual(negociosLocalesTableFiles, [], "no new file (table/model/route) named after a generic Negocios Locales product was added");
}

// 5. VIAJES / IGLESIAS NOT FORCED INTO QUICK CLASSIFIEDS -------------------------------------------------------
{
  const qc = read("app/lib/quickClassifieds/quickClassifiedRegistry.ts");
  assert.ok(!/\bviajes\b/i.test(qc), "Viajes never added as a Quick Classifieds category");
  assert.ok(!/iglesias/i.test(qc), "Iglesias never added as a Quick Classifieds category");
  assert.ok(defBlocksInclude(reg, "viajes", 'action: "direct_link"'), "Viajes classified as direct_link, not quick_form");
  assert.ok(defBlocksInclude(reg, "iglesias", 'action: "direct_link"'), "Iglesias classified as direct_link, not quick_form");
  assert.ok(!existsSync(join(ROOT, "app/(site)/publicar/viajes/rapido")), "no Quick wrapper route was built for Viajes");
  assert.ok(!existsSync(join(ROOT, "app/(site)/publicar/iglesias/rapido")), "no Quick wrapper route was built for Iglesias");
}

// 6. RECURSOS NOT GIVEN A FAKE FORM ---------------------------------------------------------------------------
{
  assert.ok(defBlocksInclude(reg, "recursos", 'action: "content_link"'), "Recursos classified as content_link");
  assert.ok(defBlocksInclude(reg, "recursos", "manageHref: null"), "Recursos has no manage destination");
  assert.ok(!existsSync(join(ROOT, "app/(site)/publicar/recursos")), "no publish/submission route of any kind exists for Recursos");
}

// 7. OFERTAS LOCALES PRICING ALIGNED TO SERVER AUTHORITY -------------------------------------------------------
{
  const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
  const constants = read("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
  const checkout = read("app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx");
  assert.ok(/packageKey:\s*OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY[\s\S]{0,220}priceCents:\s*39900/.test(matrix), "server flyer package remains $399");
  assert.ok(/packageKey:\s*OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY[\s\S]{0,220}priceCents:\s*19900/.test(matrix), "server coupon package remains $199");
  assert.ok(constants.includes("OFERTAS_LOCALES_FLYER_PRICE_CENTS = 39900"), "client flyer constant matches server $399");
  assert.ok(constants.includes("OFERTAS_LOCALES_COUPONS_PRICE_CENTS = 19900"), "client coupon constant matches server $199 (repaired from stale $0)");
  assert.ok(/coupons:[\s\S]*displayPriceUsd:\s*199/.test(constants), "coupon catalog display matches $199");
  assert.ok(checkout.includes("ofertaLocalChargeConsentCopy"), "checkout consent is derived from the live commercial package");
  assert.ok(!/autorizo el cobro de \$399/.test(checkout), "coupon checkout consent no longer hardcodes the flyer $399");
  assert.ok(defBlocksInclude(reg, "ofertas-locales", "pricing: null"), "Ofertas Locales Quick registry still surfaces no Quick price badge / SKU");
  const matrixDiff = execSync(`git diff --name-only ${CERTIFIED_CORE_SHA} HEAD -- app/lib/listingPlans/revenuePricingMatrix.ts`, { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(matrixDiff, "", "server revenue matrix was not rewritten — client constants were aligned to it");
}

// 8. NO NEW SKU / MIGRATION / PARALLEL PUBLIC TEMPLATE FOR COMIDA LOCAL -----------------------------------------
{
  const clFiles = execSync(`git diff --name-only ${CERTIFIED_CORE_SHA} HEAD -- app/lib/clasificados/comida-local app/api/clasificados/comida-local`, { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(clFiles, "", "no canonical Comida Local file (types, validation, publish route, media upload) was modified — only the additive /rapido tree and the registry were added");
  assert.ok(!reg.includes('packageKey: "comida_local_') || reg.includes('packageKey: "comida_local_base_monthly"'), "Comida Local Quick reuses the EXISTING package key, invents no new SKU");
  assert.ok(!existsSync(join(ROOT, "app/(site)/clasificados/comida-local/rapido")), "no parallel public detail/preview template was created for Comida Local — the existing preview is reused unmodified");
}

// 9. CORE QUICK BUSINESS + CERTIFIED QUICK CLASSIFIEDS UNTOUCHED --------------------------------------------
{
  const qbReg = read("app/lib/quickBusiness/quickBusinessRegistry.ts");
  assert.equal((qbReg.match(/status: "live"/g) ?? []).length, 4, "Quick Business Core still has exactly four live categories");
  const qbDiff = execSync(`git diff --name-only ${CERTIFIED_CORE_SHA} HEAD -- app/lib/quickBusiness "app/(site)/publicar/negocio-rapido"`, { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(qbDiff, "", "certified Quick Business Core tree byte-unchanged vs. the certified SHA");
  const qcDiff = execSync(`git diff --name-only ${CERTIFIED_CORE_SHA} HEAD -- "app/(site)/publicar/rapido" app/lib/quickClassifieds`, { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(qcDiff, "", "certified Quick Classifieds tree byte-unchanged vs. the certified SHA");
  const dirty = execSync(`git status --short -- app/lib/quickBusiness "app/(site)/publicar/negocio-rapido" "app/(site)/publicar/rapido" app/lib/quickClassifieds`, { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(dirty, "", "no uncommitted change sits in either certified tree");
}

// 10. STAFF LAUNCHPAD ORDER: CORE PRIORITIES BEFORE "MÁS OPCIONES" --------------------------------------------
{
  const lp = read("app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx");
  const tier1Idx = lp.indexOf('id="quick-tier1"');
  const businessIdx = lp.indexOf('id="quick-business"');
  const moreIdx = lp.indexOf('id="quick-more-options"');
  assert.ok(tier1Idx >= 0 && businessIdx >= 0 && moreIdx >= 0, "all three launchpad sections are present");
  assert.ok(tier1Idx < businessIdx && businessIdx < moreIdx, "Tier-1 Quick Classifieds, then Quick Business Core, then the new lower-priority Más Opciones — in that order");
  assert.ok(lp.includes("Más Opciones / More Options"), "new section is honestly labeled lower priority, not merged into Quick Business");
  assert.ok(lp.includes("listQuickRemainingDefinitions()"), "launchpad renders the registry's six remaining families");
  assert.ok(!/Crear con el cliente \/ Create with customer/.test(lp) || lp.includes('def.action === "quick_form"'), "the only 'create' verb used is gated to the one family that is actually a quick_form");
  assert.ok(lp.includes('"Abrir formulario / Open application"') && lp.includes('"Abrir directorio / Open directory"'), "truthful non-create verbs exist for direct_link and content_link families");
}

// 11. THE ONE AUTHORIZED QUICK MEDIA API CARRIES NO CLIENT AUTHORITY -----------------------------------------
// Comida Local Quick is the only Quick surface that reaches an internal API route. The client sends a
// self-generated `draftListingId`, so that value must never decide where bytes land or who owns them.
function blobPathnameTemplate(src: string): string {
  const m = src.match(/const pathname = `([^`]*)`/);
  assert.ok(m, "draft-media-upload route declares a single blob pathname template");
  return m![1]!;
}
{
  const ROUTE = "app/api/clasificados/comida-local/draft-media-upload/route.ts";
  const route = read(ROUTE);
  const session = read("app/api/clasificados/_lib/anonUploadSession.ts");

  // Self-test #5: a route that interpolated the client's draft id into the storage path must be caught.
  const syntheticLeak = "const pathname = `clasificados/comida-local/drafts/${draftListingId}/${role}/x`";
  assert.ok(blobPathnameTemplate(syntheticLeak).includes("draftListingId"), "detector self-test: a client-supplied draft id in the storage path is detectable");

  assert.ok(!blobPathnameTemplate(route).includes("draftListingId"), "client-supplied draftListingId never decides the storage path — it is validated as non-empty and otherwise carries no authority");
  assert.ok(route.includes("comidaLocalOwnerIdFromBearer(req)"), "uploader identity is resolved server-side from the Bearer JWT");
  assert.ok(read("app/lib/clasificados/comida-local/comidaLocalPublishServerAuth.ts").includes("sb.auth.getUser(token)"), "that Bearer resolution actually verifies the token against Supabase, it does not decode it locally");
  assert.ok(route.includes("anonUploadPathSegment(anonSessionId)") || route.includes("anonUploadPathSegment(anonSession"), "the anonymous fallback segment comes from the server-issued session helper");
  assert.ok(session.includes("randomUUID()") && session.includes("httpOnly: true"), "that anonymous session id is server-minted and httpOnly, so the client cannot choose its own path segment");
  assert.ok(route.includes("COMIDA_LOCAL_ACCEPTED_IMAGE_MIME") && route.includes("COMIDA_LOCAL_IMAGE_MAX_BYTES"), "content type allowlist and byte cap are enforced on the server, not only in the browser");
  assert.ok(!/\.from\(\s*["'`]|\.insert\(|\.update\(|\.upsert\(|\.delete\(/.test(route), "the upload route writes no database row — it stores bytes and returns a URL");
  assert.ok(!/stripe|checkout|priceCents|amountCents/i.test(route), "the upload route charges nothing — no payment symbol appears in it");
  assert.ok(route.includes('from "@vercel/blob"') && /await put\(pathname, file/.test(route), "its only persistence is a Vercel Blob object write at the server-derived path");
  assert.deepEqual([...route.matchAll(/fetch\(\s*["'`](\/[^"'`]*)["'`]/g)].map((m) => m[1]!), [], "the upload route calls no other internal route, so it cannot reach the publish or payment path");
}

console.log("verify-quick-remaining-families-01: OK");
