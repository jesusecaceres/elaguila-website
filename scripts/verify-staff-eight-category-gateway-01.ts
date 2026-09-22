/**
 * LEONIX STAFF GATEWAY — Gate 2 eight-category doorway.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-staff-eight-category-gateway-01.ts
 *
 * Proves:
 *  1. The registry contains exactly the eight required families and excludes Viajes/Iglesias/Recursos.
 *  2. Every family maps to a fillable canonical application, never a hub/checkpoint/adapter.
 *  3. $249/$399 appear only on the four business pair categories.
 *  4. No live custody ⇒ no public application href.
 *  5. Successful custody POST navigates same-tab to that family's canonical path.
 *  6. Autos Dealer and Bienes mint owner-null custody without a client user id.
 *  7. Autos assisted save without clientUserId writes owner_user_id null.
 *
 * No database, no network, no live Stripe, no migration apply, no Vercel.
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

import { createAssistedPublishingTokenWithSecret, verifyAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import { QUICK_SALES_CATEGORIES, QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";
import {
  BEGIN_CLIENT_DRAFT_HREF,
  STAFF_GATEWAY_EXCLUDED,
  STAFF_GATEWAY_FAMILIES,
  STAFF_INTAKE_FORBIDDEN_PATHS,
  resolveStaffNavigationFromCustodyPost,
  resolveStaffOpenIntakeNavigation,
} from "../app/lib/sales/staffServiciosGateway";
import {
  STAFF_BUSINESS_PAIR_CATEGORIES,
  STAFF_BUSINESS_PAIR_EXCLUDED_CATEGORIES,
  STAFF_CATEGORY_PRICED_PACKAGE_KEYS,
  resolveStaffBusinessPackage,
  staffBusinessOffer,
  staffCategoryPricedPackageKey,
} from "../app/lib/sales/staffBusinessProduct";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";

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

const CANONICAL_INTAKE: Record<(typeof QUICK_SALES_CATEGORIES)[number], string> = {
  rentas: "/clasificados/publicar/rentas/privado",
  empleos: "/publicar/empleos/quick",
  "autos-privado": "/publicar/autos/privado",
  servicios: "/publicar/servicios",
  restaurantes: "/publicar/restaurantes",
  "comida-local": "/publicar/comida-local",
  autos: "/publicar/autos/negocios",
  "bienes-raices": "/clasificados/publicar/bienes-raices/negocio",
};

async function main() {
  check("A1: registry is exactly the eight required families in the recorded order", () => {
    assert.deepEqual([...QUICK_SALES_CATEGORIES], [...STAFF_GATEWAY_FAMILIES]);
    assert.deepEqual([...QUICK_SALES_CATEGORIES], [
      "rentas",
      "empleos",
      "autos-privado",
      "servicios",
      "restaurantes",
      "comida-local",
      "autos",
      "bienes-raices",
    ]);
    assert.deepEqual([...STAFF_GATEWAY_EXCLUDED], ["viajes", "iglesias", "recursos"]);
    for (const excluded of STAFF_GATEWAY_EXCLUDED) {
      assert.equal((QUICK_SALES_CATEGORIES as readonly string[]).includes(excluded), false);
    }
  });

  check("A2: every family maps to the fillable canonical application, never a hub/checkpoint/adapter", () => {
    for (const key of QUICK_SALES_CATEGORIES) {
      const d = QUICK_SALES_CATEGORY_MAP[key];
      assert.equal(d.intakePath, CANONICAL_INTAKE[key], `${key} intake`);
      assert.equal(d.requiresClientUserId, false, `${key} is owner-null organizational custody`);
      assert.ok(d.saveEndpoint.startsWith("/api/"), `${key} save endpoint`);
      const forbidden = STAFF_INTAKE_FORBIDDEN_PATHS[key];
      assert.ok(forbidden.length > 0, `${key} records the paths staff must not open`);
      assert.equal(forbidden.includes(d.intakePath), false, `${key} canonical path is not forbidden`);
      const nav = resolveStaffOpenIntakeNavigation({
        selectedCategory: key,
        liveCustody: { category: key, intakePath: forbidden[0]! },
      });
      assert.equal(nav.allowed, false);
      assert.equal(nav.allowed === false && nav.reason, "wrong_application", `${key} refuses ${forbidden[0]}`);
    }
  });

  check("A3: $249/$399 exist only on the four business pair categories", () => {
    assert.deepEqual([...STAFF_BUSINESS_PAIR_CATEGORIES], ["servicios", "restaurantes", "autos", "bienes-raices"]);
    assert.deepEqual([...STAFF_BUSINESS_PAIR_EXCLUDED_CATEGORIES], ["rentas", "empleos", "autos-privado", "comida-local"]);
    for (const cat of STAFF_BUSINESS_PAIR_CATEGORIES) {
      const quick = staffBusinessOffer(cat, "quick")!;
      const full = staffBusinessOffer(cat, "full")!;
      assert.equal(quick.priceCents, 24900, `${cat} Quick is $249`);
      assert.equal(full.priceCents, 39900, `${cat} Full is $399`);
      assert.equal(quick.packageKey, BUSINESS_CATEGORY_PACKAGE_PAIR[cat].simple);
      assert.equal(full.packageKey, BUSINESS_CATEGORY_PACKAGE_PAIR[cat].full);
    }
    for (const cat of STAFF_BUSINESS_PAIR_EXCLUDED_CATEGORIES) {
      assert.equal(staffBusinessOffer(cat, "quick"), null, `${cat} must not sell $249 Quick`);
      assert.equal(staffBusinessOffer(cat, "full"), null, `${cat} must not sell $399 Full`);
      const key = staffCategoryPricedPackageKey(cat);
      assert.ok(key, `${cat} stamps its own package`);
      assert.equal(key, STAFF_CATEGORY_PRICED_PACKAGE_KEYS[cat]);
      const def = getRevenuePackageDefinition(key!);
      assert.ok(def, `${key} exists in the revenue matrix`);
      assert.notEqual(def!.priceCents, 24900);
      assert.notEqual(def!.priceCents, 39900);
      const resolved = resolveStaffBusinessPackage({ category: cat });
      assert.equal(resolved.ok, true);
      if (resolved.ok) {
        assert.equal(resolved.plan, null);
        assert.equal(resolved.packageKey, key);
      }
    }
  });

  check("A4: a forged $249 package on a category-priced family is refused", () => {
    const forged = resolveStaffBusinessPackage({
      category: "rentas",
      requestedPackageKey: "servicios_quick_monthly",
    });
    assert.equal(forged.ok, false);
  });

  check("A5: no FUTURE_STAFF_GATEWAY placeholders remain in the doorway modules", () => {
    const gateway = read("app/lib/sales/staffServiciosGateway.ts");
    const categories = read("app/lib/sales/quickSalesCategories.ts");
    const client = read("app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx");
    assert.equal(gateway.includes("FUTURE_STAFF_GATEWAY"), false);
    assert.equal(categories.includes("FUTURE_STAFF_GATEWAY"), false);
    assert.equal(client.includes("FUTURE_STAFF_GATEWAY"), false);
    assert.equal(client.includes("openServiciosWithCustody"), false);
    assert.ok(client.includes("openIntakeWithCustody"));
  });

  check("A6: initial cockpit render has no public application href and lists all eight families", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
      QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
    };
    const html = renderToStaticMarkup(createElement(QuickSalesWorkspaceClient, { actorEmail: STAFF_EMAIL }));
    assert.ok(html.includes("Sin custodia activa / No active custody"));
    for (const key of QUICK_SALES_CATEGORIES) {
      const d = QUICK_SALES_CATEGORY_MAP[key];
      assert.ok(html.includes(d.labelEs), `cockpit lists ${d.labelEs}`);
      assert.equal(html.includes(`href="${d.intakePath}"`), false, `${key} must not be a live href without custody`);
    }
    assert.equal(html.includes('href="/login'), false);
    assert.ok(html.includes("data-staff-business-plan"));
    assert.ok(html.includes(`href="${BEGIN_CLIENT_DRAFT_HREF}"`));
    assert.equal(html.includes("$249") || html.includes("$249/mes") || html.includes("249"), true);
  });

  check("A7: category-priced families do not render the Quick/Full $249/$399 picker", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { QuickSalesWorkspaceClient } = require("../app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient") as {
      QuickSalesWorkspaceClient: (p: Record<string, unknown>) => ReactElement;
    };
    const html = renderToStaticMarkup(
      createElement(QuickSalesWorkspaceClient, { actorEmail: STAFF_EMAIL, initialCategory: "rentas" }),
    );
    assert.equal(html.includes("data-staff-business-plan"), false, "Rentas must not show the business pair picker");
    assert.ok(html.includes("Rentas"));
  });

  const custody = (await import("../app/api/admin/sales-preview/custody/route")) as unknown as {
    POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }>;
  };

  for (const category of QUICK_SALES_CATEGORIES) {
    await checkAsync(`B1[${category}]: custody without clientUserId returns the canonical fill path and stamps the package`, async () => {
      __reset();
      signInAsSalesStaff();
      seedBusiness();
      const res = await custody.POST(makeRequest({ category, businessId: BIZ }));
      const json = (await res.json()) as { ok?: boolean; intakePath?: string; category?: string; packageKey?: string; plan?: string | null; error?: string };
      assert.equal(res.status, 200, JSON.stringify(json));
      assert.equal(json.ok, true);
      assert.equal(json.category, category);
      const path = String(json.intakePath ?? "").split("?")[0];
      assert.equal(path, CANONICAL_INTAKE[category]);
      const nav = resolveStaffNavigationFromCustodyPost(json);
      assert.equal(nav.allowed, true, JSON.stringify(nav));
      if (nav.allowed) {
        assert.equal(nav.sameTab, true);
        assert.equal(nav.href.split("?")[0], CANONICAL_INTAKE[category]);
      }
      const token = cookieFrom(res, "leonix_assisted_publish");
      assert.ok(token, "custody cookie is issued");
      const ctx = verifyAssistedPublishingTokenWithSecret(token!, ASSISTED_SECRET);
      assert.equal(ctx?.category, category);
      if (STAFF_BUSINESS_PAIR_CATEGORIES.includes(category as (typeof STAFF_BUSINESS_PAIR_CATEGORIES)[number])) {
        assert.equal(json.plan, "quick");
        assert.equal(json.packageKey, BUSINESS_CATEGORY_PACKAGE_PAIR[category].simple);
        assert.equal(ctx?.packageKey, BUSINESS_CATEGORY_PACKAGE_PAIR[category].simple);
        assert.ok(String(json.intakePath).includes("plan=quick"));
      } else {
        assert.equal(json.plan ?? null, null);
        assert.equal(json.packageKey, staffCategoryPricedPackageKey(category));
        assert.equal(ctx?.packageKey, staffCategoryPricedPackageKey(category));
        assert.equal(String(json.intakePath).includes("plan=quick"), false);
      }
    });
  }

  await checkAsync("B2: Autos Dealer Full custody uses the SAME dealer application without the Quick marker", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const res = await custody.POST(makeRequest({ category: "autos", businessId: BIZ, plan: "full" }));
    const json = (await res.json()) as { intakePath?: string; packageKey?: string; plan?: string };
    assert.equal(res.status, 200, JSON.stringify(json));
    assert.equal(json.plan, "full");
    assert.equal(json.packageKey, "autos_dealer_monthly");
    assert.equal(json.intakePath, "/publicar/autos/negocios");
  });

  const autos = (await import("../app/api/clasificados/autos/assisted-publish/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };

  await checkAsync("C1: Autos assisted save without clientUserId writes owner_user_id null", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "autos", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    assert.ok(token);
    const res = await autos.POST(
      makeRequest(
        {
          assistedAction: "save_for_client",
          dealerListing: { businessName: "Dealer Uno", city: "San José", autosLane: "negocios" },
        },
        { leonix_assisted_publish: token! },
      ),
    );
    const json = (await res.json()) as { ok?: boolean; mainListingId?: string; error?: string };
    assert.equal(res.status, 200, JSON.stringify(json));
    assert.ok(json.mainListingId);
    const rows = __rows("autos_classifieds_listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.owner_user_id ?? null, null);
    assert.ok(
      __rows("business_listing_links").some((l: Record<string, unknown>) => l.listing_id === json.mainListingId && l.status === "verified"),
    );
  });

  const bienes = (await import("../app/api/clasificados/bienes-raices/negocio/assisted-publish/route")) as unknown as {
    POST: (r: never) => Promise<Response>;
  };

  await checkAsync("C2: Bienes assisted save without clientUserId omits owner_id", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "bienes-raices", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    assert.ok(token);
    const res = await bienes.POST(
      makeRequest(
        {
          assistedAction: "save_for_client",
          listingRow: { title: "Oficina en San José", city: "San José", category: "bienes-raices" },
        },
        { leonix_assisted_publish: token! },
      ),
    );
    const json = (await res.json()) as { ok?: boolean; listingId?: string; error?: string };
    assert.equal(res.status, 200, JSON.stringify(json));
    const rows = __rows("listings") as Record<string, unknown>[];
    assert.equal(rows.length, 1);
    assert.equal(rows[0]!.owner_id ?? null, null);
  });

  await checkAsync("C3: a supplied non-member clientUserId is still refused on Autos", async () => {
    __reset();
    signInAsSalesStaff();
    seedBusiness();
    const minted = await custody.POST(makeRequest({ category: "autos", businessId: BIZ }));
    const token = cookieFrom(minted, "leonix_assisted_publish");
    const res = await autos.POST(
      makeRequest(
        {
          assistedAction: "save_for_client",
          clientUserId: "00000000-0000-4000-8000-00000000client",
          dealerListing: { businessName: "Dealer Uno", autosLane: "negocios" },
        },
        { leonix_assisted_publish: token! },
      ),
    );
    const json = (await res.json()) as { error?: string };
    assert.equal(res.status, 403);
    assert.equal(json.error, "client_not_authorized_for_business");
    assert.equal(__rows("autos_classifieds_listings").length, 0);
  });

  console.log(`\n${passed.length}/${checks} passed`);
  for (const p of passed) console.log(`  OK   ${p}`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-staff-eight-category-gateway-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});
