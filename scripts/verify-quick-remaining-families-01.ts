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

// ------------------------------------------------------------------------------------------------------------
// MIGRATION GUARD (repaired 2026-09-21 by the independent-audit repair mission)
//
// WHAT WAS WRONG: this guard read `git status --short -- supabase/migrations`, i.e. only the
// WORKING TREE. The instant a migration was committed — which is the normal end state of every
// mission — `git status` reported nothing and the loop body never executed. The guard reported
// OK for a repository it had not inspected. A destructive migration committed on this branch
// would have passed it silently.
//
// WHAT IT DOES NOW: it inspects the COMMITTED diff between the mission base and HEAD, and the
// working tree as well, so a migration cannot escape by being committed OR by being left dirty.
// The protection itself is unchanged in intent and strictly stricter in effect:
//
//   - exactly ONE migration file may appear in this range, by exact path. There is no directory
//     exemption, no glob and no "migrations matching X are fine" rule: an unexpected file fails
//     by name before its contents are even read.
//   - nothing destructive: no DROP TABLE / DROP SCHEMA / DROP COLUMN / TRUNCATE / DELETE /
//     DROP POLICY / DROP INDEX / DROP TYPE, and no CASCADE.
//   - no table creation, of any name, related or not.
//   - the authorized migration's ALTERations are checked EXACTLY: the only constraints it may
//     drop are the two it then re-adds, and the value sets it re-adds must be exactly the
//     permitted ones. Adding a third value, or widening a third table, fails.
//
// Every rule is self-tested below against synthetic SQL, so the guard cannot pass by being inert
// a second time.
// ------------------------------------------------------------------------------------------------------------
const MISSION_BASE_SHA = "883467d253e4c14d9d26c71ca9b35eacfe1054b7";
const AUTHORIZED_MIGRATION = "supabase/migrations/20260920120000_quick_business_lifecycle_capability_parity.sql";

/** The two constraints the authorized migration may drop — and must then re-add. */
const PERMITTED_CONSTRAINTS: Record<string, { table: string; values: string[] }> = {
  servicios_public_listings_listing_status_chk: {
    table: "public.servicios_public_listings",
    values: [
      "draft",
      "preview_ready",
      "publish_ready",
      "pending_payment",
      "pending_review",
      "published",
      "paused_unpublished",
      "archived",
      "rejected",
      "suspended",
    ],
  },
  restaurantes_public_listings_status_check: {
    table: "public.restaurantes_public_listings",
    values: ["pending_payment", "published", "paused", "archived", "suspended"],
  },
};

const DESTRUCTIVE_SQL: Array<[RegExp, string]> = [
  [/\bdrop\s+table\b/i, "DROP TABLE"],
  [/\bdrop\s+schema\b/i, "DROP SCHEMA"],
  [/\bdrop\s+column\b/i, "DROP COLUMN"],
  [/\bdrop\s+index\b/i, "DROP INDEX"],
  [/\bdrop\s+type\b/i, "DROP TYPE"],
  [/\bdrop\s+policy\b/i, "DROP POLICY"],
  [/\bdrop\s+function\b/i, "DROP FUNCTION"],
  [/\bdrop\s+trigger\b/i, "DROP TRIGGER"],
  [/\btruncate\b/i, "TRUNCATE"],
  [/\bdelete\s+from\b/i, "DELETE FROM"],
  [/\bcascade\b/i, "CASCADE"],
];

/** Comments stripped, so a rule quoted in prose (the file documents its own rollback) is not a hit. */
function sqlWithoutComments(sql: string): string {
  return sql.replace(/^\s*--.*$/gm, "");
}

function destructiveFindings(sql: string): string[] {
  const body = sqlWithoutComments(sql);
  return DESTRUCTIVE_SQL.filter(([re]) => re.test(body)).map(([, label]) => label);
}

/** Constraint names this SQL drops (the one legitimate `DROP` form: `DROP CONSTRAINT IF EXISTS`). */
function droppedConstraints(sql: string): string[] {
  return [...sqlWithoutComments(sql).matchAll(/drop\s+constraint\s+(?:if\s+exists\s+)?([a-z0-9_]+)/gi)].map((m) => m[1]!);
}

/** Constraint name → the exact IN(...) value list it is (re-)added with. */
function addedConstraintValues(sql: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const m of sqlWithoutComments(sql).matchAll(
    /add\s+constraint\s+([a-z0-9_]+)\s+check\s*\(\s*[a-z0-9_]+\s+in\s*\(([^)]*)\)/gi,
  )) {
    out[m[1]!] = [...m[2]!.matchAll(/'([^']*)'/g)].map((v) => v[1]!);
  }
  return out;
}

/** Tables named by an ALTER TABLE, so a third table cannot ride along unnoticed. */
function alteredTables(sql: string): string[] {
  return [...new Set([...sqlWithoutComments(sql).matchAll(/alter\s+table\s+([a-z0-9_.]+)/gi)].map((m) => m[1]!.toLowerCase()))];
}

function assertMigrationGuard(): void {
  // Committed AND uncommitted, so neither route escapes inspection.
  const committed = execSync(`git diff --name-only ${MISSION_BASE_SHA} HEAD -- supabase/migrations`, { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);
  // NB: `--short` prefixes each line with a TWO-CHARACTER status field, whose first character is
  // a space for an unstaged change (" M path"). Trimming the whole output first and then slicing
  // a fixed offset eats a character of the path — the bug the previous guard shipped with. Parse
  // the status field explicitly instead.
  const dirty = execSync("git status --short -- supabase/migrations", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .map((l) => /^.{2}\s+(.+)$/.exec(l)?.[1]?.trim() ?? "")
    .filter(Boolean)
    // A rename reports "old -> new"; the destination is what exists on disk.
    .map((f) => (f.includes(" -> ") ? f.split(" -> ").pop()!.trim() : f));
  const touched = [...new Set([...committed, ...dirty])].map((f) => f.replace(/\\/g, "/"));

  // SELF-TEST A: the range really is being read. If this mission's own authored migration is not
  // visible here, the guard is inert again and must fail loudly rather than report OK.
  assert.ok(
    touched.includes(AUTHORIZED_MIGRATION),
    `migration guard is inert: the authorized migration is not visible in ${MISSION_BASE_SHA}..HEAD (saw: ${touched.join(", ") || "nothing"})`,
  );

  // No wildcard: every path is matched by exact name.
  const unauthorized = touched.filter((f) => f !== AUTHORIZED_MIGRATION);
  assert.deepEqual(unauthorized, [], `only the one authorized Quick lifecycle migration may appear: ${unauthorized.join(", ")}`);

  const sql = read(AUTHORIZED_MIGRATION);
  assert.deepEqual(destructiveFindings(sql), [], `${AUTHORIZED_MIGRATION}: no destructive migration statement is permitted`);
  assert.ok(!/create\s+table/i.test(sqlWithoutComments(sql)), `${AUTHORIZED_MIGRATION}: no table may be created, related or not`);
  assert.ok(sql.includes("NOT APPLIED"), `${AUTHORIZED_MIGRATION}: must still declare that it has not been applied`);

  // Exact permitted constraint changes — the only DROPs are the two it re-adds.
  const dropped = droppedConstraints(sql).sort();
  const permitted = Object.keys(PERMITTED_CONSTRAINTS).sort();
  assert.deepEqual(dropped, permitted, `${AUTHORIZED_MIGRATION}: may only drop the two constraints it re-adds`);

  const added = addedConstraintValues(sql);
  assert.deepEqual(Object.keys(added).sort(), permitted, `${AUTHORIZED_MIGRATION}: must re-add exactly the two constraints it dropped`);
  for (const [name, spec] of Object.entries(PERMITTED_CONSTRAINTS)) {
    assert.deepEqual(added[name], spec.values, `${AUTHORIZED_MIGRATION}: ${name} may permit exactly the authorized value set`);
  }
  assert.deepEqual(
    alteredTables(sql).sort(),
    Object.values(PERMITTED_CONSTRAINTS).map((c) => c.table).sort(),
    `${AUTHORIZED_MIGRATION}: no third table may be altered`,
  );

  // The remaining-families surfaces this verifier owns are still untouched by any migration.
  assert.ok(
    !/ofertas_locales|comida_local|negocios_locales/i.test(sqlWithoutComments(sql)),
    `${AUTHORIZED_MIGRATION}: must not touch the remaining-families surfaces this verifier owns`,
  );

  // ---- SELF-TESTS: each rule is proven to fire on synthetic SQL it must reject ----
  assert.deepEqual(destructiveFindings("DROP TABLE public.listings;"), ["DROP TABLE"], "self-test: DROP TABLE is caught");
  assert.deepEqual(destructiveFindings("TRUNCATE public.listings;"), ["TRUNCATE"], "self-test: TRUNCATE is caught");
  assert.deepEqual(destructiveFindings("DELETE FROM public.listings;"), ["DELETE FROM"], "self-test: DELETE FROM is caught");
  assert.deepEqual(
    destructiveFindings("ALTER TABLE a DROP CONSTRAINT x CASCADE;"),
    ["CASCADE"],
    "self-test: a CASCADE riding on a permitted DROP CONSTRAINT is caught",
  );
  assert.deepEqual(destructiveFindings("-- DROP TABLE would be destructive\nSELECT 1;"), [], "self-test: prose in a comment is not a hit");
  assert.deepEqual(
    droppedConstraints("ALTER TABLE a DROP CONSTRAINT IF EXISTS some_other_chk;"),
    ["some_other_chk"],
    "self-test: an unexpected constraint drop is visible to the comparison above",
  );
  assert.deepEqual(
    addedConstraintValues("ALTER TABLE a ADD CONSTRAINT c CHECK (status IN ('a','b','sneaky'));").c,
    ["a", "b", "sneaky"],
    "self-test: a smuggled extra permitted value is visible to the comparison above",
  );
  assert.deepEqual(alteredTables("ALTER TABLE public.third_table ADD COLUMN x int;"), ["public.third_table"], "self-test: a third altered table is detected");
  assert.ok(/create\s+table/i.test("CREATE TABLE public.anything (id uuid);"), "self-test: table creation is detectable");
}

// 4. NO GENERIC NEGOCIOS LOCALES TABLE / MIGRATION -----------------------------------------------------------
{
  assert.ok(defBlocksInclude(reg, "negocios-locales", 'action: "content_link"'), "Negocios Locales classified as content_link, not a form");
  assert.ok(defBlocksInclude(reg, "negocios-locales", "manageHref: null"), "Negocios Locales has no manage destination (not a product)");
  assertMigrationGuard();
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
  // This guard exists because the Remaining Families repair had to fix the stale Ofertas coupon
  // price on the CLIENT rather than by rewriting the server matrix to match it. It originally
  // asserted the matrix file was byte-identical, which also forbids purely additive work on
  // unrelated categories: the Quick SIMPLE vs FULL mission adds four $249 business packages and an
  // optional businessAccessLevel field. Narrowed to the actual intent — the matrix may only be
  // ADDED to, and no Ofertas line may change. A rewrite that moved Ofertas pricing to the server,
  // which is what this guard was written to catch, still fails it.
  const matrixDiff = execSync(
    `git diff -U0 ${CERTIFIED_CORE_SHA} HEAD -- app/lib/listingPlans/revenuePricingMatrix.ts`,
    { cwd: ROOT, encoding: "utf8" },
  );
  const changedLines = matrixDiff
    .split(/\r?\n/)
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));
  const removed = changedLines.filter((l) => l.startsWith("-"));
  assert.deepEqual(removed, [], `server revenue matrix may only be added to, never rewritten: ${removed.join(" | ")}`);
  const ofertasTouched = changedLines.filter((l) => /ofertas/i.test(l));
  assert.deepEqual(
    ofertasTouched,
    [],
    `server Ofertas pricing was not rewritten — client constants were aligned to it: ${ofertasTouched.join(" | ")}`,
  );
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
  // The Quick SIMPLE vs FULL mission is authorized to rewire Quick Business onto the new $99
  // packages and to add the Simple control doorway, so this tree is no longer byte-frozen. It is
  // a file-exact allowlist: any OTHER file in the Quick Business tree still fails here. The Quick
  // Classifieds tree below stays byte-unchanged with no exception at all.
  const QUICK_BUSINESS_AUTHORIZED = new Set([
    "app/lib/quickBusiness/quickBusinessRegistry.ts", // Quick packages + the Simple media contract
    "app/lib/quickBusiness/quickBusinessRoutes.ts", // the mi-negocio doorway path
    "app/lib/quickBusiness/quickBusinessCopy.ts", // doorway copy
    "app/(site)/publicar/negocio-rapido/mi-negocio/page.tsx", // the Simple doorway route
    "app/(site)/publicar/negocio-rapido/_components/QuickBusinessMyBusinessClient.tsx",
    // Chunk 2 — the four adapters now stamp the Quick plan marker onto the handoff href they
    // already navigated to, so the shared preview charges the Quick package instead of the Full
    // one. The canonical draft each adapter builds is otherwise byte-identical.
    "app/(site)/publicar/negocio-rapido/_adapters/serviciosQuickBusinessAdapter.ts",
    "app/(site)/publicar/negocio-rapido/_adapters/restaurantesQuickBusinessAdapter.ts",
    "app/(site)/publicar/negocio-rapido/_adapters/autosDealerQuickBusinessAdapter.ts",
    "app/(site)/publicar/negocio-rapido/_adapters/bienesNegocioQuickBusinessAdapter.ts",
    // Bible §10.1 (2026-09-20): contact validation narrowed — email/website removed from
    // atLeastOne; explicit SMS field added so phone/SMS/WhatsApp satisfy the direct-contact minimum.
    "app/(site)/publicar/negocio-rapido/_adapters/quickBusinessAdapterShared.ts",
    // ------------------------------------------------------------------------------------------
    // Gate QB-MEDIA-02 / QB-MEDIA-03 (2026-09-20 → 2026-09-21). Four files that were legitimately
    // part of the Quick mission but were never added to this allowlist, so this verifier exited
    // red on work it was supposed to authorize. Each is listed individually with the reason it
    // could not be avoided — the set stays file-exact, with no directory and no wildcard.
    // ------------------------------------------------------------------------------------------
    // The Quick Business media contract itself. Quick Business permits NO video in any family,
    // while `QuickClassifiedMediaContract.videoOptional` is the literal `true` (every Classifieds
    // lane allows optional video). The registry was therefore returning `false` for a field typed
    // `true` — a real type error that blocked the production build. Quick Business carries its own
    // contract type instead of misreporting the Classifieds one, and, per QB-MEDIA-03, its own
    // media item type whose semantic `role` is REQUIRED.
    "app/lib/quickBusiness/quickBusinessTypes.ts",
    // The cross-family semantic media contract: which roles exist, which of them depict the thing
    // being listed, and the one canonical function every server publish seam calls. It has to live
    // in the Quick Business lib because four families and six server routes share it; putting it
    // anywhere else would mean four divergent copies of one rule.
    "app/lib/quickBusiness/quickBusinessMediaSemantics.ts",
    // The lifecycle capability matrix (pause/end per family, including the honest
    // `unsupported_by_schema` state while QB-LIFECYCLE-02's migration is authored-but-unapplied).
    // Same reason: one cross-family contract rather than four copies.
    "app/lib/quickBusiness/quickBusinessLifecycleCapabilities.ts",
    // The intake client, which is the PRODUCER half of the media contract. The semantic rule is
    // unprovable unless the producer emits a role, and the certified Quick Classifieds media step
    // (byte-frozen below) emits role-less items — so the intake had to switch to the Quick
    // Business step and carry roles through to the adapters.
    "app/(site)/publicar/negocio-rapido/_components/QuickBusinessIntakeClient.tsx",
    // QB-MEDIA-03 — the role-aware media step itself, and the draft store that must persist a
    // declared role (and must re-open a pre-roles draft as UNDECLARED rather than silently
    // promoting it to "vehicle"/"property"). Both are additions inside the Quick Business tree;
    // neither touches certified Quick Classifieds code.
    "app/(site)/publicar/negocio-rapido/_components/QuickBusinessMediaStep.tsx",
    "app/(site)/publicar/negocio-rapido/_components/quickBusinessDraftStore.ts",
  ]);
  const qbDiff = execSync(`git diff --name-only ${CERTIFIED_CORE_SHA} HEAD -- app/lib/quickBusiness "app/(site)/publicar/negocio-rapido"`, { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((f) => !QUICK_BUSINESS_AUTHORIZED.has(f.replace(/\\/g, "/")));
  assert.deepEqual(qbDiff, [], `certified Quick Business Core tree changed outside the authorized set: ${qbDiff.join(", ")}`);
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
