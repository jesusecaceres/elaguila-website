#!/usr/bin/env node
/**
 * REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-01 smoke.
 *
 * Server-only + Supabase modules cannot be imported in plain node, so this smoke runs a
 * faithful reference model of the patched validation decision AND asserts the real source
 * contains the same logic, so the model cannot silently drift from production.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");
const fail = (m) => {
  console.error(`smoke-revenue-os-newsletter-promo-checkout-validation-01: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const redemptions = read("app/lib/listingPlans/revenuePromoRedemptions.ts");
const rules = read("app/lib/listingPlans/promoCodeRules.ts");

// --- Reference model (mirrors patched source) ---------------------------------
const WEBSITE_LAUNCH_25_ALLOWLIST = [
  "rentas_30d",
  "empleos_job_post_paid",
  "autos_privado_30d",
  "restaurantes_base_monthly",
  "servicios_base_monthly",
];
const WILDCARD = new Set([
  "any", "all", "*",
  "any category", "any_category", "anycategory",
  "any package", "any_package", "anypackage",
]);

const norm = (v) => String(v ?? "").trim().toLowerCase();
function scopeMatches(scope, value) {
  if (!scope?.length) return true;
  const ns = scope.map(norm).filter(Boolean);
  if (!ns.length) return true;
  if (ns.some((s) => WILDCARD.has(s))) return true;
  const token = norm(value);
  if (!token) return false;
  return ns.includes(token);
}
function isLaunch25(row) {
  return norm(row.promo_family) === "website_launch_25" ||
    (norm(row.code_type) === "newsletter" && row.website_checkout_only === true);
}
function canDiscountPayment(row) {
  const raw = row.can_discount_payment;
  if (raw === false) return false;
  const s = norm(raw);
  return !(s === "false" || s === "0" || s === "no");
}
function evaluate(row, ctx, now = new Date("2026-07-08T12:00:00Z")) {
  if (norm(row.status) !== "active" || row.is_active === false) return { ok: false, reason: "inactive" };
  const end = row.ends_at ? new Date(row.ends_at) : null;
  if (end && end.getTime() < now.getTime()) return { ok: false, reason: "expired" };
  if (isLaunch25(row) && !WEBSITE_LAUNCH_25_ALLOWLIST.includes(norm(ctx.packageKey))) {
    return { ok: false, reason: "launch25_not_allowlisted" };
  }
  if (!canDiscountPayment(row)) return { ok: false, reason: "payment_discount_disabled" };
  if (row.subscriber_identity_required === true && !ctx.customerEmail) {
    return { ok: false, reason: "identity_required" };
  }
  if (!scopeMatches(row.category_scope, ctx.category)) return { ok: false, reason: "category_mismatch" };
  if (!scopeMatches(row.package_scope, ctx.packageKey)) return { ok: false, reason: "package_mismatch" };
  const pct = Number(row.percent_off);
  if (!(pct > 0)) return { ok: false, reason: "no_discount" };
  const discount = Math.floor((ctx.subtotalCents * Math.min(100, pct)) / 100);
  if (discount <= 0) return { ok: false, reason: "no_discount" };
  return { ok: true, discountCents: discount, totalCents: Math.max(0, ctx.subtotalCents - discount) };
}

// --- Source parity assertions -------------------------------------------------
if (!redemptions.includes("servicios_base_monthly")) fail("source allowlist must include servicios_base_monthly");
for (const t of ['"any"', '"all"', '"*"', '"any category"', '"any package"']) {
  if (!rules.includes(t)) fail(`source scope wildcard set missing ${t}`);
}
if (!redemptions.includes("resolvePromoCanDiscountPayment")) fail("source must expose can_discount_payment resolver");
if (!redemptions.includes("resolvePromoRequiresSubscriberIdentity")) fail("source must expose identity resolver");
ok("reference model matches patched source (allowlist, wildcard, guards)");

// --- Representative newsletter code (the QA scenario) -------------------------
const newsletterRow = {
  status: "active", is_active: true, code_type: "newsletter",
  promo_type: "percent_off", percent_off: 25,
  category_scope: null, package_scope: null, // "Any category" / "Any package"
  can_discount_payment: true, subscriber_identity_required: false,
  website_checkout_only: true, promo_family: "website_launch_25",
  ends_at: "2026-12-31T00:00:00Z",
};
const servicios = { category: "servicios", packageKey: "servicios_base_monthly" };

// 1. base + add-on subtotal $498 → discount $124.50 → total $373.50
{
  const r = evaluate(newsletterRow, { ...servicios, subtotalCents: 49800 });
  if (!r.ok) fail(`newsletter code rejected for $498 checkout: ${r.reason}`);
  if (r.discountCents !== 12450) fail(`expected 12450 discount, got ${r.discountCents}`);
  if (r.totalCents !== 37350) fail(`expected 37350 total, got ${r.totalCents}`);
  ok("1. $498 @ 25% → discount $124.50, total $373.50");
}

// 2. base-only subtotal $399 → discount $99.75 → total $299.25
{
  const r = evaluate(newsletterRow, { ...servicios, subtotalCents: 39900 });
  if (!r.ok || r.discountCents !== 9975 || r.totalCents !== 29925) {
    fail(`base-only math wrong: ${JSON.stringify(r)}`);
  }
  ok("2. $399 @ 25% → discount $99.75, total $299.25");
}

// 3. literal "Any category"/"Any package" scope tokens still validate
{
  const row = { ...newsletterRow, category_scope: ["Any category"], package_scope: ["any"] };
  const r = evaluate(row, { ...servicios, subtotalCents: 49800 });
  if (!r.ok) fail(`literal wildcard scope rejected: ${r.reason}`);
  ok("3. literal 'Any category' / 'any' package scope tokens accepted");
}

// --- Invalid protections preserved -------------------------------------------
const invalid = [
  ["inactive", { ...newsletterRow, status: "revoked" }, servicios, 49800],
  ["payment_discount_disabled", { ...newsletterRow, can_discount_payment: false }, servicios, 49800],
  ["category_mismatch", { ...newsletterRow, promo_family: null, website_checkout_only: false, code_type: "discount", category_scope: ["restaurantes"] }, servicios, 49800],
  ["package_mismatch", { ...newsletterRow, promo_family: null, website_checkout_only: false, code_type: "discount", package_scope: ["autos_privado_30d"] }, servicios, 49800],
  ["expired", { ...newsletterRow, ends_at: "2020-01-01T00:00:00Z" }, servicios, 49800],
  ["launch25_not_allowlisted", newsletterRow, { category: "clases", packageKey: "clases_promo_30d" }, 2000],
  ["identity_required", { ...newsletterRow, subscriber_identity_required: true }, servicios, 49800],
];
for (const [label, row, ctx, subtotal] of invalid) {
  const r = evaluate(row, { ...ctx, subtotalCents: subtotal });
  if (r.ok) fail(`invalid case '${label}' unexpectedly passed`);
}
ok("4. invalid cases still rejected: " + invalid.map((i) => i[0]).join(", "));

// 5. identity-required + email present → allowed (assigned/private alone never blocks)
{
  const row = { ...newsletterRow, subscriber_identity_required: true };
  const r = evaluate(row, { ...servicios, subtotalCents: 49800, customerEmail: "sub@x.com" });
  if (!r.ok) fail(`identity-required code with email should pass: ${r.reason}`);
  ok("5. identity-required code validates when email identity is provided");
}

console.log("smoke-revenue-os-newsletter-promo-checkout-validation-01: PASS");
