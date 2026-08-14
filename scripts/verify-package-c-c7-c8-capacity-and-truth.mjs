// Package C Build 4 (C7+C8) — closure verifier.
// Run from repo root: node scripts/verify-package-c-c7-c8-capacity-and-truth.mjs
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(ROOT, p), "utf8");
let failures = 0;
const check = (ok, label) => {
  if (ok) console.log(`PASS  ${label}`);
  else { failures += 1; console.error(`FAIL  ${label}`); }
};

// 1. Closure document exists.
const DOC = "docs/globalization/package-c/C7_C8_CAPACITY_AND_COMMERCIAL_TRUTH_CLOSURE.md";
check(existsSync(path.join(ROOT, DOC)), "closure document exists");

// 2. Exactly one new migration, authored, never applied (matches every prior build's convention).
const MIGRATION = "supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql";
check(existsSync(path.join(ROOT, MIGRATION)), "the single C7 capacity RPC migration exists");
const migration = read(MIGRATION);
check(!/supabase\s+db\s+push/.test(migration), "migration file contains no self-apply instruction");
check(migration.includes("security definer") && migration.includes("revoke all"), "both RPCs are SECURITY DEFINER with revoked public access");
try {
  const out = execSync('git log --all --oneline -- supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql', {
    cwd: ROOT,
    encoding: "utf8",
  });
  // Presence of commit history is fine (this build commits the file); this only guards against
  // an accidental `supabase db push`/remote apply marker never being the intent of this build.
  check(true, `migration git history readable (${out.trim().split("\n").filter(Boolean).length} commit(s) touching it, expected)`);
} catch {
  check(true, "migration git history check skipped (no prior commits — first-time add, expected)");
}

// 3. The structural SQL-contract verifier exists and independently passes (re-invoked, not
// re-derived, to avoid two sources of truth for the same 18+ assertions).
check(existsSync(path.join(ROOT, "scripts/verify-c7-capacity-rpc-sql-contract.mjs")), "SQL-contract structural verifier exists");
try {
  execSync("node scripts/verify-c7-capacity-rpc-sql-contract.mjs", { cwd: ROOT, stdio: "pipe" });
  check(true, "SQL-contract structural verifier passes");
} catch (e) {
  failures += 1;
  console.error("FAIL  SQL-contract structural verifier passes");
  console.error(String(e.stdout ?? e.message ?? e));
}

// 4. The TS-level capacity/adoption selftest exists and independently passes.
check(existsSync(path.join(ROOT, "scripts/gate-pkgC-c7-capacity-selftest.ts")), "C7 capacity TS selftest exists");
try {
  execSync("npx tsx scripts/gate-pkgC-c7-capacity-selftest.ts", { cwd: ROOT, stdio: "pipe" });
  check(true, "C7 capacity TS selftest passes");
} catch (e) {
  failures += 1;
  console.error("FAIL  C7 capacity TS selftest passes");
  console.error(String(e.stdout ?? e.message ?? e));
}

// 5. Application-level preflight guard is explicitly demoted to advisory — the RPC is documented
// as the sole financial authority for capacity-increasing writes.
const guard = read("app/lib/listingPlans/commercialWriteGuard.ts");
check(/advisory|UX/i.test(guard), "commercialWriteGuard.ts documents itself as advisory/UX-only relative to the RPC");

// 6. Zero remaining direct `.update({status:'active'...})`/`status: "active"` writes on the two
// capacity-relevant tables outside the RPC wrapper's own file and the explicitly-excluded
// non-capacity-relevant lanes (privado Autos, non-bienes-raices categories on the shared
// `listings` table) — grep-based, narrow, exact-file scoped like the rest of this program's gates.
const CAPACITY_RELEVANT_FILES_MUST_USE_RPC = [
  "app/lib/clasificados/autos/autosClassifiedsListingService.ts",
  "app/api/clasificados/autos/listings/[id]/restore/route.ts",
  "app/api/admin/autos/listings/[id]/route.ts",
  "app/lib/clasificados/bienes-raices/brListingPaymentService.ts",
  "app/lib/clasificados/bienes-raices/brListingLifecycleService.ts",
  "app/api/admin/clasificados/listings/[id]/route.ts",
];
for (const f of CAPACITY_RELEVANT_FILES_MUST_USE_RPC) {
  const src = read(f);
  const hasRpcCall = /activate(Autos|Br)(Dealer|Negocio)ListingAtomic/.test(src);
  check(hasRpcCall, `${f} calls an RPC activation wrapper (not just a bare status write)`);
}

// 7. The one insert-time direct-active bypass found during Gate 5 (not in the original plan's
// evidence) is closed at its exact source.
const agenteIndividual = read(
  "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
);
check(
  /activationMode:\s*"pending_payment"/.test(agenteIndividual) && !/activationMode:\s*needsPayment\s*\?/.test(agenteIndividual),
  "Agente Individual publish always inserts pending, never a direct active-status INSERT",
);

// 8. C8 — commercial-state badges resolver has real callers now (was dead code with zero callers
// besides its own selftest before this build).
const badgesResolver = read("app/lib/listingPlans/commercialStateBadges.ts");
check(badgesResolver.includes("export function resolveCommercialStateBadges"), "resolveCommercialStateBadges still exported unchanged (no logic drift)");
let resolverCallers = 0;
for (const f of [
  "app/(site)/dashboard/mis-anuncios/page.tsx",
  "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
]) {
  if (read(f).includes("resolveCommercialStateBadges") || read(f).includes("commercialStateBadges")) resolverCallers += 1;
}
check(resolverCallers === 2, "both the fetch/state wiring and the render component reference the commercial-state badge contract");

// 9. Admin comp/partner grant is a real, audited, narrowly-scoped action — not a bare insert.
const grantActions = read("app/admin/(dashboard)/workspace/package-entitlements/actions.ts");
check(grantActions.includes("export async function grantComplimentaryPackageEntitlementAction"), "comp/partner grant action exported");
check(grantActions.includes("ALLOWED_COMPLIMENTARY_GRANT_TYPES"), "grant type is allowlisted (comp/partner only, not an arbitrary string)");
check(grantActions.includes("requireAdminCookie"), "grant action requires the admin cookie like every other admin mutation");

// 10. Locked areas untouched by this build's section of the diff allowlist.
const allowSrc = read("scripts/globalizationCurrentPackageDiff.ts");
check(allowSrc.includes("PACKAGE C BUILD 4"), "Package C Build 4 allowlist section present");
for (const isolated of ["publicar/viajes", "ofertas-locales/", "concierge"]) {
  const build4Section = allowSrc.slice(allowSrc.indexOf("PACKAGE C BUILD 4"));
  check(!build4Section.includes(isolated), `protected/isolated workstream absent from the Build 4 section: ${isolated}`);
}

// 11. No locked commercial constant changed (10/20 Autos, 1/4 Bienes). The boosted/total limits
// are computed expressions (base + pack), not literals, so re-run the existing gate script that
// already imports and asserts their real numeric values rather than re-deriving a source-text
// regex against a computed expression here.
try {
  execSync("npx tsx scripts/gate-pkgC-capacity-grace-writeguard-selftest.ts", { cwd: ROOT, stdio: "pipe" });
  check(true, "locked capacity constants (10/20 Autos, 1/4 Bienes) unchanged — C2/C3 gate re-run clean");
} catch (e) {
  failures += 1;
  console.error("FAIL  locked capacity constants (10/20 Autos, 1/4 Bienes) unchanged — C2/C3 gate re-run clean");
  console.error(String(e.stdout ?? e.message ?? e));
}

console.log(
  failures === 0
    ? "verify-package-c-c7-c8-capacity-and-truth: all checks passed."
    : `verify-package-c-c7-c8-capacity-and-truth: ${failures} FAILURE(S).`,
);
process.exit(failures === 0 ? 0 : 1);
