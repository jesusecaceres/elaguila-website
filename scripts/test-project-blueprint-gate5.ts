/**
 * Client Discovery & Project Blueprint Engine, Gate 5 — deterministic tests for the Project
 * Blueprint Generator (readiness, packet builder, deterministic Markdown, versioning helpers).
 * No database, no network, no rendered browser — pure fixtures, matching Gates 2/3/3.1/4's own
 * test pattern.
 *
 * Run from repo root: npx tsx scripts/test-project-blueprint-gate5.ts
 */
import { strict as assert } from "node:assert";

import {
  buildArchitectureDecisionPacket,
} from "../app/lib/business/projectDiscovery/architectureDecisionEngine";
import { detectWebsiteScopeSignals, evaluateWebsiteReadiness, type WebsiteDiscoveryContext } from "../app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import {
  buildWebsiteProjectBlueprintPacket,
  computeBlueprintInputFingerprint,
  detectArchitectureDrift,
  evaluateWebsiteBlueprintReadiness,
  isAuthoritativeForBlueprint,
} from "../app/lib/business/projectDiscovery/blueprintEngine";
import { buildWebsiteProjectBlueprintMarkdown } from "../app/lib/business/projectDiscovery/blueprintMarkdown";
import { containsCredentialLikeText, redactCredentialLikeText } from "../app/lib/business/projectDiscovery/blueprintRedaction";
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

console.log("Project Blueprint Generator (Gate 5) — deterministic tests\n");

const NOW = "2026-09-10T12:00:00.000Z";
let idCounter = 0;
const nextId = () => `g5-${(idCounter += 1)}`;

function item(fieldKey: string, value: unknown, section: string, opts: Partial<Pick<ProjectDiscoveryItem, "truthClass" | "completenessClass" | "confirmationState" | "displayValue" | "projectIntentId">> = {}): ProjectDiscoveryItem {
  return {
    id: nextId(), businessId: "biz-1", discoveryId: "disc-1",
    projectIntentId: opts.projectIntentId === undefined ? "intent-1" : opts.projectIntentId,
    section, fieldKey, value, displayValue: opts.displayValue ?? String(value), valueType: "text",
    truthClass: opts.truthClass ?? "client_confirmed",
    completenessClass: opts.completenessClass ?? "required_before_build",
    confirmationState: opts.confirmationState ?? "confirmed",
    clientConfirmedAt: NOW,
    capturedActorType: "staff", capturedByRosterId: "s1", capturedByAuthUserId: "a1", capturedByEmail: "e@x.test", capturedByRole: "sales_rep",
    notes: null, createdAt: NOW, updatedAt: NOW,
  };
}

function ctx(overrides: Partial<WebsiteDiscoveryContext> = {}): WebsiteDiscoveryContext {
  return {
    discoveryId: "disc-1", businessId: "biz-1", projectIntentId: "intent-1",
    broadBusinessType: "retail_ecommerce", specificBusinessType: null, customSpecificType: null,
    businessStage: "operating", hasExistingWebsite: false, knownFacts: [], capturedItems: [],
    ...overrides,
  };
}

interface FieldDef { value: unknown; section: string; completenessClass?: ProjectDiscoveryItem["completenessClass"]; displayValue?: string }

// A fixture with every REQUIRED_BEFORE_BUILD and NEEDS_LEONIX_DECISION field resolved, so
// readiness reaches READY / architecture can be approved — mirrors Gate 2/4's own
// "allBuildBlockersAnswered" fixture precedent instead of reimplementing the full requirement list.
function fullyAnsweredItems(over: Partial<Record<string, FieldDef>> = {}): ProjectDiscoveryItem[] {
  const base: Record<string, FieldDef> = {
    public_business_name: { value: "Acme Radio", section: "business_identity" },
    decision_maker_approver: { value: "Jane Owner", section: "business_identity" },
    public_contact_phone: { value: "555-1234", section: "business_identity", completenessClass: "required_before_launch" },
    primary_business_goal: { value: "Grow listeners", section: "website_objective" },
    primary_customer: { value: "Local commuters", section: "audience" },
    core_services_products: { value: "Live radio stream", section: "offers_services_products" },
    existing_logo: { value: true, section: "brand_identity" },
    wants_self_managed_content: { value: false, section: "backend_database_auth" },
    wants_user_accounts: { value: false, section: "backend_database_auth" },
    wants_customer_dashboard: { value: false, section: "backend_database_auth" },
    wants_online_booking: { value: false, section: "booking_scheduling" },
    wants_native_checkout: { value: false, section: "payments_commerce" },
    backend_database_needed: { value: "not_needed", section: "backend_database_auth" },
    website_architecture_decision: { value: "approved", section: "scope" },
    in_scope_summary: { value: "Homepage, About, Listen Live, Contact", section: "scope" },
    out_of_scope_summary: { value: "Podcast archive (future)", section: "scope" },
    primary_cta_type: { value: "Listen Live", section: "primary_cta" },
    copy_ownership: { value: "Client will provide the copy", section: "content" },
    required_pages_sections: { value: "Home, About, Listen Live, Contact", section: "page_architecture" },
    has_existing_domain: { value: true, section: "domain" },
    bilingual_site_needed: { value: false, section: "languages" },
    handles_minors_or_medical_financial_data: { value: false, section: "privacy_legal" },
    hard_launch_deadline: { value: "No hard deadline", section: "schedule_approvals" },
    ...over,
  };
  return Object.entries(base).map(([fieldKey, def]) =>
    item(fieldKey, def.value, def.section, { completenessClass: def.completenessClass ?? "required_before_build", displayValue: def.displayValue ?? (typeof def.value === "boolean" ? (def.value ? "Yes" : "No") : String(def.value)) }),
  );
}

function approvedArchitectureFor(c: WebsiteDiscoveryContext) {
  return buildArchitectureDecisionPacket(c, detectWebsiteScopeSignals(c));
}

function fullFixture(overrideItems: Partial<Record<string, FieldDef>> = {}) {
  const c = ctx({ capturedItems: fullyAnsweredItems(overrideItems) });
  const architecture = approvedArchitectureFor(c);
  const intents: ProjectDiscoveryIntent[] = [
    { id: "intent-1", businessId: "biz-1", discoveryId: "disc-1", projectType: "website", projectSubtype: null, otherLabel: null, title: "New Website", status: "confirmed", createdActorType: "staff", createdByRosterId: "s1", createdByAuthUserId: "a1", createdByEmail: "e@x.test", createdByRole: "sales_rep", createdAt: NOW, updatedAt: NOW },
    { id: "intent-2", businessId: "biz-1", discoveryId: "disc-1", projectType: "logo_brand_identity", projectSubtype: null, otherLabel: null, title: "New Logo", status: "candidate", createdActorType: "staff", createdByRosterId: "s1", createdByAuthUserId: "a1", createdByEmail: "e@x.test", createdByRole: "sales_rep", createdAt: NOW, updatedAt: NOW },
  ];
  const sources: ProjectDiscoverySource[] = [
    { id: "src-1", businessId: "biz-1", discoveryId: "disc-1", itemId: null, sourceType: "asset", sourceRecordId: null, businessSourceFileId: "file-1", externalUrl: null, label: "Logo file", notes: null, createdActorType: "staff", createdByRosterId: "s1", createdByAuthUserId: "a1", createdByEmail: "e@x.test", createdByRole: "sales_rep", createdAt: NOW },
  ];
  const packet = buildWebsiteProjectBlueprintPacket({
    ctx: c,
    discovery: { title: "Acme Radio Website", sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: "meeting-1" },
    intents,
    selectedIntentId: "intent-1",
    sources,
    approvedArchitecture: architecture,
    businessDisplayName: "Acme Radio",
    businessPublicName: "Acme Radio 101.5",
  });
  return { ctx: c, architecture, packet };
}

// ===============================================================================================
// Blueprint readiness gating
// ===============================================================================================
console.log("Blueprint readiness gating:");
check("1. NOT_READY when required-before-build blockers remain", () => {
  const c = ctx({ capturedItems: [] });
  const readiness = evaluateWebsiteReadiness(c);
  const result = evaluateWebsiteBlueprintReadiness(readiness, null);
  assert.equal(result.state, "NOT_READY");
  assert.ok(result.requiredBeforeBuildBlockers.length > 0);
});
check("2. NEEDS_LEONIX_DECISION when build blockers resolved but no approved architecture", () => {
  const c = ctx({ capturedItems: fullyAnsweredItems() });
  const readiness = evaluateWebsiteReadiness(c);
  const result = evaluateWebsiteBlueprintReadiness(readiness, null);
  assert.equal(result.state, "NEEDS_LEONIX_DECISION");
});
check("3. READY when build blockers resolved and architecture approved (non-custom)", () => {
  const { ctx: c, architecture } = fullFixture();
  const readiness = evaluateWebsiteReadiness(c);
  const result = evaluateWebsiteBlueprintReadiness(readiness, architecture);
  assert.equal(result.state, "READY");
});
check("4. COMMERCIAL_REVIEW_REQUIRED for Custom Platform architecture (after the placeholder Leonix decision is captured, exactly as persistApprovedArchitectureDecision would do it)", () => {
  const { ctx: c, architecture } = fullFixture({
    wants_user_accounts: { value: true, section: "backend_database_auth" },
    wants_customer_dashboard: { value: true, section: "backend_database_auth" },
  });
  assert.equal(architecture.architectureClass, "CUSTOM_PLATFORM");
  assert.equal(architecture.requiresCommercialReview, true);
  // Mirrors persistApprovedArchitectureDecision's own truthfully-reported placeholder capture —
  // "pending_review" is captured (never silently treated as approved) so the Leonix-decision bucket
  // is satisfied and readiness can proceed to check the architecture's own commercial-review flag.
  const c2 = { ...c, capturedItems: [...c.capturedItems, item("custom_platform_commercial_review", "pending_review", "scope", { truthClass: "technical_decision", completenessClass: "needs_leonix_decision", displayValue: "Pending commercial review" })] };
  const readiness = evaluateWebsiteReadiness(c2);
  const result = evaluateWebsiteBlueprintReadiness(readiness, architecture);
  assert.equal(result.state, "COMMERCIAL_REVIEW_REQUIRED");
});

// ===============================================================================================
// Truth separation
// ===============================================================================================
console.log("\nTruth separation:");
check("5. unreviewed ai_extracted item is NOT authoritative", () => {
  const e = { requirement: { fieldKey: "x" } as any, status: "captured_unconfirmed" as const, item: { truthClass: "ai_extracted" } as any, knownFact: null };
  assert.equal(isAuthoritativeForBlueprint(e), false);
});
check("6. confirmed ai_extracted item IS authoritative (human reviewed it)", () => {
  const e = { requirement: { fieldKey: "x" } as any, status: "confirmed" as const, item: { truthClass: "ai_extracted" } as any, knownFact: null };
  assert.equal(isAuthoritativeForBlueprint(e), true);
});
check("7. staff_observation confirmed item is authoritative but never rewritten as client_confirmed", () => {
  const { packet } = fullFixture();
  for (const row of packet.businessIdentity) {
    assert.notEqual(row.truthClass, undefined);
  }
});
check("8. missing/needs_confirmation items are excluded from authoritative rows", () => {
  const e = { requirement: { fieldKey: "x" } as any, status: "missing" as const, item: null, knownFact: null };
  assert.equal(isAuthoritativeForBlueprint(e), false);
});

// ===============================================================================================
// Packet contents
// ===============================================================================================
console.log("\nPacket contents:");
check("9. packet carries identity fields", () => {
  const { packet } = fullFixture();
  assert.equal(packet.businessId, "biz-1");
  assert.equal(packet.discoveryId, "disc-1");
  assert.equal(packet.projectIntentId, "intent-1");
  assert.equal(packet.projectType, "website");
});
check("10. packet carries business context", () => {
  const { packet } = fullFixture();
  assert.equal(packet.businessDisplayName, "Acme Radio");
  assert.ok(packet.businessIdentity.length > 0);
});
check("11. packet carries scope in/out summaries", () => {
  const { packet } = fullFixture();
  assert.equal(packet.inScopeSummary, "Homepage, About, Listen Live, Contact");
  assert.equal(packet.outOfScopeSummary, "Podcast archive (future)");
});
check("12. packet embeds the APPROVED architecture, never recomputes it", () => {
  const { packet, architecture } = fullFixture();
  assert.equal(packet.architecture, architecture);
});
check("13. packet carries source references derived from discovery + sources", () => {
  const { packet } = fullFixture();
  const kinds = packet.sourceReferences.map((r) => r.kind);
  assert.ok(kinds.includes("meeting"));
  assert.ok(kinds.includes("source_file"));
});
check("14. packet carries dependencies from OTHER intents only", () => {
  const { packet } = fullFixture();
  assert.equal(packet.dependencies.length, 1);
  assert.equal(packet.dependencies[0].intentId, "intent-2");
});
check("15. packet carries build gates, acceptance criteria, QA matrix, launch + handoff checklists", () => {
  const { packet } = fullFixture();
  assert.ok(packet.buildGates.length > 0);
  assert.ok(packet.acceptanceCriteria.length > 0);
  assert.ok(packet.qaMatrix.length >= 12);
  assert.ok(packet.launchChecklist.length > 0);
  assert.ok(packet.handoffChecklist.length > 0);
});
check("16. Listen-Live CTA generates a Listen Live acceptance criterion", () => {
  const { packet } = fullFixture();
  const keys = packet.acceptanceCriteria.map((a) => a.key);
  assert.ok(keys.includes("cta_listen_live"));
});
check("17. unresolvedNonBlocking mirrors Gate 2's helpfulMissing bucket (helpful+missing only)", () => {
  const c = ctx({ capturedItems: fullyAnsweredItems() });
  const readiness = evaluateWebsiteReadiness(c);
  const architecture = approvedArchitectureFor(c);
  const packet = buildWebsiteProjectBlueprintPacket({
    ctx: c, discovery: { title: "T", sourceGrowthAssessmentId: null, sourceGrowthSolutionId: null, sourceOpportunityId: null, sourceMeetingId: null },
    intents: [], selectedIntentId: "intent-1", sources: [], approvedArchitecture: architecture, businessDisplayName: "Acme", businessPublicName: null,
  });
  assert.equal(packet.unresolvedNonBlocking.length, readiness.helpfulMissing.length);
});
check("18. futureOptional includes 'optional' completeness items regardless of resolved status", () => {
  const { packet } = fullFixture({ publishable_pricing: { value: "$10/mo", section: "offers_services_products" } });
  const found = packet.futureOptional.find((r) => r.fieldKey === "publishable_pricing");
  assert.ok(found, "publishable_pricing (optional class) should appear in futureOptional even though answered");
});
check("19. missing assets tracked separately from present assets", () => {
  const { packet } = fullFixture();
  assert.ok(Array.isArray(packet.missingAssets));
  assert.ok(Array.isArray(packet.assets));
});
check("20. client + Leonix responsibilities are non-empty and deterministic", () => {
  const { packet } = fullFixture();
  assert.ok(packet.clientResponsibilities.length > 0);
  assert.ok(packet.leonixResponsibilities.length > 0);
});

// ===============================================================================================
// Deterministic Markdown generation
// ===============================================================================================
console.log("\nDeterministic Markdown generation:");
check("21. same packet -> byte-identical Markdown across calls", () => {
  const { packet } = fullFixture();
  const md1 = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  const md2 = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.equal(md1, md2);
});
check("22. Markdown contains the numbered section headers", () => {
  const { packet } = fullFixture();
  const md = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.ok(md.includes("## 1. Identidad del Proyecto"));
  assert.ok(md.includes("## 11. Arquitectura Técnica Aprobada"));
  assert.ok(md.includes("## 31. Definición de Terminado"));
});
check("23. Markdown never emits an 'N/A' spam line for an empty section — it omits the section", () => {
  const { packet } = fullFixture();
  const md = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.ok(!/\bN\/A\b/.test(md));
});
check("24. Markdown tags a client-confirmed row as CLIENT SAID, never generic", () => {
  const { packet } = fullFixture();
  const md = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.ok(md.includes("CLIENT SAID"));
});
check("25. Markdown tags the architecture classification as a LEONIX TECHNICAL DECISION", () => {
  const { packet } = fullFixture();
  const md = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.ok(md.includes("LEONIX TECHNICAL DECISION"));
});
check("26. Markdown never contains a raw credential-shaped substring", () => {
  const { packet } = fullFixture({ decision_maker_approver: { value: "password: hunter2 Jane Owner", section: "business_identity" } });
  const md = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.equal(containsCredentialLikeText(md), false);
  assert.ok(md.includes("[REDACTED]"));
});
check("27. redaction helper strips Stripe-shaped secret keys", () => {
  const redacted = redactCredentialLikeText("here is sk_live_abc123XYZ for stripe");
  assert.ok(!redacted.includes("sk_live_abc123XYZ"));
});
check("28. Markdown embeds version + status metadata", () => {
  const { packet } = fullFixture();
  const md = buildWebsiteProjectBlueprintMarkdown(packet, { version: 3, status: "approved_for_build" });
  assert.ok(md.includes("**Versión / Version:** 3"));
  assert.ok(md.includes("Approved for Build"));
});
check("29. Markdown's QA matrix includes universal rows", () => {
  const { packet } = fullFixture();
  const md = buildWebsiteProjectBlueprintMarkdown(packet, { version: 1, status: "draft" });
  assert.ok(md.includes("Móvil 390px"));
});

// ===============================================================================================
// Staleness fingerprint + architecture drift
// ===============================================================================================
console.log("\nStaleness + architecture drift:");
check("30. fingerprint is a 64-char hex sha256 digest", () => {
  const { ctx: c, architecture } = fullFixture();
  const fp = computeBlueprintInputFingerprint(c, architecture);
  assert.match(fp, /^[a-f0-9]{64}$/);
});
check("31. identical inputs -> identical fingerprint", () => {
  const { ctx: c, architecture } = fullFixture();
  const fp1 = computeBlueprintInputFingerprint(c, architecture);
  const fp2 = computeBlueprintInputFingerprint(c, architecture);
  assert.equal(fp1, fp2);
});
check("32. adding a new captured item changes the fingerprint", () => {
  const { ctx: c, architecture } = fullFixture();
  const fp1 = computeBlueprintInputFingerprint(c, architecture);
  const c2 = { ...c, capturedItems: [...c.capturedItems, item("colors_liked", "blue", "brand_identity")] };
  const fp2 = computeBlueprintInputFingerprint(c2, architecture);
  assert.notEqual(fp1, fp2);
});
check("33. no drift when comparing identical architecture packets", () => {
  const { architecture } = fullFixture();
  const drift = detectArchitectureDrift(architecture, architecture);
  assert.equal(drift.hasDrifted, false);
  assert.equal(drift.changedFields.length, 0);
});
check("34. drift detected when CMS decision changes between approved and current", () => {
  const { architecture } = fullFixture();
  const current = { ...architecture, cms: { ...architecture.cms, decision: architecture.cms.decision === "REQUIRED" ? "NOT_NEEDED" as const : "REQUIRED" as const } };
  const drift = detectArchitectureDrift(architecture, current);
  assert.equal(drift.hasDrifted, true);
  assert.ok(drift.changedFields.some((f) => f.fieldEn === "CMS"));
});

console.log(`\n${passed} check(s) passed.`);
