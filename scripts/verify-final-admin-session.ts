/**
 * FINAL CLOSEOUT (golden-survivor port) - publication-write Admin routes and money/lifecycle server actions must
 * re-verify admin IDENTITY, not just the coarse unsigned `leonix_admin=1` marker (a raw HTTP client can send that
 * cookie). Also the LOCKOUT PROOF: an owner who logs in through golden's current login routes gets a session that
 * `isVerifiedAdminSession` accepts - executed against the REAL login route handler and the REAL resolver (harness
 * stubs only for Supabase / next/headers).
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-final-admin-session.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

import { __reset, __seed, __setAuthUsers, __setCookies } from "./lib/harnessControls";

const failures: string[] = [];
async function check(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/** Golden paths in this port's scope that the source branch moved to the verified session. */
const ROUTES = [
  "app/api/admin/autos/listings/[id]/route.ts",
  "app/api/admin/clasificados/listings/ai-review/bulk/route.ts",
  "app/api/admin/clasificados/listings/[id]/ai-review/route.ts",
  "app/api/admin/clasificados/listings/[id]/route.ts",
  "app/api/admin/empleos/listings/moderate/route.ts",
  "app/api/admin/empleos/listings/[id]/route.ts",
  "app/api/admin/empleos/listings/route.ts",
  "app/api/admin/restaurantes/listings/[id]/route.ts",
  "app/api/admin/servicios/listings/[id]/route.ts",
  "app/api/admin/viajes/listings/[id]/route.ts",
];
const ACTIONS = [
  "app/admin/_lib/leonixAdminGate.ts",
  "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts",
  "app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts",
  "app/admin/(dashboard)/workspace/clasificados/comida-local/actions.ts",
  "app/admin/(dashboard)/workspace/package-entitlements/actions.ts",
  "app/admin/(dashboard)/workspace/promo-codes/actions.ts",
];

type CookieJar = { get: (name: string) => { value?: string } | undefined };
function jarOf(entries: Record<string, string>): CookieJar {
  return { get: (name) => (name in entries ? { value: entries[name] } : undefined) };
}
/** Collects what a login route / cookie writer sets, as a browser would keep it (maxAge 0 = cleared). */
function cookieSink() {
  const kept: Record<string, string> = {};
  return {
    kept,
    res: {
      cookies: {
        set: (name: string, value: string, opts: Record<string, unknown>) => {
          if (opts?.maxAge === 0 || value === "") delete kept[name];
          else kept[name] = value;
        },
      },
    },
  };
}

async function main() {
  await check("publication-write routes / actions use the identity-verified session, never the bare cookie marker", () => {
    for (const rel of [...ROUTES, ...ACTIONS]) {
      const s = raw(rel);
      // The general admin gate (leonixAdminGate) uses the identity-only variant; its role check follows it.
      assert.match(s, /is(?:Identity)?VerifiedAdminSession\(/, `${rel} must call an identity-verified admin session helper`);
      assert.doesNotMatch(s, /requireAdminCookie\(/, `${rel} must not gate on requireAdminCookie alone`);
      assert.doesNotMatch(s, /get\("leonix_admin"\)\?\.value !== "1"/, `${rel} must not gate on the raw cookie value`);
    }
  });

  await check("the helper delegates to the staff/bootstrap identity resolver and fails closed", () => {
    const s = raw("app/admin/_lib/adminVerifiedSession.ts");
    assert.match(s, /resolveSalesWorkspaceAccess\(jar\)/);
    assert.match(s, /catch\s*\{\s*return false;/);
    assert.match(s, /access\.ok === true/);
  });

  const { isVerifiedAdminSession } = await import("../app/admin/_lib/adminVerifiedSession");
  const session = await import("../app/lib/supabase/adminSession");
  const submit = await import("../app/admin/login/submit/route");

  async function passwordLogin(password: string): Promise<{ location: string | null; cookies: Record<string, string> }> {
    const fd = new FormData();
    fd.set("password", password);
    const req = new Request("http://harness.invalid/admin/login/submit", { method: "POST", body: fd });
    const res = await submit.POST(req as never);
    const cookies: Record<string, string> = {};
    for (const c of res.cookies.getAll()) if (c.value) cookies[c.name] = c.value;
    return { location: res.headers.get("location"), cookies };
  }

  // ── LOCKOUT PROOF 1: owner password (bootstrap) login ──────────────────────────────────────────────
  await check("OWNER password login (real /admin/login/submit) yields a session isVerifiedAdminSession ACCEPTS", async () => {
    __reset();
    process.env.ADMIN_PASSWORD = "owner-pass-harness";
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = "harness-bootstrap-secret-0123456789";
    const out = await passwordLogin("owner-pass-harness");
    assert.ok(out.location && new URL(out.location).pathname === "/admin", `redirected to ${out.location}`);
    assert.equal(out.cookies.leonix_admin, "1");
    assert.ok(out.cookies.leonix_admin_bootstrap, "signed bootstrap token issued");
    assert.equal(await isVerifiedAdminSession(jarOf(out.cookies)), true);
  });
  await check("no lockout window: without ADMIN_BOOTSTRAP_SESSION_SECRET the password login itself fails closed (never a session the gate would reject)", async () => {
    __reset();
    process.env.ADMIN_PASSWORD = "owner-pass-harness";
    delete process.env.ADMIN_BOOTSTRAP_SESSION_SECRET;
    const out = await passwordLogin("owner-pass-harness");
    assert.match(String(out.location), /error=bootstrap_unavailable/);
    assert.equal(out.cookies.leonix_admin, undefined);
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = "harness-bootstrap-secret-0123456789";
  });
  await check("forged cookies are refused: bare leonix_admin=1, legacy bootstrap '1', wrong-secret token", async () => {
    __reset();
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = "harness-bootstrap-secret-0123456789";
    assert.equal(await isVerifiedAdminSession(jarOf({ leonix_admin: "1" })), false);
    assert.equal(await isVerifiedAdminSession(jarOf({ leonix_admin: "1", leonix_admin_bootstrap: "1" })), false);
    const now = Date.now();
    assert.equal(
      await isVerifiedAdminSession(jarOf({ leonix_admin: "1", leonix_admin_bootstrap: `${now - 1000}.${now + 60_000}.${"ab".repeat(32)}` })),
      false,
    );
    assert.equal(await isVerifiedAdminSession(jarOf({})), false);
  });

  // ── LOCKOUT PROOF 2: owner / staff email login (cookies exactly as /admin/login/auth sets them) ────
  const OWNER_ID = "00000000-0000-4000-8000-00000000a001";
  const seedRoster = (role: string, active = true) => {
    __reset();
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = "harness-bootstrap-secret-0123456789";
    __setAuthUsers([{ id: OWNER_ID, email: "owner@leonix.test" }]);
    __seed("admin_team_members", [
      { id: "r1", email: "owner@leonix.test", display_name: "Owner", role, is_active: active, auth_user_id: OWNER_ID },
    ]);
  };
  const emailLoginCookies = () => {
    const sink = cookieSink();
    session.applyLeonixAdminSessionCookies(sink.res, { operatorEmail: "owner@leonix.test", authUserId: OWNER_ID, bootstrap: false });
    return sink.kept;
  };
  await check("OWNER email login (super_admin roster row linked to the Auth user) yields a verified session", async () => {
    seedRoster("super_admin");
    const c = emailLoginCookies();
    assert.equal(c.leonix_admin, "1");
    assert.equal(await isVerifiedAdminSession(jarOf(c)), true);
  });
  await check("sales_manager / sales_rep staff sessions verify; inactive roster, unknown Auth user, mismatched email deny", async () => {
    for (const role of ["sales_manager", "sales_rep"]) {
      seedRoster(role);
      assert.equal(await isVerifiedAdminSession(jarOf(emailLoginCookies())), true, role);
    }
    seedRoster("super_admin", false);
    assert.equal(await isVerifiedAdminSession(jarOf(emailLoginCookies())), false, "inactive");
    seedRoster("super_admin");
    __setAuthUsers([]);
    assert.equal(await isVerifiedAdminSession(jarOf(emailLoginCookies())), false, "auth user gone");
    seedRoster("super_admin");
    const c = { ...emailLoginCookies(), leonix_admin_operator_email: "someone.else@leonix.test" };
    assert.equal(await isVerifiedAdminSession(jarOf(c)), false, "email mismatch");
  });
  await check("RESIDUAL (documented, not a regression for the owner): a content_manager roster login is NOT verified for publication writes", async () => {
    seedRoster("content_manager");
    assert.equal(await isVerifiedAdminSession(jarOf(emailLoginCookies())), false);
  });

  await check("content_manager keeps CMS access: identity-verified for the general gate (role check follows), forged cookie refused", async () => {
    const { isIdentityVerifiedAdminSession } = await import("../app/admin/_lib/adminVerifiedSession");
    seedRoster("content_manager");
    assert.equal(await isIdentityVerifiedAdminSession(jarOf(emailLoginCookies())), true);
    assert.equal(await isIdentityVerifiedAdminSession(jarOf({ leonix_admin: "1" })), false);
  });

  // ── Executed route: the gate runs before any read / write ───────────────────────────────────────
  await check("servicios lifecycle route: bare cookie => 401 before any read; owner bootstrap session passes the gate", async () => {
    __reset();
    process.env.ADMIN_PASSWORD = "owner-pass-harness";
    process.env.ADMIN_BOOTSTRAP_SESSION_SECRET = "harness-bootstrap-secret-0123456789";
    const route = await import("../app/api/admin/servicios/listings/[id]/route");
    const call = () =>
      route.PATCH(new Request("http://harness.invalid/x", { method: "PATCH", body: JSON.stringify({ action: "unsuspend" }) }), {
        params: Promise.resolve({ id: "00000000-0000-4000-8000-000000000999" }),
      });
    __setCookies({ leonix_admin: "1" });
    assert.equal((await call()).status, 401);
    const login = await passwordLogin("owner-pass-harness");
    __setCookies(login.cookies);
    const res = await call();
    assert.notEqual(res.status, 401, "owner session must pass the auth gate");
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

void main();
