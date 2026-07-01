/**
 * Safe production smoke helper for Revenue OS sandbox E2E (no secrets).
 * Gate STRIPE-REVENUE-OS-SANDBOX-E2E-PROOF-01
 *
 * Usage: node scripts/smoke-stripe-revenue-os-sandbox-e2e-01.mjs
 */

const BASE = "https://leonixmedia.com";

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}`);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ name, ok: false, message });
    console.error(`FAIL  ${name}: ${message}`);
  }
}

await check("checkout GET returns safe rejection", async () => {
  const { status } = await request("GET", "/api/revenue-os/checkout");
  assert(status === 405 || status === 404 || status === 503, `Unexpected status ${status}`);
});

await check("webhook GET returns safe rejection", async () => {
  const { status } = await request("GET", "/api/revenue-os/webhook");
  assert(status === 405 || status === 404 || status === 503, `Unexpected status ${status}`);
});

await check("rentas_30d checkout creates sandbox session", async () => {
  const suffix = Date.now();
  const { status, json } = await request("POST", "/api/revenue-os/checkout", {
    category: "rentas",
    packageKey: "rentas_30d",
    listingId: `stripe_smoke_rentas_${suffix}`,
    leonixAdId: `STRIPE-SMOKE-RENTAS-${suffix}`,
    returnPath: "/clasificados/rentas",
  });
  assert(status === 200, `HTTP ${status}`);
  assert(json.ok === true, JSON.stringify(json));
  assert(json.amountCents === 2499, `amountCents ${json.amountCents}`);
  assert(json.mode === "payment", `mode ${json.mode}`);
  assert(typeof json.checkoutUrl === "string" && json.checkoutUrl.includes("checkout.stripe.com"));
  assert(typeof json.paymentRecordId === "string");
  assert(typeof json.stripeCheckoutSessionId === "string");
});

await check("empleos_job_post_paid checkout creates sandbox session", async () => {
  const suffix = Date.now();
  const { status, json } = await request("POST", "/api/revenue-os/checkout", {
    category: "empleos",
    packageKey: "empleos_job_post_paid",
    listingId: `stripe_smoke_empleos_${suffix}`,
    leonixAdId: `STRIPE-SMOKE-EMPLEOS-${suffix}`,
    returnPath: "/clasificados/empleos",
  });
  assert(status === 200, `HTTP ${status}`);
  assert(json.ok === true, JSON.stringify(json));
  assert(json.amountCents === 2499, `amountCents ${json.amountCents}`);
});

await check("empleos_job_fair_free rejected", async () => {
  const { status, json } = await request("POST", "/api/revenue-os/checkout", {
    category: "empleos",
    packageKey: "empleos_job_fair_free",
    listingId: `stripe_smoke_job_fair_${Date.now()}`,
  });
  assert(json.ok === false, JSON.stringify(json));
  assert(
    json.code === "package_not_stripe_eligible" || json.code === "package_is_free",
    json.code,
  );
  assert(status === 422 || status === 400, `HTTP ${status}`);
});

await check("comunidad_free rejected", async () => {
  const { status, json } = await request("POST", "/api/revenue-os/checkout", {
    category: "comunidad",
    packageKey: "comunidad_free",
    listingId: `stripe_smoke_comunidad_${Date.now()}`,
  });
  assert(json.ok === false, JSON.stringify(json));
  assert(json.code === "package_not_stripe_eligible" || json.code === "package_is_free");
  assert(status === 422 || status === 400, `HTTP ${status}`);
});

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`\nsmoke:stripe-revenue-os-sandbox-e2e-01 FAIL (${failed.length}/${results.length})`);
  process.exit(1);
}

console.log(`\nsmoke:stripe-revenue-os-sandbox-e2e-01 PASS (${results.length}/${results.length})`);
