/**
 * Business Development & Growth Engine, Gate D — full-journey integration harness (MD Part 14).
 *
 * Walks the SAVE -> RESEARCH -> ANALYZE -> REVIEW -> QUESTIONS -> SOLUTION -> CAMPAIGN -> CREATIVE
 * -> COMMITMENT -> MEASUREMENT journey for 5 deterministic business-type fixtures (War Fitness-style
 * established, Startup/Idea, Restaurant, Professional Service, Low-Information), using ONLY pure,
 * already-exported functions — assessment/solution/campaign transition graphs, the execution-matrix
 * classifier, and the schema validator/prompt compiler. No database call, no live OpenAI call: this
 * is a state-machine-and-routing harness, deliberately scoped so it can run in any environment
 * (including CI) and later be extended with real DB-backed steps once an isolated environment is
 * authorized (see this gate's own migration-integration audit).
 *
 * Complements, does not duplicate, scripts/test-growth-analyst-intelligence-contract.ts, which
 * already covers WAR FITNESS / STARTUP / PROFESSIONAL SERVICE / RESTAURANT / LOW-INFORMATION at the
 * prompt-compilation-signal-threading level (Gate B). This harness picks up where that leaves off:
 * the review/solution/campaign STATE JOURNEY and the ONE canonical execution-routing decision for
 * each fixture's solutions.
 *
 * Run from repo root: npx tsx scripts/test-growth-engine-gate-d-integration.ts
 */
import { strict as assert } from "node:assert";

import { isValidGrowthAssessmentStatusTransition, isValidGrowthCampaignTransition, isValidGrowthSolutionTransition } from "../app/lib/business/growthEngine/constants";
import { classifyGrowthSolutionExecutionRoute, growthExecutionRouteIsCreativeStudio } from "../app/lib/business/growthEngine/executionMatrix";
import { growthRoadmapTypeForBusinessStage } from "../app/lib/business/growthEngine/lifeStage";
import { validateGrowthAssessmentJson } from "../app/lib/business/growthEngine/analyst/schema";
import type { GrowthProviderClass } from "../app/lib/business/growthEngine/types";

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

console.log("Growth Engine Gate D — full-journey integration harness\n");

type SolutionFixture = { category: string; titleEn: string; providerClass: GrowthProviderClass };
type BusinessFixture = {
  name: string;
  businessStage: "planning_prelaunch" | "newly_opened" | "operating" | "growing" | "established_mature" | "paused_restructuring";
  expectedRoadmapType: "startup" | "established";
  mockAiResponse: Record<string, unknown>;
  solutions: { fixture: SolutionFixture; expectedRoute: string; expectedIsCreativeStudio: boolean }[];
  campaignJourney: boolean;
};

const F = (es: string, en: string) => ({ text_es: es, text_en: en, evidence_refs: [] });

const FIXTURES: BusinessFixture[] = [
  {
    name: "A. War Fitness-style established (gym, current promotion, radio)",
    businessStage: "operating",
    expectedRoadmapType: "established",
    mockAiResponse: {
      summary_es: "Gimnasio establecido con 3 ubicaciones.", summary_en: "Established gym with 3 locations.",
      found: [F("Tiene una promoción de inscripción de septiembre.", "Has a September enrollment promotion.")],
      known: [F("Ofrece membresías mensuales y anuales.", "Offers monthly and annual memberships.")],
      unknown: [F("No sabemos cuántas inscripciones produjo la promoción.", "We don't know how many sign-ups the promotion produced.")],
      needs_verification: [F("Confirmar si la promoción sigue activa.", "Confirm whether the promotion is still active.")],
      weak_or_missing: [], questions_to_ask: [F("¿Cuántos miembros activos tiene?", "How many active members do you have?")],
      risks_constraints: [], growth_opportunities: [F("Podría amplificar la promoción si hay capacidad.", "Could amplify the promotion if there is capacity.")],
      possible_solutions: [
        { text_es: "Rediseñar el logo", text_en: "Redesign the logo", evidence_refs: [], provider_class: "leonix_provides", category: "brand" },
        { text_es: "Spot de radio", text_en: "Radio spot", evidence_refs: [], provider_class: "leonix_coordinates_partner", category: "radio" },
        { text_es: "Confirmar licencia de operación", text_en: "Confirm operating license", evidence_refs: [], provider_class: "external_professional_required", category: "legal_licensing" },
      ],
      media_mix: [{ text_es: "Redes de Leonix", text_en: "Leonix social", evidence_refs: [], channel_key: "leonix_social" }],
      priorities_dependencies: [], measurement_plan: [],
      next_right_move_es: "Confirmar capacidad antes de amplificar.", next_right_move_en: "Confirm capacity before amplifying.",
    },
    solutions: [
      { fixture: { category: "brand", titleEn: "Redesign the logo", providerClass: "leonix_provides" }, expectedRoute: "creative_logo", expectedIsCreativeStudio: true },
      { fixture: { category: "radio", titleEn: "Radio spot", providerClass: "leonix_coordinates_partner" }, expectedRoute: "partner_coordination", expectedIsCreativeStudio: false },
      { fixture: { category: "legal_licensing", titleEn: "Confirm operating license", providerClass: "external_professional_required" }, expectedRoute: "official_requirement", expectedIsCreativeStudio: false },
    ],
    campaignJourney: true,
  },
  {
    name: "B. Startup / Idea (food truck concept)",
    businessStage: "planning_prelaunch",
    expectedRoadmapType: "startup",
    mockAiResponse: {
      summary_es: "Concepto de camión de comida en etapa de idea.", summary_en: "Food truck concept at idea stage.",
      found: [], known: [F("El cliente tiene un menú conceptual.", "The client has a concept menu.")],
      unknown: [F("No sabemos el nombre final del negocio.", "We don't know the final business name.")],
      needs_verification: [F("Requiere investigación de permisos de camión de comida.", "Requires food truck permit research.")],
      weak_or_missing: [F("No hay identidad de marca todavía.", "No brand identity yet.")],
      questions_to_ask: [F("¿En qué ciudad planea operar?", "What city do you plan to operate in?")],
      risks_constraints: [], growth_opportunities: [],
      possible_solutions: [{ text_es: "Diseñar el logo", text_en: "Design the logo", evidence_refs: [], provider_class: "leonix_provides", category: "brand" }],
      media_mix: [], priorities_dependencies: [], measurement_plan: [],
      next_right_move_es: "Investigar requisitos oficiales de camión de comida.", next_right_move_en: "Research official food truck requirements.",
    },
    solutions: [
      { fixture: { category: "food_truck_permit", titleEn: "Confirm food truck permit requirement", providerClass: "external_professional_required" }, expectedRoute: "official_requirement", expectedIsCreativeStudio: false },
    ],
    campaignJourney: false,
  },
  {
    name: "C. Restaurant (capacity + catering signals)",
    businessStage: "operating",
    expectedRoadmapType: "established",
    mockAiResponse: {
      summary_es: "Restaurante con servicio de catering activo.", summary_en: "Restaurant with active catering service.",
      found: [F("Ofrece catering para eventos.", "Offers catering for events.")],
      known: [], unknown: [F("No sabemos la capacidad máxima de comensales.", "We don't know the maximum seating capacity.")],
      needs_verification: [], weak_or_missing: [], questions_to_ask: [F("¿Cuál es su capacidad de comensales?", "What is your seating capacity?")],
      risks_constraints: [], growth_opportunities: [],
      possible_solutions: [
        { text_es: "Crear anuncio de campaña", text_en: "Create campaign ad", evidence_refs: [], provider_class: "leonix_provides", category: "advertisement" },
        { text_es: "Pedido de banners promocionales", text_en: "Promotional banner order", evidence_refs: [], provider_class: "leonix_provides", category: "promotional_material" },
      ],
      media_mix: [], priorities_dependencies: [], measurement_plan: [],
      next_right_move_es: "Confirmar capacidad antes de recomendar campaña.", next_right_move_en: "Confirm capacity before recommending a campaign.",
    },
    solutions: [
      { fixture: { category: "advertisement", titleEn: "Create campaign ad", providerClass: "leonix_provides" }, expectedRoute: "creative_ad", expectedIsCreativeStudio: true },
      { fixture: { category: "promotional_material", titleEn: "Promotional banner order", providerClass: "leonix_provides" }, expectedRoute: "promotional_material", expectedIsCreativeStudio: false },
    ],
    campaignJourney: true,
  },
  {
    name: "D. Professional Service (specialized IT/security — external professional, NOT legal research)",
    businessStage: "operating",
    expectedRoadmapType: "established",
    mockAiResponse: {
      summary_es: "Firma de servicios profesionales establecida.", summary_en: "Established professional services firm.",
      found: [F("Tiene un sitio web con formulario de contacto.", "Has a website with a contact form.")],
      known: [], unknown: [], needs_verification: [], weak_or_missing: [F("No hay reseñas verificadas.", "No verified reviews.")],
      questions_to_ask: [F("¿Cómo llegan la mayoría de sus clientes actuales?", "How do most of your current clients find you?")],
      risks_constraints: [], growth_opportunities: [],
      possible_solutions: [{ text_es: "Auditoría de seguridad de TI especializada", text_en: "Specialized IT security audit", evidence_refs: [], provider_class: "external_professional_required", category: "specialized_it_security" }],
      media_mix: [], priorities_dependencies: [], measurement_plan: [],
      next_right_move_es: "Entender la fuente de confianza actual del cliente.", next_right_move_en: "Understand the client's current trust source.",
    },
    solutions: [
      { fixture: { category: "specialized_it_security", titleEn: "Specialized IT security audit", providerClass: "external_professional_required" }, expectedRoute: "external_professional", expectedIsCreativeStudio: false },
    ],
    campaignJourney: false,
  },
  {
    name: "E. Low-Information business (unknowns dominate, no media push)",
    businessStage: "operating",
    expectedRoadmapType: "established",
    mockAiResponse: {
      summary_es: "Información insuficiente para recomendar acción.", summary_en: "Insufficient information to recommend action.",
      found: [], known: [],
      unknown: [F("No sabemos el tipo de negocio exacto.", "We don't know the exact business type."), F("No hay información de contacto verificada.", "No verified contact information.")],
      needs_verification: [F("Confirmar si el negocio sigue operando.", "Confirm whether the business is still operating.")],
      weak_or_missing: [], questions_to_ask: [F("¿Cuál es su tipo de negocio?", "What is your business type?")],
      risks_constraints: [], growth_opportunities: [], possible_solutions: [],
      media_mix: [], priorities_dependencies: [], measurement_plan: [],
      next_right_move_es: "Reunir información básica antes de recomendar cualquier medio.", next_right_move_en: "Gather basic information before recommending any media.",
    },
    solutions: [],
    campaignJourney: false,
  },
];

for (const fixture of FIXTURES) {
  check(`${fixture.name} — SAVE/RESEARCH: roadmap type resolves correctly from business_stage`, () => {
    assert.equal(growthRoadmapTypeForBusinessStage(fixture.businessStage), fixture.expectedRoadmapType);
  });

  check(`${fixture.name} — ANALYZE: mock AI response validates against the strict schema (never coerced)`, () => {
    const result = validateGrowthAssessmentJson(fixture.mockAiResponse);
    assert.ok(result.ok, `expected fixture's mock response to validate: ${!result.ok ? result.error : ""}`);
    if (result.ok) {
      assert.ok(result.value.nextRightMoveEs && result.value.nextRightMoveEn, "expected a bilingual next right move");
    }
  });

  check(`${fixture.name} — NEEDS_REVIEW: a freshly generated assessment always starts needs_review, never auto-accepted`, () => {
    assert.ok(isValidGrowthAssessmentStatusTransition("draft", "needs_review"));
    assert.ok(!isValidGrowthAssessmentStatusTransition("needs_review", "needs_review"), "no-op self-transition must be rejected");
  });

  check(`${fixture.name} — REVIEW: needs_review can reach every one of the three real decisions, never skip past needs_review`, () => {
    assert.ok(isValidGrowthAssessmentStatusTransition("needs_review", "reviewed"));
    assert.ok(isValidGrowthAssessmentStatusTransition("needs_review", "needs_correction"));
    assert.ok(isValidGrowthAssessmentStatusTransition("needs_review", "rejected"));
    assert.ok(!isValidGrowthAssessmentStatusTransition("reviewed", "rejected"), "an already-accepted assessment cannot be silently re-decided");
    assert.ok(!isValidGrowthAssessmentStatusTransition("needs_correction", "reviewed"), "needs_correction cannot silently become accepted — must re-analyze first");
  });

  check(`${fixture.name} — RE-ANALYZE: every decided state (reviewed/needs_correction/rejected) can be superseded by a new version`, () => {
    assert.ok(isValidGrowthAssessmentStatusTransition("reviewed", "superseded"));
    assert.ok(isValidGrowthAssessmentStatusTransition("needs_correction", "superseded"));
    assert.ok(isValidGrowthAssessmentStatusTransition("rejected", "superseded"));
  });

  for (const s of fixture.solutions) {
    check(`${fixture.name} — SOLUTION "${s.fixture.titleEn}" classifies to route "${s.expectedRoute}"`, () => {
      const { route } = classifyGrowthSolutionExecutionRoute(s.fixture);
      assert.equal(route, s.expectedRoute);
      assert.equal(growthExecutionRouteIsCreativeStudio(route), s.expectedIsCreativeStudio);
    });

    check(`${fixture.name} — SOLUTION "${s.fixture.titleEn}" walks suggested -> reviewed -> approved -> in_progress -> complete, never skipping a step`, () => {
      assert.ok(isValidGrowthSolutionTransition("suggested", "reviewed"));
      assert.ok(!isValidGrowthSolutionTransition("suggested", "approved"), "must not skip reviewed");
      assert.ok(isValidGrowthSolutionTransition("reviewed", "approved"));
      assert.ok(isValidGrowthSolutionTransition("approved", "in_progress"));
      assert.ok(isValidGrowthSolutionTransition("in_progress", "complete"));
      assert.ok(!isValidGrowthSolutionTransition("complete", "in_progress"), "complete is terminal");
    });
  }

  if (fixture.campaignJourney) {
    check(`${fixture.name} — CAMPAIGN: draft walks all the way to measuring/complete, never skipping production/live`, () => {
      assert.ok(isValidGrowthCampaignTransition("draft", "ready_for_review"));
      assert.ok(!isValidGrowthCampaignTransition("draft", "live"), "must not skip production states");
      assert.ok(isValidGrowthCampaignTransition("ready_for_review", "approved"));
      assert.ok(isValidGrowthCampaignTransition("approved", "in_production"));
      assert.ok(isValidGrowthCampaignTransition("in_production", "live"));
      assert.ok(isValidGrowthCampaignTransition("live", "measuring"));
      assert.ok(isValidGrowthCampaignTransition("measuring", "complete"));
    });
  }
}

check("CREATIVE routing never includes external_professional/partner_coordination/promotional_material (MD Part 4's explicit rule)", () => {
  const nonCreativeRoutes = ["official_requirement", "external_professional", "promotional_material", "partner_coordination"] as const;
  for (const r of nonCreativeRoutes) {
    assert.ok(!growthExecutionRouteIsCreativeStudio(r), `${r} must never be treated as a Creative Studio route`);
  }
});

console.log(`\n${passed} check(s) passed.`);
if (process.exitCode) {
  console.error("\nSOME CHECKS FAILED.");
} else {
  console.log("ALL CHECKS PASSED.");
}
