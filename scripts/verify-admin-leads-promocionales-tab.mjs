import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];

function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const subnav = read("app/admin/_components/leads/AdminLeadsSubnav.tsx");
const navOps = read("app/admin/_lib/adminNavOps.ts");
const inboxClient = read("app/admin/_components/leads/AdminLeonixLeadsInboxClient.tsx");
const inboxPage = read("app/admin/(dashboard)/leads/inbox/page.tsx");
const productCatalog = read("app/(site)/productos-promocion/ProductCatalog.tsx");
const tiendaContactForm = read("app/(site)/tienda/components/TiendaContactForm.tsx");
const tiendaContactPage = read("app/(site)/tienda/contacto/page.tsx");
const pkg = read("package.json");

const PROMO_HREF = "/admin/leads/inbox?view=promo";
const PROMO_EMPTY = "No promotional product / print quote leads match this view.";

// 1–4. Top lead tabs
assert("Promocionales tab label", /label:\s*"Promocionales"/.test(subnav), subnav);
assert("Lead inbox tab preserved", /label:\s*"Lead inbox"/.test(subnav), subnav);
assert("Newsletter tab preserved", /label:\s*"Newsletter"/.test(subnav), subnav);
assert("Media kit tab preserved", /label:\s*"Media kit"/.test(subnav), subnav);

// 5–6. Route + filter
assert("Promocionales href", subnav.includes("ADMIN_LEADS_PROMO_INBOX_HREF"), subnav);
assert("promo href constant", navOps.includes(PROMO_HREF), navOps);
assert("promo view param parser", /parseAdminLeadsInboxViewParam/.test(navOps), navOps);
assert("isPromotionalLeadRow helper", /export function isPromotionalLeadRow/.test(navOps), navOps);
assert("inbox uses promo filter helper", inboxClient.includes("isPromotionalLeadRow"), inboxClient);
assert("inbox reads view param", inboxPage.includes("parseAdminLeadsInboxViewParam"), inboxPage);
assert("initial ops view prop", inboxClient.includes("initialOpsView"), inboxClient);

// 7–8. Real fields + empty state
assert("filter uses inquiry_type", /inquiry_type === "promotionalProducts"/.test(navOps), navOps);
assert("filter uses source_cta", /source_cta === "promo_quote"/.test(navOps) || /promo_quote/.test(navOps), navOps);
assert("promo empty state constant", navOps.includes(PROMO_EMPTY), navOps);
assert("inbox uses promo empty state", inboxClient.includes("ADMIN_LEADS_PROMO_EMPTY_STATE"), inboxClient);

// Active state
assert("promo active state logic", /isAdminLeadsPromoViewParam/.test(subnav), subnav);
assert("lead inbox inactive on promo view", /onInbox && !promoView/.test(subnav), subnav);

// 9–10. Public CTA traceability
assert("productos-promocion quote href", productCatalog.includes("cotizacion-general"), productCatalog);
assert("productos-promocion sourceCta promo_quote", productCatalog.includes("sourceCta") && productCatalog.includes("promo_quote"), productCatalog);
assert("productos-promocion sourcePage", productCatalog.includes("productos-promocion"), productCatalog);
assert("tienda contact saves promotionalProducts", tiendaContactForm.includes('inquiryType: "promotionalProducts"'), tiendaContactForm);
assert("tienda contact default promo_quote cta", tiendaContactPage.includes('sourceCta = typeof sp.sourceCta === "string" ? sp.sourceCta : "promo_quote"'), tiendaContactPage);
assert("tienda cotizacion-general service param", tiendaContactPage.includes("service"), tiendaContactPage);

// Admin filter matches public save path
assert("admin filter matches promotionalProducts", navOps.includes("promotionalProducts"), navOps);

// 11–13. Guardrails
assert("data warning preserved", inboxPage.includes("adminWarningCallout") && inboxPage.includes("Data unavailable"), inboxPage);
assert("search preserved", inboxClient.includes('type="search"'), inboxClient);
assert("export preserved", inboxClient.includes("/api/admin/leads/inbox/export"), inboxClient);
assert("no new migrations", !exists("supabase/migrations") || !fs.readdirSync(path.join(root, "supabase/migrations")).some((f) => f.includes("promocionales_tab")), "migrations");
assert("package script", /verify:admin-leads-promocionales-tab/.test(pkg), pkg);

// Tab order: four tabs
const tabLabels = ["Lead inbox", "Newsletter", "Media kit", "Promocionales"];
let lastIdx = -1;
for (const label of tabLabels) {
  const idx = subnav.indexOf(`label: "${label}"`);
  assert(`tab order ${label}`, idx > lastIdx, { idx, lastIdx });
  lastIdx = idx;
}

const failed = checks.filter((c) => !c.ok);

if (failed.length > 0) {
  console.error("verify:admin-leads-promocionales-tab FAILED\n");
  for (const f of failed) {
    console.error(`  ✗ ${f.name}${f.detail ? `: ${String(typeof f.detail === "object" ? JSON.stringify(f.detail) : f.detail).slice(0, 160)}` : ""}`);
  }
  process.exit(1);
}

console.log(`verify:admin-leads-promocionales-tab PASS (${checks.length} checks)`);
