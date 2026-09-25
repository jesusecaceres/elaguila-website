/**
 * SERVICIOS — the selected Quick/Full product is carried to the FIRST server save by staff custody, never by the URL.
 *
 * Chain under test:
 *   Quick Sales product selection (server-resolved package key)
 *     -> signed assisted-publishing cookie (HMAC, tamper-evident, carries `packageKey`)
 *       -> Servicios publish route: `assistedPackageKey: assistedContext.packageKey`
 *         -> resolveQuickBusinessProduct -> Quick contract / Quick field boundary.
 * The URL (`?plan=`) preserves UX state only; it is never an input to the server decision.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-servicios-quick-package-signal-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  createAssistedPublishingTokenWithSecret,
  verifyAssistedPublishingTokenWithSecret,
} from "../app/lib/auth/assistedPublishingToken";
import { resolveStaffBusinessPackage } from "../app/lib/sales/staffBusinessProduct";
import { resolveQuickBusinessProduct, quickContractAppliesTo } from "../app/lib/listingPlans/quickBusinessProductIdentity";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import { quickFullOnlyBoundaryApplies } from "../app/lib/quickBusiness/quickFullOnlyBoundary";

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
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

const PAIR = BUSINESS_CATEGORY_PACKAGE_PAIR.servicios!;
const SECRET = "verify-only-secret-not-a-real-credential";
const base = { businessId: "b-1", category: "servicios", rosterId: "r-1", authUserId: "u-1" };
const NOW = 1_780_000_000_000;

function cookieFor(packageKey: string | null): string {
  const t = createAssistedPublishingTokenWithSecret({ ...base, assistedAction: "save_for_client", packageKey }, SECRET, NOW);
  assert.ok(t, "token minted");
  return t!;
}
/** What the server route does with the cookie: verify, then read packageKey. */
function serverProduct(token: string, declaredPackageKey?: string | null) {
  const ctx = verifyAssistedPublishingTokenWithSecret(token, SECRET, NOW + 1000);
  return resolveQuickBusinessProduct({
    category: "servicios",
    assistedPackageKey: ctx?.packageKey ?? null,
    declaredPackageKey: declaredPackageKey ?? null,
  });
}

check("cockpit: Quick selected -> the server resolves the Quick package key; Full selected -> the Full key", () => {
  const q = resolveStaffBusinessPackage({ category: "servicios", requestedPlan: "quick" });
  const f = resolveStaffBusinessPackage({ category: "servicios", requestedPlan: "full" });
  assert.ok(q.ok && q.plan === "quick" && q.packageKey === PAIR.simple);
  assert.ok(f.ok && f.plan === "full" && f.packageKey === PAIR.full);
  const omitted = resolveStaffBusinessPackage({ category: "servicios" });
  assert.ok(omitted.ok && omitted.plan === "quick", "an omitted plan fails safe to the LESSER product");
  const forged = resolveStaffBusinessPackage({ category: "servicios", requestedPackageKey: "servicios_platinum_forever" });
  assert.equal(forged.ok, false, "an unknown package key is refused, never stamped");
});

check("first server save: Quick selected in the cockpit resolves QUICK (Quick contract + field boundary apply)", () => {
  const d = serverProduct(cookieFor(PAIR.simple));
  assert.equal(d.product, "quick");
  assert.equal(d.source, "assisted_context");
  assert.equal(quickContractAppliesTo(d), true);
  assert.equal(quickFullOnlyBoundaryApplies(d), true);
});
check("first server save: Full selected in the cockpit does NOT resolve Quick (no Quick limits, no stripping)", () => {
  const d = serverProduct(cookieFor(PAIR.full));
  assert.equal(d.product, "full");
  assert.equal(quickContractAppliesTo(d), false);
  assert.equal(quickFullOnlyBoundaryApplies(d), false);
});

check("tamper: editing the signed cookie payload to claim Full does not verify (HMAC), so it cannot upgrade Quick to Full", () => {
  const token = cookieFor(PAIR.simple);
  const [payload, sig] = [token.slice(0, token.lastIndexOf(".")), token.slice(token.lastIndexOf(".") + 1)];
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  assert.equal(decoded.packageKey, PAIR.simple);
  const forgedPayload = Buffer.from(JSON.stringify({ ...decoded, packageKey: PAIR.full }), "utf8").toString("base64url");
  assert.equal(verifyAssistedPublishingTokenWithSecret(`${forgedPayload}.${sig}`, SECRET, NOW + 1000), null, "payload swap fails");
  assert.equal(verifyAssistedPublishingTokenWithSecret(token, "a-different-secret", NOW + 1000), null, "wrong secret fails");
  assert.equal(verifyAssistedPublishingTokenWithSecret(token.slice(0, -4), SECRET, NOW + 1000), null, "truncation fails");
  // A rejected token contributes no package key: the server then holds NO evidence — and no Quick restriction is guessed.
  const unverified = resolveQuickBusinessProduct({ category: "servicios", assistedPackageKey: null });
  assert.equal(unverified.product, "unverified");
});

check("URL cannot be commercial authority: a body/URL declaration of Full never upgrades a Quick cookie, and never downgrades a Full cookie", () => {
  assert.equal(serverProduct(cookieFor(PAIR.simple), PAIR.full).product, "quick", "Quick cookie + declared Full stays Quick");
  assert.equal(serverProduct(cookieFor(PAIR.full), PAIR.simple).product, "full", "Full cookie + declared Quick stays Full");
  const declaredFullOnly = resolveQuickBusinessProduct({ category: "servicios", declaredPackageKey: PAIR.full });
  assert.equal(declaredFullOnly.product, "unverified", "a declared Full key is never trusted as `full`");
});

check("wiring: the Servicios route feeds the verified cookie's packageKey to the resolver BEFORE media/field enforcement, and never reads the URL plan", () => {
  const src = raw("app/api/clasificados/servicios/publish/route.ts");
  const resolve = src.indexOf("resolveQuickBusinessPublishIdentity({");
  const media = src.indexOf("serviciosProduct.enforceQuickContract");
  const boundary = src.indexOf("quickFullOnlyBoundaryApplies(");
  assert.ok(resolve > 0 && media > resolve && boundary > resolve, "product is resolved first");
  assert.ok(src.includes("assistedPackageKey: assistedContext?.packageKey ?? null"), "the signed context supplies the key");
  assert.ok(src.includes("readActiveAssistedPublishingContext(req.cookies)"), "context comes from the verified cookie");
  assert.ok(!/searchParams|nextUrl|req\.url/.test(src.slice(resolve, resolve + 1500)), "no URL input to the product decision");
  assert.ok(!/["'`]plan["'`]/.test(src.slice(resolve, media)), "no plan parameter feeds the resolver");
});
check("wiring: the cookie's packageKey is stamped from the SERVER-resolved product (open-application + custody), never a raw client key", () => {
  const open = raw("app/api/admin/sales-preview/open-application/route.ts");
  const custody = raw("app/api/admin/sales-preview/custody/route.ts");
  assert.ok(open.includes("resolveStaffBusinessPackage(") && open.includes("packageKey,"), "open-application stamps the resolved key");
  assert.ok(custody.includes("resolveStaffBusinessPackage(") && custody.includes("packageKey,"), "custody re-mint stamps the resolved key (live key preserved)");
  assert.ok(custody.includes("livePackageKey: liveSameScope ? live!.packageKey : null"), "a re-mint that only binds the row cannot drop Full");
});
check("client: the staff custody plan wins over the URL marker (UX state follows server truth)", () => {
  const hook = raw("app/lib/quickBusiness/useIsQuickBusinessPlan.ts");
  const staffQuick = hook.indexOf('staffPlan === "quick"');
  const staffFull = hook.indexOf('staffPlan === "full"');
  const urlQuick = hook.lastIndexOf("urlQuick");
  assert.ok(staffQuick > 0 && staffFull > staffQuick && urlQuick > staffFull, "staff branches precede the URL fallback");
  const app = raw("app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx");
  assert.ok(app.includes('useIsQuickBusinessPlan("servicios")'), "the application reads it through the shared hook");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nverify-servicios-quick-package-signal-01: all checks passed");
