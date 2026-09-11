/**
 * Client Discovery & Project Blueprint Engine, Gate 10.2 — discovery catalog for
 * "launch_package_multi_project" (MD §7 "Launch Package / Multi-project engagement", §19
 * <multi_project_discovery>, Gate 10.2 <phase_10>). Deliberately tiny: Launch Package is an
 * ORCHESTRATION entry point over the EXISTING one-discovery/many-intents/shared-truth/dependency
 * architecture (already proven live in Gate 10.1 GAP9 for Website+Logo+Print+Campaign combined) —
 * never a duplicate mega-blueprint pretending to replace each component project's own real
 * Blueprint. This catalog only captures which components are wanted and how they relate; the
 * live roll-up state itself is computed by launchPackageRollup.ts from the sibling intents'
 * REAL, already-authoritative blueprint/readiness state — never duplicated here.
 */
import type { SpecializedRequirementDefinition } from "./specializedDiscoveryEngine";

export const LAUNCH_PACKAGE_CATALOG_VERSION = "launch_package_discovery_v1";

export type LaunchPackageSection = "components" | "coordination" | "approval";

export const LAUNCH_PACKAGE_SECTIONS: readonly LaunchPackageSection[] = ["components", "coordination", "approval"];

type LaunchPackageReq = SpecializedRequirementDefinition<LaunchPackageSection>;

export const LAUNCH_PACKAGE_REQUIREMENTS: readonly LaunchPackageReq[] = [
  {
    fieldKey: "launch_package_components", section: "components",
    labelEn: "Component projects needed", labelEs: "Proyectos componentes necesarios",
    operatorGuidanceEn: "Real named project types (Website, Logo, Business Cards, Campaign, etc.) — staff creates one real intent per component under this SAME discovery, never a fake bundled type.", operatorGuidanceEs: "Tipos de proyecto reales con nombre — el personal crea una intención real por componente bajo este mismo descubrimiento, nunca un tipo empaquetado falso.",
    clientQuestionEn: "Which projects does this launch need (website, logo, business cards, campaign, etc.)?", clientQuestionEs: "¿Qué proyectos necesita este lanzamiento (sitio web, logo, tarjetas, campaña, etc.)?",
    valueType: "list", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "launch_package_priority_order", section: "coordination",
    labelEn: "Priority / sequencing between components", labelEs: "Prioridad / secuencia entre componentes",
    operatorGuidanceEn: "Real dependency/priority information — feeds the EXISTING intent-dependency mechanism, never a second dependency system.", operatorGuidanceEs: "Información real de dependencia/prioridad — alimenta el mecanismo de dependencia de intención ya existente.",
    clientQuestionEn: "Does one of these need to finish before another can start?", clientQuestionEs: "¿Alguno de estos necesita terminar antes de que otro pueda empezar?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 2, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "launch_package_shared_deadline", section: "coordination",
    labelEn: "Shared launch deadline", labelEs: "Fecha límite de lanzamiento compartida",
    operatorGuidanceEn: "A real target date/event driving the whole package, if one exists.", operatorGuidanceEs: "Una fecha/evento real que impulsa todo el paquete, si existe.",
    clientQuestionEn: "Is there a single date or event this whole launch is built around?", clientQuestionEs: "¿Hay una sola fecha o evento en torno al cual se construye todo este lanzamiento?",
    valueType: "text", defaultCompletenessClass: "helpful", whoShouldAnswer: "CLIENT",
    priority: 3, mayBlockBuild: false, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
  {
    fieldKey: "decision_maker_approver", section: "approval",
    labelEn: "Approver", labelEs: "Persona que aprueba",
    operatorGuidanceEn: "Shared with every other family's approval section.", operatorGuidanceEs: "Compartido con la sección de aprobación de cada otra familia.",
    clientQuestionEn: "Who will give final approval across this launch package?", clientQuestionEs: "¿Quién dará la aprobación final de este paquete de lanzamiento?",
    valueType: "text", defaultCompletenessClass: "required_before_build", whoShouldAnswer: "CLIENT",
    priority: 1, mayBlockBuild: true, mayBlockLaunch: false, canonicalTruthMaySatisfy: false, recommendReconfirmation: false,
  },
];
