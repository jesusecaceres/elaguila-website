/**
 * LEONIX SERVICIOS STAFF GATEWAY — Recovery slice 1.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-servicios-staff-gateway-01.ts
 *
 * Proves (executed code + source contracts):
 *  1. "No active custody" cannot open a public application (fail-open `?? descriptor.intakePath` is gone).
 *  2. Successful Servicios custody navigates to `/publicar/negocio-rapido/servicios` (existing Quick app).
 *  3. That route is not `/clasificados/publicar/servicios` (checkpoint redirect) and is not `/login`.
 *  4. A server-verified assisted cookie makes PublishAuthGateLayout skip the customer login.
 *  5. Unrelated customer session conflict still fails closed (409) on the canonical Servicios save.
 *  6. Normal customer login copy ("Accede para publicar") is unchanged for unauthenticated traffic.
 *
 * No database, no network, no live Stripe, no migration, no Vercel.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as React from "react";
import { createElement, type ReactElement } from "react";
(globalThis as unknown as { React: unknown }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { __reset, __seed, __setAuthUsers, __rows } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { __setBearerTokens } from "./lib/stubs/supabaseJs.mjs";

import { createAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import { buildPublishLoginHref } from "../app/lib/auth/publishLoginRedirect";
import { QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";
import { resolveAssistedSessionConflict } from "../app/lib/sales/assistedSameRowBinding";
import {
  BEGIN_CLIENT_DRAFT_HREF,
  FUTURE_STAFF_GATEWAY_EXCLUDED,
  FUTURE_STAFF_GATEWAY_FAMILIES,
  SERVICIOS_STAFF_INTAKE_PATH,
  isPublicCustomerLoginPath,
  resolveStaffNavigationFromCustodyPost,
  resolveStaffOpenIntakeNavigation,
} from "../app/lib/sales/staffServiciosGateway";

const ASSISTED_SECRET = "assisted-secret-harness-only";
process.env.ASSISTED_PUBLISHING_SESSION_SECRET = ASSISTED_SECRET;

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function checkAsync(name: string, fn: () => Promise<void>) {
  checks += 1;
  try {
    await fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
}

const STAFF_EMAIL = "sales@leonix.test";
const STAFF_AUTH = "00000000-0000-4000-8000-000000000staff";
const ROSTER_ID = "roster-1";
const BIZ = "biz-1";
const STRANGER = "00000000-0000-4000-8000-0000000strange";

function signInAsSalesStaff(): void {
  __setCookies({ leonix_admin: "1", leonix_admin_operator_email: STAFF_EMAIL, leonix_admin_auth_user_id: STAFF_AUTH });
  __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
  __seed("admin_team_members", [{ id: ROSTER_ID, email: STAFF_EMAIL, display_name: "Sales", role: "super_admin", is_active: true, auth_user_id: STAFF_AUTH }]);
}
function seedBusiness(): void {
  __seed("businesses", [
    { id: BIZ, display_name: "Taquería Sol", public_name: "Taquería Sol", legal_name: null, normalized_name: "taqueria sol", slug: "taqueria-sol", broad_business_type: "restaurant", status: "active", creation_source: "staff_assisted", created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z" },
  ]);
}
function cookieFrom(res: { cookies: { get: (n: string) => { value: string } | undefined } }, name: string): string | undefined {
  return res.cookies.get(name)?.value;
}
function makeRequest(body: unknown, cookieJar: Record<string, string> = {}, headers: Record<string, string> = {}, url = "http://harness.invalid/api") {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    json: async () => body,
    text: async () => JSON.stringify(body ?? {}),
    headers: { get: (name: string) => h.get(name.toLowerCase()) ?? null },
    cookies: { get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined) },
    nextUrl: new URL(url),
  } as never;
}

async function main() {
  // ===========================================================================
  // A — PURE NAVIGATION AUTHORITY (the fail-open is executed, not described)
  // ===========================================================================
  check("A1: no live custody cannot open any application", () => {
    const nav = resolveStaffOpenIntakeNavigation({ selectedCategory: "servicios", liveCustody: null });
    assert.equal(nav.allowed, false);
    assert.equal(nav.allowed === false && nav.reason, "no_active_custody");
  });
  check("A2: a live custody for another category cannot open Servicios", () => {
    const nav = resolveStaffOpenIntakeNavigation({
      selectedCategory: "servicios",
      liveCustody: { category: "restaurantes", intakePath: SERVICIOS_STAFF_INTAKE_PATH },
    });
    assert.equal(nav.allowed, false);
    assert.equal(nav.allowed === false && nav.reason, "category_mismatch");
  });
  check("A3: a login path is refused even if labeled as custody", () => {
    const nav = resolveStaffOpenIntakeNavigation({
      selectedCategory: "servicios",
      liveCustody: { category: "servicios", intakePath: "/login?mode=post&redirect=%2Fpublicar" },
    });
    assert.equal(nav.allowed, false);
    assert.equal(nav.allowed === false && nav.reason, "public_login_blocked");
    assert.equal(isPublicCustomerLoginPath("/login?mode=post&lang=es&redirect=%2Fpublicar%2Fnegocio-rapido%2Fservicios"), true);
  });
  check("A4: the clasificados checkpoint path is the WRONG application and is refused", () => {
    const nav = resolveStaffOpenIntakeNavigation({
      selectedCategory: "servicios",
      liveCustody: { category: "servicios", intakePath: "/clasificados/publicar/servicios" },
    });
    assert.equal(nav.allowed, false);
    assert.equal(nav.allowed === false && nav.reason, "wrong_application");
  });
  check("A5: successful custody navigates to the existing Quick Servicios application, same tab", () => {
    const nav = resolveStaffNavigationFromCustodyPost({
      ok: true,
      category: "servicios",
      intakePath: SERVICIOS_STAFF_INTAKE_PATH,
    });
    assert.equal(nav.allowed, true);
    if (nav.allowed) {
      assert.equal(nav.href, "/publicar/negocio-rapido/servicios");
      assert.equal(nav.sameTab, true);
      assert.equal(isPublicCustomerLoginPath(nav.href), false);
    }
  });
  check("A6: a failed custody POST cannot navigate", () => {
    const nav = resolveStaffNavigationFromCustodyPost({ ok: false, intakePath: SERVICIOS_STAFF_INTAKE_PATH, category: "servicios" });
    assert.equal(nav.allowed, false);
    assert.equal(nav.allowed === false && nav.reason, "no_active_custody");
  });
  check("A7: map + helper agree the staff intake is the Quick route", () => {
    assert.equal(QUICK_SALES_CATEGORY_MAP.servicios.intakePath, SERVICIOS_STAFF_INTAKE_PATH);
    assert.equal(SERVICIOS_STAFF_INTAKE_PATH, "/publicar/negocio-rapido/servicios");
  });
  check("A8: future eight-family scope is recorded and Viajes/Iglesias/Recursos stay excluded", () => {
    assert.deepEqual([...FUTURE_STAFF_GATEWAY_FAMILIES], [
      "rentas",
      "empleos",
      "autos-privado",
      "servicios",
      "restaurantes",
      "comida-local",
      "autos-dealer",
      "bienes-raices-negocio",
    ]);
    assert.deepEqual([...FUTURE_STAFF_GATEWAY_EXCLUDED], ["viajes", "iglesias", "recursos"]);
    assert.equal(FUTURE_STAFF_GATEWAY_FAMILIES.includes("servicios"), true);
  });
  check("A9: begin-client-draft reuses the proven canvass new-business path", () => {
    assert.equal(BEGIN_CLIENT_DRAFT_HREF, "/admin/businesses/canvass?intent=create_listing");
  });

  // ===========================================================================
  // B — WORKSPACE CLIENT: fail-open gone; no public href without custody
  // ===========================================================================
  const clientSrc = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
  check("B1: the fail-open `status?.intakePath ?? descriptor.intakePath` is gone", () => {
    assert.equal(clientSrc.includes("?? descriptor.intakePath"), false);
    assert.equal(/href=\{status\?\.intakePath/.test(clientSrc), false);
    assert.ok(clientSrc.includes("resolveStaffOpenIntakeNavigation"));
  });
  check("B2: Open Services never uses target=_blank", () => {
    assert.equal(/data-staff-open-intake[\s\S]{0,400}target="_blank"/.test(clientSrc), false);
    assert.ok(clientSrc.includes("window.location.assign(nav.href)"), "Servicios primary action navigates same-tab after custody");
  });
  check("B3: primary action posts custody then navigates only if the helper allows it", () => {
    assert.ok(clientSrc.includes("openServiciosWithCustody"));
    assert.ok(clientSrc.includes("resolveStaffNavigationFromCustodyPost"));
    assert.ok(clientSrc.includes('if (!nav.allowed)'));
    assert.ok(clientSrc.includes("window.location.assign(nav.href)"));
    const assignIdx = clientSrc.indexOf("window.location.assign(nav.href)");
    const refuseIdx = clientSrc.indexOf("if (!nav.allowed)");
    assert.ok(refuseIdx > -1 && assignIdx > refuseIdx, "navigation is after the custody gate");
  });
  check("B4: initial render with no custody has no public application href", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
      QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
    };
    const html = renderToStaticMarkup(createElement(QuickSalesWorkspaceClient, { actorEmail: STAFF_EMAIL }));
    assert.ok(html.includes("Sin custodia activa / No active custody"));
    assert.equal(html.includes('href="/clasificados/publicar/servicios"'), false, "checkpoint path must not be a live href");
    assert.equal(html.includes('href="/publicar/negocio-rapido/servicios"'), false, "Quick path must not be a live href without custody");
    assert.equal(html.includes('href="/login'), false);
    assert.ok(html.includes("data-servicios-staff-primary"));
    assert.ok(html.includes("data-begin-client-draft"));
    assert.ok(html.includes(`href="${BEGIN_CLIENT_DRAFT_HREF}"`));
  });

  // ===========================================================================
  // C — THE TWO ROUTES ARE NOT INTERCHANGEABLE; Quick consumes the assisted gate
  // ===========================================================================
  check("C1: /clasificados/publicar/servicios still redirects to the checkpoint — not a fillable app", () => {
    const src = read("app/(site)/clasificados/publicar/servicios/page.tsx");
    assert.ok(src.includes("redirect("));
    assert.ok(src.includes("/clasificados/publicar/servicios/checkpoint"));
  });
  check("C2: the Quick Servicios page exists and has no private auth layout of its own", () => {
    const page = read("app/(site)/publicar/negocio-rapido/[category]/page.tsx");
    assert.ok(page.includes("QuickBusinessIntakeClient"));
    const layout = read("app/(site)/publicar/layout.tsx");
    assert.ok(layout.includes("PublishAuthGateLayout"));
  });
  check("C3: Quick adapter still hands off to the existing Servicios preview (assisted save lives there)", () => {
    const adapter = read("app/(site)/publicar/negocio-rapido/_adapters/serviciosQuickBusinessAdapter.ts");
    assert.ok(adapter.includes("/clasificados/publicar/servicios/preview"));
    const preview = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
    assert.ok(preview.includes("useAssistedPublishingUi()"));
    assert.ok(preview.includes("assistedAction"));
  });
  check("C4: customer login copy for publish mode is still Accede para publicar (unchanged customer path)", () => {
    const login = read("app/(site)/login/page.tsx");
    assert.ok(login.includes('title: "Accede para publicar"'));
    const href = buildPublishLoginHref("/publicar/negocio-rapido/servicios", "es");
    assert.ok(href.startsWith("/login?mode=post"));
    assert.equal(decodeURIComponent(new URL(href, "http://x").searchParams.get("redirect") ?? ""), "/publicar/negocio-rapido/servicios");
  });

  await checkAsync("C5: PublishAuthGateLayout with assisted cookie is authed; without it, customer path is login", async () => {
    const token = createAssistedPublishingTokenWithSecret(
      { businessId: BIZ, category: "servicios", rosterId: ROSTER_ID, authUserId: STAFF_AUTH, assistedAction: "save_for_client" },
      ASSISTED_SECRET,
    )!;
    __reset();
    __setCookies({ leonix_assisted_publish: token });
    const { PublishAuthGateLayout } = await import("../app/components/auth/PublishAuthGateLayout");
    const tree = (await PublishAuthGateLayout({ children: createElement("div") })) as ReactElement<{ children: ReactElement<{ assisted: unknown }> }>;
    const assisted = tree.props.children.props.assisted as { businessId: string; category: string };
    assert.deepEqual({ businessId: assisted.businessId, category: assisted.category }, { businessId: BIZ, category: "servicios" });
    __setCookies({});
    const none = (await PublishAuthGateLayout({ children: createElement("div") })) as ReactElement<{ children: ReactElement<{ assisted: unknown }> }>;
    assert.equal(none.props.children.props.assisted, null);
    const gate = read("app/components/auth/PublishAuthGate.tsx");
    assert.ok(gate.includes('if (assisted) {') && gate.includes('setStatus("authed");'));
    assert.ok(gate.includes("window.location.replace(loginHref)"), "unassisted traffic still redirects to customer login");
  });

  // ===========================================================================
  // D — CUSTODY ROUTE + SESSION CONFLICT (executed against the real handlers)
  // ===========================================================================
  const custody = (await import("../app/api/admin/sales-preview/custody/route")) as unknown as {
    POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }>;
    GET: (r: never) => Promise<Response>;
  };
  const servicios = (await import("../app/api/clasificados/servicios/publish/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };

  await checkAsync("D1: authorized staff POST custody for Servicios returns the Quick intake path and sets the cookie", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const res = await custody.POST(makeRequest({ category: "servicios", businessId: BIZ }));
    const json = (await res.json()) as { ok?: boolean; intakePath?: string; category?: string; error?: string };
    assert.equal(res.status, 200, JSON.stringify(json));
    assert.equal(json.ok, true);
    assert.equal(json.category, "servicios");
    assert.equal(json.intakePath, "/publicar/negocio-rapido/servicios");
    const nav = resolveStaffNavigationFromCustodyPost(json);
    assert.equal(nav.allowed, true);
    if (nav.allowed) assert.equal(nav.href, "/publicar/negocio-rapido/servicios");
    assert.ok(cookieFrom(res, "leonix_assisted_publish"), "custody cookie is issued before navigation");
  });

  await checkAsync("D2: GET custody after mint reports the same Quick intake path", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "servicios", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    assert.ok(token, "minted cookie");
    const got = await custody.GET(makeRequest({}, { leonix_assisted_publish: token! }));
    const json = (await got.json()) as { ok?: boolean; context?: { intakePath?: string; category?: string } | null };
    assert.equal(got.status, 200);
    assert.ok(json.context, "server-confirmed custody exists before any staff navigation");
    assert.equal(json.context!.category, "servicios");
    assert.equal(json.context!.intakePath, "/publicar/negocio-rapido/servicios");
  });

  await checkAsync("D3: unrelated customer session conflict still fails closed on Servicios save", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    __setBearerTokens({ "stranger-token": STRANGER });
    const minted = await custody.POST(makeRequest({ category: "servicios", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    assert.ok(token);
    const res = await servicios.POST(
      makeRequest(
        { assistedAction: "save_for_client", lang: "es", state: { businessName: "X" } },
        { leonix_assisted_publish: token! },
        { authorization: "Bearer stranger-token" },
      ),
    );
    const json = (await res.json()) as { error?: string };
    assert.equal(res.status, 409, JSON.stringify(json));
    assert.equal(json.error, "assisted_session_conflict");
    assert.equal(__rows("servicios_public_listings").length, 0, "nothing was written");
  });

  check("D4: the session-conflict rule itself still fails closed for owner-null + any site session", () => {
    const b = resolveAssistedSessionConflict({ assistedActive: true, contextClientUserId: null, customerUserId: STRANGER });
    assert.deepEqual(b, { ok: false, error: "assisted_session_conflict", status: 409 });
    assert.equal(resolveAssistedSessionConflict({ assistedActive: true, customerUserId: null }), null);
  });

  console.log(`\n${passed.length}/${checks} checks passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-servicios-staff-gateway-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});
