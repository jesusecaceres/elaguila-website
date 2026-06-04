import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const helperPath = "app/lib/listingPlans/categoryListingMonetization.ts";
const docsPath = "docs/category-listing-monetization-read-model.md";

assert(
  "categoryListingMonetization helper exists",
  fs.existsSync(path.join(root, helperPath)),
  "Expected read-only helper at app/lib/listingPlans/categoryListingMonetization.ts.",
);

const helper = read(helperPath);
const docs = read(docsPath);

const helperCodeOnly = helper
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/.*$/gm, "");

assert(
  "helper exports resolver",
  /export function resolveCategoryListingMonetization/.test(helper),
  "Helper must export resolveCategoryListingMonetization(input).",
);

assert(
  "helper exports summary type",
  /export type CategoryListingMonetizationSummary/.test(helper),
  "Helper must export the read-model summary type.",
);

assert(
  "helper exports result type",
  /export type CategoryListingMonetizationResult/.test(helper),
  "Helper must export CategoryListingMonetizationResult.",
);

assert(
  "helper exports tool key type",
  /export type CategoryListingToolKey/.test(helper),
  "Helper must export CategoryListingToolKey.",
);

assert(
  "helper exports tool status type",
  /export type CategoryListingToolStatus/.test(helper),
  "Helper must export CategoryListingToolStatus.",
);

assert(
  "helper exports structured warning type",
  /export type CategoryListingMonetizationWarning/.test(helper),
  "Helper must export CategoryListingMonetizationWarning.",
);

assert(
  "helper does not use profile membership as listing truth",
  !/profiles\.membership_tier|membership_tier|membershipTier/.test(helperCodeOnly),
  "Helper must not import, read, or normalize profile membership fields.",
);

assert(
  "helper does not use business account tiers as category monetization",
  !/business_lite|business_premium/.test(helperCodeOnly),
  "Helper must not map account business tiers into category/listing monetization.",
);

assert(
  "legacy boost expiration is warning-only",
  /boost_expires/.test(helper) &&
    !/boost_expires[\s\S]{0,320}toolState\(\s*"boost"[\s\S]{0,80}"available"/.test(helper) &&
    !/boost_expires[\s\S]{0,320}status:\s*"available"/.test(helper),
  "Legacy boost_expires may be detected, but must not activate Boost / Impulsado.",
);

assert(
  "doctrine comments mention membership ignored",
  /membership_tier is NEVER listing monetization truth/.test(helper),
  "Resolver file must document membership_tier doctrine in comments.",
);

assert(
  "doctrine comments separate republish featured verify",
  /Republish.*Featured.*Verify Leonix/s.test(helper.replace(/\s+/g, " ")),
  "Resolver file must document republish vs featured vs verify separation.",
);

for (const category of [
  "servicios",
  "restaurantes",
  "autos",
  "bienes-raices",
  "rentas",
  "en-venta",
  "clases",
  "comunidad",
  "viajes",
  "empleos",
  "busco",
  "mascotas-y-perdidos",
]) {
  assert(
    `category represented: ${category}`,
    helper.includes(`"${category}"`),
    `Missing category ${category} in the helper category set or resolver.`,
  );
}

for (const toolKey of [
  "republish",
  "moveToTop",
  "featured",
  "verified",
  "boost",
  "autoRefresh",
  "analytics",
  "leads",
  "concierge",
  "expirationRenewal",
]) {
  assert(
    `tool represented: ${toolKey}`,
    new RegExp(`\\b${toolKey}\\b`).test(helper),
    `Missing read-only tool key ${toolKey}.`,
  );
}

assert(
  "tool statuses are read-only",
  /"available"/.test(helper) &&
    /"locked"/.test(helper) &&
    /"unsupported"/.test(helper) &&
    /"unknown"/.test(helper) &&
    /"future"/.test(helper) &&
    !/fetch\(|\.from\(|\.insert\(|\.update\(|\.delete\(|stripe/i.test(helperCodeOnly),
  "Helper must only compute read-only states and must not call APIs, Supabase writes, or Stripe.",
);

assert(
  "uses republish capability helper",
  /republishCapabilityReason/.test(helper),
  "Republish eligibility should align with existing republishCapabilityReason helper.",
);

assert(
  "coming-soon categories marked not client ready",
  /NOT_CLIENT_READY/.test(helper) &&
    helper.includes('"busco"') &&
    helper.includes('"mascotas-y-perdidos"'),
  "Scaffold categories must be in NOT_CLIENT_READY set.",
);

assert(
  "docs state account metadata is not listing monetization truth",
  /account metadata is not listing monetization/i.test(docs) &&
    /profiles\.membership_tier/.test(docs) &&
    /profiles\.account_type/.test(docs),
  "Docs must explain account/profile metadata is not listing monetization truth.",
);

assert(
  "docs state missing Supabase fields are gaps",
  /Do not assume missing Supabase fields or tables exist/i.test(docs) &&
    /report it as a read-model warning or implementation gap first/i.test(docs),
  "Docs must require missing Supabase columns/tables to be treated as gaps, not assumptions.",
);

assert(
  "docs keep Stripe and promo codes out of Gate E",
  /Stripe, public pricing, promo codes, paid placement checkout, and notifications are intentionally out of scope/i.test(docs),
  "Docs must state Stripe/pricing/promo/notifications are out of scope for this gate.",
);

// Runtime behavioral checks (pure resolver, no DB)
const resolverUrl = pathToFileURL(path.join(root, helperPath.replace(/\.ts$/, ".ts"))).href;

async function runtimeChecks() {
  let mod;
  try {
    // ts files need transpile — use dynamic import only if project supports it; fallback to manual eval via ts-node
    // Instead import compiled path through tsx if available, or run minimal inline simulation
    const tsxPath = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
    if (!fs.existsSync(tsxPath)) {
      assert("runtime resolver import", false, "tsx not available for runtime resolver checks.");
      return;
    }
    const { spawnSync } = await import("node:child_process");
    const probe = `
      import { resolveCategoryListingMonetization } from "./app/lib/listingPlans/categoryListingMonetization.ts";
      const enFree = resolveCategoryListingMonetization({
        category: "en-venta",
        sourceTable: "listings",
        listing: { detail_pairs: { plan: "free" }, status: "active", is_published: true },
      });
      const enProOther = resolveCategoryListingMonetization({
        category: "rentas",
        sourceTable: "listings",
        categoryPlan: {
          key: "en_venta_pro",
          labelEn: "Pro",
          labelEs: "Pro",
          isPaid: true,
          isFree: false,
          isAffiliate: false,
          isBusiness: false,
          isPrivate: false,
        },
      });
      const boostFuture = resolveCategoryListingMonetization({
        category: "servicios",
        sourceTable: "servicios_public_listings",
        listing: { listing_plan: "business" },
      });
      const boostExplicit = resolveCategoryListingMonetization({
        category: "servicios",
        sourceTable: "servicios_public_listings",
        listing: { listing_plan: "business", boost_active: true },
      });
      const clases = resolveCategoryListingMonetization({
        category: "clases",
        sourceTable: "listings",
        listing: { status: "active" },
      });
      const out = {
        enFreeRepublish: enFree.tools.republish.status,
        enFreeFeatured: enFree.tools.featured.status,
        enFreeVerified: enFree.tools.verified.status,
        enProLeakGap: enProOther.gaps.some((g) => g.code === "en_venta_pro_leak"),
        boostFuture: boostFuture.tools.boost.status,
        boostExplicit: boostExplicit.tools.boost.status,
        clasesClientReady: clases.isClientReady,
        republishNotFeatured:
          enFree.tools.republish.key === "republish" && enFree.tools.featured.key === "featured",
        verifiedNotFeatured: enFree.tools.verified.key === "verified",
        accountIgnored: enFree.accountTierIgnored === true,
        missingExpiresGap: boostFuture.gaps.some((g) => g.code === "expires_at_missing"),
      };
      console.log(JSON.stringify(out));
    `;
    const r = spawnSync(process.execPath, [tsxPath, "--eval", probe], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "" },
    });
    if (r.status !== 0) {
      assert("runtime resolver import", false, `tsx eval failed: ${r.stderr || r.stdout}`);
      return;
    }
    const line = (r.stdout || "").trim().split("\n").pop();
    const out = JSON.parse(line);
    assert("runtime en-venta free republish locked", out.enFreeRepublish === "locked", `Expected locked, got ${out.enFreeRepublish}`);
    assert("runtime en-venta pro does not leak to rentas", out.enProLeakGap === true, "Expected en_venta_pro_leak gap.");
    assert("runtime boost future without field", out.boostFuture === "future", `Expected future, got ${out.boostFuture}`);
    assert("runtime boost available with safe field", out.boostExplicit === "available", `Expected available, got ${out.boostExplicit}`);
    assert("runtime clases not client ready", out.clasesClientReady === false, "Clases must not be client-ready.");
    assert("runtime republish separate from featured keys", out.republishNotFeatured === true, "Tool keys must differ.");
    assert("runtime verified separate from featured keys", out.verifiedNotFeatured === true, "Verify tool key must differ.");
    assert("runtime account tier ignored flag", out.accountIgnored === true, "accountTierIgnored must be true.");
    assert("runtime missing expires_at produces gap", out.missingExpiresGap === true, "Missing expires_at must add gap warning.");
  } catch (e) {
    assert("runtime resolver import", false, String(e));
  }
}

await runtimeChecks();

const failures = checks.filter((c) => !c.ok);
for (const c of checks) {
  console.log(`${c.ok ? "OK" : "FAIL"}: ${c.name}`);
  if (!c.ok) console.log(`  ${c.detail}`);
}

if (failures.length) {
  process.exitCode = 1;
}
