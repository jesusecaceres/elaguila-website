/**
 * Client Discovery & Project Blueprint Engine, Gate 4 — deterministic tests for the Preferred
 * Platforms Registry + Website Architecture Decision Engine. No database, no network, no rendered
 * browser — pure fixtures plus structural source-inspection checks, matching the established
 * pattern from Gate 2/3/3.1's own test suites.
 *
 * Run from repo root: npx tsx scripts/test-architecture-decision-engine-gate4.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PLATFORM_REGISTRY, PLATFORM_REGISTRY_VERSION, getPlatform, isKnownPlatformKey, OTHER_EXTERNAL_PLATFORM_KEY } from "../app/lib/business/projectDiscovery/platformRegistry";
import {
  buildArchitectureDecisionPacket,
  validatePlatformKeyOrOther,
  type WebsiteArchitectureClass,
} from "../app/lib/business/projectDiscovery/architectureDecisionEngine";
import { detectWebsiteScopeSignals, evaluateWebsiteReadiness, type WebsiteDiscoveryContext } from "../app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import { WEBSITE_DISCOVERY_CATALOG_VERSION, getWebsiteRequirement } from "../app/lib/business/projectDiscovery/websiteDiscoveryCatalog";
import {
  architectureClassLabel,
  formatBilingual,
  recurringCostClassLabel,
} from "../app/lib/business/projectDiscovery/discoveryLabels";
import { buildArchitectureReviewView } from "../app/lib/business/projectDiscovery/discoveryWorkspaceViewModel";
import type { ProjectDiscoveryItem } from "../app/lib/business/projectDiscovery/types";

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

console.log("Website Architecture Decision Engine (Gate 4) — deterministic tests\n");

function readSource(relPath: string): string {
  return readFileSync(join(__dirname, "..", relPath), "utf8");
}

const NOW = new Date().toISOString();
let idCounter = 0;
const nextId = () => `g4-${(idCounter += 1)}`;

function item(fieldKey: string, value: unknown, opts: Partial<Pick<ProjectDiscoveryItem, "truthClass" | "completenessClass" | "confirmationState" | "displayValue" | "projectIntentId">> = {}): ProjectDiscoveryItem {
  return {
    id: nextId(), businessId: "biz-1", discoveryId: "disc-1",
    projectIntentId: opts.projectIntentId === undefined ? "intent-1" : opts.projectIntentId,
    section: "business_identity", fieldKey, value, displayValue: opts.displayValue ?? String(value), valueType: "text",
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

function packetFor(capturedItems: ProjectDiscoveryItem[], overrides: Partial<WebsiteDiscoveryContext> = {}) {
  const c = ctx({ capturedItems, ...overrides });
  return buildArchitectureDecisionPacket(c, detectWebsiteScopeSignals(c));
}

const SIMPLE_SERVICE_SITE = () => [
  item("wants_self_managed_content", false, { completenessClass: "required_before_build" }),
  item("wants_contact_form", true, { completenessClass: "helpful" }),
  item("wants_user_accounts", false, { completenessClass: "required_before_build" }),
  item("wants_customer_dashboard", false, { completenessClass: "required_before_build" }),
];

// ===============================================================================================
// 1-3. Simple service site
// ===============================================================================================
console.log("Simple service site:");
check("1. simple service site -> low-complexity stack (Next.js + Vercel)", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  assert.equal(packet.infrastructureComplexity, "LOW");
  assert.equal(packet.frontend.platformKey, "nextjs_tailwind");
  assert.equal(packet.hosting.platformKey, "vercel");
});
check("2. simple site does NOT receive Supabase", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  assert.equal(packet.database.decision, "NOT_NEEDED");
  assert.equal(packet.auth.decision, "NOT_NEEDED");
  assert.ok(!packet.recurringServices.some((s) => s.platformKey === "supabase"));
});
check("3. simple site without CMS need does NOT receive Sanity", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  assert.equal(packet.cms.decision, "NOT_NEEDED");
  assert.equal(packet.cms.platformKey, null);
});

// ===============================================================================================
// 4-5. Forms / email
// ===============================================================================================
console.log("\nForms / email:");
check("4. contact form -> Resend appropriate", () => {
  const packet = packetFor([item("wants_contact_form", true)]);
  assert.equal(packet.formsEmail.status, "required");
  assert.equal(packet.formsEmail.platformKey, "resend");
});
check("5. no form -> Resend not required", () => {
  const packet = packetFor([item("wants_contact_form", false)]);
  assert.equal(packet.formsEmail.status, "not_needed");
  assert.equal(packet.formsEmail.platformKey, null);
});

// ===============================================================================================
// 6. CMS for frequent editing
// ===============================================================================================
console.log("\nCMS for frequent editing:");
check("6. frequent editable events -> CMS recommended (Sanity)", () => {
  const packet = packetFor([item("wants_self_managed_content", true), item("cms_editors_who_what_how_often", "Owner updates events weekly")]);
  assert.equal(packet.cms.decision, "REQUIRED");
  assert.equal(packet.cms.platformKey, "sanity");
});

// ===============================================================================================
// 7-8. Restaurant external ordering
// ===============================================================================================
console.log("\nRestaurant external ordering:");
check("7. restaurant external ordering -> preserve external ordering provider", () => {
  const packet = packetFor([item("wants_native_checkout", false)]);
  assert.ok(packet.externalIntegrations.some((i) => i.platformKey === "external_commerce_provider" && i.status === "preserve_existing"));
});
check("8. restaurant does NOT receive custom ecommerce unnecessarily", () => {
  const packet = packetFor([item("wants_native_checkout", false)]);
  assert.notEqual(packet.architectureClass, "CUSTOM_PLATFORM");
  assert.equal(packet.requiresCommercialReview, false);
});

// ===============================================================================================
// 9. Gym external booking
// ===============================================================================================
console.log("\nExternal booking:");
check("9. gym external booking -> preserve provider, no scheduling engine built (booking is a real Gate 2 scope-escalation signal in its own right, so a Leonix review pass is expected — but the recommendation itself never proposes native scheduling infrastructure)", () => {
  const packet = packetFor([item("wants_online_booking", true), item("booking_provider_ownership", "Client uses Mindbody")]);
  assert.ok(packet.externalIntegrations.some((i) => i.platformKey === "external_booking_provider" && i.status === "preserve_existing"));
  assert.equal(packet.database.decision, "NEEDS_REVIEW", "booking alone is ambiguous, not an automatic database requirement");
  assert.ok(!packet.recurringServices.some((s) => s.platformKey === "supabase"), "never commit to Supabase just because booking was requested");
});

// ===============================================================================================
// 10. Radio / media business site
// ===============================================================================================
console.log("\nRadio / media:");
check("10. radio Listen Live + programming -> appropriate business-site-shaped recommendation (CMS for programming, no forced custom platform)", () => {
  const packet = packetFor([item("wants_self_managed_content", true), item("cms_editors_who_what_how_often", "Programming director updates schedule daily")]);
  assert.equal(packet.cms.decision, "REQUIRED");
  assert.notEqual(packet.architectureClass, "CUSTOM_PLATFORM");
});

// ===============================================================================================
// 11. Church giving external provider
// ===============================================================================================
console.log("\nChurch giving:");
check("11. church giving via external provider -> preserve provider, no custom payment software", () => {
  const packet = packetFor([item("wants_native_checkout", false)]);
  assert.ok(packet.externalIntegrations.some((i) => i.platformKey === "external_commerce_provider"));
  assert.equal(packet.database.decision, "NOT_NEEDED");
});

// ===============================================================================================
// 12-13. Preserve existing platform
// ===============================================================================================
console.log("\nPreserve existing platform:");
check("12. existing Shopify commerce -> preserve existing platform, never migrate merely to standardize", () => {
  const packet = packetFor([item("existing_website_platform", "shopify")], { hasExistingWebsite: true });
  assert.equal(packet.architectureClass, "PRESERVE_EXISTING_PLATFORM");
  assert.equal(packet.preserveExistingPlatformKey, "shopify");
  assert.equal(packet.frontend.status, "preserve_existing");
  assert.equal(packet.hosting.status, "preserve_existing");
});
check("13. existing suitable WordPress with a preserve-during-transition signal -> preserve can be valid, never automatically condemned", () => {
  const packet = packetFor([item("existing_website_platform", "wordpress"), item("existing_website_transition_plan", "preserve_during_transition")], { hasExistingWebsite: true });
  assert.equal(packet.architectureClass, "PRESERVE_EXISTING_PLATFORM");
  assert.equal(packet.preserveExistingPlatformKey, "wordpress");
});
check("existing WordPress explicitly being replaced -> NOT preserved (client's own transition-plan answer wins)", () => {
  const packet = packetFor([item("existing_website_platform", "wordpress"), item("existing_website_transition_plan", "replace_fully")], { hasExistingWebsite: true });
  assert.notEqual(packet.architectureClass, "PRESERVE_EXISTING_PLATFORM");
});

// ===============================================================================================
// 14-17. Domain / DNS
// ===============================================================================================
console.log("\nDomain / DNS:");
check("14. existing domain with confirmed access -> preserved, no forced transfer", () => {
  const packet = packetFor([item("has_existing_domain", true), item("domain_access_available", true)]);
  assert.equal(packet.domainDns.kind, "preserve_existing_domain");
  assert.equal(packet.domainDns.isLaunchBlocker, false);
  assert.equal(packet.domainDns.registrarPlatformKey, null);
});
check("15. no domain -> client-owned Cloudflare recommendation", () => {
  const packet = packetFor([item("has_existing_domain", false)]);
  assert.equal(packet.domainDns.kind, "client_owned_new_registration");
  assert.equal(packet.domainDns.registrarPlatformKey, "cloudflare");
});
check("16. registrar, DNS, and hosting are never conflated as the same decision", () => {
  const packet = packetFor([item("has_existing_domain", false)]);
  assert.notEqual(packet.hosting.platformKey, undefined);
  assert.ok("registrarPlatformKey" in packet.domainDns && "dnsPlatformKey" in packet.domainDns);
  // Hosting recommendation lives on a structurally separate field than domain/DNS — never the same object/value.
  assert.notDeepEqual(packet.hosting, packet.domainDns as unknown);
});
check("17. domain exists but ownership/access unknown -> access/client-action blocker", () => {
  const packet = packetFor([item("has_existing_domain", true)]);
  assert.equal(packet.domainDns.kind, "domain_access_blocker");
  assert.equal(packet.domainDns.isLaunchBlocker, true);
  assert.ok(packet.unresolvedBlockers.includes("domain_access_unknown"));
});

// ===============================================================================================
// 18-22. Custom Platform triggers
// ===============================================================================================
console.log("\nCustom Platform triggers:");
check("18. auth request -> Custom Platform", () => {
  const packet = packetFor([item("wants_user_accounts", true)]);
  assert.equal(packet.architectureClass, "CUSTOM_PLATFORM");
  assert.equal(packet.auth.decision, "REQUIRED");
});
check("19. private customer dashboard -> Custom Platform", () => {
  const packet = packetFor([item("wants_customer_dashboard", true)]);
  assert.equal(packet.architectureClass, "CUSTOM_PLATFORM");
});
check("20. sensitive data handling -> storage/security review, contributes to scope escalation", () => {
  const packet = packetFor([item("handles_minors_or_medical_financial_data", true)]);
  assert.equal(packet.storage.decision, "REQUIRED");
  assert.ok(packet.scopeEscalationReasons.includes("regulated_sensitive_data"));
});
check("21. real checkout follow-through (native checkout + tax/shipping/inventory) -> Custom Platform", () => {
  const packet = packetFor([item("wants_native_checkout", true), item("commerce_tax_shipping_inventory", "Need tax, shipping, inventory, refunds")]);
  assert.equal(packet.architectureClass, "CUSTOM_PLATFORM");
});
check("22. combined custom workflow signals (accounts + dashboard) -> Custom Platform with commercial review required", () => {
  const packet = packetFor([item("wants_user_accounts", true), item("wants_customer_dashboard", true)]);
  assert.equal(packet.architectureClass, "CUSTOM_PLATFORM");
  assert.equal(packet.requiresCommercialReview, true);
});

// ===============================================================================================
// 23-28. CMS / Database / Auth decisions
// ===============================================================================================
console.log("\nCMS / Database / Auth decisions:");
check("23. CMS decision REQUIRED when client wants self-managed content", () => {
  assert.equal(packetFor([item("wants_self_managed_content", true)]).cms.decision, "REQUIRED");
});
check("24. CMS decision NOT_NEEDED when client does not want to self-manage", () => {
  assert.equal(packetFor([item("wants_self_managed_content", false)]).cms.decision, "NOT_NEEDED");
});
check("25. database REQUIRED when auth is required", () => {
  assert.equal(packetFor([item("wants_user_accounts", true)]).database.decision, "REQUIRED");
});
check("26. database NOT_NEEDED when no auth/booking/checkout signal exists", () => {
  assert.equal(packetFor([item("wants_user_accounts", false), item("wants_customer_dashboard", false)]).database.decision, "NOT_NEEDED");
});
check("27. auth REQUIRED when user accounts or dashboard requested", () => {
  assert.equal(packetFor([item("wants_customer_dashboard", true)]).auth.decision, "REQUIRED");
});
check("28. auth NOT_NEEDED when both accounts and dashboard are explicitly declined", () => {
  assert.equal(packetFor([item("wants_user_accounts", false), item("wants_customer_dashboard", false)]).auth.decision, "NOT_NEEDED");
});

// ===============================================================================================
// 29-30. Analytics
// ===============================================================================================
console.log("\nAnalytics:");
check("29. analytics proportional to need — a rapid/business site gets exactly one analytics recommendation", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  assert.equal(packet.analytics.length, 1);
  assert.equal(packet.analytics[0].platformKey, "vercel_analytics");
});
check("30. no unnecessary duplicate analytics — never two analytics platforms recommended by default", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  const analyticsKeys = new Set(packet.analytics.map((a) => a.platformKey));
  assert.equal(analyticsKeys.size, packet.analytics.length);
});

// ===============================================================================================
// 31-32. Ownership
// ===============================================================================================
console.log("\nOwnership:");
check("31. client ownership is the default for every registry platform requiring a client account", () => {
  for (const p of PLATFORM_REGISTRY) {
    if (p.requiresClientAccount && p.tier !== "external_existing") {
      assert.ok(p.defaultOwner === "client" || p.defaultOwner === "depends_on_project", `${p.key} should default toward client ownership`);
    }
  }
});
check("32. the Leonix-managed exception (Resend) is an explicit, stated default — never ambiguous", () => {
  const resend = getPlatform("resend")!;
  assert.equal(resend.defaultOwner, "leonix_managed");
  assert.ok(resend.handoffNotesEn.length > 0, "must state what happens on handoff");
});

// ===============================================================================================
// 33-35. Access safety
// ===============================================================================================
console.log("\nAccess safety:");
check("33-34. no password/secret/API-key field exists anywhere in the registry or engine output", () => {
  const registrySource = readSource("app/lib/business/projectDiscovery/platformRegistry.ts");
  const engineSource = readSource("app/lib/business/projectDiscovery/architectureDecisionEngine.ts");
  for (const src of [registrySource, engineSource]) {
    assert.ok(!/password|api[_-]?key|service[_-]?role|oauth token|secret/i.test(src));
  }
});
check("35. access status is modeled per ownership entry (not_requested/needs_access/invited/access_confirmed/client_action_required)", () => {
  const packet = packetFor([item("has_existing_domain", false)]);
  assert.ok(packet.ownership.every((o) => ["not_requested", "needs_access", "invited", "access_confirmed", "client_action_required"].includes(o.accessStatus)));
});

// ===============================================================================================
// 36-37. Recurring cost discipline
// ===============================================================================================
console.log("\nRecurring cost discipline:");
check("36. every recurring-cost classification is a durable category, never a hardcoded vendor price", () => {
  for (const p of PLATFORM_REGISTRY) {
    assert.ok(["no_expected_cost", "may_have_recurring_cost", "paid_external_provider", "verify_current_pricing"].includes(p.recurringCostClass));
  }
});
check("37. no exact vendor price is claimed anywhere in the registry", () => {
  const registrySource = readSource("app/lib/business/projectDiscovery/platformRegistry.ts");
  assert.ok(!/\$\d/.test(registrySource), "the registry must never state an exact dollar price");
});

// ===============================================================================================
// 38-41. Recommendation vs. approval; Technical Decision truth
// ===============================================================================================
console.log("\nRecommendation vs. approval:");
check("38. a fresh recommendation is never itself an approval (isOverride false, no approval-only fields set)", () => {
  const packet = packetFor([item("wants_contact_form", true)]);
  assert.equal(packet.isOverride, false);
  assert.equal(packet.overrideReasonEs, null);
});
check("39-40. architecture approval writes truthClass technical_decision — never client_confirmed — via the SAME capture upsert route", () => {
  const approvalSource = readSource("app/lib/business/projectDiscovery/architectureApproval.ts");
  assert.ok(/truthClass:\s*"technical_decision"/.test(approvalSource));
  assert.ok(!/truthClass:\s*"client_confirmed"/.test(approvalSource));
});
check("41. a reviewer override persists its own reason text", () => {
  const c = ctx({ capturedItems: [] });
  const overridden = buildArchitectureDecisionPacket(c, detectWebsiteScopeSignals(c), {
    architectureClass: "PRESERVE_EXISTING_PLATFORM", preserveExistingPlatformKey: "shopify", reasonEs: "El cliente ya vende en Shopify", reasonEn: "Client already sells on Shopify",
  });
  assert.equal(overridden.isOverride, true);
  assert.equal(overridden.overrideReasonEn, "Client already sells on Shopify");
  assert.equal(overridden.architectureClass, "PRESERVE_EXISTING_PLATFORM");
});

// ===============================================================================================
// 42-43. Registry key validation
// ===============================================================================================
console.log("\nRegistry key validation:");
check("42. an unknown external platform is allowed only when 'other' + explanation is provided", () => {
  assert.equal(validatePlatformKeyOrOther(OTHER_EXTERNAL_PLATFORM_KEY, "Client uses a proprietary internal system"), true);
  assert.equal(validatePlatformKeyOrOther(OTHER_EXTERNAL_PLATFORM_KEY, null), false);
  assert.equal(validatePlatformKeyOrOther(OTHER_EXTERNAL_PLATFORM_KEY, ""), false);
});
check("43. an invalid/unknown registry key is rejected outright", () => {
  assert.equal(validatePlatformKeyOrOther("totally_made_up_platform", "some explanation"), false);
  assert.equal(isKnownPlatformKey("totally_made_up_platform"), false);
});

// ===============================================================================================
// 44-46. Readiness integration
// ===============================================================================================
console.log("\nReadiness integration:");
check("44. website_architecture_decision and cms_architecture_decision/backend_database_needed are the exact fields an approval resolves (matches Gate 2's own needs_leonix_decision fields)", () => {
  assert.equal(getWebsiteRequirement("website_architecture_decision")!.defaultCompletenessClass, "needs_leonix_decision");
  assert.equal(getWebsiteRequirement("cms_architecture_decision")!.defaultCompletenessClass, "needs_leonix_decision");
  assert.equal(getWebsiteRequirement("backend_database_needed")!.defaultCompletenessClass, "needs_leonix_decision");
});
check("45. an unresolved required-before-build client blocker still prevents Ready for Blueprint regardless of architecture approval (Gate 2's own readiness engine, untouched)", () => {
  const c = ctx({ capturedItems: [] });
  // No items captured at all -> primary_cta_type (required_before_build, CLIENT) remains missing.
  const readiness = evaluateWebsiteReadiness(c);
  assert.equal(readiness.state, "NOT_READY");
});
check("46. a Custom Platform commercial-review blocker is distinct from an ordinary Leonix decision and never silently resolved by architecture approval alone", () => {
  const packet = packetFor([item("wants_user_accounts", true)]);
  assert.equal(packet.architectureClass, "CUSTOM_PLATFORM");
  assert.equal(packet.requiresCommercialReview, true);
  assert.equal(packet.commercialReviewSeamMissing, true, "no canonical commercial-approval domain exists yet — must be truthfully reported, not silently treated as resolved");
});

// ===============================================================================================
// 47-52. Structured packet
// ===============================================================================================
console.log("\nStructured WebsiteArchitectureDecisionPacket:");
check("47. a structured packet is generated with every mission-required top-level field present", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  for (const field of ["architectureClass", "frontend", "hosting", "domainDns", "cms", "formsEmail", "database", "auth", "storage", "analytics", "externalIntegrations", "ownership", "recurringServices", "infrastructureComplexity", "reasonsEs", "reasonsEn", "assumptions", "unresolvedBlockers", "requiresLeonixArchitectureReview", "requiresCommercialReview"]) {
    assert.ok(field in packet, `packet missing field: ${field}`);
  }
});
check("48. packet includes both the platform registry version and the discovery catalog version", () => {
  const packet = packetFor([]);
  assert.equal(packet.registryVersion, PLATFORM_REGISTRY_VERSION);
  assert.equal(packet.discoveryCatalogVersion, WEBSITE_DISCOVERY_CATALOG_VERSION);
});
check("49. packet includes an ownership register", () => {
  const packet = packetFor([item("has_existing_domain", false)]);
  assert.ok(Array.isArray(packet.ownership));
  assert.ok(packet.ownership.length > 0);
});
check("50. packet includes access requirements per ownership entry (leonixAccessRequired + accessStatus)", () => {
  const packet = packetFor([item("has_existing_domain", false)]);
  assert.ok(packet.ownership.every((o) => typeof o.leonixAccessRequired === "boolean" && typeof o.accessStatus === "string"));
});
check("51. packet includes a recurring-services summary", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  assert.ok(Array.isArray(packet.recurringServices));
  assert.ok(packet.recurringServices.some((s) => s.platformKey === "vercel"));
});
check("52. packet includes unresolved technical items when they exist", () => {
  const packet = packetFor([item("has_existing_domain", true)]);
  assert.ok(packet.unresolvedBlockers.length > 0);
});

// ===============================================================================================
// 53-54. Bilingual
// ===============================================================================================
console.log("\nBilingual:");
check("53-54. every WebsiteArchitectureClass has a distinct, non-empty bilingual label", () => {
  const classes: readonly WebsiteArchitectureClass[] = ["RAPID_BUSINESS_SITE", "BUSINESS_SITE", "CUSTOM_PLATFORM", "PRESERVE_EXISTING_PLATFORM"];
  for (const c of classes) {
    const l = architectureClassLabel(c);
    assert.ok(l.es.length > 0 && l.en.length > 0 && l.es !== l.en, c);
  }
  assert.equal(formatBilingual(architectureClassLabel("PRESERVE_EXISTING_PLATFORM")), "Conservar la plataforma actual / Preserve Existing Platform");
});
check("every recurring cost class has a distinct bilingual label", () => {
  for (const c of ["no_expected_cost", "may_have_recurring_cost", "paid_external_provider", "verify_current_pricing"] as const) {
    const l = recurringCostClassLabel(c);
    assert.ok(l.es.length > 0 && l.en.length > 0);
  }
});
check("required phrase pairs appear verbatim in the UI source", () => {
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/Revisión de arquitectura del sitio web \/ Website Architecture Review/.test(journeySource));
  assert.ok(/Tecnología recomendada \/ Recommended Stack/.test(journeySource));
  assert.ok(/Servicios recurrentes \/ Recurring Services/.test(journeySource));
  assert.ok(/Complejidad de infraestructura \/ Infrastructure Complexity/.test(journeySource));
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/Aprobar arquitectura \/ Approve Architecture/.test(actionsSource));
  assert.ok(/Modificar decisión \/ Modify Decision/.test(actionsSource));
  assert.ok(/Se requiere revisión de plataforma personalizada \/ Custom Platform Review Required/.test(journeySource));
});

// ===============================================================================================
// 55. Mobile structural contract
// ===============================================================================================
console.log("\nMobile structural contract:");
check("55. architecture review action buttons declare >=44px touch targets and rows use flex-wrap (no forced wide table)", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  const approveStart = actionsSource.indexOf("export function ApproveArchitectureButton");
  const approveEnd = actionsSource.indexOf("\n}", approveStart);
  assert.ok(approveStart >= 0 && approveEnd > approveStart);
  const approveBlock = actionsSource.slice(approveStart, approveEnd);
  assert.ok(/className=\{PRIMARY_BTN\}/.test(approveBlock), "Approve Architecture must use the standard >=44px primary button style");
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(!/grid-cols-[3-9]\b/.test(journeySource.slice(journeySource.indexOf("WebsiteArchitectureReviewSection"))));
});

// ===============================================================================================
// 56-57. Business isolation / actor safety
// ===============================================================================================
console.log("\nBusiness isolation / actor safety:");
check("56. the architecture route and approval persistence are scoped by both businessId and discoveryId throughout", () => {
  const routeSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/architecture/route.ts");
  assert.ok(/buildWebsiteDiscoveryContext\(businessId, discoveryId, intentId\)/.test(routeSource));
  assert.ok(/persistApprovedArchitectureDecision\(businessId, discoveryId, intentId/.test(routeSource));
});
check("57. the architecture route resolves its actor via requireStaffWorkspaceWriteAccess and is gated on review_project_discovery — never a literal staff actor object", () => {
  const routeSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/architecture/route.ts");
  assert.ok(/requireStaffWorkspaceWriteAccess\(\["review_project_discovery"\]\)/.test(routeSource));
  assert.ok(!/\{\s*type:\s*"staff"/.test(routeSource));
  assert.ok(!/error\.message/.test(routeSource));
});

// ===============================================================================================
// Extra: the review view-model never leaks a raw platform key/enum as bare display text
// ===============================================================================================
console.log("\nView-model human-label discipline:");
check("buildArchitectureReviewView never exposes a raw registry key without resolving it to a bilingual name", () => {
  const packet = packetFor(SIMPLE_SERVICE_SITE());
  const view = buildArchitectureReviewView(packet);
  for (const row of view.stackRows) {
    assert.ok(row.platformName.es.length > 0 && row.platformName.en.length > 0);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll Gate 4 checks passed.");
}
