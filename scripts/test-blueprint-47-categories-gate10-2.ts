/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — deterministic tests for the canonical
 * Website Blueprint 47-category registry (MD §14 <blueprint_packet>,
 * app/lib/business/projectDiscovery/blueprintCategoryRegistry.ts). No database, no network — pure
 * fixtures, matching Gates 1-7/10.1's own test pattern.
 *
 * Run from repo root: npx tsx scripts/test-blueprint-47-categories-gate10-2.ts
 */
import { strict as assert } from "node:assert";

import { buildArchitectureDecisionPacket } from "../app/lib/business/projectDiscovery/architectureDecisionEngine";
import { detectWebsiteScopeSignals, type WebsiteDiscoveryContext } from "../app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import { buildWebsiteProjectBlueprintPacket } from "../app/lib/business/projectDiscovery/blueprintEngine";
import { buildWebsiteProjectBlueprintMarkdown } from "../app/lib/business/projectDiscovery/blueprintMarkdown";
import { WEBSITE_BLUEPRINT_CATEGORIES } from "../app/lib/business/projectDiscovery/blueprintCategoryRegistry";
import type { ProjectDiscoveryItem, ProjectDiscoveryIntent, ProjectDiscoverySource } from "../app/lib/business/projectDiscovery/types";

let passed = 0;
function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e);
    process.exitCode = 1;
  }
}

console.log("Blueprint 47-category canonical registry (Gate 10.2) — deterministic tests\n");

const NOW = "2026-09-11T12:00:00.000Z";
let idCounter = 0;
const nextId = () => `g10-2-${(idCounter += 1)}`;

function item(fieldKey: string, value: unknown, section: string, opts: Partial<Pick<ProjectDiscoveryItem, "truthClass" | "completenessClass" | "displayValue">> = {}): ProjectDiscoveryItem {
  return {
    id: nextId(), businessId: "biz-1", discoveryId: "disc-1", projectIntentId: "intent-1",
    section, fieldKey, value, displayValue: opts.displayValue ?? String(value), valueType: "text",
    truthClass: opts.truthClass ?? "client_confirmed",
    completenessClass: opts.completenessClass ?? "required_before_build",
    confirmationState: "confirmed", clientConfirmedAt: NOW,
    capturedActorType: "staff", capturedByRosterId: "s1", capturedByAuthUserId: "a1", capturedByEmail: "e@x.test", capturedByRole: "sales_rep",
    notes: null, createdAt: NOW, updatedAt: NOW,
  };
}

// A RICH fixture — real answers under every packet-level category this registry can populate, so
// "representative values land in the correct category" is provable, not asserted on faith. A
// Radio/Media context (custom platform signal via wants_user_accounts=true) so architecture
// rationale, domain blocker, and commercial-review lines all have real content too.
function richContext(): WebsiteDiscoveryContext {
  const items: ProjectDiscoveryItem[] = [
    item("public_business_name", "Acme Radio", "business_identity"),
    item("decision_maker_approver", "Jane Owner", "business_identity"),
    item("primary_business_goal", "Grow listeners", "website_objective"),
    item("primary_customer", "Local commuters", "audience"),
    item("core_services_products", "Live radio stream", "offers_services_products"),
    item("primary_cta_type", "Listen Live", "primary_cta"),
    item("secondary_ctas", "Follow on social, Text the studio", "primary_cta", { completenessClass: "optional" }),
    item("colors_liked", "Deep blue, gold", "brand_identity", { truthClass: "client_preference", completenessClass: "helpful" }),
    item("colors_disliked", "Neon green", "brand_identity", { truthClass: "client_preference", completenessClass: "helpful" }),
    item("websites_liked", "wnyc.org — clean, easy Listen Live button", "visual_references", { truthClass: "client_preference", completenessClass: "helpful" }),
    item("copy_ownership", "Leonix should write it", "content"),
    item("about_story", "On air since 1998", "content", { completenessClass: "helpful" }),
    item("required_pages_sections", "Home, Listen Live, Schedule, Contact", "page_architecture"),
    item("wants_online_booking", false, "booking_scheduling"),
    item("wants_native_checkout", false, "payments_commerce"),
    item("wants_contact_form", true, "forms"),
    item("has_existing_domain", true, "domain"),
    item("existing_website_transition_plan", "replace_fully", "hosting_deployment", { completenessClass: "helpful" }),
    item("bilingual_site_needed", false, "languages"),
    item("handles_minors_or_medical_financial_data", false, "privacy_legal"),
    item("in_scope_summary", "Homepage, Listen Live, Schedule, Contact", "scope"),
    item("out_of_scope_summary", "Podcast archive (future)", "scope"),
    item("hard_launch_deadline", "No hard deadline", "schedule_approvals", { completenessClass: "helpful" }),
    item("maintenance_responsibility", "Leonix-managed", "maintenance", { completenessClass: "helpful" }),
    // Custom-Platform-shaping signal so architecture rationale/commercial-review have real content.
    item("wants_user_accounts", true, "backend_database_auth"),
    item("wants_customer_dashboard", false, "backend_database_auth"),
    item("backend_database_needed", true, "backend_database_auth", { truthClass: "technical_decision", completenessClass: "needs_leonix_decision" }),
    // Domain access NOT confirmed -> domain_access_blocker kind, proving #23's launch-blocker line.
  ];
  return {
    discoveryId: "disc-1", businessId: "biz-1", projectIntentId: "intent-1",
    broadBusinessType: "media_broadcasting", specificBusinessType: "radio_station", customSpecificType: null,
    businessStage: "operating", hasExistingWebsite: true, knownFacts: [], capturedItems: items,
  };
}

// A near-empty context (only the absolute minimum to approve an architecture) — used to prove
// genuinely-inapplicable categories are OMITTED, never rendered as fabricated "N/A" filler.
function sparseContext(): WebsiteDiscoveryContext {
  return {
    discoveryId: "disc-2", businessId: "biz-1", projectIntentId: "intent-2",
    broadBusinessType: "retail_ecommerce", specificBusinessType: null, customSpecificType: null,
    businessStage: "operating", hasExistingWebsite: false, knownFacts: [], capturedItems: [],
  };
}

function buildPacketFor(c: WebsiteDiscoveryContext, workingTitle: string, sources: ProjectDiscoverySource[] = []) {
  const architecture = buildArchitectureDecisionPacket(c, detectWebsiteScopeSignals(c));
  const intents: ProjectDiscoveryIntent[] = [
    { id: c.projectIntentId!, businessId: "biz-1", discoveryId: c.discoveryId, projectType: "website", projectSubtype: null, otherLabel: null, title: workingTitle, status: "confirmed", createdActorType: "staff", createdByRosterId: "s1", createdByAuthUserId: "a1", createdByEmail: "e@x.test", createdByRole: "sales_rep", createdAt: NOW, updatedAt: NOW },
  ];
  const packet = buildWebsiteProjectBlueprintPacket({
    ctx: c,
    discovery: { title: workingTitle, sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: null },
    intents,
    selectedIntentId: c.projectIntentId!,
    sources,
    approvedArchitecture: architecture,
    businessDisplayName: "Acme Radio",
    businessPublicName: "Acme Radio 101.5",
  });
  return { architecture, packet };
}

// ===============================================================================================
// Registry shape
// ===============================================================================================
console.log("Registry shape:");
check("1. exactly 47 categories are registered", () => {
  assert.equal(WEBSITE_BLUEPRINT_CATEGORIES.length, 47);
});
check("2. every mdNumber 1-47 is present exactly once (no gap, no duplicate)", () => {
  const numbers = WEBSITE_BLUEPRINT_CATEGORIES.map((c) => c.mdNumber).sort((a, b) => a - b);
  assert.deepEqual(numbers, Array.from({ length: 47 }, (_, i) => i + 1));
});
check("3. every category key is unique and non-empty", () => {
  const keys = WEBSITE_BLUEPRINT_CATEGORIES.map((c) => c.key);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(keys.every((k) => k.trim().length > 0));
});
check("4. every category has a non-empty bilingual label", () => {
  for (const cat of WEBSITE_BLUEPRINT_CATEGORIES) {
    assert.ok(cat.labelEs.trim().length > 0, `${cat.key} missing Spanish label`);
    assert.ok(cat.labelEn.trim().length > 0, `${cat.key} missing English label`);
  }
});

// ===============================================================================================
// Real mapping — every category resolves against a real packet without throwing
// ===============================================================================================
console.log("\nReal packet mapping:");
const richSources: ProjectDiscoverySource[] = [
  { id: "src-1", businessId: "biz-1", discoveryId: "disc-1", itemId: null, sourceType: "asset", sourceRecordId: null, businessSourceFileId: "file-1", externalUrl: null, label: "Station logo", notes: null, createdActorType: "staff", createdByRosterId: "s1", createdByAuthUserId: "a1", createdByEmail: "e@x.test", createdByRole: "sales_rep", createdAt: NOW },
];
const { packet: richPacket } = buildPacketFor(richContext(), "Acme Radio Website", richSources);
check("5. every category's render() runs against a real packet without throwing", () => {
  for (const cat of WEBSITE_BLUEPRINT_CATEGORIES) {
    assert.doesNotThrow(() => cat.render(richPacket), `${cat.key} threw`);
  }
});

const richMd = buildWebsiteProjectBlueprintMarkdown(richPacket, { version: 1, status: "draft" });

check("6. #8 Secondary CTAs — real captured value lands under its own numbered section, distinct from #7 Primary CTA", () => {
  assert.ok(richMd.includes("## 8. CTAs Secundarias / Secondary CTAs"));
  const idx8 = richMd.indexOf("## 8. CTAs Secundarias");
  const idx9 = richMd.indexOf("## 9.");
  const body = richMd.slice(idx8, idx9);
  assert.ok(body.includes("Follow on social"));
});

check("7. #9 Client Preferences vs #10 Client Dislikes are genuinely split — liked colors and disliked colors land in different sections", () => {
  const idx9 = richMd.indexOf("## 9. Preferencias Confirmadas del Cliente");
  const idx10 = richMd.indexOf("## 10. Lo que el Cliente No Quiere");
  const idx11 = richMd.indexOf("## 11.");
  assert.ok(idx9 >= 0 && idx10 > idx9 && idx11 > idx10);
  const prefsBody = richMd.slice(idx9, idx10);
  const dislikesBody = richMd.slice(idx10, idx11);
  assert.ok(prefsBody.includes("Deep blue, gold"), "liked colors should appear under Preferences");
  assert.ok(!prefsBody.includes("Neon green"), "disliked colors must NOT appear under Preferences");
  assert.ok(dislikesBody.includes("Neon green"), "disliked colors should appear under Dislikes");
  assert.ok(!dislikesBody.includes("Deep blue, gold"), "liked colors must NOT appear under Dislikes");
});

check("8. #14 Required Content Creation surfaces copy_ownership distinctly from #13 Content Inventory", () => {
  const idx13 = richMd.indexOf("## 13. Inventario de Contenido");
  const idx14 = richMd.indexOf("## 14. Contenido Requerido por Crear");
  const idx15 = richMd.indexOf("## 15.");
  const contentBody = richMd.slice(idx13, idx14);
  const creationBody = richMd.slice(idx14, idx15);
  assert.ok(contentBody.includes("On air since 1998"), "about_story belongs to content inventory");
  assert.ok(creationBody.includes("Leonix should write it"), "copy_ownership belongs to required content creation");
});

check("9. #15 Visual References vs #16 Brand System are genuinely split sections", () => {
  const idx15 = richMd.indexOf("## 15. Referencias Visuales");
  const idx16 = richMd.indexOf("## 16. Sistema de Marca");
  const idx17 = richMd.indexOf("## 17.");
  const visualBody = richMd.slice(idx15, idx16);
  const brandBody = richMd.slice(idx16, idx17);
  assert.ok(visualBody.includes("wnyc.org"), "websites_liked belongs to visual references");
  assert.ok(brandBody.includes("Deep blue, gold") || brandBody.includes("Neon green"), "brand colors belong to brand system, not visual references");
});

check("10. #23 Domain/DNS is its own rendered category (previously computed but never rendered at all)", () => {
  assert.ok(richMd.includes("## 23. Dominio/DNS / Domain/DNS"));
});

check("11. #23 flags the launch-blocker line truthfully when domain access is unconfirmed", () => {
  const idx23 = richMd.indexOf("## 23. Dominio/DNS");
  const idx24 = richMd.indexOf("## 24.");
  const body = richMd.slice(idx23, idx24);
  assert.ok(/BLOQUEADOR DE LANZAMIENTO|LAUNCH BLOCKER/.test(body));
});

check("12. #25 Platform Decisions and Rationale renders the computed 'why' behind platform choices (previously computed since Gate 4 but never rendered)", () => {
  const idx25 = richMd.indexOf("## 25. Decisiones de Plataforma y Justificación");
  const idx26 = richMd.indexOf("## 26.");
  const body = richMd.slice(idx25, idx26);
  assert.ok(body.length > 100, "rationale section should contain real reasoning text, not be near-empty");
});

check("13. #25 truthfully flags COMMERCIAL REVIEW REQUIRED for a Custom-Platform-shaped fixture", () => {
  assert.ok(richMd.includes("REVISIÓN COMERCIAL REQUERIDA") || richMd.includes("COMMERCIAL REVIEW REQUIRED"));
});

check("14. #32 Maintenance is collected into the packet and rendered (previously captured in discovery but never reached the Blueprint at all)", () => {
  assert.ok(richMd.includes("## 32. Mantenimiento / Maintenance"));
  const idx32 = richMd.indexOf("## 32. Mantenimiento");
  const idx33 = richMd.indexOf("## 33.");
  assert.ok(richMd.slice(idx32, idx33).includes("Leonix-managed"));
});

check("15. #45 Definition of Done is present (MD-renumbered from the old #31)", () => {
  assert.ok(richMd.includes("## 45. Definición de Terminado / Definition of Done"));
});

check("16. #1 Project Identity through #47 Source References all appear in ascending numeric order", () => {
  const numbers = [...richMd.matchAll(/^## (\d+)\./gm)].map((m) => Number(m[1]));
  const sorted = [...numbers].sort((a, b) => a - b);
  assert.deepEqual(numbers, sorted);
  assert.ok(numbers[0] === 1);
});

// ===============================================================================================
// Truthful omission — a sparse fixture must never fabricate "N/A" filler
// ===============================================================================================
console.log("\nTruthful omission:");
const { packet: sparsePacket } = buildPacketFor(sparseContext(), "Bare Minimum Site");
const sparseMd = buildWebsiteProjectBlueprintMarkdown(sparsePacket, { version: 1, status: "draft" });

check("17. a category with nothing to say is OMITTED entirely from a sparse packet, never emitted as fabricated N/A filler", () => {
  assert.ok(!/\bN\/A\b/.test(sparseMd));
  // Maintenance was never captured for this fixture -> its own numbered header must not appear.
  assert.ok(!sparseMd.includes("## 32. Mantenimiento"));
});

check("18. genuinely-empty categories resolve to an empty string from render(), never a placeholder string", () => {
  const maintenanceCategory = WEBSITE_BLUEPRINT_CATEGORIES.find((c) => c.key === "maintenance")!;
  assert.equal(maintenanceCategory.render(sparsePacket), "");
});

console.log(`\n${passed} checks passed.`);
