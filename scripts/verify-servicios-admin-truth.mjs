#!/usr/bin/env node
/** SVC-LAUNCH-INTELLIGENCE-1 — admin Servicios truth */
import fs from "node:fs";
import path from "node:path";
const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (c, m) => { if (!c) throw new Error(m); };

const page = read("app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx");
const card = read("app/admin/(dashboard)/workspace/clasificados/servicios/_components/ServiciosAdminOpsListingCard.tsx");
const canonical = read("app/admin/(dashboard)/workspace/clasificados/servicios/_lib/serviciosAdminCanonicalAnalytics.ts");

assert(page.includes("fetchServiciosAdminCanonicalAnalyticsByRows"), "admin: canonical analytics fetch");
assert(page.includes("servicios_public_listings"), "admin: listing source");
assert(canonical.includes('eq("source_table", "servicios_public_listings")'), "admin: source_table filter");

assert(card.includes("canonicalViews"), "admin card: canonical views");
assert(card.includes("canonicalLeads"), "admin card: canonical leads");
assert(card.includes("listing_analytics"), "admin card: canonical label");

assert(!page.includes("membership_tier"), "admin: no account plan truth");

console.log("verify-servicios-admin-truth: PASS");
