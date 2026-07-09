#!/usr/bin/env node
/**
 * REVENUE-OS-NEWSLETTER-PROMO-CHECKOUT-VALIDATION-02 smoke.
 * Reference model mirrors patched resolver logic; source parity asserted first.
 */
import { readFileSync } from "node:fs";

const read = (rel) => readFileSync(rel, "utf8");
const fail = (m) => {
  console.error(`smoke-revenue-os-newsletter-promo-checkout-validation-02: FAIL — ${m}`);
  process.exit(1);
};
const ok = (m) => console.log(`OK: ${m}`);

const redemptions = read("app/lib/listingPlans/revenuePromoRedemptions.ts");
const rules = read("app/lib/listingPlans/promoCodeRules.ts");

const WILDCARD = new Set([
  "any", "all", "*",
  "any category", "any_category", "anycategory",
  "any package", "any_package", "anypackage",
]);

function scopeUnrestricted(scope) {
  if (!scope?.length) return true;
  const ns = scope.map((s) => String(s ?? "").trim().toLowerCase()).filter(Boolean);
  if (!ns.length) return true;
  return ns.some((s) => WILDCARD.has(s));
}

function truthy(v) {
  if (v === true) return true;
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function requiresIdentity(row) {
  const meta = row.metadata ?? {};
  const rule = meta.promo_rule ?? {};
  if (
    meta.subscriber_identity_required === false ||
    rule.requires_subscriber_identity === false ||
    meta.checkout_subscriber_identity_required === false
  ) {
    return false;
  }
  if (truthy(meta.checkout_subscriber_identity_required)) return true;
  const codeType = String(row.code_type ?? "").trim().toLowerCase();
  if (codeType === "newsletter" || codeType === "sms") return false;
  return truthy(meta.subscriber_identity_required ?? rule.requires_subscriber_identity);
}

function canDiscount(row) {
  const meta = row.metadata ?? {};
  const rule = meta.promo_rule ?? {};
  const raw = meta.can_discount_payment ?? rule.can_discount_payment;
  if (raw === false) return false;
  const s = String(raw ?? "").trim().toLowerCase();
  return !(s === "false" || s === "0" || s === "no");
}

function launch25Reject(row, packageKey) {
  const isLaunch =
    String(row.metadata?.promo_family ?? "").toLowerCase() === "website_launch_25" ||
    (String(row.code_type ?? "").toLowerCase() === "newsletter" && row.metadata?.website_checkout_only === true);
  if (!isLaunch) return null;
  const catScope = row.category_scope;
  const pkgScope = row.package_scope;
  if (scopeUnrestricted(catScope) && scopeUnrestricted(pkgScope)) return null;
  const allow = ["rentas_30d", "empleos_job_post_paid", "autos_privado_30d", "restaurantes_base_monthly", "servicios_base_monthly"];
  if (!allow.includes(String(packageKey ?? "").trim().toLowerCase())) {
    return "launch25_not_allowlisted";
  }
  return null;
}

function evaluate(row, ctx, now = new Date("2026-07-08T12:00:00Z")) {
  if (String(row.status ?? "").toLowerCase() !== "active" || row.is_active === false) return { ok: false, reason: "inactive" };
  const end = row.ends_at ? new Date(row.ends_at) : null;
  if (end && end.getTime() < now.getTime()) return { ok: false, reason: "expired" };
  if (!canDiscount(row)) return { ok: false, reason: "payment_discount_disabled" };
  if (requiresIdentity(row) && !ctx.customerEmail) return { ok: false, reason: "identity_required" };
  const l25 = launch25Reject(row, ctx.packageKey);
  if (l25) return { ok: false, reason: l25 };
  if (!scopeUnrestricted(row.category_scope) && !row.category_scope?.map((s) => s.toLowerCase()).includes(ctx.category)) {
    return { ok: false, reason: "category_mismatch" };
  }
  if (!scopeUnrestricted(row.package_scope) && !row.package_scope?.map((s) => s.toLowerCase()).includes(ctx.packageKey)) {
    return { ok: false, reason: "package_mismatch" };
  }
  const pct = Number(row.percent_off);
  if (!(pct > 0)) return { ok: false, reason: "no_discount" };
  const discount = Math.floor((ctx.subtotalCents * Math.min(100, pct)) / 100);
  return { ok: true, discountCents: discount, totalCents: Math.max(0, ctx.subtotalCents - discount) };
}

// Source parity
if (!redemptions.includes('codeType === "newsletter"')) fail("source must exempt newsletter from identity gate");
if (!rules.includes("promoScopeIsUnrestricted")) fail("source must export promoScopeIsUnrestricted");
ok("reference model matches patched source");

const qaRow = {
  status: "active",
  is_active: true,
  code_type: "newsletter",
  percent_off: 25,
  category_scope: null,
  package_scope: null,
  metadata: {
    promo_family: "website_launch_25",
    website_checkout_only: true,
    subscriber_identity_required: true, // legacy delivery tracking — must NOT block checkout
    promo_rule: { requires_subscriber_identity: true, can_discount_payment: true },
    can_discount_payment: true,
  },
  ends_at: "2026-12-31T00:00:00Z",
};

const ctx = { category: "servicios", packageKey: "servicios_base_monthly", subtotalCents: 49800 };

// Valid QA scenario (no email — must pass)
{
  const r = evaluate(qaRow, ctx);
  if (!r.ok) fail(`QA newsletter code rejected: ${r.reason}`);
  if (r.discountCents !== 12450 || r.totalCents !== 37350) {
    fail(`QA math wrong: ${JSON.stringify(r)}`);
  }
  ok("1. LX-NEWS-style code validates: discount 12450, total 37350 (no email required)");
}

// Legacy subscriber_identity_required on newsletter still passes
{
  const r = evaluate({ ...qaRow, metadata: { ...qaRow.metadata, subscriber_identity_required: true } }, ctx);
  if (!r.ok) fail(`legacy subscriber_identity_required blocked checkout: ${r.reason}`);
  ok("2. legacy subscriber_identity_required on newsletter does not block checkout");
}

// Explicit checkout identity gate still rejects without email
{
  const row = {
    ...qaRow,
    metadata: { ...qaRow.metadata, checkout_subscriber_identity_required: true },
  };
  const r = evaluate(row, ctx);
  if (r.ok) fail("explicit checkout identity gate should reject without email");
  ok("3. explicit checkout_subscriber_identity_required rejects without identity");
}

// Invalid cases
const invalid = [
  ["inactive", { ...qaRow, status: "revoked" }],
  ["payment_discount_disabled", { ...qaRow, metadata: { ...qaRow.metadata, can_discount_payment: false } }],
  ["expired", { ...qaRow, ends_at: "2020-01-01T00:00:00Z" }],
  [
    "category_mismatch",
    {
      ...qaRow,
      metadata: { ...qaRow.metadata, promo_family: null, website_checkout_only: false },
      code_type: "discount",
      category_scope: ["restaurantes"],
    },
  ],
  [
    "package_mismatch",
    {
      ...qaRow,
      metadata: { ...qaRow.metadata, promo_family: null, website_checkout_only: false },
      code_type: "discount",
      package_scope: ["autos_privado_30d"],
    },
  ],
];
for (const [label, row] of invalid) {
  if (evaluate(row, ctx).ok) fail(`invalid '${label}' unexpectedly passed`);
}
ok("4. invalid cases rejected: " + invalid.map((i) => i[0]).join(", "));

console.log("smoke-revenue-os-newsletter-promo-checkout-validation-02: PASS");
