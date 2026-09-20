/**
 * Gate 14 · Verifier 3 — the SIMPLE customer management surface.
 *
 * Catches: a second dashboard platform, a Full-only module leaking into the Simple doorway, a
 * client-side database mutation, and a missing Simple control.
 *
 * The doctrine this enforces is that the doorway ROUTES into existing canonical actions. It has
 * no state of its own, so anything that looks like a write, a fetch or a commercial decision
 * inside it is a defect.
 *
 * Run: npx tsx scripts/verify-quick-simple-dashboard-03.ts
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { businessAccessCopy, fullAddsList } from "../app/lib/listingPlans/businessAccessCopy";
import { listQuickBusinessDefinitions } from "../app/lib/quickBusiness/quickBusinessRegistry";
import { quickBusinessMyBusinessPath } from "../app/lib/quickBusiness/quickBusinessRoutes";

const ROOT = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), "utf8");
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

let failures = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS  ${name}`);
  } catch (err) {
    failures++;
    console.error(`FAIL  ${name}\n      ${err instanceof Error ? err.message : String(err)}`);
  }
}

const CLIENT = "app/(site)/publicar/negocio-rapido/_components/QuickBusinessMyBusinessClient.tsx";
const PAGE = "app/(site)/publicar/negocio-rapido/mi-negocio/page.tsx";

/**
 * Executable code only. The doorway's own documentation names the Full-only modules it is
 * careful to leave out, so a raw text search would fail on the very comment that explains the
 * rule. What matters is that no Full-only module is RENDERED.
 */
const codeOf = (p: string): string =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

check("the Simple doorway exists and is routed", () => {
  assert.ok(exists(CLIENT), "the Simple doorway client exists");
  assert.ok(exists(PAGE), "the Simple doorway page exists");
  assert.ok(read(PAGE).includes("QuickBusinessMyBusinessClient"), "the page renders the doorway");
  assert.equal(quickBusinessMyBusinessPath("es"), "/publicar/negocio-rapido/mi-negocio?lang=es");
  assert.equal(
    quickBusinessMyBusinessPath("en", "servicios"),
    "/publicar/negocio-rapido/mi-negocio?lang=en&cat=servicios",
  );
});

check("every required Simple control is present", () => {
  const src = codeOf(CLIENT);
  for (const key of [
    "myBusinessView", // VIEW
    "myBusinessEdit", // EDIT
    "myBusinessPause", // PAUSE / REACTIVATE
    "myBusinessEnd", // END / CANCEL
    "myBusinessHelp", // HELP
    "myBusinessBilling", // BILLING (the canonical lifecycle supports it)
  ]) {
    assert.ok(src.includes(key), `the doorway must offer ${key}`);
  }
  assert.ok(src.includes('businessAccessCopy("upgradeCta"'), "the doorway must offer UPGRADE TO FULL");
});

check("no Full-only module appears in the Simple doorway", () => {
  const src = codeOf(CLIENT);
  for (const forbidden of [
    "analytics",
    "Analytics",
    "analiticas",
    "BusinessHub",
    "business-hub",
    "businessHub",
    "concierge",
    "Concierge",
    "leads",
    "growth",
    "Sidebar",
    "Chart",
    "Report",
  ]) {
    assert.ok(!src.includes(forbidden), `the Simple doorway must not surface ${forbidden}`);
  }
});

check("the doorway never mutates data and never calls an API", () => {
  const src = codeOf(CLIENT);
  for (const forbidden of [
    ".from(",
    ".insert(",
    ".update(",
    ".upsert(",
    ".delete(",
    "supabase",
    "Supabase",
    "service_role",
    "fetch(",
    "useEffect",
  ]) {
    assert.ok(!src.includes(forbidden), `the doorway must not use ${forbidden}`);
  }
});

check("the doorway holds no price, no package key and no commercial decision", () => {
  const src = codeOf(CLIENT);
  assert.ok(!/\$\s?\d|priceCents|9900|39900/.test(src), "no price in the Simple doorway");
  assert.ok(!/_monthly|packageKey/.test(src), "no package key in the Simple doorway");
  assert.ok(
    !/decideBusinessAccess|resolveBusinessAccess|businessAccessAllows/.test(src),
    "access decisions belong on the server, never in this client",
  );
});

check("every destination is an existing canonical owner surface from the registry", () => {
  const src = codeOf(CLIENT);
  assert.ok(src.includes("manage.dashboardHref"), "destinations come from the registry manage block");
  assert.ok(src.includes("manage.editNote") && src.includes("manage.endNote"), "wording too");
  for (const def of listQuickBusinessDefinitions()) {
    assert.ok(
      def.manage.dashboardHref.startsWith("/dashboard/"),
      `${def.key} must route into the existing dashboard, not a new surface`,
    );
  }
  // The only non-registry links are the shared help page and the owner's own ad list.
  const hrefs = [...src.matchAll(/withLang\("([^"]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(
    [...new Set(hrefs)].sort(),
    ["/contact", "/dashboard/mis-anuncios"],
    "no new destination may be invented here",
  );
});

check("Full is never advertised as granting a product no package actually grants", () => {
  // `/dashboard/business-tools` is the flagged Business Identity pilot with its own membership
  // model; no package entitlement opens it. Promising "business tools" in the Full pitch would
  // sell a door that stays shut whatever the customer pays — a BLOCKED advertised capability.
  for (const lang of ["es", "en"] as const) {
    const pitch = [businessAccessCopy("fullBody", lang), ...fullAddsList(lang)].join(" ");
    for (const forbidden of [/herramientas de negocio/i, /business tools/i, /business hub/i, /concierge/i]) {
      assert.ok(!forbidden.test(pitch), `${lang} Full copy must not promise ${forbidden.source}`);
    }
    // Category-dependent benefits must say so rather than reading as universal.
    for (const item of fullAddsList(lang)) {
      if (/cupones|coupons|inventario|inventory/i.test(item)) {
        assert.ok(
          /categoría|category/i.test(item),
          `"${item}" is category-dependent and must say so`,
        );
      }
    }
  }
});

check("the upgrade never routes to the public intake, which would start a second listing", () => {
  const src = codeOf(CLIENT);
  // `/publicar/servicios` and friends create a NEW application. Sending a Simple customer there
  // to upgrade is exactly how a second identity gets born. The dashboard reopens the EXISTING
  // application against the existing listing id, and its preview checks out that same id.
  assert.ok(
    !src.includes("standardApplicationPath"),
    "the doorway must never send an existing customer back through the public intake",
  );
  for (const lang of ["es", "en"] as const) {
    assert.ok(
      businessAccessCopy("upgradeWhere", lang).length > 0,
      `${lang} must state where the upgrade happens`,
    );
  }
  assert.ok(src.includes('businessAccessCopy("upgradeWhere"'), "and the doorway must render it");
});

check("the upgrade offer is honest in both languages", () => {
  for (const lang of ["es", "en"] as const) {
    const cta = businessAccessCopy("upgradeCta", lang);
    const reassurance = businessAccessCopy("upgradeReassurance", lang);
    assert.ok(cta.length > 0 && reassurance.length > 0, `${lang} upgrade copy exists`);
    assert.ok(!/analytic|analític|hub/i.test(cta), `${lang} CTA must not promise a Full feature`);
  }
  for (const lang of ["es", "en"] as const) {
    assert.ok(
      !/analytic|analític|hub|concierge/i.test(businessAccessCopy("simpleBody", lang)),
      `${lang} Simple copy must not promise analytics, a Hub or Concierge`,
    );
  }
});

check("no control is dead: every button leads somewhere real", () => {
  const src = codeOf(CLIENT);
  // A button-styled element that is not a Link is a control the customer will press and nothing
  // will happen. The doorway has no state, so there is no legitimate <button> in it at all.
  assert.ok(!/<button/i.test(src), "the doorway routes; it never renders a bare button");
  for (const [, cls] of src.matchAll(/className=\{[^}]*?(quickPrimaryBtn|quickSecondaryBtn)[^}]*?\}/g)) {
    assert.ok(cls, "button classes are only used on elements");
  }
  // Every button-styled element must be a Link carrying an href.
  const buttonish = [...src.matchAll(/<(\w+)([^>]*?)(quickPrimaryBtn|quickSecondaryBtn)([^>]*?)>/g)];
  assert.ok(buttonish.length >= 4, "the doorway offers its primary controls");
  for (const [tag, before, , after] of buttonish.map((m) => [m[1], m[2], m[3], m[4]] as const)) {
    assert.equal(tag, "Link", `a button-styled ${tag} must be a Link with a destination`);
    assert.ok(/href=/.test(`${before}${after}`), "every Link must carry an href");
  }
  // No placeholder affordances anywhere.
  for (const placeholder of ['href="#"', "href={'#'}", "TODO", "coming soon", "Próximamente", "proximamente", "disabled"]) {
    assert.ok(!src.toLowerCase().includes(placeholder.toLowerCase()), `no placeholder control (${placeholder})`);
  }
});

check("every canonical destination the doorway names is a route that exists", () => {
  // The doorway is only as honest as its destinations. A registry href pointing at a route that
  // was renamed would send a Simple customer to a 404 with no server error to catch it.
  const routeFor = (href: string): string => {
    const clean = href.split("?")[0]!.replace(/^\//, "");
    return `app/(site)/${clean}/page.tsx`;
  };
  for (const def of listQuickBusinessDefinitions()) {
    const target = routeFor(def.manage.dashboardHref);
    assert.ok(exists(target), `${def.key}: ${def.manage.dashboardHref} must resolve to ${target}`);
  }
  for (const shared of ["/dashboard/mis-anuncios", "/contact"]) {
    assert.ok(exists(routeFor(shared)), `${shared} must resolve to a real page`);
  }
});

check("the doorway is mobile-first and adds no second dashboard route tree", () => {
  const src = codeOf(CLIENT);
  assert.ok(src.includes("grid-cols-2"), "the chooser is a simple two-up grid, not a table");
  assert.ok(!src.includes("md:grid-cols-4") && !src.includes("lg:grid-cols"), "no desktop-first layout");
  const routes = fs
    .readdirSync(path.join(ROOT, "app/(site)/publicar/negocio-rapido"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();
  assert.deepEqual(routes, ["[category]", "mi-negocio"], "Quick Business adds no other route tree");
});

console.log(failures === 0 ? "\nOK — Simple management surface proven" : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
