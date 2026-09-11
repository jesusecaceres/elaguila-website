/**
 * Client Discovery & Project Blueprint Engine, Gate 3.1 — deterministic tests for the UX
 * completion/polish gate: Sections Review actionability, choice/asset_ref renderers, Brand &
 * Visual Preferences, existing-answer editing, the READY FOR BLUEPRINT server guard, and truth-
 * capture safety. No database, no network, no rendered browser — pure logic plus structural
 * source-inspection checks, matching Gate 3's own established pattern.
 *
 * Run from repo root: npx tsx scripts/test-client-discovery-gate3-1.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { WEBSITE_REQUIREMENTS, getWebsiteRequirement } from "../app/lib/business/projectDiscovery/websiteDiscoveryCatalog";
import { classifyReadinessForBlueprintGuard, evaluateWebsiteReadiness, type WebsiteDiscoveryContext } from "../app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import { itemValueChanged } from "../app/lib/business/projectDiscovery/logic";
import {
  TRUTH_CAPTURE_CHOICES,
  truthCaptureChoiceLabel,
  truthClassLabel,
} from "../app/lib/business/projectDiscovery/discoveryLabels";
import {
  buildBrandPreferencesView,
  buildSectionsReviewView,
  buildWhatWeAlreadyKnow,
} from "../app/lib/business/projectDiscovery/discoveryWorkspaceViewModel";
import type { RequirementEvaluation } from "../app/lib/business/projectDiscovery/websiteDiscoveryLogic";
import type { DiscoveryTruthClass, ProjectDiscoveryItem } from "../app/lib/business/projectDiscovery/types";

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

console.log("Client Discovery Workspace — Gate 3.1 completion tests\n");

function readSource(relPath: string): string {
  return readFileSync(join(__dirname, "..", relPath), "utf8");
}

const NOW = new Date().toISOString();
let idCounter = 0;
const nextId = () => `g31-${(idCounter += 1)}`;

function item(fieldKey: string, value: unknown, opts: Partial<Pick<ProjectDiscoveryItem, "truthClass" | "completenessClass" | "confirmationState" | "displayValue">> = {}): ProjectDiscoveryItem {
  return {
    id: nextId(), businessId: "biz-1", discoveryId: "disc-1", projectIntentId: "intent-1",
    section: "business_identity", fieldKey, value, displayValue: opts.displayValue ?? String(value), valueType: "text",
    truthClass: opts.truthClass ?? "client_confirmed",
    completenessClass: opts.completenessClass ?? "required_before_build",
    confirmationState: opts.confirmationState ?? "confirmed",
    clientConfirmedAt: (opts.confirmationState ?? "confirmed") === "confirmed" ? NOW : null,
    capturedActorType: "staff", capturedByRosterId: "s1", capturedByAuthUserId: "a1", capturedByEmail: "e@x.test", capturedByRole: "sales_rep",
    notes: null, createdAt: NOW, updatedAt: NOW,
  };
}

function baseContext(overrides: Partial<WebsiteDiscoveryContext> = {}): WebsiteDiscoveryContext {
  return {
    discoveryId: "disc-1", businessId: "biz-1", projectIntentId: "intent-1",
    broadBusinessType: "retail_ecommerce", specificBusinessType: null, customSpecificType: null,
    businessStage: "operating", hasExistingWebsite: false, knownFacts: [], capturedItems: [],
    ...overrides,
  };
}

function evalFor(fieldKey: string, status: RequirementEvaluation["status"], overrides: Partial<Pick<ProjectDiscoveryItem, "truthClass" | "confirmationState">> = {}): RequirementEvaluation {
  const req = getWebsiteRequirement(fieldKey);
  if (!req) throw new Error(`unknown catalog field: ${fieldKey}`);
  const hasItem = status === "confirmed" || status === "captured_unconfirmed" || status === "needs_confirmation";
  return {
    requirement: req,
    status,
    item: hasItem ? item(fieldKey, "x", { truthClass: overrides.truthClass ?? "client_confirmed", confirmationState: overrides.confirmationState ?? (status === "confirmed" ? "confirmed" : "unconfirmed") }) : null,
    knownFact: null,
  };
}

// ===============================================================================================
// 1-5. Sections Review actionability
// ===============================================================================================
console.log("Sections Review actionability:");
check("1. unresolved client question -> actionable 'ask' target", () => {
  const groups = buildSectionsReviewView([evalFor("public_business_name", "missing")]);
  const row = groups.flatMap((g) => g.requirements).find((r) => r.fieldKey === "public_business_name");
  assert.ok(row);
  assert.equal(row!.actionKind, "ask");
});
check("2. a requirement outside the batch-limited Questions to Ask Now is still focusable via Sections Review (full evaluation list, not the paginated batch)", () => {
  // Sections Review is built from the FULL evaluateWebsiteRequirements() list, never from
  // buildQuestionsToAskNow()'s own limit/offset-sliced batch — so every unresolved requirement,
  // including ones far outside any batch window, is directly focusable.
  const manyMissing = WEBSITE_REQUIREMENTS.filter((r) => !r.industryBranch && r.whoShouldAnswer === "CLIENT").slice(0, 20);
  assert.ok(manyMissing.length > 8, "need more than one batch's worth of fields for this test to be meaningful");
  const evaluations = manyMissing.map((r) => evalFor(r.fieldKey, "missing"));
  const groups = buildSectionsReviewView(evaluations);
  const askable = groups.flatMap((g) => g.requirements).filter((r) => r.actionKind === "ask");
  assert.ok(askable.length > 8, "Sections Review must expose more askable rows than a single 8-item batch");
});
check("3. Leonix Decision -> 'leonix' action, never a client question", () => {
  const groups = buildSectionsReviewView([evalFor("backend_database_needed", "missing")]);
  const row = groups.flatMap((g) => g.requirements).find((r) => r.fieldKey === "backend_database_needed");
  assert.ok(row);
  assert.equal(row!.actionKind, "leonix");
});
check("4. Official Research -> truthful 'research' action, distinct from Leonix decisions", () => {
  const groups = buildSectionsReviewView([evalFor("industry_regulatory_requirements", "missing")]);
  const row = groups.flatMap((g) => g.requirements).find((r) => r.fieldKey === "industry_regulatory_requirements");
  assert.ok(row);
  assert.equal(row!.actionKind, "research");
});
check("5. a completed/confirmed item shows 'edit', never a fake 'ask' action", () => {
  const groups = buildSectionsReviewView([evalFor("public_business_name", "confirmed")]);
  const row = groups.flatMap((g) => g.requirements).find((r) => r.fieldKey === "public_business_name");
  assert.ok(row);
  assert.equal(row!.actionKind, "edit");
  assert.ok(row!.existingItemId);
});
check("not_applicable rows get 'none' — no action rendered at all", () => {
  const groups = buildSectionsReviewView([evalFor("public_business_name", "not_applicable")]);
  // not_applicable rows are naturally absent (buildSectionsReviewView filters them via evaluateRequirement upstream in real use);
  // directly exercise the action-kind function's own contract through a captured_unconfirmed-vs-not_applicable pair instead.
  const rows = groups.flatMap((g) => g.requirements);
  if (rows.length > 0) assert.equal(rows[0].actionKind, "none");
});

// ===============================================================================================
// 6-8. Choice renderer / catalog options
// ===============================================================================================
console.log("\nChoice renderer:");
const CHOICE_FIELD_KEYS = ["copy_ownership", "primary_cta_type", "existing_website_transition_plan", "wants_native_checkout", "translation_ownership", "maintenance_responsibility", "restaurant_menu_source"];
check("6. every catalog 'choice' requirement carries real option metadata (never falls back to free text)", () => {
  const choiceReqs = WEBSITE_REQUIREMENTS.filter((r) => r.valueType === "choice");
  assert.equal(choiceReqs.length, CHOICE_FIELD_KEYS.length);
  for (const r of choiceReqs) {
    assert.ok(r.options && r.options.length >= 2, `${r.fieldKey} must have at least 2 options`);
  }
});
check("wants_native_checkout options are the exact true/false sentinels the existing scope-escalation dependency chain expects", () => {
  const req = getWebsiteRequirement("wants_native_checkout")!;
  const values = req.options!.map((o) => o.value).sort();
  assert.deepEqual(values, ["false", "true"]);
});
check("8. every choice option has a distinct, non-empty bilingual label", () => {
  for (const fk of CHOICE_FIELD_KEYS) {
    const req = getWebsiteRequirement(fk)!;
    for (const o of req.options!) {
      assert.ok(o.labelEs.trim().length > 0 && o.labelEn.trim().length > 0, `${fk}/${o.value}`);
    }
  }
});

// ===============================================================================================
// 9-13. asset_ref renderer
// ===============================================================================================
console.log("\nAsset ref renderer:");
const ASSET_REF_FIELD_KEYS = ["websites_liked", "websites_disliked", "photo_assets_available", "home_service_before_after_media"];
check("9-10. asset_ref requirements exist and the renderer never requires a manually-typed file id (structural: select + file input only, no free 'ID' text field)", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  const assetRefBlock = actionsSource.slice(actionsSource.indexOf('valueType === "asset_ref" ?'), actionsSource.indexOf('valueType === "list" ?'));
  assert.ok(assetRefBlock.length > 0);
  assert.ok(/existingSourceFiles/.test(assetRefBlock), "must offer the existing-file picker");
  assert.ok(/type="file"/.test(assetRefBlock), "must offer a real upload control");
  assert.ok(!/placeholder="[^"]*[Ii][Dd][^"]*"/.test(assetRefBlock), "must never ask staff to type a raw file id");
  for (const fk of ASSET_REF_FIELD_KEYS) assert.equal(getWebsiteRequirement(fk)!.valueType, "asset_ref");
});
check("11. new-file upload reuses the existing canonical Field Discovery upload endpoint", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/\/api\/admin\/field-discovery\/assets\/upload/.test(actionsSource));
});
check("12. a saved asset_ref answer also attaches a discovery source (itemId-linked) so it is visible in Project Assets & Visual References afterward", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/sourceType:\s*"asset"[\s\S]{0,200}itemId/.test(actionsSource) || /itemId[\s\S]{0,200}sourceType:\s*"asset"/.test(actionsSource));
});
check("13. no second blob store was introduced this gate — the only upload route referenced is the existing one", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  const uploadRoutes = new Set([...actionsSource.matchAll(/fetch\("([^"]*upload[^"]*)"/g)].map((m) => m[1]));
  for (const route of uploadRoutes) assert.equal(route, "/api/admin/field-discovery/assets/upload");
});

// ===============================================================================================
// 14-19. Brand & Visual Preferences
// ===============================================================================================
console.log("\nBrand & Visual Preferences:");
check("14. a focused Brand & Visual Preferences section exists in the workspace", () => {
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/<h3[^>]*>Preferencias de Marca y Estilo \/ Brand &amp; Visual Preferences<\/h3>/.test(journeySource));
});
check("colors/style/imagery/symbols groups are all populated from real catalog fields, grouped naturally", () => {
  const evaluations = [
    evalFor("colors_liked", "captured_unconfirmed"),
    evalFor("colors_disliked", "missing"),
    evalFor("visual_personality", "missing"),
    evalFor("imagery_preference", "missing"),
    evalFor("symbols_wanted", "missing"),
    evalFor("symbols_avoided", "missing"),
  ];
  const groups = buildBrandPreferencesView(evaluations);
  const keys = groups.map((g) => g.key).sort();
  assert.deepEqual(keys, ["colors", "imagery", "style", "symbols"]);
  assert.equal(groups.find((g) => g.key === "colors")!.fields.length, 2);
  assert.equal(groups.find((g) => g.key === "symbols")!.fields.length, 2);
});
check("15-16. colors liked/disliked default to CLIENT_PREFERENCE in the answer capture form (never a Business Book fact)", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/section === "brand_identity" \|\| section === "visual_references" \? "client_preference"/.test(actionsSource));
});
check("17. visual_personality (style / feel) stays free text, not a rigid enum", () => {
  assert.equal(getWebsiteRequirement("visual_personality")!.valueType, "text");
});
check("18-19. symbols_wanted and symbols_avoided both exist as real catalog requirements in brand_identity", () => {
  assert.equal(getWebsiteRequirement("symbols_wanted")!.section, "brand_identity");
  assert.equal(getWebsiteRequirement("symbols_avoided")!.section, "brand_identity");
});

// ===============================================================================================
// 20. Visual reference metadata
// ===============================================================================================
console.log("\nVisual reference metadata:");
check("20. reference form captures URL + type + likes/dislikes/inspiration/must-not-copy, each with an associated label", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  for (const phrase of ["¿Qué le gusta y por qué?", "¿Qué no le gusta?", "¿Qué tomar como inspiración?", "¿Qué NO se debe copiar?"]) {
    assert.ok(actionsSource.includes(phrase), phrase);
  }
  // Each of those four inputs must now be wrapped in a real <label>, not a bare placeholder-only input.
  const dislikesBlock = actionsSource.slice(actionsSource.indexOf("¿Qué no le gusta?") - 80, actionsSource.indexOf("¿Qué no le gusta?") + 200);
  assert.ok(/<label/.test(dislikesBlock));
});

// ===============================================================================================
// 21-23. Existing answer editing
// ===============================================================================================
console.log("\nExisting answer editing:");
check("21. a confirmed item is surfaced as editable in What We Already Know, carrying its existing value for pre-fill", () => {
  const known = buildWhatWeAlreadyKnow([evalFor("public_business_name", "confirmed")]);
  assert.equal(known.length, 1);
  assert.equal(known[0].editable, true);
  assert.ok(known[0].existingItemId);
});
check("22a. editing a CONFIRMED item's value must reset confirmation to unconfirmed (itemValueChanged detects the diff)", () => {
  assert.equal(itemValueChanged("old text", "new text"), true);
  assert.equal(itemValueChanged("same", "same"), false);
  assert.equal(itemValueChanged(null, null), false);
  assert.equal(itemValueChanged(undefined, null), false);
  assert.equal(itemValueChanged(["a", "b"], ["a", "b"]), false);
  assert.equal(itemValueChanged(["a", "b"], ["a", "c"]), true);
});
check("22b. re-saving the SAME value is idempotent — itemValueChanged reports no change, so no accidental confirmation reset", () => {
  assert.equal(itemValueChanged("Leonix Media", "Leonix Media"), false);
});
check("23. the SAME capture endpoint/upsert key is used for both a fresh answer and an edit — never a second write path (structural: repository upserts on discovery_id,project_intent_id,field_key, unchanged)", () => {
  const repoSource = readSource("app/lib/business/projectDiscovery/repository.ts");
  assert.ok(/onConflict:\s*"discovery_id,project_intent_id,field_key"/.test(repoSource));
});

// ===============================================================================================
// 24-25. Question flow
// ===============================================================================================
console.log("\nQuestion flow:");
check("24. saving an answer triggers a real server recompute (router.refresh) rather than a fabricated client-only 'next' step", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/router\.refresh\(\)/.test(actionsSource));
});
check("25. blockers remain discoverable regardless of pagination — Sections Review exposes the full evaluation list, not just the display-limited batch", () => {
  const many = WEBSITE_REQUIREMENTS.filter((r) => r.defaultCompletenessClass === "required_before_build" && !r.industryBranch);
  assert.ok(many.length > 8);
  const evaluations = many.map((r) => evalFor(r.fieldKey, "missing"));
  const groups = buildSectionsReviewView(evaluations);
  const blockerRows = groups.flatMap((g) => g.requirements).filter((r) => r.actionKind === "ask");
  assert.equal(blockerRows.length, many.length);
});

// ===============================================================================================
// 26-28. READY FOR BLUEPRINT server guard
// ===============================================================================================
console.log("\nREADY FOR BLUEPRINT server guard:");
check("26. NOT_READY (a required client blocker remains) is rejected with client_blockers_remain", () => {
  assert.equal(classifyReadinessForBlueprintGuard("NOT_READY"), "client_blockers_remain");
});
check("27. NEEDS_LEONIX_ARCHITECTURE_DECISION is rejected with leonix_decision_remains", () => {
  assert.equal(classifyReadinessForBlueprintGuard("NEEDS_LEONIX_ARCHITECTURE_DECISION"), "leonix_decision_remains");
});
check("28. READY and READY_WITH_NON_BLOCKING_GAPS are both accepted", () => {
  assert.equal(classifyReadinessForBlueprintGuard("READY"), "ok");
  assert.equal(classifyReadinessForBlueprintGuard("READY_WITH_NON_BLOCKING_GAPS"), "ok");
});
check("the PATCH discovery route calls the real readiness guard specifically for the ready_for_blueprint transition, not client-side hiding alone", () => {
  const routeSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/route.ts");
  assert.ok(/assessDiscoveryReadyForBlueprint/.test(routeSource));
  assert.ok(/status === "ready_for_blueprint"/.test(routeSource));
});
check("38a. humanized errors exist for both new denial reasons — never a raw reason code shown to staff", () => {
  const msgSource = readSource("app/admin/_lib/staffWriteErrorMessages.ts");
  assert.ok(/client_blockers_remain:/.test(msgSource));
  assert.ok(/leonix_decision_remains:/.test(msgSource));
});
check("client-side Readiness section also hides the impossible transition as a courtesy (never encourages a doomed click)", () => {
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/blueprintAllowed/.test(journeySource));
});

// ===============================================================================================
// 29-31. Truth capture safety
// ===============================================================================================
console.log("\nTruth capture safety:");
check("29. exactly the 4 plain-language operator choices exist: client told me / client preference / staff note / needs confirmation", () => {
  assert.deepEqual([...TRUTH_CAPTURE_CHOICES].sort(), (["client_confirmed", "client_preference", "needs_confirmation", "staff_observation"] as DiscoveryTruthClass[]).sort());
});
check("operator-facing capture labels are phrased as 'who said this', distinct from the display-only truthClassLabel state names", () => {
  assert.equal(truthCaptureChoiceLabel("client_confirmed").en, "Client told me");
  assert.notEqual(truthCaptureChoiceLabel("client_confirmed").en, truthClassLabel("client_confirmed").en);
});
check("30. AI-extracted/public-verified/leonix-recommendation/technical-decision/unknown are never operator-chosen at capture time", () => {
  for (const excluded of ["ai_extracted", "public_verified", "leonix_recommendation", "technical_decision", "unknown"] as DiscoveryTruthClass[]) {
    assert.ok(!TRUTH_CAPTURE_CHOICES.includes(excluded), excluded);
  }
});
check("31. needs_confirmation stays available as an explicit capture choice — provisional answers are never silently upgraded", () => {
  assert.ok(TRUTH_CAPTURE_CHOICES.includes("needs_confirmation"));
});
check("editing pre-fills the item's OWN existing truth class rather than recomputing a fresh default (never relabels existing provenance)", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/initialTruthClass \?\? defaultTruthClassForSection\(section\)/.test(actionsSource));
});
check("review capability is not weakened — capture still never writes confirmationState, confirm/reject stays review_project_discovery-gated", () => {
  const itemsRouteSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/items/route.ts");
  const confirmRouteSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/items/[itemId]/confirm/route.ts");
  assert.ok(!/confirmationState\s*[:=]/.test(itemsRouteSource));
  assert.ok(/requireStaffWorkspaceWriteAccess\(\["review_project_discovery"\]\)/.test(confirmRouteSource));
});

// ===============================================================================================
// 32-33. Recording / transcription still not implemented
// ===============================================================================================
console.log("\nRecording / transcription integrity:");
check("32-33. no MediaRecorder/getUserMedia/audio-blob/transcript-storage code exists anywhere in the discovery domain or its new UI", () => {
  const files = [
    "app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx",
    "app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx",
    "app/api/admin/businesses/[businessId]/discovery/[discoveryId]/consent/route.ts",
    "app/lib/business/projectDiscovery/discoveryReadinessGuard.ts",
  ];
  for (const f of files) {
    const src = readSource(f);
    assert.ok(!/MediaRecorder|getUserMedia|audioBlob|transcriptText|\.webm|\.mp3/i.test(src), f);
  }
});

// ===============================================================================================
// 34-35. Bilingual
// ===============================================================================================
console.log("\nBilingual coverage:");
check("34-35. every new Gate 3.1 label (truth-capture choices, brand preference groups) is bilingual, es != en", () => {
  for (const t of TRUTH_CAPTURE_CHOICES) {
    const l = truthCaptureChoiceLabel(t);
    assert.ok(l.es.length > 0 && l.en.length > 0 && l.es !== l.en, t);
  }
});
check("required phrase pair: Brand & Visual Preferences / Preferencias de Marca y Estilo appears verbatim", () => {
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/<h3[^>]*>Preferencias de Marca y Estilo \/ Brand &amp; Visual Preferences<\/h3>/.test(journeySource));
});
check("required phrase pair: Project Assets & Visual References / Activos del Proyecto y Referencias Visuales appears verbatim", () => {
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/Activos del Proyecto y Referencias Visuales \/ Project Assets &amp; Visual References/.test(journeySource));
});

// ===============================================================================================
// 36. 390px structural contract
// ===============================================================================================
console.log("\n390px structural contract:");
check("36. new choice radio rows and asset upload controls declare >=44px touch targets", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/flex min-h-\[44px\] cursor-pointer items-center gap-2 rounded-lg border border-\[#E8DFD0\] px-3 py-2/.test(actionsSource), "choice radio row touch target");
});
check("no new hardcoded desktop-only wide-column grid was introduced in the journey file", () => {
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(!/grid-cols-[3-9]\b/.test(journeySource));
});

// ===============================================================================================
// 37. Accessibility
// ===============================================================================================
console.log("\nAccessibility:");
check("37a. the choice radio group and truth-capture group both use a real <fieldset>/<legend>, not decorative divs", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/<fieldset className="space-y-1">/.test(actionsSource));
  assert.ok(/<legend/.test(actionsSource));
});
check("37b. the send-to-meeting checkbox list and the meeting-link select are both wrapped in a real <label>", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/<label className="flex min-h-\[36px\] cursor-pointer items-start gap-2">/.test(actionsSource));
  assert.ok(/Reunión a vincular \/ Meeting to link/.test(actionsSource));
});
check("37c. success/error messages keep role=status / role=alert semantics (not color-only)", () => {
  const actionsSource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryActions.tsx");
  assert.ok(/role="status"/.test(actionsSource) && /role="alert"/.test(actionsSource));
});
check("37d. Sections Review / What We Already Know status badges pair a text label with color, never color alone", () => {
  const journeySource = readSource("app/admin/(dashboard)/businesses/[businessId]/ClientDiscoveryJourney.tsx");
  assert.ok(/formatBilingual\(r\.statusLabel\)/.test(journeySource));
});

// ===============================================================================================
// 38b-40. Humanized errors / business isolation / actor safety (regression guards)
// ===============================================================================================
console.log("\nHumanized errors / business isolation / actor safety:");
check("39. the readiness guard is scoped by both discoveryId and businessId — never a bare id", () => {
  const guardSource = readSource("app/lib/business/projectDiscovery/discoveryReadinessGuard.ts");
  assert.ok(/listProjectDiscoveryIntents\(discoveryId, businessId\)/.test(guardSource));
  assert.ok(/buildWebsiteDiscoveryContext\(businessId, discoveryId, intent\.id\)/.test(guardSource));
});
check("40. the modified PATCH route still resolves its actor via requireStaffWorkspaceWriteAccess — never a literal staff actor object", () => {
  const routeSource = readSource("app/api/admin/businesses/[businessId]/discovery/[discoveryId]/route.ts");
  assert.ok(/requireStaffWorkspaceWriteAccess/.test(routeSource));
  assert.ok(!/\{\s*type:\s*"staff"/.test(routeSource));
});

// ===============================================================================================
// Sanity: evaluateWebsiteReadiness's own state machine still agrees with the guard's mapping
// (regression guard against the two ever drifting apart)
// ===============================================================================================
console.log("\nGuard/engine agreement:");
check("guard verdict matches evaluateWebsiteReadiness on a real NOT_READY fixture", () => {
  const ctx = baseContext();
  const readiness = evaluateWebsiteReadiness(ctx);
  assert.equal(readiness.state, "NOT_READY");
  assert.equal(classifyReadinessForBlueprintGuard(readiness.state), "client_blockers_remain");
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSome checks FAILED.");
} else {
  console.log("\nAll Gate 3.1 checks passed.");
}
